# Task 939 — Every Story renders in every locale-leak shard (folds 925)

Sprint 93 (governance reset, rewritten 2026-11-06 from the Sprint 92 version, whose diagnosis stands and whose
verification apparatus is dropped). Priority P1. Implementer: Sonnet. Reviewer: Opus.

## Goal

The CI jobs "Locale leak" 1–4 fail because two Stories crash while rendering (PR #12 run 41823787040):

1. **FavoritesShell Stories.** `useFavoritesRealtime` calls `createClient()` from `@/lib/supabase/client`
   (`src/modules/listings/hooks/useFavoritesRealtime.ts:4,54`). Storybook is built without Supabase configuration, so the
   real browser client throws and the four FavoritesShell Stories end on the error screen. `.storybook/main.ts:28-44`
   already stubs server-only modules by exact specifier; the browser Supabase client has no stub.
2. **`DashboardPeriodControl / CustomRangeTooLong`** (Task 925). Its play function waits for the Next arrow
   (`src/stories/patterns/mantine/DashboardPeriodControl.stories.tsx:103`), which exists only in the desktop picker; below
   the 640px gate the picker renders its mobile body with a Confirm button, so the play fails at the mobile widths.

After the task every Story renders at every width and locale of the six shards.

## Scope

- New `.storybook/stubs/supabase-client.ts`: exports `createClient()` returning an inert object whose `channel()` returns
  `{ on() { return this }, subscribe() { return this } }`, `removeChannel()` resolving, `from()`/`rpc()` chains
  resolving to `{ data: null, error: null }`, and every `auth` method `src/lib/auth/browser.ts` calls answering in the
  real client's signed-out shape (review 1, F2: `getUser` → `{ data: { user: null }, error: null }`, `getSession` →
  `{ data: { session: null }, error: null }`, `onAuthStateChange` → `{ data: { subscription } }`, the sign-in, sign-up,
  OTP, update and reset calls → `{ data: { user: null, session: null }, error: null }`) — no network.
- `.storybook/main.ts`: alias `'@/lib/supabase/client'` to the stub, placed **before** `'@'` (first match wins), with a
  one-line comment.
- `DashboardPeriodControl.stories.tsx`, `CustomRangeTooLong` play only: when
  `window.matchMedia(belowMobileGateQuery(theme)).matches` (the gate the picker uses), choose the start and end day in the
  mobile body and press its Confirm button; otherwise keep the desktop path. Then assert the same localized 90-day alert.
- The FavoritesShell Story's comment that claims the realtime hook "degrades gracefully" is corrected.
- Found in the Task 953 review 2 (2026-11-08): on `next@16.4.3` (Task 952) no Story renders. `useRouter` reads
  `LayoutRouterContext.parentRenderTree.data.bfcacheId` (`node_modules/next/dist/client/components/navigation.js:158`);
  `@storybook/nextjs-vite@10.4.2` provides `parentTree` and `parentCacheNode` only
  (`dist/_browser-chunks/chunk-4ZRKYE2G.js:106-121`), so every Story ends with `Cannot read properties of undefined
  (reading 'data')` (the 953 executor's locale-leak run: 0 of 4320 tuples, 1440 render errors; a clean `HEAD` build fails
  the same). `package.json` and `package-lock.json`: `storybook`, `@storybook/nextjs-vite`, `@storybook/addon-docs` and
  `eslint-plugin-storybook` move to `10.6.3` (2026-10-20, the first release whose mock sets `parentRenderTree`, read in
  its tarball; no install lifecycle hook — `eslint-plugin-storybook` has `prep` and `generate-rule` scripts only, and
  `.npmrc` sets `ignore-scripts=true`; peer `next ^14.1.0 || ^15.0.0 || ^16.0.0`), and the lockfile changes only by them.
- `scripts/check-locale-leak.mjs` (review 1, F3 and F4; defaults and the CI command unchanged): opt-in `--story=<id>`
  and `--widths=<px,px,…>`; a `page.goto` that rejects with a transport error (`net::ERR_*`) is retried once on a fresh
  page and counted as `retried` in `report.json`; a render or play failure is never retried.
- The lockfile (review 1, F1): regenerated from `HEAD`'s lockfile with `npm install --before=<a date 14 days back>`, so
  every version it brings in is at least 14 days old.
- Out of scope: product code, other Stories, the detector beyond the two flags and the retry.
- Dependencies: the four Storybook packages above at `10.6.3` (`npm view <name>@10.6.3 time scripts peerDependencies`).

## Attack surface

Unchanged: Storybook build only; the stub never reaches the Next.js build (`next build` does not read `.storybook/`).
Check: `grep -r "stubs/supabase-client" src` returns nothing.


## OWASP

Required by `node scripts/quality/owasp.mjs plan` (757270a26306, mapping of 2026-11-07).

- CI_CD_Security: "Require pull requests to be reviewed before merging and ensure this review step cannot be bypassed." — the shard fix reaches main through the pull request with CI Required green — AC2, AC4.
- Third_Party_Javascript_Management: not applicable — the stub is a module of this repository; no third-party script is added to Storybook's head or to the site.
- Cross_Site_Scripting_Prevention: "Since no single technique will solve XSS, using the right combination of defensive techniques will be necessary to prevent XSS." — the Story and stub changes render text through React escaping only; lint (react/no-danger, no-script-url) runs on them — AC4.
- DOM_based_XSS_Prevention: "It is always a bad idea to use a user-controlled input in dangerous sources such as eval." — the Story and stub changes add no eval, Function, innerHTML or computed URL; lint (no-eval, no-implied-eval) and client-sinks check them — AC4.
- GitHub_Actions_Security: not applicable — the workflow file is not edited; the CI jobs already run the shards.
- JavaScript_and_TypeScript_Security: "Keep patterns linear: avoid nested quantifiers and ambiguous alternation over the same characters." — lint and CodeQL security-extended (CI) run on every changed file — AC4.
- Nextjs_Security: not applicable — Storybook renders components only; no Server Action, route or proxy changes.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — the executor's report is input: Opus reruns every acceptance command in review — AC4.
- Software_Supply_Chain_Security: "limit the applications dependencies to a specific version that has been previously verified as legitimate and secure" — the four Storybook packages are pinned to `10.6.3`, read in its tarball, and the lockfile changes only by them — AC5.
- NPM_Security: "Always vet and perform due-diligence on third-party modules you install to confirm their health and credibility." — release date (≥ 14 days), install scripts (none) and peers read with `npm view` before the change — AC5.
- Vulnerable_Dependency_Management: "It's highly recommended to perform automated analysis of the dependencies from the birth of the project." — `npm audit --omit=dev --audit-level=high` and the CI dependency audit run on the new lockfile — AC5.
- Dependency_Graph_SBOM: "Validate the document against its format's schema before publication or ingestion" — the CI SBOM job regenerates and validates the CycloneDX document from the new lockfile — AC5.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — a claim of the report that does not reproduce in review is a finding — AC4.
- Web_Frontend_Security: "The fundamental security rule is to never use innerHTML with untrusted data." — the Story and stub changes use no innerHTML; lint (react/no-danger) fails on one — AC4.
- WebSocket_Security: "Don't assume WebSocket connection equals unlimited access. Check authorization for each action" — the Storybook stub answers channel().subscribe() without a connection; the product hook is unchanged and Realtime stays behind RLS — AC1.
- Authentication: not applicable — the Storybook stub answers signed-out shapes to Stories only; no sign-in, sign-up or session code of the product changes (`src/lib/auth/` untouched).
- Authentication_Patterns: not applicable — no authentication flow changes; the stub never reaches the Next.js build (`next build` does not read `.storybook/`).
- Authorization_Decisions_And_Output_Handling: not applicable — no access decision or returned field of the product changes; the stub answers Stories with empty data.
- Cookie_Theft_Mitigation: not applicable — the stub sets and reads no cookie; product session cookies are unchanged (Task 960 owns them).
- Credential_Stuffing_Prevention: not applicable — the stub never sends a credential anywhere; product sign-in is unchanged.
- Injection_Prevention: not applicable — the stub builds no query, command or URL; `rpc()` and `from()` chains return a fixed empty answer.
- JSON_Web_Token: not applicable — the stub holds and verifies no token; product token handling is unchanged.
- Multifactor_Authentication: not applicable — no factor or sign-in step changes; the stub answers signed-out shapes only.
- OS_Command_Injection_Defense: not applicable — the detector flags parse a Story id and widths for Playwright; no OS command is built from them.
- Query_Parameterization: not applicable — no SQL or PostgREST filter is built; the stub query builder returns a fixed empty answer.
- SQL_Injection_Prevention: not applicable — no query reaches a database from the stub or the detector.
- Session_Management: not applicable — the stub keeps no session (`getSession` answers `{ data: { session: null } }`); product sessions are unchanged.

## UI

No visible change of production UI. The Stories render their intended states instead of the error screen.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 `npm run build-storybook` exits 0; `.storybook/__tests__/supabase-client-stub.test.ts` (new) proves the stub
  makes no network call and answers `channel().on().subscribe()`, `removeChannel()`, `from()` and `auth` calls; it
  (revision 1) calls every `auth` method `src/lib/auth/browser.ts` calls and destructures each answer the way its caller
  does (`{ data: { user } }`, `{ data: { session } }`, `{ data: { subscription } }`), and restores globals in `afterEach`.
- AC2 `node scripts/check-locale-leak.mjs --mantine-only --report-only-leaks --shard=N/6` exits 0 for N = 1…6, with no
  tuple whose reason is a render or play failure (report path and counts in the report). Revision 1 (F4): a transport
  error of `page.goto` is retried once and a render or play failure never is — test:
  `scripts/__tests__/check-locale-leak.test.ts` (new: `net::ERR_NO_BUFFER_SPACE` and `net::ERR_NETWORK_IO_SUSPENDED`
  retried, "Story render/play failed" and a 15 s render timeout not; red with the retry removed).
- AC3 The play function of `CustomRangeTooLong` in `src/stories/patterns/mantine/DashboardPeriodControl.stories.tsx`
  asserts the localized 90-day alert on both the mobile and the desktop path — test (revision 1, F3: the shards run only
  320, 375 and 1280 px): `node scripts/check-locale-leak.mjs --mantine-only --report-only-leaks
  --story=patterns-mantine-dashboardperiodcontrol--custom-range-too-long --widths=320,639,640,1280` exits 0 with every
  width × locale tuple scanned and no play failure (red with `HEAD`'s play at 320, 639 and 640 px), and
  `scripts/__tests__/check-locale-leak.test.ts` (the two flags parsed; no flag keeps 320, 375, 1280 and every Story).
- AC4 `npm run lint`, `npm run typecheck`, `npm test`, `node scripts/quality/check-files.mjs --worktree` exit 0.
- AC5 Stories render on Next 16 (found in the Task 953 review 2) — test: `node scripts/check-locale-leak.mjs --mantine-only
  --report-only-leaks --shard=1/6`, red on `10.4.2` (0 tuples rendered, every Story a render failure; run it once before
  the upgrade and keep the output), then AC2's six shards green with no render or play failure. A Vitest test of the
  router decorator is not used: `@storybook/nextjs-vite` loads only inside Storybook's Vite plugin (`sb-original/*`
  aliases), and a Vitest config that fakes them would test a hand-made environment (executor's stop, 2026-11-08). Also
  `npm run check:card-track-monotonicity` finds its track Stories again (PR #19 run 42494046985: "in scope: 0 canonical
  stories rendering the track", every Story errored) and passes;
  `npm ls storybook @storybook/nextjs-vite @storybook/addon-docs eslint-plugin-storybook` prints `10.6.3` only, and
  `npm audit --omit=dev --audit-level=high` exits 0. Revision 1 (F1): `node scripts/quality/change-report.mjs
  --lockfile-age HEAD` exits 0 (every version the lockfile brings in is at least 14 days old; Task 963 AC15; red on the
  review-1 lockfile: 8 versions, `ws@8.22.2` 0 days).

## Route

1. Write the stub and the alias; build Storybook; open a FavoritesShell Story and confirm it renders.
2. Add the mobile branch to the play; check AC3.
3. Run the six shards (AC2) and AC4. Report commands, exit codes, counts.

## Review

Review 1 of the working tree on 263cbf642 — NEEDS REVISION (1 of 2)
Scope: diff-based; every file of the 939 diff read in full (`.storybook/main.ts`, the stub and its test, the two Stories,
`package.json`, every one of the 68 changed lockfile entries); OWASP record `docs/security/owasp/reviews/Task_939.json`.
Tools (2026-11-08, reviewer reruns): `owasp.mjs sync`/`check` 0 after the five sheets changed upstream were re-read
(mapping updated; Multi-Tenant's new storage requirement handed to Task 957); `check-ruleset` 0; `npm run lint` 0;
`npm run typecheck` 0; `npm test -- --coverage` 0 (371 files, 6123 tests); `changed-lines-coverage --base main` 0;
`check-files --worktree` 0; `ac-tests` PASS; `npm audit --omit=dev --audit-level=high` 0; CycloneDX `--validate` 0;
`build-storybook` with empty `NEXT_PUBLIC_SUPABASE_*` 0; AC1 test 4/4, red with the alias removed (`expected undefined`),
restored (sha 41a7a605 equal); shard 2/6 0 (720/720, 0 errors); shard 5/6 1 (719/720: `page.goto:
net::ERR_NO_BUFFER_SPACE` on `dashboardgrid--max-columns` 320 it — F4); no "reading 'data'" line. AC5 red on 10.4.2 is
the 953 review 2 measurement (0 of 4320). CI not run (nothing pushed).
Findings: Critical 0, High 0, Medium 1, Low 3.
Overall risk: Storybook-only change; the one real risk is the supply chain of the lockfile (F1).

F1 — The lockfile brings in eight transitive versions younger than 14 days
Severity: Medium      Category: Dependencies and configuration      CWE: 1357
Location: `package-lock.json` (`node_modules/storybook/node_modules/ws` and seven more)
Description: only the four direct packages were vetted; `npm install` resolved the newest version in each transitive
range: `ws@8.22.2` (published 2026-11-08 14:55 UTC, the day of the install), `is-core-module@2.18.0`, `resolve@1.22.14`,
`@napi-rs/wasm-runtime@1.2.7` (5 days), `semver@7.8.6` (6), `module-alias@2.3.5` (7), `magic-string@1.4.5`,
`probe-image-size@7.5.0` (12-13). Every range also admits a version older than 14 days.
Impact: a compromised release has had no time to be reported before it runs in every developer and CI install.
Reproduction: `node scripts/quality/change-report.mjs --lockfile-age HEAD` exits 1 with the eight lines. From `HEAD`'s
lockfile, `npm install --package-lock-only --ignore-scripts --before=2026-10-25` resolves every new version ≥ 14 days
(`ws@8.22.0`, `is-core-module@2.17.0`, `resolve@1.22.13`, `magic-string@1.4.3`, `probe-image-size@7.4.0`,
`semver@7.8.5`, `module-alias` stays 2.3.4) and its `npm audit --omit=dev` exits 0 (reviewer, scratch copy).
Recommendation: R1 — regenerate the lockfile that way (four packages stay `10.6.3`), `npm ci`, rerun AC2, AC5, card-track.
References: NPM Security, Software Supply Chain Security, `flow.md` §1.4. The gate gap (`change-report.mjs` aged only
direct dependencies) is closed in this turn: Task 963 AC15.
Status: open

F2 — The stub's auth answers do not have the real client's shape
Severity: Low      Category: Tests      CWE: —
Location: `.storybook/stubs/supabase-client.ts:5,40-49`
Description: `getUser`/`getSession` answer `{ data: null }`, the real client `{ data: { user: null } }` and
`{ data: { session: null } }`; `signInWithIdToken`, `resetPasswordForEmail`, `updateUser`, `verifyOtp`
(`src/lib/auth/browser.ts:24-56`) are missing; the comment says the shape is the real signed-out one. The kickoff's own
scope asked for `{ data: null }` (design error). `vi.unstubAllGlobals()` runs only when the test passes.
Impact: a Story whose component destructures `data.session` ends on the error screen — the class of bug this task fixes.
Reproduction: `const { data: { session } } = await createClient().auth.getSession()` throws on the stub.
Recommendation: R2 — the shapes of the revised scope; AC1's test calls each method as its caller does; globals restored
in `afterEach`; comment corrected.
Status: open

F3 — AC3's named test never runs 639 or 640 px
Severity: Low      Category: Tests
Location: `scripts/check-locale-leak.mjs:75-81` (320, 375, 1280 only); AC3
Description: the executor checked 639/640 with a scratch script that is not in the repository, so the one-month desktop
branch (640-699 px) and the 639 mobile branch have no repeatable test.
Recommendation: R3 — `--story=` and `--widths=` (opt-in, CI unchanged) and AC3's revised test.
Status: open

F4 — A transport error of the local page load counts as a render failure
Severity: Low      Category: Tests
Location: `scripts/check-locale-leak.mjs:404`
Description: `page.goto` rejections (`ERR_NO_BUFFER_SPACE` here; `ERR_NETWORK_IO_SUSPENDED` and timeouts in the
executor's runs, each on a different Story that passes alone) fail the shard; on Windows a full shard is not repeatable.
Recommendation: R4 — retry a `net::ERR_*` navigation once on a fresh page, report it, never retry a render or play
failure; AC2's revised test.
Status: open

Not findings: the shared-dependency bumps (`oxc-resolver`, `hasown`, `is-core-module`, `@emnapi/*`) all sit in the new
packages' trees and remain after R1 at ages ≥ 14 days; `npm ls` prints `10.6.3` only; no new install script
(`hasInstallScript` unchanged, `.npmrc` `ignore-scripts=true`); the 640-699 px loop is the right reading of the picker
(`RangeDatePicker.tsx:414,945`). The 948, 953, 963 kickoff and backlog edits in the worktree are Opus's, not this task's.
Revision 1 (Sonnet): R1-R4, then every AC command again; report the lockfile diff and `--lockfile-age HEAD`.

Review 2 of the working tree on 263cbf642 (revision 1) — APPROVED WITH NOTES
Scope: every file of the revision read in full (stub, its test, `check-locale-leak.mjs` and its new test, lockfile).
Tools (2026-11-09, reviewer reruns): `owasp.mjs sync` found 10 sheets changed upstream — re-read, mapping updated
(Secrets Management quote replaced, MCP spending and NPM ignore-scripts requirements mapped), the stale quotes of kickoffs
945, 956, 958, 959 replaced; then `check` 0; `check-ruleset` 0; lint 0; typecheck 0; `npm test -- --coverage` 0 (372
files, 6139 tests); changed-lines coverage 0; `check-files --all` 0 after the quote fixes; `npm audit --omit=dev
--audit-level=high` 0; `--lockfile-age HEAD` 0 (52 versions, 0 under 14 days); the lockfile regenerated by the reviewer
from `HEAD` with `--before=2026-10-25` is byte-identical, no new install script, every source the npm registry;
`npm ls` 10.6.3 only; `build-storybook` (empty `NEXT_PUBLIC_SUPABASE_*`) 0; AC1 test 5/5, red with `getSession`
answering `{ data: null }` (2 failed), restored (sha 21617c89); AC2 test red with the retry disabled (3 failed | 12
passed), restored (sha 6d347fe2); AC3 command 0 (12/12), red with `HEAD`'s play (3/12: 320, 639, 640 en), restored;
card-track 0 (19 stories, favoritesshell--populated PASS); shard 1/6 0 (729/729, 0 errors, 0 retried) and 4/6 0
(720/720, 0, 0) on the rebuilt tree, no "reading 'data'" line; the four other shards are the executor's (CI reruns all);
`product-gates` 31/34 (the three owned by Task 948); `change-report main HEAD`: see N2. CI not run (nothing pushed).
Findings: F1-F4 of review 1 fixed. New: Critical 0, High 0, Medium 0, Low 1 (N1). Note N2 (gate defect).

N1 — The detector's entry-point guard fails open through a symlinked path
Severity: Low      Category: Error handling (fail closed)      CWE: 636
Location: `scripts/check-locale-leak.mjs:666` (revision 1)
Reproduction: run through a junction of the repository: exit 0, no output, nothing scanned (`argv[1]` keeps the link,
`import.meta.url` is the real path). CI's checkout has no link, so today's gate held.
Status: fixed by Opus in this turn under Task 963 AC17 (both sides compared as real paths; test "entry point" red before).

N2 — `ac-tests.mjs` took open kickoffs 957, 962, 965 for implemented tasks through tests other tasks added, so PR #19's
change report could not pass before they land. Status: fixed by Opus in this turn, Task 963 AC16. The report's only
other line, `next-cloudinary@7.0.0` (13 days), is the owner's D3 exception and turns 14 days at 2026-11-09 18:01 UTC.
