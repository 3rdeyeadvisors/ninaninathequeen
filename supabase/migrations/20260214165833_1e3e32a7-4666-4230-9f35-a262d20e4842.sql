
-- Fix SECURITY DEFINER view issue by setting it to SECURITY INVOKER
ALTER VIEW public.public_store_settings SET (security_invoker = on);
