import Image from 'next/image';
import type { Metadata } from 'next';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sobre Mí - Especialista en Planes de Ahorro | JurisPlan',
  description: 'Conozca al profesional detrás de JurisPlan, un abogado con dedicación exclusiva a la defensa de los derechos de los suscriptores de planes de ahorro.',
};

export default function AboutPage() {
  const portraitImage = PlaceHolderImages.find((img) => img.id === 'about-me-portrait');

  return (
    <div className="bg-card py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-5 gap-8 md:gap-12 items-center">
          <div className="md:col-span-2">
            <div className="aspect-square relative rounded-lg overflow-hidden shadow-lg mx-auto max-w-sm md:max-w-none">
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
          </div>
          <div className="md:col-span-3">
            <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">Dr. Adrian Bengolea</h1>
            <h2 className="font-headline text-xl text-muted-foreground mt-2">Abogado - Especialista en Defensa del Consumidor</h2>
            
            <div className="prose lg:prose-lg mt-6 max-w-none dark:prose-invert">
              <p>
                Soy un abogado matriculado, con una profunda vocación por la defensa de los derechos de las personas frente a las grandes corporaciones. Desde el inicio de mi carrera, he enfocado mi práctica en el complejo mundo de los contratos de consumo, encontrando en los planes de ahorro un campo donde la asimetría de poder deja a miles de familias en una situación de vulnerabilidad.
              </p>
              <p>
                Mi misión es simple: nivelar el campo de juego. A través de un estudio constante de la legislación y la jurisprudencia, desarrollo estrategias legales innovadoras y efectivas para proteger el patrimonio de mis clientes.
              </p>
              <h3 className="font-headline">Especialización y Enfoque</h3>
              <p>
                A diferencia de los estudios jurídicos generalistas, mi práctica está 100% dedicada a conflictos derivados de planes de ahorro. Esta ultra-especialización me permite estar al día con cada cambio normativo y cada nuevo fallo judicial, ofreciendo un servicio de la más alta calidad y con un profundo conocimiento de las tácticas empleadas por las administradoras.
              </p>
              <p>
                Creo en un trato directo y transparente. Cada cliente habla directamente conmigo, y cada caso es tratado con la dedicación y la seriedad que merece.
              </p>
            </div>
            <Button asChild size="lg" className="mt-8">
              <Link href="/evaluar-caso">Evaluar mi Caso</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
