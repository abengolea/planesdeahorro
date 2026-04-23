'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, limit, query, where } from 'firebase/firestore';
import type { CaseEvaluationSubmission } from '@/lib/types';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const MAX_ITEMS = 8;

type Row = CaseEvaluationSubmission & { id: string };

function sortByCreatedAtDesc(a: Row, b: Row): number {
  const ta = a.createdAt && typeof a.createdAt.toMillis === 'function' ? a.createdAt.toMillis() : 0;
  const tb = b.createdAt && typeof b.createdAt.toMillis === 'function' ? b.createdAt.toMillis() : 0;
  return tb - ta;
}

/**
 * Campanita + contador de evaluaciones aún no abiertas en el admin (`newForAdmin`).
 */
export function AdminCaseNotificationsBell() {
  const firestore = useFirestore();

  const q = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'case_evaluations'),
      where('newForAdmin', '==', true),
      limit(50),
    );
  }, [firestore]);

  const { data, isLoading } = useCollection<CaseEvaluationSubmission>(q);

  const sorted = useMemo(() => {
    if (!data?.length) return [];
    return [...(data as Row[])].sort(sortByCreatedAtDesc).slice(0, MAX_ITEMS);
  }, [data]);

  const count = data?.length ?? 0;
  const showBadge = !isLoading && count > 0;
  const label =
    count === 0
      ? 'No hay evaluaciones nuevas sin leer'
      : `${count} evaluación${count === 1 ? '' : 'es'} sin abrir en el panel`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 shrink-0 text-sidebar-foreground hover:bg-sidebar-accent/80"
          aria-label={label}
        >
          <Bell className="h-4 w-4" />
          {showBadge ? (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold leading-none text-amber-950"
              aria-hidden
            >
              {count > 99 ? '99+' : count}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(100vw-2rem,22rem)]">
        <DropdownMenuLabel className="font-normal text-muted-foreground text-xs">
          Evaluaciones sin abrir
        </DropdownMenuLabel>
        {isLoading ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">Cargando…</p>
        ) : sorted.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">No tenés evaluaciones pendientes de leer.</p>
        ) : (
          sorted.map((row) => (
            <DropdownMenuItem key={row.id} asChild className="cursor-pointer">
              <Link href={`/admin/evaluaciones-caso/${row.id}`} className="flex flex-col items-start gap-0.5">
                <span className="font-medium line-clamp-1">{row.nombre || 'Sin nombre'}</span>
                <span className="text-xs text-muted-foreground line-clamp-1">
                  {row.administradora || '—'}
                </span>
              </Link>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/admin/evaluaciones-caso?sin_leer=1">Ver listado (solo sin leer)</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/admin/evaluaciones-caso">Todas las evaluaciones</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
