import type { Metadata } from 'next';
import { ChatClient } from './chat-client';

export const metadata: Metadata = {
  title: 'Evalúe su Caso con IA',
  description:
    'Converse con nuestro asistente jurídico virtual para obtener una evaluación inicial gratuita y confidencial de su caso de plan de ahorro.',
};

export default function EvaluateCasePage() {
  return (
    <div className="flex flex-col">
      {/* ── Page header ── */}
      <div className="bg-primary text-primary-foreground py-14 md:py-20 relative overflow-hidden">
        <div className="absolute left-0 top-0 w-[3px] h-full bg-accent hidden md:block" />
        <div className="container mx-auto px-6 md:px-8">
          <p className="text-accent text-[11px] font-medium tracking-[0.3em] uppercase mb-3">
            Consulta Gratuita
          </p>
          <h1 className="font-headline text-4xl md:text-6xl font-bold leading-[1.05]">
            Evaluá tu Caso con IA
          </h1>
          <div className="w-12 h-[2px] bg-accent mt-6" />
          <p className="text-white/65 mt-6 max-w-xl text-base leading-relaxed">
            Conversá con el asistente virtual del estudio. La evaluación es gratuita, confidencial y sin compromiso. Atendemos a residentes en la Provincia de Buenos Aires.
          </p>
        </div>
      </div>

      {/* ── Chat ── */}
      <div className="bg-background py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <ChatClient />
        </div>
      </div>
    </div>
  );
}
