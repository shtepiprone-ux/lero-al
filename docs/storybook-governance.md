# Storybook Governance — Lero.al
**Phase 4 of Future Maintenance Direction Epic**
Established: 2026-05-18
Status: PERMANENT GOVERNANCE REFERENCE

---

## §1 — PURPOSE

Storybook serves three purposes in this project:

1. **Visual review foundation** — reviewers can inspect component states without running the full app
2. **Governance documentation** — stories demonstrate canonical usage and forbidden anti-patterns
3. **Regression detection readiness** — enables future visual snapshot testing (Phase 5)

Storybook is NOT a testing framework in Phase 4. It is a visual documentation and review tool.

---

## §2 — WHEN A COMPONENT MUST RECEIVE A STORY

A story is REQUIRED for every:
- New canonical UI primitive added to `src/components/ui/`
- New shared component added to `src/components/shared/` that is used in 3+ places
- New layout component added to `src/components/layout/`
- New admin component added to `src/components/admin/` that is used in 2+ admin pages

A story is RECOMMENDED for:
- New module-level components in `src/modules/**/components/` that contain non-trivial UI logic
- New empty states, loading states, error states

A story MAY be skipped when:
- The component is purely server-side with no client rendering surface
- The component requires live auth/Supabase connection that cannot be mocked safely
- The component is a one-off page-specific wrapper with no reuse potential

When skipping: add a comment in the component file: `// STORYBOOK-SKIP: [reason]`

---

## §3 — CANONICAL PRIMITIVE STORY RULES

Every primitive story MUST include:

```
✅ Default state — simplest usage
✅ All variants (if variant prop exists)
✅ Disabled state (if disabled prop exists)
✅ Loading state (if loading/pending state exists)
✅ Long locale label state — Ukrainian (uk) stress test
✅ Mobile viewport story (size="xl" / touch-safe demonstration)
```

Primitive stories MUST use ONLY canonical sources:
- `Button` from `@/components/ui/button` — NEVER raw `<button>`
- `Input` from `@/components/ui/input` — NEVER custom input wrapper
- `Sheet` for drawers — NEVER custom `div.fixed.inset-0`
- `Dialog` for modals — NEVER custom overlay
- `Tabs` from `@/components/ui/tabs` — NEVER local tab clones
- Icons from `lucide-react` ONLY

Forbidden in stories:
- `<button>` raw elements (unless explicitly documenting anti-patterns in docs stories, not executable)
- `h-11` on Button (must be `size="xl"`)
- Custom overlays replacing Sheet/Dialog
- Non-lucide icon libraries
- `window.location.href` navigation
- Live API calls, auth checks, database reads

---

## §4 — LOCALIZATION STORY RULES

Every component with user-visible text MUST have localization coverage.

### Minimum requirement
Include at least ONE story variant with Ukrainian (uk) text — the longest-string locale.

### For toolbar/navigation components
Test all four locales explicitly:
- `en` — English (reference)
- `sq` — Albanian (default app locale)
- `uk` — Ukrainian (longest strings — primary stress test)
- `it` — Italian (medium length)

### Locale story naming convention
```
export const WithUkrainianLabels: Story = { ... }
export const LocaleVariants: Story = { ... }
export const UkrainianStressTest: Story = { ... }
```

### Forbidden localization patterns in stories
- `whitespace-nowrap` without `overflow-hidden + truncate`
- Fixed `w-[Npx]` on label-containing elements
- Hardcoded English-only stories for localization-sensitive components
- Assuming English string lengths

### The locale toolbar
The global Storybook toolbar has a Locale switcher (en/sq/uk/it).
All stories automatically wrap with `NextIntlClientProvider` via the global decorator.
Individual stories may also set locale directly via `parameters.locale`.

---

## §5 — RESPONSIVE VIEWPORT STORY RULES

Every story MUST be responsive-aware. The global viewport toolbar includes all 15 project breakpoints.

### When to explicitly set viewport
Set `parameters.viewport.defaultViewport` when the story demonstrates:
- Mobile-specific behavior (drawers, bottom bars, touch targets)
- Huge desktop behavior (container bounds, 4-column grids)
- Tablet-specific layout changes

### Required viewport coverage in stories
| Breakpoint | Required When |
|---|---|
| `mobile375` | Any mobile-critical component (touch targets, drawers, sheets) |
| `tablet768` | Any layout that changes at tablet width |
| `desktop1280` | Default for most desktop stories |
| `desktop2560` | Any container/grid story demonstrating huge-desktop bounds |

### Forbidden in stories
- `typeof window` or `useWindowSize` in story components
- `window.innerWidth` checks
- Inline `style={{ width: condition ? 'X' : 'Y' }}` for responsive behavior

---

## §6 — HUGE DESKTOP STORY RULES (1536px–2560px)

For any story demonstrating containers, grids, or page layouts:
- Include a `desktop2560` viewport variant
- Verify `.container-wide` bounds content at 1408px (no whitespace wasteland)
- Verify listing grids show `2xl:grid-cols-4` (4 columns at 2560px)
- Verify admin layouts don't stretch full viewport

Reference stories: `System/Containers`, `System/ListingGrid`

---

## §7 — ACCESSIBILITY EXPECTATIONS

All stories must be keyboard-navigable in Storybook.

For Phase 4 (current): manual accessibility review only.
For Phase 5 (future): `@storybook/addon-a11y` will be added for automated a11y checks.

Current requirements:
- Icon-only buttons MUST have `aria-label`
- Form fields MUST have associated `<label>` elements
- Dialogs/Sheets: focus trap is provided by shadcn primitives — verify it activates

---

## §8 — TAILWIND ENTROPY EXPECTATIONS

Stories MUST follow Tailwind governance (`docs/tailwind-governance.md`):
- Use canonical fragment patterns from `docs/tailwind-canonical-fragments.md`
- No arbitrary spacing in stories (`py-[13px]` etc.)
- No hardcoded hex colors
- No non-canonical px sizes

Running `npm run governance:tailwind` will scan story files. Keep entropy within baseline.

---

## §9 — FORBIDDEN STORY ANTI-PATTERNS

```
❌ Raw <button> elements in executable stories
❌ Custom div.fixed.inset-0 overlays instead of Sheet/Dialog
❌ Non-lucide icon libraries
❌ h-11 className on Button (use size="xl")
❌ window.location.href navigation
❌ suppressHydrationWarning
❌ Live API calls / fetch() in stories
❌ Supabase client usage in stories
❌ Auth session checks in stories
❌ Random IDs or dates (use stable fixtures)
❌ Fixed px widths on localized text elements
❌ whitespace-nowrap without truncation safety
❌ English-only text for locale-sensitive components
```

---

## §10 — STORY FILE ORGANIZATION

```
.storybook/
  main.ts              — Storybook framework config
  preview.tsx          — Global decorators, viewport, i18n
  preview-head.html    — Geist font CDN
  README.md            — Developer guide

src/
  components/
    ui/
      button.stories.tsx     — Colocated primitive stories
      badge.stories.tsx
      input.stories.tsx
      tabs.stories.tsx
      dialog.stories.tsx
      sheet.stories.tsx
      skeleton.stories.tsx
      checkbox.stories.tsx
  stories/
    fixtures/
      listing.fixture.ts     — Stable test data
    EmptyState.stories.tsx
    Containers.stories.tsx
    ListingGrid.stories.tsx
    AdminLayout.stories.tsx
```

---

## §11 — CI INTEGRATION

`npm run governance:storybook` runs `storybook build --quiet` (static build validation).

**NOT included in `npm run governance`** because:
1. Storybook build takes 60–120s — too slow for every PR governance check
2. Governance should remain fast and focused on static analysis
3. `npm run build-storybook` should be run manually or in a dedicated CI job

For PR validation: run `npm run governance:storybook` as a separate optional CI job.

```yaml
# In governance-pr.yml — add as optional parallel job:
storybook:
  runs-on: ubuntu-latest
  if: contains(github.event.pull_request.labels.*.name, 'needs-storybook-check')
  steps:
    - run: npm ci
    - run: npm run governance:storybook
```

---

## §11 — COMPONENT CATALOG INTEGRATION (Phase 6)

Storybook story coverage is tracked in the component catalog.

**Check story status:**
```bash
npm run catalog:components
# Review docs/component-coverage-matrix.md §Storybook Coverage
# Review docs/component-coverage-matrix.md §Coverage Gaps
```

**Story coverage expectations by type:**
| Type | Story required |
|---|---|
| `canonical-primitive` | Required |
| `shared-ui` with useTranslations | Required |
| `layout` | Required |
| `admin-shared` used in 2+ pages | Required |
| Other | Recommended |

When adding a story, update the catalog:
```bash
npm run catalog:components
```
