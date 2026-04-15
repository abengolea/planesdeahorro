import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, FileText, Gavel, ShieldQuestion } from 'lucide-react';
import { latestRulings, doctrinalArticles, frequentProblems, faqs } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function Home() {
  const heroImage = PlaceHolderImages.find((img) => img.id === 'hero-background');

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[60vh] md:h-[70vh] w-full flex items-center justify-center text-center text-white">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            data-ai-hint={heroImage.imageHint}
            fill
            className="object-cover object-center brightness-50"
            priority
          />
        )}
        <div className="relative z-10 p-4 max-w-4xl mx-auto">
          <h1 className="font-headline text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            Defiendo tus derechos en Planes de Ahorro
          </h1>
          <p className="mt-4 text-lg md:text-xl text-blue-100 max-w-3xl mx-auto">
            Soy el Dr. Adrián Bengolea, abogado especialista en conflictos con administradoras de planes de ahorro. Si su cuota aumentó desmedidamente o tiene problemas con su plan, puedo ayudarlo.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
              <Link href="/evaluar-caso">Evaluar mi Caso Gratis</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent border-accent text-accent hover:bg-accent/10">
              <Link href="#problemas">Ver Problemas Frecuentes</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Problemas Frecuentes Section */}
      <section id="problemas" className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="font-headline text-3xl md:text-4xl font-bold text-center text-primary mb-4">
            ¿Tiene alguno de estos problemas?
          </h2>
          <p className="text-center text-muted-foreground max-w-3xl mx-auto mb-12">
            Estos son los conflictos más comunes que enfrentan los suscriptores de planes de ahorro. Hacemos valer sus derechos en cada una de estas situaciones.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {frequentProblems.map((problem) => (
              <Card key={problem.slug} className="flex flex-col hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <ShieldQuestion className="w-10 h-10 mb-4 text-primary" />
                  <CardTitle className="font-headline text-xl">{problem.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-muted-foreground">{problem.description}</p>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="link" className="p-0 text-primary font-bold">
                    <Link href={`/problemas/${problem.slug}`}>
                      Saber Más <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Últimos Fallos Section */}
      <section className="py-16 md:py-24 bg-card">
        <div className="container mx-auto px-4">
          <h2 className="font-headline text-3xl md:text-4xl font-bold text-center text-primary mb-12">
            Jurisprudencia Destacada
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {latestRulings.slice(0, 3).map((ruling) => (
              <Card key={ruling.slug} className="flex flex-col border-2 border-transparent hover:border-primary transition-colors duration-300">
                <CardHeader>
                  <Gavel className="w-8 h-8 mb-2 text-primary" />
                  <CardTitle className="font-headline text-lg leading-tight">{ruling.title}</CardTitle>
                  <p className="text-sm text-muted-foreground pt-1">{ruling.court} - {new Date(ruling.date).toLocaleDateString('es-AR')}</p>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-muted-foreground line-clamp-4">{ruling.summary}</p>
                </CardContent>
                <CardFooter>
                   <Button asChild variant="secondary" className="w-full">
                    <Link href={`/fallos/${ruling.slug}`}>Leer Fallo Completo</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          <div className="text-center mt-12">
            <Button asChild>
              <Link href="/fallos">Ver todos los fallos</Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Artículos Doctrinarios Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="font-headline text-3xl md:text-4xl font-bold text-center text-primary mb-12">
            Análisis y Doctrina
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {doctrinalArticles.slice(0, 3).map((article) => (
               <Card key={article.slug} className="flex flex-col hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <FileText className="w-8 h-8 mb-2 text-primary" />
                  <CardTitle className="font-headline text-lg leading-tight">{article.title}</CardTitle>
                   <p className="text-sm text-muted-foreground pt-1">Por {article.author} - {new Date(article.date).toLocaleDateString('es-AR')}</p>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-muted-foreground line-clamp-4">{article.summary}</p>
                </CardContent>
                <CardFooter>
                   <Button asChild variant="secondary" className="w-full">
                    <Link href={`/doctrina/${article.slug}`}>Leer Artículo</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
           <div className="text-center mt-12">
            <Button asChild>
              <Link href="/doctrina">Ver todos los artículos</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-card">
        <div className="container mx-auto px-4">
           <h2 className="font-headline text-3xl md:text-4xl font-bold text-center text-primary mb-12">
            Preguntas Frecuentes
          </h2>
          <div className="max-w-4xl mx-auto">
             <Accordion type="single" collapsible className="w-full">
              {faqs.slice(0, 4).map((faq, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger className="font-headline text-lg text-left">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-base text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          <div className="text-center mt-12">
            <Button asChild variant="outline">
              <Link href="/faq">Ver todas las preguntas</Link>
            </Button>
          </div>
        </div>
      </section>

       {/* Final CTA */}
      <section className="py-20 md:py-32 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-headline text-3xl md:text-4xl font-bold mb-4">
            ¿Listo para tomar el control de su plan?
          </h2>
          <p className="text-lg md:text-xl text-blue-200 max-w-3xl mx-auto mb-8">
            No espere más. Una consulta a tiempo puede ahorrarle dinero y problemas. Contáctenos para una evaluación gratuita y confidencial de su caso.
          </p>
          <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-lg">
            <Link href="/evaluar-caso">Contactar Ahora</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
