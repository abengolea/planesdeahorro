import type { Metadata } from 'next';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { FaqAnswer } from '@/components/faq-answer';
import { faqSections } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Preguntas Frecuentes sobre Planes de Ahorro',
  description:
    'Guía clara sobre planes de ahorro: contrato, entrega del auto, cuotas, mora, liquidación y más.',
};

export default function FaqPage() {
  return (
    <div className="flex flex-col">
      {/* ── Page header ── */}
      <div className="bg-primary text-primary-foreground py-14 md:py-20 relative overflow-hidden">
        <div className="absolute left-0 top-0 w-[3px] h-full bg-accent hidden md:block" />
        <div className="container mx-auto px-6 md:px-8">
          <p className="text-accent text-[11px] font-medium tracking-[0.3em] uppercase mb-3">
            Información
          </p>
          <h1 className="font-headline text-4xl md:text-6xl font-bold leading-[1.05] max-w-3xl">
            Preguntas Frecuentes
          </h1>
          <div className="w-12 h-[2px] bg-accent mt-6" />
          <p className="text-white/65 mt-6 max-w-xl text-base leading-relaxed">
            Todo en lenguaje sencillo, para entender cómo funciona el sistema y qué podés hacer en cada etapa del plan.
          </p>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="bg-background py-14 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto lg:grid lg:grid-cols-[minmax(0,220px)_1fr] lg:gap-12 lg:items-start">

            {/* Sticky sidebar nav */}
            <nav
              aria-label="Temas"
              className="mb-10 lg:mb-0 lg:sticky lg:top-24 border border-border bg-card p-5 text-[15px]"
            >
              <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-accent mb-4">
                Temas
              </p>
              <ul className="space-y-1">
                {faqSections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="block px-2 py-1.5 text-sm text-muted-foreground hover:text-primary transition-colors leading-snug"
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* FAQ sections */}
            <div className="space-y-14 min-w-0">
              {faqSections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-24">
                  <h2 className="font-headline text-2xl md:text-3xl font-bold text-primary mb-1">
                    {section.title}
                  </h2>
                  {section.description && (
                    <p className="text-muted-foreground mb-6 max-w-2xl text-base leading-relaxed">
                      {section.description}
                    </p>
                  )}
                  {!section.description && <div className="mb-5" />}

                  <Accordion type="multiple" className="w-full">
                    {section.items.map((faq, index) => (
                      <AccordionItem
                        value={`${section.id}-${index}`}
                        key={`${section.id}-${index}`}
                        className="border-border"
                      >
                        <AccordionTrigger className="text-left font-headline text-base md:text-lg hover:no-underline py-5 hover:text-primary">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="pb-5 pt-0.5">
                          <FaqAnswer
                            text={faq.answer}
                            className="text-base text-foreground/85 leading-relaxed max-w-prose"
                          />
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </section>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
