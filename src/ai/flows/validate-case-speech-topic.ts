import 'server-only';

import { ai } from '@/ai/genkit';
import { runPromptWithModelFallback } from '@/ai/llm-fallback';
import { z } from 'zod';

const InputSchema = z.object({
  text: z.string().describe('Texto dictado o transcrito por el usuario.'),
});

const OutputSchema = z.object({
  onTopic: z
    .boolean()
    .describe(
      'true solo si el texto trata de forma sustancial sobre planes de ahorro automotor (Argentina), administradora, cuotas, mora, rescisión, liquidación de haberes, adjudicación, ejecución prendaria o secuestro, cláusulas del contrato, devolución de fondos, seguros del plan, o situación análoga vinculada a ese producto.',
    ),
});

const validateCaseSpeechTopicPrompt = ai.definePrompt({
  name: 'validateCaseSpeechTopicPrompt',
  input: { schema: InputSchema },
  output: { schema: OutputSchema },
  system: `Sos un filtro de contenido para un formulario de "evaluar caso" exclusivo de **planes de ahorro automotor** (Ley 24.240, administradoras, etc.).

Devolvé onTopic: **true** solo si el texto del usuario está **claramente** relacionado con un plan de ahorro, la empresa administradora, el contrato/cuotas, el vehículo en el marco del plan, rescisión, cobros indebidos en ese contexto, etc.

Devolvé onTopic: **false** si:
- El tema es otro (trabajo, familia, salud, política, programación, chistes, recetas, etc.).
- Solo pide "un abogado" o ayuda legal **sin** mencionar plan de ahorro, cuotas, administradora o situación vinculada.
- Es spam, prueba, texto sin sentido, o demasiado corto/vago como para saber que es sobre planes de ahorro.

Si hay duda razonable, preferí **false** (más seguro).`,
  prompt: `Texto dictado:\n"""{{{text}}}"""`,
});

export async function validateCaseSpeechTopicWithLlm(text: string): Promise<boolean> {
  const trimmed = text.trim();
  if (trimmed.length < 8) {
    return false;
  }

  const { output } = await runPromptWithModelFallback(
    (model) => validateCaseSpeechTopicPrompt({ text: trimmed }, { model }),
    { label: 'validateCaseSpeechTopic' },
  );

  return output?.onTopic === true;
}
