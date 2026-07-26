import { useState } from 'react';
import { Search, UserPlus } from 'lucide-react';
import type { ApplicationDto, ProjectMemberDto } from '@/api/generated/model';
import { useListForProject } from '@/api/generated/endpoints/project-applications/project-applications';
import { useSearchUsers } from '@/api/generated/endpoints/user-search/user-search';
import type { UserSearchResultDto } from '@/api/generated/model';
import { ProjectInviteDialog } from '@/features/projects/sections/project-invite-dialog';
import type { Page } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// gleiche Params wie candidates-section — geteilte QueryCache
const APPLICATIONS_PARAMS = { pageable: { page: 0, size: 50 } };
const SEARCH_PAGEABLE = { page: 0, size: 20 };

export function UserSearchSection({
  projectId,
  members,
}: {
  projectId: string;
  members?: ProjectMemberDto[];
}) {
  const [input, setInput] = useState('');
  const [query, setQuery] = useState<string>();

  const searchQuery = useSearchUsers(
    { q: query, pageable: SEARCH_PAGEABLE },
    { query: { enabled: query !== undefined } },
  );

  const applicationsQuery = useListForProject(projectId, APPLICATIONS_PARAMS);
  const busyUserIds = new Set(
    (
      applicationsQuery.data as unknown as Page<ApplicationDto> | undefined
    )?.content
      ?.filter((a) => a.status === 'ACCEPTED' || a.status === 'INVITED' || a.status === 'PENDING')
      .map((a) => a.userId),
  );
  const memberIds = new Set(members?.map((m) => m.userId));

  const results = (
    searchQuery.data as unknown as Page<UserSearchResultDto> | undefined
  )?.content?.filter((u) => !memberIds.has(u.id) && !busyUserIds.has(u.id));

  const [inviteTarget, setInviteTarget] = useState<{
    userId: string;
    userName: string;
  }>();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Mitarbeiter suchen</CardTitle>
        <CardDescription>
          Suche nach Name oder E-Mail und lade Personen direkt ein
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(input);
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Name oder E-Mail…"
            autoComplete="off"
          />
          <Button type="submit" variant="outline" disabled={searchQuery.isFetching}>
            <Search className="size-4" aria-hidden />
            Suchen
          </Button>
        </form>
        {results?.map((u) => (
          <div
            key={u.id}
            className="flex items-center justify-between gap-4 rounded-lg border p-3"
          >
            <div className="flex min-w-0 flex-col gap-1">
              <span className="truncate text-sm font-medium">{u.userName}</span>
              <span className="truncate text-xs text-muted-foreground">
                {u.email}
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setInviteTarget({ userId: u.id ?? '', userName: u.userName ?? '' })
              }
            >
              <UserPlus className="size-4" aria-hidden />
              Einladen
            </Button>
          </div>
        ))}
        {query !== undefined && results && results.length === 0 && (
          <p className="py-2 text-sm text-muted-foreground">
            Keine Mitarbeiter gefunden.
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
