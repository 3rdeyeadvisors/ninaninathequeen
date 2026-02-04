import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
  name: string;
  email: string;
  avatar?: string;
  points?: number;
  referralCode?: string;
}

interface AuthUser extends User {
  password?: string;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  users: AuthUser[];
  login: (email: string, password: string) => boolean;
  signup: (name: string, email: string, password: string) => boolean;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

const DEFAULT_ADMIN: AuthUser = {
  name: 'Lydia',
  email: 'lydia@ninaarmend.co.site',
  password: 'nina-admin-2025',
  avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200',
  points: 0,
  referralCode: 'NINA-LYD-2025'
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      users: [DEFAULT_ADMIN],

      login: (email, password) => {
        /**
         * SECURITY NOTE: This is a mock implementation for demonstration.
         * In production, use a secure backend, password hashing, and token-based auth.
         */
        const { users } = get();
        const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (foundUser && foundUser.password === password) {
          const { password: _, ...userWithoutPassword } = foundUser;
          set({ user: userWithoutPassword, isAuthenticated: true });
          return true;
        }
        return false;
      },

      signup: (name, email, password) => {
        const { users } = get();
        if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
          return false;
        }

        const newUser: AuthUser = {
          name,
          email,
          password,
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
          points: 250, // Welcome points
          referralCode: `NINA-${name.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 1000)}`
        };

        set({ users: [...users, newUser] });

        // Log in the user automatically after signup
        const { password: _, ...userWithoutPassword } = newUser;
        set({ user: userWithoutPassword, isAuthenticated: true });
        return true;
      },

      logout: () => set({ user: null, isAuthenticated: false }),

      updateProfile: (updates) => set((state) => {
        if (!state.user) return state;
        const updatedUser = { ...state.user, ...updates };
        const updatedUsers = state.users.map(u =>
          u.email.toLowerCase() === state.user?.email.toLowerCase() ? { ...u, ...updates } : u
        );
        return { user: updatedUser, users: updatedUsers };
      }),
    }),
    {
      name: 'nina-armend-auth-v3',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
