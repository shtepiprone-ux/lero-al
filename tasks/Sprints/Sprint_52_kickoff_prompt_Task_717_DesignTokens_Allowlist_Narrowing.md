# Task 717 — Replace the directory-wide `src/design-system/mantine` token exemption with scoped, reasoned ones

**Sprint 52 — Gates that stopped checking, position 52.2.**
**Status:** `KICKOFF FILED`. **QA profile:** `Q1` Targeted.
**Companions:** `Sprint_52_Task_717_execution_contract.md` · `Sprint_52_Task_717_rule_compliance_ledger.md`.

> **This task changes no rendered value.** Its diff may contain the allowlist JSON, marker comments and docs — and
> nothing else. That is a structural requirement, not an aspiration: it is what makes "zero visual delta" checkable
> instead of asserted. See §8 and AC7.

---

## 1. Mode and task type

**Mode:** implementation. **Type:** governance-gate scoping (non-product config + comment-only source edits). No
rendered value changes, no component behaviour changes, no Storybook story ships.

Sonnet executes via `execute-task` and reports `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`,
`PARTIALLY IMPLEMENTED`, or `BLOCKED`. Never self-approve.

---

## 2. Objective

`scripts/design-tokens-allowlist.json`'s first key exempts an entire directory from token enforcement on the
strength of a reason that covers part of it. Replace that blanket with exemptions whose stated reason actually
matches what each one exempts, and prove the narrowing works by planting a violation the gate cannot see today.

---

## 3. Verified context — measured from the repository 2026-08-08

### 3.1 The entry, and what its reason actually says

`scripts/design-tokens-allowlist.json` holds **8 keys**. The first is the bare directory
`"src/design-system/mantine"`. Its reason has exactly two clauses:

1. *"`theme.ts` requires raw hex colors and rem/px values as `createTheme()` inputs"* — Mantine's API does not
   accept CSS custom properties.
2. *"**Pattern component inline styles** use Mantine CSS variables for dynamic values and raw rem/px values only
   for non-tokenized Mantine affordances (drag-handle geometry, fixed touch-target minimums)."*

Neither clause mentions a `.css` or `.module.css` file. A stylesheet is not `createTheme()` input and is not an
inline style.

### 3.2 The blast radius, measured with the real detector — not a grep

Method: import the detector's own exported `scanContent` and `extractCssCustomPropertyDefinitions`, thread the same
`globalsDefinedProps` `run()` builds from `src/app/globals.css`, and scan every
`src/design-system/mantine/**/*.{ts,tsx,css}` (excluding `*.stories.tsx`, `*.test.tsx?`, `__tests__/`) with an
**empty** allowlist. **46 files scanned, 15 with violations, 206 total.**

| File | Violations | Covered by the stated reason? |
|---|---:|---|
| `theme.ts` | **141** (80 hex · 56 inline px/rem · 5 color function) | **Yes** — clause 1, verbatim |
| `input-chrome.css` | 23 | **No** — a stylesheet, neither clause |
| `patterns/MantineListingCardPattern.module.css` | 13 | **No** — a stylesheet |
| `notification-chrome.css` | 4 | **No** |
| `patterns/MantineDialogDrawerPattern.tsx` | 4 | Possibly — clause 2, if these are affordance geometry |
| `patterns/responsiveBottomSheet.tsx` | 4 | Possibly — clause 2 |
| `pagination-chrome.css` | 3 | **No** |
| `typography.ts` | 3 | Possibly — clause 1, if these are `createTheme()` inputs |
| `patterns/MantineCombobox.tsx` · `MantineSelect.tsx` · `RangeDatePicker.tsx` | 2 each | Possibly — clause 2 |
| `skeleton-chrome.css` | 2 | **No** |
| `patterns/MantineAppShellFoundation.tsx` · `MantineResponsiveActionFooter.tsx` | 1 each | Possibly — clause 2 |
| `scrollarea-chrome.css` | 1 | **No** |

`theme.ts` is **141 of 206**, so the entry's justification is genuine — for 68% of what it exempts. The remaining
**65** sit in 14 files, and **46 of those are in `.css`/`.module.css` files the reason never mentions.**

These counts are this kickoff's comparator under **D32**. Re-derive them as step 1; if your number differs from
206/15, stop and report the discrepancy rather than proceeding against a stale baseline.

### 3.3 CI is green **because** of the blanket

`npm run check:design-tokens` and `check:design-tokens:strict` are both
`node scripts/check-design-tokens.mjs --strict`; CI runs the latter at `.github/workflows/governance-pr.yml:97`.
A live run today reports:

```
Total: 0 raw style-value violation(s) | 0 stale-marker(s) | 0 missing-reason error(s)
✅  check:design-tokens — 0 violations found.
```

Zero — while 206 detectable literals sit inside the exempted directory. Task 715 flipped `css-length`,
`css-duration` and `css-zindex` to blocking (`docs/design-system.md` §23.6.b), so **anything this task surfaces and
does not scope or mark turns CI red.** That is why 715 deferred this (its §3.6) and why it has its own number.

### 3.4 The exemption mechanism you will use instead

Per-line markers, already used across the repo (`src/app/[locale]/layout.tsx:50`,
`src/components/admin/AdminTable.tsx:152,168`):

```
design-tokens-allow: <exact detected value> — <reason>
```

The `—` is an em-dash and the reason is **mandatory** (`parseInlineMarkers`; a reason-less marker is a
`missing-reason` error, and a marker whose value does not match the detected text is a `stale-marker`). CSS files
use the `/* … */` block form, `.tsx` the `//` or `{/* … */}` form.

### 3.5 A latent hole in the matcher — measured, and conditionally in scope

`isAllowlisted` (`scripts/check-design-tokens.mjs:708`) matches with:

```js
if (relPath === key || relPath.startsWith(key + '/') || relPath.startsWith(key)) return true;
```

The third condition is an **unbounded** prefix test: the key `src/design-system/mantine` would also exempt a
sibling named `src/design-system/mantine-legacy.ts`. Measured 2026-08-08 across all 8 keys and every
`src/**/*.{ts,tsx,css}`: **0 files are exempted only by that third condition** — the first two cover every current
match. §7.4 makes tightening it conditional on you re-measuring that same zero.

---

## 4. Requirements — one active route

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | §3.2 | The 206/15 baseline is re-derived with the detector's own exports and reconciled against this kickoff | P0 | Persisted census | Confirmed |
| R2 | 717 finding | Every one of the 206 is classified: `createTheme() input` · `non-tokenized Mantine affordance` · `genuine N1 violation` | P0 | Classification table | Confirmed |
| R3 | 717 finding | The bare-directory key is gone. Each replacement key is an **exact file path**, and its reason names what it exempts | P0 | Allowlist diff | Confirmed |
| R4 | §3.4 | Anything not covered by a scoped key carries a per-line marker with its own reason | P0 | Source diff | Confirmed |
| R5 | Two-armed plant | A violation planted in a now-unexempted file is **detected** (it is not, today); removing it returns the gate to green | P0 | Two transcripts | Confirmed |
| R6 | §3.3 | `check:design-tokens:strict` exits 0 at the end. CI is never left red | P0 | Transcript | Confirmed |
| R7 | §8 | The diff contains **zero** rendered-value changes — only JSON, comments and docs | P0 | Filtered diff | Confirmed |
| R8 | §3.2 | Every literal classified `genuine N1 violation` is reserved under one new number, not remediated here | P1 | Backlog row | Confirmed |
| R9 | §3.5 | The loose-matcher measurement is repeated; the third condition is removed **only if** it is still 0 | P1 | Transcript + diff | Confirmed |
| R10 | Standing | `npx tsc --noEmit` exit 0, `npm run build` exit 0 | P0 | Transcripts | Confirmed |
| R11 | Standing | Counting gates run last, after the session log and backlog row exist | P0 | Two passes | Confirmed |

---

## 5. Assumptions and open questions

- **A1.** The worktree may start dirty. Snapshot `git status --porcelain` before the first write and classify every
  entry; pre-existing modified paths need before/after content witnesses, not an equal porcelain status.
- **A2.** `theme.ts`'s 141 are assumed genuine `createTheme()` inputs, consistent with clause 1. **Verify, do not
  assume:** if any of the 141 is not passed to `createTheme()`, it is a genuine N1 violation and belongs in R8's
  reserve, not under a scoped key.
- **A3.** No owner decision is outstanding. Sprint 52's parked item (727) is unrelated.
- **OQ1.** If the classification finds that scoping honestly requires more than ~15 per-line markers in one file,
  that file's values are probably a tokenization job, not an exemption job. Report it under R8 and leave a scoped
  file-level key with an explicit "reserved for <number>" reason rather than papering it with markers.

---

## 6. Pre-read rule bundle

- `CLAUDE.md` · `docs/agent-contract.md` · `docs/orchestrator-procedures.md` (git policy) · `docs/rule-index.md`
- `docs/qa-profiles.md` — the `Q1` row
- `docs/design-system.md` — **§23.6.b** (715's strict flip and the inventory closure)
- `scripts/check-design-tokens.mjs` — `:117-273` (patterns), `:645-700` (`parseInlineMarkers`), `:708-717`
  (`isAllowlisted`), `:890-910` (`run()`)
- `scripts/design-tokens-allowlist.json` — all 8 keys
- `tasks/Sprints/Sprint_52_Gates_That_Stopped_Checking.md` — §9 Notes and §10
- `docs/sessions/2026-08-06-task715-design-tokens-strict-flip-and-remediation.md` — the deferral and the N1 taxonomy
- `docs/sessions/2026-08-06-task716-design-tokens-shorthand-and-function-coverage.md` — the
  `N1-VIOLATION` / `COMPILED-ARTIFACT` split this task's R2 reuses

---

## 7. Scope

### 7.1 R1 — re-derive the baseline first

Reproduce §3.2's measurement with the detector's own exports. Persist the per-file, per-category table. This is the
D32 comparator: a literal you cannot show the gate would catch may not be scoped away.

### 7.2 R2 — classify all 206 before editing anything

Use 716's existing taxonomy. Every literal lands in exactly one class, with the reason recorded per file. A class
of "it was already exempt" is not a class.

### 7.3 R3/R4 — replace the blanket

Delete the bare-directory key. What replaces it follows from the classification and is **not** prescribed here —
except for three hard constraints: no replacement key may be a bare directory; every key must be an exact file
path; and every key and every marker carries a reason naming what it exempts and why that thing cannot be a token.

### 7.4 R9 — the matcher, conditionally

Re-measure how many files are exempted only by `isAllowlisted`'s third condition. If it is still **0**, delete that
condition — the first two cover every current match, and leaving it means your exact-file keys have no boundary.
If it is **not** 0, change nothing and report the count: something now depends on it and that is its own task.

### 7.5 R5 — prove it, in both directions

1. Plant a raw literal in a file this task just un-exempted — one of the `.css` chrome files is the clearest.
   Run `check:design-tokens:strict`. **It must fail**, naming the file and value. Today it does not.
2. Remove the plant. The gate returns to exit 0.

Restore evidence is required, not asserted: the planted file's pre-plant `git hash-object` value and its absence
from `git status --porcelain`, both captured after the final gate run.

---

## 8. Out of scope — and the zero-value-change rule

**The diff may contain only:** `scripts/design-tokens-allowlist.json`, comment-only lines added to source files,
`scripts/check-design-tokens.mjs`'s single conditional §7.4 line, `docs/backlog.md`, the session log, and any doc
this task must amend.

**A change to any rendered value stops the task.** If the classification concludes a literal must become a token,
that is R8's reserve, not this diff. Prove the rule held: after the final gate run, a diff filtered to exclude
comment-only and JSON changes must be empty, and that filtered diff goes in the session log.

Also out of scope: remediating any N1 violation · `theme.ts`'s values themselves · any other allowlist key ·
`MANTINE_VIEWPORTS`, the rendered matrix and anything in 52.1/52.3/52.4/52.5 · wiring anything into CI (727).

---

## 9. Current and required behavior

**Current.** One key exempts 46 files on a reason that describes `theme.ts` and inline pattern styles. 206
detectable literals sit inside it, 46 of them in stylesheets the reason never mentions, and the gate reports zero.

**Required.** Every exemption names an exact file and a reason that matches what it exempts. Everything else is
either marked per line with its own reason or reserved as a known violation under a number. The gate still exits 0
— but now because nothing unjustified is hidden, and a planted literal in a formerly-blanket file is caught.

---

## 10. Implementation requirements

1. No replacement key is a directory. Exact file paths only.
2. Every marker uses the `design-tokens-allow: <value> — <reason>` form with a real reason; a value must match the
   detected text exactly or it reports `stale-marker`.
3. A reason may not restate the rule ("Mantine needs raw values"). It names the specific thing — which Mantine API
   consumes it, or which affordance has no token.
4. `check:design-tokens:strict` exits 0 at every checkpoint after the first edit. Never leave the gate red between
   steps and fix it at the end.
5. No detection pattern, threshold or category is changed. This task scopes exemptions; it does not retune the
   detector.

---

## 11. Positive and negative flows

**Positive.** After the change, a raw hex added to `input-chrome.css` is caught by `check:design-tokens:strict`;
`theme.ts`'s `createTheme()` inputs stay silent under a key that names them; the gate exits 0 on a clean tree.

| Negative flow | Applicable | Why |
|---|---|---|
| Narrowing surfaces violations and CI goes red | **Yes** | R6 — the central risk; 715 deferred this task for it |
| A scoped key is still too broad (a directory in disguise) | **Yes** | Would re-create the defect at a smaller size |
| A marker's value does not match the detected text | **Yes** | Reports `stale-marker`; the gate's own error path |
| A marker is added with no reason | **Yes** | `missing-reason` error — the mechanism enforces it |
| Tightening the matcher un-exempts something real | **Yes** | R9 gates the fix on a re-measured 0 |
| A value is "just tokenized quickly" to avoid a marker | **Yes** | R7 forbids it — that is a visual change with no visual QA |
| Locale / i18n regression | No | No `messages/*` change; parity still run as a guard |
| Visual / layout regression | No | Structurally impossible under R7; the filtered diff is the witness |
| Auth / RLS / data-loss | No | Config and comments only |

---

## 12. Acceptance criteria

- **AC1 [R1]** Given the re-derived census, then its totals are stated and reconciled against 206/15, and any
  difference is explained before any edit.
- **AC2 [R2]** Given the classification table, then all 206 appear exactly once, each in one class with a reason.
- **AC3 [R3]** Given the allowlist diff, then `"src/design-system/mantine"` is absent, and every added key is an
  exact file path whose reason names what it exempts.
- **AC4 [R4]** Given the source diff, then every literal not covered by a scoped key carries a marker with a
  non-empty reason, and the gate reports 0 `stale-marker` and 0 `missing-reason`.
- **AC5 [R5]** Given the planted literal, then `check:design-tokens:strict` **fails** naming file and value; given
  its removal, the gate exits 0 and the file's `git hash-object` equals its pre-plant value with the path absent
  from `git status --porcelain`.
- **AC6 [R6]** Given the final run, then `check:design-tokens:strict` exits 0.
- **AC7 [R7]** Given the diff filtered to exclude comment-only and JSON changes, then it is **empty**, and that
  filtered diff is in the session log.
- **AC8 [R8]** Given the classification, then every `genuine N1 violation` is reserved under one new backlog number
  with its file list, and none is remediated in this diff.
- **AC9 [R9]** Given the re-measured loose-matcher count, then it is stated; the third condition is removed only if
  that count is 0, and left untouched with the count reported otherwise.
- **AC10 [R10]** `npx tsc --noEmit` exit 0 and `npm run build` exit 0.
- **AC11 [R11]** Two counting-gate passes, the second after the session log and backlog row exist, reconciling
  exactly to `git status --porcelain`.

---

## 13. QA profile and verification plan

**Profile: `Q1` Targeted.** Non-UI code, and R7 makes the change structurally incapable of altering a rendered
value — the filtered-diff check (AC7) is the evidence, which is stronger than a screenshot of an unchanged pixel.
**If R7 is broken for any reason, the profile is wrong and the task stops** rather than continuing under Q1.

| # | Command | Expected |
|---|---|---|
| 1 | `git status --porcelain` (pre-write) | A1 manifest |
| 2 | Census via the detector's exports, empty allowlist | AC1 vs 206/15 |
| 3 | `npm run check:design-tokens:strict` (pre-edit) | exit 0, 0 violations — the "green because blanketed" baseline |
| 4 | Plant · `npm run check:design-tokens:strict` | **fails**, names file and value |
| 5 | Remove plant · `git hash-object` · `git status --porcelain` | AC5 |
| 6 | `npm run check:design-tokens:strict` (final) | exit 0, 0 stale-marker, 0 missing-reason |
| 7 | Filtered diff (exclude comment-only + JSON) | **empty** — AC7 |
| 8 | `npx tsc --noEmit` | exit 0 |
| 9 | `npm run check:i18n` | exit 0 (guard) |
| 10 | `npm run build` | **exit 0, mandatory** |
| 11 | `check:file-integrity` + `check:mojibake`, twice | AC11 |

A failed or unrun step 10 permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`.

---

## 14. Completion report contract

Report: changed files with reasons · R1–R11 each with its evidence artifact · every command with its **actual**
result and exit code · evidence root · assumptions, deviations, limitations · unresolved issues. State the
classification totals as three numbers that sum to the re-derived baseline, and the count of scoped keys and
markers added. Then update `docs/backlog.md` and write
`docs/sessions/<date>-task717-design-tokens-allowlist-narrowing.md`.

---

## 15. Task quality gate

Checked before publication: a fresh Sonnet session can execute this without chat context · every requirement has a
binary AC and a verification method · **every count here was measured with the detector's own exported functions,
never a grep** — the standing "measure with the real tool" corollary · the replacement allowlist shape is
deliberately withheld and derived from the classification instead · the zero-value-change rule is enforced by a
filtered-diff artifact rather than by assertion · the matcher fix is gated on a re-measured zero, not assumed safe ·
both the CI-goes-red and marker-malformed failure paths are covered by distinct ACs · the dirty-worktree manifest is
required rather than assumed · nothing is remediated that the task also reserves.
