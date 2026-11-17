# Task 972 — Every dependency without a high or critical advisory, and the CMS sanitizer patched

Sprint 93. Priority P1. Found 2026-11-12 by Opus from the GitHub notice on the push of PR #30 ("94 vulnerabilities on
the default branch: 1 critical, 23 high, 58 moderate, 12 low"); no owner decision needed to start (owner D2, 2026-11-06;
golden rule, 2026-11-07). Revision 1, owner 2026-11-17 (translated): "write all the updates into the next task; do not
create a new task only for updates". Revision 2, owner decision O972-1 (2026-11-17): scoped overrides instead of
accepting the risk. Revision 3 (2026-11-17, after Review 1): owner decision O972-2 (translated: "the CDATA bypass in
sanitize-html is closed only in 2.18.2, released 6 days ago — we update; add my note that I allowed it, so CI does not
fail"): `sanitize-html` 2.18.2 under the 14-day age, pinned exactly in `overrides`, which `change-report.mjs:139-147`
reports as the owner's visible decision and does not refuse; owner decision O972-3 (2026-11-17, option "accept the
risk"): GHSA-fc5q-39xc-vjpf (`picomatch`, no fixed version) accepted until 2026-12-17 in
`scripts/quality/audit-exceptions.json`. Owner decision O972-4 (2026-11-17): Dependabot pull requests are not merged
and get no CI secrets; their updates go through tasks such as this one (`.claude/rules/quality-gates.md`). Implementer: Sonnet, on `task/972-dependency-advisories`. Opus, not the
executor, changes CI, `scripts/quality/**` and `.claude/rules/quality-gates.md` (done in Revision 3). Reviewer: Opus.
Human owner of the change: the owner.

## Goal

The CI audit read production dependencies only; the development tree, installed before jobs that hold secrets, carried
1 critical and 23 high advisories on 2026-11-12 (through `shadcn` 4.7.0, `lighthouse` 13.3.0, `jsdom` and `vitest`,
`react-email` 6.1.5, `eslint`, `vite` 6.4.2 and the unused `happy-dom` 20.8.9), and Dependabot alert #178 (`basic-ftp`,
GHSA-5pm8-86m8-9m6r) through `lighthouse` 13.3.0. `sanitize-html` is the whole stored-XSS defence of the CMS body
(`src/modules/cms/lib/sanitizeCmsHtml.ts:1`); 2.17.7 is inside GHSA-x3q4-9hxx-gx8m, GHSA-cv27-6wvh-8x7j and
GHSA-374f-7chj-9948. After the task no advisory is left except GHSA-fc5q-39xc-vjpf (O972-3), the CMS allowlist
discards the content of every tag its comment names, and CI audits the whole tree through `scripts/quality/audit-gate.mjs`.

## Cause

Read at a96bcd710
- `gh api "repos/{owner}/{repo}/dependabot/alerts?state=open" --paginate` → 101 open alerts in 28 packages (2026-11-17);
  every first patched version at least 14 days old except `next` 16.4.5 (published 2026-11-03T18:01:54Z).
- `package.json:171` pins `next` 16.4.3 (GHSA-mfr8-8qww-v76h, `<= 16.4.4`); `package.json:205` pins
  `@vitest/coverage-v8` 4.1.6, which holds `vitest` below its fix 4.1.12; `package.json:210` pins `happy-dom` 20.8.9
  (GHSA-834v-8h66-3h79, `<= 21.0.3`), unused (`vitest.config.ts:8` is `jsdom`), and the nine `@tiptap/*` 3.31.4
  (`package.json:152-159`, `:199`) ask for it: `npm view @tiptap/html@3.32.2 dependencies` → `"happy-dom":"^20.8.9||^21.0.4"`.
- `package.json:182`: `sanitize-html` `^2.17.7`. `.github/workflows/ci.yml:164` audits production dependencies only
  (`--omit=dev`, level high).
- Revision 2: GHSA-3g3m-2fjr-6pw4 (`glob` `<= 14.0.1`) and GHSA-g3hv-75wg-m249 (`minimatch` `< 11.0.1`) through consumers
  that pin older majors; the probe with the two overrides → `npm audit --package-lock-only` → `total 0` (before 15:56Z).
- Revision 3: `gh api advisories/GHSA-fc5q-39xc-vjpf` → `<= 4.0.7`, no patched version, `updated_at
  2026-11-17T15:56:44Z`; `npm view picomatch dist-tags` → `latest: 4.0.7`. The `main` run 44091755292 (13:22Z) audit
  listed no `picomatch`; on the same lockfile now `npm audit --package-lock-only --omit=dev` → `high 6`, all `picomatch`.
- Revision 3: `src/modules/cms/lib/sanitizeCmsHtml.ts:9-10` says ten tags are removed with their content via
  `exclusiveFilter` (`:90-91`). Probe of that allowlist on 2.18.1: `<noscript>TXT<b>B</b></noscript>` →
  `TXT<b>B</b>`, the same for `iframe`, `object`, `embed`, `svg`, `math`, `form`; only `script`, `style` and `textarea`
  (the library's default `nonTextTags`) lose their content.
- Revision 3: `gh api advisories/GHSA-x3q4-9hxx-gx8m` → "`sanitize-html` discards the *content* of every element in
  `nonTextTags`"; with the seven tags in `nonTextTags` the implied-close payload leaks on 2.17.7, not on 2.18.1, and the
  CDATA payload leaks on 2.18.1, not on 2.18.2 (published 2026-11-11T19:53:59Z).
Fix: `next` 16.4.5, the nine `@tiptap/*` 3.32.2, `@vitest/coverage-v8` 4.1.12, `happy-dom` removed, the stale `@tiptap/*`
lockfile entries dropped, the audit fix, the two scoped overrides; `sanitize-html` 2.18.2 (O972-2) and the seven tags in
`nonTextTags`; the audit gate with the O972-3 exception (Opus, done).

## Scope

- `package.json`, `package-lock.json`: remove `happy-dom`; `next` `16.4.5`, the nine `@tiptap/*` `3.32.2`,
  `@vitest/coverage-v8` `4.1.12` (exact pins); the `node_modules/@tiptap/` lockfile entries removed before the install
  (no other hand edit); `npm install` and `npm audit fix --package-lock-only`, both `--ignore-scripts
  --before=<run time minus 14 days>` (done in the stopped run of 2026-11-17). No major upgrade, no new package.
- Revision 2: `overrides` gains `"glob@>=9.0.0 <14.0.2": "14.0.2"` and `"minimatch@>=7.0.0 <11.0.1": "11.0.1"` beside
  `import-in-the-middle`; the tools that load them are run (AC3, AC8).
- Revision 3 (O972-2): `sanitize-html` exactly `2.18.2` in `dependencies` and in `overrides`, installed with
  `--ignore-scripts` and without `--before`; `npm view sanitize-html@2.18.2 dependencies scripts` → the dependencies of
  2.18.1, no install script. No other override and no other version under 14 days.
- Revision 3: `src/modules/cms/lib/sanitizeCmsHtml.ts`: `nonTextTags` is the library's default list (read from the
  installed 2.18.2 first) plus `noscript`, `iframe`, `object`, `embed`, `svg`, `math`, `form`; the comment states it;
  `exclusiveFilter` keeps the image rule.
- `src/modules/cms/lib/__tests__/sanitizeCmsHtml.security.test.ts`: one case per advisory (both GHSA-x3q4 payloads,
  meta refresh, SMIL) and one per tag of the list: its text and child elements are not in the output.
- `npm ci`; no package gains an install script (`scripts/quality/install-scripts.test.mjs`; Opus removed its stale `msw`
  entry: `msw` came only through `shadcn` 4.7.0 and left with 4.23.0, no project file imports it). `basic-ftp`
  leaves with `lighthouse` 13.6.0; if not, the task stops and reports `npm ls basic-ftp --all`.
- Opus (done): `scripts/quality/audit-gate.mjs`, `audit-gate.test.mjs`, `audit-exceptions.json` (O972-3); the two
  audit steps of `.github/workflows/ci.yml` run the gate; the "Dependency audit" row of `.claude/rules/quality-gates.md`;
  the OWASP remap at upstream 7af0ef1b745f (HTTP_Headers in Revision 1; Docker_Security, Nodejs_Security,
  PHP_Configuration, Ruby_on_Rails; the new Node.js rate-limit requirement handed to Task 985).
- Out of scope: `@sentry/nextjs` 11 and the production audit at moderate (Task 973).

## Attack surface

Dependency change and one sanitizer setting; no route, action, permission or data flow changes. Threat model:
- T1 Tampering (supply chain): an updated version carries malicious code → only versions at least 14 days old except
  `sanitize-html` 2.18.2 (O972-2, exact pin), lockfile written by npm, `ignore-scripts=true`, the change report — mitigate.
- T2 Tampering (stored XSS): a sanitizer update or setting changes what the CMS body lets through → the advisory payload
  and per-tag cases, the existing `sanitizeCmsHtml` tests and `CmsPageView.sanitize.test.tsx` — mitigate.
- T3 Elevation of privilege (CI): a vulnerable development tool runs in a job that holds secrets → the advisories leave
  the whole tree and CI blocks their return; GHSA-fc5q-39xc-vjpf accepted by O972-3 until 2026-12-17 — mitigate.
- T4 Denial of service (regressions): an update breaks the build, tests or Storybook → AC3, AC8 — mitigate.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (mapping at upstream 7af0ef1b745f, 2026-11-17).

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
- Nodejs_Security: not applicable — no route or authentication flow changes; the remap hands the new rate-limit requirement to Task 985.
- Mass_Assignment: not applicable — no write binds request fields to a record in this task.
- NPM_Security: "so the preinstall, install, postinstall and prepare scripts that a plain npm install runs do not execute on the first install" — `ignore-scripts=true` stays and no updated package gains an install script — AC4.
- OS_Command_Injection_Defense: not applicable — no process is started from outside input in this task.
- Prototype_Pollution_Prevention: not applicable — no merge of request data changes; the production `deepmerge` advisory is Task 973.
- Secrets_Management: not applicable — no secret is added, moved or read; every job keeps its existing secrets.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — the review reads the lockfile diff version by version against the report — AC1, AC4.
- Secure_Coding_with_AI: "AI coding assistants frequently suggest package names that do not exist on public registries" — no package is added; every version change is checked with `npm view` in the report — AC4.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — each threat of the model maps to an acceptance criterion — AC1, AC2, AC3, AC5.
- Software_Supply_Chain_Security: "limit the application's dependencies to a specific version that has been previously verified as legitimate and secure" — only versions at least 14 days old, the lockfile written by npm (the dropped `@tiptap/*` entries are resolved again by npm) — AC1, AC4, AC7.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — the Attack surface answers them for the dependency change — AC1, AC2, AC3, AC5.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns both audits and reads the CI run, not the summary — AC1, AC5.
- Vulnerable_Dependency_Management: "It's highly recommended to perform automated analysis of the dependencies from the birth of the project." — CI audits the whole tree on every change, and the medium `basic-ftp` advisory leaves with `lighthouse` 13.6.0, and every alerted package with a fix at least 14 days old with it — AC1, AC5, AC6, AC7.
- Web_Frontend_Security: "The fundamental security rule is to never use innerHTML with untrusted data." — the CMS body reaches the page only through the patched sanitizer — AC2.
- XS_Leaks: not applicable — no cross-origin response, header or embedding changes; `iframe` here is only a tag the sanitizer discards.
- XSS_Filter_Evasion: "input filtering is an incomplete defense for XSS" — the sanitizer is one layer, and the payloads of its three advisories are tested on it — AC2.

## UI

No visible change. A visual difference in the build or Storybook stops the task and goes into the report.

## Mobile adaptation record

- Scope: none

## Acceptance criteria

- AC1 Every dependency has no high or critical advisory that no owner decision accepts — test:
  `node scripts/quality/audit-gate.mjs --level high` exits 0 (only GHSA-fc5q-39xc-vjpf, accepted by O972-3).
- AC2 The CMS sanitizer removes each advisory payload and the content of every listed tag — test:
  `src/modules/cms/lib/__tests__/sanitizeCmsHtml.security.test.ts` (red on the unchanged allowlist, green after).
- AC3 The project still builds and passes — test: `npm run lint`, `npm run typecheck`, `npm test -- --coverage`,
  `npm run build`, `npm run build-storybook`, each exit 0.
- AC4 No package gains an install script — test: `scripts/quality/install-scripts.test.mjs`.
- AC5 CI blocks a high or critical advisory in any dependency that no owner decision accepts — test:
  `scripts/quality/audit-gate.test.mjs` and `gh pr checks <n>` (the Dependency audit check of this task's pull request).
- AC6 `basic-ftp` (GHSA-5pm8-86m8-9m6r) is no longer in the tree — test: `npm ls basic-ftp --all` prints no
  `basic-ftp` and `npm audit --json` has no `basic-ftp` entry (both in the report, before and after).
- AC7 Every other advisory leaves the tree — test: `node scripts/quality/audit-gate.mjs --level low` exits 0, and
  `npm ls happy-dom next vitest @tiptap/html sanitize-html --all` shows `happy-dom` 21.0.4 or later, `next` 16.4.5,
  `vitest` 4.1.12, `@tiptap/html` 3.32.2, `sanitize-html` 2.18.2;
  `src/design-system/mantine/patterns/__tests__/richTextRoundTrip.test.ts` passes.
- AC8 The tools that load the overridden `glob` and `minimatch` still work — test: `npm run lint`, `npm run build`,
  `npm run build-storybook` (AC3), `npx shadcn --help` exits 0, and `npm run email` serves its preview (the report holds
  its ready line, then it is stopped); `npm ls glob minimatch --all` shows no version in either range.

## Route

1. Steps 1-3 of the stopped run stand (report of 2026-11-17, rerun in Review 1). The local `main` is stale
   (`bb9e2b35a`; `origin/main` is `d506fae33`): every comparison names `origin/main`.
2. Test first: the per-tag cases of AC2 on the unchanged `sanitizeCmsHtml.ts`; save the failing output.
3. `sanitize-html` 2.18.2 per Scope; `npm ci`; `npm ls --omit dev --all` exits 0;
   `node scripts/quality/change-report.mjs --lockfile-age origin/main` exits 0; AC6 and AC7 after; AC8.
4. The `nonTextTags` change and its comment; three passes over every changed file.
5. Run: npm run lint · npm run typecheck · npm test -- --coverage · node scripts/quality/changed-lines-coverage.mjs
   --base origin/main · node scripts/quality/check-files.mjs --worktree · node scripts/quality/audit-gate.mjs --level high ·
   node scripts/quality/audit-gate.mjs --omit-dev --level high · npm run build · npm run build-storybook ·
   node --test scripts/quality/install-scripts.test.mjs · npm ls basic-ftp --all ·
   node scripts/quality/change-report.mjs origin/main HEAD; one deliberate break per AC2 case group.
6. Report: each command, exit code, relevant output; every version change with its release date.

## Review

Review 1 of the stopped run (working tree on `a96bcd710`, 2026-11-17) — no verdict: the run stopped at Route step 3
on AC1 and AC7; the cause is in the design, so Revision 3 changes the kickoff, not the implementation.
Scope: the executor's report, `package.json`, `package-lock.json` (through `npm audit` and `npm ls`), the test file.
Tools: `gh api advisories/GHSA-fc5q-39xc-vjpf`; `npm audit --package-lock-only [--omit=dev] --json` → high 32 / high 6,
all `picomatch`; `gh run view 44091755292` (job Dependency audit, 13:22Z: no `picomatch`); probes of the CMS allowlist on
`sanitize-html` 2.17.7, 2.18.1, 2.18.2 in a scratch directory; every version the report names, read from the lockfile.
Findings: High 1, Medium 1. Overall risk: the tree is as the report says; two design gaps blocked the criteria.

F1 — GHSA-fc5q-39xc-vjpf has no fixed version. Severity: High. Category: Dependencies and configuration.
Location: `package-lock.json` (`node_modules/picomatch` 4.0.7, `micromatch/node_modules/picomatch` 2.3.2).
Impact: AC1, AC5, AC7 and the existing production step are red with any version; production paths are build tools.
Reproduction: `node scripts/quality/audit-gate.mjs --level high` with an empty `exceptions` list → 1 blocking.
Status: accepted by the owner on 2026-11-17 (O972-3), the gate and its exception in Revision 3.

F2 — the CMS allowlist keeps the content of seven tags its comment says it removes. Severity: Medium.
Category: Input and output. Location: `src/modules/cms/lib/sanitizeCmsHtml.ts:9-10`, `:90-91`.
Impact: content an author hid in `noscript`, `svg` or `iframe` reaches visitors as allowlisted markup; AC2 cannot pass.
Reproduction: the probe in "## Cause". Status: Revision 3 (Scope: `nonTextTags`; AC2).
