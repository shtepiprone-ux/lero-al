# Task 629 — Migrate the remaining HeaderView **chrome** (shell + logo + desktop nav) from raw Tailwind HTML to Mantine layout primitives

- **Task number:** 629
- **Epic:** MM — Mantine/TailAdmin Restyle (`tasks/Epics/Epic_MM_Mantine_UI_Migration.md`), Phase 3 header tail.
- **Parent / origin:** Homepage legacy-audit (2026-07-19). The header behavior controls (hamburger `ActionIcon`, `LocaleSwitcher`, `HeaderActions`, `UserMenu`, `MobileNavDrawer`) are already Mantine, but the **structural chrome** of `HeaderView.tsx` — the `<header>` bar, the container row `<div>`, the logo `<Link>`, the desktop `<nav>` + module-level `NavLinks`, and the desktop `UserMenu` wrapper `<div>` — is still raw HTML styled with legacy Tailwind semantic tokens. This task migrates that chrome to Mantine layout primitives. It is the tail of the already-decomposed header, not a rebuild.

## Mode and task type

- **Mode:** implementation kickoff for a fresh Sonnet session (execute via `.claude/skills/execute-task/SKILL.md`).
- **Task type:** UI / Layout / Component — **Mantine current path** (migration of a legacy structural surface onto Mantine primitives). Also a **critical-flow** task: the header appears in `docs/critical-flow-registry.md` (P0 "Authenticated header hydration — NotificationBell SSR shell").
- **QA profile:** **Q3 Full Visual Matrix** (navigation/header surface) **layered with Q4 critical-flow regression** for the header hydration id-parity flow. See "QA profile and verification plan".

## Objective

Replace the raw HTML structural scaffolding in `src/components/layout/HeaderView.tsx` (`<header>`, the two flex `<div>`s, the logo `<Link>` content wrapper, the desktop `<nav>`, and the `NavLinks` anchors) with Mantine layout primitives (`Box component="header"`, `Group`, `Anchor`, `Text`), **preserving every current visual value, the Task 590 sub-390px responsive wrap, all controls/entry points, and — critically — the hydration-safe tree shape and `useId` stability**. Behavior, routing, auth wiring, and the already-Mantine sub-primitives are untouched. Net effect: the header shell joins the Mantine-governed set with zero user-visible pixel change and zero behavior change.

## Verified context

All facts below were inspected in the repo on 2026-07-19.

- **Target file:** `src/components/layout/HeaderView.tsx` (173 lines). It already imports `ActionIcon` from `@mantine/core` (the hamburger). The remaining legacy chrome, verbatim:
  - **L85 — header bar:** `<header className="site-header sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">`
  - **L97 — container row (Task 590 wrap):** `<div className="container-wide flex flex-wrap min-[390px]:flex-nowrap items-center justify-between gap-2 py-2 min-[390px]:h-16 min-[390px]:py-0">`
  - **L99–L102 — logo:** `<Link href={`/${locale}`} className="flex items-center gap-1 font-bold text-xl"><span className="text-primary">Lero</span><span className="text-foreground">.al</span></Link>`
  - **L105 — desktop nav:** `<nav className="hidden md:flex items-center gap-6"><NavLinks /></nav>`
  - **L113 — right cluster (Task 590 wrap):** `<div className="flex items-center w-full justify-between gap-2 min-[390px]:w-auto min-[390px]:justify-start">`
  - **L134 — desktop UserMenu wrapper:** `<div className="hidden md:flex items-center gap-2">`
  - **L25–L46 — `NavLinks`:** a module-level component (two `next/link` `<Link>`s, each `className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"`). Its L14–L24 header comment documents that it is defined at module level **on purpose** so React sees a stable component type across renders — moving it into the render body shifts the fiber id counter and breaks Base UI/Mantine `useId()` (hydration mismatch).
- **Already Mantine (DO NOT TOUCH):** hamburger `ActionIcon` (L148–157), `LocaleSwitcher`, `HeaderActions`, `UserMenu`, `MobileNavDrawer`, `NotificationBell` slot. Each imports `@mantine/core` and is out of scope here.
- **Container/presentational split:** `Header.tsx` (container) owns all hooks/state and passes plain props + slots to `HeaderView.tsx` (presentational). `HeaderView` itself calls only `useTranslations`/`useLocale` (i18n, allowed in a presentational primitive).
- **Existing Storybook proof path:** `src/stories/mantine/primitives/HeaderView.stories.tsx` — title `Mantine/Primitives/HeaderView`, one `Default` story rendering a **guest** and an **authenticated** `HeaderView` (closed state, `mobileOpen=false`, `authSheetSlot={null}`). It is under the exact `Mantine/Primitives/` prefix that gives it **permanent enforcement** in `scripts/check-stories-rendered.mjs --mantine-only`. This is the rendered-proof surface for this task; no new story file is needed.
- **Critical flow (P0):** `docs/critical-flow-registry.md` → "Authenticated header hydration — NotificationBell SSR shell" binds `Header.tsx`/`HeaderView.tsx`/`LocaleSwitcher`/`UserMenu`/`NotificationBell`. Authoritative regression test: `src/components/layout/__tests__/header-hydration-id-parity.test.tsx`, run via `npm run test:header-hydration-id-parity` (defined in `package.json` L74). It is a deterministic jsdom dual-phase `renderToString`→`hydrateRoot` harness asserting on React's `onRecoverableError`, with a proven planted-violation. Clause 15 applies: this task must record the green baseline before changing anything and prove it still passes after.
- **Migration tracker:** `docs/mantine-responsive-design-system.md` (Section 10 tracker) lists `Header.tsx` as `MIGRATE TO MANTINE` / Phase 3 / "Complex: auth state + locale switching". That row predates the header decomposition + the `HeaderView` story (both landed since) and should be reconciled by the orchestrator at review, not by Sonnet.
- **Legacy semantic tokens in play:** `bg-background`, `text-foreground`, `text-primary`, `border-b` (the `--border` color), `backdrop-blur`. These are legacy shadcn/Tailwind CSS-variable tokens defined in `src/app/globals.css`. Whether to keep them verbatim or remap to Mantine theme tokens is an **open question** (below) — the default is to keep them verbatim to guarantee zero pixel change.

## Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | This task | The `<header>`, container `<div>` (L97), logo `<Link>` content wrapper, desktop `<nav>` (L105), `NavLinks` anchors, and desktop `UserMenu` wrapper `<div>` (L134) are re-expressed with Mantine layout primitives (`Box component="header"`, `Group`, `Anchor`, `Text`) instead of raw `<header>/<div>/<nav>` + bare `<Link>` scaffolding | P0 | Source diff; no raw structural `<div className="flex …">` chrome remains in `HeaderView` except where a Mantine primitive cannot express it (documented) | Confirmed |
| R2 | Agent-contract cl. 3/5 | Every existing control and entry point stays present and reachable with identical behavior: home/listings nav links, logo→home link, desktop nav (≥md), hamburger (<md), LocaleSwitcher, HeaderActions (favorites/notification/guest auth), desktop UserMenu (authed, ≥md), MobileNavDrawer | P0 | RTL/interaction check + rendered proof at required viewports; grep that all sub-primitives + their props are unchanged | Confirmed |
| R3 | Task 590 | The sub-390px responsive contract is preserved **byte-for-byte in behavior**: <390px the logo sits on row 1 and the control cluster wraps to a full-width row 2 (`justify-between`); ≥390px is the single-row `h-16` layout. The `min-[390px]:` custom arbitrary breakpoint is retained (no new theme/Tailwind named breakpoint added) | P0 | Rendered proof at 320 and 390; DOM/computed-style check that the wrap still triggers only below 390 | Confirmed |
| R4 | Critical-flow cl. 15 | The header hydration id-parity flow still passes: `NavLinks` (or its replacement) keeps a **stable module-level component identity**; the SSR↔client tree shape is unchanged; `npm run test:header-hydration-id-parity` is green after the change, and its existing planted-violation still fails | P0 | `npm run test:header-hydration-id-parity` transcript (baseline + post-change); confirm `NavLinks` is still defined at module scope | Confirmed |
| R5 | Q3 | Zero user-visible pixel change at every required viewport/locale: header height, sticky+blur+border chrome, logo weight/size/colors, nav link size/weight/hover, spacing, and right-cluster order are visually identical to pre-change | P0 | `HeaderView` story rendered matrix (all four locales × required widths) + side-by-side against a pre-change capture | Confirmed |
| R6 | Boundary | No change to `Header.tsx`, the sub-primitives (`LocaleSwitcher`/`HeaderActions`/`UserMenu`/`MobileNavDrawer`/`ActionIcon` hamburger/`NotificationBell`), routing, auth wiring, i18n keys, `globals.css` tokens, or `container-wide`. Only `HeaderView.tsx` (and, if strictly required for the story, the existing `HeaderView.stories.tsx`) changes | P0 | `git status`/diff scoped to `HeaderView.tsx` (+ optionally its story); grep the sub-primitive call sites unchanged | Confirmed |
| R7 | i18n | `nav.home`, `nav.listings`, and `common.aria_open_menu` continue to resolve in all four locales; no new user-facing string is introduced (chrome-only migration) | P1 | `npm run check:i18n` unchanged; rendered proof shows localized nav labels | Confirmed |

## Assumptions and open questions

- **OPEN — owner decision (semantic header element):** keep the semantic `<header>` via **`Box component="header"`** (preserves the `<header>` landmark, the `.site-header` selector, and the exact DOM the hydration test asserts against — **recommended, minimal blast radius**) **vs.** adopt Mantine `AppShell.Header`, which would force restructuring `src/app/[locale]/layout.tsx` into an `AppShell` and materially raises hydration risk. **Recommend `Box component="header"`; do not introduce `AppShell` in this task.** Confirm before implementing.
- **OPEN — owner decision (token strategy):** keep the legacy semantic classes (`bg-background/95`, `text-foreground`, `text-primary`, `border-b`, `backdrop-blur`, `supports-[backdrop-filter]:…`) **verbatim** on the new Mantine primitives (guarantees zero pixel change; permitted by the UI rule split, which assigns visual chrome to Tailwind/TailAdmin) **vs.** remap to Mantine theme tokens. **Recommend keep verbatim** — a token remap is a separate, visual-risk task and would break the "zero pixel change" acceptance. Do not remap here unless the owner directs it.
- **Assumption (reversible):** `container-wide` stays as-is (it is a shared width token used by the footer and homepage sections too; redefining it is out of scope). If a Mantine `Container` is preferred later, that is a separate task.
- **Assumption:** the Task 590 `min-[390px]:` utilities remain the mechanism for the sub-390 wrap, applied as `className` on the Mantine `Group` (the rule split explicitly allows Tailwind chrome/spacing on Mantine components). A 390px custom breakpoint cannot be expressed via Mantine's named breakpoints without adding one, which is undesired.
- **STOP-AND-ASK:** if faithfully preserving the tree/hydration parity or the Task 590 wrap turns out to be impossible without changing `Header.tsx`, the layout, or a sub-primitive, **stop and surface it** rather than widening scope.

## Pre-read rule bundle

- `docs/agent-contract.md` (clauses 1 scope, 3 reachable controls, 4 no accidental read-only, 5 UX flows, 11 mobile/overlay, 14 file integrity, 15 critical-flow regression).
- `docs/mantine-responsive-design-system.md` (current Mantine layout primitives: `Box`/`Group`/`Anchor`/`Text`, `visibleFrom`/`hiddenFrom`, and Section-10 tracker context).
- `docs/tailadmin-style-reference.md` (visual source of truth for header chrome values — confirm the border/background/typography values you preserve).
- `docs/component-rules.md` ("Container / Presentational Primitive Split"; i18n; no-duplicate).
- `docs/ui-rules.md` (current/legacy routing + rule-split boundary notes only).
- `docs/qa-rules.md` (validation, encoding, mojibake).
- `docs/qa-profiles.md` (Q3 evidence + Q4 critical-flow regression).
- `docs/critical-flow-registry.md` → "Authenticated header hydration — NotificationBell SSR shell" (the flow this task must preserve).
- `docs/storybook-governance.md` (Mantine `--mantine-only` rendered-assert proof path; no viewport-duplicate sections).
- `src/components/layout/HeaderView.tsx`, `src/stories/mantine/primitives/HeaderView.stories.tsx`, `src/components/layout/__tests__/header-hydration-id-parity.test.tsx`, and `package.json` (the `test:header-hydration-id-parity` + `screenshots:assert` scripts).

## Scope

1. In `src/components/layout/HeaderView.tsx`, replace the raw structural chrome with Mantine layout primitives:
   - `<header …>` → `Box component="header"` carrying the same `site-header sticky top-0 z-30 …` classes (per the token open-question default: verbatim).
   - Container row `<div>` (L97) → Mantine `Group` (or `Box`) retaining the Task 590 `container-wide flex flex-wrap min-[390px]:flex-nowrap … min-[390px]:h-16 min-[390px]:py-0` classes verbatim.
   - Logo `<Link>` inner structure → Mantine `Anchor component={Link}` (or `Anchor` wrapping) with `Text`/`Box` spans for `Lero`/`.al`, preserving `font-bold text-xl` + `text-primary`/`text-foreground`.
   - Desktop `<nav>` (L105) → Mantine `Group visibleFrom="md"` (replacing `hidden md:flex`), gap preserved.
   - `NavLinks` anchors → Mantine `Anchor component={Link}` with the same `text-sm font-medium text-foreground/80 hover:text-foreground transition-colors` visual. **`NavLinks` MUST remain a module-level component** (keep its identity stable per its own L14–L24 comment and R4).
   - Right-cluster `<div>` (L113) → Mantine `Group` retaining the Task 590 wrap classes verbatim.
   - Desktop UserMenu wrapper `<div>` (L134) → Mantine `Group visibleFrom="md"`.
2. Preserve the hamburger `ActionIcon`, all sub-primitive calls, all props, all slots, and all i18n keys exactly.
3. Record the `npm run test:header-hydration-id-parity` green baseline before editing, and re-run it after.
4. Produce the `Mantine/Primitives/HeaderView` rendered matrix and a pre/post side-by-side proving zero pixel change.
5. Write the session log + concise backlog update per the completion contract.

## Out of scope

- `Header.tsx` (container), `src/app/[locale]/layout.tsx`, and any change that introduces Mantine `AppShell` (deferred; see open question).
- Any change to `LocaleSwitcher`, `HeaderActions`, `UserMenu`, `MobileNavDrawer`, the hamburger `ActionIcon`, or `NotificationBell`.
- Remapping legacy semantic tokens to Mantine theme tokens, redefining `container-wide`, or touching `globals.css` (unless the owner flips the token open-question).
- The Task 590 breakpoint value (do not change 390; do not add a named theme/Tailwind breakpoint).
- Any other Homepage legacy surface (ListingCard, FeaturedListings/LatestListings, PopularLocations, page.tsx sections) — those are separate follow-up tasks.
- New user-facing strings or i18n keys.

## Current and required behavior

- **Current:** `HeaderView` renders a sticky, blurred, bottom-bordered `<header>` via raw HTML (`<header>/<div>/<nav>` + bare `<Link>`s) styled with legacy Tailwind semantic tokens; the Mantine sub-primitives are already embedded. Below 390px the logo wraps to row 1 and the control cluster spans a full-width row 2 (Task 590); ≥390px is a single `h-16` row. Header hydration id-parity is protected by `header-hydration-id-parity.test.tsx`.
- **Required after:** identical rendered output and behavior, but the structural chrome is expressed with Mantine `Box`/`Group`/`Anchor`/`Text` primitives. `NavLinks` remains a stable module-level component. The hydration id-parity test still passes (and its planted violation still fails). No pixel, control, route, string, or breakpoint changes.

## Positive and negative flows

**Positive:** load `/{locale}` → header renders sticky/blur/border chrome identical to before → logo links home → desktop nav shows Home/Listings ≥md → hamburger shows <md → right cluster (LocaleSwitcher + HeaderActions + [authed] UserMenu ≥md + hamburger) in the same order → <390px wraps to two rows exactly as before → all links/controls behave identically → `test:header-hydration-id-parity` green.

**Negative-flow applicability table:**

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Hydration mismatch (SSR↔client `useId`) | **Yes** | Critical-flow registry / R4 | No `onRecoverableError`; test green + planted violation still FAILs | `npm run test:header-hydration-id-parity` |
| Authenticated vs guest shell shape | **Yes** | R2/R5 | Both render correct control sets; UserMenu only ≥md + authed; guest shows auth CTAs in HeaderActions | Story guest + authed fixtures, rendered matrix |
| Sub-390px responsive wrap (Task 590) | **Yes** | R3 | Two-row wrap <390, single-row ≥390 | Rendered 320 + 390; computed-style/DOM check |
| Locale expansion (uk/it long nav labels) | **Yes** | R7/Q3 | Nav labels localized, no clip/overflow at 320; `uk@320` mandatory | Rendered matrix, uk@320 |
| md breakpoint desktop-nav vs hamburger swap | **Yes** | R2 | ≥md desktop nav visible + hamburger hidden; <md inverse | Rendered ≥768 and <768 |
| Validation / RLS / network / concurrent writer | No | Presentational chrome only; no data, auth decision, or write path in `HeaderView` | N/A | — |

## Acceptance criteria

- `AC1 [R1,R6]` Given `HeaderView.tsx` after the change, when the diff is inspected, then the `<header>`, container row, logo wrapper, desktop `<nav>`, `NavLinks` anchors, and desktop UserMenu wrapper are Mantine primitives (`Box component="header"`/`Group`/`Anchor`/`Text`), and no file other than `HeaderView.tsx` (optionally its story) is modified.
- `AC2 [R2]` Given both guest and authenticated states, when rendered, then every pre-existing control/entry point is present, in the same order, with identical navigation/auth behavior.
- `AC3 [R3]` Given viewports 320 and 390, when rendered, then <390 shows the two-row wrap and ≥390 the single-row `h-16` layout, with no new named breakpoint added.
- `AC4 [R4]` Given the header hydration id-parity flow, when `npm run test:header-hydration-id-parity` runs after the change, then it passes, the planted violation still FAILs on demand, and `NavLinks` remains module-level.
- `AC5 [R5,R7]` Given the `Mantine/Primitives/HeaderView` story across all four locales × the required Q3 widths, when captured and compared to a pre-change baseline, then the header is visually identical (height, chrome, logo, nav, spacing, order), with localized nav labels and no clip/overflow (incl. `uk@320`).

## QA profile and verification plan

**Profile: Q3 Full Visual Matrix (header/navigation surface) + Q4 critical-flow regression (header hydration id-parity).** Record actual output for each:

1. **Baseline (before edit):** `npm run test:header-hydration-id-parity` → capture green result (AC4 baseline, clause 15).
2. `npm run typecheck` → 0 errors on the touched file (Q1 base).
3. `npm run test:header-hydration-id-parity` (after edit) → green; then demonstrate the existing planted-violation path still FAILs and revert → green (AC4).
4. `npm run screenshots:assert -- --mantine-only` → the `HeaderView` story PASSes at all enforced cells (sq/en/uk/it × the harness's Mantine widths); paste the `HeaderView` line of the summary (AC5). Do not introduce viewport-duplicate story sections (storybook-governance).
5. Rendered pre/post side-by-side of the `Mantine/Primitives/HeaderView` story at minimum 320, 390, 768, 1024, and one desktop width (1440 or 1920), all four locales, `uk@320` mandatory — prove zero pixel change (AC5, R5). If `screenshots:assert` cannot emit a specific required cell, provide the owner-native command + the expected frame and mark that cell provisional.
6. `npm run check:i18n` → unchanged key parity (AC/ R7).
7. File-integrity: `HeaderView.tsx` stays UTF-8 no-BOM, no mojibake (clause 14).
8. `git status --short` → only `src/components/layout/HeaderView.tsx` (+ optionally `HeaderView.stories.tsx`, the session log, and `docs/backlog.md`). `git diff --stat` on any other source path → empty (R6).

If any required check cannot run in the sandbox (timeout/native binary), record it as missing evidence and provide the exact owner-native PowerShell command + expected result; never substitute a confidence claim (clause 9).

## Completion report contract

Write `docs/sessions/2026-07-19-task629-headerview-chrome-mantine-migration.md` + a concise `docs/backlog.md` update (keep ≤80 lines; do not add long history to the backlog). Include: a Files Changed table matching the real diff; R1–R7 each with evidence; the two hydration-test transcripts (baseline + post-change) and the planted-violation demonstration; the `HeaderView` `screenshots:assert --mantine-only` result line; the pre/post rendered comparison locations; the resolved values of the two open questions (semantic element + token strategy) as actually implemented; explicit confirmation that no file outside `HeaderView.tsx` (+ optional story) source was touched. Final status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED` — never self-approval. Do not run or emit mutating git.

Handoff: execute via `.claude/skills/execute-task/SKILL.md` against this file path.

## Task quality gate

- A fresh Sonnet session can execute this without chat context: the exact legacy lines, the target primitives, the hydration constraint, the Task 590 wrap, the story proof path, and the two open questions (with recommended defaults) are all named. ✅
- Every P0 requirement has a binary AC and a verification method. ✅
- Scope protects existing behavior and names what must not change (sub-primitives, layout, tokens, breakpoint). ✅
- Current/legacy UI boundary is explicit (chrome = migrate; sub-primitives = already Mantine, preserve), Q3+Q4 profile and locale/viewport needs stated, Storybook obligation named. ✅
- Visual source map traces each changed artifact and preserved sibling to inspected markup/classes/tokens; a fresh executor can tell the sticky/blur/border chrome and the Task 590 wrap from the sub-primitives. ✅
- Negative flows are selected by applicability (hydration, auth-shape, sub-390 wrap, locale, md-swap in; validation/RLS/network/concurrency out with reason). ✅
- The critical-flow regression gate asserts observable behavior (a real planted-violation exists) and is required, not merely procedural. ✅
- Assumptions and the two owner decisions are visible to the executor and reviewer. ✅
