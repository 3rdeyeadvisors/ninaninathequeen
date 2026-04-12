

## Fix: Maintenance Mode Not Working

### Root Cause
The previous security fix removed the `"Public can read settings"` RLS policy from `store_settings`. This was correct for the raw table (it exposed sensitive fields like `tax_rate`, `low_stock_threshold`). However, the `public_store_settings` view — which only exposes safe, public-facing columns — also depends on that table's RLS. With no public read policy, unauthenticated users get zero rows from both queries, so `isMaintenanceMode` defaults to `false`.

### Fix
Recreate the `public_store_settings` view with `security_invoker = false` (i.e., it runs as the view owner, bypassing RLS on the underlying table). This is safe because the view already filters to only public-safe columns (store name, social URLs, contact info, shipping rate, maintenance flag). Sensitive columns like `tax_rate` and `low_stock_threshold` remain hidden.

### Changes

**1. Database migration** — Recreate the view without security invoker:
```sql
DROP VIEW IF EXISTS public_store_settings;

CREATE VIEW public_store_settings
WITH (security_invoker = false)
AS SELECT
  id, store_name, currency, contact_email, contact_phone,
  instagram_url, facebook_url, tiktok_url,
  seo_title, seo_description, shipping_rate,
  is_maintenance_mode, created_at, updated_at
FROM store_settings;
```

**2. Fix unrelated build errors** in parallel:

- **`src/pages/admin/Dashboard.tsx`** — Fix import: `AdminOrderItem` doesn't exist, change to the correct type or inline it.
- **`src/hooks/useSpreadsheetSync.ts`** — Fix comparison of `SyncResult` with `boolean`.
- **`supabase/functions/create-square-checkout/index.ts`** — Fix `pre_populated_data` type error by adding proper type assertion.
- **`supabase/functions/process-email-queue/index.ts`** — Fix 5 type errors with `email_send_log` insert and `moveToDlq` calls by adding type assertions.

### Files modified
- New SQL migration (view recreation)
- `src/pages/admin/Dashboard.tsx`
- `src/hooks/useSpreadsheetSync.ts`
- `supabase/functions/create-square-checkout/index.ts`
- `supabase/functions/process-email-queue/index.ts`

