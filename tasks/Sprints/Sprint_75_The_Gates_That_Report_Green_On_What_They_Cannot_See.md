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
| **816** | Design-system Mantine-pattern ownership and audit — owns the 11-path tier-3 list in Task 812 §14.6.1 | P1 | Q2 | **FILED** 2026-09-11 by owner decision 1 — kickoff owed |
| **817** | `scripts/check-surface-census.mjs --surface <path>` — GR-1's real per-surface command | **P0** | Q4 | **NEEDS REVISION** 2026-09-11 — command, plant and differential arm verified and not re-done; Revision 1 (§17) owns the barrel `story:` resolution, the unmeasured `ui-imports` column and the unparseable-surface receipt → [`Sprint_75_kickoff_prompt_Task_817_…`](Sprint_75_kickoff_prompt_Task_817_Per_Surface_Census_Command.md) |
| **818** | Make the advisory `check:rendered-scope` rollout blocking — clear the frontier or add a fail-on-new baseline | **P0** | Q4 | **FILED** 2026-09-11 by owner decision 3 — kickoff owed |
| **797** | `check:design-tokens` cannot see a raw dimension in Mantine's responsive object form | P2 | Q2 | reserved |
| **743** | `check:css-vars` un-owns a token and its orphaned consumers together, then goes silent | P2 | Q2 | reserved — **moves here from Sprint 46.8** |

**Execution order: 812 → 817 → 818 → 816 → 815 → 797 → 743.** 812 first because `docs/golden-rules.md`'s own
enforcement table calls it P0 and says GR-1 and GR-3 stay self-reported until it lands; 812 is now **APPROVED** and
archived. **817 and 818 come next because exit criterion 2 depends on both of them and on nothing else** — 817 gives
GR-1 the command its own `Command` block already cites, 818 turns decision 3's advisory CI step into a blocking one.
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
