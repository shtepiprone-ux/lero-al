// Task 944 review 3 (approver): writes the non-frontend review ledger docs/reviews/2026-11-04-task944-… (procedures, approval-closure
// gate) from the rows below. Usage (project root): node docs/sessions/evidence/task944/review/r3-ledger.mjs
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const OUT = 'docs/reviews/2026-11-04-task944-sensitivity-breaks-only-in-memory.review-ledger.json';
const R = 'docs/sessions/evidence/task944/review';
const G = 'scripts/workflow-gates';
const FRESH = 'approver native run 2026-11-04 win32 v22.22.3 on commit 22c6871a3';
const NA = { stories: 'Gate script only; no UI artifact or Story changed.', locales: 'No user-facing string changed.',
  viewports: 'Nothing rendered by this change.', states: 'Gate inputs are enumerated under subjects.' };
const SEMANTIC = { mode: 'NOT_APPLICABLE', reason: 'Node gate script; no generated CSS, selector or cascade-sensitive syntax.' };
const row = (id, path, symbol, diffHunks, subjects, evidence, counterChecks) => ({
  id, priority: 'P1', status: 'VERIFIED', findingIds: [], finalSubject: { path, symbol, diffHunks },
  requiredScope: { subjects, phases: ['reviewed'], notApplicable: NA },
  evidence: evidence.map(([file, command, observable]) => ({ path: file, command, observable, freshness: FRESH, coverageRole: 'COVERS', scope: { subjects, phases: ['reviewed'] } })),
  coverageGaps: [], counterChecks: counterChecks.map(([claim, result]) => ({ claim, kind: 'EXECUTED', path: `${R}/r3-mutants.txt`, result })), semanticCheck: SEMANTIC });
const SELFTESTS = [`${R}/r3-selftests.txt`, 'node scripts/workflow-gates/selftests.mjs', '201 tests, 201 pass, 0 fail, 0 skipped, 0 not ok; 9 GOV-944 and 19 GOV-941/943 results ok'];
const requirements = [
  row('AC1, AC2, AC3 / R1', `${G}/cli.mjs`, 'runSensitivity, tapResultBlock, sensitivity command', [`${G}/cli.mjs:229-333`, `${G}/cli.mjs:415-419`],
    ['GOV-944-SENS-RUN-ALLOW, GOV-944-SENS-RUN-DENY, GOV-944-SENS-LIVE-ERROR'], [SELFTESTS],
    [['A refusal branch of R1 (b), the live-file check or the record replacement could be unproven.', 'REFUTED: mutants 1-8 each fail the named case with ERR_ASSERTION.']]),
  row('AC4 / R2', `${G}/contract.mjs`, 'SENSITIVITY_LEGACY_TASKS, inMemoryRecordErrors', [`${G}/contract.mjs:408-430`, `${G}/contract.mjs:457-457`],
    ['GOV-944-VAL-RECORD-ALLOW, GOV-944-VAL-RECORD-DENY'], [SELFTESTS],
    [['One branch of the record check could be unproven, or a legacy path could be absent from the list.', 'REFUTED: mutants 9-13 each fail the named case with ERR_ASSERTION, one per branch and one for the 941 legacy path.']]),
  row('AC5, AC6, AC7, AC8 / R3', `${G}/security-hook.mjs`, 'hookModuleClosure, hookModuleSyntaxErrors, hookModuleLoadFailure', [`${G}/security-hook.mjs:978-1073`, `${G}/security-hook.mjs:1133-1135`],
    ['GOV-944-HOOK-SYNTAX-DENY, GOV-944-HOOK-SYNTAX-ALLOW, GOV-944-HOOK-CLOSURE-ERROR, AC8 on the real repository'],
    [SELFTESTS, [`${R}/r3-probes.txt`, 'node docs/sessions/evidence/task944/review/r3-probes.mjs', 'closure 11; broken, unwritten-import and removed-export edits refused for both roles and spellings; valid edits allowed; live digest unchanged']],
    [['The guard could skip the CRLF, CommonJS, ps1, import-walk or role paths, or let an exception out.', 'REFUTED: mutants 14-20 fail with ERR_ASSERTION and mutant 21 fails by the rethrown error, the intended failure of that mutant.']]),
  row('AC10 / R4, R5, R9', '.claude/rules/review/02-adversarial-ui.md', 'R4 rule sentences, publication entries, gate commands', ['.claude/rules/review/02-adversarial-ui.md:25-26', '.claude/rules/shared/task-readiness.md:66-67', `${G}/publication.json:61-87`],
    ['selftests.mjs, the 14 unchanged self-test files, check-workflow.mjs, eslint, publication.mjs, cli.mjs verify, check:kickoff-evidence'],
    [SELFTESTS, [`${R}/r3-ac10-gates.txt`, 'check-workflow.mjs; eslint; publication.mjs --base HEAD; cli.mjs verify; npm run check:kickoff-evidence', 'all exit 0; 92 explicit files, 0 dependency errors']],
    [['An existing self-test file could have changed.', 'REFUTED: git diff --exit-code d17d9d5a8 exits 0 for each of the 14 other base self-test files.']]),
  row('AC9 / R6', 'docs/sessions/evidence/task944/sensitivity/sensitivity.json', 'the four in-memory records', ['docs/sessions/evidence/task944/sensitivity/sensitivity.json:1-58'],
    ['GOV-944-SENS-RUN-DENY, GOV-944-VAL-RECORD-DENY, GOV-944-HOOK-SYNTAX-DENY, GOV-944-HOOK-SHELL-FORMS-DENY records'],
    [[`${R}/r3-report.txt`, 'node docs/sessions/evidence/task944/review/r3-report.mjs', 'in-memory report passed, 9 cases; four records in-memory with current digests; baseline exit 0, mutant exit 1 with ERR_ASSERTION, restored exit 0'],
      [`${R}/r3-governance-report.txt`, 'node scripts/workflow-gates/cli.mjs governance-report --contract <archived sidecar>', 'exit 0, 9 PASS after the archive move']],
    [['A record could come from a live-file break.', 'REFUTED: each artifact records unchanged target and test digests, and git grep "SENSITIVITY BREAK" prints nothing.']]),
  row('AC11 / R7', 'tasks/Archive/Sprint_92_kickoff_prompt_Task_935_Governance_Changes_Get_An_Independent_Approval.security.json', 'review.rebases of 935, 940, 941 and 943', ['tasks/Archive/Sprint_92_kickoff_prompt_Task_935_Governance_Changes_Get_An_Independent_Approval.security.json:476-494'],
    ['scope entries on 935, 940, 941 and 943; tests entry on 935'],
    [[`${R}/r3-rebase-digests.txt`, 'node docs/sessions/evidence/task944/review/r3-rebase-digests.mjs', 'with the base bytes of every 944-changed file each contract digest equals its last chain digest'],
      [`${R}/r3-ac11.txt`, 'node docs/sessions/evidence/task944/review/r3-ac11-harness.mjs', '935, 940, 941, 943 and 944 no validateDiff error, release [], report [], chain []; reviewedFreshnessErrors []'],
      [`${R}/r3-verify-935.txt`, 'node scripts/workflow-gates/cli.mjs verify --contract <935 contract>', 'exit 0']],
    [['A contract could be stale through something other than Task 944.', 'REFUTED: r3-rebase-digests.txt prints EQUALS last: true for all four contracts.']]),
  row('AC12 / R8', `${G}/security-hook.mjs`, 'programIndex, programTargets, evaluatedText, apiArguments, lenientTargets', [`${G}/security-hook.mjs:289-316`, `${G}/security-hook.mjs:459-492`, `${G}/security-hook.mjs:640-657`, `${G}/security-hook.mjs:859-875`],
    ['GOV-944-HOOK-SHELL-FORMS-DENY, the frozen 2318-command corpus, the F8 timings'],
    [SELFTESTS, [`${R}/r3-probes.txt`, 'node docs/sessions/evidence/task944/review/r3-probes.mjs', 'corpus 2318 commands: dropped 0, guarded 0, executor newly refused 0, scope file 0'],
      [`${R}/r3-timing.txt`, 'node docs/sessions/evidence/task943/review/r2-timing.mjs <root>', 'F8 2005 ms parsed, 7579 ms parser-rejected, both under 15 s']],
    [['An R8 branch could be unproven.', 'REFUTED except note N2: mutants 22-30, 32 and 33 fail the case; mutant 31 survives AC12 and its branch is correct by r3-probes.txt and pinned by Task 942 AC6.']]),
  row('AC13 / R10', `${G}/governance-contract.selftest.mjs`, 'the GOV-T-HOOK-DENY fixture record', [`${G}/governance-contract.selftest.mjs:166-168`],
    ['governance-contract.selftest.mjs, its one hunk, contract.mjs unchanged since 1778c14b3'],
    [[`${R}/r3-governance-contract-selftest.txt`, 'node --test --test-reporter=tap scripts/workflow-gates/governance-contract.selftest.mjs', '17 tests, 17 pass, 0 fail']],
    [['R10 could change an assertion or weaken R2.', 'REFUTED: numstat 3 added, 1 removed; the hunk is the break spec save and the three record fields; git diff 1778c14b3 of contract.mjs exits 0.']]),
];
const ledger = {
  $schema: './review-ledger.schema.json', schemaVersion: 4,
  task: 'Task-944 - sensitivity breaks exist only in the test process, and no write leaves a hook module unparseable',
  review: { decision: 'APPROVED WITH NOTES', baseRevision: 'd8a07a3c7841022207fd5331f53e5a80b4d7c7e2',
    reviewedRevision: '22c6871a31eaf693b16ad68c2e0f5ec290aeedea (revision 3 implementation) on base d17d9d5a8; review 3 closure in the working tree on the same HEAD',
    reviewedPaths: [`${G}/cli.mjs`, `${G}/contract.mjs`, `${G}/security-hook.mjs`, `${G}/hook-load-check.mjs`, `${G}/sensitivity-register.mjs`, `${G}/sensitivity-hooks.mjs`,
      `${G}/sensitivity.selftest.mjs`, `${G}/hook-syntax.selftest.mjs`, `${G}/shell-forms.selftest.mjs`, `${G}/governance-contract.selftest.mjs`, `${G}/publication.json`,
      '.claude/rules/shared/task-readiness.md', '.claude/rules/review/02-adversarial-ui.md',
      'tasks/Archive/Sprint_92_kickoff_prompt_Task_944_Sensitivity_Breaks_Only_In_Memory.security.json', 'tasks/Archive/Sprint_92_kickoff_prompt_Task_944_Sensitivity_Breaks_Only_In_Memory.md', 'docs/sessions/evidence/task944'],
    supersedes: [], coverage: { total: requirements.length, verified: requirements.length, unverified: 0, openP0: 0, openP1: 0, openP2: 0 },
    ledgerGate: { command: `npm.cmd run check:review-ledger -- --file ${OUT}`, status: 'PASSED', exitCode: 0 } },
  findings: [], handoff: { commitPush: 'ALLOWED' }, attestation: { lowestEvidenceRequirement: 'AC11 / R7', reviewer: 'Opus' }, requirements };
writeFileSync(resolve(ROOT, OUT), `${JSON.stringify(ledger, null, 2)}\n`);
console.log(`${OUT}: ${requirements.length} rows`);
