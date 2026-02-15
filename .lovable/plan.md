

# Make the AI Super Intelligent (with Silent Memory)

## What Changes

### 1. Remove Visual Chat History Loading (Dashboard.tsx)

The `useEffect` that loads old messages from `chat_messages` table and displays them on screen will be removed. The chat will always start fresh with just the greeting. However, messages will still be saved to the database so the AI can reference them.

### 2. Feed the AI Its Own Memory Silently (Dashboard.tsx + Edge Function)

Instead of loading old messages into the visible chat, the edge function will query the `chat_messages` table server-side and inject the last ~20 messages as hidden context in the system prompt. This way the AI "remembers" past conversations without cluttering the UI.

### 3. Supercharge the Store Context with Deep Analytics (Dashboard.tsx)

The `storeContext` currently has product names/prices and order summaries but lacks the detail needed for questions like "What's my most sold item?" or "Which customer spends the most?" 

**Add these data blocks:**

- **Sales by Product** -- aggregate all confirmed order items to show units sold per product, ranked by quantity. This directly answers "most sold item."
- **Top Customers by Spend** -- rank customers by total spend and order count, so the AI can say "Customer X bought the most."
- **Customer Purchase Details** -- for each recent order, include the full item list (product name, size, quantity, price) so the AI can cross-reference who bought what.
- **Revenue by Category** -- aggregate sales by product category for strategic insights.
- **Average Order Value** -- simple but powerful metric for strategy questions.

Example of enriched context:

```
=== SALES ANALYTICS ===
Most Sold Products (by units):
1. Copacabana Bikini Set — 12 units sold — $2,388 revenue
2. Ipanema One-Piece — 8 units sold — $1,592 revenue

Top Customers by Spend:
1. Sarah Johnson — $856 total — 4 orders
2. Maria Santos — $598 total — 2 orders

Average Order Value: $199.00
Revenue by Category: Bikini Sets $3,200 | One-Pieces $1,800

=== DETAILED ORDER LOG ===
- Order #ABC: Sarah Johnson — Copacabana Bikini (S) x2, Ipanema One-Piece (M) x1 — $597
```

### 4. Upgrade to Smarter Model (Edge Function)

Switch from `google/gemini-3-flash-preview` to `google/gemini-3-pro-preview` for deeper reasoning and more nuanced strategic answers.

### 5. Enhanced System Prompt (Edge Function)

Update the system prompt to:
- Instruct the AI to cross-reference data proactively (e.g., when asked about best sellers, also mention who bought them)
- Think like a data analyst -- look for patterns, correlations, and actionable insights
- Query its memory (injected past conversations) to maintain continuity across sessions
- Go beyond what's asked -- if someone asks about inventory, also flag sales velocity

## Files Changed

- **`src/pages/admin/Dashboard.tsx`** -- Remove visual history loading, enrich storeContext with sales analytics, top customers, detailed order items
- **`supabase/functions/ai-chat/index.ts`** -- Query chat_messages for silent memory, upgrade model, enhance system prompt for proactive intelligence

## Testing

1. Open admin dashboard -- chat should start fresh (no old messages loaded)
2. Ask "What's my most sold item?" -- should get specific product name with units sold
3. Ask "Who is my best customer?" -- should get customer name with spend and order details
4. Ask a follow-up referencing a previous conversation topic -- AI should remember from its silent memory
