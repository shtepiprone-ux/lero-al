# Session Log — Task 663: Suppress false-positive "background behind overlay backdrop" ambiguous-overlap findings (backdrop-gated downgrade)

**Date:** 2026-07-23
**Task path:** `tasks/kickoff_prompt_Task_663_Harness_Backdrop_Overlap_Downgrade.md`
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

## 1. Requirement and acceptance-criteria evidence

| ID | Requirement | Evidence | Result |
|---|---|---|---|
| R1/AC1 | Cross-overlay-boundary pair → `pass` (no finding) when a real backdrop covers the background element | New `isBackgroundCoveredByOverlayBackdrop(bgEl)` helper (`scripts/geometry-integrity.mjs`, added after `isInsideOverlayBody`) gates the line-502 branch; planted `Planted/OverlayBackdropCovered` — OLD-harness `{"pass":false,"ambiguousOnly":true,"ambiguous":["ambiguous-overlap"]}` → NEW-harness `{"pass":true,"ambiguousOnly":false,"violations":[],"ambiguous":[]}` (§5.2 OLD/NEW proof) | Confirmed |
| R2/AC2 | No covering backdrop → still `ambiguous-overlap` | Planted `Planted/OverlayNoBackdrop` — OLD `{"pass":false,"ambiguousOnly":true,"ambiguous":["ambiguous-overlap"]}` → NEW **identical** `{"pass":false,"ambiguousOnly":true,"ambiguous":["ambiguous-overlap"]}` (§5.2); confirmed again in the full `--fast` console run (§5.1, "Planted/OverlayNoBackdrop … ambiguous-overlap" ×12 cells, all 4 locales × 3 mobile widths) | Confirmed |
| R3/AC3 | No pre-existing genuine detection weakened: `OverlappingActions`/`ScrollVisibleOverlap` still hard-FAIL `element-overlap`; `AmbiguousOverlap` verdict unchanged from before this task | `OverlappingActions` OLD `{"pass":false,"violations":["element-overlap"]}` = NEW identical; `ScrollVisibleOverlap` OLD `{"pass":false,"violations":["element-overlap"]}` = NEW identical (§5.2). `AmbiguousOverlap` OLD `{"pass":true,"ambiguousOnly":false}` = NEW **identical** `{"pass":true,"ambiguousOnly":false}` — verdict is **unchanged by this task** (§5.3: a pre-existing, Task-663-unrelated condition, see finding below) | Confirmed (with a documented caveat — §5.3/§8) |
| R4/AC4 | Full `--mantine-only` run: backdrop-reason ambiguous-overlap drops to ~0, `0 FAIL`, no story loses a prior PASS | BEFORE (`2026-07-23T10-53`, pre-existing baseline from an earlier session today, unedited harness): 1064 cells, 1021 PASS, **0 FAIL**, 43 ambiguous (25 backdrop-reason: Combobox 12, RangeDatePicker 12, NotificationBellView 1). AFTER (`2026-07-23T15-33`, this task's edited harness): 1064 cells, 1042 PASS, **0 FAIL**, 22 ambiguous (4 backdrop-reason, Combobox only — RangeDatePicker 12→0, NotificationBellView 1→0; the 18 unrelated other-reason ambiguous cells — `PopularLocationsView` ellipsis ×16, `Tabs` offscreen ×2 — are byte-identical before/after). Passed count rose 1021→1042 (+21), exactly matching the ambiguous-count drop (43→22 = −21) — no hard-FAIL regression anywhere (§5.4) | Confirmed |
| R5/AC5 | `tsc`/`build` clean | `npx tsc --noEmit` → 0 errors. `npm run build` → `✓ Compiled successfully in 73s`, 40/40 static pages, exit 0 | Confirmed |
| R6/AC6 | Only `geometry-integrity.mjs`, `PlantedVisualViolations.stories.tsx`, `check-stories-rendered.mjs` (+ backlog/session log) changed | `git status --short` → exactly those 3 source files + this session log + `docs/backlog.md`, plus the harness's own auto-regenerated `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` (generated artifact, OQ1 — owner call on committing the refresh, not part of this task's required diff) | Confirmed |

## 2. Current versus required behavior

**Before:** Check 4's cross-overlay-boundary branch (`isInsideOverlayBody(a) !== isInsideOverlayBody(b)`) unconditionally pushed `ambiguous-overlap` for any pair straddling the opened-overlay boundary, even when a real, opaque, viewport-covering backdrop made the background element provably unreachable — producing ~25 recurring backdrop-reason triage rows on `Combobox`/`RangeDatePicker`/`NotificationBellView`.

**Required (after):** the same pair is a silent `pass` (no finding) **iff** `isBackgroundCoveredByOverlayBackdrop` proves a real `.mantine-Overlay-root` backdrop (position:fixed, visible, z-index at/above the background element, rect fully containing the background element's rect) covers it; otherwise the pre-existing `ambiguous-overlap` push is unchanged. `element-overlap` hard-FAILs and the R1 `isAbsoluteOverOwnTrigger`/`isLibraryInternal` ambiguous branch are untouched.

**Negative flows (kickoff §11):**

| Branch | Applicable? | Result |
|---|---:|---|
| Validation / Auth-RLS / Offline / Concurrent-writer | No | N/A — non-product harness/test-fixture change only |
| Backdrop absent (`withOverlay={false}` / bg above backdrop) | Yes (R2) | `Planted/OverlayNoBackdrop` — still `ambiguous-overlap` (§1, §5.2) |
| Backdrop present, bg covered | Yes (R1) | `Planted/OverlayBackdropCovered` — PASS, no finding (§1, §5.2) |
| Genuine same-layer overlap | Yes (preserve) | `OverlappingActions`/`ScrollVisibleOverlap` — still hard-FAIL `element-overlap`, byte-identical OLD/NEW (§5.2) |
| Absolute-over-own-trigger | Yes (preserve) | `AmbiguousOverlap` — verdict byte-identical OLD/NEW; see §5.3 finding | 
| Backdrop element not found in DOM (A1 stop-condition) | N/A — found | `.mantine-Overlay-root` confirmed present and matching the expected shape via `@mantine/core` source inspection (§5.5) — A1 not triggered |

## 3. Files Changed

| File | Reason |
|---|---|
| `scripts/geometry-integrity.mjs` | Adds `isBackgroundCoveredByOverlayBackdrop(bgEl)` helper + gates the Check-4 cross-overlay-boundary branch (line ~502) on verified backdrop coverage |
| `src/stories/PlantedVisualViolations.stories.tsx` | Adds `OverlayBackdropCovered` (expected PASS) and `OverlayNoBackdrop` (expected still `ambiguous-overlap`) planted fixtures |
| `scripts/check-stories-rendered.mjs` | Registers both new fixtures in `ASSERT_STORIES` with anchors, mirroring the Task 569 `ScrollClippedOverlap`/`ScrollVisibleOverlap` precedent |
| `docs/backlog.md` | Concise active-state update |
| `docs/sessions/2026-07-23-task663-harness-backdrop-overlap-downgrade.md` (new) | This session log |

(`docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` was auto-regenerated by the `--mantine-only` run in this session — a generated artifact, not hand-edited; per OQ1 whether to commit its refresh is an owner/reviewer call, not part of this task's required diff.)

## 4. Backdrop element — verified (§3.5 of the kickoff)

The kickoff flagged the exact Mantine backdrop element as **not yet verified** and required DOM/source inspection before coding (stop-condition A1 if absent). Verified against `@mantine/core` compiled source (not guessed), cross-checked live in the built Storybook:

- **Selector:** `.mantine-Overlay-root` — Mantine's default static-class name for the `Overlay` component (`getStaticClassNames`: `${classNamesPrefix}-${componentName}-${selector}` = `mantine-Overlay-root`; `node_modules/@mantine/core/esm/core/styles-api/use-styles/get-class-name/get-static-class-names/get-static-class-names.mjs`).
- **Render path:** `Drawer` (`Drawer.mjs`) renders `DrawerOverlay` (`DrawerOverlay.mjs`) → `ModalBaseOverlay` (`ModalBaseOverlay.mjs`, `fixed: true`, `zIndex: ctx.zIndex`) → `Overlay` (`Overlay.mjs`, `useStyles({name:"Overlay"})`).
- **Computed geometry:** compiled CSS (`node_modules/@mantine/core/styles/Overlay.css`) — `position:absolute` by default, `position:fixed` under `[data-fixed]` (always set by `ModalBaseOverlay`), `inset:0` (full viewport), `z-index:var(--overlay-z-index)` resolved from the same `zIndex` prop shared with the sheet content wrapper (`node_modules/@mantine/core/styles/ModalBase.css` `.m_60c222c7 { position:fixed; z-index:var(--mb-z-index) }`). `DrawerOverlay` renders BEFORE `DrawerContent` in DOM order (`Drawer.mjs`), so at equal z-index the sheet content paints above the backdrop — confirming the backdrop always sits strictly between the background page and the sheet.
- A1 (backdrop-absent stop-condition) was **not** triggered — the element exists and matches the expected shape.

## 5. Validation evidence

### 5.1 Planted-fixture console output (`--fast`, ASSERT_STORIES phase — Task 663 fixtures live in `Planted/VisualViolations`, title prefix `Planted/`, NOT `Mantine/Primitives/*`/`Patterns/Mantine/*`, so they run under `screenshots:assert -- --fast` (Phase 1), never under `--mantine-only` — see §5.6 deviation note)

```
npm run screenshots:assert -- --fast
```
Result: `1831/2108 PASS, 219 FAIL, 12 OUT-OF-RANGE, 46 AMBIGUOUS`. Console excerpt (all 4 locales × 3 mobile widths each):
```
⚠️  46 cells have ambiguous findings (needs-owner-decision):
  ... (Combobox ×4, PopularLocationsView ×16, Tabs ×2, IntentionalEllipsis ×12 — all pre-existing/unrelated)
  Planted/OverlayNoBackdrop × sq/en/uk/it × mobile-320/375/390
    ? [ambiguous-overlap]: [data-testid="planted-no-backdrop-bg"] ↔ [data-testid="planted-no-backdrop-sheet-btn"] — background page content behind an opened overlay's backdrop
```
`Planted/OverlayBackdropCovered` does **not** appear in either the FAIL or AMBIGUOUS console sections — confirmed a clean PASS. `Planted/OverlappingActions` (×12) and `Planted/ScrollVisibleOverlap` (×12) appear in the FAIL section with `element-overlap`, unchanged. The 219 total FAILs are pre-existing/unrelated (e.g. `ContainerEscape`, `UnstyledFrame` — intentional planted hard-FAIL/style-integrity fixtures, out of this task's scope).

### 5.2 OLD-vs-NEW planted-violation proof (throwaway comparison script, disposable, never committed — same method as Task 538/569 precedent)

Ran both the pre-Task-663 committed `geometry-integrity.mjs` (`git show HEAD:...`) and the new edited version against the identical live rendered DOM for each planted story at 320px/en:

```
planted-visualviolations--ambiguous-overlap
  ORIGINAL: {"pass":true,"ambiguousOnly":false,"violations":[],"ambiguous":[]}
  NEW     : {"pass":true,"ambiguousOnly":false,"violations":[],"ambiguous":[]}
planted-visualviolations--overlapping-actions
  ORIGINAL: {"pass":false,"ambiguousOnly":false,"violations":["element-overlap"],"ambiguous":[]}
  NEW     : {"pass":false,"ambiguousOnly":false,"violations":["element-overlap"],"ambiguous":[]}
planted-visualviolations--scroll-visible-overlap
  ORIGINAL: {"pass":false,"ambiguousOnly":false,"violations":["element-overlap"],"ambiguous":[]}
  NEW     : {"pass":false,"ambiguousOnly":false,"violations":["element-overlap"],"ambiguous":[]}
planted-visualviolations--scroll-clipped-overlap
  ORIGINAL: {"pass":true,"ambiguousOnly":false,"violations":[],"ambiguous":[]}
  NEW     : {"pass":true,"ambiguousOnly":false,"violations":[],"ambiguous":[]}
planted-visualviolations--overlay-backdrop-covered
  ORIGINAL: {"pass":false,"ambiguousOnly":true,"violations":[],"ambiguous":["ambiguous-overlap"]}
  NEW     : {"pass":true,"ambiguousOnly":false,"violations":[],"ambiguous":[]}
planted-visualviolations--overlay-no-backdrop
  ORIGINAL: {"pass":false,"ambiguousOnly":true,"violations":[],"ambiguous":["ambiguous-overlap"]}
  NEW     : {"pass":false,"ambiguousOnly":true,"violations":[],"ambiguous":["ambiguous-overlap"]}
```

This is the direct AC1/AC2/AC3 proof: `OverlayBackdropCovered` flips ambiguous→PASS; `OverlayNoBackdrop`, `OverlappingActions`, `ScrollVisibleOverlap`, `ScrollClippedOverlap` are byte-identical OLD vs NEW.

### 5.3 Finding — `AmbiguousOverlap` pre-existing condition (not caused by this task, out of scope to fix)

`Planted/AmbiguousOverlap` (the R1 `isAbsoluteOverOwnTrigger` fixture, testids `planted-ambiguous-trigger`/`planted-ambiguous-popup`) returns `{"pass":true,"ambiguousOnly":false}` under **both** the original committed harness and this task's edited harness — i.e. this task's diff provably did not change it (§5.2 OLD=NEW). Root cause (confirmed via a live DOM rect probe, throwaway script): the trigger's intrinsic rendered box and the popup's explicit absolute box are **byte-identical rects** (`[16,24,136,64]` at 320px/en) — two exactly-equal-size, exactly-co-located siblings. Check 4's pre-existing Task-611 bounding-box containment guard (`isContained(aVisibleRect, bVisibleRect) || isContained(bVisibleRect, aVisibleRect)`, added for the Mantine `rightSection`/adornment false-positive) treats two identical rects as "one contains the other" and `continue`s **before** the code ever reaches the `isAbsoluteOverOwnTrigger` ambiguous branch this fixture was built to exercise. This is a **latent interaction between Task 611 (2026-07-15+) and the original Task 467 fixture (2026-06-19)**, unrelated to and unaffected by Task 663's diff (confirmed identical under the unmodified original file). Per kickoff §8 ("The R1 `isAbsoluteOverOwnTrigger`/`isLibraryInternal` ambiguous branch … and its planted `AmbiguousOverlap` fixture — untouched"), fixing this is explicitly out of this task's scope; flagging it for the orchestrator/owner as a separate follow-up (the fixture no longer proves its own R1 gate-integrity claim and should be re-shaped in its own task, e.g. non-identical overlap rects).

### 5.4 Full `--mantine-only` BEFORE/AFTER (AC4)

**BEFORE** (`.screenshots/rendered-assert/2026-07-23T10-53/`, an earlier session-today baseline run, predates this task's edits):
```
{"total":1064,"passed":1021,"failed":0,"ambiguousOnly":43,"ambiguousOverlap":43, ...}
```
43 ambiguous = 25 backdrop-reason (Combobox 12, RangeDatePicker 12, NotificationBellView 1) + 18 unrelated (PopularLocationsView ellipsis 16, Tabs offscreen 2).

**AFTER** (`.screenshots/rendered-assert/2026-07-23T15-33/`, this session, edited harness):
```
Mantine selected: 66; non-Mantine excluded: 244
Results: 1042/1064 PASS, 0 FAIL, 22 AMBIGUOUS (needs-owner-decision)
```
22 ambiguous = 4 backdrop-reason (Combobox only) + 18 unrelated (byte-identical to BEFORE: PopularLocationsView 16, Tabs 2). RangeDatePicker and NotificationBellView backdrop-reason rows: **fully resolved (12→0, 1→0)**. Passed count rose 1021→1042 (+21), exactly the ambiguous-count drop (43→22) — no story lost a previously-passing hard assertion; `0 FAIL` both before and after.

**The 4 remaining Combobox backdrop-reason cells** (all at `mobile-390`, one per locale) were individually inspected: the background element's rect (e.g. `a=[16,804,374,848]`) extends ~4px **past** the viewport's bottom edge (844px height) — the backdrop's own rect is bounded to the viewport (`inset:0` on a `position:fixed` element sizes to the viewport, not the page), so `isBackgroundCoveredByOverlayBackdrop`'s strict full-containment requirement correctly does **not** treat this as verified-covered. This is the intended fail-closed behavior (§10 "Do not broaden the exemption"): a background element partially outside the viewport is a different, more marginal case than "background fully covered by an opaque backdrop", and staying ambiguous here is correct, not a bug.

### 5.5 Backdrop element existence (A1 stop-condition — not triggered)

Confirmed via `@mantine/core` compiled source inspection (§4) and empirically via the OLD/NEW planted-fixture proof (§5.2) that `.mantine-Overlay-root` renders with the expected `position:fixed`/`inset:0`/z-index shape. No `BLOCKED` return required.

### 5.6 Deviation from the kickoff's literal §13 verification-plan command (documented, not silently substituted)

The kickoff's step 3 says to assert the planted fixtures via `npm run screenshots:assert -- --mantine-only --fast`. Code inspection of `scripts/check-stories-rendered.mjs` shows `--mantine-only` runs **only** Phase 0 (`Mantine/Primitives/*`/`Patterns/Mantine/*` auto-discovered stories) and unconditionally skips Phase 1 (`ASSERT_STORIES`, `for (const story of MANTINE_ONLY ? [] : ASSERT_STORIES)`) **regardless of `--fast`** — so planted fixtures (title `Planted/VisualViolations`, matching neither Mantine title prefix) can never be asserted under that exact flag combination; it is a task-specification error, not something this task's scope authorizes fixing. Used the functionally-equivalent, actually-reachable commands instead: `screenshots:assert -- --fast` for the planted-fixture proof (§5.1/§5.2 — Phase 1, the phase that contains `ASSERT_STORIES`) and `screenshots:assert -- --mantine-only` (full, no `--fast`) for the AC4 product-story proof (§5.4 — Phase 0, where `Combobox`/`RangeDatePicker`/`NotificationBellView` actually live). Both commands are pre-existing, repo-known (`package.json` `screenshots:assert` script + documented flags), not invented.

### 5.7 Standard gates

1. `npx tsc --noEmit` → **0 errors**.
2. `npm run build` → `✓ Compiled successfully in 73s`, `Generating static pages (40/40)`, exit 0.
3. `npm run check:stories` → `✅ check:stories PASSED — 126 files checked, 0 violations` (new planted fixtures introduce no governance violation).
4. `npm run check:file-integrity` → `✅ PASSED — all 4 file(s) clean`.
5. `npm run check:mojibake` → `0 artifacts in 1880 files`.
6. `node --check scripts/geometry-integrity.mjs && node --check scripts/check-stories-rendered.mjs` → both exit 0; no NUL bytes, no BOM on any touched file (verified individually before the gates above).

## 6. Assumptions, deviations, limitations

- **A1 assumption (kickoff §5):** confirmed true — Mantine renders exactly one full-viewport backdrop element per open Drawer with a z-index between background and sheet (§4). Not a `BLOCKED` case.
- **A2 (kickoff §5):** implemented as specified — silent fall-through `pass`, no new "expected-overlay" bucket.
- **Deviation (§5.6):** the literal `--mantine-only --fast` command in the kickoff's §13 step 3 cannot exercise the planted fixtures (structural harness fact, not a scope choice); used `--fast` (no `--mantine-only`) for planted proof and `--mantine-only` (full) for AC4 product-story proof instead.
- **Finding (§5.3):** `Planted/AmbiguousOverlap` no longer exercises its intended R1 branch due to a pre-existing (Task 611-era, pre-dating this task) containment-guard interaction — proven unaffected by this task's diff, out of scope to fix here, flagged for a follow-up task.
- **OQ1 (kickoff §5):** the auto-regenerated `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` diff from the harness runs in this session is left as-is (uncommitted decision belongs to the reviewer), per the kickoff's own framing.
- No product component, route, style, token, or i18n string was changed — `git status --short` confirms the file list in §3.

## 7. Self-review / acceptance-criteria self-audit

| AC | Where verified | Result |
|---|---|---|
| AC1 — `OverlayBackdropCovered` → PASS | §5.1 (not in console FAIL/AMBIGUOUS lists), §5.2 (OLD ambiguous → NEW pass) | ✅ |
| AC2 — `OverlayNoBackdrop` → still `ambiguous-overlap` | §5.1 (console ×12), §5.2 (OLD=NEW ambiguous) | ✅ |
| AC3 — `OverlappingActions`/`ScrollVisibleOverlap` still FAIL; `AmbiguousOverlap` verdict unchanged from before this task | §5.2 (all three OLD=NEW byte-identical) | ✅ (verdict genuinely unchanged; see §5.3 caveat that the unchanged value is `pass`, not `ambiguous`, due to a pre-existing unrelated condition) |
| AC4 — backdrop-reason rows drop to ~0, `0 FAIL`, no PASS regression | §5.4 (25→4 backdrop rows, 0 FAIL both runs, +21 passes exactly matching −21 ambiguous) | ✅ |
| AC5 — `tsc`/`build` clean | §5.7.1–2 | ✅ |
| AC6 — only the 3 source files (+ backlog/session log) changed | §3, `git status --short` | ✅ |

Self-validation: `tsc=0 errors` · `build=passes` · `AC table=all green (AC3 with a documented, provably-pre-existing-and-unaffected caveat)` · `check:stories=0 violations` · `screenshots:assert --fast + --mantine-only (full)=as detailed above` · `scope=clean (3 source files + docs)` · `integrity=PASS` · `mojibake=PASS`.

## 8. Opus handoff — what to inspect

1. **§5.3 finding is the one substantive judgment call in this session** — `AmbiguousOverlap`'s verdict is unaffected by this diff (empirically proven, not asserted), but it means that specific planted fixture has silently stopped proving its own R1 claim since some point after Task 611. Recommend a small follow-up task to reshape `AmbiguousOverlap` with non-identical trigger/popup rects so it once again exercises `isAbsoluteOverOwnTrigger` distinctly from the Task-611 containment guard.
2. **§5.6 deviation** — the kickoff's exact `--mantine-only --fast` command cannot reach the planted fixtures; please confirm the substituted commands (`--fast` for planted proof, `--mantine-only` full for AC4) satisfy intent, or direct a different verification path.
3. **§5.4's 4 remaining Combobox ambiguous cells** — reviewed and explained as a fail-closed viewport-edge case (background rect slightly exceeds viewport at `mobile-390`), not a defect; worth a quick second look given it's the one place the fix doesn't fully clear the backdrop-reason class.
4. `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` was regenerated by the harness runs this session (OQ1, owner call on committing).

## 9. Backlog update

See `docs/backlog.md` — concise "Last Session (2026-07-23)" bullet added for Task 663.

---

## Orchestrator review outcome (Opus, 2026-07-31) — `APPROVED`

Reviewed against commit `0b264d5db` and the current tree.

**The predicate is correctly conservative in the direction that matters.** `isBackgroundCoveredByOverlayBackdrop`
downgrades a Check-4 cross-boundary overlap to a silent pass only when a `.mantine-Overlay-root` element is
`position: fixed`, not `display:none`/`visibility:hidden`/`opacity:0`, has z-index at or above the background
element's, and has a rect containing the background rect within tolerance. Every weaker case — no backdrop,
`withOverlay={false}`, or a background element stacked above — keeps the pre-existing `ambiguous-overlap` push. A
real bleed-through is never silently hidden.

**The class-name derivation is traced, not assumed.** The comment walks `.mantine-Overlay-root` back through
`getStaticClassNames` → `useStyles({name:"Overlay"})`, then through `DrawerOverlay` → `ModalBaseOverlay` to the
compiled `Overlay.module.css` (`position:absolute` by default, `fixed` under `[data-fixed]`, `inset:0`,
`z-index:var(--overlay-z-index)`), and establishes paint order from `Drawer.mjs` rendering `DrawerOverlay` before
`DrawerContent`. That is source-level provenance for a selector the harness now depends on.

**The control is two-armed and permanent — the part most tasks omit.** Both planted stories are enrolled as
standing harness cells (`check-stories-rendered.mjs:245-246`):

- `OverlayBackdropCovered` — expected **PASS** on the new harness, `ambiguous-overlap` on the pre-663 harness.
  Proves the downgrade fires.
- `OverlayNoBackdrop` — expected `ambiguous-overlap` on **both**. Proves the downgrade did not widen beyond the
  verified-backdrop case.

The second arm is the one that matters and it is the one usually missing. Because both are standing cells rather
than a one-off run, a future edit that over-broadens the predicate fails CI rather than passing quietly.

**Findings — none blocking.**

- **F1 `P3` — z-index is compared numerically across possibly-different stacking contexts.** `bdZIndex < bgZIndex'
  uses `parseInt(getComputedStyle(el).zIndex)` with `NaN → 0`, which is not a valid cross-context comparison: a
  background element reading `z-index: 0` inside an ancestor stacking context with a high z-index can paint above
  a backdrop reading `500`, and the predicate would wrongly return "covered" — a silent pass on a real overlap.
  The inverse error is safe (finding retained). Low likelihood in the Storybook story set the harness runs on, and
  the `OverlayNoBackdrop` arm constrains the blast radius, but the limitation is real and is not stated in the
  code comment. Worth a sentence there, or a `checkVisibility()`/`elementFromPoint` cross-check if this ever
  produces a suspicious pass.
- **F2 `P3` — "unreachable" overstates what is measured.** The comment justifies the downgrade with "provably
  unreachable/unperceivable", but the predicate proves visual coverage only; `pointer-events: none` on the
  backdrop is not checked, and such a backdrop leaves the background control clickable while fully covering it.
  For a geometry/overlap check, visual coverage is the right criterion — so this is a wording precision issue, not
  a logic defect. Recommend narrowing the claim to "visually covered".

**Requirement coverage.** All requirements `VERIFIED`. **Verdict: `APPROVED`** — the two remaining items are
documentation-precision notes on a correct, well-controlled change. No code revision.
