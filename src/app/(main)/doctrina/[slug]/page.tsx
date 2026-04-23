import { notFound } from 'next/navigation';
import { doctrinalArticles } from '@/lib/data';
import { loadDoctrinaPublicBySlug } from '@/lib/doctrina-public-server';
import { ArticleDetailClient } from './article-detail-client';

type PageProps = { params: Promise<{ slug: string }> };

export default async function ArticleDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const result = await loadDoctrinaPublicBySlug(slug);
  if (result.mode === 'doc') {
    return <ArticleDetailClient initialFromFirestore={result.article} />;
  }
  if (result.mode === 'client_fallback') {
    return <ArticleDetailClient />;
  }

  const staticArticle = doctrinalArticles.find((p) => p.slug === slug) ?? null;
  if (staticArticle) {
    return <ArticleDetailClient staticArticle={staticArticle} />;
  }

  notFound();
}
