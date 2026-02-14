

## Remove Square API Credentials from Admin Settings

### What's Changing
The Square API key, Application ID, and Location ID fields will be removed from the admin settings page and database. These credentials are already securely stored as backend secrets and used by backend functions, so storing them in the database is redundant and a security risk.

Going forward, if you need to update Square credentials, you can do so through this chat.

### Steps

1. **Database migration** -- Drop the three columns (`square_api_key`, `square_application_id`, `square_location_id`) from the `store_settings` table. Also update the `public_store_settings` view to remove references to these columns (though they were already excluded).

2. **Remove the "Payment Gateway (Square)" card** from the admin Settings page (`src/pages/admin/Settings.tsx`), including the masked token display logic and the `isEditingToken` state.

3. **Clean up the admin store** (`src/stores/adminStore.ts`) -- Remove `squareApiKey`, `squareApplicationId`, and `squareLocationId` from the `AdminSettings` type and default values.

4. **Clean up data sync code** -- Remove Square credential mapping in `src/hooks/useSettingsDb.ts` and `src/providers/DbSyncProvider.tsx`.

5. **Update edge functions** (`create-square-checkout`, `process-payment`, `finalize-square-order`) -- Remove the database fallback logic that reads `square_api_key` from the `store_settings` table. These functions will rely solely on the backend secrets (`SQUARE_ACCESS_TOKEN`, `SQUARE_APPLICATION_ID`, `SQUARE_LOCATION_ID`), which are already configured.

6. **Update POS page** (`src/pages/admin/POS.tsx`) -- Use backend secrets via an edge function call instead of reading `squareApplicationId`/`squareLocationId` from the store. Alternatively, hardcode the sandbox values since POS initialization requires client-side SDK access.

7. **Update the test** (`src/test/adminStore.test.ts`) -- Remove the `squareLocationId` assertion.

8. **Delete the security finding** (`square_api_plaintext`) since it will be fully resolved.

### Technical Detail: POS Client-Side SDK
The Square Web Payments SDK requires an Application ID and Location ID on the client side to initialize card payments. Since these are not sensitive (they're public-facing IDs), they can either be passed from an edge function endpoint or kept as environment variables (`VITE_SQUARE_APPLICATION_ID`, `VITE_SQUARE_LOCATION_ID`). The access token (the sensitive credential) is already backend-only.

