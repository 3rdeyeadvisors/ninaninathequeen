

# Update Admin Email from lydia@ninaarmend.co.site to lydia@ninaarmend.co

## What Changes

This updates the admin email everywhere -- in the database (so she can log in with the new email using her same password) and in the code (so the system recognizes the new email as admin).

### Database Changes (3 steps)

1. **Update the existing user's email in auth.users** -- This changes her login email. Her password stays the same, no reset needed.
2. **Update her email in the profiles table** -- Keeps profile data in sync.
3. **Update the admin role trigger** -- So any future sign-ups with the new email still get auto-granted admin.

### Code Changes (3 files)

| File | What Changes |
|------|-------------|
| `src/stores/authStore.ts` | `ADMIN_EMAIL` constant: `.co.site` to `.co` |
| `src/pages/admin/Customers.tsx` | Placeholder email in invite input: `.co.site` to `.co` |
| `src/pages/admin/POS.tsx` | Default POS customer email: `pos@ninaarmend.co.site` to `pos@ninaarmend.co` |
| `.env.example` | Reference email: `.co.site` to `.co` |

### What Won't Change
- Her password stays exactly the same
- Her user ID stays the same
- Her admin role stays the same
- Old migration files are left as-is (they're historical records and won't re-run)

