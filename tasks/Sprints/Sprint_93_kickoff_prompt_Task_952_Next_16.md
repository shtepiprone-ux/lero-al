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
- AC5 The upload widget keeps its contract — test: `src/modules/listings/components/__tests__/ImageUpload.test.tsx`
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
