'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { addDoc, collection, deleteField, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';
import { useFirestore, useAuth } from '@/firebase';
import { deleteFalloPdfAdminAction, uploadFalloPdfAdminAction } from '@/actions/fallo-storage-actions';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Fallo } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import React, { useRef, useState, useTransition } from 'react';
import { CalendarIcon, FileDown, FileUp, Loader2, Sparkles, Trash } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { analyzeFalloPdfAction, summarizeRulingAction } from '@/actions/ai-actions';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const PDF_MAX_BYTES = 12 * 1024 * 1024;

function storageErrorDescription(error: unknown): string {
  if (error instanceof FirebaseError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Error desconocido.';
}

async function persistFalloPdfServer(falloId: string, file: File, idToken: string) {
  const fd = new FormData();
  fd.append('file', file);
  const result = await uploadFalloPdfAdminAction(idToken, falloId, fd);
  if (!result.ok) {
    throw new Error(result.error);
  }
  return { path: result.path, url: result.url, fileName: result.fileName };
}

async function deleteFalloPdfServer(idToken: string, fullPath: string) {
  const result = await deleteFalloPdfAdminAction(idToken, fullPath);
  if (!result.ok) {
    throw new Error(result.error);
  }
}

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
  const auth = useAuth();
  const [removePdf, setRemovePdf] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const [isAnalyzing, startAnalyzing] = useTransition();
  const [isPdfAnalyzing, startPdfAnalyzing] = useTransition();
  const pdfInputRef = useRef<HTMLInputElement>(null);

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
        const d = result.data;
        form.setValue('summary', d.summary, { shouldValidate: true });
        form.setValue('tags', d.tags.join(', '), { shouldValidate: true });
        const titleVal = d.suggestedTitle?.trim();
        if (titleVal && (!initialData || !form.getValues('title')?.trim())) {
          form.setValue('title', titleVal, { shouldValidate: true });
        }
        const tribunalVal = d.suggestedTribunal?.trim();
        if (tribunalVal && (!initialData || !form.getValues('tribunal')?.trim())) {
          form.setValue('tribunal', tribunalVal, { shouldValidate: true });
        }
        toast({
          title: 'Análisis completado',
          description: 'Se generaron el resumen y las etiquetas con IA.',
        });
      }
    });
  };

  const handleAnalyzePdf = () => {
    const file = pdfInputRef.current?.files?.[0];
    if (!file || file.size === 0) {
      toast({
        variant: 'destructive',
        title: 'Falta el PDF',
        description: 'Elegí un archivo .pdf antes de analizar.',
      });
      return;
    }
    if (file.size > PDF_MAX_BYTES) {
      toast({
        variant: 'destructive',
        title: 'PDF demasiado grande',
        description: 'El máximo es 12 MB (análisis con IA y almacenamiento).',
      });
      return;
    }
    startPdfAnalyzing(async () => {
      const fd = new FormData();
      fd.append('file', file);
      const result = await analyzeFalloPdfAction(fd);
      if (result.error) {
        toast({ variant: 'destructive', title: 'No se pudo procesar el PDF', description: result.error });
        return;
      }
      if (!result.data) return;

      const d = result.data;
      form.setValue('content', d.extractedText, { shouldValidate: true });
      form.setValue('summary', d.summary, { shouldValidate: true });
      form.setValue('tags', d.tags.join(', '), { shouldValidate: true });
      const titleVal = d.suggestedTitle?.trim();
      if (titleVal && (!initialData || !form.getValues('title')?.trim())) {
        form.setValue('title', titleVal, { shouldValidate: true });
      }
      const tribunalVal = d.suggestedTribunal?.trim();
      if (tribunalVal && (!initialData || !form.getValues('tribunal')?.trim())) {
        form.setValue('tribunal', tribunalVal, { shouldValidate: true });
      }
      toast({
        title: 'PDF analizado',
        description: `Se extrajo el texto de “${d.fileName}” y la IA completó resumen y etiquetas.`,
      });
    });
  };

  const onSubmit = (values: FalloFormValues) => {
    startTransition(async () => {
      try {
        const dataToSave = {
          ...values,
          date: values.date.toISOString(), // Store date as ISO string
        };

        const file = pdfInputRef.current?.files?.[0];
        const hasNewPdf = !!(file && file.size > 0);

        if (hasNewPdf && file!.size > PDF_MAX_BYTES) {
          toast({
            variant: 'destructive',
            title: 'PDF demasiado grande',
            description: 'El máximo es 12 MB.',
          });
          return;
        }

        const needsStorageOp =
          hasNewPdf ||
          (!!initialData && removePdf && !!initialData.pdfStoragePath);
        let idToken: string | undefined;
        if (needsStorageOp) {
          const t = await auth.currentUser?.getIdToken();
          if (!t) {
            toast({
              variant: 'destructive',
              title: 'Sesión requerida',
              description: 'Iniciá sesión de nuevo para subir o quitar el PDF.',
            });
            return;
          }
          idToken = t;
        }

        if (initialData) {
          const docRef = doc(firestore, 'fallos', initialData.id);

          if (!hasNewPdf && removePdf) {
            if (initialData.pdfStoragePath && idToken) {
              await deleteFalloPdfServer(idToken, initialData.pdfStoragePath);
            }
            await setDoc(
              docRef,
              {
                ...dataToSave,
                pdfUrl: deleteField(),
                pdfStoragePath: deleteField(),
                pdfFileName: deleteField(),
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );
            toast({ title: 'Fallo actualizado con éxito' });
          } else {
            await setDoc(docRef, { ...dataToSave, updatedAt: serverTimestamp() }, { merge: true });

            if (hasNewPdf) {
              if (!idToken) {
                toast({
                  variant: 'destructive',
                  title: 'Sesión requerida',
                  description: 'No se pudo obtener el token para subir el PDF.',
                });
                return;
              }
              if (initialData.pdfStoragePath) {
                await deleteFalloPdfServer(idToken, initialData.pdfStoragePath);
              }
              const uploaded = await persistFalloPdfServer(initialData.id, file!, idToken);
              await updateDoc(docRef, {
                pdfUrl: uploaded.url,
                pdfStoragePath: uploaded.path,
                pdfFileName: uploaded.fileName,
              });
            }
            toast({ title: 'Fallo actualizado con éxito' });
          }
        } else {
          const collectionRef = collection(firestore, 'fallos');
          const newRef = await addDoc(collectionRef, {
            ...dataToSave,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          const newId = newRef.id;

          if (hasNewPdf) {
            if (!idToken) {
              toast({
                variant: 'destructive',
                title: 'Sesión requerida',
                description: 'No se pudo obtener el token para subir el PDF.',
              });
              return;
            }
            const uploaded = await persistFalloPdfServer(newId, file!, idToken);
            await updateDoc(doc(firestore, 'fallos', newId), {
              pdfUrl: uploaded.url,
              pdfStoragePath: uploaded.path,
              pdfFileName: uploaded.fileName,
            });
          }
          toast({ title: 'Fallo creado con éxito' });
        }
        router.push('/admin/fallos');
        router.refresh(); // to reflect changes
      } catch (error) {
        console.error('Error saving document: ', error);
        toast({
          title: 'Error al guardar',
          description: storageErrorDescription(error),
          variant: 'destructive',
        });
      }
    });
  };

  const handleDelete = () => {
    if (!initialData) return;
    startDeleting(async () => {
      if (initialData.pdfStoragePath) {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) {
          toast({
            variant: 'destructive',
            title: 'Sesión requerida',
            description: 'Iniciá sesión de nuevo para eliminar el fallo y su PDF.',
          });
          return;
        }
        await deleteFalloPdfServer(idToken, initialData.pdfStoragePath);
      }
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
              <CardHeader><CardTitle>Contenido principal</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-dashed bg-muted/30 p-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium">Fallo en PDF (recomendado)</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Subí el fallo en PDF: en el servidor se extrae el texto y la IA genera resumen, etiquetas y, si el
                      documento lo permite, sugerencias de título y tribunal. Al <strong className="text-foreground">Guardar
                      fallo</strong>, el mismo PDF se publica en almacenamiento y los visitantes pueden descargarlo desde la
                      ficha del fallo.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                    <Input
                      ref={pdfInputRef}
                      type="file"
                      accept="application/pdf"
                      className="cursor-pointer sm:max-w-md"
                      disabled={isPdfAnalyzing}
                      onChange={() => setRemovePdf(false)}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleAnalyzePdf}
                      disabled={isPdfAnalyzing || isAnalyzing}
                    >
                      {isPdfAnalyzing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <FileUp className="mr-2 h-4 w-4" />
                      )}
                      Extraer texto y analizar con IA
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tamaño máximo 12&nbsp;MB (análisis con IA y archivo en el sitio). Si el PDF es solo imagen escaneada sin
                    texto, la extracción fallará: usá un PDF con texto seleccionable u OCR.
                  </p>

                  {initialData?.pdfUrl && (
                    <div className="rounded-md border bg-background/80 p-3 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">PDF publicado</p>
                          <p className="text-xs text-muted-foreground truncate" title={initialData.pdfFileName}>
                            {initialData.pdfFileName ?? 'original.pdf'}
                          </p>
                        </div>
                        <Button type="button" variant="outline" size="sm" asChild>
                          <a href={initialData.pdfUrl} target="_blank" rel="noopener noreferrer">
                            <FileDown className="mr-2 h-4 w-4" />
                            Abrir / descargar
                          </a>
                        </Button>
                      </div>
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id="remove-pdf"
                          checked={removePdf}
                          onCheckedChange={(v) => setRemovePdf(v === true)}
                        />
                        <Label htmlFor="remove-pdf" className="text-sm font-normal leading-snug cursor-pointer">
                          Quitar el PDF del sitio al guardar (no borra el texto ya cargado en el formulario)
                        </Label>
                      </div>
                    </div>
                  )}
                </div>

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
                      <FormLabel>Texto completo del fallo</FormLabel>
                      <FormControl><Textarea placeholder="Texto completo del fallo (se rellena automáticamente desde el PDF o pegalo acá)..." {...field} rows={15} /></FormControl>
                       <FormDescription>
                        Podés partir del PDF (arriba) o pegar el texto. Luego usá el botón de analizar con IA sobre este
                        texto si querés regenerar solo resumen y etiquetas.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="button" variant="outline" onClick={handleAnalyzeContent} disabled={isAnalyzing || isPdfAnalyzing}>
                  {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Analizar texto del cuadro con IA
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
                        <Button type="submit" disabled={isPending || isAnalyzing || isPdfAnalyzing} className="flex-1">
                            {(isPending || isAnalyzing || isPdfAnalyzing) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
