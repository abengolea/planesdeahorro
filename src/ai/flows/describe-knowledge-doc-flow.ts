import 'server-only';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DescribeKnowledgeDocInputSchema = z.object({
  title: z.string().describe('Título del documento.'),
  content: z.string().describe('Texto completo del documento.'),
});
export type DescribeKnowledgeDocInput = z.infer<typeof DescribeKnowledgeDocInputSchema>;

const DescribeKnowledgeDocOutputSchema = z.object({
  description: z
    .string()
    .describe('Descripción breve del documento: de qué trata y por qué es útil como contexto para la IA.'),
  tags: z
    .array(z.string())
    .describe('Lista de palabras clave relevantes del documento.'),
});
export type DescribeKnowledgeDocOutput = z.infer<typeof DescribeKnowledgeDocOutputSchema>;

export async function describeKnowledgeDoc(
  input: DescribeKnowledgeDocInput
): Promise<DescribeKnowledgeDocOutput> {
  return describeKnowledgeDocFlow(input);
}

const prompt = ai.definePrompt({
  name: 'describeKnowledgeDocPrompt',
  input: { schema: DescribeKnowledgeDocInputSchema },
  output: { schema: DescribeKnowledgeDocOutputSchema },
  prompt: `Sos un asistente jurídico especializado en planes de ahorro y defensa del consumidor en Argentina.

Analizá el siguiente documento y realizá dos tareas:

1. **Descripción breve** (máximo 2 oraciones, en español rioplatense): resumí de qué trata el documento y por qué es relevante como referencia para que una IA asesore casos de consumidores de planes de ahorro. Sé concreto y útil.

2. **Tags** (entre 3 y 7): palabras o frases clave que identifiquen las temáticas del documento (ej: "seguros", "oponibilidad de ofertas", "derecho de admisión", "bonificación por retiro").

Título: {{{title}}}

Contenido:
{{{content}}}
`,
});

const describeKnowledgeDocFlow = ai.defineFlow(
  {
    name: 'describeKnowledgeDocFlow',
    inputSchema: DescribeKnowledgeDocInputSchema,
    outputSchema: DescribeKnowledgeDocOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
