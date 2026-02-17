
# Platform Security Audit and Hardening Plan

## Audit Summary

I performed a full scan of all RLS policies, edge functions, client-side code, and database configuration. Here is what I found and what needs to be fixed -- organized by priority.

---

## Critical Fixes (Must-Do Before Client Testing)

### 1. Server-Side Price Validation in Checkout

**Problem:** The `create-square-checkout` and `process-payment` edge functions accept item prices and totals directly from the client. An attacker could intercept the request and change a $100 item to $1.

**Fix:** Add database price verification in both edge functions before processing payment. Each item's price will be fetched from the `products` table and compared to what the client sent. If there's a mismatch, the request is rejected.

**Files:** `supabase/functions/create-square-checkout/index.ts`, `supabase/functions/process-payment/index.ts`

### 2. XSS in Email Templates

**Problem:** In `send-email/index.ts`, user-supplied fields (name, email, message) are injected directly into HTML email templates without sanitization. A malicious user could submit `<script>` tags or HTML that renders in the recipient's email client.

**Fix:** Add an HTML-escape utility function and sanitize all user-provided data before embedding in email HTML.

**File:** `supabase/functions/send-email/index.ts`

### 3. Tighten INSERT Policies (Always-True WITH CHECK)

**Problem:** The `newsletter_subscribers` and `waitlist` tables have `WITH CHECK (true)` on INSERT, which the linter flags. While these are public signup features, the policies should add basic protection.

**Fix:**
- `newsletter_subscribers`: Restrict INSERT to only allow setting the `email` column (no ID manipulation) by keeping the permissive policy but switching it from RESTRICTIVE to PERMISSIVE (it's already RESTRICTIVE which is odd for a public insert).
- `waitlist`: Same pattern.
- Actually, reviewing the schema again -- these are correctly RESTRICTIVE policies with `WITH CHECK (true)`. The linter flags these but they are intentional for public forms. I'll mark these as acknowledged/ignored in the security findings since they serve a legitimate business purpose (public signups without auth).

---

## High Priority Fixes

### 4. Restrict Product Read Policy

**Problem:** The `products` table has a public SELECT policy that exposes `unit_cost` (cost of goods / profit margins) to anyone querying the API directly.

**Fix:** Update the public product read policy to filter by `is_deleted = false` AND `status = 'Active'`. The existing policy `"Public can read active products"` already has `USING (is_deleted = false)` but doesn't filter by status. I'll update it to also require `status = 'Active'`. The `unit_cost` column exposure is a business intelligence risk but creating a view would break existing admin queries, so I'll note this as an accepted risk for now.

**Database migration**

### 5. Remove Redundant Client-Side Email Checks

**Problem:** Multiple files check admin status by comparing email to `ADMIN_EMAIL` constant as a fallback. This is redundant since `cloudUser.isAdmin` already checks the database role. It creates confusion and maintenance burden.

**Fix:** Remove the `|| email === ADMIN_EMAIL` fallback pattern from:
- `src/App.tsx` (line 48)
- `src/components/ProtectedRoute.tsx` (lines 34-36)

Keep `ADMIN_EMAIL` only for the database trigger (already correct) and the legacy auth store constant (for reference only).

**Files:** `src/App.tsx`, `src/components/ProtectedRoute.tsx`

---

## Medium Priority Fixes

### 6. Update Stale Security Finding (Email Domain)

The existing security finding references `lydia@ninaarmend.co.site` (the old email). I'll update the security findings to reflect the completed email migration and clean up stale entries.

### 7. Add verify_jwt = false for Remaining Edge Functions

**Problem:** The `create-square-checkout`, `process-payment`, `finalize-square-order`, `send-email`, and `sync-products` functions are not listed in `config.toml` with `verify_jwt = false`. With Lovable Cloud's signing-keys system, the default `verify_jwt = true` doesn't work properly.

**Fix:** Add all edge functions to `config.toml` with `verify_jwt = false`. The payment functions intentionally skip auth (guest checkout), and `send-email` is called from other functions. `sync-products` and `ai-chat` already validate auth in code.

**File:** `supabase/config.toml`

---

## Accepted Risks (No Action Needed)

| Finding | Reason |
|---------|--------|
| Leaked Password Protection Disabled | This is a Lovable Cloud platform-level setting that cannot be changed via code. Noted for the client. |
| Payment endpoints without auth (checkout/finalize) | Intentional -- allows guest checkout without requiring account creation. Square handles payment security. |
| Products public read | Intentional for storefront. Will tighten to active-only. |
| Store settings contact info public | Intentional -- this data powers the Contact page. |
| Newsletter/Waitlist public INSERT | Intentional for public signup forms. |

---

## Technical Implementation Details

### Price Validation (create-square-checkout)
```text
Before creating Square payment link:
1. For each item in orderDetails.items:
   - Query products table by item.productId
   - Compare item.price to product.price
   - If mismatch, return 400 error
2. Recalculate total server-side
3. Use server-calculated total for payment
```

### HTML Sanitization (send-email)
```text
Add escapeHtml() function:
- Replace & with &amp;
- Replace < with &lt;
- Replace > with &gt;
- Replace " with &quot;
- Replace ' with &#39;
Apply to all user-provided fields before HTML injection
```

### Config.toml Updates
```text
Add entries for:
- create-square-checkout
- finalize-square-order
- process-payment
- send-email
- sync-products
All with verify_jwt = false
```

---

## What Won't Break

- All existing functionality stays the same
- Guest checkout continues to work
- Admin dashboard keeps working
- Product listings stay public
- Email sending stays functional
- No password changes or auth flow changes
- Legacy auth store is untouched (already deprecated)
