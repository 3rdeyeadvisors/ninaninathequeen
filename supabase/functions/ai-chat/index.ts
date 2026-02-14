import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, storeContext, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check admin role
    const { data: hasRole } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!hasRole) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let systemPrompt: string;

    if (mode === 'product_description') {
      systemPrompt = `You are a luxury copywriter for Nina Armend, a premium Brazilian swimwear brand. 
Write compelling, elegant product descriptions that:
- Emphasize premium Brazilian fabrics and craftsmanship
- Use sensual, sophisticated language fitting a luxury beach brand
- Keep descriptions 2-3 sentences max
- Highlight comfort, fit, and style
- Never use generic filler words
Only return the description text, nothing else.`;
    } else {
      // Store assistant mode — brand-aware strategic advisor
      systemPrompt = `You are Nina Armend's AI Business Strategist — a senior luxury brand consultant embedded in the admin dashboard.

You have deep knowledge of:
- The Nina Armend brand: luxury Brazilian swimwear celebrating body beauty with pride, grace, and individuality
- The luxury swimwear market, DTC e-commerce, pre-launch strategies, and fashion brand growth
- Marketing, audience development, pricing strategy, and inventory management

HERE IS THE FULL STORE INTELLIGENCE BRIEF:
${storeContext || 'No store data available.'}

YOUR BEHAVIOR:
- Answer confidently about the brand, its audience, positioning, and strategy. You KNOW this brand intimately.
- When asked about target audience, marketing, pricing, or growth — give specific, strategic recommendations grounded in the brand context and real data above.
- Reference actual product names, prices, inventory levels, waitlist counts, and order data when relevant.
- If the store is in pre-launch/maintenance mode, tailor advice to that stage (e.g., waitlist growth, social media buzz, influencer seeding, email campaigns).
- Be proactive: suggest next steps, flag opportunities, warn about risks.
- Keep responses concise but substantive — 2-4 short paragraphs max unless the question warrants more detail.
- Use a professional, strategic tone — like a trusted advisor, not a generic chatbot.
- Format responses with markdown for readability (bold key points, use bullet lists for recommendations).
- If a question truly falls outside your knowledge AND the provided data, say so — but this should be rare given how much context you have.
- NEVER make up specific numbers that aren't in the data. You can reason about trends and strategy without inventing metrics.`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits depleted. Please add credits in Settings.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const t = await response.text();
      console.error('AI gateway error:', response.status, t);
      return new Response(JSON.stringify({ error: 'AI service unavailable' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (e) {
    console.error('ai-chat error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
