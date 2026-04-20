'use server';

import { randomBytes } from 'node:crypto';
import { getAdminBucket, requireAdminSession } from '@/firebase/admin';

const PDF_MAX_BYTES = 12 * 1024 * 1024;
const PDF_NAME = 'original.pdf';

function isAllowedFalloPdfPath(fullPath: string): boolean {
  return /^fallos\/[^/]+\/original\.pdf$/.test(fullPath);
}

export type FalloPdfUploadResult =
  | { ok: true; path: string; url: string; fileName: string }
  | { ok: false; error: string };

/**
 * Sube el PDF al bucket con Admin SDK (sin XMLHttpRequest/CORS en el navegador).
 */
export async function uploadFalloPdfAdminAction(
  idToken: string,
  falloId: string,
  formData: FormData,
): Promise<FalloPdfUploadResult> {
  try {
    await requireAdminSession(idToken);
  } catch {
    return { ok: false, error: 'Sesión inválida o sin permisos de administrador.' };
  }

  if (!falloId?.trim()) {
    return { ok: false, error: 'Identificador de fallo inválido.' };
  }

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'Seleccioná un archivo PDF.' };
  }
  if (file.size > PDF_MAX_BYTES) {
    return { ok: false, error: 'El PDF supera el máximo de 12 MB.' };
  }
  const mime = file.type?.toLowerCase() ?? '';
  const nameLower = file.name?.toLowerCase() ?? '';
  if (mime !== 'application/pdf' && !nameLower.endsWith('.pdf')) {
    return { ok: false, error: 'El archivo debe ser un PDF (.pdf).' };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const objectPath = `fallos/${falloId}/${PDF_NAME}`;
    const bucket = getAdminBucket();
    const gcsFile = bucket.file(objectPath);
    const token = randomBytes(32).toString('hex');

    await gcsFile.save(buffer, {
      resumable: false,
      metadata: {
        contentType: 'application/pdf',
        metadata: {
          firebaseStorageDownloadTokens: token,
        },
      },
    });

    const encodedPath = encodeURIComponent(objectPath);
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${token}`;

    return {
      ok: true,
      path: objectPath,
      url,
      fileName: file.name || 'documento.pdf',
    };
  } catch (e) {
    console.error('[uploadFalloPdfAdminAction]', e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'No se pudo subir el PDF al almacenamiento.',
    };
  }
}

export type FalloPdfDeleteResult = { ok: true } | { ok: false; error: string };

export async function deleteFalloPdfAdminAction(
  idToken: string,
  fullPath: string,
): Promise<FalloPdfDeleteResult> {
  try {
    await requireAdminSession(idToken);
  } catch {
    return { ok: false, error: 'Sesión inválida o sin permisos de administrador.' };
  }

  if (!isAllowedFalloPdfPath(fullPath)) {
    return { ok: false, error: 'Ruta de archivo no permitida.' };
  }

  try {
    await getAdminBucket().file(fullPath).delete({ ignoreNotFound: true });
    return { ok: true };
  } catch (e) {
    console.error('[deleteFalloPdfAdminAction]', e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'No se pudo eliminar el PDF.',
    };
  }
}
