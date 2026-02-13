
-- Add points_reset_at to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS points_reset_at timestamptz DEFAULT now();

-- Create referrals table
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'signed_up',
  points_awarded integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on referrals
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Users can view their own referrals (as referrer)
CREATE POLICY "Users can view own referrals"
ON public.referrals
FOR SELECT
TO authenticated
USING (auth.uid() = referrer_id);

-- Admins can manage all referrals
CREATE POLICY "Admins can manage referrals"
ON public.referrals
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Update handle_new_user: 50 points, set points_reset_at, process referral
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _referral_code text;
  _referrer_id uuid;
BEGIN
  -- Create profile with 50 points
  INSERT INTO public.profiles (id, email, name, points, referral_code, points_reset_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    50,
    'NINA-' || upper(left(split_part(NEW.email, '@', 1), 3)) || '-' || floor(random() * 1000)::text,
    now()
  );

  -- Auto-grant admin role for owner email
  IF NEW.email = 'lydia@ninaarmend.co.site' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  END IF;

  -- Process referral code from user metadata
  _referral_code := NEW.raw_user_meta_data->>'referral_code';
  IF _referral_code IS NOT NULL AND _referral_code != '' THEN
    SELECT id INTO _referrer_id FROM public.profiles WHERE referral_code = _referral_code LIMIT 1;
    IF _referrer_id IS NOT NULL THEN
      -- Record the referral
      INSERT INTO public.referrals (referrer_id, referred_id, status, points_awarded)
      VALUES (_referrer_id, NEW.id, 'signed_up', 25);
      -- Award 25 points to referrer
      UPDATE public.profiles SET points = COALESCE(points, 0) + 25 WHERE id = _referrer_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create check_and_reset_points function
CREATE OR REPLACE FUNCTION public.check_and_reset_points(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.profiles
  SET points = 0, points_reset_at = now()
  WHERE id = _user_id
    AND points_reset_at < now() - interval '60 days';
END;
$$;
