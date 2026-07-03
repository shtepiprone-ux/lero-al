# Session — Task 533: Pagination primitive → TailAdmin conformance (Sprint 40 · Batch D · P1.13)

**Date:** 2026-07-03
**Kickoff:** `tasks/Sprints/Sprint_40_kickoff_prompt_Task_533_PaginationConformance.md`
**Executor:** Sonnet (this session)

## 🛑 STOP-and-ASK #2/#3 — flagged, not silently resolved

**Trigger #2 (exact 40/42px sizing) + Trigger #3 (≥44px tap target):** measured rendered control size
(desktop cluster, `getComputedStyle`) is **32×32px** — Mantine's own stock `size` dimension, not the §6l-cited
40×40 (active)/42px (prev-next). Per the kickoff's own **pre-authorized default**: *"Default assumption if not
asked: keep chrome size-agnostic, let the consumer's `size` prop govern, and document the pixel delta"* — this
task deliberately did **not** set `size` in `theme.components.Pagination.defaultProps` (doing so would override
`MantineAdminSurfacePattern.tsx`'s responsive `size={isMobile ? 'sm' : 'md'}`, regressing Notes 19/20). The
32px delta from §6l's 40/42px is **pre-existing** — it predates this task (the consumer already passed
`size='sm'/'md'` before this change) and this task's diff does not touch control dimensions at all (verified:
`git diff theme.ts` shows no `size`/width/height in the new blocks).

**However, trigger #3 is real and NOT silently resolved here:** the mobile-compact cluster (`size="sm"`) renders
even smaller than 32px, meaning the tappable control area is below the ≥44px P0 mobile touch-target rule
(`CLAUDE.md` mobile gate) on the admin-table consumer's actual mobile rendering. **This is flagged for the
owner/orchestrator to decide** — per the kickoff's explicit instruction, this task does not unilaterally bump
the tap target (which would require touching `size`, contradicting the "size-agnostic, consumer governs"
constraint the kickoff also mandates) or silently accept it. Recorded here, not resolved.

## Summary

`theme.ts` gained a `Pagination` block (chrome-only, size-agnostic: `color:'brand'`, `radius:'lg'`, `gap:'xs'`)
plus two independently-addressable sub-component overrides, `PaginationNext`/`PaginationPrevious`
(`defaultProps.className: 'mantine-Pagination-edgeControl'`), resolving STOP-and-ASK #1 (edge-control border
selector) via a **stable, non-structural mechanism** rather than a fragile `:first-of-type` CSS guess. A new
`pagination-chrome.css` (mirroring `input-chrome.css`'s pattern) carries the state-dependent chrome (resting,
hover, edge border) that cannot live in `theme.styles` per §18. New `Mantine/Primitives/Pagination` story +
`storybook.mantine.pagination_*` i18n (3 keys × 4 locales). The existing consumer
(`MantineAdminSurfacePattern.tsx`) is untouched and automatically inherits the new chrome.

## DOM/mechanism verification (§18 discipline — read source, not guessed)

Read the compiled Mantine source directly before writing any style:
- `Pagination.mjs`: confirms `Pagination` composes `PaginationFirst/Previous/Next/Last` (edge controls,
  `withPadding:false`) + `PaginationItems` (number controls) + `PaginationDots`, all inside a `Group`.
- `PaginationEdges.mjs`: **`PaginationNext`/`PaginationPrevious` call `useProps("PaginationNext"/"PaginationPrevious", …)`** — independently addressable via `theme.components`, confirmed against `use-props.mjs`
  (`theme.components[component]?.defaultProps` is merged by exact string match). This is how STOP-and-ASK #1
  was resolved: a `defaultProps.className` injected via the theme lands on the rendered `<button>`
  (`PaginationControl.mjs` forwards `className` into `ctx.getStyles("control", { className, … })`) — a
  **stable, explicit selector**, not a structural guess (option (a) in the kickoff, done via an even more
  reliable path than the suggested `:first-of-type`).
- `PaginationRoot.mjs`: confirms `--pagination-active-bg = getThemeColor(color, theme)` — for `color="brand"`
  this resolves to `brand-7` (`#EC5447`, `primaryShade:7`), and `mod:[{active,disabled,'with-padding'}]` sets
  `data-active`/`data-disabled` — matches the kickoff's stated attribute expectations.

## Required after-behavior 1 — theme block

`theme.ts` — `Pagination: { defaultProps: { color:'brand', radius:'lg', gap:'xs' } }` (no `styles` block: a
static/callback `styles.control` would apply identically to active AND inactive controls since Mantine
resolves `data-active` per-control at render time, not from Pagination's top-level props — this is exactly the
§18 pitfall the kickoff warns about, so all state-dependent chrome was routed to `pagination-chrome.css`
instead). `PaginationNext`/`PaginationPrevious` inject the stable `className`.

## Required after-behavior 2 — edge-control border (STOP-and-ASK #1, resolved)

`pagination-chrome.css` — three rules, all scoped with `:not([data-active])` (never fights Mantine's own
active-state rule regardless of stylesheet load order) and `:not(.mantine-Pagination-edgeControl)` on the
plain-number rules (**a real CSS-specificity bug caught and fixed during this session** — see below).

**Specificity bug found + fixed (rendered proof, not assumed):** first implementation had
`.mantine-Pagination-control:not([data-active])` (specificity 0,2,0) unconditionally setting
`background:transparent; border:none`, and a separate `.mantine-Pagination-edgeControl` rule (0,1,0) setting
`background:white; border:1px gray-300`. Since the edge control matches BOTH selectors and the first rule has
**higher** specificity, it won regardless of source order — rendered proof showed edge controls with
transparent bg / no border (WRONG). Fixed by adding `:not(.mantine-Pagination-edgeControl)` to the plain-number
rule, cleanly partitioning "regular number chrome" from "edge chrome" so neither can fight the other. Re-verified
after the fix — see the computed-style table below.

## Rendered/computed-style verification (Playwright `getComputedStyle`, desktop-1024/en, default cluster)

| Control | bg | color | border | radius | fontSize | Matches §6l? |
|---|---|---|---|---|---|---|
| Active (page 5) | `rgb(236,84,71)` = `#EC5447` | white | `1px solid #EC5447` (invisible, Mantine stock) | 8px | 16px (size-driven) | ✅ bg/color/radius |
| Inactive (page 1) | transparent | `rgb(52,64,84)` = `#344054` gray-700 | none | 8px | 14px | ✅ all |
| Prev/Next (edge) | `rgb(255,255,255)` white | `rgb(52,64,84)` gray-700 | `1px solid rgb(208,213,221)` = `#d0d5dd` gray-300 | 8px | 14px | ✅ all |
| Inactive hover | `rgb(249,250,251)` = `#f9fafb` gray-50 | — | — | — | — | ✅ |

All values byte-exact to §6l (`0px 1px 2px…` not applicable here — no shadow cited for Pagination). Disabled
Prev (page-1 boundary cluster): `data-disabled` present, `opacity:0.4` (Mantine's own default dimming), bg/border
unchanged (white/gray-300 retained under the dim) — no clash with §6l, not fought.

## Required after-behavior 3 — story

`src/stories/mantine/primitives/Pagination.stories.tsx` — Mantine proof path, single `Default`, 5 clusters:
default (total=10), mobile-compact (total=50, `siblings=1/boundaries=1/size="sm"`), page-1 boundary (Prev
disabled), last-page boundary (Next disabled), single-page (`total=1`, no crash). `getControlProps`/
`getItemProps` route `aria-label`s through `storyT()` against `storybook.mantine.pagination_*`. Dots have no
aria-label prop in Mantine's `PaginationDots` API (confirmed via its `.d.ts` — decorative ellipsis, not
focusable), so no `aria_dots` key was added — a deliberate simplification of the kickoff's example key list,
not an omission.

## Required after-behavior 4 — i18n

3 keys (`pagination_aria_prev`, `pagination_aria_next`, `pagination_aria_page` with a `{page}` placeholder)
added to `messages/{sq,en,uk,it}.json` under `storybook.mantine.*`. `check:i18n` 2065/2065 parity. The legacy
`ui.pagination` namespace (shadcn compound component) was not touched — confirmed by `git status`, `pagination.tsx`
does not appear in the diff.

## Required after-behavior 5 — scope

Files touched: `theme.ts` (Pagination + PaginationNext + PaginationPrevious blocks), new
`pagination-chrome.css`, its two import sites (`src/app/layout.tsx` + `.storybook/preview.tsx` — mirroring
exactly how `input-chrome.css` is wired), the new story, the new i18n keys, `docs/backlog.md` + this session
log + its assets. No consumer rewrite, no `pagination.tsx` edit, no other theme block touched.

## Positive flow verification

1. Inactive numbers: transparent, gray-700, 8px radius, 8px gaps; hover → gray-50 — confirmed via computed
   styles (table above) and `mantine-primitives-pagination--default__en__desktop-1024.png`.
2. Active page: brand `#EC5447` fill, white text, 8px radius — confirmed (table above), visually matches the
   live TailAdmin `/pagination` reference (`tailadmin-live-pagination.png`, fetched live, side-by-side).
3. Prev/Next: white bg, gray-700, 1px gray-300 border, 8px radius — confirmed (table above), matches the live
   reference's edge buttons.
4. `onChange` wiring unchanged (story uses no-op handlers matching Mantine's own API surface, same as
   `MantineAdminSurfacePattern`'s real `onPageChange`); the consumer's `total`/`value`/`onChange`/`color`/`size`
   props all continue to be accepted (chrome-only diff, zero prop-surface change) — confirmed by reading
   `MantineAdminSurfacePattern.tsx` L111-121 unchanged in the diff.

## Negative flow verification

- **Single page (`total=1`):** renders 3 controls (Prev/1/Next), both edges disabled, no crash — confirmed via
  `page.evaluate()` reading `textContent`/control count on the built story (see devtools-verify output, not
  screenshotted separately but present in the `single page` cluster of every locale/viewport cell).
- **Large total at 320px (mobile stress):** `siblings=1/boundaries=1` cluster confirmed **no h-scroll** at
  320/375/390 × sq/en/uk/it (16 gate cells, all `pass:true`, `noHorizontalOverflow:true`) — dots/ellipsis
  collapse the middle range, matching the compact-control exemption.
- **Disabled/edge boundaries:** page-1 (Prev disabled) and last-page (Next disabled) clusters both render;
  `data-disabled` + `opacity:0.4` dimming confirmed, border/bg treatment preserved under the dim (no clash with
  §6l, not fought — see table above).
- **Locale switch:** `check:i18n` 2065/2065 parity; the story's aria-labels are set via `getControlProps`/
  `getItemProps` closures over `t()`, which itself closes over `context.globals.locale` — switching the
  Storybook toolbar locale re-renders the story with the new locale's aria strings (confirmed structurally —
  the render function re-invokes `t()` fresh on every locale change since `storyT()` reads the passed `locale`
  argument directly, no memoization to go stale).
- **Hover/focus:** inactive hover confirmed gray-50 (table above); keyboard focus ring is Mantine's own
  default (`UnstyledButton` base) — not removed or touched by this diff.

## Mobile <640 gate (clause 11) — compact-control exemption

**Explicitly invoked per clause 11's exemption list:** Pagination is a compact control cluster; the consumer
already centers it via `Group justify="center"` on mobile — it does **not** need `w-full`. Requirement instead:
**no h-scroll at 320** — confirmed (16/16 gate cells `pass:true`, `noHorizontalOverflow:true` across
sq/en/uk/it). The ≥44px tap-target sub-requirement is **NOT met** at the current 32px (`md`)/smaller (`sm`)
control size — flagged at the top of this log as STOP-and-ASK #2/#3, not silently resolved.

## TailAdmin conformance gate (clause 16)

Every value cited to §6l "Pagination" (item gap 8px→`xs`; prev/next white/gray-3-border/gray-7-text/`lg`-radius;
active 40×40-cited/brand/white/`lg`-radius — actual rendered size documented as a pre-existing, pre-authorized
delta; inactive transparent/gray-7/hover-gray-0). `check:design-tokens:strict` 0 violations. Rendered proof:
16 gate cells (320/375/390/1024 × sq/en/uk/it) + the live TailAdmin `/pagination` side-by-side reference, both
in `docs/sessions/assets/task533/`.

## Regression coverage (clause 15)

Scanned `docs/critical-flow-registry.md` — this slice is chrome-only on the `Pagination` primitive consumed by
`MantineAdminSurfacePattern` (admin table paging). **Paging behavior (`onChange`/`value`) is unchanged** — the
diff touches zero logic, only `theme.ts` styling blocks + a new scoped stylesheet; `MantineAdminSurfacePattern.tsx`
itself has zero diff lines. Admin-table pagination is not found as a named row in the critical-flow registry
at time of writing; per the kickoff, no new row is required for a chrome-only change (stated here explicitly).
The enforced rendered gate (Task 529) now auto-covers `Mantine/Primitives/Pagination` going forward (story
count 22→23, cell count 352→368).

## Planted-violation FAIL transcript (proves the gate is real)

**First attempt (did NOT trigger a failure — documented, not hidden):** set `siblings={5} boundaries={5}` on
the mobile-compact cluster, expecting ~20 number controls to overflow at 320px. Gate still reported
**364/368 PASS, 0 FAIL** — because Mantine's internal `Group` wraps by default, so extra controls flowed onto
additional lines instead of ever exceeding the viewport width. This is a genuine negative result, recorded
honestly rather than discarded.

**Second attempt (succeeded):** wrapped the same cluster's `<Pagination>` in `<Box miw={2000}>` — a
hard-pinned 2000px container width guarantees horizontal overflow regardless of internal wrap behavior.
Rebuilt, re-ran:
```
npm run screenshots:assert -- --mantine-only
  Results: 348/368 PASS, 16 FAIL, 4 AMBIGUOUS
  ❌ Failed cells (all 4 locales × 320/375/390/1024 = 16):
    Mantine/Primitives/Pagination/Default × {sq,en,uk,it} × {mobile-320,mobile-375,mobile-390,desktop-1024}
      ✗ horizontal overflow detected
    (+ 4 × [offscreen-control] geometry failures on the Next button at mobile-320, one per locale)
```
Full FAIL manifest: `docs/sessions/assets/task533/planted-violation/fail-transcript-manifest.json`.
Representative FAIL screenshot (uk@320): `docs/sessions/assets/task533/planted-violation/
mantine-primitives-pagination--default__uk__mobile-320.png`.

Reverted the planted violation (removed the `Box miw={2000}` wrapper), rebuilt, re-ran the gate:
**364/368 PASS, 0 FAIL, 4 pre-existing AMBIGUOUS** (Tabs scroll-tabs, unrelated) — confirms the working tree is
restored to exactly the intended state.

## Gates (all green, final clean run)

```
npx tsc --noEmit                     → 0 errors
npm run check:stories                → PASSED, 96 files, 0 violations, storybook.* 500/500 parity
npm run check:i18n                   → PASSED, 4 locales, 2065 keys, parity OK
npm run check:mojibake               → 0 artifacts, 1520 files
npm run check:design-tokens:strict   → 0 violations, 389 files scanned
npm run check:file-integrity         → PASSED, 30 files clean
npm run build-storybook              → built in 33.68s (final clean build)
npm run screenshots:assert -- --mantine-only → 364/368 PASS, 0 FAIL, 4 AMBIGUOUS (pre-existing Tabs, unrelated)
```

## AC-by-AC self-audit

| # | AC | Status | Evidence |
|---|----|--------|----------|
| 1 | `theme.ts` `Pagination` block, size-agnostic, inactive transparent/gray-7/hover-gray-0, active brand+white verified | ✅ | `theme.ts` Pagination block; computed-style table |
| 2 | Prev/Next 1px gray-3 border + white bg per §6l, resolved via stable mechanism (not `:first-of-type` guess) | ✅ | `PaginationNext`/`PaginationPrevious` theme blocks + `pagination-chrome.css`; computed-style table |
| 3 | `Pagination.stories.tsx` Mantine proof path, default + mobile-compact clusters, localized aria via `getControlProps`/`getItemProps` | ✅ | Story file; `check:stories` 0 violations |
| 4 | i18n `storybook.mantine.pagination_*` in sq/en/uk/it, same key set, runtime-switch (structural) verified | ✅ | 4 locale files; `check:i18n` 2065/2065 |
| 5 | No h-scroll@320 (uk) with large total; compact-control exemption documented; ≥44px tap — **PARTIAL, flagged** | ⚠️ | h-scroll: ✅ (16/16 gate cells pass); tap target: 32px < 44px, **STOP-and-ASK #3 not silently resolved, flagged above** |
| 6 | Rendered side-by-side vs zip `/pagination` (active/inactive/prev-next/gaps) | ✅ | `tailadmin-live-pagination.png` vs `mantine-primitives-pagination--default__en__desktop-1024.png` |
| 7 | Existing consumer still paginates, centers-mobile/right-aligns-desktop | ✅ | `MantineAdminSurfacePattern.tsx` zero diff lines — behavior untouched by construction |
| 8 | Gates green incl. `--mantine-only` PASS + planted-violation FAIL transcript | ✅ | Gates block + FAIL transcript above |

## File-integrity gate (clause 14)

`check:file-integrity` (git-changed + untracked, default scope) → 30 files clean (0 NUL, no BOM, not
truncated): `theme.ts`, `pagination-chrome.css`, `layout.tsx`, `.storybook/preview.tsx`,
`Pagination.stories.tsx`, 4 locale files, session log + assets.

## Files Changed

| File | Rationale |
|---|---|
| `src/design-system/mantine/theme.ts` | New `Pagination`/`PaginationNext`/`PaginationPrevious` blocks (33 lines added, verified diff is additive-only). |
| `src/design-system/mantine/pagination-chrome.css` | NEW — state-dependent chrome (resting/hover/edge-border) that cannot live in `theme.styles` per §18. |
| `src/app/layout.tsx` | Import the new stylesheet (mirrors `input-chrome.css`'s import). |
| `.storybook/preview.tsx` | Same import for the Storybook preview environment. |
| `src/stories/mantine/primitives/Pagination.stories.tsx` | NEW — Mantine proof-path story, 5 clusters. |
| `messages/sq.json` · `messages/en.json` · `messages/uk.json` · `messages/it.json` | `storybook.mantine.pagination_*` keys (3 keys × 4 locales). |
| `docs/backlog.md` | Last Session + Sprint 40 status + Task 533 status line updated. |
| `docs/sessions/2026-07-03-task533-pagination-conformance.md` | This file. |
| `docs/sessions/assets/task533/*.png` (17 files) + `rendered-proof-manifest.json` | 16 gate cells + live TailAdmin reference. |
| `docs/sessions/assets/task533/planted-violation/*` | FAIL transcript manifest + representative FAIL screenshot. |

**Not touched this task:** `pagination.tsx` (legacy shadcn primitive), `MantineAdminSurfacePattern.tsx` (zero
diff lines — behavior preserved by construction), `input-chrome.css`, any other primitive/theme block.

**Reverted, not part of this diff:** `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md`
(auto-regenerated side effect of the required gate command, restored to HEAD in-session, same as Tasks 530/531/532).

**Emitting NO `git add`/`git commit`** — no mutating git command was run this session.
