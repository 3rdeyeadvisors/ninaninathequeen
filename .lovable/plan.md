

# Fix the Real Save Problem: Auth Session + Double Toast Errors

## Root Cause (confirmed this time)

The `sync-products` edge function has **zero** recent logs -- meaning saves never reach the server. The problem is in `useProductsDb.ts`: it checks `useCloudAuthStore.getState().isAuthenticated` before calling the edge function. If the admin's session expired or didn't initialize properly, the save silently fails and returns `false`.

The `handleSave` in Products.tsx then shows "Failed to save to database" but doesn't explain that the real issue is authentication. Your client likely sees a vague error and has no idea what to do.

There's also a **double toast problem**: both `syncWithEdgeFunction` (in useProductsDb.ts) and `handleSave` (in Products.tsx) show their own error toasts, so the admin sees TWO error messages for one failure.

## Changes

### 1. Remove duplicate toasts from useProductsDb.ts

`syncWithEdgeFunction` currently shows its own `toast.error()` messages (lines 115-127). Since `handleSave` in Products.tsx already shows clear error/success toasts, the hook should just return `false` without toasting -- let the caller handle all user-facing messages.

### 2. Return a reason when save fails (useProductsDb.ts)

Instead of just returning `true`/`false`, return an object like `{ success: false, reason: 'auth' | 'forbidden' | 'error' }` so Products.tsx can show the right message (e.g., "Please log in again" vs "Database error").

### 3. Show actionable error messages in handleSave (Products.tsx)

- If reason is `auth`: show "Your session has expired. Please log in again to save."
- If reason is `forbidden`: show "Admin access required."
- If reason is generic error: show "Failed to save. Please try again."

### 4. Auto-refresh session before save attempt (useProductsDb.ts)

Before the auth check, call `supabase.auth.getSession()` to refresh the token. This prevents silent failures from expired sessions.

## Technical Details

| File | Change |
|------|--------|
| `src/hooks/useProductsDb.ts` | Remove duplicate toast calls from `syncWithEdgeFunction`; return `{ success, reason }` instead of boolean; add session refresh before auth check |
| `src/pages/admin/Products.tsx` | Update `handleSave` to read the `reason` from the return value and show the correct actionable error message |

## What This Fixes

- Admin's expired session no longer causes silent/confusing save failures
- No more double toast messages
- Clear, actionable error messages telling the admin exactly what to do
- Session auto-refreshes before each save attempt

