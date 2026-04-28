import 'server-only';
/**
 * Resumen y etiquetado de textos de doctrina (ensayos, artículos, monografías) a partir de PDF extraído.
 */

import { ai } from '@/ai/genkit';
import { runPromptWithModelFallback } from '@/ai/llm-fallback';
import { z } from 'genkit';

const SummarizeDoctrineDocumentInputSchema = z.object({
  documentText: z.string().describe('Texto extraído del documento de doctrina (p. ej. desde PDF).'),
  siteKnowledgeContext: z
    .string()
    .optional()
    .describe('Fallos y doctrina del sitio como referencia de línea; no reemplaza el documento a sintetizar.'),
});
export type SummarizeDoctrineDocumentInput = z.infer<typeof SummarizeDoctrineDocumentInputSchema>;

const SummarizeDoctrineDocumentOutputSchema = z.object({
  summary: z
    .string()
    .describe(
      'Resumen breve (introducción) para listados y SEO: 2–4 oraciones, tono profesional, sin superar ~180 palabras.'
    ),
  tags: z
    .array(z.string())
    .describe('Entre 5 y 10 etiquetas temáticas en español (planes de ahorro, consumo, contratos, etc.).'),
  suggestedTitle: z
    .string()
    .nullish()
    .transform((v) => (v && v.trim() ? v.trim() : undefined))
    .describe('Título sugerido solo si el documento lo permite con claridad; si no, omitir.'),
  content: z
    .string()
    .describe(
      'Cuerpo del artículo para publicar: redacción clara en Markdown (## secciones, listas cuando corresponda). Debe reflejar las ideas centrales del documento, no inventar jurisprudencia ni citas inexistentes.'
    ),
});
export type SummarizeDoctrineDocumentOutput = z.infer<typeof SummarizeDoctrineDocumentOutputSchema>;

export async function summarizeDoctrineDocument(
  input: SummarizeDoctrineDocumentInput
): Promise<SummarizeDoctrineDocumentOutput> {
  const siteKnowledgeContext = (input.siteKnowledgeContext ?? '').trim();
  return summarizeDoctrineDocumentFlow({ ...input, siteKnowledgeContext });
}

const doctrinePrompt = ai.definePrompt({
  name: 'summarizeDoctrineDocumentPrompt',
  input: { schema: SummarizeDoctrineDocumentInputSchema },
  output: { schema: SummarizeDoctrineDocumentOutputSchema },
  prompt: `Sos un jurista especializado en planes de ahorro y derecho del consumo en Argentina.
El texto siguiente fue extraído de un PDF (puede tener saltos de línea raros o encabezados repetidos). Ignorá numeración de página suelta y basura de maquetado.

**Material de referencia del estudio (puede ir vacío):** otros fallos y artículos de doctrina ya en el sitio. Usalo solo para alinear criterio y estilo; el contenido obligatorio a sintetizar es el **texto del documento** al final. No mezcles hechos ajenos al PDF con el cuerpo del artículo.

{{{siteKnowledgeContext}}}

---

Tareas:
1. **summary**: un párrafo introductorio breve para la ficha del artículo (listados / SEO).
2. **tags**: 5 a 10 etiquetas útiles (tema jurídico, instituto, tipo de problema).
3. **suggestedTitle**: solo si el título real del trabajo aparece con claridad al inicio o en portada textual; si no, omití el campo.
4. **content**: redactá el cuerpo del artículo en **Markdown** con secciones (##), listas cuando ayuden, y tono divulgativo-jurídico. Sintetizá el documento: ideas centrales, conclusiones y matices importantes. **No inventés** fallos, fechas ni citas que no estén en el texto. Si el texto es insuficiente, decilo con honestidad en una sección breve.

Texto del documento:
{{{documentText}}}
`,
});

const summarizeDoctrineDocumentFlow = ai.defineFlow(
  {
    name: 'summarizeDoctrineDocumentFlow',
    inputSchema: SummarizeDoctrineDocumentInputSchema,
    outputSchema: SummarizeDoctrineDocumentOutputSchema,
  },
  async (input) => {
    const { output } = await runPromptWithModelFallback((model) => doctrinePrompt(input, { model }), {
      label: 'summarizeDoctrineDocument',
    });
    return output!;
  }
);
