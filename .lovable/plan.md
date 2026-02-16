

# Fix Resend Email Deliverability Warnings

## Problem
Resend is flagging two issues:
1. **Link URL Mismatch** -- Emails are sent from `support@ninaarmend.co`, but all links inside the emails (Shop, About, Contact, account links, CTA buttons) point to `ninaninathequeen.lovable.app`. Email providers see this domain mismatch as suspicious, which can hurt deliverability and land emails in spam.
2. **Subdomain Recommendation** -- Resend recommends sending from a subdomain like `send.ninaarmend.co` instead of the root domain. This is a best practice but not a blocking issue right now.

## Fix

### Update email link URLs (required)
**File**: `supabase/functions/send-email/index.ts`

Change line 12:
- From: `siteUrl: 'https://ninaninathequeen.lovable.app'`
- To: `siteUrl: 'https://ninaarmend.co'`

This single change updates every link in every email template (Shop, About, Contact, account pages, order details, CTAs) since they all reference `BRAND.siteUrl`.

### Subdomain for sending (optional, later)
The subdomain recommendation (e.g., `send.ninaarmend.co` or `mail.ninaarmend.co`) would require updating DNS records at your domain registrar and reconfiguring the sending domain in Resend. This protects your root domain's reputation. It's a good practice but can be done later -- fixing the link mismatch is the priority.

### Custom domain setup
For the links to actually work at `ninaarmend.co`, you'll need to connect your custom domain in Lovable project settings under Domains. This requires adding an A record pointing to `185.158.133.1` and a TXT verification record at your registrar.

## Summary
| Change | File | What |
|--------|------|------|
| Update siteUrl | `supabase/functions/send-email/index.ts` | Change lovable.app URL to ninaarmend.co |

One line change, fixes the Resend warning, improves email deliverability.

