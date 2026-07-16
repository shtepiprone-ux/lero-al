# Task 611 — Resolve Task 607's two held stories: AppShellFoundation (open-trigger) + AdminSurfacePattern (element-overlap false positive)

Sprint 44 (Epic MM Phase-2 — gate hardening). Orchestrator-opened 2026-07-15 from the **Task 607 review**,
after the owner/orchestrator **personally adjudicated the rendered pixels** (§18.9) of the two stories Task 607
left as held, CI-blocking `fail`s. Both are confirmed NON-defects. This task clears them so `--mantine-only`
returns green (except the tracked `ListingDetailPattern` xfail → Task 609).

> **⚠ Gate-infrastructure task — do NOT edit any product component or `*.stories.tsx`.** The two stories are
> correct as authored; the fixes are entirely in the gate (`scripts/check-stories-rendered.mjs` +
> `scripts/geometry-integrity.mjs`, or wherever the `element-overlap` check lives). If resolving either requires
> touching a pattern/story, STOP and ASK — that would mean the adjudication was wrong.

## Orchestrator adjudication (the authoritative input — from personally-viewed screenshots)

**A. `AppShellFoundation` = open-trigger, NOT a defect.** `patterns-mantine-appshellfoundation--default__*__mobile-320.png`
show header + Burger + brand rendering correctly; the 4 nav links report `left=-308` because Mantine's `AppShell`
navbar is `collapsed:{mobile:!opened}` with `useDisclosure()` defaulting CLOSED (off-canvas until the Burger is
tapped) — mechanically identical to `DialogDrawerPattern`, which Task 607 already put in `MANTINE_OVERLAY_PRIMITIVES`.

**B. `AdminSurfacePattern` = `element-overlap` FALSE POSITIVE.** `patterns-mantine-adminsurfacepattern--default__*`
show a clean search bar: the magnifying-glass `ActionIcon` sits inside the `TextInput`'s reserved `rightSection`
with clear whitespace to the placeholder — no collision. The heuristic flagged child box `b=[275,71,297,93]` as
"overlapping" parent `a=[16,60,304,104]`, but `b` is CONTAINED in `a` (it is `a`'s own right-section child). A
control fully nested inside its parent's own bounding box is by-design, not a sibling collision.

## Required after-behavior (the delta)

1. **AppShellFoundation → open-trigger.** Add `'AppShellFoundation'` to `MANTINE_OVERLAY_PRIMITIVES` in
   `scripts/check-stories-rendered.mjs` (with a comment mirroring the `DialogDrawerPattern` rationale). Confirm the
   existing open-trigger mechanism clicks the Burger and asserts the OPENED nav. If the generic trigger-click can't
   find/drive the Burger (it's a `hiddenFrom="sm"` `Burger`, not a `<Button>`), **STOP and ASK** — do not invent a
   new trigger heuristic. Expected result: the 12 `offscreen-control` fails clear (nav links on-screen once opened).

2. **AdminSurfacePattern → fix the `element-overlap` heuristic (NOT a per-story allowlist).** In the geometry/overlap
   check, an element must NOT be reported as overlapping another when one's bounding box is **fully contained** within
   the other's (parent↔child / section-nested control), OR when the two nodes are in an ancestor→descendant DOM
   relationship. Implement the containment/ancestry guard generically so it also protects any other `rightSection`/
   `leftSection`/adornment pattern — never a hardcoded `AdminSurfacePattern` exception. Preserve detection of a REAL
   collision (two independent siblings whose boxes intersect but neither contains the other). Expected result: the 16
   `element-overlap` fails on AdminSurfacePattern clear, AND a planted real sibling-overlap still FAILs (prove it).

## Positive flow

`npm run screenshots:assert -- --mantine-only` → AppShellFoundation asserts its opened nav (12 cells now PASS);
AdminSurfacePattern's search bar no longer trips `element-overlap` (16 cells now PASS); the only remaining non-PASS
Mantine-pattern cells are the tracked `ListingDetailPattern` known-failure (Task 609) → **exit 0** (green).

## Negative flow

- Burger not drivable by the existing trigger mechanism → STOP and ASK (no new heuristic).
- The containment guard accidentally suppresses a REAL sibling collision → the mandatory planted-overlap test below
  FAILs the gate, proving the guard is scoped to containment/ancestry only.
- Any pattern/story edit needed to make a cell pass → STOP and ASK (adjudication would be wrong).

## Acceptance criteria

1. `'AppShellFoundation'` in `MANTINE_OVERLAY_PRIMITIVES`; open-trigger asserts the opened nav; 12 fails cleared. (file:line + transcript)
2. `element-overlap` gains a generic containment/ancestry guard (no hardcoded story id); AdminSurfacePattern's 16 fails cleared. (file:line + transcript)
3. **Anti-regression proof:** a planted TRUE sibling-overlap still FAILs the gate (transcript), then reverted — proving the guard didn't neuter real-collision detection. (clause 13)
4. `--mantine-only` exits 0 except the tracked `ListingDetailPattern` xfail (unchanged). Full transcript. (clause 12)
5. Primitives + the other 11 patterns byte-unchanged in pass/fail vs the Task 607 baseline (before/after counts). (transcript)
6. Rendered proof for AppShellFoundation OPENED + AdminSurfacePattern at uk@320/375/390 + desktop × 4 locales, persisted. (clause 12)
7. Gates: `node --check` both scripts, `check:stories`, `check:file-integrity`, `check:mojibake` clean. NO git. Session log + `docs/backlog.md` updated; "Files Changed" table.

## Scope (files)

**In scope:** `scripts/check-stories-rendered.mjs` (overlay-set addition), `scripts/geometry-integrity.mjs` (or the
file housing the `element-overlap` check — locate it), the persisted assets dir, `docs/storybook-governance.md`
(note the resolution), `docs/backlog.md`, session log.
**Out of scope:** every product component; every `*.stories.tsx`; the prefix-list discovery / xfail registry from
Task 607 (unchanged); `ListingDetailPattern` (stays tracked, Task 609).

## Hard contract

No product/story edits. No hardcoded story-id exceptions (the containment guard is generic; the open-trigger is
prefix/Set-derived). Both the positive and every negative branch exercised in the transcript. The planted true-overlap
anti-regression proof (AC3) is mandatory. STOP and ASK if the Burger isn't drivable or if any cell needs a component/
story change to pass. Executor emits NO git.
