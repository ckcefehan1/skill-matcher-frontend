import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const TONES = {
  primary: 'bg-primary/10 text-primary',
  blue: 'bg-blue-500/10 text-blue-600',
  amber: 'bg-amber-500/10 text-amber-600',
  violet: 'bg-violet-500/10 text-violet-600',
} as const;

export function StatCard({
  icon: Icon,
  label,
  value,
  loading,
  tone = 'primary',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  loading: boolean;
  tone?: keyof typeof TONES;
}) {
  return (
    <Card className="transition-colors hover:border-primary/40">
      <CardContent className="flex items-center gap-4 py-4">
        <div
          className={`flex size-10 items-center justify-center rounded-xl ${TONES[tone]}`}
        >
          <Icon className="size-5" aria-hidden />
        </div>
        <div className="flex flex-col">
          {loading ? (
            <Skeleton className="h-7 w-12" />
          ) : (
            <span className="text-2xl font-medium tabular-nums tracking-tight">
              {value}
            </span>
          )}
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      </CardContent>
    </Card>
  );
}
