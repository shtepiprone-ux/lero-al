# Task 756 — `LocationCombobox` sub-panel · `MantineCopyIdButton` · `MantineListingCardPattern`

**Sprint:** 60 · **Type:** UI mechanism (D28) · **QA profile:** `Q2 Standard UI` · **Status:** KICKOFF FILED

## Objective

Remove the Tailwind residue from three already-Mantine components. Grouped because all three are consumed by
the homepage listing card path and share one rendered surface. **Zero visual delta (D28).**

**Runs before Task 757** — see "The duplicated fragment" below.

## Exact current state — read 2026-08-16, verify before editing

### 1. `src/components/shared/LocationCombobox.tsx` (195 lines)

| Current |
|---|
| `className="border rounded-xl p-3 flex flex-col gap-2 bg-muted/30 mt-1"` — the add-location sub-panel |
| `className="flex flex-col sm:flex-row gap-2"` |
| `className="h-4 w-4"` |
| `className={cn('location-combobox', className)}` — **keep**, `location-combobox` is a consumed hook class |

### 2. `src/design-system/mantine/patterns/MantineCopyIdButton.tsx` (59 lines)

| Line | Current |
|---|---|
| 46 | `className={cn(` — read the full expression before editing |
| 53 | `<Check className="h-2.5 w-2.5 shrink-0 text-status-success" />` |
| 54 | `<Copy className="h-2.5 w-2.5 shrink-0 opacity-50" />` |

`h-2.5 w-2.5` = 10px. It has a `.module.css` already — extend that, do not invent a second styling path.

### 3. `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` (402 lines)

Only two residual utilities; everything else is already CSS modules.

| Line | Current |
|---|---|
| 210, 342 | `className={cn(styles.cardTitle, 'leading-snug')}` (twice — list and grid variants) |
| 77 | a doc comment describing a `className="shrink-0 -mt-0.5 -mr-1"` **contract** with a consumer |

**Line 77 is a comment describing an external contract, not a live utility.** Read it, find the consumer that
passes those classes, and decide whether the contract moves too. If it does, that consumer is in scope; if it
does not, the comment must be updated so it stops describing a contract that no longer exists.

## The duplicated fragment — the reason for this task's position

`"border rounded-xl p-3 flex flex-col gap-2 bg-muted/30"` appears **in both** `LocationCombobox` and
`AuthSheet`. Task 757 migrates `AuthSheet`. If 757 runs first, or if this task migrates the fragment
inconsistently, the two copies diverge and one surface silently changes.

**Required:** decide here whether the fragment becomes a shared primitive (a small `Paper`-based sub-panel
wrapper) or is migrated identically in both places, and **write the decision into this task's report** so 757
follows it rather than re-deciding. `rounded-xl` = 12px radius, `p-3` = 12px, `gap-2` = 8px; `bg-muted/30` is
an **opacity-modified token** — read `globals.css` for `--muted` and reproduce the rendered colour. Per D35,
do not alias an opacity-modifier consumer to a runtime `var()`.

## Replacement rules

- `leading-snug` = `line-height: 1.375`. Move it into `styles.cardTitle` in the existing module; do not add a Mantine `lh` prop *and* keep the class.
- Icon sizing → `size` prop (`h-4 w-4` = 16px, `h-2.5 w-2.5` = 10px).
- `sm:flex-row` — confirm the project's `sm` breakpoint px before mapping to a Mantine breakpoint.
- `text-status-success` and `opacity-50` on the copy icons: keep the semantic token; `opacity-50` → `opacity: 0.5` in the module.

## Preserve exactly

- `location-combobox`, `listing-card`, `property-type-combobox`, `year-combobox` and any other **hook class** consumed by `scripts/check-homepage-grid.mjs` or `check-stories-rendered.mjs`. **D33: re-anchor a gate onto a de-Tailwind-stable hook, never another utility class.** Grep both scripts for every class you are about to touch, before touching it.
- The add-location sub-panel's behaviour, including the localized add-failure error (Task 553).
- `MantineCopyIdButton`'s copied/not-copied state and its `Check`/`Copy` swap.
- Both `MantineListingCardPattern` variants — list and grid.

## Out of scope

`AuthSheet` (Task 757) · `ListingCard.tsx` itself · `AppImage` · the admin add-location consumers beyond what
the shared sub-panel decision requires.

## Acceptance criteria

- **AC1** — residue removed from all three files; survivors listed with reasons; every hook class still present.
- **AC2** — `npm run check:homepage-grid` and `npm run check:click-shield` exit 0 — these anchor on `.listing-card` and are the existing regression proof for this surface.
- **AC3** — rendered evidence, zero visual delta, at 320 / 390 / 768 / 1024 / 1440, `uk@320` mandatory, for: the listing card in **both** list and grid variants, the copy-id button in both states, and the location combobox with its sub-panel open.
- **AC4** — the shared-fragment decision is stated explicitly in the report, in a form Task 757 can follow without re-deciding.
- **AC5** — line 77's comment either still describes a live contract or has been corrected. State which.
- **AC6** — `npm run typecheck`, `check:design-tokens`, `check:i18n`, `npm run build` all exit 0.

## Report contract

Changed files with line numbers; the shared-fragment decision **and its rationale**; the grep results proving
no gate-consumed hook class was removed; the `sm` breakpoint px; every utility kept with the reason; commands
with actual output; rendered evidence locations.

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED`. Never self-approve.
