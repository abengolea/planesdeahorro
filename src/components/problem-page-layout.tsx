import Link from 'next/link';
import { siteContainer, siteContentSection, sitePageHeader } from '@/lib/site-layout';
import { Button } from './ui/button';

interface ProblemPageLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function ProblemPageLayout({ title, children }: ProblemPageLayoutProps) {
  return (
    <div className="flex flex-col">
      {/* ── Page header ── */}
      <div className={`bg-brand text-brand-foreground ${sitePageHeader} relative overflow-hidden`}>
        <div className="absolute left-0 top-0 w-[3px] h-full bg-accent hidden md:block" />
        <div className={siteContainer}>
          <p className="text-accent text-[11px] font-medium tracking-[0.3em] uppercase mb-3">
            Área de Práctica
          </p>
          <h1 className="font-headline text-4xl md:text-6xl font-bold leading-[1.05] max-w-3xl">
            {title}
          </h1>
          <div className="w-12 h-[2px] bg-accent mt-6" />
        </div>
      </div>

      {/* ── Content ── */}
      <div className={`bg-background ${siteContentSection}`}>
        <div className={siteContainer}>
          <div className="grid lg:grid-cols-3 gap-12 lg:gap-16">

            {/* Article */}
            <main className="lg:col-span-2">
              <article className="prose lg:prose-lg max-w-none dark:prose-invert prose-headings:font-headline prose-headings:text-primary prose-a:text-primary">
                {children}
              </article>
            </main>

            {/* Sidebar CTA */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24 border border-border bg-card p-8">
                <p className="text-[11px] font-medium tracking-[0.25em] uppercase text-accent mb-4">
                  Contanos tu caso
                </p>
                <h2 className="font-headline text-2xl font-bold text-primary mb-4 leading-tight">
                  ¿Tiene este problema?
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                  No se resigne. Tiene derechos que lo protegen. Evaluamos su situación sin compromiso.
                </p>
                <Button
                  asChild
                  size="lg"
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
                >
                  <Link href="/evaluar-caso">Contanos tu caso</Link>
                </Button>
                <p className="text-center text-xs text-muted-foreground mt-4">
                  100% confidencial.
                </p>
              </div>
            </aside>

          </div>
        </div>
      </div>
    </div>
  );
}
