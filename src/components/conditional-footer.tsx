'use client';

import { usePathname } from 'next/navigation';
import { AppFooter } from '@/components/footer';

export function ConditionalFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) {
    return null;
  }
  return <AppFooter />;
}
