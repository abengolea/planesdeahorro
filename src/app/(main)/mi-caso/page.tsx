import type { Metadata } from 'next';
import { MiCasoDashboard } from './mi-caso-dashboard';

export const metadata: Metadata = {
  title: 'Mi consulta | Portal del cliente',
  description: 'Estado de tu expediente, movimientos y documentación.',
};

export default function MiCasoPage() {
  return (
    <div className="flex flex-col min-h-[50vh]">
      <div className="bg-primary text-primary-foreground py-10 md:py-12 relative overflow-hidden">
        <div className="absolute left-0 top-0 w-[3px] h-full bg-accent hidden md:block" />
        <div className="container mx-auto px-6 md:px-8">
          <p className="text-accent text-[11px] font-medium tracking-[0.3em] uppercase mb-2">
            Portal del cliente
          </p>
          <h2 className="font-headline text-2xl md:text-3xl font-semibold">Seguimiento de tu consulta</h2>
        </div>
      </div>
      <MiCasoDashboard />
    </div>
  );
}
