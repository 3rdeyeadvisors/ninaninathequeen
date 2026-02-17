
-- Fix products (in case previous migration didn't apply)
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Public can read active products" ON public.products;
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Public can read active products" ON public.products FOR SELECT USING (is_deleted = false AND status = 'Active');

-- Fix customers
DROP POLICY IF EXISTS "Admins can manage customers" ON public.customers;
CREATE POLICY "Admins can manage customers" ON public.customers FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix orders
DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Admins can manage orders" ON public.orders FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (customer_email = (SELECT p.email FROM profiles p WHERE p.id = auth.uid()));

-- Fix store_settings
DROP POLICY IF EXISTS "Admins can manage settings" ON public.store_settings;
DROP POLICY IF EXISTS "Admins can read settings" ON public.store_settings;
DROP POLICY IF EXISTS "Public can read settings" ON public.store_settings;
CREATE POLICY "Admins can manage settings" ON public.store_settings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Public can read settings" ON public.store_settings FOR SELECT USING (true);

-- Fix chat_messages
DROP POLICY IF EXISTS "Admins can view their own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins can insert their own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins can delete their own chat messages" ON public.chat_messages;
CREATE POLICY "Admins can view their own chat messages" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert their own chat messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete their own chat messages" ON public.chat_messages FOR DELETE USING (auth.uid() = user_id AND has_role(auth.uid(), 'admin'::app_role));

-- Fix profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix reviews
DROP POLICY IF EXISTS "Anyone can read reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can insert own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can update reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can delete reviews" ON public.reviews;
CREATE POLICY "Anyone can read reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert own reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update reviews" ON public.reviews FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete reviews" ON public.reviews FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix referrals
DROP POLICY IF EXISTS "Users can view own referrals" ON public.referrals;
DROP POLICY IF EXISTS "Admins can manage referrals" ON public.referrals;
CREATE POLICY "Users can view own referrals" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id);
CREATE POLICY "Admins can manage referrals" ON public.referrals FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix product_views
DROP POLICY IF EXISTS "Users can insert own views" ON public.product_views;
DROP POLICY IF EXISTS "Users can update own views" ON public.product_views;
DROP POLICY IF EXISTS "Users can select own views" ON public.product_views;
DROP POLICY IF EXISTS "Admins can read all views" ON public.product_views;
CREATE POLICY "Users can insert own views" ON public.product_views FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own views" ON public.product_views FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can select own views" ON public.product_views FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all views" ON public.product_views FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix newsletter_subscribers
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Admins can view subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Admins can delete subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view subscribers" ON public.newsletter_subscribers FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete subscribers" ON public.newsletter_subscribers FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix waitlist
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Admins can view waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Admins can delete waitlist entries" ON public.waitlist;
CREATE POLICY "Anyone can join waitlist" ON public.waitlist FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view waitlist" ON public.waitlist FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete waitlist entries" ON public.waitlist FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
