# Project Backlog

> Lightweight index. Full per-task detail lives in `docs/sessions/`. Do **not** paste multi-line per-task blocks into this file — see "Backlog & Session Log Rules" in `docs/ai-behavior.md`. Target: ~80 lines of active content above the Session Archive table.

## Last Session

**2026-05-21 — Epic C CLOSED — Tasks 125–126 ✅**

- **Task 125** (C.4) — Reporter notification: `ReporterNotificationEmail.tsx` (4 locales, resolved/dismissed), `notifyReporter()` in reportListing.ts fires email + in-app on status change, `'report_outcome'` NotificationType + 🛡️ icon.
- **Task 126** (C.5) — Account blocking/suspension: `suspended_until` column (DB migration SQL below), `createListing` guard for blocked users, DatePicker in AdminUserProfile for temporary suspension expiry, status badge shows suspension date. `suspended_until` passed through `updateUserProfileFull`.

→ [Task 125 session log](sessions/2026-05-21-task-125-reporter-notification.md)
→ [Task 126 session log](sessions/2026-05-21-task-126-account-blocking.md)
→ [Epic C closure](../tasks/Epics/Epic_C_Summary_CLOSED.md)

⚠️ **Pending DB migration for Task 126:**
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ;
```

**2026-05-21 — Sprint 4 CLOSED — Tasks 158–159 ✅**

- **Task 158** — Country-aware phone validation: `src/lib/phone/index.ts` (COUNTRY_CODES+iso2, `validateNationalPhone()` via libphonenumber-js/min), `PhoneField.tsx` shared, 25 vitest tests. 4 consumers updated, dead Albania-only schema removed.
- **Task 159** — Auth flow consolidation: `AuthRedirect.tsx`, `/auth/login`+`/auth/register` as thin pages, `LoginForm`/`RegisterForm`/clients deleted, AuthSheet reads `sessionStorage['auth_redirect_next']` after login.

→ [Task 158 session log](sessions/2026-05-21-task-158-country-aware-phone-validation.md)
→ [Task 159 session log](sessions/2026-05-21-task-159-auth-flow-consolidation.md)
→ [Sprint 4 closure](../tasks/Sprints/Sprint_4_—_Summary_CLOSED.md)

**2026-05-21 — Epic D CLOSED — Tasks 119–124 ✅**

→ [Epic D closure](../tasks/Epics/Epic_D_Summary_CLOSED.md)

**2026-05-21 — Task 121 — Epic D.4 — Password / Login Recovery ✅**

- `RecoveryEmail.tsx` — React Email template on BaseEmail; inline STRINGS sq/en/uk/it; `getRecoveryEmailStrings()` exported for D.6 Hook.
- `requestPasswordReset` + `updatePassword` added to `src/lib/auth/browser.ts`.
- `ForgotPasswordView` added to `AuthSheet` (new view type `'forgot-password'`); "Forgot password?" link in LoginView password row.
- `ResetPasswordClient.tsx` — 4 states: loading / form / success / expired; client-side `getSession()` + `updatePassword()` + `signOut()`.
- `/[locale]/auth/reset-password` page added (server wrapper → `ResetPasswordClient`).
- Security logging via server actions: `logPasswordRecoveryRequest()` / `logPasswordRecoveryCompletion()` → Vercel console.
- **Neutral forgot-password response**: always same message regardless of email existence (no enumeration).
- 20 new auth i18n keys × 4 locales (976 × 4 balanced).
- ⚠️ NO double emails: Supabase still sends built-in recovery email until D.6 (Task 122). `RecoveryEmail` template is dormant until then.

→ [Task 121 session log](sessions/2026-05-21-task-121-password-recovery.md)

**2026-05-21 — Post-review hardening (Task 121 review) ✅**

- Governance gap fixed: `scan-tailwind.mjs` never checked raw Tailwind palette colors (e.g. `text-green-500`), so hardcoded colors silently passed `governance:tailwind`. Added **Rule T6** (raw palette colors) + promoted T3/T4 (hex / `bg-white`/`bg-black`) to **HIGH** — all hardcoded colors now BLOCK the gate. Storybook `*.stories` exempt from T6.
- `RegisterForm.tsx` `text-green-500` → `text-status-success` (last live violation). tailwind C0/H0/M0; full governance PASS.
- Queued **Task 157** (recovery security logging — forensic IP/UA); kickoff written.
- Docs: `docs/ui-rules.md` §13 (hardcoded-color enforcement table) + `scripts/governance/baseline.json` comment.

**Previous: 2026-05-20 — Task 120 — Epic D.3 — Email Verification ✅**

- `VerifyEmail.tsx` — React Email template on BaseEmail; inline STRINGS sq/en/uk/it; ready for D.6 Send Email Hook delivery.
- `BaseEmail.tsx` — fixed `lang` attr: now accepts `locale` prop instead of hardcoded `"sq"`.
- `/[locale]/auth/verified` — signup confirmation landing page (3 new auth i18n keys × 4 locales).
- Admin user profile shows email confirmation badge (`emailConfirmedAt` from `auth.admin.getUserById`).
- signUp `emailRedirectTo` updated to land on `/auth/verified` instead of home.
- ⚠️ NO double emails: Supabase still sends its built-in confirm until D.6 (Task 122). See session log.

→ [Task 120 session log](sessions/2026-05-20-task-120-email-verification.md)

**Previous: 2026-05-20 — Task 119 — Epic D.1 — Email Provider Setup + React Email Foundation ✅**

- `BaseEmail.tsx` — React Email layout matching approved design reference (coral strip, logo, content slot, footer).
- `send.ts` — single canonical send helper; one `new Resend(...)` instance; renders React → HTML; graceful no-key fallback.
- `resolveUserLocale(userId)` — fallback chain: `preferred_locale` → requestLocale → `sq`.
- `preferred_locale` column: migration SQL provided (Supabase dashboard); `setAdminLocale` + registration flows now write it.
- `emailChange.ts` migrated to use `sendEmail` helper; inline STRINGS unchanged.
- `@react-email/components` + `react-email` installed; `npm run email` preview script added.

→ [Task 119 session log](sessions/2026-05-20-task-119-email-provider-setup.md)

**Previous: 2026-05-20 — Task 118 — Epic C.3 — Admin Reports Dashboard ✅**

- `/admin/reports` page with status filter tabs + counts; `AdminReportsManager` table with `ReportDetailDialog`.
- `ReportDetailDialog`: shows reason/listing/reporter/comment, action buttons (review/resolve/dismiss) + notes.
- `updateReportStatusAction`: admin/mod auth guard, status UPDATE, `report_actions` audit INSERT.
- `Flag` icon + Reports nav item in group_management; mobile header title.
- 22 new `admin.reports.*` + sidebar/pages keys × 4 locales · M:18→M:17 (fixed 2 max-w-[200px]).
- ⚠️ Requires `report_actions` table SQL (in session log).

→ [Task 118 session log](sessions/2026-05-20-task-118-c3-admin-reports-dashboard.md)

**Previous: 2026-05-20 — Task 117 — Epic C.2 — User Report Flow ✅**

- `ListingReportDialog` — Dialog with 6-reason selector + optional 500-char comment; toast for success/already-reported/error.
- `reportListingAction` server action — auth guard, one-report-per-user-per-listing guard, INSERT into `listing_reports`.
- `ListingContact` — `canReport` prop added; report button rendered for authenticated non-owners.
- Listing page passes `canReport={!!authUser && authUser.id !== owner.id}`.
- Bonus: removed dead `CLOSED_LABEL` / `isFavoriteClosed` unused vars from listing page.
- 14 new `listing.report_*` i18n keys × 4 locales · lint 0/0 · governance PASS.
- ⚠️ Requires `listing_reports` table — SQL in Task 116 session log.

→ [Task 117 session log](sessions/2026-05-20-task-117-c2-user-report-flow.md)

**Previous: 2026-05-20 — Task 116 — Epic C.1 — Trust & Safety Research ✅**

- Protection stack decided: listing reports (C.2/C.3) + account blocking (C.5). User-to-user blocking, automated filtering, and LLM moderation all deferred.
- `ReportReason`, `ReportStatus`, `ListingReport`, `Conversation`, `Message` types confirm schema is pre-designed.
- `User.status = 'blocked'` + `block_reason` already scaffolded.
- Decision document and `docs/domain-rules.md` updated.

→ [Task 116 session log](sessions/2026-05-20-task-116-c1-trust-safety-research.md)

**Previous: 2026-05-20 — Task 115 — Epic B.5 — Admin Company Management ✅**

- `/admin/companies` page: list with logo/name/agent count/date, create/edit Dialog, delete confirmation Dialog.
- `AdminCompaniesManager`: optimistic local state, `AdminSearchInput` filter, `AppImage variant="avatar"` for Cloudinary logos.
- Companies nav item added to sidebar (Briefcase icon); mobile header title wired.
- `updateCompanyAction` + `deleteCompanyAction` server actions with admin/moderator auth guard.
- 20 new `admin.companies.*` keys + sidebar/pages keys × 4 locales.
- **Epic B fully closed (Tasks 108, 112–115).**

→ [Task 115 session log](sessions/2026-05-20-task-115-admin-company-management.md)

**Previous: 2026-05-20 — Task 114 — Epic B.4 — Company Logo Upload ✅**

- `/api/upload-company-logo` route: service-role, MIME/size/dimension validation, Cloudinary `companies/` folder, updates `companies.logo_url`.
- `CompanyField` extended: file picker, blob preview (`new Image()` for dimension check), non-fatal upload after company creation.
- 7 new i18n keys (5 in `auth`, 2 `choose_file`/`replace` in `common`) × 4 locales.
- lint 0/0 · governance:localization PASS.

→ [Task 114 session log](sessions/2026-05-20-task-114-company-logo-upload.md)

**Previous: 2026-05-20 — Task 113 — Epic B.3 — Agent Company Selection ✅ (DB migration required)**

- New `companies` table + `company_id` FK on `users` (SQL in session log — must run before deploy).
- New module `src/modules/companies/`: `getCompanies()`, `createCompanyAction()` (service-role), `useCompanies` hook.
- `CompanyField` sub-component in AuthSheet: searchable `Combobox` + inline "Add new company" form.
- `company_id` passed via signUp metadata → applied in `/auth/callback` `ensureUserProfile()`.
- 2 new i18n keys (`auth.company_select_placeholder`, `auth.company_add_new`) × 4 locales.
- governance:localization PASS · governance:primitives PASS · lint 0/0.

→ [Task 113 session log](sessions/2026-05-20-task-113-agent-company-selection.md) ← contains the required SQL migration

**Previous: 2026-05-20 — Task 112 — Epic B.2 — Agent City Selection ✅**

- `AgentCityField` sub-component wraps `useLocations` + `LocationCombobox` (canonical, `portal={true}` to avoid Sheet clipping).
- Added `locationId` state to `RegisterView`; city passed via `signUp` metadata as `location_id` integer.
- 2 new i18n keys (`auth.city`, `auth.city_placeholder`) × 4 locales; key counts 870 → 872 per locale.
- governance:localization PASS · governance:primitives PASS · lint 0/0.

→ [Task 112 session log](sessions/2026-05-20-task-112-agent-city-selection.md)

**Previous: 2026-05-20 — Task 111 — Sprint 3 — Tailwind Entropy Burn-down ✅**

- `governance:tailwind`: M:15→M:0 / L:43→L:31 (**PASS** at new baseline C0/H0/M0/L31).
- 5× `py-10` → `py-8` (table empty states); 10× `bg-black/*` → `bg-overlay/*` (semantic token); 12× `text-[11px]` → `text-xs`.
- 31 allowlist entries added for canonical `text-[10px]` badge/micro-label uses.
- Governance baseline updated: `tailwind.MEDIUM` 14→0, `tailwind.LOW` 42→31.
- lint 0/0 · governance:localization PASS (870 × 4).
- **Sprint 3 CLOSED.** Closure: [`tasks/Sprints/Sprint_3_—_Summary_CLOSED.md`](../tasks/Sprints/Sprint_3_—_Summary_CLOSED.md)

→ [Task 111 session log](sessions/2026-05-20-task-111-tailwind-entropy-burndown.md)

**Previous: 2026-05-20 — Task 110 — Sprint 3 — Mobile Drawer Padding Fix ✅**

- Added `px-4` to the mobile hamburger drawer content wrapper in `Header.tsx:225`.
- Matches canonical `SheetHeader`/`SheetFooter` padding (`p-4`); whole drawer now reads as one consistently padded panel.
- Both authenticated and unauthenticated drawer states covered by the single wrapper fix.
- Mobile locale switcher (Task 106) is in the header bar — not inside the drawer — unaffected.
- governance:tailwind PASS · governance:responsive PASS · lint 0/0.

→ [Task 110 session log](sessions/2026-05-20-task-110-mobile-drawer-padding.md)

**Previous: 2026-05-20 — Task 109 — Sprint 3 — Primitive Debt Burn-down ✅**

- Closed H:+30 governance regression: `governance:primitives` now C0/H57/M1 vs baseline C0/H57/M8 → **PASS**.
- 30 raw `<button>` + 1 custom `fixed inset-0` overlay migrated to canonical `Button`/`Dialog` across 18 files.
- Key clusters: NotificationBell, NotificationCenter, AdminMobileHeader, ListingsStatusTabs, ListingsFilters (AccordionSection), EnumSelectorField, RoomsSelectorField, StepBasicInfo (3×), StepDetails (2×), ListingGallery (6×), SaveSearchButton → Dialog, plus 7 additional listings/cabinet files.
- AuthSheet inline text-link buttons (~127, ~267): not flagged by scanner (multi-line format); documented as leave-as-is.
- governance:localization PASS (870 × 4 unchanged) · lint 0/0.

→ [Task 109 session log](sessions/2026-05-20-task-109-primitive-debt-burndown.md)

**Previous: 2026-05-19 — Task 108 — Epic B.1 — Side Popup Auth Flow ✅**

- `AuthSheet` (new) — canonical `Sheet` with Login / Register / Register-agent views; internal view switching without closing.
- Error-code contract: `mapAuthError()` maps Supabase errors → stable i18n keys; zero hardcoded strings.
- Header: Link auth buttons → Button Sheet triggers; mobile drawer adds "Register as agent" as third entry point.
- 8 new i18n keys × 4 locales (auth errors + `register_agent`); key counts 862 → 870.
- lint 0/5 · governance:localization PASS (870 × 4).

→ [Task 108 session log](sessions/2026-05-19-task-108-side-popup-auth.md)

**Previous: Sprint 2 / Task 107 — Remove Dead-Code Avatar Actions ✅**

- `uploadCabinetAvatar` (cabinet/actions) and `uploadUserAvatar` (admin/actions) deleted — zero callers confirmed.
- Companion helpers removed: local `uploadToCloudinary` in both files; `createHash` import in admin/actions.
- `/api/upload-avatar` route untouched — canonical upload path preserved.
- lint 0/5 · typecheck 4 pre-existing · governance:localization PASS (862 keys × 4 locales).

→ [Task 107 session log](sessions/2026-05-19-task-107-remove-dead-avatar-actions.md) · [Sprint 2 closure](../tasks/Sprints/Sprint_2_—_Summary_CLOSED.md)

**Previous: Task 106 — Epic A.4 — Mobile Locale Switcher to Header ✅**

- Canonical `Combobox` (`variant="button"`, `size="default"` = 44px touch target, `portal`) added to header with `sm:hidden`.
- Trigger shows compact `🇦🇱 SQ`; dropdown shows full localized language name as `description`.
- Duplicate locale button grid removed from hamburger drawer.
- Desktop `LocaleSwitcher` (`hidden sm:flex`) unchanged — zero regressions.
- lint: 0 errors / 5 pre-existing warnings · governance:localization PASS.

→ [Task 106 session log](sessions/2026-05-19-task-106-mobile-locale-switcher-header.md)

**Previous: Task 105 — Epic A.3 — Locale Persistence Site ↔ Admin ✅**

- Root cause: `admin-locale` cookie only set on explicit locale-switcher click, not on direct URL navigation.
- Fix: middleware now syncs `admin-locale` from the URL locale on every public-site request (only when changed).
- Fixes race condition where `setAdminLocale` server action response could lag behind `router.push`.
- Cookie hardened: `httpOnly: false` → `httpOnly: true` (server-only read, no JS exposure needed).
- All 4 locales validated via code-level scenario analysis; SSR-safe (cookie read before render).
- lint: 0 errors / 5 pre-existing warnings.

→ [Task 105 session log](sessions/2026-05-19-task-105-locale-persistence-admin.md)

**Previous: Task 104 — Epic A.2 — Language Names + Currency-Code Policy ✅**

- All language names confirmed canonical in all 4 locale files (Shqip/Albanian/Албанська/Albanese etc.) — no changes needed.
- Currency code policy verified: zero `t(currencyCode)` patterns anywhere; all codes are literal strings.
- LocaleSwitcher verified at all 7 breakpoints (mobile drawer 320–639px, dropdown 640px+).
- Policy formalized: added 3 rules to `docs/ai-behavior.md` § Localization (i18n) Rules.
- lint: 0 errors / 5 pre-existing warnings.

→ [Task 104 session log](sessions/2026-05-19-task-104-language-names-currency-policy.md)

**Previous session: Task 103 — Epic A.1 — Full Locale Audit ✅**

- Locale key audit: all 4 files balanced at 862 keys each (governance:localization confirms).
- Zero mixed-language value violations found.
- Zero currency codes wrapped in `t()`.
- Sprint 1 carry-over resolved: all Ukrainian hardcoded error strings in API routes and server actions replaced with stable English error codes (`no_file`, `invalid_type`, `file_too_large`, etc.).
- API error contract: **option (b) — server returns error code, client resolves via `t()`** — implemented end-to-end for `/api/upload-avatar`.
- Two client-side display bugs fixed in `AdminUserProfile.tsx`: create-mode avatar toast + delete-action error display now use localized messages.
- lint: 0 errors / 5 pre-existing warnings · governance:localization PASS (C0/H0/M18 at baseline).

→ [Task 103 session log](sessions/2026-05-19-task-103-locale-audit.md)

## Carry-over from Sprint 1 / Epic A

~~`governance:primitives` gate H:+30 debt~~ → **DONE** in Sprint 3 / Task 109. Gate now PASSES at C0/H57/M1.
~~Dead-code server actions~~ → **DONE** in Sprint 2 / Task 107.

## Next Immediate Tasks

**Last completed: Task 127 (Epic K.1 — canonical AdminTableRow pattern defined in docs/component-governance.md §11).**

**Next:** Task 128 (Epic K.2 — migrate AdminListingsTable)

**Recently CLOSED:**
- ✅ **Epic C** — Tasks 116–118, 125–126. [closure](../tasks/Epics/Epic_C_Summary_CLOSED.md)
- ✅ **Epic D** — Tasks 119–124. [closure](../tasks/Epics/Epic_D_Summary_CLOSED.md)
- ✅ **Sprint 4** — Tasks 158–159. [closure](../tasks/Sprints/Sprint_4_—_Summary_CLOSED.md)
- ✅ **Epic B** — Tasks 108, 112–115. [summary](../tasks/Epics/Epic_B_Summary_CLOSED.md)

**Epic K — Admin Tables Standardization** ← CURRENT EPIC

- ✅ **Task 127** — K.1 Pattern defined in docs/component-governance.md §11. [log](sessions/2026-05-21-task-127-k1-admin-table-pattern.md)
- ✅ **Task 128** — K.2 AdminListingsTable migrated. [log](sessions/2026-05-21-task-128-k2-listings-table-canonical.md)
- ✅ **Task 129** — K.3 AdminUsersTable migrated. [log](sessions/2026-05-21-task-129-k3-users-table-canonical.md)
- ✅ **Task 130** — K.4 All remaining tables migrated. [log](sessions/2026-05-21-task-130-k4-remaining-tables-canonical.md)

**Epic K — CLOSED.** All admin tables follow K.1 canonical pattern (docs/component-governance.md §11).

**Epic E — Search, Filters & Saved Search** ← CURRENT EPIC
- ✅ **Task 131** (E.1) — Horizontal filter bar: `ListingsFilterBar` on md+, sidebar removed. [log](sessions/2026-05-21-task-131-e1-horizontal-filter-bar.md)
- **Task 132** (E.4) — Saved-search match notifications (D.2 ✅). ← NEXT
- **Task 133** (E.5) — URL-state vs server-state ADR (doc only).

**Epic F — Favorites**
- Tasks 134–137 (F.1, F.4, F.2, F.3 — F.3 needs D.2 ✅).

**Epics G–L** — see task roadmap below.

## Task roadmap — numbered (epic order fixed 2026-05-20: D → C → K → E → F → G → H → I → J → L)

Global numbering is now assigned to all remaining tasks. Dependencies noted. Kickoffs: Epic D has per-task files; E/F have `Epic_E_kickoff_prompts.md` / `Epic_F_kickoff_prompts.md`; other epics use their plan file in `tasks/Epics/` (write a kickoff when its turn comes).

**Epic C — Trust & Safety (finish)**
- **Task 125** — C.4 Reporter notification flow (email + in-app on report resolution). Needs D.4 (recovery template path) + D.2.
- **Task 126** — C.5 Account blocking / suspension tools (no email dep).

**Epic K — Admin Tables Standardization**
- **Task 127** — K.1 Define canonical AdminTableRow pattern (clickable title → preview dialog, remove duplicate actions).
- **Task 128** — K.2 Migrate Listings admin table to the pattern.
- **Task 129** — K.3 Migrate Users admin table (remove actions duplication).
- **Task 130** — K.4 Audit + migrate all other admin tables (companies, reports, locations…).

**Epic E — Search, Filters & Saved Search** (E.2/E.3 already done)
- **Task 131** — E.1 Horizontal filter bar redesign.
- **Task 132** — E.4 Saved-search match notifications (needs D.2).
- **Task 133** — E.5 URL-state vs server-state decision (doc only).

**Epic F — Favorites**
- **Task 134** — F.1 Favorites pagination (25/page).
- **Task 135** — F.4 API refactor (addFavorite/removeFavorite) — before F.2/F.3.
- **Task 136** — F.2 Folders / collections.
- **Task 137** — F.3 Price-change notifications (needs D.2).

**Epic G — Recently Viewed Listings**
- **Task 138** — G.1 Track recently viewed (server for auth, cookie/local for guests).
- **Task 139** — G.2 Recently-viewed UI block.
- **Task 140** — G.3 Clear history.

**Epic H — Cloudinary Storage Hygiene** (H.6 safety audit before any cleanup)
- **Task 141** — H.1 User-based folder structure.
- **Task 142** — H.2 Avatar folder structure.
- **Task 143** — H.4 Listing image folder structure.
- **Task 144** — H.6 Safety audit / dry-run (blocks cleanup tasks).
- **Task 145** — H.3 Avatar replacement cleanup.
- **Task 146** — H.5 Listing image replacement cleanup.
- **Task 147** — H.7 Other photos (company logos, marketing) folder structure.

**Epic I — Listing Lifecycle & Status Rules**
- **Task 148** — I.1 Fix "New" badge logic (created_at only).
- **Task 149** — I.2 Centralize status helpers (prepare for ListingStateMachine).
- **Task 150** — I.3 Helper API evolution — deferred trigger; doc the condition.

**Epic J — Popular Locations Management** (needs H.7 for photos + K for admin CRUD)
- **Task 151** — J.1 Schema + admin CRUD for popular locations.
- **Task 152** — J.2 Render public "Popular Locations" section.
- **Task 153** — J.3 Auto-generated link-filter per location.

**Epic L — Admin Dashboard 2026** (needs C, D, K)
- **Task 154** — L.1 Discovery: pick KPIs + panels (sign-off).
- **Task 155** — L.2 Build the dashboard.
- **Task 156** — L.3 Interim: make legacy dashboard listings clickable (fold into L.2 if done together).

**Follow-ups / hardening (post-review)**
- **Task 157** — Recovery security logging: forensic IP / user-agent + correlation id (D.4 follow-up from the 2026-05-21 Task 121 review). Kickoff: [`tasks/Epics/Epic_D_kickoff_prompt_Task_157.md`](../tasks/Epics/Epic_D_kickoff_prompt_Task_157.md). Builds on `src/modules/auth/actions/recovery.ts`.

**Sprint 4 — Auth phone validation & flow consolidation** (from the 2026-05-21 phone-validation audit; run 158 → 159)
- **Task 158** — Country-aware phone validation as a single shared source of truth for ALL phone/whatsapp inputs (AuthSheet, RegisterForm, AdminUserCreate, AdminUserProfile, ProfileTab). Adds `libphonenumber-js`; removes 4× duplicated `COUNTRY_CODES`/`parsePhone` + the dead Albania-only `registerSchema` regex. Kickoff: [`tasks/Sprints/Sprint_4_kickoff_prompt_Task_158.md`](../tasks/Sprints/Sprint_4_kickoff_prompt_Task_158.md).
- **Task 159** — Consolidate the two parallel auth flows into one (AuthSheet = canonical); convert `/auth/login` + `/auth/register` to drawer triggers, delete legacy `LoginForm`/`RegisterForm`, fix homepage agent CTA. Kickoff: [`tasks/Sprints/Sprint_4_kickoff_prompt_Task_159.md`](../tasks/Sprints/Sprint_4_kickoff_prompt_Task_159.md). Sprint record: [`tasks/Sprints/Sprint_4_—_Auth_Phone_Validation_and_Flow_Consolidation.md`](../tasks/Sprints/Sprint_4_—_Auth_Phone_Validation_and_Flow_Consolidation.md).

> ⚠️ Do NOT disable Supabase "Confirm email" before the Send Email Hook (Task 122) is live — auto-confirm security hole.
> Numbers reflect the agreed order; if priorities change, renumber from the point of change forward (don't reuse numbers).

Every task MUST follow the Canonical Task Template in `docs/ai-behavior.md` (Pre-read · Localization coverage · Responsive coverage · Acceptance criteria).

> ⚠️ **Incident note (2026-05-20, resolved):** a working-tree corruption truncated ~13 files (AuthSheet 347/600 lines, locales −85 keys, etc.) after Task 118. Recovered via `git restore` to HEAD (Task 118); all committed work was safe on `origin/main`. Task 119 was subsequently (re)done as Epic D.1 and is now committed/pushed (`40c0371c7`).

## Active product backlog (epics not yet started)

| Epic | Plan |
|---|---|
| Epic B — Auth, Registration & Agent Onboarding | [`tasks/Epics/Epic_B_Auth_Registration_and_Agent_Onboarding.md`](../tasks/Epics/Epic_B_Auth_Registration_and_Agent_Onboarding.md) |
| Epic C — Trust, Safety & Moderation | [`tasks/Epics/Epic_C_Trust_Safety_and_Moderation.md`](../tasks/Epics/Epic_C_Trust_Safety_and_Moderation.md) |
| Epic D — Email Infrastructure & Account Lifecycle | [`tasks/Epics/Epic_D_Email_Infrastructure_and_Account_Lifecycle.md`](../tasks/Epics/Epic_D_Email_Infrastructure_and_Account_Lifecycle.md) |
| Epic E — Search, Filters & Saved Search UX — PARTIAL (E.2/E.3 done; E.1/E.4/E.5 remain) | plan: [`Epic_E…md`](../tasks/Epics/Epic_E_Search_Filters_and_Saved_Search.md) · kickoffs: [`Epic_E_kickoff_prompts.md`](../tasks/Epics/Epic_E_kickoff_prompts.md) |
| Epic F — Favorites Improvements — all 4 sub-tasks remain (baseline favorites exist) | plan: [`Epic_F…md`](../tasks/Epics/Epic_F_Favorites_Improvements.md) · kickoffs: [`Epic_F_kickoff_prompts.md`](../tasks/Epics/Epic_F_kickoff_prompts.md) |
| Epic G — Recently Viewed Listings | [`tasks/Epics/Epic_G_Recently_Viewed_Listings.md`](../tasks/Epics/Epic_G_Recently_Viewed_Listings.md) |
| Epic H — Cloudinary Storage Hygiene | [`tasks/Epics/Epic_H_Cloudinary_Storage_Hygiene.md`](../tasks/Epics/Epic_H_Cloudinary_Storage_Hygiene.md) |
| Epic I — Listing Lifecycle & Status Rules | [`tasks/Epics/Epic_I_Listing_Lifecycle_and_Status_Rules.md`](../tasks/Epics/Epic_I_Listing_Lifecycle_and_Status_Rules.md) |
| Epic J — Popular Locations Management | [`tasks/Epics/Epic_J_Popular_Locations_Management.md`](../tasks/Epics/Epic_J_Popular_Locations_Management.md) |
| Epic K — Admin Tables Standardization | [`tasks/Epics/Epic_K_Admin_Tables_Standardization.md`](../tasks/Epics/Epic_K_Admin_Tables_Standardization.md) |
| Epic L — Admin Dashboard 2026 | [`tasks/Epics/Epic_L_Admin_Dashboard_2026.md`](../tasks/Epics/Epic_L_Admin_Dashboard_2026.md) |

| 2026-05-20 | Epic B.5 — Admin company management (/admin/companies CRUD, sidebar nav, Dialog modals) | Task 115 | [sessions/2026-05-20-task-115-admin-company-management.md](sessions/2026-05-20-task-115-admin-company-management.md) |
| 2026-05-20 | Epic B.4 — Company logo upload (API route, client validation, blob preview, non-fatal upload) | Task 114 | [sessions/2026-05-20-task-114-company-logo-upload.md](sessions/2026-05-20-task-114-company-logo-upload.md) |
| 2026-05-20 | Epic B.3 — Agent company selection (companies table, CompanyField, service-role action, callback update) | Task 113 | [sessions/2026-05-20-task-113-agent-company-selection.md](sessions/2026-05-20-task-113-agent-company-selection.md) |
| 2026-05-20 | Epic B.2 — Agent city selection (LocationCombobox + portal in AuthSheet, 2 i18n keys × 4 locales) | Task 112 | [sessions/2026-05-20-task-112-agent-city-selection.md](sessions/2026-05-20-task-112-agent-city-selection.md) |
| 2026-05-20 | Sprint 3 — Task 111 — Tailwind entropy burn-down (M:15→M:0, L:43→L:31, baseline updated) | Task 111 | [sessions/2026-05-20-task-111-tailwind-entropy-burndown.md](sessions/2026-05-20-task-111-tailwind-entropy-burndown.md) |
| 2026-05-20 | Sprint 3 — Task 110 — Mobile drawer padding fix (px-4 added to Header.tsx drawer content wrapper) | Task 110 | [sessions/2026-05-20-task-110-mobile-drawer-padding.md](sessions/2026-05-20-task-110-mobile-drawer-padding.md) |
| 2026-05-20 | Sprint 3 — Task 109 — Primitive debt burn-down (H:87→H:57, governance gate PASS) | Task 109 | [sessions/2026-05-20-task-109-primitive-debt-burndown.md](sessions/2026-05-20-task-109-primitive-debt-burndown.md) |
| 2026-05-19 | Sprint 2 — Remove dead-code avatar server actions | Task 107 | [sessions/2026-05-19-task-107-remove-dead-avatar-actions.md](sessions/2026-05-19-task-107-remove-dead-avatar-actions.md) |

## Closed sprints & epics (historical)

- **Sprint 0 — Critical Bugfix / Regression Stabilization** (Tasks 84–90) — CLOSED, see [`tasks/Sprints/Sprint_0_—_Summary_CLOSED.md`](../tasks/Sprints/Sprint_0_—_Summary_CLOSED.md)
- **Sprint 2 — Technical Debt Cleanup** (Task 107) — CLOSED, see [`tasks/Sprints/Sprint_2_—_Summary_CLOSED.md`](../tasks/Sprints/Sprint_2_—_Summary_CLOSED.md)
- **Sprint 1 — Bugfix Continuation & Admin Polish** (Tasks 91–102) — CLOSED, see closure summary linked above.
- **Listing Detail Performance / LCP Epic** (Tasks 72–83) — CLOSED, see Session Archive for per-task logs.
- **Post-Governance Debt Burn-down Sprint** (Tasks 64–71) — COMPLETE.
- **Future Maintenance Direction Epic** (Tasks 58–63, Phases 1–6) — COMPLETE.
- **Responsive / UI Governance Epic** (Tasks 51–57) — COMPLETE.
- **Filter Architecture Stabilization** (Task 50.4) — COMPLETE.

## Session Archive

| Date | Description | Tasks | File |
|------|-------------|-------|------|
| 2026-05-21 | Epic D.6 — Supabase Send Email Hook (/api/auth-email-hook, MagicLinkEmail, ReauthEmail, HMAC-SHA256 sig verification) | Task 122 | [sessions/2026-05-21-task-122-supabase-email-hook.md](sessions/2026-05-21-task-122-supabase-email-hook.md) |
| 2026-05-21 | Epic D.4 — Password recovery (RecoveryEmail template, ForgotPasswordView, /auth/reset-password, security logging) | Task 121 | [sessions/2026-05-21-task-121-password-recovery.md](sessions/2026-05-21-task-121-password-recovery.md) |
| 2026-05-20 | Epic D.3 — Email verification (VerifyEmail template, /auth/verified page, admin email status badge) | Task 120 | [sessions/2026-05-20-task-120-email-verification.md](sessions/2026-05-20-task-120-email-verification.md) |
| 2026-05-20 | Epic D.1 — Email foundation (BaseEmail, send helper, preferred_locale, emailChange migration) | Task 119 | [sessions/2026-05-20-task-119-email-provider-setup.md](sessions/2026-05-20-task-119-email-provider-setup.md) |
| 2026-05-20 | Epic C.3 — Admin reports dashboard (/admin/reports CRUD + audit log) | Task 118 | [sessions/2026-05-20-task-118-c3-admin-reports-dashboard.md](sessions/2026-05-20-task-118-c3-admin-reports-dashboard.md) |
| 2026-05-20 | Epic C.2 — User report flow (ListingReportDialog, reportListingAction) | Task 117 | [sessions/2026-05-20-task-117-c2-user-report-flow.md](sessions/2026-05-20-task-117-c2-user-report-flow.md) |
| 2026-05-20 | Epic C.1 — Trust & safety research (protection stack decision) | Task 116 | [sessions/2026-05-20-task-116-c1-trust-safety-research.md](sessions/2026-05-20-task-116-c1-trust-safety-research.md) |
| 2026-05-20 | Epic B.5 — Admin company management (/admin/companies CRUD, sidebar nav, Dialog modals) | Task 115 | [sessions/2026-05-20-task-115-admin-company-management.md](sessions/2026-05-20-task-115-admin-company-management.md) |
| 2026-05-19 | Epic B.1 — Side popup auth (AuthSheet + error-code contract) | Task 108 | [sessions/2026-05-19-task-108-side-popup-auth.md](sessions/2026-05-19-task-108-side-popup-auth.md) |
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
