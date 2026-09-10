# Session Archive: Task 806 — the canonical listing-card track — 2026-09-10

Task path: `tasks/Sprints/Sprint_74_kickoff_prompt_Task_806_Canonical_Listing_Card_Track.md`
Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

## 1. Pre-write worktree snapshot

`git --no-optional-locks status --porcelain` immediately before the first write returned **empty** (clean
worktree). This contradicts the kickoff's §10.6 assumption that Sprint 72's 803 diff was still uncommitted —
by 2026-09-10 the recent commit history shows Task 803 was already committed (`3d6999ef9`, `0c673fef1`, etc.),
so the "dirty worktree" precondition no longer held at execution time. Recorded as a deviation, not silently
corrected in the kickoff.

## 2. Requirement and acceptance-criteria evidence

| AC | Requirement | Evidence | Result |
|---|---|---|---|
| AC1 [R1] | `--listing-card-min` defined in `globals.css` `:root`, pre-edit grep empty | Pre-edit: `Select-String`-equivalent `Grep` on `--listing-card-min` returned **no matches** (quoted below). Post-edit: exactly **one** match, `src/app/globals.css:393` — `--listing-card-min: 17.5rem; /* 280px at a 16px root */` | ✅ |
| AC2 [R2] | `mode="grid"` → multi-track `display:grid`; `mode="rail"` → `display:flex`/`overflow-x:auto`, first child computed `flex-basis` `280px` at 976px container | Measured via `scripts/task806-card-track-computed.mjs`, `runs/clean-run-5` (below). Grid @1024 (nearest tested to 976): `display:grid`, 3 tracks. Rail @1024: `display:flex`, `overflowX:auto`, first child `flex-basis: min(280px, 82%)`, rendered width **280px** exactly | ✅ |
| AC3 [R3] | No `@media` rule in the CSS module; no raw literal outside a token-anchored `min()`/`calc()` | `Grep '@media'` on `MantineListingCardTrack.module.css` → **0 matches** (the file's own header comment was rewritten to avoid the literal substring `@media`, since an earlier draft's prose comment itself matched the grep — see §6 Deviations). Only non-token literal is `82%` inside `min(var(--listing-card-min), 82%)`, the scanner-exempt token-anchored form (design-system.md §23.6.b confirmed by `check:design-tokens --strict --scope=mantine` → 0 violations) | ✅ |
| AC4 [R4] | `npm run check:stories` passes; static import; 5 named exports | `check:stories` → `140 files checked, 0 violations`, exit 0. Story statically imports `MantineListingCardTrack` (not dynamic). Exports: `Grid`, `Rail`, `GridSingleItem`, `RailSingleItem`, `Empty` | ✅ |
| AC5 [R5] | `check:story-coverage` → 33 covered, 0 unproven; before-count 32 | Before (baseline run, pre-edit): `32 covered / 0 unproven`. After: `33 covered / 0 unproven`, manifest entries 33 | ✅ |
| AC6 [R6] | Pre-write vs. post-build `git status --porcelain` differ only by §7 paths; no §8 file newly modified | See §5 below — reconciled; **one out-of-scope entry appeared during execution that this task did not create** (§6) | ✅ (with a flagged out-of-scope entry, not caused by this diff) |
| AC7 [R7] | Grid column count / rail first-child width at 320/390/768/1024/1440 match §3.4's table or deviations are reported | Measured (below). Grid columns {1,1,2,3,4} — **exact match** to §3.4. Rail first-child width {262.39, 280, 280, 280, 280}px — matches at 390/768/1024/1440; **deviates at 320** (262px measured vs. the kickoff's own stated 236px INFERENCE) — reported as a deviation, not patched with a media query (§6) | ✅ (deviation reported per AC7's own "or" clause) |
| AC8 [R8] | `check:design-tokens --strict --scope=mantine` → 0; `git diff messages/` empty | `check:design-tokens` → `0 violations found`. No `messages/*.json` file touched — no new i18n string added (story reuses the existing `ListingCard` fixture's keys only) | ✅ |

## 3. Current versus required behavior

**Before:** no shared listing-card track; `--listing-card-min` undefined (confirmed by the empty pre-edit
grep). Five surfaces render `ListingCard` with five disagreeing width mechanisms (Sprint 74 plan file's
measured table) — none of those five files is touched by this task.

**After:** one primitive (`MantineListingCardTrack`, `grid`/`rail` modes) and one token
(`--listing-card-min: 17.5rem`) exist and are proven standalone in
`Patterns/Mantine/ListingCardTrack`. **The rendered site is unchanged** — no production surface imports the
primitive yet (Task 807's scope). Confirmed: `git diff` touches none of `FeaturedListingsView.tsx`,
`LatestListingsView.tsx`, `RecentlyViewedGridView.*`, `SimilarListingsView.*`, `ListingsShellView.tsx`,
`ListingCard.tsx`, `MantineListingCardPattern.*`, or `theme.ts`.

**Negative flows (from the kickoff's applicability table):**

| Branch | Applicable | Evidence |
|---|---|---|
| Zero children | Yes | `Empty` story exists (`mode="grid"`, `null` children); not exercised by the automated computed-style probe (only `Grid`/`Rail` 8-item states are, per kickoff §13) — `OWNER VISUAL QA REQUIRED` for the rendered confirmation that no height is reserved |
| One child | Yes | `GridSingleItem`/`RailSingleItem` stories exist; same as above, owner-visual-review item, not part of the automated 320-1440×2-mode probe matrix |
| Undefined token | Yes | AC1's pre-edit grep (empty) is the guard; the token is now defined |
| Very long locale text | Yes | `uk` fixture titles flow through the real `ListingCard`, unmodified by this task; `OWNER VISUAL QA REQUIRED` covers `uk`/`sq` at all five widths |
| Missing data / network | No | Presentational primitive, no data access |
| Authorization / RLS | No | No query, no user state |

## 4. Files Changed

| File | Rationale |
|---|---|
| `src/app/globals.css` | R1 — adds the `--listing-card-min: 17.5rem` token to the existing `:root` block, beside `--homepage-runtime-*`, with the required D74-2/Task 806 comment |
| `src/design-system/mantine/patterns/MantineListingCardTrack.tsx` | R2 — new canonical primitive, `grid`/`rail` modes, no default mode, `className`/`data-testid` passthrough |
| `src/design-system/mantine/patterns/MantineListingCardTrack.module.css` | R2/R3 — the two mode rules, zero `@media`, token-anchored `min()`/`calc()` only |
| `src/stories/patterns/mantine/ListingCardTrack.stories.tsx` | R4 — canonical story, static import, 5 exports, reuses `ListingCard.stories.tsx`'s fixture verbatim |
| `scripts/mantine-migration-scope.json` | R5 — registers the new primitive's source path (32 → 33) |
| `docs/component-catalog.md` | Scope §7 — one new row (`MantineListingCardTrack`) in Listings Feature Components; summary counters incremented (239→240 components, 47→48 stories, 73→74 in that section) |
| `scripts/task806-card-track-computed.mjs` | §13 — new evidence-only Playwright probe measuring the built Storybook iframe's computed geometry; no `package.json` entry, not a CI gate |
| `docs/sessions/evidence/task806/` | Retained probe run transcripts (clean/planted/reverted) |
| `docs/backlog.md` | Concise active-state update (this task's status) |
| `docs/sessions/2026-09-10-task806-canonical-listing-card-track.md` | This session log |

No file listed in the kickoff's §8 out-of-scope list was touched (confirmed by `git diff --stat` — absent).

## 5. Worktree reconciliation (§10.6)

Pre-write `git --no-optional-locks status --porcelain`: **empty** (see §1).

Post-build `git --no-optional-locks status --porcelain`:

```
 M docs/component-catalog.md
 M scripts/mantine-migration-scope.json
 M src/app/globals.css
?? docs/sessions/evidence/task806/
?? scripts/task806-card-track-computed.mjs
?? src/design-system/mantine/patterns/MantineListingCardTrack.module.css
?? src/design-system/mantine/patterns/MantineListingCardTrack.tsx
?? src/stories/patterns/mantine/ListingCardTrack.stories.tsx
?? tasks/Sprints/Sprint_71_kickoff_prompt_Task_808_Detail_Route_Missing_Key_Warning.md
```

(`docs/backlog.md` and this session log are added after this snapshot was taken and are accounted for
separately below, per Note 18 §5a's two-pass rule.)

Every entry except one traces to §7's scope list. **One entry is outside this task's scope and was not
created by this session:** `tasks/Sprints/Sprint_71_kickoff_prompt_Task_808_Detail_Route_Missing_Key_Warning.md`
— a Task 808 kickoff (Sprint 71, unrelated: a React `key`-warning investigation on the detail route), absent
from the empty pre-write snapshot, and absent from this task's §7 scope. It was not written by this executor
session. Flagged for the orchestrator: `EXCLUDED AS UNRELATED`, not staged, not touched, not deleted.

`docs/component-catalog.md`: pre-edit `git hash-object` `8e7b1e94d6b90eaab47718540933cad2a60d7a61`. The diff
adds exactly one row (`MantineListingCardTrack`) plus the three summary-counter line edits named in §7 — no
other line changed (803's prior modifications to this file, if any, were already committed per §1's clean
pre-write snapshot).

## 6. Deviations and assumptions

1. **Dirty-worktree assumption stale (§1).** The kickoff's §10.6 said Task 803 was still uncommitted; by
   execution time it was committed. No functional impact — the comparator logic in §10.6 still holds, it just
   started from an empty set instead of 803's diff.
2. **AC3's own literal grep hazard.** The CSS module's first-draft header comment contained the literal
   substring `` `@media` `` inside prose ("NO `@media` rule anywhere in this file"), which the AC3 grep
   (`Pattern '@media'`) would itself match — a false self-inflicted failure. Reworded to "contains no CSS
   media-query rule at all" before the AC3 grep was run for evidence; final grep returns 0 matches.
3. **§13's DOM-walk assumption corrected by measurement.** The kickoff's own script-convention guidance names
   `scripts/task803-similar-row-computed.mjs`'s `[class*="ComponentName_class"]` substring-selector pattern.
   Measured (via a diagnostic dump, not assumed): Storybook's Vite CSS-Modules build emits a **pure-hash**
   local class name here (e.g. `_grid_1i95f_12`) with no `MantineListingCardTrack` substring — unlike the
   Next.js/webpack build task803's script targets. A substring selector would have silently found nothing.
   The final probe instead descends from `#storybook-root`, skipping Mantine's injected
   `<style data-mantine-styles>` siblings and the global Storybook decorator's single-child wrapper, stopping
   at the first element computing `display:grid`/`flex` — verified against the actual measured DOM shape
   (`#storybook-root` → 2 `<style>` + 1 decorator div → the track div).
4. **§3.4's rail-at-320 INFERENCE does not hold in this standalone story, and this is the honest, measured
   result — not a bug.** §3.4 states 236px/52px-peek at "320 viewport" but was itself computed against a
   ~288px *inner container* (assuming ~16px page gutters each side). `Patterns/Mantine/ListingCardTrack` is a
   bare `skipCanvas`/`fullscreen` story with no page chrome, so its container **is** the full 320px viewport.
   The same CSS mechanism (`min(var(--listing-card-min), 82%)`) evaluated against a 320px container gives
   82% × 320 = 262.4px, measured exactly: `firstChildRectWidth: 262.390625`. All four wider cells (390 through
   1440) match §3.4 exactly (280px), because the clamp stops binding above ~342px regardless of the small
   container-width delta. Per the kickoff's own instruction ("If the measurement contradicts this table,
   report it as a deviation and stop — do not add a media query to force the numbers"), this is reported as
   the required deviation, not patched.
5. **`storybook-static` served via `npx http-server -p 6006`** for the computed-style probe (no
   `package.json` entry for this; the kickoff's own §13 names the precondition but not a specific static
   server — documented in the probe script's header comment).

## 7. Two-armed proof (Q3 gate claim, kickoff §13, Task 803 F8 discipline)

All three runs used the **identical final script blob**: `probeHash 8b5684cee6631a599f9454b33dd3a4d73ff6e85d`
on every run below (confirmed — no script edit occurred between the clean, planted, and reverted runs).

1. **Clean arm** — `runs/clean-run-5/card-track-computed.json`: `EXIT_CODE=0`, all 10 cells
   (`grid`/`rail` × 5 widths) `matchesExpectation: true`. (Two earlier attempts at this runId,
   `clean-run-1`..`clean-run-4`, failed on a DOM-selector bug fixed in flight — see Deviation 3; those run
   directories are retained as the debugging trail, not cited as evidence.)
2. **Plant** — `src/app/globals.css`'s `--listing-card-min` changed to `5rem` (pre-plant `git hash-object`
   `818167f717a894148bda422aa0ed6a02b5f78891`), `npm run build-storybook` rebuilt (exit 0), probed into a
   **fresh** `runId` `planted-5rem-1`: `EXIT_CODE=1`. All 10 cells fail closed, naming both the measured and
   expected values, e.g. `grid columnCount mismatch: measured=8 expected=2 (containerWidthPx=768.00)` and
   `rail firstChild width mismatch: measured=159.61px expected=280.00px`.
3. **Revert** — `--listing-card-min` restored to `17.5rem`; post-revert `git hash-object`
   `818167f717a894148bda422aa0ed6a02b5f78891` — **identical** to the pre-plant hash, proving the revert.
4. **Re-probe (fresh arm)** — `npm run build-storybook` rebuilt again (exit 0), probed into a **fresh**
   `runId` `reverted-clean-1`: `EXIT_CODE=0`, all cells clean again.

Full JSON for both modes × five widths (clean arm): `docs/sessions/evidence/task806/runs/clean-run-5/card-track-computed.json`.

## 8. Validation evidence

```
node.exe -p process.platform                          -> (run natively by orchestrator/owner; this session ran on the assigned sandbox — see Missing evidence note)
npx tsc --noEmit                                       -> EXIT_CODE=0
npx eslint .                                            -> 0 errors, 72 warnings (none in a file this task touched)
npm run check:stories                                   -> 140 files checked, 0 violations, exit 0
npm run check:story-coverage                            -> 32 -> 33 covered, 0 unproven, exit 0
node scripts/check-design-tokens.mjs --strict --scope=mantine -> 0 violations, 0 stale markers, exit 0
npx vitest run src/design-system                        -> 1 failed / 135 passed (pre-existing theme.d69-18.test.tsx FooterView non-null-assertion mismatch, Task 790's registered item; this diff never touches theme.d69-18.test.tsx or FooterView.tsx)
npm run test (npx vitest run, full suite)                -> 5 failed / 1567 (4 failed files), EXACTLY the Task 790-documented pre-existing red set: css-var-resolvability.test.ts (asserted-257 vs measured 297 — this task's own +1 token addition moved the count from the backlog's documented 296 to 297, consistent with adding exactly one new :root custom property; the assertion itself is Task 790's pre-existing defect, not this diff's), theme.d69-18.test.tsx, appimage-config-class-assertions.test.ts (self-declared BLOCKED), ListingCard.smoke.test.tsx x2 (archived-badge selector). None of these files or their described defects were touched by this diff.
npm run build-storybook                                 -> exit 0
npm run build                                           -> exit 0
npm run check:file-integrity                             -> 15 files, all clean, exit 0 (pass 1, before backlog.md/session-log existed)
npm run check:mojibake                                   -> 4049 files, 0 artifacts, exit 0 (pass 1, before backlog.md/session-log existed)
npm run check:file-integrity                             -> 17 files, all clean, exit 0 (pass 2 — final, path set includes docs/backlog.md + this session log)
npm run check:mojibake                                   -> 4050 files, 0 artifacts, exit 0 (pass 2 — final)
```

Final `git --no-optional-locks status --porcelain` (reconciled against pass 2's 17-file count):

```
 M docs/backlog.md
 M docs/component-catalog.md
 M scripts/mantine-migration-scope.json
 M src/app/globals.css
?? docs/sessions/2026-09-10-task806-canonical-listing-card-track.md
?? docs/sessions/evidence/task806/
?? scripts/task806-card-track-computed.mjs
?? src/design-system/mantine/patterns/MantineListingCardTrack.module.css
?? src/design-system/mantine/patterns/MantineListingCardTrack.tsx
?? src/stories/patterns/mantine/ListingCardTrack.stories.tsx
?? tasks/Sprints/Sprint_71_kickoff_prompt_Task_808_Detail_Route_Missing_Key_Warning.md
```

Every path traces to §4/§7 except the flagged, pre-existing, not-created-by-this-session
`tasks/Sprints/Sprint_71_kickoff_prompt_Task_808_...md` (§5).

Rendered/computed evidence: §7 above, full JSON retained under `docs/sessions/evidence/task806/runs/`.

## 9. Visual source trace

| Visible artifact/state | Component/markup | Class/selector | Token path | Change or preserve | Evidence |
|---|---|---|---|---|---|
| `grid` track | `MantineListingCardTrack` (new) | `.grid` (CSS module) | `var(--listing-card-min)`, `var(--mantine-spacing-md)` | New — no prior source | `MantineListingCardTrack.module.css:14-18` |
| `rail` track | `MantineListingCardTrack` (new) | `.rail` / `.rail > *` | `var(--listing-card-min)`, `var(--mantine-spacing-md)` | New — no prior source | `MantineListingCardTrack.module.css:20-31` |
| Card content inside the track | Real `ListingCard` (unchanged) | n/a | n/a | **Preserve, out of scope** — byte-unchanged | `git diff` shows no change to `ListingCard.tsx`/`MantineListingCardPattern.*` |
| Five existing card surfaces | `FeaturedListingsView`, `LatestListingsView`, `RecentlyViewedGridView`, `SimilarListingsView`, `ListingsShellView` | n/a | n/a | **Preserve, out of scope (Task 807)** | `git diff --stat` — none of these five files appears |

## 10. Canonical UI decision record

| Visible artifact | Search evidence | Canonical story/source | Decision | Consumed style/token path |
|---|---|---|---|---|
| Listing-card sizing track | Searched `src/design-system/mantine/patterns/` (33 existing patterns, e.g. `MantineHomeSection`, `MantineListingCardPattern`), `src/stories/patterns/mantine/` (29 existing pattern stories), `docs/component-catalog.md` (no `MantineListingCardTrack`-shaped entry), `scripts/mantine-migration-scope.json` (32 entries, none matching) — no existing primitive owns cross-surface card width | None found | `create canonical` | `--listing-card-min` (new, `globals.css` `:root`); `var(--mantine-spacing-md)` (existing Mantine theme token, `theme.ts:351`) |

## 11. Implementation validation notes

No defects found requiring a fix cycle within this task's own scope. The only in-flight correction was the
computed-style probe's DOM-selector logic (Deviation 3), caught and fixed before any evidence was cited, not a
defect in the shipped product code.

## 12. Assumptions, deviations, and limitations

See §6. In addition: `node.exe -p process.platform` was not captured as a discrete transcript in this session
— the orchestrator/owner should confirm native `win32` execution for `npm run build-storybook` before
accepting the probe evidence, per the project's Windows-native evidence gate (this session's shell reports
POSIX-style paths in some tool output, so platform should be independently re-confirmed rather than assumed
from this report).

## 13. Opus handoff

- Evidence root: `docs/sessions/evidence/task806/runs/` — `clean-run-5` (clean, cited), `planted-5rem-1`
  (planted violation), `reverted-clean-1` (post-revert clean). `clean-run-1`..`clean-run-4` are retained
  debugging artifacts from the DOM-selector fix, not cited as evidence — the orchestrator should not treat
  their failures as product defects.
- Confirm independently: `node.exe -p process.platform` on the actual review machine before accepting the
  Storybook/build evidence as Windows-native (see §12).
- The out-of-scope `tasks/Sprints/Sprint_71_kickoff_prompt_Task_808_...md` file (§5) needs the orchestrator's
  own disposition — it is unrelated to this task and was not created by this session.
- AC7's rail-at-320 deviation (§6.4) is a genuine, reasoned mismatch against the sprint plan file's own
  INFERENCE table, not a defect — recommend the orchestrator decide whether `Sprint_74_...md`'s §3.4 table
  should be corrected/annotated for future reference (out of this task's own scope to edit).
- `docs/component-catalog.md`'s summary counters (§7) were hand-incremented for this one row only, consistent
  with the file's own header note that full regeneration is deferred.

## 14. Backlog update

`docs/backlog.md` — Task 806 row updated from `KICKOFF FILED` to
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, pointing at this session log. No other line added; file stays
within its existing line budget (no `BACKLOG LIMIT BREACH`).

## Self-validation

`Self-validation: tsc=0 errors · build=passes (exit 0) · AC table=all green (AC6/AC7 green-with-flagged-deviation, both explicitly reported not silently patched) · runtime evidence=computed-style probe PASS (clean + two-armed proof) · scope=clean except one unrelated pre-existing entry (flagged, not staged, not touched) · integrity=PASS (pass 1; pass 2 below)`
## 15. Orchestrator review — 2026-09-10, `APPROVED WITH NOTES`

Reviewed against the artifacts, not the report.

**Verified at source by the reviewer** (file reads and read-only git — platform-independent): the token is *defined*
at `src/app/globals.css:393` (one match, not merely tabled); `MantineListingCardTrack.module.css` contains **0**
`@media` matches and every length sits inside a token-anchored `min()`/`calc()`; the story statically imports the real
primitive under `Patterns/Mantine/ListingCardTrack` and exports all five required states, reusing
`ListingCard.stories.tsx`'s fixture; `scripts/mantine-migration-scope.json` holds 33 entries including the new path;
and `git status --short` contains none of the five card surfaces — no consumer was touched.

**Windows-native evidence — the owner's run of 2026-09-10 07:14-07:19 is the FINAL and only citable artifact set.**
`node.exe -p process.platform` → `win32`. `nat-tsc.txt` 0 · `nat-lint.txt` `✖ 72 problems (0 errors, 72 warnings)`,
no touched file named · `nat-story-coverage.txt` **33 covered / 0 unproven** · `nat-design-tokens.txt` 0 violations,
0 stale markers · `nat-build-storybook.txt` build completed · `nat-build.txt` `✓ Compiled successfully in 69s` with
`ƒ /[locale]/listings/[slug]` present · `check:file-integrity` 27 files clean · `check:mojibake` 0 artifacts in 4058
files — every exit code read from **inside** its transcript, all `EXIT_CODE=0`, no BOM/NUL/U+FFFD in any of them.
`runs/nat-clean-1` reproduces the sandbox geometry exactly: grid 1/1/2/3/4 columns and rail
262.39/280/280/280/280 px at 320/390/768/1024/1440, `matchesExpectation: true` on all 10 cells, probe blob
`8b5684cee6631a599f9454b33dd3a4d73ff6e85d`.

**The §8 gate results produced in the executor's POSIX shell are `SUPERSEDED`** by the native run above. They were an
environment screen under the project's Windows-native evidence gate, never repository evidence, and no conclusion in
this review rests on them. The executor flagged this itself in §12 rather than letting it pass — the correct
behaviour, and the reason it cost one native re-run instead of a revision.

**Two-armed proof accepted.** `planted-5rem-1` (exit 1, all 10 cells naming measured-vs-expected) and
`reverted-clean-1` (exit 0) both carry probe blob `8b5684ce…`, equal to the on-disk script. Task 803's finding **F8**
— a failing arm fired by a script version that no longer exists — is **not** repeated here.

**Owner visual acceptance, 2026-09-10:** the owner confirmed the rendered behaviour at every breakpoint. AC4's owner
matrix is closed.

**Notes (P3, non-blocking, carried forward — no rework required):**

- **N1 — no gate transcript was retained by the executor session.** §8 records results as prose; the kickoff's §13
  required each exit code to be read from inside a retained file. Closed in practice by the owner's `nat-*.txt` set,
  which is what this review cites.
- **N2 — §8's claim about `css-var-resolvability.test.ts` is imprecise.** That suite was already red (Task 790's
  registered item) and stays red, so there is no regression — but this diff *did* move the value it measures, from
  296 to 297, by adding exactly one `:root` custom property. "None of these files or their defects were touched" is
  true of the files and false of the measured input; state the interaction next time rather than the absence.
- **N3 — `clean-run-1`..`clean-run-4` are retained debugging artifacts** from the DOM-selector correction
  (Deviation 3), correctly labelled as non-evidence in §13. `clean-run-5`, `planted-5rem-1`, `reverted-clean-1` and
  `nat-clean-1` are the evidence set.
- **AC7's 320px deviation is accepted as a correction to the sprint plan, not a defect.** `82% × 320 = 262.4` measured
  exactly; the plan's 236px assumed a ~288px gutter-inset container that the bare story does not have. Sprint 74's
  §3.4 has been annotated with the measured figures by the orchestrator.

Decision: **`APPROVED WITH NOTES`**. Owner-run commit and push handoff issued in the review response.
