import { useAuthStore } from '@/stores/auth-store';
import { usePageTitle } from '@/lib/use-page-title';
import { AdminDashboard } from './admin-dashboard';
import { PmDashboard } from './pm-dashboard';
import { PersonalDashboard } from './personal-dashboard';

export function DashboardPage() {
  usePageTitle('Übersicht');
  const user = useAuthStore((s) => s.user);

  const today = new Date().toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">
          Hallo, {user?.firstName}
        </h1>
        <p className="text-sm text-muted-foreground">{today}</p>
      </div>
      {user?.role === 'ADMIN' ? (
        <AdminDashboard />
      ) : user?.role === 'PROJECTMANAGER' ? (
        <PmDashboard />
      ) : (
        <PersonalDashboard />
      )}
    </div>
  );
}
