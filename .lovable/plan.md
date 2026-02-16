

# Audit Fixes - Remaining Items

## Fix 1: Reviews RLS Policy (Security - Critical)

The current "Authenticated users can update likes" policy has a `WITH CHECK` that compares columns to themselves (`user_id = user_id`), which is always true. Any authenticated user can modify any review field.

**Solution:** Drop the broken policy and create a database function `toggle_review_like(review_id, user_id)` that runs as `SECURITY DEFINER`. Remove the general UPDATE policy for authenticated users entirely. The `useToggleLike` hook will call the RPC instead of doing a direct update.

## Fix 2: Duplicate Review Prevention (Points Abuse)

No constraint prevents a user from submitting multiple reviews for the same product, farming 10 points each time.

**Solution:** Add a unique constraint on `(product_id, user_id)` in the reviews table. Update `useAddReview` to handle the unique violation error gracefully with a user-friendly message.

## Fix 3: Newsletter Signup (Broken)

The footer newsletter form shows a success toast but never saves the email. Customers are silently lost.

**Solution:** Create a `newsletter_subscribers` table with `id`, `email` (unique), and `created_at`. Add a permissive INSERT policy for anonymous users and a SELECT/DELETE policy for admins. Update `Footer.tsx` to insert into this table on submit.

## Fix 4: Update Square API Version

Both edge functions use `Square-Version: '2024-01-18'` which is over 2 years old.

**Solution:** Update the header to `'2025-01-23'` in both `create-square-checkout` and `finalize-square-order`.

## Fix 5: Product View Tracking Bug

`ProductPage.tsx` reads from localStorage and writes that local count to the DB `view_count`, which can overwrite the real count if a user clears their browser. Also causes two DB calls per page view.

**Solution:** Replace the upsert + update pattern with a single upsert that increments atomically using a database function `increment_product_view(p_user_id, p_product_id, p_product_title)`.

---

## Technical Summary

| File / Resource | Change |
|---|---|
| Database migration | Drop broken likes UPDATE policy; create `toggle_review_like` RPC; add unique constraint on `(product_id, user_id)`; create `newsletter_subscribers` table; create `increment_product_view` RPC |
| `src/hooks/useReviewsDb.ts` | Switch `useToggleLike` to use RPC; handle duplicate review error in `useAddReview` |
| `src/components/Footer.tsx` | Insert email into `newsletter_subscribers` table on submit |
| `supabase/functions/create-square-checkout/index.ts` | Update `Square-Version` header |
| `supabase/functions/finalize-square-order/index.ts` | Update `Square-Version` header |
| `src/pages/ProductPage.tsx` | Replace localStorage-based view tracking with single RPC call |

