'use server';

import type { ChatMessage } from '@/lib/types';
import { processCaseEvaluationConversation } from '@/server/case-evaluation-conversation';

/**
 * Continúa la conversación de evaluación de caso (sitio web).
 *
 * @param history  Historial completo del chat hasta este turno.
 * @param sessionId  ID de sesión generado en el cliente para rastrear parciales.
 */
export async function continueConversation(
  history: ChatMessage[],
  sessionId?: string
): Promise<ChatMessage> {
  return processCaseEvaluationConversation(history, sessionId, { channel: 'web' });
}
