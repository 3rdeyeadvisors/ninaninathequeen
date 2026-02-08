
# Comprehensive Update: Favicons, Categories, Product Data, and Square Integration

## Summary of Changes

1. **Install uploaded favicon files** to the project
2. **Add "Top & Bottom" as a standalone category** (admin manually assigns) with $10 off promotion
3. **Add color codes and item number fields** - auto-import from spreadsheet + manual entry in edit dialog
4. **Remove Stripe & Clover**, keep only Square integration
5. **Mask the Square access token** after entry for security
6. **Fix the spreadsheet product upload limit** (currently capped at ~20-something)

---

## 1. Favicon Installation

**Copy uploaded files to `public/` folder:**
- `favicon.ico`
- `favicon-16x16.png`
- `favicon-32x32.png`
- `apple-touch-icon.png`
- `android-chrome-192x192.png`
- `android-chrome-512x512.png`

**Update `index.html`:**
```html
<link rel="icon" type="image/x-icon" href="/favicon.ico" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.json">
```

**Update `public/manifest.json`:**
```json
{
  "icons": [
    { "src": "/android-chrome-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/android-chrome-512x512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## 2. Product Categories: Add "Top & Bottom" (Standalone)

"Top & Bottom" is a **manually assigned category** - admins choose it when editing a product. Products in this category get a $10 discount displayed.

**Current categories:** `['All', 'Top', 'Bottom', 'One-Piece', 'Other']`

**New categories:** `['All', 'Top & Bottom', 'One-Piece', 'Other']`

### Changes:

**`src/pages/admin/Products.tsx`:**
- Update `CATEGORIES` constant (line 50)
- Update category counting logic to count "Top & Bottom" as its own category
- Update the dropdown in bulk move and edit dialog to include "Top & Bottom"

**`src/components/ProductCard.tsx`:**
- Check if `product.productType === 'Top & Bottom'` or `product.category === 'Top & Bottom'`
- If yes, show original price crossed out + $10 off discounted price
- Display "SAVE $10" promotional badge

```typescript
const isTopAndBottom = product.productType === 'Top & Bottom' || 
                       product.category === 'Top & Bottom';

const originalPrice = parseFloat(price.amount);
const displayPrice = isTopAndBottom ? originalPrice - 10 : originalPrice;
```

---

## 3. Add Color Codes and Item Number to Products

### Update `src/stores/adminStore.ts` - ProductOverride interface:

```typescript
export interface ProductOverride {
  // ... existing fields
  itemNumber?: string;     // SKU/Item number (e.g., "LB-001")
  colorCodes?: string[];   // Array of hex colors (e.g., ["#FFD700", "#1A1A1A"])
}
```

### Update `src/lib/spreadsheet.ts`:

Map spreadsheet columns to automatically pick up colors and item numbers:
```typescript
if (['item number', 'item#', 'sku', 'item id', 'itemid'].includes(normalizedKey)) {
  normalizedKey = 'itemnumber';
}
if (['color', 'colors', 'color code', 'colorcodes', 'hex', 'color hex'].includes(normalizedKey)) {
  normalizedKey = 'colors';
}
```

### Update `src/hooks/useSpreadsheetSync.ts`:

Pass the parsed `itemnumber` and `colors` to the product override:
```typescript
updateProductOverride(id, {
  // ... existing fields
  itemNumber: product.itemnumber || product.id,
  colorCodes: product.colors ? parseColors(product.colors) : undefined,
});
```

### Update `src/pages/admin/Products.tsx`:

**Add "Item #" column to product table:**
```typescript
<TableHead className="w-20">Item #</TableHead>
// In table body:
<TableCell className="font-mono text-xs">
  {override?.itemNumber || '-'}
</TableCell>
```

**Add Item # input in edit dialog:**
```typescript
<div className="grid grid-cols-4 items-center gap-4">
  <Label htmlFor="itemNumber" className="text-right font-sans text-[10px] uppercase tracking-widest">Item #</Label>
  <Input
    id="itemNumber"
    placeholder="e.g., LB-001"
    value={editingProduct?.itemNumber || ''}
    onChange={(e) => setEditingProduct({...editingProduct, itemNumber: e.target.value})}
    className="col-span-3 font-sans text-sm font-mono"
  />
</div>
```

**Add color picker + text input in edit dialog:**
```typescript
<div className="grid grid-cols-4 items-start gap-4">
  <Label className="text-right font-sans text-[10px] uppercase tracking-widest pt-2">Colors</Label>
  <div className="col-span-3 space-y-2">
    {/* Color swatches with color pickers */}
    <div className="flex gap-2 flex-wrap">
      {editingProduct?.colorCodes?.map((color, i) => (
        <div key={i} className="flex items-center gap-1">
          <input 
            type="color" 
            value={color}
            onChange={(e) => updateColor(i, e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border"
          />
          <button onClick={() => removeColor(i)} className="text-xs text-muted-foreground hover:text-destructive">×</button>
        </div>
      ))}
    </div>
    {/* Text input to type hex or color name */}
    <div className="flex gap-2">
      <Input
        placeholder="Add color (e.g., #FFD700 or Gold)"
        value={newColorInput}
        onChange={(e) => setNewColorInput(e.target.value)}
        className="text-sm font-mono"
      />
      <Button size="sm" variant="outline" onClick={addColorFromInput}>Add</Button>
    </div>
  </div>
</div>
```

---

## 4. Remove Stripe & Clover, Keep Only Square

### Update `src/stores/adminStore.ts`:

```typescript
// Before:
posProvider: 'none' | 'stripe' | 'square' | 'clover';
stripeApiKey: string;

// After:
posProvider: 'none' | 'square';
// Remove stripeApiKey entirely
```

### Update `src/pages/admin/Settings.tsx`:

Remove Stripe and Clover buttons, keep only Square and None options.

---

## 5. Mask Square Access Token After Entry

### Update `src/pages/admin/Settings.tsx`:

When a Square token is saved, display it masked:
- Show: `EAAA...xxxx` (first 4 + last 4 characters)
- Add "Connected" badge
- Add "Edit" button to change the token

```typescript
const [isEditingToken, setIsEditingToken] = useState(false);

const maskedToken = localSettings.squareApiKey 
  ? `${localSettings.squareApiKey.slice(0, 4)}...${localSettings.squareApiKey.slice(-4)}` 
  : '';

// Display connected state with masked token
{localSettings.squareApiKey && !isEditingToken ? (
  <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
    <Badge className="bg-green-500/10 text-green-600">Connected</Badge>
    <span className="font-mono text-xs">{maskedToken}</span>
    <Button size="sm" variant="ghost" onClick={() => setIsEditingToken(true)}>Edit</Button>
  </div>
) : (
  <Input type="password" ... />
)}
```

---

## 6. Fix Spreadsheet Upload Limit

**Root Cause:** Multiple places limit products to low numbers.

### Fixes:

**`src/hooks/useSpreadsheetSync.ts`:**
- Change `MAX_ROWS` from 500 to 1000
- Change `useProducts(200)` to `useProducts(1000)`

**`src/pages/admin/Products.tsx`:**
- Change `useProducts(100)` to `useProducts(1000)`

---

## Technical Summary

| File | Changes |
|------|---------|
| `public/` folder | Add 6 favicon files |
| `index.html` | Update favicon links |
| `public/manifest.json` | Update icon paths |
| `src/stores/adminStore.ts` | Add `itemNumber`, `colorCodes`; remove `stripeApiKey`, update `posProvider` type |
| `src/lib/spreadsheet.ts` | Map `itemnumber` and `colors` columns |
| `src/hooks/useSpreadsheetSync.ts` | Pass `itemNumber` and `colorCodes` to override; increase limits to 1000 |
| `src/pages/admin/Products.tsx` | Update categories to `['All', 'Top & Bottom', 'One-Piece', 'Other']`, add Item # column, add color picker + text input, increase limit to 1000 |
| `src/pages/admin/Settings.tsx` | Remove Stripe/Clover options, add token masking |
| `src/components/ProductCard.tsx` | Add $10 off badge for "Top & Bottom" category |

---

## Expected Behavior After Implementation

1. **Favicons appear** in browser tabs and bookmarks
2. **"Top & Bottom"** is a standalone category that admins manually assign
3. **$10 off badge** shows only on products with category "Top & Bottom"
4. **Item # column** visible in admin products table
5. **Colors auto-imported** from spreadsheet "Color" column
6. **Color picker + text input** in edit dialog for manual color entry
7. **Only Square option** in POS settings (Stripe/Clover removed)
8. **Token is masked** after saving (shows `EAAA...xxxx`)
9. **All spreadsheet products load** (up to 1000 rows supported)
