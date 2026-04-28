'use client';

import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Fallo } from '@/lib/types';
import { FalloForm } from '../fallo-form';
import { Skeleton } from '@/components/ui/skeleton';
import { siteContainer, siteAdminY } from '@/lib/site-layout';
import { cn } from '@/lib/utils';

function EditFalloSkeleton() {
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
    )
}


export default function EditarFalloPage() {
  const params = useParams();
  const id = params.id as string;
  const firestore = useFirestore();
  
  const docRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'fallos', id);
  }, [firestore, id]);

  const { data: fallo, isLoading } = useDoc<Fallo>(docRef);

  return (
    <div className={cn(siteContainer, siteAdminY)}>
      <div className="max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="font-headline text-3xl md:text-4xl text-primary">Editar Fallo</h1>
          <p className="text-muted-foreground">Modifique los detalles del fallo judicial.</p>
        </div>
        {isLoading && <EditFalloSkeleton />}
        {!isLoading && fallo && <FalloForm initialData={fallo} />}
        {!isLoading && !fallo && <p>Fallo no encontrado.</p>}
      </div>
    </div>
  );
}
