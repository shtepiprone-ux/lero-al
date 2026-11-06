# Task 926 — Nobody without a session creates a company or uploads a logo

Sprint 93 (governance reset; rewritten 2026-11-06 from the Sprint 78 kickoff, which is withdrawn). Priority **P0**
(OWASP Authorization: deny by default; File Upload). Owner decisions of 2026-10-18 (Task 923 review 8), translated:
D1 "do not allow creating a company during sign-up; a company is created only by a signed-in agent with a confirmed
e-mail, in the cabinet"; D2 the note under the sign-up picker: "If you did not find your company, you can create it
in your cabinet". The rest of the old Task 926 (one company model, cabinet creation, migration of the free text) is
Task 949. Implementer: Sonnet. Reviewer: Opus.

## Goal

`createCompanyAction` (`src/modules/companies/actions.ts:25-62`) is a server action with **no authorization**: any
anonymous POST inserts a row into `companies` through the service role (`:44-48`) and receives a grant
(`:61`) that lets it upload a file to Cloudinary through `/api/upload-company-logo` (`route.ts:46`). The new
company appears at once in every agent's sign-up picker. The allowlist entry that permits this
(`src/__tests__/security/serverEntryGuards.test.ts:93`) says "bounded and rate limited" — the action has no rate
limit. The sign-up calls it at `src/modules/auth/components/AuthSheet.tsx:417`.

After the task: creating a company and setting its logo require staff with `companies.manage`; the sign-up only
picks an existing company and shows the D2 note.

## Scope

- `src/modules/companies/actions.ts`: `createCompanyAction` starts with `assertAdminOrMod()` like `updateCompanyAction`;
  the grant is no longer created or returned; the comment about registration is removed.
- `src/app/api/upload-company-logo/route.ts`: staff only — the `grant` branch, its `logo_exists` rule for grants and
  the header lines about the grant are removed.
- `src/lib/uploads/uploadGrant.ts`: delete it if `company-logo` is its only kind and nothing else imports it
  (grep; state the result); its test goes with it.
- `AuthSheet.tsx`: the inline add-company panel (`MantineAddItemPanel`, name field, logo picker, duplicate state,
  `handleCreate`, the logo state and their imports) is removed; the picker keeps its label and gets the D2 note as
  the field description (`MantineCombobox`/`MantineSelect` description slot; the theme places it below the input,
  `src/design-system/mantine/theme.ts` `inputWrapperOrder`). New i18n key in all four locales (`sq`, `en`, `uk`,
  `it`); `uk` is the owner's text verbatim: «Якщо ви не знайшли свою компанію, ви можете її створити у своєму
  кабінеті».
- Stories: `RegisterAgentAddCompany` and `RegisterAgentAddCompanyLogo` in
  `src/stories/patterns/mantine/AuthSheet.stories.tsx` are deleted; `RegisterAgent` shows the note. Remove their
  rows from `scripts/rendered-interaction-states.json` and any other registry the product checks name.
- `serverEntryGuards.test.ts:93`: the exception for `createCompanyAction` is removed (it is now guarded).
- Unused i18n keys of the removed panel are deleted from all four locales.
- Out of scope: the cabinet free-text company field (stays until Task 949), the admin companies page behaviour
  (unchanged — staff still create there), the database.
- Dependencies: none.

## Attack surface

Changed (an entry point loses an anonymous path). Threat model:
- T1 Elevation/Spoofing: an anonymous or ordinary signed-in user creates a company → `assertAdminOrMod()` first, before
  any input is read from the database.
- T2 Tampering/DoS (storage): an anonymous upload to Cloudinary → the route accepts staff only; the grant code is gone.
- T3 Information disclosure: the duplicate answer told a stranger a company id → only staff receive it now.

Security tests (`.claude/rules/security-testing.md`), in `companyActions.security.test.ts` and
`upload-company-logo/__tests__/route.security.test.ts`:
- SEC-926-CREATE-DENY: anonymous → `unauthorized`; signed-in agent and ordinary user → `forbidden`; moderator without
  `companies.manage` → `forbidden`; in every case **no** insert call reaches the database mock.
- SEC-926-CREATE-ALLOW: administrator, and moderator with `companies.manage` → the row is inserted; no `logoGrant` key.
- SEC-926-LOGO-DENY: anonymous with a well-formed `grant` field → 403 and no Cloudinary call.
- SEC-926-LOGO-ALLOW: staff with `companies.manage` → upload proceeds (existing case kept).
- Deliberate break: remove the `assertAdminOrMod()` line → CREATE-DENY fails; paste the failing output, restore.

## UI

Sign-up (agent): the picker loses "+ add new" and its panel; the D2 note appears below the input in the shared field
description style (one look, canonical `MantineCombobox`). Mobile: no new geometry; the note wraps under the input at
320 px. No new component or token.

## Acceptance criteria

- AC1 SEC-926-CREATE-DENY/ALLOW in `src/modules/companies/__tests__/companyActions.security.test.ts` and
  SEC-926-LOGO-DENY/ALLOW in `src/app/api/upload-company-logo/__tests__/route.security.test.ts` pass
  (`npx vitest run` on both files); each DENY case fails when `assertAdminOrMod()` is removed (output in the report).
- AC2 `src/__tests__/security/serverEntryGuards.test.ts` has no exception for `createCompanyAction` and passes; a new
  assertion in it fails if any `'use server'` export under `src/modules/companies` lacks a staff guard.
- AC3 `src/modules/auth/components/__tests__/AuthSheet.registerAgent.test.tsx` (new): for `uk` and `sq` the agent
  sign-up renders the D2 note as the picker's description (the owner's `uk` text verbatim, after the input in DOM order)
  and no "add company" option or panel; the `RegisterAgent` Story's play function in
  `src/stories/patterns/mantine/AuthSheet.stories.tsx` asserts the same and runs in `node scripts/check-locale-leak.mjs`.
- AC4 `npm run lint`, `npm run typecheck`, `npm test`, `npm run build-storybook`, `node scripts/quality/check-files.mjs --worktree` and
  `node scripts/quality/changed-lines-coverage.mjs --base main` (after `npx vitest run --coverage`) exit 0;
  `node scripts/quality/product-gates.mjs` shows no new failure versus before.

## Route

1. Write SEC-926-CREATE-DENY and SEC-926-LOGO-DENY first; run them; they fail on today's code (paste).
2. Guard the action, strip the grant path from the route; the tests pass.
3. Sign-up: remove the panel, add the note and keys; update Stories and registries.
4. Write the AC2 assertion and the AC3 test and play function; run AC1–AC4. Report each command, exit code and
   relevant output.

## Review
