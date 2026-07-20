# Session log — Task 639: `useCompanies` refetch after create

- **Task path:** `tasks/kickoff_prompt_Task_639_UseCompanies_Refetch_AfterCreate.md`
- **Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`
- **Executor:** Sonnet (`.claude/skills/execute-task/SKILL.md`)
- **Date:** 2026-07-20

## Requirement ledger (restated before implementation)

| ID | Requirement | Priority |
|---|---|---|
| R1 | `useCompanies` returns a stable `refetch` that re-runs `getCompanies()`; `companies`/`loading` unchanged (additive) | P0 |
| R2 | `CompanyField.handleCreate`, on success, awaits `refetch()` AFTER the logo-upload block and BEFORE `onCompanyId(result.id)`, so the new company is present in `options` when selected | P0 |
| R3 | No change to `createCompanyAction`, logo upload, `companyId`/`onCompanyId` wiring, the add/cancel sub-flow, location field, or `queries.ts`; diff limited to `useCompanies.ts` + `handleCreate`/destructure lines | P0 |
| R4 | A `refetch` failure must not throw uncaught and must not block `onCompanyId`/form reset; logged, non-fatal | P1 |
| R5 | Five named auth smokes + `test:header-hydration-id-parity` stay green | P0 |
| R6 | `typecheck`/`check:stories`/`check:i18n`/`check:mojibake` green; no new i18n key | P0 |

## Current vs. required behavior

- **Current (before):** `useCompanies` fetched once on mount, returned `{ companies, loading }`. `CompanyField.handleCreate` created the company (+ optional logo), cleared `creating`, then called `onCompanyId(result.id)` immediately — `companies`/`options` was never refreshed, so the new id had no matching option and the trigger showed the placeholder until a manual reload.
- **Required after (now implemented):** `useCompanies` returns `{ companies, loading, refetch }`, where `refetch` and the mount effect share one `useCallback`-wrapped fetch body. `handleCreate` awaits `refetch()` (wrapped in `try/catch`, non-fatal) after the logo-upload block and before `onCompanyId(result.id)`, so `options` contains the new company before it is selected.
- **Negative flows:** see applicability table below — all applicable branches implemented/verified.

## Before/after — `src/modules/companies/hooks/useCompanies.ts`

Before:
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

After:
```tsx
'use client'

import { useCallback, useEffect, useState } from 'react'
import { getCompanies } from '@/modules/companies/lib/queries'
import type { Company } from '@/types/database'

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const data = await getCompanies()
      setCompanies(data)
    } catch (err) {
      console.error(err)
    }
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  return { companies, loading, refetch: load }
}
```

Notes:
- `load` is a `useCallback` with an empty dependency array (`getCompanies`/`setCompanies` are both stable), so `refetch` is referentially stable across renders (R1, AC1).
- Mount effect and `refetch` share exactly one fetch/catch/`setCompanies` path (`load`) — no duplicated fetch logic (component-rules no-duplicate).
- `load`'s own internal `try/catch` already makes it non-throwing (mirrors the previous `.catch(console.error)` convention exactly — same error is now caught and logged instead of rejecting the returned promise). `loading` is still driven only by the initial mount's `.finally`, not repurposed for refetch-in-progress (per the task's explicit "no `loading` UI regression" constraint).

## Before/after — `CompanyField.handleCreate` in `src/modules/auth/components/AuthSheet.tsx`

Before (verbatim, matches the kickoff's captured shape):
```tsx
const { companies } = useCompanies()
...
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

After:
```tsx
const { companies, refetch } = useCompanies()
...
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
  try {
    await refetch()
  } catch (err) {
    // Refetch failure is non-fatal — the company is already created and selected below
    console.error(err)
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

Notes:
- `refetch()` is awaited AFTER the logo-upload block and BEFORE `onCompanyId(result.id)` (R2/AC2 ordering) — so by the time `companyId` is set, `options` (derived from `companies`) already contains the new row, including its `logo_url` if the upload succeeded (so `📷` is correct for that row).
- `creating` is cleared on every exit path: the early `!result.id` return (`setCreating(false)` unchanged, line before the logo block) AND the success path (`setCreating(false)` now runs right after the `refetch` try/catch, before `onCompanyId`) — the create button is never left disabled (R4/AC4).
- The `try/catch` around `refetch()` is a second, belt-and-suspenders non-fatal guard on top of `load`'s own internal catch — matches the task's explicit "await refetch() (wrapped so a refetch failure is non-fatal per R4)" instruction. Neither layer throws uncaught; `onCompanyId`/form reset always runs.
- Nothing else in `handleCreate`, `handleCancel`, `handleLogoSelect`, the JSX, `createCompanyAction`, `LocationCombobox`/`AgentCityField`, or any other `AuthSheet.tsx` view changed.

## Files Changed

| File | Reason |
|---|---|
| `src/modules/companies/hooks/useCompanies.ts` | Extracted the fetch body into a `useCallback` (`load`), used by both the mount `useEffect` and the new returned `refetch`; return type is now `{ companies, loading, refetch }` (R1) |
| `src/modules/auth/components/AuthSheet.tsx` | `CompanyField` destructures `refetch` from `useCompanies()`; `handleCreate` awaits it (non-fatal) after the logo-upload block and before `onCompanyId(result.id)`; `creating` cleared on every exit path (R2/R4) |
| `docs/backlog.md` | Concise active-state entry for Task 639 (79 physical lines total, within the 80-line limit) |
| `docs/sessions/2026-07-20-task639-usecompanies-refetch-after-create.md` | This session log |

`git diff --stat` (actual):
```
 src/modules/auth/components/AuthSheet.tsx   |  8 +++++++-
 src/modules/companies/hooks/useCompanies.ts | 20 +++++++++++++-------
 2 files changed, 20 insertions(+), 8 deletions(-)
```
Only these two source files changed — `createCompanyAction` (`src/modules/companies/actions.ts`), `getCompanies`/`queries.ts`, the `/api/upload-company-logo` endpoint, `MantineCombobox`, `LocationCombobox`, `PasswordRequirementsHint`, `theme.ts`, all stories, and all i18n message files were NOT touched (confirmed via `git status --short` below and the QA-gate parity results). R3/AC3 confirmed.

## Positive and negative flows (applicability, per the kickoff's table)

| Branch | Applicable | Evidence |
|---|---|---|
| Create company (no logo) → appears selected, no reload | Yes | Code path traced (R2 ordering); **rendered live-app proof NOT captured in-sandbox — see Validation evidence §6 below** |
| Create company WITH logo → appears selected + `📷` | Yes | Code path traced (refetch runs after logo upload); **rendered live-app proof NOT captured in-sandbox** |
| `refetch()` network failure after successful create | Yes | Code inspection: `load`'s internal `try/catch` + `handleCreate`'s own `try/catch` around `await refetch()` both prevent an uncaught rejection; `setCreating(false)`/`onCompanyId`/reset all still run unconditionally afterward |
| `createCompanyAction` fails (`!result.id`) | Yes | Unchanged: early `return` after `setCreating(false)`, no `refetch()` call, form stays open — `git diff` shows this branch untouched |
| Signup submit (agent, company selected) | Yes (regression) | `signUpWithCaptcha.smoke.test.ts` green (unchanged wiring) |
| Other auth flows (login/recovery/phone/location) | Yes (regression) | `browser.smoke.test.ts`, `requestPasswordReset.smoke.test.ts`, `PhoneField.smoke.test.tsx` green |
| Concurrent double-submit of create | No | Pre-existing `if (creating) return` guard, unchanged, not in scope |
| Locale/viewport visual matrix | No | Logic-only change, no new/changed visible chrome |

## Validation evidence

1. `npm run typecheck` → **PASS**, `tsc --noEmit` exited with no output/errors.
2. `npm run check:stories` → **PASS** — "✅ check:stories PASSED — 120 files checked, 0 violations." (all 14 checks ran clean, including storybook.* key parity 627/627/627/627).
3. `npm run check:i18n` → **PASS** — "✅ Parity PASSED — all 4 locale files have identical key sets (2203 keys)." No new key added (unchanged 2203 in all 4 locales, confirming R6/AC5's "no new i18n key").
4. `npm run check:mojibake` → **PASS** — "check:mojibake: 0 artifacts in 1817 files."
5. **Critical-flow regression (all green, unchanged):**
   - `npx vitest run src/lib/auth/__tests__/browser.smoke.test.ts` → 1 file, 4 tests passed.
   - `npx vitest run src/modules/auth/actions/__tests__/signUpWithCaptcha.smoke.test.ts` → 1 file, 4 tests passed.
   - `npx vitest run src/modules/auth/actions/__tests__/requestPasswordReset.smoke.test.ts` → 1 file, 4 tests passed.
   - `npx vitest run src/components/shared/__tests__/PhoneField.smoke.test.tsx` → 1 file, 3 tests passed.
   - `npm run test:header-hydration-id-parity` → 1 file, 3 tests passed.
6. **Rendered (live app) — MISSING EVIDENCE, recorded explicitly, not waived:**
   - The dev server (`next dev --turbopack`) was confirmed already running on `http://localhost:3000` (`307` redirect response) at task start.
   - However, `createCompanyAction` (`src/modules/companies/actions.ts`) performs a real `INSERT` via the service-role admin Supabase client against `NEXT_PUBLIC_SUPABASE_URL` configured in `.env.local`. `docs/env.md` states there is no separate dev/staging Supabase project ("any preview/staging build will then also point at prod"), and Tasks 640/641 (duplicate-name detection, UNIQUE index) — which would prevent/dedupe accidental junk rows — are explicitly NOT yet implemented. Driving the real "+ add new" submit flow through a scripted/automated browser session in this sandbox would therefore write an un-authorized, non-cleanable row into what is very likely the single production `companies` table.
   - Given that risk and the absence of an explicit owner go-ahead to write test data into that table, this session did **not** execute the actual create-company submit against the live app. This is recorded as missing evidence per the task's own fallback clause ("If the sandbox cannot run the live app, record it as missing evidence with the exact owner-native command and expected result").
   - **Exact owner-native command to capture this evidence** (run natively in PowerShell, with `npm run dev` already running):
     ```powershell
     # 1. Open the app in a browser at http://localhost:3000/sq (or any locale)
     # 2. Dispatch the auth-sheet open event with the agent-registration view, e.g. via the browser console:
     #    window.dispatchEvent(new CustomEvent('lero:open-auth-sheet', { detail: { view: 'register-agent' } }))
     # 3. In the Company field, click "+ add new", type a test company name, click "Add" (no logo) —
     #    confirm the trigger shows the new company selected immediately, no page reload.
     # 4. Repeat with a logo file selected — confirm opening the list shows the 📷 marker on the new row
     #    and it is selected in the trigger.
     ```
   - Expected result per R2/AC2: in both cases, the company-select trigger shows the newly created company as the selected value immediately (no reload), and the with-logo case shows `📷` on that row when the list is reopened.
   - This is the primary evidence gap for R2/AC2 and is flagged explicitly for the orchestrator; it is **not** waived by the code-path reasoning above (task instruction: "this owner-reproducible flow ... cannot be waived by code-path assertion alone").
7. `git status --short` / `git diff --stat`:
   ```
   M src/modules/auth/components/AuthSheet.tsx
   M src/modules/companies/hooks/useCompanies.ts
    src/modules/auth/components/AuthSheet.tsx   |  8 +++++++-
    src/modules/companies/hooks/useCompanies.ts | 20 +++++++++++++-------
    2 files changed, 20 insertions(+), 8 deletions(-)
   ```
   Matches the task's expected touch set exactly (plus `docs/backlog.md` and this session log, both untracked-diff-visible via their own edits). No other file touched — `createCompanyAction`/`getCompanies`/logo endpoint/`MantineCombobox`/`theme.ts`/stories/i18n messages all confirmed untouched (also implied by the unchanged 2203/2203/2203/2203 i18n parity count and the 0-violation `check:stories` run).

## Visual source trace

Not applicable — this is a logic-only fix in a client data hook and one event handler. No JSX, className, style prop, or visible markup was added or changed; the pre-existing `MantineCombobox`/`InputLabel` chrome (Task 638) is unmodified. No canonical UI decision record is required (task type: "logic bug-fix ... No new UI element, no new i18n key, no styling").

## Canonical UI decision record

Not applicable — no visible artifact changed (see Visual source trace above).

## Self-review findings

- Re-read both changed files after editing (see Before/after sections) — confirmed the edits match the intended diff exactly, no stray changes.
- Confirmed `load`'s `useCallback` has an empty dependency array and closes over only the module-level `getCompanies` and the `setCompanies` state setter (both referentially stable across renders in React), so `refetch` is safe to call from an event handler and would be safe in a dependency array (AC1's "referentially stable" requirement).
- Confirmed `creating` is cleared on both the early-return branch (unchanged, pre-existing `setCreating(false)`) and the success branch (moved `setCreating(false)` to run after the `refetch` try/catch, still before `onCompanyId`) — no path leaves the create button permanently disabled.
- Confirmed no `loading`-state repurposing: `loading` is set only once, by the mount effect's `.finally`; `refetch`/`load` calls from `handleCreate` never touch `setLoading`.
- Verified via `git diff --stat` that no file outside the two owned source files changed.
- Remaining gap: the R2/AC2 live-app rendered proof (§6 above) — not captured, explicitly flagged, with the owner-native reproduction steps and risk rationale recorded.

## Assumptions, deviations, and limitations

- No deviation from the kickoff's specified `refetch` signature, ordering, or robustness requirements.
- Assumption (stated, not silently made): the configured Supabase project is the single production-equivalent project referenced by `docs/env.md`, with no isolated dev/staging database available in this sandbox for safe write-testing; this is why the live create-flow was not executed. If the owner has a dedicated non-prod Supabase project or accepts the write, the rendered proof can be captured directly with the PowerShell steps above.
- `load`'s internal `try/catch` (needed so `refetch()`'s returned promise never rejects, matching the previous `.catch(console.error)` semantics exactly) plus `handleCreate`'s own `try/catch` around `await refetch()` is intentionally double-layered per the kickoff's explicit instruction to wrap the call in `handleCreate` "so a refetch failure is non-fatal per R4" — this is not redundant scope creep, it satisfies the literal instruction on top of the hook's own safety.

## Opus handoff

- Evidence locations: this session log (before/after code, all command output); `git diff` / `git status --short` (verified above); `docs/backlog.md` (Task 639 entry, 79 physical lines, no `BACKLOG LIMIT BREACH`).
- **Primary open risk for review:** R2/AC2's rendered live-app proof (create-without-logo → selected-no-reload; create-with-logo → `📷` in list) was not captured because doing so would write real rows to what appears to be the single (production) Supabase `companies` table, with no dedup/cleanup mechanism yet in place (Tasks 640/641 not done). The orchestrator should either (a) direct the owner to run the exact PowerShell reproduction steps in §6 and report back, or (b) explicitly authorize a sandboxed/test-data write with an agreed cleanup plan before this task can be considered fully Q4-verified.
- Please confirm the double `try/catch` (inside `load` + around `await refetch()` in `handleCreate`) is the intended robustness posture, not unwanted duplication, given the kickoff's literal wording quoted above.
