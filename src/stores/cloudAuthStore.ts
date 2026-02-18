import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabaseClient';

export interface CloudAuthUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  isAdmin: boolean;
  preferredSize?: string;
  points?: number;
  referralCode?: string;
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
    // Note: We removed the isInitialized guard to allow refresh cycles
    // but we should still prevent multiple simultaneous initializations
    if (get().isLoading && get().isInitialized) return;

    set({ isLoading: true });

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
            .select('preferred_size, points, referral_code')
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
            referralCode: profile?.referral_code,
          };

          set({
            session,
            user: userData,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
          });
        } else {
          set({
            session: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
          });
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
      // Check for stored referral code
      const referralCode = typeof window !== 'undefined' ? localStorage.getItem('referral_code') : null;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            ...(referralCode ? { referral_code: referralCode } : {}),
          },
        },
      });
      
      if (error) {
        return { error };
      }
      
      // Clear referral code after successful signup
      if (referralCode) {
        localStorage.removeItem('referral_code');
      }

      // Send welcome email (fire-and-forget)
      try {
        const supabase = getSupabase();
        const displayName = name || email.split('@')[0];
        supabase.functions.invoke('send-email', {
          body: {
            type: 'welcome',
            data: {
              email,
              name: displayName,
            },
          },
        }).catch(err => console.error('Welcome email failed:', err));
      } catch (e) {
        console.error('Welcome email invoke error:', e);
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
