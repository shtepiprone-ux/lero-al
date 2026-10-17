# Opus review: preflight and baseline

Before opening task, diff, source, executor report, validation evidence, or writing a finding:

1. Read `.claude/rules/shared/role-boundaries.md` and this file.
2. Read `docs/agent-contract.md`, `docs/rules/agent-contract/p0-16-16c-ui-canonical.md`,
   `docs/rules/agent-contract/p0-16d-surface-census.md`, `docs/rule-index.md`, `docs/qa-profiles.md`, and the task's
   exact rule bundle. Read a specific section of `docs/orchestrator-role.md` or `docs/orchestrator-procedures.md`
   only when its later phase or task bundle needs it; neither large historical document is a default preflight read.
3. Complete `shared/reference-research.md` before a UI/reference conclusion. Check the kickoff and executor GR-7
   evidence as separate claims, not proof of your own audit.
4. Establish baseline: complete kickoff/ledger, current diff and changed files, callers/tests/Stories, actual session
   evidence, QA profile, current backlog state, dirty-worktree witnesses, and final non-Q0 build transcript.
5. On Windows, only native-Windows/CI terminal evidence supports the verdict. Retain platform, Node version, cwd,
   exact command, output, and exit code; otherwise mark evidence missing.
   Read [shared/security-testing.md](../shared/security-testing.md) and its selected companions for every task.
   Independently inspect both frontend/server criteria and assertions, fixture validity, mock scope, actual test
   collection, isolated targets and deliberate-break evidence. Source scanners and fake databases do not establish
   effective access control or real RLS. Verify any Q0 N/A against the complete changed-file scope.
6. For visible surfaces, read `shared/mobile-adaptation-contract.md`, then `shared/ui-token-contract.md` and
   `shared/enforcement-model.md`; verify the saved Mobile adaptation record against its primary sources, allowed
   Mantine mechanism, and canonical owner, then run the 16d rendered-component census yourself. Mantine owns
   responsive mechanism/interaction/a11y; a contract-driven parallel implementation is `NEEDS REVISION`. A missing
   direct Story/manifest entry for a rendered in-scope component is `NEEDS REVISION`.

Required first substantive receipt:

`REVIEW PREFLIGHT COMPLETE - loaded: review-task; review/01-preflight; shared/role-boundaries; selected Agent Contract fragments; rule index; QA profile.`

Treat every claim as unverified until inspected. State `FACT`, `INFERENCE`, `UNVERIFIED`, `CONTRADICTION`, or
`BLOCKED`; no executor confidence or green narrow gate can substitute for evidence.
