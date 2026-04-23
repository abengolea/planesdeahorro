import { createHmac, timingSafeEqual } from 'node:crypto';

const TOKEN_VERSION = 1;
const DEFAULT_TTL_SEC = 60 * 60 * 24 * 45; // 45 días

function base64UrlEncode(data: Buffer | string): string {
  const buf = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecodeToBuffer(s: string): Buffer | null {
  try {
    const pad = 4 - (s.length % 4);
    const b64 = (pad === 4 ? s : s + '='.repeat(pad)).replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(b64, 'base64');
  } catch {
    return null;
  }
}

function getSecret(): string | null {
  const s = process.env.CLIENT_PORTAL_INVITE_SECRET?.trim();
  return s && s.length >= 16 ? s : null;
}

/**
 * Firma un token de invitación al portal (HMAC-SHA256).
 * Requiere `CLIENT_PORTAL_INVITE_SECRET` (mín. 16 caracteres).
 */
export function signClientPortalInvite(evaluationId: string, ttlSec = DEFAULT_TTL_SEC): string | null {
  const secret = getSecret();
  if (!secret) {
    console.warn(
      '[client-portal] CLIENT_PORTAL_INVITE_SECRET no definido o demasiado corto; no se genera enlace de invitación.',
    );
    return null;
  }

  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const payload = JSON.stringify({ e: evaluationId, exp, v: TOKEN_VERSION });
  const payloadPart = base64UrlEncode(payload);
  const sig = createHmac('sha256', secret).update(payloadPart).digest();
  const sigPart = base64UrlEncode(sig);
  return `${payloadPart}.${sigPart}`;
}

export type VerifiedInvite = { evaluationId: string };

/**
 * Verifica el token y devuelve el id de evaluación, o `null` si es inválido o venció.
 */
export function verifyClientPortalInvite(token: string): VerifiedInvite | null {
  const secret = getSecret();
  if (!secret || !token?.trim()) return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadPart, sigPart] = parts;
  const sigBuf = base64UrlDecodeToBuffer(sigPart);
  if (!sigBuf) return null;

  const expected = createHmac('sha256', secret).update(payloadPart).digest();
  if (sigBuf.length !== expected.length || !timingSafeEqual(sigBuf, expected)) {
    return null;
  }

  const payloadJson = base64UrlDecodeToBuffer(payloadPart)?.toString('utf8');
  if (!payloadJson) return null;

  let parsed: { e?: string; exp?: number; v?: number };
  try {
    parsed = JSON.parse(payloadJson) as { e?: string; exp?: number; v?: number };
  } catch {
    return null;
  }

  if (parsed.v !== TOKEN_VERSION || typeof parsed.e !== 'string' || !parsed.e.trim()) return null;
  if (typeof parsed.exp !== 'number' || parsed.exp < Math.floor(Date.now() / 1000)) return null;

  return { evaluationId: parsed.e.trim() };
}
