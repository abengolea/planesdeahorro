'use client';

import { useState } from 'react';
import { useUser } from '@/firebase/provider';
import type { CaseEvaluationSubmission } from '@/lib/types';
import type { Timestamp } from 'firebase/firestore';
import type { CaseEvaluationStatus } from '@/lib/case-evaluation-status';
import {
  formatCaseEvaluationStatus,
  isCaseEvaluationStatus,
  isTerminalCaseStatus,
} from '@/lib/case-evaluation-status';
import { resolveCaseEvaluation } from '@/actions/case-evaluation-admin';
import { draftAcceptCaseMessageForEvaluation } from '@/actions/draft-accept-case-message';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

function formatTs(ts: Timestamp | undefined): string {
  if (!ts || typeof ts.toDate !== 'function') return '—';
  return ts.toDate().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
}

const DEFAULT_RECHAZO = `Por la información disponible y la carga actual del estudio, en este momento no podemos continuar con la revisión de tu consulta por este canal.

Te recomendamos, si lo necesitás, consultar con la defensoría pública de tu jurisdicción u otro profesional de tu confianza.`;

const DEFAULT_DERIVADO = `Por el tipo de consulta o la jurisdicción involucrada, te sugerimos canalizar el asunto con un profesional especializado o con matrícula en el lugar correspondiente.

Podés consultar referencias en el colegio de abogados de tu provincia.`;

type DialogKey = 'analisis' | 'aceptar' | 'rechazar' | 'derivar' | 'cerrado' | 'pendiente' | null;

export function CaseEvaluationActions({
  evaluationId,
  row,
}: {
  evaluationId: string;
  row: CaseEvaluationSubmission;
}) {
  const { user } = useUser();
  const { toast } = useToast();
  const [dialog, setDialog] = useState<DialogKey>(null);
  const [submitting, setSubmitting] = useState(false);

  const [internalNote, setInternalNote] = useState('');
  const [clientMessage, setClientMessage] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [draftingAcceptMessage, setDraftingAcceptMessage] = useState(false);

  const rawStatus = row.status;
  const statusNorm: CaseEvaluationStatus | null =
    rawStatus && isCaseEvaluationStatus(rawStatus) ? rawStatus : null;

  function openDialog(key: DialogKey) {
    setInternalNote('');
    setClientMessage('');
    if (key === 'rechazar') setClientMessage(DEFAULT_RECHAZO);
    else if (key === 'derivar') setClientMessage(DEFAULT_DERIVADO);
    if (key === 'analisis') setSendEmail(false);
    else if (key === 'cerrado' || key === 'pendiente') setSendEmail(false);
    else setSendEmail(true);
    setDialog(key);
  }

  async function submit(status: CaseEvaluationStatus) {
    if (!user) {
      toast({ title: 'No hay sesión', description: 'Volvé a iniciar sesión.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const token = await user.getIdToken();
      const res = await resolveCaseEvaluation(token, evaluationId, {
        status,
        sendEmailToClient: sendEmail,
        clientMessage: clientMessage.trim() || undefined,
        internalNote: internalNote.trim() || undefined,
      });
      if (!res.ok) {
        toast({ title: 'No se pudo guardar', description: res.error, variant: 'destructive' });
        return;
      }
      const parts: string[] = ['Estado actualizado.'];
      if (res.emailSent) parts.push('Se envió el correo al cliente.');
      if (res.emailSkippedReason) parts.push(res.emailSkippedReason);
      toast({
        title: 'Listo',
        description: parts.join(' '),
      });
      setDialog(null);
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Intentá de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function suggestAcceptDraft() {
    if (!user) {
      toast({
        title: 'No hay sesión',
        description: 'Volvé a iniciar sesión.',
        variant: 'destructive',
      });
      return;
    }
    setDraftingAcceptMessage(true);
    try {
      const token = await user.getIdToken();
      const res = await draftAcceptCaseMessageForEvaluation(token, evaluationId);
      if (!res.ok) {
        toast({
          title: 'No se generó el borrador',
          description: res.error,
          variant: 'destructive',
        });
        return;
      }
      setClientMessage(res.message);
      toast({
        title: 'Borrador listo',
        description: 'Revisá y ajustá el texto antes de enviar el correo.',
      });
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Intentá de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setDraftingAcceptMessage(false);
    }
  }

  return (
    <>
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Gestionar caso</CardTitle>
          <CardDescription>
            Cambiá el estado, registrá una nota interna y avisá al cliente por correo cuando corresponda.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Estado actual:</span>
            <Badge variant="outline">{formatCaseEvaluationStatus(row.status)}</Badge>
            {statusNorm && isTerminalCaseStatus(statusNorm) ? (
              <span className="text-xs text-muted-foreground">(Podés reabrir el caso cambiando el estado.)</span>
            ) : null}
          </div>

          {(row.statusUpdatedAt || row.adminInternalNote || row.lastClientNotifiedAt) && (
            <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-2">
              {row.statusUpdatedAt ? (
                <p>
                  <span className="text-muted-foreground">Último cambio: </span>
                  {formatTs(row.statusUpdatedAt)}
                  {row.statusUpdatedByEmail ? (
                    <span className="text-muted-foreground"> · {row.statusUpdatedByEmail}</span>
                  ) : null}
                </p>
              ) : null}
              {row.adminInternalNote ? (
                <p>
                  <span className="text-muted-foreground">Nota interna: </span>
                  <span className="whitespace-pre-wrap">{row.adminInternalNote}</span>
                </p>
              ) : null}
              {row.lastClientNotifiedAt ? (
                <p className="text-xs text-muted-foreground">
                  Último mail al cliente: {formatTs(row.lastClientNotifiedAt)}
                  {row.lastClientNotifiedKind ? ` (${row.lastClientNotifiedKind})` : ''}
                </p>
              ) : null}
            </div>
          )}

          <Separator />

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => openDialog('pendiente')}>
              Pendiente de revisión
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => openDialog('analisis')}>
              En análisis
            </Button>
            <Button type="button" size="sm" onClick={() => openDialog('aceptar')}>
              Aceptar caso
            </Button>
            <Button type="button" variant="destructive" size="sm" onClick={() => openDialog('rechazar')}>
              Rechazar
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => openDialog('derivar')}>
              Derivar
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => openDialog('cerrado')}>
              Cerrar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialog === 'pendiente'} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Volver a pendiente de revisión</DialogTitle>
            <DialogDescription>
              Marcá el caso como pendiente si hubo un error o debe revisarse de nuevo. No se envía correo
              automático.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="int-pend">Nota interna (opcional)</Label>
              <Textarea
                id="int-pend"
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="Motivo del cambio…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={() => void submit('pendiente de revisión')} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === 'analisis'} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar en análisis</DialogTitle>
            <DialogDescription>
              Indicá que el equipo está trabajando el caso. Podés avisar al cliente por mail con un mensaje
              opcional.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="msg-analisis">Mensaje adicional para el cliente (opcional)</Label>
              <Textarea
                id="msg-analisis"
                value={clientMessage}
                onChange={(e) => setClientMessage(e.target.value)}
                placeholder="Ej.: En los próximos días te escribimos por WhatsApp…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="int-analisis">Nota interna (opcional)</Label>
              <Textarea
                id="int-analisis"
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="mail-analisis"
                checked={sendEmail}
                onCheckedChange={(v) => setSendEmail(v === true)}
              />
              <Label htmlFor="mail-analisis" className="font-normal cursor-pointer">
                Enviar correo al cliente
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={() => void submit('en análisis')} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === 'aceptar'} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aceptar caso</DialogTitle>
            <DialogDescription>
              Se enviará un correo indicando que podés avanzar. Sumá próximos pasos concretos (turno, WhatsApp,
              documentación).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="msg-acept">Mensaje para el cliente (recomendado)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1.5"
                  disabled={submitting || draftingAcceptMessage || !user}
                  onClick={() => void suggestAcceptDraft()}
                >
                  {draftingAcceptMessage ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Sparkles className="h-4 w-4" aria-hidden />
                  )}
                  Sugerir borrador (IA)
                </Button>
              </div>
              <Textarea
                id="msg-acept"
                value={clientMessage}
                onChange={(e) => setClientMessage(e.target.value)}
                placeholder="Ej.: Te escribimos al WhatsApp indicado para coordinar…"
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="int-acept">Nota interna (opcional)</Label>
              <Textarea id="int-acept" value={internalNote} onChange={(e) => setInternalNote(e.target.value)} />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="mail-acept"
                checked={sendEmail}
                onCheckedChange={(v) => setSendEmail(v === true)}
              />
              <Label htmlFor="mail-acept" className="font-normal cursor-pointer">
                Enviar correo al cliente
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={() => void submit('aceptado')} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aceptar y guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === 'rechazar'} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rechazar caso</DialogTitle>
            <DialogDescription>
              Editá el texto que recibirá el cliente. El tono debe ser claro y respetuoso; evitá conclusiones
              jurídicas definitivas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="msg-rech">Mensaje para el cliente</Label>
              <Textarea
                id="msg-rech"
                value={clientMessage}
                onChange={(e) => setClientMessage(e.target.value)}
                className="min-h-[140px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="int-rech">Nota interna (opcional)</Label>
              <Textarea id="int-rech" value={internalNote} onChange={(e) => setInternalNote(e.target.value)} />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="mail-rech"
                checked={sendEmail}
                onCheckedChange={(v) => setSendEmail(v === true)}
              />
              <Label htmlFor="mail-rech" className="font-normal cursor-pointer">
                Enviar correo al cliente
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)} disabled={submitting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => void submit('rechazado')} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Rechazar y guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === 'derivar'} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Derivar caso</DialogTitle>
            <DialogDescription>
              Indicá al cliente que el estudio deriva la consulta (otra especialidad, otra jurisdicción, etc.).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="msg-der">Mensaje para el cliente</Label>
              <Textarea
                id="msg-der"
                value={clientMessage}
                onChange={(e) => setClientMessage(e.target.value)}
                className="min-h-[140px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="int-der">Nota interna (opcional)</Label>
              <Textarea id="int-der" value={internalNote} onChange={(e) => setInternalNote(e.target.value)} />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="mail-der"
                checked={sendEmail}
                onCheckedChange={(v) => setSendEmail(v === true)}
              />
              <Label htmlFor="mail-der" className="font-normal cursor-pointer">
                Enviar correo al cliente
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={() => void submit('derivado')} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Derivar y guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === 'cerrado'} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cerrar caso</DialogTitle>
            <DialogDescription>
              Archivá la consulta en este canal. Podés enviar un cierre breve al cliente o solo registrar nota
              interna.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="msg-cerr">Mensaje para el cliente (opcional)</Label>
              <Textarea
                id="msg-cerr"
                value={clientMessage}
                onChange={(e) => setClientMessage(e.target.value)}
                placeholder="Si enviás mail, este texto se agrega al cierre estándar."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="int-cerr">Nota interna (opcional)</Label>
              <Textarea id="int-cerr" value={internalNote} onChange={(e) => setInternalNote(e.target.value)} />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="mail-cerr"
                checked={sendEmail}
                onCheckedChange={(v) => setSendEmail(v === true)}
              />
              <Label htmlFor="mail-cerr" className="font-normal cursor-pointer">
                Enviar correo al cliente
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={() => void submit('cerrado')} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cerrar caso'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
