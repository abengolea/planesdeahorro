/**
 * Prueba de envío saliente vía NotificasHub hacia un número que NO debería estar
 * registrado en el hub (sin fila en user_memberships / contactos del tenant).
 *
 * Sirve para ver si el hub bloquea, devuelve error o entrega igual a Meta/WhatsApp.
 *
 * Uso:
 *   npm run test-notificashub-send-unregistered
 *   npx tsx scripts/test-notificashub-send-unregistered.ts
 *   npx tsx scripts/test-notificashub-send-unregistered.ts 5493511122333
 *   npx tsx scripts/test-notificashub-send-unregistered.ts 5493511122333 "Texto de prueba"
 *
 * Override por env (opcional):
 *   NOTIFICASHUB_SEND_TEST_UNREGISTERED_TO=5493511122333
 *
 * Requiere en `.env.local`: NOTIFICASHUB_URL, NOTIFICASHUB_TENANT_ID, NOTIFICASHUB_INBOUND_SECRET
 * (mismo criterio que scripts/test-notificashub-send.ts).
 *
 * Nota: el flujo ENTRANTE “usuario no registrado en el hub” no se prueba acá (eso pasa por el
 * webhook del hub → tenant). Para pegarle directo a planesdeahorro con un `from` cualquiera usá
 * scripts/test-whatsapp-incoming.ts.
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { notificasHubAuthHeaderName, sendTextViaNotificasHub } from '../src/lib/notificashub-client';

config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local'), override: true });

/** Número ficticio AR; no usar uno real de clientes si no querés molestar. */
const DEFAULT_UNREGISTERED_TO = '5491199998888';

const DEFAULT_TEXT =
  'Prueba hub: destino sin membresía esperada (scripts/test-notificashub-send-unregistered.ts)';

async function main() {
  const argvTo = process.argv[2]?.trim();
  const argvText = process.argv[3]?.trim();

  const to =
    argvTo ||
    process.env.NOTIFICASHUB_SEND_TEST_UNREGISTERED_TO?.trim() ||
    DEFAULT_UNREGISTERED_TO;
  const text = argvText || DEFAULT_TEXT;

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

  console.log('Escenario: envío saliente a número que asumimos SIN registro en NotificasHub.');
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
    console.log(
      'Si el hub filtra por membresía y aun así devolvió OK, revisá en el hub si realmente entregó a Meta o solo aceptó la petición.'
    );
    return;
  }

  console.error('[ERROR]', r.status, r.bodySnippet);
  console.error(
    'Si es 403/404 con mensaje de “no registrado” u similar, el origen probablemente es lógica del hub, no planesdeahorro.'
  );
  process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
