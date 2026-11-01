# Workflow validation evidence

Read with `workflow-gates.md` and `workflow-contract.md`.

## Evidence and limits

Import `digest`/`planDigest`/`scopeDigest`/`validateReport` from the canonical module in a scoped harness. Never copy their algorithms or
invent successful results. Digests normalize CRLF, bind file paths, record deleted files as absent, and sort object keys
by UTF-16 code unit (RFC 8785), never by the runtime locale; they are not plain file hashes.

The report has `version:1`, `status:passed`, `contractSha256` (`planDigest(root,contract)`, excluding mutable stage/review), `scopeSha256`
(`scopeDigest(root,contract)`: scope, declared inputs, every mapped test and present runtime/config lockfiles), explicit empty `errors`/`vulnerabilities`, and
`cleanup:{verified:true,remaining:0,errors:[]}`. A failed cleanup query is not zero remaining. `cases` contains
exactly the contract IDs, `status:passed`, and positive `assertionCount`. Each critical result additionally has
`sensitivity:{baseline:passed,mutant:failed,failureKind:assertion,restored:passed,testName,artifact,artifactSha256}`;
hash the retained artifact with `digest(root,[artifact])` and inspect its raw mutation/failed-assertion evidence.
Nonempty vulnerabilities/errors, skipped/missing cases, stale hashes, uncertain cleanup and runtime/timeout failure
offered as sensitivity must fail. The old Task 923 DB harness is not release evidence until adapted and reviewed.

`verify` reruns exact mapped files with focused tests, empty success and retry disabled, checks collection and
exact full names, then validates the retained report. Unit children receive only a basic OS/CI environment and
NODE_ENV=test; automatic env-file loading is disabled. Integration/browser/provider cases run separately against
the approved development target through `vitest.integration.config.ts`; local cases use `vitest.config.ts`.
A missing project or zero collected mapped tests fails; never fall back to the other collection.
`vitest.integration.config.ts` is not in the committed tree or the gate publication set (it is a product path).
Until a reviewed product task commits it, every integration/browser/provider case fails closed. Both project
configurations are bound into evidence hashes. Raw JSON results remain in `test-results/workflow-gates/security-runs/`.
Mapped suites use installed Vitest's `expect.requireAssertions:true`; a collected case without a Vitest `expect`
assertion fails. This does not establish assertion quality. Use local expect for concurrent tests. The full unit job
also validates its actual nonempty JSON result: totals must agree with every collected passed status, with zero
failed or pending tests, rather than trusting only the npm command's exit code.
Real boundary cases still need their actual adapters and independently inspected results. JSON shape cannot prove that a guard was not mocked or a
mutation failed for the intended assertion. The reviewer establishes those facts; a scanner never proves RLS.
CI uses `diff --phase release`: an implementation product diff needs reviewed stage and fresh independent evidence.

