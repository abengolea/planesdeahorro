import 'server-only';

/**
 * Borrador de mensaje al cliente al aceptar un caso (panel admin).
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const DraftAcceptCaseClientMessageInputSchema = z.object({
  nombre: z.string(),
  ciudad: z.string(),
  provincia: z.string(),
  administradora: z.string(),
  estadoPlan: z.string(),
  adjudicado: z.string(),
  vehiculoRecibido: z.string(),
  grupoOrden: z.string(),
  problemaPrincipal: z.string(),
  resumenHechos: z.string(),
  /** Lista que ya declaró el cliente, en texto (ej. separada por comas). */
  documentacionDisponible: z.string(),
  urgencia: z.enum(['alta', 'media', 'baja']),
  motivoUrgencia: z.string(),
  posibleCategoriaJuridica: z.string(),
  proximaAccionSugerida: z.string(),
});

export type DraftAcceptCaseClientMessageInput = z.infer<typeof DraftAcceptCaseClientMessageInputSchema>;

const DraftAcceptCaseClientMessageOutputSchema = z.object({
  message: z
    .string()
    .describe(
      'Cuerpo del mensaje en texto plano para enviar al cliente por correo. Sin asunto. Sin firma formal de estudio si no se pide.',
    ),
});

const draftAcceptCaseClientMessagePrompt = ai.definePrompt({
  name: 'draftAcceptCaseClientMessagePrompt',
  input: { schema: DraftAcceptCaseClientMessageInputSchema },
  output: { schema: DraftAcceptCaseClientMessageOutputSchema },
  prompt: `Sos asistente de redacción del estudio del Dr. Adrián Bengolea (planes de ahorro, Provincia de Buenos Aires).

**Datos del caso (no los repitas todos; usalos solo para personalizar):**
- Nombre: {{{nombre}}}
- Ubicación: {{{ciudad}}}, {{{provincia}}}
- Administradora: {{{administradora}}}
- Estado del plan: {{{estadoPlan}}}
- Adjudicado: {{{adjudicado}}}
- Vehículo recibido: {{{vehiculoRecibido}}}
- Grupo/orden: {{{grupoOrden}}}
- Problema (palabras del cliente): {{{problemaPrincipal}}}
- Resumen de hechos (interno): {{{resumenHechos}}}
- Documentación que ya indicó tener: {{documentacionDisponible}}
- Urgencia: {{{urgencia}}} — {{{motivoUrgencia}}}
- Categoría jurídica tentativa: {{{posibleCategoriaJuridica}}}
- Próxima acción sugerida (interno): {{{proximaAccionSugerida}}}

**Tu tarea:** redactá el campo \`message\`: un **único** texto en español rioplatense, cordial y profesional, como cuerpo de **correo** al cliente (sin línea de asunto).

**Contenido obligatorio:**
1. Saludo breve usando el nombre si está claro (si el nombre es "—" o vacío, usá "Hola" sin inventar nombre).
2. Confirmá que el estudio **avanza** con la consulta / que podés continuar por este canal (tono prudente, sin prometer resultados).
3. Decí que **a la brevedad** se comunicará el **Dr. Adrián Bengolea** o **un integrante del estudio** en su **representación** (redacción natural, una sola mención).
4. Pedí **documentación o datos concretos** que un abogado pediría en **este** caso: alineá la lista al relato y a la categoría tentativa; si ya mencionó documentos, pedí lo que **falta** o copias legibles, fechas, intimaciones, etc. cuando aplique. No inventes hechos que no figuren arriba.
5. Podés mencionar que puede responder por el mismo correo o que coordinarán por WhatsApp **solo si** el contexto lo hace razonable (hay dato de contacto en el caso; si no, no inventes número).
6. Cierre cordial.

**Prohibido:** asesoramiento legal concluyente, prometer éxito, fijar honorarios, tono alarmista, markdown, viñetas con \`-\` al inicio de línea (usá párrafos o números simples si hace falta lista).

**Extensión:** entre 130 y 220 palabras.`,
});

const draftAcceptCaseClientMessageFlow = ai.defineFlow(
  {
    name: 'draftAcceptCaseClientMessageFlow',
    inputSchema: DraftAcceptCaseClientMessageInputSchema,
    outputSchema: DraftAcceptCaseClientMessageOutputSchema,
  },
  async (input) => {
    const { output } = await draftAcceptCaseClientMessagePrompt(input);
    if (!output?.message?.trim()) {
      throw new Error('La IA no generó el mensaje.');
    }
    return output;
  },
);

export async function draftAcceptCaseClientMessage(
  input: DraftAcceptCaseClientMessageInput,
): Promise<string> {
  const { message } = await draftAcceptCaseClientMessageFlow(input);
  return message.trim();
}
