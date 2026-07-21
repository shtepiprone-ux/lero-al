# Task 653 — Migrate `FavoriteButton` from the legacy shadcn `Button` to canonical Mantine primitives (`ActionIcon` for the icon shape, `Button` for the pill shape), preserving all favorite-toggle behavior and the three visual states exactly. This is the last legacy UI surface reachable from the Homepage render tree.

- **Task number:** 653
- **Epic:** MM — Mantine/TailAdmin migration (final Homepage-reachable legacy control).
- **Parent / origin:** Homepage Mantine-migration audit (2026-07-21). Every Homepage component is Mantine except `FavoriteButton` (the favorite "heart" on every listing card), which still imports the shadcn `Button` from `@/components/ui/button`. Migrating it makes the Homepage 100% Mantine.

## Mode and task type

- **Mode:** implementation kickoff for a fresh Sonnet session (execute via `.claude/skills/execute-task/SKILL.md`).
- **Task type:** legacy shadcn → canonical Mantine migration of a **behavioral, interactive control** with two visual shapes and three visual states. Behavior preservation is the primary constraint; the visual result must match the current render pixel-for-intent. **Reuse** existing canonical primitives (`ActionIcon`, `Button`) — no new component/pattern/token.
- **Build gate (governance `67340ff49`):** non-Q0 → final `npm run build` exit 0 required.
- **Critical flow:** `FavoriteButton` participates in the registered **"Listing card rendering"** critical flow (`docs/critical-flow-registry.md`, entries 602/605) — automated regression evidence is mandatory (`ListingCard.smoke.test.tsx` + the component's own `FavoriteButton.test.tsx`).
- **Unlayered-CSS rule (Tasks 629/650/651):** `@mantine/core/styles.css` is imported unlayered, so `ActionIcon`/`Button` component CSS beats Tailwind utility classes. Therefore the three-state colors and shape overrides MUST be applied via Mantine props / `variant` / `color` / the `styles` prop / a CSS module — **NOT** via Tailwind `bg-*`/`text-*`/`hover:*` classes that the component CSS would silently override.

## Objective

In `src/components/shared/FavoriteButton.tsx`, replace the shadcn `Button` (`@/components/ui/button`) with:

1. **Icon shape** (`shape="icon"`, default — the round overlay heart on card corners): Mantine **`ActionIcon`** (canonical icon-only primitive; precedent: `HeaderActions.tsx` favorites `ActionIcon` and the `HeaderView.tsx` hamburger `ActionIcon`).
2. **Pill shape** (`shape="pill"` — the full-height action-row button in `ListingContact.tsx`): Mantine **`Button`** (canonical, `variant="filled"`/`"default"` matched to the current look).

The component's public props, state machine, server-action calls, auth-guard, `aria-*`, and both consumers' call-sites remain unchanged. Remove the `@/components/ui/button` import once unused.

## Verified context

Inspected 2026-07-21 against the working tree.

### Current implementation (`src/components/shared/FavoriteButton.tsx`)

- `'use client'`; renders one shadcn `<Button variant="ghost" size={shape==='pill' ? size : 'icon-sm'}>` wrapping a lucide `<Heart>`.
- Props: `listingId`, `isFavorited`, `className?`, `onToggled?`, `disabled?`, `disabledLabel?`, `shape?: 'icon'|'pill'` (default `'icon'`), `size?: 'default'|'lg'|'xl'` (pill only).
- State machine (MUST be preserved verbatim — only the rendered element changes):
  - optimistic `setFavorited(nextState)` on click, rollback on server error (`toast.error`), reconcile to `result.isFavorited`, `onToggled?.(result.isFavorited)`;
  - two-effect `isPendingRef` guard (declaration order load-bearing) so an external `isFavorited` prop update during a pending transition does NOT clobber optimistic state;
  - guest guard: `!user` → `openAuthSheet('login')` unless `status === 'signing_out'` (then no-op); never toggles as guest;
  - `aria-pressed={disabled ? undefined : favorited}`, `aria-label` = add/remove/disabled variants, `aria-disabled`, `title` on disabled.
- Current icon-shape chrome (via `cn` + Tailwind on the ghost Button): `rounded-full w-8 h-8 p-0` (32px round), plus per-state color classes below. `size="icon-sm"` is used (not `size="default"`) specifically so the icon shape does NOT inherit the shadcn default size's `max-sm:w-full max-sm:min-h-11` mobile-full-width chrome — this is asserted by a test and MUST stay true.

### The three visual states (trace to concrete tokens — do NOT guess "red")

`--destructive` maps to **`--brand-900` = `#8E322B`** (a dark brand maroon), **NOT** the error-red scale. Map it to Mantine **`brand.9`** (verify `theme.ts` `brand[9]` = `#8E322B`). Match every state by computed style against the current render.

| State | Current Tailwind (on ghost Button) | Source token → value | Mantine target (props/`styles`/CSS module, not Tailwind) |
|---|---|---|---|
| Default (not favorited) | `bg-card/80 text-foreground hover:bg-card hover:text-destructive` | `--card`=`#FFFFFF`@80%, `--foreground`=`#232323`, hover text `--destructive`=`#8E322B` | ActionIcon bg = white@80%, icon color = `#232323`; hover → icon color `brand.9` |
| Favorited | `bg-destructive/10 text-destructive` | `--destructive`=`#8E322B` → bg `alpha(#8E322B, 0.10)`, icon color `#8E322B`, `<Heart fill-current>` | bg = `brand.9`@10%, icon color `brand.9`, filled heart |
| Disabled (listing closed) | `bg-muted/60 text-muted-foreground opacity-50 cursor-not-allowed` | `--muted`=`#F5F5F5`@60%, `--muted-foreground`=`#8C8C8C`, opacity .5 | bg = `#F5F5F5`@60%, icon color `#8C8C8C`, opacity .5, not-allowed |
| Pending (in-flight) | `opacity-60 cursor-wait` | — | `loading`/opacity .6, wait cursor |

### Consumers (call-sites unchanged — they pass props only)

| File:line | Shape | Props passed | Positioning className (owned by consumer — keep working) |
|---|---|---|---|
| `ListingCard.tsx:167` (`inlineFavorite`, List/horizontal) | icon | listingId, isFavorited, onToggled, disabled=isClosed, disabledLabel | `shrink-0 -mt-0.5 -mr-1` |
| `ListingCard.tsx:258` (`favorite`, Grid overlay) | icon | same | `absolute top-2 right-2 shadow-sm` |
| `ListingContact.tsx:268` (action row) | pill | listingId, isFavorited, disabled=listingClosed, disabledLabel, `shape="pill"`, `size="lg"` | `flex-1 rounded-xl border border-border` |

The passed `className` must still apply. Because `ActionIcon`/`Button` are Mantine, positioning/utility classes on the ROOT still work (layout utilities like `absolute`, `flex-1`, `shrink-0`, margins are not component-owned properties) — but `rounded-xl`/`border` in the pill consumer's className are visual and may be overridden by Button's unlayered CSS; **verify the pill still renders its rounded border in `ListingContact` and matches the adjacent `SaveToCollectionButton`** (see Assumptions).

### Reuse evidence (canonical primitives already exist + storied)

- `ActionIcon`: consumed in `HeaderActions.tsx` (favorites heart, all breakpoints) and `HeaderView.tsx` (hamburger); canonical icon-only reference cited in `DropdownMenu.stories.tsx` block 3; primitive story `HeaderActions.stories.tsx`. No `ActionIcon` block in `theme.ts` (uses Mantine defaults + local `styles`) — confirm and follow the HeaderActions precedent.
- `Button`: canonical, themed in `theme.ts`, storied.
- `FavoriteButton` itself has **no dedicated story**; it renders inside the `ListingCardPattern` story (Task 605/607), which is covered by `npm run screenshots:assert -- --mantine-only` (16/16). Use that existing gate for the icon-shape rendered proof rather than creating a new story.

## Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Migration | Icon shape renders a Mantine `ActionIcon` (round, 32px, no Tailwind `max-sm:w-full` mobile chrome); shadcn `Button` no longer imported for the icon path | P0 | `git diff`; `FavoriteButton.test.tsx` icon-chrome test; render | Confirmed |
| R2 | Migration | Pill shape renders a Mantine `Button` matching the current `size="lg"` pill (height/radius/border), visually aligned with the adjacent `SaveToCollectionButton` in `ListingContact` | P0 | `git diff`; rendered `/[locale]/listings/[slug]` action row | Confirmed |
| R3 | Visual parity | All three states (default / favorited / disabled) + pending match the current render by computed style, applied via Mantine props/`styles`/CSS module (not Tailwind color classes); favorited = `brand.9` tint (`#8E322B`), NOT error-red | P0 | Computed-style diff before/after, 3 states × 2 shapes | Confirmed |
| R4 | Behavior parity | Optimistic toggle, error rollback, `onToggled` server-truth, `isPendingRef` external-prop guard, guest→`openAuthSheet('login')`, `signing_out` no-op, `refreshing` opens sheet — all unchanged | P0 | `FavoriteButton.test.tsx` green (all cases) | Confirmed |
| R5 | A11y parity | `aria-pressed` reflects favorited (undefined when disabled), `aria-label` add/remove/disabled, `aria-disabled`, `title` on disabled — identical semantics; element is still a real `<button>` (role button) | P0 | `FavoriteButton.test.tsx`; axe/role check | Confirmed |
| R6 | Critical flow | The "Listing card rendering" critical flow still passes: `ListingCard.smoke.test.tsx` green (favorite renders, disabled-when-closed), and `screenshots:assert --mantine-only` for the card pattern still passes | P0 | vitest + screenshots:assert; one planted-violation re-proof | Confirmed |
| R7 | Isolation | No change to `ListingCard.tsx`, `ListingContact.tsx`, `MantineListingCardPattern.tsx`, `SaveToCollectionButton.tsx`, server actions, `theme.ts`, i18n; consumer call-sites and passed classNames unchanged | P0 | `git diff` scope | Confirmed |
| R8 | Gates + build | typecheck, check:stories, check:i18n, check:mojibake green AND `npm run build` exit 0; the two vitest suites green | P0 | Commands exit 0 | Confirmed |

## Assumptions and open questions

- **`--destructive` = brand-900 (`#8E322B`), not red.** The favorited heart is a dark-brand tint. Map to Mantine `brand.9`; verify `theme.ts` `brand[9]`. Do not substitute the `red`/error tuple.
- **Colors via Mantine, not Tailwind** (unlayered-CSS rule). `ActionIcon`/`Button` own their bg/color/hover CSS unlayered; set the three states through `variant`+`color`+`styles` (or a small CSS module like `MantineListingCardPattern.module.css` precedent) and confirm by computed style that no silent override occurs. Layout utility classes passed by consumers (`absolute`, `flex-1`, `shrink-0`, margins) may remain as classNames.
- **Pill alignment with a still-legacy sibling.** In `ListingContact.tsx` the pill sits in a `flex-wrap` row next to `SaveToCollectionButton` (still shadcn `Button size="lg"`, `flex-1 rounded-xl border`). Migrating only `FavoriteButton` risks a height/radius mismatch. **Constraint:** the migrated pill must visually match that sibling (same height, radius, border) in the rendered row. `SaveToCollectionButton` migration is **out of scope** (separate follow-up) — but the pill must not look misaligned beside it. If an exact match is impossible without touching the sibling, STOP and surface it as `AMBIGUOUS - OWNER DECISION` rather than restyling the sibling.
- **Test selectors.** `FavoriteButton.test.tsx` uses `getByRole('button')` + `aria-pressed`; `ActionIcon`/`Button` both render `<button>`, so selectors should hold. The icon-chrome test asserts the ABSENCE of `max-sm:w-full` mobile chrome — after migration that class is simply never present. Adjust the test only if a selector genuinely breaks; if changed, keep it asserting observable behavior (planted-violation must still fail it). Any test edit is IN scope for this file only.
- **Story:** no new dedicated story (reuse the `ListingCardPattern` story + `screenshots:assert --mantine-only` for icon-shape proof). Do not add a `FavoriteButton.stories.tsx`.

## Pre-read rule bundle

- `docs/agent-contract.md` (clauses 1 scope, 9 validation + **mandatory build**, 11 mobile/touch + a11y, 12 rendered evidence, 14 file integrity, 16 TailAdmin tokens).
- `docs/rule-index.md` (legacy→Mantine control migration).
- `docs/qa-profiles.md` (Q3 visual + critical-flow regression) + viewport/locale policy.
- `docs/critical-flow-registry.md` (the "Listing card rendering" entry — favorite renders + disabled-when-closed).
- `docs/mantine-responsive-design-system.md` (unlayered-CSS rule §4/§6, `ActionIcon`/`Button` usage), `docs/tailadmin-style-reference.md` (brand/neutral token map), `docs/component-rules.md`.
- Source: `src/components/shared/FavoriteButton.tsx` (target); `src/components/layout/HeaderActions.tsx` (canonical `ActionIcon` precedent); `src/modules/listings/components/ListingCard.tsx` + `ListingContact.tsx` (consumers, do not edit); `src/design-system/mantine/theme.ts` (brand/neutral scales); `src/app/globals.css` (`--destructive`/`--card`/`--muted` token chain); `src/modules/listings/components/__tests__/FavoriteButton.test.tsx` + `ListingCard.smoke.test.tsx` (regression).

## Scope

1. Rewrite `FavoriteButton.tsx`'s render to branch on `shape`: `icon` → `ActionIcon` (round 32px, three-state colors via Mantine props/`styles`/CSS module, no mobile-full-width chrome); `pill` → `Button` (matched to current `size="lg"` pill + border). Keep the entire state machine, handlers, effects, and `aria-*` verbatim.
2. Apply the three states + pending via Mantine `variant`/`color`/`styles` (or a CSS module), traced to the tokens in the table above and confirmed by computed style (no unlayered override). Preserve the consumer-passed `className` for positioning.
3. Remove the `@/components/ui/button` import (grep-confirm unused). Keep `cn` only if still used for className merging.
4. Update `FavoriteButton.test.tsx` ONLY if a selector genuinely breaks; keep all behavioral assertions and the icon-no-mobile-chrome intent.
5. Produce Q3 rendered proof (3 states × 2 shapes, uk@320 + desktop, before/after) + computed-style match; run `screenshots:assert --mantine-only` (card pattern) + both vitest suites + one planted-violation re-proof for the critical flow; capture `npm run build` exit 0.
6. Write the session log + a concise `docs/backlog.md` entry (Homepage now 100% Mantine).

## Out of scope

- `SaveToCollectionButton.tsx` and every other shadcn `Button` consumer not on the card favorite path (favorites page, forms, `ActiveFilterChips`, `DatePicker`, `AvatarCropModal`, `FilterToggleGroup`, etc.).
- `ListingCard.tsx` / `ListingContact.tsx` / `MantineListingCardPattern.tsx` markup, the server actions, `theme.ts`, i18n keys, and any new story.
- Changing favorite behavior, the auth-sheet flow, or realtime sync.

## Current and required behavior

- **Current:** favorite heart = shadcn ghost `Button` (icon-sm/pill) styled with Tailwind three-state classes; behaves via the optimistic + auth-guard state machine.
- **Required after:** identical behavior and a11y; heart = Mantine `ActionIcon` (icon) / `Button` (pill); the three states rendered via Mantine (matched by computed style); shadcn `Button` no longer imported; Homepage render tree fully Mantine.

## Positive and negative flows

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Icon heart renders on card (Grid + List) | Yes | R1/R3 | round 32px ActionIcon, correct default/favorited color | Rendered `/[locale]` + `/[locale]/listings` |
| Toggle favorite (auth user) | Yes (regression) | R4 | optimistic flip, server reconcile, `onToggled` | `FavoriteButton.test.tsx` |
| Server error on toggle | Yes | R4 | rollback + `toast.error` | test |
| External prop change mid-transition | Yes | R4 | `isPendingRef` guard holds optimistic | test |
| Guest click | Yes | R4 | `openAuthSheet('login')`, no toggle | test |
| `signing_out` / `refreshing` guest states | Yes | R4 | signing_out no-op; refreshing opens sheet | test |
| Disabled (listing closed) | Yes | R3/R5 | muted bg, disabled, `aria-disabled`, `title` | test + render |
| Pill in `ListingContact` action row | Yes | R2 | matches adjacent SaveToCollection sibling | Rendered detail page |
| a11y (`aria-pressed`/label/role button) | Yes | R5 | identical semantics | test |
| Critical flow: card pattern still renders favorite | Yes (regression) | R6 | smoke test + screenshots:assert green; planted-violation fails | vitest + assert |
| Production build | Yes | R8 | `npm run build` exit 0 | transcript |
| i18n key change | No | reuse existing aria/common keys | `check:i18n` unchanged |

## Acceptance criteria

- `AC1 [R1,R3]` Given the diff + render, the icon shape is a Mantine `ActionIcon` (round 32px, no mobile-full-width chrome), and default/favorited/disabled states match the current computed styles (favorited = `brand.9` `#8E322B` tint), applied via Mantine props/`styles`/CSS module, not Tailwind color classes.
- `AC2 [R2]` Given the rendered `ListingContact` action row, the pill shape is a Mantine `Button` matching the current `size="lg"` pill and visually aligned (height/radius/border) with the adjacent `SaveToCollectionButton`.
- `AC3 [R4,R5]` Given `FavoriteButton.test.tsx`, every behavioral + a11y case passes unchanged (optimistic/rollback/onToggled/isPendingRef/guest-guard/aria-pressed/label); the element is a real `<button>`.
- `AC4 [R6]` Given the repo, `ListingCard.smoke.test.tsx` and `screenshots:assert --mantine-only` (card pattern) pass, and one planted violation (e.g. break the favorited-state color or the disabled branch) genuinely fails a test, then is reverted.
- `AC5 [R7,R8]` Given the repo, only `FavoriteButton.tsx` (+ its test if a selector broke), `docs/backlog.md`, and the session log changed; the shadcn `Button` import is gone; typecheck + check:stories + check:i18n + check:mojibake + both vitest suites + `npm run build` all exit 0.
- `AC6` Given the rendered `/[locale]` Homepage (uk@320 + desktop), the favorite heart matches the pre-migration look — Homepage is now 100% Mantine (no `@/components/ui/*` styled surface in its render tree).

## QA profile and verification plan

**Profile: Q3 Visual + mandatory critical-flow regression + build gate.** Evidence:

1. `npm run typecheck` → 0 errors.
2. `npm run check:stories` → exit 0.
3. `npm run check:i18n` → unchanged parity.
4. `npm run check:mojibake` → 0 artifacts.
5. `npx vitest run src/modules/listings/components/__tests__/FavoriteButton.test.tsx` → all green.
6. `npx vitest run src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx` → all green (critical-flow regression) + one documented planted-violation that genuinely fails, then reverted.
7. `npm run screenshots:assert -- --mantine-only` → card-pattern favorite still passes (icon-shape rendered gate).
8. **Rendered proof:** before/after of the 3 states × 2 shapes at uk@320 + desktop on the real `/[locale]` Homepage and `/[locale]/listings/[slug]` detail row, plus a **computed-style** confirmation that each state's bg/color matches the traced token (favorited = `#8E322B` tint) and that no unlayered-CSS override occurred.
9. `npm run build` → **exit 0** (capture transcript).
10. `git status --short` / `git diff --stat` → only `FavoriteButton.tsx` (+ its test if changed), `docs/backlog.md`, and the session log.

Q3 cannot be approved without the rendered 3-state proof, the computed-style match, both vitest suites green with the critical-flow planted-violation, and the passing build.

## Completion report contract

Write `docs/sessions/2026-07-21-task653-favoritebutton-mantine-migration.md` + a concise `docs/backlog.md` update. Include: a Files Changed table; R1–R8 with evidence; before/after of the render for both shapes; the computed-style confirmation of the three states (with the `#8E322B` favorited tint and no unlayered override); the two vitest suites' results + the planted-violation transcript; `screenshots:assert --mantine-only` result; typecheck/check:stories/check:i18n/mojibake **and `npm run build`**; explicit confirmation that consumers/actions/`theme.ts`/i18n are unchanged and that the Homepage render tree is now 100% Mantine. Final status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED` — never self-approval. Do not run or emit mutating git. If the pill cannot match its legacy sibling without touching `SaveToCollectionButton`, return `BLOCKED`/`AMBIGUOUS - OWNER DECISION`.

Handoff: execute via `.claude/skills/execute-task/SKILL.md` against this file path.

## Task quality gate

- A fresh Sonnet session can execute this without chat context: the target file, the two shapes → `ActionIcon`/`Button`, the three states with concrete source tokens (`--destructive`=brand-900=`#8E322B`, `--card`/`--muted`/`--foreground` chains) and the Mantine-not-Tailwind application rule, the preserved state machine + a11y, the two consumers (do-not-edit) with their positioning classNames, the pill-vs-legacy-sibling alignment constraint, the reuse decision (no new story), and the Q3 + critical-flow + build matrix are all named. ✅
- Every P0 requirement has a binary AC and a verification method; the behavior + critical-flow regression + computed-style anti-override checks are explicit. ✅
- Canonical UI decision = **reuse** (`ActionIcon`/`Button` already canonical + storied; precedent `HeaderActions`); no copied local styles, no new token/story. ✅
- Scope protects behavior, consumers, the card pattern, the server actions, `theme.ts`, i18n; names what must not change; the still-legacy sibling is an explicit constraint, not silent scope creep. ✅
- Negative flows selected by applicability (toggle/error/guest/closed/critical-flow/build in; i18n-change out). ✅
