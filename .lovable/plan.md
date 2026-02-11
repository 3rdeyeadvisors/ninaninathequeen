

# Full Platform Audit: Fix ALL Hanging Database Writes

## The Root Cause (applies everywhere, not just settings)

Every write operation (`.update()`, `.upsert()`, `.delete()`) that does NOT chain `.select()` returns a `204 No Content` empty-body response. The Lovable preview environment hangs on empty-body responses. This is why "some things save and some don't."

## All Affected Operations (4 remaining)

Here is every client-side database write in the app and its current status:

| File | Operation | Has `.select()`? | Status |
|---|---|---|---|
| `useSettingsDb.ts` line 104 | `.update()` | Yes (already fixed) | OK |
| `useSettingsDb.ts` line 124 | `.insert()` | Yes | OK |
| `useOrdersDb.ts` line 51 | `.upsert()` | **NO** | WILL HANG |
| `useOrdersDb.ts` line 88 | `.update()` | **NO** | WILL HANG |
| `useCustomersDb.ts` line 47 | `.upsert()` | **NO** | WILL HANG |
| `useCustomersDb.ts` line 73 | `.delete()` | **NO** | WILL HANG |

Edge functions (`sync-products`, `process-payment`, etc.) run server-side and are NOT affected by this issue.

## The Fix (3 files, same pattern applied to each)

### File 1: `src/hooks/useOrdersDb.ts`

**upsertOrder (line 51-64)** -- add `.select()`:
```
// Before:
const { error } = await supabase
  .from('orders')
  .upsert({...}, { onConflict: 'id' });

// After:
const { error } = await supabase
  .from('orders')
  .upsert({...}, { onConflict: 'id' })
  .select('id')
  .maybeSingle();
```

**updateOrderDb (line 88-91)** -- add `.select()`:
```
// Before:
const { error } = await supabase
  .from('orders')
  .update(dbUpdates)
  .eq('id', orderId);

// After:
const { error } = await supabase
  .from('orders')
  .update(dbUpdates)
  .eq('id', orderId)
  .select('id')
  .maybeSingle();
```

### File 2: `src/hooks/useCustomersDb.ts`

**upsertCustomer (line 47-56)** -- add `.select()`:
```
// Before:
const { error } = await supabase
  .from('customers')
  .upsert({...}, { onConflict: 'id' });

// After:
const { error } = await supabase
  .from('customers')
  .upsert({...}, { onConflict: 'id' })
  .select('id')
  .maybeSingle();
```

**deleteCustomerDb (line 73-76)** -- add `.select()`:
```
// Before:
const { error } = await supabase
  .from('customers')
  .delete()
  .eq('id', customerId);

// After:
const { error } = await supabase
  .from('customers')
  .delete()
  .eq('id', customerId)
  .select('id')
  .maybeSingle();
```

### File 3: `src/hooks/useSettingsDb.ts`

Already fixed -- no changes needed.

## What This Does NOT Touch
- All read operations (`.select()`) -- already work fine
- Edge functions -- run server-side, not affected
- RLS policies -- no changes
- Database schema -- no changes
- Settings.tsx, Products page, or any UI components -- no changes

## Risk Assessment
- `.select('id').maybeSingle()` after writes is the standard recommended Supabase pattern
- It does not change what data is written, only ensures the response has a body
- Every read in the app already uses this pattern successfully
- The settings fix already applied this same pattern -- this just extends it everywhere

## If something STILL hangs after this
The settings hook already has a `Promise.race` timeout as a safety net. If any of these 4 operations somehow still hang despite `.select()`, we add the same `Promise.race` wrapper. But based on the settings fix behavior (the `.select()` is the core fix, the race is just a safety net), this should resolve all remaining save issues.

