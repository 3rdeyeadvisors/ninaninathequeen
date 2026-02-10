-- Add new settings fields to store_settings
ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS seo_description TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS tiktok_url TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS is_maintenance_mode BOOLEAN DEFAULT FALSE;

-- Update the public store_info view to include these new fields
-- First drop the existing view
DROP VIEW IF EXISTS public.store_info;

-- Recreate the view with all fields
CREATE OR REPLACE VIEW public.store_info AS
  SELECT
    id,
    store_name,
    currency,
    tax_rate,
    low_stock_threshold,
    pos_provider,
    square_application_id,
    square_location_id,
    seo_title,
    seo_description,
    instagram_url,
    facebook_url,
    tiktok_url,
    contact_email,
    contact_phone,
    is_maintenance_mode,
    created_at,
    updated_at
  FROM public.store_settings;

-- Ensure permissions are maintained
GRANT SELECT ON public.store_info TO anon, authenticated;
