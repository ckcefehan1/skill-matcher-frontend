import { cn } from '@/lib/utils';

export function LevelDots({ level }: { level: number }) {
  return (
    <span
      className="inline-flex items-center gap-0.5"
      role="img"
      aria-label={`Level ${level} von 5`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          aria-hidden
          className={cn(
            'size-1.5 rounded-full',
            i < level ? 'bg-primary' : 'bg-muted-foreground/30',
          )}
        />
      ))}
    </span>
  );
}
