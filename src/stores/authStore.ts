import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { hashPassword } from '@/lib/security';
import { useAdminStore } from './adminStore';

/**
 * @deprecated This auth store is DEPRECATED and kept only for backward compatibility.
 * Use useCloudAuthStore from '@/stores/cloudAuthStore' for all new authentication.
 * 
 * SECURITY WARNING: This store previously stored password hashes in localStorage,
 * which is a security risk. Password storage has been removed.
 */

export interface User {
  name: string;
  email: string;
  avatar?: string;
  points?: number;
  referralCode?: string;
  role?: string;
  preferredSize?: string;
}

// AuthUser no longer includes password - passwords are NOT stored client-side
interface AuthUser extends User {
  // Password field removed for security - use Cloud Auth instead
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  users: AuthUser[];
  /** @deprecated Use cloudAuthStore.signInWithEmail instead */
  login: (email: string, password: string) => Promise<boolean>;
  /** @deprecated Use cloudAuthStore.signUpWithEmail instead */
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  resetPassword: (email: string) => boolean;
  deleteAccount: (email: string) => boolean;
  /** @deprecated Use cloudAuthStore.signOut instead */
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  updateUserRole: (email: string, role: string) => void;
  addUser: (user: AuthUser) => void;
}

/**
 * SECURITY NOTE: The owner/admin email for Lydia.
 * Admin privileges are now managed via database roles (user_roles table).
 * This constant is kept for UI display purposes only.
 */
export const ADMIN_EMAIL = 'lydia@ninaarmend.co.site';

const DEFAULT_ADMIN: AuthUser = {
  name: 'Lydia',
  email: ADMIN_EMAIL,
  // Password removed - authentication handled by Cloud Auth
  avatar: undefined,
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
         * @deprecated This login method is deprecated.
         * Use useCloudAuthStore().signInWithEmail() for secure authentication.
         */
        console.warn(
          '[DEPRECATED] useAuthStore.login() is deprecated. ' +
          'Use useCloudAuthStore().signInWithEmail() for secure authentication.'
        );
        
        // Legacy login is disabled for security
        // All authentication should go through Cloud Auth (Supabase)
        return false;
      },

      signup: async (name, email, password) => {
        /**
         * @deprecated This signup method is deprecated.
         * Use useCloudAuthStore().signUpWithEmail() for secure authentication.
         */
        console.warn(
          '[DEPRECATED] useAuthStore.signup() is deprecated. ' +
          'Use useCloudAuthStore().signUpWithEmail() for secure authentication.'
        );
        
        // Legacy signup is disabled for security
        // All authentication should go through Cloud Auth (Supabase)
        return false;
      },

      resetPassword: (email) => {
        console.warn(
          '[DEPRECATED] useAuthStore.resetPassword() is deprecated. ' +
          'Use Supabase password reset functionality.'
        );
        return false;
      },

      deleteAccount: (email) => {
        const { users, user } = get();
        const trimmedEmail = email.trim();
        const updatedUsers = users.filter(u => u.email.toLowerCase() !== trimmedEmail.toLowerCase());

        if (updatedUsers.length < users.length) {
          if (user?.email.toLowerCase() === trimmedEmail.toLowerCase()) {
            set({ user: null, isAuthenticated: false, users: updatedUsers });
          } else {
            set({ users: updatedUsers });
          }
          return true;
        }
        return false;
      },

      logout: () => {
        console.warn(
          '[DEPRECATED] useAuthStore.logout() is deprecated. ' +
          'Use useCloudAuthStore().signOut() instead.'
        );
        set({ user: null, isAuthenticated: false });
      },

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
      name: 'nina-armend-auth-v6', // Bumped version to trigger migration
      storage: createJSONStorage(() => localStorage),
      // Migration to strip any existing password data from localStorage
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as { users?: Array<{ password?: string }> };
        if (state?.users) {
          // Remove password field from all stored users
          state.users = state.users.map(({ password, ...user }) => user);
        }
        return state as AuthStore;
      },
      version: 1,
    }
  )
);
