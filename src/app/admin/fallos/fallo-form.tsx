'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Fallo } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import React, { useTransition } from 'react';
import { CalendarIcon, Loader2, Sparkles, Trash } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { summarizeRulingAction } from '@/actions/ai-actions';


const falloSchema = z.object({
  title: z.string().min(10, 'El título debe tener al menos 10 caracteres.'),
  slug: z.string().min(3, 'El slug debe tener al menos 3 caracteres.').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug inválido (solo minúsculas, números y guiones).'),
  summary: z.string().min(20, 'El resumen debe tener al menos 20 caracteres.'),
  tribunal: z.string().min(5, 'El nombre del tribunal es muy corto.'),
  date: z.date({ required_error: 'La fecha es obligatoria.' }),
  content: z.string().min(50, 'El contenido debe tener al menos 50 caracteres.'),
  published: z.boolean().default(false),
  tags: z.string().transform(val => val.split(',').map(tag => tag.trim()).filter(Boolean)),
});

type FalloFormValues = z.infer<typeof falloSchema>;

interface FalloFormProps {
  initialData?: Fallo;
}

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

export function FalloForm({ initialData }: FalloFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const [isAnalyzing, startAnalyzing] = useTransition();

  const form = useForm<FalloFormValues>({
    resolver: zodResolver(falloSchema),
    defaultValues: initialData ? {
        ...initialData,
        date: new Date(initialData.date),
        tags: initialData.tags.join(', '),
    } : {
      title: '',
      slug: '',
      summary: '',
      tribunal: '',
      date: new Date(),
      content: '',
      published: false,
      tags: '',
    },
  });

  const title = form.watch('title');
  React.useEffect(() => {
    if (title && !initialData) { // only auto-slugify for new documents
      form.setValue('slug', slugify(title), { shouldValidate: true });
    }
  }, [title, form, initialData]);

  const handleAnalyzeContent = () => {
    const content = form.getValues('content');
    if (!content || content.length < 50) {
      toast({
        variant: 'destructive',
        title: 'Contenido insuficiente',
        description: 'Por favor, ingrese el contenido completo del fallo (mínimo 50 caracteres) antes de analizarlo.',
      });
      return;
    }
    startAnalyzing(async () => {
      const result = await summarizeRulingAction({ rulingText: content });
      
      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Error de IA',
          description: result.error,
        });
      } else if (result.data) {
        form.setValue('summary', result.data.summary, { shouldValidate: true });
        form.setValue('tags', result.data.tags.join(', '), { shouldValidate: true });
        toast({
          title: 'Análisis completado',
          description: 'Se generaron el resumen y las etiquetas con IA.',
        });
      }
    });
  };

  const onSubmit = (values: FalloFormValues) => {
    startTransition(async () => {
      try {
        const dataToSave = {
          ...values,
          date: values.date.toISOString(), // Store date as ISO string
        };

        if (initialData) {
          // Update existing document
          const docRef = doc(firestore, 'fallos', initialData.id);
          await setDoc(docRef, {
            ...dataToSave,
            updatedAt: serverTimestamp(),
          }, { merge: true });
          toast({ title: 'Fallo actualizado con éxito' });
        } else {
          // Create new document
          const collectionRef = collection(firestore, 'fallos');
          await addDoc(collectionRef, {
            ...dataToSave,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          toast({ title: 'Fallo creado con éxito' });
        }
        router.push('/admin/fallos');
        router.refresh(); // to reflect changes
      } catch (error) {
        console.error("Error saving document: ", error);
        toast({
          title: 'Error al guardar',
          description: 'Hubo un problema al guardar el fallo. Intente de nuevo.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleDelete = () => {
    if (!initialData) return;
    startDeleting(() => {
        const docRef = doc(firestore, 'fallos', initialData.id);
        deleteDocumentNonBlocking(docRef);
        toast({ title: 'Fallo eliminado' });
        router.push('/admin/fallos');
        router.refresh();
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader><CardTitle>Contenido Principal</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título del Fallo</FormLabel>
                      <FormControl><Input placeholder="Medida Cautelar Favorable por..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contenido Completo</FormLabel>
                      <FormControl><Textarea placeholder="El contenido detallado del fallo..." {...field} rows={15} /></FormControl>
                       <FormDescription>Pegue aquí el texto completo del fallo para analizarlo.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="button" variant="outline" onClick={handleAnalyzeContent} disabled={isAnalyzing}>
                  {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Analizar Contenido con IA
                </Button>

                <FormField
                  control={form.control}
                  name="summary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resumen</FormLabel>
                      <FormControl><Textarea placeholder="Un resumen breve y conciso del fallo (generado con IA o manual)..." {...field} rows={4} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1 space-y-8">
            <Card>
                <CardHeader><CardTitle>Publicación</CardTitle></CardHeader>
                <CardContent className='space-y-4'>
                    <FormField
                    control={form.control}
                    name="published"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                            <FormLabel>Publicado</FormLabel>
                            <FormDescription>
                            Define si el fallo es visible en el sitio público.
                            </FormDescription>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )}
                    />
                    <div className="flex gap-2">
                        <Button type="submit" disabled={isPending || isAnalyzing} className="flex-1">
                            {(isPending || isAnalyzing) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {initialData ? 'Actualizar Fallo' : 'Guardar Fallo'}
                        </Button>
                        {initialData && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" type='button' disabled={isDeleting}>
                                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4" />}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta acción no se puede deshacer. Esto eliminará permanentemente el fallo de la base de datos.
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
                <CardHeader><CardTitle>Metadatos</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                     <FormField
                        control={form.control}
                        name="slug"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Slug</FormLabel>
                            <FormControl><Input placeholder="medida-cautelar-favorable..." {...field} readOnly={!!initialData} /></FormControl>
                            <FormDescription>URL amigable. Se genera automáticamente al crear.</FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                     />
                    <FormField
                        control={form.control}
                        name="tribunal"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Tribunal</FormLabel>
                            <FormControl><Input placeholder="Juzgado Civil y Comercial N°10..." {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Fecha del Fallo</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    >
                                    {field.value ? format(field.value, "PPP", { timeZone: 'UTC' }) : <span>Seleccione una fecha</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="tags"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Tags (Etiquetas)</FormLabel>
                            <FormControl><Input placeholder="clausulas abusivas, medida cautelar" {...field} /></FormControl>
                            <FormDescription>Separar con comas. Se pueden generar con IA.</FormDescription>
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
