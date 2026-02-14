

# Fix Audience Tracking, Waitlist Search, Remove Placeholders, and Smart Notification Badges

## Issues Identified

### 1. Total Audience Box Not Syncing
The "Total Audience" box on the Customers page shows `customers.length` from the Zustand store. The `customers` table in the database has 0 rows, while waitlist has entries. The "Total Audience" should reflect **both** customers AND waitlist signups combined, since in pre-launch mode the waitlist IS the audience. Currently it only counts the `customers` table.

**Fix**: Change the Total Audience count to `customers.length + waitlist.length` so it reflects the true total audience size. The Dashboard's "Customers" card will also be updated to include waitlist count.

### 2. Waitlist Search Not Working
The search input and `waitlistSearch` state exist and the `filteredWaitlist` memo looks correct. However, the table renders `filteredWaitlist` properly. Let me verify -- the issue may be that `filteredWaitlist` is used for the table but some edge in rendering. After re-reading the code, the filtering logic at line 87-94 looks correct. The issue might be that the search input is not visually connected or there's a rendering issue. I'll verify during testing and ensure it works end-to-end.

### 3. Settings Page - Remove Useless Sections
Remove the following from the Settings page:
- **General Configuration** card (Store Name, Currency) -- lines 82-107
- **SEO and Search Discovery** card (Page Title Pattern, Meta Description) -- lines 139-165
- **Notifications** card (Order Alerts, Low Stock Alerts switches) -- lines 245-262. These are placeholders with `defaultChecked` that don't persist anywhere
- **International Shipping** switch inside Regional and Shipping -- also a `defaultChecked` placeholder with no state binding

The remaining useful sections will be:
- Regional and Shipping (just the flat shipping rate)
- Social Media Presence
- Contact Information
- Store Status (Maintenance Mode)
- Save Changes button

Also clean up the `AdminSettings` interface and `useSettingsDb` to stop saving `storeName`, `currency`, `seoTitle`, `seoDescription` since they won't be editable anymore. The hardcoded defaults are fine.

### 4. Notification Badges - When Do They Clear?
Currently the sidebar badges show pending orders and waitlist count and **never go away** -- they persist as long as there's data. The fix: badges should clear when the admin actually visits that section.

**Implementation**:
- Track "last seen" counts in `localStorage` for each category
- When the admin navigates to `/admin/orders`, save the current pending count as "seen"
- When the admin navigates to `/admin/customers`, save the current waitlist count as "seen"  
- The badge only shows the **difference** between current count and last-seen count
- This means: badge appears when new items arrive, disappears after the admin visits the page

## Technical Changes

### File: `src/pages/admin/Customers.tsx`
- Change the Total Audience display from `customers.length` to `customers.length + waitlist.length`
- Verify waitlist search works correctly (the code looks right, will test)

### File: `src/components/admin/AdminSidebar.tsx`
- Add localStorage-based "last seen" tracking
- On mount, fetch current counts and compare with stored "last seen" values
- When a link is active (current page), update the "last seen" value to the current count
- Badge shows `currentCount - lastSeenCount` (only if positive)

### File: `src/pages/admin/Settings.tsx`
- Remove the General Configuration card entirely
- Remove the SEO and Search Discovery card entirely
- Remove the Notifications card (placeholder switches)
- Remove the International Shipping toggle (placeholder)
- Adjust the grid layout since there are fewer cards now

### File: `src/stores/adminStore.ts`
- Remove `storeName`, `currency`, `seoTitle`, `seoDescription` from `AdminSettings` interface (keep them as hardcoded defaults used elsewhere but not editable)
- Actually, keep them in the interface to avoid breaking other code that reads them, but just remove the UI for editing them

### File: `src/pages/admin/Dashboard.tsx`
- Update the Customers card to show combined audience (customers + waitlist count fetched separately or passed)

## Testing Plan
1. Navigate to admin Customers page -- verify Total Audience shows combined count
2. Test waitlist search by typing a name/email
3. Visit Settings -- confirm General Config, SEO, and placeholder switches are gone
4. Check notification badges appear, then navigate to the page and verify they clear
5. Navigate away and back -- badges should stay cleared until new data arrives

