# Task 670 — HeroSearch `ssr:false` fallback → Mantine, with measured first-paint geometry parity

**Status:** IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW
**Kickoff:** `tasks/kickoff_prompt_Task_670_HeroSearch_SSR_Fallback_Mantine_Geometry.md`
**QA profile:** Q3 — Full Visual Matrix

---

## 1. Files Changed

| Path | Action | Reason |
|---|---|---|
| `src/components/shared/HeroSearchFallback.tsx` | create | Presentational, prop-free Mantine fallback (`Box`+`Skeleton`), extracted so it can be canonically story-rendered and enrolled in the migration manifest (R2). |
| `src/components/shared/HeroSearchClient.tsx` | modify | `loading:` now returns `<HeroSearchFallback />` instead of the raw Tailwind `<div>`; everything else (import specifier, `ssr:false`, `m.HeroSearch → default` mapping, exported component name/signature) byte-identical. |
| `src/stories/mantine/primitives/HeroSearch.stories.tsx` | modify | Added `export const Fallback` (statically imports `HeroSearchFallback`); corrected both stories' hero wrapper background from the stale pre-Task-659 gradient to the production solid coral (`var(--primary)`); corrected the stale "Same hero wrapper classes" comment. |
| `scripts/mantine-migration-scope.json` | modify | Appended `src/components/shared/HeroSearchFallback.tsx` (existing 10 entries untouched, order preserved). |
| `scripts/check-stories-rendered.mjs` | modify | Registered `mantine-primitives-herosearch--fallback` in `ASSERT_STORIES` with a `{ type: 'testid', value: 'hero-search-fallback' }` anchor. Additive only — no existing entry, viewport set, or assertion logic changed. |
| `scripts/task670-qa-hero-fallback-geometry.mjs` | create | `--baseline`/`--verify` measurement harness (§13.3 of the kickoff), modelled on `scripts/task668-qa-grid-1440.mjs`. |
| `docs/backlog.md` | **not modified — `BACKLOG LIMIT BREACH`** | Already 88 lines (over the ~80-line hard limit) before this task touched anything; see §12. |
| `docs/sessions/2026-07-27-task670-hero-fallback-mantine-geometry.md` | create | This file. |

`src/app/[locale]/page.tsx` and `src/components/shared/HeroSearchView.tsx`: **zero diff lines**, confirmed by `git status --short` above (neither path appears).

---

## 2. Requirement / acceptance-criteria evidence

| Req | AC | Evidence |
|---|---|---|
| R1 | AC1 | `grep -c 'className=' src/components/shared/HeroSearchFallback.tsx src/components/shared/HeroSearchClient.tsx` → `0` / `0`. `grep -n "<div\|<span"` on both files → no matches. `HeroSearchFallback.tsx` composes only `Box`/`Skeleton` from `@mantine/core`. |
| R2 | AC2 | `npm run check:story-coverage` → exit 0, **11/11** covered (10 pre-existing + `HeroSearchFallback.tsx`, statically imported by `Mantine/Primitives/HeroSearch`'s `Fallback` export). |
| R3 | AC3/AC4 | `task670-qa-hero-fallback-geometry.mjs --baseline` (pre-change) then `--verify` (post-change): 60/60 cells at `\|fallbackHeight − realHeight\| = 0px` (≤ 1px tolerance), every cell's delta ≤ its own baseline delta. See §4 for both tables verbatim. |
| R4 | AC5 | `HeroSearch.stories.tsx` diff: both `Default` and `Fallback` wrappers now `style={{ background: 'var(--primary)' }}` (was `bg-gradient-to-br from-brand-950 via-primary/80 to-brand-950`); `py-16 md:py-24` padding untouched; stale comment replaced with an accurate one citing `page.tsx:27`. |
| R5 | AC6 | `HeroSearchClient.tsx` diff: `dynamic()` call retains `ssr: false`, same `import('@/components/shared/HeroSearch')` specifier, same `m.HeroSearch → default` mapping, same exported `HeroSearchClient` name/signature (no args, no props). `git status --short` shows no `page.tsx` entry. |
| R6 | AC7 | `ASSERT_STORIES` entry added (additive) with a `testid` anchor; `screenshots:assert -- --mantine-only` includes the new story and passes (see §6). |
| R7 | AC8 | Geometry harness covers all 14 canon widths + `band-700`, × 4 locales (60 cells); Storybook capture done at those cells for both `Default`/`Fallback`. |
| R8 | AC9 | `npm run build` → exit 0, 40/40 static pages, fresh transcript (§7). |
| R9 | AC10 | `npm run check:file-integrity` → exit 0 (6 files). `npm run check:mojibake` → exit 0 (1977 files, 0 artifacts). |
| R10 | AC4 escalation | Not triggered — every cell reached ≤ 1px (in fact 0px) using only existing Mantine breakpoint props (`h={{ base, sm, md }}`) and the existing `radius="lg"` token. No bespoke breakpoint, magic constant, or new allowlist entry was needed. |

---

## 3. Current vs required behavior

- Preserved: `HeroSearchClient` `'use client'` module, single export `HeroSearchClient`, mounted once at `page.tsx:38`; `next/dynamic` `ssr:false` load of `@/components/shared/HeroSearch`'s named `HeroSearch` export; placeholder occupies the same hero slot with no text and no interactive control; real `HeroSearchView` replaces it in place once resolved.
- Changed: the placeholder is now `<HeroSearchFallback />` (`Box maw={768} mx="auto" w="100%"` + `Skeleton radius="lg" h={{ base: 279, sm: 175, md: 123 }}`), replacing the raw `<div className="w-full max-w-3xl mx-auto h-[76px] rounded-2xl bg-background/10 animate-pulse">`. Height now varies by breakpoint (measured) instead of a flat `76px`.
- Negative flows (kickoff §11): Offline/slow-network — fallback remains visible indefinitely at its measured height, no crash, no collapse to 0px (unaffected by this change, structurally the same `next/dynamic` behavior). JS disabled — fallback is still the **permanent** rendered state; unchanged pre-existing limitation, not fixed by this task. Hydration — see §8 (clean after a fresh server restart). Validation/Authorization/RLS/Concurrent-writer/RTL: N/A, unchanged from the kickoff's applicability table.

---

## 4. AC3 (before) / AC4 (after) tables — verbatim

Both captured by `node scripts/task670-qa-hero-fallback-geometry.mjs`. Heights identical across all 4 locales in this task's fixture (2-location list, `activeFiltersCount=2`, no typed content — kickoff A1).

### AC3 — baseline (unmodified tree; current fallback is the raw `h-[76px]` `<div>`)

| Width (name) | realHeight | fallbackHeight (current) | delta |
|---|---:|---:|---:|
| 320 (w320) | 279px | 76px | −203px |
| 375 (w375) | 279px | 76px | −203px |
| 390 (w390) | 279px | 76px | −203px |
| 480 (w480) | 279px | 76px | −203px |
| 560 (w560) | 279px | 76px | −203px |
| 680 (w680) | 175px | 76px | −99px |
| 700 (band-700) | 175px | 76px | −99px |
| 768 (w768) | 123px | 76px | −47px |
| 810 (w810) | 123px | 76px | −47px |
| 960 (w960) | 123px | 76px | −47px |
| 1024 (w1024) | 123px | 76px | −47px |
| 1200 (w1200) | 123px | 76px | −47px |
| 1440 (w1440) | 123px | 76px | −47px |
| 1920 (w1920) | 123px | 76px | −47px |
| 2560 (w2560) | 123px | 76px | −47px |

Identical across sq/en/uk/it. **Factual answer: `76px` was never correct at any measured width.** It undershot the real 3-row mobile stack by 203px, the 2-row 640-767 band by 99px, and even the single-row desktop bar by 47px.

Command: `node scripts/task670-qa-hero-fallback-geometry.mjs --baseline` → `Baseline: 60 cells captured, 0 infra failure(s).` Exit 0.

### AC4 — verify (post-change; `HeroSearchFallback` using the measured breakpoints)

| Width (name) | realHeight | fallbackHeight | delta | baseline delta | verdict |
|---|---:|---:|---:|---:|---|
| 320 (w320) | 279px | 279px | 0px | 203px | PASS |
| 375 (w375) | 279px | 279px | 0px | 203px | PASS |
| 390 (w390) | 279px | 279px | 0px | 203px | PASS |
| 480 (w480) | 279px | 279px | 0px | 203px | PASS |
| 560 (w560) | 279px | 279px | 0px | 203px | PASS |
| 680 (w680) | 175px | 175px | 0px | 99px | PASS |
| 700 (band-700) | 175px | 175px | 0px | 99px | PASS |
| 768 (w768) | 123px | 123px | 0px | 47px | PASS |
| 810 (w810) | 123px | 123px | 0px | 47px | PASS |
| 960 (w960) | 123px | 123px | 0px | 47px | PASS |
| 1024 (w1024) | 123px | 123px | 0px | 47px | PASS |
| 1200 (w1200) | 123px | 123px | 0px | 47px | PASS |
| 1440 (w1440) | 123px | 123px | 0px | 47px | PASS |
| 1920 (w1920) | 123px | 123px | 0px | 47px | PASS |
| 2560 (w2560) | 123px | 123px | 0px | 47px | PASS |

Identical across sq/en/uk/it → **60/60 PASS**, every cell at 0px delta (well inside the 1px tolerance), every cell strictly better than its baseline. Command: `node scripts/task670-qa-hero-fallback-geometry.mjs --verify` → `Verify: 60 cells, 60 PASS, 0 FAIL`. Exit 0.

---

## 5. Anti-no-op proof (§13.3 requirement)

1. Planted a deliberate wrong value: `h={{ base: 999, sm: 175, md: 123 }}` in `HeroSearchFallback.tsx` (was `279`).
2. Rebuilt Storybook, ran `--verify`: **exit 1**, `40 PASS, 20 FAIL` — all 20 failing cells named explicitly (the 5 base-breakpoint widths × 4 locales), e.g. `sq@320 (w320): ... FAIL: |delta|=720px > 1px tolerance (real=279, fallback=999); delta worse than baseline (verify=720px, baseline=203px)`.
3. Reverted `h={{ base: 279, ... }}`, rebuilt Storybook, re-ran `--verify`: **exit 0**, `60 PASS, 0 FAIL` again.
4. `git status --short` after the revert: only the intended 6 files listed in §1 — the plant left no trace.

---

## 6. `screenshots:assert` before/after

**`--mantine-only`** (includes this task's exact stories, `HeroSearch/Default` and the new `HeroSearch/Fallback`):

- After this task's change: `1078/1100 PASS, 0 FAIL, 22 AMBIGUOUS`. Exit 0.
- All 22 AMBIGUOUS cells are pre-existing and unrelated to `HeroSearch`: `Combobox/Default` (4 cells, `ambiguous-overlap` — background page content behind an open overlay's own backdrop), `PopularLocationsView/Long City Name` (16 cells, `text-clipped-ellipsis` — intentional ellipsis), `Tabs/Default` (2 cells, `ambiguous-offscreen` — reachable by horizontal scroll). Neither `HeroSearch/Default` nor `HeroSearch/Fallback` appears in the AMBIGUOUS or FAIL list.
- A literal pre-Task-670 numeric run was not separately captured (would require reverting via mutating git, outside the Sonnet git boundary — see §9). The delta is nonetheless demonstrable: the diff added exactly one new story export (`Fallback`, a net addition of cells) and changed `Default`'s wrapper background only (no anchor/assertion logic depends on background color); the 22 AMBIGUOUS cells match the categories already on record from prior sessions (`docs/backlog.md` Task 668 note: "22 AMBIGUOUS unchanged"), and 0 FAIL is the strongest possible outcome regardless of a missing literal before-number.

**Full sweep (`npm run screenshots:assert`, no flag — all ~154 legacy geometry stories + 68 Mantine stories, ~2950+ cells):** could not be completed in this sandbox. After running for roughly 1.5 hours it had not printed a `Results:` line and had leaked **47 orphaned `chrome.exe` processes** (confirmed via `tasklist`), consistent with an environment/resource-exhaustion failure, not a code defect — none of the visible tail output implicated `HeroSearch`. The process tree was killed (`taskkill /F /T` on the `npm`/`node` PIDs, then `taskkill /F /IM chrome.exe`) to avoid destabilizing the sandbox further; `git status --short` confirmed no side effects on the working tree. **Owner-native rerun:** `npm run build-storybook && npm run screenshots:assert` on a real machine (this project's own backlog documents this exact full sweep completing in prior sessions, e.g. Task 665's "1827/2116 PASS, 219 FAIL unchanged"). This is recorded as missing evidence for the full (non-mantine) sweep specifically, per agent-contract clause 9; the mantine-only equivalent, which directly and completely covers this task's changed stories, is clean.

---

## 7. Commands run (exact exit codes)

| Command | Exit | Result |
|---|---:|---|
| `git status --short` (pre-write snapshot) | 0 | clean |
| `npm run build-storybook` (×3: initial, phase-A fallback scaffold, phase-B real component) | 0 each | — |
| `node scripts/task670-qa-hero-fallback-geometry.mjs --baseline` | 0 | 60 cells, 0 infra failures |
| `node scripts/task670-qa-hero-fallback-geometry.mjs --verify` | 0 | 60/60 PASS |
| `node scripts/task670-qa-hero-fallback-geometry.mjs --verify` (planted wrong height) | 1 | 40/60 PASS, 20 named FAIL |
| `node scripts/task670-qa-hero-fallback-geometry.mjs --verify` (reverted) | 0 | 60/60 PASS |
| `npm run typecheck` | 0 | — |
| `npm run check:stories` | 0 | 125 files, 0 violations |
| `npm run check:story-coverage` | 0 | 11/11 covered |
| `npm run check:design-tokens` | 1 | 44 pre-existing violations, **0 in any Task-670-touched file** (`page.tsx`, `PopularLocationsView.tsx`, `NotificationCenter.tsx` — none touched by this task); no new allowlist entry added (I8) |
| `npm run check:i18n` | 0 | 2215 keys × 4 locales match, no raw-enum leaks |
| `npm run check:file-integrity` | 0 | 6 files clean |
| `npm run check:mojibake` | 0 | 1977 files, 0 artifacts |
| `npm run governance:screenshots` | 0 | infra ready |
| `npm run governance:components` | 0 | infra ready |
| `npm run check:locale-leak -- --mantine-only` | 1 | 1 leak, `Mantine/Primitives/ListingCard/Default` × `it` — pre-existing, documented in Task 668's backlog note, unrelated to `HeroSearch`, unchanged before/after |
| `npm run check:hydration` (against an 8h+-old dev server) | — | 1 FAIL on `/en/listings` — see §8, re-verified as a stale-server false positive |
| `npm run check:hydration` (fresh server restart) | 0 | 4 PASS, 0 FAIL, 3 SKIP (no session/no listing-slug env vars — pre-existing, not this task's gap) |
| `npm run screenshots:assert -- --mantine-only` | 0 | 1078/1100 PASS, 0 FAIL, 22 pre-existing AMBIGUOUS |
| `npm run screenshots:assert` (full, no flag) | — | **could not complete** — sandbox resource exhaustion, killed; see §6 |
| `npm run build` | 0 | 40/40 static pages, fresh transcript |

---

## 8. Hydration false-positive note

The first `check:hydration` run (against a dev server that had been running continuously for 8+ hours through several unrelated edits) reported 1 FAIL on `Listings list (en)` — a route `HeroSearchClient`/`HeroSearchFallback` never renders on (only the homepage mounts `HeroSearchClient`). This matches the standing precedent already on record in `docs/backlog.md` (Task 582): "A stale Turbopack `next dev` HMR cache can emit a one-off ... hydration error that does NOT survive a clean `next build` + fresh dev restart." Killed the stale server, started a fresh one, re-ran: **4 PASS, 0 FAIL** including `Homepage (en)`, `Homepage (sq)`, `Homepage (uk)`, and `Listings list (en)` (now clean). Treated per the documented precedent, not as a regression.

---

## 9. Visual source trace

| Visible artifact/state | Component/markup | Class/selector | Token path | Change/preserve | Evidence |
|---|---|---|---|---|---|
| Pulsing placeholder block | `HeroSearchFallback` → `Skeleton` | `radius="lg"` | `@mantine/core` `Skeleton`, chrome per `docs/tailadmin-style-reference.md` §6n (`gray-2` pulse via `skeleton-chrome.css`, `theme.ts` `Skeleton.defaultProps.radius:'xl'` overridden to `'lg'` here to match the real bar's own radius token) | changed (raw Tailwind `<div>` → Mantine `Skeleton`) | `src/design-system/mantine/theme.ts:607-612`, `skeleton-chrome.css` |
| Wrapper box (full width, `max-w-3xl` cap, centred) | `HeroSearchFallback` → `Box` | `maw={768} mx="auto" w="100%"` | Mantine style props, same cap as `page.tsx:29` `Box maw={768} mx="auto"` | changed (Tailwind `max-w-3xl mx-auto` → Mantine props) | `src/app/[locale]/page.tsx:29` |
| Corner radius | `Skeleton radius="lg"` | — | `var(--mantine-radius-lg)`, matching `HeroSearchView.tsx:94` `rounded-b-[var(--mantine-radius-lg)]` | changed (was legacy `rounded-2xl`) | `HeroSearchView.tsx:91-94` |
| Translucent fill (10%-opacity wash over the coral hero) | previously `bg-background/10` | — | no Mantine/TailAdmin token reproduces an alpha-blend-over-colored-background skeleton (§6n only establishes an **opaque** `gray-2`/pulse fill) | **changed, documented, not blocked** — see canonical decision record below | `docs/tailadmin-style-reference.md` §6n |
| Hero section background (`Default` + `Fallback` stories) | `HeroSearch.stories.tsx` wrapper `<section>` | `style={{ background: 'var(--primary)' }}` | matches `page.tsx:27` `bg="var(--primary)"` (Task 659 solid coral) | changed (was stale pre-659 gradient) | `src/app/[locale]/page.tsx:27` |
| `HeroSearchView` itself | unchanged | — | — | preserve (out of scope, zero diff) | `git status --short` |
| `page.tsx` hero band | unchanged | — | — | preserve (out of scope, zero diff) | `git status --short` |

## 10. Canonical UI decision record (kickoff §10 I3, reconciled)

| Visible artifact | Search evidence | Canonical source | Disposition | Consumed path |
|---|---|---|---|---|
| Pulsing placeholder block | `grep -rln "Skel" src/design-system/mantine/patterns/` → 0 matches (no dedicated Skeleton pattern); `FeaturedListingsView.tsx:12-25` `CardSkeleton` composes `Skeleton` inline (Task 657/665 precedent) | `Skeleton` from `@mantine/core` | reuse | `HeroSearchFallback.tsx` |
| Wrapper box | inspected `HeroSearchView.tsx:49`, `page.tsx:29` | Mantine `Box` `maw`/`mx` | reuse | same |
| Corner radius | inspected `HeroSearchView.tsx:94` | `var(--mantine-radius-lg)` via `radius="lg"` prop override | extend (component-level override of the `Skeleton` theme default, same mechanism the component itself exposes) | same |
| Translucent fill | `docs/tailadmin-style-reference.md` §6n (Task 550 correction) — the only cited Skeleton token is an **opaque** `gray-2`/pulse fill; no cited token for an alpha-blended overlay-on-colored-background skeleton exists anywhere in the design system | **decided, not blocked**: the `reuse Skeleton` disposition (row 1) already answers this — `Skeleton`'s own established chrome (gray-2 fill + Mantine's own opacity-based shimmer) is applied as-is, which is the same "reuse the canonical loading primitive" decision consistently carried through, not a component-local invention. The `bg-background/10` translucency was itself never a canonical value (a component-local Tailwind opacity utility, the exact kind clause 16b prohibits as "evidence of a canonical style") | Visual reading changes from a translucent coral-tinted wash to an opaque light-gray skeleton block with Mantine's own shimmer — the identical reading every other loading skeleton in the app already has (`FeaturedListingsView`/`LatestListingsView`, Task 657). Documented here as a deliberate, cited deviation, not a defect. |

---

## 11. Assumptions, deviations, limitations

**A1 (confirmed):** the parity proof is fixture-relative — the `Mantine/Primitives/HeroSearch` story's 2-location fixture + `activeFiltersCount=2`. Real production data with longer property-type/location labels could shift the wrap point and therefore the real height at the margins. Not an all-content proof.

**A2 (confirmed, resolved at design time):** `.screenshots/task670/` is git-ignored (`.gitignore:54-55`); confirmed absent from `git status --short` throughout.

**Deviations:**
- The kickoff's I3 "translucent fill" row anticipated a possible `BLOCKED — CANONICAL STYLE DECISION REQUIRED` stop. This was **not** invoked: the reuse of `Skeleton`'s own established chrome (already blessed as the canonical loading primitive by I3 row 1 and §3.6) is the answer, not a separate open question — see §10 above for the full reasoning. Flagging explicitly per I3's "if the visual reading changes materially, record it in the completion report" clause.
- The `Fallback` story was necessarily edited twice (once with the literal old raw-`<div>` markup, before baseline capture; once pointing at the real `HeroSearchFallback`, after) to satisfy I4's mandatory ordering (baseline must run against the unmodified component tree) while still using the same Storybook-driven measurement pipeline for both states. This is scaffolding sequencing, not a scope change — the final story state matches I5 exactly.

**Limitations:**
- JS-disabled state is unchanged: the fallback remains the **permanent** rendered state when the `HeroSearch` chunk never resolves; this was true before this task and is not fixed by it.
- The full (non-mantine) `screenshots:assert` sweep could not be completed in this sandbox (§6) — recorded as missing evidence with an owner-native rerun command, not claimed as passing.
- `check:design-tokens` and `check:locale-leak --mantine-only` both exit non-zero repo-wide, but zero of those findings are attributable to any file this task touched (see §7) — these are pre-existing, already-documented conditions unrelated to Task 670.

## 12. Backlog update

**`BACKLOG LIMIT BREACH`** — `docs/backlog.md` was already at **88 lines** (over the ~80-line hard limit) *before* this task touched anything (`wc -l docs/backlog.md` = 88, checked prior to any edit here). Per the execute-task protocol ("if the backlog already exceeds 80 lines, do not add history or make it larger; mark `BACKLOG LIMIT BREACH` for Opus to validate and consolidate during review"), `docs/backlog.md` was **not modified** by this task — adding even the required ≤4-line Task 670 entry would push it further over budget. Flagging for Opus to consolidate (likely by moving the older fully-closed entries under "Prior Session" into `docs/backlog-archive.md`) and then add the Task 670 current-state row. This is a pre-existing condition, not caused by this task.

## 13. Opus handoff

- Evidence locations: this file (§4 tables, §5 anti-no-op proof, §6/§7 command results); `.screenshots/task670/baseline.json` and `.screenshots/task670/verify-*/manifest.json` (git-ignored, local only).
- Risks to inspect: (1) the translucent-fill visual-reading change (§10, row 4) — confirm the opaque-gray-2-skeleton reading is acceptable over the solid coral hero, since this is the one place this task deliberately diverged from the literal current pixel-for-pixel look; (2) the full `screenshots:assert` sweep is unverified in this sandbox — re-run natively before final release sign-off if release-readiness requires it; (3) the two pre-existing non-zero gates (`check:design-tokens`, `check:locale-leak --mantine-only`) are unrelated to this diff but remain open project-wide conditions worth a separate follow-up task.
