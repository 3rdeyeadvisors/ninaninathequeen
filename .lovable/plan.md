

# Fix Image Uploads -- Why They're Hanging

## Root Cause

Two problems are causing uploads to hang or fail:

### 1. No Image Compression Before Upload
The upload sends the raw file directly to storage. Phone photos are typically 5-15MB each. On a normal connection, uploading even one uncompressed photo can take 30-60 seconds. Multiple photos could take minutes. There is zero compression, resizing, or optimization happening before upload.

### 2. Sequential Uploads (Not Parallel)
The current code uploads files one at a time in a `for` loop. If you select 3 photos at 8MB each, that is 24MB uploaded sequentially -- each one waits for the previous to finish.

### 3. No Progress Feedback
The only feedback is a spinning icon. No progress bar, no "uploading 1 of 3", nothing. So it looks completely frozen.

---

## Fix

### Step 1: Add Client-Side Image Compression
Before uploading, resize images to a max of 1200px wide and compress to JPEG at 80% quality. This typically reduces a 10MB phone photo down to 100-300KB -- a 30-50x reduction. No new dependencies needed; the browser Canvas API handles this natively.

### Step 2: Upload in Parallel
Use `Promise.all` instead of a sequential `for` loop so all images upload simultaneously.

### Step 3: Add Upload Progress
Show "Uploading 1 of 3..." text and a progress counter so the user knows it is working.

### Step 4: Add File Size Validation
Reject files over 20MB before even attempting the upload, with a clear error message.

---

## Technical Details

**File changed**: `src/pages/admin/Products.tsx`

**New helper function** (added in the same file):
```
compressImage(file, maxWidth=1200, quality=0.8) -> Promise<Blob>
```
Uses an off-screen canvas to resize and compress to JPEG before upload.

**Updated `handleImageUpload`**:
- Validates file sizes (reject > 20MB)
- Compresses each image via canvas
- Uploads all compressed images in parallel with `Promise.allSettled`
- Shows progress text: "Uploading 2 of 4..."

**Updated UI**:
- Replace spinner with progress text during upload
- Show count of successful/failed uploads in the toast

