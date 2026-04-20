'use client';

import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { doctrinalArticles } from '@/lib/data';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, limit, query, where } from 'firebase/firestore';
import type { DoctrinaArticle } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, FileText, Tag, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ReactMarkdown from 'react-markdown';

export function ArticleDetailClient() {
  const params = useParams();
  const slug = params.slug as string;
  const firestore = useFirestore();

  const doctrinaQuery = useMemoFirebase(() => {
    if (!firestore || !slug) return null;
    return query(
      collection(firestore, 'doctrina'),
      where('slug', '==', slug),
      where('published', '==', true),
      limit(1)
    );
  }, [firestore, slug]);

  const { data: rows, isLoading } = useCollection<DoctrinaArticle>(doctrinaQuery);
  const fromDb = rows?.[0];
  const staticArticle = doctrinalArticles.find((p) => p.slug === slug);
  const hasDoctrineArticleBody = Boolean(fromDb?.content?.trim());

  if (isLoading) {
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

  if (fromDb) {
    return (
      <div className="bg-card py-12 md:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <article className="prose lg:prose-xl max-w-none dark:prose-invert prose-headings:font-headline prose-headings:text-primary">
            <div className="mb-8">
              <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary mb-4">{fromDb.title}</h1>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground not-prose">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Por {fromDb.authorName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <time dateTime={fromDb.publishDate}>
                    {new Date(fromDb.publishDate).toLocaleDateString('es-AR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      timeZone: 'UTC',
                    })}
                  </time>
                </div>
              </div>
              {fromDb.tags && fromDb.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2 not-prose">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  {fromDb.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <p className="lead text-lg font-medium text-foreground">{fromDb.summary}</p>

            {fromDb.pdfUrl ? (
              <div className="mt-10 not-prose">
                {hasDoctrineArticleBody ? (
                  <Tabs defaultValue="articulo" className="w-full">
                    <TabsList className="grid w-full max-w-md grid-cols-2 h-auto p-1">
                      <TabsTrigger value="articulo" className="gap-2">
                        <FileText className="h-4 w-4 shrink-0" />
                        Artículo
                      </TabsTrigger>
                      <TabsTrigger value="pdf">Documento PDF</TabsTrigger>
                    </TabsList>
                    <TabsContent value="articulo" className="mt-6 prose-lg max-w-none dark:prose-invert prose-headings:font-headline prose-headings:text-primary">
                      <ReactMarkdown>{fromDb.content}</ReactMarkdown>
                    </TabsContent>
                    <TabsContent value="pdf" className="mt-6 space-y-4">
                      <div className="rounded-xl border border-border/80 bg-muted/20 shadow-inner overflow-hidden">
                        <iframe
                          title={fromDb.pdfFileName ?? 'Documento PDF'}
                          src={`${fromDb.pdfUrl}#view=FitH`}
                          className="w-full min-h-[65vh] h-[70vh] md:min-h-[72vh] md:h-[78vh] bg-background"
                          loading="lazy"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground text-center">
                        <a
                          href={fromDb.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary font-medium underline-offset-4 hover:underline"
                        >
                          Abrir el PDF en otra pestaña
                        </a>
                        {fromDb.pdfFileName ? (
                          <span className="block mt-1 truncate" title={fromDb.pdfFileName}>
                            {fromDb.pdfFileName}
                          </span>
                        ) : null}
                      </p>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground not-prose">
                      Documento publicado en PDF (sin texto duplicado en la web).
                    </p>
                    <div className="rounded-xl border border-border/80 bg-muted/20 shadow-inner overflow-hidden">
                      <iframe
                        title={fromDb.pdfFileName ?? 'Documento PDF'}
                        src={`${fromDb.pdfUrl}#view=FitH`}
                        className="w-full min-h-[65vh] h-[70vh] md:min-h-[72vh] md:h-[78vh] bg-background"
                        loading="lazy"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      <a
                        href={fromDb.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary font-medium underline-offset-4 hover:underline"
                      >
                        Abrir el PDF en otra pestaña
                      </a>
                      {fromDb.pdfFileName ? (
                        <span className="block mt-1 truncate" title={fromDb.pdfFileName}>
                          {fromDb.pdfFileName}
                        </span>
                      ) : null}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-8 prose-lg max-w-none dark:prose-invert prose-headings:font-headline prose-headings:text-primary">
                <ReactMarkdown>{fromDb.content}</ReactMarkdown>
              </div>
            )}
          </article>

          <div className="mt-12 text-center">
            <Button asChild>
              <Link href="/doctrina">Volver a Doctrina</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (staticArticle) {
    return (
      <div className="bg-card py-12 md:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <article className="prose lg:prose-xl max-w-none dark:prose-invert prose-headings:font-headline prose-headings:text-primary">
            <div className="mb-8">
              <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary mb-4">{staticArticle.title}</h1>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Por {staticArticle.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <time dateTime={staticArticle.date}>
                    {new Date(staticArticle.date).toLocaleDateString('es-AR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                </div>
              </div>
            </div>

            <p className="lead text-lg font-medium text-foreground">{staticArticle.summary}</p>

            <div className="whitespace-pre-wrap mt-8">{staticArticle.content}</div>
          </article>

          <div className="mt-12 text-center">
            <Button asChild>
              <Link href="/doctrina">Volver a Doctrina</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  notFound();
}
