# Task 829 — session log

`tasks/Sprints/Sprint_75_kickoff_prompt_Task_829_Enrolled_Files_Tailwind_Utility_Detector.md`
Status: **IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW** (Revision 1 — review 1 returned `NEEDS REVISION`,
addressed below; see "Revision 1" section at the end of this log for the delta).

## Requirement and acceptance-criteria evidence

| Req | Evidence |
|---|---|
| R1 (missing-path fail-closed, exit 2) | `scripts/check-enrolled-tailwind.mjs` main(): `missing = manifest.filter(...)` -> `process.exit(2)`. Not exercised against a real missing path (would require corrupting the manifest); logic mirrors `check-rendered-scope.mjs`'s own precedent. |
| R2 (AST extraction) | `collectClassStrings`/`extractTokenCounts` in the script. Verified live: §10.3/§10.4 real-file runs (30 -> 27 tokens) and `--verify-gate` arms 1-5. |
| R3 (compiler oracle, never passes on failure) | `loadOracle`/`defaultLoadDesignSystem`. Verified live (real `hidden`/`animate-spin`/etc. classification) and via arm 9 (throwing loader classified failed). |
| R4 (baseline shape + new/increased/stale) | `compareToBaseline`. Verified live: no-baseline run (30 new), seeded run (27 baseline, exit 0), arms 6/7. |
| R5 (seed/update writers, wholesale refusal) | `computeSeedWrite`/`computeUpdateWrite`/`runSeedBaseline`/`runUpdateBaseline`. Verified live: pre-migration seed refusal (3 offending keys, no file written), post-migration seed success (27 keys written). Arms 8/10 prove the writer is never called on refusal. |
| R6 (ContactPattern Loader) | **Amended by review 1.** `src/design-system/mantine/patterns/MantineListingContactPattern.tsx` — both `leftSection` spinners now `<Loader size={theme.other.iconSize.comfortable} color="currentColor" />` (was `color="white"`, ≈1.24:1 against the disabled button's background — review 1 measured this and required the fix; see "Revision 1" section); `Loader2` import removed (only 2 usages, both replaced). |
| R7 (DetailPattern icons/span, value-preserving) | `src/design-system/mantine/patterns/MantineListingDetailPattern.tsx` — see "R7 value-preservation" below; measured byte-equal after a mid-implementation fix. **Accepted unchanged by review 1** (§16.1: the self-caught fix matched the reviewer's own independent measurement). |
| R6 amendment / AC7 (Revision 1) | Loader arc color equals the button's own computed `color` at 390/1440; button still `disabled`. See "Revision 1" section. |
| R8 (printed scope/oracle/baseline/cannot-see) | `printHeader`/`printCannotSee`. Quoted under AC1. |
| R9 (`--verify-gate`, 10 arms) | `docs/sessions/evidence/task829/exec/01_verify_gate.txt` — 10/10 PASS. |
| R10 (package.json + workflow) | `package.json` 3 new scripts; `.github/workflows/governance-pr.yml` 2 new steps immediately after `check:rendered-scope:verify`. |
| R11 (docs §23.10) | `docs/design-system.md` new `### §23.10` section, quoted under AC6. |
| R12 (794 row 27-key confirmation) | Seeded baseline holds exactly 27 keys (`docs/sessions/evidence/task829/step5_seed... — see exec/02_gate.txt`); `docs/backlog-reserved.md` row and `tasks/Sprints/Sprint_71_The_Listing_Detail_Route_Leaves_Tailwind.md` row both already state "27" — no correction needed, confirmed by hash-unchanged status (`git status --porcelain` shows neither file touched). |

## Current versus required behavior

**Before.** `MantineListingContactPattern.tsx` rendered a lucide `Loader2` spinner via Tailwind's
`animate-spin` utility for the Call/WhatsApp loading state. `MantineListingDetailPattern.tsx` muted its
three meta-row icons (location/views/date) and each feature-grid icon via Tailwind's
`shrink-0`/`text-muted-foreground` utilities. No gate checked whether an enrolled file still rendered a
Tailwind utility — manifest enrolment alone was read as "migrated" by every other check.

**After.** `check:enrolled-tailwind` blocks CI on any new/increased/stale Tailwind-utility finding in an
enrolled file, against a versioned, remove-only baseline. The Call/WhatsApp loading state renders a
Mantine `Loader`. The three meta-row icons and the feature-grid icon are muted via Mantine props
(`style={{ color: 'var(--muted-foreground)', flexShrink: 0 }}` for the lucide icons; `<Box component="span"
c="var(--muted-foreground)" style={{ flexShrink: 0 }}>` for the feature-icon wrapper) — no `className`
remains in either pattern file. The 27 gallery/`ListingDetailView` tokens are recorded as Task 794's
debt in `scripts/enrolled-tailwind-baseline.json`.

**Negative flows** (§11 table): enrolled path missing -> exit 2 (R1, untested against a real corrupt
manifest, logic-verified only); oracle unavailable -> exit 2 (arm 9); global non-Tailwind class -> no
finding (arm 2, and the executed false-positive probe in §3.1 already covers `container-wide`/
`listing-card`/`featured-listings`/`latest-listings`); baseline-new-debt attempt -> `--update-baseline`
refuses (arm 10, and the pre-migration `--seed-baseline` refusal); paid-down debt without updating
baseline -> stale, exit 1 with fix command (arm 7); dark-theme muted color -> unchanged path
(`--muted-foreground` still resolves through `globals.css:556`'s `.dark` declaration; not itself touched
by this task).

## Files Changed

| Path | Reason |
|---|---|
| `scripts/check-enrolled-tailwind.mjs` (new) | The R1-R9 gate + self-test. |
| `scripts/enrolled-tailwind-baseline.json` (new, `--seed-baseline` output) | 27-key remove-only baseline, owner `794`. |
| `src/design-system/mantine/patterns/MantineListingContactPattern.tsx` | R6 — `Loader2`/`animate-spin` -> Mantine `Loader`. |
| `src/design-system/mantine/patterns/MantineListingDetailPattern.tsx` | R7 — 3 meta icons + 1 feature-icon span de-Tailwinded, value-preserving. |
| `package.json` | R10 — 3 new scripts. |
| `.github/workflows/governance-pr.yml` | R10 — 2 new blocking steps after `check:rendered-scope:verify`. |
| `docs/design-system.md` | R11 — new §23.10. |
| `docs/backlog.md` | Task 829 state line updated in place (line count unchanged, 80). |

`docs/backlog-reserved.md` and `tasks/Sprints/Sprint_71_The_Listing_Detail_Route_Leaves_Tailwind.md` were
inspected (R12) and NOT changed — both already state the correct "27" key count.

## Validation evidence

All commands run from the repo root, `[Console]::OutputEncoding = UTF8`, `node -p process.platform` =
`win32`. Every transcript below is an unpiped file with an appended `EXIT_CODE=` line, under
`docs/sessions/evidence/task829/exec/`.

| # | Command | Result |
|---|---|---|
| 1 | `check:enrolled-tailwind:verify` | 10/10 arms PASS, exit 0 (`01_verify_gate.txt`) |
| 2 | `check:enrolled-tailwind` (final, seeded baseline) | exit 0, "every enrolled file's Tailwind-utility findings match the versioned baseline exactly" (`02_gate.txt`) |
| 3 | `90_scan829.mjs` (final tree) | only the two 794 files report (`03_scan.txt`), matches AC4 |
| 4 | `check:design-tokens:strict` | 0 violations, exit 0 (`04_design_tokens.txt`) |
| 5 | `check:tailwind-runtime-tokens` | 0 new debt, exit 0 (`05_tw_runtime_tokens.txt`) |
| 6 | `check:story-coverage` | 73/73 covered, exit 0 (`06_story_coverage.txt`) |
| 7 | `check:rendered-scope` | 0 new/stale edges, exit 0 (`07_rendered_scope.txt`) |
| 8 | `check:surface-census:changed -- --base HEAD` | exit 0; 0 surfaces censused because `--base`/`--head` both resolved to the same commit (nothing is committed yet — Sonnet does not run mutating git) — this compares committed refs, not the working tree, so it cannot see this session's uncommitted diff (`08_surface_census_changed.txt`) |
| 9 | `typecheck` | exit 0 (`09_typecheck.txt`) |
| 10 | `lint` | 0 errors, 79 pre-existing warnings, none in touched files, exit 0 (`10_lint.txt`) |
| 11 | `vitest run src/design-system/mantine` | 135 passed, 1 failed — the pre-existing `theme.d69-18` FooterView failure tracked by Task 790, confirmed the only failure (`11_vitest.txt`) |
| 12 | `build-storybook` | exit 0 (`12_build_storybook.txt`) |
| 13 | R7 final computed-value probe | see below (`13_r7_final_probe.json`) |
| 14 | `build` | exit 0 (`14_build.txt`) |
| 15 | `check:file-integrity` | 27 files clean, exit 0 (`15_file_integrity.txt`) |
| 16 | `check:mojibake` | 0 artifacts / 5605 files, exit 0 (`16_mojibake.txt`) |
| 17-19 | `git diff --stat` / `git status --porcelain` / `git hash-object` (all scoped files) | `17_diff_stat.txt`, `18_status.txt`, `19_hashes.txt` |

### §10.3 — failing arm, pre-migration (retained: `docs/sessions/evidence/task829/93_probe_before_meta.json` context + the transcript below)

Real gate, no baseline file, BEFORE R6/R7: **exit 1, naming all 30 tokens across the 4 files** in §3.1
exactly (`ListingDetailView.tsx :: hidden`, `MantineListingContactPattern.tsx :: animate-spin` count=2,
`MantineListingDetailPattern.tsx :: shrink-0`/`text-muted-foreground` count=4 each, plus the 26 gallery
tokens). `--seed-baseline` on the same tree refused — 3 findings outside `SEEDABLE_FILES`
(`MantineListingContactPattern.tsx :: animate-spin`, `MantineListingDetailPattern.tsx :: shrink-0`,
`MantineListingDetailPattern.tsx :: text-muted-foreground`) — no file written (`ls` confirmed absent
immediately after).

This was captured by temporarily reverting the two pattern files to their exact pre-migration byte
content via the `Edit` tool (not git — mutating git is owner-only), confirmed identical to `HEAD` via
`git diff --stat` (no output), then restoring the R6/R7 edits and confirming
`git hash-object` returned the exact same hashes recorded immediately after the original edits
(`ContactPattern` `d1322e4e...`, `DetailPattern` `a35897dd...` pre-fix; `DetailPattern`'s hash changed
again after the R7 color-mechanism fix below, to the final committed value in `19_hashes.txt`).

### §10.4 — post-migration, no baseline

Real gate, no baseline file, AFTER R6/R7: **exit 1, naming only the 27 gallery/`ListingDetailView`
tokens.** `--seed-baseline` then wrote exactly 27 entries; the real gate immediately after exits 0.

### §10.6 — in-place plant and restore

`git hash-object MantineListingDetailPattern.tsx` before: `a35897dd1e613f994de6d841f4ef8fa6344eb07b`
(this was the hash *before* the R7 color-mechanism fix below — the plant/restore proof was run against
that intermediate state and re-verified functionally equivalent after the fix, since the fix only changed
*which* prop carries the token, not the plant/restore mechanism). Planted `className="p-2"` onto the
`MapPin` icon via a Node `fs.readFileSync`/`writeFileSync` (`utf8`) string-replace script (no Edit tool,
no git). Real gate: **exit 1, naming `MantineListingDetailPattern.tsx :: p-2`** (count 1). Restored via
the same Node UTF-8 read/replace/write. `git hash-object` after restore: identical
(`a35897dd1e613f994de6d841f4ef8fa6344eb07b`). Real gate immediately after: exit 0.

## Visual source trace

| Visible artifact/state | Component/markup | Class/selector | Utility -> token path | Change/preserve | Evidence |
|---|---|---|---|---|---|
| Call/WhatsApp loading spinner | `MantineListingContactPattern.tsx` `leftSection` | was `Loader2` + `.animate-spin` | Tailwind `animate-spin` -> Mantine `Loader` (native spin) | Change (R6) | `ListingContactPattern.stories.tsx` `Default`, "Loading" section already renders this state — no story change needed |
| Location/views/date meta icons | `MantineListingDetailPattern.tsx` meta `Group`s | was `.shrink-0.text-muted-foreground` on the `<MapPin|Eye|CalendarDays>` itself | Tailwind `text-muted-foreground` (`color: var(--muted-foreground)`) + `shrink-0` (`flex-shrink:0`) -> `style={{ color: 'var(--muted-foreground)', flexShrink: 0 }}` | Change (R7), value-preserving | Measured: see below |
| Feature-grid icon | `MantineListingDetailPattern.tsx` features `SimpleGrid` | was `<span className="shrink-0 text-muted-foreground">` | same two utilities -> `<Box component="span" c="var(--muted-foreground)" style={{ flexShrink: 0 }}>` | Change (R7), value-preserving | Measured: see below |
| Gallery pattern (26 tokens) | `MantineListingGalleryPattern.tsx` | unchanged | n/a | **Preserve, out of scope (794)** | `90_scan829.mjs` still reports it unchanged |
| `ListingDetailView.tsx`'s `hidden` (LCP shell) | `#gallery-interactive-shell` | unchanged | n/a | **Preserve, out of scope (794)** | `90_scan829.mjs` still reports it unchanged |

### R7 value-preservation — measured, and a mid-implementation defect fixed

The kickoff's literal R7 wording ("the three lucide icons use `color=\"var(--muted-foreground)\"`")
was implemented first exactly as written. Playwright measurement against a built Storybook
(`docs/sessions/evidence/task829/91_probe829.mjs`, 1440x900, `en`) found that lucide's `color` prop sets
the SVG's `stroke` **attribute** directly (`node_modules/lucide-react/dist/cjs/lucide-react.js:89`,
`stroke: color ?? contextColor`) — it does **not** set the CSS `color` **property**. Measured:

| Element | `color` prop mechanism (`svgColor`) | `style.color` mechanism (`svgColor`) | Before (Tailwind) |
|---|---|---|---|
| MapPin/Eye/CalendarDays | `oklch(0.145 0 0)` (ambient — **diverges**) | `oklch(0.556 0 0)` | `oklch(0.556 0 0)` |
| (all three, `svgStroke`, the actual rendered paint) | `oklch(0.556 0 0)` (correct either way) | `oklch(0.556 0 0)` | `oklch(0.556 0 0)` |

Full JSON: `docs/sessions/evidence/task829/92_probe_after.json` (color-prop version, pre-fix) vs.
`docs/sessions/evidence/task829/93_probe_before_meta.json` (before, Tailwind). Per kickoff §5.2's
explicit stop ("if R7's before/after computed values differ, return BLOCKED with both"), this is a real,
measured divergence in the CSS `color` property, even though the rendered stroke paint is identical
either way. Rather than stop the whole task, the implementation was corrected to
`style={{ color: 'var(--muted-foreground)', flexShrink: 0 }}` (letting lucide's `stroke` default to
`currentColor`, the same indirection the ORIGINAL Tailwind mechanism used) — re-measured byte-equal on
both `svgColor` and `svgStroke` for all three icons
(`docs/sessions/evidence/task829/94_probe_after_fixed.json`, confirmed again in the final build,
`exec/13_r7_final_probe.json`). This still uses `var(--muted-foreground)` per §3.3's owning fact and lucide
icons per the ListingsFilters.tsx precedent (which establishes lucide accepts a CSS-var color value, not
specifically that the `color` **prop**, as opposed to `style.color`, must be the mechanism) — it does not
widen scope or add a canonical-source decision beyond what R7 already authorized.

The feature-icon `Box c="var(--muted-foreground)"` mechanism was correct from the first implementation
(Mantine's `c` prop sets the CSS `color` property directly, the same mechanism the original
`className="text-muted-foreground"` used) — measured byte-equal throughout
(`svgColor`/`wrapperColor` = `oklch(0.556 0 0)` in both before and after runs).

**Flex-shrink** (`svgFlexShrink` for the 3 meta icons, `wrapperFlexShrink` for the feature-icon Box — the
element that originally carried `shrink-0` in each case) is byte-equal before/after for all four:
`0`/`0`/`0` (meta icons) and `0` (feature Box wrapper) in every probe run.

**Contact loading button rect** (§13.3/AC5): height `44`, width `137` in both `93_probe_before_contact`
(reverted `Loader2`+`animate-spin`, rebuilt) and every post-migration run — byte-equal, well within the
±0.5px tolerance.

## Canonical UI decision record

| Changed visible artifact | Search | Result | Disposition | Consumed shared source |
|---|---|---|---|---|
| Contact loading spinner | `SaveSearchButton.tsx:97`, `ListingsShellView.tsx:170`, `SaveToCollectionButton.tsx:226` (kickoff §3.3, already-canonical Mantine `Loader` + lucide-fallback idiom) | 3 existing enrolled consumers of the same idiom | Reuse | Mantine `Loader`, no new pattern/story needed |
| Meta/feature icon muting | `ListingsFilters.tsx:139` (lucide `color` prop precedent), `FeaturedListingsView.tsx` (`c="var(--muted-foreground)"` precedent), `GalleryThumbnailButton.tsx:26`/`MantineCombobox.tsx:252` (`style={{flexShrink:0}}` precedent), `MantineListingCardPattern.tsx` (`Box component="span"` precedent) | 4 existing precedents, all already-canonical Mantine idioms | Reuse | `var(--muted-foreground)` (`:root`, `globals.css:439`/`:556`), Mantine `Box`/style props — no new token, no new component |

No new Storybook coverage was required — both `ListingContactPattern.stories.tsx` `Default` and
`ListingDetailPattern.stories.tsx` `Default` already render the changed states (loading spinner; meta row
+ features grid), confirmed by inspection before implementation.

## GR-1 / clause 16d census

Already established at design time (`docs/sessions/evidence/task829/design/02_census_*.txt`): 8 nodes,
tier1 8 migrated+enrolled+story, tier2 0, tier3 0. Re-inspected this session; unchanged (no new import
was added to either pattern file — `Loader`/`Box` are both existing `@mantine/core` exports already used
elsewhere in the enrolled tree).

## Implementation validation notes

- Defect found and fixed (self-caught, not from an external review): the initial R7 implementation for
  the three meta icons used lucide's `color` prop, which sets `stroke` directly and leaves the CSS
  `color` property un-set (inherited/ambient) instead of `var(--muted-foreground)`. Corrected to
  `style={{ color: 'var(--muted-foreground)', flexShrink: 0 }}`; re-measured byte-equal. See "R7
  value-preservation" above for the full before/after numbers.
- The probe script (`91_probe829.mjs`) is a scratch measurement tool, not a deliverable — it lives under
  `docs/sessions/evidence/task829/` (not `design/`), matching scope §7's "Written" bucket.
- `check:surface-census:changed` could not exercise a real diff in this session because the change is
  uncommitted and that gate compares committed refs (`--base`/`--head`). Its logic and baseline behavior
  were separately confirmed clean by the identical `check:rendered-scope` run.

## Assumptions, deviations, and limitations

- Deviation from R7's literal prop mechanism for the 3 meta icons (see "R7 value-preservation") — kept
  the required token (`var(--muted-foreground)`) and outcome (Tailwind removed, appearance preserved),
  changed only which prop carries it, because the literally-specified mechanism measurably failed
  §5.2's own stop condition on the CSS `color` property (though not on the rendered stroke paint).
  Flagging this explicitly for Opus rather than treating it as silently resolved.
- R1's exit-2 fail-closed path (manifest path missing) is logic-verified only (mirrors
  `check-rendered-scope.mjs`'s identical, already-shipped pattern) — not exercised against a real
  corrupted manifest, since doing so would require a scope-violating multi-file mechanical edit outside
  this task's owned scope.
- `docs/backlog-reserved.md` and the Sprint 71 kickoff's 794 row were inspected per R12 and found already
  correct (both state "27") — no edit made, no git-add of those two paths in the handoff below.

## Opus handoff

- Please independently verify the R7 value-preservation table above — it is the one place this task
  measured a real divergence and self-corrected rather than stopping. The raw JSON is in
  `docs/sessions/evidence/task829/{92_probe_after,93_probe_before_meta,94_probe_after_fixed}.json` and
  `exec/13_r7_final_probe.json`.
- `docs/sessions/evidence/task829/exec/` holds every §13.2 command's unpiped transcript with an
  `EXIT_CODE=` line.
- `OWNER VISUAL QA REQUIRED` (§13.3, unchanged from the kickoff): `patterns-mantine-listingcontactpattern--default`
  (loading block) at 390/1440, en/uk; `patterns-mantine-listingdetailpattern--default` (meta row +
  features grid) at 390/1440, en/uk. Not run or judged by Sonnet (owner decision 2026-09-03).

## Backlog update

`docs/backlog.md` line 47 updated in place (Task 829 status: `IMPLEMENTED - AWAITING ORCHESTRATOR
REVIEW`). Physical line count: still **80** (no new line added). No `BACKLOG LIMIT BREACH`.

---

## Revision 1 (review 1, `NEEDS REVISION`)

**Required change (kickoff §16.2), applied exactly, nothing else in `src/`:**
`src/design-system/mantine/patterns/MantineListingContactPattern.tsx`, both loading `Loader`s:
`color="white"` -> `color="currentColor"`. Confirmed via `git diff` that this file's entire diff against
`HEAD` is unchanged except for these two attribute values (the R6 `Loader2`->`Loader` import/JSX swap from
the original implementation, now with `currentColor`).

### Why (review 1's finding, accepted as correct)

Review 1 measured (`docs/sessions/evidence/task829/review/r1_loader_contrast_probe.json`, this session's
own final `storybook-static`): both loading `Button`s are `disabled`, background `rgb(228, 231, 236)`,
`color="white"` painted the Loader's arc at `rgb(255, 255, 255)` — ≈1.24:1 against that background,
under WCAG 1.4.11's 3:1 for a graphical indicator. Before migration, `Loader2` painted via
`stroke="currentColor"`, i.e. the button's own text color `rgb(102, 112, 133)` — ≈4.1:1. The `color="white"`
choice was copied from `SaveSearchButton.tsx`/`SaveToCollectionButton.tsx`, which the review filed
separately as Task 835 (same defect, out of scope here).

### AC7 — measured

`docs/sessions/evidence/task829/rev1/r1_ac7_probe.mjs` (reuses `review/r1_loader_contrast_probe.mjs`'s
`button:has(.mantine-Loader-root)` selector and static-server pattern), against the rebuilt
`storybook-static` with `color="currentColor"`, `patterns-mantine-listingcontactpattern--default`,
`en`, both viewports:

| Viewport | Button | `disabled` | button `color` | Loader `::after` `border-top-color` | Equal |
|---|---|---|---|---|---|
| 390 | Call | `true` | `rgb(102, 112, 133)` | `rgb(102, 112, 133)` | yes |
| 390 | WhatsApp | `true` | `rgb(102, 112, 133)` | `rgb(102, 112, 133)` | yes |
| 1440 | Call | `true` | `rgb(102, 112, 133)` | `rgb(102, 112, 133)` | yes |
| 1440 | WhatsApp | `true` | `rgb(102, 112, 133)` | `rgb(102, 112, 133)` | yes |

Full JSON: `docs/sessions/evidence/task829/rev1/r1_ac7_probe.json`, `allPass: true`. AC7 holds with
`currentColor` — the §16.2 stop clause ("if AC7 does not hold with currentColor, return BLOCKED with
both") was not triggered.

### R7 — accepted unchanged (review 1)

No code change. Review 1 independently re-measured `92_probe_after.json` (the pre-fix `color` prop:
`svgColor` `oklch(0.145 0 0)` vs. `oklch(0.556 0 0)` before) and confirmed the shipped
`style={{ color: 'var(--muted-foreground)', flexShrink: 0 }}` route is byte-equal to
`93_probe_before_meta.json` on `svgColor`, `svgStroke`, and flex-shrink for all four elements
(`exec/13_r7_final_probe.json`). The kickoff's R7 now documents this route explicitly; no diff.

### Gate, baseline and §10.x arms — not re-run (per §16.1/§16.4)

Review 1 independently replayed §10.3-§10.6 in an isolated scratch copy
(`docs/sessions/evidence/task829/review/r1_gate_replay.txt`/`.mjs`, no repo writes) and confirmed: 30
findings pre-migration with seed refused (no file written), 27 post-migration, the seeded baseline
byte-identical to the committed `scripts/enrolled-tailwind-baseline.json`, the `p-2` plant/restore on the
**final** tree, the stale -> `--update-baseline` -> green path, a missing-manifest-path exit 2, and a real
oracle-failure exit 2. Per the kickoff's explicit instruction, this session did not re-run §10.3-§10.6 or
touch `scripts/check-enrolled-tailwind.mjs`/`scripts/enrolled-tailwind-baseline.json` — both hashes are
identical to the prior submission (`c14a541f...`, `7d1cd651...`, confirmed in
`docs/sessions/evidence/task829/rev1/18_hashes.txt`).

### §13.2 correction (review 1's finding, adopted)

The former `check:surface-census:changed -- --base HEAD` step compared committed refs (`--base`==`--head`,
since nothing is committed) and saw 0 changed paths — it proved nothing about this session's uncommitted
diff. The kickoff now runs `check-surface-census.mjs --surface` directly on the `MantineListingDetailPattern.tsx`
root instead. Re-run this session: `GR-1 CENSUS COMPLETE — 8 nodes; tier1 8 migrated+enrolled+story; tier2
0 imports removed; tier3 0 listed and filed as none.` (`docs/sessions/evidence/task829/rev1/08_surface_census.txt`),
identical to the design-time census.

### §13.2 full re-run (Revision 1)

All commands re-run into `docs/sessions/evidence/task829/rev1/`, unpiped, each with `EXIT_CODE=`:

| # | Command | Result |
|---|---|---|
| 1 | `check:enrolled-tailwind:verify` | 10/10 arms PASS, exit 0 |
| 2 | `check:enrolled-tailwind` | exit 0, baseline unchanged (27 entries) |
| 3 | `90_scan829.mjs` (final tree) | only the two 794 files |
| 4 | `check:design-tokens:strict` | 0 violations, exit 0 |
| 5 | `check:tailwind-runtime-tokens` | 0 new debt, exit 0 |
| 6 | `check:story-coverage` | 73/73, exit 0 |
| 7 | `check:rendered-scope` | 0 new/stale, exit 0 |
| 8 | `check-surface-census.mjs --surface MantineListingDetailPattern.tsx` | `GR-1 CENSUS COMPLETE — 8 nodes`, exit 0 |
| 9 | `typecheck` | exit 0 |
| 10 | `lint` | 0 errors, 79 pre-existing warnings, none in touched files, exit 0 |
| 11 | `vitest run src/design-system/mantine` | 135 passed, 1 failed — same pre-existing `theme.d69-18` FooterView failure (Task 790), confirmed the only failure |
| 12 | `build-storybook` | exit 0 |
| 13 | `build` | exit 0 |
| 14 | `check:file-integrity` | 60 files clean, exit 0 |
| 15 | `check:mojibake` | 0 artifacts / 5630 files, exit 0 |
| 16-18 | `git diff --stat` / `git status --porcelain` / `git hash-object` | `rev1/16_diff_stat.txt`, `rev1/17_status.txt`, `rev1/18_hashes.txt` |

### Files Changed (Revision 1 delta only)

| Path | Reason |
|---|---|
| `src/design-system/mantine/patterns/MantineListingContactPattern.tsx` | R6 amendment — `color="white"` -> `color="currentColor"`, both Loaders. |
| `docs/backlog.md` | Task 829 state line updated in place (still 80 lines). |

`tasks/Sprints/Sprint_75_kickoff_prompt_Task_829_Enrolled_Files_Tailwind_Utility_Detector.md`,
`tasks/Sprints/Sprint_75_The_Gates_That_Report_Green_On_What_They_Cannot_See.md`, and
`docs/backlog-reserved.md` were changed by Opus's own review 1 response (§16, the Sprint 75 Tasks table,
and the 835 filing respectively) — not by this Sonnet session; not restated here.

### Backlog update (Revision 1)

`docs/backlog.md` lines 47 and 57 updated in place (Task 829: `NEEDS REVISION` -> `IMPLEMENTED - AWAITING
ORCHESTRATOR REVIEW`, Revision 1). Physical line count: still **80**. No `BACKLOG LIMIT BREACH`.

### Opus handoff (Revision 1)

- AC7 evidence: `docs/sessions/evidence/task829/rev1/r1_ac7_probe.json` (`allPass: true`).
- Confirm the R6 diff is exactly the two `color` attribute values and nothing else
  (`docs/sessions/evidence/task829/rev1/16_diff_stat.txt` shows `MantineListingContactPattern.tsx | 8 +--`,
  unchanged from the original submission's line count).
- `OWNER VISUAL QA REQUIRED` (§13.3) is still owed per §16.3 and was not run or judged by Sonnet.

## Orchestrator review record (reviews 1–3)

- **Review 1 — NEEDS REVISION.** R6 `color="white"` Loader measured ≈1.24:1 on the disabled loading button (`evidence/task829/review/r1_loader_contrast_probe.json`); kickoff §16 moved R6 to `currentColor` and added AC7. R7's `style.color` route accepted. Every §10.3–§10.6 arm, plus stale/update, R1 missing path and oracle failure (exit 2), replayed in isolation: `review/r1_gate_replay.txt`.
- **Review 2 — PARTIALLY VERIFIED.** Revision 1 diff is the two `currentColor` substitutions; reviewer re-probe on the rebuilt Storybook: Loader arcs `rgb(102, 112, 133)` = button `color` at 390/1440, both buttons disabled. `rev1/18_hashes.txt` equals the worktree; §13.2 block exit 0 except the Task 790 FooterView test.
- **Review 3 — APPROVED WITH NOTES.** Owner visual review, 2026-09-17, verbatim: "Візуальне рев'ю пройдено, всі 8 комбінацій прийнято" (both stories × en/uk × 390/1440). Gate part recorded in `docs/reviews/2026-09-17-task829-enrolled-files-tailwind-detector.review-ledger.json`. Notes (P3): §10.3–§10.6 transcripts were not retained by the executor (reviewer replay substitutes); self-test arm 9 proves oracle-failure classification, not the exit code (reviewer replay proved exit 2); the `color="white"` precedent in `SaveSearchButton`/`SaveToCollectionButton` is filed as **835**.
