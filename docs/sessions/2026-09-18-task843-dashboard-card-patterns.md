# Task 843 — canonical dashboard card patterns: `MantineDashboardCard`, `MantineDashboardStatCard`, `MantineDashboardStatRows`

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` (Revision 1 executed; see bottom section)

Kickoff: `tasks/Sprints/Sprint_78_kickoff_prompt_Task_843_Dashboard_Card_Patterns.md`

## I0 re-measure (§10 step 1)

`node.exe -p "process.platform + ' ' + process.version"` → `win32 v22.22.3`. `git status --porcelain` →
clean. Pre-edit `git hash-object`: `theme.ts dc448564c` · `patterns/index.ts 9895851ca` ·
`mantine-migration-scope.json b6cc13e8d` · `messages/{sq,en,uk,it}.json` `80bc65e2d`/`661f5b826`/`00ff8786`/`c1f5d6aa3`.
Re-ran §3.1 duplicate searches and §3.2 token greps — matched the kickoff's §3 exactly (only legacy local
`StatCard` in `src/app/admin/page.tsx`; `MantineEmptyLoadingErrorState` confirmed deliberately not reused
for these compact cards; `Card`/`Skeleton` defaultProps confirmed). Transcripts `00`-`11`.

## Requirement and acceptance-criteria evidence

| ID | Requirement | Evidence |
|---|---|---|
| R1 [AC1] | `MantineDashboardCard` — title always visible, `ready`/`loading`/`error`/`stale` states | `src/design-system/mantine/patterns/MantineDashboardCard.tsx` — header (`Title order={2} size="h5"` + scope label) renders unconditionally before the state branch; `loading` = 3 token-sized `Skeleton` lines + `aria-busy`; `error` = message + `Button variant="default"` Retry; `stale` = children rendered + `Badge color="yellow"` with `AlertTriangle` icon + `staleLabel`/`staleTime`. Story `Patterns/Mantine/DashboardCard → Default` renders all four side by side. |
| R2 [AC2, AC6] | `MantineDashboardStatCard` — §6u anatomy, one link target, skeleton/zero/error states | `MantineDashboardStatCard.tsx` — `ThemeIcon size="hero" radius="xl" color="gray" variant="light"`, label `Text size="sm" c="gray.5"`, value `fz={theme.headings.sizes.h3.fontSize}` `fw={700}` `c="gray.8"`, `mih={theme.other.boxSize.dashboardStatCardMinHeight}`. With `href`, `Card component={Link}` is the sole `<a>`; the `error` branch never sets `href`, so Retry is never nested in a link. AC2 play-function assertion (`DashboardStatCard.stories.tsx`, `Default.play`): `canvasElement.querySelectorAll('a').length === 2` (ready+zero cards only) and every `<button>`'s `.closest('a')` is `null`. |
| R3 [AC3, AC6] | `MantineDashboardStatRows` — labelled rows, `allZeroState`, touch target | `MantineDashboardStatRows.tsx` — each row is an `UnstyledButton component={Link}` with `mih={theme.other.touchTarget}`; `allZeroState` replaces rows only when the caller passes it. AC3/AC6 play-function assertion (`DashboardStatRows.stories.tsx`, `Default.play`): the ready three-row group renders exactly 3 `<a>`s (counts `[3,0,1]`), each with `getBoundingClientRect().height >= 43px`. |
| R4 [AC4] | Zero raw px/rem/hex/`className`/`components/ui/` in the three pattern files | `git grep -n -E "className=|components/ui/|#[0-9a-fA-F]{3,8}\b|[0-9]+px|rgba?\(" -- src/design-system/mantine/patterns/MantineDashboard*.tsx` prints nothing, exit 1 (transcript `11`, re-confirmed final `27`). `check:design-tokens:strict` exit 0 (`06`). `check:enrolled-tailwind` exit 0, no new finding (`07`, `22`). |
| R5 [AC5, AC7] | Own canonical Story per pattern, toolbar-only locale/viewport, enrolled | Three files under `src/stories/patterns/mantine/`, titles `Patterns/Mantine/Dashboard{Card,StatCard,StatRows}`, each a direct import, no locale/width-named export, no `globals.viewport` pin. Enrolled in `scripts/mantine-migration-scope.json`. `check:story-coverage` exit 0 (`04`), `check:pattern-enrolment` exit 0 (`05`), `check:stories` exit 0/153 files/0 violations (`03`). |
| R6 [AC8] | New `dashboard.common` namespace + story fixtures in all 4 locales | `messages/{en,sq,uk,it}.json` — `dashboard.common.{retry,loading_label,updated_at_prefix}` (3 keys) + `storybook.mantine.dashboard_*` fixtures (13 keys), all 4 locales, `check:i18n` exit 0, 2294 keys/locale (`02`). |
| R7 [AC9] | Mobile ≤639px: full width, no shrink, ≤2-line labels, no overflow | `lineClamp={2}` on every label/caption `Text`; cards are block-level inside their `SimpleGrid`/`Stack` containers (no fixed width). Owner visual review below. |

## Current versus required behavior

**Before.** No dashboard card/stat/row pattern existed anywhere in `src/`. `/admin` still draws its own
local, unenrolled, Tailwind `StatCard` (`src/app/admin/page.tsx:88-116`) — untouched by this task.

**After.** Three enrolled, storied, token-only Mantine patterns exist with no production consumer yet
(853/854 wire them in). Nothing a real user sees changes.

## Files Changed

| Path | Reason |
|---|---|
| `src/design-system/mantine/patterns/MantineDashboardCard.tsx` | New — R1. |
| `src/design-system/mantine/patterns/MantineDashboardStatCard.tsx` | New — R2. |
| `src/design-system/mantine/patterns/MantineDashboardStatRows.tsx` | New — R3. |
| `src/design-system/mantine/theme.ts` | R2 — one `boxSize.dashboardStatCardMinHeight` role (132px, spec §17.2/§17.3), union member + value, inserted in ascending order between `truncateLabel` (120px) and `dropdownPanel` (220px). |
| `src/design-system/mantine/patterns/index.ts` | R5 — barrel exports for the three new patterns and their types. |
| `scripts/mantine-migration-scope.json` | R5 — three entries appended. |
| `messages/{en,sq,uk,it}.json` | R6 — `dashboard.common.*` (3 keys) + `storybook.mantine.dashboard_*` fixtures (13 keys), identical key sets across all 4 files. |
| `src/stories/patterns/mantine/DashboardCard.stories.tsx` | New — R5, R1's states. |
| `src/stories/patterns/mantine/DashboardStatCard.stories.tsx` | New — R5, R2's states + AC2 play-function assertion. |
| `src/stories/patterns/mantine/DashboardStatRows.stories.tsx` | New — R5, R3's states + AC3/AC6 play-function assertion. |
| `docs/backlog.md` | 843 line updated to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. |

Not part of this task's diff: `docs/golden-rules.md`, `docs/agent-contract.md`,
`.claude/skills/execute-task/SKILL.md` appeared modified mid-session and are now clean again — an
owner/orchestrator commit landed externally (`063e2075d docs: require canonical UI reuse preflight`,
adding GR-0) while this session was running. Not touched by this session; excluded from this table.

## GR receipts

`GR-1 CENSUS COMPLETE — 3 nodes; tier1 3 migrated+enrolled+story (this task); tier2 0 imports removed; tier3 0 listed and filed as none.` (per-file: transcripts `10`, re-confirmed final `24`.)
`GR-3 STORY PROVEN — MantineDashboardCard ← src/stories/patterns/mantine/DashboardCard.stories.tsx; MantineDashboardStatCard ← …/DashboardStatCard.stories.tsx; MantineDashboardStatRows ← …/DashboardStatRows.stories.tsx.`
`GR-3a STORY PREFLIGHT` — as recorded in the kickoff §12 (canonical candidates: NONE; decision `CREATE`), unchanged by execution.
`GR-4 AC AUDIT` — 9/9 criteria evidenced above; AC9 is `OWNER VISUAL QA REQUIRED`, not self-scored.

## Owner corrections during this task — not self-caught, recorded verbatim

The first full implementation had three defects, all found by the owner's own review, not by any
automated gate (none of them are things `check:design-tokens:strict`/`check:enrolled-tailwind` can see,
since they are valid Mantine props, just not the *canonical* ones):

1. **Retry button chrome.** Used `variant="outline" color="gray"`, citing two production files that used
   the same pairing — but that pairing is absent from the enumerated canonical `Mantine/Primitives/Button`
   story (`filled · default · subtle · light(red) · transparent`). That story's own "Cancel" example is
   `variant="default"`, the actual canonical secondary/neutral chrome. Fixed in all three patterns.
2. **Inconsistent error-text color.** `MantineDashboardStatCard` used `c="red"`; `MantineDashboardCard`
   and `MantineDashboardStatRows` used no color at all for the same semantic state. Canonical source
   found: `MantineFormSectionStack.tsx:135` (`Text size="sm" c="red"`). All three now match.
3. **Full re-audit (owner instruction "check the whole task").** Every remaining `color`/`variant`/`size`/
   `radius`/`fw` prop in the three files was checked against real precedent, not assumption. Two more
   uncited deviations found and removed: the stale-warning `Badge`'s `size="md"` (no Badge anywhere in
   the app renders at `md`; removed, uses the theme default `sm`) and the `StatRows` loading `Skeleton`'s
   `radius="md"` (theme default is `xl`; every other Skeleton in these files already used the default).
   Full table with what was confirmed-correct-on-recheck (not invented) vs. fixed is in
   `docs/sessions/evidence/task843/19-canonical-primitive-audit.md`.

`check:locale-leak:mantine-only` was started once (after the first `build-storybook`) and stopped by the
owner before completion (>20 min runtime crawling 103 canonical stories × 4 locales in Playwright): *"як
показала практика, цей тест всеодно не бачить, наскільки якісно зроблені елементи... кожного разу
необхідно власноруч все переглядати"* — replaced for this task by the owner's own direct visual review
of the §13.3 matrix via a running `npm run storybook` dev server. Not claimed as a passing or failing
gate; recorded as not run in `docs/sessions/evidence/task843/13-check-locale-leak.txt`.

## Validation evidence (§13.2 final gate block, re-run after all three correction rounds)

All commands run from the repo root; transcripts under `docs/sessions/evidence/task843/`.

| # | Command | Exit | Transcript (first run / final re-run) |
|---|---|---|---|
| 1 | `typecheck` | 0 | `00` / re-run clean after each fix round |
| 2 | `lint` | 0 (79 pre-existing warnings, none in touched files) | `01` |
| 3 | `check:i18n` | 0 (2294 keys, all 4 locales) | `02` |
| 4 | `check:stories` | 0 (153 files, 0 violations) | `03` |
| 5 | `check:story-coverage` | 0 | `04` |
| 6 | `check:pattern-enrolment` | 0 | `05` |
| 7 | `check:design-tokens:strict` | 0 | `06` |
| 8 | `check:enrolled-tailwind` | 0 | `07` / `22` |
| 9 | `check:rendered-scope` | 0 | `08` / `23` |
| 10 | `check-surface-census-changed.mjs --base HEAD` | 0 (new files invisible to this gate — untracked; covered by #11 instead) | `09` |
| 11 | `check-surface-census.mjs --surface` ×3 | 0 each, exact `GR-1 CENSUS COMPLETE` receipt | `10` / `24` |
| 12 | `build-storybook` | 0 | `12` / `25` |
| 13 | `check:locale-leak:mantine-only` | not completed — owner-stopped (see above) | `13` |
| 14 | `build` | 0 | `14` / `26` |
| 15 | `check:file-integrity` | 0 (36 files clean) | `15` / `20` |
| 16 | `check:mojibake` | 0 (0 artifacts / 5907 files) | `16` / `21` |
| 17 | `git grep` hardcode probe | 1 (expected — empty match) | `11` / `27` |
| 18 | `git diff --stat` (full) + `git hash-object` (final) | — | `27` |

Final post-edit hashes (transcript `27`): `theme.ts 0e4bd13dd` · `patterns/index.ts a2a0fbd40` ·
`mantine-migration-scope.json e106434a4` · `MantineDashboardCard.tsx 342b6fafd` ·
`MantineDashboardStatCard.tsx c297608ac` · `MantineDashboardStatRows.tsx 317e39596`.

## Deviations / limitations

1. `check:locale-leak:mantine-only` not run to completion — owner instruction, see above. No leak claim
   made for the three new stories either way.
2. AC6's "touch target ≥44px" and AC2's "exactly one `<a>`" are proven via Storybook `play`-function DOM
   assertions inside the story files (`storybook/test`'s `expect`), not a separately-run Playwright/CI
   interaction-test pass — `test-storybook`/an interaction test-runner script was not invoked this
   session. The assertions are written into the stories themselves and will run under any future
   interaction-test pass; flagging for Opus to decide whether that separate run is required before
   approval.
3. No production consumer exists yet (by design — 853/854 are separate tasks). Nothing renders these
   patterns outside Storybook.

## Revision 1 — review 1 returned `NEEDS REVISION` (2026-09-18, kickoff §16)

`GR-0 CANONICAL REUSE PREFLIGHT — request: error-state composition (F3) for MantineDashboardCard/StatCard/StatRows; semantic queries: "error state", "Alert", "empty loading error"; inspected candidates: src/design-system/mantine/patterns/MantineEmptyLoadingErrorState.tsx (Patterns/Mantine/EmptyLoadingErrorState) — Alert color="red" variant="light", description, caller-built action, no min-height; decision: EXTEND-by-consumption (COMPOSE — the existing error branch is reused unchanged, only its callers change); selected canonical owner: MantineEmptyLoadingErrorState.tsx; Mantine/TailAdmin token path: n/a (Alert's own theme defaults); new hardcoded visual values: NONE; rationale: review 1 (F3) found the original §3.1 row wrongly excluded MantineEmptyLoadingErrorState's error branch specifically — its loading/empty branches remain unused (too tall / spinner vs skeleton, unchanged reasoning), but the error branch is exactly the spec's error contract already built.`

### Findings corrected

| ID | Fix |
|---|---|
| F1 | `DashboardStatRow.count` changed `ReactNode` → `number`, added optional `displayCount?: ReactNode`. `allZeroState` now renders only when `allZeroState && rows.every((r) => r.count === 0)` — the pattern evaluates the condition itself instead of trusting the caller. Row render uses `displayCount ?? count`. |
| F2 | Removed 2 new inline `style={{ display: 'block' }}` (StatCard, StatRows) → replaced with the Mantine `display="block"` prop. **Also found and fixed the same class of defect in Task 844's `MantineDashboardWorkList.tsx`** (2 more `style={{}}` objects — `display: 'block'` and `flex: 1, minWidth: 0`) while re-running this task's `--untracked` grep against the full `MantineDashboard*.tsx` glob, which includes 844's file. Fixed to `display="block"` / `flex={1} miw={0}`. |
| F3 | All three patterns' `error` branch now composes `<MantineEmptyLoadingErrorState state="error" description={errorMessage} action={retryLabel ? <Button variant="default" onClick={onRetry}>{retryLabel}</Button> : undefined} />` in place of the cloned `Text`+`Button`. `MantineDashboardCard`/`MantineDashboardStatCard` keep their title/icon+label outside it, per §16.2. `MantineEmptyLoadingErrorState.tsx` itself is unchanged. The stray `MantineFormSectionStack.tsx:135` citation comments are deleted. |
| F4 | See "New evidence" below — play-function results retained as real transcripts, not just code. |
| F5 | `18-owner-review-matrix.md` updated: first-pass acceptance recorded as predating this revision; tuples 1–7 marked as still owed a re-review now that F3 changed the error-state's rendered visuals. |
| F6 | `loadingRowCount ?? rows.length ?? 3` → `loadingRowCount ?? rows.length` (dead fallback removed — `.length` is never nullish). |

### New evidence required (§16.3)

1. **`MantineDashboardStatRows.smoke.test.tsx`** (new) — 4 cases: (a) mixed counts `[3,0,1]` + `allZeroState` → 3 links, no empty text; (b) all-zero `[0,0,0]` + `allZeroState` → empty text, 0 links; (c) all-zero with no `allZeroState` → 3 links; (d) `displayCount` renders in place of `count`. All 4 pass (transcript `30` — after the planted-violation run below). **Planted-violation**: reverted the render condition to `if (allZeroState)` → case (a) FAILED (`30-planted-violation-statrows.txt`, 1 failed/3 passed). Restored; `git hash-object` before plant and after restore both `f05c17078daa0ca16155d4842da505eb89aff07f`.
2. **`MantineDashboardStatCard.smoke.test.tsx`** (new) — 3 cases: `ready`+`href` → exactly one link containing label+value, no nested `<a>`; `error`+`onRetry` → Retry button's `closest('a')` is `null`, `onRetry` called once; `error` renders no value/`0` text. All 3 pass. **Planted-violation**: passed `href`/`component={Link}` through to the error branch's `Card` → 2 of 3 tests FAILED (`31-planted-violation-statcard.txt` — the render itself threw on Next's own `Link` prop validation before reaching the assertion, which still counts as the required failure: the plant makes the tests fail, exactly as required). Restored; `git hash-object` before plant and after restore both `c959eb15610d20550cca80fab5fb38e16628272a`.
3. **AC6 rendered-reading probe (§16.3 item 3, `30-ac6-probe.mjs`)** — run against the live `npm run storybook` dev server at viewport 320×800, locale `uk`. First run scoped `querySelectorAll` to the whole iframe document and false-failed on 4 zero-height Storybook dev-chrome links ("Decorators documentation", "Webpack", "Vite", "Environment Variables documentation" — hidden onboarding/error-boundary elements outside the story's own render root). Corrected to scope the query to `#storybook-root`; re-run exit 0. Real measured results (`30-ac6-probe.json`): DashboardStatCard — 2 links (heights 198.1px, 202.1px, both ≥ 44px), 1 button, `closest('a')===null`; DashboardStatRows — 3 links (all exactly 44px), 1 button, `closest('a')===null`; `scrollWidth` 320 (no overflow) for both. Locale `uk` text confirmed in the captured link text ("На модерації", "Очікує", "Відхилено", …).

### Validation evidence (§16.4 final gate block)

| # | Command | Exit |
|---|---|---|
| — | `typecheck` | 0 |
| — | `lint` | 0 (79 pre-existing warnings, 0 errors) |
| — | `check:i18n` | 0 (2299 keys, all 4 locales) |
| — | `check:stories` | 0 (155 files, 0 violations) |
| — | `check:story-coverage` | 0 |
| — | `check:pattern-enrolment` | 0 |
| — | `check:design-tokens:strict` | 0 |
| — | `check:enrolled-tailwind` | 0 |
| — | `check:rendered-scope` | 0 |
| — | `check-surface-census.mjs --surface` ×3 | 0 each, `GR-1 CENSUS COMPLETE — 2 nodes` (self + `MantineEmptyLoadingErrorState.tsx`) |
| — | both new smoke tests together | 0 (7/7 passed) |
| — | `build-storybook` | 0 |
| — | `build` | 0 |
| — | `check:file-integrity` | 0 (66 files clean) |
| — | `check:mojibake` | 0 (0 artifacts / 5931 files) |
| — | `--untracked` hardcode grep (`className=\|components/ui/\|style=\{\|hex\|px\|rgba`) | prints 3 lines, all classified `comment` (JSDoc provenance text: "132px", "(44px)", "no className"), 0 `code` lines |
| — | AC10 `c="red"` grep over the 3 pattern files | prints nothing, exit 1 |

`check:locale-leak:mantine-only` not run — owner waived it 2026-09-18 (quoted verbatim in `13-check-locale-leak.txt`), unchanged by this revision.

### Files Changed (Revision 1, in addition to the original table)

| Path | Reason |
|---|---|
| `src/design-system/mantine/patterns/MantineDashboardCard.tsx` | F3 error-branch composition. |
| `src/design-system/mantine/patterns/MantineDashboardStatCard.tsx` | F2 style-prop fix, F3 error-branch composition. |
| `src/design-system/mantine/patterns/MantineDashboardStatRows.tsx` | F1 `count`/`displayCount` type + gate fix, F2 style-prop fix, F3 error-branch composition, F6 dead-fallback fix. |
| `src/stories/patterns/mantine/DashboardStatRows.stories.tsx` | F1 — all-zero demo now passes 3 rows with `count: 0` instead of `rows={[]}`. |
| `src/design-system/mantine/patterns/__tests__/MantineDashboardStatRows.smoke.test.tsx` | New, §16.3 item 1. |
| `src/design-system/mantine/patterns/__tests__/MantineDashboardStatCard.smoke.test.tsx` | New, §16.3 item 2. |
| `src/design-system/mantine/patterns/MantineDashboardWorkList.tsx` (Task 844, fixed opportunistically) | Same F2-class `style={{}}` defect found and fixed while re-running this task's grep against the shared glob — not part of 843's own scope, noted here for traceability. |
| `docs/sessions/evidence/task843/18-owner-review-matrix.md` | F5 — re-review-owed note added; first-pass acceptance dated and scoped as predating this revision. |
| `docs/sessions/evidence/task843/30`–`33` | New transcripts (planted-violation pairs, final gate re-run). `00`–`27` retained, superseded where a `30+` transcript replaces them (per §16.1). |

### Opus handoff (Revision 1)

- AC3r, AC4r, AC2r/AC6r, and AC10 are all evidenced above with real command output (including the `30-ac6-probe.mjs` Playwright run against the live dev server, not just the play-function code).
- **AC9r/F5 is not closed**: the owner has not yet re-reviewed tuples 1–7 against the Revision 1 visuals (F3 changed the error state's actual rendered chrome). `18-owner-review-matrix.md` records this as owed, not assumed.
- Status remains `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` reflecting that one open item, not a clean bill.

## Owner visual review — §13.3

**Corrected (review H3): this section previously stated "Owner verdict: accepted" unqualified, which contradicts
`18-owner-review-matrix.md` (which correctly records the re-review as owed). The accurate state:** the owner
reviewed live via `npm run storybook` across three correction rounds (Retry chrome, error-text colour,
Badge/Skeleton size/radius — see corrections above) and accepted THAT pass. Revision 1's F3 fix changed the
error state's actual rendered chrome afterward, so that acceptance does not cover the current build. **Tuples 1–7
still need the owner's fresh look; not accepted as final.** Full tuple matrix and URLs:
`docs/sessions/evidence/task843/18-owner-review-matrix.md`.

## Backlog update

`docs/backlog.md` Sprint 78 registry row for 843 updated from `KICKOFF FILED` to
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. Physical line count of `docs/backlog.md` unchanged by this
edit (single-cell update inside the existing registry table row, no new line added). No `BACKLOG LIMIT
BREACH`.

## Opus handoff

- Evidence root: `docs/sessions/evidence/task843/` (27 numbered transcripts + 3 markdown notes).
- Please independently re-inspect the "Owner corrections" section above against the real diff — three
  rounds of hardcode-adjacent findings on one task is the exact pattern GR-0 (landed externally this
  session, `063e2075d`) now names explicitly; worth confirming the fourth pass (this log) actually holds.
- **Corrected:** Deviation 2 previously said play-function assertions weren't run through a separate
  interaction-test pass. There is no dedicated `test-storybook` runner in this project (checked: not in
  `package.json`) — but Storybook auto-runs each story's `play` function on any real browser render, which is
  exactly what every Playwright probe this session did. `docs/sessions/evidence/task843/
  58-play-function-execution-proof-output.txt` confirms all 4 relevant stories' play functions executed with
  zero thrown errors (`throwPlayFunctionExceptions: true` on each), a real run, not just inspected code.
- `check:locale-leak:mantine-only` never completed for these three stories — the owner's own visual
  review is what stands in its place per his instruction; confirm that is acceptable evidence for review.

## Revision 2 (2026-09-18) — review 2 returned `NEEDS REVISION`, evidence only (kickoff §17)

Review 2 confirmed F1/F2/F3/F4/F6 as genuinely fixed in the code and re-ran the new tests (7/7) natively on
Windows — **no 843 source file was to change**, and none did. New findings (§17.2): **H1** (no §16.4 gate
transcripts — only an exit-code table; evidence had files `30`–`33` only), **H2** (AC9r/F5 — tuples 1–7 not yet
re-reviewed after F3), **H3** (this log's stale unqualified "Owner verdict: accepted", fixed above).

**H1 and H3 closed by this response.** Per §17.2's explicit instruction, the successor to §16.4 is the joint block
defined in **844 kickoff §16.3** (covers all five patterns, run once after 844's own Revision 1 lands, because the
two tasks share `theme.ts`, `patterns/index.ts`, the manifest and `messages/*.json`). That block was run in full;
every command's transcript is saved individually at `docs/sessions/evidence/task843/40`–`58` (platform, typecheck,
lint, i18n, the combined 26-test vitest run, stories/coverage/enrolment/design-tokens/enrolled-tailwind/
rendered-scope, 5 per-file censuses, `build-storybook`, `build`, file-integrity, mojibake, the `--untracked`
hardcode grep with `comment`/`code` classification — 4 hits, all `comment`, 0 `code`, no `c="red"` anywhere — `git
diff --stat`, `git hash-object`, and the play-function execution proof). Every command exits 0.

**H2 remains open — only the owner can re-review the 7 tuples; not self-closable.**
