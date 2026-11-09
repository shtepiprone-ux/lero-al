# Task 952 — The site runs on Next 16, and production dependencies carry no high or critical advisory

Sprint 93 (governance reset). Priority **P0**: the CI "Dependency audit" gate of the reset PR (#19) stays red until
this lands. It carries AC1 of Task 947 (review 2026-11-06). Owner decision **D3 (2026-11-06)**, translated: "I allow a
one-time exception, do it now." The exception covers exactly `next-cloudinary@7.0.0` (published 2026-10-26, 11 days
old on 2026-11-06) from the 14-day rule of Task 947 (NPM Security, "hold off on upgrading immediately"); every other
version keeps the rule. Implementer: Sonnet, on `governance/reset-2026-11-06`, after Task 947 is committed.
Reviewer: Opus.

## Goal

After Task 947, `npm audit --omit=dev --audit-level=high` still exits 1, with 4 high advisories:
- `postcss` ≤ 8.5.22, bundled inside `next@15.5.28` (GHSA-qx2v-qp2m-jg93, -6g55-p6wh-862q, -fxqj-rqcc-2cmp,
  -r28c-9q8g-f849). Every 15.x release ships `postcss@8.4.31`; `next@16.4.3` (2026-10-23) ships `8.5.23`
  (`npm view next@16.4.3 dependencies.postcss`).
- `zod` < 4.6.6 (GHSA-mrhx-c7xc-m3w5), through `next-cloudinary@6` → `@cloudinary-util/url-loader@5.10.4`, and the
  two packages that carry it. The fix is `next-cloudinary@7.0.0` (peer `next: ^16`).

After the task:
- the site runs on `next@16.4.3` and `next-cloudinary@7.0.0`;
- the audit exits 0;
- every behaviour that Next 16 changes is handled and covered by a test.

## Scope

- `package.json`, `package-lock.json`. Versions: `next` and `eslint-config-next` **16.4.3**; `next-cloudinary`
  **7.0.0** (D3); React stays 19.2.4. Peers checked 2026-11-06: `next-intl@4.12.0` allows `^16`; `@sentry/nextjs@10.76.2`
  allows `^16.0.0-0`. Check each new or changed version in the lock with the 14-day script of Task 947. The only
  allowed exception is `next-cloudinary@7.0.0`.
- **Middleware becomes proxy** (Next 16: `middleware` is renamed to `proxy`; the export is `proxy`; the runtime is
  Node.js). Today `src/middleware.ts` is the live file. `src/proxy.ts` is an old copy that Next 15 never ran
  (`src/middleware.ts:10`); it lacks the script nonce and report-only CSP logic. Delete the old `src/proxy.ts` first.
  Then move `src/middleware.ts` to `src/proxy.ts` with the export renamed, and keep `config.matcher` unchanged.
  Update `src/lib/auth/__tests__/middlewareScope.security.test.ts` and `sessionMiddleware.test.ts`, which import
  `@/middleware` and `@/proxy`, and the comments in `scripts/check-hydration-console.mjs:247,592`.
- **`revalidateTag` takes a cache profile**: 12 calls in `src/modules/**/actions/*.ts`
  (`git grep -n "revalidateTag(" -- src/modules`), for example
  `src/modules/admin/actions/currencies.ts:89`, plus the test stub `src/tests/next-cache-stub.ts:7`. Server Actions
  that must show the change at once use `updateTag(tag)`; keep today's behaviour (immediate expiry), so use
  `updateTag` in Server Actions and `revalidateTag(tag, 'max')` elsewhere, with the reason in the report.
- **`next build` no longer runs ESLint.** Task 923 R72(g) relies on the build stopping on a lint error, so a Vercel
  build stops outside CI too (`next.config.ts` comment). The build script becomes `npm run lint && next build`.
  Update that comment.
- **Turbopack builds by default.** `withSentryConfig` (deprecated: the Task 947 build warning names
  `@sentry/nextjs/config`) passes `webpack` options (`next.config.ts`). Move to the current Sentry config API and keep
  the same options in their Turbopack form where Sentry supports them. Build both ways, with `SENTRY_AUTH_TOKEN` unset
  (CI) and set to a dummy value with upload turned off. If a webpack-only option has no Turbopack form, stop and
  report; do not add `--webpack`.
- `dev` script: drop `--turbopack` (now the default).
- Every other item of the official guide (https://nextjs.org/docs/app/guides/upgrading/version-16) is checked and
  listed in the report as "applies / does not apply" with the evidence (a `git grep` or a file). Measured as not
  applying on 2026-11-06:
  - no `images` config;
  - no parallel route slots (`src/app/**/@*`);
  - no `next/amp`, no `getConfig`, no `next/legacy/image`, no `experimental` flags;
  - no edge runtime;
  - request APIs are already awaited.
- `next-cloudinary@7.0.0`: its only use is `CldUploadWidget` and its type in
  `src/modules/listings/components/ImageUpload.tsx:6-7`. The release notes remove `onUpload`; the file uses
  `onSuccess` (Task 947 report). Read the 7.0.0 changelog in full and list every API the file uses with its v7 status.
- Dependencies: the three versions above, no new top-level package.
- Out of scope: `cacheComponents`, the React Compiler, any visible change.
- **Revision 1 (review of 2026-11-07, findings F1 to F5).** Fixes only these:
  - R1 (F1) A build talks to Sentry only on Vercel. `src/lib/build/sentryBuild.ts` (new) exports
    `usesSentryBuild(env)`: true only when `SENTRY_AUTH_TOKEN` is non-empty and `VERCEL` is set. `next.config.ts` uses it in
    place of the bare token test, so a local `npm run build` with `.env.local` uploads nothing and creates no release.
  - R2 (F2) `vercel.json`: add `"buildCommand": "npm run build"`. The reviewer's test already fails until it is there.
  - R3 (F3) `next.config.ts`: remove the `webpack` block and its "until the owner decides" comment; say in the comment that
    `treeshake.removeDebugLogging` is dropped because it has no Turbopack form (`compiler.define` measured 152 bytes of 5.86 MB).
  - R4 (F4) `package.json`: remove the `@swc/helpers` override (`next@16.4.3` pins `0.5.23` itself). Only that key changes
    there; `package-lock.json` changes only as npm needs for it. No version moves.
  - R5 (F5) `src/__tests__/security/proxyFile.test.ts`: a case that reads the built manifest of AC12.

## Attack surface

Changed → threat model:
- **T1 Spoofing / elevation, the proxy runs the session refresh and the CSP nonce.** A wrong move could leave the old
  copy running, with no nonce, or no proxy at all.
  - Mitigate: exactly one `src/proxy.ts`, the moved live file.
  - Test: the existing `middlewareScope.security.test.ts` cases, run against `@/proxy`.
  - A built check: `.next/server/middleware-manifest.json` (or its Next 16 successor) names the proxy with the same
    matcher.
  - The production server answers a dynamic route (`/sq/auth/login`, `/admin`) with the CSP report-only header and a nonce
    on its scripts; `/` redirects and static pages carry neither (`carriesScriptReportOnly`). Corrected by review 1.
- **T2 Tampering (supply chain): `next-cloudinary@7.0.0` is younger than the rule.**
  - Accepted by owner decision D3.
  - Mitigate: the version is pinned exactly (`"7.0.0"`), the package and its repository are the official Cloudinary
    ones (`npm view next-cloudinary@7.0.0 repository`), the lock diff gains no install script
    (`scripts/quality/install-scripts.test.mjs`), and the report includes `npm view next-cloudinary@7.0.0 dist`.
- **T3 Denial of service / regressions**: a framework major upgrade. Mitigate: the full suite, the build, Storybook,
  click-shield and the authorization suite.

Authorization matrix: unchanged.


## OWASP

Required by `node scripts/quality/owasp.mjs plan` (757270a26306, mapping of 2026-11-07).

- Abuse_Case: not applicable — the upgrade adds no feature or entry point that a new abuse case could use.
- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — "## Attack surface" names each entry point the task adds, removes or changes — AC1, AC2, AC4.
- Authentication: not applicable — the session code is moved with the proxy rename, not changed; the tests import @/proxy.
- Authentication_Patterns: "Do not embed authentication in new systems." — the proxy still asks Supabase for the user; no own auth is added — AC2.
- Authorization: "Permission should be validated correctly on every request, regardless of whether the request was initiated by an AJAX script, server-side, or any other source." — serverEntryGuards and the action security tests run unchanged on Next 16 — AC6.
- Authorization_Decisions_And_Output_Handling: not applicable — the cache-tag call change does not touch any access decision.
- Authorization_Patterns: not applicable — no guard moves; only revalidateTag call sites change their signature.
- Authorization_Regression_Testing: "Automated tests should specifically target the ways authorization usually degrades over time." — the existing action tests run on the upgraded framework — AC3, AC6.
- Authorization_Testing_Automation: not applicable — the matrix is Task 950; this task keeps the existing suite green.
- Bot_Management_and_Anti-Automation: not applicable — no endpoint gains or loses a limit in the upgrade.
- OAuth2: not applicable — the sign-in flow and its redirect rules are not touched by the upgrade.
- Serverless_FaaS_Security: not applicable — the Vercel functions keep their configuration; only the build command is pinned.
- Subdomain_Takeover_Prevention: not applicable — no DNS record or host changes; the outside watch is Task 961.
- Unvalidated_Redirects_and_Forwards: not applicable — the only redirect mentioned is the existing locale redirect of next-intl.
- Clickjacking_Defense: "The "DENY" setting is recommended unless a specific need has been identified for framing." — next.config.ts keeps the security headers through the upgrade — AC6.
- Content_Security_Policy: "Use object-src 'none' when embedded objects are unnecessary" — the proxy still issues the nonce; headers.security.test.ts stays green — AC2.
- Cookie_Theft_Mitigation: not applicable — cookie attributes are unchanged by the upgrade; HttpOnly is Task 960.
- Credential_Stuffing_Prevention: not applicable — the sign-in path and its captcha are untouched by the upgrade.
- Cross_Site_Scripting_Prevention: "Since no single technique will solve XSS, using the right combination of defensive techniques will be necessary to prevent XSS." — ImageUpload and the upgraded pages render text through React escaping only; lint (react/no-danger, no-script-url) runs on them — AC5, AC6.
- Cryptographic_Storage: not applicable — the nonce generation is moved with the proxy rename and unchanged.
- Denial_of_Service: not applicable — no limit changes; the upgrade fixes advisories that Task 947 measured.
- Dependency_Graph_SBOM: "Validate the document against its format's schema before publication or ingestion" — the CI SBOM job generates and validates CycloneDX for the new tree — AC1.
- DOM_based_XSS_Prevention: "It is always a bad idea to use a user-controlled input in dangerous sources such as eval." — ImageUpload and the upgraded pages add no eval, Function, innerHTML or computed URL; lint (no-eval, no-implied-eval) and client-sinks check them — AC5, AC6.
- File_Upload: "Validate the file type, don't trust the Content-Type header as it can be spoofed" — the widget contract is kept; server-side validation stays as it is until Task 957 — AC5.
- HTTP_Headers: "Content Security Policy (CSP) frame-ancestors directive obsoletes X-Frame-Options for supporting browsers" — headers.security.test.ts runs unchanged on Next 16 — AC6.
- HTTP_Strict_Transport_Security: "This example sets a long (2 years = 63072000 seconds) max-age for the issuing host." — the HSTS value is unchanged and tested — AC6.
- Injection_Prevention: "the values for commands and the relevant arguments should be both validated" — the edited check scripts pass file names and arguments as array items; no value is joined into a command line — AC6.
- Input_Validation: not applicable — argument schemas are Task 955; the upgrade changes no validation.
- Insecure_Direct_Object_Reference_Prevention: not applicable — no object lookup changes; the actions change only their cache calls.
- JavaScript_and_TypeScript_Security: "Keep patterns linear: avoid nested quantifiers and ambiguous alternation over the same characters." — lint and CodeQL security-extended (CI) run on every changed file — AC4, AC6.
- Key_Management: not applicable — no key is added or moved by the upgrade.
- Logging: not applicable — Sentry is upgraded with its configuration unchanged; log content is Task 955.
- Logging_Vocabulary: not applicable — no log line changes in the upgrade; the vocabulary is Task 955.
- Mass_Assignment: not applicable — no request binding changes in the actions touched for cache tags.
- Multifactor_Authentication: not applicable — no sign-in factor changes; staff MFA is Task 960.
- Nextjs_Security: "Rendering the form only on a protected page does not authenticate the action request." — the proxy keeps the session refresh and the CSP nonce after the rename — AC2.
- Nodejs_Security: not applicable — the runtime stays Node 22.22.3; the version line is Task 958.
- NPM_Security: "Always vet and perform due-diligence on third-party modules you install to confirm their health and credibility." — install scripts stay off and every package with a script is reviewed (install-scripts.test.mjs); next-cloudinary 7.0.0 is the owner's dated exception D3 — AC1.
- OS_Command_Injection_Defense: "The primary defense is to avoid calling OS commands directly." — the edited check scripts start git and node with argument arrays, never a shell string — AC6.
- Prototype_Pollution_Prevention: not applicable — no object merging of request data is added by the upgrade.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — the review reads the whole diff; changed-line coverage and the file checks run on it — AC6.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — the executor's report is input: Opus reruns every acceptance command in review — AC6.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — the mitigations of the threat model are the acceptance criteria of this task — AC1, AC2, AC4.
- Session_Management: "Follow the session logging protections and session renewal guidance." — the proxy refresh keeps every cookie option unchanged — AC2.
- Software_Supply_Chain_Security: "limit the applications dependencies to a specific version that has been previously verified as legitimate and secure" — the lockfile pins every version; CI installs with npm ci — AC1.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — "## Attack surface" answers them and each mitigation is an acceptance criterion — AC1, AC2, AC4.
- Transport_Layer_Security: not applicable — no transport setting changes; the upgrade keeps the same headers and hosts.
- User_Privacy_Protection: not applicable — no personal data flow changes with the framework upgrade.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — a claim of the report that does not reproduce in review is a finding — AC6.
- Vulnerable_Dependency_Management: "It's highly recommended to perform automated analysis of the dependencies from the birth of the project." — the CI dependency audit runs npm audit on the changed tree — AC1.
- Web_Cache_Security: "Define an explicit policy for every route." — updateTag or revalidateTag(tag, 'max') keeps every tag expiry as before — AC3.
- Web_Frontend_Security: "The fundamental security rule is to never use innerHTML with untrusted data." — ImageUpload and the upgraded pages use no innerHTML; lint (react/no-danger) fails on one — AC5, AC6.

## UI

No visible change. A visual difference in Storybook or the click-shield run is a stop-and-report.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 `npm audit --omit=dev --audit-level=high` exits 0 — test: the command; the CI "Dependency audit" job runs it.
- AC2 One proxy, the live one — test: `src/lib/auth/__tests__/middlewareScope.security.test.ts` and
  `sessionMiddleware.test.ts` import `@/proxy` and pass. New `src/__tests__/security/proxyFile.test.ts` fails when
  `src/middleware.ts` exists, when `src/proxy.ts` does not export `proxy` and `config`, or when `src/proxy.ts` lacks
  `newScriptNonce` (the CSP nonce).
- AC3 Cache tags expire as before — test: the existing action tests (for example `ownerPublish.security.test.ts`)
  assert `updateTag` or `revalidateTag(tag, 'max')`. `src/tests/next-cache-stub.ts` exports both.
- AC4 A lint error stops the build — test: `scripts/quality/build-lints.test.mjs` (new, node:test). It fails when the
  `build` script does not run `npm run lint` before `next build`. Opus places it, because `scripts/quality/` is
  Opus-owned. Sonnet puts the draft in the report.
- AC5 The upload widget keeps its contract (a new or extended test) — test: `src/modules/listings/components/__tests__/ImageUpload.test.tsx`
  (new or extended). With `next-cloudinary` mocked at the v7 API, a successful upload calls the form's change handler
  with the Cloudinary URL.
- AC6 `npm run lint`, `npm run typecheck`, `npm test -- --coverage`, `npm run build`, `npm run build-storybook`,
  `node scripts/quality/changed-lines-coverage.mjs --base origin/main` and
  `node scripts/quality/check-files.mjs --worktree` exit 0.
- AC7 `node scripts/quality/product-gates.mjs` has no new failure compared with before (lists before and after).
- AC8 Revision 1: a build outside Vercel does not use Sentry — test: `src/__tests__/sentryBuild.test.ts` (new): a token alone
  gives false, an empty token with `VERCEL` gives false, a token with `VERCEL` gives true, and `next.config.ts` calls
  `usesSentryBuild`, not `process.env.SENTRY_AUTH_TOKEN` directly.
- AC9 Revision 1: Vercel runs the build that lints — test: `scripts/quality/build-lints.test.mjs` (placed by the reviewer).
- AC10 Revision 1: no inactive Sentry option is left — test: `src/__tests__/sentryBuild.test.ts`: `next.config.ts` has no
  `webpack:` option and no `removeDebugLogging`.
- AC11 Revision 1: the redundant override is gone and the tree stays valid — test:
  `node -e "process.exit(require('./package.json').overrides['@swc/helpers'] ? 1 : 0)"` and `npm ls --omit dev --all`.
- AC12 Revision 1: the build really runs the proxy — test: `src/__tests__/security/proxyFile.test.ts`, new case
  `[SEC-T1-SRV-BUILT-PROXY]`: `.next/server/functions-config-manifest.json` has `/_middleware` with `runtime` `nodejs` and
  `matchers[0].originalSource` equal to `config.matcher[0]`; a missing manifest fails, as in `overlay-dual-declaration.test.ts`.

## Route

1. Before: save the audit summary and the product-gates result.
2. Tests first: write AC2, AC3 and AC5. Run them on the unchanged code and save the failing output.
3. Upgrade the packages (`npm install next@16.4.3 eslint-config-next@16.4.3 next-cloudinary@7.0.0 --save-exact` for
   `next-cloudinary`; keep the existing style for the others). Then do the proxy move, the cache tags, the build
   script, the Sentry config and the `dev` script.
4. Run `npx @next/codemod@canary upgrade latest --dry` only to compare its list with yours. Do not let it rewrite files
   outside Scope.
5. Run AC1–AC7. Report each command, its exit code and the relevant output, plus each new test's failing run from
   step 2, the guide checklist, the 14-day lock check and the next-cloudinary changelog notes.
6. Revision 1: write AC8, AC10 and AC12 first and keep their failing output, then R1 to R5. Build with `SENTRY_AUTH_TOKEN=`
   empty. Check R1 once with `VERCEL=1 SENTRY_AUTH_TOKEN=dummy SENTRY_URL=http://127.0.0.1:9` (exit 0, no `.map` left under
   `.next/static`). Rerun AC1 to AC12 and report them.

## Review

**Review 1 of the working tree on `governance/reset-2026-11-06` at `f81f85905` — NEEDS REVISION**

Scope: diff review of every changed file (53 changed, 9 new, the lockfile); entry points: `src/proxy.ts`, the 12 cache calls, the upload widget, the build.
Tools (rerun by the reviewer, 2026-11-07): `check-ruleset` 0; `owasp sync` and `check` 0; build with an empty token 0, no upload; `npm run typecheck` 0; `npm test -- --coverage` 0, 360 files, 5987 tests (the report's 5959 predates commit `f81f85905`); `changed-lines-coverage --base main` 0; `check-files --worktree` 0 and `--all` 0; `node --test scripts/quality/*.test.mjs` 121 of 121 before the reviewer's AC9 test; `npm run build-storybook` 0; `npm run check:css-vars` 0; `npm audit --omit=dev --audit-level=high` 0; `npm ls --omit dev --all` 0. CI jobs (locale leak, click-shield, homepage grid, authorization regression, CodeQL, gitleaks, zizmor) run on the PR and were not run here.
Findings: Critical 0, High 0, Medium 1, Low 4. Revision 1 of at most 2.
Overall risk: the upgrade itself is sound; what is left is build configuration around it.

Measured beyond the report:
- Every page route (40) on `next start`: 12 answer 200, 26 redirect, 2 are 404, none 500; no "Functions cannot be passed" in the server log. Listing detail with real data and signed-in pages stay unmeasured (no data, no session); click-shield covers the signed-in part on the PR.
- No visible change, against a Next 15 build of HEAD: 11 pages at 1280 and 390 px, 22 pairs. Geometry and text styles of every element: 0 differences. Screenshots: at most 17 pixels differ, by 1 of 255. Colours are only written differently (`lab()` from Turbopack's minifier).
- A failed Sentry upload leaves no `.map` under `.next/static` (dummy token, dead host), so a failed upload exposes no source.
- ESLint: the old `eslint-config-next@15` rule list against the resolved config: nothing lost, exactly five rules off. The proxy move is faithful; the built manifest has `/_middleware`, `runtime: nodejs`, the same matcher (by hand, see F5). Lock: 35 changed versions, only `next-cloudinary@7.0.0` under 14 days (D3), no new install script, dist values match the report.
- The guide's own checklist (`node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`) read against the report: no item missed. Route step 4, the `@canary` codemod, stays unrun: it executes unpinned code, and the reviewer waives it.
- Eight deliberate breaks (AC2 three times, AC3, AC4, AC5, the hook rules, the link scanner) each failed their test; files restored and compared byte for byte.

Scope exits of the report, each confirmed: `ClientLink` (a real 500 otherwise; the 17 other files with `component={Link}` are all client modules); the `eslint.config.mjs` migration and the five rules off (owner decision 2026-11-06, Task 953 now has its kickoff); `exhaustive-deps` as error; the Turbopack CSS path; `docs/state-authority.md`; the test mock edits (no assertion lost, `revalidateTag` expectations moved to `updateTag`); `jsx: react-jsx` (forced by Next 16).

Claims of the report that do not hold (no harm done):
- "SENSITIVE still names `src/middleware.ts`": the pattern at `scripts/quality/change-report.mjs:34` already covers `proxy.ts`. "`AGENTS.md` was rewritten, the owner decides": the block is already in HEAD through `f81f85905`; nothing is left to decide.
- "`/robots.txt` 307, probably as before": confirmed on production and a real defect, see Task 964. "Without a release": both bundles are attached to the release `ec37d48bf`, a real production commit, because the Sentry plugin takes the release from Git.
- AC7 now reads 31 of 34: the third failure was a line in the Task 959 kickoff, fixed by the reviewer. The other two are the same as before and belong to Task 948.

Findings (each closed in Review 2):
F1 — A local build uploads source maps to the real Sentry project. Severity: Medium      Category: Dependencies and configuration      CWE: 200      Location: `next.config.ts:22` Description: the token alone switches `withSentryConfig` on, and `.env.local` holds a live token. Impact: the executor's first build uploaded maps of unreleased code to the project `lero-al`; `env -u` does not stop it, because Next rereads `.env.local`, and only a memory note guards the next agent. Reproduction: `npm run build` with `.env.local` in place prints "Uploaded files to Sentry". Recommendation: R1. References: Secrets Management. Status: closed in Review 2. Uploaded 2026-11-06 21:28-21:29 UTC, bundles `ad464395` (197 files) and `0930c67a` (1186 files), read from the Sentry API. They hold the owner's code in the owner's project and are matched by Debug ID, so production stack traces are unaffected; deleting them is the owner's choice (Project Settings > Source Maps > Artifact Bundles).
F2 — The lint stop on Vercel depends on a setting nobody can see. Severity: Low      Category: Dependencies and configuration      Location: `vercel.json` Description: AC4 relies on Vercel running the `build` script; a Build Command in the dashboard would skip the lint, and the reviewer got 403 reading the project. Impact: a Vercel build could deploy past a lint error, which R72 (g) forbids. Reproduction: `vercel.json` has no `buildCommand`. Recommendation: R2. References: CI/CD Security. Status: closed in Review 2, test placed.
F3 — An inactive Sentry option waits for a decision that has no value. Severity: Low      Category: Dependencies and configuration      Location: `next.config.ts`, the `webpack` block Description: `webpack.treeshake.removeDebugLogging` does nothing under Turbopack. Impact: none at run time; the comment suggests a control that does not exist. `compiler.define` removes all 8 `__SENTRY_DEBUG__` and saves 152 bytes of 5.86 MB, so no owner decision is needed. Reproduction: build with and without `compiler.define`, compare `.next/static/chunks`. Recommendation: R3. References: Secure Code Review. Status: closed in Review 2.
F4 — The override Task 947 asked to re-check stayed unanswered. Severity: Low      Category: Dependencies and configuration      Location: `package.json:191` Description: Task 947's review says Task 952 re-checks `@swc/helpers`; the report is silent, and `next@16.4.3` pins `0.5.23` itself. Impact: a stale override can hold back a later fix. Reproduction: `npm view next@16.4.3 dependencies`. Recommendation: R4. References: NPM Security. Status: closed in Review 2.
F5 — The built check of threat T1 was manual. Severity: Low      Category: Tests      Location: `src/__tests__/security/proxyFile.test.ts` Description: the tests read the source; if Next stopped picking up the file they would stay green. Impact: session refresh and the nonce could vanish unnoticed until a click-shield failure. Reproduction: the test reads no build output. Recommendation: R5. References: Threat Modeling. Status: closed in Review 2; the live nonce check is Task 954 (`check-csp-violations.mjs`).

Signed-in pages and listings with real data, 2026-11-07, Next 15 against Next 16 on `next start`, writes blocked: guest and the saved admin session, 80 pages over 33 paths at widths 1280 and 390: same status and final URL, no 500, layout identical for admin (56 pages). 12 guest pages differ by random content; six repeated loads of the three least clear show both builds alternating the same two values. Colours differ only in notation (`oklch` against `lab`). Error 418 on `/admin/reports` and `/admin/support` is on both builds, Task 965. Moderator and agent pages were not reached: sign-in needs a Turnstile token and the saved agent session has expired; Task 965 walks them in CI. `/admin/listings/[id]/preview` and listing edit were not reached either; Task 965 lists them.
Closed by the reviewer in this turn: AC4 test placed (`scripts/quality/build-lints.test.mjs`, with its negative cases; the `vercel.json` case stays red until R2); five stale `.next/static/css` paths in `docs/design-system.md`; the Task 959 mobile record; the unnonced Mantine script added to Task 954; Task 953 kickoff written; Task 964 filed for robots and sitemap.

OWASP verdicts per sheet: [docs/security/owasp/reviews/Task_952.json](../../docs/security/owasp/reviews/Task_952.json) (the sheet list covers the whole reset branch against `main`).

**Review 2 of Revision 1, working tree on `governance/reset-2026-11-06` at `f81f85905` — APPROVED**
Scope: diff review of the revision (`src/lib/build/sentryBuild.ts` new, `next.config.ts`, `vercel.json`, `package.json`, `src/__tests__/sentryBuild.test.ts` new, `src/__tests__/security/proxyFile.test.ts`), with the rest of the Review 1 diff unchanged.
Tools (rerun by the reviewer, 2026-11-08): `owasp sync` and `check` 0; `check-ruleset` 0; `npm run lint` 0; `npm run typecheck` 0; `npm test -- --coverage` 0, 361 files, 5994 tests; `changed-lines-coverage --base main` 0 (`src/proxy.ts` 23/23); `check-files --worktree` 0, 86 files; `ac-tests --base main` PASS; `node --test scripts/quality/*.test.mjs` 126 of 126; `npm audit --omit=dev --audit-level=high` 0; `npm ls --omit dev --all` 0; `npm ci --dry-run --ignore-scripts` 0; `npm run build-storybook` 0; `product-gates` 32 of 34, the same two failures as before (`check:design-tokens:strict`, `check:enrolled-tailwind` on `MantineListingGalleryPattern.tsx`, a file this diff does not touch), both in Task 948. CI jobs (locale leak, click-shield, homepage grid, authorization regression, CodeQL, gitleaks, zizmor) run on PR #19.
Findings: Critical 0, High 0, Medium 0, Low 0. F1 to F5 closed.
Overall risk: low; a local build no longer reaches Sentry, and the Vercel build keeps it.

Measured beyond the report:
- F1, the case the report left out: `npm run build` with `.env.local` in place (live `SENTRY_AUTH_TOKEN`, no `VERCEL` key; keys read, values not printed), `VERCEL` unset, `SENTRY_URL=http://127.0.0.1:9` as a safety net only: exit 0, no Sentry, upload, release or host line, 0 `.map` under `.next/static`.
- F1, the other side: `next.config.ts` evaluated with a token and `VERCEL=1` is wrapped by Sentry (adds `env`, `experimental`, `serverExternalPackages`, 5 Sentry references); without `VERCEL` it is the plain config. So Sentry stays on for Vercel builds. `VERCEL=1 SENTRY_AUTH_TOKEN=dummy SENTRY_URL=http://127.0.0.1:9 npm run build` exit 0, 0 `.map`.
- F4: the `@swc/helpers` override came with `ec37d48bf` (Task 947); `overrides` now equals `main` (`import-in-the-middle` only), and the lock resolves `@swc/helpers@0.5.23` from `next`'s own pin, so no version moves.
- F2: `vercel.json` `buildCommand` is `npm run build`; CI builds before the tests, so `[SEC-T1-SRV-BUILT-PROXY]` reads a fresh manifest there.
- Seven deliberate breaks, each red, files restored and compared byte for byte: `usesSentryBuild` without the `VERCEL` test (2 cases), a bare token test in `next.config.ts`, the `webpack.treeshake.removeDebugLogging` option put back, `buildCommand` removed, and the built manifest with another matcher, with runtime `edge` and without `/_middleware`.
Claims of the report, each reproduced: the commands and exit codes in its table; the three deliberate breaks; the lockfile unchanged by the revision. "Not done": the `.env.local` build is now measured above; the CI jobs run on the PR; the two Sentry bundles of 2026-11-06 are deleted by owner decision (2026-11-08, translated: "if they are not needed, delete them"): the API list of 2026-11-08 shows every Vercel build as three bundles of 262 to 278 files, these two (197 and 1186 files, Turbopack) came from the local Next 16 build that was never deployed, so no event can carry their Debug IDs; the CI token got 403 on delete (least privilege, kept), so the owner deletes them in Settings > Source Maps > Artifact Bundles.
Closed by the reviewer in this turn: the backlog line of Task 947 still said "awaiting the commit" after `ec37d48bf`.

OWASP verdicts per sheet: [docs/security/owasp/reviews/Task_952.json](../../docs/security/owasp/reviews/Task_952.json); Secrets_Management, Threat_Modeling and Secure_Product_Design now `met`.
