# Session Archive: Task 253 — Compress AI governance + concrete task templates — 2026-05-27

**Role:** Opus 4.7 — orchestrator / architect / reviewer. **No product code touched.**

## Scope of this task

`docs/` and `tasks/` only. Allowed surfaces:
- `docs/agent-contract.md` (new)
- `docs/rule-index.md` (new)
- `docs/orchestrator-role.md` (update)
- `docs/ai-behavior.md` (refactor in place)
- `docs/backlog.md` (Task 253 entry)
- `docs/sessions/2026-05-27-task-253-governance-compression.md` (this file)

Forbidden:
- `src/`, `app/`, `components/`, `modules/`, server actions, migrations, runtime UI, styling.
- `messages/*.json`.

## Investigation findings

### Sizes of governance docs (before refactor)

```
ai-behavior.md            652 lines
performance.md           1467 lines (out of scope — not a Sonnet rule doc)
governance-enforcement.md 629 lines
maintenance-playbook.md   584 lines
ui-rules.md               576 lines
governance-checklists.md  487 lines
component-risk-register   406 lines
component-governance.md   388 lines
integrations.md           334 lines
tailwind-governance.md    333 lines
state-authority.md        305 lines
tailwind-canonical-frag.. 299 lines
eslint-debt-taxonomy.md   285 lines
responsive-governance.md  275 lines
responsive-audit.md       269 lines
storybook-governance.md   266 lines
responsive-screenshot-go. 263 lines
component-catalog-gov.    261 lines
component-catalog.md      244 lines
architecture.md           239 lines
data-access-rules.md      219 lines
qa-rules.md               211 lines
domain-rules.md           207 lines
backlog.md                196 lines
storybook-visual-snap.    197 lines
orchestrator-role.md      130 lines
```

### Where the canonical task template currently lives

`docs/ai-behavior.md` lines 586–653 ("Canonical Task Template (enforced from 2026-05-19)").

### Where the existing-control / UX-flow / self-validation rules live

- Note 18 (Pre-Completion Self-Validation): `ai-behavior.md` lines 55–110.
- Note 19 (UX Flow Preservation): `ai-behavior.md` lines 112–139.
- Note 20 (Existing-Control Preservation): `ai-behavior.md` lines 141–168.

`orchestrator-role.md` references all three in its "Hard contract embedded in EVERY Sonnet prompt" (lines 67–98) and "Review checklist" (lines 100–130). These references must keep working after the refactor.

### Rules that are duplicated across docs (one source of truth must be chosen)

| Rule | Currently in | Decision |
|---|---|---|
| Localization sq/en/uk/it required | `ai-behavior.md`, `ui-rules.md`, `governance-checklists.md`, `governance-enforcement.md`, 19 other docs (grep) | **SoT: `agent-contract.md` P0 + `ai-behavior.md` "Localization (i18n) Rules" (long form). Other docs keep their own task-specific guidance but cite agent-contract for the four-locale rule itself.** |
| Responsive 320 / 375 / 390 / 768 / 1280 / 1440 / 2560 | `ai-behavior.md`, `ui-rules.md`, `responsive-governance.md`, 16 other docs | **SoT: `agent-contract.md` P0 + `responsive-governance.md` (long form). Other docs cite agent-contract for the breakpoint list.** |
| Single-writer git ("only owner runs git, in PowerShell") | `ai-behavior.md`, `orchestrator-role.md`, `CLAUDE.md` | **SoT: `orchestrator-role.md` "Environment & git safety" (long form, with recovery). `ai-behavior.md` keeps a short pointer. `agent-contract.md` carries the one-line P0 ban.** |
| No-hardcode (strings, colors, tokens) | `ai-behavior.md` Note 14, `component-rules.md`, `ui-rules.md`, `governance-enforcement.md` | **SoT: `component-rules.md` "Zero Hardcode Rule" + `ai-behavior.md` Note 14 ("Global Change Verification Rule"). Other docs cite these. `agent-contract.md` carries the one-line ban.** |
| Validation gate (`npx tsc --noEmit` → 0 errors before "complete") | `ai-behavior.md` "After Every Change", `ai-behavior.md` Note 18, `qa-rules.md` "Before Every Commit" | **SoT: `ai-behavior.md` Note 18 (Pre-Completion Self-Validation). `agent-contract.md` carries the one-line P0 (`run required validation before claiming complete`).** |
| Session-log requirement (`docs/sessions/<date>-<slug>.md` per task) | `ai-behavior.md` "Backlog & Session Log Rules" | **SoT: `ai-behavior.md` "Backlog & Session Log Rules". Unchanged.** |
| Existing-control preservation | `ai-behavior.md` Note 20, `orchestrator-role.md` "Existing controls preserved" | **SoT: `ai-behavior.md` Note 20. `agent-contract.md` adds the one-line ban + the new Control-Relocation rule extension.** |
| Scope-control (no scope change, no invented architecture) | `ai-behavior.md` "Scope Isolation Rules", `orchestrator-role.md` "Hard contract" | **SoT: `orchestrator-role.md` Hard contract. `ai-behavior.md` keeps its own scope rules. `agent-contract.md` carries the one-line ban.** |
| Diff-is-proof, not session log | `orchestrator-role.md` "Orchestrator loop" + "Review checklist" | **SoT: `orchestrator-role.md` — no change in location, only emphasis strengthened.** |
| Task pre-read selection | `ai-behavior.md` "Execution Protocol" + Canonical Task Template "Pre-read" | **SoT: `rule-index.md` (new). Task template just says "use docs/rule-index.md for your task type".** |
| Canonical Task Template structure | `ai-behavior.md` lines 586–653 | **SoT: `ai-behavior.md` "Canonical Task Template" (refactored in this task to become concrete + behavior-based).** |
| Note 18 self-validation intent | `ai-behavior.md` Note 18 | **SoT: `ai-behavior.md` Note 18 (preserved unchanged in intent). `agent-contract.md` references it.** |
| Note 19 UX-flow preservation intent | `ai-behavior.md` Note 19 | **SoT: `ai-behavior.md` Note 19 (preserved unchanged in intent). `agent-contract.md` references it.** |
| Note 20 control preservation intent | `ai-behavior.md` Note 20 | **SoT: `ai-behavior.md` Note 20 (preserved unchanged in intent + extended with the new Control Relocation rule below). `agent-contract.md` references it.** |
| Global task numbering | `ai-behavior.md` Canonical Task Template + `docs/backlog.md` "Last task number" | **SoT: `docs/backlog.md` (the line "Last task number: NNN"). Template references it.** |

### Mandatory migration map (from Task 253 spec)

| Existing rule / section | Current file | New source of truth | Action |
|---|---|---|---|
| Global task numbering | `docs/backlog.md` / `ai-behavior.md` | `docs/backlog.md` (Next Immediate Tasks heading line "Last task number: NNN") + `ai-behavior.md` reference | Preserve |
| Canonical Task Template | `ai-behavior.md` lines 586–653 | `ai-behavior.md` (refactored, same location) | Refactor to concrete behavior-based template |
| Note 18 self-validation | `ai-behavior.md` lines 55–110 | `ai-behavior.md` (same location) + `agent-contract.md` reference | Preserve, link from agent-contract |
| Note 19 UX-flow preservation | `ai-behavior.md` lines 112–139 | `ai-behavior.md` (same location) + `agent-contract.md` reference | Preserve, link from agent-contract |
| Note 20 control preservation | `ai-behavior.md` lines 141–168 | `ai-behavior.md` (same location) + `agent-contract.md` reference + new "Control Relocation Rule" sub-rule | Preserve, extend |
| Localization sq/en/uk/it | many docs | `agent-contract.md` (one-line P0) + `ai-behavior.md` "Localization (i18n) Rules" (long form) | Deduplicate via reference |
| Responsive breakpoints | many docs | `agent-contract.md` (one-line P0) + `responsive-governance.md` (long form) | Deduplicate via reference |
| Git ownership rule | `ai-behavior.md` + `orchestrator-role.md` | `orchestrator-role.md` "Environment & git safety" (long form) + `ai-behavior.md` short pointer + `agent-contract.md` P0 ban | Deduplicate, shorten ai-behavior block |
| Validation rules | `ai-behavior.md` + `qa-rules.md` | `ai-behavior.md` Note 18 (long form) + `agent-contract.md` P0 ban | Reference, do not duplicate Note 18 elsewhere |
| Session log requirements | `ai-behavior.md` "Backlog & Session Log Rules" | `ai-behavior.md` (unchanged) + `agent-contract.md` P0 ban | Preserve |
| Existing-control preservation | `ai-behavior.md` Note 20 + `orchestrator-role.md` review checklist | `ai-behavior.md` Note 20 + extension "Control Relocation Rule" + `agent-contract.md` P0 ban | Preserve and strengthen |
| Pre-read selection | `ai-behavior.md` Execution Protocol + Canonical Task Template | `rule-index.md` (NEW) | Move + reference |

### Rules that I will NOT change

- `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`, `docs/data-access-rules.md`, `docs/rls-rules.md`, `docs/domain-rules.md`, `docs/env.md`, `docs/responsive-governance.md`, `docs/component-governance.md`, `docs/governance-checklists.md`, `docs/governance-enforcement.md`, `docs/state-authority.md`, `docs/integrations.md`, `docs/performance.md`, `docs/architecture.md`, `docs/dependencies.md`, `docs/storybook-*.md`, `docs/tailwind-*.md`, `docs/component-catalog*.md`, `docs/component-risk-register.md`, `docs/responsive-audit.md`, `docs/responsive-screenshot-*.md`, `docs/ui-audit.md`, `docs/app-lifecycle-contract.md`, `docs/eslint-debt-taxonomy.md`, `docs/maintenance-playbook.md`, `docs/analytics-rules.md`.

These docs already are referenced from the new `rule-index.md` and do not duplicate the P0 contract themselves. Touching them is out of scope and would explode the diff. If a doc carries a duplicated rule (e.g. four-locale wording inside `governance-checklists.md`), it is treated as an in-context reminder, not a competing source of truth, and is left alone.

### Files to be changed (final list)

1. `docs/agent-contract.md` (new) — short P0 Sonnet contract.
2. `docs/rule-index.md` (new) — task-type → required/optional pre-read map.
3. `docs/orchestrator-role.md` — append "actual-diff-is-proof" emphasis + reference to new agent-contract/rule-index/task template.
4. `docs/ai-behavior.md` — insert P0 pointer at the top, refactor Canonical Task Template, append three new rules (Control Relocation, Admin Table Preservation, Edit-Flow Preservation) as new Notes 21/22/23 inside Note 20's neighborhood.
5. `docs/backlog.md` — Task 253 entry in Last Session + Session Archive.
6. `docs/sessions/2026-05-27-task-253-governance-compression.md` (this file).

## How future Sonnet prompts must select docs

Every kickoff prompt for Sonnet 4.6 from this point forward MUST use this structure:

```
Pre-read (mandatory before any code change):
1. docs/agent-contract.md
2. docs/backlog.md
3. Task-relevant docs from docs/rule-index.md → "<task type>"
4. Inspect package.json for current validation scripts.
```

`"Read all docs"` and "Read every file in /docs" wording is forbidden from this task forward.

## How future Opus reviews must verify Sonnet output

1. Open the actual `git diff` (or `git show` of the executor's commits) — do NOT trust the session-log "Files Changed" table without checking.
2. Run the orchestrator-role.md "Review checklist" against the diff (already exists; reinforced by this task).
3. Specifically check that:
   - Every UI/control surface in the diff has a before/after control inventory in the session log (Note 20).
   - Every flow-touching surface has a UX flow trace (Note 19).
   - Every task has the self-validation verdict line (Note 18).
   - Locales `sq`/`en`/`uk`/`it` all gained the same key set, never three of four.
   - Required breakpoints from the kickoff are covered.
4. Approve OR open a follow-up task. Never silently fix executor mistakes by writing code from the orchestrator session.

## Remaining docs/governance debt (not addressed in this task)

- `governance-enforcement.md` (629 lines) and `maintenance-playbook.md` (584 lines) still duplicate snippets of the P0 rules (localization, no-hardcode, breakpoints). They are out of scope here. A future pass could trim them to reference `agent-contract.md`, but doing it now would risk silently weakening governance gates. **Recommended follow-up:** dedicated task "trim governance-enforcement.md + maintenance-playbook.md duplications to reference agent-contract.md" after the new structure has been in use for at least one sprint.
- `governance-checklists.md` Checklist A/B duplicate parts of Note 18. They remain valuable as in-task self-check templates; not collapsing them.

## Validation performed (Task 253)

Grep-based checks (run via Read tool + bash, since this is a docs/governance-only task — no code touched, so `npx tsc --noEmit` and `npm run build` are not in scope for this task; they remain mandatory for every product-code task that follows).

| Check | Result |
|---|---|
| `docs/agent-contract.md` exists and is short (40 lines, 4 181 B) | ✅ |
| `docs/agent-contract.md` contains the P0 Sonnet Contract (10 clauses) | ✅ |
| `docs/rule-index.md` exists (193 lines, 5 472 B) and maps task types to relevant docs | ✅ |
| `docs/orchestrator-role.md` references `agent-contract.md` + `rule-index.md` | ✅ (3 references) |
| `docs/orchestrator-role.md` carries the explicit "Approval rule" section requiring actual diff review | ✅ (added at the end of the file) |
| `docs/ai-behavior.md` top references `agent-contract.md` + `rule-index.md` | ✅ (lines 1–9) |
| `docs/ai-behavior.md` Note 18 / Note 19 / Note 20 preserved | ✅ (lines 65 / 122 / 151) |
| `docs/ai-behavior.md` Note 21 (Control Relocation) + Note 22 (Admin Table) + Note 23 (Edit-Flow) added | ✅ (lines 180 / 206 / 232) |
| `docs/ai-behavior.md` Canonical Task Template refactored with `Current behavior to preserve` + `Required after behavior` + conditional sub-blocks | ✅ (line 672, "refactored 2026-05-27 by Task 253") |
| Migration map present in this session log | ✅ (table above) |
| `docs/backlog.md` Last Session updated; "Last task number: 253"; Session Archive row for Task 253 | ✅ |
| `docs/backlog.md` active block stays within ~80-line limit | ✅ (80 lines above the Session Archive header) |
| "Read all docs" forbidden wording — only appears in the new files explicitly forbidding it | ✅ (4 hits, all of the form "never read all docs") |
| No `src/`, `app/`, `components/`, `modules/`, `messages/`, migrations, or runtime UI touched | ✅ (verified via `ls` mtimes — those directories last modified 2026-05-23, well before this session) |
| Single-writer git rule respected — no mutating git commands executed | ✅ (file edits only) |

Validation verdict: tsc/build N/A (no product code) · docs structure = green · migration map = present · Notes 18/19/20 preserved · Notes 21/22/23 added · scope = clean.

## Ready-to-run git commands for owner

```
git add docs/agent-contract.md docs/rule-index.md docs/orchestrator-role.md docs/ai-behavior.md docs/backlog.md docs/sessions/2026-05-27-task-253-governance-compression.md
git commit -m "chore(Task253): AI governance compression — agent-contract.md + rule-index.md + Notes 21/22/23 + refactored Canonical Task Template"
```

Run these in PowerShell from the repo root. Single `git add` line with explicit paths — do NOT add `^` or backtick continuations (PowerShell silently no-ops them; orchestrator-role.md "Hard contract" 2026-05-22 lesson).
