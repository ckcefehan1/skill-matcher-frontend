import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useMySkills } from './use-my-skills';
import { useSkillCatalog } from './use-skill-catalog';
import { Badge } from '@/components/ui/badge';
import { LevelDots } from '@/components/level-dots';
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
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function SkillsPage() {
  const { skills, isLoading, addMutation, deleteMutation } = useMySkills();
  const { skills: catalog } = useSkillCatalog();

  const [name, setName] = useState('');
  const [level, setLevel] = useState(3);
  const [error, setError] = useState<string | null>(null);

  const onAdd = () => {
    if (!name.trim()) return;
    setError(null);
    addMutation.mutate(
      { data: { name: name.trim(), level } },
      {
        onSuccess: () => setName(''),
        onError: () => setError('Skill konnte nicht gespeichert werden.'),
      },
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Deine Skills</h1>
        <p className="text-sm text-muted-foreground">
          Pflege deine Skills — sie bestimmen deine Projekt-Matches.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Skills verwalten</CardTitle>
          <CardDescription>
            Level 1 (Grundlagen) bis 5 (Experte). Ein bestehender Skill wird
            aktualisiert.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {isLoading && <Skeleton className="h-8 w-full" />}
          {skills && skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <Badge key={s.id} variant="secondary" className="gap-1.5">
                  {s.name}
                  {s.level != null && <LevelDots level={s.level} />}
                  <button
                    type="button"
                    aria-label={`${s.name} entfernen`}
                    className="ml-0.5 rounded-full opacity-60 hover:opacity-100"
                    onClick={() => deleteMutation.mutate({ id: s.id ?? '' })}
                  >
                    <X className="size-3" aria-hidden />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          {skills && skills.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Noch keine Skills angelegt.
            </p>
          )}

          <div className="flex flex-col gap-3 border-t pt-4">
            <div className="grid grid-cols-[1fr_auto] items-end gap-2 sm:grid-cols-[1fr_auto_auto]">
              <div className="flex flex-col gap-2">
                <Label htmlFor="skill-name">Skill</Label>
                <Input
                  id="skill-name"
                  autoComplete="off"
                  list="skill-catalog"
                  placeholder="z. B. Kotlin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <datalist id="skill-catalog">
                  {catalog?.map((s) => (
                    <option key={s.id} value={s.name} />
                  ))}
                </datalist>
              </div>
              <div className="flex flex-col gap-2">
                <Label id="skill-level-label">Level</Label>
                <div
                  role="radiogroup"
                  aria-labelledby="skill-level-label"
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
              <Button
                size="sm"
                variant="outline"
                className="col-span-2 sm:col-span-1"
                disabled={addMutation.isPending || !name.trim()}
                onClick={onAdd}
              >
                <Plus className="size-4" aria-hidden />
                Hinzufügen
              </Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
