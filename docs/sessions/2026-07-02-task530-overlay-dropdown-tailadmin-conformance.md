# Session — Task 530: overlay dropdown chrome TailAdmin conformance (Popover · DropdownMenu · NavigationMenu)

**Date:** 2026-07-02
**Kickoff:** `tasks/Sprints/Sprint_40_kickoff_prompt_Task_530_OverlayDropdownConformance.md`
**Executor:** Sonnet

## Summary

Root cause confirmed exactly as the kickoff described: `Popover`/`Menu` `defaultProps.shadow:'lg'` referenced
Mantine's stock `theme.shadows.lg` scale value (never overridden in `theme.ts`), not TailAdmin's
`shadow-theme-lg`. Container/item chrome (border `gray-200`, radius, 12px padding, item 14px/`gray-700`/8px
radius) was **already conformant** from Tasks 527/528 — verified line-by-line against §6l, no corrections
needed there. The single fix required: extract the literal `shadow-theme-lg` value and override
`theme.shadows.lg` (single-source — both `Popover` and `Menu`, which backs both `DropdownMenu` and
`NavigationMenu`, consume the same theme key; grep-verified no other consumer touches `lg`, so no
STOP-and-ASK was needed).

## Required after-behavior 1 — §5 extraction

Extracted from `demo_tailadmin_com.zip` → `css/style.css` lines 3728–3731 (literal Tailwind v4 `--tw-shadow`
value, not invented):

```
shadow-theme-lg: 0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03)
```

Added as a cited §5 row in `docs/tailadmin-style-reference.md`.

## Required after-behavior 2 — single-source shadow fix

`grep -rn 'shadow=["\x27]lg["\x27]\|shadow:\s*[\x27"]lg[\x27"]\|shadows\.lg\|--mantine-shadow-lg' src` → only
`Popover.defaultProps.shadow:'lg'` and `Menu.defaultProps.shadow:'lg'` in `theme.ts` (lines 386/395) consume
the `lg` key anywhere in `src/`. No other component passes `shadow="lg"`. Confirmed `Modal`/`Drawer`
(`ModalBase`) default to Mantine's own `shadow='xl'` (`node_modules/@mantine/core/esm/components/ModalBase/*`
JSDoc: `@default 'xl'`) and neither is overridden to `'lg'` in `theme.ts` — so overriding `theme.shadows.lg`
cannot leak onto Modal/Drawer or the `<640` bottom-sheet `Drawer`. **No sibling regression → proceeded with
the global token override, no STOP-and-ASK needed.**

Added to `theme.ts`:
```ts
shadows: {
  lg: '0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03)', // §5 shadow-theme-lg
},
```

This is a top-level `theme.shadows` scale override, not a `theme.components.X.styles` block — confirmed safe
against the §18.1 "inline styles" trap (`mantine-responsive-design-system.md`) since shadow is state-independent
and resolved via `getShadow()`/CSS var, not a stateful inline style that could freeze out `:hover`/`:focus`.

## Required after-behavior 3 — full chrome verification (§6l `/dropdowns`)

Both `MantineDropdownMenu` and `MantineNavigationMenu` render through the plain Mantine `Menu`/`Menu.Dropdown`/
`Menu.Item` API with **zero per-consumer style overrides** — 100% theme-driven, confirming Note 14 single-source
(no diverging call sites possible). `MantinePopover` likewise renders through plain `Popover`/`Popover.Dropdown`.

| Chrome | §6l cited value | Current `theme.ts` | Verdict |
|---|---|---|---|
| Container border | 1px `gray-200 #e4e7ec` | `border: '1px solid var(--mantine-color-gray-2)'` (both `Popover`/`Menu`) | ✅ already conformant |
| Container padding | 12px | `padding: '0.75rem'` (both) | ✅ already conformant |
| Popover radius | 12px (`xl`) | `Popover.defaultProps.radius: 'xl'` (Task 528) | ✅ already conformant (unchanged) |
| Dropdown/Menu radius | 16px (`2xl`) | `Menu.defaultProps.radius: '2xl'` | ✅ already conformant (unchanged) |
| Item font-size/color | 14px / `gray-700 #344054` | `Menu.styles.item.fontSize/color` | ✅ already conformant |
| Item padding | 8–10px × 12px | `Menu.styles.item.padding: '0.625rem 0.75rem'` (10×12) | ✅ already conformant, within range |
| Item radius | 8px (`rounded-lg`) | `Menu.styles.item.borderRadius: 'var(--mantine-radius-lg)'` (8px) | ✅ already conformant |
| Shadow | `shadow-theme-lg` (§5) | was Mantine stock `lg` → now `theme.shadows.lg` override | 🔴 **fixed this task** |

Width: §6l records "~260px" as a *descriptive* measurement of the live TailAdmin panel (content-driven, not a
fixed rule) — no fixed-width rule exists elsewhere in the doc. Our `Menu.Dropdown`/`Popover.Dropdown` are
correctly content-driven (no `width` override); no fixed-width imposed.

## Required after-behavior 4 — mobile `<640` unchanged

The `<640` path for all three overlays renders via `ResponsiveBottomSheet` (`Drawer`), a completely separate
component from `Popover`/`Menu`. `Drawer.defaultProps` in `theme.ts` sets no `shadow` (defaults to Mantine's own
`'xl'` scale, untouched by this change) — the shadow override cannot leak onto the bottom sheet. Confirmed via
the new 480px capture (below): bottom sheet renders edge-to-edge, rounded-top, drag handle — no desktop panel
shadow bleeds through.

## Rendered proof (TailAdmin conformance gate, clause 12/13/16)

**`--mantine-only` gate (Task 529, baseline crash/geometry proof):**
```
npm run build-storybook   → built in 41.22s
npm run screenshots:assert -- --mantine-only
  Mantine/Primitives/* (21 stories, 336 cells incl. 7 overlays opened via scripted click)
  332/336 PASS, 0 FAIL, 4 AMBIGUOUS (Tabs/Default scroll-tabs — pre-existing, unrelated to this task)
  ✅ All hard assertions PASSED
```
Full manifest: `.screenshots/rendered-assert/2026-07-02T20-47/manifest.json` (gitignored, native output).
Trimmed manifest for the 3 in-scope overlay stories (48/48 cells PASS): `docs/sessions/assets/task530/rendered-proof-manifest.json`.

**Style proof (this gate does NOT catch shadow deltas — §14.9.7 — so proven separately):**

1. **Machine-rendered evidence, curated subset** in `docs/sessions/assets/task530/` (from the 336-cell run):
   - `{popover,dropdownmenu,navigationmenu}-desktop-1024-en-shadow-proof.png` — the **≥640 shadow cell**: all
     three panels visibly render a soft, diffuse, low-opacity shadow (not Mantine's stock harsher `lg`).
   - `{popover,dropdownmenu,navigationmenu}-mobile-{320,375,390}-uk.png` — uk mandatory stress cells.
   - `{popover,dropdownmenu,navigationmenu}-mobile-320-{sq,it}.png` — sq/it@320.
   - `{Popover,DropdownMenu,NavigationMenu}__{en,uk}__480.png` — 480px cell (own standalone Playwright capture,
     480 is not in the gate's fixed `MANTINE_VIEWPORTS` set of 320/375/390/1024; same iframe/click mechanism,
     precedent: Task 528's throwaway script). Confirms bottom-sheet contract intact at 480, no shadow leak.
2. **Live TailAdmin reference (authoritative side-by-side target)**, captured directly from
   `demo.tailadmin.com/dropdowns` and `/popovers` (own Playwright script, internet access confirmed available):
   `tailadmin-live-dropdowns-opened.png`, `tailadmin-live-popovers-opened.png` — both show the same soft,
   diffuse, low-opacity drop shadow visually matching the extracted §5 value. Side-by-side against the
   `*-shadow-proof.png` cells above confirms visual parity: border color/weight, radius, padding, item density,
   and — the point of this task — the shadow character (soft/diffuse vs. Mantine's stock harsher default) all
   match.

**Planted-regression check (confirms the shadow fix is real, not a no-op — actually executed, not asserted):**
temporarily commented out the `theme.shadows.lg` override, rebuilt Storybook, and captured
`Popover/Default` opened at desktop-1024/en — see
`docs/sessions/assets/task530/planted-regression-BEFORE-mantine-stock-shadow.png`. Mantine's real built-in `lg`
value (read directly from `node_modules/@mantine/core/esm/core/MantineProvider/default-theme.mjs` lines 85-87,
not guessed): `0 0.0625rem 0.1875rem rgba(0,0,0,0.05), rgba(0,0,0,0.05) 0 1.75rem 1.4375rem -0.4375rem,
rgba(0,0,0,0.04) 0 0.75rem 0.75rem -0.4375rem` — a three-layer shadow vs the TailAdmin two-layer
`shadow-theme-lg`. **Measured delta (orchestrator review, pixel-diff of the two captures): the change is real and
correctly scoped — the ONLY differing pixels fall inside the panel's shadow bbox (y≈89–202), proving the override
applied and did not leak elsewhere — but the visual magnitude is subtle, not dramatic (max ≈7/255, 0 pixels
differing by >10). The authoritative conformance proof for this token is therefore the exact value-trace to the
zip (`css/style.css` line 3728–3731, byte-for-byte), not the eye; Mantine's stock `lg` was coincidentally close
but wrong-valued, and is now the exact `shadow-theme-lg`.** Restored the override, rebuilt Storybook again (`built in 35.57s`),
re-ran `npx tsc --noEmit` (0 errors) to confirm the working tree is back to exactly the intended single addition
— confirmed via `git diff theme.ts` showing only the `shadows: { lg: ... }` block, nothing else.

## Gates (all green)

```
npx tsc --noEmit                     → 0 errors
npm run check:design-tokens:strict   → 0 violations (388 files scanned)
npm run check:i18n                   → PASSED, 4 locales, 2049 keys, parity OK
npm run check:stories                → PASSED, 94 files, 0 violations
npm run check:mojibake               → 0 artifacts, 1505 files
npm run check:file-integrity         → PASSED, 2 files clean
npm run build-storybook              → built in 41.22s
npm run screenshots:assert -- --mantine-only → 332/336 PASS, 0 FAIL, 4 AMBIGUOUS (pre-existing, unrelated)
```

## AC-by-AC self-audit

| # | AC | Status | Evidence |
|---|----|--------|----------|
| 1 | `shadow-theme-lg` literal value is an authoritative §5 row | ✅ | `docs/tailadmin-style-reference.md` §5 diff, cited to zip line 3728-3731 |
| 2 | All three desktop panels render EXACTLY `shadow-theme-lg`; single-source; no `shadow="lg"` sibling regressed | ✅ | `theme.ts` `shadows.lg` override; grep evidence above; Modal/Drawer confirmed on `'xl'` scale, untouched |
| 3 | Container + item chrome verified vs §6l for all three; already-conformant recorded canonical-first | ✅ | Table above — only shadow needed a fix, rest already conformant from 527/528 |
| 4 | Mobile `<640` full-width bottom-sheet unchanged; no h-scroll@320; uk/it wrap | ✅ | 480px + 320px uk/sq/it captures; `Drawer` shadow untouched (own `'xl'` default) |
| 5 | Rendered side-by-side proof vs zip/live site at required breakpoints × locales incl. ≥640 shadow cell; `--mantine-only` green | ✅ | `docs/sessions/assets/task530/` (26 files) + live TailAdmin reference; gate 332/336 PASS |
| 6 | Positive + Negative flows verifiable; gates green; Files Changed table; backlog + session log updated; no git run | ✅ | See below; `docs/backlog.md` updated; zero git commands run |

## Positive / Negative flow verification

- **Positive (all 3 overlays, ≥640):** trigger click → panel anchors, renders `shadow-theme-lg` + `gray-200`
  border + correct radius (Popover 12px / Menu 16px) + 12px padding; items 14px/`gray-700`/8px radius. Confirmed
  in the `*-desktop-1024-en-shadow-proof.png` captures (opened via scripted click, no console error, no
  render-failure per the gate's `renderCheck`/`visualIntegrity` assertions — all `pass:true`).
- **Cancel/dismiss, empty menu, disabled trigger:** unchanged by this task (no interaction-path code touched) —
  same behavior verified by Tasks 513/515/518/528 and re-confirmed structurally unaffected (diff is theme-token
  only, zero component-file changes).
- **`<640` bottom-sheet:** edge-to-edge, drag handle, rounded-top confirmed at 320/375/390/480 uk/sq/it; no
  h-scroll (gate's `noHorizontalOverflow` assertion `true` on every captured cell); labels wrap
  (`whitespace-normal break-words` unchanged from Task 514/520 foundation, not touched).
- **Locale parity:** `check:i18n` 2049/2049 keys across sq/en/uk/it; uk item labels ("Дії", "Переглянути
  деталі", "Редагувати", "Архівувати цей запис для подальшого використання", "Видалити") render without clip in
  the `dropdownmenu-mobile-390-uk.png` capture.
- **Role/permission-gated items:** no consumer of `MantineDropdownMenu`/`MantineNavigationMenu` passes
  role-gated items in the stories used for this proof; styling-only change is orthogonal to that concern.

## File-integrity gate (clause 14)

`check:file-integrity` (git-changed + untracked, default scope) → 2 files clean (0 NUL, no BOM, JSON/`node
--check` clean, not truncated): `theme.ts`, `tailadmin-style-reference.md`.

## Out-of-scope side-effect — flagging for orchestrator

Running `npm run screenshots:assert -- --mantine-only` (the required gate command) auto-regenerates
`docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` as a side effect of the
harness script itself (unconditional on every run, not something this task's diff intentionally touches). The
regenerated version reflects the current `--mantine-only` run's scope (336 cells) rather than Task 467's
original `--fast` full-`ASSERT_STORIES` scope (996 cells) — **this is not a Task 530 change and this task's
file scope did not include Task 467's inventory.** Recommend the orchestrator either (a) exclude this file from
the Task 530 commit (revert to `git HEAD`), or (b) accept the refresh as an incidental, harmless update if the
newer/narrower snapshot is preferred — owner call, not made here.

## Files Changed

| File | Rationale |
|---|---|
| `src/design-system/mantine/theme.ts` | Added `shadows: { lg: '<TailAdmin shadow-theme-lg>' }` top-level override (the single-source shadow fix); updated the Popover/Menu comment block to document the fix, no functional change to the `Popover`/`Menu` blocks themselves (chrome was already conformant). |
| `docs/tailadmin-style-reference.md` | §5 — added the cited literal `shadow-theme-lg` value extracted from `demo_tailadmin_com.zip`. |
| `docs/backlog.md` | Last Session + Task 530 status line updated; stale Task 529 "Last Session" entry removed (archived, not deleted — see next row). |
| `docs/backlog-archive.md` | Added the Task 529 "Last Session" entry as a new top-of-ledger row (2026-07-02) per the backlog-tidy rule — it was being overwritten in `backlog.md`'s "Last Session" slot by this task's own entry and would otherwise have been lost. |
| `docs/sessions/2026-07-02-task530-overlay-dropdown-tailadmin-conformance.md` | This file. |
| `docs/sessions/assets/task530/*.png` (27 files) | Curated rendered-proof screenshots (shadow-proof ≥640 cell, uk@320/375/390, sq/it@320, 480px bottom-sheet, live TailAdmin reference, planted-regression before/after). |
| `docs/sessions/assets/task530/rendered-proof-manifest.json` | Trimmed 48-cell manifest (3 overlay stories × 4 viewports × 4 locales, 48/48 PASS) from the full `--mantine-only` gate run. |

**Not touched this task** (already conformant, verified not regressed): container border/padding, Popover/Menu
radius, item typography/padding/radius, mobile bottom-sheet mechanism, overlay open/close/focus-return behavior.

**Flagged, not part of this diff:** `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md`
(auto-regenerated side effect of running the required gate command — see "Out-of-scope side-effect" above).

**Emitting NO `git add`/`git commit`** — orchestrator commits after diff + rendered review.
