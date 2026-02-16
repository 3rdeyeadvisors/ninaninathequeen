
DROP POLICY "Users can view own orders" ON public.orders;

CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT TO authenticated
  USING (
    customer_email = (
      SELECT p.email FROM public.profiles p WHERE p.id = auth.uid()
    )
  );
