
# Fix: Admin Dashboard Settings - Two Root Causes Found

## What's Actually Happening

After thorough investigation (checking RLS policies, database state, network requests, and code flow), the database and permissions are working correctly. The save operation IS reaching the database. The issues are in how the frontend handles data.

### Root Cause 1: Settings form shows stale data (causes "different info in different browsers")

The Settings page initializes `localSettings` from the zustand store, which loads from **localStorage** first, then fetches from the database. But `useState(settings)` only captures the value once at mount time. By the time the database fetch completes and updates the zustand store, the form is already showing the old localStorage values.

- Browser A: has localStorage from last session with certain values
- Browser B: brand new, shows hardcoded defaults (e.g. "Nina Armend | Luxury Brazilian Swimwear")
- Neither shows the actual database values

### Root Cause 2: Save appears to "spin forever" due to silent failure path

When the settings record ID is not cached (e.g. first load or after clearing cache), the save function tries to fetch it. If timing is off, it can fail silently. The `toast.promise` success callback receives `false` but sonner still treats the resolution as "success", showing misleading feedback while the spinner may not clear properly.

## Fix Plan

### Step 1: Make Settings page sync with database values

In `Settings.tsx`, replace the one-time `useState(settings)` with an effect that updates `localSettings` when the zustand store changes (after the DB fetch completes). This ensures the form always shows the database values, not stale localStorage.

### Step 2: Add robust save feedback

In `Settings.tsx`, replace `toast.promise` with explicit try/catch and manual toast calls. Add a safety timeout so the spinner cannot spin forever. When `updateSettingsDb` returns `false`, show an explicit error toast.

### Step 3: Add console logging to save flow

In `useSettingsDb.ts`, add minimal logging at key points (before update, after update, on error) so future issues are immediately diagnosable from the browser console.

## Technical Details

**Settings.tsx changes:**
- Add a `useEffect` that watches `settings` from the zustand store and updates `localSettings` when settings change (but only if the user hasn't started editing)
- Replace `toast.promise` with manual `toast.success`/`toast.error` calls after awaiting the result
- Add a 15-second safety timeout on `isSaving`

**useSettingsDb.ts changes:**
- Add `console.log` statements at: start of save, after ID resolution, after update result
- No functional changes needed -- the save logic itself is correct

**No database or RLS changes needed** -- the schema and permissions are confirmed working correctly.
