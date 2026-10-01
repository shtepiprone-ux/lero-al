# Task 896 — `/admin/users` list page on canonical Mantine; `AdminUsersTable` gets a canonical Story and a manifest entry

Sprint 84 · **P3** · QA profile **Q3** · no task dependency (877's `AdminPageHeader` adapter has landed) · blocks
**885** · owner action **O84-4** · **Status: ✅ `APPROVED WITH NOTES` 2026-10-01, review 2 (§17); archived**

Sprint plan: [`Sprint_84_One_Clock_And_One_Date_Order.md`](Sprint_84_One_Clock_And_One_Date_Order.md). Reserved
2026-09-27 by 885's design under **D84-1**; the reserved row moves into Appendix D. Precedent, read-only: **877**
(page wrapper + width token, `AdminPageHeader` adapter).

Executor: run this file through `execute-task`. Strongest status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. No Git.

## 1. Mode and task type

`IMPLEMENTATION`, UI migration (page chrome) + Story relocation + manifest enrolment. Bundles: **UI / Layout /
Component (current Mantine path)**, **Storybook / Visual Proof**, **Component Catalog / Coverage**, **Admin Table /
Admin Control**.

- **Current/legacy boundary.** `AdminUsersTable` is already Mantine (0 `className`, Task 483/749) and keeps its code.
  The page's own header is legacy Tailwind (8 `className`, a static 24px `h1` — a GR-3c violation at 320px).
- **The Story moves, it is not duplicated.** `Admin/AdminUsersTable` is canonical today only through the exact-title
  escape hatch in `scripts/lib/mantine-story-scope.mjs` (Task 678). The owner rejected that hatch for new use on
  2026-09-17 (Task 827: *"Ці нові story більше схожі на Tailwind hardcode stories"*). This task moves the Story to
  `Patterns/Mantine/AdminUsersTable` and retires the hatch's only entry.

## 2. Objective

1. The page header, total count, location-filter note and "New user" action render through `AdminPageHeader`, inside a
   Mantine page wrapper with a width token.
2. `AdminUsersTable`'s Story lives at `Patterns/Mantine/AdminUsersTable` with the GR-3d gutter, and the component is
   enrolled in `scripts/mantine-migration-scope.json`.
3. The census shows only the root `page.tsx`.

## 3. Verified context — measured 2026-09-29 (re-measure at I0)

### 3.1 GR-1 census — `node.exe scripts\check-surface-census.mjs --surface src\app\admin\users\page.tsx`

| Node | Tier | Manifest | Own Story | `className` | `ui/*` | Disposition |
|---|---|---|---|---|---|---|
| `src/app/admin/users/page.tsx` | 1 (root) | no | no | 8 | 0 | chrome → Mantine (R1); root line stays |
| `src/components/admin/AdminUsersTable.tsx` (550 lines) | 1 | **no** | yes (`Admin/AdminUsersTable`, via the title hatch) | 0 | 0 | enrol (R3); Story moves (R2) |
| `patterns/MantineDataTableToCards.tsx` | 1 | yes | yes | 3 | 0 | unchanged |

### 3.2 The page today (`src/app/admin/users/page.tsx`, read in full)

| Area | Today | Line |
|---|---|---|
| Data | `tab`/`role`/`status`/`q`/`location_request`/`page` params; users list (25 per page, `tab=all`) or verified agents (`tab=verified`) through the admin client | `:12-78` |
| Wrapper | `div.p-6.max-w-10xl.mx-auto` (24px, cap 112rem = 1792px) | `:81` |
| Title | `h1.text-2xl.font-bold` `users_title` — **24px at every width** | `:84` |
| Location note | when `location_request=1`: `p.text-sm.text-status-warning` `users_location_filter` | `:85-87` |
| Count | when `tab=all`: `span.text-sm.text-muted-foreground` `users_total {count}` | `:90` |
| New user | `Link` styled by `buttonVariants({ size: 'lg' })`, `UserPlus` icon, `users_new_btn` → `/admin/users/new` | `:91-97` |

### 3.3 The Story and its registrations (FACT)

- `src/components/admin/AdminUsersTable.stories.tsx`, title `Admin/AdminUsersTable`, one export `Default` inside a
  hand-written `Box px={{ base: 'md', sm: 'xl' }} py="md"` — a gutter written in the Story, forbidden by GR-3d.
- `scripts/lib/mantine-story-scope.mjs:34-40` — `MANTINE_STORY_ENROLLED_TITLES = { 'Admin/AdminUsersTable': … }`, the
  map's only entry. Its own comment: an empty map must leave `isCanonicalMantineTitle` byte-identical to the
  prefix-only check.
- `scripts/__tests__/check-design-tokens.test.ts:1071-1150` — arms (a), (d) and (e) of "title-enrolled membership (Task
  827)" use `'Admin/AdminUsersTable'` as the enrolled title.
- `scripts/check-stories-rendered.mjs:162` — id `admin-adminuserstable--default`, anchor `admin-users-table`.
- Fixtures: `src/stories/fixtures/admin.fixtures.ts` (`FIXTURE_USERS`, `FIXTURE_VERIFIED_AGENTS`).
- Tests: `src/components/admin/__tests__/AdminUsersTable.smoke.test.tsx` (unchanged by this task).

### 3.4 Canonical sources inspected (FACT)

| Need | Candidate | Fit |
|---|---|---|
| Title + note + actions | `AdminPageHeader` (877 adapter over `MantineDashboardHeader`: title `h5`→`h4` from `sm`, `gray.5` subtitle, `actions` slot), Story `Patterns/Mantine/AdminPageHeader` | reuse |
| Link as a button | Mantine `Button component={Link}` — precedent in a Server Component: `src/components/layout/FooterView.tsx:24` | reuse |
| Width | `adminPageMaxWidth` 64rem, `adminPageFormMaxWidth` 48rem — no 112rem token; `.container-admin` caps at 112rem too (`globals.css:728-744`) | **extend** `adminPageShellMaxWidth` |

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | §3.2; GR-3c | `page.tsx` returns `<Box p="xl" maw={layout.adminPageShellMaxWidth} mx="auto">` with `<AdminPageHeader title={t('users_title')} subtitle={locationRequest ? t('users_location_filter') : undefined} action={…} />` then `AdminUsersTable` (props unchanged). `action` = `Group gap="sm" wrap="nowrap"`: when `tab === 'all'`, `Text size="sm" c="dimmed"` `users_total`; then `Button component={Link} href="/admin/users/new" leftSection={<UserPlus size={theme.other.iconSize.standard} />}` `users_new_btn`. The `buttonVariants`/`cn` imports go. Data reads unchanged. 0 `className`. | P1 | AC1 | Confirmed |
| **R2** | GR-3a, GR-3d, owner rule 2026-09-17 | **New file** `src/stories/patterns/mantine/AdminUsersTable.stories.tsx`, written with the Write tool; the old file is removed with a file-system delete (never a Git command), title `Patterns/Mantine/AdminUsersTable`, `skipCanvas: true`, every export wrapped in `StoryPageGutter`, no written gutter, no viewport pin. Exports: `Default` (today's args), `VerifiedTab` (`activeTab: 'verified'`), `Empty` (`users: []`, `total: 0`), `LocationFilter` (`locationRequestFilter: true`). `check-stories-rendered.mjs:162` → id `patterns-mantine-adminuserstable--default`, same anchor. | P1 | AC2 | Confirmed |
| **R3** | reserved row | `src/components/admin/AdminUsersTable.tsx` is added to `scripts/mantine-migration-scope.json`; `check:story-coverage` passes. | P1 | AC2 | Confirmed |
| **R4** | §3.3; owner rule 2026-09-17 | `MANTINE_STORY_ENROLLED_TITLES` becomes `{}` (the comment block stays, plus one line: *"Emptied by Task 896 (2026-MM-DD): the only entry's Story moved to Patterns/Mantine/AdminUsersTable."*). The three Task 827 test arms that used the real entry inject a fixture title instead: `vi.mock('../lib/mantine-story-scope.mjs', …)` that keeps the real prefix logic and adds `'Fixture/EnrolledTitle'`, and the fixtures use that title. A new arm **(g)** asserts that with the real (empty) map, `isCanonicalMantineTitle('Admin/AdminUsersTable')` is `false` and every `MANTINE_STORY_TITLE_PREFIXES` title is `true`. | P1 | AC3 | Confirmed |
| **R5** | D71-4; 877 precedent | `theme.ts` gains `adminPageShellMaxWidth: '112rem'` (`// 1792px — Task 896: admin list-page wrapper (legacy max-w-10xl / .container-admin cap)`) with 877's value type. **Task 857 reuses this key**; if 857 lands first, reuse its key instead (same name and value). | P2 | AC1 | Confirmed |
| **R6** | GR-1 | After the change the census FAIL line is only the root `page.tsx`, now with `className:0`; the baseline loses `AdminUsersTable`'s key; no key is added. Regenerate with `npm.cmd run check:surface-census:changed:update-baseline`. | P0 | AC4 | Confirmed |

## 5. Assumptions and open questions

1. Visual changes (O84-4): the title becomes 20px below 640 and 24px from 640 (today 24px everywhere); the location note
   loses its warning colour and reads as the header subtitle (`gray.5`); the button and count move into the header's
   action slot. The page gutter goes from 24px at every width to the same 24px (`p="xl"`).
2. INFERENCE: vitest can mock `scripts/lib/mantine-story-scope.mjs` for `check-design-tokens.mjs`'s import. If it
   cannot (ESM resolution), stop with `BLOCKED — R4 MOCK` and report the error; do not keep the entry.
3. Open owner questions: none.

## 6. Pre-read rule bundle

`docs/golden-rules.md` (GR-0 … GR-6) · `docs/agent-contract.md` 1, 3–7, 9–16d · `docs/rule-index.md` → the §1 bundles ·
`docs/mantine-responsive-design-system.md` · `docs/storybook-governance.md:9-15`, `:136` · `docs/component-rules.md` ·
`docs/qa-profiles.md` Q3 · `scripts/lib/mantine-story-scope.mjs` in full · the executed 877 kickoff (read-only).

## 7. Scope — the exact allowed write set

1. `src/app/admin/users/page.tsx`
2. `src/design-system/mantine/theme.ts` — the `adminPageShellMaxWidth` key and type line (skip if 857 created it)
3. new `src/stories/patterns/mantine/AdminUsersTable.stories.tsx`; deleted `src/components/admin/AdminUsersTable.stories.tsx`
4. `scripts/lib/mantine-story-scope.mjs` (R4), `scripts/__tests__/check-design-tokens.test.ts` (R4 arms only)
5. `scripts/mantine-migration-scope.json`, `scripts/surface-census-baseline.json`, `scripts/check-stories-rendered.mjs`
   (`:162`); `scripts/governance/reports/component-catalog.latest.json` / `docs/component-catalog.md` only if required
6. `docs/sessions/<date>-task896-admin-users-list-mantine.md`, `docs/sessions/evidence/task896/*`
7. `docs/backlog.md` — the 896 cell only

## 8. Out of scope

- `AdminUsersTable.tsx`'s code, its smoke test, the user queries.
- `/admin/users/[id]` and `/new` (893). The 24-hour clock (885).

## 9. Current and required behavior

| Area | Current | Required after |
|---|---|---|
| Filters, search, tabs, pagination, verify toggle, row links | `AdminUsersTable` | unchanged |
| Title | 24px at every width | 20px below 640, 24px from 640 (**changed**, GR-3c) |
| Location note | warning-coloured line | header subtitle (**changed**) |
| New user, count | right of the title | header action slot |
| Story | `Admin/AdminUsersTable`, gutter written in the Story | `Patterns/Mantine/AdminUsersTable`, `StoryPageGutter` |

## 10. Implementation requirements

### 10.1 I0

1. `node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()"` → `win32`.
2. `git --no-optional-locks status --porcelain` → `docs/sessions/evidence/task896/01-status-before.txt` + hashes of every
   modified path. A §7 path already modified → `BLOCKED — SHARED PATH`.
3. Census → `02-census-before.txt`; anything beyond §3.1 → session log; an unmigrated node → `BLOCKED — CLAUSE 16d`.
4. `grep -n adminPageShellMaxWidth src/design-system/mantine/theme.ts` → record whether 857 already created it.
5. `npx.cmd vitest run scripts/__tests__/check-design-tokens.test.ts src/components/admin/__tests__/AdminUsersTable.smoke.test.tsx`
   → `03-tests-before.txt` (exit 0).
6. Emit the executor's GR-0 and GR-3a receipts (§15.1).

### 10.2 Order

I0 → R5 → R1 → R2 + R3 → R4 → plants → R6 → gates → receipts.

### 10.3 Plants (Node I/O; hash before and after)

| Plant | Edit | Must fail |
|---|---|---|
| **P1** | in the moved Story, wrap `Default` in `<Box px="md">` inside `StoryPageGutter` | the GR-3d edge-gap measurement at 320 (expected 16, measures 32) — recorded in the receipt, then restored |
| **P2** | re-add `'Admin/AdminUsersTable'` to `MANTINE_STORY_ENROLLED_TITLES` | arm (g) |
| **P3** | re-add a `className="mb-6"` on the page `Box`'s child | the census reports `page.tsx className:1` (AC4 compares 0) |

## 11. Positive and negative flows

**Positive flow.** An admin opens `/admin/users`, sees the title, the total and "New user" in the header; searches,
filters and pages as before; opens "New user".

| Branch | Applicable? | Expected | Evidence |
|---|---:|---|---|
| `tab=verified` | Yes | no total in the header; verified list | `VerifiedTab` Story |
| `location_request=1` | Yes | subtitle note shown | `LocationFilter` Story |
| No users | Yes | table empty state | `Empty` Story |
| Mobile < 640 | Yes | header wraps, button reachable, no overflow | GR-3b receipts |

## 12. Acceptance criteria

- **AC1 [R1, R5]** Given `page.tsx`, then it has 0 `className`, no `buttonVariants`/`cn` import, and renders
  `AdminPageHeader` inside the `Box` with `adminPageShellMaxWidth`, whose definition line is quoted.
- **AC2 [R2, R3]** Given the tree, then the old Story file is gone, the new one has the four exports inside
  `StoryPageGutter`, `AdminUsersTable.tsx` is in the manifest, and `check:story-coverage` exits 0.
- **AC3 [R4]** Given `check-design-tokens.test.ts`, then arms (a)–(g) pass; P2 makes (g) fail; the map is `{}`.
- **AC4 [R6]** Given `11-census-after.txt`, then the only FAIL line is `page.tsx` with `className:0`, and the baseline
  diff removes `AdminUsersTable`'s key and the page's old key text only.
- **AC5 [all]** `npm.cmd run build` exits 0; `typecheck`, `lint`, `check:story-coverage`, `check:rendered-scope`,
  `check:surface-census:changed`, `check:design-tokens`, `check:i18n`, `check:file-integrity`, `check:mojibake`,
  `build-storybook` exit 0; `git grep --untracked -n "admin-adminuserstable\|'Admin/AdminUsersTable'" -- scripts src ":!scripts/__tests__/**"`
  prints nothing (arm (g) names the retired title on purpose).

`GR-4 AC AUDIT — 5 criteria; each states an observable property; absolutes: AC5's empty grep over live paths (the declared retirement of the old id, read with --untracked).`

### 12.1 Type-scale table (GR-3c)

| Element | Role | base | sm | md | lg | Theme key | Provenance |
|---|---|---|---|---|---|---|---|
| `users_title` | page title | 20px | 24px | 24px | 24px | `MantineDashboardHeader` `fz={{ base: 'h5', sm: 'h4' }}` | 877 adapter |
| Location note | subtitle | 14px | 14px | 14px | 14px | `size="sm"` | adapter |
| Total count | body | 14px | 14px | 14px | 14px | `size="sm"` | legacy `text-sm` |

### 12.2 Width contract (GR-3b) and gutter (GR-3d)

The production parent of `AdminUsersTable` is the R1 `Box` (cap only; fluid). The Story is fluid. GR-3d:
`Patterns/Mantine/AdminUsersTable` — **wrap in this task** (the old Story wrote its own `Box px`);
`Patterns/Mantine/AdminPageHeader` (blast radius) — **profile present**.

## 13. QA profile and verification plan

**Q3** — page chrome migration plus a Story relocation; `AdminUsersTable`'s behaviour is unchanged and keeps its smoke test.

### 13.1 Final gate block (executor)

```powershell
$ev = "docs\sessions\evidence\task896"
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\09-platform.txt"
node.exe scripts\check-surface-census.mjs --surface src\app\admin\users\page.tsx *>&1 | Tee-Object "$ev\11-census-after.txt"
npx.cmd vitest run scripts/__tests__/check-design-tokens.test.ts src/components/admin/__tests__/AdminUsersTable.smoke.test.tsx *>&1 | Tee-Object "$ev\10-tests.txt"
npm.cmd run typecheck *>&1 | Tee-Object "$ev\12-typecheck.txt"
npm.cmd run lint *>&1 | Tee-Object "$ev\13-lint.txt"
npm.cmd run check:story-coverage *>&1 | Tee-Object "$ev\14-story-coverage.txt"
npm.cmd run check:rendered-scope *>&1 | Tee-Object "$ev\15-rendered-scope.txt"
npm.cmd run check:surface-census:changed *>&1 | Tee-Object "$ev\16-census-changed.txt"
npm.cmd run check:design-tokens *>&1 | Tee-Object "$ev\17-design-tokens.txt"
npm.cmd run check:i18n *>&1 | Tee-Object "$ev\17c-i18n.txt"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\18-file-integrity.txt"
npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\18b-mojibake.txt"
npm.cmd run build-storybook *>&1 | Tee-Object "$ev\19-storybook-build.txt"
npm.cmd run build *>&1 | Tee-Object "$ev\19b-build.txt"
git --no-optional-locks diff -- scripts\surface-census-baseline.json | Tee-Object "$ev\20-baseline-diff.txt"
git --no-optional-locks grep --untracked -n -E "admin-adminuserstable|'Admin/AdminUsersTable'" -- scripts src ":!scripts/__tests__/**" | Tee-Object "$ev\20b-reference-audit.txt"
git --no-optional-locks status --porcelain | Tee-Object "$ev\21-status-after.txt"
```

Record each exit code; normalise `Tee-Object` files to UTF-8 without BOM through Node; hashes of every changed/new file
in `22-hash-object.txt`. Expected: `win32`; one FAIL line; all exits 0; `20b` empty.

### 13.2 Receipts (executor)

GR-3b and GR-3d per export at 320/390/1024/1440 (edge gap 16/16/32/32); GR-3c on the header Story is unchanged by this
task (blast radius) and measured once at 320 and 1440.

### 13.3 `OWNER VISUAL QA REQUIRED` — O84-4

| Story | States | Locales | Viewports | Tuples |
|---|---|---|---|---|
| `Patterns/Mantine/AdminUsersTable` | `Default`, `VerifiedTab`, `LocationFilter` | `sq`, `uk` | 390, 1440 | 12 |

After the deploy: open `/admin/users` at a phone width and at desktop; read the header, open "New user".

## 14. Completion report contract

Status per `execute-task`. Files with hashes; R1–R6/AC1–AC5 with evidence; each exit code; census before/after; GR-0,
GR-1, GR-3 (`AdminUsersTable` ← its Story), GR-3a, GR-3b, GR-3c, GR-3d receipts; plants with hash pairs; limitations; O84-4
owed. Update the 896 cell of `docs/backlog.md`; session log. No Git.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable without chat context | yes |
| Every requirement has an AC | R1/R5→AC1 · R2/R3→AC2 · R4→AC3 · R6→AC4 · all→AC5 |
| Two-armed controls | P1–P3 |
| Owner rule on titles respected | R2, R4 (memory rule 2026-09-17, `storybook-governance.md:9-15`) |
| Owner exception claimed | none |

### 15.1 Canonical UI decision record

| Visible artifact | Searches / inspected | Canonical source | Disposition | Registration |
|---|---|---|---|---|
| Page header + actions | `AdminPageHeader`, `MantineDashboardHeader`, `MantinePageHeaderWithActions` | `Patterns/Mantine/AdminPageHeader` | **reuse** | — |
| Link button | `Button component={Link}` (`FooterView.tsx:24`) | `Mantine/Primitives/Button` | **reuse** | — |
| Page width | `adminPageMaxWidth`, `.container-admin`, `max-w-10xl` | `theme.other.layout` | **extend** | `adminPageShellMaxWidth` |
| Users table | `AdminUsersTable` (Mantine) | its own Story, moved | **reuse** + relocate | manifest |

`GR-0 CANONICAL REUSE PREFLIGHT — request: /admin/users page chrome + AdminUsersTable Story; semantic queries: admin page header with actions, link button, admin list page width, users table story; inspected candidates: AdminPageHeader (Patterns/Mantine/AdminPageHeader), MantineDashboardHeader, MantinePageHeaderWithActions, Button (Mantine/Primitives/Button), adminPageMaxWidth, Admin/AdminUsersTable; decision: REUSE + EXTEND (adminPageShellMaxWidth); selected canonical owner: components/admin/AdminPageHeader.tsx, theme.other.layout; Mantine/TailAdmin token path: spacing xl, iconSize standard, header fz h5/h4; new hardcoded visual values: NONE; rationale: the page only composes canonical owners.`

`GR-3a STORY PREFLIGHT — AdminUsersTable × Default/VerifiedTab/Empty/LocationFilter; canonical candidates: Admin/AdminUsersTable (canonical only via the exact-title hatch the owner rejected for new use); direct-import evidence: src/components/admin/AdminUsersTable.stories.tsx:3; toolbar coverage: locale=toolbar, viewport=toolbar; decision: EXTEND by relocation (one Story file, moved and extended; the old file deleted, no parallel page); target: Patterns/Mantine/AdminUsersTable; rationale: owner rule 2026-09-17.`

`GR-1 CENSUS COMPLETE — 3 nodes; after: tier1 AdminUsersTable enrolled+story, MantineDataTableToCards unchanged; tier2 none; tier3 none — filed as none.`

## Appendix A — Evidence preflight

| Claim | Source | Status |
|---|---|---|
| Census, 3 nodes | 2026-09-29 run | VERIFIED |
| Static 24px title | `page.tsx:84` | VERIFIED |
| Title hatch holds only this entry | `mantine-story-scope.mjs:34-40` | VERIFIED |
| Tests depend on the entry | `check-design-tokens.test.ts:1071-1150` | VERIFIED |
| Server-component `component={Link}` precedent | `FooterView.tsx:24` | VERIFIED |

## Appendix B — Rule-compliance ledger

| Rule | Outcome | Result |
|---|---|---|
| 16d / GR-1 | every node dispositioned | COMPLIANT |
| GR-0 | reuse/extend | COMPLIANT |
| GR-3a / owner rule 2026-09-17 | relocate, no parallel page, hatch retired | COMPLIANT |
| GR-3b / 3c / 3d | §12 | COMPLIANT |
| clause 9 | old id and title retired everywhere live | COMPLIANT (AC5) |

## Appendix C — Execution contract

| # | Checkpoint | Failure |
|---|---|---|
| 0 | I0 | `BLOCKED` |
| 1 | R4 mock works | `BLOCKED — R4 MOCK` |
| 2 | Plants P1–P3 | a plant passes → test/measurement defect |
| 3 | Gates | non-zero → `PARTIALLY IMPLEMENTED` |
| 4 | O84-4 | returned → revision |

## Appendix D — the reserved-registry row, moved verbatim (2026-09-29)

| # | State | What |
|---|---|---|
| **896** | reserved 2026-09-27 — **Sprint 84**, P3, filed by 885's design (owner D84-1: *"Migrate first"*) | **`/admin/users` list on canonical Mantine.** Census 2026-09-27 (`check-surface-census.mjs --surface src/app/admin/users/page.tsx`): the root `page.tsx` carries 8 `className`; `AdminUsersTable` has 0 `className` and its own Story, but no manifest entry (`tier1-unenrolled-or-unstoried`). Deliverable: the page's chrome moves to canonical patterns (census first; name them in the kickoff), and `AdminUsersTable` is enrolled in `scripts/mantine-migration-scope.json`. The census then shows only the root. Blocks **885**. |

---

## Addendum — Task 886 closure, 2026-09-30 (owner decision O83-2)

Task 886 added the blocking `check:type-responsive` gate (`scripts/check-type-responsive.mjs`). It baselines the legacy site **L3** (`src/app/admin/users/page.tsx :: text-2xl`) in `scripts/type-responsive-baseline.json`.
- When this task removes that site, delete its baseline entry in the same change. The gate fails on a **stale** entry: *"the site was fixed or removed; delete the entry"*.
- Add `npm.cmd run check:type-responsive` to the final gate block. It must exit 0.
- The migrated heading follows GR-3c: a breakpoint-keyed theme `fz` (`TITLE_FZ`, `src/design-system/mantine/typography.ts`), and at most 20px below 640.

Owner, verbatim (O83-2, 2026-09-30): *"що це за Legacy-сайти і чи використовуємо ми їх наразі у проекті? Якщо використовуємо, тоді треба мігрувати на Minetine."*

---

## 16. Review 1 — 2026-10-01 — `PARTIALLY VERIFIED`

Code, gates and Story measurements are verified against the working tree. Every changed file's `git hash-object` equals
`docs/sessions/evidence/task896/22-hash-object.txt`. The only owed item is the owner matrix **O84-4** (§13.3). The
visual criterion stays `NOT VERIFIABLE` until the owner records it. No executor rework is owed.

### 16.1 Reviewer re-runs (win32, Node v22.22.3)

- vitest (`check-design-tokens.test.ts` + `AdminUsersTable.smoke.test.tsx`): 176/176, exit 0.
- `check:story-coverage`, `check:type-responsive` and `check:rendered-scope`: all exit 0.
- AC5 reference grep: empty.
- Census `11-census-after.txt` has 5 nodes. The new nodes are `AdminPageHeader` and `MantineDashboardHeader`, both
  manifest + story, `className:0`. The only FAIL is the root `page.tsx` at `className:0`.
- `19b-build.txt` ends with `EXIT_CODE=0`. `storybook-static/index.json` (20:11:55) is newer than the Story file (20:11:14).

### 16.2 Story measurements (reviewer, Chromium on `storybook-static`, `uk`)

All four exports at 320/390/1024/1440 measure t/r/b/l 24/16/24/16 at 320 and 390, and 24/32/24/32 at 1024 and 1440.
The bottom is measured to the `StoryPageGutter` box, not to the viewport. There is no document overflow, no headings,
and text is 12–16px. Blast radius: the `Patterns/Mantine/AdminPageHeader` `h1` is 20px at 320 and 24px at 1440.

### 16.3 Accepted deviations

1. **`scripts/__tests__/check-design-tokens.test.ts` §K (Task 784).** The "legacy, excluded" example moved from
   `AdminUsersTable.tsx` to `AdminListingsTable.tsx`, which is outside "R4 arms only". Enrolment (R3) forced it.
   `AdminListingsTable.tsx` has no manifest hit (FACT), so the arms still exercise exclusion. If Task 857 enrols that
   file, the same two arms fail and must move again; the test failure surfaces that by itself.
2. **`check:surface-census:changed` and its `:update-baseline` ran with `--base HEAD`.** This is the same deviation 858
   recorded. The baseline diff removes only `AdminUsersTable`'s key.
3. **P1 ran on `Default` only.** That matches §10.3, which names `Default`.
4. **Process.** The kickoff was opened one tool call before GR-0 and 16b–16c were read. No write preceded those reads.

### 16.4 Notes (P3, non-blocking)

- **N1. The page-header action group has no Story of its own.** The group is `Group wrap="nowrap"`: the count plus the
  `Button component={Link}`. §11 mapped "Mobile < 640" to the GR-3b receipts, but the `AdminUsersTable` Story does not
  render the header.
  - Reviewer measurement, synthetic, on `AdminPageHeader` `WithAction`: in `uk` the count is 82–89px, the gap 12px and
    the button with its icon 187px. That needs 281–288px. At 320 the production slot is 272px (`AdminShell` padding 0,
    `Box p="xl"`).
  - INFERENCE: the count `Text` shrinks and wraps to two lines next to the button. The document does not overflow. `sq`,
    `en` and `it` fit.
  - The owner's post-deploy phone-width read of `/admin/users` (O84-4) is the check.

## 17. Review 2 — 2026-10-01 — ✅ `APPROVED WITH NOTES`

- **O84-4 matrix accepted.** The owner accepted all 12 tuples of §13.3 (`Default`, `VerifiedTab`, `LocationFilter` ×
  `sq`, `uk` × 390, 1440). Owner, verbatim: *"ghbqvf."* (typed in the wrong keyboard layout), then *"приймаю"*.
- **Implementation unchanged since review 1.** The re-hashed `page.tsx`, the Story and `mantine-story-scope.mjs` equal
  `22-hash-object.txt`, so §16's verification stands.
- **Note carried.** P3 N1 (§16.4) stays a note.
- **Still owed after the deploy.** The live phone/desktop read of `/admin/users` is a separate owner action. It is
  recorded as the remainder of O84-4 in the Sprint 84 plan, and it does not keep this task open.
