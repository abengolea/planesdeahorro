'use client';

import { useState, useRef, useEffect, useTransition, useCallback } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Bot, Loader2, Mic, Send, Square, User, RotateCcw } from 'lucide-react';
import { continueConversation } from '@/actions/evaluate-case';
import { validateCaseSpeechTopic } from '@/actions/validate-case-speech-topic';
import {
  CASE_EVAL_INITIAL_ASSISTANT_CONTENT,
  CASE_EVAL_INITIAL_QUICK_REPLIES,
} from '@/lib/case-eval-chat-constants';
import type { ChatMessage } from '@/lib/types';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CASE_EVAL_MAX_VOICE_SECONDS, useCaseEvalSpeech } from './use-case-eval-speech';

function formatVoiceCountdown(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const initialMessage: ChatMessage = {
  id: 'inicio',
  role: 'assistant',
  content: CASE_EVAL_INITIAL_ASSISTANT_CONTENT,
  quickReplies: [...CASE_EVAL_INITIAL_QUICK_REPLIES],
};

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}


export function ChatClient() {
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const [sessionId] = useState<string>(generateSessionId);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const validateSpoken = useCallback(async (spokenText: string) => {
    const { ok } = await validateCaseSpeechTopic(spokenText);
    return ok;
  }, []);

  const {
    isSupported: voiceSupported,
    isListening,
    remainingSec,
    speechError,
    setSpeechError,
    startListening,
    stopListening,
    invalidateVoiceSession,
    liveDisplay,
  } = useCaseEvalSpeech(setInput, { validateSpoken });

  const fieldValue = isListening ? liveDisplay : input;

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSend = (messageContent?: string) => {
    if (isListening) return;

    const content = (messageContent ?? fieldValue).trim();
    if (!content) return;

    setSpeechError(null);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    startTransition(async () => {
      const newHistory = [...messages, userMessage];
      const assistantResponse = await continueConversation(newHistory, sessionId);
      setMessages(prev => [...prev, assistantResponse]);
    });
  };
  
  const isFinished = messages[messages.length - 1]?.isFinished || false;

  const handleReset = () => {
    invalidateVoiceSession();
    stopListening();
    setSpeechError(null);
    setMessages([initialMessage]);
    setInput('');
  };

  return (
    <Card className="shadow-lg w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className='flex items-center gap-3'>
            <div className="relative">
                <Avatar>
                    <AvatarFallback className="bg-brand text-brand-foreground">
                    <Bot />
                    </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-card" />
            </div>
            <div>
                <p className="font-bold text-lg">Asistente Virtual</p>
                <p className="text-sm text-muted-foreground">Estudio Dr. Adrián Bengolea</p>
            </div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleReset} aria-label="Reiniciar conversación">
            <RotateCcw className="h-5 w-5"/>
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[50vh] pr-4" ref={scrollAreaRef}>
          <div className="space-y-6">
            {messages.map((m, index) => (
              <div
                key={m.id}
                className={cn(
                  'flex items-end gap-3',
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {m.role === 'assistant' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-brand text-brand-foreground">
                      <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-md rounded-xl px-4 py-3 text-sm md:text-base shadow-md',
                    m.role === 'user'
                      ? 'bg-brand text-brand-foreground rounded-br-none'
                      : 'bg-muted text-foreground rounded-bl-none'
                  )}
                >
                  <ReactMarkdown
                    components={{
                      p: ({node, ...props}) => <p className="whitespace-pre-wrap" {...props} />,
                    }}
                  >
                    {m.content}
                  </ReactMarkdown>
                </div>
                {m.role === 'user' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
             {isPending && (
              <div className="flex items-end gap-3 justify-start">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-brand text-brand-foreground">
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="max-w-md rounded-xl px-4 py-3 shadow-md bg-muted text-foreground rounded-bl-none flex items-center gap-2">
                  <span className="h-2 w-2 bg-brand rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="h-2 w-2 bg-brand rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="h-2 w-2 bg-brand rounded-full animate-bounce"></span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex-col items-start gap-4 pt-4">
        {!isFinished &&
          messages[messages.length - 1]?.role === 'assistant' &&
          (messages[messages.length - 1].quickReplies?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-2">
              {messages[messages.length - 1].quickReplies?.map((reply) => (
                <Button
                  key={reply}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSend(reply)}
                  disabled={isPending || isListening}
                >
                  {reply}
                </Button>
              ))}
            </div>
          )}

        {speechError && (
          <p className="text-sm text-destructive w-full" role="alert">
            {speechError}
          </p>
        )}

        {!isFinished && (
          <TooltipProvider delayDuration={300}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex w-full flex-col gap-2"
            >
              <div className="flex w-full items-center gap-2">
                <Input
                  value={fieldValue}
                  onChange={(e) => {
                    if (!isListening) setInput(e.target.value);
                  }}
                  readOnly={isListening}
                  placeholder={
                    isListening
                      ? 'Dictando… al terminar validamos que sea sobre tu plan de ahorro.'
                      : 'Escribí tu respuesta…'
                  }
                  disabled={isPending}
                  className="flex-1 min-w-0"
                  aria-label="Tu mensaje"
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant={isListening ? 'secondary' : 'outline'}
                      className={cn(
                        'shrink-0',
                        isListening && 'ring-2 ring-primary ring-offset-2 ring-offset-background animate-pulse'
                      )}
                      disabled={isPending || !voiceSupported}
                      onClick={() => (isListening ? stopListening() : startListening(fieldValue))}
                      aria-pressed={isListening}
                      aria-label={
                        isListening ? 'Detener dictado' : 'Dictar con el micrófono (máximo 2 minutos)'
                      }
                    >
                      {isListening ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    {voiceSupported ? (
                      <p>
                        Dictado por voz: hasta {CASE_EVAL_MAX_VOICE_SECONDS / 60} minutos (Chrome o Edge). Al cortar,
                        validamos que el relato sea sobre planes de ahorro; si no, no se agrega al mensaje.
                      </p>
                    ) : (
                      <p>Tu navegador no permite dictado. Escribí el mensaje o probá con Chrome o Edge.</p>
                    )}
                  </TooltipContent>
                </Tooltip>
                <Button
                  type="submit"
                  size="icon"
                  disabled={isPending || isListening || !fieldValue.trim()}
                >
                  {isPending ? <Loader2 className="animate-spin" /> : <Send />}
                  <span className="sr-only">Enviar</span>
                </Button>
              </div>
              {isListening && (
                <p className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
                  Grabando: {formatVoiceCountdown(remainingSec)} · se detiene sola al llegar a 0:00
                </p>
              )}
              {!voiceSupported && (
                <p className="text-xs text-muted-foreground">
                  El dictado por voz no está disponible en este navegador; podés escribir el relato. En Chrome o Edge suele
                  estar disponible.
                </p>
              )}
            </form>
          </TooltipProvider>
        )}
      </CardFooter>
    </Card>
  );
}
