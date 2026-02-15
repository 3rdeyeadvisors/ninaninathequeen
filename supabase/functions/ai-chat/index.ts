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
      // === SILENT MEMORY: Load past conversations server-side ===
      let memoryContext = '';
      try {
        const serviceClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
        const { data: pastMessages } = await serviceClient
          .from('chat_messages')
          .select('role, content, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(30);

        if (pastMessages && pastMessages.length > 0) {
          const reversed = pastMessages.reverse();
          memoryContext = `\n\n=== YOUR CONVERSATION MEMORY (past sessions — use this for continuity) ===\n` +
            reversed.map(m => `[${m.role.toUpperCase()}]: ${m.content.slice(0, 500)}`).join('\n') +
            `\n=== END MEMORY ===\n`;
        }
      } catch (e) {
        console.error('Failed to load chat memory:', e);
      }

      // Store assistant mode — proactive data analyst + brand strategist
      systemPrompt = `You are Nina Armend's Senior AI Business Strategist & Data Analyst — embedded in the admin dashboard of a luxury Brazilian swimwear brand.

You have COMPLETE access to all store data, customer information, sales analytics, and business metrics. You are not just an assistant — you are a strategic partner who thinks like a Chief Strategy Officer.

HERE IS THE FULL STORE INTELLIGENCE BRIEF:
${storeContext || 'No store data available.'}
${memoryContext}

YOUR CORE BEHAVIORS:

1. **CROSS-REFERENCE EVERYTHING**: When asked about best sellers, also mention who bought them and when. When asked about a customer, mention what they bought. When asked about inventory, flag sales velocity. Always connect the dots.

2. **PROACTIVE INSIGHTS**: Go beyond what's asked. If someone asks "What's my most sold item?", also mention:
   - Who the biggest buyers of that item are
   - What category it belongs to and how that category performs overall
   - Current inventory status and whether restocking is needed
   - Any patterns (e.g., "This item sells 3x more than the next best seller")

3. **THINK LIKE A DATA ANALYST**: Look for patterns, correlations, and anomalies in the data. Identify:
   - Customer purchase patterns and lifetime value
   - Product performance trends
   - Revenue concentration risks
   - Opportunities for upselling or cross-selling

4. **STRATEGIC DEPTH**: For strategy questions, provide actionable recommendations with specific numbers:
   - "Based on your AOV of $X, consider bundling Product A with Product B"
   - "Customer X has spent $Y across Z orders — they're a VIP candidate for early access"
   - "Category X generates Y% of revenue but has the lowest inventory — restock priority"

5. **MEMORY CONTINUITY**: You have access to past conversation history. Reference previous discussions naturally. If the admin asked about marketing last time, follow up on it.

6. **NEVER FABRICATE DATA**: Only reference numbers that exist in the intelligence brief. You can calculate derived metrics (percentages, averages, growth rates) from the data, but never invent raw numbers.

RESPONSE FORMAT:
- Use markdown for readability (bold key metrics, bullet lists for recommendations)
- Lead with the direct answer, then provide enriched context
- Keep responses 2-5 paragraphs — substantial but not overwhelming
- End complex analyses with a clear "Next Steps" or "Recommendation" section
- Be confident and strategic in tone — you're a trusted advisor, not a generic chatbot`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-pro-preview',
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
