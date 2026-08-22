# Mantine migration — programme plan and pointer

**Status:** ACTIVE · **Owns:** the answer to "what is left before Tailwind can be deleted, and who is doing it"
**Created:** 2026-08-21 · **Supersedes as the migration's live pointer:**
`docs/mantine-tailadmin-migration-tracker.md` (last touched 2026-07-09 / Task 556) and
`tasks/Epics/Epic_MM_Mantine_UI_Migration.md` (last touched 2026-06-25 / highest task 484). Both are demoted to
**historical**. `docs/backlog.md`'s Pending Action Items row asking for this decision is answered by this file.

> **This file is a pointer, not a second source of truth.** It never restates task state. State lives in
> `docs/backlog.md` (registry + Last Session) and in each `tasks/Sprints/Sprint_NN_*.md` Tasks table. If this file
> and a sprint plan disagree, the sprint plan wins and this file is stale — fix it in the same edit that changed
> the sprint. The 2026-08-10 corollary ("the backlog is not one file, and updating it is not one edit") is the
> reason this warning is the second paragraph.

---

## 1. What the migration actually is

Two axes, repeatedly conflated, which is how "Homepage is complete" survived three months while being false:

- **ⓐ Composition** — does the surface use Mantine components? Mostly done. Cheap to measure, cheap to claim.
- **ⓑ Delivery** — does the surface still *depend on Tailwind being installed* to render correctly? This is the
  axis that decides whether `@import "tailwindcss"` can be deleted, and it is the one no route-level gate reads.

A surface can be 100 % Mantine on ⓐ and still fail ⓑ. `/[locale]` is exactly that surface today.

## 2. The three dependency classes (ⓑ)

Established by Task 762 Revision 1 and re-measured on `201683f9d`. Every future task states which class it touches.

| Class | What it is | Detector today | Blast radius when Tailwind is removed |
|---|---|---|---|
| **1 — utility strings** | Tailwind class names in `className=` / `cn()` | `governance:tailwind` census; no route-level gate | Rule vanishes; element loses the declaration entirely |
| **2 — Tailwind's own token names** | `var(--text-sm)`, `var(--container-3xl)`, `--tw-*` — names with **no project declaration** | `check:tailwind-runtime-tokens`, **`src/**/*.module.css` only** | Property computes to nothing (Category A) or the whole declaration drops (Category C) |
| **3 — `@theme inline` names** | `var(--space-3)`, `var(--text-2xs)`, `var(--color-ring)` — project-authored, **Tailwind-compiler-emitted** | **none** — the 762 classifier calls these `project` by design | Same as Class 2. Task 762's C-1 census measured it: every emitted `@theme inline` name is emitted **exclusively** inside Tailwind's `@layer theme{:host,:root{…}}`, 0 exceptions in 257 names |

**Class 3 is the large one and the invisible one.** Class 2 is bounded by a name collision with Tailwind's own
`theme.css`; Class 3 is bounded only by `globals.css`'s 185 `@theme inline` declarations.

**The standing trap:** replacing a Tailwind utility with `var(--color-muted)` passes every gate in the repository
and silently creates new Class-3 debt. The `:root`-declared twin `var(--muted)` is the correct target. Before
writing any token in a migration, grep its **declaring block** in `globals.css` — `:root` is safe,
`@theme inline` is debt. Never take this from a table; grep the definition.

## 3. Phase map

Order is set by measurability, not by size: **no phase fixes a reference a detector cannot yet see.** That
constraint is what moved the gate extension ahead of the small `.tsx` fixes.

| Phase | Scope | Home | State |
|---|---|---|---|
| **1** | `AppImage` — 21 variant strings + 4 inline strings, 9 variants, 14 consumers, and the coupled `group`/`group-hover` pair | Sprint 63 · Task **763** | in review |
| **2** | `MantineListingCardPattern.tsx:305-306` (`flex flex-col`, `grayscale opacity-60`) · `LocaleSwitcher.tsx:55` (`animate-spin`) · whatever Phase 1's hover finding hands over | Sprint 63 | NOT FILED |
| **3** | Extend `check:tailwind-runtime-tokens` to `src/**/*.{ts,tsx}`, then pay the 6 Class-2 `.tsx` references and **inventory** all 43 Class-3 references in the route | **Sprint 62** (its stated goal) | NOT FILED |
| **4** | Route shell — `layout.tsx:50` `min-h-[calc(100vh-4rem)]` and its author-applied `design-tokens-allow` marker | Sprint 63 | NOT FILED — fold into Phase 3 if co-scheduled |
| **5** | **`globals.css`** — `@theme inline` (185 names) → `:root`, 10 `@apply` sites, 3 `@import`, `@custom-variant`, `@source not`, and a re-measure of `@layer` ordering once Tailwind stops emitting `@layer theme, base, components, utilities;` | **own sprint** | NOT FILED — **the actual blocker** |
| **6** | Route-level Mantine/Tailwind certification for `/<locale>` | Sprint 59 · Task **667** | BLOCKED on owner decision |
| **7** | Repeat 1-5 per route: `/listings`, `/[slug]`, `/cabinet`, `/contact`, admin, then `src/components/ui/*` (shadcn residue) | not opened | future |
| **8** | Delete Tailwind: drop the three `@import`s, `tailwindcss` + `@tailwindcss/postcss` + `tw-animate-css` + `shadcn` from `package.json`, `postcss.config.mjs`, and every governance script that scans for it | not opened | future |

**Phases 1-4 do not make Homepage Tailwind-independent.** Only Phase 5 does. Everything before it empties the
consumer side so Phase 5 does not convert latent debt into a rendered regression on the same commit.

## 4. Invariants every migration task inherits

1. **The control ships before or with the fix, never after.** Two-armed plant that demonstrably fails, plus a
   pre-plant census proving no other gate would have caught it. (Sprint 62 → 63; four prior tasks failed
   identically.)
2. **Exemptions are conditions a gate evaluates, never comments an author writes.** No `design-tokens-allow:`
   marker may be added to pass. A rejection is reported as a `CONFLICT`.
3. **Reproduce the compiled declaration, not the intent.** Extract the prior utility's own rule from the built CSS
   (I1). A utility you could not find is `UNKNOWN`, never "emits nothing".
4. **Token reference, never resolved value (N1)** — except where I1 measures the token as unemitted in every built
   stylesheet, in which case the literal is correct and the substitution is recorded.
5. **Name the declaring block of every token written.** `:root` or `@theme inline`. A new `@theme inline`
   reference adds a Phase 3 inventory row in the same commit.
6. **Cascade standing is part of the preserved behaviour (D34).** A D28 migration reproduces the utility's losing
   standing (`@layer utilities`); a cascade-trap fix that overrides a dead utility stays unlayered. State which
   case the file is, in the file.
7. **Replacement classes are semantic, not utility-shaped.** A CSS Module full of `.relative` / `.widthFull` /
   `.overflowHidden` is a private Tailwind, not a migration. Name classes for the role the element plays.
8. **No permanent Storybook markup to satisfy a gate.** Reversible probe with `git hash-object` restoration
   evidence, or an existing story, or a non-rendered comparator.
9. **`npm run build` exit 0 on every non-Q0 task**, transcript retained.

## 5. Known measurement traps

- **The import graph over-states the render graph.** A barrel `index.ts` pulls the whole pattern library:
  `/[locale]` is 110 files barrel-resolved and 143 naive. Any census that does not resolve barrels by imported
  symbol is measuring the wrong set. This is why Phase 6 exists.
- **A grep hit is discovery, never verification.** `grep -l AppImage src/stories/` finds files that *mention* it,
  including ones that render a Mantine stand-in instead (backlog item 746). Open the story and read what it
  renders before citing it as a proof path.
- **Comment text scores as code.** A regex census over `.module.css` that does not strip `/* … */` reports
  migration notes as live debt. Use the gate's own exported functions, not a fresh regex.
- **`check:tailwind-runtime-tokens` green means "pinned", not "paid"** — and pinned over 23 files, no `.tsx`.
- **`@theme inline` is tree-shaken.** A token declared there may not be emitted at all; `--duration-slow` and
  `--ease-standard` are declared and absent from every built stylesheet. Grep the built CSS, not `globals.css`.

## 6. Open owner decisions

| ID | Decision | Where it lives |
|---|---|---|
| D63-A | Does `PerfDevOverlay` (dev-only, `return null` in production) count as production surface for "zero Tailwind"? | `Sprint_63_Homepage_Exits_Tailwind.md` |
| D63-B | `docs/backlog.md` line 20's "ⓑ De-Tailwind ✅ COMPLETE for the homepage card pair" is measurably false — flagged in place, not rewritten. Correct now or at Phase 2 closure? | same |
| D63-C | Sprint 59: re-scope 667 onto another mechanism, or close the sprint with it? Phase 6 has no home until this resolves. | `docs/backlog.md` → Sprints |
| D63-D | Phase 5 (`globals.css`) opens its own sprint (recommended) or extends 63? | `Sprint_63_Homepage_Exits_Tailwind.md` |
| **D63-E** | Task 763's `listing` hover: accept a measured 1.1025× → 1.05× change, or fold the effect into the card pattern's own rule? See §7. | Task 763 review |

## 7. The transferable question this migration must answer

Not "is Homepage migrated". That question has been answered "yes" three times and been wrong three times.

**What detector would have caught `MantineListingCardPattern.tsx:304-306` before the backlog claimed the card pair
was complete?** Build it, or record in writing why none is worth building. Phase 6 is the candidate; Sprint 63's
exit criterion 4 is where the answer goes. Until it exists, every "migrated" claim in this repository is an
assertion about the last file someone happened to open.

---

## Maintenance

Update this file **only** when a phase opens, closes, or moves sprint, or when an invariant changes — in the same
edit as the sprint plan and `docs/backlog.md`. Do not record task status here. Do not let it grow into a second
backlog; if it exceeds roughly 150 lines it has started restating something that already has an owner.
