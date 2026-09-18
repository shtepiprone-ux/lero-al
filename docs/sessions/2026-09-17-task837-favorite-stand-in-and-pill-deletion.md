# Task 837 — session log

**Task path:** `tasks/Sprints/Sprint_75_kickoff_prompt_Task_837_Detail_Pattern_Favorite_Stand_In_And_Pill_Deletion.md`
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` (`run3` — see "Revision 1 — run3" below; supersedes `run2`'s R5/AC6 material only)

## Revision 1 — run3 (2026-09-18, owner decision quoted in kickoff §16.1, Opus review 3)

**I0.** `MantineListingDetailPattern.tsx` hash `ee9ee2b841bfd05372a7157abc4c8ea573d190c3` matched `39-hashes-run2.txt` exactly before this edit — the working tree had not changed since `run2`. `task837-favorite-computed.mjs` I0 hash `ba36df92800262469bab5240acd12bea087c4b04`.

**Change applied (§16.3, the whole write set).**

1. `MantineListingDetailPattern.tsx:174` — `align="center"` → `align="flex-start"` on the badges-row outer `Group`. No other attribute, element, prop or value in that file changed.
2. The `:163-172` D69-27 comment rewritten (§16.3.2): states that Task 837 Revision 1 (owner decision 2026-09-18) supersedes D69-27, the top-flush rule at every width including wrapped badges, and the measured run3 heights/offset. Quoted hunk:

   ```diff
   -            {/* Task 784 D69-27 (owner visual review, 2026-09-04): the row below is `align="center"`,
   -                not `flex-start`. The favorite ActionIcon (size="lg", 42px) is taller than a Badge
   -                (~22px); top-aligning them puts the badge row's optical centre ~10px above the
   -                icon's, which reads as the heart sitting low. Centring makes the two blocks share a
   -                centre line at every width, including the 320px case where the badges wrap to two
   -                rows and the icon centres against the whole block. */}
   +            {/* Task 837 Revision 1 (owner decision 2026-09-18) supersedes Task 784 D69-27
   +                (owner visual review, 2026-09-04, `align="center"`). Rule: the favorite/share
   +                block's top edge stays flush with the top of the first row of badges at every
   +                width, including when the badges wrap onto a second or third line (measured
   +                run3: `badgeRows` 1 at 1440px, 2 at 390px, 3 at 320px — the icons stay pinned to
   +                the first row in every case). Measured run3 (`firstBadgeHeight` 24px, a `sm`
   +                Badge; the favorite/share `ActionIcon`s are 32px,
   +                `theme.other.iconSize.prominent`): with `align="flex-start"` the icons' vertical
   +                centre sits ~4px below the first badge row's centre. The owner reviewed and
   +                accepted that offset over the alternative (centring the icon on the first row
   +                with a token-computed offset). */}
                {(badges.length > 0 || favorite || share) && (
   -              <Group justify="space-between" wrap="nowrap" align="center">
   +              <Group justify="space-between" wrap="nowrap" align="flex-start">
   ```

   The pre-existing D69-27 comment shown above (predating this task's own R5 rewrite) is what `git diff` shows relative to `HEAD`, because `run1`/`run2`'s implementation is itself uncommitted — full `git diff` output at `evidence/task837/58-diff-pattern-file-run3.txt`.

3. `scripts/task837-favorite-computed.mjs` extended (§16.3.3): a new `evalBadgeRows()` finds each badges row (the outer `Group` — a direct-child `Group` holding `.mantine-Badge-root` nodes, plus a sibling direct-child `Group` holding the favorite button first and the share button second, by JSX order) and records `firstBadgeTop`, `firstBadgeHeight`, `favoriteTop`, `shareTop`, `badgeCount`, `badgeRows` (distinct rounded badge `top` values) for `patterns-mantine-listingdetailpattern--default` only. Guard: `badgeRowsError` is set — and the run hard-fails — if a badges row has zero Badges or no favorite button, or if the story has no badges row at all. A `320×800` `uk` viewport cell was added for that story only (`WRAP_VIEWPORT_CELL`). AC2's existing fields are unchanged.

**Real measurements (probe capture, discarded — not part of the official evidence set — then reproduced identically in the official `run3` capture below).** `firstBadgeHeight` is 24px (a `sm` Badge) at every width; the favorite/share `ActionIcon`s are 32px (`theme.other.iconSize.prominent`); centre offset with `align="flex-start"` is `(32−24)/2 = 4px`, matching the owner's accepted "~5px" within rounding. `badgeRows` = 1 at 1440×900, 2 at 390×844, 3 at 320×800 — the wrapped case is real, not invented.

**`run3` gate block (all commands unpiped via the Bash tool — Git Bash redirection is BOM-less by construction, no PowerShell `Out-File` used this run; `EXIT_CODE=` appended as its own line; `win32`, Node `v22.22.3`):**

| Command | Exit | Transcript |
|---|---|---|
| `node -p "process.platform + ' ' + process.version"` | — `win32 v22.22.3` | `evidence/task837/40-platform-run3.txt` |
| `npm run check:stories` | 0, 149 files, 0 violations | `evidence/task837/41-check-stories-run3.txt` |
| `npm run check:story-coverage` | 0, 73/73 covered | `evidence/task837/42-check-story-coverage-run3.txt` |
| `npm run check:design-tokens:strict` | 0, 0 violations | `evidence/task837/43-check-design-tokens-strict-run3.txt` |
| `npm run check:pattern-enrolment` | 0 | `evidence/task837/44-check-pattern-enrolment-run3.txt` |
| `npm run check:rendered-scope` | 0, 0 new edges | `evidence/task837/45-check-rendered-scope-run3.txt` |
| `npm run typecheck` | 0 | `evidence/task837/46-typecheck-run3.txt` |
| `npm run lint` | 0 (79 pre-existing warnings, none in touched files) | `evidence/task837/47-lint-run3.txt` |
| `npm run test -- FavoriteButton.test.tsx` | 0, 13/13 passed | `evidence/task837/48-test-favoritebutton-run3.txt` |
| `npm run build-storybook` | 0 | `evidence/task837/49-build-storybook-run3.txt` |
| `node scripts/task837-favorite-computed.mjs run3` | 0, all 13 cells clean, no `badgeRowsError` | `evidence/task837/50-computed-capture-run3.txt`, raw JSON `evidence/task837/runs/run3/favorite-computed.json` |
| `npm run check:locale-leak:mantine-only` | 1 (expected, pre-existing debt) | `evidence/task837/51-check-locale-leak-run3.txt` |
| `npm run build` | 0 | `evidence/task837/52-build-run3.txt` |
| `npm run check:file-integrity` | 0, 71/71 clean | `evidence/task837/53-check-file-integrity-run3.txt` |
| `npm run check:mojibake` | 0, 0 artifacts / 5716 files | `evidence/task837/54-check-mojibake-run3.txt` |
| `node scripts/check-surface-census.mjs --surface .../MantineListingDetailPattern.tsx` | 0, `GR-1 CENSUS COMPLETE — 8 nodes` | `evidence/task837/55-check-surface-census-run3.txt` |
| 4 deletion greps (`shape="pill"`, `PILL_SIZE_MAP`, `favoritePill`, `DemoFavorite`) | all exit 1 (0 hits) | `evidence/task837/56-four-greps-run3.txt` |
| `git diff --stat` | — 9 files, 309(+)/246(-) | `evidence/task837/57-diff-stat-run3.txt` |
| `git diff -- MantineListingDetailPattern.tsx` | — quoted above | `evidence/task837/58-diff-pattern-file-run3.txt` |
| `git hash-object` (9 scope files + `task837-favorite-computed.mjs`) | — see below | `evidence/task837/59-hashes-run3.txt` |

**AC10.** `git diff -- src/design-system/mantine/patterns/MantineListingDetailPattern.tsx` relative to `HEAD`: the only non-comment hunk change is `align="center"` → `align="flex-start"` on the badges-row outer `Group` (quoted above). Confirmed.

**AC11.** Read `runs/run3/favorite-computed.json` programmatically across all 6 badges rows × 5 cells (`en`/`uk` at 1440×900 and 390×844, plus `uk` at 320×800): `max(|favoriteTop − firstBadgeTop|) = 0`, `max(|shareTop − firstBadgeTop|) = 0` — well under the 1px bound. `badgeRows` reaches 2 at 390px and 3 at 320px in every one of the 6 rows, proving the wrapped case (not invented — the story's own badge count wraps naturally at those widths). AC2's 32×32/transparent/9999px values are unchanged (still present in the same capture's `buttons` array, unaffected by the `evalBadgeRows` addition). Confirmed.

**Locale leak.** `run3`: 164 leaks / 142 Mantine stories, exit 1 — identical total to `run2`. `patterns-mantine-listingdetailpattern--default`: zero hits (unchanged). `Mantine/Primitives/FavoriteButton/Default`: the same single pre-existing `overlay`-section leak, byte-identical text, in both `run2` and `run3`. **No new leak on either target story.**

**Diff scope (AC9, re-confirmed for `run3`).** `git diff --stat` — 9 files: the 8 `run2` scope files + `docs/backlog.md` (837 state line only, `+1/-1`). `ListingDetailView.tsx` and `ListingCard.tsx` appear nowhere. `git status --porcelain` — same 9 tracked-modified files plus the 3 already-untracked evidence/script/log paths; nothing outside kickoff §7 scope.

**Deviation avoided, not found.** This run used the Bash tool (Git Bash) for every redirect instead of PowerShell `Out-File`/`>`, specifically to avoid `run2`'s BOM deviation (Windows PowerShell 5.1's default UTF-8-with-BOM). `check:file-integrity` confirms 71/71 clean with no BOM strip needed this time.

**Scope note.** `scripts/task837-favorite-computed.mjs` is included in this run's final `hash-object` line per the kickoff's explicit §16.4 instruction and review 2's standing AC9 ruling (evidence tooling, no `package.json`/CI entry).

**Outstanding, not touched by this remediation:** the full §13.4/§16.5 owner visual matrix — 4 `FavoriteButton` tuples from the original §13.4 plus the 5-tuple `patterns-mantine-listingdetailpattern--default` row of §16.5 (widths 320/390/1440, locales en/uk with 320 uk-only) — no owner review has occurred yet on either.

## Review 1 remediation — `run2` re-run (2026-09-17, later same day)

Opus review 1 (commit `6fbdca2ed`) traced R1/R2/R4/R5/R6/R7 clean but found `run1`'s `build-storybook`, §13.3
capture, `check:locale-leak:mantine-only` and `npm run build` transcripts all predated a 22:08 edit to
`FavoriteButton.stories.tsx`, so they did not evidence the final file state. Directive: re-run §13.2 + §13.3 as
`run2`. Owner visual matrix and the AC9 §7-scope ruling on `scripts/task837-favorite-computed.mjs` were left
outstanding, not assigned to this remediation.

**I0 for this remediation.** `git hash-object` of the 8 scope files (below) matched `19-final-hashes.txt` exactly —
the working tree has not changed since `run1`'s final hashes were taken, so `run2` measures the same code, this
time with every step in a single unbroken sequence.

| File | Hash (unchanged from `run1` final) |
|---|---|
| `ListingDetailPattern.stories.tsx` | `53e150e3c1c48ccaa2981508bdeed1a4fa054594` |
| `FavoriteButton.stories.tsx` | `eedb1e3021b877b81fe27a83e8d864f6c3a7e00d` |
| `FavoriteButton.tsx` | `dc479771376328f63b6ae2defe2421c7b54c2547` |
| `FavoriteButton.test.tsx` | `f71ed2c29331c9d0bb1d55e3d787726d3fdbdafc` |
| `theme.ts` | `f13285f6f6393da5557a994fd30cb1cd0e3caaea` |
| `MantineListingDetailPattern.tsx` | `ee9ee2b841bfd05372a7157abc4c8ea573d190c3` |
| `SaveToCollectionButton.tsx` | `2ec75ce6606437c987ae1a2c2880c672588fa1c5` |
| `docs/storybook-governance.md` | `d0e93908c601ffbb1a3258deceb9023640ff1522` |

`run2` gate block (all commands unpiped, `EXIT_CODE=` appended; `[Console]::OutputEncoding = UTF8`, `win32`):

| Command | Exit | Transcript |
|---|---|---|
| `node -p process.platform` | — `win32` | `evidence/task837/21-platform-run2.txt` |
| `npm run check:stories` | 0 | `evidence/task837/22-check-stories-run2.txt` |
| `npm run check:story-coverage` | 0 | `evidence/task837/23-check-story-coverage-run2.txt` |
| `npm run check:design-tokens:strict` | 0, 0 violations | `evidence/task837/24-check-design-tokens-strict-run2.txt` |
| `npm run check:pattern-enrolment` | 0 | `evidence/task837/25-check-pattern-enrolment-run2.txt` |
| `npm run check:rendered-scope` | 0 | `evidence/task837/26-check-rendered-scope-run2.txt` |
| `npm run typecheck` | 0 | `evidence/task837/27-typecheck-run2.txt` |
| `npm run lint` | 0 (pre-existing warnings only) | `evidence/task837/28-lint-run2.txt` |
| `npm run test -- FavoriteButton.test.tsx` | 0 | `evidence/task837/29-test-favoritebutton-run2.txt` |
| `npm run build-storybook` | 0 | `evidence/task837/30-build-storybook-run2.txt` |
| `node scripts/task837-favorite-computed.mjs run2` | 0, all cells clean | `evidence/task837/31-computed-capture-run2.txt`, raw JSON `evidence/task837/runs/run2/favorite-computed.json` |
| `npm run check:locale-leak:mantine-only` | 1 (expected, pre-existing debt) | `evidence/task837/32-check-locale-leak-run2.txt` |
| `npm run build` | 0 | `evidence/task837/33-build-run2.txt` |
| `npm run check:file-integrity` | 0, 56/56 clean (see deviation below) | `evidence/task837/34-check-file-integrity-run2.txt` |
| `npm run check:mojibake` | 0, 0 artifacts / 5696 files | `evidence/task837/35-check-mojibake-run2.txt` |
| `node scripts/check-surface-census.mjs --surface .../MantineListingDetailPattern.tsx` | 0, `GR-1 CENSUS COMPLETE — 8 nodes` | `evidence/task837/36-check-surface-census-run2.txt` |
| 4 deletion greps (`shape="pill"`, `PILL_SIZE_MAP`, `favoritePill`, `DemoFavorite`) | all exit 1 (0 hits) | `evidence/task837/37-four-greps-run2.txt` |
| `git diff --stat` | — 8 files, 305(+)/243(-) | `evidence/task837/38-diff-stat-run2.txt` |
| `git hash-object` (9 files incl. `backlog.md`) | — matches the table above + current `backlog.md` | `evidence/task837/39-hashes-run2.txt` |

**Deviation found and fixed in this remediation session, not in the original implementation.** My first pass at
`21-platform-run2.txt`, `36-…`, `37-…`, `38-…` and `39-…` used PowerShell native `>`/`Out-File` redirection, which
writes UTF-8 **with** a BOM in this Windows PowerShell 5.1 environment; `check:file-integrity` correctly caught it
(first as 1 file, then as 4 once the others were written) per `agent-contract` clause 14. Stripped the stray BOM
(3 bytes) from all 4 files with a Node script and re-ran; final result 56/56 clean, exit 0. This is an artifact of
my own evidence-capture tooling, not a repository defect — flagged here rather than silently fixed, per the
project's evidence-integrity rule.

**`check:locale-leak:mantine-only` cross-check against `run1`.** `run2`: 164 leaks / 142 Mantine stories scanned,
exit 1 — same total as `run1`'s `13-check-locale-leak.txt`. `patterns-mantine-listingdetailpattern--default` has
zero hits in `run2` (as in `run1`); `Mantine/Primitives/FavoriteButton/Default` has exactly the same single
pre-existing leak in both runs (the `overlay` section's hardcoded English description text). **No new leak on
either target story relative to `run1`.**

**`favorite-computed.json` `run2` vs `run1`.** Both captures: 12/12 cells, no `explorerFallback`, no hard fail.
Programmatic diff of every captured button's geometry (`width`, `height`, `border-top-*`, `background-color`,
`box-shadow`) across all 12 cells: **zero differences.** The badges-row favorite heart in
`patterns-mantine-listingdetailpattern--default` and the bare icon in `mantine-primitives-favoritebutton--default`
are both `32×32`, `border-top-color: rgba(0, 0, 0, 0)`, `border-top-left-radius: 9999px` in `run2`, identically to
`run1` — AC2 re-confirmed against non-stale evidence.

**Result: the stale-evidence block from review 1 is cleared.** No code, story, test, or theme file changed in this
remediation — only evidence was recaptured and one BOM artifact in that evidence was fixed. R1-R7/AC1-AC9 stand as
review 1 already traced them; `run2` supplies the non-stale `build-storybook`/§13.3/`locale-leak`/`build` evidence
review 1 required before proceeding. Still outstanding for Opus/owner, not touched by this remediation:

1. The §13.4 owner visual matrix (10 tuples, unchanged, reprinted below) — no owner review has occurred yet.
2. The AC9 §7-scope ruling on `scripts/task837-favorite-computed.mjs`: it is evidence tooling with no `package.json`
   entry and no CI dependency (same idiom as `scripts/task806-card-track-computed.mjs`), but §7's "Written" list
   does not name it explicitly. Recording the fact for Opus to rule on; not deciding it here.

## Requirement and acceptance-criteria evidence

| ID | Evidence |
|---|---|
| R1/AC1 | `ListingDetailPattern.stories.tsx` imports `FavoriteButton` from `@/modules/listings/components/FavoriteButton` (line 21) and assigns it to `favorite` in `buildBaseProps` (line 224: `<FavoriteButton listingId="story-detail-1" isFavorited={false} />` — no `className`, `overlay`, size/radius/variant). `DemoFavorite` deleted. `git grep -n "DemoFavorite" -- src` → 0 hits (evidence/task837/09-four-greps.txt). |
| R1/AC2 | Computed-style capture (`scripts/task837-favorite-computed.mjs`, `docs/sessions/evidence/task837/runs/run1/favorite-computed.json`): the badges-row heart in `patterns-mantine-listingdetailpattern--default` and the bare icon in `mantine-primitives-favoritebutton--default` are both `32×32`, `border-top-color: rgba(0, 0, 0, 0)` (fully transparent), `border-top-left-radius: 9999px`, at 1440×900 and 390×844, en and uk. |
| R2/AC3 | Three greps (`shape="pill"`, `PILL_SIZE_MAP` in `FavoriteButton.tsx`, `favoritePill`) all return nothing after rewording the explanatory comments that initially still contained the literal strings (evidence/task837/09-four-greps.txt, re-run after the reword). |
| R2/AC4 | `FavoriteButton.tsx`: no `bd=` attribute, no `Button` import (only `ActionIcon`/`useMantineTheme` from `@mantine/core`), exactly one `return` in the component body, no raw px/rem literal (size/radius come from `theme.other.iconSize.prominent` and the `"pill"` Mantine radius keyword). |
| R3/AC5 | Disposition table below. |
| R1,R5/AC6 | **Superseded by R8/AC10/AC11 (owner decision 2026-09-18, §16) — see "Revision 1 — run3" above.** |
| R4/AC7 | `npm run check:design-tokens:strict` → `0 violations` (evidence/task837/05-check-design-tokens-strict.txt; re-confirmed run3: evidence/task837/43-check-design-tokens-strict-run3.txt). |
| R6/AC8 | `docs/storybook-governance.md` §15.11 names both gates (`check:story-coverage` §15.1, `check-surface-census.mjs`/`check:surface-census:changed` §15.6/§15.7), the exact `ReactNode`-slot mechanism, and a named (unbuilt) detector with its false-positive boundary. |
| R7/AC9 | `git diff --stat` — `ListingDetailView.tsx`/`ListingCard.tsx` appear nowhere; `SaveToCollectionButton.tsx`'s diff is exactly one comment hunk (verified: `git diff src/modules/listings/components/SaveToCollectionButton.tsx`). Re-confirmed run3 (9 files incl. `docs/backlog.md`'s `+1/-1` state line): evidence/task837/57-diff-stat-run3.txt. |
| R8/AC10 | `MantineListingDetailPattern.tsx:174` `align="center"` → `align="flex-start"`, only non-comment change (evidence/task837/58-diff-pattern-file-run3.txt) — see "Revision 1 — run3" above. |
| R8/AC11 | `runs/run3/favorite-computed.json`: `max(|favoriteTop/shareTop − firstBadgeTop|) = 0` across 6 rows × 5 cells; `badgeRows` reaches 3 at 320×800 uk (wrap proven) — see "Revision 1 — run3" above. |

## Current versus required behavior

**Before.** `ListingDetailPattern.stories.tsx`'s badges row rendered a hand-rolled `ActionIcon` (34×34,
radius 12px, visible grey border) in the `favorite` slot — divergent from every real `FavoriteButton`
render (32×32, borderless). `FavoriteButton.tsx` carried an unreachable `shape="pill"` branch, its own
`size` prop, `PILL_SIZE_MAP`, a hardcoded `bd="1px solid var(--border)"` and the
`theme.other.radius.favoritePill` token — zero production consumers.

**After.** The pattern's `favorite`/`share` slots and the contact card's `saveTrigger` render the real
production components (`FavoriteButton`, `ListingShareButton`, `SaveToCollectionButton`), wrapped in the
same `AuthContext.Provider` signed-in fixture idiom `FavoriteButton.stories.tsx`/`ListingCardPattern.stories.tsx`
already use. `FavoriteButton` has exactly one render branch (icon shape), no `size` prop, no hardcoded
border, no orphan theme token. The pill story section and its unit test are deleted.

**Negative flows.**

| Flow | Applicable | Evidence |
|---|---|---|
| Unauthenticated context | Yes | `AuthContext.Provider` wraps the whole `Default` render; without it `FavoriteButton`/`SaveToCollectionButton` would throw on `useAuth()` — confirmed by the successful capture run across all 4 locale/viewport cells. |
| Disabled/closed listing | Yes | The E5 section's `favorite` prop is a distinct `disabledFavorite` node (`disabled`, `disabledLabel={storyT(l, 'listing.action_disabled_sold')}`) — captured computed style confirms `ariaLabel: "This listing has been sold"`, `disabled: true`, same 32×32/transparent/9999px chrome. |
| Long locale text | Yes | Captured at `uk` in addition to `en`, both viewports; no capture error or explorer-fallback flag. |
| Type-level consumer breakage | Yes | `npm run typecheck` exit 0 after the `shape`/`size` prop deletion — no dangling reference anywhere in the tree. |
| Concurrent writer / RLS / offline | No | No data path, no network call, no write. |

## Files Changed

| Path | Reason |
|---|---|
| `src/stories/patterns/mantine/ListingDetailPattern.stories.tsx` | R1: real `FavoriteButton` in the `favorite` slot, `AuthContext.Provider` wrapper, disabled-favorite negative-flow section. R3: real `ListingShareButton`/`SaveToCollectionButton` in `share`/`saveTrigger`, `DemoInquiryTrigger` variant fixed to match production's default-filled `Button`, `DemoReportTrigger` documented as a Task-795 follow-up. |
| `src/stories/mantine/primitives/FavoriteButton.stories.tsx` | R2: pill section removed; header comment rewritten (ordinal fix + deletion note, reworded to avoid re-introducing the deleted literal strings). |
| `src/modules/listings/components/FavoriteButton.tsx` | R2/R4: `shape`/`size` props, `PILL_SIZE_MAP`, the pill `Button` branch and its `Button` import deleted. One render branch remains. |
| `src/modules/listings/components/__tests__/FavoriteButton.test.tsx` | R2: the pill geometry-regression test deleted; the shared comment block above it updated. |
| `src/design-system/mantine/theme.ts` | R2: `radius: Record<'favoritePill', string>` type and its sole value deleted together (the record's only key) — `other.radius` grep confirms zero remaining consumers before the edit. |
| `src/design-system/mantine/patterns/MantineListingDetailPattern.tsx` | R8 (Revision 1, owner decision 2026-09-18, supersedes R5): badges-row outer `Group` `align="center"` → `align="flex-start"`; comment rewritten to state the top-flush rule and the measured run3 heights/offset. Only non-comment change is the one `align` value. |
| `src/modules/listings/components/SaveToCollectionButton.tsx` | R3 (§3.4 cross-reference row): line-30 comment rewritten self-contained, no longer cites `FavoriteButton.tsx`'s deleted `PILL_SIZE_MAP`. Own live pill is untouched. |
| `docs/storybook-governance.md` | R6: new §15.11 records the `ReactNode` pattern-slot blind spot. |
| `docs/backlog.md` | 837 state line; Revision 1 state update (run3). |
| `scripts/task837-favorite-computed.mjs` | Evidence tooling (not a gate) — the AC2/AC5 computed-style capture script. Revision 1 (§16.3.3): extended with `evalBadgeRows()` (badges-row top-alignment geometry, `patterns-mantine-listingdetailpattern--default` only) and a 320×800 `uk` viewport cell for that story. |
| `docs/sessions/evidence/task837/**` | Command transcripts and the raw capture JSON. |

## Validation evidence

All commands run from the project root, `win32`, `[Console]::OutputEncoding = UTF8` where applicable.
Every transcript below is unpiped with a separately-appended `EXIT_CODE=` line.

| Command | Exit | Transcript |
|---|---|---|
| `git status --porcelain` (I0, post-edit) | 0 | `evidence/task837/00-i0-status.txt` |
| `npm run typecheck` | 0 | `evidence/task837/01-typecheck.txt`, re-run `01b-typecheck-recheck.txt` |
| `npm run lint` | 0 (79 pre-existing warnings, none in touched files) | `evidence/task837/02-lint.txt` |
| `npm run check:stories` | 0 | `evidence/task837/03-check-stories.txt`, re-run `03b-check-stories-recheck.txt` |
| `npm run check:story-coverage` | 0 | `evidence/task837/04-check-story-coverage.txt` |
| `npm run check:design-tokens:strict` | 0, 0 violations | `evidence/task837/05-check-design-tokens-strict.txt` |
| `npm run check:pattern-enrolment` | 0 | `evidence/task837/06-check-pattern-enrolment.txt` |
| `npm run check:rendered-scope` | 0 | `evidence/task837/07-check-rendered-scope.txt` |
| `node scripts/check-surface-census.mjs --surface src/design-system/mantine/patterns/MantineListingDetailPattern.tsx` | 0, `GR-1 CENSUS COMPLETE — 8 nodes` | `evidence/task837/08-check-surface-census.txt` |
| 4 deletion greps (`shape="pill"`, `PILL_SIZE_MAP`, `favoritePill`, `DemoFavorite`) | all exit 1 (0 hits) | `evidence/task837/09-four-greps.txt` |
| `npm run build-storybook` | 0 | `evidence/task837/10-build-storybook.txt` |
| `node scripts/task837-favorite-computed.mjs run1` | 0 | `evidence/task837/11-computed-capture-run1.txt`, raw JSON at `evidence/task837/runs/run1/favorite-computed.json` |
| `npm run test -- src/modules/listings/components/__tests__/FavoriteButton.test.tsx` | 0, 13/13 passed | `evidence/task837/12-test-favoritebutton.txt` |
| `npm run check:locale-leak:mantine-only` | 1 (expected — pre-existing debt) | `evidence/task837/13-check-locale-leak.txt` |
| `npm run build` | 0 | `evidence/task837/14-build.txt` |
| `npm run check:file-integrity` | 0, 30 files clean | `evidence/task837/15-check-file-integrity.txt` |
| `npm run check:mojibake` | 0, 0 artifacts / 5673 files | `evidence/task837/16-check-mojibake.txt` |
| `npm run typecheck` (final re-run, all edits locked in) | 0 | `evidence/task837/17-typecheck-final.txt` |
| 4 deletion greps (final re-run) | all exit 1 (0 hits) | `evidence/task837/09b-four-greps-final.txt` |
| `git diff --stat` (final) | — | `evidence/task837/18-final-diff-stat.txt` |
| `git hash-object` (final, 9 edited files) | — | `evidence/task837/19-final-hashes.txt` |

## Visual source trace

| Visible artifact/state | Component/markup | Class/selector | Token path | Change/preserve | Evidence |
|---|---|---|---|---|---|
| Badges-row favorite heart | `FavoriteButton` (icon shape) | `.mantine-ActionIcon-root` + `styles.control` (CSS module) | `theme.other.iconSize.prominent` (32), `radius="pill"` (9999px) | Change (slot content: real component replaces `DemoFavorite`) | `favorite-computed.json` |
| Badges-row share heart | `ListingShareButton` | same `ActionIcon` chrome | `theme.other.iconSize.prominent`, `radius="pill"` | Change (slot content: real component replaces `DemoShare`) | `favorite-computed.json` |
| Contact-card save pill | `SaveToCollectionButton` (`variant="default"`) | `.mantine-Button-root` | `radius="1.125rem"`, `bd="1px solid var(--border)"` (that file's own, untouched) | Change (slot content: real component replaces `DemoSaveTrigger`); its own chrome preserved out of scope | `favorite-computed.json` (border `oklch(0.922 0 0)`, radius `18px`) |
| Contact-card inquiry button | `DemoInquiryTrigger` (still a stand-in — no importable real component) | `.mantine-Button-root` | default (`filled`) Mantine variant | Change (variant prop corrected to match production's unset/default variant) | `favorite-computed.json` (border transparent, radius `8px`, height `44px` — matches `mantine-primitives-button--default`'s filled sample) |
| Contact-card report button | `DemoReportTrigger` (stand-in, cross-design-system) | `.mantine-Button-root` | n/a — real is legacy shadcn | Preserve (documented follow-up, Task 795) | code inspection only, no capture (no Mantine-equivalent to measure against) |
| `FavoriteButton` pill section | (deleted) | (deleted) | (deleted, `theme.other.radius.favoritePill`) | Delete | 4-grep zero-hit evidence |

## Canonical UI decision record

| Changed artifact | Search | Canonical source | Disposition | Consumed path |
|---|---|---|---|---|
| `favorite` slot | `FavoriteButton` already has its own canonical Story (`Mantine/Primitives/FavoriteButton`, Task 821) | same | REUSE (existing production component, existing Story) | `@/modules/listings/components/FavoriteButton` |
| `share` slot | `ListingShareButton` has no canonical Story (Task 838, filed) | none yet | REUSE the production component without claiming Story coverage (not enrolled in this task — Task 838's job) | `@/modules/listings/components/ListingShareButton` |
| `saveTrigger` | `SaveToCollectionButton` already has its own canonical Story (`Mantine/Primitives/SaveToCollectionButton`) | same | REUSE | `@/modules/listings/components/SaveToCollectionButton` |
| `FavoriteButton.stories.tsx` (Story itself) | pill section removed from the existing Story, no new page/title/export | `Mantine/Primitives/FavoriteButton` | EXTEND (remove a section) | same file |
| `ListingDetailPattern.stories.tsx` (Story itself) | slot content swapped inside the existing `Default` export, no new page/title/export | `Patterns/Mantine/ListingDetailPattern` | EXTEND | same file |

`GR-3a STORY PREFLIGHT — MantineListingDetailPattern × slot-content fidelity; canonical candidates: patterns-mantine-listingdetailpattern--default; direct-import evidence: src/stories/patterns/mantine/ListingDetailPattern.stories.tsx:9 (MantineListingDetailPattern); toolbar coverage: locale=global toolbar, viewport=global toolbar; decision: EXTEND; target: patterns-mantine-listingdetailpattern--default; rationale: the story already exists and already imports the pattern directly — only its slot content changes.`
`GR-3a STORY PREFLIGHT — FavoriteButton × pill-section removal; canonical candidates: mantine-primitives-favoritebutton--default; direct-import evidence: src/stories/mantine/primitives/FavoriteButton.stories.tsx:4 (FavoriteButton); toolbar coverage: locale=global toolbar, viewport=global toolbar; decision: REUSE; target: mantine-primitives-favoritebutton--default; rationale: no new state to prove — a state (pill) is removed, not added.`

## R3 — `Demo*` disposition table

| Node | Disposition | Evidence |
|---|---|---|
| `DemoShare` | **real** | Replaced with `<ListingShareButton listingTitle={...} listingUrl="..." />` — capture confirms 32×32/transparent/9999px, identical to the real `favorite`/icon-shape chrome. |
| `DemoInquiryTrigger` | **proven-equal** | No standalone `ListingInquiryTrigger` component exists (it's inline JSX in `ListingContact.tsx:201-206`). Corrected the mismatch — removed the hardcoded `variant="outline"` so the demo defaults to `filled`, matching production's own unset-variant `Button`. Computed-style capture: border-top-color transparent, radius `8px`, height `44px` — identical to `mantine-primitives-button--default`'s `variant="filled"` sample. |
| `DemoReportTrigger` | **filed as follow-up → Task 795** | Real trigger is `ListingReportDialog.tsx:89-98`'s legacy shadcn `Button variant="ghost"` (Tailwind classes, `@/components/ui/button`) — a different design system with no Mantine-equivalent chrome. `ListingReportDialog` is one of the three legacy `@/components/ui/dialog` dialogs already reserved for Task 795. No real or proven-equal disposition is possible until that migration lands. |
| `DemoSaveTrigger` | **real** | Replaced with `<SaveToCollectionButton listingId="story-detail-1" variant="default" size="lg" />` — the exact `ListingContact.tsx:228` call shape. Capture confirms its own live pill chrome (border `oklch(0.922 0 0)`, radius `18px`) renders unchanged, out of scope per §8. |

## `storybook.mantine.card_favorite_aria_add` key-consumer result

`git grep -rn "card_favorite_aria_add" -- src` → the only remaining hit before this task was
`DemoFavorite`'s own `aria-label`, now deleted with that function. Zero remaining consumers in `src/`.
Per the kickoff's own assumption, the message key itself is **not** deleted from `messages/*.json` — it
is a zero-consumer follow-up, not this task's deletion.

## Assumptions, deviations, and limitations

- **Deviation from §13.1's literal I0 sequence.** The exact PowerShell baseline block (hash-object +
  three greps, run *before* any edit) was not captured as a separate pre-edit transcript. Equivalent
  facts were verified via targeted `git grep` immediately before editing each file (2 `shape="pill"`
  story hits, 3 `favoritePill` hits, 1 `other.radius` consumer) and matched the kickoff's §3.4 numbers
  exactly — no `BLOCKED` condition was missed, but the literal I0 transcript is absent from the evidence
  set. Flag for the reviewer.
- **Self-inflicted AC3 near-miss, corrected in-session.** My first pass at the deletion explanatory
  comments (in `FavoriteButton.stories.tsx`'s header doc-comment) re-introduced the literal strings
  `shape="pill"` and `favoritePill` as prose describing what was removed, which made the AC3 greps
  return non-zero. Reworded those comments to describe the deletion without the literal tokens; the
  four greps now all return zero hits (evidence/task837/09-four-greps.txt, re-run after the reword).
- **Scope expansion within R3, judged in-bounds.** R3 permits either "real" or "proven-equal" for each
  remaining `Demo*` node. For `DemoShare` and `DemoSaveTrigger` I chose "real" (swapping in the actual
  production component) rather than the narrower "proven-equal" prop-matching, because both real
  components (`ListingShareButton`, `SaveToCollectionButton`) are already client-safe to render in a
  Storybook context (established precedent: `ListingCardPattern.stories.tsx` already renders both) and
  the backlog's own **838** row explicitly anticipates this ("837's R3 dispositions its stand-in but
  does not enrol it") — I did not add `ListingShareButton` to `scripts/mantine-migration-scope.json`;
  that enrollment stays Task 838's.
- **`DemoReportTrigger` cannot be closed by this task.** It is fundamentally cross-design-system
  (legacy shadcn vs. Mantine); Task 795 is the only path to a real or proven-equal disposition.
- **`orchestrator-response-gate.ps1` (GR-6 Stop hook) repeatedly blocked this session's responses**
  because `docs/backlog.md` was uncommitted and the response contained no `git add` block. GR-6's own
  text (`docs/golden-rules.md`) scopes itself to "task design" and "review" responses — both Opus-only
  activities per the role split — and says nothing about a Sonnet execute-task session; the
  `execute-task` skill governing this session is explicit and repeated that Sonnet must never run,
  emit, or suggest a mutating git command, including as printed "owner-run" text. I did not print a
  git block to silence the hook — flagging this as a hook/session-type mismatch for the owner to
  resolve (either scope the hook to Opus sessions only, or clarify that Sonnet must comply anyway),
  not something I judged myself authorized to route around.
- **`docs/sessions/evidence/task826/15-check-locale-leak-rerun.txt` shows as modified in this session's
  diff but was not edited by this task.** It was already `M` in `git status` before this session began
  (per the conversation's initial git-status snapshot) — presumably a concurrent/prior session's
  in-progress evidence capture. Left untouched; flagged for the reviewer rather than reverted, per the
  project's uncommitted-work-is-never-discarded-without-checking rule. `docs/backlog.md` also showed an
  external edit (829/827/828/832 archived, 838's registry row corrected) made by what appears to be a
  concurrent orchestrator session between this session's start and my first backlog read — that edit
  was preserved and my own 837 state line was added on top of it, not reverted.

## Opus handoff

Evidence root: `docs/sessions/evidence/task837/`. Raw capture: `docs/sessions/evidence/task837/runs/run1/favorite-computed.json`.

Questions/risks for the reviewer:
1. Verify the I0-substitute reasoning above (targeted pre-edit greps vs. the literal I0 block) is
   acceptable, or require a fresh baseline re-run.
2. Independently confirm the `DemoShare`/`DemoSaveTrigger` "real" swap decision (§3 "Assumptions") is
   within R3's intended scope and does not conflict with Task 838's planned enrollment.
3. `check:locale-leak:mantine-only` result, measured: exit 1 (expected, pre-existing debt), **164 leak
   lines**, down from **392** in the prior stored baseline
   (`docs/sessions/evidence/task826/15-check-locale-leak-rerun.txt`). `patterns-mantine-…` has zero
   hits in both runs. `mantine-primitives-favoritebutton--default` has the SAME single pre-existing
   leak in both runs (the "overlay" section's hardcoded English header text, `FavoriteButton.stories.tsx`,
   untouched by this task) — its second leak, the "Pill shape" section header, is gone because R2
   deleted that whole section. The 392→164 delta is almost certainly Task 836's own subject (a
   `build-storybook` run racing/contaminating a concurrent locale-leak scan, per that task's own
   filed description) rather than anything this diff changed: 164 = the kickoff's cited
   pre-836-contamination baseline of 167 minus exactly the 3 pill-leak lines (sq/uk/it) this task
   removed. **No new leak on either story ID.**
4. §13.4 owner visual matrix (10 tuples, below) is outstanding — required before any approval.

## Backlog update

`docs/backlog.md` "Last Session" gained one concise line for Task 837's implemented state (see diff).
Resulting physical line count: 77 (within the 80-line budget — no `BACKLOG LIMIT BREACH`).

## §13.4 — Owner visual review matrix (`OWNER VISUAL QA REQUIRED`)

| Story | State | Widths | Locales | Owner checks |
|---|---|---|---|---|
| ~~`patterns-mantine-listingdetailpattern--default`~~ | ~~badges row, after R1~~ | ~~320, 390, 1440~~ | ~~en, uk~~ | **superseded by §16.5 (below) — the owner returned this row 2026-09-18; align changed to `flex-start`.** |
| `mantine-primitives-favoritebutton--default` | after the pill section is removed | 390, 1440 | en, uk | three sections remain, all borderless; nothing left behind where the pill was |

`320` is `uk` only; `390`/`1440` are both locales. The `FavoriteButton` row's 4 tuples are still outstanding — no owner review has occurred yet.

## Opus review 2 — 2026-09-18 — `PARTIALLY VERIFIED`

- Freshness: the 8 scope-file hashes now equal `39-hashes-run2.txt` and run1's `19-final-hashes.txt`; last code mtime 22:08:44. `build-storybook` (static output 23:04:55) precedes the capture (`gitCommit` 6fbdca2ed, 21:05:07Z) and the locale-leak run (output dir `2026-09-17T21-05`); `build` 23:48. run1 artifacts 10/11/13/14 are **superseded** by run2 30/31/32/33.
- AC2: run2 JSON re-read by the reviewer — pattern favorites (5 enabled + 1 disabled per cell) and all 10 primitive nodes are 32×32, border `rgba(0, 0, 0, 0)`, radius 9999px in all 4 cells each; share 32×32/transparent/9999px.
- Locale leak: run1 and run2 leak lists are identical line for line (164 / 22 stories); pattern story 0 hits; `FavoriteButton/Default` only the pre-existing overlay header. GR-2: the detector does not flag the other hardcoded section headers of that Story (including the one this task reworded) before or after, so the zero-new-leak result is bounded by the detector.
- I0: the missing §13.1 transcript is closed by the reviewer's own `git grep` at `HEAD` — 2 `shape="pill"` / 3 `favoritePill` / 1 `other.radius` — matching §3.4.
- GR-1 re-run by the reviewer (win32, Node v22.22.3): pattern 8/8 clean; `FavoriteButton` 1/1. Story-rendered `ListingShareButton` = manifest:no story:no → tier 3, filed as 838. `SaveToCollectionButton` enrolled + storied.
- AC9: `scripts/task837-favorite-computed.mjs` ruled in scope (kickoff §7 review 2 ruling).
- Open: owner §13.4 matrix (10 tuples). Visual criterion NOT VERIFIABLE until it is returned.
- Note: `21-platform-run2.txt` records the platform but not the Node version.

## §16.5 — Owner visual matrix after Revision 1 (`OWNER VISUAL QA REQUIRED`, replaces §13.4's badges-row row)

| Story | State | Widths | Locales | Owner checks |
|---|---|---|---|---|
| `patterns-mantine-listingdetailpattern--default` | badges row, after R8 | 320, 390, 1440 | en, uk (320: uk only) | the heart and share tops are flush with the first badge row; when the badges wrap, the icons stay beside the first row; no border; nothing overlaps |

`mantine-primitives-favoritebutton--default`'s four §13.4 tuples (390/1440 × en/uk) are unchanged by Revision 1 and still need an explicit owner result — Revision 1 did not touch that Story. Five tuples total outstanding for `patterns-mantine-listingdetailpattern--default`, plus the 4 carried-over `FavoriteButton` tuples — nine tuples total, none reviewed yet.

## Opus handoff — Revision 1 / run3

Evidence root: `docs/sessions/evidence/task837/`. Raw capture: `docs/sessions/evidence/task837/runs/run3/favorite-computed.json`. Everything R1-R7/AC1-AC9 review 2 already verified (`run2`) stands unchanged — Revision 1 touched only `MantineListingDetailPattern.tsx`'s one `align` value + comment, `scripts/task837-favorite-computed.mjs`'s capture extension, and `docs/backlog.md`'s state line.

Questions/risks for the reviewer:
1. Confirm AC10's "only non-comment change" reading of `58-diff-pattern-file-run3.txt` — the visible diff also carries the pre-existing R5 comment rewrite because `run1`/`run2` were never committed, so the hunk shown against `HEAD` bundles both. The `align="center"`→`align="flex-start"` line is the only attribute/value change in it.
2. Independently re-derive AC11 from the raw JSON (`runs/run3/favorite-computed.json`) rather than trusting this report's arithmetic.
3. `check:locale-leak:mantine-only` run3: 164 leaks (identical to run2), exit 1 expected pre-existing debt (Task 836's subject). No new leak on either target story — cross-checked line-for-line against `32-check-locale-leak-run2.txt`.
4. §16.5's 5-tuple owner matrix (patterns-mantine-listingdetailpattern--default) plus the carried-over 4-tuple `mantine-primitives-favoritebutton--default` matrix — both outstanding, required before any approval.

## Opus review 4 — 2026-09-18 — `APPROVED`

- Owner visual result, 2026-09-18, verbatim: *"Візуально підтвержую - все ок."* — given in reply to the handoff that listed both outstanding matrices; recorded as accepting the five §16.5 tuples (`patterns-mantine-listingdetailpattern--default`, 1440/390 en+uk, 320 uk) and the four §13.4 `mantine-primitives-favoritebutton--default` tuples (1440/390 en+uk).
- AC10: `git diff` of `MantineListingDetailPattern.tsx` — the one non-comment change is `align="center"` → `align="flex-start"` on the badges-row outer `Group`; the rest of the hunk is the D69-27 comment rewrite.
- AC11: re-derived by the reviewer from `runs/run3/favorite-computed.json` (`gitCommit` fcbdb71b5, 07:20:12Z): 30 badges rows × 5 cells, `favoriteTop` and `shareTop` equal `firstBadgeTop` in every row (delta 0); `badgeRows` 1 at 1440, 2 at 390, 3 at 320; `firstBadgeHeight` 24. AC2 fields unchanged: every favorite 32×32, `rgba(0, 0, 0, 0)`, 9999px.
- Freshness: last source edit 09:16:57 (pattern file), script 09:14:50; `build-storybook` 09:20, capture 09:20, `build` 10:03 `EXIT_CODE=0`. Current `hash-object` of all 10 scope files equals `62-final-hashes-run3.txt`. run2 transcripts 21-39 are superseded by run3 40-62.
- Locale leak: run2 and run3 both 164; zero lines for either target story in both. GR-2: the detector's scope is bounded as review 2 recorded.
- GR-1 re-run by the reviewer (win32, v22.22.3): pattern 8 nodes, tier1 8, tier2 0, tier3 0, exit 0.
- Files Changed table matches `git status`: 9 modified + session log, evidence dir, capture script.
