
-- FIX 1: Restrict store_settings to admin-only, create public view for non-sensitive fields
DROP POLICY IF EXISTS "Public can read settings" ON public.store_settings;

CREATE POLICY "Admins can read settings"
  ON public.store_settings
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create a view that excludes sensitive Square API fields
CREATE OR REPLACE VIEW public.public_store_settings AS
SELECT 
  id,
  store_name,
  currency,
  tax_rate,
  shipping_rate,
  low_stock_threshold,
  pos_provider,
  contact_email,
  contact_phone,
  instagram_url,
  facebook_url,
  tiktok_url,
  seo_title,
  seo_description,
  is_maintenance_mode,
  auto_sync,
  created_at,
  updated_at
FROM public.store_settings;

-- FIX 2: Allow authenticated users to view their own orders by email
CREATE POLICY "Users can view own orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
