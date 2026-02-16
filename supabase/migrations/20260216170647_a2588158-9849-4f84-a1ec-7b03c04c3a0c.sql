
-- Create product_views table for behavioral intelligence
CREATE TABLE public.product_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  product_title text,
  view_count integer NOT NULL DEFAULT 1,
  first_viewed_at timestamptz NOT NULL DEFAULT now(),
  last_viewed_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint for upsert
ALTER TABLE public.product_views ADD CONSTRAINT unique_user_product UNIQUE (user_id, product_id);

-- RLS
ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;

-- Users can insert their own views
CREATE POLICY "Users can insert own views" ON public.product_views
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can update their own views
CREATE POLICY "Users can update own views" ON public.product_views
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Users can select their own views (needed for upsert conflict resolution)
CREATE POLICY "Users can select own views" ON public.product_views
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Admins can read all views for analytics
CREATE POLICY "Admins can read all views" ON public.product_views
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
