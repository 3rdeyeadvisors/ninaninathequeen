import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const BRAND = {
  name: 'Nina Armend',
  from: 'Nina Armend <support@ninaarmend.co>',
  supportEmail: 'support@ninaarmend.co',
  siteUrl: 'https://ninaninathequeen.lovable.app',
  logo: 'https://ninaninathequeen.lovable.app/favicon-32x32.png',
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

function baseWrapper(content: string): string {
  const { colors } = BRAND
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
  body{margin:0;padding:0;background:${colors.bg};font-family:'Georgia',serif;}
  .container{max-width:600px;margin:0 auto;background:${colors.bg};padding:40px 32px;}
  .logo-row{text-align:center;padding-bottom:24px;}
  .logo-text{font-size:28px;color:${colors.accent};letter-spacing:4px;font-weight:300;text-transform:uppercase;font-family:'Georgia',serif;}
  .divider{height:1px;background:${colors.accent};margin:0 0 32px 0;opacity:0.4;}
  h1{color:${colors.text};font-size:24px;font-weight:400;margin:0 0 16px 0;font-family:'Georgia',serif;}
  h2{color:${colors.text};font-size:20px;font-weight:400;margin:0 0 12px 0;font-family:'Georgia',serif;}
  p{color:${colors.text};font-size:16px;line-height:1.7;margin:0 0 16px 0;font-family:'Georgia',serif;}
  .muted{color:${colors.textMuted};font-size:14px;line-height:1.6;}
  .btn{display:inline-block;background:${colors.accent};color:#000000;padding:16px 40px;border-radius:50px;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:2px;text-transform:uppercase;font-family:'Helvetica Neue',Arial,sans-serif;}
  .btn:hover{background:${colors.accentDark};}
  .btn-center{text-align:center;padding:24px 0;}
  .card{background:${colors.cardBg};border:1px solid ${colors.border};border-radius:16px;padding:24px;margin:16px 0;}
  .footer{text-align:center;padding-top:32px;border-top:1px solid ${colors.border};margin-top:32px;}
  .footer p{color:${colors.textMuted};font-size:12px;line-height:1.8;}
  .footer a{color:${colors.accent};text-decoration:none;}
  .item-row{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid ${colors.border};}
  .item-name{color:${colors.text};font-size:15px;}
  .item-price{color:${colors.accent};font-size:15px;font-weight:600;}
  .highlight{color:${colors.accent};font-weight:600;}
  .points-badge{display:inline-block;background:${colors.accent};color:#000;padding:4px 14px;border-radius:50px;font-size:13px;font-weight:700;letter-spacing:1px;font-family:'Helvetica Neue',Arial,sans-serif;}
</style>
</head>
<body>
<div class="container">
  <div class="logo-row">
    <div class="logo-text">Nina Armend</div>
  </div>
  <div class="divider"></div>
  ${content}
  <div class="footer">
    <p>
      <a href="${BRAND.siteUrl}/shop">Shop</a> &nbsp;·&nbsp;
      <a href="${BRAND.siteUrl}/about">About</a> &nbsp;·&nbsp;
      <a href="${BRAND.siteUrl}/contact">Contact</a>
    </p>
    <p style="margin-top:16px;">© ${new Date().getFullYear()} Nina Armend. All rights reserved.</p>
    <p style="margin-top:8px;">Leblon, Rio de Janeiro, Brazil</p>
  </div>
</div>
</body>
</html>`
}

function welcomeEmail(data: { name: string; referralCode?: string }): { subject: string; html: string } {
  const { name, referralCode } = data
  return {
    subject: 'Welcome to Nina Armend',
    html: baseWrapper(`
      <h1>Welcome, ${name}</h1>
      <p>We're thrilled to have you join the Nina Armend family. Your account has been created and you've earned your first reward.</p>
      <div class="card">
        <p style="margin:0 0 8px 0;"><span class="highlight">50 Welcome Points</span> have been added to your account.</p>
        <p class="muted" style="margin:0;">Use your points toward exclusive discounts on future orders.</p>
      </div>
      ${referralCode ? `
      <div class="card">
        <p style="margin:0 0 8px 0;">Share Nina Armend with a friend and earn <span class="highlight">25 bonus points</span> when they sign up.</p>
        <p class="muted" style="margin:0;">Your referral code: <strong style="color:${BRAND.colors.accent};">${referralCode}</strong></p>
      </div>` : ''}
      <div class="btn-center">
        <a href="${BRAND.siteUrl}/shop" class="btn">Start Shopping</a>
      </div>
    `),
  }
}

function orderConfirmationEmail(data: { orderId: string; customerName: string; items: Array<{ title: string; quantity: number; price: string; size?: string }>; total: string }): { subject: string; html: string } {
  const { orderId, customerName, items, total } = data
  const itemsHtml = items.map(item =>
    `<tr>
      <td style="padding:12px 0;border-bottom:1px solid ${BRAND.colors.border};color:${BRAND.colors.text};font-size:15px;font-family:'Georgia',serif;">
        ${item.title}${item.size ? ` <span class="muted">(${item.size})</span>` : ''} × ${item.quantity}
      </td>
      <td style="padding:12px 0;border-bottom:1px solid ${BRAND.colors.border};color:${BRAND.colors.accent};font-size:15px;font-weight:600;text-align:right;font-family:'Georgia',serif;">
        $${parseFloat(item.price).toFixed(2)}
      </td>
    </tr>`
  ).join('')

  return {
    subject: `Order Confirmed — ${orderId.slice(0, 8).toUpperCase()}`,
    html: baseWrapper(`
      <h1>Order Confirmed</h1>
      <p>Thank you, ${customerName}. Your order has been received and is being prepared with care.</p>
      <div class="card">
        <p class="muted" style="margin:0 0 16px 0;">Order Reference: <strong style="color:${BRAND.colors.accent};">${orderId.slice(0, 8).toUpperCase()}</strong></p>
        <table style="width:100%;border-collapse:collapse;">
          ${itemsHtml}
          <tr>
            <td style="padding:16px 0 0;color:${BRAND.colors.text};font-size:16px;font-weight:600;font-family:'Georgia',serif;">Total</td>
            <td style="padding:16px 0 0;color:${BRAND.colors.accent};font-size:18px;font-weight:700;text-align:right;font-family:'Georgia',serif;">$${parseFloat(total).toFixed(2)}</td>
          </tr>
        </table>
      </div>
      <p class="muted">You'll receive a shipping confirmation with tracking details once your order ships. Most orders ship within 3–5 business days.</p>
      <div class="btn-center">
        <a href="${BRAND.siteUrl}/account" class="btn">View Your Orders</a>
      </div>
    `),
  }
}

function contactFormToSupport(data: { name: string; email: string; message: string }): { subject: string; html: string } {
  return {
    subject: `New Inquiry from ${data.name}`,
    html: baseWrapper(`
      <h1>New Customer Inquiry</h1>
      <div class="card">
        <p style="margin:0 0 8px 0;"><strong style="color:${BRAND.colors.accent};">From:</strong> ${data.name}</p>
        <p style="margin:0 0 8px 0;"><strong style="color:${BRAND.colors.accent};">Email:</strong> <a href="mailto:${data.email}" style="color:${BRAND.colors.accent};">${data.email}</a></p>
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid ${BRAND.colors.border};">
          <p style="margin:0;">${data.message.replace(/\n/g, '<br>')}</p>
        </div>
      </div>
      <p class="muted">Reply directly to this email to respond to the customer.</p>
    `),
  }
}

function contactFormToCustomer(data: { name: string; message: string }): { subject: string; html: string } {
  return {
    subject: "We've received your message",
    html: baseWrapper(`
      <h1>Thank You, ${data.name}</h1>
      <p>We've received your inquiry and our concierge team will respond within 24 hours.</p>
      <div class="card">
        <p class="muted" style="margin:0 0 8px 0;">Your message:</p>
        <p style="margin:0;font-style:italic;">"${data.message}"</p>
      </div>
      <p class="muted">If you need immediate assistance, please reach out to <a href="mailto:${BRAND.supportEmail}" style="color:${BRAND.colors.accent};">${BRAND.supportEmail}</a>.</p>
      <div class="btn-center">
        <a href="${BRAND.siteUrl}/shop" class="btn">Continue Shopping</a>
      </div>
    `),
  }
}

function referralSuccessEmail(data: { referrerName: string; referredName: string; pointsAwarded: number }): { subject: string; html: string } {
  return {
    subject: `You've earned ${data.pointsAwarded} referral points!`,
    html: baseWrapper(`
      <h1>Referral Reward Earned</h1>
      <p>${data.referrerName}, your friend <span class="highlight">${data.referredName}</span> just joined Nina Armend using your referral link!</p>
      <div class="card" style="text-align:center;">
        <p class="muted" style="margin:0 0 8px 0;">Points Earned</p>
        <p style="margin:0;"><span class="points-badge">+${data.pointsAwarded} PTS</span></p>
      </div>
      <p class="muted">Keep sharing your referral link to earn more rewards. You'll earn 25 points for every friend who signs up.</p>
      <div class="btn-center">
        <a href="${BRAND.siteUrl}/account" class="btn">View Your Rewards</a>
      </div>
    `),
  }
}

function shippingUpdateEmail(data: { customerName: string; orderId: string; status: string; trackingNumber?: string }): { subject: string; html: string } {
  const statusMessages: Record<string, string> = {
    'Shipped': 'Your order has been shipped and is on its way to you!',
    'Delivered': 'Your order has been delivered. We hope you love it!',
    'Out for Delivery': 'Your order is out for delivery today!',
  }
  const statusMsg = statusMessages[data.status] || `Your order status has been updated to: ${data.status}`

  return {
    subject: `Order Update — ${data.status}`,
    html: baseWrapper(`
      <h1>Shipping Update</h1>
      <p>${data.customerName}, ${statusMsg}</p>
      <div class="card">
        <p style="margin:0 0 8px 0;"><strong style="color:${BRAND.colors.accent};">Order:</strong> ${data.orderId.slice(0, 8).toUpperCase()}</p>
        <p style="margin:0 0 8px 0;"><strong style="color:${BRAND.colors.accent};">Status:</strong> ${data.status}</p>
        ${data.trackingNumber ? `<p style="margin:0;"><strong style="color:${BRAND.colors.accent};">Tracking:</strong> ${data.trackingNumber}</p>` : ''}
      </div>
      <div class="btn-center">
        <a href="${BRAND.siteUrl}/account" class="btn">View Order Details</a>
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
    const { type, data } = await req.json()

    if (!type || !data) {
      throw new Error('Missing type or data in request body')
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
      case 'contact_form': {
        // Send to support
        const toSupport = contactFormToSupport(data)
        results.push(await sendEmail(BRAND.supportEmail, toSupport.subject, toSupport.html, data.email))
        // Send confirmation to customer
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