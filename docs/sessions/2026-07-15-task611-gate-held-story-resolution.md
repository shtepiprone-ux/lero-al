# Session Archive: Task 611 — Resolve Task 607's 2 held stories: `AppShellFoundation` (open-trigger) + `AdminSurfacePattern` (element-overlap false positive) — 2026-07-15

Sprint 44 (Epic MM Phase-2 — gate hardening). Kickoff: `tasks/Sprints/Sprint_44_kickoff_prompt_Task_611_GateHeldStoryResolution.md`.

## Why (owner adjudication, from the Task 607 review)

The Task 607 review left `AdminSurfacePattern` (`element-overlap`, 16 cells) and `AppShellFoundation`
(`offscreen-control`, 12 cells) as genuine, CI-blocking `fail`s pending the owner personally viewing the
rendered pixels (§18.9 iron rule). The owner did so and confirmed both are non-defects. Per the kickoff's hard
contract, the fix belongs entirely in the GATE (`scripts/check-stories-rendered.mjs` +
`scripts/geometry-integrity.mjs`) — never a per-story allowlist/exemption, and no product/story edit under any
circumstance (STOP-AND-ASK if resolving either ever appeared to require one — it never did).

## Part A — `AdminSurfacePattern`: generic bbox-containment guard

**Root cause.** `MantineAdminSurfacePattern.tsx` renders its search icon as a Mantine `TextInput`
`rightSection` (`ActionIcon`) — a DOM **sibling** of the `<input>` element, not a descendant. The `<input>`'s
own `getBoundingClientRect()` visually reserves the icon's space (standard icon-in-field CSS), so its rect
fully **contains** the icon's rect even though there is no DOM ancestor/descendant relationship. The existing
`element-overlap` check (`geometry-integrity.mjs` Check 4) already exempted true DOM ancestry (`isAncestorOf`)
but had no geometric-containment exclusion, so it flagged this by-design nesting as a collision on all 16
cells (4 viewports × 4 locales).

**Fix.** Added `isContained(inner, outer)` — pure bounding-box containment, either direction — as a new
algorithmic exclusion in Check 4's overlap loop, applied via the SAME visibility-clipped rects
(`aVisibleRect`/`bVisibleRect`) the existing scroll-clip logic (Task 569) already computes, right alongside
`isAncestorOf`:

```js
// scripts/geometry-integrity.mjs, Check 4
if (isAncestorOf(a, b) || isAncestorOf(b, a)) continue;
if (isContained(aVisibleRect, bVisibleRect) || isContained(bVisibleRect, aVisibleRect)) continue;
```

Generic — no story-id, no selector, no failReason hardcode — so it protects any other `rightSection`/
`leftSection`/adornment pattern automatically (candidate future cleanup, out of this task's scope: the
existing `PasswordInput`/`RangeDatePicker` `GEOMETRY_ALLOWLIST` entries for the identical icon-in-field pattern
are now likely redundant under this generic guard, but were not touched/removed here).

**Verification.** Direct call to the exported `checkGeometryIntegrity()` — the exact function
`captureCell` invokes for every cell, not a reimplementation — against the real Playwright-rendered story:

- `AdminSurfacePattern` @ 320 and @ 1024: `pass: true`, 0 `element-overlap` violations (previously 1 at every
  cell).
- The permanent `planted-visualviolations--overlapping-actions` fixture (genuine **partial** overlap — box A
  `[16,24,136,64]`, box B `[66,24,186,64]`; neither contains the other) @ 320/375/390: **still fails** with 1
  `element-overlap` violation each — proving the containment guard is scoped to true containment, never
  widened to any overlap.

Transcript: `docs/sessions/2026-07-15-task611-assets/transcript-2-ac3-anti-regression-proof.log`.

## Part B — `AppShellFoundation`: open-trigger + a real STOP-AND-ASK the kickoff had already flagged

**Root cause.** `MantineAppShellFoundation.tsx` uses `useDisclosure()` (defaults closed) and
`collapsed:{mobile:!opened}` — the navbar is off-canvas at <640px until the `Burger` is tapped, mechanically
identical to `DialogDrawerPattern` (already in `MANTINE_OVERLAY_PRIMITIVES`, Task 607). Added
`'AppShellFoundation'` to the set.

**Blocker found during implementation (matches the kickoff's own pre-flagged negative-flow item verbatim).**
The existing click-then-assert mechanism (`page.locator('#storybook-root button, #storybook-root input').first()`)
was empirically tested at both mobile and desktop widths before wiring the set entry:

- At mobile-320/375/390: the Burger is the first (only) button in DOM order, visible, and the click succeeds —
  nav links move from `left=-308` (off-canvas) to `left=12` (on-screen) after the existing 500ms
  post-click wait.
- At **desktop-1024** (part of the standard `MANTINE_VIEWPORTS` matrix run for every discovered Mantine
  story): the Burger carries Mantine's `hiddenFrom="sm"` (CSS `display:none` at ≥640px). Playwright's
  `.click({timeout:5000})` timed out waiting for visibility — this would have newly broken the 4
  `desktop-1024` cells (one per locale) that **already PASS today** (the navbar is open-by-default at desktop;
  there was never anything to open there).

This is the exact scenario the kickoff's negative flow named: *"Burger not drivable by the existing trigger
mechanism → STOP and ASK (no new heuristic)."* Per the session's `AskUserQuestion`, the owner selected a
generic, no-heuristic-invention fix: **skip the click when the trigger isn't visible, but do NOT skip the
cell's own assertions** — render/anchor/style/geometry checks still run against whatever DOM is current, so a
genuinely broken/empty render still fails.

**Fix** (`captureCell`'s `openTrigger` handling in `check-stories-rendered.mjs`):

```js
const trigger = page.locator('#storybook-root button, #storybook-root input').first();
const triggerVisible = (await trigger.count()) > 0 && await trigger.isVisible();
if (triggerVisible) {
  try {
    await trigger.click({ timeout: 5000 });
    await page.waitForTimeout(500);
  } catch (err) {
    /* unchanged — a VISIBLE trigger that still fails to click is still a hard
       open-trigger-click-failed fail */
  }
}
// else: skip silently — normal checks below still run against the current DOM
```

**No-op proof for every existing overlay primitive.** `isVisible()` is a synchronous DOM check (no wait) —
only changes behavior when the trigger is genuinely absent/hidden. Directly probed the trigger-visibility
branch for `Modal`/`Drawer`/`Popover`/`Select`/`DropdownMenu`/`NavigationMenu`/`Tooltip`/`Combobox`/
`NotificationBellView`/`DialogDrawerPattern`: every one of their triggers is a plain always-rendered
`<Button>`, `visible: true` at both 320 and 1024 — confirmed via a direct spot-check on `DialogDrawerPattern`
and `Select` at both widths (both `visible: true`, click succeeds identically to before). This matches their
unchanged PASS counts in the before/after diff below.

**Verification.**

| Viewport | Burger state | Trigger action | Result |
|---|---|---|---|
| mobile-320/375/390 | visible | real click, 500ms wait | nav opens (`left: -308 → 12`); 12 cells PASS via genuine opening |
| desktop-1024 | `display:none` (`hiddenFrom="sm"`) | skipped | checks run on already-open navbar; 4 cells PASS, no `open-trigger-click-failed` |

## Full gate re-run (`npm run screenshots:assert -- --mantine-only`)

```
Results: 857/900 PASS, 0 FAIL, 27 AMBIGUOUS (needs-owner-decision), 16 KNOWN-FAILURE (tracked, Task 607)
  ambiguous-overlap: 27
flaky-recovered: 0
✅ All hard assertions PASSED (ambiguous cells need owner triage — not citable as green proof).
```

Exit code 0. Full transcript: `docs/sessions/2026-07-15-task611-assets/transcript-1-mantine-only-full-run.log`.
Manifest: `.screenshots/rendered-assert/2026-07-15T21-16/manifest.json` (not persisted in full — 1.5MB+; the
32-cell excerpt for both resolved stories is saved at
`docs/sessions/2026-07-15-task611-assets/manifest-excerpt-appshell-adminsurface.json`, confirming
`verdict: 'pass'` on all 32).

### Before/after vs the Task 607 baseline

| | Task 607 baseline | Task 611 (this session) | Delta |
|---|---|---|---|
| PASS | 829/900 | 857/900 | **+28** (exactly the 12 AppShellFoundation + 16 AdminSurfacePattern cells) |
| FAIL | 28 | 0 | **-28** |
| AMBIGUOUS | 27 | 27 | unchanged (pre-existing Combobox/RangeDatePicker portal-backdrop + Tabs swipe-scroll — none of this task's concern) |
| KNOWN-FAILURE | 16 | 16 | unchanged (`ListingDetailPattern`, Task 609, untouched) |
| Exit code | 1 | 0 | gate now GREEN |

Confirms AC5: the 43 primitives + other 11 patterns are byte-unchanged; only the 28 targeted cells moved.

## AC-by-AC self-audit

1. **`'AppShellFoundation'` in `MANTINE_OVERLAY_PRIMITIVES`; open-trigger asserts the opened nav; 12 fails
   cleared.** ✅ `scripts/check-stories-rendered.mjs:320-343` (set entry with rationale comment). Confirmed the
   12 mobile cells pass via a REAL click-and-open (not a skip) — see the manifest excerpt cell detail
   (`visualIntegrity.violations: []`, `offscreen-control` count 0 in the summary).
2. **`element-overlap` gains a generic containment/ancestry guard (no hardcoded story id);
   AdminSurfacePattern's 16 fails cleared.** ✅ `scripts/geometry-integrity.mjs:421-476` (`isContained` +
   `isAncestorOf`, no selector/story-id literal in either).
3. **Anti-regression proof: a planted TRUE sibling-overlap still FAILs the gate, proving the guard didn't
   neuter real-collision detection.** ✅ The permanent `planted-visualviolations--overlapping-actions` fixture
   (partial overlap, neither box contains the other) still fails at 320/375/390 — see
   `transcript-2-ac3-anti-regression-proof.log`. (No plant/revert cycle was needed — this fixture is a
   PERMANENT anchor in the codebase built for exactly this purpose, unlike Task 607's throwaway single-use
   plant; nothing was temporarily modified or reverted.)
4. **`--mantine-only` exits 0 except the tracked `ListingDetailPattern` xfail (unchanged).** ✅ See "Full gate
   re-run" above — exit 0, 16 KNOWN-FAILURE unchanged.
5. **Primitives + the other 11 patterns byte-unchanged in pass/fail vs the Task 607 baseline.** ✅ See
   before/after table — only the 28 target cells changed; AMBIGUOUS/KNOWN-FAILURE counts identical.
6. **Rendered proof for AppShellFoundation OPENED + AdminSurfacePattern at uk@320/375/390 + desktop × 4
   locales, persisted.** ✅ 32 PNGs (16 per story × 4 viewports × 4 locales — exceeds the uk-mandatory +
   desktop×4-locale minimum) at `docs/sessions/2026-07-15-task611-assets/`.
7. **Gates: `node --check` both scripts, `check:stories`, `check:file-integrity`, `check:mojibake` clean. NO
   git. Session log + `docs/backlog.md` updated; "Files Changed" table.** ✅ See "Gates" below. No git command
   run by this session.

## Gates

```
node --check scripts/check-stories-rendered.mjs   → OK
node --check scripts/geometry-integrity.mjs        → OK
npm run check:stories                              → ✅ PASSED — 116 files checked, 0 violations
npm run check:file-integrity                       → ✅ PASSED — all 147 file(s) clean
npm run check:mojibake                              → 0 artifacts in 1745 files
npm run screenshots:assert -- --mantine-only        → 857/900 PASS, 0 FAIL, exit 0
```

## Files Changed

| File | Change | Why |
|---|---|---|
| `scripts/check-stories-rendered.mjs` | Added `'AppShellFoundation'` to `MANTINE_OVERLAY_PRIMITIVES` (with rationale comment); added a `trigger.isVisible()` gate before the click in `captureCell`'s `openTrigger` handling (skip-if-invisible, checks still run); updated the stale `MANTINE_PATTERN_KNOWN_FAILURES` doc comment that previously described both stories as "held" | AC1 + the STOP-AND-ASK resolution (owner-directed fix) |
| `scripts/geometry-integrity.mjs` | Added `isContained(inner, outer)` helper + a new Check-4 exclusion (`isContained(aVisibleRect, bVisibleRect) \|\| isContained(bVisibleRect, aVisibleRect))`) | AC2 |
| `docs/storybook-governance.md` | New §14.9.19 documenting both fixes, the STOP-AND-ASK resolution, and the before/after gate numbers | Task scope note requirement |
| `docs/backlog.md` | Replaced "Last Session" with the Task 611 summary; removed the now-resolved "Task 607 review needed" pending-action row; updated the task-numbering tracker (611 used, 612 next free) | Mandatory backlog tidy after task close |
| `docs/sessions/2026-07-15-task611-assets/` (new dir) | 32 rendered PNGs (both stories × 4 viewports × 4 locales), the full `--mantine-only` run transcript, a manifest excerpt for both stories, and the AC3 anti-regression-proof transcript | AC6 persisted rendered evidence |
| `docs/sessions/2026-07-15-task611-gate-held-story-resolution.md` (this file) | New session log | Required per task contract |

No product component, `*.stories.tsx`, or any file outside the declared scope was touched. No `git` command
was run by this session (single-writer discipline — the orchestrator emits commit commands after diff review).
