
# Add TikTok Icon to Maintenance Page + Transaction Fee Field for Orders

## 1. Add TikTok icon to the Maintenance page

The Maintenance page (`src/pages/Maintenance.tsx`) shows Instagram, Facebook, and Mail icons but is missing the TikTok icon. The Footer already has the fix (custom SVG), so we'll add the same TikTok SVG icon to the Maintenance page, rendered when `settings.tiktokUrl` is set.

**File:** `src/pages/Maintenance.tsx`
- Add a TikTok button block after the Facebook button (around line 196), using the same inline SVG from the Footer fix

## 2. Add "Transaction Fee" field to orders

Square charges a processing fee on each transaction. The admin needs a field to record this so it's deducted from profit calculations.

### Database migration

Add a `transaction_fee` column to the `orders` table:
```sql
ALTER TABLE orders ADD COLUMN transaction_fee text DEFAULT '0.00';
```

### Store type update

**File:** `src/stores/adminStore.ts`
- Add `transactionFee?: string` to the `AdminOrder` interface

### DB hook update

**File:** `src/hooks/useOrdersDb.ts`
- Add `transaction_fee` to `DbOrderUpdate` interface
- Map `transactionFee` in `fetchOrders`, `upsertOrder`, `updateOrderDb`, and `createManualOrder`

### Orders page updates

**File:** `src/pages/admin/Orders.tsx`

- Add `editTransactionFee` state variable alongside existing edit fields
- Populate it in `handleEdit` from `order.transactionFee`
- Include it in `saveOrderChanges` call
- Add a "Transaction Fee" input field in the **Edit Order dialog** (alongside Shipping Cost and Item Cost -- making it a 3-column grid)
- Add a "Transaction Fee" input in the **Create Manual Order dialog**
- Update the **View Order dialog** financial summary to show Transaction Fee as a deduction and adjust the displayed Profit to subtract it
- Add `transactionFee` to the `newOrder` state default and to `handleCreateOrder`

### Dashboard profit calculation update

**File:** `src/pages/admin/Dashboard.tsx`
- Update `totalNetProfit` calculation to also subtract `parseFloat(order.transactionFee || '0')` from each order's profit

### DB Sync Provider update

**File:** `src/providers/DbSyncProvider.tsx`
- Include `transaction_fee` in the order mapping within `syncOrders`

## Summary of files changed

| File | Change |
|---|---|
| `src/pages/Maintenance.tsx` | Add TikTok SVG icon button |
| `orders` table (migration) | Add `transaction_fee text DEFAULT '0.00'` column |
| `src/stores/adminStore.ts` | Add `transactionFee` to `AdminOrder` interface |
| `src/hooks/useOrdersDb.ts` | Map `transactionFee` in all CRUD operations |
| `src/pages/admin/Orders.tsx` | Add Transaction Fee input to edit/create/view dialogs; deduct from profit display |
| `src/pages/admin/Dashboard.tsx` | Deduct transaction fee from net profit calculation |
| `src/providers/DbSyncProvider.tsx` | Map `transaction_fee` in order sync |
