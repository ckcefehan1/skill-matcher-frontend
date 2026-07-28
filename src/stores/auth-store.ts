import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { queryClient } from '@/lib/query-client';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'PROJECTMANAGER' | 'EMPLOYER';
}

interface AuthState {
  user: User | null;
  setUser: (user: User) => void;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,

      setUser: (user) =>
        set({ user }),

      login: (user) => {
        // Identitätswechsel: gecachte Daten des vorherigen Users verwerfen
        queryClient.clear();
        set({ user });
      },

      logout: () => {
        queryClient.clear();
        set({ user: null });
      },
    }),
    {
      name: 'auth-storage',
      // v1: tokens moved to httpOnly cookies — drop persisted tokens from v0
      version: 1,
    },
  ),
);
