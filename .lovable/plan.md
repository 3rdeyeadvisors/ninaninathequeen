

## Fix: Waitlist RLS Policy

### Root Cause

The "Anyone can join waitlist" INSERT policy on the `waitlist` table was created as a **RESTRICTIVE** policy. PostgreSQL RLS requires at least one **PERMISSIVE** policy to grant base access -- restrictive policies can only narrow existing access. Since there is no permissive INSERT policy, all inserts are denied regardless of the `true` check expression.

### Fix

**Database migration** -- Drop the restrictive INSERT policy and recreate it as PERMISSIVE:

```sql
DROP POLICY "Anyone can join waitlist" ON public.waitlist;

CREATE POLICY "Anyone can join waitlist"
  ON public.waitlist
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
```

This single migration is the only change needed. The form code is correct -- the database is just blocking the insert due to the wrong policy type.

### Verification

After applying the migration, the waitlist signup will be tested by submitting a form entry to confirm a 200/201 response instead of the current 401/42501 error.

