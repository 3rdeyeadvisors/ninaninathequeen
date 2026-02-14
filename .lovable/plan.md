

# Fix Logo Clipping + Update Email Branding

## 1. Fix the "N" clipping in the Logo component

**File:** `src/components/Logo.tsx`

The Parisienne cursive font has tall flourishes (especially on capital letters like "N") that get clipped by the container. The fix:

- Add more generous vertical padding (`py-2` or `py-3` instead of `py-1`) to give the flourishes room
- Add `leading-[1.4]` or similar increased line-height to prevent the top of the "N" from being cut
- Ensure the parent containers in Header.tsx aren't constraining height (the `scale-[0.6]` wrappers should be fine since scale doesn't affect layout)

Specific change on line 11: increase `leading-relaxed` to a custom value like `leading-[1.5]` and add top padding to the h1 itself with `pt-2` to give the capital N descender room above.

## 2. Update email templates with cursive font + San Antonio address

**File:** `supabase/functions/send-email/index.ts`

Three changes in the `baseWrapper` function:

- **Line 29 (head section):** Add a Google Fonts link for Parisienne before the style block:
  ```html
  <link href="https://fonts.googleapis.com/css2?family=Parisienne&display=swap" rel="stylesheet">
  ```

- **Line 34 (.logo-text CSS):** Change from:
  ```css
  font-size:28px;letter-spacing:4px;font-weight:300;text-transform:uppercase;font-family:'Georgia',serif;
  ```
  To:
  ```css
  font-size:36px;font-weight:400;font-family:'Parisienne',cursive,'Georgia',serif;
  ```
  (Remove uppercase, remove letter-spacing, increase size for cursive readability)

- **Line 68:** Change `Leblon, Rio de Janeiro, Brazil` to `San Antonio, Texas`

## 3. Testing

After both changes are made:
- Visually verify the Logo on the site to confirm the "N" is no longer clipped at any screen size
- Trigger a test waitlist signup to verify the email renders with the cursive font and the San Antonio address in the footer

