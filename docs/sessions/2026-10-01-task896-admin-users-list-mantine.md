# Task 896 — `/admin/users` list on canonical Mantine (executor session log, 2026-10-01)

Task: `tasks/Sprints/Sprint_84_kickoff_prompt_Task_896_Admin_Users_List_Page_On_Mantine.md` · QA Q3
Status: **IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW**. O84-4 is owed to the owner.

## Receipts

`CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.`
(The kickoff file was opened one tool call before GR-0 and 16b–16c were read. No write preceded the read.)

`GR-0 CANONICAL REUSE PREFLIGHT — request: /admin/users page chrome + AdminUsersTable Story; semantic queries: admin page header with actions, link button, admin list page width, users table story; inspected candidates: src/components/admin/AdminPageHeader.tsx (Patterns/Mantine/AdminPageHeader), MantineDashboardHeader, Button component={Link} (FooterView.tsx), adminPageMaxWidth / adminPageFormMaxWidth / adminPageNarrowMaxWidth in theme.ts, src/app/admin/reports/page.tsx (precedent), Admin/AdminUsersTable; decision: REUSE + EXTEND (adminPageShellMaxWidth); selected canonical owner: components/admin/AdminPageHeader.tsx, theme.other.layout; Mantine/TailAdmin token path: spacing xl, iconSize.standard, header fz h5/h4; new hardcoded visual values: NONE; rationale: the page only composes canonical owners.`

`GR-3a STORY PREFLIGHT — AdminUsersTable × Default/VerifiedTab/Empty/LocationFilter; canonical candidates: Admin/AdminUsersTable (canonical only via the title hatch); direct-import evidence: src/components/admin/AdminUsersTable.stories.tsx:3; toolbar coverage: locale=toolbar, viewport=toolbar; decision: EXTEND by relocation; target: Patterns/Mantine/AdminUsersTable; rationale: owner rule 2026-09-17.`

`GR-1 CENSUS COMPLETE — before: 3 nodes (same as kickoff §3.1); after: 5 nodes; tier1 4 migrated+enrolled+story (AdminPageHeader, AdminUsersTable, MantineDashboardHeader, MantineDataTableToCards); the root page.tsx (className:0) is the only FAIL; tier2 0; tier3 none — filed as none.`

`GR-3 STORY PROVEN — AdminUsersTable ← src/stories/patterns/mantine/AdminUsersTable.stories.tsx` (it imports the component by name).

`GR-2 SCOPE STATED — check:story-coverage inspects only components already in the manifest; it cannot see unenrolled ones; R3 is closed by the manifest diff plus the census line (manifest:yes story:yes).`

## Requirement ledger

| Req | Evidence |
|---|---|
| R1 / AC1 | `src/app/admin/users/page.tsx` renders `Box p="xl" maw={layout.adminPageShellMaxWidth} mx="auto"`, then `AdminPageHeader` (subtitle = location note; action = `Group` with the count when `tab==='all'`, then `Button component={Link}`). It has 0 `className`; the `buttonVariants`/`cn` imports are gone; the data reads are untouched. `11-census-after.txt` shows page.tsx `className:0`. |
| R2 / AC2 | New `src/stories/patterns/mantine/AdminUsersTable.stories.tsx` (Default, VerifiedTab, Empty, LocationFilter, each in `StoryPageGutter`). The old file is deleted with `rm`. `check-stories-rendered.mjs` id → `patterns-mantine-adminuserstable--default`. |
| R3 / AC2 | `AdminUsersTable.tsx` added to `scripts/mantine-migration-scope.json`. `14-story-coverage.txt` exit 0. |
| R4 / AC3 | `MANTINE_STORY_ENROLLED_TITLES = {}` plus a one-line comment. Arms (a), (d), (e) use `Fixture/EnrolledTitle` via `vi.mock`; arm (g) is added. `10-tests.txt` exit 0; P2 fails (g). |
| R5 / AC1 | `theme.ts`: `adminPageShellMaxWidth: '112rem', // 1792px — Task 896: admin list-page wrapper (legacy max-w-10xl / .container-admin cap)` plus the type line. |
| R6 / AC4 | `11-census-after.txt`: the only FAIL is page.tsx with `className:0`. `20-baseline-diff.txt` removes only `AdminUsersTable`'s key. |
| Addendum | The L3 entry is deleted from `type-responsive-baseline.json`; `17b-type-responsive.txt` exit 0. |
| AC5 | Every exit is 0 (evidence 10–19b). `20b-reference-audit.txt` is empty. |

Final-run exits: tests 0 · typecheck 0 · lint 0 · story-coverage 0 · rendered-scope 0 · census-changed 0 · design-tokens 0 · type-responsive 0 · i18n 0 · file-integrity 0 · mojibake 0 · build-storybook 0 · build 0. `11-census-after` exits 1: that is the expected single root FAIL line.

## Deviations (for Opus)

1. `check:surface-census:changed` and its `:update-baseline` need `--base`. I ran `node scripts/check-surface-census-changed.mjs [--update-baseline] --base HEAD`, the same deviation 858 recorded.
2. **Edit beyond "R4 arms only" in `scripts/__tests__/check-design-tokens.test.ts`:** enrolling `AdminUsersTable.tsx` broke two Task 784 §K tests that used it as the "legacy, excluded" example (lines ~1217 and ~1245). I swapped that example to `src/components/admin/AdminListingsTable.tsx`, which is not in the manifest. Opus to confirm.
3. P1 was run on `Default` only. GR-3b/3d were measured on all four exports.
4. `Empty` and `VerifiedTab` are shorter than the 900px measuring viewport, so their bottom gap reads as the remaining viewport, not the 24px gutter. Default at 320/390 shows 24.
5. `Button` is the default Mantine variant. No `size="lg"` was carried over, because kickoff R1 specifies a plain `Button`.
6. The page uses `p="xl"` as the kickoff says. Sibling admin pages use `p={{ base: 'xl', lg: '2xl' }}`.

## Story measurements (`23-measurements.json`, Chromium on `storybook-static`)

`GR-3b STORY RESPONSIVE CHECK — patterns-mantine-adminuserstable--default: 320 288/320 · 390 358/390 · 1024 960/1024 · 1440 1376/1440; overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.` VerifiedTab, Empty and LocationFilter have identical widths and no overflow.

`GR-3c TYPE RESPONSIVE CHECK — patterns-mantine-adminuserstable--default: no headings rendered by the table; body/button/input text 12–16px at 320, 390, 768 and 1440 (same set at every width); ≥24px text without a responsive step: NONE; heading above 20px below 640 (non-hero): NONE; child heading larger than page title: NONE.` The page title belongs to `Patterns/Mantine/AdminPageHeader`, unchanged by this task. I did NOT re-measure it at 320/1440 (kickoff 13.2).

`GR-3d STORY GUTTER CHECK — patterns-mantine-adminuserstable--default (and VerifiedTab, Empty, LocationFilter): gutter StoryPageGutter all (AdminUsersTable sets no root spacing on any side); top/right/bottom/left 320 24/16/24/16 · 390 24/16/24/16 · 1024 24/32/*/32 · 1440 24/32/*/32 (expected 24/16/24/16 · 24/16/24/16 · 24/32/24/32 · 24/32/24/32; * = remaining viewport, content shorter than 900px); side at 0: NONE; doubled gutter: NONE; gutter written in the Story: NONE.`

## Plants (`24-plants.txt`)

| Plant | Result | Hash before → after |
|---|---|---|
| P1 | The planted Story measured 32 at 320 (expected 16). | `c9374b6e…` → `c9374b6e…` |
| P2 | Arm (g) failed (1 failed / 154 passed). | `ed51c0a0…` → `ed51c0a0…` |
| P3 | The census reported `page.tsx className:1`. | `7b1ac9ea…` → `7b1ac9ea…` |

## Files changed (hashes in `22-hash-object.txt`; status in `21-status-after.txt`)

`src/app/admin/users/page.tsx` · `src/design-system/mantine/theme.ts` · `src/stories/patterns/mantine/AdminUsersTable.stories.tsx` (new) · `src/components/admin/AdminUsersTable.stories.tsx` (deleted) · `scripts/lib/mantine-story-scope.mjs` · `scripts/__tests__/check-design-tokens.test.ts` · `scripts/mantine-migration-scope.json` · `scripts/surface-census-baseline.json` · `scripts/check-stories-rendered.mjs` · `scripts/type-responsive-baseline.json` · `docs/backlog.md` (896 cell) · this log · `docs/sessions/evidence/task896/*`.

## Owner visual QA — O84-4

`Patterns/Mantine/AdminUsersTable` × `Default`, `VerifiedTab`, `LocationFilter` × `sq`, `uk` × 390, 1440 (12 tuples), then `/admin/users` after the deploy. The executor does not mark any of them passed.

## Backlog update

The 896 cell in row 54 was edited in place; `docs/backlog.md` stays at 80 lines.
