import { useState } from 'react';
import {
  useCreateConversation,
  useSearchChatPartners,
} from '@/api/generated/endpoints/chat/chat';
import type { ChatUserResponse } from '@/api/generated/model';
import type { Conversation } from '@/features/chat/chat-types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (conversation: Conversation) => void;
}

export function NewConversationDialog({ open, onOpenChange, onCreated }: Props) {
  const [query, setQuery] = useState('');
  const searchQuery = useSearchChatPartners(
    { q: query, limit: 10 },
    { query: { enabled: query.trim().length >= 2 } },
  );
  // ponytail: orval typed list GETs as Blob — backend returns a list. Regenerate orval with fixed spec to remove cast.
  const results = searchQuery.data as unknown as ChatUserResponse[] | undefined;

  const createMutation = useCreateConversation();

  const start = (userId: string) => {
    createMutation.mutate(
      { data: { userId } },
      {
        onSuccess: (conversation) => {
          onCreated(conversation as unknown as Conversation);
          setQuery('');
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neue Unterhaltung</DialogTitle>
          <DialogDescription>Suche nach einem Benutzer, um eine Unterhaltung zu starten.</DialogDescription>
        </DialogHeader>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Vor- oder Nachname…"
          aria-label="Benutzer suchen"
          autoFocus
        />
        <div className="flex max-h-72 flex-col gap-1 overflow-y-auto">
          {query.trim().length >= 2 && results?.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">Keine Treffer.</p>
          )}
          {results?.map((u) => {
            const name = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || 'Unbekannt';
            return (
              <div
                key={u.id}
                className="flex items-center justify-between gap-2 rounded-md px-2 py-2 hover:bg-accent"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={u.online ? 'size-2 shrink-0 rounded-full bg-green-500' : 'size-2 shrink-0 rounded-full bg-muted-foreground/40'}
                    aria-label={u.online ? 'online' : 'offline'}
                  />
                  <p className="truncate text-sm font-medium">{name}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={createMutation.isPending}
                  onClick={() => u.id && start(u.id)}
                >
                  Chat
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
