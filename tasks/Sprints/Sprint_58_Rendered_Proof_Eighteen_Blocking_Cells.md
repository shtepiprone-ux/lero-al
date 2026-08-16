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
| **749** | All three components in one kickoff (owner decision 2026-08-15: one task, not three). Three independent mechanisms, one exit criterion. **`APPROVED WITH NOTES`, 9/9 VERIFIED, merge pending** — the final route is AdminUsersTable `ScrollArea`, HeroSearch three-band control, NotificationCenter 390→640, then Revision 2's measured scroll-aware gate correction and Revision 3 evidence remediation. PR #8 has 7/7 checks green; P3 notes route to follow-up 750 rather than blocking this landing. |

## Exit criteria

1. `npm run screenshots:assert -- --mantine-only` exits **0** with `18 FAIL -> 0 FAIL`, reported as a **set diff**
   against the 18-cell baseline above (D37 form), not as a count.
2. **Amended 2026-08-15 (Revision 1).** The **22 pre-existing `ambiguousOverlap`** cells are untouched and diff to
   `0 added / 0 removed`. They carry no product verdict and are out of scope. **One permitted addition:** up to
   **+2 `ambiguous-offscreen`** cells (`AdminUsersTable × {sq,uk} × mobile-320`), if and only if the owner-elected
   `ScrollArea` mechanism (owner decisions D-5/D-6, 2026-08-15) resolves there — the gate's own designed category
   for swipe-scrollable tab strips (`geometry-integrity.mjs:383-396`). The original criterion said "still 22" and
   was written before the theme's `flexWrap: 'nowrap'` owner-P0 rule (`theme.ts:830`) had been read. Any other
   movement in that set is still a regression to report, not a win.
3. **Amended 2026-08-15 (owner D-8, Revision 2).** The gate is not made skippable, non-blocking, or
   baseline-comparing, and no per-story exemption is added. `FULL_WIDTH_TOLERANCE`, `isChipSetMember`, the viewport
   sets and `MANTINE_PATTERN_KNOWN_FAILURES` stay byte-unchanged. **Two authorised gate diffs:**
   `geometry-integrity.mjs` Checks 1 and 3 gain the scroll-awareness Check 2 already has, and the Task 529
   `GEOMETRY_ALLOWLIST` row for `mantine-primitives-tabs--default` is **retired** — replaced by that DOM-measured
   predicate, the same allowlist→predicate direction Tasks 724R and 726 took. The original criterion forbade any
   diff here; it was written before the detector was enumerated.
4. `.github/workflows/governance-pr.yml` has an **empty diff** for the `rendered-proof` job. The gate is not made
   skippable, non-blocking, or baseline-comparing by this sprint.
5. **Amended 2026-08-15 (Revision 2).** Every **product** fix is a CSS/layout change in product code, and the one
   authorised **gate** fix (criterion 3) is a DOM-measured predicate, never an allowlist row. Both kinds need a
   two-armed plant that can demonstrably fail — per the recurring-failure-mode rule in `docs/backlog.md`.

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
