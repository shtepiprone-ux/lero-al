# Task 715 — Remediate the 60-literal inventory and flip the CSS categories to blocking

**Sprint:** 52 (`tasks/Sprints/Sprint_52_Gates_That_Stopped_Checking.md`). **Epic:** JJ (design tokens).
**Depends on:** 714 + 716, both `APPROVED WITH NOTES`. **Closes Sprint 52's design-token half.**

---

## 1. Mode and task type

- **Mode:** implementation (Sonnet executor, via `.claude/skills/execute-task/SKILL.md`).
- **Primary task type:** **governance gate — enforcement flip** (`docs/rule-index.md` → Validation/QA tooling).
- **Secondary type:** **D28 remediation** in six `.module.css` files owned by closed tasks.

> **Read this first.** This is the only task in Sprint 52 that edits `src/`. You are replacing 60 raw literals in
> six modules that belong to **approved, closed tasks** (673 · 706 · 688 · 707 · 713), then making the gate
> blocking. **D28 binds every edit: mechanism-only, zero visual delta.** `gap: 1.5rem` → `gap: var(--space-6)` is
> safe *only if* the token resolves to exactly `1.5rem`. Verify each substitution against §22's tables; do not
> assume a token whose name looks right has the value you need.

---

## 2. Objective

1. Remediate every item in 716's **60-literal inventory**: `N1-VIOLATION` → consume the existing token;
   `COMPILED-ARTIFACT` → add a `design-tokens-allow` marker with a reason.
2. **Restore** the three MobileBottomNav nav-label suppressions with their original pre-713 reasons (§3.3) — this
   is a restoration, not a new policy decision.
3. Remove `css-length` / `css-duration` / `css-zindex` from `REPORT_ONLY_CATEGORIES` so they block, and prove the
   flip with a planted violation.
4. Prove **zero visual delta** across the 168 rendered cells that cover the edited files.

**Non-goals:** do **not** change any detector pattern (714/716 own those); do **not** widen or narrow the path-level
allowlist (§3.6 → follow-up); do **not** restyle, re-token or "improve" any value — D28 forbids it.

---

## 3. Verified context

Every fact below was read or executed in this worktree on **2026-08-06**, during the 714/716 reviews. Nothing is
inferred from a filename or a prior report.

### 3.1 The inventory

`.screenshots/task716-evidence/task716-css-declaration-inventory.md` — **60 literals across 6 files**, classified
`N1-VIOLATION` (a §22 token exists at this exact value; consume it) or `COMPILED-ARTIFACT` (no token exists for
this use; needs a marker + reason). 714's total was 45; 716's generalization added 15.

**Re-derive the per-class split yourself from the artifact (I1).** This kickoff deliberately does not quote the
N1/artifact counts — four prior kickoffs in this sprint sequence shipped a number the executor had to correct.

The six files, and their owning tasks:

| File | Owning task |
|---|---|
| `src/components/layout/FooterView.module.css` | 673 |
| `src/components/layout/HeaderView.module.css` | 706 |
| `src/components/layout/MobileBottomNavView.module.css` | 713 |
| `src/modules/listings/components/FeaturedListingsView.module.css` | 707 |
| `src/modules/listings/components/LatestListingsView.module.css` | 707 |
| `src/modules/locations/components/PopularLocationsView.module.css` | 688 |

### 3.2 What the flip is, mechanically

`scripts/check-design-tokens.mjs:262`:

```js
export const REPORT_ONLY_CATEGORIES = new Set(['css-length', 'css-duration', 'css-zindex']);
```

`:744-747` partitions findings into `cssDeclFindings` (report-only) and `regularFindings` (blocking) using that
set. **Emptying the set is the flip.** Nothing else needs to change: `npm run check:design-tokens` already runs
`--strict` (`package.json:66`) and CI already runs `check:design-tokens:strict` (`governance-pr.yml:97`).

### 3.3 The nav-label `10px` — a restoration, not a decision

The Task 714 review and Sprint 52's plan file both framed this as an owner decision. **Read against history, it is
not.** `git show 8199a5aae^:src/components/layout/MobileBottomNavView.tsx` carries these markers verbatim:

```
:56   // design-tokens-allow: text-[10px] — primary MobileBottomNav FAB label; interactive/mobile-critical nav text (MobileBottomNav protection)
:92   // design-tokens-allow: text-[10px] — primary MobileBottomNav nav item label; interactive/mobile-critical nav text (MobileBottomNav protection)
:101  // design-tokens-allow: text-[10px] — primary MobileBottomNav nav item label; interactive/mobile-critical nav text (MobileBottomNav protection)
```

So the owner-accepted position, from before Task 713, was: **this 10px is a deliberate, reasoned exception that is
explicitly not tokenized.** That is *consistent* with `docs/design-system.md:605`, which says `--text-2xs`
(`0.625rem` = 10px) is "**micro-label only** … Do NOT use for primary copy, form labels, button labels, filter
chips, **or nav labels**." A token exists at the value; §22.2 forbids it for this use; the marker records why.

**Therefore:** classify these three as `COMPILED-ARTIFACT`, and reuse the original reason text, adapted to the CSS
site. Do **not** substitute `var(--text-2xs)`. Do **not** stop for an owner decision — none is open.

### 3.4 The zero-visual-delta comparator — measured

Enumerated from `.screenshots/rendered-assert/2026-08-05T19-49/manifest.json` (Task 716's run) on 2026-08-06:

| Story ID prefix | Cells |
|---|---:|
| `mantine-primitives-footerview` | 16 |
| `mantine-primitives-headerview` | 16 |
| `mantine-primitives-headeractions` | 16 |
| `mantine-primitives-mobilebottomnavview` | 32 |
| `mantine-primitives-popularlocationsview` | 56 |
| `patterns-mantine-pageheaderwithactions` | 16 |
| `patterns-mantine-responsiveactionfooter` | 16 |
| **Total** | **168** of 1184 |

**This comparator has demonstrably failed** — the same md5 method caught 20 regressed herosearch cells in Task 709
and passed for 709-R, 712 and 713. D32 is discharged by history; you do not need to plant a visual failure.

### 3.5 Two edited files have NO rendered coverage — state it, do not paper over it

`FeaturedListingsView.module.css` and `LatestListingsView.module.css` (both Task 707) have **no story in the
`--mantine-only` matrix** — their stories are titled outside the `Mantine/Primitives/` and `Patterns/Mantine/`
prefixes the scope reads. So the 168-cell comparator **cannot** prove zero delta for those two files.

**Required substitute (R6):** for every edit in those two files, verify the substitution numerically — quote the
literal, the token, and the token's §22 value, and show they are equal. A token-value table is the proof there;
pixels are the proof everywhere else. Do not claim rendered coverage you do not have.

### 3.6 The path-level allowlist is broader than its reason — record, do not change

`scripts/design-tokens-allowlist.json:2` allowlists the whole `src/design-system/mantine` directory, with the
reason "*Mantine v9 design-system directory — theme.ts requires raw hex colors and rem/px values as createTheme()
inputs*". That reason is about `theme.ts`, but the entry short-circuits **every** file in the directory —
`scanContent`'s first line is `if (isAllowlisted(relPath, allowlist)) return [];`. `MantineListingCardPattern.module.css`
is therefore exempt from token enforcement entirely, and was never in either census.

**Out of scope here** (narrowing it changes what the gate sees across a whole library, on the same commit that
makes it blocking). **Register it as 717** — R7.

### 3.7 Worktree state

716's five paths are committed. **Take your own pre-write `git status --porcelain` snapshot before your first
edit.** If it is not empty, complete `docs/orchestrator-dirty-worktree-manifest-template.md` for every entry.

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | §3.1 | Every `N1-VIOLATION` item consumes its §22 token. Each substitution is justified by the token's documented value, quoted. | P0 | AC1 | Confirmed |
| R2 | §3.1 | Every `COMPILED-ARTIFACT` item carries a same-line `design-tokens-allow` marker with a non-empty reason. | P0 | AC2 | Confirmed |
| R3 | §3.3 | The three MobileBottomNav `10px` nav-label sites are marked, **not** tokenized, reusing the original pre-713 reason. | P0 | AC3 | Confirmed |
| R4 | §3.2 | `REPORT_ONLY_CATEGORIES` is emptied; the three categories block. `npm run check:design-tokens` exits **0** on the remediated tree. | P0 | AC4 | Confirmed |
| R5 | §3.2, D32 | **Planted-violation proof of the flip:** a raw literal added to a scanned `.css` makes the gate exit **non-zero**, and removing it restores exit 0. Both arms. | P0 | AC5 | Confirmed |
| R6 | §3.4, §3.5 | **Zero visual delta.** All **168** cells md5-identical to `2026-08-05T19-49`, or every difference enumerated with a measured cause. For the two uncovered files, a numeric literal→token equality table instead. | P0 | AC6 | Confirmed |
| R7 | §3.6 | **717** registered for the over-broad `src/design-system/mantine` path allowlist. | P1 | AC7 | Confirmed |
| R8 | scope | Zero diff in `scripts/check-design-tokens.mjs` **except** the `REPORT_ONLY_CATEGORIES` line; zero diff in every detection pattern, `package.json`, `governance-pr.yml`, and `check-stories-rendered.mjs`. | P0 | AC8 | Confirmed |
| R9 | 716 | All **67** detector tests still pass. Add an arm asserting the categories now block. | P0 | AC9 | Confirmed |
| R10 | agent-contract cl. 9 | `npm run build` exits 0, transcript persisted with the exit code **inside** the file. | P0 | AC10 | Confirmed |
| R11 | cl. 14, N6 | Counting gates run **last, after scratch cleanup**, numbers **reconcile to `git status`**. | P1 | AC11 | Confirmed |
| R12 | §3.1 | `docs/design-system.md` §23.6 records that the categories are now blocking, and the inventory is closed. | P1 | AC12 | Confirmed |

---

## 5. Assumptions and open questions

- **A1 — a token whose name fits is not automatically a token whose value fits.** `--space-6` is `1.5rem`;
  `--text-sm` is `0.875rem` with a *paired* `--text-sm--line-height`. **Quote the §22 value for every substitution
  and show it equals the literal you removed.** A near-miss substitution is a visual regression that the 168-cell
  comparator will catch in five of six files — and will **not** catch in the other two (§3.5).
- **A2 — a paired line-height is part of the token.** §22.2's font-size tokens each name a line-height partner.
  If you replace `font-size: 0.875rem` with `var(--text-sm)` and the file also sets `line-height: 1.25rem`, decide
  and document whether the pair moves together. Getting one and not the other is a silent typography change.
- **A3 — `COMPILED-ARTIFACT` is a judgment, and 716 recorded its reasoning.** Re-read the inventory's classification
  key before trusting a row. If you disagree with a classification, **say so and justify it** rather than silently
  re-classifying — the split is what 715 is being measured against.
- **A4 — the flip makes every future raw literal blocking, including in files this task does not touch.** After
  R4, any `.css` under `src/` outside the path allowlist that gains a raw literal fails CI. Confirm the remediated
  tree is genuinely at zero before flipping, or CI goes red on the next unrelated PR.
- **A5 — markers must survive the flip.** A `COMPILED-ARTIFACT` marker suppresses only if its rawValue matches the
  detected text **byte-for-byte** (716 §23.6.a). Determine each string from the tool's own output, never by guessing.

### 5.1 Naming — decided, do not re-litigate

No new file, script, npm script or category. No task number in any identifier (Task 701 F2).

### 5.2 Rejected alternatives — do not re-open

- **Tokenize the nav-label `10px` with `--text-2xs`.** Rejected by §3.3 — `design-system.md:605` forbids that token
  for nav labels, and the pre-713 marker records the exception as deliberate.
- **Flip first, remediate later.** Rejected: CI would be red for the whole remediation.
- **Narrow the `src/design-system/mantine` allowlist here.** Rejected by §3.6 — its own blast radius, on the same
  commit that makes the gate blocking. **717.**
- **Skip the rendered comparator because "it's only CSS variables".** Rejected: substituting a token for a literal
  is exactly where a value mismatch hides, and D28 requires proof, not confidence.

---

## 6. Pre-read rule bundle

**Always required:** `docs/agent-contract.md` (cl. 1, 9, 14, 16) · `docs/rule-index.md` · `docs/qa-profiles.md` ·
`docs/backlog.md`.

**Because this remediates tokens:** `docs/design-system.md` **§22** in full (the token tables you substitute from —
especially **§22.2**'s font-size/line-height pairs and its `--text-2xs` prohibition at `:605`) and **§23.5–23.6**.

**Because this touches `--mantine-only` stories:** `docs/storybook-governance.md` **§14.9**, **§14.9.24** (712's
md5-comparator precedent), **§14.9.26**.

**Task-specific — read, and note which you may not edit:**

- `.screenshots/task716-evidence/task716-css-declaration-inventory.md` — the work list.
- `scripts/check-design-tokens.mjs` **`:262`** (the flip) and **`:744-747`** (the partition). **Edit `:262` only.**
- The six `.module.css` files in §3.1.
- `git show 8199a5aae^:src/components/layout/MobileBottomNavView.tsx` **`:56`, `:92`, `:101`** — the original
  marker reasons R3 restores.
- `scripts/design-tokens-allowlist.json` **`:2`** — read for R7. **Do not edit.**

---

## 7. Scope

- Six `.module.css` files (§3.1) — remediation only.
- `scripts/check-design-tokens.mjs` — **the `REPORT_ONLY_CATEGORIES` line only.**
- `scripts/__tests__/check-design-tokens.test.ts` — one added arm (R9).
- `docs/design-system.md` §23.6 — R12.
- `docs/backlog.md` — concise state + register **717** (R7).
- `docs/sessions/2026-08-0X-task715-design-tokens-strict-flip-and-remediation.md`.

## 8. Out of scope

- **Every detection pattern** in `check-design-tokens.mjs` — 714/716 own them. **Zero diff.**
- **`scripts/design-tokens-allowlist.json`** — **717**. **Zero diff.**
- **`package.json`, `governance-pr.yml`, `check-stories-rendered.mjs`** — already correct. **Zero diff.**
- `MantineListingCardPattern.module.css` — path-allowlisted, never in the census (§3.6).
- Any restyle, spacing, typography or colour change — **D28**.

---

## 9. Current and required behavior

**Current:** 714 and 716 made raw length/duration/z-index literals in CSS visible, report-only. 60 sit across six
modules — some are N1 violations that should consume an existing token, some are compiled artifacts needing a
marker. Three of them are nav-label `10px` values whose original suppression was lost when Task 713 moved them into
syntax the detector could not read. `npm run check:design-tokens` exits 0 while reporting all 60.

**Required after:** every item is either tokenized or marked with a reason; the three nav-label values carry their
original justification again; the categories block; a planted raw literal fails CI; and the 168 rendered cells that
cover the edited files are md5-identical, with a numeric equality table standing in for the two files no story covers.

### Implementation sequence

- **I1 — Baseline.** `git status --porcelain`. Persist the current `check:design-tokens` output (exit 0, 60
  findings) and the 67-test pass. **Re-derive the N1/artifact split from the inventory yourself** and state it.
- **I2 — Remediate `N1-VIOLATION` items**, quoting the §22 token value for each (A1/A2).
- **I3 — Mark `COMPILED-ARTIFACT` items**, rawValue strings taken from the tool's output (A5). Restore R3's three
  from history verbatim.
- **I4 — Confirm zero findings** *before* flipping (A4): the report-only section must be empty.
- **I5 — Flip** `REPORT_ONLY_CATEGORIES` to empty. Confirm exit 0.
- **I6 — Planted proof (R5).** Add one raw literal to a scanned `.css`, confirm **non-zero exit**, remove it,
  confirm exit 0. **Capture both unpiped** (Task 710 R10). Never leave the plant in the tree.
- **I7 — The 168-cell comparator (R6).** `npm run screenshots:assert -- --mantine-only`, recompute against
  `2026-08-05T19-49`. Then `npm run check:assertion-liveness` — expect `3 LIVE / 2 DEAD-KNOWN / 0 / 0`, exit 0.
- **I8 — Docs, session log, backlog** (R7/R12); register 717.
- **I9 — Counting gates last, after deleting every scratch file**, so the numbers reconcile.

---

## 10. Implementation requirements

1. **Quote the token's §22 value for every substitution** (A1). "It looked right" is not evidence.
2. **A marker's rawValue comes from the tool, never a guess** (A5).
3. **Zero findings before the flip** (A4) — otherwise CI goes red on the next unrelated PR.
4. **The plant is removed before the final gates run** (I6). Verify with `git status`.
5. **D28: zero visual delta.** If a cell moves, that is a finding to report, never a baseline to rewrite.
6. **Capture every transcript unpiped** (Task 710 R10).
7. **No task number** in any identifier (Task 701 F2).
8. **Counting gates LAST, after scratch cleanup, reconciled to `git status`** — 714 and 716 both did this exactly;
   **a regression is a `P1`.**

---

## 11. Positive and negative flows

**Positive flow:** all 60 items tokenized or marked; report-only section empty; categories flipped; planted literal
fails and its removal restores exit 0; 168/168 md5s hold; the two uncovered files proven by token-value equality;
67 + 1 tests pass; build exits 0.

| Branch | Applicable? | Owner / source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Token value ≠ the literal it replaces | **Yes** | A1/R1 | caught by the §22 quote **and** the comparator; do not substitute | AC1, AC6 |
| Substitution in a file with no story coverage | **Yes** | §3.5/R6 | numeric equality table, and say plainly that pixels do not cover it | AC6 |
| Font-size replaced without its paired line-height | **Yes** | A2 | decide and document; do not split a pair silently | AC1 |
| A marker's rawValue mismatches | **Yes** | A5/R2 | `stale-marker`, gate fails — must not survive to the flip | AC2 |
| A `COMPILED-ARTIFACT` classification looks wrong | **Yes** | A3 | say so and justify; do not silently re-classify | AC2 |
| Findings remain when the flip happens | **Yes** | A4/R4 | must not — I4 gates I5 | AC4 |
| The plant is left in the tree | **Yes** | I6 | `git status` must be clean of it before I9 | AC5 |
| A rendered cell moves | **Yes** | R6 | enumerate with story ID, locale, viewport and measured cause | AC6 |
| An assertion dies from this change | **Yes** | I7 | `check:assertion-liveness` returns `DEAD-NEW`, exit 1 → stop and report | AC6 |
| Locale expansion | **Yes** | 4 locales are in the 168 cells | covered by the comparator | AC6 |
| RLS / authorization | **No** | CSS values and a build-time script; no data access | N/A | — |

---

## 12. Acceptance criteria

- **AC1 [R1]** Given every `N1-VIOLATION` item, then each is replaced by its §22 token, and the session log shows a
  table of literal → token → **the token's documented §22 value**, with each pair equal. State the A2 decision.
- **AC2 [R2]** Given every `COMPILED-ARTIFACT` item, then each carries a same-line marker with a non-empty reason,
  and `check:design-tokens` reports **0 stale-markers / 0 missing-reason**. Quote the marker strings.
- **AC3 [R3]** Given `MobileBottomNavView.module.css`, then the three nav-label `10px` sites are **marked**, not
  tokenized, with the original pre-713 reason. Quote both the historical marker and the new one.
- **AC4 [R4]** Given the remediated tree, then `REPORT_ONLY_CATEGORIES` is empty and `npm run check:design-tokens`
  **exits 0** with no report-only section remaining. Persist the transcript, exit code inside it.
- **AC5 [R5]** Given one raw literal planted in a scanned `.css`, then the gate **exits non-zero** naming it; given
  its removal, then exit 0. Show **both** transcripts, and `git status` proving the plant is gone.
- **AC6 [R6]** Given `npm run screenshots:assert -- --mantine-only` and a recompute of the **168** cells against
  `2026-08-05T19-49`, then 168/168 match or every mismatch is enumerated with a measured cause; and for
  `FeaturedListingsView.module.css` / `LatestListingsView.module.css`, a numeric equality table, with the absence
  of rendered coverage stated plainly.
- **AC7 [R7]** Given `docs/backlog.md`, then **717** is registered for the over-broad `src/design-system/mantine`
  path allowlist, quoting its current reason and why it is broader than that reason.
- **AC8 [R8]** Given `git diff` on `check-design-tokens.mjs`, then the **only** change is the
  `REPORT_ONLY_CATEGORIES` line; and `package.json`, `governance-pr.yml`, `check-stories-rendered.mjs`,
  `design-tokens-allowlist.json` are **empty**. Verify by hash.
- **AC9 [R9]** Given the detector suite, then **67 + 1** pass, the added arm asserting the categories block.
- **AC10 [R10]** Given the final state, `npm run build` exits **0**, transcript at a stated path with the exit code
  inside it.
- **AC11 [R11]** Given the counting gates run **last and after scratch cleanup**, then both pass and their numbers
  **reconcile to `git status`**. State the reconciliation.
- **AC12 [R12]** Given `docs/design-system.md` §23.6, then it records the categories as blocking and the inventory
  as closed.

---

## 13. QA profile and verification plan

**Profile: `Q4` Release/Critical Flow.** Two independent Q4 triggers: a CI-blocking gate changes enforcement mode,
and `src/` UI files owned by five closed tasks are edited under D28. Q4 compels the planted-violation proof (R5)
**and** the rendered comparator (R6). A green gate run is explicitly **not** sufficient.

| # | Command / step | Expected |
|---:|---|---|
| 1 | `git status --porcelain` (I1) | empty, or a completed dirty-worktree manifest |
| 2 | `npm run check:design-tokens` (I1) | exit 0, 60 findings — persisted |
| 3 | `npx vitest run scripts/__tests__/check-design-tokens.test.ts` (I1) | **67 passed** |
| 4 | Re-derive the N1/artifact split (I1) | stated in the log |
| 5 | Remediate (I2/I3) | every item tokenized or marked |
| 6 | `npm run check:design-tokens` (I4) | **0 findings**, report-only section empty |
| 7 | Flip + re-run (I5) | exit 0, categories blocking |
| 8 | **Planted literal** (I6) | **non-zero exit**; removal → exit 0; plant gone from `git status` |
| 9 | `npm run screenshots:assert -- --mantine-only` (I7) | exit 0, manifest written |
| 10 | 168-cell md5 recompute vs `2026-08-05T19-49` | 168/168, or every diff enumerated |
| 11 | `npm run check:assertion-liveness` | `3 LIVE / 2 DEAD-KNOWN / 0 / 0`, exit 0 |
| 12 | `npm run check:stories` · `npx tsc --noEmit` | unchanged pass · 0 errors |
| 13 | **`npm run build`** | **exit 0 — hard gate** |
| 14 | `check:file-integrity` · `check:mojibake` — **last, after cleanup** | pass; reconcile to `git status` |

A failed or unrun step 13 permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`. `tsc=0` is not a substitute.
Evidence under `.screenshots/task715-evidence/` (local-only, **D6**). **Name every artifact.** **Do not modify or
delete `.screenshots/rendered-assert/2026-08-05T19-49/`** — it is 716's evidence and this task's baseline.

---

## 14. Completion report contract

Write `docs/sessions/2026-08-0X-task715-design-tokens-strict-flip-and-remediation.md` containing:

1. **Files changed** — table matching the real `git diff --stat`, reconciled to your pre-write snapshot.
2. **Requirement IDs completed** — R1–R12, each with its AC verdict.
3. **The N1/artifact split you derived**, and any classification you disagreed with (A3), justified.
4. **The full substitution table** — literal → token → §22 value, per file, with the A2 line-height decision.
5. **Every marker string added**, including the three restored from history with the original quoted beside it.
6. **The flip's two arms** — planted literal failing, removal restoring exit 0, and `git status` proving cleanup.
7. **The 168-cell result** — 168/168, or every mismatch with story ID, locale, viewport and cause.
8. **The two uncovered files** — the numeric equality table, and the limitation stated plainly.
9. **Commands run and actual results** — real exit codes, including the step-13 build transcript.
10. **Evidence locations** — every artifact, named.
11. **A real counting-gates section** with the numbers **and their reconciliation to `git status`**.
12. **Standing findings not acted on** — 717 (the path allowlist), 711, 702/691 (Sprint 46).
13. **Assumptions, deviations, limitations, unresolved issues.**
14. Concise current state in `docs/backlog.md` — **state only**, plus 717. The file is at **84** lines against an
    ~80 target; **do not add net lines**, and flag a `BACKLOG LIMIT BREACH` if you cannot hold it.

**Status must be `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`.** Never
self-approve, never produce a `Decision`/`Confidence`/`Blocking findings` section, and never run, emit, suggest, or
delegate any mutating git command, including any form of `git push`.

---

## 15. Task quality gate

| Check | Status |
|---|---|
| A fresh Sonnet session can execute this with no hidden chat context | ✅ inventory path, six files with owning tasks, the exact flip line (`:262`), the partition (`:744-747`), the 168-cell table, the historical marker commit-ish, and every command are named |
| Every primary requirement has a binary AC and a verification method | ✅ R1–R12 → AC1–AC12 → §13 steps 1–14 |
| Scope protects existing behavior and names what must not change | ✅ §8 plus hash-verified AC8 restricting `check-design-tokens.mjs` to **one line**, and §5.2's four rejected alternatives |
| **The claimed owner decision was tested, not inherited** | ✅ §3.3 — I asserted twice that `--text-2xs` vs §22.2 was a blocking owner decision; reading `8199a5aae^` shows the exception was already owner-accepted with a written reason, so this is a **restoration**. The kickoff records my error and removes the block |
| No number is asserted that was not measured with the real tool | ✅ the 168 cells enumerated from the real manifest; the flip line and partition read in source; §22.2's `--text-2xs` prohibition quoted verbatim from `:605`; **and the N1/artifact split is deliberately left for the executor to re-derive** (I1/§3.1) rather than quoted from a summary |
| The gate proves the changed behavior, not merely procedure | ✅ R5 is a genuine two-armed plant on the flip itself; R6's comparator demonstrably failed for Task 709; a green run is declared insufficient in §13 |
| Coverage gaps stated rather than papered over | ✅ §3.5 names the two files no story covers and supplies a substitute proof; §3.6 names the path allowlist that hides a whole library |
| Zero/empty input covered | ✅ I4 requires the finding set to be **empty** before the flip, and A4 explains what a non-empty set would do to CI |
| Every checkpoint names producer, output, comparator, failure behavior | ✅ §13 + I4 gating I5 + I6's plant-and-remove + I7's `DEAD-NEW` stop + I9's cleanup-then-count |
| Owner exceptions have traceable authorization | ✅ the `10px` exception is quoted from the pre-713 source with its original reason; D6, D28, D32 cited with sources |
| Exactly one active executable route | ✅ §3.3 removes the only claimed blocker; §5.1 fixes naming; §5.2 closes four alternatives |
| Prior-review corrections folded in | ✅ 714 **F1/F2** (closed by 716) · 713 **F3** → 714/716 **AC11** (§10.8 makes a regression a `P1`) · 712 **F3** (state what the evidence does *not* cover → §3.5) · 710 **R10** (unpiped capture) · **701 F2** (no task numbers) · and the sprint-wide lesson: **do not quote a count I did not measure with the real tool** |
| Sprint assigned before creation | ✅ Sprint 52, already open; this closes its design-token half |

**Remaining ambiguous or conflicting requirements: none.**
**Owner decisions still needed: none.** The `--text-2xs` question I twice called blocking is resolved by §3.3 as a
restoration of an existing, reasoned exception. Whether §22.2 should eventually offer a nav-label micro-token is a
separate Epic JJ question, and is **not** a precondition for this task.
