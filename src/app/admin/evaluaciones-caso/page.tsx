'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, orderBy, query } from 'firebase/firestore';
import type { CaseEvaluationSubmission } from '@/lib/types';
import type { Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Eye, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CASE_EVALUATION_STATUSES, formatCaseEvaluationStatus } from '@/lib/case-evaluation-status';

function formatCreatedAt(ts: Timestamp | undefined): string {
  if (!ts || typeof ts.toDate !== 'function') return '—';
  return ts.toDate().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
}

function urgenciaVariant(u: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (u === 'alta') return 'destructive';
  if (u === 'media') return 'default';
  return 'secondary';
}

function EvaluacionesSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Contacto</TableHead>
          <TableHead>Administradora</TableHead>
          <TableHead>Urgencia</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...Array(4)].map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-5 w-28" /></TableCell>
            <TableCell><Skeleton className="h-5 w-36" /></TableCell>
            <TableCell><Skeleton className="h-5 w-40" /></TableCell>
            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
            <TableCell><Skeleton className="h-6 w-16" /></TableCell>
            <TableCell className="text-right"><Skeleton className="h-8 w-8 inline-block" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function EvaluacionesCasoPage() {
  const firestore = useFirestore();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const evaluacionesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'case_evaluations'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: rows, isLoading, error } = useCollection<CaseEvaluationSubmission>(evaluacionesQuery);

  const filteredRows = useMemo(() => {
    if (!rows) return null;
    if (statusFilter === 'all') return rows;
    return rows.filter((r) => {
      const s = r.status ?? 'pendiente de revisión';
      return s === statusFilter;
    });
  }, [rows, statusFilter]);

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="font-headline text-3xl md:text-4xl text-primary">Evaluaciones de caso</h1>
        <p className="text-muted-foreground">
          Consultas recibidas por el asistente en &quot;Evaluar mi caso&quot;. Requiere sesión de administrador.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No se pudieron cargar las evaluaciones</AlertTitle>
          <AlertDescription>
            {error.message.includes('permission') || error.message.includes('Permission')
              ? 'Comprobá que estés iniciado sesión con una cuenta que figure en la colección admin_users de Firestore.'
              : error.message}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between space-y-0">
          <div>
            <CardTitle>Listado</CardTitle>
            <CardDescription>
              Total en base: {isLoading ? '…' : rows?.length ?? 0}
              {!isLoading && filteredRows ? ` · Mostrando: ${filteredRows.length}` : null}
            </CardDescription>
          </div>
          <div className="w-full sm:w-[260px] space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Filtrar por estado</p>
            <Select value={statusFilter} onValueChange={setStatusFilter} disabled={isLoading}>
              <SelectTrigger aria-label="Filtrar por estado">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {CASE_EVALUATION_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {formatCaseEvaluationStatus(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <EvaluacionesSkeleton />
          ) : filteredRows && filteredRows.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden lg:table-cell">Email / WhatsApp</TableHead>
                  <TableHead className="hidden md:table-cell">Administradora</TableHead>
                  <TableHead>Urgencia</TableHead>
                  <TableHead className="hidden sm:table-cell">Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                      {formatCreatedAt(row.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium">{row.nombre || '—'}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      <div className="max-w-[220px] truncate" title={`${row.email} · ${row.whatsapp}`}>
                        {row.email}
                        {row.whatsapp ? ` · ${row.whatsapp}` : ''}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-[180px] truncate" title={row.administradora}>
                      {row.administradora || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={urgenciaVariant(row.urgencia)} className="capitalize">
                        {row.urgencia || '—'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline">{formatCaseEvaluationStatus(row.status)}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild title="Ver detalle">
                        <Link href={`/admin/evaluaciones-caso/${row.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : rows && rows.length > 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Ningún caso con este estado</h3>
              <p className="mt-1 text-sm text-muted-foreground">Probá con &quot;Todos&quot; u otro filtro.</p>
            </div>
          ) : (
            <div className="text-center py-12">
              <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No hay evaluaciones guardadas</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Cuando un usuario complete el flujo en /evaluar-caso, aparecerá acá.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
