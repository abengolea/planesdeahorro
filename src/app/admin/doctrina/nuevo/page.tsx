'use client';

import { DoctrinaForm } from '../doctrina-form';

export default function NuevaDoctrinaPage() {
  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-headline text-3xl md:text-4xl text-primary">Nuevo artículo de doctrina</h1>
          <p className="text-muted-foreground">Complete el contenido y los metadatos. El slug se genera a partir del título.</p>
        </div>
        <DoctrinaForm />
      </div>
    </div>
  );
}
