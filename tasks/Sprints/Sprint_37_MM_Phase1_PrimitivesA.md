# Sprint 37 — MM Phase 1, Batch A — Primitives (AdminUsersTable dependency set)

> **Program:** `docs/mantine-tailadmin-migration-tracker.md`. **Reference (copy-source):**
> `docs/tailadmin-style-reference.md` + `demo_tailadmin_com.zip` (repo root). **Theme:** `src/design-system/mantine/theme.ts`.
> **Executor:** Sonnet 4.6 (writes code). **Orchestrator:** Opus (writes these kickoffs, reviews rendered side-by-side with archive).
> **Why this batch first:** these 6 primitives are everything AdminUsersTable consumes; once ✅, Task 485 closes as the first Phase-4 surface proof with near-zero surface work.

## Shared Definition of Done (applies to EVERY task below — from the tracker)
1. TailAdmin values applied EXACTLY from the cited reference §; zero invented values.
2. **🔴 ZERO HARDCODE:** no raw colors (hex/rgb/named — theme tokens only), no raw spacing/radius px (Mantine tokens only;
   exemptions only `mih="2.75rem"`, `minWidth:0`/`flexShrink:0`, documented micro-gaps), no hardcoded user-facing strings
   (`t()` ×4 locales), no raw `<button>/<input>/<select>/<textarea>`. Verified by `check:design-tokens`+`check:i18n`+ESLint+diff grep.
3. **Rendered proof matrix:** 320/375/480 × en/uk + sq/it@320 (uk@320/375/390 mandatory), attached PNG/JSON. No clip/overflow, no h-scroll@320, controls full-width `<640`.
4. Gates green: `tsc=0`, `check:stories`, `check:i18n`, `check:design-tokens`. (Green ≠ visual proof.)
5. No control/behavior regression; locale parity sq/en/uk/it.
6. Story renders in a modest padded canvas (NOT edge-glued; primitive legibility). Surface stories (Phase 4) use the real responsive page gutter.
7. Files Changed table in the session log; orchestrator emits commits.
8. **Approval only after orchestrator views the rendered story side-by-side with the archive.**

Each task: edit `theme.ts` `components.<X>` defaults + a proof story `src/stories/mantine/primitives/<X>.stories.tsx` (Mantine proof path). NO product-surface edits in Phase 1.

---

## Task 486 — Badge primitive → TailAdmin (P1.08)
**Ref:** §6 Badge + §6b status cell.
**Required values:** pill radius (`radius="pill"`), `variant="light"`, `size="sm"`, `fw=500`. Semantic mapping via Mantine light
variant (bg = shade 0, text = shade 6): success=`green` (#ecfdf3/#039855), warning=`yellow` (#fffaeb/#dc6803),
error=`red` (#fef3f2/#d92d20); neutral=`gray`; brand=`brand`. Text size = theme-xs (12). Padding ~`px-2 py-0.5`.
**Current to preserve:** existing Badge usages keep their color/label; only defaults/visual refined.
**Positive flow:** render Badge in each semantic color + role/status colors; pill shape, correct bg/text contrast, 12px medium text.
**Negative flow:** unknown/empty color → falls back to `gray` (no crash, no raw color); long uk label wraps/does not clip at 320.
**Story:** all colors × 4 locales (label via `t()`), sizes xs/sm.
**AC:** theme Badge defaults match §6; story shows every semantic; matrix green; zero hardcode.

## Task 487 — Card / Paper primitive → TailAdmin (P1.09)
**Ref:** §6 Card (+ §5 shadow rule).
**Required values:** `radius="2xl"` (16), `padding="lg"` (20 — owner-decided 2026-06-25), border color `gray-1` (#f2f4f7),
**no shadow** (flat). Paper matches Card chrome. (Surface tables use `Paper` per §6b separately.)
**Current to preserve:** existing Card/Paper consumers keep content; only chrome refined.
**Positive flow:** Card renders rounded-16, 20px padding, flat gray-1 border, white bg, no shadow.
**Negative flow:** `withBorder` off → no border but still radius/padding tokens (no raw px leak); nested Card no double-shadow.
**Story:** Card with header/body/footer slots × locales; Paper variant.
**AC:** theme Card/Paper defaults = §6 (radius 2xl, padding lg, border gray-1, shadow none); matrix green; zero hardcode.

## Task 488 — Table primitive (CRM card-wrapped) → TailAdmin (P1.10)
**Ref:** §6b (admin standard).
**Required values:** card wrapper `Paper` radius 2xl + `gray-2` border + `overflow:hidden`; `Table withRowBorders`,
`--table-border-color: gray-1`; thead `bg-gray-0` + border-y `gray-1`; Th `size="xs" fw=500 c="gray.5"` NOT uppercase;
Td 14px `c="gray.7"` `whitespace-nowrap`; `verticalSpacing="sm"`(12) `horizontalSpacing="xl"`(24); row hover `gray-0`.
(Most already in `MantineDataTableToCards` — finalize + prove; do NOT regress its card/mobile paths.)
**Current to preserve:** `MantineDataTableToCards` API (columns/rows/card/rowClassName/tableHeader), mobile card path.
**Positive flow:** desktop card-wrapped table renders per §6b at 768/1024/1440.
**Negative flow:** 0 rows → empty label (no header-only shell); long cell → nowrap + horizontal scroll inside card, not page; loading rowClassName opacity.
**Story:** `DataTableToCards` desktop × locales; reuse existing story, ensure §6b values.
**AC:** values = §6b verified in render; matrix incl. desktop widths; zero hardcode.

## Task 489 — Tabs primitive → TailAdmin (P1.11)
**Ref:** §6c.
**Required values:** `color="brand"`; **NOT stretched** — `Tabs.List grow` only `<640` (consumer passes `grow={isMobile}`);
≥640 compact, left-aligned. Add `theme.components.Tabs` defaults (color brand) if it standardizes; tab text 14px fw500,
active brand, inactive gray-500.
**Current to preserve:** tab switching behavior, panels.
**Positive flow:** desktop tabs compact left-aligned, active brand underline; mobile full-width.
**Negative flow:** long uk tab label wraps/no clip at 320; keyboard/aria switching intact.
**Story:** 2–3 tab demo, `grow` responsive, × locales at 320/768/1440.
**AC:** not stretched ≥640 (proven in render), full-width <640; brand active; zero hardcode.

## Task 490 — SegmentedControl primitive (filters) → TailAdmin (P1.12)
**Ref:** §6c segment toggle.
**Required values:** `size="sm"` (NOT xs), `radius="lg"` (8); track = gray-1 container, active pill = white +
`shadow-theme-xs` + text gray-900, inactive text gray-500. Desktop content-width; mobile `<640` full-width or
`ScrollArea scrollbars="x"` when labels overflow at 320 (document per locale).
**Current to preserve:** single-select filter behavior.
**Positive flow:** segment renders gray track + white active pill, 14px; desktop content-width, mobile full-width/scroll.
**Negative flow:** long uk option ("Адміністратор"/"Заблокований") → no clip; swipe scroll works at 320.
**Story:** role-filter-like + status-filter-like segments × locales at 320/375/768.
**AC:** matches §6c (verified in render); size sm; not stretched on desktop; zero hardcode.

## Task 491 — Avatar primitive → TailAdmin (P1.14)
**Ref:** §6b composite cell avatar.
**Required values:** `radius="pill"` (rounded-full), default size **40px** (parity desktop+mobile), tinted fallback
(brand color), initials uppercase. Add `theme.components.Avatar` defaults `{ radius:'pill' }`; size 40 passed by consumers
(document the 40 standard). AppImage wrapper unaffected.
**Current to preserve:** avatar src/fallback/initials logic in consumers.
**Positive flow:** 40px circular avatar, brand-tinted initials when no src; image when src.
**Negative flow:** no name → "?" fallback; broken src → initials fallback (no raw color).
**Story:** avatar with/without src, initials, × locales.
**AC:** circular 40px, brand tint, parity mob/desktop; zero hardcode.

---

## Sequencing & numbering
- Run order: 486 Badge → 487 Card → 491 Avatar → 489 Tabs → 490 SegmentedControl → 488 Table (independent; can parallelize, but review one at a time).
- After all 6 ✅, reopen **Task 485 REWORK2** as the first Phase-4 surface proof — AdminUsersTable should need only composition, since primitives now carry the styling.
- Task numbering — last used: 491. Next free: 492.
