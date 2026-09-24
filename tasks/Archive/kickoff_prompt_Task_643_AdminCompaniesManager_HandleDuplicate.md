# Task 643 — `AdminCompaniesManager` create flow must react to `createCompanyAction`'s new `duplicate` result: show an "already exists" toast and stop, instead of silently reusing the existing company id, overwriting its logo, and showing a false "created" toast

- **Task number:** 643
- **Epic:** none (Task 640 follow-up — orchestrator review finding F2, owner chose option B on 2026-07-20).
- **Parent / origin:** Task 640 made `createCompanyAction` return `{ id, duplicate: true }` on a name collision instead of inserting a second row. `AdminCompaniesManager`'s create flow (`CompanyFormDialog.handleSubmit`) only checks `if (!result.id)`, so it ignores the new `duplicate` flag and proceeds as if it created the company. Consequences on the admin surface: (a) if a logo was selected, `uploadLogo(existingId)` **overwrites the existing company's logo** — an unintended mutation of a company the admin did not choose to edit; (b) a misleading `success_created` toast fires though nothing was created; (c) `onDone` reports `agentCount: 0` and `created_at: now` for the existing company, briefly misrendering its list row. Owner decision (2026-07-20): **option B** — teach the admin create flow to detect the duplicate, show a distinct toast, and NOT upload a logo onto the existing company.

## Mode and task type

- **Mode:** implementation kickoff for a fresh Sonnet session (execute via `.claude/skills/execute-task/SKILL.md`).
- **Task type:** small logic fix in one admin client component (`AdminCompaniesManager.tsx`, the `CompanyFormDialog.handleSubmit` create branch) + one new i18n key in all four locales. No server-action change (Task 640's `createCompanyAction` is already correct), no auth-flow change.

## Objective

In `src/components/admin/AdminCompaniesManager.tsx` `CompanyFormDialog.handleSubmit`, on the create path, branch on `result.duplicate` BEFORE the logo upload / success toast / `onDone`: show a localized "a company with this name already exists" toast and return early, so no logo is uploaded onto the existing company, no false "created" toast fires, and no misleading `onDone` runs. The edit path (`updateCompanyAction`) is unchanged.

## Verified context

Inspected on 2026-07-20 against `HEAD` (Task 640 implemented; working tree has the 640 diff uncommitted — this task is designed against the post-640 `createCompanyAction` contract). Reference by structure/id.

### `createCompanyAction` contract (post-Task-640, `src/modules/companies/actions.ts`)

Returns `{ id?: string; duplicate?: boolean; error?: string }`. On a name that already exists (matched by `trim().toLowerCase()`), it returns `{ id: existingId, duplicate: true }` and inserts nothing. On a genuinely new name it returns `{ id }`. Length guards return `{ error }`. **Not changed by this task.**

### The admin create flow — `CompanyFormDialog.handleSubmit` (`AdminCompaniesManager.tsx`, current)

```ts
function handleSubmit() {
  if (!name.trim()) { toast.error(t('error_name_required')); return }

  startTransition(async () => {
    let companyId = company?.id

    if (company) {
      // Edit
      const result = await updateCompanyAction(company.id, name)
      if (result.error) { toast.error(t('error_save_failed')); return }
    } else {
      // Create
      const result = await createCompanyAction(name)
      if (!result.id) { toast.error(t('error_save_failed')); return }
      companyId = result.id
    }

    let newLogoUrl = currentLogoUrl
    if (logoFile && companyId) {
      setUploading(true)
      const uploaded = await uploadLogo(companyId)
      setUploading(false)
      if (uploaded) newLogoUrl = uploaded
    }

    toast.success(company ? t('success_updated') : t('success_created'))
    if (logoPreview) URL.revokeObjectURL(logoPreview)
    onDone({ id: companyId!, name: name.trim(), logo_url: newLogoUrl, created_at: company?.created_at ?? new Date().toISOString(), agentCount: company?.agentCount ?? 0 })
  })
}
```

- `t = useTranslations('admin.companies')`. Existing keys include `error_name_required`, `error_save_failed`, `success_created`, `success_updated`, `success_deleted`, `error_delete_failed`. **`error_duplicate` does NOT exist yet.**
- `toast` is `sonner`'s toast (`toast.error` / `toast.success` already used here).
- The problem is purely in the `else` (create) branch: it must handle `result.duplicate` before falling through to the shared logo-upload + toast + `onDone` block.

## Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Owner directive B | In the create branch, when `result.duplicate` is truthy, `handleSubmit` shows `toast.error(t('error_duplicate'))` and returns early — before `uploadLogo`, before the success toast, before `onDone` | P0 | `git diff`; rendered — admin create with an existing name shows the duplicate toast and does nothing else | Confirmed |
| R2 | Owner concern (logo overwrite) | On a duplicate, `uploadLogo` is NOT called, so the existing company's `logo_url` is not overwritten | P0 | `git diff` — the early return precedes the `if (logoFile && companyId)` block; reasoned inspection | Confirmed |
| R3 | Behavior parity | The genuinely-new-name create path (insert → logo upload → `success_created` → `onDone`) and the entire edit path (`updateCompanyAction`) are unchanged | P0 | `git diff` scoped to the create branch + the new key; admin create of a new name still works | Confirmed |
| R4 | i18n | `admin.companies.error_duplicate` added to all four locales (`sq/en/uk/it`) with the strings below; no other key changed; parity preserved | P0 | `check:i18n` exit 0, key sets identical | Confirmed |
| R5 | Gates | `typecheck`, `check:stories`, `check:i18n`, `check:mojibake` all green | P0 | Commands exit 0 | Confirmed |

## Assumptions and open questions

- **Toast tone:** use `toast.error` (consistent with the sibling `error_save_failed`/`error_name_required` toasts in this component). A duplicate is a rejected action; `toast.error` is the established pattern here. Do not add a Select affordance — the admin already has the full company list/table to find and edit the existing company (unlike the auth flow, which is a narrow overlay). Owner directive B is specifically "distinct toast + no logo upload," not a select button.
- **New i18n string (provided — do not invent):** `admin.companies.error_duplicate`: `sq` = "Një kompani me këtë emër ekziston tashmë.", `en` = "A company with this name already exists.", `uk` = "Компанія з такою назвою вже існує.", `it` = "Un'azienda con questo nome esiste già." (same wording as Task 640's `auth.company_exists`, but placed in the `admin.companies` namespace beside the other admin toasts). Place it near the sibling `error_*` keys, preserving each file's ordering/formatting; verify valid JSON (clause 14).
- **Edit-rename collision is out of scope:** renaming a company (edit path) to an existing name goes through `updateCompanyAction`, which has no duplicate check. Owner asked only about the create-collision logo overwrite. Note it as a possible future task; do not change `updateCompanyAction` here.
- **No change to `createCompanyAction`, the auth `CompanyField`, `uploadLogo`, `onDone`'s shape, or the DB.** Task 641 (UNIQUE index + dedup) and Task 642 (drop `📷`) remain separate.

## Pre-read rule bundle

- `docs/agent-contract.md` (clauses 1 scope, 3 capabilities-reachable, 7 i18n four-locale, 9 validation evidence, 14 file integrity).
- `docs/rule-index.md` (admin UI + i18n routing).
- `docs/qa-profiles.md` (Q2 — targeted admin CRUD behavior; not the P0 auth critical flow).
- `docs/component-rules.md` (i18n, container/presentational), `docs/data-access-rules.md` (server-action result handling), `docs/domain-rules.md` (company rules).
- Source: `src/components/admin/AdminCompaniesManager.tsx` (`CompanyFormDialog.handleSubmit`, `uploadLogo`, target), `src/modules/companies/actions.ts` (`createCompanyAction` contract, unchanged, context), `messages/{sq,en,uk,it}.json` (i18n).

## Scope

1. `src/components/admin/AdminCompaniesManager.tsx` — in `CompanyFormDialog.handleSubmit`'s create (`else`) branch, add `if (result.duplicate) { toast.error(t('error_duplicate')); return }` before `if (!result.id) …` (or immediately after obtaining `result`, before setting `companyId`). The early return must precede the shared logo-upload/toast/`onDone` block.
2. `messages/{sq,en,uk,it}.json` — add `admin.companies.error_duplicate` with the provided strings.
3. Produce the Q2 rendered/behavioral + gate evidence (verification plan).
4. Write the session log + a concise `docs/backlog.md` active-state entry (keep ≤80 lines; flag `BACKLOG LIMIT BREACH` if needed).

## Out of scope

- `createCompanyAction`, the auth `CompanyField`/AuthSheet, `updateCompanyAction` (edit-rename collision), `uploadLogo` internals, `onDone` shape, the DB.
- Tasks 641 (UNIQUE index + dedup) and 642 (drop `📷`).
- Adding a "Select existing" affordance to the admin dialog (not requested; admin has the table).

## Current and required behavior

- **Current:** admin creates a company with a name that already exists → `createCompanyAction` returns `{ id: existingId, duplicate: true }` → the create branch ignores `duplicate`, sets `companyId = existingId`, uploads any selected logo onto the existing company (overwrite), fires `success_created`, and calls `onDone` with `agentCount: 0`.
- **Required after:** admin creates with an existing name → a localized "already exists" toast appears and the handler returns immediately; no logo upload, no success toast, no `onDone`. A genuinely-new name still creates + uploads + reports success as before. Edit path unchanged.

## Positive and negative flows

**Positive:** admin opens the company form, types a NEW name (optionally with a logo) → create → insert → logo upload → `success_created` → `onDone` (unchanged). Separately: types an EXISTING name → create → `createCompanyAction` returns duplicate → "already exists" toast, handler returns, existing company untouched.

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Create new name (no logo) | **Yes (regression)** | R3 | insert → success_created → onDone, unchanged | Rendered/behavioral: new name still creates |
| Create new name WITH logo | **Yes (regression)** | R3 | insert → logo uploaded to the NEW company → success | Reasoned/rendered |
| Create existing name (no logo) | **Yes** | R1 | duplicate toast, early return, nothing created | Rendered: toast shown, no new row |
| Create existing name WITH logo | **Yes** | R1/R2 | duplicate toast, early return, **existing company's logo NOT overwritten** | Rendered/behavioral: existing logo unchanged after the attempt |
| Edit existing company (updateCompanyAction) | **Yes (regression)** | R3 | unchanged | Code inspection / `git diff` |
| Name-required guard (empty) | **Yes (regression)** | R3 | `error_name_required` toast, unchanged | Code inspection |
| Locale expansion (duplicate toast sq/uk/it) | **Yes** | R4 | localized toast in each locale | Rendered or key-parity check |

## Acceptance criteria

- `AC1 [R1,R2]` Given the admin company create form, when the admin submits a name that already exists, then a localized "already exists" toast appears, the handler returns before any logo upload/success toast/`onDone`, and the existing company's logo is not changed.
- `AC2 [R3]` Given a genuinely-new name, then the create path (insert → logo upload → `success_created` → `onDone`) still works; the edit path and the empty-name guard are unchanged.
- `AC3 [R4]` Given the four locale files, then `admin.companies.error_duplicate` exists in all four with the provided strings and `check:i18n` parity passes.
- `AC4 [R5]` Given the repo after the change, when typecheck + check:stories + check:i18n + check:mojibake run, then all exit 0.

## QA profile and verification plan

**Profile: Q2 Targeted** (admin CRUD behavior on a non-critical-flow surface; the change is a single early-return guard + one i18n key). Record actual output for each:

1. `npm run typecheck` → 0 errors.
2. `npm run check:stories` → exit 0.
3. `npm run check:i18n` → parity holds with the new key in all four locales.
4. `npm run check:mojibake` → 0 artifacts.
5. **Rendered/behavioral (admin surface):** with an existing company present, open the admin Companies manager → "New company" → type the existing company's name, select a logo, submit; capture the "already exists" toast and confirm no new row is added and the existing company's logo is unchanged. Then create a genuinely-new name and confirm it still creates (regression). If the sandbox cannot drive the admin UI, record it as missing evidence with the exact owner-native command + expected result and request the owner run the repro. (No auth smokes needed — this surface is not in the auth critical-flow registry; note that explicitly.)
6. `git status --short` / `git diff --stat` → only `src/components/admin/AdminCompaniesManager.tsx`, `messages/{sq,en,uk,it}.json`, `docs/backlog.md`, and the new session log. Classify any harness side-effect as `EXCLUDED AS UNRELATED`.

If a required check cannot run in the sandbox, record it as missing evidence with the exact owner-native PowerShell command (`npm.cmd` / `npx.cmd`) + expected result; never substitute a confidence claim.

## Completion report contract

Write `docs/sessions/2026-07-20-task643-admincompaniesmanager-handle-duplicate.md` + a concise `docs/backlog.md` update. Include: a Files Changed table matching the real diff; R1–R5 each with evidence; the before/after of the create branch; the i18n key+strings per locale; typecheck/check:stories/check:i18n/mojibake results; the rendered/behavioral proof (duplicate toast + existing-logo-unchanged + new-name-still-creates); explicit confirmation that `createCompanyAction`, the auth `CompanyField`, `updateCompanyAction`, `uploadLogo`, and `onDone`'s shape were NOT touched. Final status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED` — never self-approval. Do not run or emit mutating git.

Handoff: execute via `.claude/skills/execute-task/SKILL.md` against this file path.

## Task quality gate

- A fresh Sonnet session can execute this without chat context: the exact create-branch location, the post-640 `createCompanyAction` contract, the early-return fix, the provided 4-locale string + placement, the out-of-scope siblings (edit-rename, 641/642, Select affordance), and the Q2 rendered/behavioral + gate matrix are all named. ✅
- Every P0 requirement has a binary AC and a verification method; the logo-overwrite prevention (the owner's specific concern) is an explicit AC. ✅
- Scope protects the new-name create path, the edit path, and the empty-name guard, and names what must not change. ✅
- i18n: one new key, four locales, string provided (no invented translation); parity gate named. ✅
- Negative flows selected by applicability (new-name regression / existing no-logo / existing with-logo / edit / empty-guard / locale in). ✅
- Profile correctly Q2 (admin CRUD, not the auth critical flow) with a concrete behavioral proof for the logo-overwrite fix; no auth smokes required (surface not in the critical-flow registry). ✅
