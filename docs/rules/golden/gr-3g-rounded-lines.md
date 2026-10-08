## GR-3g — A line follows a rounded corner; a clip never cuts it

**Owner rule, 2026-10-03 (Task 857, owner matrix O78-12).** The owner's words, verbatim: *"не приймаю, кути
обрізаються. Це постівйна проблема у тебе і Sonnet. Необхідно зробити правило, що якщо є бордер, він обов'язково має
бути заокругденим а не обрізатись!"*

The trigger was `MantineNavRowList`. Its list is a `Paper withBorder radius="md"` (6px, 1px border) with
`overflow: hidden`. The keyboard focus line of a row is an inset 1px `box-shadow` with square corners. At the list's
four outer corners, the clip cut that line diagonally, so the corner showed a gap instead of a curve
(`docs/sessions/evidence/task857/131-opus-navrow-corners-10x.png`). Opus's own 10× crop in review 10 showed the cut
corner, and Opus passed it, which is how the owner found it.

A **line** here means a border, an outline, or a `box-shadow` ring or border, in any state: rest, hover,
focus-visible, checked, selected, error or disabled.

**Applies to:** every line in new or migrated UI that sits inside a rounded ancestor which clips it: `overflow:
hidden` or `clip` on a `Paper`, `Card`, list, table wrapper, modal or drawer.

**Forbidden:**
- a line that meets a corner of a clipping ancestor while its own corner radius there is smaller than the
  ancestor's, so the clip cuts the line;
- fixing a cut corner by removing the ancestor's radius or clip, by moving the line outside the clip, or by hiding it
  in that state;
- a raw radius value. The radius comes from a token.

**Required:**
- Where an element's corner meets the corner of a rounded clipping ancestor, the element's own corner takes that
  ancestor's radius, through the ancestor's radius token. Inside a Mantine `Paper` that token is `var(--paper-radius)`,
  inside a `Card` it is `var(--card-radius)`, and elsewhere it is the same theme radius key the ancestor uses.
- The ancestor's radius is the right value even though the clip edge sits inside the ancestor's border. A curve with
  the larger radius stays inside the clip's curve, so it is never cut.
- The fix goes in the canonical component that owns the line, never in one consumer or Story.
- Corners that meet a straight edge of the ancestor keep their own design.

**Check, before handoff and at review:** for every changed component that draws a line, put it in each state that
draws the line, using Tab for focus. Test the first, the last and a single item where it is a list. Then:
- find every ancestor with an `overflow` other than `visible` and a non-zero `border-radius` whose corner the element's
  box touches;
- record that ancestor's radius and the element's computed radius on each touching corner;
- take a `deviceScaleFactor: 1` crop of each touching corner, scale it 10× with `image-rendering: pixelated`, save it
  as evidence and look at it. The line must run around the curve without a gap.

**Receipt — execution and review alike, one per changed component and state:**

`GR-3g CORNER CHECK — <component/state>: clipping ancestor <element, radius, border>; corners meeting it <list>; their radius <values>; DPR-1 corner crops <evidence path>; line cut at a corner: NONE.`

With no receipt, or with a cut corner, the executor returns `BLOCKED — GR-3g` and the reviewer returns
`NEEDS REVISION`. No gate measures this (GR-2). A computed `border-radius` on the ancestor says nothing about the
line inside it.

