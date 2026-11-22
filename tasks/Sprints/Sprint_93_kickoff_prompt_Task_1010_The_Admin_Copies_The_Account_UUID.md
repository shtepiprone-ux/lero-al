# Task 1010 — The admin copies an account's UUID, the name of its Cloudinary folder

Sprint 93. Priority P2. Owner decisions: O957-3 2026-11-18 (option chosen: "UUID + metadata + admin": the folder stays the account UUID, each photo carries the uploader's number and listing in Cloudinary metadata, the admin profile copies the UUID). Split out of Task 957 by the owner, 2026-11-22 (translated: "split the task into several subtasks"; option A chosen: each part is its own pull request from `main`, built from the code already written in the working tree of `task/957-signed-listing-uploads`).
Implementer: Sonnet. Reviewer: Opus. Human owner of the change: the owner.

## Goal

A Cloudinary folder is named by the account UUID, but the admin profile shows only the account number, so staff cannot tell whose folder it is. After the task the `#public_id` line of the profile copies the account UUID, and the users search hint says a full account ID is accepted.

## Cause

Read at `a9915f3ba`
- A folder name cannot be traced to a person in the admin: the profile shows only `#public_id` (`src/components/admin/AdminUserProfileView.tsx:515-517`), never the UUID; the users search accepts a full UUID (`src/app/admin/users/page.tsx:63-64`) but its hint does not say so (`messages/en.json:921`).
Fix: the `#public_id` line becomes the canonical copy control that copies `user.id`; the search hint names the account ID in four locales.

## Scope

- Admin (O957-3): `AdminUserProfileView.tsx` renders the `#public_id` line with the canonical `MantineCopyIdButton` (label `#<public_id>`, copies `user.id`; accessible names from new `admin.user_profile` keys in all four locales), as `AdminListingsView.tsx:124-129` does;
  the users search hint (`search_placeholder`, `messages/*.json:921`) names the account ID in all four locales; the Story `Patterns/Mantine/AdminUserProfileDialogsView` (`src/stories/patterns/mantine/AdminUserProfileDialogsView.stories.tsx`) passes `public_id` and `id`.
- Tests: `src/components/admin/__tests__/AdminUserProfile.smoke.test.tsx`. Messages: `messages/en.json`, `messages/sq.json`, `messages/uk.json`, `messages/it.json`.
- State (option A, owner 2026-11-22): the files above are written (Task 957 Revision 3) and uncommitted in the working tree of `task/957-signed-listing-uploads`; Reviews 1-4 of Task 957 name no finding against them (`docs/reviews/Task_957_Review_1.md` to `docs/reviews/Task_957_Review_4.md`). The pull request takes exactly these files from that tree (the four message files whole: they also carry the listing-form keys of Task 957, unused until it merges); nothing is rewritten, and a defect the review finds is fixed in this pull request.
- Dependencies: none. Out of scope: the listing pages, Cloudinary metadata (Task 957).
- Kept as on `main` (checklist A2): `AdminUserProfileView.tsx` keeps every block, its order and the `#public_id` text; only the text becomes the copy control. The search keeps its behaviour; only its hint changes.

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
- Secure_Coding_with_AI: "AI coding assistants frequently suggest package names that do not exist on public registries" — no package is added; the code is written by Sonnet and its every claim is rerun by Opus — AC2
- User_Privacy_Protection: not applicable — staff see a pseudonymous UUID they already reach through the address; no IP or contact data
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns every claim of the executor's report — AC2
- Web_Frontend_Security: not applicable — no innerHTML or other markup sink is added by the copy control
## UI

REUSE `MantineCopyIdButton` (`src/design-system/mantine/patterns/MantineCopyIdButton.tsx`), as `AdminListingsView.tsx:124-129` uses it; tokens and states inherited from that owner (U1, U3). States (U11): default and copied are the owner's; the rest are not needed: the control has no load, empty or error state. U12: the copy control's accessible names come from `admin.user_profile` keys; focus is the owner's.

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
- Story and verification: Patterns/Mantine/AdminUserProfileDialogsView at 320px and on both sides of the 640px transition × sq, en, uk, it, checked by the owner by hand (checklist U9)

## Acceptance criteria

- AC1 The admin copies the account UUID and the hint names it (O957-3) — test: `src/components/admin/__tests__/AdminUserProfile.smoke.test.tsx` (extended: the `#public_id` control writes `user.id` to the clipboard) and `node scripts/check-i18n-parity.mjs` with `node scripts/quality/locale-safety.mjs` (the new keys and hint in all four locales).
- AC2 The CI jobs pass — test: `gh pr checks <n>` on GitHub after every check has concluded (checklist A5).

## Route

1. Opus hands the owner the commands (checklist H): a branch `task/<n>` from `main` that takes the Scope files from `task/957-signed-listing-uploads`.
2. Run: `npx vitest run src/components/admin/__tests__/AdminUserProfile.smoke.test.tsx`, `node scripts/check-i18n-parity.mjs`, `node scripts/quality/locale-safety.mjs`. CI runs only on GitHub after the owner's push and is read with `gh pr checks <n>` (checklist A5).
3. Report: each command, exit code, relevant output; one deliberate break per security test (named in its criterion), restored.

## Review
