import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Lazy getter for supabase client to prevent initialization errors
// when environment variables aren't loaded yet
let supabaseClient: SupabaseClient<Database> | null = null;

export const getSupabase = (): SupabaseClient<Database> => {
  if (!supabaseClient) {
    // Dynamic import to handle cases where env vars might not be ready
    const { supabase } = require('@/integrations/supabase/client');
    supabaseClient = supabase;
  }
  return supabaseClient;
};
