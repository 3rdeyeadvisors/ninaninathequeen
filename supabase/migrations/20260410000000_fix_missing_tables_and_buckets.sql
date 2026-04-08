
-- Create return_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.return_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL,
  customer_email TEXT,
  customer_name TEXT,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on return_requests
ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;

-- Note: Policy "Users can view own return requests" is already created in migration 20260405030159_f0cd6a70-6110-4393-858e-8dbdcc5c696e.sql

-- Policy: Users can insert their own return requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'return_requests' AND policyname = 'Users can insert own return requests'
  ) THEN
    CREATE POLICY "Users can insert own return requests"
      ON public.return_requests
      FOR INSERT
      TO authenticated
      WITH CHECK (customer_email = (SELECT p.email FROM public.profiles p WHERE p.id = auth.uid()));
  END IF;
END $$;

-- Policy: Admins can manage return requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'return_requests' AND policyname = 'Admins can manage return requests'
  ) THEN
    CREATE POLICY "Admins can manage return requests"
      ON public.return_requests
      FOR ALL
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Create pending_orders table
CREATE TABLE IF NOT EXISTS public.pending_orders (
  id UUID PRIMARY KEY,
  metadata JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on pending_orders
ALTER TABLE public.pending_orders ENABLE ROW LEVEL SECURITY;

-- Note: pending_orders is primarily accessed via service_role in Edge Functions,
-- but we allow admins to view them for debugging/monitoring if needed.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'pending_orders' AND policyname = 'Admins can view pending orders'
  ) THEN
    CREATE POLICY "Admins can view pending orders"
      ON public.pending_orders
      FOR SELECT
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Setup Storage Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for avatars
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Avatar Public Access') THEN
    CREATE POLICY "Avatar Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload their own avatar') THEN
    CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own avatar') THEN
    CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

-- Storage Policies for product-images
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Product Images Public Access') THEN
    CREATE POLICY "Product Images Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage product images') THEN
    CREATE POLICY "Admins can manage product images" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;
