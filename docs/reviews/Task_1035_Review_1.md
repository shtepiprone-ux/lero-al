# Task 1035 — Review 1

Kickoff: [Sprint_94_kickoff_prompt_Task_1035_Synthetic_Listings_Are_Never_Public_Or_Indexed.md](../../tasks/Sprints/Sprint_94_kickoff_prompt_Task_1035_Synthetic_Listings_Are_Never_Public_Or_Indexed.md) · OWASP record: [Task_1035.json](../security/owasp/reviews/Task_1035.json)

Review 1 of the working tree on 1e37f942a (uncommitted) — APPROVED
Scope: `src/modules/listings/lib/indexing.ts` (new), the `.not` line and constraint in `visibility.ts`, the `noindex` branch of the listing page's `generateMetadata`, the AC tests, and the two query doubles of Opus's Scope amendment (after the executor's BLOCKED report): exactly the Fix.
Findings: Critical 0, High 0, Medium 0, Low 0
Overall risk: synthetic listings leave every public read and get `noindex`; every real listing is listed as before (proven on the real database).

## Checklist V

- V1: `owasp.mjs sync` → exit 0; `check` → exit 0; `check-ruleset.mjs` → exit 0; `gh run list --branch main --limit 1` → success.
- V2: `git diff --stat HEAD` → 9 files (the kickoff line is Opus's amendment) plus 3 new files; nothing outside the amended Scope.
- V3: the kickoff's Route step 4 line → exit 0, 8 files, 215 passed (reproduces). Breaks, each restored: AC2's pattern unescaped (`'zz_synth_%'`) →
  exit 1, 2 failed; AC3's metadata branch removed → exit 1, 1 failed; the executor's `.not` break (9 failed) stands from the report. The executor's
  first report said `AdminListingsTable.smoke.test.tsx` accepted `not`; Opus's run of every consumer showed it failing (2 tests), so the Scope was
  amended before the fix: a claim that did not reproduce, corrected in the design, not a defect of the diff.
- V4: `indexing.ts` holds the prefix, the LIKE pattern with both underscores escaped, `isSyntheticListingSlug` (startsWith) and `isListingIndexable`
  (the one question for a future IndexNow); `visibility.ts:170` adds `.not('slug', 'like', …)` after the status and expiry filters; the page answers
  `noindex, nofollow` for a synthetic slug before its database read (accepted: a synthetic slug costs no read). `robots.ts` unchanged.
- V5, V5a: no visible element changes; a non-synthetic listing's metadata is unchanged (AC3's second case).
- V6: no exemption added; `scripts/check-listing-visibility.mjs` keeps its anchor (`visibility.ts:9`), read not run (CI gate).
- V7: Business logic — touched (the public-listing invariant; T1, T2 tested); Data exposure — touched (test data no longer published); Next.js entry
  points — the page's metadata only; every other category not touched. The tests of every `applyPublicVisibility` consumer (`src/modules/listings`,
  `src/modules/admin/dashboard`, `src/modules/cabinet/statistics`, `src/app/[locale]/listings`, `src/app/admin`, `AdminListingsTable`, `src/app/api/listings`,
  `src/app/api/cron`, `src/app/__tests__`, `serverEntryGuards`) → exit 0, 125 files, 1917 passed.
- V8: AC4 on the real database (`SECURITY_TEST_TARGET=development npx vitest run --config vitest.integration.config.ts src/tests/integration/syntheticListingsHidden.integration.test.ts`)
  → exit 0, 2 passed: the active synthetic listing is read by its slug and by status and expiry alone, and not by `applyPublicVisibility`; the public
  set equals status-and-expiry minus synthetic slugs, none with `_`. After the run: 0 synthetic listings, 0 synthetic accounts.
- V9: no Story.
- V10: `owasp.mjs review <kickoff> --base main` → the diff's sheets and the kickoff's, each with a verdict in `Task_1035.json`.

## Open parts of Opus and the owner

- Owner: commit, push and open the pull request; Opus: V14 (`gh pr checks <n>`), then H7. After the merge and the next CI integration run, Opus reads
  `https://lero.al/sitemap/0.xml` for `zz_synth_` (expected 0).
