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
- Out of scope: product code, other Stories, the detector.
- Dependencies: none.

## Attack surface

Unchanged: Storybook build only; the stub never reaches the Next.js build (`next build` does not read `.storybook/`).
Check: `grep -r "stubs/supabase-client" src` returns nothing.

## UI

No visible change of production UI. The Stories render their intended states instead of the error screen.

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

## Route

1. Write the stub and the alias; build Storybook; open a FavoritesShell Story and confirm it renders.
2. Add the mobile branch to the play; check AC3.
3. Run the six shards (AC2) and AC4. Report commands, exit codes, counts.

## Review
