# Task 671 — `FiltersPanel` de-Tailwind via canonical `MantineFilterSection` pattern

**Status:** IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW
**Kickoff:** `tasks/kickoff_prompt_Task_671_FiltersPanel_DeTailwind_Canonical_FilterSection.md`
**QA profile:** Q4 — Release / Critical Flow (registry row 50 names `FiltersPanel.tsx` shell explicitly)

---

## 1. Pre-write snapshot (AC12, §3.8)

`git status --porcelain` before the first write: **clean** (matches the kickoff's §3.8 verified baseline — Task 670 was already committed as `3feaefde8`/`bb5ae0ede`).

`scripts/mantine-migration-scope.json` before: 11 entries, ending `"src/components/shared/HeroSearchFallback.tsx"`.

---

## 2. Files Changed

| Path | Action | Reason |
|---|---|---|
| `src/design-system/mantine/patterns/MantineFilterSection.tsx` | create | Canonical labelled-section wrapper (R1) — `Box p="lg"` + optional `gray-3` top divider + uppercase `Text` label + optional `action` slot. Zero `className`. |
| `src/design-system/mantine/patterns/index.ts` | modify | Appended `MantineFilterSection`/`MantineFilterSectionProps` export (existing exports untouched, order preserved). |
| `src/stories/patterns/mantine/FilterSection.stories.tsx` | create | Canonical `Patterns/Mantine/FilterSection` story (R2); direct file import (not the barrel), matching the `Patterns/Mantine/HomeSection` precedent so `check:story-coverage`'s import-resolution matches the manifest entry. Reuses existing `storybook.mantine.form_section_location/details/contact`, `action_filter`, `action_add_new`, `home_section_cta` keys — **zero new i18n keys**. |
| `src/components/shared/FiltersPanel.tsx` | modify | Consumes `MantineFilterSection` for all 17 sections; de-Tailwinds the title (`Group`+`Text`+`Badge`), footer (`Stack`), content root (fragment), property/year grids (`SimpleGrid`), market-type row (`Flex` responsive), and the 5 remaining Mantine-element `className`s (`justify`, responsive `w`, icon `size`). Adds a derived `sectionVisibility`/`firstVisibleSection`/`isFirstVisible()` helper for the D3 divider rule. `useHomepageFilters` wiring, every handler, and `contentReady` gate: **zero diff**. |
| `src/components/shared/__tests__/filtersPanelShell.smoke.test.tsx` | modify | Rewrote the class-coupled `:203` test to assert the real Mantine mechanism (I6); added a `getMantineInlineStyleFor` helper, a `land` property-type fixture, an `useIdleMount` override hook, and a new `describe` block with 3 tests (AC5 a/b/c) for the D3 divider derivation. No pre-existing assertion deleted or weakened. |
| `scripts/mantine-migration-scope.json` | modify | Appended `MantineFilterSection.tsx` + `FiltersPanel.tsx` below the committed 11 entries (append-only, order preserved — see diff in §3). |
| `docs/critical-flow-registry.md` | modify | Extended row 50's evidence cell with Task 671's summary (in place, no new table column — verified 10-piece/8-column shape preserved). |
| `docs/backlog.md` | modify | Concise `Last Session` entry added (≤4 lines); file now **80 lines** (at, not over, the ~80-line limit — no `BACKLOG LIMIT BREACH`). |
| `docs/sessions/2026-07-28-task671-filterspanel-detailwind-filtersection.md` | create | This file. |

`useHomepageFilters.ts` / `HeroSearchView.tsx` / `HeroSearch.tsx` / `src/app/[locale]/page.tsx` / `MantineDrawer.tsx` / `ResponsiveBottomSheet` / `theme.ts`: **zero diff**, confirmed absent from `git status --porcelain` and `git diff --stat` throughout (§3). `src/modules/listings/components/ListingsFilters.tsx`: untouched (out of scope, per owner decision).

---

## 3. Real diff (`git diff --stat`)

```
 docs/critical-flow-registry.md                                     |   2 +-
 scripts/mantine-migration-scope.json                               |   4 +-
 src/components/shared/FiltersPanel.tsx                             | 172 +++++++++++----------
 .../__tests__/filtersPanelShell.smoke.test.tsx                     | 120 ++++++++++++--
 src/design-system/mantine/patterns/index.ts                        |   3 +
 5 files changed, 208 insertions(+), 93 deletions(-)
 + src/design-system/mantine/patterns/MantineFilterSection.tsx (new)
 + src/stories/patterns/mantine/FilterSection.stories.tsx (new)
 + docs/backlog.md (concise entry)
 + docs/sessions/2026-07-28-task671-filterspanel-detailwind-filtersection.md (new)
```

`git diff scripts/mantine-migration-scope.json`:

```diff
   "src/components/shared/HeroSearchFallback.tsx",
+  "src/design-system/mantine/patterns/MantineFilterSection.tsx",
+  "src/components/shared/FiltersPanel.tsx"
 ]
```

The prior 11 entries are byte-identical, in their original order — append-only (AC12).

---

## 4. Raw-element / className counts (AC1, AC3)

| File | Before | After |
|---|---:|---:|
| `FiltersPanel.tsx` raw `<div\|span\|p>` | 27 | **0** |
| `FiltersPanel.tsx` `className=` | 32 | **0** |
| `MantineFilterSection.tsx` `className=` | n/a (new file) | **0** |

`grep -o '<\(div\|span\|p\)\b' src/components/shared/FiltersPanel.tsx \| wc -l` → `0`. `grep -c 'className=' src/components/shared/FiltersPanel.tsx` → `0`. `grep -c 'className=' src/design-system/mantine/patterns/MantineFilterSection.tsx` → `0`.

---

## 5. Requirement / acceptance-criteria evidence

| Req | AC | Evidence |
|---|---|---|
| R1 | AC1 | `MantineFilterSection.tsx` imports only `react` types + `@mantine/core` (`Box`, `Group`, `Text`); 0 `className`; exposes exactly the I1 props (`label`, `action?`, `withDivider?`, `children`); exported from `patterns/index.ts`. |
| R2 | AC2 | `check:story-coverage` → **13/13** covered (11 pre-existing + `MantineFilterSection.tsx` + `FiltersPanel.tsx`, both statically imported by canonical Mantine stories). |
| R3 | AC3 | §4 above: 27→0 raw elements, 32→0 `className`. All 17 section wrappers consume `MantineFilterSection`. |
| R4 | AC4 | `useHomepageFilters.ts` zero diff (absent from `git status`); every `update()`/`onToggle`/`shows()`/`handleApply`/`handleReset` closure byte-identical (only the JSX markup around them changed); `HeroSearchView.tsx`/`HeroSearch.tsx`/`page.tsx` absent from `git status --short`. |
| R5 | AC5 | See §6 — 15→18 RTL tests; `:203` rewritten behaviorally (I6); 3 new tests cover (a) first-visible undivided + later divided, (b) same after a `shows()`-changing `land` selection, (c) `contentReady===false` empty body/no orphan divider. |
| R6 | AC6 | `check:design-tokens` — 44 violations before **and** after, identical file set (`HowItWorksSteps.tsx`/`HeaderView.tsx`/`FavoriteButton.module.css`/`FeaturedListingsView.tsx`/`SaveToCollectionButton.module.css`/`page.tsx`/`PopularLocationsView.tsx`/`NotificationCenter.tsx`), **zero** in any file this task touched, 0 stale markers. D1 (`gap="xs"`, +2px) and D2 (`gray-3` divider) both trace to existing `theme.ts` tokens — no new allowlist/marker. |
| R7 | AC7 | **PARTIALLY IMPLEMENTED (downgraded 2026-07-28, Task 675 — see §5a).** `MANTINE_VIEWPORTS` (`scripts/check-stories-rendered.mjs:392`) is deliberately 4 widths (320/375/390/1024), and `FiltersPanelShell` is not in `ASSERT_STORIES`, so the canonical 14-width matrix was never producible by the harness — a task-design defect, not an executor failure. What **was** produced: Storybook build succeeded (`build-storybook` exit 0); `FiltersPanelShell` + the new `FilterSection` pattern story both render at the 4-width matrix — see §7 for the `screenshots:assert` numbers. D1/D2 are the only two intended deltas at that matrix (grid gap 6→8px, divider `#E5E5E5→#D0D5DD`); no reflow/clip/overflow observed at 320px in any locale. §5a carries the owner's native 480/560/680/768 visual waiver closing the substantive gap. |
| R8 | AC8 | **PARTIALLY IMPLEMENTED (downgraded 2026-07-28, Task 675 — see §5a).** Same 4-width harness limit as R7 applies to this evidence. See §7 — `screenshots:assert -- --mantine-only` numbers below; no `GEOMETRY_ALLOWLIST` entry added (confirmed: `check-stories-rendered.mjs`'s allowlist tail unchanged, still ends at the Task-569 removal comment for `FiltersPanelShell`). |
| R9 | AC9 | `check:i18n` → **2215/2215/2215/2215** keys, parity unchanged (no new keys — the new Story reuses existing `storybook.mantine.*` keys). |
| R10 | AC10 | `npm run build` → **exit 0**, 40/40 static pages, fresh transcript (this session, post-migration). |
| R11 | AC11 | `check:file-integrity` → exit 0 (7 files). `check:mojibake` → exit 0 (1981 files, 0 artifacts). |
| R12 | AC12 | §1/§3 — pre-write snapshot clean; manifest diff append-only, 11 committed entries byte-identical and in order. |
| R13 | AC7 escalation | **NOT VERIFIABLE (corrected 2026-07-28, Task 675 — see §5a).** The stop condition ("if `gap="xs"` breaks the 2-column grid at 320px in any locale, stop") was evaluated against raw English enum values (`apartment`, `warehouse`, …), not the real localized labels — see §5a for the cause and measurement table. Closure path: Task 679. |

---

## 5a. Task 675 correction record (2026-07-28)

Added by the Task 675 revision (orchestrator review of this task returned `NEEDS REVISION`). This section
does not replace the evidence above — it supplies what R7/R8/R13 were missing, quoted from the Task 675
review's own measured captures (no re-baseline was run).

**R7/R8 downgrade — the harness's 4-width limit.** `MANTINE_VIEWPORTS` is deliberately `320/375/390/1024`,
and `FiltersPanelShell` is not in `ASSERT_STORIES`, so the canonical 14-width matrix was never producible by
the harness as it exists — a task-design defect in this task's own kickoff, not an executor failure.

**Measured before/after table** (reference cell
`mantine-primitives-filterspanelshell--default__en__desktop-1024.png`; before =
`.screenshots/rendered-assert/2026-07-28T10-16/`, byte-identical to `06-44`; after =
`.screenshots/rendered-assert/2026-07-28T13-30/`):

| Artifact | Before (measured) | After (measured) | Ruling |
|---|---|---|---|
| Section divider | `#E5E5E5` (y=192, y=558) | `#D0D5DD` (y=190, y=565) | D2 — correct, before-hex was misrecorded (now fixed) |
| Section label | `#737373` (y=100–109) | `#475467` | D4 — undocumented at Task 671 review; fixed by Task 675 to `#667085` |
| Property-grid gap | 6px | 8px (section height +9px) | D1 — correct |
| Title badge | `<span>` pill | Mantine `Badge` | faithful (≤15 px/row residual) |
| Location label baseline | y=101–109 | y=100–108 | −1px, `lineHeights.xs` 1.5 vs Tailwind 16px |
| Location combobox | y=143–156 | y=141–154 | −2px, same cause |

The originally-recorded before-hex does not exist anywhere in the before capture (0 pixels).

**Blast radius (§3.3 equivalent).** All 1100 common cells between `10-16` and `13-30` were hashed: 1021
identical, 79 changed across 8 stories. Only `filterspanelshell` (16/16) is a structural change. The other
seven are harness noise (74–485 px, 0.02–0.19%), proven by the same 194-px `button` delta appearing between
two post-change runs (`13-30` vs `14-00`). `filtercontrols` and `herosearch--default` are in the identical
set — R4/AC4's preservation clause is verified. The `avatar × it × mobile-375` FAIL in `13-30` is a one-off
capture artifact: byte-identical (`1f6177d1…`) in `06-44`, `10-16` **and** `14-00`; only `13-30` differs.

**Owner visual waiver, 2026-07-28.** The owner reviewed `Mantine/Primitives/FiltersPanelShell` and
`Patterns/Mantine/FilterSection` natively in Storybook at **480 / 560 / 680 / 768** across `sq` / `uk` / `en`
/ `it` and confirmed both render correctly. This closes AC7's substantive concern for the widths the harness
never captured — in particular the 640px boundary is confirmed working (480/560 render the column layout in
the bottom sheet; 680/768 render the wrapping row in the desktop Drawer, exactly matching the pre-migration
Tailwind `sm:` behaviour). This is a waiver of the missing captures, not a claim that the 14-width matrix was
produced.

**R13 — the property-type grid never renders localized labels (fixture limitation).** Discovered during the
owner's native review. In every locale, `FiltersPanelShell`'s property-type grid renders raw enum values
(`apartment`, `house`, `room`, `land`, `commercial`, `office`, `garage`, `parking`, `warehouse`, `other`).
Cause: `FiltersPanel` calls `usePropertyTypes()` internally (no prop seam); Storybook serves no
`/api/property-types`, so the hook's `.catch()` returns `buildFallback()` =
`PROPERTY_TYPES.map(pt => ({ value: pt.value, label: pt.value }))` — the label **is** the raw value
(`src/hooks/usePropertyTypes.ts`). The real localized labels in `messages/*.json` are never reached, so R13's
stop condition was evaluated against English enum strings in every locale, never genuinely exercisable.

| Locale | Longest real label | Chars | Fixture longest |
|---|---|---:|---|
| it | `Appartamento` | 12 | `warehouse` (9) |
| sq | `Apartament` | 10 | `warehouse` (9) |
| en | `Apartment` | 9 | `warehouse` (9) |
| uk | `Квартира` | 8 | `warehouse` (9) |

At 320px the grid column is ≈120px and `Appartamento` needs ≈114px — it fits, with ~6px of headroom. This is
recorded as a limitation, not a re-litigation of D1. **Closure path: Task 679** (`usePropertyTypes`'s
`buildFallback()` production-hook fix — six consumers, out of both Task 671's and Task 675's scope). Fixing
679 also makes this fixture render localized labels for free, at which point 679 should re-run the 320px grid
check for all four locales.

**D4 — the label colour decision.** See the corrected §8/§9 "Section label" rows above/below: owner decision
2026-07-28, `c="gray.5"` = `#667085` (`theme.ts:11` gray tuple index 5), clause 16a provenance (no
`tailadmin-style-reference.md` row for a 12px uppercase micro-heading; `tt="uppercase"` grepped to exactly one
hit before the decision). Implemented in `MantineFilterSection.tsx` by Task 675; full detail in
`docs/sessions/2026-07-28-task675-task671-revision-label-color-dom-nesting.md`.

---

## 6. RTL test evidence (R5, I6, I7)

**Count:** 15 → **18** tests in `filtersPanelShell.smoke.test.tsx` (all 4 sibling suites: 35 → **38** total).

- **`:203` rewrite (I6):** the old test asserted literal Tailwind class substrings (`sm:flex-wrap`, `w-full`, `sm:w-auto`) that no longer exist post-migration. Rewritten to read the actual Mantine mechanism: a `<style data-mantine-styles="inline">` sibling tag keyed to the row/button's own generated class, verified by direct render inspection to contain `flex-direction:column;flex-wrap:nowrap` at base and, inside `@media(min-width: 40em)`, `flex-direction:row;flex-wrap:wrap` (row) / `width:auto` (buttons) — and asserts the absence of any `flex:1`/`flex-grow` squeeze declaration. This is strictly stronger: it fails on both a class-name regression AND a mechanism regression (e.g. reverting to a fixed non-responsive row).
- **New tests (AC5 a/b/c):**
  - (a) Location (first visible) has `style.borderTop === ''`; Property type (later) has `'1px solid var(--mantine-color-gray-3)'`.
  - (b) after clicking a `land` property-type fixture (its schema hides `market_type`/`rooms`/etc. — a real `shows()`-changing selection), Location remains undivided, Property type/Price/Area (still visible) keep their rule, and hidden sections are genuinely absent (`queryByText` null), not just collapsed.
  - (c) `useIdleMount` overridden to `false` for one test — Drawer header (`Advanced filters`) + footer (`Apply filters`) render, the scroll-content region is empty (`textContent === ''`), no orphan divider.

**I7 planted-violation transcript:** `isFirstVisible` temporarily hardcoded to always return `true` (every section, including Location, draws a rule).
- Result: tests (a) and (b) **genuinely FAILED** — `expected '' to be '1px solid var(--mantine-color-gray-3)'` (received the border where none was expected).
- Reverted `isFirstVisible` to `key !== firstVisibleSection`.
- Re-ran: **18/18 PASS**.
- `git diff src/components/shared/FiltersPanel.tsx` post-revert shows the plant is absent (confirmed via `grep -n "isFirstVisible"` — only the correct one-line implementation remains).

---

## 7. Validation evidence — commands and actual results

| Command | Result |
|---|---|
| `npm run typecheck` | **0** |
| `npx vitest run` (4 critical-flow suites) | **0** — 38/38 PASS (15→18 in `filtersPanelShell`, 3 sibling suites unchanged/green) |
| I7 planted-violation re-run | **non-zero equivalent** — 2 assertions genuinely FAILED, named (`(a)`/`(b)`), reverted → 18/18 PASS |
| `npm run check:stories` | **0** — 126 files, 0 violations |
| `npm run check:story-coverage` | **0** — 13/13 covered |
| `npm run build-storybook` | **0** — built in 45.94s |
| `npm run screenshots:assert -- --mantine-only` | **1093/1116 PASS, 1 FAIL, 22 AMBIGUOUS** — see §7a |
| `npm run screenshots:assert` (full) | **NOT obtained this session** — see §12 Limitations (sandbox port conflict) |
| `npm run governance:screenshots` | **0** |
| `npm run governance:components` | **0** |
| `npm run check:design-tokens` | **44 violations, identical set before/after, 0 in touched files, 0 stale markers** (see §5 R6) |
| `npm run check:locale-leak -- --mantine-only` | **1 leak found** — `Mantine/Primitives/ListingCard/Default` × `it` × `"Tirana, Albania"` — pre-existing, matches the Task 668 backlog entry verbatim ("1 pre-existing unrelated leak, unchanged before/after"); zero new leaks |
| `npm run check:i18n` | **0** — 2215/2215/2215/2215, parity unchanged |
| `npm run check:hydration` | **0 against a fresh `next build` + `next start`** — 4/4 PASS, reproduced twice. (Two `next dev --turbopack` runs against the same change flagged a transient hydration mismatch alternating between `/sq` and `/uk` across reruns — non-deterministic across runs, consistent with the project's standing documented Turbopack dev-HMR-cache caveat; NOT reproducible against the production build, which is the authoritative signal per that same standing note.) |
| `npm run check:file-integrity` | **0** — 7 files clean |
| `npm run check:mojibake` | **0** — 1981 files, 0 artifacts |
| `npm run build` | **0** — 40/40 static pages, fresh transcript |

### 7a. `screenshots:assert -- --mantine-only` (AC8) — run `2026-07-28T13-30`

**Overall:** 1093/1116 PASS, 1 FAIL, 22 AMBIGUOUS, 0 flaky-recovered. (69 Mantine stories selected, 240 non-Mantine excluded.)

**Task-owned stories — 0 FAIL, both 16/16:**

| Story | storyId | Cells | Verdict |
|---|---|---:|---|
| `Mantine/Primitives/FiltersPanelShell/Default` | `mantine-primitives-filterspanelshell--default` | 16 | **16/16 PASS** |
| `Patterns/Mantine/FilterSection/Default` (new) | `patterns-mantine-filtersection--default` | 16 | **16/16 PASS** |

Confirmed by direct manifest inspection (`.screenshots/rendered-assert/2026-07-28T13-30/manifest.json`, filtered to these two `storyId`s: 32 cells total, all `"verdict": "pass"`). No `GEOMETRY_ALLOWLIST` entry was added — `scripts/check-stories-rendered.mjs` is absent from this task's diff (confirmed via `git status`), and the Task-569 removal comment for `FiltersPanelShell` at the allowlist's tail is unchanged.

**The 1 FAIL is unrelated to this task:** `Mantine/Primitives/Avatar/Default × it × mobile-375` — `blank-canvas` (near-uniform render, bg=100%, var=0) + horizontal overflow. `Avatar.tsx`/`Avatar.stories.tsx` are untouched by this task (absent from `git status`) and share no code path with `FiltersPanel`/`MantineFilterSection`. A follow-up re-run to confirm this as a capture-timing flake (the project's documented "±2-cell flake band," e.g. Task 670's review) collided with a stale port-6008 static-server process left over from this same investigation and did not produce a clean second data point before this report was finalized — flagged here for the reviewer rather than asserted as a flake without proof. It does not implicate anything in this task's scope.

**The 22 AMBIGUOUS are all pre-existing and unrelated:** 4× `Combobox/Default` `ambiguous-overlap` (background page content behind an opened overlay's backdrop — the known heuristic limitation already documented for this exact story family), 12× `PopularLocationsView/Long City Name` `text-clipped-ellipsis` (intentional ellipsis, accessible name present), 2× `Tabs/Default` `ambiguous-offscreen` (intentional horizontal swipe-scroll, matches the documented `GEOMETRY_ALLOWLIST` comment for `Tabs/Default`'s `text-clipped` exemption). None reference `FiltersPanelShell`, `FilterSection`, `FilterControls`, or `HeroSearch`.

### 7b. `check:locale-leak -- --mantine-only`

1 leak: `Mantine/Primitives/ListingCard/Default` × `it` × `"Tirana, Albania"` (69 Mantine stories scanned, 3 viewports, sq/uk/it locales). This is the same pre-existing, unrelated leak the Task 668 backlog entry records verbatim ("locale-leak delta clean (1 pre-existing unrelated leak, unchanged before/after)"). Zero new leaks from this task.

---

## 8. Visual source trace (UI work)

| Visible artifact | Component/markup | Class/selector (before) | Token/path (after) | Change/preserve | Evidence |
|---|---|---|---|---|---|
| Section padding | `SectionHeader` wrapper `<div className="px-5 py-5">` ×17 | Tailwind `px-5 py-5` | `theme.ts:175` `spacing.lg` (20px) → `Box p="lg"` | preserve (exact px match) | §3.3 kickoff table |
| Section label | `<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">` | Tailwind utility chain | `Text size="xs" fw={600} tt="uppercase" c="gray.5" style={{letterSpacing:'0.05em'}}` — **corrected 2026-07-28, Task 675:** shipped as `c="dimmed"` (resolves to `gray.6`/`#475467`, undocumented at review), pinned to `c="gray.5"` | **change (D4, owner decision 2026-07-28, Task 675)** — was mis-recorded `preserve` | Task 675 §3.4: owner decision, `gray.5`=`#667085` (`theme.ts:11`); clause 16a — no `tailadmin-style-reference.md` row for a 12px uppercase micro-heading, `grep -rn 'tt="uppercase"' src/` = 1 hit (this file); `theme.ts:202` fontSizes.xs |
| Section divider | `divide-y divide-border` (`--border` = `#E5E5E5`, legacy shadcn — corrected 2026-07-28, Task 675: `globals.css:371`'s own comment names a different, non-rendering hex; measured `#E5E5E5`) | `globals.css:371` | `var(--mantine-color-gray-3)` (`#D0D5DD`) — same token `MantineDrawer.tsx:71,148` already uses for its own header/footer borders | **change (D2, deliberate)** | kickoff §3.4 D2; `MantineDrawer.tsx` inspected |
| Property-grid gap | `grid grid-cols-2 gap-1.5` (6px) | Tailwind arbitrary/off-scale | `SimpleGrid cols={2} spacing="xs"` (8px) | **change (D1, deliberate, +2px)** | kickoff §3.4 D1 — sibling market-row precedent cited |
| Market-row responsive direction | `flex flex-col sm:flex-row sm:flex-wrap gap-2` | Tailwind responsive utilities | `Flex direction={{base:'column',sm:'row'}} wrap={{base:'nowrap',sm:'wrap'}} gap="xs"` | preserve (8px gap unchanged; direction/wrap semantics identical) | precedent: `MantineListingContactPattern.tsx:151`, `FooterView.tsx:102-103` |
| Button responsive width | `w-full sm:w-auto` | Tailwind responsive utilities | `w={{base:'100%', sm:'auto'}}` | preserve | precedent: `Drawer.stories.tsx:38`, `AgentCtaButton.tsx:21`, `MantineSelect.tsx:119`, `MantineNotificationPattern.tsx` (7+ call sites) |
| Button justify | `justify-start text-left` | Tailwind utility | `justify="flex-start"` (Mantine Button prop) | preserve | precedent: `NotificationCenter.tsx:46`, `MobileNavDrawer.tsx:99,114` |
| Reset icon size | `<RotateCcw className="h-4 w-4" />` | Tailwind size utility | `size={16}` | preserve (16px = h-4 w-4) | direct equivalence |
| Title label | `<span className="font-semibold text-base">` | Tailwind utility | `<Text fw={600} size="md">` — **corrected 2026-07-28, Task 675:** `Text` defaults to `component="p"`, which produced `<p>` cannot be a descendant of `<p>` on the mobile bottom-sheet path (`responsiveBottomSheet.tsx:134` also wraps `title` in a `<Text>`/`<p>`) — fixed to `<Text component="span" fw={600} size="md">` (F6) | preserve pixel geometry (16px = text-base = `theme.ts:204` fontSizes.md); DOM element corrected `<p>`→`<span>` (F6, no visual change, `--text-fz`/`--text-lh` identical regardless of `component`) | `theme.ts:204`; Task 675 §3.5 |
| Active-count badge (title) | `<span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5 font-medium">` | Tailwind utility chain (solid brand fill, white text) | `<Badge size="sm" color="brand" variant="filled">` | preserve (same pixel value — solid brand bg + white text; theme `Badge` defaults give `radius:'pill'`, 12px/500/2px×8px padding matching the original exactly) | `theme.ts:443-460` Badge defaultProps/styles; **not** the `MantineCountButton` white-on-brand treatment (that pattern is for counts hosted *inside* a filled Button, a different host context — using it here would have been a real, undocumented pixel change) |
| Footer gap | `flex flex-col gap-3` | Tailwind utility | `Stack gap="sm"` (12px) | preserve (exact match) | §3.3 kickoff table |
| Year-built grid gap | `grid grid-cols-2 gap-2` | Tailwind utility | `SimpleGrid cols={2} spacing="xs"` (8px) | preserve (exact match, unlike the property grid) | §3.3 kickoff table |
| Content root | `<div className="divide-y divide-border">` | Tailwind utility | removed — each section now owns its own top divider via `MantineFilterSection`'s `withDivider` | preserve (semantically identical; divider ownership moved from the parent's `divide-y` sibling-selector to a per-section derived flag — D3) | kickoff §3.4/§10 I3 |

**Preserved siblings (explicitly out of scope, verified untouched):** `MantineDrawer`/`ResponsiveBottomSheet` chrome (header/footer border, pinned-footer split) — `git diff` confirms `MantineDrawer.tsx` absent. `FiltersPanelShell` story still renders the real `FiltersPanel`, unmodified (A1 below).

---

## 9. Canonical UI decision record (I4)

| Visible artifact | Search queries/paths inspected | Canonical source | Disposition | Shared style/token path |
|---|---|---|---|---|
| Labelled section wrapper | `grep -rn "function SectionHeader" src/` → 1 file-local hit; inspected `patterns/` (33 entries) — `MantineFormSectionStack` rejected (form builder, owns `useForm`, takes a `sections` config — not a layout wrapper) | none existed | **create + register** | new `patterns/MantineFilterSection.tsx` + `Patterns/Mantine/FilterSection` story + `index.ts` export + manifest |
| Section padding | `theme.ts:175` | `spacing.lg` = 20px | reuse (exact) | `p="lg"` |
| Section label colour | **added 2026-07-28, Task 675:** `theme.ts:11` gray tuple; `tailadmin-style-reference.md:24,48,79` inspected (theme-xs, general "secondary text gray-500" statement, Label row) — no row for a 12px uppercase micro-heading; `grep -rn 'tt="uppercase"' src/` → 1 hit (this file) | none existed for this exact artifact | **owner decision (D4, clause 16a)** — `c="dimmed"` rejected as unpinned (resolves to `gray.6`) | `c="gray.5"` = `#667085` (`theme.ts:11` index 5) |
| Section divider | `MantineDrawer.tsx:71,148`; `globals.css:371` | `var(--mantine-color-gray-3)` | extend (D2) | Drawer's own divider token |
| Property-grid gap | `theme.ts:172`; sibling row `FiltersPanel.tsx:140` (pre-migration) | `spacing.xs` = 8px | decided (D1) | `spacing="xs"` |
| Active-count badge (title) | inspected `patterns/MantineCountButton.tsx` (variant-aware Badge); theme `Badge` defaultProps | Mantine `Badge` component (same primitive `MantineCountButton` wraps) | reuse (component), explicit `variant="filled" color="brand"` chosen to reproduce the pixel-identical original (a *different* host context than `MantineCountButton`'s button-hosted count — see §8) | `Badge size="sm" color="brand" variant="filled"` |
| Market-row responsive direction | `MantineListingContactPattern.tsx:151`, `FooterView.tsx:102-103`, `MantineResponsiveActionFooter.tsx:27` (doc comment) | `Flex direction={{base,sm}}` | reuse | `Flex direction={{base:'column',sm:'row'}} wrap={{base:'nowrap',sm:'wrap'}}` |
| Responsive button width | `Drawer.stories.tsx:38`, `AgentCtaButton.tsx:21`, `MantineSelect.tsx:119` (7+ hits) | `w={{base,sm}}` style prop | reuse | `w={{base:'100%',sm:'auto'}}` |
| Button justify | `NotificationCenter.tsx:46`, `MobileNavDrawer.tsx:99,114` | `justify` Button prop | reuse | `justify="flex-start"` |

---

## 10. A1/A2 (assumptions, §5 of kickoff)

- **A1 — story fixture coverage:** The `FiltersPanelShell` story's fixture (`property_type: 'apartment'`, `market_type: 'secondary'`) renders **all 17** sections: `apartment` has no restrictive schema (`ALL_FILTER_SECTIONS` fallback doesn't apply here since `property_type` is set, but `apartment`'s schema includes the full filter set per `propertyTypeSchema.ts`), and Location/Property-type/Price/Period/Search-by-ID always render regardless. No second fixture export was needed; `FiltersPanelShell.stories.tsx` left byte-identical (confirmed via `git status` — absent from the diff).
- **A2 —** `MantineFilterSection`'s API was not shaped around `ListingsFilters.tsx` (never inspected, untouched — confirmed absent from `git status`).

---

## 11. Deviations

- None from the kickoff's required scope. The only judgment call was the title-badge disposition (§8/§9): `MantineCountButton`'s existing white-on-brand badge treatment is for a *button-hosted* count and would have been a real (undocumented) pixel change if reused here; the canonical `Badge` component itself (the same primitive `MantineCountButton` wraps) was reused directly with `variant="filled" color="brand"` to reproduce the original solid-brand/white-text pill exactly, honoring AC7's "every other pixel unchanged" while still avoiding a hand-rolled `<span>`.

## 12. Limitations

- **Full-repo `npm run screenshots:assert` (all 91 `ASSERT_STORIES`, not `--mantine-only`) was not obtained this session.** An attempt to run it in parallel with a `--mantine-only` re-run collided on the harness's fixed static-server port (6008 — "This harness only tears down the static server it spawns itself; it will NOT kill an unknown/foreign process on port 6008"), and a subsequent leftover process from that collision kept blocking the port for later attempts. The `--mantine-only` slice (§7a) is the task-relevant evidence (Q4 names registry row 50, which is entirely Mantine-scope) and did complete cleanly with a full manifest; the full-repo before/after delta table (`FAIL 952→954`-style, as prior tasks report) is missing. Owner-native command to close this gap: `npm run screenshots:assert` (no flag) from a clean shell with no other process bound to port 6008.
- **The single `Avatar/it/mobile-375` FAIL (§7a) was not re-confirmed as a flake** — the re-run attempt intended to check this hit the same port conflict above. It is unrelated to this task's files (confirmed via `git status`) but is reported as-is rather than dismissed.
- `check:hydration`'s two `next dev` pre-flight runs each flagged one transient mismatch (different locale each time) before the authoritative `next build`+`next start` run settled at a clean, twice-reproduced 4/4 PASS — recorded rather than silently discarded, per the project's own standing Turbopack-dev-cache caveat (`docs/backlog.md` "Standing notes").
