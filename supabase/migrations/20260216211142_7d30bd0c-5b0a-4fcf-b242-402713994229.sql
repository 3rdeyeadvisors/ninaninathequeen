
-- Fix 1: Drop broken likes UPDATE policy and create secure RPC
DROP POLICY IF EXISTS "Authenticated users can update likes" ON public.reviews;

CREATE OR REPLACE FUNCTION public.toggle_review_like(p_review_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_likes text[];
BEGIN
  SELECT COALESCE(likes, '{}') INTO current_likes FROM public.reviews WHERE id = p_review_id;
  IF current_likes IS NULL THEN
    RAISE EXCEPTION 'Review not found';
  END IF;
  IF p_user_id::text = ANY(current_likes) THEN
    UPDATE public.reviews SET likes = array_remove(likes, p_user_id::text) WHERE id = p_review_id;
  ELSE
    UPDATE public.reviews SET likes = array_append(COALESCE(likes, '{}'), p_user_id::text) WHERE id = p_review_id;
  END IF;
END;
$$;

-- Fix 2: Unique constraint to prevent duplicate reviews
ALTER TABLE public.reviews ADD CONSTRAINT unique_product_user_review UNIQUE (product_id, user_id);

-- Fix 3: Newsletter subscribers table
CREATE TABLE public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view subscribers" ON public.newsletter_subscribers
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete subscribers" ON public.newsletter_subscribers
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Fix 5: Atomic product view increment RPC
CREATE OR REPLACE FUNCTION public.increment_product_view(p_user_id uuid, p_product_id text, p_product_title text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.product_views (user_id, product_id, product_title, view_count, first_viewed_at, last_viewed_at)
  VALUES (p_user_id, p_product_id, p_product_title, 1, now(), now())
  ON CONFLICT (user_id, product_id)
  DO UPDATE SET view_count = product_views.view_count + 1, last_viewed_at = now(), product_title = COALESCE(EXCLUDED.product_title, product_views.product_title);
END;
$$;

-- Need unique constraint on product_views for the upsert
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_product_view') THEN
    ALTER TABLE public.product_views ADD CONSTRAINT unique_user_product_view UNIQUE (user_id, product_id);
  END IF;
END $$;
