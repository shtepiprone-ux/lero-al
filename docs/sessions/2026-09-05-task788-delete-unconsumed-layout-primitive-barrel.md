# Task 788 — delete the unconsumed `src/components/layout` primitive barrel

**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`
**Kickoff:** `tasks/Sprints/Sprint_70_kickoff_prompt_Task_788_Delete_The_Unconsumed_Layout_Primitive_Barrel.md`
**QA profile:** Q1 Targeted (justified in kickoff §11; re-verified below — no rendered surface existed for
any of the four components, confirmed by the census).

## 1. Requirement and acceptance-criteria evidence

| ID | Requirement | Evidence |
|---|---|---|
| R1/AC1 | 9 files deleted; `grep -rn "FilterBar\|PageShell\|PageHeader" src/ --include=*.tsx --include=*.ts` | Files deleted (git status below). Grep re-run post-deletion: only hits are `AdminPageHeader`/`AdminPageShell` (admin-shared, different components), `MantinePageHeaderWithActions` (different component), `ListingsFilterBar` (live, listings-feature, reserved as Task 789), and `ListingsTab.tsx:170,217,247,272` — the named local JSX constant, not a component import. Zero hits on the deleted components. |
| R2/AC2 | Full scripts/+docs census, every hit classified | §2 below — full enumeration. |
| R3/AC3 | `docs/component-catalog.md` counters | `docs/component-catalog.md` edited: heading `(10)`→`(6)`; Total 242→238; Storybook stories 47→43; Client components 156→155; Locale-aware 107, arbitrary Tailwind 36, flagged 51 — unchanged (none of the 4 rows carried 🌐/⚠️/MANUAL_REVIEW). |
| R4/AC4 | `docs/design-system.md` no longer presents the four as live | §3 below — before/after quotes for every edited line. |
| R5/AC5 | `docs/responsive-screenshot-matrix.md` 40 rows removed | 3 subsections removed (31 + 6 + 3 = 40 rows). `grep -n "layout-pageshell\|layout-pageheader\|layout-filterbar\|layout-section" docs/responsive-screenshot-matrix.md` → exit 1, 0 matches (verified after wording the replacement note to avoid re-matching its own pattern). |
| R6/AC6 | No user-visible change; real request to `/sq` and `/sq/listings` | `npm run build` exit 0; `next start` (PORT=3789, avoiding a pre-existing unrelated process already bound to :3000) → `GET /sq` 200, `GET /sq/listings` 200, both with `site-header` and `site-footer` present. Evidence: `docs/sessions/evidence/task788/10-ac6-server-requests.log`, `ac6-sq.html`, `ac6-sq-listings.html`. |
| R7/AC7 | No new token/marker/allowlist/story/component; tokens gates green | `node scripts/check-design-tokens.mjs --strict --scope=mantine` → 0 violations, 0 stale markers, exit 0 (`06-design-tokens-strict-mantine.log`). Unscoped `npm run check:design-tokens` → exit 1 (pre-existing non-zero baseline, expected); diffed against `docs/sessions/evidence/task787/gate-design-tokens-unscoped.log` — only difference is the scanned-file count (455→450, exactly the 5 deleted non-story `.tsx`/`.ts` files); zero violation lines added or removed. `theme.ts` and `scripts/mantine-migration-scope.json` untouched (confirmed by `git status`). |
| R1/AC8 | `check:stories` 139→135, `check:story-coverage` 26/26, `governance:components` green | `check:stories`: 135 files, 0 violations, exit 0. `check:story-coverage`: 26 covered, exit 0. `governance:components`: exit 0. |

## 2. Reference census (R2/AC2) — every hit enumerated and classified

### `src/` (AC1's own grep, re-run post-deletion)
All hits are `AdminPageHeader`, `AdminPageShell` (admin-shared, out of scope), `MantinePageHeaderWithActions`
(different component), `ListingsFilterBar` (live, listings-feature, reserved Task 789), and
`ListingsTab.tsx:170` (`const FilterBar = (...)`, a local JSX variable — **not this component**, per kickoff
§3.2's own named trap). **live — none matched; historical/wrong-target — all of the above, untouched.**

### `scripts/` (16 files matched a broad grep; classified individually)

| File | Hit | Classification |
|---|---|---|
| `check-stories-rendered.mjs` | `ASSERT_STORIES` had 4 explicit anchor entries (`layout-filterbar--default`, `layout-pageheader--default`, `layout-pageshell--default`, `layout-section--with-title-and-description`) | **live — fixed.** Not named in kickoff §3.3 (which claimed 0 for this area). Removed; comment left explaining the removal. Feeds `screenshots:assert`/`governance:screenshots:assert`, both owner-retired 2026-09-03, but the stale anchors were still live code. |
| `check-locale-leak.mjs` | `'layout-filterbar': ['Studio']` allowlist entry + comment | **live — fixed.** Orphaned key removed with a dated comment; the allowlist key can no longer match anything. |
| `task770-copyid-computed.mjs`, `check-homepage-theme-runtime-deps.mjs` | `FooterView.module.css`/`HeaderView.module.css` paths | Not this component — live files, untouched. |
| `governance/tailwind-entropy.allowlist.json`, `story-coverage-exempt.json`, `mantine-migration-scope.json` | `ListingsFilterBar.tsx`, `AdminPageHeader.tsx`, `Footer.tsx`/`Header.tsx`, `HeaderView.tsx` etc. | Not this component — confirms kickoff's claimed 0 for our four. Untouched. |
| `check-design-tokens.mjs:804`, `scaffold-story.mjs:81` | `if (relPath.startsWith('src/components/layout/')) return 'layout'` / `// src/components/layout/ → "Layout"` | Generic directory-prefix classifiers, not naming our four; directory still exists with live files (Header/Footer/HeaderView/etc.) so still correct. Untouched. |
| `__tests__/check-design-tokens.test.ts`, `check-header-id-parity.mjs`, `task419-qa-shell-fullwidth.mjs` | `HeaderView.tsx`, `ListingsFilterBar.tsx`, `AdminPageShell` variants | Not this component. Untouched. |
| `governance/component-catalog.mjs:37,58,367` | Generic `'layout'`/`'Layout Components (...)'` classifier | Generic, directory still populated. Untouched. |
| `task608-qa-listingcard-list-site.mjs:75,193` | Comment `"pre-existing, out-of-scope FilterBar/Combobox <640 overflow bug"` | Informal shorthand for the live `ListingsFilterBar` on `/listings` (Task 608 is a ListingCard QA script) — **not this component** (ours has zero production consumers per kickoff §3.2 FACT, so a rendered-page bug report cannot be about it). Untouched. |
| `governance/reports/component-catalog.latest.json`, `governance/reports/tailwind-entropy.latest.json` | Full stale entries for all four (catalog.latest.json), `ListingsFilterBar` (tailwind-entropy) | **Machine-generated report artifacts** regenerated only by `catalog:components`/`tailwind-entropy` scans, which the kickoff explicitly forbids running ("would sweep in unreviewed drift" — same precedent `component-catalog.md`'s own header already documents for Tasks 672/681/787, where the `.md` was hand-corrected but the underlying generator was not re-run). Classified **historical — untouched**, consistent with that established precedent; not hand-edited. |

### `docs/` (non-historical set; `docs/sessions/**`, `docs/reviews/**`, `docs/governance-reports/**`, `docs/backlog-archive.md`, `docs/mantine-tailadmin-migration-tracker.md` excluded per kickoff §3.4)

| File | Hit | Classification |
|---|---|---|
| `component-catalog.md` | 4 rows + 6 counters | **live — fixed** (R3/AC3, see above). |
| `design-system.md` | Tier-2 row (:145), §11.1-2/4 (:197-202), §12a (:228,:230), §18 Phase-1 (:463), §26.1 table (:1636) | **live — fixed** (R4/AC4, see §3). `:166`,`:401` — descriptive references (AdminPageShell structure; a dated 2026-05-31 route-inventory "Target" snapshot) — **historical/descriptive — untouched**, per kickoff's own explicit classification. `:119` "Section heading → body" — generic English noun, **not this component**. |
| `responsive-screenshot-matrix.md` | 40 rows across 3 subsections + 1 count annotation | **live — fixed** (R5/AC5). |
| `storybook-governance.md` §13 | `**Layout**: FilterBar, PageHeader, PageShell, Section` (global category-coverage sweep list) | **live — fixed.** Not named in kickoff §3.3 (which claimed 0 for this file) — found during census, matching the kickoff's own §3.5 warning that a green gate/prior claim can still miss a live reference (same class as Task 787's 24 missed hits). Corrected to state the category has no remaining story-bearing members (the surviving `src/components/layout/*` files have no stories). Other hits in this file (§14.9.18/§14.9.19/§14.11 area) are `PageHeaderWithActions` (different Mantine pattern component, substring match only) — not this component. |
| `responsive-storybook-inventory.md` | §1 discovery counts + Layout subsection (4 rows), §2 inventory table (4 rows), §3 category table, §4 GAP recompute, §7 raw ID dump | **live — fixed** for §1-§4 (this file's own header states "CANONICAL INVENTORY — update when stories are added/removed/fixed"). §7 "Generated story-ID inventory (Storybook build 2026-06-08)" is an explicitly dated, sourced (`storybook-static/index.json`) one-time machine capture — classified **historical — untouched**, same treatment as the `.latest.json` report artifacts above. §5 "Slice 5" `PageShell` mentions are a dated Task-420 (2026-06-12) past-tense "Result:" record — **historical — untouched**. Not named in kickoff §3.4; found during census. |
| `ui-audit.md`, `performance.md`, `component-risk-register.md`, `component-coverage-matrix.md`, `admin-ux-rules.md`, `tailwind-governance.md`, `backlog-reserved.md`, `mantine-responsive-design-system.md`, `critical-flow-registry.md` | Various | All hits are `Header.tsx`/`Footer.tsx` (live), `AdminPageHeader`/`AdminPageShell`/`AdminFilterBar` (admin-shared), `ListingsFilterBar` (live), `HeaderView`/`FooterView` (live), or a Task-605-prose mention of `ListingCard` — **none are this component**. `tailwind-governance.md`'s `components/layout` 4-file census (§17.6) is a self-disclaimed ("order-of-magnitude... not a route certification") dated count table — **historical — untouched**, not corrected (distinct from the `component-catalog.md`/`design-system.md` treatment, which are living rule/tier documents, not disclaimed censuses). `critical-flow-registry.md`'s single hit remains Task-605 prose in the `ListingCard` row — **historical — untouched**. |
| `ui-rules.md` §15a | `### FilterBar canonical alignment (Task 362, 2026-06-02)` — four prescriptive rules naming the deleted component's outer container, filter cluster, `filters` prop and `Sheet` body | **live — fixed (Revision 1).** Originally mis-swept into the blanket row above at first pass — corrected by orchestrator review 2026-09-05 (kickoff §14.2, R1.1). `ui-rules.md` is a live pre-read (`docs/rule-index.md:41,56,203`) and §15a is an active section, not retired. See §8 below for the Revision 1 fix and before/after quote. |

## 3. `docs/design-system.md` — before/after (R4/AC4)

**§7 tier table, line 145 — before:**
> `| **2. Global layout primitive** | App-wide structural shells: **PageShell, PageHeader, Section, FilterBar**, plus admin specialisations **AdminPageShell, AdminTable, AdminCardList**. | `src/components/layout/*`, `src/components/admin/*` | ... |`

**after:**
> `| **2. Global layout primitive** | Admin specialisations **AdminPageShell, AdminTable, AdminCardList**. The public half of this tier — **PageShell, PageHeader, Section, FilterBar** — was deleted (Task 788, 2026-09-05): zero production consumers... | `src/components/admin/*` | ... |`

`AdminPageShell`/`AdminTable`/`AdminCardList` preserved, as required.

**§11, lines 197-202 — before:** item 1 prescribed FilterBar's canonical fragment + alignment rule; item 2
said "inside the FilterBar"; item 4 said "(PageHeader, AdminPageShell)".
**after:** item 1 replaced with a retirement note citing Task 788 and pointing at the live, separately-scoped
`ListingsTab.tsx` filter bar (Task 789); item 2's FilterBar cross-reference removed; item 4 now reads
"(AdminPageShell)" only, with `PageHeader`'s removal noted alongside the pre-existing `ActionBar` removal note.

**§12a, lines 228/230 — before:** two bullets prescribing `PageHeader`'s and `FilterBar`'s exact mobile
full-width fragments.
**after:** both bullets retired in place (matching the file's own existing `ActionBar` removal-note style),
each citing Task 788 and "zero product consumers."

**§18, line 463 — before:** Phase 1 roadmap listing `PageShell, PageHeader, Section, FilterBar, ActionBar`,
followed only by the pre-existing Task 343 freeze note.
**after:** added a new `> **Superseded (Task 788, 2026-09-05):**` line stating the public half was never
adopted and is now deleted, `ActionBar` was separately removed by Task 358, and current work uses the Mantine
path — the pre-existing Task 343 freeze note is unchanged.

**§26.1 table, line 1636 — before:** row `| `FilterBar` controls / triggers | `[&>*]:max-sm:w-full` on container (§11, §12a) | |`.
**after:** row removed (table now goes directly from `TabsList` to `SelectTrigger`).

## 4. Files Changed

| Path | Reason |
|---|---|
| `src/components/layout/FilterBar.tsx` (deleted) | Zero production consumers (kickoff §3.2). |
| `src/components/layout/PageShell.tsx` (deleted) | Zero production consumers. |
| `src/components/layout/Section.tsx` (deleted) | Zero production consumers. |
| `src/components/layout/PageHeader.tsx` (deleted) | Zero production consumers. |
| `src/components/layout/FilterBar.stories.tsx` (deleted) | Only consumer of the deleted component. |
| `src/components/layout/PageShell.stories.tsx` (deleted) | Only consumer of the deleted component. |
| `src/components/layout/Section.stories.tsx` (deleted) | Only consumer of the deleted component. |
| `src/components/layout/PageHeader.stories.tsx` (deleted) | Only consumer of the deleted component. |
| `src/components/layout/index.ts` (deleted) | Barrel exported only the four deleted components. |
| `scripts/check-stories-rendered.mjs` | Removed 4 dead `ASSERT_STORIES` anchor entries (live reference found during census, R2). |
| `scripts/check-locale-leak.mjs` | Removed orphaned `layout-filterbar` allowlist entry (live reference found during census, R2). |
| `docs/component-catalog.md` | R3 — removed 4 rows, corrected heading + 3 counters. |
| `docs/design-system.md` | R4 — retired tier-2 public half, §11/§12a prescriptive fragments, §18 Phase-1 note, §26.1 table row. |
| `docs/responsive-screenshot-matrix.md` | R5 — removed 3 subsections (40 rows), adjusted stale count annotation. |
| `docs/storybook-governance.md` | R2 — corrected §13 category-coverage list (live reference found during census, not named in kickoff §3.3). |
| `docs/responsive-storybook-inventory.md` | R2 — corrected §1-§4 living-inventory counts/rows (this doc's own header requires it be kept current); §5/§7 dated historical passages left untouched. |
| `docs/ui-rules.md` | **Revision 1 (R1.1)** — retired §15a's `### FilterBar canonical alignment` section, a live prescriptive fragment for the deleted component the original census had wrongly blanketed as "not this component." |
| `docs/backlog.md` | Session state update. |
| `docs/sessions/2026-09-05-task788-delete-unconsumed-layout-primitive-barrel.md` | This session log (missed in the original §4 table — R1.2). |
| `docs/sessions/evidence/task788/` | Validation transcripts and AC6 HTML evidence, 15 files (missed in the original §4 table — R1.2). |

## 5. Validation evidence

All commands run from repo root, `win32` (`node.exe -p process.platform` → `win32`). Transcripts under
`docs/sessions/evidence/task788/`, captured via `cmd.exe /c "<command> 2>&1"` + `[System.IO.File]::WriteAllLines`
with UTF8-no-BOM, per the kickoff's transcript rule.

| # | Command | Result | Transcript |
|---|---|---|---|
| 1 | `npm run typecheck` | exit 0 | `01-typecheck.log` |
| 2 | `npm run lint` | exit 0 | `02-lint.log` |
| 3 | `npm run check:stories` | 135 files, 0 violations, exit 0 | `03-check-stories.log` |
| 4 | `npm run check:story-coverage` | 26/26, exit 0 | `04-check-story-coverage.log` |
| 5 | `npm run governance:components` | exit 0 | `05-governance-components.log` |
| 6 | `node scripts/check-design-tokens.mjs --strict --scope=mantine` | 0 violations, 0 stale markers, exit 0 | `06-design-tokens-strict-mantine.log` |
| 7 | `npm run check:design-tokens` (unscoped) | exit 1 (pre-existing baseline); diffed vs. task787's log — only scanned-file count differs (455→450), 0 violation-line deltas | `07-design-tokens-unscoped.log` |
| 8 | `npm run build-storybook` | exit 0 | `08-build-storybook.log` |
| 9 | `npm run build` | exit 0 | `09-build.log` |
| 10 | `next start` (PORT=3789) + `GET /sq`, `GET /sq/listings` | both 200, `site-header`+`site-footer` present | `10-ac6-server-requests.log`, `ac6-sq.html`, `ac6-sq-listings.html` |
| 11 | `npm run check:file-integrity` | 28 files checked, all clean, exit 0 | `11-check-file-integrity.log` |
| 12 | `npm run check:mojibake` | 0 artifacts in 3873 files, exit 0 | `12-check-mojibake.log` |
| 13 | `npm run test` (vitest, full suite, extra — not in kickoff's required block, run because 2 scripts were edited) | 4 test files / 5 tests failed, 80 files / 1528 tests passed | `13-vitest.log` |

**Vitest failures (item 13) — all pre-existing, unrelated to this diff:**
- `css-var-resolvability.test.ts` — a `globals.css` var-count assertion (257), unrelated to `src/components/layout`.
- `theme.d69-18.test.tsx` — resolves a theme contract on `FooterView.tsx`, a live file this task did not touch.
- `docs/sessions/evidence/task763/appimage-config-class-assertions.test.ts` — pre-existing documented `BLOCKED` assertion (its own failure message says so).
- `ListingCard.smoke.test.tsx` ×2 — archived-badge rendering on `ListingCard`, unrelated to the deleted components.
None reference `FilterBar`/`PageShell`/`PageHeader`/`Section` or the two edited scripts.

## 6. Assumptions, deviations, and limitations

- The kickoff's own §3.3 table claimed `docs/storybook-governance.md` had 0 relevant entries and did not
  name `scripts/check-stories-rendered.mjs` or `docs/responsive-storybook-inventory.md` at all. The census
  (re-run per kickoff §3.5's own instruction, "§3.4 is a starting point, not an authority") found live
  references in all three; all three are fixed above. This is in scope under R2 ("every live reference in
  scripts/ and docs/ is removed or corrected"), not scope creep — flagged here since it goes beyond the
  kickoff's own itemized list.
- `docs/responsive-screenshot-matrix.md`'s self-stated `~145 screenshots (inc. Layout primitives)` estimate
  (line 188) was already an approximation before this task. I removed the stale "(inc. Layout primitives)"
  qualifier and flagged the figure as stale pending a full recount, rather than computing a new approximate
  number — recomputing it exactly would require deriving the script's per-story/per-viewport multiplier
  logic, which is outside this task's documentation-correction scope.
- `scripts/governance/reports/component-catalog.latest.json` and `tailwind-entropy.latest.json` still contain
  stale entries for the deleted components. These are machine-generated report artifacts regenerated only by
  running `catalog:components`/the tailwind-entropy scan — both out of scope per the kickoff (regenerating
  would "sweep in unreviewed drift"), consistent with `component-catalog.md`'s own documented precedent of
  hand-correcting the `.md` while leaving the generator unrun across Tasks 672/681/787. Left untouched and
  named here for the record.
- Owner decision left open per kickoff §5: whether `docs/design-system.md`'s tier-2 row should be renamed now
  that only the admin specialisations remain, or whether the public half is expected back on the Mantine path.
  Not decided in this session.
- No `OWNER VISUAL QA REQUIRED` matrix: no visible artifact was created or changed (4 stories were deleted,
  not modified), matching the kickoff's own Q1 classification and re-verified against the census (zero
  consumers confirmed, no rendered surface existed before or after).

## 7. Opus handoff

- Evidence root: `docs/sessions/evidence/task788/`.
- Please independently verify the 3 additional live references found outside the kickoff's own §3.3/§3.4 list
  (`check-stories-rendered.mjs`, `check-locale-leak.mjs`, `storybook-governance.md` §13, and the broader
  `responsive-storybook-inventory.md` correction) — these were not anticipated by the kickoff and are the
  highest-risk part of this session to re-check.
- Please verify the AC6 evidence: the server was started on an alternate port (3789) because port 3000 already
  had an unrelated, pre-existing process bound to it returning 500 — that process was left untouched; my own
  fresh `next start` instance was used for the 200/header/footer evidence and was torn down afterward
  (`taskkill` on the PID `netstat` identified as owning :3789, confirmed by a subsequent connection-refused
  probe).
- Please verify the 5 pre-existing vitest failures are genuinely unrelated (none touch the deleted paths or
  the two edited scripts) rather than taking this session's classification at face value.

## 8. Revision 1 (2026-09-05) — orchestrator review response

**Verdict addressed:** `NEEDS REVISION`, kickoff §14. R1, R3, R4, R5, R6, R7 and AC1/AC3/AC4/AC5/AC6/AC7/AC8
were already `VERIFIED` and are unchanged. Two items required correction, both applied:

### 8.1 R1.1 (P1) — `docs/ui-rules.md:545-552` before/after

**Before:**
> `### FilterBar canonical alignment (Task 362, 2026-06-02)`
> `FilterBar outer container: \`flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start [&>*]:max-sm:w-full\``
> `Use \`sm:items-start\` (NOT \`sm:items-center\`). ... the "scatter" bug. ...`
> `FilterBar filter cluster: \`flex flex-wrap items-start gap-2\` — chip rows top-align. Consumer's \`filters\` prop should use \`items-start\` too for consistency.`
> `FilterBar Sheet body: NO own \`p-*\` on the inner filter area div — SheetContent's \`p-6\` (Task 361) provides the indentation.`

**After:**
> `### FilterBar canonical alignment — RETIRED (Task 788, 2026-09-05)`
> `\`src/components/layout/FilterBar.tsx\` and its story are deleted — zero production consumers. The outer-container, filter-cluster and Sheet-body fragments this section prescribed no longer bind anything. The live hand-rolled filter bar in \`src/modules/cabinet/components/ListingsTab.tsx\` is a separate component reserved for its own migration (Task 789) and does not inherit these fragments.`

Rest of §15a (Threshold / Select & Combobox trigger left-align rule) is untouched.

**Verification:**
- `grep -n "FilterBar outer container:" docs/ui-rules.md` → 0 matches (exit 1).
- `grep -n "### FilterBar canonical alignment" docs/ui-rules.md` → 1 match, heading now carries `— RETIRED (Task 788, 2026-09-05)`.
- Census row split in §2 above: `ui-rules.md` removed from the nine-file blanket "not this component" row and given its own `live — fixed` row.

### 8.2 R1.2 (P3) — `Files Changed` table completed

Added the two missing rows to §4 above: this session log itself, and `docs/sessions/evidence/task788/`
(15 files — the original 13 gate transcripts plus the 2 AC6 HTML bodies). `docs/ui-rules.md` (this
revision's product edit) added as a third new row. The table's path set now equals
`git --no-optional-locks status --short`'s 19 entries (9 deletions + 8 doc/script edits +
`docs/backlog.md` + the 2 untracked session paths), excluding the kickoff file and sprint plan file,
which are orchestrator-owned per kickoff §14.6.

### 8.3 Verification plan for Revision 1 (kickoff §14.4) — exact results

Platform confirmed `win32` (`node.exe -p process.platform`). Both commands run exactly as specified,
no other gates re-run (kickoff §14.4 explicitly excludes a full re-run).

| Command | Result | Transcript |
|---|---|---|
| `npm run check:file-integrity` | 38 files checked, all clean, exit 0 (re-run after this session log reached its final content — file count grew from 36 as the log itself grew) | `docs/sessions/evidence/task788/14-r1-check-file-integrity.log` |
| `npm run check:mojibake` | 0 artifacts in 3878 files, exit 0 (same re-run) | `docs/sessions/evidence/task788/15-r1-check-mojibake.log` |

Both captured via `cmd.exe /c "<command> 2>&1"` + `[System.IO.File]::WriteAllLines` (UTF-8, no BOM),
`EXIT_CODE` recorded inside each file — no `Tee-Object`.

### 8.4 Nothing else touched

Per kickoff §14.6: `src/**`, the nine deletions, the already-corrected `component-catalog.md` /
`design-system.md` / `responsive-screenshot-matrix.md` / `responsive-storybook-inventory.md` /
`storybook-governance.md` / the two scripts, the eight other files in the original blanket census row,
Task 790's red suite, and `docs/backlog.md`/the sprint Tasks table/this kickoff's `State` header — none
of these were re-touched in this revision.

**Status unchanged:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.
