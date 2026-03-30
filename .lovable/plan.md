

## Plan: Remove Hero Background Image

Remove the Unsplash background image from the hero section entirely. The gradient overlays will serve as the background instead.

### Changes

**`src/components/Hero.tsx`**:
1. Remove the `HERO_IMAGE` constant
2. Remove the `<img>` tag (lines 15–19)
3. Keep the existing gradient overlays as the background

