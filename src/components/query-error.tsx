import { Button } from '@/components/ui/button';

export function QueryError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center justify-center gap-3 py-4">
      <p className="text-sm text-muted-foreground">Fehler beim Laden.</p>
      <Button variant="ghost" size="sm" onClick={onRetry}>
        Erneut versuchen
      </Button>
    </div>
  );
}
