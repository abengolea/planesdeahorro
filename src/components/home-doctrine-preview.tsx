'use client';

import Link from 'next/link';
import { ArrowRight, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { doctrinalArticles } from '@/lib/data';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, limit, orderBy, query, where } from 'firebase/firestore';
import type { DoctrinaArticle } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

function PreviewSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col bg-card p-7">
          <Skeleton className="h-3 w-24 mb-4" />
          <Skeleton className="h-6 w-full mb-3" />
          <Skeleton className="h-4 w-full flex-grow mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function HomeDoctrinePreview() {
  const firestore = useFirestore();
  const q = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'doctrina'),
      where('published', '==', true),
      orderBy('publishDate', 'desc'),
      limit(3)
    );
  }, [firestore]);

  const { data: fromDb, isLoading } = useCollection<DoctrinaArticle>(q);

  const showFirestore = !isLoading && fromDb && fromDb.length > 0;
  const items = showFirestore
    ? fromDb.map((a) => ({
        key: a.id,
        slug: a.slug,
        title: a.title,
        summary: a.summary,
        date: a.publishDate,
      }))
    : doctrinalArticles.slice(0, 3).map((a) => ({
        key: a.slug,
        slug: a.slug,
        title: a.title,
        summary: a.summary,
        date: a.date,
      }));

  return (
    <>
      {isLoading ? (
        <PreviewSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
          {items.map((article) => (
            <article
              key={article.key}
              className="flex flex-col bg-card p-7 hover:bg-secondary/40 transition-colors duration-200"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                <FileText className="w-3.5 h-3.5 text-accent" />
                <span>
                  {new Date(article.date).toLocaleDateString('es-AR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <h3 className="font-headline text-lg font-bold text-foreground leading-snug mb-3">{article.title}</h3>
              <p className="text-muted-foreground text-sm flex-grow leading-relaxed line-clamp-4">{article.summary}</p>
              <Link
                href={`/doctrina/${article.slug}`}
                className="mt-6 flex items-center text-primary text-sm font-semibold gap-1.5 hover:gap-3 transition-all"
              >
                Leer artículo <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      )}

      {!isLoading && !showFirestore && (
        <p className="text-center text-xs text-muted-foreground mt-4">
          Artículos de ejemplo hasta que publique entradas desde administración.
        </p>
      )}
    </>
  );
}
