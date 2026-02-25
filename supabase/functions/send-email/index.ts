import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// HTML sanitization to prevent XSS in email templates
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const BRAND = {
  name: 'Nina Armend',
  from: 'Nina Armend <support@ninaarmend.co>',
  supportEmail: 'support@ninaarmend.co',
  siteUrl: 'https://ninaarmend.co',
  logo: 'https://ninaarmend.co/favicon-32x32.png',
  colors: {
    bg: '#000000',
    accent: '#C9A96E',
    accentDark: '#A8884F',
    text: '#FFFFFF',
    textMuted: '#999999',
    cardBg: '#111111',
    border: '#222222',
  },
}

// Inline style constants
const S = {
  body: 'margin:0;padding:0;background:#ffffff;font-family:Georgia,serif;',
  container: 'max-width:600px;margin:0 auto;background:#000000;padding:40px 32px;',
  logoRow: 'text-align:center;padding-bottom:24px;',
  logoText: "font-size:36px;color:#C9A96E;font-weight:400;font-family:Georgia,serif;",
  divider: 'height:1px;background:#C9A96E;margin:0 0 32px 0;opacity:0.4;',
  h1: 'color:#FFFFFF;font-size:24px;font-weight:400;margin:0 0 16px 0;font-family:Georgia,serif;',
  h2: 'color:#FFFFFF;font-size:20px;font-weight:400;margin:0 0 12px 0;font-family:Georgia,serif;',
  p: 'color:#FFFFFF;font-size:16px;line-height:1.7;margin:0 0 16px 0;font-family:Georgia,serif;',
  muted: 'color:#999999;font-size:14px;line-height:1.6;font-family:Georgia,serif;',
  btn: "display:inline-block;background:#C9A96E;color:#000000;padding:16px 40px;border-radius:50px;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:2px;text-transform:uppercase;font-family:'Helvetica Neue',Arial,sans-serif;",
  btnCenter: 'text-align:center;padding:24px 0;',
  card: 'background:#111111;border:1px solid #222222;border-radius:16px;padding:24px;margin:16px 0;',
  footer: 'text-align:center;padding-top:32px;border-top:1px solid #222222;margin-top:32px;',
  footerP: 'color:#999999;font-size:12px;line-height:1.8;font-family:Georgia,serif;',
  footerA: 'color:#C9A96E;text-decoration:none;',
  highlight: 'color:#C9A96E;font-weight:600;',
  pointsBadge: "display:inline-block;background:#C9A96E;color:#000;padding:4px 14px;border-radius:50px;font-size:13px;font-weight:700;letter-spacing:1px;font-family:'Helvetica Neue',Arial,sans-serif;",
}

function baseWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="${S.body}">
<div style="${S.container}">
  <div style="${S.logoRow}">
    <div style="${S.logoText}">Nina Armend</div>
  </div>
  <div style="${S.divider}"></div>
  ${content}
  <div style="${S.footer}">
    <p style="${S.footerP}">
      <a href="${BRAND.siteUrl}/shop" style="${S.footerA}">Shop</a> &nbsp;·&nbsp;
      <a href="${BRAND.siteUrl}/about" style="${S.footerA}">About</a> &nbsp;·&nbsp;
      <a href="${BRAND.siteUrl}/contact" style="${S.footerA}">Contact</a>
    </p>
    <p style="${S.footerP}margin-top:16px;">© ${new Date().getFullYear()} Nina Armend. All rights reserved.</p>
    <p style="${S.footerP}margin-top:8px;">San Antonio, Texas</p>
  </div>
</div>
</body>
</html>`
}

function welcomeEmail(data: { name: string; referralCode?: string }): { subject: string; html: string } {
  const name = escapeHtml(data.name || '');
  const referralCode = data.referralCode ? escapeHtml(data.referralCode) : undefined;
  return {
    subject: 'Welcome to Nina Armend',
    html: baseWrapper(`
      <h1 style="${S.h1}">Welcome, ${name}</h1>
      <p style="${S.p}">We're thrilled to have you join the Nina Armend family. Your account has been created and you've earned your first reward.</p>
      <div style="${S.card}">
        <p style="${S.p}margin:0 0 8px 0;"><span style="${S.highlight}">50 Welcome Points</span> have been added to your account.</p>
        <p style="${S.muted}margin:0;">Use your points toward exclusive discounts on future orders.</p>
      </div>
      ${referralCode ? `
      <div style="${S.card}">
        <p style="${S.p}margin:0 0 8px 0;">Share Nina Armend with a friend and earn <span style="${S.highlight}">25 bonus points</span> when they sign up.</p>
        <p style="${S.muted}margin:0;">Your referral code: <strong style="color:#C9A96E;">${referralCode}</strong></p>
      </div>` : ''}
      <div style="${S.btnCenter}">
        <a href="${BRAND.siteUrl}/shop" style="${S.btn}">Start Shopping</a>
      </div>
    `),
  }
}

function orderConfirmationEmail(data: { orderId: string; customerName: string; items: Array<{ title: string; quantity: number; price: string; size?: string }>; total: string }): { subject: string; html: string } {
  const orderId = escapeHtml(data.orderId || '');
  const customerName = escapeHtml(data.customerName || '');
  const total = data.total;
  const itemsHtml = data.items.map(item =>
    `<tr>
      <td style="padding:12px 0;border-bottom:1px solid #222222;color:#FFFFFF;font-size:15px;font-family:Georgia,serif;">
        ${escapeHtml(item.title)}${item.size ? ` <span style="${S.muted}">(${escapeHtml(item.size)})</span>` : ''} × ${item.quantity}
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #222222;color:#C9A96E;font-size:15px;font-weight:600;text-align:right;font-family:Georgia,serif;">
        $${parseFloat(item.price).toFixed(2)}
      </td>
    </tr>`
  ).join('')

  return {
    subject: `Order Confirmed — ${orderId.slice(0, 8).toUpperCase()}`,
    html: baseWrapper(`
      <h1 style="${S.h1}">Order Confirmed</h1>
      <p style="${S.p}">Thank you, ${customerName}. Your order has been received and is being prepared with care.</p>
      <div style="${S.card}">
        <p style="${S.muted}margin:0 0 16px 0;">Order Reference: <strong style="color:#C9A96E;">${orderId.slice(0, 8).toUpperCase()}</strong></p>
        <table style="width:100%;border-collapse:collapse;">
          ${itemsHtml}
          <tr>
            <td style="padding:16px 0 0;color:#FFFFFF;font-size:16px;font-weight:600;font-family:Georgia,serif;">Total</td>
            <td style="padding:16px 0 0;color:#C9A96E;font-size:18px;font-weight:700;text-align:right;font-family:Georgia,serif;">$${parseFloat(total).toFixed(2)}</td>
          </tr>
        </table>
      </div>
      <p style="${S.muted}">You'll receive a shipping confirmation with tracking details once your order ships. Most orders ship within 3–5 business days.</p>
      <div style="${S.btnCenter}">
        <a href="${BRAND.siteUrl}/account" style="${S.btn}">View Your Orders</a>
      </div>
    `),
  }
}

function contactFormToSupport(data: { name: string; email: string; message: string }): { subject: string; html: string } {
  const name = escapeHtml(data.name || '');
  const email = escapeHtml(data.email || '');
  const message = escapeHtml(data.message || '').replace(/\n/g, '<br>');
  return {
    subject: `New Inquiry from ${name}`,
    html: baseWrapper(`
      <h1 style="${S.h1}">New Customer Inquiry</h1>
      <div style="${S.card}">
        <p style="${S.p}margin:0 0 8px 0;"><strong style="color:#C9A96E;">From:</strong> ${name}</p>
        <p style="${S.p}margin:0 0 8px 0;"><strong style="color:#C9A96E;">Email:</strong> <a href="mailto:${email}" style="color:#C9A96E;text-decoration:none;">${email}</a></p>
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid #222222;">
          <p style="${S.p}margin:0;">${message}</p>
        </div>
      </div>
      <p style="${S.muted}">Reply directly to this email to respond to the customer.</p>
    `),
  }
}

function contactFormToCustomer(data: { name: string; message: string }): { subject: string; html: string } {
  const name = escapeHtml(data.name || '');
  const message = escapeHtml(data.message || '');
  return {
    subject: "We've received your message",
    html: baseWrapper(`
      <h1 style="${S.h1}">Thank You, ${name}</h1>
      <p style="${S.p}">We've received your inquiry and our concierge team will respond within 24 hours.</p>
      <div style="${S.card}">
        <p style="${S.muted}margin:0 0 8px 0;">Your message:</p>
        <p style="${S.p}margin:0;font-style:italic;">"${message}"</p>
      </div>
      <p style="${S.muted}">If you need immediate assistance, please reach out to <a href="mailto:${BRAND.supportEmail}" style="color:#C9A96E;text-decoration:none;">${BRAND.supportEmail}</a>.</p>
      <div style="${S.btnCenter}">
        <a href="${BRAND.siteUrl}/shop" style="${S.btn}">Continue Shopping</a>
      </div>
    `),
  }
}

function referralSuccessEmail(data: { referrerName: string; referredName: string; pointsAwarded: number }): { subject: string; html: string } {
  return {
    subject: `You've earned ${data.pointsAwarded} referral points!`,
    html: baseWrapper(`
      <h1 style="${S.h1}">Referral Reward Earned</h1>
      <p style="${S.p}">${data.referrerName}, your friend <span style="${S.highlight}">${data.referredName}</span> just joined Nina Armend using your referral link!</p>
      <div style="${S.card}text-align:center;">
        <p style="${S.muted}margin:0 0 8px 0;">Points Earned</p>
        <p style="margin:0;"><span style="${S.pointsBadge}">+${data.pointsAwarded} PTS</span></p>
      </div>
      <p style="${S.muted}">Keep sharing your referral link to earn more rewards. You'll earn 25 points for every friend who signs up.</p>
      <div style="${S.btnCenter}">
        <a href="${BRAND.siteUrl}/account" style="${S.btn}">View Your Rewards</a>
      </div>
    `),
  }
}

function shippingUpdateEmail(data: { customerName: string; orderId: string; status: string; trackingNumber?: string }): { subject: string; html: string } {
  const customerName = escapeHtml(data.customerName || '');
  const orderId = escapeHtml(data.orderId || '');
  const status = escapeHtml(data.status || '');
  const trackingNumber = data.trackingNumber ? escapeHtml(data.trackingNumber) : undefined;
  const statusMessages: Record<string, string> = {
    'Shipped': 'Your order has been shipped and is on its way to you!',
    'Delivered': 'Your order has been delivered. We hope you love it!',
    'Out for Delivery': 'Your order is out for delivery today!',
  }
  const statusMsg = statusMessages[data.status] || `Your order status has been updated to: ${status}`

  return {
    subject: `Order Update — ${status}`,
    html: baseWrapper(`
      <h1 style="${S.h1}">Shipping Update</h1>
      <p style="${S.p}">${customerName}, ${statusMsg}</p>
      <div style="${S.card}">
        <p style="${S.p}margin:0 0 8px 0;"><strong style="color:#C9A96E;">Order:</strong> ${orderId.slice(0, 8).toUpperCase()}</p>
        <p style="${S.p}margin:0 0 8px 0;"><strong style="color:#C9A96E;">Status:</strong> ${status}</p>
        ${trackingNumber ? `<p style="${S.p}margin:0;"><strong style="color:#C9A96E;">Tracking:</strong> ${trackingNumber}</p>` : ''}
      </div>
      <div style="${S.btnCenter}">
        <a href="${BRAND.siteUrl}/account" style="${S.btn}">View Order Details</a>
      </div>
    `),
  }
}

function waitlistConfirmationEmail(data: { name: string; email: string }): { subject: string; html: string } {
  const name = escapeHtml(data.name || '');
  return {
    subject: "You're on the Nina Armend Waitlist",
    html: baseWrapper(`
      <h1 style="${S.h1}">Welcome to the Waitlist</h1>
      <p style="${S.p}">Hey ${name}, thank you for your interest in Nina Armend. You've secured your spot on our exclusive launch list.</p>
      <div style="${S.card}text-align:center;">
        <p style="margin:0 0 8px 0;color:#C9A96E;font-size:18px;font-weight:600;font-family:Georgia,serif;">You're In</p>
        <p style="${S.muted}margin:0;">We'll send you an exclusive first look before our collection goes live.</p>
      </div>
      <p style="${S.muted}">Stay tuned — something beautiful is on its way.</p>
    `),
  }
}

function waitlistNotificationEmail(data: { name: string; email: string }): { subject: string; html: string } {
  const name = escapeHtml(data.name || '');
  const email = escapeHtml(data.email || '');
  return {
    subject: `New Waitlist Signup: ${email}`,
    html: baseWrapper(`
      <h1 style="${S.h1}">New Waitlist Signup</h1>
      <div style="${S.card}">
        <p style="${S.p}margin:0 0 8px 0;"><strong style="color:#C9A96E;">Email:</strong> ${email}</p>
        <p style="${S.p}margin:0;"><strong style="color:#C9A96E;">Name:</strong> ${name}</p>
      </div>
      <p style="${S.muted}">A new visitor has joined the launch waitlist.</p>
    `),
  }
}

function launchAnnouncementEmail(data: { name?: string }): { subject: string; html: string } {
  const greeting = data.name ? `${data.name}, the` : 'The'
  return {
    subject: 'Nina Armend Is Now Live',
    html: baseWrapper(`
      <h1 style="${S.h1}text-align:center;font-size:28px;margin-bottom:8px;">The Wait Is Over</h1>
      <p style="${S.p}text-align:center;color:#C9A96E;font-size:18px;margin-bottom:24px;font-style:italic;">${greeting} moment you've been waiting for is here.</p>
      <p style="${S.p}">Our curated collection of luxury swimwear is now live and ready for you to explore.</p>
      <p style="${S.p}">As one of our earliest supporters, we wanted you to be the first to know.</p>
      <div style="${S.card}text-align:center;">
        <p style="margin:0 0 12px 0;font-size:13px;color:#999999;text-transform:uppercase;letter-spacing:2px;font-family:'Helvetica Neue',Arial,sans-serif;">Exclusive Welcome Reward</p>
        <p style="margin:0 0 8px 0;"><span style="${S.pointsBadge}">50 POINTS</span></p>
        <p style="margin:0;color:#FFFFFF;font-size:15px;font-family:Georgia,serif;">Create your account today and receive <span style="${S.highlight}">50 welcome points</span> toward your first purchase.</p>
      </div>
      <div style="${S.btnCenter}padding:32px 0;">
        <a href="${BRAND.siteUrl}/shop" style="${S.btn}">Create Your Account</a>
      </div>
      <p style="${S.muted}text-align:center;">Explore our exclusive collections crafted with intention, designed to make you feel extraordinary.</p>
    `),
  }
}

function discountAppliedEmail(data: { customerName: string; discountType: string; amountSaved: string; newTotal: string }): { subject: string; html: string } {
  const customerName = escapeHtml(data.customerName || 'there');
  const discountType = escapeHtml(data.discountType || 'Discount');
  return {
    subject: `Your ${discountType} has been applied!`,
    html: baseWrapper(`
      <h1 style="${S.h1}">Reward Applied</h1>
      <p style="${S.p}">Hello ${customerName}, we've auto-applied your loyalty reward to your current checkout session.</p>
      <div style="${S.card}">
        <p style="${S.p}margin:0 0 8px 0;"><strong style="color:#C9A96E;">Reward:</strong> ${discountType}</p>
        <p style="${S.p}margin:0 0 8px 0;"><strong style="color:#C9A96E;">Amount Saved:</strong> $${parseFloat(data.amountSaved).toFixed(2)}</p>
        <p style="${S.p}margin:0;"><strong style="color:#C9A96E;">Order Total:</strong> $${parseFloat(data.newTotal).toFixed(2)}</p>
      </div>
      <p style="${S.muted}">Thank you for being a part of our loyalty program!</p>
    `),
  }
}

function birthdayMonthEmail(data: { name: string }): { subject: string; html: string } {
  const name = escapeHtml(data.name || 'there');
  return {
    subject: `Happy Birthday Month, ${name}! 🎂`,
    html: baseWrapper(`
      <h1 style="${S.h1}text-align:center;">Happy Birthday Month!</h1>
      <p style="${S.p}text-align:center;">To celebrate your special month, we've activated an exclusive <strong>$5 birthday discount</strong> for you.</p>
      <div style="${S.card}text-align:center;">
        <p style="margin:0 0 12px 0;font-size:13px;color:#999999;text-transform:uppercase;letter-spacing:2px;font-family:'Helvetica Neue',Arial,sans-serif;">Your Gift</p>
        <p style="margin:0 0 8px 0;"><span style="${S.pointsBadge}">$5.00 OFF</span></p>
        <p style="margin:0;color:#FFFFFF;font-size:15px;font-family:Georgia,serif;">This discount will be auto-applied at checkout all month long.</p>
      </div>
      <div style="${S.btnCenter}">
        <a href="${BRAND.siteUrl}/shop" style="${S.btn}">Shop Now</a>
      </div>
      <p style="${S.muted}text-align:center;">Wishing you a beautiful month ahead.</p>
    `),
  }
}

function adminBirthdayReportEmail(data: { count: number; month: string }): { subject: string; html: string } {
  const month = escapeHtml(data.month);
  const count = data.count;
  const year = new Date().getFullYear();
  const nextMonthName = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleString('default', { month: 'long' });

  return {
    subject: `Birthday Emails Sent — ${month} ${year}`,
    html: baseWrapper(`
      <h1 style="${S.h1}text-align:center;">Birthday Report</h1>
      <p style="${S.p}text-align:center;">This month's automated birthday celebrations have been sent.</p>
      <div style="${S.card}text-align:center;">
        <p style="margin:0 0 12px 0;font-size:13px;color:#999999;text-transform:uppercase;letter-spacing:2px;font-family:'Helvetica Neue',Arial,sans-serif;">Campaign Success</p>
        <p style="margin:0 0 8px 0;"><span style="${S.pointsBadge}">${count} EMAILS SENT</span></p>
        <p style="margin:0;color:#FFFFFF;font-size:15px;font-family:Georgia,serif;">Celebrating our customers born in <span style="${S.highlight}">${month}</span>.</p>
      </div>
      <p style="${S.muted}text-align:center;margin-top:24px;">Your customers have received their $5 birthday discount, auto-applied to their accounts for the entire month of ${month}.</p>
      <p style="${S.muted}text-align:center;">Next automated check: <strong>1st of ${nextMonthName}</strong>.</p>
      <div style="${S.btnCenter}">
        <a href="${BRAND.siteUrl}/admin" style="${S.btn}">View Dashboard</a>
      </div>
    `),
  }
}

async function sendEmail(to: string, subject: string, html: string, replyTo?: string): Promise<{ success: boolean; error?: string }> {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  const body: Record<string, unknown> = {
    from: BRAND.from,
    to: [to],
    subject,
    html,
  }
  if (replyTo) body.reply_to = replyTo

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  if (!res.ok) {
    console.error('Resend API error:', data)
    return { success: false, error: data.message || 'Failed to send email' }
  }

  return { success: true }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Allow service role to bypass
    const isServiceRole = authHeader === `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`;

    let user = null;
    let isAdmin = false;

    if (!isServiceRole) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      user = authUser;

      const { data: hasRole } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      isAdmin = !!hasRole;
    }

    const { type, data } = await req.json()

    if (!type || !data) {
      throw new Error('Missing type or data in request body')
    }

    // Permission check
    if (!isServiceRole) {
      if (type === 'welcome') {
        // Welcome email is allowed for any authenticated user
      } else if (!isAdmin) {
        return new Response(JSON.stringify({ error: 'Admin access required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    let results: Array<{ success: boolean; error?: string }> = []

    switch (type) {
      case 'welcome': {
        const email = welcomeEmail(data)
        results.push(await sendEmail(data.email, email.subject, email.html))
        break
      }
      case 'order_confirmation': {
        const email = orderConfirmationEmail(data)
        results.push(await sendEmail(data.customerEmail, email.subject, email.html))
        break
      }
      case 'discount_applied': {
        const email = discountAppliedEmail(data)
        results.push(await sendEmail(data.customerEmail, email.subject, email.html))
        break
      }
      case 'birthday_month': {
        const email = birthdayMonthEmail(data)
        results.push(await sendEmail(data.email, email.subject, email.html))
        break
      }
      case 'contact_form': {
        const toSupport = contactFormToSupport(data)
        results.push(await sendEmail(BRAND.supportEmail, toSupport.subject, toSupport.html, data.email))
        const toCustomer = contactFormToCustomer(data)
        results.push(await sendEmail(data.email, toCustomer.subject, toCustomer.html))
        break
      }
      case 'referral_success': {
        const email = referralSuccessEmail(data)
        results.push(await sendEmail(data.referrerEmail, email.subject, email.html))
        break
      }
      case 'shipping_update': {
        const email = shippingUpdateEmail(data)
        results.push(await sendEmail(data.customerEmail, email.subject, email.html))
        break
      }
      case 'waitlist_confirmation': {
        const email = waitlistConfirmationEmail(data)
        results.push(await sendEmail(data.email, email.subject, email.html))
        break
      }
      case 'waitlist_notification': {
        const email = waitlistNotificationEmail(data)
        results.push(await sendEmail(BRAND.supportEmail, email.subject, email.html))
        break
      }
      case 'launch_announcement': {
        const emails: string[] = data.emails || []
        const names: Record<string, string> = data.names || {}
        for (const recipientEmail of emails) {
          const email = launchAnnouncementEmail({ name: names[recipientEmail] || undefined })
          const result = await sendEmail(recipientEmail, email.subject, email.html)
          results.push(result)
          console.log(`Launch email to ${recipientEmail}: ${result.success ? 'sent' : result.error}`)
        }
        break
      }
      case 'admin_birthday_report': {
        const email = adminBirthdayReportEmail(data)
        results.push(await sendEmail(data.adminEmail, email.subject, email.html))
        break
      }
      default:
        throw new Error(`Unknown email type: ${type}`)
    }

    const hasError = results.find(r => !r.success)
    if (hasError) {
      throw new Error(hasError.error || 'Email send failed')
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    console.error('Send email error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
