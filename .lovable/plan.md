

## Audit: Email Flows and Button Wiring

### Summary

All 16 templates are registered in the registry and the `send-transactional-email` edge function is correctly structured. No old Resend references remain. However, **2 templates are never triggered** and there's **1 missing email trigger** in an existing flow.

### Issues Found

**Issue 1: `referral-success` template is never sent**
The `handle_new_user` database trigger processes referrals (awards 25 points to referrer), but no code ever sends the `referral-success` email to notify the referrer. The trigger runs in PL/pgSQL so it can't call an edge function directly.

**Fix:** After signup in `cloudAuthStore.ts`, when a referral code was used, fire a `referral-success` email to the referrer. Since we don't know the referrer's email client-side, we have two options:
- Query the `profiles` table by referral code to get the referrer's email, then send the email (requires an RLS policy allowing reading another user's email by referral code — not ideal).
- Better: Add the referral-success email send inside the `send-birthday-emails`-style pattern — create a small check in the signup flow. Actually, the simplest approach: after signup succeeds and a referral code was used, call `send-transactional-email` with `referral-success` and pass the referral code. The edge function can look up the referrer, OR we add a DB function that returns the referrer email.

**Recommended approach:** Create a small DB function `get_referrer_email(referral_code text)` that returns the referrer's email. Call it client-side after signup, then send the `referral-success` email.

**Issue 2: `shipping-update` template is never sent**
Registered in the registry but no code ever invokes it. The Orders page sends `shipping-confirmation` when status changes to "Shipped", but there's no trigger for general shipping status updates (e.g., "Out for Delivery", "Delivered").

**Fix:** Add a `shipping-update` email send in the `saveOrderChanges` function in `Orders.tsx` — when the status changes to a shipping-related status other than "Shipped" (which already sends `shipping-confirmation`), send a `shipping-update` email.

**Issue 3: No issues (verified working)**
These 14 templates are all correctly wired:
- `welcome` — triggered on signup in `cloudAuthStore.ts`
- `order-confirmation` — triggered in `finalize-square-order` and manual resend in `Orders.tsx`
- `shipping-confirmation` — triggered on status change to "Shipped" and manual resend in `Orders.tsx`
- `contact-form-to-support` — triggered on contact form submit
- `contact-form-to-customer` — triggered on contact form submit (fire-and-forget)
- `waitlist-confirmation` — triggered on waitlist signup in `Maintenance.tsx`
- `waitlist-notification` — triggered on waitlist signup (admin notification)
- `discount-applied` — triggered in `create-square-checkout` when discount > 0
- `birthday-month` — triggered via `send-birthday-emails` edge function
- `admin-birthday-report` — triggered in `Dashboard.tsx` after birthday batch
- `admin-low-stock` — triggered in `Products.tsx` on save when inventory is low
- `admin-return-request` — triggered in `Account.tsx` on return request submit
- `abandoned-cart` — triggered in `cartStore.ts` on 2hr inactivity check
- `launch-announcement` — triggered in `Customers.tsx` for selected waitlist entries

### Implementation Steps

**Step 1: Create `get_referrer_email` DB function**
A `SECURITY DEFINER` function that takes a referral code and returns the referrer's email. This avoids exposing other users' emails via RLS.

**Step 2: Wire `referral-success` email in `cloudAuthStore.ts`**
After successful signup with a referral code, call the new DB function to get the referrer's email, then invoke `send-transactional-email` with `referral-success`.

**Step 3: Wire `shipping-update` email in `Orders.tsx`**
In `saveOrderChanges`, when the order status changes to "Out for Delivery" or "Delivered" (not "Shipped" which already sends `shipping-confirmation`), send a `shipping-update` email.

### Technical Details

```text
File changes:
1. New migration: CREATE FUNCTION get_referrer_email(code text) RETURNS text
2. src/stores/cloudAuthStore.ts — add referral-success send after signup
3. src/pages/admin/Orders.tsx — add shipping-update send in saveOrderChanges
```

