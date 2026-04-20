/**
 * Otorga permisos de admin en Firestore (colección admin_users) por email.
 * Requiere cuenta de servicio: FIREBASE_SERVICE_ACCOUNT_PATH o FIREBASE_SERVICE_ACCOUNT_JSON (ver src/firebase/admin.ts).
 *
 * Uso: npx tsx scripts/grant-admin.ts correo@ejemplo.com
 */
import { config } from 'dotenv';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

config({ path: resolve(process.cwd(), '.env.local') });

function loadServiceAccountJson(): Record<string, string> {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (inline) {
    return JSON.parse(inline) as Record<string, string>;
  }
  const pathFromEnv =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim() ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (!pathFromEnv) {
    throw new Error(
      'Definí FIREBASE_SERVICE_ACCOUNT_PATH o FIREBASE_SERVICE_ACCOUNT_JSON en .env.local (misma credencial que usa el Admin SDK en servidor).',
    );
  }
  const raw = readFileSync(resolve(pathFromEnv), 'utf8');
  return JSON.parse(raw) as Record<string, string>;
}

function getAdminApp() {
  const existing = getApps()[0];
  if (existing) return existing;
  const parsed = loadServiceAccountJson();
  return initializeApp({
    credential: cert({
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKey: parsed.private_key?.replace(/\\n/g, '\n'),
    }),
  });
}

async function main() {
  const email = (process.argv[2] || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    console.error('Uso: npx tsx scripts/grant-admin.ts correo@ejemplo.com');
    process.exit(1);
  }

  const app = getAdminApp();
  const auth = getAuth(app);
  const db = getFirestore(app);

  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch (e: unknown) {
    const code = e && typeof e === 'object' && 'code' in e ? String((e as { code: string }).code) : '';
    if (code === 'auth/user-not-found') {
      console.error(
        `No hay usuario en Firebase Auth con ese email. Creá la cuenta primero (Auth → Users → Add user) y volvé a ejecutar.`,
      );
      process.exit(1);
    }
    throw e;
  }

  const uid = user.uid;
  const ref = db.collection('admin_users').doc(uid);
  await ref.set(
    {
      id: uid,
      email,
      grantedAt: new Date().toISOString(),
    },
    { merge: true },
  );

  console.log(`Listo: ${email} (uid=${uid}) tiene documento admin_users/${uid}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
