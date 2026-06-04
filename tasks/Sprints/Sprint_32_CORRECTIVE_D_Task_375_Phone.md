### Task 375 — CORRECTIVE D: Canonical Europe/EU PhoneField validation hardening (country-code Combobox + national input + schema + tests + placeholders)

> # 🔴 OWNER P0 — Canonical phone validation rule for supported Europe/EU countries, excluding Russia and Belarus.
> The PhoneField must support product-supported European / EU country phone formats through the existing country-code
> Combobox + national-input model. Russia and Belarus are explicitly excluded from selectable country options.
>
> This task is NOT Albania-only.
> Albania remains a mandatory regression/stress case because the original defect was observed there, but the canonical
> rule must apply to every supported European / EU country using country metadata / libphonenumber behavior.
>
> # 🔴 OWNER P0 — Mobile <640 full-width gate (2026-06-03, agent-contract clauses 11–12).
> At <640 the PhoneField (country-code Combobox + national input) and any submit/action button in the phone form are
> full-width (`max-sm:w-full`), ≥44px, error/validation/helper messages wrap (sq/en/uk/it), no h-scroll at 320.
> If the country-code Combobox popup uses Select/Combobox, it follows the full-width bottom-sheet rule from Task 379.
> Required to close: rendered matrix breakpoints(320..2560) × locales(sq/en/uk/it), uk@320/375/390 mandatory;
> tsc/build is NOT proof.

> **Execution order (Sprint 32 correctives) — REVISED 2026-06-03 (owner): `372 (incl. folded 378) → 373 → 379 → 374 → 375 → 376 → 377`, strictly sequential.** Sent to Sonnet one at a time; each starts only after the previous is implemented AND orchestrator diff-reviewed/approved. **377 is the FINAL certification sweep** (runs only after 372–376 AND 379 all land), never a parallel task. **375 runs after 374** (the country-code Combobox popup already follows the Task 379 bottom-sheet pattern).

Type:      corrective bugfix — phone validation / canonical country metadata rule
Priority:  CRITICAL
Area:      src/components/shared/PhoneField.tsx · src/lib/phone/index.ts · src/lib/phone/__tests__/phone.test.ts ·
           country-code option source / phone metadata helpers discovered by grep · messages/{en,sq,uk,it}.json ·
           src/components/ui/input.stories.tsx · server/action phone validation

## Owner rejection context

Previous implementation only partially sanitized characters and relied too much on submit-time validation. It did not
establish a canonical PhoneField rule for the real product model:

- the country code is selected separately in a country-code Combobox;
- the text input should collect the national phone value for the selected country;
- users may type national format, local domestic format, or paste a full international number;
- validation must be country-specific, not a single hardcoded length;
- placeholders/helper text must show the user what to enter;
- client and server validation must match;
- supported scope is European / EU countries, excluding Russia and Belarus.

The earlier Albania example (`68 123 45 67`, `+355`) is only one regression/stress example, not the full scope.

## Required pre-read

`docs/agent-contract.md` · `docs/backlog.md` · `docs/domain-rules.md` · `docs/data-access-rules.md` · `docs/qa-rules.md`
· `docs/ui-rules.md` · Task 379 session log · session log `docs/sessions/2026-06-02-task-363-*`.

## Current behavior to investigate

Before editing, inspect and record current behavior in the session log:

- where the country-code Combobox options are defined;
- which countries are currently selectable;
- whether Russia (`RU`, `+7`) or Belarus (`BY`, `+375`) are currently selectable;
- how `PhoneField.tsx` stores national input value;
- how E.164 output is built;
- how `validateNationalPhone` works;
- which server/actions call phone validation or persist phone values;
- whether placeholders are static or country-specific;
- how stories demonstrate PhoneField behavior.

Known broken behavior from previous task context:

- `shared/PhoneField.tsx` sanitizes only partly and can allow spaces/dashes/unlimited input depending on path.
- `lib/phone/index.ts` currently has a broad E.164 guard and does not define the canonical selected-country model.
- `messages/*.json` may contain placeholder text that repeats the dial code even though the dial code is selected separately.
- Validation is not consistently enforced at both client and server/action level.
- Tests do not prove country-specific normalization across the supported Europe/EU scope.

## 🔴 Scope policy — supported Europe/EU countries, excluding Russia and Belarus

This task covers every country currently supported by the project’s country-code Combobox that belongs to the product’s
European / EU phone scope, excluding Russia and Belarus.

Canonical scope rules:

1. **This task is NOT Albania-only.**
   Albania is a mandatory regression/stress case, but not the only country covered.

2. **Russia and Belarus are excluded.**
   Russia (`RU`, `+7`) and Belarus (`BY`, `+375`) must not be selectable country-code options. If they exist in the current
   country list, remove or disable them according to the existing project country-option architecture. Do not leave them
   available in the Combobox.

3. **Do not invent a random new country list silently.**
   First inventory the current country-code option source and phone metadata source. If the project already has a canonical
   supported-country list, use that as the source of truth and remove/exclude RU/BY. If no single source exists and creating
   one is necessary to enforce this rule, create the smallest single-source helper needed and document it in the session log.
   If there is ambiguity about whether a country should be included in the Europe/EU scope, STOP&ASK instead of guessing.

4. **Validation is selected-country metadata-driven.**
   The selected country-code Combobox value is the source of truth for parsing, normalization, validation, placeholder
   examples and E.164 output.

5. **Do not hardcode one global phone length.**
   Do NOT force all countries to 9 digits. Do NOT hardcode Albania-specific `+355`, `00355`, `355`, `68`, or leading-`0`
   behavior globally. Country-specific length, prefix, trunk-prefix and significant-leading-zero behavior must come from
   the existing phone helper / libphonenumber metadata / project metadata for the selected country.

6. **Domestic trunk prefix handling is country-specific.**
   Some countries use a domestic trunk prefix such as leading `0`; some preserve leading zero as significant; some do not.
   Strip or preserve domestic prefix only according to selected-country metadata. Do not implement a blind global
   “remove leading 0” rule.

7. **Mismatched full international paste must not silently change country.**
   If the user selected one country in the Combobox but pastes a full international number for a different country, reject
   with a localized country-mismatch error or require the user to change the selected country. Do not silently change the
   Combobox country and do not store a number under the wrong selected country.

## Required after behavior

- **Phone input model (separate country-code Combobox):**
  The country code is selected by a separate country-code Combobox. The text input stores and validates only the national
  phone value for the selected country. The stored national value must never duplicate the selected country code.

- **Canonical stored/output model:**
  For every supported selected country:
  - stored national value = canonical national value for that selected country, as accepted by the phone helper/metadata;
  - output E.164 = selected country calling code + canonical national value;
  - the stored national input must round-trip into a valid E.164 number for the selected country;
  - no `+`, no country calling code, and no visual separators are stored inside the national input value.

- **Visible user guidance:**
  Because the country code is selected separately, the national input must clearly show what the user should type.
  Placeholder/helper text must be national-only and country-specific. It must not repeat the selected dial code.
  Examples:
  - AL selected: show a national-only example such as `68 123 45 67` or a metadata-derived equivalent; do not show `+355`.
  - Other supported countries: show a national/local example appropriate for that selected country, derived from metadata
    or the existing project country config.
  Helper text must make clear that the country code is already selected separately.

- **Input-level filtering:**
  The national input accepts numeric input and blocks/sanitizes letters, Cyrillic and unsupported symbols. Visual separators
  may be accepted only if the current UX intentionally formats them, but the stored value remains canonical digits/national
  value only. Do not allow arbitrary symbols into stored state.

- **Typing behavior:**
  While typing, enforce selected-country constraints without breaking normal editing:
  - invalid letters/symbols do not enter stored value;
  - max length/cap behavior follows selected-country metadata;
  - if the country supports a domestic trunk prefix in user-entered national format, handle it according to selected-country
    metadata, not through hardcoded global leading-zero stripping;
  - caret/mid-string edits must keep stored value valid/sanitized;
  - IME/composition/autofill events are sanitized the same way as normal input.

- **Paste/autofill normalization:**
  On paste/autofill into the national input:
  1. Parse the pasted value against the selected country.
  2. Strip visual separators such as spaces, dashes, parentheses, non-breaking spaces, newline/tab where safe.
  3. If the pasted value is a full international number matching the selected country calling code, normalize it to the
     selected country’s canonical national value and store only that national value.
  4. If the pasted value is a domestic/local number, normalize trunk prefix according to selected-country metadata.
  5. If the pasted value belongs to a different country than the selected Combobox value, localized reject / mismatch error.
  6. If the pasted value is too short / too long / impossible for the selected country after normalization, localized reject
     or in-progress validation state according to existing UX rules.
  7. Do NOT silently truncate a pasted overlong number into a valid-looking number.

- **Albania regression/stress behavior:**
  With AL selected, Albania must follow its selected-country metadata/project rule:
  - national value is exactly the valid AL national number length according to metadata/project rule;
  - examples such as `68 123 45 67`, `69 123 45 67`, `67 123 45 67` are examples only, not a hardcoded operator list;
  - pasting `+355 ...`, `00355 ...`, or `355 ...` with AL selected normalizes to the same AL national value if valid;
  - local-format leading trunk `0`, if valid by AL metadata/project rule, normalizes correctly;
  - overlong AL paste after normalization is rejected, not silently truncated.

- **Russia / Belarus exclusion:**
  RU and BY must not be selectable in the country-code Combobox. If a pasted full international number is Russian or
  Belarusian, it must not be accepted under any selected country. Use a localized unsupported-country / invalid-country
  error if such an error key exists; otherwise add parity keys in sq/en/uk/it.

- **Validation:**
  Client-side validation and server/action validation must enforce the same selected-country rules:
  - required/empty;
  - too short;
  - too long;
  - impossible/invalid for selected country;
  - unsupported country;
  - mismatched pasted country code;
  - letters/symbols/Cyrillic blocked or rejected;
  - valid E.164 output only when selected country + national value match metadata.

- **Schema/server guard:**
  Server/action validation must not trust the client. Locate and align every server/action/schema path that receives or
  persists phone values.

- **Locale parity:**
  All changed placeholder/helper/error strings must exist in sq/en/uk/it. No English fallback leak in sq/uk/it.

## Exact files to inspect

Inspect at minimum:

- `src/components/shared/PhoneField.tsx`
- `src/lib/phone/index.ts`
- `src/lib/phone/__tests__/phone.test.ts`
- `messages/{en,sq,uk,it}.json`
- `src/components/ui/input.stories.tsx`
- country-code Combobox / wrapper / option source discovered by:
  `rg "country" src/components src/lib src/modules`
  `rg "dial" src/components src/lib src/modules`
  `rg "phone" src/components src/lib src/modules`
  `rg "validateNationalPhone" src`
- server/action phone validation and persistence paths in:
  `modules/auth`
  `modules/admin`
  `modules/cabinet`

## Exact files allowed to edit

Allowed:

- `src/components/shared/PhoneField.tsx`
- `src/lib/phone/index.ts`
- `src/lib/phone/__tests__/phone.test.ts`
- country-code option source / phone metadata helper discovered by grep, only as needed for canonical Europe/EU scope and RU/BY exclusion
- server/action files that call phone validation or persist phone values
- Zod/schema guards that validate phone values
- `messages/{en,sq,uk,it}.json`
- `src/components/ui/input.stories.tsx`
- `docs/domain-rules.md`
- `docs/ui-rules.md`
- `docs/backlog.md`
- new session log under `docs/sessions/`

Do not edit unrelated runtime files. If enforcing the Europe/EU country scope requires a broad country-list redesign beyond
a small single-source helper / option-source correction, STOP&ASK.

## Current behavior to preserve

- Separate country-code Combobox model.
- Multi-country support.
- E.164 output contract.
- Existing call sites: AuthSheet, RegisterForm, AdminUserCreate, AdminUserProfile, cabinet.
- Existing non-phone business logic.
- Existing UI layout except for required mobile full-width and helper/placeholder improvements.
- Existing validation behavior where already correct by metadata.

## Positive flow

1. User selects a supported country in the country-code Combobox.
2. Placeholder/helper shows a national-only example appropriate for the selected country and does not repeat the dial code.
3. User types a valid national/local number for that selected country → stored as canonical national value.
4. Output E.164 combines selected dial code + canonical national value.
5. User pastes a full international number matching the selected country → country code is stripped, only canonical national value is stored.
6. User submits valid selected-country phone → client and server validation pass.
7. At <640, the country-code Combobox, national input and submit/action buttons are full-width, ≥44px, wrap labels/errors, no h-scroll.

## Negative flow

- Empty phone → localized required error.
- Too short for selected country → localized too-short error.
- Too long for selected country → localized too-long/invalid error; no silent truncation of pasted overlong values.
- Letters/symbols/Cyrillic → blocked or sanitized/rejected; never stored as phone value.
- Full international paste for a different country than selected → localized mismatch/invalid-country error; no silent country switch.
- RU/BY selected → impossible because RU/BY are not selectable.
- RU/BY full international number pasted → localized unsupported-country/invalid-country error.
- Domestic trunk prefix behavior → handled by selected-country metadata; no blind global leading-zero removal.
- IME/composition/autofill → sanitized consistently.
- Locale switch → placeholders/helpers/errors localized in sq/en/uk/it.
- Mobile 320 → no horizontal overflow; helper/error text wraps.

## Acceptance criteria

- AC1 Country-code options are inventoried in the session log. The inventory identifies the option source, every currently supported country, and confirms RU/BY are absent or removed/disabled. Any ambiguous Europe/EU inclusion is STOP&ASK'd, not guessed.

- AC2 PhoneField uses the selected country-code Combobox value as the source of truth for parsing, normalization, validation, placeholder/helper example and E.164 output. National input stores only the canonical national value; it never stores duplicated country code or visual separators.

- AC3 Validation is metadata-driven per selected country. There is no hardcoded global digit length and no hardcoded AL-only rule applied to other countries. Albania remains covered as a mandatory regression/stress case, but not as the only supported country.

- AC4 Input-level filtering blocks/sanitizes letters, Cyrillic and unsupported symbols; IME/composition/autofill paths are sanitized too. Stored value cannot contain invalid characters.

- AC5 Paste/autofill handling parses against the selected country:
  matching international country code → normalize to national value;
  domestic/local number → normalize according to selected-country metadata;
  mismatched international country code → localized reject/mismatch;
  overlong pasted value → localized reject, not silent truncation;
  RU/BY numbers → localized unsupported/invalid reject.

- AC6 Placeholder/helper text is national-only, country-specific, and localized in sq/en/uk/it. It does not repeat the selected dial code. AL examples such as `68 123 45 67` are examples only; no operator prefix such as `68` is hardcoded as the only valid case.

- AC7 Server/action/schema validation enforces the same selected-country rules as the client and produces/accepts only valid E.164 output for supported countries. No client-only trust.

- AC8 Tests cover:
  country-option inventory / RU-BY exclusion;
  at least one valid + invalid case for every supported country if feasible through generated metadata examples, OR a documented representative matrix if exhaustive per-country generated examples are not available;
  representative countries with different national lengths/patterns;
  countries with domestic trunk prefix behavior;
  at least one country where leading zero must be preserved if present in supported metadata;
  Albania regression/stress cases including full `+355` / `00355` / `355` paste and valid AL national examples with different valid prefixes;
  mismatched full international paste vs selected country;
  RU/BY full-number paste rejected;
  letters/symbols/Cyrillic;
  whitespace/nbsp/newline-tab;
  IME/composition insert;
  mid-string insert;
  server/client validation parity.
  All phone tests pass.

- AC9 Mobile rendered matrix is complete for the PhoneField story/surface: sq/en/uk/it × 320·375·390·480·560·680·768·810·960·1024·1200·1440·1920·2560. At <640, country-code Combobox, national input, helper/error text and submit/action buttons are full-width/≥44px/wrap/no h-scroll. The country-code popup follows Task 379 bottom-sheet behavior.

- AC10 Locale parity passes: all new/changed helper/error/placeholder keys exist in sq/en/uk/it; no English leak in sq/uk/it.

## Grep / inventory gates

Final report must include raw output and triage for:

- country option source discovery:
  rg "country" src/components src/lib src/modules
  rg "dial" src/components src/lib src/modules
  rg "phone" src/components src/lib src/modules

- validation source discovery:
  rg "validateNationalPhone" src
  rg "phone" src/modules/auth src/modules/admin src/modules/cabinet

- RU/BY exclusion checks:
  rg "Russia|Russian|\\bRU\\b|\\+7|Belarus|Belarusian|\\bBY\\b|\\+375" src messages

- hardcoded AL-only guard:
  rg "\\+355|00355|\\b355\\b|681234567|68 123" src/components src/lib src/modules

Any hits must be triaged:
- allowed only in tests, examples, AL regression cases, or localized copy where explicitly intended;
- forbidden if they implement global AL-only behavior.

## Out of scope

- New phone provider integration.
- Auto-detecting and silently changing the selected country based on pasted number.
- Supporting Russia or Belarus.
- Adding non-European/non-EU countries beyond the product-supported scope.
- Changing unrelated auth/admin/cabinet behavior.
- Changing settlement/multilingual business features.
- Redesigning the entire PhoneField UI beyond validation, helper text, mobile full-width compliance and country-code option correctness.
- Hardcoding a new geopolitical country list without inventorying the current project source and documenting the decision.

## Required validation

Run:

- `npx tsc --noEmit`
- `npm run lint`
- `npm run check:i18n`
- `npm run build-storybook`
- `npm test` or the project’s targeted phone test command if narrower and documented
- grep / inventory gates above
- AC self-audit
- rendered matrix

If any command cannot be run, final report must state why. Not-run never counts as PASS.

## Manual QA checklist (OWNER QA REQUIRED, but Sonnet must provide its own evidence)

Locales: sq/en/uk/it.
Breakpoints: 320·375·390·480·560·680·768·810·960·1024·1200·1440·1920·2560.
Mandatory stress cells: uk@320/375/390.

For PhoneField story/surface:

- open country-code Combobox at <640 and verify Task 379 bottom-sheet behavior;
- verify RU/BY are not selectable;
- select several supported countries with different phone formats;
- verify placeholder/helper changes per selected country and does not repeat the dial code;
- type valid national/local examples;
- type too short / too long values;
- type letters/symbols/Cyrillic;
- paste full international number matching selected country;
- paste full international number mismatching selected country;
- paste RU/BY full number;
- verify E.164 output where visible/logged;
- verify error/helper text in sq/en/uk/it;
- verify no h-scroll at 320.

## Required Sonnet evidence format

Sonnet must NOT mark any rendered/manual QA cell PASS unless Sonnet personally rendered or inspected that cell.
"OWNER QA REQUIRED" means the owner may additionally audit — it does not replace Sonnet's own evidence.
A cell that was not checked = `NOT CHECKED`, and the task is incomplete.
`tsc`/`lint`/`build-storybook` are baseline checks only; they do not replace rendered/manual verification.

Final report must include:

1. **AC self-audit table**
   AC# · requirement · implementation evidence (file:line) · verification evidence (command output / rendered matrix cell / grep output / test result) · status PASS/FAIL/NOT CHECKED.

2. **Command transcript**
   exact command · exit code · short result. If command was not run, explicit reason. Not-run never counts as PASS.

3. **Country inventory**
   country option source · supported countries · RU/BY status · any ambiguity / STOP&ASK.

4. **Grep gates**
   exact grep command · raw output · triage table.

5. **Rendered evidence matrix**
   surface/story · locale · viewport · selected country · interaction performed · expected result · observed result · evidence reference · PASS/FAIL/NOT CHECKED.

6. **Tests**
   test file · cases added/updated · command run · pass/fail · failure output if any.

7. **STOP&ASK log**
   every ambiguity found · whether work stopped · what was left unchanged because it was out of scope.

A task is incomplete if any required AC or required rendered cell is marked NOT CHECKED.

## Final report requirements

Return:

- before/after behavior table;
- country inventory and RU/BY exclusion proof;
- AC table with file:line;
- test list + results;
- locale parity proof;
- server-guard file:line;
- grep outputs + triage;
- rendered matrix;
- Files Changed table;
- STOP&ASK items.

NO `git add`/`commit`.