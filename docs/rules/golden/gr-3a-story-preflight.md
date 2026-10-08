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

