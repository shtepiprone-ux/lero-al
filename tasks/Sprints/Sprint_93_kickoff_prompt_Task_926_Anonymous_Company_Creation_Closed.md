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


## OWASP

Required by `node scripts/quality/owasp.mjs plan` (757270a26306, mapping of 2026-11-07).

- Abuse_Case: "it is important to identify the attacks which the application must defend against" — anonymous company spam and anonymous uploads are the abuse cases T1 and T2 — AC1.
- AI_Agent_Security: not applicable — the task edits a rule text only to drop the stale exception; no agent permission changes.
- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — "## Attack surface" names each entry point the task adds, removes or changes — AC1, AC2.
- Authentication: not applicable — the sign-in and sign-up mechanics are unchanged; only the company picker loses its add panel.
- Authentication_Patterns: not applicable — the task adds no authentication code; the session check stays in lib/auth/server.ts.
- Authorization: "Permission should be validated correctly on every request, regardless of whether the request was initiated by an AJAX script, server-side, or any other source." — createCompanyAction and the logo route check the staff key on every request, before any read — AC1, AC2.
- Authorization_Decisions_And_Output_Handling: "Fail closed. Deny protected operations on PDP errors, timeouts, or unusable output." — no session or no key answers unauthorized or forbidden and nothing is inserted — AC1.
- Authorization_Patterns: "Keep enforcement close to the protected resource so it can check the requested action, object, and tenant." — assertAdminOrMod() is the first statement of the action and of the route — AC1.
- Authorization_Regression_Testing: "Relying on UI hiding is insufficient; the API layer must enforce the check" — the DENY cases call the action and the route directly, not through the sign-up form — AC1.
- Authorization_Testing_Automation: "Integration test cases validate the correct implementation of the authorization matrix." — serverEntryGuards fails for any unguarded server export under src/modules/companies — AC2.
- Bot_Management_and_Anti-Automation: not applicable — the anonymous path is removed instead of limited; no anonymous caller remains to rate-limit.
- Cookie_Theft_Mitigation: not applicable — no cookie is created or changed by removing the add-company panel.
- Credential_Stuffing_Prevention: not applicable — the sign-in path and its Turnstile check are unchanged by this task.
- Cross_Site_Scripting_Prevention: "Since no single technique will solve XSS, using the right combination of defensive techniques will be necessary to prevent XSS." — the changed AuthSheet parts render text through React escaping only; lint (react/no-danger, no-script-url) runs on them — AC4.
- Cryptographic_Storage: not applicable — the grant HMAC is deleted with uploadGrant.ts when company-logo is its only kind; nothing new is signed.
- Denial_of_Service: not applicable — the storage abuse path (T2) is removed; staff uploads keep their existing size limit.
- DOM_based_XSS_Prevention: "It is always a bad idea to use a user-controlled input in dangerous sources such as eval." — the changed AuthSheet parts add no eval, Function, innerHTML or computed URL; lint (no-eval, no-implied-eval) and client-sinks check them — AC4.
- File_Upload: "Validate the file type, don't trust the Content-Type header as it can be spoofed" — the logo route keeps its byte sniff and now accepts staff only — AC1.
- Identity_Propagation_Patterns: "Each receiving service must still authorize the requested action and resource." — the service-role insert runs only after the staff check of the caller — AC1.
- Injection_Prevention: not applicable — scripts/rendered-interaction-states.json loses two rows; no command or query is built.
- Input_Validation: not applicable — the task adds no input; argument schemas for every action are Task 955 (AC1 there).
- Insecure_Direct_Object_Reference_Prevention: "implement access control checks for each object that users try to access" — a stranger can no longer learn a company id from the duplicate answer; only staff reach it — AC1.
- JavaScript_and_TypeScript_Security: "Keep patterns linear: avoid nested quantifiers and ambiguous alternation over the same characters." — lint and CodeQL security-extended (CI) run on every changed file — AC4.
- Key_Management: not applicable — the task adds no key; deleting the grant removes one use of the derived key.
- LLM_Prompt_Injection_Prevention: not applicable — no agent tool or prompt boundary changes; one rule sentence is corrected.
- Mass_Assignment: not applicable — the action keeps its explicit field list; the task removes the grant field and adds no bindable field.
- MCP_Security: not applicable — no MCP server or tool permission changes in this task.
- Multifactor_Authentication: not applicable — staff MFA is Task 960; this task changes no sign-in factor.
- Nextjs_Security: "Rendering the form only on a protected page does not authenticate the action request." — the action is guarded although only staff pages render its form — AC1, AC2.
- Nodejs_Security: not applicable — the route keeps its runtime and body handling; only the grant branch is deleted.
- OS_Command_Injection_Defense: not applicable — the only script file touched is a JSON registry; no command call changes.
- Prototype_Pollution_Prevention: not applicable — no object is built from request keys; the change removes code paths only.
- REST_Security: "the access control decision should be taken locally by REST endpoints" — the logo route decides access itself: staff only, 403 for everyone else — AC1.
- Secrets_Management: not applicable — no secret is added, read or moved; the grant code that derived one is deleted.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — the review reads the whole diff; changed-line coverage and the file checks run on it — AC4.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — the executor's report is input: Opus reruns every acceptance command in review — AC4.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — the mitigations of the threat model are the acceptance criteria of this task — AC1, AC2.
- Serverless_FaaS_Security: "Enforce authentication and authorization on all triggers (API Gateway, Pub/Sub, S3, IoT)." — the upload route and the action refuse callers without the staff key — AC1.
- Session_Management: not applicable — no session cookie, lifetime or renewal changes; the AuthSheet change is presentational.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — "## Attack surface" answers them and each mitigation is an acceptance criterion — AC1, AC2.
- User_Privacy_Protection: not applicable — the task stores and shows no new personal data; it removes an anonymous write.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — a claim of the report that does not reproduce in review is a finding — AC4.
- Web_Frontend_Security: "The fundamental security rule is to never use innerHTML with untrusted data." — the changed AuthSheet parts use no innerHTML; lint (react/no-danger) fails on one — AC4.
- Web_Service_Security: not applicable — no new endpoint or schema; the logo route only loses its grant branch.

## UI

Sign-up (agent): the picker loses "+ add new" and its panel; the D2 note appears below the input in the shared field
description style (one look, canonical `MantineCombobox`). Mobile: no new geometry; the note wraps under the input at
320 px. No new component or token.

## Mobile adaptation record
- Scope: visible
- Surfaces: src/modules/auth/components/AuthSheet.tsx — the agent sign-up company picker and its note
- Component families: form-picker-and-choice
- Pattern IDs: form-stack
- Standards: w3c-labels-instructions, w3c-reflow, apple-hig-layout, android-content-structure
- Mantine mechanism: responsive-props
- Mantine owner: src/design-system/mantine/patterns/MantineCombobox.tsx
- Mobile range and switches: <640px (theme.other.mobileGate / sm): no new geometry, the note sits under the input; 640px transition unchanged
- Mobile order: label → input → note → error
- Required-content treatment: the note wraps under the input; no clipping
- Story and verification: the RegisterAgent Story at 320px and on both sides of the 640px transition × sq, en, uk, it

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
