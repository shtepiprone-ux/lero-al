# Task 715 — Design-tokens strict flip and remediation

**Status: REVIEWED — corrected in-session (F1), see §5.3 and §14**

> **Owner waiver, 2026-08-06:** the owner explicitly authorized Opus to apply the F1/F2 corrections
> directly and issue the verdict in the same session ("ти можеш сам виправити все і провести рев'ю
> одразу"), suspending the `agent-contract` role split for this micro-fix. Recorded, not inferred.
> The native gate re-runs were executed by the owner in PowerShell — §7.

Sprint 52 (`tasks/Sprints/Sprint_52_Gates_That_Stopped_Checking.md`), Epic JJ. Depends on 714 + 716
(both `APPROVED WITH NOTES`). Kickoff:
`tasks/Sprints/Sprint_52_kickoff_prompt_Task_715_DesignTokens_Strict_Flip_And_Remediation.md`.

---

## 1. Files changed

| Path | Reason |
|---|---|
| `src/components/layout/FooterView.module.css` | Remediated 21 items (15 N1 tokenized, 6 marked) |
| `src/components/layout/HeaderView.module.css` | Remediated 16 items (11 N1 tokenized, 5 marked — `:35` z-index withdrawn at review, §5.3) |
| `src/components/layout/MobileBottomNavView.module.css` | Remediated 15 items (0 N1 tokenized, 15 marked, incl. 2 R3 restorations; `:55` z-index withdrawn at review, §5.3) |
| `src/modules/listings/components/FeaturedListingsView.module.css` | Remediated 3 items (2 N1 tokenized, 1 marked) |
| `src/modules/listings/components/LatestListingsView.module.css` | Remediated 3 items (2 N1 tokenized, 1 marked) |
| `src/modules/locations/components/PopularLocationsView.module.css` | Remediated 2 items (marked, unchanged from 714) |
| `scripts/check-design-tokens.mjs` | `REPORT_ONLY_CATEGORIES` emptied — one line, plus a JSDoc type-cast on that same line to keep `tsc --noEmit` green (empty-array literal was inferring `Set<never>`) |
| `scripts/__tests__/check-design-tokens.test.ts` | Added §G — 2 arms asserting the categories now block (R9) |
| `docs/design-system.md` | §23.6 rewritten to "historical", new §23.6.b records the flip + inventory closure (R12) |
| `docs/backlog.md` | 715/716 state, registered **717** (R7) |

Reconciled to `git diff --stat` (10 files, 115 insertions / 70 deletions) and the pre-write
`git status --porcelain` snapshot, which was **empty** (I1, confirmed before the first edit).

## 2. Requirement IDs completed

| ID | AC | Verdict |
|---|---|---|
| R1 | AC1 | ✅ **after review correction** — 30 N1 items tokenized, §22 value quoted, equal **and verified to resolve** — §4 table. 2 z-index rows withdrawn: the token they targeted is documentation-only (F1, §5.3) |
| R2 | AC2 | ✅ every COMPILED-ARTIFACT item marked, non-empty reason — §5 |
| R3 | AC3 | ✅ 3 nav-label `10px` sites marked (not tokenized), original pre-713 reason reused verbatim — §5.2 |
| R4 | AC4 | ✅ `REPORT_ONLY_CATEGORIES` empty, `check:design-tokens` exits 0 on remediated tree — §7 |
| R5 | AC5 | ✅ both plant arms: non-zero on plant, exit 0 + clean `git status` on removal — §7 |
| R6 | AC6 | ✅ 166/168 md5-identical, 2 enumerated (pre-existing §8.1 harness noise, visually confirmed identical); numeric equality table for the 2 uncovered files — §8/§9 |
| R7 | AC7 | ✅ 717 registered in `docs/backlog.md` — §10 |
| R8 | AC8 | ✅ `check-design-tokens.mjs` single-line diff (hash-verified before/after); `package.json`/`governance-pr.yml`/`check-stories-rendered.mjs`/`design-tokens-allowlist.json` zero diff (hash-verified) — §11 |
| R9 | AC9 | ✅ 69/69 pass (67 baseline + 2 new §G arms) — §7 |
| R10 | AC10 | ✅ `npm run build` exit 0, transcript `.screenshots/task715-evidence/i10-build.txt` — §12 |
| R11 | AC11 | ✅ counting gates run last, after plant cleanup; reconciled to `git status` — §13 |
| R12 | AC12 | ✅ `docs/design-system.md` §23.6.b records the flip + closure — §6 |

## 3. The N1/artifact split I derived (I1, A3)

716's inventory table (`.screenshots/task716-evidence/task716-css-declaration-inventory.md`) totals
**34 N1-VIOLATION / 26 COMPILED-ARTIFACT** across 60 items. That total counts
`MobileBottomNavView.module.css`'s two `font-size: 10px` nav-label sites (its own per-file table
rows for `:123`/`:164`) as `N1-VIOLATION*` — **asterisked**, with the note "§22.2 disallows
`text-2xs` for nav labels; policy call, not decided here (unchanged from 714 — 715/owner)". That
asterisk marks these as **not actually decided N1** — 716 left the call to this task.

**Per the kickoff §3.3 (a restoration, not a new decision — the pre-713 markers already recorded
this as a deliberate, reasoned exception), I reclassify both as `COMPILED-ARTIFACT`.** I did **not**
substitute `var(--text-2xs)` for either — `docs/design-system.md:605` explicitly forbids that token
for nav labels.

**A second reclassification was forced at review (F1, §5.3):** the inventory's `:86`/`:107`
`z-index: 30` rows target `--z-sticky`, a token that exists only in the §22.3 documentation table and
is defined nowhere in the codebase. Both move to `COMPILED-ARTIFACT`. Unlike the nav-label pair, this
one is a genuine **defect in 716's inventory**, not a policy call the kickoff delegated — it
classified against the doc rather than against `globals.css`. Registered as **718**.

**Final split: 30 N1-VIOLATION / 30 COMPILED-ARTIFACT** (34−2−2 / 26+2+2), same 60-item total, same
6 files.

| File | N1 | Artifact | Total |
|---|---:|---:|---:|
| FooterView.module.css | 15 | 6 | 21 |
| HeaderView.module.css | 11 | 5 | 16 |
| MobileBottomNavView.module.css | 0 | 15 | 15 |
| FeaturedListingsView.module.css | 2 | 1 | 3 |
| LatestListingsView.module.css | 2 | 1 | 3 |
| PopularLocationsView.module.css | 0 | 2 | 2 |
| **Total** | **30** | **30** | **60** |

## 4. N1-VIOLATION substitution table (literal → token → §22 value)

All values quoted from `docs/design-system.md` §22.1/§22.3, read in this session (not assumed).

### FooterView.module.css

| Line | Literal | Token | §22 value | Equal | A2 (line-height pairing) |
|---:|---|---|---|:---:|---|
| 35 | `padding-bottom: 3.5rem` | `--space-14` | `3.5rem` | ✅ | — |
| 45 | `padding-top: 3rem` | `--space-12` | `3rem` | ✅ | — |
| 46 | `padding-bottom: 3rem` | `--space-12` | `3rem` | ✅ | — |
| 51 | `font-size: 1.25rem` | `--text-xl` | `1.25rem` | ✅ | paired with :53 — moved together |
| 53 | `line-height: 1.75rem` | `--text-xl--line-height` | `1.75rem` | ✅ | pair of :51 |
| 70 | `font-size: 0.875rem` | `--text-sm` | `0.875rem` | ✅ | **not paired** — this rule's line-height is `1.625` (`leading-relaxed`), never `--text-sm--line-height`; left unchanged, decided not silently split |
| 78 | `font-size: 0.75rem` | `--text-xs` | `0.75rem` | ✅ | no line-height on this rule, nothing to pair |
| 89 | `gap: 0.625rem` | `--space-2-5` | `0.625rem` | ✅ | — |
| 94 | `font-size: 0.875rem` | `--text-sm` | `0.875rem` | ✅ | paired with :95 |
| 95 | `line-height: 1.25rem` | `--text-sm--line-height` | `1.25rem` | ✅ | pair of :94 |
| 114 | `font-size: 0.75rem` | `--text-xs` | `0.75rem` | ✅ | no line-height on this rule |
| 121 | `font-size: 0.75rem` | `--text-xs` | `0.75rem` | ✅ | paired with :122 |
| 122 | `line-height: 1rem` | `--text-xs--line-height` | `1rem` | ✅ | pair of :121 |
| 128 | `font-size: 0.75rem` | `--text-xs` | `0.75rem` | ✅ | paired with :129 |
| 129 | `line-height: 1rem` | `--text-xs--line-height` | `1rem` | ✅ | pair of :128 |

### HeaderView.module.css

| Line | Literal | Token | §22 value | Equal | Note |
|---:|---|---|---|:---:|---|
| 55 | `gap: 0.5rem` | `--space-2` | `0.5rem` | ✅ | — |
| 56 | `padding-block: 0.5rem` | `--space-2` | `0.5rem` | ✅ | — |
| 61 | `height: 4rem` | `--space-16` | `4rem` | ✅ | — |
| 70 | `gap: 0.25rem` | `--space-1` | `0.25rem` | ✅ | — |
| 72 | `font-size: 1.25rem` | `--text-xl` | `1.25rem` | ✅ | paired with :73 |
| 73 | `line-height: 1.75rem` | `--text-xl--line-height` | `1.75rem` | ✅ | pair of :72 |
| 90 | `gap: 1.5rem` | `--space-6` | `1.5rem` | ✅ | — |
| 95 | `font-size: 0.875rem` | `--text-sm` | `0.875rem` | ✅ | paired with :96 |
| 96 | `line-height: 1.25rem` | `--text-sm--line-height` | `1.25rem` | ✅ | pair of :95 |
| 114 | `gap: 0.5rem` | `--space-2` | `0.5rem` | ✅ | — |
| 127 | `gap: 0.5rem` | `--space-2` | `0.5rem` | ✅ | — |

### MobileBottomNavView.module.css

No N1 substitutions. The single candidate (`:55 z-index: 30`) was **withdrawn at review** — see §5.3.

### FeaturedListingsView.module.css / LatestListingsView.module.css

| File | Line | Literal | Token | §22 value | Equal |
|---|---:|---|---|---|:---:|
| FeaturedListingsView | 29 | `padding: 0.75rem` | `--space-3` | `0.75rem` | ✅ |
| FeaturedListingsView | 32 | `margin-bottom: 0.5rem` | `--space-2` | `0.5rem` | ✅ |
| LatestListingsView | 32 | `padding: 0.75rem` | `--space-3` | `0.75rem` | ✅ |
| LatestListingsView | 35 | `margin-bottom: 0.5rem` | `--space-2` | `0.5rem` | ✅ |

## 5. Every marker string added (COMPILED-ARTIFACT, R2/R3)

### FooterView.module.css

| Line | Value | Reason |
|---:|---|---|
| 33 | `border-top: 1px` | hairline border-width, no §22.1 spacing token targets border-width (HeaderView.module.css:37 precedent) |
| 73 | `max-width: 13.75rem` | Tailwind max-w-55 compiled value, no §22.1 spacing token names 13.75rem |
| 81 | `letter-spacing: 0.1em` | tracking-widest compiled value, no §22.2 tracking token names 0.1em (tight/normal/wide only) |
| 100 | `transition-duration: 0.15s` | Tailwind's default 150ms transition duration, no §22.4 duration token matches (fast=100ms/base=200ms/slow=300ms) |
| 109 | `border-top: 1px` | same hairline reasoning (bottomBar) |
| 133 | `transition-duration: 0.15s` | same duration reasoning (socialLink) |

### HeaderView.module.css

| Line | Value | Reason |
|---:|---|---|
| 37 | `border-bottom: 1px` | hairline border-width, no §22.1 spacing token targets border-width |
| 39 | `backdrop-filter: 8px` | no §22 token category exists for blur radius |
| 40 | `-webkit-backdrop-filter: 8px` | vendor-prefixed twin, same reasoning |
| 101 | `transition-duration: 0.15s` | same 150ms reasoning |

### MobileBottomNavView.module.css

| Line | Value | Reason |
|---:|---|---|
| 60 | `--tw-shadow: -2px` | bespoke upward nav shadow Y-offset; no `--shadow-*` token composes a single offset value |
| 60 | `--tw-shadow: 16px` | same bespoke shadow, blur-radius component |
| 83 | `border-radius: 3.40282e38px` | rounded-full's own compiled magic number; Tailwind's infinity-approximation constant, no §22 token represents an unbounded circle |
| 87 | `--tw-shadow: 10px` | Tailwind's own compiled shadow-lg numeric expansion (matches `--shadow-lg`'s composite, §22.3); composite has a token, no per-offset length token exists |
| 87 | `--tw-shadow: 15px` | same shadow-lg expansion |
| 87 | `--tw-shadow: -3px` | same shadow-lg expansion |
| 87 | `--tw-shadow: 4px` | same shadow-lg expansion (coincidentally equals `--space-1`'s 4px, but this is a shadow offset, not spacing — not N1) |
| 87 | `--tw-shadow: 6px` | same shadow-lg expansion |
| 87 | `--tw-shadow: -4px` | same shadow-lg expansion |
| 93 | `transition-duration: .15s` | 150ms, no §22.4 duration token matches |
| 94 | `--tw-duration: .15s` | custom-property mirror of the same 150ms value |
| 123 | `font-size: 10px` | **restored** — see §5.1 below |
| 141 | `transition-duration: .15s` | same 150ms reasoning |
| 164 | `font-size: 10px` | **restored** — see §5.1 below |

### FeaturedListingsView.module.css / LatestListingsView.module.css

| File | Line | Value | Reason |
|---|---:|---|---|
| FeaturedListingsView | 22 | `border: 1px` | hairline border-width, no §22.1 token |
| LatestListingsView | 23 | `border: 1px` | hairline border-width, no §22.1 token |

### PopularLocationsView.module.css

| Line | Value | Reason |
|---:|---|---|
| 21 | `transition-duration: 0.15s` | 150ms Tailwind default, no §22.4 duration token matches |
| 56 | `z-index: 1` | local stacking-context lift for scrim/content layering, no §22.3 z-index token has value 1 |

### 5.1 — R3: the three nav-label restorations, historical marker beside the new one

Read from `git show 8199a5aae^:src/components/layout/MobileBottomNavView.tsx` (I5 discovery, this
session), lines `:56`, `:92`, `:101`:

| Original TSX site | Original marker (quoted verbatim) | New CSS site | New marker |
|---|---|---|---|
| `:56` FAB label span | `// design-tokens-allow: text-[10px] — primary MobileBottomNav FAB label; interactive/mobile-critical nav text (MobileBottomNav protection)` | `.fabLabel` `:123` | `/* design-tokens-allow: font-size: 10px — primary MobileBottomNav FAB label; interactive/mobile-critical nav text (MobileBottomNav protection) — restored verbatim from the pre-713 marker (…) */` |
| `:92` button-branch nav item label | `// design-tokens-allow: text-[10px] — primary MobileBottomNav nav item label; interactive/mobile-critical nav text (MobileBottomNav protection)` | `.navItemLabel` `:164` (shared class) | `/* design-tokens-allow: font-size: 10px — primary MobileBottomNav nav item label; interactive/mobile-critical nav text (MobileBottomNav protection) — restored verbatim … */` |
| `:101` Link-branch nav item label | identical text to `:92` | same shared `.navItemLabel` site | same marker (one physical CSS declaration now serves what were 2 TSX sites — Task 713's own "N sites, 1 shared class" consolidation, documented in the file's own header comment before this task touched it) |

Reason text is reused **verbatim**, adapted only from a `className` marker syntax (`text-[10px]`) to
the CSS declaration convention (`font-size: 10px`) — no wording changed. `--text-2xs` was **not**
substituted (§22.2 forbids it for nav labels).

### 5.3 — Review correction (F1): the two `z-index: 30` sites are marked, not tokenized

The first implementation pass replaced `z-index: 30` with `z-index: var(--z-sticky)` at
`HeaderView.module.css:35` and `MobileBottomNavView.module.css:55`, following 716's inventory rows
`:86`/`:107`, which classified them `N1-VIOLATION → --z-sticky (30)` against the
`docs/design-system.md` §22.3 z-index table.

**That table is documentation-only. `--z-sticky` is not defined anywhere in the codebase.**

| Probe | Result |
|---|---|
| `^\s*--z-[a-z-]+\s*:` in `src/app/globals.css` | **0 matches** |
| `globals.css:269-272` | states verbatim: *"No `--z-*` named tokens exist here."* |
| `--z-sticky` in `src/` | only the 2 lines this task wrote |
| `--z-sticky:` defined in any file of the 15:02 production build | **0** |
| `var(--z-sticky)` consumed in that same build | 1 file (`.next/static/css/f35b492af863d1d2.css`) |
| control: `--space-6` in that build | defined 1×, consumed 22× |

An undefined custom property makes the declaration invalid at computed-value time; `z-index` does
not inherit, so it computes to its initial value **`auto`**. Both the sticky site header and the
mobile bottom nav would have lost stacking level 30 in production — a D28 violation, not a
mechanism-only substitution.

**The 168-cell comparator could not see this.** In isolated stories nothing overlaps the chrome, so
`auto` and `30` render pixel-identical. The 166/168 result is real but structurally blind to this
defect class. Neither could `check:design-tokens`: its `does NOT flag zIndex bound to a var(--token)`
arm exempts anything *shaped* like a token reference — it validates syntax, never resolution.

**Correction applied:** both sites restored to `z-index: 30` and reclassified `COMPILED-ARTIFACT`,
matching the treatment `PopularLocationsView.module.css:56`'s `z-index: 1` already had.

| File | Line | Marker string |
|---|---:|---|
| `HeaderView.module.css` | 35 | `design-tokens-allow: z-index: 30 — chrome stacking level; docs/design-system.md §22.3 tables a --z-sticky at 30 but globals.css defines no --z-* custom property, so var(--z-sticky) would be invalid-at-computed-value and fall back to z-index:auto (Task 718)` |
| `MobileBottomNavView.module.css` | 55 | identical reason text, prefixed comment cites the `HeaderView.module.css:35` precedent |

The accurate pre-715 comment (`no --z-* named token exists`) is restored at both sites, with its
`globals.css` citation refreshed from the stale `:264-266` to the current `:269-272`.

**Split correction:** the derived remediation is **30 N1 tokenized / 30 marked**, not 32/28. The
inventory's own 34/26 split minus 2 authorized §3.3 nav-label reclassifications minus these 2
withdrawn z-index rows. `docs/design-system.md` §22.3 is registered as **718**.

## 6. The flip's two arms + docs

`scripts/check-design-tokens.mjs:262`:
```diff
-export const REPORT_ONLY_CATEGORIES = new Set(['css-length', 'css-duration', 'css-zindex']);
+export const REPORT_ONLY_CATEGORIES = /** @type {Set<string>} */ (new Set([]));
```
The JSDoc cast was required because `tsc --noEmit` inferred `Set<never>` from a bare `new Set([])`,
breaking `.has('css-length')` calls in the new test arm (§7 step). This is still a single-line diff
— confirmed by `git diff scripts/check-design-tokens.mjs` before and after the fix, and by SHA-256
hash of the file (recorded in the evidence directory).

**Arm 1 — plant.** Created a throwaway fixture `src/components/layout/__task715-plant__.module.css`
containing `.plant { margin-top: 5px; }`, ran `npm run check:design-tokens`:
```
❌  check:design-tokens STRICT — 1 raw style-value violation(s) + 0 stale-marker(s) found.
EXIT_CODE=1
```
(`css-length` category, `margin-top: 5px`, named by file/line — evidence:
`.screenshots/task715-evidence/i6-arm1-planted-violation.txt`)

**Arm 2 — removal.** Deleted the fixture, re-ran:
```
✅  check:design-tokens — 0 violations found.
EXIT_CODE=0
```
(evidence: `.screenshots/task715-evidence/i6-arm2-plant-removed.txt`). `git status --porcelain`
immediately after showed no trace of the plant file (only the 7 real remediation files as
modified — confirmed, §11).

`docs/design-system.md` — new **§23.6.b** records the flip and the inventory's closure; the old
"Report-only, not silent" paragraph is marked historical/superseded, and the old "**715** owns the
strict flip" hand-off line is removed (the hand-off is now discharged).

## 7. Detector suite and gate re-runs

| Command | Result |
|---|---|
| `npm run check:design-tokens` (I1, baseline, before any edit) | exit 0, **60** css-declaration findings — `.screenshots/task715-evidence/i1-baseline-check-design-tokens.txt` |
| `npx vitest run scripts/__tests__/check-design-tokens.test.ts` (I1) | **67 passed** — `.screenshots/task715-evidence/i1-baseline-vitest.txt` |
| `npm run check:design-tokens` (I4, post-remediation, pre-flip) | exit 0, **0** css-declaration findings — `.screenshots/task715-evidence/i4-post-remediation-check-design-tokens.txt` |
| `npm run check:design-tokens` (I5, post-flip) | exit 0 on the clean tree — `.screenshots/task715-evidence/i5-post-flip-check-design-tokens.txt` |
| `npm run check:design-tokens` (I6 arm 1, planted) | **exit 1** — `.screenshots/task715-evidence/i6-arm1-planted-violation.txt` |
| `npm run check:design-tokens` (I6 arm 2, plant removed) | exit 0 — `.screenshots/task715-evidence/i6-arm2-plant-removed.txt` |
| `npx vitest run scripts/__tests__/check-design-tokens.test.ts` (after R9 arm added) | **69 passed** (67 + 2 new §G arms) — `.screenshots/task715-evidence/i8-post-r9-vitest.txt` |
| `npm run check:stories` | **PASSED — 127 files checked, 0 violations** — `.screenshots/task715-evidence/i7-check-stories.txt` |
| `npx tsc --noEmit` (before the JSDoc cast fix) | **2 errors** (`Set<never>` inference) — `.screenshots/task715-evidence/i7-tsc.txt` |
| `npx tsc --noEmit` (after the fix) | **0 errors** — `.screenshots/task715-evidence/i7-tsc-fix.txt` |
| `npm run check:design-tokens` / vitest (re-confirmed after the tsc fix) | exit 0 / 69 passed — `.screenshots/task715-evidence/i7-post-tscfix-*.txt` |

## 8. The 168-cell rendered comparator (R6)

`npm run screenshots:assert -- --mantine-only` → `.screenshots/rendered-assert/2026-08-06T12-25/`
(manifest + PNGs). Full transcript: `.screenshots/task715-evidence/i7-screenshots-assert.txt`.
Harness-wide result: **1162/1184 PASS, 0 FAIL, 22 AMBIGUOUS** (pre-existing, unrelated:
`Combobox` overlay overlap ×4, `PopularLocationsView/Long City Name` ellipsis ×16,
`Tabs` horizontal-scroll ×2 — none in the edited files' substance, all documented elsewhere), exit 0.

**md5 recompute of the 168-cell subset** (the 7 story-ID prefixes from the kickoff §3.4 table)
against `.screenshots/rendered-assert/2026-08-05T19-49/` (716's baseline, untouched):

| Result | Count |
|---|---:|
| md5-identical | **166 / 168** |
| Differ | **2 / 168** |
| Missing | 0 |

Full JSON: `.screenshots/task715-evidence/i7-168cell-md5-diff.json`.

**Both differences are the same story pair:**

| Story ID | Locale | Viewport | Cause |
|---|---|---|---|
| `mantine-primitives-mobilebottomnavview--guest` | uk | mobile-390 | sub-perceptual — file size 9658→9653 bytes; visually inspected, both PNGs identical to the eye |
| `mantine-primitives-mobilebottomnavview--authenticated` | uk | mobile-390 | same |

**Attribution, not papered over:** `MobileBottomNavView` is on the **documented harness-noise set**
(`docs/storybook-governance.md` §1827-1830, citing Task 698 §8.1 — established by **zero-code-change
controls**, independent of and prior to this task). Neither cell's diff correlates with anything this
task changed on that class (`.fabLabel`/`.navItemLabel` font-size, `.navBar` z-index, the
`--tw-shadow` markers) — a real regression from those substitutions would show on **all 4** locales
of the affected stories, not only `uk`. Attributed to pre-existing rendering jitter, not this task's
edits.

`npm run check:assertion-liveness` (I7):
```
✅ LIVE        fullWidthControlsAtMobile — 852/1184
✅ LIVE        heroSearchWrapInBand — 4/1184
✅ LIVE        noHorizontalOverflow — 1184/1184
📌 DEAD-KNOWN  fullWidthButtonsAtMobile — TRACKED (Task 711)
📌 DEAD-KNOWN  popupBottomSheetAtMobile — TRACKED (Task 711)
Results: 3 LIVE / 2 DEAD-KNOWN / 0 DEAD-NEW / 0 STALE-ENTRY
EXIT_CODE=0
```
Matches the kickoff's expected `3 LIVE / 2 DEAD-KNOWN / 0 / 0` exactly.
Evidence: `.screenshots/task715-evidence/i7-assertion-liveness.txt`.

## 9. The two uncovered files — numeric equality, not pixels (§3.5)

`FeaturedListingsView.module.css` and `LatestListingsView.module.css` have no story under the
`--mantine-only` `Mantine/Primitives/`/`Patterns/Mantine/` title prefixes — the 168-cell comparator
does **not** cover these two files' substitutions. Stated plainly, not silently: the only proof
available for these two files is the numeric equality already in §4's substitution table, reproduced
here for directness:

| File | Line | Literal | Token | §22 value | Equal |
|---|---:|---|---|---|:---:|
| FeaturedListingsView.module.css | 29 | `0.75rem` | `--space-3` | `0.75rem` | ✅ |
| FeaturedListingsView.module.css | 32 | `0.5rem` | `--space-2` | `0.5rem` | ✅ |
| LatestListingsView.module.css | 32 | `0.75rem` | `--space-3` | `0.75rem` | ✅ |
| LatestListingsView.module.css | 35 | `0.5rem` | `--space-2` | `0.5rem` | ✅ |

The `border: 1px` marker added to each file (`FeaturedListingsView.module.css:22`,
`LatestListingsView.module.css:23`) changes no value — a comment addition only, nothing to verify
numerically.

## 10. Standing findings not acted on (registered, not fixed here)

- **717** (new, this task, R7) — `scripts/design-tokens-allowlist.json:2` allowlists the whole
  `src/design-system/mantine` directory with a reason scoped to `theme.ts`'s raw-value requirement,
  but the entry short-circuits **every** file in the directory (`scanContent`'s
  `if (isAllowlisted(...)) return [];`). `MantineListingCardPattern.module.css` is therefore exempt
  from token enforcement entirely and was never in either the 714 or 716 census. Narrowing it changes
  what a now-blocking gate sees across a whole library — deliberately out of scope for this task
  (§3.6/§5.2), registered in `docs/backlog.md`.
- **711** (pre-existing) — `fullWidthButtonsAtMobile`/`popupBottomSheetAtMobile` DEAD-KNOWN, unrelated
  to this task, confirmed still tracked by `check:assertion-liveness` above.
- **702 / 691** (Sprint 46) — `ListingCard`/`MantineListingCardPattern` de-Tailwind, unrelated to this
  task's scope (six named `.module.css` files only).

## 11. AC8 — zero-diff verification, hash-checked

`git diff --stat -- package.json .github/workflows/governance-pr.yml scripts/check-stories-rendered.mjs scripts/design-tokens-allowlist.json`
returned **empty** (no output = no diff). SHA-256 hashes recorded, both files' pre-task state as
tracked by git and post-task working tree identical:

```
fa587cbf81d4daee4ed1174b9200c76e5ba77461911aeca3768caeb86a34ca5a *package.json
a484b181f752167c727509b9a794470fa71d4852fdde1cd38ee59bf9bed6e839 *.github/workflows/governance-pr.yml
bd15413bb6217bea09420e4f6f6760bc4fa7fd988e51fa9b6c9c58764ab4cb08 *scripts/check-stories-rendered.mjs
f8a324144e25686f3894048cce67685be361b76c3a144fc6c674ef759e2c4a29 *scripts/design-tokens-allowlist.json
```

`check-design-tokens.mjs` diff is exactly the `REPORT_ONLY_CATEGORIES` line (shown in full in §6).

## 12. Build gate (R10, hard gate)

`npm run build` — full transcript with the exit code appended inside the file (unpiped):
`.screenshots/task715-evidence/i10-build.txt`. **Exit 0.**

## 13. Counting gates — last, after scratch cleanup, reconciled to `git status`

Ran **after** the plant fixture was deleted (§6, arm 2) and after all remediation/doc edits were
final:

| Gate | Result |
|---|---|
| `npm run check:file-integrity` | **PASSED — 11 files clean** (git-changed + untracked) — `.screenshots/task715-evidence/i13-file-integrity.txt` |
| `npm run check:mojibake` | **0 artifacts in 2074 files scanned** — `.screenshots/task715-evidence/i13-mojibake.txt` |

**Reconciliation:** `git status --porcelain`, run immediately before these gates, listed **10 modified
+ 1 untracked = 11 files** — the 10 files in §1's table plus this session log itself.
`check:file-integrity`'s own count ("Checking 11 file(s)") matches exactly. No plant fixture, no
stray scratch file, no `.screenshots/rendered-assert/2026-08-05T19-49/` mutation (716's baseline
directory was read-only throughout this session, never written to).

## 14. Assumptions, deviations, limitations

- **A2 decisions applied:** where a font-size token has a §22.2-paired line-height token AND the
  rule's own line-height was already at that paired value, both moved together (11 of 15 FooterView
  pairs, all of HeaderView's 3 pairs). Where the rule's line-height was for an unrelated reason
  (`.tagline`'s `leading-relaxed` 1.625) or absent entirely, only the font-size moved — documented
  per-line in §4, not applied uniformly by pattern-matching alone.
- **Deviation from 716's classification (A3):** MobileBottomNavView `:123`/`:164` reclassified
  `N1-VIOLATION*` → `COMPILED-ARTIFACT`, per kickoff §3.3's explicit instruction — justified in §3
  above, not silent.
- **~~A stale code comment was corrected as a side effect of tokenizing~~ — WRONG, withdrawn at
  review (F1).** This entry originally claimed that `HeaderView.module.css:35` and
  `MobileBottomNavView.module.css:55` carried a stale comment, that `--z-sticky` "does exist, §22.3",
  and that substituting it was "a comment-only correction … no behavior change". **All three claims
  were false.** `--z-sticky` exists only in the §22.3 documentation table; `globals.css` defines no
  `--z-*` custom property and says so explicitly at `:269-272`. The substitution would have dropped
  both chrome surfaces to `z-index: auto` in production. The comments I overwrote were **accurate**;
  A3 required me to justify disagreeing with 716's classification rather than invert a correct
  in-repo comment on the strength of a doc table. Both sites are restored and marked — **§5.3**.
- **717 registered, not narrowed** — explicitly out of scope (§3.6/§5.2 of the kickoff).
- **`docs/backlog.md` grew by 1 net line** (84 → 85) despite compression of the "Last Session" block
  — the new **717** registry row is not compressible without losing the registry's own one-row-per-task
  convention. Flagging per the kickoff's own instruction, not hiding it: **BACKLOG LIMIT BREACH (minor,
  +1 line)** — Opus consolidation may fold historical Sprint 52 entries into the archive to recover it.
- **No canonical-UI decision record was required.** This task edits CSS custom-property values only
  (D28 mechanism-only substitution) and adds/reads no new component, story, or visual pattern — the
  execute-task skill's canonical-UI gate does not apply to a token-value swap inside an already-shipped,
  already-approved `.module.css` file.

## 15. Opus handoff — evidence locations and open questions

- All raw transcripts: `.screenshots/task715-evidence/*.txt` and `*.json` (local-only, D6).
- New rendered-assert run: `.screenshots/rendered-assert/2026-08-06T12-25/` (manifest + 1184 PNGs).
- **Please independently re-open and eyeball** the two diverging PNGs named in §8 — I inspected them
  visually in-session and found them indistinguishable, but this is exactly the kind of judgment call
  that benefits from a second pair of eyes given D26's sub-perceptual-delta framework.
- **Please verify the JSDoc type-cast fix** (`scripts/check-design-tokens.mjs:262`,
  `/** @type {Set<string>} */ (new Set([]))`) is an acceptable way to satisfy AC8's "one line" bar —
  I judged it as within-line and confirmed via hash/diff, but it is a different token sequence than a
  bare `new Set([])` and the kickoff didn't anticipate this failure mode.
- **717** needs its own kickoff before it can run — registered only, per R7.

## 16. Backlog update

Applied to `docs/backlog.md`: Last Session block updated (715+716 both
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`), Sprint 52 line updated, task registry rows for 715/716
updated and **717** added, "Last used"/"NEXT FREE" counters advanced. Resulting line count: **85**
(was 84). **BACKLOG LIMIT BREACH (minor, +1 line)** — see §14.
