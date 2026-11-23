# Task 963 — Review 1

Kickoff: [Sprint_93_kickoff_prompt_Task_963_OWASP_Gate_Task_Gate_And_Golden_Rule.md](../../tasks/Archive/Sprint_93_kickoff_prompt_Task_963_OWASP_Gate_Task_Gate_And_Golden_Rule.md) · OWASP record: [Task_963.json](../security/owasp/reviews/Task_963.json)

Review 1 of `main` at b7bdbaa97 (tree `57ae73c4`, the same as the local HEAD ee16a5cfb) — NEEDS REVISION
Scope: the implementation of Task 963 as it stands in `main` (landed with PR #19 and revised since; D974-1 withdrew AC9 and AC16): the files the kickoff's
Scope names that exist, read in full: `scripts/quality/owasp.mjs`, `check-files.mjs`, `locale-safety.mjs`, `client-sinks.mjs`, `change-report.mjs`, and the
gate wiring of `.github/workflows/ci.yml` (`:43-59`, `:210-265`, `:655-658`). The reviewer is a session that did not write the task (kickoff line 10).
Tools (local, 2026-11-23): `owasp.mjs sync`, `owasp.mjs check`, `check-ruleset.mjs` → exit 0; `gh run list --branch main --limit 2` → CI and Scorecard
`success` on `b7bdbaa97`; `node --test scripts/quality/<file>` for `owasp` (25), `check-files` (32), `locale-safety` (5), `client-sinks` (4), `ci-secrets` (11),
`agent-settings` (8), `db-catalog-audit` (18), `cloudinary-config` (9), `change-report` (10) `.test.mjs` → every one exit 0; `npm test --
src/__tests__/security/clientSinks.test.ts src/modules/cms/lib/__tests__/sanitizeCmsHtml.security.test.ts scripts/__tests__/check-locale-leak.test.ts` →
exit 0, 75 passed; `check-files.mjs docs/security/audit-2026-11-06/findings.md` → exit 0; `owasp.mjs kickoff tasks/Sprints/Sprint_93_*.md` → exit 0;
`check-surface-census-changed.mjs`, `check-ui-contract.mjs`, `check-mobile-adaptation-contract.mjs --verify-gate` → exit 0 (14 arms, "PASSED", "PASSED");
`gh api` code-scanning alerts `state=open` and `state=dismissed`; `owasp.mjs review <kickoff> --base HEAD` → exit 0. CI-only commands (A5): AC8's
`check-files.mjs --all`, `npm run lint`, the quality-script run, and AC2's task gate, read from `main` run 45242783638 (the steps "Every file in the
repository", "ESLint", "Quality script tests" and the job "OWASP task gate" → `success`).
Findings: Critical 0, High 0, Medium 0, Low 4 (F1-F4)
Overall risk: low; every gate of the task detects what it is meant to (four deliberate breaks, below), CI runs them on every change; two CodeQL alerts
are open on a quality script, AC11 was never built, and two records are stale.

## Deliberate breaks (Route step 2, V8; each file restored, md5 equal before and after)

- AC1: a quote of `controls.json` (File_Upload) changed by two words → `node scripts/quality/owasp.mjs check` exit 1, "O6 File_Upload quote not in the sheet".
- AC2: `owasp.mjs:470` reads every kickoff as approved → `node --test scripts/quality/owasp.test.mjs` exit 1.
- AC4: a product file with `dangerouslySetInnerHTML` (created and deleted) → `check-files.mjs` exit 1, "K8 raw HTML output".
- AC5: the status of A-02 in `findings.md` turned into a bare remark → `check-files.mjs` exit 1, "A-02: only reported".

## Secure code review (`secure-code-review.md` §2, §3)

1. Existing controls: none weakened. 2. New vectors: the scripts start only `git`, `node` and `npm view` with argument arrays (`owasp.mjs:219`, `:600`;
`change-report.mjs:186` with a shell on Windows only after `isNpmName`, `:179-181`); `owasp.mjs changedFiles` refuses a base that is not a ref (`:598`).
3. Trust boundaries: upstream OWASP text is pinned by commit and blob id and refused on mismatch (`owasp.mjs:550-570`). 4. Integrations: none new.
5. Regression: none; D974-1's withdrawals are recorded in the kickoff. 6. Categories: Dependencies and configuration — touched: `ci.yml` (the owasp-gate
job, `CI Required` needs it, `ci-secrets.test.mjs`); Input and output — touched: the locale and sink rules (tests above); Data exposure, Secrets — touched:
F1; Authorization, Authentication, Requests, Next.js, Business logic, Files — not touched (no product file in the Scope); Agent and tool output — the gate
checks an agent's quote against the sheet (AC1 break); Tests — AC11 has no test (F2).

## Rendered comparison (V5a)

No visible element: the Scope is quality scripts, rules and CI. V9: no Story.

## Findings

F1 — a quality script parses `.env.local` itself and sends what it read to the network; CodeQL alerts #349 and #350 are open
Severity: Low      Category: Secrets Management; Dependencies and configuration      CWE: CWE-201
Location: scripts/quality/cloudinary-config.mjs:116-131 (`readEnv`), :140 (`adminGet`), :167 (`readReferences`)
Description: `readEnv` reads `.env.local` with `readFileSync` and its values reach `fetch` (the Cloudinary Admin API, `:140`; PostgREST, `:167`). CodeQL
opened #349 (`:140`, created 2026-11-23, the flow of the dismissed #327 after Task 957 moved it) and #350 (`:167`, the U4 read Task 957 added),
`js/file-access-to-http`, medium; D-CQ1 (2026-11-08) dismissed four named alerts only ("D2 stands for every other alert"), and AC10 requires no open alert
on this file. Task 957 Review 13 did not list them (the CodeQL check passes on a medium alert).
Impact: no exposure found (both hosts are fixed and checked: `:134`, `:162`); untriaged alerts stay open on `main`, and a hand-written parser of the secret
file is the code that CodeQL cannot tell from a leak.
Recommendation (owner decision O963-1): the credentials come from the environment only: `readEnv` keeps the `process.env` loop over `NAMES` and drops the
`.env.local` read; the tool runs as `node --env-file=.env.local scripts/quality/cloudinary-config.mjs` (Node 22's own loader), and every place that names the
command says so; on the pull request #349 and #350 are reported fixed by the CodeQL run, with no dismissal.
Status: Revision 1 R1-1.

F2 — AC11 was never built
Severity: Low      Category: Tests      CWE: none
Location: scripts/quality/product-gates.mjs:11; scripts/check-ui-contract.mjs:363; scripts/check-mobile-adaptation-contract.mjs:283; the 14 arms of
`check-surface-census-changed.mjs --verify-gate` (none for an uncommitted file)
Description: the local run of the product gates reads `HEAD`, not the working tree, and no self-test arm covers an untracked component. Since A5 (owner,
2026-11-22: "CI must now be checked only on GitHub") no product gate runs locally, so the criterion has no remaining purpose.
Status: withdrawn by owner decision O963-2 (2026-11-23, translated: "withdraw"), recorded in the kickoff; no code change.

F3 — `OWASP_GRANDFATHERED` still holds an archived task
Severity: Low      Category: Agent and tool output      CWE: none
Location: scripts/quality/owasp.mjs:60-63
Description: the set's own rule says "A number leaves this set when its kickoff is archived"; Task 947's kickoff is in `tasks/Archive/`, and the set
still holds `'947'`. It changes no result today (only kickoffs under `tasks/Sprints/` are read: `check-files.mjs:72`, `owasp.mjs:689`), but the exemption list
is no longer what its rule says.
Recommendation: the set is empty (`new Set()`), its comment kept; `owasp.test.mjs:276` still holds.
Status: Revision 1 R1-2.

F4 — a reviewed client sink names the wrong task
Severity: Low      Category: Input and output      CWE: none
Location: scripts/quality/client-sinks.mjs:44-45
Description: the K5 entry for `NotificationItem.tsx` says "OPEN finding P-06, Task 959"; P-06 moved to Task 988 on 2026-11-19
(`Sprint_93_kickoff_prompt_Task_959_Auth_Abuse_Keys_Data_Exposure.md:7`), whose AC4 removes this entry
(`Sprint_94_kickoff_prompt_Task_988_The_Chosen_Language_Stays.md:118`).
Recommendation: the reason names Task 988.
Status: Revision 1 R1-3.

## Revision 1 (Opus, a session other than this reviewer's; only these items)

- R1-1 (F1, O963-1) `cloudinary-config.mjs` reads its credentials from the environment only; the command in the rules names `--env-file=.env.local`.
- R1-2 (F3) `OWASP_GRANDFATHERED` is empty.
- R1-3 (F4) the K5 reason names Task 988.

Open parts, in order: Revision 1 (Opus) → Review 2 → the commit and pull request (H) → `gh pr checks <n>` (CodeQL: #349 and #350 fixed) → the merge.
