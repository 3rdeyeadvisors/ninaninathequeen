
# Fix Inconsistent Admin Dashboard Statistics

## Problem Identified

Every time you log in, your admin dashboard statistics (orders, customers, revenue) appear different. This is happening because of how the data store handles persistence:

1. **Store Initialization Race Condition** - When the app loads, the store briefly shows default sample data before the saved data loads from browser storage
2. **No Loading State** - The dashboard renders immediately with initial values before the stored data is ready
3. **Potential Storage Conflicts** - If localStorage gets cleared or the store version changes, data resets to defaults

## Solution Overview

Add proper persistence handling with:
- A loading state to wait for data to be restored from storage
- Ensure the dashboard only renders statistics after data is fully loaded
- Add a "hydration" check to prevent showing stale/default data

---

## Technical Implementation

### 1. Add Hydration State to Admin Store

**File:** `src/stores/adminStore.ts`

Add a `_hasHydrated` flag that tracks when the persisted data has been loaded:

```typescript
interface AdminStore {
  // ... existing fields
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useAdminStore = create<AdminStore>()(
  persist(
    (set) => ({
      // ... existing state
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'nina-armend-admin-v2',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
```

### 2. Add Loading State to Dashboard

**File:** `src/pages/admin/Dashboard.tsx`

Wait for the store to hydrate before rendering statistics:

```typescript
const { orders, customers, _hasHydrated } = useAdminStore();

// Show loading skeleton while data is being restored
if (!_hasHydrated) {
  return (
    <div className="min-h-screen bg-secondary/20">
      <Header />
      <div className="pt-40 md:pt-48 pb-12 max-w-[1600px] mx-auto px-4 md:px-8">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-6 w-64" />
          <div className="grid grid-cols-5 gap-4 w-full mt-8">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
```

### 3. Apply Same Pattern to Other Admin Pages

Apply the hydration check to:
- `src/pages/admin/Orders.tsx`
- `src/pages/admin/Customers.tsx`
- `src/pages/admin/Products.tsx`

This ensures all admin pages wait for data before rendering.

---

## What This Fixes

| Before | After |
|--------|-------|
| Statistics flash different values on each login | Statistics are consistent every time |
| Data appears before storage loads | Shows loading skeleton until data is ready |
| Possible data loss on refresh | Data reliably persists across sessions |

---

## Files to Modify

1. `src/stores/adminStore.ts` - Add hydration tracking
2. `src/pages/admin/Dashboard.tsx` - Add loading state
3. `src/pages/admin/Orders.tsx` - Add loading state
4. `src/pages/admin/Customers.tsx` - Add loading state
5. `src/pages/admin/Products.tsx` - Add loading state

This will ensure your statistics are always consistent and ready for launch.
