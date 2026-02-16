
# Fix Store Intelligence Sync: Orders RLS + Data Flow

## Problem Identified

The Store Intelligence section appears to show placeholders because the **orders table is completely inaccessible** -- every request returns a `403` error with `"permission denied for table users"`. This is caused by the "Users can view own orders" RLS policy, which contains a subquery referencing `auth.users`:

```sql
customer_email = (SELECT users.email FROM auth.users WHERE users.id = auth.uid())::text
```

This subquery fails because the `authenticated` role does not have SELECT permission on `auth.users`. Since RLS evaluates ALL policies (including ones that don't apply), this broken policy blocks the admin policy too.

Because orders can't load:
- Orders count shows 0
- Revenue shows $0
- No confirmed orders data for insights
- Behavioral cross-referencing with purchases fails
- The entire Store Intelligence section falls back to pre-launch messages

## Fix

### 1. Database Migration -- Fix Orders RLS Policy

Drop the broken "Users can view own orders" policy and replace it with one that uses the `profiles` table (which users DO have SELECT access to) instead of `auth.users`:

```sql
DROP POLICY "Users can view own orders" ON public.orders;

CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT TO authenticated
  USING (
    customer_email = (
      SELECT p.email FROM public.profiles p WHERE p.id = auth.uid()
    )
  );
```

This achieves the same result (users see their own orders by matching email) but uses a table they have permission to read.

### 2. No Code Changes Needed

The Store Intelligence logic in Dashboard.tsx is already correct -- it dynamically references:
- `confirmedOrders` for revenue and momentum insights
- `orders` for pending count
- `customers` for audience size
- `behavioralInsights` for browse-but-don't-buy patterns
- `productOverrides` for inventory counts
- `waitlistCount` for pre-launch context
- `settings` for social links

Once orders load successfully, all these data flows will populate correctly and the insights will automatically sync with real store data.

## Files Changed

| File | Change |
|------|--------|
| Database migration | Fix orders RLS policy to use `profiles` table instead of `auth.users` |

## Testing

1. After migration, verify orders endpoint returns 200 (not 403)
2. Dashboard metrics should reflect real order data
3. Store Intelligence cards should show order-aware insights
4. Regular users should still only see their own orders
