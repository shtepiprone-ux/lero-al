# Task 467 — Repair the Storybook rendered-proof harness: systemic false-NEGATIVES (visually broken stories scored PASS)

> **Executor:** Sonnet 4.6. **Type:** Storybook / visual-snapshot harness (tooling) — HARNESS ONLY.
> **Orchestrator:** Opus 4.8. **Opened:** 2026-06-19. **Builds on:** Task 464 (committed `5c2edabae`).
> **Owner P0 REWORK.** The Task 464 gate reports `1068/1068 PASS` while owner-native screenshots show
> **multiple visibly broken stories** (clipped controls, off-viewport elements, overlapping action rows,
> truncated button/tab/select text, bottom-sheet content overflow with unreachable controls). `NotificationCenter`
> was only ONE example — the defect is systemic. **The current `screenshots:assert` gate therefore CANNOT be
> treated as authoritative proof for Task 463 or any later task** until this harness is repaired.

> ## 🔴 SCOPE BOUNDARY — READ FIRST (owner decision 2026-06-19: "Split: harness first, then fixes")
> **Task 467 repairs the HARNESS ONLY. It does NOT fix product/story layout defects.** Concretely:
> - ✅ IN SCOPE: rework `scripts/check-stories-rendered.mjs` (+ any new helper module it imports), add **planted
>   test stories** that intentionally reproduce generic defect classes, add an **allowlist** for intentional
>   overlaps, produce a **machine + human defect inventory**, update governance docs, update the manifest.
> - ❌ OUT OF SCOPE: changing any product component's layout/classes to FIX a discovered defect. Do **not** touch
>   `src/components/**`, `src/modules/**`, `app/**` to fix layout. Every REAL defect the repaired harness finds is
>   **recorded in the inventory and filed as a follow-up task** — NOT fixed here.
> - **Planted stories must be SELF-CONTAINED.** Build them entirely inside `src/stories/PlantedVisualViolations.stories.tsx`
>   (inline markup/components) so they need NO product-source change. Adding a `data-testid`/`data-slot` to an
>   existing product component is allowed ONLY if a planted story genuinely cannot anchor otherwise — it must be
>   attribute-only and **explicitly justified in the session log**. Default expectation: zero product-source edits.
> - **Acceptance is NOT a green 1068/1068 matrix.** After this fix the full run is EXPECTED to FAIL on the real
>   broken stories — that failing run *is* the deliverable (it produces the inventory). Forcing the matrix green by
>   weakening a check, or by editing product layout, is a TASK FAILURE. STOP and ASK if tempted.

> ## ⚖️ FALSE-POSITIVE DISCIPLINE (owner R2, 2026-06-19) — a noisy detector is as broken as a no-op
> A geometry detector that fires on normal UI is just as useless as one that passes everything. These guards are
> MANDATORY, not optional tuning (full detail in rules 3 & 5 below):
> - **`offscreen-control`:** horizontal offscreen = fail-closed; vertical-below-the-fold is NOT a failure unless the
>   element is unreachable by normal scrolling or escapes a fixed/dialog/sheet/non-scrollable surface.
> - **`element-overlap`:** apply algorithmic exclusions FIRST (ancestor/descendant, label↔input, aria-hidden/inert/
>   hidden, closed popover/menu/dialog layers, `pointer-events:none` decoration, outline/focus-ring/box-shadow-only).
> - **`text-clipped`:** inspect the nearest visible text-bearing descendant, not the root; icon-only + valid
>   `aria-label` ≠ clipped.
> - **Ambiguous → inventory, not a halt:** record `needs-owner-decision`; never silently allowlist; never force green.
> - **Known-good false-positive guard** must pass; every threshold/allowlist entry carries a documented reason.

---

## Pre-read (rule-index → "Storybook / visual snapshot task")

**Always required:** `docs/agent-contract.md` · `docs/backlog.md` · `docs/critical-flow-registry.md` (the
`storybook-rendered-proof` row added by Task 464 — this task strengthens that same gate).

**Required:** `docs/storybook-governance.md` (§14 enforced gates, §14.4.1 rendered-proof contract added by Task 464) ·
`docs/storybook-visual-snapshots.md` · `docs/component-rules.md` · `docs/qa-rules.md` · `docs/design-system.md` (§24
forbidden hardcodes, §26 mobile <640 full-width + bottom-sheet gate, §27 what `screenshots:assert` does/does NOT prove).

**Only if relevant:** `docs/responsive-screenshot-governance.md §MQ` · `docs/responsive-screenshot-matrix.md`.

**Editable docs:** `docs/storybook-governance.md`, `docs/critical-flow-registry.md`, a NEW inventory report under
`docs/governance-reports/`, `docs/backlog.md` (orchestrator-owned — coordinate), and the session log. **Do not** read
or edit anything outside this list, and do **not** fix product layout (scope boundary above).

---

## Problem statement (the false-negative class)

Task 464 closed the false-POSITIVE class (spinner/blank/empty/wrong-story scored PASS). It did NOT close the
false-NEGATIVE class: a story that **renders real content and passes anchors** but is **visually broken** still
scores PASS, because the current visual assertions are too coarse:

1. **Overflow is document-level only.** Assertion (b)/(the overflow check) measures page `scrollWidth > viewport`
   (horizontal-scroll at 320). It does NOT catch an element that is clipped *inside* its own box, overlaps a
   sibling, sits half-outside a bottom-sheet, or has its label truncated — none of those grow the document width.
2. **Full-width is class/width only.** The `max-sm:w-full` check confirms a control's box spans the frame; it says
   nothing about whether the control's **text is clipped**, whether two controls **collide**, or whether a control
   is pushed **off-viewport** or **outside its clipping container**.
3. **Coverage is the `ASSERT_STORIES` subset.** Geometry/visual integrity is only ever evaluated on the curated
   `ASSERT_STORIES` list — every other rendered story gets no visual-integrity check at all.
4. **No element-geometry layer.** There is no per-element bounding-box reasoning (rect vs container, rect vs
   viewport, rect vs rect overlap, content-box vs scroll-box truncation), which is exactly what the owner's broken
   screenshots show.

**Root-cause summary to fix (do not re-derive — confirm against the harness, then implement):** add a **fail-closed,
element-geometry visual-integrity layer that runs on EVERY rendered story** at mobile viewports × all four locales,
on top of Task 464's loader/blank/empty/anchor layer.

---

## Current behavior to PRESERVE (do not regress — Task 464 contract stays intact)

- All Task 464 hard-fails stay: `loader-only`, `blank-canvas`, `empty-canvas`, `blank-screenshot`, `anchor-missing`,
  and the rendered-proof-before-visual-gates ordering. The new geometry layer runs as part of (or immediately after)
  the existing visual-gate phase — i.e. ONLY once rendered-proof (layer 1) has passed for the cell.
- Existing assertions (a)–(e), `assertScreenshotHasMeaningfulPixels`, `assertAnchors`, `LOADER_ALLOWLIST`,
  `ASSERT_STORIES.anchors`, the manifest `visualContentCheck` + `summary` counters, and the `isTransientFailure`
  exclusion set all stay and keep working.
- `--fast`, `--check`, the static-server lifecycle, port-6008 handling, `finally` teardown, retry/`MAX_ATTEMPTS`
  unchanged in contract.
- Manifest stays backward-compatible: existing field names/shapes unchanged; new fields are additive.
- The blank-PNG self-test (Task 464) still runs at start and still aborts the run on regression.

## Required after behavior (action by action — implement ALL)

1. **Global audit — assert on EVERY rendered story, not just `ASSERT_STORIES`.** Enumerate all story ids present in
   the built `storybook-static` index (the same source Storybook uses to list stories), and run the visual-integrity
   layer on **every** story at the mobile stress viewports (**320 / 375 / 390**) × **all four locales (sq · en · uk ·
   it)**. `ASSERT_STORIES` keeps its stricter *anchor* requirements; the new geometry layer applies to the full
   universe of stories. (Desktop-only stories CSS-hidden below their breakpoint are handled by rule 5's allowlist /
   `minViewport`, not by silently skipping.)

2. **Define the "visible interactive/control element" set** the geometry rules target, and document it in code:
   native `button, a[href], input, select, textarea, [role=button], [role=link], [role=tab], [role=menuitem],
   [role=option], [role=switch], [role=checkbox]`, plus canonical `data-slot` triggers (`button`, `select-trigger`,
   `combobox`/`combobox-trigger`, `menu-trigger`, `tab`, `password-input`, …) and any element with an `aria-label`
   that is actionable. "Visible" = non-zero box AND not `display:none`/`visibility:hidden`/`opacity:0`/`aria-hidden`.

3. **Fail-closed element-geometry / visual-integrity assertions.** Using Playwright in-page evaluation
   (`getBoundingClientRect`, `scrollWidth/clientWidth`, computed `overflow`/`text-overflow`, nearest-clipping-ancestor
   walk), detect **at minimum** each of the following on visible interactive elements; each detection sets the cell
   `pass=false` with a distinct `failReason` + the failing selector/label:
   - **`text-clipped`** — text inside a button / link / tab / select trigger / combobox trigger / menu item is
     visually truncated. **Inspect the nearest visible TEXT-BEARING descendant** (the `span`/`Slot`/`SelectValue`/
     `DropdownMenuItem`/flex child that actually holds the label), NOT only the root control — text usually lives in a
     child, so `scrollWidth > clientWidth` on the root button alone both misses real clips and trips on padding. Fail
     when that text node's `scrollWidth > clientWidth` (or `scrollHeight > clientHeight`) while its container's
     `overflow` is `hidden`/`clip` and there is no *intended* ellipsis affordance (or the label is cut mid-glyph).
     **Icon-only controls with a valid `aria-label` are NOT `text-clipped`** unless their visible text-bearing child
     is itself clipped. **Intentional ellipsis is allowed ONLY when** the full accessible name remains available
     (`aria-label`/title intact) AND the story/selector is explicitly allowlisted. Long sq/en/**uk**/it labels are the
     stress case.
   - **`self-clipped`** — an element's own content box clips its visible actionable content (`scroll size > client
     size` with hidden overflow) such that part of a control is not shown.
   - **`offscreen-control`** — a visible interactive element is unreachably outside the frame. **Horizontal offscreen
     is fail-closed:** `right > vw` or `left < 0` for a visible control FAILs. **Vertical offscreen is NOT automatic:**
     an element below the initial viewport in normal document flow is FINE if it can be scrolled fully into view —
     before reporting a vertical failure, confirm the element CANNOT be brought into view by normal page/surface
     scrolling. Vertical FAIL only when the element is unreachable by normal scrolling, OR it escapes a
     **fixed / sticky / dialog / bottom-sheet / non-scrollable clipping surface** (its bottom is past that surface's
     reachable area). Do NOT fail every element that merely sits below the fold.
   - **`outside-container`** — a visible interactive element's rect extends beyond its **nearest clipping ancestor**
     (an ancestor with `overflow` `hidden`/`auto`/`clip`) / sheet / dialog content box (i.e. the control is cut by,
     or escapes, the surface that should contain it).
   - **`element-overlap`** (incl. header / action-row collision) — two **visible interactive** elements' rects
     intersect beyond a small tolerance. This is the highest false-positive risk, so it MUST apply these
     **algorithmic exclusions BEFORE the manual allowlist** (a pair matching any of these is NOT a collision):
     ancestor/descendant pairs; label↔input ownership pairs (`<label for>` / wrapping label); any element that is
     `aria-hidden` / `inert` / `hidden` / zero-box; elements belonging to a **closed** popover / menu / dialog layer;
     decorative overlays with `pointer-events:none`; and overlap area caused ONLY by focus ring / `outline` /
     `box-shadow` (compare border-box rects, not the painted outline). After these exclusions, a real interactive
     collision (e.g. an action row overlapping a sticky header, two buttons stacked on the same pixels) that is not
     allowlisted still FAILs. Action rows and sticky headers colliding with content are the canonical true positive.
   - **`bottomsheet-overflow`** — at `<640`, a bottom-sheet/dialog whose interactive content exceeds the sheet's
     reachable area (content height beyond the `~90dvh` scrollable region, or a control clipped by the sheet edge so
     it is unreachable). A bottom sheet that loses a reachable control FAILS.
   - Plus the **existing** Task 464 layer (`loader-only` / `blank-canvas` / `empty-canvas` / `blank-screenshot` /
     `anchor-missing`) — unchanged, evaluated first.

4. **Defect report / authoritative inventory.** Every failing cell MUST be recorded with: `storyId`, `locale`,
   `viewport`, `screenshot` (path), `failReason` (failure type), and `failingSelector` / `failingLabel` when
   available. Emit BOTH:
   - machine: per-cell entries in `manifest.json` (additive `visualIntegrity` block + the new `summary` counters);
   - human: a markdown inventory at **`docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md`**
     — one row per failing cell (story · locale · viewport · failReason · selector/label · screenshot path),
     grouped by component/story, so the orchestrator can seed follow-up product-fix tasks from it. This inventory IS
     the primary deliverable of the failing full run.

5. **Allowlist for INTENTIONAL overlaps/decoration + thresholds (fail-closed, justified).**
   - Add a documented allowlist (analogous to `LOADER_ALLOWLIST`) keyed by `storyId` (+ optional selector + reason)
     for **intended** overlaps/escapes: badge-on-avatar, drag-handle on a sheet, sticky bar by design, absolutely
     positioned decorations, `minViewport` desktop-only stories. Anything NOT allowlisted that trips a rule = FAIL.
   - **Ambiguous cases go to the inventory, NOT to a mid-run halt.** If a case could be intentional or a real defect,
     do NOT silently allowlist it and do NOT force the matrix green — record it as `needs-owner-decision` (failReason
     `ambiguous-overlap`) in a SEPARATE section of the inventory with the screenshot + the measured rects, and do not
     commit any allowlist entry for it. The owner triages those after the run. (This replaces a blocking "STOP and
     ASK" so the full run still completes and the inventory is produced.)
   - Thresholds must be **conservative and empirically justified** (Task 464 bitmap-threshold precedent): use a small
     sub-pixel rounding tolerance (~1px) for rect comparisons to avoid anti-aliasing flakiness, and record in the
     session log the measured rects of a **known-good** element vs a **planted-broken** element so the band is
     documented. No magic numbers without the side-by-side evidence.
   - **False-positive guard:** assemble a small set of stories the owner/orchestrator consider visually correct
     (e.g. `primitives-button--default`, `primitives-checkbox--default`, a known-good simple admin row) and prove the
     new rules do NOT trip on them. A rule that fires on known-good UI is too strict → tune or allowlist with
     justification (documented), never by disabling the rule.

6. **Manifest + transient handling.** Each cell gains a `visualIntegrity` block `{ pass, violations: [{ failReason,
   selector, label }] }`. The top-level `summary` ADDS counters: `textClipped`, `selfClipped`, `offscreenControl`,
   `outsideContainer`, `elementOverlap`, `bottomsheetOverflow`, **and `ambiguousOverlap`** (keep all Task 464
   counters). Every hard failReason is a real defect → add ALL of them to the `isTransientFailure` exclusion set
   (never retried into a pass). **`ambiguous-overlap` is a THIRD state:** it does NOT count as a clean PASS (so the
   cell can never be cited as green proof) and does NOT auto-classify the story as a product defect — it is surfaced
   in the `needs-owner-decision` inventory section for owner triage.

7. **Run the full matrix and PRODUCE THE INVENTORY.** After the harness can fail the planted generic violations
   (next section), run the **full** `screenshots:assert` (not `--fast`) across all stories × 320/375/390 × sq/en/uk/it.
   The run is EXPECTED to FAIL on real broken stories; capture that output and write the inventory (rule 4). As a
   sanity check, the inventory MUST include the owner-flagged `NotificationCenter` cells (the harness must now catch
   the known examples). Do NOT fix the product — record and stop.

---

## Positive flow (happy path = the harness behaves correctly)

- **Actor:** CI / executor running `npm run build-storybook && npm run screenshots:assert`.
- **Steps & system response:**
  1. Static server on 6008; blank-PNG self-test passes (Task 464) or the run aborts.
  2. Enumerate ALL stories from the built index. For each story × {320,375,390} × {sq,en,uk,it}: navigate, run the
     Task 464 rendered-proof layer, then (only if it passes) the new geometry/visual-integrity layer, screenshot.
  3. A visually-sound story (real content, anchors where required, no geometry violation, not over-allowlisted) →
     cell `pass=true`.
  4. A story with any geometry violation → cell `pass=false` with the precise `failReason` + selector/label, written
     to the manifest and the markdown inventory.
- **Success state:** the harness's OWN behavior is correct — planted violations FAIL, known-good stories PASS, and
  every real broken story is captured in the inventory. (A non-green product matrix is the expected, correct output.)

## Negative flow (every off-happy-path branch — each needs a verifiable code path)

- **Planted clipped button text** → `text-clipped` FAIL; not transient; exit 1.
- **Planted action-row / header collision** → `element-overlap` FAIL.
- **Planted element extending outside the viewport** → `offscreen-control` FAIL.
- **Planted element clipped by a bottom-sheet / clipping container** → `outside-container` or `bottomsheet-overflow` FAIL.
- **Task 464 classes** (spinner / empty / blank / anchor-missing) → still FAIL exactly as before.
- **Allowlisted intentional overlap** (badge-on-avatar, drag-handle) → NOT failed (documented allowlist entry).
- **Known-good simple control** → PASS (false-positive guard).
- **Ambiguous overlap with no allowlist decision** → run records it as `ambiguous-overlap` / `needs-owner-decision`
  in the separate inventory section with screenshot + measured rects; it is not a clean PASS, not auto-classified as
  a product defect, and is never silently allowlisted. The run COMPLETES (no mid-run halt).
- **Genuine transient (chunk-load flake):** retried up to `MAX_ATTEMPTS`; no geometry failReason is ever retried.
- **`storybook-static/` missing / port 6008 in use / `--check`:** existing behavior preserved.

---

## Mobile <640 full-width gate (OWNER P0)

This task strengthens the harness that PROVES the mobile gate. The new layer specifically targets the `<640`
failure modes the owner observed (clipped/overlapping/off-sheet controls). Any `data-testid`/`data-slot` added for a
PLANTED story must be attribute-only and must not alter product layout. The repaired harness must keep enforcing the
existing full-width/bottom-sheet assertions, now plus element-geometry integrity, at 320/375/390 × sq/en/uk/it.

## Rendered verification matrix (REQUIRED in the session log — agent-contract clause 12)

Paste the machine matrix proving the harness's OWN correctness: the planted-good stories PASS and the planted-broken
stories FAIL at 320/375/390 × sq/en/uk/it, with `uk@320/375/390` mandatory. (The product full-matrix run is the
inventory, recorded separately — it is expected to contain failures.)

## Negative-gate proof (the gate must be REAL — planted violations REQUIRED, GENERIC classes)

Add planted test stories (a dedicated `*.stories.tsx` under `src/stories/`), run the gate, paste the transcript, then
keep them (they are the standing proof) or guard them behind a planted-only namespace. Prove EACH generic class fails:
1. **Clipped button text** — a button with a long label forced to `overflow-hidden` narrow box → `text-clipped` FAIL.
2. **Action-row collision** — two interactive elements forced to overlap → `element-overlap` FAIL.
3. **Off-viewport control** — a control positioned partly beyond the 320 frame → `offscreen-control` FAIL.
4. **Container/bottom-sheet clip** — a control escaping/clipped by an `overflow-hidden` parent or a bottom-sheet edge
   → `outside-container` / `bottomsheet-overflow` FAIL.
5. **Task 464 classes still fail** — spinner-only / empty-canvas / anchor-missing remain FAIL (regression guard).
6. **Known-good control passes** — a correct button/row does NOT trip any new rule (false-positive guard).

**For EACH planted broken story, the proof is incomplete without BOTH halves:** (a) the **OLD** Task 464 harness at
commit **`5c2edabae`** scores that cell **PASS** (run it against the old script to demonstrate the false-negative it
let through), AND (b) the **NEW** Task 467 harness scores the SAME cell **FAIL** with the expected `failReason`.
OLD-PASS proves the false-negative class was real; NEW-FAIL proves it's now closed. NEW-FAIL alone (without OLD-PASS)
only shows the gate can fail a synthetic story — it does NOT prove the class was fixed.

## Regression coverage (agent-contract clause 15)

Update the `storybook-rendered-proof` row in `docs/critical-flow-registry.md`: rendered-proof now ALSO requires
element-geometry visual integrity (text-clipped / self-clipped / offscreen-control / outside-container /
element-overlap / bottomsheet-overflow), with the planted-violation transcripts as the standing proof the gate is not
a no-op. Baseline: OLD harness (`5c2edabae`) PASSES the visually-broken cells; NEW harness FAILS them.

## Governance-doc update (REQUIRED)

`docs/storybook-governance.md`: extend the rendered-proof contract — **a screenshot is NOT proof unless, in addition
to the Task 464 five points, every visible interactive element also passes geometry/visual-integrity (no clipped
text, no self-clip, no off-viewport control, no escape-outside-container, no unexpected overlap, no bottom-sheet
control loss) at 320/375/390 × sq/en/uk/it.** State plainly that the pre-467 gate could report PASS on visually
broken stories and must not be cited as proof for Task 463 or later until 467 is committed and the tree is green.

---

## Acceptance criteria (every item verifiable in the diff / transcript)

- [ ] **AC1** — The geometry layer runs on EVERY rendered story (global enumeration), not only `ASSERT_STORIES`, at
      320/375/390 × sq/en/uk/it. [diff + run transcript]
- [ ] **AC2** — Planted clipped button text FAILs with `text-clipped`. [proof 1]
- [ ] **AC3** — Planted action-row/header collision FAILs with `element-overlap`. [proof 2]
- [ ] **AC4** — Planted off-viewport control FAILs with `offscreen-control`. [proof 3]
- [ ] **AC5** — Planted container/bottom-sheet clip FAILs with `outside-container` / `bottomsheet-overflow`. [proof 4]
- [ ] **AC6** — Task 464 classes (loader-only/blank-canvas/empty-canvas/blank-screenshot/anchor-missing) still FAIL;
      `isTransientFailure` excludes ALL old + new failReasons. [proof 5 + diff]
- [ ] **AC7** — Known-good simple controls PASS (false-positive guard), with the documented allowlist + ~1px tolerance
      and the known-good-vs-planted rect evidence in the log. [proof 6]
- [ ] **AC8** — Each failing cell records `storyId`, `locale`, `viewport`, `screenshot`, `failReason`, and
      selector/label; manifest gains `visualIntegrity` + the **seven** new `summary` counters (`textClipped`,
      `selfClipped`, `offscreenControl`, `outsideContainer`, `elementOverlap`, `bottomsheetOverflow`,
      `ambiguousOverlap`). [manifest sample]
- [ ] **AC9** — The full (non-`--fast`) matrix was run and the human inventory
      `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` lists every real failing cell,
      INCLUDING the owner-flagged `NotificationCenter` cells. [inventory file]
- [ ] **AC10** — HARNESS ONLY: no product component layout/className changed to fix a defect; any added
      `data-testid`/`data-slot` is attribute-only and serves a PLANTED story. The matrix is NOT forced green. [diff]
- [ ] **AC11** — `critical-flow-registry.md` + `storybook-governance.md` updated (geometry integrity is part of
      rendered-proof; pre-467 gate not citable as proof). [diff]
- [ ] **AC12** — Ambiguous intentional-vs-defect overlaps are recorded as `needs-owner-decision`/`ambiguous-overlap`
      in a separate inventory section (third state: not green, not auto-defect) — never silently allowlisted, never
      force-greened. [inventory + manifest counter]
- [ ] **AC13** — For every planted broken story: OLD harness at `5c2edabae` = PASS and NEW harness = FAIL with the
      expected failReason (both halves pasted). [proofs 1–4]
- [ ] **AC14** — False-positive discipline implemented: `offscreen-control` vertical-reachability rule;
      `element-overlap` algorithmic exclusions (ancestor/descendant, label↔input, aria-hidden/inert/hidden, closed
      overlay layers, pointer-events:none, outline/focus-ring/box-shadow-only); `text-clipped` nearest-text-descendant
      + icon-only-aria exemption. [diff]

## 🔴 Approval blockers (orchestrator review gate — do NOT waive)

1. **Real planted-violation transcripts with OLD-PASS + NEW-FAIL** — for every planted broken class, the OLD harness
   at `5c2edabae` scores the cell PASS and the NEW harness scores it FAIL with the expected `failReason`; plus the
   known-good PASS and the Task 464 classes still FAIL. Pasted, not described. NEW-FAIL without OLD-PASS = incomplete.
2. **Geometry thresholds empirically justified** — known-good vs planted-broken rects side-by-side; the ~1px tolerance
   and any allowlist entry each carry a reason.
3. **Inventory present and non-empty** and includes the owner-flagged `NotificationCenter` examples (proves the
   harness now catches the known breakage).
4. **No product-layout fix and no force-greening** — confirmed in the diff. A green 1068/1068 here is a RED FLAG, not
   a pass (it would mean the checks are no-ops or product was silently edited).

## Hard contract (verified against the real diff on return)

No scope change beyond the harness + planted stories + docs (STOP and ASK if a real defect seems to need a product
edit — file it, don't fix it). No invented architecture. Run `node --check scripts/check-stories-rendered.mjs`,
`npx tsc --noEmit` → 0 new errors, `npm run check:stories`. **File-integrity (clause 14):** read back every written
file; 0 NUL bytes, parses/compiles, not truncated; paste the green transcript. Update `docs/backlog.md` + add
`docs/sessions/2026-06-19-task-467-storybook-geometry-visual-assertions.md` with the AC-by-AC self-audit table (cite
Positive AND Negative flows by name) and a **"Files Changed" table** (one row/path + rationale). **Do NOT run git /
emit `git add`/`git commit`** — the orchestrator emits commit commands after diff review (single-writer).

## Likely files touched (executor confirms in the Files Changed table)

- `scripts/check-stories-rendered.mjs` (+ optional new `scripts/lib/visual-integrity.mjs` helper) — global
  enumeration, geometry/visual-integrity assertions, allowlist, manifest `visualIntegrity` + counters,
  `isTransientFailure` exclusions.
- `src/stories/PlantedVisualViolations.stories.tsx` (NEW, planted test stories) — attribute-only anchors as needed.
- `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` (NEW) — authoritative inventory.
- `docs/storybook-governance.md` · `docs/critical-flow-registry.md` — rendered-proof contract extension.
- `docs/backlog.md` + `docs/sessions/2026-06-19-task-467-…md`.

> **Follow-up (orchestrator-owned, NOT this task):** once the inventory exists, the orchestrator opens product-layout
> fix tasks per component group (folding in Task 466 = ListingDetailView mobile). **Task 463 rendered-proof reliance
> stays BLOCKED until 467 is committed AND the committed tree passes the repaired harness** (i.e. the product fixes
> have landed).

---

## 🔁 REWORK required (R1–R3) — 2026-06-20, after orchestrator diff review (owner-confirmed)

The harness's core (catch false-NEGATIVES) is implemented and well-proven (planted 4-FAIL + known-good PASS, OLD-PASS@`5c2edabae`/NEW-FAIL, global enumeration, NotificationCenter caught, harness-only scope). Two **false-positive-discipline** items from the contract are NOT functionally met and BLOCK approval. Fix exactly these; stay harness-only (no product layout edits).

**R1 [P1 — AC12/AC8: the ambiguous THIRD-STATE is non-functional].** In `scripts/geometry-integrity.mjs` the `ambiguous`
array is declared (L22) and returned but **never populated** — nothing ever does `ambiguous.push(...)` — so the caller's
`ambiguousOverlap` counter (`check-stories-rendered.mjs:962`) is structurally always 0, and borderline cases instead land
in the 420 hard-FAILs (the two `needs-owner-decision` rows were hand-written into the inventory, not harness-emitted).
Implement the real third state:
- **Classify as AMBIGUOUS (push to `ambiguous`, NOT `violations`)** the borderline classes the contract calls out:
  - `element-overlap` where one party is a library-internal / decorative layer — e.g. an element whose `id` matches
    `base-ui`/`floating-ui`/`radix` internals, or a `position:absolute|fixed` element overlapping its own trigger/anchor
    → `failReason: 'ambiguous-overlap'`.
  - horizontal `offscreen-control` whose element has an ancestor with `overflow-x: auto|scroll` (reachable by horizontal
    scroll — carousel/scroll-tabs, e.g. RecentlyViewedSection) → `failReason: 'ambiguous-offscreen'`.
  Keep clear true-positives as hard `violations` (two real controls colliding; a control outside a NON-scrollable
  clipping container; action-row↔sticky-header collision).
- Each ambiguous entry carries `failReason`, `selector`, `label`, measured rects + a short `reason`.
- **Fix the caller's three-bucket accounting** so an ambiguous-only cell (`violations.length===0 && ambiguous.length>0`)
  is the genuine THIRD state per rule 6/AC12: it must **NOT** count as a clean PASS (cannot be cited as green proof) AND
  **NOT** as a hard product-defect FAIL. Today `geometry-integrity.mjs` returns `pass = filteredViolations.length===0`,
  so an ambiguous-only cell would read as a clean PASS — that is wrong. Make the cell resolve to the third bucket, feed
  the now-real `ambiguousOverlap`/`ambiguous` counter, and write those cells to the inventory's `needs-owner-decision`
  section **from the harness output** (not by hand).
- **Prove it:** add a planted ambiguous story (e.g. an intentional library-style internal overlap) → classified
  `ambiguous`, NOT hard-FAIL, NOT clean-PASS; paste the transcript. The known-good guard must still PASS and the 4 hard
  planted classes must still hard-FAIL (no regression of R-discipline).

**R2 [P2 — AC14/rule 3: text-clipped over-reports intentional ellipsis].** The text-clipped check fires on ANY
overflow-hidden text node with `scrollWidth > clientWidth`, with no `text-overflow`/accessible-name affordance — so
intentional `truncate` (e.g. the listing-title link, AdminSupportManager labels) inflates the hard `text-clipped` count.
Per rule 3: when an overflow-hidden clipped text node has computed `text-overflow: ellipsis` AND an intact accessible name
(visible `title`/`aria-label`, or it is a non-action content link rather than an action control), route it to the
**ambiguous** third state (`needs-owner-decision`), NOT a hard `text-clipped` FAIL — unless explicitly allowlisted (then
pass). A clip with NO ellipsis (cut mid-glyph) stays a hard `text-clipped` FAIL (true positive). Keep the existing
nearest-text-descendant walk + icon-only-aria exemption.

**R3 [verification] Re-run the full native matrix and REGENERATE the inventory into three buckets:** hard defects (true
positives only), `needs-owner-decision` (harness-emitted ambiguous — now incl. the Base-UI passwordinput overlap, the
RecentlyViewed carousel, and intentional-ellipsis truncations), and pass. Confirm the hard-defect count dropped relative
to the current 420 (the intentional/ambiguous cases moved out of hard-FAIL), and that `ambiguousOverlap` is now > 0 and
non-empty. The authoritative full run is the owner's NATIVE run on the committed tree; paste the `--fast` planted-proof
matrix (incl. the new ambiguous proof + uk@320/375/390) in the session log. Update the inventory file,
`docs/critical-flow-registry.md` and `docs/storybook-governance.md` to describe the third state. Still **HARNESS ONLY** —
do not fix product layout; record real defects as follow-up tasks. Do NOT run/emit git.

---

## 🔁 R3 NOT COMPLETE — finish exactly these two items (orchestrator diff review 2026-06-20, owner native-confirmed)

R1 (ambiguous third-state) and R2 (ellipsis → ambiguous) are **verified done in the real code** (`geometry-integrity.mjs`
`ambiguous` populated + `pass`/`ambiguousOnly` three buckets; `check-stories-rendered.mjs` L948/L969/L1028–1036; all 7
planted stories present incl. `AmbiguousOverlap` + `IntentionalEllipsis`). **R3 is partial.** The session log reports the
re-run numbers (396 hard / 48 ambiguousOnly / 227 ambiguousOverlap) but the deliverable inventory was never regenerated.
Owner native check 2026-06-20: `Select-String "420|396|ambiguousOverlap|ambiguousOnly"` on the inventory returns only
`| FAIL | 420 |`. Fix exactly these — **HARNESS/DOCS ONLY, no product layout edits, do NOT run/emit git:**

**C1 [R3 / AC9 / AC12 — regenerate the inventory from harness output].** Rewrite
`docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` to reflect the actual R1–R3 re-run:
- Summary table: total **1152**, PASS **708**, hard FAIL **396** (not 420), plus the new rows `ambiguousOnly` **48** and
  `ambiguousOverlap` **227** (and keep per-reason counters: textClipped 359, offscreenControl 204, outsideContainer 233,
  elementOverlap 108, bottomsheetOverflow 71).
- **Three buckets, harness-emitted (NOT hand-written):** (a) **Hard defects** (true positives only), (b)
  **needs-owner-decision** (the `ambiguousOnly` cells the harness now emits — incl. the Base-UI `passwordinput` overlap,
  the `RecentlyViewed` carousel offscreen, and the intentional-ellipsis truncations), (c) pass. The current prose
  "Needs-owner-decision" section must be replaced by the harness's emitted ambiguous rows (storyId · locale · viewport ·
  failReason · selector/label), so the section is reproducible from a re-run, not authored by hand.
- Add the two new planted ambiguous stories to the planted-proof table.
- The numbers must match the manifest/console of the same `--fast` run cited in the session log (no divergence between
  log and inventory). Authoritative full run stays the owner's NATIVE run.

**C2 [AC5 / approval-blocker 1 — restore the `outside-container` planted proof].** The planted `ContainerClipped` story
now FAILs as `text-clipped`, not `outside-container`: its width-200 button inside a width-100 `overflow:hidden` parent
trips the text-clipped walk on the narrow parent first, and `geometry-integrity.mjs` L279–282 then dedups
`outside-container` away. Result: the container-escape class has **no standing planted proof** (it only fires on real
product cells). Restore a dedicated planted proof for `outside-container` / `bottomsheet-overflow` — e.g. a control with a
**short, non-clipping label** that escapes a clipping ancestor (so the text-clipped condition `scrollWidth>clientWidth`
does NOT fire first), partially overhanging the clip box. Re-run and paste OLD-PASS@`5c2edabae` + NEW-FAIL with
`failReason: outside-container` (or `bottomsheet-overflow`). Do **not** remove or weaken the L279–282 dedup; just make the
planted story exercise the container-escape path distinctly. Keep all 4 existing hard classes + known-good + the 2
ambiguous proofs green.

**Acceptance for closing R3:** (1) inventory `Select-String "420|396|ambiguousOverlap|ambiguousOnly"` shows `396`,
`ambiguousOverlap`, `ambiguousOnly` and NOT `420`; (2) the needs-owner-decision section is harness-emitted rows;
(3) a planted story FAILs with `outside-container`/`bottomsheet-overflow` (OLD-PASS + NEW-FAIL pasted); (4) session log +
inventory numbers match; (5) gates green (`node --check`, `tsc --noEmit`, `check:stories`); file-integrity transcript
pasted. Orchestrator re-reviews the real files; owner runs the native authoritative pass.

> **Status after the 2026-06-20T18-49 re-review:** C1 (regenerate inventory, three buckets) is DONE and verified
> against the manifest (1152/707/397/48, ambiguousOverlap 228). **C2 is STILL OPEN** — `Planted/ContainerClipped`
> still resolves to `text-clipped` (inventory line ~99); the `outside-container`/`bottomsheet-overflow` class has no
> standing planted proof. C2 must be completed together with R4 below.

---

## 🔴 R4 — STYLE / RENDER-READINESS INTEGRITY (owner P0, 2026-06-20 — NEW false-negative class, BLOCKER)

**Trigger.** Owner inspected the screenshot `admin-admincurrenciesmanager--default__sq__mobile-375.png` and found it is
**visibly unstyled / raw UA fallback**: Times New Roman serif text, native (unthemed) input/button styling, no
design-system/Tailwind CSS, table + controls rendered as plain HTML. The harness captured and processed this cell as a
normal frame. Manifest corroboration (`2026-06-20T18-49`): that cell uniquely has `noHorizontalOverflow:false` while the
narrower `sq@320`/`sq@390` pass, and its `visualContentCheck.metrics` are sparse (`nonBackgroundRatio 0.21`, `variance
451` vs `0.47`/`827` on the styled cell). The current gates have **no concept of "this frame is unstyled"** — an unstyled
cell that happened not to trip another check would be cited as PASS/proof. **An unstyled screenshot must NEVER be PASS or
cited as proof.** This is a capture/style-integrity false-negative class, distinct from geometry. **HARNESS/CAPTURE ONLY —
do NOT fix AdminCurrenciesManager product layout.**

**R4 required behavior (implement ALL; fail-closed):**

1. **New `styleIntegrity` layer, fail-closed, BEFORE a cell can be PASS.** Runs after the Task 464 rendered-proof layer
   and before/alongside geometry, on **every story × locale × viewport** (same universe as geometry). A cell cannot be
   `pass:true` unless `styleIntegrity.pass === true`.
2. **Detect `unstyled-render` / `css-not-applied` via deterministic DOM/computed-style signals** (in `page.evaluate`),
   not pixel heuristics alone. Use a CONJUNCTION of conservative signals so normal styled stories never trip it:
   - **Preflight applied:** `getComputedStyle(document.body).margin === '0px'` (Tailwind preflight zeroes body margin;
     UA default is `8px`). A non-zero body margin is a strong unstyled signal.
   - **Stylesheets loaded with rules:** `document.styleSheets` is non-empty AND at least one sheet exposes `cssRules`
     with `length > 0` (an empty/again-unparsed sheet set = CSS not applied).
   - **Font not UA-serif default:** the computed `font-family` of a known DS text node does NOT resolve to the bare UA
     serif (`"Times New Roman"`/generic `serif`) when the design system specifies a sans stack.
   - **A known DS control is themed (TRI-STATE — owner R4 clarification 3):** evaluate `[data-slot="button"]` (or the
     story's anchor control) to `true` (themed: `border-radius !== '0px'` OR non-transparent themed `background-color`
     OR DS padding), `false` (present but UA-default), or **`not-applicable`** when the story has NO such DS control.
     A `not-applicable` result is NEUTRAL — it must NOT contribute a failing signal, and a story legitimately without a
     DS control must NOT be flagged `unstyled-render` solely on that basis (the verdict then rests on the preflight /
     stylesheets-with-rules / font signals).
   Fire `unstyled-render` when the conjunction of the APPLICABLE signals indicates CSS is not applied (define the exact
   rule in code + comment; document the chosen thresholds). Record which signals failed and the tri-state of
   `controlThemed`.
3. **Retry-first, THEN fail-closed (owner R4 clarification 2 — ordering is mandatory).** The style-readiness retry loop
   MUST run before any final verdict: when readiness fails, wait/retry up to the existing `MAX_ATTEMPTS` (re-navigate /
   await fonts+stylesheets) — i.e. style-not-ready behaves like a transient DURING the attempt loop. **The
   `isTransientFailure` exclusion must NOT short-circuit or skip this retry loop.** Only AFTER `MAX_ATTEMPTS` are
   exhausted and the frame is still unstyled does the cell take the FINAL `failReason: 'unstyled-render'`, which is then
   **non-transient / a hard capture failure** (added to `isTransientFailure` for the *final* verdict only, so it is never
   retried back into a pass). **Never save the unstyled frame as PASS and never cite it as proof.** Sequence in one line:
   detect-unstyled → retry loop (≤ MAX_ATTEMPTS) → still unstyled? → hard `unstyled-render` (non-transient).
4. **Manifest:** add a `styleIntegrity` block per cell `{ pass, failReason, signals: { bodyMargin, sheetsWithRules,
   fontFamily, controlThemed } }`, and a top-level `summary` counter `unstyledRender` (keep all existing counters).
5. **Inventory:** record style-integrity failures in a SEPARATE section — **"Capture / style-integrity failures
   (NOT product layout defects)"** — one row per cell (storyId · locale · viewport · failing signals · screenshot).
   Do NOT list them in Bucket 1 (product hard defects). Re-file the AdminCurrenciesManager `sq@375` cell here, and
   correct/remove its misleading Bucket-1 row (its reasons `horizontal-overflow`/`full-width-*` are old-layer paraphrases,
   not geometry, and the geometry layer in fact passed it).
6. **Planted proof — SAME unstyled frame under BOTH harnesses (owner R4 clarification 1 — non-negotiable).** The
   unstyled condition must be **intrinsic to the planted story / capture environment**, NOT a NEW-harness-only
   stylesheet-disabling branch. Both the OLD `5c2edabae` harness and the NEW harness must capture the **identical
   visibly-unstyled frame** for that planted cell. Acceptable mechanisms: a planted story that renders without loading
   the DS stylesheet (e.g. its own decorator/parameter that suppresses the global styles, honored by Storybook itself so
   any harness screenshotting it gets the raw frame), or a static unstyled fixture both harnesses navigate to — anything
   that does NOT depend on NEW-harness code to produce the unstyled pixels. **OLD-PASS is valid ONLY if the OLD
   `5c2edabae` harness actually captures the visibly unstyled frame and still scores it PASS** (proving the false-negative
   was real). NEW harness scores the SAME frame **FAIL** with `unstyled-render`. A NEW-only disabling path that the OLD
   harness never exercises is NOT acceptable proof. The known-good styled stories must still PASS the style check
   (false-positive guard) — paste the side-by-side signals (styled vs unstyled) and confirm both harnesses saw the same
   unstyled capture.
7. **Re-run the owner-found cell.** `AdminCurrenciesManager/Default · sq · mobile-375` must, on the repaired harness,
   EITHER capture a styled frame and PASS, OR FAIL with `unstyled-render`. It must NEVER pass with the raw-HTML frame.
   Paste the resulting manifest entry for that exact cell.
8. **Docs/registry/gates:** extend `docs/storybook-governance.md` (rendered-proof now ALSO requires style-readiness — an
   unstyled capture is never proof), update the `storybook-rendered-proof` row in `docs/critical-flow-registry.md`, the
   session log (AC-by-AC + Files Changed), and keep all gates green. **Do NOT run/emit git. Do NOT fix product layout.**

**R4 acceptance:** (a) `styleIntegrity` runs on every cell and gates PASS; (b) planted unstyled story: OLD-PASS@`5c2edabae`
+ NEW-FAIL `unstyled-render` pasted; (c) styled known-good still PASS (no false positive); (d) manifest has the
`styleIntegrity` block + `unstyledRender` counter; (e) inventory has the separate capture/style-integrity section and the
AdminCurrenciesManager `sq@375` cell is moved there (and its bogus Bucket-1 row corrected); (f) the owner-found cell
re-run never passes unstyled; (g) C2 (`outside-container` planted proof) completed in the same return. Orchestrator
re-reviews the real manifest + files; owner runs the native authoritative pass.

---

## 🔁 R4/C2 REWORK ROUND 2 — orchestrator diff+manifest review 2026-06-21 (owner-confirmed BLOCKERS)

Core work is real and verified (geometry module + integration, three-state, style layer wired into `captureCell()`
before Layer 2/3, harness-only scope respected). **But the Task 467/R4/C2 contract is NOT closed.** The following are
verified against the live code/manifest and BLOCK approval. Stay harness/docs-only; no product layout; do NOT run/emit git.

**B1 — Full global inventory not delivered (AC1/AC9).** The global geometry sweep is gated behind `!FAST_MODE`
(`check-stories-rendered.mjs:988`); the inventory is `--fast`/`ASSERT_STORIES` scope only (98 stories / 1176 cells).
Deliver the **full non-fast global-enumeration** inventory — OR mark Task 467 explicitly INCOMPLETE until the owner's
NATIVE full run is attached. The authoritative full run is owner-native; the inventory must be generated FROM that run.

**B2 — Inventory must be ONE ROW PER FAILING CELL.** Replace the aggregated rows (e.g. "ListingDetailView … 72 cells",
"NotificationCenter … 12 cells") with per-cell rows: `storyId · locale · viewport · screenshot path · failReason ·
selector/label`. Aggregates are not reproducible evidence and cannot seed follow-up product-fix tasks. Generate the rows
FROM the manifest (not by hand).

**B3 — R4 planted proof must be a GENUINE missing-CSS / raw-UA frame.** `Planted/UnstyledFrame` currently injects
`body{margin:8px}` + Times New Roman over an otherwise-styled story (`PlantedVisualViolations.stories.tsx:213–237`) — it
only trips two synthetic signals, it does NOT reproduce a frame where DS/Tailwind actually failed to load. Replace it with
a fixture that produces a **real** unstyled frame (no DS/Tailwind applied — e.g. a story/decorator or static fixture that
genuinely renders without the design-system stylesheet), captured **identically by BOTH** the OLD `5c2edabae` harness and
the NEW harness (R4 clarification 1). Paste BOTH halves: **OLD-PASS@`5c2edabae`** (old harness captures the visibly
unstyled frame and still scores PASS) **+ NEW-FAIL `unstyled-render`** (with the failing signals). Styled known-good must
still PASS (false-positive guard).

**B4 — Paste the exact owner-found cell entry.** Provide the literal manifest entry for
`AdminCurrenciesManager/Default · sq · mobile-375` from the repaired run — the actual `styleIntegrity` block + signals +
final verdict — proving it either captured styled and PASSED or FAILED `unstyled-render`. "Either loaded CSS or would be
caught" is not evidence.

**B5 — Paste C2 OLD-PASS + NEW-FAIL for `ContainerEscape`.** The fixture is correct; the proof is missing. Paste
OLD harness@`5c2edabae` = PASS and NEW harness = FAIL with `failReason: outside-container` for `Planted/ContainerEscape`.

**B6 — Global enumeration must be FAIL-CLOSED.** When `storybook-static/index.json` cannot be read, the run MUST abort
with a non-zero exit (or hard error), NEVER `console.warn` + continue with `geometryOnlyStories = []` (current L944).
Silently dropping all-story coverage is a false-confidence path that defeats AC1.

**B7 — Ambiguous per-cell semantics must not read as green.** An ambiguous-only cell currently keeps `cell.pass === true`
with `cell.ambiguousOnly === true` (L849–850), so any downstream consumer reading per-cell `pass` sees a green proof.
Change the per-cell shape so ambiguous is unambiguous to a machine reader: a distinct verdict (e.g. `cell.verdict =
'pass' | 'fail' | 'ambiguous'`, or `cell.pass = false` alongside `ambiguousOnly = true`) such that NO consumer can read an
ambiguous cell as a clean PASS. Update every place that derives PASS counts accordingly (keep the summary correct).

**B8 — Make `unstyled-render` non-transient AFTER retries (R4 clarification 2).** Keep the retry loop (style-not-ready is
retryable DURING attempts), but once `MAX_ATTEMPTS` is exhausted, the final `unstyled-render` MUST be a HARD,
non-transient capture failure: add it to `HARD_FAIL_REASONS` semantics for the FINAL verdict so a still-unstyled cell is
never classified transient/retried-into-pass and is never citable as proof. The current `isTransientFailure` returning
`true` for every `styleIntegrity.pass === false` (L376) contradicts the documented contract — fix the final-verdict path.

**Advisory hardening (fix if low-cost; not gating but note the decision):**
- `bottomsheet-overflow` only catches a control whose `top` is past the sheet bottom; a control with `top` inside but
  `bottom` outside the sheet is missed — extend to the bottom edge / partial-clip case.
- `isAbsoluteOverOwnTrigger()` is too broad: it routes ANY absolute/fixed interactive element overlapping a non-positioned
  same-parent sibling to ambiguous, without proving it is actually that element's own trigger/anchor — tighten so real
  collisions are not silently demoted out of hard defects.
- Reconcile the session-log claim that `Planted/UnstyledFrame` retried "after 2 retries each" under the OLD harness — the
  old `5c2edabae` harness has no style-retry path; correct the transcript wording so it is trustworthy.

**Round-2 acceptance:** B1–B8 each verifiable in the diff/manifest/inventory; OLD-PASS+NEW-FAIL transcripts pasted for
both `UnstyledFrame` (genuine raw-UA frame) and `ContainerEscape`; the exact AdminCurrenciesManager `sq@375` manifest
entry pasted; enumeration fail-closed; ambiguous never `pass:true`; `unstyled-render` hard after MAX_ATTEMPTS; per-cell
inventory from the (owner-native) full run, or Task 467 marked INCOMPLETE pending it. Orchestrator re-reviews the real
manifest + files; owner runs the native authoritative pass. Still HARNESS/DOCS ONLY; no git.

---

## 🔁 ROUND 3 — narrow rework (orchestrator code review 2026-06-21, owner-confirmed; verified in live code)

Round-2 landed real fixes (B6 fail-closed enumeration `process.exitCode=1` on index read failure; B7 ambiguous now
`cell.pass=false`+`verdict='ambiguous'`; `bottomsheet-overflow` partial bottom-clip; `ContainerEscape` icon-only fixture;
`UnstyledFrame` now disables stylesheet links/removes style tags). **But Task 467 is NOT closeable — one serious harness
bug plus missing proof.** Effective FIRST priority: **preserve the Task 464 rendered-proof contract** (F3 below breaks it).
HARNESS/DOCS ONLY; no product layout; do NOT run/emit git.

**F3 [CRITICAL — false-green / 464 regression]. Every early failure path must set `cell.verdict='fail'`.** `verdict` is
assigned only at the end of the geometry path (`check-stories-rendered.mjs:854/857`). Cells that early-return after only
`cell.pass=false` — **loader-only, blank/empty-canvas, blank-screenshot/bitmap, anchor-missing, style `unstyled-render`,
and the catch/error path** — never get `verdict`, so the summary (`failed = c.verdict==='fail'`, L1042) and Bucket 1
(L1103) omit them. A run whose only failures are early-exit (e.g. all-unstyled or all-anchor-missing) can report
`failed=0` and exit green. **Fix:** set `verdict='fail'` on EVERY early failure return, AND make counting/exit defensive —
treat any `cell.pass===false && cell.verdict!=='ambiguous'` as a hard fail in BOTH the `failed` count and the non-zero
exit. **Prove it:** a scenario where the ONLY failures are early-exit (e.g. force a planted unstyled/anchor-missing cell as
the sole failure) must yield `failed>0` and a non-zero exit — paste that transcript.

**F-G [unstyled-render robustly final-hard].** With F3 fixed, confirm `unstyled-render` after `MAX_ATTEMPTS` is a hard,
non-transient fail that is counted in `failed` and can never be cited as proof (add it to the final-hard set / verdict
path, not only `hardAfterRetries`). Paste a transcript showing a still-unstyled-after-retries cell counted as fail.

**F-H [`self-clipped` — implement or explicitly defer].** `self-clipped` is documented + in `HARD_FAIL_REASONS` + has a
summary counter, but `geometry-integrity.mjs` never pushes it (structurally always 0). EITHER implement it (an element's
own content box clips its actionable content — `scrollHeight>clientHeight`/`scrollWidth>clientWidth` with hidden overflow
on the control itself, distinct from text-clipped's nearest-text-descendant walk) with a planted proof, OR explicitly mark
it DEFERRED in the docs/registry and REMOVE the claim that it is covered. Do not document a no-op as covered.

**F-I [style failures out of Bucket 1].** In the inventory generator, exclude cells whose failure is style-integrity-only
(`styleIntegrity.pass===false`) from Bucket 1 (product hard defects); list them ONLY in the separate capture/style-integrity
section. A cell must not appear in both.

**F-serif [style detector].** The unstyled detector must treat a computed `font-family` resolving to the bare generic
`serif` (or `"Times New Roman"`) as a UA-default signal — not only an exact `"Times New Roman"` string match.

**Deliverable/proof carry-overs (still open from Round 2 — NOT done despite session claims):**
- **A/B2 [inventory file still aggregated].** The CHECKED-IN inventory still has aggregate rows ("ListingDetailView … 72
  cells", "NotificationCenter … 12 cells", "AdminReportsManager … 36 cells"). Regenerate the ACTUAL file into per-cell
  rows from the manifest, OR mark it explicitly INCOMPLETE and STOP claiming B2 is done. **No overclaiming** — the session
  log says "all implemented this round" while B2/B4/B5 are pending; that contradiction must go.
- **C/B4 [owner cell entry].** Paste the literal repaired-run manifest entry for
  `admin-admincurrenciesmanager--default × sq × mobile-375` (the `styleIntegrity` block + signals + final verdict).
- **D/B5 [ContainerEscape proof].** Paste OLD@`5c2edabae`=PASS + NEW=FAIL(`outside-container`) for `Planted/ContainerEscape`.
- **E/B3 [UnstyledFrame proof].** Paste OLD@`5c2edabae`=PASS + NEW=FAIL(`unstyled-render`) for the genuine unstyled frame,
  and confirm the same frame is captured by both harnesses.
- **B1 [full global inventory].** Owner-native full non-fast run is the authoritative source; until attached, Task 467 is
  INCOMPLETE (acceptable as STATUS, not as a closeable deliverable).

**Risk to verify (not gating, but check):** confirm `UnstyledFrame` disabling/removing all iframe styles does NOT leak
into subsequent captures that reuse the browser context/page (style state must be fully restored per cell, else later
cells could be falsely flagged unstyled). And note that `minViewport`/desktop-only-story handling is still skeletal — the
full non-fast run may surface it; document the intended mechanism.

**Round-3 acceptance:** F3 fixed with the early-fail-only non-green transcript; `unstyled-render` counted hard after
retries; `self-clipped` implemented (with proof) or honestly deferred; style-only cells excluded from Bucket 1; serif
generic detected; inventory regenerated per-cell OR marked incomplete with no overclaim; the four transcripts/entries
(F-G, B4, ContainerEscape, UnstyledFrame) pasted. Orchestrator re-verifies against the real manifest + code; owner runs the
native authoritative pass. HARNESS/DOCS ONLY; no git.

---

## 🔁 ROUND 4 — docs/evidence accuracy cleanup (orchestrator review 2026-06-21, owner-confirmed)

Round 3's code is essentially right: F3 verdict false-green is closed (early exits set `verdict='fail'` + defensive
counting `c.verdict==='fail' || (c.pass===false && c.verdict!=='ambiguous')`), `unstyled-render` is in
`HARD_FAIL_REASONS`, `self-clipped` is honestly DEFERRED, generic `serif` is detected, style-only cells are excluded from
Bucket 1, and the checked-in inventory is an honest INCOMPLETE placeholder. **Remaining work is NOT code — it is doc
accuracy + the still-pending evidence.** This is a small cleanup pass, NOT a rewrite. Do NOT run/emit git.

**G1 — `critical-flow-registry.md` must not claim proof that is not pasted.** The rendered-proof row currently ends
"…OLD@`5c2edabae` = PASS, NEW = FAIL for all hard classes" and marks Coverage **✅**. The ContainerEscape and
UnstyledFrame OLD/NEW transcripts are PENDING (session admits this). Edit the row so it states the proof status truthfully:
the OLD-PASS/NEW-FAIL transcripts for `ContainerEscape` (`outside-container`) and `UnstyledFrame` (`unstyled-render`), the
F-G early-exit-only transcript, and the `sq@375` manifest entry are **PENDING owner native run**; and **downgrade Coverage
from ✅ to 🟡 (partial — proof pending)** until the transcripts exist. Per the regression-coverage gate, ✅ is set only at
approval once proof is attached — not before.

**G2 — `storybook-governance.md` wording.** Change "serve as **standing proof** the gate catches each defect class" to
"serve as **standing fixtures**; the OLD@`5c2edabae`-PASS / NEW-FAIL proof is **pending owner native run**" for the classes
whose transcripts are not yet pasted (at minimum `ContainerEscape` + `UnstyledFrame`). Keep the already-proven classes
described as proven only if their transcripts are actually in the session log.

**G3 — Attach the pending native transcripts/entries (owner-native authoritative).** These remain the gating evidence and
must be pasted into the session log (and the registry/governance claims updated to match) before Task 467 can be approved:
  1. **F-G:** a run whose ONLY failures are early-exit (e.g. unstyled-only / anchor-missing-only) → `failed > 0` and exit 1.
  2. **`admin-admincurrenciesmanager--default × sq × mobile-375`:** the literal repaired-run manifest entry (`styleIntegrity`
     block + signals + final `verdict`).
  3. **`Planted/ContainerEscape`:** OLD@`5c2edabae` = PASS + NEW = FAIL (`outside-container`).
  4. **`Planted/UnstyledFrame`:** OLD@`5c2edabae` = PASS + NEW = FAIL (`unstyled-render`), same genuinely-unstyled frame
     under both harnesses.
  5. **Full non-fast global inventory** (AC1/AC9) — or Task 467 stays explicitly INCOMPLETE until it is attached.

**G4 — Commit hygiene.** The Task 467 commit must include ONLY Task 467 files (harness scripts, planted stories, the three
docs, session log, inventory). Unrelated dirty files stay OUT — the orchestrator emits explicit-path `git add` for the 467
set only (never `-A`/`-u`/wildcards) at approval. List any unrelated working-tree files in the session log so they are not
swept in.

**Advisory (optional, not gating):** make the final style failure explicitly hard in the style-failure path itself rather
than only via `verdict='fail'` + `hardAfterRetries` side-effects after the retry loop — cleaner and matches the docs.

**Round-4 acceptance:** registry no longer claims unproven OLD/NEW proof and Coverage is 🟡 until transcripts land;
governance says "standing fixtures, proof pending" where applicable; the five G3 transcripts/entries pasted (or Task 467
explicitly INCOMPLETE pending the owner-native full run); 467 commit scoped to 467 files only. Then the orchestrator
re-reviews and, if evidence is present and accurate, emits the commit. HARNESS/DOCS ONLY; no git.

---

## 🔁 ROUND 5 — fix the retry-order regression Round 4 introduced (orchestrator code review 2026-06-21, verified in live code)

Round 4's doc fixes are correct (registry Coverage 🟡, governance "standing fixtures", honest INCOMPLETE inventory,
backlog accurate). But Round 4 broke the R4/B8 style **retry-first** contract. Narrow code fix; no docs rewrite; do NOT
run/emit git.

**P1 [regression — style retry-first defeated].** On the FIRST style failure, `captureCell` stamps
`cell.assertions.renderCheck.failReason = … ?? 'unstyled-render'` (`check-stories-rendered.mjs:726`). Because
`'unstyled-render'` is in `HARD_FAIL_REASONS` (L338), `isTransientFailure()` hits `if (HARD_FAIL_REASONS.has(rc.failReason))
return false;` (L365) **before** the style-retry branch `if (styleIntegrity?.pass === false) return true;` (L381). Result:
the cell is non-transient at attempt 1, the retry loop (L995) breaks immediately, and the `attempt >= MAX_ATTEMPTS` guard
(L1000) never sets `hardAfterRetries`. This contradicts the documented sequence **detect-unstyled → retry ≤ MAX_ATTEMPTS →
still unstyled → hard `unstyled-render`** and makes transient CSS-not-ready hiccups hard-fail instantly (false positives).

**Required invariant:** a style-not-ready cell is **transient (retryable) WHILE `!cell.hardAfterRetries`**, and becomes
**hard/non-transient ONLY after `MAX_ATTEMPTS`**. Implement either path (pick the simpler; keep behavior identical):
  - **(a)** Do NOT set `renderCheck.failReason = 'unstyled-render'` until `hardAfterRetries` is set — during attempts keep
    the style failure under `styleIntegrity.failReason` only, so L381 governs retryability; stamp `renderCheck.failReason`
    in the post-`MAX_ATTEMPTS` hardening block (L1000/1036) together with `hardAfterRetries=true`. OR
  - **(b)** In `isTransientFailure()`, evaluate the style-not-ready branch BEFORE the `HARD_FAIL_REASONS` check, gated by
    `!cell.hardAfterRetries`: `if (cell.assertions.styleIntegrity?.pass === false && !cell.hardAfterRetries) return true;`
    placed above L365. (L353's `if (cell.hardAfterRetries) return false;` already finalizes the hard state.)
  Both apply equally to the FAST and non-FAST retry loops (L995 and L1031) and their twin hardening blocks (L1000, L1036).

**P2 [consequence — `hardAfterRetries` now actually reached].** With P1 fixed, confirm the loop runs to `MAX_ATTEMPTS` for
a persistently-unstyled cell and THEN sets `hardAfterRetries=true` → final `unstyled-render` hard, counted in `failed`,
exit 1. (Fixing P1 fixes P2; verify, don't add a second mechanism.)

**P3 [F-G transcript — now demonstrable].** Paste the transcript of a run whose ONLY failures are a persistently-unstyled
(or anchor-missing) cell: it must retry up to `MAX_ATTEMPTS`, end `hardAfterRetries=true`, count in `failed` (>0), and exit
1. This is the F-G evidence that was pending — it is now produceable once P1 is fixed.

**Carry-overs (unchanged, still gating for CLOSE — owner-native):** the G3 evidence remains pending and Coverage stays 🟡
until attached: F-G (P3 above), `admin-admincurrenciesmanager--default × sq × mobile-375` manifest entry, `ContainerEscape`
OLD/NEW, `UnstyledFrame` OLD/NEW, full non-fast global inventory.

**P4 [session hygiene — optional].** Earlier session sections still read as if `UnstyledFrame` (old CSS-injection),
`ContainerClipped`→`outside-container`, and the OLD/NEW planted proofs were complete. Mark those superseded sections
**HISTORICAL / SUPERSEDED** (pointing to the Round 3–5 truth) so the log can't be misread. Not gating.

**Round-5 acceptance:** style-not-ready retries to `MAX_ATTEMPTS` then hard (P1/P2) — verifiable in the diff; the P3 F-G
transcript pasted; Coverage stays 🟡 pending the remaining owner-native G3 evidence; superseded session sections marked.
Orchestrator re-verifies the retry path + counting against the real code/manifest; owner runs the native authoritative
pass. HARNESS/DOCS ONLY; no git.

---

## 🔁 POST-EVIDENCE REVIEW (orchestrator, 2026-06-22) — proofs ACCEPTED; inventory/registry accuracy BLOCKS close

The five G3 proofs are verified owner-native and ACCEPTED: `ContainerEscape` OLD-PASS→NEW-FAIL(`outside-container`);
`UnstyledFrame` OLD-PASS→NEW-FAIL(`unstyled-render`, `retryCount=2`, `hardAfterRetries=true`); `AdminCurrenciesManager
sq@375` styled `verdict=pass`; F-G retry-order; full run produced the 7756-cell per-cell inventory. The P1 retry-first fix
is proven at runtime. **But Task 467 stays 🟡 INCOMPLETE — the deliverable inventory and the registry are not accurate.**
Narrow final pass; HARNESS/DOCS ONLY; no git.

**V1 [false-positive flood — Bucket 1 mislabels harness false-positives as product defects].** The full global run files
`blank-screenshot` as a "Bucket 1 hard defect (true positive — product layout fix needed)" for known-good primitives at
large viewports: `primitives-badge--default` / `primitives-checkbox--default` / `primitives-popover--default` at
huge-1920/2560, and `primitives-sheet--filter-sheet-right` at canonical-560 → huge-2560 (every desktop width). A small
primitive on a 1920/2560 canvas and a closed/off-canvas right-sheet are near-uniform frames, not product defects. This
violates the kickoff's false-positive discipline ("a noisy detector is as broken as a no-op"; "a rule that fires on
known-good UI is too strict → tune or allowlist with justification"). Fix the harness so Bucket 1 contains only real
product defects: scale the `blank-screenshot` near-uniform threshold by canvas area (or restrict it to viewports where the
story has meaningful content), and/or allowlist these known-good large-viewport primitives with documented reasons, and/or
route genuine "empty by design at this viewport" cells to a separate **harness-tuning / needs-owner-decision** section —
NOT Bucket 1. Re-run and confirm the hard-defect count drops to real defects only; the known-good false-positive guard must
pass at ALL 14 viewports, not just mobile.

**V2 [full-run authority — exit=-1].** The authoritative full global run exited `-1` (PowerShell `NativeCommandError`),
and the registry now downgrades it to "SCREEN" and reverts AC1/AC9 authority to `--fast` (ASSERT_STORIES-only), which
leaves the global-inventory deliverable non-authoritative. Diagnose the `-1`: if it is a benign wrapper artifact (the
summary printed and the manifest is complete), document that explicitly with the evidence and keep the FULL run
authoritative for AC1/AC9; if the process actually aborts (e.g. the page.goto 20000ms timeout seen in the log escalates),
fix it so the full run exits cleanly (1 with defects). Do not satisfy AC1/AC9 with `--fast` while calling the global run a
mere screen.

**V3 [registry honesty].** Keep Coverage **🟡** until V1 and V2 close (do not leave it ✅). Correct the `UnstyledFrame`
description: the captured signals show `fontFamily: "Geist, sans-serif"` + `sheetsWithRules: true`, so the DS stylesheet IS
applied — it is a 2-signal trip (bodyMargin 8px + controlThemed false), NOT a "genuine UA rollback / CSS revert." Either
make the fixture a genuinely raw-UA frame (stylesheet truly not applied → serif font + no sheet rules) and re-capture, or
change the registry/governance wording to describe what it actually is (a controlled 2-signal style-integrity trip). No
overclaiming.

**V4 [comment].** `src/stories/PlantedVisualViolations.stories.tsx` header still says "standing proof" — change to
"standing fixtures" to match the Round-4 governance accuracy fix.

**Close criteria:** Bucket 1 = real product defects only (false-positive guard green at all 14 viewports); full global run
authoritative (exit understood/clean); registry Coverage flips to ✅ ONLY after V1/V2, with the `UnstyledFrame` claim
corrected; comment fixed. Then the orchestrator re-reviews the regenerated inventory + registry and emits the explicit-path
commit over the Task-467 files only (excluding `.gitignore`, `AGENTS.md`, the Epic BB 462/463 kickoffs). HARNESS/DOCS ONLY;
no git.

---

## 🔁 V1-FINAL — full false-positive audit of Bucket 1 (orchestrator deep review, 2026-06-22)

V2 (`exit=1`), V3, V4 ACCEPTED. **V1 is NOT a single fix — Bucket 1 ("true positives — product layout fixes needed") is
inflated by THREE distinct harness false-positive CLASSES, > 700 of the 2129 "hard defects" combined.** The prior pass
only deleted four named IDs; do NOT whack-a-mole. Fix each class in the harness LOGIC, add a false-positive guard fixture
for each, then RE-AUDIT the whole of Bucket 1 (grep every failReason, not named IDs). Do not edit product layout.

**FP-CLASS A — sr-only / visually-hidden labels read as `text-clipped` (DOMINANT — ~688 cells).** Canonical case:
`src/components/ui/dialog.tsx` L78–84 — `DialogClose` = `<XIcon/>` + `<span className="sr-only">{t('close')}</span>`. The
sr-only span is `overflow:hidden` at ~1px, so its text node has `scrollWidth > clientWidth` → `text-clipped` fires; and
`isIconOnly()` returns false because the button HAS (hidden) text, so the icon-only exemption is bypassed.
`dialog-close`/`sheet-close` alone occur **688×** in the inventory (~40% of the 1711 `text-clipped`), all false.
**Fix (geometry-integrity.mjs):** in the text-bearing-descendant walk, treat a node matching the visually-hidden /
`sr-only` pattern as NON-text (skip it): detect via computed style (`clip`/`clip-path` rect, `width/height ≤ 1px`,
`position:absolute` + `overflow:hidden` + `white-space:nowrap`, or a `.sr-only`-equivalent class). An interactive control
whose ONLY text is sr-only is effectively icon-only → exempt from `text-clipped` provided it has a valid accessible name.
Guard fixture: a planted icon button with an `sr-only` label MUST PASS (not `text-clipped`).

**FP-CLASS B — viewport-mismatch blank-screenshot (32 cells).** `admin-adminmobileheader--default` blank at
desktop-1024…2560 (mobile-only header, empty at desktop); `admin-adminsidebar--desktop` blank at mobile-320…390
(desktop-only sidebar, empty at mobile).

**FP-CLASS C — viewport-mismatch geometry (e.g. `admin-adminsidebar--mobile-drawer-open` → `element-overlap` at
desktop-1440/huge-1920).** A mobile drawer rendered at desktop widths breaks layout and trips overlap — not a product
defect; the story is out of its viewport range.

**Shared root for B + C: no per-story viewport range.** Every story is screenshotted + asserted at all 14
`VIEWPORTS_FULL`. **Fix:** add per-story viewport-range awareness (`minViewport`/`maxViewport` from a story tag/parameter,
or a declared `viewports` allowlist). Outside a story's declared range, do NOT blank/geometry-FAIL it — skip it or route
"out-of-range / empty by design" cells to the **Capture / harness-tuning** section, NEVER Bucket 1. (This is the
`minViewport` handling flagged skeletal in Round 5.)

**FP-CLASS D — verify-and-allowlist: third-party / intentional controls.** Re-check whether Bucket 1 still contains
third-party map controls (Leaflet `×`/`+`/`−`/attribution in `ListingDetailView`) as `text-clipped`; if so, add them to
`GEOMETRY_ALLOWLIST` with a documented reason (third-party, not our layout) or route to needs-owner-decision. Confirm by
grep, don't assume.

**Required deliverable — a REAL Bucket-1 audit, not ID deletion:**
1. Fix Classes A, B, C in harness logic (+ D allowlist) — each with a planted/guard fixture proving the known-good case
   now PASSES (sr-only icon button; mobile-only story at desktop; desktop-only story at mobile; map control).
2. Expand the **false-positive guard** to include ALL four patterns at the relevant viewports (not just mobile primitives).
3. RE-RUN the full owner-native matrix; regenerate the inventory; **Bucket 1 must contain only genuine product defects.**
   The hard-defect count must drop materially from 2129 (most of the sr-only 688 + the viewport-mismatch cells leave
   Bucket 1). Paste the before/after hard counts and confirm via a full `blank-screenshot` + `text-clipped` re-grep that no
   sr-only or out-of-range cell remains in Bucket 1.

Coverage stays **🟡**; no commit until Bucket 1 is genuinely class-clean across A–D. HARNESS/DOCS ONLY; no git.

### Task 468 landed (story de-dup) — impact on V1-FINAL (orchestrator note, 2026-06-22)

468 reduced the global story set and removed several viewport-named duplicate exports (e.g. `AdminSidebar/Desktop` no
longer exists; `ListingGrid/Default` replaces `--desktop`). **This makes the 7756-cell / 2129-hard inventory STALE — it
must be regenerated against the post-468 story set.** Effect on the A–D classes:
- **Class A (sr-only → text-clipped, ~688) — UNCHANGED by 468.** It is a harness-logic bug (`geometry-integrity.mjs` walks
  into the `.sr-only` close-label span), per-component, not per-duplicate. De-dup lowers the dialog/sheet story COUNT a
  little but every remaining dialog/sheet/close still trips it. **Still the #1 remaining fix; 468 does not help.**
- **Classes B/C (viewport-mismatch) — PARTIALLY reduced by 468.** Removed duplicate viewport-named stories (e.g.
  `AdminSidebar/Desktop`) drop out, but genuinely viewport-specific stories remain (`AdminMobileHeader/Default` blank at
  desktop; `AdminSidebar/MobileDrawerOpen` element-overlap at desktop). The per-story viewport-range fix is still needed —
  or extend the manual "intentionally omitted at <viewport>" reasoning already in `ASSERT_STORIES:137` into the global
  enumeration so out-of-range cells never reach Bucket 1.
- **Class D (map controls) — UNCHANGED by 468.** Still verify/allowlist.

**Sequencing:** land the A–D harness fixes, THEN regenerate the full owner-native inventory ONCE against the post-468
de-duplicated story set (folds 468's smaller set + 467's FP fixes into one authoritative inventory). Reconcile any
`ASSERT_STORIES` id that 468 renamed/removed before that run (spot-check: `ListingGrid/Default`, AdminReports scenario ids).
