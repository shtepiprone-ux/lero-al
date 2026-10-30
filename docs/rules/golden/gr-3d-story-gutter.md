## GR-3d — A Story shows the component at its real distance from the screen edge

**Owner rule, 2026-09-29.** Task 877: the owner returned O78-6 and wrote: *"Also, it must be put into the rules that when a Story is created, the
canonical gutters from the screen edges must be kept! This is a constant problem. And
these Stories are no exception, they have this problem too! It must be fixed!"* The same day: *"it will be enough to make one and the same profile for all
Stories, so that they always have the same gutter from the screen edges"*. Hardened
the same day: *"A strict rule must be put in place so that Sonnet has no right to ignore it!"*

**Clarified by the owner, 2026-10-01 (Task 890 review 2):** *"I asked for a unified gutter in the Story so that I understand how
this component will look on a real page. If the component already has its
own native gutter, then no gutter should be added in the Story."* The earlier text of this rule made `StoryPageGutter` the default and
then carved out narrow exemptions (O83-3, O83-4, O83-5, D78-10) one component at a time. Wrapping a component that
already has its own gutter doubled the gutter. This version replaces all of that with one question.

**Four sides, owner instruction 2026-10-01 (Task 890 review 3):** *"the test must measure all 4 sides, and
if there is no gutter - add one"*. The trigger was `Patterns/Mantine/DashboardGrid`: its left and right edges were
correct, so every measurement passed, while the cards touched the top of the canvas. Until then this rule and every
probe measured only left and right.

**Purpose.** The owner reads a Story to see how the component will look on the real page. So the content sits at the
same distance from the screen edge as in production, on **all four sides**: never touching an edge, never doubled.

**The question, asked per side (top, right, bottom, left): does the rendered content already set its own page gutter
on that side in production source?** "Own gutter" means one of these sets the page padding on that side:
- the component's root, with Mantine spacing props (for example `MantineDashboardGrid.tsx:56`
  `px={{ base: 'md', md: 'xl' }}` — left and right only; or `ResetPasswordView`'s `Center p="md"` — all four);
- the canonical `.container-wide` page container (`src/app/globals.css:714-724`) — left and right only;
- a production parent that the Story renders under GR-3b (for example the real `AdminShell`).

A card's or paper's internal padding is not a page gutter.

| Answer | What the Story does | Receipt value |
|---|---|---|
| **All four sides have their own gutter** | Adds nothing: no `StoryPageGutter`, no padding, no wrapper. | `n/a: own gutter (<path:line>)` |
| **No side has its own gutter** | A `skipCanvas` Story wraps the page content in `<StoryPageGutter>` in every export, or keeps the default canvas. | `StoryPageGutter all` / `n/a: default canvas` |
| **Some sides have their own gutter, some do not** | Adds the profile **only on the missing sides**: `<StoryPageGutter sides="y">` when only top/bottom are missing, `sides="x"` when only left/right are missing. | `StoryPageGutter y (own x: <path:line>)` / `StoryPageGutter x (own y: <path:line>)` |
| Overlay only (modal, drawer or bottom sheet in a portal) | Nothing. A Story with page content **and** an open overlay answers the question for the page content. | `n/a: overlay-only` |
| `Mantine/Primitives/*` on `MantineStoryShell` | Nothing (known exception below). | `n/a: MantineStoryShell primitive` |

**Shell chrome. Owner decision 2026-10-01 (Sprint 87 D87-1), option chosen:** *"A named exception
list (Recommended)"*. Stories of shell chrome that the real page places at the screen edge (header, navbar, sidebar,
drawer) are on a named list in the gate (Task 909), each with its reason, printed on every run: `AdminHeader`,
`AdminSidebar`, `AdminLocaleSwitcher`, `AdminShell`. Only the owner adds to it. Every other Story has a gutter on all
four sides.

**When the real page is missing the side too.** If the Story renders the page container itself (a page-level View or
the dashboard grid) and the production page shows the same missing side, the defect is in production. Fix the side in
the component, and the Story then adds nothing for it. Adding it only in the Story would hide a production defect.

**The profile.** `StoryPageGutter` (`src/stories/_StoryPageGutter.tsx`) is the one gutter a Story may add. It renders
`<Box px={{ base: 'md', sm: 'xl', lg: '2xl' }} py="xl">`: 16px, then 24px from 640px, then 32px from 1024px, with 24px top
and bottom. That copies the default Storybook canvas (the `.container-wide` ladder with `py-6`, `.storybook/preview.tsx`
`withCanvas`), so wrapped and default-canvas Stories sit at the same distance. Above 1536px, `.container-wide` has a
48px rung that Mantine cannot express. Its one optional prop, `sides` (`'all'` default, `'x'`, `'y'`), selects which
axes it pads. It never changes a value. Task 909 adds the prop; until it lands, a Story that needs one axis only is
reported as `BLOCKED — GR-3d sides` rather than given a hand-written padding.

**Scope, with no exceptions:** every Story a task **creates**, **changes**, **renders a changed component in**, or
**lists in its owner visual matrix**, including blast-radius rows. A Story in that scope that breaks this rule is fixed
in the same task. The executor needs no kickoff permission, may not hand off around it, and may not report it as "not
changed by this task". A kickoff's GR-3d line written before 2026-10-01 is still answered against the question above.
Where the content turns out to carry its own gutter, this rule wins over a `wrap in this task` line, and the executor
records the deviation.

**Forbidden in any in-scope Story:**
- content that touches any of the four edges (no gutter on that side);
- **a doubled gutter**: `StoryPageGutter`, or any padding, on a side where the content has its own gutter;
- a gutter written in the Story itself: `p`, `px`, `py`, `pt` or `pb` on a `Box`/`Stack`/`Group` in `decorators` or
  `render`, a `container-*` class, or a `style` object;
- a second gutter helper, or a profile value other than `StoryPageGutter`'s.

**Known exception, not yet unified:** `Mantine/Primitives/*` Stories use `MantineStoryShell`, whose gutter is 16px,
then 24px from 768px. Its padding steps are load-bearing for `check:card-track-monotonicity` (see the file's own
header). Moving it onto the profile needs that gate re-proved, so it is not done as a side effect of another task.

**Check, before handoff and at review:** at **320, 390, 1024 and 1440**, measure the distance from each of the **four**
screen edges to the visible content: the top of the first content box, the left and right extremes, and the bottom of
the last content box (when the content is shorter than the viewport; otherwise scroll to the end and measure there).
When the Story renders a production parent with a navbar or header, measure from the parent's content edge and report
both values. Expected values:
- top/bottom **24**, left/right **16 / 16 / 32 / 32**, wherever the profile or the default canvas supplies the side;
- **the component's own production gutter** on a side where it has one (for example left/right 16 / 16 / 24 / 24 for
  `MantineDashboardGrid`). A value larger than that source gives is a doubled gutter.

A side at **0** is a failure, whatever the other three sides measure.

**Receipt — execution and review alike, one per in-scope Story:**

`GR-3d STORY GUTTER CHECK — <story id>: gutter <StoryPageGutter all | StoryPageGutter x/y (own <axis>: <path:line>) | n/a: own gutter (<path:line>) | n/a: default canvas | n/a: overlay-only | n/a: MantineStoryShell primitive>; top/right/bottom/left 320 <t/r/b/l> · 390 … · 1024 … · 1440 … (expected <values per side>); side at 0: NONE; doubled gutter: NONE; gutter written in the Story: NONE.`

**Who checks what:**
- **Task design (`create-task`).** Every Story in the owner matrix, blast-radius rows included, gets a GR-3d line in
  the kickoff naming, per axis, `own gutter (<path:line>)` or `profile`, plus `wrap in this task`, `remove the Story's
  padding in this task`, or `fix the side in the component` where needed. A matrix row without one makes the kickoff
  unpublishable.
- **Execution (`execute-task`).** Before handoff, the executor answers the question per side for every in-scope Story,
  removes any doubled or Story-written gutter, adds the profile on missing sides, measures all four sides, and emits
  one receipt per Story. A missing receipt for any Story in the owner matrix is `BLOCKED — GR-3d`.
- **Review (`review-task`).** The reviewer measures all four sides of every Story in the owner matrix **before**
  handing the matrix to the owner. A side at 0, a doubled gutter or a Story-written gutter is `NEEDS REVISION`, and
  the Story never reaches the owner.

**Automated gate: Task 909 (filed 2026-10-01).** Until it lands, GR-3d is enforced by measurement and receipt only. A
green `check:stories` is not evidence (GR-2): it does not measure edge gaps.

