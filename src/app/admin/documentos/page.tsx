'use client';

import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, orderBy, query } from 'firebase/firestore';
import type { KnowledgeDoc } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, BookOpen, FilePenLine } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

function DocListSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Título</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead>Estado IA</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...Array(3)].map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-5 w-64" /></TableCell>
            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
            <TableCell className="text-right"><Skeleton className="h-8 w-8 inline-block" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function GestionarDocumentosPage() {
  const firestore = useFirestore();
  const docsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'knowledge_docs'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: docs, isLoading } = useCollection<KnowledgeDoc>(docsQuery);

  const activeDocs = docs?.filter((d) => d.active).length ?? 0;

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-headline text-3xl md:text-4xl text-primary">Base de Conocimiento IA</h1>
          <p className="text-muted-foreground">
            Documentos que alimentan el contexto del asistente al evaluar casos.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/documentos/nuevo">
            <PlusCircle className="mr-2 h-4 w-4" />
            Agregar Documento
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Documentos cargados</CardTitle>
          <CardDescription>
            {isLoading
              ? 'Cargando...'
              : `${docs?.length ?? 0} documentos en total — ${activeDocs} activos (usados por la IA)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <DocListSkeleton />
          ) : docs && docs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead className="hidden md:table-cell">Categoría</TableHead>
                  <TableHead>Estado IA</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="font-medium">{doc.title}</div>
                      {doc.description && (
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {doc.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {doc.category}
                    </TableCell>
                    <TableCell>
                      <Badge variant={doc.active ? 'default' : 'secondary'}>
                        {doc.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/documentos/${doc.id}`} title="Editar">
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
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No hay documentos cargados</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Agregue cartas, escritos, análisis o cualquier documento que quiera que la IA use como referencia.
              </p>
              <Button asChild className="mt-4">
                <Link href="/admin/documentos/nuevo">Agregar primer documento</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
