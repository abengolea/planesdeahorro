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
