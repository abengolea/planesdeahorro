'use server';

import { evaluateCase, type ConversationOutput } from '@/ai/flows/case-evaluation-flow';
import type { ChatMessage, CaseEvaluation } from '@/lib/types';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { sendCaseEvaluationEmail } from '@/lib/send-email';

// Esta función se encarga de la lógica del servidor:
// 1. Llama al flujo de IA para obtener la siguiente respuesta.
// 2. Si la conversación ha terminado, guarda los datos en Firestore y envía el email.
export async function continueConversation(history: ChatMessage[]): Promise<ChatMessage> {
  try {
    // Llama al flujo de Genkit para obtener la respuesta del asistente, que incluye toda la data
    const assistantOutput: ConversationOutput = await evaluateCase(history);

    // Si el flujo de IA indica que la conversación ha terminado y tenemos los datos
    if (assistantOutput.isFinished && assistantOutput.structuredData) {
      const caseData = assistantOutput.structuredData as CaseEvaluation;
      
      try {
        // 1. Guardar en Firestore. Esta es la parte crítica para el usuario.
        const { firestore } = initializeFirebase();
        const caseEvaluationsCollection = collection(firestore, 'case_evaluations');
        
        await addDoc(caseEvaluationsCollection, {
          ...caseData,
          createdAt: serverTimestamp(),
          status: 'pendiente de revisión',
        });

      } catch (error) {
        console.error("Error al guardar el caso en Firestore:", error);
        // Si Firestore falla, es un error crítico. Notificar al usuario.
        return {
          id: `error-${Date.now()}`,
          role: 'system',
          content: 'Hubo un error al guardar tu caso. Por favor, intenta de nuevo más tarde o contacta al estudio directamente.',
        };
      }

      // 2. Enviar el email. Esto es una notificación interna.
      // Si falla, no debería mostrar un error al usuario, ya que su caso fue guardado.
      try {
          await sendCaseEvaluationEmail(caseData);
      } catch (emailError) {
          // Registrar el error para monitoreo, pero no interrumpir el flujo del usuario.
          console.error("Error al enviar el email de notificación del caso:", emailError);
      }
    }

    // Construye y devuelve el mensaje del asistente para la UI del chat
    return {
      id: `asistente-${Date.now()}`,
      role: 'assistant',
      content: assistantOutput.nextMessage,
      quickReplies: assistantOutput.quickReplies,
      isFinished: assistantOutput.isFinished,
    };
  } catch (aiError) {
      console.error('[AI Action] continueConversation failed:', aiError);
      return {
        id: `error-${Date.now()}`,
        role: 'system',
        content: 'Hubo un problema con el asistente de IA. Por favor, intenta reiniciar la conversación.',
      };
  }
}
