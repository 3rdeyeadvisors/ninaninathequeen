

# Category Restructuring Plan

## Summary
Reorganize the customer-facing navigation categories to focus on **Tops**, **Bottoms**, **One-Pieces**, and **Mix & Match** rather than Bikinis and Cover-ups.

## What Will Change

### Navigation Structure (Before → After)

| Current | New |
|---------|-----|
| Shop All | Shop All |
| Mix & Match | Mix & Match |
| Fitting Room | Fitting Room |
| Bikinis | **Tops** |
| One-Pieces | **Bottoms** |
| Cover-ups | **One-Pieces** |

### Category Showcase on Homepage (Before → After)

| Current | New |
|---------|-----|
| Bikinis | **Tops** - "Mix & match your style" |
| One-Pieces | **Bottoms** - "Complete your look" |
| Cover-ups | **One-Pieces** - "Elegant & sophisticated" |

Optional: Add a 4th card for **Mix & Match** to showcase the feature prominently.

### Footer Shop Links (Before → After)

| Current | New |
|---------|-----|
| All Products | All Products |
| Bikinis | **Tops** |
| One-Pieces | **Bottoms** |
| Cover-ups | **One-Pieces** |

---

## Files to Update

### 1. Header Navigation
**File:** `src/components/Header.tsx`
- Update `navLinks` array to replace Bikinis/Cover-ups with Tops/Bottoms/One-Pieces

### 2. Category Showcase Component
**File:** `src/components/CategoryShowcase.tsx`
- Replace the 3 categories (Bikinis, One-Pieces, Cover-ups) with Tops, Bottoms, One-Pieces
- Update descriptions and links to match

### 3. Footer Links
**File:** `src/components/Footer.tsx`
- Update the `shop` array to use Tops, Bottoms, One-Pieces instead of Bikinis/Cover-ups

### 4. Shop Page Category Titles
**File:** `src/pages/Shop.tsx`
- Update the `categoryTitles` mapping to handle `tops`, `bottoms`, and `one-pieces` URL params

### 5. Product Filtering (useProducts hook)
**File:** `src/hooks/useProducts.ts`
- Update the query filter to match products by their `category` field (Top, Bottom, One-Piece) rather than text matching

---

## Technical Details

The admin dashboard already uses the correct categories internally (`Top`, `Bottom`, `Top & Bottom`, `One-Piece`, `Other`). The changes needed are purely on the customer-facing side to align navigation with how products are actually categorized in the database.

The **Mix & Match** page already correctly filters products by `category === 'Top'` and `category === 'Bottom'`, so Tops and Bottoms will automatically appear there while also having their own dedicated shop pages.

---

## No Database Changes Required
The product `category` field in the database already supports: Top, Bottom, Top & Bottom, One-Piece, Other - no schema updates needed.

