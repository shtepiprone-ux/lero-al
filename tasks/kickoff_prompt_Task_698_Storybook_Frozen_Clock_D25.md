# Task 698 — Freeze the Storybook clock (D25), and close Task 697's review findings

## 1. Mode and task type

- **Mode:** implementation (Sonnet executor, via `.claude/skills/execute-task/SKILL.md`).
- **Primary task type:** Storybook / visual-proof governance — **rendered-gate determinism infrastructure**
  (`docs/rule-index.md` → "Storybook / Visual Proof").
- **Secondary types:** gate correction (Check 16 precision); governance-doc accuracy.
- **Origin:** Task 697 review, decision `NEEDS REVISION` (2026-07-30), findings **F1**–**F4**. Owner decision **D25**
  (2026-07-30) selects the fix.

> **Read this first.** Task 697 froze the *fixtures* but not the *clock*. Half of every date comparison is still
> live, so three enrolled stories still drift across days — one of them worse than before 697. This task freezes the
> other half. Task 697 stays unapproved until this lands; the two are reviewed together.

---

## 2. Objective

1. Freeze the wall clock inside the Storybook preview iframe to the **same anchor the fixtures already use**, so both
   halves of every date comparison are frozen and a capture on any calendar day is byte-identical.
2. Restore `NotificationBellView`'s pre-697 rendered content and remove the three dated affordance flips 697
   scheduled (F1, F2).
3. Correct Check 16's comment/string handling so it stops false-flagging trailing comments and string literals (F3).
4. Correct the governance-doc and session-log inaccuracies the 697 review recorded (F4).

---

## 3. Verified context

Every fact below was read or executed in the worktree on branch `task/q0-ci-rendered-locale-split` on 2026-07-30,
during the Task 697 review. Nothing is inferred from a filename or a prior report.

### 3.1 Owner decisions

| ID | Question | Ruling |
|---|---|---|
| **D6** (Task 684, standing) | `.screenshots/` visibility. | **Local-only** per `.gitignore:55`. |
| **D10** (Task 685 review, standing) | Comparator for non-target cells. | **0 verdict changes** + per-story attribution. |
| **D23 / D24** (Task 697, standing) | Freeze fixtures, write §14.10, gate it at full `STORY_FILES` scope. | Stands. This task does **not** revert any of it. |
| **D25** (this task, 2026-07-30) | How to freeze a date when the *component* reads the live clock? | **Freeze the clock in Storybook.** A `preview-head.html` script pins `Date.now()` and zero-argument `new Date()` inside the preview iframe. Rejected: reverting sites #5/#12 with a Check-16 exemption (leaves F2's dated flips); accepting and documenting only (leaves §14.10 a rule Task 697 itself violates). |

### 3.2 Why 697's fix is incomplete — the three live-clock consumers, read in source

| Consumer | Line | Reads live clock as | Consequence of 697 as shipped |
|---|---|---|---|
| `src/modules/notifications/components/NotificationItem.tsx` | `:194` | `formatDistanceToNow(new Date(created_at))` | `NOW` frozen at `2026-07-30T00:00:00.000Z` → renders `"about 12 hours ago"` today, `"1 day"` tomorrow, `"3 months"` in autumn. **Before 697 it rendered `"less than a minute ago"` on every capture, every day** — 697 turned a cross-day-stable story into a drifting one. 16 enrolled cells. |
| `src/modules/listings/components/ListingCard.tsx` | `:98-99` | `new Date(created_at) > new Date(Date.now() - LISTING_NEW_DAYS*86400000)` | `ListingCard/Default`'s "new" badge flips **OFF on 2026-08-04**, permanently. `HomepageListingGrids/Default` loses one badge per day to ~**2026-08-06** (8 cards at anchor −1…−8d). A badge is geometry, not text. 32 enrolled cells. |
| `src/components/admin/AdminListingsTable.tsx` | `:313`, `:543`, `:721` | `formatVisibility({status, expires_at})` rendered as visible text | `FIXTURE_EXPIRES_VALID = 2026-08-29` → `lst-001` (`active`) flips visible→expired on **2026-08-30**; `ListingsTab` row 1 likewise. Task 697's session log §8 claimed `expires_at` is "never rendered as literal text" — the raw field is not, but the formatter's **output** is. |

### 3.3 The install point — verified

- `.storybook/preview-head.html` exists (543 B, currently three `<link>` tags for Open Sans). Storybook injects it
  into the preview iframe `<head>` **before the story bundle loads**, which is the only point early enough: fixture
  constants like `NotificationBellView.stories.tsx:9` evaluate at *module scope*, before any decorator runs. A
  `decorators` entry in `preview.tsx` is therefore **too late** and must not be used for the freeze.
- `.storybook/preview.tsx:198` exports four global decorators (`withTheme, withMantine, withLocale, withCanvas`).
  This task adds none.

### 3.4 Play-function safety — verified, this is the main risk and it is cleared

Ten story files use `play:`: `AdminListingsTable`, `AdminLocaleSwitcher`, `AdminReportsManager`,
`ListingFormShellView`, `CopyIdButton`, `ScrollArea`, `Slider`, `UserMenu`, `ListingGalleryPattern`,
`PlantedVisualViolations`.

The obvious failure mode of a frozen clock is that in-page timeout logic never expires and the capture hangs. Read in
the installed source, `node_modules/@testing-library/dom/dist/wait-for.js` drives its timeout with
`setTimeout(handleTimeout, timeout)` at `:40` and `setInterval(checkRealTimersCallback, interval)` at `:91` — timer
APIs, **not** `Date.now()` polling. Playwright's own timeouts run in the driver process, outside the page. So a
frozen `Date` does not stall `waitFor`. **This is a read fact, not an assumption — but it is still the highest-risk
area of this task, so R6 requires all ten play stories to be proven captured, not sampled.**

### 3.5 The anchor — reuse, do not invent

Task 697 already froze every fixture to **`2026-07-30T00:00:00.000Z`** (session log §5). The frozen clock MUST use
the identical instant. That choice, and only that choice, makes every affordance permanently identical to its
current state:

| Affordance | Fixture value | vs frozen now `2026-07-30T00:00:00.000Z` | Resulting state |
|---|---|---|---|
| `NotificationBellView` / `NotificationItem` `NOW` | `2026-07-30T00:00:00.000Z` | delta 0 | `"less than a minute ago"` — **identical to pre-697** |
| `ListingCard` `created_at` | `2026-07-28` | −2d, inside 7d | badge **ON**, permanently |
| `cardListingData` cards i=0…7 | −(i+1)d | −1…−8d, boundary strict `>` at −7d | **6 ON / 2 OFF**, permanently — identical to today |
| `admin` `FIXTURE_EXPIRES_VALID` | `2026-08-29` | +30d | **unexpired**, permanently |
| `admin` `FIXTURE_EXPIRES_PAST` | `2026-07-20` | −10d | **expired**, permanently |
| `ListingsTab` `FUTURE` / `PAST` | same +30d / −10d | | unchanged, permanently |

**Do not pick a different anchor.** Any other value changes at least one affordance and re-opens F2.

### 3.6 Duplication constraint — and how it must be gated

`preview-head.html` is raw HTML; it cannot `import`. The anchor literal will therefore exist in two places: the
inline script, and the fixtures. A silent divergence between them would restore F1/F2 without any gate noticing.
R4 exists solely to make that divergence impossible.

### 3.7 Baseline

| Comparator | Value | Source |
|---|---|---|
| rendered matrix | `.screenshots/rendered-assert/2026-07-30T11-29/` — 1184 cells, **1162 pass, 0 fail, 22 ambiguous** | Task 697 final run; reviewer independently recomputed the manifest summary, verdict set and per-story md5 partition from the persisted PNGs |
| ambiguous set | Combobox 4 + `PopularLocationsView/Long City Name` 16 + Tabs 2 = **22** | reviewer re-derived |
| `check:stories` | 0 violations, **127 files**, `checksRan: 16` | reviewer re-ran `runGate()` directly |
| `check-stories.test.ts` | **111/111** | owner-native run, 2026-07-30 14:17 |
| `check:design-tokens` | 43 / 0 stale, **exits 1** | Task 697 §9; pre-existing, not a regression |

**Harness noise floor**, reviewer-measured on `08-53` vs `11-29` and on Task 697's own same-tree control:
`EmptyLoadingErrorState` 11, `Button` 10, `HomepageListingGrids/Loading` 10, `HeroSearch/Fallback` 9, `Skeleton` 9,
`LocaleSwitcher` 7, `MobileBottomNavView` 4, `PopularLocationsView/Default` 2, `FiltersPanelShell` 1, `UserMenu` 1,
`ListingGalleryPattern` 1, `ListingDetailPattern` 1 = **66 cells**. Note `LightboxView` is **not** in this set —
Task 697's log listed it at 2 cells, but the reviewer's recount found 0 (F4).

### 3.8 Start state

Task 697's diff is **uncommitted and unapproved**: 11 modified paths + 1 untracked session log, listed in Task 697
session log §2. A stale zero-byte `.git/index.lock` was present at review time. Expect Task 697's paths dirty at I0;
they are **in scope for this task**, not `EXCLUDED AS UNRELATED` — 697 and 698 will be reviewed and committed
together.

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification |
|---|---|---|---|---|
| R1 | D25, §3.3 | `.storybook/preview-head.html` gains an inline `<script>` that, before the story bundle loads, replaces `window.Date` so that `Date.now()` returns the frozen instant and zero-argument `new Date()` yields the frozen instant. All other `Date` behaviour is preserved exactly: `new Date(args…)` for every argument form, `Date.parse`, `Date.UTC`, `Date.prototype`, `instanceof Date`, subclassing, and `Date` as a function call. | P0 | AC1 |
| R2 | §3.5 | The frozen instant is **`2026-07-30T00:00:00.000Z`** — byte-identical to Task 697's fixture anchor. | P0 | AC1 |
| R3 | F1, F2, §3.2 | With the clock frozen: `NotificationBellView` renders its pre-697 relative-time string; `ListingCard`'s "new" badge is ON; `HomepageListingGrids` shows 6 ON / 2 OFF; admin/`ListingsTab` visibility states are unchanged. None of these can change on any future calendar day. | P0 | AC2, AC5 |
| R4 | §3.6 | A machine check fails the build if the `preview-head.html` literal and the fixture anchor diverge. Implement as a **new unit test** in `scripts/__tests__/` that parses both sources and asserts equality — not a comment, not a convention. | P0 | AC3 |
| R5 | F3 | Check 16 no longer flags `Date.now()`/`new Date()` occurring **inside a trailing line comment** or **inside a string literal**, and now does flag a `new` / `Date()` pair split across lines. The five existing Check-16 tests still pass; three new tests cover exactly these forms. | P1 | AC4 |
| R6 | §3.4 | All **ten** `play:` story files capture successfully under the frozen clock — no hang, no timeout, no new FAIL. Scan the full set, never a sample. | P0 | AC5 |
| R7 | F4 | Corrections: Task 697 session log §3's "2 places" → 3; §8's `LightboxView` row removed (real partition is 63 noise + 16 `NotificationBellView` + `UserMenu` 1 + `ListingGalleryPattern` 1 + `ListingDetailPattern` 1 = 82); §8's "never rendered as literal text" claim corrected per §3.2; §14.3's item-16 text drops the untrue "governance-doc citations" clause; §14.10 gains the frozen-clock mechanism and its "Interaction with a date-dependent affordance" paragraph is rewritten — the affordance is now **also** frozen, so the "revisit the anchor" caveat is obsolete. | P1 | AC6 |
| R8 | F4 | `docs/storybook-governance.md` §14.10 is **relocated** to sit after `## §14.9`'s sub-sections in reading order, or renumbered, so the document no longer reads 14.1…14.7, 14.10, 14.8, 14.9. | P3 | AC6 |
| R9 | cl. 9, 7, 14 | `npm run build` exits 0; `typecheck`, `check:stories` (0 / 127 files / `checksRan: 16`), `check:story-coverage` (15/15), `check:i18n` (2215×4, zero new keys), `check:file-integrity`, `check:mojibake` all exit 0; `check:design-tokens` 43/0 stale unchanged; `npx vitest run` shows no new failure attributable to this diff. | P0 | AC7 |

---

## 5. Assumptions and open questions

- **A1 — pixels are supposed to change here, in a known direction.** `NotificationBellView/Default`'s 16 cells should
  move **back toward** their pre-697 content. Any other enrolled story that moves must be attributed to §3.7's noise
  set or is a **stop and report**.
- **A2 — do not touch production code.** `NotificationItem.tsx`, `ListingCard.tsx`, `AdminListingsTable.tsx` and
  every `src/lib/**` date helper stay untouched. The whole point of D25 is that the fix lives in Storybook
  infrastructure. If the freeze appears to require a production change, **stop and report**.
- **A3 — do not revert Task 697.** All 12 frozen fixture sites, §14.10 and Check 16 stay. This task completes them.
- **A4 — do not change the anchor** (§3.5). It is fixed by D25 and by 697's already-written fixtures.
- **A5 — the freeze must be inert outside Storybook.** `preview-head.html` is loaded only by the preview iframe;
  confirm no `src/` code, no test setup and no Next.js build path reads it. A frozen clock leaking into `npm run
  build` or `vitest` is a **stop and report**.
- **A6 — Mantine/Playwright interaction is the residual unknown.** §3.4 clears `waitFor`. If any component throttles
  or animates on `Date.now()` deltas and now divides by zero or spins, **stop and report** with the story named.

**Open questions — none.** D25 settles the mechanism; §3.5 settles the anchor.

---

## 6. Pre-read rule bundle

1. `docs/agent-contract.md` — clauses 1, 3, 7, 9, 12, 13, 14.
2. `docs/rule-index.md` — "Storybook / Visual Proof".
3. `docs/qa-profiles.md` — the **Q3** row and the viewport policy section.
4. `docs/storybook-governance.md` — **§14.10 as Task 697 wrote it**, plus §14.3's enumerated check list.
5. `docs/qa-rules.md` — validation and encoding rules.
6. `docs/domain-rules.md` — **`:100-115`** (`LISTING_NEW_DAYS`).
7. `docs/backlog.md` — the numbering line; **exactly 80 lines**, must not grow.

**Source pre-read**

8. `.storybook/preview-head.html` (all 6 lines) and `.storybook/preview.tsx:193-200` (decorator export).
9. `src/modules/notifications/components/NotificationItem.tsx:190-200`;
   `src/modules/listings/components/ListingCard.tsx:95-105`;
   `src/components/admin/AdminListingsTable.tsx:305-320`.
10. `scripts/check-stories.mjs` — the Check 16 block (`:1021-1057`) added by Task 697.
11. `scripts/__tests__/check-stories.test.ts:882-935` — the five Check-16 tests.
12. `docs/sessions/2026-07-30-task697-deterministic-fixture-dates.md` — §5 (the anchor and its derived values) and
    §8 (the partition being corrected by R7).

---

## 7. Scope

| Path | Action | Why |
|---|---|---|
| `.storybook/preview-head.html` | modify | R1, R2 — the frozen-clock script |
| `scripts/__tests__/preview-clock-anchor.test.ts` | **create** | R4 — anchor-divergence gate |
| `scripts/check-stories.mjs` | modify | R5 — Check 16 comment/string precision |
| `scripts/__tests__/check-stories.test.ts` | modify | R5 — 3 new tests |
| `docs/storybook-governance.md` | modify | R7, R8 — §14.10 rewrite + relocation, §14.3 item-16 text |
| `docs/sessions/2026-07-30-task697-deterministic-fixture-dates.md` | modify | R7 — correct §3, §8 |
| `docs/backlog.md` | modify | Update 697/698 state. **Stay at 80 lines.** |
| `docs/sessions/2026-07-30-task698-storybook-frozen-clock.md` | **create** | Session log per §14 |

Evidence under `.screenshots/task698-delta/`; `.screenshots/rendered-assert/2026-07-30T11-29/` is a **read-only
baseline**.

## 8. Out of scope

- **Any production component or date helper** (A2).
- **Reverting or re-litigating Task 697's D23/D24**, its 12 frozen sites, §14.10's existence, or Check 16's scope.
- **Other non-determinism classes** — `Math.random()`, Mantine auto-generated element IDs (§14.9.4), the component
  catalog's `new Date()` header stamp.
- **Check 16's `STORY_FILES` scope blind spot** (a fixture module outside `src/stories/` and outside
  `*.stories.*`). Recorded as a review NOTE; no live gap exists today. Follow-up if it ever does.
- **`check:design-tokens`' pre-existing exit 1.**
- **Any mutating Git command.**

## 9. Current and required behavior

**Current.** Task 697 froze all 12 fixture date values but left the clock live. Three production components still
call `Date.now()` / `formatDistanceToNow` at render time against those now-frozen fields, so `NotificationBellView`
drifts on every capture (worse than before 697), `ListingCard`'s and `HomepageListingGrids`' "new" badges are
scheduled to flip between 2026-08-04 and 2026-08-06, and the admin visibility label flips on 2026-08-30. §14.10
documents this as a caveat to be "revisited", with no gate and no date.

**Required after.** The preview iframe's clock is pinned to `2026-07-30T00:00:00.000Z` before any story module
evaluates, so both halves of every date comparison are frozen. `NotificationBellView` renders its pre-697 string,
every badge and visibility state is permanently identical to today's, and no scheduled flip remains. A unit test
fails the build if the inline anchor and the fixture anchor ever diverge. Check 16 stops false-flagging trailing
comments and string literals. §14.10 describes the complete two-sided mechanism, and Task 697's session log matches
the real partition. No production code, component behaviour, or locale string changes.

## 10. Implementation requirements

**I0 — start protocol (before any write).** `git status --porcelain`; record verbatim. Expect Task 697's 11 modified
paths + 1 untracked session log (§3.8). Classify each; anything else → **stop and report**. Do not clear
`.git/index.lock` — that is owner-only.

**I1 — baseline gates on the untouched tree.** Record actual output for `npm run check:stories` (expect 0, 127
files, `checksRan: 16`), `npx vitest run scripts/__tests__/check-stories.test.ts` (111/111),
`npm run check:story-coverage` (15/15), `npm run check:i18n` (2215×4), `npm run check:design-tokens` (43/0, exit 1).

**I2 — write the frozen-clock script (R1, R2).** Inline `<script>` in `.storybook/preview-head.html`, before the
font `<link>`s, with a comment citing Task 698 / D25 / §14.10. It must preserve every `Date` behaviour listed in R1.
Enumerate in the log which behaviours you preserved and how you verified each — a `Date` shim that breaks
`instanceof`, `Date.parse`, or `new Date(iso)` will corrupt every date-bearing story silently.

**I3 — anchor-divergence gate (R4).** `scripts/__tests__/preview-clock-anchor.test.ts` reads
`.storybook/preview-head.html` and at least one Task 697 fixture source, extracts both ISO literals, and asserts
equality. Prove it with a **planted divergence**: change one literal, show the test fails naming both values, revert,
show it passes. Quote all three transcripts.

**I4 — Check 16 precision (R5).** Strip line comments and string literals before matching; handle the `new` /
`Date()` line split. Add three tests covering: a trailing comment mentioning `new Date()`; a string literal
containing `new Date()`; a `new` ⏎ `Date()` split. The five existing Check-16 tests and `checksRan === 16` must still
pass. **Do not widen Check 16's file scope** (§8).

**I5 — rendered proof (R3, R6).** `npm run build-storybook`, then `npm run screenshots:assert -- --mantine-only`,
compared against `.screenshots/rendered-assert/2026-07-30T11-29/`:

1. All 1184 cells: **0 FAIL, 0 verdict changes**; ambiguous set still 4/16/2 = 22.
2. Partition every md5-changed cell into (a) `NotificationBellView/Default`, (b) §3.7's measured noise set. Any cell
   in neither is a **stop and report**. Quote counts per story.
3. For `NotificationBellView/Default`, show the rendered relative-time string is the pre-697 one, in all four
   locales — read it out of the PNG or the DOM, do not infer it.
4. **Name all ten §3.4 play stories explicitly** with their captured verdicts. A hang, timeout or new FAIL on any of
   them is a **stop and report** naming the story.
5. Persist under `.screenshots/task698-delta/`.

**I6 — affordance proof (R3).** For each of the six rows in §3.5's table, show the rendered state under the frozen
clock and state that it is now clock-independent. The `HomepageListingGrids` row must show the **6 ON / 2 OFF** split
explicitly.

**I7 — records corrections (R7, R8).** Apply every correction listed in R7 to `docs/storybook-governance.md` and to
Task 697's session log, and relocate/renumber §14.10 per R8. Quote the before/after of each edit.

**I8 — gate checks (R9).** `npm run typecheck`, `check:stories`, `check:story-coverage`, `check:i18n`,
`check:design-tokens`, `npx vitest run`. For vitest: the documented full-run-only timeout set is
`date-format-ssr-parity`, `RangeDatePicker`, `saveSavedSearch.dedup`, and **which two of the three time out varies by
run** — report the pair observed plus an isolated re-run of exactly those files.

**I9 — `npm run build` runs last** and must exit 0. Quote the transcript tail **including the route table**. Confirm
explicitly that the frozen clock did not leak into the build (A5).

**I10 — records, then encoding gates.** Session log per §14; update `docs/backlog.md` in place (**80 lines**; flag
`BACKLOG LIMIT BREACH` if you cannot). Then `check:file-integrity` and `check:mojibake` **after** the records exist;
quote the file counts.

**Order of operations:** I0 → I1 → I2 → I3 → I4 → I5 → I6 → I7 → I8 → I9 → I10.

## 11. Positive and negative flows

### Positive flow

A reviewer captures the `--mantine-only` matrix today and another captures it three months later from the same
commit. The PNGs are byte-identical: the notification list still reads "less than a minute ago", `ListingCard` still
shows its "new" badge, the homepage grid still shows exactly six of eight cards badged, and the admin table still
reads one listing valid and one expired. A developer who changes the anchor in one of the two places gets a failing
unit test naming both values.

### Negative-flow applicability table

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---|---|---|---|
| **Cross-day capture** | **Yes** | D25, §3.2 | Byte-identical PNGs — the objective | AC5 |
| **`play` function hangs under a frozen clock** | **Yes** | §3.4, R6 | All 10 play stories capture; a hang is a stop | AC5 |
| **`Date` shim breaks a preserved behaviour** | **Yes** | R1 | `new Date(iso)`, `Date.parse`, `Date.UTC`, `instanceof` all intact | AC1 |
| **Anchor literals diverge** | **Yes** | R4 | Unit test fails naming both values | AC3 |
| **Frozen clock leaks outside Storybook** | **Yes** | A5 | `build` and `vitest` see a real clock; a leak is a stop | AC7 |
| **Check 16 becomes over- or under-broad** | **Yes** | R5 | 3 new + 5 existing tests all pass | AC4 |
| **A story outside {NotificationBellView, noise} moves** | **Yes** | A1 | Stop and report | AC5 |
| **Component throttles on `Date.now()` deltas** | **Yes** | A6 | Stop and report naming the story | AC5 |
| **All four locales** | **Yes** | cl. 7 | Relative-time string verified in sq/en/uk/it; zero new keys | AC5, AC7 |
| **Small viewport (<640)** | **Yes** | cl. 11, 12 | `noHorizontalOverflow` stays true at 320/375/390 | AC5 |
| Validation / authorization / RLS | No | Story infrastructure only; no data path, write, or permission boundary | N/A | — |
| Critical-flow regression | No | No `docs/critical-flow-registry.md` row covers Storybook infrastructure | N/A | — |
| RTL | No | Project has no RTL locale | N/A | — |

## 12. Acceptance criteria

- **AC1 [R1, R2]** — *Given* `.storybook/preview-head.html`, *then* it contains a pre-bundle inline script pinning
  `Date.now()` and zero-arg `new Date()` to `2026-07-30T00:00:00.000Z`, and each preserved behaviour in R1 is
  individually demonstrated (`new Date(iso)`, `new Date(ms)`, `new Date(y,m,d)`, `Date.parse`, `Date.UTC`,
  `instanceof`, `Date()` as a call).
- **AC2 [R3]** — *Given* the frozen clock, *then* `NotificationBellView/Default` renders the pre-697 relative-time
  string in all four locales, read from the render, not inferred.
- **AC3 [R4]** — *Given* `scripts/__tests__/preview-clock-anchor.test.ts`, *then* it passes on the final tree, fails
  on a planted divergence naming both values, and passes again after revert. All three transcripts quoted.
- **AC4 [R5]** — *Given* `npx vitest run scripts/__tests__/check-stories.test.ts`, *then* it passes with 3 new
  Check-16 tests (trailing comment, string literal, split `new`/`Date()`), the 5 existing ones, and
  `checksRan === 16`.
- **AC5 [R3, R6]** — *Given* a fresh `build-storybook` + `--mantine-only` run vs `2026-07-30T11-29`, *then* 1184
  cells show **0 FAIL, 0 verdict changes**, the ambiguous set is 4/16/2 = 22, every md5-changed cell is
  `NotificationBellView/Default` or §3.7 noise with counts per story and none outside both, all ten play stories are
  named with their verdicts, and §3.5's six affordance rows are each shown in their expected state including the
  6 ON / 2 OFF grid split.
- **AC6 [R7, R8]** — *Given* `docs/storybook-governance.md` and Task 697's session log, *then* every correction in R7
  is applied with before/after quoted, and §14.10 no longer precedes §14.8/§14.9 in reading order.
- **AC7 [R9]** — `npm run build` exits 0 on a fresh transcript (quote the tail **including the route table**) with an
  explicit no-leak confirmation; `typecheck` 0, `check:stories` 0 at 127 files / `checksRan: 16`,
  `check:story-coverage` 15/15, `check:i18n` 0 at 2215×4 with zero new keys, `check:design-tokens` 43/0 unchanged,
  `check:file-integrity`/`check:mojibake` 0 **after** the records exist (quote counts), and `vitest` with no new
  failure beyond the documented run-varying pair.

## 13. QA profile and verification plan

### 13.1 Profile

**`Q3 — rendered visual change`**, per `docs/qa-profiles.md`, with a Q4-style planted-failure proof carried for R4's
new gate (AC3) and R5's corrected gate (AC4). It is not full Q4: no new build-failing `check:stories` check is
authored — Check 16 is corrected, not created — but a new build-failing unit gate is, so its planted-divergence
proof is mandatory.

**Declared proof path.** `--mantine-only` over the 67 enrolled stories / 1184 cells at 4 locales × 7 viewports
(320/375/390/1024/1200/1440/1536). Remaining canonical widths stay **Task 678's** scope.

**What this task can finally prove that 697 could not.** With the clock frozen, cross-day determinism becomes
*structurally complete*: both halves of every comparison are constants. It is still not a literal cross-day capture,
but unlike 697 there is no live input left in the render path. State this precisely; do not claim a cross-day capture
was performed.

**TailAdmin side-by-side: not required.** No visual value changes.

### 13.2 Worktree

Starts dirty with Task 697's unapproved diff (§3.8). Those paths are **in scope**, not excluded. Snapshot
`git status --porcelain` at I0 and classify every entry; anything outside 697's 12 paths → **stop and report**.

### 13.3 Gates

| Command | Expected |
|---|---|
| `npm run check:stories` | 0 — 127 files, `checksRan: 16` |
| `npx vitest run scripts/__tests__/check-stories.test.ts` | 114/114 (111 + 3 new) |
| `npx vitest run scripts/__tests__/preview-clock-anchor.test.ts` | passes; planted divergence fails naming both values |
| `npm run typecheck` | 0 |
| `npm run check:story-coverage` | 0 — 15/15 |
| `npm run check:i18n` | 0 — 2215×4, zero new keys |
| `npm run check:design-tokens` | 43 / 0 stale (exit 1, pre-existing) |
| `npm run build-storybook` | 0 |
| `npm run screenshots:assert -- --mantine-only` | 0 FAIL, 0 verdict changes, ambiguous 22; only `NotificationBellView` + noise moved; all 10 play stories captured |
| `npm run check:file-integrity` / `check:mojibake` | 0 / 0 — **run after I10** |
| `npm run build` | **0 — hard gate**, route table quoted, no clock leak, run last |

## 14. Completion report contract

Session log at `docs/sessions/2026-07-30-task698-storybook-frozen-clock.md`:

1. `Files Changed` table matching the real `git diff`, scoped to §7, with Task 697's paths shown as the inherited
   dirty state they are.
2. The I0 snapshot and the **true final** `git status --porcelain`, taken after the records are written.
3. R1–R9 mapped to AC1–AC7 with evidence.
4. The frozen-clock script as written, plus the R1 behaviour-preservation demonstrations one by one.
5. The full R4 planted-divergence proof — pass, planted fail with both values named, revert pass.
6. The Check 16 before/after matching logic and all 8 Check-16 test results.
7. The 1184-cell comparison: the changed-cell partition with counts per story; the four-locale relative-time
   readings; §3.5's six affordance rows; **all ten play stories named with verdicts**.
8. Every command with its **actual** exit code; the `npm run build` tail quoted verbatim including the route table,
   plus the explicit no-leak confirmation.
9. The R7/R8 corrections with before/after quoted.
10. Deviations, each with a reason.
11. Limitations — at minimum: the 7-width proof path; that cross-day determinism is proven structurally, not by a
    cross-day capture; that Check 16's `STORY_FILES` blind spot is a recorded NOTE, not closed; that other
    non-determinism classes are out of scope; and that `.screenshots/` evidence is local-only per D6.

**Status vocabulary.** `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. Sonnet
does not self-approve and does not run, emit, suggest, or delegate any mutating git command, including clearing
`.git/index.lock`.

**Handoff:** execute from this saved path — `tasks/kickoff_prompt_Task_698_Storybook_Frozen_Clock_D25.md` — under
`.claude/skills/execute-task/SKILL.md`.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable by a fresh Sonnet session with no chat context | **Yes** — the mechanism, install point, anchor, every affected line number, the play-story list, cell counts and owner rulings are inline |
| Every primary requirement has a binary AC | **Yes** — R1–R9 → AC1–AC7 |
| Scope protects existing behavior and names what must not change | **Yes** — §8, incl. all production code, Task 697's 12 sites, §14.10's existence, Check 16's scope |
| QA profile + canonical decision record present | **Yes** — §13.1 Q3-with-planted-proof and the explicit not-full-Q4 reason; §16 |
| Negative flows selected by applicability | **Yes** — §11, incl. the play-hang branch, the shim-breakage branch and the clock-leak branch, each with a stop condition |
| Does not claim an uninspected command, file, test, or behavior | **Yes** — §3.2 quotes three production call sites read in source; §3.3 quotes the real `preview-head.html` and decorator export; §3.4 quotes `wait-for.js:40,91` from installed `node_modules`; §3.5 derives every affordance from Task 697's own recorded values; §3.7's baseline and noise floor were independently recomputed by the reviewer from the persisted manifests |
| Gates prove the changed behavior | **Yes** — a planted-divergence proof for the new anchor gate, 3 targeted regression tests for the corrected Check 16, and a rendered partition that stops on any unexplained cell |
| Single active owner route | **Yes** — forks are only stop conditions: I0 unexpected path, I2 shim breakage, I5 unexplained cell or play hang, A5 clock leak, A6 throttle spin |
| Baselines account for task-created artifacts | **Yes** — `.screenshots/task698-delta/` is task-created with no prior baseline; `2026-07-30T11-29` is read-only |
| Dirty-worktree handling | **Yes** — §3.8 / §13.2 place Task 697's paths **in scope** rather than excluded, with an explicit stop for anything else |

**Known-risk note for the reviewer.** Four likely defects. First, **installing the freeze as a decorator** in
`preview.tsx` instead of `preview-head.html` — decorators run after module scope, so the fixture constants would
already have been evaluated and the fix would silently do nothing while every gate still passed (§3.3). Second, a
**`Date` shim that breaks a preserved behaviour** — a shim that drops `Date.parse` or breaks `instanceof` corrupts
every date-bearing story at once, which is why R1 enumerates each and AC1 demands each be demonstrated separately.
Third, **a play-function hang** — §3.4 clears the known mechanism from source, but the residual risk is real and R6
therefore requires all ten stories named, never sampled. Fourth, **letting the anchor exist in two places without a
gate** — that is F1/F2 restored silently, and R4 exists for nothing else.

## 16. Visual source map

| Visible artifact/state | Component/markup | Source of the value | Disposition | Evidence |
|---|---|---|---|---|
| Notification relative timestamps | `NotificationItem.tsx:194` `formatDistanceToNow` | frozen fixture `NOW` **vs frozen clock** | **returns to pre-697 string; then permanently stable** | AC2, AC5 |
| "New" listing badge | `ListingCard.tsx:98-99` | frozen `created_at` **vs frozen clock** | **ON, permanently — flip on 2026-08-04 removed** | AC5, I6 |
| Homepage grid badges ×8 | `HomepageListingGrids` via `cardListingData.fixture.ts` | frozen staggered `created_at` **vs frozen clock** | **6 ON / 2 OFF, permanently — daily erosion removed** | AC5, I6 |
| Admin valid/expired label | `AdminListingsTable.tsx:313/543/721` `formatVisibility` | frozen `expires_at` **vs frozen clock** | **unchanged, permanently — flip on 2026-08-30 removed** | AC5, I6 |
| `ListingsTab` rows | `ListingsTab.stories.tsx` | frozen `FUTURE`/`PAST`/`null` **vs frozen clock** | **unchanged, permanently** | AC5, I6 |
| `RangeDatePicker` fixed dates | `RangeDatePicker.stories.tsx:79-83` | already frozen literals | **untouched** | — |
| Date format per locale | `formatListingDate` etc. | production helper | **out of scope, untouched** | A2, §8 |

## 17. Canonical UI decision record

| Visible artifact | Search queries and inspected paths | Canonical source | Disposition | Shared path |
|---|---|---|---|---|
| The frozen clock | read `.storybook/preview-head.html` in full and `.storybook/preview.tsx:193-200`; traced all three live-clock consumers to source lines; read `wait-for.js` in installed `node_modules` for the hang risk | **none — no clock control exists in the project today** | **create** — one inline pre-bundle script | `.storybook/preview-head.html`, anchor gated against the fixtures by `scripts/__tests__/preview-clock-anchor.test.ts` |
| The determinism rule | `docs/storybook-governance.md` §14.10 as written by Task 697 | §14.10 exists but describes only the fixture half and defers the rest to "revisit the anchor" | **extend** — document the two-sided mechanism and retire the caveat | `docs/storybook-governance.md` §14.10 |

**Clause 16c note.** No Mantine component, prop, DOM shape or style changes. The canonical stories for the affected
surfaces already render the real production components; only the clock those components read changes.

## 18. Rule-compliance ledger

| Rule source and clause | Applicability evidence | Exact mandatory outcome | Evidence artifact | Result |
|---|---|---|---|---|
| cl. 1 (scope bounded) | 1 storybook config + 3 script/test files + 3 docs | No production code touched | §7, §8, A2 | required |
| cl. 3/5 (capabilities and UX flows intact) | Date-bearing stories | Every date-dependent affordance returns to and stays in its current state | R3, AC5, I6 | required |
| cl. 7 (four locales) | Rendered surfaces | Zero new keys; parity 2215×4; relative-time string verified in all 4 | AC2, AC7 | required |
| cl. 9 (validation evidence) | Non-Q0 | `npm run build` exit 0, fresh transcript + route table + no-leak confirmation | AC7 | required |
| cl. 11 (mobile/overlay protected) | In-scope UI below 640px | `noHorizontalOverflow` true at 320/375/390 | AC5 | required |
| cl. 12 (rendered evidence follows risk) | Q3 + planted proofs | 0 FAIL, 0 verdict changes; every changed cell partitioned; all 10 play stories named | AC5 | required |
| cl. 13 (Storybook gates enforceable) | **A new build-failing unit gate is authored; an existing gate is corrected** | Planted-divergence proof for R4; 3 regression tests for R5 | AC3, AC4 | required |
| cl. 14 (file integrity) | 6 modified + 2 created text files | UTF-8 no BOM, no mojibake, scanned set includes the records | AC7 | required |
| cl. 15 (critical flows) | **No registry row** covers Storybook infrastructure | Not applicable — explicit negative, not silence | §11 | N/A, declared |
| cl. 16/16a (TailAdmin visual source) | No visual value introduced | Only the clock changes | §13.1 | required |
| cl. 16b (canonical provenance before code) | 7 artifacts mapped | Canonical search recorded; no clock control existed, so one is created and gated | §16, §17 | required |
| cl. 16c (canonical Story cannot be bypassed) | Enrolled stories change rendered data | Stories render the real components and need no structural edit | §17, AC5 | required |
| cl. 10 (git ownership) | Dirty start with Task 697 | §3.8 classification; no mutating Git by the executor | §13.2 | required |

## 19. Execution contract

| Field | Value |
|---|---|
| Task | 698 |
| Active route / owner decision | Single route: pin the preview iframe's clock to `2026-07-30T00:00:00.000Z` via a pre-bundle `preview-head.html` script preserving all other `Date` behaviour, gate the two anchor literals against divergence with a new unit test, correct Check 16's comment/string handling, re-baseline the rendered matrix proving only `NotificationBellView` + measured noise moved and all ten play stories captured, and apply Task 697's review corrections to §14.10, §14.3 and the 697 session log (owner **D25**, 2026-07-30, from Task 697 review findings **F1**–**F4**; **D10** sets the verdict comparator; **D6** governs `.screenshots/`) |
| Decision source, date, scope | Owner, 2026-07-30, after the Task 697 review found the fixture freeze left three live-clock consumers drifting and one story worse than before; scope = `preview-head.html` + `check-stories.mjs` + 2 test files + `storybook-governance.md` + the 697 session log + records; **no** production code |
| Starting worktree mode | Dirty with Task 697's unapproved 12 paths, which are **in scope** (§3.8, §13.2), with an explicit stop for anything else |
| Producer of each checkpoint | I0 snapshot + classification → baseline gates → frozen-clock script + R1 behaviour demonstrations → anchor-divergence gate + planted proof → Check 16 correction + 3 tests → storybook + `--mantine-only` 1184-cell partition + 4-locale string reading + 10 play stories + 6 affordance rows → records corrections → typecheck/coverage/i18n/design-tokens/vitest → build + no-leak confirmation → records → post-records encoding gates |
| Persisted result | I0/final porcelain snapshots; the script as written with per-behaviour demonstrations; the 3-step planted-divergence transcript; all 8 Check-16 test results; the 1184-cell partition, locale string readings, play-story verdicts and affordance table under `.screenshots/task698-delta/`; every gate transcript; build tail with route table; session log |
| Comparator | `check:stories` 0/127/`checksRan: 16`; `check-stories.test.ts` 114/114; anchor test passes → planted divergence fails naming both values → reverted passes; 1184 cells **0 FAIL / 0 verdict changes**, ambiguous **4/16/2 = 22**, every changed cell in {`NotificationBellView/Default`, §3.7 noise} and none outside; all 10 play stories captured; §3.5's 6 affordance rows each in the stated state; `story-coverage` 15/15; `i18n` 2215×4; `design-tokens` 43/0 |
| Failure path | Unexpected start path → stop; a `Date` shim that breaks any R1-preserved behaviour → stop; a play story that hangs, times out or newly FAILs → stop naming it; a changed cell outside both partitions → stop; the frozen clock observable in `npm run build` or `vitest` → stop (A5); a component spinning on `Date.now()` deltas → stop naming it (A6); a fix that requires a production change → stop (A2) |
| Zero/empty input case | The post-fix comparison may legitimately show **zero** changed cells for a noise story on a given run — record "0 changed cells" for it rather than omitting the row. `NotificationBellView/Default` must **not** be zero: it is expected to move back toward its pre-697 content, and a zero there means the freeze did not take effect and is a **stop and report** |
| Task-created artifacts in baselines | `.screenshots/task698-delta/` is task-created with no prior baseline. `.screenshots/rendered-assert/2026-07-30T11-29/` is a **read-only** input captured before this change; it must not be regenerated |
