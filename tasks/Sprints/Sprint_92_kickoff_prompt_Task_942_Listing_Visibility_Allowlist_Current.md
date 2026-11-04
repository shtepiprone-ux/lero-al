# Task 942 — The listing-visibility gate allowlist matches the reviewed contact-event rule

Sprint 92. P1. QA profile **Q1** (non-UI gate code and its tests, `docs/qa-profiles.md`). Kickoff by Opus, 2026-11-01. Published
on PR #12 (D7) as the policy half of the red Governance Check job (D8); the product half is Task 937. **Revision 1 (2026-11-03,
by the Task 944 design session, D14):** the AC2 break runs through `cli.mjs sensitivity` from a saved break spec, never as an edit
of the live gate (D17, C39); this task starts only after Task 944 is reviewed and committed. Nothing else changed.
**Revision 2 (2026-11-04, by the Task 944 review 3 session, D14, D20):** that review found six groups of shell write forms
outside the Task 944 AC12 list that the hook reports nothing for (C40–C46), which an executor can run unrefused (C47) and which
Task 943 says go to a revision when found (C48). The owner chose to approve 944 and write them into this task, as D18 did for 943
(D20, under D13). R4, R5, AC6, AC7, the case GOV-942-HOOK-SHELL-FORMS-DENY and C40–C53 are added; sections 1–7, R3, AC5 and the
security contract are amended. R1–R3 and the other four cases keep their meaning.
**Revision 3 (2026-11-04, by the Task 944 review 4 session, D13, D14, under the route of D20):** the self-audit of that review found
four more spellings of the Task 944 R8 (c) API forms that the hook reports nothing for (C54–C57), which an executor can run unrefused
(C58). R4 (f), its AC6 list and C54–C59 are added, and the case input of GOV-942-HOOK-SHELL-FORMS-DENY names the second list.

## 1. Mode, task type and rule bundle

Governance task. **Implementer: Opus, in a fresh implementation session started for this task (D1); Sonnet does not execute it**,
because the gate script and the hook are policy paths (C25) and a product contract refuses policy paths (C26). **Approver: Opus, in
another fresh session that wrote none of the scope files (D2).** Neither may be the session that designed this kickoff or the
session that wrote revision 2 (the Task 944 review 3 session) or revision 3 (the Task 944 review 4 session). Types
(`docs/rule-index.md`): workflow gates / governance tooling. Bundle: `.claude/rules/shared/workflow-gates.md` with
`workflow-contract.md`, `workflow-evidence.md`, `workflow-ci.md`, `git-publication.md`; `security-testing.md`;
`role-boundaries.md`; `claim-evidence-contract.md`; `task-readiness.md`; `orchestration-state.md`;
`.claude/rules/review/03-decision-closure.md`.

## 2. Objective

On PR #12 the listing-visibility gate fails with three issues (C1): two stale allowlist entries and one inline literal, the
contact-event lookup's `.eq('status', 'active')` (C2). Reproduced locally (C3, C4). The literal is the reviewed Task 923 rule:
only an active listing of a live owner has a contact card (C5, C6, C7). Routing it through `applyPublicVisibility` would add an
expiry filter (C11) that the detail page showing the contact card does not apply (C8, C9, C10), so a listing the page shows would
refuse its contact tap. The fix is therefore the allowlist, not the product: the contact-event entry gets the current fingerprint
and the stale detail-page entry goes, because that page now reads statuses through a constant the detector cannot see (C9). After
this task the gate passes on the current tree with 8 entries and 0 stale (C19), the detector self-test stays 34/0 (C20), and the
allowlist and its stale check are proven by named self-tests.

Revision 2: the hook also reports the write forms of R4 (C40–C46), so the independence check counts them and the pre-write guard
decides on them. The hook stays list-based, and CI's policy-diff check (C24) stays the outer layer.

## 3. Verified context

The allowlist pins path and fingerprint together (C12) and stale entries fail the gate (C13); the two stale rows are the old
contact-event fingerprint (C14) and the detail page (C15). The detector is exported (C16), but the module prints and scans at
top level (C17) and computes stale entries inline (C18), so a self-test cannot import it without running the scan; the guarded
main idiom already exists in the gate tree (C31). An executed probe on a copy of the gate with exactly the planned allowlist shows
the strict run passing (C19), the detector self-test unchanged (C20) and the allowed literal still reported in any other file
(C21). The pre-write guard refuses a Sonnet edit of the gate and allows Opus (C22, C23, C38); CI refuses a changed gate script
that no governance contract scopes (C24). CI runs both gate modes (C33, C34) through the package scripts (C35). No task contract
and no publication-manifest entry names the gate script (C36), so R1 and R2 stale no reviewed contract; the hook change of R4 does,
for the five contracts that scope it (C52), which R5 rebases; the manifest check is not
a CI gate (C32), so neither new self-test is added to `publication.json` (that file is a scope file of reviewed contracts). A
prototype of R4 on a copy of the hook reports every form, refuses each executor form and keeps every read control silent (C49);
the nine hook-importing self-tests pass against it unchanged (C51); over the frozen corpus it drops no target and adds no guarded
target, executor refusal or governance scope file (C50), and the 5000-folder-change commands stay under 15 s (C53). A
governance contract needs hook and CI cases (C27) in a `scripts/workflow-gates/<name>.selftest.mjs` file (C28) that the runner
discovers by name (C30), and an Opus implementation role (C29). Design HEAD: C37 (the later commit `01b8259fa` records only the
Task 940 approval and changes none of the cited files).

## Claim ledger

| ID | Status | Claim | Evidence |
|---|---|---|---|
| C1 | FACT | On PR #12 the listing-visibility gate fails with three issues. | source: `docs/sessions/evidence/task937/design/l00-ci-excerpts.txt:30-30`; observed: `❌ 3 issue(s) — gate FAILED.` |
| C2 | FACT | The reported literal is the contact-event lookup at line 58. | source: `docs/sessions/evidence/task937/design/l00-ci-excerpts.txt:28-28`; observed: `src/modules/listings/actions/contactEvents.ts:58  .eq('status', 'active')` |
| C3 | FACT | The failure reproduces locally (executed). | source: `docs/sessions/evidence/task942/design/p01-gate-local.txt:15-15`; observed: `❌ 3 issue(s) — gate FAILED.` |
| C4 | FACT | Two of nine allowlist entries are stale locally (executed). | source: `docs/sessions/evidence/task942/design/p01-gate-local.txt:2-2`; observed: `Allowlist: 9 entries, 2 stale.` |
| C5 | FACT | The contact-event lookup filters by active status. | source: `docs/sessions/evidence/task942/design/sources/src__modules__listings__actions__contactEvents.ts.txt:58-58`; observed: `.eq('status', 'active')` |
| C6 | FACT | The lookup's comment cites the reviewed Task 923 rule. | source: `docs/sessions/evidence/task942/design/sources/src__modules__listings__actions__contactEvents.ts.txt:52-52`; observed: `Only an ACTIVE listing of a LIVE owner has a contact card to tap (Task 923 R66 (f), owner F2)` |
| C7 | FACT | Task 923 R66 (f) requires active status for the contact-event action. | source: `docs/sessions/evidence/task942/design/sources/task923-kickoff-R66-row.txt:2-2`; observed: `the contact-event action accept only` |
| C8 | FACT | The detail page reads by status through a constant. | source: `docs/sessions/evidence/task942/design/sources/src__app___locale___listings___slug___page.tsx.txt:165-165`; observed: `.in('status', PUBLIC_LISTING_STATUSES)` |
| C9 | FACT | The detail page's status set is a named constant. | source: `docs/sessions/evidence/task942/design/sources/src__app___locale___listings___slug___page.tsx.txt:47-47`; observed: `const PUBLIC_LISTING_STATUSES = ['active', 'sold', 'rented']` |
| C10 | FACT | The detail page applies no expiry filter and no applyPublicVisibility (executed count). | source: `docs/sessions/evidence/task942/design/p05-detail-page-expiry.txt:2-2`; observed: `count: 0` |
| C11 | FACT | applyPublicVisibility adds an expiry filter. | source: `docs/sessions/evidence/task942/design/sources/src__modules__listings__lib__visibility.ts.txt:127-127`; observed: `q = q.gte('expires_at', new Date().toISOString())` |
| C12 | FACT | An allowlist entry matches only its own path and fingerprint. | source: `docs/sessions/evidence/task937/design/sources/scripts__check-listing-visibility.mjs.txt:68-68`; observed: `return ALLOWLIST.some(e => norm === e.path && matchedText.includes(e.fingerprint));` |
| C13 | FACT | Stale allowlist entries fail the gate. | source: `docs/sessions/evidence/task937/design/sources/scripts__check-listing-visibility.mjs.txt:47-47`; observed: `Stale entries FAIL the gate.` |
| C14 | FACT | The contact-event entry pins the old multi-status fingerprint. | source: `docs/sessions/evidence/task937/design/sources/scripts__check-listing-visibility.mjs.txt:60-60`; observed: `path: 'src/modules/listings/actions/contactEvents.ts', fingerprint: ".in('status', ['active', 'sold', 'rented', 'archived'])"` |
| C15 | FACT | The allowlist has a detail-page entry. | source: `docs/sessions/evidence/task937/design/sources/scripts__check-listing-visibility.mjs.txt:56-56`; observed: `path: 'src/app/[locale]/listings/[slug]/page.tsx'` |
| C16 | FACT | The detector is an exported pure function. | source: `docs/sessions/evidence/task937/design/sources/scripts__check-listing-visibility.mjs.txt:206-206`; observed: `export function detectVisibilityViolations(source, filePath) {` |
| C17 | FACT | The module prints its scope line at top level, before the scan. | source: `docs/sessions/evidence/task937/design/sources/scripts__check-listing-visibility.mjs.txt:359-359`; observed: `console.log(SCOPE_LINE);` |
| C18 | FACT | The stale check is computed inline at top level. | source: `docs/sessions/evidence/task937/design/sources/scripts__check-listing-visibility.mjs.txt:409-409`; observed: `const staleEntries = ALLOWLIST.filter(entry => {` |
| C19 | FACT | With the planned allowlist the strict gate passes on the current tree (executed). | source: `docs/sessions/evidence/task942/design/p02-planned-allowlist-probe.txt:5-5`; observed: `Allowlist: 8 entries, 0 stale.` |
| C20 | FACT | With the planned allowlist the detector self-test is unchanged (executed). | source: `docs/sessions/evidence/task942/design/p02-planned-allowlist-probe.txt:7-7`; observed: `Self-test: 34 passed, 0 failed` |
| C21 | FACT | The allowed literal is still reported in another file (executed). | source: `docs/sessions/evidence/task942/design/p02-planned-allowlist-probe.txt:8-8`; observed: `{"allowed":0,"other":["5 .eq('status', 'active')"]}` |
| C22 | FACT | The pre-write guard refuses a Sonnet edit of the gate (executed). | source: `docs/sessions/evidence/task942/design/p03-authority-probe.txt:2-2`; observed: `POLICY-EDIT AUTHORITY REQUIRED` |
| C23 | FACT | The pre-write guard allows the same edit for Opus (executed). | source: `docs/sessions/evidence/task942/design/p03-authority-probe.txt:3-3`; observed: `evaluateHook opus Edit scripts/check-listing-visibility.mjs: []` |
| C24 | FACT | CI refuses a changed gate script outside every governance contract (executed). | source: `docs/sessions/evidence/task942/design/p03-authority-probe.txt:4-4`; observed: `outside every changed governance contract scope` |
| C25 | FACT | Gate scripts are policy paths. | source: `docs/sessions/evidence/task942/design/sources/scripts__workflow-gates__contract.mjs.txt:78-78`; observed: `export const isPolicyPath = file =>` |
| C26 | FACT | A product contract refuses policy paths. | source: `docs/sessions/evidence/task942/design/sources/scripts__workflow-gates__contract.mjs.txt:233-233`; observed: `Executor scope contains policy path` |
| C27 | FACT | A governance contract needs a hook case and a CI case. | source: `docs/sessions/evidence/task942/design/sources/scripts__workflow-gates__contract.mjs.txt:360-360`; observed: `governance: missing ${layer} case` |
| C28 | FACT | Governance case tests live in a workflow-gates selftest file. | source: `docs/sessions/evidence/task942/design/sources/scripts__workflow-gates__contract.mjs.txt:355-355`; observed: `testFile must be a scripts/workflow-gates/<name>.selftest.mjs file` |
| C29 | FACT | Governance implementation must record the Opus role. | source: `docs/sessions/evidence/task942/design/sources/scripts__workflow-gates__contract.mjs.txt:206-206`; observed: `Governance implementation.role must be Opus` |
| C30 | FACT | The self-test runner discovers selftest files by name. | source: `docs/sessions/evidence/task942/design/sources/scripts__workflow-gates__selftests.mjs.txt:8-8`; observed: `/^[a-z0-9_-]+\.selftest\.mjs$/.test(file)` |
| C31 | FACT | The gate tree already guards a module's main block by its entry path. | source: `docs/sessions/evidence/task942/design/sources/scripts__workflow-gates__publication.mjs.txt:71-71`; observed: `if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {` |
| C32 | FACT | The publication manifest check is not a CI gate. | source: `docs/sessions/evidence/task942/design/sources/.claude__rules__shared__git-publication.md.txt:34-34`; observed: `candidate dependencies only and is not a CI gate.` |
| C33 | FACT | CI runs the strict gate. | source: `docs/sessions/evidence/task942/design/sources/scripts__workflow-gates__pipeline.json.txt:317-317`; observed: `"check:listing-visibility"` |
| C34 | FACT | CI runs the detector self-test. | source: `docs/sessions/evidence/task942/design/sources/scripts__workflow-gates__pipeline.json.txt:322-322`; observed: `"check:listing-visibility:verify"` |
| C35 | FACT | The package script runs the gate script directly. | source: `docs/sessions/evidence/task942/design/sources/package.json.txt:114-114`; observed: `"check:listing-visibility": "node scripts/check-listing-visibility.mjs",` |
| C36 | FACT | No task contract and no publication-manifest entry names the gate script (executed). | source: `docs/sessions/evidence/task942/design/p06-contract-scope-grep.txt:3-3`; observed: `matches: NONE` |
| C37 | FACT | The design was made on HEAD ad6e1b08e. | source: `docs/sessions/evidence/task942/design/p00-head.txt:1-1`; observed: `ad6e1b08ec9cf21d29550b037040c02ed6772eae` |
| C38 | FACT | The pre-write guard's refusal text for Sonnet policy writes. | source: `docs/sessions/evidence/task942/design/sources/scripts__workflow-gates__security-hook.mjs.txt:262-262`; observed: `POLICY-EDIT AUTHORITY REQUIRED: Sonnet cannot edit workflow policy or enforcement` |
| C39 | FACT | The AC2 break text occurs exactly once in the gate script (executed, Task 944 design). | source: `docs/sessions/evidence/task944/design/p06-942-break-text.txt:3-5`; observed: `return ALLOWLIST.some(e => norm === e.path && matchedText.includes(e.fingerprint));` |
| C40 | FACT | The final Task 944 hook reports nothing for `perl -0pi`, and neither did the hook before it (executed). | source: `docs/sessions/evidence/task944/review/r3-adversarial.txt:2-2`; observed: `MISSED   (base missed) perl -0pi -e` |
| C41 | FACT | It reports nothing for a command in backticks (executed). | source: `docs/sessions/evidence/task944/review/r3-adversarial.txt:23-23`; observed: `MISSED   (base missed) echo` |
| C42 | FACT | It does not resolve a nested shell's targets in the folder of `env -C` (executed). | source: `docs/sessions/evidence/task944/review/r3-adversarial.txt:45-45`; observed: `MISSED   (base missed) env -C scripts/workflow-gates bash -c` |
| C43 | FACT | It reports nothing for `npm exec rimraf` (executed). | source: `docs/sessions/evidence/task944/review/r3-adversarial.txt:98-98`; observed: `MISSED   (base missed) npm exec rimraf` |
| C44 | FACT | It reports nothing for `open(file=…, mode='w')` (executed). | source: `docs/sessions/evidence/task944/review/r3-adversarial.txt:60-60`; observed: `MISSED   (base missed) python -c "open(file=` |
| C45 | FACT | It reports nothing for `os.removedirs` (executed). | source: `docs/sessions/evidence/task944/review/r3-adversarial.txt:70-70`; observed: `os.removedirs('scripts/workflow-gates')` |
| C46 | FACT | It reports nothing for `[IO.File]::Open` with a creating mode (executed). | source: `docs/sessions/evidence/task944/review/r3-adversarial.txt:83-83`; observed: `MISSED   (base missed) powershell -Command "[IO.File]::Open(` |
| C47 | FACT | The pre-write guard allows an executor such a form on a policy file (executed). | source: `docs/sessions/evidence/task944/review/r3-probes.txt:43-43`; observed: `ALLOWED npm exec rimraf scripts/check-example.mjs` |
| C48 | FACT | Task 943 sends a newly found common write form to a revision, never to the implementer. | source: `tasks/Archive/Sprint_92_kickoff_prompt_Task_943_File_Mutating_Commands_Are_Writes.md:320-320`; observed: `A newly found common write form is added to section 5 or R13 by a revision` |
| C49 | FACT | The R4 prototype reports every form, refuses each executor form and keeps the controls silent (executed). | source: `docs/sessions/evidence/task942/design/p07-shell-forms-run.txt:110-110`; observed: `FAILURES 0` |
| C50 | FACT | Over the frozen corpus the prototype drops no target and adds no guarded target, executor refusal or governance scope file (executed). | source: `docs/sessions/evidence/task942/design/p07-shell-forms-run.txt:105-105`; observed: `corpus: dropped 0; with added targets 1; with an added guarded target 0; executor commands newly refused 0; with an added governance scope file 0` |
| C51 | FACT | The hook-importing self-tests pass against the prototype unchanged (executed). | source: `docs/sessions/evidence/task942/design/p07-shell-forms-run.txt:101-101`; observed: `PASS self-test shell-forms.selftest.mjs unchanged against the prototype` |
| C52 | FACT | Five contracts scope the hook: 935, 940, 941, 943 and 944 (executed). | source: `docs/sessions/evidence/task942/design/p08-hook-scope-contracts.txt:2-6`; observed: `Task_943_File_Mutating_Commands_Are_Writes.security.json` |
| C53 | FACT | The 5000-folder-change commands stay under 15 s on the prototype (executed). | source: `docs/sessions/evidence/task942/design/p07-shell-forms-run.txt:109-109`; observed: `PASS timing parser-rejected 5000 folder changes under 15 s on the prototype` |
| C54 | FACT | The final Task 944 hook reports nothing for `open(` with a keyword mode after another keyword argument, and neither did the hook before it (executed). | source: `docs/sessions/evidence/task944/review/r4-forms-diagnosis.txt:7-7`; observed: `buffering=1, mode='w'` |
| C55 | FACT | It reports nothing for `Path(…).open(mode='w')` (executed). | source: `docs/sessions/evidence/task944/review/r4-forms-diagnosis.txt:17-17`; observed: `MISSED` |
| C56 | FACT | It reports no file under a directory named by `shutil.rmtree(path=…)` (executed). | source: `docs/sessions/evidence/task944/review/r4-forms-diagnosis.txt:20-20`; observed: `rmtree(path=` |
| C57 | FACT | It reports nothing for the Task 944 R8 (c) API forms with `\"` quotes inside a double-quoted command text (executed). | source: `docs/sessions/evidence/task944/review/r4-forms-diagnosis.txt:23-23`; observed: `MISSED` |
| C58 | FACT | The pre-write guard allows an executor such a form on a policy file (executed). | source: `docs/sessions/evidence/task944/review/r4-ac12.txt:10-10`; observed: `executor ALLOWED` |
| C59 | FACT | On the R4 prototype, the R4 (f) pairs report each of 16 forms, refuse each executor form, keep the controls silent and pass the hook-importing self-tests unchanged (executed). | source: `docs/sessions/evidence/task942/design/p10-more-forms-run.txt:67-67`; observed: `FAILURES 0` |
| D1 | OWNER DECISION | Governance tasks are implemented by Opus in a separate session. | owner: 2026-11-01; decision: `Opus, a separate session (Recommended)` |
| D2 | OWNER DECISION | Approval independence is enforced by the hook. | owner: 2026-11-01; decision: `Yes, the hook blocks (Recommended)` |
| D7 | OWNER DECISION | Every CI fix is committed on task/935-governance-approval-route and published in PR #12. | owner: 2026-11-01; decision: `Everything in PR #12 (Recommended)` |
| D8 | OWNER DECISION | Each red CI check gets its own task. | owner: 2026-11-01; decision: `A separate task for each check (Recommended)` |
| D9 | OWNER DECISION | A later independently reviewed contract may rebase a pinned reviewed contract when the changed files are in its scope but are not tests of its cases, with its cases rerun green. | owner: 2026-11-01; decision: `Governance task: audited rebase (Recommended)` |
| D13 | OWNER DECISION | No new task: every found and potential hole is closed inside the current tasks. | owner: 2026-11-02; decision: `no new task, everything within the current task; close every hole already found and every potential one` |
| D14 | OWNER DECISION | Dependent kickoff work found in a session is done in that session, never left for a later one, as a mandatory rule. | owner: 2026-11-02; decision: `This must be done immediately, because in the next session nobody will remember it.` |
| D17 | OWNER DECISION | Task 944 (sensitivity breaks only in memory) is committed on PR #12's branch after Task 943 and before Task 942, so 942 makes its break through the new runner. | owner: 2026-11-03; decision: `Sprint 92, after 943 (Recommended)` |
| D20 | OWNER DECISION | Task 944 is approved with notes, and the write forms its review 3 found outside AC12 are written into Task 942. | owner: 2026-11-04; decision: `Approve, the forms into 942 (Recommended)` |

## Mobile adaptation record
- Scope: none

## 4. Scope and out of scope

In scope (the implementer writes exactly these): `scripts/check-listing-visibility.mjs`, new
`scripts/workflow-gates/listing-visibility-allowlist.selftest.mjs`, the stage/implementation/report/sensitivity fields of this
task's `.security.json`, and the evidence files `docs/sessions/evidence/task942/impl/completion-report.md`,
`docs/sessions/evidence/task942/impl/governance-report.json`, `docs/sessions/evidence/task942/impl/base-runs.txt`,
`docs/sessions/evidence/task942/impl/gate-after.txt`, `docs/sessions/evidence/task942/sensitivity/sensitivity.json`,
`docs/sessions/evidence/task942/sensitivity/GOV-942-CI-PATH-DENY.break.json` and
`docs/sessions/evidence/task942/sensitivity/GOV-942-CI-PATH-DENY.txt` (the last two written as revision 1 describes).
Revision 2 (R4): `scripts/workflow-gates/security-hook.mjs`, new `scripts/workflow-gates/shell-forms-residual.selftest.mjs`, and for
the critical case GOV-942-HOOK-SHELL-FORMS-DENY its break spec and artifact under the same names in the same folder.
Written by the approver only (R5): `scope` entries in the `review.rebases` of the 935, 940, 941, 943 and 944 contracts with evidence
`docs/sessions/evidence/task942/review/scope-rebase-935.md`, `…-940.md`, `…-941.md`, `…-943.md` and `…-944.md`.

Out of scope: every product file, including `src/modules/listings/actions/contactEvents.ts` and the detail page (their behaviour is
the reviewed Task 923 rule, C6, C7); the detector's patterns, block extraction, exclusions and its 34 self-test fixtures; the
other seven allowlist entries; `scripts/workflow-gates/publication.json` and every existing self-test file (C32, C36); widening the
detector to see status constants (a recorded limitation, C9); the other red jobs of PR #12 (Tasks 937, 938, 939). Revision 2:
`isReadOnlyShellCommand`, the rest of `security-hook.mjs` beyond R4, and every write form that Tasks 943 and 944 leave undetected
(a path or folder in a variable, a script file run by an interpreter, `-EncodedCommand`, a folder change inside backticks or
`$(…)`, a `.NET` file mode held in a variable); a redirection after `env -C` is not an R4 form, because the shell opens it in the
current folder, not in the `env` folder.

## 5. Current and required behaviour

Preserved: the detector (C16) and its fixtures (C20); the output lines, exit codes and the `--report` and `--verify-gate` modes of
the command line; the path-and-fingerprint matching (C12); stale entries failing the gate (C13); CI's two gate steps (C33, C34).
Revision 2: every target the Task 944 hook reports stays reported (C50); every existing self-test passes unchanged (C51).
Changed: the allowlist holds the current contact-event fingerprint and no detail-page entry; the stale check is an exported pure
function; the command-line body runs only when the file is the entry point, so a self-test can import the module. Revision 2: the
R4 forms add their targets, so the independence check counts them and the pre-write guard decides on them.

## Requirements

| ID | Observable requirement | P | AC |
|---|---|---|---|
| R1 [C2; C4; C5; C6; C7; C8; C9; C10; C11; C14; C15; C19] | **Allowlist.** In `ALLOWLIST`, the contact-event entry becomes `{ path: 'src/modules/listings/actions/contactEvents.ts', fingerprint: ".eq('status', 'active')", reason: 'single-row WhatsApp contact-event lookup by id (service role, Task 850): only an active listing of a live owner has a contact card (Task 923 R66 (f), owner F2), the same status-only rule as the detail page, which applies no expiry filter; not a public list read' }`; the detail-page entry is removed; the other seven entries stay byte-identical and in order (8 entries). | P1 | AC1, AC2 |
| R2 [C12; C13; C16; C17; C18; C31] | **Testable module.** `ALLOWLIST` is exported. A new exported pure function `staleAllowlistEntries(entries, readSource)` returns, in input order, every entry for which `readSource(entry.path)` returns a non-string or throws, or for which no trimmed line of any `from('listings')` query block of that source (the same block extraction as today) contains `entry.fingerprint`. The scan uses it with a reader that returns `null` for a missing file. Everything after the detector (the scope line, `--verify-gate`, the canonical-source checks, the scan, the stale report and every `process.exit`) runs only when `process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)`. No output text, exit code or mode changes. | P1 | AC2, AC3, AC4 |
| R3 [C22; C23; C24; C27; C28; C29; C30; C32; C36] | **Proof.** The four GOV-942 cases live in the new `scripts/workflow-gates/listing-visibility-allowlist.selftest.mjs`; no existing self-test file and no `publication.json` entry changes. | P1 | AC5 |
| R4 [C40; C41; C42; C43; C44; C45; C46; C47; C48; C49; C50; C51; C53; C54; C55; C56; C57; C58; C59; D13; D14; D20] | **Remaining shell write forms (revisions 2 and 3).** `shellWriteTargets` in `security-hook.mjs` also reports: (a) a section 5 program directly after or before a backtick, through the `WORD` pattern of the R1 fallback of a command the parser rejects (C41); (b) `perl` `-0` with its octal digits or `x` and hex digits inside an option cluster (`-0pi`, `-0777pi`, `-0x1Fpi`): `-0` takes only those digits and the cluster goes on, in the parsed reading and in the R1 fallback, while `-I`, `-M`, `-m`, `-d`, `-D` and `-x` keep their attached value (C40); (c) the folder of `env -C <folder>`, `-C<folder>`, `--chdir <folder>` or `--chdir=<folder>` also applies to the command text of a nested shell or evaluator that `env` runs and to the API paths of an interpreter that `env` runs, in parsed commands, in the raw-text reading of a command the parser rejects and in the lenient reading (C42); (d) `npm exec`, `npm x`, `pnpm exec`, `pnpm dlx`, `yarn exec`, `yarn dlx` and `bun x` are skipped like `npx` with their options, and `yarn` directly before `rimraf` or `shx` is skipped, never before any other word, so `yarn install` keeps its package-file targets (C43); (e) `open(` and `openSync(` accept `file=` before the quoted path (C44), `removedirs` joins the qualified directory-delete names of Task 944 R8 (c) (C45), and `]::Open(` with a quoted mode or a `[…FileMode]::` mode of `Create`, `CreateNew`, `Append`, `Truncate` or `OpenOrCreate` is a W3 literal path, never `Open` or `OpenRead` (C46); (f) (revision 3) (i) `open(` and `openSync(` read a `mode=` or `flags=` after other keyword arguments (C54); (ii) `Path('…').open(` reads a write mode as `mode=` and after other keyword arguments (C55); (iii) a directory delete call of Task 944 R8 (c) accepts `path=` before its quoted path (C56); (iv) the raw reading of a command treats `\"` as a quote for the API forms, so they match inside a double-quoted command text (C57), while a search text keeps the reading the single-quoted spelling already has. Each addition is skipped when its target is already reported, so the result is a superset of the Task 944 result; `isReadOnlyShellCommand` is unchanged. Feasibility: `docs/sessions/evidence/task942/design/p07-shell-forms-run.mjs` applies its `PAIRS` to a copy of the hook (a design prototype to read, not code to paste) with the results of C49, C50, C51 and C53; `docs/sessions/evidence/task942/design/p10-more-forms-run.mjs` adds its `PAIRS` on that prototype for (f), with the result of C59 and a corpus result of 0 added targets. | P1 | AC6 |
| R5 [C24; C52; D9; D20] | **Proof and rebases.** GOV-942-HOOK-SHELL-FORMS-DENY lives in the new `scripts/workflow-gates/shell-forms-residual.selftest.mjs`, not listed in `publication.json` (C32). After approving this task, the approver appends a `scope` entry by this contract to the `review.rebases` of the 935, 940, 941, 943 and 944 contracts, each with `## Changed scope files` evidence listing `scripts/workflow-gates/security-hook.mjs`, and recomputes nothing else in them. | P1 | AC6, AC7 |

## Acceptance criteria

- **AC1 [R1].** GOV-942-CI-GATE-ALLOW passes: spawning `node scripts/check-listing-visibility.mjs` from the repository root exits 0
  with `0 violations` and `Allowlist: 8 entries, 0 stale.`; `npm run check:listing-visibility` exits 0 (output saved to
  `docs/sessions/evidence/task942/impl/gate-after.txt`); `npm run check:listing-visibility:verify` reports `34 passed, 0 failed`.
- **AC2 [R1; R2; C39; D17].** GOV-942-CI-PATH-DENY passes: for the source block `const { data } = await db` / `.from('listings')` /
  `.select('id')` / `.eq('id', id)` / `.eq('status', 'active')` / `.maybeSingle()`, `detectVisibilityViolations` returns `[]` for
  path `src/modules/listings/actions/contactEvents.ts` and exactly one violation at line 5 for
  `src/modules/listings/actions/otherAction.ts` and for `src/app/[locale]/listings/[slug]/page.tsx`; `ALLOWLIST` has no entry for
  that page and exactly one contact-event entry with fingerprint `.eq('status', 'active')`. Sensitivity: making the allowlist
  match by fingerprint alone (ignoring the path) fails GOV-942-CI-PATH-DENY with an assertion; restored passes. The break is the
  spec `docs/sessions/evidence/task942/sensitivity/GOV-942-CI-PATH-DENY.break.json` =
  `{ "version": 1, "case": "GOV-942-CI-PATH-DENY", "target": "scripts/check-listing-visibility.mjs", "find": "norm === e.path && ", "replace": "" }`
  (C39), run with `node scripts/workflow-gates/cli.mjs sensitivity --contract <this sidecar> --break <that spec>` (Task 944 R1),
  which writes the artifact and the record with `method: 'in-memory'`; the live gate file is never edited for the break.
- **AC3 [R2].** GOV-942-CI-STALE-ERROR passes: `staleAllowlistEntries` with the current `ALLOWLIST` plus the old contact-event
  entry (C14) and a reader of the repository files returns exactly the old entry; an entry whose reader returns `null`, and one
  whose reader throws, are returned (fail closed); an entry whose fingerprint appears only outside a `from('listings')` block is
  returned.
- **AC4 [R2].** Importing the module in the self-test prints nothing and does not exit the test process (the test runner reports
  every case); `node --check scripts/check-listing-visibility.mjs` exits 0.
- **AC5 [R3].** GOV-942-HOOK-EXECUTOR-DENY passes: `evaluateHook` for a PreToolUse `Edit` and a `Write` of
  `scripts/check-listing-visibility.mjs` with model `sonnet` returns `POLICY-EDIT AUTHORITY REQUIRED`, and with model `opus`
  returns `[]` (C22, C23). `node scripts/workflow-gates/selftests.mjs` exits 0 with 0 skipped and 5 more passing tests than the
  base run; `git diff --exit-code` on every existing `scripts/workflow-gates/*.selftest.mjs` file and on
  `scripts/workflow-gates/publication.json`; `node scripts/workflow-gates/check-workflow.mjs` exits 0;
  `node node_modules/eslint/bin/eslint.js --config scripts/workflow-gates/eslint.config.mjs scripts/workflow-gates` exits 0;
  `node scripts/workflow-gates/cli.mjs governance-report --contract <this sidecar>` passes every case;
  `node scripts/workflow-gates/cli.mjs verify --contract <this sidecar>` exits 0 at stage implemented. Approver, after Task 937:
  the Governance Check job of PR #12 is green.
- **AC6 [R4; R5].** GOV-942-HOOK-SHELL-FORMS-DENY passes on a fixture root with X a governance scope file
  `scripts/workflow-gates/fixture-scope.mjs`, D its folder, N its file name and Y a fixture file named N outside D: each form of the
  `forms(x, d, n)` list of `docs/sessions/evidence/task942/design/p07-shell-forms-run.mjs` and of the `forms(x, d)` list of
  `docs/sessions/evidence/task942/design/p10-more-forms-run.mjs` reports X and yields `GOVERNANCE
  INDEPENDENCE` for X, and its executor form with X replaced by `scripts/check-example.mjs` (D by `scripts`, N by
  `check-example.mjs`) is refused with `POLICY-EDIT AUTHORITY REQUIRED` or `SECURITY TEST CONTRACT MISSING`; each command of the
  `CONTROLS` list of each file reports no X; `perl -pi -e's/a/b/' X` also reports X, which pins the attached-script branch of Task 944
  R8 (d) that no Task 944 AC12 form exercises (a break of that branch survived Task 944 review 3). Sensitivity: a break spec that stops R4 (c) fails GOV-942-HOOK-SHELL-FORMS-DENY with an
  assertion, run with `cli.mjs sensitivity`; restored passes; the live hook is never edited for the break. `node
  scripts/workflow-gates/selftests.mjs` shows every GOV-941, GOV-943 and GOV-944 case passing. The frozen corpus
  `test-results/task943-prototype/corpus.json`, Task 944 hook against the final hook, drops no target and adds no executor refusal
  and no governance scope file, and the Task 943 AC15 F8 commands return within 15 s on native Windows; both results are in the
  completion report.
- **AC7 [R5].** After the approver's rebases, the scoped harness of Task 944 AC11
  (`docs/sessions/evidence/task944/review/r3-ac11-harness.mjs`, extended with this contract) reports no error for the 935, 940, 941,
  943, 944 and 942 contracts, and `reviewedFreshnessErrors` for that selection returns `[]`.

## Security test contract

| Field | Content |
|---|---|
| Assets and boundaries | The listing public-visibility invariant gate (`scripts/check-listing-visibility.mjs`): its allowlist (C12–C15), its stale check (C13, C18) and its detector (C16); the pre-write guard that keeps the gate an Opus-only file (C22, C23, C38) and its shell write detection (`shellWriteTargets`, `governanceIndependenceErrors`, R4); CI's policy-diff check (C24) as the outer layer. Owner: Opus (D1). |
| Frontend security | Governance has no browser consumer; the hook layer replaces this row: GOV-942-HOOK-EXECUTOR-DENY and GOV-942-HOOK-SHELL-FORMS-DENY on the real `evaluateHook`, `shellWriteTargets` and `governanceIndependenceErrors`. |
| Server security | The CI layer replaces this row: GOV-942-CI-GATE-ALLOW (process: the real gate on the real tree), GOV-942-CI-PATH-DENY and GOV-942-CI-STALE-ERROR (unit: the real exported detector, allowlist and stale check). |
| Database/integrations | Not applicable: the gate reads source files only; no database, Storage, Realtime or provider path. |
| Cases | The five GOV-942 cases of the sidecar with actor, resource, input, response and forbidden effects; allow, deny and error outcomes; hook and CI layers. |
| Fixtures and environment | The repository source tree read-only and in-memory source strings; for GOV-942-HOOK-SHELL-FORMS-DENY a temporary folder from `mkdtempSync` with synthetic files and transcripts, removed after the test; no other temporary writes, no credentials, no network. |
| Sensitivity proof | Critical cases GOV-942-CI-PATH-DENY and GOV-942-HOOK-SHELL-FORMS-DENY: the breaks named in AC2 and AC6, each as a saved break spec run by `cli.mjs sensitivity` (in memory, D17); baseline pass, isolated break failing with an assertion, restored pass; artifacts `docs/sessions/evidence/task942/sensitivity/<case ID>.txt`. |
| Execution | `node scripts/workflow-gates/cli.mjs governance-report --contract tasks/Sprints/Sprint_92_kickoff_prompt_Task_942_Listing_Visibility_Allowlist_Current.security.json`, then `cli.mjs verify` on the same path; native Windows PowerShell 5.1, Node 22.22.3; QA Q1. |

## 6. Ordered route

1. **Owner** (separate PowerShell window, `C:\Claude_Code_Projects\lero-al`): stay on `task/935-governance-approval-route` (D7);
   commit this kickoff set with the command Opus gives.
2. **Prerequisite, before the first write of step 3:** Task 944 is reviewed and committed (D17), and `git status --short scripts`
   prints nothing (no other governance task's implementation, such as Task 943's or 944's, is uncommitted in the tree). Otherwise
   wait until that task's commit; do not mix two governance implementations in one working tree.
3. **Opus implementer, fresh session** (D1): read this kickoff and its bundle; save the base runs of
   `node scripts/check-listing-visibility.mjs` (exit 1, C3), `npm run check:listing-visibility:verify` and
   `node scripts/workflow-gates/selftests.mjs` to `docs/sessions/evidence/task942/impl/base-runs.txt` before the first write.
   Implement R1 and R2, then R3 with the four cases, then R4 through the Edit tool on the hook with the fifth case (R5); the Task
   944 guard checks each hook Edit. Record `implementation: { "role": "Opus" }`, stage `implemented`, `report` and `sensitivity`
   in the sidecar; write the two break specs and run each with `cli.mjs sensitivity` (never edit a gate or the hook to plant a
   break); keep the artifacts and records it writes.
4. Run `cli.mjs governance-report` and every AC command; write the completion report; end with
   `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` and the explicit-path commit command for the owner. No push.
5. **Opus approver, another fresh session** (D2): review R1–R5; on approval write the `review` block and stage `reviewed`, write the
   five R5 `scope` entries with their evidence, run AC7, and hand off the explicit-path commit under `shared/git-publication.md`.
   PR #12 merges only after green PR checks (D7).

## 7. Completion report

Per requirement: changed files, evidence path, status; each GOV-942 case with its result; each sensitivity diff with the failed
assertion; base and final gate and self-test totals; proof that no existing self-test file and no manifest entry changed; for R4
each AC6 form with its result, the corpus and timing results and the write forms that stay undetected; one of
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`.

## 8. Rule compliance

| Rule | How this kickoff complies |
|---|---|
| `claim-evidence-contract.md` | Every R cites ledger rows; sources are retained snapshots and executed probes under `docs/sessions/evidence/task942/design/`, the Task 937 design snapshot of the gate and the Task 944 review 3 evidence. |
| `security-testing.md` | Governance contract: hook and CI layers, allow/deny/error, sensitivity for the two critical cases, Q1. |
| `role-boundaries.md` | Opus implements policy (D1); Sonnet is not routed (C25, C26); approval by an independent session (D2). |
| `git-publication.md` | Task-branch commit on PR #12's branch (D7); merge only after green checks. |
| `mobile-adaptation-contract.md` | No visible scope: `Scope: none`. |

KICKOFF EVIDENCE PREFLIGHT COMPLETE — claims: C1, C2, C3, C4, C5, C6, C7, C8, C9, C10, C11, C12, C13, C14, C15, C16, C17, C18, C19, C20, C21, C22, C23, C24, C25, C26, C27, C28, C29, C30, C31, C32, C33, C34, C35, C36, C37, C38, C39, C40, C41, C42, C43, C44, C45, C46, C47, C48, C49, C50, C51, C52, C53, C54, C55, C56, C57, C58, C59; owner decisions: D1, D2, D7, D8, D9, D13, D14, D17, D20; blocked claims: NONE.
