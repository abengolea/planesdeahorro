import 'server-only';
/**
 * @fileOverview This file implements a Genkit flow for drafting an initial outline
 * for a legal doctrine article based on a provided topic or keywords.
 *
 * - draftDoctrineArticleOutline - A function to generate a doctrine article outline.
 * - DraftDoctrineArticleOutlineInput - The input type for the draftDoctrineArticleOutline function.
 * - DraftDoctrineArticleOutlineOutput - The return type for the draftDoctrineArticleOutline function.
 */

import { ai } from '@/ai/genkit';
import { runPromptWithModelFallback } from '@/ai/llm-fallback';
import { z } from 'genkit';

const DraftDoctrineArticleOutlineInputSchema = z.object({
  topicOrKeywords: z
    .string()
    .describe(
      'The topic or keywords for the legal doctrine article for which an outline is to be generated.'
    ),
  siteKnowledgeContext: z
    .string()
    .optional()
    .describe('Fallos y doctrina ya cargados en el sitio para alinear criterio y estructura.'),
});
export type DraftDoctrineArticleOutlineInput = z.infer<
  typeof DraftDoctrineArticleOutlineInputSchema
>;

const DraftDoctrineArticleOutlineOutputSchema = z.object({
  outline: z
    .string()
    .describe('A detailed outline for the legal doctrine article, formatted in markdown.'),
});
export type DraftDoctrineArticleOutlineOutput = z.infer<
  typeof DraftDoctrineArticleOutlineOutputSchema
>;

export async function draftDoctrineArticleOutline(
  input: DraftDoctrineArticleOutlineInput
): Promise<DraftDoctrineArticleOutlineOutput> {
  const siteKnowledgeContext = (input.siteKnowledgeContext ?? '').trim();
  return draftDoctrineArticleOutlineFlow({ ...input, siteKnowledgeContext });
}

const draftDoctrineArticleOutlinePrompt = ai.definePrompt({
  name: 'draftDoctrineArticleOutlinePrompt',
  input: { schema: DraftDoctrineArticleOutlineInputSchema },
  output: { schema: DraftDoctrineArticleOutlineOutputSchema },
  prompt: `Eres un asistente experto en derecho y redacción jurídica. Tu tarea es crear un esquema detallado y coherente para un artículo de doctrina legal.
El esquema debe ser completo, bien estructurado y relevante para el tema o las palabras clave proporcionadas. Incluye secciones y subsecciones lógicas, como introducción, desarrollo de puntos clave, análisis de jurisprudencia (si aplica), conclusiones y posibles referencias.

Si el material siguiente no está vacío, tenélo en cuenta para alinear voz, profundidad y conexión con el material ya publicado o en carga en el estudio; evitá repetir títulos o ideas ya agotadas salvo que el tema lo exija, y proponé enlaces lógicos con esos frentes.

**Material de referencia (fallos y doctrina en el sitio; puede ir vacío):**
{{{siteKnowledgeContext}}}

---

Tema o Palabras Clave: {{{topicOrKeywords}}}

Formatea el esquema utilizando markdown, con encabezados y listas para una fácil lectura.`,
});

const draftDoctrineArticleOutlineFlow = ai.defineFlow(
  {
    name: 'draftDoctrineArticleOutlineFlow',
    inputSchema: DraftDoctrineArticleOutlineInputSchema,
    outputSchema: DraftDoctrineArticleOutlineOutputSchema,
  },
  async (input) => {
    const { output } = await runPromptWithModelFallback(
      (model) => draftDoctrineArticleOutlinePrompt(input, { model }),
      { label: 'draftDoctrineArticleOutline' },
    );
    return output!;
  }
);
