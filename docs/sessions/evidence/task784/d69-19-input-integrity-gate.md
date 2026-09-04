# D69-19 — read-only input-integrity gate record

Recorded before any D69-19 edit, per the kickoff's "Non-negotiable input-integrity gate" (§14). This is a
reproducible identity of the candidate actually reviewed — **not** a historical baseline, a clean state, a
D69-16 patch witness, or proof that an unrelated dirty file belongs to Task 784.

## HEAD revision

```
b7e157dc40b363904935045aefd4c041fd9908d4
```

(Branch: `main`. This is the commit the working tree is currently checked out against; the working tree
itself is dirty — see below.)

## Full `git status --porcelain` at gate time

```
 M docs/backlog-archive.md
 M docs/backlog.md
 M scripts/__tests__/check-design-tokens.test.ts
 M scripts/check-design-tokens.mjs
 M src/components/layout/FooterView.tsx
 M src/components/layout/HeaderActions.tsx
 M src/components/layout/HeaderView.tsx
 M src/components/shared/LocationCombobox.tsx
 M src/design-system/mantine/patterns/MantineAdminSurfacePattern.tsx
 M src/design-system/mantine/patterns/MantineAuthFormPattern.tsx
 M src/design-system/mantine/patterns/MantineDataTableToCards.tsx
 M src/design-system/mantine/patterns/MantineDialogDrawerPattern.tsx
 M src/design-system/mantine/patterns/MantineDropdownMenu.tsx
 M src/design-system/mantine/patterns/MantineEmptyLoadingErrorState.tsx
 M src/design-system/mantine/patterns/MantineFilterSection.tsx
 M src/design-system/mantine/patterns/MantineFormSectionStack.tsx
 M src/design-system/mantine/patterns/MantineListingCardPattern.tsx
 M src/design-system/mantine/patterns/MantineListingContactPattern.tsx
 M src/design-system/mantine/patterns/MantineListingDetailPattern.tsx
 M src/design-system/mantine/patterns/MantineNavigationMenu.tsx
 M src/design-system/mantine/patterns/MantineNotificationPattern.tsx
 M src/design-system/mantine/patterns/MantinePageHeaderWithActions.tsx
 M src/design-system/mantine/patterns/MantinePagination.tsx
 M src/design-system/mantine/patterns/MantinePopover.tsx
 M src/design-system/mantine/patterns/MantineProgress.tsx
 M src/design-system/mantine/patterns/MantineTooltip.tsx
 M src/design-system/mantine/patterns/MantineTwoColumnForm.tsx
 M src/design-system/mantine/patterns/__tests__/MantinePagination.smoke.test.tsx
 M src/design-system/mantine/patterns/responsiveBottomSheet.tsx
 M src/design-system/mantine/theme.ts
 M src/modules/listings/components/FeaturedListingsView.tsx
 M src/modules/listings/components/LatestListingsView.tsx
 M src/modules/listings/components/ListingsFilterBar.tsx
 M src/modules/listings/components/ListingsFilters.tsx
 M src/modules/listings/components/ListingsPageFrame.tsx
 M src/modules/listings/components/ListingsSortBar.tsx
 M src/modules/listings/components/__tests__/listingsFilterBar.smoke.test.tsx
 M src/modules/locations/components/PopularLocationsView.tsx
 M src/stories/mantine/primitives/CountButton.stories.tsx
 M src/stories/mantine/primitives/FilterControls.stories.tsx
 M src/stories/mantine/primitives/HeaderActions.stories.tsx
 M src/stories/mantine/primitives/HeaderView.stories.tsx
 M src/stories/patterns/mantine/HomepageListingGrids.stories.tsx
 M src/stories/patterns/mantine/ListingCardPattern.stories.tsx
 M src/stories/patterns/mantine/ListingsFilterBar.stories.tsx
 M tasks/Sprints/Sprint_69_Listings_Finishes_The_Mantine_Migration.md
 M tasks/Sprints/Sprint_69_kickoff_prompt_Task_783_Canonical_Mantine_Listings_Filter_Bar_Counter.md
 M tasks/Sprints/Sprint_69_kickoff_prompt_Task_784_Zero_Raw_Design_Dimensions_Mantine_Token_Remediation.md
?? docs/sessions/2026-09-03-task783-listingsfilterbar-canonical-counter.md
?? docs/sessions/2026-09-04-task784-zero-raw-design-dimensions-scope-mode.md
?? docs/sessions/evidence/task783/
?? docs/sessions/evidence/task784/
?? src/design-system/mantine/__tests__/
```

## Mechanical derivation method

The input set was derived by running the *actual* `isMantineScopeFile()` / `loadMantineScopeManifest()`
functions exported from `scripts/check-design-tokens.mjs` (the same functions `--scope=mantine` itself uses)
against every dirty/untracked path above, plus the two allowed detector/test tooling paths
(`scripts/check-design-tokens.mjs`, `scripts/__tests__/check-design-tokens.test.ts`) and the new
`src/design-system/mantine/__tests__/theme.d69-18.test.ts` (in scope by directory root — a plain `git status`
line for a new file inside an already-untracked new directory does not appear individually, so it was
listed explicitly via `find`). No file was hand-picked by task name.

## Input set (42 changed files + 1 new file = 43), content hash

`git hash-object` of each path at gate time — see `d69-19-input-set-hashes.txt` in this same directory for
the full 43-row table (path + SHA-1 blob hash). This is the reproducible identity: re-hashing any of these
43 paths later and comparing against this file proves whether that exact file changed since this gate.

## Quarantine — dirty files OUTSIDE the input set (8)

These are **not** touched by D69-19. They predate this task (Task 783's same-day, still-uncommitted work) or
are Task 784's own non-§3.2 reporting artifacts. Per the gate's own reporting exception, only the named
Task 784 session log, this kickoff, the Sprint 69 register, and `docs/backlog.md` may be edited by D69-19 —
and only at I0/I4 — the other quarantined files are read-only for this entire rework:

| Path | Why quarantined |
|---|---|
| `docs/backlog-archive.md` | Not in §3.2; pre-existing dirty state, not attributed to Task 784 |
| `docs/backlog.md` | In the gate's own I0/I4 reporting exception — editable only for status sync, not a §3.2 production file |
| `src/modules/listings/components/__tests__/listingsFilterBar.smoke.test.tsx` | Task 783's own diff, not §3.2 (not under `src/design-system/mantine/`, not a manifest entry itself — the test file — and not a canonical Mantine story) |
| `tasks/Sprints/Sprint_69_Listings_Finishes_The_Mantine_Migration.md` | Task-design material, not §3.2 |
| `tasks/Sprints/Sprint_69_kickoff_prompt_Task_783_Canonical_Mantine_Listings_Filter_Bar_Counter.md` | Task 783's own kickoff, unrelated |
| `tasks/Sprints/Sprint_69_kickoff_prompt_Task_784_Zero_Raw_Design_Dimensions_Mantine_Token_Remediation.md` | In the gate's own I0/I4 reporting exception |
| `docs/sessions/2026-09-03-task783-listingsfilterbar-canonical-counter.md` | Task 783's own session log |
| `docs/sessions/2026-09-04-task784-zero-raw-design-dimensions-scope-mode.md` | In the gate's own I0/I4 reporting exception |

Two untracked evidence directories (`docs/sessions/evidence/task783/`, `docs/sessions/evidence/task784/`) are
pure output artifacts, not source input — listed here for completeness, not classified into either set.
`docs/sessions/evidence/task783/` is quarantined (Task 783's own); `docs/sessions/evidence/task784/` is this
task's own evidence output directory (where this very file lives) and is written to, never read as input.

## Scope-escape check

Every planned D69-19 production edit (theme test replacement, session-log correction, status sync) targets
only files already in the input set above, or the four named reporting exceptions. No planned edit touches a
quarantined file. **No scope escape.**

## Gate result

Input set contains every file the D69-18 remediation touched (confirmed: all 27 files named in this
session's own Files Changed tables, across Revisions 1–3, appear in the input set above). **Gate passed —
proceeding to I0.**
