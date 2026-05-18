# Responsive Screenshot Matrix — Lero.al
**Phase 5 of Future Maintenance Direction Epic**
Established: 2026-05-18
Status: CANONICAL REFERENCE

This document defines the canonical viewport and locale matrices for responsive
screenshot capture. Used by `scripts/responsive-screenshots.mjs` and referenced
in `docs/responsive-screenshot-governance.md`.

---

## §1 — CANONICAL VIEWPORT MATRIX

All 15 project-supported viewports:

| Name | Width | Height | Breakpoint family | Fast-check |
|---|---|---|---|---|
| `mobile-320`    | 320px  | 812px  | Mobile (base)  | ✅ |
| `mobile-360`    | 360px  | 800px  | Mobile (base)  | — |
| `mobile-375`    | 375px  | 812px  | Mobile (base)  | ✅ |
| `mobile-390`    | 390px  | 844px  | Mobile (base)  | — |
| `mobile-412`    | 412px  | 915px  | Mobile (base)  | — |
| `mobile-480`    | 480px  | 900px  | Mobile (base)  | — |
| `tablet-640`    | 640px  | 960px  | `sm:` 640px    | — |
| `tablet-768`    | 768px  | 1024px | `md:` 768px    | ✅ |
| `desktop-1024`  | 1024px | 768px  | `lg:` 1024px   | — |
| `desktop-1280`  | 1280px | 800px  | `xl:` 1280px   | ✅ |
| `desktop-1440`  | 1440px | 900px  | `xl:` 1280px+  | ✅ |
| `huge-1720`     | 1720px | 1080px | `2xl:` 1536px  | — |
| `huge-1920`     | 1920px | 1080px | `2xl:` 1536px  | — |
| `huge-2560`     | 2560px | 1440px | `2xl:` 1536px  | ✅ |
| `ultrawide-3440`| 3440px | 1440px | `2xl:` 1536px  | — |

**Fast-check matrix (6 viewports):** used by `npm run screenshots:responsive` (default).
**Full matrix (15 viewports):** used by `npm run screenshots:responsive -- --full`.

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

**Total targets (fast-check matrix):** ~120 screenshots
**Total targets (full matrix, all viewports):** ~400 screenshots

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

All 15 viewports × 4 locales × all story targets.
**Estimated time:** ~10–15 minutes (after Storybook build)

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
