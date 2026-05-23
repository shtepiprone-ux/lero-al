# Epic T — Global UX Polish & Forms

**Status:** OPEN — opened 2026-05-22 by the Opus 4.7 orchestrator.
**Source notes:** issues.txt #35 (audit all user actions, add toast feedback), #36 (required-field validation: highlight unfilled fields + scroll to them on profile/listing edit), #2 ("Перекласти" button still on the listing page although Google/DeepL APIs were removed in Task 102).
**Kickoffs:** `Epic_T_kickoff_prompts.md` (Tasks 205–207).

## Goal

Consistent action feedback (toasts), guided required-field validation, and removal of the dead translate
button — small but high-visibility UX correctness.

## Dependencies

- Toast system already in use (Tasks 100/35 reference "Save" toasts); listing/profile forms
  (`src/modules/listings/components/ListingFormShell.tsx`, cabinet `ProfileTab.tsx`, admin edit screens);
  `src/modules/listings/components/ListingDescriptionTranslator.tsx` + `src/app/api/translate/route.ts`
  (note: Task 102 removed the providers — confirm what remains).

## Tasks

### Task 205 — T.1 — Action toasts audit + implementation (Note 35)

**Type:** UX
**Priority:** medium
**Area:** all user actions across roles

**Pre-read:**
1. docs/backlog.md, docs/ai-behavior.md (Global Change Verification Rule)
2. Always-governed: docs/env.md, docs/rls-rules.md, docs/component-rules.md
3. docs/ui-rules.md, Task 100 session log (admin save toast); the canonical toast component
**Localization coverage:** sq, en, uk, it (every toast message × 4).
**Responsive coverage:** 320, 375, 390, 768, 1280, 1440, 2560.

**Goal:** Audit every action a user (any role) can perform and add a consistent toast after it (Save,
Delete, Update, etc.). Use the existing canonical toast — do not introduce a second toast system.

**Acceptance criteria:**
- A documented inventory of actions + their toasts (session log); each meaningful action shows a
  localized success/error toast via the canonical toast.
- 0 new lint/typecheck errors; `npm run build` passes; all four locales; all 7 breakpoints.

**Out of scope:** field-level validation (T.2).

### Task 206 — T.2 — Required-field validation UX: highlight + scroll-to (Note 36)

**Type:** feature / UX
**Priority:** medium
**Area:** profile + listing edit forms (site and admin)

**Pre-read:** docs/component-rules.md, docs/ui-rules.md; `src/modules/listings/components/ListingFormShell.tsx`,
`src/modules/listings/validations/index.ts`, cabinet `ProfileTab.tsx`, admin edit screens; `react-hook-form` usage.
**Localization coverage:** sq, en, uk, it (validation messages × 4).
**Responsive coverage:** all 7 breakpoints.

**Goal:** On profile/listing edit (site and admin), all required fields must be filled. If a required
field is empty on submit, highlight it visibly and scroll to the first invalid field (when the form
scrolls), so the user can see what's missing.

**Acceptance criteria:**
- Empty required fields are highlighted on submit; the form scrolls to the first invalid field.
- Behaviour consistent across site and admin forms; localized messages × 4.
- 0 new lint/typecheck errors; `npm run build` passes; all four locales; all 7 breakpoints.

**Out of scope:** toasts (T.1).

### Task 207 — T.3 — Remove the dead "Перекласти" button (Note 2)

**Type:** chore / bug
**Priority:** low
**Area:** listing detail description

**Pre-read:** Task 102 session log (Google Translate + DeepL removed); `src/modules/listings/components/ListingDescriptionTranslator.tsx`,
`src/app/api/translate/route.ts`, the listing detail page usage; docs/ai-behavior.md (Global Change Verification Rule).
**Localization coverage:** sq, en, uk, it (remove any now-dead translate strings, keep catalogs in parity).
**Responsive coverage:** all 7 breakpoints.

**Goal:** Task 102 removed the Google/DeepL translation APIs but the "Translate" button remains on the
listing description. Remove the button and any now-dead translator code/route/strings.

**Acceptance criteria:**
- The "Translate" button is gone from the listing description; dead translator code/route removed.
- No orphaned i18n keys left mismatched across the four catalogs.
- 0 new lint/typecheck errors; `npm run build` passes; all four locales; all 7 breakpoints.

**Out of scope:** reintroducing any translation feature.

## Epic-level acceptance

Consistent localized toasts on actions; required-field highlight + scroll on edit forms; the dead
translate button and its code removed.
