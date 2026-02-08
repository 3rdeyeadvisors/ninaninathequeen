import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

let supabaseClient: SupabaseClient<Database> | null = null;

export const getSupabase = (): SupabaseClient<Database> => {
  if (!supabaseClient) {
    const url = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'placeholder';

    supabaseClient = createClient<Database>(url, key, {
      auth: {
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        persistSession: true,
        autoRefreshToken: true,
      }
    });
  }
  return supabaseClient;
};
