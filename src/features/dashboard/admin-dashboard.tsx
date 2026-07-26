import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import {
  ArrowRight,
  FolderKanban,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { useAdminDashboardData } from './use-dashboard-data';
import { QueryError } from '@/components/query-error';
import { StatCard } from './components/stat-card';
import { InviteUserDialog } from '@/features/admin/invite-user-dialog';
import { isUserEnabled, ROLE_LABELS } from '@/features/admin/admin-user';
import { UserStatusBadge } from '@/features/admin/user-status-badge';
import { PROJECT_STATUS_LABELS } from '@/lib/utils';
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

export function AdminDashboard() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const {
    users,
    projects,
    skills,
    usersLoading,
    projectsLoading,
    skillsLoading,
    isError,
    refetch,
  } = useAdminDashboardData();

  const activeUsers = users?.filter((u) => isUserEnabled(u)).length ?? 0;
  const invitedUsers =
    users?.filter((u) => !isUserEnabled(u) && !u.firstName).length ?? 0;
  const activeProjects =
    projects?.filter((p) => p.status === 'ACTIVE').length ?? 0;

  const recentUsers = [...(users ?? [])]
    .sort((a, b) => (b.createdDate ?? '').localeCompare(a.createdDate ?? ''))
    .slice(0, 5);
  const recentProjects = [...(projects ?? [])]
    .sort((a, b) => (b.createdDate ?? '').localeCompare(a.createdDate ?? ''))
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      {isError && <QueryError onRetry={refetch} />}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Benutzer gesamt"
          value={users?.length ?? 0}
          loading={usersLoading}
          tone="blue"
        />
        <StatCard
          icon={UserCheck}
          label="Aktive Benutzer"
          value={activeUsers}
          loading={usersLoading}
        />
        <StatCard
          icon={UserPlus}
          label="Offene Einladungen"
          value={invitedUsers}
          loading={usersLoading}
          tone="amber"
        />
        <StatCard
          icon={FolderKanban}
          label="Aktive Projekte"
          value={activeProjects}
          loading={projectsLoading}
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
            {usersLoading &&
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
            {projectsLoading &&
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
            {skillsLoading && (
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
