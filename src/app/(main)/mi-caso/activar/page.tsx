import type { Metadata } from 'next';
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
      <div className="bg-primary text-primary-foreground py-10 md:py-14 relative overflow-hidden">
        <div className="absolute left-0 top-0 w-[3px] h-full bg-accent hidden md:block" />
        <div className="container mx-auto px-6 md:px-8">
          <p className="text-accent text-[11px] font-medium tracking-[0.3em] uppercase mb-2">
            Estudio Dr. Bengolea
          </p>
          <h2 className="font-headline text-2xl md:text-3xl font-semibold">Área de clientes</h2>
        </div>
      </div>
      <Suspense fallback={<ActivarFallback />}>
        <ActivarPortalClient />
      </Suspense>
    </div>
  );
}
