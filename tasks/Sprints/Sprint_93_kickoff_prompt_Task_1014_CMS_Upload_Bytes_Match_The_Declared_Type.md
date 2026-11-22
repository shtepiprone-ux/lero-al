# Task 1014 — A CMS upload is refused when its bytes are not the declared image type

Sprint 93. Priority P1. Owner decisions: the owner 2026-11-06 "all holes found must be fixed" (audit `docs/security/audit-2026-11-06/findings.md`, A-05). Split out of Task 957 by the owner, 2026-11-22 (translated: "split the task into several subtasks"; option A chosen: each part is its own pull request from `main`, built from the code already written in the working tree of `task/957-signed-listing-uploads`).
Implementer: Sonnet. Reviewer: Opus. Human owner of the change: the owner.

## Goal

The CMS image upload trusts the type the browser declares, so a file of another type is sent to Cloudinary as an image. After the task the route compares the declared type with the file's bytes, as the avatar upload does, and refuses a mismatch with 400.

## Cause

Read at `a9915f3ba`
- `src/app/api/upload-cms-image/route.ts:35` trusts the declared `file.type` (A-05).
Fix: `declaredTypeMatchesBytes` after reading the bytes, as `upload-avatar`.

## Scope

- `src/app/api/upload-cms-image/route.ts`: `declaredTypeMatchesBytes` after reading the bytes, as `upload-avatar`. Test: `src/app/api/upload-cms-image/__tests__/route.test.ts`.
- State (option A, owner 2026-11-22): the files above are written (Task 957 Revision 3) and uncommitted in the working tree of `task/957-signed-listing-uploads`; Reviews 1-4 of Task 957 name no finding against them (`docs/reviews/Task_957_Review_1.md` to `docs/reviews/Task_957_Review_4.md`). The pull request takes exactly these files from that tree; nothing is rewritten, and a defect the review finds is fixed in this pull request.
- Dependencies: none. Out of scope: the listing photo upload (Task 957).
- Kept as on `main` (checklist A2): the route keeps its authorization, size limit, folder and answers; only a mismatching file is refused.

## Attack surface

Changed: what the CMS upload route accepts.
- T4 Tampering: a CMS upload whose bytes are not the declared type — mitigate: the byte sniff.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (2026-11-22).

- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — "## Attack surface" names what the CMS upload route accepts — AC1
- Authorization: not applicable — the route keeps its staff check; only the file check is added
- Authorization_Decisions_And_Output_Handling: not applicable — no authorization decision is added or changed by this task
- Authorization_Patterns: not applicable — enforcement of the CMS upload stays where it is today
- Authorization_Regression_Testing: not applicable — no permission changes, so no authorization path can degrade
- Authorization_Testing_Automation: not applicable — the authorization matrix of the route is unchanged here
- Cross_Site_Scripting_Prevention: not applicable — the route returns a Cloudinary address; no markup is rendered
- DOM_Clobbering_Prevention: not applicable — the CMS route change checks file bytes and renders no HTML
- Denial_of_Service: "Using validation that is cheap in resources first" — the existing size limit runs before the bytes are read and compared — AC1
- File_Upload: "Validate the file type, don't trust the Content-Type header as it can be spoofed" — the route compares the declared type with the file's bytes — AC1
- Input_Validation: "Reject invalid requests with a clear error; do not continue with partially validated data." — a mismatch answers 400 before any upload — AC1
- Insecure_Direct_Object_Reference_Prevention: not applicable — no object reference comes from the request in this change
- JavaScript_and_TypeScript_Security: not applicable — no merge, path setter or eval; the sniff reads fixed signatures
- Mass_Assignment: not applicable — no request field is bound to any object or row
- Nextjs_Security: "Treat each reachable action as a client-callable POST entry point." — the route checks the file itself, whatever page sent it — AC1
- Nodejs_Security: "some third-party rulesets can be used to flag dangerous patterns such as eval()" — ESLint with the security rules runs on every changed file in CI — AC2
- Prototype_Pollution_Prevention: not applicable — no request key is copied into any object the route builds
- REST_Security: not applicable — access control is unchanged; the change validates file content only
- Secure_Code_Review: "Security-Focused Review differs from functional code review by specifically targeting security concerns" — Opus reviews by `secure-code-review.md` — AC2
- Secure_Coding_with_AI: "AI coding assistants frequently suggest package names that do not exist on public registries" — no package is added; the code is written by Sonnet and its every claim is rerun by Opus — AC2
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — threat T4 became an acceptance criterion — AC1
- Serverless_FaaS_Security: not applicable — the function's authentication is unchanged by this task
- Threat_Modeling: "the threat modeling process should answer the following four questions" — "## Attack surface" answers them for T4 — AC1
- User_Privacy_Protection: not applicable — the route handles CMS images, no personal data
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns every claim of the executor's report — AC2
- Web_Service_Security: not applicable — the route takes a multipart file, not a schema-described body
- XSS_Filter_Evasion: not applicable — the CMS route change checks file bytes and filters no markup
## UI

No visible change.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 The CMS route sniffs bytes — test: `src/app/api/upload-cms-image/__tests__/route.test.ts` (extended: a PNG declared `image/jpeg` and text declared `image/png` answer 400).
- AC2 The CI jobs pass — test: `gh pr checks <n>` on GitHub after every check has concluded (checklist A5).

## Route

1. Opus hands the owner the commands (checklist H): a branch `task/<n>` from `main` that takes the Scope files from `task/957-signed-listing-uploads`.
2. Run: `npx vitest run src/app/api/upload-cms-image/__tests__/route.test.ts`. CI runs only on GitHub after the owner's push and is read with `gh pr checks <n>` (checklist A5).
3. Report: each command, exit code, relevant output; one deliberate break per security test (named in its criterion), restored.

## Review
