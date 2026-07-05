# Task 546 — ScrollArea primitive → TailAdmin (Sprint 40 / Epic MM Phase-1 · P1.26)

**Executor: direct execution, no separate orchestrator layer in this session.**

## Summary

New canonical Mantine `ScrollArea` primitive (`theme.ts` override) + `Mantine/Primitives/ScrollArea` story.
Primitive + story only, zero consumer migration (Phase 2), per the P1.23/P1.24/P1.25 precedent.

**Step 0 extraction result: positive — the `.custom-scrollbar` utility found in the zip** (`css/style.css`,
58 occurrences across dropdown lists, table `overflow-x-auto` wrappers, the image-generator chat pane):

```css
.custom-scrollbar {
  &::-webkit-scrollbar { width: calc(var(--spacing) * 1.5); height: calc(var(--spacing) * 1.5); }
  &::-webkit-scrollbar-track { border-radius: calc(infinity * 1px); }
  &::-webkit-scrollbar-thumb { border-radius: calc(infinity * 1px); background-color: var(--color-gray-200); }
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #344054; }
```

- **Thickness = 6px** (`--spacing: 0.25rem` confirmed → `calc(var(--spacing)*1.5)` = 6px, both axes).
- **Thumb color = gray-200 `#e4e7ec`** (same token as §6o Divider). Dark thumb `#344054` (gray-700) — **N/A**:
  `MantineRootProvider.tsx` is light-only (`defaultColorScheme="light"`, owner requirement), so the dark rule
  never applies.
- **Track = transparent** (no `background-color` in the track rule).
- **Radius = fully rounded** (Tailwind's "infinity" radius utility).

Full record: `docs/tailadmin-style-reference.md` §6p.

**Mechanism reconciliation (native vs. overlay, resolved per the kickoff's explicit instruction):**
TailAdmin styles the NATIVE `::-webkit-scrollbar`; Mantine's `ScrollArea` hides the native scrollbar
entirely (`scrollbar-width:none` + `::-webkit-scrollbar{display:none}`) and renders its own overlay
scrollbar DOM. Verified per-part against the compiled `ScrollArea.mjs`/`ScrollArea.module.css` (not
assumed, per the §6o Divider lesson):
- **Thickness** — reachable via the real `scrollbarSize` prop (`ScrollArea.mjs`'s own `varsResolver` sets
  `--scrollarea-scrollbar-size: rem(scrollbarSize)`). `theme.ts`: `defaultProps: { scrollbarSize: 6 }`.
- **Radius — ZERO-OVERRIDE.** The module's own thumb rule reads `border-radius:
  var(--scrollarea-scrollbar-size)` — i.e. the SAME value as thickness. At 6px this clamps to a full pill
  automatically (radius exceeds half the bar's own thickness) — a geometric certainty, not an invented value.
- **Track — ZERO-OVERRIDE.** Already `background-color: transparent` at rest (Mantine adds a hover-only
  gray-0/dark-8 tint, a UX affordance with no §6p token to override it with — kept).
- **Thumb color — NOT reachable via `vars`/`defaultProps`.** Hardcoded as a plain rule on the compiled
  module class (`:where([data-mantine-color-scheme='light']) .m_d8b5e363{background-color:rgba(0,0,0,.4)}`)
  — same "hardcoded on the component's own stylesheet" category as §6n Skeleton. Fixed via a new
  `scrollarea-chrome.css` targeting the static `.mantine-ScrollArea-thumb` class Mantine always emits
  (`getStaticClassNames`, confirmed default-on), imported after `@mantine/core/styles.css` in both
  `layout.tsx` and `.storybook/preview.tsx` (equal-specificity source-order win, same proven mechanism as
  `input-chrome.css`'s Switch-track/SegmentedControl-label overrides).

**Rendered proof (Playwright against the built story, `getComputedStyle`):**
```
thumbColor: rgb(228, 231, 236)                   (#e4e7ec, gray-200 — matches §6p)
thumbRadius: 6px, scrollbarWidth: 6px             (radius == thickness → full pill, zero-override confirmed)
trackBg: rgba(0, 0, 0, 0)                         (transparent, zero-override confirmed)
--scrollarea-scrollbar-size: calc(0.375rem * 1)   (6px, from theme.ts defaultProps.scrollbarSize=6)
```

**Loader-allowlist: verified NOT needed** (same empirical-verification discipline as Task 544/545, not
copied forward — a scrollbar is a different DOM shape again). All 6 `loaderPresent` signals `false` on the
built story. `LOADER_ALLOWLIST` UNCHANGED. Documented in `storybook-governance.md` §14.9.14.

**i18n** — every visible caption/content string in the story is `storyT`-driven against
`storybook.mantine.*` with full sq/en/uk/it parity (6 new keys: `scrollarea_vertical_caption`,
`scrollarea_vertical_item`, `scrollarea_horizontal_caption`, `scrollarea_horizontal_item`,
`scrollarea_empty_caption`, `scrollarea_empty_content`), 2087→2093 keys. `check:stories` Check 10 confirms
0 violations.

**Story states:** (1) vertical — fixed `h=180` box, 10 stacked lines, `scrollbars="y"`; (2) horizontal —
`w="100%"` root (never intrinsic-width), 8 fixed-width (`miw=140`) chips in a `nowrap` `Group`,
`scrollbars="x"`; (3) negative — short content that fits, no phantom thumb. `type="always"` on all three so
the thumb reliably paints for the static headless-capture screenshot (no hover simulation available). No
`xy` state added — two independent single-axis demos already exercise both directions of the same §6p
tokens; a combined demo would add no new value.

## Consumer audit (expected zero — confirmed)

`grep -rl "@/components/ui/scroll-area" src` → **0 consumers.** Matches the kickoff's stated expectation.

**Raw-Mantine `ScrollArea` usages checked for regression (no other primitive regressed):**
- `Tabs.stories.tsx` / `SegmentedControl.stories.tsx` — both pass an explicit `scrollbarSize={0}` (swipe-scroll,
  invisible scrollbar by design). Explicit props always win over `theme.components.ScrollArea.defaultProps`
  in Mantine's `useProps` merge, so the new `scrollbarSize:6` default and the thumb-color chrome rule have
  **zero visual effect** on these two consumers — confirmed by inspecting the story source, not assumed.
- `MantineDataTableToCards.tsx` (desktop table wrapper, plain `<ScrollArea>`, no explicit props) — DOES
  inherit the new 6px/gray-200 default. This is the intended effect (the whole point of the primitive slice),
  not a regression; its story (`Table.stories.tsx`) rendered clean in the native gate (content doesn't
  overflow at the tested widths, so no visible scrollbar either way).

## Mobile <640 full-width gate (clause 11)

ScrollArea root is `w="100%"` — full-width by default, no fixed px that clips at 320. The scrollbar itself
(6px overlay bar) is intrinsic-width chrome — documented exemption, same class as Separator's vertical-rule/
Skeleton's circle exemption. `≥44px` tap-target N/A — non-interactive (thumb is drag-only chrome, not a
focusable control). **No document h-scroll at 320 in any locale** — confirmed both by the native gate
(`noHorizontalOverflow: true` on all 16 cells) and the planted-violation transcript below (which proves the
gate would catch it if it ever leaked).

## Gates

```
npx tsc --noEmit                     → 0 errors
npm run check:stories                → PASSED, 102 files, 0 violations
npm run check:i18n                   → PASSED, 4 locales, 2093 keys (6 new)
npm run check:mojibake               → 0 artifacts, 1568 files
npm run check:design-tokens --strict → 0 violations, 395 files scanned
npm run check:file-integrity         → PASSED, 10 files clean
npm run build-storybook              → built clean (3x: initial, planted, reverted)
npm run screenshots:assert -- --mantine-only → 430/448 PASS, 0 FAIL, 18 AMBIGUOUS (pre-existing Task 538
                                        set, unchanged — 16 Combobox ambiguous-overlap + 2 Tabs swipe)
```

## Planted-violation transcript (AC5)

Planted `<div data-testid="task546-planted-overflow" style={{width:900, height:12}} />` at the top of the
story (temporary). Full native gate:

```
Results: 418/448 PASS, 12 FAIL, 18 AMBIGUOUS
❌ Failed cells:
  Mantine/Primitives/ScrollArea/Default × {sq,en,uk,it} × {mobile-320,mobile-375,mobile-390}
    ✗ noHorizontalOverflow: false (document-level h-scroll)
```

Exactly the expected 12 cells; desktop-1024 correctly unaffected (900px div doesn't overflow at 1024px).
Reverted (`grep -n "planted"` → 0 matches), rebuilt, reconfirmed green: **430/448 PASS, 0 FAIL, 18
AMBIGUOUS** (identical to the pre-plant baseline).

## Regression (clause 15)

`grep -in scrollarea docs/critical-flow-registry.md` → 0 matches, no registered critical flow touched.
Theme-only + new-file change scoped to `ScrollArea`; no other primitive's `theme.ts` block or story
modified.

## Files Changed

| File | Change | Why |
|---|---|---|
| `src/design-system/mantine/theme.ts` | New `ScrollArea: { defaultProps: { scrollbarSize: 6 } }` block + comment | Fixes the one reachable §6p divergence (thickness); radius/track already zero-override |
| `src/design-system/mantine/scrollarea-chrome.css` | New file — `.mantine-ScrollArea-thumb` gray-200 override | Thumb color hardcoded on Mantine's compiled module class, not reachable via `vars`/`defaultProps` (§6p) |
| `src/app/layout.tsx` | Import `scrollarea-chrome.css` after `skeleton-chrome.css` | Wires the chrome file into the app (source-order override) |
| `.storybook/preview.tsx` | Import `scrollarea-chrome.css` after `skeleton-chrome.css` | Wires the chrome file into Storybook (same source-order override) |
| `src/stories/mantine/primitives/ScrollArea.stories.tsx` | New file — `Default` story: vertical/horizontal/empty states | Required rendered-proof surface, AC2 |
| `messages/en.json`, `sq.json`, `uk.json`, `it.json` | 6 new `storybook.mantine.scrollarea_*` keys each | i18n parity for the story's visible content |
| `docs/tailadmin-style-reference.md` | New `## 6p.` section | Step 0 extraction record + native-vs-overlay mechanism decision, AC1 |
| `docs/storybook-governance.md` | New `§14.9.14` | Records the verified "no loader-allowlist needed" finding + rendered §6p proof (AC3) |
| `docs/mantine-tailadmin-migration-tracker.md` | P1.26 row updated ⬜ → 🟡 Task 546 | Tracker accuracy |
| `docs/backlog.md` | Last Session + Task 546 status line updated | Tidy rule |
| `docs/backlog-archive.md` | Task 545's prior Last-Session entry archived (1 row, top) | Tidy rule |
| `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` | Auto-regenerated by `screenshots:assert` (final clean run) | Standing auto-generated artifact |

No product/consumer file touched (zero consumers exist for `scroll-area.tsx`, confirmed above).

## AC-by-AC self-audit

| # | AC | Status | Evidence |
|---|----|--------|----------|
| 1 | New §6p row extracted FIRST, thumb/track/thickness/radius cited + mechanism decision recorded, `globals.css` untouched | ✅ | `tailadmin-style-reference.md` §6p — positive extraction from `.custom-scrollbar`, native-vs-overlay reconciliation recorded; `globals.css` not modified (confirmed no diff) |
| 2 | `theme.ts` handling + story (vertical/horizontal states, `storyT` i18n parity) render matching reference at ≥640/320 × 4 locales, no document h-scroll | ✅ | `defaultProps.scrollbarSize=6` + `scrollarea-chrome.css`; rendered proof `#e4e7ec`/6px/6px-radius/transparent-track; native gate 430/448 PASS, all 16 ScrollArea cells `noHorizontalOverflow:true` |
| 3 | `LOADER_ALLOWLIST` verified empirically — UNCHANGED, no assumption copied forward | ✅ | §14.9.14 — all 6 signals false, verified independently via Playwright against the built story |
| 4 | Consumer audit in session log (expect zero; migrate zero); no other primitive regressed | ✅ | 0 consumers of legacy `scroll-area.tsx`; Tabs/SegmentedControl unaffected (explicit `scrollbarSize={0}` wins over the new default); `MantineDataTableToCards` inherits the new default by design, not a regression |
| 5 | Rendered `--assert` matrix + planted-violation transcript; all light gates green | ✅ | Both transcripts above; all 6 light gates green |
| 6 | Session log: Files-Changed, AC self-audit, `Self-validation:` line; no git run | ✅ | This file; no `git` command executed |

## Self-validation

Self-validation: all 6 ACs met with rendered-gate evidence. Step 0 extraction found real `.custom-scrollbar`
zip markup (58 occurrences) rather than falling back to an honest-negative — resolved thickness (6px),
thumb color (gray-200), track (transparent), and radius (fully rounded) all with exact zip citations. The
native-vs-overlay mechanism reconciliation was worked through per-part against Mantine's compiled
`ScrollArea.mjs`/`ScrollArea.module.css` (not assumed): thickness and radius turned out to share the SAME
CSS variable, so setting `scrollbarSize` alone resolves both — a genuine zero-override finding, not a
copy-paste of the Skeleton/Divider precedent. Thumb color needed the `-chrome.css` mechanism (Skeleton's
category), confirmed via rendered `getComputedStyle`, not assumed. Loader-allowlist assumption was
independently re-verified via Playwright against the actual built story, not copied forward. Planted-
violation transcript proves the gate still catches a real document-overflow defect on this surface (12/12
expected cells FAILed, desktop-1024 correctly unaffected, reverted clean). Final native gate: 430/448 PASS,
0 FAIL, 18 AMBIGUOUS (identical to the pre-existing Task 538 baseline). Zero product/consumer file touched;
the two existing raw-Mantine swipe-scroll consumers (Tabs/SegmentedControl) are provably unaffected because
they pass an explicit `scrollbarSize={0}` that overrides the new theme default outright.
**HELD — no git commands run; awaiting review + explicit-path commit emission.**
