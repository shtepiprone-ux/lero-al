# Task 1014 — Review 1

Kickoff: [Sprint_93_kickoff_prompt_Task_1014_CMS_Upload_Bytes_Match_The_Declared_Type.md](../../tasks/Sprints/Sprint_93_kickoff_prompt_Task_1014_CMS_Upload_Bytes_Match_The_Declared_Type.md) · OWASP record: [Task_1014.json](../security/owasp/reviews/Task_1014.json)

Review 1 of the branch `task/1014-cms-upload-bytes-match-type`, working tree on 3c89c8002 (uncommitted) — APPROVED
Scope: the diff against 3c89c8002 (`main`): `src/app/api/upload-cms-image/route.ts`, `src/app/api/upload-cms-image/__tests__/route.test.ts`; entry point: POST `/api/upload-cms-image` (staff with `legal.manage`)
Tools: local commands below with their exit codes; CI is UNKNOWN until `gh pr checks <n>` after the owner's push (V14)
Findings: Critical 0, High 0, Medium 0, Low 0
Overall risk: lowered; a CMS upload whose bytes are not the declared image type is refused before it reaches Cloudinary.

The implementer is Sonnet; every claim of its report was rerun here, none is taken from a report.

## Tools (local, 2026-11-22)

- V1: `node scripts/quality/owasp.mjs sync` → 0 changed (c2a1e3e32cec), exit 0; `node scripts/quality/owasp.mjs check` → exit 0; `node scripts/quality/check-ruleset.mjs` → the live ruleset matches, exit 0; `gh run list --branch main --limit 3` → CI run 45044303651 on 3c89c8002 `success`.
- V3: `npm test -- src/app/api/upload-cms-image/__tests__/route.test.ts` → 8 passed, exit 0.
- V8, AC1: `route.ts` set to its `main` version → `[SEC-UPLOAD-SNIFF-DENY]` fails ("expected 200 to be 400"), 1 failed, 7 passed, exit 1; restored from a copy → 8 passed, exit 0; `git diff --stat` unchanged.
- V7: `node scripts/quality/check-files.mjs` on both files → 0 findings, exit 0.
- V10: `node scripts/quality/owasp.mjs review <kickoff> --base main` → exit 0; every sheet the diff triggers is in "## OWASP"; record `docs/security/owasp/reviews/Task_1014.json`.

## Scope (V2) and the changed lines (V4)

- `git diff --stat` → exactly the two Scope files, 22 insertions, 1 deletion.
- Both files are byte for byte the files of `9de067faf` (`git show 9de067faf:<path>` compared with `diff -q`): `route.ts` adds the import (line 4) and lines 47-50; the test changes the fixtures (lines 27-30) and adds the case `[SEC-UPLOAD-SNIFF-DENY]` (lines 80-91). Nothing else.

## Approved behaviour (V5)

The route keeps its permission check (`route.ts:19`), its type list and size limit (`route.ts:13-14`, `:36-41`), its empty-file answer and its folder `cms/pages`. The sniffer knows exactly the three types the route accepts (`src/lib/uploads/imageSniff.ts:8` `image/jpeg | image/png | image/webp`, `route.ts:13` the same), so a real image of an accepted type is still uploaded; only a file whose bytes are another type is refused, with the existing answer 400 `invalid_type`.

## Exemptions (V6)

None: the diff adds or removes no allowlist, baseline, registry row, `skip`, `only` or `eslint-disable`.

## Secure code review (V7, secure-code-review.md §2 and §3)

- §2: no control weakened; no new entry point or parameter; the change narrows what the existing upload accepts; no trust boundary moves; no package; no test or assertion removed (the `png` fixture now carries a real PNG signature, which the route needs to accept it).
- Files: touched — the type is checked by content (`route.ts:47-50`, `imageSniff.ts:27-30`), after the size limit (`route.ts:39-41`); the stored name and folder are unchanged.
- Input and output: touched — a mismatch is refused with a generic code before any upload; no markup or query is built from the file.
- Authorization: not touched — `route.ts:19` `assertPermission('legal.manage')` is unchanged.
- Authentication and sessions, requests and redirects, business logic, dependencies and configuration: not touched — no file of them in `git diff --name-only`.
- Next.js entry points: the route handler is the same POST entry point; nothing privileged is newly imported by a client file.
- JavaScript and TypeScript: no regular expression added; the sniff compares at most 12 fixed bytes.
- Data exposure, errors, logging: the new answer is the existing `{ error: 'invalid_type' }`; nothing new is logged.
- Agent and tool output: `check-files.mjs` → 0 findings; no rule, skill, hook, setting or CI file changed.
- Tests: one case added, none removed or weakened; it fails without the change (V8).

## Stories (V9)

No Story changed; the change has no visible surface.

## Findings

None.

## Open parts

- Owner: commit and push the branch, open the pull request (checklist H).
- Opus: `gh pr checks <n>` until every check has concluded (V14).
