

# Fix Manual Orders + Multi-Image Products + Full Audit

## Issues Found

### 1. Manual Order Creation -- Why It's Not Working

After tracing the full code path, here are the problems:

**a) No loading/submitting state on the Create Order button**: When the admin clicks "Create Order" in the dialog, there's no disabled state or spinner. If the database call takes a moment, the user might think nothing happened and click again, or the async function might fail silently without clear feedback.

**b) No authentication guard**: Unlike `useProductsDb` which checks `useCloudAuthStore` before writes, `createManualOrder` goes straight to the database insert. If the session expired or the auth state isn't ready, the insert fails with an RLS violation and the user just sees "Failed to create order" with no guidance.

**c) No customer record creation**: When a manual order is created, it only inserts into the `orders` table but never creates/updates a `customers` record. This means manual order customers don't appear in the Customers page and don't count toward audience metrics.

**d) Validation isn't obvious**: The form requires adding items via the product dropdown before clicking Create. If the admin only fills in customer info and hits "Create Order", they get a toast error but no visual indicator on which field is missing.

### 2. Products Only Support Single Image

- Database `products` table has one `image` text column
- Admin product editor only allows uploading one photo
- Current upload stores images as base64 data URLs in state (violates storage policy)
- Clients only see one photo per product on the storefront
- Need to use Cloud Storage for proper image hosting

### 3. DbSyncProvider Data Mapping Gaps

**a) Missing `unitCost`**: `syncProducts()` at line 49-65 doesn't map `unit_cost` from the database. After a page refresh, unit costs vanish from the local store, breaking COGS calculations and profit metrics.

**b) Missing `shippingAddress`**: `syncOrders()` at line 88-99 doesn't map `shipping_address` from the database. After a refresh, shipping addresses disappear from order details.

---

## Implementation Plan

### Step 1: Database Migration

Add an `images` text array column to the products table and create a storage bucket for product images.

```sql
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';

UPDATE public.products 
  SET images = ARRAY[image] 
  WHERE image IS NOT NULL AND image != '' AND (images IS NULL OR images = '{}');
```

Create a `product-images` storage bucket with public read access and admin-only upload.

### Step 2: Fix `createManualOrder` in `useOrdersDb.ts`

- Add authentication check (same pattern as `useProductsDb`)
- Create/update customer record in `customers` table after successful order insert
- Add better error messages for common failure cases (auth expired, RLS violation)
- Return the actual error message instead of just `false`

### Step 3: Fix Create Order Dialog in `Orders.tsx`

- Add a `isSubmitting` state to disable the button and show a spinner during submission
- Show inline validation errors (highlight empty fields)
- Show a message when no products are loaded yet
- Add `toast.promise` pattern for better feedback (like the edit flow already uses)

### Step 4: Fix `DbSyncProvider.tsx` data mapping

- Add `unitCost` to `syncProducts()` mapping (line ~58)
- Add `shippingAddress` to `syncOrders()` mapping (line ~98)

### Step 5: Update `ProductOverride` interface in `adminStore.ts`

Add `images?: string[]` field to support multiple image URLs.

### Step 6: Multi-image upload in admin Products editor

- Replace single image upload with a multi-image gallery
- Upload images to Cloud Storage bucket instead of base64
- Display thumbnails in a grid with add/remove controls
- First image becomes the primary thumbnail (`image` field)
- Keep backward compatibility with existing single `image` column

### Step 7: Update `overrideToProduct()` in `useProducts.ts`

Use the `images` array (falling back to single `image`) so clients see all product photos in the storefront carousel.

### Step 8: Update `sync-products` edge function

Handle `images` array field so it round-trips correctly through the sync flow.

### Step 9: Update `useProductsDb.ts`

Map the `images` field in fetch and sync operations.

---

## Files Changed

| File | Change |
|------|--------|
| Database migration | Add `images text[]` column, create storage bucket |
| `src/stores/adminStore.ts` | Add `images?: string[]` to `ProductOverride` |
| `src/hooks/useOrdersDb.ts` | Add auth guard, customer creation, better errors |
| `src/hooks/useProductsDb.ts` | Map `images` field |
| `src/hooks/useProducts.ts` | Use `images` array in `overrideToProduct()` |
| `src/pages/admin/Orders.tsx` | Add submitting state, validation, loading UX |
| `src/pages/admin/Products.tsx` | Multi-image gallery with Cloud Storage upload |
| `src/providers/DbSyncProvider.tsx` | Add `unitCost` and `shippingAddress` mapping |
| `supabase/functions/sync-products/index.ts` | Handle `images` array |

