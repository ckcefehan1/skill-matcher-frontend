import { useState } from 'react';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, Pencil, Plus, Trash2, User, X } from 'lucide-react';
import {
  getGetAllProjectsQueryKey,
  getGetProjectQueryKey,
  useDeleteProject,
  useGetProject,
} from '@/api/generated/endpoints/projects/projects';
import {
  getGetProjectSkillsQueryKey,
  useAddSkill,
  useDelete1,
  useGetProjectSkills,
} from '@/api/generated/endpoints/project-skills/project-skills';
import {
  getGetMembersQueryKey,
  useAddMember,
  useGetMembers,
  useLeaveProject,
  useRemoveMember,
} from '@/api/generated/endpoints/project-members/project-members';
import {
  getFindCandidatesQueryKey,
  useFindCandidates,
} from '@/api/generated/endpoints/matching/matching';
import type {
  ProjectMemberDto,
  ProjectSkillDto,
  UserMatchDto,
} from '@/api/generated/model';
import { useAuthStore } from '@/stores/auth-store';
import { formatDate, PROJECT_STATUS_LABELS, cn } from '@/lib/utils';
import { ProjectFormDialog } from './project-form-dialog';
import { Badge } from '@/components/ui/badge';
import { LevelDots } from '@/components/level-dots';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

const PRIORITY_LABELS: Record<string, string> = {
  MUST_HAVE: 'Muss',
  NICE_TO_HAVE: 'Kann',
};

const MEMBER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Aktiv',
  PENDING: 'Ausstehend',
};

function scoreColor(score: number) {
  if (score >= 80) return 'text-score-high';
  if (score >= 50) return 'text-score-mid';
  return 'text-score-low';
}

// ---------- Skills (PM only, GET is role-gated server-side) ----------

function SkillsSection({
  projectId,
  isOwner,
}: {
  projectId: string;
  isOwner: boolean;
}) {
  const queryClient = useQueryClient();
  const skillsQuery = useGetProjectSkills(projectId);
  const addMutation = useAddSkill();
  const deleteMutation = useDelete1();
  const [name, setName] = useState('');
  const [level, setLevel] = useState(3);
  const [priority, setPriority] = useState('MUST_HAVE');
  const [error, setError] = useState<string | null>(null);

  const skills = skillsQuery.data as unknown as ProjectSkillDto[] | undefined;

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: getGetProjectSkillsQueryKey(projectId),
    });
    queryClient.invalidateQueries({
      queryKey: getFindCandidatesQueryKey(projectId),
    });
  };

  const onAdd = () => {
    if (!name.trim()) return;
    setError(null);
    addMutation.mutate(
      {
        projectId,
        data: {
          name: name.trim(),
          level,
          priority: priority as 'MUST_HAVE' | 'NICE_TO_HAVE',
        },
      },
      {
        onSuccess: () => {
          setName('');
          invalidate();
        },
        onError: () => setError('Skill konnte nicht hinzugefügt werden.'),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Benötigte Skills</CardTitle>
        <CardDescription>
          {isOwner
            ? 'Welche Skills braucht das Projekt?'
            : 'Anforderungen des Projekts'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {skillsQuery.isLoading && <Skeleton className="h-8 w-full" />}
        {skills && skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <Badge key={s.id} variant="secondary" className="gap-1.5">
                {s.name}
                {s.level != null && <LevelDots level={s.level} />}
                <span className="text-xs opacity-70">
                  {PRIORITY_LABELS[s.priority ?? ''] ?? s.priority}
                </span>
                {isOwner && (
                  <button
                    type="button"
                    aria-label={`${s.name} entfernen`}
                    className="ml-0.5 rounded-full opacity-60 hover:opacity-100"
                    onClick={() =>
                      deleteMutation.mutate(
                        { projectId, id: s.id ?? '' },
                        { onSuccess: invalidate },
                      )
                    }
                  >
                    <X className="size-3" aria-hidden />
                  </button>
                )}
              </Badge>
            ))}
          </div>
        )}
        {skills && skills.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Noch keine Skills definiert.
          </p>
        )}
        {isOwner && (
          <div className="flex flex-col gap-3 border-t pt-4">
            <div className="grid grid-cols-[1fr_auto_auto] items-end gap-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="skill-name">Skill</Label>
                <Input
                  id="skill-name"
                  autoComplete="off"
                  placeholder="z. B. Kotlin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label id="project-skill-level-label">Level</Label>
                <div
                  role="radiogroup"
                  aria-labelledby="project-skill-level-label"
                  className="flex h-9 items-center gap-1"
                >
                  {[1, 2, 3, 4, 5].map((l) => (
                    <button
                      key={l}
                      type="button"
                      role="radio"
                      aria-checked={level === l}
                      aria-label={`Level ${l}`}
                      onClick={() => setLevel(l)}
                      className={cn(
                        'size-3 rounded-full transition-colors',
                        l <= level
                          ? 'bg-primary'
                          : 'bg-muted-foreground/30 hover:bg-muted-foreground/50',
                      )}
                    />
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Priorität</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Button
                size="sm"
                variant="outline"
                disabled={addMutation.isPending || !name.trim()}
                onClick={onAdd}
              >
                <Plus className="size-4" aria-hidden />
                Hinzufügen
              </Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------- Members ----------

function MembersSection({
  projectId,
  isOwner,
  maxMembers,
}: {
  projectId: string;
  isOwner: boolean;
  maxMembers: number;
}) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const membersQuery = useGetMembers(projectId);
  const removeMutation = useRemoveMember();
  const leaveMutation = useLeaveProject();
  const [error, setError] = useState<string | null>(null);

  const members = membersQuery.data as unknown as
    | ProjectMemberDto[]
    | undefined;
  const isMember = members?.some((m) => m.userId === user?.id) ?? false;

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: getGetMembersQueryKey(projectId),
    });

  const onError = () => setError('Aktion fehlgeschlagen.');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Mitglieder</CardTitle>
        <CardDescription>
          <span className="tabular-nums">
            {members?.length ?? 0}/{maxMembers}
          </span>{' '}
          Plätze belegt
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col">
        {membersQuery.isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="mb-3 h-9 w-full" />
          ))}
        {members?.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between gap-3 border-b py-2.5 last:border-0"
          >
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium">
                {m.userName}
                {m.userId === user?.id && (
                  <span className="text-muted-foreground"> (Du)</span>
                )}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {m.email}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge variant="outline">
                {MEMBER_STATUS_LABELS[m.status ?? ''] ?? m.status}
              </Badge>
              {isOwner && m.userId !== user?.id && (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`${m.userName} entfernen`}
                  onClick={() =>
                    removeMutation.mutate(
                      { projectId, userId: m.userId ?? '' },
                      { onSuccess: invalidate, onError },
                    )
                  }
                >
                  <X className="size-4" aria-hidden />
                </Button>
              )}
            </div>
          </div>
        ))}
        {members && members.length === 0 && (
          <p className="py-2 text-sm text-muted-foreground">
            Noch keine Mitglieder.
          </p>
        )}
        {isMember && !isOwner && (
          <div className="pt-3">
            <Button
              variant="outline"
              size="sm"
              disabled={leaveMutation.isPending}
              onClick={() =>
                leaveMutation.mutate(
                  { projectId },
                  { onSuccess: invalidate, onError },
                )
              }
            >
              Projekt verlassen
            </Button>
          </div>
        )}
        {error && <p className="pt-2 text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}

// ---------- Candidates (PM only) ----------

function CandidatesSection({
  projectId,
  isOwner,
  members,
  maxMembers,
}: {
  projectId: string;
  isOwner: boolean;
  members?: ProjectMemberDto[];
  maxMembers: number;
}) {
  const queryClient = useQueryClient();
  const candidatesQuery = useFindCandidates(projectId, { minScore: 0, limit: 10 });
  const addMutation = useAddMember();

  const candidates = candidatesQuery.data as unknown as
    | UserMatchDto[]
    | undefined;
  const memberIds = new Set(members?.map((m) => m.userId));
  const full = (members?.length ?? 0) >= maxMembers;
  const visible = candidates?.filter((c) => !memberIds.has(c.userId));

  const onAdd = (userId: string) =>
    addMutation.mutate(
      { projectId, data: { userId } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getGetMembersQueryKey(projectId),
          });
          queryClient.invalidateQueries({
            queryKey: getFindCandidatesQueryKey(projectId),
          });
        },
      },
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Kandidaten</CardTitle>
        <CardDescription>
          Mitarbeiter, deren Skills zum Projekt passen
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {candidatesQuery.isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        {visible?.map((c) => {
          const score = Math.round((c.score ?? 0) * 100);
          return (
            <div
              key={c.userId}
              className="flex items-center justify-between gap-4 rounded-xl border p-3"
            >
              <div className="flex min-w-0 flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">
                    {c.userName}
                  </span>
                  <span
                    className={`text-sm font-medium tabular-nums ${scoreColor(score)}`}
                  >
                    {score}%
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {c.matchedSkills?.slice(0, 3).map((s) => (
                    <Badge
                      key={s.skillId}
                      className="bg-primary/10 text-primary hover:bg-primary/10"
                    >
                      {s.skillName}
                    </Badge>
                  ))}
                  {c.missingSkills?.slice(0, 2).map((s) => (
                    <Badge
                      key={s.skillId}
                      variant="outline"
                      className="text-muted-foreground"
                    >
                      fehlt: {s.skillName}
                    </Badge>
                  ))}
                </div>
              </div>
              {isOwner && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={full || addMutation.isPending}
                  onClick={() => onAdd(c.userId ?? '')}
                >
                  <Plus className="size-4" aria-hidden />
                  {full ? 'Voll' : 'Hinzufügen'}
                </Button>
              )}
            </div>
          );
        })}
        {visible && visible.length === 0 && (
          <p className="py-2 text-sm text-muted-foreground">
            Keine passenden Kandidaten gefunden.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ---------- Page ----------

export function ProjectDetailPage() {
  const { projectId } = useParams({ from: '/_authenticated/projects/$projectId' });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isPM = user?.role === 'PROJECTMANAGER';

  const projectQuery = useGetProject(projectId);
  const membersQuery = useGetMembers(projectId);
  const deleteMutation = useDeleteProject();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const project = projectQuery.data;
  const members = membersQuery.data as unknown as
    | ProjectMemberDto[]
    | undefined;
  const isOwner = !!project?.ownerId && project.ownerId === user?.id;

  if (projectQuery.isLoading) {
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
                deleteMutation.mutate(
                  { id: projectId },
                  {
                    onSuccess: () => {
                      queryClient.invalidateQueries({
                        queryKey: getGetAllProjectsQueryKey(),
                      });
                      queryClient.removeQueries({
                        queryKey: getGetProjectQueryKey(projectId),
                      });
                      navigate({ to: '/projects' });
                    },
                  },
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
