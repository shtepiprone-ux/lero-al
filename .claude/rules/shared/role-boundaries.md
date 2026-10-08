# Shared role boundary

## Authority

| Role | May do | Must not do |
|---|---|---|
| Opus task designer | inspect evidence, create/revise kickoffs and task records | implement product code or invent evidence |
| Opus reviewer | inspect implementation and issue the sole approval verdict | approve from Sonnet's report, or implement product code during review |
| Sonnet executor | implement one saved task and report factual evidence | design a replacement task, review/approve itself, or edit policy files |
| Owner | resolve conflicts and run mutating Git | delegate an implicit exception through a task |

## Evidence and Git

- A claim is `FACT` only when the current session inspected the supporting source, command output, or rendered proof.
  Otherwise label it `INFERENCE`, `UNVERIFIED`/`UNKNOWN`, `CONFLICT`, or `BLOCKED`.
- The executor report is an index, never approval evidence. A green narrow check never proves a gate's blind spot.
- Agents use read-only Git only. The owner performs mutations. Sonnet never emits mutating Git commands; Opus emits an
  explicit owner-run handoff only when its workflow permits it.
- Every owner-run commit handoff is an unattributed owner commit. Agents must never emit, suggest, or include
  `Co-Authored-By` (any case, spelling, name, vendor, or email), other AI/agent credit, or `--author` in its command,
  subject, body, or trailer. This is mandatory even if a client/model template proposes it.
- Policy/governance files and `.claude/**` are read-only to Sonnet. Report `POLICY-EDIT AUTHORITY REQUIRED` instead.

## One executable route

Every task has one saved kickoff, one selected QA profile, one active implementation route, and a named evidence
location. An unresolved owner choice is `BLOCKED`, not two alternative instructions for Sonnet.

Read the corresponding detailed source only when needed: the exact fragment indexed by `docs/agent-contract.md`,
the relevant section of `docs/orchestrator-procedures.md`, and the selected documents from `docs/rule-index.md`.
