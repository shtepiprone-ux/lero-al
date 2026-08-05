# Task 712 — The homepage route shell was never censused, and its canonical Story is a hand-copied replica

**Sprint:** 51 (`tasks/Sprints/Sprint_51_RouteShell_DeTailwind_And_Story_Parity.md`). **Epic:** MM Phase-2.
**Depends on:** nothing. 710 is `APPROVED WITH NOTES` and Sprint 49 is closed.

---

## 1. Mode and task type

- **Mode:** implementation (Sonnet executor, via `.claude/skills/execute-task/SKILL.md`).
- **Primary task type:** **UI de-hybrid (D28 de-Tailwind)** — `docs/rule-index.md` → UI/Mantine migration.
- **Secondary type:** **canonical-Story parity repair** (`docs/agent-contract.md` cl. 16c).

> **Read this first.** You are removing **two** raw Tailwind utilities from one line of production code. That part is
> small. The part that is not small is that the canonical Mantine Story which the CI-blocking `--mantine-only` matrix
> uses to prove that band — `Mantine/Primitives/HeroSearch`, **40 cells** — does not render the production
> composition at all. It renders a hand-written `<section>`/`<div>` replica carrying its own raw utilities. If you
> migrate production and leave the Story alone, the blocking gate keeps passing while proving markup that no longer
> exists. **Both sides move in this task, or neither does.**

---

## 2. Objective

1. Remove `relative` and `z-10` from `src/app/[locale]/page.tsx:29` under **D28** (mechanism-only, zero visual
   delta) and **D34** (reproduce the utility's cascade layer), keeping the `container-wide` marker class verbatim.
2. Make `src/stories/mantine/primitives/HeroSearch.stories.tsx` render the **same composition production renders**,
   closing the cl. 16c divergent-stand-in defect at `:53-54` and `:90-91`.
3. Prove zero visual delta against the **40 herosearch cell md5s** in the 709-R baseline — the comparator that
   demonstrably failed for 709 (20 cells regressed) and passed after 709-R, satisfying **D32**.
4. Close the census gap in `docs/backlog.md:22` so route files are named and cannot be omitted again.

**Non-goals, stated as objectives so they are not silently attempted:** do **not** touch
`src/app/[locale]/layout.tsx` (§8 — it is coupled to `MobileBottomNavView`, Sprint 50); do **not** restyle,
re-token, or "improve" anything (D28 forbids it); do **not** change `HeroSearchView.tsx` or
`HeroSearchView.module.css` (709/709-R closed them); do **not** touch any other route file.

---

## 3. Verified context

Every fact below was read or executed in this worktree on branch `task/q0-ci-rendered-locale-split` on
**2026-08-05**, during the scoping pass for this task. Nothing is inferred from a filename or a prior report.

### 3.1 The production site — one line, two utilities

`src/app/[locale]/page.tsx:28-29`, read verbatim:

```tsx
<Box component="section" bg="var(--primary)" pos="relative" py={{ base: 'var(--space-16)', md: 'var(--space-24)' }}>
  <Box className="container-wide relative z-10">
```

- `container-wide` is a **marker class**, not a utility — defined at `src/app/globals.css:640` with
  `--width-page-max: 88rem` at `:309`, and breakpoint padding at `:648`. It **stays verbatim**.
- `relative` and `z-10` are raw Tailwind utilities. They are the entire de-Tailwind payload of this task.
- The **outer** Box already carries `pos="relative"` as a Mantine style prop. The inner Box's `relative` is
  therefore a second, nested stacking context whose necessity is **not established** — see A1.

### 3.2 Why no gate caught this — measured, not assumed

- `docs/backlog.md:22`'s census enumerates **components**. `src/app/[locale]/page.tsx` and
  `src/app/[locale]/layout.tsx` appear in no row of it.
- `scripts/check-design-tokens.mjs:26` lists "Named token utilities (`p-4`, `text-sm`, `shadow-md`, `z-50`,
  `max-w-md`, `duration-200`)" among what it **does not** flag; only bracket forms (`z-[N]`, `:145`) are violations.
  So `z-10` passes `check:design-tokens` cleanly. Confirmed: `npm run check:design-tokens` reports **0** violations
  on the current tree (Task 710 evidence, `i7-check-design-tokens.log`).
- No script in `scripts/` is named for Tailwind/utility/hybrid scanning (`ls scripts/ | grep -i
  'tailwind\|utilit\|hybrid\|detailwind'` → no matches).
- `docs/backlog.md:87` already records the general form of this: **"No CI gate asserts the Mantine composition of a
  *route*"** — verified 2026-07-26, still true. `--mantine-only` scopes by Storybook **title prefix**, so a route
  file is unreachable by it.

### 3.3 The canonical Story is a replica, not the production composition

`src/stories/mantine/primitives/HeroSearch.stories.tsx`, `title: 'Mantine/Primitives/HeroSearch'` (`:32`):

| Line | Story renders | Production renders (`page.tsx:28-29`) |
|---:|---|---|
| `:53` / `:90` | `<section className="relative py-16 md:py-24" style={{ background: 'var(--primary)' }}>` | `<Box component="section" bg="var(--primary)" pos="relative" py={{ base: 'var(--space-16)', md: 'var(--space-24)' }}>` |
| `:54` / `:91` | `<div className="container-wide relative z-10">` | `<Box className="container-wide relative z-10">` |

Both wrapper nodes are raw HTML elements with raw utilities standing in for Mantine `Box`es. `agent-contract`
cl. 16c: a Story "may not … rely on a divergent demo stand-in"; if one exists, "the same task must preserve or
update it so it renders the migrated artifact with the same canonical primitive and state."

**This divergence predates this task and is not yours to have caused — but it is yours to close, because you are
about to change the production side of it.**

### 3.4 The comparator — measured from the real manifest

Enumerated from `.screenshots/rendered-assert/2026-08-05T11-33/manifest.json` (the 709-R post-revert green run,
`--mantine-only`, 1184 cells) on 2026-08-05:

- **40 herosearch cells**, from exactly two story IDs: `mantine-primitives-herosearch--default` and
  `mantine-primitives-herosearch--fallback`.
- **4 locales** (`sq`, `en`, `uk`, `it`) × **5 viewports** (`mobile-320`, `mobile-375`, `mobile-390`,
  `desktop-1024`, `band-700`) × 2 stories = 40.
- `MANTINE_VIEWPORTS` is defined at `scripts/check-stories-rendered.mjs:392` and is deliberately a reduced set so
  the phase can run unconditionally.

**This comparator has demonstrably failed.** Task 709 regressed 20 of these 40 cells; 709-R restored all 40 to
their pre-709 md5 and the reviewer recomputed 40/40 with 0 mismatches (`docs/backlog.md:8`). D32 is satisfied by
history, not by assertion — you do not need to invent a plant to prove the comparator can fail.

### 3.5 The D34 reference implementation

`src/components/shared/HeroSearchView.module.css` is the pattern to copy, not to re-derive:

- `:54` — the whole file is wrapped in `@layer utilities`. Its header (`:30-51`) records exactly why: a D28
  migration must reproduce the utility's **losing** cascade standing, because a layered rule loses to every
  unlayered rule regardless of specificity or source order.
- **N1** (`:10-11`): every declaration reproduces the compiled **token reference** (`padding: var(--space-3)`),
  never its resolved value (`0.75rem`).
- The inverse family (602/629/650/651/653/654/656) stays **unlayered on purpose** — those override a dead utility.
  This task is a migration, so it is the **layered** case.

### 3.6 What is already clean — so you do not re-do finished work

Re-measured 2026-08-05 across the whole `/[locale]` render tree:

- **Axis ⓐ (Mantine component migration) is complete.** Only two files in the homepage tree import from
  `@/components/ui/*`, both `AppImage` (`PopularLocationsView.tsx:4`, `ListingCard.tsx:6`), and `AppImage` is a
  native `<img>` + Cloudinary wrapper — no `data-slot`, no Radix, no CVA. Task 650's closure holds.
- `HeroSearchView.tsx:50` → `className="hero-search"` is a **marker**; its other 6 sites are `styles.*`. 709 done.
- `FeaturedListingsView.tsx:59` / `LatestListingsView.tsx:44` → `featured-listings` / `latest-listings` markers. 707 done.
- `PopularLocationsView.tsx:78` → `CITY_GRADIENTS` resolves to `styles.gradient0…7` CSS-module classes
  (`:23-31`), **not** gradient utilities. 688 done.
- `HeaderView.tsx` / `FooterView.tsx` → `site-header` / `site-footer` / `container-wide` markers + `styles.*`. 706/673 done.

### 3.7 Worktree state

Task 710's nine paths are committed as of this kickoff. **Take your own pre-write `git status --porcelain`
snapshot before your first edit.** If it is not empty, complete
`docs/orchestrator-dirty-worktree-manifest-template.md` for every entry and never touch a foreign path.

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | §3.1 | `src/app/[locale]/page.tsx:29` carries **zero** raw Tailwind utilities. `container-wide` survives verbatim. | P0 | AC1 | Confirmed |
| R2 | §3.1, A1 | The `relative`/`z-10` behaviour is either reproduced by an equivalent mechanism, or **dropped with a measured proof that it was inert**. A silent drop is not acceptable. | P0 | AC2 | Confirmed |
| R3 | D28/D34/N1 | Any new `.module.css` is wrapped in `@layer utilities` and reproduces the compiled **token reference**, never a resolved value. If Mantine style props suffice, no module file is created at all. | P0 | AC3 | Confirmed |
| R4 | §3.3, cl. 16c | `HeroSearch.stories.tsx:53-54` and `:90-91` render the **same composition** production renders — Mantine `Box` with the same props, not a raw `<section>`/`<div>` with utilities. | P0 | AC4 | Confirmed |
| R5 | §3.4, D32 | All **40** herosearch cell md5s are unchanged against the `2026-08-05T11-33` baseline, **or** every difference is enumerated with a measured cause. | P0 | AC5 | Confirmed |
| R6 | A2 | The story-vs-production **geometry parity question is answered with a measurement**: does `py-16 md:py-24` compute identically to `py={{ base:'var(--space-16)', md:'var(--space-24)' }}`? Report the numbers either way. | P0 | AC6 | Confirmed |
| R7 | §3.2 | `docs/backlog.md:22`'s census names route files explicitly, so the omission cannot repeat. | P1 | AC7 | Confirmed |
| R8 | §3.3 | `docs/storybook-governance.md` records the cl. 16c stand-in defect and its closure, cross-referenced to the 40-cell comparator. | P1 | AC8 | Confirmed |
| R9 | scope | Zero diff in `layout.tsx`, `HeroSearchView.tsx`, `HeroSearchView.module.css`, `check-stories-rendered.mjs`, and every file outside §7. | P0 | AC9 | Confirmed |
| R10 | agent-contract cl. 9 | `npm run build` exits 0, transcript persisted with the exit code captured **inside** the file. | P0 | AC10 | Confirmed |
| R11 | agent-contract cl. 7 | No user-facing string added or changed; if one is, all four locales are covered. | P2 | AC11 | Confirmed |
| R12 | cl. 14, N6 | Counting gates run **last**, and their actual numbers appear in the session log under a heading that exists. | P2 | AC12 | Confirmed |

---

## 5. Assumptions and open questions

- **A1 — `z-10` may be inert, and you must find out rather than assume.** The outer Box (`:28`) is already
  `pos="relative"`. Nothing else inside that `<section>` in `page.tsx` establishes a competing stacking context,
  and `src/app/globals.css` declares `z-index` at only one place in a relevant band (`:691`, `z-index: 1`). **But
  the hero contains `HeroSearchClient`, whose subtree includes overlays/popovers you have not traced.** Before
  dropping `z-10`, capture the computed `z-index` and stacking order of the hero subtree at 320/700/1024, and
  re-capture after. If any element's paint order changes, reproduce `z-10` instead of dropping it.
- **A2 — the Story may already diverge from production geometrically, and that changes what "no delta" means.**
  Production uses `py={{ base:'var(--space-16)', md:'var(--space-24)' }}`; the Story uses `py-16 md:py-24`, which
  Tailwind v4 compiles from `calc(var(--spacing) * N)`. **Whether those resolve to the same pixels is unmeasured.**
  Measure it in I1. If they differ, the Story has been proving the wrong geometry and the 40 md5s **will** move
  when you fix it — that is a *correction*, not a regression, but it must be reported as such and the new baseline
  explained cell by cell. **Do not silently accept moved md5s, and do not "fix" them by keeping the replica.**
- **A3 — the marker classes are contracts.** `container-wide` (production and story) and `hero-search`
  (`HeroSearchView.tsx:50`) are consumed by CSS and by gates. They survive verbatim. Do not fold them into a module.
- **A4 — if Mantine style props express it, do not create a module file.** `pos="relative"` and a `style={{ zIndex }}`
  or `styles`-less prop may cover both utilities. A `.module.css` is the fallback, not the default. Whatever you
  choose, D34's layering rule binds only if you create a module.

### 5.1 Naming — decided, do not re-litigate

If a module file is needed: `src/app/[locale]/page.module.css`. No task number in any filename, class name, or
commit-visible identifier (Task 701 F2).

### 5.2 Rejected alternatives — do not re-open

- **Also de-Tailwind `layout.tsx` in this task.** Rejected: `pb-14` reserves clearance for
  `MobileBottomNavView.tsx:36`'s `fixed bottom-0 … h-14` bar and `md:pb-0` mirrors its `hiddenFrom="md"`. The value
  and breakpoint are derived from the nav; splitting the pair across two tasks invites a silent mismatch. **Sprint 50.**
- **Leave the Story alone because "it renders fine".** Rejected by `agent-contract` cl. 16c. A Story that passes
  while diverging from production is worth less than no Story, because it manufactures confidence.
- **Delete `z-10` because it looks vestigial.** Rejected: that is the assumption A1 exists to test. §3.1 establishes
  the outer `pos="relative"`; it does **not** establish that the inner one is inert.
- **Add a route-file utility scanner in this task.** Rejected: a repo-wide gate is its own blast radius and its own
  planted proofs. Record it as a follow-up; R7 closes the census gap in documentation for now.

---

## 6. Pre-read rule bundle

Read exactly these. Do not read all docs.

**Always required:** `docs/agent-contract.md` (cl. 1, 7, 9, 14, **16, 16b, 16c**) · `docs/rule-index.md` ·
`docs/qa-profiles.md` · `docs/backlog.md` (**:22** the census, **:83** D28/D32/D34, **:87** the route-gate note).

**Because this is UI/Mantine work:** `docs/mantine-responsive-design-system.md` · `docs/tailadmin-style-reference.md` ·
`docs/component-rules.md` · `docs/design-system.md` **§4** (the `container-wide` contract).

**Because this touches a story-rendered surface:** `docs/storybook-governance.md` **§14.9** (the Mantine rendered
gate), **§14.9.7** (known limitations), **§14.9.23** (the assertion-liveness meta-gate Task 710 just added).

**Task-specific sources — read, and note which you may not edit:**

- `src/app/[locale]/page.tsx` **`:24-45`** — the hero band. **Edit only `:29`.**
- `src/stories/mantine/primitives/HeroSearch.stories.tsx` **`:28-97`** — both stories. **Edit `:53-54`, `:90-91`.**
- `src/components/shared/HeroSearchView.module.css` **in full** — the D34/N1 reference. **Read; do not edit.**
- `src/components/shared/HeroSearchView.tsx` **`:50`** — the `hero-search` marker. **Read; do not edit.**
- `src/app/globals.css` **`:307-311`**, **`:633-650`** — the `container-wide` contract.
- `src/components/layout/MobileBottomNavView.tsx` **`:33-38`** — read **only** to confirm §8's coupling argument.
- `docs/sessions/2026-08-05-task709R-herosearchview-layer-fix.md` — the 40-cell md5 method you are reusing.

---

## 7. Scope

- `src/app/[locale]/page.tsx` — **1 line** (`:29`).
- `src/app/[locale]/page.module.css` — **new, only if A4 concludes a module is required.**
- `src/stories/mantine/primitives/HeroSearch.stories.tsx` — **2 wrapper regions** (`:53-54`, `:90-91`).
- `docs/backlog.md` — census correction (R7) + concise state only.
- `docs/storybook-governance.md` — new subsection (R8).
- `docs/sessions/2026-08-0X-task712-homepage-route-shell-de-tailwind.md` — session log, real finish date.

## 8. Out of scope

- **`src/app/[locale]/layout.tsx`** — coupled to `MobileBottomNavView` (§5.2), Sprint 50. **Zero diff.**
- **`HeroSearchView.tsx` / `HeroSearchView.module.css`** — 709/709-R closed them. **Zero diff.**
- **`scripts/check-stories-rendered.mjs`** — D33. **Zero diff.**
- `ListingCard` (702) · `MantineListingCardPattern` (691) — Sprint 46.
- Any restyle, spacing, typography or token change — **D28 forbids it.**
- A repo-wide route-file utility gate — recorded as a follow-up, not built here.
- The pre-existing `<div>`-in-`<p>` FiltersPanel hydration warning (677) and the `LocationComboboxSubPanel`
  blank-canvas flake — record, do not fix.

---

## 9. Current and required behavior

**Current:** the homepage hero band renders `<Box component="section" bg pos py>` wrapping
`<Box className="container-wide relative z-10">`. Two of those classes are raw Tailwind utilities that no gate
detects, on a file no census counted. The canonical Story that the CI-blocking `--mantine-only` matrix uses to
prove that band renders a hand-written `<section>`/`<div>` replica with its own utilities, whose geometric
equivalence to production has never been measured.

**Required after:** production carries no raw utilities on that line and the `container-wide` marker is untouched;
the inner stacking context is either reproduced by an explicit mechanism or dropped with measured proof it was
inert; the Story renders the same Mantine composition production renders; and all 40 herosearch cells either hold
their baseline md5 or have each difference explained by measurement.

### Implementation sequence

- **I1 — Measure before you edit.** Take `git status --porcelain`. Then, on the **pre-edit** tree, capture from the
  built Storybook: (a) computed `position`/`z-index` and paint order for the hero subtree of
  `Mantine/Primitives/HeroSearch/Default` at 320/700/1024; (b) computed `padding-top`/`padding-bottom` on the story
  `<section>` at those widths; (c) the same padding from the **production** route if a dev server is available,
  otherwise compute `py-16`/`var(--space-16)` from source and say so. **A2 lives or dies here — persist it as a file.**
- **I2 — Production edit.** Change `page.tsx:29` only. Prefer Mantine style props (A4); create
  `page.module.css` in `@layer utilities` with N1 token references only if props cannot express it.
- **I3 — Story parity.** Rewrite `:53-54` and `:90-91` to the production composition. The `container-wide` marker
  stays. Re-run I1's captures and diff them against I1's numbers.
- **I4 — The 40-cell comparator.** Run `npm run screenshots:assert -- --mantine-only`, then recompute the 40
  herosearch md5s against `.screenshots/rendered-assert/2026-08-05T11-33/`. **Capture the exit code unpiped**
  (`.claude/skills/execute-task/SKILL.md` item 3a — Task 710 R10). Enumerate every moved cell with its cause.
- **I5 — `npm run check:assertion-liveness`** against the manifest I4 produced. Expect `3 LIVE / 2 DEAD-KNOWN /
  0 DEAD-NEW / 0 STALE-ENTRY`, exit 0. A `DEAD-NEW` here means your change killed an assertion — stop and report.
- **I6 — Docs, session log, backlog** (R7/R8).
- **I7 — Counting gates last** (`check:file-integrity`, `check:mojibake`), after the log and backlog row exist, and
  write their real numbers into the log.

---

## 10. Implementation requirements

1. **`container-wide` is untouched** in both production and story (A3).
2. **Never drop a declaration you have not measured as inert** (A1/R2).
3. **If you create a module, it is `@layer utilities`-wrapped and N1-compliant** (D34, §3.5).
4. **The Story must render Mantine `Box`, not `<section>`/`<div>`** (cl. 16c).
5. **Zero visual delta is the objective, not a hoped-for side effect** (D28). If the 40 md5s move, that is a finding
   to report, never a baseline to quietly rewrite.
6. **Capture every transcript unpiped** — redirect, then append `$LASTEXITCODE` as its own statement (Task 710 R10).
7. **No task number** in any filename, class name, or npm script (Task 701 F2).
8. **Run `check:file-integrity` and `check:mojibake` LAST** (N6, 6th recurrence would be a P1).

---

## 11. Positive and negative flows

**Positive flow:** `page.tsx:29` renders with no raw utilities; the hero band's computed geometry and stacking order
are byte-identical to I1's pre-edit capture; the Story renders the production composition; 40/40 herosearch md5s
match the 709-R baseline; `check:assertion-liveness` reports 3/2/0/0 exit 0; `npm run build` exits 0.

| Branch | Applicable? | Owner / source | Expected behavior | Evidence |
|---|---:|---|---|---|
| `z-10` was load-bearing | **Yes** | A1/R2 | paint order changes → reproduce it, do not drop | AC2 |
| `z-10` was inert | **Yes** | A1/R2 | identical stacking capture → drop with the proof persisted | AC2 |
| Story geometry ≠ production geometry | **Yes** | A2/R6 | md5s move; enumerate every cell and its cause; report as a correction | AC5, AC6 |
| Story geometry == production geometry | **Yes** | A2/R6 | 40/40 md5s hold | AC5 |
| Mantine props cannot express the mechanism | **Yes** | A4/R3 | create `page.module.css`, `@layer utilities`, N1 tokens | AC3 |
| A new assertion dies from this change | **Yes** | I5 | `check:assertion-liveness` returns `DEAD-NEW`, exit 1 → stop and report | AC5 |
| Locale expansion | **No** | no string added or changed; R11 is an assertion of that, not new work | N/A | AC11 |
| Small viewport / responsive | **Yes** | the 40 cells include 320/375/390 | covered by the md5 comparator | AC5 |
| RLS / authorization | **No** | presentational route shell, no data access | N/A | — |
| Duplicate action / partial failure | **No** | static markup, no action or async branch | N/A | — |

---

## 12. Acceptance criteria

- **AC1 [R1]** Given `src/app/[locale]/page.tsx:29`, when read, then it contains no Tailwind utility class and
  still contains `container-wide`. Quote the before and after line.
- **AC2 [R2]** Given the I1 pre-edit and I3 post-edit stacking captures at 320/700/1024, when diffed, then paint
  order and computed `z-index` are identical. If `z-10` was dropped, this diff **is** the proof; persist both captures.
- **AC3 [R3]** Given the chosen mechanism, when read, then either no `.module.css` exists (props sufficed) or
  `page.module.css` is wrapped in `@layer utilities` and every declaration cites a token reference. Quote it in full.
- **AC4 [R4]** Given `HeroSearch.stories.tsx:53-54` and `:90-91`, when read, then both render the same Mantine
  composition as `page.tsx:28-29`, with no raw `<section>`/`<div>` wrapper and no raw utility. Quote both diffs.
- **AC5 [R5]** Given `npm run screenshots:assert -- --mantine-only` and a recomputation of the 40 herosearch md5s
  against `2026-08-05T11-33`, then either 40/40 match, or every mismatch is listed with story ID, locale, viewport
  and measured cause. Persist the transcript with the exit code captured **unpiped**, inside the file.
- **AC6 [R6]** Given I1's measurement, then the session log states the computed `padding-top`/`padding-bottom` for
  the story wrapper and for production at 320/700/1024, and answers plainly whether `py-16 md:py-24` and
  `py={{ base:'var(--space-16)', md:'var(--space-24)' }}` resolve identically.
- **AC7 [R7]** Given `docs/backlog.md:22`, when read, then route files are named in the census with their measured
  state, and `layout.tsx` is recorded as Sprint 50's with the coupling reason.
- **AC8 [R8]** Given the new `docs/storybook-governance.md` subsection, when read, then it records the cl. 16c
  stand-in defect, its closure, and the 40-cell comparator.
- **AC9 [R9]** Given `git diff` on `layout.tsx`, `HeroSearchView.tsx`, `HeroSearchView.module.css` and
  `scripts/check-stories-rendered.mjs`, when read, then all are **empty**. Verify by hash, not by assertion.
- **AC10 [R10]** Given the final state, when `npm run build` runs, then it exits **0**, with the transcript at a
  path you state and the exit code captured **inside** that file.
- **AC11 [R11]** Given the diff, when read, then no user-facing string is added or changed. If one is, `sq`/`en`/
  `uk`/`it` are all present.
- **AC12 [R12]** Given `check:file-integrity` and `check:mojibake` run **after** the session log and backlog row
  exist, then both pass and their **actual numbers** appear in the session log under a heading that exists.

---

## 13. QA profile and verification plan

**Profile: `Q3` Visual/Responsive.** `docs/qa-profiles.md` routes visual/layout change to Q3, and this is a
mechanism-only change to a story-rendered, CI-blocking surface across 4 locales × 5 viewports. **Q4 is not
selected** — no critical-flow registry row covers the homepage hero shell, no auth/RLS/data-loss path is touched,
and the D32 planted-failure obligation is already discharged by history (§3.4: this exact comparator failed for 709
and passed for 709-R). **If your I1 measurement shows the Story never matched production (A2), escalate to Q4 and
say so** — that would make this a correction with an unknown blast radius, not a mechanism swap.

| # | Command / step | Expected |
|---:|---|---|
| 1 | `git status --porcelain` (I1) | empty, or a completed dirty-worktree manifest |
| 2 | I1 stacking + padding captures, pre-edit | persisted as files under `.screenshots/task712-evidence/` |
| 3 | `page.tsx:29` edit (I2) | 1 line changed |
| 4 | Story parity edit (I3) | 2 wrapper regions changed |
| 5 | I1 captures re-run post-edit | identical stacking; padding explained |
| 6 | `npm run screenshots:assert -- --mantine-only` (I4) | exit 0, manifest written |
| 7 | 40-cell md5 recompute vs `2026-08-05T11-33` | 40/40, or every diff enumerated |
| 8 | `npm run check:assertion-liveness` (I5) | `3 LIVE / 2 DEAD-KNOWN / 0 / 0`, **exit 0** |
| 9 | `npm run check:stories` | unchanged pass |
| 10 | `npm run check:design-tokens` | report what you observe (**0** as of Task 710; do not assume) |
| 11 | `npx tsc --noEmit` | 0 errors |
| 12 | **`npm run build`** | **exit 0 — hard gate**, transcript persisted with the exit code inside it |
| 13 | `check:file-integrity` · `check:mojibake` — **last** | pass; numbers written into the session log |

A failed or unrun step 12 permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`. `tsc=0` is not a substitute.

Evidence persists under `.screenshots/task712-evidence/` (local-only per **D6**), referenced by path from the
session log. **Name every artifact you create.** **Do not modify, overwrite or delete
`.screenshots/rendered-assert/2026-08-05T11-33/`** — it is 709-R's evidence and this task's baseline.

---

## 14. Completion report contract

Write `docs/sessions/2026-08-0X-task712-homepage-route-shell-de-tailwind.md` containing:

1. **Files changed** — table matching the real `git diff --stat`, reconciled against your pre-write snapshot.
2. **Requirement IDs completed** — R1–R12, each with its AC verdict.
3. **The A1 answer** — was `z-10` load-bearing? Both stacking captures, and what you did about it.
4. **The A2 answer** — the padding numbers, and whether the Story ever matched production.
5. **The before/after of `page.tsx:29`** and both story wrapper regions, quoted.
6. **The 40-cell md5 result** — 40/40, or every mismatch with story ID, locale, viewport and cause.
7. **Commands run and actual results** — real exit codes and real numbers, including the step-12 build transcript
   with its persisted path and captured exit code.
8. **Evidence locations** — every artifact and capture, named.
9. **A real counting-gates section** with the actual `check:file-integrity` / `check:mojibake` numbers.
10. **Standing findings not acted on** — `layout.tsx`/Sprint 50, the absent route-file utility gate, 677, the
    `LocationComboboxSubPanel` flake.
11. **Assumptions, deviations, limitations, unresolved issues.**
12. Concise current state appended to `docs/backlog.md` — **state only**, no history, plus the R7 census correction.
    The file is at **99** lines against a ~80 target and Opus owes it a consolidation; **do not add net lines**, and
    flag a `BACKLOG LIMIT BREACH` if you cannot hold it.

**Status must be `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`.** Never
self-approve, never produce a `Decision`/`Confidence`/`Blocking findings` section, and never run, emit, suggest,
or delegate any mutating git command, including any form of `git push`.

---

## 15. Task quality gate

| Check | Status |
|---|---|
| A fresh Sonnet session can execute this with no hidden chat context | ✅ every file, line number, class, story ID, cell count, viewport, locale and command is named |
| Every primary requirement has a binary AC and a verification method | ✅ R1–R12 → AC1–AC12 → §13 steps 1–13 |
| Scope protects existing behavior and names what must not change | ✅ §8 plus hash-verified zero-diff AC9 on four files, and §5.2's four rejected alternatives |
| No uninspected claim | ✅ `page.tsx:28-29`, `layout.tsx:49`, both story wrapper regions, `MobileBottomNavView:33-38`, `HeroSearchView.module.css`, `globals.css:307-311/633-650`, `check-design-tokens.mjs:26/145`, `MANTINE_VIEWPORTS:392` all read; the 40 cells / 2 story IDs / 4 locales / 5 viewports enumerated from the real manifest; the `AppImage`-is-not-shadcn and `CITY_GRADIENTS`-are-modules claims each verified in source — all 2026-08-05 |
| The gate proves the changed behavior, not merely procedure | ✅ AC5's 40-cell md5 comparator **demonstrably failed** for 709 and passed for 709-R (§3.4) — D32 discharged by history, not by assertion; AC2 makes the drop-vs-reproduce decision a measurement |
| Both arms of the risky decision are covered | ✅ §11 gives `z-10` load-bearing **and** inert, and story geometry matching **and** diverging, each with a distinct expected behavior |
| The task cannot silently rewrite its own baseline | ✅ §10.5 forbids it, AC5 requires cell-level enumeration, and §13 forbids touching the 709-R evidence directory |
| Canonical Story boundary inspected before publication (cl. 16c) | ✅ `Mantine/Primitives/HeroSearch` opened and read; the stand-in defect at `:53-54`/`:90-91` is **in scope**, not declared out of it |
| Canonical-source search performed before proposing a mechanism | ✅ `HeroSearchView.module.css` (D34/N1 reference), `globals.css`'s `container-wide` contract, and Mantine style props evaluated in A4 before any module file is authorized |
| Critical flow named or excluded from evidence | ✅ §13 argues Q3 explicitly and names the conditions that would escalate it to Q4 |
| Owner exceptions have traceable authorization | ✅ D6 cited for the evidence dir; D28/D32/D34/N1 cited with their sources; no new owner decision claimed |
| Exactly one active executable route | ✅ §5.1 fixes naming, A4 fixes the props-before-module order, §5.2 closes four alternatives |
| Every checkpoint names producer, output, comparator, failure behavior | ✅ §13 + I1's persisted pre-edit baseline + A1/A2's stop-and-report conditions + I5's `DEAD-NEW` stop |
| Zero/empty input covered | ✅ not applicable to static markup, and stated as such in §11 rather than invented |
| Worktree state established with a pre-write snapshot | ✅ §3.7 requires the executor's own snapshot and the dirty-worktree manifest if non-empty |
| Prior-review corrections folded in | ✅ Task 710 **R10** (unpiped capture, §10.6/I4), **701 F2** (no task numbers), **707 N6** (§10.8), the 709 stale-baseline lesson (§13 step 10 refuses to assume), and 710's own review finding that a census scoped to one artifact class misses the rest (§3.2) |
| Sprint assigned before creation | ✅ Sprint 51, opened with its own plan file before this kickoff was written |

**Remaining ambiguous or conflicting requirements: none.**
**Owner decisions still needed: none for this task.** Sprint 51 §8 records that **711 still has no sprint** and that
Sprint 50's `MobileBottomNavView` task now also owns `layout.tsx` — both are separate decisions, not blockers here.
