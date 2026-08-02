# Task 706 — De-hybrid `HeaderView`: Mantine + a colocated CSS module, at zero rendered delta and 28 → 23 tokens

**Sprint:** 47 (`tasks/Sprints/Sprint_47_Layout_Shell_DeHybrid.md`). **Epic:** MM Phase-2.

---

## 1. Mode and task type

- **Mode:** implementation (Sonnet executor, via `.claude/skills/execute-task/SKILL.md`).
- **Primary task type:** UI migration — **legacy-utility removal on an already-Mantine surface**
  (`docs/rule-index.md` → "UI / Layout / Component" → **Current Mantine path**).
- **Secondary types:** Storybook / visual proof (enrolled at `scripts/mantine-migration-scope.json:2`);
  **critical flow** (`docs/critical-flow-registry.md` — *Authenticated header hydration*, Task 599/601);
  design-token debt burn-down (28 → 23).
- **Origin:** D29 split Task 673 footer-first and reserved `HeaderView` as **706**. 673 landed on 2026-08-02
  (`135e864e7`, `APPROVED WITH NOTES`) and established the module pattern this task copies.

> **Read this first.** Zero rendered change, exactly as in 673 (**D28**). This is a mechanism swap. The one
> intentional measurable change is `check:design-tokens` **28 → 23**, and it happens only because the five
> `min-[390px]` arbitrary utilities move into a module media query — **the rendered result of that move must still
> be pixel-identical**. If you cannot reproduce a value exactly, **stop and report**; do not approximate and do not
> "improve".

---

## 2. Objective

1. Remove every raw Tailwind utility class from `src/components/layout/HeaderView.tsx` — **11** `className=` sites —
   replacing them with Mantine style props where a prop exists and a **new colocated `HeaderView.module.css`**
   where one does not (**D28**, the Task 688 D16 pattern, as executed by 673).
2. Move the **five `min-[390px]` arbitrary-value utilities** (`:110` ×3, `:128` ×2) into a module
   `@media (min-width: 390px)` rule, taking `check:design-tokens` from **28 to 23** with **zero** visual delta.
3. Preserve the rendered output **byte-for-byte**: every enrolled cell of `Mantine/Primitives/HeaderView/Default`
   keeps its current PNG md5 and its current verdict.
4. Preserve the P0 hydration contract and the three live `.site-header` consumers, including Task 684's measured
   **97 / 97 / 65 / 65** header-height invariant.

**Non-goals stated as objectives so they are not silently attempted:** no visual value, token, spacing or typography
change; no removal or addition of `unstyled`; no change to `Header.tsx`, the sub-primitives, the story, the theme,
or `globals.css`.

---

## 3. Verified context

Every fact below was read or executed in the worktree on branch `task/q0-ci-rendered-locale-split` on **2026-08-02**,
at HEAD `135e864e7`. Nothing is inferred from a filename, a prior report, or a semantic-search hit.

### 3.1 Owner decisions

| ID | Ruling | Scope |
|---|---|---|
| **D28** (2026-08-01) | **Mechanism-only, zero visual delta.** Keep `unstyled` where present. Utilities → Mantine style props where a prop exists, colocated `.module.css` otherwise. No restyle, no token change. | Binds 673 and 706 |
| **D29** (2026-08-01) | **Split, footer first.** 673 = `FooterView`; `HeaderView` = 706. | Binds 673 and 706 |
| **D30** (2026-08-02, this task) | **The five `min-[390px]` violations are in scope for 706.** Moving them into the module's own media query is a mechanism change with zero visual delta, so it does not conflict with D28; `check:design-tokens` therefore ends at **23**, not 28. | Binds 706 |
| **D16** (Task 688, 2026-07-29) | "Mantine style props where a prop exists; a colocated `.module.css` for everything a prop cannot express (gradients, `:hover`, …)." | The mechanism D28 points at |
| **D6** (Task 684, standing) | `.screenshots/` evidence is local-only per `.gitignore:55`. Reference by path; it will not appear in `git status`. | Evidence handling |
| **D26** (`docs/storybook-governance.md` §14.11) | The rendered-matrix comparator and its sub-perceptual tolerance. **Do not invent a per-task pixel tolerance.** | AC4 comparator |
| **D3** (Task 684, 2026-07-29) | `Notifications top={{ base: 97, sm: 65 }}` is the measured `header.site-header` height at the `MANTINE_VIEWPORTS` widths. | The AC8 invariant's source |

### 3.2 The file as it stands — read at source

`src/components/layout/HeaderView.tsx`, **190 lines**. It is a **client component** (`'use client'`, `:1`), rendered
by the `Header` container, and it calls `useTranslations`/`useLocale` only (i18n, allowed in a presentational
primitive). `NavLinks` (`:25-50`) is deliberately declared **at module level**; the comment at `:14-24` records why —
declaring it inside the render body creates a new component type per render, shifting React's fiber-ID counter and
breaking `useId()` parity during hydration.

**Unlike `FooterView`, this file contains ZERO raw HTML elements.** Task 629 already converted every text/link node
to a Mantine primitive carrying `unstyled` (rationale at `:101-109`: `@mantine/core/styles.css` ships unlayered, so
its own classes beat any Tailwind `@layer utilities` class regardless of source order). **This task is therefore a
class-level de-hybrid only** — objective 2 of Task 673 has no analogue here. The single non-Mantine element is the
lucide `<Menu>` SVG at `:173`.

**All 11 `className=` sites** (`grep -c 'className=' src/components/layout/HeaderView.tsx` → **11**):

| # | Line | Element | Current value | Disposition |
|---:|---:|---|---|---|
| 1 | `:34` | `<Anchor unstyled component={Link}>` (NavLinks → home) | `text-sm font-medium text-foreground/80 hover:text-foreground transition-colors` | → module `.navLink` (+ `:hover`), **shared with #2** |
| 2 | `:43` | `<Anchor unstyled component={Link}>` (NavLinks → listings) | *(identical to #1)* | same shared class |
| 3 | `:89` | `<Box component="header">` | `site-header sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60` | **`site-header` preserved verbatim**; rest → module `.header` incl. the `@supports` block |
| 4 | `:110` | `<Group unstyled>` | `container-wide flex flex-wrap min-[390px]:flex-nowrap items-center justify-between gap-2 py-2 min-[390px]:h-16 min-[390px]:py-0` | **`container-wide` preserved verbatim**; rest → module `.bar` + `@media (min-width: 390px)` — **3 of the 5 token violations die here** |
| 5 | `:112` | `<Anchor unstyled component={Link}>` (logo) | `flex items-center gap-1 font-bold text-xl` | → module `.logo` |
| 6 | `:113` | `<Text unstyled component="span">` | `text-primary` | → module `.brandPrimary` |
| 7 | `:114` | `<Text unstyled component="span">` | `text-foreground` | → module `.brandForeground` |
| 8 | `:120` | `<Group unstyled visibleFrom="md">` | `flex items-center gap-6` | → module `.desktopNav` |
| 9 | `:128` | `<Group unstyled>` | `flex items-center w-full justify-between gap-2 min-[390px]:w-auto min-[390px]:justify-start` | → module `.rightCluster` + `@media (min-width: 390px)` — **the other 2 violations die here** |
| 10 | `:151` | `<Group unstyled visibleFrom="md">` | `flex items-center gap-2` | → module `.userMenuSlot` |
| 11 | `:173` | `<Menu>` (lucide SVG) | `h-5 w-5` | **measure, then decide** (§5.2): lucide `size` prop vs a module class |

**Two classes are NOT Tailwind utilities and must survive verbatim:**

- `site-header` (`:89`) — the DOM marker, with **three live consumers** (§3.3).
- `container-wide` (`:110`) — the project-canonical global class at `src/app/globals.css:634-644`
  (`max-width:88rem`, auto margins, a 3-step padding ramp at 640/1024/1536px). Not reproducible as a Mantine prop
  and must not be inlined.

**`unstyled` is load-bearing on every `Group`/`Anchor`/`Text` here.** `Group unstyled` in particular strips Mantine's
own `display:flex`, which is exactly why `flex` appears explicitly in `:110`, `:120`, `:128`, `:151`. When those
chains move into the module, the module **must** re-declare `display:flex` — dropping it silently collapses the
header to block layout.

### 3.3 `.site-header` has three live consumers — census, not assumption

`grep -rn "site-header" src scripts .storybook` returns its declaration plus three real readers:

| Consumer | Line | What it reads | Break mode if the marker moves or the geometry changes |
|---|---|---|---|
| `scripts/check-header-id-parity.mjs` | `:147` | `const TARGET_SELECTOR = '.site-header [aria-haspopup="menu"]'` | The gate silently matches 0 elements and reports a vacuous pass |
| `src/design-system/mantine/MantineRootProvider.tsx` | `:34` | Comment documenting the **measured `header.site-header` height** that feeds `<Notifications top={{ base: 97, sm: 65 }} />` (Task 684 **D3**) | A 1px header height change misplaces **every** Mantine notification app-wide |
| `scripts/task612-qa-listinggallery-lightbox-portal.mjs` | `:57` | `document.querySelector('.site-header')` | The lightbox z-index QA probe loses its reference element |

This is the exact opposite of `.site-footer`, which Task 673 proved has **zero** consumers — and it is why 706 is the
harder half of D29.

### 3.4 Gate exposure — measured, not assumed

| Gate / registry | `HeaderView` exposure | Evidence |
|---|---|---|
| `docs/critical-flow-registry.md` | **P0 — *Authenticated header hydration — NotificationBell SSR shell*** (row 33, Task 599). Authoritative regression: `src/components/layout/__tests__/header-hydration-id-parity.test.tsx`, a deterministic jsdom `renderToString`→`hydrateRoot` harness asserting on React's `onRecoverableError` (planted-violation proven 3/3). | read 2026-08-02 |
| `check:design-tokens` | **5 violations, all `HeaderView.tsx`:** `:110` ×3 and `:128` ×2, each `[length:arbitrary px/rem utility] "min-[390px]"`. Live `--strict` total is **28**. | live run 2026-08-02 |
| `check:design-tokens` on `.css` | The scanner **does** collect `.css` (`scripts/check-design-tokens.mjs:438`, `collectFiles(srcDir, ['.tsx','.ts','.css'])`), but every `.css` finding in the live run is a **colour** rule (`FavoriteButton.module.css` ×9, `SaveToCollectionButton.module.css` ×2 — hex / `rgba(` / colour function). **No `.css` file produces a `length:` finding** — `input-chrome.css` carries `1px`/`3px` and `FooterView.module.css` carries `3.5rem`/`13.75rem` with zero findings. A module `@media (min-width: 390px)` is therefore clean **provided every colour is `var(--*)`**. | live run + read 2026-08-02 |
| `check:header-id-parity` / `test:header-hydration-id-parity` | **Both applicable** (they target `.site-header`). Scripts: `node scripts/check-header-id-parity.mjs` and `vitest run src/components/layout/__tests__/header-hydration-id-parity.test.tsx`. | `package.json`, read 2026-08-02 |
| `scripts/mantine-migration-scope.json` | **Enrolled** at `:2`. Membership must not change. | read 2026-08-02 |

**`check:design-tokens` must read exactly 23 after this task** — 28 minus HeaderView's 5, with **no** new entry for
`HeaderView.tsx` or `HeaderView.module.css`. 22 or 24 is a defect in either direction.

### 3.5 Story and rendered-proof path

`src/stories/mantine/primitives/HeaderView.stories.tsx` — title `Mantine/Primitives/HeaderView`, a **single**
`Default` story, `layout:'fullscreen'`, `skipCanvas:true`. It imports the **real production component** and renders
**two instances stacked** — guest (`isAuthenticated={false}`, `user={null}`, `notificationSlot={undefined}`) and
authenticated (`user={{name:'Alba Krasniqi', avatar_url:null, role:'user'}}` + a bell placeholder). Both keep
`mobileOpen={false}` and `authSheetSlot={null}`. Plain props, no mock, no module alias, no Supabase.

`HeaderView` is **not** in `MANTINE_OVERLAY_PRIMITIVES` (`scripts/check-stories-rendered.mjs:356-358`), so the
harness renders it inline with no scripted open-trigger click.

**Enrolled viewports = the default `MANTINE_VIEWPORTS` set only** — `320 / 375 / 390 / 1024`
(`scripts/check-stories-rendered.mjs:392-397`). `HeaderView` has **no** entry in
`MANTINE_STORY_EXTRA_VIEWPORTS` (`:417-444` holds only `HeroSearch`, `ListingDetailPattern`, `HomeSection`,
`PopularLocationsView`). With 4 locales that is **16 cells** — and because the story stacks both fixtures, each cell
proves the guest **and** the authenticated composition at once.

**Why 4 widths is sufficient here, and how to keep it honest.** The file uses exactly two breakpoints: the custom
**390px** (`:110`, `:128`) and Mantine's **`md`** (768px, via `visibleFrom`/`hiddenFrom`, which this task does not
touch). The enrolled set straddles the 390 boundary on both sides (375 < 390 ≤ 390 < 1024) and the `md` boundary
(390 < 768 < 1024). **AC7 turns this into an assertion:** the new module introduces no `@media` breakpoint other
than the reproduced `min-width: 390px`. If you believe you need another one, the enrolled set is wrong — stop and
report; do not add a width yourself.

### 3.6 Token provenance for the values in play

Every colour utility resolves through `src/app/globals.css`:

| Utility | Variable | Declared |
|---|---|---|
| `text-foreground`, `text-foreground/80` | `--foreground` → `--neutral-900` | `:368` |
| `text-primary` | `--primary` → `--brand-700` | `:379` |
| `border-b` | `--border` → `--neutral-200` | `:396` |
| `bg-background/95`, `supports-[backdrop-filter]:bg-background/60` | `--background` → `--neutral-50` | `:367` |

The module must consume these **variables**, never their hex values (D27's "token not hex" discipline).
`/80`, `/95` and `/60` are Tailwind v4 opacity modifiers and compile to a `color-mix(...)` expression — **measure the
compiled value, do not compute it** (§9, I2). The same applies to `z-30`, `backdrop-blur`, `gap-2`, `gap-6`,
`py-2`, `h-16`, `text-xl` and both `transition-colors` triples. `globals.css:264-266` records that **no `--z-*`
named tokens exist**; `z-30` is the numeric core utility and its measured value is what the module reproduces.

### 3.7 Reference implementation to copy

`src/components/layout/FooterView.module.css` (Task 673, committed `135e864e7`) is the convention this task
inherits — a header comment naming what was reproduced and the capture that verified it, `var(--*)` for every
colour, and `:hover`/`transition` **in the module, never as an inline `style`** (an inline `style` attribute
unconditionally beats an external stylesheet rule for the same property and permanently blocks the module's own
`:hover` — proven by `FavoriteButton.tsx`, Task 653).

Sites #1/#2 carry `hover:text-foreground transition-colors`; they therefore **must** land in the module.

**Two review notes carried over from 673, binding here:**

- **Prop before module.** 673 put `py-12` into its module although a `py` prop exists, while `mt-12`/`pt-6` became
  `mt`/`pt` props — an inconsistency flagged at review. In 706 the rule is explicit: **if a Mantine style prop
  expresses the value on its own, use the prop**; the module holds only what a prop cannot express.
- **`visibleFrom` is not a `display` substitute.** 673 replaced `hidden sm:block` with `visibleFrom="sm"`, which is
  equivalent only because the parent was a flex container. This task does **not** touch the existing
  `visibleFrom`/`hiddenFrom` props — do not add, remove, or "normalise" any of them.

### 3.8 Worktree state at design time — clean

`git status --porcelain` at HEAD `135e864e7` on 2026-08-02, **before** any write in this session: **empty**.
Task 673's four paths were committed by the owner immediately before this design session. There is no dirty-tree
manifest to reconcile and no double-attribution risk. **Re-verify this yourself before your first edit** — if your
own `git status --short` is not empty at session start, snapshot it and reconcile against that snapshot instead.

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | D28, §3.2 | `HeaderView.tsx` contains **zero** Tailwind utility classes. Every surviving `className=` is `styles.*`, `cn(styles.*)`, or the verbatim string `site-header` / `container-wide`. | P0 | AC1 |Confirmed|
| R2 | §3.2, Task 629 | Every existing `unstyled` prop survives; no Mantine primitive loses it and no raw HTML element is introduced. The rendered tag of each migrated node is unchanged. | P0 | AC2 |Confirmed|
| R3 | D28, §3.7 | A new `src/components/layout/HeaderView.module.css` exists, consumes `globals.css` variables (never hex), holds the `:hover`/`transition` pair and the reproduced `@supports (backdrop-filter: …)` block, and carries a header comment naming the capture that verified it. | P0 | AC3 |Confirmed|
| R4 | D26, §3.5 | All **16** enrolled cells keep their pre-task PNG md5 **and** verdict. | P0 | AC4 |Confirmed|
| R5 | §3.2, §3.3 | `site-header` and `container-wide` survive byte-identically, and `.site-header [aria-haspopup="menu"]` still matches the LocaleSwitcher/UserMenu triggers. | P0 | AC5 |Confirmed|
| R6 | D30, §3.4 | `check:design-tokens` totals **23**, with **no** entry for `HeaderView.tsx` or `HeaderView.module.css`. | P0 | AC6 |Confirmed|
| R7 | §3.5 | The module introduces no `@media` rule other than the reproduced `min-width: 390px`. | P1 | AC7 |Confirmed|
| R8 | Task 684 D3, §3.3 | `header.site-header` rendered height is unchanged at all four enrolled widths and still equals **97 / 97 / 65 / 65** px at 320 / 375 / 390 / 1024. | P0 | AC8 |Confirmed|
| R9 | critical-flow row 33 | `npm run test:header-hydration-id-parity` passes, `'use client'` is retained, and `NavLinks` stays declared at module level. | P0 | AC9 |Confirmed|
| R10 | agent-contract cl. 9 | `npm run build` exits 0. | P0 | AC10 |Confirmed|
| R11 | §9 I4 | The visual comparator is shown to be capable of failing (two-armed plant + pre-plant census). | P0 | AC11 |Confirmed|
| R12 | agent-contract cl. 14 | Touched files stay UTF-8 without BOM, no mojibake. | P2 | AC12 |Confirmed|

---

## 5. Assumptions and open questions

### 5.1 Stated assumptions

- **A1.** Mantine `Group`/`Anchor`/`Text` accept `unstyled` and forward `className`. Evidenced by this very file
  already shipping it in production since Task 629 (`:110-114`, `:120`, `:128`, `:151`).
- **A2.** `@mantine/core`'s CSS is **unlayered**, so its own classes beat any Tailwind `@layer utilities` class
  regardless of source order — which is why `unstyled` is load-bearing, not decorative (`:101-109`, Task 629). A
  CSS-module class is subject to the same cascade: keep `unstyled`, and the module wins because nothing competes.
- **A3.** `min-[390px]:` has **no** entry in `src/design-system/mantine/theme.ts` breakpoints
  (`xs:'20em'` 320 · `sm:'40em'` 640 · `md:'48em'` 768 · `lg:'64em'` 1024 · `xl:'80em'` 1280 · `xxl:'90em'` 1440,
  `:163-170`). It is a one-off arbitrary value, which is exactly why the token scanner flags it and why the module
  media query is its correct home. **Do not add a 390px breakpoint to the theme** — that changes every consumer.

### 5.2 The lucide icon at `:173` — decide by measurement, then record

`<Menu className="h-5 w-5" />` is the file's only non-Mantine element. `lucide-react` exposes a `size` prop that
writes the SVG `width`/`height` **attributes**, whereas `h-5 w-5` sets **CSS** `width`/`height: 1.25rem`. They agree
only while the root font-size is 16px, and they differ in cascade behaviour. **Measure the compiled result first**
(§9, I2). If `size={20}` reproduces the captured box exactly, use the prop (§3.7's "prop before module" rule); if it
does not, use a module class. **Record which and why** — this is a documented in-task choice, not an open question.

### 5.3 Nothing is left ambiguous for the executor

There is no unresolved owner decision in this task. D28, D29 and D30 close all three that existed.

---

## 6. Pre-read rule bundle

Read exactly these. Do not read all docs.

**Always required:** `docs/agent-contract.md` · `docs/rule-index.md` · `docs/qa-profiles.md` · `docs/backlog.md` ·
`docs/critical-flow-registry.md` (**row 33 in full** — this task is inside it).

**Current Mantine path:** `docs/mantine-responsive-design-system.md` · `docs/tailadmin-style-reference.md` ·
`docs/component-rules.md` · `docs/ui-rules.md` (routing/legacy-boundary notes only) · `docs/qa-rules.md`.

**Because the surface is story-enrolled:** `docs/storybook-governance.md` **§14.11 (D26)** and §14.9.17.

**Task-specific sources:** this file · `tasks/Sprints/Sprint_47_Layout_Shell_DeHybrid.md` ·
`tasks/Sprints/Sprint_47_kickoff_prompt_Task_673_FooterView_DeHybrid.md` (the pattern being inherited) ·
`docs/sessions/2026-08-01-task673-footerview-de-hybrid.md` (its evidence shape, including the review addendum) ·
`src/components/layout/FooterView.module.css` (the reference output).

---

## 7. Scope

- `src/components/layout/HeaderView.tsx` — all 11 `className=` sites.
- `src/components/layout/HeaderView.module.css` — **new**.
- Nothing else.

---

## 8. Out of scope

- `src/components/layout/Header.tsx` — the container's state, hooks and prop wiring are unchanged.
- The sub-primitives rendered inside the header: `LocaleSwitcher`, `HeaderActions`, `UserMenu`, `MobileNavDrawer`,
  `NotificationBell`, `AuthSheet`. Each owns its own styling; a diff in any of them is a signal that scope leaked.
- `src/stories/mantine/primitives/HeaderView.stories.tsx` — it already renders the real component with plain props.
  **Change it only if a prop signature changes, which it must not.**
- `src/design-system/mantine/theme.ts` (no new breakpoint, A3) · `src/design-system/mantine/MantineRootProvider.tsx`
  (its 97/65 pair is an invariant to **preserve**, not to edit) · `scripts/mantine-migration-scope.json` membership ·
  the enrolled viewport set (§3.5) · `globals.css`.
- Removing `site-header`, or "cleaning up" any of its three consumers (§3.3).
- Any TailAdmin restyle, token, spacing or typography change (D28), and any change to the existing
  `visibleFrom`/`hiddenFrom` props (§3.7).

---

## 9. Current and required behavior

**Current:** `HeaderView` is a Mantine/Tailwind **hybrid at the class level** — Mantine `Box`/`Group`/`Anchor`/
`Text`/`ActionIcon` supply the mechanism and every one of them carries `unstyled` (Task 629), while 11 verbatim
Tailwind utility chains supply 100% of the visual styling. Five of those utilities are `min-[390px]` arbitrary
values that `check:design-tokens` flags.

**Required after:** identical rendered output at every enrolled cell; zero Tailwind utilities; all `unstyled` props
intact; all visual values in `HeaderView.module.css` (consuming `globals.css` variables) or in genuine Mantine style
props; the 390px behaviour reproduced as a module media query; `site-header` and `container-wide` unchanged;
`check:design-tokens` at 23; the 97/65 height invariant and the hydration gate both still green.

### Implementation sequence

- **I1 — Baseline first, before any edit.** Capture the current `--mantine-only` rendered run for
  `Mantine/Primitives/HeaderView/Default` (16 cells) and persist the PNG md5 list. Record `check:design-tokens`
  (expect **28**), `npm run test:header-hydration-id-parity` (expect pass), and `git status --porcelain`
  (expect empty, §3.8). **A baseline captured after an edit is not a baseline.**
- **I2 — Measure, do not compute.** With the story rendered, take a live `getComputedStyle` capture of all 11 sites'
  elements **at 320, 375, 389, 390 and 1024** — 389/390 straddle the custom breakpoint and are the only way to prove
  the media query lands on the same pixel. This capture is the source of truth for every value written into the
  module, including the `/80`, `/95`, `/60` colour-mix results, `z-30`, `backdrop-blur`, `h-16`, and both
  `transition-colors` triples. **Also capture `.site-header`'s `getBoundingClientRect().height` at 320/375/390/1024
  (expect 97/97/65/65).** If the pre-edit height does not equal 97/97/65/65, **stop and report** — that means
  `MantineRootProvider.tsx:34` is already stale and it is a finding, not something to fix here. Persist the capture.
- **I3 — Migrate**, site by site in the §3.2 table order. Share one class between #1/#2. Re-declare `display:flex`
  wherever an `unstyled` `Group` relied on it (§3.2).
- **I4 — Prove the comparator can fail (two-armed plant).** See AC11.
- **I5 — Re-run** the full evidence set and diff against I1.

---

## 10. Implementation requirements

1. **Do not remove `unstyled` from anything, and do not add it to anything.** Per A2, the current set is exactly
   right; changing it in either direction changes the render.
2. **Re-declare what `unstyled` strips.** `Group unstyled` has no `display:flex` of its own — the module class must
   supply it for sites #4, #8, #9, #10.
3. **`:hover` and `transition` belong in the module** (§3.7) — never an inline `style`.
4. **Consume variables, not hex** (§3.6). A hex or `rgba(` literal in the module is a new `check:design-tokens`
   violation and breaks AC6.
5. **Prop before module** (§3.7): use a Mantine style prop when one expresses the value on its own; the module holds
   only what a prop cannot express (`:hover`, `@media`, `@supports`, `backdrop-filter`, the `color-mix` colours).
6. **Preserve `'use client'` (`:1`) and `NavLinks`' module-level declaration (`:25`).** Moving `NavLinks` into the
   render body reintroduces the exact Task 599/601 hydration bug (`:14-24`).
7. **Preserve the `@supports` branch.** `supports-[backdrop-filter]:bg-background/60` is a real conditional
   background — reproduce it as `@supports (backdrop-filter: blur(0px)) { … }`, not as an unconditional value.
8. **Preserve `aria-label={tc('aria_open_menu')}`, `hiddenFrom="md"`, `mih`/`miw="2.75rem"`** on the hamburger
   `ActionIcon` (`:165-174`) and every `visibleFrom="md"` on the Groups.
9. **Do not change the prop interface.** `HeaderViewProps` (`:52-69`) is consumed by `Header.tsx` and the story.
10. **Do not touch the sub-primitives or the slots** (`notificationSlot`, `authSheetSlot`) — they pass through
    unchanged.

---

## 11. Positive and negative flows

**Positive flow:** the `/[locale]` page renders `Header` → `HeaderView`; logo, desktop nav, locale switcher,
favorites/bell cluster, user menu (authenticated) or login/register (guest), and the mobile hamburger all render
exactly as before at all four locales and all four enrolled widths, in both the guest and authenticated fixtures.

| Branch | Applicable? | Owner / source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Guest vs authenticated | **Yes** | `isAuthenticated`/`user` props; both fixtures already exist in the story | Guest shows login/register via `HeaderActions` and no `UserMenu`; authenticated shows `UserMenu` (`:150-160`) and the bell slot | AC4 — every cell renders both fixtures stacked (§3.5) |
| Below the 390px wrap | **Yes** | Task 590 (owner 2026-07-13), `:90-100` | <390: logo on row 1, control cluster full-width on row 2 (`justify-between`); ≥390: single `h-16` row | AC4 cells at 320/375 vs 390/1024 + AC7/AC8 |
| Hydration (SSR ↔ client) | **Yes** | critical-flow row 33 (599/601); `'use client'`, `useId`-bearing Mantine menus | Zero recoverable hydration errors; `.site-header [aria-haspopup="menu"]` target ids identical server↔client | AC9 — `npm run test:header-hydration-id-parity` |
| Long localized strings (`uk`, `sq`) | **Yes** | `nav.home`/`nav.listings` + `LocaleSwitcher` label widths | No wrap or overflow change vs baseline | AC4 — `uk@320` and `sq@320` are mandatory cells |
| `notificationSlot` / `authSheetSlot` absent | **Yes** | `notificationSlot?`/`authSheetSlot?` optional (`:65-68`); the guest fixture passes `undefined`/`null` | Header renders with no orphan gap and no crash | AC4 guest fixture at all 16 cells |
| Mobile drawer open | **No** | Story fixes `mobileOpen={false}`; the open state is owned by `MobileNavDrawer.stories.tsx` (§3.5) and that component is out of scope | N/A | — |
| RTL | **No** | No RTL locale ships (`sq`/`en`/`uk`/`it`) | N/A | — |
| Authorization / RLS | **No** | Presentational, prop-driven, no data access | N/A | — |
| Concurrent writer / offline | **No** | No writes, no network | N/A | — |

---

## 12. Acceptance criteria

- **AC1 [R1]** Given the migrated `HeaderView.tsx`, when `grep -n 'className=' src/components/layout/HeaderView.tsx`
  runs, then **every** returned line's value is a `styles.*` reference, `cn(styles.*)`, or one of the two verbatim
  strings `site-header` / `container-wide` — and **no** line contains a Tailwind utility. Report the **actual** line
  count you observe; do not restate the pre-edit count of 11.
- **AC2 [R2]** Given the migrated file, when `grep -c 'unstyled'` and the rendered story DOM are inspected, then
  every primitive that carried `unstyled` before still carries it, none was added, no raw HTML element was
  introduced, and each migrated node's rendered tag name is unchanged.
- **AC3 [R3]** Given `src/components/layout/HeaderView.module.css`, when it is read, then it exists, contains the
  `:hover` rule from sites #1/#2, contains the reproduced `@supports (backdrop-filter: …)` block, references only
  `var(--*)` (and `color-mix(...)` over `var(--*)`) for colour, contains **zero** hex literals and zero `rgba(`,
  and carries a header comment naming what it reproduces and the I2 capture that verified it.
- **AC4 [R4]** Given the post-change `--mantine-only` run, when its 16 `HeaderView/Default` cells are compared
  against the I1 baseline under the `docs/storybook-governance.md` §14.11 (D26) comparator, then **PNG md5 and
  verdict are identical for all 16**. A changed cell is reported as a finding with per-cell attribution — it is not
  absorbed into a tolerance. **The official `npm run screenshots:assert -- --mantine-only` invocation must complete
  and its `manifest.json` must exist**; a proxy capture may corroborate it but may not replace it.
- **AC5 [R5]** Given the rendered DOM, when the `<header>` and its first `Group` child are inspected, then their
  class lists still contain `site-header` and `container-wide` byte-identically, and
  `document.querySelectorAll('.site-header [aria-haspopup="menu"]')` returns the same count as the pre-edit baseline.
- **AC6 [R6]** Given `npm run check:design-tokens`, when it runs, then the total is **23**, and the per-file
  breakdown lists **no** entry for `HeaderView.tsx` and **no** entry for `HeaderView.module.css`.
- **AC7 [R7]** Given `HeaderView.module.css`, when its `@media` rules are listed, then the only breakpoint present
  is `min-width: 390px` (or its exact `rem` equivalent as measured in I2).
- **AC8 [R8]** Given the rendered story, when `.site-header`'s `getBoundingClientRect().height` is measured at
  320 / 375 / 390 / 1024, then it equals the I1 pre-edit capture at every width **and** equals **97 / 97 / 65 / 65**.
  A mismatch is `BLOCKED`, not a note — `MantineRootProvider.tsx:34` depends on it.
- **AC9 [R9]** Given the migrated file, when `npm run test:header-hydration-id-parity` runs, then it passes; and
  when the file is read, `'use client'` is present at `:1` and `NavLinks` is still declared at module scope outside
  `HeaderView`'s body.
- **AC10 [R10]** Given the final state, when `npm run build` runs, then it exits **0**, and the actual transcript is
  recorded.
- **AC11 [R11]** Given the migrated component, when the **two-armed plant** below runs, then the comparator flips as
  specified in both arms.
  - *Pre-plant census (mandatory first):* prove that **nothing else** declares the planted property on the target
    element — no surviving Tailwind utility, no Mantine `unstyled` leak, no inline `style`. Quote the evidence.
    Without this, a lifeline can mask the plant and the arms prove nothing (the M4 failure mode).
  - *Arm A (must FAIL):* change the reproduced `gap` on `.bar` (site #4) to a different value. Re-run the 16 cells.
    **At least one cell's md5 must change** and the `getComputedStyle` equality must break. If nothing changes, the
    comparator is blind and the task is `BLOCKED` — not `IMPLEMENTED`.
  - *Arm B (must PASS):* revert the plant exactly. Re-run. All 16 cells identical to the I1 baseline again.
- **AC12 [R12]** Given the two touched files, when `npm run check:file-integrity` and `npm run check:mojibake` run,
  then both pass and the files are UTF-8 without BOM.

---

## 13. QA profile and verification plan

**Profile: `Q4` Release / Critical Flow.** `docs/qa-profiles.md` routes any change touching a
`docs/critical-flow-registry.md` entry to Q4, and §3.4 establishes by direct read that row 33
(*Authenticated header hydration — NotificationBell SSR shell*, Task 599/601) targets this exact component.
Q4 therefore adds **automated regression evidence for the critical flow** on top of Q3's full visual matrix.

**Not `Q3`:** 673 was Q3 precisely because §3.4 of its kickoff proved *no* registry row applied to the footer. That
argument does not transfer — the header has one.

**Proof path — the enrolled matrix is 16 cells** (4 widths × 4 locales, §3.5), each rendering both the guest and the
authenticated fixture.

| # | Command / step | Expected |
|---:|---|---|
| 1 | Rendered `--mantine-only` baseline for `HeaderView/Default`, **pre-edit** (I1) | 16 cells, md5 list persisted, `manifest.json` present |
| 2 | `npm run test:header-hydration-id-parity`, **pre-edit** | pass — the baseline for AC9 |
| 3 | Live `getComputedStyle` capture of all 11 sites at 320/375/**389**/390/1024, plus `.site-header` height (I2) | persisted; the module's source of truth; height reads 97/97/65/65 |
| 4 | `npm run check:design-tokens`, pre-edit | **28**, 5 attributed to `HeaderView.tsx` |
| 5 | Post-change `npm run screenshots:assert -- --mantine-only` | run **completes**, `manifest.json` present, 16/16 identical to step 1 (AC4) |
| 6 | Two-armed plant + pre-plant census (I4) | Arm A flips ≥1 cell; Arm B restores all 16 (AC11) |
| 7 | `npm run check:design-tokens`, post-change | **23**, no `HeaderView.tsx` / `HeaderView.module.css` entry (AC6) |
| 8 | `npm run test:header-hydration-id-parity`, post-change | pass (AC9) |
| 9 | DOM witness: tag names, `unstyled` set, `aria-label`, marker classes, `.site-header [aria-haspopup="menu"]` count, `.site-header` height | AC2, AC5, AC8 |
| 10 | `npm run check:file-integrity` · `npm run check:mojibake` | pass (AC12) |
| 11 | `npx tsc --noEmit` | 0 errors |
| 12 | **`npm run build`** | **exit 0 — hard gate**, transcript recorded (AC10) |

**Owner-native only — do not attempt, hand it back:** `npm run check:header-id-parity` needs a **running
`next dev` server** and a captured storage state
(`HEADER_ID_PARITY_STORAGE_STATE=<path> BASE_URL=http://localhost:PORT npm run check:header-id-parity`). Registry
row 33 also records that `check:hydration` gives a **false PASS on any hard-errored page**, so it is *not* the
source of truth — `test:header-hydration-id-parity` is. List the exact command and expected output in your report;
do not substitute it and do not claim it passed.

A failed or unrun step 12 permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`. `tsc=0` is not a substitute.

Evidence persists under `docs/sessions/` (assets alongside the log); `.screenshots/` output is local-only per **D6**.

---

## 14. Completion report contract

Write `docs/sessions/2026-08-02-task706-headerview-de-hybrid.md` containing:

1. **Files changed** — a table matching the real `git diff --stat` exactly, reconciled against your own pre-write
   `git status --porcelain` snapshot (§3.8 expects it empty).
2. **Requirement IDs completed** — R1–R12, each with its AC verdict.
3. **Commands run and their actual results** — real exit codes and real numbers, including the step-12 build
   transcript and both `test:header-hydration-id-parity` runs. Do not paraphrase a result you did not observe, and
   do not restate a pre-edit count as if you re-measured it.
4. **Evidence locations** — the I1 baseline md5 list, the I2 computed-style + height capture, the AC11 plant
   transcript (both arms), and the final official run's `manifest.json` path.
5. **The §3.2 disposition table, filled in** — what each of the 11 sites actually became, plus the §5.2 lucide-icon
   decision with its measured justification, and every "prop vs module" call you made under §3.7's rule.
6. **The 97/65 height check** at all four widths, pre and post.
7. **The `check:design-tokens` 28 → 23 delta**, with the per-file breakdown before and after.
8. **Assumptions, deviations, limitations, unresolved issues** — including the owner-native
   `check:header-id-parity` command left for the owner.
9. Concise current state appended to `docs/backlog.md` — **state only**, no history, and flag a
   `BACKLOG LIMIT BREACH` if the file cannot stay at or below 80 lines (it is currently **108** — a known
   pre-existing breach; do not add net lines).

**Status must be `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`.**
Never self-approve, never produce a `Decision`/`Confidence`/`Blocking findings` section, and never run, emit,
suggest, or delegate any mutating git command, including any form of `git push`.

---

## 15. Task quality gate

| Check | Status |
|---|---|
| A fresh Sonnet session can execute this with no hidden chat context | ✅ every path, line number, count and command is named |
| Every primary requirement has a binary AC and a verification method | ✅ R1–R12 → AC1–AC12 → §13 steps 1–12 |
| Scope names what must not change | ✅ §8, plus R5's verbatim pair and R2's `unstyled` set |
| Negative flows selected by applicability, not copied | ✅ §11 — 5 applicable, 4 marked `No` with the source that makes them inapplicable |
| No uninspected claim | ✅ every count, line and gate in §3 was read or run on 2026-08-02; compiled utility values are deliberately **not** asserted — I2 measures them |
| The gate proves the changed behavior, not merely procedure | ✅ AC11's Arm A must make the comparator fail; AC8 is a numeric invariant with a `BLOCKED` failure path; AC9 runs the registry's own authoritative test |
| Critical flow named with automated regression evidence | ✅ registry row 33 → `npm run test:header-hydration-id-parity`, pre- and post-edit (§13 steps 2 and 8) |
| Owner exceptions have traceable authorization | ✅ D28/D29 in Sprint 47 §"Owner decisions"; D30 recorded here and in the sprint file; D16/D6/D26/D3 cited with file and date |
| Exactly one active executable route | ✅ D28+D30's mechanism-only route; §5.2's icon choice is a measured in-task decision, not a second route |
| Every checkpoint names producer, output, comparator, failure behavior | ✅ §13 table + AC4's D26 comparator + AC8's `BLOCKED` clause + AC11's blind-comparator clause |
| Zero/empty input covered | ✅ §11 — guest fixture with `notificationSlot={undefined}` / `authSheetSlot={null}` renders at all 16 cells |
| Worktree state established with a pre-write snapshot | ✅ §3.8 — empty at HEAD `135e864e7`, with an explicit re-verify instruction if the executor's own start state differs |
| UI: current/legacy boundary, QA profile, source map, canonical decision record, preservation classifications | ✅ §3.2 source map · §3.6 token provenance · §3.7 canonical reference (673's committed module) · §13 profile with the Q3 exclusion argued from evidence |
| Sprint assigned before creation | ✅ Sprint 47, already open; 706 was reserved in its Tasks table on 2026-08-01 |

**Remaining ambiguous or conflicting requirements: none.**
**Owner decisions still needed: none** — D28, D29 and D30 close all three.
