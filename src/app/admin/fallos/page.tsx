'use client';

import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, orderBy, query } from 'firebase/firestore';
import type { Fallo } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Gavel, FilePenLine, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { siteContainer, siteAdminY } from '@/lib/site-layout';
import { cn } from '@/lib/utils';

function FallosListSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Título</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...Array(3)].map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-5 w-48" /></TableCell>
            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
            <TableCell className="space-x-2">
              <Skeleton className="h-8 w-8 inline-block" />
              <Skeleton className="h-8 w-8 inline-block" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function GestionarFallosPage() {
  const firestore = useFirestore();
  const fallosCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'fallos'), orderBy('date', 'desc'));
  }, [firestore]);

  const { data: fallos, isLoading } = useCollection<Fallo>(fallosCollection);

  return (
    <div className={cn(siteContainer, siteAdminY)}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-headline text-3xl md:text-4xl text-primary">Gestionar Fallos</h1>
          <p className="text-muted-foreground">Cree, edite y administre los fallos judiciales del sitio.</p>
        </div>
        <Button asChild>
          <Link href="/admin/fallos/nuevo">
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Nuevo Fallo
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Fallos</CardTitle>
          <CardDescription>Total de fallos en la base de datos: {isLoading ? '...' : fallos?.length ?? 0}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <FallosListSkeleton />
          ) : fallos && fallos.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead className="hidden md:table-cell">Estado</TableHead>
                  <TableHead className="hidden md:table-cell">Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fallos.map((fallo) => (
                  <TableRow key={fallo.id}>
                    <TableCell className="font-medium">{fallo.title}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant={fallo.published ? 'default' : 'secondary'}>
                        {fallo.published ? 'Publicado' : 'Borrador'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                        {new Date(fallo.date).toLocaleDateString('es-AR', { timeZone: 'UTC' })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/fallos/${fallo.slug}`} target="_blank" title="Ver en sitio">
                            <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/fallos/${fallo.id}`} title="Editar">
                          <FilePenLine className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Gavel className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No se encontraron fallos</h3>
              <p className="mt-1 text-sm text-muted-foreground">Comience por crear el primer fallo judicial.</p>
              <Button asChild className="mt-4">
                <Link href="/admin/fallos/nuevo">Crear Nuevo Fallo</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
