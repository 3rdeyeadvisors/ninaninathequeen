import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { hashPassword } from '@/lib/security';
import { useAdminStore } from './adminStore';

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
  updateUserRole: (email: string, role: string) => void;
  addUser: (user: AuthUser) => void;
}

/**
 * SECURITY NOTE: The owner/admin email for Lydia.
 * In production, admin privileges should be managed via backend roles.
 */
export const ADMIN_EMAIL = 'lydia@ninaarmend.co.site';

const DEFAULT_ADMIN: AuthUser = {
  name: 'Lydia',
  email: ADMIN_EMAIL,
  password: '1028fa031c3f91f18519a2a997a00579efcdcf64b3b4a96ac65143e30811ca43', // Hash of "Bossqueen26!"
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
        const trimmedEmail = email.trim();
        const foundUser = users.find(u => u.email.toLowerCase() === trimmedEmail.toLowerCase());

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
        const trimmedEmail = email.trim();
        if (users.find(u => u.email.toLowerCase() === trimmedEmail.toLowerCase())) {
          return false;
        }

        const hashedPassword = await hashPassword(password);
        const newUser: AuthUser = {
          name,
          email: trimmedEmail.toLowerCase(),
          password: hashedPassword,
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
          points: 250, // Welcome points
          referralCode: `NINA-${name.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 1000)}`
        };

        set({ users: [...users, newUser] });

        // Add to Admin Customer Audience
        useAdminStore.getState().addCustomer({
          id: `cust-${Date.now()}`,
          name: newUser.name,
          email: newUser.email,
          totalSpent: '0.00',
          orderCount: 0,
          joinDate: new Date().toISOString().split('T')[0]
        });

        // Log in the user automatically after signup
        const { password: _, ...userWithoutPassword } = newUser;
        set({ user: userWithoutPassword, isAuthenticated: true });
        return true;
      },

      resetPassword: (email) => {
        const { users } = get();
        const trimmedEmail = email.trim();
        const foundUser = users.find(u => u.email.toLowerCase() === trimmedEmail.toLowerCase());

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
        const trimmedEmail = email.trim();
        const updatedUsers = users.filter(u => u.email.toLowerCase() !== trimmedEmail.toLowerCase());

        if (updatedUsers.length < users.length) {
          // If the deleted user was the currently logged in user, log them out
          if (user?.email.toLowerCase() === trimmedEmail.toLowerCase()) {
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

      updateUserRole: (email, role) => set((state) => {
        const updatedUsers = state.users.map(u =>
          u.email.toLowerCase() === email.toLowerCase() ? { ...u, role } : u
        );

        // Also update the current user if they are the one being changed
        const updatedUser = state.user?.email.toLowerCase() === email.toLowerCase()
          ? { ...state.user, role }
          : state.user;

        return { users: updatedUsers, user: updatedUser };
      }),

      addUser: (newUser) => set((state) => {
        if (state.users.find(u => u.email.toLowerCase() === newUser.email.toLowerCase())) {
          return state;
        }
        return { users: [...state.users, newUser] };
      }),
    }),
    {
      name: 'nina-armend-auth-v5',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
