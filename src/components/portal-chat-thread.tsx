'use client';

import { useEffect, useRef, useState } from 'react';
import { collection, addDoc, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import type { PortalChatMessage } from '@/lib/types';
import type { Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Loader2, SendHorizonal } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_LEN = 8000;

function permissionHint(error: Error, viewer: PortalChatViewer): string {
  if (error instanceof FirestorePermissionError) {
    return viewer === 'admin'
      ? 'Firestore está rechazando la lectura de la subcolección portal_chat. Suele pasar si en la consola de Firebase todavía hay reglas viejas: esta subcolección necesita su propio bloque en firestore.rules (el del repo ya lo incluye). Publicá las reglas del proyecto, por ejemplo: firebase deploy --only firestore:rules.'
      : 'No tenés permiso para ver el chat de este expediente. Tiene que estar vinculado a tu cuenta desde /mi-caso/activar con el mismo correo de la consulta.';
  }
  return error.message;
}

function formatTs(ts: Timestamp | undefined): string {
  if (!ts || typeof ts.toDate !== 'function') return '';
  return ts.toDate().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
}

function messageRoleLabel(
  m: PortalChatMessage,
  viewer: PortalChatViewer,
  userUid: string | undefined,
): string {
  const fromClient = m.authorRole === 'client';
  const mine = m.authorUid === userUid;
  if (fromClient) {
    return viewer === 'client' && mine ? 'Vos' : 'Cliente';
  }
  return viewer === 'admin' && mine ? 'Vos (estudio)' : 'Estudio';
}

export type PortalChatViewer = 'client' | 'admin';

export function PortalChatThread({
  caseId,
  viewer,
  className,
}: {
  caseId: string;
  viewer: PortalChatViewer;
  /** Altura mínima del área de mensajes */
  className?: string;
}) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevLenRef = useRef(0);

  const chatQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'case_evaluations', caseId, 'portal_chat'),
      orderBy('createdAt', 'asc'),
    );
  }, [firestore, caseId]);

  const { data: messages, isLoading, error } = useCollection<PortalChatMessage>(chatQuery, {
    // El chat puede fallar por cuenta/expediente desalineados; no tumbar toda la app vía global-error.
    emitGlobalPermissionError: false,
  });

  useEffect(() => {
    const len = messages?.length ?? 0;
    if (len === 0) {
      prevLenRef.current = 0;
      return;
    }
    if (len > prevLenRef.current && messages) {
      const last = messages[len - 1];
      const who = messageRoleLabel(last, viewer, user?.uid);
      const snippet = last.text.length > 240 ? `${last.text.slice(0, 240)}…` : last.text;
      setLiveAnnouncement(`${who}: ${snippet}`);
    }
    prevLenRef.current = len;
  }, [messages, viewer, user?.uid]);

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    bottomRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }, [messages?.length]);

  async function send() {
    const text = draft.trim();
    if (!text || !user || !firestore) return;
    if (text.length > MAX_LEN) {
      toast({
        title: 'Mensaje demasiado largo',
        description: `Máximo ${MAX_LEN} caracteres.`,
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      await addDoc(collection(firestore, 'case_evaluations', caseId, 'portal_chat'), {
        text,
        authorUid: user.uid,
        authorRole: viewer === 'admin' ? 'admin' : 'client',
        createdAt: serverTimestamp(),
      });
      setDraft('');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'No se pudo enviar el mensaje.';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  }

  const title = viewer === 'admin' ? 'Chat con el cliente' : 'Mensajes con el estudio';
  const subtitle =
    viewer === 'admin'
      ? 'Los mensajes son internos entre este expediente y el área del cliente.'
      : 'Escribinos por acá; el estudio responde cuando corresponda. No reemplaza el asesoramiento formal.';

  return (
    <div className={cn('rounded-lg border bg-card text-card-foreground flex flex-col', className)}>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </p>
      <div className="px-5 py-4 border-b">
        <h2 className="text-lg font-semibold text-primary tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1.5 leading-snug">{subtitle}</p>
      </div>

      <ScrollArea className="min-h-[300px] max-h-[480px] px-5 py-4">
        {error ? (
          <p className="text-base text-destructive leading-relaxed">{permissionHint(error, viewer)}</p>
        ) : isLoading ? (
          <div className="flex justify-center py-8 text-muted-foreground motion-reduce:animate-none">
            <Loader2 className="h-6 w-6 animate-spin motion-reduce:animate-none" aria-hidden />
            <span className="sr-only">Cargando mensajes</span>
          </div>
        ) : !messages?.length ? (
          <p className="text-base text-muted-foreground py-8 text-center leading-relaxed">
            Todavía no hay mensajes. {viewer === 'client' ? 'Podés iniciar la conversación.' : null}
          </p>
        ) : (
          <ul className="space-y-4 pr-2" aria-label="Historial de mensajes">
            {messages.map((m) => {
              const fromClient = m.authorRole === 'client';
              const who = messageRoleLabel(m, viewer, user?.uid);
              return (
                <li
                  key={m.id}
                  className={cn(
                    'flex',
                    fromClient ? 'justify-start' : 'justify-end',
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-lg px-4 py-2.5 text-base shadow-sm leading-relaxed',
                      fromClient
                        ? 'bg-muted text-foreground rounded-tl-sm'
                        : 'bg-brand text-brand-foreground rounded-tr-sm',
                    )}
                  >
                    <p className="text-xs uppercase tracking-wide opacity-80 mb-1.5 font-medium">
                      {who}
                      {formatTs(m.createdAt) ? ` · ${formatTs(m.createdAt)}` : ''}
                    </p>
                    <p className="whitespace-pre-wrap break-words">{m.text}</p>
                  </div>
                </li>
              );
            })}
            <div ref={bottomRef} />
          </ul>
        )}
      </ScrollArea>

      <div className="p-4 border-t flex flex-col gap-3 sm:flex-row sm:items-end">
        <Textarea
          placeholder={viewer === 'client' ? 'Escribí tu mensaje…' : 'Respuesta al cliente…'}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          maxLength={MAX_LEN}
          className="min-h-[88px] resize-none sm:flex-1 text-base"
          disabled={!user || sending}
          aria-label={viewer === 'client' ? 'Mensaje' : 'Respuesta al cliente'}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <Button
          type="button"
          size="default"
          className="shrink-0"
          onClick={() => void send()}
          disabled={!user || sending || !draft.trim()}
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <SendHorizonal className="h-4 w-4" aria-hidden />}
          <span className="ml-2 hidden sm:inline">Enviar</span>
        </Button>
      </div>
      <p className="px-4 pb-3 text-xs text-muted-foreground">
        Ctrl+Enter o ⌘+Enter para enviar · {draft.length}/{MAX_LEN}
      </p>
    </div>
  );
}
