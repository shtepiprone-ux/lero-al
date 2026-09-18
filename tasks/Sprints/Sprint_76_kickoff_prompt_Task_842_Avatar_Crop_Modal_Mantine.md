# Task 842 — `AvatarCropModal` leaves shadcn `Dialog`/`Button` and Tailwind for the canonical `MantineModal`, with its own Story

Sprint 76 · P2 · QA profile **Q3**

**Status: ✅ `APPROVED WITH NOTES` 2026-09-18, review 1** (was `READY FOR SONNET` 2026-09-18). Review record: session log § "Orchestrator review". Independent of 841. Filed at Sprint 75's closure by owner instruction
*"закривай спринт і заводь задачі на міграцію"* (2026-09-18). Binding owner rule of the same day: *"у проекті не треба
створювати тести, які будуть перевіряти legacy компоненти та елементи. Ми мігруємо на Minetine увесь проект."*

## 1. Mode and task type

`IMPLEMENTATION` — migrate one legacy overlay component to the canonical Mantine modal pattern, create its canonical
Story, enrol it. Bundles: **UI / Current Mantine path** + **Storybook / Visual Proof**.

## 2. Objective

`src/components/shared/AvatarCropModal.tsx` renders the avatar crop dialog for the admin user editor and the cabinet
profile. It is the last shadcn `Dialog` on that flow. After this task it is built from the canonical `MantineModal`,
Mantine `Slider`, `Button`, `Text`, `Stack` and `Paper`, with no Tailwind utility and no raw design value. It has its own canonical Story and a
manifest entry, and its crop/save/cancel behaviour is unchanged.

## 3. Verified context — measured 2026-09-18 by the orchestrator (re-measure at I0)

### 3.1 Duplicate search (owner instruction 2026-09-18: *"спочатку перевір чи є вже готові story та компоненти"*)

| Question | Search | Result |
|---|---|---|
| Existing Mantine crop / avatar-upload component? | `git ls-files 'src/**' \| grep -i -E "crop\|avatar"`; `git grep -l react-easy-crop -- src` | **None.** Only `AvatarCropModal.tsx` uses `react-easy-crop`. `src/components/ui/avatar.tsx` is a legacy avatar image primitive, not a crop. |
| Canonical Story importing `AvatarCropModal`? | `git grep -l -E "from ['\"][^'\"]*/AvatarCropModal['\"]" -- '*.stories.tsx'` | **None.** |
| Canonical composition that opens it? | `AdminUserAvatar.stories.tsx` (`Admin/AdminUserAvatar`, legacy title) | Renders `AdminUserAvatar` in 3 states, none of which opens the modal (it opens only after a file is chosen). Not canonical, not a proof of the modal. |
| Canonical overlay pattern to reuse | `src/design-system/mantine/patterns/MantineModal.tsx` + `Mantine/Primitives/Modal` | **Exists, enrolled, storied.** Centered `Modal` ≥640px, `ResponsiveBottomSheet` <640px, `title`/`children`/`footer`/`size` props. |
| Canonical slider | `Mantine/Primitives/Slider` + `src/design-system/mantine/slider-chrome.css` | **Exists.** |
| `Mantine/Primitives/Avatar` | read | Plain Mantine `Avatar` display only; no crop. Not a duplicate. |

### 3.2 The component today (`AvatarCropModal.tsx`, 152 lines)

`FACT`, read in full:

- `:7-8` imports `Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter` from `@/components/ui/dialog` and
  `Button` from `@/components/ui/button`; `:9` `Loader2` from `lucide-react`.
- `:95` `<Dialog open onOpenChange={open => { if (!open && !saving) onCancel() }}>` — closing is ignored while saving.
- `:96` `<DialogContent showCloseButton={false} className="sm:max-w-md">` — no close X; max width 28rem (448px) ≥640px;
  centered dialog at every width (no bottom sheet).
- `:101` `flex flex-col gap-4` body; `:103-107` crop container `relative h-72 w-full rounded-xl overflow-hidden bg-muted`,
  `role="application"`, `aria-label={tc('aria_avatar_crop')}`; `:108-120` `Cropper` (aspect 1, zoom 1-3, no grid).
- `:124-133` raw `<input type="range" min=1 max=3 step=0.01>` with `aria-label={zoomLabel}`, class `w-full cursor-pointer accent-primary`.
- `:136` hint `<p className="text-xs text-muted-foreground text-center">`.
- `:139-148` footer: `Button variant="outline"` cancel (`disabled={saving}`), save (`disabled={saving || !croppedAreaPixels}`)
  with `Loader2 className="h-4 w-4 animate-spin mr-2"` while saving.
- `:72-92` `handleSave`: crops to a 256×256 JPEG via canvas, awaits `onConfirm(blob)`, logs
  `console.log('[AvatarFlow] upload_exception', …)` on a crop failure, always resets `saving`.

Census (`node.exe scripts\check-surface-census.mjs --surface src\components\shared\AvatarCropModal.tsx`):
`AvatarCropModal.tsx tier1 manifest:no story:no className:6 ui-imports:6` · `ui/button.tsx tier2` · `ui/dialog.tsx tier2`.

### 3.3 Consumer and data flow

`AvatarCropModal` has exactly one importer: `src/components/admin/AdminUserAvatar.tsx:18-19`
(`dynamic(() => import('@/components/shared/AvatarCropModal').then(m => m.AvatarCropModal))`), rendered at `:218-228`
only while `cropSrc` is set, with props `imageSrc={cropSrc}`, `title={tc('avatar_crop_title')}`,
`hint={tc('avatar_crop_hint')}`, `zoomLabel={tc('avatar_zoom_label')}` (`tc = useTranslations('cabinet')`),
`cancelLabel={tco('cancel')}`, `saveLabel={tco('save')}` (`tco = useTranslations('common')`),
`onConfirm={handleCropConfirm}`, `onCancel={handleCropCancel}`. `AdminUserAvatar` is rendered by
`AdminUserProfile.tsx:884` (admin) and `ProfileTab.tsx:239` (cabinet). The props interface does not change, so no
consumer edit is needed. All five label keys plus `common.aria_avatar_crop` exist in all four `messages/*.json`.

### 3.4 Canonical sources and tokens (grepped definitions, not tables)

| Need | Canonical source | Definition |
|---|---|---|
| Overlay, mobile sheet, focus return | `MantineModal` | `MantineModal.tsx` — `size` default `'md'`; body `<Stack gap="md"><Box>{children}</Box>{footer}</Stack>`; standard X/backdrop/Esc all call `onClose`. |
| Footer composition | `Mantine/Primitives/Modal` story `:31-52` | `Flex direction={{ base: 'column-reverse', sm: 'row' }} gap="sm" justify={{ base: 'stretch', sm: 'flex-end' }}`; cancel `Button variant="outline" color="gray" w={{ base: '100%', sm: 'auto' }}`; confirm `Button color="brand"` same `w`. |
| Pending save | `Mantine/Primitives/Button` story `:122-124` | `Button … loading` — Mantine loader, height unchanged. |
| Zoom control | `Mantine/Primitives/Slider` | Mantine `Slider` with `slider-chrome.css`. |
| Crop-area radius | `theme.ts:436` | `xl: '0.75rem'` — identical to Tailwind `rounded-xl` (12px). |
| Crop-area background | `docs/tailadmin-style-reference.md:755-756` | legacy `bg-muted` → **gray-100**; precedent `HeroSearchView.tsx:94` `bg="gray.1"`. |
| Crop-area height | **none** — `theme.other.boxSize` (`theme.ts:516-540`) has no 18rem role | This task **creates** `boxSize.avatarCropArea: '18rem'` (288px = Tailwind `h-72`, value-preserving). |
| Helper text | canonical patterns | `c="dimmed"` is the dominant muted-text colour in `src/design-system/mantine/patterns` (25 uses vs `gray.5` 18). |
| Body rhythm | `MantineModal` + theme spacing | `gap="md"` = 16px = Tailwind `gap-4`. |

### 3.5 Clause 16d / GR-1 census

The surface is `AvatarCropModal` (it opens no further overlay). Before: 3 nodes — itself (tier 1, in scope: migrated,
storied, enrolled by this task), `ui/button.tsx` and `ui/dialog.tsx` (tier 2 — imports removed by this task). After:
itself plus `MantineModal` and `responsiveBottomSheet` (both enrolled and storied). `react-easy-crop` is an external
package, not a census node.

`GR-1 CENSUS COMPLETE — 3 nodes; tier1 1 migrated+enrolled+story (AvatarCropModal, this task); tier2 2 imports removed (ui/button, ui/dialog); tier3 0 listed and filed as none.`

**Parent, not a child — recorded, not in scope.** `AdminUserAvatar.tsx` (the modal's only importer) is itself
legacy: `manifest:no story:no className:16 ui-imports:1` (`@/components/ui/button`), legacy Story `Admin/AdminUserAvatar`.
It is not rendered *by* this surface, so 16d does not bring it in. It has no migration task; the orchestrator has
raised it with the owner in the same response that filed this kickoff.

### 3.6 Baselines this task will make stale

`scripts/surface-census-baseline.json` — 3 rows keyed `src/components/shared/AvatarCropModal.tsx :: …`
(`:: AvatarCropModal.tsx :: tier1-unenrolled-or-unstoried`, `:: ui/button.tsx :: tier2-legacy-primitive`,
`:: ui/dialog.tsx :: tier2-legacy-primitive`). All three are paid-off debt after this task and are removed by the
sanctioned writer (§10 I6), never by hand. `scripts/rendered-scope-baseline.json` and
`scripts/enrolled-tailwind-baseline.json` have no `AvatarCropModal` row.

`scripts/story-coverage-exempt.json:23` still says the modal cannot be storied. That file is **retired and read by no
gate** (`check-story-coverage.mjs:31`; Task 625 precedent: "leave orphaned as Q0R did"). Out of scope.

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | owner 2026-09-18 | `AvatarCropModal.tsx` imports nothing from `@/components/ui/*`, has no `className` attribute and no Tailwind utility string, and renders through `MantineModal`. | P1 | AC1, AC2 | Confirmed |
| **R2** | §3.4 | Every visual value comes from a Mantine prop, a theme key or the new `theme.other.boxSize.avatarCropArea` token; no raw px/rem/colour literal. `check:design-tokens:strict` stays 0. | P1 | AC3, AC4 | Confirmed |
| **R3** | 16c / GR-3 | A canonical Story `Patterns/Mantine/AvatarCropModal` statically imports the real `AvatarCropModal` and renders it open with locale-backed labels; the component is in `scripts/mantine-migration-scope.json`; census reads `manifest:yes story:yes`. | P1 | AC5, AC6 | Confirmed |
| **R4** | preserve | Props interface, crop maths (256×256 JPEG, quality 0.92), zoom range 1-3 step 0.01, `role="application"` + `aria-label`, the `[AvatarFlow] upload_exception` log, and "no close while saving" behave as before. | P1 | AC7, AC8 | Confirmed |
| **R5** | agent-contract 11 + canonical `MantineModal` | Below 640px the modal is the canonical bottom sheet; ≥640px a centered Mantine `Modal` at `size="md"`. The standard close X is present and calls the same guarded cancel. | P2 | AC8, AC10 | Confirmed |
| **R6** | agent-contract 9 | The three stale census-baseline rows are removed by the writer; every gate in §13.2 passes. | P1 | AC9 | Confirmed |

## 5. Assumptions and open questions

- **Behaviour changes that the canonical pattern brings, stated so the owner can return them** (none needs a decision
  before execution): ① a close X appears (legacy `showCloseButton={false}`); ② <640px becomes a bottom sheet (legacy:
  centered dialog at every width — agent-contract 11 requires the sheet); ③ desktop width is Mantine `Modal size="md"`
  instead of Tailwind `max-w-md` (28rem) — measure both at I0 and report the delta; ④ the save spinner becomes
  Mantine's `loading` loader; ⑤ the zoom control becomes the canonical Mantine `Slider` chrome. If the owner returns
  ①, the fix is a `withCloseButton` extension of `MantineModal` and its Story — a follow-up, not an executor choice here.
- Known issue **835** (white `Loader` on a disabled filled `Button`) concerns a hand-placed `Loader`; this task uses the
  `Button` `loading` prop. The owner's saving-state tuple (§13.3 #5) checks the result.
- No open owner decision.

## 6. Pre-read rule bundle

`docs/golden-rules.md` · `docs/agent-contract.md` (clauses 9, 11, 13, 14, 16-16d) · `docs/qa-profiles.md` ·
`docs/mantine-responsive-design-system.md` (Modal/overlay and Slider sections) · `docs/tailadmin-style-reference.md`
(§ slider, lines ~740-770) · `docs/component-rules.md` · `docs/storybook-governance.md` (Mantine story shape) ·
`docs/qa-rules.md` · `.claude/skills/execute-task/SKILL.md`.

## 7. Scope

- **Edited:** `src/components/shared/AvatarCropModal.tsx` · `src/design-system/mantine/theme.ts` (one `boxSize` role +
  its union member) · `scripts/mantine-migration-scope.json` (one entry) · `scripts/surface-census-baseline.json`
  (writer output only) · `docs/backlog.md` (842 state line).
- **Created:** `src/stories/patterns/mantine/AvatarCropModal.stories.tsx`.
- **Written:** `docs/sessions/evidence/task842/*` · `docs/sessions/2026-09-18-task842-avatar-crop-modal-mantine.md` (or the execution date).

## 8. Out of scope

`AdminUserAvatar.tsx`, its CSS module and its legacy Story (parent, §3.5) · `AdminUserProfile.tsx`, `ProfileTab.tsx` ·
`src/app/api/upload-avatar/route.ts` · `MantineModal.tsx` and its Story (reused as-is) · `src/components/ui/*` files ·
`scripts/story-coverage-exempt.json` (retired, §3.6) · `messages/*.json` (no new key). **No new test** — owner rule
2026-09-18; nothing here asserts on the legacy form.

## 9. Current and required behavior

**Before.** Choosing a photo in the admin user editor or the cabinet profile opens a shadcn dialog: title, a 288px
rounded grey crop area, a native range input, a hint, and Cancel/Save. No close X. Centered at every width. Save shows a
lucide spinner. Closing is ignored while saving.

**After.** The same flow opens the canonical `MantineModal`: centered ≥640px, bottom sheet <640px. The title is followed by the same
288px crop area (`Paper radius="xl" bg="gray.1"`, height from `theme.other.boxSize.avatarCropArea`), the canonical
Mantine `Slider` (1-3, step 0.01, no value tooltip), the hint as `Text size="xs" c="dimmed" ta="center"`, and the
canonical footer (outline-gray Cancel, brand Save with `loading`). Backdrop, Esc, the X and Cancel all call `onCancel`, and all of them are
ignored while saving. Crop output and the upload hand-off are byte-for-byte the same code path.

## 10. Implementation requirements

1. **I0** — `node.exe -p "process.platform + ' ' + process.version"`; `git --no-optional-locks status --porcelain`;
   `git --no-optional-locks hash-object` of the four edited files; the §3.2 census command; the §3.1 duplicate
   searches; `npm.cmd run test -- src/design-system/mantine/__tests__/theme.d69-18.test.tsx` (known red per Task 790 —
   record the failing test names). Any difference from §3 → `BLOCKED` with the new measurement.
2. Edit through Node UTF-8 I/O or the editor — never PowerShell `Get-Content -Raw` without `-Encoding utf8`.
3. **Token first.** In `theme.ts` add `avatarCropArea` to the `boxSize` union in the `MantineThemeOther` augmentation and
   `avatarCropArea: '18rem', // 288px — Task 842: AvatarCropModal crop-area height (was Tailwind h-72, AvatarCropModal.tsx:104)`
   to `theme.other.boxSize`, in the file's existing ascending-size order. Quote the definition line in the session log.
4. **Component.** Replace the shadcn tree with:
   `MantineModal opened onClose={() => { if (!saving) onCancel() }} title={title} footer={…}` (default `size`), body
   `Stack gap="md"` containing ① `Paper radius="xl" bg="gray.1" pos="relative" h={theme.other.boxSize.avatarCropArea} w="100%"`
   with `role="application"` and `aria-label={tc('aria_avatar_crop')}`, clipping via `style={{ overflow: 'hidden' }}`
   (a keyword, not a design value) and the unchanged `Cropper`; ② `Slider min={1} max={3} step={0.01} value={zoom}
   onChange={setZoom} label={null} thumbLabel={zoomLabel}`; ③ `Text size="xs" c="dimmed" ta="center"`. Footer = the
   `Mantine/Primitives/Modal` footer composition (§3.4) with Cancel `onClick={onCancel} disabled={saving}` and Save
   `onClick={handleSave} loading={saving} disabled={!croppedAreaPixels}`. Remove the `Loader2` import. Do not change
   `loadImage`, `cropImageToBlob`, `handleSave`, the props interface or the comments that document the parent contract.
5. **Story (GR-3a decision `CREATE`, §12 receipt).** `src/stories/patterns/mantine/AvatarCropModal.stories.tsx`,
   title `Patterns/Mantine/AvatarCropModal`, one export `Default`, `parameters: { skipCanvas: true, layout: 'fullscreen' }`,
   rendered inside `MantineStoryShell`. Props: `imageSrc="/og-default.png"` (local `public/` asset served by
   `staticDirs`, same-origin so the canvas is not tainted); labels from `storyT(locale, 'cabinet.avatar_crop_title')`,
   `'cabinet.avatar_crop_hint'`, `'cabinet.avatar_zoom_label'`, `'common.cancel'`, `'common.save'`;
   `onConfirm={() => new Promise<void>(() => {})}` — a documented fixture: pressing Save leaves the modal in its saving
   state so the owner can review it; `onCancel={() => {}}`. JSDoc states the direct import, the fixture choices and
   that no mock is used. No locale- or width-named exports; no `globals.viewport` pin.
6. **Enrol** `src/components/shared/AvatarCropModal.tsx` in `scripts/mantine-migration-scope.json`, following the
   file's existing ordering.
7. **Baselines, writer only.** After the edits:
   `node.exe scripts\check-surface-census-changed.mjs --base HEAD --update-baseline`. Expected: exactly the three §3.6
   rows removed, no tier-2 refusal. If it refuses, reports a different row set, or fails closed on mapping → `BLOCKED`
   with the transcript. Never hand-edit a baseline.

## 11. Positive and negative flows

**Positive.** Cabinet → Profile → choose a JPEG → the modal opens with the image → drag and zoom → Save → the button
shows the loader → the parent uploads, clears `cropSrc`, the modal unmounts, the new avatar shows.

| Negative flow | Applicable | Expected |
|---|---|---|
| Close while saving (backdrop, Esc, X, Cancel) | Yes | Ignored; modal stays; Cancel disabled; Save shows loader. |
| Save before the crop area initialises | Yes | Save disabled (`!croppedAreaPixels`). |
| Crop fails (`cropImageToBlob` throws) | Yes | `[AvatarFlow] upload_exception` logged, `saving` resets, modal stays open. |
| Parent upload fails | Yes | Parent's toast (unchanged); modal stays open for retry. |
| <640px | Yes | Bottom sheet; crop area full width, 288px tall; slider and footer usable at 320 (`uk`). |
| Long locale text (`uk`) | Yes | Title and hint wrap; footer buttons full width <640px; no horizontal overflow. |
| Invalid file type/size/dimensions | No | Rejected by `AdminUserAvatar` before the modal opens (unchanged, out of scope). |
| Authorization / RLS / concurrency | No | No data path in this component; upload route unchanged. |

## 12. Acceptance criteria

- **AC1 [R1]** — Given `AvatarCropModal.tsx`, when `git grep -n -E "components/ui/|className=|lucide-react" -- src/components/shared/AvatarCropModal.tsx`
  runs, then it prints nothing. Quote the command output.
- **AC2 [R1]** — Given the file, when read, then its overlay is `MantineModal` imported from
  `@/design-system/mantine/patterns` (or the pattern's direct path, whichever the file's neighbours use). Quote the render.
- **AC3 [R2]** — Given `theme.ts`, when `Select-String -Path src\design-system\mantine\theme.ts -Pattern 'avatarCropArea'`
  runs, then it shows the union member and the `'18rem'` definition. Quote both lines.
- **AC4 [R2]** — Given the gate block, when `npm.cmd run check:design-tokens:strict` and `npm.cmd run check:enrolled-tailwind`
  run, then both exit 0.
- **AC5 [R3]** — Given the census command of §3.2, when run after the change, then the root row reads
  `manifest:yes story:yes className:0 ui-imports:0` and `GR-1 CENSUS COMPLETE` with no tier-2 node.
- **AC6 [R3]** — Given `npm.cmd run check:story-coverage`, when run, then it exits 0 and counts `AvatarCropModal` as covered.
- **AC7 [R4]** — Given `git diff -- src/components/shared/AvatarCropModal.tsx`, when read, then `loadImage`,
  `cropImageToBlob`, `handleSave`, `AvatarCropModalProps` and the `[AvatarFlow]` log appear in no diff hunk. Quote the
  diff and name the untouched line ranges.
- **AC8 [R4, R5]** — Given the built Storybook, when the owner opens `Patterns/Mantine/AvatarCropModal → Default`,
  presses Save, then tries Esc and the X, then the modal stays open with a loading Save and a disabled Cancel (owner tuple 5, §13.3).
- **AC9 [R6]** — Given `git diff --stat -- scripts/surface-census-baseline.json`, when read, then exactly 3 lines are
  removed and 0 added, and `node.exe scripts\check-surface-census-changed.mjs --base HEAD` exits 0.
- **AC10 [R5]** — Given the owner matrix §13.3, when every tuple is reviewed, then each is recorded accepted, or returned with a concrete defect.

`GR-4 AC AUDIT — 10 criteria; each states an observable property; absolutes: AC1's empty grep is the removal's definition, scoped to one file; AC9's "3 removed, 0 added" is the writer's own deterministic output for a known row set.`

`GR-3a STORY PREFLIGHT — AvatarCropModal × open (default + saving); canonical candidates: NONE (Admin/AdminUserAvatar is a legacy title and never opens the modal; Mantine/Primitives/Modal renders MantineModal, not this component); direct-import evidence: NONE; toolbar coverage: locale=Storybook locale toolbar (preview.tsx NextIntlClientProvider), viewport=Storybook viewport toolbar; decision: CREATE; target: Patterns/Mantine/AvatarCropModal; rationale: zero canonical candidates, and the component is an in-scope production overlay with no proof surface.`

`GR-3 STORY PROVEN — AvatarCropModal ← src/stories/patterns/mantine/AvatarCropModal.stories.tsx` (after execution).

## 13. QA profile and verification plan

**`Q3`** — a legacy overlay migrates to the canonical Mantine modal (qa-profiles: "overlay/popup"). Not in
`docs/critical-flow-registry.md` (searched: no avatar row).

### 13.1 Re-entry

`from-scratch`. Evidence root `docs/sessions/evidence/task842/`, transcripts numbered `00-`…, each with `EXIT_CODE=`,
written through Node or `-Encoding utf8` (no BOM).

### 13.2 Final gate block

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p "process.platform + ' ' + process.version"
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:stories
npm.cmd run check:story-coverage
npm.cmd run check:design-tokens:strict
npm.cmd run check:enrolled-tailwind
npm.cmd run check:rendered-scope
node.exe scripts\check-surface-census-changed.mjs --base HEAD
node.exe scripts\check-surface-census.mjs --surface src\components\shared\AvatarCropModal.tsx
npm.cmd run test -- src/design-system/mantine/__tests__/theme.d69-18.test.tsx
npm.cmd run build-storybook
npm.cmd run check:locale-leak:mantine-only
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks grep -n -E "components/ui/|className=|lucide-react" -- src/components/shared/AvatarCropModal.tsx
git --no-optional-locks diff --stat
git --no-optional-locks hash-object src/components/shared/AvatarCropModal.tsx src/design-system/mantine/theme.ts scripts/mantine-migration-scope.json scripts/surface-census-baseline.json src/stories/patterns/mantine/AvatarCropModal.stories.tsx docs/backlog.md
```

Expected: every `npm`/`node` command exits 0, except:
- `theme.d69-18.test.tsx` is known red (Task 790). Its failing-test names must equal I0's.
- `check:locale-leak:mantine-only` is known red (Task 836). The requirement is **no leak whose `storyId` is `patterns-mantine-avatarcropmodal--default`**. Quote the grep of the transcript for that story ID; zero lines expected.

The `git grep` must print nothing and exit 1. Run `check:locale-leak` after `build-storybook`, never concurrently.

### 13.3 Owner visual review — `OWNER VISUAL QA REQUIRED`

| # | Story / route | State | Width | Locale | Owner checks |
|---|---|---|---|---|---|
| 1 | `Patterns/Mantine/AvatarCropModal` | Default | 1440 | en | centered modal, title, 288px rounded grey crop area with image, slider, hint, Cancel/Save right-aligned, close X |
| 2 | same | Default | 1440 | uk | same, Ukrainian text fits |
| 3 | same | Default | 390 | en | bottom sheet, drag handle, crop area full width, buttons stacked full width |
| 4 | same | Default | 320 | uk | same at the narrowest width; no horizontal overflow |
| 5 | same | after pressing Save | 1440 | en | Save shows the loader, Cancel disabled, Esc/X/backdrop do not close |
| 6 | cabinet → Profile → choose a photo (live app, signed in) | real flow | 390 and 1440 | en | crop, Save, avatar updates; Cancel closes without upload |

### 13.4 Evidence the executor hands over

The §13.2 transcripts, the I0 transcripts, the writer transcript from §10 step 7, and the §13.3 matrix handed to the owner. For §5 ③, state the legacy width from the class (`sm:max-w-md` = 28rem = 448px) and the rendered width of the Mantine modal content at 1440 in the built Storybook (computed `width`, read in the browser), and the difference.

## 14. Completion report contract

Files with before/after hashes · R1-R6 · AC1-AC10 with quotes · every command with exit code and transcript path ·
I0 re-measure results · writer output · GR-1/GR-3/GR-3a receipts · assumptions · deviations · limitations · the §13.3
matrix. Status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. No self-approval, no
mutating git, no `git push`. Sonnet updates the 842 line of `docs/backlog.md` and writes the session log with a
Files Changed table.

## 15. Task quality gate

| Question | Answer |
|---|---|
| Duplicate component or Story? | §3.1: no Mantine crop component exists; zero canonical Stories import or open this component; `MantineModal`/`Slider`/`Button` are reused, not recreated. |
| Probe markup? | No. The Story documents the in-scope production overlay (16c); its `onConfirm` fixture is declared. |
| GR-1 / 16d | §3.5 receipt. Parent `AdminUserAvatar` recorded and raised with the owner. |
| GR-2 | `check:story-coverage` only sees enrolled components; AC5's census root row, not the gate alone, closes R3. |
| Hardcode rule | R2 + AC3/AC4; the one new value is a documented, value-preserving `theme.other` role. |
| Owner rule "no legacy tests" | §8: no test added. |
| Baselines | Writer only, row set named in §3.6, AC9 counts it. |
