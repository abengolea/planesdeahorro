import type { Metadata } from 'next';
import Script from 'next/script';
import { EB_Garamond, Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { AppProviders } from '@/components/app-providers';
import { ConditionalAppHeader } from '@/components/conditional-header';
import { ConditionalFooter } from '@/components/conditional-footer';
import { SkipLink } from '@/components/skip-link';
import { ConditionalWhatsAppButton } from '@/components/whatsapp-button';
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
    <html lang="es" className={cn(inter.variable, ebGaramond.variable)} suppressHydrationWarning>
      <body className={cn('font-body antialiased min-h-screen flex flex-col')}>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-18107912536"
          strategy="afterInteractive"
        />
        <Script id="google-ads-gtag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-18107912536');
          `}
        </Script>
        <AppProviders>
          <FirebaseClientProvider>
            <SkipLink />
            <ConditionalAppHeader />
            <main id="main" tabIndex={-1} className="flex-grow outline-none">
              {children}
            </main>
            <ConditionalFooter />
            <ConditionalWhatsAppButton />
            <Toaster />
          </FirebaseClientProvider>
        </AppProviders>
      </body>
    </html>
  );
}
