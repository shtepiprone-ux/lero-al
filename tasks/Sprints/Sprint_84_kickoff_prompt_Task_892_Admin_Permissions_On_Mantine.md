# Task 892 — `/admin/permissions` on canonical Mantine

Sprint 84 · **P3** · QA profile **Q3** (legacy admin surface → Mantine) · **depends on 893** (hard: `MantineFormSection`,
extracted by 893 R1) · blocks **885** · owner action **O84-3** · **Status: `KICKOFF FILED` 2026-09-29**

Sprint plan: [`Sprint_84_One_Clock_And_One_Date_Order.md`](Sprint_84_One_Clock_And_One_Date_Order.md). Reserved
2026-09-27 by 885's design under owner decision **D84-1** (*"Migrate first"*); the reserved row moves into Appendix D.
Precedents, read-only: **877** (container/View split, page wrapper and width token) and **893** (`MantineFormSection`).

Executor: run this file through `execute-task`. Strongest status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. No Git.

## 1. Mode and task type

`IMPLEMENTATION`, UI migration. Bundles: **UI / Layout / Component (current Mantine path)**, **Storybook / Visual
Proof**, **Component Catalog / Coverage**, **Admin Table / Admin Control**.

- **Current/legacy boundary.** The route renders the legacy `AdminPermissionsManager` (44 `className`, `ui/badge`,
  `ui/switch`). After this task it renders a container with 0 `className` and a Mantine View with its own Story.
- **The audit-log time call stays one findable line.** 885 later adds `hourCycle: 'h23'` to it and re-locates it with
  a `timeStyle` grep. It moves into the View unchanged.

## 2. Objective

1. `/admin/permissions` shows the same header, count, admin note, moderator permission matrix with live toggles, and
   audit log as today (§3.3), composed from canonical Mantine primitives and `MantineFormSection`.
2. `AdminPermissionsManager` becomes a pure container (state, server action, toasts); `AdminPermissionsView` is
   presentational, with its own Story and manifest entry.
3. The route census shows only the root `page.tsx` and the container-exempt `AdminPermissionsManager` (§3.2 calibration).

## 3. Verified context — measured 2026-09-29 (re-measure at I0)

### 3.1 Owner decisions

- **D84-1** (2026-09-27): *"Migrate first"* — no 16d exception. No other owner decision is claimed.

### 3.2 GR-1 census — `node.exe scripts\check-surface-census.mjs --surface src\app\admin\permissions\page.tsx`

| Node | Tier | Manifest | Own Story | `className` | `ui/*` | Disposition |
|---|---|---|---|---|---|---|
| `src/app/admin/permissions/page.tsx` | 1 (root) | no | no | 0 | 0 | gains the page wrapper and `AdminPageHeader` (R5); the root line stays, as on every route |
| `src/components/admin/AdminPermissionsManager.tsx` (201 lines, hash `d8117f5e…`) | 1 | no | legacy `Admin/AdminPermissionsManager` only | 44 | 2 | pure container (R1); legacy Story deleted (R6) |
| `ui/badge`, `ui/switch` | 2 | — | — | — | — | imports removed |

Baseline keys today: 4 (`scripts/surface-census-baseline.json:529-540`).

**Calibration (FACT, measured on `/admin/currency` after 877 landed):** the census prints a `FAIL
[tier1-unenrolled-or-unstoried]` line for the root `page.tsx` **and** for every pure container
(`AdminCurrenciesManager`, `AdminExchangeProvidersManager` both FAIL with `className:0 ui-imports:0`), because it
cannot recognise the GR-1 container exemption. After this task the expected FAIL lines are exactly `page.tsx` and
`AdminPermissionsManager.tsx`, the latter with `className:0 ui-imports:0`.

### 3.3 Current behaviour to preserve — read from `AdminPermissionsManager.tsx`

| Area | Today | Line |
|---|---|---|
| Data | `permissions` (12 `PERMISSION_KEYS`) and `events` (`null` = unavailable) from `page.tsx` | page `:9-12` |
| Toggle | `setModeratorPermission(key, value)`; `noOp` → `toast.info(already_granted \| not_granted)`; `forbidden` → `toast.error(error_forbidden)`; other error → `toast.error(error_transient)`; success → local `allowed` flips + `toast.success(save_success)`. The row's switch is disabled while its own save is pending | `:28-46`, `:125-127` |
| Header | Shield icon, `title` (h1, 20px), `description` | `:54-60` |
| Count | outline badge with a green `ShieldCheck`: `allowed_count {count, total}` | `:62-67` |
| Admin section | band `admin_section_title`; row: green `ShieldCheck` + `admin_full_access` | `:70-80` |
| Matrix | header row `column_permission` / `column_allowed`; per key: `keys.<slug>` (medium), `descriptions.<slug>` (xs), the raw key in monospace, and when `updated_at`: `column_last_updated: <date medium>` + `audit_by <name>`; right: `ShieldCheck` (allowed, green) or `ShieldX` (dimmed) + `Switch` with `aria-label = keys.<slug>`; row `data-testid="perm-row-<slug>"` | `:82-131` |
| Audit | band `audit_title`; `events === null` → warning icon + `audit_unavailable`; empty → `audit_empty`; else per event: icon, `keys.<slug>` + `audit_grant` (green) / `audit_revoke`, then `audit_by <actor \| audit_unknown_actor> · <dateTime dateStyle medium, timeStyle short>` | `:134-189` |
| Footer | `admin_note` (xs, muted) | `:196` |
| Root | `data-testid="admin-permissions-manager"`, `p-6 max-w-2xl`, **left-aligned** (no `mx-auto`) | `:52` |

### 3.4 Registrations that name the current file (FACT)

- `scripts/check-stories-rendered.mjs:220` — `admin-adminpermissionsmanager--default`, anchors `admin-permissions-manager`,
  `perm-row-reports_status_override`, `perm-row-reports_delete`.
- `scripts/story-coverage-exempt.json:10` — the manager, "requires live Supabase … no safe mock".
- `scripts/i18n-dynamic-manifest.json` ids `admin-permissions-keys` (`site …AdminPermissionsManager.tsx:104`) and
  `admin-permissions-descriptions` (`:107`).
- The legacy Story `src/components/admin/AdminPermissionsManager.stories.tsx` (title `Admin/AdminPermissionsManager`,
  one export with a `globals.viewport` pin — forbidden by GR-3b).

### 3.5 Canonical sources inspected (FACT)

| Need | Candidate | Fit |
|---|---|---|
| Section card with a header action | `MantineFormSection` (893 R1: `Paper withBorder radius="2xl"`, 16px/500 title + `headerAction` + `Divider`, TailAdmin §6l) | **reuse** after 893 lands |
| Toggle | Mantine `Switch`, Story `Mantine/Primitives/Switch` | reuse |
| Count badge | Mantine `Badge`, Story `Mantine/Primitives/Badge` | reuse |
| Unavailable notice | Mantine `Alert`, Story `Mantine/Primitives/Alert` | reuse |
| Page title | `AdminPageHeader` → `MantineDashboardHeader` (title `h5` below 640, `h4` from `sm`), Story `Patterns/Mantine/AdminPageHeader` | reuse |
| Page width | `theme.other.layout.adminPageMaxWidth` (64rem), `adminPageFormMaxWidth` (48rem) — neither is 42rem | **extend**: `adminPagePanelMaxWidth` |

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | component-rules P0 | `AdminPermissionsManager` keeps its `Props` and **all** of `:21-48` unchanged (state, `handleToggle`, toasts, `allowedCount`). It renders only `<AdminPermissionsView permissions events allowedCount savingKey={saving && pending ? saving : null} onToggle={handleToggle} />`, with 0 `className` and 0 `ui/*` imports. | P1 | AC1, AC6 | Confirmed |
| **R2** | §3.3; GR-0 | `src/components/admin/AdminPermissionsView.tsx` (new, presentational; `useTranslations('admin.permissions')` and `useFormatter` only). Root `Stack gap="xl"` with `data-testid="admin-permissions-manager"`. Order: the count `Badge variant="outline" color="gray"` with `leftSection` = `ShieldCheck` at `theme.other.iconSize.badge`, `c="green"`; three `MantineFormSection`s — (1) title `admin_section_title`, body `Group` with the green `ShieldCheck` (`iconSize.standard`) and `Text size="sm" c="dimmed"` `admin_full_access`; (2) title `column_permission`, `headerAction` = `Text size="xs" c="dimmed" fw={600}` `column_allowed`, body = one row per key separated by `Divider`; (3) title `audit_title`, body per §3.3; then `Text size="xs" c="dimmed"` `admin_note`. | P1 | AC2 | Confirmed |
| **R3** | §3.3 matrix | Each matrix row: `Group justify="space-between" wrap="nowrap" align="flex-start"` with `data-testid="perm-row-<slug>"`. Left `Stack gap={0}` (`miw={0}`): `Text size="sm" fw={500}` name; `Text size="xs" c="dimmed"` description; `Text size="xs" c="dimmed" ff="monospace"` raw key; when `updated_at`, `Text size="xs" c="dimmed"` with `column_last_updated`, the `format.dateTime(new Date(updated_at), { dateStyle: 'medium' })` output and `audit_by <name>`. Right `Group gap="xs" wrap="nowrap"`: `ShieldCheck` `c="green"` or `ShieldX` `c="dimmed"` (`iconSize.standard`), then `Switch` (`checked`, `onChange={e => onToggle(key, e.currentTarget.checked)}`, `disabled={savingKey === key}`, `aria-label={t(\`keys.${slug}\`)}`). | P1 | AC2, AC5 | Confirmed |
| **R4** | §3.3 audit | `events === null` → `Alert color="yellow" variant="light"` with `AlertTriangle` and `audit_unavailable`; `[]` → `Text size="sm" c="dimmed"` `audit_empty`; else rows `Group align="flex-start" wrap="nowrap"` with the icon and a `Stack gap={0}`: `Text size="sm" fw={500}` name + a `Text span` `c={new_allowed ? 'green' : 'dimmed'}` grant/revoke; `Text size="xs" c="dimmed"` `audit_by <actor>` + ` · ` + **one line** `format.dateTime(new Date(ev.created_at), { dateStyle: 'medium', timeStyle: 'short' })`. | P1 | AC2 | Confirmed |
| **R5** | 877 precedent; D71-4 | `page.tsx`: `<Box p="xl" maw={layout.adminPagePanelMaxWidth}>` (legacy `p-6`, 24px, left-aligned — **no** `mx="auto"`) around `<AdminPageHeader title={t('title')} subtitle={t('description')} />` and the manager (`getTranslations('admin.permissions')`). New theme key `adminPagePanelMaxWidth: '42rem'` with 877's value type and comment form (`// 672px — Task 892: /admin/permissions page wrapper (legacy max-w-2xl)`). The header moves out of the View; the Shield icon beside the title goes (the canonical admin header has none — §9, owner matrix). | P2 | AC3 | Confirmed |
| **R6** | GR-3, GR-3a, GR-3d, 16c | `src/stories/patterns/mantine/AdminPermissionsView.stories.tsx`, title `Patterns/Mantine/AdminPermissionsView`, statically importing the View, `parameters: { skipCanvas: true, layout: 'fullscreen' }`, every export wrapped in `StoryPageGutter`. Exports: `Default` (two allowed keys with `updated_at`, one event), `AllAllowed`, `Saving` (`savingKey='reports.manage'`), `AuditEmpty`, `AuditUnavailable` (`events: null`). Fixtures move from the legacy Story into the new file. The View is enrolled in `scripts/mantine-migration-scope.json`. The legacy Story is deleted. | P1 | AC4 | Confirmed |
| **R7** | clause 9 | `check-stories-rendered.mjs:220` → id `patterns-mantine-adminpermissionsview--default`, same three anchors; `story-coverage-exempt.json:10` entry removed (the container is proven by the View's Story, GR-1 exemption); `i18n-dynamic-manifest.json` `site` values → the View's two lines. `git grep --untracked -n "admin-adminpermissionsmanager\|AdminPermissionsManager.stories"` prints nothing outside `docs/sessions/`, `tasks/Archive/`, history ledgers. | P1 | AC7 | Confirmed |
| **R8** | Q3 regression | `src/components/admin/__tests__/AdminPermissionsManager.smoke.test.tsx` (harness as `AdminUsersTable.smoke.test.tsx`: `setModeratorPermission` and `@/lib/toast` mocked, real `NextIntlClientProvider` with `messages/en.json`, `MantineProvider` + project theme): **T1** toggling `users.create` calls `setModeratorPermission('users.create', true)` and, on success, the switch is checked and `toast.success(save_success)` fired; **T2** `{ noOp: true }` → `toast.info(already_granted)`, switch unchanged; **T3** `{ error: 'forbidden' }` → `toast.error(error_forbidden)`; **T4** every switch is reachable by `getByRole('switch', { name: <key label> })`; **T5** `events: null` shows `audit_unavailable`. | P1 | AC5 | Confirmed |
| **R9** | GR-1 | After the change, the census FAIL lines are exactly `page.tsx` and `AdminPermissionsManager.tsx` (`className:0 ui-imports:0`), and `AdminPermissionsView` is `manifest:yes story:yes`. Regenerate the baseline with `npm.cmd run check:surface-census:changed:update-baseline`: the two tier-2 keys (`:535-540`) go, no key is added, no other surface's key changes. | P0 | AC6 | Confirmed |

## 5. Assumptions and open questions

1. **893 is a precondition** (`MantineFormSection`). If 893 has not landed, stop with `PREMISE DRIFT — 893`.
2. Visual changes, recorded (§9) and owner-reviewed (O84-3): bands become TailAdmin §6l section headers; the Shield
   icon beside the title goes; the title moves into the canonical admin header (20px below 640, 24px from 640).
3. Open owner questions: none.

## 6. Pre-read rule bundle

`docs/golden-rules.md` (GR-0 … GR-6, the container exemption) · `docs/agent-contract.md` 1, 3–7, 9–16d ·
`docs/rule-index.md` → the §1 bundles · `docs/mantine-responsive-design-system.md` · `docs/tailadmin-style-reference.md`
§6l · `docs/component-rules.md` (container/presentational, i18n) · `docs/qa-profiles.md` Q3 · the executed 877 and 893
kickoffs, read-only · `docs/orchestrator-procedures.md` → the 818/819 corollary.

## 7. Scope — the exact allowed write set

1. `src/app/admin/permissions/page.tsx`
2. `src/components/admin/AdminPermissionsManager.tsx` (container); new `src/components/admin/AdminPermissionsView.tsx`
3. `src/design-system/mantine/theme.ts` — the `adminPagePanelMaxWidth` key and its type line
4. new `src/stories/patterns/mantine/AdminPermissionsView.stories.tsx`; deleted `src/components/admin/AdminPermissionsManager.stories.tsx`
5. new `src/components/admin/__tests__/AdminPermissionsManager.smoke.test.tsx`
6. `scripts/mantine-migration-scope.json`, `scripts/story-coverage-exempt.json`, `scripts/surface-census-baseline.json`,
   `scripts/check-stories-rendered.mjs` (`:220`), `scripts/i18n-dynamic-manifest.json` (two `site` values);
   `scripts/governance/reports/component-catalog.latest.json` / `docs/component-catalog.md` only if their checks require it
7. `docs/sessions/<date>-task892-admin-permissions-mantine.md`, `docs/sessions/evidence/task892/*`
8. `docs/backlog.md` — the 892 cell only

## 8. Out of scope

- `src/modules/admin/actions/permissions.ts`, `permissionKeys.ts`, the database.
- The 24-hour clock (885). The `timeStyle: 'short'` call moves verbatim.
- `src/components/ui/switch.tsx` / `badge.tsx` (other consumers).

## 9. Current and required behavior

| Area | Current | Required after |
|---|---|---|
| Toggle, toasts, disabled-while-saving, counts, audit states | §3.3 | **unchanged** (T1–T5) |
| Header | Shield + 20px h1 + description, inside the manager | `AdminPageHeader` in `page.tsx`, 20px → 24px from 640 (**changed**) |
| Section chrome | muted uppercase bands | `MantineFormSection` headers + divider (**changed**) |
| Switch | shadcn | Mantine `Switch`, same `aria-label` |
| Width / placement | `max-w-2xl`, left | `adminPagePanelMaxWidth` (42rem), left (unchanged) |

## 10. Implementation requirements

### 10.1 I0

1. `node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()"` → starts `win32`.
2. `git --no-optional-locks status --porcelain` → `docs/sessions/evidence/task892/01-status-before.txt`, plus the hash of
   every modified path → `01b-hash-before.txt`. A §7 path already modified → `BLOCKED — SHARED PATH`.
3. **893 gate:** `MantineFormSection` exported from `patterns/index.ts` and 893 archived in `docs/backlog-archive.md`;
   quote both. Otherwise `PREMISE DRIFT — 893`.
4. Census → `02-census-before.txt`; a node absent from §3.2 goes into the session log with a tier; an unmigrated one not
   covered by R1–R4 → `BLOCKED — CLAUSE 16d`.
5. Emit the executor's `GR-0 CANONICAL REUSE PREFLIGHT` and `GR-3a STORY PREFLIGHT` receipts (§15.1 values).

### 10.2 Order

I0 → R5 token → R2–R4 View → R6 Story → R1 container → R5 page → R8 tests → plants → R7 → R9 → gates → receipts.

### 10.3 Plants (Node I/O; hash before and after)

| Plant | Edit | Must fail |
|---|---|---|
| **P1** | the container stops passing `savingKey` | a new assertion in T1 that the switch is disabled while the mocked action is pending |
| **P2** | the View drops `aria-label` from `Switch` | T4 |
| **P3** | re-add `import { Badge } from '@/components/ui/badge'` in the View and render it | the census exits 1 naming `ui/badge` |

## 11. Positive and negative flows

**Positive flow.** An admin opens `/admin/permissions`, grants `users.create` to moderators, sees the switch on, the
count rise and a success toast; after refresh the audit log lists the grant with the actor and time.

| Branch | Applicable? | Expected | Evidence |
|---|---:|---|---|
| Already in that state | Yes | info toast, no flip | T2 |
| Forbidden (moderator) | Yes | error toast | T3 |
| Transient error | Yes | `error_transient` toast | code unchanged (R1) |
| Audit read failed | Yes | unavailable alert | T5, `AuditUnavailable` |
| Mobile < 640 | Yes | rows wrap, switch keeps its size, no overflow | GR-3b receipts at 320/390 |
| Locale expansion | Yes | `uk`/`it` wrap without overflow | O84-3 |

## 12. Acceptance criteria

- **AC1 [R1]** Given the container, then it renders only `AdminPermissionsView`, with 0 `className` and 0 `ui/*`
  imports, and `:21-48`'s logic is unchanged in the diff.
- **AC2 [R2–R4]** Given the View, then it has no `className`, no `ui/*` import and no raw colour/px/rem literal
  (`check:design-tokens`, `check:enrolled-tailwind` exit 0), and exactly one `timeStyle` call.
- **AC3 [R5]** Given `page.tsx` and `theme.ts`, then the wrapper is a Mantine `Box` with `adminPagePanelMaxWidth` and
  0 `className`, and the token's definition line is quoted in the report.
- **AC4 [R6]** Given the Story file, then it imports the View, has the five exports each inside `StoryPageGutter`, no
  `globals.viewport`, and `check:story-coverage` exits 0 with the View enrolled.
- **AC5 [R3, R8]** Given T1–T5 on the final tree, then all pass; P1 and P2 each fail and pass after restore with equal hashes.
- **AC6 [R9]** Given `11-census-after.txt`, then the FAIL lines are exactly the two §3.2-calibration lines, and the
  baseline diff removes only the two tier-2 keys.
- **AC7 [R7]** Given the tree, then the legacy Story is gone and the R7 grep prints nothing.
- **AC8 [all]** `npm.cmd run build` exits 0; `typecheck`, `lint`, `check:story-coverage`, `check:rendered-scope`,
  `check:surface-census:changed`, `check:i18n`, `check:i18n-dynamic`, `check:file-integrity`, `check:mojibake`,
  `build-storybook` exit 0.

`GR-4 AC AUDIT — 8 criteria; each states an observable property; absolutes: AC7's empty grep over live paths (the declared deletion audit, read with --untracked).`

### 12.1 Type-scale table (GR-3c)

| Element | Role | base | sm | md | lg | Theme key | Provenance |
|---|---|---|---|---|---|---|---|
| Page title | page title | 20px | 24px | 24px | 24px | `MantineDashboardHeader` `fz={{ base: 'h5', sm: 'h4' }}` | 877 adapter |
| Page subtitle | body | 14px | 14px | 14px | 14px | `size="sm"` | `MantineDashboardHeader` |
| Section titles | section heading | 16px | 16px | 16px | 16px | `MantineFormSection` `fz="md"` | TailAdmin §6l |
| Permission name | label | 14px | 14px | 14px | 14px | `size="sm"` | legacy `text-sm` |
| Description, key, dates, note | body small | 12px | 12px | 12px | 12px | `size="xs"` | legacy `text-xs` |

No element reaches 24px below 640; no child heading exceeds the page title.

### 12.2 Width contract (GR-3b) and gutter (GR-3d)

The production parent is the R5 `Box` (`maw` cap, fluid below it). The Story is **fluid**: no `maw`/`w`/`style`/viewport
pin. GR-3d per owner-matrix Story: `Patterns/Mantine/AdminPermissionsView` — **wrap in this task** (`StoryPageGutter`);
`Patterns/Mantine/AdminPageHeader` (blast radius, unchanged) — **profile present** (re-measure only).

## 13. QA profile and verification plan

**Q3** — a legacy admin surface migrates; the server action and its critical-flow guard (registry "Archetype D") are
untouched. Required: Story + owner matrix, census + baseline proof, T1–T5 with plants, gates, build.

### 13.1 Final gate block (executor)

```powershell
$ev = "docs\sessions\evidence\task892"
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\09-platform.txt"
node.exe scripts\check-surface-census.mjs --surface src\app\admin\permissions\page.tsx *>&1 | Tee-Object "$ev\11-census-after.txt"
npx.cmd vitest run src/components/admin/__tests__/AdminPermissionsManager.smoke.test.tsx *>&1 | Tee-Object "$ev\10-tests.txt"
npm.cmd run test:admin *>&1 | Tee-Object "$ev\10b-test-admin.txt"
npm.cmd run typecheck *>&1 | Tee-Object "$ev\12-typecheck.txt"
npm.cmd run lint *>&1 | Tee-Object "$ev\13-lint.txt"
npm.cmd run check:story-coverage *>&1 | Tee-Object "$ev\14-story-coverage.txt"
npm.cmd run check:rendered-scope *>&1 | Tee-Object "$ev\15-rendered-scope.txt"
npm.cmd run check:surface-census:changed *>&1 | Tee-Object "$ev\16-census-changed.txt"
npm.cmd run check:design-tokens *>&1 | Tee-Object "$ev\17-design-tokens.txt"
npm.cmd run check:enrolled-tailwind *>&1 | Tee-Object "$ev\17b-enrolled-tailwind.txt"
npm.cmd run check:i18n *>&1 | Tee-Object "$ev\17c-i18n.txt"
npm.cmd run check:i18n-dynamic *>&1 | Tee-Object "$ev\17d-i18n-dynamic.txt"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\18-file-integrity.txt"
npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\18b-mojibake.txt"
npm.cmd run build-storybook *>&1 | Tee-Object "$ev\19-storybook-build.txt"
npm.cmd run build *>&1 | Tee-Object "$ev\19b-build.txt"
git --no-optional-locks diff -- scripts\surface-census-baseline.json | Tee-Object "$ev\20-baseline-diff.txt"
git --no-optional-locks grep --untracked -n -E "admin-adminpermissionsmanager|AdminPermissionsManager\.stories" -- . ":!docs/sessions/**" ":!tasks/Archive/**" ":!docs/backlog-archive.md" | Tee-Object "$ev\20b-reference-audit.txt"
git --no-optional-locks status --porcelain | Tee-Object "$ev\21-status-after.txt"
```

Record `EXIT_CODE=$LASTEXITCODE` after each. Normalise every `Tee-Object` file to UTF-8 without BOM through Node before
`check:file-integrity`. Capture `git hash-object` of every changed/new file in the same pass (`22-hash-object.txt`).
Expected: `win32`; `11` shows only the two calibration FAIL lines; `10`–`19b` exit 0; `20` removes only `:535-540`;
`20b` prints nothing.

### 13.2 GR-3b / GR-3c / GR-3d receipts (executor)

Each export at 320, 390, 1024, 1440 (768 and 1440 for type): width vs viewport, overflow, `fontSize` of the page-title
stand-in (none in the View), one section title, one permission name, one description; edge gap (expected
16/16/32/32). One receipt line per Story in the session log.

### 13.3 `OWNER VISUAL QA REQUIRED` — O84-3

| Story | States | Locales | Viewports | Tuples |
|---|---|---|---|---|
| `Patterns/Mantine/AdminPermissionsView` | `Default`, `Saving`, `AuditUnavailable` | `sq`, `uk` | 390, 1440 | 12 |
| `Patterns/Mantine/AdminPermissionsView` | `Default` | `en`, `it` | 1024 | 2 |

14 tuples. After the deploy, as admin: toggle one permission on `/admin/permissions` and back, and read the audit log.

## 14. Completion report contract

Status per `execute-task`, never self-approved. Changed/new/deleted files with `22` hashes; R1–R9 and AC1–AC8 quoted
with evidence; every command's exit code; the 893 gate quotes; census before/after; GR-0, GR-1, GR-3 (View), GR-3a,
GR-3b, GR-3c, GR-3d receipts; the plant table with hash pairs; deviations and limitations; O84-3 owed. Update the 892
cell of `docs/backlog.md`; session log with "Files Changed". No Git.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable without chat context | yes |
| One active route | yes (Appendix C) |
| Every requirement has an AC | R1→AC1 · R2–R4→AC2 · R5→AC3 · R6→AC4 · R3/R8→AC5 · R9→AC6 · R7→AC7 · all→AC8 |
| Two-armed control | T1–T5 with P1–P3 |
| Detector blind spot stated | census: static imports only; containers print FAIL (§3.2 calibration); `check:story-coverage` sees only enrolled files (GR-2) |
| Owner exception claimed | none |

### 15.1 Canonical UI decision record

| Visible artifact | Searches / inspected | Canonical source | Disposition | Registration |
|---|---|---|---|---|
| Section cards | `FormSection`, `DashboardCard`, §6l | `MantineFormSection` (893), Story `Patterns/Mantine/FormSectionStack` `Section` | **reuse** | — |
| Toggle | `Switch` | `Mantine/Primitives/Switch` | **reuse** | — |
| Count badge, alert | `Badge`, `Alert` | `Mantine/Primitives/Badge`, `Alert` | **reuse** | — |
| Page header | `AdminPageHeader`, `MantineDashboardHeader` | `Patterns/Mantine/AdminPageHeader` | **reuse** | — |
| Page width | `adminPageMaxWidth`, `adminPageFormMaxWidth`, `max-w-2xl` usage | `theme.other.layout` | **extend** | `adminPagePanelMaxWidth` |
| The screen | — | new `AdminPermissionsView` | **compose** | own Story, manifest |

`GR-0 CANONICAL REUSE PREFLIGHT — request: /admin/permissions (permissions View, page wrapper); semantic queries: section card with header action, toggle switch, count badge, warning alert, admin page header, admin page width; inspected candidates: MantineFormSection (Patterns/Mantine/FormSectionStack), MantineDashboardCard, Switch (Mantine/Primitives/Switch), Badge, Alert, AdminPageHeader (Patterns/Mantine/AdminPageHeader), adminPageMaxWidth, adminPageFormMaxWidth; decision: REUSE + EXTEND (adminPagePanelMaxWidth) + COMPOSE (AdminPermissionsView, own Story); selected canonical owner: patterns/MantineFormSectionStack.tsx, theme.other.layout; Mantine/TailAdmin token path: theme spacing xl, fz md/sm/xs, iconSize badge/standard, TailAdmin §6l; new hardcoded visual values: NONE; rationale: every value exists in the theme or a canonical owner.`

`GR-3a STORY PREFLIGHT — AdminPermissionsView × Default/AllAllowed/Saving/AuditEmpty/AuditUnavailable; canonical candidates: NONE (Admin/AdminPermissionsManager renders the legacy component, pins a viewport and is not canonical); direct-import evidence: NONE; toolbar coverage: locale=toolbar, viewport=toolbar; decision: CREATE; target: NONE; rationale: new View.`

`GR-1 CENSUS COMPLETE — 4 nodes today; after: tier1 1 View migrated+enrolled+story + 1 container-exempt (AdminPermissionsManager); tier2 2 imports removed (ui/badge, ui/switch); tier3 none — filed as none.`

## Appendix A — Evidence preflight

| Claim | Source | Status |
|---|---|---|
| Census, 4 nodes | `check-surface-census.mjs`, 2026-09-29 | VERIFIED |
| Containers print FAIL | `/admin/currency` census after 877 | VERIFIED (EXECUTED) |
| Current behaviour | `AdminPermissionsManager.tsx` read in full; `page.tsx` | VERIFIED |
| Registrations | `check-stories-rendered.mjs:220`, `story-coverage-exempt.json:10`, `i18n-dynamic-manifest.json` | VERIFIED |
| 42rem has no token | `theme.ts:813-814` | VERIFIED |

## Appendix B — Rule-compliance ledger

| Rule | Outcome | Result |
|---|---|---|
| 16d / GR-1 | every node dispositioned | COMPLIANT (§3.2, R9) |
| GR-0 / 16b | reuse/extend/compose, no raw value | COMPLIANT (§15.1) |
| GR-3 / 16c / GR-3a | own Story, legacy Story deleted | COMPLIANT (R6) |
| GR-3b / 3c / 3d | tables and lines in the kickoff | COMPLIANT (§12.1, §12.2) |
| component-rules | container/View | COMPLIANT (R1) |
| clause 9 | references rewritten, grep proof | COMPLIANT (R7) |

## Appendix C — Execution contract

| # | Checkpoint | Failure |
|---|---|---|
| 0 | 893 landed; no shared path dirty | `PREMISE DRIFT — 893` / `BLOCKED — SHARED PATH` |
| 1 | Census before | unmigrated node outside R1–R4 → `BLOCKED — CLAUSE 16d` |
| 2 | View + Story | GR-3b/3d receipt missing → `BLOCKED` |
| 3 | Tests + plants | a plant passes → test defect |
| 4 | Gates | non-zero → `PARTIALLY IMPLEMENTED` |
| 5 | Owner | O84-3 returned → revision |

## Appendix D — the reserved-registry row, moved verbatim (2026-09-29)

| # | State | What |
|---|---|---|
| **892** | reserved 2026-09-27 — **Sprint 84**, P3, filed by 885's design (D84-1) | **`/admin/permissions` on canonical Mantine.** Census 2026-09-27: `AdminPermissionsManager` (44 `className`; `ui/badge`, `ui/switch`), no manifest entry, no Story. Its audit-log time (`:185-188`, next-intl `timeStyle: 'short'`) is where 885 adds `hourCycle: 'h23'`. Keep that call findable (885 re-locates it with `git grep "timeStyle"`). Blocks **885**. <!-- kickoff-git-grep:quoted --> |
