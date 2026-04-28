import type { Metadata } from 'next';
import { siteContainer, sitePageHeader } from '@/lib/site-layout';
import { MiCasoDashboard } from './mi-caso-dashboard';

export const metadata: Metadata = {
  title: 'Mi consulta | Portal del cliente',
  description: 'Estado de tu expediente, movimientos y documentación.',
};

export default function MiCasoPage() {
  return (
    <div className="flex flex-col min-h-[50vh]">
      <div className={`bg-brand text-brand-foreground ${sitePageHeader} relative overflow-hidden`}>
        <div className="absolute left-0 top-0 w-[3px] h-full bg-accent hidden md:block" />
        <div className={siteContainer}>
          <p className="text-accent text-[11px] font-medium tracking-[0.3em] uppercase mb-3">
            Portal del cliente
          </p>
          <h1 className="font-headline text-2xl md:text-4xl font-bold leading-tight">
            Seguimiento de tu consulta
          </h1>
          <div className="w-12 h-[2px] bg-accent mt-5" />
        </div>
      </div>
      <MiCasoDashboard />
    </div>
  );
}
