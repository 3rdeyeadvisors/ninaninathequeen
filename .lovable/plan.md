

## Complete Plan: Logo Fix, Customer Stats, Spreadsheet Download/Upload, Unit Cost, and Profit Tracking

This plan covers all the remaining items from your original request.

---

### 1. Fix the Logo Being Chopped Off

The cursive font (Parisienne) has descenders and ascenders that get clipped. Add `overflow-visible` and vertical padding to prevent any letters from being cut off.

**File:** `src/components/Logo.tsx`
- Add `overflow-visible py-1` to the outer container
- Add `overflow-visible` to the h1 element

---

### 2. Fix Customer Audience Hardcoded Stats

Replace the three fake stat cards at the bottom of the Customers page with real calculated values:

| Current (Fake) | New (Real) |
|---|---|
| Avg. Life Value: $425.50 | Calculated from customers' actual `totalSpent` averages |
| Repeat Purchase Rate: 64% | Percentage of customers with more than 1 order |
| Newsletter Subs: 892 | Replaced with **Total Revenue** (sum of all customer spending) |

**File:** `src/pages/admin/Customers.tsx`
- Add `useMemo` calculations using the existing `customers` array from the store
- Update the three stat card values and rename "Newsletter Subs" to "Total Revenue"

---

### 3. Download Spreadsheet Button

Change the "Template" button to export actual product data instead of mock data.

**File:** `src/hooks/useSpreadsheetSync.ts`
- Rename `downloadTemplate` to `downloadSpreadsheet`
- Export real product data (title, category, selling price, unit cost, stock, collection, status, item number, colors) as CSV

**File:** `src/pages/admin/Products.tsx`
- Change button label from "Template" to "Download Spreadsheet"
- Update the function reference

---

### 4. Fix Spreadsheet Upload Column Mapping

Your spreadsheet columns have specific meanings that differ from what the system currently assumes:

| Spreadsheet Column | What It Means | Current Behavior | New Behavior |
|---|---|---|---|
| **Price Per Unit** | What she paid per item (her cost) | Maps to selling price | Maps to `unitCost` (cost of goods) |
| **Stock** | Current inventory count | Maps to inventory | No change -- stays as inventory |
| **Status** | Additional units ordered on top of stock | Maps to Active/Inactive/Draft | Treated as ordered quantity, added to stock total |

**File:** `src/lib/spreadsheet.ts`
- Map "price per unit" to `unitcost` instead of `price`
- Add mapping for "ordered" / "on order" to a new `ordered` field
- Keep "status" as-is for Active/Inactive but also parse numeric status values as ordered quantity

**File:** `src/hooks/useSpreadsheetSync.ts`
- Use `unitcost` field from parsed rows to populate the new `unitCost` on products
- If status is a number, treat it as ordered quantity and add to inventory
- Selling price must come from a "Price" or "Selling Price" column (or be set manually in admin)

---

### 5. Add Unit Cost to Products (Database + Store + UI)

**Database Migration:**
- Add `unit_cost text DEFAULT '0.00'` to the `products` table

**File:** `src/stores/adminStore.ts`
- Add `unitCost?: string` to `ProductOverride` interface

**File:** `src/hooks/useProductsDb.ts`
- Map `unit_cost` / `unitCost` in fetch and upsert operations

**File:** `src/pages/admin/Products.tsx`
- Add "Unit Cost" field in the product editor dialog
- Show unit cost column in the products table

---

### 6. Profit Tracking

With unit cost stored per product, the dashboard can calculate real profit:

**Profit Formula:** Revenue - (Unit Cost x Quantity for each item) - Shipping Cost

**File:** `src/pages/admin/Dashboard.tsx`
- Update `totalNetProfit` calculation: instead of relying only on the manually entered `itemCost` per order, auto-calculate COGS by looking up each order item's `unitCost` from `productOverrides`
- Fall back to the manual `itemCost` field if unit costs aren't available

**File:** `src/pages/admin/Orders.tsx`
- Show a calculated profit line in the order detail view
- Auto-populate item cost from unit costs when available

The admin can still manually set shipping cost per order (already works), and this feeds into the profit calculation.

---

### Technical Summary of All Changes

1. **Database migration:** Add `unit_cost` column to `products` table
2. **`src/components/Logo.tsx`** -- overflow-visible + padding fix
3. **`src/stores/adminStore.ts`** -- Add `unitCost` to `ProductOverride`
4. **`src/lib/spreadsheet.ts`** -- Remap "price per unit" to `unitcost`, handle numeric status as ordered quantity
5. **`src/hooks/useSpreadsheetSync.ts`** -- Use `unitcost`, handle ordered qty, rename download function to export real data
6. **`src/hooks/useProductsDb.ts`** -- Map `unit_cost` in fetch/upsert
7. **`src/pages/admin/Products.tsx`** -- "Download Spreadsheet" label, unit cost in editor and table
8. **`src/pages/admin/Customers.tsx`** -- Replace hardcoded stats with real calculations
9. **`src/pages/admin/Dashboard.tsx`** -- Auto-calculate COGS from unit costs for profit
10. **`src/pages/admin/Orders.tsx`** -- Show profit breakdown per order

