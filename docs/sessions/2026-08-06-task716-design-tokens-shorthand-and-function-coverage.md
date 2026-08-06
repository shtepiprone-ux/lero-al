# Task 716 — Design-tokens shorthand/function-wrapped CSS declaration coverage

**Status: IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW**

Task: `tasks/Sprints/Sprint_52_kickoff_prompt_Task_716_DesignTokens_Shorthand_And_Function_Coverage.md`

## 1. Files changed

| File | Reason |
|---|---|
| `scripts/check-design-tokens.mjs` | Added the per-literal, function-scoped shorthand/function-wrapped detector for `css-length`/`css-duration`/`css-zindex` (R1/R2/A1–A5); fixed the reason-less CSS marker `parseInlineMarkers` defect (R4) |
| `scripts/__tests__/check-design-tokens.test.ts` | Added 24 new planted arms (§E shorthand/function coverage, §F marker-fix, 2 `parseInlineMarkers` arms); corrected 2 pre-existing §D assertions whose old behavior this task's own requirements mandate changing (R4, A3/AC1) |
| `docs/design-system.md` | §23.6 updated (coverage table, scope-boundary note marked superseded) + new §23.6.a documenting the Task 716 mechanism, decisions (A1–A5), and the re-run measurement (R11) |
| `docs/backlog.md` | Concise state update — 716 done, 715 unblocked, R6 (715 consumes 716's 60-item inventory) |
| `.screenshots/task716-evidence/*` | Evidence artifacts (local-only, D6) — see §10 |

Reconciled against `git diff --stat`: **3 tracked files changed** (`docs/design-system.md`,
`scripts/__tests__/check-design-tokens.test.ts`, `scripts/check-design-tokens.mjs`), 402
insertions / 32 deletions. Matches pre-write `git status --porcelain` (clean at I1) plus these 3
edits. **Zero diff in `src/`, `package.json`, `.github/workflows/governance-pr.yml`** (R7).

## 2. Requirement IDs completed

| Req | AC | Verdict | Evidence |
|---|---|---|---|
| R1 | AC1 | Met | `border-bottom: 1px solid var(--border)` → `border-bottom: 1px` detected. `i5-ac1-ac4-raw-output.txt` |
| R2 | AC2 | Met | `filter: blur(8px)` → `filter: 8px` detected; nesting (A4) and `--*` (A5) decided and tested. Same file |
| R3 | AC3 | Met | 6 negatives (`padding: var(...) var(...)`, `calc(var(--x)*2)`, `margin: 0 auto`, `flex: 1 1 0`, `border: 0`, `line-height: 1.5`) all empty. Same file |
| R4 | AC4 | Met | Reason-less CSS marker → `missing-reason` (not `stale-marker`); reasoned → suppressed; TSX unchanged. Same file |
| R5 | AC5 | Met | Census re-run: 60 literals / 6 files (delta +15 vs 714's 45), classified. `task716-css-declaration-inventory.md` |
| R6 | AC6 | Met | `docs/backlog.md` 715 row states it must consume 716's inventory |
| R7 | AC7 | Met | `git diff --stat -- src/ package.json .github/workflows/governance-pr.yml` empty; `git diff --name-only HEAD -- src/...` = 0 files; `git hash-object package.json .github/workflows/governance-pr.yml` (`a7888f3d…`, `76a40330…`) byte-identical to `git rev-parse HEAD:package.json HEAD:.github/workflows/governance-pr.yml` |
| R8 | AC8 | Met | `npm run check:design-tokens` exits 0, 60 findings under the report-only heading. `i7-post-implementation-check-design-tokens.txt` |
| R9 | AC9 | Met | 43 before → 67 after; 24 net-new arms; 2 pre-existing corrected per R4/A3 (documented, not silent) — see §8 |
| R10 | AC10 | Met | Every §3.4 negative (`var(--space-6)`, `calc(var(--x)*2)`, `0`/`0px`/`0rem`, `100%`, CSS comment, `@media` prelude, `.tsx`) still silent — unchanged §D tests all pass |
| R11 | AC11 | Met | `docs/design-system.md` §23.6/§23.6.a — multi-value/function exclusion marked superseded, new mechanism + 1px policy documented |
| R12 | AC12 | Met | `npm run build` exit 0. `i7-build.txt` |
| R13 | AC13 | Met | Counting gates run last, after confirming no scratch leakage; reconcile to `git status` — see §11 |

## 3. The failing arms, before implementation (D32)

Mutating git (stash) is owner-only, so the pre-implementation script was obtained read-only via
`git show HEAD:scripts/check-design-tokens.mjs` into a scratch copy (outside the repo), and the 8
new-behavior assertions were run against it directly. All 8 failed as expected:

```
FAIL (expected pre-impl)  R1 border-bottom shorthand detects 1px
FAIL (expected pre-impl)  R2 filter: blur(8px) detects 8px
FAIL (expected pre-impl)  margin: 4px 8px detects both
FAIL (expected pre-impl)  A3 1px-in-shorthand is a finding
FAIL (expected pre-impl)  A4 clamp(1rem,2vw,3rem) flags both (no var anchor)
FAIL (expected pre-impl)  A5 --tw-shadow shorthand flags -2px/16px
FAIL (expected pre-impl)  R4 reason-less CSS marker reports missing-reason, not stale-marker
FAIL (expected pre-impl)  R4 parseInlineMarkers strips trailing */ when no reason

0 unexpectedly passed, 8 failed as expected (pre-implementation).
```

Full transcript: `.screenshots/task716-evidence/i2-d32-proof-pre-implementation.txt`.

## 4. The A1 answer — the per-literal exemption mechanism

Task 408's filter exempts a match containing `var(--` **anywhere in the same bracket** — correct
when the bracket is one function-call value (`*-[calc(var(--radius)-5px)]`). It is wrong applied
whole-declaration to a shorthand list: `border-bottom: 1px solid var(--border)` has three
independent top-level tokens (`1px`, `solid`, `var(--border)`); exempting `1px` because a sibling
token is a `var()` would over-exempt.

**Fix:** `isVarAnchoredLiteral(value, litStart)` computes each literal's own **outermost enclosing
function call** by walking paren balance up to the literal's position, then checks whether that
function's own full span contains `var(--` anywhere. A literal with **no enclosing function at
all** (paren depth 0 at its position — the shorthand top-level case) is never exempted by a sibling
`var()` token, because there is no enclosing span to check. This is what makes `border-bottom: 1px
solid var(--border)` detect `1px` (R1) while `filter: blur(8px)` (no var at all) also detects `8px`
(R2), and `calc(var(--x) + 2px)` (var inside the SAME calc as the literal) stays exempt — the exact
Task 408 `rounded-[calc(var(--radius)-5px)]` precedent, generalized from Tailwind brackets to
arbitrary CSS functions.

Over-exemption is proven absent by R3's negatives (`padding: var(--space-2) var(--space-4)` has no
raw literal to begin with — zero risk either way; `width: calc(var(--x) * 2)` has no unit literal)
and by the shorthand-mixing test (`border-bottom: 1px solid var(--border)` flags exactly the `1px`,
nothing else, nothing suppressed).

## 5. The A3/A4/A5 answers

- **A3 (1px policy, decided):** single-value-only exemption, unchanged. `border-top-width: 1px;`
  stays silent (whole value IS `1px`); `border-bottom: 1px solid var(--border)` is a finding (1px is
  one token among several). One consistent rule ("the exemption applies only when 1px IS the whole
  value"), applied identically in both code paths — not two different policies. This is *forced* by
  AC1, not a free choice between "detect" and "exempt": AC1 requires the shorthand case to be a
  finding, and A3 requires consistency, so the single-value form had to stay untouched (it already
  passed) while a NEW code path (never double-counting the single-value case, see §7) handles
  shorthand/function forms with no 1px exemption of their own.
- **A4 (nesting depth):** unbounded via paren-balance walking, not a fixed depth. Proven:
  `calc(var(--x) + 2px)` (var-anchored, exempt), `clamp(1rem, 2vw, 3rem)` (no var in the function,
  both literals flagged), `color-mix(in oklab, var(--primary) 90%, transparent)` (no unit literal
  present, nothing to flag regardless of anchoring).
- **A5 (`--*` decision):** in scope, no special-casing — the existing `[\w-]+` property-name pattern
  already matches a leading `--`. Proven against the real `MobileBottomNavView.module.css:60`/`:87`
  `--tw-shadow` shapes (now 8 new report-only findings there — see §7's census).

## 6. R4's three arms, quoted

```
=== reason-less CSS marker ===
[{ cat: 'missing-reason', match: 'font-size: 10px', ... },
 { cat: 'css-length',     match: 'font-size: 10px', ... }]

=== reasoned CSS marker (suppressed) ===
[]

=== equivalent reason-less TSX marker (unchanged path) ===
[{ cat: 'missing-reason', match: 'zIndex: 9999', ... },
 { cat: 'z-index',        match: 'zIndex: 9999', ... }]
```

Full transcript: `i5-ac1-ac4-raw-output.txt`.

## 7. The R5 inventory — full list, per-file counts, delta vs 714's 45

**60 literals across the same 6 files, delta +15, 0 files added or removed.** Full table:
`.screenshots/task716-evidence/task716-css-declaration-inventory.md`.

| File | 714 | 716 | Δ |
|---|---:|---:|---:|
| FooterView.module.css | 19 | 21 | +2 |
| HeaderView.module.css | 13 | 16 | +3 |
| MobileBottomNavView.module.css | 7 | 15 | +8 |
| FeaturedListingsView.module.css | 2 | 3 | +1 |
| LatestListingsView.module.css | 2 | 3 | +1 |
| PopularLocationsView.module.css | 2 | 2 | 0 |
| **Total** | **45** | **60** | **+15** |

All 15 new findings classified `COMPILED-ARTIFACT` (0 new `N1-VIOLATION`): 4× hairline-border `1px`
(no scale token targets border-width), 2× `backdrop-filter: blur(8px)` (no §22 blur token), 8×
`--tw-shadow` offset components (bespoke nav shadow + Tailwind's compiled `shadow-lg` numeric
expansion — matches 714's own treatment of similarly compiled artifacts in this file, not chased as
N1 despite coincidental numeric overlap with unrelated-purpose spacing tokens).

`src/design-system/mantine/patterns/MantineListingCardPattern.module.css` — the 714 kickoff's own
divergence note speculated this file's two `transition: transform 300ms ease-out, ...` shorthand
lines would surface 4 new findings once generalized. **That does not hold**: the file is excluded at
the **path level** by `scripts/design-tokens-allowlist.json`'s `src/design-system/mantine` entry
before any pattern runs (`scanContent`'s allowlist short-circuit). It was never in either census.
Recorded so 715 does not re-derive the same incorrect expectation.

## 8. Test totals

**43 before → 67 after.** 24 net-new arms (§E: 15, §F: 4, `parseInlineMarkers`: 2, minus... — exact
new-`it()` count reconciles as 43 + 24 = 67, confirmed by `grep -c "  it(" ...test.ts` = 67).

**2 pre-existing assertions corrected** (not silently weakened — both are DOCUMENTED, task-mandated
corrections, and coverage strictly increases, it does not decrease):

1. `'does NOT flag the approved 1px hairline-border value (A3 decision)'` — its second assertion
   (`border-bottom: 1px solid var(--border)` expected `toHaveLength(0)`) directly contradicted AC1,
   which requires this exact declaration to report `1px`. Split into a single-value-only assertion
   (kept, unchanged expectation) plus a new §E test proving the shorthand case is now a finding.
2. `'a css-length marker with no — separator does not silently suppress'` (Task 714's own test name
   explicitly documented the bug as "pre-existing... unchanged by this task") — its expectation
   (`stale-marker`) is exactly the defect R4 requires fixing. Updated to assert the corrected
   `missing-reason` outcome, per R4/AC4.

Both corrections are named explicitly in the kickoff (§3.3 "The marker diagnostic defect", A3 "every
1px hairline becomes a finding... either answer is defensible and consistency matters more than
which one is chosen") — anticipated, not discovered ad hoc. No other pre-existing test's assertions
were touched.

## 9. Commands run and actual results

| # | Command | Result | Evidence file |
|---|---|---|---|
| I1.2 | `npm run check:design-tokens` (baseline) | exit 0, 45 findings | `i1-baseline-check-design-tokens.txt` |
| I1.3 | `npx vitest run ...test.ts` (baseline) | exit 0, 43 passed | `i1-baseline-vitest.txt` |
| I1.4 | §3.1 re-probe (7 rows) | matches exactly | `i1-reprobe-31.txt` |
| I2 | D32 proof vs. pre-impl script | 8/8 failed as expected | `i2-d32-proof-pre-implementation.txt` |
| I4 | `npx vitest run ...test.ts` (post-impl, 1st pass) | 1 failed (test-authoring bug, fixed) | `i4-post-implementation-vitest.txt` |
| I4 | `npx vitest run ...test.ts` (post-impl, fixed) | exit 0, **67 passed** | `i4-post-implementation-vitest-v2.txt` |
| I5 | AC1–AC4 raw-output probe | matches expectations | `i5-ac1-ac4-raw-output.txt` |
| I7 | `npm run check:design-tokens` (post-impl) | **exit 0**, 60 findings | `i7-post-implementation-check-design-tokens.txt` |
| — | `npx tsc --noEmit` | **exit 0** | `i7-tsc-noemit.txt` |
| — | **`npm run build`** | **exit 0 — hard gate** | `i7-build.txt` |
| I9 | `npm run check:file-integrity` | exit 0, 3/3 clean | `i9-check-file-integrity.txt` |
| I9 | `npm run check:mojibake` | exit 0, 0 artifacts / 2071 files | `i9-check-mojibake.txt` |

All commands captured unpiped, exit code appended as a separate line inside each transcript file.

## 10. Evidence locations

All under `.screenshots/task716-evidence/` (local-only, D6, gitignored):

- `i1-baseline-check-design-tokens.txt`, `i1-baseline-vitest.txt`, `i1-reprobe-31.txt`
- `i2-d32-proof-pre-implementation.txt`
- `i4-post-implementation-vitest.txt`, `i4-post-implementation-vitest-v2.txt`
- `i5-ac1-ac4-raw-output.txt`
- `i7-post-implementation-check-design-tokens.txt`, `i7-tsc-noemit.txt`, `i7-build.txt`
- `i9-check-file-integrity.txt`, `i9-check-mojibake.txt` (mid-task run, 3 files)
- `i9-check-file-integrity-final.txt`, `i9-check-mojibake-final.txt`, `i9-final-vitest.txt` (truly-last run, 5 files, §11)
- `task716-css-declaration-inventory.md` (R5 inventory)

## 11. Counting gates — reconciliation to `git status`

Run twice: once after the implementation/docs edits, then re-run as the truly last step after
writing this session log and the backlog update (both of which are themselves part of the task's
required output, so the gates were re-run against the final file set rather than a mid-task
snapshot). All probe scripts were written to the external session scratchpad, outside the
repository — never staged, tracked, or left behind.

**Final run** (after this session log + `docs/backlog.md`):

- `git status --porcelain`: **5 files** — `docs/backlog.md`, `docs/design-system.md`,
  `scripts/__tests__/check-design-tokens.test.ts`, `scripts/check-design-tokens.mjs` (modified),
  `docs/sessions/2026-08-06-task716-…md` (untracked, new).
- `check:file-integrity` (git-changed + untracked default scope): **"Checking 5 file(s)" → PASSED
  all 5 clean** — exact match. `i9-check-file-integrity-final.txt`.
- `check:mojibake` (whole tracked+untracked-not-ignored tree): **2072 files, 0 artifacts** — one more
  than the mid-task run's 2071, exactly accounting for this session-log file; this gate scans the
  full tree, not the diff, so equality to the 5-file diff count is not the right comparator — the
  +1 delta against the prior run is. `i9-check-mojibake-final.txt`.
- `npx vitest run ...test.ts` re-confirmed: exit 0, 67 passed. `i9-final-vitest.txt`.

No divergence to report (713 F3 / 714 AC13 regression class did not recur).

## 12. Standing findings not acted on

- **715** (Sprint 52, runs next) — strict flip of `css-length`/`css-duration`/`css-zindex` +
  remediation of the N1-vs-COMPILED-ARTIFACT inventory. **Must consume this task's 60-item table**
  (`task716-css-declaration-inventory.md`), not 714's 45-item one.
- **711** (Sprint 52, reserved) — re-anchor `fullWidthButtonsAtMobile`/`popupBottomSheetAtMobile`
  onto Mantine DOM selectors. Untouched by this task.
- MobileBottomNavView.module.css `:123`/`:164` `font-size: 10px` remains the same N1-VIOLATION*
  policy call 714 surfaced (`--text-2xs` matches the value but §22.2 disallows it for nav labels) —
  not decided here, carried forward to 715/owner unchanged.

## 13. Assumptions, deviations, limitations, unresolved issues

- **Mutating git substitution:** the task's I1/D32 instructions implicitly assume `git stash` is
  available to isolate the pre-implementation script; that command is owner-only under this
  project's git policy. Substituted `git show HEAD:<path>` (read-only) into an out-of-repo scratch
  copy, which achieves the identical evidentiary purpose (run the new assertions against the
  actual pre-Task-716 committed script) without touching the working tree. Documented here as a
  deviation from the literal mechanism, not the intent.
- **Per-line declaration scanning (inherited limitation, unchanged from Task 714):** a declaration
  whose `;` terminator falls on a different physical line than its `property:` (e.g.
  `HeaderView.module.css:99-100`'s wrapped `transition-property` list) is not scanned by the new
  shorthand path either — this is the same per-line architecture Task 714 already used and this task
  did not change. No missed literal results from this in the current tree (the only such wrapped
  declaration carries no unit literal).
- **Coincidental token-value overlap is not treated as N1:** several new `COMPILED-ARTIFACT`
  classifications (e.g. `--tw-shadow: 4px` numerically equals `--space-1`) are NOT reclassified as
  N1-VIOLATION, because the token's *purpose* (layout spacing) does not match the literal's *use*
  (a shadow-offset component of a compiled Tailwind `shadow-lg` expansion). Documented in the
  inventory as a judgment call, consistent with 714's own treatment of `border-radius:
  3.40282e38px`.
- No `src/` files were read-write touched, edited, or had markers added — this task is strictly
  detector + docs + tests, per its own out-of-scope list (§8).

## 14. Backlog update

See `docs/backlog.md` — concise state only, plus R6.
