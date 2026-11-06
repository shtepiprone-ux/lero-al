# Sprint 31 — Task 358 kickoff (Sonnet) — Storybook canonicalization (ALL sections): scenario-named stories, dedup, remove per-width/proof exports + DELETE dead primitives ControlGroup & ActionBar (NO route migration, NO new UX)

> **Status: READY. Owner priority #1.** Owner directive: bring the WHOLE Storybook to an "ideal state" —
> every section a clean, scenario-named canonical set; no duplicate / proof-only / per-width / unclear
> stories. AdminTable was already consolidated (Task 354-Fix-2 → 10 scenario stories); this task applies
> the SAME standard to every other section, and **removes two dead primitives that have ZERO product
> consumers** (`ControlGroup`, `ActionBar`).
>
> **You are Sonnet 4.6, the executor.** Implement the literal acceptance criteria below. Do NOT change
> scope. Do NOT invent new component UX. Do NOT migrate admin/app routes. Do NOT rewrite Storybook config.
> If anything is ambiguous or a required decision is missing, **STOP and ASK the orchestrator** — do not
> improvise.
>
> **Single-writer git:** you do NOT run `git add` / `git commit` / any mutating git. End with a "Files
> Changed" table only; the ORCHESTRATOR (Opus) reviews the real diff and emits commit commands. (agent-contract clause 10.)

```
Type:     Storybook canonicalization + dead-primitive removal (governance/test surface; NO route migration, NO new UX)
Priority: CRITICAL (owner first-priority)
Area:     src/components/**/*.stories.tsx (all sections) · DELETE ControlGroup.tsx + ActionBar.tsx (+ their stories) ·
          migrate the few story files that import them · docs (catalog/design-system/matrix/governance)
Sibling:  Task 359 (global <640px button/tab full-width-stack contract) runs AFTER this. This task does NOT
          fix runtime responsive behavior — it canonicalizes the STORY surface and deletes dead primitives.
Depends:  Task 357 (AdminTable.stories.tsx NUL-tail repair) should land first so the AdminTable file is clean.
```

## Role contract

You are **Sonnet 4.6, the executor**. You (a) DELETE the two unused primitives `ControlGroup` and
`ActionBar` and migrate the story files that import them, (b) consolidate every remaining `*.stories.tsx`
into a small, scenario-named canonical set (dedup; remove per-width/proof/unclear exports; breakpoints via
the viewport toolbar, not separate exports), and (c) update the governance docs that referenced the
removed primitives or the story rules. You do **not** change runtime component behavior (that is Task 359),
**not** migrate routes, **not** touch DB/RLS/auth, **not** rewrite Storybook config, and **not** run git.
Outside-allowlist = scope violation = STOP & ASK. Opus reviews the real diff and emits git commands.

## Confirmed audit (orchestrator, 2026-06-02)

Story export counts today (383 total across 28 files):

```
DELETE (dead primitives — ZERO product consumers in src/app + src/modules):
  src/components/layout/ControlGroup.tsx           (used only by its own stories + AdminPageShell.stories)
  src/components/layout/ControlGroup.stories.tsx   (53 exports)
  src/components/layout/ActionBar.tsx              (used only by its own + PageHeader.stories; exported from layout/index.ts)
  src/components/layout/ActionBar.stories.tsx      (32 exports)

CONSOLIDATE (bloated / per-width / proof — trim to scenario-named canonical sets):
  src/components/layout/FilterBar.stories.tsx        39  (FilterBar IS used in 3 product files — keep component)
  src/components/admin/AdminPageShell.stories.tsx    33  (uses ControlGroupTabs → migrate to canonical tabs primitive)
  src/components/admin/AdminCardList.stories.tsx     32
  src/components/layout/PageHeader.stories.tsx       25  (uses ActionBar → migrate off it)
  src/components/layout/PageShell.stories.tsx        22
  src/components/layout/Section.stories.tsx          22
  src/components/admin/StatusChangeHistory.stories.tsx 19
  src/components/admin/StatusChangeControl.stories.tsx 17
  src/components/shared/Combobox.stories.tsx         10  (had width-named variants)
  src/components/ui/select.stories.tsx                9
  src/components/ui/button.stories.tsx               10  (mentions ActionBar in a docs string — update wording)

REVIEW (small — dedup only if duplicate/unclear, otherwise leave):
  src/components/ui/{input,badge,checkbox,dialog,sheet,skeleton,tabs,PasswordInput,PasswordRequirementsHint}.stories.tsx
  src/stories/{AdminLayout,Containers,EmptyState,ListingGrid,RecentlyViewedSection}.stories.tsx

ALREADY CANONICAL (do not re-do; only verify it still builds after Task 357 repair):
  src/components/admin/AdminTable.stories.tsx        10  (Task 354-Fix-2)
```

`ControlGroup` and `ActionBar` were introduced as DS primitives (Tasks 340/348) but were **never adopted in
any route** (`src/app`/`src/modules` reference count = 0). Owner has authorised their removal (2026-06-02).
Removing `ActionBar` reverts the Task 348 DS-3 primitive — update the DS docs accordingly.

## Pre-read (load ONLY these — `docs/rule-index.md`: "Storybook / visual snapshot" + "UI / layout / component")

**Always required:** `docs/agent-contract.md`, `docs/backlog.md`.
**Required (Storybook):** `docs/storybook-governance.md`, `docs/storybook-visual-snapshots.md`,
`docs/responsive-screenshot-matrix.md`.
**Required (UI/component):** `docs/design-system.md` (esp. §3 width canon; the ActionBar/ControlGroup
sections you will remove), `docs/ui-rules.md`, `docs/component-rules.md`, `docs/component-governance.md`,
`docs/component-catalog.md`, `docs/ai-behavior.md` → Notes 20/22.
**Then inspect** every story file in the audit + `src/components/layout/index.ts` +
`src/components/ui/tabs.tsx` (the canonical tab primitive AdminPageShell stories migrate to) +
the current AdminTable.stories.tsx canonical set (as the reference pattern to mirror).

## Canonical story taxonomy (mirror AdminTable.stories.tsx — apply to every consolidated file)

Each component's stories become a small set of **scenario/mode** exports. **Breakpoints are exercised via
the Storybook viewport toolbar parameter — NOT as separate named exports.** **Locales (sq/en/uk/it) are
exercised via the locale toolbar**, with at most one explicit long-string stress story per component.
No width tokens in export names (`Mobile320`, `Desktop1280`, `Canonical960`, `W375`, … are forbidden as
export-name suffixes). Keep names human/UX (`Default`, `WithActions`, `Empty`, `Loading`, `LocaleStress`,
plus component-specific real states).

Per-component target sets (refine names, keep them meaningful; ≈ counts are guidance, not hard rules):

- **FilterBar** (~6–9): `Default`, `NoActiveFilters`, `WithActiveFilters`, `SheetOpenMobile` (mode, via
  viewport), `ManyAvailableFewActive`, `LocaleStress`. Preserve the active-vs-available contract from prior work.
- **AdminPageShell** (~6–9): `Default`, `WithTabs` (migrated to the canonical `tabs` primitive — NOT
  ControlGroupTabs), `WithActions`, `Empty`, `Loading`, `LocaleStress`.
- **AdminCardList** (~7–10): `Default`, `StructuredCard`, `Static`, `Interactive`, `LegacyNode`, `Empty`,
  `Loading`, `LocaleStress`. (No per-width `StructuredCard_*` sweep.)
- **PageHeader** (~6–8): `Default`, `WithActions` (actions rendered WITHOUT ActionBar — use a plain
  canonical action container; the <640 stacking contract is Task 359's job, don't pre-build it here beyond
  what already exists), `WithBreadcrumb`, `LongTitleLocaleStress`.
- **PageShell** (~5–8), **Section** (~5–8): `Default` + the real structural variants already present,
  minus per-width duplicates; `LocaleStress` where relevant.
- **StatusChangeHistory** (~5–7): `Single`, `Multiple`, `Empty`, `LocaleStress` (+ a `RawKeyStress` ONLY if
  one already exists and is explicitly named). No per-width/mobile-named duplicates.
- **StatusChangeControl** (~5–7): `Select`, `Workflow`, `RequiredNote`, `Disabled`/`Loading`, `LocaleStress`.
- **Combobox** (~5–8), **select** (~5–8): canonical states (closed/open/long-label/disabled); drop
  width-named variants; keep the Task 354 viewport-clamp coverage as ONE `LongLabelLocaleStress`.
- **button** (~remains): keep canonical size/variant matrix; **update the docs string that references
  ActionBar** (line ~245) so it no longer names a deleted primitive.
- **ui/* small + src/stories/***: only remove genuine duplicates/unclear stories; otherwise leave.

## Mandatory scope (literal) — ordered workstreams

### W1 — Delete ControlGroup
1. Delete `src/components/layout/ControlGroup.tsx` and `src/components/layout/ControlGroup.stories.tsx`.
2. Migrate `src/components/admin/AdminPageShell.stories.tsx` off `ControlGroupTabs` / `ControlGroupOption`
   to the canonical `tabs` primitive (`src/components/ui/tabs.tsx`). If AdminPageShell's REAL product usage
   uses a different tab mechanism, mirror that — **if unclear how the product renders these tabs → STOP & ASK**
   (do not invent a new tab system; do not resurrect ControlGroup).
3. Remove any `ControlGroup` export from `src/components/layout/index.ts` if present.

### W2 — Delete ActionBar
1. Delete `src/components/layout/ActionBar.tsx` and `src/components/layout/ActionBar.stories.tsx`.
2. Remove `export { ActionBar } from './ActionBar'` from `src/components/layout/index.ts`.
3. Migrate `src/components/layout/PageHeader.stories.tsx` off `ActionBar` — render the action cluster with
   a plain canonical container (e.g. a `div` with the existing flex/gap utilities, or the PageHeader action
   slot itself). Do NOT introduce a replacement primitive. The mobile-stacking behavior is Task 359's scope.
4. Update the `button.stories.tsx` docs description that names `ActionBar` so it does not reference a deleted
   component.
5. Confirm no other file imports `ActionBar` (audit grep below must come back clean after the migration).

### W3 — Consolidate remaining story files
Apply the canonical taxonomy above to every CONSOLIDATE-listed file: remove per-width/proof/duplicate/
unclear exports; rename to scenario/mode names; exercise breakpoints via the viewport toolbar and locales
via the locale toolbar; keep one long-string stress story per component. Preserve **every real mode** each
component genuinely has (Note 22 inventory) — you are removing redundant EXPORTS, not real coverage. Do NOT
change component runtime code in this task.

### W4 — Docs
- `docs/design-system.md` — remove the `ActionBar` (DS-3) and `ControlGroup` primitive sections / canonical
  references; note they were removed (unused, owner decision 2026-06-02).
- `docs/component-catalog.md` — remove `ActionBar` + `ControlGroup` entries.
- `docs/responsive-screenshot-matrix.md` — remove dead `ActionBar`/`ControlGroup`/per-width entries; register
  the new scenario-named stories.
- `docs/storybook-governance.md` — codify: scenario-named stories only; NO per-width/proof exports;
  breakpoints via the viewport toolbar; locales via the locale toolbar; one canonical set per component;
  Docs primary = the canonical state.
- `docs/component-governance.md` / `docs/ai-behavior.md` — only if a global "no parallel/proof primitives,
  no per-width story exports" rule is codified.
- `docs/backlog.md` — Last Session (2–4 lines). NEW session log
  `docs/sessions/2026-06-02-task-358-storybook-canonicalization-and-dead-primitive-removal.md`.

## Allowed file areas (edit ONLY these)

```
DELETE: src/components/layout/ControlGroup.tsx, ControlGroup.stories.tsx, ActionBar.tsx, ActionBar.stories.tsx
EDIT:   src/components/layout/index.ts                         (remove ActionBar/ControlGroup exports)
        src/components/admin/AdminPageShell.stories.tsx        (migrate tabs off ControlGroup; consolidate)
        src/components/layout/PageHeader.stories.tsx           (migrate off ActionBar; consolidate)
        src/components/ui/button.stories.tsx                   (fix ActionBar mention; light dedup)
        src/components/layout/FilterBar.stories.tsx            (consolidate)
        src/components/layout/PageShell.stories.tsx            (consolidate)
        src/components/layout/Section.stories.tsx              (consolidate)
        src/components/admin/AdminCardList.stories.tsx         (consolidate)
        src/components/admin/StatusChangeHistory.stories.tsx   (consolidate)
        src/components/admin/StatusChangeControl.stories.tsx   (consolidate)
        src/components/shared/Combobox.stories.tsx             (consolidate; drop width variants)
        src/components/ui/select.stories.tsx                   (consolidate; drop width variants)
        src/components/ui/*.stories.tsx, src/stories/*.stories.tsx  (dedup ONLY if duplicate/unclear)
        docs/design-system.md, docs/component-catalog.md, docs/responsive-screenshot-matrix.md,
        docs/storybook-governance.md, docs/component-governance.md, docs/ai-behavior.md, docs/backlog.md
        docs/sessions/2026-06-02-task-358-storybook-canonicalization-and-dead-primitive-removal.md (NEW)
```

## Forbidden file areas (STOP & ASK if any seems required)

```
src/components/**/*.tsx that are NOT stories — i.e. component RUNTIME code (except the two DELETED primitives
  and the index.ts export removal). Runtime responsive fixes are Task 359, not this task.
src/components/admin/AdminTable.tsx · AdminTable.stories.tsx  (Task 354-Fix-2 / 357 — do not touch here)
src/app/** · src/modules/**            (route adoption out of scope; READ-only for the empty-diff proof)
src/components/ui/** runtime (tabs.tsx, button.tsx, …)  (USE as-is; do NOT modify primitives)
database migrations / SQL · Supabase / RLS / auth · package.json / package-lock.json
.storybook/main.ts · .storybook/preview.tsx (PRESERVE viewport presets + locale toolbar)
messages/*.json                         (no new keys expected)
```

## Current behavior to PRESERVE

Every component's REAL modes keep a story (Note 22): FilterBar active/available/sheet states; AdminPageShell
tabs/actions/empty/loading; AdminCardList structured/static/interactive/legacy/empty/loading; PageHeader
title/actions/breadcrumb; StatusChange* select/workflow/note/history/empty; Combobox/Select open/long-label/
disabled; the canonical button size/variant matrix. Storybook viewport presets + locale toolbar. The
AdminTable canonical set (untouched). FilterBar/PageHeader/AdminPageShell **runtime** components keep their
current APIs and behavior — only their STORIES change here (plus the unavoidable migration off the deleted
ActionBar/ControlGroup in those two story files).

## Localization

Locales **sq / en / uk / it**, exercised via the locale toolbar; one long-string stress story per component;
no mixed-language normal story; no raw key/enum as user copy; `check:i18n` must pass (no new keys expected).

## Responsive coverage

Breakpoints are verified via the viewport toolbar across the 14 canonical widths (`design-system.md §3`:
320·375·390·480·560·680·768·810·960·1024·1200·1440·1920·2560) — NOT as separate story exports. The QA
matrix below records this. (Fixing the actual <640px stacking is Task 359; here you only ensure stories
render and are scenario-named.)

## Positive flow (happy path) — required (Task 255 rule)

**Actor:** owner/designer auditing Storybook. **Precondition:** Task 357 landed (AdminTable clean); viewport
+ locale toolbars intact.
1. Owner opens the Storybook sidebar → no `ControlGroup`, no `ActionBar` sections; every remaining section is
   a short, scenario-named list (no `W320`/`Mobile320`/`Desktop1280` export names, no proof duplicates).
2. Owner opens each section's Docs → the primary is the canonical state of that component.
3. Owner switches viewport + locale via the toolbars → each scenario renders across widths/locales.
4. Owner confirms AdminPageShell tabs render via the canonical `tabs` primitive; PageHeader actions render
   without ActionBar; nothing imports a deleted primitive.
**Post-condition:** total export count is sharply reduced; `tsc`/`build`/`build-storybook` pass; `check:i18n`
parity holds; no `src/app`/`src/modules`/runtime-primitive/DB/package/Storybook-config diff.

## Negative flow (off-happy-path branches) — required (Task 255 rule)

- **A deleted primitive is still imported somewhere** → build breaks; you must migrate every importer
  (AdminPageShell.stories, PageHeader.stories, layout/index.ts) — the audit grep must come back clean.
- **AdminPageShell product tabs use a non-`tabs` mechanism** → STOP & ASK; do not invent a tab system.
- **Consolidation would drop a REAL mode** (e.g. FilterBar sheet-open, StatusChangeControl required-note) →
  keep at least one story for it; never silently drop real coverage.
- **A "story" actually documents a runtime bug** (e.g. only "works" because of a width-specific hack) →
  do NOT fix runtime here; note it for Task 359.
- **Temptation to add NEW stories / a replacement primitive for ActionBar/ControlGroup** → DO NOT; this task
  reduces surface; Task 359 handles responsive behavior on the live components.
- **tsc/lint errors after deletion** (dangling imports/types) → resolve by completing the migration, not by
  re-adding the primitive.

## Acceptance criteria (literal)

1. `ControlGroup.tsx`, `ControlGroup.stories.tsx`, `ActionBar.tsx`, `ActionBar.stories.tsx` are deleted; no
   file in `src/**` imports `ControlGroup*` or `ActionBar` (verified by grep); `layout/index.ts` no longer
   exports them.
2. `AdminPageShell.stories.tsx` renders its tab demo via the canonical `tabs` primitive (not ControlGroup);
   `PageHeader.stories.tsx` renders actions without ActionBar; `button.stories.tsx` no longer references
   ActionBar in copy.
3. Every consolidated story file is a scenario-named canonical set with NO per-width/proof export names and
   no duplicate/unclear stories; breakpoints exercised via the viewport toolbar; locales via the locale
   toolbar; ≤ one long-string stress story per component.
4. Every REAL component mode still has at least one story (Note 22 before/after inventory in the session log).
5. Total `*.stories.tsx` export count is sharply reduced from 383 (report the new total and per-file before/
   after).
6. Docs updated: ActionBar + ControlGroup removed from design-system/component-catalog/matrix; storybook-
   governance codifies the scenario-named / no-per-width-export / breakpoints-via-toolbar rules.
7. No runtime component code changed except the two deleted primitives and the `layout/index.ts` export
   removal; no `src/app`/`src/modules`/DB/package/Storybook-config diff.
8. `npx tsc --noEmit` → 0; `npm run build` passes; `npm run lint` → 0 new; `npm run check:i18n` → PASS;
   `npm run build-storybook` exits 0.
9. Session log includes the Note 22 inventory, the deleted-stories/components list, the per-file before/after
   counts, the Files Changed table, validation results, and the rendered-QA note (breakpoints/locales via toolbars).

## Required validation (run & report exact command + output)

- `git status --short`
- dead-primitive references gone (MUST be empty after migration):
  `rg -n "ControlGroup|from './ActionBar'|\bActionBar\b" src --glob '*.ts' --glob '*.tsx'`
- per-file export counts (before/after):
  `for f in $(rg -l "export const .*: Story" src --glob '*.stories.tsx'); do printf "%4s %s\n" "$(rg -c "^export const " "$f")" "$f"; done`
- no per-width export NAMES remain:
  `rg -n "^export const [A-Za-z0-9_]*(320|375|390|480|560|680|768|810|960|1024|1200|1280|1440|1920|2560)" src --glob '*.stories.tsx'`
  (expected: none)
- `npx tsc --noEmit` · `npm run build` · `npm run lint` · `npm run check:i18n` · `npm run build-storybook`
- `git diff -- src/app src/modules package.json package-lock.json .storybook` → MUST be empty
- `git diff --stat -- src/components` (confirm only stories + the 2 deletions + index.ts changed; no other runtime file)

## STOP & ASK conditions

AdminPageShell's product tabs use a mechanism other than `tabs.tsx` and the migration is non-obvious ·
removing a primitive would require touching `src/app`/`src/modules` · a consolidation would drop a real mode
with no replacement · a "story" can only render via a runtime hack (route to Task 359) · any runtime
component (beyond the 2 deletions + index.ts) seems to need editing · scope exceeds story canonicalization +
dead-primitive removal + doc updates.

## Final report required (no git commands from you)

- **Files Changed** table (Path / Change / Rationale), incl. the 4 deletions.
- **Note 22 before/after inventory** (every real mode still has a story).
- Per-file **before/after export counts** + new total.
- Confirmation no file imports ControlGroup/ActionBar; AdminPageShell tabs migrated; PageHeader actions
  migrated; docs updated.
- Confirmation no runtime component changed except the 2 deletions + `layout/index.ts`.
- Validation outputs + the rendered-QA note (breakpoints/locales verified via toolbars).
- **No `git add` / `git commit` / `git push`.** End with the Files Changed table; Opus emits commits.
