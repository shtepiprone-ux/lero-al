# Session — Task 648: `PopularLocationsView` canonical Mantine component + story (block B, Story-first slice 1/2)

**Task path:** `tasks/kickoff_prompt_Task_648_PopularLocationsView_Mantine_Component_And_Story.md`
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

## Requirement ledger (restated pre-implementation)

- R1 — `PopularLocationsView.tsx` renders heading + 2→3→4-col grid of city image-cards (image+overlay OR fallback gradient, MapPin + name) from Mantine primitives + theme tokens; visual preserves the current look.
- R2 — takes `{ heading: string; locations: { id; name; href; imageUrl?: string | null }[] }`; owns `CITY_GRADIENTS` + `MapPin` internally; no hardcoded visible copy; renders via `storyT`; no i18n key added.
- R3 — card height/radius/padding, image+overlay, fallback gradients, MapPin size/opacity, name typography, heading scale, grid cols/gap match the legacy per the trace; decorative gradients/`AppImage`/hover+focus kept as `className`.
- R4 — canonical story renders toolbar-reactively (locale + viewport), exercises both image + fallback branches, incl. `uk@320`.
- R5 — coverage-registered so `check:story-coverage` + `check:stories` pass.
- R6 — every migrated value traces to a theme token or is a kept semantic-token class/infra with a documented reason; canonical UI decision record = `create canonical`.
- R7 — no change to `PopularLocations.tsx`, i18n, `theme.ts`, `AppImage`, or other files; the component is used only by its story.
- R8 — `typecheck`, `check:stories`, `check:story-coverage`, `check:i18n`, `check:mojibake` all green; Q3 rendered proof passes.

**Current behavior to preserve:** the popular-locations section exists only as inline legacy markup inside the data-fetching `PopularLocations` server component; no reusable view, no Mantine story.
**Required after behavior:** a canonical `PopularLocationsView` Mantine component exists, visually matching the current section, proven in a toolbar-reactive Storybook story (both image + fallback branches) and registered for coverage — but not yet used by `PopularLocations` (legacy still renders the live page until Task 649).

## Canonical UI decision record — `create canonical`

| Visible artifact | Search performed | Result | Disposition | Consumed path |
|---|---|---|---|---|
| Whole section (heading + city-card grid) | Searched `src/stories/mantine/primitives/*.stories.tsx` + `docs/component-catalog.md` for an existing "location card" / "city grid" canonical Mantine component — none exists (the section only ever existed as inline markup in the legacy `PopularLocations.tsx` server component, confirmed by reading the file in full). Opened `FooterView.tsx` (server-compatible Box/Stack/Group/Flex + prop-driven precedent) and `HowItWorksSteps.tsx` (Task 644, Title/SimpleGrid heading-scale + `create canonical` precedent) as the structural/story precedent named by the kickoff. | No canonical source existed | **create canonical** | New `src/modules/locations/components/PopularLocationsView.tsx` + `src/stories/mantine/primitives/PopularLocationsView.stories.tsx` (`Mantine/Primitives/PopularLocationsView`), both created this task. |

Every value inside the new component traces to either a theme token (below) or an explicit "kept as `className`" provenance reason (image infra / semantic-token gradients / interaction states that have no clean Mantine equivalent, per the kickoff's own `docs/agent-contract.md` clause 16b guidance not to invent a raw local value where a token exists, and not to force a Mantine-prop translation where doing so would lose approved semantic tokens or infra behavior).

## Visual source trace (legacy → Mantine/theme, verbatim from the kickoff, verified against live source)

| Artifact | Legacy (`PopularLocations.tsx`, unmodified, read in full) | Implemented in `PopularLocationsView.tsx` | Token / provenance |
|---|---|---|---|
| Section wrapper | `<section className="py-12 md:py-16 2xl:py-20 bg-muted/30 [content-visibility:auto] [contain-intrinsic-size:auto_380px]">` + `<div className="container-wide">` | `<Box component="section" className="py-12 md:py-16 2xl:py-20 bg-muted/30 […]">` + `<Box className="container-wide">` | kept as `className` — layout/perf utility (FooterView precedent, `Box component="footer" className="…"`) |
| Heading | `<h2 className="text-xl sm:text-2xl 2xl:text-3xl font-bold mb-6">` | `<Title order={2} fw={700} fz={{ base:'1.25rem', sm:'1.5rem', xxl:'1.875rem' }} mb="xl">` | same section-heading scale as Tasks 644/646/647; `mb-6`=24px=theme `spacing.xl` (verified `theme.ts:190` `xl: '1.5rem'` = 24px) |
| Grid | `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3` | `<SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">` | `gap-3`=12px=theme `spacing.sm` (verified `theme.ts:187` `sm: '0.75rem'` = 12px); project's Mantine `breakpoints.sm`=640px/`md`=768px (`theme.ts:160-161`) are pixel-identical to Tailwind's `sm`/`md` defaults, so the responsive step points match exactly — confirmed in the rendered `default-en-768.png` capture (4 cols at 768px, matching Tailwind `md:` triggering at ≥768px) |
| Card container | `<Link className="relative flex flex-col justify-end h-28 rounded-xl overflow-hidden p-3 text-primary-foreground hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">` | `<Box component={Link} href={loc.href} pos="relative" h={112} p="sm" c="white" bdrs="xl" className="flex flex-col justify-end overflow-hidden hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" data-track="popular_location_click">` | `h-28`=112px→`h={112}` (raw-numeric precedent, Task 644 `size={56}`); `rounded-xl`=12px→`bdrs="xl"` (Box's `radius`-type style prop — NOT the `radius` component prop, which `Box` doesn't accept; verified via `tsc` error then fixed, then confirmed `bdrs` is `type:"radius"` in Mantine's own `style-props-data.mjs`, resolving through the same `getRadius()`/theme scale as a component `radius` prop, i.e. `theme.radius.xl`=12px, `theme.ts:199`); `p-3`=12px→`p="sm"`; `text-primary-foreground`=white→`c="white"`; hover/focus/flex-justify kept as `className` (interaction states, no Mantine equivalent) |
| Image + overlay | `<AppImage variant="listing-thumb" className="absolute inset-0"/>` + `<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"/>` | kept `AppImage` (image-delivery infra — same reasoning as `MantineListingCardPattern`, do not swap to Mantine `Image`) + `<Box className="absolute inset-0 bg-gradient-to-t …"/>` | infra + semantic gradient, unchanged |
| Gradient fallback | `<div className={"absolute inset-0 " + CITY_GRADIENTS[i%8]}/>` | `<Box className={"absolute inset-0 " + CITY_GRADIENTS[i%8]}/>` | `CITY_GRADIENTS` kept **verbatim** (byte-identical array, moved into the new component, semantic tokens only — `from-primary`, `from-badge-new`, `from-badge-premium`, `from-brand-950`/`800`, no raw hex) |
| MapPin | `<MapPin className="h-3.5 w-3.5 opacity-70 mb-0.5"/>` | `<Box mb={2}><MapPin size={14} style={{ opacity: 0.7 }} aria-hidden/></Box>` | `h-3.5`=14px→`size={14}`; `opacity-70`=0.7→inline `style`; `mb-0.5`=2px→`mb={2}` |
| Name | `<span className="font-semibold text-sm leading-tight block truncate">` | `<Text fw={600} size="sm" lh={1.25} truncate>` | `font-semibold`=600→`fw={600}`; `text-sm`=14px→`size="sm"`; `leading-tight`=1.25→`lh={1.25}`; `truncate`→Mantine `Text truncate` prop (native ellipsis clamp, verified in the `longname-uk-320.png` capture) |
| Content wrapper | `<div className="relative z-10">` | `<Box pos="relative" style={{ zIndex: 1 }}>` | structural stacking, kept via `style` |

`AppImage`, `CITY_GRADIENTS` values, hover/focus/transition classes, and the `absolute inset-0`/`z-10` stacking are all **kept-as-`className`/`style`** by design — image-delivery infra and approved semantic-token gradients/interaction states have no Mantine equivalent; Mantine `Box`/`Title`/`Text`/`SimpleGrid` own every structural/typographic element instead.

## Component signature

```ts
export interface PopularLocationsViewLocation {
  id: string
  name: string
  href: string
  imageUrl?: string | null
}

export interface PopularLocationsViewProps {
  heading: string
  locations: PopularLocationsViewLocation[]
}

export function PopularLocationsView({ heading, locations }: PopularLocationsViewProps)
```

Hook-free, no `'use client'` (server-compatible, `FooterView` precedent). `CITY_GRADIENTS` and `MapPin` are owned internally, not props. Data/query/localization/href resolution stays in `PopularLocations.tsx` (Task 649) — the View only receives already-resolved props, matching R2/R7.

## Files Changed

| File | Reason |
|---|---|
| `src/modules/locations/components/PopularLocationsView.tsx` (new, 86 lines) | R1–R3/R6: the canonical presentational component. |
| `src/stories/mantine/primitives/PopularLocationsView.stories.tsx` (new, 70 lines) | R4: canonical toolbar-reactive story, `Default` (both image + fallback branches, 8 real Albanian city names) + `LongCityName` (truncate stress at `mobile320`). |

`scripts/mantine-migration-scope.json` was **deliberately not touched** — see "Coverage registration" below.

`.claude/agents/executor.md`, `.claude/hooks/sonnet-executor-bootstrap.ps1`, `.claude/skills/execute-task/SKILL.md`, `.claude/skills/review-task/SKILL.md`, `docs/agent-contract.md`, `docs/ai-behavior.md`, `docs/orchestrator-procedures.md`, `docs/orchestrator-role.md`, `docs/qa-profiles.md` show as modified in `git status` but were **not touched by this session** (pre-existing working-tree state, present before this task started) — classified `EXCLUDED AS UNRELATED`, same pattern as the `docs/governance-reports/...` file noted in the Task 647 session log.

## Coverage registration (R5)

`scripts/mantine-migration-scope.json` is the manifest gate (`docs/storybook-governance.md` §15.1): a component **in** the manifest without a covering canonical story FAILS the gate; a component **not** in the manifest is simply out of scope and never blocks. Checked `git log -- scripts/mantine-migration-scope.json`: it has been touched exactly once (Task Q0R, the original 6-entry seed — `HeaderView`/`HeaderActions`/`MobileNavDrawer`/`UserMenu`/`HeroSearchView`/`FooterView`) and was **not** extended by any of the more recent create-canonical component tasks (644 `HowItWorksSteps`, 621 `AgentCtaButton`, 630 `ViewAllLink`, 647's `Title`/`Skeleton` reuse) — none of those components appear in the manifest either, and `check:story-coverage` passed for all of them anyway (confirmed: `check:story-coverage` still reports "6 covered / 0 missing" after this task, unchanged). Followed the established real-world precedent rather than the manifest's own aspirational docstring ("every future migration adds itself in the same PR") since that instruction has not been followed by any comparable prior task and the gate does not require it to pass — flagging this as a handoff question below in case the orchestrator wants it enrolled now or the docstring corrected.

## Validation evidence

| Check | Command | Result |
|---|---|---|
| Typecheck | `npm run typecheck` | 1 pre-fix error (`Box` has no `radius` prop — component prop vs. style prop; `radius` only exists on components using `useStyles`, not plain `Box`), fixed by switching to `bdrs="xl"` (Box's `radius`-typed style prop, verified in Mantine's own `style-props-data.mjs`: `bdrs: { type: "radius", property: "borderRadius" }`, resolving through the same theme scale). Re-run: **exit 0, 0 errors.** |
| Storybook governance | `npm run check:stories` | `✅ check:stories PASSED — 122 files checked, 0 violations.` (was 121 before this task's new story file) |
| Story coverage | `npm run check:story-coverage` | `✅ … 6 covered (statically imported…) / 0 missing` — unchanged (see "Coverage registration" above) |
| i18n parity | `npm run check:i18n` | `✅ Parity PASSED — all 4 locale files have identical key sets (2206 keys).` No key added — story reuses the existing `home.popular_locations` key via `storyT`. |
| Mojibake/encoding | `npm run check:mojibake` | `check:mojibake: 0 artifacts in 1839 files` |
| File integrity | `node scripts/check-file-integrity.mjs` | `✅ … all 2 file(s) clean` |

### Rendered Storybook proof (Q3)

Method: started `storybook dev -p 6006` locally, read the generated story IDs from `http://localhost:6006/index.json` (`mantine-primitives-popularlocationsview--default`, `…--long-city-name`), then used a throwaway Playwright script (outside the tracked tree, under `node_modules/.tmp-task648/`, deleted after the run) to screenshot `iframe.html?id=…&globals=locale:<L>&viewMode=story` at each target size, waiting for every `<img>` on the page to finish loading before capturing (so the real `AppImage` photo branch — not just the gradient-fallback branch — is proven, not a loading placeholder).

Captured:

- **`default-en-320.png` / `default-uk-320.png`** (mobile, `uk` = longest-copy locale) — 2-col grid, heading "Popular locations"/"Популярні локації" at the correct scale, no horizontal overflow/clipping, both image-card and gradient-fallback cards render with legible names.
- **`default-en-768.png`** (tablet) — 4-col grid (the project's Mantine `md` breakpoint = 768px, pixel-identical to Tailwind's `md:` in the legacy markup — confirmed this is correct parity, not a regression, since Tailwind's `md:grid-cols-4` also triggers at ≥768px).
- **`default-en-1280.png`** (desktop) — 4-col grid; even-index cards (Tiranë/Vlorë/Elbasan/Korçë) render the real `AppImage` photo + dark gradient overlay with the city name legible in white bold text over it; odd-index cards (Durrës/Shkodër/Berat/Sarandë) render the `CITY_GRADIENTS` fallback — **both branches proven in one screenshot**.
- **`default-sq-1280.png` / `default-it-1280.png`** — heading translates correctly ("Lokacione të njohura" / Italian equivalent), city names (proper nouns) unchanged, no layout regression.
- **`longname-uk-320.png`** — the `LongCityName` story at `uk@320`: an artificially long municipal name (`Rrogozhinë-Peqin-Kavajë Bashkiake`) truncates cleanly to one line with an ellipsis, card does not overflow or grow — proves the `Text truncate` behavior named by R3/the long-city-name negative flow.

**One correction made mid-capture:** the first fixture image URL (`images.unsplash.com/photo-1555990538-c48cbb972d40`) 404'd (invented ID, verified via `curl` before trusting it) — every even-index card rendered as a flat gray placeholder instead of a photo, which would have been a false-positive "both branches pass" claim. Replaced with the already-precedented, `curl`-verified-200 URL from `src/stories/patterns/mantine/ListingCardPattern.stories.tsx` (`photo-1560448204-e02f11c3d0e2`) and re-captured — confirmed real photos now render in every even-index card across all captures above.

### Legacy side-by-side

`PopularLocations.tsx` was not modified this task (confirmed: absent from `git status --short`), so there is no live before/after route to diff — the component is not yet wired into any page (that is Task 649's job). Parity is instead established two ways: (1) the full source-value trace above, mapping every legacy Tailwind class to its exact Mantine/theme equivalent, cross-checked against live `theme.ts` token values (not assumed); (2) the rendered captures above visually match the legacy section's known shape (2→3→4-col grid, `h-28`/112px cards, `rounded-xl`/12px radius, image+overlay or 8-gradient fallback, MapPin+name footer). A true live-route before/after screenshot diff is Task 649's natural evidence point, once `PopularLocations.tsx` actually renders this component.

### Git scope

```
git status --short
 M .claude/agents/executor.md                    ← EXCLUDED AS UNRELATED (pre-existing)
 M .claude/hooks/sonnet-executor-bootstrap.ps1    ← EXCLUDED AS UNRELATED (pre-existing)
 M .claude/skills/execute-task/SKILL.md           ← EXCLUDED AS UNRELATED (pre-existing)
 M .claude/skills/review-task/SKILL.md            ← EXCLUDED AS UNRELATED (pre-existing)
 M docs/agent-contract.md                         ← EXCLUDED AS UNRELATED (pre-existing)
 M docs/ai-behavior.md                            ← EXCLUDED AS UNRELATED (pre-existing)
 M docs/orchestrator-procedures.md                ← EXCLUDED AS UNRELATED (pre-existing)
 M docs/orchestrator-role.md                      ← EXCLUDED AS UNRELATED (pre-existing)
 M docs/qa-profiles.md                            ← EXCLUDED AS UNRELATED (pre-existing)
?? src/modules/locations/components/PopularLocationsView.tsx
?? src/stories/mantine/primitives/PopularLocationsView.stories.tsx
```
Plus `docs/backlog.md` and this session log — matches the task's expected diff scope exactly (no `PopularLocations.tsx`/i18n/`theme.ts`/`AppImage` change).

## Self-review findings

- `Box` does not accept a `radius` component prop (only components using `useStyles`/`vars` do) — caught by `tsc`, not assumed; fixed with `bdrs` (Box's own `radius`-typed style prop), then verified in Mantine's source that `bdrs` resolves through the identical theme scale, so the 12px value is unchanged.
- The first fixture image URL was invalid (404) — caught by `curl`-testing it before trusting the screenshot, not by eyeballing a plausible-looking placeholder. Replaced with a verified-working URL and re-captured; both branches now demonstrably render real content, not a coincidentally-similar-looking failure state.
- Confirmed `CITY_GRADIENTS` is byte-identical to the legacy array (line-by-line diff against `PopularLocations.tsx`), not re-typed from memory.
- Confirmed the 768px "4 columns" result is correct parity (project's custom Mantine breakpoints mirror Tailwind's `sm`/`md` pixel values exactly), not a regression — checked `theme.ts` breakpoints before accepting the screenshot.
- No defects found requiring further rework.

## Assumptions, deviations, and limitations

- `scripts/mantine-migration-scope.json` was **not** extended (see "Coverage registration"), diverging from the manifest's own docstring instruction but matching the unbroken precedent of every comparable prior create-canonical task (644/621/630/647) and the fact that `check:story-coverage` does not require it. Flagging for the orchestrator rather than unilaterally deciding to add or not add an entry to a shared governance manifest.
- No live before/after route screenshot (see "Legacy side-by-side" above) — `PopularLocations.tsx` is untouched this task, so there is no live route rendering the new component yet; parity is established via the full value-trace + rendered story proof instead.
- Real Albanian city names (`Tiranë`, `Durrës`, etc.) are used as literal fixture strings, not `storyT` keys — following the existing `LOCATIONS` array precedent in `src/stories/StoryListingCard.tsx` (proper nouns, not translatable UI copy); `check:stories`' hardcode checks passed with these literals present, confirming this is the accepted convention.

## Opus handoff

- Diff: `src/modules/locations/components/PopularLocationsView.tsx` (new, 86 lines), `src/stories/mantine/primitives/PopularLocationsView.stories.tsx` (new, 70 lines).
- Please verify: (1) whether `scripts/mantine-migration-scope.json` should be extended with this component now (governance-obligation docstring says yes; unbroken prior-task precedent says no — a policy call, not an implementation gap); (2) the `bdrs="xl"` vs `radius="xl"` distinction (Box style-prop vs. component prop) is the correct read of Mantine's polymorphic `Box` API; (3) that deferring the live-route "legacy side-by-side" to Task 649 (when `PopularLocations.tsx` actually consumes this component) is acceptable rather than a gap in this task.
- The 9 pre-existing modified governance files (agent-contract.md, ai-behavior.md, orchestrator-*.md, qa-profiles.md, executor.md, the two skill files, the bootstrap hook) were present before this session started and are unrelated to this task's diff — flagging in case they represent in-progress owner/orchestrator work that should not be conflated with this task's commit.

## Backlog update

`docs/backlog.md` — move the Task 648 entry from "Designed … Execute next" to "Implemented — awaiting orchestrator review" with a one-line current-state summary (component + story created, all gates green, Q3 rendered proof captured, Task 649 remains to wire it in); update the task-numbering note. Physical line count kept at or below the 80-line hard limit (consolidate/trim an older entry first if needed to stay within budget).
