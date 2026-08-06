# Task 709 — De-Tailwind `HeroSearchView.tsx`: 9 utility sites → Mantine props + one colocated CSS module

**Sprint:** 49 (`tasks/Sprints/Sprint_49_HeroSearch_Gate_And_DeTailwind.md`). **Epic:** MM Phase-2.
**Depends on:** Task 708 (`APPROVED WITH NOTES`, committed `16960dc77`). Per **D32**, 709 could not start until the
`heroSearchWrapInBand` comparator was shown to genuinely fail. It has been. That gate is now your proof instrument.

---

## 1. Mode and task type

- **Mode:** implementation (Sonnet executor, via `.claude/skills/execute-task/SKILL.md`).
- **Primary task type:** **UI migration — D28 mechanism-only de-Tailwind** (`docs/rule-index.md` → Mixed migration).
- **Secondary type:** none. No behavior, no logic, no props-API change, no visual change.

> **Read this first.** This is a **zero-rendered-delta** task. The success condition is that *nothing looks different*
> — all 40 `herosearch` cells keep their PNG md5 and verdict, and the 640–767 band gate keeps returning `true`. Every
> value you write into the CSS module must be the *compiled declaration* Tailwind already emits, read out of the built
> stylesheet, never a value you computed in your head. §3.2 gives you all of them, measured. If a computed style moves,
> stop and report — do not absorb it.

---

## 2. Objective

1. Remove all **9** Tailwind `className=` utility sites from `src/components/shared/HeroSearchView.tsx`, replacing them
   with Mantine style props where a prop exists and one colocated `HeroSearchView.module.css` otherwise (**D28**).
2. Preserve the `hero-search` marker class verbatim (Sprint 49 exit criterion 2).
3. Reproduce each utility's **compiled declaration and specificity**, not its resolved value (707 **N1**/**N2**).
4. Prove zero rendered delta against the 708-repaired gate, and prove that gate is **still live on the migrated code**
   by re-planting the band violation after the migration.

**Non-goals, stated as objectives so they are not silently attempted:** no change to `HeroSearchViewProps`; no change
to any child component; no change to `heroSearch.smoke.test.tsx` (708 already de-coupled it — a diff there means you
broke something); no change to the two `data-testid` hooks; `check:design-tokens` must still read **23**.

---

## 3. Verified context

Every fact below was read or executed in this worktree on branch `task/q0-ci-rendered-locale-split` at HEAD
`16960dc77` on **2026-08-04**. Nothing is inferred from a filename, a prior report, or a semantic-search hit.

### 3.1 The nine sites, at source

`src/components/shared/HeroSearchView.tsx`, read in full 2026-08-04:

| # | Line | Element | `className` value | Route (§7) |
|---:|---:|---|---|---|
| 1 | **:49** | `Box` (outer) | `hero-search w-full max-w-3xl mx-auto` | Mantine props + keep marker |
| 2 | **:94** | `Box` (search card) | `rounded-b-[var(--mantine-radius-lg)] sm:rounded-tr-[var(--mantine-radius-lg)] p-3` | module `.searchCard` |
| 3 | **:104** | `Box` (control row) | `flex flex-wrap md:flex-nowrap gap-2` | module `.controls` |
| 4 | **:109** | `PropertyTypeCombobox` | `basis-full sm:basis-auto sm:w-48 shrink-0` | module `.typeControl` |
| 5 | **:118** | `LocationCombobox` | `basis-full sm:basis-0 grow min-w-0` | module `.locationControl` |
| 6 | **:133** | `SlidersHorizontal` (lucide) | `h-4 w-4` | `size={16}` |
| 7 | **:134** | `MantineCountButton` | `shrink-0` | module `.filtersControl` |
| 8 | **:142** | `Button` (Search) | `px-6 font-semibold basis-full sm:basis-full md:grow-0 md:basis-auto` | module `.searchControl` |
| 9 | **:143** | `Search` (lucide) | `h-4 w-4` | `size={16}` |

Sites 2 and 3 also carry the two Task 708 `data-testid` hooks (`hero-search-card` at `:95`,
`hero-search-controls` at `:104`). **Both must survive verbatim** — they are the live anchors for the band gate and
the smoke test.

### 3.2 The compiled declarations — this table is the authority, do not recompute

Read from `storybook-static/assets/iframe-HOXpMATP.css` (358 081 chars, built **2026-08-04 08:58**) by direct
extraction on 2026-08-04. The Sprint 49 §7 note cites an older bundle hash (`iframe-DnJgGJJb.css`); that bundle is
gone. **This is the current one — rebuild and re-extract before you rely on it (I1).**

| Utility | Compiled rule | Enclosing `@media` |
|---|---|---|
| `w-full` | `width:100%` | top-level |
| `max-w-3xl` | `max-width:var(--container-3xl)` | top-level |
| `mx-auto` | `margin-inline:auto` | top-level |
| `rounded-b-[var(--mantine-radius-lg)]` | `border-bottom-right-radius:var(--mantine-radius-lg);border-bottom-left-radius:var(--mantine-radius-lg)` | top-level |
| `sm:rounded-tr-[var(--mantine-radius-lg)]` | `border-top-right-radius:var(--mantine-radius-lg)` | `(min-width:40rem)` |
| `p-3` | `padding:var(--space-3)` | top-level |
| `flex` | `display:flex` | top-level |
| `flex-wrap` | `flex-wrap:wrap` | top-level |
| `md:flex-nowrap` | `flex-wrap:nowrap` | `(min-width:48rem)` |
| `gap-2` | `gap:var(--space-2)` | top-level |
| `basis-full` | `flex-basis:100%` | top-level |
| `sm:basis-auto` | `flex-basis:auto` | `(min-width:40rem)` |
| `sm:w-48` | `width:calc(var(--spacing) * 48)` | `(min-width:40rem)` |
| `shrink-0` | `flex-shrink:0` | top-level |
| `sm:basis-0` | `flex-basis:var(--space-0)` | `(min-width:40rem)` |
| `grow` | `flex-grow:1` | top-level |
| `min-w-0` | `min-width:var(--space-0)` | top-level |
| `h-4` | `height:var(--space-4)` | top-level |
| `w-4` | `width:var(--space-4)` | top-level |
| `px-6` | `padding-inline:var(--space-6)` | top-level |
| `font-semibold` | `--tw-font-weight:600;font-weight:600` | top-level |
| `md:grow-0` | `flex-grow:0` | `(min-width:48rem)` |
| `md:basis-auto` | `flex-basis:auto` | `(min-width:48rem)` |

**Breakpoints, measured:** `sm:` = `@media(min-width:40rem)`, `md:` = `@media(min-width:48rem)`. Write those two
literal conditions; do not translate to px.

**Token emission, re-measured in this bundle** (707 N1's mechanism — a `var()` only survives if the token is emitted):

| Token | Status | Value in bundle |
|---|---|---|
| `--space-0` / `--space-2` / `--space-3` / `--space-4` / `--space-6` | **EMITTED** | `0px` / `.5rem` / `.75rem` / `1rem` / `1.5rem` |
| `--spacing` | **EMITTED** | `.25rem` |
| `--container-3xl` | **EMITTED** | `48rem` |
| `--mantine-radius-lg` | **EMITTED** | `calc(1rem * var(--mantine-scale))` |
| `--radius-xl` | **NOT EMITTED** | lives in `@theme inline` — unusable from a module (707 precedent) |

Every token this task needs is emitted. **There is therefore no excuse for a hardcoded length in this module.**

> **`--mantine-radius-lg` — do not write a px value.** The static bundle declares Mantine's own default
> `calc(1rem * var(--mantine-scale))` (16px), while `theme.ts:203` sets `lg: '0.5rem'` (8px) and `MantineProvider`
> injects that override at runtime. The two disagree, and the file's own comment at `:80` asserts 8px. **You do not
> need to resolve this** — reference `var(--mantine-radius-lg)` verbatim and whatever it resolves to is preserved
> byte-for-byte. Writing either literal would be a regression. Record the measured computed value in your I3 witness
> and move on; the discrepancy is not this task's to fix.

### 3.3 `sm:basis-full` is a dead class — measured, not assumed

Site 8's chain contains `sm:basis-full`. **It emits no rule.** The entire bundle contains exactly four `basis`
declarations — `.basis-full`, `.sm\:basis-0`, `.sm\:basis-auto`, `.md\:basis-auto` — and `sm:basis-full` appears
**zero** times as a substring in any form, escaped or not.

Its compiled effect is therefore nothing: `basis-full` (top-level) already applies `flex-basis:100%` at every width,
and `md:basis-auto` overrides it at ≥48rem. **Drop it.** The module must reproduce the *compiled* behaviour, and
carrying a class that compiles to nothing into a CSS module would mean inventing a rule that never existed.

Corroboration from Task 708's AC2: its plant replaced `sm:basis-full` with `sm:basis-auto sm:shrink-0` and the gate
flipped to `false` — the flip came from the two *added* emitted classes, consistent with `sm:basis-full` being inert.

> **Correction (Task 709-R, 2026-08-05, session log §7):** this section's own measurement was wrong. Task 709's I1
> re-extraction against its rebuilt bundle found `.sm\:basis-full{flex-basis:100%}` **does** compile, inside
> `@media(min-width:40rem)` — the pre-edit `HeroSearchView.tsx` source still carried the literal class, so Tailwind's
> content-scanner correctly generated a rule for it. The bundle this section measured against
> (`iframe-HOXpMATP.css`, "358081 chars") apparently omitted it for an unknown reason. The **drop decision itself
> still stands**, but on the correct basis: `sm:basis-full` reasserts the exact same value
> (`flex-basis:100%`) the unconditional `.basis-full` rule already applies across the whole 640–767 band, and both
> are overridden identically by `md:basis-auto` at ≥768px — a measured equivalence (Task 709's I2/I3 computed-style
> diff for site 8 at width=700 confirms zero delta with the rule absent), not a "compiles to nothing" absence.

### 3.4 Three sites pass `className` into child components

Sites 4, 5 and 7 do not put `className` on a Mantine `Box` — they hand it to a child, which merges it:

- `PropertyTypeCombobox.tsx:36` — `<div className={cn('property-type-combobox', className ?? 'sm:w-48 shrink-0')}>`
- `LocationCombobox.tsx:114` — `<div className={cn('location-combobox', className)}>`
- `MantineCountButton` — Mantine pattern component, forwards `className` to the underlying `Button`.

A CSS-module class is just a string, so `cn()` merges it exactly as it merges a utility chain. **All three child files
are out of scope** — do not edit them. Note `PropertyTypeCombobox`'s Tailwind *default fallback*
(`className ?? 'sm:w-48 shrink-0'`) survives untouched either way, because this task always passes a `className`.

### 3.5 The `hero-search` marker

`:49`'s `hero-search` is a marker, not a utility. Repo-wide it appears in exactly two places: this line, and a **prose
comment** at `scripts/task670-qa-hero-fallback-geometry.mjs:32` — no live selector consumes it today. It is preserved
anyway, verbatim, per Sprint 49 exit criterion 2. Do not move it into the module, do not rename it, do not remove it.

### 3.6 The 707 precedent and its two carried-forward defects

Task 707 (`736fc0abc`) is the reference implementation: a colocated `X.module.css` beside the component,
`import styles from './X.module.css'`, `className={styles.foo}`. Read
`src/modules/listings/components/FeaturedListingsView.module.css` before you write yours — its header comment is the
documentation standard for this sprint (per-declaration provenance, measured, with the source of the measurement).

Both of 707's P3 findings are **defects you must not repeat**:

- **N1 — reproduce the declaration, not the resolved value.** 707 wrote `padding: 0.75rem` where the compiled utility
  is `padding: var(--space-3)`. Zero delta today, but retuning `--space-3` moves every Tailwind `p-3` in the app and
  silently does not move the module. §3.2 gives you the `var()` form for every token; use it.
- **N2 — reproduce specificity, not just value.** Tailwind wraps several rules in `:where(...)` (specificity 0,0,0).
  A module rule that drops the `:where()` wins fights the original lost. None of this task's 23 utilities is a
  `:where()`-wrapped rule (all are plain single-class declarations, §3.2), so N2 is satisfied by construction here —
  **but if your I1 extraction shows a `:where()` on any rule, reproduce it.**
- **N3 — the icon swap changes the unit.** `h-4 w-4` is `1rem` (scales with root font-size); `size={16}` writes an
  absolute px attribute. Identical at the default 16px root. This is the standing 706/707 sprint convention and you
  must follow it for consistency — **record it as a known accepted property, do not present it as zero-delta.**

> **`check:design-tokens` will NOT catch an N1 violation.** Measured: `FeaturedListingsView.module.css:29` contains a
> raw `padding: 0.75rem` and that file appears nowhere in the `--strict` report. The scanner flags colours and a
> narrow length set, not raw lengths inside `.module.css`. N1 compliance is therefore an **inspection** requirement
> and will be reviewed by reading your module line by line. A green gate is not evidence here.

### 3.7 Gate exposure — measured 2026-08-04

| Gate / registry | Exposure | Evidence |
|---|---|---|
| `heroSearchWrapInBand` (`check-stories-rendered.mjs:1237-1263`) | **Live as of Task 708.** Returns `true` in the 4 `--default × band-700` cells, `null` in the other 36. Anchored on `[data-testid="hero-search-card"]` / `[data-testid="hero-search-controls"]` — **immune to everything this task changes**, which is exactly why 708 ran first (D33). | manifest `2026-08-04T06-27` |
| `docs/critical-flow-registry.md` row 50 | **Applies.** Names `HeroSearchView` and Tasks 566/567/568/571/572; the 640–767 band behaviour is the registry's own named invariant. Commands: `npx vitest run … heroSearch.smoke.test.tsx` + `npm run screenshots:assert -- --mantine-only`. | read 2026-08-04 |
| `check:design-tokens` | Live `--strict` total **23** (`FavoriteButton.module.css` 9 · `SaveToCollectionButton.module.css` 2 · `page.tsx` 8 · `NotificationCenter.tsx` 4). `HeroSearchView.tsx` contributes **0** and the new module must contribute **0**. | live run 2026-08-04 |
| `scripts/mantine-migration-scope.json` | `HeroSearchView.tsx` enrolled at index **4**. Membership must not change. | read 2026-08-04 |
| `src/stories/mantine/primitives/HeroSearch.stories.tsx` | The proof story. Exports `Default` (`:38`) and `Fallback` (`:87`), title `Mantine/Primitives/HeroSearch`. **Read it; do not edit it.** A story diff means scope leaked. | read 2026-08-04 |
| `heroSearch.smoke.test.tsx` | 6 tests. Task 708 removed its last class coupling. **Expected diff for this task: zero.** | read 2026-08-04 |

### 3.8 Worktree state — starts dirty, with 18 owner-owned paths

At kickoff time `git status --porcelain` shows **18 modified paths, none of them yours**. These are the **owner's own
verified CI-fix work** from 2026-08-03 (14 Storybook `@storybook/react` → `@storybook/nextjs-vite` type-import fixes,
`AdminReportsManager.tsx`, `MantineSelect.tsx`, `visibility.test.ts`, and a `governance-pr.yml` job split), owner-
validated with lint 0 errors, `tsc`, `check:stories`, Storybook build, visibility 66/66, homepage grid 260/260.

> **They may or may not be committed by the time you start.** Take your own pre-write `git status --porcelain`
> snapshot before your first edit and reconcile against it. If they are still present, complete
> `docs/orchestrator-dirty-worktree-manifest-template.md` for every entry. **Never touch, revert, or stage one.**

**Measured harness noise floor, so you do not misread it as your regression:** comparing the two Task 708 runs of an
identical worktree (`2026-08-04T05-55` → `06-27`), **24 of 1184 PNGs drifted md5** and 8 cells showed
`visualContentCheck.metrics.variance` drift in the last decimal — with **zero** verdict changes and **zero**
herosearch cells affected. That is this harness's ambient floor on this tree. Your AC5 comparator is scoped to the
**40 herosearch cells**, where the floor is zero: all 40 were byte-identical across both runs *and* against the
pre-contamination baseline. A drifting herosearch cell is a real finding.

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | §3.1, Sprint 49 exit 2 | `HeroSearchView.tsx` greps **0** Tailwind utilities. Every surviving `className` is `styles.*` or the verbatim `hero-search` marker. | P0 | AC1 |Confirmed|
| R2 | D26, §3.7 | All **40** `herosearch` cells keep their pre-task PNG md5 **and** verdict. | P0 | AC2 |Confirmed|
| R3 | D32, §3.7 | `heroSearchWrapInBand` still returns `true` in the 4 `--default × band-700` cells and `null` in the other 36. | P0 | AC3 |Confirmed|
| R4 | D32 | The band gate is shown to be **still live on the migrated code**: a planted layout violation flips it to `false` and fails the run. | P0 | AC4 |Confirmed|
| R5 | §3.2, N1 | Every module declaration reproduces the compiled Tailwind declaration, including its `var()` reference — no hardcoded resolved value where a token is emitted. | P0 | AC5 |Confirmed|
| R6 | §3.2 | Responsive rules use the literal `@media(min-width:40rem)` / `(min-width:48rem)` conditions, matching the compiled output. | P0 | AC6 |Confirmed|
| R7 | §3.1, §3.4 | Computed styles for all 9 sites are identical before and after, at the breakpoints that matter. | P0 | AC7 |Confirmed|
| R8 | §3.7 | `heroSearch.smoke.test.tsx` has **zero diff** and still passes 6/6. | P0 | AC8 |Confirmed|
| R9 | §3.3 | `sm:basis-full` is dropped, not translated, and the drop is justified from the built CSS. | P1 | AC9 |Confirmed|
| R10 | §3.7 | `check:design-tokens` still totals **23**, with no entry for `HeroSearchView.tsx` or the new module. | P1 | AC10 |Confirmed|
| R11 | agent-contract cl. 9 | `npm run build` exits 0, transcript persisted to a named path **with its exit code captured in the file**. | P0 | AC11 |Confirmed|
| R12 | agent-contract cl. 14 | Touched files stay UTF-8 without BOM, no mojibake; counting gates run last. | P2 | AC12 |Confirmed|

---

## 5. Assumptions and open questions

- **A1.** A CSS-module class merged through `cn()` in `PropertyTypeCombobox`/`LocationCombobox` applies identically to
  the utility chain it replaces. Mechanically certain (both are plain class strings), **but verify on the rendered DOM
  at I3 — do not assume.**
- **A2.** CSS-module output and Tailwind `@layer utilities` do not sit in the same cascade layer. The file's own
  comment (`:72-90`) records that `@mantine/core/styles.css` is imported **unlayered** in `src/app/layout.tsx`, so
  Mantine component CSS beats `@layer utilities` unconditionally. A CSS module is also unlayered, so moving a
  declaration out of `@layer utilities` **can change which rule wins** on sites 7 and 8, where the host is a Mantine
  `Button` with its own component CSS. **This is the single highest-risk item in the task.** I3's computed-style
  capture on sites 7 and 8 is the checkpoint; a mismatch is a stop-and-report, not something to patch with
  `!important`.
- **A3.** The Task 572 `basis`/`grow`/`shrink` chain's *semantics* are not in scope — you reproduce its compiled
  declarations exactly. The source comment at `:97-103` forbidding a `flex-1` collapse still binds: do not
  "simplify" the chain into a shorthand while moving it.

### 5.1 Naming — decided, do not re-litigate

Module `src/components/shared/HeroSearchView.module.css`, imported as `import styles from './HeroSearchView.module.css'`.
Class names, one per site: `.searchCard` (2) · `.controls` (3) · `.typeControl` (4) · `.locationControl` (5) ·
`.filtersControl` (7) · `.searchControl` (8). Site 1 takes Mantine props, sites 6 and 9 take `size={16}`.

### 5.2 Nothing is left ambiguous

There is no unresolved owner decision. D28 fixes the mechanism, D26 the comparator, D32 the proof obligation.

---

## 6. Pre-read rule bundle

Read exactly these. Do not read all docs.

**Always required:** `docs/agent-contract.md` · `docs/rule-index.md` · `docs/qa-profiles.md` · `docs/backlog.md` ·
`docs/critical-flow-registry.md` (**row 50 in full**).

**Because this is a UI migration:** `docs/mantine-responsive-design-system.md` · `docs/tailadmin-style-reference.md` ·
`docs/component-rules.md` · `docs/storybook-governance.md` §14.11 (D26) and §14.9.17.

**Task-specific sources:** this file · `tasks/Sprints/Sprint_49_HeroSearch_Gate_And_DeTailwind.md` (**§7 in full**) ·
`src/components/shared/HeroSearchView.tsx` · `src/modules/listings/components/FeaturedListingsView.module.css` (the
form to copy) · `docs/sessions/2026-08-03-task707-homepage-tail-de-tailwind.md` §10.3 (N1/N2/N3) ·
`scripts/check-stories-rendered.mjs` `:1235-1263` (read the repaired gate; **do not edit it**) ·
`src/stories/mantine/primitives/HeroSearch.stories.tsx` (read; **do not edit**) ·
`src/components/shared/__tests__/heroSearch.smoke.test.tsx` (read; **expect zero diff**).

---

## 7. Scope

- `src/components/shared/HeroSearchView.tsx` — the 9 `className` sites in §3.1 and the module import. Nothing else.
- `src/components/shared/HeroSearchView.module.css` — **new file**, 6 classes.
- `docs/backlog.md` — concise state only.
- `docs/sessions/2026-08-04-task709-herosearchview-de-tailwind.md` — the session log. Use the real date you finish on.

Route per site, decided:

| Site | Route |
|---:|---|
| 1 `:49` | Mantine props `w="100%" maw="var(--container-3xl)" mx="auto"`; `className="hero-search"` retains **only** the marker |
| 2 `:94` | `className={styles.searchCard}`; keep `bg`/`bd` props and `data-testid` unchanged |
| 3 `:104` | `className={styles.controls}`; keep `data-testid` unchanged |
| 4 `:109` | `className={styles.typeControl}` |
| 5 `:118` | `className={styles.locationControl}` |
| 6 `:133` | `<SlidersHorizontal size={16} />` |
| 7 `:134` | `className={styles.filtersControl}` |
| 8 `:142` | `className={styles.searchControl}`, dropping the inert `sm:basis-full` (§3.3) |
| 9 `:143` | `<Search size={16} />` |

---

## 8. Out of scope

- **Every story file**, including `HeroSearch.stories.tsx`. A story diff means scope leaked.
- `scripts/check-stories-rendered.mjs` — 708 just repaired it. Touching it invalidates your own comparator.
- `heroSearch.smoke.test.tsx` — zero diff expected (R8). If you think you need to edit it, you have changed
  behaviour; stop and report.
- `PropertyTypeCombobox.tsx`, `LocationCombobox.tsx`, `MantineCountButton.tsx`, `FiltersPanel.tsx`, `HeroSearch.tsx`,
  `HeroSearchFallback.tsx`, `page.tsx`, `theme.ts`, `globals.css`.
- `mantine-migration-scope.json` — membership already correct (§3.7).
- The `--mantine-radius-lg` 8px/16px discrepancy (§3.2). Record it; do not fix it.
- The 18 owner CI paths (§3.8).
- The repo-wide N1 cleanup of `FooterView`/`HeaderView`/`FeaturedListingsView`/`LatestListingsView` modules. 707's N1
  says "fix once, repo-wide, in a follow-up" — **this task fixes only its own module.** Record the others as a
  standing finding.

---

## 9. Current and required behavior

**Current:** `HeroSearchView.tsx` carries 9 Tailwind `className` sites, including two arbitrary-value radius
utilities, four responsive variants across two breakpoints, the Task 572 `basis`/`grow`/`shrink` chain, one inert
class, and two `h-4 w-4` icon sizings. The file is enrolled in the Mantine migration scope but is the largest
remaining utility holdout in the `/[locale]` tree.

**Required after:** the file greps 0 Tailwind utilities; the only `className` values are `hero-search` and `styles.*`;
every migrated declaration is the compiled Tailwind declaration verbatim, `var()` references intact; rendered output is
byte-identical across all 40 herosearch cells; the 640–767 band gate still returns `true` and can still be made to
fail.

### Implementation sequence

- **I1 — Baseline first, before any edit.** Rebuild Storybook (`npm run build-storybook`), then re-extract §3.2's
  compiled declarations from the **new** `storybook-static/assets/iframe-*.css` and confirm every row still matches
  (the hash will change). Run `npm run screenshots:assert -- --mantine-only`. Persist: the 40 herosearch cells'
  `heroSearchWrapInBand` values (expect `true`×4, `null`×36), their PNG md5 + verdict, `check:design-tokens` (expect
  **23**), `npx vitest run … heroSearch.smoke.test.tsx` (expect 6/6), and your `git status --porcelain` snapshot.
  **A baseline captured after an edit is not a baseline.**
- **I2 — Capture the before computed styles.** For all 9 sites, on the real rendered `HeroSearch/Default` story, capture
  `getComputedStyle` for every property in §3.2, at **375 / 700 / 1024** (below `sm`, inside the band, above `md`).
  This is your AC7 comparator and it cannot be reconstructed later.
- **I3 — Write the module and migrate.** Then re-capture I2's computed styles and diff. **Sites 7 and 8 are the A2
  risk** — check them first. Witness the rendered DOM to confirm the module classes actually landed on the child
  components (A1) and that the control row still has exactly 4 element children.
- **I4 — Re-run** the full evidence set and diff against I1.
- **I5 — Prove the comparator is still live (AC4).** Re-plant the band violation on the *migrated* code, confirm the
  gate flips to `false`, revert exactly, confirm green. Persist both transcripts **as files**.
- **I6 — Counting gates last** (`check:file-integrity`, `check:mojibake`), after the session log and backlog row exist.

---

## 10. Implementation requirements

1. **Reproduce the compiled declaration, with its `var()`.** §3.2 is the source. `padding: var(--space-3)`, never
   `padding: 0.75rem`. This is 707's N1 and it will be reviewed by reading your module (§3.6 — the gate cannot catch it).
2. **Reproduce the media conditions literally** — `@media(min-width:40rem)` and `@media(min-width:48rem)`.
3. **Do not add `!important`.** If a declaration does not win, that is the A2 cascade-layer finding and you stop and
   report it. `!important` would hide exactly the defect this task exists to surface.
4. **Do not collapse the flex chain.** The `:97-103` comment forbids `flex-1`; it also forbids any equivalent
   "simplification" while moving to CSS.
5. **Preserve verbatim:** `'use client'`, both `data-testid` hooks, the `hero-search` marker, the `bg`/`bd` style
   props, the `styles={{…}}` object on `SegmentedControl`, every existing comment block, and the props API.
6. **Give the module a provenance header** in the form of `FeaturedListingsView.module.css` — per declaration, name the
   utility it replaces, its compiled rule, and where you measured it.
7. **Drop `sm:basis-full`** and state in the log that it emits no rule, quoting your I1 extraction.
8. **Run `check:file-integrity` and `check:mojibake` LAST** (707 N6, 3rd recurrence; a 4th is a P2).

---

## 11. Positive and negative flows

**Positive flow:** `npm run screenshots:assert -- --mantine-only` runs the Mantine gate; the 8 `band-700` HeroSearch
cells behave exactly as at I1 (`true`×4 default, `null`×4 fallback); all 40 herosearch PNG md5s and verdicts are
unchanged; the run summary is unchanged.

| Branch | Applicable? | Owner / source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Healthy render, all 3 tiers | **Yes** | 375 / 700 / 1024 | computed styles byte-identical to I2 | AC7 |
| Band 640–767 preserved | **Yes** | the 4 `--default × band-700` cells | `heroSearchWrapInBand` stays `true` | AC3 |
| Planted layout violation post-migration | **Yes** | I5 | gate flips to `false`, run FAILs, reverts green | AC4 |
| Cascade-layer conflict on a Mantine host | **Yes** | A2, sites 7 & 8 | declaration still wins; a loss is stop-and-report | AC7 |
| `className` reaching a child via `cn()` | **Yes** | A1, sites 4/5/7 | module class lands on the child's root `div` | AC7 |
| `--fallback` story | **Yes** | no search card | `null` at every viewport, unchanged | AC3 |
| Locale expansion | **Yes** | sq/en/uk/it | identical verdict and md5 in all 4 | AC2 |
| Late / partial render | **Yes** | gate `:1251`/`:1256`, unchanged | still `null`, still not a verdict | AC3 |
| Hydration | **No** | class names are identical server and client; no runtime branch added | N/A | — |
| RLS / authorization | **No** | presentational; the harness reads static stories | N/A | — |
| Validation / empty input | **No** | no form logic touched; props API unchanged | N/A | — |

---

## 12. Acceptance criteria

- **AC1 [R1]** Given the final `HeroSearchView.tsx`, when `grep -n "className=" ` is run on it, then every hit is
  either `className={styles.*}` or `className="hero-search"`, and a Tailwind-utility grep returns **0**. Quote both.
- **AC2 [R2]** Given the post-change run, when its 40 `herosearch` PNG md5s and verdicts are compared against I1 under
  the `docs/storybook-governance.md` §14.11 (D26) comparator, then **all 40 are identical**. A changed cell is a
  finding with per-cell attribution, never absorbed into a tolerance. Report the actual count you observe.
- **AC3 [R3]** Given the post-change `manifest.json`, when the 40 herosearch cells are read, then
  `heroSearchWrapInBand` is `true` in the 4 `--default × band-700` cells and `null` in the other 36 — identical to I1.
- **AC4 [R4]** Given a planted layout violation on the **migrated** code (force the Search button back onto row 1 in
  the band), when `npm run screenshots:assert -- --mantine-only` re-runs, then the assertion is **`false`** in the 4
  `--default × band-700` cells, the run reports a genuine FAIL, and the process exits non-zero. **Persist the failing
  transcript, its `manifest.json` path, and the captured exit code as files.** Then revert exactly and re-run green.
  If the run stays green with the plant in place, the migration has broken the comparator and the task is **`BLOCKED`**.
- **AC5 [R5]** Given the final module, when every declaration is read against §3.2, then each reproduces the compiled
  declaration including its `var()` reference, and **no emitted token is replaced by its resolved value**. List each
  declaration beside the utility it replaces.
- **AC6 [R6]** Given the final module, when its media queries are read, then they are exactly `(min-width:40rem)` and
  `(min-width:48rem)`.
- **AC7 [R7]** Given the I2 pre-change and I3 post-change `getComputedStyle` captures for all 9 sites at 375/700/1024,
  when they are diffed property by property, then they are **identical**. State the properties captured. A difference
  on sites 7 or 8 is the A2 cascade finding — report it, do not patch it with `!important`.
- **AC8 [R8]** Given `git diff src/components/shared/__tests__/heroSearch.smoke.test.tsx`, when it is read, then it is
  **empty**, and `npx vitest run` on that file reports **6/6 PASS**.
- **AC9 [R9]** Given the final module, when it is searched for a `flex-basis:100%` rule inside `(min-width:40rem)`,
  then there is none, and the log quotes the I1 extraction showing `sm:basis-full` emits no rule.
- **AC10 [R10]** Given `npm run check:design-tokens`, when it runs, then the total is **23** — unchanged — with no
  entry for `HeroSearchView.tsx` or `HeroSearchView.module.css`.
- **AC11 [R11]** Given the final state, when `npm run build` runs, then it exits **0**, the transcript is written to a
  real file whose path you state, **and the exit code is captured inside that file** (707 N7; Task 708 review P3 —
  a transcript without a captured exit code is a finding).
- **AC12 [R12]** Given the touched files, when `npm run check:file-integrity` and `npm run check:mojibake` run **after**
  the session log and backlog row are written, then both pass and the reported counts match the real changed-file set.
  Report the actual numbers you observe, reconciled against §3.8's foreign paths.

---

## 13. QA profile and verification plan

**Profile: `Q4` Release/Critical Flow.** `docs/qa-profiles.md` routes to Q4 for "changes touching
`docs/critical-flow-registry.md`", and row 50 names `HeroSearchView` and the 640–767 band behaviour directly. Q3 would
cover the visual matrix but would not compel the AC4 planted-violation proof, and **AC4 is the point**: D32 says a
migration must be proven against a comparator shown to fail. 708 showed it fails *before* the migration; 709 must show
it still fails *after*, or the migration could have silently broken both the behaviour and its own detector.

| # | Command / step | Expected |
|---:|---|---|
| 1 | `npm run build-storybook`, re-extract §3.2 from the new `iframe-*.css` (I1) | every row matches; record the new bundle hash |
| 2 | `npm run screenshots:assert -- --mantine-only` (pre-edit, I1) | 40 cells persisted: `true`×4 / `null`×36, md5 + verdict list, manifest path |
| 3 | `npm run check:design-tokens` (pre-edit) | **23** |
| 4 | `npx vitest run src/components/shared/__tests__/heroSearch.smoke.test.tsx` (pre-edit) | 6/6 PASS |
| 5 | `getComputedStyle` capture, 9 sites × 375/700/1024 (I2) | persisted; this is the AC7 comparator |
| 6 | Write module + migrate; re-capture computed styles (I3) | identical to step 5 (AC7) |
| 7 | Rendered DOM witness at `band-700` (I3) | module classes present on all 9 sites incl. the 3 child roots; control row has exactly 4 element children |
| 8 | `npm run screenshots:assert -- --mantine-only` (post-edit) | 40/40 md5 + verdict identical to step 2; `true`×4 / `null`×36 (AC2, AC3) |
| 9 | **Planted layout violation + re-run** (AC4) | `false`×4, run FAILs, non-zero exit, transcripts + manifest persisted; reverted → green |
| 10 | `npm run check:design-tokens` (post-edit) | **23**, no entry for the component or the module |
| 11 | `npx tsc --noEmit` | 0 errors |
| 12 | **`npm run build`** | **exit 0 — hard gate**, transcript persisted with the exit code captured inside it (AC11) |
| 13 | `npm run check:file-integrity` · `npm run check:mojibake` — **run these last** | pass, counts matching the real changed set |

A failed or unrun step 12 permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`. `tsc=0` is not a substitute.

Evidence persists under `.screenshots/task709-evidence/` (local-only per **D6**), referenced by path from the session
log. Full manifests stay at their `.screenshots/rendered-assert/…` paths — **name every run directory you create**,
including aborted ones (Task 708 review P3).

---

## 14. Completion report contract

Write `docs/sessions/2026-08-04-task709-herosearchview-de-tailwind.md` containing:

1. **Files changed** — a table matching the real `git diff --stat` exactly, reconciled against your own pre-write
   `git status --porcelain` snapshot (§3.8), with the 18 foreign paths listed separately as untouched.
2. **Requirement IDs completed** — R1–R12, each with its AC verdict.
3. **The site-by-site migration table** — for each of the 9 sites: the old utility chain, the compiled declaration you
   read, the new declaration you wrote, and where you measured it.
4. **Commands run and their actual results** — real exit codes and real numbers, including the AC4 plant transcripts
   and the step-12 build transcript **with its persisted path and captured exit code**.
5. **Evidence locations** — I1 baseline, I2/I3 computed-style captures, the DOM witness, both plant transcripts + the
   failing `manifest.json`, and the final run's `manifest.json`. Name **every** run directory you created.
6. **The A2 cascade result** — state explicitly whether sites 7 and 8 kept their declarations, and how you measured it.
7. **N3 recorded** — the icon `rem` → `px` unit change, as a known accepted sprint convention, not as zero-delta.
8. **Standing findings not acted on** — the repo-wide N1 debt in the four existing modules, and the
   `--mantine-radius-lg` 8px/16px discrepancy (§3.2).
9. **Assumptions, deviations, limitations, unresolved issues.**
10. Concise current state appended to `docs/backlog.md` — **state only**, no history. The file is at a documented
    pre-existing **108**-line breach; do not add net lines, and flag a `BACKLOG LIMIT BREACH` if you cannot hold it.

**Status must be `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`.** Never
self-approve, never produce a `Decision`/`Confidence`/`Blocking findings` section, and never run, emit, suggest, or
delegate any mutating git command, including any form of `git push`.

---

## 15. Task quality gate

| Check | Status |
|---|---|
| A fresh Sonnet session can execute this with no hidden chat context | ✅ every path, line number, compiled declaration, breakpoint and command is named |
| Every primary requirement has a binary AC and a verification method | ✅ R1–R12 → AC1–AC12 → §13 steps 1–13 |
| Scope protects existing behavior and names what must not change | ✅ §8, plus §10.4/§10.5's verbatim-preservation list and the zero-diff test requirement |
| No uninspected claim | ✅ all 23 compiled declarations, both breakpoints, the token-emission table and the `sm:basis-full` absence were extracted from `iframe-HOXpMATP.css` on 2026-08-04; the 9 sites were read at source; the gate state comes from a real manifest |
| The gate proves the changed behavior, not merely procedure | ✅ AC4 re-proves the comparator on the migrated code — a green run is explicitly declared insufficient, and a blind comparator is `BLOCKED` |
| Critical flow named or excluded from evidence | ✅ §3.7 names registry row 50 and §13 argues Q4 from it, rejecting Q3 explicitly |
| Owner exceptions have traceable authorization | ✅ D28/D32/D33 recorded in Sprint 49 with date and scope; D26/D6 cited with file and date |
| Exactly one active executable route | ✅ §7's per-site table decides all 9; §5.1 fixes the names; §5.2 records that no owner decision is open |
| Every checkpoint names producer, output, comparator, failure behavior | ✅ §13 + AC4's `BLOCKED` clause + AC2's D26 comparator + AC7's I2/I3 diff with its explicit no-`!important` failure path |
| Zero/empty input covered | ✅ §11 — the `--fallback` story (no card) and late/partial render are applicable branches with named evidence |
| Worktree state established with a pre-write snapshot | ✅ §3.8 names the 18 owner paths, requires a manifest, and supplies the measured 24/1184 ambient noise floor so it is not misread |
| Prior-review corrections folded in | ✅ 707 **N1** (§3.6, §10.1, AC5 — including that the gate cannot catch it), **N2** (§3.6), **N3** (§3.6, report item 7), **N6** (§10.8, AC12), **N7** + Task 708 review P3 (AC11 demands a captured exit code), and Task 708 review P3 on unnamed run dirs (§13, report item 5) |
| Sprint assigned before creation | ✅ Sprint 49, D32 precondition satisfied by 708 at `16960dc77` |

**Remaining ambiguous or conflicting requirements: none.**
**Owner decisions still needed: none** — D28, D32 and D33 close the mechanism, the sequencing and the anchor.
