/**
 * Prueba de envío con Resend (misma API que `src/lib/send-email.ts`).
 *
 * Uso:
 *   npx tsx scripts/test-resend.ts
 *   npx tsx scripts/test-resend.ts otro@correo.com
 *
 * Requiere `RESEND_API_KEY` en `.env.local`. Opcional: `RESEND_CLIENT_FROM` o `RESEND_FROM_EMAIL`
 * (si no, usa onboarding@resend.dev; con ese remitente Resend solo permite destinatarios de prueba de la cuenta).
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { Resend } from 'resend';
import { wrapEmailHtml } from '../src/lib/email-layout';

config({ path: resolve(process.cwd(), '.env.local') });

const DEFAULT_TO = 'abengolea1@gmail.com';
const FALLBACK_FROM = 'onboarding@resend.dev';

function fromEmail(): string {
  return (
    process.env.RESEND_CLIENT_FROM?.trim() ||
    process.env.RESEND_FROM_EMAIL?.trim() ||
    FALLBACK_FROM
  );
}

async function main() {
  const to = (process.argv[2] || DEFAULT_TO).trim();
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    console.error('Falta RESEND_API_KEY en .env.local');
    process.exit(1);
  }

  const from = fromEmail();
  const resend = new Resend(apiKey);

  console.log('Enviando prueba…');
  console.log('  from:', from);
  console.log('  to:  ', to);

  const inner = `
    <p style="margin:0 0 14px;">Correo de prueba con la plantilla del sitio (cabecera, tipografías Inter / EB Garamond y firma).</p>
    <p style="margin:0;font-size:13px;color:#5a6370;">${new Date().toISOString()}</p>
  `;
  const html = wrapEmailHtml(inner, {
    variant: 'client',
    preheader: 'Prueba de plantilla — planes de ahorro',
  });

  const { data, error } = await resend.emails.send({
    from: `Dr. Adrián Bengolea <${from}>`,
    to: [to],
    subject: `[planesdeahorro] Prueba plantilla ${new Date().toISOString()}`,
    html,
  });

  if (error) {
    console.error('Resend error:', error);
    process.exit(1);
  }

  console.log('OK. id:', data?.id);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
