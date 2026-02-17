

# Fix Remaining Issue: Stale Auth Check in Order Creation

## What's Wrong

The `createManualOrder` function in `useOrdersDb.ts` (lines 133-134) reads authentication state from the Zustand store using `getState()`. This can return **stale data** -- if the session refreshed in the background, the Zustand store might not reflect it yet, causing the function to block the order creation even though the user is actually logged in.

This is the same pattern that caused the product save failures.

## The Fix

Remove the `useCloudAuthStore.getState()` check from `createManualOrder`. The database already enforces admin-only access via RLS policies on the `orders` table, and the code already handles RLS errors gracefully (lines 161-166). The client-side check is redundant.

## What Changes

| File | Change |
|------|--------|
| `src/hooks/useOrdersDb.ts` | Remove the `useCloudAuthStore` import and the `getState()` auth check (lines 130-139). The RLS policy ("Admins can manage orders") is the real gatekeeper. If the user isn't authenticated or isn't admin, the insert will fail with an RLS error, which is already caught and returns a user-friendly message. |

## Why This Won't Break

- The `orders` table has an RLS policy that only allows admin users to insert/update/delete
- The existing error handling (lines 161-166) already catches RLS permission errors and returns a clear message
- This matches the pattern we just applied to product saves (let the server decide, don't pre-check on the client)

