import { createRoute, Outlet, redirect, useNavigate, Link } from '@tanstack/react-router';
import { rootRoute } from './__root';
import { useAuthStore } from '@/stores/auth-store';
import { useLogout } from '@/api/generated/endpoints/authentication/authentication';
import { Button } from '@/components/ui/button';

function AuthenticatedLayout() {
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

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-primary" />
          <span className="text-sm font-medium tracking-tight">Skill Matcher</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {user?.firstName} {user?.lastName}
          </span>
          <Link
            to="/change-password"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Passwort ändern
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            disabled={logoutMutation.isPending}
          >
            Abmelden
          </Button>
        </div>
      </header>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
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
