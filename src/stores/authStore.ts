import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
  name: string;
  email: string;
  avatar?: string;
  points?: number;
  referralCode?: string;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, name?: string) => void;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (email, name = 'Valued Customer') => {
        const user: User = {
          email,
          name,
          avatar: email === 'lydia@ninaarmend.co.site'
            ? 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200'
            : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
          points: 0,
          referralCode: `NINA-${name.substring(0, 3).toUpperCase()}-2025`
        };
        set({ user, isAuthenticated: true });
      },
      logout: () => set({ user: null, isAuthenticated: false }),
      updateProfile: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null
      })),
    }),
    {
      name: 'nina-armend-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
