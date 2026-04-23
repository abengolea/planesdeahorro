import 'server-only';
import type { DocumentData } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/firebase/admin';
import type { DoctrinaArticle } from '@/lib/types';

function toPlainDoctrina(id: string, data: DocumentData): DoctrinaArticle {
  return {
    id,
    slug: data.slug,
    title: data.title,
    summary: data.summary,
    content: data.content,
    authorId: data.authorId,
    authorName: data.authorName,
    publishDate: data.publishDate,
    tags: data.tags,
    published: data.published,
    pdfUrl: data.pdfUrl,
    pdfStoragePath: data.pdfStoragePath,
    pdfFileName: data.pdfFileName,
  };
}

/**
 * Carga pública vía Admin SDK: una sola cláusula `where` sobre `slug` (índice simple),
 * luego se verifica `published` en código. Así se evita depender del índice compuesto
 * `slug` + `published` que, si no está desplegado, falla el snapshot del cliente
 * aunque el listado (otro índice) funcione.
 */
export type DoctrinaPublicLoadResult =
  | { mode: 'doc'; article: DoctrinaArticle }
  | { mode: 'none' }
  | { mode: 'client_fallback' };

export async function loadDoctrinaPublicBySlug(slug: string): Promise<DoctrinaPublicLoadResult> {
  try {
    const db = getAdminFirestore();
    const snap = await db.collection('doctrina').where('slug', '==', slug).limit(1).get();
    if (snap.empty) {
      return { mode: 'none' };
    }
    const d = snap.docs[0];
    const data = d.data();
    if (data.published !== true) {
      return { mode: 'none' };
    }
    return { mode: 'doc', article: toPlainDoctrina(d.id, data) };
  } catch (e) {
    console.warn('[doctrina] carga vía Admin no disponible, se usa Firestore en el cliente', e);
    return { mode: 'client_fallback' };
  }
}
