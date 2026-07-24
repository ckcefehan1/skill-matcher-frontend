import { Link } from '@tanstack/react-router';
import type { ProjectMatchDto } from '@/api/generated/model';
import { useEmployeeMatching } from './use-matching';
import { APPLICATION_STATUS_LABELS, MATCH_TIER_LABELS } from './matching-labels';
import { PROJECT_STATUS_LABELS, scoreColor } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function EmployeeMatching() {
  const { matches, isMatchesLoading, applications, applyMutation, withdrawMutation } =
    useEmployeeMatching();

  if (isMatchesLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Keine passenden Projekte gefunden. Pflege deine Skills und
        Verfügbarkeit, um bessere Matches zu bekommen.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {matches.map((m) => (
        <MatchCard
          key={m.projectId}
          match={m}
          pendingApplicationId={
            m.applicationStatus === 'PENDING'
              ? applications?.find(
                  (a) => a.projectId === m.projectId && a.status === 'PENDING',
                )?.id
              : undefined
          }
          onApply={(projectId) =>
            applyMutation.mutate({ projectId, data: {} })
          }
          onWithdraw={(id) => withdrawMutation.mutate({ id })}
          busy={applyMutation.isPending || withdrawMutation.isPending}
        />
      ))}
    </div>
  );
}

function MatchCard({
  match: m,
  pendingApplicationId,
  onApply,
  onWithdraw,
  busy,
}: {
  match: ProjectMatchDto;
  pendingApplicationId?: string;
  onApply: (projectId: string) => void;
  onWithdraw: (id: string) => void;
  busy: boolean;
}) {
  const score = Math.round((m.score ?? 0) * 100);
  const growth = Math.round((m.growthPotential ?? 0) * 100);
  const status = m.applicationStatus;

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border bg-card p-4">
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/projects/$projectId"
            params={{ projectId: m.projectId ?? '' }}
            className="truncate text-sm font-medium hover:underline"
          >
            {m.projectName}
          </Link>
          <span className={`text-sm font-medium tabular-nums ${scoreColor(score)}`}>
            {score}%
          </span>
          {m.matchTier && (
            <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
              {MATCH_TIER_LABELS[m.matchTier] ?? m.matchTier}
            </Badge>
          )}
          <Badge variant="outline" className="text-muted-foreground">
            {PROJECT_STATUS_LABELS[m.status ?? ''] ?? m.status}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {m.matchedSkills?.slice(0, 3).map((s) => (
            <Badge
              key={s.skillId}
              className="bg-primary/10 text-primary hover:bg-primary/10"
            >
              {s.skillName}
            </Badge>
          ))}
          {m.missingSkills?.slice(0, 2).map((s) => (
            <Badge
              key={s.skillId}
              variant="outline"
              className="text-muted-foreground"
            >
              fehlt: {s.skillName}
            </Badge>
          ))}
          {growth > 0 && (
            <Badge variant="outline" className="text-muted-foreground">
              Lernpotenzial {growth}%
            </Badge>
          )}
        </div>
      </div>
      <div className="shrink-0">
        {!status && (
          <Button
            size="sm"
            disabled={busy}
            onClick={() => onApply(m.projectId ?? '')}
          >
            Bewerben
          </Button>
        )}
        {status === 'PENDING' && (
          <Button
            size="sm"
            variant="outline"
            disabled={busy || !pendingApplicationId}
            onClick={() => pendingApplicationId && onWithdraw(pendingApplicationId)}
          >
            Zurückziehen
          </Button>
        )}
        {status && status !== 'PENDING' && (
          <Badge variant="outline">
            {APPLICATION_STATUS_LABELS[status] ?? status}
          </Badge>
        )}
      </div>
    </div>
  );
}
