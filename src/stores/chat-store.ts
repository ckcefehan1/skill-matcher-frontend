import { create } from 'zustand';
import type { ChatMessage } from '@/features/chat/chat-types';

const sortBySentAt = (msgs: ChatMessage[]) =>
  [...msgs].sort((a, b) => a.sentAt.localeCompare(b.sentAt));

const dedup = (msgs: ChatMessage[]) => {
  const seen = new Set<string>();
  return msgs.filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
};

// typing timeouts live outside the store — they are timers, not state
const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();

interface ChatState {
  messagesByConversation: Record<string, ChatMessage[]>;
  typingByConversation: Record<string, string>;
  presenceByUser: Record<string, boolean>;
  upsertMessage: (msg: ChatMessage) => void;
  setMessages: (conversationId: string, msgs: ChatMessage[]) => void;
  prependMessages: (conversationId: string, msgs: ChatMessage[]) => void;
  setTyping: (conversationId: string, userId: string) => void;
  applyReadReceipt: (conversationId: string, readBy: string, readAt: string) => void;
  setPresence: (userId: string, online: boolean) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>()((set) => ({
  messagesByConversation: {},
  typingByConversation: {},
  presenceByUser: {},

  upsertMessage: (msg) =>
    set((s) => ({
      messagesByConversation: {
        ...s.messagesByConversation,
        [msg.conversationId]: sortBySentAt(
          dedup([...(s.messagesByConversation[msg.conversationId] ?? []), msg]),
        ),
      },
    })),

  setMessages: (conversationId, msgs) =>
    set((s) => ({
      messagesByConversation: {
        ...s.messagesByConversation,
        [conversationId]: sortBySentAt(dedup(msgs)),
      },
    })),

  prependMessages: (conversationId, msgs) =>
    set((s) => ({
      messagesByConversation: {
        ...s.messagesByConversation,
        [conversationId]: sortBySentAt(
          dedup([...msgs, ...(s.messagesByConversation[conversationId] ?? [])]),
        ),
      },
    })),

  setTyping: (conversationId, userId) => {
    const existing = typingTimers.get(conversationId);
    if (existing) clearTimeout(existing);
    typingTimers.set(
      conversationId,
      setTimeout(() => {
        typingTimers.delete(conversationId);
        useChatStore.setState((s) => {
          const next = { ...s.typingByConversation };
          delete next[conversationId];
          return { typingByConversation: next };
        });
      }, 3000),
    );
    set((s) => ({
      typingByConversation: { ...s.typingByConversation, [conversationId]: userId },
    }));
  },

  applyReadReceipt: (conversationId, readBy, readAt) =>
    set((s) => ({
      messagesByConversation: {
        ...s.messagesByConversation,
        [conversationId]: (s.messagesByConversation[conversationId] ?? []).map((m) =>
          m.senderId !== readBy && !m.readAt ? { ...m, readAt } : m,
        ),
      },
    })),

  setPresence: (userId, online) =>
    set((s) => ({ presenceByUser: { ...s.presenceByUser, [userId]: online } })),

  reset: () => {
    typingTimers.forEach(clearTimeout);
    typingTimers.clear();
    set({ messagesByConversation: {}, typingByConversation: {}, presenceByUser: {} });
  },
}));
