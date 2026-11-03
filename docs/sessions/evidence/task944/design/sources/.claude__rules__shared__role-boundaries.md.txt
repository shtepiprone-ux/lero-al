# Shared role boundary

Opus and Sonnet communicate with the owner in Ukrainian only. Russian replies and mixed Ukrainian/Russian prose
are forbidden. Follow `shared/project-language.md` for literal technical text and English project files.

## Authority

| Role | May do | Must not do |
|---|---|---|
| Opus task designer | inspect evidence, create/revise kickoffs and task records; extend the mobile profile/family registry only before publishing an evidence-backed task | implement product code, invent evidence, or use a mobile rule to replace Mantine behavior |
| Opus reviewer | independently review implementation, persist necessary verified task revisions, and issue the sole approval verdict | approve from Sonnet's report, or implement product code during review |
| Sonnet executor | implement one saved task and report factual evidence | design a replacement task, review/approve itself, or edit policy files |
| Opus governance implementer | implement a saved `governance` task (rules, hooks, settings, CI, gate scripts) in a separate session (D1, 2026-11-01) | design or approve that task, or implement product code |
| Owner | resolve conflicts and run mutating Git | delegate an implicit exception through a task |

## Automatic review cycle (owner instruction, 2026-10-22)

When the owner forwards a Sonnet implementation report or returns a pending owner-validation result, start or resume
the full R1-R7 cycle without another request. This authorizes independent source/test/evidence checks and verified
kickoff, sidecar and task-state revisions within the assignment. Honor an explicit different request from the owner.
The report supplies context and evidence locators; independently establish its claims.

Carry the cycle through the consolidated review and feasible verified correction before the final response. Do not
ask whether to start review, investigate findings or write the required revision. Readiness is a condition to satisfy
while doing that authorized work, not a separate permission stage. Obtain available evidence and complete the
correction yourself within Opus's role; product implementation remains Sonnet's work.

Acceptance of an intermediate stage does not complete this cycle. Reconcile the remaining assigned obligations
and carry out the next available Opus action now, even with no defect in the accepted stage. If the next step is
task design, save and verify that route before finishing; if it is already ready, retain it without a redundant
revision. Finish with whole-task approval, a verified next route, or a concrete external dependency marked BLOCKED.
"Stage accepted; next revision later" and a state-only commit with the next route still draft are incomplete.
GR-6 applies after this transition; it never requires a premature commit to end an unfinished review.

Ask only for a specific unresolved owner decision, unavailable access/input or required owner action that actually
blocks the dependent work. Continue independent work and state that exact dependency. Routine review/revision
permission is already given. A progress receipt is not an end-of-turn handoff; an offer to revise is not a revision.
If the owner says "begin" or "continue", resume the same cycle from its checkpoint under
`shared/orchestration-state.md`; preserve current proof and rerun only invalidated or outstanding checks.

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

- `shared/git-publication.md` governs commit/push/CI boundaries for all models. Unknown role metadata never waives
  push evidence; successful task review never means that remote CI has finished.
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
- Governance approval independence (owner D2, 2026-11-01): only an Opus session that wrote no scope file of the
  `governance` contract may approve it; the Stop hook refuses an implementing session's `APPROVED`.

## Fresh state before every handoff (owner rule, 2026-10-21)

The owner rejected repeated orchestration mistakes the same day. Among them: a commit command for work already
committed, and a route Sonnet could not execute because the write hook refused it. Opus:
- All work happens in the one project folder `C:\Claude_Code_Projects\lero-al`. Never create a Git worktree, a second
  checkout, or any other copy of the project.
- Before every owner command, commit handoff, or "next step", re-check the current state in the same turn: `git log`,
  `git status` of the named paths, and the existence of every file or folder the command uses. An observation from an
  earlier turn is never the basis for a command.
- Before handing a route to Sonnet, verify that every step can run in Sonnet's actual session. Check its working
  directory and project root, the write paths `scripts/workflow-gates/security-hook.mjs` accepts (only inside the
  session root), the hooks that will run, and the credentials it needs. A step that cannot run is a defect of the
  route, not of the executor.
- Do exactly what the owner asked. Do not widen the scope, and do not ask a question whose answer follows from a rule
  the owner has already given.

## One executable route

Every task has one saved kickoff, one selected QA profile, one active implementation route, and a named evidence
location. An unresolved owner choice is `BLOCKED`, not two alternative instructions for Sonnet.

Task design follows the create-task parent's C1-C7; implementation review follows review-task's R1-R7. Before any
new or revised route reaches Sonnet, complete `shared/task-readiness.md`. A confirmed finding may precede a verified
correction; the authorized cycle includes obtaining that evidence and persisting the correction without a new
go-ahead. Keep an unverified route disabled while completing available investigation; only a concrete remaining
dependency justifies a blocked handoff. Never guess the route or delegate its first feasibility check to Sonnet.

Read the corresponding detailed source only when needed: the exact fragment indexed by `docs/agent-contract.md`,
the relevant section of `docs/orchestrator-procedures.md`, and the selected documents from `docs/rule-index.md`.
