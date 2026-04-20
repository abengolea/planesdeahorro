'use client';

import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { DoctrinaArticle } from '@/lib/types';
import { DoctrinaForm } from '../doctrina-form';
import { Skeleton } from '@/components/ui/skeleton';

function EditSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <Skeleton className="h-96 w-full" />
      </div>
      <div className="lg:col-span-1 space-y-8">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

export default function EditarDoctrinaPage() {
  const params = useParams();
  const id = params.id as string;
  const firestore = useFirestore();

  const docRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'doctrina', id);
  }, [firestore, id]);

  const { data: articulo, isLoading } = useDoc<DoctrinaArticle>(docRef);

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-headline text-3xl md:text-4xl text-primary">Editar artículo</h1>
          <p className="text-muted-foreground">Modifique el contenido o el estado de publicación.</p>
        </div>
        {isLoading && <EditSkeleton />}
        {!isLoading && articulo && <DoctrinaForm initialData={articulo} />}
        {!isLoading && !articulo && <p className="text-muted-foreground">Artículo no encontrado.</p>}
      </div>
    </div>
  );
}
