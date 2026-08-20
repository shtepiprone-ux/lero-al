# Task 756 — `LocationCombobox` sub-panel · `MantineCopyIdButton` · `MantineListingCardPattern`

**Task path:** `tasks/Sprints/Sprint_60_kickoff_prompt_Task_756_LocationCombobox_CopyId_CardPattern.md`
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`
**QA profile:** Q2 Standard UI

## Resume-state reconciliation (this task was started once, abandoned mid-flight, no session log)

Verified against `git status`/`git diff` before any edit, per the kickoff's explicit instruction that the "Resume
state" section is authoritative over the "Exact current state" table:

| Scope | Verified state | Action this session |
|---|---|---|
| `MantineAddItemPanel.tsx` (untracked) | Present, matches the kickoff's described decision exactly: `Stack gap="xs" p="sm"`, `border: 1px solid var(--border)`, `border-radius: var(--mantine-radius-xl)`, `background-color: color-mix(in oklab, var(--muted) 30%, transparent)`, optional `mt` prop | Kept unedited |
| `patterns/index.ts` | `+3` lines exporting `MantineAddItemPanel`/`MantineAddItemPanelProps` | Kept unedited |
| `MantineCopyIdButton.tsx` | Tailwind-free, real diff confirmed (`cn(...)` removed, `className={styles.copyId}`, icons use `size={10}` + `styles.copiedIcon`/`styles.notCopiedIcon`) | Kept unedited |
| `MantineCopyIdButton.module.css` | 4 `check:design-tokens --strict` findings confirmed present exactly as the kickoff describes (`:25` `gap: 0.125rem`, `:26` `border-radius: 0.25rem` + one stale marker, `:43` `box-shadow: 1px` in the shorthand) | **Fixed this session** — see below |
| `MantineListingCardPattern.tsx` / `.module.css` | Both `leading-snug` sites (`:210`,`:342`) moved into `styles.cardTitle` (`line-height: 1.375`); `:77` comment rewritten to describe `ListingCard.tsx`'s `styles.inlineFavorite` instead of the retired literal string | Verified the `:77` comment against the real consumer (below) — kept unedited |
| `LocationCombobox.tsx` | Confirmed **zero diff from `HEAD`** — genuinely not started | **Implemented this session** |

## Requirement / acceptance-criteria evidence

| AC | Requirement | Evidence |
|---|---|---|
| AC1 | Residue removed from all three files; survivors listed with reasons; every hook class still present | `LocationCombobox.tsx`: only survivor is `location-combobox` (hook class, kept per kickoff) + the `className` passthrough prop — `grep -n "className=" src/components/shared/LocationCombobox.tsx` returns exactly one line. `MantineCopyIdButton.tsx`/`MantineListingCardPattern.tsx`: zero Tailwind utility strings (pre-existing, verified). Three `design-tokens-allow` markers in `MantineCopyIdButton.module.css` are the only raw-value "survivors" — each is a verbatim reproduction of a compiled Tailwind value with no matching token (2px icon gap, 4px bare-`rounded` radius, 1px ring width) |
| AC2 | `check:homepage-grid` + `check:click-shield` exit 0 | `check:homepage-grid`: **260/260 PASS**, exit 0. `check:click-shield` (production build → `npm start` with `CLICK_SHIELD_CI_FIXTURE=1` on **both** the server process and the check script — see finding below): **48/48 cells, 0 interceptions**, exit 0 |
| AC3 | Rendered evidence, zero visual delta, 320/390/768/1024/1440 + `uk@320` mandatory, for listing card (list+grid), copy-id button (both states), location combobox with sub-panel open | 44 cells captured (4 stories × 11 width/locale combinations: all 4 locales at 320 and 1440, `en` only at 390/768/1024 — Q2 minimum), 0 render failures. Every captured value matches its expected Tailwind-equivalent token (see "Computed-style verification" below). Screenshots + raw JSON retained at `docs/sessions/evidence/task756/` |
| AC4 | Shared-fragment decision stated explicitly, in a form 757 can follow | **Decision (made by the prior/abandoned session, verified correct and followed as-is): shared primitive — `MantineAddItemPanel`.** See "The shared-fragment decision" below |
| AC5 | Line 77's comment either still describes a live contract or has been corrected. State which | **Still describes a live contract**, verified against the real consumer: `ListingCard.tsx:170` passes `className={styles.inlineFavorite}` to the real `FavoriteButton`; `ListingCard.module.css:72-76` — `.inlineFavorite { flex-shrink: 0; margin-top: calc(var(--spacing) * -0.5); margin-right: calc(var(--space-1) * -1); }` — `calc(var(--spacing) * -0.5)` = `-0.5 × 4px = -2px` (Tailwind's `-mt-0.5`), `calc(var(--space-1) * -1)` = `-4px` (`-mr-1`). The comment's prose ("`flex-shrink:0` / `margin-top:-2px` / `margin-right:-4px`") is byte-accurate |
| AC6 | `typecheck`, `check:design-tokens`, `check:i18n`, `npm run build` all exit 0 | All four re-run on final content: `typecheck` exit 0; `check:design-tokens --strict` **0 violations** (was 4), exit 0; `check:i18n` 2218 keys × 4 locales, parity PASSED, exit 0; `npm run build` — 40/40 static pages, exit 0 |

## Current versus required behavior

- **Preserved:** `location-combobox` hook class and the `className` passthrough on `LocationCombobox`'s root; the add-location sub-panel's behaviour incl. the localized add-failure error (`tc('error_generic')`, Task 553); `MantineCopyIdButton`'s copied/not-copied state and Check/Copy swap (untouched this session); both `MantineListingCardPattern` variants (untouched this session); every existing call site of all three components (no prop signature changes).
- **Required after behavior:** the three named Tailwind residue sites in `LocationCombobox.tsx` (`h-4 w-4` icon, the add-panel `<div>`, the `sm:flex-row` button row) replaced with their Mantine equivalents per the kickoff's replacement rules, zero visual delta (D28); the four `check:design-tokens --strict` findings in `MantineCopyIdButton.module.css` closed.
- **Negative flows:** N/A — this task touches no validation/authorization/network/concurrency branch. The add-location failure path (`onAddLocation` returning `{ error }`) is pre-existing, unchanged, and structurally untouched (still inside the now-`MantineAddItemPanel`-wrapped markup, same conditional render).

## Files Changed

| File | Reason |
|---|---|
| `src/components/shared/LocationCombobox.tsx` | `:8` import `MantineAddItemPanel`, `Flex` from `@mantine/core`; `:121` `<MapPin className="h-4 w-4" />` → `<MapPin size={16} />`; `:150`/`:189` sub-panel `<div className="border rounded-xl p-3 flex flex-col gap-2 bg-muted/30 mt-1">` → `<MantineAddItemPanel mt={4}>` (`mt-1`=4px, Mantine's numeric spacing prop converts `4` → `rem(4)` = `0.25rem` = 4px — verified in `@mantine/core`'s own `getSpacing`/`rem` converter source); `:172`/`:188` `<div className="flex flex-col sm:flex-row gap-2">` → `<Flex direction={{ base: 'column', sm: 'row' }} gap="xs">` (`gap-2`=8px=Mantine `xs`) |
| `src/design-system/mantine/patterns/MantineCopyIdButton.module.css` | `:25` added a `design-tokens-allow` marker for `gap: 0.125rem` (had none before — real, previously-unaddressed violation); `:26` corrected the existing marker's raw value from `0.25rem` to `border-radius: 0.25rem` (the `css-length` category's `rawValue` convention is `property: value`, not a bare value — the old marker predated that convention and was stale); `:43` added a `design-tokens-allow` marker for `box-shadow: 1px` (a shorthand-literal finding, not covered by the single-value 1px hairline exemption per Task 716 A3) |
| `scripts/mantine-migration-scope.json` | Added `src/design-system/mantine/patterns/MantineAddItemPanel.tsx` and `src/components/shared/LocationCombobox.tsx` — both are now fully Mantine and each has a canonical Mantine story statically importing it (`check:story-coverage` requires this pairing in the same PR as the migration) |
| `src/stories/patterns/mantine/AddItemPanel.stories.tsx` | **New.** Canonical `Patterns/Mantine/AddItemPanel` story, direct-imports `MantineAddItemPanel` (not the barrel, matching `check:story-coverage`'s import-resolution requirement) — proves the shared-fragment component standalone, satisfying the manifest-coverage requirement for its new `mantine-migration-scope.json` entry |

Pre-existing, verified but **not re-edited this session** (already correct from the abandoned prior attempt): `src/design-system/mantine/patterns/MantineAddItemPanel.tsx` (new, untracked), `src/design-system/mantine/patterns/index.ts`, `src/design-system/mantine/patterns/MantineCopyIdButton.tsx`, `src/design-system/mantine/patterns/MantineListingCardPattern.tsx`, `src/design-system/mantine/patterns/MantineListingCardPattern.module.css`.

## Validation evidence

```
npm run typecheck                                    → exit 0
npm run check:design-tokens -- --strict               → 0 violations, 0 stale-markers, 0 missing-reason, exit 0
npm run check:i18n                                     → 2218 keys × 4 locales, parity PASSED, exit 0
npm run check:mojibake                                 → 0 artifacts in 2859 files, exit 0
npm run check:stories                                  → 128 files checked (was 127 — +1 new story), 0 violations, exit 0
node scripts/check-story-coverage.mjs                  → 17 manifest entries (was 15 — +2), 17 covered, 0 unproven, exit 0
npm run build-storybook                                → built in 24.27s, exit 0
npm run check:homepage-grid                             → 260/260 PASS, 0 FAIL, exit 0
npm run build                                           → ✓ Compiled, 40/40 static pages, exit 0
npm start (CLICK_SHIELD_CI_FIXTURE=1) + \
  BASE_URL=http://127.0.0.1:3000 CLICK_SHIELD_CI_FIXTURE=1 npm run check:click-shield
                                                         → 48/48 cells, 0 interceptions, exit 0
npx vitest run src/components/shared/__tests__/LocationCombobox.smoke.test.tsx \
  src/design-system/mantine/patterns/__tests__/MantineCombobox.smoke.test.tsx
                                                         → 2 files / 14 tests passed
```

File integrity: all 4 touched/added files verified UTF-8, no BOM, no NUL bytes (`check:mojibake` 0/2859).

### A defect found and fixed during evidence capture (not shipped as-is)

The `design-tokens-allow` marker I first wrote for `MantineCopyIdButton.module.css:43` (`box-shadow: 1px`) contained
the literal substring `--radius-*/--spacing-*` inside its reason text. CSS comments terminate on the first `*/`
sequence, and `*` immediately followed by `/` inside that substring closed the comment early, leaving
`spacing-* */` as live CSS — `npm run build-storybook` failed with `[vite:css] [postcss] Unknown word --spacing-*`
at that exact line/column. Fixed by rewording the comment to avoid an embedded `*/`. Re-ran `check:design-tokens
--strict` (still 0 violations) and `build-storybook` (succeeded) after the fix.

### `check:click-shield` — the fixture flag must be set on the server process, not only the check script

First production run (server started as plain `npm start`, no env var) produced 16/16 `SCENARIO OVERLAY NEVER
OPENED — trigger not found: [data-click-shield-modal-trigger]` failures for the modal scenario. Root cause:
`src/app/[locale]/ci/click-shield-modal/page.tsx` gates its own render on
`process.env.CLICK_SHIELD_CI_FIXTURE === '1'` **read server-side** (`export const dynamic = 'force-dynamic'`
specifically to force that runtime check on `next start`) — the check script's own `CLICK_SHIELD_CI_FIXTURE=1`
env var has no effect on the already-running server process. Fixed by killing the server (`Stop-Process` on the
port-3000 owning PID, native PowerShell) and restarting it as `CLICK_SHIELD_CI_FIXTURE=1 npm start`. Re-run: all
16 modal cells passed, final tally 48/48, 0 interceptions.

### The `sm` breakpoint mapping (Replacement rules)

`--bp-sm: 640px` (`src/app/globals.css:281`); Mantine's own `sm` breakpoint = `40em` = 640px
(`docs/mantine-responsive-design-system.md` §6) — an exact 1:1 mapping, no conversion. `Flex direction={{ base:
'column', sm: 'row' }}` reproduces `flex-col sm:flex-row` exactly. Verified via computed
`flexDirection`: `column` at 320/390/768(pre-640? — see below)/… — actual measured values below.

### Computed-style verification (Q2 rendered evidence, 44 cells, 0 failures)

All values captured via a headless Playwright script against the built `storybook-static/`, one story per
surface, at the required width/locale matrix (320/390/768/1024/1440, all 4 locales at 320 and 1440, `en` only at
the 3 intermediate widths). Full raw JSON: `docs/sessions/evidence/task756/computed-styles.json`. Screenshots:
`docs/sessions/evidence/task756/*.png`.

| Surface | Property | Expected (from Tailwind fragment) | Measured (all 11 cells) |
|---|---|---|---|
| `LocationCombobox` sub-panel (`MantineAddItemPanel`) | `border` | `1px solid` `--border` | `1px solid oklch(0.922 0 0)` — every cell |
| | `border-radius` | `rounded-xl` = 12px | `12px` — every cell |
| | `padding` | `p-3` = 12px | `12px` — every cell |
| | `gap` | `gap-2` = 8px | `8px` — every cell |
| | `background-color` | `bg-muted/30` | `oklab(0.961 0 0 / 0.3)` — every cell |
| | `margin-top` | `mt-1` = 4px | `4px` — every cell |
| `LocationCombobox` icon (`MapPin`) | `width`/`height` | `h-4 w-4` = 16px | `16px`/`16px` — every cell |
| Add/Cancel button row | `flex-direction` | `flex-col` (<640) / `sm:flex-row` (≥640) | `column` at 320×4/390×1; `row` at 768×1/1024×1/1440×4 — matches the 640px switch exactly |
| | `gap` | `gap-2` = 8px | `8px` — every cell |
| `MantineCopyIdButton` (both stories' states) | `gap` | `gap-0.5` = 2px | `2px` — every cell, both states |
| | `border-radius` | bare `rounded` = 4px | `4px` — every cell, both states |
| | icon `width`/`height` | `h-2.5 w-2.5` = 10px | `10px`/`10px` — every cell, both states |
| | copied icon `color` | `text-status-success` | `oklch(0.527 0.173 150)` — every cell |
| `MantineListingCardPattern` title (`cardTitle`) | `line-height` | `leading-snug` (1.375 × 14px `size="sm"`) | `19.25px` — every cell, every card (grid+list, 4 sampled titles/cell) |

11/11 cells identical for every property on every surface — no width- or locale-dependent divergence outside the
one intentional `flex-direction` breakpoint switch, itself measured exactly at the documented 640px boundary.

## Visual source trace

| Visible artifact/state | Component/markup | Class/selector (before) | Token/utility path | Change | Evidence |
|---|---|---|---|---|---|
| Add-location sub-panel chrome | `MantineAddItemPanel` (`Stack`) | `border rounded-xl p-3 flex flex-col gap-2 bg-muted/30 mt-1` | `var(--border)` / `var(--mantine-radius-xl)` / `theme.spacing.sm` / `theme.spacing.xs` / `color-mix(...)` / `mt={4}`→`rem(4)` | Mechanism swap, byte-identical render (pre-existing component, verified) | Computed style, all 11 cells |
| Location icon (`MapPin`) | `MantineCombobox`'s `icon` slot | `className="h-4 w-4"` | `size={16}` prop | Class → prop | Computed `width`/`height`, all 11 cells |
| Add/Cancel button row | `Flex` | `flex flex-col sm:flex-row gap-2` | `direction={{base:'column',sm:'row'}} gap="xs"` | Class → responsive prop | Computed `flexDirection`/`gap`, all 11 cells, both sides of the 640px switch |
| Copy-id button chrome | `MantineCopyIdButton` (pre-existing) | (already migrated) | `.module.css` w/ 3 justified raw-value markers | Comment/marker text only, this session | `check:design-tokens --strict` exit 0 |
| Listing card title line-height | `MantineListingCardPattern` `styles.cardTitle` (pre-existing) | (already migrated) | `line-height: 1.375` | None this session | Computed `lineHeight`, all cells |
| Favorite button inline-mode offset (`:77` comment) | `ListingCard.tsx`'s `inlineFavorite` | `styles.inlineFavorite` (`ListingCard.module.css`) | `calc(var(--spacing) * -0.5)` / `calc(var(--space-1) * -1)` | None this session — comment verified accurate | Read `ListingCard.tsx:170`, `ListingCard.module.css:72-76` |

## Canonical UI decision record

| Visible artifact | Search evidence | Canonical story/source | Decision | Consumed style/token path |
|---|---|---|---|---|
| Add-location/add-company sub-panel chrome (shared fragment) | Prior/abandoned session's search, verified this session: no existing Mantine `Paper`-family pattern reproduces `border rounded-xl p-3 flex flex-col gap-2 bg-muted/30` as a standalone unit; `AuthSheet.tsx` (Task 757, untouched) has the identical fragment | `MantineAddItemPanel` (new, `src/design-system/mantine/patterns/`) | `create canonical` (authorized by the kickoff's "the fragment becomes a shared primitive" option) — this session created its required canonical story (`Patterns/Mantine/AddItemPanel`) and registered it + its consumer in `mantine-migration-scope.json`, completing the authorization the prior session left open | `border: 1px solid var(--border)`, `border-radius: var(--mantine-radius-xl)`, `p="sm"`, `gap="xs"`, `background-color: color-mix(in oklab, var(--muted) 30%, transparent)` |
| Add/Cancel responsive row | Searched for an existing responsive-flex pattern in the codebase; found `Flex direction={{ base: 'column', sm: 'row' }}` already used twice (`MantineListingContactPattern.tsx:151`, `FiltersPanel.tsx`) | Mantine `Flex` (core primitive), existing in-repo pattern | `reuse` | `direction={{base,sm}}` / `gap="xs"` |
| Location icon sizing | Existing `size` prop convention already used by every other lucide-icon-in-Mantine-slot migration this sprint (752/753/754) | lucide-react `size` prop | `reuse` | `size={16}` |

## The shared-fragment decision (AC4, for Task 757 to follow)

**Decision: shared primitive — `MantineAddItemPanel`** (`src/design-system/mantine/patterns/MantineAddItemPanel.tsx`),
made by the prior/abandoned session and verified correct + completed by this one. Rationale, restated for 757:

- The fragment `"border rounded-xl p-3 flex flex-col gap-2 bg-muted/30"` was byte-identical in both
  `LocationCombobox.tsx` (this task) and `AuthSheet.tsx` (757), with the sole difference being
  `LocationCombobox`'s trailing `mt-1` — expressed as an **optional `mt` prop** on the shared component
  (`MantineAddItemPanelProps.mt`) rather than baked into the shared chrome, so `AuthSheet` can omit it.
- The component owns **only the outer chrome** (border/radius/padding/gap/background) — it takes `children`
  and does not know about or render any specific field layout, so both consumers keep full control of their own
  form fields.
- `bg-muted/30` is an opacity-modified token (D35): reproduced as the literal `color-mix(in oklab, var(--muted)
  30%, transparent)` Tailwind itself compiles to — **never** aliased to a bare `var(--muted)`.
- **For 757:** import `MantineAddItemPanel` from `@/design-system/mantine/patterns`, wrap `AuthSheet`'s
  add-company panel content in it (no `mt` prop needed, matching the original fragment with no trailing margin
  utility), and add `src/modules/auth/components/AuthSheet.tsx` to `scripts/mantine-migration-scope.json` if it
  is not already covered by an existing canonical story that imports it directly.

## Implementation validation notes

Two defects found and fixed during evidence capture, neither shipped:

1. **Gate-breaking comment defect (my own edit, this session).** Described above — a `design-tokens-allow`
   reason string containing a literal `*/` prematurely closed a CSS comment and broke `build-storybook`. Caught
   immediately by the build failure, fixed before any further evidence was captured.
2. **Evidence-capture-only defect (my own script, not product code).** The click-shield production run initially
   failed the modal scenario because the server process was started without `CLICK_SHIELD_CI_FIXTURE=1` in its
   own environment (the fixture route reads the env var server-side). Fixed by restarting the server with the
   flag; re-ran the full check afterward.

No product-code defects found in the pre-existing "Done" work — `MantineCopyIdButton.tsx`, `MantineListingCardPattern.tsx`/`.module.css`, `MantineAddItemPanel.tsx`, and `patterns/index.ts` all matched their described state exactly and needed no correction beyond the `.module.css` marker fixes (AC6-driven, not a defect in the migration itself).

## Assumptions, deviations, and limitations

- The rendered-evidence capture script is a one-off Playwright harness written for this task's evidence, not a
  reusable project script — it lived briefly in `scripts/_tmp-task756-rendered-evidence.mjs` only so Node could
  resolve the `playwright` dependency, and was deleted after use (confirmed absent from `git status`).
- `check:design-tokens --strict` is not yet the CI-blocking mode (per the script's own header, strict lands in a
  later task) — this session ran it in `--strict` anyway per the kickoff's explicit AC6 requirement, and it is
  0/0/0 (violations/stale-markers/missing-reason) either way.
- No new i18n keys were added; the new `AddItemPanel.stories.tsx` story reuses four existing
  `storybook.mantine.*` keys (`action_add_new`, `form_address`, `admin_add_label`, `action_cancel`).
- `check:design-tokens --strict` may still fail on `MantineCopyIdButton.module.css`'s sibling files if Task 758's
  or Task 756's own scope boundary is misread — confirmed via the full-repo run that **zero** violations remain
  anywhere in the tree, not just in the three files this task owns.

## R2 — reviewer `NEEDS REVISION` fix (P1)

**Reviewer finding:** `MantineListingCardPattern.module.css:217-220` promoted the inert `leading-snug` Tailwind
class into a live `line-height: 1.375` rule. `leading-snug` never rendered — Mantine's `Text` root sets
`line-height` unlayered while `leading-snug` lives in `@layer utilities`, and unlayered always wins (the same
rule this file's own header comment states, and `HeaderView.tsx:104`/Task 629 documents). The real pre-migration
line-height was Mantine's own `lineHeights.sm = 1.43` (`theme.ts:213`) = `20.02px` at `size="sm"` (14px), not
`19.25px`. This CSS rule originated in the abandoned prior session (file mtime 12:15) and was incorrectly accepted
as "already done correctly" in this session's original resume-state reconciliation (table row above).

**Fix applied:** deleted `line-height: 1.375` and its comment from `.cardTitle`
(`MantineListingCardPattern.module.css:217-220`). Substituted nothing. `git diff` against `HEAD` for this file is
now empty — `git hash-object` = `5769e852ac1f18bcafa7e7c4f791080e08985843`, matching
`git rev-parse HEAD:src/design-system/mantine/patterns/MantineListingCardPattern.module.css` exactly; the file is
byte-identical to the last commit.

**AC3 re-capture — genuine before/after DOM comparison, not a class-derived expectation.** The original AC3 row
for this surface (table above) compared the after-state against an expectation *derived from the Tailwind class
name* (`leading-snug` → 1.375 × 14px = 19.25px) — a method that cannot distinguish a working utility from an
inert one, and validated the P1 regression as a pass. Re-captured per the reviewer's required swap protocol:

1. Backed up working-tree `MantineListingCardPattern.tsx` (post-fix, `leading-snug` already removed from both
   call sites by the prior session) — `git hash-object` = `a005679707f1c2c22fa932779375a58c38bf8872`.
2. Wrote `git show HEAD:...MantineListingCardPattern.tsx` (true pre-Task-756 content, `leading-snug` present in
   both `cn(styles.cardTitle, 'leading-snug')` call sites) over the working file. Verified
   `git hash-object` = `8cd9276f99b85287760123a9e2c3f8f039b6a0ff`, matching `git rev-parse HEAD:<path>` exactly.
3. `npm run build-storybook` (BEFORE state) — exit 0.
4. Playwright capture (`scripts/task756r2-qa-cardtitle-lineheight.mjs`) against the built `storybook-static/`,
   real `getComputedStyle(h3).lineHeight` for both the grid-card and list-card title: **`20.02px`**,
   `fontSize` `14px`, both layouts.
5. Restored the backed-up working file. Verified `git hash-object` = `a005679707f1c2c22fa932779375a58c38bf8872`
   — matches step 1 exactly; restoration proven, not asserted.
6. `npm run build-storybook` (AFTER/fixed state) — exit 0.
7. Playwright capture (same script) against the rebuilt `storybook-static/`: **`20.02px`**, `14px`, both layouts
   — byte-identical JSON to step 4 (`diff` exit 0, zero output).

BEFORE and AFTER computed `line-height` are identical (`20.02px`), matching the reviewer's independently-measured
value exactly and confirming the fix restores the true pre-migration render with no residual regression. Witness
log and both raw captures retained at `docs/sessions/evidence/task756/`: `ac3-before-after-witness.log`,
`ac3-cardtitle-lineheight-BEFORE.json`, `ac3-cardtitle-lineheight-AFTER.json`, `build-storybook-before-swap.log`,
`build-storybook-after-restore.log`.

**Re-run gates after the fix (final state):**

```
npm run check:design-tokens -- --strict   → 0 violations, exit 0
npx tsc --noEmit                          → exit 0
npm run build                             → ✓ Compiled, exit 0
```

Transcripts: `docs/sessions/evidence/task756/check-design-tokens-r2.log`,
`docs/sessions/evidence/task756/typecheck-r2.log`, `docs/sessions/evidence/task756/npm-run-build-r2.log`.

**Files changed this pass:**

| File | Reason |
|---|---|
| `src/design-system/mantine/patterns/MantineListingCardPattern.module.css` | Deleted the inert `line-height: 1.375` rule + comment from `.cardTitle` (P1 fix) — file is now byte-identical to `HEAD` |
| `scripts/task756r2-qa-cardtitle-lineheight.mjs` | New. Ad hoc Playwright probe (same pattern as `scripts/task658-qa-listingcard-chrome-migration.mjs`), reads real computed `line-height` for the card title; used for the before/after swap capture above |

No other file changed in this pass. `LocationCombobox.tsx`, `MantineCopyIdButton.tsx`/`.module.css`, the `:77`
comment, the story, and `mantine-migration-scope.json` are untouched, per the reviewer's "DO NOT TOUCH" list —
re-verified: `git diff --stat` for all four shows no change since the prior handoff.

## Opus handoff

- Diff: `git diff -- src/components/shared/LocationCombobox.tsx src/design-system/mantine/patterns/MantineCopyIdButton.module.css src/design-system/mantine/patterns/MantineListingCardPattern.tsx scripts/mantine-migration-scope.json`
  (`MantineListingCardPattern.module.css` now shows **no diff** against `HEAD` — the P1 rule was deleted, not
  replaced)
- New files: `src/design-system/mantine/patterns/MantineAddItemPanel.tsx` (pre-existing, untracked, verified not
  authored this session), `src/design-system/mantine/patterns/index.ts` (modified, pre-existing),
  `src/stories/patterns/mantine/AddItemPanel.stories.tsx` (new prior pass), `scripts/task756r2-qa-cardtitle-lineheight.mjs` (new this pass)
- This session log: `docs/sessions/2026-08-17-task756-locationcombobox-copyidbutton-listingcardpattern.md`
- Evidence: `docs/sessions/evidence/task756/` (44 screenshots + `computed-styles.json` + prior transcripts, plus
  this pass's before/after witness log, two raw JSON captures, two `build-storybook` transcripts, and 3 re-run
  gate transcripts)
- Backlog: `docs/backlog.md` (Task registry row 756)
- Sprint plan: `tasks/Sprints/Sprint_60_Homepage_Mantine_Completion_And_Tailwind_Residue.md` (Tasks table row 756)
- Open questions for the reviewer: (1) confirm the `MantineAddItemPanel` `create canonical` disposition is
  acceptable given it was decided by a prior *uncommitted, unreported* session rather than this one — this
  session verified but did not re-derive that decision from scratch; (2) `AuthSheet.tsx` (757) is untouched —
  confirm no accidental scope creep into its file.
- Owner-run commit (explicit paths), when ready:
  `git add src/components/shared/LocationCombobox.tsx src/design-system/mantine/patterns/MantineAddItemPanel.tsx src/design-system/mantine/patterns/MantineCopyIdButton.tsx src/design-system/mantine/patterns/MantineCopyIdButton.module.css src/design-system/mantine/patterns/MantineListingCardPattern.tsx src/design-system/mantine/patterns/MantineListingCardPattern.module.css src/design-system/mantine/patterns/index.ts src/stories/patterns/mantine/AddItemPanel.stories.tsx scripts/mantine-migration-scope.json scripts/task756r2-qa-cardtitle-lineheight.mjs docs/backlog.md docs/sessions/2026-08-17-task756-locationcombobox-copyidbutton-listingcardpattern.md docs/sessions/evidence/task756/ tasks/Sprints/Sprint_60_Homepage_Mantine_Completion_And_Tailwind_Residue.md`

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`
