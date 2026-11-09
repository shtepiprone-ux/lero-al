# Whole-project OWASP audit, 2026-11-06 — coverage ledger

Which file was examined how. The lanes and their checks are code: `scripts/quality/audit-coverage.mjs` puts every tracked
file into exactly one lane and fails on a file no lane takes (`audit-coverage.test.mjs`, run in CI by the "Quality script
tests" step). Counts are from `node scripts/quality/audit-coverage.mjs` on 2026-11-07, before the files this audit adds.
Findings: `findings.md`.

## Reading rule

- **Read in full**: the auditor read every line of every file of the lane.
- **Machine + flagged**: every line is scanned by the lane's tools; the auditor read every line a tool flagged, not every
  line of the lane.
- **Machine only**: the lane's tools scan every file; nothing was read by a person or a model.

## Lanes

| Lane | Files | Lines | Reading | Machine checks on every file |
|---|---|---|---|---|
| server-entry (route handlers, Server Actions, `proxy.ts`, `instrumentation.ts`, the two `server-only` gateways) | 47 | 7 410 | read in full | check-files, gitleaks, ESLint security rules, TypeScript, CodeQL; route and action security tests; authorization regression on real RLS |
| server-page (`page`, `layout`, `loading`, `error`, `not-found`) | 43 | 2 865 | read in full | as above; page security tests where a page reads private data |
| server-lib (`src/lib`, module `lib` / `dashboard` / `statistics` / `activity`, admin actions helpers, `src/i18n`, `src/types`) | 112 | 10 564 | read in full | as above; unit and security tests |
| sql (`supabase/sql_migrations/**`) | 22 | 3 266 | read in full, and compared with the live catalog | check-files; `db-catalog-audit.mjs` (invariants I1-I9) on the live catalog |
| ci-agent-config (`.github`, `.githooks`, `.claude`, `AGENTS.md`, `CLAUDE.md`) | 30 | 2 089 | read in full | check-files; zizmor; `ci-workflow.test.mjs`, `agent-settings.test.mjs`, `agent-check.test.mjs` |
| build-config (root configuration) | 15 | 38 008 | read in full except `package-lock.json` (36 856 lines, machine only) | check-files; `npm audit`; `install-scripts.test.mjs`; SBOM; Dependabot; the build |
| quality-script (`scripts/quality`) | 9 | 1 419 | read in full | ESLint, CodeQL; `node --test scripts/quality/*.test.mjs` |
| client-ui (product `.ts` / `.tsx` / `.css` outside the server lanes) | 382 | 55 179 | machine + flagged | ESLint (no code from strings, no `dangerouslySetInnerHTML` without a named sanitizer, no `javascript:` URLs, no `window.location` writes), TypeScript, CodeQL, **`client-sinks.mjs` K1-K8** (postMessage to `*`, message listeners without an origin check, `outerHTML` / `insertAdjacentHTML`, credential-like storage, stored URLs as `href`, HTML / code / URLs set through DOM APIs (`innerHTML +=`, `Function(`, `createContextualFragment`, `srcdoc`, `setAttribute` of a handler or URL), navigation to a computed address, and every `dangerouslySetInnerHTML` by occurrence) and `src/__tests__/security/clientSinks.test.ts` (`window.open` and `target="_blank"` without noopener, `dangerouslySetInnerHTML` outside its allow-list and more than once per allowed file, `eval`, `Function(`, `innerHTML =` / `+=`, `document.write` / `writeln`, string timers; each rule proven by a planted case through its own checker since 2026-11-07); the OWASP XSS Filter Evasion vectors against `sanitizeCmsHtml` (`sanitizeCmsHtml.security.test.ts`); component tests |
| test | 406 | 70 504 | machine + flagged | the suites themselves run in CI; check-files and gitleaks (no real credential in a fixture); ESLint; CodeQL |
| story (`*.stories.*`, `src/stories`, `.storybook`) | 210 | 25 184 | machine + flagged | ESLint story rules; Storybook build in CI; check-files |
| script (`scripts/**` outside `scripts/quality`) | 268 | 67 467 | machine + flagged | check-files; ESLint; CodeQL (open alerts: Task 951); the product gates that run them |
| locale-data (`messages/*.json`) | 4 | 11 544 | machine + flagged | check-files (encoding, invisible characters); `check:i18n` (the same keys in every locale); **`scripts/quality/locale-safety.mjs`** on every value (M1 markup or rich-text tags, M2 `javascript:` / `data:` / `vbscript:`, M3 plain `http://`, M4 invalid ICU MessageFormat parsed with next-intl's own parser, M5 placeholders that differ between locales, M6 `t.rich` / `t.markup` / `t.raw` / `t.html` outside reviewed code); its first run found two Story captions that were not valid ICU (fixed) |
| owasp-reference (`docs/security/owasp`: the registry of the 137 OWASP Cheat Sheet Series sheets and the mapping of each to this project, added 2026-11-07) | 2 | — | read in full (every applicable sheet read at its registry version) | check-files; `owasp.mjs sync --verify` (the registry equals upstream) and `owasp.mjs check` (O1-O8: every sheet mapped at its version, every quote found in its sheet, every control's evidence found in its file, every requirement handed to a task cited by its kickoff) in CI; the same state opens every Claude Code session (`agent-check.mjs start`) |
| evidence (`docs/sessions`, `docs/reviews/artifacts`) | 12 234 | — | machine only | check-files (secrets, encoding, invisible characters, syntax); gitleaks; CodeQL for the probe scripts (Task 951); never run in CI |
| docs-tasks (`docs`, `tasks`, `README`, `LICENSE`) | 1 077 | — | machine only | check-files (links, stale paths, kickoff checks); `ac-tests.mjs` on the active kickoff |
| static-asset (`public`, `src/app/*.ico|png|svg`) | 8 | — | machine only | check-files (file type, encoding) |

## Live state read outside the repository

| Source | Tool | Result 2026-11-07 |
|---|---|---|
| Postgres catalog of the one Supabase project (52 tables, 176 policies, 58 table grants, 57 column grants, 29 definer functions, 32 CHECKs, 27 triggers, 1 bucket) | `node scripts/quality/db-catalog-audit.mjs` (read-only transaction) | 59 violations: DB-01..DB-06, DB-08 |
| Cloudinary upload presets | `node scripts/quality/cloudinary-config.mjs` (one Admin API GET) | 2 presets, U1 on the browser widget's preset: X-01 |
| GitHub `main` ruleset | `node scripts/quality/check-ruleset.mjs` | matches `main-ruleset.json` |
| Vercel project settings (Node runtime, env scopes) | Vercel connection | not readable: the agent's connection has no access to the team scope (B-01 asks the owner) |
| Supabase Auth settings (password floor, leaked-password check) | none: the Management API needs a personal access token the project does not hold | unknown (L-03 makes the server enforce its own policy) |

## What "every line" means in this audit

Every tracked file is in a lane, and every lane's tools scan every line of it in CI. A person or a model read every line of
the server side, the SQL, the CI, agent and build configuration, and the quality scripts: 278 files, 28 765 lines
(the lock file excepted). Client code, tests, Stories, scripts and locale data (1 270 files, about 230 000 lines) are
covered by the tools on every line and read where a tool flags a line; the client sinks that a one-off census found are
now a CI tool, so a new sink fails the build instead of waiting for the next audit. Evidence, documents and static assets (13 319 files)
are machine-checked only. A lane that a future audit reads in full changes its reading rule in `audit-coverage.mjs`
in a reviewed change.
