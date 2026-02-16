

# Full Implementation: Behavioral Intelligence, AI Chat Fix, Store Intelligence Upgrade, and Legal Updates

## Overview

This plan implements the complete approved feature set: database-backed product view tracking, browse-but-don't-buy detection, AI chat stability fixes, enriched Store Intelligence cards, and updated Privacy Policy / Terms of Service to cover the new tracking.

---

## 1. Database Migration: `product_views` Table

Create a new table to track authenticated user product browsing behavior.

```sql
CREATE TABLE public.product_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  product_title text,
  view_count integer NOT NULL DEFAULT 1,
  first_viewed_at timestamptz NOT NULL DEFAULT now(),
  last_viewed_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint for upsert
ALTER TABLE public.product_views ADD CONSTRAINT unique_user_product UNIQUE (user_id, product_id);

-- RLS
ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;

-- Users can upsert their own views
CREATE POLICY "Users can insert own views" ON public.product_views
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own views" ON public.product_views
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Admins can read all views for analytics
CREATE POLICY "Admins can read all views" ON public.product_views
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
```

## 2. Product View Tracking (`src/pages/ProductPage.tsx`)

When an authenticated user visits a product page, silently upsert a row in `product_views`. The existing localStorage tracking stays for anonymous visitors (used on dashboard "Most Viewed" section). The new DB tracking adds server-side behavioral data for logged-in users.

**Changes:**
- Import `supabase` and `useCloudAuthStore`
- After the existing localStorage tracking block, add a DB upsert for authenticated users
- Uses fire-and-forget pattern (no await blocking UI)
- Upserts with `onConflict: 'user_id,product_id'` to increment `view_count`

## 3. Fix AI Chat Execution (`src/pages/admin/Dashboard.tsx`)

**Critical fix -- why the AI can't respond:**

Line 334 calls `await supabase.auth.getUser()` inline during message save, and line 337 calls `await supabase.auth.getSession()`. Per project constraints, these cause execution hangs.

**Fix:**
- Fetch session ONCE at the very top of `handleSendMessage` using a single `supabase.auth.getSession()` call
- Extract `token` and `userId` from the result
- Use those variables for all subsequent operations (DB inserts, API call)
- Make DB inserts fire-and-forget (no `await`, just `.then()`)
- Add `.select('id').maybeSingle()` to inserts since admin has SELECT permission on `chat_messages`
- Set `isAiTyping = false` when first assistant token arrives (`addedAssistant` flips true)

## 4. Behavioral Intelligence in Dashboard (`src/pages/admin/Dashboard.tsx`)

**New data fetching:**
- Add a `useEffect` that queries `product_views` (all users, admin RLS) and cross-references with `orders` to find browse-but-don't-buy patterns
- Store results in state: `behavioralInsights`

**Detection logic:**
- Find product_views where `view_count >= 3` and `last_viewed_at` is within last 14 days
- Cross-reference with orders to check if that user has purchased that product
- If not purchased, flag as "high intent" -- surface as an insight card

**Store Intelligence cards upgrade:**
- Replace the two generic "Top Opportunity" / "Growth Signal" cards with up to 4 data-driven cards:
  - Best Seller (from salesByProduct data)
  - Top Customer (from customerSpend data)
  - High-Intent Browsers (from behavioral data -- "Sarah viewed X 5 times but hasn't purchased")
  - Low Stock Alert (specific product names)

**AI Context enrichment:**
- Add a `=== BEHAVIORAL INTELLIGENCE ===` section to `storeContext` with the browse-but-don't-buy data so the AI can proactively recommend discount strategies

## 5. Edge Function -- No Changes Needed

The `ai-chat/index.ts` edge function is already correctly configured with:
- Silent memory (queries last 30 messages)
- `google/gemini-3-pro-preview` model
- Enhanced system prompt with cross-referencing behaviors

The problem was entirely client-side (auth call hangs). No edge function changes required.

## 6. Privacy Policy Update (`src/pages/Privacy.tsx`)

Add a new section for "Browsing Activity" that discloses:
- We collect browsing behavior (product views) for registered users
- This data is used to improve recommendations and personalize offers
- Users can delete their account to remove all tracking data

## 7. Terms of Service Update (`src/pages/Terms.tsx`)

Add a new section "5. Analytics and Personalization" that covers:
- Use of browsing data for store improvement and personalized offers
- Data is only collected for authenticated users

---

## Files Changed

| File | Change |
|------|--------|
| **Database migration** | Create `product_views` table with RLS |
| `src/pages/ProductPage.tsx` | Add DB upsert for authenticated user views |
| `src/pages/admin/Dashboard.tsx` | Fix auth calls, add behavioral data fetch, upgrade Store Intelligence cards, enrich AI context |
| `src/pages/Privacy.tsx` | Add "Browsing Activity" section |
| `src/pages/Terms.tsx` | Add "Analytics and Personalization" section |

## Testing Checklist

1. Open admin dashboard -- AI chat should respond when you type a question (no more hanging)
2. Ask "What's my most sold item?" -- should get specific product data with cross-references
3. Log in as a regular user, visit a product page 3+ times -- verify `product_views` table gets rows
4. Go to admin dashboard -- Store Intelligence should show behavioral insight if any user has 3+ views without purchase
5. Ask AI "Are any customers interested but not buying?" -- should reference behavioral data
6. Check Privacy and Terms pages for new sections about browsing data collection
7. Typing indicator should disappear as soon as AI starts streaming its response

