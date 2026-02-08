-- Add auto_sync column to store_settings table
ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS auto_sync boolean DEFAULT true;