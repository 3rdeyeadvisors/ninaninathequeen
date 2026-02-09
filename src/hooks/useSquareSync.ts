import { useState, useCallback } from 'react';
import { getSupabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useAdminStore } from '@/stores/adminStore';

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
      const apiKey = useAdminStore.getState().settings.squareApiKey;

      const { data, error } = await supabase.functions.invoke('square-sync-inventory', {
        body: { action: 'pull', apiKey }
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
      const apiKey = useAdminStore.getState().settings.squareApiKey;

      const { data, error } = await supabase.functions.invoke('square-sync-inventory', {
        body: { action: 'push', apiKey }
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

  const syncBidirectional = useCallback(async (): Promise<{
    pullResult: SyncResult | null;
    pushResult: SyncResult | null;
  }> => {
    // Step 1: Pull from Square first (get latest products)
    const pullResult = await pullFromSquare();
    
    // Step 2: Push local changes to Square
    const pushResult = await pushToSquare();
    
    return { pullResult, pushResult };
  }, [pullFromSquare, pushToSquare]);

  return {
    isPulling,
    isPushing,
    isSyncing: isPulling || isPushing,
    pullFromSquare,
    pushToSquare,
    syncBidirectional,
  };
}
