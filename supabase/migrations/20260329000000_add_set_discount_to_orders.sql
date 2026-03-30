ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS set_discount_amount numeric DEFAULT 0;
