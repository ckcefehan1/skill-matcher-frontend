import { Check, X } from 'lucide-react';
import { usePmApplications } from '../use-matching';
import { APPLICATION_STATUS_LABELS } from '../matching-labels';
import { formatDate } from '@/lib/utils';
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

export function ApplicationsSection({ projectId }: { projectId: string }) {
  const { applications, isApplicationsLoading, acceptMutation, declineMutation } =
    usePmApplications(projectId);

  const pending = applications?.filter((a) => a.status === 'PENDING');
  const invited = applications?.filter((a) => a.status === 'INVITED');
  const decided = applications?.filter(
    (a) => a.status !== 'PENDING' && a.status !== 'INVITED',
  );
  const busy = acceptMutation.isPending || declineMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Bewerbungen</CardTitle>
        <CardDescription>
          Eingehende Bewerbungen und gesendete Einladungen
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isApplicationsLoading &&
          Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        {pending?.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between gap-4 rounded-lg border p-3"
          >
            <div className="flex min-w-0 flex-col gap-1">
              <span className="truncate text-sm font-medium">{a.userName}</span>
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
                onClick={() =>
                  declineMutation.mutate({ id: a.id ?? '', data: {} })
                }
              >
                <X className="size-4" aria-hidden />
                Ablehnen
              </Button>
            </div>
          </div>
        ))}
        {invited?.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between gap-4 rounded-lg border p-3"
          >
            <div className="flex min-w-0 flex-col gap-1">
              <span className="truncate text-sm font-medium">{a.userName}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatDate(a.appliedAt)}
                {a.message ? ` · ${a.message}` : ''}
              </span>
            </div>
            <Badge variant="outline" className="text-muted-foreground">
              Einladung offen
            </Badge>
          </div>
        ))}
        {decided?.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between gap-4 rounded-lg border p-3 opacity-60"
          >
            <div className="flex min-w-0 flex-col gap-1">
              <span className="truncate text-sm font-medium">{a.userName}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatDate(a.appliedAt)}
              </span>
            </div>
            <Badge variant="outline">
              {APPLICATION_STATUS_LABELS[a.status ?? ''] ?? a.status}
            </Badge>
          </div>
        ))}
        {applications && applications.length === 0 && (
          <p className="py-2 text-sm text-muted-foreground">
            Keine Bewerbungen für dieses Projekt.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
