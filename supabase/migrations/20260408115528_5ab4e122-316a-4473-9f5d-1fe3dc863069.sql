
DROP VIEW IF EXISTS public.public_store_settings;

CREATE VIEW public.public_store_settings AS
SELECT
  id,
  store_name,
  currency,
  contact_email,
  contact_phone,
  instagram_url,
  facebook_url,
  tiktok_url,
  seo_title,
  seo_description,
  shipping_rate,
  is_maintenance_mode,
  created_at,
  updated_at
FROM public.store_settings;

GRANT SELECT ON public.public_store_settings TO anon, authenticated;
