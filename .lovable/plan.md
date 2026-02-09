

## Speed Up Product Deletion

### Current Problem

Deleting products is extremely slow because:

1. **Sequential processing** - Each product waits for the previous one to finish
2. **Double API calls per product** - Every delete triggers both a database sync AND a Square sync
3. **No batching** - 10 products = 20 network requests in sequence

### The Fix

| File | Change |
|------|--------|
| `src/hooks/useProductsDb.ts` | Add `bulkDeleteProducts` function that batches all deletions into a single API call |
| `src/pages/admin/Products.tsx` | Use the new bulk delete function instead of looping |
| `supabase/functions/sync-products/index.ts` | Ensure batch upserts handle deletions efficiently |

### Technical Details

**New bulk delete function:**
```typescript
const bulkDeleteProducts = useCallback(async (productIds: string[]) => {
  // Get all products to delete with isDeleted: true
  const productsToDelete = productIds.map(id => {
    const existingOverride = useAdminStore.getState().productOverrides[id];
    return existingOverride
      ? { ...existingOverride, isDeleted: true }
      : { id, isDeleted: true };
  });
  
  // Single API call for all products
  return await syncWithEdgeFunction(productsToDelete as ProductOverride[]);
}, []);
```

**Updated bulk delete in Products.tsx:**
```typescript
const bulkDelete = async () => {
  setIsSyncing(true);
  const success = await bulkDeleteProducts(Array.from(selectedProducts));
  if (success) {
    selectedProducts.forEach(id => deleteProduct(id));
    toast.success(`${selectedProducts.size} products deleted`);
  }
  setSelectedProducts(new Set());
  setShowBulkDeleteConfirm(false);
  setIsSyncing(false);
};
```

### Performance Improvement

| Before | After |
|--------|-------|
| 10 products = 20 API calls (sequential) | 10 products = 2 API calls (batched) |
| ~20-30 seconds for 10 products | ~2-3 seconds for 10 products |

### After the Fix

1. Bulk deletes will be nearly instant
2. Single product deletes will also be faster (no unnecessary Square sync if not configured)
3. No more waiting forever when managing inventory

