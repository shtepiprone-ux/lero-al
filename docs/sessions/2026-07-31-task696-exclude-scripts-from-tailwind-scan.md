# Task 696 — Exclude `scripts/` from Tailwind's source scan — session log

**Status: `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`.** R1, R4, R6, R7, R8, R9 fully VERIFIED. **R2/R3 VERIFIED
WITH A MATERIAL DEVIATION — NEEDS ORCHESTRATOR RATIFICATION**: the selector-set diff removes **35** selectors, not
the kickoff's measured 21 (14 extra, all with clean scripts/-only provenance of the identical pollution class the
task itself describes). Per the kickoff's own A3 ("report the exact difference with provenance rather than
adjusting the expectation silently"), the number is **not** self-ratified here. R5 VERIFIED, including a genuine
transient harness FAIL that was investigated and shown non-reproducible, and one previously-undocumented noise
story (`TextInput/Default`) confirmed via a dedicated same-tree, zero-code-diff control captured in this session.

## 1. I0 — start protocol

`git status --porcelain` at session start: **empty** (clean tree; the Task 668/669 review records referenced by
§3.6 were already committed). `src/app/globals.css` md5 at I0: **`1f7690d0de50ed658fde83478a9c59f2`** — matches
the kickoff's §3.1 quote exactly.

**Observed mid-session, not caused by this task:** three unrelated session-log files
(`docs/sessions/2026-07-23-task663-…`, `…task664-…`, `2026-07-26-task666-…`) briefly showed insertion-only diffs in
`git status` during I1, consistent with a concurrent owner/orchestrator session appending review outcomes (matches
the review-commit pattern visible in this branch's recent history). They were gone from `git status` by I6 (that
session's own commit landed independently) and are not part of this task's diff at any point.

## 2. R1 — the directive (AC1)

`src/app/globals.css`, immediately after the `tasks` exclusion:

```diff
 @source not "../../docs";
 @source not "../../tasks";
+/* Exclude scripts/ from Tailwind's automatic content detection (Task 696).
+   Regex literals, comments, governance baselines, and allowlist JSON inside
+   build/QA tooling contain Tailwind class-name-shaped strings that are never
+   rendered, so the v4 scanner was extracting them as real utility candidates
+   and shipping them in production CSS (21 measured, e.g. bg-black, the py-*
+   gap set, text-green-500). This also closes a hazard found reviewing Task
+   692: scripts/__tests__/ is scanned too, so a gate test that names a utility
+   literally (not via a wildcard) could keep it alive in the bundle after its
+   last real consumer is gone, masking the exact disappearance Task 700's
+   @theme-dependency gate must detect. */
+@source not "../../scripts";
 
 @custom-variant dark (&:is(.dark *));
```

`git diff --stat src/app/globals.css` → `1 file changed, 11 insertions(+)`. Nothing else in the file touched.
**AC1 met exactly.**

## 3. R4 — the two-armed anti-no-op plant (AC3)

Plant utility `mt-[7px]`, confirmed absent repo-wide before planting: `grep -F "mt-\[7px\]"` against the I1
`selectors-before.txt` (2385 selectors) → no match; a repo-wide `Grep` found it only inside this task's own kickoff
file (`tasks/…`, already excluded from Tailwind's scan, so it does not contaminate the measurement).

Plant site: `scripts/governance/scan-tailwind.mjs`, added one comment line inside the file's top doc-comment block:
`*   TEMP-PLANT (Task 696 R4 anti-no-op, reverted before commit): mt-[7px]`. md5 before plant:
`c2e69c94b84dc8da61794a2f585c5903`.

- **Arm (a) — directive absent, plant present.** `rm -rf .next && npm run build` (exit 0). `grep -Fo "mt-\[7px\]"
  .next/static/css/*.css` → `.next/static/css/74faba3b7b0a14f4.css:mt-\[7px\]`. **Emitted**, as required.
- **Apply R1** (§2).
- **Arm (b) — directive present, plant still present.** `rm -rf .next && npm run build` (exit 0). `grep -Fo
  "mt-\[7px\]" .next/static/css/*.css` → **no match, grep exit 1**. **Not emitted.** This is the causal proof the
  directive, not chance, did the work.
- **Remove the plant** (exact-text `Edit` revert — no `git checkout`, per the Task 692 precedent finding that
  `checkout` is a forbidden mutating command). md5 after revert: `c2e69c94b84dc8da61794a2f585c5903` — **unchanged**,
  byte-identical to the pre-plant md5. `git status --porcelain -- scripts/governance/scan-tailwind.mjs` → empty.

**AC3 met exactly — both arms, clean restore.**

## 4. R2/R3 — the selector-set diff (AC2) — **DEVIATION, not self-ratified**

Method: a from-scratch selector extractor (`.screenshots/task696-delta/` — not placed under `scripts/`, which R7
requires read-only) walks each `.next/static/css/*.css` file, records the text immediately preceding every top-level
`{` as a rule, discards `@`-rule preludes, and splits comma-separated selector lists on **unescaped** commas only
(an early version naively split on every `,`, which shredded arbitrary-value selectors containing `rgba(0,0,0,0.1)`
— caught via a`cat -A` inspection of truncated `shadow-[…` lines and fixed with a negative-lookbehind split before
any measurement was taken as final).

- **Before** (I1, pre-change, plant absent): `rm -rf .next && npm run build` (exit 0) →
  `.screenshots/task696-delta/selectors-before.txt`, 2385 selectors. All 21 §3.2 utilities confirmed present
  (verified individually, including the three literal-ellipsis candidates `duration-[...]`, `shadow-[...]`,
  `text-[#...]` — Tailwind's scanner extracted the *literal* placeholder text from `check-design-tokens.mjs`'s own
  doc comments verbatim as class candidates).
- **After** (I6, post-change, R1 applied, plant absent): `rm -rf .next && npm run build` (exit 0) →
  `selectors-after.txt`, 2350 selectors.
- **Diff** (`diff selectors-before.txt selectors-after.txt`, full and unelided):

```
131d130
< .bg-black
446,447d444
< .duration-\[1000ms\]
< .duration-\[\.\.\.\]
633,636d629
< .h-\[340px\]
< .h-\[420px\]
< .h-\[500px\]
< .h-\[76px\]
638d630
< .h-\[calc\(100\%-2px\)\]
1810d1801
< .max-w-\[1800px\]
1818d1808
< .max-w-screen-2xl
2010,2011d1999
< .py-10
< .py-11
2013,2015d2000
< .py-13
< .py-14
< .py-15
2027d2011
< .py-7
2029d2012
< .py-9
2071d2053
< .rounded-\[calc\(var\(--radius\)-5px\)\]
2075d2056
< .rounded-b-2xl
2104d2084
< .shadow-\[0_-2px_12px_rgba\(0\,0\,0\,0\.1\)\]
2106,2107d2085
< .shadow-\[0_2px_4px_rgba\(0\,0\,0\,0\.1\)\]
< .shadow-\[\.\.\.\]
2205d2182
< .sm\:rounded-tr-2xl
2236,2239d2212
< .text-\[20px\]
< .text-\[Npx\]
< .text-\[Nrem\]
< .text-\[\#\.\.\.\]
2247d2219
< .text-clip
2253d2224
< .text-green-500
2357d2327
< .w-\[100\%\]
2360,2361d2329
< .w-\[calc\(100px\+2rem\)\]
< .w-\[var\(--some-token\)\]
2380d2347
< .z-\[100\]
2384,2385d2350
< .z-\[999\+\]
< .z-\[N\]
```

**35 removed, 0 added.** The kickoff's exact 21 are a subset (`bg-black`; `py-7/9/10/11/13/14/15`; `text-green-500`;
`text-[#...]`; `max-w-[1800px]`; `max-w-screen-2xl`; `duration-[...]`; `duration-[1000ms]`; `shadow-[...]`;
`w-[100%]`; `z-[100]`; `text-[20px]`; `rounded-b-2xl`; `text-clip`; `h-[76px]` — all 21 individually confirmed
present pre-change). The **14 extra** removals, each traced to a specific scripts/-only source before accepting the
number:

| Extra selector | Source(s) |
|---|---|
| `h-[340px]`, `h-[420px]`, `h-[500px]` | `governance/tailwind-entropy.allowlist.json`, `governance/reports/tailwind-entropy.latest.json` |
| `h-[calc(100%-2px)]` | `__tests__/check-design-tokens.test.ts:186` (an `allow-marker` value in a test string) |
| `rounded-[calc(var(--radius)-5px)]` | `check-design-tokens.mjs:24,125,129` (doc comment + matcher comment), `__tests__/check-design-tokens.test.ts:170`, `governance/reports/tailwind-entropy.latest.json:1309` |
| `sm:rounded-tr-2xl` | `check-stories-rendered.mjs:1237` (a quoted example string in a comment) |
| `shadow-[0_-2px_12px_rgba(0,0,0,0.1)]` | `__tests__/check-design-tokens.test.ts:137,139` |
| `shadow-[0_2px_4px_rgba(0,0,0,0.1)]` | `check-design-tokens.mjs:162` (doc comment) |
| `text-[Npx]`, `text-[Nrem]` | `governance/scan-tailwind.mjs:151` (comment) |
| `w-[calc(100px+2rem)]` | `check-design-tokens.mjs:128` (comment), `__tests__/check-design-tokens.test.ts:153,155` |
| `w-[var(--some-token)]` | `__tests__/check-design-tokens.test.ts:147` |
| `z-[999+]` | `governance/scan-responsive.mjs:68` (a JS string literal) |
| `z-[N]` | `check-design-tokens.mjs:18` (doc comment) |

Every one of the 14 is the identical mechanism §3.2 already describes (regex/comment/test-fixture/JSON-report text
inside `scripts/` shaped like a real Tailwind candidate), confirmed absent from `src/`, `.storybook/`, `messages/`,
`public/`, and root config by construction — the extraction diff itself is the proof: these selectors disappear
**only** because `scripts/` is excluded, and 0 selectors were added anywhere. `shadow-[0_-2px_16px_rgba(0,0,0,0.08)]`
(from `MobileBottomNavView.tsx`) was checked and correctly **not** removed — it has a live `src/` consumer and was
never a candidate for exclusion.

**This is reported, not self-ratified, per A3.** The kickoff's own "Known-risk note" #2 explicitly warns against
quietly accepting a different number; §3.2's heuristic token-extraction measurement against one build undercounted
the real pollution by 14. The fix itself (R1) is unaffected by which count is correct — the same one-line directive
produces whichever true removal set exists. **Opus must decide:** ratify 35 as the correct, fully-provenanced
number (recommended, given the clean 1:1 provenance table above and 0 additions), or direct further investigation.

## 5. R5 — rendered proof (AC4)

### 5.1 I1 baseline (pre-change)

`build-storybook` (exit 0) → `screenshots:assert -- --mantine-only` → **1162/1184 PASS, 0 FAIL, 22 AMBIGUOUS**
(Combobox ×4, `PopularLocationsView/Long City Name` ×16, `Tabs` ×2 — the documented ambiguous set), manifest
`.screenshots/rendered-assert/2026-07-31T15-26/`.

**Same-tree stability control** (D26 condition 4), second capture on the identical pre-change tree, no rebuild:
`2026-07-31T15-56/`, also 0 FAIL/22 AMBIGUOUS. Compared: **0 FAIL, 0 verdict changes, 70 md5-changed cells**, all in
stories already on the documented §8.1 noise list (Button, FiltersPanelShell, HeroSearch/Fallback, LightboxView,
LocaleSwitcher, MobileBottomNavView ×2, PopularLocationsView ×2, Skeleton, EmptyLoadingErrorState,
HomepageListingGrids/Loading, ListingDetailPattern, ListingGalleryPattern) — establishes this session's own noise
floor per D26.

### 5.2 Post-change run and a transient FAIL, investigated

Fresh `build-storybook` (exit 0, R1 applied) → `screenshots:assert -- --mantine-only`:

- **First run** (`2026-07-31T16-43/`): **1 FAIL** — `Separator/Default × en`, `page.goto: Timeout 20000ms exceeded`
  navigating to the iframe URL. `flaky-recovered: 0`.
- **Re-run, same tree, no code change** (`2026-07-31T17-13/`): **1161/1184 → 1162/1184 PASS, 0 FAIL, 22 AMBIGUOUS,
  flaky-recovered: 1**. The Separator failure did not reproduce.

Treated as a transient Storybook-dev navigation flake (unrelated to any of the 35 removed selectors — `Separator`
has no relationship to any of them) and **not** used as the official comparison run; `2026-07-31T17-13/` is.

### 5.3 Comparison vs I1 baseline

`2026-07-31T15-26/` (before) vs `2026-07-31T17-13/` (after, clean): **0 FAIL, 0 verdict changes, 85 md5-changed
cells.**

By story: `Button` 8, `FiltersPanelShell` 1, `HeroSearch/Fallback` 15, `LightboxView` 3, `LocaleSwitcher` 11,
`MobileBottomNavView/Guest` 2, `MobileBottomNavView/Authenticated` 2, `PopularLocationsView/Default` 2,
`PopularLocationsView/Long City Name` 2, `Skeleton` 10, `TextInput/Default` **1**, `EmptyLoadingErrorState` 13,
`HomepageListingGrids/Loading` 14, `ListingDetailPattern` 1. Sum = 85, matches exactly.

**Attribution:** 13 of the 14 story categories are already on the documented §8.1 noise set or were independently
confirmed noisy by this session's own §5.1 same-tree control (`FiltersPanelShell`, `LightboxView`). **One,
`TextInput/Default`, was not previously documented anywhere** and required direct investigation before being
accepted as noise:

- Pixel-diffed the one changed cell (`en × mobile-390`): `maxDelta 148`, `1266/329160` differing pixels (0.38%).
  Cropped and 4×-zoomed both source PNGs at the diff coordinate (`x=150,y=780`) — **visually identical**, text
  glyphs pixel-for-pixel indistinguishable to the eye; consistent with font-hinting/subpixel antialiasing jitter
  between two independent Chromium renders, not any style change.
- Ran a **third capture** on the identical post-change tree (`2026-07-31T17-45/`, 0 FAIL) and compared it against
  the post-change comparison run (`2026-07-31T17-13/`) with **zero code change between them**: `0 FAIL, 0 verdict
  changes, 63 md5-changed cells`, and **`TextInput/Default × en × mobile-390` is in that list too** — the identical
  cell, flaking with no code change at all.

**`TextInput/Default` is confirmed harness noise via a direct, session-captured, zero-code-diff control**,
following the exact methodology this project's D10/D14/D26 precedents establish for the *documented*-noise-set path
— it is simply newly observed, not previously catalogued in `docs/sessions/…task698…` §8.1. Recorded here as a
finding for that catalog's maintainer, not acted on further (out of this task's scope).

**All 85 md5-changed cells are attributed. 0 FAIL. 0 verdict changes.** AC4 met.

## 6. R6 — the `scripts/__tests__/` hazard (AC5)

Recorded in the R1 comment (§2, "This also closes a hazard found reviewing Task 692…") and here: `scripts/__tests__`
is scanned by Tailwind exactly like the rest of `scripts/`. A gate test that names a utility **literally** (not via
a wildcard) in its source becomes a synthetic consumer, keeping that utility alive in the bundle after its last real
consumer disappears — masking exactly the disappearance Task 700's `@theme`-dependency gate must detect.
`scripts/__tests__/overlay-dual-declaration.test.ts` (Task 692) was checked and is clear only because it writes
`bg-overlay*`/`text-overlay-foreground*` with wildcards. This task's `@source not` directive closes the hazard for
all of `scripts/__tests__/` permanently, independent of any individual test's current wildcard discipline.

## 7. R7 — `scripts/` untouched (AC5, AC6)

`git status --porcelain -- scripts/` → empty at every checkpoint after I5's plant removal, including the final
check. The I2/I4 plant and its exact-text revert (§3) are the only edits ever made under `scripts/`, and both are
verified reverted (md5-identical to pre-plant). No probe was deleted; no gate was wired (A5).

## 8. R8 — gate checks (AC5)

All run twice — once on the pre-change tree (I1 baseline), once on the post-change tree (I8) — with identical
results:

| Command | Before | After |
|---|---|---|
| `npm run typecheck` | exit 0 | exit 0 |
| `npm run check:stories` | exit 0 — 127 files, 0 violations | exit 0 — 127 files, 0 violations |
| `npm run check:story-coverage` | exit 0 — 15/15 | exit 0 — 15/15 |
| `npm run check:i18n` | exit 0 — 2215×4 | exit 0 — 2215×4 |
| `npm run check:design-tokens` | exit 1 — **28**/0-stale/0-missing (pre-existing, `--strict` fails on any violation by design) | exit 1 — **28**/0/0, unchanged |
| `npx vitest run` | 1188/1192 (4 failed/3 files: `date-format-ssr-parity`, `RangeDatePicker` ×2, `saveSavedSearch.dedup` — all full-run-only timeouts; isolated re-run of all 3 files: **41/41 PASS**) | 1191/1192 (1 failed/1 file: `date-format-ssr-parity`, same documented full-run-only-timeout class; isolated re-run: **25/25 PASS**) — no new failure |
| `npm run check:file-integrity` | — | exit 0 — 1 file (the touched `globals.css`) clean |
| `npm run check:mojibake` | — | exit 0 — 0 artifacts in 2020 files |
| `npm run build` (I1, I2-arm-a, I4-arm-b, I6, I9-final) | exit 0 each time, full 54-row route table | exit 0, full 54-row route table (I9, run last, quoted below) |

`check:design-tokens`'s `--strict` mode exits 1 whenever any raw-value violation exists (an unrelated, pre-existing
28-violation baseline this task does not touch); the count is unchanged before/after, which is what R8 requires.

### I9 final `npm run build` (run last, full route table)

```
Route (app)                                 Size  First Load JS  Revalidate  Expire
┌ ƒ /                                      379 B         185 kB
├ ƒ /_not-found                          1.16 kB         185 kB
├ ƒ /[locale]                            7.15 kB         618 kB
├ ƒ /[locale]/[slug]                       380 B         581 kB
├ ƒ /[locale]/auth/confirm-email         2.18 kB         192 kB
├ ƒ /[locale]/auth/login                 1.42 kB         265 kB
├ ƒ /[locale]/auth/register              1.41 kB         265 kB
├ ƒ /[locale]/auth/reset-password        6.43 kB         284 kB
├ ƒ /[locale]/auth/verified              2.27 kB         258 kB
├ ƒ /[locale]/cabinet                     149 kB         763 kB
├ ƒ /[locale]/contact                    5.44 kB         230 kB
├ ƒ /[locale]/favorites                  5.26 kB         577 kB
├ ƒ /[locale]/listings                   12.8 kB         585 kB
├ ƒ /[locale]/listings/[slug]              380 B         581 kB
├ ƒ /[locale]/listings/[slug]/edit       2.36 kB         251 kB
├ ƒ /[locale]/listings/create            2.36 kB         251 kB
├ ƒ /admin                               5.02 kB         371 kB
├ ƒ /admin/companies                     6.85 kB         304 kB
├ ƒ /admin/currency                       8.6 kB         300 kB
├ ƒ /admin/email-templates                 10 kB         253 kB
├ ƒ /admin/footer                        6.25 kB         232 kB
├ ƒ /admin/inquiries                       379 B         185 kB
├ ƒ /admin/inquiries/sales                 336 B         368 kB
├ ƒ /admin/inquiries/support               335 B         368 kB
├ ƒ /admin/legal                           379 B         185 kB
├ ƒ /admin/listings                        10 kB         422 kB
├ ƒ /admin/listings/[id]/preview           380 B         581 kB
├ ƒ /admin/locations                     9.92 kB         261 kB
├ ƒ /admin/pages                         10.4 kB         264 kB
├ ƒ /admin/permissions                   8.93 kB         219 kB
├ ƒ /admin/popular-locations             9.23 kB         260 kB
├ ƒ /admin/property-types                7.36 kB         292 kB
├ ƒ /admin/reports                       21.3 kB         287 kB
├ ƒ /admin/settings                      7.57 kB         221 kB
├ ƒ /admin/support                        8.5 kB         408 kB
├ ƒ /admin/users                         5.03 kB         483 kB
├ ƒ /admin/users/[id]                      381 B         599 kB
├ ƒ /admin/users/new                       382 B         599 kB
├ ƒ /api/auth-email-hook                   378 B         185 kB
├ ƒ /api/auth/me                           378 B         185 kB
├ ƒ /api/cron/inactivity                   377 B         185 kB
├ ƒ /api/cron/listings-expiry              378 B         185 kB
├ ƒ /api/cron/price-alerts                 379 B         185 kB
├ ƒ /api/cron/saved-searches               377 B         185 kB
├ ○ /api/exchange-rate                     379 B         185 kB          1h      1y
├ ƒ /api/listings                          377 B         185 kB
├ ƒ /api/listings/[slug]/view              379 B         185 kB
├ ƒ /api/presence                          379 B         185 kB
├ ƒ /api/property-types                    379 B         185 kB
├ ƒ /api/upload-avatar                     378 B         185 kB
├ ƒ /api/upload-company-logo               378 B         185 kB
├ ƒ /api/upload-popular-location-photo     378 B         185 kB
├ ƒ /auth/callback                         378 B         185 kB
└ ƒ /auth/confirm                          378 B         185 kB
+ First Load JS shared by all             184 kB
  ├ chunks/3434-424f684dc44a60e2.js       126 kB
  ├ chunks/4bd1b696-ad216e4073dcea52.js  54.4 kB
  └ other shared chunks (total)           4.2 kB

ƒ Middleware                              165 kB
```

54 routes, exit 0.

## 9. R9 and encoding gates

`docs/backlog.md` updated in place (appended to the existing Task 696 paragraph, line count held at 80). Session
log this file. Final `check:file-integrity` (re-run after both records existed): exit 0 — **3/3 files clean**
(`globals.css`, `backlog.md`, this session log). Final `check:mojibake`: exit 0 — **0 artifacts in 2021 files**.

## 10. Files Changed (final)

| File | Change | Reason |
|---|---|---|
| `src/app/globals.css` | **modified** — one `@source not "../../scripts";` line + an 11-line comment, immediately after the `tasks` exclusion | R1 |
| `docs/backlog.md` | modified | R9 |
| `docs/sessions/2026-07-31-task696-exclude-scripts-from-tailwind-scan.md` | **created** | R9, this file |
| `.screenshots/task696-delta/*` | task-created evidence (local-only, D6): `selectors-before.txt`, `selectors-after.txt`, extraction/comparison scripts, pixel-diff crops | I1, I6, I7 evidence |

`scripts/` — **no file added, edited, renamed, or deleted** (R7, verified by `git status --porcelain -- scripts/`
at every checkpoint after the I5 plant revert).

## 11. True final `git status --porcelain`

```
 M docs/backlog.md
 M docs/sessions/2026-07-31-task696-exclude-scripts-from-tailwind-scan.md
 M src/app/globals.css
```

`src/app/globals.css` md5 at close: **`a36360630140f6ef3469ccf88d854e05`** — differs from I0's
`1f7690d0de50ed658fde83478a9c59f2` by exactly the one added directive line + its comment (§2's diff), confirmed via
`git diff` showing `1 file changed, 11 insertions(+)` and nothing else.

## 12. R1–R9 mapped to AC1–AC6

| Req | Status | Evidence |
|---|---|---|
| R1 [AC1] | **VERIFIED** | §2 — exactly one directive line + comment |
| **R2 [AC2]** | **VERIFIED WITH A MATERIAL DEVIATION — needs orchestrator ratification** | §4 — 35 removed (not 21), 0 added, full per-selector provenance table, all scripts/-only |
| **R3 [AC2]** | **VERIFIED WITH A MATERIAL DEVIATION — needs orchestrator ratification** | §4 — same evidence; the "exactly 21" comparator is not met as literally specified |
| R4 [AC3] | **VERIFIED** | §3 — both arms, plant confirmed emitted before / absent after, clean md5-verified restore |
| R5 [AC4] | **VERIFIED** | §5 — 0 FAIL, 0 verdict changes, all 85 md5-changed cells attributed (documented noise set + 2 session-captured same-tree controls); one transient FAIL investigated and shown non-reproducible |
| R6 [AC5] | **VERIFIED** | §6 — hazard recorded in the R1 comment and here |
| R7 [AC5, AC6] | **VERIFIED** | §7 — `scripts/` clean at every checkpoint |
| R8 [AC5] | **VERIFIED** | §8 — all gates identical before/after; `build` exit 0/54 routes, run last |
| R9 [AC6] | **VERIFIED** | §9 — backlog held at 80 lines, session log written |

## 13. Deviations

1. **Selector-set removal count is 35, not the kickoff's measured 21** (§4). Not self-ratified per A3 — reported
   with full per-selector provenance for Opus's decision. The underlying fix (R1) and its causal proof (R4) are
   unaffected by which number is ultimately ratified.
2. **A transient single-cell FAIL** (`Separator/Default × en`, navigation timeout) appeared on the first post-change
   `screenshots:assert` run and did not reproduce on an immediate re-run of the identical tree (§5.2). Investigated
   rather than accepted or silently re-run without comment; the clean re-run is the run used for all R5 comparisons.
3. **`TextInput/Default` is a newly-observed noise-flaky story**, not previously catalogued in the Task 698 §8.1
   list (§5.3). Attributed via a dedicated same-tree, zero-code-diff control captured in this session, following the
   project's established methodology, rather than assumed. Flagged as a small follow-up for whoever next updates
   that catalog — not acted on here.
4. **The selector-extraction method itself had a bug caught before any measurement was finalized**: an initial
   version split selector lists on every comma, which shredded arbitrary-value selectors containing literal commas
   (e.g. `rgba(0,0,0,0.1)`) into spurious fragments. Caught via `cat -A` inspection of suspiciously truncated
   `shadow-[…` lines, fixed with an unescaped-comma split before the before/after comparison was run.

## 14. Limitations

- §3.2's original 21-utility figure was measured by heuristic token extraction against one build; §4's 35-selector
  figure is this session's own from-scratch, independently-verified re-measurement, but it is still a scan over one
  build's compiled CSS, not a formal proof that no 36th case exists under some other build configuration.
- This task does not consolidate the permanent invariants into a CI gate (owner sequence step 2) and does not delete
  any `task*-qa-*.mjs` one-off probe (step 3) — both remain explicitly out of scope (§8 of the kickoff).
- `.screenshots/` evidence, including this session's selector-set files, comparison scripts, and pixel-diff crops,
  is local-only per D6/`.gitignore`.
- The `TextInput/Default` noise-story finding (§5.3, deviation 3) is recorded but not propagated into
  `docs/storybook-governance.md` §14.11's catalog — that update is left for the reviewer or a follow-up task.

## Opus handoff

- **Primary question:** ratify 35 as the correct, fully-provenanced selector-removal count (§4's table gives clean
  scripts/-only provenance for all 14 extras, with 0 additions), or direct further investigation. The kickoff's own
  Known-risk note #2 anticipated this exact scenario and asked that it not be self-resolved by the executor.
- **Evidence to inspect directly:** §4's full diff and provenance table; §3's two-armed plant (independently
  reproducible — the plant/revert cycle is fully described); §5's manifest comparisons at
  `.screenshots/rendered-assert/2026-07-31T15-26/`, `…T17-13/`, `…T15-56/`, `…T17-45/`.
- **Verify independently:** re-run the selector extraction against a fresh `rm -rf .next && npm run build` on both
  states; re-run `screenshots:assert -- --mantine-only` to reproduce the noise floor.
- **What is fully resolved, not in question:** R1 (the code change itself), R4 (causal proof), R6/R7 (hazard
  recorded, `scripts/` untouched), R8/R9 (all gates, records).

---

## Orchestrator review outcome (Opus, 2026-07-31) — `APPROVED WITH NOTES`; the 35 is RATIFIED

### The ratification decision

**35 removed / 0 added is correct. The kickoff's 21 was an orchestrator measurement error.**

Root cause: §3.2's count came from a candidate-extraction regex whose character class was
`[a-z0-9./\[\]#%-]` — excluding `:`, `+`, `(`, `)`, `_` and every uppercase letter. It therefore could not see
exactly the 14 that appeared in the real diff: `sm:rounded-tr-2xl` (colon), `text-[Npx]`/`text-[Nrem]`/`z-[N]`
(uppercase `N`), `z-[999+]`/`w-[calc(100px+2rem)]` (plus, parens), `shadow-[0_2px_4px_rgba(0,0,0,0.1)]`
(underscore), and the `h-[…]`/`rounded-[calc(…)]`/`shadow-[…]` arbitrary-value set. 21 was a floor, not a value.

**Reviewer re-verified all 35 independently by literal search rather than heuristic extraction:** `removed=35,
added=0`. Seven initially matched inside `src/`; all seven are false positives:

| Selector | Why removal is safe |
|---|---|
| `h-[340px]`, `h-[420px]`, `h-[500px]` | `GalleryStaticFrame.tsx:32` renders **token-based** heights (`h-[var(--listing-gallery-h-mobile)]` etc.). The literals survive only in the historical doc comment at `:23` describing what the tokens replaced. |
| `rounded-[calc(var(--radius)-5px)]` | the live use in `input-group.tsx:26` sits under an `[&>kbd]:` variant, producing a different selector; the bare form came from `scripts/`. |
| `text-clip` | reviewer matches were substrings of `text-clipped` inside comments. |
| `bg-black`, `text-green-500` | both occur in the comment **this task added** to `globals.css`; Tailwind does not scan its own CSS entry as a content source. Live `bg-black/10` survives as `.bg-black\/10`. |

**The decisive corroboration:** `.sm\:h-\[420px\]` **survives** in the after-set. It is extracted from that very
`GalleryStaticFrame.tsx:23` comment, which proves `src/` comments *are* scanned. Its neighbours on the same line
do not survive because `h-[340px]` is preceded by `(` and `md:h-[500px]` is followed by `)`, and Tailwind's
boundary heuristics reject both. So the bare forms never came from `src/` at all — only from
`tailwind-entropy.allowlist.json`. The data is internally consistent with no unexplained residue.

**None of the 35 is an applied `className` in any component.**

### Disclosure quality

The `2026-07-31T16-43` run carries `failed: 1`. The session log (§200–206) names the cell
(`Separator/Default × en × mobile-320`), quotes the cause (`page.goto: Timeout 20000ms exceeded` — a navigation
flake, a class of failure a removed CSS selector cannot produce), records that it did not reproduce, and
explicitly designates `17-13` as the official comparison run rather than silently using the clean capture. A
**third** same-tree capture (`17-45`) was then taken as an additional zero-code-diff control. This is the
disclosure standard the queue should hold to.

### Findings

- **F1 `NOTE` — orchestrator defect.** The kickoff stated 21 as exact and made any deviation a stop condition,
  while the number itself was heuristic. What worked is A3's instruction to *report the difference with
  provenance rather than adjust the expectation silently* — that clause converted an orchestrator error into a
  disclosed finding instead of a quietly-moved goalpost. Keep that clause in future exact-count tasks.
- **F2 `P3` — new noise-flaky story.** `TextInput/Default` is not catalogued in the Task 698 §8.1 noise set. It
  was disclosed and backed by two same-tree controls. Add it to §8.1 on the next touch of that document.
- **F3 `P3` — CLOSED IN THIS REVIEW (owner-directed).** The `globals.css` comment still read "21 measured".
  Corrected in place to "initial estimate: 21; verified: 35 removed / 0 added, ratified in the Task 696 review",
  with representative examples from the extra 14. Note this is safe precisely because of the property proven
  above: Tailwind does not scan its own CSS entry, so naming utilities in this comment cannot reintroduce them.

**Requirement coverage.** R1–R9 `VERIFIED`, with R3's expected count corrected from 21 to 35 by owner
ratification 2026-07-31. **Verdict: `APPROVED WITH NOTES`.** Step 1 of the owner cleanup sequence is complete;
steps 2 (consolidate the permanent invariants into one neutrally-named CI gate) and 3 (delete the one-off probes)
are now unblocked.
