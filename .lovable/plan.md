

## Migrating from Resend to Lovable Branded Emails

### Current State

Your project has a robust email system built on Resend with **16 email template types** across two edge functions:

- **`send-email`** — 15 template types: welcome, order confirmation, shipping confirmation, contact form (dual: to support + to customer), referral success, shipping update, waitlist confirmation, waitlist notification, launch announcement (bulk), birthday month, discount applied, admin birthday report, admin low stock, admin return request
- **`send-abandoned-cart`** — 1 template: abandoned cart reminder

These are called from ~10 places across the app (Contact, Maintenance, Account, Orders, Customers, Dashboard, Products, cloudAuthStore, plus edge-to-edge calls from create-square-checkout, finalize-square-order, and send-birthday-emails).

### What Needs to Happen

#### Step 1: Set Up Lovable Email Domain (blocked on client)
You're waiting on Namecheap credentials from the client. Once you have them, we'll configure the email domain through Lovable Cloud. This involves adding NS records at Namecheap to delegate a subdomain (e.g., `notify.ninaarmend.co`) to Lovable's nameservers.

#### Step 2: Set Up Email Infrastructure
Once the domain is configured, I'll set up the email queue infrastructure (needed for reliable delivery with retries).

#### Step 3: Migrate Transactional Email Templates
Convert all 16 Resend HTML templates into React Email components for Lovable's transactional email system, preserving the existing brand styling (black background with gold #C9A96E accents, Georgia serif font, luxury aesthetic). Templates to create:

1. `welcome` — New user welcome with 50-point reward
2. `order-confirmation` — Order receipt with items table
3. `shipping-confirmation` — Shipping notification with tracking
4. `contact-form-to-support` — Customer inquiry forwarded to admin
5. `contact-form-to-customer` — Auto-reply confirmation
6. `referral-success` — Points awarded notification
7. `shipping-update` — Status change notification
8. `waitlist-confirmation` — Waitlist signup confirmation
9. `waitlist-notification` — Admin alert for new waitlist entry
10. `birthday-month` — Monthly birthday discount email
11. `discount-applied` — Discount confirmation
12. `admin-birthday-report` — Monthly birthday summary for admin
13. `admin-low-stock` — Low inventory alert
14. `admin-return-request` — Return request notification
15. `abandoned-cart` — Cart reminder
16. `launch-announcement` — Waitlist launch email

**Note on marketing emails:** The launch announcement (bulk to waitlist) and abandoned cart emails are borderline marketing. Lovable's transactional system is designed for 1:1 triggered emails. These two may need to stay on a separate sending mechanism or be restructured. I'll flag this during implementation.

#### Step 4: Update All Call Sites
Replace all `supabase.functions.invoke('send-email', ...)` calls across the app with calls to `send-transactional-email`, updating the payload format (switching from `{ type, data }` to `{ templateName, recipientEmail, templateData, idempotencyKey }`).

Files to update:
- `src/pages/Contact.tsx`
- `src/pages/Maintenance.tsx`
- `src/pages/Account.tsx`
- `src/pages/admin/Orders.tsx`
- `src/pages/admin/Customers.tsx`
- `src/pages/admin/Dashboard.tsx`
- `src/pages/admin/Products.tsx`
- `src/stores/cloudAuthStore.ts`
- `supabase/functions/create-square-checkout/index.ts`
- `supabase/functions/finalize-square-order/index.ts`
- `supabase/functions/send-birthday-emails/index.ts`

#### Step 5: Create Unsubscribe Page
Lovable's transactional system requires a branded unsubscribe page in the app.

#### Step 6: Clean Up
Remove the old `send-email` and `send-abandoned-cart` edge functions and the `RESEND_API_KEY` secret once everything is verified working.

### What You Can Do Now

Nothing is blocked on my end code-wise — **once your client provides the Namecheap credentials**, the first step is to configure the email domain through the setup dialog in Cloud. After DNS propagation (can take up to 72 hours), emails will start sending from your branded domain.

In the meantime, the existing Resend-based system continues to work. Would you like me to proceed with the domain setup once you have the credentials?

