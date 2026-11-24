# Task 1007 — Review 2

Kickoff: [Sprint_93_kickoff_prompt_Task_1007_A_Moderator_Opens_Only_The_Admin_Pages_Switched_On.md](../../tasks/Sprints/Sprint_93_kickoff_prompt_Task_1007_A_Moderator_Opens_Only_The_Admin_Pages_Switched_On.md) · OWASP record: [Task_1007.json](../security/owasp/reviews/Task_1007.json) · Previous: [Review 1](Task_1007_Review_1.md)

Review 2 of the working tree on de99ecd87 (uncommitted, branch `task/1007-admin-page-access`), Revision 1 — APPROVED
Scope: Revision 1 changed one file, `src/modules/admin/actions/__tests__/permissions.security.test.ts` (+2 −1: the `ADMIN_PAGE_KEYS` import at `:11` and the
assertion at `:118`), exactly R1-1. `git diff HEAD --shortstat` → 65 files, +723 −268: Review 1 read 63 files at +714 −265 (the kickoff's O1007-3 change
included); Review 1 itself added `docs/backlog.md` (Task 1031, +2 −2) and the kickoff's Revision block and review link (+5); R1-1 adds +2 −1. Nothing else
moved.
Tools (local, 2026-11-24): `owasp.mjs sync`, `owasp.mjs check`, `check-ruleset.mjs` → exit 0; `gh run list --branch main --limit 3` → `success` on
`03c9a9773` (run 45341689705); `npm test -- src/modules/admin/actions/__tests__/permissions.security.test.ts` → exit 0, 42 passed, as reported; the Route's
ten files → exit 0, 315 passed, as reported; the 21 existing files that import the changed code (the set of Review 1) → exit 0, 21 files, 345 passed;
`owasp.mjs review <kickoff> --base main` → exit 0. Not run (A5): `tsc`, lint, the full unit and integration runs, build, census.
Findings: Critical 0, High 0, Medium 0, Low 0
Overall risk: F1 is fixed with an assertion as strict as before (every key present, nothing more); the rest of the change is the one Review 1 read and
measured.

## Checklist V on the revision

- V2: one file, R1-1's; no hunk beyond it.
- V3: both reported runs reproduce (above); the reported failing-first output (36 keys against 21) matches Review 1's reproduction.
- V4: the two changed lines read; the import comes from the module the product code uses (`src/modules/admin/actions/permissions.ts:7`).
- V5, V5a, V9: no visible element changes in the revision (a test file only); the measurements of Review 1 stand.
- V6: no exemption added.
- V7: Tests — touched: the assertion keeps its strictness (`toEqual` over the sorted key list). Every other category — not touched (no other file in the
  revision).
- V8: the product change undone once (`ACCESS_KEYS` back to `[...PERMISSION_KEYS]` at `src/modules/admin/actions/permissions.ts:10`) → the revised test
  fails, 1 of 42 ("expected [ 'audit.clear_history', …(20) ] to deeply equal [ 'audit.clear_history', …(35) ]"); restored byte for byte (md5).
- V10: `owasp.mjs review` exit 0; the record's verdicts are unchanged by a test-only revision.

## Notes

- The executor did not run I9 for the revised test and said so; the same evidence is V8 above (the test fails without its control). I1 was non-empty
  because the task's earlier change is uncommitted, as the revision expects.
- The open parts of Review 1 are unchanged and are not findings of the diff: the owner's decision on the 11 `page.%` rows already in
  `role_permissions` (keep them, so `task1007.sql` adds the 4 missing pages and `page.popular_locations` stays off; or run `task1007-rollback.sql` first, so
  the apply seeds all 15 on), then the apply before the merge and the AC7 after-apply check (`select permission_key, allowed from public.role_permissions
  where permission_key like 'page.%'` lists the 15 keys; `db-catalog-audit.mjs` reports none of its invariants); AC3 and AC9 are UNKNOWN until
  `gh pr checks <n>`; the moderator check of Route step 5 after the merge.

## After the apply (AC7, 2026-11-24)

The owner kept the existing page rows (owner, 2026-11-24, translated: "let the 404 page stay, it suits me" for a switched-off page; the SQL applied as is)
and applied `task1007.sql` (md5 `9eaea21b037227bd456909fd38630494`, the LF file proven in Review 1) in the SQL Editor: "Success. No rows returned". Then,
read-only: `role_permissions` holds the 15 page keys of `ADMIN_PAGES`; the 4 the apply inserted (`page.pages`, `page.currency`, `page.email_templates`,
`page.settings`, 09:30:21 UTC, no actor) are allowed; of the 11 the owner set through the section, 9 are allowed and `page.popular_locations` (08:49:59) and
`page.property_types` (08:58:21) are off, each with its `role_permission_events` row and actor (13 page events). `node scripts/quality/db-catalog-audit.mjs`
→ exit 0, no finding. AC7 holds for the state the owner chose; the two pages off are the owner's switches, changed in "Permissions" at will.

Open parts, in order: the commit and pull request (H) → `gh pr checks <n>` → the merge → the moderator check of Route step 5 → the archive (H7, P-01 to
fixed).
