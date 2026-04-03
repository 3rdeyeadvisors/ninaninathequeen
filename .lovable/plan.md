

## Fix: Sitemap Build Failure

The `scripts/generate-sitemap.ts` script reads `process.env.VITE_SUPABASE_URL` and `process.env.VITE_SUPABASE_PUBLISHABLE_KEY`, but when `tsx` runs outside of Vite, those env vars aren't loaded from `.env`. Vite injects them for the app, but the sitemap script runs as a standalone Node/Bun script.

### Fix — `scripts/generate-sitemap.ts`

**Hardcode the Supabase credentials as fallbacks** (same approach already used in `src/integrations/supabase/client.ts`):

```typescript
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://ykhgqjownxmioexytfzc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

This mirrors the pattern in `client.ts` where credentials are hardcoded for reliability. The anon key is a publishable (public) key, so embedding it is safe.

### One file changed
- `scripts/generate-sitemap.ts` — add hardcoded fallback values for lines 7-8

