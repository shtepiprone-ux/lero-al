# Task 467 — Repair the Storybook rendered-proof harness: systemic false-NEGATIVES

**Type:** Storybook / visual-snapshot harness (tooling — HARNESS ONLY).
**Executor:** Sonnet 4.6 | **Date:** 2026-06-19

## Summary

Repaired the Storybook rendered-proof harness to detect geometry/visual-integrity defects that previously scored false-PASS. Added element-level geometry assertions that run on ALL stories (global enumeration), not just `ASSERT_STORIES`.

1. **Geometry-integrity module** (`scripts/geometry-integrity.mjs`): Playwright in-page `page.evaluate()` that detects `text-clipped`, `offscreen-control`, `outside-container`, `element-overlap`, and `bottomsheet-overflow` on visible interactive elements (buttons, links, inputs, role=button/tab/menuitem, data-slot triggers). ~1px tolerance. Algorithmic exclusions for overlap (ancestor/descendant, label↔input, aria-hidden/inert, pointer-events:none).

2. **Global story enumeration** (AC1): Reads `storybook-static/index.json` to run geometry checks on ALL stories at 320/375/390 × 4 locales (Phase 2: geometry-only, skips anchor requirements). `ASSERT_STORIES` keeps full Layer 1+2+3 with anchors (Phase 1).

3. **Planted violation stories** (`src/stories/PlantedVisualViolations.stories.tsx`): 5 self-contained stories — ClippedButtonText, OverlappingActions, OffViewportControl, ContainerClipped, KnownGoodControl. Uses `role="button"` + `data-slot="button"` (no raw `<button>`) to pass check:stories.

4. **Harness integration**: Layer 3 in `captureCell()` after existing Layer 2 visual gates. New summary counters (textClipped, selfClipped, offscreenControl, outsideContainer, elementOverlap, bottomsheetOverflow, ambiguousOverlap). `isTransientFailure` excludes all geometry failReasons. Allowlist + ambiguous third-state mechanism.

5. **Docs**: `storybook-governance.md` §14.4.2 + `critical-flow-registry.md` updated.

## OLD-PASS / NEW-FAIL proof (AC13) — HISTORICAL, pre-R1/R2/R4/Round 3; see Round 4/5 for current truth

### OLD harness (Task 464 at `5c2edabae`) — planted stories score PASS

```
Results: 1128/1128 PASS, 0 FAIL
✅ All rendered assertions PASSED.
```

All 5 planted stories (ClippedButtonText, OverlappingActions, OffViewportControl, ContainerClipped,
KnownGoodControl) scored PASS in the old harness — confirming the false-negative class.

### NEW harness (Task 467) — planted stories FAIL with expected failReasons

```
Results: 708/1128 PASS, 420 FAIL
  text-clipped: 360
  offscreen-control: 324
  outside-container: 234
  element-overlap: 192

Planted failures (expected):
  Planted/ClippedButtonText × {sq,en,uk,it} × {320,375,390}
    ✗ geometry [text-clipped]: [data-testid="planted-clipped-btn"] — Btn-467: very long label...
  Planted/OverlappingActions × {sq,en,uk,it} × {320,375,390}
    ✗ geometry [element-overlap]: [data-testid="planted-overlap-a"] ↔ [data-testid="planted-overlap-b"]
  Planted/OffViewportControl × {sq,en,uk,it} × {320,375,390}
    ✗ geometry [offscreen-control]: [data-testid="planted-offscreen-btn"] — Off-screen #467
  Planted/ContainerClipped × {sq,en,uk,it} × {320,375,390}
    ✗ geometry [outside-container]: [data-testid="planted-container-btn"] — Wide-btn #467...

False-positive guard (expected PASS):
  Planted/KnownGoodControl — NOT in failures = PASS ✓
```

| Planted Story | OLD (5c2edabae) | NEW (467) | failReason |
|---|---|---|---|
| ClippedButtonText | PASS | **FAIL** | `text-clipped` |
| OverlappingActions | PASS | **FAIL** | `element-overlap` |
| OffViewportControl | PASS | **FAIL** | `offscreen-control` |
| ContainerClipped | PASS | **FAIL** | `outside-container` |
| KnownGoodControl | PASS | **PASS** | (false-positive guard) |

NotificationCenter (owner-flagged): caught by NEW harness with `offscreen-control, outside-container` — confirms AC9.

## Gates

| Gate | Result |
|------|--------|
| `node --check scripts/check-stories-rendered.mjs` | 0 errors |
| `node --check scripts/geometry-integrity.mjs` | 0 errors |
| `npx tsc --noEmit` | 0 errors |
| `npm run check:stories` | 60 files, 0 violations |
| `screenshots:assert --fast` (NEW harness) | 708/1128 PASS, 420 FAIL (expected — product defects in inventory) |
| `screenshots:assert --fast` (OLD harness) | 1128/1128 PASS (false-negative proof) |

**Note:** The full (non-fast) run with global enumeration (Phase 2: all stories) is pending owner native execution. The `--fast` run covers ASSERT_STORIES at 320/375/390 × 4 locales and demonstrates all planted violations + catches the owner-flagged NotificationCenter cells. Authoritative full-run = owner NATIVE on committed tree.

## Rework R1–R3 (orchestrator review 2026-06-20 — ambiguous third-state, ellipsis, re-run)

**R1/P1 — Ambiguous third-state now functional.** `geometry-integrity.mjs` now populates the `ambiguous` array for borderline cases:
- `element-overlap` where one party is library-internal (base-ui/radix/floating-ui `id` pattern) or `position:absolute|fixed` over a non-positioned sibling in the same parent (popup-over-trigger) → `ambiguous-overlap`
- Horizontal `offscreen-control` where element has an `overflow-x:auto|scroll` ancestor (reachable by scrolling) → `ambiguous-offscreen`

Caller (`check-stories-rendered.mjs`) three-bucket accounting: `pass` = no violations AND no ambiguous; `ambiguousOnly` = no violations but has ambiguous findings (third state, not citable as green proof). Summary now shows `ambiguousOnly` count. Console output shows ambiguous cells with their reasons.

`isAbsoluteOverOwnTrigger` tightened: only matches when ONE element is positioned (absolute/fixed) and the OTHER is not, in the same parent. Two absolute siblings are a REAL collision (fixes OverlappingActions misclassification).

**R2/P2 — Intentional ellipsis → ambiguous.** Text-clipped check now inspects `text-overflow: ellipsis` on the clipping ancestor. If present AND the element has an intact accessible name (`aria-label`/`title`) or is a content link (`<a>`) → `text-clipped-ellipsis` (ambiguous third state). A clip with NO ellipsis (cut mid-glyph) stays hard `text-clipped` FAIL.

**R3/verification — Re-run with planted proof.**

### Planted story proof (R1–R3, `--fast` 2026-06-20T16-45)

| Planted Story | Cells | Bucket | failReason | Expected |
|---|---|---|---|---|
| ClippedButtonText | 12/12 FAIL | hard | `text-clipped` | FAIL ✅ |
| OverlappingActions | 12/12 FAIL | hard | `element-overlap` | FAIL ✅ (fixed from ambiguous) |
| OffViewportControl | 12/12 FAIL | hard | `offscreen-control` | FAIL ✅ |
| ContainerClipped | 12/12 FAIL | hard | `text-clipped` | FAIL ✅ |
| KnownGoodControl | 12/12 PASS | clean | — | PASS ✅ |
| **AmbiguousOverlap** | 12/12 AMBIGUOUS | third-state | `ambiguous-overlap` | AMBIGUOUS ✅ (R1 proof) |
| **IntentionalEllipsis** | 12/12 AMBIGUOUS | third-state | `text-clipped-ellipsis` | AMBIGUOUS ✅ (R2 proof) |

### Full summary (--fast, 2026-06-20T18-49 — verified native run)

```
Results: 707/1152 PASS, 397 FAIL, 48 AMBIGUOUS (needs-owner-decision)
  text-clipped: 360
  offscreen-control: 204
  outside-container: 234
  element-overlap: 108
  bottomsheet-overflow: 72
  ambiguous-overlap: 228
```

Hard defects: 397 (down from original 420 — borderline cases moved to ambiguous).
Ambiguous: 48 cells with `ambiguousOnly=true` (was structurally 0 before R1).
`ambiguousOverlap: 228` cells have ambiguous findings (was 0).

Ambiguous breakdown (harness-emitted, not hand-written):
- `PasswordInput/Default`: 12 cells — `ambiguous-overlap` (Base-UI internal password toggle)
- `RVS/Populated`: 12 cells — `ambiguous-offscreen` (carousel items in `overflow-x:scroll` parent)
- `Planted/AmbiguousOverlap`: 12 cells — `ambiguous-overlap` (R1 proof)
- `Planted/IntentionalEllipsis`: 12 cells — `text-clipped-ellipsis` (R2 proof)

Bug fix: ambiguous section now prints even when `failed > 0` (was unreachable due to early `return`).

**Authoritative full run = owner NATIVE on committed tree.** This `--fast` run is SCREEN only.

## C2 + R4 (2026-06-20T21-04) — HISTORICAL / SUPERSEDED by Round 3 (B3 genuine unstyled) + Round 5 (retry fix)

> **Note:** The UnstyledFrame description below refers to the OLD CSS-injection approach (replaced in Round 2/B3 with genuine stylesheet disabling). The "after 2 retries each" claim about the OLD harness was incorrect — the OLD harness at `5c2edabae` has no style-retry path; retries apply only to the NEW harness. ContainerEscape OLD-PASS/NEW-FAIL proof is pending owner native run. See Round 4/5 sections for current truth.

**C2: `Planted/ContainerEscape` → `outside-container` FAIL.** Icon-only button (no text, `aria-label` only) at `position:absolute; left:50` inside an 80px `overflow:hidden` parent — escapes by 30px. Text-clipped check skips (no text). 12/12 FAIL with `outside-container`. **OLD-PASS/NEW-FAIL transcript: PENDING owner native run.**

**R4: Style-integrity layer.** New `styleIntegrity` check runs after anchors, before Layer 2/3. Detects `unstyled-render` via 4 signals: body margin, stylesheets with rules, font not UA-serif (incl. bare `serif` generic), DS control themed (tri-state). Fail when ≥2 applicable signals indicate unstyled. Style-not-ready retried up to MAX_ATTEMPTS; after exhaustion → `hardAfterRetries=true` + `renderCheck.failReason='unstyled-render'` stamped post-loop → hard non-transient FAIL.

**`Planted/UnstyledFrame`** — now uses `useLayoutEffect` to genuinely disable all stylesheets (both OLD and NEW harness see the same raw-UA frame). **OLD-PASS/NEW-FAIL transcript: PENDING owner native run.**

### Planted story proof (C2 + R4, `--fast` 2026-06-20T21-04)

| Planted Story | Cells | Bucket | failReason | Expected |
|---|---|---|---|---|
| ClippedButtonText | 12/12 FAIL | hard | `text-clipped` | FAIL |
| OverlappingActions | 12/12 FAIL | hard | `element-overlap` | FAIL |
| OffViewportControl | 12/12 FAIL | hard | `offscreen-control` | FAIL |
| ContainerClipped | 12/12 FAIL | hard | `text-clipped` | FAIL |
| **ContainerEscape** | 12/12 FAIL | hard | **`outside-container`** | FAIL (C2 proof) |
| KnownGoodControl | 12/12 PASS | clean | — | PASS |
| AmbiguousOverlap | 12/12 AMBIGUOUS | third-state | `ambiguous-overlap` | AMBIGUOUS |
| IntentionalEllipsis | 12/12 AMBIGUOUS | third-state | `text-clipped-ellipsis` | AMBIGUOUS |
| **UnstyledFrame** | 12/12 FAIL | hard | **`unstyled-render`** (after 2 retries) | FAIL (R4 proof) |

### Full summary (--fast, 2026-06-20T21-04)

```
Results: 708/1176 PASS, 420 FAIL, 48 AMBIGUOUS (needs-owner-decision)
  text-clipped: 360, offscreen-control: 204, outside-container: 246,
  element-overlap: 108, bottomsheet-overflow: 72,
  ambiguous-overlap: 228, unstyled-render: 12
```

## Gates (updated C2 + R4, verified 2026-06-20T21-04)

| Gate | Result |
|------|--------|
| `node --check scripts/check-stories-rendered.mjs` | 0 errors |
| `node --check scripts/geometry-integrity.mjs` | 0 errors |
| `npx tsc --noEmit` | 0 errors |
| `npm run check:stories` | 60 files, 0 violations |
| `screenshots:assert --fast` (C2 + R4) | 708/1176 PASS, 420 FAIL, 48 AMBIGUOUS |
| Planted 5 hard classes | all 60/60 FAIL |
| Planted known-good | 12/12 PASS |
| Planted 2 ambiguous classes | all 24/24 AMBIGUOUS |
| Planted unstyled | 12/12 FAIL `unstyled-render` (after retries) |

**Correction (B5 session transcript claim):** The session log previously stated `Planted/UnstyledFrame` retried "after 2 retries each" under the OLD harness. This is incorrect — the OLD harness at `5c2edabae` has no style-retry path. The OLD harness captured the unstyled frame and scored it PASS (no style check existed). The "after 2 retries" applies only to the NEW harness (R4 style-not-ready retry loop).

## Round 2 rework (B1–B8, 2026-06-21)

Orchestrator diff+manifest review identified 8 blockers. All implemented in this round:

**B1 — Full global inventory.** Inventory generation automated: harness writes per-cell markdown from the manifest after each run. Task 467 marked INCOMPLETE for full non-fast global inventory — pending owner NATIVE full run. The `--fast` inventory covers ASSERT_STORIES scope.

**B2 — Per-cell inventory rows.** Inventory now generated FROM the manifest with one row per failing cell: `storyId · locale · viewport · screenshot · failReason · selector/label`. Aggregated rows replaced.

**B3 — Genuine unstyled planted proof.** `Planted/UnstyledFrame` now uses `useLayoutEffect` to disable all `<link rel="stylesheet">` and remove all `<style>` elements — genuine CSS removal, not CSS injection. Both OLD and NEW harness capture the identical genuinely-unstyled frame (body margin reverts to UA 8px, fonts revert to serif, no stylesheet rules remain).

**B4 — AdminCurrenciesManager sq@375 entry.** Pending owner NATIVE run — the harness now records and outputs the literal manifest entry for every cell including `admin-admincurrenciesmanager--default × sq × mobile-375`. The `--fast` run includes this cell; the entry will appear in the auto-generated inventory.

**B5 — ContainerEscape OLD-PASS + NEW-FAIL.** Proof pending owner run against OLD harness at `5c2edabae` then NEW. The planted fixture (`ContainerEscape`: icon-only button escaping an `overflow:hidden` parent by 30px) is correct and exercises the `outside-container` path distinctly from `text-clipped`.

**B6 — Fail-closed enumeration.** `index.json` read failure now aborts the run with `process.exitCode = 1` and returns — never `console.warn` + empty `geometryOnlyStories`.

**B7 — Ambiguous verdict unambiguous to machine readers.** Per-cell shape: `cell.verdict = 'pass' | 'fail' | 'ambiguous'`. Ambiguous cells have `cell.pass = false` + `cell.ambiguousOnly = true` + `cell.verdict = 'ambiguous'`. No consumer can read an ambiguous cell as a clean PASS. Summary counting uses `verdict` field. Console output: `?` for ambiguous, `✗` for fail, `✓` for pass.

**B8 — `unstyled-render` non-transient after MAX_ATTEMPTS.** After retry loop exhaustion: `cell.hardAfterRetries = true`. `isTransientFailure` checks `hardAfterRetries` first → returns `false` → cell is never classified transient. During the retry loop: `hardAfterRetries` not yet set → `isTransientFailure` returns `true` for style failures → retries happen normally.

**Advisory: `bottomsheet-overflow` bottom-edge.** Extended to also catch controls whose `top` is inside but `bottom` extends past the sheet bottom (partial clip). Previously only caught controls whose `top` was past the sheet bottom.

### Gates (B1–B8, verified 2026-06-21)

| Gate | Result |
|------|--------|
| `node --check scripts/check-stories-rendered.mjs` | 0 errors |
| `node --check scripts/geometry-integrity.mjs` | 0 errors |
| `npx tsc --noEmit` | 0 errors |
| `npm run check:stories` | 60 files, 0 violations |

**Note:** Full `screenshots:assert` run pending owner NATIVE execution. The planted-proof matrix (OLD-PASS + NEW-FAIL) and the AdminCurrenciesManager sq@375 manifest entry will be pasted after the owner's native run.

## Round 3 rework (F3 + F-G/F-H/F-I/F-serif, 2026-06-21)

Orchestrator code review found a critical false-green regression (F3) plus cleanup items.

**F3 [CRITICAL — false-green / 464 regression].** Every early failure path in `captureCell()` now sets `cell.verdict='fail'`. Affected paths: loader-only, blank/empty-canvas, blank-screenshot, render-failed, anchor-missing (2 paths), style unstyled-render, catch/error. Without this, a run whose only failures were early-exit (e.g. all-unstyled) would report `failed=0` and exit green. Summary counting is now defensive: any `cell.pass===false && cell.verdict!=='ambiguous'` counts as a hard fail.

**F-G [unstyled-render robustly final-hard].** `unstyled-render` added to `HARD_FAIL_REASONS` set. Combined with F3's `verdict='fail'` on the style early-return, a still-unstyled-after-retries cell is counted in `failed` and triggers exit 1.

**F-H [`self-clipped` — explicitly deferred].** `self-clipped` was documented + in `HARD_FAIL_REASONS` + had a summary counter, but `geometry-integrity.mjs` never pushed it (structurally always 0). Removed from `HARD_FAIL_REASONS`, marked DEFERRED in docs/governance. Summary counter kept for future implementation.

**F-I [style failures out of Bucket 1].** Inventory generator now excludes cells where `styleIntegrity.pass === false` from Bucket 1 (product hard defects). Style-only failures appear only in the capture/style-integrity section.

**F-serif [style detector].** Font detection regex now matches bare generic `serif` in addition to `"Times New Roman"`.

**A/B2 [inventory placeholder].** Inventory file rewritten as an explicit INCOMPLETE placeholder — documents the auto-generation format, notes it will be overwritten by the next `screenshots:assert` run. No overclaiming.

**Risk check (UnstyledFrame leaking):** Each cell gets its own `page = await browser.newPage()` + `page.close()` in `captureCell()`. The `useLayoutEffect` stylesheet disabling runs in that page's document only. No state leaks to subsequent cells.

### Gates (Round 3, verified 2026-06-21)

| Gate | Result |
|------|--------|
| `node --check scripts/check-stories-rendered.mjs` | 0 errors |
| `node --check scripts/geometry-integrity.mjs` | 0 errors |
| `npx tsc --noEmit` | 0 errors |
| `npm run check:stories` | 60 files, 0 violations |

### Pending transcripts/proofs (owner NATIVE run)

- **F-G proof:** A run where the only failures are early-exit (e.g. unstyled) must yield `failed>0` and exit 1 — confirm on next run.
- **B4:** AdminCurrenciesManager `sq@375` literal manifest entry.
- **B5/D:** ContainerEscape OLD-PASS@`5c2edabae` + NEW-FAIL(`outside-container`).
- **E/B3:** UnstyledFrame OLD-PASS@`5c2edabae` + NEW-FAIL(`unstyled-render`) with genuine raw-UA frame.
- **B1:** Full non-fast global-enumeration inventory.

## Files Changed

| File | Rationale |
|------|-----------|
| `scripts/check-stories-rendered.mjs` | F3: `cell.verdict='fail'` on all 7 early-return paths. F-G: `unstyled-render` in `HARD_FAIL_REASONS`. F-H: `self-clipped` removed from `HARD_FAIL_REASONS` (DEFERRED). F-I: style-only cells excluded from Bucket 1 inventory. F-serif: font regex includes bare `serif`. Defensive `failed` count. B6: fail-closed index.json. B7: `cell.verdict` field. B8: `hardAfterRetries`. Auto-generated inventory |
| `scripts/geometry-integrity.mjs` | Advisory: `bottomsheet-overflow` partial bottom-clip |
| `src/stories/PlantedVisualViolations.stories.tsx` | B3: `UnstyledFrame` genuinely disables all stylesheets via `useLayoutEffect` |
| `docs/storybook-governance.md` | §14.4.2: `self-clipped` DEFERRED, `bottomsheet-overflow` partial-clip, `verdict` on all paths. §14.4.3: serif generic + `HARD_FAIL_REASONS` |
| `docs/critical-flow-registry.md` | Round 3: F3 early-exit verdict, self-clipped DEFERRED, F-serif, F-I |
| `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` | Explicit INCOMPLETE placeholder — auto-generated on next run |
| `docs/sessions/2026-06-19-task-467-storybook-geometry-visual-assertions.md` | This session log — Round 3 section |
| `docs/backlog.md` | Task 467 status updated |

## Round 4 — docs/evidence accuracy cleanup (2026-06-21)

Orchestrator review confirmed Round 3 code is correct. Round 4 is docs accuracy only — no overclaiming.

**G1 — Coverage downgraded to 🟡.** `critical-flow-registry.md` rendered-proof row: Coverage changed from ✅ to 🟡 (partial — proof pending). The row now explicitly lists which OLD-PASS/NEW-FAIL proofs are pasted (ClippedButtonText, OverlappingActions, OffViewportControl, ContainerClipped, KnownGoodControl) vs pending (ContainerEscape, UnstyledFrame, F-G early-exit, AdminCurrenciesManager sq@375, full inventory).

**G2 — Governance "standing fixtures" wording.** `storybook-governance.md` §14.4.2 now says "standing fixtures" (not "standing proof") for the planted stories, and explicitly notes which proofs are pasted vs pending owner native run.

**G4 — Unrelated dirty files (NOT Task 467, exclude from commit):**
- `.gitignore` (modified)
- `AGENTS.md` (modified)
- `tasks/Epics/Epic_BB_kickoff_prompt_Task_463_AdminReportFullManagement.md` (modified)
- `tasks/kickoff_prompt_Task_467_StorybookGeometryVisualAssertions.md` (modified — orchestrator file)
- `tasks/Epics/Epic_BB_kickoff_prompt_Task_462_AdminReportOwnerRowCleanup.md` (new)

**Advisory — style failure propagated to renderCheck.** When `styleIntegrity.pass === false`, `renderCheck.failReason` is now set to `unstyled-render` (if not already set), so `HARD_FAIL_REASONS` catches it directly in `isTransientFailure` — cleaner than relying solely on `hardAfterRetries` side-effect.

**G3 — Pending transcripts/entries (owner native run):**
1. F-G: early-exit-only run → `failed>0` + exit 1
2. AdminCurrenciesManager `sq@375` literal manifest entry
3. ContainerEscape OLD@`5c2edabae` PASS + NEW FAIL(`outside-container`)
4. UnstyledFrame OLD@`5c2edabae` PASS + NEW FAIL(`unstyled-render`)
5. Full non-fast global inventory (AC1/AC9)

Task 467 stays INCOMPLETE until G3 transcripts are attached.

### Gates (Round 4, verified 2026-06-21)

| Gate | Result |
|------|--------|
| `node --check scripts/check-stories-rendered.mjs` | 0 errors |
| `node --check scripts/geometry-integrity.mjs` | 0 errors |
| `npx tsc --noEmit` | 0 errors |
| `npm run check:stories` | 60 files, 0 violations |

## Files Changed (cumulative — all rounds)

| File | Rationale |
|------|-----------|
| `scripts/check-stories-rendered.mjs` | Task 467 core: Layer 3 geometry integration, global enumeration (fail-closed B6), style-integrity (R4), 9 planted ASSERT_STORIES entries, three-bucket `verdict` field on ALL paths (F3), `unstyled-render` in `HARD_FAIL_REASONS` (F-G), `self-clipped` DEFERRED (F-H), style-only excluded from Bucket 1 (F-I), serif generic (F-serif), `hardAfterRetries` (B8), defensive failed count, auto-generated per-cell inventory. Round 5 (P1): reverted advisory renderCheck propagation inside captureCell; stamp renderCheck.failReason='unstyled-render' only post-MAX_ATTEMPTS in hardening blocks |
| `scripts/geometry-integrity.mjs` | Element-geometry visual-integrity assertions; R1 ambiguous; R2 ellipsis→ambiguous; bottomsheet partial-clip |
| `src/stories/PlantedVisualViolations.stories.tsx` | 9 planted test stories incl. B3 genuine stylesheet-disabling UnstyledFrame + C2 ContainerEscape |
| `docs/storybook-governance.md` | §14.4.2 geometry contract + §14.4.3 style contract; G2 "standing fixtures" wording |
| `docs/critical-flow-registry.md` | Rendered-proof row: G1 Coverage 🟡, proof status truthful |
| `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` | INCOMPLETE placeholder — auto-generated on next run |
| `docs/sessions/2026-06-19-task-467-storybook-geometry-visual-assertions.md` | This session log |
| `docs/backlog.md` | Task 467 status (orchestrator-owned — coordinate) |

## Round 5 — fix retry-order regression (2026-06-21)

Round 4's advisory change (stamping `renderCheck.failReason='unstyled-render'` inside `captureCell`) broke the style retry-first contract: `unstyled-render` in `HARD_FAIL_REASONS` caused `isTransientFailure` to return `false` at L365 before reaching the style-retry branch at L381, making the first style failure non-transient and breaking retries.

**P1 fix (option a):** Reverted the `renderCheck.failReason` propagation from the style early-return in `captureCell`. Now `renderCheck.failReason` stays `null` during the retry loop (render check itself passed). The style-retry branch at L381 (`styleIntegrity.pass === false → return true`) governs retryability during attempts. Only AFTER `MAX_ATTEMPTS` exhaustion, in the post-loop hardening blocks (both Phase 1 L997 and Phase 2 L1037), `hardAfterRetries=true` is set AND `renderCheck.failReason='unstyled-render'` is stamped together — making the cell robustly hard/non-transient.

**Retry trace for a persistently-unstyled cell:**
1. Attempt 1: `captureCell` → style fails → `cell.pass=false, verdict='fail'` (no renderCheck.failReason stamp)
2. `isTransientFailure`: `hardAfterRetries` not set → `rc.failReason` is null → `HARD_FAIL_REASONS` doesn't trigger → falls through to `styleIntegrity.pass===false → return true` (transient) → **retry** ✓
3. Attempts 2, 3: same → retries ✓
4. `attempt >= MAX_ATTEMPTS` → loop breaks
5. Post-loop: `hardAfterRetries=true` + `renderCheck.failReason='unstyled-render'` stamped
6. Cell counted in `failed` (verdict='fail') → exit 1 ✓

**P4:** Superseded session sections marked HISTORICAL (OLD-PASS/NEW-FAIL initial proof, C2+R4 section with old CSS-injection UnstyledFrame + incorrect OLD-harness retry claim).

### Gates (Round 5, verified 2026-06-21)

| Gate | Result |
|------|--------|
| `node --check scripts/check-stories-rendered.mjs` | 0 errors |
| `node --check scripts/geometry-integrity.mjs` | 0 errors |
| `npx tsc --noEmit` | 0 errors |
| `npm run check:stories` | 60 files, 0 violations |

### Carry-overs (unchanged, still gating for CLOSE — owner-native G3):
1. F-G/P3: early-exit-only run → `failed>0` + exit 1 (now demonstrable with the retry fix)
2. AdminCurrenciesManager `sq@375` literal manifest entry
3. ContainerEscape OLD@`5c2edabae` PASS + NEW FAIL(`outside-container`)
4. UnstyledFrame OLD@`5c2edabae` PASS + NEW FAIL(`unstyled-render`)
5. Full non-fast global inventory

Coverage stays 🟡 until G3 attached. Task 467 INCOMPLETE pending owner native run.

## Round 6 — fix UnstyledFrame "No Preview" (2026-06-21, owner-native screenshot review) — SUPERSEDED BY Round 7

> **STALE — this round's approach (targeted `setProperty` overrides) was rejected by the owner as synthetic.
> Round 7 replaced it with CSS `revert`. The detector trace below is incorrect for the final code.**

Owner-native screenshots showed Planted/UnstyledFrame captures are Storybook "No Preview" / docs table UI — not the planted content. Root cause: the Round 2/B3 approach (disabling ALL `link[rel="stylesheet"]` + removing ALL `<style>` elements) nuked Storybook's own infrastructure CSS, causing the preview iframe to fall back to its error/docs UI.

**Fix (superseded):** Replaced stylesheet destruction with targeted CSS overrides via `useLayoutEffect`.

### Gates (Round 6, verified 2026-06-21)

| Gate | Result |
|------|--------|
| `node --check scripts/check-stories-rendered.mjs` | 0 errors |
| `node --check scripts/geometry-integrity.mjs` | 0 errors |
| `npx tsc --noEmit` | 0 errors |
| `npm run check:stories` | 60 files, 0 violations |

G3 NOT claimed complete — pending new owner-native screenshots/manifest confirming the fix.

## Round 7 — genuine CSS `revert` approach for UnstyledFrame (2026-06-21, owner review)

Owner rejected the Round 6 body/font-only override as "effectively a synthetic signal override, the same class of proof B3 previously rejected." Requirement: DS/Tailwind styles must genuinely NOT be applied to the planted content — not just two signals manually forced while stylesheets stay loaded.

**Fix:** Replaced the `document.body.style.setProperty` approach with CSS `revert` — the W3C cascade mechanism that rolls back past author stylesheets to UA defaults:

1. **`body { margin: revert !important }`** in an injected `<style>` element — author-origin `revert` rolls back past Tailwind preflight's `margin: 0` to the UA default `margin: 8px`. This is a genuine cascade rollback, not a hardcoded value.

2. **`[data-testid="planted-violations-root"], [data-testid="planted-violations-root"] * { all: revert !important }`** — `all: revert` rolls back ALL CSS properties on the planted container and its descendants to UA defaults. This genuinely prevents every DS/Tailwind/author-stylesheet rule from applying to the planted content. Elements get: UA serif font, UA default margins/padding, no border-radius, no themed backgrounds — genuine raw-UA appearance.

**What this is NOT:** It does not disable or remove any stylesheets (SB infrastructure intact). It does not hardcode `8px` or `"Times New Roman"` — both values come from the browser's UA stylesheet via the `revert` mechanism. Stylesheets remain loaded (`sheetsWithRules` = true), but the CSS cascade genuinely prevents their rules from affecting the planted content.

**Detector trace (pre-native prediction — see G3.2 for final observed signals):**

> **STALE prediction below.** This trace was written before owner-native evidence. The actual
> observed signals (G3.2, `task467-new-planted-containerescape-unstyledframe.json`) differ:
> `fontFamily` stays `"Geist, sans-serif"` (inherited from un-reverted `#storybook-root` ancestor;
> CSS `revert` on a child cannot change inherited properties from ancestors outside the revert scope).
> `controlThemed=false` (not `not-applicable`) because UnstyledFrame intentionally uses
> `data-slot="button"`, and after `all: revert !important` the button has zero DS theming.
> The two failing signals are `bodyMargin="8px"` + `controlThemed=false`, not margin + font.
>
> **Final observed signals (G3.2):** `bodyMargin="8px"`, `sheetsWithRules=true`,
> `fontFamily="Geist, sans-serif"`, `controlThemed=false`. failCount = 2 (bodyMargin + controlThemed)
> ≥ 2 → `unstyled-render` FAIL. `retryCount=2`, `hardAfterRetries=true`.

**Screenshot expectation:** Planted content (`<p>` + `<div role="button" data-slot="button" data-testid="planted-unstyled-btn">`) rendered with `body { margin: revert }` (UA 8px) and `all: revert !important` on the planted container (DS theming removed from planted content). Font inherits Geist from the Storybook shell ancestor. No Storybook "No Preview" / docs table / error UI.

**No leak across cells:** each `captureCell` creates a fresh `browser.newPage()` + closes it in `finally`. The injected `<style>` exists only in that page's document.

### Gates (Round 7, verified 2026-06-21)

| Gate | Result |
|------|--------|
| `node --check scripts/check-stories-rendered.mjs` | 0 errors |
| `node --check scripts/geometry-integrity.mjs` | 0 errors |
| `npx tsc --noEmit` | 0 errors |
| `npm run check:stories` | 60 files, 0 violations |

G3 NOT claimed complete — pending owner-native screenshots/manifest confirming the genuine CSS `revert` approach produces a clean planted raw-UA frame.

## G3 — Owner-native evidence (2026-06-22)

All five G3 carry-overs are now resolved with owner-native transcripts.

### G3.1 — ContainerEscape OLD-PASS + NEW-FAIL ✅ PROVEN

**OLD@`5c2edabae`** (`docs/sessions/task467-old-planted-containerescape-unstyledframe.json`): ContainerEscape 12/12 PASS — all cells `pass=true`, `anchorsFound=["escape-btn"]`, `renderFailReason=null`. The OLD harness does NOT detect the container-escape violation.

**NEW** (`docs/sessions/task467-new-planted-containerescape-unstyledframe.json`): ContainerEscape 12/12 FAIL — all cells `verdict='fail'`, `outside-container` for `[data-testid="planted-escape-btn"]`, `details: "escapes by R=30 B=-10 L=-50 T=0px"`. `styleIntegrity.pass=true` (Geist sans-serif, 0px margin, sheets with rules).

### G3.2 — UnstyledFrame OLD-PASS + NEW-FAIL ✅ PROVEN

**OLD@`5c2edabae`** (`docs/sessions/task467-old-planted-containerescape-unstyledframe.json`): UnstyledFrame 12/12 PASS — all cells `pass=true`, `anchorsFound=["unstyled-btn"]`, `fullWidthButtonsAtMobile=true`. The OLD harness does NOT detect the unstyled render.

**NEW** (`docs/sessions/task467-new-planted-containerescape-unstyledframe.json`): UnstyledFrame 12/12 FAIL — all cells `verdict='fail'`, `renderFailReason='unstyled-render'`, `hardAfterRetries=true`, `retryCount=2`. Style signals: `bodyMargin="8px"` (CSS `revert` → UA default), `sheetsWithRules=true`, `fontFamily="Geist, sans-serif"`, `controlThemed=false`. 2 of 3 applicable signals fail → threshold met → `unstyled-render` FAIL.

### G3.3 — F-G / Round 5 retry-order invariant ✅ PROVEN (two independent proofs)

**Primary proof (NEW harness, UnstyledFrame `retryCount=2 + hardAfterRetries`):** The NEW-harness planted UnstyledFrame manifest (`docs/sessions/task467-new-planted-containerescape-unstyledframe.json`) shows 12/12 cells with `retryCount=2`, `hardAfterRetries=true`, `renderFailReason='unstyled-render'`, `verdict='fail'`. This is the direct proof of the Round 5 retry-order fix: style failure is transient during the retry loop (retries happen — `retryCount=2`), then after MAX_ATTEMPTS exhaustion `hardAfterRetries=true` is stamped, making the cell non-transient and counted in `failed` → exit non-zero. The NEW `--fast` run (`docs/sessions/task467-new-fast-owner-native-unstyled-fixed.log`) confirms `unstyled-render: 12` in the summary with overall 420 FAIL.

**Secondary evidence (OLD harness, early-exit exit=1):** OLD@`5c2edabae` `--fast` (`docs/sessions/task467-old-5c2edabae-fast-owner-native.log` + `task467-old-5c2edabae-fast-owner-native.exit.txt`): 91 stories × 3 × 4 = 1092 cells. Results: 936/1092 PASS, 156 FAIL (`anchor-missing: 48`). Exit code: 1. All 156 failures are AdminReportsManager render failures (`sb-show-errordisplay: Couldn't find story` — Task 463 stories absent from committed tree). This is supplementary evidence that early-exit render failures produce `failed>0 → exit 1`, but it runs the OLD harness at `5c2edabae` (no Round 5 code), so it does NOT directly prove the NEW harness F-G/retry-order invariant — the UnstyledFrame manifest above does.

### G3.4 — AdminCurrenciesManager `default × sq × mobile-375` manifest entry ✅ PRESENT

Cell `admin-admincurrenciesmanager--default × sq × mobile-375` extracted to `docs/sessions/task467-admincurrencies-sq-mobile-375-entry.json`. Result: `verdict='pass'`, `pass=true`, `retryCount=0`. `styleIntegrity.pass=true` (bodyMargin `0px`, sheetsWithRules `true`, fontFamily `Geist, sans-serif`, controlThemed `true`). `visualIntegrity.pass=true` (0 violations, 0 ambiguous). `anchorsExpected=["currencies"]`, `anchorsFound=["currencies"]`. `noHorizontalOverflow=true`, `fullWidthControlsAtMobile=true`, `fullWidthButtonsAtMobile=true`. Screenshot: `admin-admincurrenciesmanager--default__sq__mobile-375.png` (375×812, nonBackgroundRatio 0.47).

### G3.5 — Full non-fast global-enumeration inventory — AUTO-GENERATED

`docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` — auto-generated by the harness during the full (non-fast) run. **287 stories, 7756 cells** (98 ASSERT × 14 viewports × 4 locales = 5488 + 189 geometry-only × 3 viewports × 4 locales = 2268).

**Pre-V1 run (superseded):** exited -1 (abnormal, `task467-full-owner-native.exit.txt`). Summary: 5227/2225/304.

**V1–V2 run (authoritative):** exited **1** (controlled, `task467-full-owner-native-v1v2.exit.txt`). Summary: **5304 PASS / 2129 FAIL / 323 AMBIGUOUS**. Blank-screenshot false positives (primitives-badge/checkbox/popover/sheet) eliminated by V1 domRenderPassed gate. Inventory regenerated from this run.

### G3.6 — NEW `--fast` owner-native run summary ✅

`docs/sessions/task467-new-fast-owner-native-unstyled-fixed.log`: Assert stories: 98 | Viewports: 3 | Locales: 4 | Geometry-only: 189 (2268 cells). **Results: 708/1176 PASS, 420 FAIL, 48 AMBIGUOUS**. Violation breakdown: text-clipped: 360, offscreen-control: 204, outside-container: 246, element-overlap: 108, bottomsheet-overflow: 84, ambiguous-overlap: 228, unstyled-render: 12. Consistent with all prior `--fast` runs.

### Planted-violation proof matrix (complete, owner-native)

| Planted Story | OLD@`5c2edabae` | NEW (Task 467) | failReason | Evidence file |
|---|---|---|---|---|
| ClippedButtonText | PASS | **FAIL** | `text-clipped` | (prior rounds) |
| OverlappingActions | PASS | **FAIL** | `element-overlap` | (prior rounds) |
| OffViewportControl | PASS | **FAIL** | `offscreen-control` | (prior rounds) |
| ContainerClipped | PASS | **FAIL** | `text-clipped` | (prior rounds) |
| **ContainerEscape** | **PASS** | **FAIL** | `outside-container` | `task467-{old,new}-planted-containerescape-unstyledframe.json` |
| KnownGoodControl | PASS | **PASS** | (false-positive guard) | (prior rounds) |
| AmbiguousOverlap | PASS | **AMBIGUOUS** | `ambiguous-overlap` | (prior rounds) |
| IntentionalEllipsis | PASS | **AMBIGUOUS** | `text-clipped-ellipsis` | (prior rounds) |
| **UnstyledFrame** | **PASS** | **FAIL** | `unstyled-render` (`hardAfterRetries`) | `task467-{old,new}-planted-containerescape-unstyledframe.json` |

All 9 planted stories verified. 5 hard-FAIL + 2 ambiguous + 1 PASS (false-positive guard) + 1 unstyled FAIL = complete coverage.

### Owner-native evidence files

| File | Contents |
|------|----------|
| `docs/sessions/task467-new-fast-owner-native-unstyled-fixed.log` | NEW `--fast` run (Round 7 CSS `revert`): 708/1176 PASS, 420 FAIL, 48 AMBIGUOUS |
| `docs/sessions/task467-new-planted-containerescape-unstyledframe.json` | NEW planted ContainerEscape + UnstyledFrame per-cell results (24 cells, all FAIL) |
| `docs/sessions/task467-admincurrencies-sq-mobile-375-entry.json` | `admin-admincurrenciesmanager--default × sq × mobile-375` manifest entry: verdict=pass, all checks pass |
| `docs/sessions/task467-old-5c2edabae-fast-owner-native.log` | OLD@`5c2edabae` `--fast` run: 936/1092 PASS, 156 FAIL (all AdminReportsManager not-found) |
| `docs/sessions/task467-old-5c2edabae-fast-owner-native.exit.txt` | OLD run exit code: 1 |
| `docs/sessions/task467-old-planted-containerescape-unstyledframe.json` | OLD planted ContainerEscape + UnstyledFrame per-cell results (24 cells, all PASS) |
| `docs/sessions/task467-full-owner-native.log` | Pre-V1 full run log — process exited -1 (abnormal, superseded) |
| `docs/sessions/task467-full-owner-native.exit.txt` | Pre-V1 full run exit code: -1 (superseded) |
| `docs/sessions/task467-full-owner-native-v1v2.exit.txt` | **V1–V2 full run exit code: 1 (controlled)** |
| `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` | Auto-generated global inventory: 287 stories, 7756 cells, 5304/2129/323 (V1–V2 full run, exit=1 controlled, authoritative) |

### G3 verdict

All 5 carry-over items resolved with owner-native transcripts. Coverage stays 🟡 — V1/V2 identified below.

## V1–V4 final pass (2026-06-22)

**V1 — blank-screenshot false positives in Bucket 1.** The full inventory mislabelled known-good low-pixel/closed-state primitive stories as Bucket 1 hard defects: `primitives-badge--default` at huge viewports, `primitives-checkbox--default`, `primitives-popover--default`, `primitives-sheet--filter-sheet-right` at canonical-560+. Root cause: `assertScreenshotHasMeaningfulPixels` applied near-uniform thresholds (nonBackgroundRatio < 0.5% && variance < 10) even when the DOM render check had already confirmed visible content. A tiny badge on a 2560px canvas is near-uniform but not blank. Fix: added `domRenderPassed` parameter to `assertScreenshotHasMeaningfulPixels`. When the DOM check passed (real content confirmed), only truly degenerate bitmaps (zero variance + zero non-background = literally one flat colour) still fail. The all-white self-test PNG has no DOM context and still uses strict thresholds.

**V2 — full-run exit=-1 diagnosis and fix.** The prior full run exited -1 (PowerShell `$LASTEXITCODE`). The harness used `process.exitCode = 1` + `return` for controlled exits but had no handler for `uncaughtException`/`unhandledRejection` — Node crashes from OOM or unhandled promises exit with OS-level codes that PowerShell maps to -1. Fix: added `process.on('uncaughtException')` and `process.on('unhandledRejection')` handlers at module top that log diagnostics and set `process.exitCode = 2`. Exit 2 = harness crash (distinguishable from controlled exit 1 = defects found). Full run pending re-execution to confirm clean exit.

**V3 — registry/governance honesty.** `critical-flow-registry.md` coverage downgraded to 🟡 (V1/V2 pending). UnstyledFrame wording corrected: R4 description now accurately states `bodyMargin="8px"` + `controlThemed=false` as the two failing signals (not `serif font` or `genuine raw-UA frame`). `fontFamily` stays `"Geist, sans-serif"` (inherited from SB shell).

**V4 — comment accuracy.** `PlantedVisualViolations.stories.tsx` top comment: "standing proof" → "standing fixtures". Inventory generator: same fix.

### V1–V4 gates

| Gate | Result |
|------|--------|
| `node --check scripts/check-stories-rendered.mjs` | 0 errors |
| `node --check scripts/geometry-integrity.mjs` | 0 errors |
| `npm run check:stories` | 60 files, 0 violations |
| `npm run build-storybook` | ✅ |
| `npm run screenshots:assert` (full) | **7756 cells, 5304 PASS / 2129 FAIL / 323 AMBIGUOUS. Exit code: 1 (controlled).** |

### V1 proof — false-positive primitives gone from Bucket 1

Previously Bucket 1 contained these known-good stories as `blank-screenshot` false positives:
- `primitives-badge--default` at huge-1920/huge-2560
- `primitives-checkbox--default` at huge-1920/huge-2560
- `primitives-popover--default` at huge-2560
- `primitives-sheet--filter-sheet-right` at canonical-560 through huge-2560

After V1 fix: **zero matches** for any of these four story IDs in the regenerated inventory. All now PASS (DOM confirmed visible content, near-uniform bitmap accepted).

KnownGoodControl false-positive guard: **56/56 PASS** across all 14 viewports × 4 locales (including huge-1920 and huge-2560).

Remaining `blank-screenshot` in Bucket 1: `admin-adminmobileheader--default` at desktop-1024+ — genuine blank (mobile-only header hides itself at desktop widths; DOM render check catches the hidden element but bitmap is truly empty at those viewports).

Blank-screenshot self-test: still operational (runs without `domRenderPassed`, strict thresholds apply, all-white PNG caught).

### V2 proof — full run exits controlled

Full run exit code: **1** (controlled, via `process.exitCode = 1` at defects-found path). Evidence file: `docs/sessions/task467-full-owner-native-v1v2.exit.txt` (`exit=1`). Previous run exited -1 (`task467-full-owner-native.exit.txt`, superseded). The crash guards (`uncaughtException`/`unhandledRejection` → exit 2) were not triggered — the run completed normally.

Full run is now **authoritative** for AC1/AC9: 7756 cells, 287 stories, controlled exit 1.

### V2 — prior exit=-1 diagnosis

The prior full run (`task467-full-owner-native.exit.txt`: `exit=-1`) ran a pre-V1 harness that triggered `blank-screenshot` retries on dozens of primitive stories at large viewports. Each retry re-navigates + re-captures + re-analyses the bitmap, consuming significant time and memory. Combined with 7756 cells and no crash handler, an OOM or timeout kill from the OS would produce exit=-1 (not a Node `process.exitCode`). The V1 fix (DOM-passed cells skip near-uniform thresholds) eliminates these false retries, and the V2 crash guards ensure any future crash exits with code 2 (not -1).

### Files Changed (V1–V4)

| File | Rationale |
|------|-----------|
| `scripts/check-stories-rendered.mjs` | V1: `domRenderPassed` param in `assertScreenshotHasMeaningfulPixels` — skip near-uniform thresholds when DOM confirmed visible content. V2: `uncaughtException`/`unhandledRejection` crash guards (exit 2). V4: inventory "standing proof" → "standing fixtures" |
| `src/stories/PlantedVisualViolations.stories.tsx` | V4: top comment "standing proof" → "standing fixtures" |
| `docs/critical-flow-registry.md` | V3: coverage 🟡, R4 wording corrected (bodyMargin + controlThemed, not serif font) |
| `docs/sessions/2026-06-19-task-467-storybook-geometry-visual-assertions.md` | This session log — V1–V4 section |

---

## V1-FINAL — Full false-positive audit of Bucket 1 (2026-06-22)

Orchestrator deep review identified THREE distinct harness false-positive classes inflating Bucket 1 (>700 of 2129 "hard defects"), plus a verify/allowlist for third-party controls. Fixed each class in harness logic with guard fixtures.

### FP-CLASS A — sr-only / visually-hidden labels read as `text-clipped` (~688 cells)

**Root cause:** `DialogClose` = `<XIcon/>` + `<span className="sr-only">{t('close')}</span>`. The sr-only span is `overflow:hidden` at ~1px, so its text node has `scrollWidth > clientWidth` → `text-clipped` fires. `isIconOnly()` returns false because the button HAS (hidden) text.

**Fix (geometry-integrity.mjs):**
1. Added `isVisuallyHidden(el)` — detects sr-only/visually-hidden pattern via computed style: `position:absolute` + `overflow:hidden|clip` + dimensions ≤1px, OR `clip:rect(0px, 0px, 0px, 0px)`, OR `clip-path:inset(50%)`.
2. Modified `findTextBearingDescendant()` to skip visually-hidden children in the walk.
3. Added `hasOnlyScreenReaderText(el)` — returns true when a control has text content but ALL of it comes from sr-only/visually-hidden descendants (no direct text nodes, no visible element children with text).
4. In Check 1 (text-clipped), added exemption: `if (hasOnlyScreenReaderText(el) && (aria-label || title)) continue;` — effectively icon-only.

**Guard fixture:** `Planted/SrOnlyIconButton` — icon button (✕) with sr-only label span. Must PASS (not text-clipped). Added to `ASSERT_STORIES`.

**Guardrail honored:** fix is harness-side only. Did NOT touch `dialog.tsx` — the `<span class="sr-only">{t('close')}</span>` is correct accessibility markup and stays.

### FP-CLASSES B/C — viewport-mismatch blank-screenshot + geometry (32+ cells)

**Root cause:** `admin-adminmobileheader--default` (mobile-only) blank at desktop-1024+; `admin-adminsidebar--mobile-drawer-open` (mobile drawer) element-overlap at desktop-1024+. Not product defects — stories rendered outside their meaningful viewport range.

**Fix (check-stories-rendered.mjs):**
1. Added `STORY_VIEWPORT_RANGE` map: `{ 'admin-adminmobileheader--default': { maxWidth: 960 }, 'admin-adminsidebar--mobile-drawer-open': { maxWidth: 960 } }`.
2. Added `isOutOfViewportRange(cell)` helper.
3. Excluded viewport-mismatch cells from Bucket 1 filter AND from `failed` count (don't inflate hard-defect count, don't cause exit 1 for viewport-mismatch-only failures).
4. Added new inventory section "Viewport-mismatch failures (NOT product layout defects)".
5. Added `outOfRange` counter to summary table.

### FP-CLASS D — Leaflet third-party map controls

**Verification:** Grepped inventory — confirmed `listings-listingdetailview--public-listing` triggers `text-clipped` on Leaflet controls (`×`, `+`, `−`, `Leaflet` link, `OpenStreetMap` link) at ALL 14 viewports × 4 locales. These are third-party controls, not our layout.

**Fix (geometry-integrity.mjs):** Added `.leaflet-container` ancestor exclusion in element discovery: `candidates.filter(isVisible).filter(el => !el.closest('.leaflet-container'))`. All Leaflet controls excluded from geometry checks.

### Gates

| Gate | Status |
|------|--------|
| `node --check scripts/geometry-integrity.mjs` | ✅ |
| `node --check scripts/check-stories-rendered.mjs` | ✅ |
| `npx tsc --noEmit` | ✅ 0 errors |
| `npm run check:stories` | ✅ 60 files, 0 violations |

### Files Changed (V1-FINAL)

| File | Rationale |
|------|-----------|
| `scripts/geometry-integrity.mjs` | FP-CLASS A: `isVisuallyHidden()`, modified `findTextBearingDescendant()`, `hasOnlyScreenReaderText()`, sr-only exemption in text-clipped check. FP-CLASS D: `.leaflet-container` exclusion in element discovery. |
| `scripts/check-stories-rendered.mjs` | FP-CLASSES B/C: `STORY_VIEWPORT_RANGE`, `isOutOfViewportRange()`, viewport-mismatch inventory section, out-of-range excluded from Bucket 1 + failed count. `SrOnlyIconButton` added to `ASSERT_STORIES`. |
| `src/stories/PlantedVisualViolations.stories.tsx` | Added `SrOnlyIconButton` (FP-CLASS A guard — sr-only icon button must PASS). Updated header comment. |
| `docs/storybook-governance.md` | §14.4.2: documented FP-CLASS A sr-only exemption, FP-CLASS D Leaflet exclusion, FP-CLASSES B/C viewport-range. Updated planted fixture count 9→10. |
| `docs/critical-flow-registry.md` | Updated planted fixture count 9→10. Documented V1-FINAL FP fixes (A/B/C/D). |
| `docs/sessions/2026-06-19-task-467-storybook-geometry-visual-assertions.md` | This V1-FINAL section. |

### AC self-audit (V1-FINAL specific)

| Criterion | Status |
|-----------|--------|
| FP-CLASS A: sr-only text-clipped fixed in harness logic | ✅ (isVisuallyHidden + hasOnlyScreenReaderText + skip in check) |
| FP-CLASS A: guard fixture (SrOnlyIconButton) MUST PASS | ✅ (added to planted stories + ASSERT_STORIES; pending owner-native run) |
| FP-CLASSES B/C: viewport-mismatch out of Bucket 1 | ✅ (STORY_VIEWPORT_RANGE + isOutOfViewportRange filter) |
| FP-CLASS D: Leaflet controls excluded | ✅ (.leaflet-container ancestor exclusion) |
| Harness-only scope (no product layout edits) | ✅ |
| Coverage stays 🟡 | ✅ (pending owner-native re-run with V1-FINAL fixes) |
| All gates green | ✅ (node --check, tsc, check:stories) |

**Pending:** owner-native full re-run to regenerate inventory with V1-FINAL fixes. Expected: hard-defect count drops materially from 2129 (sr-only ~688 + viewport-mismatch ~50 + Leaflet ~168 leave Bucket 1). Inventory will be auto-regenerated by the harness from the new manifest.

---

## V1-FINAL rework (reviewer check, 2026-06-22)

Five issues found by reviewer. All fixed, harness/docs only:

### Fix 1 — sr-only exemption no longer requires aria-label/title

**Problem:** Real `DialogClose` is `<XIcon/> + <span class="sr-only">{t('close')}</span>` with NO `aria-label`/`title` on the button. The old guard `hasOnlyScreenReaderText(el) && (aria-label || title)` missed this canonical case.

**Fix:** Removed the `aria-label`/`title` requirement. Now `hasOnlyScreenReaderText(el)` alone is sufficient to exempt from text-clipped. The sr-only text IS the accessible name; requiring a separate aria-label was over-constraining.

**Guard:** `Planted/SrOnlyIconButton` updated to match the real pattern: icon `✕` + sr-only span, NO `aria-label`/`title`.

### Fix 2 — viewport-mismatch cells get explicit machine state

**Problem:** Out-of-range cells still had `pass=false, verdict='fail'` in the manifest, making them machine-readable as product defects.

**Fix:** After the retry loop in both Phase 1 and Phase 2, cells matching `isOutOfViewportRange()` get `verdict='out-of-range'` + `viewportMismatch=true`. Summary counting, console output (marker `R`), inventory Bucket 1 filter, and the failed-cells listing all use the verdict directly. No downstream consumer can read an out-of-range cell as `verdict='fail'`.

### Fix 3 — STORY_VIEWPORT_RANGE: added collapsed-rail

**Added:** `'admin-adminsidebar--collapsed-rail': { minWidth: 1024 }` — desktop-only collapsed sidebar rail, confirmed present in post-468 `storybook-static/index.json`.

### Fix 4 — guard fixtures for all V1-FINAL classes

| Guard | Class | What it proves |
|-------|-------|---------------|
| `Planted/SrOnlyIconButton` | FP-CLASS A | Icon + sr-only text, NO aria-label → not text-clipped |
| `Planted/NarrowRangeGuard` | FP-CLASS B | maxWidth=960 story → PASS at mobile, out-of-range at desktop |
| `Planted/LargeRangeGuard` | FP-CLASS C | minWidth=1024 story → PASS at desktop, out-of-range at mobile |
| `.leaflet-container` exclusion | FP-CLASS D | Leaflet controls never enter the geometry check (verified via grep: 168 cells of Leaflet text-clipped in pre-fix inventory, all from `listings-listingdetailview--*`) |

### Fix 5 — full inventory regeneration

Pending: owner-native full re-run. The inventory will be auto-regenerated from the manifest. Before/after counts to be pasted after the run.

### Gates (V1-FINAL rework)

| Gate | Status |
|------|--------|
| `node --check scripts/geometry-integrity.mjs` | ✅ |
| `node --check scripts/check-stories-rendered.mjs` | ✅ |
| `npx tsc --noEmit` | ✅ 0 errors |
| `npm run check:stories` | ✅ 60 files, 0 violations |

### Files Changed (V1-FINAL rework)

| File | Rationale |
|------|-----------|
| `scripts/geometry-integrity.mjs` | Fix 1: removed aria-label/title requirement from sr-only exemption |
| `scripts/check-stories-rendered.mjs` | Fix 2: `verdict='out-of-range'` + `viewportMismatch=true` on out-of-range cells, summary/console/inventory use verdict. Fix 3: added `collapsed-rail` minWidth=1024. Fix 4: `NarrowRangeGuard`/`LargeRangeGuard` in ASSERT_STORIES + STORY_VIEWPORT_RANGE |
| `src/stories/PlantedVisualViolations.stories.tsx` | Fix 1: SrOnlyIconButton updated (no aria-label). Fix 4: added NarrowRangeGuard + LargeRangeGuard |
| `docs/storybook-governance.md` | Updated sr-only exemption wording, planted count 10→12, viewport-range describes verdict='out-of-range' + collapsed-rail + guard stories |
| `docs/critical-flow-registry.md` | Updated planted count 10→12, added NarrowRangeGuard/LargeRangeGuard + collapsed-rail to FP-CLASSES B/C description |
| `docs/sessions/2026-06-19-task-467-storybook-geometry-visual-assertions.md` | This rework section |

---

## V1-FINAL rework follow-up (reviewer, 2026-06-22)

Reviewer found viewport-range guard stories could never exercise the `out-of-range` path because the condition was `cell.pass === false && isOutOfViewportRange(cell)` — but the guard stories render normal controls that pass at any width.

### Fix — unconditional out-of-range tagging

Changed both Phase 1 and Phase 2 loops from:
```
if (cell.pass === false && isOutOfViewportRange(cell))
```
to:
```
if (isOutOfViewportRange(cell))
```

Out-of-range cells now receive `verdict='out-of-range'` + `viewportMismatch=true` regardless of whether they would otherwise pass or fail. They are not counted as `passed`, not counted as `failed`, and cannot be cited as rendered proof.

Also fixed inventory range text: `minWidth` stories now show `min=1024` instead of `max=∞`.

### Evidence — `--fast` run 2026-06-22T15-52 (996 cells, 83 ASSERT + 157 geometry-only)

**Summary:** 720 PASS / 182 FAIL / 82 AMBIGUOUS / **12 OUT-OF-RANGE** (total=996)

| Planted story | Cells | Verdict | Proof |
|---|---|---|---|
| `SrOnlyIconButton` | 12/12 | **pass** | sr-only text NOT text-clipped (FP-CLASS A ✅) |
| `NarrowRangeGuard` | 12/12 | **pass** | Within range at mobile 320/375/390 (maxWidth=960); would be out-of-range at desktop-1024+ in full mode |
| `LargeRangeGuard` | 12/12 | **out-of-range** | Below minWidth=1024 at mobile → routed correctly (FP-CLASS C ✅) |

**Machine-readable sanity:** `verdict='pass'`(720) + `verdict='fail'`(182) + `verdict='ambiguous'`(82) + `verdict='out-of-range'`(12) = 996 total. Zero cells with `viewportMismatch=true` and `verdict='pass'` or `verdict='fail'`.

**NarrowRangeGuard note:** In `--fast` mode all viewports are ≤390 (within maxWidth=960), so it correctly PASSes. The out-of-range path is exercised by the full (non-fast) run at desktop-1024+. The `LargeRangeGuard` proves the mechanism works in both directions — it's the fast-mode counterpart that exercises `minWidth`.

**Console output confirms:** `ℹ️ 12 cells are out-of-viewport-range (verdict=out-of-range, not product defects):` listing all 12 LargeRangeGuard cells with `(range: min=1024)`.

Coverage stays **🟡** until owner-native full inventory is regenerated.

---

## V1-FINAL full run evidence (2026-06-22T16-48, 6532 cells)

### 1. Summary + exit code

**SUPERSEDED by Phase B rerun below (2026-06-22T20-10).** The original run captured `exit=0` via a `tee` pipeline which masked the child process exit code. The direct rerun with `$LASTEXITCODE` capture produced `exit=1`, consistent with `failed=757 > 0`.

| Counter | Count |
|---------|-------|
| Total cells | 6532 |
| PASS | 5325 |
| FAIL (hard defect) | 759 |
| OUT-OF-RANGE | 108 |
| AMBIGUOUS | 340 |
| text-clipped | 231 |
| offscreen-control | 200 |
| outside-container | 190 |
| element-overlap | 148 |
| bottomsheet-overflow | 68 |
| ambiguous-overlap | 439 |
| unstyled-render | 56 |

*Exit-code note (superseded): the original background task + `tee` pipeline reported exit 0 — this was invalid. See Phase B rerun below for the correct direct-command exit=1.*

### 2. Before/after vs stale 2129

| | BEFORE (V1-V2, pre-468) | AFTER (V1-FINAL, post-468) |
|---|---|---|
| Total cells | 7756 | 6532 |
| Hard FAIL (Bucket 1) | **2129** | **759** |
| Out-of-range | 0 (counted as fail) | 108 |
| Ambiguous | 323 | 340 |
| PASS | 5304 | 5325 |

**Reduction: 2129 → 759 = −1370 false positives removed from Bucket 1.** Contributing factors: FP-CLASS A (text-clipped 1711→231), FP-CLASSES B/C (108 cells → out-of-range), FP-CLASS D (Leaflet controls excluded), post-468 story count reduction (287→240).

### 3. Grep proof: no sr-only / DialogClose false positives in Bucket 1

```
Bucket 1 cells with dialog-close/sr-only text-clipped: 0
Bucket 1 cells with text-clipped label matching Close/Mbyll/Chiudi/Закрити/✕/×: 0
```

### 4. Grep proof: no viewport-mismatch / out-of-range in Bucket 1

```
Bucket 1 cells with viewportMismatch or out-of-range verdict: 0
  admin-adminmobileheader in Bucket 1: 0
  admin-adminsidebar--collapsed-rail in Bucket 1: 0
  admin-adminsidebar--mobile-drawer-open in Bucket 1: 20 (real bottomsheet-overflow at mobile 320–560, within range)
```

### 5. Grep proof: no Leaflet controls in Bucket 1

```
Bucket 1 cells with Leaflet/OpenStreetMap violations: 0
Bucket 1 cells with ×/+/− map button selectors: 0
```

### 6. NarrowRangeGuard out-of-range at desktop

```
NarrowRangeGuard total cells: 56
  pass (pass=true): 36 — viewports: mobile-320 … canonical-960 (within maxWidth=960)
  out-of-range (pass=false): 20 — viewports: desktop-1024, canonical-1200, desktop-1440, huge-1920, huge-2560
```

### 7. SrOnlyIconButton remains PASS

```
SrOnlyIconButton total cells: 56  verdicts: pass (all 56/56)
  with text-clipped violation: 0
```

### Invariants (all 108 viewportMismatch cells)

```
pass=true: 0
verdict='pass': 0
verdict='fail': 0
```

### Inventory regenerated

*Superseded by Phase B rerun — see below.*

---

## V1-FINAL Phase B rerun — authoritative evidence (2026-06-22T20-10)

Previous full-run evidence had `exit=0` due to `tee` pipeline masking the child process exit code. This rerun used direct `$LASTEXITCODE` capture in PowerShell (no `tee`, no background wrapper):

```powershell
npm run screenshots:assert > docs/sessions/task467-full-owner-native-v1final.log 2>&1
$code = $LASTEXITCODE
"exit=$code" | Set-Content -Encoding utf8 docs/sessions/task467-full-owner-native-v1final.exit.txt
```

### Exit code

**`exit=1`** — controlled, expected because `failed=757 > 0`. The harness sets `process.exitCode = 1` when `failed > 0` (line 1328 of `check-stories-rendered.mjs`). No bug — the previous `exit=0` was a capture artifact.

### Summary (2026-06-22T20-10)

| Counter | Count |
|---------|-------|
| Total cells | 6532 |
| PASS | 5327 |
| FAIL (hard defect) | 757 |
| OUT-OF-RANGE | 108 |
| AMBIGUOUS | 340 |

Slight variance from prior run (759→757 FAIL, 5325→5327 PASS) due to 2 transient-recovered cells.

### Before/after

| | BEFORE (V1-V2, pre-468) | AFTER (V1-FINAL rerun) |
|---|---|---|
| Total cells | 7756 | 6532 |
| Hard FAIL (Bucket 1) | **2129** | **757** |
| Reduction | | **−1372** |

### Proof summary JSON

All 15 required invariants passed. See `docs/sessions/task467-v1final-proof-summary.json`.

### Evidence files (authoritative)

- `docs/sessions/task467-full-owner-native-v1final.exit.txt` — `exit=1` (direct `$LASTEXITCODE`)
- `docs/sessions/task467-full-owner-native-v1final.log` — full console output
- `docs/sessions/task467-v1final-proof-summary.json` — compact proof with invariant checks
- `.screenshots/rendered-assert/2026-06-22T20-10/manifest.json` — authoritative manifest
- `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` — regenerated inventory (240 stories, 6532 cells)

Coverage stays **🟡** — pending orchestrator review + commit.
