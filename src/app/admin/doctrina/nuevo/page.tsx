'use client';

import { DoctrinaForm } from '../doctrina-form';
import { siteContainer, siteAdminY } from '@/lib/site-layout';
import { cn } from '@/lib/utils';

export default function NuevaDoctrinaPage() {
  return (
    <div className={cn(siteContainer, siteAdminY)}>
      <div className="max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="font-headline text-3xl md:text-4xl text-primary">Nuevo artículo de doctrina</h1>
          <p className="text-muted-foreground">Complete el contenido y los metadatos. El slug se genera a partir del título.</p>
        </div>
        <DoctrinaForm />
      </div>
    </div>
  );
}
