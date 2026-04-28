import 'server-only';

import { getAdminFirestore } from '@/firebase/admin';
import type { DoctrinaArticle, Fallo } from '@/lib/types';

/** Tope global para no saturar el contexto del modelo. */
const MAX_TOTAL_CHARS = 72_000;
const MAX_FALLOS = 30;
const MAX_DOCTRINA = 30;
const MAX_EXCERPT_PER_ITEM = 5_000;

/**
 * Construye un bloque de texto con fallos y artículos de doctrina del sitio (colecciones `fallos` y `doctrina`)
 * para enriquecer prompts de IA en el panel. La lectura es vía Admin SDK (mismo criterio que el chat de evaluación + `knowledge_docs`).
 */
export async function buildAiSiteKnowledgeContext(): Promise<string> {
  try {
    const db = getAdminFirestore();
    const [fallosSnap, doctrinaSnap] = await Promise.all([
      db.collection('fallos').orderBy('date', 'desc').limit(MAX_FALLOS).get(),
      db.collection('doctrina').orderBy('publishDate', 'desc').limit(MAX_DOCTRINA).get(),
    ]);

    const parts: string[] = [];

    for (const d of fallosSnap.docs) {
      const f = d.data() as Fallo;
      const excerpt = (f.content ?? '').length > MAX_EXCERPT_PER_ITEM
        ? `${(f.content ?? '').slice(0, MAX_EXCERPT_PER_ITEM)}\n[…]`
        : f.content ?? '';
      parts.push(
        [
          `### Fallo: ${f.title || '(sin título)'}`,
          f.tribunal ? `Tribunal: ${f.tribunal}` : null,
          f.date ? `Fecha: ${f.date}` : null,
          `Publicado: ${f.published ? 'sí' : 'no'}`,
          f.tags?.length ? `Etiquetas: ${f.tags.join(', ')}` : null,
          f.summary ? `Resumen: ${f.summary}` : null,
          excerpt ? `Contenido (extracto): ${excerpt}` : null,
        ]
          .filter(Boolean)
          .join('\n')
      );
    }

    for (const d of doctrinaSnap.docs) {
      const a = d.data() as DoctrinaArticle;
      const excerpt = (a.content ?? '').length > MAX_EXCERPT_PER_ITEM
        ? `${(a.content ?? '').slice(0, MAX_EXCERPT_PER_ITEM)}\n[…]`
        : a.content ?? '';
      parts.push(
        [
          `### Doctrina: ${a.title || '(sin título)'}`,
          a.publishDate ? `Fecha: ${a.publishDate}` : null,
          `Publicado: ${a.published ? 'sí' : 'no'}`,
          a.authorName ? `Autor: ${a.authorName}` : null,
          a.tags?.length ? `Etiquetas: ${(a.tags ?? []).join(', ')}` : null,
          a.summary ? `Resumen: ${a.summary}` : null,
          excerpt ? `Contenido (extracto): ${excerpt}` : null,
        ]
          .filter(Boolean)
          .join('\n')
      );
    }

    if (parts.length === 0) {
      return '';
    }

    const full = `## Material de referencia del estudio (fallos y doctrina en Firestore, orden reciente; extractos, no el archivo completo)\n\n${parts.join(
      '\n\n---\n\n'
    )}`;

    if (full.length <= MAX_TOTAL_CHARS) {
      return full;
    }
    return `${full.slice(0, MAX_TOTAL_CHARS - 80)}\n\n[… Truncado por longitud máxima …]`;
  } catch (err) {
    console.error('[buildAiSiteKnowledgeContext]', err);
    return '';
  }
}
