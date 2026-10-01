# Task 894 — `/admin/inquiries/{sales,support}` on canonical Mantine (session log, 2026-10-01)

Kickoff: `tasks/Archive/Sprint_84_kickoff_prompt_Task_894_Admin_Inquiries_On_Mantine.md` · Sprint 84 · QA Q3 · executor Sonnet 5.5.
**Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`** (owner matrix **O84-5** owed). Evidence: `docs/sessions/evidence/task894/`.

## Receipts

`CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.`

`GR-0 CANONICAL REUSE PREFLIGHT — request: /admin/inquiries/{sales,support} (list View, detail dialog View, status select control, page wrappers); semantic queries: segmented status filter, clickable list rows, status change select with optional note, modal, textarea, admin page header/width; inspected candidates: SegmentedControl (AdminUsersTable.tsx:462-507), AdminReportsView/ReportDetailDialogView (+ Stories), AdminTable, MantineDashboardWorkList, StatusChangeControl (legacy, shared with ListingFormShellView), MantineSelect, MantineModal, AdminPageHeader, adminPageMaxWidth; decision: REUSE + COMPOSE + CREATE (StatusChangeSelect); selected canonical owner: patterns/MantineSelect.tsx, patterns/MantineModal.tsx, theme.other.layout; Mantine/TailAdmin token path: spacing md/lg/xl/2xl/tight, fz sm/xs, iconSize.badge/compact, touchTarget; new hardcoded visual values: NONE; rationale: 893 precedent for a shared legacy component with a second consumer.`

`GR-3a STORY PREFLIGHT — AdminInquiriesView / InquiryDetailDialogView / StatusChangeSelect × R5 states; canonical candidates: NONE (only Admin/StatusChangeControl, legacy, stays for 796); direct-import evidence: NONE; toolbar coverage: locale=toolbar, viewport=toolbar; decision: CREATE; target: NONE; rationale: new components.`

`GR-1 CENSUS COMPLETE — 2 routes × 11 nodes before (02-census-before-*), 10 after (11-census-after.txt); tier1 3 components migrated+enrolled+story + 1 container-exempt (AdminInquiriesManager); StatusChangeControl/StatusChangeHistory/Combobox leave these censuses (files unchanged: 20b equals 01); tier2 4 imports removed (ui/badge, button, dialog, textarea); tier3 none.`

`GR-2 SCOPE STATED — check:story-coverage inspects enrolled components only; it cannot see unenrolled children; the criterion is closed by the census (11-census-after.txt: three new nodes manifest:yes story:yes) and the three own Story files.`

`GR-3 STORY PROVEN — AdminInquiriesView ← src/stories/patterns/mantine/AdminInquiriesView.stories.tsx; InquiryDetailDialogView ← src/stories/patterns/mantine/InquiryDetailDialogView.stories.tsx; StatusChangeSelect ← src/stories/patterns/mantine/StatusChangeSelect.stories.tsx.`

`GR-3b STORY RESPONSIVE CHECK` (measured on built storybook-static, Chromium, `30-story-measurements.json`, `31-gaps-and-sizes.json`; component width / parent width):
- `Patterns/Mantine/AdminInquiriesView` (Default, Empty, Unscoped, LongSubject): 320 288/320 · 390 358/390 · 1024 960/1024 · 1440 1376/1440 (the parent is the `StoryPageGutter`); overflow: none (also sq/uk/it at 320/390); fixed-width containers: NONE; style objects: NONE; viewport pins: NONE; side-by-side sections below 640: NONE — the row's date/count column sits below the subject at 320/390 (date top 193 > subject bottom 163, same left 33) and beside it from 768; the two filters stack below 640 (`Flex direction={{ base: 'column', sm: 'row' }}`).
- `Patterns/Mantine/StatusChangeSelect` (Default, WithNote, Disabled): 288/320 · 358/390 · 960/1024 · 1376/1440; overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE; side-by-side sections below 640: NONE.
- `Patterns/Mantine/InquiryDetailDialogView` (New, WithReplies, RepliesLoadFailed, Sending): dialog 320/320 · 390/390 (bottom sheet) · 768 620/768 · 1024 620/1024 · 1440 620/1440 (`size="lg"`); overflow: none, dialog overflow none (also sq/uk/it at 320/390); fixed-width containers: NONE; style objects: NONE; viewport pins: NONE; side-by-side sections below 640: NONE (metadata `SimpleGrid cols={{ base: 1, xs2: 2 }}`).

`GR-3c TYPE RESPONSIVE CHECK` (kickoff §12.1; no heading or title element in the Views, so nothing is ≥ 24px; the dialog title is the `MantineModal` title):
- AdminInquiriesView: subject / message-type body 14px at 320 · 390 · 768 · 1440; meta (mailbox, name · email, date, count) 12px at all four; filter labels 14px; ≥24px text without a responsive step: NONE; heading above 20px below 640 (non-hero): NONE; child heading larger than page title: NONE.
- StatusChangeSelect: input 14px, note textarea 14px, submit label 14px at all four widths; same three NONE.
- InquiryDetailDialogView: body 14px, section labels and captions 12px, modal title 16px at 320 · 390 · 768 · 1440 (`30-story-measurements.json` `sizes`); same three NONE. (The 16px entries in `31-gaps-and-sizes.json` come from Mantine's emitted `<style>` text and the hidden radio inputs, not from visible text.)

`GR-3d STORY GUTTER CHECK` (`31-gaps-and-sizes.json`, `32-gutter-bottom.txt`):
- AdminInquiriesView (4 exports) and StatusChangeSelect (3 exports): gutter `StoryPageGutter all` (the Views and the control set no page gutter on any side — the real page's gutter is the route `Box`); top/right/bottom/left 320 24/16/24/16 · 390 24/16/24/16 · 1024 24/32/24/32 · 1440 24/32/24/32 (expected 24, 16/16/32/32, 24); side at 0: NONE; doubled gutter: NONE; gutter written in the Story: NONE.
- InquiryDetailDialogView: gutter `n/a: overlay-only`.
- `Patterns/Mantine/AdminPageHeader` (blast radius in the kickoff §12.2): profile present, untouched by this task.

## Requirement and acceptance evidence

| ID | Evidence |
|---|---|
| R1 / AC1 | `AdminInquiriesManager.tsx`: props, state, resync effects, `filtered`, `displaySubject`, `handleStatusChange`, `handleSendReply` unchanged in behaviour; renders only `AdminInquiriesView` and `InquiryDetailDialogView`; census `className:0 ui-imports:0`. |
| R2, R3 / AC2 | Views carry no `className`, `style`, `ui/*` import or raw literal; `17-design-tokens.txt`, `17b-enrolled-tailwind.txt` exit 0. |
| R4 / AC3 | `StatusChangeSelect.tsx`: 0 `className`, no `ui/*`/`Combobox`; `20b-shared-hashes.txt` equals `01-status-hashes.txt` (`d694871c…`, `2f443c45…`, `edcb3baf…`). |
| R5 / AC4 | Three Story files; 11 exports; `14-story-coverage.txt` exit 0 with the three enrolled. |
| R6 / AC5 | Both pages: `Box p={{ base: 'xl', lg: '2xl' }} maw={layout.adminPageMaxWidth} mx="auto"`, 0 `className`. |
| R7 / AC6 | `i18n-dynamic-manifest.json`: `admin-inquiries-filter` → View:85, `admin-inquiries-filter-mailbox` → View:97, `admin-inquiries-status` → View:131 (the kickoff names only the status site; the other two pointed at the same manager and moved with it); `story-coverage-exempt.json` entry removed; the 796 sentence is present in `backlog-reserved.md` and untouched; `17d-i18n-dynamic.txt` exit 0. |
| R8 / AC7 | `10-tests.txt`: 9 tests pass (T1–T5 in the smoke file with T3 in two cases, T6 plus two more in `StatusChangeSelect.test.tsx`). Plants below. |
| R9 / AC8 | `11-census-after.txt`: per route exactly `page.tsx` and `AdminInquiriesManager.tsx`; three new components `manifest:yes story:yes`; no `StatusChangeControl`/`StatusChangeHistory`/`Combobox`/`ui/*` node; `20-baseline-diff.txt`: 14 keys removed, 0 added (both routes' Control/History/Combobox/four `ui/*`); no i18n key added. |

## Plants (Node I/O, hash before / planted / restored; transcripts `05-plant-P*.txt`)

| Plant | Result | Hash before = restored |
|---|---|---|
| P1 Send threshold `< 4` | T2 fails (1 failed, 8 passed) | `b10c0360…` equal |
| P2 `StatusChangeSelect` stops catching a rejected `onSubmit` | T3 error-toast case and the select's own rejected-note case fail (2 failed) | `44898610…` equal |
| P3 container patches `status` without `new → in_progress` on `reply_email_failed` | T4 fails (1 failed) | `f938a5d1…` equal |
| P4 legacy `Badge` imported and rendered in `AdminInquiriesView` | census prints `FAIL src/components/ui/badge.tsx [tier2-legacy-primitive]`, exit 1 | `288e5141…` equal (the final View hash is `9a15a70b…` after the later row-layout edit) |

P4's first attempt (an import with no JSX use) was not counted by the census, which follows rendered tags; the plant was changed to render the `Badge`.

## Validation (all unpiped; `EXIT_CODE=` on the last line of each file)

`09-platform` win32 v22.22.3 · `10-tests` 0 · `11-census-after` 1 per route (the two calibration lines) · `12-typecheck` 0 · `13-lint` 0 · `14-story-coverage` 0 · `15-rendered-scope` 0 · `16-census-changed` 0 (`--base HEAD`, same deviation 858/896 recorded: the npm script needs `--base`) · `17-design-tokens` 0 · `17b-enrolled-tailwind` 0 · `17b2-type-responsive` 0 · `17c-i18n` 0 · `17d-i18n-dynamic` 0 · `18-file-integrity` 0 · `18b-mojibake` 0 · `19-storybook-build` 0 (includes `check:stories`) · `19b-build` 0.

## Deviations and limitations

1. **`in_progress` badge colour is `blueLight`, not `blue`.** `check:stories` check 15 rejects an unregistered Mantine colour (`blue` is absent from `theme.ts`'s registered set), and `build-storybook` failed on it. `blueLight` is the registered blue.
2. **Dialog is unmounted on close** (`{selected && <InquiryDetailDialogView …/>}`, `opened` constant) rather than animating out; same shape as `ReportDetailDialogView`.
3. **List rows have no hover background**: a hover state needs CSS or `style`, which GR-0 forbids for new UI; no canonical row-hover token exists.
4. **Row layout.** The kickoff's R2 places the date/count column beside the text column at every width. GR-3b (owner rule 2026-10-01, after the kickoff) forbids that below 640, so the two sit in a `Flex direction={{ base: 'column', sm: 'row' }}`; below 640 the date and count form a row under the text. Opus to confirm.
5. **`StatusChangeSelect` shows a visible caption `change_status` in the dialog** above the select, plus the same `aria-label`; the legacy control had no visible label. Existing key, none added.
6. Evidence files `02-*` and `03-*` first carried a BOM (PowerShell redirect); stripped from exactly those three paths, `18-file-integrity` re-run clean.
7. Not done and not claimed: the 30 owner tuples of §13.3 (`OWNER VISUAL QA REQUIRED`); the post-deploy reply-and-close check.

## Files changed

`src/app/admin/inquiries/{sales,support}/page.tsx` (Box wrapper) · `src/components/admin/AdminInquiriesManager.tsx` (container) · new `AdminInquiriesView.tsx`, `InquiryDetailDialogView.tsx`, `StatusChangeSelect.tsx` · new Stories `AdminInquiriesView`, `InquiryDetailDialogView`, `StatusChangeSelect` under `src/stories/patterns/mantine/` · `src/stories/fixtures/admin.fixtures.ts` (additions only: `FIXTURE_INQUIRIES`, `FIXTURE_INQUIRY_REPLIES`) · new tests `AdminInquiriesManager.smoke.test.tsx`, `StatusChangeSelect.test.tsx` · `scripts/mantine-migration-scope.json`, `scripts/surface-census-baseline.json`, `scripts/i18n-dynamic-manifest.json`, `scripts/story-coverage-exempt.json` · `docs/backlog.md` (894 cell) · this log · `docs/sessions/evidence/task894/*`. Hashes: `22-hash-object.txt`.

## Opus handoff

Inspect: the container diff against `:73-189` of the original (R1); deviation 1 (`blueLight`) and deviation 4 (row layout); that `StatusChangeControl.tsx`, `StatusChangeHistory.tsx` and `ListingFormShellView.tsx` hashes equal `01`; `20-baseline-diff.txt` removes only the two routes' keys. Owner matrix **O84-5** (30 tuples, §13.3) is owed.

## Backlog update

`docs/backlog.md`, 894 cell edited in place: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` 2026-10-01, pointer to this log. No line added; the file has 80 lines. `check:backlog-active` result below.

## Opus review 1 — 2026-10-02: ✅ `APPROVED WITH NOTES`

The owner accepted O84-5 (*"візуально перевірив нові сторіси, все ок"*). The reviewer re-measured the built
Storybook in Chromium (`sq`/`uk`, 320–1440, all 11 exports) and found the gutters, overflow, type and row stacking as
receipted above. Details, accepted deviations and notes N1/N2 → kickoff §16 (`tasks/Archive/`).
