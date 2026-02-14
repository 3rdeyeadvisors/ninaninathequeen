CREATE POLICY "Public can read settings"
  ON public.store_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);