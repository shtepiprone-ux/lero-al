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
  `{ on() { return this }, subscribe() { return this } }`, `removeChannel()` resolving, and `from()`/`auth` calls
  resolving to `{ data: null, error: null }` — no network.
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
  its tarball; no install script; peer `next ^16.0.0`), and the lockfile changes only by them.
- Out of scope: product code, other Stories, the detector.
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

## UI

No visible change of production UI. The Stories render their intended states instead of the error screen.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 `npm run build-storybook` exits 0; `.storybook/__tests__/supabase-client-stub.test.ts` (new) proves the stub
  makes no network call and answers `channel().on().subscribe()`, `removeChannel()`, `from()` and `auth` calls.
- AC2 `node scripts/check-locale-leak.mjs --mantine-only --report-only-leaks --shard=N/6` exits 0 for N = 1…6, with no
  tuple whose reason is a render or play failure (report path and counts in the report).
- AC3 The play function of `CustomRangeTooLong` in `src/stories/patterns/mantine/DashboardPeriodControl.stories.tsx`
  asserts the localized 90-day alert on both the mobile and the desktop path; `node scripts/check-locale-leak.mjs
  --mantine-only --report-only-leaks --shard=N/6` runs it at 320, 639, 640 and 1280 px in sq, en, uk, it with no play
  failure.
- AC4 `npm run lint`, `npm run typecheck`, `npm test`, `node scripts/quality/check-files.mjs --worktree` exit 0.
- AC5 Stories render on Next 16 (found in the Task 953 review 2) — test: `.storybook/__tests__/next-router-mock.test.ts`
  (new): the `LayoutRouterContext` value of the installed `@storybook/nextjs-vite` holds `parentRenderTree.data`, the
  field `next/navigation` `useRouter` reads (red on `10.4.2`); AC2's six shards with no tuple failing on "reading 'data'";
  `npm run check:card-track-monotonicity` finds its track Stories again (PR #19 run 42494046985: "in scope: 0 canonical
  stories rendering the track", every Story errored) and passes;
  `npm ls storybook @storybook/nextjs-vite @storybook/addon-docs eslint-plugin-storybook` prints `10.6.3` only, and
  `npm audit --omit=dev --audit-level=high` exits 0.

## Route

1. Write the stub and the alias; build Storybook; open a FavoritesShell Story and confirm it renders.
2. Add the mobile branch to the play; check AC3.
3. Run the six shards (AC2) and AC4. Report commands, exit codes, counts.

## Review
