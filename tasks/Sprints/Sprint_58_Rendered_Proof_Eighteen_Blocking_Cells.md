# Sprint 58 — The rendered gate's 18 blocking cells

**Opened:** 2026-08-15. **Owner decision, 2026-08-15 (this sprint's authorizing decision):** *"gate lishaietsia
blocking i spershu vypravliaiemo vsi 18 defektiv"* — the `Rendered Proof (Mantine)` CI job stays blocking with no
baseline-comparison mode, no `continue-on-error`, and no per-story exemption; the 18 product defects are fixed
instead.

Why not an existing sprint: **46** is ListingCard de-Tailwind + the overlay exit (D28/D34), **55** is ARIA
semantics, **56** is the raw-enum leak pair, **57** is pure removal. None has a goal these three components fit.
This sprint exists because the blocking CI gate and the product tree disagree, and the owner resolved that in the
gate's favour.

---

## The measured condition this sprint closes

`npm run screenshots:assert -- --mantine-only` — the exact CI-blocking invocation
(`.github/workflows/governance-pr.yml:153` job `Rendered Proof (Mantine)`, `:186` run line) — has produced the same
triple on every recorded run since Task 742:

```
Results: 1164/1204 PASS, 18 FAIL, 22 AMBIGUOUS   exit 1
```

The fail set is a set, not a count, and it is stable across independent runs (Task 741 review 2,
`docs/reviews/artifacts/2026-08-14-task741-review/screenshots-assert-mantineonly-failset-diff.txt`: `0 added /
0 removed`). Latest capture on this tree:
`.screenshots/rendered-assert/2026-08-15T05-29/manifest.json` (`summary.failed = 18`,
`summary.ambiguousOnly = 22`, `summary.offscreenControl = 2`, `summary.ambiguousOverlap = 22`).

| Story | Cells | Assertion that fails | Standing owner/route before this sprint |
|---|---:|---|---|
| `Admin/AdminUsersTable/Default` | 2 (`sq`,`uk` x `mobile-320`) | `noHorizontalOverflow: false` + `visualIntegrity` `offscreen-control` | **none** — never classified, never filed |
| `Mantine/Primitives/HeroSearch/Default` | 12 (4 locales x 320/375/390) | `fullWidthButtonsAtMobile: false`, `failingButtonLabels: ["2"]` | Task 724 §3.7 carve-out, routed to Sprint **49** (closed) |
| `Mantine/Primitives/NotificationBellView/Default` | 4 (4 locales x `mobile-390`) | `fullWidthButtonsAtMobile: false`, `failingButtonLabels: ["Mark all as read"]` | Task 724R **V4**, reverted on owner instruction 2026-08-07, released only by an owner decision superseding Task 593 |

## Goal

Take the `--mantine-only` fail set to **0** by fixing the three product defects, leaving the gate's own code,
scope, tolerance and exemption predicate byte-unchanged.

## Tasks

| Task | Scope, verified 2026-08-15 |
|---|---|
| **749** | All three components in one kickoff (owner decision 2026-08-15: one task, not three). Three independent mechanisms, one exit criterion. |

## Exit criteria

1. `npm run screenshots:assert -- --mantine-only` exits **0** with `18 FAIL -> 0 FAIL`, reported as a **set diff**
   against the 18-cell baseline above (D37 form), not as a count.
2. The **22 `AMBIGUOUS`** cells are untouched and still 22. They are `ambiguousOverlap` only, carry no product
   verdict, and are out of scope for this sprint. A change in that number is a regression to report, not a win.
3. `scripts/check-stories-rendered.mjs` has an **empty diff**. No new `MANTINE_PATTERN_KNOWN_FAILURES` entry, no
   change to `FULL_WIDTH_TOLERANCE`, no new exemption, no widened `isChipSetMember`, no story-id allowlist.
4. `.github/workflows/governance-pr.yml` has an **empty diff** for the `rendered-proof` job. The gate is not made
   skippable, non-blocking, or baseline-comparing by this sprint.
5. Every fix is a **CSS/layout change in product code**, proven by a planted-violation arm that can demonstrably
   fail — per the recurring-failure-mode rule in `docs/backlog.md`.

## Explicitly NOT in this sprint

- **The 22 `AMBIGUOUS` cells** (`popularlocationsview--long-city-name` x 16, `combobox--default` x 4,
  `tabs--default` x 2). Separate decision, separate number.
- **A baseline-comparison mode for CI** — the rejected half of the 2026-08-15 owner decision. Do not build it here
  "as well".
- **Task 738** (the horizontal-scroll blind spot, 729's residual 40). 738 is a *detector* gap for
  horizontally-scrolling containers; `AdminUsersTable`'s cells are a real document-level overflow the current
  detector already sees. Two numbers must not claim one defect.
- **The unscoped full `screenshots:assert` run.** `docs/storybook-governance.md:810` records its non-Mantine
  Phase-1 failures as a standing condition; this sprint's exit code is the `--mantine-only` one.
