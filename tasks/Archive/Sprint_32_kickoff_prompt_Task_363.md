### Task 363 — Phone Input numeric-only validation (reject letters & symbols)

Type:        bug (validation)
Priority:    high
Area:        `src/components/shared/PhoneField.tsx`, `src/modules/auth/validations/index.ts`, `src/components/ui/input.stories.tsx`

Pre-read (mandatory before any code change):
1. docs/agent-contract.md
2. docs/backlog.md
3. docs/rule-index.md → "Storybook / visual snapshot task": docs/storybook-governance.md, docs/component-rules.md, docs/qa-rules.md
4. docs/rule-index.md → "UI / layout / component task": docs/ui-rules.md (for the Input story)
5. docs/domain-rules.md (phone/contact rules, if any) — only the phone section.
6. Prior art: Epic O (Auth & Phone Input, Tasks 186–189) + Task 244/267 phone tests — read the relevant session logs/tests if present before changing validation, to avoid regressing existing rules (country code, length).
7. Inspect package.json validation scripts (incl. any test runner).

Localization coverage:
- sq, en, uk, it. The validation **error message** ("only digits allowed" / equivalent) must exist in all four `messages/*.json` in the same key set. Confirm via `check:i18n`.

Responsive coverage:
- 320, 375, 390, 768, 1280, 1440, 2560 — the field + inline error must render correctly, especially error wrapping at 320 uk.

Current behavior to preserve:
- `PhoneField.tsx`: existing props, country-code handling, existing length/format validation, existing label/placeholder, existing submit integration. Do NOT remove or weaken existing valid-phone rules.
- `modules/auth/validations`: existing phone schema rules (e.g. min/max length, required) stay; this task ADDS a "digits only" constraint, it does not replace the schema.
- Existing error display location/behaviour preserved.
- `input.stories.tsx`: scenario-named exports (§8b) preserved.

Bug / Goal:
- The Phone text field currently **accepts letters and symbols**. It must **prohibit letters and
  symbols and allow digits only** (plus the conventional phone affordances already supported — e.g. a
  leading `+`/country code if the current design uses one; preserve whatever is already valid). Typing
  a letter/symbol should be prevented and/or rejected with a localized validation message.

Required after behavior:
As a user filling the phone field (registration / auth / admin user create — wherever PhoneField is used):
1. Typing a digit → accepted, appears in the field.
2. Typing a letter (`a`, `я`, etc.) or disallowed symbol (`@`, `#`, space if disallowed) → **blocked** (keystroke filtered) AND/OR on blur/submit a localized error shows: "<digits-only message>" in the active locale.
3. Pasting a mixed string ("+355 ab 69-12") → sanitized to allowed characters (decide: strip to digits/`+`), per a single canonical rule documented in the validation module.
4. A valid all-digits phone → no error, submit proceeds exactly as today.
5. Error message clears once the value becomes valid.

Required investigation:
1. Read `PhoneField.tsx` — find the `onChange`/input handler; determine current sanitisation (likely none). Decide keystroke filtering (`inputMode="numeric"` + onChange strip) vs schema-only rejection — implement BOTH input-level filtering and schema validation for defense in depth, but do NOT break the country-code affordance.
2. Read `modules/auth/validations/index.ts` — find the phone zod/schema rule; add the digits-only regex with a localized message key.
3. Read existing phone tests (grep `phone` in test files) — update/extend, do NOT delete passing assertions.
4. Identify every PhoneField consumer (grep `PhoneField`) — confirm the new rule is acceptable on all of them; if any consumer needs letters (it should not) → STOP & ASK.

Acceptance criteria:
- AC1–AC5 = the five Required-after steps, each verifiable at `PhoneField.tsx`:line / `validations`:line / `input.stories.tsx`.
- New error key present in sq/en/uk/it with identical key set (`check:i18n` PASS).
- Positive + Negative flow parity in diff.
- Existing valid-phone rules + country-code + all consumers preserved.
- Tests updated/added and passing; 0 new lint/warnings; `tsc` → 0; `build` passes (non-trivial); `build-storybook` passes.
- 7 breakpoints × 4 locales for the field + error (rendered = OWNER QA REQUIRED if no browser).
- docs/domain-rules.md (phone rule) updated if a rule is codified. backlog.md updated. Session log with Note 18 block + Files Changed table.
- No `git add`/`git commit` from executor.

Positive flow (happy path):
- Actor: user on a form with PhoneField.
- Steps: (1) type "069123456" → all accepted; (2) submit → passes validation, no error; (3) value persists/normalizes as today.
- Success: valid numeric phone submits unchanged.

Negative flow:
- **Letter typed:** trigger = user types `a` → keystroke filtered (not inserted) OR rejected on blur with localized "digits only" message; NOT submitted; recover by deleting/typing digits.
- **Symbol typed:** trigger = `@`, `#`, emoji → same as above.
- **Paste mixed string:** trigger = paste "+355 ab 6912" → sanitized to allowed chars per the canonical rule; user sees cleaned value.
- **Empty / required:** trigger = empty on submit → existing required-error behaviour preserved (do not regress).
- **Too short / too long:** trigger = wrong length → existing length validation still fires (this task does not remove it).
- **Locale mismatch:** error message always shows in the active locale (verify uk).
- **Double-submit:** existing submit guard preserved; no duplicate mutation.

Out of scope:
- Do NOT change phone storage format / DB columns.
- Do NOT redesign the country-code UI.
- Do NOT touch other validations or other components.
