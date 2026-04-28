'use client';

import { usePathname } from 'next/navigation';
import { AppHeader } from '@/components/header';

export function ConditionalAppHeader() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) {
    return null;
  }
  return <AppHeader />;
}
