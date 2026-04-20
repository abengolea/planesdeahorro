'use client';

import { useEffect, useState } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useAuth, useUser } from '@/firebase/provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, ShieldOff } from 'lucide-react';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import { firebaseConfig } from '@/firebase/config';

function AdminLoginCard() {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err: unknown) {
      const code = err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError('Email o contraseña incorrectos.');
      } else if (code === 'auth/too-many-requests') {
        setError('Demasiados intentos. Probá más tarde.');
      } else {
        setError('No se pudo iniciar sesión. Verificá los datos o la configuración de Firebase Auth.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6">
      <Link href="/" className="mb-8">
        <Logo />
      </Link>
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <Lock className="h-5 w-5" />
            <CardTitle>Acceso al panel</CardTitle>
          </div>
          <CardDescription>
            Iniciá sesión con la cuenta de administrador. Tu usuario debe existir en la colección{' '}
            <span className="font-mono text-xs">admin_users</span> en Firestore para ver evaluaciones y gestionar
            contenido.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Contraseña</Label>
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ingresando…
                </>
              ) : (
                'Ingresar'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function NotAdminCard({
  userEmail,
  userUid,
  verifyError,
}: {
  userEmail: string | null;
  userUid: string;
  verifyError: string | null;
}) {
  const auth = useAuth();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6">
      <Link href="/" className="mb-8">
        <Logo />
      </Link>
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <ShieldOff className="h-5 w-5" />
            <CardTitle>Sin permisos de administración</CardTitle>
          </div>
          <CardDescription className="space-y-3">
            <span className="block">
              Tu cuenta está autenticada, pero no figura en{' '}
              <span className="font-mono text-xs">admin_users</span> en Firestore (proyecto{' '}
              <span className="font-mono text-[11px]">{firebaseConfig.projectId}</span>). Solo las cuentas dadas de alta ahí
              pueden usar el panel.
            </span>
            <span className="block rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Sesión actual</span>
              <br />
              Email: {userEmail ?? '—'}
              <br />
              UID: <span className="break-all font-mono text-[11px]">{userUid}</span>
              <br />
              En Firestore debe existir un documento <span className="font-mono text-[11px]">admin_users/{userUid}</span>{' '}
              (el ID del documento es exactamente ese UID).
            </span>
            {verifyError && (
              <span className="block text-sm text-destructive" role="alert">
                {verifyError}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button variant="outline" className="w-full" onClick={() => signOut(auth)}>
            Cerrar sesión
          </Button>
          <Button variant="ghost" className="w-full" asChild>
            <Link href="/">Volver al sitio</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const [isAdminVerified, setIsAdminVerified] = useState<boolean | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIsAdminVerified(null);
      setVerifyError(null);
      return;
    }

    let cancelled = false;
    setIsAdminVerified(null);
    setVerifyError(null);

    const run = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/admin/verify', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = (await res.json()) as { admin?: boolean; error?: string };
        if (cancelled) return;
        if (res.status === 503) {
          setVerifyError(data.error ?? 'El servidor no pudo verificar permisos.');
          setIsAdminVerified(false);
          return;
        }
        if (!res.ok) {
          setIsAdminVerified(false);
          return;
        }
        setIsAdminVerified(data.admin === true);
      } catch (err) {
        console.error('Verificación admin:', err);
        if (!cancelled) {
          setVerifyError('No se pudo verificar el permiso. Probá de nuevo.');
          setIsAdminVerified(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (isUserLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Cargando sesión" />
      </div>
    );
  }

  if (!user) {
    return <AdminLoginCard />;
  }

  if (isAdminVerified === null) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Verificando permisos" />
      </div>
    );
  }

  if (!isAdminVerified) {
    return (
      <NotAdminCard userEmail={user.email} userUid={user.uid} verifyError={verifyError} />
    );
  }

  return <>{children}</>;
}
