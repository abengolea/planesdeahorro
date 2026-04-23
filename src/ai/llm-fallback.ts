import 'server-only';
import { withLlmRetry } from '@/ai/llm-retry';
import { googleAI } from '@genkit-ai/google-genai';
import { openAI } from '@genkit-ai/compat-oai/openai';

/**
 * Variables de entorno relevantes (mismo criterio que `src/ai/genkit.ts`):
 * - `GEMINI_MODEL`, `GEMINI_MODEL_FALLBACKS` (lista separada por comas)
 * - `OPENAI_MODEL`, `OPENAI_MODEL_FALLBACKS`
 * - Con ambas claves, el principal es **Gemini**; `LLM_PROVIDER=openai` prioriza OpenAI.
 * - `LLM_CROSS_PROVIDER_FALLBACK`: si no se define, queda activo solo cuando hay
 *   clave de Google (Gemini) y de OpenAI a la vez; `0`/`false` lo desactiva;
 *   `1`/`true` lo fuerza (requiere ambas claves para tener efecto).
 */

/** Referencia de modelo para `definePrompt(...)(input, { model })`. */
export type LlmModelOption = ReturnType<typeof googleAI.model> | ReturnType<typeof openAI.model>;

function hasGoogleAiKey(): boolean {
  return Boolean(
    process.env.GEMINI_API_KEY?.trim() ||
      process.env.GOOGLE_API_KEY?.trim() ||
      process.env.GOOGLE_GENAI_API_KEY?.trim(),
  );
}

function hasOpenAiKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

/**
 * Respaldo Google ↔ OpenAI tras agotar la cadena del proveedor principal.
 * Por defecto: encendido si ambas API keys están configuradas (evita quedar
 * bloqueado por 503 en Gemini). Desactivar: `LLM_CROSS_PROVIDER_FALLBACK=0`.
 */
export function isCrossProviderFallbackEnabled(): boolean {
  const v = process.env.LLM_CROSS_PROVIDER_FALLBACK?.trim().toLowerCase();
  if (v === '0' || v === 'false' || v === 'no' || v === 'off') return false;
  if (v === '1' || v === 'true' || v === 'yes' || v === 'on') {
    return hasGoogleAiKey() && hasOpenAiKey();
  }
  return hasGoogleAiKey() && hasOpenAiKey();
}

/**
 * Pool por defecto (sin `GEMINI_MODEL_FALLBACKS`): se usa `primary` primero y luego el resto en este orden.
 * Incluye variantes recientes y 1.5 ante 503 o modelos retirados.
 */
const DEFAULT_GEMINI_FALLBACKS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-1.5-flash',
];
const DEFAULT_OPENAI_FALLBACKS = ['gpt-4o', 'gpt-4o-mini'];

function resolveModelIdChain(
  primary: string,
  envFallbacks: string | undefined,
  defaultsExcludingPrimary: string[],
): string[] {
  const tail = envFallbacks
    ? envFallbacks
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : defaultsExcludingPrimary.filter((id) => id !== primary);
  const chain = [primary, ...tail];
  const seen = new Set<string>();
  return chain.filter((id) => (seen.has(id) ? false : !!seen.add(id)));
}

export function isTransientModelError(err: unknown): boolean {
  if (typeof err === 'object' && err !== null) {
    const o = err as Record<string, unknown>;
    const status = o.status;
    if (
      status === 'UNAVAILABLE' ||
      status === 'RESOURCE_EXHAUSTED' ||
      status === 'DEADLINE_EXCEEDED'
    ) {
      return true;
    }
    const code = o.code;
    if (code === 503 || code === 429) return true;
  }
  const msg = err instanceof Error ? err.message : String(err);
  return /503|429|UNAVAILABLE|RESOURCE_EXHAUSTED|high demand|overloaded|try again later|rate limit|temporarily/i.test(
    msg,
  );
}

/** Error de modelo inexistente o retirado para esta clave (p. ej. 404 en generateContent). */
export function isModelUnavailableOrRetiredError(err: unknown): boolean {
  const msg =
    typeof err === 'object' && err !== null
      ? String(
          (err as Record<string, unknown>).originalMessage ??
            (err instanceof Error ? err.message : ''),
        )
      : err instanceof Error
        ? err.message
        : String(err);
  return /\[404 Not Found\]|404 Not Found|no longer available|not available to new users|MODEL_NOT_FOUND|not found.*model/i.test(
    msg,
  );
}

export function googleModelChain(): ReturnType<typeof googleAI.model>[] {
  const primary = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';
  const ids = resolveModelIdChain(
    primary,
    process.env.GEMINI_MODEL_FALLBACKS?.trim(),
    DEFAULT_GEMINI_FALLBACKS,
  );
  return ids.map((id) => googleAI.model(id));
}

export function openaiModelChain(): ReturnType<typeof openAI.model>[] {
  const primary = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';
  const ids = resolveModelIdChain(
    primary,
    process.env.OPENAI_MODEL_FALLBACKS?.trim(),
    DEFAULT_OPENAI_FALLBACKS,
  );
  return ids.map((id) => openAI.model(id));
}

/** OpenAI como primer modelo solo si no hay clave Gemini o si `LLM_PROVIDER=openai`. */
export function useOpenAiAsPrimaryLlm(): boolean {
  if (!hasOpenAiKey()) return false;
  if (!hasGoogleAiKey()) return true;
  return process.env.LLM_PROVIDER?.trim().toLowerCase() === 'openai';
}

function buildFullModelChainForPrompt(): { models: LlmModelOption[]; primaryLen: number } {
  const primary = useOpenAiAsPrimaryLlm() ? openaiModelChain() : googleModelChain();
  const primaryLen = primary.length;
  if (!isCrossProviderFallbackEnabled()) {
    return { models: primary, primaryLen };
  }

  const secondary = useOpenAiAsPrimaryLlm()
    ? hasGoogleAiKey()
      ? googleModelChain()
      : []
    : hasOpenAiKey()
      ? openaiModelChain()
      : [];

  if (secondary.length === 0) {
    return { models: primary, primaryLen };
  }
  return { models: [...primary, ...secondary], primaryLen };
}

/**
 * Ejecuta un prompt Genkit probando modelos en cadena ante fallos transitorios (503, saturación, etc.).
 * Por cada modelo aplica `withLlmRetry` (reintentos con backoff en el mismo modelo).
 */
export async function runPromptWithModelFallback<TOut>(
  run: (model: LlmModelOption) => Promise<{ output?: TOut | null }>,
  options: { label: string; maxAttemptsPerModel?: number },
): Promise<{ output?: TOut | null }> {
  const { models, primaryLen } = buildFullModelChainForPrompt();
  const maxAttemptsPerModel = options.maxAttemptsPerModel ?? 3;
  let lastErr: unknown;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      if (i === primaryLen && models.length > primaryLen) {
        console.warn(
          '[%s] Cadena del proveedor principal agotada; probando proveedor alternativo.',
          options.label,
        );
      }
      const result = await withLlmRetry(() => run(model), {
        label: `${options.label}[m${i}]`,
        maxAttempts: maxAttemptsPerModel,
      });
      if (i > 0) {
        console.warn(
          '[%s] Se usó un modelo de respaldo (índice %s) tras errores transitorios.',
          options.label,
          i,
        );
      }
      return result;
    } catch (err) {
      lastErr = err;
      const canTryNext =
        i < models.length - 1 &&
        (isTransientModelError(err) || isModelUnavailableOrRetiredError(err));
      if (canTryNext) {
        console.warn('[%s] Fallo transitorio; probando el siguiente modelo.', options.label, err);
        continue;
      }
      throw err;
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}
