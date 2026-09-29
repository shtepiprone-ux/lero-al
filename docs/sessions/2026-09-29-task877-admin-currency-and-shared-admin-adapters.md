# Task 877 — `/admin/currency` on canonical Mantine; `AdminTable` / `AdminPageHeader` as adapters (executor session log)

Status: **IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW** (re-entry at kickoff §16.4 after review 1 `NEEDS REVISION`).
Kickoff: `tasks/Archive/Sprint_78_kickoff_prompt_Task_877_Admin_Currency_Page_And_Shared_Admin_Table_On_Mantine.md`.
Evidence root: `docs/sessions/evidence/task877/`. Platform `win32 v22.22.3`.

## Review 1 items (§16.2)
| Item | State | Evidence |
|---|---|---|
| 1 z-index token in the existing `other.zIndex` map; `other.layer` removed | DONE | `theme.ts` (`zIndex: Record<'siteHeader' \| 'tableStickyColumn', number>`, value `1`); Grep of `src/` for `other.layer`/`.layer.` returns no line; `A-checkpoint.txt` |
| 2 card chevron follows the F4 rule (`actions` called once; chevron only when it returns nothing) | DONE | `MantineDataTableToCards.tsx` `renderDesignedCard`; T2 case 5 |
| 3 `02d-references-before.txt` written (post-dates the R6 deletions, noted in its first line) | DONE | `02d-references-before.txt` |
| 4 one `Map<string, AdminTableCard>` per render | DONE | `AdminTable.tsx` (`cards` / `cardOf`) |

§16.3 deviations recorded: (1) Enter/Space only when the row itself has focus, T2 case 2 proves an inner button keeps its own key;
(2) `AdminTableColumn.className` stays declared, `@deprecated`, not forwarded; (3) card subtitle `Text` is `component="div"`;
(4) R6 deletions landed in Phase A; (5) two non-visual `style` mechanisms in `MantineDataTableToCards.tsx`:
`cursor: 'pointer'` on a clickable row/card and `zIndex` from `theme.other.zIndex.tableStickyColumn` on the sticky cell.

## Receipts
- `GR-0 CANONICAL REUSE PREFLIGHT` (R1): `EXTEND MantineDataTableToCards`; (R3): `EXTEND MantineDashboardHeader`; (R2/R3 adapters): `COMPOSE`; (R4/R5 Views): `COMPOSE` of `MantineModal`, `TextInput`, `Button`, `Badge`, `SimpleGrid`, `Tabs`, `AdminTable`, `RelativeTime`; tokens: `other.zIndex.tableStickyColumn`, `other.layout.adminPageMaxWidth`; new hardcoded visual values: NONE.
- `GR-3a`: `Mantine/Primitives/Table` and `Patterns/Mantine/DashboardHeader` → EXTEND; `Patterns/Mantine/{AdminTable, AdminPageHeader, AdminCurrenciesView, CurrencyFormDialogView, CurrencyDetailDialogView, AdminCurrencyTabs}` → CREATE (no canonical candidate; the legacy `Admin/*` Stories were deleted).
- `GR-3 STORY PROVEN`: each component ← its own Story file under `src/stories/patterns/mantine/` (and `Table.stories.tsx`, `DashboardHeader.stories.tsx` for the two patterns).
- `GR-3b STORY RESPONSIVE CHECK` (23 Stories × 5 widths, `30-gr3b-gr3c-measurements.json`): every Story fills the viewport (320/320 · 390/390 · 768/768 · 1024/1024 · 1440/1440); overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE. Overlay Stories: dialog 390 wide at 390 (bottom sheet).
- `GR-3c TYPE RESPONSIVE CHECK`: the only headings are the page titles of `DashboardHeader/WithActions`, `AdminPageHeader/Default`, `AdminPageHeader/WithAction`: `h1` 320 20px · 390 20px · 768 24px · 1440 24px (24px only from `sm`); body text 12–16px; ≥24px text without a responsive step: NONE; heading above 20px below 640: NONE; child heading larger than page title: NONE. The Views add no headings (Mantine default `Text` sizes only). The kickoff has no type-scale table; the sizes come from `MantineDashboardHeader`'s existing responsive `fz`.
- `GR-1 CENSUS COMPLETE — 17 nodes (`16-census-page.txt`); tier1 13 migrated+enrolled+story (AdminTable, AdminPageHeader, AdminCurrencyTabs, AdminCurrenciesView, CurrencyFormDialogView, CurrencyDetailDialogView, AdminExchangeProvidersView, ProviderFormDialogView, RelativeTime, MantineDashboardHeader, MantineModal, MantineTooltip, responsiveBottomSheet) + MantineDataTableToCards (enrolled, story) + 2 container-exempt (AdminCurrenciesManager, AdminExchangeProvidersManager); page.tsx route root baselined; tier2 imports removed: 7 ui/* keys on this page (tabs, badge, button, dialog, dropdown-menu, input, label); tier3 0.`
- `GR-2 SCOPE STATED — check:story-coverage inspects only enrolled components; it cannot see an unenrolled node; the criterion is closed by the census (`16`) showing every tier-1 node manifest:yes story:yes except the route root and the two exempt containers.`

## Gate results (unpiped, `EXIT_CODE` appended; UTF-8 BOMs stripped afterwards)
| File | Command | Exit |
|---|---|---|
| 03a | census `--update-baseline` | 0 |
| 03 / 03b | baseline diff / removed keys classified | 36 removed (class 1: 14, 2: 10, 3: 8, 4: 4, 5: 0), 0 added, 0 unclassified; `rendered-scope-baseline.json` untouched |
| 11 / 11b | T1 + T2 + AdminUsersTable smoke | 0 / 0 (33 tests) |
| 12 | test:rls-guards | 0 |
| 13 / 14 | typecheck / lint | 0 / 0 (112 pre-existing warnings) |
| 15 | check:story-coverage | 0 |
| 16 | census page | 1 — FAIL lines only `page.tsx`, `AdminCurrenciesManager`, `AdminExchangeProvidersManager` |
| 17–20 | rendered-scope (+verify), census-changed (+verify) | 0 |
| 21 / 22 | check:i18n / check:stories | 0 / 0 |
| 23b | governance:tailwind | 1 — recorded, not asserted (`H15` vs baseline `H10`; the one hit in a touched file, `MantineDataTableToCards.tsx:275`, is the pre-existing JSDoc text "bg-gray-50") |
| 23c | untracked grep for the legacy names | 4 lines, all `docs/admin-ux-rules.md` — see POLICY-EDIT below |
| 24 | build-storybook | 0 |
| 24b | check:locale-leak:mantine-only | **stopped by the executor after 76 min** (progress dots, no report) — recorded, not asserted (AC12); **not a pass**. New 877 Story ids were therefore NOT reviewed for leaks |
| 25 / 25b / 25c | check:file-integrity | 1 (32 evidence-file BOMs) → 1 (its own transcript's BOM) → 0 (89 files) |
| 26 / 26b | check:mojibake | 0 / 0 |
| 27 | npm run build | 0, lists `/admin/currency` |

Plants (each run `EXIT_CODE=1`, each post-hash equals its pre-hash): P1 remove Enter/Space handler → T2 case 1 (`ca58bab6…`); P2 `visibility` → nothing → T2 case 3 (`556b9278…`); P3 drop `setDefaultCurrency` state update → T1 case 5 (`d36a83e1…`); P4 drop `default_currency` mapping in `handleDelete` → T1 case 6 (same file, `d36a83e1…`).

Sticky column (AC2), `StickyColumn` at 1440: the table overflows (scrollWidth 1408 > clientWidth 1340); after scrolling 68px the first cell stays at x=50 (`position: sticky`, `z-index: 1`) while the second cell moves 254 → 186.

## §10.5 reference edits (one line each)
- `check-stories-rendered.mjs`: 3 rows deleted (admincardlist, admintable, admincurrenciesmanager; script not run). `check-locale-leak.mjs`: 2 legacy keys deleted, 3 comments reworded so the AC9 grep is clean. `story-realmode-allowlist.json`: currency row deleted. `story-coverage-exempt.json`: `AdminPageHeader` and `AdminCurrencyTabs` rows deleted (the second was not in the kickoff: it would have exempted an enrolled component). `globals.css`: `.admin-table-scroll-wrap` block deleted.
- Docs: `component-catalog.md` (AdminCardList row removed; three rows → MIGRATED), `design-system.md` (7 wording edits), `storybook-governance.md:439`, `mantine-tailadmin-migration-tracker.md:191-192`, `responsive-storybook-inventory.md` (stale rows/ids rewritten with the file's own `RETIRED-…` convention).

## Deviations / gaps
1. **POLICY-EDIT AUTHORITY REQUIRED — `docs/admin-ux-rules.md`.** It still names `AdminCardList` at `:131`, `:537`, `:555`, `:557` (`:555`/`:557` instruct "use `<AdminCardList>` directly"). The file matches `docs/*rule*.md`, which is read-only for the executor, so AC9's grep cannot reach zero until the owner or a policy maintainer rewrites those four lines to the adapter/`CardConfig` wording. Proposed: replace the two instructions with "use `MantineDataTableToCards` cards (`CardConfig`) at all widths" and the other two mentions with "the retired card list".
2. **`24b` not completed** (above); the new Stories were not leak-checked.
3. AC13 / O78-6 (owner visual QA) is `MISSING EVIDENCE`; no visual verdict is claimed. GR-3b/GR-3c measurements are computed sizes and widths, not a visual review.
4. Companies still passes its own `trailing` (delete + chevron): with the F4 rule it shows only that, no second chevron. Listings passes a decorative `trailing` chevron and no `onRowClick`, so its cards show that chevron only. Neither page is edited.
5. The Story measurements used the repo's Playwright against `storybook-static` (own static server); the `check:locale-leak` Playwright run was the other browser use.
6. A first attempt at the Table Stories edit failed because the auto-mode classifier gave no verdict (transient); redone with the same content.

## Files Changed
See `docs/sessions/evidence/task877/28-hash-object.txt` (hashes) and `29-status-after.txt`. Summary: 26 modified/deleted tracked paths (theme, two patterns, two adapters, container, tabs, page, `globals.css`, 4 R6 deletions, 5 scripts/JSON, 5 docs, 2 extended Stories), 9 new Stories/Views/tests under `src/`, and the evidence folder.

## Backlog update
877 state cell only (`docs/backlog.md:57`); the file is still 80 physical lines. No `BACKLOG LIMIT BREACH`.

## Review 2 + Revision 3 re-entry (kickoff §17.3 + §18.3; evidence `r3/`)
The §17.3 block's own `r2/` folder was not created: §18.3 says its allowlist step is step 1 and puts all evidence in `r3/`.

**Edits** (hashes in `r3/28-hash-object.txt`; the only path with a pre-revision hash to compare is `check-locale-leak.mjs`, now `b5020985…`):
1. `scripts/check-locale-leak.mjs`: comment + 4 `PER_STORY_TOKENS` entries after `adminsurfacepattern` (`admintable`, `admincurrenciesview`, `admincurrencytabs`, `currencydetaildialogview`), tokens copied exactly and added with the Edit tool. Stop-condition check: every token of `r2-review/leak877-report.json` is inside the four lists (0 violations).
2. `CurrencyDetailDialogView.tsx`: all six fields in ONE `SimpleGrid cols={2} spacing="md"` (`symbol`, `decimals`, `name_sq`, `name_en`, `name_uk`, `name_it`); the separate names `Stack` deleted. Detail dialog height at 1440 `en`: **510 → 414** (`DetailView` default), **454 → 358** (`DefaultCurrency`, `Inactive`).
3. `MantineDataTableToCards.tsx`: `miw="max-content"` on the desktop `<Table>` with a comment citing §18.2. Truncated elements (`text-overflow: ellipsis` and `scrollWidth > clientWidth`) inside `#storybook-root table`, `uk`: **0** at 768/1024/1440 for `AdminCurrencyTabs` (both tabs) and for `AdminExchangeProvidersView`.
4. `src/stories/_StoryPageGutter.tsx` created (`surface: 'admin'` → `p={{ base: 'xl', lg: '2xl' }}`, cites `src/app/admin/currency/page.tsx` and GR-3d). `AdminTable` (4 wrappers), `AdminPageHeader` (decorator), `AdminCurrenciesView` (the `ViewDemo` return, so all 4 exports) and `AdminCurrencyTabs` (decorator) now use it; their own `Box p="md"` are gone. `Table.stories.tsx` and `DashboardHeader.stories.tsx` untouched (898's).

**Receipts**
- `GR-0 CANONICAL REUSE PREFLIGHT — request: shared Story page-gutter harness; semantic queries: story gutter page padding skipCanvas harness; inspected candidates: src/stories/mantine/_MantineStoryShell.tsx (primitive showcase shell, card chrome, 16/24px), AdminSurfacePattern.stories.tsx:36, ListingsFilterBar.stories.tsx:42, DashboardGrid.stories.tsx; decision: CREATE; selected canonical owner: src/stories/_StoryPageGutter.tsx; token path: theme spacing xl/2xl from src/app/admin/currency/page.tsx; new hardcoded visual values: NONE.`
- `GR-3a`: the four Stories → EXTEND (same Stories, harness added, no new page).
- `GR-3d STORY GUTTER CHECK` (one per changed Story; the harness box measured at 320 / 390 / 1024 / 1440, `r3/30-measurements.json` → `harnessGutter`): `AdminTable/{Default, Synthesized, Empty, RowClick}`, `AdminPageHeader/{Default, WithAction}`, `AdminCurrenciesView/{Default, Empty, DeleteConfirm, Detail}`, `AdminCurrencyTabs/Default`: surface admin; harness: StoryPageGutter yes; padding 24 · 24 · 32 · 32 (production 24/24/32/32); content edge gap 24/24/32/32 (+1px on the table exports, the `Paper` border); gutter written in the Story: NONE. `CurrencyFormDialogView` and `CurrencyDetailDialogView`: overlay-only, harness n/a.
- `GR-3b`: the 11 changed Stories fill the viewport at 320/390/768/1024/1440, overflow none, no fixed container, no style object, no viewport pin. `GR-3c`: the only headings are the `AdminPageHeader` `h1`s: 20px at 320 and 390, 24px at 1440; ≥24px without a responsive step NONE; heading above 20px below 640 NONE.

**Gate block (`r3/`)**: `11` 0 (33 tests, `AdminUsersTable.smoke` unchanged) · `13` 0 · `15` 0 · `17` 0 · `19` 0 · `22` 0 · `24` 0 · `24c` 0 — *"ZERO leaks across 27 stories"* · `25` 0 · `26` 0 · `27` 0 · `29` 0 (`_StoryPageGutter.tsx` and `r3/` are the new paths; the rest are the earlier revisions'). **`14` lint exits 1**: 1 error, 115 warnings; the one error is `docs/sessions/evidence/task877/r2-review/make-leak877-scoped.cjs:3` (`@typescript-eslint/no-require-imports`), the reviewer's untracked evidence generator that `24c` runs. Product code has 0 lint errors. I did not edit it (kickoff: keep all evidence); the reviewer should convert it to ESM/`.mjs` with `eslint-disable`, or exclude that folder from lint.

**Superseded by Revision 4 below:** the `surface="admin"` gutter (24/24/32/32) of this section and its `GR-3d` receipts; the `14` lint error is closed (reviewer converted the generator to `.mjs`).

**Gaps**: O78-6b (owner) is `MISSING EVIDENCE`. The truncation counter proves 0 after; I did not re-run it before the change, so the "before" defect count is the reviewer's screenshot (§18.2), not mine. Measurements are computed sizes/widths, not a visual review. The static server used for measurement is my own (`storybook-static`, Playwright).

## Revision 4 (kickoff §19.2; evidence `r4/`)
Review 4 found the harness followed the superseded draft of §18.3 step 4 (`surface` prop, `xl/2xl`, 24/24/32/32), not the amended GR-3d.

**Edits** (hashes in `r4/28-hash-object.txt`):
1. `src/stories/_StoryPageGutter.tsx` rewritten: `StoryPageGutter({ children })`, no other prop, renders `<Box px={{ base: 'md', sm: 'xl', lg: '2xl' }} py="xl">`; the comment cites GR-3d and its source (`.container-wide` ladder `globals.css:714-724` + canvas `py-6`, `.storybook/preview.tsx` `withCanvas`); no `surface` wording, no mention of 898.
2. `surface="admin"` removed from all 7 call sites (`AdminTable` ×4, `AdminPageHeader`, `AdminCurrencyTabs`, `AdminCurrenciesView`), by a count-guarded script over an explicit 4-file manifest.
3. `DashboardHeader.stories.tsx`: all 4 exports `Stack p="md"` → `<StoryPageGutter><Stack>` (count guard 4/4); `StoryPageGutter` imported.

**Receipts**
- `GR-0 CANONICAL REUSE PREFLIGHT — request: correct the shared Story gutter profile; semantic queries: story gutter page padding skipCanvas; inspected candidates: src/stories/_StoryPageGutter.tsx (own earlier draft), _MantineStoryShell.tsx (GR-3d's named exception); decision: EXTEND (corrected in place); selected canonical owner: src/stories/_StoryPageGutter.tsx; token path: theme spacing md/xl/2xl from the .container-wide ladder + py-6; new hardcoded visual values: NONE.` `GR-3a`: the five Stories → EXTEND.
- `GR-3d STORY GUTTER CHECK` (one per Story, `r4/30-measurements.json`; harness padding = first content box edge gap): `AdminTable/{Default, Synthesized, Empty, RowClick}`, `AdminPageHeader/{Default, WithAction}`, `AdminCurrenciesView/{Default, Empty, DeleteConfirm, Detail}`, `AdminCurrencyTabs/Default`, `DashboardHeader/{Default, Fresh, WithActions, WithoutPeriodControl}`: StoryPageGutter yes; edge gap 320 16 · 390 16 · 1024 32 · 1440 32 (expected 16/16/32/32; 24px between 640 and 1023); gutter written in the Story: NONE. `CurrencyFormDialogView`, `CurrencyDetailDialogView`: n/a: overlay-only.
- `GR-3b`: all 15 exports, no horizontal overflow at 320/390/768/1024/1440. `GR-3c`: the only headings are the page `h1`s: 20px at 320/390, 24px at 768 and 1440 (`WithoutPeriodControl` renders two headers, 20,20 / 24,24); ≥24px without a responsive step NONE; heading above 20px below 640 NONE.

**Gate block (`r4/`)**: every command exits 0, including `14-lint` (0 errors, 118 warnings) — `10`, `11` (33 tests), `13`, `14`, `15`, `17`, `19`, `22`, `24`, `24c` (*"ZERO leaks across 27 stories"*), `25`, `26`, `27`, `29`. New paths since revision 3: `r4/` only.

**Gaps**: O78-6b (owner) still `MISSING EVIDENCE`; its gutter row now includes `DashboardHeader`, and the gutter is 16px on a phone, 24px from 640px, 32px from 1024px. Measurements are computed values, not a visual review.

## Revision 5 (kickoff §21.3; evidence `r5/`)
The owner returned `CurrencyDetailDialogView` (UX) and the `AdminExchangeProvidersView` Story gutter at O78-6b.

**Edits** (hashes in `r5/28-hash-object.txt`):
1. `CurrencyDetailDialogView.tsx`: the footer keeps only "Edit" (filled, full width below `sm`, `auto` and right-aligned from `sm`); "Close" and the unused `tc`/`useTranslations('common')` are deleted. A new `Group gap="xs" wrap="wrap"` directly below the badge row holds, in order, "Set as default" (not default and active), the toggle (always), "Delete" (not default, `color="red"`), each `Button variant="transparent"` with `mih={theme.other.touchTarget}` and its previous icon at `iconSize.compact`. Props unchanged.
2. T1 case 7: both "Close" clicks became `fireEvent.keyDown(<dialog>, { key: 'Escape' })` with the wait for removal kept, plus `expect(within(allDialog).queryByRole('button', { name: messages.common.close })).toBeNull()`. T1 passes 7/7.
3. `AdminExchangeProvidersView.stories.tsx`: the `<AdminExchangeProvidersView/>` in `ViewDemo` is wrapped in `<StoryPageGutter>` (import added); nothing else changed. All 4 exports use `ViewDemo`.

**Receipts**
- `GR-0 CANONICAL REUSE PREFLIGHT — request: text-with-icon actions for the detail dialog; inspected candidates: Button variant="transparent" (tailadmin-style-reference.md:87-95, §6a-link), AdminUsersTable.tsx:146 (touch-target precedent); decision: REUSE; token path: theme.other.iconSize.compact / touchTarget; new hardcoded visual values: NONE.` `GR-3a`: `AdminExchangeProvidersView` Story → EXTEND (the same Story, the harness added).
- **GR-3d sweep of §13.3 + §18.4** (every Story in the matrix): `Mantine/Primitives/Table` → `MantineStoryShell`, the GR-3d exception, unchanged; `DashboardHeader`, `AdminTable`, `AdminPageHeader`, `AdminCurrenciesView`, `AdminCurrencyTabs` → `StoryPageGutter` (revision 4); `AdminExchangeProvidersView` → wrapped now; `ProviderFormDialogView`, `CurrencyFormDialogView`, `CurrencyDetailDialogView` → `skipCanvas` but overlay-only; legacy `Admin/AdminListingsTable`, `AdminSupportManager`, `AdminCompaniesManager`, `AdminPropertyTypesManager` → no `skipCanvas` (default canvas). No other Story needed wrapping.
- `GR-3d STORY GUTTER CHECK` (`r5/30-measurements.json` → `providers`): `AdminExchangeProvidersView/{Default, Empty, Pending, DeleteConfirm}`: StoryPageGutter yes; edge gap 320 16 · 390 16 · 1024 32 · 1440 32 (expected 16/16/32/32); gutter written in the Story: NONE; no overflow at 320/390/768/1024/1440. The other Stories in the matrix keep their revision-4 receipts (unchanged); overlay-only ones: `n/a: overlay-only`; the four legacy Stories: `n/a: default canvas`; `Table`: exempt (`MantineStoryShell`).
- `GR-3b`/`GR-3c` for `CurrencyDetailDialogView` (3) and `AdminCurrenciesView/Detail`: no horizontal overflow at 390/960/1440 in `en` and `uk`; the dialog has no heading above body size (the code is a `Text`, not a `Title`).

**Gate block (`r5/`)**: every command exits 0 — `10`, `11` (33 tests), `13`, `14` (0 errors), `15`, `17`, `19`, `22`, `24`, `24c` (*"ZERO leaks across 27 stories"*), `25`, `26`, `27`, `29`.

**Measured against §21.3 step 5** (`en`/`uk`, 390/960/1440):
- The footer holds exactly one labelled button, "Edit" (≥640px the only other button is the modal's own icon-only ✕): **met**, all 24 tuples.
- The action row's top is below the badge row's bottom: **met**, all 24 tuples. No filled or outline button remains besides Edit (`outline=0`). Each text button is 44px tall (`touchTarget`): **met**. No horizontal overflow at 390: **met**.
- **NOT MET — the action row shares one `top` at 960 and 1440 in `uk`** for the exports that render all three actions (`Default`, `AdminCurrenciesView/Detail`). The three Ukrainian labels are 532px wide in a 440px dialog body, so the row wraps: first button on its own line, the other two on a second (tops 513 / 565 / 565). English passes (355px, one top 539). The two-action exports (`DefaultCurrency`, `Inactive`) share one top in both languages. At 390 the full set wraps in both languages, as the kickoff's `wrap="wrap"` allows. I did not change the dialog width (kickoff: no other change); a wider `MantineModal size` for this dialog is the obvious lever, for Opus to decide.
- **NOT MET — the dialog height at 1440 `en` should drop from 414/358 px**: it is **418 px on all three exports** (`uk`: 470 / 418 / 418). The 44px-minimum text-button row costs more height than the footer buttons it replaced.

**Superseded by Revision 6 below:** the action *row* of this section (the `uk` wrap at 960/1440 and the height check). Revision 5's other edits stand.

**Gaps**: owner §21.4 (`CurrencyDetailDialogView`, `AdminCurrenciesView/Detail` at 390 and 1440 in `en`/`uk`; `AdminExchangeProvidersView` ×4) is `MISSING EVIDENCE`. Measurements are computed values, not a visual review.

## Revision 6 (kickoff §22.3; evidence `r6/`) — one action button per line
Kickoff §22.1 records that §21 misread the owner's words: the owner wanted **each** action on its own line, not a shared row. That is why revision 5's wrapping `Group` broke over two lines in `uk`; the two "NOT MET" checks above are withdrawn by §22.3 (a vertical list is taller by design).

**Edit** (`r6/28-hash-object.txt`, one file, now `04617f8d…`): in `CurrencyDetailDialogView.tsx` the action row's `Group gap="xs" wrap="wrap"` became `Stack gap={0} align="flex-start"`; the three buttons and their props are untouched, and the comment above them now says one button per line. Nothing else changed.

**Receipts**
- `GR-0 CANONICAL REUSE PREFLIGHT — request: a vertical one-per-line action list; inspected candidates: canonical Mantine Stack (already imported in this View); decision: REUSE; token path: none needed (gap={0}, each button carries the 44px touch target); new hardcoded visual values: NONE.`
- `GR-3b`/`GR-3c` for `CurrencyDetailDialogView` (3) and `AdminCurrenciesView/Detail`: no horizontal overflow at 390 in `en` and `uk` (all 12 tuples at 390); no heading in the dialog (the code is a `Text`). `GR-3d STORY GUTTER CHECK — CurrencyDetailDialogView/{Default, DefaultCurrency, Inactive}: n/a: overlay-only; AdminCurrenciesView/Detail: StoryPageGutter yes; edge gap 320 16 · 390 16 · 1024 32 · 1440 32 (expected 16/16/32/32); gutter written in the Story: NONE.`

**Gate block (`r6/`)**: every command exits 0 — `10`, `11` (33 tests), `13`, `14` (0 errors), `15`, `17`, `19`, `22`, `24`, `24c` (*"ZERO leaks across 27 stories"*), `25`, `26`, `27`, `29`.

**Measured against §22.3 step 3** (`r6/30-measurements.json`; the 3 `CurrencyDetailDialogView` exports + `AdminCurrenciesView/Detail`, `en`/`uk`, 390/843/1440 = 24 tuples, 0 failing): each action button has a different `top`, ascending in the order set default → toggle → delete · each button's `left` equals the badge row's `left` within 1px (e.g. `uk@843`: 218 = 218; `uk@1440`: 516 = 516; `uk@390`: 16 = 16) · every button is 44px tall, so no label wraps, including the long Ukrainian "Встановити за замовчуванням" · the footer holds only "Edit" · no overflow at 390. Example `Default`, `uk`: tops 692 / 736 / 780 at 390 and 495 / 539 / 583 at 843 and 1440. Dialog height at 1440: `Default` 506 (`en` = `uk`), `DefaultCurrency` 418, `Inactive` 462; at 390 `en`: 528 / 440 / 484.

**Gaps**: owner §22.4 (`CurrencyDetailDialogView` ×3 and `AdminCurrenciesView/Detail` at 390 and 1440 in `en`/`uk`; `AdminExchangeProvidersView` ×4 gutter) is `MISSING EVIDENCE`. Measurements are computed values, not a visual review.

