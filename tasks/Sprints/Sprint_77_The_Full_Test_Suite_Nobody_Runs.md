# Sprint 77 — the full test suite is red, and no gate runs it

**Opened:** 2026-09-18 · **Status:** 🟠 **OPEN** · **Landed tasks:** 0 · **Active tasks:** 1

> **Opened by owner instruction, 2026-09-18:** *"напиши задачу для Sonnet в рамках Task 790, як revision 1, щоб
> Sonnet виправила тест, після виправлень нехай запустить тести"*.
>
> Task 790 was reserved on 2026-09-05 by 788's review **without a sprint** (the backlog row carried none, and
> Sprint 70's own Tasks table never listed it). The 2026-08-01 owner rule forbids a kickoff without a sprint, and no
> open sprint's goal fits (table below), so this sprint was opened in the same edit as 790's first kickoff.

## Why not an existing sprint — checked before opening this one

| Sprint | Its goal | Fits 790? |
|---|---|---|
| **46** | ListingCard de-Tailwind + overlay exit | No — a UI migration; 790 changes no visible artifact. |
| **55** | ARIA semantics no gate sees | No — accessibility semantics, not test-suite health. |
| **56 · 57** | Raw enum leaks / delete what no longer earns its place | No — 56 is a locale-leak detector; 57 is pure removal proven inert. |
| **61 · 62** | Projection layer no gate reads / Tailwind runtime tokens | No — both are specific gate families, not the unit-test suite. |
| **68 · 69** | `/listings` leaves Tailwind | No — surface migration. |
| **70** | The site chrome leaves Tailwind | **Closest, and still no.** 790 was *filed* by 788 in this sprint and its first failure sits in `FooterView.tsx`, but the defect is a test assertion, not chrome, and 790's other failures (`ListingCard.smoke`, an evidence-folder test) have nothing to do with the header/footer. |
| **71 · 72 · 73 · 74** | Listing-detail de-Tailwind / similar listings / sold reachability / card width | No — surface or feature work. |

## Goal

`npm run test` (`vitest run`) — the whole suite — **exits 0, deterministically**, with every failure resolved by an
explicit per-failure decision: the **test** was wrong, or the **source** was wrong. Then decide, in writing, whether
the full suite joins the standing gate set, so a red suite can never again sit unnoticed across a dozen tasks (the
`footerGridGap` failure appears as `×` in retained transcripts of 775, 782, 788, 791, 797, 803, 807–810, 813, 822,
825 and 842 — every one waved it through as "known-red").

The narrower point: **a source-text assertion is a detector, and a detector has blind spots.** 790 R1 is the proof
case — a substring check that a type-only `!` defeats (false red), sitting beside an entry that passes on a comment
(false green).

## Tasks

> **This table is the single state source for the sprint.** Read state here, not from the kickoff.

| # | Title | Priority | QA | State |
|---|---|---|---|---|
| **790 · R1** | `theme.d69-18` contract check tolerates TypeScript non-null assertions — `FooterView` `footerGridGap` false red | **P1** | **Q1** | ↩️ **NEEDS REVISION** 2026-09-18 — review 1: implementation holds (AC1–AC7); evidence-only Revision 1 → kickoff §16 → [`Sprint_77_kickoff_prompt_Task_790_R1_…`](Sprint_77_kickoff_prompt_Task_790_R1_FooterView_Non_Null_Source_Assertion.md) |
| **790 · rest** | Every other full-suite failure, per-failure test-vs-source decision; the comment-only `theme.breakpoints.lg` needle; the non-deterministic group; the standing-gate decision | **P1** | TBD | reserved — kickoff not yet written. Scope in `docs/backlog.md` → registry row **790**. |

## Execution order

**790 R1 first.** It is independent of every other failure (one test file, no source change) and removes the one
failure every task has been citing as "known-red", so later slices start from a smaller, honest baseline. The rest
of 790 is written only after R1 lands, against a fresh full-suite measurement — never against counts in this file.

## Preconditions

- Native Windows PowerShell; `node.exe -p process.platform` returns `win32`.
- `npm run build` can run locally (every non-Q0 task carries it).

## Exit criteria

1. `npm run test` exits 0 on **three consecutive runs** with no source change between them.
2. Every failure that existed at the sprint's opening has a recorded disposition — *test wrong* or *source wrong* —
   in a session log, with its fix.
3. No test was deleted, skipped (`.skip`, `.todo`, `it.fails`) or loosened to reach criterion 1 without an owner
   decision quoted with its date.
4. The standing-gate decision for the full suite is recorded in `docs/binding-decisions.md` or as an owner row.
