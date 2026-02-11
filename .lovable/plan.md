
# Shipping Simplification, Tax Removal, and Admin Dashboard Polish

## Overview

Three changes bundled together: (1) replace tiered shipping with a single admin-configurable flat rate, (2) remove all local tax calculations (let Square handle it), and (3) clean up the admin settings layout to keep things smooth and intuitive.

---

## 1. Database: Add `shipping_rate` Column

Add a `shipping_rate` numeric column to `store_settings` with a default of `8.50`. No RLS changes needed -- existing admin-only policies cover it.

---

## 2. Replace Tiered Shipping with Flat Rate

### `src/lib/constants.ts`
- Remove the `ShippingOption` interface and `SHIPPING_OPTIONS` array entirely
- Keep `PRODUCT_SIZES` as-is

### `src/stores/adminStore.ts`
- Remove `taxRate` from `AdminSettings` interface and `INITIAL_SETTINGS`
- Add `shippingRate: number` (default `8.50`) to `AdminSettings` and `INITIAL_SETTINGS`

### `src/pages/Checkout.tsx`
- Remove `SHIPPING_OPTIONS` import, `selectedShipping` state, `RadioGroup` imports
- Remove `taxRate`, `taxAmount` calculations
- Read `settings.shippingRate` from admin store for shipping cost
- Replace the shipping tier selector card with a simple display showing the flat rate (or "Free" for 2+ sets)
- Add note: "International orders may take 7-14 business days for delivery."
- Remove "Estimated Tax" line from order summary; add note: "Tax calculated by payment provider"
- Update total to `subtotal + shippingCost` (no tax)
- Remove `taxAmount` from `orderDetails` sent to Square

---

## 3. Remove Tax from POS

### `src/pages/admin/POS.tsx`
- Remove `taxAmount` calculation in both `POSCheckoutDialog` and `AdminPOS` components
- Remove the "Tax" line from the checkout dialog summary
- Update `total` / `cartTotal` to just `subtotal` (no tax added)
- Add a small note: "Tax calculated by payment provider"

---

## 4. Update Settings Sync Layer

### `src/hooks/useSettingsDb.ts`
- Stop reading/writing `tax_rate`
- Add reading/writing `shipping_rate` mapped to `shippingRate`

### `src/providers/DbSyncProvider.tsx`
- Remove `taxRate` mapping line
- Add `shippingRate` mapping from `shipping_rate`

---

## 5. Admin Settings Page Cleanup

### `src/pages/admin/Settings.tsx`
- Remove the "Tax Rate (%)" input field from "General Configuration"
- Add a "Flat Shipping Rate ($)" input field to the "Regional and Shipping" card, so the admin can update it anytime
- Keep the existing layout structure (2-column grid with save/status sidebar)

---

## What the Customer Sees at Checkout

Instead of choosing between Standard/Express/International:

```text
Shipping: $8.50  (or whatever the admin sets)
International orders may take 7-14 business days for delivery.
Tax calculated by payment provider.
```

Or with 2+ bikini sets:

```text
Shipping: Free!
You qualify with 2+ bikini sets.
```

---

## What the Admin Sees in Settings

In the "Regional and Shipping" card, a new input:

```text
Flat Shipping Rate ($): [8.50]
```

The "Tax Rate (%)" field is removed entirely.

---

## Files Changed Summary

| File | Change |
|------|--------|
| Database migration | Add `shipping_rate` column |
| `src/lib/constants.ts` | Remove `SHIPPING_OPTIONS` and `ShippingOption` |
| `src/stores/adminStore.ts` | Remove `taxRate`, add `shippingRate` |
| `src/pages/Checkout.tsx` | Flat rate shipping, remove tax, add notes |
| `src/pages/admin/POS.tsx` | Remove tax calculation and display |
| `src/pages/admin/Settings.tsx` | Remove tax input, add shipping rate input |
| `src/hooks/useSettingsDb.ts` | Swap `tax_rate` for `shipping_rate` mapping |
| `src/providers/DbSyncProvider.tsx` | Swap `taxRate` for `shippingRate` mapping |
