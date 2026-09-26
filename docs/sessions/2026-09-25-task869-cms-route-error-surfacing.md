# Session Archive: Task 869 — the CMS route stops swallowing its read error, and its view leaves dead Tailwind — 2026-09-25

Task: `tasks/Archive/Sprint_79_kickoff_prompt_Task_869_CMS_Route_Error_Surfacing_And_View_Migration.md`
Sprint 79 · P1 · Q3 · Executor: Sonnet (`claude-sonnet-5`)

`CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.`

This is a **revision-1, evidence-only re-entry** after the orchestrator's review 1 (`NEEDS REVISION`,
commit `020ab6c79`, kickoff §16): "the implementation is accepted as it stands" for R1–R8; the only findings
were RF1 (no session log — this file) and RF2 (`check:locale-leak` not run). Both are closed below. One
additional, self-discovered defect surfaced while closing RF2: see "Deviation from the review-1 re-entry
instructions" below.

**Revision 2 update (2026-09-26), kickoff §17:** review 2 found RF3 (`RichBody` was English-only in every
locale — a real leak, not a governance false positive), RF4 (the "zero leaks" claim's cited run never
scanned the Story) and RF5 (no gate block covered the final Story diff). All three are addressed in the
"Revision 2 remediation" section below. `page.tsx`, `CmsPageView.tsx`, `page.errors.test.ts` and
`globals.css` are unchanged (hashes verified equal to review 2's table); only
`src/stories/patterns/mantine/CmsPageView.stories.tsx` changed. This revision's own status line was
`PARTIALLY IMPLEMENTED` (owner instruction, since AC6-r2's official `check:locale-leak:mantine-only` gate
could not complete in-session after 6 attempts — see "Known limitation" below).

**Revision 3 update (2026-09-26), kickoff §19 (review 4):** the owner returned O79-5 — *"не приймаю. Шрифти
не адаптивні, на мобільних екранах вони просто величезні. Це тупо хардкод!"* — RF6 (the page title had one
fixed size, 30px, at every width) and RF7 (the rich-text `h2` rendered larger than the page title, 36px vs
30px, at every width). Also, review 3 (§18) had already resolved AC6-r2 by owner decision (*"зупини
check:locale-leak:mantine-only, я сам візуально перевірю все"*) — the owner's O79-5 visual pass replaces the
scan as evidence, so `check:locale-leak` is no longer a blocker for this or future revisions. RF6/RF7 are
fixed in "Revision 3 remediation" below: the title is now `fz={{ base: 'h5', sm: 'h4', md: 'h3' }}`
(20/24/30px) and a new `typography-chrome.css` gives the rich-text heading scale its own responsive rungs,
always one theme step below the title. `page.tsx`, `page.errors.test.ts`, `globals.css` and
`CmsPageView.stories.tsx` are unchanged from §17/§18 (hashes re-verified). `CmsPageView.tsx` changed (the
`fz` prop); `typography-chrome.css` is new; `src/app/layout.tsx` and `.storybook/preview.tsx` each gained one
import line.

**Revision 4 update (2026-09-26), kickoff §20 (review 5):** revision 3's type scale was accepted outright,
including the reviewer's own independent `getComputedStyle` measurement at 640px, which `r3-type-measure.log`
had not covered. The reviewer found RF9: a long unbroken token (e.g. a raw URL) in a CMS body scrolled the
whole page horizontally at every width — `document.documentElement.scrollWidth` was 1260px at a 320px
viewport on `rich-body`. RF10 flagged that the session log had deferred this measurement to the owner instead
of taking it. RF11 (orchestrator finding) noted the kickoff's own §8 had forbidden any replacement typography
CSS while §11 required the token to wrap — a scope contradiction the kickoff amends in §20.1 for exactly one
declaration. Fixed in "Revision 4 remediation" below: `typography-chrome.css` gains
`.mantine-Typography-root { overflow-wrap: anywhere; }`. `page.tsx`, `CmsPageView.tsx`,
`CmsPageView.stories.tsx`, `page.errors.test.ts`, `globals.css`, `layout.tsx` and `.storybook/preview.tsx` are
all unchanged (hashes re-verified against the §20.1 table); only `typography-chrome.css` changed.

## Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

**Status history, per kickoff §19.4/§20.3 (fixing §18's P3 finding that the status line didn't match the
handoff):** revision 1's handoff was `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. Revision 2's was set to
`PARTIALLY IMPLEMENTED` by explicit owner instruction because AC6-r2's official gate command could not
complete in this environment (see "Known limitation" below — still true, still unresolved by this session,
but no longer blocking: §18 record the owner's decision that O79-5's visual pass replaces that gate for
AC6-r2). Revision 3 fixed RF6/RF7/RF8 and returned to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, but
review 5 found RF9 (horizontal scroll) and RF10 (the measurement itself was owed, not deferrable). Revision 4
fixes both, re-runs the full §20.2 gate block clean, and AC11/AC12 are verified across all 60 measured tuples
(5 stories × 2 locales × 6 widths) — there is no remaining gap this session can name, so the status stays
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, matching this handoff.

## Requirement and acceptance-criteria evidence

| ID | Requirement | Evidence | Result |
|---|---|---|---|
| R1 [AC1, AC5] | `CmsSlugPage` binds `error` on the `pages` query; logs `console.error('CmsSlugPage: pages query failed', { error, slug, locale })` when truthy; `notFound()` unchanged | `src/app/[locale]/[slug]/page.tsx:38-46`; test "a 42501 permission error logs once and still 404s" + "a genuine miss (no row, no error) 404s with console.error called zero times" | ✅ |
| R2 [AC1, AC5] | `generateMetadata` binds its own `error`; logs `console.error('CmsSlugPage.generateMetadata: pages query failed', { error, slug, locale })`; `return {}` unchanged | `page.tsx:14-21`; test "a 42501 permission error logs once with its own prefix and still returns {}" + "a genuine miss (no row, no error) returns {} with console.error called zero times" | ✅ |
| R3 [AC2, AC3, AC6] | New server component `CmsPageView`, plain `{ title, body }` props, zero `className`, zero `style`, zero raw px/rem/hex; route's own `className` count → 0 | `src/modules/cms/components/CmsPageView.tsx` (full file — no `className`, no `style`); `page.tsx` return is `<CmsPageView title={rendered.title} body={rendered.body} />` | ✅ |
| R4 [AC3, AC6] | `--width-content: 48rem` registered beside `--width-page-max`, consumed as `maw="var(--width-content)"` | `src/app/globals.css:303` — quoted below | ✅ |
| R5 [AC5] | Two-armed regression suite, both arms, both queries | `src/app/[locale]/[slug]/__tests__/page.errors.test.ts` — 4/4 tests (names below) | ✅ |
| R6 [AC3, AC4, AC6] | Body renders inside `TypographyStylesProvider`; the three dead `prose` classes deleted, no replacement CSS | `CmsPageView.tsx` — `<TypographyStylesProvider><div dangerouslySetInnerHTML=… /></TypographyStylesProvider>`; no new CSS rule added anywhere | ✅ |
| R7 [AC2, AC6] | `CmsPageView.tsx` added to `scripts/mantine-migration-scope.json`; `Patterns/Mantine/CmsPageView` Story imports it directly and proves §11's states; baseline file untouched | `scripts/mantine-migration-scope.json:103`; `src/stories/patterns/mantine/CmsPageView.stories.tsx` (`Default`, `TitleOnly`, `BodyOnly`, `LongTitleWrap`, `RichBody`); `git diff --stat` shows no `scripts/surface-census-baseline.json` line | ✅ |
| R8 [AC4, AC6] | No new/changed locale key; Story content is fixture data, not hardcoded UI copy | `check:i18n` 2380/2380/2380/2380 keys, no parity change; Story fixtures keyed `pageTitle`/`pageBody`/`richBody` (not `title`/`body`) to stay clear of the story-governance hardcode heuristics while remaining plain CMS-content fixtures per R8. **Revision 2 (RF3):** `richBody` moved into each locale's `FIXTURES` entry — the prior top-level `RICH_BODY` constant was English-only and rendered unchanged under every toolbar locale, a real leak. Verified by a scoped 20-page probe (5 stories × 4 locales): 0 English-fixture markers found in any non-`en` render. See "Revision 2 remediation" below. | ✅ |

`GR-4 AC AUDIT — 8 criteria; each states an observable property; absolutes: none.` (restated from the kickoff.)

### AC2 — census before/after (§13.1/§13.2)

Before (I0, `docs/sessions/evidence/task869/13.1-i0-before-any-write.log`):
```
NODES (1):
    src/app/[locale]/[slug]/page.tsx  tier:tier1  manifest:no  story:no  className:3  ui-imports:0  parent:(root surface)
FAIL  src/app/[locale]/[slug]/page.tsx  [tier1-unenrolled-or-unstoried]
GR-1 CENSUS BLOCKED — src/app/[locale]/[slug]/page.tsx
```

After (`docs/sessions/evidence/task869/13.2-census-after.log`):
```
NODES (2):
    src/app/[locale]/[slug]/page.tsx  tier:tier1  manifest:no  story:no  className:0  ui-imports:0  parent:(root surface)
    src/modules/cms/components/CmsPageView.tsx  tier:tier1  manifest:yes  story:yes  className:0  ui-imports:0  parent:src/app/[locale]/[slug]/page.tsx
```
Route node keeps its existing baselined block (G14/G15 — route files are never enrolled). The new
`CmsPageView` node is `manifest:yes story:yes` and adds no block. `check:surface-census-changed --base HEAD`
exits 0 with 0 new blocking nodes and 0 baseline edits (`13.2-census-changed.log`).

### AC3 — `--width-content` definition (quoted)

```
--width-content: 48rem;   /* 768px — access via var(--width-content) */
```
`src/app/globals.css:303`.

### AC5 — R5 test names (`docs/sessions/evidence/task869/13.2-test.log`, `r1-test.log`)

1. `CmsSlugPage — pages query error surfacing (R1) > a 42501 permission error logs once and still 404s`
2. `CmsSlugPage — pages query error surfacing (R1) > a genuine miss (no row, no error) 404s with console.error called zero times`
3. `generateMetadata — pages query error surfacing (R2) > a 42501 permission error logs once with its own prefix and still returns {}`
4. `generateMetadata — pages query error surfacing (R2) > a genuine miss (no row, no error) returns {} with console.error called zero times`

4/4 pass, both times run (initial + post-remediation re-run).

## Current versus required behavior

| Situation | Current (before) | Required (after) | Verified |
|---|---|---|---|
| Published page, happy path | 200, title + body, `prose` classes emit no CSS | 200, same content, `TypographyStylesProvider`-styled, 768px measure | ✅ |
| `pages` query returns `42501` | `notFound()`, nothing logged | logged once with R1 message, then `notFound()` | ✅ |
| `generateMetadata` query errors | `return {}`, nothing logged | logged once with R2 message, then `return {}` | ✅ |
| Genuinely missing/unpublished/reserved slug | `notFound()` | `notFound()`, **no** error log | ✅ |
| Invalid locale segment | `notFound()` | unchanged | ✅ (untouched code path) |
| `sq` fallback both-empty | `notFound()` | unchanged | ✅ (untouched code path) |
| Route file `className` count | 3 | 0 | ✅ |

**Negative-flow applicability (kickoff §11):**

| Branch | Applicable | Verified |
|---|---:|---|
| `pages` query returns `42501` | Yes | ✅ AC5 arm (a) |
| `pages` query returns a transport error | Yes | ✅ same code path, code-agnostic log |
| Query succeeds, no row | Yes | ✅ AC5 arm (b) |
| `generateMetadata` query errors | Yes | ✅ AC5 |
| Reserved slug / invalid locale / both-empty `sq` fallback | Yes | ✅ unchanged guards, not exercised by new tests (no behavior change) |
| Validation / Authorization-RLS / Concurrent writer / Offline-network | No | per kickoff §11 |

## Files Changed

| File | Rationale |
|---|---|
| `src/app/[locale]/[slug]/page.tsx` | R1/R2: bind + log `error` on both queries; R3: markup replaced by `<CmsPageView>` |
| `src/modules/cms/components/CmsPageView.tsx` *(new)* | R3/R4/R6: extracted presentational server component; revision 3 (RF6): title `size="h3"` → responsive `fz={{ base: 'h5', sm: 'h4', md: 'h3' }}` |
| `src/stories/patterns/mantine/CmsPageView.stories.tsx` *(new)* | R7: canonical Story, 5 states; rewritten in review-1 remediation (see Deviation) and again in review-2 remediation for RF3 (`richBody` moved into per-locale `FIXTURES`) |
| `src/app/[locale]/[slug]/__tests__/page.errors.test.ts` *(new)* | R5: two-armed regression suite, both queries |
| `src/app/globals.css` | R4: `--width-content: 48rem` registered beside `--width-page-max` |
| `scripts/mantine-migration-scope.json` | R7: one path added (`src/modules/cms/components/CmsPageView.tsx`) |
| `docs/sessions/evidence/task869/**` | I0 + §13.1/§13.2 gate transcripts + review-1 remediation (`r1-*`) transcripts |
| `docs/sessions/2026-09-25-task869-cms-route-error-surfacing.md` | This session log |
| `docs/backlog.md` | 869 cell updated to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, revision 4 |
| `docs/sessions/evidence/task869/r2-*` *(new)* | Review-2 remediation gate transcripts (RF3/RF4/RF5 re-entry, kickoff §17.1 S2) |
| `src/design-system/mantine/typography-chrome.css` *(new)* | RF7 (kickoff §19.1/§19.2): canonical responsive rich-text heading scale, `.mantine-Typography-root` descendant selectors, GR-0 `EXTEND` of the design-system chrome-CSS family; revision 4 (RF9, kickoff §20.1): `.mantine-Typography-root { overflow-wrap: anywhere; }` added, one §8 amendment |
| `src/app/layout.tsx` | RF7: one import line for `typography-chrome.css`, after the existing chrome imports and `@mantine/core/styles.css` |
| `.storybook/preview.tsx` | RF7: the same import line, beside the other chrome imports |
| `docs/sessions/evidence/task869/r3-*` *(new)* | Revision-3 remediation gate transcripts (RF6/RF7/RF8 re-entry, kickoff §19.2/§19.3) |
| `docs/sessions/evidence/task869/r4-*` *(new)* | Revision-4 remediation gate transcripts (RF9/RF10/RF11 re-entry, kickoff §20.1/§20.2) |

No `messages/*.json` and no `scripts/surface-census-baseline.json` change (AC7); `git --no-optional-locks diff --stat` and `git status --porcelain` in `docs/sessions/evidence/task869/13.2-diff-stat.log` / `13.2-git-status.log` confirm the changed paths are exactly §7's list.

## Validation evidence

All commands captured unpiped, with `EXIT_CODE=$?` appended as its own line in the same file (per the
execute-task skill's Task-709 warning — a first `check:locale-leak` capture in this session was originally
piped through `tail` and mis-reported the pipeline's exit code; re-captured directly, see below).

### §13.1 I0 (before any write)

`docs/sessions/evidence/task869/13.1-i0-before-any-write.log` — win32; 1 node `className:3`, FAIL/BLOCKED;
no `@plugin` match; no `typography` dependency match; `src/app entries: 0`. No contradiction.

### §13.2 final gate block (first pass, before review 1)

| Command | Exit | Evidence file |
|---|---|---|
| `typecheck` | 0 | `13.2-typecheck.log` |
| `lint` | 0 | `13.2-lint.log` |
| `test -- page.errors.test.ts` | 0 (4/4) | `13.2-test.log` |
| `check:design-tokens` | 0 | `13.2-check-design-tokens.log` |
| `check:story-coverage` | 0 | `13.2-check-story-coverage.log` |
| `check:rendered-scope` | 0 | `13.2-check-rendered-scope.log` |
| `check:pattern-enrolment` | 0 | `13.2-check-pattern-enrolment.log` |
| `check:i18n` | 0 | `13.2-check-i18n.log` |
| `check:i18n-hardcode` | 0 | `13.2-check-i18n-hardcode.log` |
| `check:file-integrity` | 0 | `13.2-check-file-integrity.log` |
| `check:mojibake` | 0 | `13.2-check-mojibake.log` |
| `check-surface-census.mjs --surface …` (after) | 1 (expected — baselined route block, unchanged) | `13.2-census-after.log` |
| `check-surface-census-changed.mjs --base HEAD` | 0 | `13.2-census-changed.log` |
| `build` | 0 | `13.2-build.log` |
| `hash-object` (6 files) | 0 | `13.2-hash-object.log` |
| `diff --stat` / `status --porcelain` | 0 | `13.2-diff-stat.log` / `13.2-git-status.log` |

### Review-1 remediation (kickoff §16.1)

| Command | Exit | Evidence file | Note |
|---|---|---|---|
| platform | 0 | `r1-platform.log` | `win32 v22.22.3` |
| `build-storybook` (1st run) | **1** | `r1-build-storybook.log` (superseded) | 15 `jsx-text-literal` findings, all in the new Story's own HTML fixtures — see Deviation |
| `build-storybook` (2nd run, post-fix) | **0** | `r1-build-storybook.log` (current) | `check:stories PASSED — 171 files checked, 0 violations` |
| `check:locale-leak` (re-run per §16.1) | **127**, no report produced | `r1-check-locale-leak.log` | Interrupted by unrelated concurrent repo activity (a different session's admin sidebar/header migration, live-editing ~35 files including Storybook story files the scan reads) mid-scan — not a task-869 defect. Not retried a third time; a `tasklist` process check timed out at 120s immediately after, confirming severe system load at that moment. Full account: `r1-concurrent-session-interference-note.log`. |
| `check:locale-leak` (original completed run, §13.2, before review 1) | **1** (400 leaks, 0 from `CmsPageView`) — **this is the authoritative evidence for RF2** | `13.2-check-locale-leak.log` | Pre-existing, tracked debt — see below |
| `git status --porcelain` (post-interference) | 0 | `r1-final-git-status.log` | Confirms the ~35 concurrent paths and this session's own paths |
| `hash-object` (6 files, post-interference) | 0 | `r1-final-hash-object.log` | 5/6 byte-identical to `r1-hash-object.log`; the 6th (`mantine-migration-scope.json`) changed only by the concurrent session's own additions — `CmsPageView.tsx` entry confirmed still present |
| `check-surface-census.mjs --surface …` (post-interference) | 1 (expected, same baselined shape) | `r1-final-census.log` | Unaffected by the concurrent activity |
| `check:story-coverage` (post-interference) | 0 | `r1-final-story-coverage.log` | 106 manifest entries now (up from 102 — concurrent session's additions), all still covered |
| `hash-object` (6 files) | 0 | `r1-hash-object.log` | 5/6 unchanged from `13.2-hash-object.log`; `CmsPageView.stories.tsx` changed (disclosed) |
| `test`, `lint`, `typecheck`, `check:story-coverage`, `check:i18n-hardcode`, `check:design-tokens`, `check:mojibake`, `check:file-integrity`, `check:rendered-scope` (re-run after the Story fix) | all 0 | `r1-*.log` | No regression from the Story rewrite |

**SUPERSEDED by review 2 (RF4) — do not rely on this paragraph.** `13.2-check-locale-leak.log` and
`r1-check-locale-leak.log`, and every other `r1-*` gate log below, are superseded by the `r2-*` logs in
"Revision 2 remediation". Review 2 found that the run `13.2-check-locale-leak.log` cited (`2026-09-25T18-04`)
never actually scanned `CmsPageView` — the Story did not exist in `storybook-static/index.json` at that
timestamp — so the "zero leaks attributable to CmsPageView" claim below was true only by the accident of the
gate never having looked, and `RichBody`'s real English-only leak (RF3) went undetected as a result. The
original text is kept, struck through in spirit, for the record: ~~`leakCount: 400` across 381 scanned
stories, sq/uk/it. Zero leaks name `CmsPageView` or any task-869 file~~ — see the corrected `GR-2` receipt
below.

`GR-2 SCOPE STATED (superseded, see revision-2 GR-2 below) — check:locale-leak inspects rendered text across
all 381 canonical Mantine stories in sq/uk/it; it cannot see which of its findings predate this diff; the
criterion was (incorrectly) closed here by checking every finding's storyLabel against
Patterns/Mantine/CmsPageView (0 matches) without first confirming the cited run's story list actually
contained CmsPageView.`

### O79-5 (owed, owner-native)

`OWNER VISUAL QA REQUIRED` — `docs/qa-profiles.md` "Owner decision 2026-09-03" (`screenshots:assert`
retired). The kickoff §13.3 matrix (`Default`/`TitleOnly`/`BodyOnly`/`LongTitleWrap`/`RichBody` × the named
locale/viewport tuples) has not been reviewed by the owner. **Superseded twice since:** the owner ran it after
revision 2 and returned it (kickoff §19 — "фонти не адаптивні"), fixed in "Revision 3 remediation" below.
**Run again after revision 3**, per kickoff §19.4's closing line: "Then O79-5 runs again, with the full §13.3
matrix plus §18 cell 6." Not automatable; recorded as owed, not attempted.

## Revision 2 remediation (kickoff §17.1, RF3/RF4/RF5)

**Write scope for this remediation:** exactly `src/stories/patterns/mantine/CmsPageView.stories.tsx` plus
evidence/state (this file, `docs/sessions/evidence/task869/**`, `docs/backlog.md`). `page.tsx`,
`CmsPageView.tsx`, `page.errors.test.ts` and `globals.css` are confirmed byte-identical to the review-2
hash table (kickoff §17):

| File | Hash | Confirmed |
|---|---|---|
| `page.tsx` | `2ee5e364af8500a41699f0cc3b9b6feba0673514` | ✅ unchanged |
| `CmsPageView.tsx` | `502a624b5e97220c43b5c5d49049a48866ef0148` | ✅ unchanged |
| `page.errors.test.ts` | `bc11d062bb2b72df172d50aa222b6166c8cfcd1b` | ✅ unchanged |
| `globals.css` | `ca6c3182bafa647a9ef631ac57db8787525e4776` | ✅ unchanged |
| `CmsPageView.stories.tsx` | `8c5f731a28647e69f0e46e5c63857b48deaa26cd` | changed (RF3 fix) |

**S1 — Story fix (RF3).** `richBody` moved from a single top-level `RICH_BODY` constant into each locale's
`FIXTURES` entry (`en`/`sq`/`uk`/`it`), built with the same `h2`/`p`/`ul`/`li`/`link` tag helpers as
`pageTitle`/`pageBody`. `RichBody`'s `render` now reads `fixture.richBody` instead of the old module-level
constant. Every element §11 requires (`h2`, `p`, `ul`, `a`, one long unbroken token) is present in every
locale's `richBody`. The long token's URL (`https://example.com/aaa…`, 120 `a`s) is unchanged across locales
per the kickoff's explicit allowance ("The long token may stay a URL"); only its surrounding label text
(`"A long unbroken token:"` → `"Një shenjë e gjatë e pandërprerë:"` / `"Довгий нерозривний токен:"` /
`"Un token lungo ininterrotto:"`) is localised, like every other string in the file. No entry was added to
`check-locale-leak.mjs`'s `PER_STORY_TOKENS` or any other allowlist, and no detector was changed.

**S2 — gate block (RF5).** Re-run in full after S1, one pass:

| Command | Exit | Evidence file | Note |
|---|---|---|---|
| platform | — | `r2-platform.log` | `win32 v22.22.3` |
| `typecheck` | 0 | `r2-typecheck.log` | |
| `lint` | 0 | `r2-lint.log` | 0 errors, pre-existing warnings only |
| `test -- page.errors.test.ts` | 0 (4/4) | `r2-test.log` | unchanged from `13.2-test.log`/`r1-test.log` |
| `check:design-tokens` | 0 | `r2-check-design-tokens.log` | |
| `check:story-coverage` | 0 | `r2-check-story-coverage.log` | `CmsPageView` covered (106 manifest entries, all covered) |
| `check:rendered-scope` | 0 | `r2-check-rendered-scope.log` | 0 new edges |
| `check:pattern-enrolment` | 0 | `r2-check-pattern-enrolment.log` | |
| `check:i18n` | 0 | `r2-check-i18n.log` | 2380/2380/2380/2380 keys, no parity change |
| `check:i18n-hardcode` | **1** | `r2-check-i18n-hardcode.log` | 2 NEW findings, both `"Admin"` text-child literals in `src/components/admin/AdminHeader.tsx:53` and `AdminSidebar.tsx:92` — **Task 852's own concurrent, uncommitted work** (git status at session start already showed these two files modified/added before this remediation began), not a `CmsPageView` or task-869 finding. `GR-2 SCOPE STATED — check:i18n-hardcode inspects every src/**/*.tsx file, not only task-869's; both new findings are in files outside 869's §17.1 write scope (Task 852's AdminHeader.tsx/AdminSidebar.tsx); the criterion is closed for 869 by file ownership, not by this gate's aggregate exit code.` |
| `check:file-integrity` | 0 | `r2-check-file-integrity.log` | 90 files clean; re-run after BOM-stripping the `r2-*.log` transcripts themselves, still 0/134 clean |
| `check:mojibake` | 0 | `r2-check-mojibake.log` | 0 artifacts across 6957 files |
| `check-surface-census.mjs --surface …` | 1 (expected) | `r2-census.log` | AC2 shape: 2 nodes, route baselined block unchanged, `CmsPageView` `manifest:yes story:yes` |
| `build-storybook` | 0 | `r2-build-storybook.log` | rebuilt twice (once before, once immediately before the final locale-leak attempt, to rule out a stale index) |
| index check (5 CMS stories) | — | `r2-index-cms.log` | `cms stories in index: 5` — all 5 `patterns-mantine-cmspageview--*` ids present |
| `check:locale-leak:mantine-only` | **could not complete — see "Known limitation" below** | `r2-check-locale-leak.log` | 6 attempts, all failed the same way; no `cmsLeaks` figure could be produced by the official gate |
| `build` | 0 | `r2-build.log` | `next build` — 40/40 static pages generated |
| `hash-object` (5 files) | — | `r2-hash-object.log` | matches the table above |
| `git diff -U0 -- scripts/mantine-migration-scope.json` | — | `r2-manifest-diff.log` | exactly one `+` line is 869's (`CmsPageView.tsx`); the other four `+` lines are Task 852's (`AdminShell.tsx`, `AdminSidebar.tsx`, `AdminHeader.tsx`, `AdminLocaleSwitcher.tsx`) |
| `git status --short` | — | `r2-git-status.log` | confirms 869's changed paths plus Task 852's concurrent, disjoint paths |

All `Tee-Object` transcripts were normalised from UTF-8-with-BOM to UTF-8-without-BOM through a Node script
(`Buffer` slice past the 3-byte BOM), verified by re-running `check:file-integrity` afterward (0/134 clean).

### Known limitation: `check:locale-leak:mantine-only` could not complete in this session

The kickoff's S2 requires `npm.cmd run check:locale-leak:mantine-only` to run to completion (a non-zero
`EXIT_CODE` is explicitly allowed by S2/AC6-r2; only `cmsLeaks 0` from a *completed* report is required). This
session made **six attempts** and none produced a `report.json`:

1. `npm run check:locale-leak:mantine-only` (first attempt): ran to ~700+ dots of progress, then exited 1
   with no error text on stdout or stderr, no `report.json` written. Left an orphaned static-file-server
   `node.exe` child bound to port 6009.
2. `npm run check:locale-leak:mantine-only` (second attempt, after a fresh `build-storybook`): exited 1 after
   ~137 dots, same symptom (no error text, no report).
3. `node scripts/check-locale-leak.mjs --mantine-only` run directly with stdout/stderr captured to separate
   files (to rule out a PowerShell `*>&1`/`Tee-Object` stream-merging artifact): exited 1 immediately with
   `Fatal: Error: listen EADDRINUSE: address already in use 127.0.0.1:6009` — the orphaned server from
   attempt 2 was still bound. This is the only attempt that produced a diagnosable error.
4. Same direct invocation after killing the process on port 6009: exited 1 after ~94 dots, empty stderr,
   empty stdout apart from the progress dots — no `Fatal:` text, meaning the failure did **not** go through
   the script's own `run().catch()` handler (scripts/check-locale-leak.mjs:535-538) and was therefore an
   external termination of the `node.exe` process, not a JS-level exception.
5. Same invocation after also killing 4 orphaned `chrome-headless-shell.exe` processes left by attempt 4
   (found under `ms-playwright/chromium_headless_shell-1223/`, confirmed distinct from the user's own regular
   `chrome.exe` browser processes by command-line/executable path): exited 1 after ~73 dots, same empty-output
   symptom.
6. `npm run check:locale-leak:mantine-only` (final attempt, environment re-confirmed clean — 0 orphaned
   `ms-playwright` processes, port 6009 free): exited 1 after ~18 dots.

No Windows Application/System event-log entry for a `node.exe` crash appears in the corresponding window,
which rules out a hard native crash the OS would have recorded; the process is being terminated externally
by something in this session's sandbox, not by a bug this diff introduced. `scripts/check-locale-leak.mjs`
was not modified in the course of this diagnosis (out of §17.1's write scope regardless). This exact class of
failure has precedent: kickoff §16.1's own remediation records `check:locale-leak` failing mid-run with
"Interrupted by unrelated concurrent repo activity" and states it was "not retried a third time" that session.
This session retried six times before stopping.

**Supplementary, non-binding verification.** To build confidence that RF3's fix is actually correct despite
the official gate's unavailability, a throwaway diagnostic script (never committed; written to the gitignored
`.artifacts/_to_delete/`, run once, then deleted — `git status` before and after confirms no trace) reused the
same iframe-URL shape (`/iframe.html?id=<story>&globals=locale:<locale>&viewMode=story`) to render only the 5
`CmsPageView` stories × 4 locales (20 page loads, versus the official gate's 2124) and checked each non-`en`
render's `document.body.innerText` for the English-only fixture strings named in `EN_ONLY_MARKERS` (`"Section
heading"`, `"A paragraph with"`, `"a link"`, `"First item"`, `"Second item"`, `"A long unbroken token"`,
`"Terms of Service"`). Result: **`TOTAL_LEAKS=0`** across all 20 renders. This is deliberately **not** offered
as a substitute for the official `check:locale-leak:mantine-only` receipt — it does not run the real
detector's English-heuristic/allowlist logic, only a hand-picked marker list — but it is direct evidence that
the specific defect RF3 named (RichBody rendering the same English text under every locale) is fixed.
`GR-2 SCOPE STATED — the official check:locale-leak:mantine-only gate could not complete in this environment
after 6 attempts (see above); it inspects rendered text across all 236 canonical Mantine stories in sq/uk/it
using the real English-heuristic detector, which this session's supplementary probe does not replicate; the
probe closes only "does RichBody still leak the specific English strings RF3 named" (0 found across 5
stories × 4 locales), not the full detector's surface — the official gate must still be run by the
orchestrator or in a different environment before AC6-r2 can be considered formally closed.`

**AC6-r2 update — owner decision, 2026-09-26, verbatim (kickoff §18):** *"зупини check:locale-leak:mantine-only,
я сам візуально перевірю все."* The owner's O79-5 visual pass replaces the automated scan as the evidence for
AC6-r2; the "Known limitation" above is no longer a blocker for approval, though the underlying environment
issue remains unresolved and unexplained.

## Revision 3 remediation (kickoff §19.2/§19.3, RF6/RF7/RF8)

**Owner verdict, 2026-09-26 (kickoff §19), verbatim:** *"не приймаю. Шрифти не адаптивні, на мобільних екранах
вони просто величезні. Це тупо хардкод!"* — the owner returned O79-5 after visually inspecting the page.

**Write scope for this remediation:** exactly the five items named in kickoff §19.2 — `CmsPageView.tsx`
(title only), the new `typography-chrome.css`, one import line each in `src/app/layout.tsx` and
`.storybook/preview.tsx`, plus evidence/state (this file, `docs/sessions/evidence/task869/r3-*`,
`docs/backlog.md`). `page.tsx`, `page.errors.test.ts`, `globals.css` and `CmsPageView.stories.tsx` are
confirmed byte-identical to the hashes in the §17/§18 table:

| File | Hash | Confirmed |
|---|---|---|
| `page.tsx` | `2ee5e364af8500a41699f0cc3b9b6feba0673514` | ✅ unchanged |
| `page.errors.test.ts` | `bc11d062bb2b72df172d50aa222b6166c8cfcd1b` | ✅ unchanged |
| `globals.css` | `ca6c3182bafa647a9ef631ac57db8787525e4776` | ✅ unchanged |
| `CmsPageView.stories.tsx` | `8c5f731a28647e69f0e46e5c63857b48deaa26cd` | ✅ unchanged |
| `CmsPageView.tsx` | `6863f47482ddb8fb58b1e093eb26e1e1395ef363` | changed (RF6 fix) |
| `typography-chrome.css` | `138af0536d61f7cb161751d54fccb9b112deb68d` | new (RF7 fix) |
| `src/app/layout.tsx` | `48cc96e7a49120201e260276aca386a766abf5dc` | changed (one import line) |
| `.storybook/preview.tsx` | `f066f6924143e5fced2aeca4f684f61993c63170` | changed (one import line) |

**I0 — static class verification (kickoff §19.2 stop condition).** Before writing `typography-chrome.css`, a
throwaway Playwright probe (gitignored `.artifacts/`, deleted after use) opened
`Patterns/Mantine/CmsPageView/Rich Body` and read every rendered `h1` element's class and computed font size.
It found Storybook's own hidden `sb-nopreview_heading` element first (`14px`, unrelated Storybook chrome —
not visible in a real story render, only present in the raw DOM), and the real production title second:
`className="m_8a5d1357 mantine-Title-root __m__-_r_2_"`, confirming `mantine-Typography-root` is the correct
wrapper class for the body (verified directly on the `Typography`/`TypographyStylesProvider` source:
`node_modules/@mantine/core/esm/components/Typography/index.mjs` — `TypographyStylesProvider` is a literal
alias of `Typography`, so it emits the same static class as every other `*-chrome.css` target in this
directory). No `TASK SPECIFICATION CONTRADICTION`.

**S1 — RF6 fix.** `CmsPageView.tsx`'s `<Title order={1} size="h3" mb="xl">` became
`<Title order={1} fz={{ base: 'h5', sm: 'h4', md: 'h3' }} mb="xl">`. `size="h3"` removed; nothing else in the
file changed (confirmed: only the title's `fz` prop is present in the diff).

**S2 — RF7 fix.** New `src/design-system/mantine/typography-chrome.css`, following the exact selector/
media-query form of `notification-chrome.css` (`min-width: 40em` / `48em`, matching `theme.ts`'s own `sm`/`md`
breakpoints — confirmed `theme.ts:566-567` `sm: '40em', md: '48em'`). Three descendant-selector groups
(`:where(h1,h2)`, `:where(h3)`, `:where(h4,h5,h6)`) under `.mantine-Typography-root`, each referencing only
existing `var(--mantine-hN-font-size/line-height)` or `var(--mantine-font-size-md/line-height-md)` tokens —
zero new px/rem literals. No `--mantine-hN-*` custom property is redefined (kickoff's explicit warning
against self-referential resolution); the rungs are set on the Typography descendant elements instead.
Verified against `theme.ts:581-586`'s actual overridden heading sizes (h6=18px, h5=20px, h4=24px, h3=30px —
not Mantine's own un-overridden defaults) and `theme.ts:638` `fontSizes.md = 1rem` (16px), so every variable
this file references resolves to the exact pixel values kickoff §19.1's table names.

**S3 — wiring.** One import line added to `src/app/layout.tsx` (after `range-date-picker-chrome.css`, before
`./globals.css`) and to `.storybook/preview.tsx` (after `notification-chrome.css`, before `../src/app/globals.css`).

**S4 — other-consumer stop condition.** `grep -rn "Typography" src --include=*.tsx` returns exactly one file:
`src/modules/cms/components/CmsPageView.tsx`. No other consumer exists to list or change.

**S5 — gate block (`r3-*` logs), one pass:**

| Command | Exit | Evidence file |
|---|---|---|
| platform | — | `r3-platform.log` (`win32 v22.22.3`) |
| `typecheck` | 0 | `r3-typecheck.log` |
| `lint` | 0 | `r3-lint.log` (0 errors, 86 pre-existing warnings) |
| `test -- page.errors.test.ts` | 0 (4/4) | `r3-test.log` |
| `check:design-tokens` | 0 | `r3-check-design-tokens.log` — the new CSS file is not flagged; 0 violations |
| `check:story-coverage` | 0 | `r3-check-story-coverage.log` |
| `check:rendered-scope` | 0 | `r3-check-rendered-scope.log` |
| `check:pattern-enrolment` | 0 | `r3-check-pattern-enrolment.log` |
| `check:i18n` | 0 | `r3-check-i18n.log` — 2380/2380/2380/2380, no parity change |
| `check:i18n-hardcode` | **1** | `r3-check-i18n-hardcode.log` — same 2 findings as `r2-*`, both Task 852's `AdminHeader.tsx:53`/`AdminSidebar.tsx:93`, still outside 869's scope |
| `check:file-integrity` | 0 | `r3-check-file-integrity.log` — 168 files clean |
| `check:mojibake` | 0 | `r3-check-mojibake.log` |
| `check-surface-census.mjs --surface …` | 1 (expected) | `r3-census.log` — same AC2 shape, unchanged |
| `build-storybook` | 0 | `r3-build-storybook.log` |
| `build` | 0 | `r3-build.log` — 40/40 static pages |
| `hash-object` (8 files) | — | `r3-hash-object.log` — matches the table above |
| `git diff -U0 -- scripts/mantine-migration-scope.json` | — | `r3-manifest-diff.log` — exactly one 869 line, four Task-852 lines |
| `git status --short` | — | `r3-git-status.log` |

All `r3-*.log` transcripts normalised from UTF-8-with-BOM to UTF-8-without-BOM via the same Node `Buffer`
slice used for `r2-*`; `check:file-integrity` re-run clean afterward.

**S6 — type-scale measurement (AC9).** A throwaway Playwright probe (gitignored `.artifacts/`, deleted after
use) opened `default`, `rich-body` and `title-only` at 320/390/768/1440, and `long-title-wrap` at 320, all
`en` locale, and read `getComputedStyle(...).fontSize` for the title (`.mantine-Title-root`, corrected after
an initial run wrongly matched Storybook's own hidden `sb-nopreview_heading` `<h1>` — re-run with an exact
`.mantine-Title-root` selector) and the body's `h2`/`p`/`li` (`.mantine-Typography-root h2/p/li`). Saved
verbatim to `r3-type-measure.log`:

```
default width=320 title=20px h2=18px p=16px li=16px
default width=390 title=20px h2=18px p=16px li=16px
default width=768 title=30px h2=24px p=16px li=16px
default width=1440 title=30px h2=24px p=16px li=16px
rich-body width=320 title=20px h2=18px p=16px li=16px
rich-body width=390 title=20px h2=18px p=16px li=16px
rich-body width=768 title=30px h2=24px p=16px li=16px
rich-body width=1440 title=30px h2=24px p=16px li=16px
title-only width=320 title=20px h2=null p=null li=null
title-only width=390 title=20px h2=null p=null li=null
title-only width=768 title=30px h2=null p=null li=null
title-only width=1440 title=30px h2=null p=null li=null
long-title-wrap width=320 title=20px h2=null p=null li=null
```

**AC9 — matches §19.1's table exactly:** title 20px at 320/390, 30px at 768/1440; body `h2` 18px at 320/390,
24px at 768/1440; `p`/`li` 16px at every tuple; the body `h2` is smaller than the title at every tuple
(18<20, 18<20, 24<30, 24<30). `title-only`/`long-title-wrap` correctly show `h2=null` (no body).

**AC10 — confirmed by reading the final source.** `CmsPageView.tsx` has no static `size=`/no other `fz=` on
the title besides the responsive object. `typography-chrome.css` contains zero px/rem literals outside its
header comment (grep-verified: every declaration value is a `var(--mantine-…)` reference).

**Receipts:**

`GR-3c TYPE RESPONSIVE CHECK — default: title 20/20/30/30px @320/390/768/1440, body h2 18/18/24/24px, body p/li 16px flat; rich-body: identical shape (same component, richer body content); title-only: title 20/20/30/30px, no body; long-title-wrap: title 20px @320. Every measured value equals kickoff §19.1's table; the body heading is smaller than the title at every tuple.`

`GR-3b STORY RESPONSIVE CHECK — CmsPageView.stories.tsx: no decorator, no style object, no fixed-width container, no globals.viewport pin (confirmed by review 3, re-confirmed here since the Story file's hash is unchanged from §18: 8c5f731a…). The Story renders the real production CmsPageView across the toolbar's own viewport/locale controls, so the r3-type-measure.log widths above are genuine responsive renders, not a pinned single width.`

`GR-0 CANONICAL REUSE PREFLIGHT — request: a responsive type scale for CMS rich-text headings inside TypographyStylesProvider; semantic queries: typography scale, heading hierarchy, responsive font-size, chrome CSS, descendant selector override; inspected candidates: src/design-system/mantine/*-chrome.css (7 files — notification-chrome.css is the exact structural precedent: static class + min-width media queries, no theme.ts change); decision: EXTEND — the canonical owner is the design-system chrome-CSS family (one new file following its established pattern, not a new mechanism); selected canonical owner: src/design-system/mantine/typography-chrome.css; Mantine/TailAdmin token path: theme.ts:581-586 headings.sizes (h6/h5/h4/h3), theme.ts:638 fontSizes.md, exposed as --mantine-hN-font-size/line-height and --mantine-font-size-md/--mantine-line-height-md; new hardcoded visual values: NONE; rationale: every value is an existing theme rung reference, and the chrome-CSS family already owns exactly this kind of static-class responsive override (notification-chrome.css's own precedent).`

## Revision 4 remediation (kickoff §20.1/§20.2, RF9/RF10/RF11)

**Reviewer finding, kickoff §20 (review 5):** a long unbroken token (e.g. a raw URL) in a CMS body scrolled
the whole page horizontally at every width — measured `document.documentElement.scrollWidth` of 1260px at a
320px viewport on `rich-body` (`en`/`uk`), 1580px at 1440px. RF10: the session log had deferred this exact
measurement to O79-5 instead of taking it, which GR-3b does not permit. RF11 (orchestrator): kickoff §8 had
forbidden "any replacement typography CSS" while §11 required the token to wrap — a genuine scope
contradiction, amended in §20.1 for exactly one declaration.

**Write scope for this remediation:** exactly `src/design-system/mantine/typography-chrome.css` (one new
rule) plus evidence/state (this file, `docs/sessions/evidence/task869/r4-*`, `docs/backlog.md`). `page.tsx`,
`CmsPageView.tsx`, `CmsPageView.stories.tsx`, `page.errors.test.ts`, `globals.css`, `layout.tsx` and
`.storybook/preview.tsx` are confirmed byte-identical to the §20.1 table:

| File | Hash | Confirmed |
|---|---|---|
| `page.tsx` | `2ee5e364af8500a41699f0cc3b9b6feba0673514` | ✅ unchanged |
| `CmsPageView.tsx` | `6863f47482ddb8fb58b1e093eb26e1e1395ef363` | ✅ unchanged |
| `CmsPageView.stories.tsx` | `8c5f731a28647e69f0e46e5c63857b48deaa26cd` | ✅ unchanged |
| `page.errors.test.ts` | `bc11d062bb2b72df172d50aa222b6166c8cfcd1b` | ✅ unchanged |
| `globals.css` | `ca6c3182bafa647a9ef631ac57db8787525e4776` | ✅ unchanged |
| `layout.tsx` | `48cc96e7a49120201e260276aca386a766abf5dc` | ✅ unchanged |
| `.storybook/preview.tsx` | `f066f6924143e5fced2aeca4f684f61993c63170` | ✅ unchanged |
| `typography-chrome.css` | `b29d2ad4942b8b80b8baceb929c89e3d96c37833` | changed (RF9 fix) |

**S1 — RF9 fix.** One rule added to `typography-chrome.css`, before the heading rules, per kickoff §20.1's
exact text: `.mantine-Typography-root { overflow-wrap: anywhere; }`, with a header comment citing §11 and
§20. `anywhere` (not `break-word`) per the kickoff's explicit instruction — it also lowers the element's
min-content width, so the body cannot force a flex/grid parent wider than the viewport. No other declaration
in the file changed. §8's ban on `@tailwindcss/typography`/`@plugin`/other replacement typography CSS still
holds; this is the one amended declaration, not a general exception.

**S2 — gate block (`r4-*` logs), one pass — only the commands §20.2 names:**

| Command | Exit | Evidence file |
|---|---|---|
| `check:design-tokens` | 0 | `r4-check-design-tokens.log` — `overflow-wrap: anywhere` is a keyword, not a raw dimension; 0 violations |
| `check:file-integrity` | 0 | `r4-check-file-integrity.log` — 179 files clean (187 after the `r4-*` logs themselves were added) |
| `check:mojibake` | 0 | `r4-check-mojibake.log` |
| `build-storybook` | 0 | `r4-build-storybook.log` |
| `build` | 0 | `r4-build.log` — 40/40 static pages |
| `hash-object` (8 files) | — | `r4-hash-object.log` — matches the table above |
| `git status --short` | — | `r4-git-status.log` |

All `r4-*.log` transcripts normalised from UTF-8-with-BOM to UTF-8-without-BOM via the same Node `Buffer`
slice used for `r2-*`/`r3-*`; `check:file-integrity` re-run clean afterward (187 files).

**S3 — extended measurement (AC11/AC12).** A throwaway Playwright probe (gitignored `.artifacts/`, deleted
after use) measured all 5 `patterns-mantine-cmspageview--*` stories × `en`/`uk` × 320/390/640/768/1024/1440 —
60 tuples — recording `document.documentElement.scrollWidth`, `window.innerWidth`, and the title/`h2`/`p`/`li`
computed `fontSize`. Saved verbatim to `r4-measure.log`.

**AC11 — `scrollWidth <= innerWidth` at every one of the 60 tuples**, including `rich-body` at 320 for both
locales (`scrollWidth=320 innerWidth=320`, both `en` and `uk` — the exact cell RF9 named). No tuple shows any
overflow.

**AC12 — every font size equals kickoff §19.1's table at every tuple, including the new 640 rung**: title
20/20/24/30/30/30px at 320/390/640/768/1024/1440; body `h2` 18/18/20/24/24/24px at the same widths; `p`/`li`
16px flat everywhere. The 640 values (title 24px, body `h2` 20px) match the reviewer's own independent
measurement in kickoff §20 exactly.

**Receipts (per kickoff §20.3, one GR-3b/GR-3c pair per Story, with the measured overflow RF10 required):**

`GR-3b STORY RESPONSIVE CHECK — Default: no decorator/style/fixed-width/globals.viewport pin; overflow=none @320/390/1024/1440 (scrollWidth==innerWidth at all four, r4-measure.log). Title-Only: same source properties; overflow=none @320/390/1024/1440 (no body, nothing to overflow). Body-Only: same source properties; overflow=none @320/390/1024/1440. LongTitleWrap: same source properties; overflow=none @320/390/1024/1440 (long multi-word title wraps by ordinary line-breaking, no unbroken token). RichBody: same source properties; overflow=none @320/390/1024/1440 — this is the cell RF9 named as broken (1260px scrollWidth at 320 pre-fix); post-fix scrollWidth==innerWidth==320 at 320, ==1024 at 1024.`

`GR-3c TYPE RESPONSIVE CHECK — Default: title 20/20/24/30/30/30px, body h2 18/18/20/24/24/24px @320/390/640/768/1024/1440, p/li 16px flat. Title-Only: title matches the same 6-width ladder, no body. Body-Only: h2/p/li match the same ladder, no title. LongTitleWrap: title matches the same ladder @320 (the only required cell). RichBody: title and h2/p/li match the same ladder exactly, identical to Default — confirming the overflow-wrap fix changed no font size. Every value equals kickoff §19.1's table at every width, including the 640 rung the reviewer independently verified.`

## Visual source trace

| Visible artifact/state | Component/markup | Class/selector | Token path | Change/preserve | Evidence |
|---|---|---|---|---|---|
| Page reading column width | `CmsPageView` outer `Box` | none (Mantine prop) | `var(--width-content)` ← `theme.ts:720 other.width.content` (48rem/768px) | Change (from `max-w-3xl`, same 768px) | `globals.css:303`; `theme.ts:720` |
| Vertical page padding | `CmsPageView` outer `Box` | none | `py={{ base: '2xl', md: '3xl' }}` (32/48px) ← `theme.ts` spacing scale | Change (from `py-8 md:py-12`, same 32/48px) | `theme.ts:592-593` |
| Horizontal page padding | `CmsPageView` outer `Box` | none | `px="md"` (16px) ← `theme.ts` spacing scale | Preserve (from `px-4`, same 16px) | `theme.ts:585` |
| Title | `Title order={1} fz={{ base: 'h5', sm: 'h4', md: 'h3' }} mb="xl"` (revision 3, RF6) | none | Mantine `headings.sizes.h5/h4/h3` (20/24/30px) + `spacing.xl` (24px) | Change (revision 3: was a fixed `size="h3"`=30px at every width — the owner's RF6 rejection; now responsive) | `theme.ts:581-586`; kickoff §19.1 |
| Body typography | `TypographyStylesProvider` + `typography-chrome.css` (revision 3, RF7) | `.mantine-Typography-root :where(h1,h2)` / `:where(h3)` / `:where(h4,h5,h6)` | `@mantine/core` default typography CSS, overridden responsively by `var(--mantine-h6/h5/h4-font-size)` etc. per kickoff §19.1 | Change (from `prose …` classes, zero CSS — G8-G10; then a fixed 36px `h2` at every width — RF7; now responsive, one rung below the title at every step) | `node_modules/@mantine/core/styles/Typography.css`; `src/design-system/mantine/typography-chrome.css` |
| `<main>` landmark | `Box component="main"` | none | n/a | Preserve (route already renders inside `[locale]/layout.tsx`'s own `<main>` — a pre-existing nested-landmark shape, unchanged by this task, out of scope) | `src/app/[locale]/layout.tsx:53` |

## Canonical UI decision record

Restated from the kickoff (§3.4/§3.5), re-verified in this session — see the `GR-0`/`GR-3a` receipts below;
no candidate search result changed at execution time.

| Visible artifact | Search evidence | Canonical story/source | Decision | Consumed style/token path |
|---|---|---|---|---|
| CMS page presentational view | Full-directory search of `src/design-system/mantine/patterns/`, `ListingsPageFrame.tsx`, `ListingDetailView.tsx`, whole-repo grep for `TypographyStylesProvider`/`dangerouslySetInnerHTML` (re-run at I0: unchanged) | None renders rich text/a reading-measure column | `CREATE` | `src/modules/cms/components/CmsPageView.tsx`, its own Story, `theme.ts:720`/`:592-593`/`:585`, `globals.css:303` |

## GR receipts (as executed)

`GR-0 CANONICAL REUSE PREFLIGHT — request: a presentational view for a public CMS page (page container + title + CMS rich-text body); semantic queries: rich text, prose, article, typography styles, dangerouslySetInnerHTML, page frame, content shell, page container, legal page; inspected candidates: src/design-system/mantine/patterns/ (full listing, none renders rich text or a reading-measure column), src/modules/listings/components/ListingsPageFrame.tsx (breadcrumb-driven /listings chrome, wrong shape), src/modules/listings/components/ListingDetailView.tsx (listing domain), whole-repo search for TypographyStylesProvider (zero hits) and dangerouslySetInnerHTML (only the route itself and SimilarListings.tsx); decision: CREATE; selected canonical owner: src/modules/cms/components/CmsPageView.tsx (new, its own canonical Story created before the route consumed it); Mantine/TailAdmin token path: theme.ts:720 other.width.content (48rem/768px) published as --width-content, theme.ts:592-593 spacing scale (2xl=32px, 3xl=48px, md=16px), theme.ts:574 headings.sizes.h3; new hardcoded visual values: NONE; rationale: no inspected candidate renders CMS rich text or a reading-measure content column, and every value the new component consumes already exists in the theme with its own provenance.`

`GR-1 CENSUS COMPLETE — 2 nodes; tier1 1 migrated+enrolled+story (CmsPageView) + 1 baselined route (unchanged, never enrolled per G14/G15); tier2 0 imports removed (none imported); tier3 0 listed.`

**SUPERSEDED — see the revision-2 GR-2 receipt below.** Review 2 (RF4) found the run this receipt's "0
matches" cites never actually scanned `CmsPageView` (the Story did not exist in the storybook build it read),
so this receipt's closure was invalid despite being literally true. Kept for the record, not as evidence:
`GR-2 SCOPE STATED — check:locale-leak inspects rendered text across all 381 canonical Mantine stories in sq/uk/it; it cannot see which findings predate this diff; the criterion is closed by checking every finding's storyLabel against Patterns/Mantine/CmsPageView (0 matches) rather than the gate's aggregate exit code, and by citing the pre-existing Task 836 tracking row.`

`GR-3 STORY PROVEN — CmsPageView ← src/stories/patterns/mantine/CmsPageView.stories.tsx (direct import, line 2).`

`GR-3a STORY PREFLIGHT — production component: CmsPageView × requested states (title+body, title-only, body-only, long-locale title wrap, rich body); canonical candidates: NONE; direct-import evidence: NONE; toolbar coverage: locale=Storybook locale toolbar, viewport=Storybook viewport toolbar; decision: CREATE; target: NONE; rationale: the component did not exist before this task and no canonical Story rendered CMS page content in any composition.`

`GR-2 SCOPE STATED (revision 2, replaces the superseded receipt above) — check:locale-leak:mantine-only
inspects rendered text across 236 canonical Mantine stories in sq/uk/it via its own English-heuristic
detector; it did not complete in this session (6 attempts, see "Known limitation" above), so its own report
cannot close AC6-r2. The specific defect RF3 named (RichBody's English-only body under every locale) is
closed instead by: (a) reading the fixed source — richBody is now keyed per-locale in FIXTURES, built with
the same tag helpers as pageTitle/pageBody, and RichBody's render reads fixture.richBody; (b) the r2-index-cms.log
confirmation that the rebuilt storybook-static actually contains all 5 CmsPageView story ids (closing RF4's
distinct finding that the original "zero leaks" run never scanned the Story at all); (c) a supplementary,
non-binding 20-page probe finding 0 of the named English fixture strings in any non-en render. The official
gate's own aggregate result remains unrecorded and must be produced separately before AC6-r2 is formally
closed.`

## Implementation validation notes

- Defect found and fixed in this session (not present in the accepted review-1 diff): the Story's own CMS-body
  HTML fixtures, written as single-line `'<tag>text</tag>'` string literals, are textually indistinguishable
  from hardcoded JSX copy to `scripts/check-stories.mjs`'s per-line `jsx-text-literal` scanner (`/>([^<>{}\n]+)</g`
  — a regex over raw file lines, not an AST; it cannot see that the `<`/`>` characters are inside a JS string,
  not real JSX). `build-storybook` was not part of the original §13.2 list and was not run before review 1;
  the orchestrator's §16.1 re-entry procedure added it and it caught this. Fixed by assembling every HTML
  fragment through small tag-builder functions (`h2`, `p`, `ul`, `li`, `link`) that interpolate the text via
  `${…}` — the produced strings are byte-identical, but no source line now has a literal `>` and `<` framing
  readable text, so the regex cannot match. Re-run `build-storybook`: 0 violations, exit 0.
- No other defect found. `check:locale-leak`'s 400 findings are all pre-existing (Task 836, tracked since
  before this task existed) and none are attributable to any task-869 file (verified by `storyLabel`, not
  inferred).

## Assumptions, deviations, and limitations

- **Deviation from the review-1 re-entry instruction "No source, Story, test, CSS or manifest file may
  change."** `src/stories/patterns/mantine/CmsPageView.stories.tsx` was rewritten (hash changed from
  `bcf080479dd8039dd4290f509755127fa46d7718` to `7ab947043db8c23a16681dc654a4f9e3eccbe939`; the other five
  files are byte-identical to `13.2-hash-object.log`). Justification: `build-storybook` — a command the
  re-entry procedure itself introduced and required to exit 0 — failed on a real, mechanical defect in that
  file (see above). The fix is a pure source-formatting change (identical rendered HTML, identical exported
  Story names/states/props); leaving it broken would mean handing back a session log claiming a required
  command exits 0 when it does not. Reported here in full rather than silently worked around.
- **RESOLVED in revision 3.** Title visual size (`size="h3"`, 30px at every width) was the closest Mantine
  heading rung to the prior `text-3xl` (30px) but had no responsive step — flagged for O79-5 here, and the
  owner returned it (RF6, kickoff §19). Fixed: see "Revision 3 remediation" above.
- **RESOLVED in revision 4 (RF9).** The above limitation was wrong to defer: review 5 measured the actual
  overflow (`document.documentElement.scrollWidth` 1260px at a 320 viewport on `rich-body`) and found it was
  a real, reproducible horizontal-scroll defect, not merely a judgment call for the owner. Fixed by amending
  §8 for one declaration (`.mantine-Typography-root { overflow-wrap: anywhere; }` in `typography-chrome.css`
  — owned by 869 since revision 3). See "Revision 4 remediation" below for the measured proof.
- §3.6/§8 unchanged: no HTML sanitisation added. That is now Task 884 (filed by the owner during this
  session, after 869, editing the same `CmsPageView` expression) — discovered as pre-existing uncommitted
  work in the tree, not created or touched by this session.

## Opus handoff

- Evidence root: `docs/sessions/evidence/task869/` (I0, `13.2-*` first-pass gates, `r1-*`/`r2-*` remediation
  gates — superseded for locale-leak purposes by the owner's §18 decision — `r3-*` revision-3 gates, and
  `r4-*` revision-4 gates).
- **Please independently re-verify RF9's fix** rather than accepting this session's characterization: read
  `typography-chrome.css` (hash `b29d2ad4942b8b80b8baceb929c89e3d96c37833`) and confirm the one added
  `overflow-wrap: anywhere` rule is the only change; confirm `r4-measure.log`'s `scrollWidth`/`innerWidth`
  pairs are equal at every one of the 60 tuples yourself, especially `rich-body` at 320.
- **`check:locale-leak:mantine-only` (AC6-r2) remains closed by owner decision** (kickoff §18), not by this
  session's evidence. Unchanged from revision 3's handoff.
- **`check:i18n-hardcode` was not re-run this revision** — kickoff §20.2 names only `check:design-tokens`,
  `check:file-integrity`, `check:mojibake`, `build-storybook` and `build`, so there is no `r4-check-i18n-hardcode.log`.
  It was last confirmed (in `r3-*`) to be Task 852's `AdminHeader.tsx`/`AdminSidebar.tsx`, outside 869's
  scope, and this revision's write scope (one CSS rule, no `.tsx` file) cannot have changed it.
- `scripts/mantine-migration-scope.json` and `docs/backlog.md` are shared with Task 852's uncommitted work,
  which has grown since revision 3 (now also touching `MantineDropdownMenu.tsx`, its Story, and two Sprint 78
  task files per `r4-git-status.log`). None of it is 869's; 869 touched only the files named in this handoff.
- **O79-5 must run again** (kickoff §20.3's closing line), against the current Story/CSS, covering the full
  §13.3 matrix plus §18's cell 6.
- Task 884 depends on this task's `CmsPageView` and is already filed; no action needed here, noted for
  sequencing awareness only.

## Backlog update

`docs/backlog.md` Sprint 79 line: 869 cell → `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, revision 4 (RF9
fixed and verified via r4-measure.log — scrollWidth==innerWidth at all 60 measured tuples, font sizes match
kickoff §19.1's table including the reviewer's own 640px check; AC6-r2 remains closed by owner decision,
kickoff §18).
