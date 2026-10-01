# Task 894 — `/admin/inquiries/sales` and `/admin/inquiries/support` on canonical Mantine

Sprint 84 · **P2** · QA profile **Q3** (legacy admin surface → Mantine; no registered critical flow names it) · no task
dependency (877's `AdminPageHeader` adapter has landed) · blocks **885** · owner action **O84-5** · **Status:
✅ `APPROVED WITH NOTES` 2026-10-02, review 1 (§16); owner accepted the O84-5 matrix; archived**

Sprint plan: [`Sprint_84_One_Clock_And_One_Date_Order.md`](Sprint_84_One_Clock_And_One_Date_Order.md). Reserved
2026-09-27 by 885's design under **D84-1** (*"Migrate first"*); the reserved row moves into Appendix D. Precedents,
read-only: **877** (container/View split, page wrapper), **893** (a shared legacy component keeps its other consumer;
the migrated screen consumes a new canonical one — `AdminUserAvatar` → `AdminUserAvatarField`).

Executor: run this file through `execute-task`. Strongest status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. No Git.

## 1. Mode and task type

`IMPLEMENTATION`, UI migration. Bundles: **UI / Layout / Component (current Mantine path)**, **Storybook / Visual
Proof**, **Component Catalog / Coverage**, **Admin Table / Admin Control**.

- **The `StatusChangeControl` boundary (decision taken here, 893 precedent).** `StatusChangeControl` is rendered by
  this surface **and** by `ListingFormShellView` (`src/modules/listings/components/ListingFormShellView.tsx:17,:317`),
  the listing create/edit form that Sprint 71's reserved **796** migrates. Rewriting the shared file in place would
  change the listing form's visible chrome and pull that whole surface (52 `className`, five steps, ten field
  components) under clause 16d here — 796's scope. So this task creates the canonical **`StatusChangeSelect`**; the
  inquiries dialog consumes it; `StatusChangeControl`, `StatusChangeHistory` and their legacy Stories stay untouched
  for `ListingFormShellView`, and **796 switches the form to `StatusChangeSelect` and deletes them** (recorded on 796's
  reserved row in the same change as this kickoff). No owner decision is claimed: this is the tier-2 treatment clause
  16d already prescribes for a shared legacy file, applied as 893 did.

## 2. Objective

1. Both inquiry routes render the same filters, list, detail dialog (status change, message, reply history, reply
   composer) and toasts as today (§3.3), on canonical Mantine.
2. `AdminInquiriesManager` becomes a container; `AdminInquiriesView`, `InquiryDetailDialogView` and `StatusChangeSelect`
   get their own Stories and manifest entries.
3. Each route's census shows only its root `page.tsx` and the container-exempt `AdminInquiriesManager`.

## 3. Verified context — measured 2026-09-29 (re-measure at I0)

### 3.1 GR-1 census — both routes render the same tree (`sales` and `support`, 11 nodes each)

| Node | Tier | Manifest | Own Story | `className` | `ui/*` | Disposition |
|---|---|---|---|---|---|---|
| `src/app/admin/inquiries/{sales,support}/page.tsx` | 1 (root) | no | no | 1 each | 0 | wrapper → `Box` (R6) |
| `src/components/admin/AdminInquiriesManager.tsx` (364 lines, hash `6cfea53d…`) | 1 | no | no | 42 | 7 | container (R1) + Views (R2, R3) |
| `src/components/admin/StatusChangeControl.tsx` (221 lines, hash `d694871c…`) | 1 | no | legacy `Admin/StatusChangeControl` | 12 | 2 | **not rendered here any more** (R4); file unchanged for `ListingFormShellView` |
| `src/components/admin/StatusChangeHistory.tsx` (77 lines) | 1 | no | legacy `Admin/StatusChangeHistory` | 15 | 0 | leaves this census with `StatusChangeControl`; unchanged |
| `src/components/shared/Combobox.tsx` | 1 | no | no | 21 | 0 | leaves this census (it was reached through `StatusChangeControl`) |
| `AdminPageHeader`, `MantineDashboardHeader` | 1 | yes | yes | 0 | 0 | reused |
| `ui/badge`, `button`, `dialog`, `textarea` | 2 | — | — | — | — | imports removed |

`src/app/admin/inquiries/page.tsx` only redirects to `/support` (1 node, root). **Calibration (FACT, `/admin/currency`
after 877):** containers print FAIL. Expected after, per route: `page.tsx` and `AdminInquiriesManager.tsx`
(`className:0 ui-imports:0`).

### 3.2 The two pages

Identical except the mailbox scope (`sales`: `.ilike('target_mailbox', '%sales%')`; `support`:
`.not('target_mailbox', 'ilike', '%sales%')`), the title key and the `mailboxScope` prop. Each loads ≤ 200 inquiries and
their replies; wrapper `div.p-6.lg:p-8.max-w-5xl.mx-auto` (identical to 877's `/admin/currency` before migration). FACT
(`diff` of the two files, 2026-09-29).

### 3.3 Current behaviour to preserve — `AdminInquiriesManager.tsx`

| Area | Today | Line |
|---|---|---|
| Status filter | `all`/`new`/`in_progress`/`closed` buttons (`filter_<s>`), client-side | `:210-220` |
| Mailbox filter | only when `mailboxScope` is absent: `all`/`support`/`sales` — **unreachable in production** (both routes pass a scope; `/admin/inquiries` redirects) | `:222-234` |
| List | empty → `no_inquiries`; each row a full-width button: status badge with icon, the mailbox in monospace, the subject (`contact.topics.<topic>`, `custom_subject` for `other`, raw topic + `console.warn` if unknown), `name · email`, date (`formatDate`), reply count with `Mail` icon when > 0, chevron | `:238-277` |
| Status colours/icons | new warning `Circle` · in_progress info `AlertCircle` · closed neutral `CheckCircle2` | `:44-54` |
| Dialog | title `detail_title`; metadata box: from (name + email), topic (+ mailbox), received date, `StatusChangeControl variant="select"` (`aria-label` `change_status`, disabled while a reply sends) | `:280-320` |
| Status change | `updateInquiryStatus(id, to)`; an error throws, so the control shows its error toast; success patches list + dialog (the control's own success toast) | `:120-128` |
| Message | `detail_message` + the text, line breaks kept | `:322-330` |
| Replies | none loaded but `reply_count > 0` → warning box `reply_history_load_failed`; else each reply (replier or `from_label`, date, body) | `:332-356` |
| Composer | `reply_label`, textarea (4 rows, `reply_placeholder`), send button (`Send` icon; `sending_reply` while pending; disabled below 5 characters) | `:358-378` |
| Reply result | `reply_email_failed` → reply appended, count + 1, `new` → `in_progress`, `toast.warning`; other error → `reply_error`; success → same patch + `reply_success` | `:130-181` |

`StatusChangeControl` `variant="select"` (`StatusChangeControl.tsx:98-150`): a `Combobox` of the statuses; picking a
different one calls `onSubmit({ toStatus, note: null })` inside a transition; success → `toast.success(status_change_success)`;
a thrown error → `toast.error(status_change_error)`; disabled while pending; optional note + submit when `enableNote`.

### 3.4 Registrations (FACT)

- `scripts/i18n-dynamic-manifest.json` id `admin-inquiries-status`, site `…AdminInquiriesManager.tsx:238`.
- `scripts/story-coverage-exempt.json` — read at I0 whether it names the manager.
- No test names the manager, `sendInquiryReply` or `updateInquiryStatus` (grep over `*.test.ts(x)`).
- `scripts/check-stories-rendered.mjs:138-141` names the legacy `StatusChangeControl`/`StatusChangeHistory` Stories —
  **unchanged** by this task.

### 3.5 Canonical sources inspected (FACT)

| Need | Candidate | Fit |
|---|---|---|
| Status filter | `SegmentedControl` in `ScrollArea` (precedents `AdminUsersTable`, `FavoritesTypeFilter`) | reuse |
| Row list | `AdminTable` (would turn the list into a table on desktop), `MantineDashboardWorkList` (dashboard queue semantics) | rejected; compose `Paper withBorder` + `UnstyledButton` rows + `Divider` |
| Status select control | `StatusChangeControl` (legacy, shared), `MantineSelect` | **create canonical** `StatusChangeSelect` over `MantineSelect` |
| Dialog | `MantineModal` | reuse |
| Textarea, badges, alert | primitives | reuse |
| Header + width | `AdminPageHeader`, `adminPageMaxWidth` | reuse |

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | component-rules P0 | `AdminInquiriesManager` keeps `Props` and all of `:73-189` (state, resync effects, `filtered`, `displaySubject`, `handleStatusChange`, `handleSendReply`, `inquiryStatusOptions`) unchanged in behaviour; renders only `AdminInquiriesView` and `InquiryDetailDialogView`. 0 `className`, 0 `ui/*`. | P1 | AC1 | Confirmed |
| **R2** | §3.3; GR-0 | `src/components/admin/AdminInquiriesView.tsx` (presentational; `useTranslations`, `useLocale`). Root `Stack gap="lg"`. Filter `Group` (`justify="space-between"`, stacked below 640): status `SegmentedControl` in a horizontal `ScrollArea` (`filter_all`, `filter_new`, `filter_in_progress`, `filter_closed`); when `!mailboxScope`, a second `SegmentedControl` (`filter_mailbox_*`). List: empty → `Text size="sm" c="dimmed" ta="center" py="2xl"` `no_inquiries`; else `Paper withBorder radius="lg"` with rows separated by `Divider`; each row an `UnstyledButton` (full width, `p="md"`, `mih={theme.other.touchTarget}`) holding `Group wrap="nowrap" align="flex-start"`: left `Stack gap={4}` (status `Badge variant="light"` new `yellow` / in_progress `blue` / closed `gray` with its icon at `iconSize.badge`, the mailbox `Text size="xs" c="dimmed" ff="monospace"`; subject `Text size="sm" fw={500}` wrapping; `Text size="xs" c="dimmed" lineClamp={1}` name · email); right `Stack gap={4} align="flex-end"` (date `Text size="xs" c="dimmed"`, reply count with `Mail`); `ChevronRight` `c="dimmed"`. | P1 | AC2 | Confirmed |
| **R3** | §3.3 | `src/components/admin/InquiryDetailDialogView.tsx`: `MantineModal size="lg"` (bottom sheet below 640) titled `detail_title`. Metadata `Paper bg="gray.0" p="md" radius="md"` with `SimpleGrid cols={{ base: 1, xs2: 2 }}` of label (`Text size="xs" c="dimmed"`) / value blocks, the fourth cell `StatusChangeSelect`. Section labels (`detail_message`, `detail_replies`, `reply_label`) `Text size="xs" fw={600} c="dimmed" tt="uppercase"`. Message `Paper withBorder p="md" radius="md"` holding `Text size="sm"`; line breaks are kept by splitting the text on `\n` and joining the fragments with `<br />` (no `style` prop). Load-failed notice `Alert color="yellow" variant="light"`. Replies: `Paper withBorder p="md" radius="md"` each, header `Group justify="space-between"` (replier `fw={500} size="xs"`, date), body as the message. Composer: `Textarea autosize minRows={4}` + `Button leftSection={Send}` (`loading`-free; label switches to `sending_reply` while pending, disabled below 5 characters). 0 `className`, 0 `ui/*`, no raw literal, no `style`. | P1 | AC2 | Confirmed |
| **R4** | §1 boundary; GR-0 CREATE (canonical) | `src/components/admin/StatusChangeSelect.tsx` (new, shared canonical control): props `currentStatus`, `statuses: { code; label?; labelKey }[]`, `onSubmit({ toStatus, note })`, `enableNote?`, `submitLabelKey?`, `disabled?`, `aria-label?`. Behaviour identical to `StatusChangeControl`'s `select` variant (§3.3, including both toasts from `admin.common.status_control` and the note path). Render: `MantineSelect` (options from `label ?? t(labelKey)`, `aria-label`), and with `enableNote` a `Textarea autosize minRows={2}` + `Button size="sm" loading` (disabled until the note is non-blank). No `workflow` variant (no production consumer: grep finds it only in the legacy Story). 0 `className`. | P1 | AC3, T3 | Confirmed |
| **R5** | GR-3, GR-3a, GR-3d, 16c | Stories under `src/stories/patterns/mantine/` (`skipCanvas: true`; page exports in `StoryPageGutter`): `Patterns/Mantine/AdminInquiriesView` — `Default` (mixed statuses, a reply count), `Empty`, `Unscoped` (mailbox filter visible), `LongSubject`; `Patterns/Mantine/InquiryDetailDialogView` — `New`, `WithReplies`, `RepliesLoadFailed`, `Sending`; `Patterns/Mantine/StatusChangeSelect` — `Default`, `WithNote`, `Disabled`. All three enrolled in the manifest. | P1 | AC4 | Confirmed |
| **R6** | 877 precedent | Both `page.tsx` wrappers → `<Box p={{ base: 'xl', lg: '2xl' }} maw={layout.adminPageMaxWidth} mx="auto">`; queries and props unchanged. | P2 | AC5 | Confirmed |
| **R7** | clause 9 | `i18n-dynamic-manifest.json` `admin-inquiries-status` site → the View's line. `scripts/story-coverage-exempt.json` entry for the manager removed if present. `docs/backlog-reserved.md`'s 792·794·795·796 row already records (this kickoff's change) that 796 moves `ListingFormShellView` to `StatusChangeSelect` and deletes the legacy pair — the executor verifies the sentence is there and does not edit it. | P1 | AC6 | Confirmed |
| **R8** | Q3 regression (no prior test) | `src/components/admin/__tests__/AdminInquiriesManager.smoke.test.tsx` (real Mantine + intl render; `@/modules/contacts/actions`, toast mocked): **T1** the `closed` segment shows only closed fixture rows; **T2** a reply of 4 characters keeps Send disabled; 5+ calls `sendInquiryReply(id, body)`; **T3** picking `closed` in `StatusChangeSelect` calls `updateInquiryStatus(id, 'closed')` and fires `status_change_success`; a rejected call fires `status_change_error`; **T4** `{ error: 'reply_email_failed', reply }` appends the reply, bumps the count, turns `new` into `in_progress` and fires `toast.warning`; **T5** `reply_count > 0` with no loaded replies shows `reply_history_load_failed`. `src/components/admin/__tests__/StatusChangeSelect.test.tsx`: **T6** the note path (`enableNote`) submits `{ toStatus: current, note }` and clears the note on success. | P0 | AC7 | Confirmed |
| **R9** | GR-1 | FAIL lines after, per route = §3.1 calibration; the three new components `manifest:yes story:yes`; no `StatusChangeControl`, `StatusChangeHistory`, `Combobox` or `ui/*` node; baseline regenerated; removed keys only from these two surfaces; no key added. | P0 | AC8 | Confirmed |

## 5. Assumptions and open questions

1. Visual changes (O84-5): filter buttons become a segmented control; the list chrome follows TailAdmin list rows;
   the dialog is a `MantineModal`; the status control becomes `MantineSelect` (bottom sheet below 640).
2. The unscoped mailbox filter is kept because the component's API offers it, although no route reaches it (§3.3).
3. Open owner questions: none.

## 6. Pre-read rule bundle

`docs/golden-rules.md` · `docs/agent-contract.md` 1, 3–7, 9–16d · `docs/rule-index.md` → the §1 bundles ·
`docs/mantine-responsive-design-system.md` · `docs/tailadmin-style-reference.md` (list rows, overlay footer) ·
`docs/component-rules.md` · `docs/qa-profiles.md` Q3 · the executed 877 and 893 kickoffs, read-only · 818/819 corollary.

## 7. Scope — the exact allowed write set

1. `src/app/admin/inquiries/sales/page.tsx`, `src/app/admin/inquiries/support/page.tsx`
2. `src/components/admin/AdminInquiriesManager.tsx`; new `AdminInquiriesView.tsx`, `InquiryDetailDialogView.tsx`, `StatusChangeSelect.tsx`
3. new Stories `src/stories/patterns/mantine/AdminInquiriesView.stories.tsx`, `InquiryDetailDialogView.stories.tsx`, `StatusChangeSelect.stories.tsx`; fixtures in `src/stories/fixtures/admin.fixtures.ts` (additions only)
4. new tests `src/components/admin/__tests__/AdminInquiriesManager.smoke.test.tsx`, `StatusChangeSelect.test.tsx`
5. `scripts/mantine-migration-scope.json`, `scripts/surface-census-baseline.json`, `scripts/i18n-dynamic-manifest.json`,
   `scripts/story-coverage-exempt.json` (if it names the manager); catalog files if required
6. `docs/sessions/<date>-task894-admin-inquiries-mantine.md`, `docs/sessions/evidence/task894/*`; `docs/backlog.md` 894 cell

## 8. Out of scope

- `StatusChangeControl.tsx`, `StatusChangeHistory.tsx`, their Stories and `check-stories-rendered.mjs:138-141` (796).
- `ListingFormShellView.tsx` (796). `src/modules/contacts/actions/**`, the database, emails.
- The 24-hour clock (885).

## 9. Current and required behavior

| Area | Current | Required after |
|---|---|---|
| Filters, list content, dialog content, reply and status flows, toasts | §3.3 | **unchanged** (T1–T6) |
| Filter chrome | button row | `SegmentedControl` (**changed**) |
| Status control | legacy `Combobox` | `StatusChangeSelect` over `MantineSelect` (**changed**) |
| Dialog | shadcn, `max-w-2xl` | `MantineModal size="lg"` / bottom sheet |
| Listing form's status control | `StatusChangeControl` | unchanged (796) |

## 10. Implementation requirements

### 10.1 I0

1. `win32` platform line; status + hashes → `docs/sessions/evidence/task894/01-*`; a §7 path modified → `BLOCKED — SHARED PATH`.
2. Both censuses → `02`; unmigrated node outside R1–R4 → `BLOCKED — CLAUSE 16d`.
3. `grep -rn "StatusChangeControl" src --include=*.tsx` → `03`: consumers must be exactly this manager and
   `ListingFormShellView` (plus the legacy Story). A new consumer → `PREMISE DRIFT` (report; do not migrate it here).
4. GR-0 and GR-3a receipts (§15.1).

### 10.2 Order

I0 → R4 + its Story + T6 → R2, R3 Views + Stories → R1 container → R6 pages → R8 smoke → plants → R7 → R9 → gates → receipts.

### 10.3 Plants (Node I/O; hash before and after)

| Plant | Edit | Must fail |
|---|---|---|
| **P1** | the Send button's threshold becomes `< 4` | T2 |
| **P2** | `StatusChangeSelect` stops catching the rejected `onSubmit` | T3 (error toast) |
| **P3** | the container patches `status` on `reply_email_failed` without the `new → in_progress` rule | T4 |
| **P4** | re-add `import { Badge } from '@/components/ui/badge'` in `AdminInquiriesView` | census exits 1 naming `ui/badge` |

## 11. Positive and negative flows

**Positive flow.** An admin opens `/admin/inquiries/sales`, filters "new", opens an inquiry, replies; the status turns
"in progress", the reply appears, the count rises; they close it through the status select.

| Branch | Applicable? | Expected | Evidence |
|---|---:|---|---|
| Reply stored, email failed | Yes | warning toast, local patch | T4 |
| Reply error | Yes | `reply_error` | code unchanged (R1) |
| Status error | Yes | `status_change_error` | T3 |
| Replies failed to load | Yes | warning notice | T5 |
| Unknown topic | Yes | raw topic + console warning | code unchanged (R1) |
| Mobile < 640 | Yes | scrollable filter, full-width rows ≥ 44px, bottom-sheet dialog | GR-3b receipts |

## 12. Acceptance criteria

- **AC1 [R1]** Given the container, then it renders only the two Views, with 0 `className`/`ui/*`, and `:73-189` is
  unchanged in behaviour in the diff.
- **AC2 [R2, R3]** Given the two Views, then neither contains `className`, `style`, a `ui/*` import or a raw
  colour/px/rem literal; `check:design-tokens` and `check:enrolled-tailwind` exit 0.
- **AC3 [R4]** Given `StatusChangeSelect.tsx`, then it has 0 `className`, no `ui/*` or `Combobox` import, and
  `StatusChangeControl.tsx`'s hash equals `01`.
- **AC4 [R5]** Given the three Story files, then each imports its component, carries R5's exports without a written
  gutter or viewport pin, and `check:story-coverage` exits 0 with the three enrolled.
- **AC5 [R6]** Given both pages, then each wrapper is the Mantine `Box` with `adminPageMaxWidth` and 0 `className`.
- **AC6 [R7]** Given the manifest files, then the dynamic-key site points at the View and `check:i18n-dynamic` exits 0.
- **AC7 [R8]** Given T1–T6 on the final tree, then all pass; P1–P3 each fail and pass after restore with equal hashes.
- **AC8 [R9, all]** Given `11-census-after.txt`, then each route's FAIL lines are exactly its two calibration lines;
  `npm.cmd run build` exits 0; `typecheck`, `lint`, `check:story-coverage`, `check:rendered-scope`,
  `check:surface-census:changed`, `check:i18n`, `check:file-integrity`, `check:mojibake`, `build-storybook` exit 0.

`GR-4 AC AUDIT — 8 criteria; each states an observable property; absolutes: AC3's unchanged hash of the shared legacy file (the declared boundary, measured by hash).`

### 12.1 Type-scale table (GR-3c)

| Element | Role | base | sm | md | lg | Theme key | Provenance |
|---|---|---|---|---|---|---|---|
| `inquiries_*_title` | page title | 20px | 24px | 24px | 24px | `MantineDashboardHeader` | 877 adapter |
| Subject, message, replies | body | 14px | 14px | 14px | 14px | `sm` | legacy `text-sm` |
| Section labels, meta, dates, mailbox | small | 12px | 12px | 12px | 12px | `xs` | legacy `text-xs` |
| Dialog title | dialog title | — | — | — | — | `MantineModal` | 868 precedent |

### 12.2 Width contract (GR-3b) and gutter (GR-3d)

Parent: the R6 `Box` (cap, fluid). Stories fluid. GR-3d: `AdminInquiriesView`, `StatusChangeSelect` — **wrap in this
task**; `InquiryDetailDialogView` — **n/a: overlay-only**; `Patterns/Mantine/AdminPageHeader` (blast radius) —
**profile present**.

## 13. QA profile and verification plan

**Q3** — legacy admin surface; new real-render tests where none existed.

### 13.1 Final gate block (executor)

```powershell
$ev = "docs\sessions\evidence\task894"
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\09-platform.txt"
node.exe scripts\check-surface-census.mjs --surface src\app\admin\inquiries\sales\page.tsx *>&1 | Tee-Object "$ev\11-census-after.txt"
node.exe scripts\check-surface-census.mjs --surface src\app\admin\inquiries\support\page.tsx *>&1 | Tee-Object -Append "$ev\11-census-after.txt"
npx.cmd vitest run src/components/admin/__tests__/AdminInquiriesManager.smoke.test.tsx src/components/admin/__tests__/StatusChangeSelect.test.tsx *>&1 | Tee-Object "$ev\10-tests.txt"
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
git hash-object src\components\admin\StatusChangeControl.tsx src\components\admin\StatusChangeHistory.tsx src\modules\listings\components\ListingFormShellView.tsx | Tee-Object "$ev\20b-shared-hashes.txt"
git --no-optional-locks status --porcelain | Tee-Object "$ev\21-status-after.txt"
```

Record each exit code; normalise `Tee-Object` files to UTF-8 without BOM; hashes → `22-hash-object.txt`. Expected:
`win32`; two calibration FAIL lines per route; all exits 0; `20b` equals `01` for the three shared files.

### 13.2 Receipts (executor)

GR-3b / GR-3c / GR-3d per export at 320/390/1024/1440 (type 768/1440); edge gap 16/16/32/32 for the two page Stories.

### 13.3 `OWNER VISUAL QA REQUIRED` — O84-5

| Story | States | Locales | Viewports | Tuples |
|---|---|---|---|---|
| `Patterns/Mantine/AdminInquiriesView` | `Default`, `Empty`, `LongSubject` | `sq`, `uk` | 390, 1440 | 12 |
| `Patterns/Mantine/InquiryDetailDialogView` | `New`, `WithReplies`, `RepliesLoadFailed` | `sq`, `uk` | 390, 1440 | 12 |
| `Patterns/Mantine/StatusChangeSelect` | `Default`, `WithNote` | `sq` | 390, 1440 | 4 |
| `Patterns/Mantine/AdminInquiriesView` `Default` | — | `en`, `it` | 1024 | 2 |

30 tuples. After the deploy: reply to one test inquiry on `/admin/inquiries/support` and close it.

## 14. Completion report contract

Status per `execute-task`. Files with hashes; R1–R9/AC1–AC8 with evidence; exit codes; census before/after for both
routes; GR-0, GR-1, GR-3 per component, GR-3a, GR-3b, GR-3c, GR-3d receipts; plants with hash pairs; the shared-file
hashes; limitations; O84-5 owed. Update the 894 cell of `docs/backlog.md`; session log. No Git.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable without chat context | yes |
| Every requirement has an AC | R1→AC1 · R2/R3→AC2 · R4→AC3 · R5→AC4 · R6→AC5 · R7→AC6 · R8→AC7 · R9→AC8 |
| Shared-file boundary stated and measured | §1, AC3, `20b` |
| Two-armed controls | P1–P4 |
| Owner exception claimed | none |

### 15.1 Canonical UI decision record

| Visible artifact | Searches / inspected | Canonical source | Disposition | Registration |
|---|---|---|---|---|
| Status / mailbox filters | `SegmentedControl`, `FavoritesTypeFilter`, `AdminUsersTable` | `Mantine/Primitives/SegmentedControl` | **reuse** | — |
| Inquiry rows | `AdminTable`, `MantineDashboardWorkList`, `UnstyledButton` | primitives | **compose** | in `AdminInquiriesView` |
| Status select control | `StatusChangeControl` (legacy, shared), `MantineSelect` | `patterns/MantineSelect.tsx` | **create canonical** `StatusChangeSelect` | own Story, manifest |
| Detail dialog | `MantineModal` | `Mantine/Primitives/Modal` | **reuse** | — |
| Textarea, badge, alert | primitives | `Mantine/Primitives/*` | **reuse** | — |
| Page chrome | `AdminPageHeader`, `adminPageMaxWidth` | 877 | **reuse** | — |

`GR-0 CANONICAL REUSE PREFLIGHT — request: /admin/inquiries/{sales,support} (list View, detail dialog View, status select control, page wrappers); semantic queries: segmented status filter, clickable list rows, status change select with optional note, modal, textarea, admin page header, admin page width; inspected candidates: SegmentedControl (Mantine/Primitives/SegmentedControl), FavoritesTypeFilter, AdminTable, MantineDashboardWorkList, StatusChangeControl (Admin/StatusChangeControl, legacy), MantineSelect (Mantine/Primitives/Select), MantineModal, Textarea, Badge, Alert, AdminPageHeader, adminPageMaxWidth; decision: REUSE + COMPOSE + CREATE (StatusChangeSelect, because the only candidate is a legacy file shared with the listing form, 796's surface); selected canonical owner: patterns/MantineSelect.tsx, patterns/MantineModal.tsx, theme.other.layout; Mantine/TailAdmin token path: spacing md/lg/xl/2xl, fz sm/xs, iconSize badge, touchTarget; new hardcoded visual values: NONE; rationale: 893 precedent for a shared legacy component with a second surface.`

`GR-3a STORY PREFLIGHT — AdminInquiriesView / InquiryDetailDialogView / StatusChangeSelect × R5 states; canonical candidates: NONE (Admin/StatusChangeControl renders the legacy control and stays for 796); direct-import evidence: NONE; toolbar coverage: locale=toolbar, viewport=toolbar; decision: CREATE; target: NONE; rationale: new components.`

`GR-1 CENSUS COMPLETE — 2 routes × 11 nodes today; after: tier1 3 components migrated+enrolled+story + 1 container-exempt (AdminInquiriesManager); StatusChangeControl/StatusChangeHistory/Combobox leave these censuses (files unchanged for ListingFormShellView → 796); tier2 4 imports removed; tier3 none — filed as none (796 already reserved; its row updated).`

## Appendix A — Evidence preflight

| Claim | Source | Status |
|---|---|---|
| Census, 11 nodes per route | 2026-09-29 runs | VERIFIED |
| Pages differ only by scope | `diff` 2026-09-29 | VERIFIED |
| `StatusChangeControl` consumers | grep of imports | VERIFIED |
| `workflow` variant has no production consumer | grep `variant="workflow"` (legacy Story only) | VERIFIED |
| No existing tests | grep over test files | VERIFIED |

## Appendix B — Rule-compliance ledger

| Rule | Outcome | Result |
|---|---|---|
| 16d / GR-1 | whole surface; shared legacy file tier-2 | COMPLIANT |
| GR-0 | reuse/compose/create with evidence | COMPLIANT |
| GR-3 / 3a / 16c | three own Stories | COMPLIANT |
| GR-3b / 3c / 3d | §12 | COMPLIANT |
| component-rules | container/View | COMPLIANT |

## Appendix C — Execution contract

| # | Checkpoint | Failure |
|---|---|---|
| 0 | I0 (incl. consumer check) | `BLOCKED` / `PREMISE DRIFT` |
| 1 | `StatusChangeSelect` + T6 | fails → fix before Views |
| 2 | Views + Stories | receipts missing → `BLOCKED` |
| 3 | Smoke + plants | a plant passes → test defect |
| 4 | Gates | non-zero → `PARTIALLY IMPLEMENTED` |
| 5 | O84-5 | returned → revision |

## Appendix D — the reserved-registry row, moved verbatim (2026-09-29)

| # | State | What |
|---|---|---|
| **894** | reserved 2026-09-27 — **Sprint 84**, P2, filed by 885's design (D84-1); its predecessor **877** landed 2026-09-29 | **`/admin/inquiries/{sales,support}` on canonical Mantine.** Census 2026-09-27: `AdminInquiriesManager` (42 `className`, 7 `ui/*` bindings), `StatusChangeControl` (12, 2), `StatusChangeHistory` (15, 0); `Combobox` (import removed here via `MantineSelect`, as 893 does; the file stays for its other consumers) and `AdminPageHeader` (877). Tier-2: `ui/badge`, `button`, `dialog`, `textarea`. **`StatusChangeControl` is also rendered by `ListingFormShellView`**: its migration changes that surface too, so the kickoff censuses the listing form as well. Blocks **885**. |

## 16. Review 1 — 2026-10-02, Opus: ✅ `APPROVED WITH NOTES`

Owner, 2026-10-02, verbatim: *"візуально перевірив нові сторіси, все ок"*. That accepts **O84-5**'s matrix (§13.3). The
post-deploy reply-and-close check stays owed on O84-5.

- **R1–R9 / AC1–AC8 verified** against the final tree. The hashes in `22-hash-object.txt` equal the working tree. The
  container's `:73-189` diff only retypes the filter state and drops the badge/icon fields from the status options.
  `20b` equals `01` for `StatusChangeControl`, `StatusChangeHistory` and `ListingFormShellView`. `11-census-after.txt`
  shows only `page.tsx` and `AdminInquiriesManager` (both `className:0 ui-imports:0`) failing per route. P1–P4 each
  fail as planted and have equal restore hashes. Storybook was built at 23:05:57, after the last source edit
  (23:05:29). `npm run build` ran at 23:12 and exited 0.
- **Reviewer measurement.** Chromium on the built `storybook-static`, `sq` + `uk`, 320/390/768/1024/1440, all 11
  exports. Both page Stories have gutters top/bottom 24 and left/right 16/16/24/32/32. No export overflows. The
  largest text is 16px (the modal title). The dialog is 320/390 wide as a bottom sheet and 620 from 768. Rows stack
  the date/count column under the text at 320/390 (every row) and sit side by side at 768/1440.
- **Deviations accepted.**
  1. `blueLight`: `blue` is not in `theme.ts:607` `colors`.
  2. The row stacks below 640, per GR-3b's 2026-10-01 owner rule, which postdates R2.
  3. The two extra i18n-dynamic sites pointed at the moved code.
  4. Rows have no hover tint (as in 892 N1).
  5. The visible `change_status` caption matches the other three metadata cells.
- **Note N1 (P3, accepted with the matrix).** The Stories pass `custom_subject ?? topic` as the subject, so a `sales`
  or `partnership` fixture row shows the raw topic code. Production shows `contact.topics.<topic>`. The fixture
  diverges from production, and no production defect follows from it.
- **Note N2.** The 907 reserved row said "whichever runs first migrates `StatusChangeControl`". After 894, the listing
  form is its last consumer, so that row now points at `StatusChangeSelect`.
