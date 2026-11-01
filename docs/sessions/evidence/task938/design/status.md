# Task 938 — design status (Opus, 2026-11-01): BLOCKED before C3

The kickoff is not written: the cause is not established, and the design rules forbid a plausible route (`BLOCKED`, never a
guess). Established facts and the single blocking dependency follow.

## Established (C2)

| # | Fact | Evidence |
|---|---|---|
| F1 | The failure is older than PR #12: the first `main` run whose Click-Shield job reached its scenario step after the move to the `security-ci` environment (`d8a07a3c7`, 2026-10-30) fails identically (16 empty base cells, 16 drawer open failures); PR #11 too. The October runs stopped earlier at `check:css-vars`; the last green run is 2026-08-16. | `l00-ci-excerpts.txt:11-21` |
| F2 | Only routes that render Supabase-backed pages time out in `page.goto` (`waitUntil: 'networkidle'`, 30 s): every base cell (`/sq`, `/en`, `/uk`, `/it`) and every drawer cell. The CI fixture route `/<locale>/ci/click-shield-modal` passes all 16 modal cells in about 2 s each. | `l00-ci-excerpts.txt:4-9` |
| F3 | The build log line `[sitemap] listings read failed { index: 0, code: undefined }` is explained and is not the cause: the build step's env has no `SUPABASE_SERVICE_ROLE_KEY` (`.github/workflows/governance-pr.yml` "Build production bundle"), so `createAdminClient()` throws and `src/app/sitemap.ts:54` logs an error without a code. | `l00-ci-excerpts.txt:3`; `src/app/sitemap.ts:37-54` |
| F4 | The CI target is the same Supabase project as local development (`vars.SECURITY_TEST_PROJECT_REF` = `bmxkzcxaojgmpgzawwtn`, read with `gh variable list --env security-ci`), and the `cli.mjs target` step passed, so the URL host is that project. | CI job step "Verify required approved development service configuration" passed |
| F5 | A local production build made with the full `.env.local` reaches `networkidle` on `/sq` at 320 px in 2358 ms. That build is not CI-equivalent: CI builds and starts with only the Supabase variables and `CLICK_SHIELD_CI_FIXTURE=1`, while `.env.local` holds about 30 more (Sentry, Turnstile, Google client, site URL, Cloudinary, …). | `p01-networkidle-probe-local.txt:7-8` |

## Blocking dependency

A CI-equivalent reproduction (`p02-ci-equivalent-repro.sh`: `__NEXT_PROCESSED_ENV=true` makes Next skip every `.env` file
without touching `.env.local`; only the CI variables are passed) must rebuild `.next`. A production server started by this design
session at 14:12 for `p01` (`next start -p 3101`, PIDs 28148 and 14628) still serves `.next`; stopping it was refused by this
session's permission classifier, and rebuilding under a running server would corrupt it. Unblocking needs the owner to stop that
server (or allow the stop), then the script runs and its output `p02-ci-equivalent-repro.txt` decides between the hypotheses:
a request that never settles without some variable (candidate owners: the monitoring client, the captcha script, the realtime or
auth client) versus a server render that never finishes against the CI target. Only then can C3 name the owner file and a route
that neither raises the timeout nor skips a cell (the reservation's own rule).
