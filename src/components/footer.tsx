import Link from 'next/link';
import { Logo } from './logo';

const footerSections = [
  {
    title: 'Navegación',
    links: [
      { label: 'Inicio', href: '/' },
      { label: 'Problemas Frecuentes', href: '/#problemas' },
      { label: 'Sobre Mí', href: '/sobre-mi' },
      { label: 'Evaluar Caso', href: '/evaluar-caso' },
    ],
  },
  {
    title: 'Contenido',
    links: [
      { label: 'Fallos Judiciales', href: '/fallos' },
      { label: 'Doctrina Legal', href: '/doctrina' },
      { label: 'Preguntas Frecuentes', href: '/faq' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Política de Privacidad', href: '/privacidad' },
      { label: 'Términos y Condiciones', href: '/terminos' },
    ],
  },
];

export function AppFooter() {
  return (
    <footer className="bg-primary text-primary-foreground border-t border-white/10">
      <div className="container mx-auto px-4 py-14 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10">
          <div className="col-span-2 lg:col-span-2 flex flex-col">
            <Logo inverted />
            <div className="w-8 h-[2px] bg-accent mt-5 mb-5" />
            <p className="text-white/55 text-sm leading-relaxed max-w-xs">
              Asesoramiento legal especializado en reclamos por planes de ahorro.
            </p>
            <p className="mt-4 text-xs text-white/40">
              Atención a residentes en la Provincia de Buenos Aires (matriculación del titular).
            </p>
          </div>
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold tracking-[0.2em] uppercase text-accent mb-5">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/50 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/35">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>&copy; {new Date().getFullYear()} Adrián Bengolea. Todos los derechos reservados.</span>
            <Link
              href="/admin"
              className="text-[10px] text-white/25 hover:text-white/45 transition-colors"
            >
              Admin
            </Link>
          </p>
          <p className="text-center md:text-right max-w-sm">
            La información en este sitio no constituye asesoramiento legal. Para una evaluación de su caso, contáctenos.
          </p>
        </div>
      </div>
    </footer>
  );
}
