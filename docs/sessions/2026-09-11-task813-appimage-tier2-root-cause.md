# Task 813 — `AppImage` leaves `src/components/ui/`: clear the tier-2 root cause that blocks Task 820

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

Kickoff: `tasks/Sprints/Sprint_75_kickoff_prompt_Task_813_AppImage_Tier2_Root_Cause.md`
Evidence: `docs/sessions/evidence/task813/`

## R1/AC1 — Census re-derived at execution (never copied from §3)

Commands and full transcripts: `R1_01..R1_11_*.txt`, `R1_04..R1_06` (importer greps).

- **`AppImage` external importers (11)**: `AdminCompaniesManager.tsx`, `AdminLocationsManager.tsx`,
  `AdminPopularLocationsManager.tsx`, `AdminUserAvatar.tsx`, `ListingsTab.tsx`, `ImageUpload.tsx`,
  `LightboxView.tsx`, `ListingCard.tsx`, `ListingGallery.tsx`, `StepPreview.tsx`,
  `PopularLocationsView.tsx`. Matches §3.3's 25-surface/12-route-surface picture (these 11 files are
  the direct renderers; the 25 census blocks are the transitive surfaces reached through them).
- **`appImageConfig.ts` external importers (1, type-only, NOT found by §3's file-level grep):
  `src/lib/performance/predictive.ts`** — `import type { ImageVariant } from '@/components/ui/appImageConfig'`.
  This is a genuine difference from §3.5's dated claim — R1 caught it because it greps the exact
  module specifier, not just the word "AppImage".
- **`useAdaptiveImageConfig.ts` external importers (1, also not in §3): `src/components/shared/PerfDevOverlay.tsx`**
  — `import { usePriorityImageCount } from '@/components/ui/useAdaptiveImageConfig'`.
- **Co-located siblings, confirmed by reading `AppImage.tsx`/`appImageConfig.ts`/`useAdaptiveImageConfig.ts`
  in full**: `appImageConfig.ts`, `useAdaptiveImageConfig.ts`, `AppImage.module.css`. All three import
  each other only by relative specifier or by absolute paths outside `src/components/ui/` — moving
  all four together requires **zero** import-specifier changes inside the moved files themselves
  (confirmed post-move, see AC3).
- **Own-Story status**: zero hits for `components/ui/AppImage` in any `src/stories/**` or
  `*.stories.tsx` file before this task — confirms §3.5's dated claim.
- **Live baseline counts, measured before any edit** (`R1_07`–`R1_09`): `check:rendered-scope` — 30
  baselined edges, 0 new, 0 stale (exit 0; the 2 `AppImage` edges are baselined debt, not failures).
  Per-surface census on both patterns: each reports exactly 1 `tier2-legacy-primitive` block
  (`AppImage.tsx`) plus, independently, `LightboxView.tsx` itself as `tier1-unenrolled-or-unstoried`
  — a **separate, pre-existing** condition (already recorded debt under two other surface keys in
  `scripts/surface-census-baseline.json`), unrelated to AppImage's tier and explicitly out of this
  task's scope (owner decision §17.6 on Task 820 forbids enrolling `LightboxView` to hide the tier-2
  hop). `check:story-coverage`: 66/66 covered, exit 0. Baseline `npm run build`: exit 0, route table
  captured (`R1_11`).

## R2/AC2 — Move

`AppImage.tsx`, `appImageConfig.ts`, `useAdaptiveImageConfig.ts`, `AppImage.module.css` moved from
`src/components/ui/` to `src/design-system/media/` via filesystem move (not `git mv` — mutating git is
owner-only). `git --no-optional-locks status --short` for both paths: `src/components/ui/AppImage*` —
no matches (zero files); `src/design-system/media/` — the four files, untracked (new directory).

## R3/AC3 — Zero behaviour change

Since `git add`/`git mv` are owner-only, git's native rename detection (which requires an index entry)
is unavailable to Sonnet. Read-only equivalent: `git show HEAD:<old-path>` piped to
`git diff --no-index` against the new location, for each of the four files. **All four exit 0 — zero
content differences, not merely "import specifiers only."** Full transcript: `R2_rename-content-diff.txt`.
This is stronger than R3 requires: none of the four files' own imports referenced their old
`src/components/ui/` location (all relative-to-sibling or absolute-elsewhere), so nothing needed to
change inside them.

## R4/AC4 — Every importer rewritten, no shim

13 external importers rewritten (11 `AppImage`, 1 `appImageConfig`, 1 `useAdaptiveImageConfig|`) — see
Files Changed. Zero-hit verification: `git --no-optional-locks grep -n "components/ui/AppImage" -- src`
→ exit 1 (no matches); same for `appImageConfig`/`useAdaptiveImageConfig`. No re-export, barrel alias,
or `tsconfig` path mapping added.

## R5/AC5 — The blocking hop cleared

**R15/AC20 correction, stated explicitly rather than as "green": `npm run check:surface-census
--surface` exits 1 on BOTH `MantineListingGalleryPattern.tsx` and `MantineListingDetailPattern.tsx`,
both before this task's edits and after them.** What changed is which finding produces that exit 1:

- **Before** (`R1_08_baseline_census-gallery.txt`, `R1_09_baseline_census-detail.txt`): each census
  reports **2** blocking nodes — `src/components/ui/AppImage.tsx [tier2-legacy-primitive]` **and**
  `src/modules/listings/components/LightboxView.tsx [tier1-unenrolled-or-unstoried]`. Exit code 1.
- **After** (`AC5_01_census-gallery-final.txt`, `AC5_02_census-detail-final.txt`): each census reports
  **1** blocking node — only `LightboxView.tsx [tier1-unenrolled-or-unstoried]` remains. `AppImage.tsx`
  now reads `tier:tier1 manifest:yes story:yes` (no longer a blocking node at all). Exit code **still 1**.

**This task removed exactly the `AppImage [tier2-legacy-primitive]` block from both censuses — it did
not, and was never scoped to, make either census pass.** The `LightboxView [tier1-unenrolled-or-unstoried]`
block is pre-existing (already recorded debt under two other surface keys in
`scripts/surface-census-baseline.json` — see R7 below), unrelated to AppImage's tier, and out of this
task's scope: owner decision §17.6 on Task 820 explicitly forbids enrolling `LightboxView` to hide the
tier-2 hop. R5's own acceptance test — "reports zero `tier2-legacy-primitive` blocks" — is satisfied;
"the census exits 0" was never R5's test and is not claimed anywhere in this report.
`LightboxView.tsx` itself: zero `@/components/ui/` matches (confirmed by its full-file read and the R4
zero-hit grep).

## R6/AC6, AC7 — Governed, not merely relocated

`scripts/mantine-migration-scope.json`: 66 → 67 entries (`src/design-system/media/AppImage.tsx`
added, no other entry changed). New canonical Story: `src/stories/mantine/primitives/AppImage.stories.tsx`,
`meta.title: 'Mantine/Primitives/AppImage'` (satisfies `isCanonicalMantineTitle`), statically imports
`AppImage` from `@/design-system/media/AppImage`. `check:story-coverage`: 67 manifest entries, 67
covered, 0 missing, exit 0 (`R7_10`).

## R7/AC8 — Both baselines brought true via their own writers

**`scripts/rendered-scope-baseline.json`** (`check:rendered-scope --update-baseline`, `R7_01`):
30 → 28 entries. Removed: `ListingCard.tsx -> src/components/ui/AppImage.tsx`,
`PopularLocationsView.tsx -> src/components/ui/AppImage.tsx` (both `tier2-legacy-primitive`, now
enrolled-to-enrolled so no longer a frontier edge at all). Added: none. Post-update gate: exit 0, 0
new, 0 stale (`R7_05`). Self-test: 5/5 arms pass (`R7_06`).

**`scripts/surface-census-baseline.json`** (`check:surface-census:changed --update-baseline --base HEAD`,
`R7_03`; `--head` omitted diffs against the working tree, the documented local-probing mode): 690 → 676
entries (net −14). Removed (15 stale, all on surfaces this diff's importer-rewrites happened to touch):
13 `<surface> :: src/components/ui/AppImage.tsx :: tier2-legacy-primitive` blocks (the 12 route
surfaces named in §3.3 plus `ListingCard.tsx`/`ListingGallery.tsx`/`PopularLocationsView.tsx`/
`StepPreview.tsx`/`ListingFormShell.tsx` — the exact surfaces reachable from the 13 rewritten
importers), plus 2 unrelated, already-paid-off entries
(`src/app/[locale]/layout.tsx :: MantinePopover.tsx/responsiveBottomSheet.tsx :: tier1-unenrolled-or-unstoried`
— both patterns were already enrolled by Task 820; this diff's inclusion of `layout.tsx` as an affected
surface is what first gave the diff-scoped updater a chance to drop them, per
`docs/design-system-pattern-ownership.md` §7's own predicted mechanism). Added (1, genuinely new for
this exact surface/node pairing, but not new debt — the identical `LightboxView.tsx` finding is already
recorded under two other surface keys):
`MantineListingGalleryPattern.tsx :: src/modules/listings/components/LightboxView.tsx :: tier1-unenrolled-or-unstoried`.
Post-update gate: exit 0, 0 new, 0 stale (`R7_04`). Self-test: 8/8 arms pass (`R7_07`).

Neither baseline was hand-edited; both writers refused zero tier-2 edges (there were none to refuse —
AppImage's edges disappeared entirely rather than needing exemption).

## R8/AC9 — No `next/image`, `IMAGE_RENDER_EXCEPTIONS` updated

`eslint.config.mjs`'s `IMAGE_RENDER_EXCEPTIONS`: `src/components/ui/AppImage.tsx` →
`src/design-system/media/AppImage.tsx` (the only change to that array; `GalleryStaticFrame.tsx`'s
entry untouched). `npm run lint`: exit 0, 72 pre-existing warnings (0 errors) unrelated to this diff
(`I3_lint.txt`). Zero-hit search for `next/image` imports under `src`: `git grep -n "from 'next/image'" -- src`
→ exit 1 (no matches).

## R9/AC10, AC11 — Route behaviour and owner visual QA

**AC10.** `npm run build`: exit 0 both before (`R1_11`) and after (`AC10_final_build.txt`) every edit.
Route table for the three named routes, before → after: `/[locale]` 624 kB → 625 kB (7.64 kB → 7.63 kB
own size — within normal chunk-hash noise, not a regression); `/[locale]/listings` 630 kB → 630 kB
(unchanged); `/[locale]/listings/[slug]` 665 kB → 665 kB (unchanged). No behavioural change to any of
the twelve §3.3 route surfaces — the diff is import-specifier-only plus one new Story file, which does
not ship in the app bundle.

**AC11 — `OWNER VISUAL QA REQUIRED`.** Six tuples, none of which this executor may mark
passed/failed/ambiguous:
1. `Mantine/Primitives/AppImage → Default`, 390px, en
2. `Mantine/Primitives/AppImage → Default`, 1440px, en
3. `Patterns/Mantine/ListingGalleryPattern → Default`, lightbox **closed**, 390px, en
4. `Patterns/Mantine/ListingGalleryPattern → Default`, lightbox **closed**, 1440px, en
5. `Patterns/Mantine/ListingGalleryPattern → Default`, lightbox **open**, 390px, en
6. `Patterns/Mantine/ListingGalleryPattern → Default`, lightbox **open**, 1440px, en

`screenshots:assert` and all aliases were not run (owner decision 2026-09-03, retired).

## R10/AC12 — The six protected scripts and `TIER2_PREFIX`

`git --no-optional-locks diff --stat` for `check-rendered-scope.mjs`, `check-surface-census.mjs`,
`check-surface-census-changed.mjs`, `map-changed-surfaces.mjs`, `audit-design-system-patterns.mjs`,
`check-pattern-enrolment.mjs`: **empty** for all six. `TIER2_PREFIX = 'src/components/ui/'` byte-identical
in both `check-rendered-scope.mjs:211` and `check-surface-census.mjs:56` (unchanged, confirmed by grep).

## R11/AC13 — Documentation

- `docs/golden-rules.md`: GR-1 enforcement-table row updated to add `check-media-enrolment.mjs`
  alongside the existing three GR-1 gates, with a short factual addition. Confirmed by diff: **only**
  that table row's line changed; no GR-1..GR-6 rule body, `Command` block, or receipt string touched.
- `docs/design-system-pattern-ownership.md`: new §8, "A sibling directory for the project's
  non-Mantine image primitive," recording the decision, the destination, and the new gate.
- `docs/storybook-governance.md`: new §15.9, "A second directory, the same rule:
  `check:media-enrolment`," modeled on §15.8's shape (why / mechanism / commands / cannot-see /
  status-as-landed).

## R12/AC14, AC15, AC16 — The media-directory parity check

New script `scripts/check-media-enrolment.mjs`, built to `check-pattern-enrolment.mjs`'s exact shape
(pure `evaluateMediaEnrolment` classifier, pure `evaluateGateExitCode`, printed scope boundary,
`--verify-gate` 5-arm self-test including a ghost-entry arm (arm 2) and an exit-code-wiring arm
(arm 4)) — no import from, or edit to, `check-pattern-enrolment.mjs`. Reads the directory at runtime
(`readdirSync`), never a hard-coded name list.

**AC14.** `npm run check:media-enrolment` on the final tree: exit 0. Prints scanned/not-scanned/cannot-see,
1 media file found, 67 manifest entries, and states "Canonical-Story coverage is check:story-coverage's
job, not this check's" (`R12_01`).

**AC15.** Real-tree plant (not only the synthetic self-test): AppImage's manifest entry removed via a
Node script, `git hash-object` of `scripts/mantine-migration-scope.json` captured before (`96ac948a…`),
gate re-run → exit 1, naming `src/design-system/media/AppImage.tsx` exactly; `--verify-gate` re-run
against the same planted tree → arm 5 correctly flips to FAIL (proving arm 5 genuinely reads the live
tree, not a tautology); manifest restored via Node write; hash after (`96ac948a…`) — **matches**; content
byte-identical to the pre-plant snapshot; gate re-run after restore → exit 0 again. One witness
transcript: `AC15_plant-and-restore-witness.txt`, including the explicit
`git --no-optional-locks status --porcelain -- scripts/mantine-migration-scope.json` output (shows `M`
— expected, since this task's own legitimate AppImage-enrolment edit is still uncommitted; the
restoration proof is the hash match + byte-identity, not an empty status).

**AC16.** `.github/workflows/governance-pr.yml`: two new steps added immediately after the existing
Pattern-directory enrolment steps, same `governance` job, no `continue-on-error`, no `|| true`, no
`exit 0`, no wrapper — quoted in full above (git hunk).

## R13/AC17 — Scope discipline

`git --no-optional-locks diff --stat scripts/rendered-scope-allowlist.json`: **empty**. Neither
`ListingFeatureIcon` nor `FavoriteButton` appears anywhere in this diff.

## R14/AC18, AC19 — The three retarget edits (Revision 1)

**AC18.** Full hunks, each showing only the path-constant/path-key/import-path retarget forced by the
move — no other line changed in any of the three:

```diff
diff --git a/docs/sessions/evidence/task763/appimage-config-class-assertions.test.ts b/docs/sessions/evidence/task763/appimage-config-class-assertions.test.ts
@@ -3,8 +3,8 @@
 import { describe, it, expect } from 'vitest'
-import { VARIANTS } from '@/components/ui/appImageConfig'
-import styles from '@/components/ui/AppImage.module.css'
+import { VARIANTS } from '@/design-system/media/appImageConfig'
+import styles from '@/design-system/media/AppImage.module.css'

diff --git a/scripts/check-homepage-theme-runtime-deps.mjs b/scripts/check-homepage-theme-runtime-deps.mjs
@@ -4,7 +4,7 @@
- * `src/components/ui/AppImage.module.css` as the single expected-zero input (D65-E — the durable
+ * `src/design-system/media/AppImage.module.css` as the single expected-zero input (D65-E — the durable
@@ -102,7 +102,7 @@ export const MIGRATION_INPUTS_REL = [
-export const EXPECTED_ZERO_INPUT_REL = 'src/components/ui/AppImage.module.css';
+export const EXPECTED_ZERO_INPUT_REL = 'src/design-system/media/AppImage.module.css';

diff --git a/scripts/design-tokens-allowlist.json b/scripts/design-tokens-allowlist.json
@@ -15,6 +15,6 @@
-  "src/components/ui/appImageConfig.ts": "Next/Image sizes media-descriptor strings + inline SVG blur placeholder color — neither can reference CSS custom properties",
+  "src/design-system/media/appImageConfig.ts": "Next/Image sizes media-descriptor strings + inline SVG blur placeholder color — neither can reference CSS custom properties",
```

Reasons recorded in Files Changed below: "path constant / path key / import path follows the moved file" for each.

**AC19.** `npm run check:homepage-theme-runtime-deps` (`R14_01`): exit 0 — `TOTAL CLASSIFIED 77/142`,
`BLOCKING 0/0`, `MIGRATED_TARGETS 34/66 signature OK`. `npm run check:homepage-theme-runtime-deps:verify-gate`
(`R14_02`): exit 0, all 6 cases pass; **Case 4** (the expected-zero-reintroduced arm) reports
`src/design-system/media/AppImage.module.css:143 --space-0` — proving the self-test's own synthetic
plant now targets the retargeted path, not merely that the constant string changed. Platform `win32`,
Node `v22.22.3`, cwd `C:\Claude_Code_Projects\lero-al`, both commands' real exit codes captured in the
same transcript as the output.

## R16/AC21, AC22 — Isolated before/after for the two red blocking gates

**Isolation command** (exact, per §13.2a — `git worktree`, never `git stash`):

```powershell
git --no-optional-locks worktree add --detach $env:TEMP\task813-head-snapshot HEAD
```

This created a second, fully separate working directory checked out from `HEAD` (commit `9be53b478`
— the review's own Revision-1 kickoff/backlog commit; Task 813's product-code diff itself has never
been committed, so `HEAD` here is exactly "this task's diff not yet applied"), ran `npm ci` there, and
ran both gates in it (`R16_01`/`R16_02`, BEFORE), then the same two gates in the live working tree with
this task's full diff applied (`R16_03`/`R16_04`, AFTER). The worktree was removed with
`git worktree remove --force` immediately after; `git worktree list` before and after this task's
worktree existed shows only the same pre-existing worktrees (`lero-al-base`, `lero-al-task770-pre`,
unrelated to this task), and `git --no-optional-locks status --short` on the main repo was **unchanged**
(38 lines, identical set) across the whole operation — the isolation never touched this task's own
working tree.

**Comparison.** Diffed the BEFORE/AFTER transcripts stripped of only the run-scope header lines (file
counts, "scanning N files") that vary for reasons unrelated to violations (e.g. `--strict` scans every
`src/**/*.{tsx,ts,css}` file regardless of which files changed):

- `check:design-tokens:strict`: **56 violations before, 56 after — the exact same 56 lines**, same
  files, same line numbers, same categories (`raw-dimension-prop` 39 / `raw-inline-dimension` 17).
  Zero of the 56 are in `src/design-system/media/*` or any `AppImage*` file (confirmed by the file
  list in both transcripts — `PasswordRequirementsHint.tsx`, `FilterChoiceGroup.tsx`,
  `HowItWorksSteps.tsx`, `PhoneField.tsx`, `AdminUserAvatar.tsx`, `AdminUsersTable.tsx`,
  `FavoriteButton.tsx`, `LightboxView.tsx`, `ListingMobileCTA.tsx`, `ListingsShell.tsx`,
  `[locale]/layout.tsx`, `[locale]/listings/[slug]/page.tsx`, `[locale]/page.tsx`,
  `NotificationBellView.tsx`, `NotificationCenter.tsx`, `NotificationItem.tsx`, `CaptchaWidget.tsx`,
  `useIsMobile.ts`, `imageDelivery.ts`). `diff` between the two transcripts' violation-line sets: **empty**.
- `check:tailwind-runtime-tokens`: **1 finding before, 1 after — the identical finding**:
  `[module-css] src/design-system/mantine/patterns/MantineListingCardTrack.module.css:209 --shadow-sm`,
  `baseline entries: 0` in both. `diff`: **empty**.

**AC22 verdict: identical violation sets in both environments → both gates are inherited, not caused by
Task 813.** This diff's only edit either gate's input reads (`scripts/design-tokens-allowlist.json`'s
key rename) produces **zero** difference in `check:design-tokens:strict`'s output, because the
renamed key still resolves to the same file (`appImageConfig.ts`, wherever it lives) and none of that
file's exempted raw values were ever counted as violations to begin with. Per AC22, this task **does
not** carry either as debt or fix them in place — that would be scope creep beyond a relocation task.
Recommended for the owner/orchestrator: file two separate numbered tasks, one per gate, from the exact
violation sets quoted above (`R16_01`/`R16_03` for `check:design-tokens:strict`'s 56;
`R16_02`/`R16_04` for `check:tailwind-runtime-tokens`'s 1). **Sonnet does not assign task numbers or
write kickoffs** — task design is Opus's authority under the project's Operating Model
(`CLAUDE.md` → Operating model; `docs/orchestrator-role.md`); this section hands Opus everything needed
to file both immediately.

## R17/AC23, AC24 — Revision 4 (current), superseding Revision 2/3 below

**Revision 2's own evidence failed AC24 on independent review**: the probe below checked per-row
uniformity (all 4 cells the same size as each other) and printed a pass, but AC24 requires the value
to be **the same at all four viewport widths** — the retained JSON shows 66/83.5/106/329.5px at
320/390/480/1440, which is a stretching box, not a fixed square, and is the exact defect the owner
rejected in a different shape. Separately, `maw="20rem"`/`w="6rem"`/`maw="30rem"`/`maw="10rem"` are the
same rejected 320/96/480/160px values re-expressed in `rem` — still a hardcode, and Revision 2's own
AC23 search pattern could not see a value in a Mantine sizing prop at all, only a `style={{}}` object.

**Owner decision §5.5, 2026-09-11 (verbatim):** "розмір квадратів має бути 44х44px" / "цей розмір треба
записати токеном" — the gallery-strip thumbnail and the no-src square are **44 × 44 px, from a new
registered token**, not a value chosen by the executor. Full decision quoted in the kickoff §5.5.

**Fix, Revision 4:**

1. **New token** — `src/design-system/mantine/theme.ts`: `MantineThemeOther`'s `boxSize` union gains
   `'galleryThumb'`, and `other.boxSize.galleryThumb = '2.75rem'` (44px), with a provenance comment
   naming this decision and its two owners (the AppImage Story's gallery-strip row + no-src square,
   and Task 824's gallery thumbnail row). Not a reuse of `touchTarget`/`iconSize.touch` (same value,
   different documented owner — the theme's own rule 3 forbids that).
2. **Corrected probe** (`scripts/task813-appimage-thumb-probe.mjs`, rewritten before the Story was
   touched, per kickoff §13.5 step 1): output path now a required `--out <file>` argument (refuses to
   run without it, refuses to overwrite an existing file — so Revision 3's
   `R17_04_ac24-thumb-measurements.json`/`R17_04_probe-run.txt` stay untouched as historical evidence).
   Pass condition is exactly AC24's amended sentence: every gallery-strip cell and the no-src square
   measures 44px ±1px in both dimensions, at every one of 320/390/480/1440, and the cross-width
   `max − min` pooled across every measured element at every width is ≤1px, plus
   `document.documentElement.scrollWidth ≤ clientWidth`. Elements are selected **structurally** — by
   finding the section's own `Text` label by its exact trimmed text content, then walking to its next
   *element* sibling, skipping over a Mantine-injected `<style>` runtime-CSS-variable tag that sits
   between the label and the grid/`AspectRatio` content for some components (discovered live this
   session: `SimpleGrid`'s `--sg-cols` custom property is emitted as a sibling `<style>` node, not an
   attribute — the first version of this fix returned 0 thumbnails until the walk skipped `STYLE`/
   `SCRIPT` tags). No `data-testid` remains in the Story — a hook that exists only to serve a
   measurement is a probe, not a permanent artifact.
3. **Negative arm proved first** (`R17R4_02_probe-negative-arm.json`/`.txt`): the corrected probe run
   against the **unmodified Revision 3 Story** exits **1**, naming exactly the 66/83.5/106/329.5px
   failures at each width and a 263.5px cross-width delta (max 329.5, min 66) — proof the corrected
   check actually catches what Revision 3 missed, before any Story edit.
4. **Story rewritten** (`src/stories/mantine/primitives/AppImage.stories.tsx`): every remaining raw
   dimension is gone, not re-expressed. `listing`, `gallery-main` and `avatar` now size from a
   `SimpleGrid` column count (`cols={{ base: 1, sm: 2 }}` / `cols={{ base: 4, sm: 6 }}` — counts, not
   dimensions; `gallery-main` keeps its `AspectRatio ratio={16 / 9}` for height, a proportion, not a
   dimension). `gallery-strip` is now a non-stretching `Group gap="xs"` (never a `SimpleGrid`, which is
   what divided the container and produced 329.5px at 1440) of four `AspectRatio ratio={1}
   w={theme.other.boxSize.galleryThumb}` cells; the no-src square uses the same token the same way.
   `useMantineTheme()` is called from two small local components (`GalleryStripRow`, `NoSrcSquare`),
   matching this file's own precedent for keeping hooks out of the top-level story `render` callback
   (`CountButton.stories.tsx`'s `SlidersIcon`/`FilterTriggerBoundaryStates`). The demo `DEMO_SRC` URL's
   query string was also trimmed (`?w=800&q=80` → `?q=80`) — its `w=800` parameter is an unrelated
   Unsplash width hint, but it is a literal match for AC23's own `w\s*[=:]\s*...\d` search pattern, so
   it had to go for the search to mean anything.

**AC23 — amended search, zero hits.** The exact `Select-String` pattern set from kickoff §13.2a Block B
(prop-name-plus-digit, any CSS-length-unit-suffixed literal, `\d%`, `style={{`, Tailwind arbitrary
`className`, `data-testid`) returns **nothing** against the Revision 4 Story — reproduced live this
session (Node equivalent of the same six patterns; see Validation evidence). The two `theme.ts`
definition lines are quoted above in "Fix, Revision 4" item 1.

**AC24 — rendered measurement, not a screenshot, positive arm** (`R17R4_06_ac24-thumb-measurements.json`):

| Width | Each of the 5 elements (gallery-strip ×4 + no-src) | Within 44±1px | scrollWidth | clientWidth | Overflow |
|---:|---|---|---:|---:|---|
| 320  | 44×44 (all 5) | yes | 320  | 320  | no |
| 390  | 44×44 (all 5) | yes | 390  | 390  | no |
| 480  | 44×44 (all 5) | yes | 480  | 480  | no |
| 1440 | 44×44 (all 5) | yes | 1440 | 1440 | no |

Cross-width: `max = 44, min = 44, delta = 0` (pooled across all 20 measurements — 5 elements × 4
widths). Probe exit 0. These four widths go back to the owner as AC11's re-review.

**Gates re-run after the Revision 4 edit** (`docs/sessions/evidence/task813/R17R4_*`): `typecheck` 0
(`R17R4_03`) · `lint` 0, zero findings in the touched files (`R17R4_04`) · `build-storybook` 0
(`R17R4_05`) · AC24 probe exit 0 (`R17R4_06`) · `check:stories` 146/0 (`R17R4_07`) ·
`check:story-coverage` 67/67 unaffected (`R17R4_08`) · `check:design-tokens:strict` — **same 56-entry
violation set** as `R16_03` (diffed line-for-line, identical) (`R17R4_09`) ·
`check:tailwind-runtime-tokens` — same single `MantineListingCardTrack.module.css:209 --shadow-sm`
finding as `R16_04` (`R17R4_10`) · `check:homepage-theme-runtime-deps` 0 + `:verify-gate` 6/6, Case 4
naming `src/design-system/media/AppImage.module.css:143` (`R17R4_11`/`R17R4_12`) · `check:file-integrity`
119 files clean (`R17R4_13`) · `check:mojibake` 0/4573 (`R17R4_14`) · `npm run build` exit 0
(`R17R4_15`) · `theme.d69-18.test.tsx` search for `boxSize` (`R17R4_16`) run via
`npm run test -- src/design-system/mantine/__tests__/theme.d69-18.test.tsx` (`R17R4_17`): 54/55 pass;
the sole failure (`FooterView.tsx resolves theme.other.layout.footerGridGap`) is unrelated to this
change (no `boxSize`/`AppImage`/theme-`boxSize` involvement) and is pre-existing, reserved debt —
`docs/backlog.md` Task **790** already names this exact assertion, root-caused to Task 784's
`34faa47a9` hotfix writing `theme.other!.layout!.footerGridGap` (non-null assertions break the test's
substring match; the runtime contract itself still holds) · `git hash-object` of all three changed
files (`R17R4_18`) · final `git status --short`, exactly the files this revision touched, nothing else
(`R17R4_19`).

## R17/AC23, AC24 — Revision 2/3 (superseded by Revision 4 above, kept for the record)

Owner AC11 rejection, 2026-09-11 (§5.4): `src/stories/mantine/primitives/AppImage.stories.tsx`'s own
`gallery-strip / thumbnail row` section drew a `SimpleGrid` capped at `style={{ maxWidth: 360 }}`
wrapping four `<div style={{ width: 80, height: 56 }}>` cells — a 10:7 box, stretching, and an overflow
at 320/480. Distinct from `MantineListingGalleryPattern.tsx`'s identical-looking defect, which is not in
this task's or Task 820's diff and is filed separately as Task 824.

**Fix.** Every raw-pixel `style={{...}}` wrapper in the file (5 occurrences, all five demo sections) is
replaced with Mantine sizing props / the canonical Mantine square primitive:

- `listing / 4:3 / priority` — `<div style={{ maxWidth: 320 }}>` → `<Box maw="20rem">` (same demo width,
  expressed as a Mantine prop, not an inline style number).
- `gallery-main / fill-parent` — `<div style={{ width: 480, height: 270 }}>` → `<Box maw="30rem">`
  wrapping `<AspectRatio ratio={16 / 9}>` (identical 16:9 box, no pixel literal).
- `avatar / square / circular` — `<div style={{ width: 96 }}>` → `<Box w="6rem">`.
- **`gallery-strip / thumbnail row`** (the owner's defect) — the `maxWidth: 360` cap on `SimpleGrid` is
  removed entirely (columns now divide the section's own available width, never a fixed cap), and each
  `<div style={{ width: 80, height: 56 }}>` becomes `<AspectRatio ratio={1}>` — a square that sizes
  itself from the grid column, never a fixed 80×56 box. `data-testid="appimage-gallery-strip-grid"` /
  `appimage-gallery-strip-thumb-{i}` added for AC24's measurement (test hooks only, not a dimension).
- **negative flow (no `src`)** — `<div style={{ width: 160, height: 120 }}>` (also non-square) → same
  `AspectRatio ratio={1}` treatment inside `<Box maw="10rem">`, per the kickoff's explicit instruction
  that this is "the same defect ... fixed with it."

**AC23 — zero raw dimension literals.** A repo-file search for `style={{...width`, `...height`,
`...maxWidth`, any `\d+px` token, and Tailwind arbitrary `[...]` dimension syntax returns **zero** hits
in the file (`R17_04_ac24-thumb-measurements.json`'s companion search — reproduced live this session,
see Validation evidence). Every remaining size is a Mantine component prop (`maw`, `w`, `ratio`) or a
`rem` string, never a `style` object or a `px`-suffixed literal.

**AC24 — rendered measurement, not a screenshot.** `screenshots:assert` is retired (owner decision
2026-09-03); a task-owned Playwright probe (`scripts/task813-appimage-thumb-probe.mjs`, modelled on
`scripts/task766-route-shell-probe.mjs`'s per-label JSON evidence and `check-stories-rendered.mjs`'s
static `storybook-static/` + `iframe.html?id=...` URL shape) measures
`Mantine/Primitives/AppImage → Default` in `en` at 320/390/480/1440 via
`getBoundingClientRect()` on the four `data-testid="appimage-gallery-strip-thumb-*"` cells, plus
`document.documentElement.scrollWidth`/`clientWidth`. It is evidence tooling only — no `package.json`
entry, nothing in CI depends on it, same disposition as the four prior task-numbered probes.

Measured (`docs/sessions/evidence/task813/R17_04_ac24-thumb-measurements.json`, full JSON retained):

| Width | Each thumb (w×h, px) | Square within 1px | Uniform across the 4 | scrollWidth | clientWidth | Overflow |
|---:|---|---|---|---:|---:|---|
| 320  | 66×66     | yes | yes | 320  | 320  | no |
| 390  | 83.5×83.5 | yes | yes | 390  | 390  | no |
| 480  | 106×106   | yes | yes | 480  | 480  | no |
| 1440 | 329.5×329.5 | yes | yes | 1440 | 1440 | no |

All four widths: every thumbnail square within 1px, uniform across the row, zero horizontal overflow.
AC24's four widths are what go back to the owner as AC11's re-review.

**Additional gates re-run after the R17 edit** (transcripts under `docs/sessions/evidence/task813/`,
`R17_` prefix): `typecheck` 0 (`R17_01`) · `lint` 0, zero findings in the story file (`R17_02`) ·
`build-storybook` exit 0 (`R17_03`) · `check:stories` 146 files / 0 violations, re-run clean after the
edit (`R17_05`) · `check:story-coverage` 67/67, unaffected (`R17_06`) · `check:file-integrity` 100 files
clean (`R17_07`) · `check:mojibake` 0 artifacts in 4555 files (`R17_08`) · `npm run build` exit 0
(`R17_09`).

## GR-1 census note (this task's own surface)

This task changes no user-facing visible surface (it moves an internal render primitive and rewrites
import specifiers); the GR-1/16d census obligation applies to the two patterns already censused above
(R1/AC1, R5/AC5), not to a new feature surface.

## Files Changed

| Path | Reason |
|---|---|
| `src/components/ui/AppImage.tsx`, `appImageConfig.ts`, `useAdaptiveImageConfig.ts`, `AppImage.module.css` | Deleted (moved) |
| `src/design-system/media/AppImage.tsx`, `appImageConfig.ts`, `useAdaptiveImageConfig.ts`, `AppImage.module.css` | New location — byte-identical move |
| `src/components/admin/AdminCompaniesManager.tsx`, `AdminLocationsManager.tsx`, `AdminPopularLocationsManager.tsx`, `AdminUserAvatar.tsx` | Import path rewritten to `@/design-system/media/AppImage` |
| `src/modules/cabinet/components/ListingsTab.tsx`, `src/modules/listings/components/ImageUpload.tsx`, `LightboxView.tsx`, `ListingCard.tsx`, `ListingGallery.tsx`, `steps/StepPreview.tsx`, `src/modules/locations/components/PopularLocationsView.tsx` | Same |
| `src/lib/performance/predictive.ts` | `appImageConfig` type import rewritten |
| `src/components/shared/PerfDevOverlay.tsx` | `useAdaptiveImageConfig` import rewritten |
| `eslint.config.mjs` | `IMAGE_RENDER_EXCEPTIONS` path updated |
| `scripts/design-tokens-allowlist.json` | R14 — path key follows the moved file (live consumer — a stale key would silently stop exempting `appImageConfig.ts`) |
| `scripts/check-homepage-theme-runtime-deps.mjs` | R14 — path constant follows the moved file (`EXPECTED_ZERO_INPUT_REL`, live fixed-manifest gate) |
| `docs/sessions/evidence/task763/appimage-config-class-assertions.test.ts` | R14 — import path follows the moved file (this historical-evidence `.test.ts` is inside `tsconfig.json`'s repo-wide `include` and broke `npm run typecheck`; mechanical fix only, no narrative rewritten) |
| `scripts/mantine-migration-scope.json` | +1 entry (`src/design-system/media/AppImage.tsx`) |
| `scripts/rendered-scope-baseline.json` | −2 entries via its own `--update-baseline` |
| `scripts/surface-census-baseline.json` | −15/+1 entries via its own `--update-baseline` |
| `scripts/check-media-enrolment.mjs` | New — R12 parity gate |
| `package.json` | +2 script entries |
| `.github/workflows/governance-pr.yml` | +2 CI steps |
| `src/stories/mantine/primitives/AppImage.stories.tsx` | New canonical Story; Revision 4/R17 — every raw dimension (pixel or `rem`-string) removed; `listing`/`gallery-main`/`avatar` size from `SimpleGrid` column counts, `gallery-strip` + no-src square size from the new `theme.other.boxSize.galleryThumb` token via a non-stretching `Group`; `data-testid` removed |
| `src/design-system/mantine/theme.ts` | Revision 4/R17 — `+1` `boxSize` role: `galleryThumb` (`2.75rem`/44px, owner decision §5.5), union key + value, nothing else in the file |
| `scripts/task813-appimage-thumb-probe.mjs` | New — Revision 4/R17/AC24 evidence tooling (Playwright measurement probe, no `package.json` entry, not a gate); Revision 4 corrected its pass condition to AC24's amended cross-width sentence and its element selection to structural (no `data-testid`) |
| `messages/en.json`, `sq.json`, `uk.json`, `it.json` | +1 key each (`storybook.mantine.appimage_alt`), all four locales |
| `docs/golden-rules.md` | GR-1 enforcement-table row updated |
| `docs/design-system-pattern-ownership.md` | New §8 |
| `docs/storybook-governance.md` | New §15.9 |
| `docs/backlog.md` | Task 813 status updated in the shared 809·811·813·814·815·820 row |

## Validation evidence

All commands, actual exit codes, and full transcripts: `docs/sessions/evidence/task813/*.txt`.
Summary: `typecheck` 0 (`I2`) · `lint` 0 (`I3`) · zero-hit searches for the old paths and `next/image`
· both per-surface censuses zero `tier2-legacy-primitive` (`AC5_01`/`AC5_02`) · `check:rendered-scope`
0/0 new/stale (`R7_05`) + self-test 5/5 (`R7_06`) · `check:surface-census:changed` 0/0 new/stale
(`R7_04`) + self-test 8/8 (`R7_07`) · `check:pattern-enrolment` 0 + self-test 5/5 (`R7_08`/`R7_09`,
unaffected by this task) · `check:media-enrolment` 0 (`R12_01`) + self-test 5/5 (`R12_02`) + real-tree
plant/restore (`AC15_plant-and-restore-witness.txt`) · `check:story-coverage` 67/67 (`R7_10`) ·
`check:stories` 146 files, 0 violations (`I7`) · `npm run build` exit 0, before and after
(`R1_11`/`AC10_final_build.txt`) · `check:file-integrity` (default, git-changed+untracked scope) 79
files clean (`FINAL_01`) · `check:mojibake` 0 artifacts in 4531 files (`FINAL_02`) ·
`check:homepage-theme-runtime-deps` 0 + self-test 6/6 (`R14_01`/`R14_02`) ·
`check:design-tokens:strict`/`check:tailwind-runtime-tokens` isolated-worktree before/after — identical
violation sets, both inherited (`R16_01`–`R16_04`) · `git hash-object` of every changed/new file
(`FINAL_03_hash-object-manifest.txt`).

**Revision 2/3 (R17, superseded)**: `typecheck` 0, `lint` 0 (`R17_01`/`R17_02`) · `build-storybook` 0
(`R17_03`) · AC24 rendered measurement at 320/390/480/1440 — every gallery-strip thumb square within
1px, uniform, zero overflow, but **not** cross-width equal (66/83.5/106/329.5px — this is what
Revision 4 corrects) (`R17_04_ac24-thumb-measurements.json`) · `check:stories` 146/0 (`R17_05`) ·
`check:story-coverage` 67/67 unaffected (`R17_06`) · `check:file-integrity` 100 files clean (`R17_07`) ·
`check:mojibake` 0/4555 (`R17_08`) · `npm run build` exit 0 (`R17_09`).

**Revision 4 (R17, current)**: negative arm — corrected probe exits 1 against the unmodified Revision 3
Story, naming the 66/83.5/106/329.5px and 263.5px cross-width failures (`R17R4_02`) · `typecheck` 0,
`lint` 0 (`R17R4_03`/`R17R4_04`) · `build-storybook` 0 (`R17R4_05`) · positive arm — every gallery-strip
cell + no-src square measures exactly 44×44px at all four widths, cross-width delta 0px, zero overflow,
probe exit 0 (`R17R4_06`) · `check:stories` 146/0 (`R17R4_07`) · `check:story-coverage` 67/67 unaffected
(`R17R4_08`) · `check:design-tokens:strict` — identical 56-entry set to `R16_03` (`R17R4_09`) ·
`check:tailwind-runtime-tokens` — identical single finding to `R16_04` (`R17R4_10`) ·
`check:homepage-theme-runtime-deps` 0 + `:verify-gate` 6/6 (`R17R4_11`/`R17R4_12`) ·
`check:file-integrity` 119 files clean (`R17R4_13`) · `check:mojibake` 0/4573 (`R17R4_14`) · `npm run
build` exit 0 (`R17R4_15`) · `theme.d69-18.test.tsx` (the only test file referencing `boxSize`) run:
54/55 pass, the one failure is Task 790's already-reserved, unrelated pre-existing debt
(`R17R4_16`/`R17R4_17`) · `git hash-object` of all three Revision 4 files + final `git status --short`
(`R17R4_18`/`R17R4_19`).

Platform: `win32`, Node `v22.22.3`, native Windows PowerShell/Bash for every gate command per §13.4.

## Pre-existing findings — PROVEN inherited (R16/AC21/AC22), NOT fixed by this task

Superseded by R16 above (Revision 1 required proof, not the Revision-0 assertion this section
originally made). `npm run check:design-tokens:strict` (56 violations) and
`npm run check:tailwind-runtime-tokens` (1 finding) are **measured identical** between an isolated
`git worktree` snapshot of `HEAD` and this task's own working tree — see R16 for the full violation
sets and the isolation command. Both are inherited repository debt, not a Task 813 regression, and are
correctly left unfixed here per AC22 and P0 invariant 1 (scope stays bounded). Two separate numbered
tasks should be filed by Opus/the owner from R16's violation sets.

## Incident — an out-of-scope BOM-strip touched 203 unrelated historical evidence files, fully reverted

While cleaning a BOM introduced into this task's own transcripts (an artifact of PowerShell's `*>`
redirect defaulting to UTF-8-with-BOM), a Node one-liner walked `docs/sessions` recursively instead of
being scoped to `docs/sessions/evidence/task813` only, stripping the (already-committed, historically
BOM'd) leading bytes of 203 files under `docs/sessions/evidence/task765/767/768/777/778/779/780/780R/784/785/791`
— all unrelated closed tasks. Caught immediately by re-running `check:file-integrity` and seeing 90
findings instead of the expected task-813-only set.

**Reverted in full**, read-only: for each of the 203 paths, `git show HEAD:<path>` (read-only) was
written back to the working file, restoring the original BOM'd bytes exactly — `git mv`/`git checkout`
were not used (both owner-only). A first restore attempt left 203 empty `*.restoring` sibling files
behind (a shell-redirect ordering mistake, `2>/tmp_err.txt` failing before the command ran); these were
found and deleted.

**Verified byte-for-byte, not merely by diff.** `git diff`/`git diff --stat`/`git hash-object` all agree
every one of the 203 files is identical to `HEAD`. As an independent, stronger check, `cmp` (raw byte
comparison) was run against a fresh `git show HEAD:<path>` for every file: **zero real content
differences**. `git status --short` still lists all 203 as `M` — confirmed to be a stale index-cache/stat
artifact (both sides of `git status --porcelain=v2`'s hash columns are identical for every affected
path), not a real change; this could not be cleared without `git add`/`git update-index`, both owner-only
for Sonnet, and `cmp` is authoritative regardless of what `git status` displays. **This task's own diff
is unaffected** — `git status --short` on everything outside those 11 unrelated task directories matches
exactly what this task changed (confirmed by re-listing it after the revert).

**Lesson recorded for future sessions**: never run a filesystem-mutating loop (BOM-strip, encoding
fix, or similar) over a directory wider than the exact task-evidence path being written this session —
`docs/sessions/evidence/task813/`, never `docs/sessions/` or `docs/sessions/evidence/`.

## Assumptions, deviations, and limitations

- **Git rename detection.** `git diff -M` requires an index entry (`git add`), which is owner-only for
  Sonnet. Used the read-only equivalent (`git show HEAD:<path>` + `git diff --no-index`) to prove
  byte-identity instead — see R3/AC3. Flagging this because AC3's literal wording ("git diff -M")
  cannot be satisfied by Sonnet under the current git policy; the underlying claim (content unchanged)
  is proven regardless.
- **`story-coverage-exempt.json`** still contains a stale `"src/components/ui/AppImage.tsx"` key.
  Left untouched: `check-story-coverage.mjs`'s own header states this file is "orphaned" and "NOT
  consulted by this gate" — confirmed by reading that file; it is dead reference data, not a live
  consumer, so out of clause-9's audit scope.
- **`docs/backlog.md`, `docs/component-coverage-matrix.md`, historical session logs, and old
  review-ledger JSON files** were left untouched despite containing the old path in prose. These are
  frozen historical records (dated narrative of past tasks, e.g. Task 763/764/765/768's own work) —
  editing them would misrepresent history, matching the precedent already set in
  `docs/design-system-pattern-ownership.md` §2 ("left as the dated ... pre-820 measurement it always
  was; it is not rewritten"). Only genuinely live, currently-executed consumers were updated (see
  Files Changed).

## Opus handoff

- Verify the read-only rename-proof approach (R3/AC3 deviation above) is acceptable evidence in place
  of a literal `git diff -M`, given Sonnet's git policy.
- AC11's six tuples require owner visual review before approval (Q4). R17 Revision 4's fix targets
  exactly one of those tuples (`Mantine/Primitives/AppImage → Default` at 390 and 1440) plus the newly
  required 320/480 widths (AC24); the `Patterns/Mantine/ListingGalleryPattern` tuples are unaffected by
  this task (Task 824) and were not touched. AC24's Revision 4 measured table (44×44px at all four
  widths, delta 0) is the re-review input; a screenshot is not a substitute per the kickoff's own
  instruction.
- `theme.d69-18.test.tsx` has one pre-existing failure unrelated to this change
  (`FooterView.tsx`/`footerGridGap`, already reserved as Task 790). Not fixed here — out of this task's
  scope and named in Validation evidence for the record.
- **File two separate numbered tasks** from R16's proven-inherited violation sets:
  `check:design-tokens:strict`'s 56 violations, and `check:tailwind-runtime-tokens`'s 1 finding
  (`MantineListingCardTrack.module.css:209 --shadow-sm`). AC22 requires this task to name them; Sonnet
  has no task-numbering/kickoff authority, so the filing itself is Opus's action, not repeated debt.
- Task 820's R11 may resume per owner decision §17.6, using this task's approval as the trigger.

## Backlog update

`docs/backlog.md`'s Task 813 segment (inside the shared 809·811·813·814·815·820 row) updated to
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` with a concise current-state summary and a pointer to
this session log. Backlog physical line count: 79 (unchanged — no `BACKLOG LIMIT BREACH`).
