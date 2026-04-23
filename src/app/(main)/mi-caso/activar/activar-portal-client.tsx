'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { useAuth, useUser } from '@/firebase/provider';
import { linkClientCaseToAccount } from '@/actions/client-portal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export function ActivarPortalClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get('t')?.trim() ?? '';
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [linking, setLinking] = useState(false);

  async function runLink() {
    if (!user || !token) return;
    setLinking(true);
    try {
      const idToken = await user.getIdToken();
      const res = await linkClientCaseToAccount(idToken, token);
      if (!res.ok) {
        toast({ title: 'No se pudo vincular', description: res.error, variant: 'destructive' });
        return;
      }
      toast({
        title: 'Listo',
        description: 'Ya podés ver tu expediente y subir documentación.',
      });
      router.push('/mi-caso');
      router.refresh();
    } finally {
      setLinking(false);
    }
  }

  async function onRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      toast({ title: 'Cuenta creada', description: 'Ahora vinculá el expediente con el botón de abajo.' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo registrar.';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      toast({ title: 'Sesión iniciada', description: 'Continuá con “Vincular expediente”.' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo iniciar sesión.';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  async function onSignOut() {
    await signOut(auth);
    toast({ title: 'Sesión cerrada' });
  }

  return (
    <div className="bg-background py-12 md:py-16">
      <div className="container mx-auto px-4 max-w-lg">
        <div className="mb-8">
          <p className="text-accent text-[11px] font-medium tracking-[0.3em] uppercase mb-2">
            Portal del cliente
          </p>
          <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary">
            Activar tu acceso
          </h1>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
            Usá el mismo correo con el que enviaste la consulta. Después vas a poder ver el estado, los
            movimientos del expediente y subir documentación.
          </p>
        </div>

        {!token ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Enlace incompleto</AlertTitle>
            <AlertDescription>
              Abrí el link que recibiste por correo cuando el estudio aceptó tu consulta. Si no lo tenés,
              escribinos y lo reenviamos.
            </AlertDescription>
          </Alert>
        ) : isUserLoading ? (
          <div className="flex justify-center py-12 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {user ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    Sesión: {user.email}
                  </CardTitle>
                  <CardDescription>
                    Si este correo coincide con el de tu consulta, vinculá el expediente.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 sm:flex-row">
                  <Button onClick={runLink} disabled={linking} className="flex-1">
                    {linking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Vincular expediente
                  </Button>
                  <Button type="button" variant="outline" onClick={onSignOut} disabled={linking}>
                    Cambiar de cuenta
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Crear cuenta o iniciar sesión</CardTitle>
                  <CardDescription>Registrate si es la primera vez, o entrá con tu cuenta.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="registro">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="registro">Registrarme</TabsTrigger>
                      <TabsTrigger value="ingreso">Ya tengo cuenta</TabsTrigger>
                    </TabsList>
                    <TabsContent value="registro">
                      <form onSubmit={onRegister} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="reg-email">Email</Label>
                          <Input
                            id="reg-email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reg-pass">Contraseña (mín. 6 caracteres)</Label>
                          <Input
                            id="reg-pass"
                            type="password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={6}
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={submitting}>
                          {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Crear cuenta
                        </Button>
                      </form>
                    </TabsContent>
                    <TabsContent value="ingreso">
                      <form onSubmit={onLogin} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="in-email">Email</Label>
                          <Input
                            id="in-email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="in-pass">Contraseña</Label>
                          <Input
                            id="in-pass"
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={submitting}>
                          {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Iniciar sesión
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}

            {user && token ? (
              <p className="text-xs text-muted-foreground text-center">
                ¿Problemas con el correo? Cerrá sesión y entrá con el mismo email que usaste en la consulta.
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
