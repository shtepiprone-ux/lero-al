# Design-system pattern ownership and audit (Task 816)

Sprint 75 · owner decision 1 (2026-09-11) assigned this file and its re-measure command to Task 816: *"Each entry
needs a durable reason and owner Task 816. ... It owns future changes to this path list and must re-measure it
whenever a listed pattern changes."*

This document is the record. It does not enrol, migrate, or de-allowlist anything — it measures, records the
allowlist's own premise verdict, and puts the governance model to the owner (§4).

## 1. The re-measure command

```powershell
npm run audit:design-system-patterns
```

Prints the full census below and exits **0** when every allowlisted (tier-3, owner 816) pattern still satisfies
decision 1's premise — shared (≥2 distinct consumers) and has its own canonical Mantine Story. It exits **non-zero**,
naming the failing path and which half of the premise failed, when a listed pattern's path no longer exists, has
fewer than 2 distinct consumers, has no Story of its own, or is (invalidly) present in both the manifest and the
allowlist at once. **Trigger: run it whenever a `src/design-system/mantine/patterns/*.tsx` file changes, or a story
or consumer of one does** — decision 1's own words, now a command instead of a promise.

`npm run audit:design-system-patterns --json` emits the same census as one structured object (same exit code) for
programmatic use. **This is an audit command, not a CI gate** — it is not wired into any GitHub Actions workflow by
this task (§4's stated, reversible assumption); a future blocking gate is a separate, Q4 task with its own
planted-failure proof.

## 2. Census — every `.tsx` under `src/design-system/mantine/patterns/`, measured 2026-09-11

**33** pattern files, derived from the directory at execution (`Get-ChildItem src\design-system\mantine\patterns
-Filter *.tsx`, count 33 — matches `Get-ChildItem`'s own count exactly, AC2). Reconciled against the kickoff's §2
table (5 enrolled / 11 tier-3 / 17 neither, dated 2026-09-11): **unchanged** — same totals, same three sets. No
difference to explain.

Consumer counts are **whole-`src`** (every production file under `src/` that renders the pattern as a JSX tag,
via `map-changed-surfaces.mjs`'s `buildRenderGraph()`), not only enrolled roots. `(enrolled-only:N)` reconstructs
`check:rendered-scope:report`'s narrower, enrolled-root-only view by filtering the whole-tree consumer list to
consumers that are themselves manifest entries — this is the same edge definition that report uses, so the two
numbers are directly comparable, not two different measurements. **Cannot see:** a consumer reached only through
dynamic `import()`/`React.lazy()`, or one living under a directory the render graph never walks into
(`node_modules`/`.next`/`storybook-static`/`__tests__`/`stories`).

| Pattern | State | Edges | Consumers (enrolled-only) | Own Story |
|---|---|---:|---:|---|
| MantineAddItemPanel.tsx | enrolled | 2 | 2 (2) | yes |
| MantineAdminSurfacePattern.tsx | ungoverned | 0 | 0 (0) | yes |
| MantineAppShellFoundation.tsx | ungoverned | 0 | 0 (0) | yes |
| MantineAuthFormPattern.tsx | ungoverned | 0 | 0 (0) | yes |
| MantineCombobox.tsx | **tier-3 (816)** | 8 | 8 (4) | yes |
| MantineCopyIdButton.tsx | **tier-3 (816)** | 1 | 1 (1) | yes |
| MantineCountButton.tsx | **tier-3 (816)** | 4 | 4 (4) | yes |
| MantineDataTableToCards.tsx | ungoverned | 2 | 2 (0) | yes |
| MantineDialogDrawerPattern.tsx | ungoverned | 0 | 0 (0) | yes |
| MantineDrawer.tsx | **tier-3 (816)** | 4 | 4 (4) | yes |
| MantineDropdownMenu.tsx | **tier-3 (816)** | 2 | 2 (1) | yes |
| MantineEmptyLoadingErrorState.tsx | enrolled | 2 | 2 (2) | yes |
| MantineFilterSection.tsx | enrolled | 1 | 1 (1) | yes |
| MantineFormSectionStack.tsx | ungoverned | 0 | 0 (0) | yes |
| MantineHomeSection.tsx | enrolled | 2 | 2 (1) | yes |
| MantineListingCardPattern.tsx | **tier-3 (816)** | 1 | **1** (1) | yes |
| MantineListingCardTrack.tsx | enrolled | 8 | 8 (7) | yes |
| MantineListingContactPattern.tsx | **tier-3 (816)** | 2 | 2 (1) | yes |
| MantineListingDetailPattern.tsx | **tier-3 (816)** | 1 | **1** (1) | yes |
| MantineListingGalleryPattern.tsx | ungoverned | 1 | 1 (0) | yes |
| MantineModal.tsx | **tier-3 (816)** | 3 | 3 (3) | yes |
| MantineNavigationMenu.tsx | ungoverned | 0 | 0 (0) | yes |
| MantineNotificationPattern.tsx | ungoverned | 0 | 0 (0) | yes |
| MantinePageHeaderWithActions.tsx | ungoverned | 0 | 0 (0) | yes |
| MantinePagination.tsx | **tier-3 (816)** | 2 | 2 (1) | yes |
| MantinePopover.tsx | ungoverned | 2 | 2 (0) | yes |
| MantineProgress.tsx | ungoverned | 0 | 0 (0) | yes |
| MantineResponsiveActionFooter.tsx | ungoverned | 0 | 0 (0) | yes |
| MantineSelect.tsx | ungoverned | 0 | 0 (0) | yes |
| MantineTooltip.tsx | ungoverned | 0 | 0 (0) | yes |
| MantineTwoColumnForm.tsx | ungoverned | 0 | 0 (0) | yes |
| RangeDatePicker.tsx | **tier-3 (816)** | 2 | 2 (2) | yes |
| responsiveBottomSheet.tsx | ungoverned | 12 | 8 (0) | **no** |

**Totals: Enrolled 5 · Tier-3 allowlisted 11 · Ungoverned (neither) 17 · In both (invalid) 0.**

Two findings worth naming even though the audit only fails on a broken *allowlist* premise (§10.3 of the kickoff —
"the existence of un-governed patterns is a finding in the document, not a non-zero exit"):

- **`responsiveBottomSheet.tsx` is the single most-consumed pattern in the directory (12 raw edges, 8 distinct
  consumers) and has no canonical Story.** It is an internal building block six other patterns (`MantineCombobox`,
  `MantineDrawer` ×2, `MantineDropdownMenu`, `MantineModal` ×2, `MantineNavigationMenu`, `MantinePopover` ×2,
  `MantineSelect`, `MantineTooltip` ×2) render directly, not a leaf consumer surface — worth the owner's attention
  independent of §4's governance decision.
- Every one of the other 16 ungoverned patterns has its own canonical Story already (the design system was clearly
  built story-first); none has an enrolled-root consumer yet, which is exactly why `check:rendered-scope`'s
  enrolled-only walk has never surfaced any of them.

## 3. R2 — the allowlist's own premise, verified per path

Decision 1's words: *"shared design-system components **with canonical Stories**."* Both halves measured for all 11:

| Pattern | Consumers (whole-tree) | Shared (≥2)? | Own Story | Story file(s) |
|---|---:|---|---|---|
| MantineCombobox.tsx | 8 | **yes** | yes | `LocationCombobox`, `PhoneField`, `PropertyTypeCombobox`, `YearCombobox`, `RangeDatePicker`, `AuthSheet`, `ListingsFilterBar`, `ListingsSortBar` → `src/stories/mantine/primitives/Combobox.stories.tsx` |
| MantineCopyIdButton.tsx | 1 | **NO** | yes | `ListingCard.tsx` only → `CopyIdButton.stories.tsx`, `ListingCardPattern.stories.tsx` |
| MantineCountButton.tsx | 4 | **yes** | yes | `CountButton.stories.tsx` |
| MantineDrawer.tsx | 4 | **yes** | yes | `Drawer.stories.tsx`, `ListingsFilters.stories.tsx` |
| MantineDropdownMenu.tsx | 2 | **yes** | yes | `DropdownMenu.stories.tsx` |
| MantineListingCardPattern.tsx | 1 | **NO** | yes | `ListingCard.tsx` only → `ListingCardPattern.stories.tsx` |
| MantineListingContactPattern.tsx | 2 | **yes** | yes | `ListingContactPattern.stories.tsx` |
| MantineListingDetailPattern.tsx | 1 | **NO** | yes | `ListingDetailView.tsx` only → `ListingDetailPattern.stories.tsx` |
| MantineModal.tsx | 3 | **yes** | yes | `Modal.stories.tsx` |
| MantinePagination.tsx | 2 | **yes** | yes | `Pagination.stories.tsx` |
| RangeDatePicker.tsx | 2 | **yes** | yes | `RangeDatePicker.stories.tsx` |

**Three paths fail the "shared" half of the premise — every path has its own Story, so the Story half never fails.**
`MantineCopyIdButton.tsx`, `MantineListingCardPattern.tsx` and `MantineListingDetailPattern.tsx` each have exactly
**one** production consumer (`ListingCard.tsx`, `ListingCard.tsx`, and `ListingDetailView.tsx` respectively), verified
by a direct `git grep` cross-check against the AST-measured render graph (every other textual hit for these three
names is a code comment, not an import — see `docs/sessions/evidence/task816/` for the cross-check transcript). This
is not a measurement artifact: it is decision 1's own word, "shared," genuinely unmet by 3 of the 11 entries it
created.

**This directly contradicts the kickoff's own AC4 expectation** ("`npm run audit:design-system-patterns` on the
clean tree... exits 0"). It does not; it exits **1**, correctly, naming these three. `docs/agent-contract.md`'s
"kickoff's own measured facts are not exempt" rule (`orchestrator-procedures.md` → Recurring orchestrator failure
modes) applies to this kickoff too: AC4's assumption that all 11 would satisfy the premise was not itself verified
before being written down, and the measured reality is the opposite for 3 of 11. The audit's exit code is not
weakened to force a green result — it is exactly the observable, correct behaviour of "the audit fails on a broken
premise, not on debt" (§10.3). This is reported as a finding for the owner's §4 decision below, not silently
corrected.

The remaining 8 of 11 are genuinely shared with their own canonical Story: `MantineCombobox`, `MantineCountButton`,
`MantineDrawer`, `MantineDropdownMenu`, `MantineListingContactPattern`, `MantineModal`, `MantinePagination`,
`RangeDatePicker`.

## 4. `STOP — OWNER DECISION REQUIRED` — the governance model for the 33

Measured this session: 5 enrolled, 11 tier-3 allowlisted (3 of which measurably fail their own "shared" premise —
§3), 17 ungoverned. The split has no author; it is an artefact of which surfaces happened to be enrolled on
2026-09-11 when Task 812 first walked the frontier. Three bounded options, each with what it costs (unchanged from
the kickoff's own framing, now with the measured numbers that make each cost concrete):

- **(a) Enrol the shared-and-storied ones.** After §3's correction, that is **8** paths, not 11 — the 3 that fail
  "shared" would need a different disposition (own tier-3 entry stays valid on the Story half but not the shared
  half; or wait for a second real consumer; or the owner may judge single-consumer "shared with the design system's
  intent" regardless of the literal count). Enrolling the 8 shrinks the allowlist to 5 entries (the 3 exceptions plus
  the 2 Task 813 entries) and removes their edges from the frontier by making them enrolled-to-enrolled. Cost: the
  manifest grows 38 → 46 (or 49 if all 11 are enrolled regardless of the shared-count finding), and each newly
  enrolled pattern becomes a `check:rendered-scope` root, so its own imports join the frontier — measure before, not
  after, per the original kickoff.
- **(b) Keep the 11 allowlisted as-is and give the 17 an explicit disposition.** Cheapest. Leaves the design system
  governed by two mechanisms with a line nobody chose, and leaves 3 of the 11 allowlist entries resting on a premise
  this audit now shows is false for them — the owner would be explicitly choosing to keep those 3 as recorded
  exceptions rather than requiring "shared" literally.
- **(c) One rule for the whole directory** — every pattern enrolled, the allowlist reserved for components owned
  outside the design system (the 2 Task 813 entries, `ListingFeatureIcon`/`FavoriteButton`, which are not under
  `src/design-system/`). Most coherent; makes decision 1's eleven entries temporary by design; largest one-time
  manifest growth — **38 → 66**: 28 paths are added, because 5 of the 33 are already enrolled. **Corrected
  2026-09-11 by the owner when selecting this option; this document originally read `38 → 71`, which double-counted
  the 5 already-enrolled patterns, and the reviewer approved it without re-deriving the sum.**

**The executor measures these inputs and stops; it does not select.** Whatever the owner decides, implementing it —
enrolling, de-allowlisting, or re-wording any entry — is a **separate task**, per `agent-contract` 16d and this
kickoff's own out-of-scope list. No allowlist or manifest file is modified by this task (`git diff --stat` empty for
both — see the session log's AC9 evidence).

**Record the answer here, verbatim, with its date, when the owner decides:**

> **Decision — select (c), 2026-09-11.** Every current and future `.tsx` file under
> `src/design-system/mantine/patterns/` is governed as an enrolled design-system pattern. The eleven Task 816 tier-3
> allowlist entries are transitional and must be removed by a separate implementation task; no baseline is approved
> for the three single-consumer paths. That task must enrol the remaining 28 paths, add a canonical Story for
> `responsiveBottomSheet.tsx` before enrolment, measure the expanded frontier before modifying it, and add a
> CI-safe, planted-failure parity check that fails when a pattern-directory file is not enrolled. It resolves the
> audit's current red state by eliminating the invalid tier-3 premise, not by weakening or baselining the audit.
>
> Important correction to §4: this is manifest growth **38 → 66**, not `38 → 71`, because 5 of the 33 patterns are
> already enrolled — 28 are added, not 33.
>
> Option (a) leaves an arbitrary mixed model; option (b) entrenches three known-false exceptions.

**Binding consequences.** Task **820** is that implementation task, filed 2026-09-11 in the same state update as
this decision. Until it is approved the eleven tier-3 entries remain in `scripts/rendered-scope-allowlist.json` and
`npm run audit:design-system-patterns` keeps exiting 1 — the red state is a true finding and is resolved by 820's
enrolment, never by a baseline, a reworded `reason`, or a relaxed premise. `responsiveBottomSheet.tsx` gets its
canonical Story **before** enrolment, not after, or `check:story-coverage` fails on it the moment it is enrolled.

## 5. Inherited notes — closed or recorded (R4)

| From | Note | Disposition |
|---|---|---|
| 817 | `docs/sessions/evidence/task817/R1_AC16-favoritesshell-report.txt` held the superseded `AppImage ui-imports:2` reading, unmarked | **Fixed** — one line added marking it superseded and naming `R1_favoritesshell-final-report.txt`; every other line byte-identical (`git diff --stat`: 1 insertion). |
| 817 | `ui-imports` counts only **rendered** `src/components/ui/*` bindings, so a non-rendered legacy import (`cn`, a variants helper) reads `0` | **Recorded, stands as-is — this is documented, intentional behaviour, not a defect.** `check-surface-census.mjs`'s `countUiImports` docstring already states the filter is deliberate: an unfiltered resolve would also match a node's own co-located `.module.css` or hook sibling (e.g. `AppImage.tsx`'s own `./AppImage.module.css`), which mechanically resolves under `src/components/ui/` but is not "imports a legacy UI primitive" in GR-1's sense. `0` correctly means "no *rendered* legacy import found," never "no legacy reference exists anywhere in the file" — a reader citing the column must read it that way, which is the note's whole content. No code change; `check-surface-census.mjs` is out of scope for this task except for this exact note, and this note does not describe a defect. |
| 817 | A node tripping two blocking rules (e.g. malformed allowlist entry AND unenrolled-or-unstoried) is named twice in the `GR-1 CENSUS BLOCKED` list | **Recorded, stands — out of this task's authorization to fix.** The kickoff's scope carve-out for `check-surface-census.mjs` names only the `ui-imports` note as a possible fix target (§7); this note is not covered by that carve-out, so no edit was made. Each of the two lines is independently actionable (a malformed-allowlist-entry fix and an unenrolled-or-unstoried fix are different corrections to different files), so the duplication is arguably informative rather than wrong — but that judgement, and any resulting code change, belongs to whichever task next touches `check-surface-census.mjs`'s blocking-node logic. |
| 818 | The final gate block was captured before the AC16/AC18 probes with no script hash tying it to shipped content | **Fixed by Task 819 already** (its `Rev1_15_hashes-and-AC10.txt` pattern); this task's own final gate block follows the same shape — see the session log. |
| 818 | `Get-Content -Raw` without `-Encoding utf8` silently mojibakes a BOM-less UTF-8 file on PowerShell 5.1 | **Fixed and now written into durable procedure.** `docs/orchestrator-procedures.md` → "Recurring orchestrator failure modes" gained a corollary naming the mitigation (read/write through Node, or pass `-Encoding utf8` explicitly). This task **reproduced the identical failure** on `scripts/rendered-scope-allowlist.json` while executing AC5's probe, corrected it the same way, and used that fresh incident as the corollary's second example — see the session log §7 and `AC5_no-own-story_probe.txt`. |
| 819 | `map-changed-surfaces.mjs` kept `CANDIDATE_SKIP_DIR_SEGMENTS` and the render graph's `SKIP_DIRS` as two literals synchronised only by a comment | **Fixed** — `SKIP_DIRS` is now `= CANDIDATE_SKIP_DIR_SEGMENTS` (the same `Set` object, not a copy); `npm run check:surface-census:changed:verify` still passes all 8 arms afterward. |

## 6. Sprint exit criterion 5 (R5)

Folded in here per the kickoff's own §5/R5 note, since this document and the `orchestrator-procedures.md` edit were
already in scope. The transferable paragraph — "when a check narrows its input set, the narrowing must be printed
alongside the result" — is written into `docs/orchestrator-procedures.md` → "Recurring orchestrator failure modes,"
naming this sprint's four landed commands (`check:rendered-scope`, `check:surface-census`,
`check:surface-census:changed`, `audit:design-system-patterns`) as its evidence.

## 7. Task 820 implementation record (2026-09-11)

Decision 5 (§4) is implemented. `scripts/mantine-migration-scope.json` gained the remaining 28 pattern paths
(38 → 66); `scripts/rendered-scope-allowlist.json` had its eleven Task 816 tier-3 entries removed, leaving exactly
the two Task 813 entries owned outside the design system (13 → 2); `responsiveBottomSheet.tsx` gained its canonical
Story (`src/stories/mantine/primitives/ResponsiveBottomSheet.stories.tsx`, title `Mantine/Primitives/
ResponsiveBottomSheet`) before enrolment, per decision 5's own ordering requirement. `npm run
audit:design-system-patterns` now exits 0 (33 enrolled / 0 tier-3 / 0 ungoverned) — the invalid "shared" premise for
`MantineCopyIdButton`/`MantineListingCardPattern`/`MantineListingDetailPattern` no longer exists, because those three
paths are enrolled directly rather than resting on the tier-3 allowlist's now-retired "shared" test. The census in §2
is left as the dated 2026-09-11 pre-820 measurement it always was; it is not rewritten to the post-820 state.

**A new CI-blocking gate, `scripts/check-pattern-enrolment.mjs` (`npm run check:pattern-enrolment`), now makes the
rule self-enforcing**: it reads the `src/design-system/mantine/patterns/` directory listing (never a hard-coded name
list) and fails when a `.tsx` file there is not a manifest entry, or when a manifest entry under that directory
points at a file that no longer exists. See `docs/storybook-governance.md` §15.8 for the full mechanism, and
`docs/golden-rules.md`'s GR-1 enforcement row for its place alongside `check:rendered-scope`/`check:surface-census:
changed`.

**A measured, not assumed, dependency.** Twenty-seven of the twenty-eight newly-enrolled patterns' own canonical
Stories imported their component through the shared `@/design-system/mantine/patterns` barrel, which
`check-story-coverage.mjs`'s resolver does not unwrap — every one of those 27 read as enrolled-but-unproven the
moment it was enrolled, contradicting this task's own kickoff §3.1 assumption. Fixed by switching each story's own
import to the direct component path (the convention already documented in `MantineAddItemPanel.stories.tsx`); see
`docs/storybook-governance.md` §15.8 for the measurement and `docs/sessions/evidence/task820/` for the transcripts.
Task 820 did not modify `scripts/check-rendered-scope.mjs`, `scripts/check-surface-census.mjs`,
`scripts/check-surface-census-changed.mjs`, `scripts/map-changed-surfaces.mjs`, or `scripts/audit-design-system-
patterns.mjs`.

## 8. A sibling directory for the project's non-Mantine image primitive (Task 813, 2026-09-11)

Owner decision §5.1 (C) on Task 813 (recorded verbatim in
`tasks/Sprints/Sprint_75_kickoff_prompt_Task_813_AppImage_Tier2_Root_Cause.md` §5.1) needed a destination for
`AppImage.tsx` — the project's canonical, non-Mantine `<img>` render site — outside `src/components/ui/`, whose path
prefix both `check-rendered-scope.mjs` and `check-surface-census.mjs` classify as `tier2-legacy-primitive`. The
decision refused this file's own directory by name: `AppImage` is a bespoke `<img>` renderer, not a Mantine pattern,
so `src/design-system/mantine/patterns/` — governed by §4's decision 5 above — is not its home. It moved instead to
a new sibling directory, `src/design-system/media/`, governed the same way: every `.tsx` there is an enrolled
manifest entry, enforced by a new, independent, directory-listing-driven gate, `scripts/check-media-enrolment.mjs`
(`npm run check:media-enrolment`, blocking, same shape as `check-pattern-enrolment.mjs` — see
`docs/storybook-governance.md` §15.9 for the full mechanism). `AppImage.tsx` and its co-located siblings
(`appImageConfig.ts`, `useAdaptiveImageConfig.ts`, `AppImage.module.css`) moved byte-identically; every external
importer was rewritten to the new path; `scripts/mantine-migration-scope.json` grew 66 → 67.

## 9. Task 821 implementation record (2026-09-16) — the last two Task 813 tier-3 entries close out

The two `scripts/rendered-scope-allowlist.json` entries Task 820's §7 left in place (`ListingFeatureIcon.tsx`,
`FavoriteButton.tsx`, "owned outside the design system") were transferred to Task 821 per the 2026-09-11 owner
amendment quoted in that task's kickoff §2, then resolved:

1. `owner` on both entries moved `"813"` → `"821"` (the amendment's required first tracked-file write, verified
   against Task 820's committed blob `bf09fd2f…`).
2. Each component gained its own canonical Mantine Story — `Mantine/Primitives/ListingFeatureIcon` and
   `Mantine/Primitives/FavoriteButton` (`src/stories/mantine/primitives/`) — statically importing its own path, not
   the `ListingCardPattern.stories.tsx` composition that had previously been the only story to import
   `FavoriteButton` (GR-3/16d: a composition Story is not a component Story).
3. Both paths were added to `scripts/mantine-migration-scope.json` (70 → 72).

Enrolling the target paths made both allowlist entries **stale** — a live consequence Task 821's kickoff had
predicted as a possible stop condition: their only two rendering surfaces, `ListingCard.tsx` and
`ListingDetailView.tsx`, were already enrolled, so once the target itself was also enrolled the edge resolved
enrolled-to-enrolled and never reached the allowlist. **Owner decision, 2026-09-16** (quoted verbatim in
`docs/sessions/evidence/task821/Rev2_00_owner-decision.txt`): the two stale entries are removed rather than kept,
because the 2026-09-11 "keep them governed by their explicit entries" instruction applied to the transitional
pre-enrolment state, not to a resolved tier-3 exception. `scripts/rendered-scope-allowlist.json` is now `[]` (2 → 0)
— the file that once tracked 13, then 2, transitional tier-3 exceptions now tracks none. `check:rendered-scope` and
`check:surface-census:changed` both exit 0 with 0 new / 0 stale on the resulting tree. Task 821 did not modify any of
the seven scripts named in Task 812/818/819/820/813's own gate set, and did not modify either component's source.
