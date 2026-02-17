

# Fix Multi-Edit Save Failures (The Real Root Cause)

## Why This Keeps Happening

There's a documented constraint for this project (from the architecture notes):

> "Repeated `supabase.auth.getSession()` calls must be avoided to prevent execution hangs in the Lovable preview and published environments."

The previous fix **added** a `getSession()` call into `syncWithEdgeFunction` -- the exact function called on every single save. So:
- One save = one `getSession()` call = works fine
- Rapid saves or bulk operations = multiple `getSession()` calls = **hangs**

This is why your client can save one edit but not multiple.

## The Fix (3 changes, all straightforward)

### 1. Remove `getSession()` from `syncWithEdgeFunction` (useProductsDb.ts)

The `supabase.functions.invoke()` call **already** includes the auth token automatically -- that's built into the Supabase SDK. And the edge function already validates the JWT server-side (lines 86-116 of sync-products). The client-side `getSession()` check is redundant AND harmful.

Instead, just call the edge function directly. If the user isn't authenticated, the edge function returns 401, and we handle that from the response.

```
Before (causes hangs on repeated calls):
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return { success: false, reason: 'auth' };
  const { data, error } = await supabase.functions.invoke(...)

After (no pre-check, let the server decide):
  const { data, error } = await supabase.functions.invoke(...)
  // Handle 401/403 from the error response
```

### 2. Fix `bulkMoveToCategory` sending N parallel API calls (Products.tsx)

Line 373 currently does:
```
const results = await Promise.all(productsToUpdate.map(p => upsertProduct(p)));
```
This fires N separate edge function calls in parallel. Should use the existing `bulkUpsertProducts` function which sends all products in ONE call.

### 3. Update CORS headers in the edge function (sync-products/index.ts)

The Supabase JS client sends additional headers (`x-supabase-client-platform`, etc.) that aren't in the current CORS allow-list. Missing headers can cause preflight failures on some browsers/devices.

## Technical Details

| File | Change |
|------|--------|
| `src/hooks/useProductsDb.ts` | Remove `getSession()` call from `syncWithEdgeFunction`. Handle 401/403 from the edge function error response instead. |
| `src/pages/admin/Products.tsx` | Change `bulkMoveToCategory` to use `bulkUpsertProducts(productsToUpdate)` instead of N parallel `upsertProduct()` calls. |
| `supabase/functions/sync-products/index.ts` | Add missing Supabase client headers to CORS allow-list. |

## Why This Won't Break Again

- Zero `getSession()` calls in the save path = no hangs regardless of how many saves
- Server-side auth is the single source of truth (already was, now the client respects it)
- Bulk operations use a single API call instead of N parallel calls
- CORS headers match what the Supabase client actually sends
