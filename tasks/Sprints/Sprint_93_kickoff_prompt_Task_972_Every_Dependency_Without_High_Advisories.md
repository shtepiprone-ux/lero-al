# Task 972 — Every dependency without a high or critical advisory, and the CMS sanitizer patched

Sprint 93. Priority P1. Found 2026-11-12 by Opus from the GitHub notice on the push of PR #30 ("94 vulnerabilities on
the default branch: 1 critical, 23 high, 58 moderate, 12 low"); no owner decision needed (owner D2, 2026-11-06: quality
covers every file; golden rule, 2026-11-07). Implementer: Sonnet, on `task/972-dependency-advisories` from `main`.
Opus, not the executor (`execute-task` forbids `.github/**`, `scripts/quality/**` and `.claude/**`), changes the CI
audit step, its `scripts/quality/ci-workflow.test.mjs` case and `.claude/rules/quality-gates.md`. Reviewer: Opus.
Human owner of the change: the owner.

## Goal

The CI dependency audit reads production dependencies only: `npm audit --omit=dev --audit-level=high`
(`.github/workflows/ci.yml:164`). On 2026-11-12 `npm audit` reports 1 critical, 23 high, 43 moderate and 6 low for the
whole tree, and `npm audit --omit=dev` 0 critical, 0 high, 6 moderate, 5 low. The development tree is installed by every
CI job before it runs with that job's secrets, and on every developer machine. The critical `proxy-addr` and the
high `hono`, `@modelcontextprotocol/sdk`, `body-parser` and `ip-address` come through `shadcn` 4.7.0; `puppeteer-core`,
`extract-zip`, `basic-ftp` and `proxy-agent` through `lighthouse` 13.3.0; `undici` through `jsdom` and `vitest`;
`socket.io-parser` and `engine.io` through `react-email` 6.1.5; `js-yaml` through `eslint`. `vite` 6.4.2 is
inside the `launch-editor` advisories (`<=6.4.3`). `happy-dom` 20.8.9 (`package.json:210`, exact pin) is inside
GHSA-834v-8h66-3h79 (host code execution, `<=21.0.3`) and is used by nothing: the unit environment is `jsdom`
(`vitest.config.ts:8`) and no file outside `package.json` and old session notes names it.

One production package matters to a visitor: `sanitize-html` 2.17.7 (`package.json:182`) is the whole stored-XSS
defence of the CMS body (`src/modules/cms/lib/sanitizeCmsHtml.ts:1`), and is inside GHSA-x3q4-9hxx-gx8m (a
`<noscript>` discard region ends early on an implied close), GHSA-cv27-6wvh-8x7j (`meta http-equiv=refresh` keeps
`javascript:` and `data:` URLs) and GHSA-374f-7chj-9948 (SMIL namespace prefix allows a `javascript:` URI), all fixed in
2.18.0. The allowlist removes `noscript` and `svg` with their content and allows neither `meta` nor `animate`, but no
test feeds it these payloads.

A probe on 2026-11-12 in a scratch copy of the manifest and lockfile, `npm audit fix --package-lock-only --ignore-scripts
--before=2026-10-29` (only versions at least 14 days old), left 0 critical and 1 high (`happy-dom`, held by its exact
pin) and took `vite` 6.4.5, `lighthouse` 13.6.0, `shadcn` 4.23.0, `sanitize-html` 2.18.1, `undici` 7.30.1, `ws` 8.21.3,
`js-yaml` 4.3.2 and `react-email` 6.11.5; `proxy-addr`, `hono` and `@modelcontextprotocol/sdk` left the tree. After the
task `npm audit --audit-level=high` exits 0 and CI runs it on every change.

## Scope

- `package.json`, `package-lock.json`: remove `happy-dom`; `sanitize-html` range `^2.18.1`; then
  `npm audit fix --package-lock-only --ignore-scripts --before=<the day 14 days before the run>` and `npm ci`. No major
  upgrade and no new package; the versions the run takes are listed in the report with `npm view <name>@<version> time
  scripts --json`.
- `src/modules/cms/lib/__tests__/sanitizeCmsHtml.security.test.ts`: one case per advisory above, its payload through
  `sanitizeCmsHtml`; the output has no `noscript` content, no `meta`, no `javascript:` or `data:` URL and no SVG
  animation element.
- No package gains an install script: `scripts/quality/install-scripts.test.mjs` (Task 947) passes unchanged.
- Opus: in the `dependency-audit` job of `.github/workflows/ci.yml` a step "Every dependency has no high or critical
  advisory" running `npm audit --audit-level=high`, next to the production step; its case in
  `scripts/quality/ci-workflow.test.mjs`; the "Dependency audit" row of `.claude/rules/quality-gates.md`.
- Dependencies: none added; versions only, each at least 14 days old (`--before`).
- Out of scope: the production moderate advisories of `glob` and `minimatch`, whose fix is `@sentry/nextjs` 11.12.0
  (major, released 2026-11-10, under 14 days old), and the production low advisories: Task 973.

## Attack surface

Dependency change; no route, action, permission or data flow changes. Threat model (`.claude/rules/threat-model.md`):
- T1 Tampering (supply chain): an updated version carries malicious code → only versions at least 14 days old from the
  npm registry, no new top-level package, lockfile changed by npm only, install scripts held by `install-scripts.test.mjs`
  and `.npmrc` `ignore-scripts=true`; the change report lists every version change — mitigate.
- T2 Tampering (stored XSS): a sanitizer update changes what the CMS body lets through → the advisory payload cases and
  the existing `sanitizeCmsHtml` tests and `CmsPageView.sanitize.test.tsx` — mitigate.
- T3 Elevation of privilege (CI): a vulnerable development tool runs in a job that holds secrets → the high and critical
  advisories leave the whole tree and CI blocks their return — eliminate.
- T4 Denial of service (regressions): an update breaks the build, tests or Storybook → AC3 — mitigate.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (mapping of 2026-11-12).

- AI_Agent_Security: not applicable — no agent tool, permission or setting changes; only the audit row of the rules text.
- Abuse_Case: not applicable — no feature or entry point is added; the supply-chain abuse is in the threat model.
- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — the development tree, installed before jobs that hold secrets, joins the audited surface — AC1, AC5.
- Bot_Management_and_Anti-Automation: not applicable — no public endpoint or request limit changes in this task.
- CI_CD_Security: "Require pull requests to be reviewed before merging and ensure this review step cannot be bypassed." — the new audit step runs in a job that `CI Required` needs — AC5.
- Credential_Stuffing_Prevention: not applicable — sign-in and its limits are not touched by a version update.
- Cross_Site_Scripting_Prevention: "Since no single technique will solve XSS, using the right combination of defensive techniques will be necessary to prevent XSS." — the sanitizer layer is patched and its advisory payloads tested, beside the existing output rules — AC2.
- DOM_Clobbering_Prevention: "Robust HTML sanitizers can prevent or restrict the risk of DOM Clobbering." — the CMS sanitizer moves to the patched release and keeps its attribute allowlist — AC2.
- DOM_based_XSS_Prevention: not applicable — no client code writes a URL or user value into the DOM here.
- Denial_of_Service: not applicable — no product endpoint changes; the denial-of-service advisories removed sit in development tools.
- Dependency_Graph_SBOM: not applicable — the SBOM job is unchanged and records the new production versions on its run.
- GitHub_Actions_Security: "Always set permissions: {} at the workflow level to disable all permissions by default." — the new step adds no permission, secret or action to the dependency-audit job — AC5.
- Injection_Prevention: not applicable — no query, command or template is built from outside input in this task.
- Input_Validation: not applicable — no server input handling changes; the sanitizer payloads are test fixtures only.
- JavaScript_and_TypeScript_Security: not applicable — no product TypeScript changes; only a library version and its tests.
- Key_Management: not applicable — no key is created, rotated, stored or read differently by this task.
- LLM_Prompt_Injection_Prevention: not applicable — no model input or agent tool boundary changes in this task.
- Logging: not applicable — the `@sentry/nextjs` version and its logging stay as they are here; Task 973 moves it.
- Logging_Vocabulary: not applicable — no log event is added or renamed; `@sentry/nextjs` is Task 973.
- MCP_Security: not applicable — no MCP server configuration changes; the vulnerable MCP SDK only leaves the development tree.
- Mass_Assignment: not applicable — no write binds request fields to a record in this task.
- NPM_Security: "so the preinstall, install, postinstall and prepare scripts that a plain npm install runs do not execute on the first install" — `ignore-scripts=true` stays and no updated package gains an install script — AC4.
- OS_Command_Injection_Defense: not applicable — no process is started from outside input in this task.
- Prototype_Pollution_Prevention: not applicable — no merge of request data changes; the production `deepmerge` advisory is Task 973.
- Secrets_Management: not applicable — no secret is added, moved or read; every job keeps its existing secrets.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — the review reads the lockfile diff version by version against the report — AC1, AC4.
- Secure_Coding_with_AI: "AI coding assistants frequently suggest package names that do not exist on public registries" — no package is added; every version change is checked with `npm view` in the report — AC4.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — each threat of the model maps to an acceptance criterion — AC1, AC2, AC3, AC5.
- Software_Supply_Chain_Security: "limit the applications dependencies to a specific version that has been previously verified as legitimate and secure" — only versions at least 14 days old, the lockfile written by npm — AC1, AC4.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — the Attack surface answers them for the dependency change — AC1, AC2, AC3, AC5.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns both audits and reads the CI run, not the summary — AC1, AC5.
- Vulnerable_Dependency_Management: "It's highly recommended to perform automated analysis of the dependencies from the birth of the project." — CI audits the whole tree on every change — AC1, AC5.
- Web_Frontend_Security: "The fundamental security rule is to never use innerHTML with untrusted data." — the CMS body reaches the page only through the patched sanitizer — AC2.
- XSS_Filter_Evasion: "input filtering is an incomplete defense for XSS" — the sanitizer is one layer, and the payloads of its three advisories are tested on it — AC2.

## UI

No visible change. A visual difference in the build or Storybook stops the task and goes into the report.

## Mobile adaptation record

- Scope: none

## Acceptance criteria

- AC1 Every dependency has no high or critical advisory — test: `npm audit --audit-level=high` exits 0.
- AC2 The CMS sanitizer removes each advisory payload — test:
  `src/modules/cms/lib/__tests__/sanitizeCmsHtml.security.test.ts`.
- AC3 The project still builds and passes — test: `npm run lint`, `npm run typecheck`, `npm test -- --coverage`,
  `npm run build`, `npm run build-storybook`, each exit 0.
- AC4 No package gains an install script — test: `scripts/quality/install-scripts.test.mjs`.
- AC5 CI blocks a high or critical advisory in any dependency — test: `scripts/quality/ci-workflow.test.mjs`
  (Opus writes the case with the step).

## Route

1. Record before: `npm audit --json` and `npm audit --omit=dev --json` summaries; `npm ls happy-dom`; a search for
   `happy-dom` outside `package.json` and `package-lock.json`.
2. Test first: the AC2 cases on `sanitize-html` 2.17.7; save the failing output (a case that already passes on 2.17.7
   says so, with the payload).
3. Change `package.json` and the lockfile per Scope; `npm ci`; `npm ls --omit dev --all` exits 0.
4. Run: npm run lint · npm run typecheck · npm test -- --coverage · node scripts/quality/changed-lines-coverage.mjs --base main ·
   node scripts/quality/check-files.mjs --worktree · npm audit --audit-level=high · npm audit --omit=dev --audit-level=high ·
   npm run build · npm run build-storybook · node --test scripts/quality/install-scripts.test.mjs ·
   node scripts/quality/ac-tests.mjs --base main tasks/Sprints/Sprint_93_kickoff_prompt_Task_972_Every_Dependency_Without_High_Advisories.md
5. Report: each command, exit code, relevant output; the before and after audit summaries; every version change with
   its release date; the CI step the change needs, for Opus.

## Review
