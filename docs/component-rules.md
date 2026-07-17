# Component Development Rules

### Code Quality
- Always use best UI/UX practices when creating or editing components.
- Follow mobile-first approach — every component must be fully responsive.
- New or migrated UI must use Mantine components and the Mantine responsive system, with TailAdmin visual
  chrome. See `docs/mantine-responsive-design-system.md` and `docs/tailadmin-style-reference.md`.
- Existing shadcn/Tailwind/Base UI components remain valid only for legacy surfaces that have not yet migrated.
  Do not apply legacy implementation details to new Mantine work unless the task explicitly bridges migration.
- Legacy note: underlying Base UI primitives are `@base-ui/react` (not Radix), so Radix-only patterns like
  `asChild` may not apply.
- Keep components small and reusable.
- Reference site for UI/UX features and patterns: https://dom.ria.com/.

### Zero Hardcode Rule (ABSOLUTE — NO EXCEPTIONS)
- **NEVER hardcode any user-visible text** in any component, page, dialog, toast, placeholder, aria-label, or Zod validation message.
- This rule applies everywhere: client components, server components, sub-components, inline helpers, constants, and config objects inside component files.
- Use `useTranslations()` for client components, `getTranslations()` for server components.
- **NEVER hardcode colors.** Current Mantine UI uses the Mantine theme and TailAdmin-cited values; legacy
  Tailwind UI uses semantic utilities backed by `globals.css` (for example: `text-primary`, `bg-card`,
  `border-border`).
- **Static UI text** (labels, buttons, navigation, validation messages, empty states, helper text, confirmation dialogs, status labels, role labels) must use i18n keys from `messages/*.json`.
- **Admin-managed / CMS content** (editable page content, rich text, marketplace-managed content) must come from the database.
- Zod schemas with validation messages MUST use `buildSchema(t)` function pattern — never module-level schema with hardcoded strings.
- After implementation, verify by switching locale at runtime — if any string does not change, it is hardcoded and the task is NOT complete.

### No Duplicate Components Rule (MANDATORY)
- **BEFORE creating any new component**, audit existing components in `src/components/` for a functionally equivalent or similar component.
- If an existing component covers ≥70% of the required behavior, extend or adapt it — do NOT create a new one.
- Creating a new component with different UI but identical purpose/logic as an existing one is considered a task failure.
- Duplication audit is a required pre-condition — skipping it is a rule violation.
- Document the audit result: either "reused `ComponentName`" or "no suitable component found because [reason]".

### Container / Presentational Primitive Split (MANDATORY — OWNER P0, 2026-07-10)
- **Every component that consumes hooks, React context, or fetches data MUST separate its UI into its own
  prop-driven presentational primitive.** The "smart" **container** owns the hooks, state, data-fetching, and
  handlers; the **presentational primitive** (e.g. `FooView`) receives everything via props and renders JSX
  only — no data-fetching hooks, no network, no router, no Supabase client.
- **Why (non-negotiable):** the presentational primitive can be rendered in Storybook and unit-tested with
  fixture props — with **NO hook/network mocking, NO Storybook module aliases, NO live Supabase.** This is the
  pattern `FiltersPanel` already follows; `HeroSearch` violated it and forced a hook-mocking dilemma
  (Task 568). **This must never recur:** if a story or test has to mock a data/network hook, the split was
  skipped → the task is incomplete, route it back.
- **Boundary:** the container's PUBLIC API (what pages/consumers import) stays unchanged — the split is
  INTERNAL: extract `FooView`, and the container renders `<FooView … />`. `useTranslations`/`useFormatter`
  (i18n, provided by the global Storybook decorator) MAY live in the presentational primitive — they are not
  data-fetching. `useLocations`/`useRouter`/`createClient`/any Supabase or network hook MUST stay in the
  container.
- **Story + test target the presentational primitive** with deterministic, locale-safe fixture props.
- Enforced on every UI kickoff and every review (see `docs/orchestrator-role.md` → "Review"). A new "smart"
  component shipped without its presentational primitive is a task failure.

### Storybook-First Implementation (MANDATORY — OWNER P0, 2026-07-17)
- **Every UI change originates and is proven in Storybook FIRST, then flows to the live site.** The order is
  non-negotiable: change the story (or the story-rendered primitive/pattern) → prove the new state renders
  correctly in Storybook → only then is the change considered live on the site. Never change a live surface's
  appearance or behavior without a story that renders and proves that exact change.
- **A site-only change is a task failure.** If a component's live appearance changes but no story exercises the
  changed state, the work is incomplete — route it back. Sonnet has no authority to modify a component's
  rendered result on the real site without the corresponding Storybook proof first.
- **Shared single-source-of-truth patterns** (e.g. `MantineListingCardPattern`, consumed by BOTH its story and
  `ListingCard.tsx`): the change lands in the shared pattern and the story MUST render every affected state
  (all relevant variants — premium/archived/sold/reduced/etc.). The Storybook render is the primary visual
  proof; the site inherits it. If a story-only fixture duplicates the same pattern (e.g. `StoryListingCard`),
  it must be updated in the same task so Storybook stays internally consistent.
- Enforced on every UI kickoff and review. See `docs/storybook-governance.md` for the rendered-proof layers a
  story must pass.

### CSS & Design System Rules (MANDATORY)
- New or migrated Mantine UI uses Mantine theme tokens and TailAdmin-cited values from
  `docs/tailadmin-style-reference.md`. Do not invent raw colors, spacing, radius, shadows, or density values.
- Legacy Tailwind/shadcn UI uses semantic design tokens defined in `globals.css`; never use raw color values or
  arbitrary Tailwind color utilities in legacy components.
- If a required token does not exist, add it to the correct source of truth first: Mantine theme/TailAdmin
  reference for current UI, or `globals.css` for legacy Tailwind UI.

### Component Structure
- Every component file: one component per file.
- Component naming: PascalCase for components, camelCase for hooks and utils.
- Hooks always start with `use` prefix.
- Constants in UPPER_SNAKE_CASE.
- Types/interfaces in PascalCase with no `I` prefix.
- Max file length: 300 lines — if longer, split into subcomponents.
