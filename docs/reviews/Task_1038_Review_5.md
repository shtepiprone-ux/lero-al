# Task 1038 — Review 5

Kickoff: [Sprint_94_kickoff_prompt_Task_1038_Listing_Photos_Optimised_In_The_Browser_Stored_In_R2.md](../../tasks/Sprints/Sprint_94_kickoff_prompt_Task_1038_Listing_Photos_Optimised_In_The_Browser_Stored_In_R2.md) · OWASP record: [Task_1038.json](../security/owasp/reviews/Task_1038.json)

Review 5 of pull request #76 at c404b4c83 (checklist V14, CI run 45636903009) — NEEDS REVISION
Scope: every check of the pull request, all concluded; the tree is the one [Review 4](Task_1038_Review_4.md) read, committed unchanged.
Tools: `gh pr checks 76`: 20 passed, 3 failed (CodeQL, "Lint, types and product checks", and "CI Required" because of it); `owasp.mjs sync` → exit 0, `check` → exit 0; `check-ruleset.mjs` → exit 0; the nine commits are verified by GitHub.
Findings: Critical 0, High 0, Medium 1 (F6), Low 1 (F7, fixed here)
Overall risk: no behaviour is wrong; CodeQL refuses a regular expression built with a partial escape, and two kickoff records missed registry ids.

## Checks

- Passed: Unit and component tests (443 files, 7 655 tests; `src/__tests__/security/proxyFile.test.ts` 4 of 4, so `[SEC-T1-SRV-BUILT-PROXY]`, left to CI by I8 and V3, holds; 604 of 620 changed lines covered), Authorization regression (with `task1038.sql` applied), Dependency audit, Change report, OWASP task gate, SBOM, Secret scan, Workflow security, Storybook build, Homepage grid, Locale leak 1-6, Click-shield, the CodeQL analysis itself, Vercel.
- Change report: no test deleted or weakened, no secret-scan marker, no hard failure; sensitive paths for the owner: five rule files, `eslint.config.mjs`, `package.json`, `package-lock.json`, nine security test files, `src/proxy.ts`; `aws4fetch` and `browser-image-compression` first published 2 896 and 3 413 days ago.
- Failed: CodeQL → F6; "Lint, types and product checks" → F7 (35 of 36 product checks passed).
- `main`: the scheduled run 45632546651 is red on "OWASP reference — upstream equals the committed registry" only (7 sheets changed upstream); the branch holds the registry at `05861f28ed88`, so this pull request repairs it. No code of `main` failed.

## Findings

F6 — A regular expression is built from the media host with only its dots escaped
Severity: Medium      Category: JavaScript and TypeScript      CWE: 116
Location: src/lib/media/cdnPurge.ts:28
Description: `new RegExp` of `MEDIA_HOST.replace(/\./g, '\\.')` and the path; CodeQL alert 351, `js/incomplete-sanitization`, high: "This does not escape backslash characters in the input."
Impact: CodeQL blocks the merge (quality-gates.md §5: high alerts are fixed before merge). INFERENCE: no wrong prefix passes today, because `MEDIA_HOST` is the constant `media.lero.al` (`src/lib/uploads/imageUrl.ts:18`). Present since the first implementation; Reviews 1-4 and the handoff of Review 4 (H2) did not see it.
Reproduction: `gh api "repos/:owner/:repo/code-scanning/alerts?ref=refs/pull/76/merge&state=open"` → alert 351.
Recommendation: R4-1.
References: quality-gates.md §5 (CodeQL); checklist H2.
Status: open

F7 — Two kickoffs' mobile records miss registry ids
Severity: Low      Category: Tests and gates      CWE: —
Location: the "Mobile adaptation record" of the kickoffs of Tasks 1038 and 1044
Description: 1038 names `MantineProgress` as a Mantine owner without its family; 1044 lists 4 of the 9 standards its two patterns require.
Impact: `check-mobile-adaptation-contract.mjs` fails.
Recommendation: 1038: family `inline-status-and-utility-control` added; 1044: `w3c-hover-focus`, `android-common-layouts`, `w3c-meaningful-sequence`, `apple-hig-layout`, `android-layout-basics` added (`scripts/mobile-adaptation-patterns.json`); the records of 997, 1037, 1038 and 1044 compared with that registry: nothing missing.
Status: fixed in this review (Opus's documentation, uncommitted); CI runs the check

## Revision 4 (for the implementer)

- R4-1 (F6): `src/lib/media/cdnPurge.ts`: no regular expression is built from `MEDIA_HOST`. `PREFIX` becomes a regular expression literal of the path after the host, `/^\/[A-Za-z0-9_-]+\/listings\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/$/`, and a prefix is valid only when it starts with `MEDIA_HOST` and the rest, `prefix.slice(MEDIA_HOST.length)`, matches the literal; the comment above it says both halves. Nothing else in the file changes: the accepted and refused prefixes stay the same.
- `src/lib/media/__tests__/cdnPurge.security.test.ts`: the `[SEC-PURGE-SHAPE] a prefix with %s is refused` table gains two rows built from the folder of the file: a host that differs from `media.lero.al` in one character of the same length (`mediaxlero.al`), and a host that only begins with it (`media.lero.al.evil.example`). They pass on the unchanged code, because the fault is the form and not the behaviour; the failing-first evidence is CodeQL alert 351. Deliberate breaks (I9): the `MEDIA_HOST` half removed → at least the one-character row fails; the literal half removed → the query, fragment, wildcard, `..` and no-trailing-slash rows fail.
- Files: only these two.
