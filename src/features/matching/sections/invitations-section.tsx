import { Link } from '@tanstack/react-router';
import { Check, X } from 'lucide-react';
import { useEmployeeInvitations } from '../use-matching';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function InvitationsSection() {
  const { invitations, isInvitationsLoading, acceptMutation, declineMutation } =
    useEmployeeInvitations();

  if (isInvitationsLoading) {
    return <Skeleton className="h-24 w-full" />;
  }

  if (!invitations || invitations.length === 0) {
    return null;
  }

  const busy = acceptMutation.isPending || declineMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Einladungen</CardTitle>
        <CardDescription>
          Projektmanager haben dich zu diesen Projekten eingeladen
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {invitations.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between gap-4 rounded-lg border p-3"
          >
            <div className="flex min-w-0 flex-col gap-1">
              <Link
                to="/projects/$projectId"
                params={{ projectId: a.projectId ?? '' }}
                className="truncate text-sm font-medium hover:underline"
              >
                {a.projectName}
              </Link>
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatDate(a.appliedAt)}
                {a.message ? ` · ${a.message}` : ''}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => acceptMutation.mutate({ id: a.id ?? '' })}
              >
                <Check className="size-4" aria-hidden />
                Annehmen
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => declineMutation.mutate({ id: a.id ?? '' })}
              >
                <X className="size-4" aria-hidden />
                Ablehnen
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
