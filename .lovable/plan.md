

# Move Reviews to Database

## Problem
Reviews are stored in localStorage only. This means:
- Reviews are invisible to other customers
- Reviews disappear if the browser cache is cleared
- Reviews don't persist across devices
- The Testimonials section on the homepage is empty for all visitors

## Solution
Create a `reviews` table in the database and update the components to read/write from it instead of localStorage.

---

## Step 1: Create the `reviews` table

Create a new database table with the following columns:
- `id` (uuid, primary key)
- `product_id` (text, not null)
- `user_id` (uuid, references auth.users, not null)
- `user_name` (text, not null)
- `user_avatar` (text, nullable)
- `rating` (integer, not null, 1-5)
- `comment` (text, not null)
- `likes` (text array, default empty -- stores user IDs who liked)
- `admin_comment` (jsonb, nullable -- stores reply text, author name, role, timestamp)
- `created_at` (timestamptz, default now())

RLS policies:
- **Anyone can read reviews** (public SELECT) -- reviews should be visible to all visitors
- **Authenticated users can insert their own reviews** (INSERT where `auth.uid() = user_id`)
- **Authenticated users can update likes on any review** (UPDATE on `likes` column only)
- **Admins can update reviews** (UPDATE for adding admin comments)
- **Admins can delete reviews** (DELETE for moderation)

A validation trigger will enforce rating between 1 and 5.

## Step 2: Create a custom hook `useReviewsDb`

New file: `src/hooks/useReviewsDb.ts`

This hook will:
- Fetch reviews for a given product ID using a TanStack Query
- Provide `addReview` mutation (inserts into DB, also awards 10 points)
- Provide `toggleLike` mutation (updates the likes array)
- Provide `addAdminComment` mutation (updates admin_comment jsonb)
- Fetch all high-rated reviews for the Testimonials component

## Step 3: Update `ReviewSection.tsx`

- Replace `useReviewStore` with the new `useReviewsDb` hook
- Use TanStack Query data instead of Zustand store
- Keep all existing UI, validation, and animation logic unchanged
- Reviews will now be globally visible to all visitors

## Step 4: Update `Testimonials.tsx`

- Replace `useReviewStore` with a query that fetches reviews with rating >= 4 and comment length >= 20
- Same visual output, but now pulling from the database

## Step 5: Keep `reviewStore.ts` as fallback

The Zustand store file will remain but won't be actively used. This avoids breaking any other imports during the transition.

---

## Technical Details

| File | Action |
|------|--------|
| Database migration | Create `reviews` table with RLS policies |
| `src/hooks/useReviewsDb.ts` | New hook for DB-backed review CRUD |
| `src/components/ReviewSection.tsx` | Switch from Zustand store to DB hook |
| `src/components/Testimonials.tsx` | Switch from Zustand store to DB query |

