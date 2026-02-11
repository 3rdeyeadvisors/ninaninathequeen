-- Add square_order_id and shipping_address to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS square_order_id text,
ADD COLUMN IF NOT EXISTS shipping_address jsonb;
