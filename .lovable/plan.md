
## Fix: Maintenance Page and Waitlist

### Root Cause

The `public_store_settings` database view was created with `security_invoker=on`, meaning it runs queries as the calling user. Since the underlying `store_settings` table only allows admin-level SELECT access, **anonymous visitors get empty results**. This means `isMaintenanceMode` is never set to `true`, so the maintenance page never appears for non-admin visitors.

Because the maintenance page never shows, the waitlist form is inaccessible. When it was occasionally visible (due to cached local state), the "try again" error occurred because the waitlist insert and email calls were failing silently.

---

### Fix 1: Allow Public Read Access to Store Settings

**Database migration** -- Add a permissive SELECT policy on the `store_settings` table so that all visitors (anonymous and authenticated) can read the settings. This table does not contain sensitive data (no API keys or secrets), so public read access is safe.

```sql
CREATE POLICY "Public can read settings"
  ON public.store_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);
```

This fixes the core problem: now `public_store_settings` (and `store_settings` directly) will return data for all users, so `isMaintenanceMode` will be correctly detected.

---

### Fix 2: Simplify Settings Fetch in DbSyncProvider

**File:** `src/providers/DbSyncProvider.tsx`

Since both anon and authenticated users can now read `store_settings` directly, simplify `syncSettings` to always use `store_settings` first and fall back to `public_store_settings` only if needed. The current code already does this, so the database fix alone should resolve it -- but we'll add better error logging to avoid silent failures.

---

### Fix 3: Harden the Waitlist Insert

**File:** `src/pages/Maintenance.tsx`

- Remove the `as any` type casts on the waitlist insert (now that the types file includes the `waitlist` table, these are unnecessary and hide potential type errors)
- Add more specific error logging so failures are easier to diagnose
- Make the email calls fully independent of the insert success (they already are fire-and-forget, but ensure errors don't bubble up)

---

### Technical Summary

1. **Database migration**: Add `"Public can read settings"` SELECT policy on `store_settings` for `anon` and `authenticated`
2. **`src/pages/Maintenance.tsx`**: Remove `as any` casts, improve error handling
3. **`src/providers/DbSyncProvider.tsx`**: Add diagnostic logging for settings fetch failures
