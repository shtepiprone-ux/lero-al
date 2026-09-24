# Task 639 — `useCompanies` must expose a `refetch`, and `CompanyField.handleCreate` must call it so a newly created company is immediately visible and selected without a manual page reload

- **Task number:** 639
- **Epic:** none (AuthSheet-migration follow-up — owner-found bug during the Task 638 review, 2026-07-20).
- **Parent / origin:** Found during Task 638 (AuthSheet Slice 2e) live review. Creating a company via the agent-registration "+ add new" sub-flow sets `companyId` to the new id, but `useCompanies` only fetches once on mount and never refetches, so the new company is absent from `options` and the company-select renders the placeholder instead of the just-created company until the user manually reloads the page. Owner reproduced: "після ручного перезавантаження сторінки з'явилась компанія."

## Mode and task type

- **Mode:** implementation kickoff for a fresh Sonnet session (execute via `.claude/skills/execute-task/SKILL.md`).
- **Task type:** logic bug-fix in a client data hook (`useCompanies`) plus its single consumer's create handler (`CompanyField.handleCreate` in `AuthSheet.tsx`). No new UI element, no new i18n key, no styling, no DB/RLS change. Touches a Q4 auth-critical flow (agent registration → `companyId`), so the named auth smokes are an unchanged-green regression baseline.

## Objective

Make a company created through the agent-registration "+ add new" sub-flow appear in the company-select and become the selected value immediately, with no manual page reload. Do this by (1) returning a `refetch` function from `useCompanies` and (2) calling it in `CompanyField.handleCreate` after the company (and any logo) is created and before/around setting `companyId`, so `options` contains the new company when `onCompanyId(result.id)` runs.

## Verified context

Inspected on 2026-07-20 against `HEAD` (Task 638 landed, commit `eefb16506`). Reference by structure/id (line numbers shift).

### The hook — `src/modules/companies/hooks/useCompanies.ts` (full current file)

```tsx
'use client'

import { useEffect, useState } from 'react'
import { getCompanies } from '@/modules/companies/lib/queries'
import type { Company } from '@/types/database'

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCompanies()
      .then(setCompanies)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return { companies, loading }
}
```

- `getCompanies()` (`src/modules/companies/lib/queries.ts`) does a `createClient()` (browser Supabase) `.from('companies').select('id, name, logo_url, created_at').order('name')`, returns `Company[]`. It is idempotent and returns the full current list — calling it again after an insert returns the new company. **Not in scope to change.**
- **`useCompanies` has exactly ONE consumer:** `src/modules/auth/components/AuthSheet.tsx` `CompanyField` (`grep -rn "useCompanies" src/` → only `AuthSheet.tsx`). Adding a `refetch` to the returned object is additive and cannot break any other caller.

### The consumer — `CompanyField` in `src/modules/auth/components/AuthSheet.tsx`

- `const { companies } = useCompanies()` (currently destructures only `companies`).
- `const options = companies.map(c => ({ value: c.id, label: c.name, description: c.logo_url ? '📷' : undefined }))` — the `MantineCombobox` options; a company is only selectable/visible if present in `companies`.
- `handleCreate` (current, verbatim shape):

```tsx
async function handleCreate() {
  if (!newName.trim() || creating) return
  setCreating(true)
  const result = await createCompanyAction(newName.trim())
  if (!result.id) {
    setCreating(false)
    return
  }
  // Upload logo if selected
  if (logoFile) {
    try {
      const fd = new FormData()
      fd.append('logo', logoFile)
      fd.append('companyId', result.id)
      await fetch('/api/upload-company-logo', { method: 'POST', body: fd })
    } catch {
      // Logo upload failure is non-fatal — company is created successfully
    }
  }
  setCreating(false)
  onCompanyId(result.id)
  setShowAdd(false)
  setNewName('')
  setLogoFile(null)
  if (logoPreview) { URL.revokeObjectURL(logoPreview); setLogoPreview(null) }
  setLogoError(null)
}
```

- `createCompanyAction` (`src/modules/companies/actions.ts`) inserts via the service-role admin client and returns `{ id }`. **Not in scope to change** (that is Task 640/641's surface).
- The root cause is precisely that between `createCompanyAction` returning a new `id` and `onCompanyId(result.id)` setting it, `companies`/`options` is never refreshed, so the selected `id` has no matching option and `MantineCombobox` shows the placeholder.

### Why a refetch is the correct fix (not a local optimistic insert)

`getCompanies()` returns the canonical row (correct `name`, and `logo_url` if the upload succeeded), already sorted. A refetch after the logo upload also reflects the uploaded `logo_url` (so the `📷` indicator is correct). A local optimistic `setCompanies([...companies, {…}])` would duplicate ordering/`logo_url` logic and risk drift — do not do that; refetch from the source of truth.

## Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Owner bug | `useCompanies` returns a stable `refetch` function that re-runs `getCompanies()` and updates `companies`; existing `{ companies, loading }` return values are preserved (additive change only) | P0 | `git diff`; the returned object has `companies`, `loading`, `refetch` | Confirmed |
| R2 | Owner bug | `CompanyField.handleCreate`, on a successful create, refreshes the company list (awaits `refetch`) so the new company is in `options` before/when `onCompanyId(result.id)` sets the value; the refetch runs AFTER the logo upload attempt so `logo_url`/`📷` is reflected | P0 | `git diff`; rendered — create a company → it appears selected in the trigger with no reload | Confirmed |
| R3 | Behavior parity | No change to `createCompanyAction`, logo upload, `companyId`/`onCompanyId` wiring, the "+ add new" open/cancel sub-flow, location selection, or any other auth field/state; `getCompanies`/`queries.ts` unchanged | P0 | `git diff` shows only `useCompanies.ts` + the `handleCreate`/destructure lines in `AuthSheet.tsx`; named auth smokes green | Confirmed |
| R4 | Robustness | A failed `refetch` (network error) must not throw uncaught or leave the form stuck: the company is already created and `companyId` is set regardless; a refetch failure logs (as the mount fetch already does via `.catch(console.error)`) and does not block `onCompanyId`/form reset | P1 | `git diff` shows the refetch failure is caught/non-fatal; reasoned code inspection | Confirmed |
| R5 | Regression | All five named auth smokes + `test:header-hydration-id-parity` stay green (unchanged) | P0 | Named vitest commands exit 0 | Confirmed |
| R6 | Gates | `typecheck`, `check:stories`, `check:i18n`, `check:mojibake` all green; **no new i18n key** | P0 | Commands exit 0; i18n parity unchanged | Confirmed |

## Assumptions and open questions

- **`refetch` signature:** `refetch: () => Promise<void>` (returns the promise so `handleCreate` can `await` it before selecting). It should reuse the same `getCompanies().then(setCompanies).catch(console.error)` body as the mount effect (extract a shared `load` callback, e.g. `useCallback`, used by both the `useEffect` and the returned `refetch`). This keeps mount and refetch behavior identical. No open question — implement as described.
- **Ordering of operations in `handleCreate`:** await `refetch()` after the logo-upload block and before `onCompanyId(result.id)` (or immediately before it). Setting `companyId` after the list is refreshed guarantees the option exists when the value commits. `setCreating(false)` may stay where it is or move after the refetch; if `refetch` is awaited while `creating` is still true, ensure `creating` is cleared in all paths (success and the early `!result.id` return) so the button never stays stuck. Prefer a `try/finally` or explicit clears.
- **No `loading` UI regression:** the returned `loading` currently reflects only the initial mount fetch. Do not repurpose `loading` for the refetch (it would flip the whole field into a loading state on every create). If a refetch-in-progress indicator is ever wanted, that is a separate task — out of scope here.
- **Duplicate-name / uniqueness and the `📷`→thumbnail change are explicitly NOT in this task** — they are Tasks 640 / 641 / 642. This task only makes the created company appear without reload.

## Pre-read rule bundle

- `docs/agent-contract.md` (clauses 1 scope, 3 capabilities-reachable, 6a positive/negative flows, 9 validation evidence, 14 file integrity, 15 critical-flow regression).
- `docs/rule-index.md` (route: client data-hook + auth-overlay consumer — data-access + component rules; this is a logic fix, not a visual one).
- `docs/qa-profiles.md` (Q4 — auth-critical flow) and `docs/critical-flow-registry.md` (P0 Auth lifecycle — agent Signup / `companyId`).
- `docs/data-access-rules.md` (Supabase client-query + hook patterns).
- `docs/component-rules.md` (container/presentational, no-duplicate-logic — the "refetch from source of truth, don't hand-roll an optimistic insert" rule).
- Source: `src/modules/companies/hooks/useCompanies.ts` (target), `src/modules/companies/lib/queries.ts` (`getCompanies`, unchanged), `src/modules/auth/components/AuthSheet.tsx` `CompanyField` (`handleCreate`, destructure), `src/modules/companies/actions.ts` (`createCompanyAction`, unchanged — for context only), `src/types/database.ts` (`Company`).

## Scope

1. `src/modules/companies/hooks/useCompanies.ts`: extract the fetch body into a stable callback (`useCallback`), call it from the mount `useEffect`, and also return it as `refetch`. Return `{ companies, loading, refetch }`. Keep `.catch(console.error)` behavior.
2. `src/modules/auth/components/AuthSheet.tsx` `CompanyField`: destructure `refetch` from `useCompanies()`; in `handleCreate`, after the logo-upload block and before `onCompanyId(result.id)`, `await refetch()` (wrapped so a refetch failure is non-fatal per R4). Ensure `creating` is cleared in all exit paths.
3. Produce the Q4 regression + rendered evidence (verification plan).
4. Write the session log + a concise `docs/backlog.md` active-state entry (the orchestrator consolidated the AuthSheet tail on 2026-07-20; the file is at 78 lines — keep the new entry short, and flag `BACKLOG LIMIT BREACH` if it would exceed 80).

## Out of scope

- `createCompanyAction`, `getCompanies`/`queries.ts`, the logo-upload endpoint, `MantineCombobox`, `LocationCombobox`, `PasswordRequirementsHint`, `theme.ts`, stories, i18n keys.
- Duplicate-name detection/UX (Task 640), the DB UNIQUE index + dedup migration (Task 641), dropping the `📷` emoji / real logo thumbnails (Task 642).
- Any `loading`-state UI change for the refetch; any optimistic local insert.

## Current and required behavior

- **Current:** `useCompanies` fetches once on mount, returns `{ companies, loading }`, no `refetch`. Creating a company via "+ add new" sets `companyId` to the new id, but `companies`/`options` is stale, so the company-select shows the placeholder until a manual page reload.
- **Required after:** `useCompanies` returns `{ companies, loading, refetch }`; `handleCreate` awaits `refetch()` after create/logo-upload, so on returning to the select the new company is present in `options` and shown as the selected value in the trigger — no reload. All other auth behavior unchanged.

## Implementation requirements

- The refetch and mount fetch share one code path (no duplicated fetch logic — component-rules no-duplicate).
- `refetch` is referentially stable (`useCallback` with correct deps) so it is safe to call from an event handler and would be safe in a dependency array.
- Refetch failure is caught and non-fatal: the created company + `companyId` selection and the form reset still complete (R4). Do not swallow errors silently beyond the existing `console.error` convention.
- `creating` is cleared on every exit path (early `!result.id` return AND success), so the create button never stays disabled.
- No new user-facing string; no i18n key added or changed.

## Positive and negative flows

**Positive:** open agent registration → "+ add new" → type a company name (optionally choose a logo) → submit → `createCompanyAction` returns a new id → (logo uploads if chosen) → `refetch()` refreshes `companies` → `onCompanyId(newId)` sets the value → the create sub-form closes and the company-select trigger shows the new company as selected, immediately, with no page reload.

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Create company (no logo) → appears selected, no reload | **Yes** | R1/R2 | new company in `options`, shown selected in trigger | Rendered: create → trigger shows name, no reload |
| Create company WITH logo → appears selected + `📷` present | **Yes** | R2 | refetch after upload reflects `logo_url` → `📷` shows for it in the open list | Rendered: open list after create shows `📷` on the new row |
| `refetch()` network failure after a successful create | **Yes** | R4 | company still created + `companyId` set + form resets; error logged, not thrown; field not stuck | Code inspection (catch/non-fatal); no uncaught error |
| `createCompanyAction` fails (`!result.id`) | **Yes** | R3 | no refetch, `creating` cleared, form stays open for retry (unchanged) | Code inspection / `git diff` |
| Signup submit (agent, company selected) | **Yes (regression)** | Registry P0 | `companyId` unchanged wiring → signup as before | `signUpWithCaptcha.smoke` green |
| Other auth flows (login/recovery/phone/location) | **Yes (regression)** | Registry P0 | unchanged | `browser`/`requestPasswordReset`/`PhoneField` smokes green |
| Concurrent double-submit of create | No | existing `if (creating) return` guard already prevents re-entry; not changed by this task | — |
| Locale/viewport visual matrix | No | logic-only change, no new/changed visible chrome (the select/labels are unchanged from Task 638) | targeted rendered proof only, not a full matrix |

## Acceptance criteria

- `AC1 [R1]` Given `useCompanies` after the change, then it returns `refetch` (a `() => Promise<void>`) alongside `companies` and `loading`, and the mount fetch and `refetch` share one fetch path.
- `AC2 [R2]` Given the agent-registration "+ add new" sub-flow, when a company is created (with or without a logo), then on returning to the company-select the new company is present and shown as the selected value in the trigger **without any page reload**; a logo'd company shows `📷` in the open list.
- `AC3 [R3]` Given the diff, then `createCompanyAction`, `getCompanies`, the logo endpoint, `onCompanyId` wiring, the create open/cancel sub-flow, and all other auth fields are unchanged; only `useCompanies.ts` and the `handleCreate`/destructure lines in `AuthSheet.tsx` changed.
- `AC4 [R4]` Given a `refetch` failure after a successful create, then the company is still created, `companyId` is set, the form resets, the error is logged (not thrown), and the create button is not left disabled.
- `AC5 [R5,R6]` Given the repo after the change, when the named auth smokes + header-hydration-id-parity + typecheck + check:stories + check:i18n + check:mojibake run, then all exit 0 and no new i18n key exists.

## QA profile and verification plan

**Profile: Q4 Release/Critical Flow** (P0 auth-lifecycle entry point; changes a data hook feeding agent-registration `companyId`). The fix is logic-only in a hook + one handler — no visual matrix, but the create→appears-selected behavior requires rendered proof, and the auth smokes are an unchanged-green regression baseline. Record actual output for each:

1. `npm run typecheck` → 0 errors.
2. `npm run check:stories` → exit 0.
3. `npm run check:i18n` → unchanged parity (no new key).
4. `npm run check:mojibake` → 0 artifacts.
5. **Critical-flow regression (must stay green, unchanged):**
   - `npx vitest run src/lib/auth/__tests__/browser.smoke.test.ts`
   - `npx vitest run src/modules/auth/actions/__tests__/signUpWithCaptcha.smoke.test.ts`
   - `npx vitest run src/modules/auth/actions/__tests__/requestPasswordReset.smoke.test.ts`
   - `npx vitest run src/components/shared/__tests__/PhoneField.smoke.test.tsx`
   - `npm run test:header-hydration-id-parity`
6. **Rendered (live app):** open the agent-registration AuthSheet (via the `lero:open-auth-sheet` event, Tasks 633–638 precedent), open "+ add new", create a company **without a logo** and confirm it shows as the selected value in the trigger with **no page reload**; repeat **with a logo** and confirm the open list shows `📷` on the new row and it is selected. Capture at least: the trigger showing the newly-created company selected (no reload), and the open list showing the new company (with `📷` for the logo case). One mobile width (e.g. 390) + one desktop width is sufficient (no locale matrix — no user-facing string changed). If the sandbox cannot run the live app, record it as missing evidence with the exact owner-native command and expected result; this owner-reproducible flow is the primary proof for R2 and cannot be waived by code-path assertion alone.
7. `git status --short` / `git diff --stat` → only `src/modules/companies/hooks/useCompanies.ts`, `src/modules/auth/components/AuthSheet.tsx`, `docs/backlog.md`, and the new session log. Classify any harness side-effect as `EXCLUDED AS UNRELATED`.

If a required check cannot run in the sandbox (native binary / browser build / timeout), record it as missing evidence with the exact owner-native PowerShell command (`npm.cmd` / `npx.cmd`) + expected result; never substitute a confidence claim. Q4 cannot be approved without the named regression evidence and the R2 rendered proof.

## Completion report contract

Write `docs/sessions/2026-07-20-task639-usecompanies-refetch-after-create.md` + a concise `docs/backlog.md` update. Include: a Files Changed table matching the real diff; R1–R6 each with evidence; the before/after of `useCompanies` and of `handleCreate`; typecheck/check:stories/check:i18n/mojibake results; the five regression commands' actual output (all green); the rendered proof (create-without-logo selected-no-reload + create-with-logo `📷`-in-list); explicit confirmation that `createCompanyAction`/`getCompanies`/logo endpoint/`onCompanyId` wiring/other auth fields/`theme.ts`/stories/i18n keys were NOT touched; and the R4 refetch-failure non-fatal reasoning. Final status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED` — never self-approval. Do not run or emit mutating git.

Handoff: execute via `.claude/skills/execute-task/SKILL.md` against this file path.

## Task quality gate

- A fresh Sonnet session can execute this without chat context: the hook's full current body, the single consumer, the `handleCreate` verbatim shape, the exact fix (shared `useCallback` fetch path + `refetch` return + awaited refetch before `onCompanyId`), the robustness/`creating`-clear requirements, the out-of-scope siblings (640/641/642), and the Q4 regression + rendered matrix are all named. ✅
- Every P0 requirement has a binary AC and a verification method; the critical-flow smokes are named as an unchanged-green regression baseline; the R2 rendered proof (the actual owner-reported symptom) is mandatory. ✅
- Scope protects every other auth behavior and names what must not change (createCompanyAction, getCompanies, logo endpoint, onCompanyId wiring, create sub-flow, theme, stories, i18n keys). ✅
- No new i18n key, no visual change — the profile is Q4 for critical-flow regression, not a visual matrix; justified. ✅
- Negative flows selected by applicability (create no-logo / with-logo / refetch-failure / create-failure / signup regression / other-auth regression in; concurrent double-submit and locale matrix out with reasons). ✅
- The fix reuses the source of truth (refetch) rather than a hand-rolled optimistic insert (no-duplicate-logic). ✅
