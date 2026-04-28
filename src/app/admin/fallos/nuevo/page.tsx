'use client';

import { FalloForm } from '../fallo-form';
import { siteContainer, siteAdminY } from '@/lib/site-layout';
import { cn } from '@/lib/utils';

export default function NuevoFalloPage() {
  return (
    <div className={cn(siteContainer, siteAdminY)}>
      <div className="max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="font-headline text-3xl md:text-4xl text-primary">Crear Nuevo Fallo</h1>
          <p className="text-muted-foreground">Complete los detalles del nuevo fallo judicial.</p>
        </div>
        <FalloForm />
      </div>
    </div>
  );
}
