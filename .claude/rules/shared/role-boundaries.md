# Shared role boundary

## Authority

| Role | May do | Must not do |
|---|---|---|
| Opus task designer | inspect evidence, create/revise kickoffs and task records; extend the mobile profile/family registry only before publishing an evidence-backed task | implement product code, invent evidence, or use a mobile rule to replace Mantine behavior |
| Opus reviewer | inspect implementation and issue the sole approval verdict | approve from Sonnet's report, or implement product code during review |
| Sonnet executor | implement one saved task and report factual evidence | design a replacement task, review/approve itself, or edit policy files |
| Owner | resolve conflicts and run mutating Git | delegate an implicit exception through a task |

## Mobile adaptation authority

- Mantine's public responsive API, default interaction, and accessibility behavior are authoritative. The project
  theme and canonical Mantine pattern owner choose the reusable mechanism and breakpoint. The mobile adaptation
  contract adds semantic content order, full-content treatment, and proof; it cannot override those Mantine choices.
- Opus selects the existing registry component family, mobile profile, allowed Mantine mechanism, and canonical owner
  from current inspected evidence. When any one is absent, Opus may make the required policy extension before task
  publication: direct primary sources, component map, permitted Mantine mechanism, owner, rejection condition, and
  planted gate proof. It must never create a parallel responsive system as that extension.
- Sonnet implements the saved selection only. An unknown family/profile/mechanism/owner, an incompatible canonical
  owner, or a need to bypass Mantine is `BLOCKED — MOBILE PATTERN EXTENSION REQUIRED`; Sonnet reports it and does
  not edit the catalogue, registry, contract, or policy.
- Opus reviewer compares the saved mechanism/owner against the actual changed code. A custom viewport branch that
  duplicates a Mantine prop, overrides Mantine focus/dismissal/keyboard behavior, or changes a canonical owner is
  `NEEDS REVISION`, even if a screenshot looks correct.

## Evidence and Git

- A claim is `FACT` only when the current session inspected the supporting source, command output, or rendered proof.
  The mandatory claim ledger, literal-observation format, and stop states are in `shared/claim-evidence-contract.md`.
  Otherwise label it `INFERENCE`, `UNVERIFIED`/`UNKNOWN`, `CONFLICT`, or `BLOCKED`; an unresolved label cannot enter
  a published implementation route.
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
