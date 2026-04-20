import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { AppHeader } from '@/components/header';
import { ConditionalFooter } from '@/components/conditional-footer';
import { WhatsAppButton } from '@/components/whatsapp-button';
import { FirebaseClientProvider } from '@/firebase';

export const metadata: Metadata = {
  title: {
    default: 'Adrián Bengolea – Reclamos por planes de ahorro',
    template: '%s | Adrián Bengolea – Reclamos por planes de ahorro',
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
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600;700&family=Inter:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn('font-body antialiased min-h-screen flex flex-col')}>
        <FirebaseClientProvider>
          <AppHeader />
          <main className="flex-grow">{children}</main>
          <ConditionalFooter />
          <WhatsAppButton />
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
