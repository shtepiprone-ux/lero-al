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
- One `LocaleStress` story per component (pinned to `mobile320` + `uk` locale) covers the worst-case overflow scenario.
- The locale toolbar handles routine sq/it/en switching for all other stories.

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
- Global default is `parameters.layout: 'fullscreen'`. **`layout: 'centered'` and `layout: 'padded'` are FORBIDDEN
  in story files** (lint-enforced). If a story seems to need a centred preview, STOP&ASK — never add an exemption.

### 14.2 Single locale-aware fixture/i18n layer (no raw literals, ever) — supersedes §13's per-file maps
- All user-facing story/fixture strings come from the `storybook.*` message namespace (sq/en/uk/it parity) via the
  `storyT`/`useStoryMessages` helper (`src/stories/_storyI18n.ts`). Fixtures expose **keys**, not literals. This
  replaces §13's "per-locale record maps inside the story" with one single source.
- The uk values ARE the "longest strings" stress content. There is no separate hardcoded uk fixture, and no
  `globals:{locale:'uk'}` pin. `LocaleStress` is one toolbar-reactive export per component, **never named "Ukrainian".**

### 14.3 Machine gates (a violation FAILS the build — not a checklist)
- **ESLint** (scoped to `**/*.stories.tsx` + `src/stories/**`) errors on: `layout:'centered'|'padded'`; raw
  `<button>/<input>/<select>/<textarea>` JSX; story export names matching `/Ukrainian/`; raw user-facing string
  literals in JSX text / `aria-label` / `title`/`label`/`placeholder` / fixture fields (anything not from
  `t()`/`storyT()`, minus a tight, documented dev-prose allowlist).
- **`scripts/check-stories.mjs`** runs the same checks + `storybook.*` parity and exits non-zero on any violation;
  wired into `prebuild-storybook`/`prestorybook` and CI, exposed as `npm run check:stories`. So `build-storybook`
  and CI FAIL on reintroduced hardcode.
- **`responsive-screenshots --assert`** captures each story × breakpoint × locale AND asserts no horizontal scroll
  at 320 and full-width text controls at <640, emitting a machine-readable matrix (JSON + PNGs). **This is the only
  accepted rendered proof.** "OWNER QA REQUIRED / NOT CHECKED / no browser access" no longer closes a UI cell.

### 14.4 Proof rule (restated)
`tsc=0` / `lint=0` / `build-storybook` exit 0 are baselines, never proof. A Storybook/UI task is INCOMPLETE unless
its session log references the `--assert` PNG/JSON artifacts per rendered cell (uk@320/375/390 mandatory) and shows
the gates green — plus a negative-flow transcript proving each gate FAILS on a planted violation, then reverts.

### 14.5 Implementation notes (Task 380, 2026-06-04)

**Canvas gutter token:** `.container-wide` from `src/app/globals.css` §4. Padding: `1rem` (base) → `1.5rem` (≥640px) → `2rem` (≥1024px) → `3rem` (≥1536px). This is the ONLY canonical gutter — do NOT use ad-hoc `px-N` or Storybook's `padded` layout.

**`withCanvas` decorator** (`storybook/preview.tsx`): wraps every story in `<div class="container-wide">`. Decorator order (outermost→innermost): `withTheme → withLocale → withCanvas → Story`. The canvas gutter applies directly around the story content.

**`storyT(locale, key)` helper** (`src/stories/_storyI18n.ts`): resolves `storybook.*` message keys per locale. Throws if the locale is unknown or the key is missing — NO English fallback in sq/uk/it (omissions are caught immediately in dev).

**Fixture migration pattern** (`src/stories/fixtures/listing.fixture.ts`):
- All user-facing title strings are in `storybook.listing.*` message keys (sq/en/uk/it parity).
- `makeListingFixtures(locale)` factory returns locale-resolved fixtures.
- Backward-compat static exports (e.g. `LISTING_FIXTURE`) default to English until Task 381 migrates consumers.

**ESLint story block** (`eslint.config.mjs`): scoped to `src/**/*.stories.tsx` + `src/stories/**`. Must come LAST in the config (flat-config LAST-WINS for `no-restricted-syntax`). Includes all general `.tsx` selectors (A–D) PLUS story-specific selectors (E–H).

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

**check-stories.mjs checks:**
1. `layout:\s*['"](?:centered|padded)['"]` — grep all story files
2. `<(?:button|input|select|textarea)[\s/>]` — JSX raw HTML controls (string-literal false-positives filtered)
3. `export const .*Ukrainian` — banned export names
4. `globals:\s*\{.*locale.*['"]uk['"]` — banned pinned locale
5. Known English/Cyrillic title literals in `src/stories/fixtures/**`
6. `storybook.*` namespace key parity across sq/en/uk/it

**check-stories-rendered.mjs** (`npm run screenshots:assert`): Playwright assertions per story × {320,375,390,480,640,768,1280} × {sq,en,uk,it}. Assertions: (a) no `scrollWidth > clientWidth` overflow, (b) non-icon-only buttons `offsetWidth >= container content width - 8px` at <640. Emits JSON manifest + PNG per cell to `.screenshots/rendered-assert/<timestamp>/`.
