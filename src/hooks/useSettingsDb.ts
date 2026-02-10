import { useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabaseClient';
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
      const supabase = getSupabase();
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
        const settingsData = data as any;
        updateSettings({
          storeName: settingsData.store_name || 'NINA ARMEND',
          currency: settingsData.currency || 'USD',
          taxRate: Number(settingsData.tax_rate) || 7.5,
          lowStockThreshold: settingsData.low_stock_threshold || 10,
          posProvider: (settingsData.pos_provider as 'none' | 'square') || 'none',
          squareApiKey: settingsData.square_api_key || '',
          squareApplicationId: settingsData.square_application_id || '',
          squareLocationId: settingsData.square_location_id || '',
          autoSync: settingsData.auto_sync ?? true,
          seoTitle: settingsData.seo_title || '',
          seoDescription: settingsData.seo_description || '',
          instagramUrl: settingsData.instagram_url || '',
          facebookUrl: settingsData.facebook_url || '',
          tiktokUrl: settingsData.tiktok_url || '',
          contactEmail: settingsData.contact_email || '',
          contactPhone: settingsData.contact_phone || '',
          isMaintenanceMode: settingsData.is_maintenance_mode ?? false,
        });
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  }, [updateSettings]);

  // Update settings in the database
  const updateSettingsDb = useCallback(async (newSettings: Partial<AdminSettings>) => {
    try {
      const supabase = getSupabase();
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
          square_application_id: (newSettings as AdminSettings).squareApplicationId,
          square_location_id: (newSettings as AdminSettings).squareLocationId,
          auto_sync: newSettings.autoSync,
          seo_title: newSettings.seoTitle,
          seo_description: newSettings.seoDescription,
          instagram_url: newSettings.instagramUrl,
          facebook_url: newSettings.facebookUrl,
          tiktok_url: newSettings.tiktokUrl,
          contact_email: newSettings.contactEmail,
          contact_phone: newSettings.contactPhone,
          is_maintenance_mode: newSettings.isMaintenanceMode,
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
