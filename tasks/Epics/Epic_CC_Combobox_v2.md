# Epic CC — Combobox v2 (extends Q)

**Status:** OPEN — opened 2026-05-25 by the Opus 4.7 orchestrator. Extension of Epic Q (Combobox
& UI Primitive Single-Source — closed 2026-05-23 with Tasks 190–194).
**Source notes:** `issues.txt` 2026-05-25 — #9 (the phone-number `Combobox` placeholder in the
country-code picker still shows 8 digits everywhere on site + admin; Albanian mobile numbers are
9 digits — the placeholder MUST be 9 digits); #10 (searchable Comboboxes — `LocationCombobox`,
PropertyTypeCombobox, etc. — only match search input in one language; users typing in another
locale should still find the option whether they type sq / en / uk / it).
**Kickoffs:** `Epic_CC_kickoff_prompts.md` (Tasks 244–245).

> Epic Q canonicalized the Combobox API and folded the location + year wrappers into it. CC
> tightens two correctness issues that remain.

## Goal

Phone placeholders are correct across the project (9 digits, Albania). Searchable Comboboxes
match user input across all four UI locales — typing "Тирана" in `uk` and "Tirana" in `en`
both find the Tirana option.

## Dependencies

- Epic Q closure: `src/components/ui/combobox.tsx` (canonical Combobox); `src/components/shared/
  PhoneField.tsx` (the country-code + national-number primitive — already canonical after Task
  158 / 187). Task 187 widened country codes from 13 → 45 entries.
- `messages/sq.json` / `en.json` / `uk.json` / `it.json` — phone placeholder string(s) and any
  per-locale option labels (e.g. localized city names) that the search should match against.
- The location catalog (`locations` table) — verify whether it stores per-locale names; if not,
  the search-match strategy must handle this gracefully (e.g. fold diacritics + transliteration
  table, or a single canonical name with locale-aware aliases — STOP and ask the orchestrator
  before inventing a transliteration table).

## Tasks

### Task 244 — CC.1 — Phone placeholder 9 digits across the project

**Type:** bug
**Priority:** high
**Area:** every site + admin surface that renders the phone `Combobox` / `PhoneField`

**Pre-read:** Task 158 session log (libphonenumber-js + shared PhoneField); Task 170 (phone
validation i18n); Task 187 (45 country codes); Task 188 (client-side validation); `src/components/
shared/PhoneField.tsx`; `messages/*.json` (any phone-placeholder key under nav/common/auth/
admin).
**Localization coverage:** sq, en, uk, it (placeholder × 4 — must show a 9-digit example).
**Responsive coverage:** all 7 breakpoints.

**Goal:** Every phone input across the project (registration, profile, admin user create/edit,
contact form from Epic V, anywhere else) shows a 9-digit placeholder example (e.g. `691 234 567`
or whatever the owner-approved Albanian 9-digit pattern is). Today the placeholder shows 8
digits — that's wrong.

**Acceptance criteria:**
- Every phone-input render across the project shows a 9-digit placeholder; grep proves no
  remaining 8-digit placeholder strings in `messages/*.json` or in component-level hardcoded
  fallbacks.
- Locale parity ×4; runtime locale-switch shows the placeholder updates.
- 0 new lint/typecheck errors; `npm run build` passes; 4 locales; 7 breakpoints.

**Out of scope:** changing phone validation rules (handled in Tasks 158/170/187/188); changing
country-code defaults.

### Task 245 — CC.2 — Multi-language match in searchable Comboboxes

**Type:** feature
**Priority:** medium
**Area:** every searchable Combobox — at minimum `LocationCombobox`-like usages, property-type
search, agent-company search

**Pre-read:** Task 190 session log (combobox consolidation); the canonical Combobox API in
`src/components/ui/combobox.tsx`; the locations catalog and any per-locale name columns;
`docs/ai-behavior.md` Note 14 (Global Change Verification — all searchable comboboxes ride the
same engine).
**Localization coverage:** sq, en, uk, it (the search match itself MUST work in all four locales
— this is the AC of the task).
**Responsive coverage:** all 7 breakpoints.

**Goal:** When the user is on the `uk` locale and types "Тирана" into the locations Combobox, the
Tirana option appears. When they switch to `en` and type "Tirana", same. When they type "Tiranë"
in `sq`, same. The search-match function compares user input against every locale's label for
the option (diacritic-folded, case-insensitive).

**Decision gate before coding** — investigate first, then STOP and ask the orchestrator with the
findings:
1. Does the `locations` table already store per-locale names (e.g. `name_sq`, `name_en`,
   `name_uk`, `name_it`)? If yes — use them.
2. If not — the question is whether to add columns, add a `location_aliases` child table, or
   keep a single canonical name with a static transliteration fallback. This is an architectural
   decision the orchestrator must approve; Sonnet must NOT invent it.
3. Same investigation for property types (probably already per-locale via i18n keys) and any
   other searchable catalog.

**Acceptance criteria (assuming the data path is available — kickoff will be revised after the
decision gate):**
- The canonical Combobox's search-filter function is updated ONCE (single-source — Note 14) to
  match against every available locale label for each option, diacritic-folded.
- Verified at runtime in all four locales for at least three catalogs (locations, property
  types, one other).
- Locale parity ×4; UI pre-flight at 320 in `uk` and `sq` (long strings); 7 breakpoints.
- 0 new lint/typecheck errors; `npm run build` passes.

**Out of scope:** any backend schema change beyond what the decision gate authorises;
implementing search ranking (just match/no-match is enough).

## Epic-level acceptance

Phone placeholders are correct project-wide (9 digits). Searchable Comboboxes match across all
four UI locales. The search-match function is single-source in the canonical Combobox primitive.
