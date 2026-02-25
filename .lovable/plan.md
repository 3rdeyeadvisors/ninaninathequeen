

# Fix Email Deliverability and Clickable Links

## Problems

1. **Emails going to spam**: The email body background is `#000000` (black). Many email clients flag dark-bodied emails as suspicious. Additionally, spam filters penalize emails that rely on `<style>` blocks because they look like phishing attempts.

2. **Links not clickable**: The call-to-action buttons use CSS classes (`.btn`) defined in a `<style>` block. Gmail, Outlook, and most email clients strip `<style>` tags entirely, so the buttons lose all their styling and sometimes become invisible (black text on black background) or unclickable.

## Solution

Rewrite the `baseWrapper` function and all email templates in `supabase/functions/send-email/index.ts` to use **inline styles only** and a **white body background**, while keeping the luxury black-and-gold branding for inner content cards.

### Changes to `supabase/functions/send-email/index.ts`

1. **White body background** -- Change the outermost `<body>` and container background from `#000000` to `#ffffff`. This prevents spam flagging and ensures proper rendering in dark-mode email clients (which auto-invert light backgrounds).

2. **Inner card styling preserved** -- Keep the black/gold luxury feel inside content cards (`background: #000000` on inner `<div>` sections), so the brand aesthetic is maintained.

3. **All inline styles** -- Remove the entire `<style>` block. Convert every CSS class (`.btn`, `.card`, `.muted`, `.highlight`, `.points-badge`, etc.) to inline `style=""` attributes directly on each HTML element.

4. **Buttons as `<a>` tags with full inline styles** -- Every CTA button will use inline styles like:
   ```html
   <a href="..." style="display:inline-block;background:#C9A96E;color:#000000;padding:16px 40px;border-radius:50px;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:2px;text-transform:uppercase;font-family:'Helvetica Neue',Arial,sans-serif;">
     Shop Now
   </a>
   ```

5. **Links always visible** -- All `<a>` tags get explicit `color` and `text-decoration` inline styles so they're always visible and clickable regardless of email client.

6. **Remove Google Fonts `<link>`** -- External font imports are blocked by most email clients. Fall back to `Georgia, serif` (already the fallback) without the Parisienne `@import`.

### Scope of Changes

- **1 file modified**: `supabase/functions/send-email/index.ts`
  - `baseWrapper()` function rewritten with white body, inline-styled inner container, no `<style>` block
  - All 12 template functions updated to use inline styles instead of CSS classes
- **1 deployment**: Redeploy the `send-email` edge function

### What Stays the Same

- All email types and their content/copy remain identical
- The black-and-gold brand colors are preserved (just moved to inner cards instead of the body)
- The "Nina Armend" logo text, footer links, and overall layout structure stay the same
- No changes to the sending logic, authentication, or routing code

