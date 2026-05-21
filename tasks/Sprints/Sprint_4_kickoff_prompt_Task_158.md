# Kickoff prompt — Task 158 (Sprint 4 — country-aware phone validation, single source of truth)

> Hand the fenced block below to Claude Code Sonnet 4.6.
> Companion task: Task 159 (auth-flow consolidation). Default order: 158 → 159.
> Full task record: `tasks/Sprints/Sprint_4_—_Auth_Phone_Validation_and_Flow_Consolidation.md`.
> NOTE: the live regex is already `^\+[1-9]\d{7,14}$` (not the `{5,14}` some notes mention) — it is too
> generic because it ignores the selected country's `iso2`.

---

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context:
Implement country-aware phone-number validation as a SINGLE shared source of truth, reused by every
phone-entry surface in the app. Document this as Task 158 — preserve global task numbering (do not
renumber). Companion Task 159 consolidates the duplicate auth flows; do NOT start Task 159 in this run.

The problem: the phone field is validated by a too-generic guard (`PHONE_RE = /^\+[1-9]\d{7,14}$/`)
that ignores the selected country, so an incomplete national number passes — e.g. country `+355` (AL)
+ national input `693` joins to `+355693`, which is accepted but is NOT a complete Albanian number.
Validation must be country-aware (driven by the selected country's ISO2) and must run BEFORE signUp()
or any DB/Supabase write.

Preserve the existing TWO-FIELD model everywhere: a dial-code Combobox + a national-number Input. Do
NOT switch to a single international input. The national Input must contain ONLY the local number
(no `+`, no country code, no full E.164).

Required pre-read before implementation:
1. docs/backlog.md and docs/ai-behavior.md (Canonical Task Template, Pre-Task Mandatory Checklist,
   Localization Rules, Domain Integrity Rules, Scope Isolation Rules, Shared Component Rules,
   UI Primitive Anti-Patterns).
2. Always-governed: docs/env.md, docs/rls-rules.md, docs/component-rules.md.
3. docs/dependencies.md — follow the package policy BEFORE installing libphonenumber-js (npm).
4. docs/data-access-rules.md — validation must precede any DB/Supabase write.
5. docs/ui-rules.md, docs/domain-rules.md — canonical primitives; no Albania-only hardcoding.
6. Inspect package.json (npm; `npm run lint`, `npm run test` = vitest, `npm run typecheck`,
   `npm run build`, `npm run governance:*`).

Audit facts (verify, they are the starting map):
- Two-field PhoneField + COUNTRY_CODES + parsePhone are DUPLICATED in 4 files:
  src/modules/auth/components/AuthSheet.tsx (PHONE_RE guard at handleSubmit, ~line 568, before signUp),
  src/components/admin/AdminUserCreate.tsx (rhf+zod PHONE_RE; phone + whatsapp; before createAdminUser),
  src/components/admin/AdminUserProfile.tsx (rhf+zod PHONE_RE; phone + whatsapp; before updateUserProfileFull),
  src/modules/cabinet/components/ProfileTab.tsx (PhoneField; phone + whatsapp; before the cabinet update action).
- COUNTRY_CODES currently has only { code, flag } — NO iso2. The 13 countries:
  AL +355, UA +380, IT +39, GB +44, US +1, DE +49, FR +33, TR +90, XK +383, ME +382, BA +387, RS +381, MK +389.
- A 5th surface: src/modules/auth/components/RegisterForm.tsx (the /auth/register page) has a SINGLE
  plain phone Input with NO validation and calls signUp() directly. Add the shared validation here too.
  (Task 159 may later delete this file — if it is already gone, skip it.)
- Dead competing validator: src/modules/auth/validations/index.ts `registerSchema` uses a hardcoded
  Albania regex /^(\+355|0)[0-9]{8,9}$/ and is imported nowhere. Remove it or rewire it to the shared
  validator — it must not contradict the canonical model.
- libphonenumber-js is NOT installed. Phone is passed via signUp metadata (data.phone) and applied in
  /auth/callback ensureUserProfile(); signUp lives in src/lib/auth/browser.ts.

Implementation — single source of truth:
1. Create ONE shared module (e.g. src/lib/phone/index.ts):
   - COUNTRY_CODES as the ONLY country list; each entry { iso2, dialCode, flag, label|labelKey }. Add
     the correct iso2 for each of the 13 countries (AL, UA, IT, GB, US, DE, FR, TR, XK, ME, BA, RS, MK).
   - validateNationalPhone({ iso2, dialCode, rawNational }) -> { ok: true, e164 } | { ok: false, errorKey }:
     a) require iso2, dialCode, non-empty rawNational;
     b) reject if rawNational contains "+" -> "without country code" errorKey;
     c) normalize visual separators (spaces, dashes, parentheses) to digits only; reject letters/symbols;
     d) reject if normalized digits start with the selected dial code without "+" -> "without country code";
     e) PRIMARY validation: parse with libphonenumber-js using iso2 (parsePhoneNumberFromString /
        isValidPhoneNumber);
     f) produce normalized E.164;
     g) FINAL safety guard ^\+[1-9]\d{7,14}$ (8-15 digits, <= E.164 max) — last check only, never primary.
   - Export the normalize + guard helpers for direct unit testing.
2. Make ALL surfaces import from this module: delete the 4 duplicated COUNTRY_CODES/parsePhone copies and
   the per-file PHONE_RE. Strongly prefer extracting a SINGLE shared PhoneField component (canonical
   Combobox + Input) so iso2 logic is not re-duplicated; at minimum every surface uses the shared
   validation + shared country data. Audit all consumers before changing the shared pieces.
3. Apply validation BEFORE any network/DB call in: AuthSheet (signUp), RegisterForm (signUp, if present),
   AdminUserCreate (createAdminUser), AdminUserProfile (updateUserProfileFull), ProfileTab (cabinet
   update). Apply the SAME country-aware validation to whatsapp fields.

Localization (all 4 locales, Albanian first; reuse namespaces — auth for drawer/register, the admin
validation namespace for admin forms; keep key counts balanced; no hardcoded strings):
- "valid number for selected country" (repurpose auth.error_phone_invalid + admin equivalent):
  sq: Ju lutemi vendosni një numër telefoni të vlefshëm për shtetin e zgjedhur.
  en: Please enter a valid phone number for the selected country.
  uk: Введіть коректний номер телефону для вибраної країни.
  it: Inserisci un numero di telefono valido per il paese selezionato.
- "without country code" (new key, e.g. auth.error_phone_no_country_code + admin equivalent):
  sq: Vendosni numrin e telefonit pa kodin e shtetit.
  en: Enter the phone number without the country code.
  uk: Введіть номер телефону без коду країни.
  it: Inserisci il numero di telefono senza il prefisso internazionale.

Tests (vitest, co-locate with the module, e.g. src/lib/phone/__tests__/phone.test.ts; mirror existing
patterns in src/modules/listings/domain/*.test.ts):
- rejects AL/+355 national 693
- accepts AL/+355 national 691234567 and normalizes to +355691234567
- rejects national input containing "+"
- rejects national input duplicating the selected dial code (e.g. 355691234567 with AL; 39… with IT)
- rejects a final normalized value longer than 15 digits
- validates via iso2, not the dial code alone
- at least one non-Albania regression (e.g. IT/+39 valid mobile -> +39…; an invalid IT number rejected)
- integration: invalid phone BLOCKS signUp() (mock signUp, assert NOT called); valid phone calls signUp()
  with the normalized E.164 value
If infra is missing for any case, add the smallest reasonable coverage and note the gap in the session log.

Responsive (if phone UI changes, esp. RegisterForm): verify 320, 375, 390, 768, 1280, 1440, 2560;
touch targets >= 44px; Combobox + Input usable on mobile and desktop.

Accessibility (if markup changes): keep Label<->input association, keyboard nav, error text linked to the
input (aria-describedby); no new ARIA warnings.

Acceptance criteria:
- Country-aware validation of the national number for the selected country, on every surface.
- Single shared module provides iso2 + dialCode + validate/normalize; no duplicated COUNTRY_CODES left.
- AL/+355 + 693 fails; AL/+355 + 691234567 passes -> +355691234567.
- Final value to signUp()/DB is normalized E.164; "+" input rejected; duplicated dial code rejected.
- Invalid phone blocks signUp() and all DB/Supabase writes (drawer, register page, admin, cabinet);
  same validation on whatsapp.
- Localized errors for sq/en/uk/it switch at runtime; dead Albania-only registerSchema no longer
  contradicts the canonical model.
- libphonenumber-js added via npm per docs/dependencies.md; no second phone library.
- 0 new lint errors / 0 new warnings; npm run typecheck clean; npm run build passes; vitest green.
- Relevant governance checks pass (localization; primitives/responsive if UI changed).
- docs/backlog.md updated; session log: docs/sessions/<run-date>-task-158-country-aware-phone-validation.md.
- Commit + push when green.

Out of scope:
- No signup-page redesign; keep the two-field model (no single international input).
- No SMS verification; no OTP.
- No Supabase schema change (phone stays a normalized E.164 string).
- No unrelated auth-logic changes; no Albania-only hardcoding; do not remove valid country options.
- Auth-flow consolidation (removing duplicate login/register pages) = Task 159; do NOT do it here.

Follow every rule in docs/ai-behavior.md. Do not skip the Pre-Task Mandatory Checklist.
```
