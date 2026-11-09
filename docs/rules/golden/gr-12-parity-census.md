**Opus scope, owner decision 2026-10-20:**
[canonical-component-reuse.md](../../../.claude/rules/shared/canonical-component-reuse.md) exempts unchanged ready
canonical chrome from fresh whole-library measurement at design/review. Verify integration; run the affected census
for a changed shared visual contract or reproduced parity defect. The census/receipt requirements below follow that
scope, and an inherited-design record must not claim a new measurement.

**2. Cross-Story parity census, at three moments.** Before task design (Opus), before the first write (Sonnet) and
before any verdict (Opus), for every visible element type the task creates, changes or puts in the owner matrix
(badge, button, input, modal, table row, chip, alert, menu, …):
1. List every existing Story, in the whole of `storybook-static`, that renders the same semantic element: the same
   status value, the same control role or the same pattern.
2. Measure each one in the same locale and width: computed fill, text colour, border, radius, height, font size and
   weight, padding, and icon.
3. Compare them. Any two looks for one meaning, without a dated owner decision that names both contexts, is a finding.
   The executor returns `BLOCKED — GR-12`; the reviewer returns `NEEDS REVISION`.

The census is a script run on the built Storybook, never a reading of source. Its output is saved as evidence. The
first such script is [r8-badge-census.mjs of the Task 859 review 8](https://github.com/shtepiprone-ux/lero-al/blob/d8a07a3c7/docs/sessions/evidence/task859/review-8/r8-badge-census.mjs) (deleted from the working tree; the permalink keeps it).

**3. A kickoff never authorizes a local look.** A kickoff that names a colour, size or radius for one consumer, instead
of the canonical entry that owns it, is unpublishable. An executor who finds one stops with `BLOCKED — GR-12`.

**Receipt — task design, execution and review alike, one per element type in scope:**

`GR-12 ELEMENT PARITY — <element>: Stories compared <n> (census <path>); meanings <n>; meanings with more than one look: <list | NONE> (owner decisions: <ids | none>); hardcode in changed files and their Stories (style/styles/className/colour literal/raw string): <list | NONE>.`

With no receipt, or with a list that is not `NONE` and not raised as a finding, the response is void.

