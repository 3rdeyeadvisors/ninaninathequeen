

# Fix: Remove Mock Data and Restore Database-Only Product Display

## Problem Summary

When you uploaded your spreadsheet, the products either:
- Failed to save to the database (possibly due to a column mismatch or upsert error)
- Got saved but were later cleared

The app is now showing **hardcoded fake products** ("Copacabana Triangle Top", "Ipanema Bandeau Top", etc.) from `src/lib/mockData.ts` instead of your real inventory.

## Solution

### 1. Modify `useProducts.ts` to Use Database Only
Remove the dependency on mock data. Products should ONLY come from:
- The database (via `useProductsDb` fetch)
- The `productOverrides` store (for unsaved changes)

The mock products will no longer pollute your real inventory.

### 2. Update `useSpreadsheetSync.ts` for Better Error Handling
Add detailed logging so we can see exactly what happens when you upload a spreadsheet:
- Log the parsed rows
- Log any database errors with full details
- Show success/failure counts

### 3. Fix Square Sync Edge Function
The edge function needs to map Square's API response correctly to your database schema, ensuring:
- Products have required fields (`productType`, `sizes`)
- Proper error handling with detailed messages

### 4. Re-upload Your Spreadsheet
Once fixed, you'll upload your real spreadsheet again and the products will persist properly.

---

## Technical Details

### File Changes

#### `src/hooks/useProducts.ts`
- Remove `MOCK_PRODUCTS` import and usage
- Only return products from `productOverrides` (which are synced from database)
- Ensure empty state is handled gracefully

#### `src/lib/mockData.ts`  
- Clear the `MOCK_PRODUCTS` array (or delete the file if unused elsewhere)

#### `src/hooks/useSpreadsheetSync.ts`
- Add `console.log` statements to track:
  - Number of rows parsed
  - Products being upserted
  - Database response/errors

#### `supabase/functions/square-sync-inventory/index.ts`
- Add detailed logging for Square API responses
- Handle missing/optional fields gracefully
- Return detailed sync results

---

## After Implementation

1. Your admin dashboard will start **empty** (no fake products)
2. Upload your real spreadsheet - products will save to database
3. Use "Pull from Square" to sync from your Square catalog
4. All product data will persist across sessions and devices

