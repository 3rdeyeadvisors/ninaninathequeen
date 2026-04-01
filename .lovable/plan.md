

## Replace Native `confirm()` Dialogs with Professional AlertDialogs

The browser's native `confirm()` popup is being used in two places on the Customers page. We'll replace both with the existing `AlertDialog` component from the UI library, styled to match the admin aesthetic.

### Changes — `src/pages/admin/Customers.tsx`

1. **Import `AlertDialog` components** from `@/components/ui/alert-dialog`

2. **Add two pieces of state** to control dialog visibility:
   - `showLaunchConfirm` (boolean) — for the send launch email confirmation
   - `showDeleteConfirm` (string | null) — holds the waitlist entry ID to delete

3. **Replace `confirm()` calls:**
   - `handleSendLaunchEmail`: instead of `confirm(...)`, set `showLaunchConfirm = true`; move the actual send logic into a `confirmSendLaunch` handler
   - `handleDeleteWaitlistEntry`: instead of `confirm(...)`, set `showDeleteConfirm = id`; move the delete logic into a `confirmDelete` handler

4. **Render two `AlertDialog` components** in the JSX:
   - **Launch email dialog**: "Send Launch Email" title, message showing recipient count, Cancel and Send buttons (Send styled as primary)
   - **Delete dialog**: "Remove from Waitlist" title, confirmation message, Cancel and Remove buttons (Remove styled as destructive)

No new files needed — the `AlertDialog` component already exists in the project.

