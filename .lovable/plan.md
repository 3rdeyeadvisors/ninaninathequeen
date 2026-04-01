

## Plan: Migrate All Emails from Resend to Lovable Cloud

No more Resend. Every email goes through Lovable's system via `notify.ninaarmend.co`. DNS is currently verifying — templates and code can be set up now, emails start flowing once DNS propagates.

### How the "bulk" emails will work

The 3 emails previously flagged as "marketing" will work as **individual transactional sends**, each triggered by a specific event for a specific person:

- **Birthday month**: Admin clicks "Send Birthday Emails" → the `send-birthday-emails` edge function queries matching profiles and calls `send-transactional-email` once per user. Each is a 1:1 account notification for that user's birthday.
- **Abandoned cart**: Triggered by a specific user's cart inactivity (2hr timeout). Goes to 1 person based on their action.
- **Launch announcement**: Admin selects waitlist entries and clicks "Send Launch Email" → code calls `send-transactional-email` once per selected entry. Each is a 1:1 notification that the product they signed up for is now available.

All 16 templates, zero Resend dependency.

### Technical Steps

**Step 1: Scaffold transactional email system**
Use the scaffolding tool to create `send-transactional-email`, `handle-email-unsubscribe`, and `handle-email-suppression` edge functions.

**Step 2: Create 16 React Email templates**
Create `.tsx` files in `supabase/functions/_shared/transactional-email-templates/` preserving the exact Nina Armend luxury styling (black #000 container, gold #C9A96E accents, Georgia serif, rounded gold CTAs):

1. `welcome` — 50-point reward welcome
2. `order-confirmation` — items table + total
3. `shipping-confirmation` — tracking number + items
4. `contact-form-to-support` — inquiry forwarded to admin
5. `contact-form-to-customer` — auto-reply confirmation
6. `referral-success` — points awarded
7. `shipping-update` — status change notification
8. `waitlist-confirmation` — waitlist signup confirmation
9. `waitlist-notification` — admin alert for new waitlist entry
10. `discount-applied` — discount confirmation
11. `birthday-month` — monthly birthday discount
12. `admin-birthday-report` — monthly summary for admin
13. `admin-low-stock` — low inventory alert
14. `admin-return-request` — return request notification
15. `abandoned-cart` — cart reminder with items table
16. `launch-announcement` — "The Wait Is Over" with 50-point CTA

**Step 3: Register all templates in `registry.ts`**

**Step 4: Deploy all edge functions**

**Step 5: Update all call sites** (replace `send-email` / `send-abandoned-cart` invocations with `send-transactional-email`):
- `src/pages/Contact.tsx` — contact form (2 emails)
- `src/stores/cloudAuthStore.ts` — welcome on signup
- `src/pages/Maintenance.tsx` — waitlist confirmation + notification
- `src/pages/admin/Orders.tsx` — order/shipping confirmation + shipping update
- `src/pages/admin/Customers.tsx` — launch announcement (per-entry sends)
- `src/pages/admin/Dashboard.tsx` — admin birthday report
- `src/pages/admin/Products.tsx` — admin low stock
- `src/stores/cartStore.ts` — abandoned cart
- `supabase/functions/finalize-square-order/index.ts` — order confirmation
- `supabase/functions/create-square-checkout/index.ts` — discount applied
- `supabase/functions/send-birthday-emails/index.ts` — birthday month + admin report

**Step 6: Create branded `/unsubscribe` page**
Matches the black/gold aesthetic. Handles token validation and confirmation.

**Step 7: Remove Resend**
- Delete `supabase/functions/send-email/` edge function
- Delete `supabase/functions/send-abandoned-cart/` edge function
- Remove `RESEND_API_KEY` secret
- Clean up `supabase/config.toml` entries

### What stays the same
- Email infrastructure (pgmq queues, cron, tables) — already set up
- `process-email-queue` dispatcher — already deployed
- All existing brand styling preserved exactly

