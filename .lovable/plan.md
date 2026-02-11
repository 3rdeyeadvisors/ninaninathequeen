

# Fix Product Sync and Client Requested Edits

## Overview

Three things to address: (1) fix the sync so nothing gets dropped and everything uploads exactly as-is, (2) fix the "Trianhlw" misspelling in existing database data per the client's request, and (3) update the About page vision statement.

---

## 1. Fix Sync Logic — Nothing Gets Dropped

**The Problem**: The sync uses the spreadsheet's `Item ID` as the database primary key. When two different products (e.g., "Bela Black Top" and "Bela Black Bottom") share the same Item ID (`BI 205-2`), the dedup step on line 242 sees duplicate IDs and drops one.

**The Fix** (in `src/hooks/useSpreadsheetSync.ts`):
- Use a **slug generated from the product name** as the database primary key (e.g., `bela-black-top`, `bela-black-bottom`) — this guarantees uniqueness since different products have different names
- Store the spreadsheet's original Item ID exactly as-is in the `item_number` field
- The product **title stays exactly as it appears** in the spreadsheet — no renaming, no normalization beyond basic whitespace cleanup
- Size merging continues to work as it already does: rows with the same base title (e.g., "Bela Black Top (XS)" and "Bela Black Top (S)") group together and their sizes/inventory merge into one product

**What changes in the code**:
- Line 139: Always generate the database ID from the slug, never from the spreadsheet Item ID
- Remove lines 141-144 (the `sync-` prefix logic — not needed anymore)
- Line 183: Keep matching existing products by ID or title so re-uploads update rather than duplicate

---

## 2. Fix "Trianhlw" Typo in Database

The client flagged a misspelling of "Triangle." A SQL data update will rename any product currently in the database that contains "Trianhlw" to "Triangle." This is a one-time data fix — going forward, the spreadsheet should have the correct spelling and the sync will upload it as-is.

---

## 3. Update About Page Vision

Replace the vision paragraph in `src/pages/About.tsx` (lines 32-40) with the client's exact copy:

> Nina Armend's vision is to explore the display of the body's beauty with pride and shamelessness. Nina Armend believes the human body is not meant to be hidden, but to be shown with grace. We represent strength that is earned through individuality.

---

## Files Changed

| File | Change |
|------|--------|
| `src/hooks/useSpreadsheetSync.ts` | Use slug-based DB ID, store original Item ID in item_number, keep names exactly as-is |
| `src/pages/About.tsx` | Update vision statement |
| Database (data update) | Fix "Trianhlw" typo in existing products |

