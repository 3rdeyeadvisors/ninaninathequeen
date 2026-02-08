import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminStore, type AdminSettings } from '@/stores/adminStore';

/**
 * Hook to sync store settings with the database.
 * Fetches settings on mount and provides functions to update.
 */
export function useSettingsDb() {
  const { settings, updateSettings } = useAdminStore();

  // Fetch settings from database on mount
  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching settings:', error);
        return;
      }

      if (data) {
        updateSettings({
          storeName: data.store_name || 'NINA ARMEND',
          currency: data.currency || 'USD',
          taxRate: Number(data.tax_rate) || 7.5,
          lowStockThreshold: data.low_stock_threshold || 10,
          posProvider: (data.pos_provider as 'none' | 'square') || 'none',
          squareApiKey: data.square_api_key || '',
        });
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  }, [updateSettings]);

  // Update settings in the database
  const updateSettingsDb = useCallback(async (newSettings: Partial<AdminSettings>) => {
    try {
      // First get the existing settings row ID
      const { data: existing } = await supabase
        .from('store_settings')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (!existing) {
        console.error('No settings row found');
        return false;
      }

      const { error } = await supabase
        .from('store_settings')
        .update({
          store_name: newSettings.storeName,
          currency: newSettings.currency,
          tax_rate: newSettings.taxRate,
          low_stock_threshold: newSettings.lowStockThreshold,
          pos_provider: newSettings.posProvider,
          square_api_key: newSettings.squareApiKey,
        })
        .eq('id', existing.id);

      if (error) {
        console.error('Error updating settings:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Failed to update settings:', err);
      return false;
    }
  }, []);

  // Load settings from database on mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    fetchSettings,
    updateSettingsDb,
  };
}
