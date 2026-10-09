## GR-3h — Objects keep their canonical spacing from each other, at every width

**Owner rule, 2026-10-09 (Task 859, review 13, owner visual check of `Patterns/Mantine/AdminSupportView`).** The
owner's words, verbatim: *"Не витримані відступи на мобільних екранах. Це пропустила Sonnet і ти вже протягом 13
рев'ю. Наразі бейджі притиснуті до заголовків. Необхідно внести у правильне місце у правилах, що об'єкти мають
витримувати канонічні відступи між собою, бо це буде повторюватись все життя!"* And, on the reviewer's first
measurement, which covered only 320 and 390: *"насправді бейджі не мають відступів починаючи з 767px, ти дуже паршиво
провів аудит"*.

**The trigger.** In the card form of every `AdminTable` (`MantineDataTableToCards`, below 768px) the title and the
subtitle are two plain `div`s with no gap (`MantineDataTableToCards.tsx:148-151`, `:169-173`), although §7.2 of
`docs/mantine-responsive-design-system.md` documents a title→subtitle gap. `AdminSupportView` puts its status and type
badges in that subtitle, so on every width from 320 to 767, in all four locales, 56 of 64 badges sat 0px under the
ticket title (`docs/sessions/evidence/task859/review-13/r13-spacing-names-full.json`). Thirteen reviews measured
widths, gutters, corners, type and parity. None measured the distance between two neighbouring objects, and the one
probe that came close sampled two widths.

**Definitions.**
- An **object** is anything with its own visible box: a badge, chip, button, icon button, icon, avatar, image, input,
  select, segmented control, card, divider, or a row of any of these.
- A **text block** is one or more lines of text with one meaning (a title, a subtitle, a label-and-value pair, a
  paragraph).
- Two items are **neighbours** when nothing visible sits between them on the vertical or horizontal axis inside the
  same container.

**Applies to:** every visible element in new or migrated UI, in every layout form (table, card, list, dialog, sheet,
page), at every width of the canonical matrix.

**Required.**
1. **Object ↔ object and object ↔ text block:** the gap comes from the spacing token of the component that lays them
   out, and is never smaller than `xs` (8px, `theme.spacing.xs`). This holds on both axes. A badge under a title, two
   badges in a row or a column, a badge under a line of meta text, and a button beside a field are all this case.
2. **Lines of one text block** (a title and its subtitle line, a label and its value): the gap is a token from the
   owner component (`micro`, `tight`), or the line-height of one text flow. It is never a raw value.
3. **One meaning, one gap.** The same pair of neighbours (for example status badge ↔ type badge, title ↔ first badge
   row) has the same gap in every layout form and every Story. A table cell and its card form are the same meaning.
   This extends GR-12.
4. **The gap lives in the owner.** A canonical layout component owns the gaps between its slots (for example
   `MantineDataTableToCards` owns title ↔ subtitle ↔ badge). A consumer does not repair a missing owner gap with a
   margin, a wrapper or a `Box mt`. A consumer slot holds the kind of content the owner documents: objects never go
   into a slot the owner documents as text.
5. **A missing gap is fixed at its owner**, with its direct Story, for every consumer at once (GR-0, GR-12).

**Forbidden.**
- Two neighbouring objects, or an object and a text block, with a gap below `xs`, including 0px, at any width.
- A gap set by a raw value, by `style`, or by a Story.
- Measuring this at a few widths and calling it done. The layout switches at breakpoints. One check below a switch
  says nothing about the next width up.

**Check, before handoff and at review, per changed component and every Story in the task's owner matrix.**
1. Run a probe on the built Storybook at **every width of the canonical matrix** (`docs/qa-profiles.md`) **and on
   both sides of every layout switch the component has** (for example 767 and 768 for `cardsBelow="md"`, 639 and 640
   for a `sm` switch). Run it in all four locales.
2. For every object, measure the gap to its nearest neighbour above, below, left and right inside the same container.
3. Record per width: the number of objects, the number with a gap below `xs`, the smallest gap, and the gap for each
   named pair across layout forms (rule 3).
4. Save a device-scale-1 screenshot of the worst width per layout form and look at it.

**Receipt — execution and review alike, one per changed component or matrix Story:**

`GR-3h OBJECT SPACING — <component/Story>: widths <list incl. both sides of each switch> × locales <list>; objects <n>; gaps below xs: <n | NONE>; smallest gap <px> at <width/locale>; named pairs <pair: gap per layout form>; owner of each gap <path:line>; evidence <path>.`

With no receipt, or with any gap below `xs` between objects, the executor returns `BLOCKED — GR-3h` and the reviewer
returns `NEEDS REVISION`. No automated gate measures this yet (GR-2). Geometry, gutter and parity receipts do not
cover it.
