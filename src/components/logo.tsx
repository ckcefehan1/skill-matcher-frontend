import { cn } from '@/lib/utils';

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M5.2 7.6c2.2 1.8 2.2 7 0 8.8" />
      <path d="M18.8 7.6c-2.2 1.8-2.2 7 0 8.8" />
    </svg>
  );
}

export function Logo({
  iconOnly = false,
  className,
}: {
  iconOnly?: boolean;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark className="size-5 shrink-0 text-primary" />
      {!iconOnly && (
        <span className="truncate text-sm font-medium tracking-tight text-foreground">
          matchpoint
        </span>
      )}
    </span>
  );
}
