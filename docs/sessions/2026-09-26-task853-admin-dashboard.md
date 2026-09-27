# Session Archive: Task 853 — `/admin` becomes the spec's operations dashboard — 2026-09-26

Task: `tasks/Archive/Sprint_78_kickoff_prompt_Task_853_Admin_Operations_Dashboard.md` (archived 2026-09-27, review 4 `APPROVED WITH NOTES`)
Sprint 78 · P1 · Q3 · Executor: Sonnet (`claude-sonnet-5`)

`CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.`

## Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

**Revision 2 (2026-09-27, kickoff §17, review 2 `NEEDS REVISION`) is the current pass — see
"Revision 2" at the end of this file for R16 and the retained evidence under
`docs/sessions/evidence/task853/r2/`.** Revision 1 (below) is unchanged and accepted by review 2.

**Revision 1 (2026-09-26, kickoff §16, review 1 `NEEDS REVISION`) closes out this task.** R1–R15 are
all implemented, AC1–AC13 are verified — most with real live data under a real staff session
(**O853-1** fulfilled; see "Revision 1 — live proof" below) — and the full automated gate block,
including the review-1 amendments, is green except the two findings review 1 itself named as
pre-existing/out-of-scope (`contactEvents.ts`, owned by **887**) and accepted-as-delivered items
(the `Spam` allowlist entry, the stale `check:listing-visibility` row). See "Revision 1" below for
the complete R10–R15 evidence; the original pass's evidence (R1–R9, AC1–AC8 first pass) is preserved
unchanged above/below it.

## I0 — platform line, status porcelain, dependency confirmation

```
win32 v22.22.3
```

`git status` at session start: clean, `main` branch, up to date with `origin/main` (see conversation
system context). 843 · 844 · 845 · 846 · 847 · 852 confirmed **archived** in `docs/backlog.md`
("Wave B is complete... 853 and 854 are unblocked").

## Requirement evidence

| Req | Evidence |
|---|---|
| R1 | `AdminDashboardView.tsx` renders §3.1's five rows in order via `MantineDashboardGrid`/`TopRow`/`Split`/`Full`; every block reads its `BlockResult` — `ok:false` → the owning `MantineDashboardCard`/`MantineDashboardStatCard` `state="error"` (no digit rendered, error branch never reaches `value`); `ok:true` with 0 → `zeroText`/`emptyText`/`allZeroState` positive copy (`adm01_zero`, `adm02_zero`, `adm06_zero`, `adm09_breakdown_zero`, `location_requests_zero`, `adm11_empty`). |
| R2 | `src/app/admin/page.tsx` is a 9-line async Server Component: two awaited data calls, one JSX line (`<AdminDashboardView data={data} locale={locale} />`). No `className`, no function prop, no `'use client'`. `AdminDashboardView` is the `'use client'` boundary and owns `onRetry = () => router.refresh()` itself (791 lesson). |
| R3 | `formatCount(n, locale)` throughout (`fc` helper), `locale` = `getAdminLocale()` (cookie-driven admin locale, not a hardcoded `'sq'`); dates via `tiraneAbsoluteLabel` (846). |
| R4 | `AdminDashboardRecentListings.tsx` rebuilt: `Stack` of dividered rows, `UnstyledButton` opens `MantineModal` preview (Epic K §11), premium star (`iconSize.compact`, theme `yellow`), price `visibleFrom="sm"`, status `Badge` from `LISTING_STATUS_COLOR`, `RelativeTime` with `absoluteLabel` + `focusable={false}`. Modal footer: two `Button` links, `Flex direction={{base:'column-reverse', sm:'row'}}`. Own Story, enrolled. |
| R5 | `AdminPageHeader` import removed from `page.tsx`; untouched everywhere else (not in this task's edited-file set). |
| R6 | See "i18n" below — `check:i18n` exits 0, all four locale files parity-checked (2412 keys each). |
| R7 | `AdminDashboardView.stories.tsx` — 5 states: `Default` (all-ok), `Adm02Error`, `AllQueuesZero`, `Adm09Zero`, `NoLocationRequests`, all built from `src/stories/fixtures/adminDashboard.fixtures.ts` using 847's own `AdminDashboardData`/`blockOk`/`blockFail`. Enrolled. |
| R8 | Baseline writer run — see "Surface census" below. |
| R9 | See "GR-3b" below — measured 0 horizontal overflow at 320/390/1024/1440 on both new stories. |

## Files Changed

| File | git hash-object |
|---|---|
| `src/app/admin/page.tsx` | `74b26361b0f4c90c33e45c0ed15195483fbcfc8e` |
| `src/components/admin/AdminDashboardRecentListings.tsx` | `f246ab456f802dabc1fe527ce2162b2bb83aec39` |
| `src/modules/admin/dashboard/components/AdminDashboardView.tsx` (new) | `e10ad898735c20469c417b631701d29e87b98d42` |
| `src/stories/fixtures/adminDashboard.fixtures.ts` (new) | `8bba87b3296de7e882ea62b0c144c123728aad07` |
| `src/stories/patterns/mantine/AdminDashboardRecentListings.stories.tsx` (new) | `f81418b4dc9c6e849fbe74f8e3652e64ebf361ff` |
| `src/stories/patterns/mantine/AdminDashboardView.stories.tsx` (new) | `154527665ebbe9f34149b7f0c885752394443b26` |
| `scripts/mantine-migration-scope.json` | `835789ae273fa5019e544c9968daa810db90baac` |
| `scripts/surface-census-baseline.json` (writer output) | `a2f9a9155d7cddb3b441bb9a782d9dfdc99b88d9` |
| `scripts/check-listing-visibility.mjs` (stale allowlist row removed — see below) | `6f9ecc13e38e43b0c75759e5ea7186ae86681374` |
| `scripts/check-locale-leak.mjs` (one loanword allowlist entry added — see below) | `a6b5001eb680913bb97c63b8fe432581e0f5040f` |
| `messages/en.json` | `b4b33f8705e1233da7a9623d9ec20d38a51d7554` |
| `messages/sq.json` | `be8449eed8b6ab40339d23a8192eaf963380798a` |
| `messages/uk.json` | `417d7393956e61b57a76f7ba8c1ea1b2735eaf71` |
| `messages/it.json` | `4efa97e2fd26b88c398fef142e217bf34ba6080d` |
| `docs/backlog.md` (853 line updated) | `154e64c8ff966a84a56630e451ca2f9bf4513754` |

Evidence scripts (not part of the shipped diff): `docs/sessions/evidence/task853/admin-probe.mjs`,
`gr3b-gr3c-measure.mjs`, `gr3c-measure.mjs`.

## i18n (R6)

Removed (verified zero consumers repo-wide, per-key `git grep`, before removal): `stat_active`,
`stat_new_listings_7d`, `stat_users`, `stat_new_7d`, `stat_new_7d_sub`, `stat_open_tickets`,
`stat_pending_reports`, `status_breakdown_title`, `pending_reports_title`, `pending_reports_empty`,
`pending_reports_view_all`. Kept unchanged (still consumed): `title`, `dialog_*` (6),
`location_requests_*` (3), `recent_listings_*` (2). Updated value only: `subtitle` → "Operational
state of the platform" (all 4 locales). ~40 new keys added for the §3.1 composition (queue labels,
work-list titles/footers, donut segment labels, ADM-08/09 copy, error text). `check:i18n`: **PASS**
— 2412 keys, all four locales.

## Surface census (R8, AC6, AC7)

Standalone census `node scripts/check-surface-census.mjs --surface src/app/admin/page.tsx`:

```
src/app/admin/page.tsx                                                  tier1 manifest:no  story:no  className:0  (root)
src/modules/admin/dashboard/components/AdminDashboardView.tsx           tier1 manifest:yes story:yes className:0
src/components/admin/AdminDashboardRecentListings.tsx                   tier1 manifest:yes story:yes className:0
src/components/shared/RelativeTime.tsx                                  tier1 manifest:yes story:yes className:0
... (14 more nodes, all MantineDashboard* patterns, all manifest:yes story:yes className:0)
```

No `tier2-legacy-primitive` node anywhere in the tree. `AdminDashboardView` and
`AdminDashboardRecentListings` both show `manifest:yes story:yes`, matching AC6 exactly. The page's
own root row is `manifest:no story:no className:0` — this is the documented **container exemption**
(`docs/golden-rules.md` GR-1, Task 872/D81-2: 0 `className`, 0 `ui-imports`, its only JSX is
`<AdminDashboardView …/>`, and that View is enrolled with its own Story). **The standalone
`check-surface-census.mjs` command itself does not encode this exemption and exits 1 on the route's
own root node** — GR-1's own text says so explicitly ("the census cannot yet recognise the split, so
the container stays as baselined debt"), and I reproduced the identical exit-1 result on the
already-**approved** Task 869 CMS route (`src/app/[locale]/[slug]/page.tsx`) for comparison — same
tool, same shape, same non-zero exit. This is a pre-existing tool limitation, not a defect this task
introduces; the content of the census (the part AC6 actually names) matches.

`GR-1 CENSUS COMPLETE — 17 nodes (full transitive walk); tier1 16 migrated+enrolled+story + 1
container-exempt (src/app/admin/page.tsx, per Task 872/D81-2); tier2 0; tier3 0. Legacy imports
removed from the surface: AdminPageHeader, ui/button, ui/dialog (replaced by the enrolled Mantine
patterns above).`

`node scripts/check-surface-census-changed.mjs --base HEAD --update-baseline`:

```
Baseline updated -> scripts\surface-census-baseline.json
    entries written: 451 (down from 456)
```

`git diff --stat -- scripts/surface-census-baseline.json` → 15 deletions, 0 insertions, exactly the 5
named rows (`AdminDashboardRecentListings`, `AdminPageHeader`, `RelativeTime`, `ui/button`,
`ui/dialog`, all keyed `src/app/admin/page.tsx :: …`) — matches R8/AC7 exactly, no other row touched.
Re-running `check:surface-census:changed --base HEAD` after the write: **PASS**, exit 0, 0 new, 0
stale.

## GR-3a (Story preflight) and GR-3 (Story proven)

`check:story-coverage`: **PASS** — 108/108 manifest entries covered, 0 unproven — both new components
included. `GR-3 STORY PROVEN — AdminDashboardView ← src/stories/patterns/mantine/AdminDashboardView.stories.tsx;
AdminDashboardRecentListings ← src/stories/patterns/mantine/AdminDashboardRecentListings.stories.tsx`.

## GR-3b (Story responsive check)

Measured via a real Storybook build (`npm run build-storybook`, served statically) + Playwright, at
320/390/1024/1440, `Default` story, `globals=locale:en`:

```
patterns-mantine-admindashboardview--default
  320px: scrollWidth=320 clientWidth=320 overflow=false
  390px: scrollWidth=390 clientWidth=390 overflow=false
  1024px: scrollWidth=1024 clientWidth=1024 overflow=false
  1440px: scrollWidth=1440 clientWidth=1440 overflow=false

patterns-mantine-admindashboardrecentlistings--default
  320px: scrollWidth=320 clientWidth=320 overflow=false
  390px: scrollWidth=390 clientWidth=390 overflow=false
  1024px: scrollWidth=1024 clientWidth=1024 overflow=false
  1440px: scrollWidth=1440 clientWidth=1440 overflow=false
```

`GR-3b STORY RESPONSIVE CHECK — patterns-mantine-admindashboardview--default: 320 320/320 · 390
390/390 · 1024 1024/1024 · 1440 1440/1440; overflow: none; fixed-width containers: NONE; style
objects: NONE; viewport pins: NONE.`
`GR-3b STORY RESPONSIVE CHECK — patterns-mantine-admindashboardrecentlistings--default: 320 320/320 ·
390 390/390 · 1024 1024/1024 · 1440 1440/1440; overflow: none; fixed-width containers: NONE (the
`Box maw={theme.other.boxSize.dashboardContentMaxWidth}` reproduces the real parent's own contract —
`MantineDashboardGrid.tsx:50` — cited in-file); style objects: NONE; viewport pins: NONE.`

## GR-3c (type responsive check) — one finding, flagged for an orchestrator decision

Measured on `AdminDashboardView`'s `Default` story at 320/390/768/1440 (`getComputedStyle` on every
`h1`–`h6`):

```
320/390/768/1440px (identical at every width):
  H1 "Dashboard"           fontSize=24px   ← MantineDashboardHeader.tsx's own `Title order={1} size="h4"`
  H2 "Moderation queue"    fontSize=20px
  H2 "Listing status"      fontSize=20px
  H2 "Complaints"          fontSize=20px
  H2 "Support queue"       fontSize=20px
  H2 "Location requests"   fontSize=20px
  H2 "State of supply"     fontSize=20px   ← this task's own new heading (Title order={2} size="h5")
  H2 "Recent listings"     fontSize=20px
```

Every `h2` this task renders — including its own new "State of supply" heading — is 20px at every
width, under GR-3c's 24px threshold: **no new violation from this task's own code.**

`H1 "Dashboard"` is **24px at every width, static, no responsive `fz`** — this is
`MantineDashboardHeader.tsx`'s own `<Title order={1} size="h4">` (Task 843, approved and archived
2026-09-18, eight days before GR-3c existed — GR-3c is a same-day rule, written 2026-09-26 by Task
869's finding). This task consumes `MantineDashboardHeader` unchanged; it does not create this title.
Below 640px this is a real, measured GR-3c violation (a page heading over 20px). I did not modify
`MantineDashboardHeader.tsx` myself: it is out of this task's edited-file scope (§7), it is a shared
pattern also destined for 854's consumption, and Sprint 83/Task 886 ("every Mantine `Title` of 24px or
more — 16 sites, 11 files") was opened today specifically to inventory and fix exactly this class of
finding site-wide — unilaterally patching one shared pattern from inside 853 risks fighting that
task's own accounting. Reporting this measured fact rather than silently passing GR-3c or
unilaterally editing shared infrastructure outside this task's scope; the orchestrator can decide
whether this task's own kickoff should absorb the `MantineDashboardHeader` fix, defer to 886, or
open a new number.

`GR-3c TYPE RESPONSIVE CHECK — patterns-mantine-admindashboardview--default: H1"Dashboard" 320 24px ·
390 24px · 768 24px · 1440 24px; H2 (7 instances, incl. this task's own "State of supply") 320/390/768/1440
all 20px; ≥24px text without a responsive step: 1 (H1 "Dashboard", inherited from MantineDashboardHeader.tsx,
Task 843, pre-dates GR-3c); heading above 20px below 640 (non-hero): same H1; child heading larger
than page title: NONE.`

## Final gate block (§13.2)

| Command | Result |
|---|---|
| `node -p "process.platform + ' ' + process.version"` | `win32 v22.22.3` |
| `npm run typecheck` | **PASS** (0 errors) |
| `npm run lint` | **PASS** (0 errors; 91 pre-existing warnings, none in touched files) |
| `npm run check:i18n` | **PASS** — 2412 keys × 4 locales |
| `npm run test -- src/modules/admin/dashboard/__tests__` | **PASS** — 31/31 |
| `npx vitest run src/modules/listings/lib/__tests__/visibility.test.ts` | **PASS** — 66/66 |
| `npm run check:listing-visibility` | **PASS after removing the stale allowlist row this task's own edit orphaned** (`src/app/admin/page.tsx` no longer contains `.eq('status','active')` — the row referencing it in `scripts/check-listing-visibility.mjs` was deleted). One **pre-existing, out-of-scope** finding remains and is not fixed here: `src/modules/listings/actions/contactEvents.ts:50` (last touched 2026-09-20, not in this task's file scope) — reported, not silently ignored. |
| `npm run check:stories` | **PASS** — 174 files, 0 violations |
| `npm run check:story-coverage` | **PASS** — 108/108 covered |
| `npm run check:pattern-enrolment` | **PASS** — 52 pattern files, 108 manifest entries (this task's two new files are outside `src/design-system/mantine/patterns/`, so this specific gate doesn't scope them; they're covered by `check:story-coverage`/`check:rendered-scope`/surface-census instead) |
| `npm run check:design-tokens:strict` | **PASS after fixing 2 raw `gap={n}` props** (`gap={2}`→`gap="micro"`, `gap={4}`→`gap="tight"`) |
| `npm run check:enrolled-tailwind` | **PASS** — 2 pre-existing findings elsewhere, baseline-matched, neither in this task's files |
| `npm run check:rendered-scope` | **PASS** — 0 new edges, 22 baselined (pre-existing) |
| `node scripts/check-surface-census-changed.mjs --base HEAD` | **PASS** after the baseline write (see above) |
| `node scripts/check-surface-census.mjs --surface src/app/admin/page.tsx` | Content matches AC6; **command itself exits 1** on the route's own container-exempt root — see "Surface census" above (reproduced identically on the already-approved 869 CMS route) |
| `npm run build-storybook` | **PASS** — both new story files built (`AdminDashboardView.stories-*.js`, `AdminDashboardRecentListings.stories-*.js`, `AdminDashboardRecentListings-*.js`) |
| `npm run check:locale-leak:mantine-only -- --fast` | Found and fixed one real finding (`"Spam"` loanword false-positive); **PASS after the fix — 0 leak lines for `patterns-mantine-admindashboard*`** (see below) |
| `npm run build` | **PASS** — `/admin` compiles, 6.12 kB / 421 kB First Load JS, all 40 static/dynamic routes generated |
| `npm run check:file-integrity` | **PASS** — 13 changed files clean |
| `npm run check:mojibake` | **PASS** — 0 artifacts / 7078 files |
| AC5 grep (3 named files) | **Prints nothing** (exit 1 — `git grep` convention for "no match") after rewording one doc-comment line that literally contained the words `className`/`cn`/`@/components/ui/*` as prose, not code |
| `git diff --stat` | 9 tracked files changed, 311 insertions / 481 deletions (untracked new files listed separately in `git status --porcelain`) |
| `git hash-object` (4 named files) | see "Files Changed" table |

## `check:locale-leak:mantine-only`

The official full-mode gate (3 locales × 3 viewports × 397 stories) ran for 25+ minutes with zero
output or artifacts and had to be terminated (this environment has the same documented flakiness
Task 869's session log already recorded for this exact command: "could not complete in-session after
6 attempts"). A `--fast` (1-viewport, still 3 locales × 244 Mantine-scoped stories) run of the same
`--mantine-only` scope completed cleanly and found **6 leak lines, all one real finding**:

```json
{ "storyId": "patterns-mantine-admindashboardview--default", "locale": "sq", "token": "Spam" }
{ "storyId": "patterns-mantine-admindashboardview--default", "locale": "it", "token": "Spam" }
{ "storyId": "patterns-mantine-admindashboardview--adm-09-zero", "locale": "sq", "token": "Spam" }
{ "storyId": "patterns-mantine-admindashboardview--adm-09-zero", "locale": "it", "token": "Spam" }
{ "storyId": "patterns-mantine-admindashboardview--no-location-requests", "locale": "sq", "token": "Spam" }
{ "storyId": "patterns-mantine-admindashboardview--no-location-requests", "locale": "it", "token": "Spam" }
```

Root cause: the fixture's ADM-02 row reads `reason: 'spam'` through the real production key
`listing.report_reason_spam` (`tl()`), same as production always has — this is not new copy this
task introduced. Verified against `messages/*.json`: `en:"Spam"`, `sq:"Spam"`, `it:"Spam"` (a genuine
international loanword, identical in all three), `uk:"Спам"` (correctly transliterated, so it was
never flagged). This is the exact same class of false positive the detector's own
`LEAK_ALLOWLIST` already documents for `Password`/`Dashboard`/`Premium`/`Min` (Task 624) — a real,
correct, verified translation, not a hardcode. Fixed by adding one narrow entry,
`/^(Spam)$/`, to `scripts/check-locale-leak.mjs`'s global allowlist, with the same verification-and-
citation discipline as the existing Task 624 entries; confirmed the regex matches `"Spam"` and not
`"Спам"` (so a real future uk mistranslation of this key would still be caught). **Re-run after the fix confirms it**: `.screenshots/locale-leak/2026-09-26T14-09/report.json` —
`leakCount: 166` (down from 172; exactly the 6 removed, nothing else changed), and
`report.leaks.filter(e => JSON.stringify(e).includes('admindashboard'))` → `[]`. **Zero leak lines
for `patterns-mantine-admindashboard*`**, matching the kickoff's §13.2 expected outcome exactly.

## GR receipts

`GR-0 CANONICAL REUSE PREFLIGHT` — emitted at session start (see conversation).
`GR-1 CENSUS COMPLETE` — above.
`GR-3 STORY PROVEN` — above.
`GR-3a STORY PREFLIGHT` — kickoff §12's own receipt, fulfilled (`check:story-coverage` confirms 0
canonical candidates existed before this task; both are now `CREATE`d with their own Stories).
`GR-3b STORY RESPONSIVE CHECK` — above, one per story.
`GR-3c TYPE RESPONSIVE CHECK` — above, one finding flagged.
`GR-4 AC AUDIT` — 8 criteria (kickoff's own count), reused verbatim: each states an observable
property; the one absolute (AC5's empty grep) is the kickoff's own accepted exception.
`GR-6` — not applicable to Sonnet (Opus-only rule); this handoff contains no `git add`/`commit`/`push`.

## Assumptions, deviations, and limitations

- **ADM-08/ADM-09 top-level `StatCard`s carry no `href`.** The kickoff's §3.1 composition table does
  not list one for either (unlike ADM-01/02/06), and both cards embed nested interactive content —
  ADM-08 an info-`Tooltip`/`ActionIcon`, ADM-09 a `MantineDashboardStatRows` of its own row links —
  so wrapping either card body in `component={Link}` would nest an `<a>` around another `<a>`/`<button>`,
  the exact "no nested competing clickable" defect this codebase's own rules (RelativeTime
  `focusable`, WorkList row design) exist to prevent. Not a deviation from the spec table; a read of
  it that avoids an accessibility regression the table didn't ask for either.
- **ADM-08's rule text sits in `secondaryLine`, not `caption`.** `MantineDashboardStatCard`'s
  `caption` prop is always wrapped in a `<Text>` internally; nesting a `<Group>`/`<ActionIcon>` inside
  it would be invalid markup. `secondaryLine` renders its node raw, so that's where the tooltip lives.
- **`AdminDashboardRecentListings`'s absolute-time labels are computed client-side** via
  `tiraneAbsoluteLabel` (846) directly in the component, not threaded through as a pre-formatted
  prop — the function is pure (`Intl` with an explicit IANA zone, no machine-clock/machine-timezone
  read), so this is hydration-safe and keeps the component's own prop surface to plain `RecentListingRow[]`.
- **MantineDashboardHeader's static 24px title (GR-3c)** — see above; flagged, not fixed, pending an
  orchestrator decision on ownership (853 vs. 886 vs. a new number).
- **Live proof (§10.6) and the owner visual matrix (§13.3) are outstanding.** This executor has no
  valid staff session: the one candidate `playwright/.auth/admin-storage-state.json` file
  (previously unverified per `docs/backlog.md`'s 781R2 residue row) was tried against a local dev
  server and its Supabase auth cookie is **expired** — `/admin` redirected to
  `/en/auth/login?next=%2Fadmin&session=lost`. An unauthenticated request to `/admin` was confirmed
  to compile and correctly redirect (`307` → login), proving the route itself has no runtime error,
  but this is not a substitute for the real staff-session widths/error-plant/link-URL evidence §10.6
  requires, nor for the owner's own visual matrix (Q3 requires full canonical visual proof, which is
  inherently owner/orchestrator work per `docs/qa-profiles.md`).
- `contactEvents.ts`'s pre-existing `check:listing-visibility` finding is unrelated to this task
  (last touched 2026-09-20, not in scope) and is reported, not fixed.

## Revision 1 (2026-09-26) — review 1 remediation, kickoff §16.5

**O853-1 fulfilled.** The owner ran `capture:admin-session` before this revision started
(`playwright/.auth/admin-storage-state.json` mtime 2026-09-26 17:38, auth cookie expiry 2027-10-31).
Re-verified working against a real dev server before starting R10–R15.

### I0 — hash comparison against review 1

| File | Review 1 hash | This session, before any edit |
|---|---|---|
| `page.tsx` | `74b26361` | `74b26361` — unchanged, matches |
| `AdminDashboardRecentListings.tsx` | `f246ab45` | `f246ab45` — unchanged, matches |
| `AdminDashboardView.tsx` | `e10ad898` | `e10ad898` — unchanged, matches |
| `surface-census-baseline.json` | `a2f9a915` | `a2f9a915` — unchanged, matches |

All four equal review 1's table — confirms the worktree Opus reviewed is the one this revision
started from.

### R10–R15 implementation

- **R10** (`AdminDashboardRecentListings.tsx`) — each row now renders two layers inside the same
  `UnstyledButton`, split by `hiddenFrom="sm"` / `visibleFrom="sm"`, the identical mechanism
  `MantineDashboardWorkList.tsx:135-160` uses (cited in a comment at the split). Below `sm`: line 1 is
  the avatar + a `flex={1} miw={0}` column holding the title (`lineClamp={2}`, `flex={1}` so it fills
  the column minus the premium star) and the owner name; line 2 is the status badge + `RelativeTime`,
  `wrap="wrap"`. From `sm` up the original horizontal split is unchanged (price now scoped inside the
  `visibleFrom="sm"` block instead of carrying its own `visibleFrom` prop, since the whole block is
  already gated).
- **R11** — both `style={{...}}` objects removed; `flex={1} miw={0}` and `miw={0}` style props in
  their place. `grep -n "style="` on the file: 0 matches.
- **R12** — `MantineDashboardHeader.tsx:60`: `<Title order={1} size="h4" fz={{ base: 'h5', sm: 'h4' }}>`.
  `MantineDashboardStatCard.tsx:142`: `fz={{ base: 'h5', sm: 'h4', md: 'h3' }}` (the `lh` and the
  skeleton height at `:92` are untouched, exactly as specified). Both are one-prop edits, nothing else
  changed in either file.
- **R13** — all three `AdminDashboardRecentListings` Stories now render
  `MantineDashboardGrid > MantineDashboardGridFull > MantineDashboardCard`, the real production parent
  chain (cited: `AdminDashboardView.tsx:377-392`), with `title={storyT(locale,
  'admin.dashboard.recent_listings_title')}` and `state="ready"`. No `Box`, no `w`/`maw`/`miw`/`px`/`py`,
  no `style`, no `theme` import — confirmed by reading the file (0 matches for any of those).
- **R14** — `AdminDashboardRecentListingsProps` gained a required `emptyText: string`. With 0 rows the
  component now returns `<MantineEmptyLoadingErrorState state="empty" description={emptyText} />` and
  no row button. `AdminDashboardView.tsx` passes `t('recent_listings_empty')`. New key
  `admin.dashboard.recent_listings_empty` added to all four locales with the exact value of that
  locale's own `adm11_empty` (en "No listings yet", sq "Ende nuk ka njoftime", uk "Оголошень ще немає",
  it "Ancora nessun annuncio") — verified equal, not just similar.
- **R15** — location-request rows now use `ctaLabel: t('worklist_cta_review')`. Verified zero
  remaining consumers of `location_requests_review` before removing it
  (`git grep --untracked location_requests_review -- src` → no output). `location_requests_view_all`
  and `recent_listings_all` lost their trailing ` →` in all four locales (their only consumers are
  `AdminDashboardView.tsx`).

`check:i18n` after all i18n edits: **PASS** — 2412 keys, all four locales (net zero: 1 key removed,
1 added).

### AC9–AC13 evidence (fresh `build-storybook`, served locally, Playwright measurement)

**AC9** — `patterns-mantine-admindashboardrecentlistings--default`, 320/390, en/uk:

```
en 320px: scrollWidth=320 clientWidth=320 (no overflow)
  row 1 (premium): rowWidth=246.0 avatarWidth=38.0 titleWidth=174.0 colWidth=196.0  (Δ22 = star 14 + gap 8, exact)
  row 2: rowWidth=246.0 avatarWidth=38.0 titleWidth=196.0 colWidth=196.0  (exact match)
  row 3: rowWidth=246.0 avatarWidth=38.0 titleWidth=196.0 colWidth=196.0  (exact match)
en 390px: scrollWidth=390 clientWidth=390 (no overflow) — same pattern, wider column
uk 320px / 390px: identical shape, Cyrillic text, same widths (no overflow)
```

Every non-premium row's title is exactly as wide as its column (0px difference); the one premium row's
title is narrower by exactly the star icon's width plus its gap (14px + 8px = 22px) — the column still
belongs entirely to the title+star pair, matching R10's own spec ("a column holding the title …,
premium star beside it"), not a regression of F1 (which measured a title crushed to 0–17px of a
288px row — a ~94–100% reduction; here the title occupies 71–84% of the row even in the worst case).
768/1440: price visible for all 3 rows (`"85,000 EUR"`, `"45,000 EUR"`, `"210,000 EUR"`), no overflow.

**AC10** — measured `getComputedStyle(el).fontSize` at 320/390/768/1440, `uk` locale, across
`admindashboardview--default`, all `dashboardheader--*`, all `dashboardstatcard--*` (default, zero),
and `dashboardgrid--default` (which itself composes `StatCard`):

| Element | 320 | 390 | 768 | 1440 |
|---|---|---|---|---|
| H1 page title (every Header story) | 20px | 20px | 24px | 24px |
| StatCard value (every StatCard/Grid story) | 20px | 20px | 30px | 30px |

Matches §16.4's table exactly at every width and every story checked; 1440 values are unchanged from
before (H1 24px, value 30px), as AC10 requires. Zero violation fields across every story. (The donut's
own centre-total text, unrelated to R12, stays a fixed 20px at every width — under the 24px threshold,
so no GR-3c step is required there.)

`GR-3c TYPE RESPONSIVE CHECK — patterns-mantine-dashboardheader--default/fresh/without-period-control, patterns-mantine-dashboardstatcard--default/zero, patterns-mantine-dashboardgrid--default, patterns-mantine-admindashboardview--default: H1 320 20px · 390 20px · 768 24px · 1440 24px; StatCard value 320 20px · 390 20px · 768 30px · 1440 30px; ≥24px text without a responsive step: NONE; heading above 20px below 640: NONE; child heading larger than page title: NONE.`

**AC11** — all three recent-listings Stories: AC5's grep prints nothing for the file (confirmed above);
no `Box`/`maw`/`w=`/`px=`/`py=`/`globals` pin in the Story source (`grep -nE
"Box|maw=|w=\"|px=|py=|globals" src/stories/patterns/mantine/AdminDashboardRecentListings.stories.tsx`
→ 0 matches). Width measured at 320/390/1024/1440 for all three states — no overflow at any width, card
width scales fluidly with the real `MantineDashboardGrid`/`Card` gutters (288/358/976/1392px, matching
the same `px={{base:'md',md:'xl'}}` math the real `/admin` page uses, because it's now the same
components, not a reproduction of them).

`GR-3b STORY RESPONSIVE CHECK — patterns-mantine-admindashboardrecentlistings--default/modal-open/empty: 320 288/320 · 390 358/390 · 1024 976/1024 · 1440 1392/1440; overflow: none; fixed-width containers: NONE (real MantineDashboardGrid/GridFull/Card, not reproduced); style objects: NONE; viewport pins: NONE.`

**AC12** — `Empty` story, en and uk:

```
en: bodyText="Recent listings\n\nNo listings yet" rowButtons=0
uk: bodyText="Останні оголошення\n\nОголошень ще немає" rowButtons=0
```

**AC13** — `admindashboardview--default`, 1440, en: 37 total `a`/`button` elements, 0 contain `→`.

### Full gate block (§13.2, review-1 amendments applied)

| Command | Result |
|---|---|
| `npm run typecheck` | PASS |
| `npm run lint` | PASS (0 errors; same 92 pre-existing warnings) |
| `npm run check:i18n` | PASS — 2412 keys × 4 |
| `npm run test -- src/modules/admin/dashboard/__tests__` | PASS — 31/31 |
| `npx vitest run .../visibility.test.ts` | PASS — 66/66 |
| `npm run check:listing-visibility` | **exit 1, exactly one finding** (`contactEvents.ts:50`) — matches the review-1 amendment verbatim, recorded as `exit 1 — expected, 887`, not `PASS` |
| `npm run check:stories` | PASS — 174 files, 0 violations |
| `npm run check:story-coverage` | PASS — 108/108 |
| `npm run check:pattern-enrolment` | PASS — 52 pattern files |
| `npm run check:design-tokens:strict` | PASS — 0 violations |
| `npm run check:enrolled-tailwind` | PASS — 2 pre-existing findings elsewhere, baseline-matched |
| `npm run check:rendered-scope` | PASS — 0 new edges |
| `node scripts/check-surface-census-changed.mjs --base HEAD` | **PASS, exit 0, without re-running the writer** (per §16.3 — R10–R15 add no rendered component; 0 new, 0 stale) |
| `node scripts/check-surface-census.mjs --surface src/app/admin/page.tsx` | Its **only** `FAIL` line is the route root (`tier1-unenrolled-or-unstoried`, `className:0`) — matches AC6's reworded wording exactly; `AdminDashboardView`/`AdminDashboardRecentListings` both `manifest:yes story:yes className:0`, no tier-2 node |
| `npm run build-storybook` | PASS — fresh build used for all AC9–AC13 measurement |
| `npm run check:locale-leak:mantine-only -- --fast` | PASS — 0 leak lines for `patterns-mantine-admindashboard*` (see below) |
| `npm run build` | PASS — `/admin` 6.24 kB / 421 kB First Load JS, all 40 routes generated, build ran after the last source edit |
| `npm run check:file-integrity` | PASS — 44 files clean |
| `npm run check:mojibake` | PASS — 0 artifacts / 7095 files |
| AC5 grep (5 named files, review-1 amended pattern incl. `style=\{`) | Prints nothing (one doc-comment reword needed first — see below) |
| `git diff --stat` | 18 files changed (566 insertions / 513 deletions) — includes Opus's own review-1 edits to the kickoff/plan files, not just this session's |
| `git hash-object` (4 named files) | `page.tsx` `74b26361` (unchanged) · `AdminDashboardRecentListings.tsx` `79a11ffb` · `AdminDashboardView.tsx` `624c6894` · `surface-census-baseline.json` `a2f9a915` (unchanged — writer not re-run) |

AC5's amended grep (adds `style=\{` and both Story files) first caught the session's own doc comment
at `AdminDashboardRecentListings.tsx:75` ("...288px row..." — literal `px` numbers) — reworded to drop
the digits while keeping the same meaning; re-run prints nothing.

### `check:locale-leak:mantine-only -- --fast`, re-verified after the Story rewrite

R13 rewrote all three recent-listings Stories to render inside the real `MantineDashboardCard`
(previously a bare `Box`), which pulls in more real production chrome per render. Re-ran the full
244-story scan (`.screenshots/locale-leak/2026-09-26T16-32/report.json`) to make sure that didn't
introduce a new leak: `leakCount: 166` — identical to the first pass's post-fix number — and
`report.leaks.filter(e => JSON.stringify(e).includes('admindashboard'))` → `[]`. **Zero leak lines for
`patterns-mantine-admindashboard*`, confirmed after the Story rewrite.** GR-2 scope statement: `--fast`
renders 1 viewport (`mobile-320`) of the 3 the full mode covers (`mobile-320`, `mobile-375`,
`desktop-1280`); it does not check `mobile-375`/`desktop-1280` — the full run has not completed in
this environment for any 853 revision (same limitation Task 869 recorded).

### Revision 1 — live proof (§10.6), real staff session

Session captured against `http://localhost:3000` (matching the owner-requested port), admin UUID
`a5a5bdc1-8e7e-489c-81af-3e7d9b2b85e7` (looked up via `supabase.auth.admin.listUsers` by the
`HYDRATION_ADMIN_EMAIL` in `.env.local` — no UUID was pre-recorded anywhere).

**Widths (AC1)** — real live `/admin`, 1440/1024/768/390/320, en, one authenticated session:

```
Headings, every width (identical order): ["Dashboard","Moderation queue","Listing status","Complaints","Support queue","State of supply","Recent listings"]
scrollWidth == clientWidth at every width (no overflow)
```

"Location requests" does not appear — the real database currently has 0 location requests, so R1's
own rule (render only when count > 0) correctly hides it; this is live behavior, not a defect. The
order otherwise matches §3.1 exactly, with real production data.

**Error plant + revert (AC2, AC3)** — `queries.ts:194`'s `.eq('status', 'pending')` (the ADM-02
pending-count query) temporarily became `.eq('status_PLANT_853', 'pending')`. Pre-plant hash
`d263d56b`. Rendered result at 1440:

```
Complaints card text: "ComplaintsSomething went wrong. Try again.Retry"
has Retry button: true
Moderation queue card text (unaffected): "Moderation queueQueue is empty"
```

The `Complaints` card shows the error message and Retry, no digit; `Moderation queue` (a different
block) still renders its own real data — in this case a genuine positive-zero ("Queue is empty" — 0
pending listings live right now). Reverted; hash after revert: `d263d56b` — **equal to the pre-plant
hash**. Post-revert reload confirmed no error text anywhere on the page.

**AC3, server log** — both dev-server session logs (`/tmp/dev-server-r1.log`, port 3001, and this
session's port-3000 log) searched in full: `grep -c "Functions cannot be passed directly to Client Components"` → **0** in both.

**Modal + links (§10.6 steps 3–4)** — real listing, real modal:

```
Modal opened for row: "APARTAMENT - 1+1 LIQENI THATE" (real listing)
Modal content: Owner "Kamila" · Status "Active" · Price "600 EUR" · Created "6 days ago" · "View on site" / "Admin listings" buttons; footer's responsive rule visible in the injected style (column-reverse below 40em, row from 40em)
```

Per-block hrefs, read from the real rendered `<a href>`:

```
ADM-01 StatCard ("On moderation")        → /admin/listings?status=pending
ADM-02 StatCard ("Complaints in progress") → /admin/reports?status=pending
ADM-06 StatCard ("Unassigned tickets")   → /admin/support?assigned=unassigned&status=open%2Cin_progress
Recent listings header ("All listings")  → /admin/listings
```

All four match `hrefs.ts`'s exports exactly (`pendingListingsHref`, `pendingReportsHref`,
`unassignedSupportHref`, and the hardcoded `/admin/listings`). The ADM-01/ADM-02/ADM-06 work-list
**footer** links ("Whole queue" / "All reports" / "All tickets") were not present live at capture
time — the real queues are currently empty (0 pending listings, 0 pending reports, 0 open tickets),
and the canonical `MantineDashboardWorkList` only renders its footer alongside populated rows (an
existing, accepted pattern behavior, not a defect); the two StatCard hrefs and the header link above
are still real, live, clicked-and-read evidence for the requirement.

### Owner-requested: `check:hydration -- --with-admin`

Run per the owner's explicit instruction, against the real captured session:

```
HYDRATION_GATE_STORAGE_STATE=<path> HYDRATION_ADMIN_USER_ID=a5a5bdc1-8e7e-489c-81af-3e7d9b2b85e7 BASE_URL=http://localhost:3000 npm run check:hydration -- --with-admin

PASS: 6  FAIL: 2  SKIP: 1
FAIL — Admin users list (Task 434 area): HTTP 404 on http://localhost:3000/en/admin/users
FAIL — Admin user detail /admin/users/[id]: HTTP 404 on http://localhost:3000/en/admin/users/<uuid>
```

**Both failures are pre-existing and out of this task's scope.** `scripts/check-hydration-console.mjs`
(last touched 2026-07-15, untouched by this task) hardcodes `/en/admin/users` and
`/en/admin/users/<uuid>` as its Task-434 admin routes, but this app's real admin routes carry no
locale prefix (`/admin/users`, confirmed live: `curl` returns `307`, not `404`, at the un-prefixed
path). This is a stale route definition in the hydration script itself, unrelated to `/admin`
(the dashboard route this task changed) — the 6 PASSing checks include both authenticated-header
routes (Task 599) with no hydration violation. Full transcript: this session's terminal output above;
not re-run against a corrected route, since fixing the script is outside Task 853's scope.

### Files Changed — Revision 1 additions

| File | git hash-object |
|---|---|
| `src/design-system/mantine/patterns/MantineDashboardHeader.tsx` | `7812fedd` |
| `src/design-system/mantine/patterns/MantineDashboardStatCard.tsx` | `ea35f594` |
| `src/stories/patterns/mantine/AdminDashboardRecentListings.stories.tsx` | `cdeb1680` |
| `src/stories/patterns/mantine/AdminDashboardView.stories.tsx` | `15452766` (unchanged) |
| `src/modules/admin/dashboard/queries.ts` | `d263d56b` (unchanged — plant reverted, hash equal) |
| `src/components/admin/AdminDashboardRecentListings.tsx` | `79a11ffb` |
| `src/modules/admin/dashboard/components/AdminDashboardView.tsx` | `624c6894` |
| `messages/en.json` | `b3f237eb` |
| `messages/sq.json` | `c490e09d` |
| `messages/uk.json` | `073d72a8` |
| `messages/it.json` | `44c6031b` |

## Opus handoff

`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. All of review 1's F1–F7 are fixed (R10–R15) or already
accepted (§16.3). Outstanding for the orchestrator/owner: the §13.3 owner visual matrix (rows 1–11,
including the new rows 9–11) — this is inherently owner-native work per `docs/qa-profiles.md`'s Q3
requirement, not something an executor session self-certifies. No self-approval, no mutating git
command issued by this session.

## Backlog update (Revision 1)

`docs/backlog.md`'s 853–856 row updated in place (853 now `IMPLEMENTED - AWAITING ORCHESTRATOR
REVIEW` 2026-09-26, revision 1 complete, with a concise evidence pointer to this file; 854–856
unchanged, still `KICKOFF FILED`). Superseded by review 2 (2026-09-27) — see "Revision 2" below.

## Revision 2 (2026-09-27) — review 2 remediation, kickoff §17.4

Review 2 accepted R10–R15 outright (hashes read equal to revision 1's table; AC5 re-run; census
re-run). Two new findings: **F8** (`RelativeTime` in the recent-listings rows/modal inherited the
page body's 16px black text instead of the meta-text scale) and **F9** (revision 1's evidence was
asserted in prose, not retained as files). **F10** (an orchestrator defect: the withdrawn
`check:hydration -- --with-admin` never actually reaches `/admin`) is not this executor's fix — it
is **888**, folded into this revision only via §17.3's replacement live-console check.

**F9 is closed structurally, not just for this revision:** every command below writes its full
output and exit code to `docs/sessions/evidence/task853/r2/NN-<command>.txt` — the table cites the
exact file next to each result, instead of quoting a number in prose.

### I0 — hash comparison against review 2's list

All nine hashes review 2 read (`page.tsx`, `AdminDashboardRecentListings.tsx`,
`AdminDashboardView.tsx`, `MantineDashboardHeader.tsx`, `MantineDashboardStatCard.tsx`, both Story
files, `queries.ts`, `surface-census-baseline.json`) matched this session's pre-edit state exactly —
confirmed before touching anything. No explanation needed; nothing had drifted.

### R16 implementation

`AdminDashboardRecentListings.tsx`: both row `RelativeTime`s wrapped in
`<Text component="span" size="xs" c="gray.5">…</Text>` (matching the sibling owner-name `Text`'s own
size/colour), and the modal's "Created" `RelativeTime` wrapped in
`<Text component="span" size="sm" fw={500}>…</Text>` (matching the sibling value `Text`s at `dialog_status`/`dialog_price`). Each wrap cites `MantineDashboardWorkList.tsx:151` in a one-line
comment. `absoluteLabel` and `focusable={false}` are unchanged on both row instances.
`RelativeTime.tsx` itself is untouched; no `className` passed to it. No other line in the file
changed beyond these three wraps and the AC5-driven comment reword below.

### AC14 evidence (`docs/sessions/evidence/task853/r2/15-ac14-measure.txt`)

Fresh `build-storybook`, served locally, measured via Playwright:

```
rows @ 320px uk: timeFontSize=12px timeColor=rgb(102,112,133) titleFontSize=14px ownerColor=rgb(102,112,133)  (× 3 rows, identical)
rows @ 1440px en: timeFontSize=12px timeColor=rgb(102,112,133) titleFontSize=14px ownerColor=rgb(102,112,133)  (× 3 rows, identical)
modal Created: timeFontSize=14px timeFontWeight=500 · priceValueCs: fontSize=14px fontWeight=500
```

Every row `time` is 12px, its colour (`rgb(102,112,133)` = `gray.5`) equals the owner name's colour
in the same row, and 12px is smaller than the row's own 14px title — all three AC14 facts, at both
named widths/locales. The modal's `time` is 14px/500, exactly equal to the price value `Text` beside
it. (The story's own `play` function only runs under Storybook's interactions addon, not a bare
`iframe.html` load, so the measurement script clicked the same row itself to open the modal — same
mechanism, not a different one.)

**§17.3 live facts, same values** (`docs/sessions/evidence/task853/r2/live-console-dev-first-capture.txt`,
`live-console-dev.txt`, `live-console-prod.txt`): identical `12px` / `rgb(102,112,133)` for all three
visible rows at both 1440 and 320, under a real staff session, against `next dev` (twice) and a clean
`next start`.

`GR-3c TYPE RESPONSIVE CHECK — patterns-mantine-admindashboardrecentlistings--default/modal-open/empty: largest text at 320/390/768/1440 is 22px (Storybook's own "No Preview" docs-panel chrome, not this component); every value inside the component stays at 12/14px; ≥24px text without a responsive step: NONE.` (full transcript: `docs/sessions/evidence/task853/r2/18-gr3c-recentlistings.txt`)

### AC9 re-check (row's second line changed under R16)

`docs/sessions/evidence/task853/r2/16-ac9-recheck.txt` — identical to revision 1's own numbers at
320/390 (en/uk): non-premium rows' titles equal their column width exactly; the one premium row's
title is narrower by the star's width + gap (22px), unchanged by R16 (the change only touched line
2). 768/1440: all three prices still visible, no overflow.

`GR-3b STORY RESPONSIVE CHECK — patterns-mantine-admindashboardrecentlistings--default/modal-open/empty (re-verified after R16): 320 288/320 · 390 358/390 · 1024 976/1024 · 1440 1392/1440; overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.` (`docs/sessions/evidence/task853/r2/17-gr3b-recheck.txt`)

### §17.3 — live `/admin` console check (replaces the withdrawn `check:hydration` run)

Single staff session per run (fresh `capture-admin-session` each time), `/admin` loaded at 1440 then
320 (`networkidle` + 1s), every `console.error`/`console.warning`/`pageerror` recorded to a file by
`live-console-check.mjs`. Three runs, three files: `live-console-dev.txt` (a second fresh `next dev`
process, run to test whether the finding below reproduces deterministically — it did not) and
`live-console-prod.txt` (a clean `next build` + `next start`, run to classify it). The finding itself
was first observed on the run before those two, against the `next dev` instance already running
through this session's many earlier build/test cycles; that terminal output is preserved verbatim in
`live-console-dev-first-capture.txt` (reconstructed from this session's own tool output the moment it
was observed, before a second script invocation overwrote the live script's fixed output path — the
AC14 numbers, the exact diff lines, and the classification text in that file are the real captured
values, not invented after the fact; the two follow-up runs against fresh processes are the
mechanically re-captured, non-overwritten evidence for the classification itself).

**One finding, classified against `docs/maintenance-playbook.md` §14.1:** at 320px only (not at
1440px), one `console.error` — a React hydration-attribute mismatch confined entirely to Mantine's
own `useId()`-derived `id`/inline-style-class hashes (`mantine-_R_…`, `__m__-_R_…`) across the whole
component tree (`AppShell` → header `Button` → `AdminDashboardView` → every `Flex`/`Box`/`Card` down
to the `Title`) — no content, count, colour or href differs anywhere in the diff. This is exactly
§14.1's documented entry, verbatim: *"A stale Turbopack HMR cache can emit a one-off `useId`
hydration error that does not survive a clean `next build` (Task 582)."* Verified directly for this
instance, not just cited: neither a second fresh `next dev` (`live-console-dev.txt`) nor a clean
`next build` + `next start` (`live-console-prod.txt`) reproduced it — **zero** hydration-pattern
matches in either, consistent with an intermittent, HMR-state-dependent artifact rather than a
deterministic defect in this diff. Two `console.error` 404s per width remain in the prod capture —
`/sq/_vercel/insights/script.js` / `/sq/_vercel/speed-insights/script.js`, confirmed via a network
listener (`docs/sessions/evidence/task853/r2/check-404.mjs`) — already documented as known noise in
the same §14.1 entry ("`[Vercel Speed Insights] debug`"; these scripts only resolve on an actual
Vercel deployment). **Pass, by the classification the review itself specifies**, not by the literal
zero-warning reading of the dev-mode capture alone.

**AC3, full log:** `docs/sessions/evidence/task853/r2/dev-server.log`,
`grep -c "Functions cannot be passed directly to Client Components"` → **0**.

### Full gate block (§13.2, review-1 amendments applied, every command's transcript retained)

| Command | Exit | Evidence file |
|---|---|---|
| `npm run typecheck` | 0 | `00-typecheck.txt` |
| `npm run lint` | 0 (94 pre-existing warnings, 2 more than revision 1 — both in this session's own throwaway `evidence/task853/*.mjs` scripts, none in production files) | `01-lint.txt` |
| `npm run check:i18n` | 0 | `02-check-i18n.txt` |
| `npm run test -- .../dashboard/__tests__` | 0, 31/31 | `03-test-admin-dashboard.txt` |
| `npx vitest run .../visibility.test.ts` | 0, 66/66 | `04-test-visibility.txt` |
| `npm run check:listing-visibility` | **1, exactly the one named `contactEvents.ts:50` finding** — expected, 887 | `05-check-listing-visibility.txt` |
| `npm run check:stories` | 0, 174 files | `06-check-stories.txt` |
| `npm run check:story-coverage` | 0, 108/108 | `07-check-story-coverage.txt` |
| `npm run check:pattern-enrolment` | 0 | `08-check-pattern-enrolment.txt` |
| `npm run check:design-tokens:strict` | 0 | `09-check-design-tokens.txt` |
| `npm run check:enrolled-tailwind` | 0 | `10-check-enrolled-tailwind.txt` |
| `npm run check:rendered-scope` | 0 | `11-check-rendered-scope.txt` |
| `node scripts/check-surface-census-changed.mjs --base HEAD` | **0, writer not re-run** (0 new, 0 stale) | `12-check-surface-census-changed.txt` |
| `node scripts/check-surface-census.mjs --surface src/app/admin/page.tsx` | **1, only the route-root FAIL** (AC6) | `13-check-surface-census.txt` |
| `npm run build-storybook` | 0 | `14-build-storybook.txt` |
| `npm run check:locale-leak:mantine-only -- --fast` | 0 exit; **`leakCount: 166`, 0 `admindashboard*` lines** (unchanged from revision 1 — R16 adds no new locale text) | `21-check-locale-leak-fast.txt` |
| `npm run build` (×2 — see below) | 0 | `19-build.txt`, `26-build-final.txt` |
| `npm run check:file-integrity` | 0, 67 files | `22-check-file-integrity.txt` |
| `npm run check:mojibake` | 0, 7125 files | `23-check-mojibake.txt` |
| AC5 grep (5 named files) | 1 (prints nothing) — one doc-comment reword needed first (`16px` literal) | `24-ac5-grep.txt` |
| §13.2's own 3-file grep (no `style=`) | 1 (prints nothing) | `28-git-grep-original.txt` |
| `git diff --stat` | — 12 files, 400 insertions / 495 deletions | `25-git-diff-stat.txt` |
| `git hash-object` (4 named files) | — `page.tsx` `74b26361` (unchanged) · `AdminDashboardRecentListings.tsx` `8bbe4bb0` · `AdminDashboardView.tsx` `624c6894` (unchanged) · `surface-census-baseline.json` `a2f9a915` (unchanged) | `27-hash-object-final.txt` |

**Corollary 818, both builds explained:** `19-build.txt` ran once R16 and all measurement were done
but before the AC5 grep caught the `16px` literal in R16's own comment; `26-build-final.txt` re-ran
after that one-line reword, so the retained build transcript matches the exact final source
(`hash-object` in `27-hash-object-final.txt` was captured immediately after `26-build-final.txt`, same
pass).

### Files Changed — Revision 2 additions

| File | git hash-object |
|---|---|
| `src/components/admin/AdminDashboardRecentListings.tsx` | `8bbe4bb026c1ac2d3102b0f43bbb78aabfece35c` |
| `docs/sessions/evidence/task853/r2/` (38 files: command transcripts, measurement scripts, three live-console captures, `dev-server.log`/`dev-server-redo.log`) | not applicable (directory) |

All other paths (`page.tsx`, `AdminDashboardView.tsx`, `MantineDashboardHeader.tsx`,
`MantineDashboardStatCard.tsx`, both Story files, `queries.ts`, `surface-census-baseline.json`,
i18n files, `check-listing-visibility.mjs`, `check-locale-leak.mjs`, `mantine-migration-scope.json`)
are unchanged from revision 1 — hashes re-verified equal in I0 above.

## Opus handoff (Revision 2)

`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. F8 is fixed (R16), F9 is closed structurally (every
number above cites a retained file), F10 is not this task's fix (888, folded in only via §17.3's
replacement check, which passes by the review's own classification rule). Outstanding: only the
owner's own §13.3 visual matrix (now rows 1–12) — inherently owner-native, not something an executor
session self-certifies. No self-approval, no mutating git command issued by this session.

## Backlog update (Revision 2)

`docs/backlog.md`'s 853–856 row updated in place (853 `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`
2026-09-27, revision 2 complete, F8–F10 closed, pointing at this file's "Revision 2" section;
854–856 unchanged, still `KICKOFF FILED`).
