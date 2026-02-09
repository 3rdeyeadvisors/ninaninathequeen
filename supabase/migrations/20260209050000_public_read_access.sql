-- Update RLS policies to allow anonymous users to read products
-- Create a secure view for store settings to protect sensitive data

-- Products table: allow anyone to read
DROP POLICY IF EXISTS "Authenticated users can read products" ON public.products;
DROP POLICY IF EXISTS "Public read access for products" ON public.products;
CREATE POLICY "Public read access for products"
  ON public.products FOR SELECT
  USING (true);

-- Store settings: Do NOT allow public read on the table itself due to sensitive square_api_key
DROP POLICY IF EXISTS "Authenticated users can read settings" ON public.store_settings;
DROP POLICY IF EXISTS "Public read access for settings" ON public.store_settings;

-- Allow authenticated users to read settings
CREATE POLICY "Authenticated users can read settings"
  ON public.store_settings FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can manage settings
CREATE POLICY "Admins can manage settings"
  ON public.store_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create a secure view for public store information (excludes sensitive keys)
CREATE OR REPLACE VIEW public.store_info AS
  SELECT id, store_name, currency, tax_rate, low_stock_threshold, pos_provider, created_at, updated_at
  FROM public.store_settings;

-- Grant access to the view
GRANT SELECT ON public.store_info TO anon, authenticated;
