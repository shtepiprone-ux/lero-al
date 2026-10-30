## GR-3b — A Story reproduces the production width contract; it never fixes one

**Owner rule, 2026-09-26.** Task 852: the owner returned four Stories in one pass. Their words: *"hardcode, no responsiveness
on mobile screens"*, then *"Sonnet does not check responsiveness, it just hardcodes.
This is a gap in the rules!"*. The four returns:
- `AdminSidebar` and `AdminLocaleSwitcher` were wrapped in a `maw={appShellNavbarWidth}` box, which is 240px at
  every width, while production gives them the full-width drawer below 1024;
- `LocaleSwitcher` `fullWidth` sat in a fixed `w={240}` column;
- an `AppShellFoundation` header slot was a bare `<div style={{ padding }}>` that did not centre vertically.

Earlier in the same task, three exports pinned `globals.viewport`, which locks the toolbar. No gate, and neither
review, caught any of them.

**Forbidden in any Story file, `decorators` entry or `render`:**
- a fixed-width or max-width container (`w`/`maw`/`miw` set to a number, a theme token, or px/rem);
- a `style`/`styles` object;
- a raw px/rem value;
- a `globals: { viewport … }` pin.

Slot or fixture content a Story supplies follows the same visual rules as production content. For example, a header
slot fills the header height and centres its content vertically.

**Required:** where the production parent sizes the component, the Story reproduces that contract with the same
breakpoint-keyed Mantine responsive prop, and cites the parent's source line in a comment. Example: an `AppShell`
navbar child with a `navbarBreakpoint="lg"` parent gets `w={{ base: '100%', lg: theme.other.layout.appShellNavbarWidth }}`.
Otherwise the container is fluid.

**An admin page View renders inside the real `AdminShell`. Owner rule, 2026-10-02 (Task 857 review 3):**
*"This must be solved right away in this task, not by creating a pile of extra tasks!"* The trigger: every admin page View
Story rendered without the shell. From 1024 such a Story had 240px (the navbar) more room than the real page, so the
owner reviewed a wider layout than users see.
- Every Story of a View that a route under `src/app/admin/` renders as its page content uses the shared decorator
  `withAdminShell` (`src/stories/_StoryAdminShell.tsx`).
- Inside it, the View is wrapped in the same `AdminPageFrame` props its route uses. There is no `StoryPageGutter`
  (GR-3d `n/a: own gutter (AdminPageFrame)`).
- The same applies to every table Story (`docs/mantine-responsive-design-system.md` §7.3).

**Sections stack into rows on a phone. Owner rule, 2026-10-01 (Task 893's `/admin/users/new` returned at 320):**
*"mobile adaptation must wrap onto rows, not be hardcoded to stay left or right of the previous section"*.
The trigger was the `AdminUserProfileView` header card (`Group wrap="nowrap"`). It kept the 126px avatar block beside
the title at every width, so at 320 the title column was about 80px and the subtitle read one word per line.

What counts as a section: an avatar or media block, a text column, a card, a form column or a side panel, placed beside
another one.
- **Forbidden in new or migrated UI:** below `sm` (640px), a section held beside its sibling by `wrap="nowrap"`, a
  static `direction="row"`, or a fixed `Grid.Col` span.
- **Required:**
  - a breakpoint-keyed layout that puts each section in its own row below `sm`. Examples: `Flex direction={{ base:
    'column', sm: 'row' }}` (precedent `MantineDashboardHeader`) or `Grid.Col span={{ base: 12, sm: … }}`;
  - or `wrap="wrap"`, when the sections may share a row wherever they fit.
- **Not affected:** inline items, such as an icon with its label, a badge or a count beside a button, or an action icon
  at the end of a row. A semantic label/value field is not this exception: GR-3j requires `key-value-stack` on
  compact screens.

**Check, before handoff and at review:** open every changed Story with the toolbar at **320, 390, 1024 and 1440**.
- For each width, measure the component's rendered width against the viewport and against the production parent's
  width at that viewport. Confirm there is no horizontal overflow.
- Where a Story supplies a header or row slot, measure its vertical centring.
- At 320 and 390, for every pair of sibling sections, confirm that the second one's top is at or below the first one's
  bottom.

**Receipt — execution and review alike, one per changed Story:**

`GR-3b STORY RESPONSIVE CHECK — <story id>: 320 <component w>/<parent w> · 390 … · 1024 … · 1440 …; overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE; side-by-side sections below 640: NONE.`

With no receipt, or with a fixed container, style object or pin in a changed Story, the executor returns `BLOCKED —
GR-3b` and the reviewer returns `NEEDS REVISION`. A green `check:stories` is not evidence (GR-2): it does not inspect
decorators or widths.

