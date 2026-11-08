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
  state, findings first, into the session.
- `scripts/quality/audit-coverage.mjs` (+ test): lane `owasp-reference`.
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
- CI_CD_Security: "Require pull requests to be reviewed before merging and ensure this review step cannot be bypassed." — the task gate requires an approved review in every change, and CI Required waits for it — AC2.
- Credential_Stuffing_Prevention: not applicable — no sign-in or credential path changes; the words came from the threat list.
- Cross_Site_Scripting_Prevention: "Since no single technique will solve XSS, using the right combination of defensive techniques will be necessary to prevent XSS." — locale values, client sinks and the CMS sanitizer are each checked at every write — AC4, AC7.
- DOM_Clobbering_Prevention: "Robust HTML sanitizers can prevent or restrict the risk of DOM Clobbering." — the evasion vectors include form, base and meta tags, and the sanitizer must remove each — AC7.
- DOM_based_XSS_Prevention: "It is always a bad idea to use a user-controlled input in dangerous sources such as eval." — client-sinks K1-K8 run on each product file at its write — AC4.
- Denial_of_Service: not applicable — the product's request paths are unchanged; cloudinary-config.mjs only reads the upload presets once.
- File_Upload: not applicable — cloudinary-config.mjs reads the presets read-only; the upload paths change in Task 957.
- GitHub_Actions_Security: "Always set permissions: {} at the workflow level to disable all permissions by default." — the new job reads contents only, holds no secret, and takes the base SHA through env — AC2.
- Injection_Prevention: "the values for commands and the relevant arguments should be both validated" — owasp.mjs runs git with an argument array and a base ref from CI's env, never a shell string — AC2.
- JavaScript_and_TypeScript_Security: "Keep patterns linear: avoid nested quantifiers and ambiguous alternation over the same characters." — the trigger and rule patterns are flat alternations over fixed words — AC1.
- LLM_Prompt_Injection_Prevention: "Enforce permissions and parameter validation at the tool boundary" — a sheet text, a kickoff or a review is data the tools check; none is run or followed as an instruction — AC1, AC3.
- MCP_Security: not applicable — no MCP server is added or configured; Task 961 watches the tool definitions.
- OS_Command_Injection_Defense: "The primary defense is to avoid calling OS commands directly." — owasp.mjs starts only git and node, with fixed argument arrays and no shell — AC2.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — the review reads the whole diff of the governance files and reruns every check — AC8.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — an agent's citation of a sheet counts only when the tool finds the quote in the sheet — AC1, AC3.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — every gap the mapping found became a task with tested criteria (959, 954, 955, 960, 961, 962) — AC5.
- Software_Supply_Chain_Security: "limit the applications dependencies to a specific version that has been previously verified as legitimate and secure" — the reference itself is pinned by its upstream commit and per-sheet hashes; the new job pins every action by SHA — AC1, AC2.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — the attack surface section answers them for the governance path — AC1-AC6.
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
- AC8 `node --test "scripts/quality/*.test.mjs"`, `node scripts/quality/check-files.mjs --all`, `npm run lint` and
  `npx vitest run src/__tests__/security/clientSinks.test.ts src/modules/cms/lib/__tests__/sanitizeCmsHtml.security.test.ts`
  exit 0.

## Route

1. The reviewing Opus session reads this kickoff, `flow.md` and `secure-code-review.md`; runs `owasp.mjs sync`, `check`.
2. AC1-AC8 on the branch; for AC1, AC2, AC4 and AC5 one deliberate break each (a quote changed, a review verdict
   removed, a planted sink, a finding status cleared), shown failing, then restored.
3. Review written here with its OWASP review record; `node scripts/quality/owasp.mjs gate --base main` then names what the
   other Sprint 93 reviews still have to cover before PR #19 can merge.

## Review
