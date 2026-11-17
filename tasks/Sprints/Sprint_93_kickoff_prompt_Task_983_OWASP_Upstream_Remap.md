# Task 983 — The OWASP mapping follows the cheat sheets published on 2026-11-16, and the CI quality job is green again

Sprint 93. Priority P0 (`main` CI is red, PR #41 waits on it). Owner decision F28 (2026-11-16, Task 956 kickoff) "the
remap of the changed sheets is a separate PR from main". Implementer: Opus (OWASP mapping). Reviewer: Opus, in a
session of its own. Human owner of the change: the owner.

## Goal

Upstream added two cheat sheets and changed seven, so the first step of the CI quality job fails on `main` and on every
pull request. After the task the committed registry equals upstream at commit `18e4396f7605`, every added and changed
sheet is read in full and mapped at its new version, and every step of the job "Lint, types and product checks" exits 0.

## Cause

`gh run view 43868998598 --log-failed` → "owasp sync: upstream differs from docs/security/owasp/sheets.json" (scheduled
run on `bb9e2b35a`, job "Lint, types and product checks", step `.github/workflows/ci.yml:46-49`); the same output lists
"added: CORS_Security", "added: Path_Traversal_Prevention" and "changed:" `File_Upload`, `Forgot_Password`,
`Input_Validation`, `Kubernetes_Security`, `Multi_Tenant_Security`, `Web_Cache_Security`, `XML_Security`.
`node --test scripts/quality/owasp.test.mjs` → "# fail 1": the test of `scripts/quality/owasp.test.mjs:287-303` runs
`checkMapping` over the committed registry and mapping (`scripts/quality/owasp.test.mjs:296-297`), and after
`owasp.mjs sync` they disagree: O2 for the two unmapped sheets and O3 for the seven read at an older blob
(`scripts/quality/owasp.mjs:252-253`). The test is right; the mapping is behind upstream.
What changed upstream (diff of each old `reviewedSha` blob against the new text): `Input_Validation` gained the section
"Host and Forwarded Headers"; `File_Upload`, `Forgot_Password` and `Web_Cache_Security` gained a link to it or to the new
`Path_Traversal_Prevention`; `Multi_Tenant_Security` replaced its SQLAlchemy example with prose; `XML_Security` rewrote
its schema-validation section; `Kubernetes_Security` added managed-cluster guidance. No quote of the mapping was removed.
The new "Build absolute URLs, such as password reset and email links, from configuration instead of the request" is met
for e-mailed links (`src/lib/auth/trustedOrigin.ts:49-61`) and not for two sign-in responses: `src/app/auth/confirm/route.ts:21`
and `src/app/auth/callback/route.ts:11` take `origin` from `new URL(request.url)` and answer with it (`:45`, `:28`).
The new `Path_Traversal_Prevention` is met by Task 951's fix (`scripts/lib/within-repository.mjs:29-35`, AC8 test
`scripts/lib/__tests__/within-repository.test.ts:51-106`), and its trigger names that open kickoff
(`tasks/Sprints/Sprint_93_kickoff_prompt_Task_951_CodeQL_Alerts_Closed.md:60`).
Review 1 (2026-11-17): upstream moved to `18e4396f7605` (`owasp.mjs sync --verify` → "changed: HTTP_Headers",
"changed: XML_Security"). `HTTP_Headers` gained an Nginx `add_header`/`proxy_hide_header` paragraph: no Nginx exists,
and each security header is set in one layer (`src/lib/security/headers.ts:15-21` by `next.config.ts:16-17`, the
report-only policy by `src/proxy.ts:56-64`); `XML_Security` rewrote its malformed-document and jumbo-payload sections,
and the project still parses no XML. The new section of `Input_Validation` holds two more requirements, "Accept only
the hostnames …" and "Use `Forwarded` and `X-Forwarded-*` values only …": no code checks the request's host
(`src/proxy.ts:58-83`); both go to Task 984.
Fix: `owasp.mjs sync`; map the two new sheets and re-read the seven; every requirement the project does not yet meet goes
to a numbered task (Task 984).

## Scope

- `docs/security/owasp/sheets.json`: written by `node scripts/quality/owasp.mjs sync`, never by hand.
- `docs/security/owasp/controls.json`: `CORS_Security` and `Path_Traversal_Prevention` added (applicability, word
  triggers, requirement quotes with their control and evidence); the nine changed sheets at their new `reviewedSha`;
  `Forgot_Password` gains the trusted-domains requirement; `Input_Validation` gains "Build absolute URLs …", "Accept
  only the hostnames …" and "Use `Forwarded` and `X-Forwarded-*` values only …", handed to Task 984 (see "## Cause").
- Task 951's kickoff: its "## OWASP" gains `Path_Traversal_Prevention` with its AC8; its review record
  `docs/security/owasp/reviews/Task_951.json` gains the verdict `met` for that sheet.
- New kickoff of Task 984; `docs/backlog.md` registry rows for 983 and 984.
- Dependencies: none.
- Out of scope: product code (Task 984 changes the two routes of "## Cause"); the OWASP tool and its tests (unchanged:
  the failing test reports the drift as designed); the remap of the same sheets on the Task 956 branch (PR #41), which
  the owner reconciles when that branch takes `main`.

## Attack surface

Unchanged: the task changes the OWASP mapping, three kickoffs, two review records and the backlog; no code, configuration,
route, policy or dependency changes.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (registry at `31f5b8f5ad29`; rerun at `18e4396f7605` in review 1).

- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — the upstream sheet texts are data: every quote of the mapping is checked against the cached sheet by the tool, not taken from the agent — AC2.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns every command of the criteria on the candidate commit; CI is read from GitHub — AC1, AC2, AC3, AC4, AC5.

## UI

No visible change.

## Mobile adaptation record

- Scope: none

## Acceptance criteria

- AC1 Upstream equals the committed registry — test: `node scripts/quality/owasp.mjs sync --verify` exits 0.
- AC2 Every sheet is mapped at its current version, every quote is in its sheet and every control holds its evidence —
  test: `node scripts/quality/owasp.mjs check` exits 0.
- AC3 The quality script tests pass, the mapping test of `scripts/quality/owasp.test.mjs:287` included — test:
  `node --test "scripts/quality/*.test.mjs"` exits 0.
- AC4 Every file and every open kickoff holds, Task 951 and Task 984 included — test:
  `node scripts/quality/check-files.mjs --all` exits 0.
- AC5 The other steps of the job "Lint, types and product checks" pass on the change — test: `npm ci`, `npm run lint`,
  `npm run typecheck`, `npx playwright install chromium --with-deps` and `node scripts/quality/product-gates.mjs` each
  exit 0.

## Route

1. `node scripts/quality/owasp.mjs sync`; read every added and changed sheet in `.cache/owasp/` in full; write the
   mapping; `node scripts/quality/owasp.mjs check` exits 0.
2. `node scripts/quality/owasp.mjs plan` for this kickoff and for Task 984; write their "## OWASP".
3. Run, in the order of `.github/workflows/ci.yml:42-66`: `npm ci` · `node scripts/quality/owasp.mjs sync --verify` ·
   `node scripts/quality/owasp.mjs check` · `npm run lint` · `npm run typecheck` ·
   `node --test "scripts/quality/*.test.mjs"` · `node scripts/quality/check-files.mjs --all` ·
   `npx playwright install chromium --with-deps` · `node scripts/quality/product-gates.mjs`.
4. Report: each command with its exit code and the relevant output.

## Review

Review 1 of the working tree on `bb9e2b35a` (branch `task/983-owasp-upstream-remap`, uncommitted) — APPROVED
Scope: diff-based; no entry point, code or configuration changes. Read in full three times: the kickoffs of Tasks 983
and 984, `docs/security/owasp/reviews/Task_983.json`; read in full once: the Task 951 kickoff; read three times as
every changed hunk with its context, not in full: `docs/backlog.md` (about 50 000 tokens),
`docs/security/owasp/controls.json`, `docs/security/owasp/sheets.json`, `docs/security/owasp/reviews/Task_951.json`
(the size does not fit three full reads in one session; `flow.md` §2 step 3 is not met for these four files, stated
to the owner).
Tools (local, 2026-11-17, after the review-1 changes): `node scripts/quality/owasp.mjs sync --verify` 0 ·
`node scripts/quality/owasp.mjs check` 0 · `npm run lint` 0 · `npm run typecheck` 0 ·
`node --test "scripts/quality/*.test.mjs"` 0 · `node scripts/quality/check-files.mjs --all` 0 ·
`node scripts/quality/product-gates.mjs` 0 · `node scripts/quality/owasp.mjs review <this kickoff> --base main` 0 ·
`node scripts/quality/owasp.mjs gate --base main` 0. CodeQL, `npm audit` and the other jobs: read on the pull request.
Findings: Critical 0, High 0, Medium 1, Low 1 (F1 fixed in review 1; F2 handed to Task 984).
Overall risk: documentation only; the mapping is current and every requirement of the new sheets has a control or Task 984.

F1 — AC1 did not reproduce: upstream moved after the remap
Severity: Medium      Category: Agent and tool output      CWE: —
Location: `docs/security/owasp/sheets.json`, `docs/security/owasp/controls.json` (`HTTP_Headers`, `XML_Security`)
Description: `owasp.mjs sync --verify` exited 1 ("changed: HTTP_Headers", "changed: XML_Security", upstream `18e4396f7605`).
Impact: the first step of the CI quality job stays red on `main` and on every pull request.
Reproduction: `node scripts/quality/owasp.mjs sync --verify` on the implementer's tree → exit 1.
Recommendation: sync, read both diffs, set `reviewedSha` (done: no new requirement applies, see "## Cause").
References: `flow.md` §1 step 5; `secure-code-review.md` §1.6.
Status: fixed in review 1 (working tree).

F2 — the new "Host and Forwarded Headers" section was mapped in part
Severity: Low      Category: Input and output      CWE: —
Location: `docs/security/owasp/controls.json` (`Input_Validation`); `.cache/owasp/Input_Validation.md:71-72`
Description: of the four requirements of the section only "Build absolute URLs …" had a control or task; "Accept only
the hostnames …" and "Use `Forwarded` and `X-Forwarded-*` values only …" apply (`src/proxy.ts:58-83` serves any `Host`)
and had neither. The fourth (a default virtual host on the reverse proxy) names no project control: Vercel operates
the edge (`controls.json` `Network_Segmentation`, `Infrastructure_as_Code_Security`).
Impact: a request on a host the site does not serve is answered as the site; the gap was not handed to any task.
Reproduction: `git diff -- docs/security/owasp/controls.json` before review 1: `Input_Validation` gained one quote of
the section; `.cache/owasp/Input_Validation.md:70-73` holds four.
Recommendation: hand both to Task 984 (done: Scope, T4, AC7 `[SEC-984-PROXY-HOST-REFUSE]`, O984-1 now names the hosts).
References: Input_Validation Cheat Sheet, "Host and Forwarded Headers".
Status: task 984.

Owner decision 2026-11-17 (translated: "delete read-coverage, you do not follow it anyway and it brings many problems"):
the "## Read set" sections of the kickoffs of Tasks 983 and 984 are removed; no rule on `main` asks for them. The
review-1 changes (F1, F2, Task 984 AC7) are written by the reviewer and are for the owner to read in the pull request.
