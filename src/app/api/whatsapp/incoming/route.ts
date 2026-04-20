import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/firebase/admin';
import { processCaseEvaluationConversation } from '@/server/case-evaluation-conversation';
import {
  CASE_EVAL_INITIAL_ASSISTANT_CONTENT,
  CASE_EVAL_INITIAL_QUICK_REPLIES,
} from '@/lib/case-eval-chat-constants';
import { sendTextViaNotificasHub } from '@/lib/notificashub-client';
import {
  extractTextFromMetaMessage,
  formatAssistantReplyForWhatsapp,
  isMenuChoiceEval,
  isMenuChoiceOther,
  isMenuReset,
  normalizeWaPhoneDigits,
  shouldSkipMenuForEvalIntent,
  waSessionIdFromPhone,
} from '@/lib/whatsapp-inbound';
import type { ChatMessage } from '@/lib/types';

const SESSION_COLLECTION = 'whatsapp_case_sessions';

const PENDING_MENU_TEXT = `Este número atiende más de un servicio. Para la evaluación gratuita de tu plan de ahorro (Dr. Adrián Bengolea, residentes en Provincia de Buenos Aires), respondé:
1 — Sí, quiero la evaluación
2 — No era para este trámite / otro servicio

Si venís de un enlace con la frase "EVAL CASO", podés escribirla y seguimos directo.
En cualquier momento podés escribir MENU para ver esto de nuevo.`;

const OTHER_SERVICE_TEXT =
  'Listo. Si este chat no era para el estudio de planes de ahorro, podés usar el mismo número según te indique la otra plataforma. Si más adelante querés la evaluación del plan, escribí MENU.';

type StoredChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  quickReplies?: string[];
  isFinished?: boolean;
};

type SessionDoc = {
  routing: 'pending' | 'case_eval';
  history?: StoredChatMessage[];
};

function authHeaderName(): string {
  return process.env.NOTIFICASHUB_INBOUND_AUTH_HEADER?.trim() || 'x-internal-token';
}

function initialAssistantMessage(): ChatMessage {
  return {
    id: 'inicio',
    role: 'assistant',
    content: CASE_EVAL_INITIAL_ASSISTANT_CONTENT,
    quickReplies: [...CASE_EVAL_INITIAL_QUICK_REPLIES],
  };
}

function serializeMsg(m: ChatMessage): StoredChatMessage {
  return {
    id: m.id,
    role: m.role,
    content: m.content,
    quickReplies: m.quickReplies,
    isFinished: m.isFinished,
  };
}

function deserializeMsg(m: StoredChatMessage): ChatMessage {
  return {
    id: m.id || `restored-${Date.now()}`,
    role: m.role,
    content: m.content,
    quickReplies: m.quickReplies,
    isFinished: m.isFinished,
  };
}

export async function POST(req: NextRequest) {
  const secret = process.env.NOTIFICASHUB_INBOUND_SECRET;
  if (!secret?.trim()) {
    console.error('[whatsapp/incoming] NOTIFICASHUB_INBOUND_SECRET no configurada');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const token = req.headers.get(authHeaderName());
  if (token !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const from = typeof body.from === 'string' ? body.from.trim() : '';
  const message = (body.message ?? {}) as Record<string, unknown>;
  if (!from) {
    return NextResponse.json({ error: 'Missing from' }, { status: 400 });
  }

  const tenantIdHub = process.env.NOTIFICASHUB_TENANT_ID?.trim();
  const sendSecret = process.env.NOTIFICASHUB_SEND_SECRET?.trim() ?? secret;
  if (!tenantIdHub) {
    console.error('[whatsapp/incoming] NOTIFICASHUB_TENANT_ID no configurada');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const digits = normalizeWaPhoneDigits(from);
  const sessionKey = waSessionIdFromPhone(digits);
  const db = getAdminFirestore();
  const sessRef = db.collection(SESSION_COLLECTION).doc(sessionKey);

  const userText = extractTextFromMetaMessage(message);
  const type = (typeof body.type === 'string' ? body.type : message.type) as string | undefined;

  const send = async (text: string) => {
    const r = await sendTextViaNotificasHub({
      to: from,
      text,
      tenantId: tenantIdHub,
      internalSecret: sendSecret,
    });
    if (!r.ok) {
      console.error('[whatsapp/incoming] send failed', r.status, r.bodySnippet);
    }
  };

  if (type && type !== 'text' && type !== 'interactive') {
    await send(
      'Para la evaluación del plan de ahorro necesitamos que escribas en texto (podés describir el problema en una o varias frases).'
    );
    return NextResponse.json({ ok: true });
  }

  if (!userText) {
    await send('No pudimos leer el mensaje. Enviá texto o elegí una opción de la lista.');
    return NextResponse.json({ ok: true });
  }

  const snap = await sessRef.get();
  const session: SessionDoc = snap.exists
    ? (snap.data() as SessionDoc)
    : { routing: 'pending' };

  if (isMenuReset(userText)) {
    await sessRef.set(
      { routing: 'pending', history: [], updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
    await send(PENDING_MENU_TEXT);
    return NextResponse.json({ ok: true });
  }

  if (session.routing === 'pending') {
    if (isMenuChoiceOther(userText)) {
      await sessRef.set(
        { routing: 'pending', history: [], updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
      await send(OTHER_SERVICE_TEXT);
      return NextResponse.json({ ok: true });
    }

    const menuPickEval = isMenuChoiceEval(userText);
    const directIntent = shouldSkipMenuForEvalIntent(userText);

    if (menuPickEval || directIntent) {
      const initial = initialAssistantMessage();
      if (menuPickEval && !directIntent) {
        await sessRef.set({
          routing: 'case_eval',
          history: [serializeMsg(initial)],
          updatedAt: FieldValue.serverTimestamp(),
        });
        await send(formatAssistantReplyForWhatsapp(initial.content, initial.quickReplies));
        return NextResponse.json({ ok: true });
      }

      const history: ChatMessage[] = [
        initial,
        { id: `user-${Date.now()}`, role: 'user', content: userText },
      ];

      const reply = await processCaseEvaluationConversation(history, sessionKey, {
        channel: 'whatsapp',
        whatsappFrom: digits,
        notificasTenantId: typeof body.tenantId === 'string' ? body.tenantId : null,
      });

      if (reply.role === 'system') {
        await send(formatAssistantReplyForWhatsapp(reply.content));
        return NextResponse.json({ ok: true });
      }

      const stored = [...history, reply].map(serializeMsg);
      await sessRef.set({
        routing: 'case_eval',
        history: stored,
        updatedAt: FieldValue.serverTimestamp(),
      });
      await send(formatAssistantReplyForWhatsapp(reply.content, reply.quickReplies));
      if (reply.isFinished) {
        await sessRef.set({
          routing: 'pending',
          history: [],
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      return NextResponse.json({ ok: true });
    }

    await sessRef.set(
      { routing: 'pending', updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
    await send(PENDING_MENU_TEXT);
    return NextResponse.json({ ok: true });
  }

  // case_eval
  let history: ChatMessage[] = (session.history ?? []).map(deserializeMsg);
  if (history.length === 0) {
    history = [initialAssistantMessage()];
  }

  history.push({ id: `user-${Date.now()}`, role: 'user', content: userText });

  const reply = await processCaseEvaluationConversation(history, sessionKey, {
    channel: 'whatsapp',
    whatsappFrom: digits,
    notificasTenantId: typeof body.tenantId === 'string' ? body.tenantId : null,
  });

  if (reply.role === 'system') {
    await send(formatAssistantReplyForWhatsapp(reply.content));
    return NextResponse.json({ ok: true });
  }

  const nextStored = [...history, reply].map(serializeMsg);
  await sessRef.set({
    routing: 'case_eval',
    history: nextStored,
    updatedAt: FieldValue.serverTimestamp(),
  });
  await send(formatAssistantReplyForWhatsapp(reply.content, reply.quickReplies));

  if (reply.isFinished) {
    await sessRef.set({
      routing: 'pending',
      history: [],
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
