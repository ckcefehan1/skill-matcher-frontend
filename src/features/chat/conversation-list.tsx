import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { partnerDisplayName, type Conversation } from '@/features/chat/chat-types';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/stores/chat-store';

interface Props {
  conversations: Conversation[] | undefined;
  loading: boolean;
  activeId: string | null;
  onSelect: (id: string) => void;
}

export function ConversationList({ conversations, loading, activeId, onSelect }: Props) {
  const presenceByUser = useChatStore((s) => s.presenceByUser);

  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (!conversations?.length) {
    return (
      <p className="p-4 text-sm text-muted-foreground">
        Noch keine Unterhaltungen. Starte eine neue über das Plus-Symbol.
      </p>
    );
  }

  const sorted = [...conversations].sort((a, b) =>
    (b.lastMessage?.sentAt ?? b.createdDate).localeCompare(a.lastMessage?.sentAt ?? a.createdDate),
  );

  return (
    <div className="flex-1 overflow-y-auto">
      {sorted.map((c) => {
        const online = presenceByUser[c.partner.id] ?? c.partner.online;
        const name = partnerDisplayName(c.partner);
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={cn(
              'flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-accent',
              activeId === c.id && 'bg-accent',
            )}
          >
            <span className="relative mt-1 shrink-0">
              <span className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-medium">
                {name.slice(0, 2).toUpperCase()}
              </span>
              <span
                className={cn(
                  'absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-card',
                  online ? 'bg-green-500' : 'bg-muted-foreground/40',
                )}
                aria-label={online ? 'online' : 'offline'}
              />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">{name}</span>
                {c.lastMessage && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(c.lastMessage.sentAt), {
                      addSuffix: true,
                      locale: de,
                    })}
                  </span>
                )}
              </span>
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-xs text-muted-foreground">
                  {c.lastMessage?.content ?? 'Noch keine Nachrichten'}
                </span>
                {c.unreadCount > 0 && (
                  <Badge variant="default" className="h-5 min-w-5 justify-center px-1.5 text-xs">
                    {c.unreadCount}
                  </Badge>
                )}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
