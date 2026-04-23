'use server';

import { FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp, getAdminFirestore } from '@/firebase/admin';
import { verifyClientPortalInvite } from '@/lib/client-portal-token';

export type LinkClientCaseResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Vincula la cuenta de Firebase Auth del cliente con el expediente indicado en el token de invitación.
 * Exige que el email de la cuenta coincida con el del caso y que el caso esté en estado `aceptado`.
 */
export async function linkClientCaseToAccount(
  idToken: string,
  inviteToken: string,
): Promise<LinkClientCaseResult> {
  const trimmedInvite = inviteToken?.trim();
  if (!trimmedInvite) {
    return { ok: false, error: 'Falta el enlace de invitación. Abrí el link que recibiste por correo.' };
  }

  const parsed = verifyClientPortalInvite(trimmedInvite);
  if (!parsed) {
    return {
      ok: false,
      error: 'El enlace expiró o no es válido. Si necesitás uno nuevo, escribinos al estudio.',
    };
  }

  let decodedUid: string;
  let email: string | null;
  try {
    const decoded = await getAuth(getAdminApp()).verifyIdToken(idToken);
    decodedUid = decoded.uid;
    email = decoded.email?.trim().toLowerCase() ?? null;
  } catch {
    return { ok: false, error: 'No pudimos validar tu sesión. Volvé a iniciar sesión e intentá de nuevo.' };
  }

  if (!email) {
    return { ok: false, error: 'Tu cuenta debe tener un correo electrónico asociado.' };
  }

  const db = getAdminFirestore();
  const ref = db.collection('case_evaluations').doc(parsed.evaluationId);
  const snap = await ref.get();
  if (!snap.exists) {
    return { ok: false, error: 'No encontramos ese expediente.' };
  }

  const data = snap.data() as {
    email?: string;
    status?: string;
    clientPortalUid?: string;
  };

  const caseEmail = String(data.email ?? '').trim().toLowerCase();
  if (caseEmail !== email) {
    return {
      ok: false,
      error:
        'El correo de tu cuenta no coincide con el de esta consulta. Usá la misma dirección con la que completaste el formulario o el chat.',
    };
  }

  const existing = data.clientPortalUid?.trim();
  if (existing && existing !== decodedUid) {
    return {
      ok: false,
      error: 'Este expediente ya está vinculado a otra cuenta. Si no fuiste vos, contactá al estudio.',
    };
  }

  const status = String(data.status ?? '').trim();
  if (status !== 'aceptado' && !existing) {
    return {
      ok: false,
      error: 'El portal solo se activa cuando el estudio aceptó la consulta. Si recibiste este enlace por error, avisános.',
    };
  }

  if (existing === decodedUid) {
    await db
      .collection('client_portal_profiles')
      .doc(decodedUid)
      .set(
        {
          evaluationIds: FieldValue.arrayUnion(parsed.evaluationId),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    return { ok: true };
  }

  const batch = db.batch();
  batch.set(
    ref,
    {
      clientPortalUid: decodedUid,
      clientPortalLinkedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  batch.set(
    db.collection('client_portal_profiles').doc(decodedUid),
    {
      evaluationIds: FieldValue.arrayUnion(parsed.evaluationId),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  await batch.commit();

  await ref.collection('expediente_movimientos').add({
    createdAt: FieldValue.serverTimestamp(),
    tipo: 'cliente',
    titulo: 'Portal activado',
    detalle: 'Se registró el acceso al área de cliente para este expediente.',
  });

  return { ok: true };
}
