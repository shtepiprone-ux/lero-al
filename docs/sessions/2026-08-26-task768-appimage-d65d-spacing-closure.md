# Task 768 — AppImage: close the D65-D spacing dependency

**Task path:** `tasks/Sprints/Sprint_65_kickoff_prompt_Task_768_AppImage_D65D_Spacing_Closure.md`
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

> **Task 768R correction (2026-08-26).** Owner clarification: AC4's pass/fail proof is restricted to the fixed
> 44-cell AppImage-bearing set (`mantine-primitives-listingcard--default` × 4 locales × 4 viewports,
> `mantine-primitives-popularlocationsview--default` × 4 locales × 7 viewports), not the whole 1332-cell matrix. The
> AC4 section below is corrected accordingly. No `src/`, kickoff, script, gate, baseline, marker, config, Storybook
> source, or existing `pre`/`post` manifest/log/capture/comparator-output file was touched by this correction; a new
> comparator output was added at `docs/sessions/evidence/task768/ac4-appimage-comparator-output.txt`, built from the
> already-retained `pre`/`post` manifests without re-running `screenshots:assert`.

> **Orchestrator review correction (2026-08-26, Opus).** Documentation only — no `src/`, kickoff, script, gate,
> baseline, marker, config, Storybook source, manifest, capture or comparator-output file was touched. Three
> defects found by the orchestrator review and fixed here: (a) **AC6** requires the session log to quote D65-D
> verbatim and it did not — D65-D and D65-E are now both quoted verbatim below; (b) the `git status --porcelain`
> block was a partial paste and is replaced with the real, complete output; (c) the AC4 section did not disclose
> the absolute non-pass census of either manifest, nor the direction of the two non-target deltas — both are now
> stated.

## §0 — Owner decision D65-D, quoted verbatim (AC6)

Recorded by the owner 2026-08-26, verbatim
(`tasks/Sprints/Sprint_65_kickoff_prompt_Task_768_AppImage_D65D_Spacing_Closure.md` §0):

> Permit one narrow AppImage change: replace imageLayer `inset: var(--space-0)` with `inset: 0`. This preserves the
> computed 0px value while removing Level-3's only AppImage dependency. Motion, radius, variants, loading, markup,
> and every other AppImage declaration remain frozen.

D65-D is **CLOSED**. This task is the whole of what it authorises; no later task may cite it to touch a second
AppImage line.

## §10.0 preflight (before any edit)

```
node.exe -p process.platform          → win32
git status --short --branch           → ## main...origin/main   (clean)
git log -1 --oneline                  → b5ac6903b docs(Task768): file the AppImage D65-D spacing closure kickoff
git merge-base --is-ancestor 31544b316 HEAD   → exit 0
git diff --quiet 31544b316..HEAD -- src       → exit 0 (src/ unchanged since Task 767)
```

Census (matches §3 exactly):

```
rg -n 'inset:\s*var\(--space-0\)' src/components/ui/AppImage.module.css
  142:    inset: var(--space-0);

rg -n --fixed-strings -- '--space-0' src/        → 15 hits total
  AppImage.module.css:34 (comment), :138 (comment), :142 (live read)
  HeroSearchView.module.css:95, :99
  MobileBottomNavView.module.css:58, 59, 60, 152
  MantineListingCardPattern.module.css:302, 386, 392
  globals.css:128 (declaration), :146 (--space-0-5, false friend), :151 (--spacing-0 alias)

rg -n --fixed-strings -- 'var(--space-0)' src/   → 12 hits (11 live reads + AppImage:34 comment)
  AppImage contributes 2 of the 12 (:34 comment, :142 live)

rg -n -- '--space-0:\s' src/app/globals.css      → 1 hit, :128
```

Gates: `check:design-tokens` exit 0 (0 violations). `check:css-vars` initially reported stale shipped CSS
(unrelated pre-existing environment state — newest shipped CSS older than `AuthSheet.module.css`, a file this task
does not touch); ran `npm run build` (exit 0) to refresh it, then `check:css-vars` re-ran clean, exit 0.

No stop condition triggered. Proceeded to §13 PRE evidence capture, then the §5 edit.

## §3.6 — accepted asymmetry (recorded per R6)

After this task, `AppImage.module.css` expresses zero `inset` as native `0` while six other sites (§3.5: 1 in
`globals.css:151`, 4 in `MobileBottomNavView.module.css`, 2 in `HeroSearchView.module.css`, 3 in
`MantineListingCardPattern.module.css`) still express zero through `var(--space-0)`. This is a knowingly accepted,
temporary asymmetry — Task 770 owns the end state for those six and may not revisit `AppImage.module.css` to
re-align it. **The AppImage freeze (Sprint 65 §4) resumes the moment this task is accepted**; D65-D authorised
exactly this one line and nothing further.

## §6 — D65-E no-control statement (recorded per R7)

Recorded by the owner 2026-08-26, verbatim (kickoff §6):

> **D65-E — DECIDED 2026-08-26.** Owner grants a one-task exception to Sprint 65 rule 1 for Task 768 only: Task 768
> must not add a new permanent detector for `var(--space-0)` in `AppImage.module.css`. This is not an exception from
> fail-closed verification. Before merge, Task 768 must retain pre/post evidence and run comparators that exit
> non-zero on any geometry/state/hover, fixture/markup, `imgComputed.inset`, or keyed Storybook
> `verdict`/`failReason` delta.
>
> The durable anti-regression responsibility transfers exclusively to Task 770's fixed-manifest ownership gate. Task
> 770 must name `AppImage.module.css` explicitly as an expected-zero entry and prove a reintroduced
> `var(--space-0)` read fails the gate. No second detector, baseline row, marker, or temporary script is permitted
> in Task 768.
>
> This exception expires if Task 770 is re-scoped so that it no longer supplies that fixed-manifest gate; in that
> case, stop and obtain a new owner decision before dispatching any affected migration work. Until Task 770 lands,
> Sprint 65 §4's AppImage freeze remains binding.

D65-E (owner-decided 2026-08-26) grants Task 768 a one-task exception to Sprint 65 rule 1 ("control ships before or
with the fix"): no new permanent detector for `var(--space-0)` in `AppImage.module.css` was added. In its place,
fail-closed verification was met by running both required comparators (AC3 geometry/state/hover, AC4 keyed manifest)
with retained non-zero-on-delta exit codes (`$LASTEXITCODE`), both captured below. No temporary script, marker, or
baseline row was added. The durable anti-regression responsibility transfers exclusively to Task 770's fixed-manifest
ownership gate, which must name `AppImage.module.css` as an expected-zero entry with a negative-plant proof; that
obligation is not discharged by this task.

## Requirement and acceptance-criteria evidence

| ID | Requirement | Evidence | Status |
|---|---|---|---|
| R1 | `.imageLayer` reads `inset: 0`, nothing else in file changes | `git diff` below — one declaration, two comments | MET |
| R2 | Exactly one file under `src/` modified, `AppImage.module.css` | `git diff --stat` below | MET |
| R3 | Computed `inset` `0px`, byte-equal pre/post | AC3 comparator: 0/0/0 diffs, exit 0 | MET |
| R4 | No `design-tokens-allow:` marker/allowlist/baseline/new token | `git diff` contains none; `check:design-tokens` exit 0 both runs | MET |
| R5 | Header Class-3 inventory updated, not deleted | `git diff` — header row rewritten to record closure | MET |
| R6 | Session log records asymmetry + freeze resumption | §3.6 above | MET |
| R7 | No new detector/marker/baseline; both comparators run, exit codes retained; D65-E stated | §6 above; AC3/AC4 outputs below | MET |

## Current versus required behavior

| | Before | After |
|---|---|---|
| `AppImage.module.css` `var(--space-0)` reads | 1 (`:142`) | 0 |
| `.imageLayer` computed `inset` | `0px` | `0px` (unchanged, proved by AC3) |
| Class-3 inventory in file header | one row | recorded closed, list empty |
| `globals.css:128` declaration | present | present, untouched (not in diff) |
| Live `var(--space-0)` reads across `src/` | 11 | 10 |

Negative flow: none applicable — this is a zero-value CSS literal substitution with no conditional/branching
behavior, no user input, no auth/RLS surface. The relevant "negative flow" is the geometry/render regression check
itself (AC3/AC4), both run and clean on AppImage-bearing cells.

## Files Changed

| Path | Reason |
|---|---|
| `src/components/ui/AppImage.module.css` | §5.1 declaration change + §5.2 header/rule comment updates |
| `docs/sessions/2026-08-26-task768-appimage-d65d-spacing-closure.md` | this session log |
| `docs/sessions/evidence/task768/` | retained pre/post captures, comparator outputs, gate logs |
| `docs/backlog.md` | concise state update — 768 registry row and Sprint 65 line moved to implemented/awaiting review |

## Full diff (AC1)

```
git diff --stat
 src/components/ui/AppImage.module.css | 11 ++++++-----
 1 file changed, 6 insertions(+), 5 deletions(-)
```

```diff
diff --git a/src/components/ui/AppImage.module.css b/src/components/ui/AppImage.module.css
index 6636b701f..8322b488d 100644
--- a/src/components/ui/AppImage.module.css
+++ b/src/components/ui/AppImage.module.css
@@ -31,8 +31,9 @@
  * `.hoverBrightness` were already role-shaped and are unchanged.
  *
  * R8 Class-3 inventory (every `@theme inline` reference this module writes):
- *   - `var(--space-0)` in `.imageLayer` (`inset`) — `globals.css:128`, `@theme inline`,
- *     replaces `inset-0`. Confirmed emitted (resolvable) in both built stylesheets.
+ *   - (empty) — the sole entry, `var(--space-0)` in `.imageLayer` (`inset`), was closed by Task 768
+ *     under D65-D (2026-08-26): `inset` now reads the native zero literal `0` instead of the
+ *     `@theme inline`-only token, so this file no longer has a Class-3 dependency.
  * `var(--muted)` in `.framePlaceholder` is NOT Class-3 — `--muted` is declared in plain `:root`
  * (`globals.css:371`), outside `@theme inline` (safe, per Sprint 63 §"Measured state").
  *
@@ -135,11 +136,11 @@
   }
 
   /* `absolute inset-0 w-full h-full` — AppImage.tsx line 144, I1 §1 row 3 for `inset-0`.
-     `--space-0` is `@theme inline` (globals.css:128) but confirmed EMITTED (resolvable) in both
-     built stylesheets — Class-3 inventory row, see file header. */
+     Task 768 (D65-D, 2026-08-26): `inset` now reads the native zero literal `0`, value-identical to
+     the prior `var(--space-0)` (`--space-0` is `0px`), closing this file's only Class-3 dependency. */
   .imageLayer {
     position: absolute;
-    inset: var(--space-0);
+    inset: 0;
     width: 100%;
     height: 100%;
   }
```

## Final census (AC2)

```
rg -n -- '--space-0' src/components/ui/AppImage.module.css
  34: comment (quotes `var(--space-0)`, records closure)
  140: comment (quotes `var(--space-0)`, explains value-identity)
```
Zero live declarations remain. §10.0 run (pre-edit) is above; this is the final (post-edit) run.

## Validation evidence

| Gate | Pre-edit | Post-edit |
|---|---|---|
| `check:design-tokens` | exit 0, 0 violations | exit 0, 0 violations |
| `check:css-vars` | exit 0 (after `npm run build` refresh) | exit 0 (after final `npm run build` refresh) |
| `check:tailwind-runtime-tokens` | not run pre-edit (unaffected by this task's name class; run post-edit only per plan) | exit 0, 0 new debt, 0 stale baseline |
| `typecheck` | — | exit 0 |
| `build` (final production) | exit 0 (preflight refresh) | exit 0 (final, post-edit) |
| `build-storybook` | exit 0 | exit 0 |
| `check:stories` (runs inside build-storybook) | 129 files, 0 violations | 129 files, 0 violations |
| `screenshots:assert -- --mantine-only` | exit 1 (controlled — defects are standing debt, not a crash) | exit 1 (controlled, same class) |

### AC3 — Task 765 harness comparator (unchanged harness, `docs/sessions/evidence/task765/capture-appimage-styles.mjs`)

Pre-edit capture confirmed `imgComputed.inset === "0px"` on every entry across all 3 harness stories
(`mantine-primitives-listingcard--default`, `mantine-primitives-popularlocationsview--default`,
`admin-admincompaniesmanager--default`) before editing (§14.8 stop condition checked, not triggered).

Comparator output (unpiped, `$LASTEXITCODE` captured to file):

```
geometry/state/hover diffs: 0 []
fixture/markup diffs: 0 []
inset != 0px: 0 []
AC3_EXIT=0
```

Retained: `docs/sessions/evidence/task768/capture-pre.json`, `capture-post.json`,
`ac3-comparator-output.txt`.

### AC4 — keyed `screenshots:assert` manifest comparator (scope corrected by Task 768R)

**Target-scope proof (the AC4 pass/fail criterion), from `ac4-appimage-comparator-output.txt`:**

```
expected target cells: 44
expected keys missing from PRE manifest: 0 []
expected keys missing from POST manifest: 0 []
PRE target-cell count: 44
POST target-cell count: 44
target-scope verdict/failReason deltas: 0
AC4_APPIMAGE_EXIT=0
```

Fixed target set (owner-specified, not discovered from the manifest):

- `mantine-primitives-listingcard--default` × {sq,en,uk,it} × {mobile-320,mobile-375,mobile-390,desktop-1024} — 16 cells.
- `mantine-primitives-popularlocationsview--default` × {sq,en,uk,it} × {mobile-320,mobile-375,mobile-390,desktop-1024,wide-1200,wide-1440,wide-1536} — 28 cells.
- Total: 44 cells, present in both the retained PRE and POST manifests, zero `verdict`/`failReason` deltas among
  them. This is the exact rendered scope this task proves, and it is what AC4 requires.

**Non-target deltas (reported as evidence only, not part of the AC4 criterion):**

```
non-target-scope deltas: 2
  mantine-primitives-popover--default|sq|mobile-390 fail/blank-canvas -> pass/
  mantine-primitives-tabs--default|sq|mobile-390 fail/blank-canvas -> pass/
```

`Mantine/Primitives/Popover/Default` and `Mantine/Primitives/Tabs/Default`, locale `sq`, viewport `mobile-390`, are
outside the fixed AppImage-bearing target set above. Their verdict changed between the retained PRE and POST
`screenshots:assert` runs. No causal claim is made about them here — no rerun was performed to separate a rendering
non-determinism explanation from any other candidate cause, so none is asserted. They are reported verbatim as
retained evidence, outside the changed component's rendered scope, and are not evaluated against AC4. Retained:
`docs/sessions/evidence/task768/{pre,post}/manifest.json`, `screenshots-assert.log`, `ac4-comparator-output.txt`
(superseded for AC4 purposes by `ac4-appimage-comparator-output.txt`, which restricts the criterion to the 44-cell
target set), `ac4-appimage-comparator-output.txt`.

**Absolute non-pass census of both manifests (added by the orchestrator review — the harness is not green in
either phase, and the "standing debt" characterisation above is only meaningful with the numbers).** Derived from
the retained `pre/manifest.json` and `post/manifest.json` `matrix` arrays, 1332 cells each, 0 missing keys and 0
duplicate keys in either:

```
PRE   verdict=pass 1223 | verdict=fail 82 | verdict=ambiguous 27   (summary.blankCanvas 2, blankScreenshot 2)
POST  verdict=pass 1225 | verdict=fail 80 | verdict=ambiguous 27   (summary.blankCanvas 0, blankScreenshot 0)
```

**Direction of the two non-target deltas.** Both moved `fail` → `pass`. Across the full 1332-cell matrix, **zero
cells regressed in any direction** — there is no `pass` → `fail`, no `pass` → `ambiguous`, and no new `failReason`
of any kind in POST. This is stated as a measured property of the two retained manifests, not as a causal claim
about why the two cells changed; no cause is asserted for them, and `screenshots:assert` was not rerun.

**Naming, not repetition, is what §14.3 requires.** §14.3's stop condition triggers only when a delta *cannot* be
named cell by cell; §13's "or the run is repeated until it is" offers repetition as the alternative to naming, not
in addition to it. Both deltas are named by `storyId|locale|viewport` above, so no confirmatory third
`screenshots:assert` run is owed. This closes the open item the Task 768 handoff raised for the orchestrator.

**Scope note:** `admin-admincompaniesmanager--default` (the third story the Task 765 harness captures, used for AC3)
is **not** present in `screenshots:assert --mantine-only`'s manifest at all — its title `Admin/AdminCompaniesManager`
does not match `MANTINE_STORY_TITLE_PREFIXES` or `MANTINE_STORY_ENROLLED_TITLES` (`scripts/check-stories-rendered.mjs`
`isCanonicalMantineTitle` / prefix list). This is a pre-existing scoping fact of the `--mantine-only` harness, not
something this task's diff changed or could fix; AC3 (the Task 765 harness, run directly against the iframe) still
covers that story's `.imageLayer`/`.frameCircle` geometry and shows zero diffs.

## Canonical UI decision record

Not applicable in the "reuse/extend/create canonical" sense: this task changes a CSS custom-property read to the
native zero literal `0`, authorized in full by owner decision D65-D and pre-verified value-identical (§3.3,
`--space-0` is `0px`; `inset: 0` computes to the same `0px` on all four sides). No new visual value, class, story, or
canonical source is introduced or consumed — the rendered result is provably unchanged (AC3/AC4). `check:design-tokens`
correctly treats bare `0`/`0px`/`0rem`/`0em` as exempt (`scripts/check-design-tokens.mjs:220,333`), so no
`design-tokens-allow:` marker was needed or added.

## Visual source trace

| Visible artifact/state | Component/markup | Class/selector | Utility, cascade, and token path | Change or preserve | Evidence |
|---|---|---|---|---|---|
| `<img>` absolute-fill positioning inside every `AppImage` frame | `AppImage.tsx:145`, `className={cn(styles.imageLayer, …)}` | `.imageLayer` (`@layer utilities`, `AppImage.module.css:140-145`) | was `inset: var(--space-0)` reading `globals.css:128` `@theme inline`; now `inset: 0` native literal | change (declaration only) | `git diff` above; AC3 `imgComputed.inset === "0px"` both phases |
| `.imageLayer`'s `position`, `width`, `height` | same rule | same selector | unchanged literals | preserve | `git diff` shows no change to these three lines |
| All other `AppImage.module.css` rules (`.frame*`, `.fit*`, `.fade`, `.visible`, `.hidden`, `.hoverBrightness`) | `AppImage.module.css:78-178` | various | unchanged | preserve (task 8, out of scope) | `git diff --stat` — one file, 6/5 lines, confined to the header comment and `.imageLayer` |

## Implementation validation notes

No defects found in the target file. AC4's retained PRE/POST `screenshots:assert` manifests show a 2-cell verdict
change on `Popover`/`Tabs` at sq/mobile-390 — both outside the fixed AppImage-bearing target set (§ AC4 above); no
cause is asserted for that change here. All 44 target cells are stable, zero deltas.

## Assumptions, deviations, and limitations

- `check:css-vars` failed on first preflight and first post-edit run purely on shipped-CSS staleness (a file this
  task never touches was newer than the last `npm run build` output). Ran `npm run build` to refresh in both cases —
  this is itself one of §13's required gates, not scope creep.
- `admin-admincompaniesmanager--default` is out of `screenshots:assert --mantine-only`'s scope entirely (see AC4
  scope note). AC3 (the Task 765 harness) still exercises that story directly, so §14.8's stop condition and AC3's
  full-coverage requirement are unaffected.
- Task 768R (owner clarification, 2026-08-26): AC4's pass/fail criterion is restricted to the fixed 44-cell
  AppImage-bearing target set, not the full 1332-cell matrix. The 2-cell delta on `Popover`/`Tabs` (sq/mobile-390) is
  outside that target set; it is reported verbatim as retained evidence with no causal claim, per Task 768R's
  instruction not to describe it as "pre-existing", a "flake", or attributed to any subsystem without separate proof.
  `screenshots:assert` was not rerun to chase a favorable full-matrix result, per Task 768R's explicit prohibition.

## `git status --porcelain` (proving no stray artifact)

```
 M docs/backlog.md
 M src/components/ui/AppImage.module.css
?? docs/reviews/2026-08-26-task768-appimage-d65d-spacing-closure.review-ledger.json
?? docs/sessions/2026-08-26-task768-appimage-d65d-spacing-closure.md
?? docs/sessions/evidence/task768/
```

Real, complete output as of the close of the orchestrator review. The fifth row,
`docs/reviews/2026-08-26-task768-appimage-d65d-spacing-closure.review-ledger.json`, is the review ledger and did not
exist while the executor was working; at that point the tree carried the first four rows. The earlier revision of
this block listed only two of those four; the two omitted rows
are this session log and the `docs/backlog.md` state edit, both of which the Files Changed table above already
declares. Exactly one file under `src/` appears, and no stray artifact exists. Nothing is committed — committing and
pushing are owner-only per Git policy.

## Opus handoff

Evidence root: `docs/sessions/evidence/task768/` (`pre/`, `post/`, `capture-pre.json`, `capture-post.json`,
`ac3-comparator-output.txt`, `ac4-comparator-output.txt` (superseded for AC4 purposes, see AC4 section),
`ac4-appimage-cells.txt`, `ac4-appimage-comparator-output.txt` (Task 768R, the corrected 44-cell target-scope AC4
proof)). Session log: this file.

Task 768R's owner clarification restricts AC4's criterion to the fixed 44-cell AppImage-bearing target set; that
criterion is met (0 deltas, `AC4_APPIMAGE_EXIT=0`). The 2-cell Popover/Tabs delta outside the target set is retained
as evidence with no cause asserted, per Task 768R's explicit instruction not to attribute it without separate proof
and not to rerun `screenshots:assert` seeking a favorable full-matrix result.

## Backlog update

`docs/backlog.md`: Last Session line, Sprint 65 line, and the **768** registry row updated to
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` with a pointer to this session log. Physical line count: 81 (unchanged
from before this task's edits — no line was added or removed, only in-place rewrites of existing lines; the file was
already at 81 before this session started). **BACKLOG LIMIT BREACH**: `docs/backlog.md` is 81 lines, one over the
`~80` limit stated in `docs/ai-behavior.md`; this predates this task's changes (Task 767's review already recorded
the overrun as F8, per Sprint 65's own text) and this task did not increase it. Flagging per protocol for Opus to
validate/consolidate.
