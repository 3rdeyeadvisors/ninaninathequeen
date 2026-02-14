
DROP POLICY "Anyone can join waitlist" ON public.waitlist;

CREATE POLICY "Anyone can join waitlist"
  ON public.waitlist
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
