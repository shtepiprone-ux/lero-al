# Project Backlog

## Last Session
**2026-05-18 — Phase 6: Component Cataloging — Future Maintenance Direction Epic COMPLETE (Task 63)**
- `scripts/governance/component-catalog.mjs` created — scans 158 components, generates JSON + markdown catalog.
- `npm run governance:components` (CI-safe check) and `npm run catalog:components` (full scan) added.
- Docs created: `component-catalog.md`, `component-coverage-matrix.md`, `component-risk-register.md`, `component-catalog-governance.md`.
- Pre-existing debt documented: 38 raw `<button>`, 54 arbitrary TW, 28 grids missing 2xl. Zero new violations.
- Lint has pre-existing global debt (163 errors); zero new violations introduced by Task 63.
- **Future Maintenance Direction Epic (Phases 1–6) COMPLETE.**

→ Детальний лог: [`docs/sessions/2026-05-18-component-cataloging.md`](sessions/2026-05-18-component-cataloging.md)

---

## Next Immediate Tasks (in order)

### [Maintenance Debt] Global ESLint Debt Burn-down (MEDIUM — future sprint)
- `npm run lint` currently has 163 pre-existing errors / 11,004 warnings.
- Future Maintenance Direction Epic (Phases 1–6) introduced **zero new violations**.
- Dedicated future sprint required to address pre-existing lint debt.

### 0. Listing detail mobile LCP — residual hydration cost (HIGH — SEO impact)
After the hydration budget pass, mobile Lighthouse LCP for `/[locale]/listings/[slug]` is
still **POOR** (5339–5523ms, all 4 locales). TBT is GOOD (≤ 200ms). CLS is 0.

The LCP element IS the GalleryStaticFrame cover `<img>` (confirmed via Lighthouse trace):
`div.listing-gallery > div.col-span-4 > div.relative > img.absolute`

This means the image IS in the SSR HTML and Chrome identifies it as the LCP candidate.
The bottleneck is not the image delivery (the preconnect + preload + fetchpriority are all
in place). The bottleneck is that **Chrome defers compositing while the main thread is
busy executing React hydration** (~888ms at 4× throttle).

The remaining above-fold client components after the hydration pass:
- `Header` (unavoidable — interactive locale switcher, auth menu)
- `GalleryIsland` → `ListingGallery` (lazy, ssr:false — deferred but still executes after initial HTML)
- `AuthProvider` (provider overhead for entire tree)
- `ListingBackButton` (sessionStorage + scroll-to-top in useEffect)
- `FavoriteButton` (optimistic toggle)

**Next steps to investigate:**
1. Profile the actual LCP waterfall in Lighthouse trace — which long task most delays the compositor
2. Consider converting `ListingBackButton` to a simpler server-rendered link with no sessionStorage logic
3. Consider whether `AuthProvider` can be moved outside the `NextIntlClientProvider` or if its Supabase subscription can be deferred further
4. Check if `preload()` from React 19 (called server-side for the gallery LCP image) is actually emitting `<link rel="preload" fetchpriority="high">` in the `<head>` — the Lighthouse report shows `priorityHinted: false` for the preload request
5. Verify that the preload `<link>` is in the FIRST response chunk (before any blocking scripts)

**Note:** The LCP element and image delivery are both correct. The issue is main-thread scheduling.

### 1. User cabinet (`/cabinet`)
- Profile page: avatar, name, phone, WhatsApp, user type.
- My listings tab: list with status badges, edit/delete actions.
- Saved searches tab.
- Route: `src/app/[locale]/cabinet/page.tsx`.
- Requires auth guard (redirect to /auth/login if not logged in).

### 2. Cloudinary integration
- `npm install next-cloudinary`.
- Add env vars: `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- Create upload component: `src/modules/listings/components/ImageUpload.tsx`.
- Use `CldUploadWidget` from next-cloudinary.

### 3. Create listing form (`/listings/create`)
- Multi-step form: basic info → details → photos → location → preview.
- Uses listingSchema (Zod) from `src/modules/listings/validations/index.ts`.
- Requires auth + must be agent or admin.

### 4. Admin panel (`/admin`)
- No locale prefix.
- Sidebar: Dashboard, Listings, Users, Support, Pages.
- Listings table: status management, premium toggle.
- Users table: role management, verify agent.
- Route guard: admin/moderator only.

### 5. Google OAuth
Supabase Dashboard → Authentication → Providers → Google → Enable.

---

## Session Archive

| Date | Description | Tasks | File |
|------|-------------|-------|------|
| 2026-05-18 | Future Maintenance Direction Epic Phase 6: Component Cataloging (EPIC COMPLETE) | Task 63 | [sessions/2026-05-18-component-cataloging.md](sessions/2026-05-18-component-cataloging.md) |
| 2026-05-18 | Future Maintenance Direction Epic Phase 5: Responsive Regression Screenshots | Task 62 | [sessions/2026-05-18-responsive-regression-screenshots.md](sessions/2026-05-18-responsive-regression-screenshots.md) |
| 2026-05-18 | Future Maintenance Direction Epic Phase 4: Storybook Foundation | Task 61 | [sessions/2026-05-18-storybook-visual-snapshots.md](sessions/2026-05-18-storybook-visual-snapshots.md) |
| 2026-05-18 | Future Maintenance Direction Epic Phase 3: Tailwind Entropy Detection | Task 60 | [sessions/2026-05-18-tailwind-utility-entropy-detection.md](sessions/2026-05-18-tailwind-utility-entropy-detection.md) |
| 2026-05-18 | Future Maintenance Direction Epic Phase 2: CI Governance & Lint Enforcement | Task 59 | [sessions/2026-05-18-ci-governance-enforcement.md](sessions/2026-05-18-ci-governance-enforcement.md) |
| 2026-05-18 | Future Maintenance Direction Epic Phase 1: Governance Enforcement | Task 58 | [sessions/2026-05-18-governance-enforcement-phase-1.md](sessions/2026-05-18-governance-enforcement-phase-1.md) |
| 2026-05-18 | Responsive/UI Governance Epic — всі 7 фаз | Tasks 51–57 | [sessions/2026-05-18-ui-governance-epic.md](sessions/2026-05-18-ui-governance-epic.md) |
| 2026-05-18 | Filter Architecture Stabilization + SSR/Navigation Hardening | Task 50.4 | [sessions/2026-05-18-task-50.4.md](sessions/2026-05-18-task-50.4.md) |
| 2026-05-17 | Notifications, Saved Searches, Currency, Property Types, Admin fixes, i18n | Tasks 17.1, 21–50.3 | [sessions/2026-05-17-tasks-17-50.md](sessions/2026-05-17-tasks-17-50.md) |
| 2026-05-16 | Admin panel, User Profile, Auth, Performance, Favorites, Listings | Tasks 12–20 + bootstrap | [sessions/2026-05-16-tasks-12-19.md](sessions/2026-05-16-tasks-12-19.md) |
