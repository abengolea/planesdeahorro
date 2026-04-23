'use client';

import { useEffect, useRef, useState } from 'react';
import { collection, addDoc, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import type { PortalChatMessage } from '@/lib/types';
import type { Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Loader2, SendHorizonal } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_LEN = 8000;

function formatTs(ts: Timestamp | undefined): string {
  if (!ts || typeof ts.toDate !== 'function') return '';
  return ts.toDate().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
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
  const bottomRef = useRef<HTMLDivElement>(null);

  const chatQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'case_evaluations', caseId, 'portal_chat'),
      orderBy('createdAt', 'asc'),
    );
  }, [firestore, caseId]);

  const { data: messages, isLoading, error } = useCollection<PortalChatMessage>(chatQuery);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      <div className="px-4 py-3 border-b">
        <h3 className="text-sm font-semibold text-primary">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>

      <ScrollArea className="min-h-[280px] max-h-[420px] px-4 py-3">
        {error ? (
          <p className="text-sm text-destructive">{error.message}</p>
        ) : isLoading ? (
          <div className="flex justify-center py-8 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : !messages?.length ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Todavía no hay mensajes. {viewer === 'client' ? 'Podés iniciar la conversación.' : null}
          </p>
        ) : (
          <ul className="space-y-3 pr-2">
            {messages.map((m) => {
              const fromClient = m.authorRole === 'client';
              const mine = m.authorUid === user?.uid;
              const who =
                fromClient
                  ? viewer === 'client' && mine
                    ? 'Vos'
                    : 'Cliente'
                  : viewer === 'admin' && mine
                    ? 'Vos (estudio)'
                    : 'Estudio';
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
                      'max-w-[85%] rounded-lg px-3 py-2 text-sm shadow-sm',
                      fromClient
                        ? 'bg-muted text-foreground rounded-tl-sm'
                        : 'bg-primary text-primary-foreground rounded-tr-sm',
                    )}
                  >
                    <p className="text-[10px] uppercase tracking-wide opacity-80 mb-1">
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

      <div className="p-3 border-t flex flex-col gap-2 sm:flex-row sm:items-end">
        <Textarea
          placeholder={viewer === 'client' ? 'Escribí tu mensaje…' : 'Respuesta al cliente…'}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          maxLength={MAX_LEN}
          className="min-h-[72px] resize-none sm:flex-1"
          disabled={!user || sending}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <Button type="button" onClick={() => void send()} disabled={!user || sending || !draft.trim()}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
          <span className="ml-2 hidden sm:inline">Enviar</span>
        </Button>
      </div>
      <p className="px-3 pb-2 text-[10px] text-muted-foreground">
        Ctrl+Enter o ⌘+Enter para enviar · {draft.length}/{MAX_LEN}
      </p>
    </div>
  );
}
