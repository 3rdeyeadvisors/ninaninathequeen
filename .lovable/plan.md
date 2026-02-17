

# Fix Admin Image Save - Better Error Feedback and Robustness

## Root Cause Analysis

After investigating the database, edge function logs, and code:
- The product saves ARE succeeding on the backend (confirmed via logs and database)
- The likely issue is confusing success/error messaging that makes successful saves appear broken, or intermittent storage upload failures that silently lose images before Save is pressed

## Changes

### 1. Fix misleading toast messages in handleSave (Products.tsx)

The current `toast.promise` success callback shows "Database sync failed. Changes saved locally." as a SUCCESS toast (green checkmark) when `upsertProduct` returns `false`. This is confusing -- it should be an error toast instead.

**Change**: Replace `toast.promise` pattern with explicit success/error toasts after awaiting the result.

### 2. Add retry logic for storage upload failures (Products.tsx)

If a storage upload fails silently, the image URL never gets added to the product state, so clicking Save "loses" images. Add a single retry on failed uploads and clearer failure messaging.

### 3. Prevent Save from firing while images are still uploading (Products.tsx)

If the admin clicks Save while images are mid-upload, the current images array won't include the uploading images. Disable the Save button while `isImageUploading` is true.

### 4. Add confirmation feedback after Save completes

Show a clear, distinct success toast with the product name so the admin knows exactly what was saved.

## Technical Details

| File | Change |
|---|---|
| `src/pages/admin/Products.tsx` | Fix toast messaging in `handleSave`; add upload retry in `handleImageUpload`; disable Save during upload; add product name to success feedback |

All changes are in a single file. No database or edge function changes needed -- the backend is working correctly.

