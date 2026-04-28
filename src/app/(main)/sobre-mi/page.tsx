import Image from 'next/image';
import type { Metadata } from 'next';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { siteContainer, siteContentSection, sitePageHeader } from '@/lib/site-layout';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Bot, FileText, Scale } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sobre Mí — Dr. Adrián Bengolea',
  description:
    'Conozca al Dr. Adrián Bengolea, abogado especialista en derecho del consumidor, director de asociación de defensa y con amplia experiencia en litigio, doctrina y formación en la Provincia de Buenos Aires.',
};

const highlights = [
  {
    icon: Scale,
    label: 'Especialista en derecho del consumidor; dirección de asociación de defensa',
  },
  {
    icon: FileText,
    label: 'Experiencia en litigio, doctrina, jurisprudencia y formación',
  },
  {
    icon: Bot,
    label: 'Herramientas digitales e IA para informar y agilizar, con criterio humano',
  },
];

export default function AboutPage() {
  const portraitImage = PlaceHolderImages.find((img) => img.id === 'about-me-portrait');

  return (
    <div className="flex flex-col">
      {/* ── Page header ── */}
      <div className={`bg-brand text-brand-foreground ${sitePageHeader} relative overflow-hidden`}>
        <div className="absolute left-0 top-0 w-[3px] h-full bg-accent hidden md:block" />
        <div className={siteContainer}>
          <p className="text-accent text-[11px] font-medium tracking-[0.3em] uppercase mb-3">
            El Profesional
          </p>
          <h1 className="font-headline text-4xl md:text-6xl font-bold leading-[1.05]">
            Dr. Adrián Bengolea
          </h1>
          <p className="text-white/65 mt-3 text-lg font-medium">
            Abogado — Especialista en Derecho del Consumidor
          </p>
          <div className="w-12 h-[2px] bg-accent mt-6" />
        </div>
      </div>

      {/* ── Content ── */}
      <div className={`bg-background ${siteContentSection}`}>
        <div className={siteContainer}>
          <div className="grid md:grid-cols-5 gap-10 md:gap-16 items-start">

            {/* Photo */}
            <div className="md:col-span-2">
              <div className="aspect-[3/4] relative overflow-hidden border border-border">
                {portraitImage && (
                  <Image
                    src={portraitImage.imageUrl}
                    alt={portraitImage.description}
                    data-ai-hint={portraitImage.imageHint}
                    fill
                    className="object-cover"
                  />
                )}
              </div>

              {/* Highlights below photo */}
              <div className="mt-6 space-y-3">
                {highlights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <Icon className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <span>{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bio */}
            <div className="md:col-span-3">
              <div className="prose lg:prose-lg max-w-none dark:prose-invert prose-headings:font-headline prose-headings:text-primary">
                <p>
                  Soy abogado matriculado en la Provincia de Buenos Aires, con una profunda vocación por la defensa de los derechos de las personas frente a las grandes corporaciones. Desde el inicio de mi carrera, enfoqué mi práctica en el complejo mundo de los contratos de consumo, encontrando en los planes de ahorro un campo donde la asimetría de poder deja a miles de familias en situación de vulnerabilidad.
                </p>
                <p>
                  Mi misión es simple: nivelar el campo de juego. A través del estudio constante de la legislación y la jurisprudencia, desarrollo estrategias legales innovadoras y efectivas para proteger el patrimonio de mis clientes.
                </p>
                <h3>Especialización y Enfoque</h3>
                <p>
                  Soy especialista en derecho del consumidor y director de una asociación de defensa del consumidor. Mi actividad abarca el litigio, la difusión de la doctrina y la formación, con vasta experiencia en conflictos vinculados a contratos de consumo, incluidos los planes de ahorro, sin centrar allí el ciento por ciento de mi ejercicio. Esa visión integral del consumo y el estudio continuo de la normativa y la jurisprudencia me permiten abordar estos reclamos con criterio actualizado y con conocimiento de las prácticas de las administradoras.
                </p>
                <p>
                  Creo en la transparencia y en informar con claridad. No me comprometo a que, en el cien por ciento de los asuntos, la comunicación sea de manera exclusiva conmigo: según el caso, pueden intervenir otras personas o canales, siempre bajo criterio profesional y con la confidencialidad que exige el vínculo con el cliente. Complemento el trabajo con herramientas digitales, incluida la inteligencia artificial, para acercarle información útil, preparar con mayor celeridad la documentación y alinear el planteo de su reclamo con el ritmo y la celeridad que el proceso permite, bajo control humano y con la seriedad que cada caso requiere.
                </p>
              </div>

              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8"
                >
                  <Link href="/evaluar-caso">Contanos tu caso</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-primary/30 text-primary"
                >
                  <Link href="/#problemas">Ver Problemas Frecuentes</Link>
                </Button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
