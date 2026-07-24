import { Link } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';
import type { UserSkillDto } from '@/api/generated/model';
import { Badge } from '@/components/ui/badge';
import { LevelDots } from '@/components/level-dots';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function MySkillsCard({
  skills,
  loading,
}: {
  skills?: UserSkillDto[];
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Deine Skills</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-16" />
            ))}
          </div>
        )}
        {skills && skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <Badge key={s.id} variant="secondary" className="gap-1.5">
                {s.name}
                {s.level != null && <LevelDots level={s.level} />}
              </Badge>
            ))}
          </div>
        )}
        {skills && skills.length === 0 && (
          <Link
            to="/skills"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Skills hinzufügen
            <ArrowRight className="size-3" aria-hidden />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
