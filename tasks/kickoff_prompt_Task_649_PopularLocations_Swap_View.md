# Task 649 — Refactor the data-fetching `PopularLocations` server component to render `<PopularLocationsView/>` (Task 648), removing the inline legacy markup and the now-dead `Link`/`MapPin`/`AppImage`/`CITY_GRADIENTS`; keep the Supabase query, null-guard, name localization, and href building

- **Task number:** 649
- **Epic:** MM — Mantine/TailAdmin Restyle (homepage completion, **block B, Story-first slice 2 of 2 — closes the homepage migration except HeroSearch/Phase-2**).
- **Parent / origin:** Task 648 created the canonical `PopularLocationsView` Mantine component + Storybook story (committed `cf1835399`), proven in both image + fallback branches. This slice wires it into the live `PopularLocations` server component and deletes the inline legacy markup.

## Mode and task type

- **Mode:** implementation kickoff for a fresh Sonnet session (execute via `.claude/skills/execute-task/SKILL.md`).
- **Task type:** consume-canonical UI swap in one server component (`PopularLocations.tsx`) — keep the data layer (Supabase query + null-guard + localization + href), replace the inline rendered section with `<PopularLocationsView/>`, drop dead imports. No new component, no i18n, no visual redesign (648 preserves the look).
- **Build gate (new governance policy, committed `67340ff49`):** this non-Q0 task MUST include a final `npm run build` with exit 0 in its validation evidence.

## Objective

In `src/modules/locations/components/PopularLocations.tsx`: keep the Supabase featured-city query, the `if (!locations?.length) return null` guard, the `getTranslations`/`getLocale`, and the per-row name localization + href; map the fetched rows to `PopularLocationsViewLocation[]` and render `<PopularLocationsView heading={t('popular_locations')} locations={…} />`. Remove the inline `<section>`/`<h2>`/grid/`Link`/`AppImage`/`MapPin` markup and the `CITY_GRADIENTS` array (all now owned by the View), and drop the `Link`, `MapPin`, `AppImage` imports. The rendered section must look identical to before.

## Verified context

Inspected on 2026-07-20 against `HEAD` (Task 648 + governance build-gate committed). `PopularLocations.tsx` is a **server component** (`getTranslations`/`getLocale` from `next-intl/server`, `createClient` from `@/lib/supabase/server`).

### Current `PopularLocations.tsx` (data + inline markup)

- **Data layer (KEEP):**
  ```tsx
  const supabase = await createClient()
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name_al, name_en, slug, type, parent_id, region_id, lat, lng, image_url, is_featured, display_order')
    .eq('is_featured', true).eq('type', 'city')
    .order('display_order', { ascending: true }).order('name_al', { ascending: true })
    .limit(8)
  if (!locations?.length) return null
  const [t, locale] = await Promise.all([getTranslations('home'), getLocale()])
  ```
- **Per-row derivation (KEEP, move into the `.map`):** `name = locale === 'sq' ? loc.name_al : (loc.name_en ?? loc.name_al)`; `href = /${locale}/listings?location_id=${loc.id}`; `imageUrl = loc.image_url`.
- **Inline markup (REMOVE):** the `<section className="py-… bg-muted/30 …">` + `<div className="container-wide">` + `<h2>` + `<div className="… grid …">` + the `<Link>` cards (`AppImage`/overlay/`CITY_GRADIENTS`/`MapPin`/name) + the `CITY_GRADIENTS` constant. **All of this is reproduced inside `PopularLocationsView`** (which owns the `<section>` wrapper too — verified: `PopularLocationsView` renders `<Box component="section" className="py-12 … bg-muted/30 [content-visibility:auto] [contain-intrinsic-size:auto_380px]">`). So `PopularLocations` must NOT render its own `<section>` — it returns `<PopularLocationsView/>` directly.
- **Imports to drop:** `Link` (next/link), `MapPin` (lucide-react), `AppImage`. **Keep:** `getTranslations`/`getLocale`, `createClient`, `Location` type. **Add:** `import { PopularLocationsView, type PopularLocationsViewLocation } from '@/modules/locations/components/PopularLocationsView'`.

### Task 648 component API (available, committed)

```ts
export interface PopularLocationsViewLocation { id: string; name: string; href: string; imageUrl?: string | null }
export interface PopularLocationsViewProps { heading: string; locations: PopularLocationsViewLocation[] }
export function PopularLocationsView({ heading, locations }: PopularLocationsViewProps): JSX.Element
```
- The View owns the section wrapper, heading, grid, cards, `CITY_GRADIENTS`, `MapPin`, `AppImage`, and interaction states. `PopularLocations` supplies only `heading` + the mapped `locations` (already-localized `name`, built `href`, `imageUrl` from `image_url`).

### Suggested refactored render

```tsx
if (!locations?.length) return null
const [t, locale] = await Promise.all([getTranslations('home'), getLocale()])
const viewLocations: PopularLocationsViewLocation[] = (locations as Location[]).map(loc => ({
  id: loc.id,
  name: locale === 'sq' ? loc.name_al : (loc.name_en ?? loc.name_al),
  href: `/${locale}/listings?location_id=${loc.id}`,
  imageUrl: loc.image_url,
}))
return <PopularLocationsView heading={t('popular_locations')} locations={viewLocations} />
```

## Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Swap | `PopularLocations` renders `<PopularLocationsView heading={t('popular_locations')} locations={mapped}/>`; the inline `<section>`/`<h2>`/grid/`Link` markup + `CITY_GRADIENTS` are removed | P0 | `git diff`; rendered `/{locale}` | Confirmed |
| R2 | Data preserved | The Supabase query, `.eq`/`.order`/`.limit(8)` filters, the `if (!locations?.length) return null` guard, the `sq`→`name_al` else `name_en ?? name_al` localization, and the `href` are unchanged; `imageUrl` maps from `image_url` | P0 | `git diff`; the section renders the same locations as before | Confirmed |
| R3 | Import hygiene | `PopularLocationsView` imported; `Link`, `MapPin`, `AppImage` removed; `createClient`/`getTranslations`/`getLocale`/`Location` kept; no double `<section>` | P0 | `git diff`; `typecheck` (no unused/undefined) | Confirmed |
| R4 | Visual parity | The rendered section looks identical to before (heading, city cards image/gradient branches, MapPin, names, responsive 2→3→4, `data-track`, `content-visibility`) | P0 | Rendered `/{locale}` before/after incl. uk@320 | Confirmed |
| R5 | Isolation | No change to `PopularLocationsView.tsx`, i18n, `theme.ts`, the query schema, or other files | P0 | `git diff` scope | Confirmed |
| R6 | Gates + build | `typecheck`, `check:stories`, `check:i18n`, `check:mojibake` green AND `npm run build` exits 0 (mandatory per governance `67340ff49`); no i18n key change | P0 | Commands exit 0 | Confirmed |

## Assumptions and open questions

- **`PopularLocations` stays a server component** — the View is server-compatible; do not add `'use client'`.
- **The View owns the `<section>`** — `PopularLocations` returns `<PopularLocationsView/>` (or `null`), NOT a `<section>` wrapping it (avoid a double section).
- **Localization/href logic is unchanged** — moved verbatim into the `.map` callback.
- **`imageUrl: loc.image_url`** — `image_url` may be `null`; the View's `imageUrl?: string | null` handles it (renders the gradient fallback), matching the legacy `loc.image_url ? … : fallback`.
- **No i18n key change** — reuse `home.popular_locations`.
- **Build gate** — this is a non-Q0 task; a passing `npm run build` transcript is required evidence (new policy).

## Pre-read rule bundle

- `docs/agent-contract.md` (clauses 1 scope, 7 i18n, 9 validation + **mandatory build**, 12 rendered evidence, 14 file integrity).
- `docs/rule-index.md` (current-Mantine consume/swap).
- `docs/qa-profiles.md` (Q3 visual — live homepage section) + viewport/locale matrix.
- Source: `src/modules/locations/components/PopularLocations.tsx` (target), `src/modules/locations/components/PopularLocationsView.tsx` (Task 648 component, consumed), `src/types/database.ts` (`Location`), `src/components/layout/FooterView` usage precedent (view + data-fetch split).

## Scope

1. In `PopularLocations.tsx`: add the `PopularLocationsView` import; keep the query/guard/translations; map rows → `PopularLocationsViewLocation[]`; render `<PopularLocationsView/>`; remove the inline markup + `CITY_GRADIENTS` + the `Link`/`MapPin`/`AppImage` imports.
2. Produce the Q3 rendered proof on the real `/{locale}` route (before/after parity, viewports incl. uk@320, four locales) **and the `npm run build` exit-0 transcript**.
3. Write the session log + a concise `docs/backlog.md` entry; note this closes block B and the homepage migration except HeroSearch (Phase-2). Keep ≤80 lines (consolidate first if needed).

## Out of scope

- `PopularLocationsView.tsx` (Task 648 — do not modify), the Supabase query schema/filters, i18n keys, `theme.ts`.
- HeroSearch (Phase-2), any other homepage section, any visual redesign.

## Current and required behavior

- **Current:** `PopularLocations` fetches data AND renders the section inline with legacy Tailwind markup (`Link`/`AppImage`/`MapPin`/`CITY_GRADIENTS`).
- **Required after:** `PopularLocations` fetches data, maps it, and renders `<PopularLocationsView/>`; the inline markup + dead imports are gone; the section looks identical; the query/guard/localization are unchanged; the component stays server-side.

## Positive and negative flows

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Featured cities present (image + gradient mix) | **Yes** | R1/R4 | section renders via View, identical to legacy | Rendered `/en` desktop |
| No featured cities | **Yes** | R2 | `return null` → section absent (unchanged) | Code inspection |
| City with no `image_url` | **Yes** | R2/R4 | gradient fallback (View handles `imageUrl=null`) | Rendered |
| Locale name resolution (sq vs en/uk/it) | **Yes** | R2 | `sq`→`name_al`, else `name_en ?? name_al`, unchanged | Rendered per locale |
| Mobile uk@320 parity | **Yes** | R4 | 2-col, truncate, no overflow, identical | Rendered uk@320 |
| Dead-import removal compiles | **Yes** | R3 | no unused/undefined `Link`/`MapPin`/`AppImage` | `typecheck` + `build` green |
| Production build | **Yes** | R6 | `npm run build` exits 0 (new gate) | Build transcript |
| i18n key change | No | reuse `home.popular_locations` | `check:i18n` unchanged |

## Acceptance criteria

- `AC1 [R1]` Given the diff, then `PopularLocations` renders `<PopularLocationsView heading={t('popular_locations')} locations={mapped}/>` and the inline section/heading/grid/`Link`/`CITY_GRADIENTS` markup is removed (no double `<section>`).
- `AC2 [R2]` Given the change, then the Supabase query/filters/`limit(8)`, the null-guard, the `sq`/`name_en??name_al` localization, and the `href` are unchanged; `imageUrl` maps from `image_url`.
- `AC3 [R3]` Given the diff, then `Link`/`MapPin`/`AppImage` are removed, `PopularLocationsView` imported, `createClient`/`getTranslations`/`getLocale`/`Location` kept, `typecheck` passes.
- `AC4 [R4]` Given the rendered `/{locale}` homepage (viewports incl. uk@320 × four locales), then the popular-locations section is visually identical to the pre-swap legacy render.
- `AC5 [R6]` Given the repo, then typecheck + check:stories + check:i18n + check:mojibake all exit 0, **`npm run build` exits 0**, and no i18n key changed.

## QA profile and verification plan

**Profile: Q3 Visual (live homepage section swap) + mandatory build gate.** Evidence:

1. `npm run typecheck` → 0 errors.
2. `npm run check:stories` → exit 0.
3. `npm run check:i18n` → unchanged parity.
4. `npm run check:mojibake` → 0 artifacts.
5. `npm run build` → **exit 0** (mandatory per governance `67340ff49`; capture the transcript).
6. **Rendered proof (real `/{locale}` route):** capture the popular-locations section before (legacy `HEAD`) and after at the mandated viewport set × four locales, `uk@320` mandatory; confirm visual parity (image + gradient branches, MapPin, names, 2→3→4 responsive). Live-app capture path (Tasks 621/630/645/646 precedent). If the sandbox cannot run the app, record it as missing evidence with the exact owner-native command + expected result and request the owner's visual confirmation.
7. `git status --short` / `git diff --stat` → only `PopularLocations.tsx`, `docs/backlog.md`, and the session log. Classify any harness/other-WIP path as `EXCLUDED AS UNRELATED`.

Q3 cannot be approved without the rendered `/{locale}` parity evidence incl. uk@320 and the passing `npm run build`.

## Completion report contract

Write `docs/sessions/2026-07-20-task649-popularlocations-swap-view.md` + a concise `docs/backlog.md` update. Include: a Files Changed table; R1–R6 with evidence; the before/after of `PopularLocations` (data kept, markup removed, imports dropped); typecheck/check:stories/check:i18n/mojibake **and `npm run build`** results; the rendered `/{locale}` before/after parity (incl. uk@320 × four locales); explicit confirmation that `PopularLocationsView`, the query, i18n, and `theme.ts` are unchanged and the component stays server-side; and a note that this closes block B / the homepage migration except HeroSearch (Phase-2). Final status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED` — never self-approval. Do not run or emit mutating git.

Handoff: execute via `.claude/skills/execute-task/SKILL.md` against this file path.

## Task quality gate

- A fresh Sonnet session can execute this without chat context: the data layer to keep verbatim, the row→`PopularLocationsViewLocation` mapping, the View API + import, the exact imports to drop (`Link`/`MapPin`/`AppImage`) and keep, the no-double-`section` rule, and the Q3 render matrix + mandatory build gate are all named. ✅
- Every P0 requirement has a binary AC and a verification method; the build gate is explicit. ✅
- Scope protects the query/guard/localization/href and every other section; names what must not change. ✅
- No i18n key change; no `PopularLocationsView.tsx` change (648 owns it). ✅
- Negative flows selected by applicability (cities-present/none/no-image/locale/mobile/import-compile/build in; i18n-change out). ✅
