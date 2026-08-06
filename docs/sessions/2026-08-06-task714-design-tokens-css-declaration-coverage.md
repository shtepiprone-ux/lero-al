# Task 714 — `check:design-tokens` CSS declaration coverage (css-length/css-duration/css-zindex)

**Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`**

Kickoff: `tasks/Sprints/Sprint_52_kickoff_prompt_Task_714_DesignTokens_CSS_Declaration_Coverage.md`.
Branch: `task/q0-ci-rendered-locale-split`. Pre-write `git status --porcelain`: empty (verified before
the first edit, §3.7).

## 1. Files changed

| File | Reason |
|---|---|
| `scripts/check-design-tokens.mjs` | New `stripCssComments()` helper; 3 new `DETECTION_PATTERNS` entries (`css-length`, `css-duration`, `css-zindex`, `cssOnly: true`); `scanContent` gates the new patterns to `.css` files using a CSS-comment-stripped source; `run()` separates `REPORT_ONLY_CATEGORIES` findings from the strict-exit computation and prints them under their own heading. Zero diff to any existing pattern, `stripJsxComments`, `parseInlineMarkers`, or TSX-facing behavior. |
| `scripts/__tests__/check-design-tokens.test.ts` | New `§D` describe block, 18 planted tests (7 positive-detection, 9 negative/R8, 2 marker arms). All 25 pre-existing tests unmodified. |
| `docs/design-system.md` | New `§23.6` documenting the new coverage, scope boundary, rawValue convention, report-only staging, and the 715 handoff. |
| `docs/storybook-governance.md` | New `§14.9.26` recording closure of the exact blind spot `§14.9.25` (Task 713) documented, with the real-file + throwaway-copy proof. |
| `docs/backlog.md` | Last Session updated to 714; task-registry rows added for 714 (done) and 715 (reserved). Net +2 lines over the pre-existing 100 → **102 lines, `BACKLOG LIMIT BREACH` flagged** (see §14). |
| `docs/sessions/2026-08-06-task714-design-tokens-css-declaration-coverage.md` | This file. |
| `.screenshots/task714-evidence/*` | Evidence transcripts (local-only, D6) — listed in §11. |

`git diff --stat` on `src/`, `governance-pr.yml`, `package.json`: **empty** (verified — §7).

## 2. Requirement IDs completed

| ID | AC | Verdict |
|---|---|---|
| R1 (raw length in CSS) | AC1 | ✅ — `font-size: 10px` → `css-length`, quoted in §3/§6 below |
| R2 (duration + z-index in CSS) | AC2 | ✅ — `.15s`/`300ms` → `css-duration`, `z-index: 30` → `css-zindex` |
| R3 (report-only, exit 0) | AC3 | ✅ — `npm run check:design-tokens` exits 0 on current tree, inventory under its own heading |
| R4 (real-file proof) | AC4 | ✅ — both `font-size: 10px` sites (`:123`, `:164`) detected, file zero-diff. Note: kickoff R4 text says "three" declarations; the real file and AC4's own "both" wording confirm exactly **two** — corrected, see §9 |
| R5 (marker suppress + stale) | AC5 | ✅ — both arms proven on a throwaway in-memory copy, real file never touched |
| R6 (classified inventory) | AC6 | ✅ — `.screenshots/task714-evidence/task714-css-declaration-inventory.md`, 45 items, 34 N1 / 11 artifact, per-file counts |
| R7 (planted arms fail-then-pass) | AC7 | ✅ — §3 below |
| R8 (no false positives) | AC8 | ✅ — 9 negative arms, all pass |
| R9 (zero diff elsewhere) | AC9 | ✅ — `git diff` empty on `src/`, `governance-pr.yml`, `package.json`; all 25 pre-existing tests pass unmodified |
| R10 (pre-existing tests unmodified) | AC10 | ✅ — 25 before (not 26 — kickoff was stale, §9), 25 after + 18 new = 43 |
| R11 (docs record coverage) | AC11 | ✅ — `docs/design-system.md` §23.6, `docs/storybook-governance.md` §14.9.26 |
| R12 (build exits 0) | AC12 | ✅ — §10 below |
| R13 (counting gates last, reconciled) | AC13 | ✅ — §12 below |

## 3. The failing arms, before implementation (D32 proof)

`.screenshots/task714-evidence/i2-pre-implementation-failing-arms.log`:

```
 Test Files  1 failed (1)
      Tests  7 failed | 36 passed (43)
EXIT_CODE=1
```

The 7 failures were exactly the 7 "must detect" assertions (css-length px/rem/scientific-notation,
css-duration seconds/milliseconds, css-zindex, and the missing-reason-marker arm) — every negative
arm and the stale-marker arm already passed pre-implementation, because they assert the *absence* of
a detection or exercise the marker mechanism generically (unaffected by which patterns exist). This
is the correct shape for a D32 proof: only the "must catch" arms fail against the un-implemented
detector.

After implementation (`.screenshots/task714-evidence/i4-post-implementation-green.log`, then
re-verified after the `run()` refactor in `i4-post-run-refactor-tests.log`): **43/43 passing, exit 0.**

## 4. The A1 answer — rawValue convention

Reported as `property: value` (e.g. `font-size: 10px`, `z-index: 30`, `transition-duration: .15s`),
matching the existing inline-`zIndex` convention (`zIndex: 9999`) rather than the bare value alone.
Chosen because a bare value like `10px` can appear via multiple different properties on one physical
line (e.g. a hypothetical `width: 10px; height: 10px;`); using the whole `property: value` string
gives each declaration a distinct, unambiguous marker target even when the raw values collide. This
is the exact string a `design-tokens-allow` marker must reproduce byte-for-byte — proven in R5.

## 5. The A2/A3/A5 answers

- **A2 (CSS comment stripping):** new `stripCssComments()` strips `/* ... */` spans (incl. multi-line)
  to whitespace, applied only to build the detection source for the three new `cssOnly` patterns — the
  existing color/Tailwind-bracket patterns keep reading the unstripped source (R9 zero-diff). Markers
  are still parsed from the original, unstripped physical line, so a marker inside a CSS comment (the
  only place a CSS marker CAN live) still works. Because the strip removes the whole comment span
  (including the marker's own text), the marker's embedded value string is never double-counted as a
  live violation — the same effect the existing trailing-`//` strip already has for TSX.
- **A3 (1px policy):** `1px`/`-1px` (any sign, magnitude ≤1, `px` unit only) are **exempt-by-value**,
  applied via the `filter` callback alongside the existing `0`/zero-value exemption — not a regex
  shape change. Decision: the hairline-border convention (`HeaderView.module.css:37`,
  `border-bottom: 1px solid var(--border)`, already approved) has no project token and is a near-
  universal CSS idiom; flagging it would add noise without a realistic remediation path. `1rem`/`1em`
  are NOT exempted (still flagged if bare) — only the `px` hairline case.
- **A5 (at-rule preludes):** structurally excluded, no special-casing needed. Every pattern requires
  the matched value to be immediately followed by `;` or `}` (a lookahead, not consumed). An
  `@media (min-width: 40rem)`/`@supports (...)` condition's numeric token is always followed by `)`,
  never a declaration terminator — so the regex never matches inside a prelude. Proven with 2 dedicated
  tests (`@media`, `@supports`).

## 6. The R4 proof — real file, zero diff

`.screenshots/task714-evidence/i5-r4-r5-real-and-throwaway-proof.log`:

```
=== R4 — real file, read-only, css-length findings for font-size ===
  :123  [css-length]  "font-size: 10px"
  :164  [css-length]  "font-size: 10px"
Count: 2
```

`git status --porcelain -- src/` and `git diff --stat -- src/components/layout/MobileBottomNavView.module.css`:
both empty — the real file was only ever `readFileSync`'d, never written.

## 7. The R5 two arms

Same log, throwaway in-memory copy (the real file content loaded, modified as a string, never
written back to disk or into `src/`):

```
=== R5 arm 1 — throwaway copy, marker on same line, suppressed ===
Findings on the marked line (:123): []
Line :123 suppressed as expected: true
Unrelated line :164 (navItemLabel, untouched) still fires as expected: true

=== R5 arm 2 — throwaway copy, marker present but declaration removed (orphan) ===
Stale-marker finding: {"file":"...","line":123,"cat":"stale-marker",...,"match":"font-size: 10px",...}
Stale-marker detected as expected: true
```

Exact marker string used (arm 1):
`/* design-tokens-allow: font-size: 10px — interactive/mobile-critical nav text (MobileBottomNav protection), Task 714 throwaway proof */`

## 8. The R6 inventory

Full table: `.screenshots/task714-evidence/task714-css-declaration-inventory.md`.

| | Count |
|---|---:|
| Total literals | 45 |
| N1-VIOLATION | 34 |
| COMPILED-ARTIFACT | 11 |

Per file: FooterView 19 (15/4), HeaderView 13 (12/1), MobileBottomNavView 7 (3/4),
FeaturedListingsView 2 (2/0), LatestListingsView 2 (2/0), PopularLocationsView 2 (0/2).

**Divergence from the kickoff's §3.5 (49 across 7 files):** this run found **45 across 6 files**.
`MantineListingCardPattern.module.css` shows 0, not 4 — its only candidate values (`300ms` ×2 per
line, ×2 lines) sit inside a `transition:` multi-value shorthand, which is out of this task's
documented scope (see §5 above / the inventory file's divergence table for the full per-file
reconciliation, including a case where this run found *more* than the kickoff: `PopularLocationsView`'s
`z-index: 1` at `:56`, which the kickoff's manual count of "1" missed). Per I1 step 4 and the standing
project rule that a kickoff's own measured facts are not exempt, this is reported rather than
silently inherited. It does not block this task — R3 is report-only regardless of the exact count —
but **715 must re-run the command and re-derive its scope from the current tree.**

## 9. Test totals and other corrections to the kickoff's own numbers

- **25 pre-existing tests, not 26.** The kickoff's §3.4/R10/AC10 all state "26 tests"; the actual
  count (verified by baseline run, `.screenshots/task714-evidence/i1-pre-edit-vitest-26.log`, and by
  `docs/design-system.md` §23.5's own "25 tests, all passing" line) is **25**. `docs/design-system.md`
  already had this right; only the kickoff's own text was stale. **25 before → 43 after (25 + 18
  new), no pre-existing test modified** (verified: the diff only appends a new `describe` block plus
  two constants; no existing `it(...)` body was touched).
- **R4's "three" `font-size: 10px` declarations.** The real file has exactly **two**
  (`:123`, `:164`) — confirmed by direct read and by the detector's own output. R4's prose
  ("the three ... declarations ... and the fabLabel site") appears to double-count the fabLabel site
  against itself; AC4's own wording ("both ... sites") is internally consistent with the real count
  of two and is what this task satisfies.

## 10. Commands run and actual results

| # | Command | Result | Evidence |
|---:|---|---|---|
| 1 | `git status --porcelain` (pre-edit) | empty | (inline, this session) |
| 2 | `npm run check:design-tokens` (pre-edit) | 0 violations, exit 0 | `i1-pre-edit-check-design-tokens.log` |
| 3 | `npx vitest run .../check-design-tokens.test.ts` (pre-edit) | 25 passed, exit 0 | `i1-pre-edit-vitest-26.log` |
| 4 | Same suite, planted arms added, pre-implementation | 7 failed / 36 passed, exit 1 | `i2-pre-implementation-failing-arms.log` |
| 5 | Same suite, post-implementation | 43 passed, exit 0 | `i4-post-implementation-green.log`, re-verified `i4-post-run-refactor-tests.log` |
| 6 | `node scripts/check-design-tokens.mjs --strict` (real tree) | 0 blocking violations, 45 report-only, exit 0 | `i7-strict-report-only-proof.log` |
| 7 | `npm run check:design-tokens` (real tree, bare/strict alias) | same, exit 0 | `i7-npm-run-check-design-tokens-final.log` |
| 8 | R4/R5 real-file + throwaway-copy proof script | all arms as expected | `i5-r4-r5-real-and-throwaway-proof.log` |
| 9 | `npx tsc --noEmit` | see §10a | `i9-tsc.log` |
| 10 | `npm run build` | see §10a | `i9-build.log` |
| 11 | `npm run check:file-integrity` | see §12 | `i9-file-integrity.log` |
| 12 | `npm run check:mojibake` | see §12 | `i9-mojibake.log` |

### 10a. Build gate (R12, hard completion gate)

`.screenshots/task714-evidence/i9-tsc.log`: `npx tsc --noEmit` → `EXIT_CODE=0`.

`.screenshots/task714-evidence/i9-build.log`: `npm run build` → completed, all routes compiled
(`First Load JS shared by all: 184 kB`, unchanged from pre-existing), `EXIT_CODE=0`.

## 11. Evidence locations

All under `.screenshots/task714-evidence/` (local-only, D6):

- `i1-pre-edit-check-design-tokens.log`, `i1-pre-edit-vitest-26.log` — baseline
- `i2-pre-implementation-failing-arms.log` — D32 proof (7 failed / 36 passed)
- `i4-post-implementation-green.log`, `i4-post-run-refactor-tests.log` — green arms (43/43)
- `i5-r4-r5-real-and-throwaway-proof.log` — R4 real-file + R5 both marker arms
- `task714-css-declaration-inventory.md` — R6 classified inventory (45 items)
- `i7-strict-report-only-proof.log`, `i7-npm-run-check-design-tokens-final.log` — R3 report-only proof
- `i9-tsc.log`, `i9-build.log`, `i9-file-integrity.log`, `i9-mojibake.log` — final gates (§12)

## 12. Counting gates, run last, reconciled to `git status`

Run after all doc/session/backlog edits, after the build gate, and after deleting the scratch proof
script (`task714-i5-marker-proof.mjs`, created outside the repo under the session scratchpad and
removed before this step — never part of `git status`), per I9/Task 713 F3.

`git status --porcelain` at the time these gates ran — **6 entries**: 5 modified
(`docs/backlog.md`, `docs/design-system.md`, `docs/storybook-governance.md`,
`scripts/__tests__/check-design-tokens.test.ts`, `scripts/check-design-tokens.mjs`) + 1 untracked
(this session log).

`.screenshots/task714-evidence/i9-file-integrity.log`:
```
🔍  check:file-integrity — git-changed + untracked (default)
    Checking 6 file(s) — NUL bytes · BOM · JSON parse · node --check · truncation
✅  check:file-integrity PASSED — all 6 file(s) clean
EXIT_CODE=0
```
**Reconciliation: 6 checked == 6 in `git status --porcelain`. Exact match.**

`.screenshots/task714-evidence/i9-mojibake.log`:
```
check:mojibake — scanning 2070 text file(s), tracked and untracked-not-ignored, under docs/ src/ app/ components/ modules/ messages/ tasks/ scripts/ + root *.md
check:mojibake: 0 artifacts in 2070 files
EXIT_CODE=0
```
No count-reconciliation risk here (this gate scans the whole tracked+untracked corpus by design, not
a git-diff-scoped set) — 0 artifacts, exit 0.

## 13. Standing findings not acted on (out of scope, named for the record)

- **715** — strict flip of `css-length`/`css-duration`/`css-zindex` + remediation of the 45-item
  inventory; owns the N1-vs-COMPILED-ARTIFACT policy call, including the `--text-2xs`-vs-nav-label
  tension at `MobileBottomNavView.module.css:123`/`:164` this task surfaced but did not decide.
- **711** — re-anchoring `fullWidthButtonsAtMobile`/`popupBottomSheetAtMobile` onto Mantine DOM;
  untouched by this task.
- **702/691 (Sprint 46)** — `ListingCard`/`MantineListingCardPattern` de-Tailwind; untouched. Note:
  this task's own inventory run touched `MantineListingCardPattern.module.css` only as a read (0
  findings under this detector's scope boundary, §8/§5) — no product change.

## 14. Assumptions, deviations, limitations, unresolved issues

- **Scope boundary (by design, not a gap accidentally left open):** the three new patterns only match
  a declaration whose entire value is a single bare token. Multi-value/shorthand declarations
  (`border-bottom: 1px solid var(--border)`, `transition: transform 300ms ease-out, ...`) and
  function-wrapped values (`blur(8px)`, `calc(2px + var(--x))`) are out of scope — named in both
  `docs/design-system.md` §23.6 and the inline `check-design-tokens.mjs` comment block as a follow-on
  requiring the same nested-function handling Task 408 built for Tailwind's calc/min/max/clamp
  brackets, generalized to arbitrary CSS functions.
- **§3.4/R10/AC10 test-count correction:** 25, not 26 (§9).
- **R4 "three" vs "both" wording:** the real file has 2 sites; AC4's "both" is authoritative and is
  what this task satisfies (§9).
- **§3.5 49-across-7 divergence:** 45 across 6, fully reconciled per-file in §8 / the inventory file's
  divergence table. Not a defect in this task — R3 is report-only regardless of the exact count — but
  material for 715's scoping.
- **`BACKLOG LIMIT BREACH`:** `docs/backlog.md` moved from 100 → **102** lines. I trimmed the "Last
  Session" section to its minimum viable size but could not fully offset the 2 new task-registry rows
  (714 done, 715 reserved) without risking removal of state Opus may still need. Flagged per the
  kickoff's own instruction (§14.15) rather than force-trimmed.
- **A3's 1px exemption** is a genuine policy decision (documented in §5/§23.6), not a structural
  inevitability — 715 or the owner may revisit it if a future token is added for hairline borders.

## 15. Opus handoff — evidence to inspect, open questions

1. Verify `scripts/check-design-tokens.mjs`'s new `DETECTION_PATTERNS` entries and `run()` changes are
   additive-only (diff review) — R9's zero-diff claim on the existing 12 patterns should be visually
   confirmable in the diff, not just asserted.
2. Confirm the `docs/backlog.md` net +2 lines (100→102) and either accept the `BACKLOG LIMIT BREACH`
   flag for a later consolidation pass or trim further at review time.
3. Decide whether the §3.5→45 divergence (§8) needs any correction to the kickoff/Sprint 52 plan file
   before 715 is scoped, or whether this session's inventory file is sufficient authority on its own.
4. The `--text-2xs`-vs-nav-label N1/policy tension (§13) is a real open question for 715 or an owner
   call, not resolved here by design.
