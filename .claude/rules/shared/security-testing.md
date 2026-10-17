# Security testing contract

Owner decisions: 2026-10-17. Every task Opus creates/edits and Sonnet executes must address frontend AND server
security. This supplements existing QA/RLS rules without changing role authority or certifying the app secure.
The owner permits using the existing development DB; isolate test records, not necessarily a separate project.

## Mandatory loading and task coverage

Read this file before designing, revising, executing, or reviewing any task. For product/test work also read
[test quality](security-test-quality.md), [test environment](security-test-environment.md), and applicable
[boundary cases](security-test-boundaries.md). Payment/premium-entitlement work additionally reads
[payment cases](security-test-payments.md). Opus remains the independent reviewer; Sonnet cannot approve itself.

Every new or revised saved task MUST contain `## Security test contract` with:

| Field | Required content |
|---|---|
| Assets and boundaries | Actual entry points, consumer components, sensitive fields, dependencies and owners, with current source locators. |
| Frontend security | Named real component/consumer tests, allowed behavior, hostile input/denial behavior and absent data/side effects. |
| Server security | Named action/route tests, session and object/field authorization, allowed behavior, denial and absent data/side effects. |
| Database/integrations | Real RLS/grants/RPC/Storage/Realtime/provider checks needed for the affected invariant; specify applicability. |
| Cases | Stable case IDs, actor/resource matrix, expected public response and allowed output fields. |
| Fixtures and environment | Synthetic records, approved target, per-run fixture scope, allowed destinations and cleanup ownership. |
| Sensitivity proof | Exact protection to break in isolation, the case expected to fail, and restored-pass evidence. |
| Execution | Inspected test paths, exact runnable commands, expected collected cases, required evidence and QA profile. |

For EVERY product task, both frontend and server rows require tests. A backend-only diff must name tests of its
actual frontend consumer; a frontend-only diff must name tests of the server boundary that consumer relies on.
Existing tests may satisfy a preserved invariant only when their assertions are inspected, case IDs are mapped,
and they are rerun for the submitted state. Changed security behavior requires a changed-behavior regression test.
Do not create a fictional UI or endpoint to inflate counts. A missing real consumer/boundary is an explicit task
design gap for Opus to resolve, never permission for Sonnet to silently drop one row.

Only a genuine Q0 task containing documentation/rules/task-record changes alone may mark runtime rows N/A. Opus
must record the exact files and why no runtime behavior, dependency, executable gate or deployment configuration
changes. Q0 still validates rule references/structure and any affected enforcement claims. A low QA profile,
small diff, screenshot, typecheck, or build cannot waive frontend/server security tests for product work.

Sonnet checks this section before implementation. Missing criteria are `BLOCKED — SECURITY TEST CONTRACT MISSING`;
Sonnet reports the gap without inventing policy. An older task revised after this decision must be brought into
the contract before execution. Opus cannot approve a product task with either required security row unverified.

## Architecture and separation

Use the existing Vitest and Testing Library stack for synchronous React/unit work. Preserve colocated tests; do
not move working tests merely to rename them. Separate runnable projects/suites by responsibility:

| Suite | Runtime and responsibility | Does not prove |
|---|---|---|
| Unit/domain | Node; real validators, authorization decisions, serializers, token/state rules; no external I/O. | Deployed grants, transport or provider behavior. |
| Frontend/component | DOM + real components; submission, hostile content, authorized presentation and failure behavior. | Server access control or full browser XSS behavior. |
| Server/application | Node; real actions/handlers, real guards; explicit I/O doubles. | HTTP framework enforcement or PostgreSQL RLS. |
| Database/integration | Real PostgreSQL/Supabase; grants, RLS, RPC, constraints and concurrent transactions on scoped fixtures. | Browser rendering or payment provider delivery. |
| HTTP/browser | Running Next.js app + approved services; actual requests, sessions, SSR/RSC, caching, cookies and UI. | Settings outside the tested environment. |
| Static/supply chain | Syntax/import/bundle checks, dependencies and secrets checks. | Effective authorization merely because a guard name exists. |

New harness support belongs under the existing `src/tests/` owner, separated into typed fixture builders, I/O
adapters and contract assertions. Real-DB and browser suites must have explicit separate collection/configuration;
do not mix them into a global jsdom suite or silently require live services for unit tests. This is a directory and
responsibility contract, not a claim those runners already exist. Opus must inspect actual tool versions and paths
before specifying commands. Missing infrastructure is recorded as missing evidence, never a successful mock substitute.

Keep authorization, validation, data projection and external adapters testable through existing module boundaries.
A refactor needs a scoped task and preservation tests; do not add duplicate policy engines for testability.

## Verification and review depth

For each critical security invariant require three distinct proofs: real-code behavior tests, the relevant real
boundary integration test, and a controlled violation that the corresponding check detects. A scanner is supporting
evidence only. Repeating the same green test three times is not three independent security proofs.

Use Q4 for auth/account lifecycle, permissions/RLS, private-data exposure, uploads with privileged writes and
payment/integrity-critical changes, as already required by `docs/qa-profiles.md`. Q0 applies to this rules-only
change. Keep required build/visual evidence from that file; security evidence never replaces it.

The minimum evidence record per case is: ID; invariant/threat; source/requirement; actor and target; fixture IDs;
layer; input/attack; exact allowed response; absent sensitive fields and forbidden effects; test path/name;
command/platform/version; result/exit code; applicable mutation and restored result. Enumerate all applicable
allow/deny cases, not just a line-coverage percentage. Missing cases stay UNVERIFIED with impact.

## Standards and maintenance

As inspected on 2026-10-17, [OWASP ASVS](https://owasp.org/projects/asvs) identifies 5.0.0 as the stable baseline.
Use its applicable Level 2 requirements as the project's verification target, with risk-based higher rigor for
privileged/payment flows. This is a project target, not a compliance claim. Cite actual versioned requirement IDs
only after reading them; do not fabricate mappings. Refresh primary sources on security-sensitive changes and
when installed versions change. AI-assisted attackers do not remove the need to test ordinary trust boundaries.

Installed-version documentation takes precedence for implementation APIs. Read `node_modules/next/dist/docs/`
when present; if absent, record that fact and use matching-version official Next.js docs. Do not assume APIs from
another major version. Also consult [Next.js data security](https://nextjs.org/docs/15/app/guides/data-security)
and [Vitest mocking guidance](https://vitest.dev/guide/mocking).

These Markdown rules are workflow requirements. They do NOT by themselves install CI jobs, protect a branch or
implement a machine-enforced task checker. Approval claims must distinguish a read/review obligation from an
inspected, tested executable gate. Never claim a gate exists from its name in a document.
