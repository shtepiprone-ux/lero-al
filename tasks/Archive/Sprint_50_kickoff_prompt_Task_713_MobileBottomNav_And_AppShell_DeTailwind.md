# Task 713 — `MobileBottomNavView` de-Tailwind: the first migration that must carry its suppression markers across

**Sprint:** 50 (`tasks/Sprints/Sprint_50_MobileBottomNav_And_AppShell_DeTailwind.md`). **Epic:** MM Phase-2.
**Depends on:** nothing. 712 is `APPROVED WITH NOTES` and committed (`b29e9a626`).

---

## 1. Mode and task type

- **Mode:** implementation (Sonnet executor, via `.claude/skills/execute-task/SKILL.md`).
- **Primary task type:** **UI de-hybrid (D28 de-Tailwind)** — `docs/rule-index.md` → UI/Mantine migration.
- **Secondary type:** **governance-marker migration** — first carry-across of `design-tokens-allow` markers.

> **Read this first.** The de-Tailwind itself is the ordinary 673/706/707/709 pattern. What makes this task
> different is that **4 of the utilities you are removing carry `design-tokens-allow` suppression markers**, and
> `check:design-tokens` fails on a marker whose value is no longer detected on its line
> (`scripts/check-design-tokens.mjs:224`). Remove the utility, leave the marker, and the gate goes red. **No
> `.module.css` in this repo carries a marker today** — you are writing the first one. Prove it works with a
> planted violation before you rely on it.

---

## 2. Objective

1. Remove every raw Tailwind utility from `src/components/layout/MobileBottomNavView.tsx` (11 `className=` sites)
   under **D28** (mechanism-only, zero visual delta) and **D34** (`@layer utilities`), keeping the
   `mobile-bottom-nav` marker class verbatim.
2. Carry all **4** `design-tokens-allow` markers across to wherever their values now live, and prove the carry
   works: `check:design-tokens` must report **0 violations and 0 stale-markers**.
3. Remove `pb-14`/`md:pb-0` from `src/app/[locale]/layout.tsx:49`, expressing the bar-height ↔ clearance coupling
   without duplicating the magic number in two files.
4. Prove zero visual delta against the **32 `MobileBottomNavView` cell md5s** in the 712 baseline.

**Non-goals, stated so they are not silently attempted:** do **not** touch `min-h-[calc(100vh-4rem)]` (already
marked, out of scope); do **not** edit `scripts/check-design-tokens.mjs`; do **not** add `hideFromMd` to the Story
(§3.4 — its absence is deliberate); do **not** touch `ListingCard`/`MantineListingCardPattern` (Sprint 46);
do **not** restyle anything.

---

## 3. Verified context

Every fact below was read or executed in this worktree on branch `task/q0-ci-rendered-locale-split` on
**2026-08-05**. Nothing is inferred from a filename or a prior report.

### 3.1 The 11 sites, read verbatim

`src/components/layout/MobileBottomNavView.tsx`:

| Line | Node | Utilities |
|---:|---|---|
| `:36` | nav `Box` | `fixed bottom-0 left-0 right-0 z-30 bg-card border-t shadow-[0_-2px_16px_rgba(0,0,0,0.08)] flex items-stretch h-14` + `mobile-bottom-nav` marker · **marker #1** |
| `:46` | FAB `Link` | `flex-1 flex flex-col items-center justify-center gap-0.5 -mt-3 group` |
| `:50` | FAB `span` | `h-12 w-12 rounded-full flex items-center justify-center shadow-lg ring-2 ring-background transition-transform duration-150 group-active:scale-95` |
| `:51` | FAB `span`, conditional | `bg-primary/90 ring-primary/20` : `bg-primary` |
| `:53` | `Plus` icon | `h-6 w-6 text-primary-foreground` |
| `:56` | FAB label `span` | `text-[10px] font-medium text-muted-foreground leading-none` · **marker #2** |
| `:84-85` | `BottomNavItem` `cn()` | `flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors min-h-full` + `text-primary` : `text-muted-foreground` |
| `:89` | `UnstyledButton` | `h-full rounded-none p-0` (composed with `:84`) |
| `:90` | `Icon` | `h-5 w-5` |
| `:92` | button label `span` | `text-[10px] font-medium leading-none` · **marker #3** |
| `:98` / `:99` / `:101` | `Link` / `Icon` / label `span` | `className` (the `:84` chain) · `h-5 w-5` · `text-[10px] font-medium leading-none` · **marker #4** |

`style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}` at `:37` is an inline style, **not** a utility. It stays.

### 3.2 The marker count in the backlog is wrong

`docs/backlog.md:40` says "**3** `design-tokens-allow` markers to carry across". Direct count on 2026-08-05:
`grep -c design-tokens-allow` → **4**, at `:36` (`shadow-[0_-2px_16px_rgba(0,0,0,0.08)]`), `:56`, `:92`, `:101`
(each `text-[10px]`). **Correct the backlog as part of this task.**

### 3.3 How the marker gate actually works — read in source, not assumed

`scripts/check-design-tokens.mjs`:

- `:5` — scans `src/**/*.{tsx,ts,css}`. **`.module.css` files are in scope.**
- `:225` / `:233` — `parseInlineMarkers(line)` does `line.indexOf('design-tokens-allow:')` on the **raw physical
  line** and takes everything up to the `—` separator as the raw value. **It is comment-syntax agnostic** — a
  `/* design-tokens-allow: <value> — <reason> */` in CSS parses exactly like a `//` comment in TSX.
- `:219-221` — one marker suppresses one exact value on that physical line; distinct values need distinct markers.
- `:224`, `:384-393` — **a marker whose rawValue is absent from that line's detections is a `stale-marker`
  violation.** This is the trap: strip the utility, orphan the marker, fail the gate.
- `:223` — a missing or empty reason is an error in both report and strict modes.

**Current state:** `npm run check:design-tokens` → `0 raw style-value violation(s) | 0 stale-marker(s) | 0
missing-reason error(s)` (Task 712 evidence, `i7-check-design-tokens.log`).

**The rawValue the CSS detector reports for a moved declaration is NOT known** and must not be guessed — see A1.

### 3.4 The Story is honest, and its one divergence is deliberate

`src/stories/mantine/primitives/MobileBottomNavView.stories.tsx`:

- `:5` — `title: 'Mantine/Primitives/MobileBottomNavView'` → **inside the CI-blocking `--mantine-only` matrix.**
- `:19` / `:33` — two exports, `Guest` and `Authenticated`, both rendering the **real production component**. This
  is **not** a 712-style replica; there is no cl. 16c stand-in defect here.
- `:15-16` — neither export passes `hideFromMd`, deliberately: production's hide would blank the gate's
  `desktop-1024` cell. The same reason is recorded on the prop itself (`MobileBottomNavView.tsx:19-23`).
  **Do not "fix" this.** `MobileBottomNav.tsx:26` passes `hideFromMd` in production.
- Enrolled at `scripts/mantine-migration-scope.json:16`.

### 3.5 The comparator — measured from the real manifest

Enumerated from `.screenshots/rendered-assert/2026-08-05T17-47/manifest.json` (Task 712's run) on 2026-08-05:

- **32 cells**, from `mantine-primitives-mobilebottomnavview--guest` and `--authenticated`.
- **4 locales** × **4 viewports** (`mobile-320`, `mobile-375`, `mobile-390`, `desktop-1024`) × 2 stories = 32.
- All 32 currently `pass`. There is no `band-700` here — `MANTINE_STORY_EXTRA_VIEWPORTS`
  (`check-stories-rendered.mjs:417-418`) grants that only to `HeroSearch`.

**D32 is discharged by history:** this md5 method demonstrably failed for Task 709 (20 of 40 herosearch cells
regressed) and passed after 709-R and 712. You do not need to invent a plant for the comparator itself — but you
**do** need one for the marker carry-across (R3).

### 3.6 The `layout.tsx` coupling — measured

`src/app/[locale]/layout.tsx:49`: `<main className="min-h-[calc(100vh-4rem)] pb-14 md:pb-0">`, with a
`design-tokens-allow` marker covering `min-h-[calc(100vh-4rem)]` only.

- `pb-14` reserves clearance for the `h-14` bar at `MobileBottomNavView.tsx:36`.
- `md:pb-0` mirrors that component's `hiddenFrom="md"`; the project's Mantine `md` is overridden to `48em`/768px
  (`src/design-system/mantine/theme.ts:166`), identical to Tailwind's `md` — **this is why the two breakpoints
  agree, and it is the citation to use** (Task 712 review F1).
- Tailwind v4 resolves `h-14`/`pb-14` through `calc(var(--spacing) * 14)`. Task 712 measured `--spacing` at
  `0.25rem` empirically (`py-16` → 64px), which gives **3.5rem / 56px** — **confirm this by measurement, do not
  inherit it as an assumption** (A2).

### 3.7 Precedent, and where it runs out

- `src/components/layout/HeaderView.module.css` (706) and `FooterView.module.css` (673) are the layout-component
  module precedent. **Both carry zero markers** (`grep -c` → 0/0), so neither shows you how to carry one across.
- `src/components/shared/HeroSearchView.module.css:54` is the D34 `@layer utilities` reference, and its header
  `:10-11` states N1 (reproduce the token reference, never the resolved value).
- **No `.module.css` anywhere in `src/` contains a `design-tokens-allow` marker** (`grep -rln` → no matches). You
  are writing the first.

### 3.8 Worktree state

Task 712's five paths are committed. **Take your own pre-write `git status --porcelain` snapshot before your first
edit.** If it is not empty, complete `docs/orchestrator-dirty-worktree-manifest-template.md` for every entry and
never touch a foreign path.

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | §3.1 | `MobileBottomNavView.tsx` carries **zero** raw Tailwind utilities across all 11 sites. `mobile-bottom-nav` survives verbatim. | P0 | AC1 | Confirmed |
| R2 | D28/D34/N1 | The new `MobileBottomNavView.module.css` is wrapped in `@layer utilities` and reproduces compiled **token references**, never resolved values. | P0 | AC2 | Confirmed |
| R3 | §3.3 | All 4 markers are carried across and **proven** to suppress: a planted run without the marker FAILS naming the exact rawValue; with the marker, `0 violations / 0 stale-markers`. | P0 | AC3 | Confirmed |
| R4 | §3.6 | `layout.tsx:49`'s `pb-14`/`md:pb-0` are removed; the clearance is expressed without duplicating `56px` as a literal in two files. `min-h-[calc(100vh-4rem)]` and its marker are untouched. | P0 | AC4 | Confirmed |
| R5 | §3.5 | All **32** `MobileBottomNavView` cell md5s unchanged vs `2026-08-05T17-47`, **or** every difference enumerated with a measured cause. | P0 | AC5 | Confirmed |
| R6 | §3.1 | `group`/`group-active:scale-95`, `bg-primary/90`, `ring-primary/20` and `-mt-3` are reproduced with **measured** equivalence, not approximated. | P0 | AC6 | Confirmed |
| R7 | §3.6 | The bar-height ↔ clearance coupling is verified at runtime: measured bar height equals measured `main` bottom padding below 768px, and clearance is 0 at/above 768px. | P0 | AC7 | Confirmed |
| R8 | §3.4 | The Story still renders the real component and still omits `hideFromMd`. Zero diff in the story file unless R1 forces one; if forced, quote why. | P0 | AC8 | Confirmed |
| R9 | §3.2 | `docs/backlog.md`'s marker count is corrected 3 → 4, and 713's state recorded. | P1 | AC9 | Confirmed |
| R10 | §3.3, §3.7 | `docs/storybook-governance.md` documents the marker carry-across pattern so the next de-Tailwind reuses it. | P1 | AC10 | Confirmed |
| R11 | scope | Zero diff in `check-design-tokens.mjs`, `HeaderView*`, `FooterView*`, `ListingCard*`, `MantineListingCardPattern*`, `check-stories-rendered.mjs`. | P0 | AC11 | Confirmed |
| R12 | agent-contract cl. 9 | `npm run build` exits 0, transcript persisted with the exit code captured **inside** the file. | P0 | AC12 | Confirmed |
| R13 | agent-contract cl. 7 | No user-facing string added or changed; the 5 `nav`/`common` keys still resolve in all four locales. | P1 | AC13 | Confirmed |
| R14 | cl. 14, N6 | Counting gates run **last**, actual numbers in the session log under a heading that exists. | P2 | AC14 | Confirmed |

---

## 5. Assumptions and open questions

- **A1 — the CSS rawValue is unknown and must be measured, not guessed.** When `text-[10px]` becomes
  `font-size: 10px` in a module, `check:design-tokens` will detect *something* on that line — `10px`,
  `font-size: 10px`, or another exact string. §3.3 says the marker must match **byte-for-byte**. **Determine the
  string empirically:** write the declaration with no marker, run the gate, and read the exact rawValue out of the
  violation report. Then write the marker with that string. Guessing produces a stale-marker on your first run.
- **A2 — `--spacing` is 0.25rem by Task 712's measurement, not by declaration.** `grep -- '--spacing:'
  src/app/globals.css` returns nothing; the value is Tailwind v4's built-in default, inferred from 712's
  `py-16 → 64px` capture. Re-measure `h-14` and `pb-14` yourself before hard-coding 56px anywhere.
- **A3 — `group-active:scale-95` has no direct Mantine or style-prop equivalent.** It compiles to a
  parent-state-dependent rule (`.group:active .child { --tw-scale: 95% }`). A module can express it as
  `.fabLink:active .fab { transform: scale(0.95) }`, but the **transform composition** and the transition on
  `:50` (`transition-transform duration-150`) must be reproduced together or the press animation changes.
  Capture the computed `transform`/`transition` before and after, at rest and under `:active`.
- **A4 — `bg-primary/90` and `ring-primary/20` are alpha-modified tokens.** Reproduce the compiled
  `color-mix(...)`/`rgb(... / <alpha>)` expression the utility actually emits, read from the built CSS — **not** a
  hand-written approximation of "90% opacity". N1 applies: keep the token reference.
- **A5 — the clearance number must live in one place.** `h-14` on the bar and `pb-14` on `main` are the same
  56px. Reproducing both as independent literals recreates the coupling defect this task exists to close. Prefer a
  shared custom property (e.g. a `--mobile-bottom-nav-h` declared once) consumed by both. If you conclude that is
  not workable, say why and record the alternative — do not silently duplicate.
- **A6 — the Story omits `hideFromMd` on purpose.** §3.4. Adding it blanks the `desktop-1024` cell and destroys
  8 of the 32 comparator cells. If a change to `MobileBottomNavView` forces a story edit, that is a finding to
  report, not a licence to change the prop.

### 5.1 Naming — decided, do not re-litigate

`src/components/layout/MobileBottomNavView.module.css`, matching `HeaderView.module.css`/`FooterView.module.css`.
No task number in any filename, class name, or CSS custom property.

### 5.2 Rejected alternatives — do not re-open

- **Leave the 4 allow-marked utilities as utilities and de-Tailwind only the other 7 sites.** Rejected: it leaves
  the component hybrid, which is the state D28 exists to end, and it dodges the exact problem this sprint was
  opened to solve.
- **Relax `check-design-tokens.mjs` so orphaned markers stop failing.** Rejected: the stale-marker rule is the
  thing that keeps the allowlist honest — it is `check:design-tokens`'s equivalent of Task 710's `STALE-ENTRY`.
  The gate is out of scope (§8).
- **Split `layout.tsx` into its own task.** Rejected: Task 712 already deferred it here precisely because the
  padding is derived from the bar. Splitting it re-creates the two-file magic number.
- **Approximate `group-active:scale-95` with a Mantine prop.** Rejected by A3 — reproduce the compiled rule and
  measure it.

---

## 6. Pre-read rule bundle

Read exactly these. Do not read all docs.

**Always required:** `docs/agent-contract.md` (cl. 1, 3, 7, 9, 11, 14, 16, 16b, 16c) · `docs/rule-index.md` ·
`docs/qa-profiles.md` · `docs/backlog.md` (**:22** census, **:40** Sprint 50, **:83** D28/D32/D34).

**Because this is UI/Mantine work:** `docs/mantine-responsive-design-system.md` · `docs/tailadmin-style-reference.md` ·
`docs/component-rules.md` · `docs/design-system.md`.

**Because this touches a `--mantine-only` story:** `docs/storybook-governance.md` **§14.9**, **§14.9.7**,
**§14.9.23** (the assertion-liveness meta-gate), **§14.9.24** (712's Story-parity precedent and the theme-breakpoint
rule).

**Task-specific sources — read, and note which you may not edit:**

- `src/components/layout/MobileBottomNavView.tsx` **in full** — the 11 sites.
- `src/components/layout/MobileBottomNav.tsx` **`:21-27`** — the production `hideFromMd` caller.
- `src/stories/mantine/primitives/MobileBottomNavView.stories.tsx` **in full** — **read; edit only if R1 forces it.**
- `src/app/[locale]/layout.tsx` **`:44-56`** — edit `:49` only.
- `src/components/layout/HeaderView.module.css` · `FooterView.module.css` — the layout module precedent.
- `src/components/shared/HeroSearchView.module.css` **in full** — the D34/N1 reference. **Read; do not edit.**
- `scripts/check-design-tokens.mjs` **`:195-250`**, **`:380-400`** — the marker parser and stale detector.
  **Read; do not edit.**
- `src/design-system/mantine/theme.ts` **`:160-170`** — the breakpoint override.

---

## 7. Scope

- `src/components/layout/MobileBottomNavView.tsx` — 11 sites.
- `src/components/layout/MobileBottomNavView.module.css` — **new.**
- `src/app/[locale]/layout.tsx` — **`:49` only**, and only `pb-14`/`md:pb-0`.
- `src/app/globals.css` — **only** if A5's shared custom property needs declaring there; one declaration, no other change.
- `docs/backlog.md` — R9 marker-count correction + concise state only.
- `docs/storybook-governance.md` — the R10 carry-across pattern.
- `docs/sessions/2026-08-0X-task713-mobile-bottom-nav-de-tailwind.md` — session log, real finish date.

## 8. Out of scope

- **`scripts/check-design-tokens.mjs`** — the gate must work as written. **Zero diff.**
- **`min-h-[calc(100vh-4rem)]`** and its marker on `layout.tsx:49`.
- **`HeaderView*` / `FooterView*`** (706/673 closed) · **`ListingCard*` / `MantineListingCardPattern*`** (Sprint 46).
- **`scripts/check-stories-rendered.mjs`** — D33. **Zero diff.**
- Adding `hideFromMd` to the Story (A6), or any restyle/token/spacing change (D28).
- The pre-existing `<div>`-in-`<p>` FiltersPanel hydration warning (677) — record, do not fix.

---

## 9. Current and required behavior

**Current:** `MobileBottomNavView` renders a Mantine `Box`/`UnstyledButton` skeleton whose entire visual chrome is
raw Tailwind — position, elevation, colour, the FAB's circle and press animation, and every label size. 4 of those
utilities are `design-tokens-allow`-marked. `layout.tsx:49` reserves `pb-14` of clearance for the bar with a
literal that is derived from, but not linked to, the bar's own `h-14`. The component renders on every route below
768px and holds 32 cells in the CI-blocking matrix.

**Required after:** all 11 sites are module-driven under `@layer utilities` with N1 token references; all 4 markers
still suppress their values with `0 stale-markers`; the clearance and the bar height derive from one declared
value; and all 32 comparator cells hold their baseline md5.

### Implementation sequence

- **I1 — Baseline before any edit.** `git status --porcelain`. Build Storybook, then capture from the built
  `Mantine/Primitives/MobileBottomNavView/Guest` and `/Authenticated` at 320/375/390/1024: computed styles for all
  11 sites, plus `transform`/`transition` on the FAB at rest **and** under `:active` (A3), plus the bar's measured
  height and `main`'s measured `padding-bottom` at 375 and 1024 (A2/R7). **Persist as files.**
- **I2 — Extract the compiled declarations.** From the rebuilt `storybook-static/assets/*.css`, read the actual
  compiled rules for every utility in §3.1 — especially `bg-primary/90`, `ring-primary/20`, `group-active:scale-95`
  (A3/A4). N1: keep token references. Persist the extraction as a file.
- **I3 — Write the module**, `@layer utilities`-wrapped (D34), and rewire the 11 sites.
- **I4 — The marker carry-across, two-armed (R3).** First write the moved declarations **without** markers, run
  `npm run check:design-tokens`, and **persist the failing transcript** — it names the exact rawValue for each
  (A1). Then add the 4 markers using those exact strings and re-run to `0 violations / 0 stale-markers`. **Both
  arms are the proof; a single green run is not.**
- **I5 — `layout.tsx:49` + the shared clearance value** (A5/R4). Re-measure bar height vs `main` padding at 375
  and 1024 and diff against I1 (R7).
- **I6 — The 32-cell comparator.** `npm run screenshots:assert -- --mantine-only`, then recompute the 32
  `mobilebottomnavview` md5s against `2026-08-05T17-47`. **Capture exit codes unpiped** (Task 710 R10). Then
  `npm run check:assertion-liveness` against the new manifest — expect `3 LIVE / 2 DEAD-KNOWN / 0 / 0`, exit 0.
- **I7 — Docs, session log, backlog** (R9/R10).
- **I8 — Counting gates last** (`check:file-integrity`, `check:mojibake`), after the log and backlog row exist, and
  write their real numbers into the log.

---

## 10. Implementation requirements

1. **`mobile-bottom-nav` is a contract** — it survives verbatim, like `container-wide`/`hero-search` (712/709).
2. **Reproduce compiled declarations, never approximations** (N1/A3/A4). Read them from the built CSS.
3. **The module is `@layer utilities`-wrapped** (D34). This is a migration, not a cascade-trap fix.
4. **A marker moves with its declaration, and its rawValue is measured, never guessed** (A1).
5. **The clearance value is declared once** (A5). Two literals is the defect, not the fix.
6. **Do not touch the Story's `hideFromMd` omission** (A6).
7. **Capture every transcript unpiped** — redirect, then append `$LASTEXITCODE` as its own statement (Task 710 R10).
8. **No task number** in any filename, class, custom property, or npm script (Task 701 F2).
9. **Run `check:file-integrity` and `check:mojibake` LAST** (N6 — a 6th recurrence is a P1).

---

## 11. Positive and negative flows

**Positive flow:** all 11 sites render from the module; computed styles at 320/375/390/1024 match I1 exactly,
including the FAB's `:active` transform; `check:design-tokens` reports 0/0/0; bar height equals `main` clearance
below 768px and clearance is 0 above; 32/32 md5s hold; `check:assertion-liveness` 3/2/0/0 exit 0; build exits 0.

| Branch | Applicable? | Owner / source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Marker rawValue differs in CSS from TSX | **Yes** | A1/R3 | I4's arm-1 failure names it; marker written from that string | AC3 |
| Marker orphaned (utility gone, marker left) | **Yes** | §3.3/R3 | `stale-marker` violation, gate fails — must not survive to arm 2 | AC3 |
| `group-active:scale-95` not reproducible as written | **Yes** | A3/R6 | reproduce via module `:active` descendant rule; measure transform at rest and active | AC6 |
| Alpha token approximated instead of reproduced | **Yes** | A4/R6 | compiled `color-mix`/alpha expression reproduced verbatim from built CSS | AC6 |
| Bar height and clearance drift apart | **Yes** | A5/R7 | single declared value consumed by both; measured equal below 768px | AC7 |
| Clearance not removed at ≥768px | **Yes** | §3.6/R7 | `main` padding-bottom is 0 at 1024, matching `hiddenFrom="md"` | AC7 |
| Story forced to change by R1 | **Yes** | A6/R8 | report it; never add `hideFromMd` | AC8 |
| A gate assertion dies from this change | **Yes** | I6 | `check:assertion-liveness` returns `DEAD-NEW`, exit 1 → stop and report | AC5 |
| Locale expansion | **Yes** | cl. 7/R13 | 4 locales × the 5 `nav`/`common` keys still resolve; covered by the 32 cells (4 locales) | AC13 |
| Small viewport / responsive | **Yes** | the 32 cells include 320/375/390 | covered by the comparator | AC5 |
| Touch-target regression <640px | **Yes** | cl. 11 | nav items keep their current hit area; measured in I1/I5 | AC7 |
| RLS / authorization | **No** | presentational shell; `isAuthenticated` only picks a link target, no data access | N/A | — |
| Duplicate action / partial failure | **No** | static markup; `onRequireAuth` is unchanged pass-through | N/A | — |

---

## 12. Acceptance criteria

- **AC1 [R1]** Given `MobileBottomNavView.tsx`, when read, then no Tailwind utility class remains on any of the 11
  sites and `mobile-bottom-nav` is still present. Quote before/after for all 11.
- **AC2 [R2]** Given `MobileBottomNavView.module.css`, when read, then it is wrapped in `@layer utilities` and every
  declaration cites a token reference, with the source utility named in a comment. Quote it in full.
- **AC3 [R3]** Given I4 arm 1 (declarations, no markers), then `check:design-tokens` **fails**, and the transcript
  names the exact rawValue for each of the 4. Given arm 2 (markers added with those strings), then it reports
  **0 violations / 0 stale-markers / 0 missing-reason**. **Persist both transcripts with exit codes inside them.**
- **AC4 [R4]** Given `layout.tsx:49`, when read, then `pb-14`/`md:pb-0` are gone, `min-h-[calc(100vh-4rem)]` and its
  marker are byte-identical, and no `56px`/`3.5rem` literal is duplicated across the two files. Quote the diff.
- **AC5 [R5]** Given `npm run screenshots:assert -- --mantine-only` and a recompute of the 32 md5s against
  `2026-08-05T17-47`, then 32/32 match, or every mismatch is listed with story ID, locale, viewport and measured
  cause. Persist the transcript, exit code unpiped and inside the file.
- **AC6 [R6]** Given the I1 and post-edit computed captures, then `transform` and `transition` on the FAB at rest
  **and** under `:active`, and the resolved colour of `bg-primary/90` and `ring-primary/20`, are identical
  before/after at all 4 widths. Show both captures.
- **AC7 [R7]** Given runtime measurement at 375 and 1024, then bar height equals `main`'s `padding-bottom` at 375,
  and `padding-bottom` is `0px` at 1024. State all four numbers.
- **AC8 [R8]** Given the story file, when read, then it still renders the real component and still omits
  `hideFromMd`. If it changed at all, quote the diff and justify it.
- **AC9 [R9]** Given `docs/backlog.md`, when read, then the marker count reads **4**, not 3, and 713's state is
  recorded.
- **AC10 [R10]** Given the new `docs/storybook-governance.md` section, when read, then it documents the marker
  carry-across pattern — the stale-marker trap, the measure-the-rawValue rule, and the two-armed proof — as reusable
  guidance.
- **AC11 [R11]** Given `git diff` on `check-design-tokens.mjs`, `HeaderView*`, `FooterView*`, `ListingCard*`,
  `MantineListingCardPattern*`, `check-stories-rendered.mjs`, then all are **empty**. Verify by hash.
- **AC12 [R12]** Given the final state, when `npm run build` runs, then it exits **0**, transcript at a stated path
  with the exit code inside it.
- **AC13 [R13]** Given the diff and the 32 cells (4 locales), then no string was added or changed and all
  `nav`/`common` labels still render in `sq`/`en`/`uk`/`it`.
- **AC14 [R14]** Given `check:file-integrity` and `check:mojibake` run **after** the session log and backlog row
  exist, then both pass and their actual numbers appear in the session log under a heading that exists.

---

## 13. QA profile and verification plan

**Profile: `Q3` Visual/Responsive.** `docs/qa-profiles.md` routes visual/layout change to Q3; this is a
mechanism-only change to a story-rendered, CI-blocking surface across 4 locales × 4 viewports, on a component that
renders on every route. **Q4 is not selected** — no `docs/critical-flow-registry.md` row covers the bottom nav, and
no auth/RLS/data-loss path is touched (`isAuthenticated` only selects a link target). **Escalate to Q4 and say so**
if I1 shows the bar's current geometry already disagrees with `layout.tsx`'s clearance, since that would make this
a correction with unknown blast radius rather than a mechanism swap.

| # | Command / step | Expected |
|---:|---|---|
| 1 | `git status --porcelain` (I1) | empty, or a completed dirty-worktree manifest |
| 2 | I1 computed-style + geometry captures, pre-edit | persisted under `.screenshots/task713-evidence/` |
| 3 | I2 compiled-CSS extraction | persisted as a file; token references identified |
| 4 | Module + 11 rewires (I3) | `@layer utilities`, N1-compliant |
| 5 | **I4 arm 1** — no markers | `check:design-tokens` **FAILS**, rawValues named, transcript persisted |
| 6 | **I4 arm 2** — markers added | `0 violations / 0 stale-markers / 0 missing-reason`, exit 0 |
| 7 | `layout.tsx:49` + shared value (I5) | `pb-14`/`md:pb-0` gone; `min-h-…` untouched |
| 8 | Re-measure bar height vs `main` padding at 375/1024 | equal at 375; `0px` at 1024 |
| 9 | Post-edit computed capture, diffed vs I1 | identical at all 4 widths, incl. `:active` transform |
| 10 | `npm run screenshots:assert -- --mantine-only` (I6) | exit 0, manifest written |
| 11 | 32-cell md5 recompute vs `2026-08-05T17-47` | 32/32, or every diff enumerated |
| 12 | `npm run check:assertion-liveness` | `3 LIVE / 2 DEAD-KNOWN / 0 / 0`, **exit 0** |
| 13 | `npm run check:stories` | unchanged pass |
| 14 | `npx tsc --noEmit` | 0 errors |
| 15 | **`npm run build`** | **exit 0 — hard gate**, transcript persisted with the exit code inside it |
| 16 | `check:file-integrity` · `check:mojibake` — **last** | pass; numbers written into the session log |

A failed or unrun step 15 permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`. `tsc=0` is not a substitute.

Evidence persists under `.screenshots/task713-evidence/` (local-only per **D6**), referenced by path from the
session log. **Name every artifact.** **Do not modify, overwrite or delete `.screenshots/rendered-assert/2026-08-05T17-47/`**
— it is 712's evidence and this task's baseline.

---

## 14. Completion report contract

Write `docs/sessions/2026-08-0X-task713-mobile-bottom-nav-de-tailwind.md` containing:

1. **Files changed** — table matching the real `git diff --stat`, reconciled against your pre-write snapshot.
2. **Requirement IDs completed** — R1–R14, each with its AC verdict.
3. **All 11 sites, before and after**, and the module quoted in full.
4. **The marker carry-across, both arms** — the failing transcript with the exact rawValues it named, and the
   passing one. State the 4 final marker strings.
5. **The A1/A2/A3/A4/A5 answers** — the measured rawValues, the measured `--spacing`-derived bar height, the
   `:active` transform capture, the compiled alpha expressions, and where the clearance value now lives.
6. **The R7 coupling numbers** — bar height and `main` padding at 375 and 1024.
7. **The 32-cell md5 result** — 32/32, or every mismatch with story ID, locale, viewport and cause.
8. **Commands run and actual results** — real exit codes and numbers, including the step-15 build transcript.
9. **Evidence locations** — every artifact, named.
10. **A real counting-gates section** with the actual numbers.
11. **Standing findings not acted on** — 691/702 (Sprint 46), 711 (needs Sprint 52), 677.
12. **Assumptions, deviations, limitations, unresolved issues.**
13. Concise current state appended to `docs/backlog.md` — **state only**, plus the R9 count correction. The file is
    at **99** lines against a ~80 target and Opus owes it a consolidation; **do not add net lines**, and flag a
    `BACKLOG LIMIT BREACH` if you cannot hold it.

**Status must be `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`.** Never
self-approve, never produce a `Decision`/`Confidence`/`Blocking findings` section, and never run, emit, suggest, or
delegate any mutating git command, including any form of `git push`.

---

## 15. Task quality gate

| Check | Status |
|---|---|
| A fresh Sonnet session can execute this with no hidden chat context | ✅ all 11 sites tabulated with line numbers and exact utility strings; every file, story ID, cell count, viewport, locale, gate line number and command named |
| Every primary requirement has a binary AC and a verification method | ✅ R1–R14 → AC1–AC14 → §13 steps 1–16 |
| Scope protects existing behavior and names what must not change | ✅ §8 plus hash-verified zero-diff AC11 on six paths, the `min-h-[calc(…)]` carve-out, and §5.2's four rejected alternatives |
| No uninspected claim | ✅ all 11 sites, the story file, `MobileBottomNav.tsx:21-27`, `layout.tsx:49`, `check-design-tokens.mjs:195-250/380-400`, `theme.ts:160-170`, both precedent modules and `HeroSearchView.module.css` read; the 32 cells / 2 story IDs / 4 locales / 4 viewports enumerated from the real manifest; the 4-vs-3 marker discrepancy counted; "no `.module.css` carries a marker" verified by `grep -rln` — all 2026-08-05 |
| The gate proves the changed behavior, not merely procedure | ✅ R3/AC3 is a genuine **two-armed planted proof** — arm 1 must FAIL and name the rawValue before arm 2 is trusted; the 32-cell comparator is D32-discharged by 709's real failure |
| The task's riskiest unknown is a measurement, not an assumption | ✅ A1 forbids guessing the CSS rawValue and routes it through arm 1's failure output; A2 refuses to inherit `--spacing` from 712 without re-measuring |
| Both arms of each risky decision are covered | ✅ §11 gives marker-matches vs marker-differs, coupling-holds vs coupling-drifts, story-unchanged vs story-forced |
| Canonical Story boundary inspected before publication (cl. 16c) | ✅ story opened and read; it renders the real component with **no** stand-in defect, and its one deliberate divergence (`hideFromMd`) is documented at both ends and protected by A6/R8 |
| Canonical-source search performed before proposing a mechanism | ✅ both layout precedent modules opened (0 markers each — precedent runs out), `HeroSearchView.module.css` opened for D34/N1, and the marker parser read in source before asserting CSS markers are viable |
| Critical flow named or excluded from evidence | ✅ §13 argues Q3 explicitly, names the Q4 escalation trigger, and covers cl. 11 touch targets in §11 |
| Owner exceptions have traceable authorization | ✅ D6 for the evidence dir; D28/D32/D34/N1 cited with sources; the 4 existing markers are pre-existing owner-accepted suppressions carried across, not new ones |
| Exactly one active executable route | ✅ §5.1 fixes naming, §5.2 closes four alternatives, A5 fixes the single-source-of-truth requirement with a stated fallback-and-report path |
| Every checkpoint names producer, output, comparator, failure behavior | ✅ §13 + I1's persisted pre-edit baseline + I4's mandatory failing arm + I6's `DEAD-NEW` stop + A1/A2's measure-don't-guess conditions |
| Zero/empty input covered | ✅ the guest branch (`isAuthenticated: false`) is a distinct story export and 16 of the 32 cells; both branches are in the comparator |
| Worktree state established with a pre-write snapshot | ✅ §3.8 requires the executor's own snapshot and the dirty-worktree manifest if non-empty |
| Prior-review corrections folded in | ✅ Task 712 **F1** (cite `theme.ts:166`, not a sample, for breakpoint equivalence — §3.6), **F2** (record measured counts, never "unmeasured" — §3.2 corrects 3→4), **F3** (state what the rendered proof does *not* cover — `layout.tsx` has no Story, so R7 is a runtime measurement instead), **NOTE-1** (persist per-cell comparator detail — §14.7), Task 710 **R10** (unpiped capture), **701 F2** (no task numbers), **707 N6** (§10.9) |
| Sprint assigned before creation | ✅ Sprint 50, opened with its own plan file before this kickoff was written |

**Remaining ambiguous or conflicting requirements: none.**
**Owner decisions still needed: none for this task.** Sprint 50 §9 records that **711 needs Sprint 52**.
