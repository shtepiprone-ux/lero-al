# Task 989 — Review 3

Kickoff: [Sprint_94_kickoff_prompt_Task_989_Site_Settings_Reach_The_Site.md](../../tasks/Archive/Sprint_94_kickoff_prompt_Task_989_Site_Settings_Reach_The_Site.md) · OWASP record: [Task_989.json](../security/owasp/reviews/Task_989.json) · Previous: [Review 1](Task_989_Review_1.md), [Review 2](Task_989_Review_2.md)

Review 3 of Revision 2: the working tree on 75a9be6a8 (branch `task/989-site-settings-reach-the-site`, uncommitted) — APPROVED
Scope: diff-based against `75a9be6a8`; 3 files (`src/modules/admin/lib/settingKeys.ts`, `src/components/admin/AdminFooterManager.tsx`, its test) and the executor's report `docs/sessions/2026-11-27-task989-revision2-executor-report.md`
Tools: `owasp.mjs sync`, `check` → exit 0; `check-ruleset.mjs` → exit 0; `main` CI 45977310002 green; the Route's 5 files → 308 passed, exit 0; ESLint → exit 0; typecheck → 0 errors in `src`; `vitest related` → 917 passed, exit 0; integration → 52 passed, exit 0
Findings: Critical 0, High 0, Medium 0, Low 0. F7 of Review 2: fixed. F1-F6 of Review 1: fixed (Review 2).
Overall risk: the Cause is removed; every security control of the task fails its test when undone; the forms match their canonical Stories and `main` except where the owner decided otherwise.

## Checklist V

- V1: `node scripts/quality/owasp.mjs sync` → "142 sheets at 5254440ecf1a; 0 downloaded; added 0, changed 0, removed 0", exit 0; `check` → "every quote verified", exit 0; `check-ruleset.mjs` → "the live ruleset matches", exit 0; `gh run list --branch main --limit 2` → CI 45977310002 success.
- V2: `git log --oneline -1` → `75a9be6a8` (the prompt's base commit); `git diff --stat 75a9be6a8 -- src` → 3 files, 69+/17-; each belongs to Revision 2 item 1; no other file outside Opus's documents.
- V3: claims rerun (Git Bash, as the report's).
  - `npm test --` the 5 files of the prompt → `Test Files  5 passed (5)`, `Tests  308 passed (308)`, exit 0 — as reported.
  - ESLint over the 3 files → no output, exit 0 — as reported.
  - `npm run typecheck` → 0 errors in `src`, 80 in the untracked `.next/types/validator.ts`; exit 1 here, 2 in the report. INFERENCE: Git Bash's `$?` after `npm run` gives 1 where the report quotes tsc's own 2; same errors. Not a finding.
  - `npx vitest related --run --reporter=verbose` over the 3 files → `Test Files  44 passed (44)`, `Tests  917 passed (917)`, exit 0 — as reported.
  - Integration (`SECURITY_TEST_TARGET=development`, ref from `.env.local`), `vitest related` over the two product files → `Test Files  8 passed (8)`, `Tests  52 passed (52)`, exit 0.
  - I4: the report's three failing-first cases and one case that pins the kept shared-save message: consistent with the diff.
- V4: every changed file read. The four bounds are exported from `settingKeys.ts` with unchanged values; `withinFooterBounds` uses them; the form uses the same constants: label `maxLength` 200, address 2048, the six text fields 5000, "add link" disabled at `FOOTER_LINKS_MAX` in all three lists (`AdminFooterManager.tsx:205`, used at `:311`, `:318`, `:448`); `showResult` takes the `validation` message per caller (language tab `error_save`, shared block `error_invalid_contact`). `maxLength` counts UTF-16 units as `String.length` does in `withinFooterBounds`.
- V5: against `75a9be6a8` and `main`: the form looks the same; inputs refuse typing past their bound; "add link" unchanged until 50 links. Owner decisions confirmed 2026-11-27 (translated, "Yes, both are mine"): the delete control 44×44 at every width (`main` 32×32); the `adminOrphans` detector counts a file that imports `getSettings` and names the key.
- V5a:
  - Page, owner's Chrome (extension), dev server, 1920px (the window does not resize): `/uk/admin/footer` — 24 text inputs: every link label `maxlength=200`, every address 2048, the six text fields 5000; three "add link" buttons 180×44, enabled; server HTML one `<link rel="icon">`; no overflow.
  - Stories, Storybook, Playwright, `Patterns/Mantine/AdminFooterManager` Default, `uk`: 320 → row controls 44×44 ×4, "add link" 174×44 ×3; 640, 1024, 1440 → controls 32/32/32/44, "add link" 180×44 ×3; `maxlength` 200 ×5, 2048 ×5, 5000 ×6 at every width; no overflow; console only Storybook's own `/api/presence` 404. The report's 105×44 is the English label's width (INFERENCE: measured in `en`).
  - The disabled "add link" at 50 links is shown by no Story; the unit test covers it.
  - Firefox: not reachable; the owner's look (V9).
- V6: no `eslint-disable`, `.skip`, `.only`, `@ts-*`, allowlist, baseline or registry row in the diff.
- V7: below.
- V8: the executor did not run I9 although the prompt named three breaks ("no new protections"); the reviewer ran them (copy, edit, test, copy back; `git diff | sha1sum` identical): `maxLength` props removed → `Tests  1 failed | 12 passed (13)`, exit 1; the 50-link disable removed → `1 failed | 12 passed (13)`, exit 1; the language save mapped back to the contacts message → `1 failed | 12 passed (13)`, exit 1. The gap in the report is recorded here; the check is done.
- V9: below.
- V10: `owasp.mjs review` triggers the same 48 sheets as Review 2; the record is unchanged since Review 2 (`Denial_of_Service`, `Input_Validation` met).
- V11: no finding.
- V12: this file, linked from the kickoff; `check-files.mjs` on the kickoff, the three reviews and the record.
- V13: APPROVED.

## V7 — secure code review

- Entry points: none added or changed; the server bounds of Revision 1 stay the control, the form's `maxLength` and disabled button are usability only (a crafted request still meets `withinFooterBounds`).
- Client bundle: `settingKeys.ts` was already imported by the client form (`isSwitchOn`); the new exports are numbers, no secret, no server-only import.
- Output: no new sink; the toast text is a translation key.

## Stories for the owner (V9)

- `Patterns/Mantine/AdminFooterManager` — Default, Empty, NotInitialized, Forbidden: a link label stops at 200 characters; the row controls are 44px below 640px, 32px (delete 44px) from 640px; drag with mouse, finger and keyboard; Firefox too.
- `Patterns/Mantine/AdminSettings` — Default, Empty: tabs General, Brand, SEO (language tabs), Localization.
- `Primitives/HeaderView` WithLogo, `Primitives/FooterView` ContactsAndSocial, `Primitives/AppImage` BrandLogo.
- The site: `/uk` tab icon is the saved favicon, one icon; the footer shows contacts and social links per the switches.

## After the merge (Opus)

- H7: archive the task; Task 930 closes by AC1 (`TASK_930_KEYS` is empty); the production check of the Route's step 5.
