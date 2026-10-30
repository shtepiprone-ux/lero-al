## GR-11 — Every rounded corner renders as a smooth curve, like the reference

**Owner rule, 2026-10-04 (Task 741, O46-3 rows 3–4).** Their words: *"Write a mandatory rule - if the corners of an object are not rounded, the task
is not accepted. They are not rounded, they look as if they were cut wrongly!"* and *"the problem with rounded corners is global! … A
mandatory rule on rounding the corners of objects (buttons,
tables, elements and so on) must be written once."* Also: *"in TailWind and in all the other references the corners are rounded superbly. The problem is only in my project."*

**What was measured** (`docs/sessions/evidence/task741r3/rev3g/owner-return/`, Chromium, DPR 1, 8px radius). The
coverage of the corner's diagonal pixels, where an ideal 8px arc gives 60/75/60:

| Corner | Diagonal coverage |
|---|---|
| TailAdmin active page control (fill, no border) | 53/85/53, smooth |
| lero.al active page control (fill plus a 1px border in the same colour) | 37/50/38, notched: reads as cut |
| fill plus a transparent border | 53/85/53, smooth |
| 1px gray-300 border at Mantine's disabled `opacity: 0.4` | 13–15: the corner almost vanishes |

The radius value was right (8px in both). The corner broke because of how the shape is painted.

**Applies to:** every object with a rounded corner in new or migrated UI, in every state (rest, hover, focus-visible,
active/selected, checked, disabled, error, loading). That includes buttons, page controls, inputs, selects, chips,
badges, cards, papers, tables and table wrappers, modals, drawers, popovers, menus, images and avatars. GR-3f (circles)
and GR-3g (lines inside a rounded clip) are special cases of this rule and stay in force.

**Forbidden:**
- a radius that is not a theme token (`theme.radius.*`, `var(--mantine-radius-*)`, or the component's own radius
  variable);
- **a border in the same colour as the fill** on a rounded shape. A filled shape draws no border, or a transparent
  one;
- **fading a bordered or filled rounded shape with `opacity`** (a disabled state included). The disabled look uses
  colour tokens for the text, border and fill, so that the corner keeps its contrast;
- a corner that differs from the reference's equivalent at the same DPR: notched, stepped, chamfered, faded or
  vanished;
- fixing a corner in one consumer or Story. The fix goes in the canonical theme entry, chrome stylesheet or pattern.

**Check, before handoff and at review:**
- For every changed rounded object, in every state it has, take a crop at `deviceScaleFactor: 1` and `1.25`, the
  default Windows scaling.
- Scale each crop 10× with `image-rendering: pixelated`, and place it beside the reference's equivalent at the same DPR.
- Measure the diagonal coverage of one corner (the model is `rev3g/owner-return/corner-pixels.mjs`). It must be
  within 10 points of the reference's, or of the ideal arc for that radius where no reference element exists.
- Save the crops and the numbers as evidence, and look at them.

**Receipt — execution and review alike, one per changed rounded object and state:**

`GR-11 CORNER CHECK — <object/state>: radius <token → px>; fill/border <colours>; opacity <1 | value>; DPR 1 diagonal <a/b/c> vs reference <a/b/c>; DPR 1.25 crop <path>; reads as a smooth curve like the reference: yes.`

With no receipt, or with a corner that fails, the executor returns `BLOCKED — GR-11` and the reviewer returns
`NEEDS REVISION`. Every kickoff that changes a rounded object lists it with this check. Existing objects outside a
task's scope are being fixed by **Task 920** (Sprint 90). Until 920 lands, a task that touches such an object fixes it
in its canonical source within that same task.

