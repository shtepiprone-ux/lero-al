# Sprint 66 — `/listings` mobile overflow

**Opened:** 2026-08-27 · **Status:** 🟠 **OPEN** · **Landed tasks:** 0

> ⚠️ **Number correction, same day.** This task was first written as 771. While it was being written, a parallel
> session filed **771** into Sprint 65 (global Tailwind retirement readiness) and updated that sprint's Tasks table
> **without advancing the registry heading**, which still read `NEXT FREE 771`. The collision was caught before
> either kickoff was dispatched; this task is **772** and the registry now reads `Last used 772, NEXT FREE 773`.
> This is the 2026-08-10 fourth-occurrence corollary again: a number is allocated in the registry, in the same edit
> as the kickoff, or it is not allocated at all.

> **Opened by owner decision, 2026-08-27** — *"FILE ONE NEW P1 TASK. Scope only ListingsSortBar mobile layout."*
> The 2026-08-01 owner rule forbids writing a kickoff without a sprint, and no open sprint fits. This file and
> `docs/backlog.md`'s Sprints section, registry row and Pending Action Item were written in the **same edit** as the
> kickoff, per the 2026-08-10 fourth-occurrence corollary.

## Why not an existing sprint — checked before opening this one

| Sprint | Its goal | Fits 772? |
|---|---|---|
| **46** | ListingCard de-Tailwind + overlay exit | **No.** Different surface, and **D28** binds it to mechanism-only changes at zero visual delta. 772 must change mobile layout, which is a visual delta by definition. |
| **55** | ARIA semantics no gate sees | **No.** Semantics, not geometry. 772 changes no role and no accessible name. |
| **56** | Raw enum leaks and the blind detector | **No.** Localization/detector subject. |
| **57** | Delete what no longer earns its place | **No.** Pure removal; 772 changes layout and must preserve every control. |
| **61** | The projection layer no gate reads | **No.** Markdown/ledger projection, not UI. |
| **62** | Tailwind runtime tokens outlive Tailwind | **No.** Token-emission mechanism; 772 is explicitly **not** a de-Tailwind task (owner: "No unrelated de-Tailwind or component migration"). |
| **65** | Homepage finishes the Tailwind exit | **No.** Homepage surface, and it is closed to new work that is not the global-retirement decision. |

No open sprint fits. Opened 66 rather than attaching 772 to the nearest number.

## Goal

`/listings` must not scroll horizontally on a phone, in any of the four locales, with its filters and sort still
usable and their touch targets at the 44px floor.

The narrower point this sprint exists to prove: **the fix carries route-level mobile evidence, not a Storybook
proxy.** Per the owner decision of 2026-08-27 (`docs/maintenance-playbook.md` §14.3) there is no route-composition CI
gate and none will be built, so a route-critical change carries **task-scoped route evidence** produced for that
change. This sprint is the first one filed under that rule, and its evidence tooling is deliberately task-owned —
modelled on `scripts/task766-route-shell-probe.mjs`, which exists for the same reason.

## Tasks

> **This table is the single state source for the sprint.** The execution-order section below is order and gating
> only; it carries no state.

| # | Title | Priority | State |
|---|---|---|---|
| **772** | `ListingsSortBar` mobile overflow — bounded layout fix plus route-level proof | **P1** | **KICKOFF FILED** 2026-08-27 — `Sprint_66_kickoff_prompt_Task_772_ListingsSortBar_Mobile_Overflow.md` |

## Execution order

Order and gating only — read state from the Tasks table above.

1. **772** alone. It measures the defect before it changes anything, fixes only `ListingsSortBar`'s mobile row, and
   re-measures with the same probe. Nothing else is in this sprint.

## Preconditions

- A routable server (`next start` against a production build, or `next dev`) and a seeded database with **at least
  two pages of listings**, so `total`, `from`–`to` and the pagination-dependent strings render at realistic width.
  A zero-result page hides `showing_results` (`ListingsSortBar.tsx:52`) and is **not** a sufficient measurement.
- The four locales `sq` · `en` · `uk` · `it` all resolve on `/listings`.
- **For the authenticated cells only:** `TASK772_AUTH_STORAGE_STATE` points to a local, untracked Playwright
  storage-state file with a valid authenticated session. If it is absent or the session does not validate, the task
  records `AUTH_STATE_UNAVAILABLE` and finishes `BLOCKED`; the authenticated acceptance criterion may not be claimed
  as passed by any other means. The anonymous cells are measured regardless.

## Exit criteria

1. On the real `/listings` route at **320 · 375 · 390** in **all four locales**,
   `document.documentElement.scrollWidth <= document.documentElement.clientWidth + 2`.
2. The filters trigger and the sort control remain **usable** — each opens its panel and a sort selection still
   changes the `sort` query parameter.
3. Every interactive control in the sort bar reports a rendered height **>= 44px** at those widths.
4. The before/after evidence is retained per width, per locale, and per authentication state, and the "before" run
   demonstrably reproduces the defect it claims to fix. A width/locale cell where the defect does **not** reproduce
   is recorded as such — never dropped.
5. No unrelated de-Tailwind, no component migration, and no change to `SaveSearchButton`, the filters sheet contents
   or the desktop layout. A residual overflow attributable to a sibling of the sort bar is **reported as a finding**,
   not fixed here.
