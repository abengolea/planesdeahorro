import 'server-only';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { firebaseConfig } from '@/firebase/config';

function loadServiceAccountJson(): Record<string, string> {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (inline) {
    try {
      return JSON.parse(inline) as Record<string, string>;
    } catch {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON no es JSON válido.');
    }
  }

  const pathFromEnv =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim() ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();

  if (pathFromEnv) {
    const absolute = resolve(pathFromEnv);
    try {
      const raw = readFileSync(absolute, 'utf8');
      return JSON.parse(raw) as Record<string, string>;
    } catch (e) {
      throw new Error(
        `No se pudo leer la cuenta de servicio en "${absolute}". Comprobá FIREBASE_SERVICE_ACCOUNT_PATH o GOOGLE_APPLICATION_CREDENTIALS.`,
        { cause: e },
      );
    }
  }

  throw new Error(
    'Falta credencial de Admin SDK: definí FIREBASE_SERVICE_ACCOUNT_PATH (ruta al .json) o FIREBASE_SERVICE_ACCOUNT_JSON en `.env.local`.',
  );
}

/**
 * App Admin SDK (solo servidor).
 */
export function getAdminApp(): App {
  const existing = getApps()[0];
  if (existing) {
    return existing;
  }

  const parsed = loadServiceAccountJson();

  return initializeApp({
    credential: cert({
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKey: parsed.private_key?.replace(/\\n/g, '\n'),
    }),
  });
}

export function getAdminFirestore() {
  return getFirestore(getAdminApp());
}

/**
 * Nombre del bucket GCS usado por Firebase Storage.
 * Override: `FIREBASE_STORAGE_BUCKET` en `.env.local` si en la consola ves otro ID.
 */
export function resolveStorageBucketName(): string {
  const fromEnv = process.env.FIREBASE_STORAGE_BUCKET?.trim();
  if (fromEnv) return fromEnv;
  return firebaseConfig.storageBucket;
}

/** Bucket de Storage (mismo `storageBucket` que el cliente). La subida vía Admin no pasa por CORS del navegador. */
export function getAdminBucket() {
  return getStorage(getAdminApp()).bucket(resolveStorageBucketName());
}

/**
 * Valida el ID token de Firebase Auth y comprueba si el UID tiene documento en admin_users.
 * No depende de las reglas de seguridad del cliente.
 */
export async function verifySessionIsAdmin(idToken: string): Promise<{ uid: string; admin: boolean }> {
  const decoded = await getAuth(getAdminApp()).verifyIdToken(idToken);
  const snap = await getAdminFirestore().collection('admin_users').doc(decoded.uid).get();
  return { uid: decoded.uid, admin: snap.exists };
}

/**
 * Igual que la verificación del panel: exige token válido y documento en `admin_users`.
 * Para usar en Server Actions que modifican datos sensibles.
 */
export async function requireAdminSession(
  idToken: string,
): Promise<{ uid: string; email: string | null }> {
  const decoded = await getAuth(getAdminApp()).verifyIdToken(idToken);
  const snap = await getAdminFirestore().collection('admin_users').doc(decoded.uid).get();
  if (!snap.exists) {
    throw new Error('No autorizado: se requiere cuenta de administrador.');
  }
  return { uid: decoded.uid, email: decoded.email ?? null };
}
