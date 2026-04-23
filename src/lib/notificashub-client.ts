/**
 * Envío de mensajes salientes vía NotificasHub (POST /api/whatsapp/send).
 *
 * Variables:
 * - NOTIFICASHUB_URL: base pública del hub (sin trailing slash), ej. https://notificas.example.com
 * - NOTIFICASHUB_TENANT_ID: id del tenant en Firestore del hub (ej. planesdeahorro)
 * - NOTIFICASHUB_INBOUND_AUTH_HEADER (opcional): nombre del header si el tenant usa internalAuthHeader en el hub (default x-internal-token)
 * El token debe ser el internalSecret de ese tenant (mismo valor que valida el inbound acá).
 */
export function notificasHubAuthHeaderName(): string {
  return process.env.NOTIFICASHUB_INBOUND_AUTH_HEADER?.trim() || 'x-internal-token';
}

export async function sendTextViaNotificasHub(params: {
  to: string;
  text: string;
  tenantId: string;
  internalSecret: string;
}): Promise<{ ok: boolean; status: number; bodySnippet: string }> {
  const base = process.env.NOTIFICASHUB_URL?.replace(/\/$/, '');
  if (!base) {
    console.error('[notificashub] NOTIFICASHUB_URL no configurada');
    return { ok: false, status: 0, bodySnippet: 'missing NOTIFICASHUB_URL' };
  }

  const url = `${base}/api/whatsapp/send`;
  const authHeader = notificasHubAuthHeaderName();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      [authHeader]: params.internalSecret,
    },
    body: JSON.stringify({
      to: params.to,
      text: params.text,
      tenantId: params.tenantId,
    }),
  });

  const text = await res.text();
  return {
    ok: res.ok,
    status: res.status,
    bodySnippet: text.slice(0, 500),
  };
}
