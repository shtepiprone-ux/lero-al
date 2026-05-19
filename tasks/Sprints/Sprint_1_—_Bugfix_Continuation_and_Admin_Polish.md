# Sprint 1 — Bugfix Continuation & Admin Polish

**Status:** OPEN
**Opened on:** 2026-05-19
**Numbering:** Task 91 → Task 102 (global numbering continues from Sprint 0 Task 90)

This sprint completes the residual Sprint 0 work (items that Task 84–90 covered only partially) and adds new bugs/tasks discovered during the 2026-05-19 review of `ideas.txt`.

Every task below follows the **Canonical Task Template** defined in `docs/ai-behavior.md`. Sonnet 4.6 (or any agent) MUST NOT skip Pre-read, Localization coverage, or Responsive coverage sections.

---

## Task 91 — Fix Italian locale fallback to Ukrainian

**Type:** Critical bugfix / i18n
**Priority:** Critical
**Area:** i18n, locale fallback, `messages/it.json`, locale resolution layer

**Pre-read (mandatory):**
1. `docs/backlog.md`
2. `docs/ai-behavior.md` (Localization rules + Pre-Task Mandatory Checklist)
3. Always-governed: `docs/env.md`, `docs/rls-rules.md`, `docs/component-rules.md`
4. Task-relevant: `docs/integrations.md` (next-intl setup), `docs/architecture.md` (locale routing)
5. `messages/sq.json`, `messages/en.json`, `messages/uk.json`, `messages/it.json`
6. `next.config.ts`, `src/i18n/*` (or equivalent locale config)

**Localization coverage:** sq, en, uk, it (focus: it)
**Responsive coverage:** 320, 375, 390, 768, 1280, 1440, 2560 (visual confirmation across breakpoints)

**Bug:**
When Italian locale (`it`) is active, large parts of the UI render in Ukrainian instead of Italian. Italian must never inherit Ukrainian values.

**Required investigation:**
1. Identify locale resolution chain: where `it` falls back when a key is missing.
2. Compare key sets across all four locale JSONs (must be identical sets).
3. Check whether middleware/server-side locale negotiation accidentally selects `uk` when `it` is requested.
4. Identify any namespace where `it` keys are missing → next-intl falls back to default → confirm default is NOT `uk`.
5. Audit `next.config.ts` and i18n config for incorrect fallback chains.

**Acceptance criteria:**
- Switching to `it` renders ALL visible UI strings in Italian (or in `sq` if explicitly configured as ultimate fallback — NEVER in `uk`).
- All four locale JSONs have identical key sets.
- Runtime locale switching test passes for every screen Italian users land on.
- 0 new lint errors / 0 new warnings, `npm run build` passes.

**Out of scope:**
- Adding new translation keys unrelated to the fallback bug.
- Refactoring next-intl architecture.

---

## Task 92 — Verify and complete "Шкіп" → "албанська" language-name translations

**Type:** Bugfix / localization QA
**Priority:** High
**Area:** Localization, language-name strings across all locales

**Pre-read (mandatory):**
1. `docs/backlog.md`, `docs/ai-behavior.md`
2. Task 87 commit `fc75200f0` (Fix Ukrainian localization typos) — verify what it actually covered
3. `messages/sq.json`, `messages/en.json`, `messages/uk.json`, `messages/it.json`
4. `src/components/shared/LocaleSwitcher` (or equivalent)

**Localization coverage:** sq, en, uk, it
**Responsive coverage:** N/A (text-only changes, but verify language switcher renders correctly at all 7 breakpoints)

**Bug:**
Reports indicate that with `uk` active, Albanian appears as "Шкіп" instead of "албанська". Task 87 may have only addressed generic typos. This task verifies and completes coverage for ALL language-name strings across ALL locales.

**Required investigation:**
1. Audit every key in every locale file that names a language (sq, en, uk, it, albanian, english, ukrainian, italian).
2. Confirm canonical translations:
   - Albanian: sq=`Shqip`, en=`Albanian`, uk=`Албанська`, it=`Albanese`
   - English: sq=`Anglisht`, en=`English`, uk=`Англійська`, it=`Inglese`
   - Ukrainian: sq=`Ukrainisht`, en=`Ukrainian`, uk=`Українська`, it=`Ucraino`
   - Italian: sq=`Italisht`, en=`Italian`, uk=`Італійська`, it=`Italiano`
3. Check `LocaleSwitcher` component for hardcoded names.

**Acceptance criteria:**
- Every locale renders the canonical language names listed above.
- No hardcoded language names anywhere in the code.
- Runtime switch test passes in `LocaleSwitcher` for all four locales.

**Out of scope:** Non-language-name translation cleanup.

---

## Task 93 — Full site-wide dropdown/popover clipping audit

**Type:** UI regression / design system debt
**Priority:** High
**Area:** Shared components, popover/portal behavior, dropdown, combobox

**Pre-read (mandatory):**
1. `docs/backlog.md`, `docs/ai-behavior.md`
2. `docs/component-rules.md`, `docs/component-governance.md`, `docs/ui-rules.md`
3. `docs/state-authority.md` (portal rendering rules)
4. Task 89 commit `f58bbd2ae` — what was already fixed (admin form cards only)
5. `src/components/ui/` — every Combobox/Popover/Select/Dropdown primitive
6. `src/components/admin/`, `src/components/listings/`, `src/components/shared/`

**Localization coverage:** sq, en, uk, it (confirm long Ukrainian strings don't break layout)
**Responsive coverage:** 320, 375, 390, 768, 1280, 1440, 2560

**Bug:**
Two dropdown styles exist in the project — some unaffected by container overflow, others clipped by their parent. Task 89 only fixed admin form cards. A complete site-wide audit is required.

**Required investigation:**
1. Enumerate every Combobox / Popover / Select / Dropdown / Sheet usage.
2. Classify each by portal strategy (rendered in body vs. inline).
3. Identify any inconsistency with the canonical `Combobox` primitive (per `docs/ui-rules.md`).
4. Test clipping in: cards, modals, drawers, admin tables, mobile filter overlays, mobile menus.
5. Document findings in `docs/component-risk-register.md`.

**Acceptance criteria:**
- All dropdowns/popovers use unified portal strategy (body-rendered) except where documented otherwise.
- No clipping in any of the tested containers across all 7 breakpoints.
- `docs/component-risk-register.md` updated with audit results.
- 0 new lint errors / 0 new warnings.

**Out of scope:** Visual restyling beyond fixing clipping; new component variants.

---

## Task 94 — Full mobile spacing & auth UI audit

**Type:** Responsive UI bug
**Priority:** High
**Area:** Header, auth controls, mobile layout, all responsive surfaces

**Pre-read (mandatory):**
1. `docs/backlog.md`, `docs/ai-behavior.md`
2. `docs/ui-rules.md`, `docs/component-rules.md`, `docs/responsive-audit.md`
3. Task 90 commit `1488a1038` — what was already done (touch targets only)
4. `src/components/header/`, `src/components/shared/AuthButtons` (or equivalent)
5. `docs/governance-checklists.md` Checklist A + B

**Localization coverage:** sq, en, uk, it (Ukrainian strings are the longest — test wrap/overflow)
**Responsive coverage:** 320, 375, 390, 768, 1280, 1440, 2560

**Bug:**
Mobile spacing inconsistencies remain after Task 90. The "Увійти" and "Зареєструватися" buttons differ visually from the rest of the button system (height, width, padding).

**Required investigation:**
1. Compare current auth buttons against canonical `Button` from `@/components/ui/button` (sizes xs / sm / default / lg / xl / icon).
2. Replace any local clones / `h-11` className hacks with `size="xl"`.
3. Audit spacing tokens across all mobile-reachable surfaces (top nav, side drawer, cards, listing detail).
4. Run `npm run governance:responsive` and `npm run governance:components`.

**Acceptance criteria:**
- Auth buttons use `Button` from `@/components/ui/button` with canonical `size="xl"`.
- No `h-11` className hack anywhere.
- All four locales render correctly with no overflow / wrap regression.
- Visual check passes at 320, 375, 390, 768, 1280, 1440, 2560.
- 0 new lint errors, 0 new warnings, governance checks pass.

**Out of scope:** Desktop restyling, new auth flow (covered by Epic B).

---

## Task 95 — Active filter chip: entire button as click target

**Type:** UX / accessibility
**Priority:** Medium-High
**Area:** Filters (public site + admin), filter chips, mobile UX

**Pre-read (mandatory):**
1. `docs/backlog.md`, `docs/ai-behavior.md`
2. `docs/ui-rules.md`, `docs/component-rules.md`, `docs/component-governance.md`
3. `src/lib/filters/filterEngine.ts`, `src/components/filters/` (or equivalent)
4. Anti-patterns in `docs/ai-behavior.md` "Filter Architecture Anti-Patterns"

**Localization coverage:** sq, en, uk, it
**Responsive coverage:** 320, 375, 390, 768, 1280, 1440, 2560

**Bug:**
Active filter chips only remove the filter when the small `×` icon is clicked. The icon is too small for both mouse and touch input. The entire chip should remove the filter on click.

**Required investigation:**
1. Find the active filter chip component (public listings + admin filters).
2. Migrate click handler from the `×` icon to the whole chip.
3. Keep keyboard accessibility (Enter / Space remove the filter; Escape de-focuses).
4. Verify minimum 44px touch target on mobile.

**Acceptance criteria:**
- Clicking anywhere on the chip removes the filter.
- Keyboard navigation works (Tab / Enter / Space).
- Touch target ≥ 44px on mobile breakpoints.
- All locales render correctly without overflow.

**Out of scope:** Filter chip restyling beyond click-target fix.

---

## Task 96 — Replace "Не забувайте" placeholder in Premium empty state

**Type:** Localization bug / UI copy
**Priority:** Medium-High
**Area:** Premium listings section, empty state messaging

**Pre-read (mandatory):**
1. `docs/backlog.md`, `docs/ai-behavior.md`
2. `messages/sq.json`, `messages/en.json`, `messages/uk.json`, `messages/it.json`
3. `src/components/listings/PremiumListings` (or equivalent)

**Localization coverage:** sq, en, uk, it
**Responsive coverage:** 320, 375, 390, 768, 1280, 1440, 2560

**Bug:**
With `uk` active, the Premium section shows "Не забувайте" when there are no premium listings. The string is incorrect for an empty-state message and likely was pulled from the wrong i18n namespace.

**Required investigation:**
1. Find the empty-state rendering code in the Premium section.
2. Trace the i18n key that resolves to "Не забувайте".
3. Replace with a correct empty-state string in all four locales.
4. Suggested copy (subject to product approval):
   - sq: `Aktualisht nuk ka oferta premium.`
   - en: `No premium listings right now.`
   - uk: `Зараз немає преміум оголошень.`
   - it: `Al momento non ci sono annunci premium.`

**Acceptance criteria:**
- Empty state renders the correct copy in every locale.
- The previous misused key is no longer referenced.
- Runtime locale switch confirmed at all 7 breakpoints.

**Out of scope:** Premium section redesign (see also Task 101).

---

## Task 97 — Fix "Тип" column translation in Listings admin table

**Type:** Localization bug
**Priority:** Medium
**Area:** Admin Listings table, column headers, property type values

**Pre-read (mandatory):**
1. `docs/backlog.md`, `docs/ai-behavior.md`
2. `messages/sq.json`, `messages/en.json`, `messages/uk.json`, `messages/it.json`
3. `src/components/admin/listings/` (Listings admin table)
4. `docs/domain-rules.md` (property type enum/canonical values)

**Localization coverage:** sq, en, uk, it
**Responsive coverage:** 320, 375, 390, 768, 1280, 1440, 2560 (admin table responsiveness)

**Bug:**
In the Listings admin table, the "Тип" column does not translate correctly under all locales. Either the column header, the cell values, or both are stuck.

**Required investigation:**
1. Identify whether the issue is the header label, the cell value, or both.
2. Verify property type enum keys exist in every locale file.
3. Confirm the cell renders `t('property_types.<key>')` (or equivalent) rather than the raw enum value.

**Acceptance criteria:**
- Column header and all cell values translate correctly in every locale.
- No hardcoded type names in the table.
- 0 new lint errors / 0 new warnings.

**Out of scope:** Other admin table columns (covered in Epic K if needed).

---

## Task 98 — Constrain Combobox scrollbar within the dropdown bounds

**Type:** UI bug / shared component
**Priority:** Medium
**Area:** `@/components/ui/combobox`, dropdown overflow / scroll

**Pre-read (mandatory):**
1. `docs/backlog.md`, `docs/ai-behavior.md`
2. `docs/component-rules.md`, `docs/ui-rules.md`, `docs/component-governance.md`
3. `src/components/ui/combobox.tsx` (or equivalent)
4. Selection Components Policy in `docs/ai-behavior.md`

**Localization coverage:** sq, en, uk, it
**Responsive coverage:** 320, 375, 390, 768, 1280, 1440, 2560

**Bug:**
The scrollbar inside a Combobox dropdown appears to extend beyond the dropdown's visible boundary. It should be contained within the dropdown panel.

**Required investigation:**
1. Inspect the Combobox dropdown CSS: `overflow`, `max-height`, scrollbar styling.
2. Verify portal target and clipping ancestor.
3. Confirm fix does not regress focus management, keyboard navigation, or virtual scroll if enabled.

**Acceptance criteria:**
- Scrollbar visually contained within dropdown panel at all 7 breakpoints.
- No regression in keyboard navigation (Up/Down/Home/End/Esc).
- All locales pass with long option labels (e.g. Ukrainian city names).

**Out of scope:** Combobox API changes; non-canonical Combobox instances (see Task 99).

---

## Task 99 — Replace local Combobox in Admin User form with canonical Combobox

**Type:** Component governance bug
**Priority:** Medium
**Area:** Admin user create/edit form, "Локація (місто реєстрації)" field

**Pre-read (mandatory):**
1. `docs/backlog.md`, `docs/ai-behavior.md` (Selection Components Policy)
2. `docs/component-rules.md`, `docs/component-governance.md`, `docs/ui-rules.md`
3. `src/components/admin/users/` (UserForm or equivalent)
4. `@/components/ui/combobox` — canonical reference

**Localization coverage:** sq, en, uk, it
**Responsive coverage:** 320, 375, 390, 768, 1280, 1440, 2560

**Bug:**
The Admin user create/edit page uses a locally modified Combobox for "Локація (місто реєстрації)". Project policy is Combobox-only and canonical — local clones are forbidden.

**Required investigation:**
1. Identify the local Combobox implementation in the user form.
2. Map its props/behavior to the canonical `@/components/ui/combobox`.
3. Ensure city data source is reused (whatever the canonical Combobox uses elsewhere for cities).
4. Remove the local clone.

**Acceptance criteria:**
- Form uses canonical `Combobox` exclusively.
- No local Combobox file remains.
- Behavior matches existing canonical Combobox usages elsewhere (search, selection, keyboard, clear).
- 0 new lint errors / 0 new warnings, governance checks pass.

**Out of scope:** Full project-wide audit of non-canonical Combobox usages (could be a separate epic if more are found).

---

## Task 100 — Admin User form: add success toast and disable Save until changed

**Type:** UX bug
**Priority:** Medium
**Area:** Admin user create/edit form, form state, toast system

**Pre-read (mandatory):**
1. `docs/backlog.md`, `docs/ai-behavior.md`
2. `docs/component-rules.md`, `docs/ui-rules.md`
3. `src/components/admin/users/` (UserForm)
4. Existing toast component / hook in `src/components/ui/` or `src/hooks/`

**Localization coverage:** sq, en, uk, it (toast message must be translated)
**Responsive coverage:** 320, 375, 390, 768, 1280, 1440, 2560 (toast position/wrap)

**Bug:**
After clicking "Зберегти" in the admin user form, no toast is shown. Additionally, the Save button stays enabled even when no field has changed.

**Required investigation:**
1. Add success/error toast wiring on save.
2. Track form dirty state (e.g. via `react-hook-form` `formState.isDirty`).
3. Bind the Save button's `disabled` prop to `!isDirty || isSubmitting`.
4. Confirm toast translates correctly across all four locales.

**Acceptance criteria:**
- Save success → toast appears with localized message.
- Save error → error toast with appropriate message.
- Save button disabled until at least one field changes.
- 0 new lint errors / 0 new warnings.

**Out of scope:** Reworking other admin forms (apply pattern to others in follow-up tasks).

---

## Task 101 — Hide "Переглянути всі" when Premium section is empty

**Type:** UX bug
**Priority:** Low-Medium
**Area:** Premium listings section, homepage

**Pre-read (mandatory):**
1. `docs/backlog.md`, `docs/ai-behavior.md`
2. `docs/ui-rules.md`, `docs/component-rules.md`
3. `src/components/listings/PremiumListings` (or equivalent)
4. Combined with Task 96 — same component

**Localization coverage:** sq, en, uk, it
**Responsive coverage:** 320, 375, 390, 768, 1280, 1440, 2560

**Bug:**
The "Переглянути всі" button is visible even when there are no premium listings.

**Required investigation:**
1. Conditionally render the "Переглянути всі" button based on listing count.
2. Combine with Task 96's empty state if the same component.

**Acceptance criteria:**
- Button hidden when premium listings array is empty.
- Button rendered when ≥ 1 premium listing exists.
- All locales pass.

**Out of scope:** Premium section redesign.

---

## Task 102 — Remove Google Translate API and DeepL API integrations

**Type:** Chore / cleanup
**Priority:** Medium
**Area:** Translation tooling, scripts, environment variables, dependencies

**Pre-read (mandatory):**
1. `docs/backlog.md`, `docs/ai-behavior.md`
2. `docs/integrations.md` (current translation services)
3. `docs/env.md`, `docs/dependencies.md`
4. `package.json`, `scripts/` (find any translation automation)
5. `.env.local`, `.env*` for any `GOOGLE_TRANSLATE_*` or `DEEPL_*` variables

**Localization coverage:** N/A (no user-facing strings)
**Responsive coverage:** N/A

**Goal:**
Remove all references to Google Translate API and DeepL API from the project — neither is free and the project no longer relies on them.

**Required investigation:**
1. Find usages of `googleapis`, `@deepl/...`, `deepl-node`, or related packages.
2. Remove imports, calls, dependency entries from `package.json`.
3. Remove env variables from `.env.example` (if present), `docs/env.md`, deployment notes.
4. Update `docs/integrations.md`, `docs/dependencies.md` to reflect removal.
5. Run `npm install` to refresh lockfile.

**Acceptance criteria:**
- 0 references to Google Translate / DeepL in `src/`, `scripts/`, `package.json`.
- `docs/env.md` and `docs/integrations.md` updated.
- `npm run build` passes.
- 0 new lint errors / 0 new warnings.

**Out of scope:** Picking a replacement translation strategy (manual translations remain the canonical approach).

---

## Sprint 1 — overall acceptance

- All twelve tasks (91–102) closed with their individual acceptance criteria met.
- `docs/backlog.md` updated: "Last Session" summary + Session Archive row + Next Immediate Tasks queue.
- `docs/sessions/YYYY-MM-DD-sprint-1-bugfix-continuation.md` created per Backlog & Session Log Rules.
- All four locales (sq/en/uk/it) and all seven breakpoints (320/375/390/768/1280/1440/2560) verified for every UI-affecting task.
- No regressions introduced to Tasks 84–90 scope.
