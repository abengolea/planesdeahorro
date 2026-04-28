'use client';

import { DocumentoForm } from '../documento-form';
import { siteContainer, siteAdminY } from '@/lib/site-layout';
import { cn } from '@/lib/utils';

export default function NuevoDocumentoPage() {
  return (
    <div className={cn(siteContainer, siteAdminY)}>
      <div className="max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="font-headline text-3xl md:text-4xl text-primary">Agregar Documento</h1>
          <p className="text-muted-foreground">
            Cargá un documento para que la IA lo use como referencia al evaluar casos.
          </p>
        </div>
        <DocumentoForm />
      </div>
    </div>
  );
}
