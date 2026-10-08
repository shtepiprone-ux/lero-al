## GR-3 — A composition Story is not a component Story

**Forbidden:** treating a Story that renders the parent as proof for a child that has no Story of its own. If no
canonical Mantine Story exists for a changed visible component, **create it** — before the consumer composition, per
`agent-contract` 16c.

**Receipt:** `GR-3 STORY PROVEN — <component> ← <its own story file>` per changed visible component. The word "own" is
literal: the file must import that component by name.

