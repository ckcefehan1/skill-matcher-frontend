import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { SkillDto } from '@/api/generated/model';
import { useSkillRelations } from '../use-skill-relations';
import {
  RELATION_SOURCE_LABELS,
  RELATION_TYPE_LABELS,
} from '../skill-relation-labels';
import { SkillSelect } from './skill-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

export function RelationBrowseCard({ skills }: { skills?: SkillDto[] }) {
  const [skillId, setSkillId] = useState('');
  const { relations, isLoading, deleteMutation } = useSkillRelations(
    skillId || undefined,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Relationen durchsuchen</CardTitle>
        <CardDescription>
          Alle Relationen eines Skills (kuratiert und gelernt).
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex max-w-xs flex-col gap-2">
          <Label htmlFor="browse-skill">Skill</Label>
          <SkillSelect
            id="browse-skill"
            value={skillId}
            onChange={setSkillId}
            skills={skills}
            placeholder="Skill wählen…"
          />
        </div>

        {isLoading && <Skeleton className="h-8 w-full" />}
        {relations?.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between gap-3 border-b py-2.5 last:border-0"
          >
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <span className="font-medium">{r.fromSkillName}</span>
              <span className="text-muted-foreground">
                {RELATION_TYPE_LABELS[r.relationType ?? ''] ?? r.relationType}
              </span>
              <span className="font-medium">{r.toSkillName}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                Penalty {r.transferPenalty}
              </span>
              <Badge variant="outline" className="text-xs">
                {RELATION_SOURCE_LABELS[r.source ?? ''] ?? r.source}
              </Badge>
            </div>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Relation löschen"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate({ id: r.id ?? '' })}
            >
              <Trash2 className="size-4" aria-hidden />
            </Button>
          </div>
        ))}
        {relations && relations.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Keine Relationen für diesen Skill.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
