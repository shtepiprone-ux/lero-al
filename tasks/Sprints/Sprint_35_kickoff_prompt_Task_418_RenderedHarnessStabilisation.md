# Sprint 35 — Task 418 — Rendered-harness stabilisation (blank-canvas / chunk-load flake elimination)

**Type:** Storybook / visual-snapshot harness (TOOLING — not product code) — **Slice 6a / harness-stabilisation prerequisite** (a precursor to Slice 6, NOT its completion: Slice 6 also covers NEW DOM assertions for button full-width + popup bottom-sheet, which this task does NOT add)
**Executor:** Sonnet 4.6
**Status:** OPEN — hand off now (filed as the mandatory follow-up from Task 417's Path-2 acceptance)
**Created by:** orchestrator, 2026-06-11, after 3 consecutive non-clean owner-native `screenshots:assert` runs on Task 417
**Reviewer:** Opus 4.7 orchestrator (diff review + owner-native multi-run stability proof)

> **Read `docs/agent-contract.md` (clauses 1–14) FIRST**, then the Storybook/visual-snapshot pre-read below. If anything is ambiguous, STOP & ASK — do not weaken the gate to make it pass.

---

## Why this task exists

`scripts/check-stories-rendered.mjs` (the `screenshots:assert` gate) produces **non-deterministic** FAILs that are **not real defects**. On Task 417, three consecutive owner-native runs each failed 1–2 *different* cells:

| Run | Failed cells | failReason | pageErrors | consoleErrors |
|---|---|---|---|---|
| 1 | `Input/Default×sq×desktop-1024`, `AdminSidebar/Desktop×it×huge-2560` | blank-canvas | none | none |
| 2 | `AdminExchangeProvidersManager/Default×en×desktop-1024` | blank-canvas | none | none |
| 3 | `AdminPageShell/Default×sq×desktop-1440`, `AdminTable/Default×sq×canonical-1200` | chunk-load / blank-canvas | none | none |

5 distinct cells, never repeating, all at `≥640`, mostly on surfaces the task never touched. Same family seen on Task 416 (`FilterBar` chunk-load) and Task 414 (`Sheet` chunk-load, `ERR_NO_BUFFER_SPACE`). **Root symptom:** the screenshot is captured before the story iframe has fully loaded its dynamically-imported chunk / painted the canvas — a render/serve race, not a layout failure. This flake undermines the clause-12/13 rendered-evidence gate for every UI task: a clean 2520/2520 is currently unachievable on demand.

**Goal:** make the gate **deterministic** — a real responsive/overflow/error defect still FAILs reliably; a transient blank-canvas / chunk-load no longer does.

---

## Scope (and NOT)

**In scope — `scripts/check-stories-rendered.mjs` only** (plus, if strictly required, the static-serve helper it spawns and `package.json` script wiring):

1. **Retry-on-transient.** When a cell's failReason is **`blank-canvas`** OR a **module-fetch render failure** (`sb-show-errordisplay` whose message matches `Failed to fetch dynamically imported module` / chunk-load), AND there are **no `pageErrors`, no `consoleErrors`, and no overflow detected**, RE-NAVIGATE + re-capture that single cell up to **N=3** attempts (small backoff) before deciding. Mark FAIL only if it still fails after all retries.
2. **Readiness wait before capture.** Before screenshotting, wait for the story root to be actually rendered: Storybook `storyRendered`/`#storybook-root` non-empty AND canvas not blank (e.g. a non-empty bounding box / non-uniform pixel check) AND no pending `sb-show-errordisplay`, with a bounded timeout. This is the primary fix; retry is the safety net.
3. **Stable serving.** Ensure the static `storybook-static` server the harness hits (port 6008) is fully up and serving chunks before the run starts (readiness ping), and is torn down cleanly. **Port-cleanup safety (mandatory):** the harness may tear down **only the server process it itself spawned** (track its PID/handle) or use the existing safe cleanup path — it MUST NOT kill an arbitrary process occupying 6008. **If port 6008 is occupied by an unknown/foreign process, do NOT kill it** — fail fast with a clear instruction to the operator (e.g. "port 6008 in use by a non-harness process; free it and rerun"). On `ERR_NO_BUFFER_SPACE`/chunk 404s from the harness's own server, retry rather than emitting a false FAIL.
4. **Transparency.** Log per-cell retry counts and a run summary line: `flaky-recovered: <n>` (cells that passed only after retry) so recurring instability stays visible instead of being silently masked.

**NOT in scope:**
- **No product code, no `*.stories.tsx`, no locale files, no design-system docs.** Tooling only.
- **No weakening of real assertions.** Overflow at `<640`, horizontal scroll, `pageError`/`consoleError`, and deterministic `sb-show-errordisplay` that are NOT transient module-fetch failures MUST still FAIL. Retry applies ONLY to the transient classes in (1) with no error signal.
- **No reduction of stories/viewports/locales**, no change to the 45×14×4 = 2520 matrix shape.
- **No blanket "retry the whole run".** Retry is per-cell and bounded; a cell that fails deterministically must not be retried into a false pass.

If achieving determinism would require touching anything outside the harness, STOP & ASK.

---

## Pre-read (per `docs/rule-index.md` — Storybook / visual-snapshot task)

**Always required:** `docs/agent-contract.md` (clauses 1–14), `docs/backlog.md`.
**Required:**
- `docs/storybook-governance.md` (§14 enforced gates, §MQ machine-detection limits).
- `docs/responsive-screenshot-governance.md` (§MQ — what the harness can/can't prove).
- `docs/design-system.md §27` (Storybook responsive-proof contract — what `screenshots:assert` does and does NOT prove).
- `docs/qa-rules.md`.
- **Reference:** `scripts/check-stories-rendered.mjs` itself (current navigate→assert→capture loop, the `failReason` taxonomy, the `ASSERT_STORIES` list).

Do not read beyond this set.

---

## Positive flow (happy path)

1. Read the pre-read + the current harness script; document the exact capture sequence and the `failReason` values it can emit.
2. Add the readiness wait (2) and the bounded per-cell retry on the transient classes (1); add stable-serve readiness/teardown (3); add the `flaky-recovered` summary (4).
3. Run `npm run screenshots:assert` and confirm a clean **2520/2520** with `flaky-recovered` reported as needed.
4. **Stability proof:** run it **3× back-to-back** → all three **2520/2520, 0 FAIL** (the determinism this task exists to deliver). Paste all three transcripts.
5. **Negative-flow proof (gate is not a no-op):** temporarily plant (a) a real `<640` overflow in one story and (b) a thrown render error in another → confirm each still FAILs *after* retries (retry does not mask real defects); then revert the plants and confirm green. Paste the transcripts.
6. Update `docs/backlog.md` + write a session log (before/after harness behavior, the retry/readiness logic, all transcripts, Files-Changed table). Emit NO git commands.

## Negative flow (every off-happy-path branch)

- **A real overflow/error cell gets retried into a false pass** → TASK FAILURE. Retry must be gated strictly on transient-no-error classes; the negative-flow proof (step 5) must show real defects still FAIL.
- **Retry loops unbounded / run time explodes** → cap at N=3 per cell with backoff; a cell failing all retries is a FAIL.
- **Readiness wait hangs** → bounded timeout; on timeout the cell is captured and assessed normally (and may FAIL).
- **Determinism not achieved** (a 3× run still flakes) → do NOT lower thresholds to force green; report findings and STOP & ASK — the fix may need a different serve strategy.
- **Killing an unknown process on port 6008** → forbidden. Only the harness-spawned server may be torn down; a foreign occupant means fail-fast with a clear operator instruction, never a kill.
- **Scope creep** into product/story/locale files → forbidden; harness only.

---

## Required validation (paste transcripts in the session log)

- `node --check scripts/check-stories-rendered.mjs` → clean; `npx tsc --noEmit` → 0 new errors.
- `npm run lint` → 0 new errors/warnings.
- `npm run build-storybook` → builds.
- `npm run screenshots:assert` **×3 back-to-back → 2520/2520, 0 FAIL each** (stability proof) + the `flaky-recovered` line.
- **Negative-flow transcripts:** planted overflow FAILs; planted render error FAILs; both green after revert.
- **File-integrity (clause 14)** on every touched file: 0 NUL, no BOM, `node --check`/`tsc` clean, tails re-read.

---

## Acceptance criteria

- `screenshots:assert` is deterministic: **3 consecutive runs = 2520/2520, 0 FAIL**, with transient blank-canvas/chunk-load cells recovered via bounded per-cell retry + readiness wait (count surfaced as `flaky-recovered`).
- Real defects still FAIL: negative-flow proof shows planted `<640` overflow and planted render error both FAIL after retries; gate is not a no-op.
- **Harness only** — no product/story/locale/design-system changes; matrix shape unchanged (45×14×4 = 2520); no assertion weakened.
- `tsc=0 new`, `lint=0 new`, `build-storybook` builds, file-integrity GREEN.
- `docs/backlog.md` + session log updated; Files-Changed table matches the real diff. Executor emits NO git commands.

## Final report required from Sonnet

1. Before/after harness behavior (capture sequence, readiness wait, retry gating, serve readiness).
2. The 3× stability transcripts + `flaky-recovered` counts.
3. The negative-flow transcripts (planted overflow + planted error both FAIL; green after revert).
4. Validation + file-integrity transcripts.
5. Files-Changed table.
6. Confirmations: harness-only; no assertion weakened; matrix shape unchanged; no git commands.

## Ordering

418 (this, = **Slice 6a**) → orchestrator diff review + owner-native 3× stability proof → commit. Then **Slice 4b** (admin shell §26.1), **Slice 5** (public/listing/system). With a deterministic gate, Slice 4b+ get a clean 2520/2520 close instead of flake-chasing. **Slice 6 proper remains open and separate** — adding NEW DOM assertions for button full-width + popup bottom-sheet is NOT in this task; 418 only stabilises the existing gate so that future work (incl. Slice 6's new assertions) runs deterministically. Then resume Epic JJ 408 → 407.
