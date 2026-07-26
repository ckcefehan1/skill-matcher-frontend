import { useState } from 'react';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { ArrowLeft, CalendarDays, Pencil, Trash2, User } from 'lucide-react';
import { useProjectDetail } from './use-project-detail';
import { SkillsSection } from './sections/skills-section';
import { MembersSection } from './sections/members-section';
import { CandidatesSection } from './sections/candidates-section';
import { useAuthStore } from '@/stores/auth-store';
import { formatDate, PROJECT_STATUS_LABELS } from '@/lib/utils';
import { usePageTitle } from '@/lib/use-page-title';
import { ProjectFormDialog } from './project-form-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';

export function ProjectDetailPage() {
  const { projectId } = useParams({ from: '/_authenticated/projects/$projectId' });
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isPM = user?.role === 'PROJECTMANAGER';

  const { project, isProjectLoading, members, deleteProjectMutation } =
    useProjectDetail(projectId, { isPM });
  usePageTitle(project?.name ?? 'Projekt');

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isOwner = !!project?.ownerId && project.ownerId === user?.id;

  if (isProjectLoading) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Projekt nicht gefunden.
        </p>
        <Link
          to="/projects"
          className="text-sm font-medium text-primary hover:underline"
        >
          Zurück zur Übersicht
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Link
          to="/projects"
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Projekte
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex items-center gap-3">
              <h1 className="truncate text-2xl font-medium tracking-tight">
                {project.name}
              </h1>
              <Badge variant="outline" className="shrink-0">
                {PROJECT_STATUS_LABELS[project.status ?? ''] ?? project.status}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <User className="size-4" aria-hidden />
                {project.ownerName}
              </span>
              <span className="inline-flex items-center gap-1.5 tabular-nums">
                <CalendarDays className="size-4" aria-hidden />
                {formatDate(project.startDate)} – {formatDate(project.endDate)}
              </span>
            </div>
          </div>
          {isOwner && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" aria-hidden />
                Bearbeiten
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="size-4" aria-hidden />
                Löschen
              </Button>
            </div>
          )}
        </div>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {project.description}
        </p>
      </div>

      {isPM && <SkillsSection projectId={projectId} isOwner={isOwner} />}

      <div className="grid gap-6 lg:grid-cols-2">
        <MembersSection
          projectId={projectId}
          isOwner={isOwner}
          maxMembers={project.maxMembers ?? 0}
        />
        {isPM && (
          <CandidatesSection
            projectId={projectId}
            isOwner={isOwner}
            members={members}
            maxMembers={project.maxMembers ?? 0}
          />
        )}
      </div>

      <ProjectFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        project={project}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Projekt löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              „{project.name}" wird dauerhaft gelöscht. Das kann nicht
              rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteProjectMutation.mutate(
                  { id: projectId },
                  { onSuccess: () => navigate({ to: '/projects' }) },
                )
              }
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
