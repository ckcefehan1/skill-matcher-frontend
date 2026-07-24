import { useState } from 'react';
import { Plus } from 'lucide-react';
import type {
  CreateSkillRelationRequestRelationType,
  SkillDto,
} from '@/api/generated/model';
import { useSkillRelations } from '../use-skill-relations';
import { RELATION_TYPE_LABELS } from '../skill-relation-labels';
import { SkillSelect } from './skill-select';
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

export function RelationCreateCard({ skills }: { skills?: SkillDto[] }) {
  const { createMutation } = useSkillRelations();

  const [fromSkillId, setFromSkillId] = useState('');
  const [toSkillId, setToSkillId] = useState('');
  const [relationType, setRelationType] = useState('SIMILAR_TO');
  const [penalty, setPenalty] = useState('0.2');
  const [error, setError] = useState<string | null>(null);

  const valid =
    fromSkillId &&
    toSkillId &&
    fromSkillId !== toSkillId &&
    penalty !== '' &&
    Number(penalty) >= 0 &&
    Number(penalty) <= 1;

  const onCreate = () => {
    setError(null);
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
        },
        onError: () =>
          setError(
            'Relation konnte nicht angelegt werden (existiert sie schon?).',
          ),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Relation anlegen</CardTitle>
        <CardDescription>
          Kuratierte Verbindung zwischen zwei Skills. Transfer-Penalty 0 (volle
          Übertragung) bis 1 (keine Übertragung).
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
                {Object.entries(RELATION_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
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
            disabled={createMutation.isPending || !valid}
            onClick={onCreate}
          >
            <Plus className="size-4" aria-hidden />
            Anlegen
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
