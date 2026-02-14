

## Clean Up Stale Square Reference in Checkout

### What's Changing
One leftover reference to `settings.squareLocationId` in the Checkout page needs to be removed. This field no longer exists in the admin store after the previous cleanup, so it's always `undefined`. The edge function already reads the location ID from the backend secret, so this parameter is unnecessary.

### Steps

1. **Update `src/pages/Checkout.tsx`** -- Remove `locationId: settings.squareLocationId` from the edge function call body (line 80). The `create-square-checkout` function already uses `SQUARE_LOCATION_ID` from backend secrets as its primary source.

### Technical Detail
The edge function has this fallback chain for location ID: environment secret > request parameter > hardcoded sandbox default. Since the secret is configured, removing the request parameter changes nothing functionally. This is purely a cleanup to avoid referencing a deleted store field.

