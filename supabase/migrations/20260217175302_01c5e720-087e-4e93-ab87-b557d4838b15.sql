CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  IF NEW.email = 'lydia@ninaarmend.co' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  END IF;

  -- Process referral code from user metadata
  _referral_code := NEW.raw_user_meta_data->>'referral_code';
  IF _referral_code IS NOT NULL AND _referral_code != '' THEN
    SELECT id INTO _referrer_id FROM public.profiles WHERE referral_code = _referral_code LIMIT 1;
    IF _referrer_id IS NOT NULL THEN
      INSERT INTO public.referrals (referrer_id, referred_id, status, points_awarded)
      VALUES (_referrer_id, NEW.id, 'signed_up', 25);
      UPDATE public.profiles SET points = COALESCE(points, 0) + 25 WHERE id = _referrer_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;