# Task 823 — `check:tailwind-runtime-tokens` is red on one reference: the card-track control's `var(--shadow-sm)`

Sprint 75 · P1 · QA profile **Q2**

**Status: ✅ `APPROVED` 2026-09-16 — archived.** Filed 2026-09-16. **Sequenced after Task 815's approved commit**: 815 is being
implemented now and edits comments in the same file (§3.4).

## 1. Mode and task type

`IMPLEMENTATION` — one CSS declaration in one CSS Module, value-preserving. Clears an inherited red blocking gate by
the route `docs/design-system.md` §23.7 prescribes. No other change is intended in how anything looks.

## 2. Objective

`npm run check:tailwind-runtime-tokens` exits 1 because the rail prev/next control reads a Tailwind-owned custom
property. Replace that read with the literal value the production build ships today, so that the gate exits 0, the
rendered shadow does not change, and the control no longer depends on Tailwind's theme output.

## 3. Verified context — measured 2026-09-16

### 3.1 The failure

`FACT` — `docs/sessions/evidence/task823/design/01_check-tailwind-runtime-tokens.txt`: exit 1,
`Tailwind-owned references found: 1 | baseline entries: 0`, the one entry being
`[module-css] src/design-system/mantine/patterns/MantineListingCardTrack.module.css:209  --shadow-sm`. `209` is in
the working tree at measurement time; on `HEAD` `1ed5cd2a5` the declaration is line **208**
(`git show HEAD:…MantineListingCardTrack.module.css`). `scripts/tailwind-runtime-token-baseline.json` is `[]`.

`FACT` — Task 813's AC22 proved the violation **inherited** (identical set in an isolated `HEAD` worktree,
`docs/sessions/evidence/task813/R16_02` / `R16_04`).

### 3.2 The declaration and what it resolves to

`FACT` — `MantineListingCardTrack.module.css` `.control { position:absolute; top:50%; transform:translateY(-50%);
z-index: var(--z-dropdown); box-shadow: var(--shadow-sm); }` (`HEAD` `:204-209`). Rendered by
`MantineListingCardTrack.tsx:105,118` (the two rail controls).

`FACT` — `src/app/globals.css:229` declares `--shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);`
inside the `@theme inline` block opened at `:35`, and the comment at `:226-227` says the block "mirrors Tailwind v4
defaults". §23.7: a name declared through `@theme inline` is emitted only by Tailwind's compiler, so it is Tailwind's
output and does not survive removing Tailwind.

`FACT` — the shipped production CSS (`.next/static/css/*.css` after `npm run build` on 2026-09-16, exit 0,
`docs/sessions/evidence/task743/design/01_build.txt`) contains exactly one form:
`--shadow-sm:0 1px 3px 0 #0000001a,0 1px 2px -1px #0000001a`. `#0000001a` is `rgba(0, 0, 0, 0.1)`.

### 3.3 In-repo precedent for exactly this value

`FACT` — `src/modules/listings/components/ListingCard.module.css:84`, `.overlayFavorite`:
`box-shadow: rgba(0, 0, 0, 0.1) 0 1px 3px 0, rgba(0, 0, 0, 0.1) 0 1px 2px -1px;` followed by one
`design-tokens-allow` marker per value `check:design-tokens` flags (`rgba(`, `1px`, `3px`, `2px`, `-1px`), each with a
reason. That is the same shadow, written the §23.7 way and accepted by both gates.

### 3.4 Concurrent work on the same file

`FACT` — at design time `git status` shows `MantineListingCardTrack.module.css` modified by Task 815's in-progress
implementation (comment-only, its R9). Starting before 815's commit would mix two tasks' hunks in one file.

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | §3.1, §3.2, §23.7 | `.control`'s `box-shadow` is the literal `rgba(0, 0, 0, 0.1) 0 1px 3px 0, rgba(0, 0, 0, 0.1) 0 1px 2px -1px`, with the same per-value `design-tokens-allow` markers and reason as `ListingCard.module.css:84`. No other declaration in the file changes. | **P0** | AC1, AC2 | Confirmed |
| **R2** | §3.1 | `check:tailwind-runtime-tokens` exits 0 with `Tailwind-owned references found: 0`; `scripts/tailwind-runtime-token-baseline.json` stays `[]` (the violation is fixed, not recorded). | **P0** | AC2 | Confirmed |
| **R3** | value preservation | The computed `box-shadow` of both rail controls is identical before and after, measured in Storybook `patterns-mantine-listingcardtrack--rail` at 1440×900, `locale:en`. | **P0** | AC3 | Confirmed |
| **R4** | gate hygiene | `check:design-tokens:strict` reports no **new** finding in this file (its violation total may be non-zero for reasons Task 822 owns, but no entry may name `MantineListingCardTrack.module.css`); `check:tailwind-runtime-tokens:verify-gate`, `check:css-vars`, `check:file-integrity`, `check:mojibake`, `build` exit 0. | **P0** | AC4 | Confirmed |

## 5. Assumptions and open questions

- `ASSUMPTION` (reversible) — Chromium computes `rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.1) 0px 1px 2px -1px` for both forms. R3 measures it rather than assuming it.
- Stop: if R3's before/after strings differ, return `BLOCKED` with both strings; do not adjust the literal toward a
  different value.
- No owner decision is needed: §23.7 prescribes the route and §3.3 is its accepted precedent.

## 6. Pre-read rule bundle

`docs/design-system.md` §23.7 in full and §23.6 (marker syntax) · `scripts/check-tailwind-runtime-tokens.mjs` header ·
`scripts/check-design-tokens.mjs:746-800` (inline suppression) · `src/modules/listings/components/ListingCard.module.css:70-90` ·
`src/design-system/mantine/patterns/MantineListingCardTrack.module.css` in full · `docs/agent-contract.md` clauses 9, 14 ·
`docs/qa-profiles.md` (Q2) · this kickoff.

## 7. Scope

- **Edited:** `src/design-system/mantine/patterns/MantineListingCardTrack.module.css` (`.control` `box-shadow` only) ·
  `docs/backlog.md` (823's state line).
- **Written:** `docs/sessions/evidence/task823/*` (not `design/`) · `docs/sessions/<date>-task823-*.md`.

## 8. Out of scope

`ListingCard.module.css` and every other shadow literal · `globals.css` (the `@theme inline` shadow scale stays) ·
Mantine `theme.shadows` · any baseline or allowlist file · the Task 815 comment hunks.

## 9. Current and required behavior

**Before.** The controls render `shadow-sm` through a Tailwind-emitted variable; the gate is red on every PR.
**After.** Identical computed shadow from a literal; the gate is green; removing Tailwind leaves this shadow intact.

## 10. Implementation requirements

1. Confirm Task 815's commit contains its hunks for this file (`git log -1 -- <file>`); if the file still shows
   uncommitted 815 hunks, stop — `BLOCKED`, sequencing.
2. Capture R3's **before** value first, from a Storybook build of the unmodified file.
3. Write the literal and markers by copying `ListingCard.module.css:84`'s form verbatim; read the file back through
   Node UTF-8 I/O, never `Get-Content -Raw` without `-Encoding utf8`.
4. Rebuild Storybook, capture R3's **after** value.

## 11. Positive and negative flows

**Positive.** CI's `check:tailwind-runtime-tokens` goes green; the rail controls look unchanged.

| Negative flow | Applicable | Expected |
|---|---:|---|
| A marker is missing or has no reason | Yes | `check:design-tokens:strict` names this file → fix before handoff (R4) |
| Computed shadow changes | Yes | stop, §5 |
| The fix is done by adding a baseline row | Yes | forbidden — R2 |
| Dark theme | No | the variable has no `.dark` override (`globals.css` `.dark` block does not redeclare `--shadow-sm`; re-check with `Select-String`) |

## 12. Acceptance criteria

- **AC1 [R1]** — `git diff` of the file shows one changed declaration line (plus its markers) inside `.control` and
  no other hunk. Quote the diff.
- **AC2 [R1, R2]** — `npm run check:tailwind-runtime-tokens` exits 0 with `found: 0`; `git diff --stat --
  scripts/tailwind-runtime-token-baseline.json` is empty. Quote both.
- **AC3 [R3]** — before and after `getComputedStyle(control).boxShadow` strings for both controls are byte-equal.
  Quote the four strings and the probe's exit code.
- **AC4 [R4]** — the §13.2 block: every listed command exit 0, and `check:design-tokens:strict` output contains no
  line naming `MantineListingCardTrack.module.css`. Quote the relevant lines.

**GR-4 AC AUDIT — 4 criteria; each states an observable property; absolutes: AC1's "no other hunk" and AC2's empty
baseline diff are this task's defined scope.**

## 13. QA profile and verification plan

**`Q2`** — a value-preserving CSS change on a migrated pattern with targeted rendered proof (AC3). No new gate is
claimed, so no planted proof. No visual change is intended, so no owner visual matrix; AC3 is the proof.

### 13.1 Baseline

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
node.exe --version
git --no-optional-locks status --porcelain
git --no-optional-locks log -1 --oneline -- src/design-system/mantine/patterns/MantineListingCardTrack.module.css
npm.cmd run check:tailwind-runtime-tokens
npm.cmd run build-storybook
```

Expected: `win32`; the file not modified in the working tree; the last commit touching it is Task 815's; the gate at
exit 1 with the one entry of §3.1; Storybook build exit 0. Then capture AC3's before values with a scratch
Playwright probe run from outside `scripts/` (retain it in the evidence folder).

### 13.2 Final gate block

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
npm.cmd run check:tailwind-runtime-tokens
npm.cmd run check:tailwind-runtime-tokens:verify-gate
npm.cmd run check:design-tokens:strict
npm.cmd run build
npm.cmd run check:css-vars
npm.cmd run build-storybook
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks diff --stat
git --no-optional-locks hash-object src/design-system/mantine/patterns/MantineListingCardTrack.module.css docs/backlog.md
```

Expected: every command exit 0 **except** `check:design-tokens:strict`, which may exit 1 on Task 822's inherited set
but must not name this file (AC4). Each command gets its own transcript, unpiped, exit code appended.

## 14. Completion report contract

Files changed with hashes · R1-R4 · baseline transcript · AC1 diff · AC2 outputs · AC3 before/after strings and probe
path · AC4 lines · every command with its exit code and transcript path · assumptions · deviations · limitations.
Status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. No self-approval, no git.

## 15. Task quality gate

| Question | Answer |
|---|---|
| Why a literal and not a baseline row? | §23.7 says to write the resolved literal; a baseline row records the debt and leaves the dependency. |
| Why not `var(--mantine-shadow-sm)`? | `theme.shadows` defines only `xs` and `lg` (`theme.ts:432-435`); `sm` would be Mantine's own default value, not this shadow. |
| Why not a new project token? | A single-site reproduction of a value §23.7 tells us to reproduce literally, with an accepted precedent (§3.3). |
| GR-1 / 16d? | Not applicable: no visible change (AC3 proves it). |

## Appendix — rule-compliance ledger and execution contract

| Rule | Mandatory outcome | Evidence | Result |
|---|---|---|---|
| `design-system.md` §23.7 | resolved literal verified against built CSS | §3.2, R1 | COMPLIANT |
| `agent-contract` 9 | final build exit 0 | §13.2 | COMPLIANT |
| `agent-contract` 14 | encoding-safe write | §10.3, §13.2 | COMPLIANT |
| GR-2 | gate result not over-read | R4 scopes `design-tokens` to this file | COMPLIANT |

| Checkpoint | Producer | Comparator / failure |
|---|---|---|
| 0 sequencing | `git log -1 -- file`, `git status` | 815 hunks uncommitted → `BLOCKED` |
| 1 before | probe transcript | missing → no edit |
| 2 edit | `git diff` | extra hunk → revise |
| 3 after | probe transcript | strings differ → `BLOCKED` (§5) |
| 4 gates | §13.2 | any required non-zero → not `IMPLEMENTED` |
