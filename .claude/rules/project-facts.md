# Project facts: tools, accounts, environments

Moved from the account memories on 2026-11-22 (owner, translated: "move the valid lessons from memory into
`.claude/rules/`, so that Opus and Sonnet read one source"). Each line is a fact with its date; a fact that can be read
again (a grant, a setting) is re-read before it is relied on (checklist A3). Read this file before saying a tool or an
access is missing (checklist A15).

## Claude Code accounts

| Command | Account folder | Model |
|---|---|---|
| `claude` | `%USERPROFILE%\.claude` | Opus |
| `oclaude` | `%USERPROFILE%\.claude-account2` | Opus |
| `sclaude` | `%USERPROFILE%\.claude-account1` | Sonnet |

The project rules are this folder and `CLAUDE.md`, the same for every account. Each account's own `CLAUDE.md` holds
only the account rules (Git and language), identical in all three. Memory holds no rules.

## GitHub

- `gh` lives at `C:\Program Files\GitHub CLI\gh.exe`, authenticated as the owner (2026-10-07). In an agent shell
  started before the install, refresh PATH first (PowerShell):
  `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User');`
- Agents use `gh` read-only: `gh pr checks`, `gh pr view`, `gh run list`, `gh run view`, GET `gh api`. `jq` is not
  installed in the Git Bash tool: use `gh ... --jq '<expr>'`.
- The `main` ruleset (`scripts/quality/main-ruleset.json`) requires a pull request, squash merge, `CI Required`, signed
  commits and has no bypass. Before merge commands, check that the pull request's commits are signed (GitHub's
  verification, `gh api` GET); unsigned commits block the merge (2026-11-09).
- CodeQL `js/xss-through-dom` has no barrier for scheme checks on a JSX `src`/`href`; such alerts are closed by a
  reviewed `barrierModel` row in `.github/codeql/extensions/lero-al-javascript-models`, guarded by
  `scripts/quality/codeql-models.test.mjs`, and verified only by the CodeQL job on GitHub (2026-11-09).

## Vercel

- The Vercel MCP is installed and authorized (owner, 2026-11-18); its tools are deferred: load them with ToolSearch
  before saying there is no access. The Vercel CLI is not installed.
- Agents only read (list, inspect, logs, env names); deploys, promotions, rollbacks, env writes, domains and purchases
  are the owner's. A `sensitive` env value is never readable: it is `UNKNOWN`. Never write the team ID, project ID,
  team slug or account name into a tracked file (the repository is public). Detail: `docs/integrations.md`
  ("Vercel — agent access").

## Supabase and test data

- Free plan: no backups and no point-in-time recovery; never ask for a backup before an apply. The safety net is the
  reviewed rollback file and the read-only checks before and after (owner, 2026-10-24).
- Owner decision D91 (2026-10-28): until launch, every test, including a scripted break of a database protection for a
  sensitivity proof, may run on the one real project: one break at a time, a catalog fingerprint before and after,
  restore in `finally`, synthetic fixtures only. After launch: branches and separate databases.
- Owner decision D32 (2026-11-05): everything in `.env.local` is test data until launch; agents keep access. At launch
  the keys are replaced and access is decided again.
- Test accounts in `.env.local`: `HYDRATION_ADMIN_*`, `HYDRATION_MODERATOR_*`, `HYDRATION_AGENT1_*`,
  `HYDRATION_AGENT2_*` (`EMAIL`, `PASSWORD`). Every role-dependent behaviour is checked with them, never only as a
  guest. Read the values with a script that splits each line at the first `=` (the passwords contain `#`, which
  `node --env-file` cuts as a comment); never print them. The sign-in form needs a Turnstile token, which a scripted
  browser does not get; a scripted session signs in with `signInWithPassword` the way `src/tests/integration/fixtures.ts`
  does (2026-11-18).
- `PGRST204` ("could not find column") means schema drift: check `information_schema.columns`; after a schema change
  run `NOTIFY pgrst, 'reload schema'`.
- Grants read on 2026-11-15 (`db-catalog-audit.mjs`): `authenticated` has no write grant on 15 of 17 staff tables; only
  `listings` (insert, update, delete) and `listing_reports` (insert) are writable by a session.

## Cloudinary

- A signed call signs only its own parameters, sorted alphabetically, plus the secret, with SHA-256; it sends
  `signature_algorithm=sha256` as a form field and never puts it into the signed string (live 401 on 2026-11-09).
- Upload folders are opaque account UUIDs; each upload carries `tags`/`context` with the uploader's `#public_id` and
  the listing id; the admin profile copies the UUID (owner decision O957-3, 2026-11-18).

## Local machine (Windows)

- The owner's shell is Windows PowerShell 5.1: `Get-Content`, `Set-Content` and `Out-File` get `-Encoding UTF8`; an
  exit code is read with `$LASTEXITCODE` right after the native command, never through `cmd.exe /c ... %errorlevel%`.
- Backslashes typed into inline `node -e`, `python -c` or heredoc snippets arrive halved; write such code with Write or
  Edit. `scripts/check-rendered-state-census.mjs` and `scripts/rendered-state-census/runner.mjs` are CRLF files. A
  synthetic JWT in a test is built from parts (`[a, b, c].join('.')`) so the secret scan does not flag it; a Unicode
  escape is built at runtime (`String.fromCharCode`).
- `.env.local` holds a live `SENTRY_AUTH_TOKEN`; `src/lib/build/sentryBuild.ts` uploads only when `VERCEL` is also set.
  `next dev` rewrites `AGENTS.md`. Builds do not run locally anyway (checklist A5).
- The owner keeps a Storybook dev server running; it locks native files in `node_modules`, so a dependency install in
  the owner's folder can break it: none is run there.
- After stopping a background run, list its child processes (`Get-CimInstance Win32_Process`) and end each root with
  `taskkill /PID <pid> /T /F`.
- All work stays in the one project folder: no git worktree and no copy of the project (owner, 2026-10-21).

## Owner-approved UI patterns

- Tabs stay one horizontal row: `Tabs.List` inside `ScrollArea` with `scrollbarSize={0}`; never `grow` (2026-06-25).
- `SegmentedControl` below 640 px stretches to full width when its content fits and swipes when it does not (Material 3
  segmented buttons, 2026-06-25).
- ApexCharts: its native tooltip is used as is (owner, Task 845); bars are SVG `<path>` elements, so geometry is read
  with `getBoundingClientRect()`; a `play()` assertion on a chart waits with `waitFor`, because the chart is a
  client-only dynamic import, and reads the active locale from `globals`.
