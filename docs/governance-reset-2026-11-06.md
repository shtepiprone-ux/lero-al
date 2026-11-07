# Governance reset — 2026-11-06

Owner instruction (2026-11-06, faithful translation): "Everything started with Task 923, when CI went red. After that
you created more than 20 tasks that go nowhere. I gave you the reference for the flow and gates of writing and checking
code quality, https://cheatsheetseries.owasp.org/index.html, and you ignored it. You have spent five days on Task 945:
over-engineering, walking in circles. Study the reference, rewrite the rules of the flow and the gates, and do this
task properly. Every task after 923 is trash: investigate them, delete the ones that do not match the reference, and
give the needed ones a deep audit and a rewrite."

This document is the audit. It is the single source for the reset; the old Sprint 92 records are superseded by it.

## 1. Measured state (2026-11-06)

| Fact | Observation |
|---|---|
| `main` CI | `Governance Validation (PR)` failed on the last two pushes to `main` (runs 39036771876, 2026-10-17; 41018456451, 2026-10-30): 9 of 15 jobs failed. |
| PR #12 (`task/935-governance-approval-route`) | 42 commits ahead of `main`, open since 2026-11-01; 9 checks fail (Unit, Governance Check, Task Security Contracts, Click-Shield, Locale Leak 1–4, Governance Required). |
| Size of the task records | Task 923 kickoff 1,152,733 bytes; 927 264,387; 942 95,373; 945 86,519 at revision 2. |
| Size of the custom gate system (removed by this reset) | `scripts/workflow-gates/`: 58 files, 11,935 lines of `.mjs`; `.claude/rules/`: 296 KB; 130 `package.json` scripts. |
| Production dependencies (`npm audit --omit=dev`) | **2 critical, 9 high, 18 moderate.** Critical: `next` 15.5.18 (Server Action DoS, SSRF in Server Actions and rewrites, cache confusion; fixed in 15.5.29, not a major), `@sentry/nextjs` (middleware bypass via the tunnel route). High includes `zod` (memory exhaustion on oversized collections), `sharp`, `postcss`, `nanoid`. |
| GitHub security features | Secret scanning and push protection: enabled. Dependabot alerts: **disabled**. Dependabot security updates: **disabled**. Code scanning (CodeQL): **no analysis exists**. The repository is public, so all of these are free. |
| `main` ruleset | Required checks are the two custom aggregate jobs `Governance Required` and `Release Security Required`; no SAST, SCA or secret check is required. |
| Agent hooks | The PreToolUse security hook refused a read-only `awk` print of a kickoff as a "kickoff write" in this session. |

Conclusion: five days of Sprint 92 built machinery that inspects the agent's own commands, while the controls the
reference names first — dependency scanning, SAST, secret scanning in CI, a green required test suite — are missing or
red, and production runs a `next` release with known critical advisories.

## 2. What the reference requires (sources read 2026-11-06)

Sheets read: Secure Code Review, CI/CD Security, GitHub Actions Security, Software Supply Chain Security, NPM Security,
Vulnerable Dependency Management, Secure Coding with AI, AI Agent Security, Threat Modeling, Attack Surface Analysis,
Secure Product Design, Next.js Security, Node.js Security, Authorization, Authorization Testing Automation,
Authorization Regression Testing, Input Validation, XSS Prevention, Database Security, Query Parameterization, Secrets
Management.

| Area | Requirement | Sheet |
|---|---|---|
| Review type | Diff-based review for every PR: impact on existing controls, new attack vectors, modified trust boundaries, new integrations, no regression, relevant patterns. Baseline review only for new apps, major releases, architecture changes, incidents. | Secure Code Review |
| Tools before humans | "Run automated tools before manual review"; SAST findings are triaged by a human; manual review focuses on what tools cannot see (business logic, authorization, races). | Secure Code Review, Supply Chain |
| Threat modeling | Four questions; done when the attack surface changes, not for every change. "Do not add techniques only to make the model appear comprehensive." Each threat gets a response; mitigations become requirements and tests. | Threat Modeling, Attack Surface |
| When a change needs a threat assessment | Only when it does not fit an existing bucket: authentication/session/password, authorization and roles, admin functions, secrets/crypto, fundamental changes to validation, new trust relationships. "More of the same" adds little risk. | Attack Surface Analysis |
| CI gates | SAST, secret scanning and dependency scanning in the pipeline; "block merges when high or critical severity issues are detected"; required status checks; `permissions: {}` by default; actions pinned to SHAs; zizmor/CodeQL for workflows. | CI/CD, GitHub Actions |
| Dependencies | `npm ci` with the lockfile; audit on every change; patch a fixed advisory by updating and running the tests (Case 1); Dependabot/Renovate with a cooldown; verify AI-suggested packages exist. | NPM, Vulnerable Dependency Mgmt, Secure Coding with AI |
| Authorization tests | A machine-readable actor × resource × action matrix; anonymous, wrong-owner, wrong-role and cross-tenant cases; the authz suite is a required check. | Authorization Regression Testing, Authorization Testing Automation |
| Next.js | Every Server Action and Route Handler is a client-callable entry point: validate input, derive identity on the server, check the exact object; never rely on middleware alone; test by calling the entry point directly. | Next.js Security |
| AI agents | Least privilege through tool permission scoping and a sandbox, enforced outside the agent; human review of every file of an agent PR; rules files (`CLAUDE.md`, `.claude/`) are security configuration changed only with human approval; AI review is not a substitute for human review; flag test deletions and weakened assertions. | AI Agent Security, Secure Coding with AI |
| Validation strategy | "Do not try to recognize every malicious string." Allowlists, not blocklists. | Input Validation |

What the reference does **not** contain: independent-session approval hooks, parsing of shell command lines to classify
writes, contract "rebase" chains between tasks, in-memory mutation of hook modules, claim ledgers with hundreds of
rows, or per-task security JSON sidecars. Sprint 92 built exactly these. Parsing every shell spelling of a write is a
blocklist that cannot be completed (Tasks 941 → 943 → 944 → 942 each found new bypasses), which is the failure the
Input Validation sheet describes; the reference's answer is permission scoping and a sandbox outside the agent.

## 3. Verdict per task after 923

Task 923 itself is in `main` (squash `d8a07a3c7`) and is not reopened.

| # | Subject | Verdict | Reason |
|---|---|---|---|
| 924 | 640 px compact sites | — | Already folded into 923 (2026-10-17). |
| 925 | `CustomRangeTooLong` Story error screen | **Fold into 939** | Same defect 939 fixes. |
| 926 | Company created only by a signed-in agent | **Keep, rewrite** | Real authorization defect: a company row and a logo grant are created with the service role and no session. Next.js sheet: a Server Action is a client-callable POST entry point; Authorization sheet: deny by default, check the exact object. Rewritten 2026-11-06 as **926** (P0: staff-only creation, no grant, sign-up note D2); the rest of the old scope is **949** (one company model). |
| 927 | Google sign-in shows Lero.al | **Close** | Shipped in `main` (`d8a07a3c7`); owner checks passed 2026-10-28. The production check of AC12 is an owner checklist item, not a task. |
| 928 | Google re-confirmation | — | Retired 2026-10-20. |
| 929 | Cabinet profile tab on Mantine | **Keep reserved** | Product UI work, unaffected by this reset. |
| 930 | Admin site settings shown on the site | **Keep reserved** | Product work. |
| 931 | Full unit suite green again | **Done on the branch** | Its test fixes (`vi.waitFor` instead of turn-counted waits) are committed on the branch; the full suite passed locally on 2026-11-06 (351 files, 5 931 tests). The first CI run confirms it. |
| 932 | Links a mail scanner cannot use up | **Keep reserved** | Authentication security (one-time links consumed by a GET). |
| 933 | Premium ends when its time is up | **Keep reserved** | Business-logic defect. |
| 934 | Company member counts exact | **Keep reserved** | Product defect. |
| 935 | Governance contracts, independent approval hook | **Delete, revert** | Not in the reference; AI review is not a substitute for human review. The owner's PR review is the approval. |
| 936 | No secrets or raw pages (custom gate) | **Delete** | Replaced by gitleaks in CI plus the already-enabled GitHub push protection. |
| 937 | Governance Check product findings | **Delete; product part → 948** | Its meta-gate findings disappear with the reset; the real product debt (design-token and enrolled-Tailwind findings) is **948**. |
| 938 | Click-Shield green | **Keep, design after the reset** | Product end-to-end check; its `page.goto` timeouts are real. |
| 939 | Locale Leak shards green | **Keep, rewrite (+925)** | Two real Story defects (FavoritesShell creates a Supabase client in Storybook; `CustomRangeTooLong` plays the desktop picker at mobile widths). |
| 940 | Audited scope rebase of reviewed contracts | **Delete, revert** | Machinery for 935's contracts. |
| 941 | Read-only shell commands are not writes | **Delete, revert** | Shell-command classification (blocklist). |
| 942 | Listing-visibility allowlist | **Delete** | Grew into shell write forms and MCP tool lists. Public listing visibility is an authorization concern: covered by the authorization regression suite in the new 945. |
| 943 | Commands that change files are writes | **Delete, revert** | Shell-command classification. |
| 944 | In-memory sensitivity breaks, hook load guard | **Delete, revert** | Machinery for the hooks above. |
| 945 | Written code is always checked | **Rewrite** | Owner's D25 is valid; the implementation (mutation testing in memory, dependency guard, refusal of tree text, restore guards) is not. New scope in §5. |
| 946 | — | — | Withdrawn 2026-11-05; never reused. |
| **947** | **Production dependencies without critical/high advisories** | **New, P0** | Vulnerable Dependency Management Case 1: `next` 15.5.18 → 15.5.28 and `@sentry/nextjs` → 10.76.2 (each ≥ 2 weeks old), transitive updates, `next-cloudinary@7` if no API break, then the full test suite. First task after the reset. |

## 4. The new flow (replaces the Sprint 92 workflow rules)

**Task design (Opus).** A kickoff has: goal, scope (files), acceptance criteria, tests, route. Target length: under
150 lines. Then one question: *does this change the attack surface?* (authentication/session/password, authorization
or roles or RLS, a new Server Action/Route Handler/API, secrets, file upload, a fundamental validation change, a new
dependency or CI change). If no, the standard checks apply and nothing more is written. If yes, add a threat model of
the four questions using STRIDE as prompts; each threat gets a response, and each mitigation becomes an acceptance
criterion with a test that calls the entry point directly (anonymous, wrong owner, wrong role).

**Implementation (Sonnet, or Opus for CI/hook files).** Write the code; the agent loop (§5 A) checks it; run the
named tests; report what was run and its output.

**Review (Opus).** Diff-based secure code review in the reference's six steps, the reference's checklist for the
touched categories, and triage of the CI findings (SAST, SCA, secrets). Findings use the reference's template: title,
severity, location, impact, recommendation. **Loop limit:** a task that reaches a second `NEEDS REVISION` stops; Opus
reports to the owner with a scope cut instead of a third revision.

**Merge (owner).** The owner reads the diff (every file, per Secure Coding with AI), the required checks are green, the
owner merges. Changes to `.github/`, `.claude/`, `CLAUDE.md` and `package.json` scripts are listed separately in the
PR description for the owner's attention.

## 5. Task 945, rewritten

**A. The agent loop (Claude Code hooks, one script, no command parsing).**
1. `PostToolUse` on `Edit|Write|MultiEdit`: run ESLint on the written file when it is `.ts/.tsx/.js/.mjs`; on errors,
   return them to the agent (exit code 2) so it fixes them at once.
2. `Stop`: when the working tree has changed TypeScript/JavaScript files, run `tsc --noEmit` (effect on other code)
   and `vitest related <changed files> --run`; on failure, block the stop with the output (respect
   `stop_hook_active` to avoid an endless loop).

**B. CI required checks on every PR to `main`.**
1. Quality: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
2. Dependencies: `npm audit --omit=dev --audit-level=high` blocks; Dependabot alerts and security updates enabled with
   a cooldown (owner setting).
3. SAST: CodeQL `javascript-typescript`, high/critical blocks.
4. Secrets: gitleaks (action pinned by SHA); GitHub push protection stays on.
5. Workflows: zizmor over `.github/workflows`; `permissions: {}` at workflow level, job-level `contents: read`.
6. Authorization regression: the authz matrix suite (anonymous / owner / other user / agent / admin against Server
   Actions, Route Handlers and RLS) as its own required job (`authz` in `ci.yml`, `npm run test:security-integration`).
7. Existing product checks stay as they are (Storybook build, Locale Leak, Click-Shield, Homepage Grid) and are made
   green by 931, 938, 939.

**C. Removal.** The meta-governance machinery that maps to no requirement in §2 is removed in the same change:
governance contracts and the independence hook, the security-contract sidecars and their CI job, shell-command write
classification, sensitivity records, phase receipts, review-evidence and kickoff-evidence gates, and the rule-document
inventory. The `git` deny list in `.claude/settings.json` stays (least privilege). The inventory of each removed file
and its consumers is done before deletion.

## 6. Order

1. Owner: commit the reset on a new branch, push, open the PR, close PR #12.
2. Owner: apply the `main` ruleset (`CI Required`, squash merge). This comes before any merge: the live ruleset
   requires `Governance Required` and `Release Security Required`, which come from workflows this PR deletes, so the
   PR could never merge under the old ruleset (`node scripts/quality/check-ruleset.mjs`, 2026-11-06: 4 differences).
3. The first CI run of the reset PR. Known red until the tasks land: product checks `design-tokens:strict` and
   `enrolled-tailwind` (948), dependency audit (947), locale leak (939), possibly click-shield (938).
4. **947 → 952 → 953 → 948 → 939 → 951 (→ 938 if click-shield is red) land on the reset branch itself**, each its own commit, reviewed
   by Opus, before the reset PR merges. Reason: `main` changes only through a PR whose `CI Required` is green, and CI
   runs on pull requests into `main` only, so a stacked PR into the reset branch would get no CI at all. The reset PR
   merges when `CI Required` is green.
5. Then 926 → 954 → 949 → 950, each a task on its own branch from `main`, reviewed by Opus, merged by the owner.

## 7. Done on 2026-11-06

- Rules: `.claude/rules/README.md`, `flow.md`, `quality-gates.md`, `secure-code-review.md`, `threat-model.md`,
  `security-testing.md`, `kickoff-template.md`; UI rules in `shared/` kept; skills, agents, `CLAUDE.md`, `AGENTS.md`
  rewritten; older docs carry a "superseded in part" banner.
- Agent loop: `scripts/quality/agent-check.mjs` (+ 6 tests, pass); `.claude/settings.json` denies mutating Git by
  permission rules; all old project hooks removed.
- ESLint security rules (`no-eval`, `no-implied-eval`, `no-new-func`, `no-script-url`, `react/no-danger`); `eslint .`
  exit 0, `tsc` 0 errors, unit suite green locally.
- CI: `.github/workflows/ci.yml` (12 jobs + **CI Required**); `governance-pr.yml`/`governance-scheduled.yml` removed;
  the `authz` job receives only the values it uses (the unused database URL is no longer exposed).
- Ruleset payload `scripts/quality/main-ruleset.json`.
- Removed (recoverable in `C:\Claude_Code_Projects\_lero-al-removed-2026-11-06\`): `scripts/workflow-gates/`,
  `.claude/hooks/` (removed), the receipt/phase rules, `*.security.json` sidecars, Sprint 92 files and their ledgers/evidence,
  the old 926 kickoff.
- Tasks: 945 record, 947, 926 (rewritten), 948, 939 (rewritten) kickoffs in `tasks/Sprints/Sprint_93_*`; 938 and 949
  reserved; backlog and archive updated.
- Not changed (outside the repository): two hooks in the owner's user-level Claude Code settings
  (`owner-only-git.ps1` parses shell commands for Git, `publication-stop.mjs`); they still run in every session.

## 8. Second pass on 2026-11-06 — owner D2: "quality must cover all files in the project, without exceptions"

The reference was re-read against the project. What changed:

- **Every file is checked**: `scripts/quality/check-files.mjs` (universal checks plus a check per file type — code,
  JSON, YAML, CSS, SQL, SVG, Markdown links and kickoffs, PowerShell, shell) with 13 tests. The first run over 22 352
  files found 30 findings plus 381 files with terminal escape codes after the control-character rule was added; all
  were fixed: oversized evidence and an unparsable CSS file moved to the backup folder, 5.9 million escape sequences
  stripped from recorded output, three recorded outputs repaired from mojibake, two detector reports allowlisted,
  a lost newline and a literal backspace repaired. Result: 0 findings.
- **Agent loop over every change**: `agent-check.mjs` now checks any written file type at once and, before finishing,
  every file changed by any tool (Bash included) since the session start; a crash of the check blocks instead of
  passing. 8 tests.
- **ESLint over every authored JS/TS file** (scripts, Storybook, root configuration), security rules on all of them,
  plus the core rules for irregular whitespace, misleading character classes and control characters in regular
  expressions; unused disable comments are errors. 0 errors over 1 301 files. Fixed on the way: the Function constructor
  in `check-click-shield.mjs` (self-test still "GATE IS FUNCTIONAL"), literal non-breaking spaces in 12 code files,
  a zero-width joiner inside a character class, CommonJS `require` in `import-locations`, two `@ts-ignore`.
- **Pre-commit hook** `.githooks/pre-commit` (staged content; owner enables it once).
- **CI**: daily run; the all-files check; the change report (sensitive paths, deleted or weakened tests, new
  dependencies; fails on a package missing from npm or younger than 30 days and on a foreign lockfile source); a
  validated CycloneDX SBOM; Harden-Runner in every job; OpenSSF Scorecard; Dependabot with a cooldown; the ruleset
  payload adds signed commits and linear history.
- **Agent permissions**: every Vercel MCP write tool denied; policy files and `npm install` behind the owner's approval.
- **Rules**: `quality-gates.md` (file-type table, four layers), `flow.md` (quality check after design,
  implementation and review; the executor's report is a supplier assertion; sub-agent output is untrusted),
  `secure-code-review.md` (baseline review, Next.js entry points and caches, business logic, ReDoS, `postMessage`,
  full finding and summary templates), `threat-model.md` (Transfer, abuse cases, testable mitigations),
  `security-testing.md` (authorization matrix, race and rate-limit cases), the kickoff template and the three skills.
- **Tasks**: 945 rewritten to the template; 947 revision 1 (install scripts off by default, `npm ls` clean — today it
  reports an invalid `@swc/helpers` and a missing `webpack` peer); 950 filed (baseline review of every entry point,
  the live schema in Git — the policies are not in the repository today — and the authorization matrix).
- **Open for the owner** at the end of this pass: see §9, which closed both.

## 9. Third pass on 2026-11-06 — owner: "everything must be covered by tests, all changes automatically, all holes fixed"

- **Every change is covered by a test** (`quality-gates.md` §8): every acceptance criterion names an automated test
  (check-files kickoff rule, 4 tests); product code changed without a test change blocks the agent's finish and fails
  the change report; CI measures changed-line coverage (`changed-lines-coverage.mjs`, at least one covered changed line
  per file and 80 % overall); tests first, revised criteria revise their tests; the skills, the flow, the template and
  the review checklist say so. The CI quality job runs every `scripts/quality/*.test.mjs` by glob (48 tests).
- **Dead references** (`stale-path`): an active document or rule naming a file or `npm run` script that is not in the
  repository, or a `package.json` script running a missing file, fails check-files. The first run found 68 such
  references in 24 files (rules naming the deleted hooks as the enforcement of GR-0, GR-5, GR-12; CI wiring in the
  deleted workflow; moved `AppImage`; removed components); all were repointed or marked as removed.
  `.claude/rules/README.md` now states that `.claude/rules/` wins over the older documents on process, and what a
  "receipt" in them means now.
- **GR-5 was not enforced after the reset** (its Stop hook was deleted): `check:backlog-active` now runs in the product
  checks, and it found Sprint 91 still listed as closed; 20 closed sprint plans moved to `tasks/Archive/`. A new check 5
  requires every reserved number in the registry: 17 were missing (929, 930, 932–934 filed by Task 923, re-measured
  against the code and all still needed; 899–922 older); 793 and 925 were recorded as reserved although closed and
  folded.
- **Surface census**: its changed-file limit counted every changed path, so this PR failed it with no surface involved;
  it now counts only the production files it maps (tests added, self-test 12/12, and it passes on this PR).
- **Ruleset drift**: `check-ruleset.mjs` reports a token that cannot see bypass actors instead of passing;
  `repository-settings.yml` runs it daily and on every ruleset change; the reviewer runs it at every review start.
- **One maintainer**: a required approval is impossible on GitHub with one maintainer — a constraint, not a decision;
  the compensating controls are written in `quality-gates.md` §5.
- **Publication guard**: `scripts/quality/push-safety.mjs` (5 tests) — a push only of the current task branch to
  `origin`, never `main`, never force/delete/mirror; a merge only as `--squash`, never `--admin`, and only while
  `CI Required` is green on an open PR to `main`. The owner repointed the user-level Stop hook to it on 2026-11-06 (an
  agent may not edit its own hooks).

## 10. First CI run of the reset PR (#19, run 42263240996, 2026-11-06)

Red as expected: dependency audit (947), design tokens and enrolled Tailwind (948), locale leak shards 1–4 (939).
Red and not expected — each fixed with a test, or filed:
- **The hydration gate's self-test had no browser** in the quality job. The job now installs Chromium;
  `scripts/quality/ci-workflow.test.mjs` fails when a job starts a browser gate without installing Playwright first.
- **The authorization suite read a Server Action manifest its job never built.** The `authz` job now builds first; the
  same test file fails when `test:security-integration` runs before `npm run build`. It also fails when `CI Required`
  does not wait for every job.
- **The mobile-adaptation gate read only changed kickoffs, from the commit, not the disk.** A local run therefore passed
  while CI failed. 377 of 380 kickoffs outside `tasks/Archive/` had no record, because closed tasks' kickoffs were never
  archived. Changes:
  - 361 closed tasks' kickoffs moved to `tasks/Archive/`, with 2 172 references rewritten;
  - the 19 open tasks' kickoffs now carry a record (10 visible, 9 `Scope: none`);
  - the gate reads every active kickoff from disk; its self-test (now 10 arms) runs in CI;
  - the kickoff template and the check-files kickoff rule include the section.
- **CodeQL, first full scan: 325 alerts.** Five were in this PR's own scripts and are fixed with tests:
  - ReDoS in the push guard's parser (a linear tokeniser now, plus a timing test on the input CodeQL named);
  - a check-then-read race in two files (one file descriptor);
  - agent-check state in the shared temp directory (it moved into the Git directory);
  - agent-check tools started through `cmd.exe` (Node now starts them with an argv array).

  The other 320 are Task 951, which lands on this branch before the merge.

## 11. Fourth pass on 2026-11-06 — owner: "re-read every page of the reference; do the tests see the routes change?"

All 137 sheets of https://cheatsheetseries.owasp.org/index.html were read again (10 batches). 43 target a stack this
project does not use (Java, .NET, PHP, Python, Ruby, Kubernetes, Docker, XML, SAML, GraphQL, gRPC, WebSocket servers,
mobile, payments, drones, cars) or are deprecated stubs (Access Control, TLS Cipher String, Transport Layer Protection).
The rest were compared with the rules, the skills, CI and the code.

The owner's three questions, answered from the code:
- **When an entry point moves, do the tests follow it?**
  - Yes for Task 952's move of the former middleware file (now removed) to `src/proxy.ts`. The two proxy suites import `@/proxy`.
    `src/__tests__/security/proxyFile.test.ts` (new in Task 952) fails while a `middleware.ts` exists or the proxy lacks its nonce.
  - Every live document that names a missing path fails `check-files.mjs`.
  - Each of the 93 Server Actions, and 20 of the 22 Route Handler methods, is imported and named by a test.
  - `serverEntryGuards.test.ts` fails on a renamed or deleted allow-listed entry point.
  - **Gap:** pages under `src/app/[locale]` are guarded in code, but no test enumerates them. Task 950 revision 1 adds
    pages, the proxy and every table to the matrix test.
- **Are tests created while a task is executed?**
  - The kickoff check refuses an AC that names no test.
  - The agent loop and the change report refuse product code changed with no test change.
  - Changed-line coverage runs in CI.
  - **Gap:** nothing checked that *the* test an AC names exists after execution, or that a revised AC changed its test.
    It was left to the reviewer's reading, against Verifying Third Party Agent Execution Evidence ("keep the
    verification policy and expected values outside the evidence under review").
  - Fixed: `scripts/quality/ac-tests.mjs` with 7 tests. The executor and the reviewer run it per kickoff.
    `change-report.mjs` runs it on every PR for each kickoff with a verdict, as a hard failure. On this branch it found
    Task 952 AC4 (`build-lints.test.mjs`); Opus places that test at review.
- **Are the tests of a revised route rewritten?** The same check covers it: an AC changed against the base needs its
  test changed.

Other gaps, each fixed now or filed:
- AI Agent Security ("Block releases when high-risk tool policies … change without updated tests"): no test pinned
  `.claude/settings.json`. Fixed: `scripts/quality/agent-settings.test.mjs` (6 tests; a loosened copy fails 3).
- Secure Coding with AI §8 ("Require human review of all AI-generated test modifications"):
  - the change report now lists every changed security or integration test for the owner;
  - `src/proxy.ts`, `instrumentation.ts` and the schema folder Task 950 will create joined the sensitive paths, because after Task 952 the
    proxy is the request gate.
- HTTP Headers, Transport Layer Security, Next.js Security, Key Management, Vulnerability Disclosure → **Task 954**:
  - production answers `X-Powered-By: Next.js`;
  - the `NEXT_LOCALE` cookie has no `Secure`;
  - no test scans the client bundle for secrets or pins the `NEXT_PUBLIC_` names;
  - there is no `security.txt`.
- Multi Tenant Security ("Fail when a new table has no classification, RLS is disabled"): no check covers every table.
  → Task 950 revision 1.
- Already met, no change: security headers (tested), safe redirects (tested), CSRF (Server Actions' origin check),
  action pinning, the 14-day dependency hold, the SBOM, the secret scan, CodeQL, zizmor, the daily run, hidden
  characters in every file, the two-revision loop limit, the owner's merge.
