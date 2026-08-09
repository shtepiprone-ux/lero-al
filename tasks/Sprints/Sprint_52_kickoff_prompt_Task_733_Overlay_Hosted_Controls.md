# Task 733 — Stop discarding every form control inside an overlay

**Sprint 52 — Gates that stopped checking, position 52.5.**
**Status:** `KICKOFF FILED`. **QA profile:** `Q4` Release/Critical Flow.
**Companions:** `Sprint_52_Task_733_execution_contract.md` · `Sprint_52_Task_733_rule_compliance_ledger.md`.

> The evidence for this task is unusually clean: in the **same cells**, the sibling assertion measures buttons and
> catches a real defect, while this one throws every candidate away. Both skips are uncommented.

---

## 1. Mode and task type

**Mode:** implementation. **Type:** verification-gate correctness (non-product script) + governance record. No
`src/` change expected — but see §7.4: a newly-surfaced failure is escalated, never fixed here.

Sonnet executes via `execute-task` and reports `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`,
`PARTIALLY IMPLEMENTED`, or `BLOCKED`. Never self-approve.

---

## 2. Objective

`fullWidthControlsAtMobile` discards every candidate inside `[role="dialog"]`. At `<640` that is the one surface
where full width is not a preference but the layout contract. Decide what the skip should be, prove the decision
against the rendered DOM, and let the assertion see what it has never seen.

---

## 3. Verified context — measured from the repository 2026-08-09

### 3.1 The two skips, verbatim and uncommented

`scripts/check-stories-rendered.mjs`, inside assertion (b):

- `:1159` — arm 1: `if (el.closest('[role="dialog"]')) continue;` before `checkedAny = true`
- `:1175` — arm 3: `if (inp.closest('[role="dialog"]')) continue;`

Neither carries a comment. Every other exemption in this file names a Task and a reason — `isChipSetMember`, the
711 re-anchors, 722's `checkedAny`. These two do not, so **nothing records what they were protecting against.**

### 3.2 The hole, in cells

From the current manifest (`2026-08-08T12-27`, the run Task 722 shipped against):

| Measure | Cells |
|---|---:|
| Applicable mobile cells (`<640`) | 852 |
| …of which host an **open dialog** (`popupBottomSheetAtMobile` resolves) | **156** |
| …of those, `fullWidthControlsAtMobile` is `null` — nothing measured | **120** |

**10 stories, 12 cells each** (4 locales × 3 mobile widths): `Drawer/Default`, `DropdownMenu/Default`,
`FiltersPanelShell/Default`, `MobileNavDrawer/Default`, `Modal/Default`, `NavigationMenu/Default`,
`NotificationBellView/Default`, `Popover/Default`, `Tooltip/Default`, `Patterns/Mantine/DialogDrawerPattern/Default`.

That is every overlay primitive in the library, and it includes the story covering
`docs/critical-flow-registry.md:50` (the listings filter shell).

### 3.3 The sibling assertion already measures the same DOM — and catches a real defect there

In those **same 156 dialog-hosting cells**, `fullWidthButtonsAtMobile` (assertion (d)) has **no dialog skip at all**
and measures **120** of them. It currently reports **4 genuine failures** inside an overlay:

```
NotificationBellView/Default × sq × mobile-390 — ["Shëno të gjitha si të lexuara"]
NotificationBellView/Default × en × mobile-390 — ["Mark all as read"]
NotificationBellView/Default × uk × mobile-390 — ["Позначити всі як прочитані"]
NotificationBellView/Default × it × mobile-390 — ["Segna tutte come lette"]
```

Those are 4 of the 16 pre-existing FAILs. **So measuring inside an overlay is already done, already productive, and
already shipping findings — by the assertion 30 lines further down the same function.** Two sibling assertions, one
viewport rule, opposite policies, and no comment explaining the split.

### 3.4 Why `<640` makes the comparison meaningful

Task 711's live census established that every Mantine-scope overlay at `<640` — Modal, Drawer, Popover,
DropdownMenu, Select, NavigationMenu, `DialogDrawerPattern` — funnels through the one shared
`ResponsiveBottomSheet` (`responsiveBottomSheet.tsx:126`, hardcoded `position="bottom"`), and converges on the same
DOM shape `.mantine-Drawer-content[role="dialog"]`. `popupBottomSheetAtMobile` asserts exactly that, and resolves
`true` on all 156 cells.

A bottom sheet is full-bleed by construction, so a control's parent-content-width comparison inside it is at least
as meaningful as outside. **Do not take this as the answer** — §7.2 requires you to measure it, because `Popover`
and `Tooltip` are in the blind list and a legitimately narrow overlay would be the counterexample that changes the
design.

---

## 4. Requirements — one active route

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | §3.2 | The 156/120/852 census is re-derived from a fresh manifest and reconciled against this kickoff | P0 | Persisted census | Confirmed |
| R2 | §3.4 | A live DOM census records, per blind story, what the overlay actually is at `<640` — bottom sheet or not — and each candidate control's geometry relative to its parent | P0 | Dump artifact | Confirmed |
| R3 | §3.1 | The skip is replaced by a condition the gate **evaluates** — never a role, attribute or class an author can apply | P0 | Diff + reason comment | Confirmed |
| R4 | §3.1 | Whatever survives carries a comment naming this task, the census, and the date, matching the file's own convention | P0 | Diff | Confirmed |
| R5 | Two-armed plant | A control that is not full-width inside an open overlay resolves `false`; removing the plant restores the prior value | P0 | Two transcripts | Confirmed |
| R6 | 726 R5 rule | Any probe is reverted byte-identical, evidenced by `git hash-object` and absence from `git status --porcelain` | P0 | Hash + status | Confirmed |
| R7 | 724 lesson | Every newly-`false` cell is named, attributed and **escalated**. No tolerance, skip or allowlist is added to make one green | P0 | Session log | Confirmed |
| R8 | §3.3 | Assertion (d) is untouched — this task changes (b) only; witnessed | P0 | Diff | Confirmed |
| R9 | Standing | Final `--mantine-only` result stated against `1164/1204 PASS, 18 FAIL, 22 AMBIGUOUS`, with every moved cell attributed | P0 | Final matrix log | Confirmed |
| R10 | Standing | `check:assertion-liveness` exits 0; the LIVE-THIN ratio for this assertion is reported before and after | P1 | Transcript | Confirmed |
| R11 | Standing | `npx tsc --noEmit` exit 0, `npm run build` exit 0 | P0 | Transcripts | Confirmed |
| R12 | Standing | Counting gates last; backlog baseline read from `git show HEAD:docs/backlog.md \| wc -l` **before** the first edit and quoted | P0 | Two passes | Confirmed |

---

## 5. Assumptions and open questions

- **A1.** Dirty worktree: pre-write `git status --porcelain` snapshot, per-entry classification, before/after
  content witnesses for pre-existing modified paths.
- **A2.** §3.2's counts are a 2026-08-09 snapshot taken from the 678 baseline manifest. Re-derive; if yours differ,
  yours win and the difference is reported before any edit.
- **A3.** **Expect new failures.** 120 cells have never been measured, and the sibling assertion already fails on 4
  of the same cells. A run that surfaces zero new failures is a result to *distrust* — verify the skip actually
  came out before reporting it.
- **OQ1 — decide and record.** If the census finds an overlay class where the comparison is genuinely meaningless
  (a narrow `Tooltip` is the likely candidate), the answer may be a narrowed condition rather than removal. Either
  is acceptable; an undocumented skip is not, and neither is a condition keyed to a story or component name.

---

## 6. Pre-read rule bundle

- `CLAUDE.md` · `docs/agent-contract.md` · `docs/orchestrator-procedures.md` (git policy) · `docs/rule-index.md`
- `docs/qa-profiles.md` — the `Q4` row · `docs/critical-flow-registry.md:50`
- `scripts/check-stories-rendered.mjs` — `:1112-1185` (assertion (b), both skips), `:1190-1250` (assertion (d), the
  sibling with no skip), `:1300-1345` (`popupBottomSheetAtMobile` and 711's convergence census)
- `src/design-system/mantine/patterns/responsiveBottomSheet.tsx` — the shared `position="bottom"` path
- `docs/storybook-governance.md` — §14.9.28, §14.9.30
- `docs/sessions/2026-08-06-task711-reanchor-dead-mantine-assertions.md` — the census method
- `docs/sessions/2026-08-08-task722-fullwidth-controls-vacuous-assertion.md` — how this hole became visible

---

## 7. Scope

### 7.1 R1 — re-derive before editing

Reproduce §3.2 from a fresh manifest. This is the D32 comparator: a cell you cannot show is currently unmeasured
may not be claimed as newly covered.

### 7.2 R2 — census the overlays, do not reason about them

Open each of the 10 blind stories at 375px, dump the overlay's rendered shape and each candidate control's
`offsetWidth` against its parent's content width. The question the dump must answer: **is there any overlay class
where the comparison is meaningless?** §3.4 gives the expected answer and explicitly does not authorise it.

### 7.3 R3/R4 — the replacement is derived, not prescribed

**This kickoff does not say what the condition should be.** It says what it must satisfy: evaluated by the gate,
not applied by an author (724 F1, closed by 726); justified by R2's dump; and commented in the file the way every
other exemption there is. Removal with a recorded reason is a valid outcome.

### 7.4 R5/R7 — prove it, then escalate what it finds

Plant a narrowed control inside an open overlay in an **inspected existing** story; it must resolve `false` and
name the control. Remove it. Then, for every cell that newly reports `false` without a plant: name it, attribute
it, and escalate it under a reserved number. **Do not fix a product component in this task** — `NotificationBellView`
already demonstrates that overlay-hosted layout defects are real, and they are their own work.

---

## 8. Out of scope

Assertion (d) and its `isChipSetMember` (R8) · `MANTINE_VIEWPORTS` and the story manifest (678 closed; enrolment is
done) · the 18 pre-existing FAILs, including the 4 `NotificationBellView` cells this task will now sit beside ·
fixing any product component · `check-locale-leak` findings (**736**) · 727 (parked on OQ2/OQ3).

---

## 9. Current and required behavior

**Current.** 120 of 852 applicable cells resolve `null` for `fullWidthControlsAtMobile` because two uncommented
lines discard every candidate inside a dialog — while the assertion 30 lines below measures the same cells and
fails on 4 of them.

**Required.** The skip is either gone or narrowed to a condition the gate evaluates and a comment explains. The
blind-cell count is stated before and after. Every newly-failing cell is named and escalated, and assertion (d) is
byte-identical.

---

## 10. Implementation requirements

1. Only assertion (b) changes. Assertion (d), `isChipSetMember`, `FULL_WIDTH_TOLERANCE` and `MANTINE_VIEWPORTS` are witnessed unchanged.
2. Any surviving condition is evaluated from measured DOM, never from a role, class, attribute or name a component author supplies.
3. The comment names Task 733, the census artifact and the date — the convention `:1148-1150` and 722's own comment already follow.
4. A newly-`false` cell is a **finding**. Name it, attribute it, escalate it. No tolerance, skip, allowlist or exemption to turn it green.
5. `failingControlLabels` must name overlay-hosted failures the same way assertion (d) names its buttons — a `false` cell has to be diagnosable from the log without a re-run.

---

## 11. Positive and negative flows

**Positive.** A full-width input inside an open bottom sheet resolves `true`; a narrowed one resolves `false` and is
named; a cell with no control still resolves `null`; the blind-cell count drops from 120 by a number this task states.

| Negative flow | Applicable | Why |
|---|---|---|
| The skip is removed and nothing changes | **Yes** | A3 — distrust a zero-delta result; verify the edit took effect |
| New failures are suppressed to keep the matrix green | **Yes** | R7; the 724 defect this sprint exists to end |
| The replacement keys on an author-appliable property | **Yes** | 724 F1, closed by 726 — the exact regression to avoid |
| A narrow overlay (Tooltip) produces meaningless comparisons | **Yes** | OQ1 — the counterexample that would justify narrowing |
| 722's `checkedAny` is broken while editing the same block | **Yes** | A cell with no control must still resolve `null`, not `true` |
| Assertion (d) edited "while we're in there" | **Yes** | R8 |
| Locale / i18n regression | No | No `messages/*` change; parity still run as a guard |
| Visual / layout regression | No | No `src/` change; the matrix is the witness |

---

## 12. Acceptance criteria

- **AC1 [R1]** Given a fresh manifest, then the 852 / 156 / 120 figures are re-derived and reconciled before any edit.
- **AC2 [R2]** Given the census dump, then each of the 10 blind stories has its overlay shape and candidate geometry recorded, and the "is any class meaningless?" question is answered from it.
- **AC3 [R3, R4]** Given the diff, then no author-appliable property gates the assertion, and whatever survives carries a comment naming this task, the census and the date.
- **AC4 [R5]** Given the planted narrow control inside an open overlay, then that cell resolves `false` and the console names the control.
- **AC5 [R6]** Given the probe removal, then the cell returns to its pre-probe value, `git hash-object` equals its pre-probe value, and the path is absent from `git status --porcelain`.
- **AC6 [R7, R9]** Given the final run, then the blind-cell count is stated before and after, every cell differing from `1164/1204 PASS, 18 FAIL, 22 AMBIGUOUS` is named and attributed, and no cell was made green by a new exemption.
- **AC7 [R8]** Given whole-file comparison, then assertion (d), `isChipSetMember`, `FULL_WIDTH_TOLERANCE` and `MANTINE_VIEWPORTS` read unchanged.
- **AC8 [R10]** Given `check:assertion-liveness`, then it exits 0 and this assertion's LIVE-THIN ratio is reported before and after.
- **AC9 [R11]** `tsc` exit 0 and `npm run build` exit 0.
- **AC10 [R12]** Two counting passes, the second after the session log and backlog row exist; the backlog baseline is quoted from `git show HEAD:docs/backlog.md | wc -l`.

---

## 13. QA profile and verification plan

**Profile: `Q4` Release/Critical Flow.** A hard-blocking CI gate's measurement scope changes;
`critical-flow-registry.md:50` is among the newly-measured stories; the planted-violation clause is Q4-owned.

| # | Command | Expected |
|---|---|---|
| 1 | `git status --porcelain` + `git show HEAD:docs/backlog.md \| wc -l` | A1 manifest + R12 baseline |
| 2 | `npm run build-storybook` + `npm run screenshots:assert -- --mantine-only` | Baseline + R1 census |
| 3 | Overlay DOM census at 375px across the 10 stories | AC2 |
| 4 | Apply plant · rebuild · re-run | AC4 |
| 5 | Remove plant · `git hash-object` · `git status --porcelain` | AC5 |
| 6 | `npm run build-storybook` + `screenshots:assert -- --mantine-only` (final, probe-free) | AC6 vs `1164/1204` |
| 7 | `npm run check:assertion-liveness` | AC8 |
| 8 | `npx tsc --noEmit` · `npm run check:i18n` | exit 0 |
| 9 | `npm run build` | **exit 0, mandatory** |
| 10 | `check:file-integrity` + `check:mojibake`, twice | AC10 |

A failed or unrun step 9 permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`.

---

## 14. Completion report contract

Report: changed files with reasons · R1–R12 each with its evidence artifact · every command with its **actual**
result and exit code · evidence root (`.screenshots/task733-evidence/`, local-only per D6) · assumptions,
deviations, limitations · unresolved issues. State the blind-cell count before and after as two numbers, and list
every newly-`false` cell with its attribution. Then update `docs/backlog.md` — **replacing** the "Last Session"
block, never appending — and write `docs/sessions/<date>-task733-overlay-hosted-controls.md`.

---

## 15. Task quality gate

Checked before publication: a fresh Sonnet session can execute this without chat context · every requirement has a
binary AC and a verification method · **every figure here was measured from the manifest and the source on
2026-08-09** — 852 applicable, 156 dialog-hosting, 120 blind, 10 stories, 4 real overlay failures already caught by
the sibling assertion · the replacement condition is deliberately withheld and replaced by the contract it must
satisfy · §3.4 states the expected answer and explicitly refuses to authorise it without R2's census · the
zero-delta outcome is pre-declared as *suspicious* rather than as success, because this task's whole risk is an
edit that silently does nothing · 722's `checkedAny` has its own negative-flow row, since this task edits the same
block · the backlog-baseline command is named in R12, per the corollary earned across 717, 721 and 722.
