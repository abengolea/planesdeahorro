import 'server-only';

import { evaluateCase, type ConversationOutput } from '@/ai/flows/case-evaluation-flow';
import type { ChatMessage, CaseEvaluation, KnowledgeDoc } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/firebase/admin';
import { sendCaseEvaluationEmail } from '@/lib/send-email';

export type CaseEvaluationChannel = 'web' | 'whatsapp';

export type ProcessCaseEvaluationOptions = {
  channel?: CaseEvaluationChannel;
  whatsappFrom?: string | null;
  notificasTenantId?: string | null;
};

function messageForAiFailure(error: unknown): string {
  const defaultMsg =
    'Hubo un problema con el asistente de IA. Por favor, intentá reiniciar la conversación.';

  if (!error || typeof error !== 'object') return defaultMsg;

  const e = error as {
    status?: string;
    code?: number;
    originalMessage?: string;
    message?: string;
  };

  const blob = `${e.originalMessage ?? ''} ${e.message ?? ''}`.toLowerCase();
  const quotaExhausted =
    e.status === 'RESOURCE_EXHAUSTED' ||
    e.code === 429 ||
    blob.includes('429') ||
    blob.includes('resource_exhausted') ||
    blob.includes('too many requests') ||
    blob.includes('credits are depleted') ||
    blob.includes('prepayment credits');

  if (quotaExhausted) {
    return (
      'El asistente no está disponible ahora mismo: la cuenta de Google AI (Gemini) alcanzó el límite de uso o se agotaron los créditos. ' +
      'Podés intentar más tarde o escribir al estudio por los medios de contacto de la web.'
    );
  }

  return defaultMsg;
}

async function fetchKnowledgeContext(): Promise<string | undefined> {
  try {
    const db = getAdminFirestore();
    const snapshot = await db
      .collection('knowledge_docs')
      .where('active', '==', true)
      .get();

    if (snapshot.empty) return undefined;

    const blocks = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Omit<KnowledgeDoc, 'id'>;
      return [
        `### [${data.category}] ${data.title}`,
        data.description ? `*${data.description}*` : '',
        '',
        data.content,
        '',
        '---',
      ]
        .filter((line) => line !== null)
        .join('\n');
    });

    return blocks.join('\n\n');
  } catch (err) {
    console.error('[fetchKnowledgeContext] Error al obtener documentos:', err);
    return undefined;
  }
}

async function savePartialSession(sessionId: string, history: ChatMessage[]): Promise<void> {
  const userMessages = history.filter((m) => m.role === 'user');
  if (userMessages.length === 0) return;

  try {
    const db = getAdminFirestore();
    await db
      .collection('partial_evaluations')
      .doc(sessionId)
      .set(
        {
          history: history.map((m) => ({ role: m.role, content: m.content })),
          messageCount: history.length,
          userMessageCount: userMessages.length,
          lastUpdatedAt: FieldValue.serverTimestamp(),
          status: 'en_progreso',
        },
        { merge: true }
      );
  } catch (err) {
    console.error('[savePartialSession] Error al guardar sesión parcial:', err);
  }
}

/**
 * Núcleo compartido: web (`continueConversation`) y WhatsApp (NotificasHub).
 */
export async function processCaseEvaluationConversation(
  history: ChatMessage[],
  sessionId?: string,
  options?: ProcessCaseEvaluationOptions
): Promise<ChatMessage> {
  if (sessionId) {
    savePartialSession(sessionId, history).catch(() => {});
  }

  const knowledgeContext = await fetchKnowledgeContext();
  const channel = options?.channel ?? 'web';

  try {
    const assistantOutput: ConversationOutput = await evaluateCase(history, knowledgeContext);

    if (assistantOutput.isFinished && assistantOutput.structuredData) {
      const caseData = assistantOutput.structuredData as CaseEvaluation;

      try {
        const db = getAdminFirestore();

        await db.collection('case_evaluations').add({
          ...caseData,
          sessionId: sessionId ?? null,
          channel,
          whatsappFrom: options?.whatsappFrom ?? null,
          notificasTenantId: options?.notificasTenantId ?? null,
          createdAt: FieldValue.serverTimestamp(),
          status: 'pendiente de revisión',
        });

        if (sessionId) {
          await db
            .collection('partial_evaluations')
            .doc(sessionId)
            .set({ status: 'completado' }, { merge: true });
        }
      } catch (error) {
        console.error('[evaluate-case] Error al guardar el caso en Firestore:', error);
        return {
          id: `error-${Date.now()}`,
          role: 'system',
          content:
            'Hubo un error al guardar tu caso. Por favor, intentá de nuevo más tarde o contactá al estudio directamente.',
        };
      }

      try {
        await sendCaseEvaluationEmail(caseData);
      } catch (emailError) {
        console.error('[evaluate-case] Error al enviar email de notificación:', emailError);
      }
    }

    return {
      id: `asistente-${Date.now()}`,
      role: 'assistant',
      content: assistantOutput.nextMessage,
      quickReplies: assistantOutput.quickReplies,
      isFinished: assistantOutput.isFinished,
    };
  } catch (aiError) {
    console.error('[evaluate-case] processCaseEvaluationConversation failed:', aiError);
    return {
      id: `error-${Date.now()}`,
      role: 'system',
      content: messageForAiFailure(aiError),
    };
  }
}
