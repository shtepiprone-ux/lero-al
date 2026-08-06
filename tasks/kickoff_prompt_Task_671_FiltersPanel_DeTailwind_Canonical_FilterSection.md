# Task 671 — `FiltersPanel` de-Tailwind via a new canonical `MantineFilterSection` pattern

## 1. Mode and task type

- **Mode:** implementation (Sonnet executor, via `.claude/skills/execute-task/SKILL.md`).
- **Primary task type:** UI / Layout / Component — **current Mantine path** (`docs/rule-index.md`).
- **Secondary types:** Design-system pattern creation (new `patterns/` member + canonical Story +
  `index.ts` export); Storybook / Visual Proof; **critical-flow regression** (`docs/critical-flow-registry.md`
  row 50).
- **Boundary statement:** `FiltersPanel` is **already Mantine-current behaviourally**. Task 567 rebuilt its
  shell on `MantineDrawer` + Mantine `Button`/`TextInput` and removed every `@/components/ui/*` legacy
  primitive. This task migrates only the **remaining raw layout markup and Tailwind utility classes**. It is
  a de-Tailwind task in the Task 646/659/662 lineage, **not** a legacy-primitive migration.

> **Correction to `docs/backlog.md` (do not propagate the old wording).** The backlog's "Open — needs action"
> entry describes 671 as `FiltersPanel` being un-migrated. That is inaccurate: what remains is 27 raw
> elements and 32 `className` values of *layout chrome*. The behavioural migration closed in Task 567.
> Opus will correct that backlog line at review; the executor must not restate the old claim.

---

## 2. Objective

`src/components/shared/FiltersPanel.tsx` (387 lines) still carries **24 `<div>` + 1 `<p>` + 2 `<span>` = 27
raw elements** and **32 `className` values**. It is mounted unconditionally by `HeroSearchView` on every
homepage render, so it is the largest remaining raw-markup surface on the homepage tree.

**17 of the 27 raw elements are one repeated shape**: `<div className="px-5 py-5">` wrapping a call to the
file-local `SectionHeader` helper (itself `<div>` + `<p>`). Migrating those 17 sites inline would produce 17
near-identical local compositions — exactly what `docs/agent-contract.md` clause 16b prohibits ("A
component-local utility chain, inline value, or scanner allowlist is not evidence of a canonical style. If no
suitable source exists, create and register one in the appropriate library").

Two outcomes, both required:

1. **Create and register** `MantineFilterSection` in `src/design-system/mantine/patterns/` — a canonical
   labelled-section wrapper with its own `Mantine/Patterns/*` Story, `index.ts` export, and manifest
   enrolment.
2. **Migrate `FiltersPanel` onto it** and de-Tailwind the remaining 7 non-section raw elements, taking the
   file to **0 raw elements and 0 layout `className` values**, with byte-identical filter behaviour and no
   critical-flow regression.

**Owner decisions taken at design time (2026-07-28), recorded here so the executor does not re-litigate
them:** extract the canonical pattern rather than swapping inline or splitting into two tasks;
`ListingsFilters.tsx` stays **out of scope**; `FiltersPanel.tsx` **is** enrolled in the migration manifest by
this task.

---

## 3. Verified context

All facts below were read from the working tree during task design on 2026-07-28. Line numbers are from that
read. **The worktree was clean at design time — see §3.8 for the verified committed baseline.**

### 3.1 The raw-element inventory (counted, not estimated)

`grep -o '<\(div\|span\|p\|h[1-6]\|ul\|li\|section\|label\|button\|input\)\b'` → **24 `div`, 1 `p`, 2 `span`
= 27**. `grep -o 'className='` → **32**. Full breakdown:

| # | Location | Current markup | Role |
|---:|---|---|---|
| 1–2 | `:33–40` `SectionHeader` helper | `<div className="flex items-center justify-between mb-3">` + `<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">` | The section label. Called **17×**. |
| 3–5 | `:72–79` Drawer `title` slot | `<div className="flex items-center gap-2">` + `<span className="font-semibold text-base">` + `<span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5 font-medium">` | Title + active-count badge |
| 6 | `:82` Drawer `footer` slot | `<div className="flex flex-col gap-3">` | Apply/Reset column |
| 7 | `:96` content root | `<div className="divide-y divide-border">` | Inter-section separators |
| 8–24 | `:99,110,135,163,177,193,209,225,241,262,279,296,313,330,347,363,373` | `<div className="px-5 py-5">` ×17 | Section wrappers |
| 25 | `:112` | `<div className="grid grid-cols-2 gap-1.5">` | Property-type chip grid |
| 26 | `:140` | `<div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">` | Market-type chip row |
| 27 | `:243` | `<div className="grid grid-cols-2 gap-2">` | Year-built min/max pair |

Remaining `className` values on **Mantine** elements (not raw), also in scope for I2:

- `:115`, `:124` — `className="justify-start text-left"` on the property-type `Button`s.
- `:143`, `:152` — `className="w-full sm:w-auto"` on the market-type `Button`s.
- `:89` — `<RotateCcw className="h-4 w-4" />` on the Reset button's `leftSection`.

### 3.2 `SectionHeader`'s `right` prop is dead

`function SectionHeader({ children, right })` (`:33`). Grep of all **17** call sites (`:100, 111, 136, 164,
178, 194, 210, 226, 242, 263, 280, 297, 314, 331, 348, 364, 374`) shows **every one passes only `children`**.
`right` is never supplied and never renders. It is not a reachable user capability, so clause 3 does not
protect it — but see I1: the canonical pattern **keeps** an equivalent optional slot rather than dropping the
affordance.

### 3.3 Token mapping — verified against `theme.ts`, zero invented values

`src/design-system/mantine/theme.ts:171–177`:

```
xs: '0.5rem'    //  8px
sm: '0.75rem'   // 12px
md: '1rem'      // 16px
lg: '1.25rem'   // 20px
xl: '1.5rem'    // 24px
```

| Current Tailwind | px | Mantine token | Verdict |
|---|---:|---|---|
| `px-5 py-5` | 20 | `spacing.lg` | **exact match** → `p="lg"` |
| `gap-3` (footer) | 12 | `spacing.sm` | **exact match** → `gap="sm"` |
| `gap-2` (market row, year grid) | 8 | `spacing.xs` | **exact match** → `gap="xs"` |
| `gap-1.5` (property grid) | 6 | — | **off-scale, no token** → see D1 |
| `mb-3` (`SectionHeader`) | 12 | `spacing.sm` | **exact match** → `mb="sm"` |

### 3.4 Design decisions taken at design time (clause 16a — provenance, not invention)

**D1 — property-type grid `gap-1.5` (6px) → `gap="xs"` (8px).** 6px is off the spacing scale and has no
token. The **sibling market-type chip row directly below it** (`:140`) already uses `gap-2` = 8px for the
same kind of chips, so 8px is the in-component precedent for chip spacing and the current 6px is an internal
inconsistency, not a deliberate density choice. **Ruling: unify to `gap="xs"`.** This is a deliberate +2px
visual change and must be evidenced (AC7), not silently shipped. **Stop condition:** if 8px causes the
2-column grid to reflow, clip, or overflow at 320px in any locale, do **not** invent a bespoke value — return
`BLOCKED — CANONICAL STYLE DECISION REQUIRED` with the measured evidence.

**D2 — `divide-y divide-border` → `gray-3` dividers.** `--border` resolves to `var(--neutral-200)` =
`#E5E5E5` (`globals.css:371` — corrected 2026-07-28, Task 675: the source comment there names a different,
non-rendering hex; measured `#E5E5E5`, see Task 675 §3.2), a **legacy shadcn token** with no Mantine
equivalent. The canonical divider in this exact component tree is `var(--mantine-color-gray-3)` (`#d0d5dd`,
`theme.ts` gray tuple index 3): the parent `MantineDrawer` already draws **both** its header bottom-border
(`MantineDrawer.tsx:148`) and its footer top-border (`:71`) with it, and its own source comment names it "the
same canonical gray-3 divider token as `MantineResponsiveActionFooter`'s `borderTop` (zero invented value)".
**Ruling: the section dividers adopt `gray-3`,** making the panel's internal separators consistent with its
own header/footer separators. This darkens the divider `#E5E5E5 → #D0D5DD` — a real, visible change, required
to be shown side-by-side in AC7. `gray-2` (`#e4e7ec`) is the closer hex but has **no** divider precedent in
this tree and must not be substituted.

**D3 — the divider mechanism.** The 17 sections currently separate via the parent's `divide-y`, which draws a
border on every child *except the first*. Reproduce that semantics, not "a border on every section" — a
top border on section 1 would sit directly beneath the Drawer header's own border and read as a double rule.

### 3.5 What the pattern must not disturb — `MantineDrawer`'s body layout

`MantineDrawer.tsx:44–64` (`DrawerBodyLayout`, desktop path) renders the scroll region as:

```tsx
<Box data-testid="mantine-drawer-scroll-content"
     style={{ flex:1, minHeight:0, overflowY:'auto', padding: contentPadding }}>
  <Stack gap="md"><Box>{children}</Box></Stack>
</Box>
```

with `contentPadding="var(--mantine-spacing-md)"` (16px, `:155`) and Mantine's own `body` padding forced to
`0` (`:152`). Consequences the executor must preserve exactly:

- Total horizontal inset of a section's content today is **16px (scroll region) + 20px (`px-5`) = 36px**. The
  new pattern supplies only the 20px; the 16px stays with the Drawer.
- `Stack gap="md"` wraps a **single** `<Box>`, so it contributes **no** inter-section gap. Sections are
  currently flush, separated only by the `divide-y` rule. Do not introduce a `Stack gap` between sections.
- The mobile path (`<640px`) routes through `ResponsiveBottomSheet` (`:125–133`) with the same
  `Stack gap="md"` + single-`Box` shape. Both breakpoints must be proven.

### 3.6 Existing coverage this task must preserve and extend

- **Critical flow:** `docs/critical-flow-registry.md` **row 50** — "Listings filter controls — leaf
  sub-components + shell (Mantine)" explicitly names `FiltersPanel.tsx` shell. **Clause 15 applies:** this
  task must establish the baseline, preserve/extend automated coverage, and record commands + evidence.
- **RTL suite:** `src/components/shared/__tests__/filtersPanelShell.smoke.test.tsx` — **15 tests**, mounts
  the **real** `FiltersPanel`. Four of them assert structure this migration will touch:

| Test (line) | Asserts | Migration risk |
|---|---|---|
| `:203` "the market-type row wraps whole buttons (`sm:flex-wrap`, `w-full sm:w-auto`) — no `flex-1` squeeze" | the literal Tailwind classes on `:140`/`:143` | **WILL FAIL** once those classes move to Mantine props. Must be rewritten to assert the *observed wrap behaviour*, never weakened or deleted. |
| `:195` toggle `Button` label `wordBreak:normal` + `overflowWrap:break-word` | the Task 567 round-2 theme fix | must stay green |
| `:217` / `:291` desktop + mobile header `gray-3` bottom border | `MantineDrawer` chrome | must stay green |
| `:242` / `:253` footer is NOT a descendant of the scroll container | Fix 4 pinned footer | must stay green |

- Sibling suites that must stay green untouched: `filterLeafComponents.smoke.test.tsx`,
  `filtersRangeDatePicker.smoke.test.tsx`, `heroSearch.smoke.test.tsx`.
- **Canonical Story:** `src/stories/mantine/primitives/FiltersPanelShell.stories.tsx` renders the **real**
  `FiltersPanel` already `open`, with `property_type`/`market_type` pre-seeded. Clause 16c is therefore
  already satisfied for the consumer; this task must keep it rendering the real component and must **not**
  replace it with a stand-in.
- **Geometry:** Task 569 **removed** `FiltersPanelShell`'s `GEOMETRY_ALLOWLIST` `element-overlap` exemption
  (`check-stories-rendered.mjs:605–611`); it now passes **16/16 without an exemption**. Re-introducing an
  allowlist entry to make this task green is an explicit failure.

### 3.7 Governance state

`scripts/mantine-migration-scope.json` currently holds **11** entries (Task 670 added the 11th) and does
**not** contain `FiltersPanel.tsx`. The `FiltersPanelShell` story already statically imports the real
component, so enrolment passes `check:story-coverage` immediately. Adding `FiltersPanel.tsx` **and** the new
`MantineFilterSection.tsx` takes the count to **13**.

`FiltersPanelShell` is **not** in `ASSERT_STORIES`; it earns standing enforcement through the
`Mantine/Primitives/` **title prefix** under `--mantine-only` (documented in the story's own header comment).
The new pattern Story must sit under `Patterns/Mantine/` — the second prefix that scope recognises.

### 3.8 Worktree state at design time — **clean**

Task 670 was reviewed, approved and committed by the owner before this task was written
(`3feaefde8` `feat(Task670): Mantine HeroSearch ssr:false fallback with measured first-paint geometry parity`,
plus the session-log addendum `bb5ae0ede`). Verified at design time:

- `git status --short` → only this kickoff file, untracked. No Task 670 residue.
- `git show HEAD:scripts/mantine-migration-scope.json` → **11 entries**, ending in
  `"src/components/shared/HeroSearchFallback.tsx"`. This is the committed baseline Task 671 appends to.
- `git show HEAD:docs/backlog.md | wc -l` → **79** (Opus consolidated it during the Task 670 review;
  the `BACKLOG LIMIT BREACH` is cleared, so the ≤4-line Task 671 row fits within budget).

**Mandatory executor step regardless:** re-snapshot `git status --porcelain` **before the first write** and
record it in the session log. If it is not clean — another task may have landed in the interim — reconcile
every entry before touching a shared file, and **append** to `mantine-migration-scope.json` rather than
rewriting or reordering it.

A zero-byte `.git/index.lock` recurs in this sandbox after read-only `git` commands and cannot be unlinked
from the agent environment. It is an owner-side condition. Do not attempt recovery commands.

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | cl. 16b; §2 | `MantineFilterSection` exists in `src/design-system/mantine/patterns/`, is exported from `patterns/index.ts`, is composed only of `@mantine/core` primitives, and carries zero Tailwind utility classes | P0 | Source inspection + AC1 | Confirmed |
| R2 | cl. 16c; §3.7 | The new pattern has a canonical `Patterns/Mantine/FilterSection` Story that statically imports it, and both it and `FiltersPanel.tsx` are enrolled in `mantine-migration-scope.json` (13 total) | P0 | `check:story-coverage` (AC2) | Confirmed |
| R3 | cl. 16; §3.1 | `FiltersPanel.tsx` contains **0** raw `<div>`/`<span>`/`<p>` elements and **0** layout/spacing/colour Tailwind `className` values; all 17 section wrappers consume `MantineFilterSection` | P0 | grep + diff (AC3) | Confirmed |
| R4 | cl. 3, 4, 5; §3.6 | Every filter behaviour is preserved byte-identically: `useHomepageFilters` wiring, all `update()`/`onToggle` handlers, `shows()` conditionals, `contentReady` idle-mount gate, Apply/Reset, Drawer open/close | P0 | AC4 + RTL suites | Confirmed |
| R5 | cl. 15; registry row 50 | The critical-flow RTL suite is preserved and **extended**: the class-coupled test at `:203` is rewritten to assert observed behaviour, and the migration gains changed-behaviour coverage | P0 | AC5 + planted-violation proof | Confirmed |
| R6 | §3.3, D1, D2 | Every spacing/colour value traces to a `theme.ts` token or a §3.4 ruling; **no** new `design-tokens-allow` marker and **no** new `GEOMETRY_ALLOWLIST` entry | P0 | `check:design-tokens` (AC6) | Confirmed |
| R7 | cl. 12, 16; D1, D2 | The two deliberate visual changes (D1 +2px grid gap, D2 divider `#E5E5E5→#D0D5DD`) are captured side-by-side before/after; every other rendered pixel is unchanged | P0 | AC7 | Confirmed |
| R8 | cl. 13; §3.6 | `FiltersPanelShell` still renders the **real** `FiltersPanel`, still passes 16/16 with **no** `GEOMETRY_ALLOWLIST` exemption | P0 | AC8 | Confirmed |
| R9 | cl. 7; I5 | Zero new user-facing strings; `check:i18n` key counts unchanged across `sq`/`en`/`uk`/`it` | P1 | AC9 | Confirmed |
| R10 | cl. 9 | Final `npm run build` exits 0; no required gate left unrun or failing | P0 | AC10 | Confirmed |
| R11 | cl. 14 | Touched text files stay UTF-8 no-BOM, mojibake-free | P1 | AC11 | Confirmed |
| R12 | §3.8 | The pre-write worktree snapshot is recorded, and `mantine-migration-scope.json`'s 11 committed entries are provably unchanged by this task's append | P0 | AC12 | Confirmed |
| R13 | D1 stop condition | If `gap="xs"` breaks the 320px grid in any locale, the task **stops** rather than inventing a value | P0 | AC7 escalation branch | Confirmed |

---

## 5. Assumptions and open questions

**Assumptions (stated, not verified — executor must confirm or escalate):**

- **A1.** The `FiltersPanelShell` story's fixture (2 locations, `property_type`/`market_type` pre-seeded,
  `activeFiltersCount` derived) exercises **all 17** sections only if every `shows(...)` predicate passes for
  the seeded `property_type`. If some sections are hidden by `shows()` under that fixture, the rendered proof
  covers fewer than 17 wrappers. **Confirm which sections actually render** and state the real number; if
  coverage is partial, add a second Story export with a fixture that renders the remaining sections rather
  than claiming full coverage.
- **A2.** `MantineFilterSection` is expected to be reusable by `ListingsFilters.tsx` later. That is a
  *design intent*, not a verified fit — `ListingsFilters` has a different layout (no `SectionHeader`, no
  `px-5 py-5`). Do **not** shape the pattern's API around a consumer this task never inspects, and do not
  touch that file.

**Open questions — none blocking.** D1 and D2 were resolved at design time with cited provenance; the only
fork is the D1/R13 stop condition.

**Explicitly NOT assumed:** that the 27-element count in `docs/backlog.md` came with an accurate description
(it did not — §1), that `SectionHeader`'s `right` prop has a consumer (it does not — §3.2), or that
`divide-border` has a Mantine equivalent (it does not — D2).

---

## 6. Pre-read rule bundle

Read exactly these, in this order. Do not read the full `docs/` tree.

**Always required**

1. `docs/agent-contract.md` — clauses 3, 4, 5, 7, 9, 12, 13, 14, 15, 16, 16a, 16b, 16c.
2. `docs/rule-index.md`
3. `docs/qa-profiles.md` — the **Q4** row + the viewport policy in §25.
4. `docs/backlog.md` — current state (note §1's correction).
5. `docs/critical-flow-registry.md` — **row 50 in full**. It is long; read it, it is the behavioural
   contract this task must not break.

**Current Mantine UI path**

6. `docs/mantine-responsive-design-system.md`
7. `docs/tailadmin-style-reference.md`
8. `docs/component-rules.md` — container/presentational split, no-duplicate, i18n.
9. `docs/ui-rules.md` — routing and legacy-boundary notes only.
10. `docs/qa-rules.md`

**Storybook / visual proof**

11. `docs/storybook-governance.md` — §15 (manifest enrolment) + the geometry-checks section.
12. `docs/storybook-visual-snapshots.md`

**Source pre-read (read before writing any code)**

13. `src/components/shared/FiltersPanel.tsx` — all 387 lines.
14. `src/components/shared/useHomepageFilters.ts` — the logic that must stay byte-identical.
15. `src/design-system/mantine/patterns/MantineDrawer.tsx` — lines 44–75 (`DrawerBodyLayout`) and 114–160.
16. `src/design-system/mantine/patterns/MantineHomeSection.tsx` — **the pattern-creation precedent**
    (Task 662): `Box`-composed, prop-typed, documented, exported.
17. `src/design-system/mantine/patterns/index.ts` — export convention (named component + named props type).
18. `src/design-system/mantine/theme.ts` — lines 5–16 (gray tuple) and 171–181 (spacing/radius).
19. `src/stories/mantine/primitives/FiltersPanelShell.stories.tsx`
20. `src/stories/patterns/mantine/HomeSection.stories.tsx` — the `Patterns/Mantine/*` Story precedent.
21. `src/components/shared/__tests__/filtersPanelShell.smoke.test.tsx` — all 15 tests, especially `:195`,
    `:203`, `:217`, `:242`, `:253`, `:291`.
22. `scripts/check-story-coverage.mjs` (lines 1–60) and `scripts/check-stories-rendered.mjs` (lines 595–615,
    the `GEOMETRY_ALLOWLIST` tail).

---

## 7. Scope

Exactly these paths may be created or modified:

| Path | Action | Why |
|---|---|---|
| `src/design-system/mantine/patterns/MantineFilterSection.tsx` | **create** | The canonical labelled-section wrapper (R1). |
| `src/design-system/mantine/patterns/index.ts` | modify | Export the component + its props type. **Append only** — do not reorder existing exports. |
| `src/stories/patterns/mantine/FilterSection.stories.tsx` | **create** | Canonical `Patterns/Mantine/FilterSection` Story (R2). |
| `src/components/shared/FiltersPanel.tsx` | modify | Consume the pattern; de-Tailwind the remaining 7 raw elements and the 5 Mantine-element `className`s (R3). |
| `src/stories/mantine/primitives/FiltersPanelShell.stories.tsx` | modify **only if A1 requires it** | A second fixture export to cover sections hidden by `shows()`. If A1 confirms full coverage, leave byte-identical. |
| `src/components/shared/__tests__/filtersPanelShell.smoke.test.tsx` | modify | Rewrite the `:203` class-coupled test to behavioural; add changed-behaviour coverage (R5). **No existing assertion may be deleted or weakened.** |
| `scripts/mantine-migration-scope.json` | modify | Append `MantineFilterSection.tsx` + `FiltersPanel.tsx` below the committed 11th entry. **Append only; never reorder or rewrite** (§3.8, AC12). |
| `docs/critical-flow-registry.md` | modify | Extend row 50's evidence column with this task's commands/proof (cl. 15). **Row 50 only.** |
| `docs/backlog.md` | modify | Concise current-state row only (≤4 lines). If already >80 lines, raise `BACKLOG LIMIT BREACH` instead of trimming another task's row. |
| `docs/sessions/2026-07-28-task671-filterspanel-detailwind-filtersection.md` | **create** | Session log with a `Files Changed` table matching the real diff. |

---

## 8. Out of scope

- **`src/modules/listings/components/ListingsFilters.tsx`** — owner decision 2026-07-28: a separate surface
  with a different layout, reserved for its own number. Do not touch it even though it shares the filter
  domain and consumes the same leaf components.
- **The leaf components** — `FilterRangeInputs`, `FilterMultiToggle`, `FilterRoomsRow`, `LocationCombobox`,
  `YearCombobox`, `RangeDatePicker`. Already migrated (Task 566), already covered. This task changes only
  what **wraps** them.
- **`useHomepageFilters.ts`** — all filter logic, `shows()` predicates, `activeCount`, `handleReset`,
  `handleApply`, `floorFilterMin`. Zero diff. Any change here is a scope violation.
- **`MantineDrawer` / `ResponsiveBottomSheet`** — the Task 567 round-2 Fix 2/Fix 4 chrome (header border,
  pinned footer, scroll-region split) is load-bearing and proven. Do not modify. If the migration appears to
  need a Drawer change, **stop and report**.
- **`HeroSearchView.tsx`, `HeroSearch.tsx`, `page.tsx`** — `FiltersPanel`'s consumers. Zero diff.
- **`theme.ts`** — no new tokens. D1/D2 both resolve to existing tokens.
- **Re-introducing a `GEOMETRY_ALLOWLIST` entry** for `FiltersPanelShell` — Task 569 removed it on purpose.
- **`docs/backlog.md` numbering reconciliation** — Opus corrected "next free" to **675** during the Task 670
  review; do not re-edit it.

---

## 9. Current and required behavior

### Current behavior to preserve

1. `FiltersPanel` is a `'use client'` component with the exact props
   `{ open, onClose, values, onChange, onApply, locations }`, consumed **only** by `HeroSearchView.tsx`.
2. It renders a `MantineDrawer` (`side="right"`, `size="sm"`) whose `title` is the label + an active-count
   badge shown only when `activeCount > 0`, and whose `footer` is a `MantineCountButton` Apply above a
   `variant="default"` Reset.
3. Body content renders only when `contentReady` (`useIdleMount(tier === 'low', open)`) is true.
4. Up to 17 labelled sections render in a fixed order, each gated by its `shows(...)` predicate except
   Location, Property type, Price, Period and Search-by-ID which always render.
5. Sections are visually flush, separated by a 1px rule between adjacent sections (none above the first).
6. Property-type chips render in a 2-column grid; market-type chips render as a column below `sm` and a
   wrapping row at/above `sm`; year-built renders as a 2-column min/max pair.
7. Selected chips use `variant="light"`, unselected `variant="default"`.
8. Apply commits the local draft via `onApply`; Reset clears all filters and leaves the panel open;
   backdrop/Esc/built-in-X discards the draft.

### Required after behavior

1. Items 1–4, 6 (layout semantics), 7 and 8: **unchanged**.
2. Item 5's rule is unchanged in geometry and position; its colour changes `#E5E5E5 → #D0D5DD` (D2).
3. The property-type grid gap changes 6px → 8px (D1).
4. Every wrapper listed in §3.1 is a Mantine primitive or `MantineFilterSection`; the file contains no raw
   element and no layout `className`.
5. `MantineFilterSection` is a registered, story-proven, manifest-enrolled member of the pattern library.

---

## 10. Implementation requirements

**I1 — `MantineFilterSection` API.** Presentational, no hooks, no data fetching. Required shape:

```tsx
export interface MantineFilterSectionProps {
  /** Section label. Rendered as the uppercase micro-heading. */
  label: ReactNode
  /** Optional trailing slot in the header row (e.g. a per-section clear action).
   *  Preserves the affordance of FiltersPanel's dead `SectionHeader.right` prop (§3.2);
   *  no consumer today. */
  action?: ReactNode
  /** Draws the 1px top separator. False for the first section (§3.4 D3). */
  withDivider?: boolean
  children: ReactNode
}
```

Compose from `@mantine/core` only — `Box`/`Stack`/`Group`/`Text`. Padding `p="lg"` (§3.3). Header bottom
margin `mb="sm"`. Divider colour `var(--mantine-color-gray-3)` (D2). **Zero `className`.** The label's
typographic treatment (`text-xs font-semibold uppercase tracking-wider`, `text-muted-foreground`) must be
reproduced through Mantine `Text` props and theme tokens; if `tracking-wider` (letter-spacing) has no Mantine
prop, use a `style` object with the literal CSS value and document it — that is a CSS property, not a
spacing/colour token, and `check:design-tokens` does not police it. Do **not** reach for a Tailwind class.

**I2 — de-Tailwind the remaining 7 raw elements and 5 Mantine `className`s.** Per §3.1: the title `Group` +
`Text` + count `Badge` (reuse the `Badge` treatment `MantineCountButton` already establishes — inspect it
first, do not hand-roll a pill), the footer `Stack gap="sm"`, the content root `Box`/`Stack`, the property
`SimpleGrid cols={2} spacing="xs"`, the market-type `Group` with responsive direction, the year-built
`SimpleGrid cols={2} spacing="xs"`. Button `className="justify-start text-left"` → Mantine `justify="flex-start"`;
`className="w-full sm:w-auto"` → the responsive `w` style prop; `<RotateCcw className="h-4 w-4" />` → `size={16}`.

**I3 — the divider must not double up.** Implement D3: the first rendered section draws no top rule. Note
that `shows()` gating means **which** section is first is dynamic — derive it, do not hardcode index 0 of the
static list. This is the single most likely correctness bug in this task; cover it in AC5.

**I4 — canonical UI decision record** (mandatory artifact, `docs/orchestrator-ui-task-design.md`):

| Visible artifact | Search queries and inspected paths | Canonical source | Disposition | Shared style/token path |
|---|---|---|---|---|
| Labelled section wrapper | `grep -rn "function SectionHeader" src/` → **1 hit, file-local** (§3.2); inspected `patterns/` (33 entries) — `MantineFormSectionStack` is a **form builder** (owns `useForm`, takes a `sections` config), not a layout wrapper; no other candidate | **none exists** | **create + register** | new `patterns/MantineFilterSection.tsx` + `Patterns/Mantine/FilterSection` Story + `index.ts` + manifest |
| Section padding | `theme.ts:171–177` | `spacing.lg` = 20px | **reuse** (exact) | `p="lg"` |
| Section divider | `MantineDrawer.tsx:71,148`; `globals.css:371` | `var(--mantine-color-gray-3)` | **extend** (D2) | Drawer's own divider token; `--border` is legacy shadcn |
| Property-grid gap | `theme.ts:171–177`; sibling row `FiltersPanel.tsx:140` | `spacing.xs` = 8px | **decided** (D1) | `spacing="xs"`; stop if 320px breaks |
| Active-count badge | inspect `patterns/MantineCountButton.tsx` (variant-aware `Badge`, Task 567 round-2 Fix 3) | Mantine `Badge` as composed there | **reuse** | do not hand-roll the pill |

**I5 — no new user-facing strings.** Every label already resolves through `common`/`listing`. The pattern
takes `label` as a `ReactNode` from the consumer and must contain **no** literal text. `check:i18n` counts
unchanged.

**I6 — the RTL rewrite is a strengthening, not a swap.** The `:203` test currently asserts Tailwind class
names. Rewrite it to assert the **observed** wrap behaviour (e.g. computed `flex-wrap`/`width`, or the
rendered geometry of the chip row), so it would still fail if the row regressed to a `flex-1` squeeze. A test
that merely mirrors the new prop names is not acceptable. All 14 other tests stay byte-identical and green.

**I7 — planted-violation proof (Q4).** Demonstrate that the extended suite genuinely fails: plant a defect in
the D3 first-section divider logic (make every section draw a rule), show the new test exits non-zero and
names the failure, revert, show green, and confirm the plant is absent from the final `git status`.

---

## 11. Positive and negative flows

### Positive flow

Homepage `/{locale}` (any of `sq`/`en`/`uk`/`it`), user taps the filters trigger in the hero search bar:

1. `HeroSearchView` sets `filtersOpen`; `FiltersPanel` opens as a right Drawer ≥640px, bottom sheet <640px.
2. `contentReady` is true (or resolves on idle); the section list renders in order.
3. Each section shows its uppercase label and its control; adjacent sections are separated by one 1px rule;
   the first section has none.
4. Selecting a property type re-runs `shows()`, changing which sections render — the divider set adjusts and
   the (new) first visible section still has no top rule.
5. Apply commits the draft and closes; the hero trigger's count badge updates.

### Negative-flow applicability table

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Validation | **No** | The wrappers accept no input; leaf components own their own validation (Task 566) | N/A | — |
| Authorization / RLS | **No** | Public route; the panel performs no query (`useHomepageFilters` is local draft state) | N/A | — |
| Empty / zero state — no sections gated in | **Yes** | `shows()` predicates | With the narrowest `property_type`, only the always-on sections render; **the first visible one still draws no top rule** and no empty wrapper is emitted | RTL (I3/AC5) |
| `contentReady === false` (LOW tier, pre-idle) | **Yes** | `useIdleMount` | Drawer renders header + footer with an **empty** body; no crash, no orphan divider | RTL + inspection |
| Locale expansion (uk/it long labels) | **Yes** | cl. 7, 11 | Section labels and chip labels wrap, never clip; no horizontal overflow at 320px | AC7 rendered matrix |
| Small viewport (<640 bottom sheet) | **Yes** | `MantineDrawer` mobile path (§3.5) | Same section rhythm and dividers; pinned footer still outside the scroll region | AC5 (`:253`, `:291`) + AC7 |
| Duplicate action / concurrent writer | **No** | Local draft state, single owner, batch-Apply model | N/A | — |
| Hydration mismatch | **Yes** | `useResponsiveDropdown` SSR caveat (`MantineDrawer.tsx:112–114`) | No new hydration console errors on `/en`, `/sq`, `/uk` | `check:hydration` |
| RTL (text direction) | **No** | Locales are `sq`/`en`/`uk`/`it` — none RTL | N/A | — |

---

## 12. Acceptance criteria

- **AC1 [R1]** — *Given* `MantineFilterSection.tsx`, *when* inspected, *then* it imports only from
  `@mantine/core` (plus `react` types), contains **zero** `className` attributes and zero raw
  `<div>`/`<span>`/`<p>`, exposes exactly the I1 props, and is exported from `patterns/index.ts`. Evidence:
  `grep -c 'className=' src/design-system/mantine/patterns/MantineFilterSection.tsx` → `0`, plus the diff.

- **AC2 [R2]** — *Given* both new manifest entries, *when* `npm run check:story-coverage` runs, *then* it
  exits 0 and reports **13/13** covered (11 today + `MantineFilterSection.tsx` + `FiltersPanel.tsx`), with
  both new components shown as covered. A pass at an unchanged 11/11 means enrolment did not happen — FAIL.

- **AC3 [R3]** — *Given* the migrated `FiltersPanel.tsx`, *when* inspected, *then*
  `grep -o '<\(div\|span\|p\)\b' src/components/shared/FiltersPanel.tsx | wc -l` → **0** and
  `grep -c 'className=' src/components/shared/FiltersPanel.tsx` → **0**. Report both numbers before and
  after (27→0, 32→0).

- **AC4 [R4]** — *Given* the diff, *when* reviewed, *then* `useHomepageFilters.ts` has **zero** diff lines;
  every `update(...)`/`onToggle` closure, every `shows(...)` guard, the `contentReady` gate, `handleApply`
  and `handleReset` are byte-identical; and `HeroSearchView.tsx`/`HeroSearch.tsx`/`page.tsx` are absent from
  `git status`. Evidence: `git diff --stat` plus the file diff.

- **AC5 [R5, cl. 15]** — *Given* the extended suite, *when*
  `npx vitest run src/components/shared/__tests__/filtersPanelShell.smoke.test.tsx src/components/shared/__tests__/filterLeafComponents.smoke.test.tsx src/components/shared/__tests__/filtersRangeDatePicker.smoke.test.tsx src/components/shared/__tests__/heroSearch.smoke.test.tsx`
  runs, *then* every pre-existing assertion passes, the `:203` test asserts observed behaviour rather than
  class names, and **new** tests cover: (a) the first *visible* section draws no top rule while a later one
  does, (b) that this holds after a `shows()`-changing property-type selection, (c) `contentReady === false`
  renders no orphan divider. Report the test count before (15) and after.

- **AC6 [R6]** — *Given* the completed change, *when* `npm run check:design-tokens` runs, *then* the
  violation set is **identical** to the pre-change set (44 pre-existing at design time, all in
  `page.tsx`/`PopularLocationsView.tsx`/`NotificationCenter.tsx`), with **zero** entries in any file this
  task touched, **zero** new `design-tokens-allow` markers, and `0 stale-marker(s)`. The gate's non-zero exit
  is a known repo-wide condition; the **delta** is what this AC asserts.

- **AC7 [R7, R13]** — *Given* Q4 rendered evidence, *when* captured, *then* it covers the canonical 14 widths
  (`320/375/390/480/560/680/768/810/960/1024/1200/1440/1920/2560`) × all four locales for
  `Mantine/Primitives/FiltersPanelShell` and `Patterns/Mantine/FilterSection`, with `uk@320` explicitly
  present; **and** a before/after side-by-side isolates exactly two deltas — the property-grid gap (6→8px)
  and the divider colour (`#E5E5E5→#D0D5DD`) — with every other measured value unchanged. TailAdmin
  side-by-side is required for the divider reading. *If the 8px gap causes reflow, clipping or overflow at
  320px in any locale, stop and return `BLOCKED — CANONICAL STYLE DECISION REQUIRED` with the measured
  table.*

- **AC8 [R8]** — *Given* `npm run screenshots:assert -- --mantine-only`, *then* `FiltersPanelShell` passes
  **16/16** with **no** `GEOMETRY_ALLOWLIST` entry added, `FilterControls` and `HeroSearch` are unchanged,
  and total FAIL is 0. Then `npm run screenshots:assert` (full) with before/after totals; attribute every
  delta cell by cell. Note the ±2-cell flake band recorded in the Task 670 review — name any residue against
  it rather than absorbing it silently.

- **AC9 [R9]** — *Given* `npm run check:i18n`, *then* it exits 0 with key counts **unchanged** across all
  four locales, and no new key was added.

- **AC10 [R10]** — *Given* the completed change, *when* `npm run build` runs, *then* it exits 0 and the
  transcript is fresh (post-change), not carried over.

- **AC11 [R11]** — *Given* every touched text file, *when* `npm run check:file-integrity` and
  `npm run check:mojibake` run, *then* both exit 0.

- **AC12 [R12]** — *Given* the §3.8 clean start, *when* the session log is written, *then* it contains the
  pre-write `git status --porcelain` snapshot, and `git diff scripts/mantine-migration-scope.json` shows
  **only** two added lines with the 11 committed entries byte-identical and in their original order (a
  reordered or rewritten manifest is a FAIL even if the entry set matches). If the pre-write snapshot was
  **not** clean, additionally record a before/after content witness for every shared path.

---

## 13. QA profile and verification plan

### 13.1 Profile

**`Q4 — Release / Critical Flow`.**

Justification against `docs/qa-profiles.md:16`: Q4 applies to "changes touching
`docs/critical-flow-registry.md`". `FiltersPanel.tsx` shell is named explicitly in **row 50**. Q4 therefore
requires Q3's full visual matrix **plus** a regression baseline, changed-behaviour tests, and a
planted-violation failure proof (I7). Q3 alone is insufficient and the Q2 de-escalation clause does not apply.

### 13.2 Order of operations (mandatory)

1. `git status --porcelain` — record the pre-write snapshot and reconcile against §3.8. Capture the
   "before" content witness for `scripts/mantine-migration-scope.json`.
2. Record the **baseline**: run the 4 RTL suites (expect 15 + siblings green) and
   `npm run screenshots:assert -- --mantine-only`; save the numbers. Confirm A1 (how many of the 17 sections
   actually render under the story fixture).
3. Create `MantineFilterSection.tsx` + its Story + `index.ts` export. Build Storybook; confirm the Story
   renders.
4. Migrate `FiltersPanel.tsx` onto it; de-Tailwind the remaining 7 elements and 5 `className`s.
5. Rewrite the `:203` test behaviourally; add the AC5 (a)/(b)/(c) tests. Run I7's planted-violation proof.
6. Manifest enrolment (append) + `docs/critical-flow-registry.md` row 50 evidence update.
7. Rebuild Storybook; run the full §13.4 gate list.

### 13.3 The before/after visual diff (AC7)

There is **no** measurement harness to write for this task — the two deltas are known and bounded, so a
capture-and-compare is sufficient and a new `taskNNN-qa-*.mjs` script would be unjustified scope. Capture the
`FiltersPanelShell` story at the AC7 matrix **before** step 4 and **after** step 6 from the same
`storybook-static` pipeline, then diff:

- **Expected to change:** the property-grid gap (+2px) and the divider colour. Report the measured pixel
  values for both, before and after.
- **Expected identical:** section padding (20px), the 36px total content inset (§3.5), header/footer borders,
  footer pinning, chip variants, every label's position.
- Any third difference is a defect — investigate before proceeding, do not explain it away.

### 13.4 Gates (all must be run; report actual exit codes)

| Command | Expected | Purpose |
|---|---|---|
| `npm run typecheck` | 0 | Baseline |
| `npx vitest run src/components/shared/__tests__/filtersPanelShell.smoke.test.tsx src/components/shared/__tests__/filterLeafComponents.smoke.test.tsx src/components/shared/__tests__/filtersRangeDatePicker.smoke.test.tsx src/components/shared/__tests__/heroSearch.smoke.test.tsx` | 0, count ≥ before | AC5, cl. 15 |
| *(planted-violation run of the same command)* | **non-zero**, names the D3 defect | I7, Q4 |
| `npm run check:stories` | 0 | Story validity |
| `npm run check:story-coverage` | 0, **13/13** | AC2 |
| `npm run build-storybook` | 0 | Prereq for rendered proof |
| `npm run screenshots:assert -- --mantine-only` | 0 FAIL before **and** after; `FiltersPanelShell` 16/16 | AC8 |
| `npm run screenshots:assert` | before/after totals, every delta attributed | AC8 |
| `npm run governance:screenshots` | 0 | Screenshot governance |
| `npm run governance:components` | 0 | Catalog governance (new pattern member) |
| `npm run check:design-tokens` | violation **set identical** to before; 0 in touched files; 0 stale markers | AC6 |
| `npm run check:locale-leak -- --mantine-only` | no new leak vs. baseline | Locale hygiene |
| `npm run check:i18n` | 0, counts unchanged | AC9 |
| `npm run check:hydration` | 0 on `/en`, `/sq`, `/uk` | Hydration branch (§11) |
| `npm run check:file-integrity` | 0 | AC11 |
| `npm run check:mojibake` | 0 | AC11 |
| `npm run build` | **0 — hard gate** | AC10, cl. 9 |

For `screenshots:assert`, `--mantine-only`, `check:design-tokens` and `check:locale-leak`, record the
**before** numbers first. A bare "passes" without a before/after delta is not acceptable evidence.

### 13.5 Manual steps

- Open the panel at `uk@320` and `1440`, select a property type that changes the `shows()` set, and confirm
  the first *visible* section still has no top rule (the D3/I3 risk) — attach a capture, do not reason about it.
- TailAdmin side-by-side for the divider reading (AC7).

---

## 14. Completion report contract

The session log at `docs/sessions/2026-07-28-task671-filterspanel-detailwind-filtersection.md` must contain:

1. **Files Changed** table matching the real `git diff` exactly — path, action, one-line reason.
2. **Requirement IDs completed** (R1–R13), each mapped to its AC and the evidence that closed it.
3. **Commands run**, each with its **actual** exit code and salient output. Not "all pass".
4. **The raw-element and `className` counts before and after** (27→0, 32→0), from real `grep` output.
5. **The AC7 before/after visual table** — the two expected deltas with measured pixel values, plus the
   explicit statement that no third delta was found.
6. **The I7 planted-violation proof**, including the revert confirmation and the final clean `git status`.
7. **A1 confirmed or corrected** — how many of the 17 sections the story fixture actually renders, and what
   was done about the remainder.
8. **The AC12 evidence**: the pre-write `git status --porcelain` snapshot and the
   `git diff scripts/mantine-migration-scope.json` showing an append-only, order-preserving change.
9. **RTL test count before (15) and after**, with each new test named and mapped to AC5 (a)/(b)/(c).
10. **Deviations** from this kickoff, each with its reason.
11. **Limitations** and unresolved issues, explicitly including anything the story fixture cannot exercise.

Backlog: add a **concise** current-state entry (≤4 lines) under "Last Session". Do not paste session detail
into `docs/backlog.md`; if the 80-line limit would be breached, raise `BACKLOG LIMIT BREACH` instead of
trimming another task's row.

**Status vocabulary.** Terminal status is `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`,
`PARTIALLY IMPLEMENTED`, or `BLOCKED`. Sonnet does not self-approve. Sonnet does not run, emit, suggest, or
delegate any mutating git command, including any form of `git push`.

**Handoff:** execute from this saved path —
`tasks/kickoff_prompt_Task_671_FiltersPanel_DeTailwind_Canonical_FilterSection.md` — under
`.claude/skills/execute-task/SKILL.md`.

---

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable by a fresh Sonnet session with no chat context | **Yes** — every path, line number, token value, command and precedent is named inline |
| Every primary requirement has ≥1 binary AC and ≥1 verification method | **Yes** — R1–R13 → AC1–AC12 (R13 is AC7's escalation branch) |
| Scope names what must not change | **Yes** — §8; `useHomepageFilters`, the leaf components, `MantineDrawer`, and all three consumers explicitly frozen, with AC4 asserting a zero-line diff |
| Current/legacy boundary explicit | **Yes** — §1 corrects the backlog's inaccurate framing; the surface is Mantine-current and this is de-Tailwind work |
| QA profile + source map + canonical decision record present | **Yes** — §13.1 (Q4, justified by registry row 50), §3.1, §10 I4 |
| Canonical-source search performed before proposing a style | **Yes** — §10 I4 row 1: `patterns/` inspected (33 entries), `MantineFormSectionStack` examined and **rejected with a stated reason** (form builder, not a layout wrapper), `SectionHeader` grep → 1 file-local hit |
| Owner-only exceptions traceable | **Yes** — three owner decisions dated 2026-07-28 (pattern extraction, `ListingsFilters` excluded, manifest enrolment), recorded in §2. The task authorizes no others |
| Negative flows selected by applicability, not copied | **Yes** — §11; 4 of 9 branches marked `No` with a stated owner/reason |
| No uninspected claim about a command, file, test, story, or behavior | **Yes** — all counts, line numbers, token values and test names were read this session; the 44-violation `check:design-tokens` baseline was produced by running it |
| Gates prove the changed behavior, not merely procedural | **Yes** — AC5 requires behavioural rewriting of the one class-coupled test plus three new dynamic-divider tests, and I7 requires a planted-violation transcript |
| Critical flow named with automated regression evidence | **Yes** — registry row 50 named; §7 requires updating its evidence column; AC5 + I7 supply the proof |
| Single active owner route | **Yes** — one route; the only fork is the D1/R13 `BLOCKED` stop |
| Every checkpoint names producer, output, comparator, failure behavior | **Yes** — §13.2 ordering, §13.3 comparator, §13.4 expected results |
| Baselines account for task-created artifacts | **Yes** — §13.2 step 2 records the RTL and screenshot baselines **before** any write; AC6 compares violation *sets*, not counts, so the two new files cannot mask a regression |
| Dirty-worktree handling | **N/A for content** — §3.8 verifies the worktree is clean at design time (Task 670 committed as `3feaefde8`/`bb5ae0ede`), with the committed 11-entry manifest and 79-line backlog quoted as the baseline. AC12 still requires a pre-write snapshot and an append-only manifest diff, and escalates to content witnesses if the start state is not clean |
| Assumptions visible to executor and reviewer | **Yes** — §5 A1–A2, plus the explicit "not assumed" clause |

**Known-risk note for the reviewer.** The single most likely defect in this task is I3/D3 — the "first
*visible* section draws no divider" rule under dynamic `shows()` gating. AC5 (a)/(b) and I7's planted
violation exist specifically to catch it. A green suite that does not exercise a `shows()`-changing selection
is not proof.
