

# Fix Admin Notification Badges Not Clearing

## Problem

The badge counts on the admin sidebar (Orders, Customers) don't disappear after the admin visits those pages. Two bugs cause this:

1. **Race condition on mount**: Both `useEffect` hooks run on mount simultaneously. The "mark as seen" effect checks `currentCountsRef.current[path]`, but the fetch hasn't completed yet (it's async), so the value is `undefined` and nothing gets saved to localStorage.

2. **No re-fetch on navigation**: The fetch only runs once on mount (`[]` dependency). If the admin navigates between admin pages, the counts are never refreshed, so returning to a page doesn't update the badge.

## Solution

Refactor the two `useEffect` hooks in `src/components/admin/AdminSidebar.tsx` into a single, cohesive flow:

### Changes to `src/components/admin/AdminSidebar.tsx`

1. **Re-fetch on every pathname change** -- Change the `fetchCounts` effect dependency from `[]` to `[location.pathname]` so counts refresh each time the admin navigates.

2. **Mark as seen inside the fetch callback** -- After fetching the current counts, immediately check if the admin is currently on a page that has a badge. If so, save the current count to localStorage and set the badge to 0. This eliminates the race condition because "mark as seen" only runs after the data is available.

3. **Remove the second `useEffect`** -- It's no longer needed since the marking logic is handled inside the fetch.

The resulting logic will be:
```
useEffect(() => {
  async function fetchAndMark() {
    // 1. Fetch current counts from DB
    // 2. Compute badges (current - seen)
    // 3. If admin is currently on a badged page, 
    //    save current count as "seen" and set badge to 0
  }
  fetchAndMark();
}, [location.pathname]);
```

### File changed

| File | Change |
|---|---|
| `src/components/admin/AdminSidebar.tsx` | Merge two useEffects into one that re-fetches on navigation and marks as seen after data loads |

