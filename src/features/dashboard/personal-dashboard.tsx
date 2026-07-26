import { Link } from '@tanstack/react-router';
import { ArrowRight, CalendarDays, Sparkles, Target, Wrench } from 'lucide-react';
import type { ProjectMatchDto } from '@/api/generated/model';
import { usePersonalDashboardData } from './use-dashboard-data';
import { QueryError } from '@/components/query-error';
import { StatCard } from './components/stat-card';
import { MySkillsCard } from './components/my-skills-card';
import { MyAvailabilityCard } from './components/my-availability-card';
import { scoreColor } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

function MatchCard({ match }: { match: ProjectMatchDto }) {
  const score = Math.round((match.score ?? 0) * 100);
  return (
    <Link
      to="/projects/$projectId"
      params={{ projectId: match.projectId ?? '' }}
      className="block rounded-lg border bg-card p-4 transition-colors hover:border-primary/40"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate font-medium">{match.projectName}</span>
          <span className="text-xs text-muted-foreground">{match.ownerName}</span>
        </div>
        <span className={`text-xl font-medium tabular-nums ${scoreColor(score)}`}>
          {score}%
        </span>
      </div>
      <Progress value={score} className="mt-3 h-1.5" />
      <div className="mt-3 flex flex-wrap gap-1.5">
        {match.matchedSkills?.slice(0, 4).map((s) => (
          <Badge key={s.skillId} className="bg-primary/10 text-primary hover:bg-primary/10">
            {s.skillName}
          </Badge>
        ))}
        {match.missingSkills?.slice(0, 2).map((s) => (
          <Badge key={s.skillId} variant="outline" className="text-muted-foreground">
            fehlt: {s.skillName}
          </Badge>
        ))}
      </div>
    </Link>
  );
}

export function PersonalDashboard() {
  const {
    matches,
    matchesLoading,
    isMatchesError,
    refetchMatches,
    skills,
    skillsLoading,
    availability,
    availabilityLoading,
  } = usePersonalDashboardData();

  const goodMatches = matches?.filter((m) => (m.score ?? 0) >= 0.5).length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Wrench}
          label="Deine Skills"
          value={skills?.length ?? 0}
          loading={skillsLoading}
          tone="blue"
        />
        <StatCard
          icon={Target}
          label="Projekt-Matches"
          value={matches?.length ?? 0}
          loading={matchesLoading}
        />
        <StatCard
          icon={Sparkles}
          label="Davon 50%+"
          value={goodMatches}
          loading={matchesLoading}
          tone="amber"
        />
        <StatCard
          icon={CalendarDays}
          label="Verfügbarkeiten"
          value={availability?.length ?? 0}
          loading={availabilityLoading}
          tone="violet"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Deine Top-Matches</CardTitle>
            <CardDescription>Projekte, die zu deinen Skills passen</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {matchesLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            {isMatchesError && (
              <QueryError onRetry={() => refetchMatches()} />
            )}
            {matches?.map((m) => <MatchCard key={m.projectId} match={m} />)}
            {matches && matches.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Noch keine Matches. Lege zuerst deine Skills an.
                </p>
                <Link
                  to="/skills"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  Skills pflegen
                  <ArrowRight className="size-3" aria-hidden />
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <MySkillsCard skills={skills} loading={skillsLoading} />
          <MyAvailabilityCard
            availability={availability}
            loading={availabilityLoading}
          />
        </div>
      </div>
    </div>
  );
}
