# Sprint 25 — Admin Hotfixes 2 (Email Templates ICU fix + Footer link target validation)

> **Formed:** 2026-05-30 (owner-uploaded `issues2.md` 2026-05-30 — two HIGH admin bugs surfaced during owner runtime QA after Sprint 21 planning).
> **Status:** FORMED — two kickoffs ready for Sonnet.
> **Run order:** 315 → 324 (parallel-safe; 315 is independent; 324 depends on Task 302 having shipped first).

## Sprint goal

Ship two HIGH admin hotfixes that surfaced during owner runtime QA:

1. **Task 315 — Email Templates ICU literal-braces hotfix** — `/admin/email-templates` Create/Edit dialog throws `INVALID_MESSAGE: MALFORMED_ARGUMENT` because `variables_hint` locale strings contain literal `{{...}}` which next-intl ICU parses as a malformed argument. Fix: replace with `{variableSyntax}` ICU placeholder + pass `'{{variableName}}'` as interpolation value at both call sites. 4 locale JSONs + 2 source-file edits.
2. **Task 324 — Footer admin internal-link target validation** — Task 302 follow-up: admin can save `url="/test"` to a footer link → public 404. Fix: two-layer guard (client UX warning + save-block; server-side rejection); allowlist of static routes + admin-managed dynamic page slugs. 3 source-file edits + 3-4 new locale keys × 4 locales.

These are independent of the Epic HH / Epic II planning workstreams and can ship without waiting for Phase 1 audit approvals.

## Tasks

### Task 315 — Email Templates ICU hotfix [HIGH]

- Kickoff: [`Sprint_25_kickoff_prompt_Task_315.md`](Sprint_25_kickoff_prompt_Task_315.md)
- Type: bugfix (i18n runtime, page-crash class)
- Files: `messages/{sq,en,uk,it}.json` (1 key × 4 = 4 string changes) + `AdminEmailTemplatesManager.tsx` (2 call sites) + session log + backlog.
- AC: dialog opens in all 4 locales without `MALFORMED_ARGUMENT`; literal `{{variableName}}` example still visible.
- STOP & ASK on: ICU escape syntax vs. interpolation (default = interpolation).
- Independence: standalone; can ship before/after/parallel to Sprint 21 work.

### Task 324 — Footer internal-link target validation [HIGH]

- Kickoff: [`Sprint_25_kickoff_prompt_Task_324.md`](Sprint_25_kickoff_prompt_Task_324.md)
- Type: feature / UX guard / admin content integrity
- Files: `AdminFooterManager.tsx` (inline warning + save-block) + `actions/footer.ts` (server validation) + `src/lib/footer-route-allowlist.ts` (NEW canonical helper) + `messages/{sq,en,uk,it}.json` (3-4 new keys × 4 = 12-16 strings) + session log + backlog.
- AC: `/test`-style invalid internal links BLOCKED client + server-side; valid static routes save normally; external `https://` links save normally; admin-managed page slugs (if system exists) included in allowlist.
- STOP & ASK on: 6 design points in investigation (admin-managed pages system, CTA route, disabled-link handling, URL normalization, external allowlist, picker vs. text input).
- Dependency: **Task 302 must have shipped first** (site_footer rows must exist + admin UI must read/write them).
- Independence: parallel-safe to Task 315.

## Run order rationale

- **Task 315 first** — page-crash class bug; smallest scope (4 JSON + 2 source); zero ripple to other work.
- **Task 324 second (or parallel)** — depends on Task 302 having shipped (verify before starting); no overlap with Task 315 file scope.

Tasks can run in parallel because their file scopes do not overlap.

## Exit criteria

Sprint 25 closes when:
- Both tasks have approved diffs (orchestrator review).
- Owner verifies at runtime:
  - Task 315: `/admin/email-templates` opens Create + Edit dialogs in all 4 locales without console errors.
  - Task 324: invalid internal link save is BLOCKED both client + server-side; valid links still save normally.
- Orchestrator emits explicit-path commit commands per task.
- Backlog updated; Sprint 25 row in archive table.

## Out of scope for Sprint 25

- Other `{{...}}` literal-brace landmines surfaced by Task 315 grep (separate follow-up).
- Internal-page picker / Combobox UX for footer (Phase 2 of Task 324 work).
- Building a CMS / page-builder feature.
- Domain allowlist for external URLs.
- Admin UX System (Epic HH).
- Global i18n Hardening (Epic II Phase 2+).
- Dependency hygiene (Task 325 / Sprint 26 separate).
- Sprint 21 hotfixes (300/301/302) — independent.

## References

- Epic II — Global i18n Hardening (Task 315 is Phase 0 second slice, alongside Task 300): [`../Epics/Epic_II_Global_i18n_Hardening.md`](../Epics/Epic_II_Global_i18n_Hardening.md)
- Task 302 (Footer source-of-truth — Task 324 dependency): [`Sprint_21_kickoff_prompt_Task_302.md`](Sprint_21_kickoff_prompt_Task_302.md)
- Task 247 (original Footer Admin Manager): [`../../docs/sessions/2026-05-28-task-247-ee1-footer-admin-manager.md`](../../docs/sessions/2026-05-28-task-247-ee1-footer-admin-manager.md)
- Task 201 (Email Templates modal-width precedent): in Session Archive.
