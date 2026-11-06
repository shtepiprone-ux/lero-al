# Sprint 59 — Route-level inventory before any migration claim

**Opened:** 2026-08-16 · **Revision 6** · **Status:** 🗄️ **CLOSED — MECHANISM REJECTED** (owner, 2026-08-27) · **Landed tasks:** 0

> 🗄️ **CLOSED 2026-08-27 (owner). Task 667 is RETIRED — never assign it to an executor, never reuse the number.**
> 751 measured the DOM→component mapping mechanism as FAIL and the owner rejected the direction, so 667 depended on
> evidence that will never be produced. It is retired rather than re-scoped.
> **Accepted as a known limitation (owner):** no CI gate asserts the Mantine composition of a route, and **none will be
> built on an unsupported React DOM→component mapping** — `docs/maintenance-playbook.md` §14.3.
> **Replacement control:** route-critical changes carry **task-scoped route evidence**, never a permanent global CI claim.
> Everything below is retained as the decision and measurement record. Ledger row: `docs/backlog-archive.md`, 2026-08-27.

> **Opened by owner decision D-J, 2026-08-16** — *"open Sprint 59 and file separate Task 751 for F1; Task 667
> remains `BLOCKED/reserved` until F1."* This file and `docs/backlog.md`'s Sprints section were changed in the
> **same edit** as the 751 registry row, per the 2026-08-10 fourth-occurrence corollary.
>
> **Changelog**
>
> | Rev | Change |
> |---|---|
> | 1 | Opened as `🟠 OPEN` with 667 at `KICKOFF FILED`, while the registry knew of neither. |
> | 2 | Status corrected to `PROPOSED`; 667 to `BLOCKED — OWNER DECISION REQUIRED`; registry non-write explained. |
> | 3 | D-A recorded as resolved; D-I added. |
> | **6** | **Sprint opened (D-J).** Task **751** filed with a complete standalone kickoff; registry advanced to `NEXT FREE 752`; 667 left `reserved`/BLOCKED. F1 semantics corrected in 751: **`DOM owner` vs `project placer`** separated (`.mantine-Notifications-root` is owned by Mantine `Notifications`, *placed* by `MantineRootProvider`); controls bound to a **seeded fixture slug** with a uniqueness assertion, since `.listing-card` alone and "a nested `<div>`" address nothing; route/locale/viewport/seed/hydration pinned. The 741/749 archive commit is **complete** — its files are no longer a dirty baseline and are not re-litigated. |
> | 5 | **Phase 1 closed by owner** — D-C, D-H approved; worktree manifest supplied. **F1 assigned an executor and a write set** (proposed Task 751). F1 control mount points corrected (measured indices; a real global host element instead of a zero-host provider; `AppImage` outer root is a `<div>`). Stale sections reconciled onto the single F1 contract. |
> | 4 | **Phase order fixed and made single-source** (§Sequence) — revision 3 named two contradictory "first" items. **F1 given pass/fail criteria** and a bounded failure meaning: an F1 failure is a finding about a mechanism and **does not** close this sprint. **Task scope corrected** to the full render chain and the four-way classification. Owner-status column added to the decision list. |

## Goal

Establish what the `/[locale]` route **actually mounts**, classified by evidence that survives review,
before any further migration work is scoped against it. The sprint's output is an inventory, not a migration.

## Why a new sprint (goal-fit test against every open sprint)

| Sprint | Its goal | Fits 667? |
|---|---|---|
| **46** — ListingCard de-Tailwind + overlay exit | Retained follow-ups 743/744/745/748 on the card + evidence apparatus | **No.** Not card scope, not an apparatus fix. Owner cleanup step 3 already sits here; a route inventory widens 46 past its exit condition. |
| **55** — ARIA semantics no gate sees | 730/731, chip-row selected-state announcement | **No.** Different defect class. |
| **56** — Raw enum leaks and the blind detector | 679, detector-first then leak fix | **No.** i18n/enum scope. |
| **57** — Delete what no longer earns its place | 676/682, pure removal proven inert | **No.** 667 adds a record, removes nothing. |
| **58** | Task 749 rendered-proof mobile remediation | **Closed** — 749 archived 2026-08-16 (`backlog-archive.md:11`). |

No open sprint fits. Opened 59 rather than attaching 667 to the nearest number.

## Transferable output (exit criterion)

Beyond the inventory: **name the reason no existing gate can answer "what does this route mount".**
The registry records the symptom — `--mantine-only` scopes by Storybook title prefix and
`check:story-coverage` treats anything absent from `mantine-migration-scope.json` as out of scope, so
`15/15` proves coverage of fifteen enrolled components, not a route (`docs/backlog.md:67`). This sprint must
either name the detector that closes that gap or record why building one is not worth it. A sprint producing
only a document, with no answer to that question, has not met its exit criterion.

## Tasks

| # | State | Scope |
|---|---|---|
| **751** | 🗄️ **CLOSED AS HISTORY (2026-08-17)** | **F1 measured: FAIL — and the direction was then rejected by the owner.** Archived without an approval review; not a delivery. No mechanism (M-a/M-b/M-c/M-d) satisfied all 4 pass criteria on 5 controls × 3 reloads. Decisive: M-b's fiber-walk cannot see `FooterView` (a Server Component, no client fiber) and silently mis-resolves to `MantineRootProvider` — a wrong answer, not a missing one; `_debugSource` is `null` on every fiber in this build; `data-testid` uncovered 0.9976. Finding retained at `docs/reviews/artifacts/task-667/f1/FINDING.md`; probe harness and raw runs discarded. Ledger row: `docs/backlog-archive.md`. **Does not decide 667** — see the Sprint 59 line in `docs/backlog.md`. |
| **667** | **`BLOCKED — OWNER DECISION REQUIRED`** | Homepage route semantic inventory over the **full render chain** `src/app/layout.tsx` → `src/app/[locale]/layout.tsx` → `src/app/[locale]/page.tsx` (D-A, owner 2026-08-16), DOM-evidenced. Classification: **`Mantine`** · **`deliberate native wrapper`** · **`migration candidate`**, **plus a pending D-I disposition for non-rendering mount points** (providers, head scripts, resource hints, third-party). Origin tags `global shared UI` / `locale shared UI` / `route body`. Decision note: `Sprint_59_kickoff_prompt_Task_667_Homepage_Route_Semantic_Inventory.md` §0–§0.1. **Not executable; must not be handed to an executor.** |

This table is the single state source for Sprint 59 task state (2026-08-10 fourth-occurrence corollary: a
sprint file must not carry task state in two tables).

## Open owner decisions blocking 667

Full text in the decision note §0.

**✅ D-A — RESOLVED, owner, 2026-08-16:** *"я обираю повний ланцюг layout-ів + page"*. Boundary is the full
render chain `src/app/layout.tsx` → `src/app/[locale]/layout.tsx` → `src/app/[locale]/page.tsx`, with origin
tags `global shared UI` / `locale shared UI` / `route body`.

**Still open, with the phase each belongs to** (decision note §0.1 is the single authoritative order):

| Phase | Item | Owner decision? | State |
|---|---|---|---|
| 1 | **D-C** — evidence is real dev-server DOM; supersedes the registry's story-first method for 667 | yes | ✅ **APPROVED** 2026-08-16 |
| 1 | **D-H** — evidence tracked in `docs/reviews/artifacts/task-667/`; text/JSON/HTML only, no video | yes | ✅ **APPROVED** 2026-08-16 |
| 1 | **Worktree** — clean isolated, or a dirty-worktree manifest | yes (precondition) | ✅ **manifest supplied** 2026-08-16 (6 entries, zero `src/`) |
| **2** | **F1** — feasibility of an automatic DOM→project-placer mapping. **Task 751, `KICKOFF FILED`** | **no — a measurement** | ⬅ **BLOCKING NOW** |
| 1 | **D-J** — open Sprint 59, file 751 separately, keep 667 blocked | yes | ✅ **APPROVED** 2026-08-16 |
| **3** | **D-B** `PerfDevOverlay` exclusion | yes |
| **3** | **D-D** state matrix | yes |
| **3** | **D-E** `inventory-gap` failure mode | yes |
| **3** | **D-F** static map is coverage-only | yes |
| **3** | **D-G** the `deliberate native wrapper` allowlist | yes |
| **3** | **D-I** disposition for non-rendering mount points | yes |

Phase 3 is requested **only if F1 passes**. Deciding a taxonomy for a mapping that cannot be produced spends
owner attention on nothing.

**D-G blocks hardest.** Two of the three categories are decidable from the DOM; `deliberate native wrapper`
asserts *intent*, and intent is not in the DOM. Until the owner supplies the allowlist or collapses the
category, every non-Mantine mount point falls to `migration candidate` and the inventory would overstate
the backlog.

**D-I is new, and D-A created it.** Adding the root layout brings in `MantineRootProvider`/`ModalsProvider`
(providers with zero host elements), `ColorSchemeScript` (an inline `<script>`), two
`<link rel=preconnect/dns-prefetch>`, and `SpeedInsights` (third-party). The three-way classifier cannot
express any of them, and its fallback rule would label the two `<link>` elements `migration candidate`.
Decision note §5.5 states the two candidate dispositions and recommends one.

Also unresolved: the worktree precondition (decision note §12) — clean isolated, or a dirty-worktree manifest.

**Non-decisional blocker — feasibility preflight F1** (decision note §5.2). The DOM→owning-component mapping
the classifier depends on was asserted, not tested: `__REACT_DEVTOOLS_GLOBAL_HOOK__` is a private DevTools
integration point, not a supported React API, and may be absent in a plain Chromium run. F1 must establish
whether any sound mechanism exists before the classifier is specified, against five pre-named control mount
points across three reloads on React 19.2.4, with exact automatic mapping required.

**An F1 failure means exactly one thing: in this build, a reliable automatic DOM→component mapping was not
demonstrated.** It does **not** mean an inventory is impossible, and it does **not** close this sprint.
Generalising a bounded negative result into a verdict on the goal would repeat the retracted audit's error
with the sign flipped. On failure the orchestrator returns the measurement and the candidate alternatives to
the owner; **closing or re-scoping Sprint 59 requires its own owner decision.**

## Registry state — deliberately not yet written

`docs/backlog.md:33`'s Sprints section does not list Sprint 59, and `:45` still reads `667 | reserved`.
That is **correct for now**: 667 is not `KICKOFF FILED`, so writing either would make the registry assert a
state that does not exist. Revision 1 of the decision note got this wrong in the opposite direction — it
declared `KICKOFF FILED` here while deferring the registry edit to the executor's post-implementation write
set. Both artifacts move together, at owner approval, in one edit.

## Execution order and gating

1. **667** — blocked. Order is the three phases above (decision note §0.1): owner Phase 1 → F1 → owner Phase 3
   → regenerate as an executable kickoff. No task-level dependency; the blocks are decisional plus one
   feasibility measurement.

## What this sprint explicitly does not authorize

- No de-Tailwind work, no component migration, no restyle, no token change.
- No sprint scoped off the inventory until the inventory is reviewed and approved.
- **No use of the retracted 2026-08-16 Opus homepage audit as an input.** It answered a different question
  (Tailwind-utility census, not Mantine composition); its probe produced three mutually inconsistent number
  sets across revisions; and its `check:design-tokens = 0` reading ignored 18 path-level allowlist entries
  and 119 inline suppressions. Withdrawn in full, including its Task 744 barrel list.
