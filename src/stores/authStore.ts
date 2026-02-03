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
  login: (email: string, password: string, name?: string) => boolean;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (email, password, name = 'Valued Customer') => {
        /**
         * SECURITY NOTE: This is a mock implementation for demonstration purposes.
         * In a production environment:
         * 1. Never hardcode credentials in the frontend.
         * 2. Send credentials to a secure backend via HTTPS.
         * 3. Use industry-standard authentication (e.g., JWT, OAuth, or sessions).
         * 4. Implement proper password hashing on the server (e.g., bcrypt).
         */

        const ADMIN_EMAIL = 'lydia@ninaarmend.co.site';
        // For demonstration, we use a mock password for the admin account.
        const MOCK_ADMIN_PASSWORD = 'nina-admin-2025';

        if (email === ADMIN_EMAIL && password !== MOCK_ADMIN_PASSWORD) {
          console.error('[Auth] Unauthorized admin login attempt');
          return false;
        }

        // Basic validation for the demo
        if (!password || password.length < 4) {
          return false;
        }

        const user: User = {
          email,
          name,
          avatar: email === ADMIN_EMAIL
            ? 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200'
            : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
          points: email === ADMIN_EMAIL ? 0 : 250,
          referralCode: `NINA-${name.substring(0, 3).toUpperCase()}-2025`
        };

        set({ user, isAuthenticated: true });
        return true;
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
