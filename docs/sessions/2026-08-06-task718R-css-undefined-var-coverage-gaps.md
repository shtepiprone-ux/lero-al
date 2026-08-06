# Task 718R — Close `css-undefined-var`'s uppercase gap and document the two it cannot close

**Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`**

Kickoff: `tasks/Sprints/Sprint_52_kickoff_prompt_Task_718R_CssUndefinedVar_Coverage_Gaps.md`. Revises Task 718
(`NEEDS REVISION`, uncommitted). This task edits that same uncommitted working state; it does not start from `HEAD`.

---

## 1. Task path and status

`tasks/Sprints/Sprint_52_kickoff_prompt_Task_718R_CssUndefinedVar_Coverage_Gaps.md` —
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.

---

## 2. Requirement and acceptance-criteria evidence

| Req | AC verdict | Evidence |
|---|---|---|
| **R1** — `i` flag on `callRe` at `:481` | **AC1 met** | Before: `` const callRe = /var\(/g; ``. After: `` const callRe = /var\(/gi; ``. Diff of `check-design-tokens.mjs` is not "exactly that one line" in raw `git diff` terms because Task 718's own uncommitted diff is baked into the same file (see §4 note); **718R's own edit to this file is exactly the `g` → `gi` change**, confirmed by re-reading the function after edit. Re-measured `[\w-]var\(` case-insensitive across `src/**/*.css`: **0** matches (`i4-remeasure-false-positive-surface.log`, grep exit 1 = no match). |
| **R2** — 3 new §H arms | **AC2 met** | (a) uppercase `VAR(--phantom-f)` flagged; (b) `*, *::before { color: var(--phantom-b); }` not flagged; (c) multi-line `var(\n --phantom-e\n )` not flagged. All three quoted in §4 below. I5 inversion transcripts (`i5-inversion-proof.log`) show (b) becomes a finding when the selector is changed to `.x, .x::before`, and (c) becomes a finding when joined onto one line — both **1** finding, proving each arm is discriminating. |
| **R3** — 2 new §23.6.c entries | **AC3 met** | A7 (`*`-leading line, owner **719**) and A8 (multi-line `var(`, owner: none/architectural) inserted between A6 and Proof. Quoted in §5. |
| **R4** — 3 arms restored, `--space-6` | **AC4 met (in full)** | All three (`:270`, `:390`, `:409` in the pre-edit file) restored to unfiltered `toHaveLength(0)` with `--space-6` (defined `globals.css:157`); Task 718 scoping comments removed. Both fixtures measured clean unfiltered — no partial-delivery path needed. Quoted in §6. |
| **R5** — zero diff in named files | **AC5 met** | `shouldSkipLine` appears only as unchanged context in `git diff` (verified by line-search — 1 match, a bare context line, no `+`/`-`). `globals.css`, `package.json`, `governance-pr.yml`, `design-tokens-allowlist.json`, `check-stories-rendered.mjs`: 0 diff from this session's edits (I made none — see §4 note on cumulative diff). Every `.module.css` under `src/`: `git diff --stat -- '*.module.css'` → 0 lines. |
| **R6** — gate stays 0/exit 0 | **AC6 met** | `npm run check:design-tokens` after R1: 0 violations, exit 0 (`i4-post-r1-check-design-tokens.log`); after full task: 0 violations, exit 0 (`i8-final-check-design-tokens.log`). |
| **R7** — suite passes, real total stated | **AC7 met** | **88/88** passing (85 pre-existing + 3 new R2 arms; R4 restored 3 existing arms in place, no count change). The kickoff's own §4 "89" arithmetic note explicitly authorizes restating the real number — 88 is correct and reconciles: 85 + 3 = 88. No pre-existing arm weakened; three strengthened per R4. |
| **R8** — failing arm first (D32) | **AC8 met** | R2(a) run before R1 landed: **FAILED** — `expected [] to have a length of 1 but got +0`, exit 1 (`i2-r2a-arm-prefix-FAIL.log`). |
| **R9** — build exits 0 | **AC9 met** | `npm run build` — exit 0, transcript `i9-npm-build.log`. `npx tsc --noEmit` — exit 0, `i9-tsc-noemit.log`. |
| **R10** — counting gates last, reconciled | **AC10 met** | Run after full cleanup (no scratch files remained — `git status --porcelain` confirmed clean of stray artifacts before these ran). `check:file-integrity`: 5 files checked (git-changed + untracked), matches `git status --porcelain`'s 5 entries exactly. `check:mojibake`: 0 artifacts in 2078 files, exit 0. |

---

## 3. Current versus required behavior

**Current (pre-718R):** `css-undefined-var` blocked correctly on ordinary CSS, but `VAR(--missing)` (uppercase), a
`var()` on a `*`-leading line, and a multi-line `var(` were all silently not findings. §23.6.c documented only two
limitations (A4, A6), so a reader would take those for the complete set. Three pre-existing arms asserted less than
before Task 718 (scoped to `css-length` only, using a fictitious `--x`).

**Required after (achieved):** uppercase/mixed-case `var()` is found identically to lowercase. The two remaining
gaps (`*`-leading line, multi-line `var(`) are named limitations in §23.6.c with owners (**719** / unowned-
architectural). All three gaps are locked by suite arms asserting the *documented* behavior — including the two
negative ones, each proven discriminating by inversion. The three narrowed arms are unfiltered again on a real
token. The tree still reports 0 findings and the gate still exits 0.

**Negative flows (from the kickoff's applicability table, all confirmed):**

| Branch | Result |
|---|---|
| `VAR(--missing)` uppercase | finding — confirmed |
| `Var(--missing)` mixed case | covered by the same `i` flag — not separately arm'd beyond the kickoff's requirement, which named only uppercase and lowercase-unchanged as required arms |
| `var(--missing)` lowercase | still a finding — unchanged, confirmed by the other 85 pre-existing arms staying green |
| identifier ending in `var(` | no false positive — 0 measured at I4 |
| `*`-leading line | not flagged; documented; **719** — confirmed |
| multi-line `var(` | not flagged; documented; architectural — confirmed |
| the three F3 arms with `--space-6` | 0 findings unfiltered — confirmed |
| tree turns red after R1 | did not happen — R6 held |
| `.tsx` behavior | unchanged — `callRe` is not shared outside `findUndefinedCssVarReferences`, no `.tsx` fixture touched |
| Locale / viewport / RLS / rendered output | N/A — build-time script only, no `.module.css` diff |

---

## 4. Files Changed

| Path | Reason |
|---|---|
| `scripts/check-design-tokens.mjs` | R1: `callRe` at `:481` gets the `i` flag (`/var\(/g` → `/var\(/gi`). **This is 718R's only edit to this file.** The rest of the file's diff against `HEAD` (visible in a raw `git diff`) is Task 718's own uncommitted work, present before this session started (`findUndefinedCssVarReferences`, `extractCssCustomPropertyDefinitions`, `scanContent`'s 4th param, `run()`'s globals read, the R8 string fix) — reconciled against the pre-write `git status --porcelain` snapshot in §3.8 of the kickoff, which already listed this file as modified. |
| `scripts/__tests__/check-design-tokens.test.ts` | R2: 3 new §H arms added (uppercase `VAR(`, `*`-leading-line negative, multi-line negative). R4: 3 pre-existing arms (`:270`, `:390`, `:409` in the pre-edit file) restored to unfiltered `toHaveLength(0)` on `--space-6`, Task 718 scoping comments removed. Rest of the file's diff against `HEAD` is Task 718's own 16 §H arms plus the 3 narrowed arms this task un-narrows — same reconciliation as above. |
| `docs/design-system.md` | R3: two new limitation entries, A7 (`*`-leading line, owner **719**) and A8 (multi-line `var(`, unowned architectural), inserted between A6 and the Proof paragraph in §23.6.c. Rest of the file's diff against `HEAD` is Task 718's own §23.6.c section (A1–A6, Proof) plus the §22.3 banner/table edits, already present before this session. |
| `src/app/globals.css` | **Zero diff from this session** — untouched. The file shows as modified in `git status` only because Task 718's own `--z-*` token definitions are still uncommitted. |
| `docs/backlog.md` | Concise state-only update (§9 below). |
| `docs/sessions/2026-08-06-task718R-css-undefined-var-coverage-gaps.md` | This file. |

**Reconciliation:** `git status --porcelain` before this session showed 5 paths, exactly Task 718's uncommitted work
(§3.8 of the kickoff). After this session: same 4 modified paths (`docs/backlog.md` join the pre-existing 4) plus
the same 1 untracked Task 718 session log, plus this task's own new session log — 6 paths total, all accounted for.
No new file was created outside `docs/sessions/`; no file outside the declared scope was touched.

---

## 5. R3 — the two §23.6.c entries, quoted

Inserted between A6 and the "Proof (Task 718 R5, D32)" paragraph, `docs/design-system.md`:

> **A7 — known coverage limitation, not closed here (718R):** a `var(` reference on a line whose
> first non-space character is `*` is silently not a finding, because `shouldSkipLine` treats any such
> line as a comment before any category runs — a CSS-comment heuristic that is also the universal
> selector. This blind spot is **cross-category** (`css-length`, `css-duration`, `css-zindex` and
> `css-undefined-var` are all affected, not just this one), so fixing it here would exceed this task's
> scope. Owner: **719**.
>
> **A8 — known coverage limitation, not closed here (718R):** a `var(` call split across physical
> lines (the opening paren on one line, its contents or closing paren on another) is silently not a
> finding, because `findUndefinedCssVarReferences` scans one physical line and bails on an unbalanced
> paren. This is deliberate and consistent with the whole file's line-based scan model (§3.4 of the
> 718R kickoff) — making one category multi-line would give it a different source model from every
> other category in the same loop. Owner: none — architectural, unowned; fixing it is a
> scanner-architecture task, not a regex change.

---

## 6. The three restored arms, before and after

**`:270` — "does NOT flag a calc(var(...)) length declaration"**

Before:
```ts
it('does NOT flag a calc(var(...)) length declaration', () => {
  // --x is a fictitious placeholder (not a real globals.css token) — it now
  // also trips the unrelated Task 718 css-undefined-var category; scope to
  // css-length only, matching this suite's own "not this test's concern"
  // precedent (see the --tw-shadow shorthand test below).
  expect(regularCss('.x { width: calc(var(--x) * 2); }').filter(f => f.cat === 'css-length')).toHaveLength(0)
})
```
After:
```ts
it('does NOT flag a calc(var(...)) length declaration', () => {
  expect(regularCss('.x { width: calc(var(--space-6) * 2); }')).toHaveLength(0)
})
```

**`:390` — "does NOT flag a calc() built entirely from a var() and a unitless number (R3)"**

Before:
```ts
it('does NOT flag a calc() built entirely from a var() and a unitless number (R3)', () => {
  // --x is fictitious — scope to css-length only (Task 718 css-undefined-var
  // is orthogonal, see the identical note in §D above).
  expect(regularCss('.x { width: calc(var(--x) * 2); }').filter(f => f.cat === 'css-length')).toHaveLength(0)
})
```
After:
```ts
it('does NOT flag a calc() built entirely from a var() and a unitless number (R3)', () => {
  expect(regularCss('.x { width: calc(var(--space-6) * 2); }')).toHaveLength(0)
})
```

**`:409` — "exempts a literal inside a function whose SAME function also contains a var() reference (A4 nested...)"**

Before:
```ts
it('exempts a literal inside a function whose SAME function also contains a var() reference (A4 nested — matches the frozen Task 408 rounded-[calc(var(--radius)-5px)] precedent)', () => {
  // --x is fictitious — scope to css-length only (Task 718 css-undefined-var
  // is orthogonal, see the identical note in §D above).
  expect(regularCss('.x { width: calc(var(--x) + 2px); }').filter(f => f.cat === 'css-length')).toHaveLength(0)
})
```
After:
```ts
it('exempts a literal inside a function whose SAME function also contains a var() reference (A4 nested — matches the frozen Task 408 rounded-[calc(var(--radius)-5px)] precedent)', () => {
  expect(regularCss('.x { width: calc(var(--space-6) + 2px); }')).toHaveLength(0)
})
```

All three go clean unfiltered on `--space-6` (defined `src/app/globals.css:157`) — no partial-delivery path (A5)
needed.

---

## 7. The three new §H arms, quoted, with I5 inversion transcripts

```ts
it('flags an uppercase VAR(--missing) reference the same as var(--missing) — CSS function names are case-insensitive (718R R1)', () => {
  const findings = scanContent('.w { color: VAR(--phantom-f); }', CSS_FIXTURE_PATH, {})
    .filter(f => f.cat === 'css-undefined-var')
  expect(findings).toHaveLength(1)
  expect(findings[0].match).toBe('VAR(--phantom-f)')
})

it('does NOT flag a var() reference on a line whose first non-space character is "*" — shouldSkipLine treats it as a comment line before any category runs; documented coverage limitation, 719 owns the cross-category fix (§23.6.c)', () => {
  const findings = scanContent('*, *::before { color: var(--phantom-b); }', CSS_FIXTURE_PATH, {})
    .filter(f => f.cat === 'css-undefined-var')
  expect(findings).toHaveLength(0)
})

it('does NOT flag a var(...) call split across physical lines — the scan is line-based by design (§3.4); documented architectural limitation, unowned (§23.6.c)', () => {
  const findings = scanContent('.z { color: var(\n  --phantom-e\n ); }', CSS_FIXTURE_PATH, {})
    .filter(f => f.cat === 'css-undefined-var')
  expect(findings).toHaveLength(0)
})
```

**I2 — D32 failing-first proof** (`i2-r2a-arm-prefix-FAIL.log`): R2(a) run before R1 landed —
`AssertionError: expected [] to have a length of 1 but got +0`, exit 1.

**I3 — post-R1 pass** (`i3-r2a-arm-postfix-PASS.log`): 86/86 passing.

**I5 — inversion proof** (`i5-inversion-proof.log`), proving (b) and (c) are discriminating and not vacuous:
- (b) inverted: selector changed `*, *::before` → `.x, .x::before` → **1** finding (`var(--phantom-b)`), confirming
  the `*`-leading line, not something else, caused the original 0.
- (c) inverted: `var(` joined onto one physical line → **1** finding (`var(--phantom-e)`), confirming the multi-line
  split, not something else, caused the original 0.

Both probes were run via a temporary scratch script (`scripts/__scratch-i5-inversion-probe.mjs`, deleted
immediately after capturing the transcript — confirmed absent from `git status --porcelain` at I10).

---

## 8. Commands run and actual results

| # | Command | Result | Evidence |
|---:|---|---|---|
| 1 | `git status --porcelain` (I1) | 5 paths, matches kickoff §3.8 exactly | pre-write snapshot |
| 2 | `npm run check:design-tokens` (I1) | exit 0, 0 violations | `i1-baseline-check-design-tokens.log` |
| 3 | `npx vitest run .../check-design-tokens.test.ts` (I1) | 85/85 passing | `i1-baseline-vitest.log` |
| 4 | R2(a) arm added, pre-`i`-flag (I2, D32) | **FAILED**, exit 1 | `i2-r2a-arm-prefix-FAIL.log` |
| 5 | `i` flag added (I3) + re-run | 86/86 passing, exit 0 | `i3-r2a-arm-postfix-PASS.log` |
| 6 | `grep -rniE '[\w-]var\(' --include='*.css' src/` (I4) | **0** matches (grep exit 1 = no-match) | `i4-remeasure-false-positive-surface.log` |
| 7 | `grep -rn '\bVAR(' --include='*.css' src/` (I4, A4 corollary) | **0** matches | `i4-remeasure-uppercase-var-today.log` |
| 8 | `npm run check:design-tokens` (I4, post-R1) | exit 0, 0 violations — R6 held | `i4-post-r1-check-design-tokens.log` |
| 9 | I5 inversions | both fixtures become findings (1 each) when their cause is removed | `i5-inversion-proof.log` |
| 10 | Suite with R2(b)/(c) added (I5) | 88/88 passing | `i5-r2bc-arms-pass.log` |
| 11 | R3 + R4 applied (I6/I7) | — | §5, §6 above |
| 12 | `npx vitest run .../check-design-tokens.test.ts` (I8) | **88/88 passing** (real total) | `i8-full-suite-final.log` |
| 13 | `npm run check:design-tokens` (I8) | 0 `css-undefined-var` findings, exit 0 | `i8-final-check-design-tokens.log` |
| 14 | `npx tsc --noEmit` | exit 0, 0 errors | `i9-tsc-noemit.log` |
| 15 | **`npm run build`** | **exit 0** — hard gate | `i9-npm-build.log` |
| 16 | `check:file-integrity` (I10, after cleanup) | 5 files clean, matches `git status` | `i10-check-file-integrity.log` |
| 17 | `check:mojibake` (I10, after cleanup) | 0 artifacts / 2078 files, exit 0 | `i10-check-mojibake.log` |

All transcripts captured unpiped: redirected to a `.log` file, then `$?` appended as `EXIT_CODE=N` inside the same
file, per Task 710 R10.

---

## 9. Evidence locations

All under `.screenshots/task718R-evidence/` (local-only, D6):

`i1-baseline-check-design-tokens.log` · `i1-baseline-vitest.log` · `i2-r2a-arm-prefix-FAIL.log` ·
`i3-r2a-arm-postfix-PASS.log` · `i4-post-r1-check-design-tokens.log` · `i4-remeasure-false-positive-surface.log` ·
`i4-remeasure-uppercase-var-today.log` · `i5-inversion-proof.log` · `i5-r2bc-arms-pass.log` ·
`i8-final-check-design-tokens.log` · `i8-full-suite-final.log` · `i9-npm-build.log` · `i9-tsc-noemit.log` ·
`i10-check-file-integrity.log` · `i10-check-mojibake.log`.

---

## 10. Counting gates — numbers and reconciliation to `git status`

Run twice: once mid-sequence (5 files, before this session's own session log + backlog edit landed), and once truly
last, after every write in this task including this file and `docs/backlog.md`. The final run is authoritative.

**Final `git status --porcelain`** (7 entries):
```
 M docs/backlog.md
 M docs/design-system.md
 M scripts/__tests__/check-design-tokens.test.ts
 M scripts/check-design-tokens.mjs
 M src/app/globals.css
?? docs/sessions/2026-08-06-task718-zindex-tokens-and-undefined-var-gate.md
?? docs/sessions/2026-08-06-task718R-css-undefined-var-coverage-gaps.md
```

**Final `check:file-integrity`** (`i10-final-check-file-integrity.log`): **7 files checked** (git-changed +
untracked) — matches the 7 entries above exactly. Exit 0.

**Final `check:mojibake`** (`i10-final-check-mojibake.log`): 2079 text files scanned repo-wide (this session's own
new session log pushed the repo-wide count from 2078 to 2079), 0 artifacts, exit 0.

The temporary inversion-probe script (`scripts/__scratch-i5-inversion-probe.mjs`) was created and deleted within
§7's step; it does not appear in either `git status --porcelain` snapshot, confirmed absent before both counting-gate
runs.

---

## 11. Standing findings not acted on

- **719** (`shouldSkipLine`) — separate task, blocked on this task's approval per its own §5 A1. Not started.
- The multi-line `var(` limitation — unowned, architectural, documented as A8, not fixed.
- **717** — path-allowlist narrowing (A4), not touched.
- **711** — `fullWidthButtonsAtMobile`/`popupBottomSheetAtMobile` selector re-anchor, unrelated surface.
- **700**, **702/691** (Sprint 46) — unrelated ListingCard/de-Tailwind work.

---

## 12. Assumptions, deviations, and limitations

- No deviation from the kickoff. R4 delivered in full (not the partial-delivery path A5 allows) — both fixtures
  measured clean unfiltered on `--space-6`.
- The suite total is **88**, not the kickoff's illustrative "89" — its own §4 (R7) explicitly authorizes restating
  the real number from the transcript rather than forcing 89; the arithmetic reconciles as 85 + 3 new arms, with
  R4's three restorations being in-place edits that add no new test cases.
- `git diff` on the three touched files (`check-design-tokens.mjs`, `check-design-tokens.test.ts`,
  `design-system.md`) is necessarily cumulative with Task 718's own uncommitted work, since neither task is
  committed yet and 718R explicitly edits that same working state (kickoff header). §4 above distinguishes which
  lines are 718's and which are 718R's for every touched file.
- No canonical UI decision record or visual source trace applies — this task touches only a build-time Node script,
  its unit suite, and a documentation section; zero `.tsx`/`.module.css`/rendered surface in scope (confirmed by
  the zero `.module.css` diff in §2/R5 and the QA profile's own rendered-evidence exemption).

---

## 13. Opus handoff

Evidence base: `.screenshots/task718R-evidence/`. Key things for the reviewer to independently verify:

1. Reproduce D32: revert the `i` flag, re-run the R2(a) arm, confirm it fails; re-apply, confirm it passes.
2. Reproduce the I5 inversions directly against `scanContent` for (b) and (c), or trust the persisted transcript.
3. Confirm `shouldSkipLine`'s literal text is unchanged (it appears in this session's diff only as context).
4. Confirm the two new §23.6.c entries (A7, A8) do not contradict 719's kickoff wording — cross-check against
   `tasks/Sprints/Sprint_52_kickoff_prompt_Task_719_...md` §3.2/§3.4, which this task's kickoff named as the source
   of truth for matching voice.
5. Task 718 and 718R remain uncommitted; one commit is expected to cover both once this review lands, per the
   kickoff's §5.2 "Commit 718 first, then revise" rejected-alternative note.

---

## 14. Backlog update

Concise active-state entry written to `docs/backlog.md` (state only, no history): "Last Session" header and body
replaced to reflect 718R's implementation, the Sprint 52 line and the 718R task-registry row updated in place.
**`BACKLOG LIMIT BREACH` continues** — the file was already at 86 lines against the ~80 target before this session
(flagged in the 718R kickoff); this session's edits held the line count at exactly **86** (net zero), so the
pre-existing breach neither worsened nor cleared. Opus consolidation is still needed to bring the file under 80.
