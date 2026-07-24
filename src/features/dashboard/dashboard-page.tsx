import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import {
  ArrowRight,
  CalendarDays,
  FolderKanban,
  Plus,
  Sparkles,
  Target,
  UserCheck,
  UserPlus,
  Users,
  Wrench,
} from 'lucide-react';
import { useFindProjectsForMe } from '@/api/generated/endpoints/matching/matching';
import { useGetMySkills } from '@/api/generated/endpoints/my-skills/my-skills';
import { useGetAll } from '@/api/generated/endpoints/my-availability/my-availability';
import { useListUsers } from '@/api/generated/endpoints/admin/admin';
import { useGetAllProjects } from '@/api/generated/endpoints/projects/projects';
import { useGetAllSkills } from '@/api/generated/endpoints/skills/skills';
import type {
  AdminUserListResponse,
  ProjectDto,
  ProjectMatchDto,
  SkillDto,
  UserAvailabilityDto,
  UserSkillDto,
} from '@/api/generated/model';
import { useAuthStore } from '@/stores/auth-store';
import { InviteUserDialog, ROLE_LABELS } from '@/features/admin/invite-user-dialog';
import { isUserEnabled, type AdminUser } from '@/features/admin/admin-user';
import { formatDate, PROJECT_STATUS_LABELS, type Page } from '@/lib/utils';
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
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

function scoreColor(score: number) {
  if (score >= 80) return 'text-score-high';
  if (score >= 50) return 'text-score-mid';
  return 'text-score-low';
}

const TONES = {
  primary: 'bg-primary/10 text-primary',
  blue: 'bg-blue-500/10 text-blue-600',
  amber: 'bg-amber-500/10 text-amber-600',
  violet: 'bg-violet-500/10 text-violet-600',
} as const;

function StatCard({
  icon: Icon,
  label,
  value,
  loading,
  tone = 'primary',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  loading: boolean;
  tone?: keyof typeof TONES;
}) {
  return (
    <Card className="transition-colors hover:border-primary/40">
      <CardContent className="flex items-center gap-4 py-4">
        <div
          className={`flex size-10 items-center justify-center rounded-xl ${TONES[tone]}`}
        >
          <Icon className="size-5" aria-hidden />
        </div>
        <div className="flex flex-col">
          {loading ? (
            <Skeleton className="h-7 w-12" />
          ) : (
            <span className="text-2xl font-medium tabular-nums tracking-tight">
              {value}
            </span>
          )}
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- Admin ----------

function UserStatusBadge({ user }: { user: AdminUserListResponse }) {
  if (isUserEnabled(user)) {
    return (
      <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-700">
        Aktiv
      </Badge>
    );
  }
  if (!user.firstName) {
    return (
      <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700">
        Eingeladen
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-700">
      Deaktiviert
    </Badge>
  );
}

function AdminDashboard() {
  const [inviteOpen, setInviteOpen] = useState(false);

  // ponytail: no filtered count endpoints — fetch first 100 and aggregate client-side
  const usersQuery = useListUsers({ request: { params: { page: 0, size: 100 } } });
  const projectsQuery = useGetAllProjects({ request: { params: { page: 0, size: 100 } } });
  const skillsQuery = useGetAllSkills({ request: { params: { page: 0, size: 100 } } });

  // ponytail: orval typed list GETs as Blob/single — backend returns lists/pages. Regenerate orval with fixed spec to remove casts.
  const users = (usersQuery.data as unknown as Page<AdminUser> | undefined)
    ?.content;
  const projects = (
    projectsQuery.data as unknown as Page<ProjectDto> | undefined
  )?.content;
  const skills = (skillsQuery.data as unknown as Page<SkillDto> | undefined)
    ?.content;

  const activeUsers = users?.filter((u) => isUserEnabled(u)).length ?? 0;
  const invitedUsers =
    users?.filter((u) => !isUserEnabled(u) && !u.firstName).length ?? 0;
  const activeProjects = projects?.filter((p) => p.status === 'ACTIVE').length ?? 0;

  const recentUsers = [...(users ?? [])]
    .sort((a, b) => (b.createdDate ?? '').localeCompare(a.createdDate ?? ''))
    .slice(0, 5);
  const recentProjects = [...(projects ?? [])]
    .sort((a, b) => (b.createdDate ?? '').localeCompare(a.createdDate ?? ''))
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Benutzer gesamt"
          value={users?.length ?? 0}
          loading={usersQuery.isLoading}
          tone="blue"
        />
        <StatCard
          icon={UserCheck}
          label="Aktive Benutzer"
          value={activeUsers}
          loading={usersQuery.isLoading}
        />
        <StatCard
          icon={UserPlus}
          label="Offene Einladungen"
          value={invitedUsers}
          loading={usersQuery.isLoading}
          tone="amber"
        />
        <StatCard
          icon={FolderKanban}
          label="Aktive Projekte"
          value={activeProjects}
          loading={projectsQuery.isLoading}
          tone="violet"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Neueste Benutzer</CardTitle>
              <CardDescription>Zuletzt angelegte Accounts</CardDescription>
            </div>
            <Button size="sm" onClick={() => setInviteOpen(true)}>
              <UserPlus className="size-4" aria-hidden />
              Einladen
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col">
            {usersQuery.isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="mb-3 h-9 w-full" />
              ))}
            {recentUsers.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between gap-3 border-b py-2.5 last:border-0"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">
                    {u.firstName ? `${u.firstName} ${u.lastName ?? ''}` : u.email}
                  </span>
                  {u.firstName && (
                    <span className="truncate text-xs text-muted-foreground">
                      {u.email}
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="outline">{ROLE_LABELS[u.role ?? ''] ?? u.role}</Badge>
                  <UserStatusBadge user={u} />
                </div>
              </div>
            ))}
            <Link
              to="/admin/users"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Alle Benutzer
              <ArrowRight className="size-3" aria-hidden />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Neueste Projekte</CardTitle>
            <CardDescription>Zuletzt angelegte Projekte</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col">
            {projectsQuery.isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="mb-3 h-9 w-full" />
              ))}
            {recentProjects.map((p) => (
              <Link
                key={p.id}
                to="/projects/$projectId"
                params={{ projectId: p.id ?? '' }}
                className="flex items-center justify-between gap-3 border-b py-2.5 last:border-0 hover:bg-accent/50"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">{p.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {p.ownerName}
                  </span>
                </div>
                <Badge variant="outline" className="shrink-0">
                  {PROJECT_STATUS_LABELS[p.status ?? ''] ?? p.status}
                </Badge>
              </Link>
            ))}
            {projects && projects.length === 0 && (
              <p className="py-4 text-sm text-muted-foreground">
                Noch keine Projekte angelegt.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Skills</CardTitle>
            <CardDescription>
              {skills ? `${skills.length} Skills im System` : 'Skills im System'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {skillsQuery.isLoading && (
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-16" />
                ))}
              </div>
            )}
            {skills && skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s) => (
                  <Badge key={s.id} variant="secondary">
                    {s.name}
                  </Badge>
                ))}
              </div>
            )}
            {skills && skills.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Noch keine Skills angelegt.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
}

// ---------- Shared (PM + Mitarbeiter) ----------

function MySkillsCard({
  skills,
  loading,
}: {
  skills?: UserSkillDto[];
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Deine Skills</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-16" />
            ))}
          </div>
        )}
        {skills && skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <Badge key={s.id} variant="secondary">
                {s.name}
                {s.level != null && (
                  <span className="ml-1 text-xs opacity-70 tabular-nums">
                    {s.level}/5
                  </span>
                )}
              </Badge>
            ))}
          </div>
        )}
        {skills && skills.length === 0 && (
          <Link
            to="/skills"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Skills hinzufügen
            <ArrowRight className="size-3" aria-hidden />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

function MyAvailabilityCard({
  availability,
  loading,
}: {
  availability?: UserAvailabilityDto[];
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Verfügbarkeit</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {loading && <Skeleton className="h-10 w-full" />}
        {availability?.slice(0, 3).map((a) => (
          <div
            key={a.id}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <CalendarDays className="size-4 shrink-0" aria-hidden />
            <span className="tabular-nums">
              {formatDate(a.availableFrom)} – {formatDate(a.availableTo)}
            </span>
          </div>
        ))}
        {availability && availability.length === 0 && (
          <Link
            to="/availability"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Verfügbarkeit eintragen
            <ArrowRight className="size-3" aria-hidden />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

// ---------- Projektmanager ----------

function PmDashboard() {
  const user = useAuthStore((s) => s.user);
  const [createOpen, setCreateOpen] = useState(false);

  // ponytail: no filtered endpoints — fetch first 100, filter client-side
  const projectsQuery = useGetAllProjects({
    request: { params: { page: 0, size: 100 } },
  });
  const skillsQuery = useGetMySkills();
  const availabilityQuery = useGetAll();

  const projects = (
    projectsQuery.data as unknown as Page<ProjectDto> | undefined
  )?.content;
  const skills = skillsQuery.data as unknown as UserSkillDto[] | undefined;
  const availability = availabilityQuery.data as unknown as
    | UserAvailabilityDto[]
    | undefined;

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
          loading={projectsQuery.isLoading}
        />
        <StatCard
          icon={Target}
          label="Davon aktiv"
          value={activeCount}
          loading={projectsQuery.isLoading}
          tone="blue"
        />
        <StatCard
          icon={CalendarDays}
          label="Geplant"
          value={plannedCount}
          loading={projectsQuery.isLoading}
          tone="violet"
        />
        <StatCard
          icon={Wrench}
          label="Deine Skills"
          value={skills?.length ?? 0}
          loading={skillsQuery.isLoading}
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
            {projectsQuery.isLoading &&
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
          <MySkillsCard skills={skills} loading={skillsQuery.isLoading} />
          <MyAvailabilityCard
            availability={availability}
            loading={availabilityQuery.isLoading}
          />
        </div>
      </div>

      <ProjectFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

// ---------- Personal (EMPLOYER) ----------

function MatchCard({ match }: { match: ProjectMatchDto }) {
  const score = Math.round((match.score ?? 0) * 100);
  return (
    <Link
      to="/projects/$projectId"
      params={{ projectId: match.projectId ?? '' }}
      className="block rounded-xl border bg-card p-4 transition-colors hover:border-primary/40"
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

function PersonalDashboard() {
  const matchesQuery = useFindProjectsForMe({ minScore: 0, limit: 5 });
  const skillsQuery = useGetMySkills();
  const availabilityQuery = useGetAll();

  const matches = matchesQuery.data as unknown as ProjectMatchDto[] | undefined;
  const skills = skillsQuery.data as unknown as UserSkillDto[] | undefined;
  const availability = availabilityQuery.data as unknown as
    | UserAvailabilityDto[]
    | undefined;

  const goodMatches = matches?.filter((m) => (m.score ?? 0) >= 0.5).length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Wrench}
          label="Deine Skills"
          value={skills?.length ?? 0}
          loading={skillsQuery.isLoading}
          tone="blue"
        />
        <StatCard
          icon={Target}
          label="Projekt-Matches"
          value={matches?.length ?? 0}
          loading={matchesQuery.isLoading}
        />
        <StatCard
          icon={Sparkles}
          label="Davon 50%+"
          value={goodMatches}
          loading={matchesQuery.isLoading}
          tone="amber"
        />
        <StatCard
          icon={CalendarDays}
          label="Verfügbarkeiten"
          value={availability?.length ?? 0}
          loading={availabilityQuery.isLoading}
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
            {matchesQuery.isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
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
          <MySkillsCard skills={skills} loading={skillsQuery.isLoading} />
          <MyAvailabilityCard
            availability={availability}
            loading={availabilityQuery.isLoading}
          />
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
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
