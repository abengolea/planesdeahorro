'use client';

import { FirebaseError } from 'firebase/app';
import type { User } from 'firebase/auth';

const RETRYABLE_CODES = new Set([
  'auth/network-request-failed',
  'auth/internal-error',
  'auth/timeout',
]);

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Obtiene el ID token para llamadas a server actions, con reintentos ante fallos de red intermitentes.
 */
export async function getIdTokenWithRetry(
  user: User,
  options?: { maxRetries?: number; forceRefresh?: boolean }
): Promise<string> {
  const maxRetries = options?.maxRetries ?? 3;
  const forceRefresh = options?.forceRefresh ?? false;
  let lastError: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await user.getIdToken(forceRefresh);
    } catch (e) {
      lastError = e;
      const code = e instanceof FirebaseError ? e.code : '';
      if (attempt < maxRetries - 1 && RETRYABLE_CODES.has(code)) {
        await sleep(400 * (attempt + 1));
        continue;
      }
      throw e;
    }
  }
  throw lastError;
}

export function describeFirebaseClientAuthError(error: unknown): string {
  if (error instanceof FirebaseError) {
    if (error.code === 'auth/network-request-failed') {
      return 'No se pudo conectar con el servicio de inicio de sesión. Revisá la conexión a internet, probá otra red, desactivá VPN o bloqueadores de anuncios que corten Google, y reintentá.';
    }
    if (error.code === 'auth/timeout') {
      return 'La conexión tardó demasiado. Intentá de nuevo en unos segundos.';
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Intentá de nuevo.';
}
