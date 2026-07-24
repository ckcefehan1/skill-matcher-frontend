import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  getListBySkillQueryKey,
  useCreate1,
  useDelete3,
  useListBySkill,
} from '@/api/generated/endpoints/skill-relations/skill-relations';
import { useGetAllSkills } from '@/api/generated/endpoints/skills/skills';
import type {
  CreateSkillRelationRequestRelationType,
  SkillDto,
  SkillRelationDto,
} from '@/api/generated/model';
import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { Page } from '@/lib/utils';

const RELATION_TYPE_LABELS: Record<string, string> = {
  SIMILAR_TO: 'Ähnlich wie',
  PARENT_OF: 'Oberbegriff von',
  PREREQUISITE_OF: 'Voraussetzung für',
};

const SOURCE_LABELS: Record<string, string> = {
  CURATED: 'Kuratiert',
  LEARNED: 'Gelernt',
};

function SkillSelect({
  id,
  value,
  onChange,
  skills,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  skills?: SkillDto[];
  placeholder: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {skills?.map((s) => (
          <SelectItem key={s.id} value={s.id ?? ''}>
            {s.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function AdminSkillsPage() {
  const queryClient = useQueryClient();
  const catalogQuery = useGetAllSkills({ pageable: { page: 0, size: 100 } });
  const skills = (
    catalogQuery.data as unknown as Page<SkillDto> | undefined
  )?.content;

  const [fromSkillId, setFromSkillId] = useState('');
  const [toSkillId, setToSkillId] = useState('');
  const [relationType, setRelationType] = useState('SIMILAR_TO');
  const [penalty, setPenalty] = useState('0.2');
  const [createError, setCreateError] = useState<string | null>(null);

  const [browseSkillId, setBrowseSkillId] = useState('');
  const relationsQuery = useListBySkill(
    { skillId: browseSkillId },
    { query: { enabled: !!browseSkillId } },
  );
  const relations = relationsQuery.data as unknown as
    | SkillRelationDto[]
    | undefined;

  const createMutation = useCreate1();
  const deleteMutation = useDelete3();

  const invalidateRelations = () =>
    queryClient.invalidateQueries({
      queryKey: getListBySkillQueryKey({ skillId: browseSkillId }),
    });

  const onCreate = () => {
    setCreateError(null);
    createMutation.mutate(
      {
        data: {
          fromSkillId,
          toSkillId,
          relationType: relationType as CreateSkillRelationRequestRelationType,
          transferPenalty: Number(penalty),
        },
      },
      {
        onSuccess: () => {
          setFromSkillId('');
          setToSkillId('');
          invalidateRelations();
        },
        onError: () =>
          setCreateError(
            'Relation konnte nicht angelegt werden (existiert sie schon?).',
          ),
      },
    );
  };

  const createValid =
    fromSkillId &&
    toSkillId &&
    fromSkillId !== toSkillId &&
    penalty !== '' &&
    Number(penalty) >= 0 &&
    Number(penalty) <= 1;

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
            {skills
              ? `${skills.length} Skills im System`
              : 'Skills im System'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {catalogQuery.isLoading && (
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Relation anlegen</CardTitle>
          <CardDescription>
            Kuratierte Verbindung zwischen zwei Skills. Transfer-Penalty 0
            (volle Übertragung) bis 1 (keine Übertragung).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="from-skill">Von Skill</Label>
              <SkillSelect
                id="from-skill"
                value={fromSkillId}
                onChange={setFromSkillId}
                skills={skills}
                placeholder="Wählen…"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="to-skill">Zu Skill</Label>
              <SkillSelect
                id="to-skill"
                value={toSkillId}
                onChange={setToSkillId}
                skills={skills}
                placeholder="Wählen…"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Typ</Label>
              <Select value={relationType} onValueChange={setRelationType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RELATION_TYPE_LABELS).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="penalty">Transfer-Penalty</Label>
              <Input
                id="penalty"
                type="number"
                min={0}
                max={1}
                step={0.1}
                value={penalty}
                onChange={(e) => setPenalty(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Button
              size="sm"
              variant="outline"
              disabled={createMutation.isPending || !createValid}
              onClick={onCreate}
            >
              <Plus className="size-4" aria-hidden />
              Anlegen
            </Button>
          </div>
          {createError && (
            <p className="text-sm text-destructive">{createError}</p>
          )}
        </CardContent>
      </Card>

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
              value={browseSkillId}
              onChange={setBrowseSkillId}
              skills={skills}
              placeholder="Skill wählen…"
            />
          </div>

          {browseSkillId && relationsQuery.isLoading && (
            <Skeleton className="h-8 w-full" />
          )}
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
                  {SOURCE_LABELS[r.source ?? ''] ?? r.source}
                </Badge>
              </div>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Relation löschen"
                disabled={deleteMutation.isPending}
                onClick={() =>
                  deleteMutation.mutate(
                    { id: r.id ?? '' },
                    { onSuccess: invalidateRelations },
                  )
                }
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
    </div>
  );
}
