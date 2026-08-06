# UI task-design requirements

Read this before defining scope, implementation requirements, acceptance criteria, or QA for any changed visible
artifact.

Classify every affected surface as current Mantine/TailAdmin or legacy shadcn/Tailwind. Identify its applicable
Storybook or rendered-proof path. In verified context, create a visual source map for each changed visible artifact and
each visually related artifact the task says to preserve or exclude:

| Visible artifact/state | Component/markup | Class/selector | Utility, cascade, and token path | Disposition | Evidence |
|---|---|---|---|---|---|

Trace utility classes to their generated CSS semantics and CSS variables to concrete tokens. State whether each item
is changed, preserved, or out of scope. Never describe a root cause or boundary only as “gradient”, “border”, or
“shadow” when inspected markup, classes, selectors, or tokens can name it.

Create a canonical UI decision record for every changed visible artifact:

| Visible artifact | Search queries and inspected paths | Canonical Mantine story/source | Disposition | Shared style/token path and required registration |
|---|---|---|---|---|

Use exactly `reuse`, `extend`, or `create canonical` as the disposition.

- `reuse`: consume the inspected shared source without copying styles locally.
- `extend`: name the canonical owner and story that change once for all in-scope consumers.
- `create canonical`: allow only after an evidenced search finds no suitable source; require the shared
  primitive/pattern/token, toolbar-reactive canonical story, and required catalog/coverage registration in the same
  task.

If a required visual value has no TailAdmin/design-system provenance, leave the task
`BLOCKED — CANONICAL STYLE DECISION REQUIRED`; do not authorize a guessed local value.

Reconcile the source map with the owner’s rendered outcome and any supplied visual evidence. A `preserve` or
`out of scope` classification requires positive evidence that it cannot cause the defect or prevent an acceptance
criterion. If it remains plausible, include it in scope or surface an owner decision as `AMBIGUOUS` or `CONFLICTING`.

Select the UI QA profile from `docs/qa-profiles.md`. Its viewport, locale, Storybook, and visual evidence requirements
are mandatory; do not promote a logic-only change to a full visual matrix without a concrete risk reason.
