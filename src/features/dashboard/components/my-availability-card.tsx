import { Link } from '@tanstack/react-router';
import { ArrowRight, CalendarDays } from 'lucide-react';
import type { UserAvailabilityDto } from '@/api/generated/model';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';

export function MyAvailabilityCard({
  availability,
  loading,
}: {
  availability?: UserAvailabilityDto[];
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Verfügbarkeit</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {loading && <Skeleton className="h-10 w-full" />}
        {availability?.slice(0, 3).map((a) => (
          <div
            key={a.id}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <CalendarDays className="size-4 shrink-0" aria-hidden />
            <span className="tabular-nums">
              {formatDate(a.availableFrom)} – {formatDate(a.availableTo)}
            </span>
          </div>
        ))}
        {availability && availability.length === 0 && (
          <Link
            to="/availability"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Verfügbarkeit eintragen
            <ArrowRight className="size-3" aria-hidden />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
