'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Bot, Loader2, Send, User, RotateCcw } from 'lucide-react';
import { continueConversation } from '@/actions/evaluate-case';
import {
  CASE_EVAL_INITIAL_ASSISTANT_CONTENT,
  CASE_EVAL_INITIAL_QUICK_REPLIES,
} from '@/lib/case-eval-chat-constants';
import type { ChatMessage } from '@/lib/types';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

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
    const content = (messageContent || input).trim();
    if (!content) return;

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
      setMessages([initialMessage]);
  }

  return (
    <Card className="shadow-lg w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className='flex items-center gap-3'>
            <div className="relative">
                <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot />
                    </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-card" />
            </div>
            <div>
                <p className="font-bold text-lg">Juris-IA</p>
                <p className="text-sm text-muted-foreground">Asistente Virtual</p>
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
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-md rounded-xl px-4 py-3 text-sm md:text-base shadow-md',
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-none'
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
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="max-w-md rounded-xl px-4 py-3 shadow-md bg-muted text-foreground rounded-bl-none flex items-center gap-2">
                  <span className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="h-2 w-2 bg-primary rounded-full animate-bounce"></span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex-col items-start gap-4 pt-4">
        {!isFinished && messages[messages.length - 1]?.role === 'assistant' && messages[messages.length - 1].quickReplies && (
            <div className="flex flex-wrap gap-2">
                {messages[messages.length - 1].quickReplies?.map((reply) => (
                    <Button key={reply} variant="outline" size="sm" onClick={() => handleSend(reply)} disabled={isPending}>
                        {reply}
                    </Button>
                ))}
            </div>
        )}
       
        {!isFinished && (
             <form
                onSubmit={(e) => {
                e.preventDefault();
                handleSend();
                }}
                className="flex w-full items-center space-x-2"
            >
                <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu respuesta..."
                disabled={isPending}
                />
                <Button type="submit" size="icon" disabled={isPending || !input.trim()}>
                {isPending ? <Loader2 className="animate-spin" /> : <Send />}
                <span className="sr-only">Enviar</span>
                </Button>
            </form>
        )}

      </CardFooter>
    </Card>
  );
}
