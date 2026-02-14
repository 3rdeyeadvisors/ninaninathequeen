

## Spreadsheet Size Columns, Maintenance Waitlist, Admin Login on Maintenance Page, and Waitlist Tracking

---

### 1. Add Size Columns to Spreadsheet Download

Currently the download exports a single "Stock" number. It will be updated to include individual columns for each size (XS, S, M, L, XL, XXL, 2XL) so she can easily see and edit stock per size.

**File:** `src/hooks/useSpreadsheetSync.ts`
- Update the `downloadTemplate` function to replace the single "Stock" column with individual size columns (XS, S, M, L, XL, XXL, 2XL)
- Each size column will show the inventory count from `sizeInventory` for that size, defaulting to 0
- Keep a "Total Stock" column as a summary

---

### 2. Maintenance Page Waitlist Form

Add a waitlist signup section to the maintenance page where visitors can enter their email (required) and name (optional) to be notified when the store launches.

**Database Migration:**
- Create a `waitlist` table with columns: `id` (uuid), `email` (text, unique, not null), `name` (text, nullable), `created_at` (timestamptz)
- Enable RLS with a permissive INSERT policy for anonymous users (so visitors can sign up without an account)
- Add a restrictive SELECT/DELETE policy for admins only

**File:** `src/pages/Maintenance.tsx`
- Add email input (required) and name input (optional) with a "Join the Waitlist" button
- On submit, insert into the `waitlist` table via the Supabase client
- Show success/error toast messages
- Validate email format before submitting
- Show a confirmation message after successful signup

**File:** `supabase/functions/send-email/index.ts`
- Add a `waitlist_confirmation` email type that sends a branded confirmation to the person who signed up
- Add a `waitlist_notification` email type that notifies the admin (support@ninaarmend.co) about the new signup

---

### 3. Admin Login Section on Maintenance Page

When maintenance mode is on, non-admin users see the maintenance page and cannot access the admin panel. Add a discreet admin login section so the owner can still log in and access admin features during maintenance.

**File:** `src/pages/Maintenance.tsx`
- Add a small "Admin Access" link or icon at the bottom of the page
- Clicking it reveals a compact login form (email + password)
- On successful admin login, redirect to `/admin` dashboard
- Uses the existing Cloud Auth `signInWithEmail` method
- After login, the `MaintenanceGuard` in App.tsx already bypasses maintenance for admin users, so they'll see the full site

---

### 4. Waitlist Section in Customer Audience

Add a tab or section in the admin Customers page to view and manage waitlist signups.

**File:** `src/pages/admin/Customers.tsx`
- Add a "Waitlist" tab alongside the existing customer table
- Fetch waitlist entries from the `waitlist` database table
- Display: email, name (if provided), signup date
- Add a search/filter for waitlist entries
- Show total waitlist count in a stat card
- Add ability to delete waitlist entries
- Add a "Download Waitlist" button to export as CSV

---

### Technical Summary

1. **Database migration:** Create `waitlist` table with RLS policies (anonymous INSERT, admin-only SELECT/DELETE)
2. **`src/pages/Maintenance.tsx`** -- Add waitlist form (email + optional name) and admin login section
3. **`src/hooks/useSpreadsheetSync.ts`** -- Add per-size columns (XS, S, M, L, XL, XXL, 2XL) to spreadsheet download
4. **`supabase/functions/send-email/index.ts`** -- Add `waitlist_confirmation` and `waitlist_notification` email templates
5. **`src/pages/admin/Customers.tsx`** -- Add waitlist tab with table, search, count, CSV export, and delete functionality

