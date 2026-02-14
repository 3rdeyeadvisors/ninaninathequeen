

# Email System Implementation with Resend

## Overview

Build a complete transactional email system using Resend, sending all support-related emails from `support@ninaarmend.co`. The domain `ninaarmend.co` is already configured in Resend.

---

## Step 0: Add Resend API Key Secret

Before any code changes, request the RESEND_API_KEY secret from the user. This is required for the edge function to send emails.

---

## Step 1: Create `send-email` Edge Function

A single edge function (`supabase/functions/send-email/index.ts`) that handles all email types. It will:

- Accept a `type` parameter to determine which email template to render
- Use the Resend API (`https://api.resend.com/emails`) to send emails
- Always send from `support@ninaarmend.co` with sender name "Nina Armend"
- Support these email types:
  - `welcome` -- new account creation
  - `order_confirmation` -- after successful purchase
  - `contact_form` -- contact us submissions (sends to support AND confirmation to customer)
  - `password_reset` -- custom password reset with token link
  - `referral_success` -- when a referral signs up
  - `shipping_update` -- order status changes

**Email Design Standards (matching existing brand memory):**
- Black background (`#000000`), bronze-gold accent (`#C9A96E`)
- Nina Armend logo at top
- High contrast white text on black
- Rounded buttons with bronze-gold color
- Mobile-responsive single-column layout
- Generous padding/spacing
- Footer with unsubscribe and social links

---

## Step 2: Wire Up Contact Form

Update `src/pages/Contact.tsx`:
- Capture form values (name, email, message) with state
- On submit, call the `send-email` edge function with `type: 'contact_form'`
- Send two emails: one to `support@ninaarmend.co` with the inquiry, one to the customer confirming receipt
- Show loading state while sending
- Show success/error toast

---

## Step 3: Wire Up Order Confirmation Email

Update `supabase/functions/finalize-square-order/index.ts`:
- After successful order finalization, call the Resend API directly (or invoke the send-email function internally) to send an order confirmation email to the customer
- Include order ID, items, total, and expected shipping timeline

---

## Step 4: Wire Up Welcome Email

Two options -- I will use the edge function approach:
- Create a database webhook trigger or call from the signup flow
- After successful signup in `src/stores/cloudAuthStore.ts`, invoke the `send-email` function with `type: 'welcome'`
- Include: welcome message, 50 loyalty points notification, referral link

---

## Step 5: Implement Password Reset

Update `src/pages/Account.tsx`:
- Replace the TODO in `handleResetPassword` with actual `supabase.auth.resetPasswordForEmail(email, { redirectTo })` call
- This uses the built-in auth system's email (which can be customized via Supabase auth email templates)
- Alternatively, create a custom reset flow via the `send-email` edge function with a secure token

The simpler and more reliable approach: use `supabase.auth.resetPasswordForEmail()` which handles token generation securely. The email template can be branded through config.

---

## Step 6: Add Config for send-email in config.toml

Add `verify_jwt = false` for the send-email function since some calls (contact form, order finalization) may not have auth context.

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/send-email/index.ts` | **Create** -- main email edge function with all templates |
| `src/pages/Contact.tsx` | **Modify** -- wire form to edge function |
| `supabase/functions/finalize-square-order/index.ts` | **Modify** -- add order confirmation email |
| `src/stores/cloudAuthStore.ts` | **Modify** -- send welcome email after signup |
| `src/pages/Account.tsx` | **Modify** -- implement real password reset |

---

## Email Templates (HTML)

All templates share a common wrapper:
- Max-width 600px, centered
- Black background with 40px padding
- Logo image at top (from public URL)
- Bronze-gold divider line
- Content section with white text (16px), serif headings
- CTA button: bronze-gold background, white text, 16px padding, fully rounded corners (border-radius: 50px)
- Footer: muted gray text, social links, unsubscribe

### Welcome Email
- Subject: "Welcome to Nina Armend"
- Content: greeting by name, 50 points earned, referral link, CTA to shop

### Order Confirmation
- Subject: "Order Confirmed - {orderId}"
- Content: order items list, total, shipping info, CTA to track order

### Contact Form (to support)
- Subject: "New Inquiry from {name}"
- Content: customer name, email, message

### Contact Form (to customer)
- Subject: "We've received your message"
- Content: confirmation, expected response time, message echo

### Password Reset
- Uses Supabase built-in `resetPasswordForEmail`

---

## Execution Order
1. Request RESEND_API_KEY secret
2. Create send-email edge function with all templates
3. Wire up Contact form
4. Wire up order confirmation in finalize-square-order
5. Wire up welcome email on signup
6. Implement password reset
7. Deploy and test all email flows

