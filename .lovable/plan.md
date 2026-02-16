
# Fix Customer Upsert Bug in Manual Orders

## Problem Found
The `createManualOrder` function in `useOrdersDb.ts` generates a new customer ID each time and uses `onConflict: 'id'` for the customer upsert. However, the `customers` table has a **unique constraint on `email`**. This means:
- First-time customers: works fine (new ID, new email)
- Returning customers: the insert fails with a unique constraint violation on email, logged as a warning but the order still goes through -- the customer record just doesn't get updated

## Fix

**File**: `src/hooks/useOrdersDb.ts` (lines 169-182)

Change the customer upsert to:
1. First check if a customer with that email already exists
2. If yes, update their `order_count` and `total_spent`
3. If no, insert a new customer record

Replace the current upsert block with:

```typescript
// 2. Create/update customer record
const { data: existingCustomer } = await supabase
  .from('customers')
  .select('id, order_count, total_spent')
  .eq('email', order.customerEmail)
  .maybeSingle();

if (existingCustomer) {
  // Update existing customer
  await supabase
    .from('customers')
    .update({
      name: order.customerName,
      order_count: (existingCustomer.order_count || 0) + 1,
      total_spent: (parseFloat(existingCustomer.total_spent || '0') + parseFloat(order.total)).toFixed(2),
    })
    .eq('id', existingCustomer.id)
    .select('id')
    .maybeSingle();
} else {
  // Create new customer
  await supabase
    .from('customers')
    .insert({
      id: `cust-${Date.now()}`,
      name: order.customerName,
      email: order.customerEmail,
      join_date: new Date().toISOString().split('T')[0],
      order_count: 1,
      total_spent: order.total,
    })
    .select('id')
    .maybeSingle();
}
```

This is a one-file fix that ensures returning customers get their stats updated instead of causing a silent failure.

## Files Changed

| File | Change |
|------|--------|
| `src/hooks/useOrdersDb.ts` | Fix customer upsert to handle existing customers by email |
