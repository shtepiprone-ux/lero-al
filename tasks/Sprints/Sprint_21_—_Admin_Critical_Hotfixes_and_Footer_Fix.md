# Sprint 21 — Admin Critical Hotfixes + Footer Source-of-Truth Fix

> **Formed:** 2026-05-30 (owner directive batch — `issues.txt` 2026-05-30)
> **Status:** FORMED — three kickoffs ready for Sonnet
> **Run order:** 300 (CRITICAL i18n) → 302 (HIGH footer) → 301 (MEDIUM narrow-bp tabs)

## Sprint goal

Ship three pre-Epic-HH critical / high-priority admin bugfixes:

1. **Task 300 — CRITICAL: Admin Support i18n missing keys hotfix** — runtime `MISSING_MESSAGE` errors + raw key leakage on `/admin/support`. 32 string additions across 4 locale JSONs. Zero source files touched.
2. **Task 302 — HIGH: Footer admin source-of-truth backfill** — admin `/admin/footer` shows empty fields while public footer renders content. New idempotent SQL backfill script (owner runs in Supabase editor). Zero source files touched.
3. **Task 301 — MEDIUM: Admin segmented-tab narrow-breakpoint fix** — direct follow-up to Task 296 owner browser verification at 320/375/390 (clipped tab labels on AdminListingsTable + AdminUsersTable). 2 source files touched (container className only).

These are pre-requisites for **Epic HH — Admin UX System** (Phase 1+). Task 300 is also **Phase 0 of Epic II — Global i18n Hardening**.

## Tasks

### Task 300 — Admin Support i18n missing keys hotfix [CRITICAL]

- Kickoff: [`Sprint_21_kickoff_prompt_Task_300.md`](Sprint_21_kickoff_prompt_Task_300.md)
- Type: i18n hotfix (data — locale JSON additions only)
- Files: `messages/{sq,en,uk,it}.json` (8 keys × 4 locales = 32 string additions under `admin.support`) + session log + backlog.
- Source code: ZERO changes (`AdminSupportManager.tsx` uses `t(\`role_${role}\`)` and `t(\`support_status_${status}\`)` correctly; missing keys are the bug).
- AC: 0 `MISSING_MESSAGE` console warnings on `/admin/support` in any of sq/en/uk/it; no raw `admin.support.*` keys visible; key parity all 4 files.
- Independence: ships independently of 301/302.
- Epic mapping: Phase 0 of Epic II — Global i18n Hardening.

### Task 301 — Admin segmented-tab narrow-breakpoint fix [MEDIUM]

- Kickoff: [`Sprint_21_kickoff_prompt_Task_301.md`](Sprint_21_kickoff_prompt_Task_301.md)
- Type: responsive bugfix (admin, narrow breakpoints)
- Files: `src/components/admin/AdminListingsTable.tsx` + `src/components/admin/AdminUsersTable.tsx` (tab-bar parent container className only) + `docs/tailwind-canonical-fragments.md` §14 update + session log + backlog.
- Source code: 2 files (container className change). `Button` `size="tab"` (Task 296) unchanged. `AdminSettings` unchanged.
- AC: tab labels render without clipping at 320/375/390 in sq+uk+en+it; 768+ no regression.
- STOP & ASK on strategy A (wrap) vs B (horizontal scroll) vs C (compact labels — requires new locale keys, less preferred).
- Independence: ships independently of 300/302; pure UI fix.
- Epic mapping: closes the Task 296 follow-up flag; Epic HH Phase 0 critical fix.

### Task 302 — Footer admin source-of-truth backfill [HIGH]

- Kickoff: [`Sprint_21_kickoff_prompt_Task_302.md`](Sprint_21_kickoff_prompt_Task_302.md)
- Type: data backfill (SQL — owner runs in Supabase editor)
- Files: `scripts/task-302-site-footer-backfill.sql` (NEW) + session log + backlog.
- Source code: ZERO changes (`Footer.tsx` fallback chain deliberately preserved as defensive safety; `AdminFooterManager.tsx` works once rows populated; server actions correct as-is).
- AC: 4 idempotent UPSERT statements populate `site_footer` table per locale with current public-footer content (tagline, nav_section_title, info_section_title, social_section_title, copyright_template + nav_links / info_links / social_links arrays). Owner-edit preservation: only fill when current value is empty (`COALESCE(NULLIF(col,''),seed)` or jsonb-empty conditional).
- Owner action: runs the SQL script in Supabase SQL editor and confirms admin opens with prefilled fields.
- Independence: ships independently of 300/301; data-only change.
- Epic mapping: closes pre-existing Task 247 follow-up (seed rows existed but had empty content).

## Run order rationale

1. **Task 300 first** — CRITICAL runtime errors; smallest scope (4 JSON files); zero risk to other work.
2. **Task 302 second** — HIGH user-visible inconsistency; data backfill is safe (idempotent + owner-edit preserving); zero source code change means low review burden.
3. **Task 301 last** — MEDIUM UI fix; needs STOP & ASK on strategy before code change; routes through admin frontend.

Tasks can also run in parallel because their file scopes do not overlap.

## Exit criteria

Sprint 21 closes when:
- All three tasks have approved diffs (orchestrator review).
- Task 300 verified at runtime by owner: 0 MISSING_MESSAGE on `/admin/support` across sq/en/uk/it.
- Task 302 SQL applied by owner in Supabase: admin `/admin/footer` opens with prefilled content for all 4 locales.
- Task 301 verified at runtime by owner: tab labels readable at 320/375/390 in all 4 locales without clipping.
- All three commits land on `main` via owner's PowerShell git (orchestrator-emitted explicit-path commands).
- Backlog updated; Sprint 21 line in archive table.

## Out of scope for Sprint 21

- Broader Admin UX System work (Epic HH Phase 1+).
- Broader Global i18n Hardening audit (Epic II Phase 1+).
- Public site responsive recovery.
- Verified Agents workflow.
- Any other admin page beyond Support / Listings / Users tab bars and Footer.

## References

- Epic HH — Admin UX System: [`Epic_HH_Admin_UX_System.md`](../Epics/Epic_HH_Admin_UX_System.md)
- Epic II — Global i18n Hardening: [`Epic_II_Global_i18n_Hardening.md`](../Epics/Epic_II_Global_i18n_Hardening.md)
- Task 296 (closed-approved 2026-05-30): [`docs/sessions/2026-05-30-task-296-tailwind-entropy-audit.md`](../../docs/sessions/2026-05-30-task-296-tailwind-entropy-audit.md)
- Task 247 (Footer Admin Manager): [`docs/sessions/2026-05-28-task-247-ee1-footer-admin-manager.md`](../../docs/sessions/2026-05-28-task-247-ee1-footer-admin-manager.md)
- Task 284 (Admin support unification — context for Task 300): [`docs/sessions/2026-05-29-task-284-admin-unification.md`](../../docs/sessions/2026-05-29-task-284-admin-unification.md)
- Task 299 (admin filter triage evaluation — context for Epic HH Phase 1): [`docs/governance-reports/2026-05-30-admin-filter-triage-evaluation.md`](../../docs/governance-reports/2026-05-30-admin-filter-triage-evaluation.md)
