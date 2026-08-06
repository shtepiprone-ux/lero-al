# Task 720 — `extractCssCustomPropertyDefinitions` line-anchoring false positive

**Status: IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW**

Kickoff: `tasks/Sprints/Sprint_52_kickoff_prompt_Task_720_CustomProperty_Definition_LineAnchor.md`.

**A1 precondition note.** The kickoff requires 719 to be `APPROVED` before starting. At session start,
`git log` showed 719 already committed at `13e8c3ddf` (`fix(Task719): scan universal-selector lines in
.css — close the cross-category shouldSkipLine blind spot`), and `git status --porcelain` was empty.
Per the project's own git policy, Sonnet never commits and an implementation commit is owner-run only
after an Opus `APPROVED`/`APPROVED WITH NOTES` review — so the existence of that commit is the evidence
available to this session that the review/approval step occurred (no separate "719 APPROVED" note was
visible in `docs/backlog.md` at session start, only the stale `AWAITING ORCHESTRATOR REVIEW` text this
executor itself had written before the commit). The file-contention purpose of A1 — not editing
`check-design-tokens.mjs`/`.test.ts` in parallel with 719 — is satisfied regardless: 719's diff is
committed and the working tree was clean before this task's first edit. Recorded here for the
orchestrator to confirm formally if a review record does not already exist elsewhere.

---

## 1. Files changed

| File | Reason |
|---|---|
| `scripts/check-design-tokens.mjs` | R1/R2/R3 — `extractCssCustomPropertyDefinitions` rewritten to a declaration-aware quote/paren-tracking scan |
| `scripts/__tests__/check-design-tokens.test.ts` | New §J — the three R4 arms (a)/(b)/(c) plus one extra case-sensitivity resolution arm |
| `docs/design-system.md` | R7 — §23.6.c resolution-source-2 description updated; A7/A8 byte-unchanged |

`git diff --stat`: 3 files changed, 89 insertions(+), 8 deletions(-) — matches `git status --porcelain`'s 3 modified files exactly, no untracked files.

## 2. Requirement IDs completed

| ID | AC | Verdict |
|---|---|---|
| R1 | AC1 | Done — every declaration registered, including a second same-line one; see §3 |
| R2 | AC2 | Done — quote/paren-aware scan, `^` not deleted, no dependency added; §3.4's two hazard fixtures still return no definition |
| R3 | AC3 | Done — case never normalized; both same-line and cross-line case-distinct arms pass; a case-differing `var()` is still a finding |
| R4 | AC4 | Done — (a) and (b) failed pre-fix, (c) already passed pre-fix (expected, stated in §4); all pass post-fix |
| R5 | AC5 | Done — the three §3.6 lock arms confirmed zero diff, still passing |
| R6 | AC6 | Done — tree stays 0 findings, exit 0, both pre- and post-fix |
| R7 | AC7 | Done — §23.6.c resolution source 2 updated; A7/A8 confirmed byte-unchanged |
| R8 | AC8 | Done — diff confined to the one function + its own comment block; `shouldSkipLine`, `findUndefinedCssVarReferences`, `DETECTION_PATTERNS` all zero-hit in the diff |
| R9 | AC9 | Done — `npm run build` exit 0, `.screenshots/task720-evidence/i8-build.log` |
| R10 | AC10 | Done — counting gates run last, reconciled to `git status` (§10) |

## 3. The function, quoted before and after

**Before** (`scripts/check-design-tokens.mjs:571-578`, as measured in the kickoff at `98bec3fa9`):

```js
export function extractCssCustomPropertyDefinitions(content) {
  const stripped = stripCssComments(content);
  const defs = new Set();
  const re = /^\s*(--[\w-]+)\s*:/gm;
  let m;
  while ((m = re.exec(stripped)) !== null) defs.add(m[1]);
  return defs;
}
```

**After:**

```js
export function extractCssCustomPropertyDefinitions(content) {
  const stripped = stripCssComments(content);
  const defs = new Set();
  const declRe = /\s*(--[\w-]+)\s*:/y;
  const tryMatchAt = (pos) => {
    declRe.lastIndex = pos;
    const m = declRe.exec(stripped);
    if (m) defs.add(m[1]);
  };
  tryMatchAt(0);
  let parenDepth = 0;
  let quote = null;
  for (let i = 0; i < stripped.length; i++) {
    const ch = stripped[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    if (ch === '(') { parenDepth++; continue; }
    if (ch === ')') { if (parenDepth > 0) parenDepth--; continue; }
    if (parenDepth === 0 && (ch === '{' || ch === ';')) tryMatchAt(i + 1);
  }
  return defs;
}
```

**Mechanism, in three lines:** a single left-to-right walk over the CSS-comment-stripped source tracks
quote state (`"`/`'`, with `\` escaping the next char) and paren depth. Every position immediately
after a top-level (`parenDepth === 0`, not inside quotes) `{` or `;` — plus position 0 — is a candidate
declaration start, tested with a sticky regex (`/y`) so it only matches if the declaration begins
exactly there (after optional whitespace, including newlines). A position inside quotes or inside
`(...)` is never a candidate, so a declaration-shaped literal in a value can never register.

## 4. The three R4 arms, quoted, with the pre-fix transcript

```js
it('(a) a same-line define-and-use does not produce a phantom css-undefined-var finding', () => {
  const findings = findingsOfCss('.x { --local: 1px; width: var(--local); }')
    .filter(f => f.cat === 'css-undefined-var')
  expect(findings).toHaveLength(0)
})

it('(b) two different-case custom properties on the same line are both registered, distinctly', () => {
  const defs = extractCssCustomPropertyDefinitions('--Foo: 1px; --foo: 2px')
  expect(defs.has('--Foo')).toBe(true)
  expect(defs.has('--foo')).toBe(true)
  expect(defs.size).toBe(2)
})

it('(c) a declaration-shaped literal inside a value is not registered — content string and data-URI', () => {
  expect(extractCssCustomPropertyDefinitions('.x {\n  content: "--fake: 1px";\n}').has('--fake')).toBe(false)
  expect(extractCssCustomPropertyDefinitions('.x {\n  background: url("data:image/svg+xml,<svg style=%27--fake2: 1%27/>");\n}').has('--fake2')).toBe(false)
})
```

**Pre-fix transcript** (`.screenshots/task720-evidence/i2-r4-arms-prefix.log`): 2 failed, 96 passed (98
total), `EXIT_CODE=1`.

- **(a) FAILED** — `expected [ {…} ] to have a length of 0 but got 1` (the old anchored regex never
  registers `--local` since `.x { ` precedes it on the line, so `width: var(--local)` is reported as
  unresolved — the false positive itself).
- **(b) FAILED** — `expected false to be true` on `defs.has('--foo')` (the old regex's `exec` advances
  past the first same-line match; the second declaration on the line is never reached).
- **(c) already passed**, as the kickoff predicted (I2): neither `--fake` nor `--fake2` starts a
  physical line in its fixture, so the old anchored regex already misses both — for the wrong reason
  (line position, not value-awareness), but the observable result was already correct. Its job is to
  fail against the *naive* fix (deleting `^`), not against today's implementation, so a pre-fix pass
  here is expected and was kept as the permanent guard against that rejected repair (§3.4).

**Post-fix transcript** (`.screenshots/task720-evidence/i3-r4-arms-postfix.log`): 98 passed (98 total),
`EXIT_CODE=0`. All three arms, plus the extra case-resolution arm below, pass.

## 5. The three §3.6 lock arms — confirmed unmodified and passing

`git diff scripts/__tests__/check-design-tokens.test.ts | grep` for all three arm titles ("finds a
custom property regardless of indentation/block nesting", "ignores a definition-shaped string inside a
comment", "the real src/app/globals.css defines all 7 --z-* tokens") returns no `+`/`-` lines touching
them — zero diff. All three pass in the final 98/98 run (`.screenshots/task720-evidence/i7-full-suite-final.log`).

Suite totals: **98 before → 98 after** the arms were added (I2 added 4 new tests to the 94-test baseline
inherited from 719's commit: 94 + 4 = 98); the fix itself (I3) changed no test count, only pass/fail
status of the two failing arms.

## 6. The §23.6.c edit, quoted

**Added to resolution source 2's description** (the surrounding sentence "The same file being scanned —
a `--x:` declaration anywhere in that file (position-independent — the detector does not model
selector/media scoping, a documented simplification consistent with the rest of this file's line-based
design)." is unchanged; this is appended to it):

```
`extractCssCustomPropertyDefinitions` registers **every** top-level declaration, not only the first one
on a physical line (Task 720, R1/R2): a declaration start is recognized right after a top-level `{` or
`;` (or at the very start of the source), where "top-level" is tracked by a quote-state + paren-depth
walk over the already CSS-comment-stripped source — never inside a quoted string or inside `(...)`
nesting. That is what makes `.x { --local: 1px; width: var(--local); }` resolve correctly (a same-line
define-and-use no longer a phantom finding) while a declaration-shaped literal inside a `content` string
or a data-URI value is still never mistaken for a definition. Name case is never normalized — `--Foo`
and `--foo` remain two distinct entries.
```

**A7/A8 confirmed byte-unchanged:** `git diff docs/design-system.md | grep -i "A7\|A8"` on this
session's diff returns no output — neither entry appears in the diff at all. (A7 was already closed by
719's commit, quoted for context: "**A7 — closed by Task 719.**...")

## 7. A3's honesty note

§3.4's hazard — that deleting the `^` anchor would register a decl-shaped literal inside a `content`
string or data-URI as a phantom definition — is **argued from constructed fixtures, not observed on
this tree**. §3.3 independently measured zero same-line non-first-token declarations anywhere in
`src/**/*.css` before this task started, so neither the original bug nor the rejected naive fix's
hazard is exercised by any real file today. R4(c) is what converts that argument into a permanent,
executable arm rather than leaving it as prose.

## 8. Commands run and actual results

| # | Command | Result | Evidence |
|---:|---|---|---|
| 1 | `git status --porcelain` (pre-write) | empty | `i1-git-status.log` |
| 2 | `npm run check:design-tokens` (baseline) | exit 0, 0 findings | `i1-check-design-tokens.log` |
| 3 | `npx vitest run ...test.ts` (baseline) | 94 passed, exit 0 (inherited from 719's commit) | `i1-vitest-baseline.log` |
| 4 | Three R4 arms added, suite re-run | 2 failed / 96 passed (98 total), exit 1 | `i2-r4-arms-prefix.log` |
| 5 | Declaration-aware scan implemented, suite re-run | 98 passed, exit 0 | `i3-r4-arms-postfix.log` |
| 6 | `npm run check:design-tokens` (post-fix, R6/A2) | 0 findings, exit 0 | `i4-check-design-tokens-postfix.log` |
| 7 | §3.6 lock-arm zero-diff check | no diff on any of the 3 arm titles | inline `git diff \| grep`, this log |
| 8 | R7's §23.6.c edit | A7/A8 zero diff | §6 above |
| 9 | `npx vitest run ...test.ts` (final) | 98 passed, exit 0 | `i7-full-suite-final.log` |
| 10 | `npm run check:design-tokens` (final) | 0 findings, exit 0 | `i7-check-design-tokens-final.log` |
| 11 | `npx tsc --noEmit` | 0 errors, exit 0 | `i8-tsc.log` |
| 12 | **`npm run build`** | **exit 0** | `i8-build.log` |
| 13 | `npm run check:file-integrity` (last, after cleanup) | 3 files checked, PASSED, exit 0 | `i9-file-integrity.log` |
| 14 | `npm run check:mojibake` (last, after cleanup) | 2081 files scanned, 0 artifacts, exit 0 | `i9-mojibake.log` |

All transcripts captured unpiped: `cmd > file 2>&1; echo "EXIT_CODE=$?" >> file` (Task 710 R10).

## 9. Evidence locations

All under `.screenshots/task720-evidence/` (local-only, gitignored per D6, `/.screenshots/` in
`.gitignore:55`):

`i1-git-status.log` · `i1-check-design-tokens.log` · `i1-vitest-baseline.log` ·
`i2-r4-arms-prefix.log` · `i3-r4-arms-postfix.log` · `i4-check-design-tokens-postfix.log` ·
`i7-full-suite-final.log` · `i7-check-design-tokens-final.log` · `i8-tsc.log` · `i8-build.log` ·
`i9-file-integrity.log` · `i9-mojibake.log`.

## 10. Counting gates and reconciliation to `git status`

> **Corrected by the orchestrator at review, 2026-08-06 (review finding F1, `P1`) — and the cause was a
> rule, not this executor.** This section originally recorded a 3-path final state and a matching
> `Checking 3 file(s)`. The `i9-*` runs happened at 19:15–19:16, **before** `docs/backlog.md` (19:17:43)
> and this session log (19:17:07) existed, so they were not last and could not reconcile — including the
> claim "0 untracked", which this very file contradicts. Task **719** shipped the identical error one task
> earlier. The common cause is `docs/ai-behavior.md` step 5, which ordered the counting gates *"before
> writing the session log"*; both executors followed it faithfully. That step now carries **5a**, mandating
> the two-pass pattern and resolving the chicken-and-egg by **path set, not content**: the log must exist
> before the final run so it is counted, and only its numbers are filled in afterwards. The figures below
> are the orchestrator's pass-2 run on the true final path set and supersede `i9-file-integrity.log` /
> `i9-mojibake.log`.

Final `git status --porcelain` — **8 paths** (720's five, plus the three the review touched:
`docs/ai-behavior.md` for the 5a rule fix, `docs/backlog-archive.md` for the 719+720 ledger row, and
`tasks/Sprints/Sprint_52_…md` for the 719/720 state rows):

```
 M docs/ai-behavior.md
 M docs/backlog-archive.md
 M docs/backlog.md
 M docs/design-system.md
 M scripts/__tests__/check-design-tokens.test.ts
 M scripts/check-design-tokens.mjs
 M tasks/Sprints/Sprint_52_Gates_That_Stopped_Checking.md
?? docs/sessions/2026-08-06-task720-custom-property-definition-line-anchor.md
```

Pass-2 counting gates, run after every artifact was final:

```
check:file-integrity — Checking 8 file(s) → PASSED, all 8 file(s) clean       EXIT_CODE=0
check:mojibake       — scanning 2082 text file(s) → 0 artifacts in 2082 files EXIT_CODE=0
```

**8 counted ↔ 8 in `git status` — reconciles exactly.** `git diff --stat` for the seven tracked paths:
`7 files changed, 117 insertions(+), 15 deletions(-)`; the eighth is this untracked session log. No
scratch files were created outside the gitignored evidence directory — the defect was ordering, not
residue.

## 11. Standing findings not acted on

- **§23.6.c A7** — already closed by 719 (see §6 quote above), not reopened here.
- **§23.6.c A8** — multi-line `var(` calls, deliberately unowned/architectural, untouched (confirmed
  zero diff, §6).
- **717** — the `src/design-system/mantine` path allowlist narrowing, reserved, out of this task's scope.
- **711** — `fullWidthButtonsAtMobile`/`popupBottomSheetAtMobile` Mantine DOM re-anchor, reserved.
- **700** — general `@theme`-dependency gate, reserved (Sprint 46).
- **702 / 691** — `ListingCard`/`MantineListingCardPattern` de-Tailwind, reserved (Sprint 46), unrelated
  to this scanner change.

## 12. Assumptions, deviations, limitations, unresolved issues

- **A1's approval-status gap**, documented at the top of this log: proceeded on the strength of 719
  being committed (which the project's git policy gates on Opus approval) rather than an explicit
  "719 APPROVED" record visible to this session. Flagging for orchestrator confirmation, not treating
  as a blocker, since the actual file-contention risk A1 exists to prevent was already moot (clean
  tree, 719's diff already landed).
- **One arm beyond the three named R4 arms**: added `a var() differing only in case from a defined
  property is still a finding` to make AC3's "and a var() differing only in case from a defined
  property is still a finding. Show both." concrete and permanent, rather than leaving it as an
  inference from arm (b) alone. Not a deviation from scope — it exercises R3, stays inside §J, and adds
  no new edit site.
- **No CSS parser dependency added** (§3.5/R2) — the quote/paren-depth walk is the entire mechanism;
  no library was introduced.
- **Escaped-quote handling** (`if (ch === '\\') i++`) was added defensively so a quoted value containing
  an escaped quote character doesn't prematurely exit quote-tracking. This is not exercised by any
  required arm — no test fixture contains an escaped quote — flagging it as an unverified-by-test
  code path rather than silently asserting it is proven.
- No `TASK SPECIFICATION CONTRADICTION` or `CANONICAL UI SPECIFICATION GAP` encountered — non-UI,
  build-time Node script change (§13 of the kickoff: rendered evidence not required; R8 hash-verified
  zero diff outside the one function).

## 13. Backlog update

Written to `docs/backlog.md` — concise state only, see the accompanying edit.
