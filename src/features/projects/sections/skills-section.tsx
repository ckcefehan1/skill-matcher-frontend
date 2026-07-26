import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useProjectDetail } from '../use-project-detail';
import { LevelDots } from '@/components/level-dots';
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
import { cn } from '@/lib/utils';

const PRIORITY_LABELS: Record<string, string> = {
  MUST_HAVE: 'Muss',
  NICE_TO_HAVE: 'Kann',
};

export function SkillsSection({
  projectId,
  isOwner,
}: {
  projectId: string;
  isOwner: boolean;
}) {
  const { skills, isSkillsLoading, addSkillMutation, deleteSkillMutation } =
    useProjectDetail(projectId, { isPM: true });

  const [name, setName] = useState('');
  const [level, setLevel] = useState(3);
  const [priority, setPriority] = useState('MUST_HAVE');
  const [error, setError] = useState<string | null>(null);

  const onAdd = () => {
    if (!name.trim()) return;
    setError(null);
    addSkillMutation.mutate(
      {
        projectId,
        data: {
          name: name.trim(),
          level,
          priority: priority as 'MUST_HAVE' | 'NICE_TO_HAVE',
        },
      },
      {
        onSuccess: () => setName(''),
        onError: () => setError('Skill konnte nicht hinzugefügt werden.'),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Benötigte Skills</CardTitle>
        <CardDescription>
          {isOwner
            ? 'Welche Skills braucht das Projekt?'
            : 'Anforderungen des Projekts'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isSkillsLoading && <Skeleton className="h-8 w-full" />}
        {skills && skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <Badge key={s.id} variant="secondary" className="gap-1.5">
                {s.name}
                {s.level != null && <LevelDots level={s.level} />}
                <span className="text-xs opacity-70">
                  {PRIORITY_LABELS[s.priority ?? ''] ?? s.priority}
                </span>
                {isOwner && (
                  <button
                    type="button"
                    aria-label={`${s.name} entfernen`}
                    className="ml-0.5 rounded-full opacity-60 hover:opacity-100"
                    onClick={() =>
                      deleteSkillMutation.mutate({ projectId, id: s.id ?? '' })
                    }
                  >
                    <X className="size-3" aria-hidden />
                  </button>
                )}
              </Badge>
            ))}
          </div>
        )}
        {skills && skills.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Noch keine Skills definiert.
          </p>
        )}
        {isOwner && (
          <div className="flex flex-col gap-3 border-t pt-4">
            <div className="grid grid-cols-1 items-end gap-2 sm:grid-cols-[1fr_auto_auto]">
              <div className="flex flex-col gap-2">
                <Label htmlFor="skill-name">Skill</Label>
                <Input
                  id="skill-name"
                  autoComplete="off"
                  placeholder="z. B. Kotlin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label id="project-skill-level-label">Level</Label>
                <div
                  role="radiogroup"
                  aria-labelledby="project-skill-level-label"
                  className="flex h-9 items-center gap-1"
                >
                  {[1, 2, 3, 4, 5].map((l) => (
                    <button
                      key={l}
                      type="button"
                      role="radio"
                      aria-checked={level === l}
                      aria-label={`Level ${l}`}
                      onClick={() => setLevel(l)}
                      className={cn(
                        'size-3 rounded-full transition-colors',
                        l <= level
                          ? 'bg-primary'
                          : 'bg-muted-foreground/30 hover:bg-muted-foreground/50',
                      )}
                    />
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Priorität</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Button
                size="sm"
                variant="outline"
                disabled={addSkillMutation.isPending || !name.trim()}
                onClick={onAdd}
              >
                <Plus className="size-4" aria-hidden />
                Hinzufügen
              </Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
