# Task 648 — Create a canonical Mantine `PopularLocationsView` presentational component (heading + featured-city image-card grid) reproducing the current `PopularLocations` look, plus its toolbar-reactive canonical Storybook story + coverage registration. Do NOT touch the data-fetching `PopularLocations` yet (that is Task 649).

- **Task number:** 648
- **Epic:** MM — Mantine/TailAdmin Restyle (homepage completion, **block B, Story-first slice 1 of 2**).
- **Parent / origin:** Homepage Mantine-migration audit (2026-07-20). `PopularLocations.tsx` is a fully-legacy server component (own `<section>`+`<h2>`+city-card grid built with raw Tailwind, `AppImage`, gradient fallbacks, `MapPin`). Owner directive: Story-first, preserve the look. This slice builds + proves the presentational view in isolation; Task 649 refactors the data-fetching `PopularLocations` to consume it.

## Mode and task type

- **Mode:** implementation kickoff for a fresh Sonnet session (execute via `.claude/skills/execute-task/SKILL.md`).
- **Task type:** **create-canonical** Mantine UI — a new presentational component (prop-driven, server-compatible like `FooterView`) + its canonical toolbar-reactive Storybook story + coverage registration. Visual target = **preserve the look**. Decorative gradients + `AppImage` + interaction-state classes are kept (image infra + semantic-token gradients); structural containers and typography move to Mantine.

## Objective

Create `src/modules/locations/components/PopularLocationsView.tsx` — a presentational component that takes the heading + a list of featured locations as props and renders the section (heading + a 2→3→4-column grid of city image-cards, each: an `AppImage` with a dark gradient overlay OR a fallback gradient, plus a `MapPin` + the city name), visually matching the current `PopularLocations`, built from Mantine primitives (`Title`/`Text`/`Box`/`SimpleGrid`, `Box component={Link}` for the card) + theme tokens, with decorative gradients/`AppImage`/hover+focus kept as `className`. Add its canonical Storybook story (`src/stories/mantine/primitives/PopularLocationsView.stories.tsx`, toolbar-reactive locale + viewport) exercising both the image-card and gradient-fallback branches, and register it for coverage. **No change to `PopularLocations.tsx`** (Task 649).

## Verified context

Inspected on 2026-07-20 against `HEAD` (Task 647 committed). Reference by structure.

### Current `PopularLocations.tsx` (legacy server component — the section to reproduce)

```tsx
<section className="py-12 md:py-16 2xl:py-20 bg-muted/30 [content-visibility:auto] [contain-intrinsic-size:auto_380px]">
  <div className="container-wide">
    <h2 className="text-xl sm:text-2xl 2xl:text-3xl font-bold mb-6">{t('popular_locations')}</h2>
    <div className="popular-locations grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {locations.map((loc, i) => (
        <Link href={`/${locale}/listings?location_id=${loc.id}`}
          className="relative flex flex-col justify-end h-28 rounded-xl overflow-hidden p-3 text-primary-foreground hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          data-track="popular_location_click">
          {loc.image_url ? (
            <>
              <AppImage variant="listing-thumb" src={loc.image_url} alt={name} className="absolute inset-0" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            </>
          ) : (
            <div className={`absolute inset-0 ${CITY_GRADIENTS[i % CITY_GRADIENTS.length]}`} />
          )}
          <div className="relative z-10">
            <MapPin className="h-3.5 w-3.5 opacity-70 mb-0.5" aria-hidden />
            <span className="font-semibold text-sm leading-tight block truncate">{name}</span>
          </div>
        </Link>
      ))}
    </div>
  </div>
</section>
```
- `CITY_GRADIENTS` = 8 semantic-token Tailwind gradients (`from-primary to-brand-950`, `from-badge-new …`, `from-badge-premium …`, etc.) — **keep verbatim** (semantic tokens, no raw hex); the component owns this array internally.
- Data currently comes from a Supabase server query (kept in `PopularLocations`, Task 649). The name is localized (`sq` → `name_al`, else `name_en ?? name_al`) and the href is `/${locale}/listings?location_id=${loc.id}` — in this task the **View takes already-resolved `name` + `href`** as props (the data/localization/query stays in `PopularLocations`, Task 649).

### Server-component + Mantine precedent

`FooterView.tsx` (server component, no `'use client'`) imports `@mantine/core` `Box/Stack/Group/Flex` and uses `Box component="footer" className="container-wide …"`. `PopularLocationsView` follows the same shape: server-compatible, Mantine primitives + `className` for layout/gradients, prop-driven for story isolation. `Box component={Link}` (next/link) renders the clickable card.

### Visual source trace (preserve exactly)

| Artifact | Current Tailwind | Mantine/theme target | Token |
|---|---|---|---|
| Section wrapper | `<section className="py-… bg-muted/30 [content-visibility:auto]…">` + `container-wide` | keep as `Box component="section" className="…"` (layout, like FooterView) | — |
| Heading | `<h2 className="text-xl sm:text-2xl 2xl:text-3xl font-bold mb-6">` | `<Title order={2} fw={700} fz={{base:'1.25rem',sm:'1.5rem',xxl:'1.875rem'}} mb="xl">` | `mb-6`=24px=`xl`; same scale as Tasks 644/646 |
| Grid | `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3` | `<SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">` | `gap-3`=12px=`sm` |
| Card container | `<Link className="relative flex flex-col justify-end h-28 rounded-xl overflow-hidden p-3 text-primary-foreground hover:opacity-90 … focus-visible:ring-2 …">` | `<Box component={Link} href={loc.href} pos="relative" h={112} p="sm" c="white" className="flex flex-col justify-end overflow-hidden hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" radius="xl" data-track="popular_location_click">` | `h-28`=112px (`h={112}` numeric); `rounded-xl`=12px=`radius="xl"`; `p-3`=12px=`p="sm"`; `text-primary-foreground`=white=`c="white"`; hover/focus/flex-justify kept as `className` (interaction states + flex, hard-tokenized) |
| Image + overlay | `<AppImage variant="listing-thumb" className="absolute inset-0"/>` + `<div className="absolute inset-0 bg-gradient-to-t from-black/60 …"/>` | **keep** `AppImage` (image infra) + the overlay as a `Box className="absolute inset-0 bg-gradient-to-t …"` | infra + semantic gradient |
| Gradient fallback | `<div className={"absolute inset-0 " + CITY_GRADIENTS[i%8]}/>` | `<Box className={"absolute inset-0 " + CITY_GRADIENTS[i%8]}/>` | keep CITY_GRADIENTS verbatim |
| MapPin | `<MapPin className="h-3.5 w-3.5 opacity-70 mb-0.5"/>` | `<Box mb={2}><MapPin size={14} style={{ opacity: 0.7 }} aria-hidden/></Box>` (or `MapPin size={14}` with `opacity`) | `h-3.5`=14px; `opacity-70`=0.7; `mb-0.5`=2px |
| Name | `<span className="font-semibold text-sm leading-tight block truncate">` | `<Text fw={600} size="sm" lh={1.25} truncate>` | `font-semibold`=600; `text-sm`=14px; `leading-tight`=1.25; `truncate` |
| Content wrapper | `<div className="relative z-10">` | `<Box pos="relative" style={{ zIndex: 1 }}>` (or `className="relative z-10"`) | — |

- The `absolute inset-0` layers and `z-10` stacking are structural — keep as `className`/`style` (Mantine `Box` accepts both). The point is Mantine `Box`/`Title`/`Text`/`SimpleGrid` own the elements; gradients/`AppImage`/interaction stay as classes.

### Story + coverage conventions

- `src/stories/mantine/primitives/PopularLocationsView.stories.tsx`, `title: 'Mantine/Primitives/PopularLocationsView'`, `parameters: { skipCanvas: true, layout: 'fullscreen' }`, `storyT(locale, 'home.popular_locations')` via `context.globals.locale` (toolbar-reactive). Fixture: ~8 locations, **some with `imageUrl` and some without**, so the story exercises both the image-card+overlay branch and the gradient-fallback branch. Precedent: `FooterView.stories.tsx`, and Task 644's `HowItWorksSteps.stories.tsx`.
- Coverage: register via the real gate (`check:story-coverage` / `scripts/mantine-migration-scope.json` per `docs/storybook-governance.md`) — the same path Tasks 644/630/FooterView used; the stale `docs/component-coverage-matrix.md`/`component-catalog.md` are NOT the gate (Task 644 confirmed). Ensure `check:story-coverage` passes.
- Toolbar-reactive viewport: render across the mandated viewport matrix incl. `uk@320` (Q3).

## Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Component | `PopularLocationsView.tsx` renders heading + 2→3→4-col grid of city image-cards (image+overlay OR fallback gradient, MapPin + name) from Mantine primitives + theme tokens; visual preserves the current look | P0 | `git diff`; Storybook render | Confirmed |
| R2 | Props/i18n | Takes `{ heading: string; locations: { id; name; href; imageUrl?: string \| null }[] }`; owns `CITY_GRADIENTS` + `MapPin` internally; no hardcoded visible copy; renders in the story via `storyT`; no i18n key added | P0 | `git diff`; story render; `check:i18n` unchanged | Confirmed |
| R3 | Preserve look | Card height/radius/padding, image+overlay, fallback gradients, MapPin size/opacity, name (fw600/14px/truncate), heading scale, grid cols/gap match the legacy per the trace; decorative gradients/`AppImage`/hover+focus kept as `className` | P0 | Visual source trace; Storybook vs legacy side-by-side | Confirmed |
| R4 | Canonical story | `Mantine/Primitives/PopularLocationsView` story renders toolbar-reactively (locale + viewport), exercises both image + fallback branches, incl. `uk@320` | P0 | Storybook build; rendered matrix | Confirmed |
| R5 | Coverage | Registered so `check:story-coverage` + `check:stories` pass | P0 | Commands exit 0 | Confirmed |
| R6 | Provenance | Every migrated value traces to a theme token or is a kept semantic-token class/infra (`AppImage`, CITY_GRADIENTS, hover/focus) with a documented reason; canonical UI decision record = `create canonical` | P1 | Decision record + trace in session log | Confirmed |
| R7 | Isolation | No change to `PopularLocations.tsx`, i18n, `theme.ts`, `AppImage`, or other files; the component is used only by its story | P0 | `git diff` scope | Confirmed |
| R8 | Gates | `typecheck`, `check:stories`, `check:story-coverage`, `check:i18n`, `check:mojibake` all green; Q3 rendered proof passes | P0 | Commands exit 0 + rendered evidence | Confirmed |

## Assumptions and open questions

- **Prop-driven, server-compatible** (FooterView precedent) — no `'use client'` unless a hook is needed (none is; it is presentational). `Box component={Link}` for the card link.
- **Keep `AppImage`** for the real image (image-delivery infra, same as `MantineListingCardPattern` uses it) — do not swap to Mantine `Image`.
- **Keep `CITY_GRADIENTS` + the overlay + hover/focus as `className`** — semantic-token gradients and interaction states; Mantine has no clean equivalent and these use approved tokens. Document this in the decision record (kept-className provenance).
- **`h={112}` / `size={14}` numeric** — precedented raw-numeric component sizing (Task 644 `size={56}`, `maw={768}`); use for exact px where no token exists.
- **Heading uses the shared section-heading scale** (Tasks 644/646) — do not invent a different one.
- **`PopularLocations` data/query/localization/href stays in Task 649** — the View only receives resolved props.

## Pre-read rule bundle

- `docs/agent-contract.md` (clauses 1 scope, 7 i18n, 11 mobile, 12 rendered evidence, 13 Storybook/no-hardcode, 14 file integrity, 16 TailAdmin, 16b canonical provenance).
- `docs/rule-index.md` (current-Mantine create-canonical UI).
- `docs/qa-profiles.md` (Q3 visual) + viewport/locale matrix; `docs/storybook-governance.md` (coverage gate).
- `docs/mantine-responsive-design-system.md` (SimpleGrid/Box/Text/Title + responsive props), `docs/tailadmin-style-reference.md`, `docs/component-rules.md`.
- Source/precedent: `src/modules/locations/components/PopularLocations.tsx` (legacy, reproduced), `src/components/layout/FooterView.tsx` + its story (server+Mantine + string-props + canonical story), `src/components/shared/HowItWorksSteps.tsx` + Task 644 (create-canonical + heading-scale + coverage precedent), `src/design-system/mantine/theme.ts` (radius.xl/spacing/brand), `src/components/ui/AppImage.tsx` (kept infra), `src/stories/_storyI18n.ts`.

## Scope

1. Create `src/modules/locations/components/PopularLocationsView.tsx` per R1–R3/R6 (Mantine primitives + kept `AppImage`/gradients/interaction classes, string+data props, internal `CITY_GRADIENTS`/`MapPin`).
2. Create `src/stories/mantine/primitives/PopularLocationsView.stories.tsx` (toolbar-reactive, both image + fallback branches, fixture locations).
3. Register for coverage (`check:story-coverage`).
4. Produce the Q3 rendered Storybook proof (locale × viewport incl. uk@320) + the canonical UI decision record + visual source trace.
5. Write the session log + a concise `docs/backlog.md` entry (block B Story-first slice 1/2; Task 649 swaps `PopularLocations`). Keep ≤80 lines (consolidate first if needed).

## Out of scope

- `PopularLocations.tsx` (data-fetching swap — Task 649), the Supabase query/localization/href logic.
- `AppImage` internals, i18n keys, `theme.ts`, CITY_GRADIENTS token values (kept verbatim), HeroSearch, any other section.

## Current and required behavior

- **Current:** the popular-locations section exists only as inline legacy markup inside the data-fetching `PopularLocations` server component; no reusable view, no Mantine story.
- **Required after:** a canonical `PopularLocationsView` Mantine component exists, visually matching the current section, proven in a toolbar-reactive Storybook story (both image + fallback branches) and registered for coverage — but not yet used by `PopularLocations` (legacy still renders the live page until Task 649).

## Positive and negative flows

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Card with image (AppImage + dark overlay) | **Yes** | R1/R3 | image fills card, gradient overlay, name legible | Storybook image-card |
| Card without image (fallback gradient) | **Yes** | R1/R3 | CITY_GRADIENTS[i%8] fills card, name legible | Storybook fallback |
| Grid responsive 2→3→4 col | **Yes** | R1/R4 | 2-col base, 3 at sm, 4 at md | Storybook widths |
| Mobile uk@320 | **Yes** | R4 | 2-col, names truncate, no overflow | Storybook uk@320 |
| Locale expansion (sq/en/uk/it) | **Yes** | R2/R4 | heading + names per locale; long names truncate | Storybook locale toolbar |
| Visual parity vs legacy | **Yes** | R3 | card height/radius/overlay/MapPin/name match | Side-by-side |
| Long city name | **Yes** | R3 | `truncate` clips with ellipsis, one line | Storybook fixture long name |
| Hover/focus states | **Yes** | R3 | hover opacity-90 + focus-visible ring preserved (className) | Storybook/inspection |
| i18n key change | No | reuse `home.popular_locations` | `check:i18n` unchanged |
| Data fetching / query | No | stays in `PopularLocations` (Task 649) | — |

## Acceptance criteria

- `AC1 [R1,R3]` Given the story, then `PopularLocationsView` renders heading + a 2→3→4-col image-card grid from Mantine primitives + theme tokens, visually matching the legacy section (both image and fallback branches), with decorative gradients/`AppImage`/interaction kept as `className`.
- `AC2 [R2]` Given the component, then it takes `{ heading, locations:[{id,name,href,imageUrl?}] }`, owns `CITY_GRADIENTS`/`MapPin` internally, hardcodes no visible copy, renders via `storyT`; no i18n key changed.
- `AC3 [R4]` Given the story, then it renders toolbar-reactively (locale + viewport), exercises both image + fallback branches, and passes the Q3 matrix incl. `uk@320`.
- `AC4 [R5,R8]` Given the repo, then the component/story is coverage-registered and typecheck + check:stories + check:story-coverage + check:i18n + check:mojibake all exit 0.
- `AC5 [R6]` Given the session log, then a `create canonical` UI decision record + full visual source trace document each value's provenance, including the explicit "kept as className" reasons for `AppImage`/CITY_GRADIENTS/hover-focus.
- `AC6 [R7]` Given the diff, then `PopularLocations.tsx`, i18n, `theme.ts`, and other files are unchanged; the component is used only by its story.

## QA profile and verification plan

**Profile: Q3 Visual (new canonical Mantine story).** Evidence:

1. `npm run typecheck` → 0 errors.
2. `npm run check:stories` → exit 0 (locale-backed strings, no forbidden raw controls).
3. `npm run check:story-coverage` → the new component is covered.
4. `npm run check:i18n` → unchanged parity (no new key).
5. `npm run check:mojibake` → 0 artifacts.
6. **Rendered Storybook proof** (Q3 matrix): `Mantine/Primitives/PopularLocationsView` across the mandated viewport set × four locales, `uk@320` mandatory, exercising both image + fallback branches; plus a side-by-side vs the legacy section for visual parity. Canonical `--mantine-only` screenshot path (Tasks 573/629/644 precedent). If a required render can't run in the sandbox, record it as missing evidence with the exact owner-native command + expected result.
7. `git status --short` / `git diff --stat` → only the new component, the new story, the coverage registration file(s), `docs/backlog.md`, and the session log. No `PopularLocations.tsx`/i18n change.

Q3 cannot be approved without the rendered Storybook matrix (incl. uk@320, both branches) and the visual-parity evidence.

## Completion report contract

Write `docs/sessions/2026-07-20-task648-popularlocationsview-mantine-component-story.md` + a concise `docs/backlog.md` update. Include: a Files Changed table; R1–R8 with evidence; the canonical UI decision record (`create canonical`) + full visual source trace (each value → theme token or kept-className reason, image/overlay/CITY_GRADIENTS/MapPin/name/hover-focus explicit); the component signature; typecheck/check:stories/check:story-coverage/check:i18n/mojibake results; the rendered Storybook matrix (locale × viewport incl. uk@320, both branches) + legacy side-by-side; explicit confirmation that `PopularLocations.tsx`/i18n/`theme.ts`/`AppImage` were unchanged; and a note that Task 649 wires this into `PopularLocations`. Final status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED` — never self-approval. Do not run or emit mutating git.

Handoff: execute via `.claude/skills/execute-task/SKILL.md` against this file path.

## Task quality gate

- A fresh Sonnet session can execute this without chat context: the legacy section verbatim, the full visual source trace (Tailwind → Mantine/theme + kept-className reasons), the component path/signature/props, the internal `CITY_GRADIENTS`/`MapPin`, the story path/title/toolbar-reactive convention + both-branches fixture, the coverage gate, and the Q3 render matrix are all named. ✅
- Every P0 requirement has a binary AC and a verification method; `create canonical` names the shared source + canonical story + coverage in one task. ✅
- Scope is Story-first only — `PopularLocations.tsx` (data swap) is explicitly Task 649; the component is used only by its story. ✅
- Visual target = preserve the look; every value traced to a token or a documented kept-className (AppImage/gradients/interaction); no i18n change. ✅
- Negative flows selected by applicability (image/fallback/responsive/locale/parity/long-name/hover-focus in; i18n-change + data-fetching out). ✅
