import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowRight, Scale, Bot, MapPin } from 'lucide-react';
import { frequentProblems, faqs, faqHomeItems } from '@/lib/data';
import { HomeDoctrinePreview } from '@/components/home-doctrine-preview';
import { FaqAnswer } from '@/components/faq-answer';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const homeFaqs = faqHomeItems.length > 0 ? faqHomeItems : faqs.slice(0, 4);

const stats = [
  { value: '+10', label: 'Años de experiencia' },
  { value: '+500', label: 'Consultas atendidas' },
  { value: 'PBA', label: 'Provincia de Buenos Aires' },
  { value: 'Gratuita', label: 'Primera consulta' },
];

const differentiators = [
  {
    icon: Scale,
    title: 'Especialización Exclusiva',
    description:
      'Dedicación exclusiva a planes de ahorro. Conocemos cada cláusula abusiva y cada precedente judicial favorable para su situación.',
  },
  {
    icon: Bot,
    title: 'Diagnóstico Inmediato con IA',
    description:
      'Nuestra herramienta de inteligencia artificial evalúa su caso al instante e indica si tiene fundamentos legales para reclamar, sin turnos ni esperas.',
  },
  {
    icon: MapPin,
    title: 'Atención en Provincia de Buenos Aires',
    description:
      'El Dr. Adrián Bengolea está matriculado en la Provincia de Buenos Aires; el estudio toma nuevos casos de quienes residen en ese ámbito. Modalidad 100% digital, sin desplazamientos.',
  },
];

export default function Home() {
  const heroImage = PlaceHolderImages.find((img) => img.id === 'hero-background');

  return (
    <div className="flex flex-col">
      {/* ── Hero ── */}
      <section className="relative min-h-[88vh] w-full flex items-end">
        {/* Background */}
        <div className="absolute inset-0 bg-primary">
          {heroImage && (
            <Image
              src={heroImage.imageUrl}
              alt={heroImage.description}
              data-ai-hint={heroImage.imageHint}
              fill
              className="object-cover object-center opacity-[0.12]"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-[hsl(218,65%,10%)]" />
        </div>

        {/* Gold left accent bar */}
        <div className="absolute left-0 top-0 w-[3px] h-full bg-accent hidden md:block" />

        <div className="relative z-10 container mx-auto px-6 md:px-8 pb-24 pt-32">
          <p className="text-accent font-medium tracking-[0.3em] uppercase text-[11px] md:text-xs mb-6">
            Abogado — Provincia de Buenos Aires
          </p>
          <h1 className="font-headline text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.05] max-w-4xl">
            Adrián Bengolea
            <br />
            <span className="text-accent">Reclamos por planes de ahorro</span>
          </h1>
          <div className="w-14 h-[2px] bg-accent mt-9 mb-9" />
          <p className="text-white/70 text-lg md:text-xl max-w-xl leading-relaxed">
            Si fue víctima de una rescisión abusiva, tiene demoras en la liquidación de su plan o enfrenta conflictos con su administradora — tiene derechos y los defiendo.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Button
              asChild
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-base px-8 h-12"
            >
              <Link href="/evaluar-caso">Evaluar mi Caso Gratis</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 hover:text-white h-12 text-base"
            >
              <Link href="#problemas">Ver Problemas Frecuentes</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <div className="bg-background border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
            {stats.map((stat) => (
              <div key={stat.label} className="py-8 px-6 text-center">
                <p className="font-headline text-3xl md:text-4xl font-bold text-primary">
                  {stat.value}
                </p>
                <p className="text-muted-foreground text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Problemas frecuentes ── */}
      <section id="problemas" className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4">
          <div className="mb-14">
            <p className="text-accent font-medium tracking-[0.25em] uppercase text-[11px] mb-3">
              Áreas de Práctica
            </p>
            <h2 className="font-headline text-3xl md:text-5xl font-bold text-primary max-w-2xl leading-tight">
              ¿Tiene alguno de estos problemas?
            </h2>
            <div className="w-12 h-[2px] bg-accent mt-6" />
            <p className="text-muted-foreground max-w-2xl mt-6 text-base leading-relaxed">
              Estos son los conflictos más comunes que enfrentan los suscriptores de planes de ahorro. Cada caso tiene solución legal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
            {frequentProblems.map((problem, index) => (
              <Link
                key={problem.slug}
                href={`/problemas/${problem.slug}`}
                className="group flex flex-col bg-card p-7 hover:bg-secondary/40 transition-colors duration-200"
              >
                <span className="font-headline text-4xl font-bold text-border group-hover:text-accent/40 transition-colors mb-4 leading-none">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="font-headline text-xl font-bold text-foreground mb-3 leading-snug">
                  {problem.title}
                </h3>
                <p className="text-muted-foreground text-sm flex-grow leading-relaxed">
                  {problem.description}
                </p>
                <div className="mt-6 flex items-center text-primary text-sm font-semibold gap-1.5 group-hover:gap-3 transition-all">
                  Conocer mis derechos <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Enfoque del estudio (dark section) ── */}
      <section className="py-20 md:py-28 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="mb-14">
            <p className="text-accent font-medium tracking-[0.25em] uppercase text-[11px] mb-3">
              Cómo trabajamos
            </p>
            <h2 className="font-headline text-3xl md:text-5xl font-bold max-w-2xl leading-tight">
              Especialización, IA y atención en Provincia de Buenos Aires
            </h2>
            <div className="w-12 h-[2px] bg-accent mt-6" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-14">
            {differentiators.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex flex-col">
                  <div className="w-11 h-11 border border-accent/30 flex items-center justify-center mb-6">
                    <Icon className="w-5 h-5 text-accent" />
                  </div>
                  <h3 className="font-headline text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-white/55 leading-relaxed text-sm">{item.description}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-16 pt-10 border-t border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <p className="font-headline text-2xl md:text-3xl font-bold max-w-lg leading-tight">
              Evaluamos su caso con inteligencia artificial para que llegue mejor preparado.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shrink-0 h-12 px-8"
            >
              <Link href="/evaluar-caso">Probar Diagnóstico IA</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Artículos doctrinarios ── */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4">
          <div className="mb-14">
            <p className="text-accent font-medium tracking-[0.25em] uppercase text-[11px] mb-3">
              Recursos
            </p>
            <h2 className="font-headline text-3xl md:text-5xl font-bold text-primary max-w-2xl leading-tight">
              Análisis y Doctrina Legal
            </h2>
            <div className="w-12 h-[2px] bg-accent mt-6" />
          </div>

          <HomeDoctrinePreview />

          <div className="mt-10">
            <Button asChild variant="outline" className="border-primary/30 text-primary">
              <Link href="/doctrina">Ver todos los artículos</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 md:py-28 bg-secondary/40">
        <div className="container mx-auto px-4">
          <div className="mb-14">
            <p className="text-accent font-medium tracking-[0.25em] uppercase text-[11px] mb-3">
              Información
            </p>
            <h2 className="font-headline text-3xl md:text-5xl font-bold text-primary max-w-2xl leading-tight">
              Preguntas Frecuentes
            </h2>
            <div className="w-12 h-[2px] bg-accent mt-6" />
          </div>

          <div className="max-w-3xl">
            <Accordion type="single" collapsible className="w-full">
              {homeFaqs.map((faq, index) => (
                <AccordionItem value={`item-${index}`} key={faq.question} className="border-border">
                  <AccordionTrigger className="font-headline text-lg text-left text-foreground hover:text-primary py-5">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-base text-muted-foreground leading-relaxed pb-5">
                    <FaqAnswer text={faq.answer} className="text-muted-foreground" />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div className="mt-10">
            <Button asChild variant="outline" className="border-primary/30 text-primary">
              <Link href="/faq">Ver todas las preguntas</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative py-24 md:py-36 bg-primary text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,hsl(40,68%,48%,0.08),transparent_60%)]" />
          <div className="absolute right-0 top-0 w-[3px] h-full bg-accent opacity-50" />
        </div>
        <div className="relative z-10 container mx-auto px-4 text-center">
          <p className="text-accent font-medium tracking-[0.3em] uppercase text-[11px] mb-6">
            Consulta Gratuita
          </p>
          <h2 className="font-headline text-4xl md:text-6xl font-bold mb-6 max-w-3xl mx-auto leading-tight">
            ¿Listo para defender sus derechos?
          </h2>
          <div className="w-12 h-[2px] bg-accent mx-auto mb-8" />
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-12 leading-relaxed">
            No espere más. Una consulta gratuita y confidencial puede marcar la diferencia en su situación. Evaluamos su caso sin compromiso.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-lg h-14 px-10"
          >
            <Link href="/evaluar-caso">Iniciar Evaluación Gratuita</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
