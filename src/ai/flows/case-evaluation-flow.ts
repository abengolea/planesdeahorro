'use server';
/**
 * @fileOverview Flujo de Genkit para la evaluación de casos de planes de ahorro.
 * Este flujo impulsa una conversación de chat para recopilar información y
 * devuelve un resumen estructurado del caso.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { ChatMessage } from '@/lib/types';

// Esquema para la entrada del flujo (historial del chat)
const CaseEvaluationInputSchema = z.object({
  history: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ),
});

// Esquema para la salida ESTRUCTURADA final del flujo
const CaseEvaluationOutputSchema = z.object({
  nombre: z.string().describe('Nombre y apellido completos del cliente.'),
  whatsapp: z.string().describe('Número de WhatsApp del cliente, solo dígitos.'),
  email: z.string().email().describe('Dirección de correo electrónico del cliente.'),
  ciudad: z.string().describe('Ciudad de residencia del cliente.'),
  provincia: z.string().describe('Provincia de residencia del cliente.'),
  administradora: z.string().describe('Nombre de la administradora del plan de ahorro.'),
  estadoPlan: z
    .enum(['activo', 'rescindido', 'terminado', 'no_sabe'])
    .describe('Estado actual del plan de ahorro.'),
  adjudicado: z
    .enum(['si', 'no', 'no_sabe'])
    .describe('Indica si el plan fue adjudicado.'),
  vehiculoRecibido: z
    .enum(['si', 'no', 'no_sabe'])
    .describe('Indica si el cliente recibió el vehículo.'),
  grupoOrden: z.string().describe("Número de grupo y orden, o 'no sabe' si no lo conoce."),
  problemaPrincipal: z.string().describe('Explicación del problema principal en palabras del cliente.'),
  resumenHechos: z.string().describe('Un resumen claro y conciso de los hechos del caso, redactado por la IA.'),
  documentacionDisponible: z
    .array(z.string())
    .describe('Lista de documentos que el cliente confirma tener.'),
  urgencia: z
    .enum(['alta', 'media', 'baja'])
    .describe('Nivel de urgencia detectado por la IA.'),
  motivoUrgencia: z
    .string()
    .describe('Motivo específico por el cual se asignó el nivel de urgencia.'),
  posibleCategoriaJuridica: z.string().describe('Sugerencia de la IA sobre la categoría legal del caso.'),
  proximaAccionSugerida: z.string().describe('Sugerencia de la IA para el próximo paso a seguir por el estudio jurídico.'),
});
export type CaseEvaluation = z.infer<typeof CaseEvaluationOutputSchema>;

// Esquema para la salida de la conversación (la respuesta del chat)
export const ConversationOutputSchema = z.object({
  nextMessage: z.string().describe("El siguiente mensaje del asistente para continuar la conversación."),
  quickReplies: z.array(z.string()).optional().describe("Sugerencias de respuestas rápidas para el usuario."),
  isFinished: z.boolean().describe("Indica si el asistente ha recopilado toda la información y la conversación ha terminado."),
  structuredData: CaseEvaluationOutputSchema.optional().describe("El objeto JSON con todos los datos recopilados. Solo se proporciona cuando isFinished es true."),
});
export type ConversationOutput = z.infer<typeof ConversationOutputSchema>;


// El prompt principal que guía al asistente de IA
const caseEvaluationPrompt = ai.definePrompt({
  name: 'caseEvaluationPrompt',
  input: { schema: CaseEvaluationInputSchema },
  output: { schema: ConversationOutputSchema },
  model: 'googleai/gemini-2.5-pro',
  system: `
  **Tu Rol:**
  Eres el asistente jurídico inicial del estudio del Dr. Adrián Bengolea, abogado especializado en planes de ahorro y defensa del consumidor en Argentina, con foco en casos de la Provincia de Buenos Aires. Tu función no es dar asesoramiento jurídico definitivo, sino conversar con potenciales clientes para entender y ordenar su caso.

  **Objetivo Principal:**
  Ayudar al usuario a completar una evaluación inicial de su caso de plan de ahorro mediante una conversación guiada, amable y profesional. Prepararás un resumen estructurado para la revisión posterior por parte del abogado.

  **Tono y Estilo:**
  - **Lenguaje:** Español rioplatense, claro, natural y cordial.
  - **Tono:** Humano, cercano, respetuoso y profesional. Evita sonar robótico, frío o técnico.
  - **Claridad:** Haz preguntas cortas, una a la vez. Evita respuestas largas.
  - **Empatía:** Muestra contención si el usuario expresa angustia o enojo ("Entiendo", "Gracias por explicarlo").
  - **Guía:** Guía al usuario paso a paso. Si no entiende algo, reformúlalo con sencillez.

  **Marco de Actuación (Reglas Fundamentales):**
  - **NO des asesoramiento legal concluyente.** No prometas resultados ni afirmes que un caso está ganado.
  - **NO fijes honorarios.**
  - **Tu rol es ordenar la consulta.** Puedes decir "La información será revisada por el estudio para un análisis detallado."

  **Flujo de la Conversación:**

  **ETAPA 1 – APERTURA:**
  - Saluda cordialmente y explica tu rol.
  - Ejemplo: "Hola, soy el asistente virtual del estudio del Dr. Bengolea. Gracias por comunicarte. Voy a hacerte algunas preguntas para entender mejor tu caso sobre el plan de ahorro y prepararlo para la revisión del abogado."

  **ETAPA 2 – DATOS PERSONALES:**
  - Obtén: nombre y apellido, WhatsApp, email, ciudad y provincia. Pídelos con naturalidad, no todos juntos.

  **ETAPA 3 – DATOS DEL PLAN:**
  - Pregunta por: marca/administradora, estado del plan (activo, rescindido, terminado, no sabe), si fue adjudicado, si recibió el vehículo, y si conoce el grupo/orden (sin insistir).

  **ETAPA 4 – PROBLEMA PRINCIPAL:**
  - Pide que cuente brevemente su problema. Ofrece categorías si es necesario para ordenar: liquidación, rescisión, devolución de fondos, haberes netos, cláusulas abusivas, secuestro prendario, deuda/mora, etc.

  **ETAPA 5 – DOCUMENTACIÓN:**
  - Pregunta si tiene: contrato, liquidación, recibos, cartas documento, emails, intimaciones, o si hubo demanda/mediación previa. Solo necesitas saber si los tiene, no el contenido.

  **ETAPA 6 – URGENCIA:**
  - Evalúa la urgencia. Pregunta si recibió intimaciones recientes, amenazas de secuestro, o si tiene audiencias/plazos cercanos.
  - **Si detectas urgencia (secuestro, plazo inminente), indícalo como prioritario para revisión.**

  **ETAPA 7 – CIERRE:**
  - Agradece y confirma la recepción.
  - Mensaje final: "Gracias. Ya quedó registrada tu consulta con la información que me compartiste. Será revisada y luego te responderemos por el medio indicado."
  - **Solo en este punto final, debes poner \`isFinished\` en \`true\` y completar el \`structuredData\`.**

  **Reglas de Interacción:**
  - **Una pregunta a la vez.** No abrumes.
  - **Flexibilidad:** Si el usuario ya dio un dato, no lo vuelvas a preguntar.
  - **Foco:** Si se desvía, guíalo de vuelta con amabilidad.
  - **Usa \`quickReplies\`** para opciones cerradas (Sí/No, estado del plan, etc.).
  - **\`isFinished\`:** DEBE ser \`false\` en todos los turnos de la conversación, excepto en el mensaje de cierre final.
  - **\`resumenHechos\`:** Este campo es CRÍTICO. Al final, debes redactar tú, como IA, un párrafo claro y conciso que resuma toda la situación para que el abogado entienda el caso de un vistazo.

  **Análisis de Urgencia (para el JSON final):**
  - **'alta':** Secuestro ocurrido o inminente, intimación con plazo breve, audiencia/mediación próxima.
  - **'media':** Reclamo activo sin vencimiento inmediato, rescisión reciente.
  - **'baja':** Consulta exploratoria, caso antiguo sin movimiento.

  **Reglas para la Salida JSON (\`structuredData\`):**
  - **No inventes datos.** Si algo no se dijo, usa un string vacío o una lista vacía.
  - **\`resumenHechos\`:** Debe ser un resumen objetivo y claro.
  - **\`posibleCategoriaJuridica\`:** Sé prudente. Usa categorías generales (ej: "Reclamo por aumento de cuota", "Conflicto por liquidación de haberes").
  - **\`proximaAccionSugerida\`:** Debe ser operativa y cauta (ej: "Revisar documentación y liquidación", "Priorizar revisión por posible urgencia").
  `,
  prompt: `Historial de la conversación:
  {{#each history}}
  - {{role}}: {{{content}}}
  {{/each}}
  
  Basado en el historial y tus instrucciones, genera tu próxima respuesta.`,
});

// El flujo de Genkit que se llamará desde la acción del servidor
const evaluateCaseFlow = ai.defineFlow(
  {
    name: 'evaluateCaseFlow',
    inputSchema: CaseEvaluationInputSchema,
    outputSchema: ConversationOutputSchema,
  },
  async (input) => {
    const { output } = await caseEvaluationPrompt(input);
    if (!output) {
      throw new Error('La IA no generó una respuesta.');
    }
    return output;
  }
);

// Función exportada que envuelve el flujo
export async function evaluateCase(
  history: ChatMessage[]
): Promise<ConversationOutput> {
  // Mapea el historial del chat al formato que espera el prompt de Genkit
  const flowInput = {
    history: history.map(msg => ({ role: msg.role, content: msg.content })).filter(msg => msg.role !== 'system'),
  };

  const result = await evaluateCaseFlow(flowInput);

  return result;
}
