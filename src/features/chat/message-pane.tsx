import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowUp, Check, CheckCheck } from 'lucide-react';
import {
  getGetConversationsQueryKey,
  getMessages,
  useGetMessages,
} from '@/api/generated/endpoints/chat/chat';
import { partnerDisplayName, type ChatMessage, type Conversation } from '@/features/chat/chat-types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { publishChat } from '@/lib/stomp-client';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useChatStore } from '@/stores/chat-store';

const PAGE_SIZE = 30;

interface Props {
  conversation: Conversation;
  onBack: () => void;
}

export function MessagePane({ conversation, onBack }: Props) {
  const queryClient = useQueryClient();
  const myId = useAuthStore((s) => s.user?.id);
  const messages = useChatStore((s) => s.messagesByConversation[conversation.id]);
  const setMessages = useChatStore((s) => s.setMessages);
  const prependMessages = useChatStore((s) => s.prependMessages);
  const typingUserId = useChatStore((s) => s.typingByConversation[conversation.id]);
  const online = useChatStore(
    (s) => s.presenceByUser[conversation.partner.id] ?? conversation.partner.online,
  );

  const [draft, setDraft] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastTypingSent = useRef(0);

  const historyQuery = useGetMessages(conversation.id, { limit: PAGE_SIZE });

  // seed store from REST history
  useEffect(() => {
    if (historyQuery.data) {
      // ponytail: orval typed list GETs as Blob — backend returns a list. Regenerate orval with fixed spec to remove cast.
      const history = historyQuery.data as unknown as ChatMessage[];
      setMessages(conversation.id, history);
      setHasMore(history.length >= PAGE_SIZE);
    }
  }, [historyQuery.data, conversation.id, setMessages]);

  // mark incoming messages read while the pane is open
  const lastMessage = messages?.[messages.length - 1];
  useEffect(() => {
    if (!lastMessage) return;
    publishChat('/app/chat.read', { conversationId: conversation.id });
    queryClient.invalidateQueries({ queryKey: getGetConversationsQueryKey() });
  }, [lastMessage, conversation.id, queryClient]);

  // scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages?.length, typingUserId]);

  const loadOlder = async () => {
    const oldest = messages?.[0];
    if (!oldest || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const older = (await getMessages(conversation.id, {
        before: oldest.sentAt,
        limit: PAGE_SIZE,
      })) as unknown as ChatMessage[];
      prependMessages(conversation.id, older);
      setHasMore(older.length >= PAGE_SIZE);
    } finally {
      setLoadingOlder(false);
    }
  };

  const send = () => {
    const content = draft.trim();
    if (!content) return;
    publishChat('/app/chat.send', { conversationId: conversation.id, content });
    setDraft('');
  };

  const onDraftChange = (value: string) => {
    setDraft(value);
    const now = Date.now();
    if (now - lastTypingSent.current > 2000) {
      lastTypingSent.current = now;
      publishChat('/app/chat.typing', { conversationId: conversation.id });
    }
  };

  const partnerName = partnerDisplayName(conversation.partner);
  const lastOwnRead = [...(messages ?? [])]
    .reverse()
    .find((m) => m.senderId === myId && m.readAt);

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
        <Button
          variant="ghost"
          size="icon"
          className="-ml-2 sm:hidden"
          onClick={onBack}
          aria-label="Zurück zur Übersicht"
        >
          <ArrowLeft className="size-4" aria-hidden />
        </Button>
        <span
          className={cn(
            'size-2.5 rounded-full',
            online ? 'bg-green-500' : 'bg-muted-foreground/40',
          )}
          aria-label={online ? 'online' : 'offline'}
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{partnerName}</p>
          {typingUserId && <p className="text-xs text-muted-foreground">schreibt…</p>}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {hasMore && (messages?.length ?? 0) > 0 && (
          <div className="mb-3 text-center">
            <Button variant="ghost" size="sm" onClick={loadOlder} disabled={loadingOlder}>
              {loadingOlder ? 'Lädt…' : 'Ältere Nachrichten laden'}
            </Button>
          </div>
        )}
        <div className="flex flex-col gap-2">
          {(messages ?? []).map((m) => {
            const own = m.senderId === myId;
            return (
              <div key={m.id} className={cn('flex', own ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[75%] rounded-2xl px-3 py-2 text-sm',
                    own ? 'bg-primary text-primary-foreground' : 'bg-muted',
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  <p
                    className={cn(
                      'mt-0.5 flex items-center justify-end gap-1 text-[10px]',
                      own ? 'text-primary-foreground/70' : 'text-muted-foreground',
                    )}
                  >
                    {new Date(m.sentAt).toLocaleTimeString('de-DE', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {own &&
                      (m.readAt ? (
                        <CheckCheck className="size-3" aria-label="Gelesen" />
                      ) : (
                        <Check className="size-3" aria-label="Gesendet" />
                      ))}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        {lastOwnRead?.readAt && (
          <p className="mt-1 text-right text-[10px] text-muted-foreground">
            Gelesen{' '}
            {new Date(lastOwnRead.readAt).toLocaleTimeString('de-DE', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      <footer className="flex shrink-0 items-end gap-2 border-t p-3">
        <Textarea
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Nachricht schreiben…"
          rows={1}
          className="max-h-32 min-h-9 resize-none"
          aria-label="Nachricht schreiben"
        />
        <Button size="icon" onClick={send} disabled={!draft.trim()} aria-label="Senden">
          <ArrowUp className="size-4" aria-hidden />
        </Button>
      </footer>
    </>
  );
}
