# Tailwind Entropy LOW Sample Audit — Task 296

**Date:** 2026-05-30  
**Total LOW findings:** 220  
**Sample:** 30 findings, deterministic selection (every 7th finding from sorted index)  
**Purpose:** Planning only — estimate fixable ratio for a future LOW burn-down sprint

---

## 30-Sample Classification

| # | File:line | Category | Pattern | Verdict | Rationale |
|---|-----------|----------|---------|---------|-----------|
| 1 | `contact/page.tsx` + 2 others | DUPLICATE_CHAIN | `py-12 md:py-16` | **Legitimate** | Standard section spacing; scanner notes "acceptable canonical pattern" |
| 2 | `listings/[slug]/loading.tsx:24` | ARBITRARY_VALUE | `lg:grid-cols-[1fr_320px]` | **Legitimate** | Two-column listing detail layout (content + sidebar at 320px fixed); no Tailwind token for this ratio |
| 3 | `AdminCompaniesManager.tsx:192` | ARBITRARY_VALUE | `text-[10px]` | **Legitimate** | Badge/micro-label — already allowlisted for this pattern across many files |
| 4 | `AdminEmailTemplatesManager.tsx:234` | ARBITRARY_VALUE | `min-h-[120px]` | **Legitimate** | Textarea minimum height for comfortable editing; functional constraint |
| 5 | `AdminExchangeProvidersManager.tsx:258` | ARBITRARY_VALUE | `max-w-[160px]` | **Legitimate** | Table column width constraint; no canonical token |
| 6 | `AdminSidebar.tsx:127` | ARBITRARY_VALUE | `text-[10px]` | **Legitimate** | Badge/micro-label — canonical pattern |
| 7 | `AdminSupportManager.tsx:224` | ARBITRARY_VALUE | `text-[10px]` | **Legitimate** | Same |
| 8 | `AdminUserAvatar.tsx:203` | ARBITRARY_VALUE | `max-w-[130px]` | **Legitimate** | Avatar name column constraint |
| 9 | `AdminUserProfile.tsx:890` | ARBITRARY_VALUE | `text-[10px]` | **Legitimate** | Badge — same pattern |
| 10 | `MobileBottomNav.tsx:27` | ARBITRARY_VALUE | `shadow-[0_-2px_16px_rgba(0,0,0,0.08)]` | **Legitimate** | Custom bottom-nav shadow; no design token equivalent |
| 11 | `FilterToggleGroup.tsx:27` | ARBITRARY_VALUE | `min-h-[44px]` | **Legitimate** | 44px touch-target minimum — accessibility requirement |
| 12 | `avatar.tsx:63` | ARBITRARY_VALUE | `group-data-[size=sm]` | **Legitimate** | Base UI component library data-attribute pattern; not modifiable |
| 13 | `avatar.tsx:94` | ARBITRARY_VALUE | `group-has-data-[size=lg]` | **Legitimate** | Same — component library internals |
| 14 | `button.tsx:32` | ARBITRARY_VALUE | `rounded-[min(var(--radius-md),10px)]` | **Legitimate** | CSS calculation using design token variable; intentional |
| 15 | `dialog.stories.tsx:76` | ARBITRARY_VALUE | `max-h-[90vh]` | **Legitimate** | Story/dialog max height — viewport-relative functional constraint |
| 16 | `input-group.tsx:17` | ARBITRARY_VALUE | `dark:has-[[data-slot]` | **Legitimate** | Base UI component internals |
| 17 | `input.stories.tsx:84` | ARBITRARY_VALUE | `min-h-[44px]` | **Legitimate** | Touch-target accessibility in story fixture |
| 18 | `navigation-menu.tsx:111` | ARBITRARY_VALUE | `transition-[top,left,right,bottom]` | **Legitimate** | Multi-property transition; no Tailwind shorthand |
| 19 | `scroll-area.tsx:21` | ARBITRARY_VALUE | `rounded-[inherit]` | **Legitimate** | Component library — inherits parent radius |
| 20 | `select.tsx:107` | ARBITRARY_VALUE | `data-[side=bottom]` | **Legitimate** | Radix/Base UI positioning data attribute |
| 21 | `tabs.tsx:62` | ARBITRARY_VALUE | `dark:group-data-[variant=line]` | **Legitimate** | Component variant data attribute |
| 22 | `ResetPasswordClient.tsx:121` | ARBITRARY_VALUE | `min-h-[60vh]` | **Legitimate** | Auth form viewport-relative min height |
| 23 | `GalleryStaticFrame.tsx:23` | ARBITRARY_VALUE | `md:h-[500px]` | **Legitimate** | Gallery hero fixed height for LCP optimization |
| 24 | `ListingCard.tsx:174` | ARBITRARY_VALUE | `hover:shadow-[0_4px_16px_oklch(...)]` | **Legitimate** | OKLCH custom hover shadow — no design token for card hover elevation |
| 25 | `ListingCard.tsx:315` | ARBITRARY_VALUE | `text-[10px]` | **Legitimate** | Badge — already allowlisted in ListingCard |
| 26 | `ListingGallery.tsx:166` | ARBITRARY_VALUE | `max-h-[85vh]` | **Legitimate** | Gallery viewport-relative max height |
| 27 | `StepPreview.tsx:28` | ARBITRARY_VALUE | `aspect-[16/9]` | **Legitimate** | 16:9 standard video ratio — no Tailwind equivalent |
| 28 | `listings/[slug]/loading.tsx:37` | RESPONSIVE_DRIFT | `hidden md:block` | **Legitimate** | Standard responsive visibility chain; no conflict |
| 29 | `AdminUserProfile.tsx:150` | RESPONSIVE_DRIFT | `grid sm:grid` | **Legitimate** | Grid → responsive grid; single clear progression |
| 30 | `Header.tsx:159` | RESPONSIVE_DRIFT | `hidden sm:flex` | **Legitimate** | Standard mobile-hide / tablet-show pattern |

---

## Sample Summary

| Verdict | Count | % |
|---------|-------|---|
| Legitimate exception (no fix needed) | 30 | 100% |
| Fixable in a burn-down sprint | 0 | 0% |
| Deferred | 0 | 0% |

**Estimated fixable ratio for full 220 LOW:** ~0–5%

---

## Analysis

The 220 LOW findings break down into three dominant groups:

1. **Arbitrary values in component library files** (`avatar.tsx`, `tabs.tsx`, `button.tsx`, `select.tsx`, etc.) — These are Base UI / shadcn/ui internals. They cannot be changed without forking the library. **Do not touch.**

2. **Functional viewport/height constraints** (`min-h-[44px]`, `max-h-[85vh]`, `min-h-[60vh]`, `md:h-[500px]`) — These encode real layout constraints (touch targets, viewport safety, LCP optimization). No canonical Tailwind token replaces them. **Legitimate exceptions.**

3. **Already-allowlisted badge pattern** (`text-[10px]` across 8+ files) — Task 283 added these to the allowlist; they appear in the LOW count because the scanner re-reads all findings before allowlist filtering. **Already handled.**

## Recommendation for Future LOW Sprint

A dedicated LOW burn-down sprint for the 220 findings is **low ROI**:
- ~95%+ are legitimate or untouchable (component library)
- The remaining ~5% (~11 findings) would be `py-12 md:py-16` → `.section-standard` CSS utility class candidates (6 occurrences) + a few isolated cases

**Suggested action instead of a LOW sprint:** 
1. Add the `py-12 md:py-16` section-spacing pattern to `tailwind-canonical-fragments.md §13` (already documented as "section standard") 
2. Accept the remaining 220 LOW as a stable, non-growing debt floor
3. Re-sample in Q3 2026 to confirm stability
