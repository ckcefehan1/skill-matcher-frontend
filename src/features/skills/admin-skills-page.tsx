import { useSkillCatalog } from './use-skill-catalog';
import { QueryError } from '@/components/query-error';
import { usePageTitle } from '@/lib/use-page-title';
import { RelationCreateCard } from './components/relation-create-card';
import { RelationBrowseCard } from './components/relation-browse-card';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function AdminSkillsPage() {
  usePageTitle('Skills');
  const { skills, isLoading, isError, refetch } = useSkillCatalog();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Skills</h1>
        <p className="text-sm text-muted-foreground">
          Skill-Katalog und kuratierte Relationen verwalten.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Skill-Katalog</CardTitle>
          <CardDescription>
            {skills ? `${skills.length} Skills im System` : 'Skills im System'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isError && <QueryError onRetry={() => refetch()} />}
          {isLoading && (
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

      <RelationCreateCard skills={skills} />
      <RelationBrowseCard skills={skills} />
    </div>
  );
}
