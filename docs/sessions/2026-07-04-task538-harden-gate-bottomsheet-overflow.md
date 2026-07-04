# Task 538 — harden the rendered gate: hard-FAIL true clip/overflow inside a bottom-sheet body

**Sprint 40 / Epic MM. Executor: Sonnet (direct execution, no orchestrator layer in this session — kickoff file
was updated in-session with an owner-directed scope-expansion trail, see its `## 🔴 SCOPE EXPANSION` +
`### Second finding + decision` sections).**

## Summary

Three fixes landed in `scripts/geometry-integrity.mjs`, all gate-tooling only:

1. **Fix 1 (the kickoff's original ask):** `hasHorizontalScrollAncestor` no longer downgrades a horizontal
   offscreen/clip defect to `ambiguous` when the element is inside a bottom-sheet body
   (`.mantine-Drawer-body`), and outside a sheet the downgrade now requires a genuine swipe-surface marker
   (`data-scrollbars="x"/"xy"`). Root cause: the sheet's own `overflow-y:auto` triggers the CSS spec's x/y
   computed-value coupling rule, forcing `overflow-x` to report `auto` too.
2. **Fix 2 (found while proving AC1):** candidate discovery (`checkGeometryIntegrity`'s `INTERACTIVE_SELECTOR`)
   is `#storybook-root`-scoped, but every Mantine overlay portals its opened content OUTSIDE `#storybook-root`
   — proven empirically (`#storybook-root button` = 0 matches on an opened sheet with 7 real buttons). Fix 1
   alone was inert/unprovable. Added a narrow `BOTTOM_SHEET_BODY_SELECTOR` (`.mantine-Drawer-body` only —
   button/`[role=button]`/`[role=option]`/`[role=menuitem]`/`a[href]`/input), unioned into `candidates`.
3. **Fix 3 (found after Fix 2):** widened discovery surfaced 16 false-positive `element-overlap` FAILs —
   background page content sitting behind an opened overlay's opaque backdrop, now paired against the
   overlay's own newly-discovered content. Added `isInsideOverlayBody(a) !== isInsideOverlayBody(b)` →
   `ambiguous-overlap` exemption in Check 4 (generalizes the existing same-parent
   `isAbsoluteOverOwnTrigger` rule to the portal case). Pairs fully on one side of the boundary are unaffected.

Full technical detail, rect proofs, and the STOP-and-ASK/decision trail: `docs/storybook-governance.md` §14.9.9.

## Gates

```
node --check scripts/geometry-integrity.mjs   → OK
npm run check:file-integrity                  → PASSED, 4 files clean
npm run check:i18n                            → PASSED, 4 locales, 2082 keys
npm run check:stories                         → PASSED, 99 files, 0 violations
npm run build-storybook                       → built clean
npm run screenshots:assert -- --mantine-only  → 382/400 PASS, 0 FAIL, 18 AMBIGUOUS (final)
```

Progression of the full native gate across the 3 fixes:
- Fix 1 only: 398/400 PASS, 0 FAIL, 2 AMBIGUOUS (pre-existing Tabs swipe) — no regression from Fix 1 alone.
- Fix 1+2 (before Fix 3): 382/400 PASS, **16 FAIL** (`element-overlap`) + 2 AMBIGUOUS — confirms Fix 1 was
  previously unprovable; surfaces the Fix-3 blind spot.
- Fix 1+2+3 (final): 382/400 PASS, **0 FAIL**, 18 AMBIGUOUS (16 new `ambiguous-overlap` + the same 2
  pre-existing Tabs `ambiguous-offscreen`).

## Planted-violation + regression transcripts

**Planted violation (AC1, throwaway script, never committed, reverted):** opened
`Mantine/Primitives/Select/Default` at 320px (`.mantine-Drawer-body` confirmed present), pushed the first
option to `rect.right=410` (viewport 320) via `page.evaluate` inline-style injection:

```
Hard violation (expected true): true
Downgraded to ambiguous (expected false): false
```

`violations: [{ failReason: 'offscreen-control', selector: '[data-testid="task538-planted-option"]', details: 'right=410, viewportWidth=320' }]`
— re-verified unchanged after Fix 3 landed.

**Regression transcript (AC2/AC3, native full run, final state):**
```
Mantine/Primitives/Tabs/Default × sq × mobile-320
  ? [ambiguous-offscreen]: element reachable by horizontal scrolling (carousel/scroll-tabs)
Mantine/Primitives/Tabs/Default × it × mobile-320
  ? [ambiguous-offscreen]: element reachable by horizontal scrolling (carousel/scroll-tabs)
```
Identical to the pre-Task-538 baseline (398/400, 2 ambiguous, sq/it@320) — swipe cells unaffected. No
`bottomsheet-overflow`/`offscreen-control` FAIL anywhere in the final 400-cell run confirms legitimate
vertical-scroll sheets (e.g. `Select`/`Combobox` option lists) stayed clean (AC3).

## Files Changed

| File | Change | Why |
|---|---|---|
| `scripts/geometry-integrity.mjs` | `hasHorizontalScrollAncestor` scoped to bottom-sheet-body + genuine-swipe marker; new `isInsideOverlayBody`/`BOTTOM_SHEET_BODY_SELECTOR`; new Check-4 cross-overlay-boundary `ambiguous` exemption | Closes the ambiguous-downgrade blind spot (Fix 1), makes it provable by widening candidate discovery (Fix 2), and neutralizes the false-positive that widening exposed (Fix 3) |
| `docs/storybook-governance.md` | New §14.9.9 recording all 3 fixes, root causes, and rect proofs | Owner-required permanent governance record of a closed gate blind spot (per §14.9.x precedent) |
| `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` | Auto-regenerated by `screenshots:assert` (final clean run) | Standing auto-generated artifact, not hand-edited |
| `tasks/Sprints/Sprint_40_kickoff_prompt_Task_538_HardenGateBottomSheetOverflow.md` | Scope-expansion + second-finding decision trail appended in-session | Records the STOP-and-ASK exchanges and owner decisions that shaped Fixes 2–3 |

No product/consumer/story/theme file touched (grep-provable: `git diff --stat` above lists exactly these 4 files).

## AC-by-AC self-audit

| # | AC | Status | Evidence |
|---|----|--------|----------|
| 1 | Horizontal clip/offscreen inside a bottom-sheet body = hard `violation`, marker cited | ✅ | Planted-violation transcript above; marker = `.mantine-Drawer-body` (confirmed via Mantine's compiled source: `withStaticClasses` default `true`, `useStyles({name:"Drawer"})` → static class) |
| 2 | Genuine swipe containers keep the `ambiguous` downgrade | ✅ | Regression transcript above — Tabs sq/it@320 unchanged from pre-Task-538 baseline |
| 3 | Vertical-scroll bottom-sheet content stays clean | ✅ | Final native run: 0 `offscreen-control`/`bottomsheet-overflow` FAILs anywhere; long `Select`/`Combobox` option lists scroll vertically without incident |
| 4 | Gate-tooling + docs only, §14.9.x records the closed blind spot | ✅ | `git diff --stat` = 4 files (script + 2 docs + auto-report), 0 product/story files; §14.9.9 added |
| 5 | Session log with Files-Changed, AC self-audit, Self-validation line; no git run | ✅ | This file; no `git add`/`git commit` executed |

## Self-validation

Self-validation: all 5 ACs met with rendered-gate evidence (not tsc/build-only); two scope expansions beyond
the literal kickoff text were surfaced via STOP-and-ASK before implementation, both owner-approved with
explicit constraints, both implemented within those constraints and verified with before/after native-gate
transcripts; final native gate 382/400 PASS, 0 FAIL, 18 AMBIGUOUS (all triaged: 16 new `ambiguous-overlap`
documented in §14.9.9, 2 pre-existing Tabs `ambiguous-offscreen` unchanged); no product/story/theme diff.
**HELD — no git commands run; awaiting review + explicit-path commit emission.**
