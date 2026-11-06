# Task 631 — Fix the `System/FeaturedListings` story so it faithfully represents the real homepage Featured surface (add the canonical `ViewAllLink` to its header), removing the false "view all" proof-path gap surfaced by Task 630

- **Task number:** 631
- **Epic:** MM — Mantine/TailAdmin Restyle (governance / Storybook-fidelity tail).
- **Parent / origin:** Task 630 orchestrator review (2026-07-19). Task 630 migrated the two homepage "view all" links to the canonical Mantine `Button variant="transparent"` and, while gathering Q3 proof, discovered that the kickoff-named proof path `System/FeaturedListings` (`src/stories/FeaturedListings.stories.tsx`) does not render the real `FeaturedListings` component or any "view all" control. Task 630 worked around it with a stronger real app-route capture; this task fixes the story so it is no longer a misleading proof path.

## Mode and task type

- **Mode:** implementation kickoff for a fresh Sonnet session (execute via `.claude/skills/execute-task/SKILL.md`).
- **Task type:** Storybook-fidelity fix — legacy `System/*` story (fixture-based mock brought into parity with the real surface it names). Not a product-code change; not a critical flow.

## Objective

Make the `System/FeaturedListings` story an honest representation of the real homepage Featured section header by adding the canonical `ViewAllLink` control (Mantine `Button variant="transparent"`, `src/components/shared/ViewAllLink.tsx`, created by Task 630) beside the story's `<h2>` heading, guarded and localized exactly as the real component. After this task, the story visibly contains the transparent "view all" tertiary control, so a reviewer can legitimately use it as a rendered proof path for the Featured "view all" surface. Change nothing about the real product component, the `ViewAllLink` island, the theme, or any other story.

## Verified context

All facts below were inspected in the repo on 2026-07-19 (Task 630 review).

- **The story does NOT render the real component.** `src/stories/FeaturedListings.stories.tsx` (`title: 'System/FeaturedListings'`) renders a **local** `Header()` = a bare `<h2 className="text-xl sm:text-2xl 2xl:text-3xl font-bold mb-6">{t('featured')}</h2>` (where `t = useTranslations('listing')`), followed by a grid of `StoryListingCard` fixtures from `makeStoryListings(locale)` (`src/stories/StoryListingCard.tsx`). It imports neither `FeaturedListings` nor `ViewAllLink`. Grep `view_all` in the story file → **no match**. Two exports: `Default` (pinned `globals.viewport.value: 'desktop1280'`) and `LocaleStress` (pinned `mobile320`).
- **The real component header** (`src/modules/listings/components/FeaturedListings.tsx` L41–48) is:
  ```tsx
  const header = (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl sm:text-2xl 2xl:text-3xl font-bold">{t('featured')}</h2>
      {!loading && listings.length > 0 && (
        <ViewAllLink href={`/${locale}/listings?premium=true`} label={t('view_all')} />
      )}
    </div>
  )
  ```
  i.e. a **flex `justify-between` row** (not the story's plain `<h2 … mb-6>`), with the `view_all` control shown only when featured listings exist. `t = useTranslations('listing')`, `locale = useLocale()`.
- **`ViewAllLink` is a `'use client'` island** (`src/components/shared/ViewAllLink.tsx`): `<Button component={Link} href={href} variant="transparent" size="sm">{label}</Button>` — no `className`, no Tailwind on the Button; all visuals from the themed variant.
- **i18n:** `listing.view_all` exists in all four locales (`sq/en/uk/it`, key present at `messages/*.json`). **No new string is introduced.** The story already calls `useTranslations('listing')` for `t('featured')`, so `t('view_all')` uses the same namespace.
- **The transparent Button chrome is already CI-gated** by `Mantine/Primitives/Button` under `screenshots:assert --mantine-only`; this task does **not** create a new Button story and does **not** re-prove the button's own appearance.
- **Governance constraints that apply (do NOT violate):**
  - `docs/storybook-governance.md` §13 / §8b: **fix broken stories in place** — do NOT delete, hide, rename, or duplicate the story; do NOT add locale- or width-named exports; keep exports scenario-named; keep the story count unchanged (still exactly `Default` + `LocaleStress`).
  - Locale is toolbar-driven from `context.globals.locale`; no `locale` pins; all user-facing text via the existing `useTranslations('listing')`/`storyT` path (no inline locale maps, no raw English literals — `check:stories` Checks 3/4/7/10).
  - The story is a **legacy `System/*`** path (NOT `Patterns/Mantine/*`), so it keeps `withCanvas`; it is **not** in the `--mantine-only` gate. It **is** enumerated by `check-stories-rendered.mjs` (`screenshots:assert`).

## Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Task 630 review; storybook §1 (visual review foundation) | The `System/FeaturedListings` story header renders the canonical `ViewAllLink` control (Mantine `Button variant="transparent"`) beside the `{t('featured')}` `<h2>`, in a `flex items-center justify-between` row mirroring the real component | P0 | Source diff; rendered story shows the transparent "view all" control beside the heading | Confirmed |
| R2 | Fidelity to real component | The story's header uses the same localized label `t('view_all')` (namespace `listing`) resolved from the toolbar locale, and an `href` that points at the Featured destination pattern `/${locale}/listings?premium=true` (locale from `context.globals.locale`) | P0 | Diff; rendered label localized in sq/en/uk/it | Confirmed |
| R3 | Agent-contract cl. 1 (bounded scope) | No product code, no `ViewAllLink.tsx`, no `theme.ts`, no other story, and no new i18n key is changed; the story keeps exactly two scenario-named exports (`Default`, `LocaleStress`); story count unchanged | P0 | `git diff` scoped to exactly `src/stories/FeaturedListings.stories.tsx` (+ session log + backlog); grep no new export | Confirmed |
| R4 | storybook §8b/§13 (canonical taxonomy) | The change adds no locale-/width-named export, no `locale` pin, no inline locale map, no raw English literal; `check:stories` stays green | P0 | `npm run check:stories` exit 0 | Confirmed |
| R5 | storybook §14.3 (rendered proof) | The story renders correctly (no clip/overflow) across the required viewports × locales with the new control present, `uk@320` mandatory | P1 | `npm run screenshots:assert` (or `--fast` for {320,375,390}) cells for `system-featuredlistings-*` PASS | Confirmed |
| R6 | Fidelity nuance | Because the story has no `loading`/empty state (the fixtures are always present), the control is shown unconditionally in the story header — this is the story's faithful analogue of the real component's `!loading && listings.length > 0` "true" branch, and is documented in the story's doc description so the conditional-presence semantics are not misrepresented | P2 | Diff shows a one-line doc note; no fake loading state invented | Confirmed |

## Assumptions and open questions

- **OPEN — owner decision (approach):** **(A, recommended)** keep the story fixture-based and add `ViewAllLink` to the story's local `Header()` (mirrors the real header markup, avoids mocking `useFeaturedListings`/`useAuth`/`useExchangeRate`; consistent with the story's existing "no auth/API deps" design). **(B)** replace the mock with the real `FeaturedListings` component rendered through mocked hooks/providers — higher fidelity but requires safe mocks for `useFeaturedListings`, `useAuth`, `useExchangeRate` and is against the story's established no-API-deps pattern; only choose if the owner wants the story to exercise the real component tree. **Recommend A.** If the owner prefers B, STOP-AND-ASK before widening scope (it touches hook-mocking infrastructure).
- **Assumption (reversible):** the control is placed inside the shared `Header` used by both `Default` and `LocaleStress`, so both exports gain it (matches the real single-header source). If the owner wants it only in `Default`, that is a trivial narrowing.
- **Resolved by policy:** do NOT create a new story, do NOT rename/duplicate exports, do NOT touch the `Mantine/Primitives/Button` story — the button chrome is already gated (storybook §13, Task 630).

## Pre-read rule bundle

- `docs/agent-contract.md` (clauses 1 scope, 14 file integrity, 16/16a TailAdmin visual source).
- `docs/rule-index.md` (Storybook / current-Mantine path routing).
- `docs/storybook-governance.md` — §8b (canonical taxonomy: no locale/width exports, scenario-named), §13 (fix-in-place, no duplication, toolbar locale), §14.3/§14.5 (rendered proof + `check:stories`/`screenshots:assert`).
- `docs/qa-profiles.md` (Q2 evidence requirements).
- `docs/component-rules.md` (i18n, no-duplicate).
- Source: `src/stories/FeaturedListings.stories.tsx` (target), `src/modules/listings/components/FeaturedListings.tsx` (real header to mirror), `src/components/shared/ViewAllLink.tsx` (the control), `src/stories/StoryListingCard.tsx` (existing fixture usage), `package.json` (`check:stories`, `screenshots:assert`, `check:i18n`, `typecheck`).

## Scope

1. In `src/stories/FeaturedListings.stories.tsx`, edit the local `Header()` so it returns the real component's header shape: a `<div className="flex items-center justify-between mb-6">` containing the existing `<h2>{t('featured')}</h2>` (drop the `mb-6` from the `<h2>` since it moves to the row wrapper) **and** `<ViewAllLink href={`/${locale}/listings?premium=true`} label={t('view_all')} />`, where `locale` comes from the render function's `context.globals.locale` (passed into `Header` as a prop — do NOT read globals inside the helper; only the outermost render function reads globals per §13).
2. Import `ViewAllLink` from `@/components/shared/ViewAllLink`.
3. Add a one-line doc-description note (R6) clarifying the story shows the control unconditionally as the faithful analogue of the real `!loading && listings.length > 0` "present" branch.
4. Produce the Q2 evidence (typecheck, `check:stories`, `check:i18n`, `screenshots:assert` for the two `system-featuredlistings-*` cells incl. `uk@320`).
5. Write the session log + concise backlog update per the completion contract.

## Out of scope

- Any product code: `FeaturedListings.tsx`, `ViewAllLink.tsx`, `AgentCtaButton.tsx`, `page.tsx`, `theme.ts`, `globals.css`.
- Any other story file, the `Mantine/Primitives/Button` story, the `StoryListingCard`/fixtures.
- Adding, renaming, duplicating, or removing any story export; adding any locale-/width-named export; adding any i18n key.
- Option B (rendering the real component via mocked hooks) unless the owner explicitly chooses it (STOP-AND-ASK).

## Current and required behavior

- **Current:** `System/FeaturedListings` renders a plain `<h2 … mb-6>{t('featured')}</h2>` + a `StoryListingCard` grid — **no "view all" control at all**, so it cannot serve as a proof path for the Featured "view all" surface (the gap Task 630 documented).
- **Required after:** the story header is a `flex justify-between` row with `{t('featured')}` on the left and the canonical transparent `ViewAllLink` on the right, localized from the toolbar locale, `href` = `/${locale}/listings?premium=true`. The card grid, fixtures, export names, count, and viewport pins are unchanged. The story is now a faithful, citable rendered proof of the Featured "view all" control.

## Positive and negative flows

**Positive:** open `System/FeaturedListings` → `Default` (desktop1280) and `LocaleStress` (mobile320) → header shows `{featured}` heading with the transparent "view all" control beside it → switching the locale toolbar (sq/en/uk/it) localizes both the heading and the control label with no clip/overflow, `uk@320` included.

**Negative-flow applicability table:**

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---|---:|---|---|
| Locale expansion (uk/it long "view all") | **Yes** | R5 | Label localized, no clip/overflow at 320; `uk@320` mandatory | `screenshots:assert` `system-featuredlistings-*` uk@320 |
| Small viewport / touch target | **Yes** | R5 | Control auto-width inline beside heading; themed ≥44px touch height | Rendered 320/375/390 |
| Governance gates (taxonomy/locale/raw-literal) | **Yes** | R4 | `check:stories` stays green; no new export, no locale pin, no raw literal | `npm run check:stories` exit 0 |
| Conditional-presence semantics | **Yes** | R6 | Story shows the control unconditionally (no loading/empty state in fixtures); documented so it does not misrepresent the real guard | Doc-note diff |
| Real data-fetch / auth / RLS / hydration | No | Story is fixture-only, no hooks/API; not the real component (Option A) | N/A | — |

## Acceptance criteria

- `AC1 [R1,R2]` Given the edited story, when inspected, then `Header` renders `<div class="flex items-center justify-between mb-6">` with `{t('featured')}` and `<ViewAllLink href="/{locale}/listings?premium=true" label={t('view_all')} />`, `locale` from `context.globals.locale`, `ViewAllLink` imported from `@/components/shared/ViewAllLink`.
- `AC2 [R3]` Given the diff, when inspected, then only `src/stories/FeaturedListings.stories.tsx` (+ session log + backlog) changed; exactly two exports remain (`Default`, `LocaleStress`); no product/theme/other-story file is touched; no new i18n key.
- `AC3 [R4]` Given the repo after the change, when `npm run check:stories` runs, then it exits 0 (no new locale/width export, no locale pin, no inline map, no raw English literal).
- `AC4 [R5]` Given `screenshots:assert` (or `--fast`) for the two `system-featuredlistings-*` stories across sq/en/uk/it × the required widths, when captured, then every cell PASSES (no overflow, control present and localized), `uk@320` included.
- `AC5 [R6]` Given the story's doc description, when read, then it states the control is shown unconditionally as the faithful analogue of the real component's `!loading && listings.length > 0` present-branch.

## QA profile and verification plan

**Profile: Q2 (legacy `System/*` story fixture/fidelity adjustment that adds one visible control — rendered locale/viewport check required, but no product-code or critical-flow risk).** Record actual output for each:

1. `npm run typecheck` → 0 errors.
2. `npm run check:stories` → exit 0 (`checksRan: 13`), no new violation (AC3).
3. `npm run check:i18n` → unchanged key parity (no new string) (R2).
4. **Rendered:** `npm run screenshots:assert` (or `screenshots:assert -- --fast` for {320,375,390} during the loop, but the final proof must include the required widths) — capture the `system-featuredlistings--default` and `system-featuredlistings--locale-stress` cells across sq/en/uk/it; confirm the control renders beside the heading, localized, no clip/overflow, **uk@320 mandatory** (AC4). Paste the relevant frames + the manifest PASS rows.
5. File-integrity: touched file stays UTF-8 no-BOM, no mojibake (`npm run check:mojibake`) (clause 14).
6. `git status --short` / `git diff --stat` → only `src/stories/FeaturedListings.stories.tsx` (+ session log + `docs/backlog.md`). Any other path → empty (R3).

If a required check cannot run in the sandbox (native binary / timeout), record it as missing evidence and provide the exact owner-native PowerShell command (`npm.cmd run …` / `npx.cmd …`) + expected result; never substitute a confidence claim.

## Completion report contract

Write `docs/sessions/2026-07-19-task631-featuredlistings-story-viewall-proofpath-fix.md` + a concise `docs/backlog.md` update (keep ≤80 lines; move Task 630 to the archive if it was approved/committed in the same window, else leave it). Include: a Files Changed table matching the real diff; R1–R6 each with evidence; the typecheck/check:stories/check:i18n/mojibake results; the `screenshots:assert` cells (locations) incl. `uk@320`; the resolved approach (Option A vs B as implemented); explicit confirmation that no product code, no other story, no `theme.ts`, and no new i18n key was touched. Final status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED` — never self-approval. Do not run or emit mutating git.

Handoff: execute via `.claude/skills/execute-task/SKILL.md` against this file path.

## Task quality gate

- A fresh Sonnet session can execute this without chat context: the exact target file + current markup, the real header to mirror (file + lines + classes + href + label namespace), the control to import, the governance constraints (fix-in-place, no new export, toolbar locale), the recommended approach + the STOP-AND-ASK for Option B, and the proof commands are all named. ✅
- Every P0 requirement has a binary AC and a verification method. ✅
- Scope protects existing behavior and names what must not change (product code, other stories, theme, i18n keys, export names/count). ✅
- Current/legacy boundary explicit (legacy `System/*` story, not `Patterns/Mantine/*`; not in `--mantine-only`); Q2 profile + locale/viewport needs stated; no new Button story. ✅
- Negative flows selected by applicability (locale, viewport, governance gates, conditional-presence-doc in; data/auth/RLS/hydration out with reason). ✅
- Assumptions and the one owner decision (Option A vs B) are visible to executor and reviewer. ✅
- No claimed command/file/story/behavior was left uninspected. ✅
