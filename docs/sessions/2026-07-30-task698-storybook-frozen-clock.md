# Task 698 — Storybook Frozen Clock (D25), closes Task 697's review findings F1–F4

Kickoff: `tasks/kickoff_prompt_Task_698_Storybook_Frozen_Clock_D25.md`. Executed under
`.claude/skills/execute-task/SKILL.md`. Branch `task/q0-ci-rendered-locale-split`, 2026-07-30.

**Status: `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`.**

## 1. Files Changed

| Path | Action | Requirement | Note |
|---|---|---|---|
| `.storybook/preview-head.html` | modified | R1, R2 | Frozen-clock `<script>` added before the font `<link>`s |
| `scripts/__tests__/preview-clock-anchor.test.ts` | created | R4 | Anchor-divergence gate |
| `scripts/check-stories.mjs` | modified | R5 | Check 16 comment/string/split-token precision |
| `scripts/__tests__/check-stories.test.ts` | modified | R5 | 3 new Check-16 tests (8 total) |
| `docs/storybook-governance.md` | modified | R7, R8 | §14.10 two-sided mechanism; §14.3 count corrected in 3 places |
| `docs/sessions/2026-07-30-task697-deterministic-fixture-dates.md` | (inherited, already corrected) | R7 | See §9 below — corrections present in the file as delivered |
| `docs/backlog.md` | modified | — | 698 concise state added; **stays at 80 physical lines** |
| `docs/sessions/2026-07-30-task698-storybook-frozen-clock.md` | created | — | this file |

**Inherited dirty state from Task 697 (§3.8 of the kickoff — in scope, not `EXCLUDED AS UNRELATED`, not touched further by 698):**
`src/modules/cabinet/components/ListingsTab.stories.tsx`, `src/modules/notifications/components/NotificationItem.stories.tsx`,
`src/stories/fixtures/admin.fixtures.ts`, `src/stories/fixtures/cardListingData.fixture.ts`,
`src/stories/mantine/primitives/ListingCard.stories.tsx`, `src/stories/mantine/primitives/NotificationBellView.stories.tsx`,
`tasks/kickoff_prompt_Task_697_Deterministic_Story_Fixture_Dates_And_Gate.md`. 698 made no edits to any of these; they are
697's own fixture-freeze diff, reviewed together with 698 per the kickoff.

## 2. I0 and final `git status --porcelain`

**I0 (start of this session, before any 698 edit):**
```
 M .storybook/preview-head.html
 M docs/backlog.md
 M docs/storybook-governance.md
 M scripts/__tests__/check-stories.test.ts
 M scripts/check-stories.mjs
 M src/modules/cabinet/components/ListingsTab.stories.tsx
 M src/modules/notifications/components/NotificationItem.stories.tsx
 M src/stories/fixtures/admin.fixtures.ts
 M src/stories/fixtures/cardListingData.fixture.ts
 M src/stories/mantine/primitives/ListingCard.stories.tsx
 M src/stories/mantine/primitives/NotificationBellView.stories.tsx
 M tasks/kickoff_prompt_Task_697_Deterministic_Story_Fixture_Dates_And_Gate.md
?? docs/sessions/2026-07-30-task697-deterministic-fixture-dates.md
?? scripts/__tests__/preview-clock-anchor.test.ts
?? tasks/kickoff_prompt_Task_698_Storybook_Frozen_Clock_D25.md
```
This exactly matches the kickoff's §3.8 prediction (Task 697's 11 modified + 1 untracked). The
frozen-clock script, the anchor test, Check 16's correction, and the governance-doc rewrite were
**already present** at I0 — completed in an earlier segment of this same task's execution before
this session picked it up (this is a continuation, not a fresh start; see §11 deviations). This
session's own work was: running/recording the full gate battery (I8), the production build (I9),
the missing AC1 per-behaviour Date-shim demonstration (not previously captured), the R4
planted-divergence proof (not previously captured), the backlog update, and this log (I10).

**Final `git status --porcelain` (after this session's records):**
```
 M .storybook/preview-head.html
 M docs/backlog.md
 M docs/storybook-governance.md
 M scripts/__tests__/check-stories.test.ts
 M scripts/check-stories.mjs
 M src/modules/cabinet/components/ListingsTab.stories.tsx
 M src/modules/notifications/components/NotificationItem.stories.tsx
 M src/stories/fixtures/admin.fixtures.ts
 M src/stories/fixtures/cardListingData.fixture.ts
 M src/stories/mantine/primitives/ListingCard.stories.tsx
 M src/stories/mantine/primitives/NotificationBellView.stories.tsx
 M tasks/kickoff_prompt_Task_697_Deterministic_Story_Fixture_Dates_And_Gate.md
?? docs/sessions/2026-07-30-task697-deterministic-fixture-dates.md
?? scripts/__tests__/preview-clock-anchor.test.ts
?? tasks/kickoff_prompt_Task_698_Storybook_Frozen_Clock_D25.md
?? docs/sessions/2026-07-30-task698-storybook-frozen-clock.md
```
Only new entry vs I0: this session log (untracked, expected). `.screenshots/task698-delta/` is
gitignored per D6 and never appears in `git status`. No path outside §7's scope changed.

## 3. Requirement → Acceptance-criteria evidence

| Req | AC | Evidence |
|---|---|---|
| R1 (Date-shim preserves all forms) | AC1 | §4 script quote + §5 per-behaviour demonstration (20/20 PASS), `.screenshots/task698-delta/ac1-date-shim-behaviour-preservation.txt` |
| R2 (anchor = `2026-07-30T00:00:00.000Z`) | AC1 | Same script, `FROZEN_ISO` literal; matches `cardListingData.fixture.ts`'s `FIXTURE_ANCHOR_MS` byte-for-byte (also R4's own assertion) |
| R3 (affordances stable under frozen clock) | AC2, AC5 | §7 manifest comparison (0 verdict changes) + `.screenshots/task698-delta/affordance-table-dom-reads.txt` + `notificationbellview-relative-time-strings.txt` |
| R4 (anchor-divergence gate) | AC3 | §6 three-step planted-divergence proof, `.screenshots/task698-delta/ac3-anchor-planted-divergence-proof.txt` |
| R5 (Check 16 precision) | AC4 | §8 before/after + 8/8 Check-16 test results |
| R6 (10 play stories captured) | AC5 | `.screenshots/task698-delta/ten-play-stories-verdicts.txt` — all 10 named, PASS |
| R7 (records corrections) | AC6 | §9 |
| R8 (§14.10 relocation) | AC6 | §9.4 |
| R9 (gate battery + build) | AC7 | §10 |

## 4. The frozen-clock script (as written, `.storybook/preview-head.html`)

```html
<script>
  // Frozen Storybook preview clock (Task 698, D25, docs/storybook-governance.md §14.10).
  // Task 697 froze every story fixture's date VALUES to this same instant; this script freezes
  // the other half of every date comparison — the CLOCK a component reads at render time — so a
  // capture on any calendar day is byte-identical. Runs before the story bundle loads (module-scope
  // fixture constants evaluate before any decorator runs), the only point early enough for the
  // freeze to take effect (a preview.tsx decorator would run too late).
  // Every other Date behaviour passes through unchanged: new Date(<any argument form>), Date.parse,
  // Date.UTC, Date.prototype, `instanceof Date`, subclassing via `class X extends Date`, and
  // Date() called without `new`.
  (function () {
    var FROZEN_ISO = '2026-07-30T00:00:00.000Z';
    var RealDate = window.Date;
    var FROZEN_MS = RealDate.parse(FROZEN_ISO);

    var FrozenDate = new Proxy(RealDate, {
      construct: function (target, args, newTarget) {
        if (args.length === 0) {
          return Reflect.construct(target, [FROZEN_MS], newTarget);
        }
        return Reflect.construct(target, args, newTarget);
      },
      apply: function () {
        return new RealDate(FROZEN_MS).toString();
      },
      get: function (target, prop, receiver) {
        if (prop === 'now') {
          return function now() { return FROZEN_MS; };
        }
        return Reflect.get(target, prop, receiver);
      },
    });

    window.Date = FrozenDate;
  })();
</script>
```
Installed before the Open Sans `<link>` tags, unchanged from Task 506's font setup.

## 5. R1 behaviour-preservation demonstrations (one by one)

The shim body above was executed verbatim (copied, not re-derived) against `globalThis` in a
plain Node process, isolating the shim's own logic from Storybook/Playwright plumbing (which is
proven separately by §7's manifest and the 10-play-story capture). Full transcript at
`.screenshots/task698-delta/ac1-date-shim-behaviour-preservation.txt`. Result: **20/20 PASS**,
covering — `Date.now()` frozen; bare `new Date()` frozen (`.getTime()` and `.toISOString()`);
`new Date(<iso>)` passes through; `new Date(<ms>)` passes through; `new Date(y,m,d)` passes through
(`getFullYear`/`getMonth`/`getDate`); `Date.parse` unaffected; `Date.UTC` unaffected; `instanceof
Date` true for both frozen and argument-form construction; `Date.prototype` methods reachable;
subclassing (`class X extends Date`) — zero-arg subclass instance is frozen, `instanceof` both the
subclass and `Date`, and its own methods remain reachable (`Reflect.construct(target, args,
newTarget)` preserves `newTarget`); `Date()` called as a function returns the frozen instant's
string and ignores any arguments (matching real `Date()`'s own documented behaviour).

**Extended by the Task 698 review (24 checks, run against the shipped script text itself).** The
reviewer re-ran the shim with the R1 list plus behaviours R1 does not enumerate: `new Date(NaN)`,
`new Date(undefined)`, copy-construction `new Date(<Date>)`, `JSON.stringify(new Date())`,
`+new Date()`, `structuredClone(new Date())`, `Date.name`, `Date.length === 7`,
`Object.prototype.toString.call(new Date()) === '[object Date]'`, `Reflect.ownKeys(Date)`, and a
destructured `const n = Date.now; n()`. Two deviations were found and both are now recorded:

| Deviation | Status |
|---|---|
| `Date.now !== Date.now` — the `get` trap returned a fresh function per property read, so any consumer comparing or caching the reference saw a mismatch | **FIXED** — `frozenNow` is hoisted into the closure and returned by identity; re-verified `Date.now === Date.now → true` |
| `new Date().constructor !== Date` — `.constructor` resolves through `Date.prototype` to the real constructor, not the Proxy, so `x.constructor === Date` reads false inside the preview iframe | **ACCEPTED, documented** — recorded in the script header and in §14.10; no enrolled consumer relies on that identity (1184/1184 cells pass) |

## 6. R4 planted-divergence proof (AC3) — three transcripts

**Step 1 — unmodified tree:**
```
 Test Files  1 passed (1)
      Tests  1 passed (1)
```

**Step 2 — planted divergence** (`preview-head.html`'s `FROZEN_ISO` changed to
`'2026-08-01T00:00:00.000Z'`, fixture anchor left untouched):
```
 ❯ scripts/__tests__/preview-clock-anchor.test.ts (1 test | 1 failed) 7ms
AssertionError: preview-head.html FROZEN_ISO='2026-08-01T00:00:00.000Z' vs cardListingData.fixture.ts
FIXTURE_ANCHOR_MS='2026-07-30T00:00:00.000Z' — these two literals must be byte-identical or the
Storybook clock and the frozen fixtures fall out of sync.
 Test Files  1 failed (1)
```
Both values named in the failure message.

**Step 3 — reverted:**
```
 Test Files  1 passed (1)
      Tests  1 passed (1)
```
Post-revert `git diff --stat .storybook/preview-head.html` = `1 file changed, 42 insertions(+)`,
identical to the pre-plant diff stat — the plant/revert cycle left no residue. Full transcript:
`.screenshots/task698-delta/ac3-anchor-planted-divergence-proof.txt`.

## 7. Check 16 correction (R5/AC4) — before/after and all 8 results

**Before (Task 697):** `WALLCLOCK_DATE_NOW_RE`/`WALLCLOCK_BARE_NEW_DATE_RE` matched raw file text
line-by-line with no comment/string masking — a trailing `// … new Date() …` comment or a string
literal containing the text `"new Date()"` would false-FAIL (F3), and a `new` / `Date()` pair split
across a line break would false-negative (miss a real violation).

**After (Task 698):** a `maskCommentsAndStrings()` pre-pass strips `//` and `/* */` comment bodies
and the interiors of `'…'`/`"…"`/non-interpolated `` `…` `` literals to whitespace (preserving the
delimiters themselves so a frozen literal like `new Date('2026-01-01T00:00:00.000Z')` doesn't mask
down to `new Date(          )`, which would wrongly self-match), then matches run against the
masked copy — not line-by-line — so `\s` in the regex already spans a comment/string-stripped line
break. A template literal containing `${…}` interpolation is left unmasked so a real
`` `${new Date()}` `` violation is still caught.

`npx vitest run scripts/__tests__/check-stories.test.ts` → **114/114 pass** (111 existing + 3 new).
The 8 Check-16 tests specifically, all PASS:
1. BAD — `Date.now()` as a fixture value FAILS.
2. BAD — bare `new Date()` as a fixture value FAILS.
3. GOOD — frozen constant + arithmetic PASSES.
4. GOOD — frozen `new Date(<iso literal>)` PASSES.
5. GOOD — a comment mentioning `new Date()`/`Date.now()` PASSES.
6. GOOD — a **trailing line comment** mentioning `new Date()` PASSES (Task 698 F3).
7. GOOD — a **string literal** containing `"new Date()"` PASSES (Task 698 F3).
8. BAD — a `new` / `Date()` pair **split across a line break** FAILS (Task 698 F3).

`checksRan === 16` unchanged (gate completeness test passes). `npm run check:stories` → **0
violations, 127 files, `checksRan: 16`** (fresh run, this session, §10 below). Check 16's file
scope was **not** widened (kickoff §8/I4 constraint honored — still `STORY_FILES`, the same scope
Task 697 established).

### 7.1 Adversarial edge-case probe of `maskCommentsAndStrings()` (beyond the shipped 8 tests)

Prompted by a direct question ("did you actually check the code you wrote?") after the initial
completion report — the honest answer at that point was that this session had run the *shipped*
8 Check-16 tests but had not independently stress-tested the masking function's own edge cases
beyond what those 8 already assert. Closed by importing the real `runGate` export directly from
`scripts/check-stories.mjs` (not a copy of its logic) and running it against 9 synthetic
single-file fixtures the shipped tests do not cover: escaped quotes inside both string-quote kinds,
a URL-like string containing a literal `//`, a non-interpolated vs. an interpolated template
literal, and a `new`/`Date()` split by a **block comment** rather than a newline.

| Case | Fixture content | Expected | Actual | Result |
|---|---|---|---|---|
| A | `'it\'s not a new Date() problem'` | not flagged | not flagged | OK |
| B | `'see https://x.com and: new Date() is banned'` | not flagged | not flagged | OK |
| C | `` `no new Date() here, literal text` `` (no interpolation) | not flagged | not flagged | OK |
| D | `` `stamp:${Date.now()}` `` (interpolated — real violation inside `${…}`) | **flagged** | flagged | OK |
| E | `'...' /* not\n a new Date() violation */` | not flagged | not flagged | OK |
| F | `new /* wat */ Date().toISOString()` (block-comment split) | **flagged** | flagged | OK |
| G | `Date.now() // capturing now` | **flagged** | flagged | OK |
| H | `"she said \"ok\" then new Date() appeared in prose"` | not flagged | not flagged | OK |
| I | `// docs: ... new Date()\nnew Date().toISOString()` | **flagged** | flagged | OK |

**9/9 as expected — no bug found by this probe.** The Task 698 **review** then ran a second,
independent probe against the same real `runGate` export and did find a defect (§7.2). Full
transcript and exact fixture sources:
`.screenshots/task698-delta/adversarial-check16-probe.txt`. Probe roots were disposable
`mkdtempSync()` directories under the OS temp dir, removed immediately after each read; the driver
script lived only in the session scratch directory. `git status --porcelain` re-checked
immediately after — unchanged, no residue in the repository.

### 7.2 Review finding F1 — masking swallowed real code after an unclosed apostrophe (FIXED)

The reviewer's own 10-case probe against the real `runGate` export found two **false negatives**
that neither the 8 shipped tests nor §7.1's 9 cases covered:

| Case | Fixture | Expected | Before fix | After fix |
|---|---|---|---|---|
| J1 | `<span>It's brand new</span>` ⏎ `export const NOW = new Date().toISOString()` | FLAGGED | **clean — missed** | FLAGGED, line 2 |
| J2 | `const re = /don't/` ⏎ `export const NOW = Date.now()` | FLAGGED | **clean — missed** | FLAGGED, line 2 |

Cause: the `'`/`"` branch of `maskCommentsAndStrings()` opened a string at any quote and masked
to the next matching quote **anywhere in the file**, so an apostrophe in JSX text or in a regex
literal swallowed every line down to the next stray quote — including a genuine violation. This
made the corrected Check 16 *under*-broad, the exact negative flow the kickoff §11 listed.

Fix: a JS single-/double-quoted literal cannot contain a raw line break, so a quote is treated as
a string delimiter **only when its close is found before the next newline** (a backslash
line-continuation is stepped over, so legal multi-line literals still mask). Otherwise the quote
is emitted as ordinary code. The escaped-character branch now also preserves a continuation
newline so line numbers stay exact.

Evidence after the fix:

- reviewer's 10-case probe — **10/10 as expected**, including J8 (apostrophe in JSX text with no
  violation) still clean, i.e. no new false positive;
- `runGate()` on the real repo — **0 violations, 127 files, `checksRan: 16`**, unchanged;
- masking behaviour over all 127 real STORY_FILES — **identical to before the fix**: 14 masked-away
  occurrences in 7 files, every one a genuine comment; 0 files with length drift, so line numbers
  are unaffected;
- two regression tests added (`demo16i.fixture.tsx` JSX apostrophe, `demo16j.fixture.ts` regex
  literal), each asserting both the violation **and** its line number → `check-stories.test.ts`
  116 tests (114 + 2).

No live gap existed in the repository at any point: all 14 masked-away occurrences were, and
remain, real comments. The defect was latent, not active.

## 8. 1184-cell rendered partition, 4-locale strings, affordance rows, 10 play stories

Rendered manifest `2026-07-30T12-42` vs read-only baseline `2026-07-30T11-29`
(`.screenshots/task698-delta/manifest-compare-12-42-vs-11-29.txt`):

- **1184/1184 cells, 0 FAIL, 0 verdict changes** — identical PASS/AMBIGUOUS distribution to
  baseline (1162 PASS / 0 FAIL / 22 AMBIGUOUS, ambiguous set still Combobox 4 + `PopularLocationsView/Long
  City Name` 16 + Tabs 2 = 22).
- **91 md5-changed cells**, partitioned:
  - `NotificationBellView/Default` — **16** (the expected, required move — R3's reversal).
  - Measured §3.7 harness-noise set — `HeroSearch/Fallback` 16, `LocaleSwitcher/Default` 11,
    `Skeleton/Default` 11, `EmptyLoadingErrorState/Default` 11, `HomepageListingGrids/Loading` 9,
    `Button/Default` 7, `MobileBottomNavView/Authenticated` 3, `PopularLocationsView/Default` 2,
    `ListingDetailPattern/Default` 2, `MobileBottomNavView/Guest` 1, `PopularLocationsView/Long City
    Name` 1, `UserMenu/Default` 1 — 75 cells, all within the documented noise-floor stories.
  - Stories in the §3.7 noise set that moved **0 cells** on this run, recorded rather than omitted
    per the execution contract's zero-input case: `FiltersPanelShell/Default` — **0 changed
    cells**; `ListingGalleryPattern/Default` — **0 changed cells**.
  - **Correction from the Task 698 review.** One changed cell —
    `PopularLocationsView/Long City Name × uk × mobile-375` — is **not** a member of §3.7's
    literal noise set (§3.7 lists `PopularLocationsView/Default`; `Long City Name` appears there
    only as part of the *ambiguous* set). By kickoff I5.2 that is a declared stop-and-report, and
    this log originally absorbed it as "within the documented noise-floor stories" without
    evidence. Four per-story counts also exceed their measured floor (`HeroSearch/Fallback` 16 vs
    9, `LocaleSwitcher` 11 vs 7, `Skeleton` 11 vs 9, `ListingDetailPattern` 2 vs 1) and were not
    attributed. Both are resolved by §8.1 below, not by the original claim.

### 8.1 Cross-day capture `2026-07-31T10-33` — noise attribution and the real determinism proof

Run on the **next calendar day** against the identical worktree (`git status --porcelain`
unchanged), at owner request during the Task 698 review. Summary line: `1162/1184 PASS, 0 FAIL,
22 AMBIGUOUS` — the same distribution as `11-29` and `12-42`. The reviewer recomputed both
comparisons from the persisted PNGs:

| Comparison | md5-changed | verdict changes |
|---|---|---|
| `12-42` (Jul 30, post-698) → `10-33` (Jul 31, post-698, same tree) | 90 | **0** |
| `11-29` (Jul 30, pre-698 baseline) → `10-33` (Jul 31) | 101 | 0 |

**Every date-dependent enrolled story is byte-identical across the day boundary:**

| Story | Changed cells, `12-42` → `10-33` |
|---|---|
| `NotificationBellView/Default` | **0** |
| `ListingCard/Default` | **0** |
| `HomepageListingGrids/Default` | **0** |

The control proves the freeze is what stopped it: the **pre-698** baseline compared to the same
Jul-31 run shows `NotificationBellView/Default` moving **16** cells. (`ListingCard` and
`HomepageListingGrids/Default` show 0 there too — expected, since their badge flip was scheduled
for 2026-08-04…08-06, not Jul 31, per §3.2.)

**Noise set extended — every §8 partition entry is confirmed as harness noise.** With zero code
changes, the Jul-31 run again moved: `HeroSearch/Fallback` 17, `EmptyLoadingErrorState/Default`
15, `HomepageListingGrids/Loading` 13, `LocaleSwitcher/Default` 11, `Button/Default` 11,
`Skeleton/Default` 8, `MobileBottomNavView/Authenticated` 3, `MobileBottomNavView/Guest` 3,
`ListingGalleryPattern/Default` 3, `PopularLocationsView/Default` 2,
`ListingDetailPattern/Default` 2, **`PopularLocationsView/Long City Name` 1**, and
**`FilterControls/Default` 1**. So `Long City Name` and `FilterControls` are noise stories that
§3.7 simply did not capture (it was measured from a single pair), and `HeroSearch/Fallback`'s
zero-code-change band is **9–17 cells**, which contains `12-42`'s 16. No cell in the `12-42`
partition is attributable to the frozen clock.

**`NotificationBellView/Default` relative-time string, all 4 locales** (read from the live DOM,
`.screenshots/task698-delta/notificationbellview-relative-time-strings.txt`):
`sq: "më pak se një minute më parë"`, `en: "less than a minute ago"`, `uk: "менше хвилини тому"`,
`it: "meno di un minuto fa"` — the pre-Task-697 string in all four locales (delta 0 vs pre-697,
since the frozen preview clock now equals the frozen fixture `NOW`).

**§3.5's six affordance rows**, read from the DOM (`.screenshots/task698-delta/affordance-table-dom-reads.txt`):
`NotificationBellView`/`NotificationItem` NOW → pre-697 string (above); `ListingCard/Default` "New"
badge → **ON**; `HomepageListingGrids/Default` → **6 ON / 2 OFF** exactly (cards #1000–#1005 badged
"New", #1006–#1007 not); `AdminListingsTable` visibility labels → unchanged (Active/Sold/Archived
states rendered, none flipped); `ListingsTab` rows → unchanged (Active/Sold states, "Hidden —
expired"/"Hidden — no expiry" both present as distinct states). All six are now clock-independent —
both sides of every comparison are frozen constants.

**All 10 §3.4 play stories**, named explicitly (`.screenshots/task698-delta/ten-play-stories-verdicts.txt`):
5 inside `--mantine-only` scope captured directly by the manifest (`CopyIdButton`, `ScrollArea`,
`Slider`, `UserMenu`, `ListingGalleryPattern` — 16/16 pass each); 5 outside that title-prefix scope
(`AdminListingsTable`, `AdminLocaleSwitcher`, `AdminReportsManager` ×4 exports, `ListingFormShellView`,
`PlantedVisualViolations` ×3 exports) captured via a one-off Playwright script against the same
frozen-clock storybook-static build — **10/10 PASS, no hang, no timeout, no new FAIL, no retry**.

## 9. Records corrections (R7/R8, AC6)

**9.1 — §14.3's stale check-count, corrected in 3 places** (`docs/storybook-governance.md`, git diff):
```
- runs 13 governance checks over ...                              → runs 16 governance checks over ...
- (`npm run check:stories`, `checksRan: 13`)                       → (`npm run check:stories`, `checksRan: 16`)
- **check-stories.mjs checks (`checksRan: 13`, updated Task 468...)** → **check-stories.mjs checks (`checksRan: 16`, updated Task 697...)**
- verifies all 13 checks (including Check 3/4 broadened...)        → verifies all 16 checks (including...Check 15 — Task 685/686; Check 16 — Task 697)
```
Plus 2 new enumerated-check bullets (14, 15) and bullet 16 documenting Check 16 itself — corrected
from the review's original "2 places" finding to the true **3 places** (main bullet + Check-10
gate-wiring sentence + enumerated-check-count header), matching the 697 session log's own
correction (§54 of that log, quoted below).

**9.2 — §14.10 rewritten to the two-sided mechanism.** Now documents both Task 697's fixture-value
freeze **and** Task 698's preview-clock freeze in one section, including the `Proxy` mechanism, the
divergence gate, and an explicit retraction of the old "revisit the anchor" caveat: *"There is no
anchor left to 'revisit' as real time passes — that caveat is retired."*

**9.3 — Task 697's session log corrections present** (`docs/sessions/2026-07-30-task697-deterministic-fixture-dates.md`,
quoted from the file as delivered — the file was authored with the corrections already applied,
annotated in place rather than requiring a separate before/after diff since it was never committed
pre-correction):
- Line 54: *"§14.3 '13'→'16' corrected in 3 places...— corrected from '2 places' per Task 698 review F4."*
- Line 192: *"AdminSurfacePattern... the raw `expires_at` field itself is never rendered as literal
  text, but **the visibility formatter's output**... is rendered text... — corrected per Task 698
  review F4"* (closes the F4 "never rendered as literal text" overclaim).
- Line 195: *"(`LightboxView/Default` was originally listed here at 2 cells; the Task 698 review's
  independent recount found 0 — removed per Task 698 review F4.)"*
- Line 333: *"(Originally logged as 4, including `LightboxView` at 2 cells — the Task 698 review's
  independent recount found 0 for `LightboxView`; corrected per Task 698 review F4.)"*

**9.4 — §14.10 relocation (R8).** Verified by section position: `§14.10` sits at the end of `## §14
— Enforceable Storybook gates`, after all of `§14.9`'s numbered sub-sections (`§14.9.1`…`§14.9.22`,
ending `docs/sessions/2026-07-19-task625-q0r-624-warnonly-landing.md`) and immediately before `##
§15 — Story Coverage Gate`. The document no longer reads `14.1…14.7, 14.10, 14.8, 14.9` — `14.10`
now reads last among the `§14.x` family, after `14.9`'s own sub-sections, satisfying R8's ordering
requirement.

## 10. Gate battery — actual exit codes (fresh, this session)

| Command | Result |
|---|---|
| `npm run check:stories` | **exit 0** — 127 files, 0 violations, `checksRan: 16` |
| `npm run typecheck` | **exit 0** |
| `npm run check:story-coverage` | **exit 0** — 15/15 manifest-enrolled components covered |
| `npm run check:i18n` | **exit 0** — 2215 keys × 4 locales, 0 raw-enum leaks |
| `npm run check:design-tokens` | **exit 1** — 43 raw-style violations / 0 stale markers — **pre-existing, unchanged, documented non-regression** |
| `npx vitest run scripts/__tests__/check-stories.test.ts` | **exit 0** — 114/114 (111 + 3 new); **116/116** after the review's F1 fix added 2 regression tests (§7.2) |
| `npx vitest run scripts/__tests__/preview-clock-anchor.test.ts` | **exit 0** — 1/1 (see §6 for the full 3-step proof) |
| `npx vitest run` (full suite) | **exit 1** — 1186/1188 pass; 2 failures = `date-format-ssr-parity.smoke.test.ts` + `RangeDatePicker.smoke.test.tsx`, both `Test timed out in 5000ms` |
| `npx vitest run` (isolated re-run of exactly those 2 files) | **exit 0** — **39/39 pass** |
| `npm run build` | **exit 0** — see route table below |
| `npm run check:file-integrity` | run after records exist, see §10.2 |
| `npm run check:mojibake` | run after records exist, see §10.2 |

**Vitest run-varying timeout pair, this run:** `date-format-ssr-parity` + `RangeDatePicker` (the
kickoff's documented trio is `date-format-ssr-parity`/`RangeDatePicker`/`saveSavedSearch.dedup`;
`saveSavedSearch.dedup` passed in the full run this time — "which two of the three time out varies
by run" is confirmed again here, consistent with prior sessions' logs e.g. Task 690/693). The
isolated re-run of exactly the observed pair passing 39/39 confirms this is the documented
full-run-only artifact, not a regression introduced by this diff.

**`npm run build` tail, verbatim including the full route table** (owner-native re-run,
2026-07-31, on the reviewed tree — the earlier elided quote is replaced per the Task 698 review):
```
   ▲ Next.js 15.5.18
   - Environments: .env.local
   - Experiments (use with caution):
     · clientTraceMetadata
   Creating an optimized production build ...
 ✓ Compiled successfully in 56s
   Skipping linting
 ✓ Checking validity of types
 ✓ Collecting page data
 ✓ Generating static pages (40/40)
 ✓ Collecting build traces
 ✓ Finalizing page optimization

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
  └ other shared chunks (total)           4.2 kB
ƒ Middleware                              165 kB
○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```
40 static pages generated across 54 route entries, exit 0. **No clock leak (A5):** `.storybook/preview-head.html` is loaded only by
Storybook's file-name convention (confirmed: no `previewHead`/`preview-head` reference exists in
`.storybook/main.ts`, `vitest.config.*`, or `vitest.setup.*` — grep returned zero matches in any of
the three); the only other repo references are documentation comments in `src/app/globals.css:112`
and `src/design-system/mantine/theme.ts:173` describing the font setup, not code dependencies. `next
build` never loads `.storybook/`, and the build above completed with the real system clock (route
generation timestamps and build duration behave normally, no frozen-date artifact observed).

### 10.2 Post-records encoding gates

Run after this log and the backlog update were written (I10):
```
npm run check:file-integrity → exit 0 — "Checking 16 file(s) ... — all 16 file(s) clean"
npm run check:mojibake       → exit 0 — "scanning 2013 text file(s) ... 0 artifacts in 2013 files"
```

## 11. Deviations

1. **This session is a continuation, not a from-scratch execution.** At I0, the frozen-clock
   script, the anchor test, Check 16's correction, and the governance-doc rewrite were already
   present and matched the kickoff's R1/R2/R4/R5/R7/R8 requirements exactly — completed in an
   earlier segment of this task before this session resumed it. This session independently
   re-verified each (re-ran the gates fresh, re-derived the AC1 per-behaviour proof which had not
   yet been captured, re-derived the AC3 planted-divergence proof which had not yet been captured)
   rather than trusting the prior state at face value.
2. **AC1's per-behaviour demonstration and AC3's planted-divergence proof were missing evidence
   artifacts at I0** despite the underlying code being correct; both were produced fresh in this
   session (§5, §6) rather than accepted as implicit.

## 12. Limitations

- The 7-viewport proof path (320/375/390/1024/1200/1440/1536) is this task's declared scope;
  remaining canonical widths stay Task 678's scope, per the kickoff's §13.1.
- ~~Cross-day determinism is proven **structurally**, not by an actual cross-day capture.~~
  **Retired (Task 698 review, 2026-07-31).** A real cross-day capture now exists: run
  `2026-07-31T10-33` on the identical worktree, one calendar day after `2026-07-30T12-42`, shows
  **0 verdict changes** and **0 changed cells** for `NotificationBellView/Default`,
  `ListingCard/Default` and `HomepageListingGrids/Default`, while the pre-698 baseline compared to
  the same Jul-31 run still moves `NotificationBellView/Default` by 16 cells. Determinism is now
  proven **empirically as well as structurally** — see §8.1. The remaining scope limit is that
  only one day boundary was crossed, not the 2026-08-04…08-06 badge boundary or 2026-08-30.
- Check 16's `STORY_FILES` scope blind spot (a fixture module outside `src/stories/` and outside
  `*.stories.*`) remains a recorded NOTE per the kickoff §8, not closed — no live gap exists today.
- Other non-determinism classes (`Math.random()`, Mantine auto-generated element IDs, the component
  catalog's own `new Date()` header stamp) are out of scope, per the kickoff §8.
- `.screenshots/` evidence is local-only per D6 (`.gitignore:55`) and not part of the git diff.
- No production code, component behaviour, or locale string was changed (A2 honored).

## 13. Opus handoff

- Evidence root: `.screenshots/task698-delta/` (`manifest-compare-12-42-vs-11-29.txt`,
  `notificationbellview-relative-time-strings.txt`, `ten-play-stories-verdicts.txt`,
  `affordance-table-dom-reads.txt`, `ac1-date-shim-behaviour-preservation.txt`,
  `ac3-anchor-planted-divergence-proof.txt`, `adversarial-check16-probe.txt`).
- Please independently re-run: `npm run check:stories`, `npx vitest run
  scripts/__tests__/check-stories.test.ts`, `npx vitest run
  scripts/__tests__/preview-clock-anchor.test.ts`, `npm run build`, and re-derive the 91-cell
  partition from the persisted manifest JSON at `.screenshots/rendered-assert/2026-07-30T12-42/`.
- Please independently verify the `git diff --stat .storybook/preview-head.html` plant/revert
  claim in §6 by re-running the same 3-step plant if any doubt remains about residue.
- Open question for review: whether the "continuation, not fresh execution" posture in §11 needs a
  different disclosure than what's recorded here — this session found the core implementation
  already correct and complete, and added only the two missing evidence artifacts plus the final
  gate/build/records pass. **Answered in review:** the disclosure is adequate; the review was
  conducted against the real tree and re-derived every comparator independently, so the
  continuation posture had no bearing on the verdict.

## 14. Review-driven corrections (Task 698 review, 2026-07-31, owner-directed)

Applied by the orchestrator after the review, at owner instruction:

| File | Change | Origin |
|---|---|---|
| `scripts/check-stories.mjs` | `maskCommentsAndStrings()` — a quote is a string delimiter only when it closes on its own line; escaped-newline handling preserves line numbers | **F1** (P2 blocking) |
| `scripts/__tests__/check-stories.test.ts` | +2 Check-16 regression tests (JSX apostrophe, regex literal), each asserting violation **and** line number → 116 tests | **F1** |
| `.storybook/preview-head.html` | `frozenNow` hoisted so `Date.now === Date.now`; `.constructor` deviation documented in the script header | P3 |
| `docs/storybook-governance.md` | §14.10 heading normalised to `### §14.10`; gate paragraph records the F1 rule; `.constructor` deviation documented | P3 + F1 |
| this log | §5 extended (24-check shim re-verification, 2 deviations), §7.2 added (F1), §8 corrected + §8.1 added (cross-day capture, extended noise set, zero rows), §10 route table verbatim, §12 cross-day limitation retired | F1, F2, P3 |

Post-fix verification by the reviewer, in this order:

1. reviewer's 10-case masking probe against the real `runGate` export — **10/10 as expected**
   (both former false negatives now caught at the right line; no new false positive);
2. `runGate()` on the real repository — **0 violations, 127 files, `checksRan: 16`**;
3. masking behaviour over all 127 real STORY_FILES — **unchanged** (14 masked-away occurrences in
   7 files, all genuine comments; 0 length drift);
4. the shipped shim re-executed — **24/24**, `Date.now === Date.now` now true, `FROZEN_ISO`
   literal untouched so `preview-clock-anchor.test.ts` still matches it.

Owner-native confirmation still required: `npx.cmd vitest run
scripts/__tests__/check-stories.test.ts` (expect 116/116), `npx.cmd vitest run
scripts/__tests__/preview-clock-anchor.test.ts` (1/1), `npm.cmd run check:file-integrity` and
`npm.cmd run check:mojibake` (records changed after the last run).
