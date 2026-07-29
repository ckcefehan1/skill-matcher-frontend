import { Client } from '@stomp/stompjs';
import { toast } from 'sonner';
import { wsTicket } from '@/api/generated/endpoints/authentication/authentication';
import { getGetConversationsQueryKey } from '@/api/generated/endpoints/chat/chat';
import type { AppNotification, ChatMessage } from '@/features/chat/chat-types';
import { queryClient } from '@/lib/query-client';
import { useAuthStore } from '@/stores/auth-store';
import { useChatStore } from '@/stores/chat-store';
import { useNotificationStore } from '@/stores/notification-store';

interface TypingEvent {
  conversationId: string;
  userId: string;
}

interface ReadReceiptEvent {
  conversationId: string;
  readBy: string;
  readAt: string;
}

interface PresenceEvent {
  userId: string;
  online: boolean;
}

let client: Client | null = null;
let unsubscribeAuth: (() => void) | null = null;

const brokerUrl = () =>
  `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;

const subscribeAll = (c: Client) => {
  c.subscribe('/user/queue/messages', (frame) => {
    const msg = JSON.parse(frame.body) as ChatMessage;
    useChatStore.getState().upsertMessage(msg);
    // refresh conversation list (last message, unread badges)
    queryClient.invalidateQueries({ queryKey: getGetConversationsQueryKey() });
  });

  c.subscribe('/user/queue/typing', (frame) => {
    const t = JSON.parse(frame.body) as TypingEvent;
    useChatStore.getState().setTyping(t.conversationId, t.userId);
  });

  c.subscribe('/user/queue/read-receipts', (frame) => {
    const r = JSON.parse(frame.body) as ReadReceiptEvent;
    useChatStore.getState().applyReadReceipt(r.conversationId, r.readBy, r.readAt);
  });

  c.subscribe('/user/queue/presence', (frame) => {
    const p = JSON.parse(frame.body) as PresenceEvent;
    useChatStore.getState().setPresence(p.userId, p.online);
  });

  c.subscribe('/user/queue/notifications', (frame) => {
    const n = JSON.parse(frame.body) as AppNotification;
    useNotificationStore.getState().addIncoming(n);
    toast(n.title, { description: n.body });
  });

  c.subscribe('/user/queue/errors', (frame) => {
    console.warn('chat error frame', frame.body);
  });
};

export const connectStomp = () => {
  if (client) return;

  const c = new Client({
    brokerURL: brokerUrl(),
    reconnectDelay: 5000,
    // One-time ticket per (re)connect. Must not throw: a rejecting beforeConnect
    // leaves stompjs active without a socket, and it never retries from there.
    beforeConnect: async (stompClient) => {
      const ticket = await wsTicket()
        .then((r) => r.ticket ?? '')
        .catch(() => '');
      stompClient.connectHeaders = { ticket };
    },
    onConnect: () => subscribeAll(c),
    onStompError: (frame) => {
      console.warn('STOMP error', frame.headers['message']);
    },
  });
  client = c;
  // The axios interceptor clears the user once a refresh fails. Without this the
  // client would keep reconnecting against a dead session every reconnectDelay,
  // and each attempt fires another ws-ticket plus refresh request.
  unsubscribeAuth = useAuthStore.subscribe((state) => {
    if (!state.user) disconnectStomp();
  });
  c.activate();
};

export const disconnectStomp = () => {
  unsubscribeAuth?.();
  unsubscribeAuth = null;
  void client?.deactivate();
  client = null;
  useChatStore.getState().reset();
  useNotificationStore.getState().reset();
};

export const publishChat = (destination: string, body: unknown) => {
  if (!client?.connected) return;
  client.publish({ destination, body: JSON.stringify(body) });
};

export const isStompConnected = () => client?.connected ?? false;
