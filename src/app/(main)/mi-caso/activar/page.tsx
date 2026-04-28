import type { Metadata } from 'next';
import { siteContainer, sitePageHeader } from '@/lib/site-layout';
import { Suspense } from 'react';
import { ActivarPortalClient } from './activar-portal-client';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Activar portal del cliente',
  description: 'Acceso seguro al estado de tu consulta y documentación.',
};

function ActivarFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center bg-background text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}

export default function MiCasoActivarPage() {
  return (
    <div className="flex flex-col">
      <div className={`bg-brand text-brand-foreground ${sitePageHeader} relative overflow-hidden`}>
        <div className="absolute left-0 top-0 w-[3px] h-full bg-accent hidden md:block" />
        <div className={siteContainer}>
          <p className="text-accent text-[11px] font-medium tracking-[0.3em] uppercase mb-3">
            Estudio Dr. Bengolea
          </p>
          <h1 className="font-headline text-2xl md:text-4xl font-bold leading-tight">Área de clientes</h1>
          <div className="w-12 h-[2px] bg-accent mt-5" />
        </div>
      </div>
      <Suspense fallback={<ActivarFallback />}>
        <ActivarPortalClient />
      </Suspense>
    </div>
  );
}
