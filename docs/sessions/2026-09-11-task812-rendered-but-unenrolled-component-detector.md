# Task 812 — Rendered-But-Unenrolled Component Detector

Sprint 75 · P0 · Q4 · Executor session 2026-09-11 (Sonnet) · **Revision 1, three passes, same day**

Status: **`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`** (kickoff §14.8's own rule: this status applies "when R14
and R16-R19 all land" — they have, per the third pass below. R10-R13 and R15 were already `VERIFIED` by the
Revision-0/first-two-passes review; this pass executed R14 and R16-R19 now that the owner answered §14.6 in the
sprint file. Do not self-approve — Opus alone issues the verdict, per §14.8's own instruction.)

## Revision 1 — what changed and why

**Evidence gap, disclosed:** the updated kickoff (`tasks/Sprints/Sprint_75_kickoff_prompt_Task_812_…md`) references
a "Revision 1 review" at §14 (with subsections §14.2, §14.4, §14.6 and requirements R10-R14, AC4-R, AC7-R, AC8-R)
and its own git handoff at §15, throughout the amended R4/R6/R7/R8 rows and the retracted GR-4 audit note. **Neither
§14 nor §15 exists in the file as read this session** (`wc -l` confirms it ends at line 255, mid-§13). I could not
safely infer their exact required wording (AC4-R/AC7-R/AC8-R's precise text, R14's CI-wiring scope, or "owner
decision 3"'s content) and did not guess at it.

What I *could* act on: `docs/backlog.md`'s Sprint 75 row was updated on disk (2026-09-11, same session) with the
Revision-0 review's actual verdict — `812 NEEDS REVISION`, naming four concrete defects and stating explicitly none
of them needs the owner's sequencing decision. That row supplied the substance §14 should have; I fixed all four
against it, verified independently against the code and the file itself, not assumed from the row's prose:

1. **Tier-2 component silenced through the allowlist.** `AppImage.tsx` (`src/components/ui/AppImage.tsx`) was
   allowlisted with a reason/owner, but it resolves under `src/components/ui/*` — 16d tier 2, whose required fix is
   removing the import, not excusing it with a reason. **Fixed:** removed from
   `scripts/rendered-scope-allowlist.json`; added R10 to `check-rendered-scope.mjs` — an allowlist entry whose path
   starts with `src/components/ui/` is now its own failure category (`allowlist entries — tier-2 path, allowlist is
   tier-3 only`), never honoured even with a valid reason/owner. Probed with a deliberate tier-2 entry: rejected as
   invalid AND `AppImage.tsx` still reported as a live `tier2-legacy-primitive` finding (not silenced) —
   `docs/sessions/evidence/task812/R1_tier2_invalid_probe.txt`. AC5's stale-entry path re-verified unaffected by the
   logic change — `R1_AC5_reprobe.txt`.
2. **R7/AC8's arm 2 claim was inaccurate.** The Revision-0 report's requirement table marked R7 "Done" against the
   literal text "with it restored the gate exits 0" — false on this tree (51 unrelated pre-existing edges keep the
   restored gate at exit 1). The AC2/AC3 evidence in that report was accurate about this (it said so in prose), but
   the top-line status row was not. **Corrected:** the requirement table below now states the plant proves the
   *specific planted edge* clears on restore, not that the whole gate goes green — which is what a two-armed plant
   can honestly claim on a tree with an independent, pre-existing, unrelated 51-edge frontier.
3. **Restore witnesses were two separate one-hash files with no captured `git status --porcelain` output.** Redone
   as one combined, retained transcript per witness, each showing the before-hash, the with-plant/probe result, the
   after-hash, and an explicit `git status --porcelain` line (empty output labelled `<empty — file matches HEAD, no
   diff>` rather than left implicit): `docs/sessions/evidence/task812/R1_AC1_manifest_witness.txt` (manifest,
   `9fdc9303c89d98d5e82f28e5ededb16f803924a3` before and after) and `R1_AC3_favoritesshell_witness.txt`
   (`FavoritesShell.tsx`, `087c45c5886c2d46645aef11f9ece4fe14a4a3f0` before and after).
4. **`docs/golden-rules.md` GR-1's `Command` block was rewritten without authorization.** R8 only authorized editing
   GR-1's Enforcement-status-table row and the "not yet built" sentence; the file's own header reserves any rule-body
   change to a dated owner decision, which does not exist for this. Revision 0 replaced GR-1's `Command` block
   (originally `check-surface-census.mjs --surface <file>`, a per-surface census) with `check-rendered-scope.mjs`
   (a whole-manifest walk) — a different tool that, per the review, "cannot census an in-scope surface that is not
   yet enrolled — the 809 case — nor produce GR-1's own per-surface receipt." **Reverted verbatim to the original
   block.** `check-rendered-scope.mjs` remains named only in the Enforcement-status table (in scope per R8) as what
   Task 812 actually built — a distinct, complementary check, not a replacement for the per-surface census GR-1
   still needs and that this task never built.

## Requirement / AC evidence (Revision 1)

| ID | Status | Evidence |
|---|---|---|
| R1 (walk enrolled subgraph) | Done | `scripts/check-rendered-scope.mjs`; 38/38 manifest roots walked, `docs/sessions/evidence/task812/10.1_report.txt` |
| R2 (rendered-only reporting) | Done | AC2, AC3 below |
| R3 (tier1/tier2 reason codes) | Done | AC1, `10.1_report.txt` |
| R4 (allowlist, reason+owner, stale detection) — **R10: tier-3 only, tier-2 rejected** | Done | AC4 (corrected), AC5, R10 probe |
| R5 (scope line) | Done | AC6 |
| R6 (CI wiring) | **Not done — blocked**, `package.json` half done | See "Why this is blocked" |
| R7 (two-armed plant) | Done, claim corrected | AC1, AC3, combined witnesses (below) |
| R8 (docs updated, Enforcement-status table only) | Done, GR-1 `Command` block violation reverted | `docs/golden-rules.md`, `docs/storybook-governance.md` §15.5 |
| R9 (check:story-coverage unchanged) | Done | AC10 |
| R10 (allowlist rejects tier-2 paths) | Done | `R1_tier2_invalid_probe.txt` |

| AC | Result |
|---|---|
| AC1 | With `CollectionsSection.tsx` removed from the manifest, `check:rendered-scope` exits 1 and names exactly `src/modules/listings/components/FavoritesShell.tsx -> src/modules/listings/components/CollectionsSection.tsx  [tier1-unenrolled]`. `docs/sessions/evidence/task812/AC1_plant_arm1.txt`, re-confirmed `R1_AC1_manifest_witness.txt`. |
| AC2 | `FavoritesShell.tsx`'s five non-rendered imports (`useFavoritesRealtime`, `useExchangeRate`, `useAuth`, `theme`, `type CollectionWithCount`) appear nowhere in `10.1_report.txt` (grep, zero matches). All five fall into the single "non-rendered local imports skipped" counter (155 total across all 38 roots this run) — four as value imports never used as a JSX tag, one (`CollectionWithCount`) as a type-only import; unified bucket, documented in the scope line's label. |
| AC3 | `docs/sessions/evidence/task812/R1_AC3_favoritesshell_witness.txt` — combined: before-hash `087c45c5886c2d46645aef11f9ece4fe14a4a3f0`, probe present → `ListingReportDialog` appears only via its two genuine edges (`ListingDetailView.tsx`, `ListingContact.tsx`), never `FavoritesShell.tsx`, after-hash identical, `git status --porcelain` explicit empty. |
| AC4 (corrected — original AC4 named `AppImage.tsx`, a tier-2 misclassification) | Allowlist holds `ListingFeatureIcon.tsx` and `FavoriteButton.tsx` only (owner `813`, tier-3, both genuinely shared across ≥2 enrolled surfaces). Neither appears in a FAIL block; scope line reports `Allowlisted edges: 4` (2 paths × 2 call sites). `AppImage.tsx` correctly reports as a live `tier2-legacy-primitive` finding. `docs/sessions/evidence/task812/R1_10.1_report_corrected_allowlist.txt`. |
| AC5 | Re-verified after the R10 logic change: a 3rd entry pointed at a nonexistent path → `FAIL 1 stale rendered-scope-allowlist.json entry(ies)` naming it exactly; removed, allowlist restored to the 2-entry form. `docs/sessions/evidence/task812/R1_AC5_reprobe.txt`. |
| AC6 | Every run prints: enrolled roots walked, local import edges resolved, non-rendered imports skipped, allowlisted edges, barrel hops unwrapped, barrel edges left unresolved, and an explicit "Cannot see: dynamic import() and React.lazy()" line. `10.1_report.txt`. |
| AC7 | **Not satisfied.** `npm run check:rendered-scope` / `:report` in `package.json`. **Not added to `.github/workflows/governance-pr.yml`** — R14/"owner decision 3" content unavailable this session (see Revision 1 note above); CI wiring stays withheld for the same reason Revision 0 withheld it. |
| AC8 (corrected claim — the original "the gate exits 0" wording is not achievable on this tree; see Revision 1 note above) | Both arms retained in one combined witness each: `R1_AC1_manifest_witness.txt` (manifest: hash `9fdc9303c89d98d5e82f28e5ededb16f803924a3` before and after, explicit empty `git status --porcelain`, arm 1 names the planted edge, arm 2's only `CollectionsSection` mention is the separate pre-existing `CollectionsSection -> MantineModal` edge — the planted edge is absent, i.e. cleared) and `R1_AC3_favoritesshell_witness.txt` (same shape for the AC3 probe). |
| AC9 | `docs/golden-rules.md` GR-1 **Enforcement-status table row and closing paragraph only** describe the actual landed state (built, proven, not CI-wired). GR-1's `Command` block is **unchanged from its pre-812 original** (per R8/R12 — see Revision 1 note). `docs/storybook-governance.md` §15.5 describes the gate and now also states R10's tier-3-only allowlist rule. |
| AC10 | `npm run check:story-coverage` on the fully-restored tree: `38 covered / 0 unproven`, exit 0. `docs/sessions/evidence/task812/R1_check-story-coverage.txt`. |

## §10.1 frontier census (full listing, measured on the current tree — restored, no plant active)

```
Enrolled roots walked: 38 (of 38 manifest entries)
Local import edges resolved: 252
Non-rendered local imports skipped (hooks/utils/consts/context/type-only): 155
Allowlisted edges (tier3, owner-filed): 0   [measured before the allowlist file existed]
Barrel hops unwrapped (single-hop, index.ts/tsx re-export): 26
Barrel edges NOT unwrapped (reported at the barrel file itself): 0
tier1-unenrolled: 54 edges
tier2-legacy-primitive: 3 edges
```

Full edge listing: `docs/sessions/evidence/task812/10.1_report.txt` (raw, no allowlist). After the **corrected**
2-entry `813`-owned allowlist (`ListingFeatureIcon.tsx`, `FavoriteButton.tsx` — `AppImage.tsx` removed per defect 1
above), the gate fails on **50 tier1-unenrolled + 3 tier2-legacy-primitive = 53 unresolved edges** —
`docs/sessions/evidence/task812/R1_final_gate.txt`. (The Revision-0 report's "51" figure reflected the since-fixed
3-entry allowlist that incorrectly silenced `AppImage.tsx`; 53 is the corrected, current number.)

## Why this is blocked (kickoff §5 `CONFLICT`, not an executor judgement call)

The kickoff states explicitly: *"if the measured frontier is large enough that an honest allowlist would run to
dozens of entries, that is an owner decision about migration sequencing, not an executor judgement. Report the
census and stop for `BLOCKED — OWNER DECISION REQUIRED` rather than allowlisting in bulk to make the gate green."*

The measured frontier is 57 edges, of which only 4 (backing 2 unique tier-3 paths — `ListingFeatureIcon.tsx`,
`FavoriteButton.tsx`) are correctly allowlist-eligible under R10's tier-3-only rule; Task 813's third named node,
`AppImage.tsx`, is tier-2 and is **not** allowlist-eligible — its fix is removing the import, which is a genuine
code change outside this detector task's scope. **53 edges remain unresolved**, spanning components most enrolled
surfaces render — including several `src/design-system/mantine/patterns/*` pattern components (`MantineDrawer`,
`MantineModal`, `MantineCombobox`, `MantineCountButton`, `MantineFilterSection`, `MantineListingCardPattern`, etc.)
that are canonical Mantine building blocks not individually enrolled in the manifest, alongside genuine unmigrated
feature components (`ListingReportDialog`, `ListingInquiryDialog`, `GalleryIsland`, `SimilarListings`, `MapWrapper`,
`ViewTracker`, `RecentlyViewedTracker`, `PropertyTypeCombobox`, `LocaleSwitcher`, `CaptchaWidget`, `PhoneField`,
`YearCombobox`, `FilterRangeInputs`, `FilterChoiceGroup`, `FilterRoomsRow`, `ViewAllLink`, `ListingsActionRow`,
`ListingShareButton`) and two tier-2 legacy-primitive imports (`AppImage.tsx` ×2 call sites,
`PasswordRequirementsHint.tsx` ×1).

Whether the Mantine pattern-library components are a systematic tier-3 class (shared canonical building blocks,
not per-surface features — plausible but not this executor's call) or should individually join the manifest, and
how to sequence migrating or allowlisting the 53 remaining edges, is exactly the sequencing decision the kickoff
reserves to the owner. Wiring the currently-failing gate into the CI `governance` job (R6/AC7) would block every
unrelated PR until that decision is made and acted on, so it was not done.

**What the owner needs to decide:** (1) classification of the `design-system/mantine/patterns/*` cluster —
systematic tier-3 allowlist entries, or individual manifest enrollment; (2) sequencing/ownership for the
remaining genuine tier-1 feature components and the one additional tier-2 legacy import
(`AuthSheet.tsx -> PasswordRequirementsHint.tsx`); (3) whether to CI-wire `check:rendered-scope` now in
report-only/non-blocking form versus after the frontier is resolved.

## Files Changed

| Path | Reason |
|---|---|
| `scripts/check-rendered-scope.mjs` | Detector (R1-R5, R9); Revision 1 adds R10 (allowlist rejects tier-2 paths) |
| `scripts/lib/import-resolver.mjs` | `resolveImportSpecifier`/`extractImportSpecifiers` extracted from `check-story-coverage.mjs`, shared by both scripts (R9) |
| `scripts/check-story-coverage.mjs` | Refactored to import the shared resolver; verified output byte-for-byte unchanged (`38/0`, exit 0) |
| `scripts/rendered-scope-allowlist.json` | **Revision 1: `AppImage.tsx` removed** (tier-2 misclassification, defect 1) — now 2 tier-3 entries (`ListingFeatureIcon`, `FavoriteButton`), owner `813` |
| `package.json` | Added `check:rendered-scope` / `check:rendered-scope:report` scripts |
| `docs/golden-rules.md` | GR-1 Enforcement-status row + closing paragraph updated to the actual landed/blocked state. **Revision 1: `Command` block reverted to its pre-812 original** (defect 4 — Revision 0's rewrite was unauthorized) |
| `docs/storybook-governance.md` | New §15.5 describing the gate; Revision 1 adds the R10 tier-3-only allowlist rule to it |
| `docs/backlog.md` | Sprint 75 line: 812 status tracked there by the orchestrator across revisions (not re-edited this pass beyond what was already current on disk) |
| `docs/sessions/evidence/task812/*` | Retained transcripts for every command and both plant arms; Revision 1 adds `R1_*` files, including the two combined restore witnesses (defect 3) |

**Not changed:** `.github/workflows/governance-pr.yml` (R6/R14 still blocked — see Revision 1 note; CI-wiring scope
was not available this session). `scripts/mantine-migration-scope.json` and `src/modules/listings/components/FavoritesShell.tsx`
are back at their original content (both plants fully reverted, hash-verified — see the combined witnesses).

**Pre-existing, unrelated to this task, left untouched:** `docs/component-catalog.md`, `docs/performance.md`,
`src/components/ui/AppImage.tsx`, `src/lib/imageDelivery.ts`,
`src/modules/listings/components/RecentlyViewedSection.tsx` were already modified and uncommitted at session
start (visible in `git status` before any work here). None of them was touched this session.

## Validation evidence

Revision 0 (§10.2, full block): typecheck 0, eslint 0 errors, `check:story-coverage` 38/0 exit 0, `check:rendered-scope`
exit 1 (real, expected), `check:stories` 0 violations, `build` exit 0, file-integrity 0, mojibake 0 — transcripts
`10.2_*.txt`.

Revision 1 (re-run after the R10 code change and the allowlist correction, since both touched files typecheck/lint
covers and files hygiene gates cover):

| Command | Exit | Transcript |
|---|---|---|
| `npm run typecheck` | 0 | `R1_typecheck.txt` |
| `npm run check:story-coverage` | 0, `38 covered / 0 unproven` | `R1_check-story-coverage.txt` |
| `npm run check:rendered-scope --report` (corrected 2-entry allowlist) | 0 (report mode always exits 0) | `R1_10.1_report_corrected_allowlist.txt` — tier1 dropped 54→50 vs. the raw census, tier2 correctly shows `AppImage.tsx` live (3 edges), allowlisted edges = 4 |
| `npm run check:rendered-scope` (R10 probe: deliberate tier-2 allowlist entry) | 1 | `R1_tier2_invalid_probe.txt` — rejected as invalid, `AppImage.tsx` still reported live |
| `npm run check:rendered-scope` (AC5 re-probe: stale entry, post-R10) | 1 | `R1_AC5_reprobe.txt` — stale detection unaffected by the R10 change |
| `npm run check:rendered-scope` (final, corrected 2-entry allowlist) | 1 — expected/correct, 53-edge unresolved frontier | `R1_final_gate.txt` |
| `npm run check:file-integrity` | 0, 42 then 46 files clean (grew as evidence files were added) | `R1_file-integrity.txt`, `R1_final_file-integrity.txt` |
| `npm run check:mojibake` | 0 | `R1_mojibake.txt`, `R1_final_mojibake.txt` |

`npm run build`, `npx eslint`, `check:stories` not re-run in Revision 1 — no `src/app`/lint-scoped file changed
since Revision 0's green run (only `scripts/check-rendered-scope.mjs`, `scripts/rendered-scope-allowlist.json`,
`docs/*`, `docs/sessions/evidence/task812/*` changed, none of which those three gates re-check differently).

All evidence transcripts verified BOM-free (`head -c3 | xxd` on a sample; `check:file-integrity` itself also
covers this for every touched file, including the new `R1_*` transcripts).

## Assumptions, deviations, limitations

- Kept the kickoff's §5 assumptions (new standalone script; allowlist shape `{path, reason, owner}`) — both
  proved workable.
- **Deviation from R6/AC7, justified above:** CI wiring withheld pending the owner's sequencing decision.
- **Barrel-hop behavior (negative-flow table), measured, not assumed:** the shared resolver alone would report a
  barrel file (`design-system/mantine/patterns/index.ts`) as the frontier candidate for anything imported through
  that barrel. `check-rendered-scope.mjs` adds a single-hop unwrap (parses the barrel's `export { X } from '<spec>'`
  declarations and follows the matching one) that `check-story-coverage.mjs` does not have and was not asked to
  gain (R9) — 26 edges were unwrapped this way this run, 0 left unresolved at the barrel itself.
- Limitation stated by the gate itself: dynamic `import()` and `React.lazy()` are not statically resolved.
- Limitation: barrel unwrapping is single-hop; a barrel re-exporting from another barrel would not be followed
  further (not observed in this tree — 0 `barrelUnresolved` edges this run).

## Revision 1, second pass — R13/R15 (kickoff §14, now present in the file)

The kickoff's own §14/§15 (missing when this session first ran) are now on disk, written by the orchestrator's
review. They confirm R10/R11/R12 (Revision 1's first pass, above) as `DONE`/`VERIFIED`, and record R13 and R15 as
`OPEN — executable`, plus R14 as `OPEN — blocked on §14.6 decision 3` (three owner decisions, none of which this
session selects). This pass executes R13 and R15 only.

**R13 — AC13, `VERIFIED`.** `scripts/check-rendered-scope.mjs` dropped two unused imports: `statSync`
(`node:fs`) and `extractImportSpecifiers` (`./lib/import-resolver.mjs`) — neither was referenced anywhere in the
file body (grep-confirmed before and after). The "one entry per edge" phrase, which contradicted the implemented
path-keyed semantics, is corrected in both named locations: `scripts/check-rendered-scope.mjs`'s header comment
(now: allowlist is "keyed by component PATH (not by edge)... one entry excuses every importing/rendering call
site... stays non-stale as long as at least one such edge still exists") and `docs/storybook-governance.md`
§15.5's matching bullet. `node.exe --check scripts/check-rendered-scope.mjs` → silent, exit 0.

**R15 — AC14, `VERIFIED`.** All 8 named transcripts exist under `docs/sessions/evidence/task812/`, BOM-free
(`check:file-integrity` covers every one), on the post-R13 tree:

| Transcript | Result |
|---|---|
| `R1_final_typecheck.txt` | exit 0 |
| `R1_final_eslint.txt` | exit 0 (3 ignored-file warnings, `scripts/` is eslint-ignored repo-wide, 0 errors) |
| `R1_final_story-coverage.txt` | `38 covered / 0 unproven`, exit 0 |
| `R1_final_gate.txt` | exit 1 — `tier1-unenrolled (50)`, `tier2-legacy-primitive (3)` — expected/correct, unresolved frontier unchanged by R13 |
| `R1_final_stories.txt` | `144 files checked, 0 violations`, exit 0 |
| `R1_final_build.txt` | exit 0 |
| `R1_final_file-integrity.txt` | `59 file(s) clean`, exit 0 |
| `R1_final_mojibake.txt` | `0 artifacts in 4258 files`, exit 0 |

`R1_final_report.txt` (the `--report` run) additionally confirms `Allowlisted edges (tier3, owner-filed): 4` and
`Barrel hops unwrapped: 26`, matching §14.7's expected shape exactly. `R1_final_env.txt` records `win32` /
`v22.22.3`; `R1_final_git_status.txt` records `git --no-optional-locks status --short` (it ran fine this
session — §15's note that the bridge couldn't mount the repo did not reproduce here).

**§14.1 forbidden-artifact check:** the five originals (`10.1_report.txt`, `AC1_plant_arm1.txt`,
`AC1_plant_arm2_restored_report.txt`, `AC3_probe_report.txt`, `AC4_gate_with_allowlist.txt`) were not re-run or
overwritten this pass — `ls -la` timestamps confirm all five are still 11:28-11:30 (the original Revision-0
run), and `git status --porcelain -- docs/sessions/evidence/task812/` shows no tracked-modified (`M`) entries.
**Caveat, stated plainly:** the directory itself is still untracked (`??`) in git — it was never committed — so
`git status` cannot distinguish "unmodified since commit" for individual files within it the way §14.8 phrases the
check; the timestamp evidence is what actually establishes non-modification here.

**§14.6 — not answered, not this session's call.** Decisions 1-3 (the `design-system/mantine/patterns/*`
cluster's classification, GR-1's compliance command, and CI host/mode for `check:rendered-scope`) remain open in
`tasks/Sprints/Sprint_75_The_Gates_That_Report_Green_On_What_They_Cannot_See.md`, per the kickoff's own
instruction that no option may be selected by an executor or reviewer. R14 stays `OPEN — blocked`.

**Status per §14.8:** R13 and R15 both landed; §14.6 is still open → `PARTIALLY IMPLEMENTED` (the kickoff's own
rule: "`PARTIALLY IMPLEMENTED` when R13 and R15 land while §14.6 is still open. `BLOCKED` is not available while
R13 and R15 remain executable" — they no longer do, so `BLOCKED` is correctly retired as this pass's status).

## Opus handoff

- Independently re-run `docs/sessions/evidence/task812/10.1_report.txt`'s producing command
  (`node scripts/check-rendered-scope.mjs --report`) against the restored tree and confirm the raw 54 tier1 + 3
  tier2 = 57-edge count (unaffected by the allowlist fix, since it's pre-allowlist); then re-run
  `npm run check:rendered-scope` with the corrected 2-entry allowlist and confirm 50 tier1 + 3 tier2 = 53 remain.
- Verify both combined restore witnesses reproduce: `R1_AC1_manifest_witness.txt` (manifest plant) and
  `R1_AC3_favoritesshell_witness.txt` (type-only-import probe).
- Verify `docs/golden-rules.md` GR-1's `Command` block is byte-identical to what it was before this task's first
  Revision-0 edit (it should read `check-surface-census.mjs --surface $surface`, a script this task never built).
- **Missing kickoff content, needs closing regardless of the outcome below:** `tasks/Sprints/Sprint_75_kickoff_prompt_Task_812_…md`
  ends at line 255/§13 in the version read this session; it references §14 (Revision 1 review — R10-R14, AC4-R,
  AC7-R, AC8-R) and §15 (Revision 1's own git handoff) throughout, but neither section is present in the file.
  This session worked from `docs/backlog.md`'s Sprint 75 row instead, since that carried the actual Revision-0
  review verdict. If §14/§15 exist elsewhere (a sync gap) they should be reconciled into the kickoff file; if they
  were never written, the kickoff needs them before "owner decision 3" and R14's CI-wiring scope can be resolved
  by anyone, executor or reviewer.
- The remaining open question is unchanged from Revision 0: not implementation correctness (the four named defects
  are fixed and re-evidenced), but the scope/sequencing decision for the 53-edge frontier before CI wiring. Still
  not this session's call to make.

## Revision 1, third pass — R14, R16-R19 (owner decisions 1a/2a/3a recorded 2026-09-11)

The owner answered all three §14.6 decisions in `tasks/Sprints/Sprint_75_The_Gates_That_Report_Green_On_What_They_Cannot_See.md`
and the kickoff (§14.6.1-14.6.5): **1a** — systematic tier-3 allowlist for the shared
`design-system/mantine/patterns/*` cluster, owned by Task 816; **2a** — build the real per-surface GR-1 command as
Task 817; **3a** — wire `check:rendered-scope` into the `governance` job as a temporary advisory
(`continue-on-error: true`) step with a mandatory enforcement exit, Task 818. This pass executes R14 and R16-R19,
the only requirements those decisions unblocked.

**Freshness check first (kickoff's explicit instruction).** Re-ran `node scripts/check-rendered-scope.mjs --report`
before writing anything. The live census matched §14.6.1's corrected table exactly: 11 pattern paths, 23 rendered
edges (`MantineCombobox` 4, `MantineCopyIdButton` 1, `MantineCountButton` 4, `MantineDrawer` 4,
`MantineDropdownMenu` 1, `MantineListingCardPattern` 1, `MantineListingContactPattern` 1,
`MantineListingDetailPattern` 1, `MantineModal` 3, `MantinePagination` 1, `RangeDatePicker` 2). No drift — proceeded
with the table as given.

**R16 (`AC15`, `VERIFIED`).** Added exactly 11 literal entries to `scripts/rendered-scope-allowlist.json`, one per
§14.6.1 path, each `owner: "816"` with a durable reason citing the 2026-09-11 decision. No glob/prefix/directory
rule; `scripts/check-rendered-scope.mjs` itself untouched (`git diff --stat` empty — caveat: the file is untracked,
never committed, so this is a boundary-of-change check via inspection, not a committed-baseline diff). Result:
`npm run check:rendered-scope:report` → `tier1-unenrolled (27)`, `tier2-legacy-primitive (3)`,
`Allowlisted edges (tier3, owner-filed): 27`, no `design-system/mantine/patterns/` path anywhere under
`tier1-unenrolled` (grep-verified against the section specifically, not the whole file) — `R2_final_report.txt`.

**R17 (`AC15`/`AC16`, `VERIFIED`).** Post-R16 census matches exactly: 27/3/27, `check:rendered-scope` exit 1
(expected — the 27 non-pattern tier-1 + 3 tier-2 edges are real and unowned by this task). AC16 re-probe: temporarily
re-added `src/components/ui/AppImage.tsx` to the 13-entry allowlist → `FAIL 1 invalid rendered-scope-allowlist.json
entry(ies)` naming it, **and** `tier2-legacy-primitive` still reports 3 (not silenced) — `R2_AC16_reprobe.txt`.
Removed the probe entry; final allowlist is exactly 13 entries (2 owner-813 + 11 owner-816), confirmed by
`JSON.parse(...).length`.

**R14 (`AC7-R`, `VERIFIED`).** `.github/workflows/governance-pr.yml`'s `governance` job gained one step, immediately
after `check:story-coverage`:

```yaml
      - name: Story coverage gate (fail-on-new; exemption allowlist)
        run: npm run check:story-coverage

      - name: Rendered-but-unenrolled component scope gate (Task 812 — advisory, owner decision 3, 2026-09-11; not yet enforced, see docs/golden-rules.md GR-1)
        run: npm run check:rendered-scope
        continue-on-error: true

      - name: Design token strict gate (blocking — 0 unsuppressed raw values)
        run: npm run check:design-tokens:strict
```

`continue-on-error: true` is step-level only (not job-level), no `|| true` / `exit 0` / `set +e` wrapper hides the
real exit code, and the job name (`Governance Check`, id `governance`) plus the full step were verified by parsing
the YAML with `js-yaml` (not just eyeballing indentation) — the parsed step object came back exactly
`{ name: "Rendered-but-unenrolled component scope gate...", run: "npm run check:rendered-scope", "continue-on-error": true }`
with the correct neighbors.

**R18/R19 (`AC17`, `VERIFIED` with one disclosed caveat).** `docs/golden-rules.md`'s GR-1 and GR-3
**Enforcement-status table rows and closing paragraph only** were rewritten to state the 2026-09-11 advisory
decision, that GR-1/GR-3 remain **not enforced**, and that Tasks 817/818 gate enforcement. GR-1's `Command` block
(§14.6.3) is untouched — confirmed byte-for-byte against R12's restoration. `docs/storybook-governance.md` §15.5's
"Status as landed" paragraph, stale since R14 (it said "not yet wired into CI"), updated to the current advisory
state — in scope per R8's original "§15 gains the new gate" authorization, not §14.6.3's GR-1-specific restriction.

**Caveat, disclosed rather than hidden:** AC17's literal grep (`GR-1 .*enforced|GR-3 .*enforced|R6 .*complete`)
matches 5 lines across `docs/golden-rules.md` and `docs/storybook-governance.md`, because the regex cannot
distinguish an affirmative claim from a negation on the same line. Every one of the 5 matches is a negation —
"GR-1 is still receipt-only, **not** enforced", "not enforced — gated on Tasks 817 and 818", "GR-1 and GR-3 are
still **not** enforced", "no artifact may describe this as... being enforced", "this is **not** GR-1 or GR-3 being
enforced". None claims GR-1 or GR-3 *is* enforced or that R6 is complete. Read manually to confirm this before
treating AC17 as literally zero-matches — it is not, and the grep's own limitation is worth fixing in a future
criterion of this shape (name the semantic property, not a substring pattern that can't see negation).

**R15/AC14 carried forward, re-verified on the final tree, not re-claimed from the first-pass transcripts.** Full
§14.7 block re-run and retained as `R2_final_*` (11 files: `env`, `git_status`, `check` (node --check),
`typecheck`, `eslint`, `story-coverage`, `report`, `gate`, `stories`, `build`, `file-integrity`, `mojibake` — the
`R1_final_*` set from the second pass is untouched, per the kickoff's explicit "do not overwrite" instruction).
All green: typecheck 0, eslint 0 errors, `check:story-coverage` 38/0, `check:rendered-scope` exit 1 with the
expected 27/3/27 shape, `check:stories` 0 violations, `build` exit 0, file-integrity 72 files clean, mojibake 0
artifacts in 4271 files. `R2_final_git_status.txt` shows exactly the expected new paths
(`.github/workflows/governance-pr.yml`, `scripts/rendered-scope-allowlist.json`) alongside the unchanged Task 812
set and the same pre-existing unrelated files.

**§14.1 forbidden-artifact re-check.** All ten protected files (the original 5 plus the 5 first-pass-named
`R1_*` artifacts §14.1's "Superseded within Revision 1" note also protects) confirmed unmodified by timestamp —
none newer than the pass that created it.

### Files changed, this pass only

| Path | Reason |
|---|---|
| `scripts/rendered-scope-allowlist.json` | R16: 11 new tier-3 entries added (owner 816); detector logic file itself untouched |
| `.github/workflows/governance-pr.yml` | R14: new advisory step in the `governance` job |
| `docs/golden-rules.md` | R19: GR-1/GR-3 Enforcement-status rows + closing paragraph only; `Command` block untouched |
| `docs/storybook-governance.md` | §15.5's landed-status paragraph updated to the advisory-CI state |
| `docs/backlog.md` | Sprint 75 row updated to record R14/R16-R19 |
| `docs/sessions/evidence/task812/R2_final_*` (11 files), `R2_AC16_reprobe.txt` | this pass's evidence |

### Opus handoff, this pass

- Re-run `node scripts/check-rendered-scope.mjs --report` and confirm the 27/3/27 split reproduces.
- Verify `.github/workflows/governance-pr.yml`'s new step against the quoted hunk above, and that
  `continue-on-error` is step-scoped.
- Read the 5 AC17-grep matches directly and confirm each is a negation (the caveat above explains why the literal
  grep can't do this itself).
- Confirm Tasks 816/817/818 (already filed by the orchestrator in `docs/backlog.md` and the Sprint 75 plan file)
  are the correct next kickoffs — none is executable from this kickoff.
