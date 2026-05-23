# Epic O — kickoff prompts (Auth, Registration & Phone Input)

> Tasks 186–189. Shared hard contract for every prompt: no scope change; no invented architecture (stop &
> ask if ambiguous); literal AC; update docs/backlog.md + docs/sessions/; 0 new lint/typecheck errors;
> governance PASS; locale parity sq/en/uk/it; responsive 320/375/390/768/1280/1440/2560 where UI; Global
> Change Verification Rule; commit + single `git add -A` then `git log -1` (owner runs git/SQL).
> Canonical references: `src/components/shared/PhoneField.tsx` (from Task 158),
> `src/components/shared/Combobox.tsx` (canonical Combobox), `src/modules/auth/components/AuthSheet.tsx`,
> docs/ui-rules.md §0.

## Task 186 — O.1 — Consolidate the 3 phone-input implementations into PhoneField (Notes 8, 9)

```
You are Claude Code Sonnet 4.6 working in `lero-al`.
Hard contract: (see top). This is consolidation only — country list contents (187) and validation rules
(188) are separate, only wire them where they already exist. Global Change Verification Rule: there must
be ONE phone component after this (grep proves it).

Pre-read: src/components/shared/PhoneField.tsx; src/modules/auth/components/AuthSheet.tsx; grep `phone`,
`whatsapp`, country-code lists across src/ to find all "country-code Combobox + number Input" sites
(Note 9 says there are three); Task 158 session log; docs/ui-rules.md §0; docs/component-governance.md.

Scope: make PhoneField the single implementation for every phone & WhatsApp input. Remove the regressed
plain text field in registration (Note 8) and any local Combobox+Input clones. Delete dead clones.

Acceptance criteria:
- Every phone/WhatsApp input renders PhoneField; zero local country-code-Combobox+Input clones remain.
- Registration phone is the Combobox-based PhoneField again (regression fixed).
- 0 new lint/typecheck errors; npm run build passes; all four locales; all 7 breakpoints.

Out of scope: country list (187), validation logic (188).
```

## Task 187 — O.2 — Full Europe/EU country codes + country search; exclude Russia (Note 13)

```
You are Claude Code Sonnet 4.6 working in `lero-al`.
Hard contract: (see top). Depends on Task 186 (single PhoneField).

Pre-read: src/components/shared/PhoneField.tsx (country list source); src/components/shared/Combobox.tsx
(searchable input variant); docs/ui-rules.md §0.

Scope: add all European/EU country dial codes; EXCLUDE Russia; make the country dropdown searchable by
country name/code via the canonical Combobox.

Acceptance criteria:
- Country list includes all European/EU dial codes; Russia absent; dropdown searchable.
- 0 new lint/typecheck errors; npm run build passes; all four locales; all 7 breakpoints.

Out of scope: validation (188); the consolidation itself (186).
```

## Task 188 — O.3 — Validation for email / password / phone / WhatsApp (Note 9)

```
You are Claude Code Sonnet 4.6 working in `lero-al`.
Hard contract: (see top). Phone/WhatsApp validation must be country-aware via PhoneField/libphonenumber-js.
Server errors return stable English codes; clients localize via t() (docs/ai-behavior.md i18n rules).

Pre-read: src/modules/auth/components/AuthSheet.tsx; src/components/shared/PhoneField.tsx;
src/modules/listings/validations/index.ts; docs/component-rules.md.

Scope: validate email format, password rules, and phone/WhatsApp numbers wherever those fields appear
(registration, login, profile, agent onboarding). Localized error messages × 4.

Acceptance criteria:
- Invalid email/password/phone/WhatsApp caught with localized messages × 4; phone/WhatsApp country-aware.
- Server-side stable error codes; client localization via t().
- 0 new lint/typecheck errors; npm run build passes; all four locales; all 7 breakpoints.

Out of scope: country list (187); unrelated form fields.
```

## Task 189 — O.4 — Reversible agent-registration step (Note 7)

```
You are Claude Code Sonnet 4.6 working in `lero-al`.
Hard contract: (see top).

Pre-read: src/modules/auth/components/AuthSheet.tsx (registration/agent step); Epic B session logs;
docs/ui-rules.md.

Scope: add a clear control to return from the "Register as agent" step to standard registration without
closing/restarting the whole flow; preserve already-entered common fields where sensible.

Acceptance criteria:
- A visible control returns the user from the agent step to standard registration.
- 0 new lint/typecheck errors; npm run build passes; all four locales; all 7 breakpoints.

Out of scope: phone/validation work (186-188).
```
