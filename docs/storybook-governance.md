# Storybook Governance — Lero.al
**Phase 4 of Future Maintenance Direction Epic**
Established: 2026-05-18
Status: PERMANENT GOVERNANCE REFERENCE

> **Task 482 Mantine proof-path supersession — 2026-06-24.**
> `withCanvas` / `.container-wide` is retained only for legacy stories while migration is in progress.
> New Mantine stories under `Patterns/Mantine/*` must set `parameters.skipCanvas: true` and render through
> the global `withMantine` decorator. Their responsive and locale proof is toolbar-driven:
> the owner switches viewport and locale using Storybook globals, while each pattern group exposes one
> canonical `Default` story that renders reusable components from `src/design-system/mantine/patterns/**`.
> Task 482 uses a Light-only theme and does not require `Dark`, `LongUk`, viewport, locale, `Pass`, or `Fail` story exports.
>
> **Two proof paths exist after Task 482:**
> - **Mantine path (new):** `Patterns/Mantine/*` stories use `skipCanvas: true`, `withMantine` decorator, Mantine layout components, toolbar viewport + locale proof, Light-only theme. No per-viewport exports, no per-locale exports.
> - **Legacy path (existing):** All other stories use `withCanvas` / `.container-wide` per the existing governance below. These rules remain valid for legacy surfaces until migration.
>
> **Validation depth:** use `docs/qa-profiles.md`. New primitives, overlays, TailAdmin conformance, and
> Storybook governance work are normally Q3. Small story text or fixture adjustments can be Q1/Q2 when no
> responsive or visual chrome behavior changes.

**Storybook version:** `10.4.2` (upgraded from 8.6.18 by Task 394, 2026-06-05)
**Framework:** `@storybook/nextjs-vite@10.4.2` (was `@storybook/experimental-nextjs-vite@8.6.18`)
**Addons:** `@storybook/addon-docs@10.4.2` (addon-essentials replaced; controls/actions/backgrounds/viewport are now SB10 core)
**ESLint plugin:** `eslint-plugin-storybook@10.4.2` (added by upgrade; `flat/recommended` config appended)

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

> **Task 482 Mantine update:** New `Patterns/Mantine/*` stories must NOT use `parameters.viewport.defaultViewport` to create per-viewport exports. Viewport switching for Mantine stories is toolbar-driven (owner selects from the 12 proof widths: 275, 320, 390, 480, 560, 680, 768, 960, 1024, 1200, 1440, 1920). Each Mantine pattern group exports exactly one story: `Default`. The rules below apply to legacy non-Mantine stories only.

Every legacy story MUST be responsive-aware. The global viewport toolbar includes all project breakpoints.

### When to explicitly set viewport (legacy non-Mantine stories only)
Set `parameters.viewport.defaultViewport` when the legacy story demonstrates:
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

Reference stories: `System/Containers`, `System/FeaturedListings`

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

## §8b — CANONICAL STORY TAXONOMY (Task 358, 2026-06-02)

**Every component section in Storybook MUST be a small, scenario-named canonical set. Per-width/proof/duplicate exports are forbidden.**

### Scenario-named exports (required)
Every `export const` name MUST describe a **scenario or mode**, not a viewport width.

✅ `Default`, `WithActions`, `WithTabs`, `LocaleStress`, `Empty`, `Loading`, `Disabled`, `NoActiveFilters`, `SheetOpenMobile`, `RawKeyStress`
❌ `Mobile320`, `Desktop1280`, `W375`, `Canonical960`, `StackedAt560`, `InlineAt768` as standalone export names or suffixes

Width-number tokens (320, 375, 390, 480, 560, 680, 768, 810, 960, 1024, 1200, 1280, 1440, 1920, 2560) MUST NOT appear at the end of an export name.

### Breakpoints via the viewport toolbar (required)
Breakpoints are verified using the **Storybook viewport toolbar** — NOT as separate named exports.
- One canonical story covers all widths via the toolbar.
- A story pinned to a specific width (e.g. `parameters.viewport.defaultViewport: 'mobile320'`) is acceptable only when the story demonstrates a REAL mode difference that is inherently mobile (e.g. locale stress at the narrowest realistic width) — NOT to create a width sweep.

### Locales via the locale toolbar (required)
Locales (sq/en/uk/it) are exercised via the **locale toolbar** — NOT as separate locale-named exports.
- One `LocaleStress` story per component (pinned to `mobile320` viewport, **toolbar-reactive for locale — NO `locale` pin**) covers the worst-case overflow scenario.
- The locale toolbar handles all locale switching for all stories. Per-locale export families (`Uk*`/`Sq*`/`It*`/`En*`/`Ukrainian*`/etc.) are FORBIDDEN (Check 3).
- Hardcoded `locale` values in `globals`, `args`, or JSX props are FORBIDDEN (Check 4). Resolve locale from `context.globals.locale`.
- Viewport/width-named exports (`Mobile320`, `Tablet`, `Desktop`, etc.) are FORBIDDEN unless allowlisted as a real overlay/interaction mode in `scripts/story-realmode-allowlist.json` (Check 12).
- Duplicate-family export names (`Proof*`, `Demo*`, `Filtered*`, `Canonical*`) are FORBIDDEN unless allowlisted (Check 13).

### One canonical set per component (required)
Each component section has ONE canonical story per real mode. "Real mode" = a state the component genuinely reaches (e.g. filter with 0 active vs 2 active vs sheet open). There is NO per-width duplicate of the same mode.

### Docs primary = canonical state
The autodocs page (`tags: ['autodocs']`) uses the first exported story as the Docs primary. The first export MUST be `Default` (or the most representative canonical state).

### Component removal governance
When a component is removed from the codebase (zero product consumers, owner-authorised), its entry is removed from:
- `docs/component-catalog.md`
- `docs/design-system.md` references
- `docs/responsive-screenshot-matrix.md`
- All `*.stories.tsx` importers (migrated or deleted)

---

## §8a — RENDERED QA RULES (Task 354-Fix, 2026-06-01)

**`build-storybook` is NOT visual approval. A passing build proves the story compiles; it does NOT prove the rendered layout is correct.**

### Rendered PASS definition
A story cell (story × viewport × locale) is marked **PASS** ONLY when:
1. The story is rendered in a browser at the specified viewport.
2. The developer visually inspects the output and confirms it matches the acceptance criteria.
3. Optional: a screenshot is captured as evidence.

### OWNER QA REQUIRED gate
When a Sonnet executor cannot render Storybook (no browser access during the session), all story cells
in the QA matrix MUST be marked **OWNER QA REQUIRED** — not PASS. The executor MUST NOT self-approve
a rendered layout change without actual visual inspection.

### Forbidden approval paths
- ❌ Claiming PASS based on `build-storybook` exit 0 alone.
- ❌ Claiming PASS based on code-level / structural analysis.
- ❌ Claiming PASS without specifying the viewport and locale that were verified.
- ❌ A locale-specific story (uk/sq/it) marked PASS if English scaffolding is still visible.

### Status-label contract (see ui-rules.md §18)
- ❌ Normal story showing raw enum values (`open`, `in_progress`, `resolved`, …) as user-visible labels.
- ❌ Status transition arrow `open → in_progress` visible in a normal story.
- ✅ Normal story provides `labelFormatter` per locale so both sides are human-readable.
- ✅ `*_RawKeyStress` story explicitly tests the component's safe fallback.

### Mixed-language story contract (see ui-rules.md §19)
- ❌ Story with `globals: { locale: 'uk' }` showing English "New Listing", "Search results", "Page content area", "Available Listings".
- ✅ Locale story uses locale-specific action labels, section titles, and sample content.
- ✅ English-only content is acceptable only in stories with `globals: { locale: 'en' }` (or no locale set = en default).

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
❌ size="sm" buttons/chips as tappable mobile controls (use size="xl" = 44px)
❌ Claiming rendered PASS from build-storybook exit 0 alone (see §8a)
❌ Raw enum values (open, in_progress, resolved …) as user-visible labels in normal stories (see §8a)
❌ Mixed-language content in a locale-specific story (see §8a)
❌ Parallel non-filtered and filtered story families for the same component (creates a confusing duplicate taxonomy — see §12)
❌ A non-filtered table as Docs/autodocs primary example when the component's canonical state includes filtering
❌ "Proof-only" story families (`ColFilter_*`, `Demo_*`, etc.) that duplicate an already-canonical story taxonomy
```

---

## §12 — ADMIN TABLE CANONICAL STORY CONTRACT (updated 2026-06-02)

`AdminTable` canonical interaction is **sort + hide-column menus + Columns manager + global search**. No row-filter chips.

- The **first export** (Docs primary) MUST be the canonical table with sort menus and global search.
- Column ⇅ icon is `h-3 w-3` (12px) — **strictly smaller than the `text-sm` (14px) header font**.
- Column ⇅ opens a **DropdownMenu** with type-correct sort items (text A→Z/Z→A, date Newest/Oldest, numeric low→high/high→low) + "Hide column" (EyeOff). **NO filter chips, NO funnel/sliders icons**.
- A **Columns manager** (Button → Popover checklist) controls column visibility and restores hidden columns.
- **Global search** (one Input) is the ONLY data-narrowing control — no Status/Role/City chip toolbar.
- Stories are **scenario-named** (Default, ColumnMenu, ManageColumns, CardMode, Interactive, Responsive, LocaleStress, EmptyState, LoadingState). NO per-width exports (`W320`, `W375`, etc.). Breakpoints are checked via the **Storybook viewport toolbar**.
- Story count target: **≤14** (one canonical family, no per-width or parallel families).
- Mobile sort control (card mode): compact Sort dropdown — same sort model, same labels.
- Forbidden icons everywhere: `Funnel`, `Sliders`, `SlidersHorizontal`, `Tune`, `Settings`, `Settings2`, `ListFilter`, `Filter`.

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
    FeaturedListings.stories.tsx
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

---

## §13 — CANONICAL STORY STANDARD (Task 376/376-Fix, 2026-06-04) — global sweep baseline

**This is the non-negotiable standard. All 29 story files in Admin/Layout/Shared/Primitives/System have been swept to this standard.**

### Story creation/deletion/duplication rules
- Do NOT create new story files for localization
- Do NOT create locale-specific duplicate story exports (`DefaultUk`, `UkrainianDefault`, etc.)
- Do NOT delete or hide broken stories — fix them in place
- Do NOT rename story exports to bypass broken behavior
- Do NOT increase or decrease the Storybook story count to solve i18n

### Toolbar locale is the single source of truth
Every normal story follows the active Storybook toolbar locale. The canonical pattern:
```tsx
export const MyStory: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return <MyComponent locale={locale} />
  },
}
```

Forbidden:
- `globals: { locale: 'uk' }` story-level pins — ALL stories must be toolbar-reactive
- `parameters.globals.locale` — silently ignored by the locale decorator
- Nested `useGlobals()` inside story helper components — only the outermost render function may read globals
- Hardcoded `locale="en"` props in render functions — use context instead

### Locale Stress is toolbar-reactive
- `LocaleStress` stories follow the toolbar locale (toolbar=sq → Albanian, toolbar=uk → Ukrainian, etc.)
- Locale Stress NEVER locks to uk or any other locale
- Each locale's stress content (long strings) is provided via per-locale fixture maps inside the story
- No new per-locale stress stories are created

### Fixture data i18n rule
All user-facing story fixture fields must be locale-safe:
- Titles, descriptions, labels, placeholders, empty states, button text, tab labels, table headers, badge text — all through per-locale record maps
- Locale map pattern: `const MAP: Record<string, Record<string, string>> = { en: {...}, sq: {...}, uk: {...}, it: {...} }`
- Every map MUST have complete sq/en/uk/it parity
- No field may silently fall back to English in sq/uk/it
- Developer-only documentation prose (CSS class names, technical identifiers, code examples) may remain English

### Global category coverage
All five Storybook categories are required sweep scope:
- **Admin**: AdminCardList, AdminPageShell, AdminTable, StatusChangeControl, StatusChangeHistory
- **Layout**: FilterBar, PageHeader, PageShell, Section
- **Shared**: Combobox
- **Primitives**: Badge, Button, Checkbox, Command, Dialog, DropdownMenu, Input, PasswordInput, PasswordRequirementsHint, Popover, Select, Sheet, Skeleton, Tabs
- **System**: AdminLayout, Containers, EmptyState, FeaturedListings, LatestListings, RecentlyViewedSection, SimilarListings

### Remaining rules (unchanged from §9)
1. **No raw HTML controls.** No `<button>`, `<input>`, `<select>`, `<textarea>` — use canonical components only.
2. **No mixed-language canvas.** sq canvas = Albanian only. uk canvas = Ukrainian only. it = Italian only.
3. **No hardcoded relative time.** Use `useFormatter().dateTime()` or locale-safe tokens.
4. **Actions panel wiring.** Interactive controls log via `fn()`/args from `@storybook/test`.
5. **Scenario-named exports.** No width-number suffixes (`Mobile320`, `W375`).

**Required QA proof format:** rendered matrix `locale (sq/en/uk/it) × viewport (320/375/390/480/560/680/768/810/960/1024/1200/1440/1920/2560)`. uk@320/375/390 are mandatory cells. `build-storybook` exit 0 is NOT proof (see §8a).

---

## §14a — SB10 Migration Notes (Task 394, 2026-06-05)

### SB8→SB10 workaround disposition

| Workaround | Classification | Action taken |
|---|---|---|
| Custom `VIEWPORTS` map (20 breakpoints) | **REPLACE** — migrated to SB10 `parameters.viewport.options` API | `viewports:` renamed to `options:` in preview.tsx `parameters.viewport`; `defaultViewport` moved to `initialGlobals.viewport.value` by `addon-globals-api` codemod |
| `withCanvas` `.container-wide py-6` decorator | **KEEP-CANONICAL** — mirrors real app gutter; `max-sm:w-full` correctly fills <640 edge-to-edge | Unchanged; still wraps every story; verified producing correct edge-to-edge fill under SB10 layout engine |
| `addon-essentials` meta-package | **REPLACE** — deprecated in SB10 (no v10 release) | Replaced with `@storybook/addon-docs@^10.4.2`; controls/actions/backgrounds/viewport now SB10 core |
| `@storybook/experimental-nextjs-vite` | **REPLACE** — graduated to stable | Replaced with `@storybook/nextjs-vite@^10.4.2`; framework name updated in main.ts |
| `parameters.layout: 'fullscreen'` | **KEEP-CANONICAL** — required for full-width <640 enforcement; gate §14.1 | Unchanged |
| `@storybook/react` story imports | **REPLACE** — deprecated in SB10; `storybook/no-renderer-packages` rule | All 29 story files + preview.tsx updated from `'@storybook/react'` to `'@storybook/nextjs-vite'` |
| `docs: { autodocs: 'tag' }` in main.ts | **REPLACE** — deprecated in SB10 | Removed by `remove-docs-autodocs` codemod; per-story `tags: ['autodocs']` still works |
| Per-story `parameters.viewport.defaultViewport` | **REPLACE** — migrated to `globals.viewport` | Updated by `addon-globals-api` codemod to `globals: { viewport: { value: '...', isRotated: false } }` |

### SB10 API changes summary (for future reference)

- **Viewport:** `parameters.viewport.viewports` → `parameters.viewport.options`; `parameters.viewport.defaultViewport` → `initialGlobals.viewport.value`; per-story default → `globals.viewport.value`
- **Backgrounds:** `parameters.backgrounds.default` + `parameters.backgrounds.values` → `parameters.backgrounds.options` + `initialGlobals.backgrounds.value`
- **Story imports:** `from '@storybook/react'` → `from '@storybook/nextjs-vite'` (framework package re-exports all React types)
- **ESM main.ts:** Added `const __filename = fileURLToPath(import.meta.url); const __dirname = dirname(__filename)` by `fix-faux-esm-require` codemod
- **index.json:** SB10 uses `v: 5` (was `v: 4`); structure unchanged — `{ entries: { [id]: { id, type, ... } } }` — `check-locale-leak.mjs` and `check-stories-rendered.mjs` scripts compatible

---

## §14 — Enforceable Storybook gates (Sprint 33, 2026-06-04) — SUPERSEDES the self-reported parts of §13

> **Why this section exists.** §13 was already correct prose — yet the owner rendered every story and almost all
> FAILED (hardcoded English content; buttons/tabs/select not full-width at <640; redundant `Ukrainian*` stories;
> visible RVS scrollbar). Root cause: the rules were prose + self-reported greps, and the Storybook canvas itself
> (`layout:'centered'/'padded'`) defeated the mobile full-width rule even when the primitive was correct.
> Conclusion: **prose rules that are not machine-enforced, and proof that is not machine-produced, do not survive.**
> This section makes the rules un-committable to violate and the proof automatic. Full diagnosis:
> `docs/sessions/2026-06-04-orchestrator-sprint32-rendered-rejection-rootcause.md`. Delivered by Sprint 33
> (Tasks 380–383, `tasks/Sprints/Sprint_33_CORRECTIVE_*`).

### 14.1 Full-width mobile-accurate canvas (no more centred/padded masking)
- A global `withCanvas` decorator in `.storybook/preview.tsx` renders EVERY story in a full-available-width,
  mobile-accurate frame using the canonical page-gutter token from `design-system.md` — never Storybook's
  `centered`/`padded` layout. A correct `max-sm:w-full` primitive MUST visibly fill the <640 viewport in the canvas.
- **Canonical vertical padding:** `py-6` (1.5rem / 24px, design-system.md §5 Tailwind 4px scale) — applied once in
  `withCanvas`. Provides consistent separation between the Storybook toolbar and story content across all 29 stories.
  Do NOT add per-story wrapper `py-*` / `pt-*` to compensate — that creates double padding. The `withCanvas` `py-6`
  is the single vertical-padding source; story render functions must not add canvas-level vertical padding.
- Global default is `parameters.layout: 'fullscreen'`. **`layout: 'centered'` and `layout: 'padded'` are FORBIDDEN
  in story files** (lint-enforced). If a story seems to need a centred preview, STOP&ASK — never add an exemption.

### 14.2 Single locale-aware fixture/i18n layer (no raw literals, ever) — supersedes §13's per-file maps
- All user-facing story/fixture strings come from the `storybook.*` message namespace (sq/en/uk/it parity) via the
  `storyT`/`useStoryMessages` helper (`src/stories/_storyI18n.ts`). Fixtures expose **keys**, not literals. This
  replaces §13's "per-locale record maps inside the story" with one single source.
- The uk values ARE the "longest strings" stress content. There is no separate hardcoded uk fixture, and no
  `globals:{locale:'uk'}` pin. `LocaleStress` is one toolbar-reactive export per component, **never named "Ukrainian".**

### 14.3 Machine gates (a violation FAILS the build — not a checklist)
- **ESLint** (scoped to `src/**/*.stories.tsx`, `src/**/*.stories.ts`, `src/stories/**`) errors on: `layout:'centered'|'padded'`; raw
  `<button>/<input>/<select>/<textarea>` JSX; raw user-facing string literals in JSX text / `aria-label` /
  `title`/`label`/`placeholder` / fixture fields (anything not from `t()`/`storyT()`, minus a documented allowlist).
  ESLint is a static best-effort signal; `check-stories.mjs` is authoritative for allowlist-aware checks.
- **`scripts/check-stories.mjs`** (`npm run check:stories`, `checksRan: 16`) runs 16 governance checks over
  `**/*.stories.{ts,tsx}` and exits non-zero on any violation; wired into `prebuild-storybook`/`prestorybook` and CI.
  Checks 1–11 are the original checks (layout, raw HTML, locale-NAME families, locale pins, title literals, key parity,
  inline locale maps, uk.json Cyrillic, runtime hardcode, JSX string-prop literals, toolbar overflow). Task 468 broadened
  **Check 3** (locale-NAME export families: `Ukrainian`/`Albanian`/`Italian`/`English` + `Uk`/`Sq`/`It`/`En` leading
  segments, identifier-token, file-scoped allowlist), **Check 4** (all hardcoded locale literals `uk`/`sq`/`en`/`it` in
  object properties AND multiline JSX props — excludes function parameter defaults and fixtures), and added **Check 12**
  (viewport/width-named exports via identifier-token segmentation vs `scripts/story-realmode-allowlist.json`), **Check 13**
  (duplicate-family export names `Proof`/`Demo`/`Filtered`/`Canonical` vs same allowlist), plus a stale-allowlist-entry check.
  The file-scoped allowlist (`scripts/story-realmode-allowlist.json`) keys by `{file, export, check, reason}` — a name
  allowlisted in one file does NOT bypass the check in a different file.
- **`responsive-screenshots --assert`** captures each story × breakpoint × locale AND asserts no horizontal scroll
  at 320 and full-width text controls at <640, emitting a machine-readable matrix (JSON + PNGs). **This is the only
  accepted rendered proof.** "OWNER QA REQUIRED / NOT CHECKED / no browser access" no longer closes a UI cell.

### 14.4 Proof rule (restated)
`tsc=0` / `lint=0` / `build-storybook` exit 0 are baselines, never proof. A Storybook/UI task is INCOMPLETE unless
its session log references the `--assert` PNG/JSON artifacts per rendered cell (uk@320/375/390 mandatory) and shows
the gates green — plus a negative-flow transcript proving each gate FAILS on a planted violation, then reverts.

### 14.4.1 Rendered-proof contract (Task 464, 2026-06-19)
A screenshot is NOT proof of rendered Storybook content unless the gate verifies ALL FIVE layers:
1. **No unresolved loader** — spinner/progress/skeleton (for non-allowlisted stories) must be absent at capture time; timeout with loader still present → `loader-only` FAIL.
2. **Non-empty visible DOM** — `#storybook-root` must exist, have a non-zero bbox, contain visible rendered descendants, and not be merely the Storybook shell or an empty wrapper; violation → `blank-canvas` or `empty-canvas` FAIL.
3. **Required semantic anchors** — every `ASSERT_STORIES` entry declares ≥1 `anchors[]` marker; every declared anchor must be found AND visible in the DOM; missing anchor → `anchor-missing` FAIL; no declared anchors on a non-allowlisted story → config-error FAIL.
4. **Non-blank screenshot bitmap** — the captured PNG must not be visually empty/near-uniform (blank white, transparent, or shell-only); violation → `blank-screenshot` FAIL.
5. **Manifest evidence** — per-cell `anchorsExpected`, `anchorsFound`, `visualContentCheck` metrics recorded; top-level `summary` with `total/passed/failed/loaderOnly/blankCanvas/emptyCanvas/blankScreenshot/anchorMissing` counters.

**Horizontal-overflow, responsive, full-width, popup, and regression checks are INVALID unless the story first passes rendered-proof (layers 1–4).** The harness evaluates each cell in this exact order, short-circuiting on the first layer that fails. A PASS is valid only when BOTH rendered-proof AND visual-assertion layers pass.

### 14.4.2 Geometry/visual-integrity layer (Task 467, 2026-06-19)

Layer 3 of the rendered-proof harness checks that every visible interactive element is geometrically intact at 320/375/390 × sq/en/uk/it. A screenshot is NOT proof unless, in addition to the five points above, every visible interactive element also passes geometry/visual-integrity:

1. **`text-clipped`** — interactive element text is clipped by an `overflow:hidden`/`clip` ancestor with NO `text-overflow:ellipsis` affordance (cut mid-glyph). Inspects nearest text-bearing descendant, not root; icon-only with `aria-label` exempt. **V1-FINAL (FP-CLASS A):** the text-bearing-descendant walk skips sr-only / visually-hidden nodes (detected via `position:absolute` + `overflow:hidden` + ≤1px dimensions, or `clip:rect(0,0,0,0)` / `clip-path:inset(50%)`); a control whose only text is from sr-only descendants (e.g. `<XIcon/> + <span class="sr-only">Close</span>` with NO `aria-label`/`title` on the button) is exempt from text-clipped unconditionally — the sr-only text itself provides the accessible name (false-positive guard: `Planted/SrOnlyIconButton` must PASS). Intentional `text-overflow:ellipsis` with an intact accessible name routes to `text-clipped-ellipsis` (ambiguous third state, not hard FAIL). **V1-FINAL (FP-CLASS D):** third-party controls inside `.leaflet-container` are excluded from all geometry checks (not our layout).
2. **`offscreen-control`** — interactive element extends beyond viewport boundaries horizontally (fail-closed). Elements with an `overflow-x:auto|scroll` ancestor route to `ambiguous-offscreen` (reachable by horizontal scrolling). Vertical offscreen fails only when unreachable by normal scrolling.
3. **`element-overlap`** — two visible interactive elements overlap by >1px after algorithmic exclusions (ancestor/descendant, label↔input, aria-hidden/inert, closed overlay layers, `pointer-events:none`). Library-internal elements (base-ui/radix/floating-ui) and `position:absolute|fixed` over a non-positioned sibling (popup-over-trigger) route to `ambiguous-overlap` (third state). **Clip-aware (Task 569, 2026-07-10):** before comparing two rects, each is intersected against every `overflow:hidden|auto|scroll` ancestor in its chain (`getVisibleClippedRect` — the SAME `isClippingAncestor` predicate `outside-container`/point 4 already uses, factored into one shared helper, not duplicated). An element fully clipped away by an ancestor at the current scroll position (its intersected rect collapses to nothing) cannot produce an overlap — its raw, unclipped `getBoundingClientRect()` may still geometrically extend into a sibling's on-screen coordinates (e.g. the last row of a `flex:1;overflow-y:auto` scroll region vs a pinned footer sibling below it — `MantineDrawer`'s Task 567 Fix 4 pattern), but nothing is actually painted there. A genuine overlap where BOTH elements are fully within their own painted (unclipped) boxes — even inside a scrollable ancestor — still hard-FAILs; the exemption never widens to "anything inside something scrollable" (see `Planted/VisualViolations/ScrollVisibleOverlap`, which must and does still FAIL).
4. **`outside-container`** — interactive element extends beyond its nearest `overflow:hidden`/`clip` clipping ancestor.
5. **`bottomsheet-overflow`** — at <640, interactive content inside a bottom-sheet/dialog exceeds the sheet's reachable area (non-scrollable sheet with controls past its bottom edge, including partial clip where control top is inside but bottom extends past).
6. **`self-clipped`** — DEFERRED (F-H, Round 3). Documented in contract and summary counter, but not yet implemented in `geometry-integrity.mjs` (structurally 0). Will detect an interactive element whose own content box clips its actionable content. Implementation reserved for a follow-up task.

**V1-FINAL (FP-CLASSES B/C — viewport-mismatch):** any cell rendered outside its declared `STORY_VIEWPORT_RANGE` receives `cell.pass=false`, `cell.verdict='out-of-range'`, `cell.viewportMismatch=true` — regardless of whether the cell would otherwise pass or fail. Outside-range cells are not citable as rendered proof and are not product layout defects. They are routed to a separate inventory section (never Bucket 1) and excluded from the hard-defect count. Current ranges: `admin-adminmobileheader--default` maxWidth=960, `admin-adminsidebar--mobile-drawer-open` maxWidth=960, `admin-adminsidebar--collapsed-rail` minWidth=1024. Guard fixtures: `Planted/NarrowRangeGuard` (maxWidth=960) + `Planted/LargeRangeGuard` (minWidth=1024).

The geometry layer runs on **ALL stories** (global enumeration from `storybook-static/index.json`; read failure aborts the run, never silently drops coverage), not only `ASSERT_STORIES`. Results are classified into **four buckets** via the per-cell `verdict` field (`'pass' | 'fail' | 'ambiguous' | 'out-of-range'`): hard defects (`verdict='fail'`), **ambiguous/needs-owner-decision** (`verdict='ambiguous'`, `cell.pass=false`, `cell.ambiguousOnly=true` — cannot be cited as green proof, cannot be read as clean PASS by any consumer), **out-of-range** (`verdict='out-of-range'`, `cell.pass=false`, `cell.viewportMismatch=true` — not product defect, not citable as proof), and clean PASS (`verdict='pass'`). Planted violation stories in `src/stories/PlantedVisualViolations.stories.tsx` (12 stories: 5 hard-FAIL classes + 4 false-positive/viewport guard PASS + 2 ambiguous third-state proofs + 1 unstyled-render fixture) serve as **standing fixtures**; OLD@`5c2edabae`-PASS / NEW-FAIL proof **owner-native verified (2026-06-22)** for ALL 9 planted stories: ClippedButtonText(`text-clipped`), OverlappingActions(`element-overlap`), OffViewportControl(`offscreen-control`), ContainerClipped(`text-clipped`), ContainerEscape(`outside-container`), KnownGoodControl(PASS guard), AmbiguousOverlap(`ambiguous-overlap`), IntentionalEllipsis(`text-clipped-ellipsis`), UnstyledFrame(`unstyled-render`, `hardAfterRetries=true`). Evidence: `docs/sessions/task467-{old,new}-planted-containerescape-unstyledframe.json`. The harness auto-generates a per-cell inventory (`docs/governance-reports/`) from the manifest on each run; current inventory: 240 stories, 6532 cells (`docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md`) — generated by the V1-FINAL full (non-fast) run (2026-06-22T20-10); process exited with controlled code 1 (`failed=757 > 0`). Proof summary: `docs/sessions/task467-v1final-proof-summary.json` (15/15 invariants passed). Full run is authoritative for AC1/AC9.

### 14.4.3 Style-integrity layer (Task 467 R4, 2026-06-20)

A screenshot is NOT proof unless the captured frame has CSS/design-system styles applied. The style-integrity layer detects `unstyled-render` via a multi-signal detector — four deterministic DOM/computed-style signals, any two of which failing triggers the verdict:

1. **Preflight applied (body margin):** `getComputedStyle(document.body).margin === '0px'` (Tailwind preflight zeroes body margin; UA default is `8px`). Failing = `bodyMargin ≠ "0px"`.
2. **Stylesheets loaded with rules:** `document.styleSheets` non-empty AND at least one sheet has `cssRules.length > 0`. Failing = no sheets or all sheets empty.
3. **Font not UA-serif default:** the first visible text node's `font-family` does not resolve to `"Times New Roman"` / bare `serif`. Failing = font is serif/Times.
4. **DS control themed (tri-state):** `[data-slot="button"]` evaluates to `true` (themed), `false` (UA-default), or `not-applicable` (no DS control in story — neutral, does not contribute to verdict). Failing = `false`.

Fail when ≥2 of the applicable signals indicate unstyled. Style-not-ready is retried up to `MAX_ATTEMPTS` (re-navigate + await stylesheets); only after all attempts exhausted → hard `unstyled-render` FAIL. After `MAX_ATTEMPTS`, the cell is marked `hardAfterRetries=true` and `isTransientFailure` returns `false`, so the final `unstyled-render` is non-transient and can never be retried into a pass. An unstyled capture is NEVER PASS and NEVER citable as proof.

**Planted UnstyledFrame proof (owner-native 2026-06-22):** The standing fixture uses CSS `revert` to trip `bodyMargin="8px"` (signal 1) and `data-slot="button"` after `all: revert` to trip `controlThemed=false` (signal 4). `sheetsWithRules` stays `true` (stylesheets remain loaded). `fontFamily` stays `"Geist, sans-serif"` (inherited from the un-reverted Storybook shell ancestor — CSS `revert` on a child cannot change inherited properties from ancestors outside the revert scope). Two of four signals fail → `unstyled-render` FAIL after `retryCount=2`, `hardAfterRetries=true`. Evidence: `docs/sessions/task467-new-planted-containerescape-unstyledframe.json`.

**The pre-467 gate (Task 464 only) could report PASS on visually broken stories and must not be cited as proof for any task until Task 467 is committed and the tree passes the repaired harness.** Owner-native evidence attached 2026-06-22 (`docs/sessions/task467-*.{log,json,txt}`); awaiting orchestrator review + commit.

### 14.5 Implementation notes (Task 380, 2026-06-04)

**Canvas gutter token:** `.container-wide py-6` — `container-wide` from `src/app/globals.css` §4 provides horizontal padding `1rem` (base) → `1.5rem` (≥640px) → `2rem` (≥1024px) → `3rem` (≥1536px); `py-6` (1.5rem / 24px, design-system.md §5 Tailwind 4px scale) provides canonical vertical separation from the Storybook toolbar. This is the ONLY canonical gutter — do NOT use ad-hoc `px-N`/`py-N` in story wrappers or Storybook's `padded` layout. Task 386 added the `py-6` vertical component.

**`withCanvas` decorator** (`storybook/preview.tsx`): wraps every story in `<div class="container-wide">`. Decorator order (outermost→innermost): `withTheme → withLocale → withCanvas → Story`. The canvas gutter applies directly around the story content.

**`storyT(locale, key)` helper** (`src/stories/_storyI18n.ts`): resolves `storybook.*` message keys per locale. Throws if the locale is unknown or the key is missing — NO English fallback in sq/uk/it (omissions are caught immediately in dev).

**Fixture migration pattern** (`src/stories/fixtures/listing.fixture.ts`):
- All user-facing title strings are in `storybook.listing.*` message keys (sq/en/uk/it parity).
- `makeListingFixtures(locale)` factory returns locale-resolved fixtures.
- Backward-compat static exports (e.g. `LISTING_FIXTURE`) default to English until Task 381 migrates consumers.

**ESLint story block** (`eslint.config.mjs`): scoped to `src/**/*.stories.tsx`, `src/**/*.stories.ts`, `src/stories/**`. Must come LAST in the config (flat-config LAST-WINS for `no-restricted-syntax`). Includes general `.tsx` selectors A, C, D PLUS story-specific selectors E–H. **Intentionally omits group B** (listing-status mutation selectors) so that fixture `status: 'active'` literals do not trigger lint errors — stories are not the mutation gateway. A/C/D/E/F/G/H remain active for stories (Task 411). ESLint is a static best-effort signal; `check-stories.mjs` is authoritative for allowlist-aware checks (§14.3).

**AST selectors documented (story-specific, group E–H):**
```
E1: Property[key.name='layout'][value.value='centered']
E2: Property[key.name='layout'][value.value='padded']
F1: JSXOpeningElement[name.name='button']
F2: JSXOpeningElement[name.name='input']
F3: JSXOpeningElement[name.name='select']
F4: JSXOpeningElement[name.name='textarea']
G:  ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[id.name=/Ukrainian/]
H:  Property[key.name='title'][value.type='Literal'][value.value=/^[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖÙÚÛÜ][A-Za-zÀ-ÖØ-öø-ÿ\s]{7,}$/]
```

**check-stories.mjs checks (`checksRan: 16`, updated Task 697 2026-07-30):**
1. `layout:'centered'|'padded'` — banned layout values
2. `<button|input|select|textarea>` — raw HTML controls in JSX (string-literal context filtered)
3. **Locale-NAME export families** (broadened Task 468) — identifier-token segmentation; FAIL if any segment equals `Ukrainian|Albanian|Italian|English` or `Uk|Sq|It|En` as a leading segment. File-scoped allowlist (`scripts/story-realmode-allowlist.json`). Token-segment, not substring: `Items`/`Enabled`/`Square` PASS
4. **Hardcoded locale pins** (broadened Task 468) — all four locales (`uk|sq|en|it`). Object property `locale: '…'` (`:` form — catches globals, args, meta.args) + JSX `locale="…"` / `locale={'…'}` (multiline-aware via JSX tag tracking). Excludes function parameter defaults (`locale = 'en'` with `=`) and fixture data files. Toolbar-reactive `context.globals.locale` PASS
5. Known English/Cyrillic title literals in `src/stories/fixtures/**`
6. `storybook.*` namespace key parity across sq/en/uk/it
7. Inline locale-map literals (`uk:`/`sq:` in stories) — all text must come via `storyT()` from `messages/*.json`
8. `messages/uk.json` storybook.* values Latin-only without Cyrillic — transliterated Ukrainian forbidden
9. Hardcoded user-facing English literals in runtime `src/components/**` and `src/modules/**`
10. English-literal JSX string props and text children in `*.stories.tsx` — see §14.7
11. `sm:flex-row` + `sm:flex-wrap` on same line — toolbar 640px overflow; use `md:flex-row md:flex-wrap`
12. **Viewport/width-named exports** (new Task 468) — identifier-token segmentation; FAIL if any segment equals `Mobile|Tablet|Desktop|Laptop|Wide|Huge`, `keyword+digits` (e.g. `Mobile320`), or a bare width number (`320…2560`). File-scoped allowlist (`scripts/story-realmode-allowlist.json`, keyed by `{file, export, check, reason}`). Stale-entry check: an allowlist entry pointing at a non-existent file or export FAIL
13. **Duplicate-family export names** (new Task 468) — FAIL if any identifier segment equals `Proof|Demo|Canonical(+digits)|Filtered`. Same file-scoped allowlist; only `AdminListingsTable/FilteredPending` allowlisted
14. Mantine `<Button size="lg"|"xl">` — off-scale button size (Task 520); canonical default `size="sm"` (14px) + 44px min-height, escape via `// @allow-button-size <reason>`
15. **Unregistered Mantine colour prop** (Task 685/686) — `color`/`c`/`bg` literal (Form A), `var(--mantine-color-*)` (Form B), and `*COLOR*`-named object-literal map (Form C) values must resolve to `theme.ts`'s registered colour set or a documented passthrough (CSS-wide keyword, CSS function call, `#hex`, Mantine keyword)
16. **Wall-clock fixture value** (Task 697/698, §14.10) — `Date.now()` used anywhere as a value, or bare zero-argument `new Date()` used as a value, outside comments and outside string/template literals. Does NOT flag `new Date(<non-empty argument>)`

**check-stories-rendered.mjs** (`npm run screenshots:assert`): Playwright assertions per story × {320,375,390,480,560,680,768,810,960,1024,1200,1440,1920,2560} (canonical 14 from `docs/responsive-screenshot-matrix.md §1`) × {sq,en,uk,it}. `--fast` runs only {320,375,390} for quick local loops. Assertions: (a) no `scrollWidth > clientWidth` overflow, (b) non-icon-only form controls `offsetWidth >= container content width - 8px` at <640. Emits JSON manifest + PNG per cell to `.screenshots/rendered-assert/<timestamp>/`. **`npm run screenshots:assert` (non-fast) is the canonical full-matrix acceptance command** — its transcript must show `Viewports: 14` for rendered-proof approval (Task 411).

### 14.6 Inline locale map prohibition (Task 389, 2026-06-04)

**Rule:** Every `*.stories.tsx` MUST source ALL user-facing strings from `messages/*.json` via `storyT(locale, 'storybook.KEY')`. Inline per-locale object maps (`const T = { en: '…', sq: '…', uk: '…', it: '…' }`) are **FORBIDDEN** in story files — they produce fake translations (transliterated Latin "Ukrainian", Albanian without diacritics) that look correct but render wrong.

**Correct pattern:**
```ts
import { storyT } from '@/stories/_storyI18n'
const t = (k: string, l = 'en') => storyT(l, `storybook.NAMESPACE.${k}`)
// Usage: t('my_key', locale)
```

**Forbidden pattern (gate check 7 will FAIL):**
```ts
// FORBIDDEN
const T = { en: 'New Listing', sq: 'Njoftim i ri', uk: 'Orenda ta prodazh', it: '...' }
```

**Adding new storybook keys:** Add to `messages/{sq,en,uk,it}.json` under `storybook.NAMESPACE.*`. Ukrainian (uk) MUST use Cyrillic. Albanian (sq) MUST use diacritics (ë, ç, etc.). Italian must be real Italian. NEVER transliterate. `check:stories` will FAIL if uk values have Latin-only text (check 8).

**Runtime components:** `src/components/**` and `src/modules/**` must use `useTranslations()` from next-intl. Hardcoded English labels in JSX output (e.g. `'Hide column'`, `'Previous'`, `'Next'`) are caught by check 9 and fail the build.

### 14.7 English JSX string-prop and text-child prohibition (Task 390 + Task 391, 2026-06-04)

**Rule:** All user-facing string literals in `*.stories.tsx` MUST come via `storyT(locale, 'storybook.KEY')`. Check 10 flags:

**Prop attribute forms** (watched props: `title`, `description`, `label`, `placeholder`, `heading`, `subject`, `cta`, `alt`, `aria-label`, `name`):
```tsx
// ALL of these forms are caught:
<Button title="Submit">…</Button>          // (a) double-quote
<Button title='Submit'>…</Button>          // (b) single-quote  ← new Task 391
<Button title={"Submit"}>…</Button>        // (c) expression double-quote  ← new
<Button title={'Submit'}>…</Button>        // (d) expression single-quote  ← new
<Button title={`Submit`}>…</Button>        // (e) template literal (no ${…})  ← new
```

**JSX text children** (Task 391):
```tsx
<Button>Submit</Button>                    // (f) text directly between > and <  ← new
<Label>First name</Label>                  // caught — Englishish text child
```

**NOT caught** (template literal with interpolation — produces dynamic value):
```tsx
<Button title={`${storyT(locale, 'storybook.cta')}`}>…</Button>   // ✅ safe
```

**"Englishish" heuristic:** starts with ASCII uppercase A–Z, ≥3 ASCII alpha chars, no non-ASCII diacritics (ë/ç/…) or Cyrillic → flagged. Albanian/Italian/Ukrainian text with the correct characters passes automatically.

**Documented allowlist (check 10 will NOT flag these):**
- Albanian city/district names: `Tirana`, `Durrës`, `Vlorë`, `Shkodër`, `Berat`, `Kombinat`, `Sauk`, `Blloku`, `Elbasan`
- Brand/technical tokens: `EUR`, `URL`, `DELETE`, `SMS`, `HTTP`, `HTTPS`, `WhatsApp`, `Email`
- Role labels in table-row fixtures: `Administrator`, `Moderator`, `Agent`
- Values that start with lowercase (CSS class names like "max-w-5xl…") — implicitly excluded by the uppercase-start rule
- Values containing non-ASCII diacritics/Cyrillic (Albanian `ë/ç`, Italian `à/è`, Ukrainian Cyrillic) — automatically excluded

**Developer-documentation text in stories** (e.g. StoryPurposeNote, DemoBox helpers, Lorem ipsum):
wrap in a JSX expression `{'Developer note text'}` — breaks the `>text<` regex while preserving display.
Do NOT use this pattern for real user-facing content; always localize that via storyT.

**Gate wiring:** Check 10 runs as part of `check:stories` (wired into `prebuild-storybook`) and exits non-zero on any violation. A test suite at `scripts/__tests__/check-stories.test.ts` (run by `npm test`) verifies all 16 checks (including Check 3/4 broadened + Check 12/13 new — Task 468; Check 15 — Task 685/686; Check 16 — Task 697) and all 6 Check-10 variants. Plant `title="Submit"` in a story and the build fails at file:line.

---

## §14.8 — Rendered locale-leak CI gate (Task 393, 2026-06-05)

**Why.** `check:stories` (§14.3) is a static-analysis gate — it catches hardcoded source literals in `*.stories.tsx`. The rendered locale-leak detector (`scripts/check-locale-leak.mjs`) is the complementary gate: it renders every story in a browser per locale and detects English text that leaked through to sq/uk/it at runtime (hardcoded props, dynamic defaults, component-internal English fallbacks that bypass the message layer). The two gates together close the gap between "no literal in source" and "no English literal in the rendered canvas".

**CI wiring (`.github/workflows/governance-pr.yml` — `locale-leak` job, Task 393).**

A dedicated `locale-leak` job runs on every PR touching `src/**`, `scripts/**`, `messages/**`, `package.json`, or `eslint.config.mjs`:

```
1. npm ci
2. npx playwright install chromium --with-deps
3. npm run build-storybook   ← also runs check:stories via prebuild-storybook hook
4. npm run check:locale-leak ← full scan: 157 stories × sq/uk/it × 3 viewports
```

The job fails if `leakCount > 0`. On failure, the `locale-leak-report` artifact (`.screenshots/locale-leak/<timestamp>/report.json`) is uploaded and available in the GitHub Actions run for 7 days.

**Note:** `check:locale-leak` cannot run as a `prebuild-storybook` hook (circular dependency — it requires `storybook-static/` which the build produces). It runs after `build-storybook` via the separate CI job.

**Manual run (owner workflow):**
```bash
npm run build-storybook       # also runs check:stories pre-gate
npm run check:locale-leak     # full — 157 stories × sq/uk/it × 3 viewports (~45 min)
npm run check:locale-leak:fast # fast — 320 viewport only, single locale pair (~5 min)
```

**Proof standard (§14.4 restated for this gate):** `leakCount: 0` in the emitted `report.json` is the ONLY accepted proof. Console output alone is not sufficient — paste the full `report.json` (timestamp, mode, storiesScanned, leakCount, leaks array) into the session log.

**Allowlist** (tokens that are intentionally language-neutral and never flagged):
- Albanian city/district names, person names used in fixtures
- Brand/technical tokens: `EUR`, `URL`, `DELETE`, `SMS`, `HTTP`, `HTTPS`, `WhatsApp`, `Email`, `API`, `ID`, `QA`
- Role labels: `Administrator`, `Moderator`, `Agent`
- Status codes: `ACTIVE`, `INACTIVE`, `PENDING`, `CLOSED`, `OPEN`, `SOLD`, `RENTED`, `ARCHIVED`
- Pure numbers, currency symbols, units, short abbreviations (≤2 chars)
- Arrow/separator patterns, Storybook UI chrome labels

Full allowlist: `scripts/check-locale-leak.mjs` → `LEAK_ALLOWLIST` array.

---

## §14.9 — Mantine/Primitives/* enforced rendered gate (Task 529, 2026-07-02)

**Why.** `scripts/check-stories-rendered.mjs` (`npm run screenshots:assert`, §14.3/14.4) is the ENFORCED rendered
gate, but until Task 529 its `ASSERT_STORIES` allowlist was hand-maintained and never included any
`Mantine/Primitives/*` story. Task 527 shipped a hard runtime crash (Textarea `TextareaAutosize` autosize guard)
and two visible chrome mismatches (overlay footer gap, Popover radius) while claiming "gates green" — the crash
and mismatches were real, but nothing machine-enforced could have caught them: Mantine primitives weren't in
`ASSERT_STORIES`, and the pre-existing "geometry-only" sweep (§14.4.2, runs on every OTHER indexed story) never
opens overlay primitives, so overlay-only defects (footer gap, radius) could never surface regardless. Task 528
proved its fixes with a throwaway standalone Playwright script — real proof, but never committed, never CI-wired,
disposable. Task 529 closes this hole permanently: `Mantine/Primitives/*` coverage is now **auto-discovered** (not
hand-maintained) and **CI-blocking**.

### 14.9.1 Auto-discovery (never hand-maintained)

`discoverMantinePrimitiveStories(indexData)` reads the already-parsed `storybook-static/index.json` and returns
every entry with `type === 'story'` and a title starting with `Mantine/Primitives/` — the same title prefix every
Mantine primitive story already uses (`Mantine/Primitives/Button`, `.../Modal`, etc.). A new Mantine primitive
story is covered automatically the moment it exists; the allowlist can never silently drift again (the exact
failure mode that let Task 527 slip). Two loud, non-zero-exit failure modes (never a silent zero-story pass),
both proven via planted breaks (2026-07-02, reverted clean):
- **Index unreadable** (missing/corrupt `index.json`): shares the same `try/catch` as the pre-existing
  geometry-only enumeration (§14.4.2) — both abort together.
- **Zero Mantine matches on a successfully-read index** (title-prefix drift, stale index): a dedicated check,
  since a successful-but-empty `JSON.parse` would otherwise slip past the first guard silently.

### 14.9.2 Coverage matrix

21 stories (all current `Mantine/Primitives/*` — Avatar, Badge, Button, Card, Checkbox, Drawer, DropdownMenu,
Label, Modal, NavigationMenu, PasswordInput, Popover, Radio, SegmentedControl, Select, Switch, Table, Tabs,
TextInput, Textarea, Tooltip) × the 3 mandatory mobile stress widths (320/375/390) + one desktop width (1024,
`MANTINE_VIEWPORTS`) × 4 locales (sq/en/uk/it) = **336 cells**, always run as **Phase 0** — unconditionally,
including under `--fast` (unlike the pre-existing Phase 2 geometry-only sweep, which `--fast` skips). A new
`--mantine-only` flag skips the pre-existing Phase 1 (`ASSERT_STORIES`) and Phase 2 (geometry-only) entirely for
fast local iteration and for the anti-no-op planted-break proofs below — it does not change what those phases do
when the flag is absent.

### 14.9.3 Opened-overlay state (the actual D3-class defect surface)

7 of the 21 (`Modal`, `Drawer`, `Popover`, `DropdownMenu`, `NavigationMenu`, `Select`, `Tooltip` —
`MANTINE_OVERLAY_PRIMITIVES`) get a scripted trigger click BEFORE every render/anchor/style/geometry check runs,
so those checks assess the OPENED DOM, not just the closed trigger — footer-gap/radius/crash-on-open defects
(the exact Task 527/528 D3 class) only render once opened. Click selector:
`#storybook-root button, #storybook-root input` — covers both trigger shapes actually observed: a real
`<button>` (Modal/Drawer/Popover/DropdownMenu/NavigationMenu/Tooltip) and Mantine Select's combobox trigger,
which renders as a plain `<input>` with no `<button>` and no `role="combobox"` in the installed Mantine version
(confirmed via DOM inspection, not assumed — an earlier `button`-only selector produced 64 false-FAILs on
Select). A failed/timed-out click is a hard FAILURE for the cell (`open-trigger-click-failed`), never a skip.

### 14.9.4 Mantine-specific allowlist extension (random element IDs)

Mantine's DOM elements carry auto-generated `mantine-XXXXX` IDs that are **non-deterministic across renders** —
`geometry-integrity.mjs`'s pre-existing `GEOMETRY_ALLOWLIST` matched by exact `selector` string, which can never
match a Mantine-ID'd element twice. Extended (backward-compatible — no existing entry used `selector`-less
matching before) to also accept `{ storyId, failReason, reason }` entries with NO `selector`: allow ALL
violations of that `failReason` for that one story (already scoped by the caller). Two entries added, both
verified false positives (real, intentional TailAdmin/design patterns the geometry heuristic can't distinguish
from a defect), not silenced regressions:
- `mantine-primitives-passwordinput--default` / `element-overlap` — the reveal-toggle button is intentionally
  overlaid inside the input box (eye-icon-in-field pattern).
- `mantine-primitives-tabs--default` / `text-clipped` — the tab bar is an intentional horizontal-scroll
  ("swipe on overflow") container; a tab clipped at the visible edge is reachable by scrolling. (A separate,
  pre-existing `ambiguous-offscreen` bucket — §14.4.2 — ALSO fires for this story and is intentionally left
  un-silenced: `verdict='ambiguous'` is non-blocking by design, correctly flagging a genuine UX judgment call —
  is a horizontally-clipped tab without a visible scroll affordance actually fine? — for human triage rather
  than either hard-failing or silently hiding it.)
- `LOADER_ALLOWLIST` also extended: `mantine-primitives-button--default` intentionally demonstrates a
  permanent `loading` Button variant (not a transient loading state).

### 14.9.5 CI wiring (`.github/workflows/governance-pr.yml` — `locale-leak` job)

Added as a step in the existing Playwright-enabled job (reuses its `build-storybook` + `playwright install
chromium` — no new job, no duplicate build):

```
1. npm run build-storybook
2. npm run screenshots:assert -- --mantine-only   ← Task 529 gate, blocking
3. npm run check:locale-leak
```

**Deliberately scoped to `--mantine-only`, not the full `screenshots:assert`/`:fast`.** Running the full gate
(Phase 0 + pre-existing Phase 1 `ASSERT_STORIES`) on this tree surfaces **149 pre-existing Phase-1 failures**
across unrelated, non-Mantine admin stories (`AdminSidebar/MobileDrawerOpen`, `AdminSupportManager/Default`,
`NotificationCenter/*`, `AdminReportsManager/*`, plus 6 `Planted/*` stories that are DESIGNED to fail as
standing detector fixtures — §14.4.2) that predate Task 529 and are out of its scope to fix. Wiring the full
gate in as CI-blocking would make every PR red for reasons unrelated to Mantine primitives, likely getting the
step ignored/disabled rather than serving its purpose. **This 149-failure backlog is flagged here as a known
gap, not fixed** — a candidate for a dedicated follow-up task, tracked in the Task 529 session log
(`docs/sessions/2026-07-02-task529-*.md`).

### 14.9.6 Anti-no-op proof (2026-07-02, both reverted clean)

Per §14.4's proof rule ("a negative-flow transcript proving each gate FAILS on a planted violation, then
reverts"), two independently-mechanismed breaks were planted and confirmed to FAIL the gate (exit code 1, one
failing cell caught per locale/viewport), then cleanly reverted (confirmed via `git diff` showing zero delta):
1. **`sb-show-errordisplay` path** — a genuine `throw` in `Textarea.stories.tsx`'s render function → all 16
   Textarea cells FAILED with `[sb-show-errordisplay]`.
2. **`blank-screenshot` path** (bitmap sanity check, §14.4.1 point 4) — `Badge.stories.tsx`'s render returning
   an empty fragment → all 16 Badge cells FAILED with `[blank-screenshot]: dom-passed but zero-variance
   single-colour`.

Both discovery-failure branches (§14.9.1) were also proven: index.json temporarily renamed away → loud abort,
exit 1; `MANTINE_PRIMITIVES_TITLE_PREFIX` temporarily corrupted → the zero-match error fired, exit 1. Both
reverted clean.

**A literal re-plant of the ORIGINAL Task 527 defect (`theme.components.Textarea.styles.input.minHeight`) does
NOT fail the gate — verified empirically, not assumed.** Root cause: `react-textarea-autosize`'s
`'minHeight' in props.style` throw guard exists ONLY in its `development` build variant (confirmed absent from
`react-textarea-autosize.browser.esm.js`, the production variant — `grep` for the exact guard string returns 0
matches in the built `storybook-static` bundle). `storybook build` produces a production Vite build, which
bundles the production variant; the guard is dead-code-eliminated. `screenshots:assert` — by construction, since
Task 380 — only ever operates against a built `storybook-static/`, so it structurally cannot reproduce this
exact dev-only-guard crash regardless of gate quality. This is a pre-existing limitation of testing against a
production build, not something Task 529 introduced or could fix without changing what `check-stories-rendered.mjs`
tests against (a dev server instead of a static build) — a substantial architecture change outside this task's
tooling-extension scope. The genuine `throw`-based plant (proof 1 above) demonstrates the gate correctly catches
render crashes that DO survive into production builds, which is the realistic threat model this gate protects
against.

### 14.9.7 Known limitations of this gate (owner-required record, orchestrator review 2026-07-02)

`screenshots:assert` runs against the **production `storybook-static/` build** (by construction since Task 380).
That has two consequences the owner requires stated explicitly so no future task over-trusts this gate:

- **It does NOT catch dev-only library assertions.** Guards that exist only in a package's `development` build
  variant (e.g. `react-textarea-autosize`'s `'minHeight' in props.style` throw — the exact Task 527 Textarea
  crash) are dead-code-eliminated from the production bundle. **The literal Task 527 Textarea-`minHeight` crash
  therefore cannot be reproduced or proven through this prod-harness** (see §14.9.6).
- **It does NOT catch TailAdmin chrome deviations.** Wrong `border-radius`, a footer gap, an off token/shadow —
  these are style-value mismatches, not crashes and not layout geometry, so they fall outside this gate's
  detection. TailAdmin visual conformance (agent-contract clause 16) is verified by **rendered side-by-side
  review against `demo_tailadmin_com.zip`**, NOT by this automated gate.

**What this gate DOES enforce, reliably:** real render crashes/throws that survive to production, blank/empty
renders, opened-overlay DOM problems (the click-to-open path), and clipping / overflow / off-viewport /
overlap / non-full-width geometry defects — across every `Mantine/Primitives/*` story × sq/en/uk/it × the
mandated stress viewports. That is the coverage hole (auto-discovered Mantine primitives, CI-blocking) this
gate closes; it is a crash-and-geometry gate, not a style-conformance gate.

**Standing owner decision (2026-07-02) — `Tabs/Default` `ambiguous-offscreen` cells are RESOLVED, do not
re-triage.** `Mantine/Primitives/Tabs/Default` reports `ambiguous-offscreen` at 320/375 (the trailing tab is
clipped at the visible edge) across sq/uk/it. This is BY DESIGN: tab labels can be long and the tab bar is an
intentional horizontal swipe-scroll container ("horizontal / swipe on overflow"), so the clipped tab is
reachable by scrolling. The gate correctly routes these to the non-blocking `ambiguous` bucket (exit 0, never a
FAIL). Future reviews treat these 4 cells as an accepted design state, not a pending owner decision.

### §14.9.8 — `Progress/Default` loader-heuristic false-positive (Task 542, 2026-07-04)

**Why.** Task 539 shipped `Mantine/Primitives/Progress` (`MantineProgress.tsx` + `theme.ts` Progress block).
The native `screenshots:assert -- --mantine-only` run then showed 16/16 `Progress/Default` cells
(sq/en/uk/it × 320/375/390/1024) FAIL `[loader-only]`. **Root cause confirmed (not the primitive):**
`waitForStoryReady`'s readiness detector treats `root.querySelector('[role="progressbar"]') !== null` as
`loaderPresent`, which is correct for a TRANSIENT loading spinner but is permanently true for `Progress` —
Mantine's `ProgressSection` renders `role="progressbar"` unconditionally on every determinate bar, for the
entire life of the story. The story never reaches `loaderPresent: false`, so every cell times out at the
15s readiness deadline and hard-FAILs `[loader-only]`, regardless of whether the bar itself is rendered
correctly.

**Owner manual-QA (2026-07-04):** owner personally rendered `Mantine/Primitives/Progress/Default` across
en/uk/sq/it@320, en/uk@375, uk@480, uk@1280 and confirmed correct §6 chrome — gray-200 pill track, brand
fill, sm/md/lg/xl = 8/12/16/20px, all determinate values (0/20/45/72/80/100/clamped-150/-30) render
correctly, and the long sq/uk/it label wraps in the label row with no clip and no horizontal scroll at 320.

**Fix (gate-tooling only, scoped to this one story, primitive UNCHANGED):** `mantine-primitives-progress--default`
added to `LOADER_ALLOWLIST` in `scripts/check-stories-rendered.mjs` — the same mechanism and precedent as
the pre-existing `mantine-primitives-button--default` entry (§14.9.4/14.9.6), which allowlists a different
permanent (non-transient) visual state on a per-story basis. This does NOT weaken the global loader/spinner
heuristic — `hasProgressbar` still fires `loader-only` for every other, non-allowlisted story; only
`Progress/Default`'s specific, permanent, by-design `role="progressbar"` is exempted. `theme.ts`'s Progress
block, `MantineProgress.tsx`, and `Progress.stories.tsx` are byte-identical before/after this task
(grep-proven in the Task 542 session log).

### §14.9.9 — Bottom-sheet horizontal-overflow blind spot closed (Task 538, 2026-07-04)

**Why.** `checkGeometryIntegrity`'s `offscreen-control` check (Check 2) downgraded ANY element whose bounding
rect escaped the viewport horizontally to `ambiguous-offscreen` — instead of a hard `violation` — whenever
`hasHorizontalScrollAncestor(el)` found *any* ancestor with computed `overflow-x: auto|scroll`. That is correct
for a genuine horizontal-swipe surface (SegmentedControl/Tabs `ScrollArea scrollbars="x"`, Tasks 529–542), but
it silently swallowed real defects inside a `ResponsiveBottomSheet`/Drawer bottom-sheet body.

**Root cause (confirmed against `@mantine/core`'s compiled source, not guessed):** `bottomSheetDrawerStyles.body`
(`responsiveBottomSheet.tsx`) sets only `overflowY: 'auto'` (≤90dvh internal scroll). Per the CSS Overflow spec's
x/y computed-value coupling rule, a browser forces the *other* axis's `visible` to `auto` once one axis is
non-`visible` — so `getComputedStyle(sheetBody).overflowX` reports `auto` too, purely as a side-effect of the
sheet's own legitimate vertical scroll, with no horizontal scrollbar ever rendered. `hasHorizontalScrollAncestor`
walked up from any control inside the sheet, hit this incidental `overflow-x:auto`, and downgraded a true
horizontal clip/offscreen defect to the non-blocking `ambiguous` bucket — invisible to the gate.

**Fix (`scripts/geometry-integrity.mjs`, `hasHorizontalScrollAncestor` + new `isInsideBottomSheetBody` helper):**
1. Anything inside a bottom-sheet body (`el.closest('.mantine-Drawer-body')` — Mantine's default
   `withStaticClasses` prefix, `useStyles({name:"Drawer"})` → static class `mantine-Drawer-body`, confirmed
   rendered on every `ResponsiveBottomSheet`/`MantineDrawer` bottom-sheet Drawer body regardless of
   `withStaticClasses` never being disabled anywhere in this app's `MantineProvider`/Storybook `preview.tsx`)
   never gets the ambiguous downgrade — a horizontal offscreen/clip there is now always a hard `violation`.
2. Outside a bottom sheet, the downgrade now requires the overflow-x ancestor to carry
   `data-scrollbars="x"` or `="xy"` — the exact attribute Mantine's `ScrollAreaViewport` renders only when
   `scrollbars="x"`/`"xy"` is passed (confirmed in `@mantine/core/esm/components/ScrollArea/ScrollArea.mjs`),
   i.e. the real SegmentedControl/Tabs swipe pattern — not merely "some ancestor happens to compute
   `overflow-x:auto`".

**Second, deeper blind spot found while proving AC1 (candidate discovery, not just the downgrade logic).**
The fix above only matters if the overflowing element is a `candidate` at all. It wasn't: every Mantine
overlay (`Drawer`/`Select`/`Combobox`/`DropdownMenu`/`NavigationMenu`/`Popover`/`Modal`) renders its opened
content via a React portal appended OUTSIDE `#storybook-root`, and `checkGeometryIntegrity`'s discovery
(`INTERACTIVE_SELECTOR`) is `#storybook-root`-scoped; `PORTAL_SELECTOR` only matches legacy shadcn `data-slot`
names Mantine never renders. Proven empirically on a real, opened `Mantine/Primitives/Select/Default` mobile
sheet: `document.querySelectorAll('#storybook-root button').length === 0` although 7 real buttons existed.
So bottom-sheet content wasn't downgraded to `ambiguous` — it was **totally invisible** to Checks 1–4, and
AC1's planted-violation proof was impossible without also fixing this.

**Fix 2 — narrow candidate widening:** a new `BOTTOM_SHEET_BODY_SELECTOR` (`.mantine-Drawer-body button,
[role="button"], [role="option"], [role="menuitem"], a[href], input`) is unioned into `candidates` alongside
`INTERACTIVE_SELECTOR`/`PORTAL_SELECTOR`. Deliberately scoped to the bottom-sheet body only — tooltips, desktop
dropdowns, and non-sheet overlay chrome are untouched, per owner direction (narrow window, not a general
Mantine-portal sweep).

**Third finding — a false-positive this widening exposed (Check 4, element-overlap).** Running the full native
gate after the widening surfaced 16 NEW FAILs, all one class, not product defects:
- `Mantine/Primitives/Combobox/Default` (12 cells, sq/en/uk/it × 320/375/390): the story stacks 7 demo
  sections down the page; only the first section's sheet is opened (scripted click), but sections 2–7's own
  search `<input>` elements remain mounted in the page underneath. Rect proof (en@320): the 4th section's input
  sits at `[16,486,304,530]`; the opened sheet's "All cities" option row sits at `[0,464,320,508]` — same
  screen coordinates, because the opened sheet visually covers the rest of the page. Reproduced
  byte-identical across 4 repeat runs (not flaky, not an animation-timing race).
- `Mantine/Primitives/Drawer/Default` (4 cells, desktop-1024): the story's own "Open drawer" trigger is a
  full-bleed `[49,93,975,137]` button; the opened side-Drawer's Cancel/Confirm footer (confirmed
  `el.closest('.mantine-Drawer-body')` truthy) sits at `[822,116,904,160]` / `[916,116,1008,160]` — inside the
  trigger's own footprint, because the panel is drawn over it.

Both are the same mechanism: DOM-visible background page content sitting behind an opened overlay's opaque
backdrop, now paired for the first time against the overlay's own (newly-discovered) content by the
pre-existing Check 4 pairwise-overlap loop. A human never perceives any collision — the backdrop covers the
background element completely.

**Fix 3 — targeted `ambiguous` exemption, not a silent skip, not a story edit (owner-directed, Option 1 of 2
offered):** a new `isInsideOverlayBody(el)` helper (`el.closest('.mantine-Drawer-body')`, shared with Fix 1's
`hasHorizontalScrollAncestor`) gates a new branch in Check 4: when `isInsideOverlayBody(a) !== isInsideOverlayBody(b)`
(one side of the pair is inside the opened overlay body, the other is not), the pair downgrades to
`ambiguous-overlap` (reason: "background page content behind an opened overlay's backdrop") instead of a hard
`violation` — generalizing the pre-existing same-parent `isAbsoluteOverOwnTrigger` popup-over-trigger exemption
to the portal case. A pair entirely on ONE side of the boundary (both inside the overlay, or both outside) is
unaffected and still hard-FAILs as a real collision. The Combobox/Drawer stories themselves are untouched —
the section-stacking/full-bleed-trigger is a story-authoring artifact, correctly absorbed at the gate layer.

**Verification (native `screenshots:assert -- --mantine-only`, full runs):**
- Pre-widening (Fix 1 only): 398/400 PASS, 0 FAIL, 2 AMBIGUOUS (pre-existing Tabs swipe, unrelated) — no
  regression from Fix 1 alone.
- Post-widening (Fix 1+2, before Fix 3): 382/400 PASS, **16 FAIL** (`element-overlap`, the false-positive class
  above) + 2 AMBIGUOUS (Tabs, unchanged) — confirms AC1 was previously unprovable, surfaces the new blind spot.
- Post-exemption (Fix 1+2+3, final): 382/400 PASS, **0 FAIL**, 18 AMBIGUOUS (16 newly-classified
  `ambiguous-overlap` + the same 2 pre-existing Tabs `ambiguous-offscreen`) — back to a clean gate, all 3 fixes
  co-resident.
- Planted-violation proof (throwaway script, disposable, never committed): an element pushed to
  `rect.right=410` (viewportWidth 320) inside a real, opened `Mantine/Primitives/Select/Default` bottom sheet
  (`.mantine-Drawer-body` confirmed present) → hard `offscreen-control` violation, NOT ambiguous. Re-verified
  unchanged after Fix 3.

**Scope:** gate-tooling only. No product/consumer/story/theme change (grep-proven — diff touches
`scripts/geometry-integrity.mjs` + this doc + the session log only). `bottomsheet-overflow` (Check 5, the
pre-existing `[data-slot="dialog-content"/"sheet-content"]` legacy-Sheet check) and all other buckets are
untouched.

---

### §14.9.10 — `Skeleton/Default` does NOT need a `LOADER_ALLOWLIST` entry (Task 544, 2026-07-04)

**Why this record exists.** The Task 544 kickoff assumed a Mantine `Skeleton` story would trip
`waitForStoryReady`'s loader heuristic "exactly like Progress" (Task 542, §14.9.8) and required adding
`mantine-primitives-skeleton--default` to `LOADER_ALLOWLIST`. Verified empirically instead of assumed —
**not needed.**

**Verification:** on the real, built `Mantine/Primitives/Skeleton/Default` story, none of the 6
`loaderPresent` signals in `waitForStoryReady` (`scripts/check-stories-rendered.mjs`) fire:
```
hasSpinner: false, hasSkeletonSlot: false, hasProgressbar: false,
hasAriaBusy: false, hasDataLoading: false — 9 real .mantine-Skeleton-root elements present
```
Root cause (confirmed against `@mantine/core`'s compiled `Skeleton.mjs`, not assumed): Mantine's `<Skeleton>`
renders as a plain `Box` with `mod={[{visible, animate}]}` (→ `data-visible`/`data-animate` boolean
attributes) and no `data-slot`, `role`, or `aria-busy` attribute at all — none of the loader signals
(`.animate-spin`, `[data-slot="skeleton"]`, `[role="progressbar"]`, `[aria-busy="true"]`,
`[data-loading="true"]`, exact-match loading text) can ever match it. This is unlike Progress, whose
`role="progressbar"` is unconditional and permanent (the actual reason Progress needed the exemption).

**Result:** the native gate confirms it — `Mantine/Primitives/Skeleton/Default` × 4 locales × 4 viewports
(16 cells) all PASS cleanly with zero `LOADER_ALLOWLIST` entry, in the same full run that also proves AC5's
planted-violation transcript (see the Task 544 session log). `LOADER_ALLOWLIST` is UNCHANGED by this task —
adding an unneeded entry would violate the "narrow, only-when-actually-needed" discipline this allowlist
exists to enforce (§14.9.4/§14.9.6/§14.9.8 precedent).

### §14.9.11 — `Skeleton/Default` dev-annotation labels: ACCEPTED clause-13(a) exemption (owner decision, 2026-07-04)

**What.** `src/stories/mantine/primitives/Skeleton.stories.tsx` renders its six `<Text size="xs" c="gray.5">`
caption labels ("text lines — §6n gray-200 pulse…", "block — a media/card placeholder…", "circle — avatar
placeholder…", "composite — card row…", "visible=false — passthrough…", "real content — not a placeholder")
as **raw English literals**, not via `storyT`. This diverges from the other 25 Mantine primitive stories,
which localise every caption with `storyT` + `context.globals.locale` parity across `sq/en/uk/it`.

**Decision (owner, 2026-07-04, during the Task 544 orchestrator review).** These captions are **developer
scaffolding** — technical annotations carrying `§`-refs, px values, and prop names (`visible=false`) that
describe *what each skeleton demonstrates*, not product copy. The owner **explicitly accepts them as an
un-localised dev-annotation exemption** rather than routing a Task 545 to localise them. This is a conscious,
reviewed decision — NOT the Check-10 blind spot being exploited unknowingly.

**Recorded gate limitation (so this cannot recur silently).** `check-stories.mjs` Check 10 does not flag these
labels because its JSX-text detectors require either `>text<` on one line (form f) or a line starting `[A-Z]`
with no punctuation (form h); every Skeleton caption starts lowercase and carries punctuation/`§`, so all six
fall outside Check 10's current reach. This exemption is therefore **scoped exactly to these dev-annotation
captions in this one story**. Any NEW user-facing string in a story — and any product-copy string anywhere —
still MUST use `storyT` with full four-locale parity (clause 13(a) is otherwise unchanged). If a future task
adds a *product* string to a Mantine story and relies on this blind spot, that is a violation, not an
exemption.

---

### §14.9.12 — `Separator/Default` does NOT need a `LOADER_ALLOWLIST` entry (Task 545, 2026-07-04)

**Why this record exists.** Following the Task 544 §14.9.10 precedent (verify, don't assume), the Task 545
kickoff itself required empirical verification rather than copying the Skeleton finding forward.

**Verification:** on the real, built `Mantine/Primitives/Separator/Default` story, none of the 6
`loaderPresent` signals in `waitForStoryReady` fire:
```
hasSpinner: false, hasSkeletonSlot: false, hasProgressbar: false,
hasAriaBusy: false, hasDataLoading: false
```
Mantine's `<Divider>` renders as a static `Box` with `role="separator"` and `mod={[{orientation,
"with-label"}]}` (→ `data-orientation`/`data-with-label` attributes only) — no `data-slot`, no
`aria-busy`, no spinner class. Even less surface area than Skeleton for a loader signal to accidentally
match.

**Result:** `LOADER_ALLOWLIST` is UNCHANGED by this task. Native gate confirms —
`Mantine/Primitives/Separator/Default` × 4 locales × 4 viewports (16 cells) all PASS cleanly with zero
allowlist entry, in the same run that also proves AC5's planted-violation transcript (see the Task 545
session log).

### §14.9.13 — `Divider` color override reachable via `defaultProps` (Task 545, contrast with §6n Skeleton)

**Why this record exists.** §6n (Skeleton) documented that Mantine hardcodes its pulse color to a
pseudo-element, unreachable via `theme.components` — requiring a scoped `-chrome.css` file. Task 545's
kickoff explicitly asked to verify per-component whether the SAME limitation applies to `Divider`, rather
than assuming a `-chrome.css` file is always needed for "one shade off" color divergences.

**Verified (against `@mantine/core`'s compiled `Divider.mjs` + `styles.css`, not assumed): it does NOT.**
`Divider`'s border color is a normal element style (`border-top`/`border-inline-start` on the component's
own root), and the component's own `varsResolver` already reads the `color` PROP
(`--divider-color: color ? getThemeColor(color, theme) : undefined`). So
`theme.components.Divider.defaultProps = { color: 'gray.2' }` alone resolves the divergence — confirmed via
rendered `getComputedStyle`: `borderTopColor`/`borderInlineStartColor` = `rgb(228, 231, 236)` (`#e4e7ec`,
gray-200) on both orientations. No `divider-chrome.css` file was created. This is the general lesson the
kickoff wanted recorded: whether a color override needs a stylesheet or a plain `defaultProps` entry depends
on whether the underlying CSS reads a component `vars` custom property (yes → `defaultProps`/`vars`) or
hardcodes the value inside a pseudo-element (no → scoped stylesheet). Check the compiled source per
component; do not generalize from one primitive to the next.

### §14.9.14 — `ScrollArea/Default` does NOT need a `LOADER_ALLOWLIST` entry (Task 546, 2026-07-05)

**Why this record exists.** Following the §14.9.10/§14.9.12 precedent (verify, don't assume), the Task 546
kickoff itself required empirical verification rather than copying the Skeleton/Separator findings forward
— a static scroll container is a different DOM shape again (real overlay-scrollbar chrome, not a Box/hr).

**Verification:** on the real, built `Mantine/Primitives/ScrollArea/Default` story (via Playwright against
the served `storybook-static` build, replicating `waitForStoryReady`'s exact signal checks), none of the 6
`loaderPresent` signals fire:
```
hasSpinner: false, hasSkeleton: false, hasProgressbar: false,
hasAriaBusy: false, hasDataLoading: false, hasLoadingText: false (textOnly = Mantine CSS-var dump, no match)
```
Mantine's `<ScrollArea>` renders as a plain `Box` root + viewport + scrollbar/thumb/corner sub-parts with no
`role`, `aria-busy`, or `data-slot`/`data-loading` attribute anywhere in the tree — no loader signal can ever
match it.

**Rendered proof (same Playwright pass, also confirms the §6p mechanism decision):**
```
thumbCount: 2, thumbColor: rgb(228, 231, 236)   (#e4e7ec, gray-200 — matches §6p exactly)
thumbRadius: 6px, scrollbarWidth: 6px            (radius == thickness → clamps to a full pill, zero-override)
trackBg: rgba(0, 0, 0, 0)                        (transparent at rest, zero-override)
--scrollarea-scrollbar-size: calc(0.375rem * 1)  (6px, from theme.ts defaultProps.scrollbarSize=6)
```

**Result:** `LOADER_ALLOWLIST` is UNCHANGED by this task. Native gate confirms —
`Mantine/Primitives/ScrollArea/Default` × 4 locales × 4 viewports (16 cells) all PASS cleanly with zero
allowlist entry, in the same run that also proves AC5's planted-violation transcript (see the Task 546
session log).

### §14.9.15 — Deterministic visual-defect inventory serialization (Task 547, 2026-07-05)

**Why this record exists.** `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md`
is a harness-generated, git-tracked report (emitted by `scripts/check-stories-rendered.mjs`, ~`:1314`–`:1440`).
It showed up as `modified` after **every** `screenshots:assert` run even with zero real defect change, because
the emitter wrote THREE volatile, run-specific fields into the committed `.md`:

1. `**Date:** ${new Date().toISOString()...}` in the header (`:1318`) — today's date, every run.
2. Raw Mantine auto-generated element IDs (`#mantine-<random>`) in the Bucket-1/Bucket-2 selector columns
   (`:1361`/`:1371` at kickoff time) — `useId()` produces a fresh random suffix on every fresh page load
   (documented at `:419`'s `GEOMETRY_ALLOWLIST` comment), so the string churns with zero semantic change.
3. **Found during implementation, not cited in the kickoff:** a literal `- **Run timestamp:** ${timestamp}`
   line in the Notes section (the SAME per-run `timestamp` that names the `.screenshots/rendered-assert/<ts>/`
   output directory) — this would have defeated the determinism fix on its own, since it differs on every
   run by construction. Fixed under the identical rationale as #1 (the manifest, gitignored, already records
   the real timestamp; the committed `.md` doesn't need its own copy).

**Fix.** (1) dropped the date, kept a static provenance line pointing at the manifest. (2) added one
`stableSelector(s)` helper (`String(s ?? '').replace(/#mantine-[a-z0-9]+/gi, '#mantine-<id>')`), applied at
all three selector-interpolation sites in the emission block (the two cited + one more inside the Bucket-1
`reasons` array that the kickoff's "and any other selector interpolation in this block" wording anticipated).
(3) removed the literal timestamp from the Notes section, replaced with a pointer to the manifest.

**Verified — two-pass determinism proof, run natively (not assumed):**
- Run 1 → Run 2 (same build, no source change): the ONLY diff was one pre-existing, unrelated transient
  capture flake (`Alert/Default` sq mobile-375, `blank-canvas`) present in run 1 and cleared in run 2 — zero
  date churn, zero raw-id churn. Not a Task 547 regression (a headless-capture timing flake in the existing
  harness, unconnected to report serialization).
- Run 2 → Run 3 (no flake this time): **byte-identical, empty diff** — the clean two-pass proof.
- **Real (non-synthetic) ID-normalization evidence:** every run's Bucket-2 `ambiguous-overlap` section
  naturally contains multiple `#mantine-<random>` selectors from the `Combobox`/`Drawer` stories (e.g.
  `#mantine-y2swdk7op ↔ #mantine-qdl71c97h`, a different literal id every run since Mantine regenerates them
  per page load) — these normalized to `#mantine-<id>` identically across all 3 runs, which is exactly the
  bug this task fixes, exercised by real production stories rather than a hand-crafted fixture.
- **Not-frozen proof:** planted a temporary 900px-wide `<div>` in `ScrollArea.stories.tsx` (Task 546's own
  planted-violation mechanism) → the inventory correctly gained 12 new Bucket-1 rows (PASS 430→417/418, FAIL
  0→12/13 depending on run) with NO date churn; reverted → **byte-identical** to the pre-plant baseline.
  (Horizontal-overflow failures carry an empty selector by design — `noHorizontalOverflow` is a top-level
  assertion, not a `visualIntegrity.violations` entry — so this specific plant proves row-churn-on-real-defect
  rather than id-normalization; the id-normalization proof above already covers that case with real data.)

**Result:** report stays git-clean between identical runs; still updates correctly on real regressions.
Gate verdict/counting logic untouched — confirmed via identical PASS/FAIL/AMBIGUOUS totals modulo the planted
cells and the one unrelated flake. `docs/critical-flow-registry.md` DOES cite `scripts/check-stories-rendered.mjs`
(P0 "Storybook rendered-proof gate", Task 464/467 row) since it's the harness implementing that registered
flow — but this task only touched the inventory `.md` emission tail (~`:1314`–`:1440`), never the
verdict/counting logic the registry's row actually describes (untouched, per the identical totals above).
No registered flow's *behavior* changed — confirmed, not assumed.

### §14.9.16 — `Slider/Default` does NOT need a `LOADER_ALLOWLIST` entry (Task 548, 2026-07-05)

**Why this record exists.** Following the §14.9.10/§14.9.12/§14.9.14 precedent (verify, don't assume — a
slider's DOM shape is different again from a scroll container, an `<hr>`, or a skeleton block), the Task 548
kickoff required empirical re-verification rather than copying any prior finding forward.

**Verification:** the native `screenshots:assert --mantine-only` gate ran the new
`Mantine/Primitives/Slider/Default` story through the full 16-cell matrix (4 locales × {mobile-320/375/390,
desktop-1024}) with `LOADER_ALLOWLIST` left UNCHANGED, and every cell resolved `verdict: "pass"` with
`loaderOnly: 0` in the run summary — no cell ever stalled on a loader signal requiring an allowlist entry.
Mantine's `<Slider>`/`<RangeSlider>` render as plain `Box` root/track/thumb parts with no `role="status"`,
`aria-busy`, or `data-loading` attribute anywhere in the tree — no `waitForStoryReady` loader signal can ever
match them.

**Rendered proof (Playwright against the built story, `getComputedStyle`, confirms the §6q mechanism
decisions in the same pass):**
```
single   — trackBg: #f2f4f7 (gray-100, §6q) | radius: 9999px (pill, defaultProps override)
           | thumbSize: 12px | thumbBorderColor: rgb(236,84,71) (#EC5447 brand, zero-override)
           | barBg (filled): rgb(236,84,71) (brand, zero-override)
range    — trackBg: #f2f4f7 (gray-100, §6q) | radius: 1000px (RangeSlider zero-override — confirms no
           override needed) | thumbSize: 12px | barBg: rgb(236,84,71) (brand)
disabled — trackContainer opacity: 0.5 (whole-control dim, slider-chrome.css) | thumb display: "flex"
           (restored from Mantine's own display:none default — the thumb dims instead of vanishing) |
           barBg: rgb(102,112,133) (#667085, gray-500 — Mantine's own disabled-color swap, dimmed further
           by the parent opacity, never stacked)
```

**Result:** `LOADER_ALLOWLIST` is UNCHANGED by this task. Native gate confirms —
`Mantine/Primitives/Slider/Default` × 4 locales × 4 viewports (16 cells) all PASS cleanly with zero allowlist
entry, in the same run that also proves AC5's planted-violation transcript (see the Task 548 session log).

---

### §14.9.17 — Per-story extra viewport + per-story assertion mechanism (Task 573, 2026-07-10)

**Why.** Task 572 fixed a real bug — HeroSearch's Search button now wraps to its own row in the 640–767px band
so the Location combobox isn't crushed illegible (~720px). Its ONLY rendered proof for that exact band was a
one-off, non-persisted Playwright script: the standing `MANTINE_VIEWPORTS` sample (320/375/390/1024, §14.9.2)
never lands inside 640–767, so a future edit that silently drops `sm:basis-full` from the Search button would
pass every existing gate and re-introduce the crushed-Location bug undetected. Task 573 closes that hole with
two new, reusable, SURGICAL mechanisms in `scripts/check-stories-rendered.mjs` — surgical meaning they change
behavior for exactly the ONE named component, never the other ~37 Mantine primitive stories.

**Mechanism 1 — `MANTINE_STORY_EXTRA_VIEWPORTS` (per-story extra viewport, not a global width).**
```js
const MANTINE_STORY_EXTRA_VIEWPORTS = {
  HeroSearch: [{ name: 'band-700', width: 700, height: 812 }],
};
```
Keyed by the SAME `componentName` `discoverMantinePrimitiveStories()` already derives from the story title
suffix (`Mantine/Primitives/<componentName>`) — never a hardcoded story id, matching this file's existing
no-hardcode discipline (§14.9.1). `discoverMantinePrimitiveStories()` now carries `componentName` through onto
every discovered story object so the main loop and `captureCell` can read it. For each discovered Mantine
story, the effective viewport list is `[...MANTINE_VIEWPORTS, ...(MANTINE_STORY_EXTRA_VIEWPORTS[componentName]
?? [])]` — a story with no map entry (i.e. every OTHER Mantine primitive) gets `?? []`, so its cell count and
behavior are byte-identical to before this task. `MANTINE_VIEWPORTS` itself is unchanged — adding 700 there
would have injected an unvetted width into all ~37 Mantine primitive stories, risking new AMBIGUOUS/FAIL noise
unrelated to HeroSearch and slowing every run for no benefit to any other component.

**Mechanism 2 — a per-story, per-band DOM assertion, gated the same way.**
A 700px screenshot cell that only re-ran the existing no-h-overflow/full-width checks would NOT have caught the
Task 572 regression class: a crushed single-row layout has no horizontal overflow either — the bug is a row-
structure defect, not an overflow defect. `captureCell` gained a new assertion (f), gated on
`story.componentName === 'HeroSearch' && 640 <= viewport.width < 768`: it reads the 4 search-bar controls
(direct children of the `.flex.flex-wrap` container inside the `.bg-background` card — `HeroSearchView.tsx`'s
`[type, location, filters, Search]` order) via `getBoundingClientRect().top` and asserts the Search button's
top is strictly below the Location field's top (Search wrapped to row 2). Result is recorded as
`cell.assertions.heroSearchWrapInBand` (`true`/`false`/`null` — `null` = not applicable: wrong story, wrong
band, or the 4 controls weren't all found, which defers to the existing style-integrity/transient-retry path
rather than emitting a false hard FAIL on a capture miss). `heroSearchWrapInBand === false` is wired into
`isTransientFailure()` alongside the pre-existing `fullWidthControlsAtMobile`/`fullWidthButtonsAtMobile`/
`popupBottomSheetAtMobile`/`visualIntegrity.pass` guards (the file's existing "never transient" list — this IS
the equivalent of `HARD_FAIL_REASONS` for assertions that live on `cell.assertions` rather than
`renderCheck.failReason`) — a real row-structure regression can never be retried into a false pass — and into
`hardPass` alongside `noOverflow`/`!geometryHardFail`, so a `false` result hard-fails the cell outright.

**Reusable pattern for future primitives.** A future task adding a narrow-band or component-specific rendered
guard should (1) add one entry to `MANTINE_STORY_EXTRA_VIEWPORTS` keyed by the discovered `componentName`, and
(2) add one `story.componentName === '<Name>'`-gated block inside `captureCell`, wiring its boolean result into
`isTransientFailure()`'s explicit guard list and into `hardPass` — exactly the two additions Task 573 made.
Do NOT invent a second per-story-viewport map or a parallel gate/test-runner; extend these two mechanisms.

**Result (native `screenshots:assert -- --mantine-only`):** `HeroSearch` grew from 16/16 to 20/20 PASS (16
pre-existing 320/375/390/1024 cells + 4 new 700px cells, one per locale); every other Mantine primitive story's
cell count is unchanged. Planted-violation proof (temporarily dropping `sm:basis-full` from the Search button
in a local, reverted-before-completion copy of `HeroSearchView.tsx`): the 4 new 700px cells' `heroSearchWrapInBand`
assertion genuinely FAILed (Search top == Location top, single row), reported as a hard, non-transient FAIL,
non-zero FAIL count in the run; reverted → back to 20/20 PASS. See the Task 573 session log for the full
before/planted-FAIL/after transcripts and `docs/critical-flow-registry.md` row 49 for the persisted-gate note
that replaces the retired Task-572 one-off script as this band's authoritative proof.

### §14.9.18 — `Patterns/Mantine/*` coverage extension + tracked known-failure registry (Task 607, 2026-07-15)

**Why.** The gate's auto-discovery (§14.9.1) matched only the title prefix `Mantine/Primitives/*` — the 13
`Patterns/Mantine/*` composite-pattern stories (`AdminSurfacePattern`, `AppShellFoundation`, `AuthFormPattern`,
`CardGrid`, `DialogDrawerPattern`, `EmptyLoadingErrorState`, `FormSectionStack`, `ListingCardPattern`,
`ListingDetailPattern`, `NotificationPattern`, `PageHeaderWithActions`, `ResponsiveActionFooter`,
`TwoColumnForm`) fell into the weaker geometry-only phase (§14.4.2 — no render/anchor/style assertions,
no `--mantine-only` coverage at all). Consequence found at the Task 605/606 reviews:
`Patterns/Mantine/ListingCardPattern` had zero machine rendered coverage, forcing a throwaway ad-hoc QA script
and hand-verified pixels for both tasks — the exact class of hole Task 529 closed for primitives, just for a
different story-title prefix.

**Fix — prefix LIST, not a second discovery mechanism.** `MANTINE_PRIMITIVES_TITLE_PREFIX` (a single string)
became `MANTINE_STORY_TITLE_PREFIXES = ['Mantine/Primitives/', 'Patterns/Mantine/']`; `discoverMantinePrimitiveStories`
now matches a story if its title starts with ANY listed prefix and derives `componentName` by stripping
whichever prefix matched. Purely prefix-derived — no hardcoded story-id allowlist — so a future
`Patterns/Mantine/*` story is covered automatically, preserving the Task 529 no-drift discipline. The existing
`geometryOnlyStories` exclusion (§14.9.1, keyed off `mantineIds`) required no code change — the 13 patterns
moved out of the geometry-only phase automatically once discovered. **Result:** 43 `Mantine/Primitives/*` +
13 `Patterns/Mantine/*` = 56 stories, 900 cells total (320/375/390/1024 × 4 locales); the 43 primitives'
discovery/viewports/overlay-triggers/pass-fail are byte-unchanged (before/after count diff confirmed in the
Task 607 session log).

**Open-trigger triage (owner `AskUserQuestion`, Task 607 review, 2026-07-15).** 11 of the 13 patterns render
their full content inline and immediately (confirmed via source read, no `play` function in any of the 13
story files). Two do not:
- **`DialogDrawerPattern`** — a REAL controlled overlay (`useDisclosure(false)` + a closed-trigger
  `<Button onClick={open}>`), byte-for-behavior the same lifecycle as `Modal`/`Drawer`/`Popover` already in
  `MANTINE_OVERLAY_PRIMITIVES`. **Added to the set** — reuses the proven click-then-assert path with zero new
  heuristic (the one authorized `MANTINE_OVERLAY_PRIMITIVES` edit this task's kickoff scope permitted).
- **`NotificationPattern`** — its trigger buttons call the imperative `notifications.show()` API (an
  auto-dismissing toast portal), NOT a controlled overlay bound to the trigger's open state. Treating it as
  identical to the controlled-overlay set would be exactly the silent trigger-heuristic invention this file's
  §9/§14 discipline forbids, and an auto-dismissing portal is a flaky-assert risk (the toast can vanish
  before/after the assert fires). **Deliberately NOT added** — it still gets discovered and asserted on its
  on-load render (trigger buttons + any static content), which genuinely PASSed 16/16 in the Task 607 run.
  Full open-trigger coverage for the imperative toast is deferred to a dedicated follow-up (candidate Task 608).

**New FAILs surfaced by the extended coverage — one confirmed real defect, two held for owner
pixel-review.** The extended coverage surfaced 3 stories with zero prior machine coverage failing every
cell:
- `ListingDetailPattern` — horizontal overflow at ALL 16 cells, including desktop-1024. **Confirmed real**
  (owner review, Task 607, 2026-07-15): a genuine Mantine `Grid` negative-margin gutter bleed (~10px per
  side at 320px, invisible in a static screenshot but a literal `scrollWidth > clientWidth` violation — the
  exact class of defect the gate exists to catch that the eye misses). Tracked in
  `MANTINE_PATTERN_KNOWN_FAILURES` with follow-up **Task 609**.
- `AdminSurfacePattern` — a search-input/button `element-overlap` at all 16 cells. Source review
  (`MantineAdminSurfacePattern.tsx` lines 86–99) shows this is a Mantine `TextInput` `rightSection`
  `ActionIcon` (the standard search-icon-in-input pattern) — the geometry checker's `element-overlap` rule
  cannot distinguish a control legitimately nested in its parent's own reserved slot from two siblings truly
  colliding, so this LOOKS like a heuristic false positive. **NOT added to the registry, NOT allowlisted** —
  per standing orchestrator policy (§18.9: a chrome/overlap verdict requires the owner having personally
  viewed the rendered pixels, since a rightSection icon genuinely overlapping real text is exactly what
  Tasks 553/554 caught before), this stays a genuine CI-blocking `fail` until the owner confirms from the
  persisted screenshots + source lines in the Task 607 session log. If confirmed a false positive, the
  correct fix is likely to the `element-overlap` heuristic itself (exempt a control fully contained within
  its own parent's padding/reserved-section box), not a per-story allowlist that would blind the check to a
  real overlap on some OTHER story later.
- `AppShellFoundation` — nav links pushed off-screen at the 3 mobile viewports only (desktop passes).
  Source review (`MantineAppShellFoundation.tsx`) shows this is Mantine's own `AppShell` navbar,
  `collapsed: { mobile: !opened }` with `useDisclosure()` defaulting closed and a REAL `<Burger opened=
  {opened} onClick={toggle} hiddenFrom="sm">` trigger — mechanically identical to `DialogDrawerPattern`
  (closed-by-default, real clickable trigger, `useDisclosure`). This is an **open-trigger case, not a
  false positive** — the existing `MANTINE_OVERLAY_PRIMITIVES` click-then-assert mechanism would very
  likely resolve it with zero new heuristic (same authorized mechanism already used for
  `DialogDrawerPattern` in this same task). **NOT added to the registry, NOT wired to
  `MANTINE_OVERLAY_PRIMITIVES` yet** — held for owner confirmation per the same §18.9 pixel-review
  requirement before any diff change lands.

`--mantine-only` is a hard-blocking CI gate (`.github/workflows/governance-pr.yml`); neither of the two held
stories is allowlisted, so both remain genuinely CI-blocking pending owner review — the safe default when a
defect classification is unconfirmed. None of the 3 patterns/components were edited in Task 607 (out of
scope by the kickoff's own hard contract).

**Tracked known-failure registry mechanism (`MANTINE_PATTERN_KNOWN_FAILURES`) — for CONFIRMED real defects
only, not an allowlist for unconfirmed ones.** Each entry pins the EXACT failure signature (failing-cell
count + single primary fail reason) captured when the defect was confirmed and filed as its own dedicated
follow-up task. A matching cell still fails, still prints loudly (its own "TRACKED KNOWN FAILURES" report
section + a dedicated "Bucket 1b" in the persisted governance inventory), and still carries
`verdict: 'known-failure'` in the manifest (never `'pass'`) — it is excluded from the CI-blocking `failed`
count ONLY while the signature matches exactly. ANY divergence (fewer failures = looks fixed, more failures,
or a different fail reason) is NOT covered by the entry, reverts to a normal hard CI-blocking failure, and
prints a loud "TRACKED KNOWN-FAILURE SIGNATURE CHANGED" warning — so the mechanism can never silently mask a
NEW or WORSE regression. Currently holds only `ListingDetailPattern` (Task 609); `AdminSurfacePattern` and
`AppShellFoundation` are deliberately absent pending the owner review above.

**Also found: a real `layout='grid'` vs `layout='list'` title-hover divergence in `MantineListingCardPattern`**
(Task 606 port artifact, found during the Task 607 evidence review, out of this task's own scope — the
rendered gate is static-screenshot geometry and structurally cannot assert a `:hover` state, so this kind of
divergence is a blind spot by construction). `layout='grid'`'s title is a plain Mantine `Text` with no
`group`/`group-hover` wiring — it never changes color on hover. `layout='list'`'s title is a plain `<h3
className="... group-hover:text-primary ...">` with `group` on the Card root (ported from the legacy
horizontal branch) — it DOES change color on hover. Confirmed by direct source read
(`MantineListingCardPattern.tsx` — grid title ~line 263 vs list title ~line 158/`group` ~line 130); not
something Task 607 fixes. Candidate follow-up **Task 610**: unify grid/list title-hover behavior + add a
targeted hover assertion so it cannot silently drift again.

**Anti-no-op proof.** A planted violation (temporarily widened `ListingCardPattern`'s image frame past 320px
via an injected inline `min-width`) made `--mantine-only` genuinely FAIL that story's 16 cells (cascading
`horizontal overflow` + `offscreen-control` violations); reverted → confirmed byte-identical to the prior
committed state via `git diff` (empty), then re-verified green on a fresh run (excluding the 1 confirmed
known-tracked failure and the 2 held-for-review stories, none of which are affected by this story). See the
Task 607 session log for the full transcript.

### §14.9.19 — `AdminSurfacePattern` + `AppShellFoundation` held-story resolution (Task 611, 2026-07-15)

**Owner adjudication.** After personally viewing the Task 607 rendered pixels (§18.9), the owner confirmed both
held stories were gate-heuristic issues, NOT real defects, and directed the fix land in the GATE (never a
per-story allowlist/exemption — reserved for confirmed real defects, e.g. `MANTINE_PATTERN_KNOWN_FAILURES`).

**`AdminSurfacePattern` (`element-overlap`, 16 cells) — generic bbox-containment guard.** The checker's
`element-overlap` rule (`geometry-integrity.mjs` Check 4) already exempted true DOM ancestor/descendant pairs
(`isAncestorOf`), but `MantineAdminSurfacePattern.tsx`'s search `ActionIcon` is rendered via `TextInput`'s
`rightSection` — a DOM **sibling** of the `<input>`, not a descendant — even though the `<input>`'s own
`getBoundingClientRect()` visually reserves the icon's space (Mantine's standard icon-in-field mechanism, same
class as the existing `PasswordInput`/`RangeDatePicker` `GEOMETRY_ALLOWLIST` entries in
`scripts/check-stories-rendered.mjs` — this generic fix makes those two per-story entries a candidate for
removal in a future task, since the containment guard now covers the same case generically; not removed here,
out of this task's scope). Added `isContained(inner, outer)` — pure bbox containment, either direction — as a new
algorithmic exclusion alongside `isAncestorOf`, scoped to Check 4 only. **Generic, no story-id/selector
hardcode**, so it protects any other `rightSection`/`leftSection`/adornment pattern automatically. Verified via
a direct call to the exported `checkGeometryIntegrity()` (the same function `captureCell` calls for every
cell): `AdminSurfacePattern` now passes at 320/1024 with 0 `element-overlap` violations, AND the permanent
`planted-visualviolations--overlapping-actions` fixture (a genuine **partial** overlap — neither box contains
the other) still fails with 1 violation at 320/375/390 — proving the guard is scoped to true containment only,
never widened to any overlap. Transcript:
`docs/sessions/2026-07-15-task611-assets/transcript-2-ac3-anti-regression-proof.log`.

**`AppShellFoundation` (`offscreen-control`, 12 cells) — open-trigger + trigger-visibility skip.** Added
`'AppShellFoundation'` to `MANTINE_OVERLAY_PRIMITIVES` (mechanically identical to `DialogDrawerPattern`:
`useDisclosure()` defaults closed, navbar is `collapsed:{mobile:!opened}`). Empirical testing surfaced a real
gap the kickoff had already flagged as a STOP-AND-ASK trigger: the Burger is `hiddenFrom="sm"` (CSS
`display:none` at >=640px), so the existing click-then-assert mechanism timed out at `desktop-1024` — 4 cells
that already PASS there (navbar is open-by-default at desktop, nothing to open) would have newly broken. Per
owner direction (`AskUserQuestion`, Task 611 session), `captureCell`'s `openTrigger` handling now checks
`trigger.isVisible()` before clicking: a **visible** trigger is clicked exactly as before (a failed click on a
visible trigger is still a hard `open-trigger-click-failed` fail — nothing here weakens that); an **invisible**
trigger is skipped (no click, no failure) and every normal render/anchor/style/geometry assertion still runs
against the CURRENT DOM — so a genuinely broken/empty render still fails. This is a no-op for every existing
overlay primitive (`Modal`/`Drawer`/`Popover`/`Select`/`DropdownMenu`/`NavigationMenu`/`Tooltip`/`Combobox`/
`NotificationBellView`/`DialogDrawerPattern`) — their triggers are plain always-rendered `<Button>`s, visible at
every viewport, confirmed via a direct visibility probe. Verified: mobile-320/375/390 → Burger visible → real
click → nav opens (links move from `left=-308` to `left=12`) → 12 cells now PASS via genuine opening, not a
skip; desktop-1024 → Burger hidden → click skipped → checks run on the already-open navbar → 4 cells PASS
without `open-trigger-click-failed`.

**Result.** `--mantine-only`: 857/900 PASS, 0 FAIL, 27 AMBIGUOUS (pre-existing, unchanged — Combobox/
RangeDatePicker portal-backdrop + Tabs swipe-scroll, unrelated to this task), 16 KNOWN-FAILURE (tracked,
`ListingDetailPattern`, Task 609, unchanged) — **exit 0**. Exact before/after diff vs the Task 607 baseline
(829/900 PASS, 28 FAIL, 27 AMBIGUOUS, 16 KNOWN-FAILURE): the 28 target cells (12 AppShellFoundation +
16 AdminSurfacePattern) flipped FAIL→PASS; every other cell byte-identical. Full transcript + manifest excerpt
+ 32 persisted screenshots (both stories × 4 viewports × 4 locales):
`docs/sessions/2026-07-15-task611-assets/`.

---

### §14.9.20 — `ListingDetailPattern` Grid-gutter horizontal-overflow — RESOLVED (Task 609, 2026-07-16)

**Root cause, confirmed.** `MantineListingDetailPattern.tsx`'s root `<Grid gutter="lg">` implements its gutter as
a negative horizontal margin on `.mantine-Grid-inner` (bled back in by matching padding on each `Grid.Col`) —
harmless when a real ancestor clips it, but this pattern renders standalone in its own story with nothing to hide
the bleed, so `document.documentElement.scrollWidth` measured ~10px wider than `clientWidth` at every viewport,
tripping Check-4a (`noHorizontalOverflow`) on all 16 cells (320/375/390/1024 × sq/en/uk/it).

**First attempt (containment) tried and REJECTED — new false positive, not shipped.** The kickoff's primary
recommendation — wrap the root `<Grid>` in a `<Box style={{ overflowX: 'clip' }}>` — does neutralize the
document-level overflow, but introduces a NEW false positive: `geometry-integrity.mjs`'s Check-1 (`text-clipped`)
walks up from every interactive element looking for the first ancestor with a clipped `overflow`/`overflowX`
computed style, and if THAT ancestor's own `scrollWidth > clientWidth`, flags every descendant's text as
clipped — with no check on whether the specific element's own rendered box actually falls in the clipped
region. An `overflow:clip` Box around the whole Grid IS exactly that ancestor (its own box is, by construction,
wider than its clientWidth — that's the overflow being contained), so the Call/WhatsApp buttons inside the
sticky contact `Paper` two levels down were newly flagged `text-clipped` at all 16 cells even though nothing is
visually clipped (full-width buttons, complete labels, confirmed via rendered screenshots). Reverted before
landing.

**Shipped fix — neutralize the gutter, not contain it (the kickoff's pre-approved alternative).**
`gutter="lg"` → `gutter={0}` (removes the negative margin entirely — the Grid-inner box can never measure wider
than its own container again), with the same visual gap reproduced explicitly on the left `Grid.Col`:
`pr={{ base: 0, sm: 'lg' }}` (the `sm+` side-by-side inter-column gap) and `mb={{ base: 'lg', sm: 0 }}` (the
`<sm` stacked inter-row gap). Outer edges are unaffected either way (gutter only ever affected the INNER gap
between columns, never the outer edges against the container), so the visible layout is byte-identical — same
column split, same gap, same sticky contact panel, same CTA behavior — with zero negative-margin bleed anywhere
in the DOM, so neither Check-4a nor Check-1 has anything to trip on.

**Verification.** A scoped Playwright probe (reusing the real exported `checkGeometryIntegrity()`) against all
16 cells confirmed `scrollWidth === clientWidth` exactly (not just within tolerance) and 0 `text-clipped`
violations; the sticky `Paper` (`position:sticky; top:80`) was confirmed via computed style plus a real scroll
(`window.scrollBy`), its `top` offset intact and unmoved by the fix. Anti-regression: the original `gutter="lg"`
was planted back (no `pr`/`mb`) and confirmed to genuinely fail all 16 cells with the exact predicted bleed
(scrollWidth 330/385/400/1034 vs clientWidth 320/375/390/1024 — the ~10px half-gutter, matching the diagnosis
precisely), then reverted to the shipped fix, re-confirmed green. `MANTINE_PATTERN_KNOWN_FAILURES` in
`scripts/check-stories-rendered.mjs` is now `{}` (the `ListingDetailPattern` entry removed — the defect no
longer exists, so the tracked-xfail pin would be dead governance state).

**Result.** `--mantine-only`: 889/916 PASS, 0 FAIL, 27 AMBIGUOUS (pre-existing, unchanged), 0 KNOWN-FAILURE —
**exit 0**. (Total cell count grew 900→916 between the Task 611 baseline and this run from the unrelated Task
612 `LightboxView` registration, all 16 of which pass; the +16 delta from 857→873 attributable to Task 609
itself is unaffected and independently confirmed via the scoped probe above.) Session:
`docs/sessions/2026-07-16-task609-listingdetailpattern-grid-gutter-overflow-fix.md`.

### §14.9.21 — Mantine-only becomes the sole mandatory CI scope; shared criterion module (Task Q0R, 2026-07-18)

**Owner directive.** The only mandatory CI scope is canonical Mantine stories. Legacy stories are deprecated code
awaiting migration/replacement — they no longer run `check:locale-leak` or `screenshots:assert` and can never
block a PR. This is a scope change (what blocks CI), never a deletion — `ASSERT_STORIES`/geometry-only membership
and the full (non-`--mantine-only`) run remain available for local/owner-native full sweeps.

**Shared criterion module.** `MANTINE_STORY_TITLE_PREFIXES`/`isCanonicalMantineTitle()` moved out of
`check-stories-rendered.mjs` into `scripts/lib/mantine-story-scope.mjs` — the ONE place all three gates
(`check-stories-rendered.mjs`, `check-locale-leak.mjs`, `check-story-coverage.mjs`) import it from. No file
re-types the prefix list.

**`check-locale-leak.mjs` gained `--mantine-only`** (previously scanned every story, legacy included — Q0R's
Current-state audit found this the one gap versus the rendered gate, which already had the flag from Task 529).
Wired into `governance-pr.yml`'s `locale-leak` job via the new `check:locale-leak:mantine-only` npm script.
Empty-canonical-set is a hard, non-zero-exit error in both scripts under `--mantine-only` (never a silent skip
to green).

**Truthful composition banner (Q3/Q4).** Both scripts print exactly `Mantine selected: N; non-Mantine excluded: M`
before running under `--mantine-only`, and the rendered script's banner no longer claims
full-mode/`ASSERT_STORIES`/geometry-only scope when that flag is set (Phase 1/2 are skipped entirely under
`--mantine-only` — the banner previously still announced their counts, the same "gate claims scope it does not
enforce" defect class as the Task 529 hole this section's siblings closed).

**`check:story-coverage` rewritten** — see §15.1. It is no longer the "colocated story or exemption" gate; it now
enforces `scripts/mantine-migration-scope.json` (the hand-maintained Mantine-migration enrolment list) via
AST-parsed static-import proof, applying the same `isCanonicalMantineTitle` criterion to parsed story source
(no built index — this gate runs pre-build).

Session: `docs/sessions/2026-07-18-taskQ0R-mantine-only-ci-scope.md`.

### §14.9.22 — Locale-leak CI job is warn-only during migration; manifest completed to 6 (Task 625, 2026-07-19)

**Owner directive.** While legacy→Mantine story migration is active, newly migrated stories keep surfacing
loanword/fixture leaks; the owner does not want that churn to block merges. `governance-pr.yml`'s `locale-leak`
job step now carries `continue-on-error: true` — the detector still runs, still reports, and still exits non-zero
on a real leak (report artifact upload via `if: always()` is unchanged), but a non-zero exit no longer fails the
overall PR check. This is CI-wiring only: the script's own exit code, `check:locale-leak:mantine-only`'s
definition, `LEAK_ALLOWLIST`/`PER_STORY_TOKENS`, and the detector algorithm are all untouched. Revert to blocking
once migration completes (owner directive; log as a follow-up when that milestone is reached).

**`rendered-proof` and `check:story-coverage` stay blocking, unchanged.** The warn-only policy applies to the
`locale-leak` job only — coverage failures are author-controlled (a component is only enrolled in
`scripts/mantine-migration-scope.json` when its migration lands), not churn-driven, and rendered-proof's
ambiguous cells are already non-failing.

**Manifest completed to 6/6.** `src/components/layout/FooterView.tsx` landed in commit `7bc4550b9` (after Q0R was
written) with a canonical story (`src/stories/mantine/primitives/FooterView.stories.tsx`, title
`Mantine/Primitives/FooterView`) that statically imports it. Added as the 6th `scripts/mantine-migration-scope.json`
entry, resolving Q0R's `FooterView` gap. `check:story-coverage` now reports 6/6 covered, exit 0.

Session: `docs/sessions/2026-07-19-task625-q0r-624-warnonly-landing.md`.

---

### §14.9.23 — Assertion-liveness meta-gate: a `null`-everywhere assertion is a dead gate, not a pass (Task 710, 2026-08-05)

**Why.** Every consumer of a `cell.assertions.<key>` boolean only ever tests `=== false`
(`isTransientFailure()`, `hardPass`, §14.9.17) — never "is this a real boolean". A key that is
`null`/absent in EVERY cell of its scope therefore contributes `true` to `hardPass` while never
having checked anything: it LOOKS like a passing gate and is actually a vacuous one. This is
exactly how Task 573's `fullWidthButtonsAtMobile`/`popupBottomSheetAtMobile` assertions died
unnoticed for ~5 weeks (docs/critical-flow-registry.md row 50) — nothing detected the death until
the 709/709-R review measured the CI-blocking `--mantine-only` manifest by direct enumeration and
found both `null` in **all 1184 cells**.

**Root cause (measured, not guessed).** `fullWidthButtonsAtMobile`'s candidate selector
(`[data-slot="button"]:not([data-icon-only])`, `check-stories-rendered.mjs:1161`) and
`popupBottomSheetAtMobile`'s six candidate selectors (`:1185-1192`) are all `data-slot` names — a
**shadcn** convention emitted only by `src/components/ui/*` (27 files). Mantine-scope stories
render `m_*`/`mantine-*-root` classes and no `data-slot` at all, so `checkedAny` never becomes
`true` and both assertions write `null` unconditionally. **Same root cause §14.9.9 already
recorded for a different check** — geometry's `PORTAL_SELECTOR` "only matches legacy shadcn
`data-slot` names Mantine never renders" — never generalised into a standing detector until now.

**The gate.** `scripts/check-assertion-liveness.mjs` (`npm run check:assertion-liveness`) reads an
already-persisted `manifest.json` — it never launches a browser — and classifies every **boolean**
assertion key it finds, SHAPE-driven (a key is a candidate iff every value it ever takes is `true`,
`false`, or `null`; an object-valued key like `renderCheck`/`styleIntegrity`/`visualIntegrity` is
skipped automatically, never by a hardcoded name list). `null` and "key absent from this cell" are
treated identically. Four states:

| State | Meaning | Exit contribution |
|---|---|---|
| `LIVE` | resolved `true`/`false` in ≥1 cell | none |
| `DEAD-NEW` | `null`/absent in EVERY cell, no registry entry for this `{scope, assertion}` | **blocking (1)** |
| `DEAD-KNOWN` | `null`/absent in EVERY cell, AND a registry entry tracks it | reported loudly, non-blocking |
| `STALE-ENTRY` | a registry entry names it, but it resolved `true`/`false` in ≥1 cell again | **blocking (1)** |

Bad input (manifest missing, unparseable, no `matrix` array, or zero cells) exits **2**, distinctly
per case — never a silent green.

**Registry contract (`scripts/assertion-liveness-registry.json`).** One entry per
`{ scope, assertion }`. Every entry is a **TRACKED DEAD GATE, not an exemption**: it MUST carry a
`followUpTask`, `deadSince`, and `reason`. `DEAD-KNOWN` is reported in the same voice
`check-stories-rendered.mjs:1854`'s known-failure registry uses ("TRACKED … NOT fixed here").
Mirrors `check:design-tokens`'s stale-marker precedent: if the registered assertion comes back to
life, that is `STALE-ENTRY` — a hard failure naming the exact entry to delete — so the registry can
never rot into a silent allowlist for the next 573-class death. Current entries (both scope
`mantine-only`, `followUpTask: 711`): `fullWidthButtonsAtMobile`, `popupBottomSheetAtMobile`.

**Scope is part of the registry key (A3) — full-matrix liveness is UNMEASURED.** §3.1's
measurements, and both registry entries, are `--mantine-only` only. The two dead assertions may
well be live in the full (non-Mantine) matrix, where shadcn stories DO render `data-slot` — that
sweep was not run (out of this task's budget) and no claim is made about it.

**CI wiring.** `governance-pr.yml`'s `rendered-proof` job runs `npm run check:assertion-liveness`
immediately after `npm run screenshots:assert -- --mantine-only`, with no explicit `--manifest`
flag — the gate's default manifest discovery picks the latest directory under
`.screenshots/rendered-assert/` (lexicographic sort == chronological sort for the
`YYYY-MM-DDTHH-MM` directory names), which on a fresh CI checkout is exactly the run the previous
step just produced.

**Self-test (`npm run check:assertion-liveness:verify`, house `--verify-gate` pattern,
`check-homepage-grid.mjs:655-760`).** A negative arm (the real, latest manifest — expect exit 0)
plus three planted failing arms, each asserted on both its exit code AND its specific diagnostic
text (never merely "it failed"): an unregistered all-null key (`DEAD-NEW`, exit 1), a registered
key that resolved `true` in a cell (`STALE-ENTRY`, exit 1), and a nonexistent manifest path
(exit 2, distinct `[missing-file]` message). All four of the R8 degenerate-input cases (missing
file, unparseable JSON, no `matrix` array, zero-cell `matrix`) were additionally run directly
against dedicated fixtures and each produces its own distinct message, all exit 2.

**Structural regression coverage (R9).** `scripts/__tests__/rendered-gate-exit-code.test.ts`
asserts `check-stories-rendered.mjs`'s `if (failed > 0)` branch still contains
`process.exitCode = 1` and that no later line in the file resets it to `0` — protecting the sweep's
own failure exit path (see the unpiped-capture rule immediately below) independently of this
meta-gate. `check-stories-rendered.mjs` itself has **zero diff** from this task (D33 — a migration
may not be proven against a comparator not shown to fail applies equally to a gate this task must
not silently weaken).

**Unpiped-capture rule (R10 — see also `.claude/skills/execute-task/SKILL.md`).** Task 709
persisted `EXIT_CODE=0` in its evidence transcript beside 4 genuine FAILs; 709-R proved, capturing
the SAME command unpiped, that the sweep really does exit 1 — the zero was a piped-capture
artifact (`$?`/`$LASTEXITCODE` reads a pipe's own status, not the upstream command's), not a code
defect. **Every evidence transcript in this repo must redirect a command's output to a file, then
append the shell's exit-code variable as its own separate statement into that same file** — never
pipe a gate's output through another command (`| tee`, `| Select-Object`, etc.) and trust the
piped exit code. This task's own evidence transcripts follow that rule throughout.

Session: `docs/sessions/2026-08-0X-task710-assertion-liveness-meta-gate.md`.

---

### §14.9.24 — `HeroSearch` Story stand-in closed: renders the same Mantine `Box` composition as production (Task 712, 2026-08-05)

**Why.** `Mantine/Primitives/HeroSearch`'s `Default`/`Fallback` stories
(`src/stories/mantine/primitives/HeroSearch.stories.tsx:53-54`/`:90-91`) rendered a hand-written
`<section className="relative py-16 md:py-24">` wrapping `<div className="container-wide relative
z-10">` — a raw-HTML replica standing in for the production composition
(`src/app/[locale]/page.tsx:28-29`, `<Box component="section" bg pos py>` wrapping `<Box
className="container-wide …">`). This predates Task 712 and is exactly the cl. 16c "divergent
demo stand-in" defect: the CI-blocking `--mantine-only` matrix (§14.9, 40 herosearch cells) proved
the replica's geometry, never production's.

**The fix.** Both stories now render `<Box component="section" bg="var(--primary)"
pos="relative" py={{ base: 'var(--space-16)', md: 'var(--space-24)' }}>` wrapping `<Box
className="container-wide">` — byte-identical to production after Task 712 also removed the
`relative`/`z-10` utilities from `page.tsx:29` itself (D28/D34; A1 measured-inert stacking-census
proof, not a silent drop — the outer `Box` already carried `pos="relative"`, and the census of
every positioned/z-indexed descendant was byte-identical before/after except the removed entry
itself). `container-wide` stays a marker class, unchanged, in both (A3).

**A2 resolved — geometry always matched.** The replica's `py-16 md:py-24` and production's
`py={{ base: 'var(--space-16)', md: 'var(--space-24)' }}` both compute to `64px`/`96px` — measured
via `getComputedStyle` on the built Storybook at 320/700/1024, identical before and after the
parity edit. The Story never actually diverged from production geometrically; only its markup
(raw HTML vs. `Box`) diverged.

**Why that holds at *every* width, not just the three measured** (Task 712 review, F1). The two
sides use different breakpoint systems, so three sample widths cannot by themselves justify
"always". The equivalence holds because `src/design-system/mantine/theme.ts:163-170` overrides
Mantine's breakpoints onto the Tailwind scale — `md: '48em'` (768px) against Mantine's `62em`
(992px) default. **Without that override the replica would have rendered `96px` and production
`64px` across 768–991px, a band no `MANTINE_VIEWPORTS` cell samples** (320/375/390/1024 + the
HeroSearch-only `band-700`), so the 40-cell comparator would not have caught it. Cite the theme
override, not the sample, whenever a Tailwind-vs-Mantine responsive equivalence is claimed.

**The 40-cell comparator.** All 40 herosearch cells (2 story IDs × 4 locales × 5 viewports,
§3.4/§14.9.2's `MANTINE_STORY_EXTRA_VIEWPORTS.HeroSearch`) remain md5-identical to the
`2026-08-05T11-33` (709-R) baseline — zero visual delta despite the markup swap and the
production `z-10`/`relative` drop, confirming both fixes are geometry-neutral. Cross-references
§14.9 (the gate this closes the stand-in gap on) and D32 (comparator demonstrably fails — proven
by 709/709-R history, not re-proven here).

Session: `docs/sessions/2026-08-05-task712-homepage-route-shell-de-tailwind.md`.

---

### §14.9.25 — `design-tokens-allow` marker carry-across into a `.module.css`: the detector is Tailwind-syntax-shaped, not value-shaped (Task 713, 2026-08-05)

**Why.** `MobileBottomNavView.tsx` was the first D28 de-Tailwind migration carrying pre-existing
`design-tokens-allow` markers into a `.module.css`. The kickoff's premise — 4 markers, one per
pre-migration TSX site — did not survive contact with how `scripts/check-design-tokens.mjs`'s
`DETECTION_PATTERNS` actually work: most of them match **Tailwind's own bracket/function syntax**
(`shadow-\[...\]`, `\b[\w-]+-\[[\d.]+(?:px|rem)\]`, an inline-style quoted px/rem string), not
arbitrary CSS property values. A plain CSS declaration like `font-size: 10px;` never matches any
of those patterns — the "length" bracket pattern requires the literal `word-[` substring, which
plain CSS syntax never produces.

**What this means for a marker carry-across.** Measured, not assumed (A1's rule, generalized):

1. **A marker protecting a Tailwind *arbitrary-bracket* utility** (`shadow-[...]`, `text-[10px]`,
   `z-[N]`, `duration-[...]`) may or may not have a post-migration equivalent, depending on whether
   the compiled declaration you write happens to contain a substring one of the OTHER patterns
   (hex color, `rgb()`/`color-mix` function, etc.) still matches. `text-[10px]` compiled to plain
   `font-size: 10px` and stopped matching anything — 2 of this task's 4 pre-migration markers
   (sites :92/:101, already consolidated to one shared class per the "N sites, 1 shared class"
   `HeaderView.module.css`/`FooterView.module.css` precedent) and 1 more (site :56, the FAB label)
   had **zero** post-migration detector hits. Adding a marker to a line with no violation is an
   immediate `stale-marker` failure (`:224`) — do not add one defensively "to be safe."
2. **A migration can introduce a *brand-new* violation a Tailwind-syntax scan never saw.** This
   task's `shadow-lg` (a **named** utility, never scanned as a literal value pre-migration) compiles
   to `--tw-shadow:...var(--tw-shadow-color,#0000001a)...` — the literal hex fallback is real CSS
   text now, and the `color: hex color` pattern (a general pattern, not shadow-specific) catches it.
   This is not a regression in the gate; it is the gate correctly scanning source text that only
   became literal because of the migration.
3. **Net result for this task:** 4 pre-migration markers → 2 post-migration markers, one carried
   (`#00000014`, the bespoke upward-shadow arbitrary value, site :36) and one new (`#0000001a`,
   `shadow-lg`'s compiled color fallback, site :50). Both were determined by I4 arm 1's actual
   failure output (A1), never guessed. `check:design-tokens` → `0 violations / 0 stale-markers /
   0 missing-reason` with exactly these two markers; adding markers for the 3 dropped sites was
   verified to immediately regress to `stale-marker` and was not shipped.

**A CSS-comment-specific trap (found and fixed in this session, not shipped broken).** The
detector's `codeOnly` line-scrubbing (`scanContent`, `:355`) only strips a trailing `// comment` —
built for JSX/TS. A `.module.css`'s `/* design-tokens-allow: ... — reason */` marker comment is
**not** stripped before pattern-matching, so any Tailwind-bracket-shaped substring written inside
your OWN reason text (e.g., quoting the original utility as `shadow-[0_-2px_16px_rgba(0,0,0,0.08)]`
for readability) is scanned as if it were live code and produces a **second, self-inflicted**
violation on the same line. Multi-line `/* ... */` block comments where every continuation line
starts with `*` ARE skipped by `shouldSkipLine` (`:206-215`) — only a marker sharing a physical line
with real code is at risk. **Rule: never quote Tailwind's own `word-[...]` bracket syntax inside a
`.module.css` marker's reason text; describe the original utility in prose instead.**

**The two-armed proof, reusable shape.** Write the moved declaration(s) with **no** marker first,
run `npm run check:design-tokens`, and persist the failing transcript — it names the exact detected
substring for anything that still matches, and its ABSENCE for anything that doesn't (which is
itself the proof that no marker belongs there). Only then add markers using the exact strings the
failure named, and re-run to `0/0/0`. A single green run proves nothing; the failing arm is the
proof that the suppression is real, not vacuous — same shape as `check:assertion-liveness`'s
`DEAD-NEW` detection (§14.9.23) and `check-design-tokens.mjs`'s own stale-marker rule.

Session: `docs/sessions/2026-08-05-task713-mobile-bottom-nav-de-tailwind.md`.

---

### §14.10 Fixture wall-clock determinism (Task 697, 2026-07-30; clock frozen Task 698, 2026-07-30)

**Why.** A story fixture that computes a date from `Date.now()`/`new Date()` at render time encodes the capture date
into its rendered PNG. A baseline captured today and a re-run captured tomorrow then differ — not because anything
changed, but because the calendar day changed. Task 693's Q3 rendered run burned a full diagnostic cycle chasing 32
cells that differed at max channel delta 140 purely because the baseline (captured 2026-07-29) and the new run
(2026-07-30) each recomputed a `created_at`/`expires_at` string live: `"Jul 27, 2026"` → `"Jul 28, 2026"`. A
same-day, zero-code-diff control produced zero motion on those stories; only the day boundary did.

**Rule:** every value a story fixture supplies to a component prop MUST be a literal, or a value derived by
arithmetic from a frozen, named, documented constant — never from `Date.now()` or a bare `new Date()`. A fixture that
needs to demonstrate a relative relationship (e.g. "created N days ago", "expires in 30 days") derives every related
value from ONE frozen anchor constant so the relationships stay intact; freezing must not collapse "staggered",
"valid vs. expired", or similar demonstrations to the same instant.

**Required form** (model: `RangeDatePicker.stories.tsx:79-83`):
```ts
// Frozen anchor (no Date.now()/new Date() wall-clock in fixtures per Storybook governance §14, Task 697)
const FIXTURE_ANCHOR_MS = Date.parse('2026-07-30T00:00:00.000Z')
const created_at = new Date(FIXTURE_ANCHOR_MS - 2 * 24 * 60 * 60 * 1000).toISOString()
```
A frozen ISO string literal is equally acceptable when no relative-offset arithmetic is needed.

**Gate:** `check:stories` Check 16 scans the full story scope (`src/**/*.stories.{ts,tsx}` + `src/stories/**`) for
`Date.now()` used anywhere as a value, and bare `new Date()` (zero-argument) used as a value — both outside comments
and outside string/template literals (Task 698 corrected the gate to strip comment and string content before
matching, and to catch a `new` / `Date()` pair split across a line break, closing 3 false-flagging/false-negative
forms found in the 698 review; the 698 **review** then closed a fourth — a quote that does not close on its own line
is treated as ordinary code, not as a string delimiter, so an apostrophe in JSX text (`It's brand new`) or in a
regex literal (`/don't/`) can never mask away a real violation further down the file, F1). It does NOT flag `new
Date(<any non-empty argument>)` — a frozen literal or an
expression that does not itself call `Date.now()` — that is the negative-control boundary a fixture author relies
on. Flagging a frozen constant would be over-broad and is treated as a gate defect, not a stricter gate (Task 697
I6.4).

**The Storybook preview clock is also frozen (Task 698, D25).** Freezing only the fixture VALUES leaves half of
every date comparison live: a component that itself reads `Date.now()`/`new Date()` at render time against a
now-frozen fixture field — `NotificationItem.tsx`'s `formatDistanceToNow` relative-time string, the
`LISTING_NEW_DAYS` "new" badge (`docs/domain-rules.md:106`), and `isListingPubliclyVisible`'s expiry check — still
drifted across calendar days even after Task 697, because only the fixture's half of each comparison was frozen.
`.storybook/preview-head.html` now carries an inline `<script>` that runs before the story bundle loads (module-scope
fixture constants evaluate before any decorator, so a `preview.tsx` decorator would run too late) and replaces
`window.Date` with a `Proxy` that pins `Date.now()` and zero-argument `new Date()` to the same anchor instant Task
697's fixtures already use (`2026-07-30T00:00:00.000Z`), while passing every other `Date` behaviour through
unchanged: `new Date(<any argument form>)`, `Date.parse`, `Date.UTC`, `Date.prototype`, `instanceof Date`,
subclassing (`class X extends Date`), and `Date()` called without `new`. One accepted deviation: `new
Date().constructor` is the real `Date` constructor rather than the Proxy, so `x.constructor === Date` reads false
inside the preview iframe — no enrolled consumer depends on that identity. Because the anchor literal cannot be
`import`ed into raw HTML, it exists in two places by necessity — the inline script and the fixtures — so
`scripts/__tests__/preview-clock-anchor.test.ts` gates the two against silent divergence, failing and naming both
values the instant they go out of sync.

**Interaction with a date-dependent affordance — now also frozen.** A component that reads live `Date.now()` against
a fixture field (the `LISTING_NEW_DAYS` "new" badge, or `isListingPubliclyVisible`'s expiry check) is no longer left
unaffected by this rule: with the preview clock pinned to the same anchor as the fixtures (Task 698), both halves of
the comparison are now constants, so the affordance's rendered state is permanently stable on any future capture day.
There is no anchor left to "revisit" as real time passes — that caveat is retired.

---

### §14.11 Sub-perceptual rasterization delta — standing comparator (D26, owner ratification 2026-07-31)

**Status.** Owner decision, 2026-07-31, ratifying the ad-hoc D17 (Task 688) and D22-class (Task 693) reliefs into one
standing rule and **superseding D17's `≤ 1/255` bound**. Filed during the Task 699 review, which needed the same
relief for a third time.

**The rule.** An md5-changed cell may be attributed as sub-perceptual rasterization noise — and therefore not treated
as a rendered change — when its **max channel delta is `≤ 2/255`** AND all four of the following hold:

1. the delta is **fully attributed** as rasterization/antialiasing noise, not merely bounded (a named mechanism plus
   evidence: no import path from the story to any file in the diff, a positive control that resolves, or a prior
   zero-code-change observation of the same story);
2. the run reports **0 FAIL and 0 verdict changes** across the full enrolled matrix;
3. the cell's **assertion payload is identical** to baseline after the required Mantine-ID normalization below;
   if the task captures computed styles for the affected surface, those values are identical too;
4. a **same-tree stability control** exists for the run — a second capture of the identical worktree, so the noise
   floor is measured on this tree, not quoted from an older task.

All four are conjunctive. A cell meeting the delta bound but missing any condition is a **stop and report**, not a
tolerated cell.

**Explicit non-scope — this is not a general exemption for visual changes.** `≤ 2/255` never licenses an intended or
unexplained *visual* difference. It is an attribution path for noise in a run whose claim is "nothing rendered
differently". A task that changes a visual value proves that change with the evidence its QA profile requires; it does
not reach for this clause. Nor may a task widen the bound by citing this section: `2/255` is the ceiling, and a delta
above it needs its own owner decision, as D17 and D22 each did.

**Normalization required before comparing assertion payloads (condition 3).** Random Mantine element IDs appear inside
`visualIntegrity.ambiguous[].selector` strings and rotate every run. Measured on the Task 699 pair
(`2026-07-31T10-33` → `11-57`): **6 of 1184 cells** — 4 `Combobox/Default` + 2 `Tabs/Default`, all
**md5-identical** — differ in payload for that reason alone, with `failReason`, `label` and geometry
(`right=362, viewportWidth=320`) unchanged. Strip Mantine-generated IDs before the comparison, per the existing
§14.9.15 `stableSelector()` normalization precedent; an unnormalized payload diff makes condition 3 unsatisfiable on any run containing those
stories.

**This clause does not replace, and does not cap, the documented-noise-set path.** The empirically measured
harness-noise set (§8.1 of the Task 698 session log — `HeroSearch/Fallback`, `EmptyLoadingErrorState`,
`HomepageListingGrids/Loading`, `LocaleSwitcher`, `Button`, `Skeleton`, `MobileBottomNavView`, `PopularLocationsView`,
`ListingDetailPattern`, `ListingGalleryPattern`, `FilterControls`, `UserMenu`) remains a **separate and independent**
attribution path, established by zero-code-change controls rather than by delta magnitude. Those stories routinely
move far above `2/255` with no code change at all: measured on the Task 699 run, **45 of the 91** md5-changed cells
exceed `2/255`, including `EmptyLoadingErrorState/Default` at **179**, `Button/Default` at **158** and
`FilterControls/Default` at **226** — the last of which is a ~1px whole-panel layout shift from a font-metrics race,
structurally proven independent of that task's diff. Reading `≤ 2/255` as a universal ceiling on every changed cell
would therefore retroactively fail Tasks 693, 698 and 699. It is a bound on *this* attribution path only.

**Required record.** A task invoking this clause states, per tolerated cell: the story, locale, viewport, measured max
channel delta, differing-pixel count, the attribution mechanism, and the same-tree control it was measured against.
"Sub-perceptual" as a bare adjective is not evidence.

**Precedents folded in.** D17 (Task 688 — comparator re-scoped to 0-verdict-change + `≤1/255`), D22-class (Task 693 —
52 cells at max delta 2), Task 699 (2 `PopularLocationsView` cells + 1 `FiltersPanelShell` cell at max delta 2, with
assertion payloads verified identical across all 91 changed cells and a same-tree control at
`.screenshots/rendered-assert/2026-07-31T12-29/`).

---

## §15 — Story Coverage Gate (Task 398, 2026-06-06; rewritten Task Q0R, 2026-07-18)

**Why.** The render gates (`check:locale-leak`, `screenshots:assert`) only run over canonical Mantine stories as their sole mandatory CI scope (Task Q0R — see §14.9 for the rendered-proof gate this criterion originated from). This gate ensures that a component enrolled in the Mantine migration actually has a canonical Mantine story proving it, so the migration can't silently regress (a component moved into scope, then its story quietly stops importing it) without CI catching it.

### §15.1 Gate: `check:story-coverage` (manifest-based, Task Q0R)

Owner ruling (Task 623R, reaffirmed Task Q0R): coverage is derived from **static imports**, never filename/directory membership, never a hand exemption entry — the previous "colocated `*.stories.tsx` or exemption" design was replaced because it was tautological (a component's own presence was its own coverage proof) and covered the entire legacy surface, which this task exists to remove from CI blocking.

`scripts/mantine-migration-scope.json` is the hand-maintained enrolment list — the real production component source paths currently in Mantine migration scope (explicit manifest, owner design "A"; never auto-derived from the story set, which would reintroduce the tautology).

The gate, run **pre-build** (no `storybook-static/index.json` exists yet — it parses `src/stories/**/*.stories.tsx` source via the TypeScript compiler API):
1. Finds every canonical Mantine story (`title` starting with `Mantine/Primitives/` or `Patterns/Mantine/` — `scripts/lib/mantine-story-scope.mjs`).
2. Resolves each canonical story's `import` declarations to repo-relative component paths.
3. For each manifest entry: **covered** if ≥1 canonical Mantine story statically imports it; **FAIL** if enrolled but no canonical story imports it; components **not** in the manifest are out of scope — never checked, never blocking.

```bash
npm run check:story-coverage                    # gate check (CI default)
npm run check:story-coverage:report             # full per-entry report, always exit 0
```

**Governance obligation:** every future component migration to Mantine adds that component to `scripts/mantine-migration-scope.json` in the SAME PR as the migration — the manifest is how a migration announces itself to CI.

### §15.1a — Canonical Story is mandatory migration source of truth (owner directive, 2026-07-21)

For any visible Mantine migration, the canonical Mantine Story is the visual source of truth, not optional
documentation or a post-hoc screenshot target. The executor must inspect it before changing the production surface.

- **Story exists:** update or preserve that exact Story in the same task so it renders the migrated artifact with the
  same canonical Mantine primitive and relevant states. It may not be declared out of scope. A raw/legacy/demo
  control that merely resembles the production control is not valid evidence and must be replaced with the
  canonical control or with a composition that imports the real production component.
- **Story does not exist:** create a canonical Mantine Story before, or in the same task as, the consumer migration;
  add its migrated production source to `scripts/mantine-migration-scope.json` and make `check:story-coverage`
  prove the static import. A route-only migration without this Story is incomplete.
- **Pattern slots:** a pattern Story that receives a behavior-bearing `ReactNode` slot does not cover the supplied
  production node unless the Story imports and renders that node (or an explicitly equivalent canonical
  composition). Do not count a static `<span>` or a legacy/demo button as coverage for a migrated interactive
  control.

When an existing Story cannot truthfully cover the target without changing the intended component boundary, stop and
ask the owner whether to extend that Story or introduce a separate composition Story; do not silently bypass it.

### §15.2 Retired: colocated-story / exemption-allowlist design

The old `scripts/story-coverage-exempt.json` mechanism (every `src/components/**` file needing a colocated story or a hand exemption) is **no longer consulted by this gate**. The file itself is left in place (historical record) but is orphaned for coverage purposes — `--update-exempt` now prints a deprecation notice and exits 0 rather than seeding it.

### §15.3 Scaffold generator (`npm run new:story`)

Generates a colocated `*.stories.tsx` skeleton pre-wired to the canonical patterns — passes `check:stories` immediately with zero edits.

```bash
npm run new:story src/components/shared/MyComponent.tsx
# → creates src/components/shared/MyComponent.stories.tsx
```

The scaffold:
- Uses `parameters: { /* layout: 'fullscreen' is the canonical default */ }` (withCanvas provides the gutter)
- Exports `Default` + `LocaleStress` (toolbar-reactive for locale — NO locale pin; viewport pinned to `mobile320`)
- Has TODO placeholders — no raw English string literals (so `check:stories` passes)
- Uses `storyT(locale, 'storybook.NAMESPACE.key')` pattern via commented-out example

**After scaffolding:**
1. Fill props with `storyT(locale, 'storybook.NAMESPACE.key')`.
2. Add keys to `messages/{sq,en,uk,it}.json` under `storybook.NAMESPACE.*`.
3. Run `npm run check:stories` (must exit 0 before committing).
4. If this scaffold is a canonical Mantine story proving a newly migrated component, add that
   component's source path to `scripts/mantine-migration-scope.json` in the same PR (§15.1).

**Intentional gate behavior:** adding a raw English literal to a watched prop (title/label/placeholder/aria-label/…) in the filled-in story WILL make `check:stories` fail — proving the scaffold doesn't smuggle hardcode past the gate.

### §15.4 CI wiring

`check:story-coverage` runs in the `governance` job of `.github/workflows/governance-pr.yml`, before Storybook builds. It parses story source directly (TypeScript AST) rather than a built index — no Storybook build required.

---

## §MQ — Manual visual QA requirements (machine-detection limits, 2026-06-08)

> Added by Task 412. See also `docs/design-system.md §27.3` and `docs/responsive-screenshot-governance.md §MQ`.

`screenshots:assert` (`check-stories-rendered.mjs`) machine-checks three assertions per cell:
(a) no `scrollWidth > clientWidth` overflow; (b) SelectTrigger / TabsList / form input fill their
parent at `<640`; (c) no render-failure (error-boundary, blank canvas, missing router).

**The following failure classes are NOT detectable by `screenshots:assert` and REQUIRE manual visual QA.** Every task touching these surfaces MUST include an `OWNER QA REQUIRED` gate in the session log for these specific checks:

| Failure class | Why it escapes machine detection | Manual check required |
|---|---|---|
| Button not full-width at `<640` | Buttons explicitly excluded from assertion (b) | `§26.1` — verify every text button spans full width at 320/375/390 |
| `overflow-hidden` masking a layout defect | No overflow detected; content silently clipped | `§24.4` — verify no content hidden behind overflow-hidden |
| Popup not rendering as bottom sheet at `<640` | No DOM check for bottom-anchor / edge-to-edge | `§26.2` — open each overlay at 320/375/390 and confirm bottom-sheet |
| Inaccessible table columns | Columns off-screen; parent container not overflowing | `§25.1` — verify all columns/row-actions reachable at 768–1023 |
| Wide-desktop sparsity at 1920/2560 | No whitespace-waste detector | `§4`, `§8` — visual check at 1920/2560 |
| Labels behind sticky/fixed layers | Content present but overlapped | `§22.3 z-index` — verify nothing is overlapped by sticky chrome |
| Visually broken but technically non-overflowing layout | `scrollWidth` not exceeded | General — visual inspection at key viewports |
| Popup bottom-sheet drag handle / close behavior | Static PNG cannot assert interaction | `§26.2` — interactive test: backdrop tap + Esc closes |

**Requirement for tasks touching these surfaces:**

Session logs MUST include an explicit `OWNER QA REQUIRED` row for each applicable failure class, with the specific story × viewport × locale combinations to check manually. The `screenshots:assert` PASS alone is **insufficient** for these classes.

**Future harness improvement:** a proposed slice (see `docs/responsive-storybook-inventory.md §5`) would add DOM assertions for button width and overlay-positioning, reducing the manual QA burden. Until that slice ships, manual QA is mandatory for the above classes.
