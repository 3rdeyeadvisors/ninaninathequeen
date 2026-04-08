

## Update $10 Off Badge to Only Show for Products with Matching Counterparts

Currently, the "$10 off set" badge and "Save $10" message display on **every** Top or Bottom product, regardless of whether a matching counterpart exists in the catalog. This plan updates all related logic so these indicators only appear when the matching piece (same collection) is actually available.

### Changes

**1. `src/components/ProductCard.tsx`** — Make badge collection-aware
- Instead of `hasMatchingSet = isTopOrBottom && !isTopAndBottom`, use the full product list to check if a counterpart from the same collection (via `getCollectionKey`) exists.
- Import `useProducts` and `getCollectionKey`.
- Compute: find any product in the catalog where (a) it's the opposite category (Top↔Bottom) and (b) `getCollectionKey(title)` matches. Show badge only if found.

**2. `src/pages/ProductPage.tsx`** — Make "Save $10" message collection-aware
- Same logic: only show the "Save $10 when you buy the matching bottom/top" text if a counterpart product with the same collection key actually exists in the catalog.
- Import `useProducts` and `getCollectionKey`, check against all products.

**3. `src/components/CartDrawer.tsx`** — Make upsell smarter
- Currently upsells any random Top/Bottom. Update to prefer a product from the **same collection** as the item in cart, using `getCollectionKey` matching.

**4. No changes needed to:**
- `src/lib/utils.ts` (`calculateSetDiscount`) — already correctly matches by collection key
- `src/lib/constants.ts` — no changes
- `src/pages/MixAndMatch.tsx` — Mix & Match page lets users pick any combination; discount logic there is already correct
- `src/pages/Checkout.tsx` — uses `calculateSetDiscount` which is already correct
- `supabase/functions/create-square-checkout/index.ts` — already correct
- `src/test/utils.test.ts` — existing tests remain valid

### Technical details

The key function `getCollectionKey(title)` strips "Top"/"Bottom"/"Bikini Top"/"Bikini Bottom" suffixes to get a collection identifier (e.g., "Maravilhosa Top" → "maravilhosa"). We'll reuse this in ProductCard and ProductPage to cross-reference the catalog.

In ProductCard, we'll call `useProducts()` (already cached via Zustand) and filter with:
```typescript
const hasMatchingSet = isTopOrBottom && !isTopAndBottom && allProducts.some(p => {
  const oppositeCategory = product.category === 'Top' ? 'Bottom' : 'Top';
  return p.category === oppositeCategory && 
         getCollectionKey(p.title) === getCollectionKey(product.title) &&
         p.id !== product.id;
});
```

### Files modified
- `src/components/ProductCard.tsx`
- `src/pages/ProductPage.tsx`  
- `src/components/CartDrawer.tsx`

