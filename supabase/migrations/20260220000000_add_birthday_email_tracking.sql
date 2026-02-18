ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS birthday_emails_sent_month integer;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS birthday_emails_sent_year integer;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS birthday_emails_sent_count integer DEFAULT 0;
