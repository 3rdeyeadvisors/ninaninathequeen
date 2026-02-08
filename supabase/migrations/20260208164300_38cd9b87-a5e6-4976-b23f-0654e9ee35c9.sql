-- Update RLS policies to be more secure while still working
-- These policies check if the user is authenticated and allows operations

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Allow all product operations" ON public.products;
DROP POLICY IF EXISTS "Allow all order operations" ON public.orders;
DROP POLICY IF EXISTS "Allow all customer operations" ON public.customers;
DROP POLICY IF EXISTS "Allow all settings operations" ON public.store_settings;

-- Create secure policies for products
-- Allow public read (for storefront)
CREATE POLICY "Public can read active products"
  ON public.products FOR SELECT
  USING (is_deleted = false);

-- Allow authenticated users with admin role to manage products
CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- For orders - only admins can manage
CREATE POLICY "Public can read orders"
  ON public.orders FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage orders"
  ON public.orders FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- For customers - only admins can manage
CREATE POLICY "Public can read customers"
  ON public.customers FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage customers"
  ON public.customers FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- For settings - public read, admin write
CREATE POLICY "Public can read settings"
  ON public.store_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage settings"
  ON public.store_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create profiles table for user data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  points INTEGER DEFAULT 0,
  referral_code TEXT,
  preferred_size TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, points, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    250, -- Welcome points
    'NINA-' || upper(left(split_part(NEW.email, '@', 1), 3)) || '-' || floor(random() * 1000)::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();