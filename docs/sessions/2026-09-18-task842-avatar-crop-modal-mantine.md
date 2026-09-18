# Task 842 — `AvatarCropModal` leaves shadcn `Dialog`/`Button` and Tailwind for the canonical `MantineModal`

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

Kickoff: `tasks/Sprints/Sprint_76_kickoff_prompt_Task_842_Avatar_Crop_Modal_Mantine.md`

## I0 re-measure (§10 step 1)

`node.exe -p "process.platform + ' ' + process.version"` → `win32 v22.22.3`. `git status --porcelain` →
clean. Pre-edit `git hash-object`: `AvatarCropModal.tsx 47558f8` · `theme.ts f13285f` ·
`mantine-migration-scope.json d06c6e2` · `surface-census-baseline.json 5afcd68` · `backlog.md 022d726`.
Census matched §3.2 exactly: `AvatarCropModal.tsx tier1 manifest:no story:no className:6 ui-imports:6`,
tier-2 `ui/button.tsx`/`ui/dialog.tsx`. Duplicate searches matched §3.1 exactly (no crop component, no
`react-easy-crop` outside this file, no story importing `AvatarCropModal`). `theme.d69-18.test.tsx`:
1 known-red (`FooterView.tsx resolves theme.other.layout.footerGridGap`, Task 790), 54 passed. No
difference from §3 — proceeded. Transcripts `docs/sessions/evidence/task842/00`-`07`.

## Requirement and acceptance-criteria evidence

| ID | Requirement | Evidence |
|---|---|---|
| R1 [AC1, AC2] | No `@/components/ui/*`, no `className`, `MantineModal` overlay | `git grep -n -E "components/ui/|className=|lucide-react" -- src/components/shared/AvatarCropModal.tsx` prints nothing, exit 1 (transcript `26`). Render: `<MantineModal opened onClose={...} title={title} footer={...}>` (`AvatarCropModal.tsx:95`), imported from `@/design-system/mantine/patterns/MantineModal` (`:8`). |
| R2 [AC3, AC4] | New `boxSize.avatarCropArea` token; 0 raw literals | `theme.ts` union member `\| 'avatarCropArea'  // 288px — Task 842: AvatarCropModal crop-area height (was Tailwind h-72)` and value `avatarCropArea: '18rem', // 288px — Task 842: AvatarCropModal crop-area height (was Tailwind h-72, AvatarCropModal.tsx:104)`. `check:design-tokens:strict` exit 0 (transcript `12`); `check:enrolled-tailwind` exit 0, no `AvatarCropModal` finding (transcript `13`). |
| R3 [AC5, AC6] | Canonical Story, enrolled, census clean | `src/stories/patterns/mantine/AvatarCropModal.stories.tsx`, title `Patterns/Mantine/AvatarCropModal`, one `Default` export, statically imports the real component. Enrolled in `scripts/mantine-migration-scope.json`. Post-change census: `manifest:yes story:yes className:0 ui-imports:0`, `GR-1 CENSUS COMPLETE — 3 nodes; tier1 3 migrated+enrolled+story; tier2 0` (transcript `19`). `check:story-coverage` exit 0 (transcript `11`). |
| R4 [AC7, AC8] | Crop maths, zoom range, aria, log, close-while-saving unchanged | `git diff -- src/components/shared/AvatarCropModal.tsx` (transcript `30`) has exactly 3 hunks: the import block (`:7-8`), one added line `const theme = useMantineTheme()` (`:62`), and the JSX `return` block (`:94` onward). `loadImage` (`:12-19`), `cropImageToBlob` (`:21-36`), `handleSave` (`:71-91`), `AvatarCropModalProps` (`:46-55`) and the `[AvatarFlow] upload_exception` log (`:82-86`) appear in no diff hunk — confirmed by direct inspection of the diff, not by grep alone. AC8 is `OWNER VISUAL QA REQUIRED` (§13.3 below). |
| R5 [AC8, AC10] | Bottom sheet <640, centered `Modal size="md"` ≥640, standard close X | `MantineModal` (reused, unedited) supplies both paths; `AvatarCropModal` passes no `size` override, so the pattern's `size='md'` default applies. Owner tuples §13.3 #3/#4/#5. |
| R6 [AC9] | 3 stale census-baseline rows removed by the writer only | `node scripts/check-surface-census-changed.mjs --base HEAD --update-baseline` → `entries written: 491` (from 494), `PASS`, no tier-2 refusal (transcript `16`). `git diff --stat -- scripts/surface-census-baseline.json` → `9 deletions(-)`, 0 insertions — exactly the 3 JSON entries (transcript `17`). Re-run without `--update-baseline` → exit 0 (transcript `18`). |

## Current versus required behavior

**Before.** shadcn `Dialog`/`DialogContent` (`sm:max-w-md`, no close X, centered at every width), a raw
`<input type="range">`, a `lucide-react` spinner, Tailwind utilities throughout.

**After.** `MantineModal` (centered ≥640px, bottom sheet <640px, standard close X), a `Paper radius="xl"
bg="gray.1"` crop area sized from `theme.other.boxSize.avatarCropArea` (18rem/288px, value-preserving),
a Mantine `Slider` (1-3, step 0.01, `thumbLabel`), `Text size="xs" c="dimmed" ta="center"` hint, and the
canonical `Mantine/Primitives/Modal` footer composition (outline-gray Cancel, brand Save with `loading`).
Crop maths, upload hand-off, and the guarded-close behaviour are unchanged code paths (R4 evidence above).

## Files Changed

| Path | Reason |
|---|---|
| `src/components/shared/AvatarCropModal.tsx` | R1/R2/R4/R5 — shadcn `Dialog`/`Button`/`Loader2` replaced with `MantineModal`/`Paper`/`Slider`/`Text`/`Flex`/`Button`; crop/save logic, props interface, and the `[AvatarFlow]` log untouched. |
| `src/design-system/mantine/theme.ts` | R2 — one `boxSize.avatarCropArea` role (union member + value), inserted in ascending order between `compactTrigger` (280px) and `emptyState` (360px). |
| `scripts/mantine-migration-scope.json` | R3 — `src/components/shared/AvatarCropModal.tsx` enrolled (appended, following the file's existing order). |
| `src/stories/patterns/mantine/AvatarCropModal.stories.tsx` | R3 — new canonical Story, direct import, one `Default` export, `imageSrc="/og-default.png"`, non-resolving `onConfirm` fixture (documented). |
| `scripts/surface-census-baseline.json` | R6 writer output — 3 stale rows removed (`AvatarCropModal.tsx`/`ui/button.tsx`/`ui/dialog.tsx`), 0 added. |
| `docs/backlog.md` | 842 line updated to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. |

No consumer edit: `AdminUserAvatar.tsx`'s dynamic import and props usage are unchanged (props interface
did not change) — confirmed via `git diff --stat` (not listed, no hunk).

## GR receipts

`GR-1 CENSUS COMPLETE — 3 nodes; tier1 3 migrated+enrolled+story; tier2 0 imports removed; tier3 0 listed and filed as none.`
`GR-3 STORY PROVEN — AvatarCropModal ← src/stories/patterns/mantine/AvatarCropModal.stories.tsx.`
`GR-3a STORY PREFLIGHT` — as recorded in the kickoff §12 (no canonical candidate existed; decision `CREATE`), unchanged by execution.
`GR-4 AC AUDIT` — 10/10 criteria evidenced above and in the gate block; AC8/AC10 are `OWNER VISUAL QA REQUIRED`, not self-scored.

## Validation evidence (§13.2 final gate block)

All commands run from the repo root; transcripts under `docs/sessions/evidence/task842/`.

| # | Command | Exit | Transcript |
|---|---|---|---|
| — | `node -p platform+version` | 0 | `00` |
| — | I0 `git status --porcelain` | 0 (clean) | `01` |
| — | I0 `git hash-object` (pre-edit) | 0 | `02` |
| — | I0 `check-surface-census.mjs` | 1 (expected — pre-migration BLOCKED, matches §3.2) | `03` |
| — | I0 duplicate searches | n/a | `04`, `05`, `06` |
| — | I0 `theme.d69-18.test.tsx` | 1 (known-red, Task 790) | `07` |
| 1 | `typecheck` | 0 | (ad hoc, re-run clean; see also gate) |
| 2 | `lint` | 0 (79 pre-existing warnings, none in touched files) | `09` |
| 3 | `check:stories` | 0 | `10` |
| 4 | `check:story-coverage` | 0 | `11` |
| 5 | `check:design-tokens:strict` | 0 | `12` |
| 6 | `check:enrolled-tailwind` | 0 | `13` |
| 7 | `check:rendered-scope` | 0 | `14` |
| 8 | `check-surface-census-changed.mjs --base HEAD` (pre-writer) | 1 (expected — names exactly the 3 §3.6 rows) | `15` |
| 8w | `check-surface-census-changed.mjs --base HEAD --update-baseline` | 0 | `16` |
| 9 | `check-surface-census.mjs --surface AvatarCropModal.tsx` (final) | 0 | `19` |
| 10 | `theme.d69-18.test.tsx` (final) | 1 (same single known-red test as I0) | `20` |
| 11 | `build-storybook` | 0 | `21` |
| 12 | `check:locale-leak:mantine-only` | 1 (known-red, Task 836 — whole-suite) | `22`, see "Deviations" |
| 13 | `build` | 0 | `23` |
| 14 | `check:file-integrity` | 0 | `24` |
| 15 | `check:mojibake` | 0 | `25` |
| 16 | `git grep` legacy residue | 1 (expected — empty match) | `26` |
| 17 | `git diff --stat` (full) | 0 | `27` |
| 18 | `git hash-object` (post-edit) | 0 | `28` |
| — | `check-surface-census-changed.mjs --base HEAD` (post-writer, re-check) | 0 | `18` |
| — | AC9 `git diff --stat` on the baseline file alone | 0 | `17` |

Post-edit hashes (transcript `28`): `AvatarCropModal.tsx db62e4c` · `theme.ts dc44856` ·
`mantine-migration-scope.json 110968b` · `surface-census-baseline.json 66869413` ·
`AvatarCropModal.stories.tsx 31146a5` · `backlog.md` re-hash owed after this log's own backlog edit
(the `022d726` value above is pre-backlog-edit).

## Deviations / limitations

1. **`check:locale-leak:mantine-only` (whole suite, known-red per Task 836) surfaced ONE line naming
   our new story:** `Story: Patterns/Mantine/AvatarCropModal/Default` → `[it] "Zoom"` (transcript `22`,
   line 87-88). `messages/it.json`'s `cabinet.avatar_zoom_label` is `"Zoom"` — identical to
   `messages/en.json`'s value. This is very likely a false positive (the check flags the target-locale
   string when it equals the English string, and "Zoom" is a standard, unmodified loanword in Italian —
   `common.cancel`/`save`, etc. differ correctly across locales in this same Story). The kickoff's exact
   wording ("no leak whose `storyId` is `patterns-mantine-avatarcropmodal--default`... zero lines
   expected") is **not** met: 1 line was found, not 0. `messages/*.json` is explicitly out of this
   task's scope (§8 "no new key"; this is not a new key, but editing translation content is still
   outside the component/token/story scope this task is authorized to touch), so no edit was made. This
   is a pre-existing translation fact, newly surfaced only because this task is what gave the component
   its first Story. Flagging for Opus rather than silently treating the gate as satisfied.
2. **§13.4's rendered-width comparison could not be measured live in a browser** — the Claude-in-Chrome
   extension was not connected in this session. Used the deterministic static source instead: Mantine's
   own compiled `node_modules/@mantine/core/styles/Modal.css` defines `--modal-size-md: 440px`
   (`.mantine-Modal-content { flex: 0 0 var(--modal-size); max-width: 100% }`), and `theme.ts` has no
   `Modal` size-variable override (grepped, 0 hits) and `AvatarCropModal` passes no `size` prop, so the
   default applies. At 1440px viewport (above the `max-width:100%` clamp) the rendered content width is
   **440px**. Legacy `sm:max-w-md` = 28rem = **448px**. **Delta: Mantine renders 8px narrower.**
   Full working in `docs/sessions/evidence/task842/29-width-delta.txt`. This is a static-source
   determination, not a live DOM `getBoundingClientRect()` reading as the kickoff asked for — flagged
   as a limitation, not silently presented as an equivalent live measurement.
3. `AdminUserAvatar.tsx` (the modal's sole importer) remains legacy per §3.5 — unchanged, out of scope,
   already raised with the owner by the kickoff itself.

## Owner visual review — `OWNER VISUAL QA REQUIRED` (§13.3)

Not scored by this session. Storybook built clean (`build-storybook` exit 0); `Patterns/Mantine/AvatarCropModal → Default`
is available for the tuples below.

| # | Story / route | State | Width | Locale | Owner checks |
|---|---|---|---|---|---|
| 1 | `Patterns/Mantine/AvatarCropModal` | Default | 1440 | en | centered modal, title, 288px rounded grey crop area with image, slider, hint, Cancel/Save right-aligned, close X |
| 2 | same | Default | 1440 | uk | same, Ukrainian text fits |
| 3 | same | Default | 390 | en | bottom sheet, drag handle, crop area full width, buttons stacked full width |
| 4 | same | Default | 320 | uk | same at the narrowest width; no horizontal overflow |
| 5 | same | after pressing Save | 1440 | en | Save shows the loader, Cancel disabled, Esc/X/backdrop do not close |
| 6 | cabinet → Profile → choose a photo (live app, signed in) | real flow | 390 and 1440 | en | crop, Save, avatar updates; Cancel closes without upload |

Note for tuple 2/4: the locale-leak deviation above (`[it] "Zoom"`) does not affect `uk` — `uk.json`'s
`avatar_zoom_label` differs correctly from English (not re-verified here beyond the automated scan).

## Assumptions

None beyond the kickoff's own §5 (behaviour changes the canonical pattern brings — close X, bottom
sheet, `size="md"` width, Mantine loader/slider chrome — all pre-stated, no owner decision needed
before execution).

## Orchestrator review — 2026-09-18, review 1: APPROVED WITH NOTES

Reviewed: the real diff of all 5 modified files, plus the new Story; transcripts 00-31. Platform win32 v22.22.3.

- R1/AC1-AC2: the `git grep` for legacy imports and className prints nothing (26, exit 1). The overlay is `MantineModal` from `@/design-system/mantine/patterns/MantineModal`.
- R2/AC3-AC4: `theme.ts` has the union member and `avatarCropArea: '18rem'`. `check:design-tokens:strict` and `check:enrolled-tailwind` both exit 0 (12, 13).
- R3/AC5-AC6: census root row reads `manifest:yes story:yes className:0 ui-imports:0`, GR-1 CENSUS COMPLETE (19). `check:story-coverage` exits 0 (11). The Story imports the component directly.
- R4/AC7: the only hunk inside the component body adds `useMantineTheme()`. `loadImage`, `cropImageToBlob`, `handleSave`, the props and the `[AvatarFlow]` log are in no hunk. Mantine `Button loading` disables Save while saving. The guarded `onClose` covers the X, Esc, backdrop and sheet.
- R6/AC9: the writer removed the 3 rows (9 lines, because each row is 3 lines; the kickoff's "3 lines" wording was wrong). `check:surface-census:changed` exits 0 after the write (18).
- Build exits 0 (23). Theme test failures match I0: the same single FooterView test (07 vs 20).
- AC8/AC10: owner accepted all six §13.3 tuples on 2026-09-18.
- Typecheck: no transcript was retained. The reviewer ran `npm.cmd run typecheck` natively and it exited 0.
- Locale leak: `[it] "Zoom"` is the standard Italian loanword (`messages/it.json:565`). With owner authorisation, the reviewer added the story-scoped entry `'patterns-mantine-avatarcropmodal': ['Zoom']` to `PER_STORY_TOKENS` in `scripts/check-locale-leak.mjs`, following the Max/Link/Gas precedent. Verified by evaluating `PER_STORY_TOKENS`: it matches this story ID and no other. `node --check` passes. The full scan was not re-run: the gate is known-red (Task 836) and the entry is a pure prefix match.
- Width delta 448px to 440px (29) is a static derivation, not a DOM measurement. Informational only.
- `GR-1 CENSUS COMPLETE — 3 nodes; tier1 3 migrated+enrolled+story; tier2 0 remaining (ui/button, ui/dialog imports removed); tier3 0.`
- Parent `AdminUserAvatar` is still legacy (`ui/button`, 16 className) and has no task. That is an owner decision, outside this surface.
