## GR-2 — A green gate is never evidence that a gate's blind spot is clean

**Forbidden:** citing `check:story-coverage` (or any gate) as proof for a component that gate does not inspect.
`check:story-coverage` validates only components already in `scripts/mantine-migration-scope.json`; an unenrolled
component is invisible to it. Task 809 read **34/34 green** with three unmigrated shadcn components on the page and
the very pattern it extended unenrolled.

**Receipt, whenever a gate result is used to close a requirement:**

`GR-2 SCOPE STATED — <gate> inspects <what>; it cannot see <what>; the criterion is closed by <the actual evidence>.`

