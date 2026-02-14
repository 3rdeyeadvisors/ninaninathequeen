
# Make the AI Assistant Insanely Smart

## Problem
The AI chatbox only receives bare numerical stats (revenue, order count, inventory). When you ask something like "What's our target audience?", it has zero brand knowledge to draw from and either gives a generic non-answer or fails entirely.

## Solution: Enrich the AI with Full Brand + Store Intelligence

### 1. Supercharge the Store Context (Dashboard.tsx)

The `storeContext` string passed to the edge function will be expanded from just numbers to a comprehensive business intelligence brief:

**Add brand knowledge block:**
- Brand name, mission, positioning (luxury Brazilian swimwear)
- Target audience profile (fashion-forward women 25-40 who value body confidence, luxury, sustainability)
- Brand values (body positivity, Brazilian craftsmanship, eco-conscious fabrics)
- Key differentiators (Italian fabrics, made in Brazil, flattering all body types)

**Add product catalog details:**
- Full product names, prices, categories, and descriptions (not just inventory counts)

**Add waitlist/audience data:**
- Waitlist count and growth context
- Customer demographics if available

**Add business stage context:**
- Pre-launch / maintenance mode status so the AI understands the current phase

### 2. Upgrade the System Prompt (Edge Function)

**File:** `supabase/functions/ai-chat/index.ts`

Enhance the system prompt to make the AI act as a strategic business advisor:
- Give it the persona of a luxury brand strategist who knows Nina Armend intimately
- Tell it to proactively offer strategic recommendations, not just recite data
- Allow it to reason about target audience, marketing strategy, pricing, and growth based on the brand context
- Tell it to answer confidently about the brand even when specific data points aren't in the context, using its knowledge of luxury swimwear markets

### 3. Updated storeContext Builder (Dashboard.tsx)

The `storeContext` memo will be expanded to include:

```
Brand: Nina Armend - luxury Brazilian swimwear
Mission: Celebrating body beauty with pride, grace, and individuality
Target Audience: Fashion-forward women 25-40 who value luxury, body confidence, and sustainability
Products: Premium swimwear made with Italian fabrics and Brazilian craftsmanship
Stage: Pre-launch (maintenance mode, collecting waitlist signups)

--- Store Metrics ---
Revenue: $X
Orders: X confirmed, X pending
Products: [name - $price - X in stock] for each product
Waitlist Signups: X
Customers: X
Low Stock: X products below threshold

--- Recent Activity ---
Recent orders: ...
```

This gives the AI everything it needs to answer questions about audience, strategy, product positioning, marketing, and operations -- all grounded in real data.

## Files Changed

- `supabase/functions/ai-chat/index.ts` -- Enhanced system prompt with brand strategist persona
- `src/pages/admin/Dashboard.tsx` -- Expanded storeContext with brand knowledge, product catalog, waitlist data, and business stage

## Testing Plan
1. Navigate to admin dashboard
2. Ask "What's our target audience?" -- should get a detailed, brand-aware answer
3. Ask "What marketing strategy do you recommend?" -- should reference the pre-launch stage and waitlist
4. Ask "How are we doing on inventory?" -- should reference specific product names and stock levels
