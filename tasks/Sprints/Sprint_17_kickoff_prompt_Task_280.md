# Sprint 17 — Task 280 kickoff (Unify all phone country-code comboboxes into one global European selector)

> **Mandatory rules — non-negotiable:**
>
> - `docs/agent-contract.md` **clause 6a** (Positive + Negative flow gate, Task 255).
> - `docs/agent-contract.md` **clause 10** + `CLAUDE.md` "Commit hand-off" + `docs/ai-behavior.md` "Commit Rules" (Task 264). Sonnet MUST include a "Files Changed" table in the session log. Sonnet MUST NOT emit `git add` / `git commit` commands.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 working in `lero-al`. Read `docs/agent-contract.md` FIRST. Pre-read per `docs/rule-index.md` — **"UI / layout / component" + "Profile / edit-flow" bundle** (mixed). No scope change; STOP & ASK if ambiguous; literal AC; self-validate; UI task → ×4 locales + 7 breakpoints. Owner runs git; executor never runs git.

> **Precondition for Task 282 (Design System Lockdown).** This task
> consolidates the most-violated local-copy UI surface — phone country-
> code combobox — into one shared component using one canonical data
> source. The Design System Lockdown work later builds on this
> consolidation pattern.

---

## Task 280 — Unify phone country-code combobox into one global European selector

```
Hard contract: see top.

Type:        fix + refactor (UI consolidation)
Priority:    high (precondition for Task 282 Design System Lockdown)
Area:        auth / registration / profile / admin / shared UI / combobox / country data

GOAL: Eliminate every local-copy phone country-code combobox in the
project. After this task, exactly ONE shared `<PhoneCountryCodeCombobox>`
component sources from exactly ONE canonical European country/calling-
code data file, and is consumed everywhere a phone country code can be
selected (public site + admin).

Owner-flagged symptoms (issues.txt 2026-05-28 §7):
- Registration phone country-code combobox does NOT match the
  previously-fixed phone country-code selector elsewhere.
- Default is `+355` Albania only; missing European countries.
- No search inside the dropdown.
- Strong signal that registration is using a local copy / hardcoded
  array / separate combobox implementation.
- Russia and Belarus MUST NOT be available anywhere.

Required after-state:
- One shared `<PhoneCountryCodeCombobox>` component.
- One canonical data source (file with the 43-country European list).
- Used by registration, agent registration, profile/contact phone
  edit, admin user/agent/contact phone edit, any other phone form.
- Search input inside the dropdown (by country name, +CODE, CODE, ISO).
- Russia + Belarus absent.

Filed by: orchestrator (Opus 4.7) on 2026-05-28 from owner-uploaded
issues.txt §7. Precondition for Task 282 (Design System Lockdown).

Pre-read (UI + Profile/edit-flow bundle from docs/rule-index.md):
- docs/agent-contract.md  (always)
- docs/backlog.md         (always)
- docs/ui-rules.md        → input + combobox patterns; canonical
                             selection components.
- docs/component-rules.md → reusable component standards; locale rules;
                             no hardcode in components.
- docs/qa-rules.md
- docs/ai-behavior.md → Note 14 (Global Change Verification —
                        applies because this is a repo-wide migration),
                        Note 19 (UX Flow Preservation), Note 20
                        (Existing-Control Preservation — every phone
                        input keeps its surrounding controls/labels/
                        validations).
- docs/integrations.md → phone validation policy.
- src/components/shared/PhoneField.tsx — current shared component
  (Task 187 added 45 European countries; Task 244 fixed placeholder;
  Task 267 added 9-digit Albanian tests).
- src/components/shared/Combobox.tsx — canonical Combobox primitive
  (Task 190).
- src/lib/phone/index.ts — normalization + validation helpers.
- Task 187 session log — for the European country codes already-added
  (read first; verify the canonical data file path).
- All registration/auth/profile/admin surfaces that contain a phone
  input (inventory required — see Required investigation below).

Current behavior to preserve:
- `<PhoneField>` (or whatever the existing shared component is called)
  keeps its layout: country-code combobox on the left + local phone
  number input on the right (Task 187 layout).
- Phone normalization helpers from `src/lib/phone` — UNCHANGED.
- Phone validation (Task 244 + Task 267 — 9-digit Albanian + general
  European) — UNCHANGED in semantics; may be UPDATED if it currently
  hardcodes a country list separately from the combobox.
- Form validation (Zod schemas) — UNCHANGED behavior.
- Form submit, loading, error, success states — UNCHANGED.
- Existing autocomplete attributes on phone inputs — UNCHANGED.
- Public/admin distinction for permissions — UNCHANGED.
- Read-only phone display (e.g. on listing detail seller card) —
  UNCHANGED (no editable combobox needed).
- Existing admin tables that show phone as read-only column — UNCHANGED.

Required after behavior:

1. ONE canonical data source at `src/lib/phone/countryCodes.ts` (or
   wherever the existing data lives per Task 187 — confirm via grep
   below; this kickoff assumes Task 187 already established a path,
   in which case Sonnet REUSES it rather than creating a duplicate):

   The canonical list MUST include at minimum the 43 European countries
   listed in issues.txt 2026-05-28 §7 (Albania → United Kingdom).

   Russia: ABSENT.
   Belarus: ABSENT.

   If Task 187 left transcontinental countries (Armenia, Azerbaijan,
   Georgia, Turkey) in the list, PRESERVE the existing product decision.
   STOP & ASK if the existing list adds new countries not in the
   issues.txt §7 list AND it's unclear whether they were intentionally
   added.

2. ONE shared component at `src/components/shared/PhoneCountryCodeCombobox.tsx`
   (or merge into existing `<PhoneField>` if Task 187 already created
   the shared selector — confirm via grep):

   - Wraps the canonical `<Combobox>` (Task 190).
   - Consumes the canonical country data.
   - Renders option = flag (if existing flag data) + `+CODE` + country name + selected indicator.
   - Renders selected trigger = flag + `+CODE`.
   - Dropdown includes a search input.
   - Search matches: country name (sq/en if localized; otherwise the existing label), `+CODE`, `CODE`, ISO code.
   - Examples that MUST work: `Alb` → Albania; `+355` → Albania; `355` → Albania; `Ukr` → Ukraine; `+380` → Ukraine; `380` → Ukraine.
   - Examples that MUST return empty: `Russia` → no result; `Belarus` → no result.

3. Migrate every phone country-code combobox usage to consume the
   shared component.

   Inventory the locations BEFORE editing (see Required investigation §1).
   The inventory MUST distinguish public-site vs admin.

   Migrate (Sonnet decides per-file based on the inventory):
   - public registration phone field;
   - agent registration phone field (if separate);
   - login/forgot-password flows (if they have a phone field — likely they don't);
   - profile/cabinet phone edit (Task 240/ProfileTab);
   - any admin user/agent/contact edit form with phone input;
   - any admin modal/drawer with editable phone.

   Skip (document as exceptions):
   - non-phone country selectors (address country, listing location country);
   - read-only phone displays (e.g. listing detail seller card);
   - admin tables showing phone as read-only column;
   - migration/seed/test fixtures.

4. Remove local hardcoded country-code arrays from public + admin
   phone flows. AFTER-state grep:
   ```
   grep -rn "+355\|+376\|+43\|+33" src/ --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v ".test." | grep -v countryCodes.ts | grep -v messages/
   ```
   → Should return ONLY the canonical data file + tests + locale files +
   intentional exceptions (each documented in the session log).

5. Phone validation alignment:
   - Validation must use the SELECTED country code, not assume Albania-
     only.
   - Local phone number input must remain a local-number field; user
     must NOT have to type +CODE in it.
   - Russia and Belarus must not be submissible (defense in depth in
     the validation layer too — if the canonical list excludes them,
     the validator will fail on these codes; do NOT silently accept).
   - Existing 9-digit Albanian validation (Task 267) preserved when
     country = Albania.
   - For other European countries, use the existing per-country length
     ranges if Task 187 established them; otherwise general validation
     (digits only, 7-15 length).

6. New locale keys (×4 locales) if search-placeholder + empty-state
   strings are NEW (likely yes):
   - `phone.search_placeholder` ("Search country or code" / "Шукати країну або код" / "Cerca paese o codice" / "Kërko vendin ose kodin")
   - `phone.search_empty` ("No countries found" / "Не знайдено країн" / "Nessun paese trovato" / "Nuk u gjet asnjë vend")
   - = 2 keys × 4 = 8 entries.
   - If Task 187 / 244 already added equivalent keys, REUSE them
     (paste grep evidence).

7. NO change to: Russia/Belarus removal beyond ensuring absence (the
   data already shouldn't have them per Task 187; verify); phone
   normalization helpers; backend phone storage format; auth flow;
   email change flow; admin permissions; non-phone country selectors;
   address selectors.

Positive flow (happy path) — registration:
- New user opens /sq/auth/register → phone field shows
  `<PhoneCountryCodeCombobox>` with `+355 Albania` as default.
- User clicks combobox → dropdown opens with the 43-country list +
  search input.
- User types `Ukr` → list filters to Ukraine → user selects → trigger
  shows `+380 Ukraine`.
- User types local number `631234567` → validation passes (general
  European, digits only).
- Submit → existing signup flow proceeds with the selected country code.

Positive flow (happy path) — admin user edit:
- Admin opens /sq/admin/users/<id> → user-edit form has phone field
  using the SAME `<PhoneCountryCodeCombobox>`.
- Admin can change the user's phone country + local number.
- Save → existing admin save action proceeds.

Negative flow (every off-happy-path branch):
- **User searches `Russia`** — dropdown empty state shown; no result; cannot select.
- **User searches `Belarus`** — same.
- **User pastes `+7…` (Russian code) into local number field manually** — validation against the canonical list rejects (selected country code does not match `+7`); existing inline error shown.
- **Empty country selection** — defensive: default is `+355`; if somehow cleared, validation requires a selection before submit.
- **Local number too short / too long** — existing per-country validation rejects; existing inline error.
- **Mobile 320px** — dropdown popover does not overflow viewport (canonical `<Combobox>` handles this via `dropdownMinWidth` from Task 187); search input remains tappable.
- **Admin modal/drawer with combobox** — popover renders without being clipped by parent container (use `Portal` if needed; match the existing canonical Combobox behavior).
- **Locale switch mid-form** — selected country preserved; search placeholder + empty state translate.
- **Read-only phone display in seller card** — NOT touched; remains read-only.
- **Address country selector elsewhere** — NOT touched; different concern.
- **Tests** — phone test suite (Task 267) re-run; should still pass (Albanian 9-digit cases preserved); per-country length validation tested if non-Albanian countries have specific lengths.

Required investigation (paste outputs in session log):

1. Full inventory of every phone country-code combobox location:
   ```
   grep -rn "PhoneField\|PhoneInput\|CountryCode\|countryCode\|callingCode\|phoneCode\|phone_code\|phoneCountries\|callingCodes" src/ --include="*.tsx" --include="*.ts" | grep -v node_modules
   ```

2. Inventory of local hardcoded country arrays in non-canonical files:
   ```
   grep -rn '"+355"\|"+376"\|"+43"' src/ --include="*.tsx" --include="*.ts" | grep -v countryCodes | grep -v node_modules | grep -v ".test."
   ```

3. Confirm canonical data file path (Task 187 — confirm):
   ```
   grep -rln "European country codes\|COUNTRY_CODES\|countryCodes" src/lib/phone src/components/shared
   ```

4. Confirm canonical Combobox + its props:
   ```
   grep -n "^export" src/components/shared/Combobox.tsx
   ```

5. Confirm Task 187 + Task 267 status:
   ```
   ls docs/sessions/2026-05-23-task-187-european-country-codes.md docs/sessions/2026-05-28-task-267-cc3-phone-test-9digit.md
   ```

6. Verify Russia + Belarus already absent:
   ```
   grep -n "Russia\|Belarus" src/lib/phone src/components/shared/PhoneField.tsx 2>/dev/null
   ```
   Should return ZERO selectable Russia/Belarus entries. If present,
   REMOVE them in this task.

7. Inventory admin phone forms (anything that has phone + editable):
   ```
   grep -rln "phone" src/components/admin src/app/admin --include="*.tsx" | head -20
   ```

8. Existing locale keys for phone:
   ```
   grep -n "\"phone\":" messages/sq.json
   grep -nE "phone\.(search|placeholder|empty)" messages/sq.json
   ```

Scope (files Sonnet may touch):

1. `src/lib/phone/countryCodes.ts` (or canonical equivalent) — verify Russia/Belarus absent; ensure all 43 European countries present.
2. `src/components/shared/PhoneCountryCodeCombobox.tsx` — NEW shared component (OR merge into existing `<PhoneField>` if Task 187 already established a single combobox; consolidate to ONE).
3. `src/components/shared/PhoneField.tsx` — consume the canonical combobox if not already.
4. Every component that currently has a phone-input form (from inventory grep #1) — replace local combobox / hardcoded array with `<PhoneCountryCodeCombobox>`.
5. `src/lib/phone/index.ts` — align validation with canonical list (if needed).
6. `messages/sq.json` + `messages/en.json` + `messages/uk.json` + `messages/it.json` — 2 new keys each (if not already present).
7. `docs/backlog.md` — standard task-closure update.
8. `docs/sessions/2026-05-28-task-280-phone-combobox-unification.md` — NEW session log per Task 264.

Out of scope (do NOT touch):
- Non-phone country selectors (address, listing location).
- Read-only phone displays.
- Auth flow / Supabase Auth behavior.
- Email validation / password validation / name validation.
- Email change flow.
- Resend / email behavior.
- Agent approval logic.
- Admin permissions / RLS.
- Phone storage format in the DB.
- Adding non-European countries.
- Adding Russia / Belarus.
- Introducing a new UI library.
- Creating a separate local combobox just for registration or admin (the whole point of this task is to DELETE these).
- Removing phone input functionality.
- The Design System Lockdown (Task 282 — separate; this task is precondition only).
- WhatsApp contact behavior (Task 277 — separate).

Acceptance criteria (literal):
- Inventory table in session log lists EVERY phone country-code combobox location with public/admin marker + before-state + after-state.
- Registration phone field uses `<PhoneCountryCodeCombobox>`.
- Agent registration (if separate) uses the same.
- Profile/cabinet phone field uses the same.
- Admin user/agent/contact phone edits use the same.
- ONE canonical data file is the single source of truth.
- Russia NOT selectable anywhere.
- Belarus NOT selectable anywhere.
- All 43 required European countries selectable.
- Search input inside dropdown works by country name, `+CODE`, `CODE`, ISO code.
- Manual search tests pass: `Alb`, `+355`, `355`, `Ukraine`, `+380`, `380` → match; `Russia`, `Belarus` → no match.
- Selected country persists on selection.
- Local phone number input remains separately editable.
- User is NOT forced to type +CODE in the local number field.
- Registration submit still works.
- Admin save still works.
- Existing validation still works (Task 244 / 267 9-digit Albanian preserved).
- UI style consistent across all phone country-code comboboxes (one component → guaranteed).
- Dropdown does NOT overflow at 320 / 375 / 390.
- Admin modals/drawers do NOT clip the dropdown.
- 0-2 new locale keys × 4 locales = 0-8 entries.
- All 7 breakpoints walked.
- AFTER-grep: `grep -rn '"+355"\|"+376"\|"+43"' src/ --include="*.tsx" --include="*.ts" | grep -v countryCodes | grep -v node_modules | grep -v ".test."` returns ZERO hits OR only documented exceptions.
- AFTER-grep: `grep -rn "Russia\|Belarus" src/lib/phone src/components/shared/PhoneField.tsx 2>/dev/null` returns ZERO (or only as excluded-comment).
- Note 18 self-validation + Note 20 before/after phone-form inventory in session log.
- `tsc=0` errors; lint clean; build passes.
- "Files Changed" table per Task 264.

Final report required from Sonnet:
1. Files Changed table.
2. Full phone-form inventory (public + admin) — before/after.
3. Files where local copies / hardcoded arrays were REMOVED.
4. Canonical data file path + count (should match the 43 required EU countries minimum).
5. Canonical component path.
6. Confirmation Russia + Belarus absent (grep evidence).
7. Manual search test results (6 positive + 2 negative cases).
8. Validation behavior post-migration (which countries have specific length rules?).
9. Mobile/desktop responsive walk evidence.
10. Locale-key parity (0-2 × 4 = 0-8 entries).
11. Note 18 self-validation verdict line.
12. Documented exceptions (read-only displays / fixtures / etc.).

Do NOT emit `git add` / `git commit` commands. Do NOT run git. Do NOT
touch read-only phone displays. Do NOT change phone storage format. Do
NOT add Russia/Belarus. Do NOT create a second design system; consolidate.
```
