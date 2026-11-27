# Task 988 — Review 8

Kickoff: [Sprint_94_kickoff_prompt_Task_988_The_Chosen_Language_Stays.md](../../tasks/Archive/Sprint_94_kickoff_prompt_Task_988_The_Chosen_Language_Stays.md) · OWASP record: [Task_988.json](../security/owasp/reviews/Task_988.json)

Review 8 of pull request #83 at bbabe3d45 (branch `task/988-chosen-language-stays`, the tree Review 7 approved) — NEEDS REVISION
Scope: checklist V14 on the pull request. `gh pr checks 83` → CI run 45898290625 with three red jobs: `Lint, types and product checks`, `Unit and component tests`, and `CI Required`, which fails because of the other two. Every other check passed, among them `Click-shield` (so F8 is gone from the signed-in walk) and the OWASP task gate. No new diff: this review reads the failed logs and the code they name.
Tools:
- `gh pr checks 83`.
- `gh run view 45898290625 --job <id> --log-failed` and `--log` for jobs 140177545496 and 140177545856; `gh api repos/:owner/:repo/actions/jobs/<id>` for their steps.
- Probes in this tree, each removed or restored after its run (sha256 equal): a matchMedia stub in one test file; a dry run of the census baseline edit; a scratch test of the four layout and page files.

Findings: Critical 0, High 0, Medium 0, Low 3
Overall risk: the first CI run of the pull request stopped each job at its first red step: `check-files.mjs --all` in the quality job, and the test run in the unit job. The steps after them, the product checks and the changed-line coverage, ran for the first time on bbabe3d45, and three of their checks fail on Task 988's own diff:
- a test of the task trips the SSR scanner;
- the census baseline did not follow the layout's move;
- four changed files have no test that runs them.

None changes what the product does.

## Checklist V

- V1-V13: Review 7 stands for the diff; this review adds no diff.
- V14: `gh pr checks 83` → 3 failing, 21 passing.
  - `Lint, types and product checks` (job 140177545496): steps 1-18 succeeded, including `check-files.mjs --all` (F10 fixed). Step 19 `node scripts/quality/product-gates.mjs` → "33 of 36 product checks passed. Failed: npm run governance, npm run governance:ssr, npm run check:surface-census:changed" (F11, F12).
  - `Unit and component tests` (job 140177545856): step 8, tests with coverage, succeeded. Step 9, `node scripts/quality/changed-lines-coverage.mjs --base "$base"`, → "234/266 executable changed line(s) covered (88.0%)", and four files fail (F13).
  - `Click-shield`: passed in 18m41s. The `admin /sq/admin/permissions` rows failed in run 45877879937 and pass here. The `moderator /sq/admin @1280` timeout of that run did not repeat.

## Findings

F11 — a test of the task uses `typeof window`, which the SSR scanner reports as HIGH
Severity: Low      Category: Governance (SSR scan)      CWE: —
Location: `src/components/admin/__tests__/AdminLocaleSwitcher.locale.test.tsx:29-31` (added by Task 988 in 913e9c65d); the scanner `scripts/governance/scan-ssr.mjs:85,106-120`
Description: rule S2 reports `typeof\s+window` on any line of a `.tsx` under `src/app`, `src/components` or `src/modules` (`isReactComponent`), test files included. The test guards its matchMedia stub with `if (typeof window.matchMedia !== 'function') { window.matchMedia = … as unknown as typeof window.matchMedia }`. That is two matching lines and one reported finding, `:30`, against a baseline with 0 SSR debt. No other test or Story under those folders contains `typeof window` (grep). Nine tests in `src/components/admin/__tests__` stub it with `vi.stubGlobal('matchMedia', …)`.
Impact: `npm run governance` and `npm run governance:ssr` fail, so the pull request cannot merge. The product is not affected. The scanner reading test files is a scanner defect: Task 1070. The project rule is "fix the scanner, never the baseline" (CI output, `docs/governance-enforcement.md` §3). This finding removes the task's own trigger instead, which needs neither.
Reproduction: CI run 45898290625, job 140177545496: "ssr :: src/components/admin/__tests__/AdminLocaleSwitcher.locale.test.tsx :: typeof window in component — 1 now, 0 in baseline".
Recommendation: Revision 6, R6-1. This review's probe of R6-1 (file restored, sha256 equal): the test → 2/2; ESLint → exit 0; lines matching `/typeof\s+window/` → 0.
References: checklist A2, A4.
Status: open

F12 — the census baseline keeps the site frame's debt under the layout it left
Severity: Low      Category: Governance (surface census)      CWE: —
Location: `scripts/surface-census-baseline.json:133-152` (7 keys `src/app/[locale]/layout.tsx :: <node> :: tier1-unenrolled-or-unstoried`); the moved code, `src/app/[locale]/(site)/layout.tsx`; the moved page, `src/app/[locale]/(site)/cabinet/statistics/page.tsx`
Description: R2-1 renamed 174 baseline keys to follow the move, paths only (`git diff --stat main -- scripts/surface-census-baseline.json` → 174 insertions, 174 deletions). Two cases were not covered:
- Header, Footer, AuthContext, NotificationBell and the three performance components moved from `src/app/[locale]/layout.tsx` into the new `src/app/[locale]/(site)/layout.tsx`. Their 7 keys stayed on the old surface.
- The census also measures the new layout file itself, and the statistics page under its new path. `main`'s baseline has no key for that page (`git show main:scripts/surface-census-baseline.json`, grep `statistics` → none).

Impact: `check:surface-census:changed` fails with "9 block(s) not in the baseline" and "7 stale baseline entr(ies)", so the pull request cannot merge. The product is not affected.
Reproduction: CI run 45898290625, job 140177545496, the two lists of the failing gate.
Recommendation: Revision 6, R6-2. Owner decision O988-6 (2026-11-26): the two new blocks are recorded as existing debt, and their Stories and enrolment are Task 1069. This review dry-ran R6-2's edit on the file without writing it: 266 → 268 entries; the 9 blocks of the CI list present; the 7 stale keys gone; `src/app/[locale]/layout.tsx :: src/app/[locale]/layout.tsx` kept. Only `scripts/check-surface-census-changed.mjs` reads the file (grep over `scripts`, `src`, `.github`).
References: kickoff R2-1, O988-6; `docs/storybook-governance.md` §15.7.
Status: open

F13 — four changed files of the task have no test that runs them
Severity: Low      Category: Tests (changed-line coverage)      CWE: —
Location:
- `src/app/[locale]/(site)/layout.tsx:14-17,23,25-40`;
- `src/app/[locale]/layout.tsx:28`;
- `src/app/layout.tsx:34,36`;
- `src/app/page.tsx:8`;
- the gate, `scripts/quality/changed-lines-coverage.mjs:1-10`.

Description: the gate fails "when any changed source file has executable added lines and none of them runs in a test". Each of these files was changed by Task 988:
- the new site layout, with the frame moved out of the locale layout;
- the locale layout, reduced to the language provider;
- the root layout, which reads the language from the `X-NEXT-INTL-LOCALE` header only, the `admin-locale` cookie gone;
- the root page, which redirects to the site's default language, the cookie gone.

No test imports any of them (grep for their import paths in `*.test.*`).
Impact: `Unit and component tests` fails, so the pull request cannot merge. The behaviours these lines carry (the root `lang`, the `/` fallback, the site frame) have no test.
Reproduction: CI run 45898290625, job 140177545856: "src/app/[locale]/(site)/layout.tsx: none of 21 changed executable line(s) runs in a test", and the same for the other three files.
Recommendation: Revision 6, R6-3. This review's scratch test, run with `npx vitest run` and then removed: `src` clean after, 4/4 passed. It mocked `next/font/google`, `next/headers`, `next/navigation`, `next-intl/server`, `@/modules/admin/lib/settings` and `@/lib/auth/server`, and asserted:
- `RootLayout`'s element `lang` was `uk` with the header and `sq` without it;
- `RootPage()` rejected with `NEXT_REDIRECT /it` for a default of `it`;
- `LocaleLayout` returned the provider with `locale` `en` and the children, and rejected with `NEXT_NOT_FOUND` for `xx`;
- `SiteLayout` exported the metadata title "Lero.al — Real estate marketplace in Albania" and returned `AuthProvider` with `initialUser` `null`.
References: `quality-gates.md` §8; checklist A2.
Status: open

## Revision 6 (executor)

The kickoff's "Revision 6" block holds these items. The revision starts from the pushed commit bbabe3d45.

- R6-1 (F11): in `src/components/admin/__tests__/AdminLocaleSwitcher.locale.test.tsx`, the three lines of the `if (typeof window.matchMedia !== 'function') { … }` block in `beforeEach` become one line:
  `vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() })))`
  The comment above it stays. No other line changes.
- R6-2 (F12): `scripts/surface-census-baseline.json`, by hand as R2-1 did (paths only; `--update-baseline` is not run, A5).
  - Each of the 7 keys `src/app/[locale]/layout.tsx :: <node> :: tier1-unenrolled-or-unstoried` changes its surface to `src/app/[locale]/(site)/layout.tsx`, in place, with the value unchanged. The 7 nodes are `src/components/layout/Footer.tsx`, `src/components/layout/Header.tsx`, `src/components/shared/PerfDevOverlay.tsx`, `src/components/shared/PerformanceStoreInit.tsx`, `src/components/shared/WebVitalsReporter.tsx`, `src/modules/auth/context/AuthContext.tsx` and `src/modules/notifications/components/NotificationBell.tsx`.
  - Two keys are added at the end of `blocks` (O988-6), each with the value `{ "reasonCode": "tier1-unenrolled-or-unstoried" }`:
    - `src/app/[locale]/(site)/layout.tsx :: src/app/[locale]/(site)/layout.tsx :: tier1-unenrolled-or-unstoried`
    - `src/app/[locale]/(site)/cabinet/statistics/page.tsx :: src/app/[locale]/(site)/cabinet/statistics/page.tsx :: tier1-unenrolled-or-unstoried`
  - The key `src/app/[locale]/layout.tsx :: src/app/[locale]/layout.tsx :: tier1-unenrolled-or-unstoried` stays. 2-space JSON, a final newline, 268 entries.
- R6-3 (F13): one test file per tested file. Each mocks only what it needs:
  - `src/app/__tests__/rootLayout.test.tsx`: `lang` `uk` with `X-NEXT-INTL-LOCALE: uk`, `sq` without the header.
  - `src/app/__tests__/rootPage.test.ts`: `RootPage()` redirects to `/<getDefaultSiteLocale()>`.
  - `src/app/[locale]/__tests__/localeLayout.test.tsx`: the provider gets the slug's locale and the children; an unknown slug → `notFound()`.
  - `src/app/[locale]/(site)/__tests__/siteLayout.test.tsx`: `metadata.title`; `resolveSession()`'s user reaches `AuthProvider`'s `initialUser`; the tree holds `Header`, a `main` with the children, `Footer`, `WebVitalsReporter`, `PerformanceStoreInit` and `PerfDevOverlay`. Render with those six as named doubles, or read the element tree.

  No product line changes.
- Tests and report:
  - Failing first:
    - R6-3: each new test fails when its assertion's product line is changed once (e.g. `?? 'sq'` → `?? 'en'`; the redirect target; `{children}` removed; `<Footer />` removed) and passes when restored.
    - R6-1: `node -e` counting the lines of the test file that match `/typeof\s+window/` → 2 before, 0 after; the test → 2/2.
    - R6-2: a `node -e` check that the 9 keys of F12's CI list are present, the 7 stale keys absent, and the file parses: before false, after true.
  - `npx vitest related --run --reporter=verbose` over the changed files and §8.1's text search (`rootLayout`, `RootPage`, `LocaleLayout`, `SiteLayout`, `surface-census-baseline`, `AdminLocaleSwitcher.locale`), each found test run by §8.1's command.
  - ESLint on the changed and new code files; `npm run typecheck`; `check-files.mjs` on every changed file.
  - `npm run governance`, `check:surface-census:changed` and the coverage step are CI checks (A5): not run locally; V14 reads them.

## Notes (no change asked)

- N10: Reviews 1-7 read V14's red jobs only up to each job's first failing step. The quality job runs `check-files.mjs --all` (step 12) before the product checks (step 19), and the unit job runs the tests (step 8) before the coverage gate (step 9). F11-F13 were therefore not visible until F9 and F10 were fixed.
- Task 1069 (O988-6) and Task 1070 (scanner) are filed to Sprint 94 (`docs/backlog.md`, checklist A4).

## Open parts

- Executor: Revision 6.
- Opus, Review 9: Revision 6's diff (V1-V13), then V14 on the new run of PR #83.
- Opus, after the merge: the production checks of the kickoff's Route step 5.
