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
import { z } from 'genkit';

const SummarizeLegalRulingInputSchema = z.object({
  rulingText: z.string().describe('The full text of the legal ruling to be summarized.'),
  siteKnowledgeContext: z
    .string()
    .optional()
    .describe(
      'Resúmenes y extractos de fallos y doctrina ya publicados o cargados en el sitio (contexto de referencia, no reemplaza el texto a analizar).'
    ),
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
  /** Fecha de la resolución/sentencia según el documento (encabezado, cierre, "En X, a..."). Nunca hoy. */
  suggestedRulingDate: z
    .string()
    .nullish()
    .transform((v) => {
      if (!v || !v.trim()) return undefined;
      const t = v.trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return undefined;
      return t;
    })
    .describe(
      'Ruling date in YYYY-MM-DD only if clearly stated in the document (e.g. sentencia date, final signature). Never use upload, analysis, or current date. Omit if unknown.'
    ),
});
export type SummarizeLegalRulingOutput = z.infer<typeof SummarizeLegalRulingOutputSchema>;

export async function summarizeLegalRuling(input: SummarizeLegalRulingInput): Promise<SummarizeLegalRulingOutput> {
  /** No recortar encabezado: la carátula suele ir **antes** de "VISTO"; si se elimina, la IA no puede sugerir título. */
  const rulingText = input.rulingText;
  const siteKnowledgeContext = (input.siteKnowledgeContext ?? '').trim();
  return summarizeLegalRulingFlow({ ...input, rulingText, siteKnowledgeContext });
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

3. **suggestedTitle** — Buscá la **carátula / identificación del expediente** (suele estar en las **primeras líneas** del documento, antes de “VISTO”, “AUTOS Y VISTOS” o el cuerpo). Copiala **completa en MAYÚSCULAS** (como en cédula o rol judicial argentino), sin inventar ni acortar impropiamente. Si dudás u omiten datos, dejá el campo vacío.

4. **suggestedTribunal** — Nombre del **tribunal u órgano** (juzgado, cámara, sala) **solo** si consta con claridad; frase breve. Si no es explícito, omití. No inventes.

5. **suggestedRulingDate** — **Fecha de la sentencia o resolución** tal como figura en el documento (encabezado, pie, "En [lugar], a [fecha] días de…", cierre con fecha bajo rúbrica). Devolvé **solo** en formato año-mes-día con guiones (ej. 2019-03-15; cuatro cifras para el año, dos para mes y día). **No uses** la fecha de hoy, ni la de carga, ni fechas de notificaciones laterales. Si el texto no deja clara la fecha, omití (no inventes).

**Material de referencia del estudio (fallos y doctrina ya cargados; puede ir vacío):** usalo para alinear criterio, tono y línea temática con el contenido publicado, **sin contradecir** el texto concreto del fallo que analizás. No copies literalmente ni sustituyas al documento bajo.
{{{siteKnowledgeContext}}}

---

Fallo Judicial a analizar:
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
