# Sprint 75 — The gates that report green on what they cannot see

> Opened **2026-09-11**, immediately after Task 809 closed, by the orchestrator. Task 809 cost six owner rejections
> and six revisions; **not one of the six was caught by a gate, and the first of them shipped while
> `check:story-coverage` printed `34/34` green.** This sprint exists to turn that class of blindness into failing
> commands.

## Goal

**A gate's scoping rule is also its blind spot, and this repository has four measured instances of it. Each one is
either given a detector with a proven false-positive boundary, or recorded in writing as deliberately undetectable.**

The shape is always the same: a check narrows its input set to be usable, the narrowing is correct, and the excluded
set is then invisible — so the gate reports success about a question it never asked. A green result becomes evidence
of the wrong proposition.

## Why a new sprint, and not an existing one

| Candidate | Its goal sentence | Fit |
|---|---|---|
| **52 — Gates That Stopped Checking** (archived) | gates that regressed into no-ops | **Closest precedent, and the reason this is a different sprint.** 52's gates *stopped* working; these gates work exactly as designed and are blind by construction. Reopening an archived sprint to hold new work is also forbidden by the backlog's own rules. |
| **46 — ListingCard de-Tailwind + overlay exit** | finish the ListingCard/overlay migration | No — a migration goal; **743** sits there only because 700's review filed it there before this family was named. |
| **55 — ARIA semantics no gate sees** | ARIA roles/labels on chip rows | Partial overlap in spirit (its exit criterion 4 asks "name the detector"), but its subject is ARIA semantics, not gate scoping. |
| **56 — Raw enum leaks and the blind detector** | localize `usePropertyTypes`' fallback, fix the enum detector | No — one concrete leak plus its detector, not the general class. |
| **57 — Delete what no longer earns its place** | pure removal | No. |
| **61 — The projection layer no gate reads** | CommonMark fence detection in the ledger projector | No — one parser. |
| **62 — Tailwind runtime tokens outlive Tailwind** | token survival after the Tailwind exit | No. |
| **68 · 69 · 70 · 71 · 72 · 73 · 74** | de-Tailwind migrations, similar-listings search, sold-listing reachability, one card width | No — every one is a product/migration goal. |

## Tasks

| # | Title | P | QA | State |
|---|---|---|---|---|
| **812** | `check:story-coverage` reports green for the components it cannot see | **P0** | **Q4** | **APPROVED** 2026-09-11 — R1-R20 verified against the artifacts; R20 closed by the owner directly in `docs/golden-rules.md:92`. Archived in `docs/backlog-archive.md`. GR-1/GR-3 remain **not enforced** — gated on **817** and **818**. → [`Sprint_75_kickoff_prompt_Task_812_…`](Sprint_75_kickoff_prompt_Task_812_Rendered_But_Unenrolled_Component_Detector.md) |
| **815** | The column-monotonicity check runs for one story at one breakpoint band | P1 | Q2 | reserved |
| **816** | Design-system Mantine-pattern ownership and audit — owns the 11-path tier-3 list in Task 812 §14.6.1 | P1 | Q2 | **APPROVED WITH NOTES** 2026-09-11 — archived in `docs/backlog-archive.md`. `npm run audit:design-system-patterns` landed and correctly exits 1: **3 of the 11** allowlisted patterns measurably fail decision 1's own word *shared* (1 consumer each). The governance model for the 33 is now an **owner action row** in `docs/backlog.md`. → [`Sprint_75_kickoff_prompt_Task_816_…`](Sprint_75_kickoff_prompt_Task_816_Design_System_Pattern_Ownership_And_Audit.md) |
| **817** | `scripts/check-surface-census.mjs --surface <path>` — GR-1's real per-surface command | **P0** | Q4 | **APPROVED WITH NOTES** 2026-09-11 after Revision 1 — archived in `docs/backlog-archive.md`. GR-1's `Command` block is runnable; the blind spot is measured (planted de-enrolment: the census blocks on `CollectionsSection`, `check:rendered-scope` names it zero times). GR-1/GR-3 remain **not enforced** — gated on **818**. 3 P3 notes carried to 816/818. → [`Sprint_75_kickoff_prompt_Task_817_…`](Sprint_75_kickoff_prompt_Task_817_Per_Surface_Census_Command.md) |
| **818** | Make the advisory `check:rendered-scope` rollout blocking — clear the frontier or add a fail-on-new baseline | **P0** | Q4 | **APPROVED WITH NOTES** 2026-09-11 after Revision 1 — archived in `docs/backlog-archive.md`. The gate is **blocking** in CI against a versioned 29-edge baseline, with a 5-arm `check:rendered-scope:verify` self-test. GR-1/GR-3 now enforced **for the enrolled subgraph only** — exit criterion 2 is not met; owner decision 4 files **819**. → [`Sprint_75_kickoff_prompt_Task_818_…`](Sprint_75_kickoff_prompt_Task_818_Rendered_Scope_Becomes_Blocking.md) |
| **819** | GR-1's pre-enrolment case becomes blocking — diff → affected surfaces → `check-surface-census.mjs --surface` each | **P0** | Q4 | **APPROVED WITH NOTES** 2026-09-11 after Revision 1 — archived in `docs/backlog-archive.md`. Blocking in CI against a 690-block/268-surface baseline with carried/stale/new semantics and an 8-arm self-test. **Exit criterion 2 is now met.** → [`Sprint_75_kickoff_prompt_Task_819_…`](Sprint_75_kickoff_prompt_Task_819_Pre_Enrolment_Census_Becomes_Blocking.md) |
| **820** | One rule for the pattern directory — enrol the remaining 28, retire the 11 transitional tier-3 entries, add the parity check | **P0** | Q4 | **NEEDS REVISION** 2026-09-11 (review Revision 2) — R1-R10 and R12 verified; **R11/AC15 UNBLOCKED 2026-09-11 — Task 813 is `APPROVED WITH NOTES`; re-run §17.2 option (A) per decision §17.6 once the owner has committed 813** (was: BLOCKED on Task 813) by owner decision §17.6 select (A2), recorded verbatim below and in the kickoff's §17.7. R13/AC17 (session-log sync) is the only executor work owed meanwhile. Originally **KICKOFF FILED** 2026-09-11 by owner decision 5. Manifest **38 → 66**; `responsiveBottomSheet.tsx` needs a canonical Story first; the expanded frontier is measured **before** it is modified; no baseline for the three single-consumer paths. → [`Sprint_75_kickoff_prompt_Task_820_…`](Sprint_75_kickoff_prompt_Task_820_One_Rule_For_The_Pattern_Directory.md) |
| **813** | `AppImage` leaves `src/components/ui/` → `src/design-system/media/` — clear the tier-2 root cause that blocks Task 820 | **P0** (raised from tier-3 filing by decision §17.6) | Q4 | **✅ APPROVED WITH NOTES** 2026-09-11 (review Revision 5) — owner ACCEPTED all six AC11 tuples (`accepted`, 2026-09-11); archived to `docs/backlog-archive.md`; **Task 820's R11/AC15 is unblocked**. Earlier: **PARTIALLY VERIFIED** 2026-09-11 (review Revision 5) — R17 closed: token `boxSize.galleryThumb` (2.75rem/44px), 44×44px at 320/390/480/1440 with cross-width delta 0, AC23 search empty, probe proven to fail on the old Story; hashes recomputed by the reviewer; both red gates re-confirmed inherited. **Approval waits only on AC11's six owner visual tuples.** Earlier: **NEEDS REVISION** 2026-09-11 (review Revision 4, of R17) — AC24 failed on its own measurements (thumbs scale 66→329.5 px across widths) and four raw `rem` dimension literals remain; owner decision below: **44×44 px squares as token `theme.other.boxSize.galleryThumb`**; owner accepted no-overflow. Route: kickoff §5.5/§13.5. Earlier: **NEEDS REVISION** 2026-09-11 (review Revision 3) — **owner returned AC11**; this task's own `AppImage.stories.tsx` hardcodes 80×56 thumbs in a 4-col grid and overflows at 320/480 → **R17/AC23/AC24**. The gallery pattern's identical-looking defect is not this task's → **824**. Incident closed on evidence. Earlier: **PARTIALLY VERIFIED** 2026-09-11 (review Revision 2) — R1-R16 all closed on the executor side, R14/R16 re-verified independently by the reviewer; **AC22 fired its identical-sets branch → both red gates are inherited, reserved as 822 / 823**. Approval waits only on **AC11's six owner visual tuples** and a stat-cache refresh closing the incident. Earlier: **NEEDS REVISION** 2026-09-11 (review Revision 1) — implementation **retained**, move verified byte-identical (blob `5aa48497…` independently recomputed); owed: R14 run the retargeted `check:homepage-theme-runtime-deps` + self-test, R15 correct the "both censuses green" claim, R16 isolated `HEAD`-snapshot before/after for the two red blocking gates. Previously **READY FOR SONNET** 2026-09-11 — §5.1 answered, select **(C)+(B1)**, recorded verbatim below. Destination `src/design-system/media/`; a blocking self-tested **media-directory parity check lands in the same task** (R12) so the new namespace never ships ungoverned; scope narrowed to `AppImage` + its R1-proven siblings, the other two components split to **821**. `TIER2_PREFIX` is the literal string `src/components/ui/` in both gates, so the fix is the path, not the component: **25** census blocks + **2** frontier edges + the **2** refused by Task 820 all clear at once. Both patterns reach `AppImage` through one shared node, `LightboxView.tsx`. §5.1 holds the one open decision — destination namespace, and whether 813 stays whole or scopes to `AppImage`. → [`Sprint_75_kickoff_prompt_Task_813_…`](Sprint_75_kickoff_prompt_Task_813_AppImage_Tier2_Root_Cause.md) |
| **821** | `ListingFeatureIcon` and `FavoriteButton` — the last two tier-3 allowlist entries get their own Stories | P1 | Q3 | **READY FOR SONNET** 2026-09-11, sequenced **after Task 820's commit** — split out of 813 by decision §5.1 (B1). Both enrolled and storied (`FavoriteButton` appears today only inside `ListingCardPattern.stories.tsx` as a composition — GR-3 says that is not its Story); both allowlist entries keep their explicit rows and move `owner` `813` → `821`. Must not start while Task 820's `13 → 2` allowlist edit is uncommitted — it would invalidate 820's recorded `bf09fd2f…` hash. → [`Sprint_75_kickoff_prompt_Task_821_…`](Sprint_75_kickoff_prompt_Task_821_Last_Two_Tier3_Allowlist_Entries.md) |
| **822** | `check:design-tokens:strict` is blocking in CI and red — 56 inherited raw style-value violations | P1 | Q2 | **RESERVED** 2026-09-11 by Task 813's AC22. Proven inherited by isolated `HEAD`-worktree comparison (identical 56-violation set both sides). Kickoff not yet written. |
| **823** | `check:tailwind-runtime-tokens` is blocking in CI and red — 1 inherited Tailwind-owned reference | P1 | Q2 | **RESERVED** 2026-09-11 by Task 813's AC22. `MantineListingCardTrack.module.css:209 --shadow-sm`, baseline entries 0; proven inherited the same way. Kickoff not yet written. |
| **824** | The listing gallery's thumbnail row — canonical Mantine squares, not a stretching grid | P1 | Q3 | **NEEDS REVISION** 2026-09-12 (Opus implementation review 2) — §16 implemented in full and all four owner decisions honored (three controls relocated to `src/design-system/mantine/patterns/` + 3 manifest entries + own Stories, six `theme.other` roles replacing every literal, thumbnail selects only, R13/R14 race fixes, a clean 34-path `hash-object` block). Returned on: every measurement-based AC (AC13/AC18-AC21/AC4a/AC5) closed by code inspection only, while the session's own §11.11 built and ran the Playwright harness that would have measured them · a mouse drag leaving the track never settles (no `setPointerCapture`) · `scripts/check-locale-leak.mjs` is a changed path absent from the Files Changed table (the change itself is **legitimate and retained** — one `PER_STORY_TOKENS` loanword entry mirroring the file's own `primitives-button: ['Link']`; reviewer-verified per locale, `uk`=`Посилання`, `sq`=`Lidhje`, only `it`=`Link`, so nothing is masked — and R7/§8's "no gate script is edited" is narrowed in §17.8 to gate *logic*, not a justified per-story data allowance) · the gate block predates `DimensionTokens.stories.tsx` · **AC14 was unsatisfiable as written — a review defect, corrected to AC14a**, and `LightboxView.tsx`'s enrolment filed as **825**. Route: kickoff **§17**. Earlier: **NEEDS REVISION** 2026-09-12 (review 1) — implemented across two sessions (session log `docs/sessions/2026-09-12-task824-gallery-thumbnail-squares-and-nav-controls.md`), then returned on ten blocking findings now written into kickoff §16. **Four owner decisions ANSWERED 2026-09-12** — quoted verbatim at the end of this file and bound in kickoff §16.2: D824-1 (A) pointer/mouse drag + `ArrowLeft`/`ArrowRight` below 640px, mobile chrome unchanged · D824-2 (A) the three shared gallery controls move to `src/design-system/mantine/patterns/` with their own Stories and manifest entries, `LightboxView` still not enrolled so Task 820 §17.6 stands · D824-3 (A) desktop thumbnail click selects only · D824-4 the `2px` border and `16px`×`2px` segment become three registered `theme.other` roles, no raw literals and no dimension markers. The next executor session's route is kickoff §17; the task's state stays **NEEDS REVISION** until a fresh implementation is reviewed. Earlier: **READY FOR SONNET** 2026-09-11, filed by the owner's AC11 rejection. Cause measured at `MantineListingGalleryPattern.tsx:79`; reference `rozetka.com.ua`; `AspectRatio ratio={1}` is a first adoption in this repo, so its standalone Story lands before the composition. → [`Sprint_75_kickoff_prompt_Task_824_…`](Sprint_75_kickoff_prompt_Task_824_Gallery_Thumbnail_Squares.md) **Thumbnail size fixed by owner decision 2026-09-11 (Task 813 review Revision 4): 44×44 px via `theme.other.boxSize.galleryThumb`, established by 813 — 824 consumes it.** |
| **825** | Enrol `LightboxView.tsx` — the last tier-1 node the gallery surface renders that has no manifest entry | P2 | Q2 | **RESERVED** 2026-09-12 by Task 824's review 2 (GR-1 / `agent-contract` 16d filing). `check-surface-census --surface MantineListingGalleryPattern.tsx` has exited 1 on `LightboxView.tsx [tier1-unenrolled-or-unstoried]` since before 824 began (`docs/sessions/evidence/task824/01_baseline_surface-census.txt`, identical at `137`). It already has `story:yes` through its own `Mantine/Primitives/LightboxView` Story, which 824 extended with a `play` and a `SwipeTrackMode` export, and **Task 813 removed the `AppImage` tier-2 hop** that Task 820 §17.6's "no enrolment of `LightboxView` to hide the hop" decision fenced it off for — so the prohibition no longer has a hop to hide. Scope: one `scripts/mantine-migration-scope.json` entry, then re-run `check:surface-census --surface …`, `check:story-coverage`, `check:rendered-scope` and `check:surface-census:changed` and record every baseline delta. **Re-derive the census at execution; if the gate still fails for a different reason, stop for an owner decision rather than baselining it.** Kickoff not yet written. |
| **797** | `check:design-tokens` cannot see a raw dimension in Mantine's responsive object form | P2 | Q2 | reserved |
| **743** | `check:css-vars` un-owns a token and its orphaned consumers together, then goes silent | P2 | Q2 | reserved — **moves here from Sprint 46.8** |

**Execution order: 812 → 817 → 818 → 819 → 816 → 820 → 815 → 797 → 743.** 812 first because `docs/golden-rules.md`'s own
enforcement table calls it P0 and says GR-1 and GR-3 stay self-reported until it lands; 812 is now **APPROVED** and
archived. **817, 818 and 819 come next because exit criterion 2 depends on all three and on nothing else** — 817 gives
GR-1 the command its own `Command` block already cites, 818 turns decision 3's advisory CI step into a blocking one, and 819 (owner decision 4,
2026-09-11) makes the pre-enrolment half blocking. **819 was added to this line on 2026-09-11, the same day it was filed** — the second time this
sprint that leaving it stale was the near-miss.
816 follows because it owns the 11-path allowlist those two report against. 815, 797 and 743 are independent of each
other and of the enforcement chain.

> **Corrected 2026-09-11 while filing 817's kickoff.** This line read `812 → 815 → 797 → 743` for the whole day
> after **816**, **817** and **818** were added to the Tasks table above — the same two-tables-one-maintained defect
> recorded against Sprint 74's Task 702 row (`orchestrator-procedures.md` → recurring failure modes, the
> 2026-08-10 fourth-occurrence corollary). The Tasks table is the single state source; this line is order and
> gating only.

**786 is deliberately NOT in this sprint.** "No control can see a React hook called in a Server Component" is the same
family by description, but it is a P1 production-outage detector with its own false-positive boundary and blast
radius, and folding it in would make this sprint's exit depend on it. Leave it in the backlog until 812 has
established the detector-plus-boundary pattern this sprint is meant to produce.

## Preconditions

1. **Task 809 is archived** — it supplies 812's measured failure case and its two-armed plant material.
2. `scripts/check-story-coverage.mjs` and `scripts/mantine-migration-scope.json` are current as read on 2026-09-11:
   38 manifest entries, all covered, gate exit 0.
3. No task in this sprint may relax `docs/golden-rules.md`. GR-1 and GR-3 become *enforced* by 812; until then they
   remain receipt-only and every response still carries their receipts.

## Exit criteria

1. Every task above is `APPROVED` / `APPROVED WITH NOTES` or explicitly deferred by a quoted owner decision.
2. **`docs/golden-rules.md`'s enforcement table shows GR-1 and GR-3 as `enforced` by a named command**, not
   receipt-only — that is what 812 buys.
   > **MET 2026-09-11, on Task 819's approval.** The history, kept because the qualification is the point: 812 built the detector, 817
   > built GR-1's per-surface command, 818 made the whole-manifest detector blocking — but that enforces the **enrolled-subgraph** rule only,
   > so owner decision 4 (quoted verbatim below) ruled the criterion unmet and filed **819**. 819 landed the pre-enrolment half as a second
   > blocking CI gate. `docs/golden-rules.md:92,94` now read **enforced for both halves**, naming `check:rendered-scope` and
   > `check:surface-census:changed`; GR-1's `Command` block survives as the by-hand single-surface form and is explicitly not what CI runs.
   > **Criterion 2 is satisfied. Criterion 1 is not** — 816, 815, 797 and 743 are still open, so the sprint does not close on this.
3. Each landed detector carries a **two-armed plant**: a planted violation that makes it exit non-zero, and its
   removal that clears it, both with retained transcripts and restoration evidence.
4. Each landed detector carries a **written false-positive boundary** — the class it deliberately does not flag, the
   mechanism that excludes it, and the task that owns whatever is excluded.
5. The transferable output: one paragraph in `docs/orchestrator-procedures.md` → "Recurring orchestrator failure
   modes" stating the rule this sprint proves — **when a check narrows its input set, the narrowing must be printed
   alongside the result, so a green line can never be read as a claim about the excluded set.** GR-2 already demands
   this of agents in prose; the exit criterion is that the *commands* say it themselves.

## Owner decisions — 2026-09-11, Task 812 §14.6 (quoted verbatim, `agent-contract` 16d)

> **Decision 1 — select 1a, systematic tier-3 for the shared Mantine-pattern cluster.**
>
> The current live census, not the stale "10 edges" text in §14.6, is authoritative. Correct §14.6 first: it currently
> contains 11 pattern target paths across 23 rendered edges:
> MantineCombobox, MantineCopyIdButton, MantineCountButton, MantineDrawer,
> MantineDropdownMenu, MantineListingCardPattern, MantineListingContactPattern,
> MantineListingDetailPattern, MantineModal, MantinePagination, RangeDatePicker.
>
> These are shared design-system components with canonical Stories; classify them as tier 3. Add one literal allowlist
> entry per path — no directory rule, glob, prefix suppression, or broad exemption. Each entry needs a durable reason
> and owner Task 816. File Task 816 in the same state update as the design-system-pattern ownership/audit task. It owns
> future changes to this path list and must re-measure it whenever a listed pattern changes.
>
> This does not authorize allowlisting any non-pattern tier-1 target or any tier-2 `src/components/ui/*` path.
> AppImage and PasswordRequirementsHint remain tier 2.

> **Decision 2 — select 2a, build the real per-surface GR-1 command.**
>
> File Task 817 to implement `scripts/check-surface-census.mjs --surface <path>`. It must produce GR-1's per-surface
> receipt for an enrolled or unenrolled surface, so it detects the exact pre-enrolment blind spot that
> `check:rendered-scope` cannot see. It needs a two-armed plant and must run against FavoritesShell.
>
> Do not replace GR-1 with the whole-manifest walk and do not downgrade it to the manual Select-String procedure.
> Until Task 817 is approved, GR-1 remains receipt-only; Task 812's whole-manifest detector is complementary, not its
> replacement.

> **Decision 3 — select 3a as a temporary, observable rollout with a mandatory enforcement exit.**
>
> Wire `npm run check:rendered-scope` into the existing `governance` job immediately after `check:story-coverage`,
> with step-level `continue-on-error: true`. Preserve the script's real exit code and print its full report in the job
> log. It is advisory visibility only: do not mark GR-1/GR-3 enforced and do not claim R6's original blocking
> condition is complete.
>
> In the same response, file Task 818 to make the rollout blocking safely: it must either reduce the reviewed frontier
> to zero or add a versioned, path-level fail-on-new baseline comparator with a planted new-edge proof. On Task 818
> approval, remove `continue-on-error` and make the governance step blocking/required. The advisory mode has no
> indefinite exemption.

**Exit criterion 2 is not met by decision 3.** GR-1 and GR-3 stay receipt-only until Task 817 is approved and Task 818
makes the governance step blocking. An advisory step is visibility, not enforcement.

#### Decision 4 — 2026-09-11, on Sprint 75 exit criterion 2 (quoted verbatim)

> **Decision 4 — select (b), 2026-09-11.** Exit criterion 2 is not met and Sprint 75 must not close on a qualified
> enrolled-subgraph-only check. File a P0/Q4 follow-up that makes GR-1's pre-enrolment case blocking in CI. It must
> deterministically map the PR base-to-head diff to affected rendered surfaces, run `check-surface-census.mjs --surface`
> for each, fail closed on an unresolved candidate or diff-limit condition, print its included and excluded scope, and
> include planted fail/pass proofs. The task depends on Task 818 being approved; until then GR-1 and GR-3 remain not
> enforced.

Binding consequences: **819** is that task, filed in the Tasks table above in the same state update as this decision;
its kickoff is owed and 818's approval (2026-09-11) has now unblocked it. No artifact may describe GR-1 or GR-3 as
enforced while 819 is open — `docs/golden-rules.md`'s rows already say "enforced for the enrolled subgraph" and must
not be widened. "Fail closed" is the owner's word and is not negotiable by task design: an unresolved candidate or a
diff too large to map is a failing run, never a skipped check.

#### Decision 5 — 2026-09-11, on the design-system governance model (quoted verbatim)

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

Binding consequences: **820** is that task, filed in the Tasks table above in the same state update. The audit's exit 1 is resolved by enrolment
only — **no baseline, no reworded `reason`, no relaxed premise** is available to it. The `38 → 66` correction is the owner's, made while
selecting this option: `docs/design-system-pattern-ownership.md` §4 read `38 → 71`, double-counting the 5 already-enrolled patterns, and the
review that approved Task 816 did not re-derive the sum. Corrected in that document with the error recorded rather than silently fixed.

> **Decision §17.2 (Task 820) — select (A), 2026-09-11.** Reconcile the baseline in Task 820 through the existing
> diff-scoped writer with an explicitly recorded base and head; never hand-edit it or defer a known false-red gate.
> Stop if the widened measurement refuses tier-2 debt or produces an unexplainable delta.

> **Decision §17.6 (Task 820) — select (A2), 2026-09-11.** Task 813's AppImage migration is a blocking dependency of
> Task 820. Migrate `LightboxView.tsx` off `src/components/ui/AppImage.tsx` through Task 813; do not enrol
> `LightboxView` merely to hide the tier-2 hop, defer either pattern, add an exclusion, or baseline the tier-2
> finding. After Task 813 is approved, re-run Task 820 §17.2 option (A) from the same base
> `02d975f945159df38c23a0caab43e1c7a96faa58` to the then-current fixed HEAD, with diff/surface limits re-measured and
> recorded. The reconciliation must remove the 20 now-false entries, list every baseline delta, and pass the gate plus
> its self-test. Any new tier-2 refusal remains a stop for a new owner decision.

Binding consequences: **813** is raised to **P0** and inserted into the execution order **before 820's completion** —
the order is now **812 → 817 → 818 → 819 → 816 → 820 (partial) → 813 → 820 (R11 reconciliation) → 815 → 797 → 743**.
Task 820's R11/AC15 may not be re-attempted until 813 carries an `APPROVED` verdict. These two decisions are recorded
here because `agent-contract` 16d requires an owner decision to be quoted verbatim with its date **in the sprint
file**; the Task 820 kickoff's §17.7 carries the same text and the binding order it imposes on the executor.

> **Decision §5.1 (Task 813) — select (C) and (B1), 2026-09-11.** Move `AppImage.tsx` and only the co-located
> siblings proven by R1 to `src/design-system/media/`; do not place the project's canonical non-Mantine image
> primitive under `src/design-system/mantine/patterns/`. In the same Task 813, add a blocking, CI-safe, self-tested
> media-directory parity check: every `src/design-system/media/*.tsx` file must be enrolled in the manifest, while
> existing story coverage continues to require its canonical Story. The check must derive the directory at runtime,
> print its scope boundary, and prove a planted missing-enrolment failure. Do not weaken or alter the existing
> pattern-directory check.
>
> Task 813 is scoped to `AppImage` and its proven co-located siblings only. File `ListingFeatureIcon` and
> `FavoriteButton` as the next numbered task, transfer their allowlist ownership from `813` to that task in the same
> state update, and keep them governed by their explicit entries. Task 820 may resume immediately after the AppImage
> half is approved; it does not wait for the two unrelated components.

Binding consequences: **821** is filed in the Tasks table above in the same state update, and the execution order
becomes **812 → 817 → 818 → 819 → 816 → 820 (partial) → 813 → 820 (R11 reconciliation) → 821 → 815 → 797 → 743**.
Task 820's R11 resumes on **813's** approval alone. The `owner` `813` → `821` field transfer in
`scripts/rendered-scope-allowlist.json` is sequenced into 821 and **after Task 820's commit**, because that file
currently carries 820's uncommitted `13 → 2` edit whose `git hash-object` `bf09fd2f63b542faa14a63bfb44253203422b026`
is 820's own AC6 evidence; editing the field earlier would force 820 to re-run it. This is the one place the
decision's "in the same state update" is satisfied by the state records here and in `docs/backlog.md`, with the data
file following in 821.

> **Owner amendment, 2026-09-11 (Task 813 / Task 821 allowlist ownership).** Ownership of `ListingFeatureIcon` and
> `FavoriteButton` transfers to Task 821 in the sprint/backlog/task-design state now. Their `owner` fields in
> `scripts/rendered-scope-allowlist.json` remain `"813"` as a documented transitional snapshot until Task 820's final
> approved commit preserves AC6. Task 821 must make the field-level `813 → 821` transfer as its first tracked-file
> change after verifying that commit, then retain its own before/after hash and gate evidence. No further
> implementation work for those two components remains authorized under Task 813.

Binding consequences: ownership is transferred **here, in `docs/backlog.md`, and in both kickoffs, as of 2026-09-11**.
The two `owner: "813"` values still present in `scripts/rendered-scope-allowlist.json` are a **documented transitional
snapshot** — a reviewer who sees them must read them against this amendment and must not file a state mismatch. Task
813 is forbidden from opening that file at all (R13/AC17) and carries no remaining authorization for either
component. Task 821's first tracked-file write is the field edit itself, gated on verifying Task 820's committed blob
still hashing to `bf09fd2f63b542faa14a63bfb44253203422b026`, and evidenced by its own AC6a before/after hashes plus a
`check:rendered-scope` run immediately after the edit.

> **Owner decision, 2026-09-11 (Task 813 scope, after the first implementation review).** Retarget
> `check-homepage-theme-runtime-deps.mjs`, `scripts/design-tokens-allowlist.json` and the related Task 763 assertion
> is a direct consequence of moving `AppImage`; they are in scope for Task 813. The kickoff must list them and
> require a successful run of `check:homepage-theme-runtime-deps` and its self-test. R10 remains in force for the six
> explicitly named governance scripts.
>
> Also:
> - "Both censuses green" must be corrected: both exit 1 on the pre-existing `LightboxView` tier-1; only the tier-2
>   `AppImage` block disappeared.
> - Do not call `check:design-tokens:strict` and `check:tailwind-runtime-tokens` pre-existing until there is
>   before/after proof. I choose an isolated comparison against a snapshot of `HEAD` / a temporary worktree rather
>   than `git stash`.
> - If the outputs are identical, file two separate tasks for those two blocking gates; if they differ, it is a Task
>   813 regression and must be fixed in it, without carrying the debt out.

Binding consequences: Task 813 is `NEEDS REVISION` with its implementation retained — R14/R15/R16 and AC18-AC22 in
its kickoff carry the three owed items. Rollback of the retarget edits is explicitly refused. `git stash` is
forbidden for R16; the isolation is `git worktree add --detach` (or `git archive`) into a scratch directory. AC22
binds both outcomes before the measurement: identical sets → two new numbered tasks; any difference → fixed inside
Task 813. Task 820's §17.1 finding drops from **20 entries / 15 surfaces** to **18 / 13** once 813 lands, against a
**676**-entry baseline — recorded in its §17.6 arithmetic update.

> **Owner decision, 2026-09-11 (Task 813 R17, review Revision 4) — verbatim, three messages.**
> візуально аідтверджую, що тепер Image не виходить за рамки екранів
>
> розмір квадратів має бути 44х44px
>
> цей розмір треба записати токеном!

Binding consequences: Task 813's `AppImage` Story no-overflow is owner-accepted; its thumbnail squares are **44 × 44 px**
from one new registered role, `theme.other.boxSize.galleryThumb: '2.75rem'`, added by Task 813 (kickoff §5.5) — not
`theme.other.touchTarget` or `iconSize.touch`, which share the value but have another documented owner. Task 824's
thumbnail row consumes the same role; its §3.3 dimension source is no longer `UNKNOWN`.

> **Owner decision, 2026-09-12 (Task 824, Opus implementation review 1 — D824-1 to D824-4) — verbatim.**
> Затверджую рішення для Task 824:
>
> D824-1: A — нижче 640px додати mouse/pointer drag і keyboard arrows; mobile chrome лишається без thumbnails та side arrows.
>
> D824-2: A — винести GalleryNavActionIcon, GalleryDesktopNavigation і GalleryThumbnailButton з LightboxView у src/design-system/mantine/patterns/, із окремими Stories та enrollment.
>
> D824-3: A — desktop thumbnail click лише обирає фото; lightbox відкривається тільки через main photo.
>
> D824-4: зареєструвати потрібні значення для 2px border і 16px × 2px pagination segment як theme.other roles, без raw literals.

Binding consequences, all four written into `Sprint_75_kickoff_prompt_Task_824_Gallery_Thumbnail_Squares.md` §16.2 and
its R9–R18 ledger. **D824-1** — `useSwipeTrackSync` gains a pointer-drag path and `ArrowLeft`/`ArrowRight` on the
focused track, reusing the one existing `±clientWidth` clamp / axis lock / 18% threshold state machine rather than a
second copy; below `sm` there is still no thumbnail row and no side arrow. **D824-2** — `GalleryNavActionIcon`,
`GalleryDesktopNavigation` and `GalleryThumbnailButton` leave `src/modules/listings/components/LightboxView.tsx` for
`src/design-system/mantine/patterns/`, one file each, each with its own canonical Mantine Story and its own
`scripts/mantine-migration-scope.json` entry; `LightboxView.tsx` is **not** enrolled, so this sprint's Task 820 §17.6
decision ("no enrolment of `LightboxView` to hide the hop") stands unchanged, and `check:pattern-enrolment`'s
directory rule (Task 820) covers the three new files by construction. **D824-3** — a desktop thumbnail click sets
`activeIndex` only; the lightbox opens from the main photo alone, which is also what makes the active 2px brand
border an observable steady state. **D824-4** — three new registered roles replace every literal, no
`design-tokens-allow` dimension marker survives: `theme.other.borderWidth.galleryThumbActive: '0.125rem'` (2px, a new
one-role `borderWidth` scale — none existed), `theme.other.boxSize.paginationSegment: '1rem'` (16px) and
`theme.other.boxSize.paginationSegmentThickness: '0.125rem'` (2px, a role distinct from the border width despite the
equal value, per rule 3). This repo has no `cssVariablesResolver`, so all three are consumed through Mantine style
props reading `useMantineTheme()` — the same route `theme.other.boxSize.galleryThumb` already uses — and
`LightboxView.module.css` keeps only its `border-radius: 0` and `color-mix` background.
