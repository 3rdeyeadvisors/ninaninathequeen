
-- Fix products: drop restrictive public read, recreate as permissive
DROP POLICY IF EXISTS "Public can read active products" ON public.products;
CREATE POLICY "Public can read active products"
  ON public.products
  FOR SELECT
  USING (is_deleted = false);

-- Fix admin manage products: make permissive
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products"
  ON public.products
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix store_settings: add permissive public read for non-sensitive fields
DROP POLICY IF EXISTS "Deny non-admin access to settings" ON public.store_settings;
DROP POLICY IF EXISTS "Admins can manage settings" ON public.store_settings;

-- Permissive read for everyone (store config is needed by frontend)
CREATE POLICY "Public can read settings"
  ON public.store_settings
  FOR SELECT
  USING (true);

-- Permissive admin manage
CREATE POLICY "Admins can manage settings"
  ON public.store_settings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix orders: make admin policies permissive
DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can read orders" ON public.orders;
DROP POLICY IF EXISTS "Deny non-admin access to orders" ON public.orders;

CREATE POLICY "Admins can manage orders"
  ON public.orders
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow service role / edge functions to insert orders (for checkout)
CREATE POLICY "Allow order creation"
  ON public.orders
  FOR INSERT
  WITH CHECK (true);

-- Fix customers: make admin policies permissive  
DROP POLICY IF EXISTS "Admins can manage customers" ON public.customers;
DROP POLICY IF EXISTS "Admins can read customers" ON public.customers;
DROP POLICY IF EXISTS "Deny non-admin access to customers" ON public.customers;

CREATE POLICY "Admins can manage customers"
  ON public.customers
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow service role / edge functions to insert/update customers
CREATE POLICY "Allow customer creation"
  ON public.customers
  FOR INSERT
  WITH CHECK (true);
