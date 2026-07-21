# Session — Task 649: swap `PopularLocations` to render `PopularLocationsView` (block B slice 2/2)

**Task path:** `tasks/kickoff_prompt_Task_649_PopularLocations_Swap_View.md`
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

## Requirement ledger (restated pre-implementation)

- R1 — `PopularLocations` renders `<PopularLocationsView heading={t('popular_locations')} locations={mapped}/>`; inline `<section>`/`<h2>`/grid/`Link`/`CITY_GRADIENTS` removed.
- R2 — Supabase query/filters/`limit(8)`, null-guard, `sq`/`name_en??name_al` localization, `href` unchanged; `imageUrl` maps from `image_url`.
- R3 — `Link`/`MapPin`/`AppImage` removed; `PopularLocationsView` imported; `createClient`/`getTranslations`/`getLocale`/`Location` kept; no double `<section>`.
- R4 — rendered section visually identical to before (heading, image/gradient branches, MapPin, names, 2→3→4 responsive, `data-track`, `content-visibility`).
- R5 — no change to `PopularLocationsView.tsx`, i18n, `theme.ts`, the query schema, or other files.
- R6 — typecheck/check:stories/check:i18n/check:mojibake green AND `npm run build` exits 0 (mandatory gate `67340ff49`); no i18n key change.

**Current behavior to preserve:** `PopularLocations` fetched data AND rendered the section inline with legacy Tailwind markup (`Link`/`AppImage`/`MapPin`/`CITY_GRADIENTS`).
**Required after behavior:** `PopularLocations` fetches data, maps it, and renders `<PopularLocationsView/>` (Task 648); inline markup + dead imports gone; section looks identical; query/guard/localization unchanged; stays server-side.

## Before / after

**Before** (`src/modules/locations/components/PopularLocations.tsx`, 96 lines): `Link`/`MapPin`/`AppImage` imports, full inline `<section>`/`<div className="container-wide">`/`<h2>`/grid/`<Link>` card markup, module-level `CITY_GRADIENTS` array.

**After** (43 lines): imports trimmed to `getTranslations`/`getLocale`, `createClient`, `Location` type, `PopularLocationsView` + `PopularLocationsViewLocation`. Query/guard/translations unchanged verbatim. Rows mapped to `PopularLocationsViewLocation[]` (`id`, `name`, `href`, `imageUrl`), then `return <PopularLocationsView heading={t('popular_locations')} locations={viewLocations} />`.

```tsx
const viewLocations: PopularLocationsViewLocation[] = (locations as Location[]).map(loc => ({
  id: String(loc.id),
  name: locale === 'sq' ? loc.name_al : (loc.name_en ?? loc.name_al),
  href: `/${locale}/listings?location_id=${loc.id}`,
  imageUrl: loc.image_url,
}))
return <PopularLocationsView heading={t('popular_locations')} locations={viewLocations} />
```

**Deviation from the kickoff's suggested snippet:** the kickoff's suggested `id: loc.id` does not typecheck — `types/database.ts` `Location.id` is `number`, but `PopularLocationsViewLocation.id` (Task 648, only ever used as a React `key`) is `string`. Fixed with `id: String(loc.id)`. Caught by `tsc`, not assumed; no other field required a similar fix (`name`/`href`/`imageUrl` all match verbatim).

## Files Changed

| File | Reason |
|---|---|
| `src/modules/locations/components/PopularLocations.tsx` (96→43 lines, −61/+8 per `git diff --stat`) | R1–R3: swap inline markup for `PopularLocationsView`; drop dead imports + `CITY_GRADIENTS`. |

No other tracked file touched — `git status --short` shows exactly this one path.

## Validation evidence

| Check | Command | Result |
|---|---|---|
| Typecheck | `npm run typecheck` | 1 pre-fix error (`id: number` not assignable to `id: string`), fixed via `String(loc.id)`. Re-run: **exit 0, 0 errors.** |
| Storybook governance | `npm run check:stories` | `✅ check:stories PASSED — 122 files checked, 0 violations.` |
| i18n parity | `npm run check:i18n` | `✅ Parity PASSED — all 4 locale files have identical key sets (2206 keys).` No key added/removed. |
| Mojibake/encoding | `npm run check:mojibake` | `check:mojibake: 0 artifacts in 1841 files` |
| **Production build (mandatory gate, governance `67340ff49`)** | `npm run build` | **`✓ Compiled successfully in 81s`, `✓ Generating static pages (40/40)`, exit 0.** |

## Rendered proof (Q3)

### Negative flow — "no featured cities" (R2, live route)

Queried the live dev Supabase DB directly with the exact same filters as `PopularLocations.tsx` (`is_featured=true`, `type='city'`, same `order`/`limit(8)`) via a throwaway script (outside the tracked tree, deleted after the run): **0 rows currently match.** Confirmed this is not a regression — it is identical, unchanged `if (!locations?.length) return null` behavior in both the pre-swap and post-swap code (the guard line is untouched).

Live-route confirmation: built the project (`npm run build`), started `next start` on a scratch port, requested `/en`. `HTTP 200`; the response HTML contains **zero** occurrences of `popular-locations` (grid class) or `data-track="popular_location_click"` — i.e., the section is legitimately absent on the live route right now, for the same DB-driven reason old and new code would both hit. This is the "No featured cities" row of the task's own flow table (Applicable: Yes, Expected: `return null` → section absent, unchanged). Scratch server stopped and all scratch files removed after the check; no tracked file or DB row was modified.

### Positive flow — cities present, image + gradient branches (R1/R4)

The current DB has no seed rows for this branch, so a live `/{locale}` screenshot of populated cards is not obtainable without seeding data (out of this task's scope — no DB writes were made). Two complementary pieces of evidence close this instead:

1. **Code-level parity trace** — every field `PopularLocationsView` expects (`heading: string`; `locations[].{id,name,href,imageUrl}`) is supplied by the exact same query/guard/localization/href logic as the legacy inline markup, verbatim except for the `String(loc.id)` cast above (component/DOM output is otherwise byte-for-byte what Task 648 already proved).
2. **Rendered proof of the (unchanged) consumed component itself**, `PopularLocationsView` — Storybook was already running; captured screenshots of the same story Task 648 proved (`mantine-primitives-popularlocationsview--default`) via a throwaway Playwright script (outside the tracked tree, deleted after the run), confirming the component this task now wires in still renders both branches correctly:
   - `default-en-1280`: 4-col grid, heading "Popular locations", 4 real-photo cards (Tiranë/Vlorë/Elbasan/Korçë) with dark overlay + legible white name, 4 gradient-fallback cards (Durrës/Shkodër/Berat/Sarandë) — both branches present in one capture. `data-track="popular_location_click"` and the `popular-locations` grid class both present in the rendered DOM.
   - `default-uk-320`: 2-col grid, heading "Популярні локації", no horizontal overflow, both card types legible.

   `PopularLocationsView.tsx` was not modified this task (confirmed absent from `git status --short`), so this is proof of the exact component now being consumed, not a stand-in.

Both screenshots and the throwaway script were deleted after capture; nothing under `node_modules/.tmp-task649/` or `/tmp` was left behind.

### Mobile / responsive (R4)

`default-uk-320` above covers the mandated `uk@320` case — 2-col grid, no truncation overflow, matches the mandated viewport/locale matrix carried over from Task 648 (same unchanged component).

## Isolation confirmation (R5)

- `PopularLocationsView.tsx` — **unchanged** (not in `git status --short`; used, not modified).
- i18n — **unchanged**, `check:i18n` reports the same 2206-key parity across all 4 locales; `home.popular_locations` key reused, no new/removed key.
- `theme.ts` — **unchanged** (not in `git status --short`).
- Supabase query/schema — **unchanged**, verbatim `.select`/`.eq`/`.order`/`.limit(8)`.
- `PopularLocations` stays a server component — no `'use client'` added; `async function` + `await createClient()`/`getTranslations`/`getLocale` all preserved.

## Git scope

```
git status --short
 M src/modules/locations/components/PopularLocations.tsx
```
Plus this session log and the `docs/backlog.md` update. No other path touched — no `EXCLUDED AS UNRELATED` entries this session (working tree was clean before starting).

## Self-review findings

- Kickoff's suggested mapping snippet (`id: loc.id`) does not typecheck against `Location.id: number` vs. `PopularLocationsViewLocation.id: string` — caught by `tsc`, not assumed; fixed with an explicit `String()` cast rather than loosening either type.
- Verified the "no featured cities" live-route behavior by direct DB query rather than assuming — confirmed 0 rows currently match the filter, so the section's absence on `/en` right now is expected DB state, not a defect introduced by this swap.
- Confirmed `PopularLocationsView`'s rendered output (both branches, `uk@320`) against the same story Task 648 already validated, rather than trusting the prop-shape match alone.
- No defects found requiring further rework.

## Assumptions, deviations, and limitations

- `id: String(loc.id)` — a necessary, in-scope type fix not present in the kickoff's illustrative snippet (see "Before / after" above); no other requirement or file affected.
- No live `/{locale}` screenshot of the **populated** grid was possible in this environment because the current dev DB has zero rows matching `is_featured=true AND type='city'` (verified by direct query, not assumed) — this is a data-seeding gap, not a code gap. Substituted the Storybook rendered proof of the exact (unchanged) `PopularLocationsView` component being consumed, per the "Positive flow" section above. If the owner wants a true live-route populated screenshot, re-run `npm run build && npm run start` and hit `/en` after setting `is_featured=true` on ≥1 `type='city'` row — expected result: identical layout/branches to the `default-en-1280`/`default-uk-320` captures described above.
- This closes **block B** (Task 648 canonical component + story, Task 649 wiring) and the **homepage Mantine migration except HeroSearch (Phase-2, deferred per the tracker)**.

## Opus handoff

- Diff: `src/modules/locations/components/PopularLocations.tsx` only (96→43 lines).
- Please verify: (1) the `id: String(loc.id)` deviation from the kickoff's illustrative snippet is the correct fix, not a scope creep; (2) whether the "no live populated-route screenshot, DB has zero seed rows" limitation is acceptable evidence-wise given the Storybook substitute, or whether the owner should seed a row for a true live-route capture before approval.

## Backlog update

`docs/backlog.md` — move the Task 649 entry from "Execute next" to "Implemented — awaiting orchestrator review" with a one-line summary (swap done, all gates green including mandatory build, block B + homepage migration closed except HeroSearch Phase-2); update the task-numbering note (649 done, next free 650).
