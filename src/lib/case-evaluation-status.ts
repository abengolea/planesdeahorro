/** Valores almacenados en Firestore (`case_evaluations.status`). */
export const CASE_EVALUATION_STATUSES = [
  'pendiente de revisión',
  'en análisis',
  'aceptado',
  'rechazado',
  'derivado',
  'cerrado',
] as const;

export type CaseEvaluationStatus = (typeof CASE_EVALUATION_STATUSES)[number];

export const CASE_EVALUATION_STATUS_LABELS: Record<CaseEvaluationStatus, string> = {
  'pendiente de revisión': 'Pendiente de revisión',
  'en análisis': 'En análisis',
  aceptado: 'Aceptado',
  rechazado: 'Rechazado',
  derivado: 'Derivado',
  cerrado: 'Cerrado',
};

export function isCaseEvaluationStatus(value: string): value is CaseEvaluationStatus {
  return (CASE_EVALUATION_STATUSES as readonly string[]).includes(value);
}

/** Para mostrar en UI; si llega un valor legacy, se devuelve tal cual. */
export function formatCaseEvaluationStatus(status: string | undefined): string {
  if (!status) return '—';
  if (isCaseEvaluationStatus(status)) return CASE_EVALUATION_STATUS_LABELS[status];
  return status;
}

export function isTerminalCaseStatus(status: CaseEvaluationStatus): boolean {
  return status === 'aceptado' || status === 'rechazado' || status === 'derivado' || status === 'cerrado';
}
