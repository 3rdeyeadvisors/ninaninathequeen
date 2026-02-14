

# Fix Waitlist Issues + Add Notification Badges

## Part 1: Fix Waitlist Issues

### Problem
The waitlist fetch in `src/pages/admin/Customers.tsx` uses `supabase.from('waitlist' as any)` -- the `as any` cast is unnecessary since `waitlist` exists in the generated types. More importantly, the waitlist data only loads when the user clicks the "Waitlist" tab (due to the `activeTab === 'waitlist'` guard in the useEffect). This means:
- The waitlist badge count shows `0` on initial load until the tab is clicked
- If the fetch silently fails (e.g. auth timing), the user sees an empty list with no feedback

### Fix
1. **Remove `as any` casts** -- Use proper typed `supabase.from('waitlist')` calls (lines 53 and 98)
2. **Fetch waitlist on mount**, not just when the tab is active -- so the badge count is accurate immediately
3. **Add error toast** when waitlist fetch fails so the user knows something went wrong instead of seeing a blank list

**File:** `src/pages/admin/Customers.tsx`
- Line 53: Change `from('waitlist' as any)` to `from('waitlist')`
- Line 98: Change `from('waitlist' as any)` to `from('waitlist')`
- Lines 65-69: Remove the `activeTab === 'waitlist'` guard so waitlist fetches on component mount
- Line 59: Add `toast.error('Failed to load waitlist')` in the catch block

---

## Part 2: Add Notification Badges to Admin Sidebar

### What's Changing
The admin sidebar navigation links will show notification badge counts on the top-right corner of each category when there's new activity:

- **Orders** -- Shows count of orders with "Pending" status
- **Customers** -- Shows total waitlist count (since in maintenance mode, waitlist signups are the key metric)

### Implementation

**File:** `src/components/admin/AdminSidebar.tsx`

1. Import `supabase` client and add state for notification counts
2. On mount, fetch:
   - Pending orders count: `supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'Pending')`
   - Waitlist count: `supabase.from('waitlist').select('id', { count: 'exact', head: true })`
3. Display a small red/primary badge circle with the count on the top-right of the relevant sidebar link icons
4. Only show the badge when count > 0

### Technical Details

The sidebar links array will be extended with an optional `badgeCount` property. A small absolute-positioned badge element renders over the link when the count is greater than zero. The badge will use the brand's primary/gold color for consistency with the luxury aesthetic.

```text
+-------------------+
| Orders  [3]       |  <-- badge shows pending order count
+-------------------+
| Customers [5]     |  <-- badge shows waitlist signups
+-------------------+
```

The counts are fetched with `head: true` (count-only query) for efficiency -- no row data is transferred.

---

## Testing Plan

After implementation:
1. Navigate to admin dashboard and verify badge counts appear on sidebar
2. Click to the Customers page and verify the Waitlist tab loads data immediately (not just on tab click)
3. Verify the waitlist count matches between the sidebar badge and the waitlist tab
4. Confirm no console errors related to waitlist queries

