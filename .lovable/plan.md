

# Fix the "N" Clipping in the Nina Armend Logo

## The Problem

The capital "N" in "Nina Armend" has a tall cursive flourish (from the Parisienne font) that extends above the normal text line. The current gradient effect uses `background-clip: text`, which clips the gold gradient to the text's layout bounding box -- cutting off anything that extends beyond it. No amount of container padding fixes this because the clipping happens at the text element level, not the container level.

## The Fix

**File: `src/components/Logo.tsx`**

Add explicit padding to the `h1` element itself so the background (and therefore the gradient) extends far enough to cover the full flourish. The key is combining generous top padding on the text element with a negative margin to keep visual alignment:

- Add `py-4` (or larger) padding directly on the `h1` to extend the background-clip area upward
- Use negative margin (`-my-2`) to prevent the extra padding from pushing layout
- Increase `leading-[1.8]` or higher to give the line-height enough room for flourishes

Alternatively, if padding alone isn't enough, update the `.gradient-gold-text` CSS class in `src/index.css` to add `padding: 0.3em 0` and `margin: -0.3em 0` directly, ensuring all uses of the gradient gold text get the fix.

**File: `src/index.css`**

Update the `.gradient-gold-text` class to include built-in padding so the background extends beyond the text bounding box:

```css
.gradient-gold-text {
  background: linear-gradient(135deg, ...);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  padding: 0.4em 0.1em;
  margin: -0.4em -0.1em;
  display: inline-block;
}
```

This ensures the gradient background area is larger than the text's natural bounding box, so the tall flourishes on "N" and other cursive letters are fully painted.

## Testing

After making changes:
- Visually verify the logo on the maintenance/landing page (where it appears largest at `scale-150`)
- Verify the logo in the header at desktop and mobile sizes
- Confirm no layout shifts or spacing regressions from the padding/margin trick

