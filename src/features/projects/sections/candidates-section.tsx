import { useState } from 'react';
import { Plus, UserPlus } from 'lucide-react';
import type { ApplicationDto, ProjectMemberDto } from '@/api/generated/model';
import { useListForProject } from '@/api/generated/endpoints/project-applications/project-applications';
import { useProjectDetail } from '../use-project-detail';
import { ProjectInviteDialog } from './project-invite-dialog';
import { scoreColor, type Page } from '@/lib/utils';
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

// gleiche Params wie usePmApplications — gleiche QueryKey, Invalidate nach Accept greift hier auch
const APPLICATIONS_PARAMS = { pageable: { page: 0, size: 50 } };

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

  // addMember erfordert serverseitig eine ACCEPTED-Bewerbung — Liste nur für Owner nötig
  const applicationsQuery = useListForProject(projectId, APPLICATIONS_PARAMS, {
    query: { enabled: isOwner },
  });
  const acceptedUserIds = new Set(
    (
      applicationsQuery.data as unknown as Page<ApplicationDto> | undefined
    )?.content
      ?.filter((a) => a.status === 'ACCEPTED')
      .map((a) => a.userId),
  );
  const invitedUserIds = new Set(
    (
      applicationsQuery.data as unknown as Page<ApplicationDto> | undefined
    )?.content
      ?.filter((a) => a.status === 'INVITED')
      .map((a) => a.userId),
  );

  const [inviteTarget, setInviteTarget] = useState<{
    userId: string;
    userName: string;
  }>();

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
              className="flex items-center justify-between gap-4 rounded-lg border p-3"
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
              {isOwner && acceptedUserIds.has(c.userId ?? '') && (
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
              {isOwner &&
                !acceptedUserIds.has(c.userId ?? '') &&
                (invitedUserIds.has(c.userId ?? '') ? (
                  <Badge variant="outline" className="text-muted-foreground">
                    Einladung offen
                  </Badge>
                ) : c.hasApplied ? (
                  <Badge variant="outline" className="text-muted-foreground">
                    Bewerbung offen
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setInviteTarget({
                        userId: c.userId ?? '',
                        userName: c.userName ?? '',
                      })
                    }
                  >
                    <UserPlus className="size-4" aria-hidden />
                    Einladen
                  </Button>
                ))}
            </div>
          );
        })}
        {visible && visible.length === 0 && (
          <p className="py-2 text-sm text-muted-foreground">
            Keine passenden Kandidaten gefunden.
          </p>
        )}
      </CardContent>
      {inviteTarget && (
        <ProjectInviteDialog
          open
          onOpenChange={(open) => !open && setInviteTarget(undefined)}
          projectId={projectId}
          userId={inviteTarget.userId}
          userName={inviteTarget.userName}
        />
      )}
    </Card>
  );
}
