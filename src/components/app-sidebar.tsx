import { useState } from 'react';
import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import {
  CalendarDays,
  FolderKanban,
  KeyRound,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Users,
  Wrench,
} from 'lucide-react';
import { useLogout } from '@/api/generated/endpoints/authentication/authentication';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projekte', icon: FolderKanban },
  { to: '/matching', label: 'Matching', icon: Sparkles },
  { to: '/skills', label: 'Skills', icon: Wrench },
  { to: '/availability', label: 'Verfügbarkeit', icon: CalendarDays },
] as const;

const ADMIN_ITEM = { to: '/admin/users', label: 'Benutzer', icon: Users } as const;

export function AppSidebar() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const user = useAuthStore((s) => s.user);
  const storeLogout = useAuthStore((s) => s.logout);
  const logoutMutation = useLogout();

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('sidebar-collapsed') === 'true',
  );

  const toggle = () => {
    setCollapsed((c) => {
      localStorage.setItem('sidebar-collapsed', String(!c));
      return !c;
    });
  };

  const onLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        storeLogout();
        navigate({ to: '/login' });
      },
    });
  };

  const items =
    user?.role === 'ADMIN'
      ? [...NAV_ITEMS.filter((i) => i.to !== '/availability'), ADMIN_ITEM]
      : NAV_ITEMS;

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen shrink-0 flex-col border-r bg-card transition-[width] duration-200 md:flex',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <div
        className={cn(
          'flex h-14 items-center border-b',
          collapsed ? 'justify-center' : 'justify-between px-4',
        )}
      >
        <Link to="/" className="flex items-center gap-2 overflow-hidden">
          <div className="size-2 shrink-0 rounded-full bg-primary" />
          {!collapsed && (
            <span className="truncate text-sm font-medium tracking-tight">
              Skill Matcher
            </span>
          )}
        </Link>
        {!collapsed && (
          <button
            onClick={toggle}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Seitenleiste einklappen"
          >
            <PanelLeftClose className="size-4" aria-hidden />
          </button>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-2">
        {collapsed && (
          <button
            onClick={toggle}
            className="mb-1 flex h-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Seitenleiste ausklappen"
          >
            <PanelLeftOpen className="size-4" aria-hidden />
          </button>
        )}
        {items.map(({ to, label, icon: Icon }) => {
          const active = to === '/' ? pathname === '/' : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={cn(
                'flex h-9 items-center gap-3 rounded-md text-sm transition-colors',
                collapsed ? 'justify-center px-0' : 'px-3',
                active
                  ? 'bg-primary/10 font-medium text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-1 border-t p-2">
        {!collapsed && (
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.email}
            </p>
          </div>
        )}
        <Link
          to="/change-password"
          title={collapsed ? 'Passwort ändern' : undefined}
          className={cn(
            'flex h-9 items-center gap-3 rounded-md text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
            collapsed ? 'justify-center px-0' : 'px-3',
          )}
        >
          <KeyRound className="size-4 shrink-0" aria-hidden />
          {!collapsed && <span>Passwort ändern</span>}
        </Link>
        <button
          onClick={onLogout}
          disabled={logoutMutation.isPending}
          title={collapsed ? 'Abmelden' : undefined}
          className={cn(
            'flex h-9 items-center gap-3 rounded-md text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-destructive',
            collapsed ? 'justify-center px-0' : 'px-3',
          )}
        >
          <LogOut className="size-4 shrink-0" aria-hidden />
          {!collapsed && <span>Abmelden</span>}
        </button>
      </div>
    </aside>
  );
}
