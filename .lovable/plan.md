

# Fix Store Intelligence: Make Insights Data-Rich Instead of Generic

## Problem
The Store Intelligence cards currently show generic fallback messages that look like placeholders:
- "Add products and start promoting your store to drive your first sales."
- "Build your customer base by sharing your store on social media."

These ignore the store's actual data: 2,207 inventory items across 31 products, 3 waitlist signups, and pre-launch status.

## Solution
Update the `insights` memo in `src/pages/admin/Dashboard.tsx` to produce specific, data-aware messages even when there are no orders or behavioral data.

### Updated Insight Logic

**Top Opportunity** (priority order):
1. If behavioral insights exist: Show browse-but-don't-buy pattern (current logic, keep as-is)
2. If low stock: Show low stock warning (current logic, keep as-is)
3. If confirmed orders exist: Show momentum message (current logic, keep as-is)
4. **NEW pre-launch fallback**: "You have 2,207 items across 31 products ready to sell. With 3 people on your waitlist, consider launching with an exclusive early-access offer to convert them into first customers."

**Growth Signal** (priority order):
1. If behavioral insights > 1: Show high-intent leads message (current, keep)
2. If pending orders: Show pending info (current, keep)
3. If customers exist: Show audience engagement (current, keep)
4. **NEW pre-launch fallback**: "Your waitlist has 3 signups. Share your Instagram (@nina_armend) and waitlist link to grow your audience before launch."

### Technical Details

**File**: `src/pages/admin/Dashboard.tsx` (lines 216-246)

The `insights` useMemo will be updated to:
- Reference `productOverrides` to count active products
- Reference `totalInventory` for total units
- Reference `waitlistCount` for waitlist size
- Reference `settings.instagramUrl` for social links
- Generate specific, actionable messages that reflect the actual store state

Dependencies added to the memo: `productOverrides`, `totalInventory`, `waitlistCount`, `settings`

No database changes, no new files -- just smarter fallback copy in one memo.

