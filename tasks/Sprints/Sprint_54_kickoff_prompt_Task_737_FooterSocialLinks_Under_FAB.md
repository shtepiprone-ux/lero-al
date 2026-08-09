# Task 737 — The footer's social links sit under the bottom-nav FAB

**Sprint 54 — Mobile bottom-nav overlay collision. Closes the sprint.**
**Status:** `KICKOFF FILED`. **QA profile:** `Q3` Full Visual Matrix.
**Companions:** `Sprint_54_Task_737_execution_contract.md` · `Sprint_54_Task_737_rule_compliance_ledger.md`.

> **Ordering is load-bearing.** Task 727's `click-shield` CI job is blocking but cannot run until the owner adds
> the Supabase repository secrets. This defect is what that job will report the moment it can run. **737 must land
> before those secrets**, or every PR blocks on it. That is the reason this task is P1.

---

## 1. Mode and task type

**Mode:** implementation. **Type:** UI layout defect on a production surface (mobile, all routes). This is the
first product change in Sprint 54 — 725 and 729 both turned out to be gate work.

Sonnet executes via `execute-task` and reports `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`,
`PARTIALLY IMPLEMENTED`, or `BLOCKED`. Never self-approve.

---

## 2. Objective

Two real links a user cannot click become clickable, and the gate that found them stops reporting them — without
disturbing the D28/D34 mechanism Task 713 landed in the component involved.

---

## 3. Verified context — read from the repository 2026-08-09

### 3.1 The defect, as the gate reports it

Task 729's widened `check:click-shield` reports **6 violations** on the base scenario, reproducible across three
independent runs: `FooterView`'s `Facebook` and `Instagram` links, permanently intercepted by
`MobileBottomNavView`, at **mobile-375**, in **sq / en / it** — **not** `uk`, **not** 320 or 390.

They are *permanent*, not transient: Task 725's phase-2 scroll-recheck could not clear them.

### 3.2 The geometry, from source and tokens

| Element | Declaration | Computed |
|---|---|---|
| `.navBar` | `position: fixed; bottom: 0; height: var(--space-14); z-index: 30` | **56px** tall, pinned to the viewport bottom |
| `.fabLink` | `margin-top: calc(var(--space-3) * -1)` | pulled **−12px** upward |
| `.fab` | `height/width: var(--space-12)`, plus a `ring-2` | **48px**, with a ~2px ring |
| `<main>` clearance | `layout.tsx:50` — `pb={{ base: 'var(--space-14)', md: 0 }}` | **56px** |

Tokens (`globals.css:154-165`): `--space-3` = 12px · `--space-12` = 48px · `--space-14` = 56px, commented
"bottom-nav height" · `--space-16` = 64px.

**Derived root cause — verify it live, do not take this arithmetic on trust.** A 48px FAB centred in a 56px bar has
4px of slack above it; `-mt-3` then lifts it 12px, so its top edge sits roughly **8px above the bar** (≈10px with
the ring). The occluded band is therefore ~**64px**, while `<main>`'s clearance is exactly **56px**.

`MobileBottomNavView.module.css`'s own A5 note says the coupling is "equal by construction, confirmed I1: bar
height 56px == `--space-14`". That is true of the **bar** and silent about the **FAB**, which deliberately
overhangs it. Task 713 built the coupling from the bar's height; nobody accounted for the overhang.

### 3.3 Why only these cells

The FAB is horizontally centred and 48px wide; the unaccounted band is ~8px tall. So the defect needs a control to
land in a small box near the footer's horizontal centre, in the last few pixels before the bar. Whether that is
locale-dependent wrapping (uk's longer strings reflowing the social row) or something else is **not established** —
§7.1 requires you to measure it rather than assume, because the explanation determines whether a clearance fix is
sufficient or merely moves the box.

### 3.4 What must not regress

- **`MobileBottomNavView` is Task 713's landed D28 work** (Sprint 50, closed). Sprint 54's own standing constraint:
  its de-Tailwind mechanism and **D34** cascade layering must survive intact — a collision fix is not a licence to
  re-hybridise the component.
- **`layout.tsx` is Task 712's landed work** (Sprint 51, closed).
- `--space-14`'s "bottom-nav height" comment is a **contract** between two files. If the clearance stops equalling
  the bar height, that comment stops being true and must be corrected in the same diff.

### 3.5 Not a registry flow

`grep -c 'FooterView\|MobileBottomNav' docs/critical-flow-registry.md` → **0**. No automated critical-flow
regression evidence is required; `Q3` applies, not `Q4`.

---

## 4. Requirements — one active route

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | §3.3 | The failing cells' geometry is measured live — what lands under the FAB, at what coordinates, and why these 6 cells and no others | P0 | Measurement artifact | Confirmed |
| R2 | §3.2 | The fix follows from R1 and is expressed in **existing tokens**; if no token or composition fits, stop at `BLOCKED — CANONICAL STYLE DECISION REQUIRED` rather than inventing a value | P0 | Diff + decision record | Confirmed |
| R3 | §3.1 | `check:click-shield`'s base scenario reports **0** violations where it reported 6, with the other scenarios unchanged | P0 | Before/after transcripts | Confirmed |
| R4 | §3.4 | `MobileBottomNavView`'s D28 mechanism and D34 `@layer utilities` wrapper are intact; `layout.tsx`'s Task 712 work is not restructured | P0 | Diff witness | Confirmed |
| R5 | §3.4 | If the clearance no longer equals the bar height, `--space-14`'s "bottom-nav height" comment and the A5 note are corrected in the same diff | P0 | Diff | Confirmed |
| R6 | UI rules | A visual source map and a canonical UI decision record exist for every changed visible artifact, with `reuse`/`extend`/`create canonical` dispositions | P0 | Session log tables | Confirmed |
| R7 | Q3 | Rendered proof at all required widths × 4 locales, including `uk@320`; the three previously-passing locales/widths are shown unchanged | P0 | Rendered evidence | Confirmed |
| R8 | Standing | No new raw value: `check:design-tokens:strict` exit 0 | P0 | Transcript | Confirmed |
| R9 | Standing | `npx tsc --noEmit` exit 0, `npm run build` exit 0, `check:i18n` exit 0 | P0 | Transcripts | Confirmed |
| R10 | Standing | `screenshots:assert -- --mantine-only` stated against `1164/1204 PASS, 18 FAIL, 22 AMBIGUOUS`, every moved cell attributed | P0 | Final matrix | Confirmed |
| R11 | Standing | Counting gates last; backlog baseline from `git show HEAD:docs/backlog.md \| wc -l` **before** the first edit, quoted | P0 | Two passes | Confirmed |

---

## 5. Assumptions and open questions

- **A1.** Dirty worktree: pre-write `git status --porcelain` snapshot, per-entry classification, before/after
  content witnesses.
- **A2.** §3.2's ~8px overhang is **arithmetic from declarations, not a measurement**. `env(safe-area-inset-bottom)`
  (`MobileBottomNavView.tsx:38`), the ring, and flex centring all affect the real number. Measure it.
- **A3.** `--space-16` (64px) happens to match the derived band, and would be a single existing token rather than a
  new one. **This is an observation, not the answer** — R1's measurement decides, and composing two tokens with
  `calc()` has **no precedent in `src/`** (grep returns zero), so choosing that route is a convention decision to
  state, not to slip in.
- **OQ1 — surface, do not decide silently.** If R1 shows the clearance is correct and the real cause is the
  footer's own layout at 375, the fix belongs in `FooterView`, not the shell — say so with evidence and re-scope
  rather than padding the shell to hide it.

---

## 6. Pre-read rule bundle

- `CLAUDE.md` · `docs/agent-contract.md` · `docs/orchestrator-procedures.md` (git policy) · `docs/rule-index.md`
- `docs/qa-profiles.md` — the `Q3` row · `docs/orchestrator-ui-task-design.md` — **mandatory**, R6 derives from it
- `docs/design-system.md` §22 (the space scale) · `docs/mantine-responsive-design-system.md`
- `src/components/layout/MobileBottomNavView.module.css` — the whole file, especially the A5 note and `.fabLink`
- `src/components/layout/FooterView.tsx` `:110-135` and `FooterView.module.css` `:110-145`
- `src/app/[locale]/layout.tsx:50`
- `scripts/check-click-shield.mjs` — how a violation is reported, so R3's before/after is read correctly
- `docs/sessions/2026-08-09-task729-below-fold-blind-spot.md` — where these 6 came from
- Binding decisions: **D28** (mechanism-only, zero visual delta — binds what 713 landed, **not** this fix) and
  **D34** (a D28 module reproduces the utility's cascade layer)

---

## 7. Scope

### 7.1 R1 — measure before deciding

At mobile-375 in sq/en/it, and at the passing cells for contrast: the FAB's rendered box, the social links' boxes,
the document-space gap between the footer's last row and the bar, and the computed clearance actually applied.
Answer **why these 6 and not uk/320/390** from the measurement. A fix chosen before this is a guess.

### 7.2 R2 — the fix, derived and tokenised

**This kickoff does not choose it.** Constraints: expressed in existing tokens (§3.2 lists them); no raw value;
no new token without the canonical-source search the UI rules require; and if nothing fits, `BLOCKED` beats a
guessed value. Whatever you choose, the canonical UI decision record names its disposition.

### 7.3 R4/R5 — protect what is landed, and keep the contract honest

Do not restructure `MobileBottomNavView` or `layout.tsx` beyond the minimum the fix needs. If the clearance stops
being "equal by construction" to the bar height, the two comments that assert it become false — fix them in the
same diff. A stale comment asserting a coupling that no longer holds is how the next task inherits a wrong premise.

### 7.4 R3 — the gate is the proof

`check:click-shield`'s base scenario is the primary acceptance evidence: **6 → 0**, with the Drawer and Modal
scenarios unchanged. This is a defect a gate found; the same gate certifies the fix.

---

## 8. Out of scope

The 40 horizontal-scroll candidates (**738**) · adding the Supabase secrets (owner action; this task is ordered
*before* it) · any other `check:click-shield` change — 729 landed three hours ago · `check-stories-rendered.mjs`
and Sprint 52's closed work · re-hybridising or restyling `MobileBottomNavView` beyond the collision fix.

---

## 9. Current and required behavior

**Current.** `<main>` clears the 56px bar. The FAB overhangs it by roughly 8px, and in 6 cells the footer's social
links fall inside that unaccounted band — permanently unclickable, invisible to every gate until 729.

**Required.** Those links are clickable in all locales and widths; `check:click-shield` reports 0 base-scenario
violations; the bar/clearance contract is either still true or corrected where it is stated; and 713's D28/D34
mechanism is untouched.

---

## 10. Implementation requirements

1. No raw length value. Existing tokens or an evidenced canonical decision.
2. `MobileBottomNavView.module.css` keeps its `@layer utilities` wrapper (**D34**) and its D28 comment provenance.
3. Any comment asserting the bar/clearance equality is corrected if the fix breaks it (R5).
4. The fix is minimal: it closes the measured gap, it does not re-space unrelated surfaces.
5. The three currently-passing locales/widths are shown unchanged, not assumed unchanged.

---

## 11. Positive and negative flows

**Positive.** At 375 in sq/en/it the social links are hit-testable; `check:click-shield` base reports 0; uk/320/390
render identically to before; no new token-gate violation.

| Negative flow | Applicable | Why |
|---|---|---|
| Clearance padded until the gate goes quiet, without measuring | **Yes** | R1 — that hides the defect rather than fixing it, and may just move the box |
| The fix re-spaces every page's bottom margin visibly | **Yes** | R7's rendered proof across all widths is what catches it |
| `MobileBottomNavView` re-hybridised or its `@layer` dropped | **Yes** | D34 + Sprint 54's standing constraint |
| A raw px value introduced | **Yes** | R8; `check:design-tokens:strict` is blocking |
| The bar/clearance comments left asserting something now false | **Yes** | R5 — the next task would inherit it as a premise |
| Fix lands after the Supabase secrets | **Yes** | Ordering — every PR would block on this defect first |
| Locale / i18n regression | No | No `messages/*` change; parity run as a guard |
| Auth / RLS / data-loss | No | Layout only |

---

## 12. Acceptance criteria

- **AC1 [R1]** Given the measurement, then the FAB box, the social-link boxes and the applied clearance are recorded for a failing cell and a passing one, and the sq/en/it-vs-uk and 375-vs-320/390 difference is explained from them.
- **AC2 [R2, R8]** Given the diff, then every new value is an existing token or an evidenced canonical decision, and `check:design-tokens:strict` exits 0.
- **AC3 [R3]** Given `check:click-shield`, then the base scenario reports **0** violations against a recorded pre-fix **6**, with Drawer and Modal scenarios unchanged.
- **AC4 [R4]** Given the diff, then `MobileBottomNavView.module.css` retains its `@layer utilities` wrapper and D28 provenance, and `layout.tsx` is otherwise unrestructured.
- **AC5 [R5]** Given the diff, then no comment asserts a bar/clearance equality that the fix has made false.
- **AC6 [R6]** Given the session log, then a visual source map and a canonical UI decision record exist for every changed visible artifact, with an explicit `reuse`/`extend`/`create canonical` disposition.
- **AC7 [R7]** Given rendered proof at the Q3 widths × 4 locales including `uk@320`, then the fixed cells changed and the previously-passing cells did not.
- **AC8 [R9]** `tsc` exit 0, `build` exit 0, `check:i18n` exit 0.
- **AC9 [R10]** Given the final `--mantine-only` matrix, then it is stated against `1164/1204 PASS, 18 FAIL, 22 AMBIGUOUS` and every moved cell is attributed.
- **AC10 [R11]** Two counting passes, the second after the session log and backlog row exist; baseline quoted from `git show HEAD:docs/backlog.md | wc -l`.

---

## 13. QA profile and verification plan

**Profile: `Q3` Full Visual Matrix.** A layout change to the app shell affects every route's bottom spacing at
mobile widths in four locales. Not `Q4`: §3.5 confirms neither component appears in `docs/critical-flow-registry.md`.

| # | Command | Expected |
|---|---|---|
| 1 | `git status --porcelain` + `git show HEAD:docs/backlog.md \| wc -l` | A1 manifest + R11 baseline |
| 2 | `npm run build` · `npm start` · `BASE_URL=http://127.0.0.1:3000 npm run check:click-shield` | Pre-fix baseline: base = **6** |
| 3 | Live geometry measurement, failing + passing cells | AC1 |
| 4 | Implement per §7.2 | — |
| 5 | `check:click-shield` all three scenarios | AC3 — base **0**, others unchanged |
| 6 | `npm run check:design-tokens:strict` | exit 0 |
| 7 | Rendered proof, Q3 widths × 4 locales incl. `uk@320` | AC7 |
| 8 | `npm run build-storybook` · `screenshots:assert -- --mantine-only` | AC9 vs `1164/1204` |
| 9 | `npx tsc --noEmit` · `npm run check:i18n` | exit 0 |
| 10 | `npm run build` | **exit 0, mandatory** |
| 11 | `check:file-integrity` + `check:mojibake`, twice | AC10 |

A failed or unrun step 10 permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`.

---

## 14. Completion report contract

Report: changed files with reasons · R1–R11 each with its evidence artifact · every command with its **actual**
result and exit code · the visual source map and canonical UI decision record in full · evidence root
(`.screenshots/task737-evidence/`, local-only per D6) · assumptions, deviations, limitations · unresolved issues.
State the pre-fix and post-fix base-scenario violation counts as two numbers. Then update `docs/backlog.md` —
**replacing** the "Last Session" block — and write `docs/sessions/<date>-task737-footer-social-links-under-fab.md`.

---

## 15. Task quality gate

Checked before publication: a fresh Sonnet session can execute this without chat context · every requirement has a
binary AC and a verification method · **the geometry is given as arithmetic from declarations and explicitly
flagged as unverified (A2)**, with `env(safe-area-inset-bottom)` and the ring named as the reasons it may differ ·
the fix is not chosen — the constraints on it are · `--space-16` matching the derived band is stated as an
observation and explicitly *not* the answer, with the missing `calc()` precedent recorded so that route is a
decision rather than a slip · the "why only these 6 cells" question is unresolved on purpose and assigned to
measurement, because a clearance fix that merely moves the box would otherwise look like success · the UI rules'
two mandatory artifacts are requirements with their own AC · the landed D28/D34 work is protected by name · the
stale-comment risk is a requirement, not a note, because a false coupling comment is how the next task inherits a
wrong premise · the ordering against the Supabase secrets is stated at the top, where it cannot be missed.
