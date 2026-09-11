# Task 817 — Per-surface GR-1 census command (`scripts/check-surface-census.mjs`)

Task path: `tasks/Sprints/Sprint_75_kickoff_prompt_Task_817_Per_Surface_Census_Command.md`

Status: **IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW** (Revision 1 — see §"Revision 1" below; Revision 0's content
above is preserved unedited except this status line and the "Opus handoff" question it resolved)

## Requirement / acceptance-criteria evidence

| ID | Evidence |
|---|---|
| R1/AC1 | `docs/sessions/evidence/task817/AC1-AC2-AC3-AC4-AC7-favoritesshell-clean.txt` — GR-1's exact `Command` block (`$surface = "src\modules\listings\components\FavoritesShell.tsx"; node.exe scripts\check-surface-census.mjs --surface $surface`) run unedited, prints the census. |
| R2/AC2, AC6 | Same transcript: all 7 §3.4 components present as nodes with correct parent (`FavoritesShell.tsx`); `MantineCopyIdButton.tsx`/`AppImage.tsx` etc. at depth ≥ 2. AC6: `docs/sessions/evidence/task817/AC6-unenrolled-surface-ViewAllLink.txt` — `src/components/shared/ViewAllLink.tsx` (from the §13.1 baseline's `tier1-unenrolled` block) censused directly; node #1 reads `manifest:no`, census still runs. |
| R3/AC3 | Same transcript: `theme`, `useFavoritesRealtime`, `useExchangeRate`, `useAuth`, `CollectionWithCount` (type-only), `CardListingData` (inline type specifier) appear in **no** node row. `FavoritesShell.tsx`'s 13 import bindings minus 7 rendered = 6, matching these exact six; scope block's aggregate `Non-rendered local imports skipped: 37` (sum across all 8 tier-1 nodes walked, not just the root). |
| R4/AC4, AC5 | Every node in the clean-tree table carries exactly one tier; tier-3 rows show `tier3(owner=816)`/`tier3(owner=813)`; no tier-2/tier-3 node has children (walk does not recurse past them — verified by node count staying at 15). AC5: `docs/sessions/evidence/task817/AC5-allowlist-probe-part1-with-probe.txt` + `part2-restored.txt` — temporary `{"path":"src/components/ui/AppImage.tsx","reason":"probe","owner":"813"}` entry produces `FAIL src/components/ui/AppImage.tsx [tier2-invalid-allowlist-entry]` **and** the same transcript still shows the `AppImage.tsx` row under `tier:tier2`; restore witness in `part2` shows `git hash-object` back to baseline `91c1aa8330b92e1c8c64a8717c4c77f52f29d10d` and `git status --porcelain` empty, in the same file. |
| R5/AC6, AC7 | Node line format `path tier:<t> manifest:<y/n> story:<y/n> className:<n> ui-imports:<n> parent:<p>`; `story:yes` requires the resolved canonical-story import set to contain the node's own path (verified: `FavoriteButton.tsx` reads `story:yes` because it has its own story despite not being enrolled — GR-3's "own story" distinction). |
| R6/AC8, AC9 | `docs/sessions/evidence/task817/AC8-AC12-post-restore-baseline-check.txt` — literal-string search of the AC1 blocked transcript for `GR-1 CENSUS COMPLETE` returns 0 occurrences. Clean-tree run exits 1, `GR-1 CENSUS BLOCKED — src/components/ui/AppImage.tsx` printed. |
| R7 | Blocking categories implemented and exercised: `tier1-unenrolled-or-unstoried` (AC6, AC9), `tier2-legacy-primitive` (AC1/AC2 run), `tier2-invalid-allowlist-entry` (AC5). |
| R8/AC7 | Scope block on every run states nodes visited, edges resolved, non-rendered skipped, tier-3 excluded + owners, barrel hops (un)resolved, the `className` AST counting rule, the `ui-imports` counting rule, and the blind-spot sentence (dynamic `import()`, `React.lazy()`, story-only renders). |
| R9/AC12 | `docs/sessions/evidence/task817/13.1-baseline.txt` (pre-code) vs `AC8-AC12-post-restore-baseline-check.txt` (post-code, post-plant-restore): `check:story-coverage` identical (38 covered / 0 unproven, exit 0) and `check:rendered-scope:report` identical (27 tier1-unenrolled, 3 tier2-legacy-primitive, 27 allowlisted, byte-identical listing) in both. Neither `check-rendered-scope.mjs` nor `check-story-coverage.mjs` was edited. |
| R10/AC13, AC14 | `package.json` diff (below) adds exactly one entry, `"check:surface-census": "node scripts/check-surface-census.mjs"`. `docs/sessions/evidence/task817/AC13-npm-wrapper.txt` — `npm run check:surface-census -- --surface <path>` produces the identical census/exit code as the direct invocation. `docs/golden-rules.md` GR-1's `Command` block re-read after all edits: byte-identical to the pre-read capture (lines 24-29 unchanged). |
| R11/AC9, AC10 | `docs/sessions/evidence/task817/AC9-AC10-plant-arm1.txt` — with `FavoritesShell.tsx` + `CollectionsSection.tsx` removed from the manifest, the census still lists `CollectionsSection.tsx` (`manifest:no`) and names it in `GR-1 CENSUS BLOCKED`; `npm run check:rendered-scope:report` in the same plant state names `CollectionsSection` **0** times; `npm run check:story-coverage` exits 0, 0 unproven. `AC9-AC10-plant-arm2-restore.txt` — manifest restored, `git hash-object` back to the pre-plant value `9fdc9303c89d98d5e82f28e5ededb16f803924a3`, `git status --porcelain` empty, restored census has no `CollectionsSection … manifest:no` row (in fact identical to the original clean-tree census). Neither arm's exit code was asserted, per the kickoff's GR-4 audit. |
| R12/AC15 | `docs/storybook-governance.md` new §15.6 — names the command, its three tiers, exit codes, and a table of every deliberately-unflagged class with its exclusion mechanism and owning task. |
| R13/AC14 | `docs/golden-rules.md` Enforcement status table — GR-1 and GR-3 rows only edited. Neither row claims GR-1/GR-3 enforced, blocking, or that Task 818's condition is met; both explicitly state landing the command does not by itself change enforcement, and that Task 818 still gates it. |

## Current vs required behavior

**Before:** `docs/golden-rules.md` GR-1 named `scripts\check-surface-census.mjs --surface $surface`; the file did not exist, so the command failed with a module-not-found error and the receipt was written by hand. `check:rendered-scope` covers only the enrolled subgraph.

**After:** The command runs, produces a per-node census (path/tier/manifest/story/className/ui-imports/parent) for any named surface whether or not it is enrolled, prints the GR-1 receipt on a clean census or `GR-1 CENSUS BLOCKED` naming every offender otherwise, and states its own scope/blind spots on every run. `check:story-coverage` and `check:rendered-scope` are provably unchanged (R9/AC12).

**Applicable negative flows** (from the kickoff's table, all exercised): `--surface` omitted/absent path → exit 2 (AC11); type-only import excluded (AC3); inline type specifier excluded (AC3); hook/util/theme excluded (AC3, by construction — never a JSX tag root); tier-3 node with valid entry not recursed/not blocking (AC4); tier-2 node blocking (AC2 run); invalid tier-2 allowlist entry blocking as its own category (AC5); barrel-hop resolution (AC2 run, 4 hops unwrapped). Not applicable: authorization/RLS/network/concurrent-writer (static script, no runtime/data/auth path touched).

## Files Changed

| Path | Reason |
|---|---|
| `scripts/check-surface-census.mjs` (new) | The per-surface GR-1 census command (R1-R13). |
| `package.json` | One new script entry, `check:surface-census` (R10). |
| `docs/golden-rules.md` | Enforcement status table, GR-1/GR-3 rows only — records the command now exists and what it checks, without claiming enforcement (R13). |
| `docs/storybook-governance.md` | New §15.6 documenting the command, its tiers/exit codes, and the false-positive boundary (R12). |
| `docs/backlog.md` | Concise Sprint 75 / task-registry state update for 817 (no history added; line count held at 80). |
| `docs/sessions/evidence/task817/*` | Retained transcripts for every AC above. |

`scripts/mantine-migration-scope.json` and `scripts/rendered-scope-allowlist.json` were touched reversibly for the plant/probe and are restored — `git status --porcelain` shows no diff on either file at session end.

## Validation evidence

- `node --check scripts/check-surface-census.mjs` — exit 0.
- `npm run typecheck` — exit 0.
- `npx eslint scripts/check-surface-census.mjs scripts/check-rendered-scope.mjs scripts/check-story-coverage.mjs` — 0 errors (3 "ignored file" warnings, pre-existing pattern for the `scripts/` dir).
- `npm run check:story-coverage` — 38 covered / 0 unproven, exit 0 (identical to baseline).
- `npm run check:rendered-scope` (gate mode) — exit 1, 27 tier1-unenrolled + 3 tier2-legacy-primitive (identical counts to baseline; this exit code is a **pre-existing, unowned** frontier, not this task's to fix — Task 818 territory).
- `npm run check:stories` — 144 files checked, 0 violations.
- `npm run build` — exit 0 (production build).
- `npm run check:file-integrity` — 34 files checked, all clean (run after all doc edits).
- `npm run check:mojibake` — 0 artifacts in 4288 files (run after all doc edits).
- Two-armed plant + differential arm (R11): see AC9/AC10 evidence above.
- AC5 allowlist invalid-entry probe: see above.

All commands run in native Windows PowerShell (`win32`, node `v22.22.3`), per `orchestrator-role.md`'s Windows-native validation rule. Transcripts captured via `Start-Process -RedirectStandardOutput/-RedirectStandardError` (PowerShell 5.1's native `2>&1`/`2>` redirection on a native executable wraps stderr into `NativeCommandError` records even when file-redirected — `Start-Process` bypasses PowerShell's stream handling entirely and was used for every transcript after this was discovered) and read back with `-Encoding UTF8` (the default `Get-Content` encoding otherwise mojibake's the em dashes Node writes as UTF-8).

## Canonical UI decision record

Not applicable — this task adds a static Node script and edits two `.md` docs and `package.json`. No visible UI artifact is in scope (Mode: `IMPLEMENTATION` — governance detector, no product UI changes per the kickoff's own §1).

## Implementation validation notes

No defects found in the implementation during self-validation. One process note: the first evidence-capture attempts used PowerShell's `2>&1` variable/file redirection on the native `node.exe` process, which Windows PowerShell 5.1 wraps into `NativeCommandError` objects (cosmetic pollution of the transcript, not a script defect — the real exit code and stdout/stderr content were correct throughout). Switched to `Start-Process -RedirectStandardOutput/-RedirectStandardError` for all subsequent captures, which produces clean transcripts.

## Assumptions, deviations, limitations

- The three `ASSUMPTION`s in the kickoff §5 (new script not a flag on `check-rendered-scope.mjs`; tier-1 requires both enrolled **and** storied; the surface itself is node #1 and subject to the same tier-1 rule) were all followed as written — none contested by the measured results.
- §5's `UNKNOWN`s were resolved by measurement, not assumed: §13.1's baseline showed the `ListingCard -> AppImage` tier-2 edge is the **only** blocking node on `FavoritesShell`'s clean-tree census (matching §3.4's INFERENCE exactly) — no `CONFLICT`/`BLOCKED — OWNER DECISION REQUIRED` needed. §13.3 step 1's grep confirmed only `FavoritesShell.tsx` and a `.stories.tsx` import `CollectionsSection.tsx`, so the plant fires as written without adjustment.
- `ui-imports` (an R5-required column not otherwise specified) was implemented as: count of import specifiers in that node's own file resolving under `src/components/ui/*`, regardless of whether they are rendered as JSX — documented in the scope block on every run.
- `check-story-coverage.mjs`'s story-title/import-discovery logic (`collectStoryFiles`, `extractTitle`, `findObjectTitle`) is duplicated, not extracted, inside `check-surface-census.mjs`, per the kickoff's own instruction 1 ("if a helper is extracted … R9's no-behaviour-change assertion binds both consumers") and §8's explicit exclusion of editing `check-story-coverage.mjs`. Extracting it would have required editing that file, which is out of scope.
- Golden-rules.md's closing paragraph below the Enforcement status table ("GR-1 and GR-3 are still not enforced… Tasks 817 and 818 are what closes that gap") was left untouched — R13/§7 scope this task's docs edit to the table's GR-1/GR-3 rows only, and this task has not yet been approved.

## Opus handoff

Evidence root: `docs/sessions/evidence/task817/`. Key files: `13.1-baseline.txt` (pre-code baseline), `AC1-AC2-AC3-AC4-AC7-favoritesshell-clean.txt` (clean-tree census + blocked line), `AC5-allowlist-probe-part1-with-probe.txt`/`part2-restored.txt`, `AC6-unenrolled-surface-ViewAllLink.txt`, `AC9-AC10-plant-arm1.txt`/`arm2-restore.txt`, `AC11a-no-args.txt`/`AC11b-missing-path.txt`, `AC13-npm-wrapper.txt`, `AC8-AC12-post-restore-baseline-check.txt`, `13.2-*.txt` (gate transcripts), `13.2-final-gates-post-docs.txt` (final file-integrity/mojibake/build after doc edits).

Questions/risks for review:
1. Verify the `ui-imports` column's definition (count of `src/components/ui/*`-resolving import specifiers in the node's own file, rendered or not) is the intended metric — R5 names the column but does not specify its counting rule beyond "the surface renders one of tier2 ... "; I chose the broader "still imports" reading to match the spirit of Task 809's original "53 className, two shadcn Dialogs" census.
2. Confirm the golden-rules.md GR-1/GR-3 row wording does not overstate what landing this command means — I deliberately included "landing this command does not by itself make GR-1/GR-3 enforced or blocking" in both rows per R13, but the wording is mine, not quoted from an owner decision.
3. `scripts/mantine-migration-scope.json` and `scripts/rendered-scope-allowlist.json` show no diff in git status — both plant/probe cycles fully restored; independently re-run `git hash-object` on both if you want a third-party check beyond the transcripts.

## Backlog update

`docs/backlog.md` Sprint 75 row and the 809/811/813-818 task-registry row both updated to reflect Task 817 = `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, with a one-line pointer to this evidence directory. No history added. Physical line count after edit: **80** (unchanged — edits replaced existing text in place, no new lines added). No `BACKLOG LIMIT BREACH`.

## Revision 1 — 2026-09-11 (remediating Opus's `NEEDS REVISION`)

Opus's implementation review confirmed three defects (kickoff §17.2) and filed R14-R17. Re-entry mode `remediation`:
the five Revision-0 artifacts the kickoff named as irreplaceable were not re-run or modified (confirmed below).

### Requirement / acceptance-criteria evidence

| ID | Evidence |
|---|---|
| R14/AC16 | `buildCanonicalStoryImportIndex` (`scripts/check-surface-census.mjs`) now iterates `extractImportBindings` per binding and applies `unwrapBarrel` to each resolved path, adding both the direct and barrel-unwrapped path to the story index — mirroring the render-side walk exactly. `docs/sessions/evidence/task817/R1_AC16-AC18-favoritesshell-report.txt`: `MantineListingCardPattern.tsx`, `MantineCopyIdButton.tsx`, `MantineModal.tsx`, `MantinePagination.tsx` now all read `story:yes` (were `story:no` in Revision 0); `FavoriteButton.tsx` (direct-import control) still `story:yes`; `ListingFeatureIcon.tsx`/`src/components/ui/AppImage.tsx` (no-story controls) still correctly `story:no` — the unwrap does not over-match. |
| R14/AC17 | `docs/sessions/evidence/task817/R1_AC17-story-barrel-probe-part1-during.txt` + `part2-restored.txt` — `src/stories/patterns/mantine/ListingCardTrack.stories.tsx` (the canonical, direct-import own-story for the enrolled `MantineListingCardTrack`, chosen because it is the one enrolled component whose story imports it by direct path rather than the barrel) temporarily repointed at the barrel `@/design-system/mantine/patterns`: `MantineListingCardTrack.tsx` reads `story:yes` before, during, **and** after the probe. Restore witness: `git hash-object` before/after both `cc2838dad4beda4c86e32d09967428f4328da223`, `git status --porcelain` empty. |
| R15/AC18 | `countUiImports` now takes `(bindings, renderedTagRoots, absPath)` and only counts a binding that is both non-type-only **and** rendered as a JSX tag, resolving under `src/components/ui/*` — computed above the tier-1 recursion gate so every parseable node (tier-2/tier-3 included) is measured, not defaulted to `0`. **A real defect was found and fixed during this pass, not merely "moved above the gate":** the first working version (gate moved, filter not yet added) measured `src/components/ui/AppImage.tsx` at `ui-imports:2`, counting its own co-located `./AppImage.module.css` and `./useAdaptiveImageConfig` — neither a rendered component — because they mechanically resolve under `src/components/ui/` (that is where `AppImage.tsx` itself lives). Independent check: `grep -n "^import" src/components/ui/AppImage.tsx` shows **zero** imports from a *different* `@/components/ui/*` file. After adding the rendered-tag-root filter, the census correctly reads `ui-imports:0` for `AppImage.tsx` and all 6 tier-3 nodes. Positive control: `ListingCard.tsx` reads `ui-imports:1`, independently confirmed via `grep` — its sole `src/components/ui/*` import is `AppImage` (`@/components/ui/AppImage`), which is also the tier-2 edge the census already flags. `docs/sessions/evidence/task817/R1_AC16-AC18-favoritesshell-report.txt` carries all rows. |
| R16/AC19 | `parseCensusNode` reads the file and, if `ts.createSourceFile` succeeds, inspects `SourceFile.parseDiagnostics` for genuine parse errors (permissive `ts.createSourceFile` does not throw on malformed syntax, so a diagnostics check is required — a plain try/catch alone would not have caught this). Root: `resolveSurface` succeeds but `parseCensusNode` fails → exit **2** naming the path, **before** any census/scope-block line is printed. `docs/sessions/evidence/task817/R1_AC19-root-unparseable-exit2.txt`: a scratch `.tsx` outside `src/` (`docs/sessions/evidence/task817/_scratch_unparseable_probe.tsx`, unbalanced braces/JSX) as `--surface` → `EXIT_CODE=2`, `FAIL … could not be parsed: … (4 parse diagnostic(s), e.g. "Expression expected.")`, no census. Scratch files deleted after the run; `git status --porcelain` for both paths returns nothing (they were never tracked). Child-node handling (code reference: `scripts/check-surface-census.mjs`, the `else if (existsSync(absPath) …)` / `parseCensusNode(absPath)` branch inside the main walk loop, ~10 lines below the `depth === 0` reuse branch): a child whose file fails the same check sets `parseFailed = true`, is retained in the table with `className:n/a  ui-imports:n/a`, is never recursed into, increments the new `parseFailedCount` scope-block counter, and is added to `blockingNodes` under reason code `unparseable-source` regardless of tier — proven live in `docs/sessions/evidence/task817/R1_AC19-unparseable-probes.txt` (a second scratch file importing and rendering the broken one: `Nodes whose source could not be parsed: 1`, the child row prints `className:n/a ui-imports:n/a`, gate-mode exit **1** with `GR-1 CENSUS BLOCKED` naming it under `[unparseable-source]`). |
| R17/AC20 | `docs/golden-rules.md` GR-3 row: "that exact path" replaced with "directly or through a single-hop `index.ts(x)` barrel re-export — the same resolution the render-side walk uses". `docs/storybook-governance.md` §15.6 mechanism paragraph: same correction, plus `.js`/`.tsx` corrected to the resolver's real extension list (`.tsx`, `.ts`, `/index.tsx`, `/index.ts` — never `.js`). GR-1's `Command` block re-read after the edit: still byte-identical (lines 24-29 of `docs/golden-rules.md` unchanged). Neither file claims GR-1 or GR-3 enforced or blocking (unchanged from Revision 0). |
| AC21 | `docs/sessions/evidence/task817/R1_platform-and-check.txt` (win32, node v22.22.3, `--check` exit 0), `R1_favoritesshell-final-report.txt` (final clean-tree report), `R1_gates-part1.txt` (typecheck 0, eslint 0 errors, `check:story-coverage` 38/0 exit 0, `check:rendered-scope:report` 27/3/27 identical to the original §13.1 baseline), `R1_gates-part2.txt` (`check:stories` 0 violations, `build` exit 0, `check:file-integrity` 46 files clean, `check:mojibake` 0/4300). |

### Re-entry compliance

`git status --porcelain -- docs/sessions/evidence/task817/` shows the whole directory as `??` (untracked) with no `M`
on any path — the five Revision-0 artifacts named in kickoff §17.1 were not re-run, edited, or deleted this pass.
`scripts/mantine-migration-scope.json` and `scripts/rendered-scope-allowlist.json` still show no diff in
`git status --short` — untouched in Revision 1.

### Files changed (Revision 1, in addition to Revision 0's)

| Path | Reason |
|---|---|
| `scripts/check-surface-census.mjs` | R14 (barrel-aware story index), R15 (ui-imports measured pre-gate, rendered-only filter — includes the mid-pass fix above), R16 (root/child parse-diagnostics check, `n/a` columns, new blocking category, new scope-block counter). |
| `docs/golden-rules.md` | GR-3 row only — corrected wording (R17). |
| `docs/storybook-governance.md` | §15.6 mechanism paragraph only — corrected wording (R17). |
| `docs/sessions/evidence/task817/R1_*.txt` | Revision 1 transcripts (new). |
| `src/stories/patterns/mantine/ListingCardTrack.stories.tsx` | Touched reversibly for AC17's probe, restored byte-identically (hash-verified). |

### Validation evidence (Revision 1)

All of §17.5's block, native PowerShell, `win32`/node v22.22.3: `node --check` exit 0 · typecheck exit 0 · eslint 0
errors · `check:story-coverage` 38/0 exit 0 (identical) · `check:rendered-scope:report` 27/3/27 identical ·
`check:stories` 0 violations · `build` exit 0 · `check:file-integrity` 46 files clean · `check:mojibake` 0/4300.
AC16-AC19 evidence above.

### Assumptions, deviations, limitations (Revision 1)

- R15's fix went one step further than "move the call above the gate": the initial move alone would have printed a
  measured-but-wrong `ui-imports:2` for `AppImage.tsx` (its own CSS-module/hook siblings, not a legacy-component
  import). This was caught by AC18's own "independently measured" requirement before being reported, and fixed by
  filtering to rendered, non-type-only bindings only — the same filter the render-side edge walk already uses for
  tier classification. This is reported as a mid-pass self-caught defect, not a silent revision.
- R16's "unparseable" definition is `SourceFile.parseDiagnostics` (an internal-but-stable TypeScript field populated
  by the parser for genuine syntax errors), not a thrown exception — `ts.createSourceFile` is permissive and does not
  throw for malformed-but-not-fatal input. A pure try/catch (as Revision 0 had) would not have caught this class,
  which is why AC19's probe needed real unbalanced-brace/JSX content rather than merely an inaccessible file.
- Revision 0's original three `ui-imports:0` question (Opus handoff question 1) is superseded by the R15 fix above;
  the metric is now "rendered, non-type-only, resolves under `src/components/ui/*`" and is independently checked in
  AC18's evidence.

### Opus handoff (Revision 1)

Evidence: `docs/sessions/evidence/task817/R1_*.txt` (see table above for the exact file per requirement). Question 2
from Revision 0 (GR-1/GR-3 row enforcement wording) still stands — only GR-3's row changed this pass, at R17's
direction; GR-1's row and its enforcement wording were not touched (R17 scopes the correction to GR-3's row and
§15.6 only). Question 3 (manifest/allowlist untouched) still holds — reconfirmed above.

## Git handoff

Sonnet does not run, emit, or suggest any mutating git command. Per `docs/agent-contract.md` clause 10 and the kickoff's own instruction, only Opus may emit an owner-run commit handoff after reviewing this implementation.
