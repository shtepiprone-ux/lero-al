# Task 767 — Homepage level 2: the runtime-token exit

**Sprint:** 65 — Homepage finishes the Tailwind exit (`tasks/Sprints/Sprint_65_Homepage_Finishes_The_Tailwind_Exit.md`)
**Priority:** P1 · **Status:** FILED — ready for executor · **Baseline:** the **merge commit of Task 766** on `main`
**Depends on:** 766 accepted **and merged**. 763, 764, 765 already in `main`. **Does not depend on:** 667, 768, 769, global Tailwind removal.

> **Filing precondition.** Task 766 was `APPROVED WITH NOTES` on 2026-08-25 but was **not yet in `main`** when this
> kickoff was written — the tree still held its uncommitted work. Do **not** start this task on that dirty tree. The
> only valid baseline is the merge commit of 766, never `7b9a13c37` and never a working tree that still contains 766's
> unstaged changes. §10.0 is what proves you are on it.

---

## 1. Mode and task type

**Mode:** implementation (executor: Sonnet, via `.claude/skills/execute-task/SKILL.md`).
**Task type:** UI / Layout / Component — **current Mantine path**, mixed with **Legacy Tailwind Styling Governance**
for the runtime property names being retired. **Also Docs/Governance**, because §6 modifies an existing shipped
detector (`check:tailwind-runtime-tokens`) and empties its baseline — so the Sprint 62/65 control rules apply in full.

The boundary: the seven consumers are already Mantine surfaces or project CSS Modules. What is legacy is the **name**
each of them reads — a custom property whose declaration exists only because Tailwind is still compiled. Nothing about
the rendered result is being redesigned.

**QA profile:** `Q3 Full Visual Matrix` — see §13 for why, and for the one thing Q3's standing commands cannot see.

## 2. Objective

Make every known Homepage consumer stop reading a **Tailwind-owned runtime custom property**, and make
`check:tailwind-runtime-tokens` able to see the two live **TSX** sites it has never scanned — ending with the baseline
file holding an **empty JSON array**.

After this task: 20 `(file, property)` pairs / 26 live references become **0 / 0**; twelve new project-owned tokens are
declared once each in the plain `:root` block of `src/app/globals.css`; the detector reports both origins
(`module-css`, `runtime-tsx`) with a line number; and a `--verify-gate` mode proves, in a throwaway tree, that the gate
can actually fail in all three of its directions.

This is **not** an alias-layer refactor. `@theme inline` stays **byte-identical** — it remains the source for legacy
Tailwind utilities on other routes, and level 3 (Task 768/769) owns it. This is also **not** a route inventory:
Task 667 remains the only route-certification work (D65-C).

## 3. Verified context

Every fact below was measured read-only from the project root on **2026-08-25**, against the tree that carries Task
766's approved-but-unmerged work. Line numbers are `FACT` **at that measurement** and must be re-confirmed by §10.0 on
the post-766 merge commit before any edit. A drifted line number is not automatically a blocker; a drifted **count**,
**file** or **property** is (§14.1).

### 3.1 The closed input manifest — 20 pairs / 26 live references

| # | File | Property | Line(s) | Uses |
|---:|---|---|---|---:|
| 1 | `src/components/layout/FooterView.module.css` | `--text-xl` | 51 | 1 |
| 2 | " | `--text-xl--line-height` | 53 | 1 |
| 3 | " | `--text-sm` | 70, 94 | 2 |
| 4 | " | `--text-sm--line-height` | 95 | 1 |
| 5 | " | `--text-xs` | 78, 114, 121, 128 | 4 |
| 6 | " | `--text-xs--line-height` | 122, 129 | 2 |
| 7 | `src/components/layout/HeaderView.module.css` | `--text-xl` | 72 | 1 |
| 8 | " | `--text-xl--line-height` | 73 | 1 |
| 9 | " | `--text-sm` | 95 | 1 |
| 10 | " | `--text-sm--line-height` | 96 | 1 |
| 11 | `src/components/layout/MobileNavDrawer.module.css` | `--text-sm` | 4 | 1 |
| 12 | " | `--text-sm--line-height` | 5 | 1 |
| 13 | `src/design-system/mantine/patterns/MantineCopyIdButton.module.css` | `--font-mono` | 22 | 1 |
| 14 | `src/modules/auth/components/AuthSheet.module.css` | `--radius-lg` | 134, 146 | 2 |
| 15 | `src/app/[locale]/page.tsx` | `--text-3xl` | 31 | 1 |
| 16 | " | `--text-4xl` | 31 | 1 |
| 17 | " | `--text-5xl` | 31 | 1 |
| 18 | " | `--text-xl` | 34 | 1 |
| 19 | " | `--text-2xl` | 34 | 1 |
| 20 | `src/components/shared/HeroSearchView.tsx` | `--container-3xl` | 50 | 1 |
| | **Total** | **20 pairs** | | **26** |

Rows 1–14 are **exactly** the 14 rows currently in `scripts/tailwind-runtime-token-baseline.json` — the detector
already sees them and they are baselined debt. Rows 15–20 are the **six** TSX references the detector has never
scanned; they are **new debt** the moment §6's TSX inputs are added, which is why §10.0 runs the extended detector in
report mode **before** any consumer edit.

**Two adjacent references that are NOT in scope and must not be touched:**

- `MantineCopyIdButton.module.css:20` — `font-size: var(--text-2xs)`. `--text-2xs` is declared at
  `globals.css:173-174` and Tailwind's own `theme.css` does **not** declare it, so the classifier calls it
  `project`. It is a level-3 (`@theme inline`) consumer, owned by Task 768/769. Leave it.
- `FooterView.module.css:70` — the rule sets `font-size: var(--text-sm)` but its `line-height` is the literal
  `1.625` (`leading-relaxed`), **not** `--text-sm--line-height`. The file's own comment says so. Swap the font-size
  only; do **not** "complete the pair" by introducing a line-height token here. That would be a restyle (rule 3).

### 3.2 Where each replaced value actually comes from — read, not assumed

Ten of the twelve values are declared **in this repository**, inside `globals.css`'s `@theme inline` block:

| Property | Declared at | Value |
|---|---|---|
| `--font-mono` | `globals.css:110` | `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace` |
| `--text-xs` / `--text-xs--line-height` | `globals.css:175` / `:176` | `0.75rem` / `1rem` |
| `--text-sm` / `--text-sm--line-height` | `:177` / `:178` | `0.875rem` / `1.25rem` |
| `--text-xl` / `--text-xl--line-height` | `:183` / `:184` | `1.25rem` / `1.75rem` |
| `--text-2xl` | `:185` | `1.5rem` |
| `--text-3xl` | `:187` | `1.875rem` |
| `--text-4xl` | `:189` | `2.25rem` |
| `--text-5xl` | `:191` | `3rem` |

**`--container-3xl` is different, and this matters.** It is **not** declared anywhere in `globals.css` (`grep` → zero
matches). Its only declaration is `node_modules/tailwindcss/theme.css:341` → `--container-3xl: 48rem`. Today
`HeroSearchView`'s `maw` resolves through Tailwind's own emitted theme layer; the day `@import "tailwindcss"` is
removed, that `maw` silently computes to nothing and the hero search bar loses its 768px cap. This one reference is
the clearest instance of the failure mode the whole sprint exists for — say so in the token's comment.

**Do not re-derive these values.** Copy them. In particular `--font-mono` must be copied **with its quotes**:
`"Liberation Mono"` and `"Courier New"` are multi-word family names and an unquoted copy is a different, weaker value.
(The Codex-tasks candidate draft printed this value unquoted — a transcription defect, corrected here; see CONFLICTS.)

**Tailwind's own `--text-*--line-height` values are unitless ratios** (`theme.css:348` → `calc(1 / 0.75)`), while this
project's `@theme inline` overrides them with absolute rems. The project's declaration wins today, so `1rem` / `1.25rem`
/ `1.75rem` are the values actually in effect and the ones to carry over. (They also happen to be arithmetically
identical to the ratios at the paired font sizes — 1.333 × 0.75rem = 1rem — so no computed line-height changes either
way. State the measured value, not this reasoning, in the completion report.)

### 3.3 Why `--radius` is the correct target for `AuthSheet`, and why the gate accepts it

- `globals.css:99` (inside `@theme inline`) → `--radius-lg: var(--radius)`.
- `globals.css:459` (inside plain `:root`) → `--radius: 0.75rem`.

So `var(--radius-lg)` already resolves to exactly `0.75rem` through a project-owned plain-root token. Pointing
`AuthSheet.module.css:134` and `:146` straight at `var(--radius)` is a **rename with no value change** — no new token
is needed and none may be added.

The gate agrees, and this was checked rather than assumed: Tailwind's `theme.css` *does* declare `--radius: 0.25rem`
at `:508`, but that declaration sits inside the block Tailwind's own authors marked `/* Deprecated */`
(`@theme default inline reference`, `theme.css:502-509`), and `check-tailwind-runtime-tokens.mjs`'s
`stripDeprecatedBlocks()` removes exactly that block before extracting Tailwind-owned names. `--radius` therefore
classifies **`project`**, not `tailwind`. If it did not, this substitution would keep the baseline non-empty and the
task's own exit criterion would be unreachable. Re-confirm this in §10.0 by observing that the post-edit scan reports
zero findings — do not take it on trust from this paragraph.

### 3.4 The detector as it stands today — `scripts/check-tailwind-runtime-tokens.mjs`

Read the whole file before touching it. The facts §6 builds on:

- **430 lines**, Task 762 + Revision 1. Registered as `check:tailwind-runtime-tokens` (`package.json:90`).
  Docs: `docs/design-system.md` §23.7.
- **Inputs:** `src/**/*.module.css` only, collected by `collectModuleCssFiles()`. No TS/TSX input of any kind exists.
- **Three roles per file:** `findVarReferenceNames()` (`var()` reads, paren-depth aware, nested-call aware),
  `findDeclaredNames()` (`--name:` declarations), `findPropertyListNames()`
  (bare names inside `transition-property` / `will-change`). Comments are blanked by `stripCssComments()` first.
- **Three-bucket ownership classifier** (`classifyName()`): `--mantine-` prefix → `external`; `--tw-` prefix or a name
  declared in Tailwind's own `theme.css`/`index.css` → `tailwind`; declared in `globals.css`'s
  `@theme`/`@theme inline`/`:root`, or declared **locally in the same file being scanned** → `project`; everything else
  → `tailwind` **by elimination**. It fails closed and has no "unknown" state. **It must be retained unchanged.**
- **Fail-closed version pinning:** `loadTailwindOwnedNames()` refuses to run if `package-lock.json` and
  `node_modules/tailwindcss/package.json` disagree, or if either Tailwind source file is missing.
- **Baseline schema:** a JSON array of `{ file, property }`. One row per `(file, property)` **regardless of how many
  roles or lines surfaced it** (R6). It fails in **both** directions: unbaselined finding → exit 1 (new debt);
  baselined row with no live match → exit 1 (stale baseline). There is no marker-based or inline exemption.
- **Current output has no line number and no origin field**, and there are no CLI modes — `run()` is the only path.
- **Current baseline: exactly 14 rows**, identical to rows 1–14 of §3.1.

### 3.5 Why the TSX input list is closed at two files — and why `className` must be excluded

Measured repo-wide over `src/**/*.{ts,tsx}` (stories excluded, then separately confirmed to be zero), for `var()`
reads of Tailwind-owned runtime names:

| File | Sites | In scope? |
|---|---:|---|
| `src/app/[locale]/page.tsx` | 5 (lines 31, 34) | **yes** — Homepage render graph |
| `src/components/shared/HeroSearchView.tsx` | 1 (line 50) | **yes** — Homepage render graph |
| `src/components/ui/button.tsx` | 4 (lines 25, 26, 32, 34) | **no** — see below |
| `src/**/*.stories.tsx` | 0 | n/a |

`button.tsx` is the legacy shadcn primitive. All four of its hits are `rounded-[min(var(--radius-md),10px)]`-style
**Tailwind arbitrary values living inside `className` class strings** — i.e. compiled by Tailwind, not read at
runtime by the browser as a bare custom property, and not in the Homepage graph. This is the measured reason §6
excludes `className` from the TSX scan: a scanner that read `className` would flag four references in a file this
task must not touch, and would have to be given an exemption to go green — which rule 2 forbids. The exclusion is a
**scope boundary that was measured**, not a convenience.

Consequently: after this task, `page.tsx` and `HeroSearchView.tsx` are the **only** TSX files the gate reads, and
the gate makes **no claim** about any TSX file outside that list. §6 requires the script header to say so in writing.

### 3.6 Storybook coverage — counted in the current harness, not assumed

- All six proof stories exist, with these exact titles and exports:
  `Mantine/Primitives/FooterView` → `Default` · `Mantine/Primitives/HeaderView` → `Default` ·
  `Mantine/Primitives/MobileNavDrawer` → `Default` · `Mantine/Primitives/CopyIdButton` → `Default` ·
  `Mantine/Primitives/HeroSearch` → `Default` · `Patterns/Mantine/AuthSheet` → `Login`.
- **`screenshots:assert` (`scripts/check-stories-rendered.mjs`) covers all six automatically.** It
  `discoverMantinePrimitiveStories()`-es every story whose title starts with `Mantine/Primitives/` or
  `Patterns/Mantine/` from the built Storybook `index.json` — no hardcoded ids. Standing cells per discovered story:
  `MANTINE_VIEWPORTS` = **320×812, 375×812, 390×844, 1024×768** × `LOCALES` = **sq, en, uk, it**.
  `HeroSearch` additionally gets `band-700` (700×812) via `MANTINE_STORY_EXTRA_VIEWPORTS`.
- **`screenshots:responsive:storybook` (`scripts/responsive-screenshots.mjs`) covers none of them.** Its target list
  is a fixed array of **28** story ids and contains **zero** `mantine-`-prefixed entries (`grep` → 0 matches). Task 766
  Revision 1 already recorded this same non-coverage for its own two stories. Running it is fine; **citing it as
  evidence for any AC in this task is a false claim.**
- **The standing Mantine matrix never lands above 1024px.** There is no 1440-wide standing cell for any of the six
  stories. Any 1440 claim needs its own capture (§13.2) — it cannot be read out of `screenshots:assert`.
- `.storybook/preview.tsx:19` imports `../src/app/globals.css`, so the new plain-`:root` tokens are live inside
  Storybook exactly as they are in the app. This is why story-level proof is meaningful at all.

### 3.7 Breakpoints — the project's, and the sampling consequence

`src/design-system/mantine/theme.ts:163-170`: `xs 20em/320` · `sm 40em/640` · `md 48em/768` · `lg 64em/1024` ·
`xl 80em/1280` · `xxl 90em/1440`.

`page.tsx:31` is `fz={{ base: 3xl, sm: 4xl, md: 5xl }}` and `:34` is `fz={{ base: xl, sm: 2xl }}`. So:

| Viewport width | Tier | Title | Subtitle |
|---:|---|---:|---:|
| 320 | base | 30px | 20px |
| **640** | **sm** | **36px** | 24px |
| 768 | md | 48px | 24px |
| 1024 | md | 48px | 24px |

**The candidate draft asked the route probe to record "30/36/48px" while specifying only 320 / 768 / 1024 — widths at
which the 36px `sm` tier is never rendered.** Corrected here: the probe runs **four** viewports, adding **640×900**.
Without it, AC7 would be unprovable by its own command (see CONFLICTS).

### 3.8 Visual source map

| Visible artifact/state | Component/markup | Selector / prop | Current token path | Disposition | Evidence |
|---|---|---|---|---|---|
| Footer headings, link rows, legal line | `FooterView.module.css` `:51-53, :70, :78, :94-95, :114, :121-122, :128-129` | `font-size` / `line-height` | `var(--text-{xs,sm,xl}[--line-height])` → `@theme inline` → Tailwind's emitted theme layer | changed (token rename, value identical) | computed `fontSize`/`lineHeight` per rule, pre/post |
| Header brand + nav text | `HeaderView.module.css` `:72-73, :95-96` | `font-size` / `line-height` | same | changed (rename) | same |
| Mobile drawer link text | `MobileNavDrawer.module.css` `:4-5` | `font-size` / `line-height` | same | changed (rename) | same |
| Copy-id button glyph face | `MantineCopyIdButton.module.css:22` | `font-family` | `var(--font-mono)` → `@theme inline:110` | changed (rename) | computed `fontFamily` string equality |
| Copy-id button size | same file `:20` | `font-size: var(--text-2xs)` | project-owned, level-3 | **preserved — out of scope** | unchanged input ⇒ unchanged output |
| AuthSheet panel corners | `AuthSheet.module.css:134, :146` | `border-radius` | `var(--radius-lg)` → `@theme inline:99` → `:root:459` `--radius` | changed (points at `--radius` directly) | computed `borderRadius` = `12px` |
| Hero title | `page.tsx:31` | Mantine `fz` responsive object | `var(--text-{3,4,5}xl)` | changed (rename) | route probe computed `fontSize` at 4 widths |
| Hero subtitle | `page.tsx:34` | Mantine `fz` responsive object | `var(--text-{xl,2xl})` | changed (rename) | same |
| Hero title `lh={1.25}` / `fw={700}`, `maw={768}`, subtitle `maw={576}` | `page.tsx:31, :34` | Mantine props | literals, no token | **preserved — untouched** | route probe records them unchanged |
| Hero search bar cap | `HeroSearchView.tsx:50` | Mantine `maw` | `var(--container-3xl)` → **Tailwind source only** | changed (rename to a project token) | route probe computed `maxWidth` = `768px` |
| `HeroSearchView`'s `className="hero-search"`, `w="100%"`, `mx="auto"` | same line | — | globals.css `.hero-search` | **preserved — only the `maw` value string changes** | diff inspection |
| `@theme inline` block, `globals.css:35-316` | — | — | legacy utility alias layer | **byte-unmodified** | `git diff` hunk inspection (AC9) |
| `AppImage`, Task 764 hover, Task 765 `:root` tokens, Task 766 gate/token | — | — | — | **byte-unmodified** | `git diff --stat` |

### 3.9 Canonical UI decision record

| Visible artifact | Search queries and inspected paths | Canonical story/source | Disposition | Required implementation and registration |
|---|---|---|---|---|
| Footer type scale | `ls src/stories/mantine/primitives/`; opened `FooterView.stories.tsx` | `Mantine/Primitives/FooterView` → `Default` (`:7`, `:25`) | **reuse** | Auto-discovered by `screenshots:assert`; 4 viewports × 4 locales already. No story edit. |
| Header type scale | opened `HeaderView.stories.tsx` | `Mantine/Primitives/HeaderView` → `Default` (`:29`, `:35`) | **reuse** | as above |
| Mobile drawer type scale | opened `MobileNavDrawer.stories.tsx` | `Mantine/Primitives/MobileNavDrawer` → `Default` (`:29`, `:37`) | **reuse** | as above |
| Mono glyph face | opened `CopyIdButton.stories.tsx` | `Mantine/Primitives/CopyIdButton` → `Default` (`:20`, `:26`) | **reuse** | as above |
| Hero search bar cap | opened `HeroSearch.stories.tsx` | `Mantine/Primitives/HeroSearch` → `Default` (`:33`, `:39`) | **reuse** | as above, plus its `band-700` extra cell |
| Auth panel corners | opened `AuthSheet.stories.tsx` | `Patterns/Mantine/AuthSheet` → `Login` (`:37`, `:53`) | **reuse** | as above |
| Hero title / subtitle at real route | `page.tsx` read in full; harness searched (§3.6) | none — a route page has no story, by design | **reuse (nothing to create)** | Proven **only** by §13.1's route probe against `next start`, exactly as Task 766's AC5 was. |

**Permanent-story creation gate: satisfied with zero additions.** Every state is already rendered by an existing
canonical story with the real production component, or is a route-only state with a task-owned probe. Rule 6 forbids
adding a story to satisfy a detector; if a required state turns out to be unreachable, that is §14.5, not a licence to
add markup.

### 3.10 Start state

At measurement time `git --no-optional-locks status --short --branch` reported `## main...origin/main` with **Task
766's approved work still uncommitted** (`M` on `.gitignore`, `docs/backlog.md`, `package.json`,
`src/app/[locale]/layout.tsx`, `src/app/globals.css`, `src/components/shared/LocaleSwitcher.tsx`,
`MantineListingCardPattern.{tsx,module.css}`, plus untracked `scripts/check-homepage-literal-utilities.mjs`,
`scripts/task766-route-shell-probe.mjs`, `src/components/shared/LocaleSwitcher.module.css`,
`docs/sessions/evidence/task766/`, two Sprint 65 revision briefs and one review ledger).

**That is not this task's start state.** §10.0 requires a clean tree at the 766 merge commit. If `git status` is not
clean, `BLOCKED` — do not stash, do not commit, do not "work around" 766's tree (§14.9).

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Sprint 65 §2 level 2 | The 20 pairs / 26 references of §3.1 become 0 / 0 in the seven named files | P0 | Detector report, pre and post (§10.0, AC1) | Confirmed |
| R2 | Sprint 65 rule 2 | `scripts/tailwind-runtime-token-baseline.json` is committed as an **empty JSON array**; no row was added at any point to reach green | P0 | File content + `git diff` (AC2) | Confirmed |
| R3 | Sprint 65 rule 4 | The twelve §5.1 tokens are declared **exactly once each**, in the plain `:root` block, in one new clearly labelled subsection | P0 | `grep` count per name, `check:css-vars` (AC3) | Confirmed |
| R4 | Sprint 65 rule 3, D28 | Every property in §3.8 marked *changed* computes to a byte-identical value after the change | P0 | Computed-style capture, story + route (AC4, AC7) | Confirmed |
| R5 | §3.3 | Both `AuthSheet` references read `var(--radius)`; no new radius token is introduced | P0 | Source diff + computed `borderRadius` (AC4) | Confirmed |
| R6 | Sprint 65 rule 4 | `@theme inline` (`globals.css:35-316`) is **byte-identical** to its pre-edit content | P0 | `git diff` hunk inspection (AC9) | Confirmed |
| R7 | §6 | The detector reads exactly two TSX inputs, reports `file, line, property, origin`, retains the module-CSS behaviour and the ownership classifier unchanged, and fails closed on a dynamic custom-property name | P0 | Code review + `--report` output (AC5) | Confirmed |
| R8 | Sprint 65 rule 1 | `--verify-gate` proves **three** distinct failure paths in a copied temporary tree, and exits 0 on the unmodified copy | P0 | Executed transcript, all four exit codes (AC6) | Confirmed |
| R9 | §13.1 | A task-owned route probe records the hero title, subtitle and search-bar geometry on `/en` at four viewports, pre and post, against `next start` | P0 | Retained JSON + PNG pairs (AC7) | Confirmed |
| R10 | Sprint 65 rule 2 | No `design-tokens-allow:` marker, allowlist row, baseline row, `@apply`, or new `@theme inline` consumer is introduced | P0 | Diff inspection + gate runs (AC8) | Confirmed |
| R11 | Sprint 65 §4 | Tasks 763/764/765/766 files stay byte-unmodified; `AppImage` untouched | P1 | `git diff --stat` (AC9) | Confirmed |
| R12 | agent-contract 10 | Session log + concise backlog state update | P1 | Files present (AC10) | Confirmed |

## 5. Implementation requirements

### 5.1 The new `:root` subsection — twelve tokens, declared once

Add **one** new, clearly labelled subsection inside the **plain `:root` block** of `src/app/globals.css` (the block
that opens at `:327`). Place it **after** the Task 765 runtime block and its Task 766 line — do **not** edit, reorder
or reindent any existing line in that block, and do **not** touch `@theme inline`. [R3, R6]

| New token | Value | Replaces | Value source |
|---|---|---|---|
| `--homepage-runtime-font-size-xs` | `0.75rem` | `--text-xs` | `globals.css:175` |
| `--homepage-runtime-line-height-xs` | `1rem` | `--text-xs--line-height` | `:176` |
| `--homepage-runtime-font-size-sm` | `0.875rem` | `--text-sm` | `:177` |
| `--homepage-runtime-line-height-sm` | `1.25rem` | `--text-sm--line-height` | `:178` |
| `--homepage-runtime-font-size-xl` | `1.25rem` | `--text-xl` | `:183` |
| `--homepage-runtime-line-height-xl` | `1.75rem` | `--text-xl--line-height` | `:184` |
| `--homepage-runtime-font-size-2xl` | `1.5rem` | `--text-2xl` | `:185` |
| `--homepage-runtime-font-size-3xl` | `1.875rem` | `--text-3xl` | `:187` |
| `--homepage-runtime-font-size-4xl` | `2.25rem` | `--text-4xl` | `:189` |
| `--homepage-runtime-font-size-5xl` | `3rem` | `--text-5xl` | `:191` |
| `--homepage-runtime-font-family-mono` | `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace` | `--font-mono` | `:110` — **copy verbatim, quotes included** |
| `--homepage-runtime-search-max-width` | `48rem` | `--container-3xl` | `node_modules/tailwindcss/theme.css:341` — **not declared in this repo today** |

Rules for the subsection:

1. A header comment naming Task 767, stating that these are project-owned runtime tokens that survive Tailwind's
   removal, and stating that `@theme inline` keeps its own declarations untouched as the alias layer for legacy
   utilities on other routes.
2. `--homepage-runtime-search-max-width` gets its own one-line comment recording that `--container-3xl` had **no**
   declaration in this repository and resolved only through Tailwind's shipped `theme.css` — the exact condition this
   level exists to remove.
3. **No thirteenth token.** `--radius` already exists (§3.3); adding a `--homepage-runtime-radius-*` alias is a scope
   violation, not a convenience.
4. `grep -c` each new name across `src/` after adding it: the declaration must appear **once**.

### 5.2 The seven consumers — mechanical replacement only

Replace each reference in §3.1 with the matching token from §5.1. Nothing else on those lines may change: no
selector, no shorthand, no added declaration, no removed comment, no reformatting. Existing inline comments that name
the old Tailwind token should be updated to name the new one where they would otherwise be wrong — that is the only
prose edit permitted. [R1, R4]

- `FooterView.module.css` — 11 references (§3.1 rows 1-6). Line 70 gets **only** the font-size swap (§3.1 note).
- `HeaderView.module.css` — 4 references.
- `MobileNavDrawer.module.css` — 2 references.
- `MantineCopyIdButton.module.css:22` — `font-family: var(--homepage-runtime-font-family-mono)`. `:20` untouched.
- `AuthSheet.module.css:134, :146` — `border-radius: var(--radius)`. [R5]
- `page.tsx:31` — `fz={{ base: 'var(--homepage-runtime-font-size-3xl)', sm: '…-4xl', md: '…-5xl' }}`.
  `order={1}`, `c="white"`, `fw={700}`, `lh={1.25}`, `mb="md"` and the surrounding `maw={768}` are **unchanged**.
- `page.tsx:34` — `fz={{ base: 'var(--homepage-runtime-font-size-xl)', sm: '…-2xl' }}`.
  `c`, `fw`, `maw={576}`, `mx` **unchanged**.
- `HeroSearchView.tsx:50` — `maw="var(--homepage-runtime-search-max-width)"`. The `maw` **prop stays**; only its
  value string changes. `className="hero-search"`, `w="100%"`, `mx="auto"` **unchanged**.

Forbidden throughout: a raw literal value in a component (`fz="30px"`), a Mantine `theme` extension, an `@apply`,
a `design-tokens-allow:` marker, an alias rewrite in `@theme inline`, and any edit to `--text-2xs` or any other
level-3 name. [R10]

## 6. The control — extend `check:tailwind-runtime-tokens` (ships before or with the fix)

Modify `scripts/check-tailwind-runtime-tokens.mjs`. **Retain**: the three-bucket ownership classifier, the fail-closed
Tailwind version pinning, `stripDeprecatedBlocks()`, all three module-CSS roles, the both-directions baseline
semantics, and the `{ file, property }` baseline schema across **both** origins. [R7, R8]

**Added inputs — exactly two, hardcoded and closed:**

```
src/app/[locale]/page.tsx
src/components/shared/HeroSearchView.tsx
```

**TSX extraction contract**

- Use the **installed TypeScript compiler API** (`typescript` is already a dependency — confirm with a `node -e`
  require before writing against it). No regex over TSX source, and no new package.
- Walk **JSX attributes**, skipping any attribute named `className`. For each remaining attribute, inspect **static
  string literals anywhere inside its initializer**, including literals nested in an object expression — `page.tsx`'s
  `fz={{ base: '…', sm: '…', md: '…' }}` is the shape that must work, and a scanner that only reads a top-level
  `attr="literal"` would miss five of the six live references.
- From each literal, extract literal `var(--name)` custom-property calls and classify each name with the **existing**
  classifier.
- **Fail closed on dynamism:** a custom-property name assembled from a template expression or any non-literal
  (`` `var(--text-${size})` ``) must be reported as a violation, never silently skipped. State this in the header as
  a deliberate boundary and name the one thing it does not model, in the same spirit as Task 766's stated mutability
  boundary.
- Comments and `className` strings are **never** input (§3.5).

**Reporting**

- Each finding carries `file`, `line`, `property`, and `origin ∈ { module-css, runtime-tsx }`. Module-CSS findings
  gain a line number too; where a name appears on several lines in one file, report the first and keep the baseline
  row single (R6 is unchanged).
- The header documents the boundary in writing: *this gate reads all `src/**/*.module.css` plus exactly two runtime
  TSX files; it is not a route-graph inventory and makes no claim about any other TSX file. Task 667 remains the only
  route-certification work.*

**Modes**

| Mode | Behaviour |
|---|---|
| default (no flag) | Today's gate behaviour, over both origins. Exit 1 on new debt or stale baseline. |
| `--report` | Prints every finding grouped by origin with a pair count and a use count, and exits **0** regardless. This is what §10.0 runs before any edit. |
| `--verify-gate` | Self-test, below. |

**`--verify-gate` — three planted failures, in a copied tree only**

Copy the real inputs into a temporary directory (`os.tmpdir()`), plant into the **copy**, run the scan against the
copy, and assert exit codes. **No plant may ever be written into the real worktree** — this replaces Task 766's manual
plant procedure and is the response to its F1 note for this gate.

| # | Plant in the copied tree | Required |
|---:|---|---|
| 1 | a static `maw="var(--container-3xl)"` JSX prop added to the copied `page.tsx` | exit **1**, reported as `runtime-tsx` new debt, naming file/line/property |
| 2 | a `font-size: var(--text-sm)` declaration added to the copied `FooterView.module.css` | exit **1**, reported as `module-css` new debt |
| 3 | a synthetic baseline row whose `(file, property)` exists nowhere in the copied tree | exit **1**, reported as **stale** baseline |
| 4 | the unmodified copy, with the shipped empty baseline | exit **0** |

Register `--verify-gate` as its own npm script alongside the existing `check:tailwind-runtime-tokens` entry, following
the `check:*` convention. Paste all four real exit codes; a path reasoned about but not executed does not count.

**Baseline**

Pre-migration the extended detector reports **20 pairs / 26 uses**, of which the **six** TSX rows are new debt against
the 14-row baseline. Post-migration, delete **every** row: the committed file is exactly `[]`. Do **not** add a row at
any intermediate point — not to "get a clean run" between edits. (R2)

## 7. Scope

Only these may change:

- the seven consumers: `FooterView.module.css`, `HeaderView.module.css`, `MobileNavDrawer.module.css`,
  `MantineCopyIdButton.module.css`, `AuthSheet.module.css`, `src/app/[locale]/page.tsx`,
  `src/components/shared/HeroSearchView.tsx`
- `src/app/globals.css` — **one** new subsection inside the existing plain `:root` block, and nothing else
- `scripts/check-tailwind-runtime-tokens.mjs` and `scripts/tailwind-runtime-token-baseline.json`
- one new `package.json` script entry for `--verify-gate`, plus any focused self-test support the mode needs
- `scripts/task767-homepage-runtime-probe.mjs` and its retained output under `docs/sessions/evidence/task767/`.
  It is evidence tooling, not a gate: **no** CI wiring, exactly like `scripts/task764-pointer-probe.mjs` and
  `scripts/task766-route-shell-probe.mjs`.
- `docs/backlog.md` (concise state) and a new `docs/sessions/` log (agent-contract clause 10)

## 8. Out of scope

`@theme inline` in any form; `--text-2xs` and every other level-3 name; `AppImage.tsx` / `appImageConfig.ts` /
`AppImage.module.css`; the Task 764 hover, `.cardGrid` scale and `imageActions` slot; Task 765's `:root` tokens;
Task 766's `check:homepage-literal-utilities`, `--motion-duration-spinner`, `LocaleSwitcher.module.css` and route-shell
work; `PerfDevOverlay` (D65-A pending); `src/components/ui/button.tsx`; global Tailwind configuration; removal of any
`@import`, `@source`, `@custom-variant` or `@apply`; translations, data, API; any new or extended permanent Storybook
story; and any route-certification claim (D65-C).

**Task 766's F1 note is not folded in here.** This task adds `--verify-gate` to *its own* gate only. CI wiring for
`check:homepage-literal-utilities` remains a separate follow-up number.

## 9. Current and required behavior

**Current.** Twenty Tailwind-owned runtime custom-property names are read from seven Homepage consumers, twenty-six
times. Fourteen of those pairs are baselined debt the gate tolerates; six live in TSX files the gate has never
scanned and are therefore invisible to it. One of them, `--container-3xl`, has no declaration in this repository at
all — it resolves purely because Tailwind is compiled.

**Required after.** Zero. Every one of those references reads a project-owned token declared once in plain `:root`,
except `AuthSheet`'s two, which read the pre-existing `--radius`. The baseline file is an empty array. The gate now
sees both origins with line numbers and can prove, in a throwaway tree, that it fails on a new TSX reference, a new
CSS reference, and a stale row. Every rendered value in §3.8 is unchanged, proven by computed styles and byte-identical
PNGs — not by a green build.

## 10. Positive flow and negative-flow applicability

**Positive flow.** On `/en`: the hero title renders 30/36/48px across the base/sm/md tiers with `line-height: 1.25`
and weight 700; the subtitle renders 20/24px; the hero search bar caps at 768px. Header, footer and mobile drawer type
scales are unchanged at every breakpoint and locale; the copy-id button keeps its monospace face; the AuthSheet panel
keeps 12px corners.

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Validation | No | No form, schema or input is touched | N/A | — |
| Authorization / RLS | No | No data access or route guard is touched | N/A | — |
| Offline / network | No | Unchanged | Existing global behavior | — |
| Concurrent writer | No | No data model is touched | N/A | — |
| Reduced motion | No | No animation, transition or motion token is in scope | Unchanged | — |
| **Locale — `uk` long labels** | **Yes** | Header/Footer/MobileNavDrawer text at 320 | Type scale identical to baseline; no new wrap or overflow introduced by a renamed token | `screenshots:assert` `uk` cells at 320/375/390, MD5-compared |
| **Locale — `sq`, `it`** | **Yes** (regression only) | same stories | Unchanged from baseline | same, all four locales |
| **Breakpoint tiers on the route** | **Yes** | `page.tsx` responsive `fz` objects | 30/36/48 and 20/24 at 320/640/768/1024 | §13.1 probe, four viewports |
| **AuthSheet `Login` overlay** | **Yes** | `Patterns/Mantine/AuthSheet` → `Login` | `borderRadius` identical (12px) | `screenshots:assert` + computed capture |
| **HeroSearch 640-767 band** | **Yes** | Task 572/573 wrap behaviour | Unchanged; `band-700` cell byte-identical | `screenshots:assert` `band-700` |

### 10.0 Mandatory first action (I0 — freshness re-measure)

On a **clean** tree at the **Task 766 merge commit**, in **native Windows PowerShell**, from the project root, before
any edit:

```powershell
node.exe -p process.platform
git --no-optional-locks status --short --branch
git --no-optional-locks log -1 --oneline
npm.cmd run check:tailwind-runtime-tokens
Get-Content -Raw scripts/tailwind-runtime-token-baseline.json
```

Required: `process.platform` prints `win32`; `git status` is **clean** on `main` at the 766 merge commit (766's files
committed, not pending); the existing gate is **green** against its **14-row** baseline.

Then implement §6's detector extension **first**, and run it in report mode **before touching any consumer**:

```powershell
node.exe scripts/check-tailwind-runtime-tokens.mjs --report
```

It must report **exactly 20 pairs and 26 references**, matching §3.1 file-for-file and property-for-property, with the
six TSX rows appearing as `runtime-tsx`. **Any different file, pair, or use count is `BLOCKED`**: retain the report
verbatim, do not adjust the manifest to match, and have this kickoff re-measured (§14.1). Do **not** add a baseline
row to reconcile a difference — that is rule 2 and it has no exception here.

## 11. Acceptance criteria

- **AC1 [R1]** — Given the §10.0 `--report` run, when it is re-run after implementation, then the seven files show
  **20 → 0** pairs and **26 → 0** references. Both runs are pasted in full.
- **AC2 [R2]** — Given the committed `scripts/tailwind-runtime-token-baseline.json`, then its content is exactly an
  empty JSON array, and `git log -p` on the file across this task's diff shows **no** intermediate row addition.
- **AC3 [R3]** — Given the twelve §5.1 names, when each is grepped across `src/`, then each has **exactly one**
  declaration, all inside the plain `:root` block, in one labelled subsection; and `check:css-vars` exits 0.
- **AC4 [R4, R5]** — Given a pre-edit computed-style capture of the six §3.9 stories and a post-edit capture at the
  same cells, then every property in §3.8 marked *changed* is **string-identical** (`fontSize`, `lineHeight`,
  `fontFamily`, `borderRadius`, `maxWidth`), and `AuthSheet`'s `borderRadius` computes to the same value from
  `var(--radius)` as it did from `var(--radius-lg)`.
- **AC5 [R7]** — Given the extended detector, then its report names `file`, `line`, `property` and `origin` for every
  finding; its two TSX inputs are exactly the §6 pair; a dynamic custom-property name is reported rather than skipped
  (show the check in source, and its behaviour on a plant if `--verify-gate` covers it); and the ownership classifier
  and module-CSS roles are unchanged (show the diff).
- **AC6 [R8]** — Given `--verify-gate`, when it is run, then plants 1, 2 and 3 each exit **1** with the stated
  origin/classification, the unmodified copy exits **0**, no plant file exists in the real worktree
  (`git status --porcelain` proves it), and all four exit codes are pasted.
- **AC7 [R9]** — Given `docs/sessions/evidence/task767/homepage-runtime.pre-edit.json` and `…post-edit.json` captured
  against `next start` on `/en` at **320×812, 640×900, 768×1024, 1024×900**, when compared cell by cell, then the hero
  `h1` computed `fontSize` reads **30 / 36 / 48 / 48 px**, its sibling subtitle **20 / 24 / 24 / 24 px**, the hero
  search container's computed `maxWidth` reads **768px** at every cell, and `lineHeight`/`fontWeight` are unchanged —
  each asserted as **equality against the captured pre-edit baseline**, with these numbers as the expected reading,
  not as the assertion. Both JSON files, both PNG sets and the `BASE_URL` used are retained. A Storybook command may
  **not** be offered as evidence for any part of this criterion.
- **AC8 [R10]** — Given the final diff, then it introduces no `design-tokens-allow:` marker, no allowlist row, no
  baseline row, no `@apply`, and no new `@theme inline` consumer anywhere.
- **AC9 [R6, R11]** — Given `git diff` on `src/app/globals.css`, then every hunk lies inside the plain `:root` block
  and the `@theme inline` block (`:35-316`) is byte-identical; and `git diff --stat` contains no `AppImage` file, no
  Task 764 hover code, no Task 765 token line, and no Task 766 file.
- **AC10 [R12]** — Given the completion report, then a `docs/sessions/` log exists with a Files Changed table matching
  the real diff, and `docs/backlog.md` carries a concise state line — not a history.

## 12. Pre-read rule bundle

Read exactly these — not "all docs":

- `docs/agent-contract.md`
- `docs/rule-index.md`
- `docs/qa-profiles.md`
- `docs/backlog.md`
- `tasks/Sprints/Sprint_65_Homepage_Finishes_The_Tailwind_Exit.md` — its §3 binding rules bind this task
- `tasks/Sprints/Sprint_65_kickoff_prompt_Task_766_Homepage_Literal_Utility_Exit.md` — the immediately preceding level,
  and the model for §13.1
- `scripts/check-tailwind-runtime-tokens.mjs` — **in full**, before editing it
- `tasks/Sprints/Sprint_62_kickoff_prompt_Task_762_tailwind_runtime_tokens.md` and
  `Sprint_62_Task_762_revision_1_Category_C_And_Gate_Bypass.md` — why the classifier is shaped the way it is; changing
  it is out of scope
- `docs/design-system.md` §22.2 (type scale) and §23.7 (this gate)
- `docs/mantine-responsive-design-system.md` — breakpoints and responsive-prop guidance
- `docs/storybook-governance.md` §14.9.17 (per-story viewports) and §14.11 (D26 comparator tolerance)
- `docs/component-rules.md`, `docs/ui-rules.md` (legacy boundary only), `docs/qa-rules.md`
- `docs/critical-flow-registry.md` — scan only, to confirm no listed flow is touched
- `scripts/check-stories-rendered.mjs` `:389-465` (Mantine discovery, viewports, per-story extras) and
  `scripts/task766-route-shell-probe.mjs` (header + context setup) — read both before writing §13.1's probe

## 13. QA profile and verification plan

**Profile: `Q3 Full Visual Matrix`.** It applies because the changed surfaces are a navigation header, a footer, a
mobile drawer, a migrated Mantine pattern, an overlay panel and the page shell's hero — and because the entire claim
is "nothing rendered differently", which only rendered evidence supports. Read each story's effective viewport set out
of the built manifest before claiming a tier is covered; do not infer coverage from the union of the run.

Run everything in **native Windows PowerShell**. Record platform, Node version, working directory, exact command and
the **real** exit code for each (capture it unpiped — `echo "EXIT_CODE=$?"` — per the agent-contract §3a discipline
that Task 766 §10 had to invoke).

```powershell
node.exe scripts/check-tailwind-runtime-tokens.mjs --report
npm.cmd run check:tailwind-runtime-tokens
npm.cmd run check:tailwind-runtime-tokens:verify-gate   # exact name per §6 registration
npm.cmd run check:homepage-literal-utilities
npm.cmd run check:design-tokens
npm.cmd run check:css-vars
npm.cmd run typecheck
npm.cmd run build
npm.cmd run build-storybook
npm.cmd run check:stories
npm.cmd run screenshots:assert
```

`npm.cmd run build` exiting 0 on the final diff is a hard gate; a failed, unrun or stale build permits only
`PARTIALLY IMPLEMENTED` or `BLOCKED`.

**`screenshots:responsive:storybook` is deliberately absent from that list.** Per §3.6 it drives a fixed 28-id list
containing none of the six stories. Run it if you want a regression signal, but do not cite it for any AC.

### 13.1 Route capture — the only proof path for AC7

Write `scripts/task767-homepage-runtime-probe.mjs`, modelled on `scripts/task766-route-shell-probe.mjs`: a task-owned
Playwright probe, `node scripts/task767-homepage-runtime-probe.mjs <label>`, writing per-label (never overwriting) to
`docs/sessions/evidence/task767/homepage-runtime.<label>.json` plus a PNG per cell in the same folder.

**Contract**

- Reads `BASE_URL` from the environment, defaulting to `http://127.0.0.1:3000`.
- Navigates to `${BASE_URL}/en` in four contexts with **pinned** viewports: **320×812, 640×900, 768×1024, 1024×900**.
  640 is mandatory — it is the only sampled width in the `sm` tier (§3.7).
- Per cell, resolves the hero `h1` (`main h1`, the first one) and **its sibling subtitle** by DOM relationship — not
  by a class name, which this task does not control — and the hero search container (the `.hero-search` element).
  Records computed `fontSize`, `lineHeight`, `fontWeight` for the two text nodes; computed `maxWidth`, `width` and
  `getBoundingClientRect()` for the search container; and a full-page screenshot.
- Also records, per cell, the resolved custom-property name behind each measured value where it can be read
  (`getComputedStyle(el).getPropertyValue('--homepage-runtime-font-size-3xl')` and the `style` attribute Mantine
  emitted), so the post-edit run positively shows a project-owned source rather than a Tailwind-emitted one.
- **Fails closed:** a non-OK response, a missing selector, a `<nextjs-portal>` element (meaning `next dev` was used by
  mistake — recorded by `check-click-shield.mjs:1031-1037`), or a viewport it could not set, writes what it measured
  and exits non-zero.

**Sequence — both runs required; the pre-edit run must happen before any source edit**

```powershell
node.exe -p process.platform          # must print win32
npm.cmd run build                     # pre-edit production build, clean tree at the 766 merge commit
Start-Process npm.cmd -ArgumentList 'run','start'
node.exe scripts/task767-homepage-runtime-probe.mjs pre-edit
# stop the server, apply §5, then:
npm.cmd run build
Start-Process npm.cmd -ArgumentList 'run','start'
node.exe scripts/task767-homepage-runtime-probe.mjs post-edit
```

Stop the server after each capture. If a port other than 3000 is used, pass it via `BASE_URL` and record the exact
value. **Storybook cannot substitute for this route proof** — `page.tsx` has no story and none may be created.

### 13.2 Story evidence — what proves the other five surfaces

1. **Pixel proof.** Run `npm.cmd run build-storybook` + `npm.cmd run screenshots:assert` **before** the edit, preserve
   `.screenshots/rendered-assert` (copy it aside — the next run overwrites it), then run both again after. Compare
   per-file MD5 for the six stories' cells — `320/375/390/1024 × sq/en/uk/it`, plus HeroSearch's `band-700`. Every
   cell must be **byte-identical**. This is the same evidence path Task 766 Revision 1 used to produce its 32/32
   result, and it is the only standing harness that renders these stories at all.
2. **Computed-style proof.** The MD5 comparison shows *no pixel moved*; AC4 additionally wants the *values*. Capture
   `fontSize` / `lineHeight` / `fontFamily` / `borderRadius` / `maxWidth` per §3.8 row from the **built** Storybook,
   pre and post, with an **ephemeral, non-repo** Playwright script (the pattern Task 766 used and documented in its
   session log §5). Delete it afterwards; it gets no `package.json` entry and is not committed. If you prefer to
   persist it, it must be named `task767-*` and live under `scripts/` with retained output — do not leave an
   unregistered script behind either way.
3. **1440 is not covered by the standing matrix** (§3.6). If the reviewer wants a 1440 story cell, capture it with the
   same ephemeral script and label it as such — do **not** add a width to `MANTINE_VIEWPORTS`, which would inject an
   unvetted cell into ~40 unrelated stories (the reason `MANTINE_STORY_EXTRA_VIEWPORTS` exists).

**Comparator.** For "nothing rendered differently", the tolerance for MD5-changed cells is governed by
`docs/storybook-governance.md` §14.11 (D26). Do not invent a per-task pixel tolerance.

## 14. Stop conditions

Return `BLOCKED` — do not improvise — if any of these hold:

1. The §10.0 `--report` run does not read exactly 20 pairs / 26 references over exactly the seven files and twenty
   properties of §3.1. An extra hit is a re-scope, never silent extra work.
2. `process.platform` is not `win32`, or a required command cannot run natively.
3. `--radius` classifies as `tailwind` rather than `project` (i.e. §3.3's deprecated-block reasoning does not hold on
   the installed Tailwind version). Do **not** invent a `--homepage-runtime-radius-lg` token to route around it —
   that is an architecture choice this task is not authorised to make.
4. Any consumer's computed value differs after the rename — meaning the old and new declarations are not equivalent.
   Report the measured pair; do not adjust the new token's value to chase a match.
5. A required state cannot be rendered from the six canonical stories, or the route probe cannot reach `/en`
   (`npm.cmd run start` will not serve, a selector is missing, the response is not OK). §3.6/§3.9 measured that all of
   them can be, so this firing is itself evidence the baseline drifted.
6. Emptying the baseline cannot be reached without adding an exemption, a marker, or a row — anywhere, at any point.
7. The TypeScript compiler API cannot express the object-literal traversal §6 requires without also reading
   `className`, or a third TSX file turns out to hold a live runtime reference.
8. The pre-edit probe run or the pre-edit `screenshots:assert` baseline was missed and source has already been edited.
   The baseline is unrecoverable without a `git stash`, which is owner-only — stop and hand back.
9. `git status` is not clean at the Task 766 merge commit — including the case where 766's work is still uncommitted
   (§3.10). This task must not be executed on top of another task's pending tree.

## 15. Completion report contract

Report status as `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. **Never
self-approve.** Include:

1. Files changed (table matching the real diff) and requirement IDs completed.
2. The **20 → 0 / 26 → 0** census: the §10.0 `--report` run and the final run, both pasted in full, with the six
   `runtime-tsx` rows visible in the first.
3. The committed baseline file's content, and the `git diff` of it.
4. A per-name `grep` showing each of the twelve new tokens declared exactly once, with the `:root` line numbers.
5. Baseline vs post computed-style table for every §3.8 row marked *changed*, per story and per state, plus the
   `AuthSheet` `borderRadius` pair.
6. The four `--verify-gate` exit codes with their transcripts, and `git status --porcelain` proving no plant reached
   the real worktree.
7. Both §13.1 probe artifacts, the `BASE_URL`, the four pinned viewports, and a cell-by-cell diff of `fontSize` /
   `lineHeight` / `fontWeight` / `maxWidth`.
8. The `screenshots:assert` MD5 comparison for the six stories' cells, stated as `n/n identical` with the
   denominator derived from the actual run, not assumed.
9. Every command from §13 with platform, Node version, exact command and actual exit code — including the real code
   for any command whose shell summary differs.
10. Exact `git status --short` and `git diff --stat` at the end, plus the `@theme inline` byte-identity check.
11. An explicit list of what was **not** touched (§8).
12. Assumptions, deviations, known limitations, unresolved issues, and the evidence a reviewer will need.
13. A concise `docs/backlog.md` state update and a `docs/sessions/` log with a Files Changed table matching the real
    diff. Do not write history into the backlog.

**Do not run, emit, or suggest any mutating git command.** Committing and pushing is owner-only.

---

## Task quality gate — checked before publication

- A fresh Sonnet session can execute this without hidden chat context — yes; every path, line number, token value and
  story id is in §3 and re-measured by §10.0.
- Every primary requirement has a binary AC and a verification method — R1→AC1, R2→AC2, R3→AC3, R4/R5→AC4/AC7,
  R6→AC9, R7→AC5, R8→AC6, R9→AC7, R10→AC8, R11→AC9, R12→AC10.
- Scope names what must not change — §8, AC9.
- UI publication checks — current/legacy boundary (§1), QA profile (§13), source map (§3.8), canonical decision
  record (§3.9), preservation classifications (§3.8) all explicit and evidenced.
- Permanent-story gate — zero additions; all six stories read in source and confirmed auto-discovered by the standing
  Mantine gate; the one state with no story (the route hero) gets a probe, not a story.
- Negative flows selected by applicability, not copied (§10) — reduced motion is marked **not applicable** here
  because no motion token is in scope, unlike Task 766 where it was.
- **Every acceptance criterion has a command that can actually observe it.** Two corrections were required to make
  that true, and both are recorded in CONFLICTS rather than softened: the route probe gained a 640-wide cell, and the
  story evidence path moved from `screenshots:responsive:storybook` (which renders none of these stories) to
  `screenshots:assert` plus an ephemeral computed-style capture.
- The requested control proves changed behaviour — §6 requires three executed planted failures **and** a clean
  control run, in a copied tree, with real exit codes.
- No owner-only exception is asserted. D65-A and D65-D stay open and out of scope; D65-D does not block this task
  (it blocks 768).

### FACTS

Twenty `(file, property)` pairs and twenty-six live references at the exact lines in §3.1, re-measured 2026-08-25 and
matching the Sprint 63 count carried into Sprint 65. The existing baseline holds exactly those first fourteen rows.
`--text-*` and `--font-mono` are declared in `globals.css`'s `@theme inline` at `:110` and `:175-192` with the values
in §5.1; `--container-3xl` is declared **only** in `node_modules/tailwindcss/theme.css:341` (`48rem`) and nowhere in
this repository. `--radius-lg: var(--radius)` at `globals.css:99`; `--radius: 0.75rem` at `:459`; Tailwind's own
`--radius: 0.25rem` sits inside its `/* Deprecated */` block at `theme.css:502-509`, which the gate's
`stripDeprecatedBlocks()` removes — so `--radius` classifies `project`. The detector is 430 lines, module-CSS only,
`{ file, property }` schema, both-directions baseline, three-bucket fail-closed classifier, no CLI modes, no line
numbers. Outside the two in-scope TSX files, the only TSX `var()` hits on Tailwind-owned runtime names are four
`--radius-md` uses inside `className` class strings in `src/components/ui/button.tsx`; stories have zero. All six
proof stories exist with the titles/exports in §3.6 and are auto-discovered by `check-stories-rendered.mjs` at
320/375/390/1024 × sq/en/uk/it, HeroSearch additionally at 700; `responsive-screenshots.mjs` drives 28 fixed ids and
none of them is `mantine-`-prefixed. `.storybook/preview.tsx:19` imports `globals.css`. Project breakpoints are
`sm 640` / `md 768` / `lg 1024` / `xxl 1440`. `npm run start` = `next start`. At measurement time Task 766 was
approved but uncommitted, with the working tree still holding its changes.

### INFERENCES

That the `@theme inline` line-height overrides (absolute rems) and Tailwind's own unitless ratios compute to the same
pixel values at the paired font sizes is arithmetic, not a measurement — which is exactly why AC4 requires the
computed `lineHeight` string to be captured and compared rather than argued.

That `--radius` will still classify `project` on the executor's installed Tailwind version follows from the shipped
`stripDeprecatedBlocks()` behaviour and the deprecated-block position read today; §14.3 makes a different result a
stop condition rather than a judgement call.

### UNKNOWNS

Whether the TypeScript compiler API traversal §6 specifies stays free of false positives across both TSX files' full
attribute sets — measured only for the six known sites. The `--verify-gate` plants are the intended answer; §14.7
covers the case where it cannot be done without widening the scan.

The exact `n/n` denominator of the `screenshots:assert` MD5 comparison, which depends on the story count discovered
from the built index at run time. §15.8 requires it derived from the actual run.

### CONFLICTS

Three defects in the Codex-tasks candidate draft (`Codex-tasks/Task_767_Homepage_Runtime_Token_Exit.md`), corrected
here rather than carried forward:

1. **`--font-mono` was transcribed without quotes** (`Liberation Mono, Courier New`). The declaration at
   `globals.css:110` quotes both multi-word families. §5.1 requires a verbatim copy.
2. **The route probe's viewports could not observe its own required reading.** The draft asked for
   `320 / 768 / 1024` and for "title 30/36/48px", but 36px is the `sm` tier (640-767) and none of those widths lands
   in it. §13.1 adds **640×900**.
3. **The story-evidence path named a command that renders none of these stories.** The draft said the generic
   screenshot command "does not include all of them"; measured, its 28-id list includes **none** of them. §13.2
   routes story proof through `screenshots:assert` (which auto-discovers all six) plus an ephemeral computed-style
   capture, and drops the unreachable 1440 story width from the standing claim.

**Number.** Filed as **767** per the sprint's strict 766→767→768→769 sequence. `docs/backlog.md` notes that Task 766's
**F1** follow-up (CI wiring + `--verify-gate` for `check:homepage-literal-utilities`) competes for the same next free
number; the owner's decision at filing time was that 767 is this task and F1 takes a later number. Note that §6 of
this task delivers `--verify-gate` for the *runtime-token* gate only — F1's own gate is untouched (§8).

**Owner decisions still open, neither blocking here:** **D65-A** (`PerfDevOverlay` in the production exit criterion)
and **D65-D** (`AppImage.module.css`'s one `var(--space-0)` reference), which blocks the filing of Task 768.
