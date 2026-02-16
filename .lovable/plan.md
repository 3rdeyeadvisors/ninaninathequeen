

# Update Square API Version in process-payment

## What Changes

Update the `Square-Version` header in `supabase/functions/process-payment/index.ts` from `'2024-01-18'` to `'2025-01-23'` to match the other two Square edge functions.

## Why This Is Safe

- The function uses only the basic `/v2/payments` endpoint with standard fields (`source_id`, `amount_money`, `location_id`)
- Square maintains backward compatibility on core payment endpoints -- the request and response shapes have not changed
- The other two Square functions (`create-square-checkout` and `finalize-square-order`) were already updated to this version and are working correctly

## Technical Details

| File | Change |
|------|--------|
| `supabase/functions/process-payment/index.ts` | Line 50: `'Square-Version': '2024-01-18'` to `'Square-Version': '2025-01-23'` |

One line change, then redeploy the function.

