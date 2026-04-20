'use client';

import { DocumentoForm } from '../documento-form';

export default function NuevoDocumentoPage() {
  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
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
