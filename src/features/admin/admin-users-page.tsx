import { useState } from 'react';
import { keepPreviousData, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, UserPlus } from 'lucide-react';
import {
  getListUsersQueryKey,
  useListUsers,
  useResendInvitation,
  useUpdateUserRole,
  useUpdateUserStatus,
} from '@/api/generated/endpoints/admin/admin';
import type { AdminUserListResponse } from '@/api/generated/model';
import { useAuthStore } from '@/stores/auth-store';
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
  if (user.enabled) {
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

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const [page, setPage] = useState(0);
  const [inviteOpen, setInviteOpen] = useState(false);

  const { data, isLoading } = useListUsers({
    request: { params: { page, size: 20 } },
    query: { placeholderData: keepPreviousData },
  });
  const usersPage = data as unknown as Page<AdminUserListResponse> | undefined;

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });

  const roleMutation = useUpdateUserRole({ mutation: { onSuccess: invalidate } });
  const statusMutation = useUpdateUserStatus({ mutation: { onSuccess: invalidate } });
  const resendMutation = useResendInvitation();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Benutzer</h1>
          <p className="text-sm text-muted-foreground">
            {usersPage ? `${usersPage.totalElements} Benutzer insgesamt` : ' '}
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="size-4" aria-hidden />
          Benutzer einladen
        </Button>
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>E-Mail</TableHead>
              <TableHead>Rolle</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Erstellt</TableHead>
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
            {usersPage?.content.map((u) => {
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
                        checked={!!u.enabled}
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
                    {!u.enabled && !u.firstName && (
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
            {usersPage && usersPage.content.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground"
                >
                  Noch keine Benutzer. Lade den ersten Benutzer ein.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {usersPage && usersPage.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Zurück
          </Button>
          <span className="text-sm text-muted-foreground">
            Seite {page + 1} von {usersPage.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= usersPage.totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Weiter
          </Button>
        </div>
      )}

      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
}
