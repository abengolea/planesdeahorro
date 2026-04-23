'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/firebase/provider';
import type { CaseEvaluationSubmission } from '@/lib/types';
import { updateCaseEvaluationData } from '@/actions/case-evaluation-admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

function formFromRow(row: CaseEvaluationSubmission & { id: string }) {
  const docs = row.documentacionDisponible?.length
    ? row.documentacionDisponible.join('\n')
    : '';
  return {
    nombre: row.nombre ?? '',
    whatsapp: row.whatsapp ?? '',
    email: row.email ?? '',
    ciudad: row.ciudad ?? '',
    provincia: row.provincia ?? '',
    administradora: row.administradora ?? '',
    estadoPlan: row.estadoPlan ?? '',
    adjudicado: row.adjudicado ?? '',
    vehiculoRecibido: row.vehiculoRecibido ?? '',
    grupoOrden: row.grupoOrden ?? '',
    problemaPrincipal: row.problemaPrincipal ?? '',
    resumenHechos: row.resumenHechos ?? '',
    documentacionText: docs,
    urgencia: (row.urgencia ?? 'media') as 'alta' | 'media' | 'baja',
    motivoUrgencia: row.motivoUrgencia ?? '',
    posibleCategoriaJuridica: row.posibleCategoriaJuridica ?? '',
    proximaAccionSugerida: row.proximaAccionSugerida ?? '',
  };
}

export function CaseEvaluationEditForm({ row }: { row: CaseEvaluationSubmission & { id: string } }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => formFromRow(row));

  useEffect(() => {
    setForm(formFromRow(row));
  }, [row.id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast({ title: 'No hay sesión', description: 'Volvé a iniciar sesión.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const documentacionDisponible = form.documentacionText
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await updateCaseEvaluationData(token, row.id, {
        nombre: form.nombre,
        whatsapp: form.whatsapp,
        email: form.email,
        ciudad: form.ciudad,
        provincia: form.provincia,
        administradora: form.administradora,
        estadoPlan: form.estadoPlan,
        adjudicado: form.adjudicado,
        vehiculoRecibido: form.vehiculoRecibido,
        grupoOrden: form.grupoOrden,
        problemaPrincipal: form.problemaPrincipal,
        resumenHechos: form.resumenHechos,
        documentacionDisponible,
        urgencia: form.urgencia,
        motivoUrgencia: form.motivoUrgencia,
        posibleCategoriaJuridica: form.posibleCategoriaJuridica,
        proximaAccionSugerida: form.proximaAccionSugerida,
      });
      if (!res.ok) {
        toast({ title: 'No se guardó', description: res.error, variant: 'destructive' });
        return;
      }
      toast({ title: 'Datos actualizados', description: 'Los cambios ya están en Firestore.' });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Intentá de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card id="editar-datos" className="scroll-mt-24 border-muted">
      <CardHeader>
        <CardTitle>Editar datos del caso</CardTitle>
        <CardDescription>
          Corregí o completá la información. No se envía correo al cliente ni cambia el estado del
          trámite.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => void onSubmit(e)} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ed-nombre">Nombre</Label>
              <Input
                id="ed-nombre"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ed-email">Email</Label>
              <Input
                id="ed-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ed-wa">WhatsApp</Label>
              <Input
                id="ed-wa"
                value={form.whatsapp}
                onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ed-ciudad">Ciudad</Label>
              <Input
                id="ed-ciudad"
                value={form.ciudad}
                onChange={(e) => setForm((f) => ({ ...f, ciudad: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ed-prov">Provincia</Label>
              <Input
                id="ed-prov"
                value={form.provincia}
                onChange={(e) => setForm((f) => ({ ...f, provincia: e.target.value }))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ed-admin">Administradora</Label>
              <Input
                id="ed-admin"
                value={form.administradora}
                onChange={(e) => setForm((f) => ({ ...f, administradora: e.target.value }))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ed-estado-plan">Estado del plan</Label>
              <Input
                id="ed-estado-plan"
                value={form.estadoPlan}
                onChange={(e) => setForm((f) => ({ ...f, estadoPlan: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ed-adj">Adjudicado</Label>
              <Input
                id="ed-adj"
                value={form.adjudicado}
                onChange={(e) => setForm((f) => ({ ...f, adjudicado: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ed-veh">Vehículo recibido</Label>
              <Input
                id="ed-veh"
                value={form.vehiculoRecibido}
                onChange={(e) => setForm((f) => ({ ...f, vehiculoRecibido: e.target.value }))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ed-grupo">Grupo / orden</Label>
              <Input
                id="ed-grupo"
                value={form.grupoOrden}
                onChange={(e) => setForm((f) => ({ ...f, grupoOrden: e.target.value }))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ed-prob">Problema principal</Label>
              <Textarea
                id="ed-prob"
                value={form.problemaPrincipal}
                onChange={(e) => setForm((f) => ({ ...f, problemaPrincipal: e.target.value }))}
                className="min-h-[88px]"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ed-res">Resumen de hechos (IA)</Label>
              <Textarea
                id="ed-res"
                value={form.resumenHechos}
                onChange={(e) => setForm((f) => ({ ...f, resumenHechos: e.target.value }))}
                className="min-h-[120px]"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ed-docs">Documentación disponible (una por línea)</Label>
              <Textarea
                id="ed-docs"
                value={form.documentacionText}
                onChange={(e) => setForm((f) => ({ ...f, documentacionText: e.target.value }))}
                className="min-h-[80px] font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Urgencia</Label>
              <Select
                value={form.urgencia}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, urgencia: v as 'alta' | 'media' | 'baja' }))
                }
              >
                <SelectTrigger aria-label="Urgencia">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baja">Baja</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ed-mot-urg">Motivo de urgencia</Label>
              <Textarea
                id="ed-mot-urg"
                value={form.motivoUrgencia}
                onChange={(e) => setForm((f) => ({ ...f, motivoUrgencia: e.target.value }))}
                className="min-h-[72px]"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ed-cat">Posible categoría jurídica</Label>
              <Input
                id="ed-cat"
                value={form.posibleCategoriaJuridica}
                onChange={(e) => setForm((f) => ({ ...f, posibleCategoriaJuridica: e.target.value }))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ed-next">Próxima acción sugerida</Label>
              <Textarea
                id="ed-next"
                value={form.proximaAccionSugerida}
                onChange={(e) => setForm((f) => ({ ...f, proximaAccionSugerida: e.target.value }))}
                className="min-h-[72px]"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar cambios'}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => setForm(formFromRow(row))}
            >
              Descartar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
