import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  MoreHorizontal,
  UserPlus,
} from 'lucide-react';
import {
  getListUsersQueryKey,
  useListUsers,
  useResendInvitation,
  useUpdateUserRole,
  useUpdateUserStatus,
} from '@/api/generated/endpoints/admin/admin';
import type { AdminUserListResponse } from '@/api/generated/model';
import { useAuthStore } from '@/stores/auth-store';
import { isUserEnabled, type AdminUser } from './admin-user';
import { InviteUserDialog, ROLE_LABELS } from './invite-user-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// ponytail: orval typed listUsers as single object, backend returns Page — regenerate orval with fixed spec to remove this cast
interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}

function StatusBadge({ user }: { user: AdminUserListResponse }) {
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

type UserStatus = 'aktiv' | 'eingeladen' | 'deaktiviert';

function statusOf(user: AdminUser): UserStatus {
  if (isUserEnabled(user)) return 'aktiv';
  if (!user.firstName) return 'eingeladen';
  return 'deaktiviert';
}

type SortKey = 'name' | 'email' | 'createdDate';

const STATUS_LABELS: Record<UserStatus, string> = {
  aktiv: 'Aktiv',
  eingeladen: 'Eingeladen',
  deaktiviert: 'Deaktiviert',
};

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('createdDate');
  const [sortAsc, setSortAsc] = useState(false);

  // ponytail: fetch first 100, filter/sort client-side — switch to server-side params when user count grows
  const { data, isLoading } = useListUsers({ pageable: { page: 0, size: 100 } });
  const users = (data as unknown as Page<AdminUser> | undefined)?.content;

  const filtered = (users ?? [])
    .filter((u) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        u.email?.toLowerCase().includes(q) ||
        `${u.firstName ?? ''} ${u.lastName ?? ''}`.toLowerCase().includes(q);
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchesStatus =
        statusFilter === 'ALL' || statusOf(u) === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    })
    .sort((a, b) => {
      const dir = sortAsc ? 1 : -1;
      if (sortKey === 'name') {
        return (
          dir *
          `${a.firstName ?? a.email}`.localeCompare(`${b.firstName ?? b.email}`)
        );
      }
      if (sortKey === 'email') {
        return dir * (a.email ?? '').localeCompare(b.email ?? '');
      }
      return dir * (a.createdDate ?? '').localeCompare(b.createdDate ?? '');
    });

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortAsc((v) => !v);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });

  const roleMutation = useUpdateUserRole({ mutation: { onSuccess: invalidate } });
  const statusMutation = useUpdateUserStatus({ mutation: { onSuccess: invalidate } });
  const resendMutation = useResendInvitation();

  const renderSortHead = (label: string, k: SortKey) => (
    <button
      onClick={() => toggleSort(k)}
      className="inline-flex items-center gap-1 hover:text-foreground"
    >
      {label}
      {sortKey === k ? (
        sortAsc ? (
          <ArrowUp className="size-3" aria-hidden />
        ) : (
          <ArrowDown className="size-3" aria-hidden />
        )
      ) : (
        <ArrowUpDown className="size-3 opacity-40" aria-hidden />
      )}
    </button>
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Benutzer</h1>
          <p className="text-sm text-muted-foreground">
            {users ? `${filtered.length} von ${users.length} Benutzern` : ' '}
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="size-4" aria-hidden />
          Benutzer einladen
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Name oder E-Mail suchen…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Alle Rollen</SelectItem>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Alle Status</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{renderSortHead('Name', 'name')}</TableHead>
              <TableHead>{renderSortHead('E-Mail', 'email')}</TableHead>
              <TableHead>Rolle</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>{renderSortHead('Erstellt', 'createdDate')}</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {filtered.map((u) => {
              const isSelf = u.id === currentUser?.id;
              const busy =
                (roleMutation.isPending || statusMutation.isPending) &&
                (roleMutation.variables?.userId === u.id ||
                  statusMutation.variables?.userId === u.id);
              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    {u.firstName
                      ? `${u.firstName} ${u.lastName ?? ''}`
                      : '—'}
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Select
                      value={u.role}
                      disabled={isSelf || busy}
                      onValueChange={(role) =>
                        roleMutation.mutate({ userId: u.id!, data: { role } })
                      }
                    >
                      <SelectTrigger className="h-8 w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ROLE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={isUserEnabled(u)}
                        disabled={isSelf || busy}
                        onCheckedChange={(enabled) =>
                          statusMutation.mutate({
                            userId: u.id!,
                            data: { enabled },
                          })
                        }
                        aria-label="Aktiv-Status"
                      />
                      <StatusBadge user={u} />
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {u.createdDate
                      ? new Date(u.createdDate).toLocaleDateString('de-DE')
                      : '—'}
                  </TableCell>
                  <TableCell>
                    {!isUserEnabled(u) && !u.firstName && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label="Aktionen"
                          >
                            <MoreHorizontal className="size-4" aria-hidden />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            disabled={resendMutation.isPending}
                            onClick={() =>
                              resendMutation.mutate({ userId: u.id! })
                            }
                          >
                            Einladung erneut senden
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {users && filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground"
                >
                  {users.length === 0
                    ? 'Noch keine Benutzer. Lade den ersten Benutzer ein.'
                    : 'Keine Benutzer für diese Filter.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
}
