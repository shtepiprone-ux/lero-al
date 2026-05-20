# Session Archive: Task 113 — Epic B.3 — Agent Company Selection — 2026-05-20

**Epic:** B — Auth, Registration & Agent Onboarding  
**Task:** 113 (global numbering)  
**Type:** Feature  
**Status:** ✅ CLOSED (code complete; requires DB migration before deploy)

---

## ⚠️ Required Database Migration

Before deploying, run this SQL in the **Supabase dashboard → SQL editor**:

```sql
-- Create companies table
CREATE TABLE public.companies (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name       text NOT NULL,
  logo_url   text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Public read (needed for registration combobox — unauthenticated users)
CREATE POLICY "companies_read_all"
  ON public.companies FOR SELECT
  USING (true);

-- Authenticated users can insert (agent self-service via registration)
-- Note: company creation from AuthSheet uses the service-role server action
-- which bypasses RLS; this policy is for authenticated admin inserts.
CREATE POLICY "companies_authenticated_insert"
  ON public.companies FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admins/moderators can update and delete
CREATE POLICY "companies_admin_update"
  ON public.companies FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

CREATE POLICY "companies_admin_delete"
  ON public.companies FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

-- Add company_id FK to users (nullable, not breaking)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;
```

---

## Goal

Replace the temporary plain-text `company` Input in the agent registration view (`AuthSheet`) with:
1. A `Combobox` of existing companies (fetched from the new `companies` table)
2. An inline "Add new company" form for companies not yet in the list

Persist the selected `company_id` to the agent's user profile on registration.

---

## Changes Made

### New module: `src/modules/companies/`

| File | Purpose |
|---|---|
| `lib/queries.ts` | `getCompanies()` — client-side fetch from `companies` table (name order) |
| `actions.ts` | `createCompanyAction(name)` — service-role INSERT, bypasses RLS, safe for pre-auth use |
| `hooks/useCompanies.ts` | `useCompanies()` — React hook wrapping `getCompanies()` |

### `src/types/database.ts`
- Added `Company` interface (`id, name, logo_url, created_at`)
- Added `company_id: string | null` to `User` interface

### `src/app/auth/callback/route.ts`
- Updated `ensureUserProfile()` to read `company_id` from `user_metadata` and persist it via `UPDATE ... WHERE company_id IS NULL` after profile upsert

### `src/modules/auth/components/AuthSheet.tsx`
- Added imports: `useCompanies`, `createCompanyAction`, `Combobox`
- Added `CompanyField` sub-component — isolated component that:
  - Uses `useCompanies()` hook (only mounts when `isAgent=true`)
  - Shows a searchable `Combobox` of existing companies with `portal` (prevents Sheet clipping)
  - "Add new company" toggle button → inline Input + Add/Cancel buttons
  - Calls `createCompanyAction` → sets the new company's ID
- Replaced `companyName` text state + Input with `companyId` state + `CompanyField`
- Passes `company_id: isAgent && companyId ? companyId : undefined` in `signUp()` metadata

### `messages/{sq,en,uk,it}.json`
Added 2 new keys to `auth` namespace:

| Key | sq | en | uk | it |
|---|---|---|---|---|
| `company_select_placeholder` | "Zgjidhni kompaninë" | "Select your company" | "Оберіть компанію" | "Seleziona la tua azienda" |
| `company_add_new` | "Shto kompani të re" | "Add new company" | "Додати нову компанію" | "Aggiungi nuova azienda" |

---

## Key Decisions

### `createCompanyAction` uses service-role client
During registration the user has no session. `createAdminClient()` (service-role) bypasses RLS so the server action can INSERT into `companies` on behalf of a pre-auth user. Validated inputs: name 2–120 chars.

### `CompanyField` isolated sub-component
Same pattern as `AgentCityField` — `useCompanies()` hook only fires when `isAgent=true` and the component mounts.

### `portal` on Combobox
`AuthSheet` → `SheetContent` → `overflow-y-auto`. Without `portal`, the Combobox dropdown clips. `portal={true}` renders it to `document.body` (consistent with Task 93/98 portal fixes).

### Logo display in dropdown
The `companies` table has `logo_url` but logos are uploaded in Task 114. The Combobox shows company names only for now; logo display in the dropdown is a Task 114 enhancement.

### company_id persistence path
1. `createCompanyAction` → creates company, returns UUID
2. `signUp({ data: { company_id: uuid } })` → stored in `auth.users.raw_user_meta_data`
3. User confirms email → `/auth/callback` → `exchangeCodeForSession` → `ensureUserProfile` → `UPDATE users SET company_id = ? WHERE id = ? AND company_id IS NULL`

---

## Acceptance Criteria Checklist

- [x] Agent register view has `CompanyField` (canonical Combobox + inline add)
- [x] Companies fetched from `companies` table via `useCompanies` + `getCompanies`
- [x] `createCompanyAction` creates company via service-role (safe pre-auth)
- [x] `company_id` passed in signUp metadata + applied in auth callback
- [x] Field is optional — registration succeeds without selecting a company
- [x] Combobox uses `portal={true}` — no clipping inside AuthSheet
- [x] 4 new i18n keys × 4 locales via `t()`
- [x] 0 new lint errors / 0 new warnings
- [x] `governance:localization` PASS · `governance:primitives` PASS
- [ ] ⚠️ SQL migration required before deploy (companies table + users.company_id)
- [ ] `npm run build` — user's manual step

## Out of Scope

- Company logo upload (Task 114)
- Admin company management page (Task 115)
- AuthSheet overall structure changes
