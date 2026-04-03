

## Implement Universal $10 Off Matching Sets

Currently the discount logic uses a lookup table (`MATCHING_SET_PRICES`) with varying set prices per collection, so some sets get $5 off, some $10, some $12, etc. The user wants a simple, consistent rule: **any matching Top + Bottom from the same collection = $10 off**.

### What changes

**1. Simplify `calculateSetDiscount` in `src/lib/utils.ts`**
- Remove dependency on `MATCHING_SET_PRICES` lookup
- Instead: when a Top and Bottom share the same collection key, apply a flat $10 discount per matched pair
- No need to check if set price is less than combined — it's always $10 off

**2. Update `MATCHING_SET_PRICES` in `src/lib/constants.ts`**
- This constant is no longer needed for discount calculation, but keep it or replace it with a simple `MATCHING_SET_DISCOUNT = 10` constant
- Remove the per-collection price map

**3. Update `ProductCard.tsx` badge logic**
- Currently the "$10 off set" badge only shows for products whose collection key exists in `MATCHING_SET_PRICES`
- Change to: show the badge on ALL Top or Bottom products (since any matching pair qualifies)

**4. Add "$10 off as a set" messaging on `ProductPage.tsx`**
- Below the price, show a subtle banner for any Top or Bottom product: "Save $10 when you buy the matching top/bottom"

**5. Update `MixAndMatch.tsx` set price display**
- The "Add Set to Bag" button currently shows full combined price
- Show the $10 discount: crossed-out full price + discounted price

**6. Update tests in `src/test/utils.test.ts`**
- Adjust expected discount values to always be $10 per matched pair

### Files changed
- `src/lib/constants.ts` — add `MATCHING_SET_DISCOUNT`, remove `MATCHING_SET_PRICES`
- `src/lib/utils.ts` — simplify `calculateSetDiscount` to flat $10
- `src/components/ProductCard.tsx` — show badge on all Top/Bottom products
- `src/pages/ProductPage.tsx` — add set savings message
- `src/pages/MixAndMatch.tsx` — show discounted set price on CTA
- `src/test/utils.test.ts` — update expected values

