# Golden Rules — non-negotiable, receipt-enforced

> **Owner rule, 2026-09-18, strengthened after repeated Sonnet hardcode/duplication violations.** These are not guidance. Each rule names the forbidden act, the
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

## GR-0 — Search canonical sources first; reuse or extend them; never hardcode a parallel UI

Binds: `agent-contract` **16b–16c**. Applies to every new visible production component, named visible component
added to an existing file, Storybook page/title/export, wrapper, or visual style — and to every Mantine migration.
This is the **first rule every executor must read** before opening a task, source file, diff, or Storybook file.

**Forbidden:** creating a new component, Story, Story export, wrapper, utility chain, CSS rule, inline style, raw
visual value, or scanner allowlist before a canonical-reuse search has completed. A different filename, folder,
consumer, wrapper, Storybook title, viewport, locale, or copied markup is not a new requirement. Filename-only
searches are invalid: the executor must search by the required behavior and visual role, open every plausible
candidate, and inspect its production source and canonical Story.

**Canonical-reuse preflight — before any related write:** search the component catalog, `src/design-system/mantine/`,
`src/components/`, `src/modules/**/components/`, `src/stories/`, and colocated `*.stories.*` files with semantic
purpose/behavior terms, not only the proposed name. For every plausible candidate, inspect its API, rendered states,
canonical Story, and actual style/token path. Choose exactly one disposition:

- `REUSE` — consume the canonical source unchanged.
- `EXTEND` — add the missing behavior or state to its canonical owner and Story, then consume that owner.
- `COMPOSE` — assemble existing canonical sources without cloning their markup or styles.
- `CREATE` — allowed only after the search proves no inspected candidate can satisfy the requirement by reuse,
  extension, or composition; create the smallest native Mantine shared source and its direct canonical Story first.
- `STOP` — the boundary, candidate equivalence, or required visual contract is unclear; obtain an owner decision.

**No hardcoded visual UI:** for new or migrated UI, every visual value must come from the canonical native Mantine
component/theme-token path with the required TailAdmin provenance. New `className` utility chains, CSS/SCSS rules,
`style` objects, raw hex/px/rem values, arbitrary utilities, bespoke wrappers, and governance allowlists are
forbidden as substitutes for a canonical component, pattern, or token. Existing legacy styling may be preserved only
where the task explicitly keeps a legacy surface; it never authorizes adding a new local visual rule. A missing
canonical token or pattern is `STOP`, not permission to invent one.

**Receipt — task design, execution and review alike:**

`GR-0 CANONICAL REUSE PREFLIGHT — request: <component/Story/style>; semantic queries: <queries>; inspected candidates: <paths + Story IDs | NONE>; decision: <REUSE | EXTEND | COMPOSE | CREATE | STOP>; selected canonical owner: <path | NONE>; Mantine/TailAdmin token path: <path | NONE>; new hardcoded visual values: NONE; rationale: <why>.`

No receipt, an uninspected plausible candidate, a `CREATE` decision without the search evidence, or any new
hardcoded visual value makes the task invalid. The executor must emit `BLOCKED — GR-0 CANONICAL REUSE PREFLIGHT
MISSING` and make no related write; the reviewer returns `NEEDS REVISION`.

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

**Container exemption. Owner decision 2026-09-23 (Task 872, Sprint 81 D81-2), verbatim option chosen:**
*"View-stories достатньо (Recommended)"*. It resolves the conflict between this rule and `docs/component-rules.md` →
"Container / Presentational Primitive Split" (owner P0, 2026-07-10, which forbids a Story that mocks hooks). The
exemption holds only when **all** of the following are true:

1. The tier-1 node is a pure container, meaning 0 `className`, 0 `@/components/ui/*` imports, and no JSX of its own
   beyond rendering its View and passing slots.
2. Its UI lives entirely in a View that is enrolled in `scripts/mantine-migration-scope.json`.
3. That View has its own canonical Story.

Such a container is **proven by that View's Story** and gets no Story of its own. It still appears in the census.
The census cannot yet recognise the split, so the container stays as baselined debt, and the receipt counts it
separately: `tier1 <a> migrated+enrolled+story + <e> container-exempt (<names>)`. A node that fails any of the three
conditions is not exempt.

**Non-visual provider exemption. Owner decision 2026-09-24 (Task 876, Sprint 81 D81-4), verbatim:** *"AuthContext /
AuthProvider є non-visual state provider: він рендерить лише Context.Provider та children, не створює DOM/UI, має 0
className і не імпортує legacy UI primitives. Зміна лише його state/command contract не розширює GR‑1 на весь
src/app/[locale]/layout.tsx. Він не отримує Story або manifest entry; baseline entry layout лишається. GR‑1
застосовується до кожного візуального consumer-а, який показує цей стан; його canonical View Story має перевіряти
pending UI. Виняток не поширюється на provider, який сам рендерить будь-який UI."* The census for such a change is
the census of the visual consumer's surface, not of the provider's parent layout. A provider that renders any element
other than `Context.Provider` and `children` is not exempt.

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

## GR-3a — A Story existence preflight precedes every Story/page/export creation

Binds: `agent-contract` **16c**. Applies before creating a `*.stories.*` file, Storybook title, or Story export for
visible UI, and before retaining a legacy Story alongside a Mantine migration.

**Forbidden:** creating or retaining a parallel Storybook page when a canonical Story already directly imports the
same production component, or when an equivalent canonical composition renders that real component in the requested
state. A different title, folder, wrapper, gate enrolment, locale variant, or viewport variant is not a new proof
surface. Missing states extend the existing canonical Story; they do not justify another page. Locale and viewport
proof for Mantine remains toolbar-driven.

**Preflight — before any Story-related write:** search `src/stories/**` and colocated `*.stories.*` files for the
production component's direct import; inspect every canonical candidate's Storybook title, rendered states, and
locale/viewport mechanism. Record one candidate row per match. `CREATE` is allowed only when the search returns no
canonical candidate. If the component boundary, equivalence, or state coverage is unclear, stop for an owner decision.

**Receipt — task design, execution and review alike:**

`GR-3a STORY PREFLIGHT — <production component> × <requested state>; canonical candidates: <Story IDs | NONE>; direct-import evidence: <path:line | NONE>; toolbar coverage: locale=<mechanism>, viewport=<mechanism>; decision: <REUSE | EXTEND | CREATE | STOP>; target: <existing Story ID | NONE>; rationale: <why>.`

No receipt, a receipt with an uninspected candidate, or `CREATE` with any canonical candidate makes the task invalid.
The executor must emit `BLOCKED — GR-3a PREFLIGHT MISSING` and make no Story-related write; the reviewer returns
`NEEDS REVISION`.

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

**Role boundary:** this rule's approval/archive obligations belong to Opus. Sonnet records only the task's concise
current state and its implementation evidence; it must not approve, archive, or emit Git commands.

## GR-6 — Every Opus task-design/review response that writes a task/doc artifact ends with the owner-run git block

Binds `CLAUDE.md` → Git policy. **Task design** ends with `git add` + `git commit`, explicit paths, **never** `git
push`. **An approved review** ends with `git add` + `git commit` + `git push <verified-remote> <verified-branch>`.
A **non-approved review** contains no git command **for the implementation** — and that does **not** suppress the
task-design block for documents the same response authored. Conflating the two is how the block went missing on
2026-09-10.

**Commit-identity ban:** an owner-run `git commit` handoff must contain only the intended commit subject and any
task-required body. It must never append a `Co-Authored-By:` trailer. This explicitly forbids the Claude/Anthropic
identity trailer; do not substitute a different Claude model or address to evade it.

**Role boundary:** GR-6 and `.claude/hooks/orchestrator-response-gate.ps1` are Opus-only. Sonnet's executor
handoff ends with `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED` and contains
no `git add`, `git commit`, or `git push` command. Missing or ambiguous hook role metadata fails open; it never
turns a Sonnet backlog/session-log write into a Git-handoff demand.

**Receipt:** `GR-6 HANDOFF EMITTED — <task-design | approved-review | none: no artifact written>.`

## Enforcement status

| Rule | Enforced by | State |
|---|---|---|
| GR-0 | Sonnet `execute-task` first-read stop gate + orchestrator/executor/reviewer inspection + required receipt | **active** — a missing/invalid receipt or a non-canonical new visual value blocks the task by rule. |
| GR-1 | `scripts/check-rendered-scope.mjs` (`npm run check:rendered-scope`, **blocking**, Task 818), `scripts/check-surface-census-changed.mjs` (`npm run check:surface-census:changed`, **blocking**, Task 819 — maps the PR's own base..head diff to affected surfaces via `scripts/map-changed-surfaces.mjs` and censuses each with `scripts/check-surface-census.mjs --json`), `scripts/check-pattern-enrolment.mjs` (`npm run check:pattern-enrolment`, **blocking**, Task 820), **and** `scripts/check-media-enrolment.mjs` (`npm run check:media-enrolment`, **blocking**, Task 813) | **Enforced for both halves: the enrolled subgraph and pre-enrolment — and, for two directories, at the source.** Task 813 (2026-09-11) moved the project's canonical `<img>` render site, `AppImage.tsx` (and its co-located siblings), out of `src/components/ui/` — the literal path prefix both `check-rendered-scope.mjs` and `check-surface-census.mjs` classify as `tier2-legacy-primitive` — to `src/design-system/media/`, closing the tier-2 edge at its source for every consumer at once, and added `check:media-enrolment` (same shape as `check:pattern-enrolment`, directory-listing-driven, never a hard-coded name list) so that new directory does not ship ungoverned. Task 818 (2026-09-11) made `check:rendered-scope` blocking against a versioned, edge-keyed baseline (`scripts/rendered-scope-baseline.json`) — every component an *enrolled* surface renders is blocked from silently growing unmigrated. Task 819 (2026-09-11) closes the other half: `check-surface-census.mjs` (Task 817) censuses one named surface but took a `--surface` argument no CI job supplied, so a wholly unenrolled surface (the exact Task 809 shape) was invisible to every gate. `check:surface-census:changed` now runs in the same `governance` job, immediately after `check:rendered-scope:verify`: it fails closed (never a silent skip) when the merge base cannot be determined, either limit is exceeded, a changed file resolves to no surface, or a mapped surface's own census is unusable; every blocking node it finds is compared against its own versioned baseline (`scripts/surface-census-baseline.json`) the same way — baselined debt does not fail, a new block fails naming it, a stale entry fails, and a new `tier2-legacy-primitive` block can never be baselined away. Task 820 (2026-09-11, owner decision 5) closes GR-1's remaining gap for one directory by construction rather than by frontier-walking: every `.tsx` under `src/design-system/mantine/patterns/` must be a `scripts/mantine-migration-scope.json` entry, checked against the live directory listing (never a hard-coded name list), with the eleven Task 816 tier-3 allowlist entries retired as no longer needed — the manifest now enrols all 33 patterns directly. GR-1's `Command` block above (the by-hand, single-surface form) is unchanged and stays useful for ad-hoc inspection; it is not what CI runs. |
| GR-2 | reviewer inspection + receipt | active |
| GR-3 | `check:story-coverage` for enrolled components; `check-rendered-scope` blocking in CI for the enrolled-subgraph frontier (Task 818); `check-surface-census.mjs`/`check:surface-census:changed` blocking in CI for the pre-enrolment case (Task 819) — both check, per node, whether a canonical Mantine story imports it directly or through a single-hop `index.ts(x)` barrel re-export, never merely its parent, via the `story:<yes\|no>` column/field | **enforced for both halves** (Task 818, Task 819) — a rendered, unstoried component reachable from an enrolled root, or from any surface the current PR's diff actually touches, now blocks the PR. |
| GR-3a | orchestrator/executor/reviewer inspection + required receipt | **active** — automated duplicate detection is not yet implemented; an absent or invalid receipt blocks the task by rule. |
| GR-4 | reviewer inspection + receipt | active |
| GR-5 | **Opus-only `Stop` hook** `.claude/hooks/orchestrator-response-gate.ps1` — blocks an Opus response when `docs/backlog.md` records a task approved/archived and `docs/backlog-archive.md` is unchanged | **enforced** |
| GR-6 | **Opus-only `Stop` hook** — blocks an Opus task-design/review response when a `tasks/**` or governance doc is written and uncommitted with no required `git add` block, blocks `git push` outside an approved review, and blocks a `Co-Authored-By:` trailer in the handoff | **enforced** |

**A receipt is a self-report, and on 2026-09-10 the orchestrator skipped one under pressure in the same session that
wrote this file.** That is why GR-5 and GR-6 are now an **Opus-only `Stop` hook**: it reads the real `git status` and
the actual Opus response, and exits 2 — the response is blocked and must be fixed before it can finish. It is
fail-open on any error or absent role signal and honours `stop_hook_active`, so it can never wedge a Sonnet executor
with a prohibited Git command.

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
