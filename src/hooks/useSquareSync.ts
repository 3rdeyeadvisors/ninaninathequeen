import { useState, useCallback } from 'react';
import { getSupabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface SyncResult {
  success: boolean;
  action: 'pull' | 'push';
  synced: number;
  message: string;
  error?: string;
}

/**
 * Hook to sync inventory with Square POS.
 * Provides functions to pull from Square and push to Square.
 */
export function useSquareSync() {
  const [isPulling, setIsPulling] = useState(false);
  const [isPushing, setIsPushing] = useState(false);

  const pullFromSquare = useCallback(async (): Promise<SyncResult | null> => {
    setIsPulling(true);
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.functions.invoke('square-sync-inventory', {
        body: { action: 'pull' }
      });

      if (error) {
        console.error('Pull error:', error);
        toast.error('Failed to pull from Square');
        return null;
      }

      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.error || 'Pull failed');
      }

      return data as SyncResult;
    } catch (err) {
      console.error('Pull exception:', err);
      toast.error('Failed to connect to Square');
      return null;
    } finally {
      setIsPulling(false);
    }
  }, []);

  const pushToSquare = useCallback(async (): Promise<SyncResult | null> => {
    setIsPushing(true);
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.functions.invoke('square-sync-inventory', {
        body: { action: 'push' }
      });

      if (error) {
        console.error('Push error:', error);
        toast.error('Failed to push to Square');
        return null;
      }

      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.error || 'Push failed');
      }

      return data as SyncResult;
    } catch (err) {
      console.error('Push exception:', err);
      toast.error('Failed to connect to Square');
      return null;
    } finally {
      setIsPushing(false);
    }
  }, []);

  return {
    isPulling,
    isPushing,
    isSyncing: isPulling || isPushing,
    pullFromSquare,
    pushToSquare,
  };
}
