# Task 640 — When an agent tries to create a company whose name already exists, `createCompanyAction` must detect it and return the existing company as a duplicate, and `CompanyField` must show a "company already exists" message with a "Select" button that picks the existing company (no silent second insert)

- **Task number:** 640
- **Epic:** none (AuthSheet company-field follow-up — owner directive during the Task 639 review, 2026-07-20).
- **Parent / origin:** Owner-found during the Task 638/639 flow: the company create sub-flow performs no duplicate check, so retyping an existing company name inserts a second row (the owner saw two `Test1` rows). Owner decision (`AskUserQuestion`, 2026-07-20): "під час створення дублю компанії писати користувачеві, що така компанія існує і давати змогу йому вибрати цю компанію." — i.e. show a message and offer a button to select the existing company, not silently create or silently auto-select.

## Mode and task type

- **Mode:** implementation kickoff for a fresh Sonnet session (execute via `.claude/skills/execute-task/SKILL.md`).
- **Task type:** server-action logic change (`createCompanyAction`) + a new user-facing UI state in `CompanyField` (`AuthSheet.tsx`) + two new i18n keys in all four locales. Touches the Q4 auth-critical flow (agent registration → `companyId`), so the named auth smokes are an unchanged-green regression baseline. This is a NEW visible UI state → rendered proof of the duplicate state is required (incl. `uk@320`).

## Objective

Prevent duplicate company rows created through the agent-registration "+ add new" sub-flow, per the owner's chosen UX: (1) `createCompanyAction` detects an existing company by normalized name and, instead of inserting, returns that company's id flagged as a duplicate; (2) `CompanyField.handleCreate` branches on the duplicate result and shows a localized "A company with this name already exists" message plus a "Select" button; (3) clicking "Select" sets `companyId` to the existing company and closes the create sub-form (the same commit path a normal creation uses); (4) editing the name clears the duplicate state so the user can retry. No silent second insert, and no silent auto-select — the user consciously confirms.

## Verified context

Inspected on 2026-07-20 against `HEAD` (Task 639 landed, `fix(Task639)` `ca44cfc96`; working tree clean). Reference by structure/id (line numbers shift).

### The server action — `src/modules/companies/actions.ts` (current `createCompanyAction`)

```ts
export async function createCompanyAction(
  name: string
): Promise<{ id?: string; error?: string }> {
  const trimmed = name.trim()
  if (!trimmed || trimmed.length < 2) return { error: 'company_name_too_short' }
  if (trimmed.length > 120) return { error: 'company_name_too_long' }

  const db = createAdminClient()
  const { data, error } = await db
    .from('companies')
    .insert({ name: trimmed })
    .select('id')
    .single()

  if (error) {
    console.error('createCompanyAction failed', error)
    return { error: 'save_failed' }
  }

  return { id: data.id }
}
```

- Uses the service-role admin client (called before the user has a session). Length guards already return `error` codes. No duplicate check today.
- `companies` is a small table (agent companies). A normalized-name lookup before insert is cheap.

### The consumer — `CompanyField` in `src/modules/auth/components/AuthSheet.tsx`

- `const { companies, refetch } = useCompanies()` (Task 639 added `refetch`).
- State in `CompanyField`: `showAdd`, `newName`, `creating`, `logoFile`, `logoPreview`, `logoError` (all `useState`). No duplicate state yet.
- `handleCreate` (current, post-639):

```ts
async function handleCreate() {
  if (!newName.trim() || creating) return
  setCreating(true)
  const result = await createCompanyAction(newName.trim())
  if (!result.id) {
    setCreating(false)
    return
  }
  // Upload logo if selected
  if (logoFile) { /* POST /api/upload-company-logo, non-fatal */ }
  try { await refetch() } catch (err) { console.error(err) }
  setCreating(false)
  onCompanyId(result.id)
  setShowAdd(false)
  setNewName('')
  setLogoFile(null)
  if (logoPreview) { URL.revokeObjectURL(logoPreview); setLogoPreview(null) }
  setLogoError(null)
}
```

- **Bug for this task:** because a duplicate would (naively) come back with an `id`, the current `if (!result.id)` guard passes and the code would auto-select + close. The owner wants a message + explicit Select instead — so `handleCreate` must branch on a `duplicate` flag BEFORE the select/close path.
- The create sub-form is a Tailwind wrapper (`<div className="border rounded-xl p-3 flex flex-col gap-2 bg-muted/30">`) containing: the name `TextInput`, the logo-upload row, the logo hint/error `<p>`, and the Add/Cancel `Button` row (`{tc('add')}` / `{tc('cancel')}`). Existing small-note pattern: `<p className="text-xs text-destructive">{logoError}</p>` and `<p className="text-[10px] text-muted-foreground">{t('company_logo_hint')}</p>`.
- `newName` is bound to the name `TextInput` via `onChange={e => setNewName(e.target.value)}`.
- The existing company is already present in `companies`/`options` (it was fetched on mount / by Task 639's refetch), so selecting it needs only `onCompanyId(existingId)` + closing the sub-form — no refetch needed for the duplicate/select path.

### i18n — `messages/{sq,en,uk,it}.json`

- Existing `auth.company_*` keys: `company`, `company_add_new`, `company_logo`, `company_logo_hint`, `company_logo_invalid_type`, `company_logo_too_big`, `company_logo_too_large`, `company_select_placeholder`. Existing `common`: `add`, `cancel`, `no_results`, `replace`, `choose_file`. **`common.select` does NOT exist yet.**
- `check:i18n` enforces identical key sets across all four locales (currently 2203 keys each) — every new key MUST be added to all four.

### Normalization helper

- `src/lib/utils.ts` `normalizeSearch(s)` = `s.normalize('NFD').replace(_COMBINING,'').toLowerCase()` (accent-insensitive). **This task's duplicate match uses case-insensitive + whitespace-trim only (`trim().toLowerCase()`)**, NOT accent-stripping — see the open question below (kept consistent with the `lower(trim(name))` UNIQUE index Task 641 will add; accent-insensitivity is a joint 640/641 decision, deferred).

## Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Owner directive | `createCompanyAction` checks for an existing company whose name equals the input under `trim().toLowerCase()`; if found, it does NOT insert and returns `{ id: <existingId>, duplicate: true }`. The return type gains an optional `duplicate?: boolean` | P0 | `git diff`; unit-style reasoning; rendered duplicate state | Confirmed |
| R2 | Owner directive | On a non-duplicate name, `createCompanyAction` inserts and returns `{ id }` exactly as before (length-guard `error` returns unchanged) | P0 | `git diff` — insert path byte-preserved except the pre-insert lookup; normal create still works (Task 639 rendered flow) | Confirmed |
| R3 | Race safety / forward-compat | If the insert itself fails with a Postgres unique-violation (`code === '23505'`, once Task 641's UNIQUE index exists), the action re-looks-up the existing row and returns `{ id, duplicate: true }` rather than `{ error: 'save_failed' }`. Until 641 lands this branch is dormant but present | P1 | `git diff` — `23505` handled; reasoned inspection | Confirmed |
| R4 | Owner directive | `CompanyField.handleCreate` branches on `result.duplicate` BEFORE the select/close path: it sets a `duplicate` state (`{ id, name }`), clears `creating`, and does NOT auto-select or close the sub-form | P0 | `git diff`; rendered — typing an existing name → message shown, form stays open | Confirmed |
| R5 | Owner directive | When `duplicate` is set, `CompanyField` renders a localized "a company with this name already exists" message (`auth.company_exists`) and a "Select" button (`common.select`); clicking Select calls `onCompanyId(duplicate.id)`, closes the sub-form, and resets create state (same reset as a normal creation) | P0 | `git diff`; rendered — Select picks the existing company, trigger shows it | Confirmed |
| R6 | UX correctness | Editing the name input clears the `duplicate` state (so the user can change the name and retry); a fresh `handleCreate` attempt also clears any stale `duplicate` before calling the action | P0 | `git diff`; rendered — after a duplicate, changing the name hides the message | Confirmed |
| R7 | Behavior parity | No change to `useCompanies`, `getCompanies`, the logo-upload endpoint, `onCompanyId` wiring, location selection, password/forgot logic, `MantineCombobox`, or any other auth field; the normal (non-duplicate) create + Task-639 refetch-and-select path is preserved | P0 | `git diff` scope; named auth smokes green | Confirmed |
| R8 | i18n | `auth.company_exists` and `common.select` added to all four locales (`sq/en/uk/it`) with the strings below; no other key changed; parity preserved | P0 | `check:i18n` exit 0, key sets identical (2205 each) | Confirmed |
| R9 | Regression | All five named auth smokes + `test:header-hydration-id-parity` stay green | P0 | Named vitest commands exit 0 | Confirmed |
| R10 | Gates | `typecheck`, `check:stories`, `check:i18n`, `check:mojibake` all green | P0 | Commands exit 0 | Confirmed |

## Assumptions and open questions

- **Normalization scope (case/whitespace only, NOT accent):** the duplicate match is `existing.name.trim().toLowerCase() === trimmed.toLowerCase()`. This exactly matches the `lower(trim(name))` UNIQUE index Task 641 will add, keeping app-check and DB-constraint consistent by construction. Accent-insensitive matching (e.g. `Tëst1` == `Test1` via `normalizeSearch`/`unaccent`) is intentionally deferred to a joint 640/641 decision — do NOT use `normalizeSearch` here. If the owner later wants accent-insensitivity, both this action and the 641 index must adopt `unaccent` together. Implement the case/whitespace baseline; flag any accent-collision the owner mentions as out of scope for 640.
- **Duplicate lookup mechanism:** query `db.from('companies').select('id, name')` and compare in JS with the normalization above (small table; avoids `ilike` wildcard-escaping pitfalls with `%`/`_` in names and matches the index semantics exactly). Return the first match's `id`. Do not add a DB index in this task (that is 641).
- **Message strings (provided — do not invent translations):**
  - `common.select`: `sq` = "Zgjidh", `en` = "Select", `uk` = "Вибрати", `it` = "Seleziona".
  - `auth.company_exists`: `sq` = "Një kompani me këtë emër ekziston tashmë.", `en` = "A company with this name already exists.", `uk` = "Компанія з такою назвою вже існує.", `it` = "Un'azienda con questo nome esiste già."
  - Place `common.select` in the `common` object and `auth.company_exists` in the `auth` object of each locale file, preserving each file's existing key ordering/formatting conventions (insert near sibling keys, e.g. `company_exists` next to the other `company_*` keys). Verify placement does not break JSON (clause 14).
- **Message/button rendering:** render the message with Mantine `<Text size="xs" c="dimmed">` (or `c="red"` if the owner prefers an error tone — default to `c="dimmed"`, informational not error) and the Select control with a Mantine `<Button size="xs">` (consistent with the file's current Mantine usage and the compact create sub-form). Place them together in the Add/Cancel button area (e.g. a small row above or beside the Add/Cancel buttons). No new shared component, no copied local styles.
- **The `duplicate` state shape** is `{ id: string; name: string } | null`. `name` is used only to optionally echo the attempted name if desired; the message string itself does not require interpolation (kept simple, no ICU var) — if the executor wants to show the name, that is optional and must not add an untranslated fragment.
- **Out of scope:** the DB UNIQUE index + existing-`Test1` cleanup (Task 641), dropping the `📷` indicator (Task 642), real logo thumbnails, and any change to how `createCompanyAction` is authorized.

## Pre-read rule bundle

- `docs/agent-contract.md` (clauses 1 scope, 3 capabilities-reachable, 6/6a current+negative flows, 7 i18n four-locale, 9 validation evidence, 11 mobile/overlay, 14 file integrity, 15 critical-flow regression).
- `docs/rule-index.md` (route: server action + auth-overlay UI state + i18n).
- `docs/qa-profiles.md` (Q4 — auth-critical flow) and `docs/critical-flow-registry.md` (P0 Auth lifecycle — agent Signup / `companyId`).
- `docs/data-access-rules.md` (Supabase admin-client server-action patterns), `docs/domain-rules.md` (company/agent marketplace rules), `docs/component-rules.md` (i18n, no-duplicate, container/presentational; localized visible strings).
- `docs/mantine-responsive-design-system.md` (§6 label/text + §6l form chrome for the message/Select), `docs/tailadmin-style-reference.md`.
- Source: `src/modules/companies/actions.ts` (`createCompanyAction`, target), `src/modules/auth/components/AuthSheet.tsx` `CompanyField` (target), `src/modules/companies/hooks/useCompanies.ts` (unchanged, context), `src/lib/utils.ts` (`normalizeSearch` — NOT used here, context), `messages/{sq,en,uk,it}.json` (i18n), `src/types/database.ts` (`Company`).

## Scope

1. `src/modules/companies/actions.ts` — `createCompanyAction`: add the normalized-name lookup before insert (R1), preserve the normal insert path (R2), and handle the `23505` unique-violation on insert as a duplicate (R3). Extend the return type with `duplicate?: boolean`.
2. `src/modules/auth/components/AuthSheet.tsx` — `CompanyField`: add `duplicate` state; branch `handleCreate` on `result.duplicate` (R4); clear stale `duplicate` at the start of `handleCreate`; clear `duplicate` on name-input change (R6); render the message + Select button and wire Select to `onCompanyId(duplicate.id)` + sub-form reset (R5).
3. `messages/{sq,en,uk,it}.json` — add `common.select` and `auth.company_exists` with the provided strings (R8).
4. Produce the Q4 regression + rendered evidence (verification plan).
5. Write the session log + a concise `docs/backlog.md` active-state entry (move Task 640 from "Designed" to a reviewed-state line on completion; keep the file ≤80 lines and flag `BACKLOG LIMIT BREACH` if needed).

## Out of scope

- The DB UNIQUE index + existing-duplicate cleanup migration (Task 641); dropping `📷` / logo thumbnails (Task 642).
- `useCompanies`/`getCompanies`, the logo endpoint, `MantineCombobox`, `LocationCombobox`, `PasswordRequirementsHint`, `theme.ts`, stories.
- Accent-insensitive matching (`unaccent`/`normalizeSearch`) — deferred joint decision with 641.
- Showing the pre-existing length-guard `error` codes in the UI (pre-existing behavior, not this task).

## Current and required behavior

- **Current:** typing an existing company name in "+ add new" and pressing Add inserts a second `companies` row (no duplicate check); the create flow then selects the newly-inserted duplicate. Result: duplicate company rows (owner saw two `Test1`).
- **Required after:** pressing Add with an existing name does NOT insert; the sub-form stays open and shows "A company with this name already exists." + a "Select" button. Clicking Select picks the existing company (`companyId` set) and closes the sub-form. Changing the name clears the message and allows a retry. A genuinely new name still creates + selects as before (Task 639 behavior preserved). All other auth behavior unchanged.

## Implementation requirements

- Duplicate detection is server-side in `createCompanyAction` (authoritative; the client cannot be trusted to dedupe). The client only reacts to the `duplicate` flag.
- `handleCreate` clears any prior `duplicate` at entry and on the name-input `onChange`, so the message never lingers against a changed name.
- The Select path reuses the existing reset (`setShowAdd(false)`, `setNewName('')`, logo cleanup, `setLogoError(null)`) and calls `onCompanyId(existingId)` — do not duplicate the reset logic ad hoc; factor a small shared reset if it reduces duplication (optional, no behavior change).
- All visible strings are locale-backed (no hard-coded English/Ukrainian in JSX). No forbidden raw controls; message/Select use Mantine primitives already imported or add `Button`/`Text` from the existing `@mantine/core` import.
- `creating` is cleared on every exit path (early return, duplicate, success, error) so the Add button never sticks.
- Touched JSON/TS files remain UTF-8 no-BOM, no NUL, valid JSON/TS (clause 14).

## Positive and negative flows

**Positive:** open agent registration → "+ add new" → type a NEW company name → Add → `createCompanyAction` inserts → refetch (Task 639) → company selected, sub-form closes (unchanged). Separately: type an EXISTING name → Add → action returns `{id, duplicate:true}` → message + "Select" shown, form open → click Select → existing company selected, sub-form closes.

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| New name → create + select (Task 639 path) | **Yes (regression)** | R2/R7 | inserts, refetches, selects, closes — unchanged | Rendered: create a genuinely-new name still works |
| Existing name (exact) → duplicate message + Select | **Yes** | R1/R4/R5 | no insert; message + Select shown; form stays open | Rendered: duplicate state (incl. uk@320) |
| Existing name (case/whitespace variant, e.g. `  test1 `) → detected | **Yes** | R1 | normalized match → duplicate, not a second row | Rendered or reasoned: `trim().toLowerCase()` match |
| Click Select → existing company committed | **Yes** | R5 | `onCompanyId(existingId)`, sub-form closes, trigger shows it | Rendered: Select → company in trigger |
| Edit name after duplicate shown → message clears | **Yes** | R6 | `duplicate` cleared on change; retry possible | Rendered: change name → message gone |
| Insert unique-violation `23505` (post-641, dormant now) | **Yes (forward-compat)** | R3 | re-lookup → duplicate, not `save_failed` | Code inspection (branch present) |
| Length-guard error (`<2` / `>120`) | **Yes (regression)** | R2 | returns `error` code as before; no duplicate/insert; form open | Code inspection / `git diff` |
| Signup submit (agent, company selected) | **Yes (regression)** | Registry P0 | `companyId` wiring unchanged | `signUpWithCaptcha.smoke` green |
| Other auth flows (login/recovery/phone/location) | **Yes (regression)** | Registry P0 | unchanged | `browser`/`requestPasswordReset`/`PhoneField` smokes green |
| Locale expansion (message + Select, sq/uk/it@320) | **Yes** | R8 | message/Select wrap, no clip/overflow at 320, uk@320 mandatory | Rendered `uk@320` duplicate state |
| Concurrent double-submit | No | existing `if (creating) return` guard unchanged | — |

## Acceptance criteria

- `AC1 [R1,R2]` Given `createCompanyAction`, when the input matches an existing name under `trim().toLowerCase()`, then it returns `{ id: existingId, duplicate: true }` and inserts nothing; when it does not match, it inserts and returns `{ id }` as before.
- `AC2 [R3]` Given a unique-violation (`23505`) on insert, then the action re-looks-up and returns `{ id, duplicate: true }` (branch present even though dormant pre-641).
- `AC3 [R4,R5]` Given the "+ add new" sub-flow, when the user submits an existing name, then a localized "already exists" message and a "Select" button appear, the sub-form stays open, and no second company is created; clicking "Select" sets `companyId` to the existing company and closes the sub-form.
- `AC4 [R6]` Given a shown duplicate message, when the user edits the name, then the message clears and a retry is possible.
- `AC5 [R7]` Given the diff, then `useCompanies`/`getCompanies`/logo endpoint/`onCompanyId` wiring/other auth fields are unchanged; the normal create+select path (Task 639) still works.
- `AC6 [R8]` Given the four locale files, then `common.select` and `auth.company_exists` exist in all four with the provided strings and `check:i18n` parity passes.
- `AC7 [R9,R10]` Given the repo after the change, when the named auth smokes + header-hydration-id-parity + typecheck + check:stories + check:i18n + check:mojibake run, then all exit 0.

## QA profile and verification plan

**Profile: Q4 Release/Critical Flow** (P0 auth-lifecycle entry point; server-action + new UI state feeding agent-registration `companyId`). New visible state → rendered proof required; the auth smokes are an unchanged-green regression baseline. Record actual output for each:

1. `npm run typecheck` → 0 errors.
2. `npm run check:stories` → exit 0.
3. `npm run check:i18n` → parity holds with the two new keys in all four locales (2205 each).
4. `npm run check:mojibake` → 0 artifacts.
5. **Critical-flow regression (must stay green, unchanged):**
   - `npx vitest run src/lib/auth/__tests__/browser.smoke.test.ts`
   - `npx vitest run src/modules/auth/actions/__tests__/signUpWithCaptcha.smoke.test.ts`
   - `npx vitest run src/modules/auth/actions/__tests__/requestPasswordReset.smoke.test.ts`
   - `npx vitest run src/components/shared/__tests__/PhoneField.smoke.test.tsx`
   - `npm run test:header-hydration-id-parity`
6. **Rendered (live app):** open the agent-registration AuthSheet (`lero:open-auth-sheet`, Tasks 633–639 precedent). With at least one existing company present, open "+ add new", type that existing company's name, press Add, and capture: (a) the duplicate message + "Select" button shown with the sub-form still open (mandatory at `uk@320`, plus one desktop width); (b) after clicking Select, the company-select trigger showing the existing company selected and the sub-form closed; (c) editing the name clears the message. Also confirm a genuinely-new name still creates+selects (Task 639 path). If the sandbox cannot run the live app or has no seed company, record it as missing evidence with the exact owner-native command + expected result, and (if needed) request the owner run the reproduction — Q4 cannot be approved without the duplicate-state rendered proof.
7. `git status --short` / `git diff --stat` → only `src/modules/companies/actions.ts`, `src/modules/auth/components/AuthSheet.tsx`, `messages/{sq,en,uk,it}.json`, `docs/backlog.md`, and the new session log. Classify any harness side-effect as `EXCLUDED AS UNRELATED`.

If a required check cannot run in the sandbox (native binary / browser build / timeout), record it as missing evidence with the exact owner-native PowerShell command (`npm.cmd` / `npx.cmd`) + expected result; never substitute a confidence claim. Q4 cannot be approved without the named regression evidence and the duplicate-state rendered proof.

## Completion report contract

Write `docs/sessions/2026-07-20-task640-companyfield-duplicate-name-select-existing.md` + a concise `docs/backlog.md` update. Include: a Files Changed table matching the real diff; R1–R10 each with evidence; the before/after of `createCompanyAction` and of `handleCreate`/the render; the exact i18n keys+strings added per locale; typecheck/check:stories/check:i18n/mojibake results; the five regression commands' actual output; the rendered proof (duplicate message+Select at uk@320, Select→selected, edit-clears-message, and a new-name-still-creates check); explicit confirmation that `useCompanies`/`getCompanies`/logo endpoint/`onCompanyId` wiring/`MantineCombobox`/other auth fields/`theme.ts`/stories were NOT touched; the normalization decision (case/whitespace only, accent deferred to 641); and the `23505` forward-compat branch. Final status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED` — never self-approval. Do not run or emit mutating git.

Handoff: execute via `.claude/skills/execute-task/SKILL.md` against this file path.

## Task quality gate

- A fresh Sonnet session can execute this without chat context: the current action + consumer verbatim, the exact fix (server-side normalized lookup + `duplicate` flag + `23505` handling; client `duplicate` state + branch + message/Select + clear-on-edit), the provided 4-locale strings and placement, the normalization decision, the out-of-scope siblings (641/642), and the Q4 regression + rendered matrix are all named. ✅
- Every P0 requirement has a binary AC and a verification method; the critical-flow smokes are a named unchanged-green baseline; the duplicate-state rendered proof (the owner-requested UX) is mandatory incl. uk@320. ✅
- Scope protects the Task-639 create+select path and every other auth behavior, and names what must not change. ✅
- i18n: two new keys, four locales, strings provided (no invented translation); parity gate named. ✅
- Negative flows selected by applicability (new-name regression / existing-exact / case-whitespace variant / Select / edit-clears / 23505 forward-compat / length-guard / signup+other-auth regression / locale in; concurrent double-submit out). ✅
- The duplicate check is server-side (authoritative), consistent with the `lower(trim(name))` index Task 641 will add; no copied local styles; message/Select use canonical Mantine primitives. ✅
