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
- **System**: AdminLayout, Containers, EmptyState, ListingGrid, RecentlyViewedSection

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
- **`scripts/check-stories.mjs`** (`npm run check:stories`, `checksRan: 13`) runs 13 governance checks over
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
3. **`element-overlap`** — two visible interactive elements overlap by >1px after algorithmic exclusions (ancestor/descendant, label↔input, aria-hidden/inert, closed overlay layers, `pointer-events:none`). Library-internal elements (base-ui/radix/floating-ui) and `position:absolute|fixed` over a non-positioned sibling (popup-over-trigger) route to `ambiguous-overlap` (third state).
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

**check-stories.mjs checks (`checksRan: 13`, updated Task 468 2026-06-22):**
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

**Gate wiring:** Check 10 runs as part of `check:stories` (wired into `prebuild-storybook`) and exits non-zero on any violation. A test suite at `scripts/__tests__/check-stories.test.ts` (run by `npm test`) verifies all 13 checks (including Check 3/4 broadened + Check 12/13 new — Task 468) and all 6 Check-10 variants. Plant `title="Submit"` in a story and the build fails at file:line.

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

## §15 — Story Coverage Gate + Scaffold (Task 398, 2026-06-06)

**Why.** The render gates (`check:locale-leak`, `screenshots:assert`) only see components that have a story. The hardcode blind spot is already closed by the Task 396 static scanner (source-level, no story needed). This gate is about ensuring components with real runtime-i18n / interactive / responsive behavior get render + screenshot + locale coverage, while NOT forcing low-value stories on trivial presentational primitives. Blanket "story for everything, auto-generated" is explicitly rejected: empty/auto-filler stories with English fixtures are exactly what caused the Sprint 32 rejection.

### §15.1 Gate: `check:story-coverage`

Every component under `src/components/**` must EITHER:
- Have a colocated `*.stories.tsx`, OR
- Be listed in `scripts/story-coverage-exempt.json` with a one-line justification.

A component that is neither → **gate FAILS, CI exit 1, naming the component**.

**"Fail-on-new" rollout:** all currently storyless components are seeded into the exemption allowlist. Going forward, a NEW component must come with a story OR an explicit (reviewed) exemption entry. The allowlist is only flipped to strict (remove exemptions) once backlog "should-have-a-story" components are covered.

**Stale-entry check:** any exemption entry pointing at a non-existent file is flagged as a warning (not a hard fail). Clean up with `--update-exempt`.

```bash
npm run check:story-coverage                    # gate check (CI default)
npm run check:story-coverage:report             # full report, always exit 0
npm run check:story-coverage:update-exempt      # seed/refresh exemption allowlist
```

### §15.2 Exemption allowlist (`scripts/story-coverage-exempt.json`)

Each entry:
```json
"src/components/shared/Map.tsx": "Leaflet map requiring browser DOM + live tile URL; cannot be safely rendered in Storybook (SSR-incompatible)"
```

Tiering:
- **Full exemption** (keep indefinitely): trivial presentational primitives (no user-facing strings, no interactive/responsive behavior), components requiring live auth/Supabase/third-party integrations that cannot be safely mocked, one-off page-shell wrappers.
- **Temporary exemption** (marked as "future story candidate"): complex interactive components where story coverage is desirable but blocked on canonical pattern establishment.

Only the orchestrator may review and promote a stub justification to a permanent exemption.

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
4. Remove the component from `story-coverage-exempt.json` if it was exempted.

**Intentional gate behavior:** adding a raw English literal to a watched prop (title/label/placeholder/aria-label/…) in the filled-in story WILL make `check:stories` fail — proving the scaffold doesn't smuggle hardcode past the gate.

### §15.4 CI wiring

`check:story-coverage` runs in the `governance` job of `.github/workflows/governance-pr.yml`, after the file-integrity gate. It does not require Storybook to build — it is a pure filesystem check (fast, ~100ms).

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
