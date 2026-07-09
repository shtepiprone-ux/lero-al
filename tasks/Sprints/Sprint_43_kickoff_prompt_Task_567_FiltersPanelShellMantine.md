# Task 567 — `FiltersPanel` shell → Mantine (`MantineDrawer` + Mantine `Button`/`TextInput`)

**Type:** UI / component migration (product code). **Executor:** Sonnet 4.6.
**Sprint:** 43 (FiltersPanel/HeroSearch → Mantine). **Depends on:** Task 566 (leaf sub-components —
✅ approved). **Origin:** Epic MM Phase-2 composite migration. **This is a presentational swap only —
the Task 556/566 precedent: swap the primitives, keep 100% of the filter logic, the URL-param contract,
the `useHomepageFilters` hook wiring, and the public Props API byte-identical.**

The three leaf components (`FilterRangeInputs`/`FilterMultiToggle`/`FilterRoomsRow`) were migrated in Task
566 and are consumed here UNCHANGED. This task migrates only the **shell** of
`src/components/shared/FiltersPanel.tsx`: the overlay, the close affordance, the property-type + market-type
toggle grids, the listing-id input, and the Apply/Reset footer.

---

# 🔴 ROUND-2 CORRECTIVE — owner REJECTED the round-1 implementation (2026-07-09)

> **STATUS: round-1 was REJECTED by the owner. This is NOT a fresh task — the round-1 diff is on the
> working tree (see Files-Changed in `docs/sessions/2026-07-09-task567-filterspanel-shell-mantine.md`).
> Fix the four defects below ON TOP of it. This corrective section SUPERSEDES §2 (header), §4 (market grid),
> and §6 (footer) of the original spec wherever they conflict; everything else in the original spec still holds.**

**Owner's core complaint (act on it, not just the symptoms):** the round-1 gates were all GREEN while four
real visual defects shipped — the automated gates did NOT catch them. So this task fixes the four defects
**AND** strengthens the gates so each defect FAILS a check. A green matrix that cannot detect these four
regressions is itself a defect. **The owner rejects "all gates green" as proof; you must prove each gate
FAILS on the reintroduced defect (four planted-violation transcripts, one per fix — see "Strengthened gates").**

**Owner scope decisions (locked 2026-07-09, second round):** all three primitive-level forks were chosen
CANONICAL — do the fixes in the shared primitives, not one-off in `FiltersPanel`:
- Header divider + always-visible footer → in the canonical **`MantineDrawer`** / `responsiveBottomSheet`.
- Count-on-button → a new **canonical Button-with-count primitive**.
- No-word-break + wrap → **global `theme.ts` Button** fix + `FiltersPanel` layout.
Because these touch shared primitives, you MUST re-verify every consumer for regression (blast radius is
scoped below per fix). **Do NOT run git — HELD for orchestrator review.**

## Fix 1 — Button labels must NEVER split a word mid-character; rows wrap to the next line, never squeeze

**Symptom (owner screenshot):** in the market-type row the words `Вторинна`/`Новобудова` render as
`Вторин|на` / `Новобу|дова` — split mid-word — because three `flex-1` buttons are crammed too narrow and the
label breaks inside the word.

**Root cause:** `src/design-system/mantine/theme.ts:219` sets the Button `label` to
`{ whiteSpace: 'normal', overflow: 'visible', wordBreak: 'break-word' }`. `wordBreak: 'break-word'` breaks
mid-word; combined with the `flex-1` squeeze the words split.

**Global theme fix (`theme.ts` Button `label`, ~line 219):** change to
`{ whiteSpace: 'normal', overflow: 'visible', wordBreak: 'normal', overflowWrap: 'break-word' }`.
- `wordBreak: 'normal'` → a word is NEVER split mid-character in normal cases (wraps only at spaces).
- `overflowWrap: 'break-word'` → a single token is broken ONLY as a last resort when it alone can't fit its
  line (prevents h-scroll at 320 for a pathological long word) — this is the allowed exception, not the rule.
- **Blast radius = every Mantine `Button`.** Re-verify (rendered): no existing button label clips or overflows
  and long sq/en/uk/it button labels still wrap cleanly. This is the global no-mid-word-break rule the owner
  asked for.

**`FiltersPanel` layout fix — market-type row must WRAP, not squeeze (supersedes original §4 layout):**
- Change the row wrapper from `flex flex-col sm:flex-row gap-2` to
  **`flex flex-col sm:flex-row sm:flex-wrap gap-2`**.
- Each market `<Button>`: **`w-full sm:w-auto`** (NOT `flex-1`). `<640` → full-width stacked (clause-11 ✓);
  `≥640` → content-width, and when the three no longer fit the drawer (`size="sm"`) width they **wrap to the
  next line** instead of shrinking until the word breaks. Drop `flex-1`.
- Property-type grid stays `grid grid-cols-2 gap-1.5` (2 columns fit their single-word labels); the global
  theme fix covers the pathological-long-label case there. Do NOT force it to wrap-per-item.
- **Zero invented px.** No hardcoded `min-w-[NNpx]`. If you believe a min-width is unavoidable → STOP and ASK.

## Fix 2 — Drawer header needs the canonical gray bottom border (so the header end is visible)

**Symptom:** the header (`advanced_filters` + badge) blends into the body — no visual boundary.

**Fix — in the canonical `MantineDrawer` / `responsiveBottomSheet` (owner: canonical, all consumers):**
- **Desktop `Drawer` branch (`MantineDrawer.tsx`):** give the Mantine Drawer header a **bottom border** via
  `styles={{ header: { borderBottom: '1px solid var(--mantine-color-gray-3)' } }}` — the SAME divider token
  the canonical `MantineResponsiveActionFooter.tsx` already uses for its `borderTop` (cite that file as the
  canonical precedent; zero invented value). Render it **only when `title` is truthy** (no orphan border on a
  title-less drawer).
- **Mobile bottom-sheet branch (`responsiveBottomSheet.tsx`, `bottomSheetDrawerStyles.header`):** the header
  currently is `{ paddingBottom: 0 }`. Add the same `borderBottom: '1px solid var(--mantine-color-gray-3)'`
  **only when a `title` is present** (the drag-handle-only sheets — Select/Popover/Menu/Nav options lists that
  pass NO title — must NOT gain a stray divider). Keep the drag handle above the title, divider below the
  title block.
- **TailAdmin trace / STOP-and-ASK:** `var(--mantine-color-gray-3)` is the established canonical divider
  (used by `MantineResponsiveActionFooter`, `DragHandle`, and the body `divide-border`). Prove it matches the
  TailAdmin reference header/card divider side-by-side. If it visibly mismatches a `tailadmin-style-reference.md`
  §-row divider, STOP and ASK — do NOT invent a different gray.
- **Blast radius = every `ResponsiveBottomSheet` consumer** (Select, Popover, DropdownMenu, NavigationMenu,
  Combobox, Tooltip, Modal-if-shared) **+ every `MantineDrawer` consumer.** Re-verify rendered at mobile +
  desktop that: title sheets show ONE clean divider, title-less sheets show NONE, no layout shift.

## Fix 3 — Active-filter count sits INLINE to the right of the label (like a left icon), via a canonical primitive

**Symptom:** the count is an absolute-positioned corner badge (`position:absolute -top-1.5 -right-1.5`) — a
hack forced by Mantine Button's `overflow:hidden` root. The owner wants it **inline, to the right of the
label, with canonical spacing — exactly like a `leftSection` icon is spaced on the left** — and notes "a
button primitive of this type is missing."

**Fix — create a new canonical primitive `MantineCountButton`** (owner: canonical, reusable):
- File: `src/design-system/mantine/patterns/MantineCountButton.tsx`; export from `patterns/index.ts`.
- API: `interface MantineCountButtonProps extends ButtonProps { count?: number; onClick?: ... }` (forward all
  Mantine `ButtonProps` + native button attrs). When `count && count > 0`, render the count in the Button's
  **`rightSection`** as a Mantine `Badge` (the count is spaced by Mantine's own `rightSection` gap — the SAME
  mechanism that spaces a `leftSection` icon, which is precisely what the owner asked for). When `count` is 0
  / undefined, render NO `rightSection` (unless the caller passed one).
- Badge chrome from `tailadmin-style-reference.md` §-row "Status badge" (line ~74):
  `text-theme-xs rounded-full … font-medium` → Mantine `Badge size="sm"` circular/pill. On the **filled brand**
  Apply button the count must stay legible — pick the §-cited badge treatment that reads on brand fill (e.g. a
  white/`brand.0` chip with `brand.7` text, or the inverse). **Prove legibility side-by-side vs the reference;
  if no clean §-row gives a legible on-brand count chip, STOP and ASK — do NOT invent a color.** Because the
  count now lives in `rightSection` (a normal flow child), Button's `overflow:hidden` no longer clips it — the
  round-1 absolute-badge hack (and its clipping bug) is fully removed.
- **`FiltersPanel` Apply button** (supersedes original §6 Apply markup): replace the
  `<div className="relative"><Button …/>{activeCount>0 && <span className="absolute …">}` block with
  `<MantineCountButton fullWidth count={activeCount} onClick={handleApply}>{t('apply_filters')}</MantineCountButton>`.
  Delete the absolute corner `<span>` and the `relative` wrapper entirely.
- Add a persisted story (`Mantine/Primitives/CountButton` or the harness-matching prefix) + an RTL smoke for
  the primitive (count present → badge in `rightSection`; count 0 → no badge). Story fixtures via `storyT`
  with full sq/en/uk/it parity if any new fixture string is needed.

## Fix 4 — Footer buttons must be ALWAYS visible (pinned), never scroll away

**Symptom + why it hid the other bugs:** `MantineDrawer` renders `footer` INSIDE the scrollable body
(`<Stack><Box>{children}</Box>{footer}</Stack>`), so Apply/Reset scroll off-screen. The rendered gate then
never captured the footer — which is exactly why the round-1 gate stayed green while the Apply badge was
clipped. Pinning the footer both fixes the UX and makes the footer capturable by the gate.

**Fix — pin the footer in the canonical `MantineDrawer` (owner: canonical):**
- **Required result (spell out; the mechanism is yours but the outcome is fixed):** on BOTH forms — desktop
  side `Drawer` and mobile bottom sheet — the body scrolls while the **footer stays fixed at the bottom of the
  overlay, always visible**, with a **top border `1px solid var(--mantine-color-gray-3)`** (same canonical
  divider token) and a solid overlay background (so scrolling content doesn't bleed through). Reuse the
  `MantineResponsiveActionFooter` sticky + `borderTop` treatment as the canonical chrome source; do NOT invent
  new values.
  - Desktop branch: make `.mantine-Drawer-body` a flex column filling the drawer height; `children` go in a
    `flex:1; overflow-y:auto` scroll region; `footer` is a non-shrinking sibling pinned below it.
  - Mobile branch (`responsiveBottomSheet` / `bottomSheetDrawerStyles`): the sheet column is
    [drag-handle+title header] → [scrollable body `flex:1; overflow:auto`] → [pinned footer]. The `footer`
    must move OUT of the scrollable body region so it is always visible while the body scrolls; keep the
    ≤`90dvh` clamp and internal body scroll intact.
- **Blast radius:** in product code, **only `FiltersPanel` passes `footer` to a `MantineDrawer`** (grep-
  confirmed: `Modal.stories`/`Drawer.stories` are stories). Re-verify the two stories + `FiltersPanel` render
  correctly; a Drawer with NO `footer` must be visually unchanged (no empty pinned bar).
- If pinning the footer requires a structural change to `ResponsiveBottomSheet` that would affect title-less
  sheets, STOP and ASK before altering their layout.

## Strengthened gates (owner P0 — the round-1 gates did NOT catch these; make them real)

For EACH of the four fixes, add an automated check AND prove it FAILS on the reintroduced defect
(four planted-violation transcripts, reverted → green). "All gates green" is NOT proof by itself.

1. **No mid-word break / footer visible — rendered DOM probe** (the same Playwright/DOM-probe technique used
   in round-1 to catch the badge clip): at uk@320 and one desktop width, assert (a) the pinned **footer's
   bounding-box bottom ≤ the overlay viewport bottom after the body is scrolled to the end** (footer visible);
   (b) **no toggle `<button>` has `scrollWidth > clientWidth`** (no clipped/overflowing label) and labels wrap
   only at spaces. Planted violation: revert the market row to `flex-1` squeeze → probe FAILS.
2. **Header divider — RTL/DOM assertion:** the drawer header (when `title` present) has a bottom border; a
   title-less sheet has none. Planted violation: remove the `borderBottom` → assertion FAILS.
3. **Count inline, not absolute — RTL assertion:** the count `Badge` is a descendant of the Apply `<button>`
   (in `rightSection`), and the Apply button has NO absolutely-positioned count child. Planted violation:
   reintroduce the absolute corner `<span>` → assertion FAILS.
4. **Footer separated from scroll region — RTL structural assertion:** the `footer` node is NOT a descendant
   of the scrollable body container (give the scroll region + footer stable markers/`data-testid` to assert
   against). Planted violation: move `footer` back inside the scroll `<Stack>` → assertion FAILS.

Paste all four planted-violation → revert transcripts into the session log. Extend the existing
`filtersPanelShell.smoke.test.tsx` (+ the new `MantineCountButton` smoke) rather than inventing a new suite.

## §18.9 human-visual set — REQUIRED to close (round-1's set missed all four; capture these explicitly)

Human-inspected screenshots at **uk@320/375/390 (mandatory) + sq@320 + it@320 + en@1280**, each proving ALL
four fixes at once: (a) NO word is split mid-character in any toggle button (market row wraps whole buttons to
the next line); (b) a clean gray divider under the header title; (c) the Apply count sits **inline to the
right of the label** with canonical spacing (not a corner badge); (d) **scroll the sheet body to the bottom
and confirm Apply/Reset stay pinned and fully visible**. A set that does not include the scrolled-to-bottom
footer frame is INCOMPLETE.

---

## Owner decisions (2026-07-09, locked for this task)

1. **Overlay → `MantineDrawer`** (canonical, `src/design-system/mantine/patterns/MantineDrawer.tsx`), NOT
   the legacy `ui/sheet`. `side="right"`, `size="sm"` (≈ the legacy `max-w-sm` ~384px). `<640` it is the
   single-source full-width bottom sheet automatically (drag handle + backdrop + Esc).
2. **Close affordance = the Drawer's BUILT-IN close** (desktop X / mobile drag-handle, plus backdrop + Esc).
   **DROP the custom header `Button variant="ghost" size="icon"` X.** The "advanced_filters" heading + the
   active-count badge move into the Drawer `title` slot. (This is a clause-4 relocation: the close control is
   not removed — it is replaced by the canonical MantineDrawer affordance in the same task. Document it.)
3. **Property-type + market-type selected toggle = SOFT TINT preserved** (owner: keep these single-select
   grids visually distinct from the Task-566 multi-select filled chips). Use Mantine `Button
   variant="light"` (theme brand — light tint bg + brand text, **theme-derived, zero invented hex**) for the
   selected chip; `variant="default"` (§6a bordered) for unselected. **Do NOT hand-roll
   `bg-primary/10 text-primary border-primary/30`** on a Mantine Button. If `variant="light"` does not render
   as the intended soft-selected state (clearly softer than a `filled` chip, clearly distinct from
   `default`), **STOP and ASK** — do not invent a tint.

## Current state — read `src/components/shared/FiltersPanel.tsx` in full first (409 lines)

Legacy primitives still in the shell (everything else — `LocationCombobox`, `YearCombobox`,
`RangeDatePicker`, and the 3 leaf components — is already Mantine and MUST NOT be touched):

| Location | Legacy primitive | Lines |
|---|---|---|
| Overlay | `Sheet` / `SheetContent` (`@/components/ui/sheet`) | 69–75, 406–407 |
| Header close-X | `Button variant="ghost" size="icon"` (`@/components/ui/button`) + `X` icon | 87–89 |
| Property-type grid | `Button variant="outline"` ×N in `grid grid-cols-2 gap-1.5`, custom selected className | 110–134 |
| Market-type grid | `Button variant={default\|outline} size="lg"` ×N in `flex flex-col sm:flex-row`, `flex-1` | 141–161 |
| Listing-id search | `Input` (`@/components/ui/input`) `className="h-10 rounded-xl"` | 378–384 |
| Apply / Reset footer | `Button size="xl"` ×2, `w-full` | 392–403 |

**Frozen — do NOT change (logic + all already-Mantine children):**
- `useHomepageFilters(...)` and everything it returns (`local`, `update`, `handleApply`, `handleReset`,
  `handlePropertyTypeChange`, `activeCount`, `shows`, `floorFilterMin`, `today`, `propertyTypes`,
  `cityRegionLocs`). Every `update({...})` / `handle*` call site stays byte-identical.
- `usePerformanceTier()` + `useIdleMount(tier==='low', open)` → `contentReady` idle-mount gating (LOW-tier
  perf optimization). Keep the inner content gated behind `{contentReady && …}` exactly as today.
- Every `shows('…')` section-visibility conditional, every section's `SectionHeader`, the whole Location /
  Price / Area / Rooms / Floor / Floors-total / Year / Condition / Layout / Heating / Wall / Offer /
  Purchase / Period / ID section body.
- The three leaf components (`FilterRangeInputs`/`FilterMultiToggle`/`FilterRoomsRow`) and their props.
- `FiltersPanelProps` (`open`, `onClose`, `values`, `onChange`, `onApply`, `locations`) — public API
  byte-identical. `ListingsFilters.tsx` does NOT consume `FiltersPanel` (it composes the same leaves
  directly); only the homepage mounts `FiltersPanel`. Confirm via grep — expect zero consumer edits.

## Required after-behavior (spell it out — no invention)

### 1. Overlay: `Sheet`/`SheetContent` → `MantineDrawer`
Replace the `<Sheet …><SheetContent …>…</SheetContent></Sheet>` wrapper with:
```tsx
<MantineDrawer
  opened={open}
  onClose={onClose}
  side="right"
  size="sm"
  title={/* heading + activeCount badge — see §2 */}
  footer={/* Apply + Reset — see §6 */}
>
  {contentReady && (
    /* the scrollable section stack — Location … ID, unchanged bodies */
  )}
</MantineDrawer>
```
- `MantineDrawer` already owns: desktop side-drawer chrome (`position="right"`, `size="sm"`), the built-in
  close X, the `<640` full-width bottom sheet (drag handle, ≤90dvh internal scroll, backdrop + Esc). Do NOT
  re-add `overflow-y-auto`/`flex-1`/`max-w-sm`/`p-0` wrappers — the Drawer + `SheetContent` own layout+scroll.
- `aria-label`/accessible name: pass the `t('advanced_filters')` string as the `title` (Mantine Drawer wires
  the title as the dialog's accessible name). If an explicit `aria-label` is still needed, keep it equivalent.
- Keep `onClose` wired to the same handler; backdrop/Esc/X/drag-handle all fire `onClose` (Drawer contract).

### 2. Header → Drawer `title` slot (drop the custom X)
- Move the heading + badge into `title`:
  ```tsx
  title={
    <div className="flex items-center gap-2">
      <span className="font-semibold text-base">{t('advanced_filters')}</span>
      {activeCount > 0 && (
        <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5 font-medium">
          {activeCount}
        </span>
      )}
    </div>
  }
  ```
- **Delete** the `Button variant="ghost" size="icon" onClick={onClose}` + `X` block (lines 87–89) and the
  `X` import if now unused. The built-in Drawer close replaces it (document the replacement in the session
  log's control before/after inventory — clause 4 / Note 21).
- The `<h2>`→`<span>` change inside `title` is fine (Mantine renders the title in its own header region);
  keep it a semantic heading if the Drawer title region does not already provide one.

### 3. Property-type grid → Mantine `Button` (soft-tint selected)
- Keep `<div className="grid grid-cols-2 gap-1.5">`. Each entry a Mantine `<Button type="button">`:
  - `variant={isSelected ? 'light' : 'default'}` (soft-tint selected per owner decision #3),
  - `className="justify-start text-left"` (preserve left-aligned wrapped labels; wrapping height comes from
    the theme default `whiteSpace:'normal'` + `minHeight:44px`),
  - `onClick` identical to today (`handlePropertyTypeChange(undefined)` for "all_types";
    `handlePropertyTypeChange(local.property_type === pt.value ? undefined : pt.value)` for each type).
- `isSelected` = `!local.property_type` for the "all_types" button; `local.property_type === pt.value` for
  each type button — identical predicate to today.
- **Remove** the hand-rolled `py-2 px-3 h-auto text-xs … rounded-xl … bg-primary/10 text-primary
  border-primary/30 font-semibold` classes; the tint now comes from `variant="light"`, the chrome/radius/
  height from the theme (§6a). Do NOT port `rounded-xl`/`h-auto`/`bg-primary/10`.

### 4. Market-type grid → Mantine `Button` (soft-tint selected)
- Keep `<div className="flex flex-col sm:flex-row gap-2">`. Each a Mantine `<Button type="button"
  className="flex-1">`:
  - `variant={isSelected ? 'light' : 'default'}`, `isSelected` = `!local.market_type` (the "all" button) /
    `local.market_type === mt.value`,
  - `onClick` identical (`update({ market_type: undefined })` / `update({ market_type: local.market_type ===
    mt.value ? undefined : mt.value })`),
  - label wraps (`whitespace-normal leading-snug` preserved via className if the theme default is not enough).
- **🔴 Do NOT port `size="lg"`** — Mantine `Button size="lg"|"xl"` is BANNED (Task 520, `check:stories`
  Check 14). Use the default size + `flex-1`; the ≥44px height comes from the theme. Drop `rounded-xl text-xs`.
- Mobile: `flex-col` → each button `flex-1` is full-width stacked (clause-11 compliant, unchanged).

### 5. Listing-id input → Mantine `TextInput`
- Replace `<Input type="text" … className="h-10 rounded-xl" />` with `<TextInput type="text"
  placeholder={t('listing_id_placeholder')} value={local.listing_id ?? ''} onChange={e =>
  update({ listing_id: e.currentTarget.value || undefined })} />`.
- Chrome = §6e from the global `input-chrome.css`/`theme.ts` (`h-11`, `rounded-lg`, border, focus ring,
  `shadow-theme-xs`) — no custom className. Drop `h-10 rounded-xl`. Full-width (block) — no compact exemption.
- **Emit the identical string**: `e.currentTarget.value` (Mantine) === today's `e.target.value`; the
  `|| undefined` mapping stays exactly as today (empty → clears the value).

### 6. Apply / Reset footer → Mantine `Button` (via Drawer `footer` slot)
- Pass to `MantineDrawer`'s `footer`:
  ```tsx
  footer={
    <div className="flex flex-col gap-3">
      <Button fullWidth onClick={handleApply} className="relative">
        {t('apply_filters')}
        {activeCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary
            text-primary-foreground text-2xs flex items-center justify-center font-bold">
            {activeCount}
          </span>
        )}
      </Button>
      <Button variant="default" fullWidth leftSection={<RotateCcw className="h-4 w-4" />}
        onClick={handleReset}>
        {t('reset_filters')}
      </Button>
    </div>
  }
  ```
- Apply = primary CTA → Mantine `Button` default (filled brand) variant, `fullWidth`. Reset →
  `variant="default"` (§6a bordered) `fullWidth`, `RotateCcw` via `leftSection` (NOT a raw child before the
  label). Preserve the absolute active-count badge on Apply exactly.
- **🔴 Do NOT port `size="xl"`** (banned, Task 520). `fullWidth` + theme default height (≥44px) is the
  full-width mobile treatment (clause 11) and the desktop treatment.
- `handleApply` / `handleReset` wiring byte-identical.

### Imports
- **Remove:** `@/components/ui/button`, `@/components/ui/input`, `@/components/ui/sheet`, and `X` (lucide) if
  now unused. **Keep** `RotateCcw`.
- **Add:** `import { Button, TextInput } from '@mantine/core'` + `import { MantineDrawer } from
  '@/design-system/mantine/patterns'` (confirm the export path in `patterns/index.ts`).
- `cn` may still be needed for the property/market className merges — keep only if used.

## Pre-read (rule-index → UI / layout / component task)

- `docs/agent-contract.md` (clauses **1, 3, 4, 5, 7, 11, 12, 16**) + `docs/backlog.md` +
  `docs/critical-flow-registry.md` (the **"Listings filter controls"** row added by Task 566 + the
  **"Listings date-range filter"** row — extend, do NOT invent a new group).
- 🔴 `docs/mantine-responsive-design-system.md` — §7 (mobile gate), §12 (canonical patterns), §15
  (control-height), §16 (gates), **§18 (theming/CSS pitfalls: `input-chrome.css`, `data-error` not
  `data-invalid`), §18.9 (icon/placeholder/overlap + ≥44px touch iron rule)**, §18.8/Drawer content-height.
- 🔴 `docs/tailadmin-style-reference.md` — **§6a (Button chrome, incl. the `light`/soft-selected treatment)
  + §6e (input chrome)**. Every value must trace to a §-row; the soft-tint selected state uses the
  theme-derived `variant="light"` (no invented hex). If §6a has no authoritative row for the tinted/selected
  toggle, note it and prove the rendered result side-by-side vs the theme at review — do NOT invent a value.
- `docs/ui-rules.md` (§15 control-height, §16 z-index, §17 UI pre-flight), `docs/component-rules.md`
  (no raw `<button>/<input>`, Mantine `Button size="lg"/"xl"` banned — Task 520), `docs/qa-rules.md`.
- Reference: `MantineDrawer.tsx` (API above) + the Task 566 session log
  (`docs/sessions/2026-07-09-task566-filter-leaf-components-mantine.md`) + `MantineModal`/`MantineDrawer`
  story precedent (`src/stories/mantine/primitives/Drawer.stories.tsx`) for the persisted-story pattern.

## Mobile <640 full-width gate (clause 11)

- **Overlay:** `MantineDrawer` <640 = single-source full-width bottom sheet (drag handle, backdrop + Esc,
  ≤90dvh internal scroll) — inherited, no extra work. State it explicitly in the session log.
- **Market-type grid:** `flex-col` on mobile → each `flex-1` Button is full-width stacked. ✓ full-width.
- **Apply / Reset footer:** `fullWidth` → both span the sheet edge-to-edge. ✓
- **Listing-id `TextInput`:** block/full-width. ✓
- **Property-type grid — DOCUMENTED COMPACT EXEMPTION (clause 11 compact carve-out, same rationale as Task
  566's chip grids):** a `grid grid-cols-2` of single-select type chips. Forcing each chip to `max-sm:w-full`
  would collapse the 2-col compare-at-a-glance grid to one-per-row. Each chip stays content-width **inside
  the 2-col grid**, WITH: ≥44px touch height (theme `minHeight:44px`), labels wrap (`whitespace-normal`,
  sq/en/uk/it, never clip), **no horizontal scroll at 320** in any locale. List this exemption explicitly.
- ≥44px touch targets everywhere; long sq/en/uk/it labels wrap, never clip. If any pattern reads ambiguous
  at implementation time → **STOP and ASK**, do not guess.

## TailAdmin conformance (clause 16)

- Listing-id input → §6e chrome VERBATIM (via `input-chrome.css`), `h-11`, brand focus ring.
- Apply (filled brand `#EC5447`) / Reset (`variant="default"` §6a bordered) / property + market selected
  (`variant="light"` theme-derived tint) / unselected (`variant="default"` §6a). **Zero invented values** —
  every color/radius/shadow from the theme + §6a/§6e. Rendered side-by-side vs the reference is the only
  style proof; `tsc=0`/gate-green is NOT.
- **§18.9:** the input is never a blank box; the Apply badge never clips or overlaps the label illegibly;
  toggle labels never clip; the Drawer header title + built-in X do not collide.

## Positive flow (happy path)

Actor: user on the homepage opens the filters panel (parent passes `open=true`; HeroSearch is Task 568).
1. **Open:** panel renders as a right side-drawer (≥640, `size="sm"`) / full-width bottom sheet (<640, drag
   handle). Header `title` shows `advanced_filters` + the active-count badge (when `activeCount>0`); the
   Drawer's built-in close (X desktop / handle mobile) is present.
2. **Property type:** clicking a type fires `handlePropertyTypeChange(value)`; the chip becomes soft-tint
   selected (`variant="light"`); re-clicking the active type OR clicking "all types" clears to `all_types`
   (`undefined`) — identical single-select semantics.
3. **Market type:** clicking fires `update({market_type})`; soft-tint selected; "all" clears.
4. **Ranges / rooms / toggles / year / period:** the already-migrated leaf + Combobox + RangeDatePicker
   children behave exactly as before (untouched).
5. **Listing ID:** typing fires `update({ listing_id: value || undefined })` with the identical string;
   §6e chrome + focus ring.
6. **Apply:** clicking fires `handleApply` → `onApply(local)` + `onClose()`; the Apply badge reflects
   `activeCount`.
7. **Reset:** clicking fires `handleReset` → clears ALL filters (existing semantics); panel stays open.
8. **Close** via built-in X / backdrop / Esc / drag-handle dismiss → `onClose()`; the batch-apply draft
   model is unchanged (closing without Apply does NOT mutate the parent `values`).
Success: emitted callback values + open/close/apply/reset behavior byte-identical to the legacy shell; no
layout shift; no clip/h-scroll at 320 in any locale.

## Negative flow (every off-happy-path branch)

- **Empty listing-id** → placeholder shown; emitting `undefined` clears the value exactly as today; no crash.
- **No filters active** → `activeCount===0` → header badge + Apply badge hidden; Reset still renders.
- **LOW performance tier** → `contentReady` idle-mount defers the inner section stack until idle; `open`
  forces it ready on open — preserve verbatim (the `{contentReady && …}` gate stays INSIDE the Drawer).
- **Section hidden** (`shows('x')===false`) → that section is not rendered (domain-driven); unchanged.
- **Long uk/it labels** (property/market/section headers, Apply/Reset) → wrap, never clip, no h-scroll at
  320 across sq/en/uk/it.
- **Backdrop tap / Esc / drag-handle dismiss** → `onClose()` fires, no Apply, draft discarded (existing
  batch model); focus returns to the trigger (Drawer contract).
- **Rapid open/close** → the Drawer is controlled by `open`; no double-mount, no stuck backdrop.
- **Disabled/loading** → not applicable (no consumer passes it); do NOT add a disabled/loading path.

## Regression coverage (clause 15)

Baseline: `src/components/shared/__tests__/filtersRangeDatePicker.smoke.test.tsx` (mounts the REAL
`FiltersPanel`) MUST stay green — record the green baseline BEFORE the change. Add a focused RTL smoke
`src/components/shared/__tests__/filtersPanelShell.smoke.test.tsx` (mounts the REAL `FiltersPanel` open,
with mock `values`/`locations`/handlers) asserting:
1. **Apply** → clicking `apply_filters` calls `onApply` (with the composed `local` values) — the shell CTA
   is wired.
2. **Reset** → clicking `reset_filters` triggers the reset (all filters cleared via the existing
   `handleReset`; assert `onChange`/`onApply` reflect the cleared state per the current semantics).
3. **Property-type** → clicking a type chip updates the selected state (soft-tint / `data-variant="light"`);
   clicking the active one / "all types" clears it.
4. **Market-type** → clicking updates selection; "all" clears.
5. **Listing-id** → typing fires `update` with the typed string (`value || undefined`).
6. **Close** → the Drawer close affordance fires `onClose` (assert via the built-in close or Esc/backdrop).

**Planted-violation transcript** (≥1, reverted → green): e.g. drop the `onClick={handleApply}` wiring on the
Apply button → assertion 1 FAILS (`onApply` 0 calls); revert → green. Extend/annotate the
`docs/critical-flow-registry.md` **"Listings filter controls"** row (shell now Mantine `MantineDrawer` +
`Button`/`TextInput`, smoke-covered) — do NOT invent a new group.

## Rendered evidence (clauses 12/13 + §18.9) — REQUIRED to close

- Add ONE persisted story under **`Mantine/Primitives/FiltersPanelShell`** (or `Mantine/Patterns/*` if that
  matches the harness prefix for `--mantine-only` enforcement — verify against
  `scripts/check-stories-rendered.mjs`; Task 566 used `Mantine/Primitives/*`). Render the REAL `FiltersPanel`
  **open** with a mock `values`/`locations`/handlers dataset so the Drawer chrome, header title+badge, both
  toggle grids (with 1 selected each to prove the soft-tint state), the §6e listing-id input, and the
  Apply/Reset footer are all visible. `skipCanvas:true`, `layout:'fullscreen'`, toolbar-driven locale/
  viewport, all fixture strings via `storyT` with full sq/en/uk/it parity (new `storybook.filterspanel.*`
  keys if the panel's own `common.*`/`listing.*` strings are not reusable through the story harness — governance
  §14.2 requires story fixtures come from the `storybook.*` namespace).
- `screenshots:assert -- --mantine-only` green (paste the Phase-0 count line before/after — story count +1).
- 🔴 **§18.9 human-visual set** (geometry gate is BLIND to overlap/clip/touch-size): human-inspected
  screenshots at **uk@320/375/390 (mandatory) + sq@320 + it@320 + en@1280** proving: the Drawer is a
  full-width bottom sheet <640 (drag handle) / right side-drawer at desktop; header title + badge + built-in
  X do not collide; property + market selected chips render the SOFT tint (`variant="light"`, clearly
  distinct from a filled chip and from `default`); listing-id = §6e chrome; Apply/Reset full-width, Apply
  badge legible; ≥44px touch; labels wrapped/not clipped; **no h-scroll at 320** in any locale.

## Acceptance criteria (each verifiable in the diff + rendered evidence)

1. `FiltersPanel.tsx` imports **zero** `@/components/ui/sheet`, `@/components/ui/button`,
   `@/components/ui/input`; uses `MantineDrawer` + `@mantine/core` `Button`/`TextInput`. No raw
   `<button>/<input>`. `FiltersPanelProps` byte-identical; zero consumer edits (grep-confirm).
2. Overlay = `MantineDrawer` (`side="right"`, `size="sm"`); `<640` full-width bottom sheet inherited; the
   custom header X is removed and the built-in close is the documented replacement; `title` carries heading +
   badge; `footer` carries Apply/Reset; `contentReady` idle-mount gate preserved.
3. Property-type + market-type grids → Mantine `Button`, selected `variant="light"` (soft tint, theme-derived,
   zero invented hex) / unselected `variant="default"` §6a; grid/flex layout + toggle logic byte-identical;
   **no `size="lg"/"xl"`**; property grid = documented compact exemption, market grid full-width stacked <640.
4. Listing-id → Mantine `TextInput` §6e (`h-11`, brand focus ring, `shadow-theme-xs`), full-width, emits the
   identical `value || undefined`.
5. Apply/Reset → Mantine `Button` `fullWidth` (no banned size), Apply = filled brand + preserved active-count
   badge, Reset = `variant="default"` + `RotateCcw` `leftSection`; `handleApply`/`handleReset` unchanged.
6. Mobile <640: overlay + market grid + footer + input full-width; property grid = documented compact
   exemption (≥44px, wrap, no h-scroll at 320 × sq/en/uk/it).
7. TailAdmin §6a/§6e + `variant="light"` matched rendered side-by-side; §18.9 checks pass; **zero invented
   values**.
8. Registry row extended + baseline recorded + RTL smoke (`filtersPanelShell.smoke.test.tsx`) with a
   planted-violation FAIL transcript; `filtersRangeDatePicker.smoke.test.tsx` baseline stays green.
9. i18n: reuse existing runtime keys (no new component-runtime strings expected); any NEW story-fixture key
   gets full sq/en/uk/it parity; `check:i18n` green.
10. Gates: `tsc=0`, `check:stories`, `check:i18n`, `check:design-tokens -- --strict`, `check:mojibake`,
    `check:file-integrity` all green; `screenshots:assert -- --mantine-only` green; §18.9 human-visual set
    pasted; Files-Changed table present. **Do NOT run git — HELD for orchestrator review.**

## Out of scope

- The three leaf components (Task 566, unchanged), `HeroSearch.tsx` (**Task 568**), `LocationCombobox`,
  `YearCombobox`, `RangeDatePicker` (already migrated) — touch NONE of them.
- `useHomepageFilters`, `filterEngine`, URL-param serialization, number parsing, `shows()` domain logic,
  `activeCount` computation, the batch-apply draft model — all frozen.
- Redesigning any toggle grid into `SegmentedControl`/`Chip`; adding disabled/loading states; changing the
  section order or `SectionHeader`/`bg-primary` badge markup (not a legacy `@/components/ui/*` primitive).

## Files expected to change

**Round-1 (already on the working tree):** `src/components/shared/FiltersPanel.tsx` ·
`src/stories/mantine/primitives/FiltersPanelShell.stories.tsx` ·
`src/components/shared/__tests__/filtersPanelShell.smoke.test.tsx` · `docs/critical-flow-registry.md` ·
`docs/backlog.md` · `docs/sessions/2026-07-09-task567-filterspanel-shell-mantine.md`.

**Round-2 corrective (this pass) — additionally:**
- `src/design-system/mantine/theme.ts` — Fix 1 global Button `label` word-break change.
- `src/design-system/mantine/patterns/MantineDrawer.tsx` — Fix 2 header divider + Fix 4 pinned footer.
- `src/design-system/mantine/patterns/responsiveBottomSheet.tsx` — Fix 2/Fix 4 mobile bottom-sheet header
  divider + footer separation (only if the primitive restructure requires it; STOP-and-ASK if it would alter
  title-less sheets).
- `src/design-system/mantine/patterns/MantineCountButton.tsx` (**new**) + `patterns/index.ts` export — Fix 3.
- `src/design-system/mantine/patterns/__tests__/MantineCountButton.smoke.test.tsx` (**new**) + a persisted
  `MantineCountButton` story.
- `src/components/shared/FiltersPanel.tsx` — market-row wrap (Fix 1) + `MantineCountButton` on Apply (Fix 3).
- `src/components/shared/__tests__/filtersPanelShell.smoke.test.tsx` — the four strengthened assertions.
- `messages/{en,uk,sq,it}.json` — only if a NEW story/fixture string is required (full 4-locale parity).
- Update the round-1 session log (or add a round-2 addendum) + `docs/critical-flow-registry.md` row.

## Amended acceptance criteria (round-2 — in addition to original AC 1–10, which still hold except where
this section supersedes §2/§4/§6)

11. **Fix 1:** `theme.ts` Button `label` uses `wordBreak:'normal'` + `overflowWrap:'break-word'` (no mid-word
    split); the market-type row is `flex flex-col sm:flex-row sm:flex-wrap gap-2` with each button
    `w-full sm:w-auto` (no `flex-1`); rendered proof at uk@320/it@320 shows NO word split and buttons wrapping
    to the next line; no global button-label regression.
12. **Fix 2:** the canonical `MantineDrawer`/`responsiveBottomSheet` renders a single gray
    `1px solid var(--mantine-color-gray-3)` header bottom border **only when `title` is present**; every
    title-less bottom-sheet consumer verified to show NO stray divider; value traced to the
    `MantineResponsiveActionFooter` precedent (zero invented value).
13. **Fix 3:** new canonical `MantineCountButton` renders the count in Button `rightSection` (inline, canonical
    gap — like a `leftSection` icon), legible on filled brand, §-cited badge chrome; `FiltersPanel` Apply uses
    it; the round-1 absolute corner badge + `relative` wrapper are removed; primitive story + smoke added.
14. **Fix 4:** the `MantineDrawer` footer is pinned/always-visible with a `gray-3` top border + solid bg on
    BOTH desktop drawer and mobile bottom sheet; body scrolls under it; footerless drawers unchanged; the two
    Drawer/Modal stories re-verified.
15. **Strengthened gates:** the four new checks (mid-word/footer-visible DOM probe, header-divider, count-in-
    rightSection, footer-outside-scroll) each have a planted-violation FAIL → revert-green transcript in the
    session log; the §18.9 human-visual set includes the scrolled-to-bottom footer frame at all six
    breakpoint/locale combinations. **"All gates green" alone is NOT accepted as proof.**
