
# Fix: POS Inventory Sync + Size Dialog Hidden Behind Header

## Issues Being Fixed

**1. Build Error (useCartSync.ts)**
The wishlist sync hook queries the `products` table for a column called `handle` — but that column does not exist in the database. The actual database schema has: `id`, `title`, `image`, `images` (array), `price`. This causes a TypeScript compile error and breaks the entire app build.

**2. Size Dialog Hidden by Header (POS Page)**
When you click a product on the POS/manual orders page, a "Select Size" popup appears — but it renders behind or clipped by the fixed header at the top of the page. This makes some size options invisible, giving the impression that products or sizes are missing.

---

## Fix 1 — useCartSync.ts (Build Error)

Remove `handle` from the product query since it doesn't exist in the database. The wishlist store item uses `handle` for routing, so we'll construct it from `title` the same way the rest of the app does (lowercased, spaces replaced with dashes).

**Change:** In the `.select('id, title, handle, images, price')` query, remove `handle` and derive it from `title`:

```
.select('id, title, image, images, price')
```

Then build `handle` as: `p.title.toLowerCase().replace(/\s+/g, '-')`

And for the image, use the `images` array first (falling back to `image`).

---

## Fix 2 — POS Size Dialog (Header Overlap)

The `Dialog` for selecting a size currently uses the default Radix `DialogContent`, which positions itself in the viewport center. With a tall fixed header (~120-160px), the dialog can be pushed partially behind it on some screen sizes.

**Changes:**
- Add `top-[160px]` positioning override or ensure the dialog has enough top margin to clear the header
- Add `max-h-[calc(100vh-200px)] overflow-y-auto` to the dialog content so it's fully scrollable and never cut off
- The dialog already renders via a Radix portal, so it just needs explicit vertical positioning to clear the header

---

## Technical Details

**File 1: `src/hooks/useCartSync.ts`**

- Line 63: Change `.select('id, title, handle, images, price')` → `.select('id, title, image, images, price')`
- Line 68–74: Remove `handle: p.handle`, replace with `handle: p.title.toLowerCase().replace(/\s+/g, '-')`, and fix image to read from `images` array or fall back to `image`

**File 2: `src/pages/admin/POS.tsx`**

- Line 536: Update `DialogContent` className to include proper top margin / max-height so it clears the header and stays fully visible:
  ```
  className="sm:max-w-[400px] bg-background border-primary/20 shadow-gold mt-20 max-h-[calc(100vh-180px)] overflow-y-auto"
  ```

These are minimal, targeted changes with no impact on other pages or functionality.
