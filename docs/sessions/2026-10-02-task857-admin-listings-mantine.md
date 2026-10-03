# Task 857 — `/admin/listings` honours `visibility=visible` and moves to canonical Mantine (executor session log)

**Task:** `tasks/Sprints/Sprint_78_kickoff_prompt_Task_857_Admin_Listings_Visible_Filter_On_Mantine.md` · **Status:** `PARTIALLY IMPLEMENTED` (see §8: two items need Opus) · Evidence: `docs/sessions/evidence/task857/` · No Git run.

Receipts emitted in the session: `CANONICAL REUSE PREFLIGHT LOADED`; GR-0 / GR-3a / GR-1 as in kickoff §15.1 (decision REUSE + COMPOSE; census before = 16 nodes, after = 4 calibration FAIL lines).
Process note: the kickoff was opened before the GR-0 files; I voided that first read, read both files, then restarted from the start gate.

## 1. Requirement and AC evidence

| Req / AC | Implementing code | Evidence |
|---|---|---|
| R1 | `src/app/admin/listings/visibilityFilter.ts` (`applyAdminListingsVisibility`), called from `page.tsx`; unknown value ignored | T1 (3 tests), `10-tests.txt` |
| R2 / AC1 | `AdminListingsTable.tsx` is a container (state, `navigate`, `navigateVisibility`, `STATUS_LABEL`, resync, dialog handlers); renders `AdminListingsView`, `ListingPreviewDialog`, `PremiumDialog`; 0 `className`, 0 `ui/*` | census: 4 FAIL lines only (`11-census-after.txt`) |
| R3 | `ListingPreviewDialog.tsx`, `PremiumDialog.tsx` (state, actions, toasts moved verbatim) | T4–T7 |
| R4–R6 / AC2 | `AdminListingsView.tsx`, `ListingPreviewDialogView.tsx`, `PremiumDialogView.tsx` | `check:design-tokens`, `check:enrolled-tailwind` exit 0 |
| R7 / AC3 | `useAdminSearchQuery.ts`; `AdminSearchInput.tsx` return JSX unchanged (diff shows only the logic block removed) | T3, diff |
| R8 / AC4 | `page.tsx`: `<Box p={{ base: 'xl', lg: '2xl' }} maw={layout.adminPageShellMaxWidth} mx="auto">` + `AdminPageHeader` (token existed from 896) | build |
| R9 / AC5 | three Story files, all R9 exports; legacy Stories deleted | `check:story-coverage` 0, Storybook build 0 |
| R10 / AC6 | `AdminPageShell.tsx`, both legacy Stories deleted (hashes in `05-deleted-hashes.txt`); scripts retargeted; `visibility.test.ts` path constant | `visibility.test.ts` 66 pass; **AC6 grep not empty — §8** |
| R11 / AC7 | `AdminListingsTable.smoke.test.tsx`, 13 tests T1–T7 | `10-tests.txt` exit 0 |
| R12 / AC8 | baseline regenerated (`16a`, `20-baseline-diff.txt`): −9 stale keys, +2 container keys | `16-census-changed.txt` exit 0 |
| AC9 | build 0, typecheck 0, lint 0, story-coverage 0, rendered-scope 0, census:changed 0 (`--base HEAD`), i18n 0, i18n-dynamic 0, file-integrity 0, mojibake 0, build-storybook 0, type-responsive 0 | `12`…`19b` files |

## 2. Plants (hash before = hash after in every case; `06*-plants-run.txt`)

| Plant | Result |
|---|---|
| P1 `'visible'` → nothing | T1 failed, restored `90e1dbc2…` |
| **P2** inline `.eq('status','active')` in `visibilityFilter.ts` | **`check:listing-visibility` exit 0 — did not fail** |
| P3 `page: '1'` dropped | T2 failed, restored `1a180cea…` |
| P4 Open public always | T7 failed, restored `363ffcfd…` |
| P5 rendered `ui/badge` import | census names `src/components/ui/badge.tsx` tier2, restored `35b47f25…` |

P2 was probed in four shapes (helper file; reassignment in `page.tsx`; lone `.eq` in the route chain; `.eq` + `.gte('expires_at')` pair in the route chain): all exit 0. GR-2: the gate inspects `from('listings')` blocks it can follow; it cannot see a predicate in a helper that receives the builder, and it also did not flag the route chain of `page.tsx` (that route's `.select(` is a multi-line template). Not investigated further (gate is out of scope).

## 3. Measurements (Playwright against `storybook-static`; `23-measurements-*.json`)

- `AdminListingsView` (8 exports, sq; default/visible/hidden/paginated also uk; default en/it @1024): comp/parent 288/320, 358/390, 720/768, 960/1024, 1376/1440 (parent = `StoryPageGutter` box); no page or element overflow; rows ordered; filter bar stacked at 320/390 (tops 94/150/206), one row from 768.
- GR-3d: `StoryPageGutter all`; top/right/bottom/left 320 `24/16/24/16` · 390 `24/16/24/16` · 1024 `24/32/24/32` · 1440 `24/32/24/32` (padding of the gutter box; the measured bottom at ≥768 includes the empty canvas below short content).
- GR-3c: no text ≥ 24px in any Story; computed sizes 10–16px (buttons 14/16, badges 12, cells 14, inputs 16 on mobile); dialog titles 16px. The page title (`AdminPageHeader`, 20→24) is rendered by the route, not by these Stories, and is the unchanged 877 adapter; not measured here.
- Dialogs (overlay-only, GR-3d n/a): bottom sheet 320/320 and 390/390, centred 440 / 380 wide from 768; no overflow; every button ≥ 44px below 640 (28px `xs` above).

## 4. Deviations and limitations

- `visibility.test.ts`: besides the path, I renamed the constant and the `describe` title (assertions unchanged).
- Title cell is an `UnstyledButton` that stops propagation; the table also gets `onRowClick`, which adds the pattern's own row chevron and makes cards tappable (the legacy card had no click target of its own).
- Search field has no max width (legacy `max-w-sm`); no token used.
- Not run: owner visual QA (O78-12, 34 tuples), live check after deploy.
- Status `usePreviewStatusActions` hook is exported from `ListingPreviewDialog.tsx` so the dialog Story renders the production engine data.

## 5. Files changed

Modified: `src/app/admin/listings/page.tsx`, `AdminListingsTable.tsx`, `AdminSearchInput.tsx`, `visibility.test.ts`, `scripts/{check-stories-rendered.mjs, mantine-migration-scope.json, responsive-screenshots.mjs, story-realmode-allowlist.json, surface-census-baseline.json, type-responsive-baseline.json}`, `docs/critical-flow-registry.md` (row 70 note), `docs/component-catalog.md` (AdminListingsTable → MIGRATED; AdminPageShell row removed), `docs/backlog.md` (857 cell).
New: `visibilityFilter.ts`, `AdminListingsView.tsx`, `ListingPreviewDialogView.tsx`, `PremiumDialogView.tsx`, `ListingPreviewDialog.tsx`, `PremiumDialog.tsx`, `useAdminSearchQuery.ts`, `__tests__/AdminListingsTable.smoke.test.tsx`, three Stories, this log, evidence.
Deleted: `AdminPageShell.tsx`, `AdminPageShell.stories.tsx`, `AdminListingsTable.stories.tsx`.

## 6. Hashes

`22-hash-object.txt`; `21-status-after.txt` is the final porcelain status.

## 7. Owner visual QA owed — O78-12

Per kickoff §13.3 (34 tuples): `AdminListingsView` Default/VisibleFilter/HiddenEligible/Paginated × sq,uk × 390,1440; `ListingPreviewDialogView` Active/SoldStatusActions/DeleteConfirm × sq,uk × 390,1440; `PremiumDialogView` NotPremium/Premium × sq × 390,1440; `AdminListingsView` Default × en,it × 1024. Post-deploy: click ADM-08 and confirm the visible segment.

## 8. For Opus

1. **`POLICY-EDIT AUTHORITY REQUIRED` / task-spec conflict (R10, AC6):** `20b-reference-audit.txt` is not empty. Remaining hits outside history paths: `docs/admin-ux-rules.md`, `docs/design-system.md`, `docs/storybook-governance.md`, `docs/responsive-storybook-inventory.md`, `docs/mantine-tailadmin-migration-tracker.md`, `docs/backlog-reserved.md`, `src/app/globals.css` (comment), `scripts/task419-qa-shell-fullwidth.mjs` (one-off historic script, not in any gate), `tasks/Epics/*`, `docs/governance-reports/**`, `docs/reviews/**`. Policy-named or outside the §7 write set, so untouched.
2. **P2 did not fail** (§2). The plant as written cannot fail on this gate; decide whether to widen the gate or accept T1 as the critical-flow proof.
3. R12 says "no key added", but the two new containers `ListingPreviewDialog` / `PremiumDialog` are new baseline keys (the calibration lists them as expected FAIL lines).
4. Cross-task: 886 had already landed (type-responsive L5 entry removed here).

## Revision 1 — kickoff §16 (remediation; start step I0 platform line only)

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. Platform `win32 v22.22.3` (`24-platform-r1.txt`). Sections 1–8 above are unchanged; evidence `01`–`23` and every earlier `plant-*` file were reused, not re-run or overwritten.

### R13 / AC10 — `scripts/check-listing-visibility.mjs`
- `extractListingsQueryBlocks` now also treats `const|let <name> = [await] <identifier>` followed by a line that starts with `.from('listings')` as a derived-variable declaration; later `<name>.` / `<name> = <name>.` lines are scanned exactly as shape 2 scans them. The write-method exclusion is unchanged. Destructured declarations (`const { data } = await supabase`) are not treated as derived.
- `SCOPE_LINE` names the multi-line declaration and keeps the *passed as arguments* blind spot.
- `--verify-gate`: four new arms, all printed — BAD `multi-line declaration: query = query.eq('status','active')` (with the multi-line `.select(` template), BAD `multi-line declaration: query.gte('expires_at')`, NO-FP `multi-line declaration + dynamic .eq('status', status)`, NO-FP `multi-line declaration + applyPublicVisibility(query)`. Self-test 34 passed, 0 failed (`27-…`).
- `check:listing-visibility` exit 0, 0 violations, 9 allowlist entries 0 stale, 819 files (`26-…`). **No §16.7 hit.**
- Re-measured declarations followed (`36-multiline-decl-count-r1.txt`): **6** — `admin/listings/page.tsx:63`, `api/listings/route.ts:15`, `[locale]/cabinet/page.tsx:49`, `[locale]/listings/page.tsx:42`, `favoritesQueries.ts:54` and `:120`; same set as the kickoff pre-measure.

### R14 / AC11 — T1b (same smoke file; the partial mock did not disturb T2–T7)
`vi.mock('@/modules/listings/lib/visibility')` with `importActual` and call-through spies (`vi.hoisted`). `visible` → `applyPublicVisibility(builder)` once, other helper not called; `hidden_eligible` + `expired` → `applyPublicEligibleButHidden(builder, { reason: 'expired' })` once; `bogus` → neither. T1 untouched. Tests: 82 passed (79 + 3) (`25-tests-r1.txt`).

### Plants (`35-plants-r1.txt`; `plant-P2a|P2b|P2c-r1-{planted,restored}.txt`; blob hashes computed in Node, equal before/after)
| Plant | Edit | Hash before = after | Planted | Restored |
|---|---|---|---|---|
| P2a | `visibilityFilter.ts` inlines `.eq('status','active').gte('expires_at', …)` | `90e1dbc2…` | exit 1 — only T1b `'visible' calls applyPublicVisibility once…` fails; **T1 stayed green** | exit 0 |
| P2b | `page.tsx` + `query = query.eq('status', 'active')` after the filter call | `b682cd9c…` | exit 1 — names `src/app/admin/listings/page.tsx:96` | exit 0 |
| P2c | detector change disabled (`if (false && …)`), new arms kept | `2ebc2abd…` | exit 1 — `❌ MISSED` on both new BAD arms, 32 passed 2 failed | exit 0 |

GR-2 SCOPE STATED — `check:listing-visibility` inspects `from('listings')` blocks in `src/**/*.{ts,tsx}` minus excluded paths (direct chains, derived variables incl. a multi-line declaration, same-file arrow factories); it cannot see factories declared with `function`, factories whose `from('listings')` is on a later line than the declaration, factories imported from another module / passed as arguments / stored on objects, or predicates built with dynamic strings; the criterion is closed by T1b (helper called) plus P2a–P2c, not by the green gate.

### Gate block (§16.8)
`25` tests 0 · `26` 0 · `27` 0 · `28` typecheck 0 · `29` lint 0 · `30` file-integrity 0 · `31` mojibake 0 · `32` build 0 · `33` status · `34` hashes · `20c-reference-audit-r1.txt` exit 0.
`20c` hits are exactly §16.4's live list and no other path: `docs/admin-ux-rules.md`, `docs/design-system.md`, `docs/storybook-governance.md:439`, `docs/responsive-storybook-inventory.md`, `docs/backlog-reserved.md:32`, `src/app/globals.css:729`. All are Opus's at approval closure; untouched.

### Files changed in Revision 1
`scripts/check-listing-visibility.mjs`; `src/components/admin/__tests__/AdminListingsTable.smoke.test.tsx` (T1b + header comment); `docs/critical-flow-registry.md` row 70; this log; `docs/backlog.md` 857 cell; evidence `24`–`36` `*-r1` and `plant-P2*-r1-*`. `page.tsx` and `visibilityFilter.ts` were planted and restored byte-identical.

### Limitations
Revision 1 changes no visible artifact; O78-12 (34 tuples) remains owed to the owner. No mutating repository commands were run.

## Revision 2 — kickoff §17 (owner returned O78-12)

Status: **`PARTIALLY IMPLEMENTED`** — R16, R17, R18, T4/T6/T8, P6 and every gate are evidenced; **AC12 (R15) is not met for `AdminListingsView`** (§ "AC12 finding"). Platform `win32 v22.22.3` (`40-platform-r2.txt`). Revision 1 files and evidence `01`–`36` untouched.

### What changed
- **R15** `AdminTable.tsx`: `AdminTableColumn.width?` / `wrap?` forwarded to `TableColumn.width` / `.wrap`; omitted → unchanged output; deprecated-`className` comment updated. `AdminTable.stories.tsx`: new `WrappedTitleColumn` (rows from `FIXTURE_LISTINGS`, in `StoryPageGutter`). `AdminListingsView`: listing column `wrap: true`, `width: calc(var(--mantine-spacing-3xl) * 5)` (240px from tokens), title `Text size="sm" fw={500} lineClamp={2}`; audit label no longer `inherit` (computes 14px in sq/en/uk/it, `59-measurements-r2.json` → `audit`).
- **R18** `AdminListingsView`: below `theme.other.mobileGate` the visibility filter is a `MantineSelect`; from 640 the `SegmentedControl` (T2 untouched and green).
- **R16** `ListingPreviewDialogView` per §23.6: title + gray `premium_badge`, `StatusChangeSelect` as the Status cell, tertiary View / Open public (subtle, icons), footer Delete (subtle red) · Premium (default) · Edit (the one filled button); delete-confirm footer Cancel (default) + Delete (filled red). `ListingPreviewDialog`: `usePreviewStatusActions` → `usePreviewStatusOptions`, `ACTION_DEFS` and `changingStatus` deleted, `handleStatusChange` throws on `result.error` and does not toast. The container keeps an optional, unused `statusLabel` prop only because `AdminListingsTable.tsx` (outside §17.5's write set) still passes it.
- **R17** `PremiumDialogView` / `PremiumDialog`: `Radio.Group` (4 presets + custom date), picker revealed for custom, footer Remove (subtle red) · Cancel (default) · Save (filled, disabled until a choice / a date), no `--badge-premium`, no literal "OK"; Save applies, a preset click alone calls nothing.
- **Stories**: `ListingPreviewDialogView` `Active`, `SoldStatusActions`, `Hidden`, `DeleteConfirm`, `Premium` (`ChangingStatus` deleted); `PremiumDialogView` `NotPremium`, `Premium`, `CustomDate` (frozen fixture day `2027-06-15`, §14.10), `Saving`.
- **Tests**: T4 (select → `updateListingStatus` + row badge; error → `status_change_error`), T6 (Save applies, preset alone does not), T8 (exactly one filled button, Edit); `openPreview` now waits for the dialog role. 83 passed.
- **i18n**: added `admin.listings.premium_badge` (sq/en/it "Premium", uk "Преміум"). Removed from `admin.listings` in all four locales, each grep-proved unused (`AdminSupportManager`'s same-named keys are `admin.support`, a different namespace): `status_section_label`, `btn_approve`, `btn_reject`, `btn_activate`, `btn_deactivate`, `btn_mark_sold`, `btn_mark_rented`, `btn_archive`, `btn_send_review`, `btn_restore`, `btn_expire`, `btn_renew`, `btn_set_status`, `status_update_success`, `status_update_error` (15 keys × 4). `i18n-dynamic-manifest.json` did not name them.

### AC12 finding — `BLOCKED — R15 PATTERN` for `AdminListingsView`
The mechanism works: `WrappedTitleColumn` has no scroll and 1/1 insets at 768/1024/1280/1440 × sq/en/uk/it (`59b-cols-r2.json`). `AdminListingsView` still scrolls at 768, 1024 and 1280 in every locale, and `uk` at 1440 by 1px (`sq`/`en`/`it` at 1440: no scroll, insets 1/1 + 24px padding).
1. The kickoff's percentage `width` makes it worse: a percentage column makes the table's max-content width = title max-content ÷ percentage. At 40% the table was 1332px at 768 (`59-measurements-r2.json`); `width: 100%` gives a million-pixel table. A fixed width from tokens is the only form that wraps.
2. The other columns alone do not fit. In a browser probe with the title forced to its minimum (150px): non-title columns sum 723px at 768 (718 available), 867px at 1024 (958 available with the title at 150 → 1017 total), 1079px at 1280. Even a 150px title column scrolls below 1440. Cause: every other column is `nowrap` (kickoff: "every other column stays `nowrap`"), cell padding is 24px each side, the visibility badge is 220–270px in `uk`/`sq`, and the Type / Agent / ID / Date columns appear from `md` / `lg` / `xl`.
3. Options for Opus (none taken here, all outside §17.5 or against §17.3): (a) move the Type column from `md` to `lg` and Agent from `lg` to `xl` (changes preserved §3.4 behaviour); (b) drop the visibility column from the table below `xl` and keep it in the card/dialog; (c) let the pattern's `miw="max-content"` yield (pattern change, forbidden); (d) accept the horizontal scroll and fix only the last-cell inset.
Evidence: `59-measurements-r2.json` (first pass, with 40%), `59b-cols-r2.json` (final tree, 240px token width).

### AC evidence
- **AC13** (`59b-dialogs-r2.json`, 390/1440 × sq/uk, all 5 preview exports): one filled button in every state (Edit; the confirm step's Delete); `StatusChangeSelect` present; no `--badge-premium` in the dialog DOM or the files (grep empty); at 390 the footer is stacked, 358px wide (full width), 44px tall, in the order Edit, Premium, Delete (confirm step: Delete, Cancel).
- **AC14** (same file, 4 premium exports): one filled button (Save); no `--badge-premium`, no literal `OK` (grep of both files empty); Save disabled with no choice (`NotPremium`, `Premium`, `Saving`), enabled in `CustomDate`; at 390 stacked 358×44: Save, Cancel, Remove (when premium).
- **AC15** (`59-measurements-r2.json` → `visibility`, 4 locales × 320/390/640/1024): select at 320 and 390, width = search field width (288 / 358), label not clipped; at 640 (the pattern's phone gate is `max-width: 40em`, so 640 is still the phone layout) a select; from 1024 the `SegmentedControl`.
- **AC16**: T1–T8 + T1b pass (83); P6 below.
- **AC9 re-run** (`42`–`56`): see the gate list; the `check:surface-census` FAIL lines are exactly the four §3.1 lines (`41-census-r2.txt`).

### P6 (`61-plant-P6-r2.txt`; `plant-P6-r2-{planted,restored}.txt`)
`ListingPreviewDialogView.tsx` Premium made filled (its `variant="default"` removed): hash `389099720a19…` before = after; planted exit 1, T8 fails ("the resting footer has exactly one filled button, and it is Edit"); restored exit 0.

### Gates (§17.6)
`41` census 1 (the four calibration FAIL lines, expected) · `42` tests 0 · `43` typecheck 0 · `44` lint 0 · `45` story-coverage 0 · `46` rendered-scope 0 · `47` census-changed 0 (run with `--base HEAD`: the bare script prints "--base <ref> is required", exit 1, recorded in the log above this line's rerun) · `48` design-tokens 0 · `49` enrolled-tailwind 0 · `50` i18n 0 · `51` i18n-dynamic 0 · `52` type-responsive 0 · `53` file-integrity 0 · `54` mojibake 0 · `55` build-storybook 0 (includes `check:stories`) · `56` build 0 · `57` status · `58` hashes.

### Receipts (final tree, English; `59b-*`, `59c-gutters-r2.*`)
- GR-0 / GR-3a `WrappedTitleColumn` — EXTEND `AdminTable` (candidate `Patterns/Mantine/AdminTable`, direct import `AdminTable.stories.tsx:3`); `StatusChangeSelect` — REUSE (`Patterns/Mantine/…` Story from Task 894).
- GR-3b: no fixed container, style object or viewport pin in the changed Stories; page overflow none at 320/390/768/1024/1440; widths in `59c`: root 288 / 358 / 960 / 1376.
- GR-3c: largest text 16px (inputs on mobile) in `AdminListingsView`, 14px in `WrappedTitleColumn`; no heading ≥ 24px; dialog titles `MantineModal` unchanged.
- GR-3d (top/right/bottom/left, 320 · 390 · 1024 · 1440): `AdminListingsView` `Default` 24/16/24/16 · 24/16/24/16 · 24/32/·/32 · 24/32/·/32; `Paginated` the same; `WrappedTitleColumn` 24/16/·/16 · 24/16/·/16 · 24/32/·/32 · 24/32/·/32 (bottom shows the free viewport height wherever the content is shorter than the viewport; it is 24 where the content fills it); dialogs overlay-only.
- §23.6 per dialog state: `Active/Hidden/SoldStatusActions/Premium` — primary Edit, secondary Premium, tertiary View + Open public, destructive Delete (subtle); `DeleteConfirm` — primary Delete (filled red), secondary Cancel; `NotPremium/CustomDate` — primary Save, secondary Cancel; `Premium/Saving` — primary Save, secondary Cancel, destructive Remove (subtle).

### Not done / limitations
- AC12 for `AdminListingsView` (finding above). Table scrolls below 1440.
- The AdminTable "before" screenshots were not captured: the previous `storybook-static` was overwritten by the rebuild and a checkout is not allowed. `60-admintable-*-after-1440.png` are the after set; the change is additive and omitted `width`/`wrap` forward `undefined`, so the other exports' DOM is unchanged.
- `AdminListingsTable.tsx` was not edited (outside the write set), so the `statusLabel` prop stays on the container as optional and unused.
- O78-12 re-issue (38 tuples) is owed to the owner; no tuple marked passed.

## Revision 3 — kickoff §18 (every Mantine table fits its production container)

**Status: `PARTIALLY IMPLEMENTED`** — R19–R30 implemented and measured; **R31 `BLOCKED — R31 BUDGET`** (see below). Evidence: `docs/sessions/evidence/task857/70`–`89` (`-r3`). Platform line `70-platform-r3.txt`: `win32 v22.22.3`.

### Requirements

| ID | Result | Evidence |
|---|---|---|
| R19 | `theme.other.layout.tableTitleColumnWidth: '12.5rem'` (type + value, provenance comment) | `theme.ts`; GR-0 EXTEND |
| R20 | `AdminTable`: `visibility` gains `'xxl'`; passes `cardsBelow="md"` | `AdminTable.tsx`; census-changed exit 0 |
| R21 | `AdminListingsView` columns: ID (xxl) · Listing (sticky, token width, `wrap`, 2-line title + dimmed meta line from one `metaLine` helper) · Price · Status (status + visibility stacked) · Date (xl); `calc(…)` gone | AC17 measurements |
| R22 | `WrappedTitleColumn`: token width via `useMantineTheme()`; status through `getListingStatusLabel` with the `cabinet` translator | `AdminTable.stories.tsx` |
| R23 | new `AdminPageFrame` (`width`, `gutter`, `centered`); ten `page.tsx` swapped; Story `Patterns/Mantine/AdminPageFrame` (six exports); enrolled in the manifest; catalog rows | `87-hash-object-r3.txt` |
| R24 | `withAdminShell` moved to `src/stories/_StoryAdminShell.tsx`; `AdminDashboardView.stories.tsx` imports it | |
| R25 | ten Stories render in `AdminShell` + the route's frame, no `StoryPageGutter`, `pathname` per route (`AdminUserProfileView`: `Create` → `/admin/users/new` + `form`, rest → `/admin/users/[id]` + `page`). `AdminCurrencyTabs` lists `withAdminShell` last (outermost) | `88-measurements-r3.json`, `89-receipts-r3.txt` |
| R26 | `AdminUsersTable`: user column (token width, wrap, phone as dimmed line), role + status stacked (header `col_status`), date from `xl`, % widths deleted, `cardsBelow="md"` on both tables. Final columns — users: user · status · date (xl) · actions; verified agents: agent (token width, wrap) · date · revoke | |
| R27 | `AdminExchangeProvidersView`: name (token width, wrap) + endpoint meta line, priority, mode + enabled stacked, notes from `xl`, actions; `cardsBelow="md"` | |
| R28 | `AdminPagesView`: title (token width, 2-line) + monospace slug line, status, updated (lg), actions; `cardsBelow="md"` | |
| R29 | `AdminReportsView`: reason · listing (token width, 2 lines, reporter meta line) · status + date stacked | |
| R30 | `AdminCurrenciesView`: symbol moved into the code cell (the button keeps `aria-label={code}`, so its accessible name is unchanged) | |
| R31 | **BLOCKED — R31 BUDGET** | below |

### R31 — `BLOCKED — R31 BUDGET`

Applied: % widths deleted, title at the token width (+ thumbnail, 2 lines), status + visibility stacked, then the kickoff's fallback — views, WhatsApp and form inquiries stacked in one right-aligned cell (icons `Eye`/`MessageCircle`/`Mail` at `iconSize.badge`, `aria-label`s from the existing column labels; new key `agt10_col_activity_counts` in sq/en/uk/it). It still scrolls. Per-column widths (uk, worst locale), `88-measurements-r3.json`:

| Viewport | Card | Title | Status | Expires | Counts | Last activity | Actions | Table | Overflow |
|---|---|---|---|---|---|---|---|---|---|
| 768 | 678 | 212 | 144 | 187 | 181 | 199 | 149 | 1071 | +395 |
| 1024 | 934 | 212 | 144 | 187 | 181 | 199 | 149 | 1071 | +139 |

Fits at 1280 and 1440 in every locale. Not fixed here: the next step is an owner/Opus layout decision (e.g. merge expires + last activity, or show one of them from `xl`). The Story already renders at production width and was left unchanged.

### Measurement (AC17–AC19)

`88-measure-r3.mjs` → `88-measurements-r3.json` (Playwright on the rebuilt `storybook-static`; no synthetic offset). 768/1024/1280/1440 × sq/en/uk/it; the card width is asserted against §18.2a (±1px). Result: every table except `AgentStatisticsView` @768/@1024 has no scroll, nothing clipped, first/last inset 24/24 (the card's 1px border excluded) and the production card width. Listings: title ≤2 lines; columns at 768/1024 are Listing·Price·Status, 1280 adds Date, 1440 adds ID. Below 768 (390) every table renders cards, the table is hidden, and the card insets are equal (21/21). Audit links compute to 14px. A first run mis-measured the first cell (the hidden ID column) and counted hidden cells as clipped; the script was corrected and the whole run repeated (`88-measurements-r3-run2.json` is the earlier file). AC18: the ten R25 Stories at 320/390/768/1024/1440 have frame paddings 24 (32 from 1024 for `responsive`) on all four sides, navbar 240 at 1440, content at 240 + the gutter; `grep StoryPageGutter` over the ten files prints nothing.

`calc(` grep over `AdminListingsView.tsx` and `AdminTable.stories.tsx`: nothing. Percentage-width grep over the seven table files: nothing.

### Receipts

GR-0 (EXTEND token, EXTEND `AdminTable`, CREATE `AdminPageFrame`, EXTRACT `withAdminShell`), GR-3a (CREATE `Patterns/Mantine/AdminPageFrame`) and GR-1 were emitted in the executor response. GR-1: census `71-census-r3.txt` — four FAIL lines, exactly the §3.1 calibration. GR-3b / 3c / 3d and TABLE FIT CHECK lines: `89-receipts-r3.txt`.

GR-2 SCOPE STATED — `check:design-tokens` inspects raw literals; it cannot see token arithmetic or a percentage width; AC17/AC19 are closed by the greps above. `check:story-coverage` inspects enrolled components; it cannot see where a Story renders; AC18 is closed by the Playwright measurement.

### Tests changed (every one listed)

- `AdminTable.adapter.test.tsx` — with `cardsBelow="md"` both trees are in the DOM; queries scoped to the table / the `hidden-from-md` cards box; cases 4–5 no longer stub `matchMedia`.
- `AdminUsersTable.smoke.test.tsx` — the mocked theme gains `layout.tableTitleColumnWidth`; the role badge is read from the stacked `status` cell (the `role` column is deleted).
- `AdminCurrenciesManager.smoke.test.tsx` — `rowOf` reads the table's row.

### Gates (exit codes in each `-r3` file)

typecheck 0 · lint 0 (135 pre-existing warnings) · story-coverage 0 · rendered-scope 0 · surface-census:changed 0 · design-tokens 0 · enrolled-tailwind 0 · i18n 0 · type-responsive 0 · file-integrity 0 · mojibake 0 · listing-visibility 0 · build-storybook 0 · build 0. `npm run test`: **4 failed / 2280 passed, in three files this revision does not touch** — `docs/sessions/evidence/task763/appimage-config-class-assertions.test.ts` (2), `scripts/__tests__/css-var-resolvability.test.ts` (1, `--width-content` added to `globals.css`, which is not in my diff), `scripts/__tests__/mantine-story-scope.test.ts` (1, `Admin/AdminUsersTable` title moved by Task 896). The touched files alone: `72b-tests-touched-r3.txt`, 12 files / 168 tests pass. Not fixed (out of scope).

### Limitations

- R31 blocked (above).
- `AgentStatisticsView` and `AdminTable` `WrappedTitleColumn` have TABLE FIT receipts; their GR-3b/3c/3d gutter receipts were not re-measured (decorators unchanged, outside R25).
- `AdminTable`'s `cardsBelow="md"` applies to the unedited legacy `AdminCompaniesManager`, `AdminPropertyTypesManager`, `AdminSupportManager`; no screenshots taken for them.
- Owner visual QA O78-12 (§18.8, 68 tuples) is owed and untouched; no tuple is marked passed.

## Revision 4 — kickoff §19 (R31: `AgentStatisticsView` cards to 1024, dates merged)

**Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.** Evidence: `docs/sessions/evidence/task857/92`–`99` (`-r4`). Platform line `92-platform-r4.txt`: `win32 v22.22.3`.

| ID | Result |
|---|---|
| R32 | `MantineDataTableToCards`: `cardsBelow` gains `'lg'` (same CSS `hiddenFrom`/`visibleFrom` switch at 1024, no `useMediaQuery`); JSDoc + header comment updated; `'sm'`/`'md'` branches untouched. `Mantine/Primitives/Table` gains `CardsBelowLg`. Measured (sq): `cards-below-lg` cards at 700/1000, table at 1024; `cards-below-md` cards at 700, table at 1000/1024; `default` table at 700/1000/1024 — as before the change |
| R33 | `AgentStatisticsView`: `cardsBelow="lg"`; `expires` + `activity` replaced by one `dates` column (`CalendarClock` + expiry, `Activity` + last activity, `role="group"` + `aria-label`s, no width/wrap); the three `counts` groups gain `role="group"`; columns title · status · dates · counts · actions; card config unchanged; the R31 "fallback" comment replaced by one citing §7.3 (b) and §19.1; new key `agt10_col_dates` (sq Datat / en Dates / uk Дати / it Date) |
| R34 | `AdminTable.tsx` JSDoc: the `'40%'` example replaced by `theme.other.layout.tableTitleColumnWidth` (comment only) |
| R35 | `99-receipts-r4.txt` — GR-3b/3c/3d for `AgentStatisticsView` `Default`, `WrappedTitleColumn` and `CardsBelowLg`, plus the rewritten `TABLE FIT CHECK` |

### AC20 (`98-measure-r4.mjs` → `98-measurements-r4.json`, `98-summary-r4.txt`)

- `AgentStatisticsView` `Default`, 1024/1280/1440 × sq/en/uk/it: cards 934/1190/1350 (±1), no scroll, nothing clipped, first/last inset 24/24 (card border excluded). **0 failures** of 12 cells. Headers in order in every locale: title · status · dates · counts · actions. The `dates` column did not overflow, so `BLOCKED — R33 BUDGET` does not apply.
- 390 and 768 (sq/uk): no visible `<table>`, 10 cards render.
- `dates` and `counts` cells: all five own groups have `role="group"` (`98b-aria-probe-r4.txt`). **Note for Opus:** each date line also contains the shared `RelativeTime`'s `<time aria-label>` (two per row). It has no role, so ARIA ignores its label — the same defect §19.3 R33 item 3 names. `RelativeTime` is outside the §19.5 write set; not changed. A literal reading of "every `[aria-label]` element in those cells has `role=group`" (`98-measurements-r4.json` `aria`, `all:false`) is therefore not met by those `<time>` elements. The label there duplicates the visible text.
- Greps: `key: 'expires'` / `key: 'activity'` in `AgentStatisticsView.tsx` — nothing; `'40%'` in `AdminTable.tsx` — nothing; `agt10_col_dates` in all four locale files (1 each).
- `check:i18n` exit 0.

### Gates (exit codes in each `-r4` file)

census `93`: four FAIL lines, the §3.1 calibration · typecheck 0 · lint 0 · story-coverage 0 · rendered-scope 0 · surface-census:changed 0 · design-tokens 0 · enrolled-tailwind 0 · i18n 0 · type-responsive 0 · file-integrity 0 · mojibake 0 · listing-visibility 0 · build-storybook 0 · build 0.

`npm run test`: **the first two parallel runs failed 42 and 47 tests, almost all `Test timed out in 5000ms`** (`94-tests-r4-loaded-first-run.txt`, `94-tests-r4.txt`), in files this revision does not touch. A `node` process unrelated to this task (PID 39052, ≈209 000 CPU-seconds) was saturating the machine. The identical suite run sequentially with a 60 s timeout (`npx vitest run --testTimeout=60000 --no-file-parallelism`, `94c-tests-full-sequential-r4.txt`) gives **4 failed / 2280 passed — exactly the four known failures** (`task763` appimage ×2, `css-var-resolvability`, `mantine-story-scope`). `94b`: the admin, cabinet and visibility test files alone — 24 files / 270 tests pass. No test selected the removed `expires`/`activity` columns; none was changed this revision.

### Limitations

- The `MantineDataTableToCards` pattern has no row in `docs/component-catalog.md`; no catalog edit was made (§19.5 names only an existing `cardsBelow` row).
- GR-3d `WrappedTitleColumn` bottom: the Story's content is shorter than the viewport, so the measured bottom value is the space under the content, not the gutter.
- Owner visual QA O78-12 (§19.7, 70 tuples) is owed; no tuple is marked passed.


## Revision 5 (kickoff §21) — text buttons stack, canonical radio is round

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` (Revision 5 only). Platform `win32 v22.22.3` (`102-platform-r5.txt`).

### Files changed
| Path | Reason |
|---|---|
| `src/components/admin/ListingPreviewDialogView.tsx` | R36: tertiary `Group wrap` of View/Open public → `Stack gap=xs align=flex-start` (`Group` import still used by the title and visibility badge) |
| `src/design-system/mantine/theme.ts` | R37: `Radio` entry `size: 'sm'` (20px) + `vars` `--radio-icon-size: 0.625rem` (10px dot); comment rewritten |
| `src/stories/mantine/primitives/Radio.stories.tsx` | R38: captions 16px→20px, 8px→10px only |
No test asserted the old radio size or the old `Group`; `input-chrome.css` and `PremiumDialogView.tsx` untouched.

### Evidence (`docs/sessions/evidence/task857/`)
- `103-measure-r5.mjs`, `103-measurements-r5.json`, `103-radio-crops-r5.png` (DPR-1, 10x pixelated), `104-receipts-r5.txt` (GR-0, 3a, 3b, 3c, 3d, 3e, 3f, 2).
- AC21: 36 dialog tuples (9 exports × sq/uk × 390/1440): no two text buttons share a row; left edges equal. AC22: `.mantine-Radio-radio` 20×20 and checked icon 10×10 at 320/390/1024/1440 (Radio Default) and 1440 (NotPremium); crops read as circles; grep over `src` for `--radio-size`, `--radio-icon-size`, `<Radio size=` prints only the theme entry.
- Gates (`102*-r5.txt`): census exit 1 = the four calibration FAIL lines · tests 4 failed / 2280 passed (the four known 790 failures: task763 ×2, css-var-resolvability, mantine-story-scope) · typecheck, lint, story-coverage, rendered-scope, census:changed, design-tokens, enrolled-tailwind, i18n, type-responsive, file-integrity, mojibake, listing-visibility, build-storybook, build all 0. Hashes `102s-hash-object-r5.txt`.
- file-integrity first failed on PowerShell-written BOMs in evidence files; stripped through Node (manifest: the three `102*` files named in the run) and re-run to exit 0.

### Limitations
- Focus/error/disabled Radio states were not re-measured; the theme change touches only size and dot.
- The checked crop for NotPremium comes from a probe that checks the first radio.
- Owner matrix O78-12 re-issued (§21.7, 72 tuples) is owed; no tuple is marked passed.

## Revision 6 (kickoff §22) — Radio focus border and disabled chrome follow §6g

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` (Revision 6 only). Platform `win32 v22.22.3` (`106-platform-r6.txt`).

### Files changed
| Path | Reason |
|---|---|
| `src/design-system/mantine/input-chrome.css` | R40: `.mantine-Radio-radio:not(:checked):not([data-checked]):not([data-error]):focus-visible` restores the brand border (the resting rule at (0,3,0) beat the plain focus rule); error keeps winning because it is excluded. R41: disabled radios render as their enabled state (white/gray-3 unchecked, brand-7 + white 10px dot checked) under the root's 0.5 fade; theme variables only, no `!important` |
| `src/stories/mantine/primitives/Radio.stories.tsx` | none this revision (R42: no caption contradicts the rendering); hash equals `102s` |
No test asserts the old radio chrome (only `scripts/check-css-var-resolvability.mjs` mentions `input-chrome`, and it passes except the known 790 snapshot test).

### Evidence (`docs/sessions/evidence/task857/`)
- `107-states-r6.mjs`, `107-measurements-r6.json`, `107-radio-states-r6.png` (DPR 1, 10x pixelated, 13 crops); `107-measure-r6.mjs` + `107-measurements-r6-ac21-22.json` (AC21/AC22 re-run); `108-receipts-r6.txt`.
- AC23: Default #3 keyboard focus border `rgb(236, 84, 71)` + ring; #4 error focus border `rgb(217, 45, 32)`; #7 and Saving-checked bg/border `rgb(236, 84, 71)`, icon 10x10 opacity 1 white, root opacity 0.5; #6 bg white, border gray-3, root 0.5; #1, #2, #5, #8 unchanged vs `105b`. AC21/AC22 still hold.
- Gates (`106*-r6.txt`): census exit 1 = the four calibration FAIL lines; tests 4 failed / 2280 passed (the four known 790); typecheck, lint, story-coverage, rendered-scope, census:changed, design-tokens, enrolled-tailwind, i18n, type-responsive, mojibake, listing-visibility, build-storybook (`106p`), build, file-integrity all 0. Hashes `106s-hash-object-r6.txt`.

### Limitations
- The `focus` crop of radio #3 is taken after a keyboard Tab; a mouse-focus state was not re-measured (rule unchanged).
- Owner matrix O78-12 (§21.7 plus `PremiumDialogView` `Saving` × sq × 390/1440, §22.7) is owed; no tuple is marked passed.

## Revision 7 (kickoff §24) — the two dialogs on the canonical dialog anatomy (§23.7)

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` (Revision 7 only). Platform `win32 v22.22.3` (`111-platform-r7.txt`, `112-platform-r7.txt`). Receipts: `116-receipts-r7.txt`.

### Files changed
- `MantineModal.tsx` (`structured`, `description`, `icon`; compound `Modal.*` header with a pinned divider, a sticky footer with a full-bleed divider, pill close button) and `responsiveBottomSheet.tsx` (`header` prop; the structured sheet uses its existing pinned footer).
- New patterns with own Stories, enrolled in `scripts/mantine-migration-scope.json` and exported from `patterns/index.ts`: `MantineDialogSections`, `MantineDetailList`, `MantineNavRowList` (+ `.module.css`), `MantineDialogFooter`.
- `theme.ts` `RadioCard` and `RadioIndicator` entries; `input-chrome.css` card checked, focus and disabled chrome.
- Stories: `Modal` `Structured`, `Radio` `Card`, four new pattern Stories, both dialog Stories (fixtures, `NoPhotoNoFeatures`, `PremiumActive`).
- `ListingPreviewDialogView.tsx`, `PremiumDialogView.tsx`, `PremiumDialog.tsx` (passes `premiumUntil`), `AdminListingsTable.tsx` (type only), `src/app/admin/listings/page.tsx` (select only), `messages/{sq,en,uk,it}.json` (4 keys), smoke test (T6 premium row, new T9 select test). `ListingPreviewDialog.tsx` needed no change (the View maps the listing).
- Owner message during the revision: header and footer stay visible (sticky), canonical spacing, no hardcoding. Done with Mantine's sticky header, a sticky footer and the sheet's pinned footer; spacing is `--mb-padding` with the `md` key as fallback.

### Evidence
`113-unstructured-hash-r7.json` (Modal Default and ReportDetailDialogView DOM hashes identical before/after, 4/4), `114-measure-r7.mjs` / `114-measurements-r7.json`, `114b-type-gutter-r7.*`, `114-*.png` screenshots, `115-circles-r7.png`, `117-navrow-focus-r7.json`, gates `112*-r7.txt`, hashes `112s-hash-object-r7.txt`.

### Deviations to note
- ThemeIcon `size="xl"` (R44) is 44px; §23.7 prose says 40px. The theme key was used.
- The close button uses `radius="pill"` and `size="input-sm"` (36px): `radius="xl"` computed 12px and drew a rounded square (GR-3f).
- A premium listing with no `premium_until` reads "Not premium" (data quirk, per §24.8); the `Premium` Story shows it, `PremiumActive` shows the date.
- Status badge colours on the listing card are a local map of theme colour names (`STATUS_BADGE_COLOR` in the View), following the closed-state colours `ListingCard` uses.
- Unused i18n keys after the rebuild: `premium_set`, `premium_change` (no live caller now); not deleted.

### Gate results (final, after the last edit)
Census exit 1 = the four calibration FAIL lines; tests 4 failed / 2281 passed (the four known 790); typecheck, lint, story-coverage, rendered-scope, census:changed, design-tokens, enrolled-tailwind, i18n, type-responsive, file-integrity, mojibake, listing-visibility, pattern-enrolment, build-storybook, build all 0. (A first run had `check:design-tokens` exit 1 on a raw `zIndex: 1`; removed and the whole block re-run.)

### Limitations
- Owner matrix O78-12 (98 tuples, §24.11) is owed; no tuple is marked passed. Opus re-measures GR-3b/3c/3d/3e/3f and §7.3 and compares with `110-ref-*`.
- Dialog sticky behaviour was checked from screenshots at 1440 and 390 with overflowing content; no scroll-position measurement.
- Mouse-focus states of the new cards were not measured.


## Revision 8 (kickoff §25) — the listing card leaves the preview dialog

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` (Revision 8 only). Platform `win32 v22.22.3` (`118-platform-r8.txt`, `119-platform-r8.txt`). Receipts: `121-receipts-r8.txt`.

### Files changed
- `ListingPreviewDialogView.tsx` (R56): the `MantineListingCardPattern` section, the cover/features/badge mapping, `STATUS_BADGE_COLOR` and their imports are removed; sections are now status, details, nav rows.
- `src/app/admin/listings/page.tsx` (R57): the select keeps `premium_until` and drops the Revision 7 card columns, `location:locations(name_al)` and `images:listing_images`. `AdminListingsTable.tsx`: `AdminListing` keeps only `premium_until` of the Revision 7 fields (the card-only fields had no other reader, by grep). `ListingPreviewDialog.tsx` needed no change.
- Smoke test T9 (R57): asserts `premium_until` present and `listing_images` absent; comments updated (18/18 pass).
- `ListingPreviewDialogView.stories.tsx` (R58): `NoPhotoNoFeatures`, the cover/feature fixture fields and the location override are deleted; `typeLabel` uses a `{ value, label }` list built from the `listing.property_type_*` messages, as `AdminListingsTable.tsx` does with `usePropertyTypes`. `PremiumDialogView.stories.tsx` is unchanged.
- `MantineNavRowList.module.css` (R59): the ring uses the canonical `brand-5` 10% expression of `input-chrome.css:25`, inset, on gray-0; comment corrected.

### Evidence
`120-measure-r8.mjs` / `120-measurements-r8.json` (AC31 on 20 tuples; AC32 at 1440x900: `scrollHeight` 765 <= `clientHeight` 765 for Active and Premium, sq and uk), `122-navrow-focus-r8.png`, `120-active-1440-r8.png`, gates `119*-r8.txt`, hashes `119s-hash-object-r8.txt`, receipts `121-receipts-r8.txt`.

### R59 ring
My crop showed the canonical 10% ring on gray-0 as a faint hairline, so I reported it instead of choosing another value. The owner then checked with Tab on 2026-10-03 and wrote: "я перевірив кнопкою Tab - все ок, візуально видно де я". Recorded as the owner's observation; I kept the canonical value.

### Gate results
Census exit 1 = the four calibration FAIL lines. Typecheck, lint, story-coverage, rendered-scope, census:changed, design-tokens, enrolled-tailwind, i18n, type-responsive, mojibake, listing-visibility, pattern-enrolment, build-storybook and build all 0. Deviations from the expected block:
- **Tests: 5 failed / 2295 passed.** The four known 790 failures plus `overlay-dual-declaration` invariant 3, which reads `.next/static/css` and found it missing while the tests ran (before this run's own build; another process was building or cleaning `.next`). Re-run alone after the build: 6/6 pass.
- **`check:file-integrity` exit 1** on `docs/sessions/evidence/task917/20-review-gates.txt` (stray BOM). That file belongs to another task, was written at 00:23 by another session, and is outside the 857 write set; I did not touch it. No 857 file is flagged.
- **i18n gate naming:** my rename pattern missed `i18n`, so that gate's output overwrote `112k-i18n-r7.txt` (same gate, exit 0, parity 2563 keys, same result as Revision 7). A copy is saved as `119k-i18n-r8.txt`.

### Limitations
- Owner matrix O78-12 (20 tuples, §25.8) is owed; no tuple is marked passed. Opus re-measures GR-3b/3c/3d/3e and AC32.
- AC32 was measured at 1440x900 only; at 390 the sheet still scrolls by design (§25.2).


## Revision 9 (kickoff §26) — the nav row focus is visible; the Story follows the status choice

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` (Revision 9 only). Platform `win32 v22.22.3` (`124-platform-r9.txt`, `126-platform-r9.txt`). Receipts: `127-receipts-r9.txt`. Hashes: `126s-hash-object-r9.txt`.

### Files changed
- `MantineNavRowList.module.css` (R61): `.row[data-nav-row]:focus-visible` is `box-shadow: inset 0 0 0 1px var(--mantine-color-brand-7), inset 0 0 0 4px color-mix(in srgb, var(--mantine-color-brand-5) 10%, transparent)` on the gray-0 background, the canonical card focus of `input-chrome.css:305-309` drawn inset. Hover and mouse focus are unchanged.
- `ListingPreviewDialogView.stories.tsx` (R63): `DialogDemo` holds the listing in `useState`; `onStatusChange` sets `status`, as `AdminListingsTable.tsx` does after the action resolves. No other export changed.
- `AdminListingsTable.smoke.test.tsx` (R64): T4 also asserts the dialog's status textbox shows the sold label (18/18 pass).
- `AdminListingsTable.tsx`: temporary plant only; final hash `c12a3b26be26c4260433a852d194539ee0141096`, equal to the required value.

### Evidence
`125-measure-r9.mjs`, `125-navrow-focus-r9.{json,png}` (AC35), `129-story-status-r9.{json,png}` (AC37), `128-plant-t4-dialog-r9.txt` (plant with hash witnesses), gates `126*-r9.txt`, `126-run-gates-r9.mjs`.
- AC35: Tab on row 1 gives brand-7 `rgb(236, 84, 71)` in the box-shadow; the 1px line reads that colour on all four sides, contrast 3.39:1 against gray-0 (>= 3:1); mouse click on row 3: none; hover: gray-0 background only.
- AC37: `Active`, sq, 1440: the select goes from "Aktiv" to "Shitur" and the toast "Statusi u përditësua" appears.
- Plant: removing `setPreviewListing(...)` fails only the new T4 assertion ("expected 'Active' to be 'Sold'"); restored, 18/18.

### Gate results (final, after the last edit)
Census exit 1 = the four calibration FAIL lines. Typecheck, lint, story-coverage, rendered-scope, census:changed, design-tokens, enrolled-tailwind, i18n (`126k`), type-responsive, file-integrity (423 files clean), mojibake, listing-visibility, pattern-enrolment, build-storybook and build all 0. Tests (run after the build, as §26.5 says): 4 failed / 2304 passed, exactly the four known 790 failures.
- A first run had `check:design-tokens` exit 1: the rule declares two distinct raw lengths (1px and 4px) and the gate wants one marker per distinct value, so I added a second `design-tokens-allow` marker. The CSS value is exactly R61's; no `BLOCKED — R61 TOKEN`.
- Revision 8's note about the owner check: the owner's "я перевірив кнопкою Tab - все ок, візуально видно де я" was written in the executor session, not in Opus's. On measurement the 10% halo alone was 1.1:1 on gray-0, so R61 adds the border regardless.

### Limitations
- Owner matrix O78-12 is owed for 2 tuples (§26.6, §26.7): `NavRowList` `Default` sq 1440 Tab onto row 1, and `ListingPreviewDialogView` `Active` sq 1440 choose Sold. No tuple is marked passed.
- Contrast was measured on the row's edge pixel at DPR 1 against gray-0 only, not against the white list behind it.


## Revision 10 (kickoff §28) — a rounded clip never cuts a line (GR-3g)

Status: `PARTIALLY IMPLEMENTED` (Revision 10 only). Platform `win32 v22.22.3` (`132-platform-r10.txt`, `135-platform-r10.txt`). Receipts: `134-receipts-r10.txt`. Hash: `135s-hash-object-r10.txt` (before `d74ea9934bba0dddad2b1e8b5d3648da0163d5ca`, after `2eeceb367150f2dfab78a63e6f9579d902c90c64`).

### Files changed
- `src/design-system/mantine/patterns/MantineNavRowList.module.css` (R65): `.row[data-nav-row]:first-child` takes `border-top-left/right-radius: var(--paper-radius)`, `:last-child` the two bottom ones; header comment cites GR-3g. Focus value, hover and the list's radius/border/clip are unchanged. No other file was changed.

### Evidence
- AC38 (`132-measure-r10.{mjs,json}`, `132-navrow-corners-r10.png`, DPR 1, sq): row 1 tl/tr 6px and row 3 bl/br 6px = the list's 6px, row 2 all 0px; the 10x crops of every corner of every focused row show the brand line running around the outer curves, in `NavRowList` `Default` 1440 and in `ListingPreviewDialogView` `Active` at 1440 and 390. AC35 holds: brand-7 in the box-shadow, minimum edge contrast 3.39:1, click draws nothing, hover is gray-0 only. One-row list (`137-single-row-r10.*`): all four corners 6px.
- AC39 (`133-gr3g-probe-r10.{mjs,json}`): 12 Stories x 390/1440, rest + hover on first/last row + Tab through every focusable. 6 cut corners, none in `MantineNavRowList`: the `thead` top line of the TailAdmin table at the Paper's tl/tr corners (Paper radius 16px, `overflow: hidden`) in `AdminTable` `Default`, `AdminListingsView` `Default`, `Mantine/Primitives/Table` `Default`, at 1440. Pixels in `136-thead-corner-r10.png`, `136b-thead-corner-amplified-r10.png`, `136b-thead-pixels-r10.json`: the header's 1px `gray-1` top line (`MantineDataTableToCards.tsx:523`) ends diagonally where the curve cuts it. Not fixed: the table is `border-collapse: collapse`, where a radius on `thead` has no effect, and every fix changes the design (drop the top line, `border-collapse: separate`, or move the line onto the first/last `th`). `BLOCKED — GR-3g MantineDataTableToCards`, Opus decides.
- The first probe version flagged 16 corners; the geometric version (element's own corner curve against the clip's padding-box curve) clears the modal footer buttons and the SegmentedControl, leaving the 6 above.

### Gate results (`135-run-gates-r10.mjs`, `135*-r10.txt`, after the last edit)
Census exit 1 = the four calibration FAIL lines. Typecheck, story-coverage, rendered-scope, census:changed, enrolled-tailwind, i18n (`135k`), type-responsive, file-integrity, mojibake, listing-visibility, pattern-enrolment, build-storybook, build = 0. Tests (after the build): 4 failed / 2304 passed, exactly the four known 790 failures.
- `check:design-tokens` = 1: the four `var(--paper-radius)` lines are `css-undefined-var` (`scripts/check-design-tokens.mjs:864-865` knows `--tw-`, `--mantine-` and two names; `--paper-radius` is a Mantine runtime variable). GR-3g and R65 require that exact token and that script is outside the §28.6 write set. Proposed: add `--paper-radius` and `--card-radius` to `EXTERNAL_VAR_EXACT_NAMES`. Not edited.
- `lint` = 1: 4 `no-require-imports` errors, all in `docs/sessions/evidence/task912/rv2-opus-probe.cjs` (not task857).

### Limitations
- Status is `PARTIALLY IMPLEMENTED`: one gate red on R65's mandated token, and R66 stops at `BLOCKED — GR-3g`. No tuple is marked passed; the owner tuple `NavRowList` `Default` Tab (§28.7) stays owed after Opus decides both points.
- The probe measures geometry from computed styles and boxes; the visual check of the one reported case is the amplified crop. Hover on the table is one row each (first/last).

## Revision 11 (kickoff §29) — the token gate learns `--paper-radius`; the table header drops its top line when flush (D78-11, GR-3g)

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` (Revision 11 only). Platform `win32 v22.22.3` (`138-platform-r11.txt`, `141-platform-r11.txt`). Receipts: `140-receipts-r11.txt`. Hashes: `141s-hash-object-r11.txt`.

### Files changed
- `scripts/check-design-tokens.mjs` (R68): `'--paper-radius'` added to `EXTERNAL_VAR_EXACT_NAMES` with a provenance comment (Mantine `Paper.css`, forced by `MantineNavRowList.module.css`). `--card-radius` not added.
- `scripts/__tests__/check-design-tokens.test.ts` (R68): two §H arms (`--paper-radius` not flagged, `--paper-radiusx` flagged).
- `src/design-system/mantine/patterns/MantineDataTableToCards.tsx` (R69): `thead` `borderTop` set only when `tableHeader` is present (same value); comment updated to cite D78-11 / GR-3g. Hash before `ec9758d2de85553dd239b37434d55cce4e138dc8`, after `f060e58c8fc174c2db4e398b1a398bf9535d5db1`. The file also carries Revision 3's earlier uncommitted `cardsBelow="lg"` change.
- `src/design-system/mantine/patterns/__tests__/MantineDataTableToCards.thead.test.tsx` (R70, new): both branches; `ResizeObserver` stubbed for `ScrollArea`.

### Evidence
- AC41 (`142-design-tokens-arms-r11.txt`): red first with the script unchanged: 1 failed / 156 passed, only the `does NOT flag var(--paper-radius)` arm; green after the edit: 157/157 including the `--paper-radiusx` control; `npm run check:design-tokens` exit 0, no `css-undefined-var` line.
- AC42 (`143-plant-thead-r11.{mjs,txt}`, Node I/O): before `f060e58c…`, planted `264de159…` (unconditional `borderTop`), restored `f060e58c…` (equal). Planted run: 1 failed / 1 passed, only the "without `tableHeader`" arm; restored: 2/2.
- AC43 (`138-gr3g-probe-r11.{mjs,json}`, `133` unchanged except the output name): 12 Stories x 390/1440, `cutCorners: 0`. `139-thead-corners-r11.{mjs,json,png}`: tl/tr crops (DPR 1, 10x) of `AdminTable`, `AdminListingsView`, `Mantine/Primitives/Table` `Default` at 1440 show the card's curved border only, no line under it, gray-0 fill inside the curve; `theadFlushWithCardTop` true in all three.
- Consumers of `MantineDataTableToCards` (each loses the doubled top line at desktop width): `AdminCurrenciesView`, `AdminExchangeProvidersView`, `AdminPagesView`, `AdminTable`, `AdminUsersTable`, `MantineAdminSurfacePattern`, `MantineCountButton`, `AgentStatisticsView` (full list in `140`).

### Gate results (`141-run-gates-r11.mjs`, `141*-r11.txt`, after the last edit)
Census exit 1 = the four calibration FAIL lines. Design-tokens, typecheck, story-coverage, rendered-scope, census:changed, enrolled-tailwind, i18n, type-responsive, file-integrity, mojibake, listing-visibility, pattern-enrolment, build-storybook, build = 0. Lint = 1: 4 `no-require-imports` errors, all in `docs/sessions/evidence/task912/rv2-opus-probe.cjs`. Tests (after the build): 4 failed / 2308 passed (Revision 10: 2304), exactly the four known 790 failures.

### Limitations
- No tuple is marked passed. Owed to the owner (§29.7): `NavRowList` `Default` (Tab, first then last row), `AdminListingsView` `Default` table card top corners, `Mantine/Primitives/Table` `Default` top corners, all sq 1440.

## Revision 12 (kickoff §31, owner D78-12) — the table header is white everywhere

Platform `win32 v22.22.3` (`146-platform-r12.txt`). Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.

### Changes
- `MantineDataTableToCards.tsx` (R73): the sticky column's header cell uses `stickyProps(idx, 'var(--mantine-color-body)')`, the token of the sticky body cell; `backgroundColor: gray-0` is removed from `styles.thead`; a comment cites D78-12. Hash `67cf1a2e…`.
- `MantineDataTableToCards.thead.test.tsx` (R74): two arms added. The sticky `th` arm (project theme) expects `background` = `var(--mantine-color-body)`. The second arm renders with the project theme minus its `Table` entry and expects no component-set `thead` background. Hash `5dcadb4e…`.

### Evidence
- Red first (`147r-red-r12.txt`): 1 failed / 2 passed (received `var(--mantine-color-gray-0)`). Green (`147g-green-r12.txt`): 4/4.
- AC45 plant (`146-plant-sticky-th-r12.{mjs,txt}`, Node I/O): before `67cf1a2e…`, planted `2f85be40…` (`gray.0` back on the header cell), restored `67cf1a2e…` (equal). Planted: 1 failed / 3 passed, only the sticky `th` arm; restored 4/4.
- AC46 (`147-thead-bg-r12.{mjs,json}`): every header cell in all four Stories computes `rgb(255, 255, 255)`, the sticky one included. `147b-sticky-scroll-1024-r12.json`: `StickyColumn` at 1024 scrolled to the end, the sticky `th` stays `sticky`/`left 0`/`rgb(255, 255, 255)`, the sticky `td` is the body token, and `elementFromPoint` at the `th` is the `th`. `148-thead-bg-r12.png` (1x): one white header row in `AdminListingsView` `Default` and `Primitives/Table` `StickyColumn`.
- AC47: receipts in `149-receipts-r12.txt`, hashes in `150s-hash-object-r12.txt`, `npm run build` exit 0.

### Gate results (`150-run-gates-r12.mjs`, `150-summary-r12.txt`)
Census exit 1 = the four calibration FAIL lines. Design-tokens, typecheck, story-coverage, rendered-scope, census:changed, enrolled-tailwind, i18n, type-responsive, file-integrity (562 clean), mojibake, listing-visibility, pattern-enrolment, build-storybook, build = 0. Lint = 1: 4 `no-require-imports` errors, all in `docs/sessions/evidence/task912/rv2-opus-probe.cjs`. Tests (after the build): 4 failed / 2310 passed, exactly the four known 790 failures.

### Limitations and reported items
- R74 contradiction: `theme.ts`'s `Table` entry (forbidden to touch) still sets `thead.backgroundColor: gray-0`, so under the project theme the `thead` keeps an inline gray-0 (dead paint, covered by the white `th`s). R74 is split in two arms accordingly (`149`). Removing the theme entry is for Opus.
- `145-opus-thead-bg.json` (untracked, Opus's) was overwritten by my first `147` run (output name not renamed); it now holds the post-Revision-12 measurement. Script fixed, rerun to `147-thead-bg-r12.json`. Opus can regenerate `145` if the pre-change numbers are wanted.
- No tuple is marked passed. Owed (§31.7): `AdminListingsView` `Default` header row white (sq, 1440); `Primitives/Table` `StickyColumn` header white while scrolled (sq, 1024).
