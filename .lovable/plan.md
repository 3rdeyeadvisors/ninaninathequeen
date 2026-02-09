

## Add Bidirectional Square Sync Button

### What You'll Get

A "Sync with Square" button on the Products page that performs a **full bidirectional sync**:
1. **Pull from Square** - Gets the latest products and inventory from your Square catalog
2. **Push to Square** - Sends your local inventory updates back to Square
3. **Refresh the product list** - Shows the updated data immediately

---

### Implementation

| File | Change |
|------|--------|
| `src/hooks/useSquareSync.ts` | Add new `syncBidirectional` function that does pull → push in sequence |
| `src/pages/admin/Products.tsx` | Add "Sync with Square" button with loading state |

---

### Technical Details

**New bidirectional sync function in `useSquareSync.ts`:**

```typescript
const syncBidirectional = useCallback(async (): Promise<{
  pullResult: SyncResult | null;
  pushResult: SyncResult | null;
}> => {
  // Step 1: Pull from Square first (get latest products)
  const pullResult = await pullFromSquare();
  
  // Step 2: Push local changes to Square
  const pushResult = await pushToSquare();
  
  return { pullResult, pushResult };
}, [pullFromSquare, pushToSquare]);
```

**New button in Products.tsx toolbar:**

```tsx
<Button
  variant="outline"
  onClick={async () => {
    const { pullResult, pushResult } = await syncBidirectional();
    if (pullResult?.success || pushResult?.success) {
      await fetchProducts(); // Refresh the product list
    }
  }}
  disabled={isSyncing || settings.posProvider !== 'square'}
>
  {isSyncing ? <Loader2 className="animate-spin" /> : <RefreshCw />}
  Sync with Square
</Button>
```

---

### User Experience

1. Click "Sync with Square" on the Products page
2. See loading spinner while syncing
3. Get toast notifications:
   - "Synced X products from Square" (pull result)
   - "Pushed X inventory updates to Square" (push result)
4. Product list automatically refreshes with latest data

---

### Requirements

- Square must be configured as POS provider in Settings
- Square Access Token must be saved (stored securely in backend)
- Button will be disabled if Square is not configured

