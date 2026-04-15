'use server';
/**
 * @fileOverview This file defines a Genkit flow for summarizing legal rulings.
 *
 * - summarizeLegalRuling - A function that handles the legal ruling summarization process.
 * - SummarizeLegalRulingInput - The input type for the summarizeLegalRuling function.
 * - SummarizeLegalRulingOutput - The return type for the summarizeLegalRuling function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SummarizeLegalRulingInputSchema = z.object({
  rulingText: z.string().describe('The full text of the legal ruling to be summarized.'),
});
export type SummarizeLegalRulingInput = z.infer<typeof SummarizeLegalRulingInputSchema>;

const SummarizeLegalRulingOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the legal ruling.'),
  tags: z.array(z.string()).describe('A list of relevant keywords or tags for the ruling.'),
});
export type SummarizeLegalRulingOutput = z.infer<typeof SummarizeLegalRulingOutputSchema>;

export async function summarizeLegalRuling(input: SummarizeLegalRulingInput): Promise<SummarizeLegalRulingOutput> {
  return summarizeLegalRulingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeLegalRulingPrompt',
  input: { schema: SummarizeLegalRulingInputSchema },
  output: { schema: SummarizeLegalRulingOutputSchema },
  prompt: `Eres un experto legal especializado en planes de ahorro en Argentina.
Tu tarea es analizar el siguiente fallo judicial y realizar dos cosas:
1.  **Resumir** de forma concisa el fallo. El resumen debe ser objetivo, capturando los puntos clave y su implicancia legal, sin superar las 200 palabras.
2.  **Etiquetar** el fallo con 5 a 7 palabras o frases clave que lo categoricen. Devuelve estas etiquetas en el campo 'tags'.

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
    const { output } = await prompt(input);
    return output!;
  }
);
