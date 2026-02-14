

# Fix Logo "N" Clipping + Create Branded Link Share Image

## Issue 1: Logo "N" Being Cut Off

**Root cause**: The `.gradient-gold-text` CSS class uses `background-clip: text` which clips rendering to the text bounds. The Parisienne font's cursive "N" has a leftward flourish that extends beyond the normal text bounding box. The current horizontal padding of `0.1em` is insufficient for this flourish. Additionally, the header wraps the logo in scaled containers (`scale-[0.6]`, `scale-75`) which compound the issue.

**Fix (multiple points)**:

1. **`src/index.css`** - Increase the horizontal padding in `.gradient-gold-text` from `0.1em` to `0.3em` (and the negative margin accordingly) to give the "N" flourish enough room to render fully within the clipped area.

2. **`src/components/Logo.tsx`** - Add explicit left padding (`pl-2`) on the h1 element to give extra breathing room for the flourish. Ensure the entire motion.div and its children have `overflow-visible`.

3. **`src/components/Header.tsx`** - Add `overflow-visible` to the Logo's parent link containers on both desktop (line 78) and mobile (line 156) to prevent any ancestor from clipping the scaled content.

4. **`src/components/checkout/CheckoutHeader.tsx`** - Same fix: add `overflow-visible` to the logo link wrapper (line 23).

After changes, I will visually verify in the browser that the "N" renders fully at all viewport sizes.

## Issue 2: Branded Link Share (OG) Image

**Current state**: The `og:image` meta tag in `index.html` points to a generic Unsplash beach photo that has nothing to do with the brand.

**Fix**: Create a proper branded OG image using a backend function that generates a clean, on-brand share card:

1. **Create `supabase/functions/og-image/index.ts`** - A backend function that generates a 1200x630 SVG rendered as an image with:
   - Black background matching the site theme
   - "Nina Armend" in elegant serif typography (centered)
   - "Brazilian Swimwear" subtitle underneath with gold accent lines
   - Clean, minimal luxury layout matching the brand aesthetic

2. **Update `index.html`** - Change the `og:image` and `twitter:image` meta tags to point to the backend function URL so the image is always on-brand and consistent.

3. **Update `src/components/SEO.tsx`** - Ensure the OG image meta tag is set to the backend function URL dynamically.

## Testing Plan

1. After Logo fix: Navigate to the homepage on both desktop and mobile viewports, take screenshots, and visually confirm the "N" is fully visible with no clipping
2. After OG image: Call the backend function directly to verify it returns a valid PNG image with the branded design
3. Test the OG image URL renders correctly in browser
