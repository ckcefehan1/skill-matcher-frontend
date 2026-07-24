import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowRight, CalendarDays, FolderKanban, Plus, Target, Wrench } from 'lucide-react';
import { usePmDashboardData } from './use-dashboard-data';
import { StatCard } from './components/stat-card';
import { MySkillsCard } from './components/my-skills-card';
import { MyAvailabilityCard } from './components/my-availability-card';
import { useAuthStore } from '@/stores/auth-store';
import { formatDate, PROJECT_STATUS_LABELS } from '@/lib/utils';
import { ProjectFormDialog } from '@/features/projects/project-form-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function PmDashboard() {
  const user = useAuthStore((s) => s.user);
  const [createOpen, setCreateOpen] = useState(false);
  const {
    projects,
    projectsLoading,
    skills,
    skillsLoading,
    availability,
    availabilityLoading,
  } = usePmDashboardData();

  const owned = projects?.filter((p) => p.ownerId === user?.id);
  const activeCount = owned?.filter((p) => p.status === 'ACTIVE').length ?? 0;
  const plannedCount = owned?.filter((p) => p.status === 'PLANNED').length ?? 0;
  const recentOwned = [...(owned ?? [])]
    .sort((a, b) => (b.createdDate ?? '').localeCompare(a.createdDate ?? ''))
    .slice(0, 6);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={FolderKanban}
          label="Deine Projekte"
          value={owned?.length ?? 0}
          loading={projectsLoading}
        />
        <StatCard
          icon={Target}
          label="Davon aktiv"
          value={activeCount}
          loading={projectsLoading}
          tone="blue"
        />
        <StatCard
          icon={CalendarDays}
          label="Geplant"
          value={plannedCount}
          loading={projectsLoading}
          tone="violet"
        />
        <StatCard
          icon={Wrench}
          label="Deine Skills"
          value={skills?.length ?? 0}
          loading={skillsLoading}
          tone="amber"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Deine Projekte</CardTitle>
              <CardDescription>
                Projekte, deren Besitzer du bist
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" aria-hidden />
              Neues Projekt
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col">
            {projectsLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="mb-3 h-9 w-full" />
              ))}
            {recentOwned.map((p) => (
              <Link
                key={p.id}
                to="/projects/$projectId"
                params={{ projectId: p.id ?? '' }}
                className="flex items-center justify-between gap-3 border-b py-2.5 last:border-0 hover:bg-accent/50"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">{p.name}</span>
                  <span className="truncate text-xs text-muted-foreground tabular-nums">
                    {formatDate(p.startDate)} – {formatDate(p.endDate)} · max.{' '}
                    {p.maxMembers}
                  </span>
                </div>
                <Badge variant="outline" className="shrink-0">
                  {PROJECT_STATUS_LABELS[p.status ?? ''] ?? p.status}
                </Badge>
              </Link>
            ))}
            {owned && owned.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Noch keine Projekte. Lege dein erstes Projekt an.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCreateOpen(true)}
                >
                  <Plus className="size-4" aria-hidden />
                  Projekt anlegen
                </Button>
              </div>
            )}
            {owned && owned.length > 0 && (
              <Link
                to="/projects"
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Alle Projekte
                <ArrowRight className="size-3" aria-hidden />
              </Link>
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

      <ProjectFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
