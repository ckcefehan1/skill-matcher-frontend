import { createRoute, Outlet, redirect, useNavigate } from '@tanstack/react-router';
import { Menu } from 'lucide-react';
import { rootRoute } from './__root';
import { useAuthStore } from '@/stores/auth-store';
import { useLogout } from '@/api/generated/endpoints/authentication/authentication';
import { AppSidebar, navItemsForRole } from '@/components/app-sidebar';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function MobileMenu() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const storeLogout = useAuthStore((s) => s.logout);
  const logoutMutation = useLogout();

  const onLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        storeLogout();
        navigate({ to: '/login' });
      },
    });
  };

  const items = navItemsForRole(user?.role).map(({ to, label }) => ({
    to,
    label,
  }));

  return (
    <div className="flex h-14 items-center justify-between border-b bg-card px-4 md:hidden">
      <Logo />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Menü öffnen">
            <Menu className="size-5" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {items.map((item) => (
            <DropdownMenuItem key={item.to} onClick={() => navigate({ to: item.to })}>
              {item.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate({ to: '/change-password' })}>
            Passwort ändern
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onLogout}>Abmelden</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function AuthenticatedLayout() {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileMenu />
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export const authenticatedRoute = createRoute({
    id: '_authenticated',
    getParentRoute: () => rootRoute,
    beforeLoad: ({ location }) => {
      const { accessToken } = useAuthStore.getState();
      if (!accessToken) {
        throw redirect({
          to: '/login',
          search: { redirect: location.href },
        });
      }
    },
    component: AuthenticatedLayout,
  });
