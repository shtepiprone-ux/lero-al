# Golden Rules — non-negotiable, receipt-enforced

> **Owner rule, 2026-09-18, strengthened after repeated Sonnet hardcode/duplication violations.** These are not guidance. Each rule names the forbidden act, the
> command that proves compliance, and a **verbatim receipt line** that must appear in the response. **A response that
> omits a required receipt is void** — the owner rejects it unread, and the agent restarts the step.
>
> **Why receipts and not prose.** `docs/agent-contract.md` clause **16c** — "neither the orchestrator nor executor may
> declare the Story out of scope" — existed, was listed in every kickoff's pre-read bundle, and was broken anyway by
> Task 809's own kickoff. In the same session the `REVIEW PREFLIGHT COMPLETE` receipt was emitted **every single
> time**, because its absence is visible in the output. Prose is skippable; a missing literal string is not. That is
> the entire design of this file.
>
> **A rule leaves this file only by owner decision quoted with its date. No agent may narrow, reinterpret, defer or
> "scope out" any rule here, and no task, kickoff or review is authorization to do so.**

## GR-0 — Search canonical sources first; reuse or extend them; never hardcode a parallel UI

Binds: `agent-contract` **16b–16c**. Applies to every new visible production component, named visible component
added to an existing file, Storybook page/title/export, wrapper, or visual style — and to every Mantine migration.
This is the **first rule every executor must read** before opening a task, source file, diff, or Storybook file.

**Forbidden:** creating a new component, Story, Story export, wrapper, utility chain, CSS rule, inline style, raw
visual value, or scanner allowlist before a canonical-reuse search has completed. A different filename, folder,
consumer, wrapper, Storybook title, viewport, locale, or copied markup is not a new requirement. Filename-only
searches are invalid: the executor must search by the required behavior and visual role, open every plausible
candidate, and inspect its production source and canonical Story.

**Canonical-reuse preflight — before any related write:** search the component catalog, `src/design-system/mantine/`,
`src/components/`, `src/modules/**/components/`, `src/stories/`, and colocated `*.stories.*` files with semantic
purpose/behavior terms, not only the proposed name. For every plausible candidate, inspect its API, rendered states,
canonical Story, and actual style/token path. Choose exactly one disposition:

- `REUSE` — consume the canonical source unchanged.
- `EXTEND` — add the missing behavior or state to its canonical owner and Story, then consume that owner.
- `COMPOSE` — assemble existing canonical sources without cloning their markup or styles.
- `CREATE` — allowed only after the search proves no inspected candidate can satisfy the requirement by reuse,
  extension, or composition; create the smallest native Mantine shared source and its direct canonical Story first.
- `STOP` — the boundary, candidate equivalence, or required visual contract is unclear; obtain an owner decision.

**No hardcoded visual UI:** for new or migrated UI, every visual value must come from the canonical native Mantine
component/theme-token path with the required TailAdmin provenance. New `className` utility chains, CSS/SCSS rules,
`style` objects, raw hex/px/rem values, arbitrary utilities, bespoke wrappers, and governance allowlists are
forbidden as substitutes for a canonical component, pattern, or token. Existing legacy styling may be preserved only
where the task explicitly keeps a legacy surface; it never authorizes adding a new local visual rule. A missing
canonical token or pattern is `STOP`, not permission to invent one.

**Receipt — task design, execution and review alike:**

`GR-0 CANONICAL REUSE PREFLIGHT — request: <component/Story/style>; semantic queries: <queries>; inspected candidates: <paths + Story IDs | NONE>; decision: <REUSE | EXTEND | COMPOSE | CREATE | STOP>; selected canonical owner: <path | NONE>; Mantine/TailAdmin token path: <path | NONE>; new hardcoded visual values: NONE; rationale: <why>.`

No receipt, an uninspected plausible candidate, a `CREATE` decision without the search evidence, or any new
hardcoded visual value makes the task invalid. The executor must emit `BLOCKED — GR-0 CANONICAL REUSE PREFLIGHT
MISSING` and make no related write; the reviewer returns `NEEDS REVISION`.

## GR-1 — Every component a surface renders is in that surface's census

Binds: `agent-contract` **16d**. Applies to every task that changes a visible surface.

**Forbidden:** writing, obeying or approving a scope that excludes a component the surface renders — including every
popup, dialog, drawer, popover, toast and menu it opens. "Separate slice", "pre-existing", "only a child", "the
kickoff excluded it" are not exemptions.

**Command** (from the project root, `$surface` = the surface file):

```powershell
$surface = "src\modules\listings\components\FavoritesShell.tsx"
node.exe scripts\check-surface-census.mjs --surface $surface
```

**Receipt — task design, execution and review alike:**

`GR-1 CENSUS COMPLETE — <n> nodes; tier1 <a> migrated+enrolled+story; tier2 <b> imports removed; tier3 <c> listed and filed as <task numbers>.`

Every tier-3 node is **filed as a numbered task in the same response**. A node passed over silently voids the receipt.

**Container exemption. Owner decision 2026-09-23 (Task 872, Sprint 81 D81-2), verbatim option chosen:**
*"View-stories достатньо (Recommended)"*. It resolves the conflict between this rule and `docs/component-rules.md` →
"Container / Presentational Primitive Split" (owner P0, 2026-07-10, which forbids a Story that mocks hooks). The
exemption holds only when **all** of the following are true:

1. The tier-1 node is a pure container, meaning 0 `className`, 0 `@/components/ui/*` imports, and no JSX of its own
   beyond rendering its View and passing slots.
2. Its UI lives entirely in a View that is enrolled in `scripts/mantine-migration-scope.json`.
3. That View has its own canonical Story.

Such a container is **proven by that View's Story** and gets no Story of its own. It still appears in the census.
The census cannot yet recognise the split, so the container stays as baselined debt, and the receipt counts it
separately: `tier1 <a> migrated+enrolled+story + <e> container-exempt (<names>)`. A node that fails any of the three
conditions is not exempt.

**Non-visual provider exemption. Owner decision 2026-09-24 (Task 876, Sprint 81 D81-4), verbatim:** *"AuthContext /
AuthProvider є non-visual state provider: він рендерить лише Context.Provider та children, не створює DOM/UI, має 0
className і не імпортує legacy UI primitives. Зміна лише його state/command contract не розширює GR‑1 на весь
src/app/[locale]/layout.tsx. Він не отримує Story або manifest entry; baseline entry layout лишається. GR‑1
застосовується до кожного візуального consumer-а, який показує цей стан; його canonical View Story має перевіряти
pending UI. Виняток не поширюється на provider, який сам рендерить будь-який UI."* The census for such a change is
the census of the visual consumer's surface, not of the provider's parent layout. A provider that renders any element
other than `Context.Provider` and `children` is not exempt.

## GR-2 — A green gate is never evidence that a gate's blind spot is clean

**Forbidden:** citing `check:story-coverage` (or any gate) as proof for a component that gate does not inspect.
`check:story-coverage` validates only components already in `scripts/mantine-migration-scope.json`; an unenrolled
component is invisible to it. Task 809 read **34/34 green** with three unmigrated shadcn components on the page and
the very pattern it extended unenrolled.

**Receipt, whenever a gate result is used to close a requirement:**

`GR-2 SCOPE STATED — <gate> inspects <what>; it cannot see <what>; the criterion is closed by <the actual evidence>.`

## GR-3 — A composition Story is not a component Story

**Forbidden:** treating a Story that renders the parent as proof for a child that has no Story of its own. If no
canonical Mantine Story exists for a changed visible component, **create it** — before the consumer composition, per
`agent-contract` 16c.

**Receipt:** `GR-3 STORY PROVEN — <component> ← <its own story file>` per changed visible component. The word "own" is
literal: the file must import that component by name.

## GR-3a — A Story existence preflight precedes every Story/page/export creation

Binds: `agent-contract` **16c**. Applies before creating a `*.stories.*` file, Storybook title, or Story export for
visible UI, and before retaining a legacy Story alongside a Mantine migration.

**Forbidden:** creating or retaining a parallel Storybook page when a canonical Story already directly imports the
same production component, or when an equivalent canonical composition renders that real component in the requested
state. A different title, folder, wrapper, gate enrolment, locale variant, or viewport variant is not a new proof
surface. Missing states extend the existing canonical Story; they do not justify another page. Locale and viewport
proof for Mantine remains toolbar-driven.

**Preflight — before any Story-related write:** search `src/stories/**` and colocated `*.stories.*` files for the
production component's direct import; inspect every canonical candidate's Storybook title, rendered states, and
locale/viewport mechanism. Record one candidate row per match. `CREATE` is allowed only when the search returns no
canonical candidate. If the component boundary, equivalence, or state coverage is unclear, stop for an owner decision.

**Receipt — task design, execution and review alike:**

`GR-3a STORY PREFLIGHT — <production component> × <requested state>; canonical candidates: <Story IDs | NONE>; direct-import evidence: <path:line | NONE>; toolbar coverage: locale=<mechanism>, viewport=<mechanism>; decision: <REUSE | EXTEND | CREATE | STOP>; target: <existing Story ID | NONE>; rationale: <why>.`

No receipt, a receipt with an uninspected candidate, or `CREATE` with any canonical candidate makes the task invalid.
The executor must emit `BLOCKED — GR-3a PREFLIGHT MISSING` and make no Story-related write; the reviewer returns
`NEEDS REVISION`.

## GR-3b — A Story reproduces the production width contract; it never fixes one

**Owner rule, 2026-09-26.** Task 852: the owner returned four Stories in one pass. Their words: *"хардкод, немає
адаптивності на мобільних екранах"*, then *"Sonnet не перевіряє адаптивність, просто хардкодить. Це прогалина у
правилах!"*. The four returns:
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

**An admin page View renders inside the real `AdminShell`. Owner rule, 2026-10-02 (Task 857 review 3), verbatim:**
*"Це треба вирішити одразу у цій задачі, а не створювати купу додаткових задач!"* The trigger: every admin page View
Story rendered without the shell. From 1024 such a Story had 240px (the navbar) more room than the real page, so the
owner reviewed a wider layout than users see.
- Every Story of a View that a route under `src/app/admin/` renders as its page content uses the shared decorator
  `withAdminShell` (`src/stories/_StoryAdminShell.tsx`).
- Inside it, the View is wrapped in the same `AdminPageFrame` props its route uses. There is no `StoryPageGutter`
  (GR-3d `n/a: own gutter (AdminPageFrame)`).
- The same applies to every table Story (`docs/mantine-responsive-design-system.md` §7.3).

**Sections stack into rows on a phone. Owner rule, 2026-10-01 (Task 893's `/admin/users/new` returned at 320), verbatim:**
*"мобільна адаптація має переноситись на рядки, а не хардкодно триматись ліворуч чи праворуч від попередньої секції"*.
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
  at the end of a row.

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

## GR-3c — Text size is responsive by construction; a fixed heading scale never reaches a phone

**Owner rule, 2026-09-26.** Task 869: the owner returned `CmsPageView` at O79-5. Their words: *"Шрифти не адаптивні,
на мобільних екранах вони просто величезні. Це тупо хардкод! Я вже казав не раз про адаптивність. Це величезна
прогалина у правилах кікофів та виконавця!"*

The cause was structural. The theme's `headings.sizes` are one fixed value at every width: h1 48px, h2 36px, h3 30px,
h4 24px (`src/design-system/mantine/theme.ts:581-584`). So `<Title order={1} size="h3">` rendered 30px at 320px.
`TypographyStylesProvider` reads the same fixed variables, so a CMS body `<h2>` rendered 36px at 320px. That is
larger than the page's own title at every width. Legacy UI already had this rule (`docs/ui-rules.md` → "Responsive
Typography Rules": *"No static `text-2xl` or larger on elements that appear on mobile without a responsive step"*).
The Mantine migration never carried it over, and no kickoff, executor or review asked the question.

**Forbidden in new or migrated UI:**
- text that renders at **24px or larger** at any width without a breakpoint-keyed `fz`, for example
  `fz={{ base: 'h5', sm: 'h4', md: 'h3' }}`. Only theme keys may be used (`h1`–`h6`, `xs`–`xl`), never px/rem;
- `Title order={1–4}` with no responsive `fz`, because its theme size is fixed. The same applies to a static `size="hN"`;
- below `sm` (640px):
  - a page or section heading above **20px** (`h5` / `xl`), which matches legacy `text-xl`;
  - a hero title above **30px** (`h3`), which matches legacy `text-3xl`, and only in a role the kickoff names as a hero;
- rich text (`Typography` / `TypographyStylesProvider`) whose headings use the fixed theme scale. It must use the
  canonical responsive rich-text scale owned by `src/design-system/mantine/typography-chrome.css`;
- a body or child heading larger than the surface's own page title at any width.

**Required in every kickoff that changes visible text:** a **type-scale table** with one row per text element. Each
row gives the role, the size at `base` / `sm` / `md` / `lg`, the theme key for each size, and the provenance.
Missing the table is a task-design defect (`create-task` gate).

**Check, before handoff and at review:** open every changed Story at **320, 390, 768 and 1440**. Measure the
`getComputedStyle(el).fontSize` of every heading and of the body text. Compare each value with the kickoff's
type-scale table.

**Receipt — task design (the table), execution and review alike, one per changed Story:**

`GR-3c TYPE RESPONSIVE CHECK — <story id>: <element> 320 <px> · 390 <px> · 768 <px> · 1440 <px>; <next element> …; ≥24px text without a responsive step: NONE; heading above 20px below 640 (non-hero): NONE; child heading larger than page title: NONE.`

With no receipt, or with any listed violation, the executor returns `BLOCKED — GR-3c` and the reviewer returns
`NEEDS REVISION`. No automated gate reads computed font sizes. `check:design-tokens` only sees raw literals, so a
theme key used statically (`size="h3"`) passes it (GR-2).

## GR-3d — A Story shows the component at its real distance from the screen edge

**Owner rule, 2026-09-29.** Task 877: the owner returned O78-6 and wrote, verbatim: *"Також, необхідно занести в
правило, що під час створення Story необхідно дотримуватись канонічних відступів від країв екрану! Це постійна
проблема. І ці Story не виключення, також мають цю проблему! Її необхідно виправити!"* The same day: *"достатньо буде
зробити один і той самий профіль для всіх Story, щоб вони завжди мали однаковий відступ від країв екрану"*. Hardened
the same day, verbatim: *"Необхідно жорстко впровадити правило, щоб Sonnet не мала прапва це ігнорувати!"*

**Clarified by the owner, 2026-10-01 (Task 890 review 2), verbatim:** *"Я просив, щоб був уніфікований відступ у сторі
для того, щоб я розумів, як цей компонент буде виглядати на реальній сторінці. Якщо у компонента вже є свій рідний
відступ, то не треба додавати відступ у Story."* The earlier text of this rule made `StoryPageGutter` the default and
then carved out narrow exemptions (O83-3, O83-4, O83-5, D78-10) one component at a time. Wrapping a component that
already has its own gutter doubled the gutter. This version replaces all of that with one question.

**Four sides, owner instruction 2026-10-01 (Task 890 review 3), verbatim:** *"треба щоб тест вимірював всі 4 сторони, і
якщо немає відступу - додавати"*. The trigger was `Patterns/Mantine/DashboardGrid`: its left and right edges were
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

**Shell chrome. Owner decision 2026-10-01 (Sprint 87 D87-1), verbatim option chosen:** *"Іменний список-виняток
(Recommended)"*. Stories of shell chrome that the real page places at the screen edge (header, navbar, sidebar,
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

## GR-3e — Text buttons stack: each text button has its own row

**Owner rule, 2026-10-02 (Task 857 review 5, O78-12 return).** The owner's words, verbatim: *"я неодноразово вже казав,
що текстові кнопки мають бути у стовпчик ( кожна у своєму рядку). Наразі я бачу. що другорядні текстові кнопки стоять
… в одному рядку. … Зроби … золоте правило!"* The trigger: `ListingPreviewDialogView` put "View listing" and "Open
public page" side by side in a `Group`. The owner then confirmed the scope (option chosen verbatim): *"Yes, exactly that
(Recommended)"*. That means a group of text buttons is a column, and a lone destructive text button in a footer stays where
§23.6 puts it.

A **text button** is a `Button` with a visible label and `variant="subtle"` or `variant="transparent"` (usually with a
`leftSection` icon), or an `Anchor` styled as an action. An icon-only `ActionIcon` is not a text button.

**Forbidden in new or migrated UI, at every width:**
- two or more text buttons in one row: a `Group`, a `Flex` with a row direction, or `wrap="wrap"`, which still shares a
  row wherever the buttons fit.

**Required:**
- a group of two or more text buttons is a column: `Stack gap="xs" align="flex-start"`, one button per row, in reading
  order;
- a lone text button may sit in a row with non-text buttons where `docs/mantine-responsive-design-system.md` §23.6
  places it, for example the resting destructive action at the left of a dialog footer.

**Scope:** every Story a task creates, changes or lists in its owner matrix, and every surface it changes. An existing
violation inside that scope is fixed in the same task. Existing dialogs outside it are **Task 915**.

**Check, before handoff and at review:** at 390 and 1440, list every visible text button. For every pair, confirm that the
second one's top is at or below the first one's bottom.

**Receipt — execution and review alike, one per changed Story:**

`GR-3e TEXT BUTTONS STACKED — <story id>: text buttons <n>; groups of ≥2: <n>; pairs sharing a row at 390/1440: NONE.`

With no receipt, or with a pair sharing a row, the executor returns `BLOCKED — GR-3e` and the reviewer returns
`NEEDS REVISION`. No gate measures this yet (GR-2).

## GR-3f — A circle renders as a circle

**Owner rule, 2026-10-02 (Task 857 review 5, O78-12 return).** The owner's words, verbatim: *"я неодноразово повторював
щодо іконок. Коло має бути колом … Наразі візуально я бачу багатокутник, а не коло. І можеш мені не брехати, я своїм
очам більше вірю."* Then: *"radio buttons мають мати коло у компоненті, ніякого хардкоду лише в одному попапі, це має
бути глобально пофікшено"*.

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

## GR-4 — An acceptance criterion asserts an observable property, never an absolute

**Forbidden:** "byte-unchanged", "within N px", "zero hits" and similar, when a correct implementation can violate
them. Four occurred in one run: 810 AC9, 810 AC10, 808 §3.4, 809 AC1/AC5 — every one cost a round trip and none
indicated a real defect.

**Receipt, in every kickoff:** `GR-4 AC AUDIT — <n> criteria; each states an observable property; absolutes: none.`

## GR-5 — The verdict, the archive and every state record change together

Binds `orchestrator-role` → Backlog discipline. **Forbidden:** recording a verdict in one place and leaving another
stale. Enumerate every artifact naming the task's state — `docs/backlog.md`, the sprint Tasks table, the sprint
execution-order note, `docs/backlog-archive.md`, the kickoff — and change them in the same response. For `APPROVED`
or `APPROVED WITH NOTES`, this means removing the closed task and every confirmed stale closed/superseded record from
the active backlog and adding concise newest-first archive rows before the handoff. An open note becomes a separate
active owner action or numbered task; it never keeps an approved task active. This has recurred four times (661,
703/704/705, 702 twice).

**The whole backlog, on every Opus response — not only the lines this response changed (owner rule, 2026-09-27).**
The owner found closed Sprints 68 (2026-09-18) and 80–82 (2026-09-25) still listed in `docs/backlog.md`, with
approvals from earlier sessions piled into "Last Session". His words: *"якщо ці спринти 80,81 і 82 закриті, чому
backlog.md не актуалізований? Мені тобі кожного разу нагадувати, що ти слідкуєш за беклогом? Чому ти ігноруєш свої
правила? Виправ правила, щоб більше не ігнорував!"*. The old check read only the lines a response *added*, so stale
state that was already in the file, or any response that wrote no file, passed unseen. Now
`npm run check:backlog-active` (`scripts/check-backlog-active.mjs`) checks the whole file. It fails on:
- any closed-state marker outside "Last Session" (`✅`, `CLOSED`, `APPROVED`, `ARCHIVED`, `FOLDED`, "archived
  <date>", "was archived", "folded into");
- a "Last Session" longer than 4 lines or 1200 characters;
- a named sprint plan that is closed or missing;
- a registry number the archive ledger already closed.

The Opus `Stop` hook runs it on **every** Opus response and blocks while it fails. Cleaning the backlog is therefore
the first step of the next response, whatever the owner asked.

**Receipts:** `GR-5 STATE SYNCED — <task> = <status> in: <every file touched>.` For an approved verdict also emit
`GR-5 BACKLOG CLEAN — archived: <task IDs>; active backlog: <n> lines.` Every task-design or review response also emits
`GR-5 BACKLOG ACTIVE — check:backlog-active exit 0.`

**Role boundary:** this rule's approval/archive obligations belong to Opus. Sonnet records only the task's concise
current state and its implementation evidence; it must not approve, archive, or emit Git commands.

## GR-6 — Every Opus task-design/review response that writes a task/doc artifact ends with the owner-run git block

Binds `CLAUDE.md` → Git policy. **Task design** ends with `git add` + `git commit`, explicit paths, **never** `git
push`. **An approved review** ends with `git add` + `git commit` + `git push <verified-remote> <verified-branch>`.
A **non-approved review** contains no git command **for the implementation** — and that does **not** suppress the
task-design block for documents the same response authored. Conflating the two is how the block went missing on
2026-09-10.

**Commit-identity ban:** an owner-run `git commit` handoff must contain only the intended commit subject and any
task-required body. It must never append a `Co-Authored-By:` trailer. This explicitly forbids the Claude/Anthropic
identity trailer; do not substitute a different Claude model or address to evade it.

**Role boundary:** GR-6 and `.claude/hooks/orchestrator-response-gate.ps1` are Opus-only. Sonnet's executor
handoff ends with `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED` and contains
no `git add`, `git commit`, or `git push` command. Missing or ambiguous hook role metadata fails open; it never
turns a Sonnet backlog/session-log write into a Git-handoff demand.

**Receipt:** `GR-6 HANDOFF EMITTED — <task-design | approved-review | none: no artifact written>.`

## Enforcement status

| Rule | Enforced by | State |
|---|---|---|
| GR-0 | Sonnet `execute-task` first-read stop gate + orchestrator/executor/reviewer inspection + required receipt | **active** — a missing/invalid receipt or a non-canonical new visual value blocks the task by rule. |
| GR-1 | `scripts/check-rendered-scope.mjs` (`npm run check:rendered-scope`, **blocking**, Task 818), `scripts/check-surface-census-changed.mjs` (`npm run check:surface-census:changed`, **blocking**, Task 819 — maps the PR's own base..head diff to affected surfaces via `scripts/map-changed-surfaces.mjs` and censuses each with `scripts/check-surface-census.mjs --json`), `scripts/check-pattern-enrolment.mjs` (`npm run check:pattern-enrolment`, **blocking**, Task 820), **and** `scripts/check-media-enrolment.mjs` (`npm run check:media-enrolment`, **blocking**, Task 813) | **Enforced for both halves: the enrolled subgraph and pre-enrolment — and, for two directories, at the source.** Task 813 (2026-09-11) moved the project's canonical `<img>` render site, `AppImage.tsx` (and its co-located siblings), out of `src/components/ui/` — the literal path prefix both `check-rendered-scope.mjs` and `check-surface-census.mjs` classify as `tier2-legacy-primitive` — to `src/design-system/media/`, closing the tier-2 edge at its source for every consumer at once, and added `check:media-enrolment` (same shape as `check:pattern-enrolment`, directory-listing-driven, never a hard-coded name list) so that new directory does not ship ungoverned. Task 818 (2026-09-11) made `check:rendered-scope` blocking against a versioned, edge-keyed baseline (`scripts/rendered-scope-baseline.json`) — every component an *enrolled* surface renders is blocked from silently growing unmigrated. Task 819 (2026-09-11) closes the other half: `check-surface-census.mjs` (Task 817) censuses one named surface but took a `--surface` argument no CI job supplied, so a wholly unenrolled surface (the exact Task 809 shape) was invisible to every gate. `check:surface-census:changed` now runs in the same `governance` job, immediately after `check:rendered-scope:verify`: it fails closed (never a silent skip) when the merge base cannot be determined, either limit is exceeded, a changed file resolves to no surface, or a mapped surface's own census is unusable; every blocking node it finds is compared against its own versioned baseline (`scripts/surface-census-baseline.json`) the same way — baselined debt does not fail, a new block fails naming it, a stale entry fails, and a new `tier2-legacy-primitive` block can never be baselined away. Task 820 (2026-09-11, owner decision 5) closes GR-1's remaining gap for one directory by construction rather than by frontier-walking: every `.tsx` under `src/design-system/mantine/patterns/` must be a `scripts/mantine-migration-scope.json` entry, checked against the live directory listing (never a hard-coded name list), with the eleven Task 816 tier-3 allowlist entries retired as no longer needed — the manifest now enrols all 33 patterns directly. GR-1's `Command` block above (the by-hand, single-surface form) is unchanged and stays useful for ad-hoc inspection; it is not what CI runs. |
| GR-2 | reviewer inspection + receipt | active |
| GR-3 | `check:story-coverage` for enrolled components; `check-rendered-scope` blocking in CI for the enrolled-subgraph frontier (Task 818); `check-surface-census.mjs`/`check:surface-census:changed` blocking in CI for the pre-enrolment case (Task 819) — both check, per node, whether a canonical Mantine story imports it directly or through a single-hop `index.ts(x)` barrel re-export, never merely its parent, via the `story:<yes\|no>` column/field | **enforced for both halves** (Task 818, Task 819) — a rendered, unstoried component reachable from an enrolled root, or from any surface the current PR's diff actually touches, now blocks the PR. |
| GR-3a | orchestrator/executor/reviewer inspection + required receipt | **active** — automated duplicate detection is not yet implemented; an absent or invalid receipt blocks the task by rule. |
| GR-3b | executor + reviewer measurement at 320/390/1024/1440 + required receipt | **active** — no automated gate yet; `check:stories` does not inspect decorators or widths. |
| GR-3c | kickoff type-scale table (`create-task`) + executor/reviewer computed-font-size measurement at 320/390/768/1440 + required receipt | **active** — no automated gate yet; `check:design-tokens` cannot see a static theme heading key. |
| GR-3d | one question per side, all four sides measured: own production gutter → the Story adds nothing on that side; none → `StoryPageGutter` (per axis once Task 909 adds `sides`). Automated gate `check:story-gutters` filed as Task 909 (Sprint 87). Scope: every created, changed or owner-matrix Story. Enforced by the `create-task` kickoff line per matrix Story, the blocking `execute-task` item 7 with a receipt per Story, and the `review-task` item 8 measurement before the owner matrix | **active** — enforced by rule and receipt; there is no automated gate, and `check:stories` does not measure edge gaps. |
| GR-3e | executor + reviewer check at 390/1440 (no two text buttons share a row) + required receipt | **active** — no automated gate yet. |
| GR-3f | executor + reviewer device-scale-1 pixel crop at 10×, saved as evidence + required receipt; canonical radio 20px / 10px dot in the `Radio` theme entry | **active** — no automated gate; computed styles cannot see rasterisation. |
| GR-4 | reviewer inspection + receipt | active |
| GR-5 | **Opus-only `Stop` hook** `.claude/hooks/orchestrator-response-gate.ps1` — (a) on **every** Opus response it runs `scripts/check-backlog-active.mjs` over the whole `docs/backlog.md` and blocks on exit 1 (added 2026-09-27; two-armed proof of the script: a planted `✅ CLOSED` sprint line → exit 1, restored → exit 0, identical hash; **owner-native proof of the hook, 2026-09-27:** a synthetic Opus Stop event with a planted `CLOSED` sprint line → `PLANTED exit=2`, restored → `RESTORED exit=0`, `git status --short docs/backlog.md` empty); (b) it blocks when `docs/backlog.md` newly records a task approved/archived and `docs/backlog-archive.md` is unchanged | **enforced** |
| GR-6 | **Opus-only `Stop` hook** — blocks an Opus task-design/review response when a `tasks/**` or governance doc is written and uncommitted with no required `git add` block, blocks `git push` outside an approved review, and blocks a `Co-Authored-By:` trailer in the handoff | **enforced** |

**A receipt is a self-report, and on 2026-09-10 the orchestrator skipped one under pressure in the same session that
wrote this file.** That is why GR-5 and GR-6 are now an **Opus-only `Stop` hook**: it reads the real `git status` and
the actual Opus response, and exits 2 — the response is blocked and must be fixed before it can finish. It is
fail-open on any error or absent role signal and honours `stop_hook_active`, so it can never wedge a Sonnet executor
with a prohibited Git command.

**GR-1 and GR-3 are enforced for both the enrolled subgraph and pre-enrolment.** Task 812 built
`check:rendered-scope`; owner decision 3 (2026-09-11) ran it advisory first; Task 818 (2026-09-11) made it blocking
against a versioned fail-on-new baseline that a CI self-test (`check:rendered-scope:verify`) re-proves can still fail
on every PR — that closes the half of GR-1/GR-3 that a manifest-rooted walk can see. Task 817 built
`check-surface-census.mjs`, the per-surface command GR-1's own `Command` block had named since the rule was written
but that took a `--surface` argument no CI job supplied. Task 819 (2026-09-11, owner decision 4) closes that gap:
`check:surface-census:changed` maps every PR's own base..head diff to the surfaces it affects and censuses each one,
blocking on any new (un-baselined) finding, with its own CI self-test (`check:surface-census:changed:verify`) and its
own versioned baseline (`scripts/surface-census-baseline.json`) recording the debt that already existed. A wholly
unenrolled surface — the exact Task 809 shape — is no longer invisible to CI.
