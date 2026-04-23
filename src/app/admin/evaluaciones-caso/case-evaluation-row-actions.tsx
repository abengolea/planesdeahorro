'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useUser } from '@/firebase/provider';
import type { CaseEvaluationSubmission } from '@/lib/types';
import { deleteCaseEvaluation, setCaseEvaluationArchived } from '@/actions/case-evaluation-admin';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MoreHorizontal, Pencil, Eye, Archive, ArchiveRestore, Trash2 } from 'lucide-react';

type Row = CaseEvaluationSubmission & { id: string };

export function CaseEvaluationRowActions({ row }: { row: Row }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState<'archive' | 'delete' | null>(null);

  async function toggleArchived(nextArchived: boolean) {
    if (!user) {
      toast({ title: 'No hay sesión', description: 'Volvé a iniciar sesión.', variant: 'destructive' });
      return;
    }
    setBusy('archive');
    try {
      const token = await user.getIdToken();
      const res = await setCaseEvaluationArchived(token, row.id, nextArchived);
      if (!res.ok) {
        toast({ title: 'No se pudo actualizar', description: res.error, variant: 'destructive' });
        return;
      }
      toast({
        title: nextArchived ? 'Archivado' : 'Restaurado',
        description: nextArchived ? 'El caso quedó archivado.' : 'El caso volvió a activos.',
      });
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Intentá de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setBusy(null);
    }
  }

  async function confirmDelete() {
    if (!user) {
      toast({ title: 'No hay sesión', description: 'Volvé a iniciar sesión.', variant: 'destructive' });
      return;
    }
    setBusy('delete');
    try {
      const token = await user.getIdToken();
      const res = await deleteCaseEvaluation(token, row.id);
      if (!res.ok) {
        toast({ title: 'No se pudo borrar', description: res.error, variant: 'destructive' });
        return;
      }
      toast({ title: 'Eliminado', description: 'El caso se borró de la base.' });
      setDeleteOpen(false);
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Intentá de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={`Acciones para ${row.nombre || row.id}`}
            disabled={busy !== null}
          >
            {busy === 'archive' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem asChild>
            <Link href={`/admin/evaluaciones-caso/${row.id}`} className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Ver detalle
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/admin/evaluaciones-caso/${row.id}#editar-datos`} className="flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              Editar datos
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {row.archived ? (
            <DropdownMenuItem
              className="flex items-center gap-2"
              onSelect={(e) => {
                e.preventDefault();
                void toggleArchived(false);
              }}
            >
              <ArchiveRestore className="h-4 w-4" />
              Desarchivar
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              className="flex items-center gap-2"
              onSelect={(e) => {
                e.preventDefault();
                void toggleArchived(true);
              }}
            >
              <Archive className="h-4 w-4" />
              Archivar
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-destructive focus:text-destructive flex items-center gap-2"
            onSelect={(e) => {
              e.preventDefault();
              setDeleteOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4" />
            Eliminar…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta evaluación?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borrará de Firestore sin posibilidad de recuperación desde esta app. Para ocultarla sin borrar,
              usá Archivar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy === 'delete'}>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={busy === 'delete'}
              onClick={() => void confirmDelete()}
            >
              {busy === 'delete' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Eliminar'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
