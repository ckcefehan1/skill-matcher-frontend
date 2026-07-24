import { Plus } from 'lucide-react';
import type { ProjectMemberDto } from '@/api/generated/model';
import { useProjectDetail } from '../use-project-detail';
import { scoreColor } from '@/lib/utils';
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

export function CandidatesSection({
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
  const { candidates, isCandidatesLoading, addMemberMutation } =
    useProjectDetail(projectId, { isPM: true });

  const memberIds = new Set(members?.map((m) => m.userId));
  const full = (members?.length ?? 0) >= maxMembers;
  const visible = candidates?.filter((c) => !memberIds.has(c.userId));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Kandidaten</CardTitle>
        <CardDescription>
          Mitarbeiter, deren Skills zum Projekt passen
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isCandidatesLoading &&
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
                  disabled={full || addMemberMutation.isPending}
                  onClick={() =>
                    addMemberMutation.mutate({
                      projectId,
                      data: { userId: c.userId ?? '' },
                    })
                  }
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
