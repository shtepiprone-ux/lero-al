# Storybook story de-duplication — before/after inventory (Task 468)

**Date:** 2026-06-20 (CANDIDATE) → 2026-06-22 (EXECUTED) · **Author:** orchestrator (Opus) / executor (Sonnet 4.6) · **Status:** ✅ **FINAL / EXECUTED** — all Group 6 and Group 10 three-way verdicts resolved; execution completed 2026-06-22. Kickoff: `tasks/kickoff_prompt_Task_468_StorybookStoryDedup_CanonicalGrouping_BlockingGate.md`. Session log: `docs/sessions/2026-06-22-task468-storybook-story-dedup.md`.
**Method:** `Glob('**/*.stories.tsx')` + `grep '^export const'` + targeted greps on the live tree (no cherry-picking). Counts supersede `docs/responsive-storybook-inventory.md` §1/§7 (Task-412 snapshot: 43 files / 248 index entries).
**Revision:** v5 (2026-06-20) — v2 corrected v1 lumping errors (file/width/Tablet/locale-pin/ASSERT counts) + added the bare-viewport group; v3 reclassified the 16th pin as `args.locale` + corrected the coverage model; v4 added the three-way classification (`RESPONSIVE_PROOF_DUPLICATE`) + file-scoped allowlist + identifier-token gate; v5 corrected the forbidden-name count to 24 / Group 10 = 15 candidates (12 unallowlisted) + propagated three-way logic into flow/AC + scoped `eslint.config.mjs`.

> **🔢 GATE-NUMBERING SUPERSEDED BY KICKOFF v6 (2026-06-22) — READ THIS FIRST.** This report predates kickoff amendment v6 and still uses the draft numbering "Check 11 / Check 12" for the NEW checks. That numbering is **WRONG and superseded**: the LIVE `scripts/check-stories.mjs` already ends at **Check 11** (`sm:flex-row sm:flex-wrap` toolbar). The kickoff (the single source of truth) is authoritative. Translate every reference in this report as follows: **"Check 11" here = the NEW Check 12** (viewport/width identifier-token); **"Check 12" here = the broadened Check 4** (locale pins+props); plus kickoff v6 adds a **broadened Check 3** (locale-NAME export families `Uk*/Sq*/It*/En*/Ukrainian*/…`) and a **new Check 13** (`Proof*/Demo*/Filtered*/Canonical[0-9]*` family names, only `AdminListingsTable/FilteredPending` allowlisted). `runGate` returns `checksRan: 13`. Where this report and the kickoff disagree on numbering, **the kickoff wins.** The dedup counts/groups/three-way verdicts below are unchanged.

## 1 — Headline (verified)

| Metric | Before | After (executed) |
|---|---|---|
| Story files | **56** (`PlantedVisualViolations` = gate fixture → 55 in scope) | **56** (unchanged) |
| Story exports | **283** | **237** (−46; invariant = ZERO forbidden viewport/width-token names) |
| `ListingDetailView` exports | **14** | **3** |
| Numeric width-suffixed exports | **36** | **0** |
| Non-numeric viewport-named exports that FAIL Check 12 | **24** | **0** |
| Hardcoded-locale instances | **16** (15 `globals.locale` + 1 `meta.args.locale:'uk'`) + **1** `meta.args.locale:'en'` (LDV, fixed in rework) | **0** |
| `ASSERT_STORIES` IDs | **98** (kickoff said 94; actual baseline = 98 due to 4 additional Task 467 planted stories: AmbiguousOverlap, ContainerEscape, UnstyledFrame, IntentionalEllipsis added in V3/V4 after kickoff count was locked) | **80** (−18: LDV −11, RM −4, Perms −3; kickoff target was 76 from stale 94 baseline) |
| Width-suffixed `ASSERT_STORIES` IDs | **23** (LDV 11 + RM 9 + Perms 3) | **0** |
| `checksRan` | **11** | **13** |
| Gate violations | 0 (Checks 1–11) | 0 (Checks 1–13) |
| Tests | 53 | **86** |
| Stale/phantom ASSERT IDs | — | **0 stale / 0 phantom** (verified `⊆ storybook-static/index.json`) |

## 2 — Why these are duplicates (confirmation logic)

**Corrected coverage model (do not overstate):** the Storybook **toolbar** lets a reviewer inspect ANY story at all 14 viewports × 4 locales — so per-width/per-locale exports add no inspection capability. **Automatic machine coverage is narrower:** only `ASSERT_STORIES` run the full **14 × 4**; every other story runs in Task 467 Phase 2 (geometry-only) at **{320,375,390} × 4 locales, non-`--fast` only**. A width/locale-pinned export is therefore covered either by the toolbar (manual) or by its canonical sibling at the same cell — never the sole coverage source. Each candidate gets one of **three verdicts**: **`PURE_DUPLICATE`** (`args`/`render`/anchor identical + screenshot-hash equal at the same viewport + same _effective rendered locale_ — the duplicate's effective locale, e.g. `uk`, vs canonical at `uk`, NOT nominal) → DELETE; **`RESPONSIVE_PROOF_DUPLICATE`** (render differs only in story-wrapper responsive classes / per-viewport fixture count, no distinct state — e.g. `ListingGrid` Desktop/HugeDesktop/Mobile) → consolidate the responsive proof into ONE responsive canonical and DELETE the variants; **`REAL_MODE`** (genuine distinct state/interaction) → KEEP or RENAME (no viewport/width token). The 2-way rule was insufficient: `ListingGrid` variants have different render functions yet are not real modes — they need the `RESPONSIVE_PROOF_DUPLICATE` path to be removed rather than merely renamed.

Worked example — `ListingDetailView`: the 9 `*Mobile320/375/390` siblings carry byte-identical `args` to their canonical and add `globals.viewport` + `locale:'uk'`; `Tablet768`/`Desktop1440` add only a viewport pin. Three real modes (public / staff-unpublished / staff-published) had been fanned out to 14 exports.

## 3 — Groups (before → after)

| # | File(s) | Before | After | Action |
|---|---|---|---|---|
| 1 | `ListingDetailView` | 14 | 3 | delete 11 width-suffixed |
| 2 | `NotificationItem` | 5 | 3 | delete `AllCasesMobile320/375` |
| 3 | `NumInputField` | 4 | 1 | delete `FloorsTotalMobile320/375/390` (3 locale pins) |
| 4 | `AdminSupportManager` | 8 | 4 | delete `Tablet` + `UserCardStatusBadgesMobile320/375/390` (3 locale pins) |
| 5 | `AdminListingsTable` | 7 | 6 | delete `Tablet`; rename `VisibilityMobile320`→`Visibility` |
| 6 | `ListingsTab` ✅ | 2 | 1 | **PURE_DUPLICATE** — `VisibilityMobile320` has zero args override, identical render to `Default`; only viewport pin differs → deleted |
| 7 | bare `Tablet` family (11 files) | — | — | delete `Tablet` in Currencies/Companies/Exchange/EmailTemplates/Settings/PropertyTypes/UserProfile/UsersTable (+ListingsTable g5, +Support g4, +Reports g8) |
| 8 | `AdminReportsManager` | 16 | 6 | delete `Tablet`; collapse `DialogOwnerRow_*`(5→1), `FullManagement_*`(3→1), `TerminalReopen_*`(3→1), `DeleteConfirm_*`(3→1); **remove `meta.args.locale:'uk'` → toolbar-reactive** |
| 9 | `AdminPermissionsManager` | 4 | 1 | delete `Mobile320/375/390` |
| 10 | non-numeric viewport-named ✅ | 15 | resolved | **Executed:** ListingGrid Desktop/Mobile/HugeDesktop = RESPONSIVE_PROOF_DUPLICATE → consolidated `Default`; RVS/HugeDesktop = RESPONSIVE_PROOF_DUPLICATE → deleted; RVS/MobileScroll = REAL_MODE → keep; AdminSidebar/Desktop = REAL_MODE → renamed `CollapsedRail`; FilterBar TabletStack/MobileStack/AllLocalesDesktop = RESPONSIVE_PROOF_DUPLICATE → deleted; button MobileSafe = REAL_MODE → renamed `TouchSafe`; button ControlRowRhythm_Desktop = REAL_MODE → renamed `ControlRowRhythm_Inline`; input/MobileForm = REAL_MODE → renamed `PhoneForm`; EmptyState/MobileEmptyState = RESPONSIVE_PROOF_DUPLICATE → deleted; tabs/MobileScroll = REAL_MODE → keep |
| 11 | `ASSERT_STORIES` | 98 (actual; kickoff said 94) | 80 (−18) | LDV 14→3, RM 9→5, Perms 4→1, `listinggrid--desktop`→`--default`; **0 stale / 0 phantom**. Count 80 not 76: Task 467 V3/V4 added 4 planted stories (AmbiguousOverlap, ContainerEscape, UnstyledFrame, IntentionalEllipsis) after the kickoff's 94 baseline was locked; delta (−18) is correct |
| 12 | blocking gate | checks 1–11 | 1–13 | **(v6 numbering)** new **Check 12** (identifier-token viewport/width names vs **file-scoped** `{file,export,reason}` allowlist + stale-entry) + new **Check 13** (`Proof/Demo/Filtered/Canonical` family names, same allowlist; only `FilteredPending` allowed) + broadened **Check 4** (locale `globals` pins **and** `args.locale`/`locale="…"` props; multiline/key-order/all-locale) + broadened **Check 3** (locale-NAME export families); scan `.stories.{ts,tsx}`; `checksRan: 13` |

## 4 — Canonical kept set (one story per real mode)

- **ListingDetailView (3):** `PublicListing`, `StaffPreviewUnpublished`, `StaffPreviewPublished`.
- **NotificationItem (3):** `AllCases`, `PriceChangeUnread`, `SavedSearchMatchUnread`.
- **NumInputField (1):** `FloorsTotal`.
- **AdminSupportManager (4):** `Default`, `EmptyState`, `LocaleStress`, `UserCardStatusBadges`.
- **AdminListingsTable (6):** `Default`, `FilteredPending`, `LocaleStress`, `Visibility`, `VisibilityAuditZero`, `PreviewDialogSoldStatusActions`.
- **AdminReportsManager (6):** `Default`, `LocaleStress`, `DialogOwnerRow`, `FullManagement`, `TerminalReopen`, `DeleteConfirm`.
- **AdminPermissionsManager (1):** `Default`.
- **Tablet family:** each loses `Tablet`.
- **Group 10 (executed):** `ListingGrid`→`Default`+`LocaleStress`/`OldPriceWrap`/`CurrencyUSD` (Desktop/HugeDesktop/Mobile consolidated into Default); `RecentlyViewedSection` HugeDesktop deleted, `MobileScroll` kept (allowlisted); `AdminSidebar` Desktop→`CollapsedRail`, `MobileDrawerOpen` kept (allowlisted); `FilterBar` TabletStack/MobileStack/AllLocalesDesktop deleted; `button` MobileSafe→`TouchSafe`, ControlRowRhythm_Desktop→`ControlRowRhythm_Inline`; `input` MobileForm→`PhoneForm`; `EmptyState` MobileEmptyState deleted; `tabs/MobileScroll` kept (allowlisted).

Viewport (320…2560) and locale (sq/en/uk/it) coverage for all kept stories comes from the harness loops + the Storybook toolbar — not from per-width/per-locale exports.

## 5 — Stale-ID risk + proof plan

Deleting/renaming a width export orphans any `ASSERT_STORIES` entry that targets its generated ID. Affected: ListingDetailView 11 width IDs → removed (3 canonical keep anchor `listing-detail-view`); AdminReportsManager 9 width IDs → 5 mandatory scenario IDs carrying the dual anchors; AdminPermissionsManager 4 → 1; `system-listinggrid--desktop`→`--default`. The `--tablet`/`UserCardStatusBadges*`/`FloorsTotal*`/`AllCases*` generated IDs are **not** in `ASSERT_STORIES` (only each file's `--default`) → no ASSERT orphan, but the executor re-derives the orphan set programmatically rather than relying on this table.

**Proof (executed):** `npm run build-storybook` succeeded; `ASSERT_STORIES.id ⊆ storybook-static/index.json` = **80 IDs, 0 stale, 0 phantom** (80 not 76 due to Task 467 planted stories; see §1). Native (owner PowerShell) re-run is the authoritative verdict.

## 6 — Sequencing (owner P0, 2026-06-20). Break the cycle in order:

1. **Task 463 functional code FROZEN + reviewed.** Until then Task 468 does NOT start (no partial subset).
2. **Task 468 atomic** — all groups + `ASSERT_STORIES` + broadened Checks 3/4 + new Checks 12/13 (v6 numbering) at zero baseline, one change.
3. **Task 467 REWORK** — against the final taxonomy.
4. **Full rendered-proof + final Task 463 closure.**

No `screenshots:assert` matrix produced during Task 468 is authoritative (harness keeps the Task-464 false-negative until 467).

## 7 — Gate (v6 numbering: broaden Checks 3 & 4, add Checks 12 & 13), zero baseline

> v6 numbering aligns with the LIVE `check-stories.mjs` (which already ends at Check 11). The kickoff is authoritative; this section is restated to match it.

- **Check 12 (NEW) — viewport/width-named exports (identifier-token rule)** *(was "Check 11" in pre-v6 wording)*. Split the export name into identifier segments (PascalCase + `_`); FAIL if any **segment exactly equals** a viewport keyword (`Mobile|Tablet|Desktop|Laptop|Wide|Huge`), `keyword+digits`, or a bare width number (`320…2560`). Token-segment, NOT substring → `WorldwideResults` (`Worldwide` ≠ `Wide`) PASSes; `TabletStack`/`MobileStack`/`AllLocalesDesktop`/`ControlRowRhythm_Desktop`/bare `Tablet`/`Desktop`/`HugeDesktop`/`Mobile320` FAIL. **UNLESS the `(file, export)` pair is in a FILE-SCOPED `REAL_MODE_ALLOWLIST`** (`scripts/story-realmode-allowlist.json`, entries `{file, export, reason}`, with a stale-entry check) — so a duplicate in a new file cannot reuse `MobileScroll` to slip past. Initial entries = proven overlay/scroll modes per their file (`MobileBottomSheet`, `SelectMobileBottomSheet`, `FormDialogMobileBottomSheet`, `MobileDrawerOpen`, `MobileOpen`, `MobileDialog`, `MobileFullWidth`, `MobileScroll`). NOT pre-allowlisted (Group 10 audit resolves): `MobileEmptyState`, `MobileSafe`, `MobileForm`, `MobileStack`, `TabletStack`, `SheetOpenMobile`.
- **Check 13 (NEW) — duplicate-family export names.** Same identifier-token segmentation; FAIL if any segment exactly equals `Proof|Demo|Canonical(+digits)` or `Filtered`. Uses the SAME file-scoped allowlist; the ONLY initial entry is `AdminListingsTable/FilteredPending` (genuine filter-state REAL_MODE). Zero-baseline/preventive (no other such names in the live tree).
- **Check 4 (BROADENED/replaced) — hardcoded locale (pins AND props)** *(was "Check 12" in pre-v6 wording)*. FAIL on a hardcoded locale in EITHER form: a `locale` key in a story `globals` object (multiline, any key order, any value `uk/sq/en/it`), OR a `locale:'…'` in `args`/`meta.args` or a `locale="…"` JSX prop (catches `AdminReportsManager` `.stories.tsx:51`). Toolbar-reactive `locale={ctx.globals.locale}` and viewport-only pins are legal. Replaces the old narrow matcher (single occurrence → one violation).
- **Check 3 (BROADENED) — locale-NAME export families.** FAIL on an export-name identifier segment equal to `Ukrainian|Albanian|Italian|English` (whole word) or `Uk|Sq|It|En` (leading segment); token-segment, so `Items`/`Enabled`/`Square` PASS. Zero-baseline/preventive.
- Scans **`**/*.stories.ts` AND `**/*.stories.tsx`**; `runGate` returns `checksRan: 13`. Ships blocking on a green (zero-violation) tree once every viewport-token / locale-name / proof-family export is renamed/deleted/allowlisted; planted-violation tests prove each class fails and only allowlisted real modes pass.
