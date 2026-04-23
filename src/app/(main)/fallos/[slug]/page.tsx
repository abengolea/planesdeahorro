'use client';

import { useParams } from 'next/navigation';
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, query, where, limit } from 'firebase/firestore';
import type { Fallo } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileDown, Gavel, Tag } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function RulingDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const adminDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'admin_users', user.uid);
  }, [firestore, user?.uid]);

  const { data: adminProfile, isLoading: adminDocLoading } = useDoc<{ id?: string }>(adminDocRef);
  const isAdmin = Boolean(user?.uid && adminProfile);

  const falloQuery = useMemoFirebase(() => {
    if (!firestore || !slug) return null;
    if (user?.uid && adminDocLoading) return null;
    if (isAdmin) {
      return query(collection(firestore, 'fallos'), where('slug', '==', slug), limit(1));
    }
    return query(
      collection(firestore, 'fallos'),
      where('slug', '==', slug),
      where('published', '==', true),
      limit(1),
    );
  }, [firestore, slug, user?.uid, adminDocLoading, isAdmin]);

  const { data: fallos, isLoading: fallosLoading, error: fallosError } = useCollection<Fallo>(falloQuery);
  const ruling = fallos?.[0];

  const loading =
    isUserLoading || (Boolean(user?.uid) && adminDocLoading) || fallosLoading;

  if (loading) {
    return (
      <div className="bg-card py-12 md:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-6" />
          <div className="space-y-4 mt-8">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (fallosError) {
    return (
      <div className="bg-card py-12 md:py-20">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <p className="text-muted-foreground mb-4">
            No se pudo cargar el fallo. Si acabás de desplegar índices de Firestore, esperá unos minutos y recargá.
          </p>
          <p className="text-sm font-mono text-destructive break-all">{String(fallosError.message)}</p>
          <Button asChild className="mt-6">
            <Link href="/fallos">Volver a Fallos</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!ruling) {
    return (
      <div className="bg-card py-12 md:py-20">
        <div className="container mx-auto px-4 max-w-lg text-center">
          <Gavel className="mx-auto h-10 w-10 text-muted-foreground/40 mb-4" />
          <h1 className="font-headline text-2xl font-bold text-foreground mb-2">Fallo no disponible</h1>
          <p className="text-sm text-muted-foreground mb-4">
            No hay un fallo publicado con esta dirección, o todavía no está visible para el público. Si
            acabás de crearlo, revisá en el panel que tenga <strong>Publicado</strong> activado.
          </p>
          <Button asChild>
            <Link href="/fallos">Volver a Fallos</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card py-12 md:py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <article className="prose lg:prose-xl max-w-none dark:prose-invert prose-headings:font-headline prose-headings:text-primary">
          <div className="mb-8">
            <div className="not-prose flex flex-wrap items-center gap-2 mb-3">
              {!ruling.published && (
                <Badge variant="secondary">Borrador (vista admin)</Badge>
              )}
            </div>
            <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary mb-4">{ruling.title}</h1>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Gavel className="h-4 w-4" />
                <span>{ruling.tribunal}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <time dateTime={ruling.date}>
                  {new Date(ruling.date).toLocaleDateString('es-AR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    timeZone: 'UTC',
                  })}
                </time>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              {ruling.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <p className="lead text-lg font-medium text-foreground">{ruling.summary}</p>

          {ruling.pdfUrl ? (
            <div className="mt-10 not-prose space-y-4">
              <div className="rounded-xl border border-border/80 bg-muted/20 shadow-inner overflow-hidden">
                <iframe
                  title={ruling.pdfFileName ?? 'Fallo en PDF'}
                  src={`${ruling.pdfUrl}#view=FitH`}
                  className="w-full min-h-[65vh] h-[70vh] md:min-h-[72vh] md:h-[78vh] bg-background"
                  loading="lazy"
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                <a
                  href={ruling.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-medium underline-offset-4 hover:underline inline-flex items-center justify-center gap-2"
                >
                  <FileDown className="h-4 w-4 shrink-0" />
                  Abrir el PDF en otra pestaña
                </a>
                {ruling.pdfFileName ? (
                  <span className="block mt-1 truncate" title={ruling.pdfFileName}>
                    {ruling.pdfFileName}
                  </span>
                ) : null}
              </p>
            </div>
          ) : null}

          {ruling.content?.trim() ? (
            <div className="whitespace-pre-wrap mt-8 not-prose">{ruling.content}</div>
          ) : null}
        </article>

        <div className="mt-12 text-center">
          <Button asChild>
            <Link href="/fallos">Volver a Fallos</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
