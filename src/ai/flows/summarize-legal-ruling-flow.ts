import 'server-only';
/**
 * @fileOverview This file defines a Genkit flow for summarizing legal rulings.
 *
 * - summarizeLegalRuling - A function that handles the legal ruling summarization process.
 * - SummarizeLegalRulingInput - The input type for the summarizeLegalRuling function.
 * - SummarizeLegalRulingOutput - The return type for the summarizeLegalRuling function.
 */

import { ai } from '@/ai/genkit';
import { runPromptWithModelFallback } from '@/ai/llm-fallback';
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
    .transform((v) => {
      if (!v || !v.trim()) return undefined;
      return v.trim().toLocaleUpperCase('es-AR');
    })
    .describe(
      'Case caption / carátula in ALL CAPS (Argentine court style) if clearly stated; otherwise omit.'
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
  prompt: `Sos un letrado especializado en planes de ahorro y Derecho del consumo en Argentina.
El texto puede haber omitido ya el encabezado del expediente digital (receptoría, notificaciones electrónicas, pasos procesales, etc.). **No repitas ni resumas** esa metadata. Centrate en el **cuerpo decisorio** del fallo (considerandos centrales, resuelve, dispositivo, costas, lo que tenga trascendencia para el desenlace).

Analizá el siguiente texto (p. ej. extraído de un PDF) y devolvé:

1. **summary** — El resumen no debe ser un relato fáctico ni un seguimiento del trámite. Debe ir **al corazón del caso** desde el punto de vista del Derecho: qué resolvió el órgano, sobre qué pretensiones **hace lugar, rechaza, declara, deja sin efecto o confirma**; cuál es el **criterio jurídico principal** que sustenta (ratio decidendi, artículo o principio clave, estándar probatorio, interpretación de norma) y el **efecto práctico inmediato** (condena, monto, medida, costas, etc.). Si hay varias cuestiones, priorizá **lo que define el desenlace** o la doctrina reutilizable. Objetivo, claro, sin lenguaje promocional. Máximo **200 palabras**.

2. **tags** — Entre 5 y 7 etiquetas breves que categoricen el asunto (íntegras en 'tags').

3. **suggestedTitle** — Solo si en el texto figura con claridad la **carátula / identificación del expediente**; copiala **completa en MAYÚSCULAS** (como en cédula o rol judicial argentino), sin inventar ni acortar impropiamente. Si dudás u omiten datos, dejá el campo vacío.

4. **suggestedTribunal** — Nombre del **tribunal u órgano** (juzgado, cámara, sala) **solo** si consta con claridad; frase breve. Si no es explícito, omití. No inventes.

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
    const { output } = await runPromptWithModelFallback((model) => prompt(input, { model }), {
      label: 'summarizeLegalRuling',
    });
    return output!;
  }
);
