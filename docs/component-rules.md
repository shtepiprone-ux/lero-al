# Component Development Rules

### Code Quality
- Always use best UI/UX practices when creating or editing components.
- Follow mobile-first approach — every component must be fully responsive.
- Use shadcn/ui components as base, extend with Tailwind CSS.
- Note: underlying UI primitives are @base-ui/react (not Radix), so Radix-only patterns like `asChild` may not apply.
- Keep components small and reusable.
- Reference site for UI/UX features and patterns: https://dom.ria.com/.

### Zero Hardcode Rule (MANDATORY)
- **NEVER hardcode any user-visible text** in components — use `useTranslations()` / `getTranslations()` for static UI text and database-driven content for admin-managed / CMS content.
- **NEVER hardcode colors** — always use semantic token utilities/classes backed by the design system tokens in `globals.css` (for example: `text-primary`, `bg-card`, `border-border`).
- **Static UI text** (labels, buttons, navigation, validation messages, empty states, helper text) must use i18n keys from `messages/*.json`.
- **Admin-managed / CMS content** (editable page content, rich text, marketplace-managed content) must come from the database.

### CSS & Design System Rules (MANDATORY)
- Use only semantic design tokens defined in `globals.css`; never use raw color values or arbitrary Tailwind color utilities in components.
- If a required token does not exist, add it to `globals.css` first, then use the new semantic token in components.

### Component Structure
- Every component file: one component per file.
- Component naming: PascalCase for components, camelCase for hooks and utils.
- Hooks always start with `use` prefix.
- Constants in UPPER_SNAKE_CASE.
- Types/interfaces in PascalCase with no `I` prefix.
- Max file length: 300 lines — if longer, split into subcomponents.