/**
 * Heurística para sugerir carátula si la IA dejó el título vacío: línea con C/ y S/ al inicio del texto.
 */
export function suggestCaratulaFromPlaintext(text: string): string | undefined {
  if (!text || text.length < 20) return undefined;
  const head = text.slice(0, 25_000);
  const lines = head
    .split('\n')
    .map((l) => l.trim().replace(/\s+/g, ' '))
    .filter((l) => l.length > 0);

  for (const line of lines) {
    if (line.length < 15 || line.length > 450) continue;
    if (/\bC\//.test(line) && /\bS\//.test(line)) {
      return line.toLocaleUpperCase('es-AR');
    }
  }
  return undefined;
}

export function normalizePdfRawText(raw: string): string {
  return raw.replace(/\r\n/g, '\n').replace(/\u00a0/g, ' ').trim();
}
