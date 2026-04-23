import type { Metadata } from 'next';
import { EB_Garamond, Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { AppHeader } from '@/components/header';
import { ConditionalFooter } from '@/components/conditional-footer';
import { FirebaseClientProvider } from '@/firebase';

// ── Fuentes locales (descargadas en build, sin dependencia de CDN) ──────────
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-eb-garamond',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Dr. Adrián Bengolea – Reclamos por planes de ahorro',
    template: '%s | Dr. Adrián Bengolea – Reclamos por planes de ahorro',
  },
  description:
    'Reclamos y asesoramiento legal en conflictos con planes de ahorro automotriz en Argentina. Liquidación, rescisión, cláusulas abusivas y más.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={cn(inter.variable, ebGaramond.variable)}>
      <body className={cn('font-body antialiased min-h-screen flex flex-col')}>
        <FirebaseClientProvider>
          <AppHeader />
          <main className="flex-grow">{children}</main>
          <ConditionalFooter />
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
