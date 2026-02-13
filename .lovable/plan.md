

# Implementation Plan

This plan covers all requested changes, organized into sequential tasks that will each be implemented and tested before moving to the next.

---

## Task 1: Sustainability Page Updates

**What changes:**
- Remove "gold-foiled" from the Conscious Packaging description (line 35) -- change to "Our signature packaging is 100% recyclable and plastic-free, designed to be kept and reused."
- Replace the Slow Fashion Philosophy image (line 71) with `user-uploads://IMG_1366.jpeg`
- Replace the Water Conservation image (line 85) with `user-uploads://IMG_1320.jpeg` (the beach photo)
- Change image containers from rectangular (`aspect-video rounded-xl`) to circular (`w-48 h-48 rounded-full mx-auto`) with `object-cover` for consistent display across all devices

**File:** `src/pages/Sustainability.tsx`

---

## Task 2: Admin Products -- Hide/Show Toggle

**What changes:**
- Add an `Eye`/`EyeOff` icon button to each product row in the admin products table
- Clicking toggles the product `status` between `Active` and `Inactive`, syncing to the database via `upsertProduct`
- Hidden products show with a visual indicator (dimmed row, "Hidden" badge)
- Update `useProducts` hook (line 75) to filter out `status === 'Inactive'` products from the storefront
- The admin Products page continues to show all products including hidden ones

**Files:** `src/pages/admin/Products.tsx`, `src/hooks/useProducts.ts`

---

## Task 3: Points System Overhaul

**What changes:**

**Database migration:**
- Add `points_reset_at` column to `profiles` table (default `now()`)
- Update `handle_new_user` function to give 50 points instead of 250 and set `points_reset_at`
- Create a `check_and_reset_points` database function that resets points to 0 if 60+ days have passed since `points_reset_at`

**Points earning structure:**
- Account creation: 50 points (down from 250)
- Purchase: 1 point per $1 spent (awarded in `finalize-square-order` edge function)
- Review submission: 10 points (awarded in ReviewSection component via database update)
- Referral signup: 25 points (when a referred user creates an account)

**Frontend updates:**
- Update signup card description from "250 welcome points" to "50 welcome points"
- Add 60-day reset timer display in the Rewards tab of Account page
- Call `check_and_reset_points` on Account page load to auto-reset if needed

**Files:** Database migration, `supabase/functions/finalize-square-order/index.ts`, `src/components/ReviewSection.tsx`, `src/pages/Account.tsx`, `src/stores/cloudAuthStore.ts`

---

## Task 4: Reviews & Testimonials

**What changes:**
- The review form already works (rating + text comment for authenticated users) -- verified functional
- After submitting a review, award 10 points by updating the `profiles` table
- Update the Testimonials component on the homepage to display real user reviews from localStorage alongside hardcoded fallback testimonials
- Ensure the review form is visible and accessible on product pages

**Files:** `src/components/ReviewSection.tsx`, `src/components/Testimonials.tsx`, `src/stores/reviewStore.ts`

---

## Task 5: Referral System Integration with Points

**What changes:**
- The referral code is already generated on signup (`NINA-XXX-123` format) and stored in `profiles.referral_code`
- The referral link copy button already works in the Account Rewards tab
- Add referral tracking: create a `referrals` table to track who referred whom (referrer_id, referred_id, status, created_at)
- When a new user signs up with a referral code, award 25 points to the referrer
- Add a "Your Referrals" section in the Rewards tab showing count of successful referrals and points earned from them
- Implement referral code capture: when users visit `/invite/CODE`, store the code in localStorage and pre-fill it during signup
- Add referral processing in the `handle_new_user` database function to credit the referrer

**Database migration:**
- Create `referrals` table with columns: id, referrer_id, referred_id, status, points_awarded, created_at
- RLS policies: users can read their own referrals
- Update `handle_new_user` to check for referral metadata and credit referrer

**Files:** Database migration, `src/pages/Account.tsx`, `src/stores/cloudAuthStore.ts`, `src/App.tsx` (add `/invite/:code` route)

---

## Technical Details

### Database Changes (Single Migration)

```text
1. ALTER TABLE profiles ADD COLUMN points_reset_at timestamptz DEFAULT now()
2. CREATE TABLE referrals (id uuid PK, referrer_id uuid, referred_id uuid, status text, points_awarded int, created_at timestamptz)
3. RLS on referrals: users can SELECT their own rows (referrer_id = auth.uid())
4. UPDATE handle_new_user: 50 points, set points_reset_at, process referral code from metadata
5. CREATE FUNCTION check_and_reset_points(user_id uuid) -- resets if 60 days passed
```

### Edge Function Update
- `finalize-square-order`: After successful payment, look up customer email in profiles, award 1 point per $1 of order total

### Execution Order
1. Sustainability page (visual fix)
2. Admin hide/show toggle
3. Database migration (points_reset_at + referrals table + updated functions)
4. Points awarding on purchases (edge function)
5. Points awarding on reviews
6. Testimonials from real reviews
7. Referral tracking UI in Account page
8. Referral code capture route
9. End-to-end testing of all features

