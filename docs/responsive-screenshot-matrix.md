# Responsive Screenshot Matrix — Lero.al
**Phase 5 of Future Maintenance Direction Epic**
Established: 2026-05-18
Status: CANONICAL REFERENCE

This document defines the canonical viewport and locale matrices for responsive
screenshot capture. Used by `scripts/responsive-screenshots.mjs` and referenced
in `docs/responsive-screenshot-governance.md`.

---

## §1 — CANONICAL VIEWPORT MATRIX

All 20 project-supported viewports (15 original + 5 design-system.md §3 canonical additions from Task 350-Fix):

| Name | Width | Height | Breakpoint family | Fast-check | DS-5 canon |
|---|---|---|---|---|---|
| `mobile-320`    | 320px  | 812px  | Mobile (base)  | ✅ | ✅ |
| `mobile-360`    | 360px  | 800px  | Mobile (base)  | — | — |
| `mobile-375`    | 375px  | 812px  | Mobile (base)  | ✅ | ✅ |
| `mobile-390`    | 390px  | 844px  | Mobile (base)  | — | ✅ |
| `mobile-412`    | 412px  | 915px  | Mobile (base)  | — | — |
| `mobile-480`    | 480px  | 900px  | Mobile (base)  | — | ✅ |
| `canonical-560` | 560px  | 812px  | below `sm:` 640px | — | ✅ |
| `tablet-640`    | 640px  | 960px  | `sm:` 640px    | — | — |
| `canonical-680` | 680px  | 812px  | `sm:` to `md:` | — | ✅ |
| `tablet-768`    | 768px  | 1024px | `md:` 768px    | ✅ | ✅ |
| `canonical-810` | 810px  | 812px  | `md:` to `lg:` | — | ✅ |
| `canonical-960` | 960px  | 812px  | `md:` to `lg:` | — | ✅ |
| `desktop-1024`  | 1024px | 768px  | `lg:` 1024px   | — | ✅ |
| `canonical-1200`| 1200px | 812px  | `lg:` to `xl:` | — | ✅ |
| `desktop-1280`  | 1280px | 800px  | `xl:` 1280px   | ✅ | — |
| `desktop-1440`  | 1440px | 900px  | `xl:` 1280px+  | ✅ | ✅ |
| `huge-1720`     | 1720px | 1080px | `2xl:` 1536px  | — | — |
| `huge-1920`     | 1920px | 1080px | `2xl:` 1536px  | — | ✅ |
| `huge-2560`     | 2560px | 1440px | `2xl:` 1536px  | ✅ | ✅ |
| `ultrawide-3440`| 3440px | 1440px | `2xl:` 1536px  | — | — |

**Fast-check matrix (6 viewports):** used by `npm run screenshots:responsive` (default).
**Full matrix (20 viewports):** used by `npm run screenshots:responsive -- --full`.
**DS-5 canon (14 viewports):** the 14 widths from `docs/design-system.md §3` — all now have Storybook presets (Task 350-Fix).

---

## §2 — LOCALE MATRIX

| Code | Language | Risk | Role |
|---|---|---|---|
| `en` | English | LOW | Reference baseline |
| `sq` | Albanian | LOW | Default app locale |
| `uk` | Ukrainian | **HIGH** | **Primary stress test — longest strings** |
| `it` | Italian | MEDIUM | Secondary stress test |

All four locales are used in every capture run.

**Ukrainian stress test priority:**
- `uk` × `mobile-320` — maximum compression stress
- `uk` × `mobile-375` — typical user scenario
- `uk` × `tablet-768` — navigation/toolbar wrapping
- `uk` × `huge-2560` — label/heading overflow at large widths

---

## §3 — SCREENSHOT TARGET INVENTORY

Full list of story targets captured by `scripts/responsive-screenshots.mjs`.
Story IDs are Storybook-generated from `title` + export name (lowercase kebab-case).

### Primitive Stories

| Story ID | Label | Viewport override | Locale override | Priority |
|---|---|---|---|---|
| `primitives-button--default` | Button/Default | — (fast matrix) | all | HIGH |
| `primitives-button--mobile-safe` | Button/MobileSafe | mobile-320, mobile-375 | all | HIGH |
| `primitives-button--long-locale-label` | Button/LongLocale | — | uk only | HIGH |
| `primitives-input--default` | Input/Default | — | all | MEDIUM |
| `primitives-input--mobile-form` | Input/MobileForm | mobile-375 | all | MEDIUM |
| `primitives-tabs--default` | Tabs/Default | — | all | MEDIUM |
| `primitives-dialog--default` | Dialog/Default | — | all | MEDIUM |
| `primitives-dialog--mobile-dialog` | Dialog/Mobile | mobile-375 | all | HIGH |
| `primitives-sheet--filter-sheet-right` | Sheet/FilterRight | mobile-375, tablet-768 | all | HIGH |
| `primitives-sheet--nav-drawer-left` | Sheet/NavLeft | mobile-375 | all | HIGH |
| `primitives-badge--default` | Badge/Default | — | all | MEDIUM |
| `primitives-skeleton--listing-card` | Skeleton/ListingCard | — | all | LOW |

### Layout Primitive Stories (DS-1..DS-4 — added Task 350; canonical presets added Task 350-Fix)

> All 14 design-system.md §3 canonical widths now have Storybook presets (Task 350-Fix added
> `canonical560`, `canonical680`, `canonical810`, `canonical960`, `canonical1200` to `preview.tsx`).
> Manual browser-resize is no longer required for any of the 14 widths.

| Story ID | Label | Key viewport(s) | Locale override | Priority |
|---|---|---|---|---|
| `layout-pageshell--wide-default` | PageShell/WideDefault | desktop-1440 (+ toolbar for all) | all | **CRITICAL** |
| `layout-pageshell--wide-at375` | PageShell/WideAt375 | mobile-375 | all | HIGH |
| `layout-pageshell--wide-at768` | PageShell/WideAt768 | tablet-768 | all | HIGH |
| `layout-pageshell--desktop-at1024` | PageShell/DesktopAt1024 | desktop-1024 | all | HIGH |
| `layout-pageshell--narrow-ultrawide` | PageShell/NarrowUltrawide | huge-2560 | all | **CRITICAL** |
| `layout-pageshell--long-ukrainian-mobile320` | PageShell/UkMobile320 | mobile-320 | uk | HIGH |
| `layout-section--with-title-and-description` | Section/Default | desktop-1440 | all | HIGH |
| `layout-section--long-uk-title-mobile320` | Section/UkMobile320 | mobile-320 | uk | HIGH |
| `layout-section--title-at375` | Section/TitleAt375 | mobile-375 | uk | HIGH |
| `layout-section--title-at768` | Section/TitleAt768 | tablet-768 | all | MEDIUM |
| `layout-section--title-at2560` | Section/TitleAt2560 | huge-2560 | all | **CRITICAL** |
| `layout-pageheader--full-header` | PageHeader/FullHeader | desktop-1440 | all | HIGH |
| `layout-pageheader--action-stacked320` | PageHeader/ActionStacked320 | mobile-320 | all | HIGH |
| `layout-pageheader--action-inline-at768` | PageHeader/ActionInlineAt768 | tablet-768 | all | HIGH |
| `layout-pageheader--desktop-at1024` | PageHeader/DesktopAt1024 | desktop-1024 | all | HIGH |
| `layout-pageheader--long-uk-title-mobile320` | PageHeader/UkMobile320 | mobile-320 | uk | **CRITICAL** |
| `layout-actionbar--default` | ActionBar/Default | desktop-1440 | all | HIGH |
| `layout-actionbar--stacked-mobile320` | ActionBar/StackedMobile320 | mobile-320 | all | HIGH |
| `layout-actionbar--inline-at768` | ActionBar/InlineAt768 | tablet-768 | all | HIGH |
| `layout-actionbar--inline-at1024` | ActionBar/InlineAt1024 | desktop-1024 | all | HIGH |
| `layout-actionbar--many-actions-wrapped-uk320` | ActionBar/UkWrapped320 | mobile-320 | uk | **CRITICAL** |
| `layout-filterbar--default` | FilterBar/Default | desktop-1440 | all | HIGH |
| `layout-filterbar--desktop-lg-boundary1024` | FilterBar/LgBoundary1024 | desktop-1024 | all | **CRITICAL** |
| `layout-filterbar--many-filters10-plus-at768` | FilterBar/ManyAt768 | tablet-768 | all | HIGH |
| `layout-filterbar--many-filters10-plus-at390` | FilterBar/ManyAt390 | mobile-390 | all | HIGH |
| `layout-filterbar--uk-long-labels320` | FilterBar/UkLong320 | mobile-320 | uk | **CRITICAL** |
| `layout-filterbar--stacked-at480` | FilterBar/StackedAt480 | mobile-480 | all | HIGH |
| `layout-pageshell--wide-at560` | PageShell/WideAt560 | canonical-560 | all | HIGH |
| `layout-pageshell--wide-at680` | PageShell/WideAt680 | canonical-680 | all | HIGH |
| `layout-pageshell--wide-at810` | PageShell/WideAt810 | canonical-810 | all | HIGH |
| `layout-pageshell--wide-at960` | PageShell/WideAt960 | canonical-960 | all | HIGH |
| `layout-pageshell--wide-at1200` | PageShell/WideAt1200 | canonical-1200 | all | HIGH |
| `layout-filterbar--stacked-at560` | FilterBar/StackedAt560 | canonical-560 | all | HIGH |
| `layout-filterbar--stacked-at680` | FilterBar/StackedAt680 | canonical-680 | uk | HIGH |
| `layout-filterbar--shared-row-at810` | FilterBar/SharedRowAt810 | canonical-810 | all | **CRITICAL** |
| `layout-filterbar--shared-row-at960` | FilterBar/SharedRowAt960 | canonical-960 | all | HIGH |
| `layout-filterbar--inline-at1200` | FilterBar/InlineAt1200 | canonical-1200 | all | **CRITICAL** |
| `layout-pageheader--action-stacked-at560` | PageHeader/ActionStackedAt560 | canonical-560 | all | HIGH |
| `layout-pageheader--action-inline-at810` | PageHeader/ActionInlineAt810 | canonical-810 | all | HIGH |
| `layout-pageheader--desktop-at1200` | PageHeader/DesktopAt1200 | canonical-1200 | all | HIGH |
| `layout-actionbar--stacked-at560` | ActionBar/StackedAt560 | canonical-560 | all | HIGH |
| `layout-actionbar--inline-at810` | ActionBar/InlineAt810 | canonical-810 | all | HIGH |
| `layout-actionbar--inline-at1200` | ActionBar/InlineAt1200 | canonical-1200 | all | HIGH |

### System Stories

| Story ID | Label | Viewport override | Locale override | Priority |
|---|---|---|---|---|
| `system-listinggrid--desktop` | ListingGrid/Desktop | desktop-1280, desktop-1440 | all | HIGH |
| `system-listinggrid--huge-desktop` | ListingGrid/HugeDesktop | huge-2560 | all | **CRITICAL** |
| `system-listinggrid--mobile` | ListingGrid/Mobile | mobile-320, mobile-375 | all | HIGH |
| `system-listinggrid--with-ukrainian-titles` | ListingGrid/Ukrainian | — | uk only | HIGH |
| `system-containers--container-wide` | Containers/Wide | desktop-1280, huge-2560 | all | **CRITICAL** |
| `system-containers--all-containers` | Containers/All | desktop-1280 | all | MEDIUM |
| `system-emptystate--no-listings` | EmptyState/NoListings | — | all | MEDIUM |
| `system-emptystate--mobile-empty-state` | EmptyState/Mobile | mobile-375 | all | MEDIUM |
| `system-emptystate--ukrainian-locale` | EmptyState/Ukrainian | — | uk only | HIGH |
| `system-adminlayout--admin-toolbar` | Admin/Toolbar | desktop-1280 | all | MEDIUM |

**Total targets (fast-check matrix):** ~145 screenshots (inc. Layout primitives)
**Total targets (full matrix, all viewports):** ~500 screenshots (inc. 5 new canonical presets × all stories)

---

## §4 — FAST-CHECK MATRIX

For day-to-day PR review. Captures 6 viewports × 4 locales × selected stories.
Run: `npm run screenshots:responsive`

| Viewport | Mobile | Tablet | Desktop | Huge |
|---|---|---|---|---|
| Width | 320, 375 | 768 | 1280, 1440 | 2560 |
| Locales | sq, en, uk, it | sq, en, uk, it | sq, en, uk, it | sq, en, uk, it |

**Estimated time:** ~2–3 minutes (after Storybook build)

---

## §5 — FULL-REVIEW MATRIX

For quarterly audits and before major responsive changes.
Run: `npm run screenshots:responsive -- --full`

All 20 viewports × 4 locales × all story targets (inc. 5 canonical presets added in Task 350-Fix).
**Estimated time:** ~12–18 minutes (after Storybook build)

---

## §6 — HUGE DESKTOP REVIEW MATRIX

Critical captures for 2560px regressions.
Story targets with `viewports: ['huge-2560']`:

| Story | What to check |
|---|---|
| `system-listinggrid--huge-desktop` | Must show 4 columns (`2xl:grid-cols-4`) |
| `system-containers--container-wide` | Content must not stretch full 2560px width |
| `primitives-button--default` | Buttons must not expand to fill viewport |
| `primitives-tabs--default` | Tab bar must not stretch unbounded |
| `primitives-dialog--default` | Dialog must stay centered, not full-width |

---

## §7 — LOCALIZATION STRESS MATRIX

Priority captures for Ukrainian overflow detection:

| Story | Viewport | Ukrainian risk |
|---|---|---|
| `primitives-button--long-locale-label` | mobile-375 | Button text overflow |
| `primitives-tabs--default` | tablet-768 | Tab label truncation |
| `primitives-sheet--filter-sheet-right` | mobile-375 | Filter label stack |
| `primitives-dialog--default` | tablet-768 | Dialog heading wrap |
| `system-emptystate--ukrainian-locale` | mobile-375 | Empty state body wrap |
| `system-listinggrid--with-ukrainian-titles` | desktop-1280 | Card title clipping |

---

## §8 — SCREENSHOT FILE NAMING CONVENTION

```
{story-id}__{locale}__{viewport-name}.png
```

Examples:
```
primitives-button--mobile-safe__uk__mobile-375.png
system-listinggrid--huge-desktop__en__huge-2560.png
system-containers--container-wide__sq__desktop-1280.png
```

Output folder: `.screenshots/responsive/YYYY-MM-DD/`

---

## §9 — FUTURE CI STRATEGY

| Phase | Approach | Status |
|---|---|---|
| Phase 5 (now) | Local manual capture, `governance:screenshots` config check | ✅ Done |
| Phase 6 | Playwright `toHaveScreenshot()` baseline diffs in CI (optional) | Planned |
| Phase 6+ | Chromatic or Percy for hosted visual diffing (optional) | Considered |

**When to move to Phase 6:**
- A UI regression reaches production that screenshots would have caught
- Team has time budget for maintaining a screenshot baseline library
- CI time budget allows for 5–10 minute screenshot jobs on PRs

**Chromatic considerations:**
- Free for public repos, paid for private repos
- Zero baseline maintenance — Chromatic hosts everything
- Fastest path to automated visual regression

**Playwright baseline considerations:**
- Self-hosted, no external dependency
- Baseline screenshots must be committed (adds binary files to git)
- Requires consistent CI OS/font rendering (use Linux container)
