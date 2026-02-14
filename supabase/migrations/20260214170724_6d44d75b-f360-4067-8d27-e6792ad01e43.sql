
-- Drop the view first so we can recreate it
DROP VIEW IF EXISTS public.public_store_settings;

-- Drop Square credential columns from store_settings
ALTER TABLE public.store_settings DROP COLUMN IF EXISTS square_api_key;
ALTER TABLE public.store_settings DROP COLUMN IF EXISTS square_application_id;
ALTER TABLE public.store_settings DROP COLUMN IF EXISTS square_location_id;

-- Recreate the public_store_settings view without Square columns
CREATE VIEW public.public_store_settings WITH (security_invoker = true) AS
SELECT
  id, store_name, currency, pos_provider,
  contact_email, contact_phone,
  instagram_url, facebook_url, tiktok_url,
  seo_title, seo_description,
  tax_rate, shipping_rate, low_stock_threshold,
  is_maintenance_mode, auto_sync,
  created_at, updated_at
FROM public.store_settings;
