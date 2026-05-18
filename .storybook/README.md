# Storybook — Lero.al

Storybook is configured for visual review and governance of the Lero.al UI component library.

## Running Storybook

```bash
# Install dependencies first (if not done)
npm install

# Start Storybook dev server (http://localhost:6006)
npm run storybook

# Build static Storybook
npm run build-storybook

# Governance validation (Storybook build check)
npm run governance:storybook
```

## Architecture

- **Framework:** `@storybook/nextjs` — full Next.js compatibility
- **Styles:** Tailwind CSS v4 via globals.css (PostCSS auto-applied)
- **i18n:** `NextIntlClientProvider` global decorator — switch locale via toolbar
- **Themes:** Light/Dark mode via toolbar — semantic tokens apply automatically
- **Viewports:** All 15 project breakpoints (320px → ultrawide 3440px)

## Story Locations

- **Primitive stories:** `src/components/ui/*.stories.tsx` (colocated)
- **System stories:** `src/stories/**/*.stories.tsx`

## Locale Testing

Use the Locale toolbar control to switch between:
- `en` — English (reference locale)
- `sq` — Albanian (default project locale)
- `uk` — Ukrainian **(longest strings — use for stress testing)**
- `it` — Italian

Always test with `uk` locale for any component with text labels, buttons, or navigation items.

## Viewport Testing

Key viewports for governance:
- **320px** — narrowest supported mobile
- **375px** — iPhone SE / most common mobile
- **768px** — tablet
- **1280px** — standard desktop (default)
- **1440px** — wide desktop
- **2560px** — huge desktop (verify no whitespace wastelands)

## Governance Rules

See `docs/storybook-governance.md` for the full story governance specification.

When adding a new shared component, you MUST also add a story following Checklist I in `docs/governance-checklists.md`.

## What Is Intentionally Deferred (Phase 5)

- Visual regression screenshot testing
- Chromatic / Percy integration
- Automated accessibility audit via @storybook/addon-a11y
- Interaction testing via @storybook/test

See `docs/storybook-visual-snapshots.md` for the Phase 5 roadmap.
