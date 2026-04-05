-- Add SELECT policy for customers to view their own return requests
CREATE POLICY "Users can view own return requests"
  ON public.return_requests
  FOR SELECT
  TO authenticated
  USING (customer_email = (SELECT p.email FROM profiles p WHERE p.id = auth.uid()));