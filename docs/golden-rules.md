# Golden Rules — non-negotiable, receipt-enforced

> **Owner rule, 2026-09-10, written after Task 809.** These are not guidance. Each rule names the forbidden act, the
> command that proves compliance, and a **verbatim receipt line** that must appear in the response. **A response that
> omits a required receipt is void** — the owner rejects it unread, and the agent restarts the step.
>
> **Why receipts and not prose.** `docs/agent-contract.md` clause **16c** — "neither the orchestrator nor executor may
> declare the Story out of scope" — existed, was listed in every kickoff's pre-read bundle, and was broken anyway by
> Task 809's own kickoff. In the same session the `REVIEW PREFLIGHT COMPLETE` receipt was emitted **every single
> time**, because its absence is visible in the output. Prose is skippable; a missing literal string is not. That is
> the entire design of this file.
>
> **A rule leaves this file only by owner decision quoted with its date. No agent may narrow, reinterpret, defer or
> "scope out" any rule here, and no task, kickoff or review is authorization to do so.**

## GR-1 — Every component a surface renders is in that surface's census

Binds: `agent-contract` **16d**. Applies to every task that changes a visible surface.

**Forbidden:** writing, obeying or approving a scope that excludes a component the surface renders — including every
popup, dialog, drawer, popover, toast and menu it opens. "Separate slice", "pre-existing", "only a child", "the
kickoff excluded it" are not exemptions.

**Command** (from the project root, `$surface` = the surface file):

```powershell
$surface = "src\modules\listings\components\FavoritesShell.tsx"
node.exe scripts\check-surface-census.mjs --surface $surface
```

**Receipt — task design, execution and review alike:**

`GR-1 CENSUS COMPLETE — <n> nodes; tier1 <a> migrated+enrolled+story; tier2 <b> imports removed; tier3 <c> listed and filed as <task numbers>.`

Every tier-3 node is **filed as a numbered task in the same response**. A node passed over silently voids the receipt.

## GR-2 — A green gate is never evidence that a gate's blind spot is clean

**Forbidden:** citing `check:story-coverage` (or any gate) as proof for a component that gate does not inspect.
`check:story-coverage` validates only components already in `scripts/mantine-migration-scope.json`; an unenrolled
component is invisible to it. Task 809 read **34/34 green** with three unmigrated shadcn components on the page and
the very pattern it extended unenrolled.

**Receipt, whenever a gate result is used to close a requirement:**

`GR-2 SCOPE STATED — <gate> inspects <what>; it cannot see <what>; the criterion is closed by <the actual evidence>.`

## GR-3 — A composition Story is not a component Story

**Forbidden:** treating a Story that renders the parent as proof for a child that has no Story of its own. If no
canonical Mantine Story exists for a changed visible component, **create it** — before the consumer composition, per
`agent-contract` 16c.

**Receipt:** `GR-3 STORY PROVEN — <component> ← <its own story file>` per changed visible component. The word "own" is
literal: the file must import that component by name.

## GR-4 — An acceptance criterion asserts an observable property, never an absolute

**Forbidden:** "byte-unchanged", "within N px", "zero hits" and similar, when a correct implementation can violate
them. Four occurred in one run: 810 AC9, 810 AC10, 808 §3.4, 809 AC1/AC5 — every one cost a round trip and none
indicated a real defect.

**Receipt, in every kickoff:** `GR-4 AC AUDIT — <n> criteria; each states an observable property; absolutes: none.`

## GR-5 — The verdict, the archive and every state record change together

Binds `orchestrator-role` → Backlog discipline. **Forbidden:** recording a verdict in one place and leaving another
stale. Enumerate every artifact naming the task's state — `docs/backlog.md`, the sprint Tasks table, the sprint
execution-order note, `docs/backlog-archive.md`, the kickoff — and change them in the same response. For `APPROVED`
or `APPROVED WITH NOTES`, this means removing the closed task and every confirmed stale closed/superseded record from
the active backlog and adding concise newest-first archive rows before the handoff. An open note becomes a separate
active owner action or numbered task; it never keeps an approved task active. This has recurred four times (661,
703/704/705, 702 twice).

**Receipts:** `GR-5 STATE SYNCED — <task> = <status> in: <every file touched>.` For an approved verdict also emit
`GR-5 BACKLOG CLEAN — archived: <task IDs>; active backlog: <n> lines.`

## GR-6 — Every response that writes a task/doc artifact ends with the owner-run git block

Binds `CLAUDE.md` → Git policy. **Task design** ends with `git add` + `git commit`, explicit paths, **never** `git
push`. **An approved review** ends with `git add` + `git commit` + `git push <verified-remote> <verified-branch>`.
A **non-approved review** contains no git command **for the implementation** — and that does **not** suppress the
task-design block for documents the same response authored. Conflating the two is how the block went missing on
2026-09-10.

**Receipt:** `GR-6 HANDOFF EMITTED — <task-design | approved-review | none: no artifact written>.`

## Enforcement status

| Rule | Enforced by | State |
|---|---|---|
| GR-1 | `scripts/check-rendered-scope.mjs` (`npm run check:rendered-scope`, **blocking**, Task 818), `scripts/check-surface-census-changed.mjs` (`npm run check:surface-census:changed`, **blocking**, Task 819 — maps the PR's own base..head diff to affected surfaces via `scripts/map-changed-surfaces.mjs` and censuses each with `scripts/check-surface-census.mjs --json`), **and** `scripts/check-pattern-enrolment.mjs` (`npm run check:pattern-enrolment`, **blocking**, Task 820) | **Enforced for both halves: the enrolled subgraph and pre-enrolment — and, for one directory, at the source.** Task 818 (2026-09-11) made `check:rendered-scope` blocking against a versioned, edge-keyed baseline (`scripts/rendered-scope-baseline.json`) — every component an *enrolled* surface renders is blocked from silently growing unmigrated. Task 819 (2026-09-11) closes the other half: `check-surface-census.mjs` (Task 817) censuses one named surface but took a `--surface` argument no CI job supplied, so a wholly unenrolled surface (the exact Task 809 shape) was invisible to every gate. `check:surface-census:changed` now runs in the same `governance` job, immediately after `check:rendered-scope:verify`: it fails closed (never a silent skip) when the merge base cannot be determined, either limit is exceeded, a changed file resolves to no surface, or a mapped surface's own census is unusable; every blocking node it finds is compared against its own versioned baseline (`scripts/surface-census-baseline.json`) the same way — baselined debt does not fail, a new block fails naming it, a stale entry fails, and a new `tier2-legacy-primitive` block can never be baselined away. Task 820 (2026-09-11, owner decision 5) closes GR-1's remaining gap for one directory by construction rather than by frontier-walking: every `.tsx` under `src/design-system/mantine/patterns/` must be a `scripts/mantine-migration-scope.json` entry, checked against the live directory listing (never a hard-coded name list), with the eleven Task 816 tier-3 allowlist entries retired as no longer needed — the manifest now enrols all 33 patterns directly. GR-1's `Command` block above (the by-hand, single-surface form) is unchanged and stays useful for ad-hoc inspection; it is not what CI runs. |
| GR-2 | reviewer inspection + receipt | active |
| GR-3 | `check:story-coverage` for enrolled components; `check-rendered-scope` blocking in CI for the enrolled-subgraph frontier (Task 818); `check-surface-census.mjs`/`check:surface-census:changed` blocking in CI for the pre-enrolment case (Task 819) — both check, per node, whether a canonical Mantine story imports it directly or through a single-hop `index.ts(x)` barrel re-export, never merely its parent, via the `story:<yes\|no>` column/field | **enforced for both halves** (Task 818, Task 819) — a rendered, unstoried component reachable from an enrolled root, or from any surface the current PR's diff actually touches, now blocks the PR. |
| GR-4 | reviewer inspection + receipt | active |
| GR-5 | **`Stop` hook** `.claude/hooks/orchestrator-response-gate.ps1` — blocks the response when `docs/backlog.md` records a task approved/archived and `docs/backlog-archive.md` is unchanged | **enforced** |
| GR-6 | **`Stop` hook** — blocks the response when a `tasks/**` or governance doc is written and uncommitted with no `git add` block, and blocks `git push` outside an approved review | **enforced** |

**A receipt is a self-report, and on 2026-09-10 the orchestrator skipped one under pressure in the same session that
wrote this file.** That is why GR-5 and GR-6 are now a **`Stop` hook**: it reads the real `git status` and the actual
last response, and exits 2 — the response is blocked and must be fixed before it can finish. It is fail-open on any
error and honours `stop_hook_active`, so it can never wedge a session.

**GR-1 and GR-3 are enforced for both the enrolled subgraph and pre-enrolment.** Task 812 built
`check:rendered-scope`; owner decision 3 (2026-09-11) ran it advisory first; Task 818 (2026-09-11) made it blocking
against a versioned fail-on-new baseline that a CI self-test (`check:rendered-scope:verify`) re-proves can still fail
on every PR — that closes the half of GR-1/GR-3 that a manifest-rooted walk can see. Task 817 built
`check-surface-census.mjs`, the per-surface command GR-1's own `Command` block had named since the rule was written
but that took a `--surface` argument no CI job supplied. Task 819 (2026-09-11, owner decision 4) closes that gap:
`check:surface-census:changed` maps every PR's own base..head diff to the surfaces it affects and censuses each one,
blocking on any new (un-baselined) finding, with its own CI self-test (`check:surface-census:changed:verify`) and its
own versioned baseline (`scripts/surface-census-baseline.json`) recording the debt that already existed. A wholly
unenrolled surface — the exact Task 809 shape — is no longer invisible to CI.
