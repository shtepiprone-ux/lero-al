# Epic A — Localization & Locale Consistency

**Status:** CLOSED ✅
**Opened:** 2026-05-19
**Closed:** 2026-05-19
**Epic commit:** `c2f3ecd97`
**Closure summary:** [`Epic_A_Summary_CLOSED.md`](./Epic_A_Summary_CLOSED.md)
**Numbering:** Tasks 103–106 (global counter continued from Task 102).

> **All four subtasks (A.1 / A.2 / A.3 / A.4) were completed.** Do NOT restart them. See closure summary for: API error-code contract, locale persistence design, and the two open carry-overs (primitives H:+30, dead server actions).

## Goal

Make localization stable, predictable, and consistent across the public site and admin. Eliminate fallback inconsistencies between `sq`, `en`, `uk`, `it`. Make locale persist across the entire user journey (site → admin), and rebuild the mobile locale switcher as a first-class header element.

## Dependencies

- Sprint 1 Task 91 (Italian fallback) and Task 92 ("Шкіп") should close first — they fix the most visible critical bugs and reveal which deeper i18n debt remains.

## Tasks in this epic

### Task A.1 — Full audit of all four locale files

**Type:** Localization QA
**Priority:** High
**Area:** `messages/sq.json`, `messages/en.json`, `messages/uk.json`, `messages/it.json`

**Pre-read:**
1. `docs/backlog.md`, `docs/ai-behavior.md` (Localization Rules)
2. `docs/integrations.md` (next-intl configuration)
3. All four `messages/*.json` files
4. `src/i18n/*` (or equivalent locale resolution config)

**Localization coverage:** sq, en, uk, it
**Responsive coverage:** N/A (translation files only; runtime verification at all 7 breakpoints during smoke test)

**Goal:**
Audit every key across all four locales for: missing keys, mixed-language values, incorrect fallback inheritance, hardcoded language names, untranslated currency codes.

**Required investigation:**
1. Compare key sets — must be identical across all four files.
2. Flag any key whose value visually does not match the target language.
3. Confirm currency codes (`ALL`, `EUR`, `USD`) are never wrapped in translation calls.
4. Produce a remediation list grouped by namespace (nav, listing, auth, common, admin, filters, etc.).

**Acceptance criteria:**
- Identical key sets across all four locale files.
- Audit report (in `docs/sessions/`) listing every defect found and how it was resolved.
- Zero mixed-language values.
- Runtime locale switch validated on at least one page per namespace.

### Task A.2 — Fix language names and currency codes

**Type:** Bugfix / localization QA
**Priority:** High
**Pre-read:** Same as Task A.1, plus `docs/component-rules.md` (no hardcoded text)
**Localization coverage:** sq, en, uk, it
**Responsive coverage:** All 7 breakpoints (LocaleSwitcher visual check)

**Goal:**
Canonical translations for "Albanian / English / Ukrainian / Italian" across all four locales (extending Sprint 1 Task 92 if still incomplete). Currency codes (`ALL`, `EUR`, `USD`) must never pass through `t()`.

**Acceptance criteria:**
- All four locales render canonical language names (Shqip / Albanian / Албанська / Albanese, etc.).
- Currency codes literal in UI; no translation key wraps `ALL`/`EUR`/`USD`.
- LocaleSwitcher passes at all breakpoints.

### Task A.3 — Persist selected locale between site and admin

**Type:** Feature / state authority
**Priority:** High
**Area:** Locale persistence, cookie/session, admin entry flow

**Pre-read:**
1. `docs/ai-behavior.md`, `docs/backlog.md`
2. `docs/state-authority.md` (SSR vs client authority, cookies)
3. `docs/rls-rules.md` (auth boundary between site and admin)
4. `docs/integrations.md` (next-intl middleware)
5. `src/middleware.ts`, `src/i18n/*`, admin entry route

**Localization coverage:** sq, en, uk, it
**Responsive coverage:** All 7 breakpoints

**Goal:**
If an admin or moderator selects `uk` on the public site, the admin panel must open in `uk` — not reset to `sq`. Locale should be persisted via a server-readable cookie (so SSR uses the right messages on first paint, no hydration mismatch).

**Required investigation:**
1. Identify how the locale is currently stored (cookie, localStorage, URL prefix).
2. Confirm the admin entry route reads the same source.
3. Add a server-side cookie if missing (signed/secure where appropriate).
4. Ensure no SSR hydration mismatch — locale must be deterministic before client mounts.

**Acceptance criteria:**
- Admin opens in the same locale the user selected on the site (one-test scenario per locale).
- No hydration warnings introduced.
- Cookie set via secure, SameSite-appropriate settings.
- All four locales validated end-to-end.

### Task A.4 — Move mobile locale switcher to header

**Type:** Responsive UI / UX
**Priority:** Medium-High
**Area:** Header, mobile navigation, `LocaleSwitcher`

**Pre-read:**
1. `docs/ai-behavior.md`, `docs/ui-rules.md`, `docs/component-rules.md`
2. `docs/responsive-audit.md`
3. `src/components/header/`, `src/components/shared/LocaleSwitcher`
4. Selection Components Policy in `docs/ai-behavior.md` (Combobox is canonical)

**Localization coverage:** sq, en, uk, it
**Responsive coverage:** 320, 375, 390, 768, 1280, 1440, 2560

**Goal:**
On mobile, the locale switcher must appear in the header as a canonical `Combobox` — not hidden inside the drawer. This matches 2026 UX expectations and reduces the discovery cost.

**Acceptance criteria:**
- Locale switcher visible in the header at all mobile breakpoints (320–768).
- Uses canonical `Combobox` only.
- Touch target ≥ 44px.
- All four locales correctly listed and switchable at runtime.
- No regression in desktop header layout.

## Epic-level acceptance

- All four tasks closed with their individual acceptance criteria met.
- Locale audit report archived in `docs/sessions/`.
- Locale persists site ↔ admin in all four locales.
- Mobile locale switcher promoted to header for all mobile breakpoints.
