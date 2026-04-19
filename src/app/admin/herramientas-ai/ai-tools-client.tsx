'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { draftOutlineAction, summarizeRulingAction } from '@/actions/ai-actions';

export function AiToolsClient() {
  const [rulingText, setRulingText] = useState('');
  const [summary, setSummary] = useState('');
  const [isSummarizing, startSummarizing] = useTransition();

  const [topic, setTopic] = useState('');
  const [outline, setOutline] = useState('');
  const [isDrafting, startDrafting] = useTransition();

  const { toast } = useToast();

  const handleSummarize = () => {
    if (!rulingText.trim()) {
        toast({ variant: 'destructive', title: 'El texto del fallo no puede estar vacío.' });
        return;
    }
    startSummarizing(async () => {
      setSummary('');
      const result = await summarizeRulingAction({ rulingText });
      if (result.error) {
        toast({ variant: 'destructive', title: 'Error al generar el resumen.', description: result.error });
      } else if (result.data) {
        const formattedResult = `Resumen:\n${result.data.summary}\n\nEtiquetas: ${result.data.tags.join(', ')}`;
        setSummary(formattedResult);
      }
    });
  };

  const handleDraft = () => {
    if (!topic.trim()) {
        toast({ variant: 'destructive', title: 'El tema no puede estar vacío.' });
        return;
    }
    startDrafting(async () => {
      setOutline('');
      const result = await draftOutlineAction({ topicOrKeywords: topic });
      if (result.error) {
        toast({ variant: 'destructive', title: 'Error al generar el esquema.', description: result.error });
      } else if (result.data) {
        setOutline(result.data.outline);
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Summarize Ruling Card */}
      <Card>
        <CardHeader>
          <CardTitle>Resumidor de Fallos</CardTitle>
          <CardDescription>
            Pegue el texto completo de un fallo judicial para generar un resumen conciso y objetivo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Pegue aquí el texto completo del fallo..."
            className="min-h-[200px]"
            value={rulingText}
            onChange={(e) => setRulingText(e.target.value)}
            disabled={isSummarizing}
          />
          <Button onClick={handleSummarize} disabled={isSummarizing}>
            {isSummarizing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resumiendo...
              </>
            ) : (
              'Generar Resumen'
            )}
          </Button>
          {(isSummarizing || summary) && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle>Resumen Generado</CardTitle>
              </CardHeader>
              <CardContent>
                {isSummarizing ? (
                  <div className="flex items-center space-x-2 text-muted-foreground">
                     <Loader2 className="h-4 w-4 animate-spin" />
                     <span>Analizando el texto...</span>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{summary}</p>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Draft Article Outline Card */}
      <Card>
        <CardHeader>
          <CardTitle>Borrador de Artículo de Doctrina</CardTitle>
          <CardDescription>
            Ingrese un tema o palabras clave para generar un esquema detallado para un nuevo artículo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Ej: La teoría de la imprevisión en planes de ahorro"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isDrafting}
          />
          <Button onClick={handleDraft} disabled={isDrafting}>
            {isDrafting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              'Generar Esquema'
            )}
          </Button>
          {(isDrafting || outline) && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle>Esquema Sugerido</CardTitle>
              </Header>
              <CardContent>
                {isDrafting ? (
                    <div className="flex items-center space-x-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Creando la estructura...</span>
                    </div>
                ) : (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <pre className='whitespace-pre-wrap font-body text-sm'>{outline}</pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
