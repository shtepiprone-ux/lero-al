# Session Log — 2026-06-13 — Task 422

**Task:** `tasks/Sprints/Sprint_35_kickoff_prompt_Task_422_MobileBottomSheetImportantSyntax_NavigationMenu.md`
**Scope:** Fix `MOBILE_POSITIONER`'s Tailwind v3-style `!important` syntax (silent no-op under
this project's Tailwind v4) and re-verify all 6 popup primitives that consume the shared
`mobile-bottom-sheet.ts` tokens, closing the 20-cell `NavigationMenu/MobileOpen` finding from
Task 421 Slice 6 (final assert: 2892/2912).

---

## 1. AC1 — `MOBILE_POSITIONER` v4 `!` suffix syntax fix

`src/components/ui/mobile-bottom-sheet.ts`:

```diff
 /**
  * Apply to Base-UI `Positioner` to override its inline-style anchor positioning
- * at <640px. Uses `!important` (Tailwind `!` prefix) to beat inline styles.
+ * at <640px. Uses `!important` (Tailwind v4 `!` suffix) to beat inline styles.
  */
 export const MOBILE_POSITIONER =
-  "max-sm:!fixed max-sm:!inset-x-0 max-sm:!bottom-0 max-sm:!top-auto max-sm:!w-auto max-sm:!h-auto " +
-  "max-sm:![transform:none] max-sm:![translate:none]"
+  "max-sm:fixed! max-sm:inset-x-0! max-sm:bottom-0! max-sm:top-auto! max-sm:w-auto! max-sm:h-auto! " +
+  "max-sm:[transform:none]! max-sm:[translate:none]!"
```

Tailwind v3 used a `!` **prefix** for the important modifier (`!fixed`); Tailwind v4 uses a `!`
**suffix** (`fixed!`). The v3-style classes were silently dropped by the v4 compiler (no warning),
so `MOBILE_POSITIONER` never overrode Base-UI's inline `position: absolute; left: …; top: …`
anchor styles at `<640px`.

`npm run build-storybook` → succeeded, **no Tailwind warnings** (`scripts/task422-build-storybook.txt`).

## 2. Required investigation — consumers of `MOBILE_POSITIONER`

`grep -rn "MOBILE_POSITIONER" src/components/ui/`:

| Consumer | Positioner className includes | Result after fix |
|---|---|---|
| `select.tsx` | `cn("isolate z-50", MOBILE_POSITIONER)` — no extra max-width constraint | PASS (e), 0 regression |
| `popover.tsx` | `cn("isolate z-50", MOBILE_POSITIONER)` | PASS (e), 0 regression |
| `dropdown-menu.tsx` | `cn("isolate z-50 outline-none", MOBILE_POSITIONER)` | PASS (e), 0 regression |
| `navigation-menu.tsx` | `cn("... w-(--positioner-width) max-w-(--available-width) ...", MOBILE_POSITIONER, className)` | Required AC3 fix below |

Sheet/Dialog/Command do not consume `MOBILE_POSITIONER` (different mechanism, already passing).

## 3. AC3 — additional targeted fix: `navigation-menu.tsx`

After the v4 syntax fix alone, `NavigationMenu/MobileOpen` still failed assertion (e) — same
12-cell pattern as the pre-fix baseline (`screenshots:assert:fast`, `scripts/task422-fast-verify.txt`:
612/624, 12 FAIL, 0 regressions elsewhere).

### Diagnosis (`scripts/task422-diagnose-navmenu.mjs`, viewport 320×720, `en`)

After the v4 fix, the Positioner correctly got `position: fixed; bottom: 0px; left: 0px; right: 0px`
(the `!important` overrides now apply) — `rect.bottom = 720 = innerHeight` (bottom-anchored ✅).
But `rect.width = 310px` vs `innerWidth = 320px` (10px short, > `FULL_WIDTH_TOLERANCE = 8`) —
edge-to-edge check still failed.

Root cause: the Positioner's base className (unique to `navigation-menu.tsx`, not part of
`MOBILE_POSITIONER`) includes `max-w-(--available-width)`, which resolves to
`max-width: 310px` from Base-UI's floating-ui-computed `--available-width` custom property. This
`max-width` is **not** `!important`, but `max-width` still clamps the `width: auto !important`
(from `max-sm:w-auto!`) used-value computed from `left: 0 / right: 0` (which would otherwise be
320px). No other consumer's Positioner sets `max-w-(--available-width)`, so this is
`navigation-menu.tsx`-specific.

### Fix

`src/components/ui/navigation-menu.tsx`, `NavigationMenuPositioner`:

```diff
         className={cn(
           "isolate z-50 h-(--positioner-height) w-(--positioner-width) max-w-(--available-width) transition-[top,left,right,bottom] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-instant:transition-none sm:data-[side=bottom]:before:top-[-10px] sm:data-[side=bottom]:before:right-0 sm:data-[side=bottom]:before:left-0",
           MOBILE_POSITIONER,
+          // max-w-(--available-width) above caps the Positioner below the full
+          // viewport width even with MOBILE_POSITIONER's inset-x-0!/w-auto! —
+          // remove the cap at <640 so the bottom sheet is edge-to-edge (Task 422).
+          "max-sm:max-w-none!",
           className
         )}
```

`max-sm:max-w-none!` removes the `max-width` cap at `<640px` only (`sm:`+ unaffected), letting
`inset-x-0!` (left:0/right:0) drive the used width to the full viewport (320px).

### Post-fix diagnostic (320×720, `en`, after rebuild)

```
positioner.computed: position=fixed, top=584px, left=0px, right=0px, bottom=0px, width=320px, height=136px
positioner.rect:      { x:0, y:584, width:320, height:136, top:584, bottom:720, left:0, right:320 }
popup.rect:            { x:0, y:584, width:320, height:136, top:584, bottom:720, left:0, right:320 }
```

`rect.width = 320 = innerWidth`, `rect.left = 0`, `rect.right = 320`, `rect.bottom = 720 =
innerHeight` → assertion (e) `edgeToEdge` and `bottomAnchored` both satisfied.

## 4. AC2 — full `screenshots:assert` (2912 cells)

`scripts/task422-full-assert.txt`:

```
Results: 2912/2912 PASS, 0 FAIL
flaky-recovered: 1
  Recovered cells (passed only after retry):
    AdminCompaniesManager/Default × en × mobile-375 (retries: 1)
```

- `NavigationMenu/MobileOpen` × all 4 locales × all 5 `<640` viewports → `popupBottomSheetAtMobile:
  true` — the 20-cell pre-fix FAIL is now 0.
- **0 new regressions** vs. the 2892/2912 baseline (the 20 prior FAILs are exactly the 20 now
  passing). The single flaky-recovered cell (`AdminCompaniesManager/Default`) is unrelated to
  this change (different story, different primitive) and recovered on retry — consistent with
  prior sessions' tolerated flake (Task 418/419/420).

## 5. Self-validation

- `tsc` → exit 0, no errors (`scripts/task422-tsc.txt`).
- `npm run lint` → exit 0, clean (`scripts/task422-lint.txt`).
- `npm run check:design-tokens` → 0 violations (`scripts/task422-design-tokens.txt`).
- `npm run build-storybook` → succeeded ×2 (post-AC1 fix, post-AC3 fix), no Tailwind warnings.
- `npm run screenshots:assert` (full, 2912 cells) → 2912/2912 PASS, 0 FAIL, 1 flaky-recovered
  (unrelated).

### Clause-14 integrity (touched files)

| File | Size | NUL bytes | BOM |
|---|---|---|---|
| `src/components/ui/mobile-bottom-sheet.ts` | 1728 | 0 | none |
| `src/components/ui/navigation-menu.tsx` | 8210 | 0 | none |

Both files compile cleanly (`tsc`/`build-storybook`/`lint` all pass).

## 6. Diagnostic script

`scripts/task422-diagnose-navmenu.mjs` — standalone Playwright diagnostic (serves
`storybook-static/` on port 6099, dumps `getBoundingClientRect()` + computed styles for the
NavigationMenu Positioner/Popup at 320×720). Not part of the harness or `package.json` scripts;
kept as investigation evidence alongside other per-task `scripts/taskNNN-*.mjs` proof scripts
from prior sessions (Task 404/414/415/416/417 follow the same pattern).

---

## 7. Files Changed

| File | Change |
|---|---|
| `src/components/ui/mobile-bottom-sheet.ts` | AC1: `MOBILE_POSITIONER` rewritten from Tailwind v3 `!`-prefix to v4 `!`-suffix important syntax (8 utilities). Comment updated. No other tokens changed. |
| `src/components/ui/navigation-menu.tsx` | AC3: added `"max-sm:max-w-none!"` to `NavigationMenuPositioner`'s className (alongside `MOBILE_POSITIONER`), with an inline comment explaining why `max-w-(--available-width)` needs an `<640px` override. No other class/control/handler change. |
| `scripts/task422-diagnose-navmenu.mjs` | **New** — diagnostic-only Playwright script (not in harness/package.json), kept as investigation evidence. |
| `docs/backlog.md` | "Last Session" updated to summarize Task 422; Task 422 marked done, queue advanced to Epic JJ 408. |
| `docs/sessions/2026-06-13-task422-mobile-positioner-v4-syntax-navmenu.md` | **New** — this session log. |

---

## 8. Confirmations

- **Out-of-scope respected**: only the 2 shared popup-primitive files touched (`mobile-bottom-sheet.ts`,
  `navigation-menu.tsx`); no product/admin/listing surface touched; `FULL_WIDTH_TOLERANCE` (8px)
  unchanged; no assertion logic in `scripts/check-stories-rendered.mjs` modified.
- **All 6 popup primitives re-verified** in the full 2912-cell run: Select, Popover, DropdownMenu,
  Command, Sheet, NavigationMenu — all PASS (e) at all `<640` viewports × all 4 locales.
- **0 new regressions** — 2892/2912 → 2912/2912; the 20 prior FAILs are exactly the 20 now PASS.
- **No `git add`/`git commit` run** (single-writer rule) — orchestrator to review diff and emit
  explicit-path commit commands.

Self-validation: `tsc`=0 · `lint` clean · `check:design-tokens` 0 violations · `build-storybook`
clean (×2) · full `screenshots:assert` 2912/2912 PASS, 0 FAIL, 1 unrelated flaky-recovered ·
clause-14 integrity clean on both touched files · scope=clean.

---

## 9. Evidence addendum (AC2 explicit uk cells + AC5 literal grep)

### AC2 — explicit uk stress cells (NavigationMenu/MobileOpen, post-fix `screenshots:assert`)

Source: `.screenshots/rendered-assert/2026-06-13T07-00/manifest.json`.

```
NavigationMenu/MobileOpen × uk × mobile-320 — popupBottomSheetAtMobile: true → PASS
NavigationMenu/MobileOpen × uk × mobile-375 — popupBottomSheetAtMobile: true → PASS
NavigationMenu/MobileOpen × uk × mobile-390 — popupBottomSheetAtMobile: true → PASS
```

### AC5 — literal consumer enumeration (both tokens)

```
$ grep -rn "MOBILE_POSITIONER\|MOBILE_POPUP" src/components/ui/
src/components/ui/dropdown-menu.tsx:7:import { MOBILE_POSITIONER, MOBILE_POPUP, MOBILE_SLIDE_ANIMATION, DRAG_HANDLE_WRAPPER, DRAG_HANDLE_BAR } from "@/components/ui/mobile-bottom-sheet"
src/components/ui/dropdown-menu.tsx:38:        className={cn("isolate z-50 outline-none", MOBILE_POSITIONER)}
src/components/ui/dropdown-menu.tsx:51:            MOBILE_POPUP,
src/components/ui/mobile-bottom-sheet.ts:14:export const MOBILE_POSITIONER =
src/components/ui/mobile-bottom-sheet.ts:22:export const MOBILE_POPUP =
src/components/ui/mobile-bottom-sheet.ts:27: * Combines with MOBILE_POPUP on the same element.
src/components/ui/navigation-menu.tsx:5:import { MOBILE_POSITIONER, MOBILE_POPUP, DRAG_HANDLE_WRAPPER, DRAG_HANDLE_BAR } from "@/components/ui/mobile-bottom-sheet"
src/components/ui/navigation-menu.tsx:113:          MOBILE_POSITIONER,
src/components/ui/navigation-menu.tsx:115:          // viewport width even with MOBILE_POSITIONER's inset-x-0!/w-auto! —
src/components/ui/navigation-menu.tsx:126:          MOBILE_POPUP,
src/components/ui/popover.tsx:7:import { MOBILE_POSITIONER, MOBILE_POPUP, MOBILE_SLIDE_ANIMATION, DRAG_HANDLE_WRAPPER, DRAG_HANDLE_BAR } from "@/components/ui/mobile-bottom-sheet"
src/components/ui/popover.tsx:37:        className={cn("isolate z-50", MOBILE_POSITIONER)}
src/components/ui/popover.tsx:46:            MOBILE_POPUP,
src/components/ui/select.tsx:7:import { MOBILE_POSITIONER, MOBILE_POPUP, MOBILE_SLIDE_ANIMATION, DRAG_HANDLE_WRAPPER, DRAG_HANDLE_BAR } from "@/components/ui/mobile-bottom-sheet"
src/components/ui/select.tsx:110:        className={cn("isolate z-50", MOBILE_POSITIONER)}
src/components/ui/select.tsx:124:            MOBILE_POPUP,
```

`mobile-bottom-sheet.ts` itself is the definition module (not a consumer). The 4 actual token consumers are
`dropdown-menu.tsx`, `navigation-menu.tsx`, `popover.tsx`, `select.tsx`.

Per-consumer assertion (e), before fix → after fix:
  select.tsx          PASS → PASS
  popover.tsx         PASS → PASS
  dropdown-menu.tsx   PASS → PASS
  navigation-menu.tsx FAIL (20 cells) → PASS

`command.tsx` and `sheet.tsx` are intentionally **not** `MOBILE_POSITIONER`/`MOBILE_POPUP` consumers — they
implement their own/inherited bottom-sheet mechanism (per §2 above) and were already verified passing (e) in
the full 2912-cell matrix. No fabricated rows for them here.

---

## Files Changed (addendum)

| File | Change |
|---|---|
| `docs/sessions/2026-06-13-task422-mobile-positioner-v4-syntax-navmenu.md` | Appended `## 9. Evidence addendum` — literal uk@320/375/390 `NavigationMenu/MobileOpen` cells (AC2) and raw both-token `MOBILE_POSITIONER\|MOBILE_POPUP` grep with per-consumer before→after for the 4 actual consumers + note on Sheet/Dialog/Command (AC5). Documentation only, no code/script/config changes. |
