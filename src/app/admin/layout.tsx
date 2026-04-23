'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { useAuth, useUser } from '@/firebase/provider';
import {
  SidebarProvider,
  Sidebar,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Bot, LayoutDashboard, FileText, Gavel, ClipboardList } from 'lucide-react';
import { Logo } from '@/components/logo';
import { AdminAuthGate } from '@/app/admin/admin-auth-gate';
import { Button } from '@/components/ui/button';
import { AdminCaseNotificationsBell } from '@/components/admin-case-notifications-bell';

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/evaluaciones-caso', label: 'Evaluaciones de caso', icon: ClipboardList },
  { href: '/admin/herramientas-ai', label: 'Herramientas IA', icon: Bot },
  { href: '/admin/fallos', label: 'Gestionar Fallos', icon: Gavel },
  { href: '/admin/doctrina', label: 'Gestionar Doctrina', icon: FileText },
];

function AdminSidebarShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const auth = useAuth();
  const { user } = useUser();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center justify-between gap-2">
            <Link href="/admin">
              <Logo inverted />
            </Link>
            <div className="flex items-center gap-1">
              <AdminCaseNotificationsBell />
              <SidebarTrigger />
            </div>
          </div>
          {user && (
            <div className="mt-3 flex flex-col gap-2 border-t pt-3">
              <p className="truncate text-xs text-muted-foreground" title={user.email ?? undefined}>
                {user.email}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => signOut(auth)}
              >
                Cerrar sesión
              </Button>
            </div>
          )}
        </SidebarHeader>
        <SidebarMenu>
          {adminNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton
                  isActive={
                    item.href === '/admin'
                      ? pathname === '/admin'
                      : pathname === item.href || pathname.startsWith(`${item.href}/`)
                  }
                  tooltip={{ children: item.label }}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="font-headline min-h-svh">
      <AdminAuthGate>
        <AdminSidebarShell>{children}</AdminSidebarShell>
      </AdminAuthGate>
    </div>
  );
}
