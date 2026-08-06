# Task 672 — `MobileBottomNav`: shadcn `Button` retired, `MobileBottomNavView` extracted, canonical Story + manifest enrolment

## 1. Mode and task type

- **Mode:** implementation (Sonnet executor, via `.claude/skills/execute-task/SKILL.md`).
- **Primary task type:** UI / component migration — **current Mantine path** (`docs/rule-index.md`).
- **Secondary types:** container/presentational split (`docs/component-rules.md`); Storybook governance
  (new canonical story + manifest enrolment); navigation surface.
- **Origin:** the owner's homepage/layout Mantine-migration plan, Task 672 row —
  *"`MobileBottomNav` — shadcn `Button`, 11 `className`, fixed-нав на Tailwind."* Number already reserved in
  `docs/backlog.md`'s numbering line.

> **Read this first.** This task is a **mechanism migration with exactly one authorized visual delta**. Everything
> the nav renders today must come out pixel-identical, *except* the guest-branch icon size fixed by **D2** (§3.1).
> The proof is not an argument — it is a **baseline capture taken before the swap and compared byte-for-byte
> after it** (§10, I2/I6). Do not restyle, do not "tidy" a Tailwind class, do not touch TailAdmin chrome.

---

## 2. Objective

1. Split `MobileBottomNav` into a hook-owning container and a prop-driven `MobileBottomNavView`, so the nav can be
   rendered in Storybook and unit-tested (`docs/component-rules.md`, agent-contract cl. 16c).
2. Retire the shadcn/Base-UI `Button` from the guest branch in favour of Mantine `UnstyledButton`, and move the
   viewport hide from Tailwind's `md:hidden` to Mantine's own `hiddenFrom` mechanism.
3. Create the canonical `Mantine/Primitives/MobileBottomNavView` Story and enrol the View in
   `scripts/mantine-migration-scope.json` (`check:story-coverage` 14/14 → **15/15**).
4. Prove zero visual change by machine comparison against a baseline captured in the same session, and land the
   single authorized delta (**D2**) with a measured before/after value.

---

## 3. Verified context

All facts below were inspected in the worktree at `222498d41` (**clean**, branch
`task/q0-ci-rendered-locale-split`, upstream `origin/task/q0-ci-rendered-locale-split`). Line numbers are from that
commit.

### 3.1 Owner decisions — D1, D2, D3

Recorded this session, 2026-07-28, in response to three explicit orchestrator questions:

| ID | Question put to the owner | Owner ruling |
|---|---|---|
| **D1** | TailAdmin's reference has **no** bottom-nav / tab-bar row, so cl. 16a blocks inventing visual values. Which route? | **Mechanism-only, zero visual change.** shadcn `Button` → Mantine `UnstyledButton`, raw `<nav>` → `Box component="nav"`, every visual `className` preserved byte-for-byte. Any TailAdmin restyle is a **separate reserved task**. |
| **D2** | shadcn `Button`'s base class carries `[&_svg:not([class*='size-'])]:size-4` (specificity 0,2,0), which beats the icon's own `h-5 w-5` (0,1,0) — so guest Heart/Profile icons appear to render **16px** while every other item renders **20px**. Dropping `Button` removes that rule. | **Unify to 20px and declare it an intended fix.** Capture the baseline first and measure both branches; if the asymmetry is confirmed, the migration lands 20px everywhere and records it as a deliberate correction of an accidental shadcn side effect — **the one permitted visual delta in this task**. |
| **D3** | The component uses `useUser`/`usePathname`, so it cannot be rendered in a Story as-is. How should the split go? | **Extract `MobileBottomNavView`, prop-driven.** Container keeps the hooks and computes the active flags; the View takes items/active/handlers as props and is what the Story and the manifest enrol. Matches `HeaderView`/`FooterView`/`PopularLocationsView`/`HeroSearchView` precedent. |
| **D4** *(added at orchestrator review, 2026-07-29)* | Review measurement found a **second** undeclared visual delta of the same family as D2: the shadcn `Button`'s `cva` width contributions (`px-2.5`, `gap-1.5`, `whitespace-nowrap`, `border`) inflated the guest items' min-content width under `flex:1 1 0%` / `min-width:auto`, pushing **all five** guest slots off the grid the authenticated branch renders on — by up to **9.5px**. Dropping `Button` removes that offset. Ratify or revert? | **Ratified as a second authorized delta, conditional on the result being the canonical grid.** Condition **verified at review**: guest slots 0–2 now sit at **0.0px** deviation from the authenticated branch in **all 16** cells (4 locales × 4 widths), versus up to 9.5px before. The change removes a non-canonical shadcn-injected offset; it introduces no new value and no new token. Same root cause and same corrective direction as D2. |

D1–D4 are the source of truth and must not be re-litigated. D1 explicitly does **not** authorize any TailAdmin
restyle, token change, or spacing/typography edit. **D4 authorizes no new value either** — it ratifies the removal of
an accidental offset, restoring the canonical equal-fifths slot grid the authenticated branch already used.

### 3.2 The current component — inspected in full

`src/components/layout/MobileBottomNav.tsx` (96 lines), `'use client'`.

Hooks at `:13-17`: `useLocale()`, `useTranslations('nav')`, `useTranslations('common')`, `usePathname()`,
`useUser()`.

Active-state predicates, `:19-23` — **five independent booleans, not a single enum**:

```
const isHome      = pathname === `/${locale}` || pathname === `/${locale}/`
const isListings  = pathname.startsWith(`/${locale}/listings`) && !pathname.includes('/create')
const isAdd       = pathname.includes('/create')
const isFavorites = pathname.startsWith(`/${locale}/favorites`)
const isProfile   = pathname.startsWith(`/${locale}/cabinet`) || pathname.startsWith(`/${locale}/auth`)
```

Root element, `:26-30`:

```
<nav
  className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-30 md:hidden bg-card border-t shadow-[0_-2px_16px_rgba(0,0,0,0.08)] flex items-stretch h-14" // design-tokens-allow: shadow-[...] — bespoke upward nav shadow …
  style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
  aria-label={tc('aria_main_nav')}
>
```

Five children, `:31-60`: `Home` link, `Listings` link, the centre FAB `Link` (`:35-49`), then Favorites and Profile
— each rendered as a `<Link>` when `user` is truthy and as a `<Button>` calling `openAuthSheet('login')` when it is
not (`:51-60`).

`BottomNavItem`, `:65-96`: shared `className` at `:74-77`; the `onClick` branch (`:78-87`) renders
`<Button type="button" variant="ghost" onClick={onClick} className={cn(className, 'h-full rounded-none p-0')}>`;
the `href` branch (`:88-95`) renders `<Link href={href!} className={className}>`. Both render
`<Icon className="h-5 w-5" />` plus a `<span className="text-[10px] font-medium leading-none">` label.

**Three same-line `// design-tokens-allow:` markers exist** — `:27` (the shadow), `:47` (FAB label `text-[10px]`),
`:83` and `:92` (item label `text-[10px]`). These are exact-value, same-line markers: if a line moves, the marker
must move with it, or `check:design-tokens` gains a violation.

### 3.3 D2's mechanism — traced through the real class source

`src/components/ui/button.tsx:7` — the `cva` base string ends with
`[&_svg:not([class*='size-'])]:size-4`. `:17` — `ghost` adds `text-foreground hover:bg-muted …`. `:23-24` — the
default `size` adds `h-8 gap-1.5 px-2.5 max-sm:w-full max-sm:h-auto max-sm:min-h-11 max-sm:whitespace-normal
max-sm:break-words`.

`cn()` is `tailwind-merge`, so the nav's own `flex`, `h-full`, `rounded-none`, `p-0`, `text-primary` /
`text-muted-foreground` override the conflicting base utilities. The utilities that **survive** onto the guest
button and have **no counterpart on the `<Link>` branch** are: the `[&_svg…]:size-4` descendant rule,
`max-sm:h-auto max-sm:min-h-11 max-sm:whitespace-normal max-sm:break-words`, `hover:bg-muted`,
`focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring`,
`active:not-aria-[haspopup]:translate-y-px`, `cursor-pointer`, `select-none`, `whitespace-nowrap`,
`border border-transparent bg-clip-padding`, `duration-150`, `group/button`, `data-slot="button"`.

`h-5 w-5` on the `<Icon>` element is `(0,1,0)`; `[&_svg:not([class*='size-'])]:size-4` compiles to a descendant
selector at `(0,2,0)` and therefore wins — this is the predicted 16px/20px asymmetry behind **D2**.

**This is a prediction from CSS specificity, not a measurement.** I2's baseline capture is what turns it into
evidence; AC7's stop condition covers the case where the baseline disproves it.

### 3.4 `hiddenFrom` — verified in the installed package, not assumed

`@mantine/core` **8.3.18**. `node_modules/@mantine/core/cjs/core/Box/Box.cjs:68` sets the class
`` `mantine-hidden-from-${hiddenFrom}` `` when the prop is present.
`node_modules/@mantine/core/cjs/core/MantineProvider/MantineClasses/MantineClasses.cjs:17-22` builds, for every
`theme.breakpoints` entry:

```
@media (min-width: <minWidthBreakpoint>) {.mantine-hidden-from-<bp> {display: none !important;}}
```

`theme.ts:146` gives `md: '48em'`, so `hiddenFrom="md"` emits `@media (min-width: 48em)` — the same 768px
threshold Tailwind's `md:hidden` uses at the default root font size.

**Deliberate semantic change, must be recorded:** px → root-relative em, exactly as in Task 669 §3.3. Under
browser font-size zoom the em query tracks the user's setting. Intended, not a defect; state it in the session
log and do not "fix" it back.

`display: none !important` vs Tailwind's plain `display: none` is a strengthening, not a behavior change — the
nav has no competing `display` rule.

### 3.5 The gate would FAIL on a naively-written Story — read this before writing the Story

`scripts/check-stories-rendered.mjs:392-397` — `MANTINE_VIEWPORTS` is `320 / 375 / 390 / **1024**`.
`:761` — `assertScreenshotHasMeaningfulPixels` fails a cell when
`nonBackgroundRatio < 0.005 && variance < 10` (`blank-screenshot`).

A Story that renders the nav with its production hide active would therefore produce **four blank
`desktop-1024` cells × 4 locales = a guaranteed FAIL**. The View must accept the hide as a **prop the Story
omits** (I1/I4). `MANTINE_VIEWPORTS` and `MANTINE_STORY_EXTRA_VIEWPORTS` are **not** touched by this task.

### 3.6 The container/presentational rule — what may stay in the View

`docs/component-rules.md:36-51`: the container owns hooks, state, data-fetching and handlers; the presentational
primitive receives everything by props. **`useTranslations`/`useFormatter` MAY live in the presentational
primitive** — they are supplied by the global Storybook decorator. `HeaderView.tsx:5` is the in-repo precedent:
it keeps `useLocale`/`useTranslations` and takes `isAuthenticated`, `user`, `locale` and handlers as props.
`:44-45`: the container's **public API stays unchanged** — the split is internal.

### 3.7 The consumer — zero diff required

`src/app/[locale]/layout.tsx:10` imports `MobileBottomNav`, `:54` renders `<MobileBottomNav />` with no props.
`:51` — `<main className="min-h-[calc(100vh-4rem)] pb-14 md:pb-0">` reserves the 56px the fixed nav occupies.
`layout.tsx` must show a **zero diff** (AC9). If the nav's height or hide breakpoint changed, that `pb-14
md:pb-0` would silently desynchronize — another reason nothing about `h-14` or the `md` threshold may move.

### 3.8 The auth entry point — the highest-risk behavior in this task

`src/lib/auth/authSheet.ts:22-26` — `openAuthSheet(view = 'login')` dispatches
`new CustomEvent('lero:open-auth-sheet', { detail: { view } })` on `window`.
`src/components/layout/Header.tsx:28-36` is the only listener; it opens `AuthSheet`.

`MobileBottomNav.tsx:54` and `:59` are two of the app's guest entry points into the **P0 Login flow**
(`docs/critical-flow-registry.md:22`). The registry has **no row naming `MobileBottomNav`** (grepped, 120 lines),
so cl. 15 attaches no automated-regression obligation *by registry membership*. It is nevertheless required here
by R9 — an entry point into a P0 flow that is being rewritten is exactly the case a smoke test is cheap insurance
for. This is an orchestrator decision, stated as such, not a claimed registry obligation.

### 3.9 i18n — no new keys

`messages/en.json` already provides `nav.home`, `nav.listings`, `nav.add_listing`, `nav.favorites`,
`nav.profile`, `nav.login` and `common.aria_main_nav` (read directly). Parity is **2215 keys × 4 locales**.
This task adds **zero** keys.

### 3.10 Storybook enrolment — the current numbers

`scripts/mantine-migration-scope.json` has **14** entries after Task 669; `MobileBottomNav.tsx` is **not** among
them. `docs/component-catalog.md:97` lists `MobileBottomNav` as `MANUAL_REVIEW` with flags
`LOCALIZATION, TAILWIND_ENTROPY ⚠️`.

`docs/storybook-governance.md:1512` — a component absent from the manifest is never checked; one present with no
importing canonical story **FAILs**. `:1519` — every migration must enrol the component **in the same PR**. Enrol
the **View** (the file the Story imports), matching `PopularLocationsView.tsx` / `HeaderView.tsx` /
`FooterView.tsx` in the manifest. The gate moves 14/14 → **15/15**.

Story title convention and fixture style: `src/stories/mantine/primitives/PopularLocationsView.stories.tsx` —
`title: 'Mantine/Primitives/PopularLocationsView'`, `parameters: { skipCanvas: true, layout: 'fullscreen' }`,
locale read from `context.globals.locale`, visible strings via `storyT(locale, key)` from `../../_storyI18n`.

`scripts/check-stories.mjs` Check 2 (`:184-215`) forbids raw `<button>` **in story files**;
Check 10 (`:552`) forbids English JSX string literals in stories. Use `storyT` for every visible string.

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | D3, §3.6 | `MobileBottomNavView` exists as a prop-driven presentational primitive in `src/components/layout/MobileBottomNavView.tsx`. `MobileBottomNav` keeps all five hooks, computes the five predicates unchanged, and renders the View. | P0 | AC1 | Confirmed |
| R2 | D1, §3.2 | No import of `@/components/ui/button` remains in either file; the guest branch renders Mantine `UnstyledButton`. | P0 | AC2 | Confirmed |
| R3 | D1, §3.4 | The root is `Box component="nav"`; the viewport hide is Mantine `hiddenFrom`, not `md:hidden`. The container passes it; the View defaults to no hide. | P0 | AC3 | Confirmed |
| R4 | §3.10, cl. 16c | A canonical `Mantine/Primitives/MobileBottomNavView` Story exists with a **guest** and an **authenticated** export, importing the real View, all visible strings via `storyT`. | P0 | AC4 | Confirmed |
| R5 | §3.10 | `src/components/layout/MobileBottomNavView.tsx` is appended to `scripts/mantine-migration-scope.json`; `check:story-coverage` reports **15/15**. | P1 | AC5 | Confirmed |
| R6 | D1 | **Authenticated** story cells are **byte-identical** between the pre-swap baseline and the post-swap capture at all 4 standing widths × 4 locales. | P0 | AC6 | Confirmed |
| R7 | D2 | Guest Heart/Profile icons measure **20×20 CSS px** after the change. The baseline value is measured and quoted. | P0 | AC7 | Confirmed |
| R8 | cl. 3, 5, §3.2 | Every preserved behavior survives: the five predicates, both guest→`openAuthSheet('login')` entry points, the FAB subtree, `env(safe-area-inset-bottom)`, `aria-label`, the `mobile-bottom-nav` class, `z-30`, `h-14`, `bg-card border-t`, the shadow, and all three `design-tokens-allow` markers on their own lines. | P0 | AC8 | Confirmed |
| R9 | §3.8 | A new smoke test asserts (a) clicking each guest item dispatches `lero:open-auth-sheet` with `detail.view === 'login'`, and (b) the container's root carries `mantine-hidden-from-md`. | P0 | AC10 | Confirmed |
| R10 | §3.7 | `src/app/[locale]/layout.tsx` has a **zero diff**. | P0 | AC9 | Confirmed |
| R11 | cl. 9 | `npm run build` exits 0 on a fresh post-change transcript. | P0 | AC11 | Confirmed |
| R12 | cl. 7, 14 | Zero new i18n keys, parity unchanged at 2215×4; `check:design-tokens` shows no new violation in any touched file; `check:file-integrity` / `check:mojibake` exit 0. | P1 | AC12 | Confirmed |

---

## 5. Assumptions and open questions

- **A1 — the D2 asymmetry is predicted, not yet measured (§3.3).** I2's baseline is the first real measurement.
  If the baseline shows the guest icons already at **20px**, D2's premise is void: report it, land no icon-size
  change, mark R7 `NOT APPLICABLE` with the measured numbers, and continue. If the baseline shows some **third**
  value, **stop and report** — do not pick a value.
- **A2 — `mantine-hidden-from-md` requires `MantineProvider` in the tree.** `src/app/layout.tsx:6` imports
  `@mantine/core/styles.css` and `MantineRootProvider` wraps both public and admin routes, so the emitted class
  rule is present on every `[locale]` route. Confirm the class is actually on the rendered `<nav>` (AC10b) rather
  than assuming the prop took effect.
- **A3 — the two story exports render different subtrees**, so only the **authenticated** export is a valid
  byte-identity comparator for the shared chrome (R6). The guest export is expected to differ by exactly the D2
  delta; its non-icon geometry (nav height, item x-positions) must still match — measure, do not eyeball.
- **A4 — `UnstyledButton` ships its own `@mantine/core` CSS** (`.m_87cf2631`, referenced by
  `MantineCopyIdButton.module.css:7`) which sets `font-size` and a `mantine-focus-auto` outline. The View's own
  `text-[10px]` / layout classes must still win. Any drift shows up as a non-identical authenticated cell and is
  an R6 failure — fix it with an explicit class on the button, never by editing global chrome.
- **A5 — worktree starts clean** at `222498d41`. Snapshot `git status --porcelain` before the first write and
  record it. If it is not clean, **stop and report**; do not reconcile foreign paths.

**Open questions — none.** D1, D2 and D3 are decided (§3.1); the split shape is fixed (§3.6); the enrolment is
mechanical (§3.10).

---

## 6. Pre-read rule bundle

1. `docs/agent-contract.md` — clauses 3, 5, 7, 9, 11, 12, 13, 14, 16, 16a, 16b, 16c.
2. `docs/rule-index.md` — "Current Mantine path".
3. `docs/qa-profiles.md` — the **Q3** row and the viewport policy.
4. `docs/component-rules.md` — the container/presentational split section (lines 36-51).
5. `docs/mantine-responsive-design-system.md`
6. `docs/tailadmin-style-reference.md` — to confirm for yourself that **no** bottom-nav/tab-bar row exists (D1).
7. `docs/storybook-governance.md` — §15.1 (`check:story-coverage`) and §8b (canonical story taxonomy).
8. `docs/qa-rules.md`
9. `docs/backlog.md` — the numbering line and the 80-line limit.

**Source pre-read**

10. `src/components/layout/MobileBottomNav.tsx` — all 96 lines.
11. `src/components/ui/button.tsx` — all 65 lines (the `cva` base string at `:7` is the D2 evidence).
12. `src/app/[locale]/layout.tsx` — lines 44-60.
13. `src/lib/auth/authSheet.ts` — all 26 lines.
14. `src/components/layout/HeaderView.tsx` — lines 1-70 only, as the container/View precedent.
15. `src/design-system/mantine/theme.ts` — lines 143-151.
16. `src/stories/mantine/primitives/PopularLocationsView.stories.tsx` — all 69 lines, as the Story template.
17. `scripts/check-stories-rendered.mjs` — lines 385-450 and 700-770.
18. `src/components/shared/__tests__/filtersPanelShell.smoke.test.tsx` — as the smoke-test harness precedent.

---

## 7. Scope

| Path | Action | Why |
|---|---|---|
| `src/components/layout/MobileBottomNavView.tsx` | **create** | Prop-driven presentational primitive (R1). |
| `src/components/layout/MobileBottomNav.tsx` | modify | Becomes the hook-owning container; predicates unchanged (R1). |
| `src/stories/mantine/primitives/MobileBottomNavView.stories.tsx` | **create** | Canonical Story, guest + authenticated (R4). |
| `src/components/layout/__tests__/mobileBottomNav.smoke.test.tsx` | **create** | Auth-dispatch + `hiddenFrom` assertions (R9). |
| `scripts/mantine-migration-scope.json` | modify | Append the View. **Append-only** (R5). |
| `docs/component-catalog.md` | modify | `MobileBottomNav` row `:97` — record the migration and the new View. **One row only.** |
| `docs/backlog.md` | modify | Concise 672 entry; move 672 out of "reserved" in the numbering line. Keep **≤80 lines** — the file is **at** 80, so consolidate rather than append. |
| `docs/sessions/2026-07-2X-task672-*.md` | **create** | Session log with a `Files Changed` table matching the real diff. |

---

## 8. Out of scope

- **Any TailAdmin restyle, token change, spacing, radius, shadow or typography edit** — D1 forbids it and cl. 16a
  blocks inventing a value where the reference has no row. **Reserve Task 683** for a bottom-nav TailAdmin
  conformance slice, which must begin with an owner-supplied or live-captured reference row.
- **The three `design-tokens-allow` markers** (`:27`, `:47`, `:83`/`:92`). Retiring `text-[10px]` needs a real
  token, which is a rendered-value change → Task 683, not this task.
- **The FAB's visual treatment** (`:35-49`) — moved verbatim, not rewritten.
- **`src/components/ui/button.tsx`** — other consumers keep it; this task only stops *this* file importing it.
- **`src/app/[locale]/layout.tsx`** — zero diff (R10), including `pb-14 md:pb-0` (§3.7).
- **`Header.tsx` / `AuthSheet` / `authSheet.ts`** — the listener side of the auth event is untouched.
- **`MANTINE_VIEWPORTS` / `MANTINE_STORY_EXTRA_VIEWPORTS`** — no new widths (§3.5). Full 14-width enrolment is
  Task 678.
- **Converting the label `<span>`s to Mantine `Text`** — `Text` carries its own `font-size`/`line-height` from
  unlayered `@mantine/core/styles.css` and would contend with `text-[10px] leading-none`. That is a visual risk
  with zero mechanism benefit here; keep the raw `<span>`s and declare them as retained, per the
  `PopularLocationsView` doc-block precedent.
- **Converting `flex items-stretch h-14` to `Group`/style props** — `Group` applies its own `gap` and wrapping
  defaults; the pixel risk is real and the benefit is nil under D1. Retained as `className`, declared.
- **`docs/critical-flow-registry.md`** — no row is added; R9's test is an orchestrator-chosen safeguard (§3.8).

---

## 9. Current and required behavior

**Current.** `MobileBottomNav` is a single `'use client'` component holding five hooks. It renders a fixed
56px bar, hidden at ≥768px by Tailwind's `md:hidden`, with five slots: Home, Listings, the elevated FAB, then
Favorites and Profile. When `user` is truthy the last two are `<Link>`s; when it is not, they are shadcn
`<Button variant="ghost">`s that call `openAuthSheet('login')`. The component has **no Story**, is **not** in the
Mantine manifest, and — per §3.3 — very likely renders its guest icons 4px smaller than every other icon.

**Required after.** Identical rendering at every width and in every locale for the authenticated state, and for
the guest state identical **except** that the Heart and Profile icons now measure 20×20 like their siblings
(**D2**). The bar is still fixed, still 56px, still hidden at ≥768px — now through `hiddenFrom="md"`. Both guest
items still dispatch `lero:open-auth-sheet` with `view: 'login'`. `layout.tsx` is untouched. The nav is now
represented by a canonical Mantine Story and enrolled in the migration manifest, so a future regression is
caught by the standing gate rather than by inspection.

---

## 10. Implementation requirements

**I1 — the View.** Create `src/components/layout/MobileBottomNavView.tsx`, `'use client'`:

```tsx
export interface MobileBottomNavActive {
  home: boolean; listings: boolean; add: boolean; favorites: boolean; profile: boolean
}

export interface MobileBottomNavViewProps {
  isAuthenticated: boolean
  locale: string
  active: MobileBottomNavActive
  /** Guest branch only — opens the auth sheet. */
  onRequireAuth: () => void
  /**
   * Production passes `true`; the canonical Story omits it so the bar renders at the gate's
   * desktop-1024 cell instead of producing a blank screenshot (kickoff §3.5).
   */
  hideFromMd?: boolean
}
```

Pass the **five booleans as an object**, not a single enum — §3.2 shows they are independent and can in principle
co-occur. Preserving the shape preserves the behavior exactly. `useLocale` is replaced by the `locale` prop;
`useTranslations('nav')` and `useTranslations('common')` **stay in the View** (§3.6, `HeaderView` precedent).

**I2 — capture the baseline BEFORE the mechanism swap.** This is the task's comparator and it cannot be
reconstructed afterwards. In order:

1. Perform **only** the mechanical extraction: move the JSX into the View unchanged — still `<nav>`, still
   `md:hidden` applied as `cn(BASE, hideFromMd && 'md:hidden')`, still shadcn `Button` in the guest branch.
2. Write the Story (I4) and the manifest entry (I5).
3. `npm run build-storybook`, then `npm run screenshots:assert -- --mantine-only`.
4. **Copy the capture directory aside** (e.g. `.screenshots/task672-baseline/`) and record its path. Confirm
   **0 FAIL**; a FAIL here means the extraction was not mechanical — fix it before proceeding.
5. Measure the rendered icon box of a guest Heart/Profile icon and of an authenticated one, in the same locale
   and width. Quote both raw numbers (this is A1's stop condition).

**I3 — the mechanism swap.** Only now:

- Root: `<nav className={…}>` → `<Box component="nav" hiddenFrom={hideFromMd ? 'md' : undefined} className={…}>`
  with `md:hidden` **removed from the class string**. Everything else in the class string is byte-identical,
  and the `// design-tokens-allow:` shadow marker stays on the same line as the shadow class.
- Guest branch: `<Button type="button" variant="ghost" … >` → `<UnstyledButton type="button" onClick={…}
  className={cn(className, 'h-full rounded-none p-0')}>`. Keep `type="button"`.
- Do **not** re-add `[&_svg…]:size-4`, `max-sm:*`, `hover:bg-muted` or any other class §3.3 lists as arriving
  from `cva`. Their removal is the point of D2 and of R6's comparator. If removing `hover:bg-muted` changes an
  authenticated cell, that is an R6 failure — investigate, do not paper over it.
- Keep `style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}` and `aria-label` exactly as they are.

**I4 — the Story.** `src/stories/mantine/primitives/MobileBottomNavView.stories.tsx`, modelled on
`PopularLocationsView.stories.tsx`:

- `title: 'Mantine/Primitives/MobileBottomNavView'`; `parameters: { skipCanvas: true, layout: 'fullscreen' }`.
- Imports the **real** View (cl. 16c — no stand-in).
- Read `locale` from `context.globals.locale`; every visible string via `storyT(locale, 'nav.*' | 'common.*')`.
  No English literals (Check 10), no raw `<button>` (Check 2).
- **`Guest`** export: `isAuthenticated={false}`, `active={{home:true, listings:false, add:false,
  favorites:false, profile:false}}`, `onRequireAuth={() => {}}`.
- **`Authenticated`** export: `isAuthenticated={true}`, same `active`.
- Neither export passes `hideFromMd` (§3.5).

**I5 — enrolment.** Append `"src/components/layout/MobileBottomNavView.tsx"` to
`scripts/mantine-migration-scope.json`. Append-only; do not reorder.

**I6 — the comparison.** Re-run `build-storybook` and `screenshots:assert -- --mantine-only`, then compare the
new capture directory against the I2 baseline **file-by-file, by hash** (`md5`/`sha1` over the PNG bytes) for the
shared filenames. Report:

- the count of compared files and the count that differ;
- that **every** `mantine-primitives-mobilebottomnavview--authenticated__*` cell is **identical** (R6);
- for the `--guest` cells, the list of differing cells and the measured icon box before/after (R7);
- that no cell belonging to any **other** story changed beyond the run-to-run flake already documented for
  `EmptyLoadingErrorState` and `HomepageListingGrids/Loading` — name any other changed story explicitly.

**I7 — the smoke test.** `src/components/layout/__tests__/mobileBottomNav.smoke.test.tsx`, following
`filtersPanelShell.smoke.test.tsx`'s harness:

- (a) Render the **View** with `isAuthenticated={false}` and a spy `onRequireAuth`; click the Favorites control,
  then the Profile control; assert the spy fired once per click. Then render the **container** and assert a
  `window` listener on `'lero:open-auth-sheet'` receives `detail.view === 'login'`.
- (b) Render the container and assert its root element's `className` contains `mantine-hidden-from-md` (A2).

**I8 — order of operations.** `git status --porcelain` (expect clean, §13.2) → I1 extraction → I4 → I5 → I2
baseline → **I3 swap** → I7 → I6 comparison → gates → records.

---

## 11. Positive and negative flows

### Positive flow

On `/{locale}` at 390px: the bar is fixed to the bottom, 56px tall plus the safe-area inset, five slots wide,
Home highlighted in `text-primary` and the rest in `text-muted-foreground`, the FAB raised above the bar on the
brand fill. A logged-in user tapping Favorites navigates to `/{locale}/favorites`; a guest tapping the same slot
opens the auth sheet without navigating. At 768px and above the bar is absent and `main`'s `md:pb-0` reclaims
the space.

### Negative-flow applicability table

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| **Guest (unauthenticated) branch** | **Yes** | `MobileBottomNav.tsx:51-60` | Favorites/Profile render as buttons and dispatch `lero:open-auth-sheet` `view:'login'`; no navigation | AC10a |
| Validation | No | The nav accepts no user input | N/A | — |
| Authorization / RLS | No | No data read or write; `useUser` is read-only state already resolved by `AuthProvider` | N/A | — |
| **Locale expansion (sq/uk/it)** | **Yes** | cl. 7 | Five labels fit without clipping or horizontal overflow at 320px; `uk@320` is the stress cell | AC6/AC7 captures |
| **Small viewport (<640)** | **Yes** | cl. 11 | Each slot ≥44px touch target (the bar is 56px and slots are `min-h-full`); no horizontal overflow | AC6 + gate's `noHorizontalOverflow` |
| **Viewport ≥768 (the hide)** | **Yes** | §3.4 | Bar absent via `mantine-hidden-from-md` | AC10b |
| Missing/failed data | No | No fetch; `user` is `null` in the worst case, which is the guest branch above | N/A | — |
| Offline / network | No | No client fetch added | N/A | — |
| Concurrent writer | No | Read-only presentational surface | N/A | — |
| RTL | No | No RTL locale in the project | N/A | — |

---

## 12. Acceptance criteria

- **AC1 [R1]** — *Given* the final diff, *when* both layout files are read, *then*
  `MobileBottomNavView.tsx` exists and contains no `usePathname`/`useUser`; `MobileBottomNav.tsx` still calls all
  five hooks and its five predicate expressions are **character-identical** to §3.2 (quote them). `grep -n
  'usePathname\|useUser' src/components/layout/MobileBottomNavView.tsx` returns **0 hits**.

- **AC2 [R2]** — *Given* the final diff, *when* grepped, *then*
  `grep -rn "components/ui/button" src/components/layout/MobileBottomNav*.tsx` returns **0 hits**, and
  `UnstyledButton` is imported from `@mantine/core`.

- **AC3 [R3]** — *Given* the final diff, *when* grepped, *then*
  `grep -n "md:hidden" src/components/layout/MobileBottomNav*.tsx` returns **0 hits**; the root is
  `Box component="nav"`; and the container passes `hideFromMd`.

- **AC4 [R4]** — *Given* a fresh `build-storybook`, *when* the index is read, *then*
  `Mantine/Primitives/MobileBottomNavView` exists with exactly the `Guest` and `Authenticated` exports, each
  importing the real View. `npm run check:stories` exits **0**.

- **AC5 [R5]** — *Given* the updated manifest, *when* `npm run check:story-coverage` runs, *then* it exits 0 at
  **15/15** and names `MobileBottomNavView.tsx` as covered.

- **AC6 [R6]** — *Given* the I2 baseline and the I6 capture, *when* hashed, *then* **all 16**
  `…mobilebottomnavview--authenticated__{sq,en,uk,it}__{mobile-320,mobile-375,mobile-390,desktop-1024}.png`
  cells are **byte-identical**. Quote the compared/differing counts. Any difference is a **stop** condition.

  **AC6 amendment (orchestrator, 2026-07-29 review).** The original wording admitted no capture nondeterminism and
  was unsatisfiable as written. A differing cell is discharged **only** when all four hold, each evidenced: (a) the
  diff is `< 0.01%` of the cell's pixels with a single-scanline bounding box; (b) a **same-code repeat capture**
  reproduces the identical magnitude and location with zero source change; (c) the differing cells do not form a
  locale-consistent or width-consistent pattern (a real mechanism regression appears in every locale); and (d) the
  full-manifest comparison shows the same drift class in **unrelated, untouched stories**. Any cell not discharged on
  all four remains a stop condition. Clause (d) is new and is now a required I6 artifact — see the amended I6 below.

- **AC7 [R7]** — *Given* the same two captures, *when* the guest Heart/Profile icon box is measured, *then*
  the baseline value and the post-change value are both quoted, and the post-change value is **20×20 px**,
  matching the authenticated branch measured in the same cell. If the baseline already reads 20px, record R7
  `NOT APPLICABLE` with both numbers (A1). Any third value is a **stop** condition.

- **AC8 [R8]** — *Given* the final View, *when* inspected, *then* it still carries `mobile-bottom-nav`, `fixed
  bottom-0 left-0 right-0`, `z-30`, `bg-card border-t`, the shadow class, `flex items-stretch h-14`,
  `style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}` and `aria-label={tc('aria_main_nav')}`; the FAB
  subtree is unchanged in content; and all **three** `// design-tokens-allow:` markers sit on the same line as
  the value they authorize.

- **AC9 [R10]** — *Given* the final diff, *when* `git status --porcelain` is read, *then*
  `src/app/[locale]/layout.tsx` is **absent**.

- **AC10 [R9]** — *Given* the new smoke test, *when* `npx vitest run src/components/layout/__tests__/mobileBottomNav.smoke.test.tsx`
  runs, *then* it exits 0 with (a) both guest controls proven to dispatch `lero:open-auth-sheet` with
  `detail.view === 'login'`, and (b) the container root proven to carry `mantine-hidden-from-md`. Report both
  assertions individually.

- **AC11 [R11]** — `npm run build` exits 0 on a fresh post-change transcript. Report the page count actually
  printed and **quote the transcript tail** — do **not** cite `.next/BUILD_ID`, which a later `next dev` run
  overwrites (Task 669 review finding).

- **AC12 [R12]** — `npm run check:i18n` exits 0 at 2215×4 with no new keys; `npm run check:design-tokens` shows
  no new violation in any touched file (quote before/after totals); `npm run check:file-integrity` and
  `npm run check:mojibake` exit 0.

---

## 13. QA profile and verification plan

### 13.1 Profile

**`Q3 — Full Visual Matrix`.** `docs/qa-profiles.md:15` names "navigation/header/footer" and "Storybook
governance" explicitly, and this task is both. Not `Q4`: `docs/critical-flow-registry.md` has no row for
`MobileBottomNav` (grepped, 120 lines), so no registry regression obligation attaches and no planted-violation
proof is required — R9's smoke test is an orchestrator-chosen safeguard for a P0 *entry point* (§3.8), not a
claimed Q4 gate.

**Declared proof path.** `MANTINE_VIEWPORTS` (320/375/390/1024) × sq/en/uk/it for both new story exports, plus
the I2/I6 baseline comparison. The remaining canonical widths (480/560/680/768/810/960/1200/1440/1920/2560) are
**not** captured for this story — that is Task 678's scope. Report this as the declared boundary of the proof,
never as satisfied full-matrix coverage. Note that `≥768` is precisely where the bar is hidden in production, so
the uncaptured widths carry little residual risk; the hide itself is proven by AC10b, not by a screenshot.

**TailAdmin side-by-side:** **not required and not permitted** — no visual chrome is in scope (D1), and the
reference has no bottom-nav row (§3.1, cl. 16a). Task 683 reserved.

### 13.2 Worktree

Start state is expected **clean** at `222498d41`. Snapshot `git status --porcelain` before the first write and
record it. If it is not clean, **stop and report** — do not reconcile foreign paths.

### 13.3 Gates

| Command | Expected |
|---|---|
| `npm run typecheck` | 0 |
| `npx vitest run` (full suite) | 0 new failures; the new smoke test passes |
| `npm run check:stories` | 0 |
| `npm run check:story-coverage` | 0, **15/15** |
| `npm run build-storybook` | 0 (twice — I2 and I6) |
| `npm run screenshots:assert -- --mantine-only` | 0 FAIL on both runs; classify every `AMBIGUOUS` |
| *(I6 comparison)* | authenticated cells byte-identical; guest cells differ only per D2 |
| `npm run check:design-tokens` | no new violation in touched files |
| `npm run check:i18n` | 0, 2215×4 |
| `npm run check:file-integrity` / `check:mojibake` | 0 / 0 |
| `BASE_URL=http://localhost:3000 npm run check:hydration` | required — the nav renders in every `[locale]` SSR route and its emitted classes change |
| `npm run build` | **0 — hard gate**, transcript tail quoted |

---

## 14. Completion report contract

Session log at `docs/sessions/<date>-task672-mobilebottomnav-mantine-view-split.md`:

1. `Files Changed` table matching the real `git diff`.
2. R1–R12 mapped to AC1–AC12 with evidence.
3. Every command with its **actual** exit code; the `npm run build` transcript tail quoted verbatim.
4. The I2 baseline directory path, the I6 capture path, and the file-by-file hash comparison result.
5. The measured guest and authenticated icon box, before and after (AC7), raw.
6. The `--mantine-only` totals for **both** runs with every `AMBIGUOUS` classified.
7. The five predicate expressions quoted, proving they are character-identical (AC1).
8. Deviations, each with a reason.
9. Limitations — at minimum: the declared 4-width proof path (§13.1); the px→em hide-query semantics change
   (§3.4); the retained `className` layout/label utilities and the three `design-tokens-allow` markers, with
   Task 683 named; and that R7 is a measured result, not a standing self-failing assertion.

Backlog: concise 672 entry, move 672 out of "reserved" in the numbering line, add the **Task 683** reservation,
keep ≤80 lines (the file is **at** 80 — consolidate, do not append).

**Status vocabulary.** `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`.
Sonnet does not self-approve and does not run, emit, suggest, or delegate any mutating git command.

**Handoff:** execute from this saved path —
`tasks/kickoff_prompt_Task_672_MobileBottomNav_Mantine_Migration.md` — under
`.claude/skills/execute-task/SKILL.md`.

---

## 15. Visual source map

| Visible artifact/state | Component/markup | Class/selector | Utility, cascade, and token path | Disposition | Evidence |
|---|---|---|---|---|---|
| Bar chrome (fixed, 56px, card fill, top border) | root `<nav>` → `Box component="nav"` | `fixed bottom-0 left-0 right-0 z-30 bg-card border-t flex items-stretch h-14` | Tailwind utilities over `--card`/`--border` | **preserved verbatim** (D1) | §3.2, AC8 |
| Bar upward shadow | same | `shadow-[0_-2px_16px_rgba(0,0,0,0.08)]` | same-line `design-tokens-allow` marker, `:27` | **preserved verbatim, marker moves with the line** | §3.2, AC8 |
| Safe-area inset | same | inline `style` | `env(safe-area-inset-bottom)` | **preserved verbatim** | AC8 |
| Viewport hide ≥768 | same | `md:hidden` → `.mantine-hidden-from-md` | Tailwind `@media(min-width:768px)` → Mantine `@media(min-width:48em)` (`theme.ts:146`) | **changed mechanism, same threshold** | §3.4, AC3/AC10b |
| Item label | `<span>` | `text-[10px] font-medium leading-none` | same-line `design-tokens-allow` markers, `:83`/`:92` | **preserved verbatim** — `Text` conversion is out of scope (§8) | §3.2 |
| FAB label | `<span>` | `text-[10px] font-medium text-muted-foreground leading-none` | same-line marker, `:47` | **preserved verbatim** | §3.2 |
| FAB disc | `<span>` inside the centre `Link` | `h-12 w-12 rounded-full shadow-lg ring-2 ring-background … bg-primary` | brand token `--primary` | **preserved verbatim, subtree moved not rewritten** | §3.2, AC8 |
| Active/inactive item colour | `BottomNavItem` | `text-primary` / `text-muted-foreground` | semantic tokens | **preserved verbatim** | §3.2 |
| Guest item control | shadcn `Button variant="ghost"` → Mantine `UnstyledButton` | `cva` base + ghost + size-default, minus tailwind-merge losers | see §3.3 for the surviving set | **replaced mechanism**; the `cva` extras are intentionally dropped | §3.3, R6 |
| **Guest item icon size** | `<Heart/>`, `<User/>` | `h-5 w-5` vs inherited `[&_svg:not([class*='size-'])]:size-4` | descendant rule (0,2,0) currently beats (0,1,0) | **changed value — the single authorized delta (D2)**, 16px → 20px | §3.3, AC7 |

## 16. Canonical UI decision record

| Visible artifact | Search queries and inspected paths | Canonical Mantine story/source | Disposition | Shared style/token path and required registration |
|---|---|---|---|---|
| Mobile bottom navigation bar | `find src -iname "*BottomNav*"`; listed all 48 `src/stories/mantine/primitives/*` and all 17 `src/stories/patterns/mantine/*`; listed `src/design-system/mantine/patterns/`; `grep MobileBottomNav docs/component-catalog.md` (`:97`, `MANUAL_REVIEW`) | **None exists.** Nearest neighbours — `MantineNavigationMenu` (desktop menu), `MobileNavDrawer` (drawer, not a bar), `MantineResponsiveActionFooter` (form action bar, not navigation) — none renders a fixed five-slot bottom nav | **create** the canonical Story for the newly-extracted `MobileBottomNavView` **before** the mechanism swap (cl. 16c), then migrate | Story registered as `Mantine/Primitives/MobileBottomNavView`; `MobileBottomNavView.tsx` appended to `scripts/mantine-migration-scope.json`, moving `check:story-coverage` 14/14 → 15/15 (§3.10) |
| Guest item control | `src/components/ui/button.tsx` read in full; `UnstyledButton` chrome traced via `MantineCopyIdButton.module.css:7` | Mantine `UnstyledButton` (`@mantine/core`), already the repo's unstyled-control primitive | **reuse** — no local button style created | No new class or token; the View's existing layout `className` is reapplied unchanged |
| Bar visual chrome (fill, border, shadow, density) | `grep -ni "bottom nav\|tab bar\|floating action\|mobile nav" docs/tailadmin-style-reference.md` → only §6c *Tabs* and §6t *RangeDatePicker mobile navigation*; **no bottom-nav row** | **No TailAdmin reference row exists** | **preserve-existing, no restyle** — D1 makes this a mechanism-only task, so **no new visual value is introduced** and cl. 16a is not triggered | Existing Tailwind utilities retained verbatim; **Task 683** reserved for the conformance slice, which must open with an owner-supplied or live-captured reference row |

No artifact needs a value without design-system provenance, so this task is **not**
`BLOCKED — CANONICAL STYLE DECISION REQUIRED`.

## 17. Rule-compliance ledger

| Rule source and exact clause | Applicability evidence | Exact mandatory outcome | Evidence artifact / command | Result |
|---|---|---|---|---|
| `agent-contract.md` cl. 3 (capabilities stay reachable) | Two guest entry points into the P0 login flow are being rewritten | No control, state or entry point removed | AC8, AC10a | `COMPLIANT` |
| cl. 5 (UX flows intact) | Five nav slots, one consumer, one cross-page effect (`main`'s `pb-14`) | Entry points, siblings and cross-page effects preserved | AC8, AC9 | `COMPLIANT` |
| cl. 7 (four locales) | Six visible labels | Zero new keys; all four locales captured on both exports | AC12, AC6/AC7 | `COMPLIANT` |
| cl. 9 (validation evidence) | Non-Q0 task | `npm run build` exit 0, fresh transcript **quoted** | AC11 | `COMPLIANT` |
| cl. 11 (mobile/overlay protection) | Fixed bar below 640px | ≥44px touch targets, no horizontal overflow, labels wrap-free | AC6 + gate `noHorizontalOverflow` | `COMPLIANT` |
| cl. 12 (rendered evidence follows risk) | Q3 visual work | Declared proof path, machine-produced, baseline-compared | AC6, AC7 | `COMPLIANT` |
| cl. 13 (Storybook/no-hardcode gates) | New story + manifest change | `storyT`-backed strings, no raw `<button>`, machine evidence | AC4, AC5 | `COMPLIANT` |
| cl. 14 (file integrity) | Text/source files created and touched | UTF-8 no BOM, no mojibake | AC12 | `COMPLIANT` |
| cl. 15 (critical flows) | `critical-flow-registry.md` grepped, 120 lines, **no** `MobileBottomNav` row | No registry obligation attaches; R9 added by orchestrator choice, declared as such | §3.8, §13.1 | `NOT APPLICABLE` |
| cl. 16 (TailAdmin visual source) | **No** visual chrome in scope (D1) | No value invented; existing utilities preserved verbatim | §15, §16 row 3 | `COMPLIANT` |
| cl. 16a (missing reference → provenance) | Reference has no bottom-nav row | Because D1 makes this mechanism-only, no new visual value is introduced; restyle deferred to Task 683 with a provenance precondition | §16 row 3, §8 | `COMPLIANT` |
| cl. 16b (canonical provenance before code) | Both the bar and the guest control change mechanism | Canonical source searched, named, and shown absent → created | §16 | `COMPLIANT` |
| cl. 16c (canonical Story cannot be bypassed) | The changed artifact has **no** Story today | Story created **first**, registered with `check:story-coverage`, then the migration performed | I2 ordering, AC4, AC5 | `COMPLIANT` |
| `component-rules.md` container/presentational | Hook-bearing component being enrolled in Storybook | Container owns hooks; View is prop-driven; container's public API unchanged | AC1, AC9 | `COMPLIANT` |

## 18. Execution contract

| Field | Value |
|---|---|
| Task | 672 |
| Active route / owner decision | Single route: mechanism-only migration with the D2 icon-size delta (owner, §3.1 D1+D2+D3) |
| Decision source, date, scope | Owner, 2026-07-28; scope = mechanism + the one icon-size correction; **no** restyle |
| Starting worktree mode | **clean isolated** at `222498d41` — §13.2 sets the stop condition |
| Producer of each checkpoint | extraction → `build-storybook` #1 → `screenshots:assert` #1 (**baseline, copied aside**) → swap → `build-storybook` #2 → `screenshots:assert` #2 → hash comparison → `vitest` smoke → `build` |
| Persisted result | `.screenshots/task672-baseline/` + `.screenshots/rendered-assert/<ts>/` manifests and PNGs; vitest output; build transcript tail; session log |
| Comparator | AC6's byte-identity over the 16 authenticated cells; AC7's two measured icon boxes; AC5's 15/15; AC1/AC2/AC3/AC9's zero-hit greps; AC10's two named assertions |
| Failure path | Baseline FAIL → the extraction was not mechanical, stop; icon baseline neither 16 nor 20 → stop (A1); any authenticated cell differing → stop (R6); any new FAIL in run #2 → stop; dirty start → stop (A5) |
| Zero/empty input case | `user === null` **is** the empty case and is a first-class rendered state — it is the `Guest` story export and AC10a's assertion, not an edge case |
| Task-created artifacts in baselines | Both story exports and all 32 of their cells are task-created; the I2 baseline is captured **after** the story exists and **before** the swap, so the comparison is like-for-like. `check:story-coverage`'s 15/15 is the post-change total, not a pre-change baseline |

## 19. Task quality gate

| Check | Result |
|---|---|
| Executable by a fresh Sonnet session with no chat context | **Yes** — every path, line number, class string, command, expected number and the three owner rulings are inline |
| Every primary requirement has a binary AC | **Yes** — R1–R12 → AC1–AC12 |
| Scope names what must not change | **Yes** — §8, incl. `layout.tsx` zero diff, the viewport lists, `Text`/`Group` conversions, and Task 683 |
| QA profile + canonical decision record present | **Yes** — §13.1 Q3 (with the reason it is not Q4); §16 |
| Canonical-source search performed before proposing a style | **Yes** — §16; the search returned **no** existing story, which is why the Story is created first |
| Owner-only exceptions traceable | **Yes** — three rulings, each with question, answer, date and scope (§3.1) |
| Baselines account for task-created artifacts | **Yes** — §18 row 9; the baseline is deliberately captured after story creation |
| Dirty-worktree handling | **Yes** — clean start asserted with a stop condition (§13.2, A5) |
| Gates prove the changed behavior | **Yes** — AC6 is a byte-identity comparator that fails on any drift; AC7 is a measured numeric prediction with an explicit third-value stop; AC10 asserts observable dispatch and an emitted class, not implementation detail |
| Single active owner route | **Yes** — the only forks are A1's measurement stop condition and A5's dirty-worktree stop |
| API claims verified, not assumed | **Yes** — §3.4 reads the installed `@mantine/core` 8.3.18 `Box.cjs` and `MantineClasses.cjs`; §3.5 reads the gate's own blank-screenshot threshold |

**Known-risk note for the reviewer.** Three likely defects. First, writing the Story with the production hide
active, producing four blank `desktop-1024` cells — §3.5 predicts the exact failure mode; check that the Story
omits `hideFromMd`. Second, skipping the I2 baseline and asserting "no visual change" from reading the diff —
without the baseline directory there is no comparator, and AC6 cannot be satisfied by argument. Third,
"helpfully" re-adding `hover:bg-muted` or `max-sm:min-h-11` to make the `UnstyledButton` "match" — those classes
came from `cva` and are not part of the preserved contract; their removal must be *proven harmless* by AC6, not
prevented by reintroducing them.
