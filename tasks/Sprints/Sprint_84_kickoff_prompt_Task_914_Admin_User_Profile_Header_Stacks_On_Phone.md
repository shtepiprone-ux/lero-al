# Task 914 — `/admin/users/new` and `/admin/users/[id]`: the profile header's avatar and title stack into rows on a phone

Sprint 84 · **P2** · QA profile **Q3** · no task dependency · owner action **O84-9** · **Status: `KICKOFF FILED` 2026-10-01**

Sprint plan: [`Sprint_84_One_Clock_And_One_Date_Order.md`](Sprint_84_One_Clock_And_One_Date_Order.md). Filed from the
owner's post-deploy return on Task 893's surface (O84-2/O84-4 live read, 2026-10-01). The owner's screenshot shows
`/admin/users/new` at 320. Owner, verbatim: *"Сторінка "Новий користувач" взагалі не адаптована, купа хаосу, немає
структурованості"*, then the rule: *"мобільна адаптація має переноситись на рядки, а не хардкодно триматись ліворуч чи
праворуч від попередньої секції"*. That rule is now in `docs/golden-rules.md` GR-3b ("Sections stack into rows on a
phone") and `docs/mantine-responsive-design-system.md` §7.

Executor: run this file through `execute-task`. Strongest status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. No Git.

## 1. Mode and task type

`IMPLEMENTATION`, responsive layout fix in one migrated View + its canonical Story. Bundles: **UI / Layout / Component
(current Mantine path)**, **Storybook / Visual Proof**. Current/legacy boundary: everything in scope is already Mantine
(census §3.1); no legacy file is touched.

## 2. Objective

Below `sm` (640px) the header card of `AdminUserProfileView` puts the avatar block in one row and the title block in
the next, at full width. From `sm` up it keeps today's side-by-side layout. Both routes use the View, so both are fixed.

## 3. Verified context — measured 2026-10-01 (re-measure at I0)

### 3.1 GR-1 census

`node.exe scripts\check-surface-census.mjs --surface src\app\admin\users\new\page.tsx` and the same for
`src\app\admin\users\[id]\page.tsx`: 18 nodes each, identical below the root. Every node is `manifest:yes story:yes`
with 0 `ui-imports`, except these:
- the roots;
- the 893 container-exempt pair `AdminUserProfile.tsx` and `AdminUserAvatarField.tsx` (0 `className`; their Views are
  enrolled and storied).

The changed node is `src/components/admin/AdminUserProfileView.tsx` (`manifest:yes story:yes className:0`). No node is
unmigrated.

### 3.2 The defect (FACT)

`src/components/admin/AdminUserProfileView.tsx:491-533`, the header card:

```tsx
<Paper withBorder radius="2xl" p={{ base: 'lg', sm: 'xl' }}>
  <Group align="flex-start" wrap="nowrap" gap="lg">
    {avatar}
    <Stack gap="xs" miw={0} flex={1}> … title / subtitle (create) or name, badges, email, #id (view) … </Stack>
  </Group>
</Paper>
```

`{avatar}` is `AdminUserAvatarFieldView`, whose root is `Stack align="center" gap="xs" w="min-content"`
(`AdminUserAvatarFieldView.tsx:61`). Its width is set by its longest word: 126px in `uk` and 95px in `sq` in the Create
state, 84px when it has no edit controls.

Reviewer measurement, Chromium on `storybook-static`, Story `Patterns/Mantine/AdminUserProfileView`. The header row
there is 246px wide at 320.

| Story | Locale | 320: avatar / text column | Title lines at 320 | 390: text column |
|---|---|---|---|---|
| `Create` | `uk` | 126 / 100 | 2 | 170 |
| `Create` | `sq` | 95 / 131 | 1 | 201 |
| `View`, `ViewAgent` | `uk`, `sq` | 84 / 142 | 1 | 212 |

In production the row is narrower. The page `Box` is `p={{ base: 'xl', lg: '2xl' }}`
(`src/app/admin/users/new/page.tsx:36`) and the card padding is `lg`. In the owner's 320 screenshot the text column is
about 80px wide: "Новий / користувач" and the subtitle read one word per line.

### 3.3 Canonical precedent (FACT)

`src/design-system/mantine/patterns/MantineDashboardHeader.tsx:55-60` uses this layout:
`Flex direction={{ base: 'column', sm: 'row' }} align={{ base: 'stretch', sm: 'flex-start' }} gap="md"`. Below `sm`,
the title block and the action column stack and each takes the full width. A child with an explicit width does not
stretch: `AdminUserAvatarFieldView` keeps `w="min-content"` and sits at the start.

### 3.4 Story and tests (FACT)

- `src/stories/patterns/mantine/AdminUserProfileView.stories.tsx`, title `Patterns/Mantine/AdminUserProfileView`.
  Exports: `View`, `ViewBlocked`, `ViewAgent`, `ViewLocationRequest`, `ViewNoHistoryControls`, `Edit`, `EditBlocked`,
  `EditErrors`, `Create`, `Saving`. Every export renders inside `StoryPageGutter` (`:112`).
- `src/components/admin/__tests__/AdminUserProfile.smoke.test.tsx` — critical flow "Admin user detail loads"
  (`docs/critical-flow-registry.md:46`).

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | owner 2026-10-01; GR-3b | `AdminUserProfileView.tsx:492`: `Group align="flex-start" wrap="nowrap" gap="lg"` → `Flex direction={{ base: 'column', sm: 'row' }} align={{ base: 'stretch', sm: 'flex-start' }} gap="lg"` (precedent §3.3). The text `Stack` keeps `gap="xs" miw={0} flex={1}`. Nothing else in the card changes: no new `className`, `style` or raw value. Add `Flex` to the `@mantine/core` import if needed (it is already imported, `:13`). | P1 | AC1, AC2 | Confirmed |
| **R2** | GR-3b, GR-3d | The Story file is unchanged; its exports already render every header state (`Create`, `View`, `ViewAgent`). The executor re-measures them (§13.2). If a needed state is missing, stop: `BLOCKED — R2 STATE`. Do not add an export. | P1 | AC2 | Confirmed |
| **R3** | 893 critical flow | `AdminUserProfile.smoke.test.tsx` and `RangeDatePickerLocalization.test.tsx` pass unchanged. | P1 | AC3 | Confirmed |

## 5. Assumptions and open questions

1. Visual change, for O84-9. Below 640 the avatar block sits at the start (left) of the card. Its upload button and
   hints stay under it. The title, subtitle, badges, email and `#id` follow in the next row at full width. The start
   alignment follows the canonical `MantineDashboardHeader` stacking. Centring is the owner's call at O84-9; changing it
   is a revision, not an executor choice.
2. Open owner questions: none.

## 6. Pre-read rule bundle

- `docs/golden-rules.md` (GR-0 … GR-6; GR-3b now includes "Sections stack into rows on a phone").
- `docs/agent-contract.md` 1, 3–7, 9–16d.
- `docs/rule-index.md` → the §1 bundles.
- `docs/mantine-responsive-design-system.md` §7.
- `docs/qa-profiles.md` Q3.
- `src/design-system/mantine/patterns/MantineDashboardHeader.tsx` in full.

## 7. Scope — the exact allowed write set

1. `src/components/admin/AdminUserProfileView.tsx` — the header card's layout element only (§3.2 lines)
2. `docs/sessions/2026-10-01-task914-admin-user-profile-header-stacks.md` (or the actual date), `docs/sessions/evidence/task914/*`
3. `docs/backlog.md` — the 914 cell only

## 8. Out of scope

- `AdminUserAvatarFieldView`'s own layout and its Story.
- The page wrappers and every other section of the View.
- The 24-hour clock (885).

These sections already stack below `sm`: `FieldRow` is `Grid.Col span={{ base: 12, sm: 3 }}` / `{ base: 12, sm: 9 }`
(`:143-151`), and the main/side columns are `span={{ base: 12, lg: 8 }}`. If I0 finds another section held beside a
sibling below 640 in this View, report it in the session log as `FOUND — <path:line>` and stop with `BLOCKED — R1
SCOPE`. Do not widen the write set yourself.

## 9. Current and required behavior

| Area | Current | Required after |
|---|---|---|
| Header card < 640 | avatar block beside the text; text column 80–142px | avatar block in row 1, text block full width in row 2 |
| Header card ≥ 640 | avatar beside the text, top-aligned | unchanged |
| Title, subtitle, badges, email, `#id`, avatar controls | as today | unchanged (same elements, sizes, order) |
| Every other section, data, handlers | as today | unchanged |

## 10. Implementation requirements

### 10.1 I0

1. `node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()"` → `win32`.
2. `git --no-optional-locks status --porcelain` → `docs/sessions/evidence/task914/01-status-before.txt`, with the hash
   of every modified path. If `AdminUserProfileView.tsx` is already modified → `BLOCKED — SHARED PATH`.
3. Run both censuses (§3.1) → `02-census-before.txt`. Any node beyond §3.1 → session log. An unmigrated node →
   `BLOCKED — CLAUSE 16d`.
4. Measure §3.2 on the current `storybook-static` (build it first if it is stale) → `03-header-before.json`.
5. `npx.cmd vitest run src/components/admin/__tests__/AdminUserProfile.smoke.test.tsx src/design-system/mantine/patterns/__tests__/RangeDatePickerLocalization.test.tsx`
   → `04-tests-before.txt` (exit 0).
6. Emit GR-0 and GR-3a receipts (§15.1).

### 10.2 Order

I0 → R1 → build-storybook → measurements → plant → gates → receipts.

### 10.3 Plant (Node I/O; hash before and after)

| Plant | Edit | Must fail |
|---|---|---|
| **P1** | after R1, set the header `Flex`'s `direction` back to the static `"row"` | the §13.2 stacking check at 320 for `Create` `uk` (`stacked: false`), recorded in `05-plant.txt`; then restore and show the hash matches |

## 11. Positive and negative flows

**Positive flow.** An admin opens `/admin/users/new` on a phone. The avatar and its upload button are on top, and the
title and subtitle read on full-width lines below. The admin fills in the form and creates the user. On
`/admin/users/<id>`, the name, badges and email read on full-width lines under the avatar.

| Branch | Applicable? | Expected | Evidence |
|---|---:|---|---|
| Create (`user=null`) | Yes | stacked < 640 | `Create` Story |
| View with a long name/email | Yes | name wraps, email truncates at the card edge | `View`, `ViewAgent` Stories |
| ≥ 640 | Yes | side by side, as today | 1024/1440 measurements |
| Avatar upload/remove | No — `AdminUserAvatarField` is unchanged | — | smoke test |

## 12. Acceptance criteria

- **AC1 [R1]** Given `AdminUserProfileView.tsx`, then the header card's layout element is `Flex` with `direction={{
  base: 'column', sm: 'row' }}`, and the diff touches no other element. The `className` count stays 0.
- **AC2 [R1, R2]** Given `Patterns/Mantine/AdminUserProfileView` `Create`, `View` and `ViewAgent` in `uk` and `sq`:
  - at 320 and 390, the text block's top is at or below the avatar block's bottom, the text block is as wide as the
    header row (±1px), and the title fits on one line;
  - at 1024 and 1440, the two blocks share a row, as before;
  - nothing overflows at any width.
- **AC3 [R3]** Given the two tests, then both exit 0 with their test count unchanged from `04-tests-before.txt`.
- **AC4 [all]**
  - Exit 0: `typecheck`, `lint`, `check:story-coverage`, `check:rendered-scope`, `check:surface-census:changed`
    (`--base HEAD`, as 858/896 recorded), `check:design-tokens`, `check:type-responsive`, `check:file-integrity`,
    `check:mojibake`, `build-storybook` and `npm.cmd run build`.
  - P1 fails as §10.3 states and is restored with a matching hash.

`GR-4 AC AUDIT — 4 criteria; each states an observable property; absolutes: none (AC1's "no other element" is read from the diff, which a correct implementation satisfies).`

### 12.1 Type-scale table (GR-3c) — unchanged by this task

| Element | Role | base | sm | md | lg | Theme key | Provenance |
|---|---|---|---|---|---|---|---|
| title / name | page title | 20px | 20px | 20px | 20px | `fz="xl"` | `AdminUserProfileView.tsx:497,506` |
| subtitle, email | body | 14px | 14px | 14px | 14px | `size="sm"` | `:500,522` |
| `#id` | meta | 12px | 12px | 12px | 12px | `size="xs"` | `:526` |

### 12.2 Width (GR-3b) and gutter (GR-3d)

The production parent is the page `Box` (`new/page.tsx:36`, `maw={layout.adminPageFormMaxWidth}`), which caps the width
and is otherwise fluid. The Story is fluid. GR-3d for `Patterns/Mantine/AdminUserProfileView`: own gutter on no side;
**profile present** (`StoryPageGutter`, Story `:112`).

## 13. QA profile and verification plan

**Q3.** This is a visible layout change on a critical-flow surface. Behaviour does not change, and the smoke test stays.

### 13.1 Final gate block (executor)

```powershell
$ev = "docs\sessions\evidence\task914"
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\09-platform.txt"
npx.cmd vitest run src/components/admin/__tests__/AdminUserProfile.smoke.test.tsx src/design-system/mantine/patterns/__tests__/RangeDatePickerLocalization.test.tsx *>&1 | Tee-Object "$ev\10-tests.txt"
npm.cmd run typecheck *>&1 | Tee-Object "$ev\12-typecheck.txt"
npm.cmd run lint *>&1 | Tee-Object "$ev\13-lint.txt"
npm.cmd run check:story-coverage *>&1 | Tee-Object "$ev\14-story-coverage.txt"
npm.cmd run check:rendered-scope *>&1 | Tee-Object "$ev\15-rendered-scope.txt"
npm.cmd run check:surface-census:changed -- --base HEAD *>&1 | Tee-Object "$ev\16-census-changed.txt"
npm.cmd run check:design-tokens *>&1 | Tee-Object "$ev\17-design-tokens.txt"
npm.cmd run check:type-responsive *>&1 | Tee-Object "$ev\17b-type-responsive.txt"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\18-file-integrity.txt"
npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\18b-mojibake.txt"
npm.cmd run build-storybook *>&1 | Tee-Object "$ev\19-storybook-build.txt"
npm.cmd run build *>&1 | Tee-Object "$ev\19b-build.txt"
git --no-optional-locks status --porcelain | Tee-Object "$ev\21-status-after.txt"
```

Record each exit code. Normalise the `Tee-Object` files to UTF-8 without BOM through Node. Put the hash of every changed
file in `22-hash-object.txt`. Expected: `win32` and every exit 0.

### 13.2 Measurement and receipts (executor)

On the final `storybook-static`, measure `Create`, `View` and `ViewAgent` × `uk`, `sq` × 320/390/1024/1440 →
`23-header-after.json`. The avatar block is `[data-testid="admin-user-avatar"]`; the text block is its next sibling. For
each cell, record:
- the row width, avatar width and text width;
- `stacked`: the text block's top ≥ the avatar block's bottom − 1;
- the title's line count;
- document overflow.

Receipts per Story:
- GR-3b, now including `side-by-side sections below 640: NONE`;
- GR-3d, four sides, 24/16/24/16 at 320/390 and 24/32/24/32 at 1024/1440;
- GR-3c (unchanged sizes, measured at 320 and 1440).

### 13.3 `OWNER VISUAL QA REQUIRED` — O84-9

| Story | States | Locales | Viewports | Tuples |
|---|---|---|---|---|
| `Patterns/Mantine/AdminUserProfileView` | `Create`, `View`, `ViewAgent` | `sq`, `uk` | 320, 390, 1440 | 18 |

After the deploy, open `/admin/users/new` and one `/admin/users/<id>` at 320 and at desktop width.

## 14. Completion report contract

Status per `execute-task`. The report contains:
- the files with hashes;
- R1–R3 and AC1–AC4 with their evidence;
- each exit code;
- the census before and after;
- the before/after header measurements;
- the receipts: GR-0, GR-1, GR-3 (`AdminUserProfileView` ← its Story), GR-3a, GR-3b, GR-3c and GR-3d;
- P1 with its hash pair;
- limitations, and that O84-9 is owed.

Update the 914 cell of `docs/backlog.md` and write the session log. No Git.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable without chat context | yes |
| Every requirement has an AC | R1→AC1/AC2 · R2→AC2 · R3→AC3 · all→AC4 |
| Two-armed control | P1 (static row → stacking check fails at 320) |
| Owner rule respected | GR-3b "Sections stack into rows on a phone" (2026-10-01) |
| Owner exception claimed | none |

### 15.1 Canonical UI decision record

| Visible artifact | Searches / inspected | Canonical source | Disposition | Registration |
|---|---|---|---|---|
| Header card layout | `direction={{ base: 'column', sm: 'row' }}` across `src` (10 files); `MantineDashboardHeader`, `MantinePageHeaderWithActions`, `MantineFormSectionStack` | `MantineDashboardHeader.tsx:55-60` stacking (Mantine `Flex` responsive props) | **reuse** (same native mechanism) | none (View already enrolled + storied) |
| Avatar block | `AdminUserAvatarFieldView` (`Patterns/Mantine/AdminUserAvatarFieldView`) | itself | **reuse** unchanged | — |

`GR-0 CANONICAL REUSE PREFLIGHT — request: AdminUserProfileView header card stacking below 640; semantic queries: header media + text stack on mobile, responsive Flex direction, profile header; inspected candidates: MantineDashboardHeader (Patterns/Mantine/MantineDashboardHeader), MantinePageHeaderWithActions, MantineFormSectionStack, AdminUserAvatarFieldView (Patterns/Mantine/AdminUserAvatarFieldView); decision: REUSE (MantineDashboardHeader's responsive Flex mechanism); selected canonical owner: src/design-system/mantine/patterns/MantineDashboardHeader.tsx; Mantine/TailAdmin token path: Flex direction/align responsive props, gap lg; new hardcoded visual values: NONE; rationale: one layout element changes to the native responsive mechanism the canonical header already uses.`

`GR-3a STORY PREFLIGHT — AdminUserProfileView × Create/View/ViewAgent (header < 640); canonical candidates: patterns-mantine-adminuserprofileview; direct-import evidence: src/stories/patterns/mantine/AdminUserProfileView.stories.tsx (imports AdminUserProfileView); toolbar coverage: locale=toolbar, viewport=toolbar; decision: REUSE; target: patterns-mantine-adminuserprofileview; rationale: existing exports already render every header state.`

`GR-1 CENSUS COMPLETE — 18 nodes per route; tier1 13 migrated+enrolled+story + 2 container-exempt (AdminUserProfile, AdminUserAvatarField) + root page.tsx; tier2 0; tier3 0 — filed as none.`

## Appendix A — Evidence preflight

| Claim | Source | Status |
|---|---|---|
| Header `Group wrap="nowrap"` | `AdminUserProfileView.tsx:492` | VERIFIED |
| Avatar block `w="min-content"` | `AdminUserAvatarFieldView.tsx:61` | VERIFIED |
| Text column 100px (`uk` Create, 320, Story) | reviewer measurement 2026-10-01 | VERIFIED |
| Stacking precedent | `MantineDashboardHeader.tsx:55-60` | VERIFIED |
| Census: no unmigrated node | both censuses 2026-10-01 | VERIFIED |
| `Flex` already imported | `AdminUserProfileView.tsx:13` | VERIFIED |

## Appendix B — Rule-compliance ledger

| Rule | Outcome | Result |
|---|---|---|
| 16d / GR-1 | every node dispositioned | COMPLIANT |
| GR-0 | reuse | COMPLIANT |
| GR-3a | reuse existing Story | COMPLIANT |
| GR-3b (incl. 2026-10-01 stacking rule) / 3c / 3d | §12, §13.2 | COMPLIANT |

## Appendix C — Execution contract

| # | Checkpoint | Failure |
|---|---|---|
| 0 | I0 | `BLOCKED` |
| 1 | R1 scope holds | `BLOCKED — R1 SCOPE` |
| 2 | P1 fails, restored | a passing plant → measurement defect |
| 3 | Gates | non-zero → `PARTIALLY IMPLEMENTED` |
| 4 | O84-9 | returned → revision |
