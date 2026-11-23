# Task 963 — The OWASP Cheat Sheet Series holds every task and every change, and no gap is only reported

Sprint 93 (governance reset). Priority **P0**: the reset PR (#19) carries it. Owner requests 2026-11-07 (translated):
"create a tool or script that forces Opus, when creating, editing or reviewing a task, to always check against
https://cheatsheetseries.owasp.org/index.html and add or upgrade the protections and checks of current and new code";
"the mechanism must work for any type of task, the existing ones and the ones created later, even not yet reserved;
full automation of the workflow"; "you are forbidden to walk past the gaps you find and only report them; a golden,
inviolable rule, always"; "the translations need quality protection". Also the whole-project audit's direct fixes
(`docs/security/audit-2026-11-06/findings.md`: T-03, T-04, CI-01, G-01, G-02, G-03). Implementer: Opus (rules, hooks,
CI and quality scripts at the owner's request, `flow.md` roles). Reviewer: a fresh Opus session that did not write it
(Opus never approves its own implementation). Human owner of the change: the owner.

## Goal

Before this task the OWASP reference was a memory: nothing made a design or a review consult the current sheets,
nothing saw a sheet change upstream, a cited quote was never checked against its sheet, a change could reach `main`
without any task, locale values and client sinks were checked only by a CI scan of tracked files, and an audit finding
could stay a remark. After the task each of those is a gate that fails, with a self-test that proves it detects.

## Cause

The reference was a memory, not a gate (`docs/security/audit-2026-11-06/findings.md:216`, G-03). Review 1 (2026-11-23) found what is left: a quality
script parses the secret file itself and sends what it read to the network (`scripts/quality/cloudinary-config.mjs:116-131`, `:140`, `:167`; `gh api
"repos/:owner/:repo/code-scanning/alerts?state=open"` → #349 and #350 `js/file-access-to-http`); the exemption list still holds an archived task
(`scripts/quality/owasp.mjs:63`); a reviewed sink names a task that no longer holds its finding (`scripts/quality/client-sinks.mjs:44-45`).
Fix: the gates, tools and rules of the Scope below; Revision 1 removes the three causes Review 1 found.

## Scope

- `scripts/quality/owasp.mjs` (+ `owasp.test.mjs`): `sync [--verify]`, `cache`, `check` (O1-O9), `plan`, `kickoff`,
  `review`, `gate`, the session context; `docs/security/owasp/sheets.json` (the registry, 137 sheets at upstream commit
  `757270a26306`) and `docs/security/owasp/controls.json` (the mapping: 84 apply, 53 not, each requirement a verified
  quote held by a control's evidence text or by an open task whose kickoff cites it). `.cache/` ignored.
- `scripts/quality/check-files.mjs` (+ test): "## OWASP" in every Sprint 93+ kickoff (not counted in the 200 lines),
  the OWASP review record of every written review, `OWASP_GRANDFATHERED` (947 only, may only shrink); the per-file locale
  rules M1-M5 on `messages/<locale>.json` and K1-K8 plus M6 on product code; the golden rule on audit ledgers
  (`finding-status`).
- `scripts/quality/locale-safety.mjs`, `scripts/quality/client-sinks.mjs` (+ tests): tracked and untracked files.
- `scripts/quality/owasp.mjs session` (the SessionStart hook): re-reads upstream after a day and puts the reference's
  state, findings first, into the session. (Owner D974-1, 2026-11-14: the agent-loop hook `agent-check.mjs`, its stop
  check and `audit-coverage.mjs` were deleted as over-engineering; their parts of this task are withdrawn.)
- The task gate's verdict (found in the Task 953 review, 2026-11-08): `lastVerdict` took the last of the words APPROVED or
  NEEDS REVISION anywhere under "## Review" (`owasp.mjs:393-397` before), so a review in revision that quoted the word APPROVED held
  the change as approved (measured: Task 953 under revision was listed among the approved reviews). Now only a verdict line counts
  (secure-code-review.md §5: a line that starts with Review, Verdict or Opus, the verdict after the dash or the colon).
- `scripts/check-surface-census-changed.mjs` and `scripts/quality/product-gates.mjs` (found in the Task 953 review, 2026-11-08): the census
  maps `base..head` only, so a new file not yet committed is never censused in a local review; Task 952's `ClientLink.tsx` passed
  review 2 that way and failed once committed. A local run (no `HEAD_SHA` set) also maps the untracked and modified files of the
  working tree; CI keeps `base..head`. The same blind spot hides `check:ui-contract` and the mobile-adaptation contract
  (found in the Task 953 review 3, 2026-11-08): Task 953 passed locally with 32 of 34 and failed `check:ui-contract` once
  committed (PR #19 run 42499113506, three enrolled components without a contract; the fix is Task 948 Goal 3). Every
  diff-based product gate of `product-gates.mjs` reads the working tree in a local run.
- The CodeQL alerts of this task's own files, open on PR #19 on 2026-11-08 (`gh api` code-scanning alerts,
  `ref=refs/pull/19/merge`, `state=open`): `scripts/quality/owasp.mjs:474` (file-access-to-http), `:477`, `:558`,
  `:564` (http-to-file-access), `:478` (file-system-race), `scripts/quality/cloudinary-config.mjs:50`
  (file-access-to-http). The gap behind them: the cache wrote a downloaded sheet without checking it against the Git
  blob SHA the registry holds, and trusted a side `.sha` file (`owasp.mjs:473-478` before). Fixed in code: `refreshCache`
  refuses a commit that is not a 40-hex Git id and a sheet name, file name or blob id of another shape before any
  request; keeps a download only when its blob SHA equals the registry's `sha`; keeps a cached file only while it still
  is that blob (no `.sha` file, no check-then-use: `:478` gone); the `sync` marker keeps only the local read time (`:558`
  gone). Left by design: `:474`, `:477`, `:564` download a sheet at the pinned commit and write it or the registry, and
  `cloudinary-config.mjs:50` sends the Cloudinary credentials to their own Admin API (`https://api.cloudinary.com`, cloud
  name `^[a-z0-9_-]+$`). CodeQL has no barrier for these flows (its `FileAccessToHttp` sanitizers are `.length` reads and
  generated code only; `HttpToFileAccess` has none, read 2026-11-08), so only a change of purpose would silence them.
  Owner decision D-CQ1 (2026-11-08, translated: "decide according to development best practices of 2026"), an
  exception to D2 for these four alerts only: each is dismissed as "won't fix" with a comment that names its control
  and test (`owasp.test.mjs` cache cases; the fixed host and the cloud-name check of `cloudinary-config.mjs`). No path
  is excluded from the scan; a changed flow in these files raises a new alert, which is triaged again. D2 stands for
  every other alert.
- `.github/workflows/ci.yml`: the quality job's `sync --verify` and `check` steps; the `owasp-gate` job, required by
  `CI Required` (pinned since D974-1 by `requiredProblems` in `scripts/quality/ci-secrets.test.mjs`).
- The runner image (found in the Task 953 review 2, 2026-11-08): every job of `ci.yml`, `repository-settings.yml` and
  `scorecard.yml` says `runs-on: ubuntu-latest`, which GitHub moved from `ubuntu-24.04` (run 42293555720, 2026-11-06) to
  `ubuntu-26.04` (run 42455177615 onward). Playwright 1.60.0 refuses that image (`ERROR: Playwright does not support
  chromium on ubuntu26.04-x64`), so Locale leak 1-6, Click-shield, Homepage grid and the browser step of "Lint, types and
  product checks" fail before any check runs (run 42465743137): no Story or page has been rendered in CI since Next 16.4.3
  landed. Every job names `ubuntu-24.04`, so a moved label cannot change the image unseen.
- The census limit (found in the Task 953 review 2): `scripts/map-changed-surfaces.mjs:60` `DEFAULT_MAX_SURFACES = 60`;
  PR #19 with Task 953 maps 65 surfaces (`--base main`; the whole census takes 40 s), so once 953 is committed the census
  fails closed with `surface-limit-exceeded` in CI, and each later Sprint 93 task adds surfaces. Owner decision O-CS1
  (2026-11-08, translated: "option (a), raise the limit to 200"): `DEFAULT_MAX_SURFACES = 200` with its reason in the
  file; every mapped surface is still censused and named, the limit bounds run time, not coverage, and one surface
  beyond it still fails closed.
- Rules and skills: `CLAUDE.md` (golden rule), `.claude/rules/flow.md` (golden rule, the OWASP chain),
  `.claude/rules/quality-gates.md`, `.claude/rules/kickoff-template.md`, `.claude/rules/secure-code-review.md`,
  `.claude/skills/create-task/SKILL.md`, `.claude/skills/review-task/SKILL.md`, `.claude/skills/execute-task/SKILL.md`.
- The audit's direct fixes: `src/__tests__/security/clientSinks.test.ts` (T-03),
  `src/modules/cms/lib/__tests__/sanitizeCmsHtml.security.test.ts` and the four `messages/*.json` captions (T-04),
  `scripts/quality/db-catalog-audit.mjs` and `scripts/quality/cloudinary-config.mjs` (G-01), the ledgers
  `docs/security/audit-2026-11-06/findings.md` and `coverage.md`.
- `scripts/quality/change-report.mjs`: a version the lockfile did not resolve before, transitive ones included, younger
  than 14 days is a hard failure unless `package.json` `overrides` pins it exactly; `--lockfile-age <base>` runs the
  same check on the working-tree lockfile before a commit (AC15).
- Dependencies: none (Node built-ins; the ICU parser next-intl already ships).
- Out of scope: product fixes of the findings (Tasks 949-962 carry them).
- Revision 1 (Review 1; Opus, a session other than the reviewer's; nothing else changes): R1-1 (F1, owner decision O963-1, 2026-11-23, translated: "do
  it according to the best programming and security practices of 2026") `scripts/quality/cloudinary-config.mjs` reads its credentials from the
  environment only (`readEnv` keeps the `process.env` loop over `NAMES`, the `.env.local` read leaves), so no file data reaches `fetch`; the command is
  `node --env-file=.env.local scripts/quality/cloudinary-config.mjs` in `.claude/rules/checklists/design.md` (D6), `execute.md` (I10), `review.md` (V7),
  `.claude/rules/quality-gates.md`, `.claude/rules/secure-code-review.md` and the file's own usage line; `cloudinary-config.test.mjs` proves a missing
  credential stops the tool (exit 2) with no file read; CodeQL alerts #349 and #350 close as fixed on the pull request, none is dismissed. R1-2 (F3)
  `owasp.mjs` `OWASP_GRANDFATHERED` is empty (947 is archived). R1-3 (F4) the K5 entry of `client-sinks.mjs` names Task 988 (P-06 moved there 2026-11-19).
  The command also changed in `docs/env.md` and the Task 1003 kickoff (the other active mentions). Revision 2 (Review 2; nothing else changes): R2-1 (F5)
  `scripts/quality/check-files.test.mjs:139` asserts that a Sprint 93 kickoff of Task 947 is held to the OWASP gate (an invented quote is an `owasp`
  finding), since `OWASP_GRANDFATHERED` is empty.

## Attack surface

Changed: the governance path every change takes (agent sessions, kickoffs, reviews, CI), not the product.
- T1 Tampering with the reference: a mapping edited to pass, a quote invented, a control's evidence removed.
  Mitigation: every quote checked against the sheet text, every evidence against its file, upstream against the
  registry (O1-O8), the mapping and CI files are sensitive paths the owner approves.
- T2 Elevation of privilege of a change: code lands with no reviewed task. Mitigation: the task gate in CI.
- T3 Repudiation: a gap reported and forgotten. Mitigation: `finding-status` on every ledger, O8 on handed requirements.
- T4 Denial of service on development: upstream drift blocks every PR. Accepted by design (the owner asked for
  permanent synchronisation); the session start and the daily CI run name the sheets to re-read.

## OWASP

- AI_Agent_Security: "Require explicit tool authorization for sensitive operations." — the agent's own claims (a quote, a control, a reviewed task) are checked by tools before CI accepts them; mutating Git stays the owner's — AC1, AC2.
- Abuse_Case: "it is important to identify the attacks which the application must defend against" — T1-T4 name how the governance path could be bypassed or tampered with — AC1, AC2, AC5.
- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — O9 holds every file to a sheet; the task gate monitors each change — AC1, AC2.
- Bot_Management_and_Anti-Automation: not applicable — no endpoint or limit of the product changes; the words came from the threat list.
- Business_Logic_Security: not applicable — "race" here is a file-descriptor race in the scripts; no product workflow or price changes.
- CI_CD_Security: "Require pull requests to be reviewed before merging and ensure this review step cannot be bypassed." — the task gate requires an approved review in every change, and CI Required waits for it — AC2.
- Credential_Stuffing_Prevention: not applicable — no sign-in or credential path changes; the words came from the threat list.
- Cryptographic_Storage: not applicable — the cache's Git blob hash only identifies a sheet text; nothing secret is stored or encrypted.
- Cross_Site_Scripting_Prevention: "Since no single technique will solve XSS, using the right combination of defensive techniques will be necessary to prevent XSS." — locale values and client sinks are checked at every commit and CI run, the CMS sanitizer by its tests — AC4, AC7.
- DOM_Clobbering_Prevention: "Robust HTML sanitizers can prevent or restrict the risk of DOM Clobbering." — the evasion vectors include form, base and meta tags, and the sanitizer must remove each — AC7.
- DOM_based_XSS_Prevention: "It is always a bad idea to use a user-controlled input in dangerous sources such as eval." — client-sinks K1-K8 run on each product file at every commit and CI run — AC4.
- Dependency_Graph_SBOM: not applicable — the SBOM job is unchanged; AC15 only ages the versions the lockfile brings in.
- Denial_of_Service: not applicable — the product's request paths are unchanged; cloudinary-config.mjs only reads the upload presets once.
- File_Upload: not applicable — cloudinary-config.mjs reads the presets read-only; the upload paths change in Task 957.
- GitHub_Actions_Security: "Always set permissions: {} at the workflow level to disable all permissions by default." — the new job reads contents only, holds no secret, and takes the base SHA through env — AC2.
- HTTP_Strict_Transport_Security: not applicable — the scripts are HTTP clients of fixed hosts; no response header of the site changes.
- Injection_Prevention: "The preferred option is to use a safe API which avoids the use of the interpreter entirely or provides a parameterized interface" — owasp.mjs runs git with an argument array and a base ref from CI's env, never a shell string — AC2.
- JavaScript_and_TypeScript_Security: "Keep patterns linear: avoid nested quantifiers and ambiguous alternation over the same characters." — the trigger and rule patterns are flat alternations over fixed words — AC1.
- Key_Management: not applicable — the scripts create, store or use no key; nothing is signed or encrypted.
- LLM_Prompt_Injection_Prevention: "Enforce permissions and parameter validation at the tool boundary" — a sheet text, a kickoff or a review is data the tools check; none is run or followed as an instruction — AC1, AC3.
- MCP_Security: not applicable — no MCP server is added or configured; Task 961 watches the tool definitions.
- NPM_Security: "Always vet and perform due-diligence on third-party modules you install to confirm their health and credibility." — every version a lockfile change brings in, transitive ones included, is refused when younger than 14 days — AC15.
- Nextjs_Security: not applicable — the word comes from the runner finding (no page rendered in CI since Next 16.4.3); no route, action or proxy changes.
- OS_Command_Injection_Defense: "The primary defense is to avoid calling OS commands directly." — owasp.mjs starts only git and node, with fixed argument arrays and no shell — AC2; change-report.mjs passes to `npm view` only a name that `isNpmName` accepts — AC15.
- Secrets_Management: "prevent them from leaking and compromising the organization" — the Cloudinary credentials read by `cloudinary-config.mjs` are sent to `https://api.cloudinary.com` only, refused for any other host — AC10.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — the review reads the whole diff of the governance files and reruns every check — AC8.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — an agent's citation of a sheet counts only when the tool finds the quote in the sheet — AC1, AC3.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — every gap the mapping found became a task with tested criteria (959, 954, 955, 960, 961, 962) — AC5.
- Software_Supply_Chain_Security: "limit the application's dependencies to a specific version that has been previously verified as legitimate and secure" — the reference itself is pinned by its upstream commit and per-sheet hashes; the new job pins every action by SHA — AC1, AC2.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — the attack surface section answers them for the governance path — AC1-AC6.
- Transport_Layer_Security: not applicable — the scripts call fixed `https:` hosts through Node's default TLS; no server TLS setting changes.
- User_Privacy_Protection: not applicable — no personal data is read or stored; cloudinary-config.mjs reads preset settings only.
- Vulnerable_Dependency_Management: "It's highly recommended to perform automated analysis of the dependencies from the birth of the project." — the change report ages every new lockfile version on every pull request — AC15.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — a fresh Opus session reviews and reruns every check; the implementer's report is not evidence — AC8.
- Web_Frontend_Security: not applicable — no page, header or browser-side code of the product changes; the words came from the sanitizer tests.
- XSS_Filter_Evasion: "input filtering is an incomplete defense for XSS" — the evasion vectors prove the sanitizer, not a filter, holds — AC7.

## UI

No visible change.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 The mapping holds and each rule detects — test: `scripts/quality/owasp.test.mjs` (O1-O9 each planted, the
  repository check, the session context, the plan, the kickoff and review checks) and `node scripts/quality/owasp.mjs check`.
- AC2 No change bypasses a task — test: `scripts/quality/owasp.test.mjs` (the task gate: documentation alone passes;
  code without a task, with a task not approved, or approved without its OWASP check fails; a sheet the diff triggers
  and no review judged fails; a version-only dependency update passes, a new script or workflow step does not),
  `scripts/quality/ci-secrets.test.mjs` (`CI Required` needs the `owasp-gate` job and fails on any result but success,
  so a skipped gate fails it; a secret is bound only on the step that reads it) and `gh pr checks <n>` (the OWASP task
  gate check ran and passed).
- AC3 Every kickoff and review is held to the reference — test: `scripts/quality/check-files.test.mjs` (missing
  "## OWASP", an invented quote, the 200-line count without the checklist, a grandfathered kickoff) and
  `node scripts/quality/owasp.mjs kickoff tasks/Sprints/Sprint_93_*.md`.
- AC4 Locale data and product code are checked at every commit and CI run — test: `scripts/quality/check-files.test.mjs` (a planted
  tag, scheme, plain http address and broken ICU value each fail; a sink and a bypassing call fail; tests are not
  product code), `scripts/quality/locale-safety.test.mjs`, `scripts/quality/client-sinks.test.mjs`.
- AC5 No finding is only reported — test: `scripts/quality/check-files.test.mjs` (`finding-status`: fixed without its
  test, a task that does not cite the finding, a closed task, an accepted risk without the owner, a bare remark each
  fail) and `node scripts/quality/check-files.mjs docs/security/audit-2026-11-06/findings.md`.
- AC6 Every session starts with the reference — test: `scripts/quality/owasp.test.mjs` (the session context) and
  `scripts/quality/agent-settings.test.mjs` (the SessionStart hook runs `owasp.mjs session`).
- AC7 The audit's direct fixes detect — test: `src/__tests__/security/clientSinks.test.ts`,
  `src/modules/cms/lib/__tests__/sanitizeCmsHtml.security.test.ts`, `scripts/quality/db-catalog-audit.test.mjs`,
  `scripts/quality/cloudinary-config.test.mjs`.
- AC10 The OWASP cache keeps only what upstream holds at the pinned commit — test: `scripts/quality/owasp.test.mjs`
  (`gitBlobSha` equals `git hash-object`; a download whose blob SHA differs is refused and not written; a drifted cached
  file is downloaded again; a commit, sheet name, file name or blob id of another shape is refused before any request),
  and the CodeQL check of PR #19 lists no alert in `scripts/quality/owasp.mjs` or `cloudinary-config.mjs`: the race and the marker alerts close on the rescan, the four left by design are dismissed by
  decision D-CQ1, each with its comment (`gh api` code-scanning alerts, `state=open`, prints none for these paths; since Revision 1 (O963-1)
  #349 and #350 close as fixed, not dismissed).
- AC11 Withdrawn by owner decision O963-2 (2026-11-23, translated: "withdraw"; Review 1 F2): it was never built, and since A5 (2026-11-22) no product
  gate runs locally — test: `node scripts/check-surface-census-changed.mjs --verify-gate` (its 14 arms unchanged).
- AC12 A task under revision holds no change — test: `scripts/quality/owasp.test.mjs` (the task gate: a review whose verdict line
  says NEEDS REVISION and whose prose names APPROVED is not approved and the change fails G1; bold, older and two-review forms).
- AC13 CI runs on a named image (owner, 2026-11-08, translated: "yes, do AC13, pin ubuntu-24.04") — test:
  `gh run view <PR #19 run> --log` has no "does not support chromium" line, and
  `node --test scripts/quality/ci-secrets.test.mjs` (every job of `.github/workflows/` on `ubuntu-24.04`, a planted
  `ubuntu-latest` job refused; done 2026-11-08; the case restored there on 2026-11-14 by the owner's decision, Task 974).
- AC14 The census runs on the integration PR (O-CS1: limit 200) — test: `node scripts/check-surface-census-changed.mjs
  --verify-gate` arms 13 and 14: 65 mapped surfaces pass the default limit and are all censused, 201 fail closed with
  `surface-limit-exceeded` (arm 13 red on the limit of 60, arm 14 red with the limit check disabled; both measured
  2026-11-08).
- AC15 Every version a lockfile change brings in is at least 14 days old, transitive ones included (from the Task 939
  review 1: `ws@8.22.2` entered the lockfile three hours after its release, and `change-report.mjs` aged only direct
  dependencies) — test: `scripts/quality/change-report.test.mjs` (`newLockfileVersions`, `youngLockfileVersions`: nested
  and aliased entries counted once, a 0-day and a 6-day version refused, an exact `overrides` pin reported, not refused; `isNpmName`: a crafted lockfile name never reaches `npm view`;
  red with the age check disabled, with nested entries skipped and with the name check removed, measured 2026-11-08); done by Opus 2026-11-08.
- AC16 Withdrawn by D974-1 (2026-11-14): `ac-tests.mjs` was deleted; the reviewer compares the criteria with the diff
  — test: `node scripts/quality/change-report.mjs main HEAD` (the change report keeps the untested-code rule).
- AC17 The locale-leak gate fails closed when started through a symlinked path (Task 939 review 2: its entry-point guard
  compared `argv[1]` as typed with the real path, skipped the scan and exited 0) — test:
  `scripts/__tests__/check-locale-leak.test.ts` ("entry point": own path and a junction both reach the flag check, exit 1;
  red before the fix, `expected +0 to be 1`, measured 2026-11-09); done by Opus 2026-11-09.
- AC18 The locale-leak gate decides "am I the entry point" by `isEntryPoint` of `scripts/lib/entry-point.mjs` (the AC17
  fault; the 12 guards of `scripts/quality/` were moved to it by Opus 2026-11-09, the other 22 scripts are Task 951
  AC11, and the meta-test that pinned all of them was deleted by owner decision D974-1, 2026-11-14) — test:
  `scripts/__tests__/check-locale-leak.test.ts` ("entry point").
- AC8 `node --test "scripts/quality/*.test.mjs"`, `node scripts/quality/check-files.mjs --all`, `npm run lint` and
  `npx vitest run src/__tests__/security/clientSinks.test.ts src/modules/cms/lib/__tests__/sanitizeCmsHtml.security.test.ts`
  exit 0.

## Route

1. The reviewing Opus session reads this kickoff, `flow.md` and `secure-code-review.md`; runs `owasp.mjs sync`, `check`.
2. AC1-AC8 and AC10-AC12 on the branch (AC9 was deleted with its stop hook by D974-1); for AC1, AC2, AC4 and AC5 one
   deliberate break each (a quote changed, a review verdict removed, a planted sink, a finding status cleared), shown
   failing, then restored.
3. Review written here with its OWASP review record; `node scripts/quality/owasp.mjs gate --base main` then names what the
   other Sprint 93 reviews still have to cover before PR #19 can merge.

## Review

- [Review 1 — NEEDS REVISION](../../docs/reviews/Task_963_Review_1.md)
- [Review 2 — NEEDS REVISION](../../docs/reviews/Task_963_Review_2.md)
- [Review 3 — APPROVED](../../docs/reviews/Task_963_Review_3.md)
