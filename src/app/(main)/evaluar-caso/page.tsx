import type { Metadata } from 'next';
import { siteContainer, siteContentSection, sitePageHeader } from '@/lib/site-layout';
import { ChatClient } from './chat-client';

export const metadata: Metadata = {
  title: 'Contanos tu caso | Estudio Dr. Bengolea',
  description:
    'El asistente recopila y ordena tu relato para que el Dr. Adrián Bengolea analice tu situación. Confidencial y sin compromiso. Provincia de Buenos Aires.',
};

export default function EvaluateCasePage() {
  return (
    <div className="flex flex-col">
      {/* ── Page header ── */}
      <div className={`bg-brand text-brand-foreground ${sitePageHeader} relative overflow-hidden`}>
        <div className="absolute left-0 top-0 w-[3px] h-full bg-accent hidden md:block" />
        <div className={siteContainer}>
          <p className="text-accent text-[11px] font-medium tracking-[0.3em] uppercase mb-3">
            Contanos tu problema
          </p>
          <h1 className="font-headline text-4xl md:text-6xl font-bold leading-[1.05]">
            Contanos tu caso
          </h1>
          <div className="w-12 h-[2px] bg-accent mt-6" />
          <p className="text-white/65 mt-6 max-w-2xl text-base leading-relaxed">
            La IA no reemplaza al abogado: recopila datos, filtra y ordena la información, y el estudio se la entrega al Dr. Bengolea para el análisis. Es confidencial y sin compromiso. Atendemos a residentes en la Provincia de Buenos Aires.
          </p>
          <ol className="mt-8 grid gap-4 sm:grid-cols-3 text-sm text-white/80 max-w-3xl">
            <li className="flex gap-3">
              <span className="font-headline font-bold text-accent shrink-0">1</span>
              <span>Contanos tu situación</span>
            </li>
            <li className="flex gap-3">
              <span className="font-headline font-bold text-accent shrink-0">2</span>
              <span>La IA recopila y ordena el relato</span>
            </li>
            <li className="flex gap-3">
              <span className="font-headline font-bold text-accent shrink-0">3</span>
              <span>El Dr. Bengolea revisa y analiza el caso</span>
            </li>
          </ol>
        </div>
      </div>

      {/* ── Chat ── */}
      <div className={`bg-background ${siteContentSection}`}>
        <div className={`${siteContainer} max-w-4xl`}>
          <ChatClient />
        </div>
      </div>
    </div>
  );
}
