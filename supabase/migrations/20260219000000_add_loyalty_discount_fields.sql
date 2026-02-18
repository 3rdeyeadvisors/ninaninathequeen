-- Add birth_month to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_month integer CHECK (birth_month >= 1 AND birth_month <= 12);

-- Add discount fields to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_type text;
