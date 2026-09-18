# Task 844 — `MantineDashboardWorkList`, one listing-status colour source, and `RelativeTime` on Mantine with an absolute-time tooltip

Sprint 78 · P1 · QA profile **Q3** · Wave A · depends on **843** approved · **Status: 🔁 NEEDS REVISION 2026-09-18 (review 2) — execute §17 Revision 2**

Sprint plan: [`Sprint_78_Admin_And_Agent_Dashboards_On_Canonical_Mantine.md`](Sprint_78_Admin_And_Agent_Dashboards_On_Canonical_Mantine.md) (D78-1…D78-6).

## 1. Mode and task type

`IMPLEMENTATION` — one new canonical pattern, one new shared data module, and the Mantine migration of one shared
leaf component (`RelativeTime`) that the dashboards need. Bundles: **UI / Current Mantine path** + **Storybook /
Visual Proof**.

## 2. Objective

1. **`MantineDashboardWorkList`**: the compact "work list" both dashboards use (spec §16.2 third row, §17.2 ADM-01,
   ADM-02, ADM-06, §17.3 AGT-06 later). Up to N rows, default 5. Each row is **one** link and shows a primary line
   (≤ 2 lines), meta items (author, age), a status badge (text + colour, optionally an icon) and a visible CTA label
   such as "Review". A footer link reads "Whole queue". It has compact inline `loading` (3 skeleton rows), `empty`
   (positive icon + specific text) and `error` (message + Retry) states.
2. **`src/modules/listings/lib/listingStatusTone.ts`**: one module that maps every `ListingStatus` to the theme colour
   its badge uses, plus the spec's semantic visibility tones. The dashboards read status colours from here and never
   declare their own.
3. **`RelativeTime`** (`src/components/shared/RelativeTime.tsx`, 12 consumers) migrates to Mantine. It renders a
   Mantine `Text component="time" inherit` with an ISO `dateTime`, and an **opt-in** `Tooltip` that shows a
   caller-formatted absolute date-time (spec §17.4: "relative time is complemented by absolute datetime in a
   tooltip/accessible label"). It gets its own Story and a manifest entry. Its 12 existing consumers keep rendering
   the same text at the same size (`inherit`).

## 3. Verified context — measured 2026-09-18 (re-measure at I0)

### 3.1 Duplicate search

| Question | Search | Result |
|---|---|---|
| Existing list/work-list pattern? | `ls src/design-system/mantine/patterns/`; `git grep -l -i "WorkList\|QueueList" -- src` | None. `MantineDataTableToCards` is a table↔cards switcher for paginated data (it is reused by 854 for AGT-10), not a ≤5-row link list. |
| Existing listing-status → colour map? | `src/modules/listings/components/ListingCard.tsx:85-106` (`getBadges`) | A **local** function: `sold → 'blueLight'`, `rented → 'purple'`, `archived → 'gray'`, `expired → 'yellow'`; no entry for `active`/`inactive`/`pending`. Not exported. |
| `RelativeTime` today | `src/components/shared/RelativeTime.tsx` (29 lines) | `'use client'`; `formatDistanceToNow(new Date(date), { addSuffix: true, locale })` with a `date-fns` locale map (`en`/`sq`/`uk`/`it`); renders `<span className={className}>`. Census: `tier1 manifest:no story:no className:1`. |
| `RelativeTime` consumers | `git grep -n RelativeTime -- src` | 12 production imports: `AdminCompaniesManager`, `AdminCurrenciesManager`, `AdminDashboardRecentListings` (×2 uses, both passing Tailwind `className`), `AdminLegalManager`, `AdminListingsTable` (×2), `AdminPagesManager`, `AdminPropertyTypesManager`, `AdminReportsManager` (×2), cabinet `ListingsTab`, `SavedSearchesTab`; the legacy story `ListingsTab.stories.tsx`; and a `vi.mock` in `AdminReportsManager.smoke.test.tsx:85`. `[slug]/page.tsx:20,240` only mentions it in comments. |
| Canonical Story importing `RelativeTime`? | `git grep -l -E "shared/RelativeTime" -- "src/stories/**"` | **None** (only the legacy `Cabinet/ListingsTab` story, not canonical). |

### 3.2 Why the tone map does not replace `ListingCard`'s local copy in this task

`ListingCard.tsx`'s status badge colours are the subject of **741 Revision 2** (Sprint 46, `NEEDS REVISION`, reopened
by the owner 2026-09-17: *one canonical "Sold"/"Rented" style on every card, hardcode removed*). Editing the same
lines here would collide with an open task that owns them. This task therefore creates the shared module **with
`ListingCard`'s current values for the four statuses it defines**, and records in the 741 row of `docs/backlog.md`
that 741 R2 must switch `ListingCard` to `listingStatusTone.ts` (or change both together). Until then the two agree by
value; the module's JSDoc cites `ListingCard.tsx:85-106` as the origin.

### 3.3 Spec rules restated

- §17.1 status semantics: visible/published → positive; pending/expiring → warning; report/flag/error/hidden →
  danger; neutral/inactive/archived → neutral. Colour is always accompanied by a text badge (and an icon where the
  spec shows one). Theme colour names: positive `green`, warning `yellow`, danger `red`, neutral `gray`, all in
  `theme.ts` `colors`.
- For **listing statuses** the site-wide canonical colours win where they exist (`sold` blueLight, `rented` purple,
  `archived` gray, `expired` yellow — `ListingCard`). The remaining statuses take the semantic bucket: `active` →
  `green`, `pending` → `yellow`, `inactive` → `gray`.
- §17.4 lists: dashboard preview is limited to 3 or 5 rows; relative time is complemented by absolute date-time.
- §17.1: one link target per row; no nested competing clickables. The CTA label is a visual affordance **inside** the
  row link, not a second link.
- §16.2: an empty queue shows a short positive state inside the existing card, not a wide empty widget.

### 3.4 Clause 16d / GR-1 census

`MantineDashboardWorkList` is new; it renders `RelativeTime`, Mantine core and the 843 patterns. `RelativeTime` is
tier 1 for any dashboard surface and is migrated, storied and enrolled here. Its 12 legacy **consumers** are parents,
not children: 16d does not bring them in, and their own migrations belong to their surfaces (857–859 and later). Their
rendered text is preserved by `inherit`.
`GR-1 CENSUS COMPLETE — 2 nodes; tier1 2 migrated+enrolled+story (MantineDashboardWorkList, RelativeTime — this task); tier2 0 imports removed; tier3 0 listed and filed as none.`

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | spec §16.2, §17.1–§17.4 | `MantineDashboardWorkList` props: `rows: { id, href, primary, meta?: ReactNode[], status?: { label, color, icon? }, ctaLabel }[]`, `maxRows` (default 5), `footer?: { label, href }`, `state: 'ready' \| 'loading' \| 'empty' \| 'error'`, `emptyIcon`, `emptyText`, `errorText`, `retryLabel`, `onRetry`. It renders at most `maxRows` rows (it never truncates silently: the caller's footer carries the "whole queue" link). Each row is one `next/link` anchor with a min height of `theme.other.touchTarget`. The primary line uses `lineClamp={2}`; the status is a theme `Badge`; the CTA label is `Text` plus a lucide chevron at `iconSize.compact`. | P1 | AC1, AC2 | Confirmed |
| **R2** | spec §17.4 | `loading` = 3 skeleton rows (no digits, no names); `empty` = the caller's icon + text inside the list area, no list chrome; `error` = message + Retry `Button` (not inside any row link). | P1 | AC1 | Confirmed |
| **R3** | §3.2, §3.3 | `listingStatusTone.ts` exports `LISTING_STATUS_COLOR: Record<ListingStatus, MantineColor>` with the values of §3.3 and `VISIBILITY_TONE_COLOR: Record<'positive'\|'warning'\|'danger'\|'neutral', MantineColor>` = `green`/`yellow`/`red`/`gray`. Every value is a key that exists in `theme.ts` `colors`. A unit test asserts that all 7 `ListingStatus` members are present and that every value is a theme colour key (reads the theme object, not a string list). | P1 | AC3 | Confirmed |
| **R4** | spec §17.4, hardcode rule | `RelativeTime` renders `Text component="time" inherit dateTime={iso}` (no `className` of its own; the `className` **prop** stays as a pass-through for its legacy consumers — owner-accepted precedent, Sprint 76 closure 2026-09-18: *"PropertyTypeCombobox className:1 is a no-Tailwind pass-through"*). New optional prop `absoluteLabel?: string`: when set, the text is wrapped in the canonical Mantine `Tooltip` with that label, and the `<time>` element gets `aria-label` = `"{relative} ({absolute})"`. Without it the render is the text alone. The relative computation is unchanged. | P1 | AC4, AC5 | Confirmed |
| **R5** | hydration safety | `absoluteLabel` is a **string formatted by the caller** (on the server, in `Europe/Tirane`, by 846's helper). `RelativeTime` never formats an absolute date itself, so no server/client timezone mismatch can enter its markup. | P1 | AC4 | Confirmed |
| **R6** | 16c, GR-3, GR-3a | Own Stories: `Patterns/Mantine/DashboardWorkList` (states ready 5 rows / ready 2 rows / loading / empty / error) and `Mantine/Primitives/RelativeTime` (minutes, hours, days, months ago; with and without `absoluteLabel`; inherited inside `Text size="xs"` and `size="sm"` to prove `inherit`). All three source files are in `scripts/mantine-migration-scope.json`. | P1 | AC5, AC6 | Confirmed |
| **R7** | preserve | The 12 legacy consumers render the same relative text at the same computed `font-size`/`color` as before (spot-check two: `AdminListingsTable` cell and cabinet `ListingsTab`, computed style before/after in the running app or legacy story). `AdminReportsManager.smoke.test.tsx` still passes (it mocks the module). | P1 | AC7 | Confirmed |
| **R8** | agent-contract 7 | New visible strings (the stories' captions, and nothing else; patterns take labels as props) exist in all four locales. `check:i18n` exits 0. | P2 | AC8 | Confirmed |
| **R9** | hardcode | No raw px/rem/hex/rgb, no `className=` attribute, no Tailwind, no `@/components/ui/*` in the three source files. | P1 | AC9 | Confirmed |

## 5. Assumptions and open questions

- **741 overlap** is handled by sequencing (§3.2), not by editing `ListingCard`. If the owner prefers that 844 switches
  `ListingCard` now, that is an owner decision and a scope change to 741; the executor does **not** edit `ListingCard.tsx`.
- `Text component="time"` renders an inline element like the current `<span>`. INFERENCE: no selector in `src/`
  targets `RelativeTime`'s element. The executor verifies at I0 with
  `git grep -n -E "time\b|RelativeTime" -- "src/**/*.css"`; a hit is reported, not silently worked around.
- No owner decision open.

## 6. Pre-read rule bundle

`docs/golden-rules.md` · `docs/agent-contract.md` (7, 9, 11, 13, 14, 16–16d) · `docs/qa-profiles.md` ·
`docs/mantine-responsive-design-system.md` · `docs/tailadmin-style-reference.md` §6 (badges, tooltips) ·
`docs/component-rules.md` · `docs/storybook-governance.md` · `docs/i18n-rules.md` · `docs/qa-rules.md` ·
`.claude/skills/execute-task/SKILL.md` · Task 843's kickoff (the patterns this one sits beside).

## 7. Scope

- **Created:** `src/design-system/mantine/patterns/MantineDashboardWorkList.tsx` ·
  `src/modules/listings/lib/listingStatusTone.ts` · `src/modules/listings/lib/__tests__/listingStatusTone.test.ts` ·
  `src/stories/patterns/mantine/DashboardWorkList.stories.tsx` · `src/stories/mantine/primitives/RelativeTime.stories.tsx`.
- **Edited:** `src/components/shared/RelativeTime.tsx` · `src/design-system/mantine/patterns/index.ts` ·
  `scripts/mantine-migration-scope.json` (3 entries) · `messages/{sq,en,uk,it}.json` (story captions under
  `storybook`) · `docs/backlog.md` (844 line **and** one sentence on the 741 row: "741 R2 switches `ListingCard`
  status colours to `src/modules/listings/lib/listingStatusTone.ts` (created by 844)").
- **Baseline writer only if it reports RelativeTime rows:** `scripts/surface-census-baseline.json` via
  `node.exe scripts\check-surface-census-changed.mjs --base HEAD --update-baseline`; only rows keyed on
  `RelativeTime.tsx :: tier1-unenrolled-or-unstoried` may be removed. Any other row change → `BLOCKED`.

## 8. Out of scope

`ListingCard.tsx` (741 R2 owns it, §3.2) · the 12 legacy consumers' own markup · the legacy `Cabinet/ListingsTab`
story · dashboard consumers (853/854) · `period.ts` (846) · `MantineEmptyLoadingErrorState` · `src/components/ui/*`.
No new test that inspects a legacy component; the one new test covers the new module.

## 9. Current and required behavior

**Before.** `RelativeTime` renders `<span class="…">4 hours ago</span>` with no absolute time anywhere. No work-list
pattern and no status colour source exist.

**After.** `RelativeTime` renders `<time datetime="2026-09-18T08:00:00.000Z" class="mantine-Text-root …">4 hours
ago</time>` at the inherited size. With `absoluteLabel` it shows a Tooltip on hover or focus, and screen readers hear
both. The work list and the tone map exist, storied and enrolled. Legacy pages look the same.

## 10. Implementation requirements

1. **I0.** Platform line; `git --no-optional-locks status --porcelain`; hashes of every edited file; re-run §3.1
   searches, the §5 CSS grep, and `node.exe scripts\check-surface-census.mjs --surface src\components\shared\RelativeTime.tsx`.
   Record the computed `font-size` and `color` of one `RelativeTime` in `AdminListingsTable` and one in cabinet
   `ListingsTab` (dev server, signed in as staff / as a user; or, if no session is available, state that and use the
   legacy `Cabinet/ListingsTab` story for the second one) → **before** values for R7.
2. UTF-8-safe edits only (Node I/O or editor).
3. **Tone module + test first** (R3). The test imports `theme` from `@/design-system/mantine/theme` and asserts each
   value is a key of `theme.colors`, and that `Object.keys(LISTING_STATUS_COLOR)` equals the `ListingStatus` members.
   Read those members from `src/types/database.ts:43`, restated as a typed `const` tuple in the test with a
   `satisfies readonly ListingStatus[]` guard, so a new status fails the compile.
4. **RelativeTime** per R4/R5. Keep `LOCALE_MAP`, `useLocale`, `formatDistanceToNow` exactly. Import `Tooltip`/`Text`
   from `@mantine/core`. JSDoc: the pass-through `className` exists only for legacy consumers and must not be used by
   Mantine callers.
5. **WorkList** per R1/R2, built from Mantine `Stack`, `UnstyledButton`/`Anchor` `component={Link}`, `Group`, `Text`,
   `Badge`, `Skeleton`, `Button`, `ThemeIcon`, plus the 843 conventions (JSDoc spec provenance, theme keys only). Row
   separators use Mantine `Divider` or the theme border colour variable (`var(--mantine-color-default-border)`), never
   a colour literal.
6. **Stories** (GR-3a `CREATE` for both, §12). `Patterns/Mantine/DashboardWorkList`: `Default` shows all five states
   side by side; fixture rows are declared as fixtures, and statuses use `LISTING_STATUS_COLOR`.
   `Mantine/Primitives/RelativeTime`: fixed fixture dates computed from a fixed "now" passed in the story. If
   `formatDistanceToNow` cannot take a reference date, construct dates relative to `Date.now()` at render time and
   document why. No locale- or width-named exports.
7. Enrol `MantineDashboardWorkList.tsx`, `RelativeTime.tsx` in the manifest; export the pattern from the barrel.
   `listingStatusTone.ts` is a data module, not a manifest entry.
8. **R7 after.** Repeat I0's two computed-style readings; they must be equal.

## 11. Positive and negative flows

**Positive.** In the Story, the ADM-01 work list shows 5 pending listings (title, author, "4 hours ago", yellow
"Pending" badge, "Review ›"). Hovering the time shows "18.09.2026 10:00". Tab moves row by row; Enter opens the row
link. The footer link reads "Whole queue".

| Negative flow | Applicable | Expected |
|---|---|---|
| Empty queue | Yes | Positive icon + specific text inside the list area; no rows, no footer if the caller omits it. |
| Source error | Yes | Message + Retry button outside any link; no rows. |
| Loading | Yes | 3 skeleton rows; no digits or names. |
| Long `uk` title | Yes | Primary line clamps at 2 lines; badge and CTA stay visible at 320. |
| `absoluteLabel` omitted | Yes | Plain relative text, no Tooltip, no aria-label change (legacy consumers). |
| Invalid date string | Yes (pre-existing) | Same behaviour as today (`formatDistanceToNow` throws on `Invalid Date`). This task does not change that; the executor records whether any dashboard caller can pass null (847/848 must not). |
| Authorization / RLS | No | Presentational; data belongs to 847/848. |

## 12. Acceptance criteria

- **AC1 [R1, R2]** — Given `Patterns/Mantine/DashboardWorkList → Default`, when rendered, then the ready list shows at
  most 5 rows, each one `<a>` containing the CTA label, and the error state's Retry `<button>` has no `<a>` ancestor.
  Quote the DOM excerpt.
- **AC2 [R1]** — Given a work-list row at 320px, when its bounding box is read, then its height is at least the
  resolved `theme.other.touchTarget`.
- **AC3 [R3]** — Given `npm.cmd run test -- src/modules/listings/lib/__tests__/listingStatusTone.test.ts`, when run,
  then it passes. Given a temporary plant that deletes `pending` from the map, when the test is re-run, then it fails
  (compile or assertion). The plant is reverted and the file's `git hash-object` equals its pre-plant value.
- **AC4 [R4, R5]** — Given `RelativeTime.tsx`, when read, then it contains no `formatDate`/`formatDateTime`/`toLocale*`
  call and no `className=` attribute, and it renders `component="time"` with `dateTime`.
- **AC5 [R4, R6]** — Given `Mantine/Primitives/RelativeTime`, when the "with absolute label" state is focused by
  keyboard, then the Tooltip shows the absolute label, and the `<time>` element's `aria-label` contains both texts.
- **AC6 [R6]** — Given `npm.cmd run check:story-coverage` and the census of both files, when run, then coverage exits 0
  and each census root row reads `manifest:yes story:yes`.
- **AC7 [R7]** — Given the I0 and step-8 readings, when compared, then `font-size` and `color` are equal for both
  sampled consumers, and `npm.cmd run test -- src/components/admin/__tests__/AdminReportsManager.smoke.test.tsx` passes.
- **AC8 [R8]** — Given `npm.cmd run check:i18n`, when run, then it exits 0.
- **AC9 [R9]** — Given
  `git --no-optional-locks grep -n -E "className=|components/ui/|#[0-9a-fA-F]{3,8}\b|[0-9]+px|rgba?\(" -- src/design-system/mantine/patterns/MantineDashboardWorkList.tsx src/components/shared/RelativeTime.tsx src/modules/listings/lib/listingStatusTone.ts`,
  when run, then it prints nothing; `check:design-tokens:strict` and `check:enrolled-tailwind` exit 0.
- **AC10 [R1-R6]** — Given the owner matrix §13.3, when reviewed, then every tuple is recorded accepted, or returned
  with a concrete defect.

`GR-4 AC AUDIT — 10 criteria; each states an observable property; absolutes: AC9's empty grep defines "no raw value" on three named files; AC7's equality is a preservation claim on two sampled computed properties, not a byte claim.`

`GR-3a STORY PREFLIGHT — RelativeTime × relative/absolute/inherit; canonical candidates: NONE (Cabinet/ListingsTab is a legacy title rendering ListingsTab, not a RelativeTime proof); direct-import evidence: NONE among canonical stories; toolbar coverage: locale=toolbar, viewport=toolbar (Task 799 caveat); decision: CREATE; target: Mantine/Primitives/RelativeTime; rationale: shared leaf with no canonical proof. — MantineDashboardWorkList × 5 states; canonical candidates: NONE; decision: CREATE; target: Patterns/Mantine/DashboardWorkList; rationale: new pattern with in-sprint consumers 853/854.`

`GR-3 STORY PROVEN — MantineDashboardWorkList ← src/stories/patterns/mantine/DashboardWorkList.stories.tsx; RelativeTime ← src/stories/mantine/primitives/RelativeTime.stories.tsx` (after execution).

## 13. QA profile and verification plan

**`Q3`** — new canonical pattern + migration of a shared leaf with 12 consumers. No critical flow touched (searched
`docs/critical-flow-registry.md`: no `RelativeTime` row).

### 13.1 Re-entry

`from-scratch`. Evidence root `docs/sessions/evidence/task844/`, numbered transcripts with `EXIT_CODE=`, no BOM.

### 13.2 Final gate block

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p "process.platform + ' ' + process.version"
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:i18n
npm.cmd run test -- src/modules/listings/lib/__tests__/listingStatusTone.test.ts
npm.cmd run test -- src/components/admin/__tests__/AdminReportsManager.smoke.test.tsx
npm.cmd run check:stories
npm.cmd run check:story-coverage
npm.cmd run check:pattern-enrolment
npm.cmd run check:design-tokens:strict
npm.cmd run check:enrolled-tailwind
npm.cmd run check:rendered-scope
node.exe scripts\check-surface-census-changed.mjs --base HEAD
node.exe scripts\check-surface-census.mjs --surface src\components\shared\RelativeTime.tsx
node.exe scripts\check-surface-census.mjs --surface src\design-system\mantine\patterns\MantineDashboardWorkList.tsx
npm.cmd run build-storybook
npm.cmd run check:locale-leak:mantine-only
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks grep -n -E "className=|components/ui/|#[0-9a-fA-F]{3,8}\b|[0-9]+px|rgba?\(" -- src/design-system/mantine/patterns/MantineDashboardWorkList.tsx src/components/shared/RelativeTime.tsx src/modules/listings/lib/listingStatusTone.ts
git --no-optional-locks diff --stat
git --no-optional-locks hash-object src/components/shared/RelativeTime.tsx src/design-system/mantine/patterns/MantineDashboardWorkList.tsx src/modules/listings/lib/listingStatusTone.ts src/design-system/mantine/patterns/index.ts scripts/mantine-migration-scope.json scripts/surface-census-baseline.json
```

Expected: all exit 0 except `check:locale-leak:mantine-only` (known red, Task 836). For it, the requirement is zero
leak lines for story IDs `patterns-mantine-dashboardworklist` and `mantine-primitives-relativetime`; quote the grep.
The `git grep` prints nothing.

### 13.3 Owner visual review — `OWNER VISUAL QA REQUIRED`

Until Task 799 lands, use `iframe.html?id=<story-id>&globals=locale:<locale>` and resize the window.

| # | Story / route | State | Width | Locale | Owner checks |
|---|---|---|---|---|---|
| 1 | `Patterns/Mantine/DashboardWorkList` | Default | 1440 | en | rows: title, author, age, status badge with text, "Review ›"; footer link; compact empty and error states |
| 2 | same | Default | 1024 | sq | status colours: pending yellow, active green, sold blueLight, rented purple — each with its label |
| 3 | same | Default | 390 | uk | full width, 2-line title clamp, badge + CTA visible |
| 4 | same | Default | 320 | it | no horizontal overflow |
| 5 | `Mantine/Primitives/RelativeTime` | Default | 1280 | uk | Ukrainian relative text; tooltip with absolute time on hover and on keyboard focus |
| 6 | `/admin/listings` (live, staff session) | table | 1440 | en | dates look exactly as before (legacy consumer preserved) |

### 13.4 Evidence the executor hands over

§13.2 transcripts · I0 and step-8 computed-style readings (element, page/story, width) · AC3 plant transcript with
hashes · the owner matrix.

## 14. Completion report contract

Files with before/after hashes · R1–R9 · AC1–AC10 with quotes · commands with exit codes and transcript paths · I0
results · GR-1 / GR-3 / GR-3a receipts · the 741 backlog note as written · assumptions · deviations · limitations · the
§13.3 matrix. Status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. No
self-approval, no mutating git, no `git push`. Update the 844 line of `docs/backlog.md`; write the session log with a
Files Changed table.

## 15. Task quality gate

| Question | Answer |
|---|---|
| Duplicate? | §3.1; the tone module is created because no exported source exists; `ListingCard`'s copy is sequenced into 741 R2, not duplicated silently (§3.2, backlog note). |
| Probe markup? | No; both Stories document production components. |
| GR-1 / 16d | §3.4 receipt; legacy consumers are parents, not children. |
| GR-2 | coverage gate + per-file census rows (AC6). |
| Hardcode | R9/AC9; no new token needed. |
| No legacy tests | The only new test covers the new module; the existing `AdminReportsManager` smoke test is only re-run. |
| Commands in blocks | §13.2. |

## 16. Revision 1 — review 1 returned `NEEDS REVISION` (2026-09-18)

### 16.1 Re-entry

`remediation`. Keep the existing files and the evidence in `docs/sessions/evidence/task844/`. New transcripts are
numbered `50-` and up, written through Node or `-Encoding utf8` (no BOM), each ending with `EXIT_CODE=`. Emit a
`GR-0 CANONICAL REUSE PREFLIGHT` receipt before the first edit.

Already verified, do not change: `listingStatusTone.ts` and its test (4/4 pass; the reviewer re-ran them), the planted
compile failure with matching hashes, `LOCALE_MAP` / `formatDistanceToNow` unchanged, the `<640` stacked row order,
and the footer `Button variant="transparent"`. The rendered-scope allowlist and baseline show no diff.

### 16.2 Findings to correct

| ID | Sev | Req / AC | Where | Defect | Required correction |
|---|---|---|---|---|---|
| **G1** | P2 | R2, GR-0 (COMPOSE) | `MantineDashboardWorkList.tsx` `state === 'error'` branch | It still renders the cloned `Text size="sm" c="red"` + `Button`, the pattern that 843 F3 removed. **CONTRADICTION:** the session log says this branch was "Rewritten to compose `MantineEmptyLoadingErrorState`, matching 843 Revision 1 exactly". The file does not do that. | Render `<MantineEmptyLoadingErrorState state="error" description={errorText} action={retryLabel ? <Button variant="default" onClick={onRetry}>{retryLabel}</Button> : undefined} />`, as in the 843 patterns. Correct the session-log claim. |
| **G2** | P2 | R1, R4, spec §17.1 | `RelativeTime.tsx` (`tabIndex={absoluteLabel ? 0 : undefined}`) inside a `MantineDashboardWorkList` row | 853/854 must pass `absoluteLabel` (spec §17.4). A `RelativeTime` with `absoluteLabel` in a row's `meta` becomes a `tabIndex=0` element **inside** the row `<a>`. That gives two tab stops per row and puts a focusable element inside a link, against §11 "one tab stop per row" and §17.1. The current Story hides this because its rows pass no `absoluteLabel`. | Add `focusable?: boolean` to `RelativeTime`, default `true`, so AC5's standalone path is unchanged. Set `tabIndex` only when `absoluteLabel && focusable`; the `aria-label` and hover Tooltip stay. In the WorkList JSDoc, state that `meta` renders inside the row link and a `RelativeTime` there must pass `focusable={false}`. In the WorkList Story, rows pass `absoluteLabel` and `focusable={false}`. Add `src/design-system/mantine/patterns/__tests__/MantineDashboardWorkList.smoke.test.tsx` with these cases: each row `a` has no descendant matching `[tabindex]:not([tabindex="-1"]), a, button`; the error Retry `button` has `closest('a') === null`; `maxRows=5` with 7 rows renders 5 row links; and `state="error"` renders the `MantineEmptyLoadingErrorState` alert (`role="alert"`). Planted arm: default `focusable` in the Story rows makes the first case fail. Restore it with a hash witness. |
| **G3** | P2 | R7, AC7 | session log R7, `r7-computed-style-equivalence.md` | AC7 requires two **measured** computed-style readings. The log says "no browser session available". Yet the same task ran two Playwright probes (`34`, `37`) against the live Storybook, and §10 step 1 named the legacy `Cabinet/ListingsTab` story as the fallback. Reading source code does not measure anything. | Write a Playwright script `50-r7-inherit-probe.mjs` → `50-r7-inherit-probe.json`. It opens `iframe.html?id=cabinet-listingstab--default&globals=locale:uk` and the `Mantine/Primitives/RelativeTime` story at 1280px. For every `time` element it records the computed `font-size`, `line-height`, `font-weight`, `font-family`, `color`, `letter-spacing`, `display`, `margin` and `padding` of the element **and of its parent**. It exits non-zero unless the first six equal the parent's values, `display` is `inline` and margin and padding are 0. The old `<span>` inherited all six, so parent equality is the observable "unchanged" property. `/admin/listings` stays owner tuple 6. |
| **G4** | P2 | §13.2, §13.4, AC1, AC2, AC5 | `docs/sessions/evidence/task844/` | The evidence is missing. There are no §13.2 gate transcripts, only builds. The `34`/`37` probes left no output file, and the session log only paraphrases them. There is no AC1 DOM excerpt, no AC2 bounding box at 320, and no retained AC5 play or focus result. | Extend the G3 script, or write `51-worklist-probe.mjs` → `51-…json`, against `patterns-mantine-dashboardworklist--default` at 320×800 `uk`. It records: row-link count and heights against `touchTarget`, `scrollWidth <= 320`, the outerHTML of row 1 truncated to 2,000 characters (AC1 excerpt), Retry `closest('a')`, and the footer's right edge against its container. For AC5, focus the `time[tabindex]` in `mantine-primitives-relativetime--default` and record `document.activeElement === el`, its `aria-label`, and whether `[role="tooltip"]` becomes visible. Then run the §16.3 block. |
| G5 | P3 | R1 | `MantineDashboardWorkList.tsx:14`; `DashboardWorkList.stories.tsx` docs text | `status.color` is typed `string` rather than `MantineColor`. The Story description still says "the footer reuses the existing canonical ViewAllLink", which is no longer true. | Change the type to `MantineColor` and correct the description. |

Process note (no action): 844 was executed before 843 was approved, although §1 says it depends on 843 approved.
843 and 844 now close in one joint review (843 kickoff §17.3).

### 16.3 Final gate block (replaces §13.2; also closes 843 H1 when run once for both)

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p "process.platform + ' ' + process.version"
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:i18n
npx.cmd vitest run src/modules/listings/lib/__tests__/listingStatusTone.test.ts src/components/admin/__tests__/AdminReportsManager.smoke.test.tsx src/design-system/mantine/patterns/__tests__/MantineDashboardWorkList.smoke.test.tsx src/design-system/mantine/patterns/__tests__/MantineDashboardStatRows.smoke.test.tsx src/design-system/mantine/patterns/__tests__/MantineDashboardStatCard.smoke.test.tsx
npm.cmd run check:stories
npm.cmd run check:story-coverage
npm.cmd run check:pattern-enrolment
npm.cmd run check:design-tokens:strict
npm.cmd run check:enrolled-tailwind
npm.cmd run check:rendered-scope
node.exe scripts\check-surface-census.mjs --surface src\components\shared\RelativeTime.tsx
node.exe scripts\check-surface-census.mjs --surface src\design-system\mantine\patterns\MantineDashboardWorkList.tsx
node.exe scripts\check-surface-census.mjs --surface src\design-system\mantine\patterns\MantineDashboardCard.tsx
node.exe scripts\check-surface-census.mjs --surface src\design-system\mantine\patterns\MantineDashboardStatCard.tsx
node.exe scripts\check-surface-census.mjs --surface src\design-system\mantine\patterns\MantineDashboardStatRows.tsx
npm.cmd run build-storybook
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks grep --untracked -n -E "className=|components/ui/|style=\{|#[0-9a-fA-F]{3,8}\b|[0-9]+px|rgba?\(|c=.red." -- src/design-system/mantine/patterns/MantineDashboard*.tsx src/components/shared/RelativeTime.tsx src/modules/listings/lib/listingStatusTone.ts
git --no-optional-locks diff --stat
git --no-optional-locks hash-object src/components/shared/RelativeTime.tsx src/design-system/mantine/patterns/MantineDashboardWorkList.tsx src/design-system/mantine/patterns/MantineDashboardCard.tsx src/design-system/mantine/patterns/MantineDashboardStatCard.tsx src/design-system/mantine/patterns/MantineDashboardStatRows.tsx src/modules/listings/lib/listingStatusTone.ts src/design-system/mantine/patterns/index.ts scripts/mantine-migration-scope.json
```

Every command gets its own transcript: 843's go to `docs/sessions/evidence/task843/40-…`, and the shared run is
referenced from both session logs. Expected: every `npm`/`npx`/`node` command exits 0. `check:locale-leak` is not run
(owner waiver 2026-09-18, `task843/13-check-locale-leak.txt`). The grep may print only comment lines. Quote each
line and classify it; any `code` line fails. The `50`/`51` probes run afterwards against `npm.cmd run storybook`.

### 16.4 Acceptance for this revision

- **AC11 [G1]** — the WorkList smoke test's error case finds `role="alert"`; the §16.3 grep prints no `code` line.
- **AC12 [G2]** — the WorkList smoke test passes; its planted arm failed and was restored with equal hashes.
- **AC7r [G3]** — `50-r7-inherit-probe.json` exists, the script exit code is 0, and it covers both stories.
- **AC1r / AC2r / AC5r [G4]** — `51-…json` exists with the fields listed in G4, and the script exit code is 0.
- **AC10** — unchanged: the owner matrix §13.3 is recorded per tuple, verbatim, with the date.

`GR-4 AC AUDIT — 5 revision criteria; each states an observable property; absolutes: none beyond the scoped grep.`

### 16.5 Completion

Session log: add a "Revision 1" section with a Files Changed table, the corrected G1 claim, and transcript paths.
Set 844 to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` in `docs/backlog.md` and the sprint Tasks table. No mutating
git. Continuing to 845 is not part of this revision.

## 17. Revision 2 — review 2 returned `NEEDS REVISION` (2026-09-18)

### 17.1 What review 2 verified — do not redo

- G1: the error branch composes `MantineEmptyLoadingErrorState`, and there is no `c="red"`.
- G4: `51-worklist-probe.json` passes.
- G5: `status.color` is `MantineColor`.
- G3: `50-r7-inherit-probe.json` passes 12/12 against the legacy `Cabinet/ListingsTab` story.
- The joint gate block `task843/40`–`57` is all exit 0. Its hashes equal the current files, and the builds ran after
  the last source edit.
- The WorkList planted arm failed and was restored.

### 17.2 Findings to correct

| ID | Sev | Req / AC | Where | Defect | Required correction |
|---|---|---|---|---|---|
| **K1** | P2 | R6, §11 positive flow, AC10 | `RelativeTime.stories.tsx` `FIXTURE_ANCHOR`; `DashboardWorkList.stories.tsx` `FIXTURE_ANCHOR` | Storybook freezes "now" at **`2026-07-30T00:00:00.000Z`** (`.storybook/preview-head.html:15`, Task 698). Both Stories anchor their fixtures at `2026-09-18T12:00Z`, which is in the future. So the rendered text is wrong. The `50` probe records "приблизно за 2 місяці" ("in about 2 months") for the 5-minute, 3-hour and 2-day fixtures, and "10 днів тому" for the 60-day one. The `51` probe shows the same future text in every WorkList row. R6's minutes / hours / days / months states and §11's "4 hours ago" are therefore **not rendered**. The Story comment "displayed text drifts as real time passes" is false: the preview clock is frozen. | Set both anchors to `new Date('2026-07-30T00:00:00.000Z')`, the frozen instant already used by `ListingsTab.stories.tsx:21` and `admin.fixtures.ts:49`. Cite `preview-head.html:15` in the comment, replacing the "drifts" text. Recompute every `absoluteLabel` fixture string as that instant minus its offset, formatted `DD.MM.YYYY HH:mm` in `Europe/Tirane`. Re-run `50`/`51` as `60-…`/`61-…`. Each rendered text must be in the past ("тому" in `uk`), and the four plain RelativeTime rows must read as minutes, hours, days and months respectively. |
| **K2** | P2 | R4, §16.2 G2 | `RelativeTime.tsx` `showTooltip = Boolean(absoluteLabel) && focusable` | G2 required "set `tabIndex` only when `absoluteLabel && focusable`; the `aria-label` **and hover Tooltip stay**". Instead, `focusable={false}` also removes the Tooltip. In the dashboard rows, which are the only place 853/854 use it, a mouse user never sees the absolute time. This deviation is not declared anywhere. | Wrap in `MantineTooltip` whenever `absoluteLabel` is set, and gate only `tabIndex` on `focusable`. Update the JSDoc. Add a case to `MantineDashboardWorkList.smoke.test.tsx`: with `focusable={false}` the row still contains no element with `tabindex >= 0`. Extend `61-…`: hovering the row's `time` makes `[role="tooltip"]` visible. |
| K3 | P3 | session log | `2026-09-18-task844-…md` | Several parts of the log are stale and contradict the final state: <br>• "Owner corrections applied proactively" item 3 and its `GR-0 … decision: REUSE; selected canonical owner: ViewAllLink.tsx` receipt describe a reuse that was later reverted. <br>• The first Files Changed table lists `rendered-scope-allowlist.json` / `-baseline.json` as changed, but `git status` shows neither. <br>• The R4 row still quotes `tabIndex={absoluteLabel ? 0 : undefined}`. <br>• The first "Validation evidence" table points at 843 transcripts `32`/`33` rather than `40`–`57`. <br>• `40-r7-live-computed-style-proof.mjs` has no output file. | Mark each of these "superseded by Revision 1/2" with a pointer to the current fact. Delete the orphan `40-…mjs`, or mark it superseded by `50`. |

### 17.3 Gates

After K1–K2, re-run the **§16.3 block** once, as new transcripts `task843/60-…` onward. It is still the joint 843+844
block. Expected: every `npm`/`npx`/`node` command exits 0, and the grep prints only comment lines, each quoted and
classified. Then run the `60`/`61` probes against `npm.cmd run storybook`.

### 17.4 Acceptance

- **AC6r [K1]** — `60-…json` records, for the four plain RelativeTime rows, past-tense text in the minute, hour, day
  and month ranges. `61-…json` shows the WorkList rows' time as past tense.
- **AC13 [K2]** — the WorkList smoke test passes, including the new case; `61-…json` records the tooltip visible on
  hover of a `focusable={false}` time.
- **AC10** — unchanged: owner matrix §13.3, per tuple, verbatim, with the date. Do this after K1, because the owner
  must see correct relative text.

`GR-4 AC AUDIT — 3 revision criteria; each states an observable property; absolutes: none.`

Session log: add a "Revision 2" section with its Files Changed and transcript paths. Set 844 to
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. No mutating git. Do not start 845.
