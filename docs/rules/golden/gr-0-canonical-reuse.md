## GR-0 — Search canonical sources first; reuse or extend them; never hardcode a parallel UI

**Opus ordering, owner decision 2026-10-20:** apply
[canonical-component-reuse.md](../../../.claude/rules/shared/canonical-component-reuse.md) before external research
at task creation/revision and review. Ready Mantine components/Stories are the reuse baseline; research only named
gaps or reproduced defects. Create a canonical component plus direct Story only when no suitable owner exists.

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

Before a guarded UI write the receipt is registered through `emit-phase-receipt.ps1 -Kind CanonicalReuse`
(`.claude/rules/shared/enforcement-model.md`); prose beside a tool call is not retained as transcript text. A `STOP`
decision is a stop and never authorizes the write.

No receipt, an uninspected plausible candidate, a `CREATE` decision without the search evidence, or any new
hardcoded visual value makes the task invalid. The executor must emit `BLOCKED — GR-0 CANONICAL REUSE PREFLIGHT
MISSING` and make no related write; the reviewer returns `NEEDS REVISION`.

