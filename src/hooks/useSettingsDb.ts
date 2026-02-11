import { useEffect, useCallback, useRef } from 'react';
import { getSupabase } from '@/lib/supabaseClient';
import { useAdminStore, type AdminSettings } from '@/stores/adminStore';

/**
 * Hook to sync store settings with the database.
 * Fetches settings on mount and provides functions to update.
 */
export function useSettingsDb() {
  const { settings, updateSettings } = useAdminStore();
  const settingsIdRef = useRef<string | null>(null);

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
        const settingsData = data as Record<string, unknown>;
        settingsIdRef.current = settingsData.id as string;
        updateSettings({
          storeName: (settingsData.store_name as string) || 'NINA ARMEND',
          currency: (settingsData.currency as string) || 'USD',
          taxRate: Number(settingsData.tax_rate) || 7.5,
          lowStockThreshold: (settingsData.low_stock_threshold as number) || 10,
          posProvider: (settingsData.pos_provider as 'none' | 'square') || 'none',
          squareApiKey: (settingsData.square_api_key as string) || '',
          squareApplicationId: (settingsData.square_application_id as string) || '',
          squareLocationId: (settingsData.square_location_id as string) || 'L09Y3ZCB23S11',
          autoSync: (settingsData.auto_sync as boolean) ?? true,
          seoTitle: (settingsData.seo_title as string) || '',
          seoDescription: (settingsData.seo_description as string) || '',
          instagramUrl: (settingsData.instagram_url as string) || '',
          facebookUrl: (settingsData.facebook_url as string) || '',
          tiktokUrl: (settingsData.tiktok_url as string) || '',
          contactEmail: (settingsData.contact_email as string) || '',
          contactPhone: (settingsData.contact_phone as string) || '',
          isMaintenanceMode: (settingsData.is_maintenance_mode as boolean) ?? false,
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
      console.log('[Settings] Starting save...');

      // Check auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('[Settings] No auth session - cannot save');
        return false;
      }
      console.log('[Settings] Auth OK, user:', session.user.id);

      // Use cached ID if available, otherwise fetch it
      let targetId = settingsIdRef.current;

      if (!targetId) {
        console.log('[Settings] No cached ID, fetching...');
        const { data: existing } = await supabase
          .from('store_settings')
          .select('id')
          .limit(1)
          .maybeSingle();

        if (existing) {
          targetId = existing.id;
          settingsIdRef.current = targetId;
        }
        console.log('[Settings] Fetched ID:', targetId);
      }

      // Prepare data for upsert/update
      const updateData = {
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
      };

      let error;
      if (targetId) {
        console.log('[Settings] Updating row:', targetId);
        const { error: updateError } = await supabase
          .from('store_settings')
          .update(updateData)
          .eq('id', targetId);
        error = updateError;
      } else {
        console.log('[Settings] No row found, inserting new...');
        const { data: inserted, error: insertError } = await supabase
          .from('store_settings')
          .insert(updateData)
          .select('id')
          .single();

        if (inserted) {
          settingsIdRef.current = inserted.id;
        }
        error = insertError;
      }

      if (error) {
        console.error('[Settings] Save failed:', error);
        return false;
      }
      console.log('[Settings] Save successful');
      return true;
    } catch (err) {
      console.error('[Settings] Save exception:', err);
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
