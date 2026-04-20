'use client';

import Link from 'next/link';
import { ArrowRight, FileText } from 'lucide-react';
import { doctrinalArticles } from '@/lib/data';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, orderBy, query, where } from 'firebase/firestore';
import type { DoctrinaArticle } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

function CardSkeleton() {
  return (
    <div className="flex flex-col bg-card p-7">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-3 w-3 rounded-sm" />
        <Skeleton className="h-3 w-32 rounded-sm" />
      </div>
      <Skeleton className="h-6 w-4/5 mb-2 rounded-sm" />
      <Skeleton className="h-3 w-full mb-1.5 rounded-sm" />
      <Skeleton className="h-3 w-full mb-1.5 rounded-sm" />
      <Skeleton className="h-3 w-3/4 rounded-sm" />
      <Skeleton className="h-4 w-24 mt-6 rounded-sm" />
    </div>
  );
}

export function DoctrineListClient() {
  const firestore = useFirestore();
  const publishedQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'doctrina'),
      where('published', '==', true),
      orderBy('publishDate', 'desc')
    );
  }, [firestore]);

  const { data: fromDb, isLoading } = useCollection<DoctrinaArticle>(publishedQuery);

  const showFirestore = !isLoading && fromDb && fromDb.length > 0;
  const articles = showFirestore
    ? fromDb.map((a) => ({
        key: a.id,
        slug: a.slug,
        title: a.title,
        summary: a.summary,
        authorLabel: a.authorName,
        date: a.publishDate,
      }))
    : doctrinalArticles.map((a) => ({
        key: a.slug,
        slug: a.slug,
        title: a.title,
        summary: a.summary,
        authorLabel: a.author,
        date: a.date,
      }));

  return (
    <div className="flex flex-col">
      {/* ── Page header ── */}
      <div className="bg-primary text-primary-foreground py-14 md:py-20 relative overflow-hidden">
        <div className="absolute left-0 top-0 w-[3px] h-full bg-accent hidden md:block" />
        <div className="container mx-auto px-6 md:px-8">
          <p className="text-accent text-[11px] font-medium tracking-[0.3em] uppercase mb-3">
            Recursos
          </p>
          <h1 className="font-headline text-4xl md:text-6xl font-bold leading-[1.05] max-w-3xl">
            Doctrina y Artículos
          </h1>
          <div className="w-12 h-[2px] bg-accent mt-6" />
          <p className="text-white/65 mt-6 max-w-xl text-base leading-relaxed">
            Análisis sobre los aspectos legales y controversiales de los planes de ahorro en Argentina.
          </p>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="bg-background py-14 md:py-20">
        <div className="container mx-auto px-4">

          {!isLoading && !showFirestore && (
            <p className="text-sm text-muted-foreground mb-8 border-l-2 border-accent pl-4">
              Mostrando artículos de ejemplo hasta que publique contenido desde el panel de administración.
            </p>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          )}

          {/* Results */}
          {!isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
              {articles.map((article) => (
                <Link
                  key={article.key}
                  href={`/doctrina/${article.slug}`}
                  className="group flex flex-col bg-card p-7 hover:bg-secondary/40 transition-colors duration-200"
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                    <FileText className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span>{article.authorLabel}</span>
                    <span>·</span>
                    <span className="shrink-0">
                      {new Date(article.date).toLocaleDateString('es-AR', {
                        year: 'numeric',
                        month: 'long',
                      })}
                    </span>
                  </div>
                  <h2 className="font-headline text-xl font-bold text-foreground leading-snug mb-3">
                    {article.title}
                  </h2>
                  <p className="text-muted-foreground text-sm flex-grow leading-relaxed line-clamp-5">
                    {article.summary}
                  </p>
                  <div className="mt-6 flex items-center text-primary text-sm font-semibold gap-1.5 group-hover:gap-3 transition-all">
                    Leer artículo <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
