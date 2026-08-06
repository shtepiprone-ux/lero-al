# Task 711 — Re-anchor the two assertions that are dead in all 1184 Mantine cells

**Sprint:** 52 (`tasks/Sprints/Sprint_52_Gates_That_Stopped_Checking.md`). **Epic:** MM Phase-2 / Epic RS.
**Depends on:** nothing. **Origin:** Task 710, which built the meta-gate that detected these two and
registered them here (`APPROVED WITH NOTES`, Sprint 49).
**Scope decision, owner, 2026-08-06:** 711 is the **re-anchoring half only**. The four 710-review findings
(`[no-boolean-assertions]` exit-2 arm · `ORPHAN-ENTRY` exit-1 arm · `LIVE-THIN` threshold · the doc-citation
fixes) move to **721**, which runs after this task — `LIVE-THIN`'s threshold cannot be chosen before this
task reveals what the re-anchored assertions actually score.

---

## 1. Mode and task type

- **Mode:** implementation (Sonnet executor, via `.claude/skills/execute-task/SKILL.md`).
- **Primary task type:** **governance gate — dead assertion repair** (`docs/rule-index.md` → Validation/QA
  tooling), under **D33** (*re-anchor, do not re-classify*, Task 708).
- **Secondary type:** possible production `data-testid` additions (§3.6) — a `src/` change, small but real.

> **Read this first.** Two assertions in the CI-blocking `--mantine-only` matrix have never once produced a
> verdict. They are not failing; they are **not observing**. Every consumer tests `=== false`, so `null`
> passes vacuously in all 1184 cells. Task 710 proved it and parked them here. **This task makes them see
> again — and §3.5 records that a third assertion is worse off than either of them, in a way 710's meta-gate
> is structurally blind to.**

---

## 2. Objective

1. **Measure what the Mantine-scope stories actually render** at `<640` before choosing any selector (R1).
   The failure this task repairs was caused by assuming a DOM convention; do not repeat it one layer up.
2. **Re-anchor `fullWidthButtonsAtMobile`** (R2) and **`popupBottomSheetAtMobile`** (R3) onto anchors proven
   present by R1's census.
3. **Keep the honest contract**: `checkedAny === false → null`, never `true` (R4). §3.5 is the cautionary
   tale.
4. **Delete the two registry entries** and let the liveness gate's own `STALE-ENTRY` arm be the proof the
   re-anchoring worked (R5) — the comparator is built in and cannot be faked.
5. **Report the live counts against their applicable denominators** (R6), which is the input **721** needs.

**Non-goals:** do **not** implement the four 710-review findings (**721**); do **not** touch
`fullWidthControlsAtMobile` (**722**, §3.5); do **not** widen `MANTINE_VIEWPORTS` (**678**); do **not**
change `noHorizontalOverflow`, `heroSearchWrapInBand`, `renderCheck`, `styleIntegrity` or `visualIntegrity`.

---

## 3. Verified context

Every number below was measured on **2026-08-06** at commit `d9120b8cd`, against the real current manifest
`.screenshots/rendered-assert/2026-08-06T12-25/manifest.json` (**1184** cells, **71** distinct stories).

### 3.1 The two dead assertions, measured

| Assertion | live cells | applicable cells (`width < 640`) |
|---|---:|---:|
| `fullWidthButtonsAtMobile` | **0** | 852 |
| `popupBottomSheetAtMobile` | **0** | 852 |
| `heroSearchWrapInBand` (comparator, LIVE but thin) | 4 | 1184 |
| `noHorizontalOverflow` (healthy comparator) | 1184 | 1184 |

**852 of 1184 cells are `width < 640`**, so the `if (viewport.width < 640)` guard is *not* the cause — the
matrix genuinely runs three sub-640 widths (`MANTINE_VIEWPORTS`, `check-stories-rendered.mjs:392`:
`mobile-320` / `mobile-375` / `mobile-390`, plus `desktop-1024`). **The selectors are the cause.** That
alternative had to be excluded before this task could be written, and it is.

### 3.2 The selectors, quoted

`scripts/check-stories-rendered.mjs:1161` — `fullWidthButtonsAtMobile`:

```js
for (const el of document.querySelectorAll('[data-slot="button"]:not([data-icon-only])')) {
  if (el.offsetWidth <= 1) continue;
  if (el.closest('[data-slot="button-group"]')) continue;
```

`:1185-1192` — `popupBottomSheetAtMobile`:

```js
const selectors = [
  '[data-slot="dialog-content"]', '[data-slot="sheet-content"]', '[data-slot="select-content"]',
  '[data-slot="popover-content"]', '[data-slot="dropdown-menu-content"]',
  '[data-slot="navigation-menu-popup"]',
];
```

### 3.3 Why they can never match — measured

`data-slot` is a **shadcn** convention. Occurrences in `src/`, by directory:

| Directory | files |
|---|---:|
| `src/components/ui` (shadcn) | **27** |
| `src/stories` (a planted-violation fixture, deliberate) | 2 |
| `src/components/shared/__tests__` (a unit test) | 1 |
| **`src/design-system/mantine/**`** | **0** |

The `--mantine-only` scope renders Mantine primitives, which emit no `data-slot` at all. Same root cause as
governance §14.9.9's `PORTAL_SELECTOR` defect and Task 708's `.bg-background` defect — **D33** exists because
of exactly this.

### 3.4 The registry entries this task retires

`scripts/assertion-liveness-registry.json` holds two entries, both `scope: "mantine-only"`,
`followUpTask: 711`, `deadSince: "2026-08-05"`. They are a **tracked dead gate list, not an exemption**.

`check-assertion-liveness.mjs:213` classifies a registered assertion that resolves again as **`STALE-ENTRY`**
→ **exit 1**, with a message naming the entry to delete. **That is this task's comparator, and it is free:**
the moment R2/R3 land, `npm run check:assertion-liveness` *must* fail with `STALE-ENTRY` for both keys; it
returns to exit 0 only after R5 deletes them. A pass at the end without that failure in between means the
re-anchoring did not take.

### 3.5 A third assertion is worse, and 710's meta-gate cannot see it — **722**, not yours

`fullWidthControlsAtMobile` (`:1112-1145`) looks healthy: **852/852** applicable cells LIVE. It is not.

```js
let fullWidthOk = true;                       // ← no checkedAny guard
if (viewport.width < 640) { fullWidthOk = await page.evaluate(...); }
cell.assertions.fullWidthControlsAtMobile = viewport.width < 640 ? fullWidthOk : null;
```

Its element selectors are `[data-slot="select-trigger"]` and `[data-slot="tabs-list"]` — **the same
shadcn convention** that killed the other two — plus a generic `input[...]` arm. With no `checkedAny` guard,
a cell that matches nothing returns **`true`**, not `null`.

Measured across the 852 applicable cells: `{"true": 852}` — **never once `false`**, including on
`Mantine/Primitives/Alert/Default`, a story with no form controls, where `fullWidthButtonsAtMobile` honestly
reports `null` on the same cell.

So it is a **vacuously-true** gate: dead in the same way, but invisible to `check-assertion-liveness.mjs`,
which detects null-ness only. **Registered as 722. Do not fix it here** — but note the lesson it teaches R4:
the two assertions you are repairing are *honest*, and their honesty is why they were detectable at all.
**Do not "fix" them by copying the pattern that hides.**

### 3.6 Candidate anchors — what is proven, and what you must measure

**Proven present (grep, this worktree):** the project already uses `data-testid` in Mantine patterns —
`src/design-system/mantine/patterns/MantineDrawer.tsx:58,67`
(`mantine-drawer-scroll-content`, `mantine-drawer-footer`) and
`src/design-system/mantine/patterns/responsiveBottomSheet.tsx:182,186`. That is the same anchor class
**708** chose under D33, and it survives de-Tailwinding.

**NOT proven — measure it, do not assume it.** `mantine-Button-root` and friends are runtime classNames added
by Mantine's JS; they are **absent** from `node_modules/@mantine/core/styles/*.css`, which ships hashed
classes (`.m_77c9d27d…`, see Task 709's record). A grep of the installed package therefore **cannot** confirm
them. **R1 exists to settle this from the live DOM**, not from a package grep and not from this paragraph.

### 3.7 Consequence if a re-anchored assertion returns `false`

`shouldRetry` (`:674-676`) treats `fullWidthButtonsAtMobile === false` and
`popupBottomSheetAtMobile === false` as **non-retryable real failures**. So a live assertion that finds a
genuine violation turns the CI-blocking gate **red**. That is the gate working — but it is an **owner
decision**, not something to silence. See R8's stop-and-report.

### 3.8 Worktree state

Clean at `d9120b8cd` (720 committed and pushed). Take your own pre-write `git status --porcelain` snapshot
before the first edit; complete `docs/orchestrator-dirty-worktree-manifest-template.md` if it is not empty.

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | §3.6, D33 | **Census first.** From a real harness run at a sub-640 width, record what the Mantine-scope stories actually render for (a) text buttons and (b) open popups/sheets: tag, the classes present, and every `data-*` attribute. Persist the raw dump. **No selector is chosen before this exists.** | P0 | AC1 | Confirmed |
| R2 | §3.1-3.3 | `fullWidthButtonsAtMobile` is re-anchored onto an R1-proven anchor and resolves `true`/`false` in **≥1** cell. Its geometry logic (parent-content-width comparison, `offsetWidth <= 1` skip, icon-only and button-group exclusions) is preserved in intent; only the anchor changes. | P0 | AC2 | Confirmed |
| R3 | §3.1-3.3 | `popupBottomSheetAtMobile` is re-anchored likewise and resolves in **≥1** cell. Its edge-to-edge + bottom-anchored geometry and the `data-side="left"` skip are preserved in intent. | P0 | AC3 | Confirmed |
| R4 | §3.5 | **The honest contract is preserved**: when nothing matched, the assertion is **`null`**, never `true`. Locked by a test arm using a story that renders no such element. | P0 | AC4 | Confirmed |
| R5 | §3.4 | Both registry entries are deleted, and the `STALE-ENTRY` failure is captured **before** deleting them: `check:assertion-liveness` exits **1** naming both keys, then exits **0** after deletion. Both transcripts unpiped. | P0 | AC5 | Confirmed |
| R6 | 721 | The final live counts are reported **against their applicable denominators** (`live/852`, and `live/1184`), alongside `heroSearchWrapInBand`'s 4/1184. A thin result is disclosed, not rounded up to "LIVE". | P0 | AC6 | Confirmed |
| R7 | D32, Q4 | **Planted proof, per assertion.** For each, plant a violation a correctly-anchored assertion must catch (a non-full-width text button; a popup that is neither edge-to-edge nor bottom-anchored), show the cell resolve **`false`**, then remove it and show `true`/`null` restored. Four transcripts. | P0 | AC7 | Confirmed |
| R8 | §3.7 | If a re-anchored assertion returns **`false`** on an unplanted story, **stop and report** — it is a real layout defect and an owner decision. Do not loosen the tolerance, do not add a skip, do not re-register the assertion as dead. | P0 | AC8 | Confirmed |
| R9 | scope | Zero diff in `check-assertion-liveness.mjs`, `fullWidthControlsAtMobile`, `MANTINE_VIEWPORTS`, `noHorizontalOverflow`, `heroSearchWrapInBand`, `docs/critical-flow-registry.md`, `package.json`, `.github/workflows/governance-pr.yml`. Any `src/` change is limited to added `data-testid` attributes — **no** markup, style, class or behavior change. Verify by hash. | P0 | AC9 | Confirmed |
| R10 | agent-contract cl. 9 | `npm run build` exits 0, transcript persisted with the exit code **inside** the file. | P0 | AC10 | Confirmed |
| R11 | cl. 14, N6, `ai-behavior.md` **5a** | Counting gates run in **two passes** — the final one after every artifact exists, including the session log and `docs/backlog.md` — and reconcile to `git status`. | P1 | AC11 | Confirmed |

---

## 5. Assumptions and open questions

- **A1 — the anchor decision is R1's output, not this kickoff's.** §3.6 deliberately stops at "here is the
  precedent, here is what is unproven". If R1's census shows no stable non-class anchor exists, the answer is
  a `data-testid` addition (§3.6 precedent), not a Mantine internal class. If R1 shows the census cannot be
  taken, **stop and report** — do not choose a selector from documentation.
- **A2 — a `data-testid` addition is a production change, and stays minimal.** R9 bounds it: attribute only,
  on elements that already exist, no restructuring. If a component would need restructuring to be anchorable,
  **stop and report**; that is a different task with a UI blast radius.
- **A3 — "resolves in ≥1 cell" is the floor, not the goal.** R6 exists because `heroSearchWrapInBand` passes
  the ≥1 bar at **4/1184** and is still nearly blind. Report the ratio honestly; **721** will set the
  threshold that judges it. Do not tune the anchor to inflate the count.
- **A4 — the matrix run is the expensive part.** `npm run screenshots:assert -- --mantine-only` drives a real
  browser over 1184 cells. Budget for it, capture it unpiped, and do not substitute a partial run for the
  final evidence. If the harness cannot run in your environment, **stop and report `BLOCKED`** with the exact
  failure — a re-anchoring proven only in theory is worth nothing here.
- **A5 — 722 is not yours.** §3.5's `fullWidthControlsAtMobile` defect is registered separately. Touching it
  here would put a third assertion's behavior change into a task whose comparator is already two-armed.

### 5.1 Rejected alternatives — do not re-open

- **Delete the two assertions.** Rejected: they encode agent-contract clause 12's mobile stress requirements,
  and 710 registered them as *tracked dead*, explicitly not as removable.
- **Re-classify them as "not applicable to Mantine".** Rejected by **D33** — that is re-classifying instead of
  re-anchoring, and it is how the defect survived from Task 652 to 708 undetected.
- **Anchor onto a Tailwind or hashed Mantine class.** Rejected: Tailwind classes are being deleted by the
  ongoing D28 de-Tailwind work (Sprint 46), and hashed Mantine classes change with the package version.
- **Widen `MANTINE_VIEWPORTS`.** Rejected — **678**, and §3.1 proves the viewport set is not the problem.
- **Fold in the four 710-review findings.** Rejected by the owner, 2026-08-06 — **721**.

---

## 6. Pre-read rule bundle

**Always required:** `docs/agent-contract.md` (cl. 9, 12, 14, 15) · `docs/rule-index.md` ·
`docs/qa-profiles.md` · `docs/backlog.md`.

**Because this is a gate repair:** `docs/orchestrator-procedures.md` → **"Detector-aware requirements and
migrations"** · `docs/storybook-governance.md` **§14.9.9** (the `PORTAL_SELECTOR` defect this repeats) ·
`docs/critical-flow-registry.md` (read for clause 15 applicability — **do not edit**, that is 721's).

**Task-specific — read, and note which you may not edit:**

- `scripts/check-stories-rendered.mjs` — `:1147-1218` (both assertions), **`:1112-1145`**
  (`fullWidthControlsAtMobile` — read it as §3.5's cautionary tale, **do not edit**), `:392`
  (`MANTINE_VIEWPORTS`, **do not edit**), `:670-691` (`shouldRetry`, §3.7).
- `scripts/check-assertion-liveness.mjs` — `:176-246` (classification and messages). **Do not edit** — 721.
- `scripts/assertion-liveness-registry.json` — the two entries R5 deletes.
- `src/design-system/mantine/patterns/MantineDrawer.tsx` `:58,:67` and `responsiveBottomSheet.tsx`
  `:182,:186` — the `data-testid` precedent.
- `docs/sessions/2026-08-05-task710-assertion-liveness-meta-gate.md` — how the two were detected and parked.

---

## 7. Scope

- `scripts/check-stories-rendered.mjs` — the two assertions' selectors only.
- `scripts/assertion-liveness-registry.json` — delete the two entries (R5).
- `src/**` — **only** added `data-testid` attributes, if R1 shows they are needed (A2).
- `docs/storybook-governance.md` — record the re-anchoring and the new anchors.
- `docs/backlog.md` — concise state only.
- `docs/sessions/2026-08-0X-task711-reanchor-dead-mantine-assertions.md`.

## 8. Out of scope

- `check-assertion-liveness.mjs` and the four 710-review findings — **721**. **Zero diff.**
- `fullWidthControlsAtMobile` — **722** (§3.5). **Zero diff.**
- `MANTINE_VIEWPORTS` (**678**) · `noHorizontalOverflow` · `heroSearchWrapInBand` · `renderCheck` ·
  `styleIntegrity` · `visualIntegrity` · `docs/critical-flow-registry.md` (721) · `package.json` ·
  `governance-pr.yml` · every `.module.css` and every design-token script.

---

## 9. Current and required behavior

**Current:** both assertions query `data-slot` names that only `src/components/ui/*` emits, so `checkedAny`
is never true, both resolve `null` in all 1184 cells, every consumer's `=== false` test passes vacuously, and
the CI-blocking `--mantine-only` gate contributes two silent `true`s to `hardPass`. Two registry entries keep
this tracked rather than forgotten.

**Required after:** both are anchored on DOM the Mantine scope actually renders, proven by a census; both
resolve in at least one cell with their live/applicable ratio reported; a story that renders no such element
still yields `null`, never `true`; the liveness gate fails `STALE-ENTRY` for both until their registry entries
are deleted, then exits 0; and a planted violation makes each one report `false`.

### Implementation sequence

- **I1 — Baseline.** `git status --porcelain`. Persist `check:assertion-liveness` (exit 0, 2 DEAD-KNOWN) and
  the current manifest's per-assertion live counts.
- **I2 — Census (R1).** Run the harness at a sub-640 width and dump the real DOM for buttons and popups.
  Persist the raw dump. **Choose the anchors from this and nothing else.**
- **I3 — Re-anchor (R2/R3)**, preserving geometry logic and the `checkedAny → null` contract (R4).
- **I4 — Full matrix run.** `screenshots:assert -- --mantine-only`, unpiped. Record both live counts against
  852 and 1184 (R6). Any unplanted `false` → **stop and report** (R8).
- **I5 — The free comparator (R5).** Run `check:assertion-liveness` **before** touching the registry: it must
  exit **1** with `STALE-ENTRY` for both. Persist. Then delete both entries and re-run: exit **0**.
- **I6 — Planted proof (R7).** Per assertion, plant → `false` → remove → restored. Four transcripts. Verify
  the plants are gone with `git status`.
- **I7 — R4's null arm.** A control-free story still yields `null`. Persist.
- **I8 — Docs** (`storybook-governance.md`), then `npx tsc --noEmit`, then `npm run build`.
- **I9 — Counting gates, two passes** per `ai-behavior.md` **5a** — the final one after the session log and
  backlog exist, reconciled to `git status`.

---

## 10. Implementation requirements

1. **Census before selector** (I2, A1). A selector chosen from documentation is the defect this task repairs.
2. **`checkedAny === false → null`, never `true`** (R4). §3.5 shows what the alternative costs.
3. **Do not copy `fullWidthControlsAtMobile`** — it is the anti-pattern, not the model (§3.5).
4. **An unplanted `false` is a stop, not a tuning exercise** (R8). Never widen `FULL_WIDTH_TOLERANCE`.
5. **Capture the `STALE-ENTRY` failure before deleting the registry entries** (I5). Deleting them first
   destroys the only free comparator this task has.
6. **`src/` changes are `data-testid` attributes only** (A2). Anything more → stop and report.
7. **Capture every transcript unpiped** (Task 710 R10).
8. **No task number in any code identifier** (Task 701 F2).
9. **Counting gates in two passes, final one genuinely last** (`ai-behavior.md` 5a) — a regression is a `P1`.
10. **Never run, emit, suggest or delegate a mutating git command**, including any form of `git push`.

---

## 11. Positive and negative flows

**Positive flow:** the census records the real DOM; both assertions re-anchor onto it; the matrix run resolves
both in ≥1 cell with ratios reported; a control-free story still yields `null`; `check:assertion-liveness`
fails `STALE-ENTRY` for both, then passes once the entries are deleted; four planted transcripts show `false`
and its restoration; no unplanted `false`; build exits 0.

| Branch | Applicable? | Owner / source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Story renders a Mantine text button at <640 | **Yes** | R2 | assertion resolves `true`/`false` | AC2 |
| Story renders an open popup/sheet at <640 | **Yes** | R3 | assertion resolves | AC3 |
| Story renders neither | **Yes** | R4 | **`null`**, never `true` | AC4 |
| Viewport ≥640 | **Yes** | existing | `null` — unchanged | AC2, AC3 |
| Planted non-full-width button | **Yes** | R7 | `false` | AC7 |
| Planted mis-anchored popup | **Yes** | R7 | `false` | AC7 |
| Registry entries still present after re-anchor | **Yes** | R5 | `STALE-ENTRY`, exit 1 — the proof | AC5 |
| Unplanted `false` on a real story | **Yes** | R8 | **stop and report** — owner decision | AC8 |
| Re-anchored but thin (e.g. 4/852) | **Yes** | R6/A3 | report the ratio honestly; **721** judges it | AC6 |
| Harness cannot run | **Yes** | A4 | **`BLOCKED`** with the exact failure | — |
| `fullWidthControlsAtMobile` | **No** | §3.5 | **722** — zero diff here | AC9 |
| Locale expansion | **No** | the matrix already sweeps both locales; no strings added | N/A | — |
| RLS / data access | **No** | build-time harness over Storybook; no data access | N/A | — |

---

## 12. Acceptance criteria

- **AC1 [R1]** Given a sub-640 harness run, then a persisted dump records the real tag/classes/`data-*` for
  Mantine buttons and popups, and the chosen anchors are traced to specific lines of it. Quote the anchors
  and their evidence.
- **AC2 [R2]** Given the full matrix run, then `fullWidthButtonsAtMobile` resolves `true`/`false` in ≥1 cell;
  state `live/852`. Show the selector before and after.
- **AC3 [R3]** Same for `popupBottomSheetAtMobile`. Show both selector lists.
- **AC4 [R4]** Given a story rendering no matching element, then the assertion is **`null`**. Name the story
  and show the manifest value.
- **AC5 [R5]** Given `check:assertion-liveness` run **before** the registry edit, then it exits **1** naming
  both keys `STALE-ENTRY`; after deletion, exit **0**. Show both transcripts and the registry diff.
- **AC6 [R6]** Given the final manifest, then both live counts are stated as `live/852` **and** `live/1184`,
  beside `heroSearchWrapInBand`'s 4/1184, with a plain statement of whether either is thin.
- **AC7 [R7]** Given one plant per assertion, then each cell resolves **`false`**, and removal restores the
  prior value. Four transcripts plus `git status` proving both plants are gone.
- **AC8 [R8]** Given the unplanted matrix run, then no assertion returned `false` — or the task **stopped**
  and reported the story, viewport and measured geometry.
- **AC9 [R9]** Given `git diff`, then `check-assertion-liveness.mjs`, `fullWidthControlsAtMobile`,
  `MANTINE_VIEWPORTS`, the other four assertions, `critical-flow-registry.md`, `package.json` and
  `governance-pr.yml` are **empty**, and every `src/` hunk is a `data-testid` attribute addition only.
  Verify by hash.
- **AC10 [R10]** `npm run build` exits **0**, transcript at a stated path with the exit code inside it.
- **AC11 [R11]** Given two counting-gate passes, then the final one runs after every artifact exists and its
  numbers **reconcile to `git status`**. State the reconciliation and both pass numbers.

---

## 13. QA profile and verification plan

**Profile: `Q4` Release/Critical Flow.** `--mantine-only` is a hard-blocking CI gate
(`.github/workflows/governance-pr.yml`), two of its assertions change from never-observing to observing, and
production `src/` may gain attributes. Q4 compels the planted-violation proof (R7) — and this task also has a
**free second comparator** in R5's `STALE-ENTRY` arm, which no executor can fake.

**Rendered evidence is required and is the point:** the whole task is about what the browser actually
renders. A green run is explicitly not sufficient; AC2/AC3 require non-null resolution and AC7 requires four
transcripts.

| # | Command / step | Expected |
|---:|---|---|
| 1 | `git status --porcelain` (I1) | empty, or a completed manifest |
| 2 | `npm run check:assertion-liveness` (I1) | exit 0 — 3 LIVE / 2 DEAD-KNOWN — persisted |
| 3 | Census dump (I2) | real DOM persisted; anchors chosen from it |
| 4 | Re-anchor (I3) | — |
| 5 | `npm run screenshots:assert -- --mantine-only` (I4) | both assertions resolve in ≥1 cell; **no unplanted `false`** or **stop** |
| 6 | `npm run check:assertion-liveness` **pre-registry-edit** (I5) | **exit 1**, `STALE-ENTRY` ×2 — persisted; the free comparator |
| 7 | Delete both entries + re-run (I5) | exit **0** |
| 8 | Planted proof ×2, both arms (I6) | `false` then restored; plants gone from `git status` |
| 9 | Null-contract arm (I7) | control-free story → `null` |
| 10 | `npx tsc --noEmit` | 0 errors |
| 11 | **`npm run build`** | **exit 0 — hard gate** |
| 12 | `check:file-integrity` · `check:mojibake` — **pass 2, genuinely last** | pass; reconcile to `git status` |

A failed or unrun step 11 permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`. An unrunnable harness (step 5)
is `BLOCKED`, never a theoretical pass. Evidence under `.screenshots/task711-evidence/` (local-only, **D6**).
**Name every artifact.**

---

## 14. Completion report contract

Write `docs/sessions/2026-08-0X-task711-reanchor-dead-mantine-assertions.md` containing:

1. **Files changed** — table matching the real `git diff --stat`, reconciled to your pre-write snapshot.
2. **Requirement IDs completed** — R1–R11, each with its AC verdict.
3. **The R1 census** — the raw dump's location and the lines the anchors were chosen from.
4. **Both selectors**, before and after.
5. **The live counts** — `live/852` and `live/1184` for both, beside `heroSearchWrapInBand`'s 4/1184, with an
   explicit thin/not-thin statement (R6 — this is **721**'s input).
6. **The `STALE-ENTRY` arm** — the exit-1 transcript, the registry diff, the exit-0 transcript.
7. **The four planted transcripts** and the `git status` proving cleanup.
8. **The null-contract arm** (R4) — story named, manifest value shown.
9. **Any `src/` `data-testid` additions**, quoted, with the reason each was unavoidable.
10. **Commands run and actual results** — real exit codes, including the step-11 build transcript.
11. **Evidence locations** — every artifact, named.
12. **Counting gates — both passes**, with the final numbers reconciled to `git status`.
13. **Standing findings not acted on** — **721** (the four 710-review findings), **722**
    (`fullWidthControlsAtMobile`'s vacuous truth), **678**, **717**, §23.6.c **A8**.
14. **Assumptions, deviations, limitations, unresolved issues.**
15. Concise current state in `docs/backlog.md` — **state only**; re-flag `BACKLOG LIMIT BREACH` if you cannot
    hold the line count.

**Status must be `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`.** Never
self-approve, never produce a `Decision`/`Confidence`/`Blocking findings` section, and never run, emit,
suggest, or delegate any mutating git command, including any form of `git push`.

---

## 15. Task quality gate

| Check | Status |
|---|---|
| A fresh Sonnet session can execute this with no hidden chat context | ✅ both selectors quoted with line numbers, the manifest path and its measured counts, the applicable denominator, the viewport set, the registry entries, the `STALE-ENTRY` mechanism with its line, the `data-testid` precedent with file+line, and every command |
| Every primary requirement has a binary AC and a verification method | ✅ R1–R11 → AC1–AC11 → §13 steps 1–12 |
| Scope protects existing behavior and names what must not change | ✅ §8 plus hash-verified AC9; `fullWidthControlsAtMobile` is fenced off to **722** even though it is the most tempting thing in the file |
| **No number is asserted that was not measured with the real tool** | ✅ 1184 cells · 852 applicable · 0/852 and 0/852 · 4/1184 · 852/852 · 71 stories · `data-slot` in 27+2+1 files and **0** in `design-system/mantine` · viewport set read at `:392` — all from the real manifest and worktree at `d9120b8cd` |
| **A claim that could NOT be measured is marked as such** | ✅ §3.6 states plainly that `mantine-Button-root` is absent from the installed package's CSS and cannot be confirmed by grep, and makes R1 settle it from the live DOM instead |
| **The likeliest alternative root cause was excluded, not assumed away** | ✅ §3.1 measured that 852 cells really are <640, so the `width < 640` guard is not why the assertions are null — the selectors are |
| The gate proves the changed behavior, not merely procedure | ✅ R7's four planted transcripts, plus R5's `STALE-ENTRY` comparator, which the gate itself produces and no report can fake |
| No new blind spot is created silently | ✅ R4 forbids the vacuous-`true` pattern outright, R6 forces the thin-liveness ratio into the open, and §3.5 registers the blind spot this task found but does not own |
| Zero/empty input covered | ✅ R4 is exactly the zero-match case, with its own arm and its own named story |
| Every checkpoint names producer, output, comparator, failure behavior | ✅ §13 + I2's census-before-selector + I4/R8's stop + I5's ordered two-arm + I6's plant-and-remove + A4's `BLOCKED` + I9's two-pass count |
| Ordering/dependency stated | ✅ 721 explicitly follows this task because `LIVE-THIN`'s threshold depends on R6's output; 722 is independent |
| Owner exceptions have traceable authorization | ✅ the owner's 2026-08-06 scope split; D6 for the evidence dir; D32/D33 cited with their sources |
| Exactly one active executable route | ✅ A1 makes the anchor an R1 output rather than a fork, §5.1 closes five alternatives, A2/A4/R8 convert the remaining forks into stop conditions |
| Prior-review corrections folded in | ✅ **D33** (708) is the governing rule · 710's own findings are deliberately deferred to 721 by owner decision · 719/720's counting-gate defect is pre-empted by R11 citing the new `ai-behavior.md` **5a** · 710 **R10** (unpiped) · **701 F2** (no task numbers in code) |
| Sprint assigned before creation | ✅ Sprint 52, already open; row added to its Tasks table |

**Remaining ambiguous or conflicting requirements: none.**
**Owner decisions still needed: none to start.** One may arise mid-task: R8's unplanted `false` is a real
layout defect requiring an owner call, and the task stops rather than deciding it.
