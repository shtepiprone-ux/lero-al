# Project Backlog

> Lightweight index. Full per-task detail lives in `docs/sessions/`. Do **not** paste multi-line per-task blocks into this file — see "Backlog & Session Log Rules" in `docs/ai-behavior.md`. Target: ~80 lines of active content above the Session Archive table.

## Last Session

**2026-05-22 — Sprint 8 (Task 172) ✅**

- `scripts/check-schema-drift.mjs`: parses `src/types/database.ts`, emits `scripts/schema-drift-check.sql`. 21 tables / 204 columns tracked.
- `npm run check:schema-drift` added to `package.json`.
- `docs/qa-rules.md` §Schema drift check + `docs/integrations.md` reference added.
- SQL generated and verified: two result sets (missing-in-DB + informational extras).

→ [Task 172 session log](sessions/2026-05-22-task-172-schema-drift-guard.md)

## Last-but-one Session

**2026-05-22 — Sprint 7 (Tasks 170 + 171) ✅**

- Task 170: `error_phone_invalid` + `error_phone_no_country_code` added to `admin.user_profile.validation` in all 4 catalogs (sq/en/uk/it). Raw key no longer shown on invalid phone save.
- Task 171: `isAdmin` prop added to `AdminEmailTemplatesManager`; Delete button now conditionally rendered (`{isAdmin && …}`). email-templates page.tsx resolves viewer role via `getUser()` → `users.role`. Server `assertAdmin()` boundary unchanged.

→ [Task 170 session log](sessions/2026-05-22-task-170-phone-validation-i18n.md)
→ [Task 171 session log](sessions/2026-05-22-task-171-email-delete-admin-only-ui.md)

## Last-but-one Session

**2026-05-22 — Sprint 5 + PGRST204 schema cache fix ✅**

- Task 167: `status_active` / `status_inactive` added to `listing` namespace in all 4 catalogs (sq/en/uk/it). Dashboard status bars + recent-listing badge now show translated labels.
- Task 168: `setValue('profileType', v, { shouldDirty: true })` — Save button now enables when only account type is changed.
- PGRST204 investigation: admin user profile save failed with "Could not find 'suspended_until' in schema cache". Root cause — stale PostgREST cache (column existed in DB). Fix: `notify pgrst, 'reload schema'`. No code or migration needed.

→ [Task 167 session log](sessions/2026-05-22-task-167-dashboard-status-i18n.md)
→ [Task 168 session log](sessions/2026-05-22-task-168-role-save-shoulddirty.md)
→ [PGRST204 session log](sessions/2026-05-22-pgrst204-schema-cache-fix.md)

## Last-but-one Session

**2026-05-22 — Task 162 — E.5 ADR verification ✅**

- ADR confirmed committed (51abc1f96 — `docs/state-authority.md`); no stray code changes.
- `useListingsUrlFilters.ts` clean; working tree clean. Task 133 entry accurate. No code changes.

→ [Task 162 session log](sessions/2026-05-22-task-162-e5-adr-verify.md)

## Last-but-one Session

**2026-05-22 — Task 161 — Email template delete = admin-only ✅**

- `assertAdmin()` added; delete actions switched from `assertAdminOrModerator()`.

→ [Task 161 session log](sessions/2026-05-22-task-161-email-template-delete-admin-only.md)

## Last-but-one Session

**2026-05-22 — Task 160 — Block/suspension enforcement ✅**

- `getBlockedError(userId)` canonical helper: permanent block + `suspended_until` + auto-lift.
- 7 write actions guarded; `createListing` inline check replaced.
- `error_account_suspended` i18n key × 4 locales.

→ [Task 160 session log](sessions/2026-05-22-task-160-block-suspension-enforcement.md)

## Last-but-one Session

**2026-05-22 — Task 157 — Recovery security logging ✅**

- IP + UA + correlationId (SHA-256 email hash); email never in logs; `LOG_CORRELATION_SALT` env documented.

→ [Task 157 session log](sessions/2026-05-22-task-157-recovery-security-logging.md)

## Last-but-one Session

**2026-05-22 — Task 155 (L.2) — Build the Admin Dashboard ✅ — L.3 folded in**

- 6 KPI cards (P0); status breakdown bars (CSS only); Pending Reports always visible; Recent Listings Epic K clickable.
- `AdminDashboardRecentListings` client component: clickable title → preview Dialog.
- 12 i18n keys × 4 locales. ⚠️ Index migration SQL in session log (run before prod deploy).
- **L.3 folded into L.2. Epic L — CLOSED.**

→ [Task 155 session log](sessions/2026-05-22-task-155-l2-dashboard-build.md)

## Last-but-one Session

**2026-05-22 — Task 154 (L.1) — Admin Dashboard 2026: KPI discovery ✅ signed off**

- P0 signed off; wireframes + index plan. L.3 folded into L.2.

→ [Task 154 session log](sessions/2026-05-22-task-154-l1-dashboard-discovery.md)

## Last-but-one Session

**2026-05-22 — Task 153 (J.3) — Auto-generated filter link ✅ — Epic J CLOSED**

- `?location_id=<id>` confirmed canonical (filterEngine.ts); no code changes. Slug strategy documented.
- **Epic J — CLOSED** (Tasks 151–153).

→ [Task 153 session log](sessions/2026-05-22-task-153-j3-filter-link.md)

## Last-but-one Session

**2026-05-22 — Task 152 (J.2) — Popular Locations public section ✅**

- `PopularLocations` → Server Component (SSR, section self-contained, hides when empty).
- Homepage: `<PopularLocations />` only (no wrapper/heading in page.tsx).

→ [Task 152 session log](sessions/2026-05-22-task-152-j2-popular-locations-public.md)

- No new DB table — uses existing `locations.is_featured` / `display_order` / `image_url`.
- `AdminPopularLocationsManager`: §11 canonical (row click → Dialog, no Actions column).
- Photo upload API → `popular_locations/<id>/...` (H.7); `deleteAsset` now checks `locations.image_url`.
- 26 i18n keys × 4 locales; sidebar + mobile header entries added.

→ [Task 151 session log](sessions/2026-05-22-task-151-j1-popular-locations-admin.md)

## Last-but-one Session

**2026-05-22 — Task 150 (I.3) — Helper API evolution trigger ✅ — Epic I CLOSED**

- Evolution trigger documented in `domain-rules.md`; placeholder in backlog §Follow-ups.
- **Epic I — CLOSED** (Tasks 148–150 all done).

→ [Task 150 session log](sessions/2026-05-22-task-150-i3-helper-api-evolution.md)

## Last-but-one Session

**2026-05-22 — Task 149 (I.2) — Centralize status helpers ✅**

- Grep verified: domain already complete — no unguarded `status === 'X'` outside `domain/`.
- `docs/domain-rules.md`: full helpers table + permitted exceptions + ListingStateMachine evolution trigger.
- No code changes needed (helpers existed; import path confirmed).

→ [Task 149 session log](sessions/2026-05-22-task-149-i2-status-helpers.md)

## Last-but-one Session

**2026-05-22 — Task 148 (I.1) — Fix "New" badge logic ✅**

- Detail page: hardcoded `7` → `LISTING_NEW_DAYS` constant (no `updated_at` usage found anywhere).
- `docs/domain-rules.md`: "Listing 'New' Badge Rule" section added.

→ [Task 148 session log](sessions/2026-05-22-task-148-i1-new-badge-fix.md)

## Last-but-one Session

**2026-05-22 — Task 147 (H.7) — Other photos folder structure ✅ — Epic H CLOSED**

- `upload-company-logo`: `'companies'` → `` `companies/${companyId}` `` (one line).
- `docs/integrations.md` folder tree complete: user/avatar/listing/company all ✅; marketing+popular_locations placeholders.
- **Epic H — CLOSED** (Tasks 141–147 all done).

→ [Task 147 session log](sessions/2026-05-22-task-147-h7-other-photos-folder.md)

## Last-but-one Session

**2026-05-22 — Task 146 (H.5) — Listing image replacement cleanup ✅**

- `updateListing`: fetch old URLs → bulk delete/insert → orphan diff → `deleteAsset` (parallel, non-fatal).
- `deleteListing`: fetch URLs before cascade → delete listing → bulk cleanup.
- `publicIdFromUrl` used (no `public_id` column in `listing_images`); H.6 ref check runs after new images in DB.

→ [Task 146 session log](sessions/2026-05-22-task-146-h5-listing-image-cleanup.md)

## Last-but-one Session

**2026-05-22 — Task 145 (H.3) — Avatar replacement cleanup ✅**

- `upload-avatar` route: read old `avatar_url` → upload new → update DB → `deleteAsset(oldPublicId, {reason:'avatar_replaced'})`.
- DB-first order enforced; idempotent guard (same asset re-upload skipped); non-fatal.

→ [Task 145 session log](sessions/2026-05-22-task-145-h3-avatar-replacement-cleanup.md)

## Last-but-one Session

**2026-05-22 — Task 144 (H.6) — Cloudinary safety audit / dry-run framework ✅**

- `deleteAsset(publicId, { reason })` — single wrapper, reference check + dry-run gate + structured log.
- Reference check: `listing_images.public_id` (exact) + 3 URL ILIKE checks; `popular_locations` TODO for Epic J.
- `CLOUDINARY_DELETE_MODE=enabled` needed for real deletes; default is dry-run.
- 5/5 tests pass (Supabase + fetch mocked via vi.mock). Unblocks H.3 + H.5.

→ [Task 144 session log](sessions/2026-05-22-task-144-h6-cloudinary-safety-audit.md)

## Last-but-one Session

**2026-05-22 — Task 143 (H.4) — Listing image folder structure ✅**

- `uploadFolder` prop threaded: create page → `ListingFormLoader` → `ListingFormShell` → `ImageUpload` → `CldUploadWidget`.
- Create: `<user_id>/listings/` (no listing_id at upload time); edit: `<user_id>/listings/<listing_id>/`.
- `StepPhotos.tsx` (dead code) updated for typecheck compliance.

→ [Task 143 session log](sessions/2026-05-22-task-143-h4-listing-image-folder.md)

## Last-but-one Session

**2026-05-22 — Task 142 (H.2) — Avatar folder structure ✅**

- `upload-avatar` route: `'avatars'` → `` `${uploadForUserId}/avatars` `` — one line.
- DB reference stays valid (URL updated atomically); `AppImage variant="avatar"` unaffected.
- All avatar paths (cabinet + admin) route through the same endpoint — no other changes needed.

→ [Task 142 session log](sessions/2026-05-22-task-142-h2-avatar-folder.md)

## Last-but-one Session

**2026-05-22 — Task 141 (H.1) — Cloudinary user-based folder structure ✅**

- Extracted shared `uploadToCloudinary` + `publicIdFromUrl` into `src/lib/cloudinaryUpload.ts`.
- Both upload routes (`upload-avatar`, `upload-company-logo`) now use shared utility.
- Full folder tree, DB reference policy, and migration plan documented in `docs/integrations.md`.
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` added to `docs/env.md` (was missing).
- Folder strings unchanged — actual path changes in H.2/H.4/H.7.

→ [Task 141 session log](sessions/2026-05-22-task-141-h1-cloudinary-folder-structure.md)

## Last-but-one Session

**2026-05-22 — Task 166 — Seed DB-driven email templates ✅ (SQL pending Supabase apply)**

- `reporter_notification` confirmed code-first (React Email, no `sendTemplatedEmail` call) — not seeded.
- `saved_search_alert` × 4 locales + `price_change_alert` × 4 locales — idempotent seed SQL in session log.
- No code changes; all governance gates unchanged.
- Seed SQL applied ✅ (2026-05-22) — `/admin/email-templates` lists both groups; cron emails functional.

→ [Task 166 session log](sessions/2026-05-22-task-166-seed-email-templates.md)

## Last-but-one Session

**2026-05-22 — Task 165 — Responsive screenshot evidence for recently-viewed ✅**

- `RecentlyViewedGrid` presentational component split out of `RecentlyViewedSection` (no auth/DB/server-action deps → Storybook-safe).
- `System/RecentlyViewedSection` Storybook story: Populated, MobileScroll, HugeDesktop, EmptyState, UkrainianLocale.
- `STORY_TARGETS` updated with all 7 breakpoints (mobile-390 covered via `--full`).
- Screenshot capture **✅ complete** — all 7 breakpoints confirmed (2026-05-22).

→ [Task 165 session log](sessions/2026-05-22-task-165-recently-viewed-screenshots.md)

## Last-but-one Session

**2026-05-22 — Task 164 (P1) — Epic G correctness + closure ✅ — Epic G CLOSED**

- Scope fix: `showClear` prop — clear button now profile-only (listing detail unaffected).
- DB migration confirmed live in Supabase (table + RLS + RPC applied).
- Locale parity: all 8 `recently_viewed_*` keys × 4 locales verified.
- Screenshots deferred: auth/DB Server Component → Storybook story needed (follow-up task).
- **Epic G — CLOSED** (⚠️ responsive screenshots pending Storybook story).

→ [Task 164 session log](sessions/2026-05-22-task-164-epic-g-closure.md)

## Last-but-one Session

**2026-05-22 — Task 163 (P0) — Epic G recovery ✅**

- Build restored: G.2 wiring + `recentlyViewedQueries.ts` committed; `'use server'` constants extracted.
- typecheck 0 / governance all PASS / build green.

→ [Task 163 session log](sessions/2026-05-22-task-163-epic-g-recovery.md)

## Pending Action Items

Manual/ops actions still required outside of code commits. Keep here until done, then move to the relevant session log.

- ~~⚠️ **Supabase Auth config (Task 122 — Send Email Hook):** do **NOT** disable Supabase "Confirm email" until the Send Email Hook is verified live in production.~~ → **DONE (2026-05-22).** "Confirm email" disabled; Send Email Hook live and verified in production — only Lero-service emails are sent, and the post-registration confirmation email arrives correctly. (Follow-up: the auth email templates routed through the hook are **not editable in the admin panel** but should be → Task 166.)
- ~~⚠️ **DB SQL (Epic F — Tasks 136/137):** run the `collections` and `favorite_price_alerts` table + RLS SQL in Supabase.~~ → **DONE (2026-05-22).** Both tables + RLS applied in Supabase; collections and price alerts are now backed by live schema.

## Carry-over from Sprint 1 / Epic A

~~`governance:primitives` gate H:+30 debt~~ → **DONE** in Sprint 3 / Task 109. Gate now PASSES at C0/H57/M1.
~~Dead-code server actions~~ → **DONE** in Sprint 2 / Task 107.

## Next Immediate Tasks

**Last completed:** Task 162 (E.5 ADR verification — all items already resolved).

**Next:** All Follow-up tasks (157, 160, 161, 162) are now CLOSED. Roadmap complete.

## Task roadmap — numbered

Active queue. Closed epics (B, C, D, E, F, K) and Sprints (0–4) live in **Closed sprints & epics**. Epic order fixed 2026-05-20: D → C → K → E → F → G → H → I → J → L. Numbers are global — never reused; if priorities change, renumber forward from the change point.

~~**Epic G — Recently Viewed Listings**~~ — **CLOSED** (Tasks 138–140, 163–165)

~~**Epic H — Cloudinary Storage Hygiene**~~ — **CLOSED** (Tasks 141–147)

~~**Epic I — Listing Lifecycle & Status Rules**~~ — **CLOSED** (Tasks 148–150)

**Epic I — Listing Lifecycle & Status Rules**
- **Task 148** — I.1 Fix "New" badge logic (created_at only).
- **Task 149** — I.2 Centralize status helpers (prepare for `ListingStateMachine`).
- **Task 150** — I.3 Helper API evolution — deferred trigger; document the condition.

~~**Epic J — Popular Locations Management**~~ — **CLOSED** (Tasks 151–153)

~~**Epic L — Admin Dashboard 2026**~~ — **CLOSED** (Tasks 154–155; L.3 folded into L.2)

**Follow-ups / hardening — all CLOSED**

- ~~**Task 157**~~ — Recovery security logging ✅ (IP+UA+correlationId, email hash)
- ~~**Task 160**~~ — Block/suspension enforcement ✅ (getBlockedError, 7 actions, auto-lift)
- ~~**Task 161**~~ — Email template delete admin-only ✅ (assertAdmin, RLS documented)
- ~~**Task 162**~~ — E.5 ADR verification ✅ (already committed; working tree clean)
- **I.3 deferred** — Listing status helper API migration `(status) → (listing)`. Trigger: publishing workflows / moderation automation / lifecycle transitions / listing automation. See `docs/domain-rules.md §Listing Status Helpers — evolution trigger`.

Every task MUST follow the Canonical Task Template in `docs/ai-behavior.md` (Pre-read · Localization coverage · Responsive coverage · Acceptance criteria).

## Active product backlog (epics not yet started)

| Epic | Plan | Kickoff prompts |
|---|---|---|
| Epic G — Recently Viewed Listings | [`Epic_G_Recently_Viewed_Listings.md`](../tasks/Epics/Epic_G_Recently_Viewed_Listings.md) | [`Epic_G_kickoff_prompts.md`](../tasks/Epics/Epic_G_kickoff_prompts.md) |
| Epic H — Cloudinary Storage Hygiene | [`Epic_H_Cloudinary_Storage_Hygiene.md`](../tasks/Epics/Epic_H_Cloudinary_Storage_Hygiene.md) | [`Epic_H_kickoff_prompts.md`](../tasks/Epics/Epic_H_kickoff_prompts.md) |
| Epic I — Listing Lifecycle & Status Rules | [`Epic_I_Listing_Lifecycle_and_Status_Rules.md`](../tasks/Epics/Epic_I_Listing_Lifecycle_and_Status_Rules.md) | [`Epic_I_kickoff_prompts.md`](../tasks/Epics/Epic_I_kickoff_prompts.md) |
| Epic J — Popular Locations Management | [`Epic_J_Popular_Locations_Management.md`](../tasks/Epics/Epic_J_Popular_Locations_Management.md) | [`Epic_J_kickoff_prompts.md`](../tasks/Epics/Epic_J_kickoff_prompts.md) |
| Epic L — Admin Dashboard 2026 | [`Epic_L_Admin_Dashboard_2026.md`](../tasks/Epics/Epic_L_Admin_Dashboard_2026.md) | [`Epic_L_kickoff_prompts.md`](../tasks/Epics/Epic_L_kickoff_prompts.md) |

## Closed sprints & epics (historical)

- **Epic B — Auth, Registration & Agent Onboarding** (Tasks 108, 112–115) — CLOSED, see [`tasks/Epics/Epic_B_Summary_CLOSED.md`](../tasks/Epics/Epic_B_Summary_CLOSED.md)
- **Epic C — Trust, Safety & Moderation** (Tasks 116–118, 125–126) — CLOSED, see [`tasks/Epics/Epic_C_Summary_CLOSED.md`](../tasks/Epics/Epic_C_Summary_CLOSED.md)
- **Epic D — Email Infrastructure & Account Lifecycle** (Tasks 119–124) — CLOSED, see [`tasks/Epics/Epic_D_Summary_CLOSED.md`](../tasks/Epics/Epic_D_Summary_CLOSED.md)
- **Epic E — Search, Filters & Saved Search UX** (Tasks 131–133, plus E.2/E.3 from earlier) — CLOSED.
- **Epic K — Admin Tables Standardization** (Tasks 127–130) — CLOSED, canonical pattern in `docs/component-governance.md §11`.
- **Epic F — Favorites Improvements** (Tasks 134–137) — CLOSED, see [`tasks/Epics/Epic_F_Favorites_Improvements.md`](../tasks/Epics/Epic_F_Favorites_Improvements.md)
- **Sprint 0 — Critical Bugfix / Regression Stabilization** (Tasks 84–90) — CLOSED, see [`tasks/Sprints/Sprint_0_—_Summary_CLOSED.md`](../tasks/Sprints/Sprint_0_—_Summary_CLOSED.md)
- **Sprint 1 — Bugfix Continuation & Admin Polish** (Tasks 91–102) — CLOSED, see [`sessions/2026-05-19-sprint-1-bugfix-continuation.md`](sessions/2026-05-19-sprint-1-bugfix-continuation.md)
- **Sprint 2 — Technical Debt Cleanup** (Task 107) — CLOSED, see [`tasks/Sprints/Sprint_2_—_Summary_CLOSED.md`](../tasks/Sprints/Sprint_2_—_Summary_CLOSED.md)
- **Sprint 3 — Primitive & Tailwind Debt Burn-down** (Tasks 109–111) — CLOSED, see [`tasks/Sprints/Sprint_3_—_Summary_CLOSED.md`](../tasks/Sprints/Sprint_3_—_Summary_CLOSED.md)
- **Sprint 4 — Auth Phone Validation & Flow Consolidation** (Tasks 158–159) — CLOSED, see [`tasks/Sprints/Sprint_4_—_Summary_CLOSED.md`](../tasks/Sprints/Sprint_4_—_Summary_CLOSED.md). ⚠️ Self-initiated by Sonnet outside the roadmap; **retroactively sanctioned 2026-05-21** after review (process exception — future runs require an approved kickoff before opening sprints/tasks or adding dependencies).
- **Listing Detail Performance / LCP Epic** (Tasks 72–83) — CLOSED, see Session Archive for per-task logs.
- **Post-Governance Debt Burn-down Sprint** (Tasks 64–71) — CLOSED.
- **Future Maintenance Direction Epic** (Tasks 58–63, Phases 1–6) — CLOSED.
- **Responsive / UI Governance Epic** (Tasks 51–57) — CLOSED.
- **Filter Architecture Stabilization** (Task 50.4) — CLOSED.

## Session Archive

| Date | Description | Tasks | File |
|------|-------------|-------|------|
| 2026-05-22 | Sprint 8 — Task 172 — schema-drift guard: check-schema-drift.mjs, schema-drift-check.sql (21 tables/204 cols), qa-rules doc | Task 172 | [sessions/2026-05-22-task-172-schema-drift-guard.md](sessions/2026-05-22-task-172-schema-drift-guard.md) |
| 2026-05-22 | Sprint 7 — Task 170 — `error_phone_invalid`+`error_phone_no_country_code` in `admin.user_profile.validation` × 4 locales | Task 170 | [sessions/2026-05-22-task-170-phone-validation-i18n.md](sessions/2026-05-22-task-170-phone-validation-i18n.md) |
| 2026-05-22 | Sprint 7 — Task 171 — Delete button hidden for non-admins in AdminEmailTemplatesManager; isAdmin prop from page | Task 171 | [sessions/2026-05-22-task-171-email-delete-admin-only-ui.md](sessions/2026-05-22-task-171-email-delete-admin-only-ui.md) |
| 2026-05-22 | Task 162 — E.5 ADR verification: ADR committed, clean working tree, no stray changes | Task 162 | [sessions/2026-05-22-task-162-e5-adr-verify.md](sessions/2026-05-22-task-162-e5-adr-verify.md) |
| 2026-05-22 | Task 161 — Email template delete admin-only: assertAdmin() + RLS matrix documented | Task 161 | [sessions/2026-05-22-task-161-email-template-delete-admin-only.md](sessions/2026-05-22-task-161-email-template-delete-admin-only.md) |
| 2026-05-22 | Task 160 — Block/suspension enforcement: getBlockedError helper, 7 actions, auto-lift, i18n | Task 160 | [sessions/2026-05-22-task-160-block-suspension-enforcement.md](sessions/2026-05-22-task-160-block-suspension-enforcement.md) |
| 2026-05-22 | Task 157 — Recovery security logging: IP+UA+correlationId; email hash; LOG_CORRELATION_SALT | Task 157 | [sessions/2026-05-22-task-157-recovery-security-logging.md](sessions/2026-05-22-task-157-recovery-security-logging.md) |
| 2026-05-22 | Epic L.2 — Dashboard built: 6 KPI cards, status bars, Epic K recent listings, pending reports panel | Task 155 | [sessions/2026-05-22-task-155-l2-dashboard-build.md](sessions/2026-05-22-task-155-l2-dashboard-build.md) |
| 2026-05-22 | Epic L.1 — Dashboard discovery: P0 metrics, wireframes, index plan; signed off 2026-05-22 | Task 154 | [sessions/2026-05-22-task-154-l1-dashboard-discovery.md](sessions/2026-05-22-task-154-l1-dashboard-discovery.md) |
| 2026-05-22 | Epic J.3 — Filter link: `?location_id=<id>` confirmed canonical; slug strategy documented; Epic J CLOSED | Task 153 | [sessions/2026-05-22-task-153-j3-filter-link.md](sessions/2026-05-22-task-153-j3-filter-link.md) |
| 2026-05-22 | Epic J.2 — Popular Locations SSR public section; Server Component; section hides when empty | Task 152 | [sessions/2026-05-22-task-152-j2-popular-locations-public.md](sessions/2026-05-22-task-152-j2-popular-locations-public.md) |
| 2026-05-22 | Epic J.1 — Popular locations admin CRUD (existing locations table, §11 pattern, photo upload, 4 locales) | Task 151 | [sessions/2026-05-22-task-151-j1-popular-locations-admin.md](sessions/2026-05-22-task-151-j1-popular-locations-admin.md) |
| 2026-05-22 | Epic I.3 — Helper API evolution trigger documented; Epic I CLOSED | Task 150 | [sessions/2026-05-22-task-150-i3-helper-api-evolution.md](sessions/2026-05-22-task-150-i3-helper-api-evolution.md) |
| 2026-05-22 | Epic I.2 — Status helpers: grep verified (domain complete); helpers table + evolution trigger in domain-rules.md | Task 149 | [sessions/2026-05-22-task-149-i2-status-helpers.md](sessions/2026-05-22-task-149-i2-status-helpers.md) |
| 2026-05-22 | Epic I.1 — "New" badge: hardcoded 7 → LISTING_NEW_DAYS; domain-rules.md rule added | Task 148 | [sessions/2026-05-22-task-148-i1-new-badge-fix.md](sessions/2026-05-22-task-148-i1-new-badge-fix.md) |
| 2026-05-22 | Epic H.7 — Company logo folder companies/<id>/; folder tree complete; Epic H CLOSED | Task 147 | [sessions/2026-05-22-task-147-h7-other-photos-folder.md](sessions/2026-05-22-task-147-h7-other-photos-folder.md) |
| 2026-05-22 | Epic H.5 — Listing image cleanup: orphan diff in updateListing + bulk cleanup in deleteListing | Task 146 | [sessions/2026-05-22-task-146-h5-listing-image-cleanup.md](sessions/2026-05-22-task-146-h5-listing-image-cleanup.md) |
| 2026-05-22 | Epic H.3 — Avatar cleanup: read old URL → upload → DB update → deleteAsset(old) | Task 145 | [sessions/2026-05-22-task-145-h3-avatar-replacement-cleanup.md](sessions/2026-05-22-task-145-h3-avatar-replacement-cleanup.md) |
| 2026-05-22 | Epic H.6 — deleteAsset safety wrapper: reference check, dry-run, structured log, 5 tests | Task 144 | [sessions/2026-05-22-task-144-h6-cloudinary-safety-audit.md](sessions/2026-05-22-task-144-h6-cloudinary-safety-audit.md) |
| 2026-05-22 | Epic H.4 — Listing image folder: uploadFolder prop chain; create=user/listings, edit=user/listings/id | Task 143 | [sessions/2026-05-22-task-143-h4-listing-image-folder.md](sessions/2026-05-22-task-143-h4-listing-image-folder.md) |
| 2026-05-22 | Epic H.2 — Avatar folder: `<user_id>/avatars/` in upload-avatar route | Task 142 | [sessions/2026-05-22-task-142-h2-avatar-folder.md](sessions/2026-05-22-task-142-h2-avatar-folder.md) |
| 2026-05-22 | Epic H.1 — Cloudinary folder infrastructure: shared uploadToCloudinary, publicIdFromUrl, folder tree docs | Task 141 | [sessions/2026-05-22-task-141-h1-cloudinary-folder-structure.md](sessions/2026-05-22-task-141-h1-cloudinary-folder-structure.md) |
| 2026-05-22 | Epic D — Task 166 — Seed email_templates: saved_search_alert + price_change_alert × 4 locales (SQL only) | Task 166 | [sessions/2026-05-22-task-166-seed-email-templates.md](sessions/2026-05-22-task-166-seed-email-templates.md) |
| 2026-05-22 | Epic G — Task 165 — RecentlyViewedGrid split + Storybook story + STORY_TARGETS for 7 breakpoints | Task 165 | [sessions/2026-05-22-task-165-recently-viewed-screenshots.md](sessions/2026-05-22-task-165-recently-viewed-screenshots.md) |
| 2026-05-22 | Epic G — Task 164 — correctness closure: showClear scope fix, DB migration confirmed, locale parity verified | Task 164 | [sessions/2026-05-22-task-164-epic-g-closure.md](sessions/2026-05-22-task-164-epic-g-closure.md) |
| 2026-05-22 | Epic G — Task 163 — P0 recovery: G.2 wiring committed, recentlyViewedQueries.ts staged, build restored | Task 163 | [sessions/2026-05-22-task-163-epic-g-recovery.md](sessions/2026-05-22-task-163-epic-g-recovery.md) |
| 2026-05-22 | Epic G.3 — Clear recently viewed history (clearRecentlyViewed action, ClearRecentlyViewedButton, Dialog+toast) | Task 140 | [sessions/2026-05-22-task-140-g3-clear-recently-viewed.md](sessions/2026-05-22-task-140-g3-clear-recently-viewed.md) |
| 2026-05-22 | Epic G.2 — Recently viewed UI block (RecentlyViewedSection, listing detail + profile, 4 locales) | Task 139 | [sessions/2026-05-22-task-139-g2-recently-viewed-ui.md](sessions/2026-05-22-task-139-g2-recently-viewed-ui.md) |
| 2026-05-22 | Epic G.1 — Track recently viewed listings (recently_viewed table+RLS+RPC, cookie for guests, RecentlyViewedTracker) | Task 138 | [sessions/2026-05-22-task-138-g1-recently-viewed-tracking.md](sessions/2026-05-22-task-138-g1-recently-viewed-tracking.md) |
| 2026-05-22 | Epic F.3 — Price-change notifications (cron, favorite_price_alerts, email+in-app, dedup) | Task 137 | [sessions/2026-05-22-task-137-f3-price-change-notifications.md](sessions/2026-05-22-task-137-f3-price-change-notifications.md) |
| 2026-05-22 | Epic F.2 — Favorites folders/collections (CollectionsSection, SaveToCollectionButton, DB schema, 20 i18n keys) | Task 136 | [sessions/2026-05-22-task-136-f2-favorites-collections.md](sessions/2026-05-22-task-136-f2-favorites-collections.md) |
| 2026-05-22 | Epic F.4 — Favorites API refactor (addFavorite/removeFavorite; toggleFavorite deleted) | Task 135 | [sessions/2026-05-22-task-135-f4-favorites-api-refactor.md](sessions/2026-05-22-task-135-f4-favorites-api-refactor.md) |
| 2026-05-22 | Epic F.1 — Favorites pagination 25/page (paginated query, loading skeleton, error state, 4 locales) | Task 134 | [sessions/2026-05-22-task-134-f1-favorites-pagination.md](sessions/2026-05-22-task-134-f1-favorites-pagination.md) |
| 2026-05-21 | Task 159 — Sprint 4 — Auth flow consolidation (AuthSheet canonical, legacy LoginForm/RegisterForm deleted) | Task 159 | [sessions/2026-05-21-task-159-auth-flow-consolidation.md](sessions/2026-05-21-task-159-auth-flow-consolidation.md) |
| 2026-05-21 | Task 158 — Sprint 4 — Country-aware phone validation (libphonenumber-js, shared PhoneField, 25 tests) | Task 158 | [sessions/2026-05-21-task-158-country-aware-phone-validation.md](sessions/2026-05-21-task-158-country-aware-phone-validation.md) |
| 2026-05-21 | Epic E.5 — URL-state vs server-state ADR (docs/state-authority.md) | Task 133 | [sessions/2026-05-21-task-133-e5-url-state-adr.md](sessions/2026-05-21-task-133-e5-url-state-adr.md) |
| 2026-05-21 | Epic E.4 — Saved-search match notifications (cron + frequency UI + email template) | Task 132 | [sessions/2026-05-21-task-132-e4-saved-search-notifications.md](sessions/2026-05-21-task-132-e4-saved-search-notifications.md) |
| 2026-05-21 | Epic E.1 — Horizontal filter bar (ListingsFilterBar on md+, sidebar removed) | Task 131 | [sessions/2026-05-21-task-131-e1-horizontal-filter-bar.md](sessions/2026-05-21-task-131-e1-horizontal-filter-bar.md) |
| 2026-05-21 | Epic K.4 — All remaining admin tables migrated to canonical pattern | Task 130 | [sessions/2026-05-21-task-130-k4-remaining-tables-canonical.md](sessions/2026-05-21-task-130-k4-remaining-tables-canonical.md) |
| 2026-05-21 | Epic K.3 — AdminUsersTable migrated to canonical pattern | Task 129 | [sessions/2026-05-21-task-129-k3-users-table-canonical.md](sessions/2026-05-21-task-129-k3-users-table-canonical.md) |
| 2026-05-21 | Epic K.2 — AdminListingsTable migrated to canonical pattern | Task 128 | [sessions/2026-05-21-task-128-k2-listings-table-canonical.md](sessions/2026-05-21-task-128-k2-listings-table-canonical.md) |
| 2026-05-21 | Epic K.1 — Canonical AdminTableRow pattern defined (docs/component-governance.md §11) | Task 127 | [sessions/2026-05-21-task-127-k1-admin-table-pattern.md](sessions/2026-05-21-task-127-k1-admin-table-pattern.md) |
| 2026-05-21 | Epic C.5 — Account blocking / suspension tools (suspended_until column, admin DatePicker) | Task 126 | [sessions/2026-05-21-task-126-account-blocking.md](sessions/2026-05-21-task-126-account-blocking.md) |
| 2026-05-21 | Epic C.4 — Reporter notification flow (ReporterNotificationEmail + in-app on status change) | Task 125 | [sessions/2026-05-21-task-125-reporter-notification.md](sessions/2026-05-21-task-125-reporter-notification.md) |
| 2026-05-21 | Epic D.5 — Inactivity emails (re-engagement send schedule + templates) | Task 124 | [sessions/2026-05-21-task-124-inactivity-emails.md](sessions/2026-05-21-task-124-inactivity-emails.md) |
| 2026-05-21 | Epic D.7 — Admin email template manager | Task 123 | [sessions/2026-05-21-task-123-admin-email-template-manager.md](sessions/2026-05-21-task-123-admin-email-template-manager.md) |
| 2026-05-21 | Epic D.6 — Supabase Send Email Hook (/api/auth-email-hook, MagicLinkEmail, ReauthEmail, HMAC-SHA256 sig verification) | Task 122 | [sessions/2026-05-21-task-122-supabase-email-hook.md](sessions/2026-05-21-task-122-supabase-email-hook.md) |
| 2026-05-21 | Epic D.4 — Password recovery (RecoveryEmail template, ForgotPasswordView, /auth/reset-password, security logging) | Task 121 | [sessions/2026-05-21-task-121-password-recovery.md](sessions/2026-05-21-task-121-password-recovery.md) |
| 2026-05-20 | Epic D.3 — Email verification (VerifyEmail template, /auth/verified page, admin email status badge) | Task 120 | [sessions/2026-05-20-task-120-email-verification.md](sessions/2026-05-20-task-120-email-verification.md) |
| 2026-05-20 | Epic D.1 — Email foundation (BaseEmail, send helper, preferred_locale, emailChange migration) | Task 119 | [sessions/2026-05-20-task-119-email-provider-setup.md](sessions/2026-05-20-task-119-email-provider-setup.md) |
| 2026-05-20 | Epic C.3 — Admin reports dashboard (/admin/reports CRUD + audit log) | Task 118 | [sessions/2026-05-20-task-118-c3-admin-reports-dashboard.md](sessions/2026-05-20-task-118-c3-admin-reports-dashboard.md) |
| 2026-05-20 | Epic C.2 — User report flow (ListingReportDialog, reportListingAction) | Task 117 | [sessions/2026-05-20-task-117-c2-user-report-flow.md](sessions/2026-05-20-task-117-c2-user-report-flow.md) |
| 2026-05-20 | Epic C.1 — Trust & safety research (protection stack decision) | Task 116 | [sessions/2026-05-20-task-116-c1-trust-safety-research.md](sessions/2026-05-20-task-116-c1-trust-safety-research.md) |
| 2026-05-20 | Epic B.5 — Admin company management (/admin/companies CRUD, sidebar nav, Dialog modals) | Task 115 | [sessions/2026-05-20-task-115-admin-company-management.md](sessions/2026-05-20-task-115-admin-company-management.md) |
| 2026-05-20 | Epic B.4 — Company logo upload (API route, client validation, blob preview, non-fatal upload) | Task 114 | [sessions/2026-05-20-task-114-company-logo-upload.md](sessions/2026-05-20-task-114-company-logo-upload.md) |
| 2026-05-20 | Epic B.3 — Agent company selection (companies table, CompanyField, service-role action, callback update) | Task 113 | [sessions/2026-05-20-task-113-agent-company-selection.md](sessions/2026-05-20-task-113-agent-company-selection.md) |
| 2026-05-20 | Epic B.2 — Agent city selection (LocationCombobox + portal in AuthSheet, 2 i18n keys × 4 locales) | Task 112 | [sessions/2026-05-20-task-112-agent-city-selection.md](sessions/2026-05-20-task-112-agent-city-selection.md) |
| 2026-05-20 | Sprint 3 — Task 111 — Tailwind entropy burn-down (M:15→M:0, L:43→L:31, baseline updated) | Task 111 | [sessions/2026-05-20-task-111-tailwind-entropy-burndown.md](sessions/2026-05-20-task-111-tailwind-entropy-burndown.md) |
| 2026-05-20 | Sprint 3 — Task 110 — Mobile drawer padding fix (px-4 added to Header.tsx drawer content wrapper) | Task 110 | [sessions/2026-05-20-task-110-mobile-drawer-padding.md](sessions/2026-05-20-task-110-mobile-drawer-padding.md) |
| 2026-05-20 | Sprint 3 — Task 109 — Primitive debt burn-down (H:87→H:57, governance gate PASS) | Task 109 | [sessions/2026-05-20-task-109-primitive-debt-burndown.md](sessions/2026-05-20-task-109-primitive-debt-burndown.md) |
| 2026-05-19 | Epic B.1 — Side popup auth (AuthSheet + error-code contract) | Task 108 | [sessions/2026-05-19-task-108-side-popup-auth.md](sessions/2026-05-19-task-108-side-popup-auth.md) |
| 2026-05-19 | Sprint 2 — Remove dead-code avatar server actions | Task 107 | [sessions/2026-05-19-task-107-remove-dead-avatar-actions.md](sessions/2026-05-19-task-107-remove-dead-avatar-actions.md) |
| 2026-05-19 | Epic A.4 — Mobile locale switcher promoted to header as Combobox | Task 106 | [sessions/2026-05-19-task-106-mobile-locale-switcher-header.md](sessions/2026-05-19-task-106-mobile-locale-switcher-header.md) |
| 2026-05-19 | Epic A.3 — Locale persistence site ↔ admin (middleware cookie sync) | Task 105 | [sessions/2026-05-19-task-105-locale-persistence-admin.md](sessions/2026-05-19-task-105-locale-persistence-admin.md) |
| 2026-05-19 | Epic A.2 — Language name + currency-code policy verification | Task 104 | [sessions/2026-05-19-task-104-language-names-currency-policy.md](sessions/2026-05-19-task-104-language-names-currency-policy.md) |
| 2026-05-19 | Epic A.1 — Full locale audit + API error contract implementation | Task 103 | [sessions/2026-05-19-task-103-locale-audit.md](sessions/2026-05-19-task-103-locale-audit.md) |
| 2026-05-19 | Sprint 1 — closure summary (12 tasks) | Sprint 1 | [sessions/2026-05-19-sprint-1-bugfix-continuation.md](sessions/2026-05-19-sprint-1-bugfix-continuation.md) |
| 2026-05-19 | Sprint 1 — Remove Google Translate and DeepL APIs | Task 102 | [sessions/2026-05-19-task-102-remove-translate-apis.md](sessions/2026-05-19-task-102-remove-translate-apis.md) |
| 2026-05-19 | Sprint 1 — Hide "Переглянути всі" when premium empty | Task 101 | [sessions/2026-05-19-task-101-hide-view-all-empty.md](sessions/2026-05-19-task-101-hide-view-all-empty.md) |
| 2026-05-19 | Sprint 1 — Admin User form save toast & dirty state | Task 100 | [sessions/2026-05-19-task-100-admin-save-toast-dirty.md](sessions/2026-05-19-task-100-admin-save-toast-dirty.md) |
| 2026-05-19 | Sprint 1 — Replace local Combobox with canonical | Task 99 | [sessions/2026-05-19-task-99-canonical-combobox.md](sessions/2026-05-19-task-99-canonical-combobox.md) |
| 2026-05-19 | Sprint 1 — Constrain Combobox scrollbar within bounds | Task 98 | [sessions/2026-05-19-task-98-combobox-scrollbar.md](sessions/2026-05-19-task-98-combobox-scrollbar.md) |
| 2026-05-19 | Sprint 1 — Fix "Тип" column translation in admin table | Task 97 | [sessions/2026-05-19-task-97-type-column-translation.md](sessions/2026-05-19-task-97-type-column-translation.md) |
| 2026-05-19 | Sprint 1 — Replace Premium empty state placeholder | Task 96 | [sessions/2026-05-19-task-96-premium-empty-state.md](sessions/2026-05-19-task-96-premium-empty-state.md) |
| 2026-05-19 | Sprint 1 — Active filter chip click target | Task 95 | [sessions/2026-05-19-task-95-filter-chip-click-target.md](sessions/2026-05-19-task-95-filter-chip-click-target.md) |
| 2026-05-19 | Sprint 1 — Full mobile spacing & auth UI audit | Task 94 | [sessions/2026-05-19-task-94-mobile-spacing-auth-ui-audit.md](sessions/2026-05-19-task-94-mobile-spacing-auth-ui-audit.md) |
| 2026-05-19 | Sprint 1 — Site-wide dropdown/popover clipping audit | Task 93 | [sessions/2026-05-19-task-93-dropdown-clipping-audit.md](sessions/2026-05-19-task-93-dropdown-clipping-audit.md) |
| 2026-05-19 | Sprint 1 — Language-name translations audit and fix | Task 92 | [sessions/2026-05-19-task-92-language-name-translations.md](sessions/2026-05-19-task-92-language-name-translations.md) |
| 2026-05-19 | Sprint 1 — Fix Italian locale fallback to Ukrainian | Task 91 | [sessions/2026-05-19-task-91-italian-locale-fallback-to-ukrainian.md](sessions/2026-05-19-task-91-italian-locale-fallback-to-ukrainian.md) |
| 2026-05-19 | Sprint 0 — Fix mobile spacing and auth buttons | Task 90 | [sessions/2026-05-19-task-90-mobile-spacing-and-auth-buttons.md](sessions/2026-05-19-task-90-mobile-spacing-and-auth-buttons.md) |
| 2026-05-19 | Sprint 0 — Fix dropdown clipping inconsistencies | Task 89 | [sessions/2026-05-19-task-89-dropdown-clipping-inconsistencies.md](sessions/2026-05-19-task-89-dropdown-clipping-inconsistencies.md) |
| 2026-05-19 | Sprint 0 — Fix guest favorite behavior | Task 88 | [sessions/2026-05-19-task-88-guest-favorite-behavior.md](sessions/2026-05-19-task-88-guest-favorite-behavior.md) |
| 2026-05-19 | Sprint 0 — Fix Ukrainian localization terminology | Task 87 | [sessions/2026-05-19-task-87-ukrainian-localization-terminology.md](sessions/2026-05-19-task-87-ukrainian-localization-terminology.md) |
| 2026-05-19 | Sprint 0 — Fix currency label translation issue | Task 86 | [sessions/2026-05-19-task-86-currency-label-translation-issue.md](sessions/2026-05-19-task-86-currency-label-translation-issue.md) |
| 2026-05-19 | Sprint 0 — Fix Italian localization fallback to Ukrainian | Task 85 | [sessions/2026-05-19-task-85-italian-localization-fallback-to-ukrainian.md](sessions/2026-05-19-task-85-italian-localization-fallback-to-ukrainian.md) |
| 2026-05-19 | Sprint 0 — Fix listing contact card for guest users | Task 84 | [sessions/2026-05-19-task-84-listing-contact-card-guest-owner-status.md](sessions/2026-05-19-task-84-listing-contact-card-guest-owner-status.md) |
| 2026-05-19 | Listing Detail Performance / LCP Epic — CLOSED (Speed Insights RES 100) | Task 83 | [sessions/2026-05-19-listing-detail-lcp-epic-closure-speed-insights.md](sessions/2026-05-19-listing-detail-lcp-epic-closure-speed-insights.md) |
| 2026-05-19 | LCP Epic Phase 11 — Speed Insights + PageSpeed Validation | Task 82 | [sessions/2026-05-19-listing-detail-lcp-speed-insights-pagespeed-validation.md](sessions/2026-05-19-listing-detail-lcp-speed-insights-pagespeed-validation.md) |
| 2026-05-19 | LCP Epic Phase 10 — Speed Insights + PageSpeed Workflow | Task 81 | [sessions/2026-05-19-listing-detail-lcp-vercel-speed-insights.md](sessions/2026-05-19-listing-detail-lcp-vercel-speed-insights.md) |
| 2026-05-19 | LCP Epic Phase 9 — HTTP Link Browser Usage | Task 80 | [sessions/2026-05-19-listing-detail-lcp-http-link-browser-usage.md](sessions/2026-05-19-listing-detail-lcp-http-link-browser-usage.md) |
| 2026-05-19 | LCP Epic Phase 8 — Production Diagnostics Reliability | Task 79 | [sessions/2026-05-19-listing-detail-lcp-production-diagnostics-reliability.md](sessions/2026-05-19-listing-detail-lcp-production-diagnostics-reliability.md) |
| 2026-05-19 | LCP Epic Phase 7 — Diagnostic Tooling Fix | Task 78 | [sessions/2026-05-19-listing-detail-lcp-diagnostic-tooling-fix.md](sessions/2026-05-19-listing-detail-lcp-diagnostic-tooling-fix.md) |
| 2026-05-19 | LCP Epic Phase 6 — Link Header Diagnostics | Task 77 | [sessions/2026-05-19-listing-detail-lcp-link-header-diagnostics.md](sessions/2026-05-19-listing-detail-lcp-link-header-diagnostics.md) |
| 2026-05-19 | LCP Epic Phase 5 — HTTP Link Header Preload | Task 76 | [sessions/2026-05-19-listing-detail-lcp-http-link-preload.md](sessions/2026-05-19-listing-detail-lcp-http-link-preload.md) |
| 2026-05-19 | LCP Epic Phase 4 — Production Validation | Task 75 | [sessions/2026-05-19-listing-detail-lcp-production-validation.md](sessions/2026-05-19-listing-detail-lcp-production-validation.md) |
| 2026-05-18 | LCP Epic Phase 3 — Lighthouse Trace Comparison | Task 74 | [sessions/2026-05-18-listing-detail-lcp-lighthouse-trace-comparison.md](sessions/2026-05-18-listing-detail-lcp-lighthouse-trace-comparison.md) |
| 2026-05-18 | LCP Epic Phase 2 — Fix Preload Reliability | Task 73 | [sessions/2026-05-18-listing-detail-lcp-preload-reliability.md](sessions/2026-05-18-listing-detail-lcp-preload-reliability.md) |
| 2026-05-18 | LCP Epic Phase 1 — Profiling Baseline | Task 72 | [sessions/2026-05-18-listing-detail-lcp-profile-baseline.md](sessions/2026-05-18-listing-detail-lcp-profile-baseline.md) |
| 2026-05-18 | Post-Governance Debt Burn-down Sprint — Closure | Task 71 | [sessions/2026-05-18-post-governance-debt-burndown-closure.md](sessions/2026-05-18-post-governance-debt-burndown-closure.md) |
| 2026-05-18 | Debt Burn-down Phase 7 — jsx-a11y Combobox ARIA | Task 70 | [sessions/2026-05-18-combobox-aria-a11y-fixes.md](sessions/2026-05-18-combobox-aria-a11y-fixes.md) |
| 2026-05-18 | Debt Burn-down Phase 6 — Raw img → AppImage Migration | Task 69 | [sessions/2026-05-18-raw-img-to-appimage-migration.md](sessions/2026-05-18-raw-img-to-appimage-migration.md) |
| 2026-05-18 | Debt Burn-down Phase 5 — ESLint Flat Config Override | Task 68 | [sessions/2026-05-18-eslint-no-restricted-syntax-governance-fix.md](sessions/2026-05-18-eslint-no-restricted-syntax-governance-fix.md) |
| 2026-05-18 | Debt Burn-down Phase 4 — Unused eslint-disable Directives | Task 67 | [sessions/2026-05-18-unused-eslint-disable-directives.md](sessions/2026-05-18-unused-eslint-disable-directives.md) |
| 2026-05-18 | Debt Burn-down Stabilization (Vercel fix + docs) | Tasks 66A+66B | [sessions/2026-05-18-vercel-vite-dependency-fix.md](sessions/2026-05-18-vercel-vite-dependency-fix.md) |
| 2026-05-18 | Debt Burn-down Phase 3 — Unused Vars Cleanup | Task 66 | [sessions/2026-05-18-eslint-unused-vars-cleanup.md](sessions/2026-05-18-eslint-unused-vars-cleanup.md) |
| 2026-05-18 | Debt Burn-down Phase 2 — ESLint False-Positive Fix | Task 65 | [sessions/2026-05-18-eslint-false-positive-fix.md](sessions/2026-05-18-eslint-false-positive-fix.md) |
| 2026-05-18 | Debt Burn-down Phase 1 — ESLint Debt Taxonomy | Task 64 | [sessions/2026-05-18-eslint-debt-taxonomy.md](sessions/2026-05-18-eslint-debt-taxonomy.md) |
| 2026-05-18 | Future Maintenance Direction Epic Phase 6 — Component Cataloging (EPIC COMPLETE) | Task 63 | [sessions/2026-05-18-component-cataloging.md](sessions/2026-05-18-component-cataloging.md) |
| 2026-05-18 | Future Maintenance Direction Epic Phase 5 — Responsive Screenshots | Task 62 | [sessions/2026-05-18-responsive-regression-screenshots.md](sessions/2026-05-18-responsive-regression-screenshots.md) |
| 2026-05-18 | Future Maintenance Direction Epic Phase 4 — Storybook Foundation | Task 61 | [sessions/2026-05-18-storybook-visual-snapshots.md](sessions/2026-05-18-storybook-visual-snapshots.md) |
| 2026-05-18 | Future Maintenance Direction Epic Phase 3 — Tailwind Entropy Detection | Task 60 | [sessions/2026-05-18-tailwind-utility-entropy-detection.md](sessions/2026-05-18-tailwind-utility-entropy-detection.md) |
| 2026-05-18 | Future Maintenance Direction Epic Phase 2 — CI Governance & Lint Enforcement | Task 59 | [sessions/2026-05-18-ci-governance-enforcement.md](sessions/2026-05-18-ci-governance-enforcement.md) |
| 2026-05-18 | Future Maintenance Direction Epic Phase 1 — Governance Enforcement | Task 58 | [sessions/2026-05-18-governance-enforcement-phase-1.md](sessions/2026-05-18-governance-enforcement-phase-1.md) |
| 2026-05-18 | Responsive / UI Governance Epic — всі 7 фаз | Tasks 51–57 | [sessions/2026-05-18-ui-governance-epic.md](sessions/2026-05-18-ui-governance-epic.md) |
| 2026-05-18 | Filter Architecture Stabilization + SSR/Navigation Hardening | Task 50.4 | [sessions/2026-05-18-task-50.4.md](sessions/2026-05-18-task-50.4.md) |
| 2026-05-17 | Notifications, Saved Searches, Currency, Property Types, Admin fixes, i18n | Tasks 17.1, 21–50.3 | [sessions/2026-05-17-tasks-17-50.md](sessions/2026-05-17-tasks-17-50.md) |
| 2026-05-16 | Admin panel, User Profile, Auth, Performance, Favorites, Listings | Tasks 12–20 + bootstrap | [sessions/2026-05-16-tasks-12-19.md](sessions/2026-05-16-tasks-12-19.md) |
