

# Fix the REAL Bug: Session Refresh Doesn't Update Auth Store

## The Actual Problem

The `sync-products` edge function has zero logs -- saves never reach the server. Here's why:

In `useProductsDb.ts`, line 72 calls `supabase.auth.getSession()` to refresh the session. But line 76 then checks `useCloudAuthStore.getState().isAuthenticated`. These are two separate systems:
- `getSession()` refreshes the Supabase SDK token internally
- But the Zustand `cloudAuthStore` only updates when `onAuthStateChange` fires, which may not happen synchronously

So the auth check on line 78 fails, the function returns `{ success: false, reason: 'auth' }`, and the admin sees "Your session has expired. Please log in again" -- even though they ARE logged in.

## The Fix

### 1. Use the Supabase session directly instead of the Zustand store (useProductsDb.ts)

Replace the cloudAuthStore check with a direct `supabase.auth.getSession()` check. The session object from Supabase is the source of truth. If there's a valid session with a user, the admin is authenticated -- no need to cross-reference a Zustand store that might be stale.

```text
Before (broken):
  await supabase.auth.getSession();              // refreshes token
  const isAuthenticated = useCloudAuthStore...    // may still be false!
  if (!isAuthenticated) return { reason: 'auth' }

After (fixed):
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return { reason: 'auth' }
```

### 2. Keep the edge function's server-side admin check as the real security gate

The edge function already validates the JWT and checks admin role server-side (lines 86-116 of sync-products/index.ts). The client-side check is just a UX optimization to avoid unnecessary network calls. So using the Supabase session directly is perfectly safe.

## Technical Details

| File | Change |
|------|--------|
| `src/hooks/useProductsDb.ts` | Replace `useCloudAuthStore.getState()` check with direct `supabase.auth.getSession()` result. Remove the cloudAuthStore import if no longer needed. |

This is a one-file, ~5-line change that fixes the root cause.

## Why This Will Actually Work

- `supabase.auth.getSession()` returns the refreshed session synchronously after the call
- The edge function already validates admin status server-side, so the client check is just a shortcut
- No more dependency on Zustand store timing/sync issues

