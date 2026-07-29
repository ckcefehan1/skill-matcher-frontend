import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MessageSquarePlus } from 'lucide-react';
import {
  getGetConversationsQueryKey,
  useGetConversations,
} from '@/api/generated/endpoints/chat/chat';
import type { Conversation } from '@/features/chat/chat-types';
import { Button } from '@/components/ui/button';
import { ConversationList } from '@/features/chat/conversation-list';
import { MessagePane } from '@/features/chat/message-pane';
import { NewConversationDialog } from '@/features/chat/new-conversation-dialog';
import { cn } from '@/lib/utils';

export function ChatPage() {
  const queryClient = useQueryClient();
  const conversationsQuery = useGetConversations();
  // ponytail: orval typed list GETs as Blob — backend returns a list. Regenerate orval with fixed spec to remove cast.
  const conversations = conversationsQuery.data as unknown as Conversation[] | undefined;

  const [activeId, setActiveId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const active = conversations?.find((c) => c.id === activeId) ?? null;

  const onConversationCreated = (conversation: Conversation) => {
    queryClient.invalidateQueries({ queryKey: getGetConversationsQueryKey() });
    setActiveId(conversation.id);
    setDialogOpen(false);
  };

  return (
    <div className="flex h-[calc(100dvh-7.5rem)] gap-0 overflow-hidden rounded-lg border md:h-[calc(100dvh-5rem)]">
      <aside
        className={cn(
          'w-full shrink-0 flex-col border-r sm:flex sm:w-72 md:w-80',
          active ? 'hidden' : 'flex',
        )}
      >
        <div className="flex h-14 items-center justify-between border-b px-4">
          <h1 className="text-lg font-medium tracking-tight">Nachrichten</h1>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Neue Unterhaltung"
            onClick={() => setDialogOpen(true)}
          >
            <MessageSquarePlus className="size-5" aria-hidden />
          </Button>
        </div>
        <ConversationList
          conversations={conversations}
          loading={conversationsQuery.isLoading}
          activeId={activeId}
          onSelect={setActiveId}
        />
      </aside>

      <section
        className={cn('min-w-0 flex-1 flex-col sm:flex', active ? 'flex' : 'hidden')}
      >
        {active ? (
          <MessagePane
            key={active.id}
            conversation={active}
            onBack={() => setActiveId(null)}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Wähle eine Unterhaltung oder starte eine neue.
          </div>
        )}
      </section>

      <NewConversationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={onConversationCreated}
      />
    </div>
  );
}
