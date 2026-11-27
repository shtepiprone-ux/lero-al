# Task 989 — Review 2

Kickoff: [Sprint_94_kickoff_prompt_Task_989_Site_Settings_Reach_The_Site.md](../../tasks/Sprints/Sprint_94_kickoff_prompt_Task_989_Site_Settings_Reach_The_Site.md) · OWASP record: [Task_989.json](../security/owasp/reviews/Task_989.json) · Previous: [Review 1](Task_989_Review_1.md)

Review 2 of Revision 1: the working tree on 6dedcb419 (branch `task/989-site-settings-reach-the-site`, uncommitted) — NEEDS REVISION
Scope: diff-based against `6dedcb419`; 16 files under `src` and `public` (4 product files, 1 Story, 11 tests) and the favicon move; the executor's report `docs/sessions/2026-11-27-task989-revision1-executor-report.md`
Tools: `owasp.mjs sync`, `check` → exit 0; `check-ruleset.mjs` → exit 0; `main` CI 45977310002 green; the Route's 15 files → 600 passed, exit 0; ESLint → exit 0; typecheck → exit 1, 0 errors in `src`; `vitest related` over the whole task diff → exit 1, 1 failed of 8130 (the stale local `.next`); integration collection of the revision → 52 passed, exit 0
Findings: Critical 0, High 0, Medium 0, Low 1 (F7). F1-F6 of Review 1: fixed.
Overall risk: every finding of Review 1 is removed and holds under deliberate breaks; the bounds added for F4 surface in the form as the wrong message, and the form lets the administrator reach them.

## Checklist V

- V1: `node scripts/quality/owasp.mjs sync` → "142 sheets at 5254440ecf1a; 0 downloaded; added 0, changed 0, removed 0", exit 0; `check` → "every quote verified", exit 0; `node scripts/quality/check-ruleset.mjs` → "the live ruleset matches", exit 0; `gh run list --branch main --limit 3` → CI 45977310002 success.
- V2: `git log --oneline -1` → `6dedcb419` (the base commit of the prompt); `git diff --stat 6dedcb419 -- src public` → 16 files, 261+/77-, plus `public/favicon.ico` (untracked). Each file belongs to an item: item 1 the six tests; item 2 both layouts, `layoutBrand.test.ts`, `src/app/favicon.ico` → `public/favicon.ico` (sha1 `9ecfcc8f…` of both: same bytes); item 3 `AdminFooterManager.tsx` and its test; item 4 `settingKeys.ts`, `footer.ts`, `staffActions.test.ts`; item 6 `AppImage.stories.tsx`. Items 1 and 2 reach files outside the kickoff's Scope with the owner's yes of 2026-11-27. No other file.
- V3: claims rerun.
  - The Route's 15 files: `Test Files  15 passed (15)`, `Tests  600 passed (600)`, exit 0 — as reported.
  - `npx eslint --no-warn-ignored --max-warnings 0` over the 15 changed code files → no output, exit 0 — as reported.
  - `npm run typecheck` → 80 errors, all in the untracked `.next/types/validator.ts`, 0 in `src`; exit 1 in Git Bash, the report says 2. INFERENCE: the shell differs (the report's PowerShell `$LASTEXITCODE` against Git Bash `$?`); the error set is the same. Not a finding.
  - `npx vitest related --run --reporter=verbose` over every file the task changes against `8896ef0d7` (wider than the report's 45 files of the revision) → `Test Files  1 failed | 471 passed (472)`, `Tests  1 failed | 8129 passed (8130)`, exit 1; the one: `proxyFile.test.ts` `[SEC-T1-SRV-BUILT-PROXY]`, which reads the local build of 2026-11-21 (A5; CI builds first; `src/proxy.ts` unchanged).
  - Integration: `SECURITY_TEST_TARGET=development` (ref from `.env.local`) `npx vitest related --run --config vitest.integration.config.ts <the revision's files>` → `Test Files  8 passed (8)`, `Tests  52 passed (52)`, exit 0 — as reported.
  - The report's "nine scheme cases" against eight values: Review 1 item 1b said nine and listed eight; the eight run. Review 1's wording, not a defect.
- V4: every changed file read. F1: each moved security assertion now runs against the code that holds it (`saveFooterShared` for the social schemes, `logo_url` and `site_name` for the settings script and length cases); none removed. F2: both layouts always return `icons: { icon: <accepted saved favicon> | '/favicon.ico' }`; the file-convention icon is gone. F3: `controlSize = { base: theme.other.touchTarget, sm: theme.other.iconSize.prominent }` (`iconSize` is the theme's "icon/control dimension scale", 32px) on handle, up and down; delete `touch`. F4: `withinFooterBounds` (`settingKeys.ts:80`) called before any write in `saveFooterShared` (`footer.ts:151`) and `upsertFooterContent` (`:197`). F6: comment fixed.
  - The `adminOrphans.test.ts` detector now also counts a file outside the admin code that imports `getSettings` and names the key; the planted case checks the three forms and three controls (no import, admin code, `FOOTER_SETTING_KEYS` standing only for its own keys). With an empty `TASK_930_KEYS` the 21 keys all have readers.
  - The executor's note on `Footer.tsx:61`: `getFooterContent` returns `null` both on an error and when no row exists (`src/modules/admin/lib/settings.ts:74-75`), so the container cannot tell them apart; the built-in social links stand for both. Review 1 item 1d said "only when `getFooterContent` fails"; the test's wording ("no footer row or the service fails") is the accurate one. Not a finding.
- V5: against `6dedcb419` and `main`: from 640px the handle, up and down are 32×32 again as on `main` (`h-8 w-8`); below 640px 44×44; delete 44×44 at every width (the owner's decision, as the report records it, "Open" below). Tab icon: one, as on production.
- V5a:
  - Pages, owner's Chrome (extension), dev server, 1920px (the window would not resize): `/uk/admin/footer` — server HTML (`fetch(location.href)`) has exactly one `<link rel="icon">`, the saved Cloudinary favicon; the DOM's two `data:image/svg+xml` icons are the browser extension's tab marker (fill `#C6613F`), not the page's; 9 link rows, row controls 32×32, 32×32, 32×32, 44×44; no overflow. `curl` of `/uk` and `/en`: one icon link each.
  - Stories, Storybook dev server, Playwright: `Patterns/Mantine/AdminFooterManager` Default, `uk`, 5 rows: 320 → 44×44 ×4; 640, 1024, 1440 → 32×32, 32×32, 32×32, 44×44; no overflow; console: only Storybook's own `/api/presence` 404.
  - Firefox: not reachable; the owner's look (V9).
- V6: the diff adds or removes no `eslint-disable`, `.skip`, `.only`, `@ts-*`, allowlist, baseline or registry row. `TASK_930_KEYS` becomes empty: it narrows the exemption.
- V7: below.
- V8: each revision change undone, its test run, the file restored (`git diff | sha1sum` identical after each): F4 bounds removed from both actions → `staffActions` `Tests  18 failed | 238 passed (256)`, exit 1; F2 two-icon behaviour restored (both layouts and `src/app/favicon.ico`) → `layoutBrand` `Tests  9 failed | 28 passed (37)`, exit 1; F3 `mih`/`miw`/`touch` removed → `AdminFooterManager.shared` `Tests  1 failed | 8 passed (9)`, exit 1.
- V9: below.
- V10: `node scripts/quality/owasp.mjs review <kickoff>` → exit 0, 48 sheets triggered, as in Review 1. The record: `Denial_of_Service` and `Input_Validation` move from finding F4 to met (quotes verified by `check-files.mjs`).
- V11: one finding, below.
- V12: this file, linked from the kickoff; `check-files.mjs` on the kickoff, both reviews and the record.
- V13: NEEDS REVISION.

## V7 — secure code review

- Entry points: unchanged; the two footer Server Actions gain a pure check before any database call. In `upsertFooterContent` it runs before the administrator check (`footer.ts:197` before the role read): it reads nothing and returns `validation`, so an unauthenticated caller learns only that an oversize payload is refused, which the bound itself publishes.
- `withinFooterBounds`: a list that is not an array fails; a link that is not an object is read as `{}` (no prototype read); a non-string field is left to the type checks that follow. INFERENCE: a non-string text field of `upsertFooterContent` is not type-checked, as on `main`; the request body is capped by Next's Server Action body limit (1 MB by default). Not introduced by the revision.
- Output: the single icon is the saved favicon only when `isBrandImageUrl` accepts it, else a same-origin path; no new sink.

## Findings

### F7 — Low — the footer form lets the administrator pass the new bounds and then names the wrong cause

Location: `src/components/admin/AdminFooterManager.tsx:100-111` (link label and address inputs, no `maxLength`), `:138-140` (`addLink`, no cap), `:289-313` (the six text fields, no `maxLength`), `:379` (`validation` → `error_invalid_contact`).
Fact: the form accepts a 201-character label, a 2049-character address, a 5001-character text field or a 51st link; the action answers `validation` (Revision 1, F4); `showResult` shows `error_invalid_contact` ("Check the phone and the e-mail addresses: one address each, a phone of digits.", `messages/en.json:1170`) — on a language tab, which has no phone or e-mail field. Reported by the executor as a note for Opus.
Impact: the administrator cannot find what to correct; the save fails with no visible reason.
Required correction: the form carries the same bounds as the actions, from one source, and a language-tab refusal names no contacts (Revision 2 below).

## Revision 2 (for the implementer)

1. F7:
   - `src/modules/admin/lib/settingKeys.ts`: export the bounds the actions use — `FOOTER_LINKS_MAX` (50), `FOOTER_LINK_LABEL_MAX` (200), `FOOTER_LINK_URL_MAX` (2048), `SETTING_MAX_LENGTH` (5000); `withinFooterBounds` keeps using them (values unchanged).
   - `src/components/admin/AdminFooterManager.tsx`: the link label input `maxLength={FOOTER_LINK_LABEL_MAX}`, the link address input `maxLength={FOOTER_LINK_URL_MAX}`; the six text fields of a language tab (brand title, footer text, copyright, the three section titles) `maxLength={SETTING_MAX_LENGTH}`; the "add link" button of each list (social, navigation, information) is disabled when the list holds `FOOTER_LINKS_MAX` links.
   - The language-tab save (`handleSave`) shows `error_save` for `validation`; the shared save keeps `error_invalid_contact`. No new message key.
   - Tests in `src/components/admin/__tests__/AdminFooterManager.shared.test.tsx`: each input's `maxLength` attribute; "add link" disabled at 50 links and enabled at 49; a language save answered `{ error: 'validation' }` shows the `error_save` text and not the contacts text; the shared save answered `validation` shows the contacts text.
2. The report quotes each command's printed summary lines and exit code, and names the shell each ran in.

## Stories for the owner (V9)

- `Patterns/Mantine/AdminFooterManager` — Default: at 320px the four row controls are large touch targets; from 640px the handle and arrows are 32px, the delete stays 44px. Type a very long label: it stops at 200 characters (after Revision 2).
- The site tab icon on `/uk` and `/uk/admin/footer`: one icon, the saved favicon.

## Open for Opus and the owner

- Owner: the executor's report records two decisions of the owner in the revision session (2026-11-27): the delete control stays 44×44 at every width (the canonical `MantineDeleteIconButton` has no 32px size), and the `adminOrphans` detector also counts a file that imports `getSettings` and names the key. Known only from the report; the owner confirms them so they can be cited (A2).
- Opus: after the merge, Task 930 is closed by AC1 in H7 (`TASK_930_KEYS` is empty).
