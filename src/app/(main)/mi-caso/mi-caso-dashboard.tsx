'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  collection,
  doc,
  orderBy,
  query,
  where,
  addDoc,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';
import { signOut } from 'firebase/auth';
import {
  useAuth,
  useCollection,
  useDoc,
  useFirestore,
  useFirebaseStorage,
  useMemoFirebase,
  useUser,
} from '@/firebase';
import type {
  CaseEvaluationSubmission,
  ClientCaseUpload,
  ExpedienteMovimiento,
} from '@/lib/types';
import { formatCaseEvaluationStatus } from '@/lib/case-evaluation-status';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { PortalChatThread } from '@/components/portal-chat-thread';
import { AlertCircle, FileUp, Loader2, LogOut } from 'lucide-react';

function formatTs(ts: Timestamp | undefined): string {
  if (!ts || typeof ts.toDate !== 'function') return '—';
  return ts.toDate().toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' });
}

function sanitizeFileName(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
  return base || 'archivo';
}

function CasePanel({ caseId }: { caseId: string }) {
  const firestore = useFirestore();
  const storage = useFirebaseStorage();
  const { user } = useUser();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const caseRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'case_evaluations', caseId);
  }, [firestore, caseId]);

  const { data: caso, isLoading: loadingCaso, error: errCaso } =
    useDoc<CaseEvaluationSubmission>(caseRef);

  const movQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'case_evaluations', caseId, 'expediente_movimientos'),
      orderBy('createdAt', 'desc'),
    );
  }, [firestore, caseId]);

  const { data: movimientos, isLoading: loadingMov, error: errMov } =
    useCollection<ExpedienteMovimiento>(movQuery);

  const upQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'case_evaluations', caseId, 'client_uploads'),
      orderBy('uploadedAt', 'desc'),
    );
  }, [firestore, caseId]);

  const { data: uploads, isLoading: loadingUp, error: errUp } =
    useCollection<ClientCaseUpload>(upQuery);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user || !storage || !firestore) return;

    const max = 15 * 1024 * 1024;
    if (file.size > max) {
      toast({
        title: 'Archivo demasiado grande',
        description: 'El límite es 15 MB por archivo PDF.',
        variant: 'destructive',
      });
      return;
    }

    const isPdf = file.type === 'application/pdf' || file.type === 'application/x-pdf';
    const nameOk = file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf && !nameOk) {
      toast({
        title: 'Solo PDF',
        description: 'La documentación debe subirse en formato PDF.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const safe = sanitizeFileName(file.name);
      const path = `case_client_docs/${caseId}/${user.uid}/${Date.now()}_${safe}`;
      const sref = ref(storage, path);
      await uploadBytes(sref, file, { contentType: file.type || 'application/pdf' });
      await addDoc(collection(firestore, 'case_evaluations', caseId, 'client_uploads'), {
        storagePath: path,
        fileName: file.name,
        contentType: file.type || '',
        size: file.size,
        uploadedByUid: user.uid,
        uploadedAt: serverTimestamp(),
      });
      toast({ title: 'Archivo subido', description: 'El estudio va a poder verlo en el expediente.' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo subir el archivo.';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  }

  if (loadingCaso) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (errCaso || !caso) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No se pudo cargar el expediente</AlertTitle>
        <AlertDescription>{errCaso?.message ?? 'Intentá más tarde.'}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="font-headline text-xl">{caso.nombre || 'Tu consulta'}</CardTitle>
            <CardDescription className="mt-1">
              {caso.administradora ? `${caso.administradora} · ` : null}
              Estado: {formatCaseEvaluationStatus(caso.status)}
            </CardDescription>
          </div>
          <span className="text-xs font-mono text-muted-foreground">ID: {caso.id ?? caseId}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        <PortalChatThread caseId={caseId} viewer="client" />

        <Separator />

        <section>
          <h3 className="text-sm font-semibold text-primary mb-3">Documentación (PDF)</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Subí contratos, cartas documento, comprobantes u otra documentación en PDF (máx. 15 MB por
            archivo).
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" disabled={uploading} asChild>
              <label className="cursor-pointer">
                <FileUp className="h-4 w-4 mr-2 inline" />
                {uploading ? 'Subiendo…' : 'Elegir PDF'}
                <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={onFile} />
              </label>
            </Button>
          </div>
          {errUp ? (
            <p className="text-sm text-destructive mt-3">{errUp.message}</p>
          ) : loadingUp ? (
            <p className="text-xs text-muted-foreground mt-3">Cargando archivos…</p>
          ) : uploads?.length ? (
            <ul className="mt-4 space-y-2 text-sm">
              {uploads.map((u) => (
                <li key={u.id} className="flex justify-between gap-2 border rounded-md px-3 py-2">
                  <span className="truncate">{u.fileName}</span>
                  <span className="text-muted-foreground shrink-0">{formatTs(u.uploadedAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground mt-3">Aún no subiste archivos.</p>
          )}
        </section>

        <Separator />

        <section>
          <h3 className="text-sm font-semibold text-primary mb-3">Movimientos del expediente</h3>
          {errMov ? (
            <p className="text-sm text-destructive">{errMov.message}</p>
          ) : loadingMov ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : !movimientos?.length ? (
            <p className="text-sm text-muted-foreground">Todavía no hay movimientos registrados.</p>
          ) : (
            <ul className="space-y-4">
              {movimientos.map((m) => (
                <li key={m.id} className="border-l-2 border-accent/70 pl-4">
                  <p className="text-xs text-muted-foreground">{formatTs(m.createdAt)}</p>
                  <p className="font-medium text-sm">{m.titulo}</p>
                  {m.detalle ? (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">{m.detalle}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </CardContent>
    </Card>
  );
}

export function MiCasoDashboard() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  /** Expedientes vinculados al UID (no depende de `client_portal_profiles`, más robusto con las reglas). */
  const linkedCasesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'case_evaluations'),
      where('clientPortalUid', '==', user.uid),
    );
  }, [firestore, user]);

  const { data: linkedCases, isLoading: loadingCases } =
    useCollection<CaseEvaluationSubmission>(linkedCasesQuery);

  const evaluationIds = useMemo(() => {
    const ids = (linkedCases ?? []).map((r) => r.id).filter(Boolean);
    return [...new Set(ids as string[])];
  }, [linkedCases]);

  async function onLogout() {
    await signOut(auth);
    toast({ title: 'Sesión cerrada' });
  }

  if (isUserLoading) {
    return (
      <div className="flex justify-center py-20 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 max-w-lg py-12">
        <Alert>
          <AlertTitle>Iniciá sesión</AlertTitle>
          <AlertDescription className="mt-2">
            Para ver tu expediente necesitás haber activado el enlace que te enviamos por correo cuando el
            estudio aceptó tu consulta.
          </AlertDescription>
          <Button className="mt-4" asChild>
            <Link href="/mi-caso/activar">Ir a activar acceso</Link>
          </Button>
        </Alert>
      </div>
    );
  }

  if (loadingCases) {
    return (
      <div className="flex justify-center py-20 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 max-w-3xl py-10 md:py-14 space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold text-primary">Tu consulta</h1>
          <p className="text-muted-foreground text-sm mt-1">{user.email}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Salir
        </Button>
      </div>

      {evaluationIds.length === 0 ? (
        <Alert>
          <AlertTitle>Todavía no hay expedientes vinculados</AlertTitle>
          <AlertDescription className="mt-2">
            Abrí el enlace del correo de aceptación y pulsá “Vincular expediente”. Si ya lo hiciste con otra
            cuenta, iniciá sesión con el mismo correo de la consulta.
          </AlertDescription>
          <Button className="mt-4" variant="secondary" asChild>
            <Link href="/mi-caso/activar">Abrir activación</Link>
          </Button>
        </Alert>
      ) : (
        <div className="space-y-8">
          {evaluationIds.map((id) => (
            <CasePanel key={id} caseId={id} />
          ))}
        </div>
      )}
    </div>
  );
}
