/**
 * Mensaje inicial del flujo de evaluación (web y WhatsApp vía NotificasHub).
 */
export const CASE_EVAL_INITIAL_ASSISTANT_CONTENT =
  'Hola, soy el asistente virtual del estudio del Dr. Adrián Bengolea. Atendemos consultas de residentes en la Provincia de Buenos Aires. Contame brevemente cuál es el problema que tenés con tu plan de ahorro.';

export const CASE_EVAL_INITIAL_QUICK_REPLIES = [
  'Liquidación o haberes netos',
  'Rescisión del plan',
  'Secuestro del vehículo',
  'Devolución de fondos',
  'Cláusulas abusivas',
  'Otro',
] as const;
