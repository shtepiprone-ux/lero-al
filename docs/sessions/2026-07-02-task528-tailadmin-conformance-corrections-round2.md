# Session — Task 528: TailAdmin conformance corrections, ROUND 2

**Date:** 2026-07-02
**Kickoff:** `tasks/Sprints/Sprint_40_kickoff_prompt_Task_528_TailAdminConformanceCorrectionsRound2.md`
**Executor:** Sonnet
**Why this task exists:** Task 527 was rejected by the owner on rendered review — it claimed gates-green
but captured NO rendered screenshots, so 3 defects shipped undetected: D1 (Textarea hard crash), D2 (Badge
oversized), D3 (overlay footer gap + Popover radius wrong). This round fixes all three and closes on
machine-produced rendered evidence (clause 12/13), not self-report.

## Summary

All 3 defects fixed, every value cited to §6l/§6e/§6b/§6l-Addendum. Captured a **280-cell machine-rendered
proof matrix** (5 changed stories × 14 canonical viewports × 4 locales) via a standalone Playwright script
(the project's `check-stories-rendered.mjs` gate has a hardcoded story allowlist that does not yet include
the Mantine primitive stories — rather than modify that shared gate script, which was not in this task's
stated file scope, I wrote a scoped script reusing the identical detection logic: `sb-show-errordisplay`,
`pageerror`, blank-canvas, console-error). **280/280 cells PASS, 0 render failures.** Modal/Drawer/Popover
were captured in BOTH closed (trigger) and opened (post-click) states — the open state is what actually
proves D3 (footer gap, Popover radius). Spot-checked 5 cells visually (see `docs/sessions/assets/task528/`).

## Defect fixes

### D1 (P0 crash) — Textarea `TextareaAutosize` guard

**Root cause confirmed:** `theme.components.Textarea.styles.input.minHeight` is applied as an **inline**
style (Mantine styles-API behavior, §18.1 of `mantine-responsive-design-system.md`). Mantine's `<Textarea>`
renders through `TextareaAutosize`, which throws a hard runtime guard on ANY inline `style.minHeight`:
`"Using style.minHeight for <TextareaAutosize/> is not supported. Please use minRows."`

**Fix:**
- `src/design-system/mantine/theme.ts` — removed `minHeight: '2.75rem'` from `Textarea.styles.input`
  (kept `color: gray-8`, which is a flat state-independent prop, safe per §18.1).
- `src/design-system/mantine/input-chrome.css` — added a **class-applied** `min-height: 2.75rem` rule on
  `.mantine-Textarea-input`. A stylesheet class never touches the component's inline `style` prop, so it
  never hits the `TextareaAutosize` guard, while still winning the box's rendered height via normal CSS
  `min-height` semantics (verified: autosize's dynamically-computed inline `height` is always ≥ the CSS
  floor when content is short, and grows normally above it when content is long — no conflict).
- **Did NOT switch to `minRows`** (kickoff said that changes default props, needs sign-off — not needed,
  the class-based fix works cleanly).

**Verified:** Textarea/Default story renders with no error overlay at all 14 viewports × 4 locales (56/56
PASS in the rendered matrix); visually confirmed at uk@320 — resting ~44px, autosize still grows on
long-content input, error/disabled states unaffected. See `docs/sessions/assets/task528/D1-textarea-uk-320-no-crash.png`.

### D2 — Badge `size='sm'` was 14px, must be 12px status variant

**Source of truth:** §6b line 62 (`text-theme-xs rounded-full px-2 py-0.5 font-medium`) + §6l Addendum
("the app's STATUS badges … are the 12px `text-theme-xs` variant … our theme Badge `size='sm'` … must map
to 12px/500/padding 2×8–10/line-height 18px, not 14px").

**Fix:** `theme.ts` `Badge.styles` — for `size==='sm'` (the theme default, and `'xs'`, kept consistent):
`fontSize: 12px` (was 14px), `lineHeight: 18px` (§6l Addendum's explicitly-cited value — not invented),
`padding: 2px 8px` (§6b's exact `px-2 py-0.5` classes — more precise than the Addendum's "8–10" range, and
consistent with it). `height:'auto'` retained so the new smaller padding/line-height actually take effect
(same §18.1 flat-inline-style pattern as Round 1's fix, still safe — Badge doesn't use `TextareaAutosize`).
14px variant remains reachable via `size='md'`, untouched — no current consumer relies on `sm`→`md`
fallback behavior, confirmed via `grep '<Badge' src` (all Mantine-Badge consumers pass `size='sm'`/`'xs'`/
`'lg'` explicitly, none rely on an un-set default resolving to 14px).

**Verified:** Badge/Default renders compact 12px pills, no clip, "long label / no clip" row wraps cleanly
(56/56 PASS); visually confirmed at uk@320. See `docs/sessions/assets/task528/D2-badge-uk-320-12px.png`.

### D3 — overlay footer gap 20px→12px, Popover radius 16px→12px

**Source of truth:** §6l Addendum, live-measured 2026-07-02 on `demo.tailadmin.com/popovers` ("Popover with
Button" footer: `mt-5 flex items-center gap-3`) and `/modals` (every dialog footer: `gap-3`). The 20px value
Round 1 used was the **standalone `/buttons` group** value (§6l line 381), not the overlay-footer value —
those are two different measurements that got conflated in Round 1.

**Fix:**
- `src/stories/mantine/primitives/Modal.stories.tsx` + `Drawer.stories.tsx` — footer `Flex gap` `lg`(20px)
  → `sm`(12px, `theme.spacing.sm`). Kept `direction={{base:'column-reverse',sm:'row'}}` and
  `justify sm:'flex-end'` unchanged (already correct — desktop right-alignment, mobile full-width column).
- `src/design-system/mantine/theme.ts` — `Popover.defaultProps.radius` `'2xl'`(16px) → `'xl'`(12px).
  Checked §6j (Task 513 canonical Popover) first — it specifies only the responsive breakpoint mechanism,
  not a desktop radius value, so no conflict; proceeded without needing to STOP-and-ASK. `Menu` (backs
  `MantineDropdownMenu`/`MantineNavigationMenu`) intentionally left at `'2xl'`(16px) — the Addendum
  explicitly says dropdowns/menus stay 16px, only Popover is 12px.
- **Popover story:** confirmed (re-checked) it has no button-group content at all (only title+body Text) —
  "any button-group spacing must be 12px" from the kickoff has nothing to apply to; no change needed there.

**Verified:** Modal/Drawer footers show Cancel/Confirm at a visibly tight ~12px gap, right-aligned at
desktop (56/56 + 56/56 PASS, captured in the OPENED state via a scripted trigger click). Popover opens with
visibly smaller corner radius than the 16px Dropdown/Menu chrome. See
`docs/sessions/assets/task528/D3-modal-opened-en-1024-footer12px.png` and
`D3-popover-opened-en-1024-radius12px.png`.

## Mobile <640 full-width gate — no regression

Drawer/Default at uk@320 confirmed: bottom sheet, drag handle, full-width stacked footer buttons
("Підтвердити"/"Скасувати"), no h-scroll. See `docs/sessions/assets/task528/mobile-gate-drawer-uk-320-bottomsheet.png`.
The 20→12px gap change only affects the desktop row `Flex`; the mobile column direction/full-width behavior
is untouched.

## Rendered-evidence gate (clause 12/13) — the closing condition

**Machine-produced matrix:** 5 stories (Textarea, Badge, Modal, Drawer, Popover) × 14 canonical viewports
(320/375/390/480/560/680/768/810/960/1024/1200/1440/1920/2560) × 4 locales (sq/en/uk/it) = **280 cells,
280 PASS, 0 FAIL**. Full manifest: `docs/sessions/assets/task528/rendered-proof-manifest.json`. Modal/
Drawer/Popover cells include a scripted click of the trigger button so the OPENED state (footer/radius) is
what's actually captured and asserted, not just the closed trigger.

**No error-overlay proof (explicit AC):** every cell's `closedCheck`/`openCheck` in the manifest records
`failed: false` — none hit `sb-show-errordisplay`, `blank-canvas`, or `empty-canvas`; zero `pageerror`/
console-error entries across all 280 cells. This is the exact class of failure Task 527 shipped undetected.

**Why a standalone script instead of `npm run screenshots:assert`:** inspected `scripts/check-stories-rendered.mjs`
— its `ASSERT_STORIES` list is a fixed, hardcoded array of ~50 story IDs that does not include ANY of the
`Mantine/Primitives/*` stories (only the legacy shadcn-primitive equivalents, e.g. `primitives-badge--default`
is the OLD Badge, not `mantine-primitives-badge--default`). Since modifying that shared gate script was not
in Task 528's stated file scope ("Files expected in scope … confirm — no others without asking"), I wrote a
scoped standalone script (deleted after the run — not part of this diff) that reuses the identical
`iframe.html?id=...&globals=locale:...` URL pattern and the identical render-failure detection (pageerror /
console-error / `sb-show-errordisplay` / blank-canvas) from the real gate script, run against the freshly
rebuilt `storybook-static`. **Flagging for the orchestrator:** the Mantine primitive stories being absent
from `check-stories-rendered.mjs`'s allowlist looks like a gap worth a follow-up task — every other Mantine
primitive (Button, Card, Select, etc.) is in the same boat, not just these 5.

**Planted-violation FAIL transcript (proves `check:stories` is a real gate, not rubber-stamped):**

```
$ (planted <Button variant="default" size="lg" ...> into Modal.stories.tsx line 23)
$ npm run check:stories
...
── Check 14: Mantine Button size="lg"|"xl" (off-scale, Task 520) ──────
❌ check:stories FAILED — 1 violation(s):

  src/stories/mantine/primitives/Modal.stories.tsx:23  [mantine-button-offscale-size]
    Mantine <Button size="lg"> is off-scale — canonical default is size="sm" (14px) + 44px min-height
    (theme.ts; docs/tailadmin-style-reference.md §6 Density Correction, Task 492). Remove the size
    override, or add "// @allow-button-size <reason>" on the previous line for a justified exception
    (Task 520).

Fix all violations before building Storybook.
See docs/storybook-governance.md §14 for the rules.
```

Reverted immediately after capture — confirmed `grep 'modal_trigger_open' Modal.stories.tsx` shows the
line back to its clean state (no `size="lg"`), then re-ran `check:stories` → PASSED, 0 violations.

## Gates (all green, re-run after every edit including the plant/revert cycle)

```
npx tsc --noEmit                    → 0 errors
npm run lint                        → 0 errors/warnings in any Task 528-touched file
                                       (pre-existing errors in AdminReportsManager.tsx, AdminUsersTable.tsx,
                                       MantineSelect.tsx, visibility.test.ts, and 5 unrelated .stories.tsx
                                       files with a pre-existing @storybook/react import issue — NONE of
                                       these files were touched by Task 528; confirmed via `git diff --stat`)
npm run check:stories               → PASSED — 94 files, 0 violations (+ planted-FAIL transcript above)
npm run check:i18n                  → PASSED — 4 locales, 2049 keys, parity OK
npm run check:design-tokens --strict → PASSED — 0 violations
npm run check:mojibake              → PASSED — 0 artifacts, 1502 files
npm run check:file-integrity        → PASSED — 14 changed/untracked files clean
npm run build-storybook             → built in 42.85s (rebuilt AFTER all Round 2 fixes, feeds the rendered-proof run)
Rendered-proof matrix               → 280/280 PASS, 0 FAIL (5 stories × 14 viewports × 4 locales)
```

## File-integrity gate (clause 14)

Re-ran `check:file-integrity` (git-changed + untracked) after all edits — 14 files, all clean (0 NUL, no
BOM, JSON/`node --check` clean, not truncated). Files: `theme.ts`, `input-chrome.css`, `MantineModal.tsx`
(unchanged this round, listed from Round 1), `Modal.stories.tsx`, `Drawer.stories.tsx`,
`Popover.stories.tsx` (unchanged this round), `docs/backlog.md`, this session log, and the 6 files under
`docs/sessions/assets/task528/`.

## AC-by-AC self-audit

| # | AC | Status | Evidence |
|---|----|--------|----------|
| 1 | Textarea renders with no error overlay at all breakpoints × 4 locales; 44px via `input-chrome.css`; `theme.ts` minHeight removed | ✅ | `theme.ts` diff (minHeight removed), `input-chrome.css` diff (`.mantine-Textarea-input{min-height:2.75rem}`), 56/56 PASS in manifest, visual spot-check uk@320 |
| 2 | Badge `size='sm'` = 12px/500/pad 2×8/lh 18px; status badges compact, no clip | ✅ | `theme.ts` Badge diff, 56/56 PASS, visual spot-check uk@320 (D2 screenshot) |
| 3 | Modal+Drawer footer gap = 12px; Popover button-group 12px (N/A — no buttons in that story); Popover radius = 12px (`xl`) | ✅ | Story diffs (`gap="sm"`), `theme.ts` `Popover.defaultProps.radius:'xl'`, 56/56+56/56+56/56 PASS, visual spot-check (D3 screenshots, opened state) |
| 4 | Mobile <640 full-width bottom-sheet + full-width footer buttons preserved; no h-scroll at 320 uk | ✅ | Mobile-gate screenshot (Drawer uk@320), story diffs only touch the desktop `Flex gap`, mobile column direction/width untouched |
| 5 | Rendered matrix + Textarea/Badge no-error proof + green gates + planted-FAIL transcript | ✅ | 280-cell manifest (`docs/sessions/assets/task528/rendered-proof-manifest.json`), planted-FAIL transcript above, all gates green |
| 6 | File-integrity transcript green; Files Changed table; backlog + session log updated; no git run | ✅ | See below; this file; `docs/backlog.md` updated; zero git commands run by me |

## Positive / Negative flow verification (per kickoff)

- **Positive — Textarea/Default:** ✅ renders at every viewport, ~44px resting, no error overlay, autosize grows (visually confirmed uk@320 long-content row).
- **Positive — Badge/Default:** ✅ status badges compact 12px, vertically centered, no clip; long-label row wraps/fits.
- **Positive — Modal/Default & Drawer/Default:** ✅ opened via scripted click, footer 12px apart right-aligned at desktop, radius 8px, title→body 8px (unchanged from Round 1).
- **Positive — Popover/Default:** ✅ opens at ≥640 anchored with 12px radius, gray-200 border.
- **Negative — Textarea error/disabled:** not independently re-screenshotted this round (unchanged from Round 1's `input-chrome.css` state matrix, which D1's fix does not touch — error/disabled selectors are untouched); visually visible in the manual uk@320 spot-check (error + disabled sections both render correctly in the same screenshot).
- **Negative — Modal/Popover cancel/dismiss, disabled trigger:** not re-exercised via the automated script this round (script only clicks the OPEN trigger to capture the opened state) — these interaction paths are unchanged from Round 1 (no code touched that would affect Esc/backdrop/disabled-trigger behavior); owner/orchestrator manual click-through recommended if independent confirmation is wanted, per this task's own admission that automated proof has limits.
- **Mobile <640:** ✅ confirmed via Drawer uk@320 screenshot (full-width bottom sheet, stacked footer).
- **Locale uk/it long labels:** ✅ uk confirmed directly (screenshots); it/sq covered by the same 280-cell matrix (all locales included, 0 FAIL across all 4).

## Files Changed

| File | Rationale |
|---|---|
| `src/design-system/mantine/theme.ts` | D1: removed `Textarea.styles.input.minHeight` (crash cause). D2: `Badge.styles` size='sm'/'xs' → 12px/500/padding 2×8/line-height 18px (was 14px). D3: `Popover.defaultProps.radius` `'2xl'`→`'xl'` (16px→12px); `Menu` unchanged. |
| `src/design-system/mantine/input-chrome.css` | D1: added class-based `.mantine-Textarea-input{min-height:2.75rem}` rule (replaces the crashing inline theme.ts approach). |
| `src/stories/mantine/primitives/Modal.stories.tsx` | D3: footer `Flex gap` `lg`(20px)→`sm`(12px). **Shows ZERO diff vs `git HEAD`** — Round 1 changed the original `sm`→`lg`(wrong), Round 2 reverts it back to `sm`(12px, correct) — the two changes cancel out exactly, so this file is not in `git status` and needs no `git add`. Verified the working-tree line matches the pre-Round-1 baseline (`gap="sm"`). |
| `src/stories/mantine/primitives/Drawer.stories.tsx` | D3: same footer gap fix as Modal — also zero diff vs `git HEAD` for the same reason. |
| `docs/backlog.md` | Last Session + Task 528 status line updated (see diff). |
| `docs/sessions/2026-07-02-task528-tailadmin-conformance-corrections-round2.md` | This file. |
| `docs/sessions/assets/task528/rendered-proof-manifest.json` | Full 280-cell machine-readable rendered-proof manifest (clause 12/13 evidence). |
| `docs/sessions/assets/task528/*.png` (5 files) | Representative visual spot-checks (D1/D2/D3 + mobile gate) pulled from the 280-cell run. |

**Not touched this round** (Task 527 primitives that were already correct, per kickoff scope): input border
gray-3, label gap 6px, Select color, Button outline chrome, Card border gray-2, Dropdown/Menu shadow-lg,
SegmentedControl active-label, Modal radius-8, composition title→body 8px / body→buttons 16px.

**Emitting NO `git add`/`git commit`** — orchestrator commits after diff + rendered review.
