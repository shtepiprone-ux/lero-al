16d. **No component rendered by an in-scope surface may be excluded from it. Owner rule, 2026-09-10, written after
    Task 809 shipped `/favorites` with 53 `className` and two shadcn `Dialog`s still on the page.** Clause 16c
    forbids declaring a *Story* out of scope. Task 809 obeyed that wording and broke the rule anyway, by declaring
    the *components* out of scope instead — `CollectionsSection` (248 ln, 28 `className`, shadcn
    `Button`/`Input`/`Dialog`), `SaveToCollectionButton` (245 ln, 20 `className`, same three) and
    `FavoritesTypeFilter` (62 ln, 5 `className`, shadcn `Button`), none of them in
    `scripts/mantine-migration-scope.json`, none with a canonical Story of its own. That loophole is now closed:

    - **Every component the in-scope surface renders — including every popup, dialog, drawer, popover, toast and
      menu it opens — is itself in scope.** "It is a separate slice", "it is pre-existing", "it is only a child" and
      "the kickoff excluded it" are not exemptions. The orchestrator may not write such an exclusion; the executor
      must refuse a task that contains one and report `BLOCKED — CLAUSE 16d`; the reviewer must return
      `NEEDS REVISION` on finding one, whatever else the task achieved.
    - **A composition Story is not a component Story.** A Story that renders the parent proves nothing about a child
      that has no Story and no manifest entry — and `check:story-coverage` will still report green, because it only
      inspects components already enrolled. A green coverage number is therefore never evidence that this clause was
      satisfied.
    - **The census is mandatory and goes in the kickoff's verified context, run at design time and re-run at
      execution.** For every component the surface renders:

      ```powershell
      $surface = "src/modules/listings/components/FavoritesShell.tsx"
      Select-String -Path $surface -Pattern '^import .*from .*components' 
      Select-String -Path scripts\mantine-migration-scope.json -Pattern '<ComponentName>'
      Get-ChildItem -Recurse src\stories -Filter *.stories.tsx | Select-String -Pattern '<ComponentName>'
      ```

      A component with zero manifest hits and zero Story hits of its **own** is unmigrated. Migrate it and register
      it, or stop the task for an owner decision. Never publish, implement or approve around it.
    - The only exit is an **owner decision quoted verbatim with its date**, recorded in the sprint file. The task
      itself is never that authorization.
    - **The census is transitive; the scope is not. Three tiers, and every node lands in exactly one — added
      2026-09-10 at this clause's first application, because the literal reading would have swallowed `AppImage` and
      half the design system, and an unexecutable kickoff is its own failure.**
      1. **Feature components of this surface** — rendered here and carrying this surface's chrome. **Fully in
         scope**: migrated, given their own Story, enrolled in the manifest, in this task.
      2. **Legacy primitives they import** (`@/components/ui/*`). The surface must **stop importing them** — that is
         in scope and asserted by a zero-hit grep. Migrating the primitive *files* is not, because they are consumed
         repo-wide; name the separate task.
      3. **Shared components already proven elsewhere** — rendered here but owned by another surface. **Not this
         task's to migrate**, and equally **not permitted to go unlisted**: each appears in the census with its
         manifest and Story status, and any that lacks a Story of its own is **filed as a numbered task in the same
         response**. Passing over one silently is the same defect as excluding a tier-1 component.
      A node whose tier is genuinely unclear is an owner decision, not an executor's judgement call.

