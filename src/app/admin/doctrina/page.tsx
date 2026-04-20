'use client';

import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, orderBy, query } from 'firebase/firestore';
import type { DoctrinaArticle } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, FileText, FilePenLine, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

function ListSkeleton() {
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
            <TableCell>
              <Skeleton className="h-5 w-48" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-6 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-24" />
            </TableCell>
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

export default function GestionarDoctrinaPage() {
  const firestore = useFirestore();
  const doctrinaQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'doctrina'), orderBy('publishDate', 'desc'));
  }, [firestore]);

  const { data: articulos, isLoading } = useCollection<DoctrinaArticle>(doctrinaQuery);

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="font-headline text-3xl md:text-4xl text-primary">Gestionar Doctrina</h1>
          <p className="text-muted-foreground">Artículos del blog jurídico visibles en /doctrina.</p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/admin/doctrina/nuevo">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo artículo
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Artículos</CardTitle>
          <CardDescription>
            Total en Firestore: {isLoading ? '...' : (articulos?.length ?? 0)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ListSkeleton />
          ) : articulos && articulos.length > 0 ? (
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
                {articulos.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.title}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant={a.published ? 'default' : 'secondary'}>
                        {a.published ? 'Publicado' : 'Borrador'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {new Date(a.publishDate).toLocaleDateString('es-AR', { timeZone: 'UTC' })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/doctrina/${a.slug}`} target="_blank" title="Ver en sitio">
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/doctrina/${a.id}`} title="Editar">
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
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No hay artículos</h3>
              <p className="mt-1 text-sm text-muted-foreground">Cree el primer artículo de doctrina.</p>
              <Button asChild className="mt-4">
                <Link href="/admin/doctrina/nuevo">Nuevo artículo</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
