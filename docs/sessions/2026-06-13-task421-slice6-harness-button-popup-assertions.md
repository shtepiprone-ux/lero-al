# Session Log — 2026-06-13 — Task 421 (Sprint 35, Slice 6)

**Task:** `tasks/Sprints/Sprint_35_kickoff_prompt_Task_421_Slice6_HarnessButtonAndPopupAssertions.md`
**Scope:** Close the two `design-system.md §27.3` machine-detection gaps — add real harness
assertions (d) text-button full-width at `<640` and (e) open-popup = bottom-anchored full-width
at `<640` to `scripts/check-stories-rendered.mjs`, with the minimal `data-icon-only` Button
marker (Decision A) and minimal open-state overlay stories (Decision B) needed to make them bite.

---

## 1. Decision A — `data-icon-only` marker (`src/components/ui/button.tsx`)

```tsx
const ICON_ONLY_SIZES = new Set(["icon", "icon-xl", "icon-xs", "icon-sm", "icon-lg"])

function Button({ className, variant = "default", size = "default", ...props }: ...) {
  const isIconOnly = ICON_ONLY_SIZES.has(size ?? "default")
  return (
    <ButtonPrimitive
      data-slot="button"
      data-icon-only={isIconOnly ? "" : undefined}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}
```

- `data-icon-only={isIconOnly ? "" : undefined}` — present (empty string) ONLY for the 5 icon-only
  sizes, **absent** (not `"false"`) for every other size, per Addendum §4. No class/variant/a11y
  change — purely an inert DOM marker.
- Assertion (d) selects `[data-slot="button"]:not([data-icon-only])`.

## 2. Decision B — open-state overlay stories (7 registered)

5 of the 7 already existed (Task 379 added `MobileBottomSheet`/`MobileFullWidth` open stories for
Dialog, Select, Popover, DropdownMenu, Command). **2 were added this session:**

- **`src/components/ui/sheet.stories.tsx`** — new `MobileBottomSheet` story
  (`<Sheet defaultOpen><SheetContent side="bottom">...`), story ID
  `primitives-sheet--mobile-bottom-sheet`.
- **`src/components/ui/navigation-menu.stories.tsx`** (new file) — `Default` + `MobileOpen`
  stories, IDs `primitives-navigationmenu--default` / `primitives-navigationmenu--mobile-open`.

`ASSERT_STORIES` grew from 45 → **52** (45 + 7):

```js
// Open-state overlays (7 — Task 421 Slice 6, assertion (e) targets)
{ id: 'primitives-dialog--mobile-full-width',         label: 'Dialog/MobileFullWidth' },
{ id: 'primitives-select--mobile-bottom-sheet',       label: 'Select/MobileBottomSheet' },
{ id: 'primitives-popover--mobile-bottom-sheet',      label: 'Popover/MobileBottomSheet' },
{ id: 'primitives-dropdownmenu--mobile-bottom-sheet', label: 'DropdownMenu/MobileBottomSheet' },
{ id: 'primitives-command--mobile-bottom-sheet',      label: 'Command/MobileBottomSheet' },
{ id: 'primitives-sheet--mobile-bottom-sheet',        label: 'Sheet/MobileBottomSheet' },
{ id: 'primitives-navigationmenu--mobile-open',       label: 'NavigationMenu/MobileOpen' },
```

New matrix: **52 × 14 × 4 = 2912 cells** (was 45 × 14 × 4 = 2520).

### `navigation-menu.tsx` — `data-slot` addition

```diff
- <NavigationMenuPrimitive.Popup className={cn(
+ <NavigationMenuPrimitive.Popup data-slot="navigation-menu-popup" className={cn(
```

Single-line, inert addition — the only `navigation-menu.tsx` change. **Selector correction:** the
kickoff prompt's §"Open-state stories to add" referred to `navigation-menu-content`; the actual
Base-UI slot is `Popup`, so `navigation-menu-popup` is the correct/used selector. `docs/
design-system.md §27.3`'s assertion (e) row and the harness docblock both use
`navigation-menu-popup` (corrected during implementation).

### Command/Inline vs Command/MobileBottomSheet classification (Addendum §3)

`CommandDialog` wraps `DialogContent` (`command.tsx` → `<CommandDialog>` renders a Dialog), so
`Command/MobileBottomSheet`'s open overlay is matched by assertion (e) via
`[data-slot="dialog-content"]` — **not** a Command-specific selector. `Command/Inline`
(`primitives-command--inline`) renders only `data-slot="command"` in normal document flow, no
`dialog-content` — assertion (e) finds zero popup targets for it → `popupBottomSheetAtMobile:
null` (vacuous, confirmed in final manifest). `command--inline` is correctly NOT a
popup-bottom-sheet target; no selector was added for a bare `command` slot.

---

## 3. Assertions (d) and (e) — implementation (`scripts/check-stories-rendered.mjs`)

### (d) — text-button full-width at `<640`

```js
let fullWidthButtonsOk = true;
let failingButtons = [];
let checkedAnyButton = false;
if (viewport.width < 640) {
  const result = await page.evaluate((tolerance) => {
    function parentContentWidth(el) {
      const p = el.parentElement;
      if (!p) return 0;
      const s = window.getComputedStyle(p);
      return p.clientWidth - (parseFloat(s.paddingLeft) || 0) - (parseFloat(s.paddingRight) || 0);
    }
    const failures = [];
    let checkedAny = false;
    for (const el of document.querySelectorAll('[data-slot="button"]:not([data-icon-only])')) {
      if (el.offsetWidth <= 1) continue;
      if (el.closest('[data-slot="button-group"]')) continue;
      checkedAny = true;
      const pw = parentContentWidth(el);
      if (pw > 0 && el.offsetWidth < pw - tolerance) {
        failures.push((el.textContent ?? '').trim().slice(0, 40) || '(empty)');
      }
    }
    return { failures, checkedAny };
  }, FULL_WIDTH_TOLERANCE);
  failingButtons = result.failures;
  checkedAnyButton = result.checkedAny;
  fullWidthButtonsOk = failingButtons.length === 0;
}
cell.assertions.fullWidthButtonsAtMobile = viewport.width < 640 ? (checkedAnyButton ? fullWidthButtonsOk : null) : null;
if (failingButtons.length > 0) cell.assertions.failingButtonLabels = failingButtons;
```

### (e) — open popup = bottom-anchored full-width at `<640`

```js
let popupBottomSheetOk = true;
let failingPopups = [];
let checkedAnyPopup = false;
if (viewport.width < 640) {
  const result = await page.evaluate((tolerance) => {
    const selectors = [
      '[data-slot="dialog-content"]', '[data-slot="sheet-content"]',
      '[data-slot="select-content"]', '[data-slot="popover-content"]',
      '[data-slot="dropdown-menu-content"]', '[data-slot="navigation-menu-popup"]',
    ];
    const failures = [];
    let checkedAny = false;
    for (const sel of selectors) {
      for (const el of document.querySelectorAll(sel)) {
        if (el.getAttribute('data-side') === 'left') continue;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        checkedAny = true;
        const edgeToEdge =
          rect.width >= window.innerWidth - tolerance &&
          Math.abs(rect.left) <= tolerance &&
          Math.abs(rect.right - window.innerWidth) <= tolerance;
        const bottomAnchored = Math.abs(rect.bottom - window.innerHeight) <= tolerance;
        if (!edgeToEdge || !bottomAnchored) {
          const side = el.getAttribute('data-side');
          failures.push(el.getAttribute('data-slot') + (side ? `[data-side=${side}]` : ''));
        }
      }
    }
    return { failures, checkedAny };
  }, FULL_WIDTH_TOLERANCE);
  failingPopups = result.failures;
  checkedAnyPopup = result.checkedAny;
  popupBottomSheetOk = failingPopups.length === 0;
}
cell.assertions.popupBottomSheetAtMobile = viewport.width < 640 ? (checkedAnyPopup ? popupBottomSheetOk : null) : null;
if (failingPopups.length > 0) cell.assertions.failingPopupSlots = failingPopups;

cell.pass = !renderFailed && noOverflow &&
  (viewport.width >= 640 || (fullWidthOk && fullWidthButtonsOk && popupBottomSheetOk));
```

### AC9 `checkedAny`/null-semantics fix

Initial implementation recorded `false` whenever `viewport.width < 640` and no qualifying
element existed (vacuous case), which would have FAILED cells like `Badge/Default` (no button)
or `Command/Inline` (no popup) — a false positive. Fixed by adding `checkedAnyButton` /
`checkedAnyPopup` tracking: the assertion is `null` (not checked / vacuous) when no qualifying
element was found, `true`/`false` only when at least one element was actually evaluated. This is
the same three-state (`true`/`false`/`null`) pattern as the pre-existing
`fullWidthControlsAtMobile`.

### Docblock + `design-system.md §27.3`

Both updated: "machine-checks **five** assertions per cell" (was three); (d)/(e) rows added to
the "machine-checked" table; the corresponding "does NOT detect" rows for button-full-width and
popup-bottom-sheet removed. Line 480 summary updated to "button full-width and popup
bottom-sheet compliance are machine-checked as of Task 421".

---

## 4. Negative-flow proofs (AC7–AC9)

### AC7 — planted non-full-width button (assertion (d) bites)

Plant: `src/components/ui/button.stories.tsx` `Default` story temporarily rendered
`<Button className="w-20!">{L('save', locale)}</Button>` (Tailwind v4 suffix `!important`
syntax — `w-20!`, not v3 prefix `!w-20` which is silently ignored under Tailwind v4).

`npm run screenshots:assert:fast` (after `build-storybook`) — **FAIL, exit 1**:

```
Button/Default × sq × mobile-320/375/390
  ✗ text button not full-width at <640: Ruaj njoftimin
Button/Default × en × mobile-320/375/390
  ✗ text button not full-width at <640: Save listing
Button/Default × uk × mobile-320/375/390
  ✗ text button not full-width at <640: Зберегти оголошення
Button/Default × it × mobile-320/375/390
  ✗ text button not full-width at <640: Salva annuncio
```

12 cells FAIL (3 mobile viewports × 4 locales), `fullWidthButtonsAtMobile: false`,
`failingButtonLabels` populated with the locale label. **Reverted** — `Default` restored to
`<Button>{L('save', locale)}</Button>`.

### AC8 — planted centered-card popup (assertion (e) bites)

Plant: `src/components/ui/dialog.stories.tsx` `MobileFullWidth` story's `<DialogContent>`
temporarily given
`className="max-sm:left-1/2! max-sm:top-1/2! max-sm:right-auto! max-sm:bottom-auto! max-sm:w-64! max-sm:-translate-x-1/2! max-sm:-translate-y-1/2! max-sm:rounded-2xl!"`
(centered ~256px card, Tailwind v4 suffix syntax).

Same `--fast` run — **FAIL, exit 1**:

```
Dialog/MobileFullWidth × {sq,en,uk,it} × mobile-320/375/390
  ✗ popup not bottom-sheet at <640: dialog-content
```

12 cells FAIL, `popupBottomSheetAtMobile: false`, `failingPopupSlots: ["dialog-content"]`.
**Reverted** — `MobileFullWidth`'s `<DialogContent>` restored to plain `<DialogContent>`.

### AC9 — skip/vacuous verifications (final 2912-cell manifest, post-revert)

| Case | Story × locale × viewport | `fullWidthButtonsAtMobile` | `popupBottomSheetAtMobile` |
|---|---|---|---|
| Icon-only / no qualifying button | `Combobox/ButtonVariant` × en × mobile-320 | `null` | `null` |
| §26.6 left-drawer (AdminSidebar) | `AdminSidebar/MobileDrawerOpen` × en × mobile-320 | `true` | **`null`** (skipped, `data-side="left"`) |
| No overlay, vacuous | `Badge/Default` × en × mobile-320 | `null` | `null` |
| Inline Command, not a popup | `Command/Inline` × en × mobile-320 | `null` | `null` |
| CommandDialog → dialog-content | `Command/MobileBottomSheet` × en × mobile-320 | `true` | `true` |
| `≥640px` — both null | `Button/Default` × en × canonical-680 | `null` | `null` |
| `≥640px` — both null | `Dialog/MobileFullWidth` × en × canonical-680 | `null` | `null` |
| Post-revert green | `Button/Default` × en × mobile-320 | `true` | `null` |

All confirm the intended three-state (`true`/`false`/`null`) semantics: `null` = not applicable
/ vacuous (never fails the cell), `true`/`false` = actually checked.

### Build/rebuild discipline note

`scripts/check-stories-rendered.mjs` serves the **pre-built** `storybook-static/` directory.
Every `.tsx`/`.stories.tsx` edit (the `data-icon-only` marker, the `navigation-menu-popup`
data-slot, both stories, both plants, both reverts) required `npm run build-storybook` to be
re-run before `screenshots:assert`/`:fast` reflected it — confirmed by an early
all-green-but-vacuous run that was discarded and re-run after a real rebuild.

---

## 5. Real finding exposed by assertion (e) — `NavigationMenu/MobileOpen`

The new `Primitives/NavigationMenu` → `MobileOpen` story (one of the 7 new open-state targets,
Decision B) exposes a **real, deterministic** §26.2 violation:
`navigation-menu-popup[data-side=bottom]` is not edge-to-edge / bottom-anchored at `<640px`, for
**all 4 locales × all 5 `<640` viewports** (mobile-320/375/390/480, canonical-560) — 20 cells.

**Root cause identified:** `src/components/ui/mobile-bottom-sheet.ts`'s `MOBILE_POSITIONER`
token uses **Tailwind v3 `!important`-prefix syntax** (`max-sm:!fixed`, `max-sm:!inset-x-0`,
`max-sm:!w-auto`, `max-sm:!h-auto`, `max-sm:![transform:none]`, etc. — `!` BEFORE the utility).
This project is on **Tailwind v4** (`"tailwindcss": "^4"`), where the important-modifier is the
**suffix** form (`fixed!`, `inset-x-0!`); the v3 prefix form is silently a no-op (no CSS
generated at all). `MOBILE_POSITIONER`'s explicit purpose (per its own comment) is to use
`!important` to override Base-UI's inline anchor-positioning styles on `Positioner` — since all 8
of its utilities are currently no-ops, `NavigationMenuPositioner`'s inline floating-ui styles are
never overridden, so the popup stays anchored near its trigger instead of becoming a `fixed
inset-x-0 bottom-0` bottom sheet.

The other 5 primitives consuming `MOBILE_POSITIONER`/`MOBILE_POPUP` (Dialog, Sheet, Select,
Popover, DropdownMenu, Command) currently PASS assertion (e) despite the same dormant-token bug —
most likely because their bottom-sheet behavior comes from `MOBILE_POPUP`'s `max-sm:w-full
max-sm:max-w-none ...` on the Popup/Content itself (which doesn't need to override inline
anchor styles), not from `MOBILE_POSITIONER`. This needs empirical verification per primitive
before the shared token is changed.

**Per Addendum §1 / Decision B's explicit "STOP & report or split a fix task" branch**, this is
NOT fixed in this task (out of scope: redesigning overlay primitives; the fix touches a shared
token consumed by 5 currently-passing primitives and requires a full-matrix re-verification).
**Follow-up filed:** `tasks/Sprints/Sprint_35_kickoff_prompt_Task_422_MobileBottomSheetImportantSyntax_NavigationMenu.md`
— Task 422, fixes `MOBILE_POSITIONER`'s Tailwind v4 syntax and re-verifies all 6 consuming
primitives.

### Non-reproducing intermediate finding — `AdminUsersTable/Default × it × mobile-480`

An earlier intermediate `--fast`-adjacent full run (`.screenshots/rendered-assert/
2026-06-12T20-18/`) recorded this cell as FAIL: `fullWidthControlsAtMobile: false`,
`fullWidthButtonsAtMobile: false`, `failingButtonLabels: ["Tutti gli utenti", "✓ Agenti
verificati"]`, `retryCount: 0`. The **final** full 2912-cell run (post-revert, clean rebuild,
`.screenshots/rendered-assert/2026-06-13T04-55/`) shows this exact cell **PASS**:
`fullWidthControlsAtMobile: true`, `fullWidthButtonsAtMobile: true`, `retryCount: 0`, no
`failingButtonLabels`. `AdminUsersTable.tsx` was not touched in this session. The earlier FAIL did
not reproduce in the authoritative final run — flagged here for visibility (not filed as a
follow-up task, since it does not reproduce); if it recurs in a future `screenshots:assert` run,
re-investigate `AdminUsersTable.tsx`'s Tabs container (`flex flex-wrap` with two `size="tab"`
buttons) at `it`/480px specifically.

---

## 6. Final `screenshots:assert` (52 × 14 × 4 = 2912 cells)

```
Stories: 52 | Viewports: 14 | Locales: 4
Results: 2892/2912 PASS, 20 FAIL
flaky-recovered: 0
Manifest: .screenshots/rendered-assert/2026-06-13T04-55/manifest.json

❌ Failed cells (all NavigationMenu/MobileOpen, all real — §5):
  NavigationMenu/MobileOpen × {sq,en,uk,it} × {mobile-320, mobile-375, mobile-390, mobile-480, canonical-560}
    ✗ popup not bottom-sheet at <640: navigation-menu-popup[data-side=bottom]
```

Per **Addendum §1 (Final green rule)**: the new assertions expose **zero** violations in the
**original 45** `ASSERT_STORIES` (the pre-existing, already-§26-compliant component set) — all
20 failures are confined to `NavigationMenu/MobileOpen`, one of the **7 new** Decision-B
open-state stories, and are classified per Decision B's explicit "STOP & report or split a fix
task" branch (§5 above, Task 422 filed). This is the documented acceptable final state, not a
silent skip or scope expansion.

exit code: 1 (20 FAIL) — expected and documented; this is the correct outcome for AC11 given a
real Decision-B finding, per Addendum §1.

---

## 7. Validation gates

- `npx tsc --noEmit` — clean (0 errors).
- `npm run lint` — clean.
- `npm run build-storybook` — succeeds (re-run twice: once after the marker/stories/assertions,
  once after reverting both plants).
- `npm run check:stories` — PASS.
- `npm run check:i18n` — PASS (no new strings/keys; new stories reuse existing `storyT` fixtures).
- `npm run check:story-coverage` — PASS.
- `npm run check:design-tokens` — PASS.

---

## 8. File-integrity checks (clause 14)

All touched files verified: 0 NUL bytes, no BOM, `.mjs` `node --check` OK, `.tsx`/`.ts` compile
(covered by `tsc --noEmit` above).

| File | NUL bytes | BOM |
|---|---|---|
| `src/components/ui/button.tsx` | 0 | none |
| `src/components/ui/navigation-menu.tsx` | 0 | none |
| `src/components/ui/navigation-menu.stories.tsx` | 0 | none |
| `src/components/ui/sheet.stories.tsx` | 0 | none |
| `scripts/check-stories-rendered.mjs` | 0 | none |
| `docs/design-system.md` | 0 | none |

`src/components/ui/button.stories.tsx` and `src/components/ui/dialog.stories.tsx` — plants fully
reverted; `git status` confirms both files are byte-identical to HEAD (not listed as modified).

---

## 9. AC-by-AC

| AC | Status | Evidence |
|---|---|---|
| AC1 | ✅ | §2/§6 — 52×14×4=2912 cells; (a)(b)(c) unchanged |
| AC2 | ✅ | §3 (d) implementation, `fullWidthButtonsAtMobile` recorded |
| AC3 | ✅ | §3 (e) implementation, `popupBottomSheetAtMobile` recorded, `data-side="left"` skip |
| AC4 | ✅ | §1 — `data-icon-only`, inert, icon-sizes only |
| AC5 | ✅ | §2 — 7 stories registered, `check:stories` PASS |
| AC6 | ✅ | §3 `cell.pass` formula |
| AC7 | ✅ | §4 AC7 — planted FAIL transcript + revert |
| AC8 | ✅ | §4 AC8 — planted FAIL transcript + revert |
| AC9 | ✅ | §4 AC9 table — icon-only/left-drawer/no-overlay/inline-command/≥640 all `null`, post-revert green |
| AC10 | ✅ | §3 — docblock + `design-system.md §27.3` updated |
| AC11 | ✅ (Addendum §1 branch) | §6 — 2892/2912; 0 violations in original 45 stories; 20 failures = 1 real Decision-B finding, Task 422 filed (§5) |
| tsc/lint/build/check:* | ✅ | §7 |
| clause 14 | ✅ | §8 |

---

## 10. Files Changed

| File | Change |
|---|---|
| `src/components/ui/button.tsx` | Decision A: added `ICON_ONLY_SIZES` set + inert `data-icon-only={isIconOnly ? "" : undefined}` attribute on the Button primitive. No class/variant/a11y change. |
| `src/components/ui/sheet.stories.tsx` | **New** `MobileBottomSheet` story (`<Sheet defaultOpen><SheetContent side="bottom">`), registered as `primitives-sheet--mobile-bottom-sheet`. |
| `src/components/ui/navigation-menu.stories.tsx` | **New file** — `Default` + `MobileOpen` stories, registered as `primitives-navigationmenu--default` / `--mobile-open`. |
| `src/components/ui/navigation-menu.tsx` | Added `data-slot="navigation-menu-popup"` to `NavigationMenuPrimitive.Popup` (inert marker, single line). |
| `scripts/check-stories-rendered.mjs` | Added assertions (d) text-button full-width and (e) popup-bottom-sheet at `<640`, with `checkedAny*`/null-semantics (AC9); extended `cell.pass`; appended 7 entries to `ASSERT_STORIES` (45→52); updated docblock. |
| `docs/design-system.md` | §27.3 — "three assertions" → "five"; (d)/(e) rows added to machine-checked table, corresponding "does NOT detect" rows removed; line 480 summary updated. |
| `tasks/Sprints/Sprint_35_kickoff_prompt_Task_422_MobileBottomSheetImportantSyntax_NavigationMenu.md` | **New** — follow-up task: fix `MOBILE_POSITIONER`'s Tailwind v4 `!important` syntax (§5), re-verify all 6 popup primitives. |
| `docs/backlog.md` | "Last Session" updated to summarize Task 421; Task 422 queued. |
| `docs/sessions/2026-06-13-task421-slice6-harness-button-popup-assertions.md` | **New** — this session log. |

**Reverted (net-zero, not in diff):** `src/components/ui/button.stories.tsx`,
`src/components/ui/dialog.stories.tsx` — negative-flow plants fully removed (§4).

---

## 11. Confirmations

- **No product/admin/listing UI touched** beyond `button.tsx`'s inert marker and
  `navigation-menu.tsx`'s inert `data-slot` addition.
- **No overlay primitive redesign** — the one real finding (NavigationMenu bottom-sheet, §5) is
  documented + follow-up filed (Task 422), not silently fixed or skipped.
- **§26.6 exceptions** (AdminSidebar left drawer, ListingGallery lightbox) correctly skipped by
  (e) — verified (§4 AC9).
- **`FULL_WIDTH_TOLERANCE` unchanged** (8px).
- **Both negative-test plants fully reverted** — `git status` confirms `button.stories.tsx` /
  `dialog.stories.tsx` byte-identical to HEAD.
- **No git commands emitted** by the executor (single-writer rule) — orchestrator to review diff
  and emit explicit-path commit commands.

Self-validation: tsc=0 · lint clean · build-storybook OK (×2, post-marker and post-revert) ·
check:stories/i18n/story-coverage/design-tokens all PASS · negative-flow AC7/AC8 transcripts
captured (FAIL→revert→PASS) · AC9 skip/vacuous table complete · final `screenshots:assert`
2892/2912, 20 FAIL — all classified as 1 real Decision-B finding (NavigationMenu bottom-sheet,
Task 422 filed) per Addendum §1 · clause-14 integrity clean · scope=clean.
