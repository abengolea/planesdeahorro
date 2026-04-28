/**
 * Simula el POST que hace NotificasHub a /api/whatsapp/incoming (mismo contrato que en prod).
 * Sirve para probar que TU backend responde bien con CUALQUIER número en `from`.
 *
 * NO prueba el enrutamiento del hub (si un número sin membresía llega o no al webhook);
 * para eso hay que configurar DEFAULT_INBOUND_TENANT_ID en el hub o mirar logs del hub.
 *
 * Uso:
 *   npx tsx scripts/test-whatsapp-incoming.ts
 *   npx tsx scripts/test-whatsapp-incoming.ts 5493511122333
 *   npx tsx scripts/test-whatsapp-incoming.ts 5493511122333 "EVAL CASO"
 *
 * Requiere en `.env.local`:
 *   NOTIFICASHUB_INBOUND_SECRET, NOTIFICASHUB_TENANT_ID (ej. planesdeahorro)
 * Opcional: NOTIFICASHUB_INBOUND_AUTH_HEADER
 *
 * URL del endpoint (una de las dos):
 *   WHATSAPP_INCOMING_TEST_URL=https://adrianbengolea.com.ar/api/whatsapp/incoming
 *   o WHATSAPP_INCOMING_TEST_BASE=http://127.0.0.1:9002  (sin path; se agrega /api/whatsapp/incoming)
 *
 * Para probar en local: `npm run dev` en paralelo y WHATSAPP_INCOMING_TEST_BASE=http://127.0.0.1:9002
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { notificasHubAuthHeaderName } from '../src/lib/notificashub-client';

config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local'), override: true });

const DEFAULT_FROM = '5491199998888';

function resolveIncomingUrl(): string {
  const full = process.env.WHATSAPP_INCOMING_TEST_URL?.trim();
  if (full) return full.replace(/\/$/, '');

  const base = (
    process.env.WHATSAPP_INCOMING_TEST_BASE?.trim() || 'http://127.0.0.1:9002'
  ).replace(/\/$/, '');
  return `${base}/api/whatsapp/incoming`;
}

async function main() {
  const from = (process.argv[2] || DEFAULT_FROM).trim();
  const userBody = (process.argv[3] || 'MENU').trim();

  const secret = process.env.NOTIFICASHUB_INBOUND_SECRET?.trim();
  const tenantId = process.env.NOTIFICASHUB_TENANT_ID?.trim();
  const url = resolveIncomingUrl();
  const authHeader = notificasHubAuthHeaderName();

  if (!secret) {
    console.error('Falta NOTIFICASHUB_INBOUND_SECRET en .env.local');
    process.exit(1);
  }
  if (!tenantId) {
    console.error('Falta NOTIFICASHUB_TENANT_ID en .env.local');
    process.exit(1);
  }

  const messageId = `script-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const payload = {
    from,
    messageId,
    tenantId,
    type: 'text',
    message: {
      type: 'text',
      text: { body: userBody },
    },
  };

  console.log('POST', url);
  console.log('Header', authHeader, '(valor oculto)');
  console.log('from:', from, '| tenantId:', tenantId, '| text:', JSON.stringify(userBody));

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      [authHeader]: secret,
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  console.log('---');
  console.log(res.status, text.slice(0, 800));

  if (!res.ok) {
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
