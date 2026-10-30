## GR-3f — A circle renders as a circle

**Owner rule, 2026-10-02 (Task 857 review 5, O78-12 return).** The owner's words: *"I have repeated many times about the icons. A circle must be a
circle … Right now I visually see a polygon, not a circle. And
do not lie to me, I trust my own eyes more."* Then: *"radio buttons must have a circle in the component, no
hardcode in just one popup, it must be fixed globally"*.

The trigger: the `PremiumDialogView` radios. Their CSS was a circle (`border-radius` equal to the 16px box). Opus's
pixel crop at device scale 1 (`docs/sessions/evidence/task857/101-radio-variants.png`) showed what the owner saw:
- the 1px pale ring at 16px rasterised as facets;
- the 6px checked dot (Mantine `xs`) rasterised as a rounded square.

A computed `border-radius` is not evidence of a round shape. Only the rendered pixels are.

**Canonical radio, owner decision 2026-10-02 (option chosen verbatim):** *"20px circle, 10px dot (Recommended)"*. It
replaces `docs/tailadmin-style-reference.md` §6g's 16px circle and 8px dot. It is set once in the `Radio` theme entry
(`src/design-system/mantine/theme.ts`) and proven by `Mantine/Primitives/Radio`. A size, dot or border override in a
consumer or a Story is forbidden.

**Applies to:** every circular control or indicator in new or migrated UI: radio, status dot, count dot, avatar
placeholder, and circular icon chrome.

**Forbidden:**
- shipping a circular element whose device-scale-1 crop shows facets or a squared inner shape;
- fixing that in one consumer instead of its canonical component or theme entry.

**Check, before handoff and at review:** take a Playwright screenshot at `deviceScaleFactor: 1` of each changed circular
element, in both states where it has two. Scale the crop 10× with `image-rendering: pixelated`, save the image as evidence,
and look at it. The ring and any inner dot must read as circles.

**Receipt — execution and review alike, one per changed circular element:**

`GR-3f CIRCLE CHECK — <component/state>: outer <px>, inner <px | none>; DPR-1 crop <evidence path>; reads as a circle: yes.`

With no receipt, or with a faceted crop, the executor returns `BLOCKED — GR-3f` and the reviewer returns
`NEEDS REVISION`. No gate measures this (GR-2): `check:design-tokens` and computed styles cannot see rasterisation.

