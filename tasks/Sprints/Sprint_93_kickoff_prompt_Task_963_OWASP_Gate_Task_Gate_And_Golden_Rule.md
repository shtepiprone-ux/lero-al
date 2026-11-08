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
- `scripts/quality/agent-check.mjs` (+ test): SessionStart re-reads upstream after a day and puts the reference's
  state, findings first, into the session. Owner decision 2026-11-08 (translated: "put it into 963 and do it"), found
  in the Task 952 review 2: the stop stamped a file by size and mtime (`agent-check.mjs:143` before), so a byte-exact
  restore after a deliberate break blocked three times, and after the third block it deleted the session state
  (`:226` before), so the next stop judged every uncommitted file of the branch. Now a file is stamped by its size and
  content hash (`readRegularFile`, one descriptor), and the limit releases the stop with the baseline kept.
- `scripts/quality/audit-coverage.mjs` (+ test): lane `owasp-reference`.
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
- `.github/workflows/ci.yml` (+ `scripts/quality/ci-workflow.test.mjs`): the quality job's `sync --verify` and `check`
  steps; the `owasp-gate` job, required by `CI Required`.
- Rules and skills: `CLAUDE.md` (golden rule), `.claude/rules/flow.md` (golden rule, the OWASP chain),
  `.claude/rules/quality-gates.md`, `.claude/rules/kickoff-template.md`, `.claude/rules/secure-code-review.md`,
  `.claude/skills/create-task/SKILL.md`, `.claude/skills/review-task/SKILL.md`, `.claude/skills/execute-task/SKILL.md`.
- The audit's direct fixes: `src/__tests__/security/clientSinks.test.ts` (T-03),
  `src/modules/cms/lib/__tests__/sanitizeCmsHtml.security.test.ts` and the four `messages/*.json` captions (T-04),
  `scripts/quality/db-catalog-audit.mjs` and `scripts/quality/cloudinary-config.mjs` (G-01), the ledgers
  `docs/security/audit-2026-11-06/findings.md` and `coverage.md`.
- Dependencies: none (Node built-ins; the ICU parser next-intl already ships).
- Out of scope: product fixes of the findings (Tasks 949-962 carry them).

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
- Cryptographic_Storage: not applicable — the stop hook's content hash only detects a changed file; it stores no secret or password.
- Cross_Site_Scripting_Prevention: "Since no single technique will solve XSS, using the right combination of defensive techniques will be necessary to prevent XSS." — locale values, client sinks and the CMS sanitizer are each checked at every write — AC4, AC7.
- DOM_Clobbering_Prevention: "Robust HTML sanitizers can prevent or restrict the risk of DOM Clobbering." — the evasion vectors include form, base and meta tags, and the sanitizer must remove each — AC7.
- DOM_based_XSS_Prevention: "It is always a bad idea to use a user-controlled input in dangerous sources such as eval." — client-sinks K1-K8 run on each product file at its write — AC4.
- Denial_of_Service: not applicable — the product's request paths are unchanged; cloudinary-config.mjs only reads the upload presets once.
- File_Upload: not applicable — cloudinary-config.mjs reads the presets read-only; the upload paths change in Task 957.
- GitHub_Actions_Security: "Always set permissions: {} at the workflow level to disable all permissions by default." — the new job reads contents only, holds no secret, and takes the base SHA through env — AC2.
- HTTP_Strict_Transport_Security: not applicable — the scripts are HTTP clients of fixed hosts; no response header of the site changes.
- Injection_Prevention: "the values for commands and the relevant arguments should be both validated" — owasp.mjs runs git with an argument array and a base ref from CI's env, never a shell string — AC2.
- JavaScript_and_TypeScript_Security: "Keep patterns linear: avoid nested quantifiers and ambiguous alternation over the same characters." — the trigger and rule patterns are flat alternations over fixed words — AC1.
- Key_Management: not applicable — the content hash of the stop hook uses no key; nothing is signed or encrypted.
- LLM_Prompt_Injection_Prevention: "Enforce permissions and parameter validation at the tool boundary" — a sheet text, a kickoff or a review is data the tools check; none is run or followed as an instruction — AC1, AC3.
- MCP_Security: not applicable — no MCP server is added or configured; Task 961 watches the tool definitions.
- OS_Command_Injection_Defense: "The primary defense is to avoid calling OS commands directly." — owasp.mjs starts only git and node, with fixed argument arrays and no shell — AC2.
- Secrets_Management: "prevent them from leaking and compromising the organization" — the Cloudinary credentials read by `cloudinary-config.mjs` are sent to `https://api.cloudinary.com` only, refused for any other host — AC10.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — the review reads the whole diff of the governance files and reruns every check — AC8.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — an agent's citation of a sheet counts only when the tool finds the quote in the sheet — AC1, AC3.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — every gap the mapping found became a task with tested criteria (959, 954, 955, 960, 961, 962) — AC5.
- Software_Supply_Chain_Security: "limit the applications dependencies to a specific version that has been previously verified as legitimate and secure" — the reference itself is pinned by its upstream commit and per-sheet hashes; the new job pins every action by SHA — AC1, AC2.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — the attack surface section answers them for the governance path — AC1-AC6.
- Transport_Layer_Security: not applicable — the scripts call fixed `https:` hosts through Node's default TLS; no server TLS setting changes.
- User_Privacy_Protection: not applicable — no personal data is read or stored; cloudinary-config.mjs reads preset settings only.
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
  and no review judged fails; a version-only dependency update passes, a new script or workflow step does not) and
  `scripts/quality/ci-workflow.test.mjs` (the `owasp-gate` job: never skipped, base through `env`, no secret).
- AC3 Every kickoff and review is held to the reference — test: `scripts/quality/check-files.test.mjs` (missing
  "## OWASP", an invented quote, the 200-line count without the checklist, a grandfathered kickoff) and
  `node scripts/quality/owasp.mjs kickoff tasks/Sprints/Sprint_93_*.md`.
- AC4 Locale data and product code are checked at every write — test: `scripts/quality/check-files.test.mjs` (a planted
  tag, scheme, plain http address and broken ICU value each fail; a sink and a bypassing call fail; tests are not
  product code), `scripts/quality/locale-safety.test.mjs`, `scripts/quality/client-sinks.test.mjs`.
- AC5 No finding is only reported — test: `scripts/quality/check-files.test.mjs` (`finding-status`: fixed without its
  test, a task that does not cite the finding, a closed task, an accepted risk without the owner, a bare remark each
  fail) and `node scripts/quality/check-files.mjs docs/security/audit-2026-11-06/findings.md`.
- AC6 Every session starts with the reference — test: `scripts/quality/agent-check.test.mjs` (the start hook's context).
- AC7 The audit's direct fixes detect — test: `src/__tests__/security/clientSinks.test.ts`,
  `src/modules/cms/lib/__tests__/sanitizeCmsHtml.security.test.ts`, `scripts/quality/db-catalog-audit.test.mjs`,
  `scripts/quality/cloudinary-config.test.mjs`, `scripts/quality/audit-coverage.test.mjs`.
- AC9 The stop judges content, and its limit does not widen the next check — test: `scripts/quality/agent-check.test.mjs`
  (a byte-exact restore with a new mtime is no change; a same-size edit with the old mtime put back is; after the third
  block the state stays, older work is not added and a remaining failure blocks again).
- AC10 The OWASP cache keeps only what upstream holds at the pinned commit — test: `scripts/quality/owasp.test.mjs`
  (`gitBlobSha` equals `git hash-object`; a download whose blob SHA differs is refused and not written; a drifted cached
  file is downloaded again; a commit, sheet name, file name or blob id of another shape is refused before any request),
  and the CodeQL check of PR #19 lists no alert in `scripts/quality/owasp.mjs`, `cloudinary-config.mjs` or
  `agent-check*.mjs`: the race and the marker alerts close on the rescan, the four left by design are dismissed by
  decision D-CQ1, each with its comment (`gh api` code-scanning alerts, `state=open`, prints none for these paths).
- AC8 `node --test "scripts/quality/*.test.mjs"`, `node scripts/quality/check-files.mjs --all`, `npm run lint` and
  `npx vitest run src/__tests__/security/clientSinks.test.ts src/modules/cms/lib/__tests__/sanitizeCmsHtml.security.test.ts`
  exit 0.

## Route

1. The reviewing Opus session reads this kickoff, `flow.md` and `secure-code-review.md`; runs `owasp.mjs sync`, `check`.
2. AC1-AC10 on the branch; for AC1, AC2, AC4 and AC5 one deliberate break each (a quote changed, a review verdict
   removed, a planted sink, a finding status cleared), and for AC9 three (mtime put back into the stamp, the stamp cut
   to the size, the state deleted at the limit), shown failing, then restored.
3. Review written here with its OWASP review record; `node scripts/quality/owasp.mjs gate --base main` then names what the
   other Sprint 93 reviews still have to cover before PR #19 can merge.

## Review
