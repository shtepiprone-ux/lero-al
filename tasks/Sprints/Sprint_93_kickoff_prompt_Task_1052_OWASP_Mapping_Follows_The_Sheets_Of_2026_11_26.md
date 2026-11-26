# Task 1052 — The OWASP mapping follows the cheat sheets published on 2026-11-26, and `main` CI is green again

Sprint 93. Priority P1 (`main` CI is red at its first quality step; every pull request fails there until this task is
merged). Owner request 2026-11-26 (translated): "write the task, check the kickoff and give the prompt for the executor".
Implementer: Sonnet. Reviewer: Opus. Human owner of the change: the owner.

## Goal

The OWASP Cheat Sheet Series published new versions of three sheets and one new sheet on 2026-11-26, so the step "OWASP
reference — upstream equals the committed registry" fails on `main` (run 45786338194, the merge of PR #80) and on every
pull request. After the task the committed registry equals upstream, the four sheets are mapped at their current
version, and `owasp.mjs sync --verify` and `owasp.mjs check` exit 0.

## Cause

`gh run view 45786338194 --log-failed` → "owasp sync: upstream differs from docs/security/owasp/sheets.json", "changed:
Choosing_and_Using_Security_Questions" (step `.github/workflows/ci.yml:46-49`). The executor's sync of the first design
(upstream `12b537502674`, two sheets) stopped as `BLOCKED` on a later upstream commit, so this design was rewritten.
On 2026-11-26 `node scripts/quality/owasp.mjs sync` → "141 sheets at 6b409f08d753", then O3 for `Choosing_and_Using_Security_Questions`, `Kubernetes_Security`,
`Session_Management` and O2 "Secure_Application_Development sheet not mapped" (the check at `scripts/quality/owasp.mjs:256-258`).
The mapping holds `reviewedSha` `832f6e332b89c918681064b2d327a1239ed897b8` (`docs/security/owasp/controls.json:365`),
`ecccad98012ef080b90b5087a6a571eb309d8532` (`:1163`) and `a9eb4ecb8b60fc159151c00086938489bcbee6f0` (`:1963`), and no
entry for `Secure_Application_Development`.
What changed upstream (Opus, 2026-11-26), `gh api repos/OWASP/CheatSheetSeries/git/blobs/<old sha>` → the old sheet
text (156, 739 and 463 lines), compared line by line with `.cache/owasp/<sheet>.md`:
- `Choosing_and_Using_Security_Questions`, line 5 only: the warning cites NIST SP 800-63B-4 sec 3.1.1.2 instead of SP
  800-63B sec 5.1.1.2. Still not applicable: the product uses no security question (`controls.json:363-364`).
- `Kubernetes_Security`, lines 79-100: "Securing the Kubernetes Dashboard" becomes "Securing Cluster Web UIs" (the
  Dashboard is archived; remove it or use a maintained UI). Still not applicable: no cluster (`controls.json:1161-1162`).
- `Session_Management`, lines 73 and 75 only: the RFC references (RFC 3986; RFC 6265, which "obsoletes RFC 2965"). No
  requirement added or removed; both mapped quotes (`controls.json:1953-1961`) are still in the text.
- `Secure_Application_Development` (new, 142 lines, read in full): an index; each section names a domain, its OWASP Top
  10:2025 categories and "Relevant OWASP Cheat Sheets". It states no requirement of its own; each of its 45 linked
  sheets has its own entry in `controls.json` (node check of every `](<Name>_Cheat_Sheet.md)` link → 0 not mapped).
  Mapped like `Access_Control` (`"applies": false`, a page that only points to mapped sheets).
Fix: the registry rewritten by `owasp.mjs sync`; the three `reviewedSha` set to the new blobs and `reviewedOn` to
2026-11-26; one new not-applicable entry; no requirement, trigger or applicability changes.

## Scope

- `docs/security/owasp/sheets.json`: written by `node scripts/quality/owasp.mjs sync`, never by hand (already
  uncommitted in the working tree, the output of the syncs; the executor's sync writes it again).
- `docs/security/owasp/controls.json`, each value exactly:
  - `Choosing_and_Using_Security_Questions` (`:365-366`): `reviewedSha` `cec0c1d2aecaf3dc6c49595d925f0b4246b3e416`,
    `reviewedOn` `2026-11-26`;
  - `Kubernetes_Security` (`:1163-1164`): `reviewedSha` `befe4915a81f5d8bef5edc1b5fd33070f2385610`, `reviewedOn`
    `2026-11-26`;
  - `Session_Management` (`:1963-1964`): `reviewedSha` `6d5502e5f8fd8677a61f2bd2101fb5b04582b0d8`, `reviewedOn`
    `2026-11-26`;
  - new entry right after `Secure_AI_Model_Ops` (`:1805-1810`), before `Secure_Cloud_Architecture`, in the file's
    indentation: `"Secure_Application_Development": { "applies": false, "why": "an index page that only points to
    other cheat sheets, each of which is mapped on its own", "reviewedSha": "f744b70c5bb0ac1426f68e884070051ef7d0ed1d",
    "reviewedOn": "2026-11-26" }`.
- Dependencies: none.
- Out of scope: the OWASP tool and its tests (unchanged); product code; the rule H1a of
  `.claude/rules/checklists/handoff.md`, its `flow.md` row, the `docs/backlog.md` rows of 1047 and 1052, and the archive
  of Task 1047, written by Opus and carried in this branch as documentation (checklist H1); a sheet that changes
  upstream after this design (the executor stops, Route step 3; the reviewer syncs again, V1; the handoff runs H1a).
- Kept as on `main` (checklist A2): `controls.json` keeps every other sheet and, for the three changed ones, `applies`,
  `why`, `triggers` and `requirements` unchanged; `sheets.json` keeps the shape the tool writes.

## Attack surface

Unchanged: the task changes the OWASP registry and four entries of the mapping; no code, configuration, route, policy or
dependency changes.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (registry at `6b409f08d753`).

- AI_Agent_Security: not applicable — the carried rule H1a only adds a read-only `owasp.mjs sync --verify` before handed commands; no tool permission, hook or setting changes.
- LLM_Prompt_Injection_Prevention: not applicable — no prompt, tool boundary or text an agent reads as an instruction changes; the sheet texts stay data checked by the tool.
- MCP_Security: not applicable — no MCP server, its permissions or its tool descriptions are added, changed or used by this task.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — the upstream sheet texts are data: the tool checks every mapped quote against the cached sheet; the executor writes only the values this kickoff names — AC2.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns every command of the criteria; CI is read from GitHub — AC1, AC2, AC3, AC4.

## UI

No visible change.

## Mobile adaptation record

- Scope: none

## Acceptance criteria

- AC1 Upstream equals the committed registry — test: `node scripts/quality/owasp.mjs sync --verify` exits 0.
- AC2 Every sheet is mapped at its current version, every quote is in its sheet and every control holds its evidence —
  test: `node scripts/quality/owasp.mjs check` exits 0.
- AC3 The OWASP tool's tests pass, the mapping test included — test: `node --test scripts/quality/owasp.test.mjs` exits 0.
- AC4 CI passes, the step "OWASP reference — upstream equals the committed registry" included — test: `gh pr checks <n>`
  after every check concluded.

## Route

1. Work on `task/1052-owasp-remap`, created by the owner from `main` (checklist H1); Opus's uncommitted documentation and
   rules stay as they are (checklist I1); `docs/security/owasp/sheets.json` is uncommitted already and is in the Scope.
2. Tests first: `node scripts/quality/owasp.mjs check` on the unchanged mapping → exit 1 with three O3 and one O2; save
   the output.
3. `node scripts/quality/owasp.mjs sync`; it must report upstream at `6b409f08d753` with nothing added, changed or
   removed beyond the four sheets of "## Cause"; anything else: stop and report `BLOCKED` (the mapping of a new change
   is Opus's design). Then write the values of "## Scope".
4. Run: `node scripts/quality/owasp.mjs sync --verify`; `node scripts/quality/owasp.mjs check`;
   `node --test scripts/quality/owasp.test.mjs`; `node scripts/quality/check-files.mjs docs/security/owasp/controls.json
   docs/security/owasp/sheets.json`. No code file changes, so no typecheck and no ESLint. CI runs only on GitHub after
   the owner's push and is read with `gh pr checks <n>` (checklist A5).
5. Deliberate breaks (I9), each restored: one changed `reviewedSha` set back to its old value → `owasp.mjs check` exits
   1 with O3; the new `Secure_Application_Development` entry removed → exits 1 with O2.
6. Report: each command, exit code, relevant output; the failing run of step 2; the output of both breaks.

## Review

- [Review 1 — APPROVED](../../docs/reviews/Task_1052_Review_1.md)
