# Task 988 — Review 9

Kickoff: [Sprint_94_kickoff_prompt_Task_988_The_Chosen_Language_Stays.md](../../tasks/Archive/Sprint_94_kickoff_prompt_Task_988_The_Chosen_Language_Stays.md) · OWASP record: [Task_988.json](../security/owasp/reviews/Task_988.json)

Review 9 of Revision 6 (`git diff bbabe3d45` and the new test files, branch `task/988-chosen-language-stays`, pull request #83) — APPROVED
Scope: the Revision 6 block of the kickoff (R6-1, R6-2, R6-3), for Review 8's F11, F12 and F13.
Tools:
- `git diff`, `git status`, `sha256sum`;
- `npx vitest run` and `npx vitest list --filesOnly`;
- ESLint on the changed code files, `npm run typecheck` once, `check-files.mjs` on the changed files;
- `owasp.mjs sync`, `check` and `review`, `check-ruleset.mjs`, `gh run list`;
- copy-and-restore breaks of the product lines, sha256 equal after each;
- `compareToBaseline` of `scripts/check-surface-census-changed.mjs`, called with a planted block (the census itself is a CI check, A5).

Findings: Critical 0, High 0, Medium 0, Low 0
Overall risk: the revision changes one test file and one baseline file, and adds four tests. No product line changes: `git status` of `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/[locale]/layout.tsx` and `src/app/[locale]/(site)/layout.tsx` is clean. Each new test fails when the product line it reads is broken. The baseline matches the set CI measured, and it still reports a planted block.

## Checklist V

- V1:
  - `owasp.mjs sync` → "142 sheets at 5254440ecf1a … changed 0";
  - `owasp.mjs check` → exit 0;
  - `check-ruleset.mjs` → "the live ruleset matches";
  - `main` CI: the last three runs on aacf6ebce are `success`;
  - pull request #83 head: bbabe3d45.
- V2: `git diff --stat bbabe3d45` → `scripts/surface-census-baseline.json` (R6-2) and `src/components/admin/__tests__/AdminLocaleSwitcher.locale.test.tsx` (R6-1), plus Opus's `docs/backlog.md` and the kickoff. Untracked: the four tests of R6-3 and Opus's review files. No file outside the Scope.
- V3: every claim of the report reproduced:
  - the six sha256 values of the report equal the tree's;
  - the five tests → "5 passed, 10 passed"; `vitest list --filesOnly` lists all five, so the full CI run picks them up;
  - ESLint on the five test files → exit 0;
  - `check-files.mjs` on the nine changed files → "0 finding(s)";
  - lines matching `typeof window` in the R6-1 file → 0;
  - the R6-2 check → 268 entries, the 9 blocks of F12 present, the 7 stale keys absent, the locale layout's own key kept;
    against bbabe3d45: 7 keys removed and 9 added, every value `{ reasonCode }` only, a final newline;
  - the report's extra run: `pureLibs.test.ts`, `adminSlug.test.tsx` and `robots.test.ts` → "3 passed, 112 passed".
    `pureLibs.test.ts:20-21` reads the folders of `src/app/[locale]` and `(site)`, and skips names that start with `_`, so the new `__tests__` folders are not taken for routes.
  - `npm run typecheck` → exit 1: 80 errors, all in `.next/types/validator.ts`. That file is from 2026-11-21 and ignored by Git (`git check-ignore`), and the errors are `Type 'Route' does not satisfy the constraint 'LayoutRoutes'`; `src` has 0. CI's `TypeScript` step, on a fresh checkout, passed on bbabe3d45 (run 45898290625, step 10).
- V4: every changed file read in full:
  - R6-1 replaces the three guard lines with one `vi.stubGlobal('matchMedia', …)` line; the comment stays.
  - R6-2 renames 7 keys in place and adds 2 at the end of `blocks`.
  - The four tests run in the `node` environment and read the element tree:
    - `rootLayout.test.tsx`: `lang` `uk` from the header, `sq` without it;
    - `rootPage.test.ts`: `NEXT_REDIRECT /it`;
    - `localeLayout.test.tsx`: `NextIntlClientProvider` with `locale` `en`, the messages and the children, `setRequestLocale('en')`; `xx` rejects with `NEXT_NOT_FOUND` before `setRequestLocale`;
    - `siteLayout.test.tsx`: the title; `initialUser` is the session's user; the frame is `Header`, `main` with the children, `Footer`, `WebVitalsReporter`, `PerformanceStoreInit`, `PerfDevOverlay`, matched by identity of the mocked components.

  Each item removes its finding's cause.
- V5: no product file changed (V2); what `main` does is unchanged by this revision.
- V5a: not applicable. No visible element changed: the diff holds no product, Story or style file (V2).
- V6: one baseline changed, `scripts/surface-census-baseline.json`. Its comparator `compareToBaseline` (`scripts/check-surface-census-changed.mjs:179-194`) matches by exact key. Called with the new baseline:
  - the set CI measured on the three surfaces (the 9 blocks of F12 and `src/app/[locale]/layout.tsx`'s own block) → 0 new, 0 stale;
  - the same set plus 4 planted blocks → all 4 reported new:
    - a new node under `(site)/layout.tsx`;
    - a new node under the statistics page;
    - `Header.tsx` back under `src/app/[locale]/layout.tsx`;
    - `(site)/layout.tsx` itself with another reason code.

  The two added keys are owner decision O988-6.
- V7: `.claude/rules/secure-code-review.md`.
  - §2: (1) existing controls unchanged, no test weakened: R6-1 keeps both [AC5] tests, and R6-3 only adds tests; (2) no new vector; (3) no trust boundary crossed; (4) no package; (5) CI: no workflow changed; (6) no secret, no log.
  - §3, every category not touched. Fact: the diff holds only test files and the census baseline (V2). No product, data, role, upload, configuration or dependency file.
- V8: each acceptance line of R6-3 was broken once in its product file, its test run, the file restored (sha256 equal each time; `git status` of the four files clean after):

  | Break | Test | Result |
  |---|---|---|
  | `src/app/layout.tsx` `?? 'sq'` → `?? 'en'` | rootLayout | 1 failed, 1 passed |
  | `src/app/layout.tsx` `lang={locale}` → `lang="sq"` | rootLayout | 1 failed, 1 passed |
  | `src/app/page.tsx` redirect → `'/sq'` | rootPage | 1 failed |
  | `src/app/[locale]/layout.tsx` `{children}` removed | localeLayout | 1 failed, 1 passed |
  | `src/app/[locale]/layout.tsx` `notFound()` removed | localeLayout | 1 failed, 1 passed |
  | `(site)/layout.tsx` `<Footer />` removed | siteLayout | 1 failed, 2 passed |
  | `(site)/layout.tsx` `initialUser={null}` | siteLayout | 1 failed, 2 passed |
  | `(site)/layout.tsx` `{children}` in `main` removed | siteLayout | 1 failed, 2 passed |

- V9: no Story changed.
- V10: `owasp.mjs review <kickoff> --base main` → exit 0. The record's `Secure_Code_Review` and `Secure_Coding_with_AI` evidence now name Reviews 8 and 9.
- V11: no finding.
- V12: this file, linked in the kickoff's "## Review".
- V13: APPROVED.
- V14: after the owner's push, `gh pr checks 83`.
  - `UNKNOWN` until then: `governance`, `governance:ssr`, `check:surface-census:changed` and the changed-line coverage. These are CI checks (A5).
  - INFERENCE: the new tests fall outside coverage's `include` (vitest `coverage.exclude` lists `src/**/__tests__/**`), and they run every listed line of F13 (V8). Whether they are counted is for CI to show.

## Notes (no change asked)

- N11: the report's typecheck exit code was 2 (`tsc`), and here it was 1 (`npm run -s`). Same 80 errors, same file.
- N12: the R6-2 check of the report is a scratch file, not `node -e` (the report's deviation); this review ran its own check (V3).

## Production (after the merge, 2026-11-26)

Merged in PR #83 as `36fc0c07f`; `main` CI run 45905563415 and Scorecard 45905563326 green. The checks of the kickoff's Route step 5 on `https://lero.al`:
- Guest, with `curl`, listing `qera-apartament-11-lqeni-i-tiranes-kompleksi-nobis-mwtdj43u`:
  - `/uk` → 200 with `Set-Cookie: lero_ui_locale=uk; Path=/; Secure; HttpOnly; SameSite=lax` (no `Max-Age`: a session cookie);
  - the same session pastes `/sq/listings/<slug>` → 307 to `/uk/listings/<slug>`, which renders `<html lang="uk"`;
  - after a browser restart (no cookie), `/sq/listings/<slug>` → 200 and `lero_ui_locale=sq`; `/` → 307 to `/sq`.
- Signed in, the owner's Chrome session: an administrator whose account language is `uk`. An agent account was not available, so the agent role's own pages were not walked (`UNKNOWN`); the language rules below are the same for every signed-in person.
  - `/sq/listings/<slug>` → `/uk/listings/<slug>`; `/` → `/uk`; `/cabinet` and `/sq/cabinet` → `/uk/cabinet`; `/en/cabinet?tab=listings` → `/uk/cabinet?tab=listings`. Each lands with 200 and `lang="uk"`.
  - The notification bell on `/sq` (redirected to `/uk`): its items link to `/uk/cabinet?tab=searches` and `/uk/listings/test1-mqidv5is`.
  - `/admin/users` → `/uk/admin/users`, `lang="uk"`, title "Користувачі — Admin".

## Open parts

- None for Task 988. An agent account's walk on production stays `UNKNOWN` (no agent session in the owner's browser).
