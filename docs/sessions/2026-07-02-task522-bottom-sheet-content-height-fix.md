# Task 522 — Bottom sheet stretches to 90dvh on short content (§18.8 foundation fix, Task 514 single source)

Kickoff: `tasks/Sprints/Sprint_39_kickoff_prompt_Task_522_BottomSheetContentHeightFix.md`. Origin: `docs/mantine-responsive-design-system.md` §18.8 — the mobile bottom sheet always rendered at exactly `90dvh` regardless of content height, leaving a large empty region below short content on all five foundation consumers (owner-authorized fix at the Task 514 single source, 2026-07-01).

## Root-cause diagnosis (rendered measurement, not guessed)

Ran `npm run storybook` (dev server) and drove it with a transient Playwright script (`scripts/_tmp-diagnose.mjs`, removed after capture) against `Mantine/Primitives/Modal → Default`, inspecting the real computed styles/CSS custom properties of `.mantine-Drawer-content`/`-body`/`-header` before any edit:

- `ResponsiveBottomSheet` passes `size="auto"` to Mantine's `Drawer`. Mantine resolves `size` via `getSize(size, 'drawer-size')`, which for a non-token value like `"auto"` emits `var(--drawer-size-auto)` — a custom property **never declared anywhere** in the stylesheet.
- For `position="bottom"`, Mantine's own vars resolver sets `--drawer-height: var(--drawer-size)`, which chains to the same undeclared `--drawer-size-auto`.
- Mantine's `.mantine-Drawer-content` class rule is `height: var(--drawer-height, calc(100% - var(--drawer-offset) * 2))`. Because `--drawer-height`'s value chain is unresolvable, the browser falls back to the declaration's own fallback: `calc(100% - 0) = 100%` of the full-screen overlay (confirmed empirically: `getComputedStyle(content).getPropertyValue('--drawer-height')` → `""`, and measured `content` height = exactly the viewport height before any max-height clamp).
- Our own inline `content.maxHeight:'90dvh'` was the ONLY thing capping that 100%, so `content` was **always** exactly `90dvh`, and `body:{flex:1}` then stretched to fill that fixed box — producing the empty region below short content (confirmed: at a 375×800 viewport, `content` measured 720px = 90dvh of 800px, *regardless* of the short "standard dialog" content).

## Fix (confined to `bottomSheetDrawerStyles`)

```ts
content: {
  ...
  height: 'auto',       // NEW — escapes the 100%-fallback height described above
  maxHeight: '90dvh',   // unchanged — still hard-caps long content
  display: 'flex',
  flexDirection: 'column',
},
body: { flex: 1, minHeight: 0, overflowY: 'auto', padding: 0 },  // NEW: minHeight:0
```

- `content.height:'auto'` restores content-driven (shrink-to-fit) sizing; `maxHeight:'90dvh'` still clamps it when content is taller than that.
- `body.minHeight:0` overrides the flex-item default (`min-height:auto`, i.e. the content's own intrinsic min-content size), which otherwise prevents `body` from shrinking below its natural height once `content` is capped at `90dvh` — without it, long content would overflow the capped box instead of scrolling internally. (Verified this was in fact necessary: re-measured with/without it during implementation.)

No other export (`DragHandle`, `ResponsiveBottomSheet`, `SheetContent`, `useResponsiveDropdown`) touched.

## Files Changed

| File | Rationale |
|---|---|
| `src/design-system/mantine/patterns/responsiveBottomSheet.tsx` | `bottomSheetDrawerStyles.content` gains `height: 'auto'`; `bottomSheetDrawerStyles.body` gains `minHeight: 0`. Inline comments cite Task 522 and explain both properties' purpose. Nothing else in the file changed. |
| `docs/mantine-responsive-design-system.md` | §18.8 flipped from "KNOWN ISSUE (reported, NOT fixed)" to a resolved write-up of the confirmed mechanism + fix + verification summary. §19.1's `bottomSheetDrawerStyles` row description updated to mention content-sized height up to the 90dvh cap. |
| `docs/backlog.md` | "Last Session" replaced with the Task 522 completion summary (previous entry — Task 519+521 commit note + Task 522 kickoff-ready — was already fully covered by an existing archive row, so no new archive row was needed); the "Task numbering" paragraph's Task 522 status flipped from "📋 KICKOFF READY" to "✅ IMPLEMENTED, awaiting orchestrator review". |

`git diff --stat` for `MantineSelect.tsx`, `MantinePopover.tsx`, `MantineDropdownMenu.tsx`, `MantineNavigationMenu.tsx`, `MantineModal.tsx`, `*.stories.tsx` — **empty** (confirmed via `git status --porcelain`, only `responsiveBottomSheet.tsx` shows as modified). No STOP-AND-ASK was needed — the fix was fully expressible inside `bottomSheetDrawerStyles`.

## Positive / Negative flow (cited in AC table below)

**Positive flow:** user taps a trigger on <640 → sheet slides up, full-width, top-only radius, drag handle at top → **short content:** sheet height matches content, no empty band below → **long content:** sheet caps at 90dvh, body scrolls, handle/title pinned → backdrop tap/Esc closes, focus returns to trigger. Verified on all five consumers.

**Negative flow:**
- Boundary (~90dvh): content height and the 90dvh cap converge to sub-pixel difference (140.05px vs 140.4px cap target, Popover/en), no double scrollbar (`bodyScrollHeight === bodyClientHeight` at the fitting boundary).
- Empty/single-item content: not a distinct code path — same `height:auto` mechanism sizes the sheet to whatever is smallest; confirmed via Select (4 short options) and Popover (two lines of text) both producing a small, content-fit sheet, no orphaned handle above a gap.
- Very long localized content (uk/it): forced-overflow pass at `uk` locale on all 5 consumers confirms cap+scroll holds; no horizontal overflow at 320 confirmed separately (Modal, uk@320: `hScroll === false`).
- Modal no-footer long section (`ModalLongSection`): unchanged — this fix only touches `content`/`body` sizing, not the Task 521 `Stack gap="md"` composition; re-measured body↔footer gap = 16px, unchanged.
- ≥640 desktop paths: confirmed **zero** `.mantine-Drawer-content` elements render at 1280px width on all five consumers (anchored/centered path only) — no side effect from the shared-style edit.
- Backdrop tap/Esc/returnFocus: untouched (foundation defaults, not touched by this fix).
- Rapid open/close/re-open: Select story opened, closed (Esc), reopened — measured content height identical both times (236.0625px), no stale height from a previous render.

## AC-by-AC self-audit

| # | AC | Verdict | Evidence |
|---|---|---|---|
| 1 | Short-content empty space drops from hundreds-of-px baseline to ≤ the sheet's own bottom padding, per consumer | ✅ | Measured (robust "true bottom of visible content" = max `getBoundingClientRect().bottom` among all `body` descendants, immune to `flex-direction:column-reverse` footer ordering tricks): `gapBelowContent = 0px` beyond the sheet's designed padding for **all five consumers** (Modal, Popover, DropdownMenu, NavigationMenu, Select) at 320/375/390 × sq/en/uk/it (60 cells). Baseline was Modal≈574px/Popover≈650px/DropdownMenu≈573px/NavigationMenu≈618px. Positive flow. |
| 2 | Long-content sheet still caps at 90dvh with internal body scroll + pinned handle/title, per consumer | ✅ | Forced-overflow pass (uk, 375×130 viewport → 90dvh=117) on all 5 consumers: `cappedAt90dvh: true` (content height 117px, exact) and `scrollable: true` (`bodyScrollHeight > bodyClientHeight`) on every consumer. Also confirmed on Modal's dedicated `ModalLongSection` at normal viewport height (400px → cap 360px, body scrollHeight 384 > clientHeight 300). Positive flow. |
| 3 | Fix confined to `bottomSheetDrawerStyles`; `git diff --stat` empty for the 5 consumer files + no change to `DragHandle`/`ResponsiveBottomSheet`/`SheetContent`/`useResponsiveDropdown` | ✅ | `git status --porcelain` shows only `responsiveBottomSheet.tsx` modified; diff within that file touches only the `content`/`body` keys of `bottomSheetDrawerStyles`. No STOP-AND-ASK was raised (not needed). |
| 4 | Boundary (~90dvh), single-item, rapid re-open — no double scrollbar, no stale height, no orphaned handle | ✅ | Boundary: Popover 90dvh target 140.4px vs measured content 140.05px, `bodyScrollHeight===bodyClientHeight` (80=80, no overflow). Rapid re-open: Select open→Esc→reopen, height identical (236.0625px both times). Negative flow. |
| 5 | ≥640 anchored/centered paths unchanged for all five consumers | ✅ | `.mantine-Drawer-content` count = 0 at 1280px width for all 5 consumers (desktop path never renders a Drawer at all — anchored/centered Mantine components handle it, untouched). Negative flow. |
| 6 | Task 521 Modal body↔footer 16px gap + no-footer long-section spacing unchanged | ✅ | Re-measured `Stack gap="md"` gap between the `Box(children)` and footer `Flex` = 16px (unchanged). `ModalLongSection` (no footer) — mechanism untouched by this fix (only `content`/`body` sizing changed, not the Stack composition). Negative flow. |
| 7 | Rendered-proof matrix: breakpoints × locales × 5 consumers × short/long | ✅ | See matrix below. uk@320/375/390 included for all 5 consumers. |

## Rendered proof matrix (clause 12 + AC7)

Produced via a transient Playwright script (`scripts/_tmp-measure-matrix.mjs` + `scripts/_tmp-edge-checks.mjs`, both removed after capture) against `npm run storybook` (live dev server, `Mantine/Primitives/*` stories, `?viewMode=story&globals=locale:<x>`), clicking each consumer's real trigger and measuring the actual DOM/CSS via `getComputedStyle`/`getBoundingClientRect`.

**Short content — empty space below content (px), 320/375/390 × sq/en/uk/it (uk mandatory, all present):**

| Consumer | 320 | 375 | 390 | Notes |
|---|---|---|---|---|
| MantineSelect | 0 (all 4 locales) | 0 (all 4 locales) | 0 (all 4 locales) | content height 236px at every cell |
| MantinePopover | 0 (all 4 locales) | 0 (all 4 locales) | 0 (all 4 locales) | content height 140–180px depending on locale text length |
| MantineDropdownMenu | 0 (all 4 locales) | 0 (all 4 locales) | 0 (all 4 locales) | content height 237/257px depending on locale |
| MantineNavigationMenu | 0 (all 4 locales) | 0 (all 4 locales) | 0 (all 4 locales) | content height 192/212px depending on locale |
| MantineModal | 0 (all 4 locales) | 0 (all 4 locales) | 0 (all 4 locales) | content height 232/252px depending on locale |

All 60 mobile cells: `cappedAt90dvh: false` (correctly NOT clamped — sizing to content) and no horizontal scroll (checked explicitly at Modal uk@320: `hScroll === false`).

**Forced-overflow (long-content-equivalent) — cap + scroll, uk@375, one row per consumer:**

| Consumer | Content height | 90dvh cap target | Capped? | Scrollable? |
|---|---|---|---|---|
| MantineModal | 117px | 117px (130×0.9) | ✅ | ✅ (scrollHeight 192 > clientHeight 57) |
| MantinePopover | 117px | 117px | ✅ | ✅ (100 > 57) |
| MantineDropdownMenu | 117px | 117px | ✅ | ✅ (197 > 57) |
| MantineNavigationMenu | 117px | 117px | ✅ | ✅ (132 > 57) |
| MantineSelect | 117px | 117px | ✅ | ✅ (176 > 57) |

(Popover/DropdownMenu/NavigationMenu/Select stories don't have a dedicated "long" content section post-Task 511 trim; rather than fabricate new story content — the kickoff's own out-of-scope clause requires a STOP-AND-ASK before adding a proof-only section — the cap+scroll mechanism was proven by shrinking the viewport height until each consumer's EXISTING content genuinely exceeds 90dvh. This is the same shared CSS mechanism regardless of absolute content length, and Modal's own dedicated `ModalLongSection` story independently confirms the identical mechanism at a normal viewport height, see AC2 evidence above.)

**≥640 desktop (1280px, en) — one row per consumer:**

| Consumer | `.mantine-Drawer-content` count |
|---|---|
| MantineModal | 0 |
| MantinePopover | 0 |
| MantineDropdownMenu | 0 |
| MantineNavigationMenu | 0 |
| MantineSelect | 0 |

**Supplementary (not an AC column but load-bearing evidence):**
- Boundary case (Popover, en, 90dvh target 140.4px): content height 140.05px, `bodyScrollHeight === bodyClientHeight` (80=80) — no double scrollbar, no jitter.
- Rapid re-open (Select, en): content height identical across two consecutive opens (236.0625px both times).
- Modal body↔footer gap (Task 521 preservation, en): 16px, unchanged.
- No h-scroll at 320 (Modal, uk, short content — longest strings): confirmed false.

## Gates (native, this session)

```
$ npx tsc --noEmit
(0 errors)

$ npm run check:stories
✅ check:stories PASSED — 92 files checked, 0 violations.

$ npm run check:i18n
✅ Parity PASSED — all 4 locale files have identical key sets (2035 keys — unchanged, no new strings).

$ npm run check:design-tokens
✅  check:design-tokens — 0 violations found.

$ npm run check:mojibake
check:mojibake: 0 artifacts in 1485 files

$ node scripts/check-file-integrity.mjs src/design-system/mantine/patterns/responsiveBottomSheet.tsx
✅  check:file-integrity PASSED — all 1 file(s) clean
```

**File-integrity (clause 14):** `responsiveBottomSheet.tsx` — `tr -cd '\000' | wc -c` = 0; no UTF-8 BOM (`head -c3 | od` = `27 75 73`, i.e. `'us` from `'use client'`); `tsc --noEmit` clean (covers compile/truncation); tail confirmed intact (ends `    </Box>\n  )\n}\n`, the `SheetContent` closing brace).

**Regression-coverage re-verify (clause 15, Pre-read item 7):**

```
$ grep -rln "responsiveBottomSheet\|ResponsiveBottomSheet\|bottomSheetDrawerStyles" src --include=*.tsx --include=*.ts | grep -v "src/design-system/mantine" | grep -v "src/stories"
(no output — still no product consumer; regression-coverage clause 15 still N/A)
```

## Self-validation

`npx tsc --noEmit` = 0 errors. Diagnosed the exact stretch mechanism via rendered DOM/CSS inspection (not guessed) before writing any fix, per the kickoff's explicit requirement. Applied the minimal two-property fix, then re-verified via the same rendered-measurement approach across all five consumers × 320/375/390 × sq/en/uk/it for short content (AC1), forced-overflow for cap+scroll (AC2), plus boundary/rapid-reopen/desktop-unaffected/Task-521-preservation negative-flow cases (AC4/AC5/AC6), cited by name in the AC table above alongside the Positive/Negative flow sections. `git diff --stat` confirms only `responsiveBottomSheet.tsx` changed — zero consumer files touched (AC3). All temporary Playwright scripts (`scripts/_tmp-*.mjs`) removed after capture; nothing left in the working tree except the two doc files and the one source file. **Self-validation: COMPLETE.**

**Emit NO `git add`/`git commit`** — the orchestrator emits commit commands after diff + rendered-proof review (single-writer rule; this overlay thread requires rendered-proof review per the Task 520 rejection precedent).
