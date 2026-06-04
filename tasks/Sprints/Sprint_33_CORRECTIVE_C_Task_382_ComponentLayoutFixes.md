### Task 382 — CORRECTIVE C: Component-layout fixes — Tabs left-clip, Select full-width, AdminLayout/RVS vertical stack, RVS scrollbar, Skeleton responsive

> # 🔴 Depends on Tasks 380 + 381 implemented AND orchestrator rendered-reviewed. These are the rendered defects
> the Sprint 32 primitive tasks missed. Each fix is GLOBAL (primitive/canonical, not a per-story patch) and must
> hold full-width at <640 across all breakpoints × sq/en/uk/it. Owner re-stated: full-width on EVERY screen <640.

Type:      corrective UI/layout bugfix — primitives + canonical layout
Priority:  CRITICAL
Area:      `src/components/ui/tabs.tsx` · `src/components/ui/select.tsx` · `src/stories/AdminLayout.stories.tsx`
           (+ the real AdminToolbar layout if the defect is in product code — STOP&ASK if so) ·
           `src/modules/listings/components/RecentlyViewedGrid.tsx` + `RecentlyViewedSection` story ·
           `src/components/ui/skeleton.tsx` + `skeleton.stories.tsx`

## Required pre-read
`docs/agent-contract.md` (11, 12, 13) · `docs/backlog.md` · `docs/design-system.md` (§12a height ladder, §12b Tabs
single-style, §14 Dialog/Sheet bottom-sheet, container/gutter tokens) · `docs/ui-rules.md` · `docs/component-rules.md`
· `docs/tailwind-canonical-fragments.md` · `docs/qa-rules.md` · Task 380/381 session logs.

## Current broken behavior (file evidence + rendered)
1. **Tabs left-clip + not full-width at 320.** `tabs.tsx:26` list = `inline-flex w-fit max-w-full overflow-x-auto
   justify-center … max-sm:flex max-sm:w-full no-scrollbar`. At 320 the centred scroll origin clips the FIRST tab
   on the left (screenshot: "…i Oholoshennia" cut off) and the list is not truly edge-to-edge.
2. **Select trigger** not `max-sm:w-full`; long localized label clipped by the chevron; canonical internal padding/
   height (§12a `h-11`) not held (screenshot: "Successfully resolved after revie‹clip›").
3. **AdminLayout toolbar** header + search do not stack vertically at <640 → search input overflows the right edge
   (screenshot it@320). Must stack to full-width rows below the toolbar breakpoint.
4. **RecentlyViewedSection**: (a) header "Parë kohët e fundit" + "Pastro historikun" do not stack → header wraps to
   4 cramped lines at 375; (b) the story shows a visible horizontal scrollbar ("scrollbar visible in story for QA")
   — owner rejects: use `no-scrollbar` (production already does) so the row scrolls without visible chrome.
5. **Skeleton** uses hardcoded pixel widths in stories instead of canonical responsive width tokens.

## Required after behavior
1. **Tabs (primitive):** at `<640` the list is full-width edge-to-edge with the scroll origin at the **start**
   (no `justify-center` on mobile), the first tab never clipped; long labels wrap or scroll from the left; ≥44px
   targets; desktop underline behavior unchanged. Apply once in `tabs.tsx` so ALL Tabs consumers inherit it.
2. **Select (primitive):** `SelectTrigger` is `max-sm:w-full` with the §12a height (`h-11` default) and canonical
   horizontal padding; the value area truncates with the chevron reserved (no overlap); long localized labels do
   not clip the trigger. Fix in `select.tsx` so all consumers inherit. (Compose with the 379 bottom-sheet popup —
   do not revert it.)
3. **AdminToolbar / AdminLayout:** at `<640` the title row, count, search, and filter stack **vertically**, each
   full-width, no horizontal overflow at 320. If the defect is in product `AdminToolbar`/`AdminPageShell` runtime
   (not just the story), fix it there canonically (STOP&ASK if the surface is ambiguous); the story must then
   demonstrate the corrected behavior.
4. **RecentlyViewedSection:** header stacks vertically at `<640` (title above the "Pastro historikun" action,
   each full-width, title wraps cleanly — no 4-line cramped break); the horizontal card row uses `no-scrollbar`
   (no visible scrollbar) in BOTH the story and production grid; horizontal scroll still works by drag/swipe.
5. **Skeleton:** widths come from canonical responsive tokens / `w-full` + max-width, not hardcoded px; renders
   without overflow at 320 across locales.

## Exact files allowed to edit
`src/components/ui/tabs.tsx`, `src/components/ui/select.tsx`, `src/components/ui/skeleton.tsx`,
`src/modules/listings/components/RecentlyViewedGrid.tsx` (+ its story), `src/stories/AdminLayout.stories.tsx`,
`skeleton.stories.tsx`, and — ONLY if the AdminToolbar/RVS defect is in product code — the specific canonical
layout component (STOP&ASK before touching a broad admin surface). `messages/*` only for new keys (parity).
`docs/design-system.md`/`docs/ui-rules.md` if a canonical rule needs documenting. `docs/backlog.md`, session log.

## Current behavior to preserve
Desktop (≥640) appearance of Tabs/Select/AdminLayout/RVS/Skeleton; the 379 bottom-sheet popup model for Select;
the 372 single-underline Tabs style; RVS desktop grid; all existing interactive controls (no silent removal).

## Positive flow
At uk@320/375/390 (and sq/en/it): Tabs full-width, first tab visible, labels wrap/scroll from start; Select
trigger full-width, label not clipped, h-11; AdminToolbar stacks vertically, no overflow; RVS header stacks,
no visible scrollbar, cards scroll by drag; Skeleton no overflow.

## Negative flow
- Tabs at 320: first tab NOT clipped (regression guard). - Select nothing selected → placeholder, full-width.
- AdminToolbar at 320: no horizontal scrollbar (`scrollWidth==clientWidth`). - RVS: scrollbar chrome hidden but
  keyboard/drag scroll still reaches the last card. - Skeleton: no fixed px causing 320 overflow.
- Any change that breaks the 379 Select bottom-sheet or the 372 Tabs underline → STOP&ASK, do not proceed.

## Acceptance criteria
- AC1 `tabs.tsx`: mobile full-width, start-aligned scroll, no left clip — file:line + rendered uk@320/375/390 (PNG).
- AC2 `select.tsx`: `max-sm:w-full` + h-11 + canonical padding + chevron reserve — file:line + rendered (PNG), long label not clipped.
- AC3 AdminToolbar/AdminLayout vertical stack at <640, no 320 overflow — file:line + rendered (PNG); STOP&ASK logged if product code touched.
- AC4 RVS header vertical stack + `no-scrollbar` in story+grid; drag-scroll reaches last card — file:line + rendered (PNG).
- AC5 Skeleton responsive widths, no 320 overflow — file:line + rendered (PNG).
- AC6 `responsive-screenshots --assert` green for tabs/select/AdminLayout/RVS/skeleton at all required cells; no
  regression to other consumers of the edited primitives (re-assert button/dialog/sheet etc.).

## Out of scope
De-hardcoding content (381 — but do not REINTRODUCE any literal here; gates apply); the final 26×9 sweep (383);
new components. NO Combobox/Button single-source divergence (edit the canonical primitive, never clone).

## Required validation
`npx tsc --noEmit` · `npm run lint` · `npm run check:i18n` · `npm run check:stories` · `npm run build-storybook` ·
`responsive-screenshots --assert` · AC self-audit · rendered matrix (uk@320/375/390 mandatory).

## Required Sonnet evidence format
Sprint 33 standard: machine-produced screenshots are the proof. Report = AC table (file:line + PNG ref per cell) +
command transcript + grep gates + rendered matrix + STOP&ASK log (esp. any product-code touch) + Files Changed
table. INCOMPLETE if any required rendered cell is NOT CHECKED. NO `git add`/`commit`.
