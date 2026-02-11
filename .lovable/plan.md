

# Fix Admin Dashboard Saving Issue

## Problem
The save button spins forever because the code tries to write to columns that don't exist in the `store_settings` database table. The update silently fails, and the UI never resolves.

## Root Cause
The `store_settings` table has 10 columns, but the settings hook (`useSettingsDb.ts`) tries to write to 8 additional columns that were never added via migration:

| Missing Column | Type |
|---|---|
| `square_application_id` | text |
| `square_location_id` | text |
| `seo_title` | text |
| `seo_description` | text |
| `instagram_url` | text |
| `facebook_url` | text |
| `tiktok_url` | text |
| `contact_email` | text |
| `contact_phone` | text |
| `is_maintenance_mode` | boolean |

## Fix

### Step 1: Add missing columns to `store_settings`
Run a database migration to add all 10 missing columns with sensible defaults so existing rows are unaffected.

### Step 2: Fix the `store_info` 404 error
There is a reference somewhere in the code to a `store_info` table that doesn't exist (visible in the network logs). Find and remove or redirect it to `store_settings`.

### Step 3: Verify the save flow
After the migration, the existing `useSettingsDb.ts` code will work as-is since it already maps to the correct column names. No code changes should be needed beyond fixing the `store_info` reference.

## Technical Details

Migration SQL:
```sql
ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS square_application_id text,
  ADD COLUMN IF NOT EXISTS square_location_id text,
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS facebook_url text,
  ADD COLUMN IF NOT EXISTS tiktok_url text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS is_maintenance_mode boolean DEFAULT false;
```

No RLS policy changes are needed -- the existing RESTRICTIVE admin-only policies already cover ALL operations on `store_settings`.

