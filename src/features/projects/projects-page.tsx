import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { CalendarDays, Plus, User } from 'lucide-react';
import { useGetAllProjects } from '@/api/generated/endpoints/projects/projects';
import type { ProjectDto } from '@/api/generated/model';
import { useAuthStore } from '@/stores/auth-store';
import { ProjectFormDialog } from './project-form-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate, PROJECT_STATUS_LABELS, type Page } from '@/lib/utils';

const FILTERS = [
  { value: 'ALL', label: 'Alle' },
  { value: 'PLANNED', label: PROJECT_STATUS_LABELS.PLANNED },
  { value: 'ACTIVE', label: PROJECT_STATUS_LABELS.ACTIVE },
  { value: 'PAUSED', label: PROJECT_STATUS_LABELS.PAUSED },
  { value: 'COMPLETED', label: PROJECT_STATUS_LABELS.COMPLETED },
];

export function ProjectsPage() {
  const user = useAuthStore((s) => s.user);
  const isPM = user?.role === 'PROJECTMANAGER';
  const [createOpen, setCreateOpen] = useState(false);
  const [filter, setFilter] = useState('ALL');

  // ponytail: no filtered count endpoint — fetch first 100, filter client-side
  const projectsQuery = useGetAllProjects({ pageable: { page: 0, size: 100 } });
  const projects = (
    projectsQuery.data as unknown as Page<ProjectDto> | undefined
  )?.content;
  const filtered =
    filter === 'ALL'
      ? projects
      : projects?.filter((p) => p.status === filter);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Projekte</h1>
          <p className="text-sm text-muted-foreground">
            {projects
              ? `${projects.length} Projekte im System`
              : 'Projekte im System'}
          </p>
        </div>
        {isPM && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" aria-hidden />
            Neues Projekt
          </Button>
        )}
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          {FILTERS.map((f) => (
            <TabsTrigger key={f.value} value={f.value}>
              {f.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid gap-4 lg:grid-cols-2">
        {projectsQuery.isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        {filtered?.map((p) => (
          <Link
            key={p.id}
            to="/projects/$projectId"
            params={{ projectId: p.id ?? '' }}
            className="flex flex-col gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1">
                <span className="truncate font-medium">{p.name}</span>
                <span className="line-clamp-2 text-sm text-muted-foreground">
                  {p.description}
                </span>
              </div>
              <Badge variant="outline" className="shrink-0">
                {PROJECT_STATUS_LABELS[p.status ?? ''] ?? p.status}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <User className="size-3" aria-hidden />
                {p.ownerName}
              </span>
              <span className="inline-flex items-center gap-1 tabular-nums">
                <CalendarDays className="size-3" aria-hidden />
                {formatDate(p.startDate)} – {formatDate(p.endDate)}
              </span>
              <span className="tabular-nums">max. {p.maxMembers}</span>
            </div>
          </Link>
        ))}
      </div>

      {filtered && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {filter === 'ALL'
              ? 'Noch keine Projekte angelegt.'
              : 'Keine Projekte mit diesem Status.'}
          </p>
          {isPM && filter === 'ALL' && (
            <Button variant="outline" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" aria-hidden />
              Erstes Projekt anlegen
            </Button>
          )}
        </div>
      )}

      <ProjectFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
