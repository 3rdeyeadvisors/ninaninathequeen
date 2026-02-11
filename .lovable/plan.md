

# Shipping, Address Display, and Manual Orders

## Overview

Three enhancements to give the admin full order management: see customer shipping addresses, offer tiered shipping rates at checkout, and manually create orders that track inventory.

---

## Feature 1: Display Shipping Address in Admin Orders

The shipping address is already being saved from Square into the `shipping_address` column. It just needs to be shown in the admin UI.

### Changes
- **`src/pages/admin/Orders.tsx`** -- Add a "Shipping Address" section to the Order Details (view) dialog, reading from the order's `shipping_address` field
- **`src/stores/adminStore.ts`** -- Add `shippingAddress` (optional object) to the `AdminOrder` interface
- **`src/hooks/useOrdersDb.ts`** -- Map `shipping_address` from the database to the store's `shippingAddress` field when fetching orders

---

## Feature 2: Shipping Options at Checkout

Replace the current flat $12.50 / free-over-2-sets logic with tiered shipping options the customer can choose from.

### Shipping Tiers
- **Standard Domestic (US)**: $8.50 (5-7 business days)
- **Express Domestic (US)**: $15.00 (2-3 business days)
- **International**: $22.00 (7-14 business days)
- **Free Shipping**: Still applies when 2+ bikini sets are in the cart (overrides any tier to $0)

### Changes
- **`src/pages/Checkout.tsx`** -- Add a shipping method selector (radio group) below the contact info card. The selected tier's cost replaces the old flat rate. Free shipping override still applies when eligible.
- **`src/lib/constants.ts`** -- Add `SHIPPING_OPTIONS` array with label, price, and estimated delivery for each tier, keeping it easy for the admin to adjust later.

---

## Feature 3: Manual Order Creation (Admin)

Allow the admin to create orders manually for POS sales, phone orders, or custom orders. These orders will decrement inventory just like online orders.

### Changes

**`src/pages/admin/Orders.tsx`** -- Add a "Create Order" button and dialog with:
- Customer name and email fields
- Product selector (dropdown from existing products in the store)
- Size selector per product
- Quantity per item
- Shipping cost and item cost (COGS) fields
- Status defaults to "Processing" (since it's already paid via POS/phone)
- On save: inserts order into database, decrements inventory for each item (both total `inventory` and `size_inventory`), and updates the local store

**`src/hooks/useOrdersDb.ts`** -- Add a `createManualOrder` function that:
1. Inserts the order record into the `orders` table
2. For each item, fetches the product, decrements `inventory` and `size_inventory`, and updates the product in the database
3. Updates the local admin store with the new order

---

## What Stays the Same

- Square handles payment and collects the shipping address for online orders (no changes to edge functions)
- The `finalize-square-order` function continues to extract the address and decrement inventory for online orders
- POS page and `process-payment` edge function remain untouched
- The edit order dialog keeps its current fields (status, tracking, shipping/item cost)

---

## Technical Execution Order

1. Update `AdminOrder` interface to include `shippingAddress`
2. Update `useOrdersDb` to map `shipping_address` from DB and add `createManualOrder`
3. Add `SHIPPING_OPTIONS` to constants
4. Update `Checkout.tsx` with shipping tier selector
5. Update `Orders.tsx` with shipping address display in view dialog + manual order creation dialog

