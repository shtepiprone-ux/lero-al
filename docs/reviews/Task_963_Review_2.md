# Task 963 — Review 2

Kickoff: [Sprint_93_kickoff_prompt_Task_963_OWASP_Gate_Task_Gate_And_Golden_Rule.md](../../tasks/Sprints/Sprint_93_kickoff_prompt_Task_963_OWASP_Gate_Task_Gate_And_Golden_Rule.md) · OWASP record: [Task_963.json](../security/owasp/reviews/Task_963.json)

Review 2 of Revision 1, working tree on ee16a5cfb (uncommitted) — NEEDS REVISION
Scope: the Revision 1 diff of the implementer (an Opus session other than this reviewer's): `scripts/quality/cloudinary-config.mjs`,
`cloudinary-config.test.mjs`, `owasp.mjs`, `client-sinks.mjs`, the command line in `.claude/rules/checklists/design.md`, `execute.md`, `review.md`,
`.claude/rules/quality-gates.md`, `.claude/rules/secure-code-review.md`, and two further active mentions of the command the reviewer's prompt asked to be
found: `docs/env.md:10` and `Sprint_93_kickoff_prompt_Task_1003_Whole_Project_Security_Review_Repeated.md:30`, `:84` (accepted: without `--env-file` the
command now stops with exit 2, so the old line is a wrong instruction).
Tools (local, 2026-11-23): `node --test scripts/quality/` `cloudinary-config` (10 passed), `owasp` (25), `client-sinks` (4) `.test.mjs` → exit 0;
`check-files.test.mjs` → exit 1, 31 passed, 1 failed (F5); `node scripts/quality/client-sinks.mjs` → exit 0, 562 files; `owasp.mjs check` → exit 0;
`check-files.mjs` the 11 changed files → exit 0; the break of R1-1 (the old `.env.local` read put back once, restored, md5 `aed90938…` before and after) →
`cloudinary-config.test.mjs` exit 1, "not ok 9 - O963-1"; `node --env-file=.env.local scripts/quality/cloudinary-config.mjs` → exit 1, U1 (below).
Findings: Critical 0, High 0, Medium 0, Low 1 (F5); F1, F3, F4 fixed; F2 withdrawn (O963-2)
Overall risk: the revision does what it names; one quality-script test still pins the exemption R1-2 removed, so CI's quality job would fail.

## Secure code review (`secure-code-review.md` §2, §3)

`cloudinary-config.mjs`: no file read reaches `fetch` (`readFileSync` serves `--snapshot` only, a presets list that is judged and never sent); the hosts
stay fixed and checked (`:126`, `:154`). Rules: one command per line changed, no other text. Every other category: not touched.

## Findings

F1, F3, F4 — fixed in Revision 1 (R1-1 to R1-3); R1-1 proven by the break above.

F5 — the test that pins the removed exemption still expects it
Severity: Low      Category: Tests      CWE: none
Location: scripts/quality/check-files.test.mjs:139
Description: `assert.ok(!rules('tasks/Sprints/Sprint_93_kickoff_prompt_Task_947_X.md', invented, none).includes('owasp'), 'a grandfathered kickoff is not
held to the OWASP gate')` expects Task 947 to be exempt; R1-2 emptied `OWASP_GRANDFATHERED`, so the test fails (`node --test
scripts/quality/check-files.test.mjs` → "not ok 11 - kickoffs from Sprint 93 on follow the template"). The cause is the R1-2 item of Review 1 (Opus): it
named `owasp.test.mjs:276` and not this test, and the implementer's run did not include `check-files.test.mjs`.
Recommendation: the assertion turns into what the empty set means: the same invented quote in a Sprint 93 kickoff of Task 947 IS an `owasp` finding
(`assert.ok(rules(...Task_947_X.md, invented, none).includes('owasp'), 'no kickoff is exempt from the OWASP gate')`); nothing else changes.
Status: Revision 2 R2-1.

## Outside this task (A4): X-01 is not fixed

`node --env-file=.env.local scripts/quality/cloudinary-config.mjs` → exit 1: "U1 the preset named by NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: unsigned:
anyone who knows the name uploads any file into the account". The unsigned preset of audit finding X-01 (High) still exists in the Cloudinary account;
no code uses it (`grep -rn NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET src` → nothing). The ledger row X-01 says "fixed in Task 957" since PR #67: written by this
reviewer in Task 957's archive without running the tool, against A3. The fix is the owner's in the Cloudinary console (Settings → Upload → Upload
presets: delete the unsigned preset) and the removal of `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` from `.env.local` and the Vercel project; the tool then
exits 0 and the row is true. Until then the row must name an open holder.

## Revision 2 (Opus, a session other than this reviewer's; only this item)

- R2-1 (F5) `check-files.test.mjs:139` asserts that a Task 947 kickoff is held to the OWASP gate like every other.

Open parts, in order: the owner's X-01 action → Revision 2 → Review 3 → the commit and pull request (H) → `gh pr checks <n>` (CodeQL: #349 and #350
fixed) → the merge.
