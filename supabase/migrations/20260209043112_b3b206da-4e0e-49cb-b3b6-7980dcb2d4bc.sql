-- Add explicit deny policies for non-admin users on customers and orders tables
-- This provides defense-in-depth by ensuring public/unauthenticated users are explicitly denied

-- 1. Add explicit deny policy for non-admin SELECT on customers table
-- This ensures even if other policies are added, non-admins cannot read customer data
CREATE POLICY "Deny non-admin access to customers"
ON public.customers
AS RESTRICTIVE
FOR SELECT
TO public
USING (false);

-- 2. Add explicit deny policy for non-admin SELECT on orders table  
-- This ensures even if other policies are added, non-admins cannot read order data
CREATE POLICY "Deny non-admin access to orders"
ON public.orders
AS RESTRICTIVE
FOR SELECT
TO public
USING (false);