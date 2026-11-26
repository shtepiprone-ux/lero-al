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

## Revision 1

Owner, 2026-11-26 (translated): "yes, add" — the OAuth2 remap goes into this task (checklist H1a). After Review 1 and the
green CI of PR #81 (run 45794505047), H1a's `node scripts/quality/owasp.mjs sync --verify` → "141 sheets at
7eb130bc64f5; 1 downloaded; added 0, changed 1, removed 0", "changed: OAuth2", exit 1; so no merge command was handed.
What changed (Opus, 2026-11-26): `gh api repos/OWASP/CheatSheetSeries/git/blobs/765d6e48772e36bc5e82c8a1452c2c6af665565b`
→ the old text (100 lines), `diff` with `.cache/owasp/OAuth2.md` (112 lines): a new section "Device Authorization Grant
and Cross-Device Flows" (items 17-21, RFC 8628 and RFC 10027); the old items 17-19 renumbered 22-24 with the same text; two
references added. The product offers no device or cross-device flow: `grep -rniE "device_code|device
authorization|verification_uri|grant-type:device|oauth_server|user_code" src supabase` → no output; it signs in with Google
as an OAuth client only. The mapped quote is still in the text (`grep -c` → 1). The entry holds `reviewedSha`
`765d6e48772e36bc5e82c8a1452c2c6af665565b` (`docs/security/owasp/controls.json:1561`).

- R1-1 `docs/security/owasp/controls.json`, `OAuth2` (`:1561-1562`): `reviewedSha` `11e383b988e14b6e5cd7946953d3694ee8a30649`,
  `reviewedOn` `2026-11-26`; `applies`, `triggers` and `requirements` unchanged. `docs/security/owasp/sheets.json` written by
  `owasp.mjs sync` at upstream `7eb130bc64f5` (already uncommitted in the working tree; the executor's sync writes it again).
  Test: AC1, AC2, AC3 as above.

Route of the revision: start from `cfa0613d3` (the reviewed and pushed tree); Opus's uncommitted files (`docs/backlog.md`,
this kickoff, the Task 1053 kickoff, `docs/security/owasp/sheets.json`) stay as they are. (1) `node scripts/quality/owasp.mjs
check` → exit 1 with one O3 for `OAuth2`; save it. (2) `node scripts/quality/owasp.mjs sync`: upstream `7eb130bc64f5`, only
`OAuth2` changed; anything else: stop and report `BLOCKED`. (3) Write R1-1. (4) Run step 4 of the Route with the same
commands. (5) Break: `reviewedSha` of `OAuth2` set back to `765d6e48…` → `owasp.mjs check` exits 1 with O3; restored.
(6) Report as step 6.

## Revision 2

Owner, 2026-11-26 (translated): "yes, add". After Review 2 and the push of `2bdcb8de4`, the CI job "Lint, types and product
checks" of PR #81 (job 139837094531) failed at "OWASP reference — upstream equals the committed registry": "141 sheets at
686a406e4d79; … changed: Multi_Tenant_Security". Upstream commit `686a406e4d79` "docs: simplify tenant identification and
context management (#3016)" is dated 2026-11-26T10:11:39Z (`gh api repos/OWASP/CheatSheetSeries/commits/686a406e4d79`), after
the handoff's H1a (upstream `7eb130bc64f5`, nothing changed) and after the commit `2bdcb8de4`.
What changed (Opus, 2026-11-26): `gh api repos/OWASP/CheatSheetSeries/git/blobs/f2116329213cc51dcfe13f5273a42b4b84fe5f82` →
the old text (393 lines), `diff` with `.cache/owasp/Multi_Tenant_Security.md` (357 lines), five hunks: one added line
"Query parameterization prevents injection but does not enforce tenant isolation; tenant authorization and tenant-scoped
queries are still required." and the code example shortened (the bad example removed, the good one condensed: verified
claims select the tenant, membership checked, fail closed). No requirement the product does not already meet: tenant
isolation is RLS on the request paths, mapped by "Do Not Use an RLS-Bypassing Role for Tenant-Scoped Request Paths". The
four mapped quotes are in the new text (`owasp.mjs check` reports only the O3). The entry holds `reviewedSha`
`f2116329213cc51dcfe13f5273a42b4b84fe5f82` (`docs/security/owasp/controls.json:1385`).
The executor's sync stopped as `BLOCKED`: upstream `4395341e58fd` (#3022, 10:16:08Z) changed `AI_Agent_Security` (e70913f9 →
07cd1f4a). `diff` of the old blob (604 lines) with the cache (626): a new section "Running Git in Repository-Controlled
Workspaces" (Git runs programs named by repository configuration; a nested bare repository escapes a rule on `.git/` only)
with four requirements; the two mapped quotes unchanged. Met in part: `.claude/settings.json:136-137` deny `Edit(./.git/**)`
and `Write(./.git/**)` only; no sandbox, read-only Git on the host (`checklists/common.md` A8). The gap is Task 1065 (A4),
filed in `docs/backlog.md`; the four requirements are handed to it.

- R2-1 `docs/security/owasp/controls.json`, `Multi_Tenant_Security` (`:1385-1386`): `reviewedSha`
  `0c4efa28621da5080a7de2eedadae44e7ef98976`, `reviewedOn` `2026-11-26`; `applies`, `triggers` and `requirements` unchanged.
  Test: AC1, AC2, AC3 as above.
- R2-2 `docs/security/owasp/controls.json`, `AI_Agent_Security` (`:43-56`): `reviewedSha`
  `07cd1f4acbc9af938feddc01cb3472d30e7a4304`, `reviewedOn` `2026-11-26`; after the two existing requirements, four new ones,
  each exactly `{ "quote": "<quote>", "task": "1065" }` in the file's indentation, in this order:
  "Run Git in untrusted workspaces, including any the agent can write to, inside the agent's sandbox, not on the host.";
  "Do not auto-approve any Git command, including";
  "Require approval before the agent's file tools write to";
  "Check the path as the file system resolves it, including symlinks, letter case, and Windows short names.".
  `applies`, `triggers` and the two existing requirements unchanged. Test: AC1, AC2, AC3 as above.
- `docs/security/owasp/sheets.json` written by `owasp.mjs sync` at upstream `4395341e58fd` (already uncommitted; the
  executor's sync writes it again).

Route of the revision: start from `2bdcb8de4` (reviewed and pushed); Opus's uncommitted files (this kickoff,
`docs/backlog.md`, `docs/security/owasp/sheets.json`) stay as they are. (1) `node scripts/quality/owasp.mjs check` → exit 1
with O3 for `AI_Agent_Security` and `Multi_Tenant_Security`; save it. (2) `node scripts/quality/owasp.mjs sync`: upstream
`4395341e58fd`, nothing changed beyond the two sheets; anything else: stop and report `BLOCKED`. (3) Write R2-1 and R2-2.
(4) Run step 4 of the Route with the same commands. (5) Breaks, each restored: `reviewedSha` of `Multi_Tenant_Security` set
back to `f2116329…` → `owasp.mjs check` exits 1 with O3; the `task` of one new `AI_Agent_Security` requirement set to `9999`
→ exits 1 with O7. (6) Report as step 6.

## Revision 3

Owner, 2026-11-26 (translated): "let us try the review and the push again". Revision 2 done, unreviewed; Opus's V1 sync →
upstream `5254440ecf1a` "New CS: Server-Side Document and Media Rendering Cheat Sheet (#3038)" (10:28:59Z), added 1, changed 2.
Old blobs (`gh api .../git/blobs/<sha>`) diffed with `.cache/owasp/`: `File_Upload` (fff26e97 → 31e92fab) line 113 only and
`Server_Side_Request_Forgery_Prevention` (69c84db0 → f87d54ae) one added line 14, each a pointer to the new sheet, no
requirement added or removed. The new sheet (66 lines, read in full) covers a server that converts user content with an engine
(wkhtmltopdf, headless Chromium, ImageMagick, FFmpeg, LibreOffice …); the product runs none: no import of `sharp`, `puppeteer`,
a PDF library, `satori` or `next/og` in `src` outside tests (Grep → no match); photos are compressed in the browser
(`package.json:165`), Cloudinary transforms run at the provider, `playwright` (`package.json:225`) runs only CI checks.
- R3-1 `docs/security/owasp/controls.json` `File_Upload` (`:825-826`): `reviewedSha` `31e92fabd2fe7b5c326d515ecbf99d8ca5ac2e52`,
  `reviewedOn` `2026-11-26`. R3-2 `Server_Side_Request_Forgery_Prevention` (`:1914-1915`): `reviewedSha`
  `f87d54aeb47bea85bf28c3aa7e9de570a9664b9e`, `reviewedOn` `2026-11-26`. Nothing else in either entry.
- R3-3 new entry after `Secure_Product_Design` (`:1875-1893`), in the file's indentation: `"Server_Side_Document_and_Media_Rendering":
  { "applies": false, "why": "the server converts no user content with a rendering engine: photos are compressed in the
  browser, Cloudinary transforms run at the provider, and no PDF, image, video or office engine runs in the app",
  "reviewedSha": "b96b84420a3064c79b999df27fb27a1c1bfa17e4", "reviewedOn": "2026-11-26" }`. `sheets.json` by `owasp.mjs sync`.
  Test: AC1, AC2, AC3.

Route: start from `2bdcb8de4`; Revision 2's changes and Opus's files stay. (1) `owasp.mjs check` → exit 1, two O3 and one O2;
save. (2) `owasp.mjs sync`: upstream `5254440ecf1a`, nothing beyond these three, else `BLOCKED`. (3) R3-1 to R3-3. (4) Route
step 4. (5) Breaks, restored: new entry removed → O2; `File_Upload` back to `fff26e97…` → O3. (6) Report as step 6.

## Review

- [Review 1 — APPROVED](../../docs/reviews/Task_1052_Review_1.md)
- [Review 2 — APPROVED](../../docs/reviews/Task_1052_Review_2.md)
- [Review 3 — APPROVED](../../docs/reviews/Task_1052_Review_3.md)
