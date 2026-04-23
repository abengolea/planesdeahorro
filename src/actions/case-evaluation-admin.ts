'use server';

import { FieldValue } from 'firebase-admin/firestore';
import { getAdminFirestore, requireAdminSession } from '@/firebase/admin';
import { type CaseEvaluationStatus, isCaseEvaluationStatus } from '@/lib/case-evaluation-status';
import { signClientPortalInvite } from '@/lib/client-portal-token';
import { getPublicAppUrl } from '@/lib/public-app-url';
import { sendClientCaseUpdateEmail, type ClientCaseEmailKind } from '@/lib/send-email';

export type ResolveCaseEvaluationResult =
  | { ok: true; emailSent: boolean; emailSkippedReason?: string }
  | { ok: false; error: string };

export type SimpleAdminResult = { ok: true } | { ok: false; error: string };

const URGENCIA_VALUES = ['alta', 'media', 'baja'] as const;

/** Campos editables del formulario admin (misma forma que `CaseEvaluation`). */
export type CaseEvaluationEditablePayload = {
  nombre: string;
  whatsapp: string;
  email: string;
  ciudad: string;
  provincia: string;
  administradora: string;
  estadoPlan: string;
  adjudicado: string;
  vehiculoRecibido: string;
  grupoOrden: string;
  problemaPrincipal: string;
  resumenHechos: string;
  documentacionDisponible: string[];
  urgencia: string;
  motivoUrgencia: string;
  posibleCategoriaJuridica: string;
  proximaAccionSugerida: string;
};

function normalizeDocList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => String(x).trim()).filter(Boolean);
}

const STATUS_TO_EMAIL_KIND: Partial<Record<CaseEvaluationStatus, ClientCaseEmailKind>> = {
  'en análisis': 'en_analisis',
  aceptado: 'aceptado',
  rechazado: 'rechazado',
  derivado: 'derivado',
  cerrado: 'cerrado',
};

function validateStatus(status: string): status is CaseEvaluationStatus {
  return isCaseEvaluationStatus(status);
}

/**
 * Actualiza el estado de una evaluación (solo admin) y opcionalmente envía correo al cliente.
 */
export async function resolveCaseEvaluation(
  idToken: string,
  evaluationId: string,
  input: {
    status: CaseEvaluationStatus;
    sendEmailToClient: boolean;
    /** Texto plano: próximos pasos (aceptado), motivo (rechazado / derivado), nota (cerrado / en análisis). */
    clientMessage?: string;
    /** Nota solo para el panel / historial interno. */
    internalNote?: string;
  },
): Promise<ResolveCaseEvaluationResult> {
  if (!evaluationId?.trim()) {
    return { ok: false, error: 'Falta el identificador del caso.' };
  }

  if (!validateStatus(input.status)) {
    return { ok: false, error: 'Estado no válido.' };
  }

  const trimmedClient = input.clientMessage?.trim() ?? '';
  const trimmedInternal = input.internalNote?.trim() ?? '';

  if (input.status === 'rechazado' || input.status === 'derivado') {
    if (!trimmedClient) {
      return { ok: false, error: 'Para rechazar o derivar debés escribir un mensaje para el cliente.' };
    }
  }

  let admin: { uid: string; email: string | null };
  try {
    admin = await requireAdminSession(idToken);
  } catch {
    return { ok: false, error: 'Sesión inválida o sin permisos de administrador.' };
  }

  const db = getAdminFirestore();
  const ref = db.collection('case_evaluations').doc(evaluationId);
  const snap = await ref.get();
  if (!snap.exists) {
    return { ok: false, error: 'No se encontró la evaluación.' };
  }

  const data = snap.data() as { email?: string; nombre?: string };

  const emailKind = STATUS_TO_EMAIL_KIND[input.status];

  const update: Record<string, unknown> = {
    status: input.status,
    statusUpdatedAt: FieldValue.serverTimestamp(),
    statusUpdatedByUid: admin.uid,
    statusUpdatedByEmail: admin.email ?? null,
  };

  if (trimmedInternal) {
    update.adminInternalNote = trimmedInternal;
  }

  await ref.update(update);

  const movementLines = [`Estado: ${input.status}.`];
  if (trimmedClient) movementLines.push(trimmedClient);
  await ref.collection('expediente_movimientos').add({
    createdAt: FieldValue.serverTimestamp(),
    tipo: 'sistema',
    titulo: 'Actualización del expediente',
    detalle: movementLines.join('\n\n'),
  });

  let emailSent = false;
  let emailSkippedReason: string | undefined;

  if (input.sendEmailToClient && emailKind) {
    const to = (data.email ?? '').trim();
    if (!to) {
      emailSkippedReason = 'El caso no tiene email del cliente.';
    } else {
      let portalActivationUrl: string | undefined;
      if (input.status === 'aceptado') {
        const token = signClientPortalInvite(evaluationId);
        if (token) {
          portalActivationUrl = `${getPublicAppUrl()}/mi-caso/activar?t=${encodeURIComponent(token)}`;
        }
      }

      const sendResult = await sendClientCaseUpdateEmail({
        to,
        nombre: data.nombre ?? '',
        kind: emailKind,
        messageFromAdmin: trimmedClient || undefined,
        ...(portalActivationUrl ? { portalActivationUrl } : {}),
      });
      if (sendResult.success) {
        emailSent = true;
        await ref.update({
          lastClientNotifiedAt: FieldValue.serverTimestamp(),
          lastClientNotifiedKind: emailKind,
        });
      } else {
        emailSkippedReason = sendResult.error ?? 'No se pudo enviar el correo.';
      }
    }
  } else if (input.sendEmailToClient && !emailKind) {
    emailSkippedReason = 'Este estado no tiene plantilla de correo al cliente.';
  }

  return {
    ok: true,
    emailSent,
    ...(emailSkippedReason ? { emailSkippedReason } : {}),
  };
}

/**
 * Actualiza los datos del caso (sin cambiar estado ni enviar mails).
 */
export async function updateCaseEvaluationData(
  idToken: string,
  evaluationId: string,
  data: CaseEvaluationEditablePayload,
): Promise<SimpleAdminResult> {
  if (!evaluationId?.trim()) {
    return { ok: false, error: 'Falta el identificador del caso.' };
  }

  const u = (data.urgencia ?? '').trim().toLowerCase();
  if (!URGENCIA_VALUES.includes(u as (typeof URGENCIA_VALUES)[number])) {
    return { ok: false, error: 'Urgencia no válida (alta, media o baja).' };
  }

  let admin: { uid: string; email: string | null };
  try {
    admin = await requireAdminSession(idToken);
  } catch {
    return { ok: false, error: 'Sesión inválida o sin permisos de administrador.' };
  }

  const db = getAdminFirestore();
  const ref = db.collection('case_evaluations').doc(evaluationId);
  const snap = await ref.get();
  if (!snap.exists) {
    return { ok: false, error: 'No se encontró la evaluación.' };
  }

  const docs = normalizeDocList(data.documentacionDisponible);

  await ref.update({
    nombre: data.nombre.trim(),
    whatsapp: data.whatsapp.trim(),
    email: data.email.trim(),
    ciudad: data.ciudad.trim(),
    provincia: data.provincia.trim(),
    administradora: data.administradora.trim(),
    estadoPlan: data.estadoPlan.trim(),
    adjudicado: data.adjudicado.trim(),
    vehiculoRecibido: data.vehiculoRecibido.trim(),
    grupoOrden: data.grupoOrden.trim(),
    problemaPrincipal: data.problemaPrincipal.trim(),
    resumenHechos: data.resumenHechos.trim(),
    documentacionDisponible: docs,
    urgencia: u as (typeof URGENCIA_VALUES)[number],
    motivoUrgencia: data.motivoUrgencia.trim(),
    posibleCategoriaJuridica: data.posibleCategoriaJuridica.trim(),
    proximaAccionSugerida: data.proximaAccionSugerida.trim(),
    dataUpdatedAt: FieldValue.serverTimestamp(),
    dataUpdatedByUid: admin.uid,
    dataUpdatedByEmail: admin.email ?? null,
  });

  return { ok: true };
}

export async function setCaseEvaluationArchived(
  idToken: string,
  evaluationId: string,
  archived: boolean,
): Promise<SimpleAdminResult> {
  if (!evaluationId?.trim()) {
    return { ok: false, error: 'Falta el identificador del caso.' };
  }

  let admin: { uid: string; email: string | null };
  try {
    admin = await requireAdminSession(idToken);
  } catch {
    return { ok: false, error: 'Sesión inválida o sin permisos de administrador.' };
  }

  const db = getAdminFirestore();
  const ref = db.collection('case_evaluations').doc(evaluationId);
  const snap = await ref.get();
  if (!snap.exists) {
    return { ok: false, error: 'No se encontró la evaluación.' };
  }

  if (archived) {
    await ref.update({
      archived: true,
      archivedAt: FieldValue.serverTimestamp(),
      archivedByUid: admin.uid,
      archivedByEmail: admin.email ?? null,
    });
  } else {
    await ref.update({
      archived: false,
      archivedAt: FieldValue.delete(),
      archivedByUid: FieldValue.delete(),
      archivedByEmail: FieldValue.delete(),
    });
  }

  return { ok: true };
}

export async function deleteCaseEvaluation(
  idToken: string,
  evaluationId: string,
): Promise<SimpleAdminResult> {
  if (!evaluationId?.trim()) {
    return { ok: false, error: 'Falta el identificador del caso.' };
  }

  try {
    await requireAdminSession(idToken);
  } catch {
    return { ok: false, error: 'Sesión inválida o sin permisos de administrador.' };
  }

  const db = getAdminFirestore();
  const ref = db.collection('case_evaluations').doc(evaluationId);
  const snap = await ref.get();
  if (!snap.exists) {
    return { ok: false, error: 'No se encontró la evaluación.' };
  }

  await ref.delete();
  return { ok: true };
}

/** Marca la evaluación como vista en el admin (apaga el indicador y la campanita). */
export async function markCaseEvaluationViewed(
  idToken: string,
  evaluationId: string,
): Promise<SimpleAdminResult> {
  if (!evaluationId?.trim()) {
    return { ok: false, error: 'Falta el identificador del caso.' };
  }

  let admin: { uid: string; email: string | null };
  try {
    admin = await requireAdminSession(idToken);
  } catch {
    return { ok: false, error: 'Sesión inválida o sin permisos de administrador.' };
  }

  const db = getAdminFirestore();
  const ref = db.collection('case_evaluations').doc(evaluationId);
  const snap = await ref.get();
  if (!snap.exists) {
    return { ok: false, error: 'No se encontró la evaluación.' };
  }

  const data = snap.data() as { newForAdmin?: boolean };
  if (data.newForAdmin === false) {
    return { ok: true };
  }

  await ref.update({
    newForAdmin: false,
    adminViewedAt: FieldValue.serverTimestamp(),
    adminViewedByUid: admin.uid,
    adminViewedByEmail: admin.email ?? null,
  });

  return { ok: true };
}
