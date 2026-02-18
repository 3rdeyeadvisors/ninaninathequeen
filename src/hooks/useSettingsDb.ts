import { useEffect, useCallback, useRef } from 'react';
import { getSupabase } from '@/lib/supabaseClient';
import { useAdminStore, type AdminSettings } from '@/stores/adminStore';
import { toast } from 'sonner';

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
          shippingRate: Number(settingsData.shipping_rate) || 8.50,
          lowStockThreshold: (settingsData.low_stock_threshold as number) || 10,
          posProvider: (settingsData.pos_provider as 'none' | 'square') || 'none',


          
          seoTitle: (settingsData.seo_title as string) || '',
          seoDescription: (settingsData.seo_description as string) || '',
          instagramUrl: (settingsData.instagram_url as string) || '',
          facebookUrl: (settingsData.facebook_url as string) || '',
          tiktokUrl: (settingsData.tiktok_url as string) || '',
          contactEmail: (settingsData.contact_email as string) || '',
          contactPhone: (settingsData.contact_phone as string) || '',
          isMaintenanceMode: (settingsData.is_maintenance_mode as boolean) ?? false,
          birthdayEmailsSentMonth: settingsData.birthday_emails_sent_month as number | undefined,
          birthdayEmailsSentYear: settingsData.birthday_emails_sent_year as number | undefined,
          birthdayEmailsSentCount: settingsData.birthday_emails_sent_count as number | undefined,
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

      // Use cached ID if available, otherwise fetch it
      let targetId = settingsIdRef.current;

      if (!targetId) {
        const { data: existing } = await supabase
          .from('store_settings')
          .select('id')
          .limit(1)
          .maybeSingle();

        if (existing) {
          targetId = existing.id;
          settingsIdRef.current = targetId;
        }
      }

      // Prepare data for upsert/update
      const updateData = {
        store_name: newSettings.storeName,
          currency: newSettings.currency,
          shipping_rate: newSettings.shippingRate,
          low_stock_threshold: newSettings.lowStockThreshold,
          pos_provider: newSettings.posProvider,


          
          seo_title: newSettings.seoTitle,
          seo_description: newSettings.seoDescription,
          instagram_url: newSettings.instagramUrl,
          facebook_url: newSettings.facebookUrl,
          tiktok_url: newSettings.tiktokUrl,
          contact_email: newSettings.contactEmail,
        contact_phone: newSettings.contactPhone,
        is_maintenance_mode: newSettings.isMaintenanceMode,
        birthday_emails_sent_month: newSettings.birthdayEmailsSentMonth,
        birthday_emails_sent_year: newSettings.birthdayEmailsSentYear,
        birthday_emails_sent_count: newSettings.birthdayEmailsSentCount,
      };

      let error;
      if (targetId) {
        const updatePromise = supabase
          .from('store_settings')
          .update(updateData as any)
          .eq('id', targetId)
          .select('id')
          .maybeSingle();

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('DB update timed out after 10s')), 10000)
        );

        try {
          const result = await Promise.race([updatePromise, timeoutPromise]);
          error = result.error;
        } catch (raceErr: any) {
          console.error('[Settings] Update race failed:', raceErr.message);
          error = raceErr;
        }
      } else {
        // Handle "Cold Start" - no settings record exists yet
        const { data: inserted, error: insertError } = await supabase
          .from('store_settings')
          .insert({
            id: '00000000-0000-0000-0000-000000000000', // Use the standard ID from migration
            ...updateData
          } as any)
          .select('id')
          .maybeSingle();

        if (inserted) {
          settingsIdRef.current = inserted.id;
        }
        error = insertError;
      }

      if (error) {
        console.error('[Settings] Save failed:', error);
        toast.error('Failed to save store settings. Please try again.');
        return false;
      }

      toast.success('Store settings updated successfully.');
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
