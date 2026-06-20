# Task 468 — Storybook story de-duplication → canonical scenario set + blocking viewport/locale-pin gate

> **Executor:** Sonnet 4.6. **Type:** Storybook / visual-snapshot + governance-tooling (mixed).
> **Status:** 📋 KICKOFF READY — **HARD-BLOCKED on Task 463 functional code being FROZEN + reviewed** (see Sequencing). Precedes Task 467 REWORK.
> **Owner decisions encoded (2026-06-20):** (1) Include groups 8 & 9 (AdminReportsManager + AdminPermissionsManager); coordinate atomically — NOT concurrently with 463/467. (2) Blocking gate ships fully blocking now, **zero baseline, no allowlist for width/viewport pins**; only a tight, documented **real-responsive-mode name allowlist** (e.g. `MobileBottomSheet`, `MobileDrawerOpen`) is permitted. **Rework applied 2026-06-20** after owner review (corrected live-tree counts; atomic STOP; gate must block bare viewport keywords; hash by effective rendered locale; §8b fix; `.stories.ts`; Check-4 replacement; expanded tests; lint in self-validation; mandatory RM ASSERT entries; bare-viewport audit group; inventory = CANDIDATE).

## Verified live-tree facts (2026-06-20, source of truth — supersede `responsive-storybook-inventory.md`)

| Metric | Value |
|---|---|
| Story files | **56** (1 = `PlantedVisualViolations` gate fixture, out of dedup scope → 55 in scope) |
| Story exports | **283** (incl. Planted's 5) |
| Numeric width-suffixed exports (`…320/375/390/768/1440`, `Mobile320`, etc.) | **36** |
| Non-numeric viewport-named exports that FAIL Check 11 (identifier-token) | **24** = `Tablet`×11 + `ListingGrid`{Desktop,Mobile,HugeDesktop} + `RVS/HugeDesktop` + `FilterBar`{TabletStack,MobileStack,AllLocalesDesktop} + `button`{MobileSafe,ControlRowRhythm_Desktop} + `input/MobileForm` + `AdminReportsManager/DialogOwnerRow_Desktop` + `AdminSidebar/Desktop` + `EmptyState/MobileEmptyState`. (Allowlisted real modes — `MobileBottomSheet`/`MobileDrawerOpen`/`MobileScroll`/`MobileOpen`/`MobileDialog`/`MobileFullWidth`/`SelectMobileBottomSheet`/`FormDialogMobileBottomSheet` — are excluded from this count.) |
| Hardcoded-locale instances | **16** = **15 `globals.locale` pins** (ListingDetailView 9 + AdminSupportManager 3 + NumInputField 3) **+ 1 hardcoded `meta.args.locale:'uk'`** (AdminReportsManager `.stories.tsx:51` — a PROP, not a globals pin; Check 12 globals-only would miss it) |
| `ASSERT_STORIES` entries | **94** |
| Width-suffixed `ASSERT_STORIES` IDs | **23** (ListingDetailView 11 + AdminReportsManager 9 + AdminPermissionsManager 3) |
| `ASSERT_STORIES` target after dedup | **76** (LDV 14→3, RM 9→5, Perms 4→1; all width IDs → 0) |
| Exports target after dedup | **Exact count determined after Group 6 + Group 10 three-way classification** (`ListingGrid` = RESPONSIVE_PROOF_DUPLICATE → −2; `RVS/HugeDesktop` → −1; others TBD by verdict). The **mandatory invariant is ZERO forbidden names** (0 width/viewport-token exports outside the file-scoped allowlist) — not a fixed number. (Prior "~241/≤238" estimates retired.) |

## Pre-read (rule-index: Storybook/visual-snapshot + responsive/global-inventory)

`docs/agent-contract.md` (1–15) + `docs/backlog.md` (always). `docs/storybook-governance.md` (§8b taxonomy, §13/§14.2 locale-pin ban, §14.3/§14.5 gate, §14.4.x rendered-proof). `docs/responsive-storybook-inventory.md` (stale — this task refreshes it). `docs/design-system.md §27`. `docs/component-rules.md`, `docs/qa-rules.md`. Companion: `docs/governance-reports/2026-06-20-task468-storybook-story-dedup-before-after-inventory.md` (CANDIDATE inventory).

## Problem statement + duplicate-confirmation method

283 exports across 55 in-scope files contain large viewport/locale duplication: a real mode re-exported per width (`*Mobile320/375/390`, `*Tablet768`, `*Desktop1440`), per bare viewport keyword (`Tablet`, `Desktop`, `Mobile`, `HugeDesktop`), and/or pinned to a locale (`globals:{ … locale:'uk' }` ×15, or `meta.args.locale:'uk'` ×1).

**Why these are redundant (corrected coverage model — do NOT overstate):** the Storybook **toolbar** lets a reviewer inspect ANY story at all 14 viewports × 4 locales, so per-width/per-locale exports add no inspection capability. **Automatic machine coverage is narrower:** only `ASSERT_STORIES` stories run the full **14 viewports × 4 locales**; all other stories run in Task 467 Phase 2 (geometry-only) at **{320,375,390} × 4 locales, non-`--fast` only**. So a width/locale-pinned export is covered either by the toolbar (manual) or by its canonical sibling rendered at the same cell in the harness — it is never the sole source of coverage.

**Confirmation method — THREE-WAY classification (mandatory; every candidate export gets exactly one verdict, recorded in the log):**

1. **`PURE_DUPLICATE`** — `args`/`render`/anchor identical to the kept canonical (modulo the locale prop) AND **screenshot-hash equal at the same viewport + same _effective rendered locale_** ⇒ **DELETE.** ⚠️ Compare against the canonical rendered at the duplicate's effective locale (e.g. `PublicListing` at `uk`+320 — not nominal `en`); for non-`ASSERT_STORIES` capture, render both through the same harness path (id × viewport × locale) and hash the canvas, never the nominal manifest locale.
2. **`RESPONSIVE_PROOF_DUPLICATE`** — the render differs from a sibling ONLY in **story-wrapper responsive classes** and/or **per-viewport fixture count**, with **no distinct component state or interaction** (e.g. `ListingGrid` `Desktop` vs `HugeDesktop` vs `Mobile`: same `StoryListingCard`/`makeStoryListings`, differing only in grid class set, a `2xl:text-3xl` heading tweak, and `slice(0,4)`) ⇒ **CONSOLIDATE into ONE responsive canonical story** whose wrapper carries the full responsive class set (the union: `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4`, heading `text-xl sm:text-2xl 2xl:text-3xl`) and the full fixture set, then **DELETE the per-viewport variants.** The toolbar/harness viewports then prove 1-col@mobile → 4-col@2560 from the single story. Anchor preserved. A `RESPONSIVE_PROOF_DUPLICATE` is NOT kept as a rename — its responsive proof is folded into the canonical and the variants are removed.
3. **`REAL_MODE`** — a genuine distinct state/interaction (empty vs populated, dropdown-open, bottom-sheet, error) ⇒ **KEEP or RENAME** to a real-mode name (no viewport/width token).

Every Group 6 / Group 10 candidate (e.g. `ListingsTab/VisibilityMobile320`, `ListingGrid/{Desktop,Mobile,HugeDesktop}`, `FilterBar/{TabletStack,MobileStack,AllLocalesDesktop}`, `EmptyState/MobileEmptyState`, `button/MobileSafe`, `input/MobileForm`) MUST be assigned one of these three verdicts in the log before the inventory flips FINAL.

## Sequencing (HARD — owner P0 2026-06-20). The cycle MUST be broken in this order:

1. **Task 463 functional code FROZEN + reviewed** — the AdminReportsManager status-override/reopen/delete behavior is complete, committed, and under no further behavior edits. Until then, **Task 468 does NOT start at all.**
2. **Task 468 (this task) — ONE atomic change:** all groups + `ASSERT_STORIES` rewrite + checks 11/12 at zero baseline. No partial subset may ship.
3. **Task 467 REWORK** — runs against the final canonical taxonomy.
4. **Full rendered-proof + final Task 463 closure** — authoritative rendered matrix produced by the repaired 467 harness.

**No `screenshots:assert` matrix produced during Task 468 is authoritative** (the harness still carries the Task 464 false-negative until 467). In Task 468 it is a SCREEN only.

## Atomicity rule (P0 — supersedes any partial-execution path)

**If Task 463 functional code is not yet frozen + reviewed when this task is picked up → FULL STOP.** Do **not** execute groups 1–7 "in the meantime." A partial run leaves the zero-baseline gate impossible to enable (width exports still present) and violates the owner "block everything now" decision. Route back with the single blocker: "Task 463 functional freeze pending." There is no partial-completion branch.

## Canonical de-duplication map (literal)

### Group 1 — `ListingDetailView` (14 → 3)
KEEP `PublicListing`, `StaffPreviewUnpublished`, `StaffPreviewPublished` (no `locale` pin). DELETE the 11 width-suffixed siblings (`*Mobile320/375/390` ×3 modes, `PublicListingTablet768`, `PublicListingDesktop1440`).

### Group 2 — `NotificationItem` (5 → 3)
KEEP `AllCases`, `PriceChangeUnread`, `SavedSearchMatchUnread`. DELETE `AllCasesMobile320`, `AllCasesMobile375`.

### Group 3 — `NumInputField` (4 → 1)
KEEP `FloorsTotal`. DELETE `FloorsTotalMobile320/375/390` (these carry the 3 NumInput `locale:'uk'` pins).

### Group 4 — `AdminSupportManager` (8 → 4)
KEEP `Default`, `EmptyState`, `LocaleStress`, `UserCardStatusBadges`. DELETE `Tablet`, `UserCardStatusBadgesMobile320/375/390` (the 3 Support `locale:'uk'` pins).

### Group 5 — `AdminListingsTable` (7 → 6)
KEEP `Default`, `FilteredPending`, `LocaleStress`, `VisibilityAuditZero`, `PreviewDialogSoldStatusActions`, `Visibility`. DELETE `Tablet`. RENAME `VisibilityMobile320`→`Visibility` (confirm args differ from `Default`; drop the width token from the name).

### Group 6 — `ListingsTab` (2 → 1 or 2) — AUDIT-REQUIRED (gates inventory status)
Assign the **three-way verdict** to `VisibilityMobile320`: `PURE_DUPLICATE` of `Default` (args+render identical + hash-equal at effective locale) → DELETE (2→1); `RESPONSIVE_PROOF_DUPLICATE` (differs only in wrapper responsive classes / fixture count) → consolidate its proof into `Default` and DELETE (2→1); `REAL_MODE` (a genuine visibility-state scenario) → RENAME → `Visibility`, no viewport token (2→2). Record the verdict + evidence. **This is one of the two reasons the inventory is CANDIDATE, not final.**

### Group 7 — bare `Tablet` viewport-pin family (delete 11)
Delete `Tablet` from: `AdminCurrenciesManager`, `AdminCompaniesManager`, `AdminExchangeProvidersManager`, `AdminEmailTemplatesManager`, `AdminSettings`, `AdminPropertyTypesManager`, `AdminUserProfile`, `AdminUsersTable`, `AdminListingsTable` (also Group 5), `AdminSupportManager` (also Group 4), `AdminReportsManager` (also Group 8). All are pure viewport pins of `Default`; none are `ASSERT_STORIES` IDs.

### Group 8 — `AdminReportsManager` (16 → 6) — coordinate AFTER Task 463 freeze
KEEP `Default`, `LocaleStress`, `DialogOwnerRow`, `FullManagement`, `TerminalReopen`, `DeleteConfirm`. COLLAPSE/DELETE `Tablet`; `DialogOwnerRow_Mobile320/375/390`+`DialogOwnerRow_Desktop`→`DialogOwnerRow`; `FullManagement_Mobile320/375/390`→`FullManagement`; `TerminalReopen_Mobile320/375/390`→`TerminalReopen`; `DeleteConfirm_Mobile320/375/390`→`DeleteConfirm`. Collapsed exports keep the original anchors. Preserve Task 463 behavior (no component logic change).
- **🔴 Hardcoded-locale fix (P0):** remove `locale: 'uk'` from `meta.args` (`.stories.tsx:51`) and make the stories **toolbar-reactive** — resolve `locale` from `context.globals.locale` per the §13 canonical pattern (`render: (_, ctx) => <AdminReportsManager … locale={ctx.globals.locale ?? 'en'} />`), so the component follows the toolbar like every other story. Without this, every AdminReportsManager story renders Ukrainian regardless of toolbar/locale and the LocaleStress story is meaningless. The new gate (Check 12, extended to `args`/props) must FAIL if any hardcoded `locale` literal remains.

### Group 9 — `AdminPermissionsManager` (4 → 1)
KEEP `Default` (anchors `admin-permissions-manager` + `perm-row-reports_status_override` + `perm-row-reports_delete`). DELETE `Mobile320/375/390`.

### Group 10 — bare non-numeric viewport-named exports (AUDIT-REQUIRED, candidate dispositions)
These exports are NOT covered by Groups 1–9 and were missed in the first audit. Assign each a three-way verdict (`PURE_DUPLICATE`/`RESPONSIVE_PROOF_DUPLICATE`/`REAL_MODE`); candidate disposition:
- `ListingGrid`: `Desktop`, `Mobile`, `HugeDesktop` = **`RESPONSIVE_PROOF_DUPLICATE`** (verified: identical `StoryListingCard`/`makeStoryListings`; differ only in grid class set / `2xl:text-3xl` heading / `slice(0,4)`) → consolidate into ONE responsive canonical `Default` (full responsive grid + full fixtures), DELETE all three variants. **ASSERT impact:** `system-listinggrid--desktop` → `system-listinggrid--default`. KEEP `LocaleStress`, `OldPriceWrap`, `CurrencyUSD`.
- `RecentlyViewedSection`: `HugeDesktop` → `RESPONSIVE_PROOF_DUPLICATE` of `Populated` (consolidate/delete). `MobileScroll` → `REAL_MODE` KEEP (horizontal-scroll mode, allowlisted).
- `AdminSidebar`: `Desktop` → `REAL_MODE` RENAME (desktop rail is distinct from `MobileDrawerOpen`, but the bare viewport name is forbidden; pick a non-viewport real-mode name, STOP&ASK if unsure). `MobileDrawerOpen` → `REAL_MODE` KEEP. Not an ASSERT id.
- `FilterBar`: `AllLocalesDesktop`, `TabletStack`, `MobileStack` → classify each: most likely `RESPONSIVE_PROOF_DUPLICATE` of `Default`/`WithActiveFilters` (consolidate/delete); keep only if a genuine reflow `REAL_MODE` (then rename without viewport token).
- `button`: `ControlRowRhythm_Desktop` (+ `ControlRowRhythm_Stacked`) → real desktop-vs-stacked rhythm; rename `_Desktop` → non-viewport real-mode name (e.g. `ControlRowRhythm_Inline`); `_Stacked` keep. `MobileSafe` → classify (likely `REAL_MODE` touch-safe sizing → rename without token, or `RESPONSIVE_PROOF_DUPLICATE`).
- `input`: `MobileForm` → classify (`RESPONSIVE_PROOF_DUPLICATE` of `Default`/`WithLabel`, or `REAL_MODE` → rename without token).
- `EmptyState`: `MobileEmptyState` → classify vs `NoListings` (`RESPONSIVE_PROOF_DUPLICATE` → delete, or `REAL_MODE` → rename without token).
- `tabs`: `MobileScroll` → `REAL_MODE` KEEP (overflow-scroll, allowlisted).
**All dispositions are CANDIDATE — Sonnet assigns the three-way verdict by args/render/hash and records it; the inventory stays CANDIDATE until every Group 6 + Group 10 export has a verdict.**

### Group 11 — `ASSERT_STORIES` rewrite + no-stale-ID (94 → 76)
- **ListingDetailView:** delete the 11 width IDs; keep 3 canonical (anchor `listing-detail-view`).
- **AdminReportsManager:** replace 9 width IDs with **5 MANDATORY** scenario IDs (no "optional"): `--default` (anchor `admin-reports-manager`), `--dialog-owner-row` (anchors `admin-reports-manager` + the owner-row dialog testid), `--full-management` (+`status-override-section`), `--terminal-reopen` (+`reopen-btn`), `--delete-confirm` (+`delete-btn`).
- **AdminPermissionsManager:** 4 → 1 (`--default`).
- **ListingGrid:** `system-listinggrid--desktop` → `system-listinggrid--default`.
- After `npm run build-storybook`, a node check asserts `ASSERT_STORIES.id ⊆ storybook-static/index.json` with **0 stale / 0 phantom**; expected count **76**.

### Group 12 — blocking gate (checks 11 + 12), zero baseline, no width/viewport allowlist
Add to `scripts/check-stories.mjs` + a matching ESLint `no-restricted-syntax` selector in `eslint.config.mjs`. **Glob MUST include both `**/*.stories.tsx` AND `**/*.stories.ts`** (Storybook loads both); the ESLint story block in `eslint.config.mjs` must likewise extend its file scope from `src/**/*.stories.tsx` + `src/stories/**` to also cover `src/**/*.stories.ts`. **`eslint.config.mjs` is IN SCOPE** for this task (see AC8).
- **Check 11 — viewport/width-named exports (identifier-token rule).** Split each `export const <Name>` into identifier segments (PascalCase boundaries + `_`). FAIL if any **segment exactly equals** a viewport keyword `Mobile|Tablet|Desktop|Laptop|Wide|Huge` (or `keyword+digits` like `Mobile320`, or a bare width number `320…2560`). **Token-segment, NOT arbitrary substring** — so `WorldwideResults` (segment `Worldwide` ≠ `Wide`), `Combobox`, `Disabled` PASS; `TabletStack`→[`Tablet`,`Stack`]→FAIL, `MobileStack`→FAIL, `AllLocalesDesktop`→[`All`,`Locales`,`Desktop`]→FAIL, `ControlRowRhythm_Desktop`→FAIL, bare `Tablet`/`Desktop`/`HugeDesktop`→FAIL, `Mobile320`→FAIL. **UNLESS** the `(file, exportName)` pair is in the documented `REAL_MODE_ALLOWLIST` (see below). Report `file:line` + name.
- **`REAL_MODE_ALLOWLIST` is FILE-SCOPED** (`scripts/story-realmode-allowlist.json`), each entry `{ "file": "src/…/x.stories.tsx", "export": "MobileBottomSheet", "reason": "…" }` — keyed by **file path + export name + reason**, NOT by bare name (so a duplicate in a NEW file cannot reuse `MobileScroll` to slip past). Add a **stale-entry check**: an allowlist entry whose file or export no longer exists FAILS (or warns→`--update`) like §15.2. **Initial entries** (proven overlay/scroll modes, per their file): `sheet/select/command/popover/dropdown-menu/AdminLocaleSwitcher/NotificationCenter`→`MobileBottomSheet`; `AdminCurrenciesManager/AdminExchangeProvidersManager`→`FormDialogMobileBottomSheet`; `StatusChangeControl`→`SelectMobileBottomSheet`; `AdminSidebar`→`MobileDrawerOpen`; `navigation-menu`→`MobileOpen`; `dialog`→`MobileDialog`/`MobileFullWidth`; `tabs`/`RecentlyViewedSection`→`MobileScroll`. **NOT pre-allowlisted — Group 10 audit must classify & resolve before the gate flips green:** `EmptyState/MobileEmptyState`, `button/MobileSafe`, `input/MobileForm`, `FilterBar/MobileStack`+`TabletStack`, any `SheetOpenMobile`. The gate flips blocking only once EVERY viewport-token export is deleted/renamed or has a file-scoped allowlist entry → zero violations.
- **Check 12 — hardcoded locale (pins AND props).** FAIL on a hardcoded locale literal in a story in EITHER form: (i) a `locale` key nested anywhere inside a story-level `globals` object (**multiline, any key order, any value `uk`/`sq`/`en`/`it`**); (ii) a `locale: '<lit>'` in `args`/`meta.args` or a `locale="…"`/`locale={'…'}` JSX prop (catches `AdminReportsManager` `meta.args.locale:'uk'`). Legal: `locale` resolved from `context.globals.locale` (toolbar-reactive); a viewport-only pin. **Replace the existing Check 4** (which only matched `globals:{locale:'uk'}` with `locale` first) so a single occurrence yields exactly ONE violation, not two.
- Wire into `npm run check:stories` (already in `prebuild-storybook` + CI). Tree must be at **zero violations** after the dedup → gate ships blocking on green.
- **Tests** (`scripts/__tests__/check-stories.test.ts`): (a) `export const FooMobile320` → Check 11 FAIL; (b) bare `export const Tablet`/`Desktop`/`HugeDesktop` → FAIL; (c) **prefix/infix** `export const TabletStack`/`MobileStack` → FAIL; (d) allowlisted `export const MobileBottomSheet`/`SelectMobileBottomSheet`/`FormDialogMobileBottomSheet`/`MobileDrawerOpen` → PASS; (e) non-allowlisted `export const SheetOpenMobile` → FAIL until justified-allowlisted; (f) multiline `globals:{\n viewport:{value:'mobile320'},\n locale:'uk'\n}` → Check 12 FAIL; (g) key-order `globals:{ locale:'sq', viewport:… }` → FAIL; (h) each of `uk/sq/en/it` → FAIL; (i) `args:{ locale:'uk' }` and `<C locale="uk" />` → Check 12 FAIL; (j) toolbar-reactive `locale={ctx.globals.locale}` + viewport-only pin → PASS; (k) a `.stories.ts` file is scanned; (l) **token-segment guard** `export const WorldwideResults` / `WideningResults` → PASS (no `Wide` segment false-positive); (m) **file-scoped allowlist**: `MobileScroll` in its allowlisted file → PASS, the SAME name in a different (non-allowlisted) file → FAIL; (n) **stale-entry**: an allowlist entry pointing at a non-existent file/export → FAIL (or warn under `--update`). Paste the planted-FAIL transcript, then revert.

## Governance contradiction to FIX (P1)
`docs/storybook-governance.md §8b` ("One `LocaleStress` story per component (pinned to `mobile320` + `uk` locale)") and the §15.3 scaffold ("LocaleStress … pinned to `mobile320`") **contradict §13/§14.2 and new Check 12** (no `locale` pin). Edit §8b + §15.3: `LocaleStress` is **toolbar-reactive, NO `locale` pin**; a `mobile320` **viewport** pin is allowed, a **locale** pin is not. Document checks 11/12 in §8b/§14.3.

## Positive flow (happy path)
Precondition: Task 463 functional FROZEN+reviewed; tree green on `check:stories` 1–10. 1) Re-derive export inventory (`grep '^export const'` across `**/*.stories.{ts,tsx}`) = 283 baseline. 2) For each group 1–10 candidate, assign a **three-way verdict with class-appropriate evidence** (see Confirmation method): `PURE_DUPLICATE` (args+render identical + hash-equal at same viewport+effective locale) → delete; `RESPONSIVE_PROOF_DUPLICATE` (render-diff is ONLY wrapper responsive classes / per-viewport fixture count, no distinct state) → consolidate into one responsive canonical + delete variants; `REAL_MODE` (distinct state/interaction) → keep or rename (no viewport token). 3) Apply deletes/consolidations/renames; update in-file refs. 4) Rewrite `ASSERT_STORIES`; `build-storybook`; assert `⊆ index.json`, 0 stale, count 76. 5) Add checks 11/12 + ESLint selector + tests (incl. `.stories.ts`); `check:stories` exit 0. 6) `screenshots:assert` (SCREEN only). 7) Update inventory (→ flip to FINAL only after Group 6/10 verdicts), backlog, session log (before/after + Files Changed tables).

## Negative flow (every branch)
- **Task 463 not frozen** → FULL STOP, route back (no partial groups). 
- **Candidate is not a `PURE_DUPLICATE`** → do NOT default to rename. Re-classify: if `RESPONSIVE_PROOF_DUPLICATE` (render differs only in wrapper responsive classes / per-viewport fixture count) → consolidate its responsive proof into ONE canonical and **DELETE the variants**; only a genuine `REAL_MODE` is renamed (no viewport token) or kept. **Renaming a `RESPONSIVE_PROOF_DUPLICATE` and leaving a semantic duplicate is a TASK FAILURE.**
- **Anchor missing after collapse** → fix the kept export so the anchor renders; never drop the anchor from `ASSERT_STORIES`.
- **Stale/phantom ID after build** → reconcile; ship 0 stale.
- **Check 11 false-positive** on an allowlisted real mode / a non-token name (`WorldwideResults`) / viewport-only pin → fix the **identifier-token** matcher (segment equality, not substring); pass-tests stay green.
- **Check 11/12 false-negative** (planted `FooMobile320`, bare `Tablet`, prefix `TabletStack`/`MobileStack`, multiline/key-order/other-locale pin, `args.locale`/`locale="…"` prop, `.stories.ts`) → fix until each plant fails; a no-op gate is a TASK FAILURE.
- **Check 12 double-counts** a single pin (old Check 4 still present) → remove/replace Check 4.
- **`screenshots:assert` cited as authoritative** → forbidden; SCREEN only.
- **A component className/layout changes** → out of scope, STOP.

## Acceptance criteria (each verifiable in diff/transcript)
1. Exports reduced to the canonical set (exact count fixed after Group 6/10 three-way classification); **mandatory invariant = ZERO forbidden viewport/width-token names** outside the file-scoped allowlist; **ListingDetailView exactly 3**. [Pos 3]
2. Every group 1–10 candidate carries a recorded **three-way verdict** with class-appropriate evidence: `PURE_DUPLICATE` = args+render-identical + hash-equal-at-effective-locale; `RESPONSIVE_PROOF_DUPLICATE` = render-diff-is-only-wrapper/fixture proof + the consolidated responsive canonical reproduces each viewport; `REAL_MODE` = state/interaction diff. All Group 6 + Group 10 verdicts recorded; no `RESPONSIVE_PROOF_DUPLICATE` left renamed. [Pos 2; Neg classify]
3. `ASSERT_STORIES` = **76**; `⊆ index.json`, **0 stale / 0 phantom** (transcript). [Pos 4; Neg stale]
4. RM 5 mandatory scenario ASSERT IDs carry original anchors, found in DOM; Perms `--default` anchors found; `system-listinggrid--default` resolves. [Neg anchor]
5. Checks 11 + 12 implemented over `**/*.stories.{ts,tsx}` — Check 11 = **identifier-token segment** match vs a **file-scoped** `REAL_MODE_ALLOWLIST` (`{file,export,reason}` + stale-entry check); Check 12 catches `globals.locale` pins **and** hardcoded `args.locale`/`locale="…"` props; **old Check 4 removed/replaced**; `AdminReportsManager` `meta.args.locale:'uk'` removed → toolbar-reactive; `check:stories` exit 0 (zero baseline = 0 forbidden names). [Pos 5; Neg double-count]
6. Planted-violation tests prove 11 FAILs on width-suffix, bare viewport keyword, **prefix/infix `TabletStack`/`MobileStack`**, and PASSes only allowlisted real modes; Check 12 FAILs on multiline pin, key-order pin, each of uk/sq/en/it, **`args.locale` and `locale="…"` props**, and a `.stories.ts` case; PASS on toolbar-reactive `locale={ctx.globals.locale}` + viewport-only pin. FAIL transcript + revert. [Neg false-pos/neg]
7. `docs/storybook-governance.md §8b + §15.3` corrected (no locale pin on LocaleStress); checks 11/12 documented. [P1 governance]
8. Task 463 RM behavior preserved — diff shows only `*.stories.{ts,tsx}` + named scripts (`scripts/check-stories.mjs`, `scripts/check-stories-rendered.mjs`, `scripts/__tests__/check-stories.test.ts`, `scripts/story-realmode-allowlist.json`) + **`eslint.config.mjs`** + docs; **no `src/components`/`src/modules` component className/logic change** — the Group 8 toolbar-reactive fix lives entirely in `AdminReportsManager.stories.tsx` (drop `meta.args.locale`, pass `locale={ctx.globals.locale}` to the existing `locale` prop); the component is NOT edited. [Neg scope]
9. Before/after inventory report + `responsive-storybook-inventory.md` counts refreshed (status CANDIDATE→FINAL only after Group 6/10 verdicts).
10. **Files Changed** table; executor emits **no** git.
11. **Self-validation block:** `tsc=0` · **`npm run lint` 0 new errors** (ESLint selector changed) · `check:stories` exit 0 · `check-stories.test.ts` green · ASSERT-IDs 76 / 0-stale transcript · AC table all ✅ · scope clean. `build-storybook`/`tsc` green is a baseline, **not** rendered proof; rendered authority deferred to Task 467 (state explicitly).

## Mobile <640 full-width gate
This task deletes/renames story exports + edits gate scripts, `eslint.config.mjs`, and docs — **no rendered component layout/className change**. Rendered full-width matrix is N/A (no layout diff); the log states this and the diff confirms no `*.tsx` component/className under `src/components`/`src/modules` changed (only `*.stories.{ts,tsx}` export lists + `scripts/` + `eslint.config.mjs` + `docs/`). Any component className change → STOP (out of scope).

## Orchestrator review notes
- Diff touches ONLY story files + named scripts + **`eslint.config.mjs`** + docs (clause 1). `eslint.config.mjs` is in scope (the story-block selector + its `src/**/*.stories.ts` glob extension).
- Native (owner PowerShell) re-derive: `npm run build-storybook` → node `ASSERT_STORIES.id ⊆ index.json` (expect 76, 0 stale). Native is the verdict (clause 14).
- Confirm checks 11/12 fail natively on each planted class incl. bare `Tablet` + multiline/key-order/other-locale + `.stories.ts` (no-op gate = reject).
- Do NOT approve from any Task-468 `screenshots:assert` matrix as rendered authority — that is Task 467 against this taxonomy.
