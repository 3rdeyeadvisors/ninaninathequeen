

## Plan: Show "$10 Off" Badge on Matching Set Products

### What changes

Currently, the "$10 off" badge and strikethrough pricing only appear on products in the "Top & Bottom" category. The user wants this badge to also appear on individual **Top** and **Bottom** products that belong to a matching set collection (i.e., their collection key exists in `MATCHING_SET_PRICES`).

The discount only applies when you buy the **matching** top + bottom together — not mixed. The badge communicates "buy the matching set and save $10."

### File: `src/components/ProductCard.tsx`

1. Import `getCollectionKey` from `@/lib/utils` and `MATCHING_SET_PRICES` from `@/lib/constants`.
2. Add logic to check if the product's title maps to a collection in `MATCHING_SET_PRICES` **and** the product is a Top or Bottom category.
3. If so, show a badge like **"$10 off as a set"** (distinct from the existing "Top & Bottom" badge) to make it clear the discount applies when paired with its match.
4. Keep existing "Top & Bottom" category discount logic unchanged.

The badge text will say something like **"$10 off set"** to indicate it's a set deal, not an individual product discount. No strikethrough pricing on the individual card — the discount only activates in cart when both pieces are present.

