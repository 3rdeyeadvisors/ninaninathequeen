DROP VIEW IF EXISTS public_store_settings;

CREATE VIEW public_store_settings
WITH (security_invoker = false)
AS SELECT
  id, store_name, currency, contact_email, contact_phone,
  instagram_url, facebook_url, tiktok_url,
  seo_title, seo_description, shipping_rate,
  is_maintenance_mode, created_at, updated_at
FROM store_settings;