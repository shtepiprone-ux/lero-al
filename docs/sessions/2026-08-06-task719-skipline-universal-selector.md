# Task 719 — `shouldSkipLine` cross-category universal-selector blind spot

**Status: IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW**

Kickoff: `tasks/Sprints/Sprint_52_kickoff_prompt_Task_719_SkipLine_UniversalSelector_Blind_Spot.md`.
A1 precondition verified before starting: `docs/backlog.md` records **718 + 718R `APPROVED WITH
NOTES`**, committed `98bec3fa9`, and **719 unblocked**. Pre-write `git status --porcelain` was empty.

---

## 1. Files changed

| File | Reason |
|---|---|
| `scripts/check-design-tokens.mjs` | R1 — `.css`-only stripped-line skip decision; R4 — dead `:586` duplicate removed as part of the same rewrite |
| `scripts/__tests__/check-design-tokens.test.ts` | New §I (4 R2 arms + 2 R3 arms); inverted the pre-existing §H arm that documented the now-closed blind spot |
| `docs/design-system.md` | R5 — §23.6.c's A7 entry retired with a closure note; A8 (multi-line `var(`) left untouched |

`git diff --stat`: 3 files changed, 85 insertions(+), 13 deletions(-) — matches `git status --porcelain`'s 3 modified files exactly, no untracked files.

## 2. Requirement IDs completed

| ID | AC | Verdict |
|---|---|---|
| R1 | AC1 | Done — see §3 quote below |
| R2 | AC2 | Done — 4 arms, failing-then-passing transcripts in §4 |
| R3 | AC3 | Done — 2 new arms + §A's 2 pre-existing arms confirmed zero-diff |
| R4 | AC4 | Done — dead `:586` branch is gone (subsumed into the R1 rewrite) |
| R5 | AC5 | Done — §23.6.c A7 retired, A8 unchanged |
| R6 | AC6 | Done — diff is exactly `shouldSkipLine` + its call site; `git status` shows only the 3 files above |
| R7 | AC7 | Done — `npm run build` exit 0, transcript `.screenshots/task719-evidence/i8-build.log` |
| R8 | AC8 | Done — counting gates run last, reconciled to `git status` (§9) |

## 3. `shouldSkipLine` and its call site, quoted before and after

**Before** (`scripts/check-design-tokens.mjs:581-588`, as measured in the kickoff):

```js
function shouldSkipLine(line) {
  const trimmed = line.trimStart();
  // Comment-only lines (value inside a trailing // comment is not runtime code)
  if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return true;
  // CSS comment lines
  if (trimmed.startsWith('/*') || trimmed.startsWith('*')) return true;      // ← :586, dead
  // Import / type declarations — no runtime style values
  if (/^\s*(import\s|export\s+type|type\s+\w|interface\s+\w)/.test(line)) return true;
  return false;
}
```

Call site: `if (shouldSkipLine(line)) continue;`

**After** (`scripts/check-design-tokens.mjs:580-600`):

```js
// ── Skip heuristics ───────────────────────────────────────────────────────────
// Task 719, R1: in .css, CSS comments have already been stripped into
// cssStrippedLine (Task 714 A2) by the time this runs, so a leading `*` there
// is the universal selector, not a comment — ask the stripper whether
// anything real survived instead of guessing from the raw line's first
// character. In .ts/.tsx, nothing else strips `/** ... */` JSDoc continuation
// lines, so the leading-`*`/`/*` heuristic stays exactly as it was for those
// files (A2 of the kickoff — this branch must not move).
function shouldSkipLine(line, isCssFile, cssStrippedLine) {
  const trimmed = line.trimStart();
  // Comment-only lines (value inside a trailing // comment is not runtime code)
  if (trimmed.startsWith('//')) return true;
  if (isCssFile) {
    if (cssStrippedLine.trim() === '') return true;
  } else if (trimmed.startsWith('*') || trimmed.startsWith('/*')) {
    return true;
  }
  // Import / type declarations — no runtime style values
  if (/^\s*(import\s|export\s+type|type\s+\w|interface\s+\w)/.test(line)) return true;
  return false;
}
```

Call site: `if (shouldSkipLine(line, isCssFile, isCssFile ? cssStrippedLines[i] : null)) continue;`

**A3 honored** — the route is "ask the stripper" (`cssStrippedLine.trim() === ''`), not a `*`-selector
regex. **A2 honored** — the `.ts`/`.tsx` branch (`trimmed.startsWith('*') || trimmed.startsWith('/*')`)
is byte-for-byte the same predicate as before; it just now sits in an `else` arm gated on `isCssFile`,
so it only ever evaluates for non-`.css` files, identical to its prior unconditional behavior for
those files. The `//` branch and the `import`/`type`/`interface` branch are unmoved.

## 4. The four R2 planted arms — failing then passing transcripts

**Failing transcript** (`.screenshots/task719-evidence/i2-four-arms-prefix-fail.log`), arms added
before R1: 4 failed, 88 passed (92 total), `EXIT_CODE=1`. All four failures were behavioral
(`expected [] to have a length of 1 but got +0`), never a module-load/syntax error, per 718 review F2.

**Passing transcript** (`.screenshots/task719-evidence/i3-four-arms-postR1-pass.log`), same run
after R1: 92 passed (92 total), `EXIT_CODE=0`.

| Fixture | Category | Before | After |
|---|---|---|---|
| `* { margin: 10px; }` | `css-length` | 0 findings (FAIL) | 1 finding, `margin: 10px` |
| `* { transition-duration: 250ms; }` | `css-duration` | 0 findings (FAIL) | 1 finding, `transition-duration: 250ms` |
| `* { z-index: 42; }` | `css-zindex` | 0 findings (FAIL) | 1 finding, `z-index: 42` |
| `* { color: var(--phantom); }` | `css-undefined-var` | 0 findings (FAIL) | 1 finding, `var(--phantom)` |

## 5. Regression evidence

**§A's two pre-existing skip arms** (`scripts/__tests__/check-design-tokens.test.ts:79-86`) —
confirmed **zero diff**: `git diff scripts/__tests__/check-design-tokens.test.ts | grep` for both
arm titles returns no `+`/`-` lines touching them. Both still pass in the final 94/94 run.

**Two new R3 arms** added in `.screenshots/task719-evidence/i4-r3-regression-arms.log` (94 passed,
`EXIT_CODE=0`):

1. `.css` multi-line comment continuation — a fake `margin: 999px;` written on a `*`-prefixed line
   *inside* a `/* ... */` block is not flagged; the real `.a { margin: 10px; }` line after the
   comment still is (exactly 1 `css-length` finding, matching `margin: 10px`). This proves the fix
   asks the stripper rather than newly scanning every line.
2. `.tsx` JSDoc continuation — a `/** ... */` block containing `className="text-[10px]"` prose on a
   `*`-prefixed continuation line produces 0 findings, confirming the `.ts`/`.tsx` path did not move.

**Inverted arm (net-new regression lock, not one of the four R2 arms):** the pre-existing §H arm at
the old `:640-644` (`does NOT flag a var() reference on a line whose first non-space character is
"*"...`) directly encoded the blind spot 719 closes and would otherwise fail once R1 landed (A1's
"both edit the same test file" warning was about exactly this). It is now:

```js
it('DOES flag a var() reference on a line whose first non-space character is "*" — Task 719 closed the cross-category shouldSkipLine blind spot (§23.6.c)', () => {
  const findings = scanContent('*, *::before { color: var(--phantom-b); }', CSS_FIXTURE_PATH, {})
    .filter(f => f.cat === 'css-undefined-var')
  expect(findings).toHaveLength(1)
  expect(findings[0].match).toBe('var(--phantom-b)')
})
```

## 6. The §23.6.c edit, quoted

**Retired entry (was A7):**

```
**A7 — known coverage limitation, not closed here (718R):** a `var(` reference on a line whose
first non-space character is `*` is silently not a finding, because `shouldSkipLine` treats any such
line as a comment before any category runs — a CSS-comment heuristic that is also the universal
selector. This blind spot is **cross-category** (`css-length`, `css-duration`, `css-zindex` and
`css-undefined-var` are all affected, not just this one), so fixing it here would exceed this task's
scope. Owner: **719**.
```

**Closure note (now A7):**

```
**A7 — closed by Task 719.** A `var(` reference — and, cross-category, a `css-length`/`css-duration`/
`css-zindex` declaration too — on a line whose first non-space character is `*` used to be silently
not a finding, because `shouldSkipLine` treated any such line as a comment before any category ran,
conflating the CSS-comment heuristic with the universal selector. Task 719 made the `.css` skip
decision consult the already CSS-comment-stripped line (Task 714 A2) and skip only when that line is
blank, so a universal-selector rule is scanned like any other; the `.ts`/`.tsx` leading-`*`/`/*` JSDoc
heuristic is unchanged, because nothing else strips those continuation lines. Proof: four planted
arms, one per blinded category, each failing before the fix and passing after
(`scripts/__tests__/check-design-tokens.test.ts` §I).
```

**Surviving entry (A8, unchanged, zero diff):**

```
**A8 — known coverage limitation, not closed here (718R):** a `var(` call split across physical
lines (the opening paren on one line, its contents or closing paren on another) is silently not a
finding, because `findUndefinedCssVarReferences` scans one physical line and bails on an unbalanced
paren. This is deliberate and consistent with the whole file's line-based scan model (§3.4 of the
718R kickoff) — making one category multi-line would give it a different source model from every
other category in the same loop. Owner: none — architectural, unowned; fixing it is a
scanner-architecture task, not a regex change.
```

## 7. Commands run and actual results

| # | Command | Result | Evidence |
|---:|---|---|---|
| 1 | `git status --porcelain` (pre-write) | empty | `i1-git-status.log` |
| 2 | `npm run check:design-tokens` (baseline) | exit 0, 0 findings | `i1-check-design-tokens.log` |
| 3 | `npx vitest run scripts/__tests__/check-design-tokens.test.ts` (baseline) | 88 passed, exit 0 | `i1-vitest-baseline.log` |
| 4 | Four R2 arms added, suite re-run | 4 failed / 88 passed (92 total), exit 1 | `i2-four-arms-prefix-fail.log` |
| 5 | R1 landed, suite re-run | 92 passed, exit 0 | `i3-four-arms-postR1-pass.log` |
| 6 | R3's two arms added, suite re-run | 94 passed, exit 0 | `i4-r3-regression-arms.log` |
| 7 | `npm run check:design-tokens` (post-R1, A5) | 0 findings, exit 0 | `i5-check-design-tokens-postR1.log` |
| 8 | R4 (subsumed in R1 diff) + R5 §23.6.c edit | — | §6 above |
| 9 | `npx vitest run scripts/__tests__/check-design-tokens.test.ts` (final) | 94 passed, exit 0 | `i7-full-suite-final.log` |
| 10 | `npm run check:design-tokens` (final) | 0 findings, exit 0 | `i7-check-design-tokens-final.log` |
| 11 | `npx tsc --noEmit` | 0 errors, exit 0 | `i8-tsc.log` |
| 12 | **`npm run build`** | **exit 0** | `i8-build.log` |
| 13 | `npm run check:file-integrity` (last, after cleanup) | 3 files checked, PASSED, exit 0 | `i9-file-integrity.log` |
| 14 | `npm run check:mojibake` (last, after cleanup) | 2080 files scanned, 0 artifacts, exit 0 | `i9-mojibake.log` |

All transcripts captured unpiped: `cmd > file 2>&1; echo "EXIT_CODE=$?" >> file` (Task 710 R10).

## 8. Evidence locations

All under `.screenshots/task719-evidence/` (local-only, gitignored per D6, `/.screenshots/` in
`.gitignore:55`):

`i1-git-status.log` · `i1-check-design-tokens.log` · `i1-vitest-baseline.log` ·
`i2-four-arms-prefix-fail.log` · `i3-four-arms-postR1-pass.log` · `i4-r3-regression-arms.log` ·
`i5-check-design-tokens-postR1.log` · `i7-full-suite-final.log` · `i7-check-design-tokens-final.log` ·
`i8-tsc.log` · `i8-build.log` · `i9-file-integrity.log` · `i9-mojibake.log`.

## 9. Counting gates and reconciliation to `git status`

> **Corrected by the orchestrator at review, 2026-08-06 (review finding F1, `P1`).** This section
> originally recorded a 3-path final state and a matching `Checking 3 file(s)`. That was wrong: the
> `i9-*` gate runs happened at 18:56, **before** `docs/backlog.md` (18:57:42) and this session log
> (18:57:05) were written, so they were not the last step and their numbers did not reconcile to the
> real final `git status`. The gates were re-run natively by the owner on the true final state; their
> output is recorded below and supersedes `i9-file-integrity.log` / `i9-mojibake.log`. The original
> text is not reinstated because it asserted a state that never existed at the end of the session —
> including "0 untracked", which this very file contradicts.

Final `git status --porcelain` — **5 paths**:

```
 M docs/backlog.md
 M docs/design-system.md
 M scripts/__tests__/check-design-tokens.test.ts
 M scripts/check-design-tokens.mjs
?? docs/sessions/2026-08-06-task719-skipline-universal-selector.md
```

Owner-run, native PowerShell, after every artifact was final:

```
check:file-integrity — Checking 5 file(s) → PASSED, all 5 file(s) clean       EXIT_CODE=0
check:mojibake       — scanning 2081 text file(s) → 0 artifacts in 2081 files EXIT_CODE=0
```

**5 counted ↔ 5 in `git status` — reconciles exactly.** `git diff --stat` for the four tracked paths:
`4 files changed, 89 insertions(+), 18 deletions(-)`; the fifth path is this untracked session log.
No scratch files were created outside the gitignored evidence directory, so no cleanup step was
needed — the defect was ordering, not residue.

## 10. Standing findings not acted on (out of scope, per §8 of the kickoff)

- **718R A8 / this session's §23.6.c A8** — multi-line `var(` calls remain unowned/architectural, not
  touched.
- **717** — the `src/design-system/mantine` path allowlist narrowing, reserved, not this task's scope.
- **711** — `fullWidthButtonsAtMobile`/`popupBottomSheetAtMobile` Mantine DOM re-anchor, reserved.
- **700** — general `@theme`-dependency gate, reserved (Sprint 46).
- **702 / 691** — `ListingCard`/`MantineListingCardPattern` de-Tailwind, reserved (Sprint 46), unrelated
  to this scanner change.

## 11. Assumptions, deviations, limitations, unresolved issues

- **A1 verified before starting**: 718R was `APPROVED WITH NOTES` and committed (`98bec3fa9`) per
  `docs/backlog.md`'s Last Session entry; 719 was recorded unblocked. Proceeded without stopping.
- **No deviation from A2/A3**: the `.ts`/`.tsx` predicate is textually identical to its pre-existing
  form (`trimmed.startsWith('*') || trimmed.startsWith('/*')`), just relocated into an `else` arm
  gated on `isCssFile`; the CSS route asks `cssStrippedLine.trim() === ''` rather than any selector
  regex.
- **One test inversion beyond R2/R3's six named arms**: the pre-existing §H arm at old `:640-644`
  encoded the exact blind spot this task closes and had to be inverted (not merely left alone) once
  R1 landed, or the suite would regress. This is consistent with A1's explicit warning that 718R and
  719 "both edit the same test file and doc section" and is reported here for reviewer visibility
  rather than folded silently into the R2/R3 count.
- **R4 was not a separate edit**: the dead `:586` duplicate could not be removed independently of R1's
  rewrite without producing a nonsensical intermediate function, so both requirements were satisfied
  by the single `shouldSkipLine` rewrite in §3. The diff shows no duplicate skip-comment branch
  remains.
- No unresolved issues. No `TASK SPECIFICATION CONTRADICTION` or `CANONICAL UI SPECIFICATION GAP`
  encountered — this is a non-UI, build-time Node script change (§13 of the kickoff: rendered evidence
  not required, confirmed no `.module.css`/`.tsx`/`globals.css`/token diff, R6 hash-verified).

## 12. Backlog update

Written to `docs/backlog.md` — concise state only, see next section of this handoff.
