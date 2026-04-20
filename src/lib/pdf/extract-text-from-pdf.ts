import 'server-only';

import { InvalidPDFException, PasswordException, PDFParse } from 'pdf-parse';

/** Límite alineado con `serverActions.bodySizeLimit` en next.config. */
export const MAX_PDF_BYTES = 12 * 1024 * 1024;

export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return (result.text ?? '').replace(/\u0000/g, '').trim();
  } finally {
    await parser.destroy();
  }
}

export function classifyPdfError(err: unknown): string {
  if (err instanceof PasswordException) {
    return 'El PDF está protegido con contraseña. Subí una versión sin contraseña o desbloqueala antes.';
  }
  if (err instanceof InvalidPDFException) {
    return 'No se pudo leer el archivo como PDF válido. Comprobá que no esté dañado.';
  }
  if (err instanceof Error && /password|encrypt/i.test(err.message)) {
    return 'El PDF parece estar protegido. Probá con otra copia del documento.';
  }
  return 'No se pudo extraer texto del PDF. Probá con otro archivo o copiá el texto manualmente.';
}
