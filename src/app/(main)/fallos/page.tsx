'use client';

import Link from 'next/link';
import { ArrowRight, Gavel } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Fallo } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

function FalloCardSkeleton() {
  return (
    <div className="flex flex-col bg-card p-7">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-3 w-3 rounded-sm" />
        <Skeleton className="h-3 w-40 rounded-sm" />
      </div>
      <Skeleton className="h-6 w-3/4 mb-2 rounded-sm" />
      <Skeleton className="h-3 w-full mb-1.5 rounded-sm" />
      <Skeleton className="h-3 w-full mb-1.5 rounded-sm" />
      <Skeleton className="h-3 w-2/3 rounded-sm" />
      <Skeleton className="h-4 w-24 mt-6 rounded-sm" />
    </div>
  );
}

export default function RulingsPage() {
  const firestore = useFirestore();

  const fallosQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'fallos'),
      where('published', '==', true),
      orderBy('date', 'desc')
    );
  }, [firestore]);

  const { data: fallos, isLoading } = useCollection<Fallo>(fallosQuery);

  return (
    <div className="flex flex-col">
      {/* ── Page header ── */}
      <div className="bg-primary text-primary-foreground py-14 md:py-20 relative overflow-hidden">
        <div className="absolute left-0 top-0 w-[3px] h-full bg-accent hidden md:block" />
        <div className="container mx-auto px-6 md:px-8">
          <p className="text-accent text-[11px] font-medium tracking-[0.3em] uppercase mb-3">
            Jurisprudencia
          </p>
          <h1 className="font-headline text-4xl md:text-6xl font-bold leading-[1.05] max-w-3xl">
            Fallos y Jurisprudencia
          </h1>
          <div className="w-12 h-[2px] bg-accent mt-6" />
          <p className="text-white/65 mt-6 max-w-xl text-base leading-relaxed">
            Sentencias y medidas cautelares que sientan precedentes en la defensa de los derechos de los suscriptores.
          </p>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="bg-background py-14 md:py-20">
        <div className="container mx-auto px-4">

          {/* Loading */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
              <FalloCardSkeleton />
              <FalloCardSkeleton />
              <FalloCardSkeleton />
            </div>
          )}

          {/* Results */}
          {!isLoading && fallos && fallos.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
              {fallos.map((ruling) => (
                <Link
                  key={ruling.id}
                  href={`/fallos/${ruling.slug}`}
                  className="group flex flex-col bg-card p-7 hover:bg-secondary/40 transition-colors duration-200"
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                    <Gavel className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span className="truncate">{ruling.tribunal}</span>
                    <span className="shrink-0">·</span>
                    <span className="shrink-0">
                      {new Date(ruling.date).toLocaleDateString('es-AR', {
                        timeZone: 'UTC',
                        year: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                  <h2 className="font-headline text-xl font-bold text-foreground leading-snug mb-3">
                    {ruling.title}
                  </h2>
                  <p className="text-muted-foreground text-sm flex-grow leading-relaxed line-clamp-5">
                    {ruling.summary}
                  </p>
                  <div className="mt-6 flex items-center text-primary text-sm font-semibold gap-1.5 group-hover:gap-3 transition-all">
                    Ver detalle <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && (!fallos || fallos.length === 0) && (
            <div className="border border-border bg-card p-16 text-center">
              <Gavel className="mx-auto h-10 w-10 text-muted-foreground/40 mb-4" />
              <h3 className="font-headline text-xl font-bold text-foreground mb-2">
                No hay fallos publicados
              </h3>
              <p className="text-sm text-muted-foreground">
                Próximamente se agregarán nuevos fallos y jurisprudencia relevante.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
