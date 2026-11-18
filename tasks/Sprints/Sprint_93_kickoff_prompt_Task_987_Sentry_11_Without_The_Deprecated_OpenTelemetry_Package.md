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
- User_Privacy_Protection: "Preventing leakage of user IP addresses is of great significance when user protection is in scope." — Sentry 11 removed `sendDefaultPii`, so the tests pin the `dataCollection` baseline of MIGRATION.md (`userInfo: false`, no cookies, no bodies) in every configuration, and the scrubber still removes cookies, tokens and request bodies — AC2.
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
  `src/__tests__/sentryBuild.test.ts` pass; one deliberate break of the scrubber turns a scrub case red. Revision 1:
  `[SEC-X-SRV-SENTRY-SPAN-SCRUB]` in `src/lib/security/sentryScrub.security.test.ts`: a streamed span with markers in
  `name`, `url.full`, `url.query`, `url.fragment`, `http.request.header.authorization`, `http.request.header.cookie`, a
  nested attribute and a link's attribute keeps none of them (non-credential attributes stay), and an error event whose
  span data holds `http.request.header.authorization` keeps none; `src/__tests__/instrumentation.test.ts`: each
  configuration's `beforeSendSpan` scrubs that span and no configuration sets `beforeSendTransaction` or
  `traceLifecycle`; removing the header-attribute rule of the scrubber turns a case red (deliberate break).
- AC3 The upgrade is pinned, aged and lock-safe — test: `package.json` holds `"@sentry/nextjs": "11.10.0"` (or the dated
  later 11.x of Scope) and no `import-in-the-middle` override; `node scripts/quality/change-report.mjs --lockfile-age
  origin/main`, `node --test scripts/quality/install-scripts.test.mjs` and `npx --yes npm@10.9.8 ci --ignore-scripts
  --dry-run` exit 0.
- AC5 A failed refusal in `[SEC-DB-S61-DENY]` names the error it got — test:
  `src/tests/integration/accessHardening.integration.test.ts` (the update and the insert messages hold `error.message`)
  and `gh pr checks <n>` (the Authorization regression job).
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

Review 1 of the working tree on 54f2dc1cc (uncommitted) — NEEDS REVISION (1 of 2)
Scope: the 9 changed files, each but the lockfile read in three full passes by the reviewer; the lockfile through
`change-report.mjs --lockfile-age`, `install-scripts.test.mjs`, both audit gates and a name@version diff against
`origin/main` (10 added, all `@sentry/*` 11.10.0 and `web-vitals` 6.2.3; `sentry` 0.45.0 was already in the tree);
MIGRATION.md at tag 11.10.0 (every 10→11 heading, the data collection, span streaming, `enableLogs`, Removed APIs and
`@sentry/nextjs` sections), every breaking (`!`) entry of CHANGELOG 11.0.0 and the 11.1-11.10 entries naming nextjs,
PII, `dataCollection`, hooks or headers; the SDK code of `resolveDataCollectionOptions`, `filterKeyValueData`,
`httpHeadersToSpanAttributes` and the local-variables integration. OWASP record: `docs/security/owasp/reviews/Task_987.json`;
the reference remapped first (CI_CD_Security link fixes, Django_Security not applicable, upstream c12dd22e17ce).
Tools (local, final tree): `npx --yes npm@10.9.8 ci` 0 (only `tsconfck` deprecated); `quality` steps as `ci.yml` writes
them 0 (`owasp sync --verify`, `check`, lint, typecheck, `node --test "scripts/quality/*.test.mjs"` after F1,
`check-files.mjs --all` 14807 files, 36 of 36 product checks); `dependencies` 0 (npm 10.9.8 `ci --ignore-scripts`,
both audit gates, picomatch under O972-3); AC1 `npm ls` `(empty)`; AC3 lockfile age 0 younger than 14 days, dry run 0;
`check-ruleset.mjs` 0. Claims rerun: failing-first on the `origin/main` files 13 failed | 54 passed (67); the
`authorization` break 5 failed | 62 passed, restored (sha256 909c0f5a…), 67 passed. Long browser jobs, `authz`, CodeQL,
secrets and workflows: UNKNOWN until `gh pr checks <n>`. Findings: Medium 1, Low 7.
Overall risk: no credential leaves today (the SDK filters `auth` and `cookie` header attributes itself), but the
project's own scrubber misses the header attributes of Sentry 11 and the trace hook it relies on is deprecated.
F1 — `scripts/quality/install-scripts.test.mjs:16` still listed `@sentry/cli`, gone with 11.x, so `quality` and AC3 were
red. Severity: Low. Category: Dependencies and configuration. Cause: the kickoff Scope did not name that file (design).
Reproduction: `node --test scripts/quality/install-scripts.test.mjs` → "stale entry". Status: fixed in this change (Opus).
F2 — `sentry.server.config.ts:23` and `sentry.edge.config.ts:24` say request headers are not collected;
`SENTRY_DATA_COLLECTION.httpHeaders` (`sentryScrub.ts:30`) collects request and response headers minus a denylist.
Severity: Low. Category: Agent and tool output (facts rule). Reproduction: read both lines against `sentryScrub.ts:30`.
Status: Revision 1 R1-3.
F3 — the override `"import-in-the-middle": "3.0.1"` (`package.json:190`, Task 450) pins a package no longer in the tree
(`grep -c node_modules/import-in-the-middle package-lock.json` → 0; CHANGELOG 11.0.0 "Remove import-in-the-middle ESM
loader"), so any later consumer would get 3.0.1 unreviewed. Severity: Low. Category: Dependencies and configuration.
Status: Revision 1 R1-4, AC3.
F4 — AC5 asks a failed refusal to name its error; the insert refusals of the same case (`accessHardening…test.ts:126`,
`:127`) do not. Severity: Low. Category: Tests. Status: Revision 1 R1-5, AC5 narrowed to `[SEC-DB-S61-DENY]`.
F5 — the kickoff's User_Privacy_Protection line and backlog row said the tests still pin `sendDefaultPii: false`;
Sentry 11 removed it, so the tests had to change (they now pin the stricter baseline, a strengthening). Severity: Low.
Category: Agent and tool output. Status: corrected here (Opus).
F6 — `traceLifecycle: "static"` keeps `beforeSendTransaction`, which `options.d.ts:560` marks "will be removed in v12";
MIGRATION.md calls the static lifecycle "a temporary measure". Severity: Low. Category: Dependencies and configuration.
Status: Revision 1 R1-1 (owner, 2026-11-18, translated: "do not create a new task, we already have plenty of existing tasks").
F7 — Sentry 11 sends headers as span attributes `http.request.header.<name>` (`@sentry/core` `utils/request.js:151`);
the scrubber compares whole keys (`sentryScrub.ts:80`), so `http.request.header.authorization` and
`http.request.header.cookie` pass it unchanged. Severity: Medium (a missing defence-in-depth control; the SDK denylist
still filters them today). Category: Data exposure, errors, logging. CWE-532. Reproduction: `scrubSentryEvent` on a span
with those attributes keeps `HDR-MARKER` and `COOKIE-MARKER` (reviewer's tsx run). Status: Revision 1 R1-2, AC2.
F8 — Route step 1: the report read CHANGELOG 11.0.0 only through a keyword filter. Severity: Low. Category: Agent and
tool output. Status: closed by this review's read of every breaking entry (it found F3 and F7).

Revision 1 (Sonnet; only these items; three passes, failing-first for each new case):
- R1-1 `sentryScrub.ts`: `scrubSentrySpan` blanks a streamed span's `name` and walks its `attributes` and its links'
  attributes; the three configurations set `beforeSendSpan: (span) => scrubSentrySpan(span)` and drop
  `beforeSendTransaction` and `traceLifecycle` (MIGRATION.md "Replacing `beforeSendTransaction`").
- R1-2 `sentryScrub.ts`: a key `http.request.header.<name>` or `http.response.header.<name>` is judged as the header
  `<name>`: a credential header is redacted wherever the walk meets it (event span data, span attributes, log attributes).
- R1-3 the comments of F2 state what `dataCollection` collects; R1-4 the F3 override removed, the lockfile by
  `npx --yes npm@10.9.8 install --ignore-scripts`; R1-5 the F4 messages print `refused.error?.message`.
- R1-6 (owner, 2026-11-18, Sentry issue LERO-AL-2J): an unhandled `Error: pa` thrown in Google's One Tap script (stack
  only in `/gsi/client`, after its XHR to `accounts.google.com/gsi/status` returned 400) is reported as our code: the
  frame normalization rewrites every frame origin to `app://`
  (`node_modules/@sentry/nextjs/build/cjs/client/clientNormalizationIntegration.js:38`), so `https://accounts.google.com/gsi/client`
  (`src/lib/auth/googleIdentity.ts:9`) becomes `app:///gsi/client`, "In App". `src/instrumentation-client.ts`: an error
  whose every frame is in that script is not sent; an error with a frame of our code still is. Test in
  `src/__tests__/instrumentation.test.ts` (both cases, through the real client `init`, so the order of the SDK processors
  is proven, not assumed); the mechanism (`denyUrls` or `beforeSend`) is the one that test shows working.
- Tests: AC2 and AC5 as revised; the CI-parity run of `flow.md`.
Owner information (no code change): Sentry 11 names the Vercel environments `production` and `preview` instead of
`vercel-production` and `vercel-preview` (MIGRATION.md `@sentry/nextjs`); a Sentry alert or saved search on the old names
stops matching.

Review 2 of the working tree on 54f2dc1cc (uncommitted, Revision 1) — APPROVED
Scope: the 9 files of Revision 1, each but the lockfile read in full in three passes by the reviewer
(`sentryScrub.ts`, the three configurations, `instrumentation.test.ts`, `sentryScrub.security.test.ts`,
`accessHardening.integration.test.ts:103-132`, `package.json`); the lockfile through its tools; the SDK code the change
relies on: `StreamedSpanJSON` (`@sentry/core` `types/span.d.ts:29`), a plain `beforeSendSpan` callback runs on streamed
spans (`tracing/spans/captureSpan.js:35`, `beforeSendSpan.js` `isStaticBeforeSendSpanCallback`), header attributes are
lower-case `http.<request|response>.header.<name>` (`utils/request.js:151-189`), `denyUrls` judges one frame
(`integrations/eventFilters.js:140-158`), the client rewrites any origin to `app://` (`clientNormalizationIntegration.js:38`).
Tools (local, final tree): `owasp.mjs sync` and `check` 0; `check-ruleset.mjs` 0; `npx --yes npm@10.9.8 ci` 0 (only
`tsconfck` deprecated); `quality` as `ci.yml` writes it, `BASE_SHA=origin/main HEAD_SHA=HEAD`: `owasp sync --verify` 0,
`check` 0, lint 0, typecheck 0, `node --test "scripts/quality/*.test.mjs"` 0 (174 pass), `check-files.mjs --all` 0
(14808 files), playwright install 0, `product-gates.mjs` 0 (36 of 36); `dependencies`: npm 10.9.8 `ci --ignore-scripts`
0, both audit gates 0 blocking; AC1 `npm ls @opentelemetry/sdk-trace-base --all` → `(empty)`, no
`node_modules/import-in-the-middle` in the lockfile; AC3 lockfile age 0 younger than 14 days, `install-scripts.test.mjs`
4 of 4, dry run 0; `npm install --package-lock-only --ignore-scripts` leaves both sha256 unchanged (a1e703f0…, 2672fea8…);
AC2 the four test files 79 passed. Breaks rerun and restored (sha256 24b5a364…, a7d98f8b…, e8697fd7… OK): A header rule
off 4 failed | 48 passed; B Google filter off 3 failed | 49 passed; C server `beforeSendSpan` off 2 failed | 50 passed
(all as reported); reviewer's own D filter on the innermost frame only (the `denyUrls` behaviour) 2 failed | 50 passed;
E links not walked 4 failed | 48 passed. `owasp.mjs review --base origin/main` (the PR base the CI gate uses); local
`main` is d506fae33, behind `origin/main` a9915f3ba, so `--base main` also lists the files of Tasks 972 and 986.
AC5: `accessHardening.integration.test.ts:119-120,126-127` print `refused.error?.message`; a message shows only on a
failing refusal, so its run is the `authz` job. `unit`, `change-report` (it diffs commits, `change-report.mjs:193`), the
long browser jobs, `authz`, CodeQL, secrets and workflows: UNKNOWN until `gh pr checks <n>`. Findings: Low 2.
Overall risk: low; spans, their header attributes and their links are scrubbed by the project in all three runtimes, and
only an error wholly inside Google's script is dropped on the client.
F9 — the report says `owasp gate` and `changed-lines` compare only commits; both diff the merge base against the working
tree (`owasp.mjs:563`, `changed-lines-coverage.mjs:114`), only `change-report.mjs:193` diffs `base...head`. Severity: Low.
Category: Agent and tool output (facts rule). Status: corrected here (Opus); the change report runs on the pull request.
F10 — R1-6 was coded before its test (reported). Severity: Low. Category: Tests. Status: closed by breaks B and D above
(the cases are red without the filter and with a one-frame filter).
PR #48 on fe033bd5e, run 44386307624: every job green (`authz` 11m57s, so AC5; `unit`, `change-report`, CodeQL,
gitleaks, zizmor, SBOM, Storybook, homepage grid, locale leak 1-6, click-shield) but `quality`.
F11 — `quality` red: `check:backlog-active` → "line 52: closed-state marker "APPROVED" outside Last Session"
(`scripts/check-backlog-active.mjs:46-47`); the reviewer wrote the verdict into the backlog row after running
`product-gates.mjs`. Severity: Low. Category: Agent and tool output. Status: fixed in this change (the row says
"approved", as the open rows do); `product-gates.mjs` and `check-files.mjs` rerun on the fixed files.
