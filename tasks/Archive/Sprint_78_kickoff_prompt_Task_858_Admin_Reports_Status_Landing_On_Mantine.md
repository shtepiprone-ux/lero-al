# Task 858 — `/admin/reports` honours `?status=` and moves to canonical Mantine

**Sprint 78** (Wave E — landings) · **P2** · QA profile **Q4** (legacy surface → Mantine on the registered critical flow
"Report listing") · no task dependency (877's adapters have landed; 858 does not render `AdminTable` today) · owner
action **O78-11** · **Status: ✅ `APPROVED WITH NOTES` 2026-10-01, review 3 — owner accepted every O78-11 tuple (§19); archived.**

Sprint plan: [`Sprint_78_Admin_And_Agent_Dashboards_On_Canonical_Mantine.md`](../Sprints/Sprint_78_Admin_And_Agent_Dashboards_On_Canonical_Mantine.md)
("Execution order" item 6). Precedents, read-only: **877** (container/View split, `AdminTable` and `AdminPageHeader`
adapters, page wrapper) and **868** (`MantineModal` confirms).

Executor: run this file through `execute-task`. Strongest status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. No Git.

## 1. Mode and task type

`IMPLEMENTATION`, UI migration + URL-driven filter. Bundles: **UI / Layout / Component (current Mantine path)**,
**Storybook / Visual Proof**, **Component Catalog / Coverage**, **Regression / Critical Flow Coverage**, **Admin Table /
Admin Control**.

- **Why the whole manager migrates.** The deliverable changes the manager's visible filter state, so clause 16d puts
  every component the route renders in scope (Sprint 78 plan, "Why 857–859 are reserved").
- **Current/legacy boundary.** Today `AdminReportsManager` (508 lines, 75 `className`, 15 `ui/*` bindings: `badge`,
  `button`, `dialog`, `label`, `select`, `textarea`) and the root wrapper are legacy. After: containers with 0
  `className` and two Views with their own Stories.

## 2. Objective

1. `/admin/reports?status=<pending|reviewed|resolved|dismissed|all>` opens on that tab; the ADM-02 card
   (`pendingReportsHref()` → `/admin/reports?status=pending`, `src/modules/admin/dashboard/hrefs.ts:34-36`) lands filtered.
   Changing the tab writes `?status=` back to the URL.
2. The list, the detail dialog (status override, notes, review/resolve/dismiss, reopen, delete + confirm) and every
   toast behave as today (§3.3), on canonical Mantine.
3. The census shows only the root `page.tsx` and the container-exempt `AdminReportsManager` / `ReportDetailDialog`.

## 3. Verified context — measured 2026-09-29 (re-measure at I0)

### 3.1 GR-1 census — `node.exe scripts\check-surface-census.mjs --surface src\app\admin\reports\page.tsx`

| Node | Tier | Manifest | Own Story | `className` | `ui/*` | Disposition |
|---|---|---|---|---|---|---|
| `src/app/admin/reports/page.tsx` | 1 (root) | no | no | 1 | 0 | wrapper → `Box` (R6), reads `searchParams` (R1) |
| `src/components/admin/AdminReportsManager.tsx` (hash `2b54e947…`) | 1 | no | legacy `Admin/AdminReportsManager` | 75 | 15 | containers (R2, R3) + Views (R4, R5) |
| `src/components/admin/AdminPageHeader.tsx` | 1 | yes | yes | 0 | 0 | reused |
| `src/components/shared/RelativeTime.tsx` | 1 | yes | yes | 0 | 0 | reused |
| `patterns/MantineDashboardHeader`, `MantineTooltip`, `responsiveBottomSheet` | 1 | yes | yes | 0 | 0 | reached through reused nodes |
| `ui/badge`, `button`, `dialog`, `label`, `select`, `textarea` | 2 | — | — | — | — | imports removed |

**Calibration (FACT, `/admin/currency` after 877):** the census prints `FAIL [tier1-unenrolled-or-unstoried]` for the
root `page.tsx` and for every pure container (it cannot see the GR-1 container exemption). Expected after this task:
`page.tsx`, `AdminReportsManager.tsx`, `ReportDetailDialog.tsx` (both containers `className:0 ui-imports:0`).

### 3.2 URL today

`page.tsx` reads no search params and loads up to 200 rows ordered by `created_at desc`; the manager's filter starts at
`'pending'` (`useState<StatusFilter>('pending')`) and never reads or writes the URL. So `?status=pending` lands on the
right tab **by accident** and every other value is ignored. FACT (both files read in full).

### 3.3 Current behaviour to preserve — `AdminReportsManager.tsx`

| Area | Today | Line |
|---|---|---|
| Tabs | `all`, `pending`, `reviewed`, `resolved`, `dismissed`; label `filter_<f>`; a count pill when `counts[f] > 0` (counts over all loaded rows) | `:411-434` |
| List | columns reason (`listing.report_reason_<r>`), listing title (from `md`), reporter or `anonymous` (from `lg`), status badge, date `RelativeTime` (from `sm`); row click opens the dialog; empty → `empty` | `:436-484` |
| Status colours | pending warning · reviewed neutral · resolved success · dismissed destructive | `:52-57` |
| Dialog rows | status badge; reason; listing link (new tab, `/${locale}/listings/<slug>`) or `—`; owner name + `open_profile` link `/admin/users/<id>`, or `owner_not_found`; reporter or `anonymous`; comment or italic `no_comment`; date | `:141-221` |
| Override | when `canOverrideReportStatus`: `change_status_label` + select of the 4 statuses + `action_apply` (disabled while pending or unchanged), `data-testid="status-override-section"` | `:224-254` |
| Moderator actions | when `pending`/`reviewed`: notes textarea (max 500, `notes_placeholder`); `action_review` (only when `pending`), `action_dismiss` (destructive outline), `action_resolve`; each shows a spinner and all disable while pending | `:257-306` |
| Reopen | terminal status + override capability: `action_reopen` → `pending`, `data-testid="reopen-btn"` | `:309-321` |
| Delete | `canDeleteReports`: `action_delete` (`data-testid="delete-btn"`) → confirm dialog (`delete-confirm-dialog`, title `confirm_delete_title`, body `confirm_delete_body`, cancel + `action_confirm_delete` `confirm-delete-btn`) | `:324-376` |
| Close | only when not open and no override capability: ghost `close` | `:336-340` |
| Results | update: error → mapped toast (`forbidden`/`unauthorized`/`conflict`/`not_found`, else `error_update_failed`); success → `success_updated`, local status patch, dialog closes. Delete: error → mapped toast, confirm closes; success → `success_deleted`, row removed, dialog closes | `:93-121`, `:397-404` |
| Root | `data-testid="admin-reports-manager"` | `:409` |

### 3.4 Registrations and tests naming the current file (FACT)

- Legacy Story `src/components/admin/AdminReportsManager.stories.tsx` (title `Admin/AdminReportsManager`; exports
  `Default`, `LocaleStress`, `DialogOwnerRow`, `FullManagement`, `TerminalReopen`, `DeleteConfirm`).
- `scripts/check-stories-rendered.mjs:213-218` — five entries `admin-adminreportsmanager--*` with testid anchors
  `admin-reports-manager`, `status-override-section`, `reopen-btn`, `delete-btn`, a `dialog-content` slot and an owner
  link selector.
- `scripts/story-coverage-exempt.json:12`; `scripts/i18n-dynamic-manifest.json` sites `…AdminReportsManager.tsx:96` and `:253`.
- `src/components/admin/__tests__/AdminReportsManager.smoke.test.tsx` — 11 tests (owner row ×4, capability controls ×5,
  forbidden toasts ×2). It **mocks** `@/components/ui/dialog`, `ui/select`, `ui/badge` with stand-ins (`:40-72`).
- `docs/critical-flow-registry.md:67` "Report listing" cites those UI tests (*"UI capability controls (5 tests …)"*).

### 3.5 Canonical sources inspected (FACT)

| Need | Candidate | Fit |
|---|---|---|
| Tabs with counts | Mantine `Tabs` (precedent `AdminUsersTable.tsx:426-441`), Story `Mantine/Primitives/Tabs` | reuse |
| List/cards | `AdminTable` (877 adapter over `MantineDataTableToCards`: `onRowClick`, `visibility`, `cardRow`) | reuse |
| Dialogs | `MantineModal` (bottom sheet below 640), Story `Mantine/Primitives/Modal` | reuse |
| Status select | `MantineSelect`, Story `Mantine/Primitives/Select` | reuse |
| Notes | Mantine `Textarea`, Story `Mantine/Primitives/Textarea` | reuse |
| Badges, buttons, alerts | primitives with their Stories | reuse |
| Header + wrapper | `AdminPageHeader`; `adminPageMaxWidth` (legacy `p-6 lg:p-8 max-w-5xl`, identical to 877's `/admin/currency`) | reuse |

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | reserved row; §3.2 | `page.tsx` takes `searchParams`, reads `status`, and passes `initialFilter` = the value when it is one of `all`/`pending`/`reviewed`/`resolved`/`dismissed`, else `'pending'` (today's default). The query, limit and permissions reads are unchanged. | P1 | T1, T3 | Confirmed |
| **R2** | component-rules P0 | `AdminReportsManager` (container) keeps its props plus `initialFilter`, `reports` state and the `useEffect` resync, `counts`, `filtered`, `handleUpdated`, `handleDeleted`. Tab change: `setFilter(f)` and `router.replace(\`${pathname}?${params}\`, { scroll: false })` with `status=f`, other params kept. Renders only `AdminReportsView` and, when `selected`, `ReportDetailDialog`. 0 `className`, 0 `ui/*`. | P1 | T2, AC1 | Confirmed |
| **R3** | component-rules P0 | `src/components/admin/ReportDetailDialog.tsx` (container, extracted from `:62-379`): keeps `notes`, `selectedStatus`, `showDeleteConfirm`, `isPending`, `ERROR_KEYS`, `handleAction`, `handleDelete` byte-for-byte in behaviour; renders only `ReportDetailDialogView`. | P1 | T4–T10 | Confirmed |
| **R4** | §3.3; GR-0 | `src/components/admin/AdminReportsView.tsx` (presentational; `useTranslations` only). Root `Stack gap="md"` `data-testid="admin-reports-manager"`. `Tabs value={filter} onChange` with one `Tabs.Tab` per filter; when `counts[f] > 0`, `rightSection` = `Badge size="sm" variant={active ? 'filled' : 'light'} color={active ? 'brand' : 'gray'}`; the list inside a horizontal `ScrollArea` as in `AdminUsersTable`. List through `AdminTable`: columns `reason` (always), `listing` (`visibility: 'md'`), `reporter` (`'lg'`), `status` (always; `Badge variant="light"` pending `yellow`, reviewed `gray`, resolved `green`, dismissed `red`), `date` (`'sm'`, `RelativeTime`); `onRowClick={onSelect}`; `cardRow` = title reason, subtitle status badge + date, meta listing title · reporter; `emptyState` = `Text size="sm" c="dimmed" ta="center"` `empty`. No hand-written `<table>`. | P1 | AC2 | Confirmed |
| **R5** | §3.3; 868 precedent | `src/components/admin/ReportDetailDialogView.tsx` (presentational). `MantineModal opened title={<Group gap="xs"><Flag …/>{detail_title}</Group>}`. Body `Stack gap="sm"`: label/value rows as `Group justify="space-between" wrap="nowrap"` (label `Text size="sm" c="dimmed"`); listing `Anchor` (new tab, `ExternalLink` at `iconSize.badge`, `lineClamp={1}`); owner row `Stack` with name and an `Anchor` `open_profile` (min touch target from the theme); comment in `Paper bg="gray.0" p="sm" radius="md"`, italic dimmed when empty; override section (`data-testid="status-override-section"`): `MantineSelect` of the 4 statuses (label `change_status_label`) + `Button` `action_apply` (`loading`, `disabled` rules unchanged), stacked below 640 and in one row from `sm`; notes `Textarea` `autosize minRows={2} maxLength={500}`; action `Group justify="flex-end"` (`wrap`, full-width buttons below 640): review `variant="outline"`, dismiss `variant="outline" color="red"`, resolve filled — each `loading={isPending}`; reopen `Button variant="outline" leftSection={RotateCcw}` `data-testid="reopen-btn"`; footer `Group` (top `Divider`): delete `variant="outline" color="red"` `data-testid="delete-btn"`, close `variant="subtle"`. The delete confirm is a second `MantineModal` with `data-testid="delete-confirm-dialog"`: title `confirm_delete_title` in `c="red"`, body `confirm_delete_body`, footer cancel `variant="default"` + `Button color="red"` `data-testid="confirm-delete-btn"` `loading`. 0 `className`, 0 `ui/*`, no raw literal. | P1 | AC2 | Confirmed |
| **R6** | 877 precedent | `page.tsx` wrapper → `<Box p={{ base: 'xl', lg: '2xl' }} maw={layout.adminPageMaxWidth} mx="auto">` (`const layout = theme.other!.layout!`, as in `src/app/admin/currency/page.tsx`). `AdminPageHeader` unchanged. | P2 | AC3 | Confirmed |
| **R7** | GR-3, GR-3a, GR-3d, 16c | Stories under `src/stories/patterns/mantine/`, `skipCanvas: true`, every page export in `StoryPageGutter` (overlay-only exports need none — GR-3d): `Patterns/Mantine/AdminReportsView` — `Default` (pending tab, 3 rows), `AllTab`, `Empty`; `Patterns/Mantine/ReportDetailDialogView` — `Pending` (moderator actions), `FullManagement` (override + delete), `TerminalReopen`, `OwnerMissing`, `DeleteConfirm`, `Saving`. Fixtures move from the legacy Story. Both Views enrolled in the manifest. The legacy Story is deleted (its `LocaleStress` export is not carried over: locale comes from the toolbar). | P1 | AC4 | Confirmed |
| **R8** | clause 9 | `check-stories-rendered.mjs:213-218` → ids `patterns-mantine-adminreportsview--default`, `patterns-mantine-reportdetaildialogview--{pending,full-management,terminal-reopen,delete-confirm}` with the same testid anchors (the `dialog-content` slot becomes the `MantineModal` content testid it renders; read the pattern and name it); `story-coverage-exempt.json:12` removed; `i18n-dynamic-manifest.json` sites → the Views' lines. | P1 | AC5 | Confirmed |
| **R9** | Q4; memory rule "no legacy tests — migrate instead" | `AdminReportsManager.smoke.test.tsx` is **migrated**: the `ui/*` stand-in mocks go; the 11 existing assertions run against the real Mantine render (`MantineProvider` + project theme, `NextIntlClientProvider` with `messages/en.json`, actions/toast/navigation mocked), same names and expectations, selecting by role or the preserved testids. New: **T1** `initialFilter='resolved'` shows only resolved rows and the resolved tab selected; **T2** clicking the `reviewed` tab calls `router.replace` with `status=reviewed` and keeps another param present in the mocked search params; **T3** `page.tsx`'s parse (exported pure helper `parseReportStatusParam`) maps `'bogus'`, `undefined` and `['a','b']` to `'pending'` and each valid value to itself. `docs/critical-flow-registry.md:67` gains *"Task 858: the UI tests run on the Mantine Views (no primitive mocks); + URL filter T1–T3."* | P0 | AC6 | Confirmed |
| **R10** | GR-1 | FAIL lines after the change = §3.1 calibration; both Views `manifest:yes story:yes`; the six tier-2 keys leave the baseline; no key added; regenerate with `npm.cmd run check:surface-census:changed:update-baseline`. | P0 | AC7 | Confirmed |

## 5. Assumptions and open questions

1. Visual changes (O78-11): tabs become Mantine `Tabs` with count badges; the table becomes the shared adapter (cards
   below 640); dialogs become `MantineModal` (bottom sheet below 640). Text and outcomes do not change.
2. INFERENCE: `router.replace` (not `push`) is chosen so tab clicks do not stack history entries; the dashboard link is
   still a normal navigation.
3. Open owner questions: none.

## 6. Pre-read rule bundle

`docs/golden-rules.md` (GR-0 … GR-6, container exemption) · `docs/agent-contract.md` 1, 3–7, 9–16d ·
`docs/rule-index.md` → the §1 bundles · `docs/mantine-responsive-design-system.md` · `docs/tailadmin-style-reference.md`
(§6b tables, overlay footer) · `docs/component-rules.md` · `docs/qa-profiles.md` Q4 · `docs/critical-flow-registry.md:67`
· the executed 877 and 868 kickoffs, read-only · `docs/orchestrator-procedures.md` → 818/819 corollary.

## 7. Scope — the exact allowed write set

1. `src/app/admin/reports/page.tsx`
2. `src/components/admin/AdminReportsManager.tsx`; new `ReportDetailDialog.tsx`, `AdminReportsView.tsx`, `ReportDetailDialogView.tsx`, `reportStatusFilter.ts` (added by review 1, §16) (all in `src/components/admin/`)
3. new `src/stories/patterns/mantine/AdminReportsView.stories.tsx`, `ReportDetailDialogView.stories.tsx`; deleted `src/components/admin/AdminReportsManager.stories.tsx`
4. `src/components/admin/__tests__/AdminReportsManager.smoke.test.tsx` (migrated)
5. `scripts/mantine-migration-scope.json`, `scripts/story-coverage-exempt.json`, `scripts/surface-census-baseline.json`,
   `scripts/check-stories-rendered.mjs` (`:213-218`), `scripts/i18n-dynamic-manifest.json`; catalog files only if required
6. `docs/critical-flow-registry.md` (row `:67`)
7. `docs/sessions/<date>-task858-admin-reports-mantine.md`, `docs/sessions/evidence/task858/*`
8. `docs/backlog.md` — the 858 cell only

## 8. Out of scope

- `src/modules/listings/actions/reportListing.ts` (server actions and their 20 guard tests), the database, RLS.
- The public report dialog (`ReportListingDialog`) — Sprint 71's 795.
- Server-side filtering: the page still loads ≤ 200 rows and filters client-side (unchanged).

## 9. Current and required behavior

| Area | Current | Required after |
|---|---|---|
| `?status=` | ignored (pending by default) | selects the tab; tab clicks write it |
| Actions, toasts, capability gating, delete confirm | §3.3 | **unchanged** (11 migrated tests) |
| Tabs | underlined buttons + pills | Mantine `Tabs` + count `Badge` (**changed**) |
| List | hand-written table | `AdminTable` adapter; cards below 640 (**changed**) |
| Dialogs | shadcn | `MantineModal` (**changed**), same text and testids |

## 10. Implementation requirements

### 10.1 I0

1. `node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()"` → `win32`.
2. Status + hashes → `docs/sessions/evidence/task858/01-*`. A §7 path modified → `BLOCKED — SHARED PATH`.
3. Census → `02-census-before.txt`; unmigrated node outside R2–R5 → `BLOCKED — CLAUSE 16d`.
4. Baseline tests → `03-tests-before.txt`: `npx.cmd vitest run src/components/admin/__tests__/AdminReportsManager.smoke.test.tsx src/modules/listings/actions/__tests__/deleteReport.smoke.test.ts src/modules/listings/actions/__tests__/reportListing.smoke.test.ts` (exit 0 expected).
5. GR-0 and GR-3a receipts (§15.1).

### 10.2 Order

I0 → R4/R5 Views → R7 Stories → R3, R2 containers → R1, R6 page → R9 tests → plants → R8 → R10 → gates → receipts.

### 10.3 Plants (Node I/O; hash before and after)

| Plant | Edit | Must fail |
|---|---|---|
| **P1** | the container ignores `initialFilter` (starts at `'pending'`) | T1 |
| **P2** | tab change uses `setFilter` only (no `router.replace`) | T2 |
| **P3** | `ReportDetailDialogView` renders the delete action without `canDeleteReports` | "both caps false → no Delete" |
| **P4** | re-add `import { Badge } from '@/components/ui/badge'` in `AdminReportsView` and render it | census exits 1 naming `ui/badge` |

## 11. Positive and negative flows

**Positive flow.** An admin clicks the ADM-02 card on `/admin`, lands on `/admin/reports?status=pending` with the pending
tab selected, opens a report, adds a note and resolves it; the row's badge turns resolved; clicking "Resolved" writes
`?status=resolved`.

| Branch | Applicable? | Expected | Evidence |
|---|---:|---|---|
| Unknown / array `status` | Yes | pending tab | T3 |
| Forbidden / conflict / not found | Yes | mapped toasts | existing 2 tests + code unchanged (R3) |
| No capabilities | Yes | no override, reopen or delete | migrated test |
| Delete cancel / Esc / backdrop | Yes | report kept | migrated tests |
| Mobile < 640 | Yes | cards; bottom-sheet dialogs; full-width actions ≥ 44px | GR-3b receipts |
| Locale expansion | Yes | no overflow | O78-11 |

## 12. Acceptance criteria

- **AC1 [R2, R3]** Given the two containers, then each renders only its View, with 0 `className` and 0 `ui/*` imports,
  and the action/toast logic of `:93-121`, `:385-404` is unchanged in the diff.
- **AC2 [R4, R5]** Given the two Views, then neither contains `className`, a `ui/*` import, a `<table>` or a raw
  colour/px/rem literal; `check:design-tokens` and `check:enrolled-tailwind` exit 0.
- **AC3 [R6]** Given `page.tsx`, then the wrapper is the Mantine `Box` with `adminPageMaxWidth` and 0 `className`.
- **AC4 [R7]** Given the two Story files, then each imports its View, carries R7's exports, has no written gutter or
  viewport pin, and `check:story-coverage` exits 0 with both Views enrolled.
- **AC5 [R8]** Given the tree, then the legacy Story is gone and `git grep --untracked -n "admin-adminreportsmanager\|AdminReportsManager.stories"` prints nothing outside history paths.
- **AC6 [R1, R9]** Given the migrated test file on the final tree, then the 11 original tests and T1–T3 pass with no
  `vi.mock('@/components/ui/…')`; P1–P3 each fail and pass after restore with equal hashes.
- **AC7 [R10]** Given `11-census-after.txt`, then the FAIL lines are exactly the three calibration lines and the baseline
  diff removes only tier-2 keys and the manager's old key text.
- **AC8 [all]** `npm.cmd run build` exits 0; `typecheck`, `lint`, `check:story-coverage`, `check:rendered-scope`,
  `check:surface-census:changed`, `check:i18n`, `check:i18n-dynamic`, `check:file-integrity`, `check:mojibake`,
  `build-storybook` exit 0.

`GR-4 AC AUDIT — 8 criteria; each states an observable property; absolutes: AC5's empty grep over live paths (the declared deletion audit, read with --untracked).`

### 12.1 Type-scale table (GR-3c)

| Element | Role | base | sm | md | lg | Theme key | Provenance |
|---|---|---|---|---|---|---|---|
| `reports_title` | page title | 20px | 24px | 24px | 24px | `MantineDashboardHeader` | 877 adapter |
| Tab labels | label | 14px | 14px | 14px | 14px | Tabs default `sm` | theme |
| Table cells, dialog rows | body | 14px | 14px | 14px | 14px | `size="sm"` | legacy `text-sm` |
| Dialog title | dialog title | — | — | — | — | `MantineModal` contract | 868 precedent |
| Count badges, dates | small | 12px | 12px | 12px | 12px | `Badge size="sm"`, `size="xs"` | legacy `text-xs` |

### 12.2 Width contract (GR-3b) and gutter (GR-3d)

Parent: the R6 `Box` (cap; fluid below). Stories are fluid. GR-3d per owner-matrix Story:
`Patterns/Mantine/AdminReportsView` — **wrap in this task**; `Patterns/Mantine/ReportDetailDialogView` — **n/a:
overlay-only**; `Patterns/Mantine/AdminPageHeader` (blast radius) — **profile present**.

## 13. QA profile and verification plan

**Q4** — a legacy surface on the registered critical flow "Report listing" migrates; its UI tests are migrated, not
dropped, and the URL filter gains tests.

### 13.1 Final gate block (executor)

```powershell
$ev = "docs\sessions\evidence\task858"
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\09-platform.txt"
node.exe scripts\check-surface-census.mjs --surface src\app\admin\reports\page.tsx *>&1 | Tee-Object "$ev\11-census-after.txt"
npx.cmd vitest run src/components/admin/__tests__/AdminReportsManager.smoke.test.tsx src/modules/listings/actions/__tests__/deleteReport.smoke.test.ts src/modules/listings/actions/__tests__/reportListing.smoke.test.ts *>&1 | Tee-Object "$ev\10-tests.txt"
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
git --no-optional-locks grep --untracked -n -E "admin-adminreportsmanager|AdminReportsManager\.stories" -- . ":!docs/sessions/**" ":!tasks/Archive/**" ":!docs/backlog-archive.md" | Tee-Object "$ev\20b-reference-audit.txt"
git --no-optional-locks status --porcelain | Tee-Object "$ev\21-status-after.txt"
```

Record each exit code; normalise `Tee-Object` files to UTF-8 without BOM through Node; hashes of every changed/new file
in `22-hash-object.txt`. Expected: `win32`; three calibration FAIL lines; all exits 0; `20b` empty.

### 13.2 Receipts (executor)

GR-3b, GR-3c, GR-3d per Story export at 320/390/1024/1440 (type at 768/1440): width vs viewport, overflow, tab label,
one cell, dialog row font sizes; edge gap 16/16/32/32 for `AdminReportsView`.

### 13.3 `OWNER VISUAL QA REQUIRED` — O78-11

| Story | States | Locales | Viewports | Tuples |
|---|---|---|---|---|
| `Patterns/Mantine/AdminReportsView` | `Default`, `AllTab`, `Empty` | `sq`, `uk` | 390, 1440 | 12 |
| `Patterns/Mantine/ReportDetailDialogView` | `Pending`, `FullManagement`, `TerminalReopen`, `DeleteConfirm` | `sq`, `uk` | 390, 1440 | 16 |
| `Patterns/Mantine/AdminReportsView` `Default` | — | `en`, `it` | 1024 | 2 |

30 tuples. After the deploy: click the ADM-02 card on `/admin` and confirm the pending tab is selected and the URL reads
`?status=pending`; resolve one test report.

## 14. Completion report contract

Status per `execute-task`. Files with hashes; R1–R10/AC1–AC8 with evidence; every exit code; census before/after; GR-0,
GR-1, GR-3 (both Views), GR-3a, GR-3b, GR-3c, GR-3d receipts; plants with hash pairs; where each of the 11 original
tests now selects its element; limitations; O78-11 owed. Update the 858 cell of `docs/backlog.md`; session log. No Git.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable without chat context | yes |
| Every requirement has an AC | R2/R3→AC1 · R4/R5→AC2 · R6→AC3 · R7→AC4 · R8→AC5 · R1/R9→AC6 · R10→AC7 · all→AC8 |
| Critical-flow proof kept | the 11 UI tests migrated (R9), action tests unchanged |
| Two-armed controls | P1–P4 |
| Owner exception claimed | none |

### 15.1 Canonical UI decision record

| Visible artifact | Searches / inspected | Canonical source | Disposition | Registration |
|---|---|---|---|---|
| Status tabs + counts | `Tabs`, `SegmentedControl`, `AdminUsersTable` tabs | `Mantine/Primitives/Tabs`, `Badge` | **reuse** | — |
| List / cards | `AdminTable`, `MantineDataTableToCards` | `Patterns/Mantine/AdminTable` | **reuse** | — |
| Detail + confirm dialogs | `MantineModal`, `MantineDialogDrawerPattern`, 868 confirms | `Mantine/Primitives/Modal` | **reuse** | — |
| Status select, notes | `MantineSelect`, `Textarea` | `Mantine/Primitives/Select`, `Textarea` | **reuse** | — |
| Page chrome | `AdminPageHeader`, `adminPageMaxWidth` | 877 | **reuse** | — |
| The screens | — | new `AdminReportsView`, `ReportDetailDialogView` | **compose** | own Stories, manifest |

`GR-0 CANONICAL REUSE PREFLIGHT — request: /admin/reports (list View, detail dialog View, page wrapper, URL filter); semantic queries: status tabs with counts, admin data table to cards, modal confirm, status select, textarea, admin page header, admin page width; inspected candidates: Tabs (Mantine/Primitives/Tabs), SegmentedControl, AdminTable (Patterns/Mantine/AdminTable), MantineDataTableToCards, MantineModal (Mantine/Primitives/Modal), MantineDialogDrawerPattern, MantineSelect (Mantine/Primitives/Select), Textarea, Badge, AdminPageHeader, adminPageMaxWidth; decision: REUSE + COMPOSE (two Views with own Stories); selected canonical owner: components/admin/AdminTable.tsx, patterns/MantineModal.tsx, patterns/MantineSelect.tsx, theme.other.layout; Mantine/TailAdmin token path: spacing sm/md/xl/2xl, fz sm/xs, iconSize badge/standard, TailAdmin §6b; new hardcoded visual values: NONE; rationale: every value exists in the theme or a canonical owner.`

`GR-3a STORY PREFLIGHT — AdminReportsView / ReportDetailDialogView × R7 states; canonical candidates: NONE (Admin/AdminReportsManager renders the legacy component and is not canonical); direct-import evidence: NONE; toolbar coverage: locale=toolbar, viewport=toolbar; decision: CREATE; target: NONE; rationale: new Views; the legacy Story is deleted in the same task.`

`GR-1 CENSUS COMPLETE — 13 nodes today; after: tier1 2 Views migrated+enrolled+story + 2 container-exempt (AdminReportsManager, ReportDetailDialog), AdminPageHeader/RelativeTime reused; tier2 6 imports removed; tier3 none — filed as none.`

## Appendix A — Evidence preflight

| Claim | Source | Status |
|---|---|---|
| Census, 13 nodes | 2026-09-29 run | VERIFIED |
| URL ignored; default pending | `page.tsx` and manager read in full | VERIFIED |
| Test mocks the primitives | smoke test `:40-72` | VERIFIED |
| ADM-02 href | `hrefs.ts:34-36` | VERIFIED |
| Containers print FAIL | `/admin/currency` census | VERIFIED (EXECUTED) |

## Appendix B — Rule-compliance ledger

| Rule | Outcome | Result |
|---|---|---|
| 16d / GR-1 | whole surface in scope | COMPLIANT |
| GR-0 / 16b | reuse/compose | COMPLIANT |
| GR-3 / 3a / 16c | two own Stories, legacy deleted | COMPLIANT |
| GR-3b / 3c / 3d | §12 | COMPLIANT |
| clause 15 | critical-flow UI tests migrated | COMPLIANT (R9) |
| memory "no legacy tests" | primitive mocks removed | COMPLIANT |

## Appendix C — Execution contract

| # | Checkpoint | Failure |
|---|---|---|
| 0 | I0 | `BLOCKED` |
| 1 | Views + Stories | receipt missing → `BLOCKED — GR-3b/3d` |
| 2 | Containers + tests | a migrated test fails → fix before plants |
| 3 | Plants | a plant passes → test defect |
| 4 | Gates | non-zero → `PARTIALLY IMPLEMENTED` |
| 5 | O78-11 | returned → revision |

## 16. Review 1 — 2026-10-01 — `PARTIALLY VERIFIED`

Opus reviewed the diff, every new or changed file, the plants and the gate transcripts. The final build and Storybook
build ran after the last source edit, and the current `git hash-object` of every file equals
`evidence/task858/22-hash-object.txt`. Independent native re-runs (win32, v22.22.3) gave: tests 52/52 · census = the
three §3.1 calibration FAIL lines · `check:story-coverage` exit 0. The reviewer's Chromium measurement over
`storybook-static`, all nine exports at 320/390/768/1024/1440, shows no page overflow, text ≤ 16px, dialog buttons
≥ 44px, a full-width bottom sheet below 640 and a 440px centred modal from 768. `AdminReportsView` edges are
24/16/·/16 at 320–390, 24/24/·/24 at 768 and 24/32/·/32 at 1024–1440, with nothing at 0.

**Why not approved:** the visual criterion is `NOT VERIFIABLE` until the owner returns O78-11 (§13.3, 30 tuples).
Nothing else blocks.

**Executor deviations accepted, as kickoff defects corrected here:**
- R9/T3: Next forbids extra exports from a page file. `parseReportStatusParam` therefore lives in
  `src/components/admin/reportStatusFilter.ts`, which joins the §7 write set.
- R10: "no key added" contradicted §3.1, which names `ReportDetailDialog.tsx` as a calibration FAIL. The one added
  baseline key `page.tsx :: ReportDetailDialog.tsx` is the correct result.
- §7 / R10: the `check:surface-census:changed:update-baseline` npm alias needs a base. The executor ran
  `node scripts/check-surface-census-changed.mjs --base HEAD --update-baseline`.
- AC5: the grep's remaining hits are historical paths only (`docs/reviews/artifacts/**`, old Epic and Sprint
  kickoffs). It has no hits in `src`, `scripts`, `.github`, `.storybook` or `package.json`.

**Notes (P3 / NOTE, none blocking):**
- **P3 — table scrolls sideways inside its frame at 768 (833 vs 718px) and 1024 (973 vs 958px).** `AdminTable` cells
  are `nowrap` by default and the listing title is long. From 1280 nothing scrolls. The O78-11 1024 tuple will show
  this. If the owner returns it, the fix is `wrap: true` on the `listing` column (Task 891's `TableColumn.wrap` API),
  with no new value.
- **P3 — the session log has no `Files Changed` table.** `22-hash-object.txt` lists 16 paths but omits the deleted
  legacy Story, the session log and the evidence folder. Add the table before approval.
- **NOTE —** plant P3 ran against `ReportDetailDialogView` hash `6245a9ea…`. The shipped hash is `af86f8e2…`, edited
  after the plant. The asserting test is unchanged and passes on the shipped file, so the plant result holds as
  INFERENCE.
- **NOTE —** each tab click is a `router.replace` (R2). It re-runs the server page: the 200-row query and two
  permission reads. The `useEffect` then replaces local rows with fresh ones. The behaviour is correct, but it costs
  one query per click (INFERENCE from App Router semantics for a dynamic page).
- **NOTE (census blind spot, not this task's):** `AdminReportsManager` reports `story:yes` only because both Stories
  `import type { ReportRow }` from it. A type-only import counts as a Story import. The census still FAILs it on
  `manifest:no`, so nothing is hidden here.

**Approval path:** the owner returns O78-11 accepted and Sonnet adds the `Files Changed` table, then Opus approves
and archives. If the owner returns any tuple, that is a revision.

## 17. Revision 1 — the detail dialog gets an order (owner return at O78-11, 2026-10-01)

**Executor: start here. §1–§15 stay binding unless this section replaces them. Re-entry mode: `remediation`.**
Do not touch `AdminReportsView`, its Story, the containers, `page.tsx` or the census baseline. Do not re-run plants
P1, P2 or P4.

### 17.1 Owner decision, verbatim (2026-10-01)

On `AdminReportsView` (Default, AllTab, Empty × sq/uk × 390/1440): *"приймаю."*
On `ReportDetailDialogView` (Pending, FullManagement, TerminalReopen, DeleteConfirm × sq/uk × 390/1440): *"не приймаю.
Це суто барахолка функціоналу, немає балансу, немає порядку."*
The screenshot is `Pending`, uk, at about 733px.
On `AdminReportsView` `Default` × en/it × 1024 (the remaining §13.3 row; the table scrolls 15px inside its frame at
1024, review 1 §16): *"сама таблиця ок, приймаю."* With that, `AdminReportsView` is fully accepted: 14 of its 14
tuples. The review 1 P3 on the table's inner scroll is closed by this decision, and no `wrap` change is made.

### 17.2 What is wrong — measured on the shipped View (FACT, `ReportDetailDialogView.tsx` hash `af86f8e2…`)

| # | Defect | Source |
|---|---|---|
| D1 | Seven facts use three layouts: right-aligned label/value rows (status, reason, listing, reporter, date), a stacked block (owner) and a captioned paper (comment). No grid, so the values do not line up. | `:107-178` |
| D2 | Date row: the caption is `size="xs"` (12px), but `RelativeTime` is `inherit`, so the value renders at the body's 16px. It is the largest text in the body. | `:175-178` |
| D3 | The owner link has `lh={touchTarget}`, a 44px line box, which leaves a 44px hole between "Власник" and "Скаржник". | `:142-155` |
| D4 | The listing link wraps its `ExternalLink` icon onto its own line. | `:120-138` |
| D5 | The comment caption reuses the public form's `listing.report_comment_label` ("Додаткові деталі (необов'язково)"). An admin reads the reporter's comment, not an optional field. | `:167` |
| D6 | Actions are spread through the body in three places: transitions `:219-250`, reopen `:254-269`, delete/close `:271-291`. `MantineModal`'s own `footer` slot is unused. | `:97-293` |
| D7 | A body-level `Divider` with nothing after it when the footer group is empty (Pending without delete, as in the screenshot). | `:271-272` |
| D8 | The Story fixture date `2026-09-28` reads "за 2 місяці" (a future date) on the owner's clock. | Story `:39` |

### 17.3 Required layout (R11–R15 — replace R5's body and footer; R5's testids, gating rules, `loading`/`disabled` rules and the delete confirm's behaviour stay)

The body is `Stack gap="lg"` with exactly these zones, in order. One text grammar applies everywhere in the body:
**caption** = `Text size="xs" c="dimmed"`, **value** = `Text size="sm" fw={500}`, with caption above value in
`Stack gap="tight"` (4px).

- **R11 — Facts.** `SimpleGrid cols={2} spacing="md" verticalSpacing="md"` with four cells, in reading order:
  - status (the `Badge` as the value);
  - reason;
  - reporter (or `anonymous`);
  - date (`RelativeTime` wrapped in `Text size="sm" fw={500}` so it no longer inherits 16px — D2).

  Every value is start-aligned under its caption. No right-aligned values. Fixes D1 and D2.
- **R12 — Listing card.** `Paper withBorder radius="md" p="sm"` containing a `Stack gap="sm"`:
  1. Caption `col_listing`.
  2. The listing `Anchor` (new tab, `size="sm" fw={500}`). Its title is `lineClamp={2}` inside
     `Group gap="tight" wrap="nowrap" align="flex-start"`, with the `ExternalLink` icon (`iconSize.badge`) after the
     text as a sibling, never wrapping alone. Without a listing, the value is `—`.
  3. A `Group justify="space-between" wrap="nowrap" align="center"` with two children:
     - left: caption `col_owner` over value owner name, or `owner_not_found` dimmed;
     - right: when the owner exists, `Button component={Link} variant="subtle" size="compact-sm"` `open_profile`. Its
       touch target comes from the Button theme, not `lh`.

  The owner belongs to the listing, so it lives in this card. Fixes D3 and D4.
- **R13 — Reporter's comment.** Caption: the new key `admin.reports.comment_label`. Value:
  `Paper bg="gray.0" p="sm" radius="md"` with `Text size="sm"`, or italic dimmed `no_comment`. The View no longer reads
  `listing.report_comment_label`. Fixes D5.
- **R14 — Moderation section**, rendered only when `isOpen || canOverrideReportStatus`:
  - `Divider label={t('section_moderation')} labelPosition="left"`;
  - when `isOpen`, the notes `Textarea`, unchanged;
  - when `canOverrideReportStatus`, `data-testid="status-override-section"`: `MantineSelect` + `action_apply`, stacked
    below 640 and one row from `sm` (unchanged).

  No body element follows this section. No body `Divider` exists anywhere else. Fixes D7.
- **R15 — Every action in `MantineModal footer`.** The footer root is
  `Flex data-testid="report-dialog-footer" direction={{ base: 'column-reverse', sm: 'row' }} justify="space-between" gap="sm"`.
  - **Start side** (`sm`+ left; bottom below 640): `delete-btn`, when `canDeleteReports`, as
    `variant="subtle" color="red"` with `Trash2`. When there is no delete, render an empty `Box` so the end group
    stays right-aligned.
  - **End side:** `Flex direction={{ base: 'column-reverse', sm: 'row' }} gap="sm"` holding, in DOM order:
    - when `isOpen`: review (`variant="default"`, pending only), dismiss (`variant="outline" color="red"`), resolve
      (filled);
    - when `isTerminal && canOverrideReportStatus`: `reopen-btn` (`variant="outline"`, `RotateCcw`);
    - when `!isOpen && !canOverrideReportStatus`: close (`variant="default"`).

    Below 640, the primary action (resolve or reopen) is therefore on top, and every button is `w="100%"`.
  - Fixes D6.
- **R16 — Delete confirm.** Same behaviour and testids. Its buttons move into that modal's `footer` slot, with the
  same `column-reverse`/`row` composition and cancel as `variant="outline" color="gray"`. That matches
  `AdminUserProfileDialogsView.tsx:44-61` `ConfirmFooter`, which is a local function, so compose it; do not import or
  extract it. The title is `Group gap="xs" c="red.7"` with `AlertTriangle` (`iconSize.standard`) + `confirm_delete_title`.
  `delete-confirm-dialog` stays on the body `Stack`.
- **R17 — i18n.** `admin.reports.comment_label` and `admin.reports.section_moderation` in all four locales:

  | key | en | uk | sq | it |
  |---|---|---|---|---|
  | `comment_label` | Reporter's comment | Коментар скаржника | Komenti i raportuesit | Commento del segnalatore |
  | `section_moderation` | Moderation | Модерація | Moderimi | Moderazione |

  Update `scripts/i18n-dynamic-manifest.json` if line numbers move.
- **R18 — Story fixture.** In `ReportDetailDialogView.stories.tsx`, `created_at` becomes `2026-01-15T10:30:00Z`, a
  past date on any plausible clock (D8). There are no other Story changes: exports, `useLocale()` and the no-gutter
  overlay-only rule stay.

### 17.4 Type scale (replaces §12.1's dialog rows)

| Element | base | sm+ | Theme key |
|---|---|---|---|
| Modal title | 16 | 16 | `MantineModal` contract |
| Captions (facts, listing, owner, comment), divider label | 12 | 12 | `size="xs"` |
| Values, listing link, comment, notes, select, buttons | 14 | 14 | `size="sm"` |
| Status badge | 12 | 12 | `Badge size="sm"` |

No body text may render at 16px or above (the title is not body).

### 17.5 Acceptance criteria (AC9–AC14; AC1–AC8 stay)

- **AC9 [R11]** In `Pending`, `FullManagement` and `TerminalReopen` at 390 and 1440, the four fact cells form two
  rows of two:
  - cells 1–2 share a top, and cells 3–4 share a top (±1px);
  - the two column widths are equal (±1px);
  - each value's left edge equals its caption's left edge (±1px).
- **AC10 [R15]** In those three stories plus `OwnerMissing`, every visible `button` other than the modal close, the
  `MantineSelect` input and R14's `action_apply` inside `status-override-section` (corrected by review 2, §18) is a descendant of `[data-testid="report-dialog-footer"]`. At 1440, the end group's last
  button's right edge and the footer's right edge are equal (±1px). At 390, every footer button's width equals the
  footer width (±1px), and the first button in visual order is resolve (`Pending`) or reopen (`TerminalReopen`).
- **AC11 [R11–R13, 17.4]** At 320, 390 and 1440, `getComputedStyle().fontSize` of every body text node is 12 or 14,
  and the date value is 14.
- **AC12 [R14]** The body's last element is the moderation section, or the comment block when the section is absent.
  The body contains no `hr`/`Divider` other than R14's labelled one.
- **AC13 [R17, R13]** `check:i18n` exits 0. A grep finds `report_comment_label` 0 times in
  `ReportDetailDialogView.tsx` and `comment_label` once.
- **AC14 [R9]** The 14 tests pass with unchanged names. Plant **P3** is re-run against the final
  `ReportDetailDialogView.tsx` hash, then restored to an equal hash. A selector may change only if the rendered role
  or name changed; record each change.

`GR-4 AC AUDIT — 6 new criteria; each states an observable property with a ±1px tolerance where geometric; absolutes: AC13's 0-count grep of a removed key in one file.`

### 17.6 Write set (revision 1 only)

1. `src/components/admin/ReportDetailDialogView.tsx`
2. `src/stories/patterns/mantine/ReportDetailDialogView.stories.tsx` (fixture date only)
3. `messages/en.json`, `messages/uk.json`, `messages/sq.json`, `messages/it.json` (two keys under `admin.reports`)
4. `scripts/i18n-dynamic-manifest.json` (line numbers only, if moved)
5. `src/components/admin/__tests__/AdminReportsManager.smoke.test.tsx` (only per AC14)
6. `docs/sessions/2026-10-01-task858-admin-reports-mantine.md`: append a `Revision 1` section **and** the `Files
   Changed` table owed from review 1, covering every task path in `git status --short`
7. `docs/sessions/evidence/task858/rev1/*`
8. `docs/backlog.md`: the 858 cell only

### 17.7 Gate block (revision 1)

```powershell
$ev = "docs\sessions\evidence\task858\rev1"
New-Item -ItemType Directory -Force $ev | Out-Null
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\00-platform.txt"
npx.cmd vitest run src/components/admin/__tests__/AdminReportsManager.smoke.test.tsx src/modules/listings/actions/__tests__/deleteReport.smoke.test.ts src/modules/listings/actions/__tests__/reportListing.smoke.test.ts *>&1 | Tee-Object "$ev\01-tests.txt"
node.exe scripts\check-surface-census.mjs --surface src\app\admin\reports\page.tsx *>&1 | Tee-Object "$ev\02-census.txt"
npm.cmd run typecheck *>&1 | Tee-Object "$ev\03-typecheck.txt"
npm.cmd run lint *>&1 | Tee-Object "$ev\04-lint.txt"
npm.cmd run check:design-tokens *>&1 | Tee-Object "$ev\05-design-tokens.txt"
npm.cmd run check:enrolled-tailwind *>&1 | Tee-Object "$ev\06-enrolled-tailwind.txt"
npm.cmd run check:i18n *>&1 | Tee-Object "$ev\07-i18n.txt"
npm.cmd run check:i18n-dynamic *>&1 | Tee-Object "$ev\08-i18n-dynamic.txt"
npm.cmd run check:story-coverage *>&1 | Tee-Object "$ev\09-story-coverage.txt"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\10-file-integrity.txt"
npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\11-mojibake.txt"
npm.cmd run build-storybook *>&1 | Tee-Object "$ev\12-storybook-build.txt"
npm.cmd run build *>&1 | Tee-Object "$ev\13-build.txt"
git --no-optional-locks status --porcelain | Tee-Object "$ev\14-status.txt"
```

Expected: `win32`; tests 52/52; census = the same three calibration FAIL lines (exit 1, as in review 1); every other
command exits 0. Then:
- run the AC9–AC12 measurement in Chromium over `storybook-static` for `Pending`, `FullManagement`, `TerminalReopen`,
  `OwnerMissing` and `DeleteConfirm` at 320/390/1024/1440 (sq and uk at 390 and 1440), into `$ev\20-layout.json`;
- emit GR-3b and GR-3c receipts per export, and `GR-3d … n/a: overlay-only`;
- write `git hash-object` of every revision-1 file into `$ev\21-hash-object.txt` in the same pass;
- normalise every `Tee-Object` file to UTF-8 without BOM through Node.

### 17.8 Owner re-review — O78-11 (revision 1)

| Story | States | Locales | Viewports | Tuples |
|---|---|---|---|---|
| `Patterns/Mantine/ReportDetailDialogView` | `Pending`, `FullManagement`, `TerminalReopen`, `DeleteConfirm` | `sq`, `uk` | 390, 1440 | 16 |
| ~~`Patterns/Mantine/AdminReportsView` `Default` × `en`, `it` × 1024~~ | accepted by the owner 2026-10-01 (§17.1) | — | — | 0 |

The reviewer measures AC9–AC12 and GR-3b/3c before handing this matrix to the owner.

## 18. Review 2 — revision 1 — 2026-10-01 — `PARTIALLY VERIFIED`

Opus inspected `ReportDetailDialogView.tsx` (hash `d30c5bd5…`, equal to `rev1/21-hash-object.txt`), the four
`messages/*.json` diffs (two keys each), the Story fixture date (`2026-01-15`) and the `rev1/` gate transcripts. The
gates are all exit 0 except the census, which shows the three calibration FAIL lines. The builds ran after the last
source edit. Plant P3 ran on the final hash and was restored to an equal hash. The independent native re-run gave
tests 52/52, and AC13's grep finds `report_comment_label` 0 times and `comment_label` once.

The reviewer's Chromium measurement covered `Pending`, `FullManagement`, `TerminalReopen`, `OwnerMissing`,
`DeleteConfirm` and `Saving` at 320/1024 (en) and 390/1440 (sq, uk), 36 runs in all:
- **AC9 true in all 36 runs.**
- **AC10:** no action outside the footer, with Apply excepted per R14. The last button is right-aligned at every
  width. Below 640, every button is footer-wide, with Resolve or Reopen first. Every button is 44px tall, including
  the owner's "open profile".
- **AC11:** body text is 12 or 14 only, and the date is 14. The title is 16 on desktop and 14 in the bottom sheet,
  per the `MantineModal` contract.
- **AC12:** one `Divider`, the labelled one.
- No page overflow and no horizontal scroll inside the dialog. The dialog is 320/390 full-width below 640 and 440px
  from 1024. GR-3d: overlay-only.

**Kickoff defect corrected:** AC10 required every button except the close and the Select input to sit in the footer,
which contradicted R14 (Apply stays beside the Select). AC10 now excludes R14's Apply. The executor kept R14
correctly.

**Accepted:** three delete-confirm tests now find the confirm's buttons through
`findByRole('dialog', { name: 'Delete report?' })`. AC14 allows this because the buttons moved to the modal footer,
outside `delete-confirm-dialog`. Test names are unchanged.

**Open:** O78-11 revision-1 matrix (§17.8), 16 tuples:
`ReportDetailDialogView` `Pending`, `FullManagement`, `TerminalReopen`, `DeleteConfirm` × sq/uk × 390/1440.
If the owner accepts, Opus approves and archives. If the owner returns any tuple, that is a revision.

## 19. Review 3 — 2026-10-01 — ✅ `APPROVED WITH NOTES`

The owner accepted the O78-11 revision-1 matrix on 2026-10-01, verbatim: `ReportDetailDialogView` `Pending`,
`FullManagement`, `TerminalReopen`, `DeleteConfirm` × sq/uk × 390/1440 — *"приймаю"*. With §17.1, every O78-11 tuple
is accepted:
- `AdminReportsView`: 14 tuples;
- `ReportDetailDialogView`: 16 tuples.

The evidence is unchanged since review 2: the `ReportDetailDialogView.tsx` hash is still `d30c5bd5…`.

**Notes (non-blocking):**
- Each tab click re-runs the server page (`router.replace`, R2): one 200-row query per click.
- The census counts a Story's `import type` as a Story import, which is why `AdminReportsManager` shows
  `story:yes`. The census still FAILs it on `manifest:no`.

**Open, outside this task:** the after-deploy half of O78-11 stays an open Sprint 78 owner item: the ADM-02 card lands
on `?status=pending`, and resolving one test report works.

## Appendix D — the reserved-registry row, moved verbatim (2026-09-29)

| # | State | What |
|---|---|---|
| **858** | reserved 2026-09-18 — **Sprint 78**, P2 | **`/admin/reports` ignores URL filters**, so the ADM-02 card lands unfiltered. `src/app/admin/reports/page.tsx` reads no search params and loads 200 rows; `AdminReportsManager.tsx` is 508 lines, legacy. Deliverable: honour `?status=pending` (847 `hrefs.ts`). Clause 16d census first. |
