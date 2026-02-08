
# Install Favicon Files

## What I'll Do

Copy all the uploaded favicon files from `user-uploads://` to the `public/` folder:

| Source File | Destination |
|-------------|-------------|
| `user-uploads://favicon-2.ico` | `public/favicon.ico` |
| `user-uploads://favicon-16x16-2.png` | `public/favicon-16x16.png` |
| `user-uploads://favicon-32x32-2.png` | `public/favicon-32x32.png` |
| `user-uploads://apple-touch-icon-2.png` | `public/apple-touch-icon.png` |
| `user-uploads://android-chrome-192x192-2.png` | `public/android-chrome-192x192.png` |
| `user-uploads://android-chrome-512x512-2.png` | `public/android-chrome-512x512.png` |

The `index.html` and `manifest.json` are already updated to reference these files, so once copied, the favicon will appear in browser tabs.

## Note

The uploaded `site-2.webmanifest` has empty name/short_name fields - I'll keep our existing `manifest.json` which already has "NINA ARMEND | Brazilian Swimwear" configured with proper branding.
