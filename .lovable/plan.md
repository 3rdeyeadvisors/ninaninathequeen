
# Fix Build Error & Improve Header Spacing

## Issues to Address

### 1. Build Error (Critical)
**File:** `src/pages/FittingRoom.tsx`, line 40

The code calls `playSound('camera')` but the valid sound types are only `'click' | 'error' | 'remove' | 'success'`. This causes the TypeScript error.

**Fix:** Change `playSound('camera')` to `playSound('click')` or `playSound('success')` on line 40.

---

### 2. Header Spacing Inconsistency
**Problem:** When logged in as admin, an "Admin Dashboard" button appears on the right side of the header, making the layout asymmetrical. The logo is absolutely positioned in the center, but the visual weight of the left vs right sides becomes unbalanced.

**Current Layout:**
- Left side: 3 nav links (`Shop All`, `Mix & Match`, `Fitting Room`)
- Center: Logo (absolutely positioned, always centered)
- Right side: 3 nav links + icons + **Admin Dashboard button** (when logged in)

**Solution:** Make the left and right flex containers equal width regardless of their content, ensuring the logo placeholder stays consistent.

**Changes to `src/components/Header.tsx`:**

1. **Left navigation group (line 85):** Remove `flex-1` and use a fixed minimum width that matches the right side structure
   
2. **Right navigation group (line 101):** Match the same fixed minimum width approach

3. **Update both sides to use `basis-0 grow` pattern** - This ensures both sides take equal space regardless of content, keeping the center logo placeholder stable.

**Updated structure:**
```
|-- Left (basis-0 grow) --|-- Logo Placeholder (fixed width) --|-- Right (basis-0 grow) --|
```

With `basis-0 grow` on both sides, they will always be equal width, and the Admin Dashboard button won't shift the visual balance.

---

## Technical Implementation

### File: `src/pages/FittingRoom.tsx`
**Line 40:** Change `playSound('camera')` → `playSound('click')`

### File: `src/components/Header.tsx`

**Line 85:** Update left navigation container
```typescript
// Before:
<div className="flex items-center gap-3 xl:gap-6 2xl:gap-10 flex-1 justify-start overflow-hidden">

// After:
<div className="flex items-center gap-3 xl:gap-6 2xl:gap-10 basis-0 grow justify-start overflow-hidden">
```

**Line 101:** Update right navigation container
```typescript
// Before:
<div className="flex items-center justify-end gap-2 xl:gap-4 2xl:gap-8 flex-1 overflow-hidden">

// After:
<div className="flex items-center justify-end gap-2 xl:gap-4 2xl:gap-8 basis-0 grow overflow-hidden">
```

This `basis-0 grow` pattern is a standard CSS Flexbox technique that forces both sides to take equal remaining space, regardless of how much content is inside each. The Admin Dashboard button will be accommodated within the right side without pushing the center logo placeholder.
