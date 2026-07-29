import { create } from 'zustand';
import type { AppNotification } from '@/features/chat/chat-types';

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  bootstrapped: boolean;
  setInitial: (list: AppNotification[], unread: number) => void;
  addIncoming: (n: AppNotification) => void;
  markReadLocal: (id: string) => void;
  markAllReadLocal: () => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  notifications: [],
  unreadCount: 0,
  bootstrapped: false,

  setInitial: (list, unread) =>
    set({ notifications: list, unreadCount: unread, bootstrapped: true }),

  // delivery is at-least-once, so the same notification can arrive twice
  addIncoming: (n) =>
    set((s) =>
      s.notifications.some((x) => x.id === n.id)
        ? s
        : { notifications: [n, ...s.notifications], unreadCount: s.unreadCount + 1 },
    ),

  markReadLocal: (id) =>
    set((s) => {
      const target = s.notifications.find((n) => n.id === id);
      if (!target || target.readAt) return s;
      return {
        notifications: s.notifications.map((n) =>
          n.id === id ? { ...n, readAt: new Date().toISOString() } : n,
        ),
        unreadCount: Math.max(0, s.unreadCount - 1),
      };
    }),

  markAllReadLocal: () =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.readAt ? n : { ...n, readAt: new Date().toISOString() },
      ),
      unreadCount: 0,
    })),

  reset: () => set({ notifications: [], unreadCount: 0, bootstrapped: false }),
}));
