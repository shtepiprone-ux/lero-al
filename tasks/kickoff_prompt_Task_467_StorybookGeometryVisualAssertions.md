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
