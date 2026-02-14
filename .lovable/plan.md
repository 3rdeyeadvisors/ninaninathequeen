
# Admin Dashboard Audit and Fixes

## Problem Summary

The admin dashboard has several areas with hardcoded/fake data, a non-functional AI chatbot, data sync gaps, and a vulnerability where abandoned Square checkouts leave orphaned "Pending" orders that inflate metrics.

---

## Part 1: Remove All Mock Data from Dashboard

**File: `src/pages/admin/Dashboard.tsx`**

- Remove the hardcoded `data` array (Mon-Sun sales/traffic) used in charts
- Replace charts with real data derived from `orders` in the store -- group orders by day-of-week and sum totals for sales chart; traffic chart removed (no real traffic data available)
- Replace fake stat percentages ("+20.1%", "+12%", "+19%") with actual counts only -- no fake growth indicators
- Replace hardcoded "842 Items" with real total inventory calculated from `allProducts`
- Replace "12 items low in stock" with actual count of products below `settings.lowStockThreshold`
- Replace hardcoded "Store Intelligence" insights with dynamic insights derived from real data (top-selling product, low stock warnings, etc.)

---

## Part 2: Fix Customer Detail Mock Data

**File: `src/pages/admin/Customers.tsx`**

- Remove hardcoded "Rio de Janeiro, Brazil" location
- Remove hardcoded "+55 21 9999-9999" phone number
- Remove hardcoded preference badges ("Size: M", "Bikinis", "Eco-Conscious")
- Remove hardcoded "Gold" loyalty tier
- Show only real data that exists in the customer record (name, email, order count, total spent, join date)
- Display "No additional info available" where data is absent

---

## Part 3: Build a Real AI Chatbot

**File: `src/pages/admin/Dashboard.tsx`**

Replace the fake pattern-matching chat with a real AI-powered assistant:

- Create an edge function `supabase/functions/ai-chat/index.ts` that:
  - Accepts the user message plus store context (orders summary, product count, inventory status, revenue)
  - Uses the Lovable AI API (no API key needed) with a model like `google/gemini-2.5-flash`
  - Includes a system prompt giving it context about Nina Armend store data
  - Returns intelligent, data-driven responses
- Update the chat handler in Dashboard to call this edge function instead of using setTimeout
- Add proper loading states and error handling
- Maintain conversation history in the chat session

**File: `supabase/functions/ai-chat/index.ts`** (new)

---

## Part 4: Fix Product AI Description Generator

**File: `src/pages/admin/Products.tsx`**

- Replace the fake setTimeout-based description generator with a real call to the `ai-chat` edge function (or a dedicated prompt within it)
- Generate contextual descriptions based on the product name, category, and brand voice

---

## Part 5: Protect Against Abandoned Checkouts

The current flow:
1. Customer clicks "Proceed to Payment" -- a Pending order is created in DB
2. Customer is redirected to Square
3. If they pay and return, `finalize-square-order` verifies payment and updates to "Processing" + decrements inventory
4. If they abandon, the Pending order stays forever

**Fix approach:**

**File: `supabase/functions/finalize-square-order/index.ts`**
- Add a cleanup step: before processing, query for any Pending orders older than 1 hour and delete them (or mark as "Cancelled")
- This runs naturally whenever a successful order comes through

**File: `src/pages/admin/Dashboard.tsx` and revenue calculations**
- Exclude "Pending" orders from revenue totals, order counts, and all dashboard metrics
- Only count orders with status "Processing", "Shipped", or "Delivered"

**File: `src/providers/DbSyncProvider.tsx`**
- In `syncOrders`, filter out Pending orders older than 1 hour on the client side as well

---

## Part 6: Fix Data Sync (DbSyncProvider)

**File: `src/providers/DbSyncProvider.tsx`**

Current problem: `syncOrders` and `syncCustomers` only add new records. They never update existing ones, so stale local data persists.

Fix:
- Change `syncOrders` to use `setOrders()` (full replacement) instead of individually adding missing orders
- Change `syncCustomers` to use `setCustomers()` (full replacement) instead of individually adding missing customers
- This ensures the dashboard always reflects the latest database state

---

## Part 7: Deploy and Verify

- Deploy the new `ai-chat` edge function
- Redeploy `finalize-square-order` with cleanup logic
- Test the dashboard end-to-end:
  - Verify all stats reflect real data
  - Verify AI chat returns intelligent responses
  - Verify customer details show only real data
  - Verify abandoned checkouts don't inflate metrics

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/ai-chat/index.ts` | **Create** -- real AI chatbot edge function |
| `src/pages/admin/Dashboard.tsx` | **Modify** -- remove all mock data, real stats, real AI chat |
| `src/pages/admin/Customers.tsx` | **Modify** -- remove fake customer details |
| `src/pages/admin/Products.tsx` | **Modify** -- real AI description generator |
| `supabase/functions/finalize-square-order/index.ts` | **Modify** -- add stale Pending order cleanup |
| `src/providers/DbSyncProvider.tsx` | **Modify** -- full replace sync instead of additive |

---

## Technical Notes

- The AI chat edge function will use `LOVABLE_API_KEY` (already configured) to call Lovable AI models
- Dashboard revenue/order metrics will exclude Pending and Cancelled orders
- Inventory count will be computed from real product data summing all `inventory` fields
- Low stock count will use `settings.lowStockThreshold` against each product's inventory
- Charts will show real order data grouped by date (last 7 days)
