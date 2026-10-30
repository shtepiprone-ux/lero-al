## GR-9 — A review is meticulous: every element, every state, every variant, every claim

**Owner rule, 2026-10-04 (Task 741, O46-2).** The owner returned all three matrix rows that Opus had handed over as
measured, then wrote: *"you do very poor reviews! Please review with quality and in more detail, because
you review superficially, and because of that I burn a lot of tokens! Write
a rule - a review is done very meticulously, with quality, in detail!"*

**What the shallow review missed, one row each:**
- **Rows 1–2:** the grid card and the list card of `ListingCard` are two hand-built markups, with two greys, a 10px
  vs 12px per-m² text and literal CSS values. Opus measured overflow, type scale, gutters and corners, but never
  compared the two variants.
- **Row 3, states:** the `ListingsShellView` Story rendered only `active` listings, while the page also shows `sold`
  and `rented` (the closed tab).
- **Row 3, "Show more":** the button was `size="lg"` with a hand-made `Loader`. `size="lg"` is not in the canonical
  `Mantine/Primitives/Button` Story, which shows `xs`/`sm` and the `loading` prop.

The owner found all three. The GR-3b…GR-3g receipts were green, because they measure geometry, not completeness or
canonicity.

**Applies to:** every review (`review-task`), every owner-matrix handoff, and every Story a kickoff lists for owner
review. It applies before the first finding and before the matrix reaches the owner.

**Required, per matrix Story, in this order:**
1. **Element census.** List every visible element the Story renders, including popups. Use the rendered DOM at 390 and
   1440, not the source alone. For each element, name its canonical owner: the production component plus its own Story,
   and the theme entry.
2. **Canonical trace.** For each element, compare every prop and value it uses with what its canonical Story and theme
   entry document: variant, size, colour, radius, spacing, loading/disabled mechanism and icon set. Each of these is a
   finding:
   - a value the canonical Story does not show;
   - a hand-made state (a `Loader` in `leftSection` where the canonical uses `loading`);
   - a literal value or a `style` object;
   - a feature-local chrome.
3. **State coverage.** Read the production data path (the query and its filters, every tab, every `status` the surface
   can receive). List every state the real surface can render, including empty, loading, error, each tab and each
   status. Then check that the Story renders each one. A Story that shows fewer states than production is a finding. A
   Story that shows a state production cannot reach is a finding too, unless the owner decided it.
4. **Variant parity.** Where one component renders in two or more variants or layouts (grid/list, desktop/phone, open/closed),
   compare them part by part with computed styles. Any part whose font, colour, spacing or token differs without a
   kickoff or owner reason is a finding.
5. **Claim check.** Open every evidence file the executor cites and check each claim against it, the executor's
   screenshots included. A claim its own evidence contradicts is a `CONTRADICTION` finding.
6. **Operate every control (owner rule 2026-10-08, Task 859 O78-13 return).** In a real browser at 1440 and 390, click,
   type into, select and toggle every interactive control the Story renders (filters, search, tabs, row actions, menus,
   pagination, dialog buttons), and record what changed on screen. Each of these is a finding:
   - a control that throws or puts Storybook into "Error rendering story" (for example a real server action reached
     from a Story);
   - a control that does nothing visible (for example a filter or a search that only calls `router.push`);
   - a state the Story shows that does not match what it claims (an "active filter" whose rows are not filtered).
   The fix is a presentational View with callbacks plus a stateful Story harness, never a disabled control or a
   removed Story. The owner found all three in `AdminUsersTable` after seven reviews had passed it.
7. **Only then** run the GR-3b…GR-3i measurements and hand the matrix to the owner.
8. **Width coverage (owner return 2026-10-09, Task 859 review 13: "the badges have no gaps starting from
767px, you did a very poor audit").** Every measurement in steps 1–7 that depends on layout runs at every width of the
   canonical matrix and on both sides of every layout switch the Story has (for example 767 and 768 where a table
   becomes cards). The reviewer measured badge gaps at 320 and 390 only and reported them as the phone result; the
   whole card range up to 767px had the defect. A sampled width is not a finding of absence.

**Forbidden:**
- handing a Story to the owner with any of steps 1–6 or 8 not done;
- writing "measured", "ready" or "verified" for a Story on the strength of geometry receipts alone;
- sampling: "the rest look the same" is not a check.

**Receipt — review, one per matrix Story, before the matrix is handed over:**

`GR-9 REVIEW DEPTH — <story id>: elements <n> (each → canonical owner); non-canonical props/values: <list | NONE>; production states <list> → rendered <list>, missing <list | NONE>, unreachable shown <list | NONE>; variant parity <pairs checked> → differences <list | NONE>; executor claims checked against their evidence <n>/<n>, contradictions <list | NONE>; controls operated <n> at 1440/390 → throws <list | NONE>, no visible effect <list | NONE>; evidence <path>.`

With no receipt, or with an item not `NONE` and not raised as a finding, the review is void, and the matrix does not
go to the owner. Task design applies the same census to the Stories a kickoff puts in the owner matrix (`create-task`),
so that a kickoff never asks the executor to preserve a non-canonical element.

