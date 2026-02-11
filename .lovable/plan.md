

# Fix: Force Response Body on Settings Update (with Fallback Chain)

## The Problem (Line 104-107 of useSettingsDb.ts)
The `.update()` call returns a `204 No Content` (empty response body). The preview environment hangs on empty-body responses. Every working database call in the app returns a `200` with a body.

## Primary Fix: Add `.select('id').maybeSingle()` to the update call

Change lines 104-108 from:
```text
const { error: updateError } = await supabase
  .from('store_settings')
  .update(updateData)
  .eq('id', targetId);
error = updateError;
```

To:
```text
const { error: updateError } = await supabase
  .from('store_settings')
  .update(updateData)
  .eq('id', targetId)
  .select('id')
  .maybeSingle();
error = updateError;
```

This forces a `200 OK` response with a body, matching the pattern of every other working call.

## Safety Net: 10-second Promise.race timeout around the database call

Wrap the update in `Promise.race` so even if the fix above somehow doesn't resolve the promise, the code will catch it and show an error instead of hanging for 15 seconds:

```text
const updatePromise = supabase
  .from('store_settings')
  .update(updateData)
  .eq('id', targetId)
  .select('id')
  .maybeSingle();

const result = await Promise.race([
  updatePromise,
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('DB update timed out after 10s')), 10000)
  )
]);
error = result.error;
```

## Built-in Fallback Chain (if primary fix fails)

If the update with `.select()` still times out, the 10-second race catches it, and we have a pre-planned escalation path -- no new credits needed for planning:

- **Fallback A**: Replace `.update()` with an RPC database function (`.rpc('update_settings', ...)`) since RPC calls already work in this environment (proven by `has_role`)
- **Fallback B**: Replace `.update()` with delete-then-insert, since `.insert().select()` already works (line 111-115 of the current code)

These fallbacks are already designed. If the primary fix fails, implementing either one is a single-file, surgical change.

## Files Changed
- `src/hooks/useSettingsDb.ts` -- modify lines 104-108 (update call + race timeout). No other files touched.

## What Will NOT Break
- The insert path (line 111-115) is untouched and already uses `.select()`
- The fetch path (line 17-21) is untouched
- Settings.tsx is untouched -- the timeout safety net and form sync remain
- RLS policies are unchanged
- No new dependencies or files added

