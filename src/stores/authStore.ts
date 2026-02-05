import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { hashPassword } from '@/lib/security';

export interface User {
  name: string;
  email: string;
  avatar?: string;
  points?: number;
  referralCode?: string;
  role?: string;
}

interface AuthUser extends User {
  password?: string;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  users: AuthUser[];
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  resetPassword: (email: string) => boolean;
  deleteAccount: (email: string) => boolean;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

/**
 * SECURITY NOTE: The admin email is managed via environment variables.
 * In production, admin privileges should be managed via backend roles and verified with tokens.
 */
export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || '';

const DEFAULT_ADMIN: AuthUser = {
  name: 'Lydia',
  email: ADMIN_EMAIL,
  password: '1028fa031c3f91f18519a2a997a00579efcdcf64b3b4a96ac65143e30811ca43',
  avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200',
  points: 0,
  referralCode: 'NINA-LYD-2025',
  role: 'Founder & Owner'
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      users: [DEFAULT_ADMIN],

      login: async (email, password) => {
        /**
         * SECURITY NOTE: This is a mock implementation for demonstration.
         * In production, NEVER store plain text passwords in the frontend or localStorage.
         * Use a secure backend, industry-standard password hashing (like Argon2 or bcrypt),
         * and secure token-based authentication (JWT/OAuth).
         */
        const { users } = get();
        const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (foundUser) {
          const hashedInput = await hashPassword(password);
          if (foundUser.password === hashedInput) {
            const { password: _, ...userWithoutPassword } = foundUser;
            // Normalize email to lowercase in the session user object
            const normalizedUser = { ...userWithoutPassword, email: foundUser.email.toLowerCase() };
            set({ user: normalizedUser, isAuthenticated: true });
            return true;
          }
        }
        return false;
      },

      signup: async (name, email, password) => {
        const { users } = get();
        if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
          return false;
        }

        const hashedPassword = await hashPassword(password);
        const newUser: AuthUser = {
          name,
          email: email.toLowerCase(),
          password: hashedPassword,
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

      resetPassword: (email) => {
        const { users } = get();
        const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (foundUser) {
          /**
           * MOCK IMPLEMENTATION: In a real app, this would send an email.
           * For this demo, we'll just return true to simulate success.
           */
          console.log(`Password reset requested for: ${email}`);
          return true;
        }
        return false;
      },

      deleteAccount: (email) => {
        const { users, user } = get();
        const updatedUsers = users.filter(u => u.email.toLowerCase() !== email.toLowerCase());

        if (updatedUsers.length < users.length) {
          // If the deleted user was the currently logged in user, log them out
          if (user?.email.toLowerCase() === email.toLowerCase()) {
            set({ user: null, isAuthenticated: false, users: updatedUsers });
          } else {
            set({ users: updatedUsers });
          }
          return true;
        }
        return false;
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
      name: 'nina-armend-auth-v4',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
