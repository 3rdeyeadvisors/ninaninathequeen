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
  birthMonth?: number;
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
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<{ error: any | null, data?: any }>;
  signOut: () => Promise<void>;
  checkIsAdmin: (userId: string) => Promise<boolean>;
}

let authSubscription: { unsubscribe: () => void } | null = null;

export const useCloudAuthStore = create<CloudAuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  isInitialized: false,

  initialize: async () => {
    if (get().isInitialized) return;

    set({ isLoading: true });

    try {
      const supabase = getSupabase();
      
      const { data: { user: initialUser } } = await supabase.auth.getUser();
      
      const handleUserSession = async (session: Session | null) => {
        const authUser = session?.user ?? null;
        if (authUser) {
          const isAdmin = await get().checkIsAdmin(authUser.id);

          const { data: profile } = await supabase
            .from('profiles')
            .select('preferred_size, birth_month, points, referral_code')
            .eq('id', authUser.id)
            .single();

          const userData: CloudAuthUser = {
            id: authUser.id,
            email: authUser.email || '',
            name: authUser.user_metadata?.name || authUser.email?.split('@')[0],
            avatar: authUser.user_metadata?.avatar_url,
            isAdmin,
            preferredSize: profile?.preferred_size,
            birthMonth: profile?.birth_month,
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

      await handleUserSession(initialUser ? { user: initialUser } as Session : null);

      // Listen for auth changes
      if (authSubscription) {
        authSubscription.unsubscribe();
      }

      authSubscription = supabase.auth.onAuthStateChange(async (event, session) => {
        await handleUserSession(session);
      }).data.subscription;
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
      
      const { data, error } = await supabase.auth.signUp({
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
        return { error, data };
      }
      
      // Clear referral code after successful signup
      if (referralCode) {
        localStorage.removeItem('referral_code');
      }

      // Send referral-success email to the referrer (fire-and-forget)
      if (referralCode && data?.user?.id) {
        try {
          const { data: referrerEmail } = await supabase.rpc('get_referrer_email', { code: referralCode });
          if (referrerEmail) {
            supabase.functions.invoke('send-transactional-email', {
              body: {
                templateName: 'referral-success',
                recipientEmail: referrerEmail,
                idempotencyKey: `referral-success-${data.user.id}`,
                templateData: {
                  referrerName: '',
                  referredName: name || email.split('@')[0],
                  pointsAwarded: 25,
                },
              },
            }).catch(err => console.error('Referral email failed:', err));
          }
        } catch (e) {
          console.error('Referral email lookup error:', e);
        }
      }

      // Send welcome email (fire-and-forget)
      try {
        const displayName = name || email.split('@')[0];
        supabase.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'welcome',
            recipientEmail: email,
            idempotencyKey: `welcome-${data?.user?.id || email}`,
            templateData: {
              name: displayName,
              referralCode: data?.user?.user_metadata?.referral_code,
            },
          },
        }).catch(err => console.error('Welcome email failed:', err));
      } catch (e) {
        console.error('Welcome email invoke error:', e);
      }
      
      return { error: null, data };
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
      isInitialized: false,
    });
  },
}));
