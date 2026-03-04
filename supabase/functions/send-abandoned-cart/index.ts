import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { email, customerName, items, total } = await req.json();

    if (!email || !items || items.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: corsHeaders });
    }

    const itemsHtml = items.map((item: any) =>
      `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #222222;color:#FFFFFF;font-size:14px;font-family:Georgia,serif;">
          ${item.title} × ${item.quantity}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #222222;color:#C9A96E;font-size:14px;text-align:right;font-family:Georgia,serif;">
          $${(parseFloat(item.price) * item.quantity).toFixed(2)}
        </td>
      </tr>`
    ).join('');

    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Georgia,serif;">
<div style="max-width:600px;margin:0 auto;background:#000000;padding:40px 32px;">
  <div style="text-align:center;padding-bottom:24px;">
    <div style="font-size:36px;color:#C9A96E;font-weight:400;font-family:Georgia,serif;">Nina Armend</div>
  </div>
  <div style="height:1px;background:#C9A96E;margin:0 0 32px 0;opacity:0.4;"></div>
  <h1 style="color:#FFFFFF;font-size:24px;font-weight:400;margin:0 0 16px 0;font-family:Georgia,serif;">You left something behind</h1>
  <p style="color:#FFFFFF;font-size:16px;line-height:1.7;margin:0 0 16px 0;font-family:Georgia,serif;">Hi ${customerName || 'there'}, your bag is still waiting for you.</p>
  <div style="background:#111111;border:1px solid #222222;border-radius:16px;padding:24px;margin:16px 0;">
    <table style="width:100%;border-collapse:collapse;">
      ${itemsHtml}
      <tr>
        <td style="padding:16px 0 0;color:#FFFFFF;font-size:16px;font-weight:600;font-family:Georgia,serif;">Total</td>
        <td style="padding:16px 0 0;color:#C9A96E;font-size:18px;font-weight:700;text-align:right;font-family:Georgia,serif;">$${parseFloat(total).toFixed(2)}</td>
      </tr>
    </table>
  </div>
  <div style="text-align:center;padding:24px 0;">
    <a href="${SUPABASE_URL.replace('ykhgqjownxmioexytfzc.supabase.co', 'ninaarmend.co')}/checkout" style="display:inline-block;background:#C9A96E;color:#000000;padding:16px 40px;border-radius:50px;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">Complete Your Order</a>
  </div>
  <p style="color:#999999;font-size:14px;text-align:center;">This is a one-time reminder. We won't send another.</p>
  <div style="text-align:center;padding-top:32px;border-top:1px solid #222222;margin-top:32px;">
    <p style="color:#999999;font-size:12px;">© ${new Date().getFullYear()} Nina Armend. All rights reserved.</p>
  </div>
</div>
</body></html>`;

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured');

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Nina Armend <support@ninaarmend.co>',
        to: email,
        subject: 'Your Nina Armend bag is waiting 🌊',
        html,
      }),
    });

    if (!res.ok) throw new Error(await res.text());

    // Log that we sent this so we don't spam
    await supabase.from('abandoned_cart_logs').upsert({ email, sent_at: new Date().toISOString() }, { onConflict: 'email' });

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
