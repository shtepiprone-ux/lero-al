# Task 697 — Deterministic story-fixture dates + `check:stories` Check 16 (D23/D24)

**Status:** `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`

## 1. Files Changed

| Path | Reason |
|---|---|
| `src/stories/mantine/primitives/ListingCard.stories.tsx` | R1 site #1 — froze `created_at` to `FIXTURE_CREATED_AT` |
| `src/stories/fixtures/cardListingData.fixture.ts` | R1 site #2 — froze per-card `created_at` via `FIXTURE_ANCHOR_MS` |
| `src/stories/fixtures/admin.fixtures.ts` | R1 sites #3/#4, R2 — froze `expires_at` × 2 via `FIXTURE_TODAY_MS`; docstring now true |
| `src/stories/mantine/primitives/NotificationBellView.stories.tsx` | R1 site #5 — froze `NOW` to a literal |
| `src/modules/cabinet/components/ListingsTab.stories.tsx` | R1 sites #6–11 (**D24**) — froze `FUTURE`/`PAST` + 4 `created_at` ages via `FIXTURE_TODAY_MS`; `expires_at: null` row preserved |
| `src/modules/notifications/components/NotificationItem.stories.tsx` | R1 site #12 (**D24**) — froze `NOW` to a literal |
| `scripts/check-stories.mjs` | R4 — added Check 16; `checksRan` 15→16; doc-comment count fixed |
| `scripts/__tests__/check-stories.test.ts` | R4 — bumped `checksRan` assertion 15→16; added 5 Check-16 BAD/GOOD tests |
| `docs/storybook-governance.md` | R3 — added §14.10 (fixture determinism rule); fixed 3 stale "13 checks" references to 16; added Check 14/15/16 to the enumerated list |
| `docs/backlog.md` | Updated 697's state (this session) |
| `docs/sessions/2026-07-30-task697-deterministic-fixture-dates.md` | Created — this file |

`tasks/kickoff_prompt_Task_697_Deterministic_Story_Fixture_Dates_And_Gate.md` was amended externally (D24, mid-execution) to record the corrected 12-site census; not authored by the executor.

No production component, date helper, or i18n message was touched (A5 held throughout).

## 2. I0 snapshot and true final `git status --porcelain`

**I0 (start):** `git status --porcelain` → empty. `git log --oneline | grep 9caae02aa` → `9caae02aa feat(Task693): overlay dual declaration...` confirmed as an ancestor of `HEAD`. `git log -1 --oneline` → `7125c3f38 docs(Task697): deterministic story-fixture dates kickoff (D23)...`.

**Mid-execution:** the kickoff file and `docs/backlog.md` were externally amended (D24) to record the corrected 12-site census — observed as pre-existing modifications, not made by the executor; left untouched until this session's own `docs/backlog.md` update below.

**Final** (after this session's edits, before the post-records encoding gates):
```
 M docs/backlog.md
 M docs/storybook-governance.md
?? docs/sessions/2026-07-30-task697-deterministic-fixture-dates.md
 M scripts/__tests__/check-stories.test.ts
 M scripts/check-stories.mjs
 M src/modules/cabinet/components/ListingsTab.stories.tsx
 M src/modules/notifications/components/NotificationItem.stories.tsx
 M src/stories/fixtures/admin.fixtures.ts
 M src/stories/fixtures/cardListingData.fixture.ts
 M src/stories/mantine/primitives/ListingCard.stories.tsx
 M src/stories/mantine/primitives/NotificationBellView.stories.tsx
 M tasks/kickoff_prompt_Task_697_Deterministic_Story_Fixture_Dates_And_Gate.md
```
`tasks/kickoff_...md` is the externally-amended D24 file — `EXCLUDED AS UNRELATED` to the executor's own diff, shown untouched by this session.

## 3. R1–R9 mapped to AC1–AC7

| Req | AC | Evidence |
|---|---|---|
| R1 | AC1 | §4 below — 12/12 sites frozen, both census commands return comments only |
| R2 | AC1 | `admin.fixtures.ts:2` docstring unchanged text, now true (no `Date.now()` in the file) |
| R3 | AC2 | §6 — §14.10 added; §14.3 "13"→"16" corrected in 3 places (main bullet + Check-10 gate-wiring line + enumerated-check-count header) — corrected from "2 places" per Task 698 review F4 |
| R4 | AC3 | §7 — Check 16 added; `checksRan: 16`; unit assertion bumped; 111/111 unit tests pass |
| R5 | AC4 | §7 — full 4-step gate proof, 3 negative controls, all quoted |
| R6 | AC5 | §8 — 0 FAIL (final run), 0 verdict changes, ambiguous 4/16/2=22, every changed cell partitioned |
| R7 | AC5 | §8 — NotificationBellView bbox table, all 16 cells confined to the timestamp region |
| R8 | AC6 | §5 — anchor chosen = capture-day date; badge states verified unchanged for both `LISTING_NEW_DAYS` and the admin visibility formatter |
| R9 | AC7 | §9 — all gates 0/passing; `npm run build` exit 0, route table quoted |

## 4. Census — before/after, both commands

**I1 baseline** (untouched tree): `grep -rn "Date.now()\|new Date()" src/stories/` → 5 live sites + 1 comment (matched kickoff §3.2 exactly). `npm run check:stories` → 0 violations, 127 files, `checksRan: 15`. `check:design-tokens` 43/0 stale. `check:story-coverage` 15/15. `check:i18n` 2215×4.

**Mid-execution correction (D24):** building Check 16 at its natural `STORY_FILES` scope (used by every other check, not just `src/stories/`) immediately surfaced 7 more live sites in `src/modules/cabinet/components/ListingsTab.stories.tsx` (6) and `src/modules/notifications/components/NotificationItem.stories.tsx` (1) — files the original `src/stories/`-scoped census in kickoff §3.2 never covered. Flagged before proceeding; the kickoff was amended (D24) to widen the fix to all 12 sites and keep Check 16 at the full `STORY_FILES` scope (narrowing the gate to hide the gap was explicitly rejected).

**Final census, both commands, full `STORY_FILES` scope:**
```
$ find src -name "*.stories.tsx" -o -name "*.stories.ts" | xargs grep -n "Date\.now()\|new Date()"
src/modules/cabinet/components/ListingsTab.stories.tsx:17:// Frozen anchor "today" (no Date.now()/new Date() wall-clock in fixtures per Storybook
src/modules/notifications/components/NotificationItem.stories.tsx:5:// Frozen "now" (no Date.now()/new Date() wall-clock in fixtures per Storybook governance §14,
src/stories/mantine/primitives/ListingCard.stories.tsx:32:// Frozen "created 2 days ago" (no Date.now()/new Date() wall-clock in fixtures per Storybook
src/stories/mantine/primitives/NotificationBellView.stories.tsx:7:// Frozen "now" (no Date.now()/new Date() wall-clock in fixtures per Storybook governance §14,
src/stories/mantine/primitives/RangeDatePicker.stories.tsx:79:    // Fixed dates (no Math.random()/new Date() wall-clock in fixtures per Storybook governance §14) —

$ grep -rn "Date.now()\|new Date()" src/stories/
src/stories/fixtures/admin.fixtures.ts:2: * ...deterministic, no Date.now()/random.
src/stories/fixtures/admin.fixtures.ts:45:// Frozen anchor "today" (no Date.now()/new Date() wall-clock ...
src/stories/fixtures/cardListingData.fixture.ts:43:// Frozen anchor "today" (no Date.now()/new Date() wall-clock ...
src/stories/mantine/primitives/ListingCard.stories.tsx:32:// Frozen "created 2 days ago" ...
src/stories/mantine/primitives/NotificationBellView.stories.tsx:7:// Frozen "now" ...
src/stories/mantine/primitives/RangeDatePicker.stories.tsx:79:    // Fixed dates ...
```
Both commands ran and returned comment-only matches — no live expression remains (AC1).

**All 12 sites, before/after:**

| # | Site | Before | After |
|---|---|---|---|
| 1 | `ListingCard.stories.tsx:84` | `new Date(Date.now() - 2*24*60*60*1000).toISOString()` | `FIXTURE_CREATED_AT` = `'2026-07-28T00:00:00.000Z'` |
| 2 | `cardListingData.fixture.ts:61` | `new Date(Date.now() - (i+1)*24*60*60*1000).toISOString()` | `new Date(FIXTURE_ANCHOR_MS - (i+1)*24*60*60*1000).toISOString()`, `FIXTURE_ANCHOR_MS = Date.parse('2026-07-30T00:00:00.000Z')` |
| 3 | `admin.fixtures.ts:331` | `new Date(Date.now() + 30*86_400_000).toISOString()` | `FIXTURE_EXPIRES_VALID` = `new Date(FIXTURE_TODAY_MS + 30*86_400_000).toISOString()` |
| 4 | `admin.fixtures.ts:376` | `new Date(Date.now() - 10*86_400_000).toISOString()` | `FIXTURE_EXPIRES_PAST` = `new Date(FIXTURE_TODAY_MS - 10*86_400_000).toISOString()` |
| 5 | `NotificationBellView.stories.tsx:7` | `const NOW = new Date().toISOString()` | `const NOW = '2026-07-30T00:00:00.000Z'` |
| 6 | `ListingsTab.stories.tsx:17` | `new Date(Date.now() + 30*86_400_000).toISOString()` | `FUTURE = new Date(FIXTURE_TODAY_MS + 30*86_400_000).toISOString()` |
| 7 | `ListingsTab.stories.tsx:18` | `new Date(Date.now() - 10*86_400_000).toISOString()` | `PAST = new Date(FIXTURE_TODAY_MS - 10*86_400_000).toISOString()` |
| 8 | `ListingsTab.stories.tsx:28` | `new Date(Date.now() - 5*86_400_000).toISOString()` | `new Date(FIXTURE_TODAY_MS - 5*86_400_000).toISOString()` |
| 9 | `ListingsTab.stories.tsx:29` | `new Date(Date.now() - 10*86_400_000).toISOString()` | `new Date(FIXTURE_TODAY_MS - 10*86_400_000).toISOString()` |
| 10 | `ListingsTab.stories.tsx:30` | `new Date(Date.now() - 20*86_400_000).toISOString()` | `new Date(FIXTURE_TODAY_MS - 20*86_400_000).toISOString()` (row's `expires_at: null` preserved) |
| 11 | `ListingsTab.stories.tsx:31` | `new Date(Date.now() - 30*86_400_000).toISOString()` | `new Date(FIXTURE_TODAY_MS - 30*86_400_000).toISOString()` |
| 12 | `NotificationItem.stories.tsx:5` | `const NOW = new Date().toISOString()` | `const NOW = '2026-07-30T00:00:00.000Z'` |

## 5. Frozen anchor

**Anchor: `2026-07-30T00:00:00.000Z`** (midnight UTC, the Task 697 kickoff/execution date). Chosen because it is the "today" already in effect when this task's badge/visibility states were last live-computed — freezing to this exact value reproduces, byte-for-byte, what the live code was already computing at the moment of the freeze, rather than an arbitrary date.

**Derived values** (recomputed and verified):

| Site | Offset | Derived value |
|---|---|---|
| ListingCard `created_at` | −2d | `2026-07-28T00:00:00.000Z` |
| cardListingData card 0 (i=0) | −1d | `2026-07-29T00:00:00.000Z` |
| cardListingData card 1 (i=1) | −2d | `2026-07-28T00:00:00.000Z` |
| cardListingData card 2 (i=2) | −3d | `2026-07-27T00:00:00.000Z` |
| cardListingData card 3 (i=3) | −4d | `2026-07-26T00:00:00.000Z` |
| cardListingData card 4 (i=4) | −5d | `2026-07-25T00:00:00.000Z` |
| cardListingData card 5 (i=5) | −6d | `2026-07-24T00:00:00.000Z` |
| cardListingData card 6 (i=6) | −7d | `2026-07-23T00:00:00.000Z` |
| cardListingData card 7 (i=7) | −8d | `2026-07-22T00:00:00.000Z` |
| admin `FIXTURE_EXPIRES_VALID` | +30d | `2026-08-29T00:00:00.000Z` |
| admin `FIXTURE_EXPIRES_PAST` | −10d | `2026-07-20T00:00:00.000Z` |
| NotificationBellView/Item `NOW` | 0d | `2026-07-30T00:00:00.000Z` |
| ListingsTab `FUTURE` | +30d | `2026-08-29T00:00:00.000Z` |
| ListingsTab `PAST` | −10d | `2026-07-20T00:00:00.000Z` |
| ListingsTab row 1 `created_at` | −5d | `2026-07-25T00:00:00.000Z` |
| ListingsTab row 2 `created_at` | −10d | `2026-07-20T00:00:00.000Z` |
| ListingsTab row 3 `created_at` | −20d | `2026-07-10T00:00:00.000Z` |
| ListingsTab row 4 `created_at` | −30d | `2026-06-30T00:00:00.000Z` |

**`LISTING_NEW_DAYS` badge check** (`domain-rules.md:106`, `ListingCard.tsx:98-99`: badge visible when `created_at > Date.now() - 7d`, strict `>`):
- `ListingCard/Default` (−2d): unchanged — well inside the 7-day window, badge stays ON, identical to the live-computed value at freeze time.
- `cardListingData` cards 0–5 (−1…−6d): badge ON, unchanged. Card 6 (−7d, exactly at the boundary, strict `>` excludes it): badge OFF, unchanged. Card 7 (−8d): badge OFF, unchanged. All identical to what live `Date.now()`-based computation would have produced at the freeze moment, since the anchor equals that moment.

**Admin/cabinet visibility-formatter check** (`src/modules/listings/lib/visibility.ts:46`, `isListingPubliclyVisible`, expiry compared against live `new Date()`):
- `admin.fixtures.ts` `lst-001` (status `active`, `+30d`): `requiresUnexpired=true`, unexpired → visible. Unchanged.
- `admin.fixtures.ts` `lst-004` (status `sold`, `-10d`): `publicEligible=false` for `sold` → `status_not_public` regardless of `expires_at` — the frozen value cannot affect this outcome at all. Unchanged.
- `ListingsTab.stories.tsx` rows 1–3 (`active`, `FUTURE`/`PAST`/`null`) and row 4 (`sold`, `PAST`): same reasoning — row 4's `sold` status short-circuits before `expires_at` is consulted. Unchanged.

No badge or visibility state flipped. No stop condition triggered.

## 6. §14 rule text and §14.3 correction

Added `docs/storybook-governance.md` **§14.10 "Fixture wall-clock determinism (Task 697, 2026-07-30)"**, placed after §14.7 (the last `###`-numbered gate sub-section) and before the `## §14.8` major sub-gate. Contents: the failure mode (cross-day PNG drift, citing Task 693's 32-cell/delta-140 incident), the required form (a frozen named anchor constant, modeled on `RangeDatePicker.stories.tsx:79-83`), the gate's exact detection rule (flags `Date.now()` anywhere as a value and bare zero-arg `new Date()`; does not flag `new Date(<non-empty argument>)`), and an explicit note that a component reading live `Date.now()` against a frozen fixture field (the `LISTING_NEW_DAYS` badge, the visibility formatter) is unaffected by this rule and may need anchor revisiting far enough into the future.

§14.3 correction: `checksRan: 13` → `checksRan: 16` and "13 governance checks" → "16 governance checks" in the main bullet; the Check-10 gate-wiring line's "verifies all 13 checks" → "verifies all 16 checks"; the enumerated check list's header `checksRan: 13, updated Task 468` → `checksRan: 16, updated Task 697 2026-07-30`, and items 14 (Button off-scale), 15 (unregistered colour), 16 (wall-clock fixture value) appended to the previously-13-item list.

## 7. I6 — full gate proof

**Step 1 — clean run (final tree):**
```
✅ check:stories PASSED — 127 files checked, 0 violations.
```
Exit 0.

**Step 2 — plant.** `ListingCard.stories.tsx`'s `FIXTURE_CREATED_AT` temporarily reverted to `new Date(Date.now() - 2*24*60*60*1000).toISOString()` (file edit only, no git):
```
❌ check:stories FAILED — 1 violation(s):
  src/stories/mantine/primitives/ListingCard.stories.tsx:36  [wall-clock-fixture-value]
    Line uses Date.now() as a story fixture value. ...
```
Exit code 1 (verified via `echo $?` after the direct npm invocation, not through a pipe).

**Step 3 — revert and re-run.** `FIXTURE_CREATED_AT` restored to `'2026-07-28T00:00:00.000Z'`:
```
✅ check:stories PASSED — 127 files checked, 0 violations.
```
Exit 0.

**Step 4 — three negative controls.**
1. Already-frozen constant (`FIXTURE_CREATED_AT = '2026-07-28T00:00:00.000Z'` at site #1) — present in the clean-run tree throughout; 0 violations proves it stays unflagged.
2. `RangeDatePicker.stories.tsx:79`'s comment mentioning `new Date()` — present throughout; 0 violations proves it stays unflagged.
3. A deterministic `new Date('2026-01-01T00:00:00.000Z')` literal — temporarily added as `const __TASK697_NEGATIVE_CONTROL_C = new Date('2026-01-01T00:00:00.000Z').toISOString()` in `RangeDatePicker.stories.tsx`, gate re-run:
```
✅ check:stories PASSED — 127 files checked, 0 violations.
```
Exit 0 — unflagged. Probe then removed; final re-run confirmed exit 0 and `git status --porcelain` showed no leftover diff on that file.

## 8. Rendered proof — 1184-cell comparison

**`build-storybook`:** exit 0, `storybook-static/` produced, "Storybook build completed successfully".

**`screenshots:assert -- --mantine-only`, run 1** (`.screenshots/rendered-assert/2026-07-30T10-58/`): 1161/1184 PASS, **1 FAIL** (`Patterns/Mantine/HomeSection/Default × uk × mobile-375`, `blank-canvas`), 22 AMBIGUOUS. `HomeSection.stories.tsx` imports none of the 6 files this task touched — investigated as a candidate transient capture flake (same class documented for Task 684).

**`screenshots:assert -- --mantine-only`, run 2** (`.screenshots/rendered-assert/2026-07-30T11-29/`): **1162/1184 PASS, 0 FAIL, 22 AMBIGUOUS** — the `HomeSection` flake cleared on rerun, confirming it was transient and unrelated to this diff.

**Ambiguous set:** unchanged — Combobox 4 (sq/en/uk/it × mobile-390) + `PopularLocationsView/Long City Name` 16 (4 locales × 4 viewports) + Tabs 2 (sq/it × mobile-320) = 22, identical composition to baseline.

**Comparison vs baseline `2026-07-30T08-53`** (persisted at `.screenshots/task697-delta/comparison-final-vs-baseline.txt`): 0 verdict changes, 82 md5-changed cells.

**Partition:**
- **Group (a) — frozen-fixture, expected:** `NotificationBellView/Default` — 16 cells. `ListingCard/Default` and `HomepageListingGrids/Default` (the 32 cells the kickoff predicted would move) show **0 changed cells** — because the chosen anchor (2026-07-30) is the same calendar day the baseline was captured on, so the frozen date-only values are byte-identical to what the baseline's live computation already produced that day. `AdminSurfacePattern/Default` (sites #3/#4): 0 changed cells, matching the kickoff's "not observed to move a cell" prediction — the raw `expires_at` field itself is never rendered as literal text, but **the visibility formatter's output** (the visible valid/expired label, `AdminListingsTable.tsx:313/543/721`) is rendered text and is consumed against the live clock; it did not move in this run only because the frozen anchor still equals today (Task 698 closes this the clock stays frozen going forward — corrected per Task 698 review F4).
  NotificationBellView's 16-cell diff is fully explained: the *stored* `created_at`/`NOW` is frozen, but `NotificationItem.tsx:194` renders `formatDistanceToNow(new Date(notification.created_at), ...)` (`date-fns`) — a **relative-time string computed against the live capture instant**, a production helper explicitly out of scope (A5). Any two captures taken at different real times will show a different "X ago" string even though the underlying fixture is now a literal constant; this is inherent to the relative-time affordance, not a defect in the freeze (Task 698 freezes the Storybook clock itself to close this).
- **Group (b) — measured noise (§3.6 of the kickoff):** `Button` (10), `FiltersPanelShell` (1), `HeroSearch/Fallback` (9), `LocaleSwitcher` (7), `MobileBottomNavView` Authenticated+Guest (4), `PopularLocationsView/Default` (2), `Skeleton` (9), `EmptyLoadingErrorState` (11), `HomepageListingGrids/Loading` (10) = 63 cells, all in the reviewer's declared noise-story set.
- **Freshly-verified noise, not in §3.6's literal list:** `ListingGalleryPattern/Default` (1, max delta ≤2), `ListingDetailPattern/Default` (1, max delta 1), `UserMenu/Default` (1, max delta 203/9070px — an interactive `play`-function dropdown-timing capture, see below). None of these 3 stories import any file this task touched. (`LightboxView/Default` was originally listed here at 2 cells; the Task 698 review's independent recount found 0 — removed per Task 698 review F4.)

**Same-tree zero-code-diff control** (persisted at `.screenshots/task697-delta/sametree-zero-diff-control.txt`): comparing my own two post-fix runs (10-58 vs 11-29 — literally zero code changes between them) reproduces the identical noise pattern, including the same `UserMenu`, `ListingGalleryPattern`, `ListingDetailPattern` movement and the `HomeSection` verdict flip (`fail → pass`, the flake clearing) — direct, session-native proof that every one of these cells is harness noise unrelated to this diff, extending §3.6's reviewer-measured set with fresh same-session evidence rather than asserting it.

No cell fell outside {frozen-fixture, measured-noise}; no unexplained motion.

**Group-(a) pixel-diff table** (persisted at `.screenshots/task697-delta/notificationbellview-bbox-table.txt`, all 16 `NotificationBellView/Default` cells, baseline vs `2026-07-30T11-29`):

| Locale/viewport | diffPixels | maxDelta | bbox |
|---|---|---|---|
| sq/320,375 | 1896 | 84 | (67,562)-(207,781) |
| sq/390 | 1896 | 84 | (67,594)-(207,813) |
| sq/1024 | 1896 | 84 | (113,343)-(253,562) |
| en/320 | 1467 | 84 | (66,543)-(171,781) |
| en/375 | 1467 | 84 | (66,562)-(171,781) |
| en/390 | 1467 | 84 | (66,594)-(171,813) |
| en/1024 | 1467 | 84 | (112,343)-(217,581) |
| uk/320,375 | 1563 | 84 | (66,562)-(177,781) |
| uk/390 | 1563 | 84 | (66,594)-(177,813) |
| uk/1024 | 1563 | 84 | (112,343)-(223,562) |
| it/320,375 | 1353 | 84 | (66,562)-(166,779) |
| it/390 | 1353 | 84 | (66,594)-(166,811) |
| it/1024 | 1353 | 84 | (112,343)-(212,560) |

All 16 bboxes are confined to the notification-list text region (the relative-timestamp text within the dropdown panel); no bbox spans the full card/panel geometry; no layout shift.

## 9. Every command, actual exit code

| Command | Exit | Result |
|---|---|---|
| `git status --porcelain` (I0) | — | empty |
| `npm run check:stories` (baseline) | 0 | 0 violations, 127 files, `checksRan: 15` |
| `npm run check:design-tokens` (baseline) | 1 | 43/0 stale (expected — strict mode) |
| `npm run check:story-coverage` (baseline) | 0 | 15/15 |
| `npm run check:i18n` (baseline) | 0 | 2215×4 |
| `npm run check:stories` (final, clean) | 0 | 0 violations, 127 files, `checksRan: 16` |
| `npm run check:stories` (I6 planted) | 1 | 1 violation, exact file+line named |
| `npm run check:stories` (I6 reverted) | 0 | 0 violations |
| `npm run check:stories` (I6 negative control C) | 0 | 0 violations |
| `npx vitest run scripts/__tests__/check-stories.test.ts` | 0 | 111/111 passed |
| `npm run typecheck` | 0 | no errors |
| `npm run check:design-tokens` (final) | 1 | 43/0 stale — unchanged |
| `npm run check:story-coverage` (final) | 0 | 15/15 |
| `npm run check:i18n` (final) | 0 | 2215×4, zero new keys |
| `npx vitest run` (full suite) | 1 | 1182/1184 — 2 failures = documented run-varying timeout pair (`date-format-ssr-parity`, `RangeDatePicker`) |
| `npx vitest run` (isolated: the 2 timeout files) | 0 | 39/39 passed |
| `npm run build-storybook` | 0 | "Storybook build completed successfully" |
| `npm run screenshots:assert -- --mantine-only` (run 1) | 0 | 1161/1184 PASS, 1 FAIL (transient), 22 AMBIGUOUS |
| `npm run screenshots:assert -- --mantine-only` (run 2) | 0 | 1162/1184 PASS, 0 FAIL, 22 AMBIGUOUS |
| `npm run build` | 0 | 40/40 static pages, route table below |
| `npm run check:file-integrity` (after records) | 0 | 12/12 files clean |
| `npm run check:mojibake` (after records) | 0 | 0 artifacts in 2010 files |

**`npm run build` tail (verbatim, including route table):**
```
 ✓ Compiled successfully in 57s
   Skipping linting
   Checking validity of types ...
   Collecting page data ...
   Generating static pages (0/40) ...
   Generating static pages (10/40)
   Generating static pages (20/40)
   Generating static pages (30/40)
 ✓ Generating static pages (40/40)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                                 Size  First Load JS  Revalidate  Expire
┌ ƒ /                                      379 B         185 kB
├ ƒ /_not-found                          1.16 kB         185 kB
├ ƒ /[locale]                            7.12 kB         618 kB
├ ƒ /[locale]/[slug]                       377 B         185 kB
├ ƒ /[locale]/auth/confirm-email         2.18 kB         192 kB
├ ƒ /[locale]/auth/login                 1.42 kB         265 kB
├ ƒ /[locale]/auth/register              1.41 kB         265 kB
├ ƒ /[locale]/auth/reset-password        6.43 kB         284 kB
├ ƒ /[locale]/auth/verified              2.27 kB         258 kB
├ ƒ /[locale]/cabinet                     149 kB         763 kB
├ ƒ /[locale]/contact                    5.44 kB         230 kB
├ ƒ /[locale]/favorites                  5.25 kB         577 kB
├ ƒ /[locale]/listings                   12.8 kB         585 kB
├ ƒ /[locale]/listings/[slug]              381 B         581 kB
├ ƒ /[locale]/listings/[slug]/edit       2.36 kB         251 kB
├ ƒ /[locale]/listings/create            2.37 kB         251 kB
├ ƒ /admin                               5.02 kB         371 kB
├ ƒ /admin/companies                     6.84 kB         304 kB
├ ƒ /admin/currency                      8.66 kB         300 kB
├ ƒ /admin/email-templates                 10 kB         254 kB
├ ƒ /admin/footer                        6.26 kB         232 kB
├ ƒ /admin/inquiries                       379 B         185 kB
├ ƒ /admin/inquiries/sales                 336 B         368 kB
├ ƒ /admin/inquiries/support               335 B         368 kB
├ ƒ /admin/legal                           379 B         185 kB
├ ƒ /admin/listings                        10 kB         422 kB
├ ƒ /admin/listings/[id]/preview           380 B         581 kB
├ ƒ /admin/locations                     9.92 kB         261 kB
├ ƒ /admin/pages                         10.3 kB         264 kB
├ ƒ /admin/permissions                   8.93 kB         219 kB
├ ƒ /admin/popular-locations             9.23 kB         260 kB
├ ƒ /admin/property-types                7.33 kB         292 kB
├ ƒ /admin/reports                       21.2 kB         287 kB
├ ƒ /admin/settings                      7.58 kB         221 kB
├ ƒ /admin/support                       8.51 kB         408 kB
├ ƒ /admin/users                         5.02 kB         483 kB
├ ƒ /admin/users/[id]                      381 B         599 kB
├ ƒ /admin/users/new                       381 B         599 kB
├ ƒ /api/auth-email-hook                   378 B         185 kB
├ ƒ /api/auth/me                           378 B         185 kB
├ ƒ /api/cron/inactivity                   377 B         185 kB
├ ƒ /api/cron/listings-expiry              378 B         185 kB
├ ƒ /api/cron/price-alerts                 379 B         185 kB
├ ƒ /api/cron/saved-searches               377 B         185 kB
├ ○ /api/exchange-rate                     379 B         185 kB          1h      1y
├ ƒ /api/listings                          377 B         185 kB
├ ƒ /api/listings/[slug]/view              379 B         185 kB
├ ƒ /api/presence                          379 B         185 kB
├ ƒ /api/property-types                    379 B         185 kB
├ ƒ /api/upload-avatar                     378 B         185 kB
├ ƒ /api/upload-company-logo               378 B         185 kB
├ ƒ /api/upload-popular-location-photo     378 B         185 kB
├ ƒ /auth/callback                         378 B         185 kB
└ ƒ /auth/confirm                          378 B         185 kB
+ First Load JS shared by all             184 kB
  ├ chunks/3434-d783bd2ce108b504.js       126 kB
  ├ chunks/4bd1b696-ad216e4073dcea52.js  54.4 kB
  └ other shared chunks (total)          4.19 kB

ƒ Middleware                              165 kB

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

## 10. Deviations

1. **Census widened 5→12 sites mid-execution (D24).** The kickoff's own census (§3.2) was scoped only to `src/stories/`; Check 16 at its natural `STORY_FILES` scope found 7 more live sites. Reason: `STORY_FILES` (the scope every other check already uses) is a strict superset of `src/stories/`. Resolved by owner amendment D24 before proceeding — see §4.
2. **0 of the predicted 32 `ListingCard`/`HomepageListingGrids` cells changed**, versus the kickoff's "at least 32 enrolled cells" framing. Reason: the anchor was deliberately chosen to equal the baseline's own capture day, so the frozen date-only values are byte-identical to what was already captured live. This is a stronger, not weaker, proof — the frozen constant exactly reproduces the last known-good value and will stay that way on every future capture, regardless of day. Recorded per §13.1's own guidance to state the structural nature of this proof rather than imply a cross-day capture was performed.
3. **1 transient `blank-canvas` FAIL on the first rendered run** (`HomeSection/uk/mobile-375`), cleared on an immediate rerun with zero code changes. `HomeSection.stories.tsx` imports none of the 6 files this task touched. Treated as a capture flake (same class as Task 684's documented "font-loading-flake FAIL on first run, cleared on rerun"); the final run (`2026-07-30T11-29`) is the one reported as **0 FAIL** throughout this log.
4. **3 changed cells (`UserMenu`, `ListingGalleryPattern`, `ListingDetailPattern`) fall outside §3.6's literally-declared noise-story list.** Verified via a same-tree zero-code-diff control (comparing this session's own two post-fix runs) that all 3 move with zero code changes — extending, not contradicting, §3.6's noise floor with fresh same-session evidence, per D10's per-story-attribution methodology. (Originally logged as 4, including `LightboxView` at 2 cells — the Task 698 review's independent recount found 0 for `LightboxView`; corrected per Task 698 review F4.)

## 11. Limitations

- **Rendered-proof width path:** `--mantine-only` at 320/375/390/1024/1200/1440/1536 × 4 locales, per the declared Q4 proof path (§13.1 of the kickoff). Remaining canonical widths stay Task 678's scope.
- **Cross-day drift is proven structurally, not by a cross-day capture.** The harness has no clock control; this task cannot literally demonstrate a capture taken tomorrow is identical to one taken today. The proof is structural: every fixture value is now a literal constant or an arithmetic derivation from one (AC1), the gate blocks any regression to a live wall-clock value (AC4), and the rule is written (AC2).
- **Other non-determinism classes are out of scope.** `Math.random()`, Mantine's auto-generated element IDs (§14.9.4), and the component catalog's own `new Date()` header stamp (`storybook-governance.md:1109`) are untouched; Check 16 targets wall-clock *values in fixtures* only.
- **`.screenshots/` evidence is local-only**, per D6 (`.gitignore:55`) — not part of the committed diff.
- **The relative-time affordance in `NotificationItem.tsx`/`NotificationBellView` will always show some drift between any two captures taken at different real times**, even though the underlying fixture is now frozen — `formatDistanceToNow` computes against the live capture instant, and that helper is production code, out of scope (A5). This is inherent to the affordance, not a defect in this task's fix.
- **The chosen anchor (2026-07-30) is a snapshot of "today" at freeze time.** Both badge-affordance checks (§5) hold today; per the new §14.10 rule, they may need revisiting if a future task depends on those exact badge states after enough real time has passed.

## Backlog update

See `docs/backlog.md` (this session, kept at 80 lines).
