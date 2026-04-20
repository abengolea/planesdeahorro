'use server';

import { getAdminFirestore, requireAdminSession } from '@/firebase/admin';
import {
  draftAcceptCaseClientMessage,
  type DraftAcceptCaseClientMessageInput,
} from '@/ai/flows/draft-accept-case-client-message-flow';
import type { CaseEvaluation } from '@/lib/types';

export type DraftAcceptCaseMessageResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function stringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string');
}

function urgencia(v: unknown): 'alta' | 'media' | 'baja' {
  if (v === 'alta' || v === 'media' || v === 'baja') return v;
  return 'media';
}

function caseDocToDraftInput(data: Record<string, unknown>): DraftAcceptCaseClientMessageInput {
  return {
    nombre: str(data.nombre) || '—',
    ciudad: str(data.ciudad) || '—',
    provincia: str(data.provincia) || '—',
    administradora: str(data.administradora) || '—',
    estadoPlan: str(data.estadoPlan) || '—',
    adjudicado: str(data.adjudicado) || '—',
    vehiculoRecibido: str(data.vehiculoRecibido) || '—',
    grupoOrden: str(data.grupoOrden) || '—',
    problemaPrincipal: str(data.problemaPrincipal) || '—',
    resumenHechos: str(data.resumenHechos) || '—',
    documentacionDisponible:
      stringArray(data.documentacionDisponible).join(', ') || 'No indicó documentación concreta.',
    urgencia: urgencia(data.urgencia),
    motivoUrgencia: str(data.motivoUrgencia) || '—',
    posibleCategoriaJuridica: str(data.posibleCategoriaJuridica) || '—',
    proximaAccionSugerida: str(data.proximaAccionSugerida) || '—',
  };
}

/**
 * Genera un borrador de mensaje al cliente para el flujo "aceptar caso" (solo admin).
 */
export async function draftAcceptCaseMessageForEvaluation(
  idToken: string,
  evaluationId: string,
): Promise<DraftAcceptCaseMessageResult> {
  if (!evaluationId?.trim()) {
    return { ok: false, error: 'Falta el identificador del caso.' };
  }

  try {
    await requireAdminSession(idToken);
  } catch {
    return { ok: false, error: 'Sesión inválida o sin permisos de administrador.' };
  }

  const db = getAdminFirestore();
  const snap = await db.collection('case_evaluations').doc(evaluationId).get();
  if (!snap.exists) {
    return { ok: false, error: 'No se encontró la evaluación.' };
  }

  const data = snap.data() as Record<string, unknown> & Partial<CaseEvaluation>;

  try {
    const message = await draftAcceptCaseClientMessage(caseDocToDraftInput(data));
    return { ok: true, message };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'No se pudo generar el borrador.';
    return { ok: false, error: msg };
  }
}
