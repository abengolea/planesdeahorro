import 'server-only';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// Debugging: Confirma que la variable de entorno está siendo leída en el runtime.
console.log('GEMINI_API_KEY loaded in runtime?', !!process.env.GEMINI_API_KEY);

export const ai = genkit({
  plugins: [
    // Se pasa explícitamente la API key para asegurar la autenticación correcta.
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
  // CORRECCIÓN: Se usa el helper `googleAI.model()` para definir el modelo por defecto.
  // Esto asegura que Genkit utilice la instancia del plugin configurado (con su API key y versión de API correcta, v1).
  model: googleAI.model('gemini-2.5-flash'),
});
