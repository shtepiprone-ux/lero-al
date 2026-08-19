# Sprint 61 — The projection layer no gate reads

**Opened:** 2026-08-19. **Why now:** Task **747** has been reserved `P1` since 691's review (2026-08-12) with
"needs a sprint" against it, and no open sprint fits.

Goal-fit test against every 🟠 OPEN sprint, 2026-08-19:

| Sprint | Goal | Fits 747? |
|---|---|---|
| 46 | ListingCard de-Tailwind + overlay exit; open only for 743 / 744 / 745 / 748 | no |
| 55 | ARIA semantics no gate sees | no — same *shape* of blindness, different subject (rendered a11y, not documents) |
| 56 | Raw enum leaks and the blind detector | no |
| 57 | Delete what no longer earns its place | no — 747 builds, it does not remove |
| 59 | Route-level inventory before any migration claim | no |
| 60 | Homepage: Mantine completion and Tailwind residue | no |

---

## Goal

Every gate this repository owns reads **code or rendered output**. None reads the **documents that describe the
state of the work** — and those documents are what the next session acts on. Close that gap for the one claim
class where a machine-checked source of truth already exists: a review ledger's validator-derived
`review.coverage`.

## Tasks

| Task | Scope |
|---|---|
| **747** | Make a *live* state claim in markdown machine-checkable against the ledger that owns it. Design the source-of-truth and the assertion format **first**; build the checker only after that design is approved. |

## Exit criteria

1. A written design decision exists — with the rejected alternatives and the reason each was rejected — **before**
   any checker code is written, and the owner has approved it.
2. The control is **bidirectional**: it fails when the markdown drifts from the ledger *and* when the ledger moves
   while the markdown stands still. Both arms are proven by a planted violation that is then restored.
3. **Archive rows, historical prose, retracted claims and superseded ledgers are never rewritten and never
   flagged.** A control that forces history to be edited is worse than the drift it replaces.
4. No grep for `N P0`. The deliverable is *how a live claim is marked machine-checkable at all* — not a pattern
   that guesses at English.
5. The two measured 691 instances are used as the acceptance fixtures, not as anecdotes.

## Explicitly NOT in this sprint

- **746** — the reserved text forbids folding it in; it is a rendered-hover detector, unrelated mechanism.
- **750** (the `ambiguousOverlap` counter that prints as one reason but aggregates five) is the *same family* —
  a number that reads as coverage — and would fit this sprint's goal, but it is not assigned here. Assign it
  deliberately after 747 lands, or not at all; do not let it drift in as scope creep.
- Rewriting or "correcting" any historical record to satisfy the new control.
