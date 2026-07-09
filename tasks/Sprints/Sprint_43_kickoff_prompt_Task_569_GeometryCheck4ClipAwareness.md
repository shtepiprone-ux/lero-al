# Task 569 — geometry checker Check 4 (`element-overlap`): teach it the same `overflow:auto` clip-awareness Check 3 already has

**Type:** Governance / shared verification-infra change. **Executor:** Sonnet 4.6.
**Origin:** opened by the orchestrator at the Task 567 round-2 review (2026-07-09) — the pinned-footer
pattern (Fix 4) surfaced a real limitation in the shared screenshot geometry checker, which Task 567 worked
around with a scoped, precedented allowlist entry rather than a self-authored algorithm change. **This task
does the algorithm fix properly, under its own independent review** (blast radius = the org-wide checker that
judges every story).

## Background (the false-positive class)

`scripts/geometry-integrity.mjs` Check 4 (`rectsOverlap`, `failReason: 'element-overlap'`) compares two
elements' raw `getBoundingClientRect()` values. When one element is a `flex:1; overflow-y:auto` scroll region
containing content taller than itself, the content's DOM layout rects extend geometrically past the region's
clipped boundary — coincidentally into a sibling's (e.g. a pinned footer's) on-screen coordinates — even
though `overflow:auto` **clips** it so it is never painted there. Check 4 flags this as an overlap; it is not
a visual defect.

Check **3** (`outside-container`) already exempts elements reachable through an `auto|scroll` ancestor for the
identical reason (`hasHorizontalScrollAncestor` and the vertical equivalent). **Check 4 never got the same
treatment.** Task 567's `mantine-primitives-filterspanelshell--default` allowlist entry
(`scripts/check-stories-rendered.mjs` `GEOMETRY_ALLOWLIST`) is the interim suppression; this task should make
it unnecessary and remove it.

## Required after-behavior

1. In `scripts/geometry-integrity.mjs` Check 4, before reporting an `element-overlap` between A and B, treat
   the overlap as **clipped / non-painted (skip)** when the overlapping portion falls **outside the visible
   (clipped) box of an `overflow:hidden|auto|scroll` ancestor** of the deeper element — i.e. the pixels that
   "overlap" are not actually rendered because an ancestor clips them. Reuse/generalize the existing
   `auto|scroll` ancestor detection already used by Check 3 (do NOT duplicate the logic — factor a shared
   helper if needed). A genuine overlap where BOTH elements are fully within their painted boxes MUST still
   FAIL (do not weaken the real check).
2. Once Check 4 is clip-aware, **remove the `mantine-primitives-filterspanelshell--default` entry** from
   `GEOMETRY_ALLOWLIST` in `scripts/check-stories-rendered.mjs` and prove `FiltersPanelShell` still passes
   16/16 WITHOUT it. Leave the PasswordInput / RangeDatePicker (icon-in-field) and Tabs (swipe-scroll)
   entries untouched — those are a different intentional-containment class, not this clip class.

## Positive flow
- `FiltersPanelShell` (pinned footer + tall scroll content): after the fix, Check 4 no longer flags the
  scrolled-away content vs footer overlap → passes 16/16 with NO allowlist entry.
- Any other pinned-footer / tall-scroll story added later is covered automatically.

## Negative flow (the check must stay REAL — prove it still catches genuine overlaps)
- **Planted genuine overlap** (two painted, non-clipped elements truly overlapping > `tol`) → Check 4 STILL
  FAILs (`element-overlap`). Provide the transcript.
- **Planted clipped-but-actually-painted** case (overlap portion is inside the visible box, ancestor is NOT
  clipping it) → STILL FAILs. The exemption must trigger ONLY when the overlapping pixels are genuinely
  clipped away.
- The existing planted `Planted/OverlappingActions` and `Planted/AmbiguousOverlap` stories must behave
  exactly as before (regression baseline recorded before the change).

## Acceptance criteria
1. `geometry-integrity.mjs` Check 4 is clip-aware via a shared helper with Check 3 (no duplicated logic); a
   genuine painted overlap still FAILs (planted transcript).
2. `FiltersPanelShell` passes 16/16 with the `GEOMETRY_ALLOWLIST` entry REMOVED.
3. `Planted/OverlappingActions` + `Planted/AmbiguousOverlap` behavior unchanged (baseline recorded → still
   matches after).
4. `screenshots:assert -- --mantine-only` green; no new AMBIGUOUS/FAIL vs the Task 567 baseline
   (550 PASS / 0 FAIL / 26 AMBIGUOUS) except the intended FiltersPanelShell path change.
5. `docs/storybook-governance.md` (§ geometry checks) documents the Check-4 clip-awareness + why the entry
   was removed. Files-Changed table + session log. **Do NOT run git — HELD for orchestrator review.**

## Pre-read (rule-index → docs-only / governance + storybook/visual)
- `docs/agent-contract.md` (clauses 1, 13, 14) + `docs/backlog.md` + `docs/critical-flow-registry.md`.
- `docs/storybook-governance.md` (§14 gates), `docs/responsive-screenshot-governance.md` (§MQ machine-
  detection limits — this task narrows one of those limits).
- Reference: `scripts/geometry-integrity.mjs` (Check 3 `hasHorizontalScrollAncestor` is the pattern to
  generalize) + `scripts/check-stories-rendered.mjs` `GEOMETRY_ALLOWLIST` (the entry to remove) + the Task
  567 round-2 session log (root-cause writeup).

## Files expected to change
`scripts/geometry-integrity.mjs` · `scripts/check-stories-rendered.mjs` (remove one allowlist entry) ·
`docs/storybook-governance.md` · `docs/backlog.md` · new `docs/sessions/2026-…-task569-…md`.

## Out of scope
- The PasswordInput/RangeDatePicker/Tabs allowlist entries (different class). The Task 567 product code (done).
- Any change to Check 1/2/3 behavior beyond factoring the shared clip helper.
