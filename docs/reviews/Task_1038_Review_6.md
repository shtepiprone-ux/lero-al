# Task 1038 — Review 6

Kickoff: [Sprint_94_kickoff_prompt_Task_1038_Listing_Photos_Optimised_In_The_Browser_Stored_In_R2.md](../../tasks/Sprints/Sprint_94_kickoff_prompt_Task_1038_Listing_Photos_Optimised_In_The_Browser_Stored_In_R2.md) · OWASP record: [Task_1038.json](../security/owasp/reviews/Task_1038.json)

Review 6 of Revision 4 (R4-1) on c404b4c83, uncommitted — APPROVED
Scope: `git diff --stat c404b4c83 -- src`: `src/lib/media/cdnPurge.ts` (3 lines), `src/lib/media/__tests__/cdnPurge.security.test.ts` (2 rows) — exactly the Files of [Review 5](Task_1038_Review_5.md) "Revision 4"; plus Opus's documentation of Reviews 5 and 6 (the two kickoffs' mobile records, the review links, this file, one evidence line of the OWASP record).
Tools: `owasp.mjs sync` → exit 0, `check` → exit 0, `review <kickoff> --base main` → exit 0; `check-ruleset.mjs` → exit 0; the 2 test files that import the module, found by import over `src` → 44 passed, exit 0; `npm run typecheck` → exit 0; `npx eslint --no-warn-ignored --max-warnings 0` on the 2 changed code files → exit 0; the two deliberate breaks of R4-1 rerun; open CodeQL alerts of `refs/pull/76/merge`: 351 only (the one R4-1 removes; it closes only when CI analyses the pushed tree, V14).
Findings: Critical 0, High 0, Medium 0, Low 0; Review 5 F6 fixed in the tree, F7 fixed in Review 5
Overall risk: the purge prefix is accepted and refused exactly as before; no regular expression is built from a value any more.

## Checklist V

- V1: as above. `main`: the scheduled CI run 45632546651 is red on "OWASP reference — upstream equals the committed registry" only (Review 5), which this pull request's registry repairs; run 45635292598 (repository settings) green.
- V2: the two code files of R4-1 only; each hunk is named by R4-1 (the `PREFIX` literal and its comment, the filter, the two table rows).
- V3: every claim of the report reproduced: 44 passed in the two files found by `grep -rlE "media/cdnPurge|purgePhotoFolders" src --include=*.test.ts --include=*.test.tsx`; typecheck and ESLint exit 0; break 1 (`!prefix.startsWith(MEDIA_HOST)` removed) → 1 failed, 27 passed, the `mediaxlero.al` row; break 2 (`!PREFIX.test(prefix.slice(MEDIA_HOST.length))` removed) → 7 failed, 21 passed: query, fragment, `..`, `media.lero.al.evil.example`, bare host, no trailing slash, wildcard; `src/lib/media/cdnPurge.ts` md5 `efc9d47089976f7f1c47b46bc70ffd22` before and after both breaks. The "passes before the change" claim follows from the code: the old expression was `^media\.lero\.al/` + the same path, and both new rows fail at its host.
- V4: read `src/lib/media/cdnPurge.ts` in full and the changed table of the test. The new check is `prefix.startsWith('media.lero.al')` and `/^\/<owner>\/listings\/<uuid>\/$/` on the rest; `typeof` is tested first, so `startsWith` never runs on a non-string. It accepts exactly what `^media\.lero\.al/<owner>/listings/<uuid>/$` accepted (the host's only special characters were the dots), and it removes F6's cause: no `new RegExp` in the file (`src/lib/media/cdnPurge.ts:28` is a literal).
- V5: `git show main:src/lib/media/cdnPurge.ts` → the file is new in this branch; the behaviour approved in Reviews 1-4 (the accepted and refused prefixes) is unchanged, as V4 shows.
- V5a: no visible element changed (`git diff --name-only c404b4c83 -- src` names no `.tsx`, `messages/` or style file); Review 4's measurements stand.
- V6: no `eslint-disable`, `skip`, `only`, `ts-expect-error`, allowlist or baseline added or removed.
- V7: below.
- V8: AC12 (`[SEC-PURGE-SHAPE]`): each half of the new check removed once → its rows fail (V3); restored.
- V9: no Story changed; Review 2's list stands.
- V10: `owasp.mjs review` → exit 0; every one of the 68 triggered sheets has its verdict in the record; JavaScript_and_TypeScript_Security keeps `met`, its evidence now also names `cdnPurge.security.test.ts`.

## V7 — secure code review

Six steps: no control weakened (the refused set equals the old one, two refusal rows added); no new entry point, parameter, outbound call or package; trust boundaries unchanged (the Cloudflare call, its fixed `API` host and the server-only module as before); no test or assertion deleted.
- JavaScript and TypeScript: touched — `src/lib/media/cdnPurge.ts:28`, `:74`: a regular expression literal, no nested or overlapping quantifier (`[A-Za-z0-9_-]+` is followed by the literal `/listings/`), so no ReDoS; nothing is built from a value.
- Requests and redirects: touched — the server-side fetch keeps the constant host `api.cloudflare.com` (`src/lib/media/cdnPurge.ts:21`, `:39`); the prefixes sent to it are those the check accepts.
- Tests: touched — two refusal rows; both halves of the check fail their rows when removed (V8).
- Authorization; input and output; authentication and sessions; Next.js entry points; business logic; data exposure, errors, logging; files; dependencies and configuration: not touched (`git diff --name-only c404b4c83 -- src` shows only the two files above: no action, route, query, page, log line, upload, package or workflow).
- Agent and tool output: every claim of the report rerun (V3); no invisible character in the two hunks (read).
- `db-catalog-audit.mjs` and `cloudinary-config.mjs`: not run; this revision changes no SQL, data write, role or upload (V7 names them for those).

## Open parts

- Owner: read the two hunks; commit and push (handoff in the reply); V14: `gh pr checks 76`, CodeQL alert 351 closed and "Lint, types and product checks" green.
