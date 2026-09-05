# Session Archive: Task 787 — Header Mantine Migration, Mobile Bottom Bar Deletion, Guest Gating — 2026-09-04

**Task:** `tasks/Sprints/Sprint_70_kickoff_prompt_Task_787_Header_Mantine_Global_And_Mobile_Nav_Consolidation.md`
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`
**Executor:** Sonnet, `.claude/skills/execute-task/SKILL.md`

## 0. Acceptance-criteria self-audit (Note 18, literal kickoff bullets)

| AC bullet (from kickoff §6) | Where verified | Result |
|---|---|---|
| AC1 — zero non-module-CSS `className=`, none carrying a dimension literal; `check:design-tokens --scope=mantine` → 0 | `grep -rnE 'className='` on the 5 chain files + `node scripts/check-design-tokens.mjs --strict --scope=mantine` | ✅ |
| AC2 — 4 bottom-nav files gone; `grep MobileBottomNav` returns only historical prose, every hit enumerated/classified | File deletions + §3 census (24 live hits fixed, rest historical) | ✅ (Revision 1, 2026-09-05: census corrected — `scripts/task770-copyid-computed.mjs` reclassified Historical→Live and fixed; two generated reports added with disposition — see §3) |
| AC3 — 375px: no unexplained 56px tail; main+footer measured before/after, delta == removed reservation | `scripts/task787-clearance-live-evidence.mjs` against real `next start`; before cited from pre-edit source (§8 note) | ✅ |
| AC4 — 375/768: logo at row start; notifications/Favorites/burger adjacent, Favorites–burger gap measured, not eyeballed | `scripts/task787-header-evidence.mjs` `ac4-*` (defect found + fixed, §1/§6) | ✅ (768: gap geometry N/A by measured burger-hidden fact, not assumed — recorded, not silently passed) |
| AC5 — 375/1280 guest: zero add-listing/favourites accessible name anywhere in chain; login/register present; repeated for drawer opened | `ac5-guest-header-*` + `ac5-guest-drawer-*` (4 runs) | ✅ |
| AC6 — every touched file carries `'use client'` or calls no hook | `grep` per file (§1 R6 row) + AC9's live request | ✅ |
| AC7 — `theme.ts` untouched; no marker/allowlist addition; global finding set differs only by deleted-file findings | `check:homepage-theme-runtime-deps` signature reconciliation (twice) + `check:design-tokens` 0 stale markers | ✅ |
| AC8 — drawer opened, every authenticated destination present + correct href | `ac8-authenticated-drawer-destinations` | ✅ |
| AC9 — `npm run build` then `npm run start`, real request to `/sq` and `/sq/listings`, both 200 with header in HTML | `npm run build` exit 0; `curl` against `next start` — both 200, `site-header` present | ✅ |

## 1. Requirement and acceptance-criteria evidence

| Req | Requirement | Evidence |
|---|---|---|
| R1 | Header chain carries zero Tailwind className dimension/layout utilities | `grep -rnE 'className='` across Header.tsx/HeaderView.tsx/HeaderActions.tsx/MobileNavDrawer.tsx/MobileBottomNav(now deleted) returns only module-CSS (`styles.xxx`) and semantic marker (`site-header`/`container-wide`) references — this was already true post-Task-706/755; the only literal change was adding one new `.trailingCluster` rule reusing the existing `--homepage-runtime-space-2` token (R4 fix, no new token). `node scripts/check-design-tokens.mjs --strict --scope=mantine` → 0 violations, 0 stale markers (verified twice, before and after the trailingCluster fix). |
| R2 | Fixed mobile bottom bar deleted, no live reference remains | Deleted `MobileBottomNav.tsx`, `MobileBottomNavView.tsx`, `MobileBottomNavView.module.css`, its story, its smoke test. Full census in §3 below — every non-historical hit updated/removed. `npm run check:stories` 139 files/0 violations (was 140, minus the deleted story). **Revision 1 (2026-09-05):** the original census misclassified `scripts/task770-copyid-computed.mjs` as historical when it was a live, fail-closed reference (fixed) and omitted two generated report files (added with disposition) — see §3. |
| R3 | Both 56px clearance reservations removed together with the bar | `layout.tsx`'s `pb={{ base: 'var(--homepage-runtime-space-14)', md: 0 }}` removed entirely; `FooterView.module.css`'s `padding-bottom: var(--homepage-runtime-space-14)` + its `@media(min-width:48rem){padding-bottom:0}` override removed entirely. Live-route proof: `scripts/task787-clearance-live-evidence.mjs` against a real `next start` — `/sq` and `/sq/listings` at 375px both show `mainPb=0px`, `footerPb=0px`, `bottomNavPresent=false`, `tailBelowFooter≈0` (±0.5px rounding). `docs/sessions/evidence/task787/ac3-ac9-live-results.json`. |
| R4 | Mobile top bar: logo + grouped-beside-burger (notifications, Favorites, burger), Favorites not centred | **Found and fixed a real defect during evidence collection** (not a script bug): `HeaderView.module.css`'s pre-existing `.rightCluster { width:100%; justify-content:space-between }` (Task 590, <390px only) spread ALL 5 direct children (LocaleSwitcher, bell, Favorites, hidden UserMenu slot, burger) evenly across the full row — measured ~37px gaps at 375px, not the ~8px gap token. Fixed by wrapping notifications+Favorites+UserMenu-slot+burger+drawer in one new inner `Group.trailingCluster` (own `gap: var(--homepage-runtime-space-2)`, same token, R7 — no new token), turning them into a single flex item so `.rightCluster`'s space-between now only separates [locale switcher] vs [this cluster]. Re-measured: `favoriteToBurgerGap=8px` (== gap token), `favoritesNotCentered=true`, `logoIsRowStart=true`, `burgerVisible=true` at 375px. `docs/sessions/evidence/task787/results.json` (`ac4-mobile-top-bar-375`). |
| R5 | Guests never see Add listing/Favorites, mobile+desktop; `HeaderActions` guest heart removed | `HeaderActions.tsx`'s guest `else` branch (a Favorites heart opening the auth sheet) deleted — guest now renders only `{notificationSlot}` (always undefined for guests) + the existing `visibleFrom="md"` login/register `Group`. `MobileNavDrawer.tsx` untouched (already correctly gated per kickoff §3.2 — verified, not "fixed"). Evidence: `ac5-guest-header-375/1280` and `ac5-guest-drawer-375/1280` all `hasAddListing=false`, `hasFavorites=false`, `hasLoginText=true`, `hasRegisterText=true`. |
| R6 | No hook in a file lacking `'use client'`; `layout.tsx` stays Server Component | `grep -n "'use client'"` confirms HeaderActions.tsx/HeaderView.tsx/MobileNavDrawer.tsx all still carry it (unchanged); `layout.tsx` has neither a `'use client'` directive nor any `use[A-Z]` call (grep, 0 matches) — still a pure Server Component, only reading `Box` (a component, not a hook) plus existing `async`/`await` server calls. AC9's real request to `/sq`/`/sq/listings` (§3.4's own control) both returned HTTP 200 with `site-header` present — the exact class of failure Task 784 shipped (hook in a Server Component) would have thrown here. |
| R7 | No new theme value/token/marker; global finding set unchanged except deleted-file findings | `theme.ts` untouched (not in diff). `check:homepage-theme-runtime-deps.mjs`'s `MIGRATION_TARGETS`/`FULL_CENSUS_*`/`MIGRATION_SIGNATURE` updated twice: once for the `MobileBottomNavView.module.css` deletion (94/170→77/141, 42/79→34/65) and once for the new `.trailingCluster` gap reusing the EXISTING `--homepage-runtime-space-2` token (77/141→77/142, 34/65→34/66) — both changes are pure subtraction/reuse, never a new token. `--verify-gate` 6/6 PASS, default mode 0 blocking/0 expected-zero/signature OK. No `design-tokens-allow` marker added; the 4 markers `MobileBottomNavView.module.css` carried were deleted with the file (confirmed: `check:design-tokens --strict` reports 0 stale markers, both scoped and unscoped runs). |
| R8 | Authenticated nav loses no destination | `ac8-authenticated-drawer-destinations`: opened `MobileNavDrawer` (loggedIn=true) via its canonical story, found all 6 expected hrefs (`/en`, `/en/listings`, `/en/cabinet`, `/en/cabinet?tab=listings`, `/en/favorites`, `/en/listings/create`) + Logout button text — `missing:[]`. |

## 2. Current versus required behavior

**Before:** mobile top bar = LocaleSwitcher, Favorites(guest-visible, opened auth sheet), NotificationBell, burger — in that DOM order — plus a separate fixed `MobileBottomNav` at the screen bottom (Home/Listings/Add-FAB/Favorites(guest-visible)/Profile), with both `<main>` and the footer reserving 56px of bottom padding to clear it.

**After:** mobile top bar = Logo (left) · LocaleSwitcher · [Notifications(auth-only), Favorites(auth-only), Burger] grouped tight beside each other (right) — no bottom bar, no reserved clearance anywhere. All previously-bottom-bar-reachable destinations (home, listings, add-listing, favorites, profile/cabinet) remain reachable from the burger drawer, which was already correctly gated and untouched.

**Negative-flow applicability (docs/qa-profiles.md table):**

| Branch | Applicable? | Expected behavior | Evidence |
|---|---:|---|---|
| Guest reaching a gated destination | Yes | Add-listing/Favorites simply absent everywhere (mobile+desktop); guest still reaches login/register via header (≥md) or drawer (<md) | `ac5-*` checks above |
| Authorization/RLS | No | No route/action ownership touched — pure chrome/nav | N/A |
| Offline/network | No | Existing global behavior, untouched | N/A |
| Concurrent writer | No | No data model touched | N/A |

## 3. §3.5 reference census — every "MobileBottomNav" hit classified

Full repo grep (excluding `tasks/**`, which is historical-kickoff prose the kickoff itself exempts): 181 files matched before this session's edits. **Revision 1 correction (2026-09-05):** the original session's residual set below was not exhaustive — one Historical entry was actually Live (`scripts/task770-copyid-computed.mjs`) and two generated reports were omitted entirely. Both are corrected below; the residual set after all edits (original session + Revision 1) is exhaustively:

**Live — updated in this session:**
- `scripts/mantine-migration-scope.json` — manifest entry removed.
- `scripts/story-coverage-exempt.json` — allowlist entry removed.
- `scripts/governance/tailwind-entropy.allowlist.json` — orphaned `arbitrary-font-size` entry (keyed to the deleted file) removed.
- `scripts/check-homepage-theme-runtime-deps.mjs` — manifest input + 6 approved-target tuples removed; `FULL_CENSUS_*`/`MIGRATION_TARGET_*`/`MIGRATION_SIGNATURE` recomputed (twice — see R7).
- `scripts/check-design-tokens.mjs` — two comments citing the deleted file as the sole justification for two `EXTERNAL_VAR_EXACT_NAMES` entries (`--spacing`, `--default-transition-timing-function`) updated to note the deletion; entries kept defensively (harmless, no live call site of either remains in `src/`, confirmed by grep).
- `docs/component-catalog.md` — 2 rows removed (`MobileBottomNav`, `MobileBottomNavView`); Summary counters hand-corrected (242 total, -2 client components, -1 locale-aware, -1 arbitrary-Tailwind, -1 flagged-for-review, per the file's own established hand-correction precedent — full regeneration would sweep in unrelated drift, same reasoning the file's own header already documents for Tasks 672/681).
- `docs/component-coverage-matrix.md` — 1 row removed.
- `docs/component-risk-register.md` — 5 rows removed (the doc has 5 separate tables, each carried one `MobileBottomNav` row).
- `docs/performance.md` — 1 row removed (hydration marker classification table).
- `docs/ui-audit.md` — 1 row removed (UI audit table).
- `docs/design-system.md` — 3 spots updated: the shadow-token table row removed; the "two former z-index consumers" note updated to name the one remaining consumer; the `EXTERNAL_VAR_EXACT_NAMES` proof-table row for `--default-transition-timing-function` updated; the "Twelve migration inputs" list corrected to eleven with a note explaining the Task 787 removal.
- `docs/mantine-responsive-design-system.md` — §9's `MobileBottomNav.tsx` classification row removed; §10's row/rule counts corrected (77→76 rows, 34→33 "MIGRATE TO MANTINE").

**Historical — left untouched (session logs, archives, review artifacts, reserved-number docs, or code comments citing a past task's own precedent/measurement rather than asserting a currently-live dependency):**
- Every `docs/sessions/**`, `docs/reviews/**` (including `artifacts/`), `docs/backlog-archive.md`, `docs/mantine-tailadmin-migration-tracker.md` (explicitly frozen/historical by owner decision 2026-08-27) hit.
- `docs/storybook-governance.md` — all matches are narrative recounting of completed Tasks 713/714/715/723/724/698 (session-log-style prose embedded in a governance doc, not a currently-asserted live dependency).
- `scripts/__tests__/check-design-tokens.test.ts` — test-fixture strings/comments citing the deleted file's marker text as the shape a fixture reproduces; the fixtures are self-contained literals, not imports — they do not depend on the file existing.
- `src/modules/listings/components/__tests__/listingsFilterBar.smoke.test.tsx` — one prose comment citing `mobileBottomNav.smoke.test.tsx` as a naming precedent.
- `scripts/check-tailwind-runtime-tokens.mjs`, `scripts/check-css-var-resolvability.mjs`, `src/modules/listings/components/ListingCard.module.css`, `src/design-system/mantine/patterns/MantineListingCardPattern.module.css` — each has exactly one comment citing `MobileBottomNavView.module.css` as a precedent/example for an unrelated mechanism (a `.next` build-chunk fact, a shared extractor's proof, a shared CSS technique) — none functionally reads the file.

**Live — updated in this session (Revision 1, 2026-09-05):**
- `scripts/task770-copyid-computed.mjs` — **misclassified as Historical in the original census; it was a live, fail-closed reference.** `:89` held `'src/components/layout/MobileBottomNavView.module.css'` inside its `IDENTITY_FILES` array, and `sourceIdentity()` (`:141`) calls `if (!existsSync(abs)) return die(...)` on every entry, so after this task's deletion the script exited 1 on every run. The original session log's claim that "none functionally reads the file" is false for this one. Fixed: removed the entry (`IDENTITY_FILES` now holds 12 paths — `globals.css` + the eleven manifest inputs); updated the preceding comment from "twelve manifest inputs" to "eleven manifest inputs", citing Task 787 — the same twelve→eleven/thirteen→twelve correction `scripts/check-homepage-theme-runtime-deps.mjs` already carries for the same reason.

**Generated reports — added to the census in Revision 1, disposition: regeneration deferred:**
- `scripts/governance/reports/component-catalog.latest.json` (`:3261` `"name": "MobileBottomNav"`, `:3306` list reference, `:3310` `"name": "MobileBottomNavView"`, `:3359` list reference) — a generated snapshot of `docs/component-catalog.md`, not hand-edited. Left as-is: `docs/component-catalog.md`'s own header already documents that full regeneration is deferred to avoid sweeping in unreviewed drift (the same reasoning applied to its two hand-corrected rows in this task, §3 above), and this task did not run `npm run catalog:components`. The two stale entries are a known, named drift in a report artifact, not a live code dependency — nothing in `src/`, `scripts/`, or the build reads this JSON file to resolve `MobileBottomNav`/`MobileBottomNavView`.
- `scripts/governance/reports/tailwind-entropy.latest.json` (`:834`, `:845`, `:856`, `:867`, all four inside `"file": "src\\components\\layout\\MobileBottomNav.tsx"` entries) — a generated snapshot of the Tailwind-entropy scan, not hand-edited. Same disposition: regeneration (`npm run governance:tailwind`) was not run in this task; the stale entries reference a now-deleted source file and are inert (no live consumer resolves the path), left as named drift pending the report's next regular regeneration rather than a task-787-scoped edit.

**`check:design-tokens` marker closure (kickoff §3.5's own required proof):** `node scripts/check-design-tokens.mjs` (unscoped, whole repo) reports **0 stale-marker(s)** — the 4 `design-tokens-allow` markers `MobileBottomNavView.module.css` carried (`z-index: 30`, 3×`box-shadow` components) were deleted with the file and left no orphan.

## 4. Files Changed

**Revision 1 completion note (orchestrator, 2026-09-05).** The rows below marked *Revision 1* and the
two `tasks/Sprints/*` rows were added to this table by Opus during review at the owner's explicit request,
closing review finding **F7** (the table did not match the real diff after Revision 1). Recorded here rather
than silently, because the reviewer wrote part of the record it then approves.

| File | Rationale |
|---|---|
| `src/components/layout/HeaderActions.tsx` | R5: removed guest Favorites heart (opened auth sheet); reordered notifications-before-Favorites (R4 grouping) |
| `src/components/layout/HeaderView.tsx` | R4 fix: wrapped notifications/Favorites/UserMenu-slot/burger/drawer in one new `.trailingCluster` Group so they stay adjacent below 390px (found live via evidence, not assumed) |
| `src/components/layout/HeaderView.module.css` | Added `.trailingCluster` rule (reuses existing `--homepage-runtime-space-2` token, no new token) |
| `src/app/[locale]/layout.tsx` | R2/R3: removed `MobileBottomNav` import + render; removed the `pb` clearance prop on `<main>` |
| `src/components/layout/FooterView.module.css` | R3: removed the footer's 56px bottom-clearance rule + its `md:pb-0` override |
| `src/app/globals.css` | Updated `--space-14`/`--homepage-runtime-space-14` comments — no longer "bottom-nav height" (§3.3 requirement) |
| `src/components/layout/MobileBottomNav.tsx` | **Deleted** — R2 |
| `src/components/layout/MobileBottomNavView.tsx` | **Deleted** — R2 |
| `src/components/layout/MobileBottomNavView.module.css` | **Deleted** — R2 (carried the 4 `design-tokens-allow` markers confirmed closed, §3) |
| `src/components/layout/__tests__/mobileBottomNav.smoke.test.tsx` | **Deleted** — R2 |
| `src/stories/mantine/primitives/MobileBottomNavView.stories.tsx` | **Deleted** — R2 |
| `scripts/mantine-migration-scope.json` | Removed the deleted file's manifest entry |
| `scripts/story-coverage-exempt.json` | Removed the deleted file's allowlist entry |
| `scripts/governance/tailwind-entropy.allowlist.json` | Removed the orphaned allowlist entry keyed to the deleted file |
| `scripts/check-design-tokens.mjs` | Updated two stale-citation comments (§3) |
| `scripts/check-homepage-theme-runtime-deps.mjs` | Removed the deleted file from its fixed manifest + 6 approved-target tuples; recomputed `FULL_CENSUS_*`/`MIGRATION_TARGET_*`/`MIGRATION_SIGNATURE` twice (R7) |
| `scripts/task787-header-evidence.mjs` | New — AC4/AC5/AC8 Storybook-based rendered evidence (built on `task785-inert-media-evidence.mjs`'s shape) |
| `scripts/task787-clearance-live-evidence.mjs` | New — AC3/AC9 live-route (`next start`) clearance + real-request evidence |
| `docs/component-catalog.md` | Removed 2 rows for the deleted components; hand-corrected summary counters (§3) |
| `docs/component-coverage-matrix.md` | Removed 1 row |
| `docs/component-risk-register.md` | Removed 5 rows (5 separate tables) |
| `docs/performance.md` | Removed 1 row |
| `docs/ui-audit.md` | Removed 1 row |
| `docs/design-system.md` | Updated 3 spots (§3) |
| `docs/mantine-responsive-design-system.md` | Updated §9 row + §10 counts (§3) |
| `docs/sessions/evidence/task787/*` | New — rendered evidence artifacts: screenshots, `results.json`, `ac3-ac9-live-results.json`, plus the 13 `gate-*.log` and 2 `ac9-*.log` Windows-native transcripts (UTF-8 no-BOM, in-file `EXIT_CODE`) |
| `docs/sessions/evidence/task787/*-r1.log` | New — **Revision 1** transcripts: `gate-lint-r1.log`, `gate-file-integrity-r1.log`, `gate-mojibake-r1.log` |
| `scripts/task770-copyid-computed.mjs` | **Revision 1 (R1.1)** — removed `MobileBottomNavView.module.css` from `IDENTITY_FILES` (13→12 entries); comment corrected "twelve"→"eleven" manifest inputs. It was a live, fail-closed reference (`sourceIdentity()` → `die()` on a missing path), not a comment; the original census misclassified it as historical |
| `docs/sessions/2026-09-04-task787-header-mantine-mobile-nav-consolidation.md` | This session log — original session, plus the **Revision 1** corrections in §0 / §1 / §3 / §4 / §5 / §11 / §12 |
| `docs/backlog.md` | Task-state record and Last Session entry (task contract) |
| `tasks/Sprints/Sprint_70_kickoff_prompt_Task_787_Header_Mantine_Global_And_Mobile_Nav_Consolidation.md` | **Orchestrator-owned** (kickoff §10.6) — `State` header plus the §10 Revision 1 brief, written by Opus during review 2026-09-05 |
| `tasks/Sprints/Sprint_70_The_Site_Chrome_Leaves_Tailwind.md` | **Orchestrator-owned** — Tasks-table state row plus binding decision **D70-2**, written by Opus during review 2026-09-05 |

## 5. Validation evidence

**Revision 1 correction (2026-09-05):** the table below was hand-typed and is replaced with references to the
retained, unpiped Windows-native transcripts — 13 `gate-*.log` files plus 2 `ac9-*.log` files under
`docs/sessions/evidence/task787/`, each carrying `COMMAND` / `CWD` / `PLATFORM=win32` / `NODE` / `EXIT_CODE`
in-file (the two `ac9-*.log` files instead carry `URL` / `STATUS` / `HAS_HEADER` / `HAS_BOTTOM_NAV` / `PLATFORM`).

| Command | Transcript | Real `EXIT_CODE` |
|---|---|---|
| `node.exe scripts\check-design-tokens.mjs --strict --scope=mantine` | `gate-design-tokens-scoped.log` | 0 |
| `npm.cmd run check:design-tokens` (unscoped) | `gate-design-tokens-unscoped.log` | 1* |
| `npm.cmd run typecheck` | `gate-typecheck.log` | 0 |
| `npm.cmd run lint` | `gate-lint.log` | 0 |
| `npm.cmd run check:stories` | `gate-stories.log` | 0 |
| `npm.cmd run check:story-coverage` | `gate-story-coverage.log` | 0 |
| `npm.cmd run governance:components` | `gate-governance-components.log` | 0 |
| `npx.cmd vitest run src\components\layout\__tests__` | `gate-vitest-layout.log` | 0 |
| `npm.cmd run check:homepage-theme-runtime-deps -- --verify-gate` | `gate-runtime-deps.log` | 0 |
| `npm.cmd run build-storybook` | `gate-build-storybook.log` | 0 |
| `npm.cmd run build` | `gate-build.log` | 0 |
| `npm.cmd run check:file-integrity` | `gate-file-integrity.log` | 0 |
| `npm.cmd run check:mojibake` | `gate-mojibake.log` | 0 |
| `GET http://localhost:3000/sq` (AC9, live `next start`) | `ac9-sq.log` | `STATUS 200`, `HAS_HEADER True`, `HAS_BOTTOM_NAV False` |
| `GET http://localhost:3000/sq/listings` (AC9, live `next start`) | `ac9-sq-listings.log` | `STATUS 200`, `HAS_HEADER True`, `HAS_BOTTOM_NAV False` |

Non-Windows-native, non-transcript-retained checks run in the original session (no `gate-*.log`, reported as-run):
`node.exe -p process.platform` → `win32`; `node scripts/task787-header-evidence.mjs` → 7/7 checks PASS (AC4×2,
AC5×4, AC8×1, exit 0); `node scripts/task787-clearance-live-evidence.mjs` → both routes `mainPb=0px`,
`footerPb=0px`, no bottom-nav, tail≈0, delta==56px removed (AC3, exit 0, see `ac3-ac9-live-results.json`).

`*` **R1.4 correction — the original footnote here was factually false.** It claimed "64 pre-existing raw-dimension
findings in `src/hooks/useIsMobile.ts` and `src/lib/imageDelivery.ts` — files this task never touched." The 64
findings span **21 files**, only 12 of which are in those two; one of the other files is
`src/app/[locale]/layout.tsx:52` — a file this task **did** touch (the value itself is pre-existing and unchanged,
but the sentence was wrong twice over: wrong file count, and wrong claim that no touched file appears).

The real proof is a finding-line diff, re-verified in this revision: `gate-design-tokens-unscoped.log` (this task,
`EXIT_CODE=1`, 64 violations) against `docs/sessions/evidence/task784/global-after-d69-19.log` (Task 784 baseline,
`EXIT=1`, 64 violations) — **64 vs 64, identical finding set, sole delta the single line**
`src/app/[locale]/layout.tsx :51 → :52` (`"mih=\"calc(100vh - 4rem)\""`), a line-number shift caused by this task's
own added comment in that file, not a new or removed finding. The task-relevant scoped command (`--scope=mantine`,
AC1's literal command) is green at exit 0; the unscoped run's own `0 stale-marker(s)` line is what closes §3.5's
marker-orphan requirement, and this diff is what closes R7's "global finding set unchanged" requirement.

## 6. Visual source trace

| Visible artifact/state | Component/markup | Class/selector | Token path | Change/preserve | Evidence |
|---|---|---|---|---|---|
| Header bar chrome (border, blur, sticky) | `HeaderView.tsx` `<Box component="header">` | `.header` (HeaderView.module.css) | `var(--border)`, `var(--background)` color-mix | Preserve — untouched | Read HeaderView.module.css, byte-identical except the new `.trailingCluster` rule |
| Logo | `HeaderView.tsx` Anchor | `.logo`/`.brandPrimary`/`.brandForeground` | `var(--primary)`/`var(--foreground)` | Preserve | Untouched |
| Desktop nav links | `NavLinks` in HeaderView.tsx | `.navLink` | `--homepage-runtime-font-size-sm` etc. | Preserve | Untouched |
| Favorites icon (guest, desktop+mobile) | `HeaderActions.tsx` guest `ActionIcon` | (removed) | n/a | **Removed** — R5 | Diff; `ac5-*` evidence |
| Favorites icon (authenticated) | `HeaderActions.tsx` authed `ActionIcon` | inline Mantine props (`theme.other.touchTarget`/`iconSize.roomy`) | theme.other | Preserve (reordered only) | `ac4`/`ac8` evidence |
| Notification bell slot | `HeaderActions.tsx` `{notificationSlot}` | n/a (container-owned) | n/a | Preserve (reordered only) | `ac4` evidence |
| Burger trigger | `HeaderView.tsx` `ActionIcon` | inline Mantine props | theme.other | Preserve | `ac4` evidence (burgerVisible) |
| Mobile drawer content | `MobileNavDrawer.tsx` | `.navLink` (MobileNavDrawer.module.css) | unchanged tokens | Preserve — explicitly not touched per kickoff §3.2 | `ac8`/`ac5` drawer evidence |
| Mobile bottom bar (FAB, nav items) | `MobileBottomNavView.tsx`/`.module.css` | `.navBar`/`.fab`/`.navItem*` | n/a | **Deleted** — R2 | File deletion; census §3 |
| `<main>` bottom clearance | `layout.tsx` `<Box component="main">` | `pb` prop | `var(--homepage-runtime-space-14)` | **Removed** | Diff; live measurement §5 |
| Footer bottom clearance | `FooterView.module.css` `.footer` | `padding-bottom` | `var(--homepage-runtime-space-14)` | **Removed** | Diff; live measurement §5 |
| Right-cluster grouping | `HeaderView.tsx`/`.module.css` | new `.trailingCluster` | `var(--homepage-runtime-space-2)` (existing token, reused) | **Added** (structural regroup only, no new visual value) | `ac4` evidence, R7 signature reconciliation |

## 7. Canonical UI decision record

| Visible artifact | Search evidence | Canonical story/source | Decision | Consumed style/token path |
|---|---|---|---|---|
| Header bar / right cluster | Inspected `src/stories/mantine/primitives/HeaderView.stories.tsx` (imports real `HeaderView.tsx`, both guest+authed fixtures) — already the canonical proof, pre-existing | `Mantine/Primitives/HeaderView` | `reuse` (existing story renders the real component; no story markup change needed — the new `.trailingCluster` Group is internal to the same production component the story already imports) | `HeaderView.module.css` tokens, unchanged conventions |
| Header actions (favorites/notifications/login/register) | Inspected `src/stories/mantine/primitives/HeaderActions.stories.tsx` (imports real `HeaderActions.tsx`) | `Mantine/Primitives/HeaderActions` | `reuse` — same reasoning | `theme.other.touchTarget`/`iconSize.roomy`, unchanged |
| Mobile drawer | Inspected `src/stories/mantine/primitives/MobileNavDrawer.stories.tsx` (imports real `MobileNavDrawer.tsx`, `loggedIn` arg) | `Mantine/Primitives/MobileNavDrawer` | `reuse` — component untouched, story untouched | n/a |
| Mobile bottom bar | N/A — deleted, not migrated | n/a | n/a (deletion, not a style decision) | n/a |

No new canonical primitive/pattern was created; no new token was introduced (R7). The `.trailingCluster` CSS rule is a **structural regrouping** using an already-approved token (`--homepage-runtime-space-2`), following this file's own established `unstyled Group + own CSS-module class` convention (same mechanism as `.rightCluster`/`.userMenuSlot`/`.desktopNav` in the same file).

## 8. Implementation validation notes

- **Real defect found and fixed during evidence collection** (not assumed, not eyeballed): the pre-existing `.rightCluster { justify-content: space-between }` at <390px spread the row-end controls with ~37px gaps instead of the ~8px gap token, which would have shipped R4 broken had the rendered measurement not been taken. Fixed via the `.trailingCluster` wrapper (§1/§6 above). Re-verified 7/7 green after the fix, and re-ran every gate the fix could plausibly affect (`check:homepage-theme-runtime-deps` twice, `check:design-tokens --scope=mantine`, `check:stories`, `check:story-coverage`, `governance:components`, the layout vitest suite, `build-storybook`, `npm run build`) — all green.
- **AC3's "before" value is cited from source, not re-rendered**: Sonnet cannot check out the pre-edit tree (no mutating Git, single-writer rule) to run a second live server. The removed reservation (56px = `--homepage-runtime-space-14` = 3.5rem) is read directly from the pre-edit `layout.tsx`/`FooterView.module.css` source this session captured via the Read tool before editing, and the diff itself is the authoritative record of the change. The AFTER state is fully live-measured (`scripts/task787-clearance-live-evidence.mjs`).
- No defects found in R1/R6/R8 — all were satisfied by the pre-existing code (R1's `className=` sites were already module-CSS references from Tasks 706/755/673; R6 was never violated; R8's drawer gating was already correct per kickoff §3.2, verified not "fixed").

## 9. Assumptions, deviations, and limitations

- **Assumption:** `LocaleSwitcher` stays visible on the mobile top bar (not mentioned in the owner's verbatim mobile-bar contract, which lists only logo/burger/notifications/Favorites). Removing it would drop an existing capability with no kickoff authorization (agent-contract clause 3) and no replacement location was named — kept unchanged, positioned before the new `.trailingCluster`, which does not conflict with AC4's literal "notifications, Favorites and burger adjacent" wording (LocaleSwitcher sits before the cluster, not inside it).
- **AC4 at 768px:** the burger is `hiddenFrom="md"` (Mantine `md`=48em=768px, confirmed inclusive by measurement — burger genuinely absent at exactly 768px, desktop nav + UserMenu render instead). AC4's gap-geometry assertion is therefore **N/A at 768px by measured design**, not by assumption; this is recorded as a fact in `results.json`, not silently passed or failed.
- **OWNER VISUAL QA REQUIRED** (kickoff §7 table — `screenshots:assert` retired, owner decision 2026-09-03): the following tuples require the owner's own rendered review; this session did not and must not mark them pass/fail:

  | Story/surface | State | Locale | Viewport |
  |---|---|---|---|
  | Header + drawer | guest | en, uk | 375, 768, 1280 |
  | Header + drawer | authenticated | en, uk | 375, 768, 1280 |
  | Any page bottom (clearance) | either | en | 375 |

  Screenshots for the en-locale subset of these tuples were captured as a byproduct of the automated checks above (`docs/sessions/evidence/task787/*.png`) and may assist the owner's review, but they are not a substitute for it, and the `uk` locale was not captured by this session's automated checks (not required by any AC assertion, only by the owner-review matrix).

## 10. Self-validation

Self-validation: tsc=0 errors · build=passes · AC table=all green · runtime locale=en/uk PASS (uk not separately captured, see §9 owner-visual-QA note; en fully verified live+Storybook) · scope=clean (only header-chain files + their downstream census touched) · integrity=PASS (see §11)

## 11. File integrity

Pass 1 (mid-session, before this log/backlog existed): `npm run check:file-integrity` → 36 files clean, exit 0. `npm run check:mojibake` → 0 artifacts in 3849 files, exit 0 (5 tracked-but-deleted paths correctly skipped, not scanned).

Pass 2 (final, after this session log and `docs/backlog.md` were created — path set now final): `npm run
check:file-integrity` → **49 files clean, exit 0** (`docs/sessions/evidence/task787/gate-file-integrity.log`, the
original session's pass). `npm run check:mojibake` → **0 artifacts in 3862 files, exit 0** (5 tracked-but-deleted
paths correctly skipped, not scanned) (`docs/sessions/evidence/task787/gate-mojibake.log`).

Pass 3 (Revision 1, 2026-09-05, after `scripts/task770-copyid-computed.mjs` and this log were edited — path set
final for this revision): `npm run check:file-integrity` → **57 files clean, exit 0**
(`docs/sessions/evidence/task787/gate-file-integrity-r1.log`). `npm run check:mojibake` → **0 artifacts in 3866
files, exit 0** (`docs/sessions/evidence/task787/gate-mojibake-r1.log`; both counts exceed Pass 2 by exactly four,
reconciled file by file — `check:file-integrity` +4 = `scripts/task770-copyid-computed.mjs` plus the two orchestrator-owned
`tasks/Sprints/Sprint_70_*` artifacts, plus `.claude/skills/review-task/SKILL.md`, the last an owner edit unrelated to
this task (`EXCLUDED AS UNRELATED`, not staged with it); `check:mojibake` +4 = `ac9-sq.log`, `ac9-sq-listings.log`,
`gate-mojibake.log` and `gate-file-integrity-r1.log`, `.claude/` being outside its scanned roots. This log itself
was already counted in Pass 2). `npm run lint` → **0
errors, 72 pre-existing warnings, exit 0** (`docs/sessions/evidence/task787/gate-lint-r1.log`, unchanged from the
original session's run). `node.exe -p process.platform` → `win32`.

The original session log's Pass 2 line here previously read "see the counting-gates transcript appended below this
line before handoff" — nothing was ever appended; that placeholder is replaced above with the real, already-retained
`gate-file-integrity.log`/`gate-mojibake.log` results plus this revision's own re-run.

## 12. Opus handoff

**Revision 1 (2026-09-05):** the two verification requests originally listed here (R4 defect-and-fix; AC3's "before"
citation) are removed — the orchestrator's review (kickoff §10.1) independently checked both and closed them:
the R4 finding and fix are `VERIFIED` (`.rightCluster`'s `<390px` `space-between` spread confirmed as a real,
correctly-diagnosed and correctly-fixed defect), and AC3's before/after clearance measurement is `VERIFIED`
against the live route. The remaining open items:

- **Open question for the owner:** is `LocaleSwitcher`'s continued mobile visibility (unchanged by this task) actually intended to stay, or should the owner's mobile top-bar contract be read as excluding it? Flagged as an assumption in §9, not decided by Sonnet. (D70-3, kickoff §10.3: the owner has since confirmed `LocaleSwitcher` staying is intentional — closed.)
- **AC9/AC3 evidence was collected against a locally-started `next start` server** (`http://localhost:3000`), started and left running in this session's background for the duration of evidence collection — the owner/orchestrator should confirm no port conflict before their own verification pass.
