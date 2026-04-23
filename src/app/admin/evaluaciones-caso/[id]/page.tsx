'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { useUser } from '@/firebase/provider';
import { markCaseEvaluationViewed } from '@/actions/case-evaluation-admin';
import { doc } from 'firebase/firestore';
import type { CaseEvaluationSubmission } from '@/lib/types';
import type { Timestamp } from 'firebase/firestore';
import { formatCaseEvaluationStatus } from '@/lib/case-evaluation-status';
import { CaseEvaluationActions } from '@/app/admin/evaluaciones-caso/[id]/case-actions';
import { CaseEvaluationEditForm } from '@/app/admin/evaluaciones-caso/[id]/case-evaluation-edit-form';
import { PortalChatThread } from '@/components/portal-chat-thread';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, AlertCircle } from 'lucide-react';

function formatCreatedAt(ts: Timestamp | undefined): string {
  if (!ts || typeof ts.toDate !== 'function') return '—';
  return ts.toDate().toLocaleString('es-AR', { dateStyle: 'full', timeStyle: 'short' });
}

function urgenciaVariant(u: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (u === 'alta') return 'destructive';
  if (u === 'media') return 'default';
  return 'secondary';
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

export default function EvaluacionCasoDetallePage() {
  const params = useParams();
  const id = params.id as string;
  const firestore = useFirestore();
  const { user } = useUser();
  const markViewedAttemptForId = useRef<string | null>(null);

  const docRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'case_evaluations', id);
  }, [firestore, id]);

  const { data: row, isLoading, error } = useDoc<CaseEvaluationSubmission>(docRef);

  useEffect(() => {
    if (!row || isLoading) return;
    if (typeof window === 'undefined' || window.location.hash !== '#editar-datos') return;
    requestAnimationFrame(() => {
      document.getElementById('editar-datos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [row, isLoading]);

  useEffect(() => {
    if (!row?.id || !user || row.newForAdmin !== true) return;
    if (markViewedAttemptForId.current === row.id) return;
    markViewedAttemptForId.current = row.id;
    const caseId = row.id;
    void (async () => {
      const token = await user.getIdToken();
      const res = await markCaseEvaluationViewed(token, caseId);
      if (!res.ok && markViewedAttemptForId.current === caseId) {
        markViewedAttemptForId.current = null;
      }
    })();
  }, [row?.id, row?.newForAdmin, user]);

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/evaluaciones-caso">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al listado
            </Link>
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error.message.includes('permission') || error.message.includes('Permission')
                ? 'No tenés permiso para ver esta evaluación (sesión admin requerida).'
                : error.message}
            </AlertDescription>
          </Alert>
        )}

        {isLoading && <DetailSkeleton />}

        {!isLoading && !row && !error && (
          <p className="text-muted-foreground">No se encontró la evaluación.</p>
        )}

        {!isLoading && row && (
          <>
            <div>
              <h1 className="font-headline text-3xl md:text-4xl text-primary">Evaluación de caso</h1>
              <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2">
                <span>Recibida el {formatCreatedAt(row.createdAt)}</span>
                {row.status ? <Badge variant="outline">{formatCaseEvaluationStatus(row.status)}</Badge> : null}
                {row.archived ? (
                  <Badge variant="secondary" className="border-dashed">
                    Archivado
                  </Badge>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-mono">ID: {row.id}</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Datos del cliente</CardTitle>
                <CardDescription>Contacto y ubicación</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre">{row.nombre || '—'}</Field>
                <Field label="Email">{row.email || '—'}</Field>
                <Field label="WhatsApp">{row.whatsapp || '—'}</Field>
                <Field label="Ubicación">
                  {[row.ciudad, row.provincia].filter(Boolean).join(', ') || '—'}
                </Field>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Portal del cliente</CardTitle>
                <CardDescription>
                  Acceso web a movimientos y documentación (tras aceptar el caso y enviar el correo con enlace).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {row.clientPortalUid ? (
                  <>
                    <p>
                      <span className="text-muted-foreground">Cuenta vinculada (UID):</span>{' '}
                      <span className="font-mono text-xs break-all">{row.clientPortalUid}</span>
                    </p>
                    <p className="text-muted-foreground">
                      Vinculado el {formatCreatedAt(row.clientPortalLinkedAt)}
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground">
                    Aún no activó el portal. Al marcar el caso como aceptado y enviar el correo, recibe un enlace
                    a <span className="font-mono text-xs">/mi-caso/activar</span>.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Plan de ahorro</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Field label="Administradora">{row.administradora || '—'}</Field>
                <Field label="Estado del plan">{row.estadoPlan || '—'}</Field>
                <Field label="Adjudicado">{row.adjudicado || '—'}</Field>
                <Field label="Vehículo recibido">{row.vehiculoRecibido || '—'}</Field>
                <Field label="Grupo / orden">{row.grupoOrden || '—'}</Field>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Problema y resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="Problema principal (cliente)">
                  <p className="whitespace-pre-wrap">{row.problemaPrincipal || '—'}</p>
                </Field>
                <Separator />
                <Field label="Resumen de hechos (IA)">
                  <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                    {row.resumenHechos || '—'}
                  </p>
                </Field>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Análisis sugerido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-medium uppercase text-muted-foreground">Urgencia</span>
                  <Badge variant={urgenciaVariant(row.urgencia)} className="capitalize">
                    {row.urgencia || '—'}
                  </Badge>
                </div>
                <Field label="Motivo de urgencia">
                  <p className="whitespace-pre-wrap">{row.motivoUrgencia || '—'}</p>
                </Field>
                <Field label="Documentación disponible">
                  {row.documentacionDisponible?.length
                    ? row.documentacionDisponible.join(', ')
                    : '—'}
                </Field>
                <Field label="Posible categoría jurídica">
                  {row.posibleCategoriaJuridica || '—'}
                </Field>
                <Field label="Próxima acción sugerida">
                  <p className="whitespace-pre-wrap">{row.proximaAccionSugerida || '—'}</p>
                </Field>
              </CardContent>
            </Card>

            <CaseEvaluationEditForm row={row} />

            <PortalChatThread caseId={id} viewer="admin" />

            <CaseEvaluationActions evaluationId={row.id} row={row} />
          </>
        )}
      </div>
    </div>
  );
}
