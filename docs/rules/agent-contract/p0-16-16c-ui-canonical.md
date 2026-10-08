16. **TailAdmin is the visual source for current UI.** New or migrated UI, and any task changing rendered chrome,
    must trace visual values to `docs/tailadmin-style-reference.md` and use Mantine for behavior/responsiveness.
    Legacy surfaces keep their existing token source until migrated. TailAdmin side-by-side evidence is required
    when styling or chrome is in scope.

16a. **A missing TailAdmin reference requires provenance, not invention.** If the bundled reference has no example
    for an in-scope primitive, the orchestrator must establish a live-captured or owner-waived reference row with
    provenance before implementation. The executor must stop if that source-of-truth row is missing.

16b. **UI styles require canonical provenance before code.** For every visible UI artifact, the task and executor
    must record the canonical-story/component/pattern search, its result, and the reused, extended, or newly-created
    shared source. A component-local utility chain, inline value, or scanner allowlist is not evidence of a canonical
    style. If no suitable source exists, create and register one in the appropriate library or stop for the missing
    design decision; do not improvise a local style.

    **Canonical-reuse preflight is mandatory before creation.** Before creating a visible component, Storybook
    page/title/export, wrapper, or visual style, search semantic purpose/behavior terms across the component catalog,
    canonical Mantine patterns/primitives, production components, and Storybook; inspect every plausible candidate's
    source, API, canonical Story, rendered states, and token path. Reuse, extend, or compose a suitable candidate.
    `CREATE` is permitted only when the search evidence proves none can satisfy the requirement; create the smallest
    shared native Mantine source and direct canonical Story before a consumer. New/migrated UI may use only canonical
    Mantine components/theme tokens with TailAdmin provenance — never a local utility chain, CSS rule, inline style,
    raw visual value, arbitrary utility, bespoke wrapper, or scanner allowlist. The exact `GR-0 CANONICAL REUSE
    PREFLIGHT` receipt is mandatory before any related write. Its absence is `BLOCKED — GR-0 CANONICAL REUSE
    PREFLIGHT MISSING`.

    **Token resolution is mandatory.** Search the implemented registry first. If no suitable token exists, create the
    smallest shared semantic token (or a canonical component token only for an invariant), then consume it through the
    canonical component and every same-meaning consumer in the same change. Story-only/feature-only/one-use tokens
    and a local value while waiting for a token are forbidden. The executable sequence is
    `.claude/rules/shared/ui-token-contract.md`; its GR-12 parity receipt is required at design, execution, and review.

16c. **Canonical Mantine Stories are the visual source of truth and cannot be bypassed.** Before publishing a task
    that changes a visible Mantine-migrated artifact, the Opus orchestrator must inspect its corresponding canonical
    Mantine Story and put the required Story work in scope; before implementing it, the executor must re-verify that
    result. If that Story exists, the same task must preserve or update it so it renders the migrated artifact with
    the same canonical primitive and state; neither the orchestrator nor executor may declare the Story out of scope,
    rely on a divergent demo stand-in, or use route-only evidence as a substitute. If no corresponding canonical
    Mantine Story exists, create it first (or in the same task before consumer migration), register it and its
    migrated production source with the applicable story-coverage path, then perform the migration. A pattern Story
    that receives a behavior-bearing node through a slot is not proof for that node unless it renders the real
    production component or an equivalent canonical composition; otherwise update the Story or create that
    composition Story. Stop for an owner decision if the required Story boundary is genuinely ambiguous.

    **Story-creation preflight is mandatory.** Before creating a `*.stories.*` file, a Storybook title, or a Story
    export for visible UI — and before retaining a legacy Story alongside a Mantine migration — the orchestrator and
    executor must search canonical Stories for a direct import of the production component or an equivalent canonical
    composition, compare the requested state plus toolbar locale/viewport proof, and record the result through the
    `GR-3a STORY PREFLIGHT` receipt in `docs/rules/golden/gr-3a-story-preflight.md`. If a matching canonical Story
    exists, reuse it or add only the missing distinct state there; creating or retaining a parallel Story/page is forbidden. `CREATE` is
    permitted only when the receipt records zero canonical candidates. A missing, malformed, or ambiguous preflight
    is `BLOCKED — GR-3a PREFLIGHT MISSING`; no Story-related write may follow it.

