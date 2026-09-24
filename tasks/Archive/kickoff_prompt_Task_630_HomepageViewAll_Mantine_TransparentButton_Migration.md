# Task 630 — Migrate the homepage **"view all"** links from legacy shadcn `buttonVariants` to the canonical Mantine `Button variant="transparent"` (§6a-link tertiary)

- **Task number:** 630
- **Epic:** MM — Mantine/TailAdmin Restyle (`tasks/Epics/Epic_MM_Mantine_UI_Migration.md`), MM.10 tail (public pages + residual `src/components/ui/*` primitives).
- **Parent / origin:** Homepage legacy-audit (2026-07-19), the same audit that produced Task 629. This is a separate, smaller follow-up surface named in Task 629's own "Out of scope".

## Mode and task type

- **Mode:** implementation kickoff for a fresh Sonnet session (execute via `.claude/skills/execute-task/SKILL.md`).
- **Task type:** UI / component migration — **Mantine current path** (replace a legacy shadcn control with an already-canonical, already-gated Mantine primitive). Not a critical-flow task.
- **QA profile:** **Q3 Full Visual Matrix** (migrated Mantine control + TailAdmin conformance slice on a public page). No Q4 — "view all" is not in `docs/critical-flow-registry.md`.

## Objective

Replace the two identical legacy "view all" links on the homepage — currently `cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'max-sm:w-auto')` wrapping a `next/link` `<Link>` — with the project's **existing canonical Mantine `Button variant="transparent"`** (the §6a-link "link/tertiary" style, already themed in `theme.ts` and already CI-gated in `Mantine/Primitives/Button`), rendered as `Button component={Link}`. Consolidate the two identical usages into one shared client island (`ViewAllLink`), remove the now-unused `buttonVariants`/`cn` imports at each site, and change nothing else. Net effect: the last homepage `buttonVariants` "view all" usages leave the legacy shadcn button surface and adopt the canonical TailAdmin-conformant Mantine tertiary button.

## Verified context

All facts below were inspected in the repo on 2026-07-19.

- **The two call sites are byte-identical in pattern:**
  - **`src/app/[locale]/page.tsx` L52–57 (Latest-listings "view all"):** server component; `<Link href={`/${locale}/listings`} className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'max-sm:w-auto')}>{tl('view_all')}</Link>`, where `tl = getTranslations('listing')`. `buttonVariants` is imported L8, `cn` L9; **both are used only at L54** in this file (grep-confirmed) → both imports become removable.
  - **`src/modules/listings/components/FeaturedListings.tsx` L47–53 (Featured "view all"):** client component; same `className`, `href={`/${locale}/listings?premium=true`}`, label `t('view_all')` (`t = useTranslations('listing')`), **conditionally rendered** by `{!loading && listings.length > 0 && (…)}`. `buttonVariants` imported L9; confirm whether `cn` is still used elsewhere in the file before removing it.
- **i18n:** `listing.view_all` exists in all four locales (`sq:"Shiko të gjitha"`, `en:"View all"`, `uk:"Переглянути всі"`, `it:"Vedi tutti"`). **No new string is introduced.**
- **The canonical Mantine target already exists and is already gated:** `src/stories/mantine/primitives/Button.stories.tsx` (title `Mantine/Primitives/Button`) renders a dedicated section **"link / tertiary (§6a-link) — transparent, no border, no hover fill"** using `Button variant="transparent"` (no-icon, with-icon, destructive). This story is under the `Mantine/Primitives/` prefix, so it is permanently enforced by `scripts/check-stories-rendered.mjs --mantine-only`. **The button's own chrome is therefore already proven by the standing gate — this task does NOT create a new story and does NOT need to re-prove the button's appearance.**
- **The `transparent` variant is themed as the single source of truth** in `docs/tailadmin-style-reference.md` §6a-link (P0, Task 587) and `src/design-system/mantine/theme.ts`: resting `color:#344054 (gray-700) · background:transparent · border:none · 14px/500 · padding 8px 12px · gap 12px`, **hover = text-darken only (no fill)**, and the theme's Button `minHeight: 2.75rem` (44px) touch floor already applies. `color="red"` is only for destructive/logout (not this case).
- **Precedent (directly analogous):** Task 621 migrated the homepage Agent-CTA to a canonical Mantine `Button` via a thin `'use client'` island `src/components/shared/AgentCtaButton.tsx` (`Button component={Link} href={…} variant=… size="sm" w={{ base:'100%', sm:'auto' }}`). Mirror that island shape. Task 621 also established that the homepage is an **app route**, not a Storybook story, so `screenshots:responsive`/`screenshots:assert` cannot capture the `/[locale]` "Latest" instance — an **ad-hoc Playwright app-route capture** was used. `FeaturedListings` **does** have a Storybook story (`System/FeaturedListings`, `src/stories/FeaturedListings.stories.tsx`) — but under the `System/` prefix, so it is **not** in the `--mantine-only` gate either; it can still be captured via a Storybook render.
- **Cascade-layer constraint (Tasks 602/606/612/629, verified again for 629):** `@mantine/core` ships **unlayered** CSS (`src/app/layout.tsx` + `.storybook/preview.tsx` both import `@mantine/core/styles.css`, zero `@layer`), which unconditionally beats Tailwind `@layer utilities`. Therefore the migrated control's visual values must come from the **themed Mantine variant / props / `styles`**, never from Tailwind `className` on the `Button` (any `bg`/`color`/`height`/`padding`/`display` Tailwind class on a styled Mantine Button is silently overridden).
- **Not a critical flow:** `docs/critical-flow-registry.md` lists the homepage's authenticated **header** hydration and the **ListingCard** rendering flows — **not** the body "view all" links. This task touches neither the header nor `ListingCard`.

## Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | User / Epic MM / clause 16 | Both "view all" call sites render via the canonical Mantine `Button` primitive with `variant="transparent"` (§6a-link tertiary), `component={Link}` — no `buttonVariants` call remains at either site | P0 | Source diff; grep `buttonVariants` gone from both files; rendered proof shows the transparent tertiary button | Confirmed |
| R2 | `docs/component-rules.md` (no-duplicate / container-presentational) | The two identical usages are consolidated into **one** shared client island `src/components/shared/ViewAllLink.tsx` (props `href`, `label`), mirroring `AgentCtaButton`; both sites import and render it | P1 | Diff shows one new island + two call sites using it | Confirmed (recommended design; see open questions) |
| R3 | Agent-contract cl. 1 (bounded scope) | The now-unused `buttonVariants` import (and `cn`, iff it becomes unused) is removed from `page.tsx` and `FeaturedListings.tsx`; **no other `buttonVariants` call site anywhere in the repo is touched** | P0 | grep both files (0 `buttonVariants`/dead `cn`); `git diff` scoped to exactly the 3 source files (+ island) | Confirmed |
| R4 | clause 16 / TailAdmin §6a-link | The migrated control conforms to the themed `transparent` tertiary spec (transparent bg, **no hover fill**, 14px/500, gray-700→`--foreground`, radius 8, ≥44px mobile touch) — i.e. it deliberately **does not** preserve the legacy ghost/sm pixels; the intended before→after delta (14px vs 12.8px text; no `hover:bg-muted` fill; ≥44px touch vs 28px) is expected and documented, not a defect | P0 | Q3 rendered matrix + TailAdmin side-by-side (§6a-link row) | Confirmed |
| R5 | Agent-contract cl. 3/5 | Both links preserve destination and conditional presence: Latest → `/${locale}/listings`; Featured → `/${locale}/listings?premium=true`, still gated on `!loading && listings.length > 0`; label stays `listing.view_all` in all four locales; no new user-facing string | P0 | Diff + rendered nav; `npm run check:i18n` unchanged | Confirmed |
| R6 | Q3 | Rendered proof across the Q3 matrix (all required widths × sq/en/uk/it) for **both** surfaces — the `System/FeaturedListings` story (Featured) and the `/[locale]` app route (Latest) — showing correct localized label, placement beside the section heading, and no clip/overflow at 320/375/390 (incl. `uk@320`) | P0 | `System/FeaturedListings` Storybook render + ad-hoc app-route Playwright capture (Task 621 methodology) | Confirmed |
| R7 | clause 11 / cascade-layer | All visual values come from the themed Mantine `transparent` variant (props/theme/`styles`), never Tailwind `className` on the `Button`; the ≥44px mobile touch target is preserved (theme `minHeight` 44px) | P1 | Source inspection + computed-style spot check (`minHeight`, `background` transparent, hover no-fill) | Confirmed |
| R8 | Homepage hydration adjacency | Adding the island introduces no new hydration/console error on `/[locale]` (guest and authenticated); the **header** hydration critical flow is untouched (this task edits neither `Header*.tsx` nor `NotificationBell*`) | P1 | `npm run check:hydration` route console clean (or ad-hoc console capture on `/[locale]`); diff shows no header files touched | Confirmed |

## Assumptions and open questions

- **OPEN — owner decision (button size):** `size="sm"` (compact, sits neatly inline next to the section `<h2>` — **recommended**; the theme still enforces the 44px mobile touch floor) **vs.** default `md`. Recommend `size="sm"`; confirm.
- **OPEN — owner decision (trailing/leading icon):** keep the control **text-only** (matches the current "view all", which has no icon — **recommended**, avoids introducing a new visual element) **vs.** add the §6a-link optional `leftSection={<ArrowRight/>}`. Recommend text-only.
- **Assumption (reversible):** one shared client island `src/components/shared/ViewAllLink.tsx` (`'use client'`, props `{ href: string; label: string }`) mirroring `AgentCtaButton`; used by the server `page.tsx` (Latest) and the client `FeaturedListings.tsx` (Featured). If the owner prefers inlining `Button component={Link}` at each site, the visual result is identical — but the shared island satisfies no-duplicate.
- **Resolved by policy (not an open question):** the "zero pixel change vs canonical values" tension is resolved toward **canonical TailAdmin values** — clause 16 requires migrated UI to trace to TailAdmin, the `transparent` variant is the established single source of truth (§6a-link), and it is already built + gated. Pixels intentionally change per R4.
- **STOP-AND-ASK:** if matching the §6a-link spec turns out to require touching `theme.ts`, the header, `ListingCard`, or any other `buttonVariants` site, **stop and surface it** rather than widening scope.

## Pre-read rule bundle

- `docs/agent-contract.md` (clauses 1 scope, 3 reachable controls, 5 UX flows, 11 mobile/touch target, 14 file integrity, 16/16a TailAdmin visual source).
- `docs/rule-index.md` (Current Mantine path routing).
- `docs/tailadmin-style-reference.md` — the **§6a-link note** row (the single source of truth for the themed `transparent` tertiary button) and the Button table L75–L77.
- `docs/mantine-responsive-design-system.md` (Mantine `Button`, themed variants, `visibleFrom` not needed here).
- `docs/component-rules.md` ("Container / Presentational split", no-duplicate, i18n).
- `docs/qa-profiles.md` (Q3 evidence requirements).
- `docs/storybook-governance.md` (why `Mantine/Primitives/Button` is the gated proof of the button chrome; no new story needed; no viewport-duplicate sections).
- Source: `src/app/[locale]/page.tsx`, `src/modules/listings/components/FeaturedListings.tsx`, `src/components/shared/AgentCtaButton.tsx` (island precedent), `src/stories/mantine/primitives/Button.stories.tsx` (canonical target), `src/stories/FeaturedListings.stories.tsx`, `src/design-system/mantine/theme.ts` (transparent variant + `minHeight`), and `package.json` (`screenshots:assert`, `check:i18n`, `check:mojibake`, `check:hydration`, `typecheck`).

## Scope

1. Create `src/components/shared/ViewAllLink.tsx` — a thin `'use client'` island mirroring `AgentCtaButton`, rendering `Button component={Link} href={href} variant="transparent" size="sm"` (per the open questions) with the label as children. No Tailwind styling classes on the `Button` (R7); rely on the themed variant. Width behavior: the current control is auto-width even on mobile (`max-sm:w-auto`), so **do not** set `fullWidth`/`w={{base:'100%'}}` — leave it auto (inline), matching the current placement beside the heading.
2. In `src/app/[locale]/page.tsx`: replace the L52–57 `<Link …>` with `<ViewAllLink href={`/${locale}/listings`} label={tl('view_all')} />`; remove the now-unused `buttonVariants` and `cn` imports (grep-confirm no other use in the file).
3. In `src/modules/listings/components/FeaturedListings.tsx`: replace the L47–53 `<Link …>` (keep the `!loading && listings.length > 0` guard) with `<ViewAllLink href={`/${locale}/listings?premium=true`} label={t('view_all')} />`; remove `buttonVariants` (and `cn` iff now unused).
4. Produce the Q3 rendered matrix for both surfaces + TailAdmin §6a-link side-by-side, and confirm no new hydration/console error on `/[locale]`.
5. Write the session log + concise backlog update per the completion contract.

## Out of scope

- Any **other** `buttonVariants` call site (auth pages, admin, `ListingContact`, `FavoritesShell`, `ListingMobileCTA`, `AdminListingsTable`, `WhatsAppContactButton`, etc.) — this task is the homepage "view all" only.
- `ListingCard` / `MantineListingCardPattern`, `LatestListings`/`FeaturedListings` **card** rendering, the section shells/headings, "How it works", the Hero shell, the Agent-CTA section (separate homepage-audit follow-ups).
- The header and its hydration critical flow; `theme.ts`; `globals.css`; `container-wide`; the `Mantine/Primitives/Button` story and its i18n keys.
- Adding an icon or changing the size beyond the resolved open questions.

## Current and required behavior

- **Current:** each homepage "view all" is a `next/link` `<Link>` styled by shadcn `buttonVariants({ variant:'ghost', size:'sm' })` + `max-sm:w-auto` — foreground text, `hover:bg-muted` fill, `text-[0.8rem]` (12.8px), `font-medium`, `h-7` (28px desktop, auto width, 44px min-height on mobile), radius `min(--radius-md,12px)`. Latest → `/{locale}/listings`; Featured → `/{locale}/listings?premium=true` (shown only when there are featured listings).
- **Required after:** each is the canonical Mantine `Button variant="transparent"` (`component={Link}`) via the shared `ViewAllLink` island — transparent, no hover fill, 14px/500, gray-700→`--foreground`, radius 8, ≥44px touch (themed). Same destinations, same conditional presence, same localized `listing.view_all` label. `buttonVariants` no longer referenced by either homepage file. Visual delta per R4 is intended.

## Positive and negative flows

**Positive:** load `/{locale}` → the "Latest listings" heading row shows a transparent tertiary "view all" → clicking routes to `/{locale}/listings`; when featured listings exist, the "Featured" heading row shows the same control → clicking routes to `/{locale}/listings?premium=true`; both render the localized label in all four locales with no overflow at 320/375/390; ≥44px touch target on mobile.

**Negative-flow applicability table:**

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Featured empty / loading (`!loading && listings.length>0` false) | **Yes** | R5 | Featured "view all" is absent while loading or when there are no featured listings — unchanged guard | FeaturedListings story states + source diff |
| Locale expansion (uk/it long "view all" labels) | **Yes** | R6 | Label localized, no clip/overflow at 320; `uk@320` mandatory | Rendered matrix, uk@320 |
| Small viewport / touch target | **Yes** | R7/clause 11 | Auto-width inline next to heading; ≥44px min touch height on mobile | Computed-style `minHeight`; rendered 320/375/390 |
| Cascade-layer override (Mantine unlayered CSS vs Tailwind) | **Yes** | R7 | No Tailwind styling class on the Button; themed variant controls all visuals; hover shows no fill | Source inspection + hover computed-style |
| Hydration/console on `/[locale]` (guest + authed) | **Yes** | R8 | No new hydration/console error; header flow untouched | `check:hydration` route console / ad-hoc capture |
| Validation / RLS / network / concurrent writer | No | Presentational navigation control; no data, auth decision, or write path | N/A | — |

## Acceptance criteria

- `AC1 [R1,R3]` Given both files after the change, when the diff is inspected, then neither `page.tsx` nor `FeaturedListings.tsx` references `buttonVariants`, both render `ViewAllLink` (canonical `Button variant="transparent"` `component={Link}`), and no other `buttonVariants` site is modified.
- `AC2 [R2]` Given the two call sites, when inspected, then exactly one shared island `src/components/shared/ViewAllLink.tsx` implements the control and both sites consume it with the correct `href`/`label`.
- `AC3 [R4,R7]` Given the rendered control, when compared to the TailAdmin §6a-link row, then it is transparent with no hover fill, 14px/500, foreground/gray-700 text, radius 8, ≥44px mobile touch — with visuals sourced from the themed variant, not Tailwind classes.
- `AC4 [R5]` Given both links, when clicked/inspected, then Latest routes to `/{locale}/listings` and Featured to `/{locale}/listings?premium=true` (only when featured listings exist), with the localized `listing.view_all` label in all four locales and no new string.
- `AC5 [R6]` Given the `System/FeaturedListings` story and the `/{locale}` app route across all four locales × the required Q3 widths, when captured, then the control renders correctly with no clip/overflow (incl. `uk@320`).
- `AC6 [R8]` Given `/{locale}` guest and authenticated, when loaded after the change, then there is no new hydration/console error and no header file is in the diff.

## QA profile and verification plan

**Profile: Q3 Full Visual Matrix (migrated Mantine tertiary button on a public page + TailAdmin conformance).** Record actual output for each:

1. `npm run typecheck` → 0 errors (Q1 base).
2. **Rendered — Featured:** capture the `System/FeaturedListings` story (populated state, "view all" visible) at the Q3 widths × sq/en/uk/it. Paste the relevant frames; confirm no clip/overflow at 320/375/390.
3. **Rendered — Latest (app route):** ad-hoc Playwright capture of `/{locale}` (Task 621 methodology — `next dev` or `storybook`-static is not applicable to the app route) at the Q3 widths × sq/en/uk/it, `uk@320` mandatory; confirm localized label + placement + no overflow.
4. **TailAdmin side-by-side:** compare the rendered control to the §6a-link row (transparent, no hover fill, 14/500, radius 8, ≥44px). Include a hover capture proving **no fill** appears on hover.
5. **Touch target / cascade:** computed-style spot check — `background` transparent, `minHeight` ≥ 44px on mobile, and that no Tailwind styling class is present on the Button (`className` empty or layout-only).
6. `npm run check:i18n` → unchanged key parity (no new string) (AC4).
7. `npm run check:hydration` (route console) on `/{locale}` guest + authenticated, or an ad-hoc console capture → no new hydration/console error (AC6). Confirm the diff contains no header/`NotificationBell`/`ListingCard` file.
8. File-integrity: touched files stay UTF-8 no-BOM, no mojibake (`npm run check:mojibake`) (clause 14).
9. `git status --short` / `git diff --stat` → only `src/components/shared/ViewAllLink.tsx` (new), `src/app/[locale]/page.tsx`, `src/modules/listings/components/FeaturedListings.tsx` (+ the session log and `docs/backlog.md`). Any other source path → empty (R3).

If any required check cannot run in the sandbox (native binary / timeout), record it as missing evidence and provide the exact owner-native PowerShell command + expected result; never substitute a confidence claim (clause 9). Note: the `Mantine/Primitives/Button` chrome is already covered by the standing `screenshots:assert --mantine-only` gate — do **not** add a new Button story or a viewport-duplicate section (storybook-governance).

## Completion report contract

Write `docs/sessions/2026-07-19-task630-homepage-viewall-mantine-transparent-button.md` + a concise `docs/backlog.md` update (keep ≤80 lines; do not add long history). Include: a Files Changed table matching the real diff; R1–R8 each with evidence; the typecheck/i18n/mojibake/hydration results; the Featured-story and Latest-app-route rendered matrices (locations) + the TailAdmin §6a-link side-by-side incl. the hover-no-fill proof; the resolved values of the two open questions (size + icon) as actually implemented; explicit confirmation that no other `buttonVariants` site, no header file, and no `ListingCard`/`theme.ts`/`globals.css` was touched. Final status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED` — never self-approval. Do not run or emit mutating git.

Handoff: execute via `.claude/skills/execute-task/SKILL.md` against this file path.

## Task quality gate

- A fresh Sonnet session can execute this without chat context: the exact two call sites (files + lines + current classes + hrefs + label namespaces), the canonical already-gated target (`Mantine/Primitives/Button` `variant="transparent"` §6a-link), the island precedent (`AgentCtaButton`), the cascade-layer constraint, the two open questions with recommended defaults, and the proof paths are all named. ✅
- Every P0 requirement has a binary AC and a verification method. ✅
- Scope protects existing behavior and names what must not change (other `buttonVariants` sites, header, `ListingCard`, `theme.ts`, `globals.css`, the Button story). ✅
- Current/legacy boundary is explicit (legacy shadcn `buttonVariants` → canonical themed Mantine `transparent`); Q3 profile + locale/viewport needs + the "no new story" Storybook obligation stated. ✅
- Visual source map traces the current ghost/sm classes and the target §6a-link tokens; the before→after delta is declared intended, not a regression. ✅
- Negative flows are selected by applicability (featured-empty, locale, touch/viewport, cascade, hydration-adjacency in; validation/RLS/network/concurrency out with reason). ✅
- Assumptions and the two owner decisions are visible to the executor and reviewer. ✅

## Visual source map

| Visible artifact/state | Component/markup | Class/selector | Utility, cascade, and token path | Disposition | Evidence |
|---|---|---|---|---|---|
| "view all" control — resting | `<Link className={cn(buttonVariants({variant:'ghost',size:'sm'}),'max-sm:w-auto')}>` → `Button variant="transparent" component={Link}` (via `ViewAllLink`) | ghost: `text-foreground` + base `text-sm`; sm: `h-7 px-2.5 text-[0.8rem] rounded-[min(--radius-md,12px)] gap-1` + `max-sm:w-auto` | legacy: `--foreground`, off-scale 12.8px, 28px height; **target:** themed `transparent` variant → `--foreground`/gray-700, 14px/500, radius 8, transparent bg, `minHeight` 44px (theme.ts / §6a-link) | **Change (intended delta, R4)** | Q3 rendered + TailAdmin §6a-link side-by-side |
| "view all" — hover | same | ghost: `hover:bg-muted hover:text-foreground` | legacy: `--muted` fill on hover; **target:** `transparent` variant = **text-darken only, NO fill** (§6a-link) | **Change (intended: hover fill removed)** | Hover computed-style capture (no `background` change) |
| Mobile touch target | same | sm: `max-sm:min-h-11` (44px) + `max-sm:w-auto` | legacy: 44px min-height, auto width on mobile; **target:** theme `minHeight:2.75rem` (44px), auto width (no `fullWidth`) | **Preserve (≥44px kept)** | Computed-style `minHeight` at ≤640 |
| Destination + conditional presence | `page.tsx` L52 / `FeaturedListings.tsx` L47 | `href`, `{!loading && listings.length>0}` guard | routing/i18n unchanged | **Preserve (out of scope to change)** | Diff + rendered nav |
| Button chrome (the `transparent` primitive itself) | `Mantine/Primitives/Button` story §6a-link section | `variant="transparent"` | already themed + CI-gated | **Preserve (reuse, do not re-prove/re-story)** | Standing `screenshots:assert --mantine-only` gate |
