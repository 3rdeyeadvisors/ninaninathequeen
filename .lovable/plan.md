
# Critical Fix: Database Persistence for All Business Data

## The Problem

**Current State**: ALL business-critical data is stored ONLY in browser localStorage:
- Product overrides (from spreadsheet uploads)
- Orders
- Customers
- User accounts
- Settings

**This means:**
- Data is tied to ONE browser on ONE device
- Different browsers or devices see completely different data
- Clearing browser cache = losing ALL data
- This is a critical liability for a production business

---

## The Solution: Supabase Database Persistence

I will set up Supabase (Lovable Cloud) to store all business data in a proper cloud database. This ensures data is:
- Accessible from any browser/device
- Never lost when browser cache is cleared
- Secure and backed up
- Consistent across all users and sessions

---

## Implementation Plan

### Phase 1: Set Up Supabase Backend

**Create Database Tables:**

```text
┌─────────────────────────────────────────────────────────────────┐
│                        PRODUCTS                                  │
├─────────────────────────────────────────────────────────────────┤
│ id (PK)      │ title        │ price      │ inventory            │
│ size_inventory (jsonb)      │ image      │ description          │
│ product_type │ collection   │ category   │ status               │
│ item_number  │ color_codes  │ is_deleted │ created_at           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        ORDERS                                    │
├─────────────────────────────────────────────────────────────────┤
│ id (PK)       │ customer_name │ customer_email │ date           │
│ total         │ shipping_cost │ item_cost      │ status         │
│ tracking_number │ items (jsonb) │ created_at                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       CUSTOMERS                                  │
├─────────────────────────────────────────────────────────────────┤
│ id (PK)     │ name        │ email       │ total_spent          │
│ order_count │ join_date   │ created_at                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       SETTINGS                                   │
├─────────────────────────────────────────────────────────────────┤
│ id (PK)     │ store_name    │ currency    │ tax_rate           │
│ low_stock_threshold │ pos_provider │ square_api_key (encrypted)│
└─────────────────────────────────────────────────────────────────┘
```

**Row Level Security (RLS):**
- Only authenticated admin users can read/write to these tables
- Proper role-based access control

---

### Phase 2: Create Database Sync Hooks

**New files to create:**

1. `src/hooks/useProductsDb.ts` - Sync products to/from Supabase
2. `src/hooks/useOrdersDb.ts` - Sync orders to/from Supabase
3. `src/hooks/useCustomersDb.ts` - Sync customers to/from Supabase
4. `src/hooks/useSettingsDb.ts` - Sync settings to/from Supabase

**Behavior:**
- On app load: Fetch data from Supabase
- On data change: Write to Supabase immediately
- Fallback: Keep localStorage as a cache for offline resilience

---

### Phase 3: Update Spreadsheet Sync

**Modify `useSpreadsheetSync.ts`:**
- After parsing spreadsheet, save products directly to Supabase
- Use upsert (insert or update) to handle duplicates
- Show progress toast during upload

---

### Phase 4: Update Stores

**Modify `adminStore.ts`:**
- Keep Zustand for local state management
- Add database sync on every mutation
- Load initial data from database on hydration

---

### Phase 5: Fix Category Filter Counts (Immediate Fix)

While setting up database persistence, I'll also fix the category filter counting issue:

**Current bug in `Products.tsx`:**
```typescript
// Only initializes some categories
const counts = { All: 0, 'Top & Bottom': 0, 'One-Piece': 0, Other: 0 };
```

**Fix:**
```typescript
// Initialize ALL categories
const counts = { 
  All: 0, 
  Top: 0, 
  Bottom: 0, 
  'Top & Bottom': 0, 
  'One-Piece': 0, 
  Other: 0 
};
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/001_create_tables.sql` | Create | Database schema |
| `src/integrations/supabase/client.ts` | Create | Supabase client |
| `src/integrations/supabase/types.ts` | Create | Type definitions |
| `src/hooks/useProductsDb.ts` | Create | Product database sync |
| `src/hooks/useOrdersDb.ts` | Create | Order database sync |
| `src/hooks/useCustomersDb.ts` | Create | Customer database sync |
| `src/stores/adminStore.ts` | Modify | Add database sync |
| `src/hooks/useSpreadsheetSync.ts` | Modify | Save to database |
| `src/pages/admin/Products.tsx` | Modify | Fix category counts |

---

## Expected Behavior After Implementation

1. **Upload spreadsheet on Chrome** → Data appears in Firefox, Safari, any device
2. **Clear browser cache** → Data is still there (loaded from database)
3. **Multiple admins** → Everyone sees the same data in real-time
4. **Category filters** → Accurate counts for Top, Bottom, Top & Bottom, One-Piece, Other

---

## Security Considerations

- Supabase API keys stored securely (not in client code)
- Row Level Security enforced on all tables
- Admin role verification before allowing writes
- Square API key stored encrypted in database (not in localStorage)
