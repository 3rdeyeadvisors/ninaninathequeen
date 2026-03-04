
-- Add verified_purchase column to reviews table
ALTER TABLE public.reviews ADD COLUMN verified_purchase boolean DEFAULT false;
