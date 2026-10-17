# Security test quality

Read with [the security testing contract](security-testing.md). These are requirements for test implementations
and reviews, including existing tests touched by a task.

## Tests that can detect a broken protection

- Import the actual production function/component. Do not copy its algorithm into the test or compute expected
  results through the same implementation under test. Derive expectations from the saved behavior contract.
- Each test has one named invariant. Split unrelated actions into separate cases; a parameterized matrix may share
  setup when every row has an intelligible actor, payload and expected result. Test names state who does what to
  whose resource and the outcome. Await every security-relevant asynchronous action and assertion.
- Verify successful authorized behavior as well as rejection. Denial must assert the exact supported error/status,
  prohibited data absence and prohibited side effects. A truthy error or absence from the DOM alone is insufficient.
  Where HTTP represents RLS denial as zero rows, assert the empty result AND unchanged database state.
- Assert exact response/payload field allowlists at disclosure boundaries. A partial matcher may complement an
  exact shape check, but cannot prove that extra PII, tokens or privileged columns were absent.
- Check forbidden writes, provider requests, emails, analytics and notifications through explicit observers. Do not
  assert only that a mocked permission helper was called; inspect the actual returned response and state/effects.
- Do not mock the protection being claimed: real guards for guard tests, real schemas for validation tests, real
  signature verification for signature tests, real redaction for privacy tests. Unit I/O doubles are legitimate,
  but their configured behavior and omitted guarantees must be stated.
- A source scanner's self-test must invoke the SAME production checker on the planted input. Rechecking a regular
  expression written in the test does not prove the checker detected it. Guard-name presence, an unused guard,
  an ignored authorization result, or a check after a sensitive read cannot establish effective authorization.
- `any`, blanket lint/type suppression, unexplained `as never`/non-null assertions and catch-all successful proxies
  are not acceptable shortcuts. Hostile values outside a TypeScript type enter through `unknown` and an explicit,
  narrow test boundary. Test code follows the project's strict typing and encoding rules.

## Fixtures and doubles

Use deterministic synthetic records shaped like the actual schemas: valid IDs, separate owners, localized profile
fields, listing states, catalogue entries and realistic relationships. Invalid fixtures violate one named condition
at a time. Never use real customer records, phone numbers, credentials or production exports as fixtures. Use
reserved example domains and explicitly synthetic, non-contacted phone fixtures compatible with validation.

Factories provide schema-valid defaults and named overrides; they must not fill omitted relationships or change
authorization expectations silently. Each cross-account test seeds BOTH the attacker's resource and the victim's
resource, proves the legitimate control works, then proves the victim's data/state is unchanged or undisclosed.
Do not use empty data or identical actors to prove isolation. The same rule applies to payment orders and sessions.

Separate user-scoped and privileged-client doubles; record which client was used. A fake DB must fail loudly for
unsupported operations. It must not silently accept unknown filters, ignore projections/joins, return the first of
several rows for `single`, or invent grants/transactions/RLS. Test the supported fake behavior against a real adapter
contract where relied upon; otherwise narrow its assertions to recorded queries. Never claim a fake tests Postgres.

Isolation, credential capabilities and permission to use the existing development database are defined once in
[test environment](security-test-environment.md). Follow it for setup, network interception and cleanup.

## Collection, coverage and handoff evidence

Keep a case-to-test matrix for the task: frontend, server and each applicable external boundary. Run the named
cases against the submitted state. Record platform, Node/tool versions, schema identity, command, real exit code,
collected/passed/failed/skipped counts and the scoped files; a transcript from an older diff is not final proof.
Use a native Windows or CI runtime as required by the project's review rules.

Required security cases must run in blocking CI before approval/release. No `.only`, undisclosed `.skip`/TODO,
empty-collection success, swallowed unhandled rejection, automatic green-on-retry or `continue-on-error` for these
checks. New/existing test paths and changes to schemas, policies, configuration, dependencies and lockfiles must
trigger their relevant suites. Opus verifies actual workflow wiring and check results, not just an npm script name.
Where CI infrastructure is absent, record the gap; these rules do not create it.

Coverage is collected on the mapped production security modules, including unimported files, and is separated
from UI/design-system/governance totals. Inspect branches for authorization, ownership, validation, redaction,
signature/state and error handling. Every changed applicable allow/deny/error branch needs a mapped case; exclusions
need a precise independent review rationale. Coverage numbers alone do not prove an assertion or a real boundary.
Do not raise coverage by testing only fixtures/mocks, copying the implementation or excluding difficult files.

Retain redacted machine-readable results and relevant mutation/coverage artifacts with reproducible metadata.
The executor reports missing layers and unsupported claims explicitly. Independent review reruns relevant checks
and examines assertions and mutation failures; Sonnet's summary or the total number of passing tests is not approval.

## Sensitivity and reproducibility

For each new/changed critical protection: baseline PASS; scoped deliberate break FAIL for the intended assertion;
restore PASS. Retain the mutation diff/description, failed test name and failure reason. A compile/import error,
timeout or missing service is not evidence that an attack was detected. Equivalent mutants need a written rationale;
surviving relevant mutants require better assertions or an explicit unresolved gap. Use a disposable copy or an
in-memory injection supported by the harness; preserve unrelated dirty work. No manual mutation of live services.

Review new shared helpers and security harnesses independently of their author. Check deterministic collection and
isolation with at least three fresh runs covering normal order and seeded shuffled order. Run race/atomicity cases
with controlled competing transactions and verify durable outcomes; repeated sequential mocks do not test races.
These repetitions supplement, not replace, the distinct proofs in the parent contract. See
[mutation result definitions](https://stryker-mutator.io/docs/mutation-testing-elements/mutant-states-and-metrics/).
