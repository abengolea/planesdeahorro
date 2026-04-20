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
  }
  plugins.push(openAI());
  plugins.push(googleAI());
}

/** Con clave de OpenAI y sin `LLM_PROVIDER=google`, usamos OpenAI (útil si Gemini tiene cuota/facturación bloqueada). */
const useOpenAI = Boolean(openaiApiKey) && process.env.LLM_PROVIDER !== 'google';

const openaiModelId = process.env.OPENAI_MODEL || 'gpt-4o-mini';
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
