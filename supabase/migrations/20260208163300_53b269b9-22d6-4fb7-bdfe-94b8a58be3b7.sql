-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table for proper role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Policy: Users can view their own roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Only admins can manage roles
CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create products table
CREATE TABLE public.products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  price TEXT NOT NULL DEFAULT '0.00',
  inventory INTEGER NOT NULL DEFAULT 0,
  size_inventory JSONB DEFAULT '{}',
  image TEXT,
  description TEXT,
  product_type TEXT DEFAULT 'Bikini',
  collection TEXT,
  category TEXT DEFAULT 'Other',
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Draft')),
  item_number TEXT,
  color_codes TEXT[],
  sizes TEXT[],
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policy: Products are readable by authenticated users
CREATE POLICY "Authenticated users can read products"
  ON public.products FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only admins can insert/update/delete products
CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create orders table
CREATE TABLE public.orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  date TEXT NOT NULL,
  total TEXT NOT NULL,
  shipping_cost TEXT,
  item_cost TEXT,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled')),
  tracking_number TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read orders
CREATE POLICY "Authenticated users can read orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only admins can manage orders
CREATE POLICY "Admins can manage orders"
  ON public.orders FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create customers table
CREATE TABLE public.customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  total_spent TEXT DEFAULT '0.00',
  order_count INTEGER DEFAULT 0,
  join_date TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read customers
CREATE POLICY "Authenticated users can read customers"
  ON public.customers FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only admins can manage customers
CREATE POLICY "Admins can manage customers"
  ON public.customers FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create settings table (single row for store settings)
CREATE TABLE public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name TEXT DEFAULT 'NINA ARMEND',
  currency TEXT DEFAULT 'USD',
  tax_rate NUMERIC DEFAULT 7.5,
  low_stock_threshold INTEGER DEFAULT 10,
  pos_provider TEXT DEFAULT 'none',
  square_api_key TEXT, -- Encrypted in practice
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on settings
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read settings
CREATE POLICY "Authenticated users can read settings"
  ON public.store_settings FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only admins can manage settings
CREATE POLICY "Admins can manage settings"
  ON public.store_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_store_settings_updated_at
  BEFORE UPDATE ON public.store_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings row
INSERT INTO public.store_settings (store_name, currency, tax_rate, low_stock_threshold, pos_provider)
VALUES ('NINA ARMEND', 'USD', 7.5, 10, 'none');