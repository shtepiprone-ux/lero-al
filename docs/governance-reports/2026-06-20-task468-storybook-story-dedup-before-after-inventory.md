# Storybook story de-duplication — before/after inventory (Task 468)

**Date:** 2026-06-20 · **Author:** orchestrator (Opus) · **Status:** ⚠️ **CANDIDATE INVENTORY** — not final until Group 6 (`ListingsTab`) and Group 10 (non-numeric viewport-named exports) each receive an execution-time **three-way verdict** (`PURE_DUPLICATE`/`RESPONSIVE_PROOF_DUPLICATE`/`REAL_MODE`). Kickoff: `tasks/kickoff_prompt_Task_468_StorybookStoryDedup_CanonicalGrouping_BlockingGate.md`.
**Method:** `Glob('**/*.stories.tsx')` + `grep '^export const'` + targeted greps on the live tree (no cherry-picking). Counts supersede `docs/responsive-storybook-inventory.md` §1/§7 (Task-412 snapshot: 43 files / 248 index entries).
**Revision:** v5 (2026-06-20) — v2 corrected v1 lumping errors (file/width/Tablet/locale-pin/ASSERT counts) + added the bare-viewport group; v3 reclassified the 16th pin as `args.locale` + corrected the coverage model; v4 added the three-way classification (`RESPONSIVE_PROOF_DUPLICATE`) + file-scoped allowlist + identifier-token gate; v5 corrected the forbidden-name count to 24 / Group 10 = 15 candidates (12 unallowlisted) + propagated three-way logic into flow/AC + scoped `eslint.config.mjs`.

## 1 — Headline (verified)

| Metric | Before | After (target) |
|---|---|---|
| Story files | **56** (`PlantedVisualViolations` = gate fixture → 55 in scope) | 56 |
| Story exports | **283** (incl. Planted's 5) | exact count after Group 6/10 three-way classification; **invariant = ZERO forbidden viewport/width-token names** |
| `ListingDetailView` exports | **14** | **3** |
| Numeric width-suffixed exports | **36** | **0** |
| Non-numeric viewport-named exports that FAIL Check 11 (identifier-token) | **24** = `Tablet`×11 + `ListingGrid`{Desktop,Mobile,HugeDesktop} + `RVS/HugeDesktop` + `FilterBar`{TabletStack,MobileStack,AllLocalesDesktop} + `button`{MobileSafe,ControlRowRhythm_Desktop} + `input/MobileForm` + `Reports/DialogOwnerRow_Desktop` + `AdminSidebar/Desktop` + `EmptyState/MobileEmptyState` (allowlisted real modes excluded) | **0** |
| Hardcoded-locale instances | **16** = **15 `globals.locale` pins** (LDV 9 + Support 3 + NumInput 3) **+ 1 `meta.args.locale:'uk'`** (AdminReportsManager `.stories.tsx:51` — a prop, missed by a globals-only check) | **0** |
| `ASSERT_STORIES` IDs | **94** | **76** |
| Width-suffixed `ASSERT_STORIES` IDs | **23** (LDV 11 + RM 9 + Perms 3) | **0** |

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
| 6 | `ListingsTab` ⚠️ | 2 | 1–2 | **AUDIT (three-way):** `VisibilityMobile320` → PURE_DUPLICATE→delete / RESPONSIVE_PROOF_DUPLICATE→consolidate+delete / REAL_MODE→rename `Visibility` |
| 7 | bare `Tablet` family (11 files) | — | — | delete `Tablet` in Currencies/Companies/Exchange/EmailTemplates/Settings/PropertyTypes/UserProfile/UsersTable (+ListingsTable g5, +Support g4, +Reports g8) |
| 8 | `AdminReportsManager` | 16 | 6 | delete `Tablet`; collapse `DialogOwnerRow_*`(5→1), `FullManagement_*`(3→1), `TerminalReopen_*`(3→1), `DeleteConfirm_*`(3→1); **remove `meta.args.locale:'uk'` → toolbar-reactive** |
| 9 | `AdminPermissionsManager` | 4 | 1 | delete `Mobile320/375/390` |
| 10 | non-numeric viewport-named ⚠️ (**15 candidates / 8 files; 12 not allowlisted**) | 15 | varies | **AUDIT (three-way):** `ListingGrid` Desktop/Mobile/HugeDesktop = RESPONSIVE_PROOF_DUPLICATE→consolidate→`Default`; `RVS/HugeDesktop`→consolidate, `RVS/MobileScroll`→keep(allowlist); `AdminSidebar/Desktop`→rename, `MobileDrawerOpen`→keep(allowlist); `FilterBar` **TabletStack/MobileStack**/AllLocalesDesktop→classify; `button` **MobileSafe**/ControlRowRhythm_Desktop→classify/rename; `input/`**MobileForm**→classify; `EmptyState/`**MobileEmptyState**→classify; `tabs/MobileScroll`→keep(allowlist) |
| 11 | `ASSERT_STORIES` | 94 | 76 | LDV 14→3, RM 9→5 (mandatory), Perms 4→1, `listinggrid--desktop`→`--default`; 0 stale |
| 12 | blocking gate | checks 1–10 | 1–12 | Check 11 (identifier-token viewport/width names vs **file-scoped** `{file,export,reason}` allowlist + stale-entry) + Check 12 (locale `globals` pins **and** `args.locale`/`locale="…"` props; multiline/key-order/all-locale); replace Check 4; scan `.stories.{ts,tsx}` |

## 4 — Canonical kept set (one story per real mode)

- **ListingDetailView (3):** `PublicListing`, `StaffPreviewUnpublished`, `StaffPreviewPublished`.
- **NotificationItem (3):** `AllCases`, `PriceChangeUnread`, `SavedSearchMatchUnread`.
- **NumInputField (1):** `FloorsTotal`.
- **AdminSupportManager (4):** `Default`, `EmptyState`, `LocaleStress`, `UserCardStatusBadges`.
- **AdminListingsTable (6):** `Default`, `FilteredPending`, `LocaleStress`, `Visibility`, `VisibilityAuditZero`, `PreviewDialogSoldStatusActions`.
- **AdminReportsManager (6):** `Default`, `LocaleStress`, `DialogOwnerRow`, `FullManagement`, `TerminalReopen`, `DeleteConfirm`.
- **AdminPermissionsManager (1):** `Default`.
- **Tablet family:** each loses `Tablet`.
- **Group 10 (candidate, three-way verdict per export):** `ListingGrid`→`Default`+`LocaleStress`/`OldPriceWrap`/`CurrencyUSD`; `RecentlyViewedSection`→consolidate `HugeDesktop`, keep `MobileScroll`; `AdminSidebar`→rename `Desktop`, keep `MobileDrawerOpen`; `FilterBar` {`TabletStack`,`MobileStack`,`AllLocalesDesktop`}, `button` {`MobileSafe`,`ControlRowRhythm_Desktop`}, **`input/MobileForm`**, `EmptyState/MobileEmptyState` per execution verdict; **`tabs/MobileScroll`** keep (allowlisted).

Viewport (320…2560) and locale (sq/en/uk/it) coverage for all kept stories comes from the harness loops + the Storybook toolbar — not from per-width/per-locale exports.

## 5 — Stale-ID risk + proof plan

Deleting/renaming a width export orphans any `ASSERT_STORIES` entry that targets its generated ID. Affected: ListingDetailView 11 width IDs → removed (3 canonical keep anchor `listing-detail-view`); AdminReportsManager 9 width IDs → 5 mandatory scenario IDs carrying the dual anchors; AdminPermissionsManager 4 → 1; `system-listinggrid--desktop`→`--default`. The `--tablet`/`UserCardStatusBadges*`/`FloorsTotal*`/`AllCases*` generated IDs are **not** in `ASSERT_STORIES` (only each file's `--default`) → no ASSERT orphan, but the executor re-derives the orphan set programmatically rather than relying on this table.

**Proof (acceptance):** after `npm run build-storybook`, a node check asserts `ASSERT_STORIES.id ⊆ storybook-static/index.json` with **0 missing**, expected count **76**. Native (owner PowerShell / CI) run is the verdict.

## 6 — Sequencing (owner P0, 2026-06-20). Break the cycle in order:

1. **Task 463 functional code FROZEN + reviewed.** Until then Task 468 does NOT start (no partial subset).
2. **Task 468 atomic** — all groups + `ASSERT_STORIES` + checks 11/12 at zero baseline, one change.
3. **Task 467 REWORK** — against the final taxonomy.
4. **Full rendered-proof + final Task 463 closure.**

No `screenshots:assert` matrix produced during Task 468 is authoritative (harness keeps the Task-464 false-negative until 467).

## 7 — Gate (checks 11 & 12), zero baseline

- **Check 11 — viewport/width-named exports (identifier-token rule).** Split the export name into identifier segments (PascalCase + `_`); FAIL if any **segment exactly equals** a viewport keyword (`Mobile|Tablet|Desktop|Laptop|Wide|Huge`), `keyword+digits`, or a bare width number (`320…2560`). Token-segment, NOT substring → `WorldwideResults` (`Worldwide` ≠ `Wide`) PASSes; `TabletStack`/`MobileStack`/`AllLocalesDesktop`/`ControlRowRhythm_Desktop`/bare `Tablet`/`Desktop`/`HugeDesktop`/`Mobile320` FAIL. **UNLESS the `(file, export)` pair is in a FILE-SCOPED `REAL_MODE_ALLOWLIST`** (`scripts/story-realmode-allowlist.json`, entries `{file, export, reason}`, with a stale-entry check) — so a duplicate in a new file cannot reuse `MobileScroll` to slip past. Initial entries = proven overlay/scroll modes per their file (`MobileBottomSheet`, `SelectMobileBottomSheet`, `FormDialogMobileBottomSheet`, `MobileDrawerOpen`, `MobileOpen`, `MobileDialog`, `MobileFullWidth`, `MobileScroll`). NOT pre-allowlisted (Group 10 audit resolves): `MobileEmptyState`, `MobileSafe`, `MobileForm`, `MobileStack`, `TabletStack`, `SheetOpenMobile`.
- **Check 12 — hardcoded locale (pins AND props).** FAIL on a hardcoded locale in EITHER form: a `locale` key in a story `globals` object (multiline, any key order, any value `uk/sq/en/it`), OR a `locale:'…'` in `args`/`meta.args` or a `locale="…"` JSX prop (catches `AdminReportsManager` `.stories.tsx:51`). Toolbar-reactive `locale={ctx.globals.locale}` and viewport-only pins are legal. **Replaces Check 4** (single occurrence → one violation).
- Scans **`**/*.stories.ts` AND `**/*.stories.tsx`**. Ships blocking on a green (zero-violation) tree once every viewport-token export is renamed/deleted/allowlisted; planted-violation tests prove each class fails and only allowlisted real modes pass.
