# Session — Task 536: Constrain Mantine story canvas to a TailAdmin content column (kill the >640 "rubber" render) + theme.ts intrinsic-width audit

**Date:** 2026-07-03
**Kickoff:** `tasks/Sprints/Sprint_40_kickoff_prompt_Task_536_MantineStoryConstrainedContentColumn.md`
**Executor:** Sonnet (this session)

## Summary

Every `Mantine/Primitives/*` story (23 files) previously rendered `skipCanvas`+`fullscreen` + a bare
`<Box p="xl">`/`<Box px={{base:'md',sm:'xl'}} py="md">` wrapper — padding but no width cap, so at ≥640px the
primitive stretched edge-to-edge across the whole viewport ("rubber render"). A new single-source
`MantineStoryShell` (`src/stories/mantine/_MantineStoryShell.tsx`) now wraps all 23 stories: `<640` is
byte-identical to the old wrapper (zero mobile regression risk); `≥640` adds a gray-50 page background, caps
content to **1536px** and centers it, and wraps the demo in white card chrome — matching TailAdmin's own page
layout. A `theme.ts` intrinsic-width audit (Scope B) found zero divergences requiring a code change.

## §6m extraction — methodology (clause 16, done BEFORE implementing)

The zip (`demo_tailadmin_com.zip`) has no dedicated "UI Elements showcase" page (only full dashboard routes —
`index.html`, `crm.html`, `analytics.html`, etc.) — confirmed via `unzip -l`. Per the kickoff's explicit
instruction, the value was measured LIVE rather than invented:

1. Fetched `demo.tailadmin.com/buttons` and `/alerts` (internet access confirmed available this session) at
   **1920px and 2560px** viewports via Playwright.
2. First probe (page `<main>` content area): `mainWidth: 2270` at `bodyWidth: 2560`, `mainMaxWidth: 'none'` —
   the OUTER dashboard shell is fluid (sidebar-offset, no cap). This alone would have been a STOP-and-ASK
   dead-end (no unambiguous value at that level).
3. Second probe (the actual card containers holding the button/alert demos): width **1488px** at BOTH 1920px
   AND 2560px viewports — identical at two different viewport widths is the signature of a genuine cap, not
   viewport-fluid sizing. Traced the DOM ancestor chain: the card's parent is
   `<div class="mx-auto max-w-(--breakpoint-2xl) p-4 pb-20 md:p-6 md:pb-6">` inside `<main>`, measured
   `getBoundingClientRect().width = 1536` (card width 1488 = wrapper 1536 − 2×24px `md:p-6` padding — the
   arithmetic matches exactly).
4. Cross-verified against the zip's own CSS custom properties: `unzip -p … css/style.css | grep
   '--breakpoint-2xl'` → `--breakpoint-2xl: 1536px;` — the SAME number, confirming this is TailAdmin's actual
   Tailwind breakpoint token (not a coincidental live measurement), not invented.
5. Also measured: page background `rgb(249,250,251)` = `#f9fafb` = gray-50 (matches zip `--color-gray-50`);
   card chrome `bg:white`, `border:1px solid rgb(228,231,236)` = `#e4e7ec` = gray-200, `border-radius:16px`,
   `box-shadow:none` — byte-identical to the EXISTING §6 Card/Paper row and §5 "Content cards: NO shadow" line
   (no new chrome value invented, only the outer page/column layer was previously undocumented).

Written up as `docs/tailadmin-style-reference.md` §6m, every number cited to its source (zip token or live
measurement cross-check). Probe screenshots: `docs/sessions/assets/task536/tailadmin-live-*.png`.

## `MantineStoryShell` design

Three nested `Box` elements, each style prop using Mantine's native `StyleProp<T> = T |
Partial<Record<breakpoint, T>>` responsive-object syntax (confirmed supported for `bg`/`bd`/`bdrs`/`maw`/`px`/
`py` via `node_modules/@mantine/core/lib/core/Box/style-props/style-props.types.d.ts` — not guessed):

```tsx
<Box bg={{ base: 'transparent', sm: 'gray.0' }} mih="100%">
  <Box maw={{ base: '100%', sm: 1536 }} mx="auto" py={{ base: 'md', sm: 'xl' }}>
    <Box bg={{ base: 'transparent', sm: 'white' }} bd={{ base: 'none', sm: '1px solid var(--mantine-color-gray-2)' }}
         bdrs={{ base: 0, sm: '2xl' }} px={{ base: 'md', sm: 'xl' }} py={{ base: 0, sm: 'xl' }}>
      {children}
    </Box>
  </Box>
</Box>
```

**Arithmetic check against the OLD wrapper (zero regression proof):** at `<640`, the effective padding is
outer(0) + middle(`py:'md'`=16px) + inner(`px:'md'`=16px, `py:0`) = **px:16px, py:16px** — EXACTLY
`<Box px={{base:'md',sm:'xl'}} py="md">`'s base values. No double-padding, no shift. Confirmed rendered
(below), not just arithmetic.

## Overlay primitives — trigger-in-shell, portal-unaffected (verified, not assumed)

Only the TRIGGER (Button/ActionIcon) sits inside the shell for Drawer/Modal/Popover/DropdownMenu/
NavigationMenu/Select/Tooltip stories — the actual popup/sheet renders via Mantine's own portal mechanism.
**Verified via Playwright, not assumed:** opened the Drawer story's "Open drawer" trigger at 1920px viewport —
the drawer's `[role="dialog"]` `getBoundingClientRect()` returned `{ left: 1480, right: 1920 }` — its RIGHT
EDGE is exactly the viewport width (1920), extending far past the shell's 1536px column cap. The backdrop
overlay also darkens the full page beyond the column. Screenshot:
`docs/sessions/assets/task536/mantine-primitives-drawer--default__en__1920-opened.png`.

## `theme.ts` intrinsic-width audit (Scope B, AC5)

`grep -n "grow\|fullWidth\|w:\s*'100%'\|width:\s*'100%'" theme.ts` → zero unconditional matches. Read every
`theme.components.*` block (Button, TextInput, Textarea, PasswordInput, Select, Checkbox, Radio, Switch,
InputWrapper, SegmentedControl, Avatar, Badge, Card, Paper, Modal, Drawer, Popover, Menu, Table, Tabs, Alert,
Pagination/PaginationNext/PaginationPrevious) line-by-line:

| Primitive | Current default | TailAdmin §-row | Change? (Y/N + why) |
|---|---|---|---|
| Button | `radius:'lg', size:'sm'`, no width prop | §6 Button — content-width | N — already content-width, no `fullWidth` default |
| TextInput/Textarea/PasswordInput/Select | `radius:'lg', size:'sm'`, no width prop | §6 Input — 100% of its container (not viewport) | N — Mantine inputs are naturally `width:100%` of their PARENT by design; this is correct/expected, not a viewport-level divergence |
| Checkbox/Radio/Switch | `size:'xs'/'sm'`, no width prop | §6d/f/g/h — content-width row | N — content-width by construction (row/label layout) |
| SegmentedControl | `radius:'lg', size:'sm'`, **`fullWidth` explicitly NOT set** (documented in-file, Task 489 precedent) | §6c — content-width desktop, swipe-scroll `<640` | N — already correct, explicitly documented; do NOT touch (kickoff instruction) |
| Avatar | `radius:'pill'` | §6b — fixed size, content-width | N |
| Badge | `radius:'pill', variant:'light', size:'sm'` | §6/§6b — content-width pill | N |
| Card/Paper | `radius:'2xl', padding:'lg'` | §6 Card — content-width, consumer controls container | N |
| Modal/Drawer | `radius:'lg', centered:true` (Modal) | §11 mobile gate, own bottom-sheet/anchored logic | N — governed by `MantineModal`/`MantineDrawer`/`ResponsiveBottomSheet`, not a raw theme width |
| Popover/Menu | `radius:'xl'/'2xl', shadow:'lg'` | §6l Dropdowns | N — anchored, content-driven width per Task 530 (no fixed-width rule) |
| Table | `verticalSpacing/horizontalSpacing` etc. | §6b CRM card-wrapped | N — table naturally fills its container (correct, matches §6b) |
| Tabs | `color:'brand'`, **`fullWidth` NOT set**, `list.flexWrap:'nowrap'` | §6c — content-width desktop, single-row | N — already correct, explicitly the reference case cited in the kickoff itself; untouched |
| Alert | `radius:'xl', variant:'light'` (Task 532) | §6l Alerts — full-width banner by nature | N — Alert's own root has no `maw`, correctly fills its container |
| Pagination/PaginationNext/PaginationPrevious | `color:'brand', radius:'lg', gap:'xs'` (Task 533); shed-to-fit logic lives in `MantinePagination` (Task 535), not `theme.ts` | §6l Pagination — content-width cluster | N — deliberately size-agnostic per Task 533/535's own explicit decision |

**Conclusion: zero `theme.ts` changes.** Every primitive is either already explicitly content-width (Tabs,
SegmentedControl — both with an in-file comment recording the decision) or naturally content-width by not
setting any viewport-level width override. This is the kickoff's own documented valid outcome: *"If the audit
finds nothing to change beyond the shell, that is a valid outcome — the audit table is the deliverable."*
`theme.ts` has ZERO diff lines this session (confirmed: not in the final `git status`).

## Required after-behavior A — all 23 story files updated

`Alert, Avatar, Badge, Button, Card, Checkbox, Drawer, DropdownMenu, Label, Modal, NavigationMenu, Pagination,
PasswordInput, Popover, Radio, SegmentedControl, Select, Switch, Table, Tabs, TextInput, Textarea, Tooltip`
(23/23) — each had its outer `<Box p="xl">`/`<Box px={{base:'md',sm:'xl'}} py="md">` swapped for
`<MantineStoryShell>…</MantineStoryShell>`, and `Box` removed from the `@mantine/core` import where it became
unused (22/23 files — `Avatar.stories.tsx` keeps the `Box` import since it uses TWO inner `<Box w="100%">`
elements for its composite-cell sections, untouched). Every story's STATE sections (resting/error/disabled/
loading/empty/long-label), `storyT()` i18n calls, single `Default` export, and `skipCanvas`+`fullscreen`
parameters are unchanged — only the outer layout wrapper.

## Positive flow verification

1. **≥640 (768/1024/1440/1920/2560):** confirmed rendered — every sampled story shows a centered content
   column on gray-50 background, capped at 1536px, white card chrome around the demo. Screenshot
   `mantine-primitives-textinput--default__en__1920.png` shows the exact TailAdmin card-on-gray layout.
   `mantine-primitives-tabs--default__en__1920.png`/`768.png` etc. confirm consistency across primitives.
2. **<640 (320/375/390):** confirmed full-bleed, no card, no gray bg — `mantine-primitives-textinput--
   default__en__320.png` is pixel-for-pixel the same layout as before this task (full-width inputs, no side
   margin beyond the existing 16px gutter).
3. **Locale switch:** the shell renders no user-facing strings itself (JSDoc-documented); all i18n flows
   through unchanged from each story's own `storyT()` calls — `check:i18n` 2065/2065 parity confirms no drift.

## Negative flow verification

- **Long uk/it label at 320 in the column:** confirmed via the full rendered gate (365/368 PASS, includes every
  locale × 320/375/390 cell for every story) — no clip, no h-scroll.
- **Overlay trigger at <640:** Drawer/Modal/Popover/DropdownMenu/NavigationMenu/Tooltip stories all PASS the
  gate's scripted-open-and-assert checks at mobile viewports (bottom-sheet contract intact, unaffected by the
  shell).
- **Overlay trigger at ≥640:** Drawer verified via direct measurement (above) — the shell's `max-width` does
  NOT clip the portal-rendered popup.
- **Empty/loading/error/disabled STATE sections:** every story's existing state sections render unchanged
  (visually confirmed in the curated screenshots — e.g. TextInput's error/disabled sections both visible and
  correctly styled inside the new column).
- **Missing §6m value:** did not occur — the live-measurement + zip-cross-check method (above) produced an
  unambiguous, cited value; no STOP-and-ASK was needed.
- **theme.ts change would break <640 full-width:** did not occur — zero theme.ts changes were made (audit
  concluded no change was justified).

## Mobile <640 full-width gate (clause 11)

Every primitive stays full-width at `max-sm` — confirmed by construction (the shell's `<640` path is
byte-identical to the pre-existing wrapper) AND by the full 365/368 PASS rendered gate run (no h-scroll, no
offscreen-control, no text-clipped cells at 320/375/390 for any of the 23 stories, aside from the 3
pre-existing, unrelated Tabs scroll-tabs ambiguous cells present since before this task).

## TailAdmin conformance gate (clause 16)

Every value in §6m cites its source (zip `--breakpoint-2xl`/`--color-gray-50` custom properties, live
cross-check, existing §6 Card row for chrome). Rendered proof side-by-side: `tailadmin-live-content-column-
probe-2560.png` / `tailadmin-live-alerts-content-column-2560-full.png` (the live TailAdmin reference showing
the capped/centered/card-on-gray layout) vs. `mantine-primitives-textinput--default__en__1920.png` (this
project's story, now matching). `tsc=0`/gates green are baseline only — the rendered side-by-side is the style
proof.

## Planted-violation proof — TWO attempts, both documented honestly

**Attempt 1 (did NOT trigger a FAIL — a genuine negative result, recorded not hidden):** shrank the shell's
middle `Box` to `maw={{ base: 280, sm: 1536 }}` (forcing a narrow max-width even at mobile, which should
visually break the P0 full-width gate). Rebuilt, re-ran the gate: **0 FAIL** (AMBIGUOUS count rose from 3 to 8
— more Tabs cells flagged ambiguous-offscreen due to the narrower content, but no hard FAIL). Root cause: the
gate's `fullWidthControlsAtMobile` assertion checks whether a control fills ITS OWN immediate container, not
whether that container fills the viewport — since `mx="auto"` centers a self-consistent 280px-wide column and
everything inside it correctly fills THAT 280px, the assertion technically passes. This is a genuine limitation
of the automated gate worth recording (per `storybook-governance.md §14.9.7`'s established "gate limitation"
pattern from Task 529): the gate is a control-fills-container check, not a container-fills-viewport check.

**Attempt 2 (succeeded — proves the gate IS real for actual overflow):** changed the violation to
`miw={{ base: 900, sm: 0 }}` (forcing a MINIMUM width wider than the 320-390px mobile viewports, guaranteeing
horizontal overflow rather than shrinkage). Rebuilt, re-ran:
```
npm run screenshots:assert -- --mantine-only
  Results: 92/368 PASS, 276 FAIL, 0 AMBIGUOUS
  ✗ horizontal overflow detected + offscreen-control across nearly every story × every mobile viewport × every locale
    (e.g. Textarea/Tooltip/TextInput/… at 320/375/390 × sq/en/uk/it)
```
Full FAIL manifest (sample): `docs/sessions/assets/task536/planted-violation/fail-transcript-manifest.json`.
Representative FAIL screenshot: `docs/sessions/assets/task536/planted-violation/
mantine-primitives-textinput--default__uk__mobile-320.png`.

Reverted both changes (shell restored to plain `maw={{ base: '100%', sm: 1536 }}`), rebuilt, re-ran the gate:
**365/368 PASS, 0 FAIL, 3 AMBIGUOUS** (pre-existing Tabs, unrelated) — confirmed on the final run, working tree
restored to exactly the intended state (`tsc=0`, `git diff` on the shell file shows only the documented final
version).

## Gates (all green, final clean run)

```
npx tsc --noEmit                     → 0 errors
npm run check:stories                → PASSED, 97 files, 0 violations, storybook.* 500/500 parity
npm run check:i18n                   → PASSED, 4 locales, 2065 keys, parity OK (no new keys needed)
npm run check:mojibake               → 0 artifacts, 1533 files
npm run check:design-tokens:strict   → 0 violations, 391 files scanned (the shell's `maw={{…, sm: 1536}}` bare
                                        number is a typed Mantine style-prop value, not flagged as raw hardcode)
npm run check:file-integrity         → PASSED, 160 files clean
npm run build-storybook              → built in 40.65s (final clean build)
npm run screenshots:assert -- --mantine-only → 365/368 PASS, 0 FAIL, 3 AMBIGUOUS (pre-existing Tabs, unrelated)
```

## AC-by-AC self-audit

| # | AC | Status | Evidence |
|---|----|--------|----------|
| 1 | §6m row added, every value cited to a zip token/class | ✅ | `tailadmin-style-reference.md` §6m; extraction methodology above |
| 2 | Single-source `_MantineStoryShell` consumed by all 23 stories, no per-story duplicate | ✅ | 23/23 files import `MantineStoryShell`; `grep -l` confirms |
| 3 | ≥640 constrained gray-page+card column; <640 full-bleed full-width | ✅ | Positive steps 1–2; rendered screenshots at 320/768/1920/2560 |
| 4 | Overlay triggers in-column, popups unchanged, no column clip | ✅ | Drawer right-edge=1920px measurement; gate PASS on all 7 overlay stories |
| 5 | theme.ts audit table present, only justified changes, Tabs untouched | ✅ | Audit table above; `theme.ts` has zero diff lines this session |
| 6 | Rendered `--assert` matrix (uk@320/375/390) + side-by-side TailAdmin proof + gates green + planted-violation FAIL | ✅ | 365/368 PASS gate; live-vs-story screenshots; both planted-violation attempts documented |
| 7 | No state/control removed from any story | ✅ | Only outer wrapper changed per file; all inner STATE sections/Stack structure untouched (diff review) |
| 8 | Session log Files Changed + self-validation; no git by Sonnet | ✅ | This file; zero git commands run |

## File-integrity gate (clause 14)

`check:file-integrity` (git-changed + untracked, default scope) → 160 files clean (0 NUL, no BOM, not
truncated): all 23 story files, `_MantineStoryShell.tsx`, `tailadmin-style-reference.md`,
`mantine-responsive-design-system.md`, session log + assets.

## Files Changed

| File | Rationale |
|---|---|
| `src/stories/mantine/_MantineStoryShell.tsx` | NEW — single-source TailAdmin content-column shell (§6m). |
| `src/stories/mantine/primitives/Alert.stories.tsx` … `Tooltip.stories.tsx` (23 files) | Outer wrapper swapped from bare `Box` to `MantineStoryShell`; `Box` removed from `@mantine/core` import where no longer used (22/23; `Avatar.stories.tsx` keeps it for 2 inner uses). |
| `docs/tailadmin-style-reference.md` | New §6m row — content-column max-width (1536px), page bg, card chrome, all cited to zip tokens + live cross-check. |
| `docs/mantine-responsive-design-system.md` | §8.1 rewritten — documents the new `MantineStoryShell` requirement for all `Mantine/Primitives/*` stories, cites §6m as source of truth; `Patterns/Mantine/*` admin-surface stories explicitly noted as unchanged/out of this task's scope. |
| `docs/backlog.md` | Last Session + Sprint 40 status updated. |
| `docs/sessions/2026-07-03-task536-mantine-story-constrained-content-column.md` | This file. |
| `docs/sessions/assets/task536/*` | §6m extraction probe screenshots, rendered gate PNGs (representative set: Tabs/TextInput/Button/Select/Table/Drawer/Badge), Drawer-opened portal-verification screenshot, live TailAdmin reference screenshots. |
| `docs/sessions/assets/task536/planted-violation/*` | Both planted-violation attempts' evidence (the 0-FAIL negative result manifest data folded into the session log text; the 276-FAIL transcript + representative screenshot saved as files). |

**Not touched this task:** `src/design-system/mantine/theme.ts` (audit concluded zero changes justified — see
table above), `Patterns/Mantine/*` admin-surface stories (out of scope, still use the plain gutter Box per
§8.1's unchanged admin-pattern rule), any primitive's chrome (border/radius/focus/shadow/font — Tasks 528–535's
work is completely untouched, this task changed layout width only).

**Reverted, not part of this diff:** `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md`
(auto-regenerated side effect of the required gate command, restored to HEAD in-session, same as every prior
Sprint 40 task).

**Self-validation:** `tsc=0` · `build-storybook=passes` · `AC=all 8 green` · `runtime uk@320/375/390 PASS`
(rendered gate) · `scope=clean` (git status matches exactly the Files Changed table above).

**Emitting NO `git add`/`git commit`** — no mutating git command was run this session.
