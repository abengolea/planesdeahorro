/**
 * URL pública del sitio (enlaces en correos y portal del cliente).
 * Preferí definir `NEXT_PUBLIC_APP_URL` en producción (ej. https://tudominio.com).
 */
export function getPublicAppUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, '')}`;

  return 'http://localhost:9002';
}
