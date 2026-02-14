

# Launch Announcement Email + Selectable Waitlist

## Overview

Add a "Send Launch Email" feature to the Waitlist tab that lets you select specific waitlist entries and send them a branded launch announcement email. The email will tell them Nina Armend is live, invite them to create an account to earn points, and link to the signup page.

## Part 1: New Email Template (Edge Function)

**File:** `supabase/functions/send-email/index.ts`

Add a new `launchAnnouncementEmail` function that generates the launch email:
- Subject: "Nina Armend Is Now Live"
- Content: Announces the store is open, highlights the 50 welcome points for creating an account, and includes a CTA button linking to the signup/shop page
- Uses the existing branded `baseWrapper` layout (black bg, gold accents, Parisienne logo)

Add a new case `'launch_announcement'` in the switch statement that accepts `{ emails: string[] }` -- an array of recipient emails. It loops through each email and sends the launch email individually via the existing `sendEmail` helper.

## Part 2: Selectable Waitlist UI

**File:** `src/pages/admin/Customers.tsx`

Changes to the Waitlist tab:

1. **New state**: `selectedIds` (Set of waitlist entry IDs) and `isSendingLaunch` (boolean loading state)

2. **Checkbox column**: Add a checkbox to each waitlist row for selection, plus a "select all" checkbox in the table header

3. **"Send Launch Email" button**: Appears in the toolbar next to "Download CSV" when at least one entry is selected. Shows count of selected entries (e.g., "Send Launch Email (5)"). On click:
   - Confirms with the user ("Send launch email to X recipients?")
   - Calls the `send-email` edge function with `type: 'launch_announcement'` and the selected emails array
   - Shows success/error toast
   - Disables button and shows spinner while sending

4. **Select All / Deselect All**: The header checkbox toggles between selecting all filtered entries and deselecting all

## Technical Details

### Launch Email Content
```
Subject: Nina Armend Is Now Live

Body:
- "The wait is over" headline
- Brief message that the store is open
- Card highlighting 50 welcome points for creating an account
- Primary CTA button: "Create Your Account" -> /shop (or signup route)
- Secondary note about exclusive collections
```

### Edge Function Changes
- New template function: `launchAnnouncementEmail(data: { name?: string })`
- New case in switch: `'launch_announcement'` that expects `{ emails: string[] }` and sends to each recipient
- Sends emails sequentially to avoid rate limiting, returns combined results

### UI Component Changes
- Import `Checkbox` from `@/components/ui/checkbox`
- Add `Send` icon from lucide-react
- New column in waitlist table (leftmost) with checkboxes
- Toolbar button conditionally rendered when `selectedIds.size > 0`

## Testing Plan

After implementation:
1. Navigate to admin Customers page, Waitlist tab
2. Verify checkboxes appear on each row and "select all" works
3. Select a few entries and verify the "Send Launch Email" button appears with correct count
4. Click the button and confirm the email is sent successfully via edge function logs
5. Verify the email content renders correctly with the branded template

