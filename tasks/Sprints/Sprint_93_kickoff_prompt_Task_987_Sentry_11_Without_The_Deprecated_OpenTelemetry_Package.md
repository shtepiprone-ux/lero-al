# Task 987 — Sentry 11, so the production tree holds no deprecated OpenTelemetry package

Sprint 93. Priority P2. Found 2026-11-18 by Opus in Task 986 Review 1 (finding F4); owner decision O986-1 (2026-11-18,
option chosen: "accept the tsconfck risk; file a task for @sentry/nextjs 11"). Implementer: Sonnet, after Task 986 is
merged (both change `package.json` and `package-lock.json`). Reviewer: Opus. Human owner of the change: the owner.

## Goal

`@sentry/nextjs` 10 brings the deprecated `@opentelemetry/sdk-trace-base` 2.12.0 into the production tree, so the error
reporting path depends on a package its authors no longer develop. After the task `@sentry/nextjs` is on 11, no
deprecated `@opentelemetry/*` package is in the tree, and error reporting with its PII scrubbing works as before.

## Cause

- `package.json:147` declares `@sentry/nextjs` `^10.76.2`; `npm ls @opentelemetry/sdk-trace-base --all` → 2.12.0 under
  `@sentry/nextjs@10.78.0 > @sentry/node@10.78.0` and `@sentry/opentelemetry@10.78.0`.
- `npm view @opentelemetry/sdk-trace-base@2.12.0 deprecated` → "Use @opentelemetry/sdk-trace package".
- `npm view @sentry/node@11.10.0 dependencies --json` → `@sentry/core`, `@opentelemetry/api`, `@sentry/conventions`,
  `@sentry/server-utils`, `@sentry/opentelemetry`, `@sentry/bundler-plugins`, `@sentry/server-runtime-injection`;
  `npm view @sentry/opentelemetry@11.10.0 dependencies --json` → `@sentry/core`, `@sentry/conventions` (neither names
  `@opentelemetry/sdk-trace-base`; the deeper tree: UNKNOWN until installed, AC1); `npm view @sentry/nextjs time` → 11.10.0 released 2026-10-28T16:18:38Z (the newest
  11.x at least 14 days old on 2026-11-18); `npm view @sentry/nextjs@11.14.0 peerDependencies` → `next` `^16.0.0-0` allowed.
- The Sentry setup of the project: `sentry.server.config.ts`, `sentry.edge.config.ts`, `src/instrumentation.ts`,
  `src/instrumentation-client.ts`, `src/lib/build/sentryBuild.ts`, `src/lib/security/sentryScrub.ts`. Which of them a
  major version needs to change: UNKNOWN until the 11.x release notes are read (Route step 1).
Fix: `@sentry/nextjs` exactly `11.10.0`; the changes 11.x requires in the files above, each with its source in the
release notes; the lockfile written by npm 10.9.8.

## Scope

- `package.json`, `package-lock.json`: `@sentry/nextjs` exactly `11.10.0` (or a later 11.x that is at least 14 days old
  on the day of the install, named in the report with its date); `npx --yes npm@10.9.8 install --ignore-scripts`; no other
  version change except what the upgrade itself brings.
- Dependencies: `@sentry/nextjs` 11.10.0 — `npm view @sentry/nextjs time.created` and the release date in the report;
  `npm view @sentry/nextjs@11.10.0 scripts` → no install script (build and test scripts only, read 2026-11-18 for 11.14.0).
- The six Sentry files of "## Cause": only the changes the 11.x release notes require, each change citing its note.
- `src/tests/integration/accessHardening.integration.test.ts:119-120` (owner, 2026-11-18: within existing tasks): the
  assertion messages also print `refused.error?.message`, so a refusal without a code names its cause; the `main` run
  44297702442 failed there with the code `''` and no message (the same tree passed on PR #47, run 44290937552).
- Out of scope: `tsconfck` (owner decision O986-1, re-checked on 2026-12-18); any Sentry setting not required by 11.x.

## Attack surface

Changed: the error reporting path (server, edge, client) and its PII scrubbing. Threat model:
- T1 Information disclosure: the upgrade changes what an event carries and the scrubber misses a field → the existing
  `sentryScrub` tests run on 11.x, and every event hook the scrubber uses still exists — mitigate, AC2.
- T2 Tampering (supply chain): the new major carries a malicious or young version → exact pin, at least 14 days old,
  lockfile by npm 10.9.8, `ignore-scripts=true` — mitigate, AC3.
- T3 Denial of service (regressions): the build or instrumentation breaks → AC4.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (upstream 7af0ef1b745f, 2026-11-18).

- Abuse_Case: not applicable — no feature or entry point is added; denial of service here is a build regression only.
- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — the error reporting path changes major version and loses a deprecated package — AC1, AC2.
- Bot_Management_and_Anti-Automation: not applicable — no endpoint or request limit changes in a Sentry upgrade.
- Credential_Stuffing_Prevention: not applicable — sign-in and its CAPTCHA are not touched by this task.
- Denial_of_Service: not applicable — no product endpoint or resource limit changes; regressions are covered by AC4.
- Dependency_Graph_SBOM: not applicable — the SBOM job is unchanged and records the new production versions on its run.
- JavaScript_and_TypeScript_Security: not applicable — the test change only adds the error message to two assertion texts.
- Logging: "The following should usually not be recorded directly in the logs, but instead should be removed, masked, sanitized, hashed, or encrypted" — the scrubber keeps removing personal data on 11.x, proven by its tests and a break — AC2.
- Logging_Vocabulary: not applicable — no event is added or renamed; only the reporting library version changes.
- NPM_Security: "Always vet and perform due-diligence on third-party modules you install to confirm their health and credibility." — the version, its date and its scripts are read on npm in Scope — AC3.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — the review reads each Sentry file change against its release note — AC2, AC4.
- Secure_Coding_with_AI: "AI coding assistants frequently suggest package names that do not exist on public registries" — no new package name; the existing one moves a major, read with `npm view` — AC3.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — each threat of the model maps to an acceptance criterion — AC2, AC3, AC4.
- Software_Supply_Chain_Security: "limit the application's dependencies to a specific version that has been previously verified as legitimate and secure" — exact pin of a version at least 14 days old — AC3.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — the Attack surface answers them for the upgrade — AC2, AC3, AC4.
- User_Privacy_Protection: "Preventing leakage of user IP addresses is of great significance when user protection is in scope." — on 11.x the test still pins `sendDefaultPii: false` (`src/lib/security/sentryScrub.security.test.ts:64-65`) and the scrubber still removes cookies, tokens and request bodies — AC2.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns AC1-AC3 and the AC2 break — AC1, AC2, AC3.
- Vulnerable_Dependency_Management: "It's highly recommended to perform automated analysis of the dependencies from the birth of the project." — a deprecated production package leaves; the CI audit covers the new versions — AC1, AC3.

## UI

No visible change.

## Mobile adaptation record

- Scope: none

## Acceptance criteria

- AC1 No deprecated `@opentelemetry/*` package is in the tree — test: `npx --yes npm@10.9.8 ci` prints no
  `npm warn deprecated @opentelemetry`; `npm ls @opentelemetry/sdk-trace-base --all` prints `(empty)`.
- AC2 PII scrubbing and instrumentation work on 11.x — test: `src/lib/security/sentryScrub.security.test.ts`,
  `src/lib/security/__tests__/sentryScrub.test.ts`, `src/__tests__/instrumentation.test.ts`,
  `src/__tests__/sentryBuild.test.ts` pass; one deliberate break of the scrubber turns a scrub case red.
- AC3 The upgrade is pinned, aged and lock-safe — test: `package.json` holds `"@sentry/nextjs": "11.10.0"` (or the dated
  later 11.x of Scope); `node scripts/quality/change-report.mjs --lockfile-age origin/main`, `node --test
  scripts/quality/install-scripts.test.mjs` and `npx --yes npm@10.9.8 ci --ignore-scripts --dry-run` exit 0.
- AC5 A failed refusal in the authorization suite names the error it got — test:
  `src/tests/integration/accessHardening.integration.test.ts` (its message holds `error.message`) and `gh pr checks <n>`
  (the Authorization regression job).
- AC4 The project still builds and passes — test: `npm run build`, `npm test -- --coverage --allowOnly=false
  --passWithNoTests=false --retry=0` and `node scripts/quality/product-gates.mjs` exit 0 (with the rest of the CI-parity
  rule of `flow.md`).

## Route

1. Read the 11.x release notes from 10.78.0 up to the chosen version; list each change that touches one of the six files.
2. Test first: the AC1 commands on the unchanged tree (red); save the output.
3. The upgrade per Scope; the file changes of step 1; three passes over every changed file.
4. Run: <task tests> · the CI job commands of the CI-parity rule (`flow.md`), read from `ci.yml`, with
   `npx --yes npm@10.9.8 ci`; the AC2 break.
5. Report: each command, exit code, relevant output; every version change with its release date.

## Review
