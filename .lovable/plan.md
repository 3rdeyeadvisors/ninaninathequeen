

## Spreadsheet Sync Fixes

### Summary
Fix the spreadsheet parser to correctly import your inventory using the Price column as selling price, properly map "Ordered" status, and ensure products persist in the database.

---

### Changes to Make

**1. Update Spreadsheet Parser (`src/lib/spreadsheet.ts`)**

Remove "price per unit" from price mapping - only use "Price" column as selling price:

| Column | Action |
|--------|--------|
| Price | Map to `price` (selling price) |
| Price Per Unit | Ignore (this is cost) |

---

**2. Update Sync Logic (`src/hooks/useSpreadsheetSync.ts`)**

| Fix | Current | Updated |
|-----|---------|---------|
| Status mapping | Only "active" and "stock" recognized | Add "order" so "Ordered" becomes Active |
| Default productType | "Bikini" | Empty string (leave blank if not specified) |

---

### Files to Modify

| File | Change |
|------|--------|
| `src/lib/spreadsheet.ts` | Only map "Price" column, ignore "Price Per Unit" |
| `src/hooks/useSpreadsheetSync.ts` | Map "Ordered" to Active, allow blank productType |

---

### Expected Result

After these fixes and re-uploading your spreadsheet:
- **Price** column (150.00) used as selling price
- **Price Per Unit** ignored (it's your cost)
- **"Ordered"** status maps to Active
- **Blank fields** stay blank
- **Products persist** in database between sessions

