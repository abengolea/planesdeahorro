'use server';

import { FieldValue } from 'firebase-admin/firestore';
import { getAdminFirestore, requireAdminSession } from '@/firebase/admin';
import { type CaseEvaluationStatus, isCaseEvaluationStatus } from '@/lib/case-evaluation-status';
import { sendClientCaseUpdateEmail, type ClientCaseEmailKind } from '@/lib/send-email';

export type ResolveCaseEvaluationResult =
  | { ok: true; emailSent: boolean; emailSkippedReason?: string }
  | { ok: false; error: string };

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

  let emailSent = false;
  let emailSkippedReason: string | undefined;

  if (input.sendEmailToClient && emailKind) {
    const to = (data.email ?? '').trim();
    if (!to) {
      emailSkippedReason = 'El caso no tiene email del cliente.';
    } else {
      const sendResult = await sendClientCaseUpdateEmail({
        to,
        nombre: data.nombre ?? '',
        kind: emailKind,
        messageFromAdmin: trimmedClient || undefined,
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
