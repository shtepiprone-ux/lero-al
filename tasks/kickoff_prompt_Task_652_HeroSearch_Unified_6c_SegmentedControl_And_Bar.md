# Task 652 — Unify the hero search on the canonical §6c gray look: replace the custom Продаж/Оренда tabs with a Mantine `SegmentedControl` sitting flush (0px) on top of the search bar, and restyle the search-bar surface from white+`shadow-xl` to the matching §6c gray track (gray-1 fill, gray-2 border, white input "pills" inside). Owner-approved redesign (mockup-confirmed).

- **Task number:** 652
- **Epic:** MM — Mantine/TailAdmin Restyle (homepage hero — §6c unification).
- **Parent / origin:** Owner-directed hero redesign (2026-07-20, confirmed against a rendered mockup): make the listing-type toggle a canonical §6c `SegmentedControl` (gray track / white active pill) AND restyle the search bar to the same §6c gray track, so the whole hero search reads as one unified §6c surface — the SegmentedControl sits **flush (0px gap)** on top of the bar, with white input controls as "pills" on the gray track. Supersedes the earlier tabs-only §6c idea.

## Mode and task type

- **Mode:** implementation kickoff for a fresh Sonnet session (execute via `.claude/skills/execute-task/SKILL.md`).
- **Task type:** current-Mantine control migration + a **deliberate, owner-approved visual redesign** of the hero search surface, in one `'use client'` component. Reuse the canonical `SegmentedControl` (§6c, already themed + storied) — no new story. Rendered owner review is the primary gate.
- **Build gate (governance `67340ff49`):** non-Q0 → final `npm run build` exit 0 required.
- **Unlayered-CSS rule (Tasks 650/651):** `@mantine/core/styles.css` is imported unlayered, so Mantine component CSS beats Tailwind utility classes. Therefore apply the §6c colors + the flush overrides via **Mantine props / the `styles` prop (inline styles win)**, NOT via Tailwind `bg-*`/`border-*`/`rounded-*` classes that the component CSS would override.

## Objective

In `src/components/shared/HeroSearchView.tsx`:
1. Replace the `<Box className="flex mb-0">` + two `Button unstyled` listing-type tabs with a canonical `SegmentedControl` (Продаж/Оренда, `value={listingType}`, `onChange`→`onListingTypeChange`), §6c theme look, **content-width**, sitting **flush on the bar**: `mb={0}` + squared/borderless bottom edge (`styles.root` overrides) so it merges into the bar's top.
2. Restyle the search-bar surface `Box` from `bg-background … border shadow-xl` to the §6c gray track: `bg="gray.1"` + a `gray-2` border + **no `shadow-xl`** + keep `p="sm"` + keep the asymmetric top radius (top-left squared where the toggle meets, top-right rounded on `sm+`, bottom always rounded). The inner controls (Comboboxes, CountButton, Search button) stay as-is (white input "pills" on the gray track).

Behavior (`listingType` state → search URL), the other controls, `FiltersPanel`, `HeroSearch.tsx`, and the `hero-search` hook are unchanged.

## Verified context

Inspected 2026-07-20 against `HEAD` (Task 650 committed `f49f9637f`). `HeroSearchView` is a hook-free presentational `'use client'` component (Task 568); container `<div>`s are already `Box` (Task 650).

### Current toggle + bar (to change)

```tsx
<Box className="flex mb-0">
  {(['sale','rent'] as ListingType[]).map((type,i) => (
    <Button unstyled onClick={() => onListingTypeChange(type)} className="[custom tab chrome]">{tl(type)}</Button>
  ))}
</Box>
<Box className="bg-background rounded-b-2xl sm:rounded-tr-2xl border shadow-xl p-3">
  <Box className="flex flex-wrap md:flex-nowrap gap-2">
    <PropertyTypeCombobox … />
    <LocationCombobox … />
    <MantineCountButton … />
    <Button variant="filled" … leftSection={<Search…/>}>{t('search')}</Button>
  </Box>
</Box>
```
- `tl('sale')`/`tl('rent')` = labels; `listingType`/`onListingTypeChange` = the only state/handlers (unchanged). The Search button is `variant="filled"` (brand coral — **keep**). The inner white controls are already Mantine (§6d/§6e) — **unchanged**.

### §6c reference values (use Mantine props/tokens, not Tailwind classes)

| Element | §6c target | How (Mantine, wins over unlayered CSS) |
|---|---|---|
| SegmentedControl track | gray-1 fill, gray-2 border, white active pill, shadow-xs, radius lg(8px), size sm(14px) | The `theme.ts` `SegmentedControl` block already provides all of this — just render `<SegmentedControl>` with no color/class overrides |
| SegmentedControl flush on bar | 0px gap; bottom-left/right radius 0; no bottom border | `mb={0}` + `styles={{ root: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottomWidth: 0 } }}` (inline styles win) |
| Search-bar surface fill | gray-1 (matches the SC track) | `bg="gray.1"` (Mantine `bg` prop → `var(--mantine-color-gray-1)`) |
| Search-bar surface border | 1px gray-2 | `styles={{ root: { border: '1px solid var(--mantine-color-gray-2)' } }}` OR `bd="1px solid var(--mantine-color-gray-2)"` — NOT the Tailwind `border` class |
| Search-bar shadow | none | remove `shadow-xl` (do not replace) |
| Search-bar radius | keep asymmetric: bottom rounded, top-right rounded `sm+`, top-left squared | keep the existing `rounded-b-2xl sm:rounded-tr-2xl` **radius** class (radius is not a Mantine-component-owned prop on `Box`, so the Tailwind class applies; verify rendered) — OR express via `styles.root` border-radius if the class is overridden; verify which wins in the render |
| Search-bar padding | 12px | `p="sm"` (or keep `p-3` class) |
| Inner controls | white pills (unchanged) | no change |
| Search button | brand coral (unchanged) | `variant="filled"` unchanged |

- **Mobile SegmentedControl = full-width 50/50; desktop = content-width (left).** Owner directive (2026-07-20): tabs span the full width as two equal 50/50 halves at `<640`, and are compact content-width on desktop. Achieve this **hook-free** with a wrapper: `<Box w={{ base: '100%', sm: 'fit-content' }}><SegmentedControl fullWidth …/></Box>` — on mobile the wrapper is 100% so `fullWidth` gives 50/50 full-width; on `sm+` the wrapper is `fit-content` so `fullWidth` collapses to content-width. (Mantine responsive `w` is CSS-based — no hook, keeps Task-568 presentational contract.) Confirm 50/50 at uk@320 and content-width on desktop.
- **The old `<Box className="flex mb-0">` wrapper is replaced by the `w`-responsive wrapper above** holding the `SegmentedControl`.
- **Search button = full-width on its own row on mobile.** Owner directive: at `<640` the Search button sits on its own row **below** the fields at full width (`basis-full` at base). Preserve the Task-572 `sm` (640–767) and `md+` behavior exactly (do not disturb the tuned `sm:basis-full md:grow-0 md:basis-auto` overrides — only ensure the base/mobile state is a full-width own-row Search). Verify the 320 / sm-band / desktop layouts all still behave (Task 572).

### Reuse (no new story)

`SegmentedControl` has `theme.ts` §6c config + `input-chrome.css` label rules + `Mantine/Primitives/SegmentedControl` story; `Mantine/Primitives/HeroSearch` renders `HeroSearchView` and auto-reflects. Precedent consumer: `AdminUsersTable.tsx`.

## Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Toggle | The tabs + their `flex mb-0` wrapper are replaced by a canonical §6c `SegmentedControl` (Продаж/Оренда, `value`/`onChange` wired), no custom color classes; **mobile = full-width 50/50, desktop = content-width** via a `w={{ base:'100%', sm:'fit-content' }}` wrapper + `fullWidth` | P0 | `git diff`; rendered 320 (50/50) + desktop (content-width) | Confirmed |
| R1b | Mobile Search | At `<640` the Search button is a full-width own row below the fields (`basis-full` base); the Task-572 `sm`/`md+` layout is preserved unchanged | P0 | `git diff`; rendered uk@320 (Search full-width below) + sm band + desktop | Confirmed |
| R2 | Flush 0px | The SegmentedControl sits flush on the bar: `mb={0}`, bottom corners squared + no bottom border (via `styles.root`), visually merging into the bar's top | P0 | `git diff`; rendered junction | Confirmed |
| R3 | §6c bar | The search-bar `Box` is the §6c gray track: `bg="gray.1"`, 1px `gray-2` border (via Mantine prop/`styles`, not Tailwind class), no `shadow-xl`; asymmetric top radius preserved; padding kept; inner white controls unchanged | P0 | `git diff`; rendered bar (gray track, white pills) | Confirmed |
| R4 | Behavior parity | `listingType` selection still drives the search `type` param; Comboboxes/CountButton/Search button/`FiltersPanel`/`hero-search` hook unchanged; Search button stays brand `variant="filled"` | P0 | `git diff`; rendered interaction | Confirmed |
| R5 | Unlayered-CSS discipline | §6c colors + flush overrides use Mantine props/`styles` (inline), not Tailwind classes the component CSS would override; verified in the render (no silent override) | P0 | `git diff`; computed-style/rendered check | Confirmed |
| R6 | Isolation | No change to `HeroSearch.tsx`, i18n, `theme.ts`, the SegmentedControl story/chrome, or other files; `Button`/`cn` imports adjusted only as needed | P0 | `git diff` scope | Confirmed |
| R7 | Gates + build | typecheck, check:stories, check:i18n, check:mojibake green AND `npm run build` exit 0; no i18n key change | P0 | Commands exit 0 | Confirmed |

## Assumptions and open questions

- **Owner-approved redesign** (mockup-confirmed 2026-07-20): §6c gray SegmentedControl flush (0px) on a §6c gray search-bar track, white input pills inside, brand coral Search button. This is the target; do not preserve the old white-tabs look.
- **Use Mantine props/`styles` for §6c colors + flush** (per Task 650/651 unlayered-CSS reality). If a Tailwind class is verified to render correctly (e.g. the asymmetric radius), it may stay; but bg/border/flush-overrides go through Mantine props/`styles`. Verify each in the render — flag any silent override.
- **Content-width SegmentedControl** (no `fullWidth`) — keeps the component hook-free (Task 568) and matches the mockup. Confirm uk@320 fit.
- **Search-bar radius** stays asymmetric (`rounded-b-2xl sm:rounded-tr-2xl`) — the toggle still sits top-left, so the top-left stays squared. If the Tailwind radius class is overridden by anything, express it via `styles.root` instead; verify.
- **Do NOT convert the bar `Box` to `Paper`** (Task 650 — Paper's unlayered CSS overrides).
- Behavior/`handleSearch`/`HeroSearch.tsx` untouched; no i18n change (`listing.sale`/`listing.rent` reused).

## Pre-read rule bundle

- `docs/agent-contract.md` (clauses 1 scope, 7 i18n, 9 validation + **mandatory build**, 11 mobile/touch, 12 rendered evidence, 14 file integrity, 16 TailAdmin §6c).
- `docs/rule-index.md` (current-Mantine control migration).
- `docs/qa-profiles.md` (Q3 visual — live hero) + viewport policy (uk@320 + the sm 640–767 band).
- `docs/mantine-responsive-design-system.md` (§6c SegmentedControl + the corrected unlayered-CSS note if Task 651 landed — else follow the Task 650 finding), `docs/tailadmin-style-reference.md` (§6c gray-1/gray-2), `docs/component-rules.md`.
- Source: `src/components/shared/HeroSearchView.tsx` (target), `src/design-system/mantine/theme.ts` (SegmentedControl §6c + gray scale), `src/design-system/mantine/input-chrome.css` (SC labels), `src/components/admin/AdminUsersTable.tsx` (SC precedent), `HeroSearch.stories.tsx` (render reference).

## Scope

1. Replace the tabs (+ `flex mb-0` wrapper) with `<Box w={{ base:'100%', sm:'fit-content' }}><SegmentedControl fullWidth mb={0} styles={{ root: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottomWidth: 0 } }} …/></Box>` — §6c defaults, `data`/`value`/`onChange` wired, mobile 50/50 full-width + desktop content-width. Also adjust the Search button to a full-width own row at `<640` (R1b), preserving the Task-572 sm/md layout.
2. Restyle the search-bar `Box`: `bg="gray.1"` + gray-2 border (Mantine prop/`styles`) + remove `shadow-xl` + keep padding + keep the asymmetric radius (verify not overridden); inner controls untouched.
3. Add `SegmentedControl` to the `@mantine/core` import; keep `Button` (Search); remove `cn` only if unused (grep first).
4. Produce the Q3 rendered proof on the real `/{locale}` hero (before/after, viewports incl. uk@320 + the sm band, four locales) **and the `npm run build` exit-0 transcript**; verify (computed-style) that the §6c colors + flush overrides actually apply (no unlayered-CSS silent override).
5. Write the session log + a concise `docs/backlog.md` entry (owner-approved §6c hero unification). Keep ≤80 lines (consolidate first if needed).

## Out of scope

- The inner controls (Comboboxes/CountButton/Search button), `FiltersPanel`, `HeroSearch.tsx`, i18n keys, `theme.ts` (§6c already correct), the SegmentedControl story/chrome.
- Converting the bar to `Paper`; any non-§6c styling.

## Current and required behavior

- **Current:** listing-type = custom white "browser-tabs"; search bar = white surface with `shadow-xl`.
- **Required after:** listing-type = canonical §6c `SegmentedControl` (gray track/white pill) flush (0px) on the bar; search bar = §6c gray track (gray-1/gray-2, no shadow) holding the unchanged white input controls + brand Search button; selecting Продаж/Оренда drives the search exactly as before.

## Positive and negative flows

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Hero renders unified §6c (desktop) | **Yes** | R1/R2/R3 | gray SC flush on gray bar, white pills, brand Search — matches mockup | Rendered `/en` desktop |
| Select Продаж/Оренда | **Yes (regression)** | R4 | active pill moves; search `type` param drives results | Rendered interaction |
| Mobile uk@320 | **Yes** | R1/R1b/R3 | SC full-width 50/50 flush on top; bar gray; fields stack; Search full-width own row below; no clip | Rendered uk@320 |
| sm 640–767 band | **Yes** | R3 | controls wrap (Task 572) on the gray bar; SC unaffected | Rendered ~720px |
| §6c colors actually apply (no unlayered override) | **Yes** | R5 | computed style shows gray-1 bar + gray-2 border + flush SC | Computed-style/rendered check |
| Search / selects / filters / Enter / skeleton hook | **Yes (regression)** | R4 | unchanged | Rendered interaction; `git diff` |
| Production build | **Yes** | R7 | `npm run build` exits 0 | Build transcript |
| i18n key change | No | reuse `listing.sale`/`listing.rent` | `check:i18n` unchanged |

## Acceptance criteria

- `AC1 [R1,R2]` Given the diff+render, then the tabs are a §6c `SegmentedControl` (`value`/`onChange` wired) sitting flush (mb=0, squared+borderless bottom) on the bar — **full-width 50/50 at uk@320, content-width on desktop** (via the `w`-responsive wrapper + `fullWidth`).
- `AC1b [R1b]` Given the rendered hero at `<640`, then the Search button is a full-width row below the fields; the sm-band and desktop layouts (Task 572) are unchanged.
- `AC2 [R3,R5]` Given the diff+render, then the search-bar `Box` shows the §6c gray track (gray-1 fill + gray-2 border via Mantine prop/`styles`, no `shadow-xl`), asymmetric radius preserved, inner white controls unchanged — and computed styles confirm the §6c values apply (no unlayered override).
- `AC3 [R4]` Given the hero, then selecting a segment drives the search `type` unchanged, the Search button stays brand `filled`, and all other controls + the `hero-search` hook are untouched.
- `AC4 [R6,R7]` Given the repo, then no `HeroSearch.tsx`/i18n/`theme.ts`/story change, and typecheck + check:stories + check:i18n + check:mojibake + `npm run build` all exit 0.
- `AC5` Given the rendered `/{locale}` hero (uk@320 + sm band + desktop × four locales), then it matches the owner-approved §6c unified mockup (captured before/after for confirmation).

## QA profile and verification plan

**Profile: Q3 Visual (owner-approved hero redesign) + mandatory build gate.** Evidence:

1. `npm run typecheck` → 0 errors.
2. `npm run check:stories` → exit 0.
3. `npm run check:i18n` → unchanged parity.
4. `npm run check:mojibake` → 0 artifacts.
5. `npm run build` → **exit 0** (capture transcript).
6. **Rendered proof (real `/{locale}` hero):** before/after at the mandated viewports incl. `uk@320` + the sm 640–767 band × four locales, showing the §6c gray SegmentedControl flush on the §6c gray bar with white pills + brand Search; **plus a computed-style check** that `bg`=gray-1, border=gray-2, and the SC flush overrides actually apply (guard against the Task-650 unlayered-CSS override). Live-app capture path (Tasks 645/646/650 precedent) or the `Mantine/Primitives/HeroSearch` story. Owner confirms the composition. If the sandbox cannot run the app, record it as missing evidence with the exact owner-native command + expected result.
7. `git status --short` / `git diff --stat` → only `HeroSearchView.tsx`, `docs/backlog.md`, and the session log.

Q3 cannot be approved without the rendered hero evidence (incl. uk@320 + sm band), the computed-style confirmation, and the passing `npm run build`; the owner confirms the §6c composition.

## Completion report contract

Write `docs/sessions/2026-07-20-task652-herosearch-unified-6c-segmentedcontrol-bar.md` + a concise `docs/backlog.md` update. Include: a Files Changed table; R1–R7 with evidence; the before/after of the toggle + the bar (§6c gray track, flush junction); the computed-style confirmation that §6c colors/flush apply (no unlayered override); the mobile content-width decision; typecheck/check:stories/check:i18n/mojibake **and `npm run build`** results; the rendered `/{locale}` hero before/after (incl. uk@320 + sm band × four locales) for owner confirmation; explicit confirmation that behavior/`HeroSearch.tsx`/i18n/`theme.ts`/inner controls/`hero-search` hook are unchanged. Final status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED` — never self-approval. Do not run or emit mutating git.

Handoff: execute via `.claude/skills/execute-task/SKILL.md` against this file path.

## Task quality gate

- A fresh Sonnet session can execute this without chat context: the current toggle+bar verbatim, the §6c target with **Mantine-prop/`styles` application (not Tailwind classes, per the unlayered-CSS rule)**, the flush-0px `styles.root` overrides, the gray-1/gray-2 bar + shadow removal + preserved asymmetric radius, the content-width mobile decision, the reuse (no new story), and the Q3 render + computed-style + build matrix are all named. ✅
- Every P0 requirement has a binary AC and a verification method; the owner-approved redesign + computed-style anti-override check are explicit. ✅
- Scope protects behavior, inner controls, `FiltersPanel`, `HeroSearch.tsx`, i18n, `theme.ts`; names what must not change. ✅
- Reuse (not create) — SegmentedControl §6c + story already exist; no i18n change. ✅
- Negative flows selected by applicability (render/select/mobile/sm-band/override-check/behavior-regression/build in; i18n-change out). ✅
