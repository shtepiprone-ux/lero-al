# Sprint 63 — Homepage exits Tailwind

**Opened:** 2026-08-21 · **Status:** 🟠 OPEN · **Measured against:** `main` @ `201683f9d`, worktree clean

## Goal

`/[locale]` is Mantine-first in composition and is **not** independent of Tailwind in delivery. Three distinct
dependency classes keep it coupled, and only one of them is visible to any gate in this repository:

1. **Tailwind utility strings still shipped in the render graph** (`className=` / `cn()`), in four production files.
2. **Tailwind-owned custom properties read at runtime** — `var(--text-3xl)`, `var(--container-3xl)` and friends.
   These have no project declaration at all; they come out of `node_modules/tailwindcss/theme.css`.
3. **`@theme inline` custom properties** — project-authored names whose *emission mechanism* is the Tailwind
   compiler. Task 762's own C-1 census (`docs/sessions/evidence/task762-r1/emission-census.json`) measured this and
   turned it from inference into fact: **every emitted `@theme inline` name (49/185) is emitted exclusively inside
   Tailwind's compiler-generated `@layer theme{:host,:root{…}}`. Zero exceptions across all 257 names.** This is the
   class `--space-*` belongs to, and it is the largest of the three by an order of magnitude.

The sprint's goal is to take `/[locale]` to **zero references in all three classes**, in an order where each phase
is measurable by a gate that exists before the phase runs.

## Corrections to the pre-sprint audit — measured 2026-08-21

The owner's audit of `201683f9d` is the starting point. Five of its claims reproduced; three did not, and one is
materially understated. Every row below was re-measured on `201683f9d` with a clean worktree.

| Audit claim | Verdict | Measurement |
|---|---|---|
| AuthSheet (757/757R) closed, no Tailwind utilities in its JSX | **FACT** | No `className=` Tailwind token in `AuthSheet.tsx`; its one remaining runtime-token row (`--radius-lg`) is in the 762 baseline. |
| `layout.tsx:50` carries `min-h-[calc(100vh-4rem)]` | **FACT, plus one** | Confirmed. It also carries an author-applied `design-tokens-allow:` marker on the same line, and `pb={{ base: 'var(--space-14)' }}` — a Category-B reference the audit did not name. |
| `AppImage` still carries Tailwind classes | **FACT, understated** | The classes live in **two** files, not one: `AppImage.tsx` (4 inline strings, lines 144-152) and `appImageConfig.ts` (**21 strings across 9 variants**, lines 64-173). 19 distinct utilities. `AppImage` has **14 production consumers**; three are on the homepage graph. |
| `ListingFeatureIcon` is not debt | **FACT** | No Tailwind token in the file. Confirmed by the render-graph sweep below. |
| Runtime debt is "14 baseline pairs" | **UNDERSTATED — this is the finding that reorders the plan** | The 14 are only the *name-collision* bucket (a name Tailwind's own `theme.css`/`index.css` also declares). The `/[locale]` render graph additionally reads **43 `@theme inline` references across 12 `.module.css` files and 3 `.tsx` files** which the gate classifies `project` and does not flag — and which die with Tailwind for exactly the reason the gate's own header states. Full census in §"Measured state" below. |
| Homepage's direct token reads: `--text-3xl/4xl/5xl/xl/2xl`, `--container-3xl` | **FACT, plus a gate gap** | Confirmed at `page.tsx:31,34` and `HeroSearchView.tsx:50`. **`check:tailwind-runtime-tokens` cannot see any of them** — it collects `src/**/*.module.css` only (`collectModuleCssFiles`, line 302). `--container-3xl` has **no declaration anywhere in `src/`**; its only source is `node_modules/tailwindcss/theme.css` (`48rem`). |
| `globals.css` is the global blocker | **FACT** | 3 `@import`, 1 `@custom-variant`, 3 `@source not`, `@theme inline` at 35-316 (**185 names**), 10 `@apply` sites at 550-598 inside `@layer base` (`*`, `html`, `body`, `:focus-visible`, 3 scrollbar rules, `h1-h6`, `p`, `img`). |
| `container-wide` is hand-written CSS, not a Tailwind utility | **FACT, with a caveat worth a checkpoint** | Hand-written at `globals.css:643`. But it is declared **inside `@layer utilities`**. Removing `@import "tailwindcss"` removes the `@layer theme, base, components, utilities;` order declaration Tailwind emits. Layer *order* survives (first-appearance in `globals.css`), but the D34 argument that a layered rule loses to every unlayered rule — which `HeroSearchView.module.css`'s header depends on by name — must be re-measured, not assumed, at Phase 5. |
| "Only AppImage remains on Homepage" | **CONTRADICTED** | `MantineListingCardPattern.tsx:304-306` passes three literal Tailwind strings into `cn()` in production: `'group'`, `'flex flex-col'`, and `isArchived && 'grayscale opacity-60'`. This is the Featured/Latest card. It contradicts `docs/backlog.md`'s "ⓑ De-Tailwind (D28): ✅ COMPLETE for the homepage card pair". Also in the graph: `LocaleSwitcher.tsx:55` `animate-spin` (header) and `PerfDevOverlay.tsx` (9 strings, dev-only — `process.env.NODE_ENV !== 'development'` early return at line 15). |
| "No CI gate proves Mantine composition of the full `/[locale]` route" | **FACT, and already recorded** | `docs/backlog.md` carries this verbatim, dated 2026-07-26. Sprint 59 exists for it and is stalled: 751 shelved by owner decision, 667 `reserved`/BLOCKED, **zero landed tasks**. This sprint does not re-file it; it names the dependency. |

**`'group'` is load-bearing and couples two of the phases.** `appImageConfig.ts:66` is `hoverClass: 'group-hover:scale-105'`; `MantineListingCardPattern.tsx:304` supplies the `group` ancestor, with an in-file comment naming Task 691R finding F-A as the reason. Migrating either one alone re-opens F-A. They move together, in Phase 1.

## Measured state of `/[locale]` — 2026-08-21

Render graph resolved from `layout.tsx` + `page.tsx`, following `@/` and relative imports and **resolving barrel
re-exports by imported symbol** rather than pulling every file a barrel touches: **110 `.ts`/`.tsx` files, 16
`.module.css` files.** The naive import walk returns 143 files because `design-system/mantine/patterns/index.ts`
re-exports the whole pattern library; the difference is why Sprint 59's route inventory exists.

### Class 1 — Tailwind utility strings in the render graph

| File | Sites | Content |
|---|---|---|
| `src/components/ui/appImageConfig.ts` | 21 strings, 9 variants | `containerClass` ×9, `imageClass` ×9, `hoverClass` ×3 |
| `src/components/ui/AppImage.tsx` | 4 strings, lines 144-152 | `absolute inset-0 w-full h-full` · `transition duration-300` · `opacity-100` · `opacity-0` |
| `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` | 3 strings, lines 304-306 | `group` · `flex flex-col` · `grayscale opacity-60` |
| `src/app/[locale]/layout.tsx` | 1, line 50 | `min-h-[calc(100vh-4rem)]` + `design-tokens-allow:` marker |
| `src/components/shared/LocaleSwitcher.tsx` | 1, line 55 | `animate-spin` |
| `src/components/shared/PerfDevOverlay.tsx` | 9, lines 26-93 | dev-only; stripped from production by a build-time constant |

Nothing else in the 110-file graph carries a Tailwind class. `HeaderView.tsx:170`'s `h-5 w-5` is inside a Task 706
comment recording its own removal; `PopularLocationsView.tsx`'s `CITY_GRADIENTS` are `styles.gradientN` module
classes; every other hit is a Mantine prop value (`justify="flex-start"`, `display="flex"`, `pos="relative"`).

### Class 2 — Tailwind's own names, no project declaration (gate-visible only in `.module.css`)

| File | Names | Gate sees it? |
|---|---|---|
| `FooterView.module.css` | `--text-sm`, `--text-sm--line-height`, `--text-xl`, `--text-xl--line-height`, `--text-xs`, `--text-xs--line-height` | ✅ baseline |
| `HeaderView.module.css` | `--text-sm`, `--text-sm--line-height`, `--text-xl`, `--text-xl--line-height` | ✅ baseline |
| `MobileNavDrawer.module.css` | `--text-sm`, `--text-sm--line-height` | ✅ baseline |
| `MantineCopyIdButton.module.css` | `--font-mono` | ✅ baseline |
| `AuthSheet.module.css` | `--radius-lg` | ✅ baseline |
| `src/app/[locale]/page.tsx` | `--text-xl`, `--text-2xl`, `--text-3xl`, `--text-4xl`, `--text-5xl` | ❌ **invisible** |
| `src/components/shared/HeroSearchView.tsx` | `--container-3xl` | ❌ **invisible** |

`--radius` is **not** in this class despite appearing in Tailwind's `theme.css`: that declaration is inside
`@theme default inline reference` ("Deprecated"), which the gate's extractor does not read, and `globals.css:445`
declares `--radius: 0.75rem` in plain `:root`. Verified by calling `loadTailwindOwnedNames()` directly:
`--radius → false`, `--radius-lg → true`, `--container-3xl → true`. Do not re-audit it.

### Class 3 — `@theme inline` names in the render graph (gate classifies `project`, does not flag)

43 references. `.tsx`: `page.tsx` (`--space-16`, `--space-24`), `layout.tsx` (`--space-14`),
`MantineHomeSection.tsx` (`--home-section-py-base/md/lg`). `.module.css`: `HeaderView`, `FooterView`,
`MobileBottomNavView`, `HeroSearchView`, `MantineListingCardPattern`, `ListingCard`, `FeaturedListingsView`,
`LatestListingsView`, `MantineCopyIdButton` — `--space-0/1/2/2-5/3/5/6/8/11/12/14/16/20`, `--color-badge-premium`,
`--color-muted-foreground`, `--color-ring`, `--color-status-success`, `--shadow-listing-card-elevation-lg`,
`--text-2xs`.

**This class is not a judgement call.** The gate's own header states it: *"the broader, now-measured fact — that ALL
185 `@theme inline` names share Category C's emission mechanism — is named here … as still-latent debt this gate
does not fully close."* Sprint 62 deliberately bounded it out. Sprint 63 does not get to.

### The trap this creates for every phase in this sprint

A de-Tailwind fix that replaces `bg-muted` with `background-color: var(--color-muted)` **passes every gate in the
repository and creates new Class-3 debt silently**: `--color-muted` is declared in `globals.css`'s `@theme inline`,
so the 762 classifier returns `project` and never flags it. The correct target is `var(--muted)`, declared in plain
`:root` at `globals.css:371`. Every task in this sprint states its target token's *declaring block* — `:root` or
`@theme inline` — and no task may introduce a new `@theme inline` reference without recording it in the Phase 3
inventory in the same commit.

`:root`-declared and therefore safe today: `--muted`, `--muted-foreground`, `--border`, `--radius`, `--hero-bg`,
`--overlay`, `--overlay-foreground`, `--primary`, `--destructive`, `--status-success`.
`@theme inline` and therefore Class 3: every `--space-*`, `--text-*`, `--duration-*`, `--ease-*`, `--color-*`,
`--shadow-*`, `--icon-*`, `--z-*`.

## Why a new sprint

Goal-fit test run 2026-08-21 against every open sprint.

| Sprint | Goal | Fit |
|---|---|---|
| 46 | ListingCard de-Tailwind + overlay exit | **FAIL.** One of Phase 1's 14 consumers is `ListingCard`; the other 13 and all 9 variants are not. Scoping a product-wide primitive inside a card sprint is what produced the "D28 COMPLETE for the homepage card pair" claim this sprint had to contradict. |
| 55 | ARIA semantics no gate sees | FAIL. Different subject. |
| 56 | Raw enum leaks and the blind detector | FAIL. Closest *in kind* — also a detector blind spot — different subject. |
| 57 | Delete what no longer earns its place | FAIL. Every phase here is a replacement, not a removal. |
| 59 | Route-level inventory before any migration claim | FAIL as a home, **and it is a dependency.** 59 measures what `/[locale]` mounts; it does not migrate. It is stalled with zero landed tasks. |
| 61 | The projection layer no gate reads | FAIL. Documents, not delivery. |
| 62 | Tailwind runtime tokens outlive Tailwind | **FAIL by its own written boundary.** Its "Out of scope for the whole sprint" reads: *"Any file outside `src/**/*.module.css` and the gate's own scripts"* and *"`src/app/globals.css` — this sprint changes consumers, never the source."* Phases 1, 2 and 5 are `.ts`/`.tsx`/`globals.css`. **Phase 3 fits 62 exactly and is filed there, not here.** |

## Binding rules for every task in this sprint

1. **The control ships before or with the fix, never after.** Inherited verbatim from Sprint 62. Every task carries a
   two-armed plant that demonstrably fails plus a pre-plant census proving no other gate would have caught it.
2. **Exemptions are conditions a gate evaluates, never comments an author writes.** No task may add a
   `design-tokens-allow:` marker as a way of passing. Phase 4 *removes* one.
3. **Reproduce the token reference, never the resolved value** (N1, Task 707/709 precedent):
   `padding: var(--space-3)`, never `padding: 0.75rem`.
4. **Name the declaring block of every token you write.** `:root` or `@theme inline`. A task that adds an
   `@theme inline` reference adds a row to the Phase 3 inventory in the same commit.
5. **Cascade standing is part of the behaviour being preserved (D34).** A D28 migration reproduces the utility's own
   losing standing (`@layer utilities`); a cascade-trap fix that overrides a dead utility stays unlayered. State
   which of the two each file is, in the file, as `HeroSearchView.module.css` does.
6. **No new permanent Storybook markup to satisfy a gate.** Reversible probe with `git hash-object` restoration
   evidence, or an existing story, or a non-rendered comparator.

## Tasks

**This table is the single source of task state in this file.** The execution-order table below is order and gating
only; it carries no state.

| # | Phase | Title | Sprint | Priority | State |
|---|---|---|---|---|---|
| **763** | 1 | `AppImage` de-Tailwind: 21 variant strings + 4 inline strings + the `group`/`group-hover` pair | 63 | P1 | **KICKOFF FILED** — `Sprint_63_kickoff_prompt_Task_763_AppImage_De_Tailwind.md` |
| *next free* | 2 | `MantineListingCardPattern` residual utilities: `flex flex-col`, `grayscale opacity-60` (+ `LocaleSwitcher` `animate-spin`) | 63 | P2 | NOT FILED — needs 763's I1 extraction method and its D34 disposition |
| *next free* | 3 | Extend `check:tailwind-runtime-tokens` to `src/**/*.{ts,tsx}`, then pay the 6 Class-2 `.tsx` references and inventory all 43 Class-3 references | **62** | P1 | NOT FILED — files in Sprint 62, whose goal it is. Supersedes 62's indicative "763" row. |
| *next free* | 4 | Route shell: `min-h-[calc(100vh-4rem)]` + remove its `design-tokens-allow` marker | 63 | P3 | NOT FILED — fold into Phase 3 if both land in one session |
| *next free* | 5 | `globals.css`: `@theme inline` → `:root`, 10 `@apply` sites, 3 `@import`, `@custom-variant`, layer-order re-measure | **new sprint** | P1 | NOT FILED — **BLOCKER.** Own sprint, own blast radius. Nothing in Phases 1-4 makes `/[locale]` Tailwind-independent without it. |
| **667** | 6 | Route-level Mantine/Tailwind certification for `/<locale>` | **59** | P2 | BLOCKED — owner decision pending since 751 was shelved |

Numbers are **not reserved**. Take the next free number from `docs/backlog.md`'s registry line at filing time; it is
the only authority. Phase 1 took **763** and the registry moves to **764**. Sprint 62's plan file names 763/764 as
indicative placeholders for its own work — those rows must be re-pointed when Phase 3 is filed.

## Execution order

Order and gating only — read state from the Tasks table above.

1. **Phase 1 (763) first, and alone in its file set.** No precondition: its output is a new `.module.css`, which
   the existing `check:tailwind-runtime-tokens` already scans, so the fix is measurable the day it lands. It also
   removes the largest single block of Class-1 debt and settles the I1 extraction method the later phases reuse.
2. **Phase 2 after 763**, because `'group'` moves in 763 and Phase 2 must not re-open Task 691R finding F-A.
3. **Phase 3 independent of 1 and 2, and it gates 4.** Its detector extension is the reason Phases 4 and 5 are
   measurable at all: today, six Class-2 references and four Class-3 `.tsx` references sit in files no gate reads.
   **Do not fix a `.tsx` token before the scan can see it** — that is the exact failure mode
   `docs/backlog.md`'s standing note records four times.
4. **Phase 4 after Phase 3.** One line, but its replacement is a token write in a `.tsx`; without Phase 3 the
   replacement is unmeasured.
5. **Phase 5 last, and only after 1-4 have emptied the consumer side.** Removing the source while consumers still
   read it converts latent debt into a rendered regression on the same commit.
6. **Phase 6 in parallel, whenever Sprint 59's owner decision resolves.** It certifies the result; it does not
   produce it.

## Exit criteria

1. `/[locale]`'s render graph contains **zero** Tailwind utility strings in production code paths. `PerfDevOverlay`
   is either migrated or carries a written, dated disposition naming its build-time strip as the reason.
2. Every Class-2 reference in the graph is gone, and `check:tailwind-runtime-tokens` scans `.ts`/`.tsx` — so a new
   one exits 1.
3. Every Class-3 reference in the graph is **inventoried with its declaring block**, whether or not it is fixed.
   An inventory is the deliverable; the fix belongs to Phase 5.
4. A written answer to: **what detector would have caught the `MantineListingCardPattern` residue before the backlog
   claimed the card pair was complete?** Build it, or record in writing why none is worth building. This sprint's
   transferable output is not the migration; it is that answer.
5. `npm run build` exit 0 on every non-Q0 task, transcript retained.

## Owner decisions required

| ID | Decision | Why it cannot be defaulted |
|---|---|---|
| **D63-A** | Does `PerfDevOverlay` count as production surface for exit criterion 1? | It is real Tailwind in a graph file, but `PerfDevOverlay()` returns `null` unless `process.env.NODE_ENV === 'development'` (line 15), so it never ships. Migrating it costs a task; leaving it means "zero" needs an asterisk. |
| **D63-B** | `docs/backlog.md`'s "ⓑ De-Tailwind (D28): ✅ COMPLETE for the homepage card pair" is measurably false at `201683f9d`. Correct it now, or let Phase 2's closure correct it? | Corollary (702, ×4) — an unwritten or stale verdict is handed to the next session as live state. This is the same shape. |
| **D63-C** | Sprint 59: re-scope 667 onto another mechanism, or close the sprint with 667? | Named as pending in `docs/backlog.md` since 751 was shelved. Phase 6 has no home until this resolves, and exit criterion 4 leans on it. |
| **D63-D** | Phase 5 opens a new sprint, or extends this one? | `globals.css` is a project-wide source change with a blast radius no homepage sprint should carry. Recommendation: its own sprint. |

## Provenance of every number in this file

Measured 2026-08-21 against `201683f9d`, worktree clean (`git status --short` empty).

- **Render graph (110 files / 16 modules):** import walk from `layout.tsx` + `page.tsx` resolving `@/` and relative
  specifiers, with barrel `index.ts` files resolved per imported symbol. Script retained with the evidence preflight.
- **Class-1 sweep:** string-literal scan over the 110 graph files with block/line comments stripped, keeping only
  literals whose every whitespace-separated token matches a Tailwind utility shape. Every surviving hit was opened
  by hand; the false positives are listed in §"Measured state" so the next session does not re-triage them.
- **Class-2 / Class-3 buckets:** `@theme inline` (35-316) and `:root` (327-462) name sets extracted from
  `globals.css` by brace matching; Tailwind's own names read live from `node_modules/tailwindcss/theme.css` +
  `index.css` and cross-checked by calling the gate's exported `loadTailwindOwnedNames()` (412 names, `tailwindcss@4.3.0`).
- **Gate state:** `node scripts/check-tailwind-runtime-tokens.mjs` → *"scanned 23 `src/**/*.module.css` file(s) …
  Tailwind-owned references found: 14 | baseline entries: 14 … 0 new debt, 0 stale baseline entries"*, exit 0.
  Green means the debt is pinned, not paid — and it is pinned only over 23 of the repository's files.
- **The method under-counts on purpose in one place:** the Class-1 sweep needs `className`/`cn` proximity to keep
  Mantine prop values out, so a Tailwind string assigned to a bare variable more than a few lines from its use site
  would be missed. Phase 1's I1 extraction re-measures its own file set from the built CSS and does not inherit
  this number.
