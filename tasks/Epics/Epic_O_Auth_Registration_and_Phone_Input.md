# Epic O — Auth, Registration & Phone Input

**Status:** OPEN — opened 2026-05-22 by the Opus 4.7 orchestrator. Follow-up to the (closed) Epic B / Sprint 4.
**Source notes:** issues.txt #8 (registration phone Combobox regressed to a plain text field), #9 (three local "country-code Combobox + Input" implementations; need validation for email/password/phone/WhatsApp), #13 (add all Europe/EU country codes, exclude Russia, add country search), #7 (no way back to normal registration after clicking "Register as agent").
**Kickoffs:** `Epic_O_kickoff_prompts.md` (Tasks 186–189).

> Sprint 4 (Tasks 158–159) created a shared `PhoneField` (`src/components/shared/PhoneField.tsx`,
> libphonenumber-js) and consolidated the auth flow onto `AuthSheet`. The owner reports the country-code
> Combobox has nonetheless regressed in registration to a plain text field, and that THREE local
> "Combobox + Input" phone implementations still exist. This epic finishes the consolidation, hardens
> validation, broadens country coverage, and fixes the agent-registration dead end.

## Goal

One canonical phone input used everywhere, full European/EU country coverage with search (Russia
excluded), real validation on email/password/phone/WhatsApp, and a reversible agent-registration step.

## Dependencies

- `src/components/shared/PhoneField.tsx` (canonical, from Task 158), `src/modules/auth/components/AuthSheet.tsx`,
  `src/components/shared/Combobox.tsx` (canonical Combobox — `variant`, searchable input mode).
- docs/ui-rules.md **§0** (Combobox single-source), docs/component-governance.md.

## Tasks

### Task 186 — O.1 — Consolidate the 3 phone-input implementations into the canonical PhoneField (Notes 8, 9)

**Type:** refactor / bug
**Priority:** high
**Area:** every phone & WhatsApp input (registration, cabinet profile, agent onboarding, admin)

**Pre-read:**
1. docs/backlog.md, docs/ai-behavior.md (**Global Change Verification Rule**), Task 158 session log
2. Always-governed: docs/env.md, docs/rls-rules.md, docs/component-rules.md
3. docs/ui-rules.md §0, docs/component-governance.md
4. `src/components/shared/PhoneField.tsx`, `src/modules/auth/components/AuthSheet.tsx`, and every other
   "country-code Combobox + number Input" site (grep `whatsapp`, `phone`, country code lists)

**Localization coverage:** sq, en, uk, it.
**Responsive coverage:** 320, 375, 390, 768, 1280, 1440, 2560.

**Goal:** Make `PhoneField` the ONE implementation for every phone/WhatsApp input. Remove the regressed
plain text field in registration and any other local "Combobox + Input" clones (Note 9: there are three).
After this, exactly one phone component exists (grep proves it).

**Acceptance criteria:**
- Every phone & WhatsApp input renders `PhoneField`; zero local country-code-Combobox+Input clones remain.
- Registration phone is the Combobox-based `PhoneField` again (regression fixed).
- 0 new lint/typecheck errors; `npm run build` passes; all four locales; all 7 breakpoints.

**Out of scope:** the country list contents (O.2) and validation rules (O.3) beyond wiring them in.

### Task 187 — O.2 — Full Europe/EU country codes + country search; exclude Russia (Note 13)

**Type:** feature
**Priority:** medium
**Area:** `PhoneField` country list + dropdown search

**Pre-read:** O.1; `src/components/shared/PhoneField.tsx`; `src/components/shared/Combobox.tsx` (search input).
**Localization coverage:** sq, en, uk, it (country names if shown as labels).
**Responsive coverage:** all 7 breakpoints.

**Goal:** Add all European / EU country dial codes, exclude Russia, and provide a search field in the
country dropdown (canonical Combobox search variant) for fast selection.

**Acceptance criteria:**
- Country list includes all European/EU dial codes; Russia is absent.
- The dropdown is searchable by country name/code (canonical Combobox).
- 0 new lint/typecheck errors; `npm run build` passes; all four locales; all 7 breakpoints.

**Out of scope:** validation logic (O.3).

### Task 188 — O.3 — Validation for email / password / phone / WhatsApp (Note 9)

**Type:** feature
**Priority:** high
**Area:** auth + profile form validation

**Pre-read:** O.1; `src/modules/auth/components/AuthSheet.tsx`, `src/modules/listings/validations/index.ts`,
`src/components/shared/PhoneField.tsx`; docs/component-rules.md.
**Localization coverage:** sq, en, uk, it (all error messages × 4; stable error codes server-side).
**Responsive coverage:** all 7 breakpoints (error states).

**Goal:** Validate email format, password strength/rules, and phone/WhatsApp numbers (libphonenumber-js,
country-aware) wherever those fields appear — registration, login, profile, agent onboarding.

**Acceptance criteria:**
- Invalid email/password/phone/WhatsApp are caught with localized messages (× 4 locales).
- Phone/WhatsApp validation is country-aware via the canonical PhoneField/libphonenumber-js.
- Server-side errors return stable English codes; clients localize via `t()` (per i18n rules).
- 0 new lint/typecheck errors; `npm run build` passes; all four locales; all 7 breakpoints.

**Out of scope:** country list (O.2); unrelated form fields.

### Task 189 — O.4 — Reversible agent-registration step (Note 7)

**Type:** UX
**Priority:** medium
**Area:** `AuthSheet` registration flow

**Pre-read:** `src/modules/auth/components/AuthSheet.tsx`; Epic B session logs; docs/ui-rules.md.
**Localization coverage:** sq, en, uk, it (back/normal-registration labels).
**Responsive coverage:** all 7 breakpoints.

**Goal:** If a user clicks "Register as agent" by mistake, give them a clear way back to normal
registration without closing and restarting the whole flow.

**Acceptance criteria:**
- A visible control returns the user from the agent step to standard registration, preserving any
  already-entered common fields where sensible.
- 0 new lint/typecheck errors; `npm run build` passes; all four locales; all 7 breakpoints.

**Out of scope:** phone/validation work (O.1–O.3).

## Epic-level acceptance

One canonical phone input everywhere, full European coverage with search (no Russia), validated
email/password/phone/WhatsApp, and an agent-registration step the user can back out of.
