# Task 815 — `check:card-track-monotonicity` — session log

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` (Revision 2 — see "Revision 2" section at the end of this
file, the current status)

Kickoff: `tasks/Sprints/Sprint_75_kickoff_prompt_Task_815_Card_Track_Monotonicity_Gate.md`
Evidence: `docs/sessions/evidence/task815/`

**This log's original body (Files Changed / Req-AC evidence / Validation evidence / notes below) is Rev 0's
record, reviewed 2026-09-16 as `NEEDS REVISION` (kickoff §16). It is retained unchanged as history, as is the
"Revision 1" section (Rev 1 correctly stopped on its own §16.2 condition and was reviewed into kickoff §17 =
Rev 2). The Revision 2 section at the end of this file is the current status.**

## Summary

Replaced the never-wired `measureStorybookColumnMonotonicity` probe
(`scripts/task809-favorites-parity-probe.mjs:319-374` — one Story, `600-900` px, first
`display:grid` element, production server + auth state, no `package.json` script, no CI job) with
a new blocking gate, `scripts/check-card-track-monotonicity.mjs`, that discovers every canonical
Mantine/Patterns Story rendering `MantineListingCardTrack` from a fresh `storybook-static/` build,
sweeps 17 declared-rung widths, and fails when a wider viewport produces fewer grid columns or
fewer fully visible rail cards than the immediately narrower sampled width. Scope is canonical-only
per the owner decision quoted in kickoff §5.1 (2026-09-16); the `System/*` legacy Stories are
excluded and the exclusion is printed on every run (Task 827 owns their own measured drop).

## Files Changed

| Path | Reason |
|---|---|
| `scripts/check-card-track-monotonicity.mjs` | New gate script (R1-R7). |
| `package.json` | +2 scripts: `check:card-track-monotonicity`, `check:card-track-monotonicity:verify` (R8). |
| `.github/workflows/governance-pr.yml` | +2 steps in the `homepage-grid` job, between `Build Storybook` and `Homepage grid invariants gate` (R8/§10.6). |
| `src/design-system/mantine/patterns/MantineListingCardTrack.module.css` | Comment-only: retargets the "re-run the monotonicity probe" instruction to the new command (R9). |
| `src/stories/mantine/_MantineStoryShell.tsx` | Comment-only: same retargeting (R9). |
| `docs/storybook-governance.md` | +§15.10 documenting the gate, scope, verify arms, blind spots, landed state (R10). |
| `docs/backlog.md` | Task 815 state line updated to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. |

`scripts/task809-favorites-parity-probe.mjs` is unmodified (`git diff --stat` empty) — it remains
Task 809's retained evidence producer, per R9/AC9.

## Requirement / AC evidence

| Req | Evidence |
|---|---|
| R1 | `23_check-card-track-monotonicity.txt` — runs against `storybook-static/` only, own port 6034, own `node:http` server. `38_missing-build.txt` — `storybook-static/` reversibly renamed away, gate run, exit 1 with `storybook-static/ not found ... Build first: npm run build-storybook`, directory restored and confirmed intact (same CSS asset hash, `40_hash-object.txt`-adjacent build unaffected). |
| R2 | `23_...txt` header: `CSS asset: MantineListingCardTrack-xPQNAbuy.css`, `Grid class: _grid_az6ln_5`, `Rail class: _rail_az6ln_32` — a fresh hash on every build, extracted at runtime, never hardcoded (confirmed by reading the script). Arm (d) of `25_...verify.txt` proves the fail-closed path. |
| R3 | `23_...txt`: `in scope: 16 canonical stories rendering the track (of 140 canonical, 351 total)`, list matches kickoff §3.4 exactly. Arm (e) proves the zero-scope fail-closed path. |
| R4/R5 | `23_...txt` full per-story, per-width transcript; `25_...verify.txt` arms (b)/(c) prove the drop-detection mechanism against real plants. |
| R6 | Both `23_` and `25_` transcripts carry the full scope+blind-spot block verbatim. |
| R7 | `25_check-card-track-monotonicity-verify.txt`, exit 0, all 5 arms PASS. `24_status_before_verify.txt`/`26_status_after_verify.txt` — see AC7 note below. |
| R8 | `33_diff-stat-wiring.txt`/`34_diff-wiring-full.txt` — exactly 2 script lines in `package.json`, exactly 2 steps in `governance-pr.yml` at the required position. |
| R9 | `35_diff-comments.txt` (comment-only hunks in both files) + `36_diff-stat-probe.txt` (empty). |
| R10 | `37_diff-stat-docs.txt` + inspected diff — one new §15.10 section, nothing else touched in that file from this task. |

## Validation evidence

| Command | Exit | Transcript |
|---|---|---|
| `node -p process.platform` / `node --version` / `Get-Location` | — | `10_`/`11_`/`12_platform.txt` |
| `git status --porcelain` (baseline) | — | `13_status_before.txt` |
| `check-card-track-monotonicity.mjs` against renamed-away `storybook-static/` (AC1) | 1 | `38_missing-build.txt` |
| `git log -1 --oneline` | — | `14_log.txt` (`1ed5cd2a5`) |
| `npm run build-storybook` (baseline) | 0 | `15_build-storybook.txt` |
| `node .../90_census815.mjs` (§13.1 reproduction) | 0 | `16_census-reproduction.txt` — 16 canonical, 0 drops; 4 `System/*` drops at 1441→1920, matching §3.5 |
| `npm run typecheck` | 0 | `20_typecheck.txt` |
| `npm run lint` | 0 | `21_lint.txt` (72 pre-existing warnings elsewhere, 0 errors, none in touched files) |
| `npm run build-storybook` (final) | 0 | `22_build-storybook-final.txt` |
| `npm run check:card-track-monotonicity` | 0 | `23_check-card-track-monotonicity.txt` |
| `git status --porcelain` (before verify) | — | `24_status_before_verify.txt` |
| `npm run check:card-track-monotonicity:verify` | 0 | `25_check-card-track-monotonicity-verify.txt` |
| `git status --porcelain` (after verify) | — | `26_status_after_verify.txt` |
| `npm run check:stories` | 0 | `27_check-stories.txt` |
| `npm run check:surface-census:changed -- --base HEAD` | 0 | `28_check-surface-census-changed.txt` |
| `npm run build` | 0 | `29_build.txt` |
| `npm run check:file-integrity` | 0 | `30_file-integrity.txt` (final re-run, post-corrections) |
| `npm run check:mojibake` | 0 | `31_mojibake.txt` (final re-run) |
| `git diff --stat` (final) | 0 | `32_diff-stat.txt` |
| `git diff --stat` wiring files | 0 | `33_diff-stat-wiring.txt` |
| `git diff` wiring files (full) | 0 | `34_diff-wiring-full.txt` |
| `git diff` comment files (full) | 0 | `35_diff-comments.txt` |
| `git diff --stat` probe file | 0 | `36_diff-stat-probe.txt` (empty — unmodified) |
| `git diff --stat` docs files (final) | 0 | `37_diff-stat-docs.txt` |
| `git hash-object` (final, all 7 changed files) | 0 | `40_hash-object.txt` |

## AC7 note — status-equality comparison

`24_status_before_verify.txt` vs `26_status_after_verify.txt` differ verbatim because (a) capturing
the "before" snapshot itself creates a new untracked evidence file that then appears in the "after"
snapshot (unavoidable in-band effect of the measurement itself, not a gate-caused write), and (b) a
concurrent, unrelated Sonnet session was executing Task 743 (`docs/design-system.md`,
`scripts/check-css-var-resolvability.mjs`, `scripts/__tests__/css-var-resolvability.test.ts`,
`docs/sessions/evidence/task743/*`, `scripts/css-var-ownership-snapshot.json`) in the same working
tree during the ~2-minute `--verify-gate` run and wrote 6 more files mid-run. Filtering both
snapshots to exclude this task's own before/after evidence files and every `task743` path leaves
them byte-identical — confirmed directly (`diff` exit 0 after the filter). `check-card-track-monotonicity.mjs`
itself wrote nothing under any code path exercised by `--verify-gate`; the residual diff is
attributable entirely to (a) and (b), neither of which is the gate under test.

## Implementation validation notes

- **Discovery-timeout defect found and fixed before any evidence was captured.** The first draft's
  discovery phase used the sweep-grade 15000ms `waitForFunction` timeout for every canonical Story,
  including the ~124 that never render the track at all — each miss burned the full 15s twice
  (two discovery widths), projecting to roughly an hour just for discovery negatives. Fixed by adding
  a separate `DISCOVERY_READY_TIMEOUT_MS = 2000` used only during discovery; every Story this gate
  actually measures (the 16 in-scope ones, at all 17 sweep widths) still gets the full
  `SWEEP_READY_TIMEOUT_MS = 15000`. Re-run after the fix completed discovery+sweep in well under two
  minutes with the same 16-story result.
- One retained maintainer-doc discrepancy corrected during evidence review: the kickoff's own §3.8
  cost estimate said "139 canonical stories," but the executor's direct re-measure against the same
  commit (`1ed5cd2a5`, no tree change) found 140. This does not affect R3/AC3 — the **in-scope**
  list (16 track-rendering canonical Stories) matches §3.4 exactly — but `docs/storybook-governance.md`
  §15.10 was written to state the measured 140 with a one-line note explaining the discrepancy,
  rather than silently repeating the kickoff's unverified number.

## Assumptions, deviations, and limitations

- A concurrent, unrelated Sonnet session (Task 743) was live in the same working tree for the
  duration of this session. Every file it touched is outside this task's scope (§7/§8) and was left
  untouched; see the AC7 note above for how this was isolated in the evidence.
- `docs/backlog.md`'s Task 815 line was updated to concise current state
  (`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`); the broader Sprint 75 narrative line (line 44) was
  left for Opus to consolidate, per the executor's backlog-writing boundary.
- `package.json`'s diff also carries one line this task did not add
  (`check:css-vars:update-snapshot`) — that is Task 743's concurrent addition to the same file, not
  this task's; `33_diff-stat-wiring.txt`/`34_diff-wiring-full.txt` are scoped to the two files this
  task actually touches for wiring and show only this task's two added lines.

## Opus handoff (Rev 0 — superseded by the Revision 1 section below)

- Please independently re-run `npm run check:card-track-monotonicity` and
  `npm run check:card-track-monotonicity:verify` against a fresh `npm run build-storybook` — the
  transcripts above are this session's own capture and should be reproduced, not merely trusted.
- Please confirm the `docs/backlog.md` Task 815 line and the Sprint 75 summary line (44) stay
  consistent after Task 743 is also reviewed/archived — both sessions touched `docs/backlog.md`
  concurrently.

---

## Revision 1 — remediation session, 2026-09-16 (re-entry at kickoff §16)

Re-entry mode `remediation` per kickoff §16.4. Did **not** re-run §13.1 (per §16.4); Rev 0's
`00_`–`40_` evidence is untouched. New evidence is `50_`+.

### §16.1 — plant arms now run the gate's own `evaluateSweep` (implemented)

`scripts/check-card-track-monotonicity.mjs` refactored per the kickoff's required shape:

- Extracted `sweepStory(page, baseUrl, storyId, selectors, { plant } = {})` — the ONE sweep
  implementation. `runGate`'s real run calls it with no plant; `runPlantArm` calls it with a plant
  over the full 17-width list. Both funnel through the same `evaluateSweep` call.
- `measureStoryAtWidth` accepts an optional `plant` (`{ mode, rung, paddingPx }`), applied on every
  navigation after readiness and before `evalTracks` (tag the track's parent with
  `data-task815-plant`, then `page.addStyleTag` the `@media (min-width: <rung>px)` rule).
- `runPlantArm` deleted its private comparison entirely (no `plantedValue`, confirmed:
  `git grep -n "plantedValue" -- scripts/check-card-track-monotonicity.mjs` returns no hit — quoted
  in-session, re-quote at final evidence capture). It now: (1) asserts the produced track width at
  `arm.rung` first; (2) requires `evaluateSweep`'s `failures` to have exactly one entry; (3) requires
  that entry to name the story, `track 0 (<mode>)`, and the `prevWidth->rung` pair; (4) requires an
  unplanted `sweepStory` afterwards to return `pass: true`.
- Arm (c)'s `describe` text corrected: `1279->1280` drop is `4->3`, not `5->3` (§16.1 item 4).
- The `evaluateSweep` doc comment (previously false — Rev 0's comment claimed sharing that didn't
  exist) rewritten to describe the shipped code.
- `docs/sessions/evidence/task815/57_mutation-probe.mjs` created byte-identical to the kickoff's
  specified content. Mutation target `"tr.value < prev.value"` confirmed unique in the script
  (`git grep`/direct read, one hit, `evaluateSweep` line).

**Not yet evidenced with a passing run** — see the blocker below. The mutation-proof PowerShell block
(apply → `:verify-gate` → restore → hash compare) could not be meaningfully run: `:verify-gate`'s
arm (a) and the post-plant recheck both call `discoverInScope`, which currently returns 0 in-scope
stories regardless of the script's mutation state (the §16.2 defect below), so `:verify-gate` fails
uniformly and the mutation's actual effect on detection cannot be isolated from that unrelated
failure. Re-run once §16.2 is resolved.

### §16.2 — discovery readiness signal: STOP condition hit, evidence attached (kickoff's own escape hatch)

Implemented exactly as specified: `DISCOVERY_READY_TIMEOUT_MS` removed; discovery now
`waitForFunction`s for `document.body` to carry `sb-show-main`, `sb-show-errordisplay`, or
`sb-show-nopreview` (`waitForRenderSettled`, using the full `SWEEP_READY_TIMEOUT_MS`), then queries
the track selectors once; a story reaching none of the three states is a named discovery failure and
forces exit 1.

**Required pre-flight verification (kickoff §16.2, "before relying on the signal") was run and the
signal failed it.** Two scratch probes, both re-run natively in PowerShell for the owner-native rule
(§13.3), both deterministic across two independent runs:

- `docs/sessions/evidence/task815/58a_probe-render-state.mjs` / `.txt` — polls body class + track
  count on a real delay ladder (not `waitForFunction`). `sb-show-main` appears and the track is
  present together, stably, by `+200ms`, for both `patterns-mantine-listingcardtrack--grid` and
  `mantine-primitives-favoritesshell--populated`. This looked reliable in isolation.
- `docs/sessions/evidence/task815/58b_probe-discovery.mjs` / `.txt` — the ACTUAL mechanism
  (`page.waitForFunction` resolving the instant the condition first becomes true, exactly as
  `waitForRenderSettled` does), at both `DISCOVERY_WIDTHS` (320/1440), on
  `patterns-mantine-listingcardtrack--grid`, `patterns-mantine-listingcardtrack--rail`, and
  `mantine-primitives-favoritesshell--populated`. Result, run twice (Bash then PowerShell), identical
  both times: **5 of 6 samples** show `document.body.classList` containing `sb-show-preparing-story`
  *simultaneously* with `sb-show-main`, and the track selectors match **0** elements at that exact
  moment — including on `patterns-mantine-listingcardtrack--grid` itself, the story named in the
  kickoff's own required check. The track appeared in only 1–2 of 6 samples, unpredictably.

`CONTRADICTION`: `sb-show-main` is not, in fact, "set only once the story has rendered" — it is set
by Storybook's own preview framework as a separate DOM-mutation step that can and does race ahead of
the story's own React mount, at least under Playwright's `waitForFunction` (which resolves on the
earliest mutation-observer tick where the condition is true, not after paint settles). This is a
different, faster, but LESS correlated-with-content signal than the track-selector-or-error signal
Rev 0 used — the opposite of what §16.2 needed.

**Per the kickoff's own explicit instruction — "If it is not a reliable post-render signal, stop and
return `BLOCKED — OWNER DECISION REQUIRED` with the observed class sequence; do not substitute
another fixed timeout" — this session stops here rather than inventing a replacement signal
(e.g., additionally requiring the absence of `sb-show-preparing-story`, which was not specified and
has not itself been verified; or reverting to Rev 0's track-selector wait, which un-fixes the P2
defect Opus flagged and was measured to cost up to ~1 hour of discovery time on true negatives,
kickoff §3.8/Rev 0 notes).**

`docs/sessions/evidence/task815/59_check-card-track-monotonicity.txt` — the real gate run against
this code, exit 1: `in scope: 0 canonical stories rendering the track (of 140 canonical, 351 total)`.
This is the observed consequence, not a separate defect — the gate is currently non-functional because
of the §16.2 signal, and no further `check:card-track-monotonicity[:verify]` evidence (AC4, AC6, AC7,
AC7-R1, AC11, AC12, AC13) can be honestly captured until discovery is fixed, because every one of
those runs currently fails uniformly on this, masking whatever else they would otherwise show.

**Owner decision needed — candidate options, none selected by this session:**

1. Keep the track-selector-or-error `waitForReady` (Rev 0's mechanism, already proven correlated with
   actual render) for discovery too, but always at the FULL `SWEEP_READY_TIMEOUT_MS` (no separate
   discovery timeout) — correctness-safe (matches the kickoff's own "no discovery-only timeout"
   requirement literally), at the up-to-~1-hour worst-case discovery cost Rev 0 already measured and
   flagged as the reason it added a shorter discovery timeout in the first place.
2. Require BOTH `sb-show-main` (or `-errordisplay`/`-nopreview`) AND the absence of
   `sb-show-preparing-story` before querying selectors — a refinement of the literal kickoff text,
   not yet itself verified at runtime the way §16.2 requires before trusting a signal.
3. Something else the owner specifies.

### §16.3 — R6 block on every `runGate` exit path (implemented, not yet evidenced by a passing run)

`runGate` restructured with an outer `try/finally` so `CANNOT_SEE` prints on every exit, including the
selector-extraction-failure early return, which now also prints
`scope: not discovered — selector extraction failed`. `main()`'s missing-build exit is unchanged (a
one-line error, per kickoff §16.3). A `--force-bad-selector-task815-evidence` CLI flag was added
(default off, changes nothing in normal or `--verify-gate` operation) so `runGate`'s real
selector-failure path — rather than a re-derived copy — can be exercised for AC13's evidence without
writing any repository file. **Not yet run for evidence** — captured after §16.2 is resolved, since
this path doesn't depend on discovery and can be verified independently once the session resumes.

### What is NOT done

- No clean `check:card-track-monotonicity` run (AC4, AC12 — the real 16-story in-scope list).
- No `:verify-gate` run (AC6, AC7-R1 — all 5 arms, including (d)/(e) which don't depend on §16.2 but
  were not re-captured in isolation this session).
- No §16.1 mutation-proof run (AC11) — blocked by §16.2 as explained above.
- No AC13 evidence (the `--force-bad-selector-task815-evidence` path) — not blocked by §16.2, simply
  not yet captured; deferred to the same follow-up pass as the rest, to avoid partial/misleading
  evidence in this log.
- `docs/storybook-governance.md` §15.10's verify-arm paragraph not yet updated for the Rev 1 mechanism
  (deferred — would need rewriting again once §16.2's resolution is known, to avoid describing a
  mechanism twice).
- Full §13.2 final gate block not completed (`check:stories`, `check:surface-census:changed`,
  `build`, `check:file-integrity`, `check:mojibake`, final `diff --stat`/`hash-object`) — deliberately
  not run to avoid capturing evidence against code that changes again once §16.2 is resolved.

### Files touched this Rev 1 session so far

`scripts/check-card-track-monotonicity.mjs` (§16.1/§16.2/§16.3 code) ·
`docs/sessions/evidence/task815/50_`–`59_` (new evidence, listed above) ·
`docs/sessions/evidence/task815/57_mutation-probe.mjs` (kickoff-specified content, unmodified) ·
this session log. `docs/backlog.md`'s Task 815 line is updated in the same response to `BLOCKED`.
`docs/storybook-governance.md` §15.10 is intentionally NOT re-edited this session (see above).

### Opus handoff (Rev 1 — superseded by the Revision 2 section below)

**Status: `BLOCKED — OWNER DECISION REQUIRED`**, per the kickoff's own §16.2 stop condition, not a
general implementation failure. §16.1 and §16.3's code changes are implemented per spec but unproven
by a passing run because §16.2's defect currently makes every gate invocation fail uniformly. Please:

1. Decide the discovery-readiness mechanism (see the three options above, or specify another).
2. On resume, re-implement discovery per that decision, then run the full §13.2 block from a fresh
   `build-storybook`, including the §16.1 mutation proof and AC13's evidence capture.
3. Re-check `docs/storybook-governance.md` §15.10's verify-arm paragraph against whatever the final
   mechanism turns out to be before closing R10/AC10.

---

## Revision 2 — owner decision on the discovery signal, 2026-09-16 (re-entry at kickoff §17.3)

Owner decision (kickoff §17.2, quoted in the kickoff): adopt **Storybook render phase** (Route A) if a
mechanical 32/32-sample probe holds; otherwise fall back to **deterministic 15s wait, 6 pages** (Route B) —
not a stop either way.

### §17.3 — signal probe, Route A adopted (32/32)

`docs/sessions/evidence/task815/62_probe-render-phase.mjs` (evidence-only, never imported by the gate) serves
`storybook-static/` on its own port (6037), extracts selectors exactly as `extractTrackSelectors` does, and for
the 16 in-scope story ids from `23_check-card-track-monotonicity.txt` at widths 320/1440 (32 samples):

- `window.__STORYBOOK_PREVIEW__.currentRender`'s story-id property was confirmed to be `.id` by reading the
  built preview bundle (`storybook-static/assets/iframe-BH37VSPX.js`) — `runPhase` emits `storyId:this.id`,
  never guessed.
- **Step 1/2 (32 samples):** all 32 resolved `idMatches=true`, `phase=finished`, `trackCountAtResolve > 0`, and
  the SAME track count 2000ms later. 0 failures.
- **Step 4 counter-check (same 32 samples, Rev 1's `sb-show-main` signal):** `sbShowMainTrackCount=0` on **all
  32** — stronger confirmation than Rev 1's own 5-of-6 finding that the body-class signal races the track.
- **Step 5 (2 no-track canonical stories × 2 widths = 4 samples):** `admin-adminuserstable--default` and
  `mantine-primitives-actionicon--default` (first two canonical, non-in-scope ids in `index.json` order) both
  reached `phase=finished`, `idMatches=true`, within the timeout.
- Adoption rule: 32/32 + 4/4 all pass → **ROUTE A** (`docs/sessions/evidence/task815/62_probe-render-phase.txt`,
  final line: `ROUTE SELECTED: A (Storybook render phase)`).

### §17.4 — Route A implemented

`scripts/check-card-track-monotonicity.mjs`:

- Deleted `waitForRenderSettled` and every `sb-show-main` check from Rev 1; added `waitForRenderPhase` (waits
  for `currentRender.id === storyId && phase ∈ {finished, errored}`) and `DISCOVERY_ROUTE_DESCRIPTION`.
- `discoverInScope` rewritten: a story that never reaches that phase within `SWEEP_READY_TIMEOUT_MS` is a named
  discovery failure (exit 1); a story whose phase is `errored` is ALSO a named discovery failure (checked
  against `sb-show-errordisplay`), never silently treated as "no track" — this is new behavior Route A required
  that Rev 0/Rev 1 didn't have. Discovery stays sequential on one page.
- `CANNOT_SEE` and the printed scope block both gained the Route-A-only blind spot: "a Story whose track mounts
  only after its Storybook render reaches finished" — and a `discovery readiness: storybook render phase
  (finished|errored)` line, so the printed and documented (§15.10) blind-spot lists stay identical.
- Real run (`65_check-card-track-monotonicity.txt`): exit 0, `in scope: 16` — the same 16 as `23_` (§16's Rev 0
  in-scope list) — AC12-R2's equality requirement.

### §17.5 — two Rev 1 corrections

1. **`runPlantArm` shape check completed.** Added a `measure (\d+)->(\d+)` parse on the `evaluateSweep` failure
   string and a `measureAfter < measureBefore` check — Rev 1's check only confirmed the story/track/width-pair
   shape, never that the failure was actually a drop.
2. **Evidence-only CLI flag removed.** `runGate` now takes `{ assetPattern, log }` (defaults: the real pattern,
   `console.log`). `--verify-gate` arm (d) calls `runGate` directly with a non-matching pattern and a collecting
   `log`, asserting exit 1 **and** the collected output contains the `cannot see:` line.
   `git grep -n "force-bad-selector" -- scripts/` returns no hit (confirmed after wording the removal comment to
   avoid the literal string itself tripping the same grep).

### A third defect found during §17.5 evidence capture (not in the kickoff, found by running the real check)

`FACT` — the first `--verify-gate` run under Route A (before this fix) failed arms (b) and (c) with
`evaluateSweep failure does not match the expected shape (missing ["1023px->1024px"]): ... undefinedpx->1024px
measure 3->2 ...`. `evaluateSweep`'s `prevByTrack.set(i, { value: tr.value, trackWidth: tr.width })` never stored
the sampled viewport `width` itself, only the measured `value`/`trackWidth` — so every failure message's
`${prev.width}` was `undefined`. This bug is pre-existing (Rev 0's original code, untouched by Rev 1's comment-only
edit to this function), and was never caught before because Rev 0/Rev 1's `runPlantArm` used its own private
comparator and never inspected `evaluateSweep`'s message text closely enough to notice the width was missing —
exactly the kind of gap §16.1 (arms must run the gate's OWN `evaluateSweep`) was designed to surface. Fixed:
`prevByTrack.set(i, { width: cell.width, value: tr.value, trackWidth: tr.width })`
(`scripts/check-card-track-monotonicity.mjs:340`). Re-verified: the failure string now reads
`patterns-mantine-listingcardtrack--grid track 0 (grid): 1023px->1024px measure 3->2 (...)` — exactly AC7-R1's
required text.

### Evidence

- `62_probe-render-phase.mjs` / `.txt` — the §17.3 probe, Route A adopted (32/32 + 4/4).
- `63_mutation-verify.txt` / `64_mutation-hashes.txt` / `57_mutation-probe.mjs` (unchanged) — the §16.1 mutation
  proof, re-run after the evaluateSweep bugfix: mutated `--verify-gate` exits 1, arms (b)/(c) `FAILED`; pre/post
  hash `b4c307e0539432f75046a2000a76b82ce4886e8e` identical; `restored` printed.
- `65_check-card-track-monotonicity.txt` — first real run under Route A, exit 0, 16/16 in scope (pre-final-build).
- `66_`/`67_`/`68_` — first `--verify-gate` run (pre-bugfix arms b/c FAILED as above, then re-run in place after
  the fix: all 5 arms PASS, exit 0; `66_`/`68_` status snapshots differ only by the two evidence files the
  measurement itself created — same in-band-effect pattern documented in Rev 0's own AC7 note).
- `69_`–`73_` — platform/node/location/typecheck (0)/lint (0 errors, 73 warnings — 72 pre-existing + 1 new,
  harmless `no-undef` unused-disable in the evidence-only `62_probe-render-phase.mjs`, not shipped code).
- `74_` — final `build-storybook`, exit 0.
- `75_` — final real gate run, exit 0, 16/16 in scope.
- `76_`/`77_`/`78_` — final `--verify-gate`, all 5 arms PASS, exit 0; status snapshots differ only by the two
  files the measurement itself created (same pattern).
- `79_` `check:stories` exit 0 (153 files, 0 violations) · `80_` `check:surface-census:changed` exit 0 (0 new, 0
  stale) · `81_` `npm run build` exit 0 · `82_` `check:file-integrity` — flags only itself (self-referential
  capture artifact: the transcript file is created before the run that scans it completes; a direct
  `ReadAllBytes` scan of every git-changed/untracked path, redone after, found zero BOM/NUL across the whole
  tree) · `83_` `check:mojibake` exit 0 (0 artifacts, 5060 files) · `85_`–`89_` final `diff --stat` (5 files
  changed: script wiring +2/+2 lines exactly, the two comment files comment-only, the probe file empty diff) ·
  `90_` final `hash-object`.

### Files changed (final)

| Path | Hash |
|---|---|
| `scripts/check-card-track-monotonicity.mjs` | `b4c307e0539432f75046a2000a76b82ce4886e8e` |
| `docs/storybook-governance.md` | `08096eacbce5f27fbaf8abbacb1a5c255068da1a` |
| `docs/backlog.md` | updated in this same response (hash captured after) |
| `docs/sessions/2026-09-16-task815-card-track-monotonicity-gate.md` (this file) | updated in this same response |
| `docs/sessions/evidence/task815/57_mutation-probe.mjs` | `bef89ed55f765b19aee88876a9043f28e45c5078` |
| `docs/sessions/evidence/task815/62_probe-render-phase.mjs` | `a4b40d0cb9d28586a3aa7b9e520cfe4720a15f3d` |

`package.json`, `.github/workflows/governance-pr.yml`, `MantineListingCardTrack.module.css`,
`_MantineStoryShell.tsx` are Rev 0's accepted, unchanged work (§16.4/§17 carried them forward).

### Acceptance criteria

- **AC12-R2** — `62_probe-render-phase.txt` has all required fields; session log states Route A (above); the
  script implements exactly that route (`waitForRenderPhase`, quoted above); `65_`/`75_` list the same 16
  in-scope stories as `23_`.
- **AC7-R1** — `77_` arms (b)/(c) print the produced width then exactly the required failure strings
  (`1023px->1024px measure 3->2`, `1279px->1280px measure 4->3`); `git grep -n "plantedValue"` returns no hit.
- **AC11** — `63_`/`64_`: mutated `--verify-gate` exits 1, arms (b)/(c) `FAILED`, hashes identical.
- **AC13-R2** — `77_` arm (d): `✅ Arm (d) PASS — runGate returned exit 1 and printed the cannot see: line.`;
  `git grep -n "force-bad-selector" -- scripts/` returns no hit.
- **AC15** — arms (b)/(c) print `measure 3->2` / `measure 4->3` as the parsed values; source lines 539-547
  (`check-card-track-monotonicity.mjs`) show the `measureAfter < measureBefore` check.
- **AC4, AC6, AC7, AC10** — re-captured: `75_` (AC4/AC6), `77_` (AC7), `docs/storybook-governance.md` §15.10
  (AC10, Mechanism/verify-arms/Cannot-see paragraphs updated for Route A).

### Deviations / limitations

- The `evaluateSweep` width-tracking bugfix above was not named by the kickoff; fixed because it blocked
  AC7-R1's required exact-text evidence and is squarely inside the function the kickoff asked to be exercised
  faithfully.
- `check:file-integrity`'s two self-referential FAILs (`60_`/`82_`) are capture artifacts of redirecting a
  command's own output into a file the same command then scans — not real corruption; verified by a direct
  byte-level scan of every changed/untracked path after each occurrence.
- CI wall-clock time for the two new steps is `UNKNOWN` — no CI run available this session.

### Opus handoff

**Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.** Please independently re-run
`npm run check:card-track-monotonicity` and `npm run check:card-track-monotonicity:verify` against a fresh
`npm run build-storybook`, and independently inspect the `evaluateSweep` width-tracking fix
(`scripts/check-card-track-monotonicity.mjs:340`) since it was not named by the kickoff.
