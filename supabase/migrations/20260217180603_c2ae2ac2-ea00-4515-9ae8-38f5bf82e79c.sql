-- Tighten public product read policy to only show active, non-deleted products
DROP POLICY IF EXISTS "Public can read active products" ON public.products;

CREATE POLICY "Public can read active products"
ON public.products
FOR SELECT
USING (is_deleted = false AND status = 'Active');