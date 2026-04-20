'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { KnowledgeDoc } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useTransition } from 'react';
import { Loader2, Sparkles, Trash } from 'lucide-react';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { describeKnowledgeDocAction } from '@/actions/ai-actions';

const CATEGORIES = [
  'Posición doctrinaria UCU',
  'Carta / escrito institucional',
  'Análisis normativo',
  'Precedente administrativo',
  'Jurisprudencia comentada',
  'Modelo de escrito',
  'Otro',
] as const;

const docSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres.'),
  category: z.string().min(1, 'Seleccioná una categoría.'),
  description: z.string().optional().default(''),
  content: z.string().min(50, 'El contenido debe tener al menos 50 caracteres.'),
  tags: z
    .string()
    .transform((val) => val.split(',').map((t) => t.trim()).filter(Boolean)),
  active: z.boolean().default(false),
});

type DocFormValues = z.infer<typeof docSchema>;

interface DocumentoFormProps {
  initialData?: KnowledgeDoc;
}

export function DocumentoForm({ initialData }: DocumentoFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const [isDescribing, startDescribing] = useTransition();

  const form = useForm<DocFormValues>({
    resolver: zodResolver(docSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          tags: initialData.tags.join(', '),
        }
      : {
          title: '',
          category: '',
          description: '',
          content: '',
          tags: '',
          active: false,
        },
  });

  const contentLength = form.watch('content')?.length ?? 0;

  const handleGenerateDescription = () => {
    const title = form.getValues('title');
    const content = form.getValues('content');
    if (!content || content.length < 50) {
      toast({
        variant: 'destructive',
        title: 'Contenido insuficiente',
        description: 'Pegá el texto completo del documento antes de generar la descripción.',
      });
      return;
    }
    startDescribing(async () => {
      const result = await describeKnowledgeDocAction({ title: title || '(sin título)', content });
      if (result.error) {
        toast({ variant: 'destructive', title: 'Error de IA', description: result.error });
      } else if (result.data) {
        form.setValue('description', result.data.description, { shouldValidate: true });
        form.setValue('tags', result.data.tags.join(', '), { shouldValidate: true });
        toast({ title: 'Descripción generada', description: 'También se completaron los tags.' });
      }
    });
  };

  const onSubmit = (values: DocFormValues) => {
    startTransition(async () => {
      try {
        if (initialData) {
          const docRef = doc(firestore, 'knowledge_docs', initialData.id);
          await setDoc(
            docRef,
            { ...values, updatedAt: serverTimestamp() },
            { merge: true }
          );
          toast({ title: 'Documento actualizado' });
        } else {
          const colRef = collection(firestore, 'knowledge_docs');
          await addDoc(colRef, {
            ...values,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          toast({ title: 'Documento guardado' });
        }
        router.push('/admin/documentos');
        router.refresh();
      } catch (error) {
        console.error('Error saving knowledge doc:', error);
        toast({
          title: 'Error al guardar',
          description: 'Hubo un problema. Intentá de nuevo.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleDelete = () => {
    if (!initialData) return;
    startDeleting(() => {
      const docRef = doc(firestore, 'knowledge_docs', initialData.id);
      deleteDocumentNonBlocking(docRef);
      toast({ title: 'Documento eliminado' });
      router.push('/admin/documentos');
      router.refresh();
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Contenido del documento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Carta a DNDC sobre problemáticas sistémicas — Nov. 2021"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Descripción breve</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleGenerateDescription}
                          disabled={isDescribing}
                        >
                          {isDescribing ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          Generar con IA
                        </Button>
                      </div>
                      <FormControl>
                        <Textarea
                          placeholder="Síntesis del documento (o usá el botón para generarla automáticamente)."
                          {...field}
                          rows={3}
                        />
                      </FormControl>
                      <FormDescription>
                        Ayuda a la IA a entender el propósito del documento. También completa los tags.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Texto completo</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Pegá aquí el texto completo del documento..."
                          {...field}
                          rows={20}
                          className="font-mono text-sm"
                        />
                      </FormControl>
                      <FormDescription>
                        {contentLength.toLocaleString('es-AR')} caracteres.
                        {contentLength > 50000 && (
                          <span className="text-amber-600 ml-1">
                            Documentos muy largos pueden superar el límite de contexto del modelo.
                          </span>
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Columna lateral */}
          <div className="lg:col-span-1 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Configuración IA</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Activo</FormLabel>
                        <FormDescription>
                          Si está activo, la IA lo usará como contexto al evaluar casos.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button type="submit" disabled={isPending} className="flex-1">
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {initialData ? 'Actualizar' : 'Guardar'}
                  </Button>
                  {initialData && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" type="button" disabled={isDeleting}>
                          {isDeleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. El documento será eliminado de la
                            base de conocimiento de la IA.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Clasificación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccioná una categoría" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="seguros, oponibilidad, prorrateado"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Separar con comas.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}
