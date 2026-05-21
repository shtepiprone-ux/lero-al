# Project Backlog

> Lightweight index. Full per-task detail lives in `docs/sessions/`. Do **not** paste multi-line per-task blocks into this file — see "Backlog & Session Log Rules" in `docs/ai-behavior.md`. Target: ~80 lines of active content above the Session Archive table.

## Last Session

**2026-05-21 — Task 133 (E.5) — URL-state vs server-state ADR ✅**

- ADR-001 written in `docs/state-authority.md`: trade-off analysis of URL→SSR (a) vs React Query/SWR (b), clear recommendation to stay with (a), migration implications for (b) documented.
- Recommendation: continue URL-state model; revisit only if P75 latency >400ms on prod AND grid is a standalone segment.
- **Epic E — CLOSED.** All E sub-tasks (E.1/E.4/E.5) completed.

→ [Task 133 session log](sessions/2026-05-21-task-133-e5-url-state-adr.md)

## Pending Action Items

Manual/ops actions still required outside of code commits. Keep here until done, then move to the relevant session log.

- ⚠️ **DB migration (Task 126 — account suspension):** run in Supabase before relying on temporary suspension UI.
  ```sql
  ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ;
  ```
- ⚠️ **Supabase Auth config (Task 122 — Send Email Hook):** do **NOT** disable Supabase "Confirm email" until the Send Email Hook is verified live in production. Disabling earlier opens an auto-confirm security hole.

## Carry-over from Sprint 1 / Epic A

~~`governance:primitives` gate H:+30 debt~~ → **DONE** in Sprint 3 / Task 109. Gate now PASSES at C0/H57/M1.
~~Dead-code server actions~~ → **DONE** in Sprint 2 / Task 107.

## Next Immediate Tasks

**Last completed:** Task 133 (Epic E.5 — URL-state vs server-state ADR in `docs/state-authority.md`).

**Next:** Task 134 (F.1 — Favorites pagination, 25/page).

After F.1, continue in order: F.4 → F.2 → F.3, then Epic G → H → I → J → L. Numbered list below.

## Task roadmap — numbered

Active queue. Closed epics (B, C, D, E, K) and Sprints (0–4) live in **Closed sprints & epics**. Epic order fixed 2026-05-20: D → C → K → E → F → G → H → I → J → L. Numbers are global — never reused; if priorities change, renumber forward from the change point.

**Epic F — Favorites**
- **Task 134** — F.1 Favorites pagination (25/page).
- **Task 135** — F.4 API refactor (`addFavorite` / `removeFavorite`) — must land before F.2 / F.3.
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
- **Task 149** — I.2 Centralize status helpers (prepare for `ListingStateMachine`).
- **Task 150** — I.3 Helper API evolution — deferred trigger; document the condition.

**Epic J — Popular Locations Management** (needs H.7 for photos + K for admin CRUD)
- **Task 151** — J.1 Schema + admin CRUD for popular locations.
- **Task 152** — J.2 Render public "Popular Locations" section.
- **Task 153** — J.3 Auto-generated link-filter per location.

**Epic L — Admin Dashboard 2026** (needs C, D, K — all closed)
- **Task 154** — L.1 Discovery: pick KPIs + panels (sign-off).
- **Task 155** — L.2 Build the dashboard.
- **Task 156** — L.3 Interim: make legacy dashboard listings clickable (fold into L.2 if done together).

**Follow-ups / hardening**
- **Task 157** — Recovery security logging: forensic IP / user-agent + correlation id (D.4 follow-up from the 2026-05-21 Task 121 review). Kickoff: [`tasks/Epics/Epic_D_kickoff_prompt_Task_157.md`](../tasks/Epics/Epic_D_kickoff_prompt_Task_157.md). Builds on `src/modules/auth/actions/recovery.ts`.

Every task MUST follow the Canonical Task Template in `docs/ai-behavior.md` (Pre-read · Localization coverage · Responsive coverage · Acceptance criteria).

## Active product backlog (epics not yet started)

| Epic | Plan |
|---|---|
| Epic F — Favorites Improvements | [`tasks/Epics/Epic_F_Favorites_Improvements.md`](../tasks/Epics/Epic_F_Favorites_Improvements.md) · kickoffs: [`Epic_F_kickoff_prompts.md`](../tasks/Epics/Epic_F_kickoff_prompts.md) |
| Epic G — Recently Viewed Listings | [`tasks/Epics/Epic_G_Recently_Viewed_Listings.md`](../tasks/Epics/Epic_G_Recently_Viewed_Listings.md) |
| Epic H — Cloudinary Storage Hygiene | [`tasks/Epics/Epic_H_Cloudinary_Storage_Hygiene.md`](../tasks/Epics/Epic_H_Cloudinary_Storage_Hygiene.md) |
| Epic I — Listing Lifecycle & Status Rules | [`tasks/Epics/Epic_I_Listing_Lifecycle_and_Status_Rules.md`](../tasks/Epics/Epic_I_Listing_Lifecycle_and_Status_Rules.md) |
| Epic J — Popular Locations Management | [`tasks/Epics/Epic_J_Popular_Locations_Management.md`](../tasks/Epics/Epic_J_Popular_Locations_Management.md) |
| Epic L — Admin Dashboard 2026 | [`tasks/Epics/Epic_L_Admin_Dashboard_2026.md`](../tasks/Epics/Epic_L_Admin_Dashboard_2026.md) |

## Closed sprints & epics (historical)

- **Epic B — Auth, Registration & Agent Onboarding** (Tasks 108, 112–115) — CLOSED, see [`tasks/Epics/Epic_B_Summary_CLOSED.md`](../tasks/Epics/Epic_B_Summary_CLOSED.md)
- **Epic C — Trust, Safety & Moderation** (Tasks 116–118, 125–126) — CLOSED, see [`tasks/Epics/Epic_C_Summary_CLOSED.md`](../tasks/Epics/Epic_C_Summary_CLOSED.md)
- **Epic D — Email Infrastructure & Account Lifecycle** (Tasks 119–124) — CLOSED, see [`tasks/Epics/Epic_D_Summary_CLOSED.md`](../tasks/Epics/Epic_D_Summary_CLOSED.md)
- **Epic E — Search, Filters & Saved Search UX** (Tasks 131–133, plus E.2/E.3 from earlier) — CLOSED.
- **Epic K — Admin Tables Standardization** (Tasks 127–130) — CLOSED, canonical pattern in `docs/component-governance.md §11`.
- **Sprint 0 — Critical Bugfix / Regression Stabilization** (Tasks 84–90) — CLOSED, see [`tasks/Sprints/Sprint_0_—_Summary_CLOSED.md`](../tasks/Sprints/Sprint_0_—_Summary_CLOSED.md)
- **Sprint 1 — Bugfix Continuation & Admin Polish** (Tasks 91–102) — CLOSED, see [`sessions/2026-05-19-sprint-1-bugfix-continuation.md`](sessions/2026-05-19-sprint-1-bugfix-continuation.md)
- **Sprint 2 — Technical Debt Cleanup** (Task 107) — CLOSED, see [`tasks/Sprints/Sprint_2_—_Summary_CLOSED.md`](../tasks/Sprints/Sprint_2_—_Summary_CLOSED.md)
- **Sprint 3 — Primitive & Tailwind Debt Burn-down** (Tasks 109–111) — CLOSED, see [`tasks/Sprints/Sprint_3_—_Summary_CLOSED.md`](../tasks/Sprints/Sprint_3_—_Summary_CLOSED.md)
- **Sprint 4 — Auth Phone Validation & Flow Consolidation** (Tasks 158–159) — CLOSED, see [`tasks/Sprints/Sprint_4_—_Summary_CLOSED.md`](../tasks/Sprints/Sprint_4_—_Summary_CLOSED.md)
- **Listing Detail Performance / LCP Epic** (Tasks 72–83) — CLOSED, see Session Archive for per-task logs.
- **Post-Governance Debt Burn-down Sprint** (Tasks 64–71) — CLOSED.
- **Future Maintenance Direction Epic** (Tasks 58–63, Phases 1–6) — CLOSED.
- **Responsive / UI Governance Epic** (Tasks 51–57) — CLOSED.
- **Filter Architecture Stabilization** (Task 50.4) — CLOSED.

## Session Archive

| Date | Description | Tasks | File |
|------|-------------|-------|------|
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
