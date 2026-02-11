

# Fix Build Errors and Store Square Credentials

## Overview
Fix the TypeScript build errors in POS.tsx caused by `window.Square` not being typed, and the unsafe `Record<string, unknown>` cast. Then securely store your three Square credentials (Access Token, Application ID, and Location ID) so the POS payment flow works.

## Step 1: Fix TypeScript build errors in POS.tsx

**Problem**: `window.Square` is not recognized by TypeScript.

**Solution**: Add a type declaration at the top of `POS.tsx`:
```typescript
declare global {
  interface Window {
    Square?: {
      payments: (appId: string, locationId: string) => {
        card: () => Promise<{
          attach: (selector: string) => Promise<void>;
          tokenize: () => Promise<{ status: string; token: string; errors?: Array<{ message: string }> }>;
          destroy: () => Promise<void>;
        }>;
      };
    };
  }
}
```

**Problem**: Casting `Product` to `Record<string, unknown>` fails.

**Solution**: Cast through `unknown` first: `(p as unknown as Record<string, unknown>).sku`

## Step 2: Store Square credentials as secrets

Three secrets will be securely stored:
1. **SQUARE_ACCESS_TOKEN** -- already exists, will be updated with your production token
2. **SQUARE_APPLICATION_ID** -- new secret for the Web Payments SDK app ID
3. **SQUARE_LOCATION_ID** -- new secret for your Square location

## Step 3: Update edge functions to use the new secrets

Update `process-payment/index.ts` and `create-square-checkout/index.ts` to read `SQUARE_APPLICATION_ID` and `SQUARE_LOCATION_ID` from environment secrets instead of relying on client-provided values.

## Step 4: Load Square Web Payments SDK

Ensure the Square Web Payments SDK script tag is loaded in `index.html` so the POS card form can initialize.

## Technical Details

- The `window.Square` type declaration ensures TypeScript knows about the Square SDK global
- Secrets are stored server-side and accessed via `Deno.env.get()` in edge functions
- The `squareApplicationId` and `squareLocationId` in the admin settings store will be populated from the secrets (or kept as client-side config since they are public IDs used by the SDK)
- The Application ID and Location ID are public-safe values (used in browser SDK), so they can also be stored as `VITE_` env vars or in the settings store

