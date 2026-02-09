

## Clean Up Fake/Placeholder Data

This plan removes all fabricated customer data from your live site to ensure legal compliance before you add real testimonials and reviews.

---

### Summary of Changes

| File | Change |
|------|--------|
| `src/components/Testimonials.tsx` | Remove section from homepage entirely (you can re-add later with real reviews) |
| `src/pages/Index.tsx` | Remove Testimonials component import and usage |
| `src/stores/reviewStore.ts` | Initialize with empty array instead of fake reviews |
| `src/components/CartDrawer.tsx` | Use `null` for guest email instead of fake `guest@example.com` |
| `src/test/authStore.test.ts` | Delete file (contains exposed password, tests deprecated auth) |
| `src/stores/authStore.ts` | Replace Unsplash stock photo avatar with `undefined` |

---

### Technical Details

**1. Remove Testimonials Section**

The homepage currently displays the Testimonials component with 3 fake customer quotes. We'll remove it from the Index page entirely. The component file stays in case you want to wire it up to real database reviews later.

```typescript
// src/pages/Index.tsx - Remove Testimonials import and usage
// Before: <Testimonials />
// After: (removed from page)
```

**2. Empty Review Store**

The review store initializes with 2 fake reviews that appear on product pages. We'll start with an empty array so only real user-submitted reviews display.

```typescript
// src/stores/reviewStore.ts
reviews: [], // Empty - real reviews will be added by users
```

**3. Fix Guest Checkout Email**

Guest orders currently save with `guest@example.com`. We'll use `null` to properly indicate a guest order without fake data.

```typescript
// src/components/CartDrawer.tsx
customerEmail: user?.email || null,
```

**4. Delete Obsolete Test File**

The file `src/test/authStore.test.ts` contains the hardcoded password `"Bossqueen26!"` and tests a deprecated auth system. This file will be deleted.

**5. Remove Stock Photo Avatar**

The admin user in authStore uses a random Unsplash photo. We'll set it to `undefined` so the UI shows initials or a default avatar instead.

```typescript
// src/stores/authStore.ts - DEFAULT_ADMIN
avatar: undefined, // Remove stock photo
```

---

### What Happens Next

Once these changes are implemented:
- Homepage won't show fake testimonials
- Product pages won't show fake reviews
- Orders from guests won't have fake email addresses
- No exposed passwords in codebase
- No random stock photos pretending to be real people

When you're ready to add real testimonials, we can either:
1. Wire the Testimonials component to fetch from your reviews database
2. Let you manually add verified customer quotes

