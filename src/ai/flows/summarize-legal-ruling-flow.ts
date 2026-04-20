import 'server-only';
/**
 * @fileOverview This file defines a Genkit flow for summarizing legal rulings.
 *
 * - summarizeLegalRuling - A function that handles the legal ruling summarization process.
 * - SummarizeLegalRulingInput - The input type for the summarizeLegalRuling function.
 * - SummarizeLegalRulingOutput - The return type for the summarizeLegalRuling function.
 */

import { ai } from '@/ai/genkit';
import { withLlmRetry } from '@/ai/llm-retry';
import { stripExpedienteBoilerplateFromText } from '@/lib/legal/strip-expediente-boilerplate';
import { z } from 'genkit';

const SummarizeLegalRulingInputSchema = z.object({
  rulingText: z.string().describe('The full text of the legal ruling to be summarized.'),
});
export type SummarizeLegalRulingInput = z.infer<typeof SummarizeLegalRulingInputSchema>;

const SummarizeLegalRulingOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the legal ruling.'),
  tags: z.array(z.string()).describe('A list of relevant keywords or tags for the ruling.'),
  suggestedTitle: z
    .string()
    .nullish()
    .transform((v) => (v && v.trim() ? v.trim() : undefined))
    .describe(
      'Short title or heading inferred from the text (e.g. carátula), only if clearly stated; otherwise omit.'
    ),
  suggestedTribunal: z
    .string()
    .nullish()
    .transform((v) => (v && v.trim() ? v.trim() : undefined))
    .describe(
      'Court or tribunal name inferred from the text only if clearly stated; otherwise omit.'
    ),
});
export type SummarizeLegalRulingOutput = z.infer<typeof SummarizeLegalRulingOutputSchema>;

export async function summarizeLegalRuling(input: SummarizeLegalRulingInput): Promise<SummarizeLegalRulingOutput> {
  const rulingText = stripExpedienteBoilerplateFromText(input.rulingText);
  return summarizeLegalRulingFlow({ ...input, rulingText });
}

const prompt = ai.definePrompt({
  name: 'summarizeLegalRulingPrompt',
  input: { schema: SummarizeLegalRulingInputSchema },
  output: { schema: SummarizeLegalRulingOutputSchema },
  prompt: `Eres un experto legal especializado en planes de ahorro en Argentina.
El texto puede haber omitido ya el encabezado del expediente digital (datos de receptoría, notificaciones electrónicas, pasos procesales, etc.). **No repitas ni resumas** ese tipo de metadata de sistema. Centrate en el **cuerpo del fallo** (considerandos, resuelve, costas, etc.).
Tu tarea es analizar el siguiente texto de fallo judicial (puede provenir de un PDF) y:
1. **Resumir** de forma concisa el fallo. El resumen debe ser objetivo, capturando los puntos clave y su implicancia legal, sin superar las 200 palabras.
2. **Etiquetar** el fallo con 5 a 7 palabras o frases clave que lo categoricen; devolvélas en el campo 'tags'.
3. Si el texto indica con claridad una **carátula o título** del expediente y/o el **tribunal u órgano** (ej. juzgado, cámara, sala), podés completar suggestedTitle y suggestedTribunal con frases breves. Si la información no es explícita o es ambigua, **omití** esos campos (no inventes datos).

Fallo Judicial:
{{{rulingText}}}
`,
});

const summarizeLegalRulingFlow = ai.defineFlow(
  {
    name: 'summarizeLegalRulingFlow',
    inputSchema: SummarizeLegalRulingInputSchema,
    outputSchema: SummarizeLegalRulingOutputSchema,
  },
  async (input) => {
    const { output } = await withLlmRetry(() => prompt(input), {
      label: 'summarizeLegalRuling',
    });
    return output!;
  }
);
