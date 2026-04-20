import Link from 'next/link';
import type { Metadata } from 'next';
import { Bot, FileText, Gavel, ClipboardList, BookOpen, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Administración',
};

const adminCards = [
  {
    href: '/admin/evaluaciones-caso',
    icon: ClipboardList,
    title: 'Evaluaciones de caso',
    description:
      'Consultas completadas desde "Evaluar mi caso": datos del cliente y resumen generado por IA.',
    cta: 'Ver evaluaciones',
  },
  {
    href: '/admin/herramientas-ai',
    icon: Bot,
    title: 'Herramientas de IA',
    description:
      'Generá resúmenes de fallos y borradores de artículos de doctrina en segundos con asistencia de IA.',
    cta: 'Abrir herramientas',
  },
  {
    href: '/admin/fallos',
    icon: Gavel,
    title: 'Gestionar Fallos',
    description:
      'Añadí, editá o eliminá fallos y jurisprudencia. Mantené la sección actualizada con las últimas novedades.',
    cta: 'Gestionar fallos',
  },
  {
    href: '/admin/doctrina',
    icon: FileText,
    title: 'Gestionar Doctrina',
    description:
      'Publicá y administrá los artículos del blog jurídico. Compartí análisis y criterios con los visitantes.',
    cta: 'Gestionar doctrina',
  },
  {
    href: '/admin/documentos',
    icon: BookOpen,
    title: 'Base de Conocimiento IA',
    description:
      'Documentos propios que alimentan el contexto del asistente. Cargá escritos, análisis y normativa.',
    cta: 'Gestionar documentos',
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="p-6 md:p-10 max-w-5xl">
      <div className="mb-10 border-b border-border pb-8">
        <p className="text-xs font-medium tracking-[0.25em] uppercase text-accent mb-2">
          Panel de control
        </p>
        <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary">
          Panel de Administración
        </h1>
        <p className="text-muted-foreground mt-2">
          Gestioná el contenido y revisá las consultas recibidas por la web.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border border border-border">
        {adminCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group flex flex-col bg-card p-7 hover:bg-secondary/40 transition-colors duration-150"
            >
              <div className="w-10 h-10 border border-primary/20 flex items-center justify-center mb-5">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <h2 className="font-headline text-xl font-bold text-foreground mb-2">{card.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed flex-grow">
                {card.description}
              </p>
              <div className="mt-6 flex items-center text-primary text-sm font-semibold gap-1.5 group-hover:gap-3 transition-all">
                {card.cta} <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
