# Task 712 — Homepage route shell de-Tailwind + `HeroSearch` Story parity repair

**Task:** `tasks/Sprints/Sprint_51_kickoff_prompt_Task_712_HomepageRouteShell_DeTailwind.md`
**Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`**

---

## 1. Files changed

Reconciled against the pre-write `git status --porcelain` snapshot (empty — clean worktree at
session start, no dirty-worktree manifest required).

| Path | Type | Reason |
|---|---|---|
| `src/app/[locale]/page.tsx` | edit (1 line, `:29`) | Removed raw Tailwind `relative`/`z-10` utilities; `container-wide` kept verbatim |
| `src/stories/mantine/primitives/HeroSearch.stories.tsx` | edit (2 wrapper regions, `:53-54`→now `:56-57`, `:90-91`→now `:93-94`, plus the new `Box` import) | Both stories now render the same Mantine `Box` composition production renders — closes the cl. 16c divergent-stand-in defect |
| `docs/backlog.md` | edit | R7 census correction (route files named), Last Session rewrite, Task registry row 712 |
| `docs/storybook-governance.md` | edit (new §14.9.24) | R8 — records the cl. 16c stand-in defect and its closure, cross-referenced to the 40-cell comparator |
| `docs/sessions/2026-08-05-task712-homepage-route-shell-de-tailwind.md` | new | This session log |

**Zero-diff scope, verified by `git diff` (empty):** `src/app/[locale]/layout.tsx`,
`src/components/shared/HeroSearchView.tsx`, `src/components/shared/HeroSearchView.module.css`,
`scripts/check-stories-rendered.mjs`. No `page.module.css` was created — A4 resolved: Mantine style
props already expressed everything needed (in fact nothing needed reproducing at all — see §3 A1).

---

## 2. Requirement IDs completed

| ID | AC | Verdict |
|---|---|---|
| R1 — `page.tsx:29` zero raw utilities, `container-wide` verbatim | AC1 | **PASS** — quoted in §5 |
| R2 — `relative`/`z-10` reproduced or dropped with measured-inert proof | AC2 | **PASS** — dropped; I1/I3 stacking-census diff below |
| R3 — any module `@layer utilities` + N1 token references | AC3 | **PASS (vacuously)** — no module created; props/nothing sufficed |
| R4 — Story renders the same Mantine `Box` composition as production | AC4 | **PASS** — both wrapper regions quoted in §5 |
| R5 — 40/40 herosearch md5s vs `2026-08-05T11-33` | AC5 | **PASS** — 40/40, 0 mismatches |
| R6 — geometry-parity measurement (`py-16 md:py-24` vs Mantine `py`) | AC6 | **PASS** — both resolve to 64px/96px, identical |
| R7 — `docs/backlog.md:22` census names route files | AC7 | **PASS** — see backlog diff |
| R8 — `docs/storybook-governance.md` records the stand-in defect + closure | AC8 | **PASS** — §14.9.24 added |
| R9 — zero diff on `layout.tsx`/`HeroSearchView.tsx`/`.module.css`/`check-stories-rendered.mjs` | AC9 | **PASS** — `git diff` empty on all four |
| R10 — `npm run build` exit 0, transcript persisted | AC10 | **PASS** — `.screenshots/task712-evidence/i7-build.log`, `EXIT_CODE=0` |
| R11 — no user-facing string added/changed | AC11 | **PASS** — no i18n key touched |
| R12 — counting gates run last, real numbers in this log | AC12 | **PASS** — §9 |

---

## 3. Current versus required behavior

**Current (start of session):** the homepage hero band rendered `<Box component="section" bg pos
py>` wrapping `<Box className="container-wide relative z-10">`. `relative`/`z-10` were raw
Tailwind utilities on a file no census counted. The canonical Story the CI-blocking
`--mantine-only` matrix uses to prove that band rendered a hand-written `<section>`/`<div>`
replica with its own raw utilities, whose geometric equivalence to production had never been
measured.

**Required after (this session):** `page.tsx:29` carries no raw utilities; `container-wide`
survives verbatim; the inner stacking context is dropped with measured proof it was inert; the
Story renders the same Mantine composition production renders; all 40 herosearch cells hold their
baseline md5.

### A1 — was `z-10` load-bearing?

**No — measured inert, dropped.** Pre-edit stacking census of every element inside the hero
section with a non-static `position` or non-`auto` `z-index`, captured via an ad-hoc Playwright
script (transient, not persisted — same convention as Task 709/709-R's own I2/I3 captures)
against the built `Mantine/Primitives/HeroSearch/Default` story at 320/700/1024:

- Pre-edit: 17 stacking-relevant elements, including the `container-wide relative z-10` wrapper
  itself (`position: relative`, `zIndex: 10`).
- Post-edit: 16 stacking-relevant elements — **byte-identical to the pre-edit list minus the
  removed wrapper entry** (confirmed by direct array comparison at all 3 widths).
- **Paint-order witness** (`document.elementsFromPoint` at 5 representative points per width —
  center, top/bottom/left/right edges) is unchanged at the *element identity and order* level at
  all 3 widths; the only differences in the raw stack strings are cosmetic (Mantine's own
  generated `Box` class replacing the raw `section.relative.py-16`/`div.container-wide.relative`
  strings — the intended effect of the I3 story-parity edit, not a stacking change).
- Source-level corroboration: `HeroSearchView.tsx`'s own comment (`:125-126`) confirms the one
  historical consumer that needed absolute/corner positioning (the old raw corner-badge span) was
  already replaced by `MantineCountButton`'s own internal positioned badge in Task 571 — nothing
  in the current subtree depends on the `container-wide` div itself being a positioned ancestor.
- The outer `Box` (`page.tsx:28`) already carries `pos="relative"` as a Mantine style prop, so the
  hero section itself remains a stacking context; nothing was removed from the outer `Box`.

**Conclusion:** `relative`/`z-10` on the inner wrapper had no sibling to stack against and no
descendant relying on it as a positioning ancestor. Dropped per R2, not reproduced — this diff
*is* the proof, per AC2.

### A2 — did the Story ever match production geometrically?

**Yes, always.** Computed `padding-top`/`padding-bottom` on the wrapper section, captured at the
same three widths, pre- and post-edit:

| Width | `py-16`/`md:py-24` (pre-edit replica) | `py={{ base:'var(--space-16)', md:'var(--space-24)' }}` (post-edit `Box`) |
|---:|---|---|
| 320 | 64px / 64px | 64px / 64px |
| 700 | 64px / 64px | 64px / 64px |
| 1024 | 96px / 96px | 96px / 96px |

Identical at every width. Tailwind's `py-16`/`md:py-24` resolve through `calc(var(--spacing) * N)`
(`--spacing: 0.25rem`) to `4rem`/`6rem`; `--space-16`/`--space-24` (`globals.css:165,167`) are
`4rem`/`6rem` by declaration — the same values by construction, now also confirmed by direct
`getComputedStyle` measurement rather than by source inspection alone. **The Story never diverged
from production geometrically** — only its markup (raw `<section>`/`<div>` vs. Mantine `Box`)
diverged. No md5 baseline move was expected on geometry grounds, and none occurred.

### Negative flows (§11 applicability table)

| Branch | Applicable? | Result |
|---|---:|---|
| `z-10` was load-bearing | Yes | Did not occur — measured inert, dropped with persisted proof |
| `z-10` was inert | Yes | **This branch occurred** — dropped, stacking census byte-identical minus the removed entry |
| Story geometry ≠ production geometry | Yes | Did not occur — 0 diffs in computed padding at any of 3 widths |
| Story geometry == production geometry | Yes | **This branch occurred** — 64px/64px/96px/96px identical pre/post |
| Mantine props cannot express the mechanism | Yes | Did not occur — nothing needed reproducing; no module file created |
| A new assertion dies from this change | Yes | Did not occur — `check:assertion-liveness` unchanged at 3 LIVE/2 DEAD-KNOWN/0/0 |
| Locale expansion | No | No string added or changed |
| Small viewport / responsive | Yes | Covered by the 40-cell comparator (320/375/390/1024/700) |
| RLS / authorization | No | Presentational route shell, no data access |
| Duplicate action / partial failure | No | Static markup, no action or async branch |

---

## 4. The A1/A2 answers

See §3 above (both folded into the current/required-behavior narrative per the kickoff's request
to answer them plainly).

---

## 5. Before/after quotes

**`src/app/[locale]/page.tsx:29`:**

```diff
- <Box className="container-wide relative z-10">
+ <Box className="container-wide">
```

**`HeroSearch.stories.tsx` `Default` wrapper (was `:53-54`, now `:56-57`):**

```diff
- <section className="relative py-16 md:py-24" style={{ background: 'var(--primary)' }}>
-   <div className="container-wide relative z-10">
+ <Box component="section" bg="var(--primary)" pos="relative" py={{ base: 'var(--space-16)', md: 'var(--space-24)' }}>
+   <Box className="container-wide">
```
(closing tags updated to match: `</div></section>` → `</Box></Box>`)

**`HeroSearch.stories.tsx` `Fallback` wrapper (was `:90-91`, now `:93-94`):**

```diff
- <section className="relative py-16 md:py-24" style={{ background: 'var(--primary)' }}>
-   <div className="container-wide relative z-10">
+ <Box component="section" bg="var(--primary)" pos="relative" py={{ base: 'var(--space-16)', md: 'var(--space-24)' }}>
+   <Box className="container-wide">
```

---

## 6. The 40-cell md5 result

`npm run screenshots:assert -- --mantine-only` → `.screenshots/rendered-assert/2026-08-05T17-47/`.
Direct md5 comparison of all 40 `mantine-primitives-herosearch--*` PNGs against
`.screenshots/rendered-assert/2026-08-05T11-33/` (the 709-R baseline this task was scoped to
prove against): **40/40 identical, 0 mismatches, 0 missing.**

---

## 7. Commands run and actual results

| # | Command | Result | Evidence |
|---:|---|---|---|
| 1 | `git status --porcelain` (I1) | empty — clean worktree | (no file needed, confirmed inline) |
| 2 | `npm run build-storybook` (I1, pre-edit) | exit 0 | `i1-pre-edit-build-storybook.log` |
| 3 | Ad-hoc Playwright stacking/padding capture (I1, pre-edit) | 3 widths captured | `i1-pre-edit-stacking-padding.json` |
| 4 | `page.tsx:29` edit (I2) | 1 line changed | — |
| 5 | Story parity edit (I3) | 2 wrapper regions changed, `Box` import added | — |
| 6 | `npm run build-storybook` (I3, post-edit) | exit 0 | `i3-post-edit-build-storybook.log` |
| 7 | Ad-hoc Playwright stacking/padding capture (I3, post-edit) | 3 widths captured, diffed vs. I1 | `i3-post-edit-stacking-padding.json` |
| 8 | `npm run screenshots:assert -- --mantine-only` (I4) | `Results: 1162/1184 PASS, 0 FAIL, 22 AMBIGUOUS`; **`EXIT_CODE=0`** captured unpiped, inside the file | `i4-mantine-only-assert.log`, `.screenshots/rendered-assert/2026-08-05T17-47/` |
| 9 | 40-cell md5 recompute vs `2026-08-05T11-33` | 40/40 match, 0 mismatches; **`EXIT_CODE=0`** captured unpiped, inside the file | `i4-herosearch-md5-comparison.log` |
| 10 | `npm run check:assertion-liveness -- --manifest .screenshots/rendered-assert/2026-08-05T17-47/manifest.json` (I5) | `3 LIVE / 2 DEAD-KNOWN / 0 DEAD-NEW / 0 STALE-ENTRY`; **`EXIT_CODE=0`** | `i5-assertion-liveness.log` |
| 11 | `npm run check:stories` | `127 files checked, 0 violations`; exit 0 | `i7-check-stories.log` |
| 12 | `npm run check:design-tokens` | `0 violations found`; exit 0 | `i7-check-design-tokens.log` |
| 13 | `npx tsc --noEmit` | 0 errors; exit 0 | `i7-tsc.log` |
| 14 | **`npm run build`** | **exit 0** — hard gate | `i7-build.log` |
| 15 | `npm run check:file-integrity` · `npm run check:mojibake` — **last** | see §9 | `i9-file-integrity.log`, `i9-mojibake.log` |

The `--mantine-only` run's PASS/FAIL/AMBIGUOUS totals (1162/1184 PASS, 0 FAIL, 22 AMBIGUOUS) are
identical to the 709-R revert-confirm run's own totals — the 22 ambiguous cells are all
pre-existing, unrelated stories (`PopularLocationsView/Long City Name`, `Tabs/Default`), none of
them herosearch, all previously documented (§14.9.4, `storybook-governance.md`).

---

## 8. Evidence locations

All under `.screenshots/task712-evidence/` (local-only, D6) except the rendered-assert run
directory itself:

- `i1-pre-edit-build-storybook.log`, `i1-pre-edit-stacking-padding.json`
- `i3-post-edit-build-storybook.log`, `i3-post-edit-stacking-padding.json`
- `i4-mantine-only-assert.log`, `i4-herosearch-md5-comparison.log`
- `i5-assertion-liveness.log`
- `i7-check-stories.log`, `i7-check-design-tokens.log`, `i7-tsc.log`, `i7-build.log`
- `i9-file-integrity.log`, `i9-mojibake.log`
- `.screenshots/rendered-assert/2026-08-05T17-47/` (this session's full run + manifest;
  `2026-08-05T11-33/`, the 709-R baseline, was not modified or overwritten)

---

## 9. Counting gates (run last, after this log and the backlog row existed)

Run after this session log and the `docs/backlog.md` update were both in place, per N6/§10.8.
**Real, actual numbers from the live run:**

- `npm run check:file-integrity` — scope: git-changed + untracked (default). **Checked 5 file(s)**
  (NUL bytes · BOM · JSON parse · `node --check` · truncation). **PASSED — all 5 file(s) clean.**
  `EXIT_CODE=0`. The 5 files match this session's real changed set: `page.tsx`,
  `HeroSearch.stories.tsx`, `docs/backlog.md`, `docs/storybook-governance.md`, and this session log
  (created after the docs edits, so it was already present for this run).
- `npm run check:mojibake` — scanned **2063** text file(s) under `docs/ src/ app/ components/
  modules/ messages/ tasks/ scripts/` + root `*.md`. **0 artifacts in 2063 files.** `EXIT_CODE=0`.

---

## 10. Standing findings not acted on

1. **`layout.tsx`/Sprint 50** — coupled to `MobileBottomNavView`'s `pb-14`/`md:pb-0` pair; out of
   this task's scope by design (§5.2/§8 of the kickoff). Zero diff confirmed.
2. **No repo-wide route-file utility gate exists.** R7 closes the census gap in documentation
   (`docs/backlog.md`); a dedicated gate remains a follow-up, not built here (kickoff §5.2/§8).
3. **The pre-existing `<div>`-in-`<p>` FiltersPanel hydration warning (Task 677)** — untouched,
   unrelated to this task's scope.
4. **The `LocationComboboxSubPanel` blank-canvas capture flake** — did not recur in this session's
   `--mantine-only` run (0 FAIL, no mention in the ambiguous list); consistent with the
   709-R-documented transient capture-flake pattern. Not re-triaged as a defect.
5. **`fullWidthButtonsAtMobile`/`popupBottomSheetAtMobile` remain `DEAD-KNOWN`** (Task 711, not
   this task's scope) — unaffected by this session's changes, confirmed via `check:assertion-liveness`
   reporting the identical `3 LIVE / 2 DEAD-KNOWN / 0 DEAD-NEW / 0 STALE-ENTRY`.

---

## 11. Assumptions, deviations, limitations, unresolved issues

- **A1** resolved to "inert, dropped" — no `BLOCKED`, no reproduction mechanism needed. See §3.
- **A2** resolved to "always matched" — no md5 baseline move occurred or was needed. See §3.
- **A4** resolved to "Mantine props already sufficed" — in fact nothing needed reproducing at all,
  so no `page.module.css` was created; R3/AC3 are satisfied vacuously (no raw declaration survives
  to reproduce).
- **Deviation:** none. The implementation matches the kickoff's I1–I7 sequence exactly.
- No mutating git command was run, suggested, or emitted, per the executor git boundary.
- The transient Playwright capture script used for I1/I3 was not persisted (same convention as
  Task 709/709-R's own ad-hoc I2/I3 captures) — it ran from the repo root only to resolve
  `playwright` via `node_modules`, and was deleted immediately after use; `git status` confirms it
  left no trace.

---

## 12. Opus handoff — evidence locations and questions

**Evidence root:** `.screenshots/task712-evidence/` (local-only, D6). Named run directory created
this session: `.screenshots/rendered-assert/2026-08-05T17-47/`. The `2026-08-05T11-33/` baseline
(709-R's evidence) was not modified, overwritten, or deleted.

**Questions/risks for review:**

1. Please independently re-verify the A1 stacking-census diff (§3) — the claim that
   `relative`/`z-10` had zero effect rests on the pre/post element census matching byte-for-byte
   minus the removed wrapper entry, plus the paint-order witness at 5 points × 3 widths. Both
   captures are persisted as JSON for direct inspection.
2. Confirm the A2 padding measurement (§3) is convincing as the geometry-parity proof R6 asks for —
   it is a `getComputedStyle` measurement, not a source-code inference alone.
3. Confirm the R3/AC3 "vacuous pass" (no module file created, because nothing needed reproducing)
   is an acceptable reading of A4, given the kickoff frames a module as "the fallback, not the
   default."

## 13. Backlog update

`docs/backlog.md` updated: "Last Session" header/bullets rewritten for 712 (concise state only,
old 709/709-R/D34 bullets removed — D34 remains recorded in the Standing notes section and the
archive; 709/709-R's own row was already in the archive ledger), new Task registry row for 712,
header numbers advanced to `Last used 712, NEXT FREE 713`, and the R7 route-file census
correction folded into the existing homepage-census paragraph (no new physical line — the
paragraph is a single line in the file). **Net line count: held flat at 99** (unchanged from
session start) — the file remains over its ~80-line target from before this session; this is the
same **standing `BACKLOG LIMIT BREACH`** the 709-R and 710 sessions already flagged, not a new
one introduced here. Still owed to Opus for consolidation.

