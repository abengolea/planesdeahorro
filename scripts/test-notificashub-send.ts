/**
 * Prueba de envío saliente al NotificasHub (POST /api/whatsapp/send), mismo contrato que en producción.
 *
 * Uso:
 *   npx tsx scripts/test-notificashub-send.ts
 *   npx tsx scripts/test-notificashub-send.ts 5493364645357
 *   npx tsx scripts/test-notificashub-send.ts 5493364645357 "Mensaje custom"
 *
 * Requiere en `.env.local`:
 *   NOTIFICASHUB_URL, NOTIFICASHUB_TENANT_ID, NOTIFICASHUB_INBOUND_SECRET
 * Opcional: NOTIFICASHUB_SEND_SECRET, NOTIFICASHUB_INBOUND_AUTH_HEADER
 *
 * El número por defecto es 5493364645357 (tu prueba 3364645357 en formato habitual AR para WhatsApp).
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { notificasHubAuthHeaderName, sendTextViaNotificasHub } from '../src/lib/notificashub-client';

// `.env.local` tiene prioridad sobre `.env` (mismo criterio que Next).
config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local'), override: true });

const DEFAULT_TO = '5493364645357';
const DEFAULT_TEXT = 'Prueba local planesdeahorro → NotificasHub (scripts/test-notificashub-send.ts)';

async function main() {
  const to = (process.argv[2] || DEFAULT_TO).trim();
  const text = (process.argv[3] || DEFAULT_TEXT).trim();

  const tenantId = process.env.NOTIFICASHUB_TENANT_ID?.trim();
  const inbound = process.env.NOTIFICASHUB_INBOUND_SECRET?.trim();
  const secret = process.env.NOTIFICASHUB_SEND_SECRET?.trim() || inbound;
  const base = process.env.NOTIFICASHUB_URL?.replace(/\/$/, '');

  if (!base) {
    console.error(
      'Falta NOTIFICASHUB_URL. Agregala en .env.local (base del hub, sin / final). Ver .env.example'
    );
    process.exit(1);
  }
  if (!tenantId) {
    console.error('Falta NOTIFICASHUB_TENANT_ID en .env.local (ej. planesdeahorro). Ver .env.example');
    process.exit(1);
  }
  if (!secret) {
    console.error(
      'Falta NOTIFICASHUB_INBOUND_SECRET en .env.local (internalSecret del tenant en el hub). Ver .env.example'
    );
    process.exit(1);
  }

  console.log('Hub:', `${base}/api/whatsapp/send`);
  console.log('Tenant:', tenantId);
  console.log('Header auth:', notificasHubAuthHeaderName());
  console.log('To:', to);
  console.log('---');

  const r = await sendTextViaNotificasHub({
    to,
    text,
    tenantId,
    internalSecret: secret,
  });

  if (r.ok) {
    console.log('[OK]', r.status, r.bodySnippet || '(cuerpo vacío)');
    // No usar process.exit(0) aquí: en Windows + tsx suele disparar assert de libuv tras fetch.
    return;
  }

  console.error('[ERROR]', r.status, r.bodySnippet);
  process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
