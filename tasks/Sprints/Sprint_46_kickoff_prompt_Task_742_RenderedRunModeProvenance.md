# Task 742 — rendered-run mode provenance (Sprint 46.7)

**Kickoff path:** `tasks/Sprints/Sprint_46_kickoff_prompt_Task_742_RenderedRunModeProvenance.md`
**Sprint:** 46 — ListingCard de-Tailwind + overlay exit, order **46.7**
**Executor:** Sonnet, via `.claude/skills/execute-task/SKILL.md`
**Filed:** 2026-08-10, by Task 702's review (C3)

---

## 0. The task narrowed during preflight — read this first

702's review filed 742 as *"fix the `--mantine-only`/anchor-row pairing in the shared source kickoffs copy from."*
Preflight measurement narrowed it, because **two thirds of that framing were already done**:

| Assumed missing | Measured state |
|---|---|
| The skip is undocumented | **Already documented**, `docs/storybook-governance.md:752-755` (Task 529): *"A new `--mantine-only` flag skips the pre-existing Phase 1 (`ASSERT_STORIES`) and Phase 2 (geometry-only) entirely."* §14.9.5 `:800-808` also documents **why** — 149 pre-existing Phase-1 failures on unrelated stories. |
| The console banner over-claims | **Already fixed by Task Q0R**, `:1468-1476` and `:1570-1580`, whose own comment says the banner *"must not claim full-mode/assert/geometry scope it does not run"*. |
| The pairing keeps recurring | **True, and it is an authoring problem.** 702's AC2 required four `.listing-card` anchor rows while its §13.2 prescribed `--mantine-only` — the one invocation that cannot produce them. I wrote both, having not read §14.9.2. |

So more prose is not the fix; §14.9.2 already existed and the defect happened anyway. **What is actually missing is
machine-emitted provenance:** Q0R fixed what scrolls past in a terminal and left every *persisted* artifact claiming
scope it did not run. That is what 742 closes.

---

## 1. Mode and task type

Implementation task. Type: **Governance / evidence integrity** — changes what a gate *reports about itself*. It must
not change what the gate passes or fails.

**M1/M2/M4/M5 binds it:** the deliverable is the trustworthiness of gate evidence, so the proof is a before/after on
real artifacts, not a claim that the strings look right.

---

## 2. Objective

Make every artifact a rendered run leaves behind state which run mode produced it and which phases did **not** run:

- `.screenshots/rendered-assert/<ts>/manifest.json` gains machine-readable mode + skipped-phase fields.
- `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` stops describing a
  `--mantine-only` run as a full global enumeration.
- The console banner gains the explicit **NOT RUN** line, so a transcript pasted into a session log carries its own
  gaps.

Pass/fail behaviour, cell counts and the fail set must be **byte-identical** before and after.

---

## 3. Verified context

Measured on **2026-08-10** against the tree at `ebf25d748` and the artifacts of Task 702's `--mantine-only` run at
`.screenshots/rendered-assert/2026-08-10T11-43/`. **Re-derive before writing code** (§10.1).

### 3.1 What `--mantine-only` actually skips — the four gate points

`scripts/check-stories-rendered.mjs`, all four re-read today:

| Line | Effect |
|---|---|
| `:1471` | banner branch (Q0R — already truthful) |
| `:1574` | composition line branch (Q0R — already truthful) |
| **`:1634`** | `for (const story of MANTINE_ONLY ? [] : ASSERT_STORIES)` — **Phase 1 runs zero stories** |
| **`:1680`** | `if (geometryOnlyStories.length > 0 && !FAST_MODE && !MANTINE_ONLY)` — **Phase 2 skipped** |

Phase 1 is where the four `.listing-card` anchor rows live (`:173-175, 181` — `system-featuredlistings--default`,
`system-latestlistings--default`, `system-similarlistings--default`,
`patterns-mantine-homepagelistinggrids--default`). Under `--mantine-only` they are asserted **zero times**.

### 3.2 The live false record — measured, with timestamps

The inventory header is built at `:1800` and `:1803`. Both ternaries branch on `FAST_MODE` **only**, so
`--mantine-only` — which is neither `--fast` nor a full run — falls through to the "full" arm:

```js
:1800  `**Run mode:** ${FAST_MODE ? '--fast' : 'full'} … | **Scope:** ${FAST_MODE ? '…' :
         'Global enumeration (' + (ASSERT_STORIES.length + mantineStories.length +
         geometryOnlyStories.length) + ' stories, ' + total + ' cells)'}`
:1803  `> ${FAST_MODE ? 'Task 467 INCOMPLETE …' : 'Full global-enumeration run.'}`
```

The scope figure sums the **lengths of the story arrays**, not what was rendered, so it counts stories Phase 1 and
Phase 2 never touched. The file currently on disk proves it:

```
**Run mode:** full (320/375/390 × sq/en/uk/it) | **Scope:** Global enumeration (317 stories, 1204 cells)
> Full global-enumeration run.
| Total cells | 1204 |
```

**1204 is the `--mantine-only` cell count** — verified two ways: the 702 run directory holds 1204 PNGs, and its
`manifest.json` `matrix` array has length **1204**. The inventory's mtime is `14:14:42.185`, **3 ms after** that
manifest's `14:14:42.182` — same run. So a `--mantine-only` run wrote a document calling itself a *"Full
global-enumeration run"* over *"317 stories"*.

**Severity is bounded, and say so rather than inflating it:** the file is **gitignored** (`.gitignore:74`, Task
2026-07-23 "stop tracking harness-regenerated task467 inventory"), so it is a local regenerable artifact, not a
committed record. It is still the human-readable report under `docs/governance-reports/`, still rewritten on every
run, and still the thing a reviewer opens.

### 3.3 `manifest.json` carries no mode at all

Read from the 702 run: top-level keys are exactly **`timestamp`, `summary`, `matrix`**. No mode, no flag, no
skipped-phase field. `summary` holds 12 counters, none of which distinguish "0 anchor failures because anchors
passed" from "0 anchor failures because Phase 1 never ran".

**This is the root cause of the 702 confusion.** A reviewer handed a run directory with 1204 PNGs and a manifest has
no way to learn that the anchor phase was skipped — which is exactly the inference I got wrong.

### 3.4 What must not change

`--mantine-only` on this tree is the standing comparator: **1164/1204 PASS, 18 FAIL, 22 AMBIGUOUS**, matching Task
733's documented baseline (`docs/sessions/2026-08-09-task733-overlay-hosted-controls.md:21`) and re-confirmed in
702's review. 742 changes reporting only; that triple and the fail-set identity must survive byte-identical.

### 3.5 Run cost — plan for it

The 702 `--mantine-only` run started at `11-43` and wrote its manifest at `14:14` — roughly **2.5 hours**. Budget one
such run, not three. §13.2 is built around unit-testing the mode logic as a pure function so correctness does not
depend on repeated full runs.

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | §3.3 | `manifest.json` gains a `runMode` field (`full` \| `fast` \| `mantine-only`) and a `phasesSkipped` array naming the skipped phases | P0 | AC1 | Confirmed |
| R2 | §3.2 | The inventory header states the real mode and, when phases were skipped, lists them explicitly — no "Global enumeration" or "Full global-enumeration run." under `--mantine-only` | P0 | AC2 | Confirmed |
| R3 | §3.2 | The scope figure reports **cells actually rendered**, never a sum of array lengths that includes unrendered stories | P0 | AC2 | Confirmed |
| R4 | §3.1 | The console banner prints an explicit `NOT RUN` line under `--mantine-only` and `--fast`, naming Phase 1 (incl. the four `.listing-card` anchor rows) and Phase 2 as applicable | P1 | AC3 | Confirmed |
| R5 | M1/M2/M4/M5 | The mode/skip description is a **pure exported function**, unit-tested for all three modes | P0 | AC4 | Confirmed |
| R6 | §3.4 | Pass/fail behaviour unchanged — `--mantine-only` still yields `1164/1204 PASS, 18 FAIL, 22 AMBIGUOUS` with a byte-identical fail set | P0 | AC5 | Confirmed |
| R7 | §0 | `docs/storybook-governance.md` §14.9.2 gains a one-line pointer: an AC that depends on Phase 1 anchors cannot be proven by `--mantine-only` | P1 | AC6 | Confirmed |
| R8 | Standing | `npm run build` exit 0; no file under `src/` changed | P0 | AC7 | Confirmed |
| R9 | Backlog rules | Concise `docs/backlog.md` update + session log | P1 | AC8 | Confirmed |

---

## 5. Assumptions and open questions

- **A1.** `--fast` also skips Phase 2 (`:1680`) while running Phase 1. Its header already says `--fast`, so R2's
  correctness bar for it is lower — but R4's `NOT RUN` line still applies, and R5's function must handle it.
- **A2.** The inventory path is gitignored (§3.2), so regenerating it produces **no** `git status` entry. Do not
  treat its absence from `git status --porcelain` as evidence it was not written; witness it by mtime and content.
- **OQ1 — none open.** The §0 narrowing is a preflight measurement, not a scope change needing an owner decision:
  the backlog row's intent (stop kickoffs pairing `--mantine-only` with anchor claims) is served better by
  machine-emitted provenance than by the prose it asked for. **If the reviewer disagrees, that is a scope call, not
  a defect in the work.**

---

## 6. Pre-read rule bundle

Always Required: `docs/agent-contract.md` · `docs/rule-index.md` · `docs/qa-profiles.md` · `docs/backlog.md` ·
`docs/critical-flow-registry.md` (scan only — confirm explicitly that **no** row is affected).

Governance/gate path: `docs/qa-rules.md` · `docs/storybook-governance.md` §14.9.1–§14.9.5 (`:730-810`) — the
authoritative description of Phase 0/1/2 and the `--mantine-only` scoping decision.

Task-specific, required:

- `scripts/check-stories-rendered.mjs` `:1461-1480` (banner), `:1570-1582` (composition line), `:1630-1640`
  (Phase 1 skip), `:1676-1686` (Phase 2 skip), `:1780-1810` (manifest + inventory header), `:1925` (inventory write).
- `scripts/check-stories-rendered.mjs` `:170-182` — the four `.listing-card` anchor rows R4 must name.
- `tasks/Sprints/Sprint_46_kickoff_prompt_Task_702_ListingCard_DeTailwind.md` §0.2 C3 — the defect that filed this.
- `docs/sessions/2026-08-09-task733-overlay-hosted-controls.md` §R1 — the standing comparator R6 must preserve.

Do **not** read the UI rule bundle, the Mantine/TailAdmin design docs, or any `.module.css`. **This task changes no
UI, no story and no CSS** — the permanent-story creation gate is `N/A`.

---

## 7. Scope

| Path | Action |
|---|---|
| `scripts/check-stories-rendered.mjs` | **modify** — mode/skip function, manifest fields, inventory header, banner |
| `scripts/__tests__/rendered-run-mode.test.ts` | **create** — unit tests for the pure function, all three modes |
| `docs/storybook-governance.md` | **modify** — one pointer line in §14.9.2 |
| `docs/backlog.md` | **modify** — concise state |
| `docs/sessions/2026-08-10-task742-rendered-run-mode-provenance.md` | **create** — session log |

---

## 8. Out of scope

- **Every file under `src/`**, every story, every `.module.css`.
- Changing what any phase asserts, which stories are enrolled, the viewport sets, or the `--mantine-only` CI scoping
  decision (§14.9.5). **If the reporting fix reveals a real coverage gap, report it and stop** — that is a new number.
- The 149 pre-existing Phase-1 failures (§14.9.5) — a known, deliberately unfixed backlog.
- Re-running or re-baselining Task 733's comparator.
- `docs/governance-reports/` retention or the `.gitignore` decision.

---

## 9. Current and required behavior

**Current.** `--mantine-only` skips Phase 1 and Phase 2. The console says so (Q0R). The two artifacts that outlive
the terminal do not: `manifest.json` records no mode, and the inventory header falls through to the "full" arm and
declares a *"Full global-enumeration run."* over a story count that includes stories it never rendered.

**Required.** Both artifacts state the mode and the skipped phases. The console adds a `NOT RUN` line. The gate's
verdicts, counts and fail set are unchanged.

---

## 10. Implementation requirements

1. **Re-derive §3.1–§3.4 first**, including opening all four gate points and re-reading the on-disk inventory header
   and manifest keys. **If any disagrees with this document, the tree wins** — record the discrepancy.
2. **Extract the description as a pure function** (R5), e.g. `describeRunMode({ fastMode, mantineOnly, counts })`
   returning `{ runMode, phasesSkipped, scopeLine, noteLine }`. It must take its inputs as arguments — **no reads of
   module-level `FAST_MODE`/`MANTINE_ONLY` from inside** — or it cannot be unit-tested for three modes in one
   process, which is R5's whole point.
3. **Scope counts come from what ran** (R3): derive from the rendered matrix, not from `ASSERT_STORIES.length +
   mantineStories.length + geometryOnlyStories.length`.
4. **Name the skipped phases concretely** (R2/R4), not as "some phases": Phase 1 `ASSERT_STORIES` — *including the
   four `.listing-card` anchor rows* — and Phase 2 geometry-only.
5. **Do not touch verdict logic, thresholds, allowlists, enrolment, or viewport sets.** R6 is an AC, not an aspiration.
6. **Witness the inventory by content and mtime, never by `git status`** (A2) — it is gitignored.
7. Do not add a new npm script, a new CI step, or a new gate. This task changes reporting inside an existing gate.

---

## 11. Positive and negative flows

**Positive.** A reviewer opens a run directory or the inventory and can tell, without prior knowledge, that Phase 1
never ran — so an anchor-dependent claim cannot be sourced from it.

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Validation · Authorization/RLS · Offline · Concurrent writer | **No** | Build-time reporting script, no data model, no route | N/A | — |
| **`--mantine-only`** | **Yes** | §3.1 | mode `mantine-only`; Phase 1 + Phase 2 listed as skipped; no "Global enumeration" wording | AC1, AC2 |
| **`--fast`** | **Yes** | A1 | mode `fast`; Phase 2 listed as skipped, Phase 1 **not** listed | AC4 unit case |
| **full run** | **Yes** | A1 | mode `full`; `phasesSkipped` empty; wording unchanged from today | AC4 unit case |
| **Verdict regression** | **Yes** | §3.4, R6 | counts and fail set byte-identical to the standing comparator | AC5 |
| **Zero rendered cells** | **Yes** | R3 — a scope figure derived from the matrix must not divide by zero or print `NaN` | Explicit 0-cell handling | AC4 unit case |

---

## 12. Acceptance criteria

- **AC1 [R1]** — *Given* a completed `--mantine-only` run, *then* its `manifest.json` contains
  `runMode: "mantine-only"` and a `phasesSkipped` array naming Phase 1 and Phase 2. Quote the parsed keys.
- **AC2 [R2, R3]** — *Given* the inventory written by that same run, *then* its header states the real mode, lists
  the skipped phases, and contains **neither** `Global enumeration` **nor** `Full global-enumeration run.`; and its
  scope figure equals the number of cells actually rendered. Quote the before header (§3.2, already on disk) and the
  after header side by side.
- **AC3 [R4]** — *Given* the same run's console transcript, *then* a `NOT RUN` line appears naming Phase 1 including
  the four `.listing-card` anchor rows, and Phase 2.
- **AC4 [R5]** — *Given* `npx vitest run scripts/__tests__/rendered-run-mode.test.ts`, *then* all three modes and the
  zero-cell case are asserted and pass, in one process.
- **AC5 [R6]** — *Given* that run's summary, *then* it is **1164/1204 PASS, 18 FAIL, 22 AMBIGUOUS** with a fail set
  byte-identical to Task 733's baseline — 0 added, 0 removed. Show the set comparison, not just the totals.
- **AC6 [R7]** — *Given* `docs/storybook-governance.md` §14.9.2, *then* it states that an AC depending on Phase 1
  anchors cannot be proven by `--mantine-only`, and names 702 AC2 as the case.
- **AC7 [R8]** — `npm run build` exits 0; `git status --porcelain` lists only the five §7 paths and **no** `src/` path.
- **AC8 [R9]** — `docs/backlog.md` updated concisely; session log at the §7 path holds every transcript.

---

## 13. QA profile and verification plan

### 13.1 Profile

**`Q4 — Release/Critical Flow`**, per `docs/qa-profiles.md`. Not for visual risk — there is none — but because this
task changes the **evidence layer every other Q3/Q4 task depends on**. A reporting bug here is invisible in the
product and silently corrupts every future review, which is the M1/M2/M4/M5 mode exactly. The failure proof is the
before/after on the real artifact (§3.2's on-disk header is the "before", already captured) plus R6's regression
identity.

`docs/critical-flow-registry.md`: scan and confirm **no** row is affected.

### 13.2 Commands — record the actual result of each

1. `git --no-optional-locks status --porcelain` at I0; backlog baseline from
   `git show HEAD:docs/backlog.md | wc -l` **before** any edit.
2. **Capture the "before" witness now, before editing:** copy the current inventory header (§3.2) and the current
   `manifest.json` top-level keys into the session log, with the file mtimes. The inventory is gitignored (A2), so
   this is the only durable record of the pre-fix state.
3. `npx vitest run scripts/__tests__/rendered-run-mode.test.ts` — all three modes + the zero-cell case.
4. `npm run build-storybook`, then **one** `npm run screenshots:assert -- --mantine-only`. **Budget ~2.5 h** (§3.5).
   Persist the full transcript.
5. From that run: parse `manifest.json` for `runMode`/`phasesSkipped` (AC1); diff the new inventory header against
   step 2's capture (AC2); grep the transcript for the `NOT RUN` line (AC3).
6. The R6 identity check: compare the new fail set against Task 733's baseline **as a set** — story × locale ×
   viewport — and report `0 added, 0 removed`, not merely a matching total. A matching count with a changed set is a
   regression that a total would hide (the 739/740 lesson).
7. `npx vitest run` (full). **Known, not a regression:** the full-run-only timeout class — 700 observed
   `saveSavedSearch.dedup` and `filtersPanelShell.smoke`, 702 observed those plus `RangeDatePickerLocalization` and
   `filtersRangeDatePicker.smoke`. **The set is not stable between runs; report the one you observed**, and re-run
   any member in isolation.
8. `npm run typecheck` — exit 0.
9. `npm run build` — exit 0.
10. `npm run check:css-vars` · `check:design-tokens` · `check:stories` · `check:mojibake` · `check:file-integrity` —
    each unchanged. **Not required:** `check:homepage-grid` or a second rendered run.

If the step-4 run cannot complete in your environment, that is **`PARTIALLY IMPLEMENTED`** with an owner-native
handoff — never a pass on the unit tests alone.

---

## 14. Completion report contract

Report as `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. Never self-approve.

1. Changed files and why, reconciled against the **actual final** `git status --porcelain` — quote the final one, and
   remember the inventory will **not** appear in it (A2).
2. Requirement IDs completed; any not completed, with why.
3. Every §13.2 command with its **actual** result.
4. The step-2 "before" capture and the "after" header, side by side.
5. The parsed `manifest.json` mode fields and the `NOT RUN` transcript line.
6. The R6 set comparison — `0 added, 0 removed` — with the method used, not just the totals.
7. The §10.1 re-derivation against §3.1–§3.4: which numbers matched, which moved.
8. Confirmation that no file under `src/` was changed and no verdict logic was touched.
9. Assumptions, deviations, limitations. **This kickoff's own facts are not exempt.** Its predecessor 700 took three
   drafts and two rejections, every defect being a *derived* claim about what another file does. The derived claims
   here are: that `:1634` and `:1680` are the **only** two phase gates (four `MANTINE_ONLY` sites were read, but
   `grep` found them — a phase could be skipped by other means); that 1204 is the mantine-only cell count; that the
   inventory is written on every run including this mode; and that `.gitignore:74` is why it shows no status entry.
   **Open each one.** If one is wrong, say so and stop.
10. Confirmation that no `docs/critical-flow-registry.md` entry is affected.

---

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable by a fresh Sonnet with no chat context | **Yes** — every line number, artifact path, count and comparator is in §3 |
| Every primary requirement has a binary AC and a verification method | **Yes** — R1–R9 → AC1–AC8 |
| Scope protects existing behavior and names what must not change | **Yes** — §8, and R6's verdict identity is AC5 with a set comparison, not a total |
| Comparator shown able to fail | **Yes** — the "before" artifact is already on disk and provably wrong (§3.2, with mtimes), so AC2 is a real before/after rather than an assertion about strings |
| Pre-plant census / no further lifeline | **N/A** — no plant; the equivalent is §3.2's timestamp evidence that the current file was produced by the mode it misdescribes |
| No claimed command, file, value or behavior went uninspected | **Partial, deliberately.** Every §3 figure was measured today by opening the file or parsing the artifact. Four claims remain *derived* and are named for re-check in §14.9. Marking this "Yes" is what 700's draft 1 did wrong |
| Owner-only exceptions traceable | **Yes** — none is claimed. The §0 narrowing is preflight measurement, flagged in OQ1 as a reviewer scope call |
| Sprint assignment | **Yes** — Sprint 46, order 46.7, filed inside `tasks/Sprints/` |
| Permanent Storybook creation gate | **N/A** — no story added, extended or probed; §6 forbids the UI bundle and §8 forbids story changes |
| No number duplicated | **Yes** — 742 was reserved by 702's review; 743 and 744 hold their own scopes |
| Dirty-worktree manifest | **Conditional** — clean at `ebf25d748`. If `git status` is not clean at I0, complete `docs/orchestrator-dirty-worktree-manifest-template.md` for every entry before editing |

---

## Handoff

Execute from this saved path using `.claude/skills/execute-task/SKILL.md`. **Capture §13.2 step 2's "before" witness
before touching anything** — the inventory is gitignored and regenerating it destroys the evidence that this task
exists to fix. Then re-derive §3, write the pure function and its tests, and spend the one long rendered run last.
