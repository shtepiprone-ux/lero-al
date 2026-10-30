## GR-3c — Text size is responsive by construction; a fixed heading scale never reaches a phone

**Owner rule, 2026-09-26.** Task 869: the owner returned `CmsPageView` at O79-5. Their words: *"The fonts are not responsive, on mobile screens they are simply huge. This
is plain hardcode! I have spoken about responsiveness more than once. This is
a huge gap in the rules of the kickoffs and of the executor!"*

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

