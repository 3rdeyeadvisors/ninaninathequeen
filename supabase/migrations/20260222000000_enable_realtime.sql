-- Enable Supabase Realtime for key tables so the UI updates
-- automatically without requiring a page refresh.
--
-- REPLICA IDENTITY FULL: ensures UPDATE and DELETE events include
-- the full old row in the change payload (needed by the client).
--
-- supabase_realtime publication: registers each table so Postgres
-- streams change events to connected clients.

ALTER TABLE public.products      REPLICA IDENTITY FULL;
ALTER TABLE public.orders        REPLICA IDENTITY FULL;
ALTER TABLE public.customers     REPLICA IDENTITY FULL;
ALTER TABLE public.store_settings REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.store_settings;
