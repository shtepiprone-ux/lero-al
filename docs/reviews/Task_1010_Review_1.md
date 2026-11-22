# Task 1010 — Review 1

Kickoff: [Sprint_93_kickoff_prompt_Task_1010_The_Admin_Copies_The_Account_UUID.md](../../tasks/Archive/Sprint_93_kickoff_prompt_Task_1010_The_Admin_Copies_The_Account_UUID.md) · OWASP record: [Task_1010.json](../security/owasp/reviews/Task_1010.json)

Review 1 of the branch `task/1010-admin-copies-account-uuid`, working tree on 0f34e290d (uncommitted) — APPROVED
Scope: the diff against 0f34e290d (the kickoff commit, equal to `main` fa8fea56b in every file the task changes): `src/components/admin/AdminUserProfileView.tsx`, `src/components/admin/__tests__/AdminUserProfile.smoke.test.tsx`, `messages/en.json`, `messages/sq.json`, `messages/uk.json`, `messages/it.json`; entry point: the staff page `/admin/users/[id]`, unchanged
Tools: local commands below with their exit codes; CI is UNKNOWN until `gh pr checks <n>` after the owner's push (V14)
Findings: Critical 0, High 0, Medium 0, Low 0
Overall risk: none added; a label becomes the canonical copy control on a staff page that already shows the UUID in its address.

The implementer is Sonnet; every claim of its report was rerun here, none is taken from the report.

## Tools (local, 2026-11-22)

- V1: `node scripts/quality/owasp.mjs sync` → 0 changed (c2a1e3e32cec), exit 0; `node scripts/quality/owasp.mjs check` → exit 0; `node scripts/quality/check-ruleset.mjs` → the live ruleset matches, exit 0; `gh run list --branch main --limit 3` → CI run 45026040274 on fa8fea56b `success`.
- V3: `npm test -- src/components/admin/__tests__/AdminUserProfile.smoke.test.tsx` → 53 passed, exit 0.
- V8, AC1: `AdminUserProfileView.tsx` set to its `main` version → "the control shows #<public_id>, has an accessible name, and writes user.id (not the number) to the clipboard" fails, 1 failed, 52 passed, exit 1. AC2: the four message files set to their `main` versions → 3 failed (the locale case among them), exit 1. Both restored from copies → 53 passed, exit 0; `git diff --stat 0f34e290d` unchanged.
- V7: `node scripts/quality/check-files.mjs` on the six changed files → 0 findings, exit 0.
- V10: `node scripts/quality/owasp.mjs review <kickoff> --base main` → exit 0; the diff triggers 9 sheets, all among the 15 of "## OWASP"; record `docs/security/owasp/reviews/Task_1010.json`.

## Scope (V2) and the changed lines (V4)

- `git diff --stat 0f34e290d` → exactly the six Scope files, 60 insertions, 11 deletions.
- `AdminUserProfileView.tsx`: the import (line 19) and lines 517-523 replace the `Text` with `#{user.public_id}`; identical to `9de067faf` (`git diff main...9de067faf` shows the same hunks).
- The smoke test: the added lines equal the added lines of `9de067faf` byte for byte (compared with `diff`). Its `describe` title keeps the suffix "(Task 957, O957-3)" of the source, as the Scope requires a verbatim copy.
- Each locale: `admin.users.search_placeholder`, `admin.user_profile.header.copy_account_id` and `account_id_copied` equal `9de067faf`; with those three removed, the whole file equals `main` (compared as parsed JSON). No key of Task 957 came along.

## Approved behaviour (V5)

The profile keeps every block and its order; `#<public_id>` stays visible and takes the look of `MantineCopyIdButton`, the change O957-3 names ("the admin profile copies the UUID"); the users search keeps its query (`src/app/admin/users/page.tsx` unchanged); only the hint text changes.

## Exemptions (V6)

None: the diff adds or removes no allowlist, baseline, registry row, `skip`, `only` or `eslint-disable`.

## Secure code review (V7, secure-code-review.md §2 and §3)

- §2: no control weakened; no new entry point, parameter, outbound call, file handling or HTML sink; no trust boundary moves; no package; no test or assertion removed.
- Authorization: not touched — `git diff --name-only 0f34e290d` has no Server Action, route or policy file; the page's staff check is unchanged.
- Input and output: touched — `AdminUserProfileView.tsx:517-523` renders `#<public_id>` as React text and gives `user.id` to `MantineCopyIdButton`, which writes it to the clipboard and its `title` (`src/design-system/mantine/patterns/MantineCopyIdButton.tsx:34-45`); no markup sink.
- Authentication and sessions, requests and redirects, Next.js entry points, business logic, files, dependencies and configuration: not touched — no file of them in `git diff --name-only 0f34e290d`.
- JavaScript and TypeScript: not touched — no regular expression, `postMessage` or non-null assertion added.
- Data exposure: touched — staff see the account UUID, already in the page address `/admin/users/<uuid>`; nothing new reaches a client that did not have it.
- Agent and tool output: `check-files.mjs` on the six files → 0 findings (no invisible or bidi character); no rule, skill, hook, setting or CI file changed.
- Tests: three cases added, none removed or weakened; each acceptance criterion's test fails without its change (V8).

## Stories (V9)

No Story changed. `Patterns/Mantine/AdminUserProfileView` (`src/stories/patterns/mantine/AdminUserProfileView.stories.tsx`) renders the control from its fixture (`src/stories/fixtures/admin.fixtures.ts:519-521`: `id` `usr-001`, `public_id` 101): `#101` with the copy icon; a click shows the copied state. For the owner's check by hand at 320 px and on both sides of 640 px in the four locales (kickoff "## Mobile adaptation record").

## Findings

None in this diff.

Outside the diff (checklist A4), reported by the executor and confirmed here: `messages/uk.json:549` `common.command_palette` is "Палітра команد", its last letter U+062F (Arabic), since `3ddf47ce0` (2026-06-06); the only letter of U+0590-U+08FF in the four locale files; `check-files.mjs` passes it. Filed as Task 1017.

## Open parts

- Owner: commit and push the branch, open the pull request (checklist H); check the Story by hand (U9).
- Opus: `gh pr checks <n>` until every check has concluded (V14).
