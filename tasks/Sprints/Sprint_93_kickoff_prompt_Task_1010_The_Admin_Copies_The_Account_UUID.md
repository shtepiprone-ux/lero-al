# Task 1010 — The admin copies an account's UUID, the name of its Cloudinary folder

Sprint 93. Priority P2. Owner decisions: O957-3 2026-11-18 (option chosen: "UUID + metadata + admin": the folder stays the account UUID, each photo carries the uploader's number and listing in Cloudinary metadata, the admin profile copies the UUID). Split out of Task 957 by the owner, 2026-11-22 (translated: "split the task into several subtasks"; option A chosen: each part is its own pull request from `main`, built from the code already written in the working tree of `task/957-signed-listing-uploads`). Corrected 2026-11-22 before execution (checklist D, owner, translated: "do everything by the rules"): that code is in commit `9de067faf`; the Scope takes only the lines this task needs; the Route runs only its test file.
Implementer: Sonnet. Reviewer: Opus. Human owner of the change: the owner.

## Goal

A Cloudinary folder is named by the account UUID, but the admin profile shows only the account number, so staff cannot tell whose folder it is. After the task the `#public_id` line of the profile copies the account UUID, and the users search hint says a full account ID is accepted.

## Cause

Read at `fa8fea56b`
- A folder name cannot be traced to a person in the admin: the profile shows only `#public_id` (`src/components/admin/AdminUserProfileView.tsx:515-519`), never the UUID; the users search accepts a full UUID (`src/app/admin/users/page.tsx:63-64`) but its hint does not say so (`messages/en.json:921`).
Fix: the `#public_id` line becomes the canonical copy control that copies `user.id`; the search hint names the account ID in four locales.

## Scope

- `src/components/admin/AdminUserProfileView.tsx`: the import of `MantineCopyIdButton` and lines 515-519, the `Text` with `#{user.public_id}` becomes `MantineCopyIdButton` (`id={user.id}`, `label={`#${user.public_id}`}`, `copyLabel={t('header.copy_account_id')}`, `copiedLabel={t('header.account_id_copied')}`), as `src/components/admin/AdminListingsView.tsx:124-129` uses it.
- `messages/en.json`, `messages/sq.json`, `messages/uk.json`, `messages/it.json`: three lines each, nothing else: `admin.users.search_placeholder` (line 921) names the account ID; `admin.user_profile.header` gains `copy_account_id` and `account_id_copied` after `verified_badge` (line 1583).
- `src/components/admin/__tests__/AdminUserProfile.smoke.test.tsx`: one new `describe` block at the end of the file (AC1, AC2).
- Source of the code (option A, owner 2026-11-22): commit `9de067faf` on the local branch `task/957-signed-listing-uploads` (Task 957 Revision 3; Reviews 1-4 of Task 957 name no finding against these lines). The executor reads it with `git show 9de067faf:<path>` and takes, verbatim, only the lines this Scope names: the `describe` block "AdminUserProfile: the account ID" of the smoke test, the import (line 19) and lines 517-523 of `AdminUserProfileView.tsx`, and in each locale the `search_placeholder` value and the two `header` keys. The other changes of those files in that commit (the listing-form keys of Task 957 and the `AdminUserProfileDialogsView` Story's `CancelDemo`, Task 957 R2-5) stay with Task 957.
- Dependencies: none. Out of scope: the listing pages, Cloudinary metadata (Task 957), every Story: `Patterns/Mantine/AdminUserProfileView` already renders a user with `id` and `public_id` (`src/stories/fixtures/admin.fixtures.ts:519-521`), so it shows the control unchanged.
- Kept as on `main` (checklist A2): `AdminUserProfileView.tsx` keeps every block, its order and the `#<public_id>` text; the text takes the look of the copy control (O957-3 names the change: "the admin profile copies the UUID"). The users search keeps its query (`page.tsx` is not changed); only the hint text changes. The message files keep every other key and value.

## Attack surface

Unchanged: the profile is a staff page whose address already carries the account UUID (`src/app/admin/users/[id]`); the control copies that value to the staff member's own clipboard and sends nothing.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (2026-11-22).

- Authorization: not applicable — the profile page and its staff check are unchanged; only a label becomes a copy control
- Authorization_Decisions_And_Output_Handling: not applicable — no authorization decision is added or changed by this task
- Authorization_Patterns: not applicable — enforcement of the staff page stays where it is today
- Authorization_Regression_Testing: not applicable — no permission changes, so no authorization path can degrade
- Authorization_Testing_Automation: not applicable — the authorization matrix of the admin pages is unchanged here
- Cross_Site_Scripting_Prevention: not applicable — the control renders the number and UUID as React text, no markup
- DOM_based_XSS_Prevention: not applicable — no DOM sink is added; the clipboard receives a server-provided UUID
- Denial_of_Service: not applicable — no request, loop or input processing is added by the control
- File_Upload: not applicable — no file is uploaded; only the folder name is copied to the clipboard
- JavaScript_and_TypeScript_Security: not applicable — no merge, path setter, regular expression or eval is added
- Nextjs_Security: not applicable — no Server Action, route handler or cache setting changes in this task
- Secure_Coding_with_AI: "AI coding assistants frequently suggest package names that do not exist on public registries" — no package is added; the code is written by Sonnet and its every claim is rerun by Opus — AC1, AC3
- User_Privacy_Protection: not applicable — staff see a pseudonymous UUID they already reach through the address; no IP or contact data
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns every claim of the executor's report — AC1, AC3
- Web_Frontend_Security: not applicable — no innerHTML or other markup sink is added by the copy control
## UI

- U1: REUSE `MantineCopyIdButton` (`src/design-system/mantine/patterns/MantineCopyIdButton.tsx`), as `src/components/admin/AdminListingsView.tsx:124-129` uses it; no new component.
- U2: `AdminUserProfileView.tsx` has no `@/components/ui/*` import and no `className`; it is enrolled in `scripts/mantine-migration-scope.json:143`.
- U3, U4: no style, size or colour literal is added; the look is the owner's module (`MantineCopyIdButton.module.css`), the same as in `AdminListingsView.tsx:124-129`.
- U6: the Story `Patterns/Mantine/AdminUserProfileView` (`src/stories/patterns/mantine/AdminUserProfileView.stories.tsx`) renders the control from its fixture (`src/stories/fixtures/admin.fixtures.ts:519-521`) and is not changed; the copied state is shown by a click, as in production.
- U7: not applicable — no table (GR-8), the name is not changed (GR-3i), no new block (GR-3h), no popup (GR-3e), no heading (GR-3c).
- U11: default and copied are built by the owner (`MantineCopyIdButton.tsx:44-52`); loading, empty, error, partial, disabled, no permission and offline are not needed: the control makes no request and is shown only when `public_id` is set; the longest label is `#<public_id>`, a number.
- U12: colours are tokens (`MantineCopyIdButton.module.css:21`, `:56`, `:61`); the copied state changes the icon and the accessible name, not the colour only (`MantineCopyIdButton.tsx:44-52`); the accessible names come from the two new `admin.user_profile.header` keys; focus is visible (`MantineCopyIdButton.module.css:51-56`); no error message exists.

## Mobile adaptation record
- Scope: visible
- Surfaces: src/components/admin/AdminUserProfileView.tsx — the identity block of /admin/users/[id]
- Component families: inline-status-and-utility-control
- Pattern IDs: inline-control
- Standards: w3c-target-size, apple-hig-menus, android-layout-navigation
- Mantine mechanism: responsive-props
- Mantine owner: src/design-system/mantine/patterns/MantineCopyIdButton.tsx
- Mobile range and switches: <640px (theme.other.mobileGate / sm): the control keeps the 44px target its owner sets; 640px transition to the owner's desktop size
- Mobile order: name → badges → e-mail → `#public_id` copy control
- Required-content treatment: no semantic loss: the number stays visible and the copy action reachable; nothing clamps
- Story and verification: Patterns/Mantine/AdminUserProfileView at 320px and on both sides of the 640px transition × sq, en, uk, it, checked by the owner by hand (checklist U9)

## Acceptance criteria

- AC1 The admin copies the account UUID (O957-3): the control shows `#<public_id>`, writes `user.id` (not the number) to the clipboard, and is absent when `public_id` is null — test: `src/components/admin/__tests__/AdminUserProfile.smoke.test.tsx` (new `describe` "AdminUserProfile: the account ID").
- AC2 The two labels exist in all four locales and the users search hint names the account ID — test: `src/components/admin/__tests__/AdminUserProfile.smoke.test.tsx` (same `describe`, the locale case).
- AC3 The CI jobs pass (key parity of the four locales, `locale-safety.mjs` on the values, coverage of the changed lines) — test: `gh pr checks <n>` on GitHub after every check has concluded (checklist A5).

## Route

1. The owner creates the branch `task/1010-admin-copies-account-uuid` from `main` with this kickoff committed on it (checklist H); nothing else is taken onto it, so the executor starts from a clean tree (checklist I1).
2. Tests first (I4): the new `describe` block, verbatim from `git show 9de067faf:src/components/admin/__tests__/AdminUserProfile.smoke.test.tsx`; run `npm test -- src/components/admin/__tests__/AdminUserProfile.smoke.test.tsx`; it fails on the unchanged code; keep that output.
3. The change (I5): the `AdminUserProfileView.tsx` lines and the three lines of each locale from `9de067faf`, as the Scope names them; message files only with Edit (checklist A12).
4. Run: `npm test -- src/components/admin/__tests__/AdminUserProfile.smoke.test.tsx`; nothing else runs locally. CI runs only on GitHub after the owner's push and is read with `gh pr checks <n>` (checklist A5). No security test: the attack surface is unchanged (I9 not applicable).
5. Report: each command, exit code, relevant output; the failing run before the change.

## Review
