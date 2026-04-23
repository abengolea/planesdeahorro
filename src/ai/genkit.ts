import 'server-only';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { openAI } from '@genkit-ai/compat-oai/openai';

const googleApiKey =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  process.env.GOOGLE_GENAI_API_KEY;

const openaiApiKey = process.env.OPENAI_API_KEY?.trim() || undefined;

const plugins = [];
if (openaiApiKey) {
  plugins.push(openAI({ apiKey: openaiApiKey }));
}
if (googleApiKey) {
  plugins.push(googleAI({ apiKey: googleApiKey }));
}
if (plugins.length === 0) {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      '[genkit] No hay OPENAI_API_KEY ni GEMINI/GOOGLE_API_KEY. Definí al menos una en `.env.local`.',
    );
  } else {
    console.error(
      '[genkit] Sin clave de IA en runtime: definí GEMINI_API_KEY (o GOOGLE_API_KEY) u OPENAI_API_KEY en App Hosting / Cloud Run. Ver `apphosting.yaml`.',
    );
  }
  plugins.push(openAI());
  plugins.push(googleAI());
}

const hasGoogleKey = Boolean(googleApiKey);
/**
 * Modelo por defecto del `ai` global: con clave Gemini se usa Google; OpenAI solo si no hay clave Google
 * o si `LLM_PROVIDER=openai` (misma regla que `useOpenAiAsPrimaryLlm` en `llm-fallback.ts`).
 */
const useOpenAI =
  Boolean(openaiApiKey) &&
  (!hasGoogleKey || process.env.LLM_PROVIDER?.trim().toLowerCase() === 'openai');

const openaiModelId = process.env.OPENAI_MODEL || 'gpt-4o-mini';
/** `gemini-2.0-flash` dejó de estar disponible para cuentas/claves nuevas en la API pública. Override: `GEMINI_MODEL`. */
const geminiModelId = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const defaultModel = useOpenAI
  ? openAI.model(openaiModelId)
  : googleAI.model(geminiModelId);

if (process.env.NODE_ENV === 'development') {
  if (useOpenAI) {
    console.info('[genkit] Modelo por defecto: OpenAI (%s)', openaiModelId);
  } else {
    console.info('[genkit] Modelo por defecto: Google (%s)', geminiModelId);
  }
}

export const ai = genkit({
  plugins,
  model: defaultModel,
});
