ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS square_order_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address jsonb;