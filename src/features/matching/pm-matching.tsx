import { useState } from 'react';
import { useGetAllProjects } from '@/api/generated/endpoints/projects/projects';
import type { ProjectDto } from '@/api/generated/model';
import { useAuthStore } from '@/stores/auth-store';
import { useProjectDetail } from '@/features/projects/use-project-detail';
import { CandidatesSection } from '@/features/projects/sections/candidates-section';
import { ApplicationsSection } from './sections/applications-section';
import { cn, PROJECT_STATUS_LABELS, type Page } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export function PmMatching() {
  const user = useAuthStore((s) => s.user);
  const projectsQuery = useGetAllProjects({ pageable: { page: 0, size: 100 } });
  const ownProjects = (
    projectsQuery.data as unknown as Page<ProjectDto> | undefined
  )?.content?.filter(
    (p) =>
      p.ownerId === user?.id && (p.status === 'PLANNED' || p.status === 'ACTIVE'),
  );

  const [selectedId, setSelectedId] = useState<string>();
  const selectedProjectId = selectedId ?? ownProjects?.[0]?.id;

  const { project, members } = useProjectDetail(selectedProjectId ?? '', {
    isPM: true,
  });

  if (projectsQuery.isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!ownProjects || ownProjects.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Du hast keine aktiven Projekte. Erstelle ein Projekt, um Kandidaten zu
        sehen.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {ownProjects.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelectedId(p.id)}
            className={cn(
              'flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors',
              p.id === selectedProjectId
                ? 'border-primary bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent',
            )}
          >
            {p.name}
            <Badge variant="outline" className="text-xs">
              {PROJECT_STATUS_LABELS[p.status ?? ''] ?? p.status}
            </Badge>
          </button>
        ))}
      </div>
      {selectedProjectId && (
        <>
          <CandidatesSection
            projectId={selectedProjectId}
            isOwner
            members={members}
            maxMembers={project?.maxMembers ?? 0}
          />
          <ApplicationsSection projectId={selectedProjectId} />
        </>
      )}
    </div>
  );
}
