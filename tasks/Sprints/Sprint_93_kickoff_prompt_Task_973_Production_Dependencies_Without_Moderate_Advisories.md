# Task 973 — Production dependencies without a moderate advisory, and each low one shown unreachable

Sprint 93. Priority P2. Found 2026-11-12 by Opus with Task 972 (the GitHub notice on the push of PR #30); no owner
decision needed (golden rule, 2026-11-07). Implementer: Sonnet, on `task/973-production-moderate-advisories` from
`main` after Task 972 merges, and not before 2026-11-24, the day `@sentry/nextjs` 11.12.0 (released 2026-11-10) is 14
days old. Opus, not the executor (`execute-task` forbids `.github/**` and `.claude/**`), raises the CI production audit
level, writes its `scripts/quality/ci-workflow.test.mjs` case and the `.claude/rules/quality-gates.md` row. Reviewer: Opus.
Human owner of the change: the owner.

## Goal

`npm audit --omit=dev` on 2026-11-12 reports 6 moderate and 5 low advisories; CI blocks only high and critical
(`.github/workflows/ci.yml:164`). After Task 972 (its probe on a scratch copy) 4 moderate and 4 low remain:
- `glob` (GHSA-3g3m-2fjr-6pw4, `>=9.0.0 <=14.0.1`) and `minimatch` (GHSA-g3hv-75wg-m249, `>=7.0.0 <11.0.1`) reach
  production through `@sentry/nextjs` `^10.76.2` (`package.json`) → `@sentry/webpack-plugin` → `@sentry/bundler-plugins`;
  the audit's only fix is `@sentry/nextjs` 11.12.0, a major version.
- `deepmerge` (GHSA-gcqx-w48m-w2h4, prototype poisoning, `>=4.2.0 <=4.3.1`) reaches production through
  `@react-email/components` → `@react-email/render` → `html-to-text`; no fixed version exists. `html-to-text` runs only
  when `render` is asked for plain text; the one call, `render(params.react)`
  (`src/modules/notifications/lib/emails/send.ts:84`), passes no options, but no test holds that.

After the task `npm audit --omit=dev --audit-level=moderate` exits 0, CI blocks a moderate advisory in a production
dependency, and a test fails the day the email code starts the plain-text path that carries `deepmerge`.

## Scope

- `package.json`, `package-lock.json`: `@sentry/nextjs` 11.12.0 or the newest 11.x at least 14 days old on the day of
  the run (`npm view @sentry/nextjs time scripts --json` in the report). The Sentry 10 → 11 upgrade guide is read
  first; every API this project uses (`next.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`,
  `src/instrumentation.ts`, `src/instrumentation-client.ts`, `src/app/global-error.tsx`,
  `src/components/auth/CaptchaWidget.tsx`) is checked against it, and each change it needs is made with its test.
  `src/__tests__/instrumentation.test.ts` stays green.
- `src/modules/notifications/lib/emails/__tests__/send.security.test.ts`: a case that fails when `sendEmail` calls
  `render` with options, and a source check that fails when any file under `src/` asks `@react-email/render` for plain
  text (`plainText` or `toPlainText`).
- Opus: the production step of `.github/workflows/ci.yml` runs `npm audit --omit=dev --audit-level=moderate`, its
  `scripts/quality/ci-workflow.test.mjs` case, the "Dependency audit" row of `.claude/rules/quality-gates.md`.
- Dependencies: none added; one major version of an existing package.
- Out of scope: Sentry configuration beyond what the major version requires; development dependencies (Task 972).

## Attack surface

Dependency change in the error-reporting package; no route, action or permission changes. Threat model
(`.claude/rules/threat-model.md`):
- T1 Tampering (supply chain): the new major carries malicious code → a version at least 14 days old from the npm
  registry, `ignore-scripts=true`, `scripts/quality/install-scripts.test.mjs` — mitigate.
- T2 Information disclosure: the major changes what Sentry sends (request data, tunnel route) → the upgrade guide's
  defaults are read and the existing scrubbing and tunnel settings stay as they are, held by
  `src/__tests__/instrumentation.test.ts` — mitigate.
- T3 Tampering (prototype poisoning): a later change starts plain-text email rendering with outside data → AC3 — mitigate;
  the advisory itself has no fix — the owner is told in the report (only the owner accepts a risk).

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (mapping of 2026-11-12).

- AI_Agent_Security: not applicable — no agent tool, permission or setting changes; only the audit row of the rules text.
- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — production advisories of moderate level join what CI blocks — AC1, AC5.
- CI_CD_Security: "Require pull requests to be reviewed before merging and ensure this review step cannot be bypassed." — the stricter audit runs in a job that `CI Required` needs — AC5.
- Clickjacking_Defense: not applicable — `next.config.ts` is read for Sentry options only; its headers do not change.
- Content_Security_Policy: not applicable — the policy is not changed; the Sentry upgrade keeps the existing tunnel and hosts.
- Cross_Site_Scripting_Prevention: not applicable — `global-error.tsx` is checked for the Sentry API only; no output changes.
- DOM_based_XSS_Prevention: not applicable — no client code writes a URL or user value into the DOM here.
- Dependency_Graph_SBOM: not applicable — the SBOM job is unchanged and records the new Sentry version on its run.
- GitHub_Actions_Security: "Always set permissions: {} at the workflow level to disable all permissions by default." — the changed step adds no permission, secret or action — AC5.
- HTTP_Headers: not applicable — no response header changes; `next.config.ts` keeps its header list as it is.
- HTTP_Strict_Transport_Security: not applicable — the HSTS header is not touched by the Sentry upgrade.
- Injection_Prevention: not applicable — no query, command or template is built from outside input in this task.
- JavaScript_and_TypeScript_Security: not applicable — `send.ts` code is unchanged; the new case only reads how it calls `render`.
- LLM_Prompt_Injection_Prevention: not applicable — no model input or agent tool boundary changes in this task.
- Logging: "The following should usually not be recorded directly in the logs, but instead should be removed, masked, sanitized, hashed, or encrypted" — the new major keeps the scrubbing hooks and `sendDefaultPii: false` — AC2.
- Logging_Vocabulary: not applicable — no log event is added or renamed; only the reporting library version changes.
- MCP_Security: not applicable — no MCP server is configured or changed by this task.
- NPM_Security: "so the preinstall, install, postinstall and prepare scripts that a plain npm install runs do not execute on the first install" — `ignore-scripts=true` stays and the new major gains no install script — AC4.
- Nextjs_Security: not applicable — no Server Action or route changes; the Sentry hooks of Next.js keep their place.
- OS_Command_Injection_Defense: not applicable — no process is started from outside input in this task.
- Prototype_Pollution_Prevention: "Prototype Pollution is a critical vulnerability that can allow attackers to manipulate an application's JavaScript objects and properties" — the only path to the unfixed `deepmerge` stays unused, held by a test — AC3.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — the review reads each Sentry API change against the upgrade guide — AC2, AC4.
- Secure_Coding_with_AI: "AI coding assistants frequently suggest package names that do not exist on public registries" — no package is added; the version is checked with `npm view` in the report — AC4.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — each threat of the model maps to an acceptance criterion — AC1, AC2, AC3.
- Software_Supply_Chain_Security: "limit the applications dependencies to a specific version that has been previously verified as legitimate and secure" — a major at least 14 days old, the lockfile written by npm — AC1, AC4.
- Third_Party_Javascript_Management: not applicable — the CAPTCHA widget is checked for the Sentry API only; no script source changes.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — the Attack surface answers them for the upgrade — AC1, AC2, AC3.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns the audit and reads the CI run, not the summary — AC1, AC5.
- Vulnerable_Dependency_Management: "It's highly recommended to perform automated analysis of the dependencies from the birth of the project." — CI blocks moderate production advisories on every change — AC1, AC5.
- Web_Frontend_Security: not applicable — no browser-side code path changes beyond the Sentry client version.

## UI

No visible change.

## Mobile adaptation record

- Scope: none

## Acceptance criteria

- AC1 Production dependencies have no moderate, high or critical advisory — test:
  `npm audit --omit=dev --audit-level=moderate` exits 0.
- AC2 Error reporting keeps its settings on the new major — test: `src/__tests__/instrumentation.test.ts`.
- AC3 The plain-text email path that carries `deepmerge` stays unused — test:
  `src/modules/notifications/lib/emails/__tests__/send.security.test.ts`.
- AC4 The project still builds and passes — test: `npm run lint`, `npm run typecheck`, `npm test -- --coverage`,
  `npm run build`, `npm run build-storybook`, each exit 0.
- AC5 CI blocks a moderate advisory in a production dependency — test: `scripts/quality/ci-workflow.test.mjs`
  (Opus writes the case with the step).

## Route

1. Confirm the date (2026-11-24 or later) and the version per Scope; read the upgrade guide; list each API the
   project uses with its verdict.
2. Test first: the AC3 cases on the unchanged code (they pass today; break `send.ts` on purpose to show each fails).
3. Update `@sentry/nextjs` per Scope; `npm ci`; `npm ls --omit dev --all` exits 0.
4. Run: npm run lint · npm run typecheck · npm test -- --coverage · node scripts/quality/changed-lines-coverage.mjs --base main ·
   node scripts/quality/check-files.mjs --worktree · npm audit --omit=dev --audit-level=moderate ·
   npm audit --audit-level=high · npm run build · npm run build-storybook ·
   node scripts/quality/ac-tests.mjs --base main tasks/Sprints/Sprint_93_kickoff_prompt_Task_973_Production_Dependencies_Without_Moderate_Advisories.md
5. Report: each command, exit code, relevant output; the upgrade-guide verdicts; the deliberate breaks of AC3; the CI step
   the change needs, for Opus.

## Review
