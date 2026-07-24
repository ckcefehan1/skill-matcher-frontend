import { useState } from 'react';
import { X } from 'lucide-react';
import { useProjectDetail } from '../use-project-detail';
import { useAuthStore } from '@/stores/auth-store';
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

const MEMBER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Aktiv',
  PENDING: 'Ausstehend',
};

export function MembersSection({
  projectId,
  isOwner,
  maxMembers,
}: {
  projectId: string;
  isOwner: boolean;
  maxMembers: number;
}) {
  const user = useAuthStore((s) => s.user);
  const {
    members,
    isMembersLoading,
    removeMemberMutation,
    leaveProjectMutation,
  } = useProjectDetail(projectId, { isPM: false });
  const [error, setError] = useState<string | null>(null);

  const isMember = members?.some((m) => m.userId === user?.id) ?? false;
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
        {isMembersLoading &&
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
                    removeMemberMutation.mutate(
                      { projectId, userId: m.userId ?? '' },
                      { onError },
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
              disabled={leaveProjectMutation.isPending}
              onClick={() =>
                leaveProjectMutation.mutate({ projectId }, { onError })
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
