'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const navLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/#problemas', label: 'Problemas' },
  { href: '/fallos', label: 'Fallos' },
  { href: '/doctrina', label: 'Doctrina' },
  { href: '/faq', label: 'Preguntas Frecuentes' },
  { href: '/sobre-mi', label: 'Sobre Mí' },
];

export function AppHeader() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-brand text-brand-foreground font-headline isolate">
      <div className="relative z-10 container mx-auto flex h-[4.5rem] items-center justify-between px-4">
        <Link href="/">
          <Logo inverted />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-base font-medium tracking-wide transition-colors',
                pathname === link.href
                  ? 'text-white'
                  : 'text-white/55 hover:text-white/90'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          <Button
            asChild
            className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-base h-10 px-5"
          >
            <Link href="/evaluar-caso">Contanos tu caso</Link>
          </Button>
        </div>

        {/* Mobile Navigation */}
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="min-h-11 min-w-11 text-white hover:bg-white/10 hover:text-white"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[300px] sm:w-[350px] bg-brand text-brand-foreground border-white/10 font-headline"
            >
              <SheetHeader>
                <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
                <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                  <Logo inverted />
                </Link>
              </SheetHeader>
              <div className="mt-8 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      'py-3 px-2 text-lg font-medium tracking-wide transition-colors border-b border-white/10',
                      pathname === link.href
                        ? 'text-white'
                        : 'text-white/60 hover:text-white'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                <Button
                  asChild
                  className="mt-6 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-base h-10"
                >
                  <Link href="/evaluar-caso" onClick={() => setIsMobileMenuOpen(false)}>
                    Contanos tu caso
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
