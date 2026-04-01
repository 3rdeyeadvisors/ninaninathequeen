CREATE OR REPLACE FUNCTION public.get_referrer_email(code text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM public.profiles WHERE referral_code = code LIMIT 1
$$;