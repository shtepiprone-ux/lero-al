# Project Backlog

## Last Session
**2026-05-18 — Post-Governance Debt Burn-down Sprint / Phase 3: Unused Vars Cleanup (Task 66)**
- Removed 27 `@typescript-eslint/no-unused-vars` warnings across 20 source files (imports, destructuring, unused calls).
- Result: `npm run lint` warnings 44 → **17** (0 errors maintained).
- Task 66 introduced zero new lint violations.
- All validation checks pass: typecheck, build, governance, governance:tailwind, governance:storybook, governance:screenshots, governance:components.

→ Детальний лог: [`docs/sessions/2026-05-18-eslint-unused-vars-cleanup.md`](sessions/2026-05-18-eslint-unused-vars-cleanup.md)

---

## Post-Governance Debt Burn-down Sprint

### Task 64 — ESLint Debt Taxonomy & Safe Burn-down Plan ✅ CLOSED
**Finding:** All 163 errors are `storybook-static/` false positives. Zero source errors.
**Lint status:** `npm run lint` currently fails due to 163 pre-existing errors / 11,004 warnings.
**Artifacts:** `docs/eslint-debt-taxonomy.md`, `scripts/analyze-eslint-debt.mjs`

### Task 65 — Batch 1: Add storybook-static to ESLint globalIgnores ✅ CLOSED
**Change:** Added `"storybook-static/**"` to `globalIgnores` in `eslint.config.mjs`.
**Result:** 163 errors → 0 errors. 11,004 warnings → 44 warnings (genuine source warnings). Risk: LOW.

### Task 66 — Batch 2: Unused imports/variables cleanup in src/ ✅ CLOSED
**Result:** 27 warnings removed across 20 files. Warnings: 44 → 17. Risk: MEDIUM.
**Skipped (intentional):** CLOSED_LABEL/isFavoriteClosed (in-progress), getCallerId (reserved), _req (underscore pattern).

### Task 67+ — Batch 3: react-hooks/exhaustive-deps audit (FUTURE)
**Scope:** Case-by-case hook dependency review. Risk: MEDIUM–HIGH.

---

## Future Maintenance Direction Epic (Tasks 58–63) ✅ COMPLETE

**2026-05-18 — Phase 6: Component Cataloging — Future Maintenance Direction Epic COMPLETE (Task 63)**
- `scripts/governance/component-catalog.mjs` created — scans 158 components, generates JSON + markdown catalog.
- `npm run governance:components` (CI-safe check) and `npm run catalog:components` (full scan) added.
- Docs created: `component-catalog.md`, `component-coverage-matrix.md`, `component-risk-register.md`, `component-catalog-governance.md`.
- Pre-existing debt documented: 38 raw `<button>`, 54 arbitrary TW, 28 grids missing 2xl. Zero new violations.
- `npm run lint` currently fails due to 163 pre-existing errors / 11,004 warnings — zero new violations introduced by Task 63.
- **Future Maintenance Direction Epic (Phases 1–6) COMPLETE.**

→ Детальний лог: [`docs/sessions/2026-05-18-component-cataloging.md`](sessions/2026-05-18-component-cataloging.md)

---

## Next Immediate Tasks (in order)

### [Maintenance Debt] Global ESLint Debt Burn-down (Task 67 — NEXT UP)
- `npm run lint` now reports 0 errors / 17 warnings (Tasks 64–66 complete).
- Remaining warnings: 8 unused `eslint-disable` directives, 2 jsx-a11y, 1 no-img-element, 1 exhaustive-deps, 4 intentional no-unused-vars.
- Task 67: Batch 3 — unused `eslint-disable` directive cleanup (LOW risk).
- See `docs/eslint-debt-taxonomy.md` for full taxonomy and batch plan.

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
| 2026-05-18 | Post-Governance Debt Burn-down Sprint Phase 3: Unused Vars Cleanup | Task 66 | [sessions/2026-05-18-eslint-unused-vars-cleanup.md](sessions/2026-05-18-eslint-unused-vars-cleanup.md) |
| 2026-05-18 | Post-Governance Debt Burn-down Sprint Phase 2: ESLint False-Positive Fix | Task 65 | [sessions/2026-05-18-eslint-false-positive-fix.md](sessions/2026-05-18-eslint-false-positive-fix.md) |
| 2026-05-18 | Post-Governance Debt Burn-down Sprint Phase 1: ESLint Debt Taxonomy | Task 64 | [sessions/2026-05-18-eslint-debt-taxonomy.md](sessions/2026-05-18-eslint-debt-taxonomy.md) |
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
