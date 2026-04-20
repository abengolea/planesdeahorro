import 'server-only';

const RETRYABLE_HTTP_CODES = new Set([429, 502, 503]);
const RETRYABLE_STATUSES = new Set(['UNAVAILABLE', 'RESOURCE_EXHAUSTED']);

function isRetryableLlmError(err: unknown): boolean {
  if (err == null || typeof err !== 'object') return false;
  const o = err as Record<string, unknown>;
  if (typeof o.code === 'number' && RETRYABLE_HTTP_CODES.has(o.code)) return true;
  if (typeof o.status === 'string' && RETRYABLE_STATUSES.has(o.status)) return true;
  const msg = String(o.message ?? o.originalMessage ?? err);
  if (
    /503|429|502|UNAVAILABLE|RESOURCE_EXHAUSTED|high demand|overloaded|try again later|temporarily|rate limit/i.test(
      msg
    )
  ) {
    return true;
  }
  return false;
}

/**
 * Reintenta llamadas al LLM ante saturación o errores transitorios de red/API.
 */
export async function withLlmRetry<T>(
  fn: () => Promise<T>,
  options?: { maxAttempts?: number; label?: string }
): Promise<T> {
  const maxAttempts = options?.maxAttempts ?? 4;
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (!isRetryableLlmError(e) || attempt === maxAttempts) throw e;
      const delayMs = Math.min(2000 * 2 ** (attempt - 1), 20000);
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `[llm-retry] ${options?.label ?? 'LLM'} intento ${attempt}/${maxAttempts} falló, reintento en ${delayMs}ms…`
        );
      }
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastError;
}

/** Mensaje legible para toasts cuando falla una acción de IA. */
export function userFacingAiErrorMessage(err: unknown, fallback: string): string {
  if (err == null || typeof err !== 'object') return fallback;
  const o = err as Record<string, unknown>;
  const code = typeof o.code === 'number' ? o.code : undefined;
  const status = typeof o.status === 'string' ? o.status : undefined;
  const msg = String(o.message ?? o.originalMessage ?? '');
  if (code === 503 || status === 'UNAVAILABLE' || /high demand|503|temporarily unavailable/i.test(msg)) {
    return 'El servicio de IA (Gemini) está saturado o no disponible por unos minutos. Volvé a intentar en breve o pegá el texto del fallo a mano.';
  }
  if (code === 429 || status === 'RESOURCE_EXHAUSTED' || /429|rate limit|cuota|quota/i.test(msg)) {
    return 'Se alcanzó el límite de uso del modelo de IA. Probá más tarde o usá otro proveedor (p. ej. OpenAI) si lo tenés configurado.';
  }
  return fallback;
}
