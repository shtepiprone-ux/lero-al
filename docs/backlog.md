# Project Backlog

> Lightweight index. Full per-task detail lives in `docs/sessions/`. Do **not** paste multi-line per-task blocks into this file — see "Backlog & Session Log Rules" in `docs/ai-behavior.md`. Target: ~80 lines of active content above the Session Archive table.

## Last Session

**2026-05-19 — Sprint 2 / Task 107 — Remove Dead-Code Avatar Actions ✅**

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

1. **`governance:primitives` H:+30 pre-existing debt.** Task 94 cleared the `h-11`-on-Button violations; broader High-tier primitive debt persists from before Sprint 1. To be addressed inside **Epic K** or as a standalone primitive-audit task.
2. ~~Dead-code server actions~~ → **DONE** in Sprint 2 / Task 107.

## Next Immediate Tasks

**Next: Sprint 2 — Technical Debt Cleanup (single task).**

Plan: [`tasks/Sprints/Sprint_2_—_Technical_Debt_Cleanup.md`](../tasks/Sprints/Sprint_2_—_Technical_Debt_Cleanup.md)

- **Task 107** — Remove dead-code avatar server actions (`uploadCabinetAvatar`, `uploadUserAvatar`). Kickoff prompt: [`tasks/Sprints/Sprint_2_kickoff_prompt_Task_107.md`](../tasks/Sprints/Sprint_2_kickoff_prompt_Task_107.md)

**After Sprint 2: Epic B — Auth, Registration & Agent Onboarding.**

Plan file: [`tasks/Epics/Epic_B_Auth_Registration_and_Agent_Onboarding.md`](../tasks/Epics/Epic_B_Auth_Registration_and_Agent_Onboarding.md)
Kickoff (Task 108): [`tasks/Epics/Epic_B_kickoff_prompt_Task_108.md`](../tasks/Epics/Epic_B_kickoff_prompt_Task_108.md)

Task queue (in order — global numbering continues from Task 106):

- **Task 107** — Sprint 2 cleanup (above).
- **Task 108** — Epic B.1 — Side popup login/register flow.
- **Task 109** — Epic B.2 — Agent city selection (canonical Combobox).
- **Task 110** — Epic B.3 — Agent company selection with logo display (new `companies` table + RLS).
- **Task 111** — Epic B.4 — Company logo upload rules (256×256, Cloudinary path per Epic H.7).
- **Task 112** — Epic B.5 — Admin company management page (Epic K table pattern).

Every task above MUST follow the Canonical Task Template in `docs/ai-behavior.md` (Pre-read · Localization coverage · Responsive coverage · Acceptance criteria).

## Active product backlog (epics not yet started)

| Epic | Plan |
|---|---|
| Epic B — Auth, Registration & Agent Onboarding | [`tasks/Epics/Epic_B_Auth_Registration_and_Agent_Onboarding.md`](../tasks/Epics/Epic_B_Auth_Registration_and_Agent_Onboarding.md) |
| Epic C — Trust, Safety & Moderation | [`tasks/Epics/Epic_C_Trust_Safety_and_Moderation.md`](../tasks/Epics/Epic_C_Trust_Safety_and_Moderation.md) |
| Epic D — Email Infrastructure & Account Lifecycle | [`tasks/Epics/Epic_D_Email_Infrastructure_and_Account_Lifecycle.md`](../tasks/Epics/Epic_D_Email_Infrastructure_and_Account_Lifecycle.md) |
| Epic E — Search, Filters & Saved Search UX | [`tasks/Epics/Epic_E_Search_Filters_and_Saved_Search.md`](../tasks/Epics/Epic_E_Search_Filters_and_Saved_Search.md) |
| Epic F — Favorites Improvements | [`tasks/Epics/Epic_F_Favorites_Improvements.md`](../tasks/Epics/Epic_F_Favorites_Improvements.md) |
| Epic G — Recently Viewed Listings | [`tasks/Epics/Epic_G_Recently_Viewed_Listings.md`](../tasks/Epics/Epic_G_Recently_Viewed_Listings.md) |
| Epic H — Cloudinary Storage Hygiene | [`tasks/Epics/Epic_H_Cloudinary_Storage_Hygiene.md`](../tasks/Epics/Epic_H_Cloudinary_Storage_Hygiene.md) |
| Epic I — Listing Lifecycle & Status Rules | [`tasks/Epics/Epic_I_Listing_Lifecycle_and_Status_Rules.md`](../tasks/Epics/Epic_I_Listing_Lifecycle_and_Status_Rules.md) |
| Epic J — Popular Locations Management | [`tasks/Epics/Epic_J_Popular_Locations_Management.md`](../tasks/Epics/Epic_J_Popular_Locations_Management.md) |
| Epic K — Admin Tables Standardization | [`tasks/Epics/Epic_K_Admin_Tables_Standardization.md`](../tasks/Epics/Epic_K_Admin_Tables_Standardization.md) |
| Epic L — Admin Dashboard 2026 | [`tasks/Epics/Epic_L_Admin_Dashboard_2026.md`](../tasks/Epics/Epic_L_Admin_Dashboard_2026.md) |

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
