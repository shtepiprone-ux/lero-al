# Responsive Screenshot Governance — Lero.al
**Phase 5 of Future Maintenance Direction Epic**
Established: 2026-05-18
Status: PERMANENT GOVERNANCE REFERENCE

> **Current routing (2026-07-17):** screenshot evidence is selected by `docs/qa-profiles.md`.
> Q2 UI work uses targeted rendered evidence. Q3/Q4 visual or release-critical work uses the full
> matrix required by the relevant Mantine or legacy proof path.

---

## §1 — PURPOSE

Responsive screenshots provide a visual regression baseline for the Lero.al project.

They capture how key UI components render across:
- all supported breakpoints (320px → 3440px ultrawide)
- all four project locales (sq, en, uk, it)
- viewport-sensitive states (mobile drawers, filter sheets, huge-desktop grids)

Screenshots are NOT a substitute for manual review. They are a tool to catch regressions
before they reach production: unexpected layout breaks, text overflow, grid col count
drift, and locale-specific wrapping failures.

---

## §2 — WHEN SCREENSHOTS ARE REQUIRED

### Mandatory — when the selected QA profile requires screenshots, especially for:
- Any component listed in `docs/responsive-screenshot-matrix.md §3`
- Any Tailwind responsive class (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`)
- Any container or grid layout class
- Any component that renders differently per locale
- Any touch-target or interactive element sizing

### Recommended — for:
- New UI primitive added to `src/components/ui/`
- New system/layout component added to `src/components/`
- Any change to Tailwind breakpoints or custom container classes

### Not required for:
- Pure TypeScript/logic changes with no UI output
- Server-side data changes with no rendering impact
- Test/script/config changes

---

## §3 — HOW SCREENSHOTS RELATE TO STORYBOOK

Screenshots are captured from the **built Storybook static output** (`storybook-static/`),
not from the live application. This means:

- No live server, database, or auth required
- Deterministic renders via stable fixture data (Phase 4 stories)
- All four locales available via Storybook global toolbar or URL parameter
- All 15 viewports available via Playwright viewport override

**Dependency chain:**
```
npm run build-storybook        → builds storybook-static/
npm run screenshots:responsive → serves storybook-static/, captures PNGs
```

Phase 4 (Task 61) established the story foundation. Phase 5 (Task 62) adds the capture layer.

---

## §4 — HOW TO RUN SCREENSHOT COMMANDS

### One-time browser setup (first time only):
```bash
npx playwright install chromium
```

### Capture fast-check matrix (recommended for PR review):
```bash
npm run build-storybook                # ~3–5 minutes
npm run screenshots:responsive         # captures fast-check matrix
```

### Capture full matrix (all 15 viewports × 4 locales):
```bash
npm run build-storybook
npm run screenshots:responsive -- --full
```

### Validate screenshot infrastructure (no browser, CI-safe):
```bash
npm run governance:screenshots         # exits 0 if setup valid
```

---

## §5 — OUTPUT LOCATIONS

All generated screenshots are **gitignored**. Do not commit them.

| Folder | Contents | Committed? |
|---|---|---|
| `.screenshots/responsive/YYYY-MM-DD/` | Captured screenshots | ❌ Never |
| `storybook-static/` | Storybook build output | ❌ Never |
| `playwright-report/` | Playwright HTML report (if generated) | ❌ Never |
| `test-results/` | Playwright test results | ❌ Never |

**Filename convention:**
```
{story-id}__{locale}__{viewport-name}.png
```
Example: `primitives-button--mobile-safe__uk__mobile-375.png`

---

## §6 — GITIGNORE / ARTIFACT RULES

The following must remain in `.gitignore`:
```
/.screenshots/
/test-results/
/playwright-report/
playwright/.auth/
/storybook-static/
.storybook-cache/
```

**Never commit:**
- `.png` / `.jpg` screenshot files
- `.snap` visual snapshot files
- Playwright HTML reports
- Storybook static build output
- Any binary visual artifact

**CI artifact storage (future Phase 6 option):**
Generated screenshots can be uploaded as GitHub Actions artifacts
using `actions/upload-artifact` — this stores them without git.

---

## §7 — HOW TO REVIEW ALL LOCALES

Each screenshot capture produces variants for all four locales:
- `en` — English (reference baseline)
- `sq` — Albanian (default app locale)
- `uk` — Ukrainian (**most critical** — longest strings, primary overflow stress test)
- `it` — Italian (medium-length strings)

**Review process for locale coverage:**
1. Open `.screenshots/responsive/YYYY-MM-DD/` in a file manager or image viewer
2. For any component with text, compare `__en__` vs `__uk__` variants at the same viewport
3. Check that Ukrainian text does not overflow, truncate unsafely, or break layout
4. Check that `sq` (Albanian) labels render correctly as the default locale

**Critical combinations to review manually:**
- `uk` × `mobile-320` — narrowest + longest strings
- `uk` × `mobile-375` — typical mobile + stress test
- `uk` × `tablet-768` — toolbar/nav label overflow risk
- All locales × `huge-2560` — container-wide whitespace check

---

## §8 — HOW TO REVIEW ALL BREAKPOINTS

The fast-check matrix covers 6 representative viewports:
- `mobile-320` — narrowest supported mobile (320px)
- `mobile-375` — iPhone SE / typical iPhone
- `tablet-768` — iPad / tablet landscape
- `desktop-1280` — standard desktop baseline
- `desktop-1440` — wide desktop
- `huge-2560` — 2K QHD / huge desktop whitespace check

For full-matrix review (all 15 viewports): run `screenshots:responsive --full`.

---

## §9 — HUGE DESKTOP / 2560px REVIEW RULES

The 2560px viewport is the **primary regression target** for huge-desktop whitespace issues.

Review at `huge-2560`:
1. **Listing grids** — must show `2xl:grid-cols-4` (4 columns). Any fewer = regression.
2. **Containers** — `container-wide` class must limit content width. Full-viewport stretch = regression.
3. **Section padding** — must include `2xl:py-*` step. Cramped/excessive spacing = regression.
4. **Navigation** — must remain bounded, not stretch across 2560px.
5. **Admin layout** — must use `max-w-6xl` or similar, not stretch full width.

Files: `system-featuredlistings--default__*__huge-2560.png` and `system-containers--container-wide__*__huge-2560.png`

---

## §10 — WHAT IS NOT AUTOMATED YET

| Feature | Status | Notes |
|---|---|---|
| Automatic visual diffing | ❌ Phase 6 | Requires baseline library and diff tooling |
| CI screenshot on every PR | ❌ Phase 6 | Too slow for blocking CI gate |
| Chromatic / Percy integration | ❌ Phase 6 (optional) | Paid service — evaluate at Phase 6 |
| Committed baseline screenshots | ❌ Intentional | Avoids binary bloat in git |
| Interaction testing | ❌ Future | Requires `@storybook/test` |

---

## §11 — FLAKINESS PREVENTION RULES

To keep screenshots deterministic:

1. **All story fixtures use fixed data** — no `Math.random()`, no `new Date()`.
2. **Playwright waits for `networkidle`** before capturing — ensures styles and fonts loaded.
3. **300ms settle delay** after page load — ensures CSS transitions complete.
4. **Run on Chromium only** — cross-browser font rendering differences cause false diffs.
5. **Run on the same OS** — font rendering varies between macOS/Windows/Linux.
6. **Stories must not depend on auth** — no Supabase session, no user state.
7. **Stories must not depend on network** — all data from fixtures.
8. **Disable animations in story context** (future: add `prefers-reduced-motion: reduce` decorator).

---

## §12 — FORBIDDEN PRACTICES

- **DO NOT** commit screenshot files to git
- **DO NOT** use screenshots as CI gate without a stable baseline library (Phase 6)
- **DO NOT** capture screenshots from the live production app — use Storybook only
- **DO NOT** fix responsive issues by hiding overflow or using `overflow: hidden` hacks
- **DO NOT** add locale-specific CSS hacks to pass screenshot review
- **DO NOT** capture screenshots requiring auth/database access
- **DO NOT** run screenshot CI on every push — it will be slow and flaky
- **DO NOT** make `npm run governance` depend on screenshot capture
- **DO NOT** hardcode viewport widths in source files to pass screenshot checks

---

## §13 — UPGRADE PATH

When upgrading to Phase 6 (automated visual regression):

1. Choose a diff strategy:
   - **Option A — Chromatic**: hosted visual diffing, easiest to set up
   - **Option B — Playwright built-in**: `expect(page).toHaveScreenshot()` with committed baselines
   - **Option C — percy-playwright**: Percy integration with Playwright

2. Update `governance:screenshots` to run actual captures + diffs in CI

3. Remove the `--check`-only behavior once browsers are always available in CI

4. Delete this "not automated yet" section once automation is in place

---

## §14 — COMPONENT CATALOG INTEGRATION (Phase 6)

Screenshot targets are derived from the component catalog risk register.

**Find screenshot target candidates:**
```bash
npm run catalog:components
# Review docs/component-risk-register.md §Localization Risk
# Review docs/component-risk-register.md §Mobile Risk
# Review docs/component-risk-register.md §Huge Desktop Risk
```

Components with `LOCALIZATION`, `MOBILE`, or `HUGE_DESKTOP` risks in the catalog
are candidates for addition to the screenshot target list in
`scripts/responsive-screenshots.mjs`.

When adding a new screenshot target:
1. Add to `STORY_TARGETS` array in `scripts/responsive-screenshots.mjs`
2. Include appropriate viewport/locale overrides
3. Update `docs/responsive-screenshot-matrix.md §3`
4. Run `npm run governance:screenshots` to verify

---

## §MQ — Machine-detection limits + manual visual QA requirement (2026-06-08)

> Added by Task 412. See also `docs/design-system.md §27.3` and `docs/storybook-governance.md §MQ`.

### What `screenshots:assert` reliably catches

| Assertion | What is checked | Reliability |
|---|---|---|
| (a) Horizontal overflow | `scrollWidth > clientWidth` at every viewport | ✅ High |
| (b) Form control width | SelectTrigger / TabsList / form inputs fill parent at `<640` | ✅ High for those selectors |
| (c) Render failure | Error-boundary screen, blank canvas, missing router/provider | ✅ High for known patterns |

### What `screenshots:assert` does NOT catch (manual QA required)

| Gap | Consequence if missed | Manual QA action |
|---|---|---|
| **Button not full-width at `<640`** | User must side-scroll or cannot tap button | Open story at 320px, visually verify every text button is full-width (`§26.1`) |
| **`overflow-hidden` masking a defect** | Content silently clipped — no overflow triggered | Read layout structure; verify nothing meaningful is hidden behind `overflow-hidden` (`§24.4`) |
| **Popup not bottom-sheet at `<640`** | Centered card / mini-dropdown at mobile = bad UX, hard to dismiss | Open overlay primitives at 320/375/390 and confirm bottom-anchor + edge-to-edge (`§26.2`) |
| **Table columns off-screen at 768–960** | Row actions / data columns inaccessible at tablet | Verify all columns reachable at 768, 810, 960 for any tableAtLg surface (`§25.1`) |
| **Wide-desktop sparsity at 1920/2560** | Wasteland margins; poor use of screen estate | Visual check at 1920/2560 for container cap and grid column count (`§4`, `§8`) |
| **Sticky/fixed layer overlap** | Interactive content hidden behind sticky header/bottom-nav | Scroll to bottom at mobile viewports; confirm no overlap (`§22.3 z-index`) |

### OWNER QA REQUIRED gate

Every task that touches surfaces with these gaps MUST include an explicit `OWNER QA REQUIRED`
matrix row in the session log for the affected checks. `screenshots:assert` PASS alone is not
sufficient for tasks touching:
- Overlay/popup primitives (Dialog, Sheet, Select, Combobox, DropdownMenu, Popover, Command)
- Action button clusters (any surface with more than one Button)
- Admin data tables at 768–1023px
- Any component at 1920/2560

### Future improvement

A proposed harness slice in `docs/responsive-storybook-inventory.md §5` would add DOM assertions
for button width and overlay bottom-sheet positioning, eliminating these manual-QA gaps. Until
that slice ships, manual QA is mandatory per this section.
