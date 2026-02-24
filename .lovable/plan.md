

# Fix: Stop Abandoned Checkouts from Creating Orders + Add Date Filtering

## Problem 1: Abandoned checkouts show up as orders

Right now, when a customer clicks "Proceed to Payment," the system immediately creates a "Pending" order in the database **before** the customer even pays on Square. If they close the Square payment page without paying, that order stays in the admin dashboard as "Pending" forever (it only gets cleaned up if another customer happens to complete a checkout, which triggers a stale-order cleanup).

### The Fix

Stop creating the order when checkout starts. Instead, only create the order **after** Square confirms payment was successful.

**Changes:**

1. **`supabase/functions/create-square-checkout/index.ts`** -- Remove the database upsert (lines 231-248) that saves the order as "Pending." Instead, pass the order details (items, customer info, costs, discount) as metadata attached to the Square payment link so they survive the round-trip.

2. **`supabase/functions/finalize-square-order/index.ts`** -- Update to create the order record here (instead of just updating it), using the order details stored from the checkout initiation. The order only gets written to the database after Square confirms payment. Also keep the stale-order cleanup for any legacy pending orders.

3. **`src/pages/Checkout.tsx`** -- Minor update: stop generating and passing an order ID upfront since orders are no longer pre-created.

## Problem 2: Too many orders, endless scrolling

The current pagination shows 25 orders per page with just Previous/Next buttons, but there's no way to filter by date, status, or search for a specific order.

### The Fix

Add a filter toolbar above the orders table with:

- **Status filter** -- dropdown to filter by Pending, Processing, Shipped, Delivered, Cancelled, or All
- **Year filter** -- dropdown showing available years from order data
- **Month filter** -- dropdown for months (January-December)
- **Search** -- text field to search by order ID, customer name, or email
- **Order count summary** -- "Showing X of Y orders"

**Changes:**

4. **`src/pages/admin/Orders.tsx`** -- Add filter state variables and a filter toolbar UI above the table. The filtering applies before pagination so the page counts update correctly. Filters include:
   - Status dropdown (All / Pending / Processing / Shipped / Delivered / Cancelled)
   - Year dropdown (auto-populated from order dates)
   - Month dropdown (January through December)
   - Search input for order ID / customer name / email
   - Clear filters button
   - Also hide "Cancelled" orders by default (with option to show them)

---

## Technical Details

### Edge Function: `create-square-checkout`
- Remove the `supabase.from('orders').upsert(...)` block entirely
- Store order metadata (customer info, items, costs, discount) in the Square checkout `note` field or pass it back through the redirect URL so `finalize-square-order` can reconstruct the order
- The discount email can still be sent here since we have the customer info

### Edge Function: `finalize-square-order`
- After verifying payment with Square, **insert** (not update) the order into the database
- Reconstruct order details from the Square order data and/or metadata passed through
- Remove the stale-order cleanup logic (no more premature pending orders to clean up) or keep it as a safety net for legacy data

### Orders Page Filters
- `filteredOrders` computed via `useMemo` applying all active filters before pagination
- Available years extracted from `orders.map(o => new Date(o.date).getFullYear())` with duplicates removed
- Pagination resets to page 1 when any filter changes
- Filter bar is responsive (stacks on mobile)

