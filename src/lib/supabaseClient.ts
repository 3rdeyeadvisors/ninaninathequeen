// Re-export the properly configured Supabase client from integrations
// This ensures consistent client usage across the app
import { supabase } from '@/integrations/supabase/client';

export const getSupabase = () => supabase;
