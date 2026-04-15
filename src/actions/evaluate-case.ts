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
  // Llama al flujo de Genkit para obtener la respuesta del asistente, que incluye toda la data
  const assistantOutput: ConversationOutput = await evaluateCase(history);

  // Si el flujo de IA indica que la conversación ha terminado y tenemos los datos
  if (assistantOutput.isFinished && assistantOutput.structuredData) {
    const caseData = assistantOutput.structuredData as CaseEvaluation;
    
    try {
      // Guardar en Firestore y luego enviar email
      const { firestore } = initializeFirebase();
      const caseEvaluationsCollection = collection(firestore, 'case_evaluations');
      
      // Await es necesario para asegurar que el guardado ocurra antes de enviar el email
      // y para poder capturar el error y notificar al usuario en el chat.
      await addDoc(caseEvaluationsCollection, {
        ...caseData,
        createdAt: serverTimestamp(),
        status: 'pendiente de revisión',
      });

      // Enviar email solo después de que el guardado fue exitoso
      await sendCaseEvaluationEmail(caseData);

    } catch (error) {
      console.error("Error al guardar en Firestore o enviar el email:", error);
      // Devuelve un mensaje de error al usuario en la interfaz de chat si algo falla.
      return {
        id: `error-${Date.now()}`,
        role: 'system',
        content: 'Hubo un error al procesar y guardar tu caso. Por favor, intenta de nuevo más tarde.',
      };
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
}
