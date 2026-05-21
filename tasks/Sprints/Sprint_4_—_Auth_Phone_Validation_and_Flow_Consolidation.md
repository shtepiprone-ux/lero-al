# Sprint 4 — Auth Phone Validation & Flow Consolidation

> Created 2026-05-21. Two related auth-hardening tasks discovered while auditing phone-number
> validation. Global numbering continues from the backlog (last reserved: Task 157).
>
> **Tasks in this sprint**
> - **Task 158** — Country-aware phone validation (single shared source of truth for ALL phone fields).
> - **Task 159** — Consolidate the two parallel auth flows into one (AuthSheet = canonical).
>
> **Default execution order: 158 → 159** (lower number runs first). The tasks are written to be
> safe in either order — see the "Dependency / sequencing" note inside each task.
>
> Runnable kickoff prompts (hand these to Sonnet 4.6):
> - `tasks/Sprints/Sprint_4_kickoff_prompt_Task_158.md`
> - `tasks/Sprints/Sprint_4_kickoff_prompt_Task_159.md`

---

## Background — what the audit found (read before either task)

The codebase currently has **two parallel authentication flows**, which violates the project's
single-source-of-truth principle (`docs/ai-behavior.md` → Domain Integrity / Architecture Stability /
State Management rules):

1. **AuthSheet (canonical, modern — Task 108 / Epic B.1)** — `src/modules/auth/components/AuthSheet.tsx`.
   A side drawer opened from `Header.tsx`, `MobileBottomNav.tsx`, and the global `openAuthSheet()`
   event (`src/lib/auth/authSheet.ts`). Views: `login | register | register-agent | forgot-password`.
   Phone here is a **two-field** `PhoneField` (Combobox dial code + national `Input`) validated with a
   generic `PHONE_RE` guard; uses the error-code contract; sends `location_id` / `company_id` metadata.

2. **Legacy page forms (older, never removed)** —
   - `/[locale]/auth/login` → `LoginFormClient` → `LoginForm`
   - `/[locale]/auth/register` → `RegisterFormClient` → `RegisterForm`
   `RegisterForm` has a **single plain phone `Input` with NO validation**, shows **raw Supabase error
   messages** (no error-code contract), and sends different metadata (`company_name` string, no
   `location_id`). These pages are **still live**: `/auth/login` is the `redirect()` target for every
   gated route (admin, cabinet, favorites, listings/create, listings/[slug]/edit, auth-callback fail,
   confirm-email, reset-password), and the homepage agent CTA links to `/auth/register?type=agent`
   (`src/app/[locale]/page.tsx:131`).

Result: registering an agent from the homepage uses the **old, unvalidated** form, while the header
"Register" button uses the **new, validated** drawer. Task 159 fixes the duplication; Task 158 fixes
the phone-validation source of truth (used by whatever flows exist).

Additional phone-validation duplication found (Task 158 target):

- `COUNTRY_CODES`, `parsePhone`, and a `PhoneField` component are **duplicated in 4 files**:
  `src/modules/auth/components/AuthSheet.tsx`, `src/components/admin/AdminUserCreate.tsx`,
  `src/components/admin/AdminUserProfile.tsx`, `src/modules/cabinet/components/ProfileTab.tsx`.
- The country list has **no `iso2`** — only `{ code, flag }` — so validation is dial-code-only.
- Two competing validators exist: the generic `PHONE_RE = /^\+[1-9]\d{7,14}$/` (AuthSheet + both admin
  forms) and a **hardcoded-Albania** Zod regex `/^(\+355|0)[0-9]{8,9}$/` in
  `src/modules/auth/validations/index.ts` (`registerSchema`) that is **not imported anywhere** (dead).
- `whatsapp` is a second phone-type field (admin forms + cabinet) validated with the same generic guard.
- `libphonenumber-js` is **not installed**. Package manager: **npm**. Test runner: **vitest**.

---

### Task 158 — Country-aware phone validation across ALL phone fields (single source of truth)

Type:        bug / refactor (validation hardening)
Priority:    high
Area:        Auth registration, cabinet profile, admin user create/edit — every phone & whatsapp input

Pre-read (mandatory before any code change):
1. docs/backlog.md
2. docs/ai-behavior.md (Canonical Task Template, Pre-Task Mandatory Checklist, Localization Rules,
   Domain Integrity Rules, Scope Isolation Rules, Shared Component Rules, UI Primitive Anti-Patterns)
3. Always-governed: docs/env.md, docs/rls-rules.md, docs/component-rules.md
4. Task-relevant docs:
   - docs/dependencies.md (BEFORE adding `libphonenumber-js` — follow the package-selection policy)
   - docs/data-access-rules.md (validation must run before any DB/Supabase write)
   - docs/ui-rules.md (canonical Input / Combobox / Label; no hardcoded strings)
   - docs/domain-rules.md (no Albania-only hardcoding; canonical domain model)
5. Inspect package.json for current validation/test scripts (`npm run lint`, `npm run test` = vitest,
   `npm run typecheck`, `npm run build`, `npm run governance:*`).

Localization coverage (MANDATORY):
- sq, en, uk, it — all four files in `messages/*.json`.
- Default language is Albanian (sq) — write Albanian first.
- Runtime locale switching must be visually confirmed (matching key counts is NOT sufficient).

Responsive coverage (MANDATORY — phone UI may change, esp. RegisterForm):
- 320, 375, 390, 768, 1280, 1440, 2560.
- Combobox + national input must stay usable on mobile and desktop; touch targets ≥ 44px.

Bug / Goal:
The phone field is validated with a too-generic guard, so an incomplete national number after the
selected dial code passes (e.g. AL `+355` + `693` → `+355693` is accepted but is not a complete
number). Replace this with **country-aware** validation driven by the selected country's `iso2`,
implemented **once** in a shared module and reused by every phone-entry surface. Preserve the
existing **two-field** model (dial-code Combobox + national-number Input) — do NOT switch to a single
international input.

Required investigation:
1. Map every phone/whatsapp input surface (confirmed during audit):
   - `src/modules/auth/components/AuthSheet.tsx` — `PhoneField`, `COUNTRY_CODES`, `parsePhone`,
     `PHONE_RE`; validated at `handleSubmit` before `signUp()` (~line 568).
   - `src/modules/auth/components/RegisterForm.tsx` — single plain phone `Input`, NO validation,
     calls `signUp()` directly (note: Task 159 may remove this file — see sequencing note).
   - `src/components/admin/AdminUserCreate.tsx` — rhf + zod `PHONE_RE`; `phone` + `whatsapp`; before
     `createAdminUser`.
   - `src/components/admin/AdminUserProfile.tsx` — rhf + zod `PHONE_RE`; `phone` + `whatsapp`; before
     `updateUserProfileFull`.
   - `src/modules/cabinet/components/ProfileTab.tsx` — `PhoneField`; `phone` + `whatsapp`; before the
     cabinet update action (currently performs no E.164 validation before save — confirm and fix).
   - `src/modules/auth/validations/index.ts` — dead `registerSchema` with hardcoded-Albania regex.
2. Confirm `signUp()` path: `src/lib/auth/browser.ts`; phone is passed via signUp metadata
   (`data.phone`) and applied in `/auth/callback` `ensureUserProfile()`. Validation must happen
   client-side BEFORE `signUp()` is called.
3. Confirm `libphonenumber-js` is absent in package.json before installing.

Implementation (single source of truth):
1. Create ONE canonical shared module (e.g. `src/lib/phone/index.ts` or `src/modules/auth/domain/phone.ts`):
   - `COUNTRY_CODES` as the **only** country list, each entry `{ iso2, dialCode, flag, labelKey|label }`.
     Keep the existing 13 countries: AL +355, UA +380, IT +39, GB +44, US +1, DE +49, FR +33, TR +90,
     XK +383, ME +382, BA +387, RS +381, MK +389. Add the correct `iso2` for each (AL, UA, IT, GB, US,
     DE, FR, TR, XK, ME, BA, RS, MK).
   - `validateNationalPhone({ iso2, dialCode, rawNational })` returning a discriminated result, e.g.
     `{ ok: true, e164 } | { ok: false, errorKey }`. Flow:
       a. require `iso2`, `dialCode`, and non-empty `rawNational`;
       b. reject if `rawNational` contains `+` → errorKey for "without country code";
       c. normalize visual separators (spaces, dashes, parentheses) to digits only; reject letters /
          unrelated symbols;
       d. reject if the normalized digits start with the selected dial code (without `+`) → "without
          country code" (duplicated dial code);
       e. parse/validate with `libphonenumber-js` using `iso2` (`parsePhoneNumberFromString` /
          `isValidPhoneNumber`) — this is the PRIMARY validator;
       f. produce the normalized E.164 string;
       g. final **safety guard** `^\+[1-9]\d{7,14}$` (8–15 digits, ≤ E.164 max). This guard is ONLY a
          last check, never the primary validator.
   - Export the normalize + guard helpers so tests can target them directly.
2. Make all surfaces import from this module: delete the 4 duplicated `COUNTRY_CODES`/`parsePhone`
   copies and the per-file `PHONE_RE`. Strongly prefer extracting a **single shared `PhoneField`
   component** (canonical Combobox + Input) so the iso2 logic is not re-duplicated; at minimum every
   surface must use the shared validation + shared country data.
3. Apply validation BEFORE any network/DB call in: AuthSheet (`signUp`), RegisterForm (`signUp`, if it
   still exists), AdminUserCreate (`createAdminUser`), AdminUserProfile (`updateUserProfileFull`),
   ProfileTab (cabinet update). Apply the SAME country-aware validation to `whatsapp` fields.
4. Reconcile the dead `registerSchema` Albania regex: either remove it or rewire it to the shared
   validator. It must NOT contradict the canonical model (no Albania-only hardcoding).

Localized validation messages (add to all 4 locales, reuse existing namespaces — `auth` for the
drawer/register, `admin.<...>.validation` for admin forms; keep Albanian first):
- "valid number for selected country" — repurpose/extend `auth.error_phone_invalid` (and the admin
  `validation.phone_format` equivalent) to this meaning:
  - sq: `Ju lutemi vendosni një numër telefoni të vlefshëm për shtetin e zgjedhur.`
  - en: `Please enter a valid phone number for the selected country.`
  - uk: `Введіть коректний номер телефону для вибраної країни.`
  - it: `Inserisci un numero di telefono valido per il paese selezionato.`
- new "without country code" key (e.g. `auth.error_phone_no_country_code` + admin equivalent):
  - sq: `Vendosni numrin e telefonit pa kodin e shtetit.`
  - en: `Enter the phone number without the country code.`
  - uk: `Введіть номер телефону без коду країни.`
  - it: `Inserisci il numero di telefono senza il prefisso internazionale.`
- Keep all key counts balanced across the 4 files. No hardcoded user-facing strings in components.

Tests (vitest — co-locate with the shared module, e.g. `src/lib/phone/__tests__/phone.test.ts`,
following existing patterns under `src/modules/listings/domain/*.test.ts`):
- rejects AL/+355 national `693`
- accepts AL/+355 national `691234567` and normalizes to `+355691234567`
- rejects national input containing `+`
- rejects national input that duplicates the selected dial code (e.g. `355691234567` with AL selected;
  `39…` with IT selected)
- rejects a final normalized value longer than the E.164 max (15 digits)
- validates using the selected `iso2`, not the dial code alone
- at least one non-Albania regression from the existing list (e.g. IT/+39 valid mobile → `+39…`; an
  invalid IT number is rejected)
- component/integration: invalid phone BLOCKS `signUp()` (mock `signUp`, assert NOT called); valid
  phone calls `signUp()` with the normalized E.164 value
If suitable infra is missing for any case, add the smallest reasonable coverage and document the gap
in the session log.

Accessibility (if markup changes):
- keep `Label` ↔ input association; keyboard navigation intact; error text linked to the input
  (e.g. `aria-describedby`); no new ARIA warnings.

Acceptance criteria:
- Phone input is validated as the national/local number for the selected country, everywhere.
- The country list provides `iso2` + `dialCode` from a single shared module (no duplicated copies left).
- AL/+355 with `693` fails; AL/+355 with `691234567` passes and yields `+355691234567`.
- Final value sent to `signUp()` / DB is normalized E.164.
- Input containing `+` is rejected; input duplicating the dial code is rejected.
- Invalid phone blocks `signUp()` and all DB/Supabase writes (drawer, register page, admin, cabinet).
- Same country-aware validation applied to `whatsapp` fields.
- Localized errors exist for sq/en/uk/it and switch at runtime.
- Dead Albania-only `registerSchema` regex no longer contradicts the canonical model.
- `libphonenumber-js` added via npm per docs/dependencies.md; no second phone library added.
- 0 new lint errors / 0 new warnings; `npm run typecheck` clean; `npm run build` passes.
- Relevant governance checks pass (localization; primitives/responsive if UI changed).
- vitest suite passes (new phone tests green).
- All 7 breakpoints render correctly for any changed phone UI.
- docs/backlog.md updated; session log created:
  `docs/sessions/<run-date>-task-158-country-aware-phone-validation.md`.

Dependency / sequencing:
- Default order is 158 → 159. If 158 runs first, include RegisterForm among the surfaces. If Task 159
  has already removed RegisterForm/LoginForm, skip them — apply validation to the remaining surfaces.

Out of scope:
- Do NOT redesign the signup page or replace the two-field model with a single international input.
- Do NOT implement SMS verification or OTP.
- Do NOT change the Supabase schema (phone stays a normalized E.164 string column).
- Do NOT change unrelated auth logic.
- Do NOT hardcode Albania-only validation.
- Do NOT remove valid country options (only fix broken/duplicated ones).
- Auth-flow consolidation (removing the duplicate login/register pages) belongs to **Task 159**.

---

### Task 159 — Consolidate the two auth flows into one (AuthSheet = canonical)

Type:        refactor (architecture / dedup)
Priority:    high
Area:        Auth — AuthSheet drawer vs legacy `/auth/login` & `/auth/register` page forms

Pre-read (mandatory before any code change):
1. docs/backlog.md
2. docs/ai-behavior.md (Architecture Stability Rules, Domain Integrity Rules, Scope Isolation Rules,
   Shared Component Rules, Navigation Safety Rules, UI Primitive Anti-Patterns, Localization Rules)
3. Always-governed: docs/env.md, docs/rls-rules.md, docs/component-rules.md
4. Task-relevant docs:
   - docs/architecture.md (module boundaries, single source of truth)
   - docs/ui-rules.md (canonical primitives; Sheet/Dialog usage)
   - docs/analytics-rules.md (preserve any signup/login event tracking when re-routing)
5. Inspect: `src/lib/auth/authSheet.ts`, `src/components/layout/Header.tsx`,
   `src/components/layout/MobileBottomNav.tsx`, `src/app/[locale]/auth/login/page.tsx`,
   `src/app/[locale]/auth/register/page.tsx`, `src/modules/auth/components/{Login,Register}Form*.tsx`,
   `src/app/[locale]/page.tsx` (agent CTA), and every `redirect('/auth/login…')` caller.

Localization coverage (MANDATORY):
- sq, en, uk, it. If any view text is added/moved into AuthSheet, keep all four files balanced; confirm
  runtime switching. No hardcoded strings.

Responsive coverage (MANDATORY):
- 320, 375, 390, 768, 1280, 1440, 2560 — drawer must work as the single entry point on all breakpoints.

Goal:
Make **AuthSheet the single canonical auth flow** and remove the parallel page-based forms so there is
exactly one source of truth for login and registration. The legacy `/auth/login` and `/auth/register`
pages must stop rendering their own `LoginForm` / `RegisterForm`; they should open the drawer (e.g. a
thin client page that triggers `openAuthSheet('login' | 'register')` and redirects to the appropriate
landing, preserving the `next` / `?type=agent` params), and the legacy `LoginForm`, `RegisterForm`,
`LoginFormClient`, `RegisterFormClient` components must be deleted once no longer referenced.

Required investigation:
1. Enumerate ALL entry points and deep links to the legacy pages (confirmed during audit):
   - `redirect('/auth/login?next=…')` in: admin layout, cabinet, favorites, listings/create,
     listings/[slug]/edit, auth-callback failure, confirm-email link, ResetPasswordClient.
   - homepage agent CTA `→ /auth/register?type=agent` (`src/app/[locale]/page.tsx:131`).
2. Decide how server `redirect()` callers reach the drawer (the drawer is client-side). Options to
   evaluate and document: a minimal `/auth/login` page that auto-opens the drawer and preserves `next`
   (and shows a graceful no-JS fallback), vs. routing those redirects to a destination that opens the
   drawer. Preserve Back/Forward behavior (Navigation Safety Rules) and any analytics events.
3. Verify `register-agent` parity: the homepage `?type=agent` CTA must open the drawer's
   `register-agent` view (which already collects city/company — Tasks 112/113).

Implementation:
1. Convert `/auth/login` and `/auth/register` pages to open the canonical AuthSheet (preserving `next`
   and `?type=agent`), instead of rendering legacy forms.
2. Point the homepage agent CTA at `openAuthSheet('register-agent')` (or the converted route).
3. Delete `RegisterForm`, `LoginForm`, `RegisterFormClient`, `LoginFormClient` once unreferenced; remove
   now-dead imports and any now-unused i18n keys (keep all 4 locales balanced).
4. Ensure every previously-listed `redirect()` caller lands the user on the drawer-driven flow with the
   correct post-auth `next`.

Acceptance criteria:
- Exactly one login UI and one registration UI in the app (AuthSheet); no parallel `LoginForm` /
  `RegisterForm` remain.
- All former entry points (header, mobile nav, homepage agent CTA, all gated-route redirects, confirm
  email, reset password) open the canonical drawer with the correct view and preserved `next`/`type`.
- No dead routes or broken links; Back/Forward navigation behaves correctly.
- Agent registration from the homepage now uses the same validated drawer (and thus Task 158's phone
  validation) as the header.
- 0 new lint errors / 0 new warnings; `npm run typecheck` clean; `npm run build` passes.
- governance:localization PASS (locales balanced after key removals); responsive PASS at 7 breakpoints.
- docs/backlog.md updated; session log created:
  `docs/sessions/<run-date>-task-159-auth-flow-consolidation.md`.

Dependency / sequencing:
- Default order 158 → 159. Phone-validation logic is owned by **Task 158** — reuse the shared phone
  module; do NOT reinvent validation here. If 159 runs before 158, simply ensure the surviving drawer
  is the validation home Task 158 will harden.

Out of scope:
- Do NOT change Supabase auth behavior, session handling, or the email/recovery flows (Epic D).
- Do NOT redesign the AuthSheet visual design or its views beyond what consolidation requires.
- Do NOT implement SMS/OTP.
- Do NOT alter phone-validation rules (Task 158 owns them).
