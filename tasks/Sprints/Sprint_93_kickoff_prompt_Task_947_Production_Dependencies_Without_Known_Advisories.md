# Task 947 — Production dependencies without high or critical advisories

Sprint 93 (governance reset). Priority **P0**. Owner decision D1 (2026-11-06): "Study the reference, rewrite the rules
of the flow and the gates" — the reference (OWASP Vulnerable Dependency Management, NPM Security) puts a known
advisory first. D2 (2026-11-06): "Quality must cover all files in the project, without exceptions." Revision 1
(2026-11-06) adds install scripts off by default and a valid dependency tree (NPM Security). Implementer: Sonnet.
Reviewer: Opus.

## Goal

`npm audit --omit=dev` on 2026-11-06 reports 2 critical, 9 high, 18 moderate advisories in production dependencies.
`next` 15.5.18 (`package.json:171`) is inside the ranges of 14 advisories, the highest being `>=10.0.0 <=15.5.27`
(GHSA-2464-fhr4-w9xw, critical) and `>=13.4.0 <15.5.24` (GHSA-p293-qw3h-jr36, critical); `@sentry/nextjs` `^10.49.0`
(`package.json:148`) is inside GHSA-mchm-gjx6-7h55 (critical, middleware bypass through the tunnel route,
`<10.75.2`). After the task, `npm audit --omit=dev --audit-level=high` exits 0 and every test passes — this is the CI
"Dependency audit" gate.

Two more defects measured on 2026-11-06: `.npmrc` has no `ignore-scripts`, so every `npm ci` runs the install scripts
of 9 packages (`npm query ":attr(scripts, [postinstall])"` and `[install]`: `@parcel/watcher`, `@sentry/cli`,
`esbuild` ×3, `msw`, `@swc/core`, `sharp`, `unrs-resolver`) — NPM Security: "ignore-scripts=true … allowlist the
packages that need them". And `npm ls --omit dev --all` exits 1 (`invalid: @swc/helpers@0.5.15`, `missing:
webpack@>=5.0.0, required by @sentry/webpack-plugin@5.3.0`), which is why the CI SBOM step carries
`--ignore-npm-errors` (`.github/workflows/ci.yml`, job `sbom`).

## Scope

- `package.json`, `package-lock.json`.
- Versions (each released at least two weeks before 2026-11-06, NPM Security "hold off on upgrading immediately"):
  `next` **15.5.28** (2026-10-14; also `eslint-config-next` / `@next/*` to the same version if pinned),
  `@sentry/nextjs` **10.76.2** (2026-10-08). The remaining high advisories (`sharp`, `postcss`, `nanoid`, `brace-expansion`,
  `browserslist`, `source-map-js`) are transitive: `npm update <name>` within the existing ranges first.
- `zod` high advisory (GHSA-mrhx-c7xc-m3w5) reaches through `next-cloudinary@6.17.5` → `@cloudinary-util/url-loader`;
  the audit's fix is `next-cloudinary@7` (major). Check its changelog; if the upgrade changes no API this project uses,
  take it; otherwise stop and report the exact breaking change (Vulnerable Dependency Management, case 5).
- `.npmrc`: `ignore-scripts=true`. The packages whose install script is needed (expected: `sharp`, `esbuild`,
  `@swc/core`, `unrs-resolver` for native binaries; `@sentry/cli` only if the build uploads source maps) are rebuilt
  explicitly by name (`npm rebuild <names>`) in a `postinstall`-free script `npm run setup:native` that CI and the
  README call after `npm ci`; each one is listed with the reason in the report. `msw` and `@parcel/watcher` are
  expected to need none — prove it with the build, the tests and Storybook.
- The dependency tree is valid: `npm ls --omit dev --all` exits 0 (fix `@swc/helpers`; resolve the `webpack` peer of
  `@sentry/webpack-plugin`); then remove `--ignore-npm-errors` from the CI SBOM step (Opus edits `ci.yml`).
- Dependencies: the versions above; each checked with `npm view <name>@<version> time scripts --json` in the report.
- Out of scope: any product code change beyond what an upgrade requires; major upgrades other than `next-cloudinary`.

## Attack surface

Dependency change → threat model (`.claude/rules/threat-model.md`):
- T1 (Tampering, supply chain): a new version or package carries malicious code → only the versions above, from the
  npm registry, no new top-level package, lockfile changed only by `npm install`/`npm update`; check that no package
  gains an `install`/`postinstall` script (`npm query ":attr(scripts, [postinstall])"` before and after).
- T2 (Denial of service / regressions): the upgrade breaks behaviour → the full test suite, the build, Storybook build.

## OWASP

Reviewed and approved on 2026-11-06, before the OWASP gate existed (2026-11-07): listed in `OWASP_GRANDFATHERED` of
`scripts/quality/check-files.mjs`. Its sheets (NPM Security, Vulnerable Dependency Management, Software Supply Chain
Security, Dependency Graph SBOM) are checked by the "### OWASP check" of Task 952, which carries its AC1.

## UI

No visible change. If the build or Storybook shows a visual difference, stop and report it.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 `npm audit --omit=dev --audit-level=high` exits 0 (the CI "Dependency audit" job runs the same command).
- AC2 `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run build-storybook` exit 0.
- AC3 `node scripts/quality/product-gates.mjs` shows no new failure compared with before the change (list before/after).
- AC4 `scripts/quality/install-scripts.test.mjs` (new, node:test, run in the CI quality job) fails when a package in
  `package-lock.json` gains an install script that is not in the `setup:native` allowlist, and when `.npmrc` lacks
  `ignore-scripts=true`.
- AC5 `npm ci`, then `npm run setup:native`, then AC2 pass in a clean clone; the report names every rebuilt package with
  its reason.
- AC6 `npm ls --omit dev --all` exits 0.

## Route

1. Record before: `npm audit --omit=dev --json` summary, `npm query ":attr(scripts, [postinstall])"` names,
   `node scripts/quality/product-gates.mjs` result.
2. `npm install next@15.5.28 @sentry/nextjs@10.76.2 --save-exact=false` (keep the existing range style of each line),
   matching `eslint-config-next` if present; then `npm update sharp postcss nanoid brace-expansion browserslist source-map-js`.
3. `next-cloudinary` per Scope.
4. `.npmrc` and `setup:native` per Scope; the tree per Scope.
5. Run AC1–AC6 and `node scripts/quality/check-files.mjs --worktree`. Report each command with its exit code and the
   relevant lines.

## Review

**Opus, 2026-11-06 — APPROVED WITH NOTES** (candidate: working tree on `governance/reset-2026-11-06` at `1c90366e4`;
files `.npmrc`, `package.json`, `package-lock.json`, plus the reviewer's AC4 test and CI edit).

Rerun by the reviewer:
- `npm audit --omit=dev`: 0 critical, 4 high (it was 2 critical, 9 high). Exactly the four the report names.
- `npm ls --omit dev --all`: exit 0.
- Lock age: 119 new name@version pairs, all at least 14 days old (registry publish times, script in the review
  session).
- Clean `npm ci` with `ignore-scripts=true` in an empty folder: `esbuild`, `@swc/core` (nested under `next-intl`),
  `unrs-resolver` and `sharp` load and work with no rebuild. So `setup:native` was not needed; the reviewer removed it.
- `node --test "scripts/quality/*.test.mjs"`, lint and typecheck: see the session log. The full suite, build and
  Storybook run in CI on the commit.

Findings:
- F1 (AC1, P0) — the audit still exits 1. `postcss` inside every `next@15.x` and `zod` through `next-cloudinary@6`
  are fixed only by `next@16` and `next-cloudinary@7`. Both sit outside this kickoff (a major upgrade; a version
  younger than 14 days). The report is correct. Moved to **Task 952**: the owner decision D3 (2026-11-06) allows a
  one-time exception for `next-cloudinary@7.0.0`.
- F2 (AC4/AC5, P2) — the executor could not write `scripts/quality/`. The reviewer placed
  `scripts/quality/install-scripts.test.mjs`. Every package in the lock that declares an install script is listed with
  the reason it does not run. A new one, a stale entry, a missing `ignore-scripts=true` or `legacy-peer-deps=true` fails
  the test. A deliberate break of `.npmrc` failed it (3 pass, 1 fail), and the file was restored. The draft's
  nested-quantifier regex over the rebuild list (a ReDoS shape CodeQL flags) was not used.
- F3 (P3) — the SBOM step no longer passes `--ignore-npm-errors`. `scripts/quality/ci-workflow.test.mjs` fails if it
  returns.

Accepted decisions of the report:
- (1) `legacy-peer-deps` removed. The tree must be valid, and the webpack peer of `@sentry/bundler-plugins` is
  now real.
- (2) the `@swc/helpers` override to 0.5.23, within the same 0.5 line, with the build, tests and Storybook green. Task
  952 re-checks whether Next 16 still needs it.
- (3) the lock regenerated with `--before`, which satisfies the 14-day rule.

The `withSentryConfig` deprecation is in Task 952's scope.
