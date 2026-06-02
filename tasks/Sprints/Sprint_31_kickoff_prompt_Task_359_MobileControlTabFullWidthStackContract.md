# Sprint 31 — Task 359 kickoff (Sonnet) — GLOBAL mobile control & tab contract: buttons + tab groups go full-width / stack below sm (640px); no ragged flex-wrap grids (NO route migration, NO new primitives)

> **Status: READY. Owner priority #1.** Owner evidence: on narrow screens (esp. **< ~580px**) buttons and
> tab groups render as an ugly ragged "grid" instead of clean full-width / stacked controls. Owner decision
> (2026-06-02): the stacking threshold is **`sm` (< 640px)** — below it, buttons and tab groups must become
> **full-width / stacked**, with no ragged wrapping and no sub-tappable controls.
>
> **You are Sonnet 4.6, the executor.** Implement the literal acceptance criteria below. Do NOT change
> scope. Do NOT introduce a new layout primitive (ActionBar/ControlGroup were just deleted in Task 358 —
> do NOT resurrect them). Do NOT migrate admin/app routes. Do NOT rewrite Storybook config. If anything is
> ambiguous or a required decision is missing, **STOP and ASK the orchestrator** — do not improvise.
>
> **Single-writer git:** you do NOT run `git add` / `git commit` / any mutating git. End with a "Files
> Changed" table only; the ORCHESTRATOR (Opus) reviews the real diff and emits commit commands. (agent-contract clause 10.)

```
Type:     global responsive correctness contract for buttons + tabs (runtime; NO route migration, NO new primitives)
Priority: CRITICAL (owner first-priority)
Area:     src/components/ui/tabs.tsx · the 6 real tab consumers · DS action-cluster owners (PageHeader/FilterBar/AdminPageShell) ·
          docs (design-system / ui-rules) · the consolidated stories from Task 358 (proof only)
Depends:  Task 358 (deletes ActionBar/ControlGroup + canonicalizes stories). 359 establishes the action-stacking
          contract that ActionBar used to carry, now as a documented class fragment + per-consumer application.
Threshold: stack/full-width below sm (< 640px). (Owner said "~580px"; sm=640 covers it with no custom theme change.)
```

## Role contract

You are **Sonnet 4.6, the executor**. You make buttons and tab groups behave correctly below `sm` (640px):
full-width / stacked, ≥44px tappable, no ragged flex-wrap grid, no horizontal page overflow. You fix the
canonical `tabs` primitive, the real tab consumers, and the action-cluster layout in the DS owners; you
document the canonical stacking fragment (the ActionBar replacement). You do **not** add a new primitive,
**not** migrate routes, **not** touch DB/RLS/auth, **not** rewrite Storybook config, **not** change product
data/logic, and **not** run git. Outside-allowlist = scope violation = STOP & ASK. Opus reviews the diff.

## Confirmed audit (orchestrator, 2026-06-02 — anchored to real code)

- `src/components/ui/tabs.tsx` → `TabsList` is `inline-flex w-fit` (content-width, single row). At narrow
  widths a multi-tab list overflows or wraps into a ragged grid. No `<sm` full-width / scroll behavior.
- **Real tab consumers (must be fixed + verified):**
  - `src/modules/cabinet/components/CabinetShell.tsx`
  - `src/modules/listings/components/ListingsStatusTabs.tsx`
  - `src/components/admin/AdminCurrencyTabs.tsx`
  - `src/components/admin/AdminEmailTemplatesManager.tsx`
  - `src/components/admin/AdminFooterManager.tsx`
  - `src/components/admin/AdminPagesManager.tsx`
- **Action-cluster owners:** `ActionBar` (which carried `[&>*]:max-md:w-full`) was DELETED in Task 358, so
  the mobile-stacking contract now lives in the consumers: `src/components/layout/PageHeader.tsx` (action
  slot), `src/components/layout/FilterBar.tsx` (action/trigger row), `src/components/admin/AdminPageShell.tsx`
  (actions container). These currently stack at `md` (768) or use `sm`/`flex-wrap` inconsistently → owner sees
  ragged grids between ~480–640px.
- `src/components/ui/button.tsx` sizes: a button is full-width only when its container sets `w-full`; the
  fix is the **container/cluster** contract, NOT the button variant. Do NOT change button size variants here
  (touch-target floor was handled earlier; this task is about full-width stacking).

## Pre-read (load ONLY these — `docs/rule-index.md`: "UI / layout / component")

**Always required:** `docs/agent-contract.md`, `docs/backlog.md`.
**Required:** `docs/design-system.md` (esp. §3 widths, §11 filters/actions, §12 touch targets, the
removed-ActionBar section), `docs/ui-rules.md` (esp. §3 button sizes, §8 touch targets, §15 control-height
alignment, §17 UI pre-flight), `docs/component-rules.md`, `docs/component-governance.md`, `docs/qa-rules.md`.
**Required (Storybook):** `docs/storybook-governance.md` (the scenario-named rule from Task 358).
**Then inspect** `src/components/ui/tabs.tsx`, the 6 tab consumers, `PageHeader.tsx`, `FilterBar.tsx`,
`AdminPageShell.tsx`, and the consolidated stories for these components (Task 358) used as proof surfaces.

## Canonical contract to ESTABLISH (document once, apply everywhere)

### Tabs (below sm = < 640px)
- The tab list becomes **full-width** (spans the container).
- **≤ 3 tabs:** triggers are equal-width (`flex-1`), filling the full row, each **≥ 44px tall**.
- **> 3 tabs:** the tab list is a **full-width, single-row, horizontally-scrollable** strip (`overflow-x-auto`,
  `flex-nowrap`), each trigger keeping a comfortable tap size (≥ 44px tall, no squish). **No ragged wrap into
  multiple uneven rows.**
- At `sm:` and above, current desktop behavior is preserved (content-width row).
- Keyboard/focus/`role=tablist`/aria-selected and active-tab styling preserved.
- If a specific consumer has a tab count or layout that neither rule fits cleanly → STOP & ASK.

### Buttons / action clusters (below sm = < 640px)
- An action cluster (primary/secondary/destructive group, filter triggers, page-header actions) **stacks
  vertically**, each control **`w-full`** and **≥ 44px tall**. **No `flex-wrap` ragged grid** of half-width
  pills below sm.
- At `sm:` and above, the row layout (horizontal, content-width, right/left aligned) is preserved.
- Canonical fragment (document it; this replaces the deleted ActionBar contract), e.g.:
  `flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center [&>*]:max-sm:w-full`
- No horizontal page overflow at 320/360/375/390/412/480/560/640.

## Mandatory scope (literal)

1. **`tabs.tsx`** — add the `<sm` full-width behavior (≤3 → `flex-1`; >3 → full-width horizontal scroll),
   ≥44px trigger height on mobile, preserve desktop + aria/keyboard. Additive, non-breaking to the API.
2. **The 6 tab consumers** — ensure each adopts the responsive tab list (most should inherit it from the
   primitive; where a consumer overrides `TabsList`/trigger classes in a way that breaks the contract, fix
   that consumer). Verify each real screen at 320/375/390/480/560/640.
3. **Action-cluster owners** (`PageHeader.tsx` action slot, `FilterBar.tsx` action/trigger row,
   `AdminPageShell.tsx` actions container) — apply the `<sm` full-width-stack fragment so actions stack
   full-width below 640 instead of forming a ragged grid. Preserve desktop layout + existing APIs/props.
4. **Document** the contract in `docs/design-system.md` (a "Mobile control & tab stacking contract (< sm)"
   section — replaces the removed ActionBar section) and `docs/ui-rules.md` (the canonical fragment + the
   tab ≤3/>3 rule). Update `docs/responsive-screenshot-matrix.md` if the proof stories change.
5. **Proof** via the Task 358 scenario stories (no NEW per-width stories) — verify through the viewport
   toolbar; capture screenshots where claimed PASS.

## Allowed file areas (edit ONLY these)

```
src/components/ui/tabs.tsx                                  (additive <sm full-width / scroll + ≥44px; preserve API + aria)
src/modules/cabinet/components/CabinetShell.tsx             (tab list responsive — ONLY the tab/layout classes)
src/modules/listings/components/ListingsStatusTabs.tsx      (tab list responsive — ONLY the tab/layout classes)
src/components/admin/AdminCurrencyTabs.tsx                  (tab list responsive)
src/components/admin/AdminEmailTemplatesManager.tsx         (tab list responsive — ONLY the tab strip; not the manager logic)
src/components/admin/AdminFooterManager.tsx                 (tab list responsive — ONLY the tab strip)
src/components/admin/AdminPagesManager.tsx                  (tab list responsive — ONLY the tab strip)
src/components/layout/PageHeader.tsx                        (action slot <sm full-width-stack)
src/components/layout/FilterBar.tsx                         (action/trigger row <sm full-width-stack)
src/components/admin/AdminPageShell.tsx                     (actions container <sm full-width-stack)
docs/design-system.md · docs/ui-rules.md · docs/responsive-screenshot-matrix.md · docs/backlog.md
docs/sessions/2026-06-02-task-359-mobile-control-tab-fullwidth-contract.md (NEW)
the consolidated *.stories.tsx for the above components (Task 358) — ONLY to adjust proof fixtures if needed (no new per-width exports)
```

## Forbidden file areas (STOP & ASK if any seems required)

```
src/components/ui/button.tsx                 (do NOT change button size/variant; full-width is a container concern)
re-creating ActionBar / ControlGroup or any new layout primitive
src/app/**                                   (route adoption out of scope; READ-only for the empty-diff proof)
src/modules/** EXCEPT the two named tab files (CabinetShell, ListingsStatusTabs) — and only their tab/layout classes
database migrations / SQL · Supabase / RLS / auth · package.json / package-lock.json
.storybook/main.ts · .storybook/preview.tsx
messages/*.json                              (no new keys expected)
product data/logic, manager business logic (only the tab-strip layout in the admin managers)
```

## Current behavior to PRESERVE

Desktop (≥ sm) layout of every tab list and action cluster; all tab/manager logic, props, data, and aria/
keyboard semantics; FilterBar active-vs-available contract; PageHeader/AdminPageShell APIs; the canonical
button size/variant matrix; the Task 358 scenario story names; Storybook viewport/locale toolbars; lint/
build/i18n baselines. Note 20: no existing control may be silently removed — controls move/stack, they do
not disappear.

## Localization & responsive

Locales **sq / en / uk / it** via the locale toolbar (long uk/it labels are the stress case — they must
wrap/stack, not overflow). Verify at the canonical widths with emphasis on **320 / 360 / 375 / 390 / 412 /
480 / 560 / 640** (the band where the ragged grid appears) and confirm desktop unaffected at 768 / 1024 /
1280 / 1440 / 2560. `check:i18n` must pass.

## Positive flow (happy path) — required (Task 255 rule)

**Actor:** owner/designer on a phone-width viewport. **Precondition:** Task 358 landed (ActionBar/ControlGroup
gone, stories canonical); viewport + locale toolbars intact.
1. Owner opens any tab consumer (cabinet, listings status, admin currency/email/footer/pages) at 320–560px →
   the tab list is **full-width**; ≤3 tabs fill equally; >3 tabs scroll horizontally in one clean row; each
   tab ≥44px tall; no ragged multi-row grid; no horizontal page overflow.
2. Owner opens a PageHeader/FilterBar/AdminPageShell action cluster at 320–560px → actions **stack
   vertically, each full-width, ≥44px**; no half-width pill grid.
3. Owner resizes to ≥640px → desktop row layout returns unchanged.
4. Owner toggles sq/en/uk/it → long labels wrap/stack, never overflow.
**Post-condition:** no ragged grids below 640; desktop unchanged; `tsc`/`build`/`lint`/`check:i18n` clean;
`build-storybook` exits 0; no `src/app`/button.tsx/DB/package/Storybook-config diff; only the named module
files touched in `src/modules`.

## Negative flow (off-happy-path branches) — required (Task 255 rule)

- **> 3 tabs at 320px** → full-width horizontal scroll, NOT a wrapped grid; tabs keep ≥44px height.
- **Very long uk/it tab or button label** → wraps/stacks within bounds; no overflow; no mid-label clip.
- **A single action button** → full-width below sm (not a lonely left-aligned pill); fine at desktop.
- **Destructive + primary + secondary trio** → stacks full-width below sm in a sensible order; row at sm+.
- **A consumer overrides TabsList classes** in a way that re-breaks the contract → fix that consumer, do not
  fork the primitive.
- **Temptation to re-add ActionBar / a new cluster primitive** → DO NOT; use the documented class fragment.
- **A fix seems to need button.tsx / src/app / a non-listed src/modules file / DB / package** → STOP & ASK.
- **Desktop regression** → the mobile change must not alter ≥sm layout; verify both sides of the breakpoint.

## Acceptance criteria (literal)

1. `tabs.tsx`: below sm, tab list is full-width; ≤3 tabs `flex-1` equal-width; >3 tabs full-width horizontal
   scroll (`flex-nowrap` + `overflow-x-auto`); triggers ≥44px tall on mobile; desktop + aria/keyboard preserved.
2. All 6 real tab consumers render the contract correctly at 320/375/390/480/560/640 (no ragged grid, no
   overflow); their logic/props unchanged.
3. PageHeader / FilterBar / AdminPageShell action clusters stack full-width (`[&>*]:max-sm:w-full`, ≥44px,
   no wrap grid) below sm; desktop row layout preserved.
4. No horizontal page overflow at 320/360/375/390/412/480/560/640 for any touched surface.
5. Long sq/en/uk/it labels wrap/stack without overflow.
6. No new primitive; ActionBar/ControlGroup not resurrected; button.tsx unchanged; no `src/app` diff; only
   the two named `src/modules` files touched (tab/layout classes only); no DB/package/Storybook-config diff.
7. Docs: design-system + ui-rules codify the "< sm mobile control & tab stacking contract" (canonical
   fragment + ≤3/>3 tab rule); matrix updated if proof stories changed.
8. `npx tsc --noEmit` → 0; `npm run build` passes; `npm run lint` → 0 new; `npm run check:i18n` → PASS;
   `npm run build-storybook` exits 0.
9. Session log includes the §17 UI pre-flight output, the Note 20 before/after control inventory for each
   touched surface, the Files Changed table, validation results, and the rendered-QA matrix.

## Required validation (run & report exact command + output)

- `git status --short`
- tab/cluster class audit (paste + justify each hit):
  `rg -n "TabsList|inline-flex|flex-1|overflow-x-auto|flex-nowrap|flex-wrap|\[&>\*\]:max-sm:w-full|max-sm:|sm:flex-row|w-full" src/components/ui/tabs.tsx src/components/layout/PageHeader.tsx src/components/layout/FilterBar.tsx src/components/admin/AdminPageShell.tsx`
- no new primitive / no ActionBar resurrection:
  `rg -n "ActionBar|ControlGroup" src` → expected: none
- `npx tsc --noEmit` · `npm run build` · `npm run lint` · `npm run check:i18n` · `npm run build-storybook`
- `git diff -- src/app src/components/ui/button.tsx package.json package-lock.json .storybook` → MUST be empty
- `git diff --stat -- src/modules` → MUST show ONLY CabinetShell.tsx + ListingsStatusTabs.tsx

## Required rendered QA matrix (in the final report)

PASS / OWNER QA REQUIRED per cell, via viewport + locale toolbars:
- **Tab consumers (each of the 6):** 320 / 375 / 390 / 480 / 560 / 640 / 768 / 1280 × sq / en / uk / it
- **Action clusters (PageHeader / FilterBar / AdminPageShell):** 320 / 375 / 390 / 480 / 560 / 640 / 768 / 1280 × sq / en / uk / it
- Emphasis cells: 360 / 412 overflow check for tabs + clusters.

**Do NOT claim rendered PASS unless you actually rendered the story / screen or captured a screenshot. Else
mark OWNER QA REQUIRED.**

## STOP & ASK conditions

A consumer's tab count/layout fits neither the ≤3 nor >3 rule cleanly · a cluster fix seems to need button.tsx
or a new primitive · a non-listed `src/modules`/`src/app` file seems required · making tabs full-width would
break desktop or aria/keyboard · the manager business logic (not just the tab strip) seems to need changes ·
scope exceeds the mobile control/tab stacking contract.

## Final report required (no git commands from you)

- **Files Changed** table (Path / Change / Rationale).
- **Note 20 before/after control inventory** per touched surface (nothing removed; controls stack, not disappear).
- §17 UI pre-flight output.
- Confirmation: tabs full-width/scroll < sm; action clusters stack full-width < sm; desktop unchanged; no new
  primitive; button.tsx untouched; only the two named src/modules files touched.
- Validation outputs + rendered-QA matrix.
- **No `git add` / `git commit` / `git push`.** End with the Files Changed table; Opus emits commits.
