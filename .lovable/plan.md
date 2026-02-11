

# Simplify Platform: Remove Square Sync, Fix Checkout (Sandbox Mode)

## Overview

Remove Square inventory sync, fix the 3 checkout issues, and configure everything for **sandbox testing**. You'll switch to production later by updating the token and one line.

---

## Part 1: Remove Square Inventory Sync

### Delete files
- `src/hooks/useSquareSync.ts`
- `supabase/functions/square-sync-inventory/index.ts`

### Edit files
- **`src/pages/admin/Products.tsx`** -- Remove `useSquareSync` import, remove sync button and related logic
- **`src/stores/adminStore.ts`** -- Remove `autoSync` from settings interface and defaults
- **`src/hooks/useSettingsDb.ts`** -- Remove `autoSync` mapping in fetch and save
- **`src/providers/DbSyncProvider.tsx`** -- Remove `autoSync` mapping
- **`supabase/config.toml`** -- Remove `[functions.square-sync-inventory]` entry

The `auto_sync` database column stays (harmless, code just stops reading it).

---

## Part 2: Fix Checkout (3 Issues)

### Issue A: Add missing database columns

```sql
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS square_order_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address jsonb;
```

### Issue B: Align both edge functions to sandbox

- **`create-square-checkout/index.ts`** -- Change default environment from `'production'` to `'sandbox'` (line 27)
- **`finalize-square-order/index.ts`** -- Keep default as `'sandbox'` (already sandbox, just clean up the detection logic)

This ensures checkout is created and verified on the same Square environment.

### Issue C: Re-enter Square Access Token

Prompt you to paste your **sandbox** access token into the secure secrets input. This replaces the current (possibly expired) value.

---

## Execution Order

1. Run database migration (add 2 columns)
2. Delete sync files (`useSquareSync.ts`, `square-sync-inventory` edge function)
3. Clean up sync references in Products.tsx, adminStore.ts, useSettingsDb.ts, DbSyncProvider.tsx
4. Set both checkout edge functions to default to `sandbox`
5. Update `supabase/config.toml`
6. Prompt you to re-enter the sandbox access token

---

## When You're Ready for Production

Two changes:
1. Update `SQUARE_ACCESS_TOKEN` secret with your production token
2. Change the environment default in both `create-square-checkout` and `finalize-square-order` from `'sandbox'` to `'production'`

---

## What Stays Untouched

- POS page and `process-payment` edge function (independent of sync)
- Checkout page UI (`Checkout.tsx`)
- Checkout success page (`CheckoutSuccess.tsx`)
- Square settings fields in Admin Settings (Application ID, Location ID)

