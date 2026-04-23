import { after, NextRequest, NextResponse } from 'next/server';
import { FieldValue, type DocumentReference } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/firebase/admin';
import { processCaseEvaluationConversation } from '@/server/case-evaluation-conversation';
import {
  CASE_EVAL_INITIAL_ASSISTANT_CONTENT,
  CASE_EVAL_INITIAL_QUICK_REPLIES,
} from '@/lib/case-eval-chat-constants';
import { notificasHubAuthHeaderName, sendTextViaNotificasHub } from '@/lib/notificashub-client';
import {
  extractTextFromMetaMessage,
  formatAssistantReplyForWhatsapp,
  isHubRoutedToUs,
  isLikelyHubTenantPickerReply,
  isMenuChoiceEval,
  isMenuChoiceOther,
  isMenuReset,
  isTrivialAck,
  normalizeWaPhoneDigits,
  shouldSkipMenuForEvalIntent,
  waSessionIdFromPhone,
} from '@/lib/whatsapp-inbound';
import type { ChatMessage } from '@/lib/types';

const SESSION_COLLECTION = 'whatsapp_case_sessions';
const DEDUP_COLLECTION = 'whatsapp_inbound_dedup';

const PENDING_MENU_TEXT = `Este número atiende más de un servicio. Para contarnos tu caso sobre el plan de ahorro (Dr. Adrián Bengolea, residentes en Provincia de Buenos Aires), respondé:
1 — Sí, quiero continuar
2 — No era para este trámite / otro servicio

Si venís de un enlace con la frase "EVAL CASO", podés escribirla y seguimos directo.
En cualquier momento podés escribir MENU para ver esto de nuevo.`;

const OTHER_SERVICE_TEXT =
  'Listo. Si este chat no era para el estudio de planes de ahorro, podés usar el mismo número según te indique la otra plataforma. Si más adelante querés contarnos tu caso sobre el plan, escribí MENU.';

/** Tras elegir ya el servicio en NotificasHub, no repetimos el menú 1/2. */
const HUB_ROUTED_RESET_HINT =
  'Seguimos con tu consulta sobre el plan de ahorro. Contanos en una o varias frases qué te pasa, o escribí EVAL CASO para el flujo guiado. En cualquier momento podés escribir MENU.';

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

function dedupDocIdFromMessageId(messageId: string): string {
  return Buffer.from(messageId.trim(), 'utf8').toString('base64url').slice(0, 800);
}

async function claimInboundMessageId(
  messageId: string | undefined
): Promise<{ status: 'new' | 'duplicate' | 'no_id'; ref: DocumentReference | null }> {
  const trimmed = messageId?.trim() ?? '';
  if (!trimmed) {
    return { status: 'no_id', ref: null };
  }
  const db = getAdminFirestore();
  const ref = db.collection(DEDUP_COLLECTION).doc(dedupDocIdFromMessageId(trimmed));
  const outcome = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists) return 'duplicate' as const;
    tx.set(ref, {
      messageId: trimmed,
      createdAt: FieldValue.serverTimestamp(),
    });
    return 'new' as const;
  });
  if (outcome === 'duplicate') {
    return { status: 'duplicate', ref: null };
  }
  return { status: 'new', ref };
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

async function processWhatsAppInboundBody(
  body: Record<string, unknown>,
  ctx: { tenantIdHub: string; inboundSecret: string }
): Promise<void> {
  const from = typeof body.from === 'string' ? body.from.trim() : '';
  const message = (body.message ?? {}) as Record<string, unknown>;
  if (!from) {
    return;
  }

  const sendSecret =
    process.env.NOTIFICASHUB_SEND_SECRET?.trim() ?? ctx.inboundSecret;

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
      tenantId: ctx.tenantIdHub,
      internalSecret: sendSecret,
    });
    if (!r.ok) {
      console.error('[whatsapp/incoming] send failed', r.status, r.bodySnippet);
    }
  };

  if (type && type !== 'text' && type !== 'interactive') {
    await send(
      'Para seguir con tu caso sobre el plan de ahorro necesitamos que escribas en texto (podés describir el problema en una o varias frases).'
    );
    return;
  }

  if (!userText) {
    await send('No pudimos leer el mensaje. Enviá texto o elegí una opción de la lista.');
    return;
  }

  const snap = await sessRef.get();
  const session: SessionDoc = snap.exists
    ? (snap.data() as SessionDoc)
    : { routing: 'pending' };

  const hubRouted = isHubRoutedToUs(body, ctx.tenantIdHub);

  if (isMenuReset(userText)) {
    await sessRef.set(
      { routing: 'pending', history: [], updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
    await send(hubRouted ? HUB_ROUTED_RESET_HINT : PENDING_MENU_TEXT);
    return;
  }

  if (session.routing === 'pending') {
    if (isMenuChoiceOther(userText)) {
      await sessRef.set(
        { routing: 'pending', history: [], updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
      await send(OTHER_SERVICE_TEXT);
      return;
    }

    const menuPickEval = isMenuChoiceEval(userText);
    const directIntent = shouldSkipMenuForEvalIntent(userText);
    const trivialAck = isTrivialAck(userText);
    const hubPicker = isLikelyHubTenantPickerReply(userText, message, ctx.tenantIdHub);

    const internalGateOk =
      hubRouted || menuPickEval || directIntent;

    if (!internalGateOk) {
      await sessRef.set(
        { routing: 'pending', updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
      await send(PENDING_MENU_TEXT);
      return;
    }

    const initial = initialAssistantMessage();

    const initialOnly =
      (menuPickEval && !directIntent) || (hubRouted && (trivialAck || hubPicker));

    if (initialOnly) {
      await sessRef.set({
        routing: 'case_eval',
        history: [serializeMsg(initial)],
        updatedAt: FieldValue.serverTimestamp(),
      });
      await send(formatAssistantReplyForWhatsapp(initial.content, initial.quickReplies));
      return;
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
      return;
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
    return;
  }

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
    return;
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
}

export async function POST(req: NextRequest) {
  const secret = process.env.NOTIFICASHUB_INBOUND_SECRET;
  if (!secret?.trim()) {
    console.error('[whatsapp/incoming] NOTIFICASHUB_INBOUND_SECRET no configurada');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const token = req.headers.get(notificasHubAuthHeaderName());
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
  if (!from) {
    return NextResponse.json({ error: 'Missing from' }, { status: 400 });
  }

  const tenantIdHub = process.env.NOTIFICASHUB_TENANT_ID?.trim();
  if (!tenantIdHub) {
    console.error('[whatsapp/incoming] NOTIFICASHUB_TENANT_ID no configurada');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const hubMessageId =
    typeof body.messageId === 'string' ? body.messageId : undefined;

  let claim: { status: 'new' | 'duplicate' | 'no_id'; ref: DocumentReference | null };
  try {
    claim = await claimInboundMessageId(hubMessageId);
  } catch (dedupErr) {
    console.error(
      '[whatsapp/incoming] dedup / Firestore falló; se sigue sin idempotencia',
      dedupErr,
    );
    claim = { status: 'no_id', ref: null };
  }

  if (claim.status === 'duplicate') {
    return NextResponse.json({ ok: true });
  }

  const dedupRef = claim.ref;

  const processWithDedupCleanup = async () => {
    try {
      await processWhatsAppInboundBody(body, {
        tenantIdHub,
        inboundSecret: secret,
      });
    } catch (err) {
      console.error('[whatsapp/incoming] process error', err);
      if (dedupRef) {
        try {
          await dedupRef.delete();
        } catch (delErr) {
          console.error('[whatsapp/incoming] dedup delete after failure', delErr);
        }
      }
    }
  };

  try {
    after(processWithDedupCleanup);
  } catch (afterErr) {
    console.error(
      '[whatsapp/incoming] after() falló; procesando en línea (sin cierre diferido)',
      afterErr,
    );
    await processWithDedupCleanup();
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
