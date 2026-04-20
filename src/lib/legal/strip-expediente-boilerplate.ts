/**
 * Recorta encabezados típicos de PDFs judiciales argentinos (SCBA, expediente digital):
 * "Datos del Expediente", receptoría, notificaciones, etc., hasta donde empieza el cuerpo del fallo.
 */

const COPY_PASTE_LINE =
  /-------\s*Para copiar y pegar el texto seleccione[^\n]*-------\s*\n?/im;

/** Inicio habitual del proveído / sentencia. */
const ANCHORS: RegExp[] = [
  /\bAUTOS\s+Y\s+VISTOS\b/i,
  /\bVISTO\s+EL\s+(?:EXPEDIENTE|PRESENTE|ACTUADO)\b/i,
  /\bVISTO\s+EL\s+EXPEDIENTE\s+CARATULADO\b/i,
  /\bEN\s+AUTOS\s+CARATULADOS\b/i,
];

/** Ciudad + coma (inicio de acto: "SAN NICOLAS, en la fecha..."). */
const CITY_OPENING = new RegExp(
  String.raw`\b(?:SAN\s+Nicol[áa]s|BUENOS\s+AIRES|LA\s+PLATA|MAR\s+DEL\s+PLATA|ROSARIO|CORDOBA|CÓRDOBA|SANTA\s+FE|MENDOZA|TUCUMAN|TUCUMÁN|SALTA|PARAN[ÁA]|BAH[ÍI]A\s+BLANCA)\s*,`,
  'i',
);

/**
 * Devuelve el texto a partir del primer ancla reconocida; si no hay, el texto sin la línea
 * "copiar y pegar" del sistema; si nada aplica, el original normalizado.
 */
export function stripExpedienteBoilerplateFromText(raw: string): string {
  const normalized = raw.replace(/\r\n/g, '\n').replace(/\u00a0/g, ' ').trim();
  if (normalized.length < 80) return normalized;

  let t = normalized.replace(COPY_PASTE_LINE, '\n').trim();
  if (t.length < 80) {
    t = normalized;
  }

  const positions: number[] = [];

  for (const re of ANCHORS) {
    const m = t.match(re);
    if (m && m.index !== undefined && m.index > 0) {
      positions.push(m.index);
    }
  }

  const cityIdx = t.search(CITY_OPENING);
  if (cityIdx > 0) {
    positions.push(cityIdx);
  }

  const considerandoIdx = t.search(/\bCONSIDERANDO\s*:/i);
  if (considerandoIdx > 400 && considerandoIdx < 20000) {
    positions.push(considerandoIdx);
  }

  if (positions.length === 0) {
    return t;
  }

  const start = Math.min(...positions);
  const sliced = t.slice(start).trim();
  if (sliced.length < 80) {
    return t;
  }
  return sliced;
}
