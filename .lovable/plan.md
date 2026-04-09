

## Fix: Mix & Match Page Shows $10 Off for Non-Matching Sets

### Problem
The Mix & Match page **always** displays the $10 discount on the "Add Set to Bag" button, regardless of whether the selected top and bottom are from the same collection. However, the actual checkout logic (`calculateSetDiscount`) only applies the discount to **matching** sets (same `getCollectionKey`). This means users see a discounted price on the page but get charged the full price at checkout when items don't match.

### Fix

**`src/pages/MixAndMatch.tsx`** — Conditionally show the discount based on collection key matching.

1. Import `getCollectionKey` from `@/lib/utils`.
2. Compute `isMatchingSet` by comparing `getCollectionKey(currentTop.title) === getCollectionKey(currentBottom.title)`.
3. Update the "Add Set to Bag" button:
   - **Matching set**: show strikethrough original price + discounted price (current behavior).
   - **Non-matching set**: show only the combined price, no strikethrough or discount text.
4. Optionally add a small label like "Matching set — save $10!" when `isMatchingSet` is true, so users understand when the discount applies.

### Files modified
- `src/pages/MixAndMatch.tsx`

