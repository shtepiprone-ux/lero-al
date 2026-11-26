# Task 988 — Review 6

Kickoff: [Sprint_94_kickoff_prompt_Task_988_The_Chosen_Language_Stays.md](../../tasks/Sprints/Sprint_94_kickoff_prompt_Task_988_The_Chosen_Language_Stays.md) · OWASP record: [Task_988.json](../security/owasp/reviews/Task_988.json)

Review 6 of pull request #83 at 7ba9ef38d (branch `task/988-chosen-language-stays`, the tree Review 5 approved) — NEEDS REVISION
Scope: checklist V14 on the pull request: `gh pr checks 83` → CI run 45877879937 with four red jobs (`Lint, types and product checks`, `Unit and component tests`, `Click-shield (production build, real interactions)`, and `CI Required`, which fails because the other three do). Every other check passed, including the authorization regression, the six locale-leak shards, the OWASP task gate, CodeQL, gitleaks, the Storybook build and the Vercel preview. No new diff: this review reads the failed logs and the code they name.
Tools: `gh pr checks 83`; `gh run view 45877879937 --job <id> --log-failed` for jobs 140109472895, 140109473164 and 140109473214; `gh run view 45833291216 --job 139955398020 --log` (`main`'s walk, 216 rows passed); Node 22.22.3 (CI's version) `Intl.DateTimeFormat`; DevTools in the owner's Chrome 158 for `Intl.*.supportedLocalesOf(['sq'])`.
Findings: Critical 0, High 0, Medium 1, Low 2
Overall risk: the walk on the production build opens the admin under `/sq/…` now, and `/sq/admin/permissions` throws React error #418 (hydration text mismatch) because the browser formats its dates without Albanian locale data. That is a page error on production for every administrator whose language is `sq`. The other two red jobs are a security checker that cannot read through `adminHref(...)`'s parentheses and 23 doc lines that still name the files the move renamed. One walk row timed out and is not yet explained.

## Checklist V

- V1-V13: Review 5 stands for the diff; this review adds no diff.
- V14: `gh pr checks 83` → 4 failing, 20 passing. Each red job read with `--log-failed`:
  - `Lint, types and product checks` (job 140109472895): `node scripts/quality/check-files.mjs --all` → "15093 file(s) checked, 23 finding(s) in 14 file(s)": 20 `[stale-path]` lines in 12 docs and 3 `[kickoff]` lines in two Sprint 93 kickoffs, each naming a file the task moved (F10).
  - `Unit and component tests` (job 140109473164): "Test Files 1 failed | 459 passed (460)". `src/__tests__/security/clientSinks.test.ts` fails 3 cases, each "src/components/layout/Header.tsx: window.open(adminHref(locale, '/admin'): expected [ Array(1) ] to deeply equal []" (F9). The `fetch failed` and "Missing SUPABASE_SERVICE_ROLE_KEY" lines in the same log are logged errors of passing tests.
  - `Click-shield` (job 140109473214), step "Signed-in pages of every role are walked on the build (Task 965)": "signed-in pages: FAILED (3 of 216 rows)": `admin /sq/admin/permissions` at 1280 and 390 px, "page error: Minified React error #418; … args[]=text" (F8); `moderator /sq/admin @1280`, "page.goto: Timeout 60000ms exceeded … waiting until "load"" (UNKNOWN below). `moderator /sq/admin @390` passed in the same run.
  - `main`'s walk (CI 45833291216) passed all 216 rows; it opened the admin at `/admin` (`git show main:scripts/check-signed-in-pages.mjs:68,81`), so with no `admin-locale` cookie the admin rendered in `en`.

## Findings

F8 — the permissions page formats its dates in the browser, which has no Albanian date data, so `/sq/admin/permissions` fails hydration
Severity: Medium      Category: Rendering (hydration)      CWE: —
Location: `src/components/admin/AdminPermissionsView.tsx:4,41,103,170,238` (`useFormatter()`, `format.dateTime(...)` in a `'use client'` view); `src/app/[locale]/admin/permissions/page.tsx:17-32`; `src/components/admin/AdminPermissionsManager.tsx:15-20`
Description: the view formats `updated_at` (`{ dateStyle: 'medium' }`) and each event's `created_at` (`{ dateStyle: 'medium', timeStyle: 'short' }`) through next-intl's `useFormatter`, i.e. `Intl.DateTimeFormat`, on the server and again in the browser. Node 22.22.3 (CI and Vercel) has full ICU: `sq` → "20 nën 2026" and "20 nën 2026, 2:05 m.d.". Chrome 158 has no `sq` date data: `Intl.DateTimeFormat.supportedLocalesOf(['sq'])` → `[]`, and the same calls give "Nov 20, 2026" and "Nov 20, 2026, 2:05 PM". The server's text and the browser's differ, which is React #418 "text". `en`, `uk` and `it` give equal text in both (measured), so the walk on `main`, which rendered the admin in `en`, never saw it. Task 988 puts the admin under the language slug, so an `sq` administrator now opens it in `sq` by default. The project already documents this gap and its fix: `src/lib/formatters.ts:81-86` ("browsers' bundled ICU lacks locale data entirely for `sq`"), and `src/components/admin/AdminUserProfile.tsx:48-52` takes server-formatted dates for the same reason. `grep` over `src/components/admin`, `src/modules/admin` and `src/app/[locale]/admin` for `useFormatter`, `format.dateTime`, `Intl.` and `toLocale*` finds no other locale-dependent date call. `AdminEmailTemplatesManager.tsx:439` calls `toLocaleDateString()` without a locale, which ignores the slug. Its walk row passed.
Impact: on production, every administrator whose language is `sq` gets a hydration error on `/sq/admin/permissions`. React re-renders the root on the client, and the click-shield gate fails, so the pull request cannot merge. INFERENCE from the code: `main` has the same view, so an administrator who set the `admin-locale` cookie to `sq` already hit it there. This task makes it the default.
Reproduction: CI run 45877879937, job 140109473214: "FAIL admin /sq/admin/permissions @1280: page error: Minified React error #418; … args[]=text". Node: `new Intl.DateTimeFormat('sq', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date('2026-11-20T14:05:00Z'))` → "20 nën 2026". The owner's Chrome, same call → "Nov 20, 2026".
Recommendation: Revision 5, R5-1.
References: checklist A2; `src/lib/formatters.ts:81-86`; React error 418.
Status: open

F9 — the header's admin link hides its `noopener` from the new-tab checker
Severity: Low      Category: Security test (client sinks)      CWE: CWE-1022 (the rule the checker holds)
Location: `src/components/layout/Header.tsx:99`; the checker `src/__tests__/security/clientSinks.test.ts:34-40` (`/window\.open\([^)]*\)/g`), its cases at lines 81-84 and the two `[SEC-…]` cases
Description: Task 988 changed `window.open('/admin', '_blank', 'noopener,noreferrer')` (`git show main:src/components/layout/Header.tsx:97`) to `window.open(adminHref(locale, '/admin'), '_blank', 'noopener,noreferrer')`. The checker's pattern stops at the first `)`, the one closing `adminHref(...)`, so the text it reads is `window.open(adminHref(locale, '/admin')`, which has no `noopener`. The call is safe: it passes `noopener,noreferrer`. But the checker fails closed and three cases go red. The checker reads every source file through a glob rather than an import, so neither search of `quality-gates.md` §8.1 reached it in Reviews 1-5.
Impact: `Unit and component tests` fails, so the pull request cannot merge. The product is not affected.
Reproduction: CI run 45877879937, job 140109473164: "FAIL src/__tests__/security/clientSinks.test.ts > new-tab links > every window.open passes noopener", "AssertionError: src/components/layout/Header.tsx: window.open(adminHref(locale, '/admin'): expected [ Array(1) ] to deeply equal []".
Recommendation: Revision 5, R5-2. The checker stays as it is: it fails closed.
References: `clientSinks.test.ts` `[SEC-S11-SRV-DENY]`, `[SEC-927-FE-SINKS-EXCEPTION]`.
Status: open

F10 — 23 doc lines name the files the move renamed
Severity: Low      Category: Records (stale paths)      CWE: —
Location: `docs/backlog-reserved.md:19`; `docs/design-system.md:1460,1506`; `docs/domain-rules.md:121`; `docs/mantine-responsive-design-system.md:560,673`; `docs/performance.md:1244`; `docs/rules/golden/gr-3b-responsive-width.md:32`; `docs/security/audit-2026-11-06/findings.md:22,116,117,118,120`; `docs/state-authority.md:251`; `docs/storybook-governance.md:1619,2284`; `docs/tailwind-entropy-audit.md:112`; `docs/tailwind-governance.md:406`; `docs/ui-rules.md:240` (20 findings in 12 docs, two on line 118); the "## Cause" of `tasks/Sprints/Sprint_93_kickoff_prompt_Task_980_Public_Profiles_Show_Only_What_A_Reader_May_See.md:27,28` and `tasks/Sprints/Sprint_93_kickoff_prompt_Task_982_One_Admin_Create_Form.md:15`
Description: Scope 5 moved the site routes into `src/app/[locale]/(site)/` (`git diff -M --name-status main` → R100 for each named site file) and the admin from `src/app/admin/` to `src/app/[locale]/admin/`. The docs still name the old paths. Reviews 1-5 ran `check-files.mjs` on the files of the commit only, as checklist A5 requires. `--all` runs only on GitHub, so the docs the diff does not touch were not read.
Impact: `Lint, types and product checks` fails, so the pull request cannot merge. An agent following these docs opens files that do not exist.
Reproduction: CI run 45877879937, job 140109472895: the 23 lines above, "check-files: 15093 file(s) checked, 23 finding(s) in 14 file(s)".
Recommendation: Revision 5, R5-3 for the 12 docs. The two kickoffs are Opus's records: this review adds "Read at `aacf6ebce`" (`main` at the branch's base) to their "## Cause", so their sources are read at the commit they were written against (`check-files.mjs` `READ_AT`, F26).
References: checklist A4; `scripts/quality/check-files.mjs:234` (`PATH_HISTORY_LINE`), `:437-456`.
Status: open (the two kickoffs: fixed in this review)

## Revision 5 (executor)

The kickoff's "Revision 5" block holds these items. The revision starts from the pushed commit 7ba9ef38d.

- R5-1 (F8): `src/app/[locale]/admin/permissions/page.tsx` formats the dates on the server with `getFormatter()` from `next-intl/server`, using the options the view uses today: `{ dateStyle: 'medium' }` for each permission's `updated_at` and `{ dateStyle: 'medium', timeStyle: 'short' }` for each event's `created_at`. The page passes the results through `AdminPermissionsManager` to `AdminPermissionsView` as two new props: `updatedDates: Partial<Record<AccessKey, string>>` (only the keys with an `updated_at`) and `eventDates: Record<string, string>` (by event id). The view renders those strings verbatim at lines 103, 170 and 238 and no longer imports or calls `useFormatter`. `PermissionData`, `PermissionEvent` and the server actions stay. `AdminPermissionsView.stories.tsx` passes the two maps with Node's `en` output at `timeZone: 'UTC'` for its values: `'2026-06-18T10:00:00Z'` → "Jun 18, 2026" and `'2026-06-17T08:00:00Z'` → "Jun 17, 2026" (`updatedDates`), and `ev-1` → "Jun 18, 2026, 10:00 AM" and `ev-2` → "Jun 17, 2026, 8:00 AM" (`eventDates`). The look stays: each locale gets the text Node renders today, so `sq` readers now get the Albanian text instead of the browser's fallback.
- R5-1, amended after the executor's BLOCKED 3: `src/modules/admin/actions/__tests__/permissions.security.test.ts:23` mocks `next-intl/server` without `getFormatter`. With the R5-1 page, `[SEC-X-SRV-PERMS-ADMIN-ONLY]` fails with "No "getFormatter" export is defined on the "next-intl/server" mock" (reproduced: 1 failed, 41 passed). The mock gains `getFormatter: async () => ({ dateTime: (d: Date) => d.toISOString() })`. No other line of the test changes.
- R5-2 (F9), amended after the executor's BLOCKED 2: the first form, `const adminUrl = …; window.open(adminUrl, …)`, fails `scripts/quality/client-sinks.mjs` K7 ("Header.tsx:100 navigation to a computed address"; K7 matches `window.open(<identifier>,`). A template literal `` `/${locale}/admin` `` fails `adminSlug.test.tsx` [AC6] ("an admin address built by hand"). Both reproduced. So `src/components/layout/Header.tsx` returns to 7ba9ef38d's text, and the checker learns to read one level of nested parentheses:
  - `src/__tests__/security/clientSinks.test.ts:36`: `/window\.open\([^)]*\)/g` → `/window\.open\((?:[^()]|\([^()]*\))*\)/g`.
  - One planted case in the same file proves the checker still catches a missing `noopener` through `windowOpenViolations`, as the planted case at lines 86-90 does for `target="_blank"`: `window.open(adminHref(l, '/admin'), '_blank')` → 1 violation; `window.open(adminHref(l, '/admin'), '_blank', 'noopener,noreferrer')` → 0.
  - This review's probe, with Header at 7ba9ef38d and the new pattern (both files then restored, sha256 equal): `clientSinks.test.ts` and `adminSlug.test.tsx` → 2 files, 20/20; `client-sinks.mjs` → "every sink controlled or reviewed", exit 0. Node gives the new pattern's match for the nested call without `noopener` → no `noopener` (flagged); with it → `noopener` (passes).
- R5-3 (F10): on each of the 20 doc lines of F10's Location (not the two kickoffs), the old path becomes the current file. `src/app/admin/…` → `src/app/[locale]/admin/…`; `src/app/[locale]/<route>` → `src/app/[locale]/(site)/<route>`, for `page.tsx`, `contact/page.tsx`, `listings/page.tsx`, `listings/[slug]/page.tsx`, `listings/[slug]/loading.tsx`, `favorites/page.tsx`, `cabinet/page.tsx` and `auth/confirm-email/page.tsx`. The rules in `docs/ui-rules.md:240` and `docs/rules/golden/gr-3b-responsive-width.md:32` name the new folder. The audit record `docs/security/audit-2026-11-06/findings.md` keeps its paths and line numbers as written on 2026-11-06. On each of its 5 rows, the note "(moved by Task 988 to `<the current file>`)" goes at the end of the third cell, the one that holds the path. This is amended after the executor's BLOCKED 1: at the row's end it becomes the last cell, which `ledgerFindings` (`scripts/quality/check-files.mjs:313-335`) reads as the finding's status. The exact notes:
  - A-09 (22): "(moved by Task 988 to `src/app/[locale]/(site)/auth/confirm-email/page.tsx`)"
  - P-01 (116): "(moved by Task 988 to `src/app/[locale]/admin/`)"
  - P-02 (117): "(moved by Task 988 to `src/app/[locale]/admin/listings/page.tsx`)"
  - P-03 (118): "(moved by Task 988 to `src/app/[locale]/admin/users/page.tsx` and `src/app/[locale]/admin/listings/page.tsx`)"
  - P-05 (120): "(moved by Task 988 to `src/app/[locale]/(site)/cabinet/page.tsx`)"

  This review's probe of exactly these notes (file restored, sha256 equal) → `check-files.mjs` on the file → 0 findings, exit 0. Change no other text.
- Tests and report:
  - Failing first:
    - R5-1: one new case in `src/components/admin/__tests__/AdminPermissionsManager.smoke.test.tsx`, or a new `AdminPermissionsView` test beside it. It renders the view in `sq` with `Intl.DateTimeFormat` replaced, through `vi.spyOn(Intl, 'DateTimeFormat')`, by one that throws, and expects the passed date strings and `Intl.DateTimeFormat` not called. It fails on 7ba9ef38d and passes after. This review's probe, a scratch test removed after the run, rendered the current view in `sq` with every key's `updated_at` and one event at `'2026-11-20T14:05:00Z'`. Without the stub it showed "20 nën 2026" 37 times. With the throwing stub, render did not throw, `Intl.DateTimeFormat` was called 37 times, and the text appeared 0 times.
    - R5-2: `npm test -- src/__tests__/security/clientSinks.test.ts` fails (3 cases) on 7ba9ef38d and passes after.
    - R5-3: `node scripts/quality/check-files.mjs <the 12 docs>` → 20 findings before, exit 0 after.
  - `npx vitest related --run --reporter=verbose` over the changed code files and §8.1's text search (`AdminPermissionsView`, `AdminPermissionsManager`, `updatedDates`, `eventDates`, `Header.tsx`, `adminHref`), with each found test run by §8.1's command. Also ESLint on the changed code files and `npm run typecheck`.
  - One break, restored: the view formats one date again with `useFormatter`, and the new case fails.
  - I8a in the owner's Chrome, if DevTools reaches it, otherwise in Playwright's Chromium: `/uk/admin/permissions` and `/en/admin/permissions` at 320, 640, 1024 and 1440 px, with the date texts equal to 7ba9ef38d's and no console error. Also the `AdminPermissionsView` Stories at the same widths.

## Notes (no change asked)

- UNKNOWN: `moderator /sq/admin @1280` waited 60 s for "load" and timed out. The same page passed at 390 px in the same run, and every other moderator row passed, as did `main`'s 216 rows. The log does not name what kept the page from loading. The revision's push runs the walk again. If the row fails again, it becomes a finding with the cause read from that run.
- N8: Reviews 1-5 did not reach F8-F10. Each sits where the review's tools stop:
  - F8: the owner's account language is `uk`, so the proxy sends every other slug back to `uk` (the task's own behaviour). V5a therefore never opened the admin in `sq`, and only the CI walk, signed in as an `sq` administrator, renders it.
  - F9: the glob-reading checker is outside both §8.1 searches.
  - F10: `check-files.mjs --all` is CI-only (A5).

## Open parts

- Executor: Revision 5.
- Opus, Review 7: Revision 5's diff (V1-V13), then V14 on the new run of PR #83.
- Opus, after the merge: the production checks of the kickoff's Route step 5.
