
-- Remove overly permissive INSERT policies (edge functions use service role, bypass RLS)
DROP POLICY IF EXISTS "Allow order creation" ON public.orders;
DROP POLICY IF EXISTS "Allow customer creation" ON public.customers;
