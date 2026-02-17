

# Fix: Products Table RLS Policies Blocking Admin Saves

## Root Cause

Both RLS policies on the `products` table are set to **RESTRICTIVE** instead of **PERMISSIVE**:

1. "Admins can manage products" -- RESTRICTIVE
2. "Public can read active products" -- RESTRICTIVE

In PostgreSQL's RLS model:
- **PERMISSIVE** policies are OR'd together (at least one must pass)
- **RESTRICTIVE** policies are AND'd together (all must pass)
- If there are **zero PERMISSIVE policies**, access is denied to everyone regardless of RESTRICTIVE policies

This means your client (admin) cannot INSERT, UPDATE, or DELETE products -- and public users likely can't read them either.

## Fix

Run a single database migration to drop both policies and recreate them as **PERMISSIVE**:

1. Drop "Admins can manage products" (RESTRICTIVE) and recreate as **PERMISSIVE** with the same admin role check
2. Drop "Public can read active products" (RESTRICTIVE) and recreate as **PERMISSIVE** with the same `is_deleted = false AND status = 'Active'` filter

## What This Changes

- Admins will be able to INSERT, UPDATE, DELETE, and SELECT all products (including inactive/deleted ones for management)
- Public users will be able to SELECT only active, non-deleted products
- No other tables or functionality are affected

## Technical Details

```text
SQL Migration:
  DROP POLICY "Admins can manage products" ON public.products;
  DROP POLICY "Public can read active products" ON public.products;

  CREATE POLICY "Admins can manage products"
    ON public.products FOR ALL
    USING (has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

  CREATE POLICY "Public can read active products"
    ON public.products FOR SELECT
    USING (is_deleted = false AND status = 'Active');
```

Both policies default to PERMISSIVE (PostgreSQL default when not specified as RESTRICTIVE).

