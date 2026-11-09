# Lero.al rules

Rewritten 2026-11-06 at the owner's instruction (governance reset, `docs/governance-reset-2026-11-06.md`) on the basis
of the OWASP Cheat Sheet Series. Read only what the task needs.

| File | Read when |
|---|---|
| `flow.md` | always — roles, design → implementation → review → merge, loop limit |
| `quality-gates.md` | always — the agent loop hooks and the CI gates |
| `kickoff-template.md` | writing a kickoff |
| `threat-model.md` | the change touches the attack surface (list in the file) |
| `security-testing.md` | the change touches the attack surface; reviewing tests |
| `secure-code-review.md` | reviewing any change |
| `shared/project-language.md` | always — Ukrainian to the owner, English in files |
| `shared/canonical-component-reuse.md`, `shared/ui-token-contract.md`, `shared/mobile-adaptation-contract.md` (+ `-patterns`, `-component-map`), `shared/enforcement-model.md`, `shared/storybook-proof.md`, `shared/reference-research.md`, `shared/rendered-state-census.md` | visible UI, tokens, Stories |

Rules are changed only at the owner's request, in a PR the owner reviews. A rule states one thing once; a new rule goes
into the smallest file that owns it.

## Precedence over older documents

Process — roles, flow, gates, review, evidence, Git — is defined in this folder only. The older documents
(`docs/agent-contract.md` and `docs/rules/agent-contract/`, `docs/golden-rules.md` and `docs/rules/golden/`,
`docs/rule-index.md`, `docs/orchestrator-role.md`, `docs/orchestrator-procedures.md`, `docs/governance-enforcement.md`,
`docs/ai-behavior.md`, `docs/maintenance-playbook.md`, `docs/governance-checklists.md`) keep their product requirements
(UI, tokens, Stories, mobile, tables, i18n, data, security); where they describe process, this folder wins:

- A **receipt** those documents require is no longer a string a hook looks for, and a response is not void without one.
  The check the receipt stood for is an acceptance criterion with an automated test where it can be automated
  (`quality-gates.md` §8); otherwise the reviewer states the check and its result, with `path:line` evidence, in the
  review (`secure-code-review.md`).
- **Phases, ledgers, the claim ledger, `BLOCKED — KICKOFF EVIDENCE GAP`** are replaced by the kickoff's sources
  (`kickoff-template.md`) and the reviewer's rerun of every claim.
- A reference in any active document to a file or `npm run` script that no longer exists fails `check-files.mjs`
  (`stale-path`, `quality-gates.md` §1), so a removed mechanism cannot stay quoted as if it were in force.
