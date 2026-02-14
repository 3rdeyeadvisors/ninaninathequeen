
-- Create waitlist table
CREATE TABLE public.waitlist (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  name text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT waitlist_email_unique UNIQUE (email)
);

-- Enable RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anonymous) to insert into waitlist
CREATE POLICY "Anyone can join waitlist"
ON public.waitlist
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can view waitlist
CREATE POLICY "Admins can view waitlist"
ON public.waitlist
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete from waitlist
CREATE POLICY "Admins can delete waitlist entries"
ON public.waitlist
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
