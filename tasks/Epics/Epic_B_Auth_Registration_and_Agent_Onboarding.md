# Epic B — Auth, Registration & Agent Onboarding

**Status:** CLOSED ✅ (Tasks 108, 112–115) — see [`Epic_B_Summary_CLOSED.md`](./Epic_B_Summary_CLOSED.md)
**Opened:** 2026-05-19
**Numbering:** Global counter continues after Sprint 1.

## Goal

Redesign auth/registration as a side popup with smooth motion, add full agent onboarding (city, company with logo, company self-service for missing entries), and give admins a management page for companies.

## Dependencies

- Sprint 1 Task 94 (mobile auth UI) and Task 100 (admin form UX) should close first — they expose the current auth/form contracts.

## Tasks

### Task B.1 — Side popup login/register flow

**Type:** Feature / UX redesign
**Priority:** High
**Area:** Auth, header, modal/sheet system

**Pre-read:**
1. `docs/ai-behavior.md`, `docs/backlog.md`
2. `docs/ui-rules.md`, `docs/component-rules.md`, `docs/component-governance.md`
3. `docs/state-authority.md` (auth lifecycle)
4. `docs/rls-rules.md` (auth boundary)
5. `src/components/ui/sheet.tsx`, `src/components/ui/dialog.tsx`
6. Existing auth flow files

**Localization coverage:** sq, en, uk, it
**Responsive coverage:** 320, 375, 390, 768, 1280, 1440, 2560

**Goal:**
Replace the current login/register pages or modal with a canonical side popup (Sheet) with smooth enter/exit animation. Separate the "Register as agent" entry point with its own form.

**Acceptance criteria:**
- Login, Register (user), Register (agent) all open as side popup.
- Uses canonical `Sheet` (no custom `div.fixed.inset-0` overlays).
- Animation matches existing motion language.
- Form behavior: validation, error messages, success redirect — all locales.
- All four locales and seven breakpoints visually validated.

### Task B.2 — Agent city selection

**Type:** Feature
**Priority:** Medium-High
**Pre-read:** Same as B.1, plus `docs/data-access-rules.md`, `docs/domain-rules.md`
**Localization coverage:** sq, en, uk, it
**Responsive coverage:** All 7 breakpoints

**Goal:** Optional city dropdown in the agent registration form using canonical `Combobox`. City must reuse the same source used elsewhere in the project for cities.

**Acceptance criteria:** Optional city field, canonical Combobox, all locales, all breakpoints.

### Task B.3 — Agent company selection with logo display

**Type:** Feature
**Priority:** Medium-High
**Area:** Agent registration, companies table, Cloudinary
**Pre-read:** B.1/B.2 docs, plus `docs/integrations.md` (Cloudinary), `docs/data-access-rules.md` (new `companies` table queries)
**Localization coverage:** sq, en, uk, it
**Responsive coverage:** All 7 breakpoints

**Goal:** Dropdown of companies with logos. Agent can pick an existing company; if missing, can add a new one (see B.4 for logo rules). Backed by a `companies` table.

**Acceptance criteria:**
- New `companies` table with RLS rules drafted (see `docs/rls-rules.md`).
- Dropdown shows logo + name.
- "Add new company" entry triggers an inline create flow.

### Task B.4 — Company logo upload rules

**Type:** Feature / asset rules
**Priority:** Medium
**Area:** Image upload validation, Cloudinary
**Pre-read:** B.3, plus Epic H (Cloudinary Storage Hygiene) for folder structure
**Localization coverage:** sq, en, uk, it (validation messages)
**Responsive coverage:** All 7 breakpoints (preview UI)

**Goal:** Constrain company logo upload to ≤ 256×256px. Validate format (PNG / JPG / WebP). Show a preview before save.

**Acceptance criteria:**
- Server-side and client-side size/format validation.
- Preview before save.
- Cloudinary path `companies/<company_id>/logo.<ext>` (or per Epic H decision).
- All locales for error/success messages.

### Task B.5 — Admin company management page

**Type:** Feature
**Priority:** Medium
**Area:** Admin panel, companies table, CRUD
**Pre-read:** B.3/B.4, plus Epic K (Admin Tables Standardization)
**Localization coverage:** sq, en, uk, it
**Responsive coverage:** All 7 breakpoints

**Goal:** Admin / moderator page to create, edit, delete companies. Follow the canonical admin table behavior defined by Epic K (clickable name → preview dialog with edit/delete).

**Acceptance criteria:**
- Listing of all companies with logo, name, agent count.
- Create / edit / delete with confirmation.
- Behavior consistent with Users admin table.

## Epic-level acceptance

All five tasks closed; new tables (`companies`) integrated with RLS; auth flow rebuilt as side popup; agent onboarding produces complete profiles with city + company.
