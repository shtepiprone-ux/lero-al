# Sprint 62 — Tailwind runtime tokens outlive Tailwind

**Opened:** 2026-08-21 · **Status:** 🟠 OPEN

## Goal

Every CSS Module in this repository that consumes a Tailwind-owned custom property is holding a reference that
disappears the day Tailwind is removed — which is the stated purpose of the de-Tailwind programme. Nothing breaks
today; every such variable is present in the current build. The whole class is latent, and **no gate in this
repository can see it**.

The sprint's goal is therefore not "replace some variables". It is: **build the detector, then pay down the debt it
measures, in the order the detector makes safe.**

## Why a new sprint

Task 757R proved the class on `AuthSheet` and fixed it there. The goal-fit test against every open sprint was run
2026-08-21 and none fits: 46 is ListingCard-scoped, 55 is ARIA, 56 is enum leaks (closest *in kind* — also a
detector blind spot — but a different subject), 57 is deletion, 59 is route inventory, 60 closed the same day with
a homepage-scoped file set, 61 is the ledger projection layer.

## Binding rule for every task in this sprint

**The control ships before or with the fix, never after.** `docs/backlog.md`'s standing failure-mode note records
four tasks that failed identically — the fix was right, the control could not detect its own effect. Every task
here carries a two-armed plant that demonstrably fails, plus a pre-plant census proving no other gate would have
caught it.

**Exemptions are conditions the gate evaluates, never comments an author writes.** The existing
`design-tokens-allow:` marker mechanism is author-applied and is the attack surface named in `docs/backlog.md`'s
corollary (724 ②). Nothing in this sprint may add one as a way of passing.

## Tasks

**This table is the single source of task state in this file.** The execution-order table below is order and
gating only; it carries no state.

| # | Title | Priority | State |
|---|---|---|---|
| **762** | Tailwind runtime tokens in CSS Modules: the detector first, then the five modules | P1 | KICKOFF FILED 2026-08-21 |
| **763** | Categories B/C/D — `--text-*` theme typography, `--tw-*` utility internals, `--leading-`/`--ease-`/`--duration-` | P2 | NOT FILED — needs 762's gate and baseline to exist first |
| **764** | The degraded-perf-tier escape: `[class*="transition-"]` matches no CSS Module | P2 | NOT FILED — needs per-file historical evidence |

Numbers 763 and 764 are indicative, not reserved. Take the next free number from `docs/backlog.md`'s registry line
at filing time; it is the only authority.

## Execution order

Order and gating only — read state from the Tasks table above.

1. **762** first and alone. It creates `check:tailwind-runtime-tokens` and the baseline artifact that the other two
   are measured against, and it fixes the one category whose failure mode is outright (`transition-duration → 0s`).
2. **763** after 762. Its 58 references are exactly the contents of 762's baseline; the task is finished when the
   baseline file is empty and the gate still exits 0. That is a checkable end condition only because 762 built it.
3. **764** independent of both, but after 762 so its fix is measured by the same gate. It needs evidence 762 does
   not produce: whether each surface's pre-migration markup actually carried a `transition-*` class, because
   restoring a guard where none applied would be a new behaviour, not a restoration.

## Out of scope for the whole sprint

- `src/app/globals.css` — the tokens' definitions are Tailwind's to own until Tailwind is removed. This sprint
  changes consumers, never the source.
- Removing Tailwind itself. That is the programme this sprint serves, not a task within it.
- Any file outside `src/**/*.module.css` and the gate's own scripts.

## Provenance of the file list

Measured 2026-08-21 by a Python regex sweep over every `src/**/*.module.css`, counting `var(--…)` occurrences —
8 files, 67 references across four categories. **The method over-counts**: a `design-tokens-allow:` marker repeats
the token name on the same line, so an occurrence count is not a declaration count (category A is 12 occurrences
but 9 declarations). Every task in this sprint re-measures and states which number it reports. Each variable's
presence in the current build was verified by grepping its *definition* out of `.next/static/css/*.css`, not its
usage.
