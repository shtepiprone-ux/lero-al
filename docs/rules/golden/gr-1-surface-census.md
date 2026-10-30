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

**Container exemption. Owner decision 2026-09-23 (Task 872, Sprint 81 D81-2), option chosen:**
*"View Stories are enough (Recommended)"*. It resolves the conflict between this rule and `docs/component-rules.md` →
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

**Non-visual provider exemption. Owner decision 2026-09-24 (Task 876, Sprint 81 D81-4):** *"AuthContext / AuthProvider is a non-visual state provider: it renders only Context.Provider and children, creates
no DOM/UI, has 0 className and imports no legacy UI primitives. A change to only
its state/command contract does not extend GR‑1 to the whole src/app/[locale]/layout.tsx. It gets no Story
or manifest entry; the baseline entry for the layout stays. GR‑1 applies to every visual
consumer that shows this state; its canonical View Story must check the pending UI. The
exemption does not cover a provider that itself renders any UI."* The census for such a change is
the census of the visual consumer's surface, not of the provider's parent layout. A provider that renders any element
other than `Context.Provider` and `children` is not exempt.

