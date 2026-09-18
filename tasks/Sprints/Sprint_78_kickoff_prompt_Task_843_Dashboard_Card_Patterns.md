# Task 843 — canonical dashboard card patterns: `MantineDashboardCard`, `MantineDashboardStatCard`, `MantineDashboardStatRows`

Sprint 78 · P1 · QA profile **Q3** · Wave A, first task · **Status: ⏸ PARTIALLY VERIFIED 2026-09-18 (review 3) — code and §17 H1/H3 evidence verified; waiting on owner re-review H2 and the joint closure with 844 (§17.3)**

Sprint plan: [`Sprint_78_Admin_And_Agent_Dashboards_On_Canonical_Mantine.md`](Sprint_78_Admin_And_Agent_Dashboards_On_Canonical_Mantine.md) — read
its "Owner decisions" table first; **D78-5** (TailAdmin type scale wins over the spec's §17.1 numbers) binds this task.

## 1. Mode and task type

`IMPLEMENTATION` — create three canonical Mantine patterns and their Stories **before** any consumer exists. That is the
UI hierarchy rule: a component's canonical story comes before any composition. Bundles: **UI / Current Mantine path** +
**Storybook / Visual Proof**. No production consumer is changed in this task; 853 and 854 consume these patterns.

## 2. Objective

Both dashboards are built from three card shapes the spec defines (§16.1, §17.1–§17.4). None exists in the project.

1. **`MantineDashboardCard`**: the section card shell. Title, a scope label (`Now` or the period), an optional header
   action slot, a body, and its own `loading` / `error` (with Retry) / `stale` states. Error and stale never replace
   the title.
2. **`MantineDashboardStatCard`**: the top-row KPI/queue card (ADM-01, ADM-02, ADM-06, AGT-02, AGT-03, ADM-08,
   ADM-09). Icon surface, label, large value, caption, optional secondary line, and **one** full-card link target.
   Also a skeleton loading state, a zero state that reads as success, and an error state.
3. **`MantineDashboardStatRows`**: a list of labelled count rows, each its own link with a chevron. It is used for
   AGT-01's three actions, AGT-02's secondary statuses, ADM-09's two breakdown rows and ADM-04's future rows. When
   every count is 0 it can show one positive empty state.

Every value comes from a Mantine prop or a theme key. Each pattern has its own Story under `Patterns/Mantine/…`,
proving every state at every breakpoint through the toolbar, and each is enrolled in the manifest.

## 3. Verified context — measured 2026-09-18 by the orchestrator (re-measure at I0)

### 3.1 Duplicate search

| Question | Search | Result |
|---|---|---|
| An existing metric/stat/KPI card component? | `git grep -l -i -E "StatCard\|MetricCard\|StatTile\|MetricItem" -- src` | Only `src/app/admin/page.tsx` (a **local** legacy `StatCard`, Tailwind, not exported) and unrelated `WebVitalsReporter.tsx`. Nothing reusable. |
| The TailAdmin metric-card contract | `docs/tailadmin-style-reference.md` §6u (lines ~1125-1154) | **Exists** (zip-cited): wrapper `rounded-2xl border border-gray-200 bg-white p-5 md:p-6`, no shadow; icon badge `h-12 w-12 rounded-xl bg-gray-100`, icon 24px `gray-800`; label `text-sm text-gray-500` (14/20); value `text-title-sm font-bold text-gray-800` (30/38, bold), `mt-2`; label/value row `mt-5`; optional trend badge. It was used by a retired homepage block (Task 597, retired number); no live code implements it. |
| Canonical states pattern | `src/design-system/mantine/patterns/MantineEmptyLoadingErrorState.tsx` + `Patterns/Mantine/EmptyLoadingErrorState` | Exists, enrolled. Its `loading` is a centered `Loader` and its empty block has `minHeight: theme.other.layout.emptyStateMinBlockSize` (200px). That is too tall for a top card, and the spec wants a **skeleton that repeats the card geometry**, not a spinner (§17.4). → its **loading and empty** branches are not used inside these compact cards (the empty branch is reused for the chart-area empty state in 845). **Corrected by review 1 (§16):** its **error** branch (`Alert color="red" variant="light"` + `description` + caller-built `action`, lines ~74-87, no min-height) **is** the canonical error state and is composed by all three patterns. The original row wrongly excluded the whole pattern. |
| Canonical Card primitive | `theme.ts` `Card` defaultProps `{ radius: '2xl', padding: 'lg' }` + border var `gray-2`; `Mantine/Primitives/Card` story | Exists — the shell for all three patterns. |
| Canonical Skeleton | `theme.ts` Skeleton defaultProps `radius:'xl'`; `Mantine/Primitives/Skeleton` story; `skeleton-chrome.css` | Exists — reused for loading geometry. |

### 3.2 Theme tokens this task consumes (grepped definitions in `src/design-system/mantine/theme.ts`)

- `spacing`: `xs '0.5rem'` · `sm '0.75rem'` · `md '1rem'` · `lg '1.25rem'` · `xl '1.5rem'` (lines ~412-426).
- `radius`: `xl '0.75rem'` (12px — TailAdmin icon badge) · `'2xl' '1rem'` (16px — card) (lines ~432-441).
- `fontSizes`: `sm '0.875rem'` (14) · `xs '0.75rem'` (12). Headings `h3: { fontSize: '1.875rem', lineHeight: '1.27', fontWeight: '600' }` (30/38 — TailAdmin `title-sm`).
- `colors.gray` tuple: `5 = #667085` (gray-500, secondary text) · `8 = #1d2939` (gray-800) · `1 = #f2f4f7` (gray-100).
- `other.iconSize`: `hero: 48` (icon badge box) · `decorative: 24` (icon) · `compact: 14` (chevron).
- `other.touchTarget: '2.75rem'` (44px).
- `other.boxSize` has **no** dashboard role. **New:** `dashboardStatCardMinHeight: '8.25rem'` (132px, spec §17.2
  ADM-01 / §17.3 AGT-01, "Висота 132 px"). It is applied as a `mih`, never a fixed height, so a translated label may
  still grow the card. TailAdmin defines no card height, so D78-5 does not override the spec here.

### 3.3 Spec rules this task must encode (from spec v3.3, restated — do not open the `.docx`)

- §4 / §17.4: a `0` is shown **only** after a successful query. A failed or pending source is an error state, never
  `0`. The skeleton contains no digit, no fake name and no continuous shimmer beyond the theme's existing Skeleton
  animation. It respects `prefers-reduced-motion`, which `skeleton-chrome.css` already does (Task 704/705).
- §17.1 interactivity: a KPI card with a drill-down has **one** full-size semantic link target, a visible focus ring,
  and a touch area of at least 44×44. No nested competing clickable elements; a secondary CTA is a separate button
  outside that target.
- §17.1 statuses: colour is never the only carrier; there is always text, plus an icon where a status is shown.
- §16.1: a top card shows name, value, the exact scope (`Now` or the period) and a trend **only** where a correct
  comparison exists (these patterns render a caller-supplied comparison line; they never compute one).
- §17.4 error: the card keeps its title, shows a short explanation and a Retry; stale shows the last valid value
  **only** together with a prominent "updated at …" warning.
- D78-5: value typography = TailAdmin `title-sm` (30/38, bold); label = 14/20 `gray.5`. No new font token.

### 3.4 Clause 16d / GR-1 census

New files; no surface renders them yet. After this task each pattern's census reads itself (tier 1, enrolled +
own Story) plus Mantine core and existing enrolled patterns only. `GR-1 CENSUS COMPLETE — 3 nodes; tier1 3
migrated+enrolled+story (this task); tier2 0 imports removed; tier3 0 listed and filed as none.` (re-run per pattern file in
§13.2).

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | spec §17.1, D78-5 | `MantineDashboardCard` renders a Mantine `Card` (withBorder, theme radius) with a title (`Title order={2} size="h5"` — the existing theme h5 rung, 20px / 1.4 = 28px, which equals the spec §17.1 section-title size, so no new token), a scope label, an optional `headerAction` slot and `children`. States: `ready`, `loading` (Skeleton lines, no digits), `error` (message + Retry button calling `onRetry`), `stale` (children still rendered + a warning `Badge` with an icon and the localized "updated at {time}" text). | P1 | AC1, AC5 | Confirmed |
| **R2** | spec §17.1–§17.2, TailAdmin §6u | `MantineDashboardStatCard` renders the §6u anatomy: icon inside a `ThemeIcon` (size `iconSize.hero`, radius `xl`, gray light surface, icon `iconSize.decorative`), label (`sm`, `gray.5`), value (`title-sm` 30/38 bold, `gray.8`), optional caption and secondary line, optional `comparison` node, `mih = boxSize.dashboardStatCardMinHeight`. With `href`, the **whole card** is one `next/link` anchor, focus-visible, min touch area `touchTarget`. States: `ready`, `loading` (skeleton geometry: label line + value block + caption line), `zero` (value `0` + caller's positive empty text, icon + text, never colour alone), `error` (label kept, message, Retry as a separate button **outside** the link). | P1 | AC2, AC5, AC6 | Confirmed |
| **R3** | spec §17.3 AGT-01/AGT-02, §17.2 ADM-09 | *(Row shape amended by §16.2 F1: `count: number` + optional caller-formatted `displayCount`; the pattern evaluates "every count is 0" itself.)* `MantineDashboardStatRows` renders 1..n rows `{ label, count, href, tone? }`. Each row is its own link (min height `touchTarget`) with label, count and a chevron (`iconSize.compact`). Optional `allZeroState` (icon + text) replaces the rows only when **every** count is 0 **and** the caller passes it. `loading` = N skeleton rows. `error` = message + Retry. | P1 | AC3, AC5, AC6 | Confirmed |
| **R4** | hardcode rule, D71-4 | Zero raw px/rem/hex/rgb, zero `className`, zero Tailwind utility, zero `@/components/ui/*` import in the three pattern files; the only new value is `theme.other.boxSize.dashboardStatCardMinHeight` with its union member. `check:design-tokens:strict` and `check:enrolled-tailwind` exit 0. | P1 | AC4 | Confirmed |
| **R5** | 16c, GR-3, GR-3a | Each pattern has its **own** Story (`Patterns/Mantine/DashboardCard`, `…/DashboardStatCard`, `…/DashboardStatRows`) that directly imports it and renders every state of R1–R3 with locale-backed strings. Locale and viewport come from the toolbar (no locale- or width-named exports, no `globals.viewport` pin). All three files are in `scripts/mantine-migration-scope.json`. | P1 | AC5, AC7 | Confirmed |
| **R6** | agent-contract 7 | Every visible string the patterns render themselves (Retry, "updated at {time}", skeleton/loading aria-label, stale warning) is a `messages/{sq,en,uk,it}.json` key under a new `dashboard.common` namespace, passed in as props by the caller (patterns take labels as props, the same as `MantineEmptyLoadingErrorState`; the Stories read them through `storyT`). `check:i18n` exits 0. | P1 | AC8 | Confirmed |
| **R7** | agent-contract 11, all Mantine breakpoints | At 320–639px every card and row is full width, the value never shrinks below the theme `title-sm` size, labels wrap to at most two lines (`lineClamp={2}`) and nothing overflows horizontally in `uk`. | P1 | AC9 | Confirmed |

## 5. Assumptions and open questions

- **Chevron and icons.** `lucide-react` is the project icon set (it is already used by `UserMenu`, and theme
  `iconSize` is documented for lucide `size`). The patterns take the icon as a `ReactNode` prop; the Stories pass
  lucide icons.
- **Tone.** `MantineDashboardStatRows` rows take an optional `tone: 'positive' | 'warning' | 'danger' | 'neutral'`
  (spec §17.1 semantic buckets). It maps to the theme colours `green` / `yellow` / `red` / `gray`, all defined in
  `theme.ts` `colors`. Tone is shown as a small `Badge` or `ThemeIcon` beside the count, always with the label text.
  Not a new token: these are theme colour names.
- No owner decision open.

## 6. Pre-read rule bundle

`docs/golden-rules.md` · `docs/agent-contract.md` (clauses 7, 9, 11, 13, 14, 16–16d) · `docs/qa-profiles.md` ·
`docs/mantine-responsive-design-system.md` · `docs/tailadmin-style-reference.md` §6 (cards, badges) and **§6u** ·
`docs/component-rules.md` · `docs/storybook-governance.md` (Mantine story shape) · `docs/i18n-rules.md` ·
`docs/qa-rules.md` · `.claude/skills/execute-task/SKILL.md` · the Sprint 78 plan file.

## 7. Scope

- **Created:** `src/design-system/mantine/patterns/MantineDashboardCard.tsx` ·
  `src/design-system/mantine/patterns/MantineDashboardStatCard.tsx` ·
  `src/design-system/mantine/patterns/MantineDashboardStatRows.tsx` ·
  `src/stories/patterns/mantine/DashboardCard.stories.tsx` · `…/DashboardStatCard.stories.tsx` ·
  `…/DashboardStatRows.stories.tsx`.
- **Edited:** `src/design-system/mantine/theme.ts` (one `boxSize` role + its union member) ·
  `src/design-system/mantine/patterns/index.ts` (barrel exports, following the file's existing form) ·
  `scripts/mantine-migration-scope.json` (three entries) · `messages/{sq,en,uk,it}.json` (`dashboard.common.*` and the
  story fixture keys under the existing `storybook` namespace) · `docs/backlog.md` (843 line).
- **Written:** `docs/sessions/evidence/task843/*` · `docs/sessions/<date>-task843-dashboard-card-patterns.md`.

## 8. Out of scope

Any production consumer (`src/app/admin/page.tsx`, the agent page — 853/854) · work lists, status tone source,
`RelativeTime` (844) · charts (845) · header, period control, grid (846) · `MantineEmptyLoadingErrorState` (reused
later, unchanged here) · `src/components/ui/*`. **No test that watches a legacy component** (owner rule 2026-09-18).

## 9. Current and required behavior

**Before.** No dashboard pattern exists. `/admin` draws its own Tailwind stat cards (`page.tsx:88-116`). That page
is not changed by this task.

**After.** Three enrolled, storied patterns exist. Nothing a user sees changes yet.

## 10. Implementation requirements

1. **I0.** `node.exe -p "process.platform + ' ' + process.version"` (must be `win32`);
   `git --no-optional-locks status --porcelain`; `git --no-optional-locks hash-object` of `theme.ts`,
   `patterns/index.ts`, `scripts/mantine-migration-scope.json`, the four `messages/*.json`; re-run the §3.1 searches
   and the §3.2 greps. Any difference from §3 → `BLOCKED` with the new measurement.
2. Edit through the editor or Node UTF-8 I/O — never PowerShell `Get-Content -Raw` without `-Encoding utf8`.
3. **Token first.** Add `dashboardStatCardMinHeight` to the `boxSize` union in the `MantineThemeOther` augmentation
   and `dashboardStatCardMinHeight: '8.25rem', // 132px — Task 843: dashboard top card min height (spec v3.3 §17.2 ADM-01 / §17.3 AGT-01)`
   to `theme.other.boxSize` in the file's ascending order. Quote the definition line in the session log.
4. **Patterns.** Build R1–R3 from Mantine `Card`, `Group`, `Stack`, `Text`, `Title`, `ThemeIcon`, `Badge`, `Skeleton`,
   `Button`, `UnstyledButton`/`Anchor` with `component={Link}` from `next/link`. Mantine responsive style props
   (`p={{ base: 'lg', md: 'xl' }}` for TailAdmin `p-5 md:p-6`) and theme keys only. Read colours as theme colour
   names (`c="gray.5"`), never hex. Each file carries a JSDoc header naming its spec sections and the TailAdmin §6u
   provenance of every visual value, following the neighbouring patterns.
   - **One link target** (R2): when `href` is set, the Card itself renders `component={Link}`. The error state's Retry is
     rendered **outside** the card's link element, so the two controls are never nested.
   - **Accessibility:** a loading card has `aria-busy="true"` and a localized `aria-label`. The value is plain text,
     formatted by the caller (patterns take `value: ReactNode`), so locale formatting stays with `formatCount` in the
     consumer.
5. **Stories (GR-3a `CREATE`, §12 receipt).** One file per pattern, title `Patterns/Mantine/Dashboard<Name>`,
   `parameters: { skipCanvas: true, layout: 'fullscreen' }`, `Default` export showing all states side by side in a
   `SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}`, plus named state exports only where a state needs isolation to be
   reviewable (`Loading`, `Error`, `Zero`). Never a locale- or width-named export. Fixture values are declared as
   fixtures in JSDoc. Strings via `storyT(locale, …)`. `href` values point at the real routes the consumers will use
   (`/admin/listings?status=pending`), documented as fixtures.
6. **Enrol** the three pattern files in `scripts/mantine-migration-scope.json` (file's existing ordering) and export
   them from `patterns/index.ts`.
7. **Baselines.** If `check:pattern-enrolment` or `check:surface-census:changed` reports a row for these new files, the
   fix is enrolment and a Story, never a baseline write. No baseline file is edited by this task.

## 11. Positive and negative flows

**Positive.** A reviewer opens `Patterns/Mantine/DashboardStatCard → Default` and sees a queue card (icon, "On
moderation", `12`, caption "current queue"), a zero card with a positive message, a loading card, and an error card
with Retry. Tabbing focuses the whole ready card once; Enter follows its link.

| Negative flow | Applicable | Expected |
|---|---|---|
| Source failed | Yes | Error state: title/label kept, message, Retry; no `0` rendered anywhere in the card. |
| Loading | Yes | Skeleton geometry, `aria-busy`, no digit. |
| All AGT-01 counts 0 | Yes | `StatRows` shows the caller's single positive empty state instead of three `0` rows. |
| Long label (`uk`, `it`) | Yes | Label wraps to at most 2 lines; value keeps its size; no horizontal overflow at 320. |
| Stale aggregate | Yes | `DashboardCard` shows children plus the warning badge with time text. |
| Keyboard | Yes | One tab stop per link target; visible focus ring (Mantine default focus ring, theme-driven). |
| Reduced motion | Yes | Skeleton animation obeys the existing global reduced-motion rule. |
| Authorization / RLS / data | No | Presentational patterns; data is 847/848. |

## 12. Acceptance criteria

- **AC1 [R1]** — Given `Patterns/Mantine/DashboardCard → Default`, when rendered, then the ready, loading, error and
  stale cards all show their title, the error card shows a Retry button, and the stale card shows its children and a
  warning badge with an icon and text.
- **AC2 [R2]** — Given `Patterns/Mantine/DashboardStatCard`, when the ready card with `href` is inspected in the DOM,
  then exactly one `<a>` wraps the card content, and the error card's Retry `<button>` is not a descendant of any `<a>`.
  Quote the DOM excerpt (browser devtools or the Storybook play function's assertion).
- **AC3 [R3]** — Given `Patterns/Mantine/DashboardStatRows`, when rendered with counts `[3, 0, 1]`, then three row links
  render with their counts; with `[0, 0, 0]` and an `allZeroState`, then only the empty state renders.
  *(Amended by §16.2 F1: add the negative arm — with `[3, 0, 1]` **and** an `allZeroState`, three row links still
  render and the empty-state text does not.)*
- **AC4 [R4]** — Given the three pattern files, when
  `git --no-optional-locks grep -n -E "className=|components/ui/|#[0-9a-fA-F]{3,8}\b|[0-9]+px|rgba?\(" -- src/design-system/mantine/patterns/MantineDashboard*.tsx`
  runs, then it prints nothing; and `npm.cmd run check:design-tokens:strict` and `npm.cmd run check:enrolled-tailwind` exit 0.
  *(Superseded by §16.2 F2: the command above cannot see untracked files, so its empty output was vacuous. The
  binding form is the `--untracked` command in §16.4, which also catches `style={`.)*
- **AC5 [R1-R3, R5]** — Given `npm.cmd run check:story-coverage` and `npm.cmd run check:pattern-enrolment`, when run,
  then both exit 0 and list the three patterns as covered/enrolled; and the census of each pattern file reads
  `manifest:yes story:yes className:0 ui-imports:0`.
- **AC6 [R2, R3]** — Given the ready StatCard and a StatRows row at 320px, when their bounding boxes are read in the
  browser, then each link target's height is at least the resolved `theme.other.touchTarget` (44px at a 16px root).
- **AC7 [R5]** — Given each new Story file, when read, then it imports its pattern by direct path, has no export named
  after a locale or width, and sets no `globals.viewport`.
- **AC8 [R6]** — Given `npm.cmd run check:i18n`, when run, then it exits 0 and the new `dashboard.common` keys exist
  in all four locale files.
- **AC9 [R7]** — Given the owner matrix §13.3, when every tuple is reviewed, then each is recorded accepted, or
  returned with a concrete visual defect.

`GR-4 AC AUDIT — 9 criteria; each states an observable property; absolutes: AC4's empty grep is the definition of "no raw value" scoped to three new files; AC2's "exactly one <a>" is the spec's single-target rule.`

`GR-3a STORY PREFLIGHT — MantineDashboardCard/StatCard/StatRows × all states; canonical candidates: NONE (Patterns/Mantine/EmptyLoadingErrorState renders MantineEmptyLoadingErrorState, not these components; Mantine/Primitives/Card renders the bare primitive); direct-import evidence: NONE; toolbar coverage: locale=Storybook locale toolbar, viewport=Storybook viewport toolbar (see §13.3 caveat, Task 799); decision: CREATE; target: Patterns/Mantine/DashboardCard, …/DashboardStatCard, …/DashboardStatRows; rationale: new production patterns with in-sprint consumers 853/854 and zero existing proof surface.`

`GR-3 STORY PROVEN — MantineDashboardCard ← src/stories/patterns/mantine/DashboardCard.stories.tsx; MantineDashboardStatCard ← …/DashboardStatCard.stories.tsx; MantineDashboardStatRows ← …/DashboardStatRows.stories.tsx` (after execution).

## 13. QA profile and verification plan

**`Q3`** — new canonical Mantine patterns (qa-profiles: "new Mantine primitive"). No critical flow touched.

### 13.1 Re-entry

`from-scratch`. Evidence root `docs/sessions/evidence/task843/`, transcripts numbered `00-`…, each ending with
`EXIT_CODE=`, written through Node or `-Encoding utf8` (no BOM).

### 13.2 Final gate block

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p "process.platform + ' ' + process.version"
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:i18n
npm.cmd run check:stories
npm.cmd run check:story-coverage
npm.cmd run check:pattern-enrolment
npm.cmd run check:design-tokens:strict
npm.cmd run check:enrolled-tailwind
npm.cmd run check:rendered-scope
node.exe scripts\check-surface-census-changed.mjs --base HEAD
node.exe scripts\check-surface-census.mjs --surface src\design-system\mantine\patterns\MantineDashboardCard.tsx
node.exe scripts\check-surface-census.mjs --surface src\design-system\mantine\patterns\MantineDashboardStatCard.tsx
node.exe scripts\check-surface-census.mjs --surface src\design-system\mantine\patterns\MantineDashboardStatRows.tsx
npm.cmd run build-storybook
npm.cmd run check:locale-leak:mantine-only
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks grep -n -E "className=|components/ui/|#[0-9a-fA-F]{3,8}\b|[0-9]+px|rgba?\(" -- src/design-system/mantine/patterns/MantineDashboard*.tsx
git --no-optional-locks diff --stat
git --no-optional-locks hash-object src/design-system/mantine/theme.ts src/design-system/mantine/patterns/index.ts scripts/mantine-migration-scope.json src/design-system/mantine/patterns/MantineDashboardCard.tsx src/design-system/mantine/patterns/MantineDashboardStatCard.tsx src/design-system/mantine/patterns/MantineDashboardStatRows.tsx
```

Expected: every `npm`/`node` command exits 0 except `check:locale-leak:mantine-only`, which is known red (Task 836).
For it, the requirement is **zero leak lines whose story ID starts with `patterns-mantine-dashboard`**; quote the grep
of the transcript. The `git grep` prints nothing and exits 1. Run `check:locale-leak` after `build-storybook`, never
concurrently.

### 13.3 Owner visual review — `OWNER VISUAL QA REQUIRED`

Until Task 799 lands, open each story as `http://localhost:6006/iframe.html?id=<story-id>&globals=locale:<locale>`
and resize the browser window (or DevTools device mode) to the width.

| # | Story | State | Width | Locale | Owner checks |
|---|---|---|---|---|---|
| 1 | `Patterns/Mantine/DashboardStatCard` | Default (all states) | 1440 | en | TailAdmin §6u look: grey 48px icon badge, 14px grey label, 30px bold value, flat bordered 16px-radius card, no shadow at rest |
| 2 | same | Default | 1024 | sq | 4-up grid readable; zero card reads as positive with icon + text |
| 3 | same | Default | 768 | it | 2-up; long Italian labels wrap to ≤ 2 lines |
| 4 | same | Default | 390 | uk | 1-up full width; error Retry separate from the card link |
| 5 | same | Default | 320 | uk | no horizontal overflow; value not shrunk |
| 6 | `Patterns/Mantine/DashboardStatRows` | Default | 1440 / 390 | en / uk | three rows with counts + chevrons; all-zero empty state; tone badges carry text |
| 7 | `Patterns/Mantine/DashboardCard` | Default | 1280 / 480 | en / uk | title + scope label; loading skeleton without digits; error + Retry; stale warning badge |

### 13.4 Evidence the executor hands over

§13.2 transcripts · I0 transcripts · AC2/AC6 DOM and bounding-box readings with the browser, width and story used ·
the §13.3 matrix handed to the owner.

## 14. Completion report contract

Files with before/after hashes · R1–R7 · AC1–AC9 with quotes · every command with exit code and transcript path ·
I0 re-measure results · GR-1 / GR-3 / GR-3a receipts · assumptions · deviations · limitations · the §13.3 matrix.
Status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. No self-approval, no
mutating git, no `git push`. Sonnet updates the 843 line in `docs/backlog.md` and writes the session log with a
Files Changed table.

## 15. Task quality gate

| Question | Answer |
|---|---|
| Duplicate component or Story? | §3.1: no dashboard card exists; `MantineEmptyLoadingErrorState` is deliberately not stretched into a compact card (its loader and 200px min height contradict spec §17.4); it is reused for the chart-area empty state in 845. |
| Probe markup? | No. Each Story documents a production pattern with in-sprint consumers (853, 854). |
| GR-1 / 16d | §3.4 receipt; no existing surface changes. |
| GR-2 | `check:story-coverage` sees only enrolled files; AC5's per-file census rows close R5, not the gate alone. |
| Hardcode rule | R4 + AC4; the one new value is a spec-sourced `theme.other.boxSize` role (D78-5 leaves it to the spec because TailAdmin has no card height). |
| Owner rule "no legacy tests" | No test added that inspects legacy code. |
| Every command in a block | §13.2. |

## 16. Revision 1 — review 1 returned `NEEDS REVISION` (2026-09-18)

### 16.1 Re-entry

`remediation`. Keep every file in the §7 scope and every transcript `00`–`27`; they become the superseded
first-pass record. Start at §16.2. New transcripts are numbered `30-` and up in the same evidence root, written
through Node or `-Encoding utf8` (no BOM), each ending with `EXIT_CODE=`. Do not rerun or overwrite `00`–`27`.
The theme token, manifest entries, barrel exports and `messages/*.json` keys were verified and stay as they are.
The only exception is F1's type change, which is re-exported through the existing barrel lines.

**GR-0 was added mid-session (`063e2075d`) and binds every write in this revision.** Before the first edit,
emit the `GR-0 CANONICAL REUSE PREFLIGHT` receipt for the error-state composition (F3) in the session log.

### 16.2 Findings to correct

| ID | Sev | Req / AC | Where | Defect | Required correction |
|---|---|---|---|---|---|
| **F1** | P2 | R3, AC3 | `MantineDashboardStatRows.tsx:10-15, 98-107`; `DashboardStatRows.stories.tsx` 2nd instance | `allZeroState` replaces the rows **whenever it is passed**, whatever the counts are. `count: ReactNode` makes R3's rule ("only when **every** count is 0 **and** the caller passes it") impossible to evaluate. A consumer that always passes the empty state (the natural AGT-01 call in 854) hides real non-zero action counts. The Story proves the all-zero arm with `rows={[]}`, not AC3's `[0, 0, 0]`. The session log restates R3 in narrowed form and does not list it as a deviation. | Change `DashboardStatRow` to `{ label: string; count: number; displayCount?: ReactNode; href: string; tone? }`. Render `displayCount ?? count`, so locale formatting stays with the caller. Render `allZeroState` only when `allZeroState && rows.every((r) => r.count === 0)`. Otherwise render the rows. Update the JSDoc. In the Story, the all-zero instance passes three rows with counts `[0, 0, 0]`. Add the smoke test in §16.3. |
| **F2** | P2 | R4, AC4, GR-0 | `MantineDashboardStatCard.tsx:175`, `MantineDashboardStatRows.tsx:117` | Two new inline `style={{ display: 'block' }}` objects. GR-0 forbids new `style` objects. AC4 missed them for two reasons: its regex has no `style=` arm, and it used plain `git grep`, which **cannot see untracked files**. With the same pathspec, `git grep "export function"` also returns nothing. So transcripts `11` and `27` prove nothing. | Replace both with the Mantine style prop `display="block"`. Run the §16.4 `--untracked` form. |
| **F3** | P2 | R1–R3, GR-0 (COMPOSE) | the `error` branch of all three patterns | The same error block (`Text size="sm" c="red"` + `Button variant="default"`) is cloned three times. Its colour is cited to a **form-field validation** line (`MantineFormSectionStack.tsx:135`), which has a different semantic role. The canonical error state already exists: `MantineEmptyLoadingErrorState` `state="error"` (`Alert color="red" variant="light"`, `description`, caller-built `action`, no min-height). §3.1 wrongly excluded the whole pattern; this is corrected there. | In each pattern's `error` branch, keep the title (Card) or icon+label (StatCard) outside, and render `<MantineEmptyLoadingErrorState state="error" description={errorMessage} action={retryLabel ? <Button variant="default" onClick={onRetry}>{retryLabel}</Button> : undefined} />` in place of the cloned `Text` + `Button`. Delete the three `MantineFormSectionStack` comments. Do not change `MantineEmptyLoadingErrorState`. StatCard's Retry must still sit outside any `<a>`. |
| **F4** | P2 | AC2, AC6 | session log "Deviations" 2 | AC2 asks for the DOM excerpt to be quoted, and AC6 for bounding boxes read at 320px. The play functions exist, but no run result was retained. The session log quotes the assertion code, not an observed result. | See §16.3 items 2–3. |
| **F5** | P2 | AC9 | `evidence/task843/18-owner-review-matrix.md` | The file says `Owner verdict: Pending`. It was written at 16:19, before the final fixes at 16:30–16:31. The session log's "Owner verdict: accepted" has no date, no verbatim quote and no per-tuple result. F3 also changes the error-state visuals. | After F1–F3 land, the owner reviews tuples 1–7 again. Record each tuple's verdict in `18-owner-review-matrix.md` with the owner's verbatim words and the date. |
| F6 | P3 | R3 | `MantineDashboardStatRows.tsx:64` | `rows.length ?? 3` has a dead fallback, because `length` is never nullish. | `loadingRowCount ?? rows.length`. |

### 16.3 New evidence required

1. **Smoke test, new file** `src/design-system/mantine/patterns/__tests__/MantineDashboardStatRows.smoke.test.tsx`.
   It follows the `MantineCountButton.smoke.test.tsx` convention: jsdom, `MantineProvider theme={theme}`, and a
   JSDoc naming the planted violation. Cases:
   (a) `[3, 0, 1]` + `allZeroState` gives 3 links and no empty-state text;
   (b) `[0, 0, 0]` + `allZeroState` gives the empty-state text and 0 links;
   (c) `[0, 0, 0]` with no `allZeroState` gives 3 links;
   (d) `displayCount` is rendered in place of `count`.
   **Planted-violation arm:** temporarily revert the render condition to `if (allZeroState)` and confirm that case (a)
   fails. Then restore it, keeping a `git hash-object` witness before the plant and after the restore that shows the
   same hash. Use Node or editor I/O only.
2. **StatCard structure smoke test**, new file
   `src/design-system/mantine/patterns/__tests__/MantineDashboardStatCard.smoke.test.tsx`. Cases:
   `state="ready"` with `href` renders exactly one `a` containing the label and value, with no nested `a`;
   `state="error"` with `onRetry` renders a `button` whose `closest('a')` is `null`, and clicking it calls `onRetry`
   once; `state="error"` renders no `0`/value text. The planted arm passes `href` through to the error branch's
   Card and confirms the `closest('a')` case fails. Restore it with a hash witness.
3. **AC6 rendered reading.** Write a Playwright (Chromium) script at
   `docs/sessions/evidence/task843/30-ac6-probe.mjs`. It runs against the running Storybook at viewport 320×800,
   opens `iframe.html?id=patterns-mantine-dashboardstatcard--default&globals=locale:uk` and
   `…patterns-mantine-dashboardstatrows--default&globals=locale:uk`, and waits for `networkidle`. It writes
   `30-ac6-probe.json` with: each `a` element's `getBoundingClientRect().height`,
   `document.documentElement.scrollWidth <= 320`, the resolved `touchTarget` in px, and for every `button`,
   `closest('a') === null`. The script exits non-zero if any link is shorter than `touchTarget`, if the page
   overflows, or if any button is inside a link.

### 16.4 Final gate block (replaces §13.2 for this revision)

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p "process.platform + ' ' + process.version"
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:i18n
npm.cmd run check:stories
npm.cmd run check:story-coverage
npm.cmd run check:pattern-enrolment
npm.cmd run check:design-tokens:strict
npm.cmd run check:enrolled-tailwind
npm.cmd run check:rendered-scope
node.exe scripts\check-surface-census.mjs --surface src\design-system\mantine\patterns\MantineDashboardCard.tsx
node.exe scripts\check-surface-census.mjs --surface src\design-system\mantine\patterns\MantineDashboardStatCard.tsx
node.exe scripts\check-surface-census.mjs --surface src\design-system\mantine\patterns\MantineDashboardStatRows.tsx
npx.cmd vitest run src/design-system/mantine/patterns/__tests__/MantineDashboardStatRows.smoke.test.tsx src/design-system/mantine/patterns/__tests__/MantineDashboardStatCard.smoke.test.tsx
npm.cmd run build-storybook
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks grep --untracked -n -E "className=|components/ui/|style=\{|#[0-9a-fA-F]{3,8}\b|[0-9]+px|rgba?\(" -- src/design-system/mantine/patterns/MantineDashboard*.tsx
git --no-optional-locks diff --stat
git --no-optional-locks hash-object src/design-system/mantine/patterns/MantineDashboardCard.tsx src/design-system/mantine/patterns/MantineDashboardStatCard.tsx src/design-system/mantine/patterns/MantineDashboardStatRows.tsx src/stories/patterns/mantine/DashboardStatRows.stories.tsx src/design-system/mantine/patterns/__tests__/MantineDashboardStatRows.smoke.test.tsx src/design-system/mantine/patterns/__tests__/MantineDashboardStatCard.smoke.test.tsx
```

Expected: every `npm`/`npx`/`node` command exits 0. `check:locale-leak:mantine-only` is not run: the owner waived it
for this task on 2026-09-18, quoted verbatim in `13-check-locale-leak.txt`. The `--untracked` grep may print
**only** comment lines (JSDoc ` * …` or `{/* … */}` provenance text such as "132px" or "(44px)"). Quote every line
it prints and classify each as `comment` or `code`. Any `code` line is a failure. Then run §16.3 item 3 against a
running `npm.cmd run storybook`.

### 16.5 Acceptance for this revision

- **AC3r [R3, F1]** — both smoke-test files exit 0; the planted arm in §16.3 item 1 failed case (a) and the restore
  hash equals the pre-plant hash.
- **AC4r [R4, F2]** — the §16.4 `--untracked` grep prints no `code` line; `check:design-tokens:strict` and
  `check:enrolled-tailwind` exit 0.
- **AC10 [R1–R3, F3]** — each pattern's `error` branch renders `MantineEmptyLoadingErrorState state="error"`;
  `grep -n "c=\"red\""` over the three pattern files prints nothing; the census of each pattern still reads
  `manifest:yes story:yes className:0 ui-imports:0` and lists `MantineEmptyLoadingErrorState` as an enrolled,
  storied node.
- **AC2r / AC6r [R2, R3, F4]** — `30-ac6-probe.json` exists, the script exit code is 0, and the StatCard smoke test
  proves the single-`a` / Retry-outside-link structure.
- **AC9r [R7, F5]** — `18-owner-review-matrix.md` records every tuple 1–7 as accepted, or returned with a concrete
  defect, with the owner's verbatim words and the date.

`GR-4 AC AUDIT — 5 revision criteria; each states an observable property; absolutes: AC10's empty grep is scoped to three files and one literal that F3 removes by construction.`

### 16.6 Completion

Update the session log: add a "Revision 1" section with its own Files Changed rows (the two new test files, the
probe script and its JSON, the edited patterns and Story), R3 restated as amended, the GR-0 receipt, and
transcripts `30+`. Mark `00`–`27` superseded where a new transcript replaces them. Set the 843 state to
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` in `docs/backlog.md` and the sprint Tasks table. No mutating git.

## 17. Revision 2 — review 2 returned `NEEDS REVISION`, evidence only (2026-09-18)

### 17.1 What review 2 verified

F1, F2, F3 and F6 hold in the code. `allZeroState && rows.every((row) => row.count === 0)` is at
`MantineDashboardStatRows.tsx:99`. `display="block"` replaces both `style` objects. All three error branches import
and render `MantineEmptyLoadingErrorState`, and there is no `c="red"` in the three files. F4 holds too:
`30-ac6-probe.json` records StatCard links at 198/202px and StatRows links at 44px, `scrollWidth` 320, and every
`closest('a')` null. The reviewer re-ran the smoke tests natively: 7/7 pass. **Do not change any 843 source file.**

### 17.2 What is still missing

| ID | Sev | Req / AC | Defect | Required correction |
|---|---|---|---|---|
| **H1** | P2 | §16.4, AC4r, AC10 | The session log's §16.4 table gives exit codes but no transcript paths. The evidence root holds only `30`–`33`, which are the planted pairs, the probe, `build-storybook` and `build`. The runs of typecheck, lint, i18n, stories, coverage, enrolment, design-tokens, enrolled-tailwind, rendered-scope, the three censuses, vitest, file-integrity and mojibake, the `--untracked` grep with its comment/code classification, and the hash-object output are not retained. | Do not run §16.4 separately. Its single successor is the joint block in the **844 kickoff §16.3**, which covers all five patterns and is run once after 844 Revision 1 lands, because 843 and 844 share `messages/*.json`, `patterns/index.ts` and the manifest. Retain each command as its own transcript under `task843/40-…` onward, ending `EXIT_CODE=`. |
| **H2** | P2 | AC9r | Tuples 1–7 have not been re-reviewed since F3 changed the error visuals. | Owner review. Record it verbatim, with the date, per tuple in `18-owner-review-matrix.md`. |
| H3 | P3 | session log | The old section "Owner visual review — completed directly by the owner … **Owner verdict: accepted**" and the first-pass "Opus handoff" still stand unqualified below the Revision 1 section, and they contradict `18-…md`. | Mark both sections "superseded by Revision 1 / F5". |

### 17.3 Closure

843 closes together with 844 in one review, because their shared files cannot be staged separately. After H1–H3,
set 843 to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. No mutating git.
