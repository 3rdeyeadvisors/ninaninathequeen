
DROP POLICY "Admins can manage products" ON public.products;
DROP POLICY "Public can read active products" ON public.products;

CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can read active products"
  ON public.products FOR SELECT
  USING (is_deleted = false AND status = 'Active');
