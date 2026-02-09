import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabaseClient';
import { useAuthStore } from './authStore';

export interface CloudAuthUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  isAdmin: boolean;
  preferredSize?: string;
  points?: number;
}

interface CloudAuthState {
  user: CloudAuthUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  checkIsAdmin: (userId: string) => Promise<boolean>;
}

export const useCloudAuthStore = create<CloudAuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  isInitialized: false,

  initialize: async () => {
    if (get().isInitialized) return;

    try {
      const supabase = getSupabase();
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      const handleUserSession = async (session: Session | null) => {
        if (session?.user) {
          const isAdmin = await get().checkIsAdmin(session.user.id);

          // Fetch additional profile data
          const { data: profile } = await supabase
            .from('profiles')
            .select('preferred_size, points')
            .eq('id', session.user.id)
            .single();

          const userData: CloudAuthUser = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
            avatar: session.user.user_metadata?.avatar_url,
            isAdmin,
            preferredSize: profile?.preferred_size,
            points: profile?.points || 0,
          };

          set({
            session,
            user: userData,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
          });

          // Sync with legacy auth store for backward compatibility
          useAuthStore.setState({
            user: {
              name: userData.name || '',
              email: userData.email,
              avatar: userData.avatar,
              points: userData.points,
              role: userData.isAdmin ? 'Admin' : 'User',
              preferredSize: userData.preferredSize,
            },
            isAuthenticated: true,
          });
        } else {
          set({
            session: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
          });

          // Clear legacy auth store
          useAuthStore.setState({ user: null, isAuthenticated: false });
        }
      };

      await handleUserSession(session);

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        await handleUserSession(session);
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ isLoading: false, isInitialized: true });
    }
  },

  checkIsAdmin: async (userId: string) => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .rpc('has_role', { _user_id: userId, _role: 'admin' });
      
      if (error) {
        console.error('Error checking admin role:', error);
        return false;
      }
      
      return data === true;
    } catch {
      return false;
    }
  },

  signInWithEmail: async (email: string, password: string) => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        return { error };
      }
      
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  },

  signUpWithEmail: async (email: string, password: string, name?: string) => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });
      
      if (error) {
        return { error };
      }
      
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  },

  signOut: async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    set({
      user: null,
      session: null,
      isAuthenticated: false,
    });
  },
}));
