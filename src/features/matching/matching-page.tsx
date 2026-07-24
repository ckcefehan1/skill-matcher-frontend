import { useAuthStore } from '@/stores/auth-store';
import { PmMatching } from './pm-matching';
import { EmployeeMatching } from './employee-matching';

export function MatchingPage() {
  const user = useAuthStore((s) => s.user);
  const isPM = user?.role === 'PROJECTMANAGER';

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Matching</h1>
        <p className="text-sm text-muted-foreground">
          {isPM
            ? 'Kandidaten und Bewerbungen für deine Projekte'
            : 'Projekte, die zu deinen Skills passen'}
        </p>
      </div>
      {isPM ? <PmMatching /> : <EmployeeMatching />}
    </div>
  );
}
