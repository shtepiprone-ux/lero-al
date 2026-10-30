## GR-10 — No canonical component, or a canonical that differs from the original: the work is not accepted

**Owner rule, 2026-10-04 (Task 741, O46-3).** The owner returned `ListingsShellView`, which still rendered the
hand-built listing cards in grid and list. Their words: *"Write yourself a golden rule: if there is no canonical component, or it does not match
the original - do not accept the work as quality work (this applies to all tasks!)!"*

**Applies to:** every task, at task creation, execution and review, and every Story handed to the owner.

**Forbidden:**
- accepting, approving, or handing to the owner matrix a surface that renders a visible element with no canonical
  component of its own (canonical owner + its own Story + manifest entry, GR-1/GR-3);
- the same where the canonical component exists but differs from its original, part by part (layout, size, colour,
  radius, border, shadow, spacing, states). The original is the owner's reference where one was given (for example
  Rozetka), otherwise the GR-7 references, with TailAdmin as the visual source;
- deferring either of these to a later task as a reason to accept the current one. A later task can own the fix, but
  the current task stays unaccepted until the fix has landed and the surface has been re-checked.

**Required:** every kickoff names, for every visible element of every in-scope surface, its canonical owner and the
original it must match. The review compares the two part by part, with computed styles and DPR-1 crops placed side by
side.

**Receipt — task design, execution and review alike, one per surface:**

`GR-10 CANONICAL MATCH — <surface/Story>: elements <n>; with canonical owner <n>/<n>; matching the original <n>/<n> (original per element: <reference page>); missing or differing: <list | NONE>.`

With anything but `NONE`, the kickoff is not publishable, the executor returns `BLOCKED — GR-10`, and the reviewer
returns `NEEDS REVISION`. No gate measures this (GR-2).

