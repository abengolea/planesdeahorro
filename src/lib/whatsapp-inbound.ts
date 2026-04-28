/**
 * Utilidades para el payload "meta" que reenvía NotificasHub a tenants.
 */

export type NotificasHubInboundBody = {
  message: Record<string, unknown>;
  from: string;
  contactName?: string;
  messageId: string;
  timestamp: string;
  tenantId: string;
  type: string;
};

export function normalizeWaPhoneDigits(from: string): string {
  return from.replace(/\D/g, '').replace(/^0+/, '');
}

export function waSessionIdFromPhone(digits: string): string {
  return `wa_${digits}`;
}

/** Extrae texto legible del objeto `message` de Meta (text / interactive). */
export function extractTextFromMetaMessage(message: Record<string, unknown>): string | null {
  const type = message.type;
  if (type === 'text') {
    const text = message.text as { body?: string } | undefined;
    const body = text?.body?.trim();
    return body || null;
  }
  if (type === 'interactive') {
    const inter = message.interactive as {
      type?: string;
      list_reply?: { id?: string; title?: string };
      button_reply?: { id?: string; title?: string };
    };
    if (inter?.type === 'list_reply' && inter.list_reply) {
      return (inter.list_reply.title || inter.list_reply.id || '').trim() || null;
    }
    if (inter?.type === 'button_reply' && inter.button_reply) {
      return (inter.button_reply.title || inter.button_reply.id || '').trim() || null;
    }
  }
  return null;
}

/** Atenúa markdown muy básico para WhatsApp. */
export function plainTextForWhatsapp(markdown: string): string {
  return markdown
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .trim();
}

/**
 * Si el usuario respondió solo con un índice (1–n) y el asistente había ofrecido opciones numeradas,
 * sustituye por el texto de la opción para que el modelo no confunda cantidad con elección.
 */
export function expandNumericQuickReplyChoice<T extends { role: string; content: string; quickReplies?: string[] }>(
  history: T[],
): T[] {
  if (history.length < 2) return history;
  const last = history[history.length - 1];
  const prev = history[history.length - 2];
  if (last.role !== 'user' || prev.role !== 'assistant') return history;

  const trimmed = last.content.trim();
  const numMatch = trimmed.match(/^(\d{1,2})$/);
  if (!numMatch) return history;
  const index = parseInt(numMatch[1], 10);
  if (index < 1 || index > 30) return history;

  let options = prev.quickReplies?.length ? [...prev.quickReplies] : null;
  if (!options?.length) {
    options = parseNumberedLinesFromAssistantText(prev.content);
  }
  if (!options?.length || index > options.length) return history;

  const chosen = options[index - 1];
  const out = history.slice(0, -1);
  out.push({ ...last, content: chosen });
  return out;
}

function parseNumberedLinesFromAssistantText(content: string): string[] | null {
  const lines = content.split(/\r?\n/);
  const found: string[] = [];
  for (const line of lines) {
    const m = line.trim().match(/^(\d{1,2})[\.\)]\s+(.+)$/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n === found.length + 1) {
        found.push(m[2].trim());
      }
    }
  }
  return found.length ? found : null;
}

export function formatAssistantReplyForWhatsapp(content: string, quickReplies?: string[]): string {
  let out = plainTextForWhatsapp(content);
  if (quickReplies?.length) {
    const lines = quickReplies.map((q, i) => `${i + 1}. ${q}`);
    out += '\n\n' + lines.join('\n');
    out += '\n\nPodés responder con el número o escribiendo la opción.';
  }
  return out;
}

/** Coincide con link wa.me/?text=EVAL+CASO+... o mensaje explícito del usuario. */
export function shouldSkipMenuForEvalIntent(raw: string): boolean {
  const t = raw.trim();
  if (!t) return false;
  const upper = t.toUpperCase();
  if (upper.includes('EVAL') && upper.includes('CASO')) return true;
  if (/evaluar\s+(mi\s+)?caso/i.test(t)) return true;
  return false;
}

export function isMenuChoiceEval(text: string): boolean {
  const t = text.trim().toLowerCase();
  return t === '1' || t === 'uno' || t.startsWith('1)') || t.startsWith('1.');
}

export function isMenuChoiceOther(text: string): boolean {
  const t = text.trim().toLowerCase();
  return t === '2' || t === 'dos' || t.startsWith('2)') || t.startsWith('2.');
}

export function isMenuReset(text: string): boolean {
  const t = text.trim().toLowerCase();
  return t === 'menu' || t === 'menú' || t === '0';
}

/** El hub ya enrutó al tenant; no hace falta el menú interno 1/2. */
export function isHubRoutedToUs(
  body: Record<string, unknown>,
  tenantIdHub: string,
): boolean {
  const id = typeof body.tenantId === 'string' ? body.tenantId.trim() : '';
  return Boolean(id && id === tenantIdHub.trim());
}

/** Respuestas cortas que no aportan contenido pero sí intención de seguir (evita loop con el menú). */
export function isTrivialAck(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  const acks = new Set([
    'ok',
    'okay',
    'okey',
    'dale',
    'bueno',
    'bien',
    'sí',
    'si',
    'listo',
    'perfecto',
    'gracias',
    'genial',
    'ahí',
    'ahi',
    'va',
    'vamos',
  ]);
  return acks.has(t);
}

/** Selección del listado del hub (p. ej. título "Planes de ahorro" o id planesdeahorro). */
export function isLikelyHubTenantPickerReply(
  text: string,
  message: Record<string, unknown>,
  tenantIdHub: string,
): boolean {
  const t = text.trim().toLowerCase();
  const tid = tenantIdHub.trim().toLowerCase();
  if (tid && (t === tid || t.includes(tid))) return true;
  if (t.includes('planes') && t.includes('ahorr')) return true;
  if (t.includes('bengolea') && t.includes('planes')) return true;

  if (message.type === 'interactive') {
    const inter = message.interactive as {
      type?: string;
      list_reply?: { id?: string; title?: string };
      button_reply?: { id?: string; title?: string };
    };
    const id =
      inter?.list_reply?.id?.trim().toLowerCase() ||
      inter?.button_reply?.id?.trim().toLowerCase() ||
      '';
    if (tid && id === tid) return true;
  }
  return false;
}
