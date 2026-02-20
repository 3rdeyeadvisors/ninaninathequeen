

# Fix: Spreadsheet Upload Hanging + Build Error

## Two Issues to Fix

### Issue 1: Spreadsheet Upload Takes Forever

The spreadsheet has columns: **Item ID, Item name, Type, Price Per Unit, Stock, Price, Status**

The "Status" column contains text values like **"Ordered"** and **"In stock"**. However, the upload code on line 161 of `useSpreadsheetSync.ts` does this:

```
const ordered = row.status ? parseInt(row.status) : NaN;
```

Since "Ordered" and "In stock" are not numbers, `parseInt` returns `NaN`, so the math is fine. But the real performance problem is that the `status` field is being parsed *twice* -- once as a numeric "ordered quantity" add-on, and again as a product status string. When the status is "Ordered", the normalization logic on line 213 matches `statusLower.includes('order')` and maps it to "Active", which is correct.

The actual hang is likely coming from the edge function call or the `fetchProducts()` call after sync. With ~55 rows grouping into ~30+ products, plus the edge function doing auth validation, admin role check, upsert, and store_settings query -- combined with `fetchProducts()` doing a second full table read immediately after -- this can cause a noticeable delay or timeout, especially if the user's auth session is stale.

**Fix:** The spreadsheet columns are already mapped correctly (`Item ID` -> `id`, `Item name` -> `title`, etc.). The potential hang comes from:
1. A stale or missing auth session causing the edge function to hang waiting for a response
2. The `fetchProducts()` call immediately after `bulkUpsertProducts()` doing redundant work

I will add a timeout wrapper around the edge function call and improve error reporting so the user sees what's actually failing instead of an infinite spinner.

### Issue 2: Build Error in Account.tsx

The `User` interface in `authStore.ts` does not have a `birthMonth` property, but `Account.tsx` line 85 references `cloudAuth.user.birthMonth`. The `CloudAuthUser` interface *does* have `birthMonth`, so the combined type creates a union where `birthMonth` doesn't exist on the legacy `User` type.

**Fix:** Add `birthMonth?: number` to the `User` interface in `authStore.ts`.

## Changes

### File 1: `src/stores/authStore.ts`
- Add `birthMonth?: number` to the `User` interface (line 22, before the closing brace)

### File 2: `src/hooks/useSpreadsheetSync.ts`
- Add a timeout mechanism around the `bulkUpsertProducts` call so it doesn't hang forever (wrap in `Promise.race` with a 30-second timeout)
- Improve error messaging: if timeout occurs, show a toast explaining the upload may still be processing
- Remove the redundant `await fetchProducts()` after successful sync -- the `syncWithEdgeFunction` already updates the local store from the returned data, making the extra fetch unnecessary and a source of delay

### File 3: `src/hooks/useProductsDb.ts`
- No changes needed -- the sync logic is correct

### File 4: `src/lib/spreadsheet.ts`
- No changes needed -- the column mappings already match the spreadsheet format exactly:
  - "Item ID" -> `id`
  - "Item name" -> `title`  
  - "Type" -> `producttype`
  - "Price Per Unit" -> `unitcost`
  - "Stock" -> `inventory`
  - "Price" -> `price`
  - "Status" -> `status`

## Summary of What Gets Fixed
1. Build error resolved by adding `birthMonth` to legacy User type
2. Spreadsheet upload no longer hangs -- timeout protection added, redundant DB fetch removed
3. All column mappings verified against the actual spreadsheet format -- no changes needed there

