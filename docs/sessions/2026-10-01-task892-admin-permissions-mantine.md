# Task 892 — `/admin/permissions` on canonical Mantine — session log (2026-10-01)

Task path: `tasks/Sprints/Sprint_84_kickoff_prompt_Task_892_Admin_Permissions_On_Mantine.md` · QA profile Q3 ·
**Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`** (never self-approved). Evidence: `docs/sessions/evidence/task892/`.

## Receipts

- `CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.`
- `GR-0 CANONICAL REUSE PREFLIGHT` and `GR-3a STORY PREFLIGHT`: emitted verbatim from kickoff §15.1 before the first write (REUSE `MantineFormSection`, Mantine `Switch`/`Badge`/`Alert`, `AdminPageHeader`; EXTEND `adminPagePanelMaxWidth`; COMPOSE `AdminPermissionsView`).
- `GR-1 CENSUS COMPLETE — 4 nodes today; after: tier1 1 View migrated+enrolled+story + 1 container-exempt (AdminPermissionsManager) + page.tsx root; tier2 2 imports removed (ui/badge, ui/switch); tier3 none — filed as none.` (`02-census-before.txt`, `11-census-after.txt`: the only FAIL lines are `page.tsx` and `AdminPermissionsManager.tsx`, the §3.2 calibration.)
- `GR-2 SCOPE STATED — check:story-coverage inspects enrolled components only; it cannot see unenrolled ones; AC4 is closed by the View's own Story file importing it (R6) plus the census row manifest:yes story:yes.`
- `GR-3 STORY PROVEN — AdminPermissionsView ← src/stories/patterns/mantine/AdminPermissionsView.stories.tsx`.
- `GR-3b STORY RESPONSIVE CHECK` — each of `patterns-mantine-adminpermissionsview--{default,all-allowed,saving,audit-empty,audit-unavailable}` (identical across all five, `23-measure.json`): 320 288/320 · 390 358/390 · 1024 960/1024 · 1440 1376/1440 (768 720/768); overflow: none (document and every matrix row); fixed-width containers: NONE; style objects: NONE; viewport pins: NONE; side-by-side sections below 640: NONE (the matrix row's name column and its switch are inline items; sections are stacked `Stack`s).
- `GR-3c TYPE RESPONSIVE CHECK` — same five ids: section title 16 · 16 · 16 · 16 (320/390/768/1440); permission name 14 · 14 · 14 · 14; description 12 · 12 · 12 · 12; the View renders no page title (it is in `page.tsx` via `AdminPageHeader`, §12.1); ≥24px text without a responsive step: NONE; heading above 20px below 640 (non-hero): NONE; child heading larger than page title: NONE.
- `GR-3d STORY GUTTER CHECK` — same five ids: gutter StoryPageGutter all (View has no own gutter on any side; the page's `Box p="xl"` is the production source); top/right/bottom/left 320 24/16/24/16 · 390 24/16/24/16 · 768 24/24/24/24 · 1024 24/32/24/32 · 1440 24/32/24/32 (expected top/bottom 24, left/right 16/16/32/32); side at 0: NONE; doubled gutter: NONE; gutter written in the Story: NONE.

## Requirement and acceptance evidence

| ID | Evidence |
|---|---|
| R1 / AC1 | `AdminPermissionsManager.tsx`: `Props`, state, `handleToggle`, toasts and `allowedCount` unchanged; renders only `<AdminPermissionsView … savingKey={saving && pending ? saving : null} …/>`; 0 `className`, 0 `ui/*`. One deviation: the unused `const format = useFormatter()` (old line 23, inside `:21-48`) and its import were removed — the container no longer formats dates and an unused binding would fail lint. |
| R2–R4 / AC2 | `AdminPermissionsView.tsx` (new): root `Stack gap="xl"` with `data-testid="admin-permissions-manager"`; count `Badge`; three `MantineFormSection`s; footer note; matrix rows and audit rows per R3/R4. 0 `className`; `check:design-tokens` and `check:enrolled-tailwind` exit 0. Exactly one `timeStyle` call, on one line (`AdminPermissionsView.tsx:~165`). |
| R5 / AC3 | `page.tsx`: `<Box p="xl" maw={layout.adminPagePanelMaxWidth}>` (no `mx`) around `AdminPageHeader` + manager. Token: `theme.ts` `adminPagePanelMaxWidth: '42rem', // 672px — Task 892: /admin/permissions page wrapper (legacy max-w-2xl)`; type line added beside the other four. |
| R6 / AC4 | Story file, title `Patterns/Mantine/AdminPermissionsView`, 5 exports each in `StoryPageGutter`, `skipCanvas`+`fullscreen`, no viewport pin; View enrolled in `mantine-migration-scope.json`; legacy Story deleted. `check:story-coverage` exit 0. |
| R7 / AC7 | `check-stories-rendered.mjs:220` → `patterns-mantine-adminpermissionsview--default`, same three anchors; exempt entry removed; manifest `site` → `AdminPermissionsView.tsx:87` / `:90`. R7 grep: see Limitations (history-only hits); live-path audit `20c` prints nothing. |
| R8 / AC5 | `AdminPermissionsManager.smoke.test.tsx` T1–T5 pass (`10-tests.txt`). P1: T1 fails; P2: T4 (and T1–T3, which locate the switch by name) fail; P3: census exits 1 naming `ui/badge`. Hash pairs in `10-plants-hashes.txt`. |
| R9 / AC6 | `11-census-after.txt`: FAIL lines are exactly `page.tsx` and `AdminPermissionsManager.tsx`. Baseline diff (`20-baseline-diff.txt`) removes only the two `ui/badge` / `ui/switch` keys. |
| AC8 | see commands below. |

## Plant table (hash before / planted / restored)

| Plant | File | Before | Planted | Restored | Equal | Result |
|---|---|---|---|---|---|---|
| P1 | `AdminPermissionsManager.tsx` | `ff5b8556…` | `ee39f678…` | `ff5b8556…` | yes | T1 failed (1 failed, 4 passed) |
| P2 | `AdminPermissionsView.tsx` | `3593a01f…` | `46897765…` | `3593a01f…` (after repair) | yes | T1–T4 failed (4 failed, 1 passed) |
| P3 | `AdminPermissionsView.tsx` | `3593a01f…` | `e044f36b…` | `3593a01f…` | yes | census EXIT_CODE=1 naming `ui/badge` |

## Commands (EXIT_CODE from the evidence files)

`09` platform `win32 v22.22.3` 0 · `10` test 0 · `10b` `test:admin` 0 · `11` census 1 (two calibration FAIL lines, expected) ·
`12` typecheck 0 · `13` lint 0 · `14` story-coverage 0 · `15` rendered-scope 0 · `15b` baseline update 0 (with `--base HEAD`) ·
`16` census-changed 0 (with `--base HEAD`) · `17` design-tokens 0 · `17b` enrolled-tailwind 0 · `17c` i18n 0 · `17d` i18n-dynamic 0 ·
`18` file-integrity 0 (re-run after BOM normalisation) · `18b` mojibake 0 · `19` build-storybook 0 · `19b` build 0.

## Files Changed (hashes: `22-hash-object.txt`)

- M `src/app/admin/permissions/page.tsx` — wrapper `Box` + `AdminPageHeader`.
- M `src/components/admin/AdminPermissionsManager.tsx` — pure container.
- A `src/components/admin/AdminPermissionsView.tsx` — presentational View.
- M `src/design-system/mantine/theme.ts` — `adminPagePanelMaxWidth`.
- A `src/stories/patterns/mantine/AdminPermissionsView.stories.tsx`; D `src/components/admin/AdminPermissionsManager.stories.tsx`.
- A `src/components/admin/__tests__/AdminPermissionsManager.smoke.test.tsx`.
- M `scripts/mantine-migration-scope.json`, `story-coverage-exempt.json`, `surface-census-baseline.json`, `check-stories-rendered.mjs`, `i18n-dynamic-manifest.json`.
- M `docs/backlog.md` (892 cell only); A this log and `docs/sessions/evidence/task892/*`.

## Deviations and limitations

1. **Kickoff command gap:** `check:surface-census:changed` and `…:update-baseline` need `--base <ref>`; run as `--base HEAD` (diff against the working tree). The kickoff's bare `npm.cmd run …` exits 1 with `--base <ref> is required`.
2. **AC7 grep:** the kickoff's exact command prints 17 lines (`20b`), all history: eight `docs/reviews/artifacts/**` build logs/static snapshots, an Epic 463 kickoff, and this task's own kickoff. Restricting to live paths (`src scripts .storybook .github package.json docs` minus sessions/reviews/archive) prints nothing (`20c`). The exclusion list in the kickoff did not name `docs/reviews/` or other kickoffs — for Opus to judge.
3. **R1 deviation:** the unused `useFormatter` removed (above).
4. **P2 restore incident:** my first restore used an empty replace target and prepended the attribute to the file top (suites showed "no tests"); I repaired it with Node and the hash equals the pre-plant `3593a01f…`. Final tests re-run green afterwards.
5. **Visual changes recorded (O84-3):** section bands → `MantineFormSection` headers; Shield icon beside the title removed; title in the canonical admin header (20px below 640, 24px from 640).
6. Gates `10`–`19b` ran before the baseline update and the BOM normalisation; `16`, `18`, `20*` were re-run after. The build is not affected by either (JSON data / evidence text).
7. `01-status-before.txt` shows `?? docs/sessions/evidence/task892/` because I created the evidence directory before capturing it; the tree was otherwise clean (confirmed by the session-start status).
8. Not run: owner visual QA, as required.

## Visual source trace (R2–R5)

| Artifact | Current → required | Evidence |
|---|---|---|
| Section bands/cards | legacy `rounded-xl border` + muted uppercase band → `MantineFormSection` (`Paper withBorder radius="2xl"`, 16px/500 title, divider) | `MantineFormSectionStack.tsx:21-34`; measured 16px |
| Switch | shadcn → Mantine `Switch`, same `aria-label` | T4 |
| Count badge / alert | shadcn Badge / plain row → Mantine `Badge variant="outline"` / `Alert color="yellow" variant="light"` | Story `AuditUnavailable` |
| Page title | Shield + `h1` 20px in the manager → `AdminPageHeader` in `page.tsx` | `AdminPageHeader.tsx` |
| Width/placement | `p-6 max-w-2xl` left → `Box p="xl" maw=adminPagePanelMaxWidth`, left | `theme.ts` |

## Opus handoff — questions for the reviewer

- Does the AC7 grep deviation (2) satisfy the clause-9 intent?
- Matrix rows have no hover tint (legacy `hover:bg-muted/20`) — not in R3; confirm acceptable.
- Switch/icon colours use `Box c="green"`/`"dimmed"` wrappers since `lucide` icons are not Mantine components; no raw value.
- Owner matrix **O84-3** (§13.3, 14 tuples) is owed; nothing marked visually passed.

## Backlog update

`docs/backlog.md` 892 cell → `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` 2026-10-01 (owner O84-3 owed). File is 63 lines; no `BACKLOG LIMIT BREACH`.
