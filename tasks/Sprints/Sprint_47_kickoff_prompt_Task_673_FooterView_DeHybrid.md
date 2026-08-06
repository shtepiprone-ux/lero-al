# Task 673 — De-hybrid `FooterView`: Mantine primitives + a colocated CSS module, at zero rendered delta

**Sprint:** 47 (`tasks/Sprints/Sprint_47_Layout_Shell_DeHybrid.md`). **Epic:** MM Phase-2.

---

## 1. Mode and task type

- **Mode:** implementation (Sonnet executor, via `.claude/skills/execute-task/SKILL.md`).
- **Primary task type:** UI migration — **legacy-utility removal on an already-Mantine surface**
  (`docs/rule-index.md` → "UI / Layout / Component" → **Current Mantine path**).
- **Secondary types:** Storybook / visual proof (the surface is manifest-enrolled at
  `scripts/mantine-migration-scope.json:7`).
- **Origin:** the homepage-tree audit of 2026-07-29 and the 2026-07-26 orchestrator audit that retracted the
  "Homepage is 100% Mantine" claim (`docs/sessions/2026-07-21-task653-favoritebutton-mantine-migration.md:60-68`).
  That audit named `HeaderView` and `FooterView` as the two remaining **Mantine/Tailwind hybrids** on the tree.
  Owner selected 673 as the next Homepage kickoff on 2026-08-01; **D29** split it footer-first.

> **Read this first.** This task must produce **zero rendered change**. It is a mechanism swap, not a redesign
> (**D28**). Every replaced utility must reproduce its own compiled CSS output, proven by `getComputedStyle`
> equality **and** by PNG-md5 identity on every enrolled cell. If you cannot reproduce a value exactly, **stop and
> report** — do not approximate it and do not "improve" it.

---

## 2. Objective

1. Remove every raw Tailwind utility class from `src/components/layout/FooterView.tsx` — **16** `className=` sites —
   replacing them with Mantine style props where a prop exists and a **new colocated
   `FooterView.module.css`** where one does not (**D28**, the Task 688 D16 pattern).
2. Convert the **8 raw HTML elements** that carry those utilities (`<p>`×4, `<span>`×3, `<a>`×1) to Mantine
   primitives with `unstyled`, so the file stops being a hybrid at the *element* level as well as the *class* level.
3. Preserve the rendered output **byte-for-byte**: every enrolled cell of `Mantine/Primitives/FooterView/Default`
   keeps its current PNG md5 and its current verdict.
4. Establish the layout-shell module pattern that Task **706** (`HeaderView`) inherits.

**Non-goals stated as objectives so they are not silently attempted:** this task changes no visual value, no token,
no spacing, no typography, and **does not** alter `check:design-tokens` — `FooterView` contributes **0** of the live
28 violations (verified 2026-08-01, §3.4).

---

## 3. Verified context

Every fact below was read or executed in the worktree on branch `task/q0-ci-rendered-locale-split` on **2026-08-01**.
Nothing is inferred from a filename, a prior report, or a semantic-search hit.

### 3.1 Owner decisions

| ID | Ruling | Scope |
|---|---|---|
| **D28** (2026-08-01) | **Mechanism-only, zero visual delta.** Keep `unstyled` where present, add it where a raw element becomes a Mantine primitive. Utilities → Mantine style props where a prop exists, colocated `.module.css` otherwise. No restyle, no token change. | Binds 673 and 706 |
| **D29** (2026-08-01) | **Split, footer first.** 673 = `FooterView`; `HeaderView` becomes Task 706. | Binds 673 and 706 |
| **D16** (Task 688, 2026-07-29) | "Mantine style props where a prop exists; a colocated `.module.css` for everything a prop cannot express (gradients, `:hover`, …)." | The mechanism D28 points at |
| **D6** (Task 684, standing) | `.screenshots/` evidence is **local-only** per `.gitignore:55`. Reference by path; it will not appear in `git status`. | Evidence handling |
| **D26** (`docs/storybook-governance.md` §14.11) | The rendered-matrix comparator and its sub-perceptual tolerance. **Do not invent a per-task pixel tolerance.** | AC4 comparator |

D28 is the **first written form** of the ruling `docs/backlog.md:52` had only summarised as "mechanism-only (owner
2026-07-29, as in 672)". Task 672's D1 is the precedent it points at: *"Mechanism-only, zero visual change… does
**not** authorize any TailAdmin restyle, token change, or spacing/typography edit"*
(`tasks/kickoff_prompt_Task_672_MobileBottomNav_Mantine_Migration.md:45,:50-51`).

### 3.2 The file as it stands — read at source

`src/components/layout/FooterView.tsx`, **128 lines**. It is a **server component** (no `'use client'`), rendered by
the async `Footer` container (`src/components/layout/Footer.tsx:59-73`), fully prop-driven and **hook-free** — no
`useTranslations`, no data access. That is why its story can pass plain props with no module alias.

**All 16 `className=` sites** (`grep -c 'className=' → 16`; a plain `grep -c 'className'` returns 17 because
`:46` is a doc comment — do not use the larger number):

| # | Line | Element | Current value | Disposition |
|---:|---:|---|---|---|
| 1 | `:21` | `<Link>` (`FooterLink_`) | `text-sm text-muted-foreground hover:text-foreground transition-colors w-fit` | → `Anchor unstyled component={Link}` + module |
| 2 | `:63` | `<Box component="footer">` | `site-footer border-t bg-surface-2 pb-14 md:pb-0` | **`site-footer` preserved verbatim**; rest → props/module |
| 3 | `:64` | `<Box>` | `container-wide py-12` | **`container-wide` preserved verbatim**; `py-12` → `py` prop |
| 4 | `:65` | `<Box>` | `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10` | → Mantine `SimpleGrid` **or** module grid (§5.3) |
| 5 | `:69` | `<Link>` | `font-bold text-xl w-fit` | → `Anchor unstyled component={Link}` + props/module |
| 6 | `:70` | `<span>` | `text-primary` | → `Text unstyled component="span"` + module |
| 7 | `:71` | `<span>` | `text-foreground` | → `Text unstyled component="span"` + module |
| 8 | `:73` | `<p>` | `text-sm text-muted-foreground leading-relaxed max-w-55` | → `Text unstyled component="p"` + module |
| 9 | `:78` | `<p>` | `text-xs font-semibold uppercase tracking-widest text-muted-foreground` | → `Text unstyled component="p"` + module (shared class with #11) |
| 10 | `:81` | `<Box component="nav">` | `flex flex-col gap-2.5` | → `Stack` props **or** module (shared with #12) |
| 11 | `:90` | `<p>` | *(identical to #9)* | same shared class |
| 12 | `:93` | `<Box component="nav">` | *(identical to #10)* | same shared class |
| 13 | `:107` | `<Flex>` | `mt-12 border-t pt-6` | → `mt`/`pt` props + module border |
| 14 | `:109` | `<p>` | `text-xs text-muted-foreground` | → `Text unstyled component="p"` + module |
| 15 | `:111` | `<span>` | `text-xs text-muted-foreground hidden sm:block` | → `Text unstyled component="span"` + `visibleFrom="sm"` (§5.4) |
| 16 | `:118` | `<a>` | `text-xs text-muted-foreground hover:text-foreground transition-colors` | → `Anchor unstyled` (external, keeps `target`/`rel`) + module |

**Two classes are NOT Tailwind utilities and must survive verbatim:**

- `site-footer` (`:63`) — the DOM marker.
- `container-wide` (`:64`) — a project-canonical global class declared at `src/app/globals.css:634-644`
  (`max-width:88rem`, auto margins, and a 3-step responsive padding ramp at 640/1024/1536px). It is **not**
  reproducible as a Mantine prop and must not be inlined.

### 3.3 `.site-footer` has zero consumers — census, not assumption

`grep -rn "site-footer" src scripts docs .storybook` returns **exactly one line**: its own declaration at
`FooterView.tsx:63`. No gate, no probe, no test, no provider reads it.

This is the opposite of `.site-header`, which has **three** live consumers and is why Task 706 is the harder half.

**Disposition: PRESERVE `site-footer` verbatim anyway.** Removing it is out of scope (agent-contract cl. 9 would
make the deletion audit part of this task, and D28 authorizes no cleanup). Record the zero-consumer census in the
session log as a finding for a future decision; do not act on it here.

### 3.4 Gate exposure — measured, not assumed

| Gate / registry | `FooterView` exposure | Evidence |
|---|---|---|
| `docs/critical-flow-registry.md` | **None.** `grep -i footer` returns 2 lines (`:50`, `:57`), both about Mantine **Drawer** footer slots and listing-**card** footer rows. No site-footer row exists. | read 2026-08-01 |
| `check:design-tokens` | **0 violations.** Live `--strict` run totals **28**; the per-file breakdown attributes **5** to `HeaderView.tsx` (`:110` ×3, `:128` ×2, all `min-[390px]`) and **0** to `FooterView.tsx`. | live run 2026-08-01 |
| `check:header-id-parity` / `test:header-hydration-id-parity` | **Not applicable** — both target `.site-header`. | `check-header-id-parity.mjs:147` |
| `check:locale-leak` | Only mentions `HeaderView` (`:187`, a fixture-name comment). | read 2026-08-01 |
| `scripts/mantine-migration-scope.json` | **Enrolled** at `:7`. Membership must not change. | read 2026-08-01 |

**The `check:design-tokens` total must still read 28 after this task.** A change in either direction is a defect —
28 → 27 would mean a value was silently removed, 28 → 29 that a raw value was introduced.

### 3.5 Story and rendered-proof path

`src/stories/mantine/primitives/FooterView.stories.tsx` — title `Mantine/Primitives/FooterView`, a **single**
`Default` story, `layout:'fullscreen'`, `skipCanvas:true`. It imports the **real production component** and feeds it
plain literal props plus `storyT(locale, 'nav.*')`. No mock, no alias, no Supabase.

The title prefix `Mantine/Primitives/` is what enrols it in the `--mantine-only` standing gate
(`scripts/lib/mantine-story-scope.mjs`).

**Enrolled viewports = the default `MANTINE_VIEWPORTS` set only** — `320 / 375 / 390 / 1024`
(`scripts/check-stories-rendered.mjs:392`). `FooterView` has **no** entry in `MANTINE_STORY_EXTRA_VIEWPORTS`
(that map holds `HeroSearch`, `ListingDetailPattern`, and the Task 669 homepage-band entry). With 4 locales that is
**16 cells**.

**Why 4 widths is sufficient here, and how to prove it stays sufficient.** `FooterView` uses exactly two
breakpoints today: `sm` (640px) at `:65` `sm:grid-cols-2`, `:103` `direction={{base:'column',sm:'row'}}` and `:111`
`hidden sm:block`; and `md` (768px) at `:63` `md:pb-0` and `:65` `md:grid-cols-3`. The enrolled set straddles both
(390 < 640 < 1024 and 390 < 768 < 1024), and nothing in the file changes above 768. **AC7 makes this an assertion
rather than an assumption:** the new module must introduce no `@media` rule with a breakpoint above 1024px. If you
find you need one, the enrolled viewport set is wrong and you must stop and report — do not add the width yourself.

### 3.6 Token provenance for the values in play

Every colour utility in the file resolves through `src/app/globals.css`:

| Utility | Variable | Declared |
|---|---|---|
| `text-foreground` | `--foreground` → `--neutral-900` | `:368` |
| `text-muted-foreground` | `--muted-foreground` → `--neutral-500` | `:376` |
| `text-primary` | `--primary` → `--brand-700` | `:379` |
| `border-t` | `--border` → `--neutral-200` | `:396` |
| `bg-surface-2` | `--color-surface-2` → `--surface-2` → `--neutral-50` | `:94`, `:418` |

The module must consume these **variables**, never their hex values (D27's "token not hex" discipline).
`max-w-55` (`:73`) and `pb-14` (`:63`) are Tailwind spacing-scale multiples — **measure them, do not compute them**
(§9, I2).

### 3.7 Reference implementation to copy

`src/modules/locations/components/PopularLocationsView.module.css` (Task 688) is the convention:
a header comment stating what was reproduced and how it was verified, `:hover`/`:focus-visible` in the module and
**never** as an inline `style` (an inline `style` attribute unconditionally beats an external stylesheet rule for
the same property and permanently blocks the module's own `:hover` — proven by `FavoriteButton.tsx`, Task 653).

Both `:21` and `:118` carry `hover:text-foreground transition-colors`. Both therefore **must** land in the module.

### 3.8 Worktree state at design time — dirty, snapshot taken

`git status --short` on 2026-08-01, **before** any write in this session:

```
 M .claude/skills/create-task/SKILL.md
 M CLAUDE.md
 M docs/ai-behavior.md
 M docs/backlog-archive.md
 M docs/backlog.md
?? docs/sessions/2026-08-01-backlog-consolidation-and-sprint-restoration.md
?? tasks/Sprints/Sprint_45_Unsprinted_Period_621_to_705.md
?? tasks/Sprints/Sprint_46_ListingCard_DeTailwind_And_Overlay_Exit.md
```

All eight paths belong to the 2026-08-01 backlog-consolidation session and are **unrelated to this task**.
`docs/backlog.md` was already modified before this task design added its own edit — when you reconcile your diff, do
**not** attribute the whole of that file's change to 673. Use this snapshot as the comparator.

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | D28, §3.2 | `FooterView.tsx` contains **zero** Tailwind utility classes. Every surviving `className=` is either `styles.*`, or the verbatim string `site-footer` / `container-wide`. | P0 | AC1 |Confirmed|
| R2 | D28 obj. 2 | The 8 raw HTML elements at `:70,:71,:73,:78,:90,:109,:111,:118` are Mantine primitives carrying `unstyled`; each renders the **same tag name** as before. | P0 | AC2 |Confirmed|
| R3 | D28, §3.7 | A new `src/components/layout/FooterView.module.css` exists, consumes `globals.css` variables (never hex), and holds both `:hover` rules. | P0 | AC3 |Confirmed|
| R4 | D26, §3.5 | All **16** enrolled cells keep their pre-task PNG md5 **and** verdict. | P0 | AC4 |Confirmed|
| R5 | §3.2 | `site-footer` and `container-wide` survive byte-identically. | P0 | AC5 |Confirmed|
| R6 | §3.4 | `check:design-tokens` still totals **28**, with `FooterView.tsx` still contributing 0. | P1 | AC6 |Confirmed|
| R7 | §3.5 | The module introduces no `@media` breakpoint above 1024px. | P1 | AC7 |Confirmed|
| R8 | agent-contract cl. 9 | `npm run build` exits 0. | P0 | AC8 |Confirmed|
| R9 | §9 I4 | The comparator is shown to be capable of failing (two-armed plant + pre-plant census). | P0 | AC9 |Confirmed|
| R10 | agent-contract cl. 14 | Touched files stay UTF-8 without BOM, no mojibake. | P2 | AC10 |Confirmed|

---

## 5. Assumptions and open questions

### 5.1 Stated assumptions

- **A1.** Mantine `Text`/`Anchor` accept `unstyled` and a `component` override. Evidenced by `HeaderView.tsx:112-114`
  (`<Anchor unstyled component={Link}>`, `<Text unstyled component="span">`) already shipping in production.
- **A2.** `@mantine/core`'s CSS is **unlayered**, so its own classes beat any Tailwind `@layer utilities` class
  regardless of source order — which is exactly why `unstyled` is load-bearing here, not decorative
  (`HeaderView.tsx:101-109`, Task 629). The same reasoning applies to every primitive you introduce.

### 5.2 `SimpleGrid` vs a module grid — decide by measurement, then record

Site #4 (`:65`) is `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10`. Mantine's `SimpleGrid` expresses this as
`cols={{base:1,sm:2,md:3}} spacing={40}` — but Mantine's own breakpoint values must be confirmed to match Tailwind's
640/768 **for this theme** before you rely on it. Measure first (§9, I2). If they match, use `SimpleGrid`; if they
do not, use the module. **Record which and why** — this is a documented in-task choice, not an open question.

### 5.3 Nothing is left ambiguous for the executor

There is no unresolved owner decision in this task. D28 and D29 close the only two that existed.

---

## 6. Pre-read rule bundle

Read exactly these. Do not read all docs.

**Always required:** `docs/agent-contract.md` · `docs/rule-index.md` · `docs/qa-profiles.md` · `docs/backlog.md` ·
`docs/critical-flow-registry.md` (scan only — §3.4 already establishes there is no applicable row).

**Current Mantine path:** `docs/mantine-responsive-design-system.md` · `docs/tailadmin-style-reference.md` ·
`docs/component-rules.md` · `docs/ui-rules.md` (routing/legacy-boundary notes only) · `docs/qa-rules.md`.

**Because the surface is story-enrolled:** `docs/storybook-governance.md` **§14.11 (D26)** and §14.9.17
(per-story viewport mechanism).

**Task-specific sources:** this file · `tasks/Sprints/Sprint_47_Layout_Shell_DeHybrid.md` ·
`tasks/kickoff_prompt_Task_688_PopularLocationsView_DeTailwind_CssModule.md` (the pattern being inherited) ·
`src/modules/locations/components/PopularLocationsView.module.css` (the reference output).

---

## 7. Scope

- `src/components/layout/FooterView.tsx` — all 16 `className=` sites, all 8 raw HTML elements.
- `src/components/layout/FooterView.module.css` — **new**.
- Nothing else.

---

## 8. Out of scope

- `src/components/layout/HeaderView.tsx` — that is Task **706** (D29). Do not touch it, even to "keep them consistent".
- `src/components/layout/Footer.tsx` — the container's data logic, fallbacks and prop wiring are unchanged.
- `src/stories/mantine/primitives/FooterView.stories.tsx` — the story already renders the real component with plain
  props. **Change it only if a prop signature changes, which it must not.** A story edit in your diff is a signal
  that scope leaked.
- Removing `site-footer` (§3.3) · any TailAdmin restyle, token, spacing or typography change (D28) ·
  `scripts/mantine-migration-scope.json` membership · the enrolled viewport set (§3.5) · `globals.css`.

---

## 9. Current and required behavior

**Current:** `FooterView` is a Mantine/Tailwind **hybrid** — Mantine `Box`/`Stack`/`Group`/`Flex` supply layout
mechanism while 16 verbatim Tailwind utility chains supply 100% of the visual styling, and 8 raw HTML elements
(`<p>`, `<span>`, `<a>`) sit inside that Mantine tree carrying utilities of their own.

**Required after:** identical rendered output at every enrolled cell; zero Tailwind utilities; the 8 raw elements
are Mantine primitives with `unstyled`; all visual values live in `FooterView.module.css` (consuming `globals.css`
variables) or in Mantine style props; `site-footer` and `container-wide` unchanged.

### Implementation sequence

- **I1 — Baseline first, before any edit.** Capture the current `--mantine-only` rendered run for
  `Mantine/Primitives/FooterView/Default` (16 cells) and persist the PNG md5 list. Record `check:design-tokens`
  (expect 28) and `git status --porcelain` (expect §3.8). **A baseline captured after an edit is not a baseline.**
- **I2 — Measure, do not compute.** With the story rendered, take a live `getComputedStyle` capture of all 16 sites'
  elements. This is the source of truth for every value you write into the module — including `max-w-55`, `pb-14`,
  `gap-2.5`, `tracking-widest`, `leading-relaxed`, and both `transition-colors` triples. Persist the capture.
- **I3 — Migrate**, site by site in the §3.2 table order. Share one class between #9/#11 and one between #10/#12.
- **I4 — Prove the comparator can fail (two-armed plant).** See AC9.
- **I5 — Re-run** the full evidence set and diff against I1.

---

## 10. Implementation requirements

1. **`unstyled` is mandatory on every Mantine primitive that replaces a raw element or carries reproduced styling.**
   Per A2, omitting it lets Mantine's unlayered CSS win and silently changes the render.
2. **Tag names must not drift.** `Text` defaults to `<p>`; `Anchor` to `<a>`. Where the current element is a
   `<span>`, pass `component="span"` explicitly. AC2 checks the rendered tag, not the JSX.
3. **`:hover` and `transition` belong in the module** (§3.7) — never an inline `style`.
4. **Consume variables, not hex** (§3.6).
5. **`FooterLink_`'s external-link branch** (`:22`, `target="_blank" rel="noopener noreferrer"`) and the social
   `<a>`'s equivalent (`:116-117`) must survive the conversion to `Anchor`. Losing `rel="noopener noreferrer"` is a
   security regression, not a styling detail.
6. **`aria-label={navTitle}` / `aria-label={infoTitle}`** on the two `<Box component="nav">` elements (`:81`, `:93`)
   must survive. Both `<nav>` landmarks stay `<nav>`.
7. **Do not change the prop interface.** `FooterViewProps` (`:29-41`) is consumed by `Footer.tsx` and the story.
8. Preserve the `resolveHref`/`isExternal` helpers and the component's server-component nature — do not add
   `'use client'`.

---

## 11. Positive and negative flows

**Positive flow:** the `/[locale]` page renders `Footer` → `FooterView` with DB-backed or fallback links; brand,
tagline, two nav columns, and the bottom bar with copyright and social links render exactly as before at all four
locales and all four enrolled widths.

| Branch | Applicable? | Owner / source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Empty `navLinks`/`infoLinks`/`socialLinks` | **Yes** | `Footer.tsx:41-57` falls back to hardcoded lists when the DB returns none; `.map()` over `[]` renders an empty `<nav>` | Column heading still renders; no crash, no orphan divider | Story fixture variant run locally at 320 + 1024; not a new persisted story (§8) |
| External vs internal link | **Yes** | `isExternal` (`:12-14`), `resolveHref` (`:6-10`) | External keeps `target="_blank" rel="noopener noreferrer"`; internal gets the locale prefix | AC2 DOM witness (requirement 10.5) |
| Long localized strings (`uk`, `sq`) | **Yes** | `max-w-55` on the tagline is the file's only width clamp | Tagline wraps identically to baseline | AC4 — `uk@320` is a mandatory cell |
| RTL | **No** | No RTL locale ships (`sq`/`en`/`uk`/`it`) | N/A | — |
| Authorization / RLS | **No** | Presentational, prop-driven, no data access (§3.2) | N/A | — |
| Hydration mismatch | **No** | Server component, no `'use client'`, no `useId` consumer. The registry's hydration row targets `Header.tsx`, not the footer (§3.4) | N/A | — |
| Concurrent writer / offline | **No** | No writes, no network | N/A | — |

---

## 12. Acceptance criteria

- **AC1 [R1]** Given the migrated `FooterView.tsx`, when `grep -n 'className=' src/components/layout/FooterView.tsx`
  runs, then **every** returned line's value is a `styles.*` reference, `cn(styles.*)`, or one of the two verbatim
  strings `site-footer` / `container-wide` — and **no** line contains a Tailwind utility.
- **AC2 [R2]** Given the rendered story DOM, when the 8 previously-raw elements are located, then each is a Mantine
  primitive with `unstyled`, its **tag name is unchanged** (`p`/`span`/`a`), the two `<nav>` landmarks keep their
  `aria-label`, and every external link still carries `target="_blank"` **and** `rel="noopener noreferrer"`.
- **AC3 [R3]** Given `src/components/layout/FooterView.module.css`, when it is read, then it exists, contains both
  `:hover` rules from sites #1 and #16, references only `var(--*)` for colour, contains **zero** hex literals, and
  carries a header comment naming what it reproduces and the I2 capture that verified it.
- **AC4 [R4]** Given the post-change `--mantine-only` run, when its 16 `FooterView/Default` cells are compared
  against the I1 baseline under the `docs/storybook-governance.md` §14.11 (D26) comparator, then **PNG md5 and
  verdict are identical for all 16**. A changed cell is reported as a finding with per-cell attribution — it is not
  absorbed into a tolerance, and D26's sub-perceptual path applies only if all four of its conjunctive conditions
  hold.
- **AC5 [R5]** Given the rendered DOM, when the `<footer>` and its first child `<div>` are inspected, then their
  class lists still contain `site-footer` and `container-wide` respectively, byte-identical.
- **AC6 [R6]** Given `npm run check:design-tokens`, when it runs, then the total is **28** — unchanged — and the
  per-file breakdown lists **no** entry for `FooterView.tsx`.
- **AC7 [R7]** Given `FooterView.module.css`, when its `@media` rules are listed, then none uses a `min-width`
  above `1024px`.
- **AC8 [R8]** Given the final state, when `npm run build` runs, then it exits **0**, and the actual transcript is
  recorded.
- **AC9 [R9]** Given the migrated component, when the **two-armed plant** below runs, then the comparator flips as
  specified in both arms.
  - *Pre-plant census (mandatory first):* prove that **nothing else** declares `max-width` on the tagline `<p>` —
    no surviving Tailwind utility, no Mantine `unstyled` leak, no inline `style`. Quote the evidence. Without this,
    a lifeline can mask the plant and the arms prove nothing (the M4 failure mode, `docs/backlog.md` standing note).
  - *Arm A (must FAIL):* change the tagline's reproduced `max-width` in the module to a different value. Re-run the
    16 cells. **At least one cell's md5 must change** and the `getComputedStyle` equality must break. If nothing
    changes, the comparator is blind and the task is `BLOCKED` — not `IMPLEMENTED`.
  - *Arm B (must PASS):* revert the plant exactly. Re-run. All 16 cells identical to the I1 baseline again.
- **AC10 [R10]** Given the two touched files, when `npm run check:file-integrity` and `npm run check:mojibake` run,
  then both pass and the files are UTF-8 without BOM.

---

## 13. QA profile and verification plan

**Profile: `Q3` Full Visual Matrix.** `docs/qa-profiles.md` lists *"navigation/header/footer"* explicitly under Q3,
and this is a migrated Mantine surface with a standing rendered gate.

**Not `Q4`:** Q4 requires a `docs/critical-flow-registry.md` entry, and §3.4 establishes by direct read that no
site-footer row exists. The registry's header-hydration row targets `Header.tsx` and belongs to Task 706.

**Proof path — the enrolled matrix is 16 cells** (4 widths × 4 locales, §3.5), not the canonical 14-width sweep.
`docs/qa-profiles.md` requires reading the tier's widths out of the manifest **for this specific story** rather than
inferring them from the run's union; §3.5 does that and AC7 keeps the reasoning honest.

| # | Command / step | Expected |
|---:|---|---|
| 1 | Rendered `--mantine-only` baseline for `FooterView/Default`, **pre-edit** (I1) | 16 cells, md5 list persisted |
| 2 | Live `getComputedStyle` capture of all 16 sites (I2) | persisted; the module's source of truth |
| 3 | `npm run check:design-tokens` | **28**, no `FooterView.tsx` entry (AC6) |
| 4 | Post-change rendered `--mantine-only` run | 16/16 identical to step 1 (AC4) |
| 5 | Two-armed plant + pre-plant census (I4) | Arm A flips ≥1 cell; Arm B restores all 16 (AC9) |
| 6 | DOM witness for tag names, `aria-label`, `rel`, marker classes | AC2, AC5 |
| 7 | `npm run check:file-integrity` · `npm run check:mojibake` | pass (AC10) |
| 8 | `npx tsc --noEmit` | 0 errors |
| 9 | **`npm run build`** | **exit 0 — hard gate**, transcript recorded (AC8) |

A failed or unrun step 9 permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`. `tsc=0` is not a substitute.

Evidence persists under `docs/sessions/` (assets alongside the log); `.screenshots/` output is local-only per **D6**.

---

## 14. Completion report contract

Write `docs/sessions/2026-08-01-task673-footerview-de-hybrid.md` containing:

1. **Files changed** — a table matching the real `git diff --stat` exactly, reconciled against the §3.8 snapshot so
   the 8 pre-existing dirty paths are not attributed to this task.
2. **Requirement IDs completed** — R1–R10, each with its AC verdict.
3. **Commands run and their actual results** — real exit codes and real numbers, including the step-9 build
   transcript. Do not paraphrase a result you did not observe.
4. **Evidence locations** — the I1 baseline md5 list, the I2 computed-style capture, the AC9 plant transcript
   (both arms), and the final run.
5. **The §3.2 disposition table, filled in** — what each of the 16 sites actually became, and the §5.2
   `SimpleGrid`-vs-module decision with its measured justification.
6. **The `.site-footer` zero-consumer census** (§3.3), recorded as a finding, not acted on.
7. **Assumptions, deviations, limitations, unresolved issues.**
8. Concise current state appended to `docs/backlog.md` — **state only**, no history, and flag a
   `BACKLOG LIMIT BREACH` if the file cannot stay at or below 80 lines.

**Status must be `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`.**
Never self-approve. Do not run, emit, suggest, or delegate any mutating git command, including any form of
`git push`.

---

## 15. Task quality gate

| Check | Status |
|---|---|
| A fresh Sonnet session can execute this with no hidden chat context | ✅ every path, line number, count and command is named |
| Every primary requirement has a binary AC and a verification method | ✅ R1–R10 → AC1–AC10 → §13 steps |
| Scope names what must not change | ✅ §8, plus R5's verbatim-preservation pair |
| Negative flows selected by applicability, not copied | ✅ §11 — 3 applicable, 4 marked `No` with the source that makes them inapplicable |
| No uninspected claim | ✅ every count in §3 was read or run on 2026-08-01; compiled utility values are deliberately **not** asserted — I2 measures them |
| The gate proves the changed behavior, not merely procedure | ✅ AC9's Arm A must make the comparator fail, and the pre-plant census removes the M4 lifeline |
| Owner exceptions have traceable authorization | ✅ D28/D29 recorded in Sprint 47 §"Owner decisions"; D16/D6/D26 cited with file and date |
| Exactly one active executable route | ✅ D28's mechanism-only route; §5.2's `SimpleGrid` choice is a measured in-task decision, not a second route |
| Every checkpoint names producer, output, comparator, failure behavior | ✅ §13 table + AC4's D26 comparator + AC9's blocked-on-blind-comparator clause |
| Dirty worktree handled with a pre-write snapshot | ✅ §3.8, with the `docs/backlog.md` double-attribution trap called out |
| UI: current/legacy boundary, QA profile, source map, canonical decision record, preservation classifications | ✅ §3.2 source map · §3.6 token provenance · §3.7 canonical reference · §13 profile with the Q4 exclusion argued from evidence |
| Sprint assigned before creation | ✅ Sprint 47, opened first per the 2026-08-01 owner rule |

**Remaining ambiguous or conflicting requirements: none.**
**Owner decisions still needed: none** — D28 and D29 closed both.
