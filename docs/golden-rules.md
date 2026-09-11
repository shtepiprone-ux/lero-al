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
| GR-1 | `scripts/check-rendered-scope.mjs` (`npm run check:rendered-scope`) and, as of Task 817, `scripts/check-surface-census.mjs` (`npm run check:surface-census -- --surface <path>`, or GR-1's own `Command` block) | **Built and proven (Task 812 whole-manifest detector; Task 817 per-surface command). A step now runs `check:rendered-scope` in the `governance` CI job, but GR-1 is still receipt-only, not enforced.** Owner decision 3 (2026-09-11, kickoff §14.6.4) put the step in as advisory only — `continue-on-error: true` at step level, real exit code preserved, full report printed — so the frontier is visible on every PR without blocking any of them. 13 allowlist entries are recorded: 11 shared `design-system/mantine/patterns/*` paths (owner decision 1, Task 816) and 2 Task 813 feature paths. Together they cover 27 rendered edges; the pattern cluster accounts for 11 paths and 23 edges. 27 tier1 + 3 tier2 edges remain, unowned by this task. **Task 817 lands GR-1's own previously-missing per-surface command (decision 2)**: it censuses one named surface — enrolled or not — transitively through tier-1 nodes only, classifies every reached node into exactly one of `agent-contract` 16d's three tiers, and prints GR-1's exact receipt (`GR-1 CENSUS COMPLETE …`) on a clean census or `GR-1 CENSUS BLOCKED` naming every offending node otherwise; proven with a two-armed plant against `FavoritesShell.tsx`/`CollectionsSection.tsx` plus a differential arm showing `check:rendered-scope` names `CollectionsSection` zero times in that same planted, pre-enrolment state. **Landing the command does not by itself make GR-1 enforced or blocking** — it is still run and read by hand at task design/execution/review time. Blocking enforcement of either check remains gated on **Task 818** (reducing or baselining the remaining frontier so the advisory step can become blocking — decision 3's mandatory exit). GR-1's `Command` block above is unchanged and is not `check:rendered-scope` — the two are complementary, not substitutes (decision 2's binding consequence). |
| GR-2 | reviewer inspection + receipt | active |
| GR-3 | `check:story-coverage` for enrolled components; `check-rendered-scope` runs advisory in CI for the frontier, not yet blocking; **as of Task 817 (Revision 1), `check-surface-census.mjs` also checks, per node, whether a canonical Mantine story imports it — directly or through a single-hop `index.ts(x)` barrel re-export, the same resolution the render-side walk uses — never merely its parent — via its `story:<yes\|no>` column** | not enforced — gated on Task 818. Task 817 landed the per-surface command that machine-checks GR-3's "own story" requirement per node, but landing it does not itself make GR-3 enforced or blocking. |
| GR-4 | reviewer inspection + receipt | active |
| GR-5 | **`Stop` hook** `.claude/hooks/orchestrator-response-gate.ps1` — blocks the response when `docs/backlog.md` records a task approved/archived and `docs/backlog-archive.md` is unchanged | **enforced** |
| GR-6 | **`Stop` hook** — blocks the response when a `tasks/**` or governance doc is written and uncommitted with no `git add` block, and blocks `git push` outside an approved review | **enforced** |

**A receipt is a self-report, and on 2026-09-10 the orchestrator skipped one under pressure in the same session that
wrote this file.** That is why GR-5 and GR-6 are now a **`Stop` hook**: it reads the real `git status` and the actual
last response, and exits 2 — the response is blocked and must be fixed before it can finish. It is fail-open on any
error and honours `stop_hook_active`, so it can never wedge a session.

**GR-1 and GR-3 are still not enforced. Task 812 built `check:rendered-scope`, proved it correct, and it now runs
advisory on every PR (owner decision 3, 2026-09-11) — but advisory is not blocking, and no artifact may describe
this as GR-1 or GR-3 being enforced or as R6's blocking condition being met. Tasks 817 and 818 are what closes
that gap. Until they land, GR-1 and GR-3 are still the weakest rules here — do not let it sit.**
