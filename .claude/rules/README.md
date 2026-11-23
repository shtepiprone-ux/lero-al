# Lero.al rules — map

Rewritten 2026-11-22 at the owner's instruction into small files and checklists (`flow.md`). Rules are changed only at
the owner's request, in a pull request the owner reviews. A rule states one thing once, in the smallest file that owns
it.

## Checklists (loaded into every session by `CLAUDE.md`)

| File | Who | Items |
|---|---|---|
| `flow.md` | everyone | roles, the order of the phases, records |
| `checklists/common.md` | every model, every turn | A0-A16 |
| `checklists/design.md` | Opus, creating a task | D1-D13 |
| `checklists/execute.md` | Sonnet, implementing | I1-I12 |
| `checklists/review.md` | Opus, reviewing | V1-V14 |
| `checklists/handoff.md` | Opus, commands for the owner | H1-H7 |
| `checklists/ui.md` | any role, visible UI | U1-U12 |

## Detail (opened only for the checklist item that names it)

| File | Item |
|---|---|
| `project-facts.md` | A15: tools, accounts, test users, environments, owner-approved UI patterns |
| `kickoff-template.md` | D11 |
| `threat-model.md` | D6 |
| `security-testing.md` | D10, I9, V8 |
| `secure-code-review.md` | V7, V12 (finding template, review file) |
| `quality-gates.md` | reference: what each gate and CI job checks; the test rule (§8) |
| `shared/project-language.md` | A11 |
| `shared/canonical-component-reuse.md` | U1, U2 |
| `shared/ui-token-contract.md` | U3, U4 |
| `shared/mobile-adaptation-contract.md` (+ `-patterns`, `-component-map`) | U5 |
| `shared/storybook-proof.md` | U6 |
| `shared/rendered-state-census.md` | U8 |
| `shared/reference-research.md` | U10 |
| `shared/enforcement-model.md` | how the UI rules are enforced |

## Older documents

`docs/golden-rules.md`, `docs/rules/golden/`, `docs/agent-contract.md`, `docs/rules/agent-contract/`,
`docs/rule-index.md`, `docs/orchestrator-role.md`, `docs/orchestrator-procedures.md`, `docs/governance-enforcement.md`,
`docs/ai-behavior.md`, `docs/maintenance-playbook.md` and `docs/governance-checklists.md` are not read for a task. Their
product requirements that still apply are lines of the checklists above (A0 names GR-5 for `docs/backlog.md`, U7 names the GR files it uses); where they
describe process, receipts, phases or ledgers, this folder replaces them. A reference in an active document to a file or
`npm run` script that no longer exists fails `check-files.mjs` (`stale-path`, `quality-gates.md` §1).
