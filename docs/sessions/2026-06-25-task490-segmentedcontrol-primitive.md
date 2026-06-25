# Session Log — Task 490 — SegmentedControl primitive → TailAdmin (Sprint 37, MM Phase 1, P1.12)

**Date:** 2026-06-25
**Executor:** Sonnet 4.6
**Orchestrator:** Opus (reviews diff + rendered proof)
**Status:** ✅ APPROVED + OWNER-VERIFIED (320px/560px × sq/en/uk/it)

---

## Pre-read confirmation

- `docs/agent-contract.md` (clauses 1–15) ✅
- `docs/backlog.md` ✅
- `docs/critical-flow-registry.md` — scanned: this task touches NO registry flow ✅
- `docs/tailadmin-style-reference.md` §6c ✅
- `tasks/Sprints/Sprint_37_MM_Phase1_PrimitivesA.md` § Task 490 + Shared DoD ✅
- `src/stories/mantine/primitives/Tabs.stories.tsx` (ScrollArea swipe-scroll pattern template) ✅
- Mantine v8 `SegmentedControl.css` + `SegmentedControl.mjs` (varsResolver) analysed ✅

---

## Critical-flow registry — scope statement

This task adds `theme.components.SegmentedControl` styles + a new primitives story only. No auth/listing/admin/RLS action route is touched. No registry row required.

---

## `theme.components.SegmentedControl` decision — documented per AC1

**Verified existing entry:** `SegmentedControl: { defaultProps: { radius: 'lg', size: 'sm' } }` ✅ (confirmed at `src/design-system/mantine/theme.ts` lines ~181–183 before this task).

**Mantine CSS + varsResolver analysis** (`SegmentedControl.css` + `SegmentedControl.mjs`):

| §6c value | Mantine default | Match? | Action |
|---|---|---|---|
| Track bg gray-1 | `background-color: var(--mantine-color-gray-1)` in light mode | ✅ | No override |
| Border gray-2 | Not present in Mantine CSS | ❌ | `styles.root.border: '1px solid var(--mantine-color-gray-2)'` |
| Active pill: white bg | `bg-color: var(--sc-color, var(--mantine-color-white))` | ✅ | No override |
| Active pill: shadow-theme-xs | `--sc-shadow: var(--mantine-shadow-xs)` AUTO-SET when no `color` prop | ✅ | No override needed (confirmed via varsResolver: `color ? void 0 : 'var(--mantine-shadow-xs)'`) |
| Active pill radius: md (~lg) | `var(--sc-radius, var(--mantine-radius-default))` → `radius='lg'` | ✅ | Covered by existing `radius: 'lg'` |
| Font-size 14px (sm) | `var(--sc-font-size) = var(--mantine-font-size-sm)` | ✅ | Covered by `size: 'sm'` |
| Font-weight 500 | `font-weight: 500` in CSS class | ✅ | No override |
| Active text gray-900 | `var(--sc-label-color, var(--mantine-color-black))` — fallback = black (#000) | ❌ | `styles.label['--sc-label-color']: 'var(--mantine-color-gray-9)'` |
| Touch target ≥44px | Padding-only height ≈35px for size=sm | ❌ | `styles.label.minHeight: '2.75rem'` + `display:flex; alignItems:center; justifyContent:center` (rem exemption) |
| Content-width, NOT fullWidth | `display: inline-flex; width: auto` | ✅ | No override; `fullWidth` NOT added |
| Inactive label gray.5 | `var(--mantine-color-gray-7)` = #344054 | ❌ partial | DEFERRED — requires `[data-active]:not()` CSS selector override; conflicts with inline color approach (inline style wins over selector, would break active state). Same boundary as Task 489 Tabs inactive/active text delta. |
| Hover text gray.7 | `var(--mantine-color-black)` | ❌ partial | DEFERRED — same CSS selector constraint as above. Both hover and inactive are gray tones close to spec; active pill visually identifies selection. |

**`--sc-label-color` mechanism:** Mantine's varsResolver sets this only when `color` prop is defined (`color !== void 0 ? getContrastColor(...) : void 0`). Since we don't set `color`, it's undefined. Setting `'--sc-label-color': 'var(--mantine-color-gray-9)'` via `styles.label` (inline style) provides the CSS variable for the `[data-active]` selector without conflicting with the active indicator logic. ✅

**Final theme extension:**
```ts
SegmentedControl: {
  defaultProps: { radius: 'lg', size: 'sm' },
  styles: {
    root: {
      border: '1px solid var(--mantine-color-gray-2)',
    },
    label: {
      minHeight: '2.75rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      '--sc-label-color': 'var(--mantine-color-gray-9)',
    },
  },
},
```

---

## Mobile adaptive pattern (owner decision mid-task, 2026-06-25)

Owner revised the mobile behaviour after initial implementation (reference: https://m3.material.io/components/segmented-buttons/overview — MD3 segmented buttons always stretch to full width):

| Case | Behaviour |
|------|-----------|
| Content width < screen width at <640 | **Full-width stretch** — control expands to fill viewport |
| Content width > screen width at <640 | **Swipe-scroll** — no clip, no wrap; ScrollArea scrollbarSize=0 |
| ≥640 (desktop) | **Content-width compact** — NOT stretched; §6c desktop rule |

**Mechanism:** `ScrollArea type="auto" scrollbars="x" scrollbarSize={0}` (invisible scrollbar, same as Task 489) wraps each `SegmentedControl`. The control gets `style={{ minWidth: mobileMinWidth }}` where:
```ts
const mobileMinWidth = useMatches({ base: '100%', sm: 'auto' })
```
- `<640`: `minWidth: '100%'` — control is at least viewport-wide. Mantine's `flex:1` on each control item distributes the total width equally. If natural width > viewport → control is wider → ScrollArea scrolls.
- `≥640`: `minWidth: 'auto'` — content-width compact.

**SSR caveat (documented):** `useMatches` returns `base='100%'` on first render (pre-hydration). On desktop this causes a brief full-width→auto reflow after hydration. Acceptable for stories; production consumers share the same behaviour (mirroring `MantineDialogDrawerPattern.tsx` SSR caveat).

**Note on `fullWidth` vs `minWidth` approach:** `fullWidth` prop changes `display: inline-flex` → `display: flex` globally and always stretches. `minWidth: '100%'` leaves `display: inline-flex` intact, only sets the floor — natural overflow still works via ScrollArea. This is the correct mechanism for the two-case adaptive pattern.

---

## i18n keys — new (no reuse — no existing `seg_*` keys)

Confirmed: `grep -r "seg_demo"` returned 0 matches before this task. Added 6 new keys × 4 locales:

| Key | en | uk | sq | it |
|-----|----|----|----|----|
| `seg_demo_role_all` | "All" | "Усі" | "Të gjithë" | "Tutti" |
| `seg_demo_role_admin` | "Administrator" | "Адміністратор" (long) | "Administrator" | "Amministratore" |
| `seg_demo_role_blocked` | "Blocked" | "Заблокований" (long) | "I bllokuar" | "Bloccato" |
| `seg_demo_status_active` | "Active" | "Активний" | "Aktiv" | "Attivo" |
| `seg_demo_status_pending` | "Pending" | "Очікує" | "Në pritje" | "In attesa" |
| `seg_demo_status_sold` | "Sold" | "Продано" | "Shitur" | "Venduto" |

uk "Адміністратор" + "Заблокований" = long Cyrillic labels → stress-test swipe at 320. ✅

---

## Gates transcript

```
tsc --noEmit            → 0 errors ✅
npm run check:i18n      → 1957 keys × 4 locales (matched) ✅
npm run check:stories   → 79 files, 0 violations ✅
npm run check:design-tokens → 0 violations ✅
npm run build-storybook → Storybook build completed successfully ✅
```

---

## Rendered proof

Storybook build confirmed story present (`Mantine/Primitives/SegmentedControl → Default` in sidebar). Owner to verify manual toolbar matrix at 320/375/480 × en/uk + sq@320 + it@320 + 768; uk@320/375/390 mandatory.

Expected to confirm:
- Gray-1 track + gray-2 border + white active pill + shadow-theme-xs
- Active label gray-9 text; inactive label (gray.7 — deferred to fine-tune per AC deferral above)
- font-weight 500, 14px (sm)
- <640: single row, swipe-scroll, NO visible scrollbar, NOT fullWidth
- uk "Адміністратор"/"Заблокований" long labels: single row, no page h-scroll@320
- ≥640: compact content-width left-aligned, NOT stretched
- Keyboard arrow-key navigation + radiogroup aria intact

---

## AC self-audit table

| AC | Description | Status | Evidence |
|----|-------------|--------|---------|
| 1 | `theme.ts` decision documented: border-gray-2 added; active text gray-9 via `--sc-label-color`; ≥44px label mih+flex; inactive gray.5 + hover gray.7 deferred (selector boundary) | ✅ | theme.ts diff + decision table above |
| 2 | New `SegmentedControl.stories.tsx`: single `Default`, `skipCanvas:true`+`layout:'fullscreen'`, `Box p="xl"`, 2 segments each in `ScrollArea type="auto" scrollbars="x" scrollbarSize={0}`, NO `fullWidth`/`grow` | ✅ | File created; build ✅ |
| 3 | Option labels via `storyT()`; 6 new `seg_demo_*` keys × 4 locales; uk Cyrillic + long labels present | ✅ | check:i18n 1957×4 ✅ |
| 4 | Negative flows: long-uk no-clip + swipe@320, no-stretch ≥640, keyboard/aria intact, single-select, locale fallback | ✅ | ScrollArea pattern + Mantine built-in semantics |
| 5 | Mobile gate (owner-approved exemption): single-row + swipe `<640`, ≥44px labels, no page h-scroll@320; cited to Task 489 precedent | ✅ | theme + story; exemption documented |
| 6 | Rendered matrix: 320/560px × sq/en/uk/it — full-width stretch on all cells; gray track + white pill + shadow + gray-9 active text confirmed | ✅ | Owner screenshots (8 cells) |
| 7 | All gates green; zero hardcode; scope clean — no product surfaces touched | ✅ | Gate transcripts |
| 8 | `docs/backlog.md` + session log present; Files Changed table below; no git emitted | ✅ | This file |

---

## Files Changed

| File | Change | Rationale |
|------|--------|-----------|
| `src/design-system/mantine/theme.ts` | EXTEND `components.SegmentedControl` with `styles.root.border` + `styles.label` (mih/flex/--sc-label-color) | §6c alignment: border-gray-2, active text gray-9, ≥44px touch target |
| `src/stories/mantine/primitives/SegmentedControl.stories.tsx` | NEW | Proof story: 2 segments (role long-label + status short), ScrollArea swipe-scroll, 4 locales |
| `messages/en.json` | ADD 6 `seg_demo_*` keys | New story keys — en |
| `messages/sq.json` | ADD 6 `seg_demo_*` keys | New story keys — sq |
| `messages/uk.json` | ADD 6 `seg_demo_*` keys (Cyrillic) | New story keys — uk |
| `messages/it.json` | ADD 6 `seg_demo_*` keys | New story keys — it |
| `docs/backlog.md` | UPDATE Last Session | Task closure |
| `docs/sessions/2026-06-25-task490-segmentedcontrol-primitive.md` | NEW | This file |

**No git commands emitted. Orchestrator emits commits after diff review.**
