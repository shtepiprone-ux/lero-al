## GR-3h — Vertical rhythm: every block keeps its container's canonical spacing, or the task is not done

**Owner rule, 2026-10-09 (Task 859, review 13, owner visual check of `Patterns/Mantine/AdminSupportView`).** The
owner's words: *"The gaps on mobile screens are not kept. Sonnet missed this, and so have you, for 13 reviews.
Right now the badges are pressed against the headings. It must be put in the right place in
the rules that objects must keep the canonical gaps between each other, because this will keep repeating forever!"*; on the reviewer's first measurement,
which covered only 320 and 390: *"in fact the badges have no gaps starting
from 767px, you did a very poor audit"*; and on the reviewer's first draft of this rule, which invented a minimum gap of `xs` instead of using the
card's own rhythm: *"This is complete bullshit, the gap must be the same as between the badge and the separator."* · *"So write it into the rules that the vertical rhythm
must be kept, otherwise the task cannot be complete!"*

**The trigger.** The admin record card (`MantineDataTableToCards`, below 768px) stacks its sections — header, divider,
primary row, divider, detail — in one `Stack gap="sm"`: **12px** between every section (measured,
`docs/sessions/evidence/task859/review-13/r13-card-rhythm.txt`). Inside the primary row, the title and the subtitle are
two plain `div`s with no gap, and `AdminSupportView`, `AdminListingsView`, `AdminReportsView` and the synthesized
`AdminTable` card put their badges in that subtitle. The badges therefore sat 0px (1px in reports) under the title and
12px above the divider, on every width 320–767. Thirteen reviews measured widths, gutters, corners, looks and parity;
none measured the rhythm.

**The principle.** A container has one vertical rhythm: one spacing token between its blocks. The eye reads equal
spacing as "same level"; a block closer to one neighbour than to the next reads as belonging to it. A badge row
pressed against a title and 12px from the divider below it breaks the card into wrong groups.

**Definitions.**
- A **container** is a component that stacks blocks vertically: a card, a table cell, a dialog body, a sheet, a form
  section, a page section. Its **rhythm** is the spacing token it uses between its blocks (for the record card, `sm`
  12px; it is read from the owner's source and confirmed by measurement, never chosen by the task).
- A **block** is one step of that stack: a text block (a title with its own secondary text line, a paragraph, a
  label-and-value pair), a **row of objects** (badges, chips, buttons, icons, avatars, inputs, or text mixed with them),
  a divider, a control, a nested card.
- Lines **inside one text block** (a title and its secondary text line) are not rhythm steps; they keep the text
  block's own spacing.

**Required.**
1. **Every gap between two blocks of one container equals that container's rhythm token**: block ↔ block, block ↔
   divider, divider ↔ block — the same value. A row of objects under a title is its own block, so title ↔ badge row
   equals badge row ↔ divider.
2. **The container's owner places each block as a step of its own rhythm** (for example a child of the card's
   `Stack gap="sm"`), so the equality holds by construction. A slot that can receive a row of objects is a rhythm
   step in the owner; objects never go into a slot the owner documents as a text line.
3. **One rhythm per kind of container.** The same kind of container (every admin record card; every records-table
   cell that stacks blocks) uses the same rhythm token in every Story and surface. A table cell and its card form show
   the same record, so they use the same rhythm token (GR-12).
4. **Horizontal neighbours in one row** (badge beside badge, button beside button) use the row owner's gap token,
   the same in every context (GR-12).
5. **The fix is in the owner**, with its direct Story, for every consumer at once (GR-0, GR-12). A consumer never
   repairs a gap with a margin, a wrapper, a `Box mt` or a Story decorator.

**Forbidden.**
- Any gap between two blocks of one container that differs from the container's rhythm, at any width.
- A gap invented by the task (a "minimum" or a value that looks right), a raw value, `style`, or a Story-written gap.
- Measuring at a few widths and calling it done: the layout switches at breakpoints, and one width below a switch says
  nothing about the next width up.

**A task that breaks the rhythm cannot be completed (owner, 2026-10-09).** The executor returns `BLOCKED — GR-3h`
and may not report `IMPLEMENTED`; the reviewer returns `NEEDS REVISION` and may not approve or hand the owner matrix
over. No other gate, receipt or owner-matrix step outweighs this.

**Check, before handoff and at review, per changed component and every Story in the task's owner matrix.**
1. Read the container's rhythm token from the owner's source and confirm it by measurement.
2. On the built Storybook, at **every width of the canonical matrix** (`docs/qa-profiles.md`) **and on both sides of
   every layout switch** (for example 767 and 768 for `cardsBelow="md"`, 639 and 640 for an `sm` switch), in all four
   locales: for every container, measure the vertical gap between each pair of consecutive blocks (dividers
   included), and the horizontal gap between neighbours in each row.
3. Record per container: the rhythm token, every distinct block gap measured, and every gap that differs from the
   rhythm. Save a device-scale-1 screenshot of the worst width per layout form and look at it.

**Receipt — execution and review alike, one per changed container or matrix Story:**

`GR-3h VERTICAL RHYTHM — <container/Story>: rhythm token <name = px> (<owner path:line>); widths <list incl. both sides of each switch> × locales <list>; block gaps measured <distinct values>; gaps off the rhythm: <n | NONE>; horizontal row gaps <pair: px>; evidence <path>.`

With no receipt, or with any gap off the rhythm, the task is not done: `BLOCKED — GR-3h` (executor), `NEEDS REVISION`
(reviewer). No automated gate measures this yet (GR-2); geometry, gutter and parity receipts do not cover it.
