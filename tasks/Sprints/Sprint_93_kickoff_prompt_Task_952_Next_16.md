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

## Attack surface

Changed → threat model:
- **T1 Spoofing / elevation, the proxy runs the session refresh and the CSP nonce.** A wrong move could leave the old
  copy running, with no nonce, or no proxy at all.
  - Mitigate: exactly one `src/proxy.ts`, the moved live file.
  - Test: the existing `middlewareScope.security.test.ts` cases, run against `@/proxy`.
  - A built check: `.next/server/middleware-manifest.json` (or its Next 16 successor) names the proxy with the same
    matcher.
  - The click-shield job's production server answers `/` with the CSP report-only header and a nonce.
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

## Review
