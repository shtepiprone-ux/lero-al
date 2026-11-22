# Task 994 — "Become an agent": a one-way upgrade with the agency name and phone, and the agent functions at once

Sprint 94. Priority P2. Owner decisions: owner list item 9 (2026-11-19, translated): "The change of profile type from
'Private person' to 'Agent' must not be a tab switch but a profile upgrade: a link or button 'Become an agent', then a
popup with the new required fields. After the data is confirmed the user gets the functions of the 'Agent' role. From
'Agent' the user cannot go back to 'Private person': the upgrade is one way."; O994-1 (2026-11-19): the agency name and the
phone number are required; O994-2 (2026-11-19): the agent functions open at once, the "Verified" badge is given by an
admin or a moderator (Task 998). Plan file: `tasks/Sprints/Sprint_94_Owner_List_Of_2026-11-19.md`. Implementer: Sonnet.
Reviewer: Opus. Human owner of the change: the owner.

## Goal

The profile switches between private and agent in both directions, and the switch changes only the self-chosen
`user_type`, while every agent function follows `users.role`; so a person who "becomes an agent" gets no agent function,
and an agent can turn back. After the task: a private person presses "Become an agent", fills the agency name and phone in
a dialog, and becomes an agent (`role` and `user_type`) at once; nothing returns an agent to private; the two rows whose
role and type disagree today are reconciled.

## Cause

Read at `dc5e3af66`
- Two-way switch of `user_type` only: `src/modules/cabinet/components/ProfileTab.tsx:295-309`, saved by `updateCabinetProfile` (`src/modules/cabinet/actions/index.ts:192-193`, `:221-226`).
- Agent functions follow `role`: `src/modules/cabinet/statistics/access.ts:9`, `:19`; `role` is written only by staff (`src/modules/admin/actions/index.ts:405-413` `profileTypeToDb`).
- Read-only count 2026-11-19 (`node roles-count.mjs`, 19 live accounts) → `1 role=user user_type=agent company=no` (chose agent, has no agent function) and `1 role=agent user_type=private` (an agent shown as private).

- `ProfileTab.tsx` is legacy: `@/components/ui` button, input, label and dialog (`src/modules/cabinet/components/ProfileTab.tsx:14-16`, `:21`), Tailwind classes, the legacy `AdminUserAvatar` (`:268`; the admin profile already uses the canonical `AdminUserAvatarField`, `src/components/admin/AdminUserProfile.tsx:541`) and the shared legacy `Combobox` (`:32`).

Fix: the whole profile tab moves to canonical Mantine (owner rule 2026-11-19); the switch leaves the profile; a server action upgrades `user` + `private` to `agent` + `agent` with the two required fields, once; the profile save stops writing `user_type`; a reconciliation SQL aligns the two rows.

## Scope

- `src/modules/cabinet/actions/upgradeToAgent.ts` (new server action): `requireViewer()` first; refuses unless `role = 'user'`; validates `companyName` (trimmed, 1 character to the `users` CHECK bound through `isProfileCompanyFieldWithinBound`) and `phone` (`isE164`); updates with the service role `role = 'agent'`, `user_type = 'agent'`, `company_name`, `phone` where `id = viewer` and `role = 'user'` (`.select('id')`; no row → `already_agent`); writes `user_change_log` rows for `role` and `user_type` (`changed_by` = the person); `revalidatePath('/[locale]/cabinet', 'layout')`.
- `updateCabinetProfile`: ignores `userType` and keeps the stored `user_type`; `company_name` is written only for `role = 'agent'` (read from the row, not from the input).
- `src/modules/cabinet/components/AgentUpgradeDialogView.tsx` (new) with its Story `src/stories/mantine/primitives/AgentUpgradeDialogView.stories.tsx`: REUSE `MantineModal` and `MantineFormSectionStack`; two required fields (phone prefilled from the profile), Save and Cancel, field errors for each refusal.
- `ProfileTab.tsx` on canonical Mantine (owner rule 2026-11-19, `.claude/rules/shared/canonical-component-reuse.md`): its `@/components/ui` parts and Tailwind classes become `MantineFormSectionStack`, `TextInput`, `Button` and `MantineModal`; `AdminUserAvatar` gives way to `AdminUserAvatarField`, and `src/components/admin/AdminUserAvatar.tsx` with its Story, then used by no file, is deleted; the `Combobox` gives way to `MantineSelect`; same fields, values, actions and messages. `ProfileTab.tsx` joins `scripts/mantine-migration-scope.json`; every component it renders is enrolled with its Story or allowlisted with its owning task.
- `ProfileTab.tsx`: the switch (`:295-309`) is replaced by, for `role = 'user'`, a `Button` "Become an agent" that opens the dialog; for `agent`, the text "Agent" and no control; staff see neither.
- `supabase/sql_migrations/task994/` (owner-applied, rollback and read-only checks): `user_type = 'agent'` where `role = 'agent'`; `user_type = 'private'` where `role = 'user'` and `user_type = 'agent'` (that person can upgrade with the required fields).
- Messages in four locales (`cabinet.agent_upgrade_*`).
- Out of scope: the "Verified" badge (Task 998).

## Attack surface

Changed: a person raises their own role.
1. **What are we working on?** `upgradeToAgent` (any signed-in person, service-role write of `role`), and
   `updateCabinetProfile` (no longer writes `user_type`).
2. **What can go wrong?**
   - T1 E: a person reaches a role other than `agent`, or a staff or blocked account changes its role → mitigate: the
     target values are constants; only `role = 'user'` qualifies, checked in the action and in the update filter;
     `requireViewer` refuses a blocked session → AC1, `SEC-994-UPGRADE-DENY`.
   - T2 T: a direct call of `updateCabinetProfile` turns an agent back to private or sets a company for a non-agent
     → mitigate: the input field is ignored → AC2.
   - T3 R: an upgrade leaves no trace → mitigate: `user_change_log` rows → AC1.
   - T4 T (mass assignment): extra fields in the input reach the row → mitigate: only the two named fields are read → AC1.
3. Each mitigation is an acceptance criterion with a test that fails when the control is removed.
4. Authorization matrix: rows `SEC-994-UPGRADE-ALLOW` (user/private → agent), `SEC-994-UPGRADE-DENY` (agent, moderator,
   admin, blocked, signed out → refused, nothing written).

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (2026-11-19).

- AI_Agent_Security: not applicable — the task cites a project rule file; no agent, tool or agent permission changes.
- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — "## Attack surface" names the new self-service role change — AC1.
- Authorization: "Permission should be validated correctly on every request, regardless of whether the request was initiated by an AJAX script, server-side, or any other source." — the action checks the viewer and the role itself on every call — AC1.
- Authorization_Decisions_And_Output_Handling: "Fail closed. Deny protected operations on PDP errors, timeouts, or unusable output." — a viewer lookup that fails, or an update that matches no row, writes nothing — AC1.
- Authorization_Patterns: "Keep enforcement close to the protected resource so it can check the requested action, object, and tenant." — the update itself filters on `id` and `role = 'user'` — AC1.
- Authorization_Regression_Testing: "Automated tests should specifically target the ways authorization usually degrades over time." — `SEC-994-UPGRADE-DENY` fails if the role filter is dropped — AC1.
- Authorization_Testing_Automation: "Integration test cases validate the correct implementation of the authorization matrix." — the matrix rows `SEC-994-UPGRADE-*` are test cases — AC1.
- Cross_Site_Scripting_Prevention: not applicable — the dialog renders message keys and input values through Mantine fields.
- DOM_based_XSS_Prevention: not applicable — no new sink; values are form field values.
- Database_Security: "Configured with the minimum permissions required as discussed in the permissions section below." — the SQL changes data only; grants and the `users` guard are unchanged — AC4.
- GraphQL: not applicable — the project serves no GraphQL endpoint.
- Identity_Propagation_Patterns: "Each receiving service must still authorize the requested action and resource." — the service-role write carries the viewer id from `requireViewer`, never from input — AC1.
- Injection_Prevention: not applicable — the migration manifest is a JSON list of paths; no interpreter receives input.
- Input_Validation: "Validate on the server even when the browser checks the same fields." — company and phone are checked in the action before any write — AC1.
- Insecure_Direct_Object_Reference_Prevention: "implement access control checks for each object that users try to access" — the only row written is the viewer's own — AC1.
- JavaScript_and_TypeScript_Security: not applicable — no merge, path setter or regular expression over input beyond `isE164`.
- LLM_Prompt_Injection_Prevention: not applicable — no language model reads or writes any data of this task.
- Mass_Assignment: "Do not rely on a block-list as the sole protection: a new or overlooked sensitive field remains bindable." — the action builds the row from two named fields and constants — AC1, AC2.
- MCP_Security: not applicable — no MCP server, tool or agent permission is added or changed here.
- Multi_Tenant_Security: "Treat client-supplied tenant identifiers as selectors only." — no identifier comes from the client; the viewer id comes from the session — AC1.
- Nextjs_Security: "Treat each reachable action as a client-callable POST entry point." — `upgradeToAgent` and `updateCabinetProfile` are tested by direct call — AC1, AC2.
- OS_Command_Injection_Defense: not applicable — editing the migration manifest starts no operating system process at all.
- Prototype_Pollution_Prevention: not applicable — no object is built from client keys.
- Query_Parameterization: not applicable — the reconciliation SQL has constant values and no dynamic SQL.
- SQL_Injection_Prevention: not applicable — the SQL takes no input; the action writes through the client library.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — reviewed with the review-task skill on this task's diff — AC6.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — no dependency added; the reviewer reruns every claim of the report — AC6.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — the threat model's mitigations are AC1 and AC2.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — answered in "## Attack surface" — AC1, AC2.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns the implementer's results and Opus proves the SQL — AC6.
- Web_Cache_Security: not applicable — `revalidatePath` refreshes the person's own uncached cabinet; no shared cache is added.
- Web_Frontend_Security: "The fundamental security rule is to never use innerHTML with untrusted data." — the dialog adds no HTML sink — AC3.

## UI

GR-0 queries: "upgrade dialog", "required form in a modal". Inspected: `MantineModal`, `MantineFormSectionStack`
(their Stories), `ProfileTab` (legacy, no Story), `AdminUserAvatarField` (its Story). Decision: migrate `ProfileTab` onto these owners and REUSE `AdminUserAvatarField` and `MantineSelect`; CREATE `AgentUpgradeDialogView` composed only of `MantineModal`,
`MantineFormSectionStack`, `TextInput` and the existing phone input, with its Story; REUSE `Button`. Reference research
(GR-7): inherited canonical design — owner decision 2026-10-20 (`MantineModal`, `MantineFormSectionStack`).

## Mobile adaptation record
- Scope: visible
- Surfaces: src/modules/cabinet/components/AgentUpgradeDialogView.tsx — the upgrade dialog; src/modules/cabinet/components/ProfileTab.tsx — the whole profile tab on Mantine, with the "Become an agent" button in place of the switch
- Component families: form-picker-and-choice, overlay-and-disclosure
- Pattern IDs: form-stack, overlay-adaptive
- Standards: w3c-labels-instructions, w3c-reflow, apple-hig-layout, android-content-structure, w3c-focus-order, w3c-hover-focus, apple-hig-sheets, android-common-layouts, android-adapt-layouts
- Mantine mechanism: responsive-props
- Mantine owner: src/design-system/mantine/patterns/MantineFormSectionStack.tsx, src/design-system/mantine/patterns/MantineModal.tsx
- Mobile range and switches: <640px (theme.other.mobileGate / sm): the modal's full-screen sheet form, fields stacked, buttons full width; 640px transition to the centred modal
- Mobile order: dialog — title → explanation → agency name → phone → Save → Cancel; profile tab — today's section order, one column below 640px
- Required-content treatment: labels, errors and the explanation wrap at full width; no truncation
- Story and verification: AgentUpgradeDialogView (empty, prefilled, field errors, saving) and ProfileTab (user, agent, staff) at 320px, 639px and 640px × sq, en, uk, it

## Acceptance criteria

- AC1 Upgrade once, by the person, with the fields — test: `src/modules/cabinet/actions/__tests__/upgradeToAgent.security.test.ts` (new): `user`/`private` with both fields → `role` and `user_type` `agent`, company and phone stored, two `user_change_log` rows; empty or too long company, a non-E.164 phone → the field error, nothing written; extra input fields ignored; `SEC-994-UPGRADE-DENY`: `agent`, `moderator`, `admin`, a blocked session, a signed-out call → refused, nothing written; a second call → `already_agent`.
- AC2 The profile save cannot change the type — test: `src/modules/cabinet/actions/__tests__/cabinetActions.security.test.ts` (extended): `userType: 'private'` from an agent and `userType: 'agent'` from a user leave `user_type` unchanged; `companyName` from a non-agent is not stored.
- AC3 The profile shows the upgrade, not a switch — test: `src/modules/cabinet/components/__tests__/ProfileTab.agentUpgrade.test.tsx` (new): a user sees "Become an agent" and no switch; an agent sees "Agent" and no control; the dialog's Save calls `upgradeToAgent` and shows its field errors.
- AC4 The two rows agree after the SQL — test: the read-only check of `supabase/sql_migrations/task994/` returns 0 rows where (`role = 'agent'` and `user_type <> 'agent'`) or (`role = 'user'` and `user_type = 'agent'`); `node scripts/quality/db-catalog-audit.mjs` reports no new violation.
- AC5 Stories, texts and widths hold — test: `node scripts/check-mobile-adaptation-contract.mjs`, `node scripts/check-i18n-parity.mjs`, `node scripts/quality/locale-safety.mjs` and the census of `.claude/rules/shared/rendered-state-census.md` for the new Story.
- AC6 The CI jobs pass — test: `gh pr checks <n>` on GitHub after every check has concluded (checklist A5).
- AC7 The profile tab is on Mantine (owner rule 2026-11-19) — test: `npm run check:enrolled-tailwind`, `npm run check:rendered-scope` and `npm run check:story-coverage` pass with `ProfileTab.tsx` enrolled in `scripts/mantine-migration-scope.json` and no baseline entry for them; `src/modules/cabinet/components/__tests__/ProfileTab.mantine.test.tsx` (new): no import from `@/components/ui` and no `className` in `ProfileTab.tsx`, `AdminUserAvatar.tsx` gone; the existing cabinet tests pass.

## Route

1. Branch from `main`. Read `ProfileTab.tsx`, `updateCabinetProfile`, `requireViewer`, `access.ts`, `profileTypeToDb`, the `users` guard and CHECK bounds (`node scripts/quality/db-catalog-audit.mjs`).
2. Tests first (AC1-AC4, AC7); save each failing output.
3. The action, the profile save, the dialog and its Story, the profile button, the SQL with rollback and checks. One pass over every changed file (checklist I7).
4. Run: the task tests · CI on GitHub only (`gh pr checks <n>`, checklist A5); deliberate breaks: the `role = 'user'` filter, the ignored `userType` — each restored.
5. Report: each command, exit code, relevant output. Opus proves the SQL on the owner's delivery path; after the merge Opus checks with `HYDRATION_AGENT1` (no control) and `roles-count.mjs` (no mismatch).

## Review
