# Task 688 — `PopularLocationsView` de-Tailwind: Mantine style props + colocated CSS module

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

## 1. Files Changed

| Path | Action | Reason |
|---|---|---|
| `src/modules/locations/components/PopularLocationsView.tsx` | modified (30 insertions / 24 deletions) | R1, R3, R4, R5, R9 |
| `src/modules/locations/components/PopularLocationsView.module.css` | created | R2 |
| `docs/backlog.md` | modified | Active-state update, kept at 80 lines |
| `docs/sessions/2026-07-29-task688-popularlocations-detailwind-cssmodule.md` | created | This file |

`git status --porcelain` confirmed the diff is scoped to exactly these paths (see §2).

## 2. Worktree snapshots

- **Start** (`I0`, before any write): `git status --porcelain` → empty. `git log -1 --oneline` →
  `12a866c10 docs(Task688): PopularLocationsView de-Tailwind kickoff (Mantine props + colocated CSS module, zero rendered delta), 686 review outcome, 689 reserved`.
- **End** (true final, after this record and the backlog update were written, `check:file-integrity` and
  `check:mojibake` re-run against this exact state): `git status --porcelain` →
  ```
   M docs/backlog.md
   M src/modules/locations/components/PopularLocationsView.tsx
  ?? docs/sessions/2026-07-29-task688-popularlocations-detailwind-cssmodule.md
  ?? src/modules/locations/components/PopularLocationsView.module.css
  ```
  All four paths match §7's scope exactly — nothing else touched.

## 3. Requirement / acceptance-criteria evidence

| ID | Evidence |
|---|---|
| R1/AC1 | `grep -n 'className'` → 5 hits, all `styles.*`/`CITY_GRADIENTS[...]` (module-class) references. `CITY_GRADIENTS` now holds `styles.gradient0..7`, not Tailwind strings. The literal forbidden-pattern grep `grep -nE '(bg-gradient|absolute|inset-0|flex-col|justify-end|overflow-hidden|hover:|focus-visible:|transition-)'` returns **3 hits, not 0** — all three are `pos="absolute"` (the Mantine `Box`/`Flex` **prop value**, not a Tailwind class token), on the scrim Box, the fallback-gradient Box, and — see deviation note in §10. Zero raw Tailwind utility class strings remain anywhere in the file (verified by full-file read, not just grep). |
| R2/AC2 | `PopularLocationsView.module.css` created, imported as `styles`. Contains: 8 `.gradient0`–`.gradient7` rules, `.scrim`, `.absoluteFill`, `.card` (`overflow`, `transition-*`, `:hover`, `:focus-visible`), `.content` (`z-index`). |
| R3/AC3 | `display:flex`/`flex-direction:column`/`justify-content:flex-end` now come from `<Flex direction="column" justify="flex-end">` (Mantine props). `pos`, `h`, `p`, `c`, `bdrs`, `data-track` unchanged at the card. `:77`'s `fw`/`size`/`lh`/`truncate` unchanged. Exported interfaces byte-unchanged (diff touches no `interface` line). |
| R4/AC4 | `grep -n 'popular-locations' src/modules/locations/components/PopularLocationsView.tsx` → **0 hits** (exit 1). |
| R5/AC5 | No inline `zIndex` remains (`grep -n 'zIndex'` → 0 hits in the component; `z-index: 1` lives in `.content` in the module, confirmed not flagged by the detector). The three `:46` `fz` rem strings (`'1.25rem'`, `'1.5rem'`, `'1.875rem'`) are byte-identical to before — untouched by the diff. |
| R6/AC6 | `computed-before.json` / `computed-after.json` / `computed-diff.json` — **diff is empty** (`diffCount: 0`) across card rest/hover/focus-visible, the AppImage wrapper, the scrim, the content wrapper, and all 8 gradient variants. See §6. |
| R7/AC7 | All 56 target-cell **verdicts** identical to the `2026-07-29T17-50` baseline (28 `pass` in `Default`, 12 `pass` + 16 `ambiguous`/`text-clipped-ellipsis` in `LongCityName`); 0 verdict changes and 0 FAIL across the other 1128 cells. **PNG md5 is NOT byte-identical on the 56 target cells** — see the full investigation in §7. This is reported as a measured, root-caused finding, not hidden. |
| R8/AC8 | `check:design-tokens` → **43 raw / 0 stale**, `PopularLocationsView.tsx` at **3** (the `fz` triple only), `PopularLocationsView.module.css` **absent from the violation list** (0 contributed). See §8. |
| R9/AC9 | Docstring rewritten: no longer claims "no Mantine equivalent" / "approved semantic tokens"; now names the module, the reproduction convention (`MantineHomeSection.module.css`, Task 662), and the inline-`style`-blocks-`:hover` reason (Task 653, `FavoriteButton.module.css`) for using a module instead of inline `style`. |
| R10/AC10 | `npm run build` exit 0, 40/40 pages, route table quoted (§9). `check:stories` 0 (127 files). `check:story-coverage` 0 (15/15). `check:i18n` 0 (2215×4, 0 new keys). `typecheck` 0. `check:file-integrity` 0 (4/4 files clean — the exact 4-path diff, checked after this record and the backlog update existed). `check:mojibake` 0 (0 artifacts / 2004 files scanned). |

## 4. Current vs required behavior

**Current (before):** described in the kickoff §9 — 9-utility Tailwind `className` chain on the card
(flex/overflow/hover/focus-visible), `bg-gradient-to-t`/`bg-gradient-to-br` chains for the scrim and 8
city fallbacks, `absolute inset-0` on `AppImage`/both overlay `Box`es, inline `zIndex:1`, dead
`popular-locations` class.

**Required after (achieved):** `Flex` expresses the card's `display`/`direction`/`justify`;
`PopularLocationsView.module.css` expresses `overflow`, `:hover` opacity+transition, `:focus-visible`
ring+outline, the photo scrim, all 8 fallback gradients, and the content `z-index`; `pos`/`inset` on the
scrim and fallback `Box` are Mantine props; `AppImage`'s wrapper (not a Mantine `Box`) gets its
absolute-fill positioning from `styles.absoluteFill`. Dead class removed. Zero new visual value —
every rule reproduces its own prior compiled output (verified live, not from the bundle text alone).

**Negative flows** (kickoff §11 applicability table) — all traced:
- No photo / photo present: both branches render, verified in `computed-before/after.json` and the 56-cell
  rendered proof.
- Empty `locations`: unchanged, `PopularLocationsView` still renders an empty `SimpleGrid`; no diff touches
  this path.
- Long city name / ellipsis: 16 `ambiguous`/`text-clipped-ellipsis` cells unchanged in verdict and reason.
- `:hover` / `:focus-visible`: forced via real Playwright hover + real keyboard `Tab` navigation
  (`focusVisibleReached: true` in both captures), not inferred.
- Small viewport (<640): included in the 56-cell matrix (`mobile-320/375/390`), 0 verdict changes.
- All four locales: included in every capture and the 56-cell matrix.

## 5. Visual source trace

| Visible artifact/state | Component/markup | Class/selector (before) | Mechanism (after) | Change/preserve | Evidence |
|---|---|---|---|---|---|
| Card layout (flex/column/justify-end) | card `Flex` | `.flex .flex-col .justify-end` | `Flex direction="column" justify="flex-end"` (implicit `display:flex`) | changed mechanism, identical output | AC6 |
| Card clipping | card | `.overflow-hidden` | `.card { overflow: hidden }` | changed mechanism, identical output | AC6 |
| Card hover | card | `.hover\:opacity-90:hover` + `.transition-opacity` | `.card { transition-property/duration/timing-function } .card:hover { opacity: .9 }` | changed mechanism, identical output | AC6 |
| Card focus ring | card | `.focus-visible\:ring-2/ring-ring/outline-none` | `.card:focus-visible { box-shadow: <5-layer, ring=var(--ring)>; outline-style:none }` | changed mechanism, identical output | AC6, §7.5 |
| Card radius/size/padding/colour | card | `bdrs="xl"`, `h={112}`, `p="sm"`, `c="white"` | unchanged Mantine props | preserved, untouched | AC3 |
| Photo fill | `AppImage` wrapper div | `.absolute .inset-0` | `styles.absoluteFill { position:absolute; inset:0 }` (AppImage isn't a `Box`, no prop route) | changed mechanism, identical output | AC6 |
| Photo scrim | scrim `Box` | `.absolute .inset-0 .bg-gradient-to-t .from-black/60 .via-black/20 .to-transparent` | `pos="absolute" inset={0}` (prop) + `.scrim { background-image: linear-gradient(to top in oklab, color-mix(...) 0%, color-mix(...) 50%, transparent 100%) }` | changed mechanism, identical output | AC6 |
| Fallback gradients ×8 | fallback `Box` | `.absolute .inset-0 .bg-gradient-to-br .from-* .to-*` | `pos="absolute" inset={0}` (prop) + `.gradient0`–`.gradient7` (`var(--token)`/`color-mix()`) | changed mechanism, identical output | AC6, §7 |
| Content stacking | content `Box` | inline `style={{zIndex:1}}` | `.content { z-index: 1 }` | moved to module | AC5, AC8 |
| Grid hook class | `SimpleGrid` | `.popular-locations` | removed | deleted | AC4 |
| Section band | `MantineHomeSection` | — | unchanged | out of scope, untouched | §8 |
| Heading size | `Title fz={{...rem}}` | inline responsive `fz` | unchanged | out of scope — Task 689 | AC5 |
| City name truncation | `Text truncate` | Mantine prop | unchanged | preserved, untouched | AC7 |
| Pin icon opacity | `MapPin style={{opacity:.7}}` | inline opacity | unchanged (not a token violation, not Tailwind) | preserved, untouched | AC3 |

## 6. Computed-style before/after (AC6)

Harness: `.screenshots/task688-delta/capture-computed-styles.mjs` (Playwright/Chromium against the built
`storybook-static/`, following the `task670-qa-hero-fallback-geometry.mjs` static-server precedent).
Story: `mantine-primitives-popularlocationsview--default`, locale `en`, viewport `1024×900`.

- **Card `<a>`** (rest / real `.hover()` / real keyboard-`Tab` `:focus-visible`, `focusVisibleReached: true`
  both captures): `display`, `flexDirection`, `justifyContent`, `overflow`, `opacity`, `transitionProperty`,
  `transitionDuration`, `transitionTimingFunction`, `boxShadow`, `outlineStyle`, `borderRadius`, `position`,
  `height`, `padding`, `color` — **all byte-identical** before/after. Rest `boxShadow: none`; hover
  `opacity: 0.9`; focus-visible `boxShadow: rgba(0,0,0,0) 0px 0px 0px 0px ×3, rgb(236, 84, 71) 0px 0px 0px 2px, rgba(0,0,0,0) 0px 0px 0px 0px`.
- **AppImage wrapper / scrim / content wrapper**: `position`, `inset`, `top/right/bottom/left`,
  `backgroundImage`, `zIndex` — all byte-identical.
- **All 8 `CITY_GRADIENTS` variants** (`backgroundImage` on a synthetic offscreen element carrying each
  variant's real class(es) — before: the literal Tailwind strings; after: the module's `.gradient0`–`.gradient7`
  rule, located via a `document.styleSheets` scan for the literal substring `gradient<N>`): all 8
  **byte-identical**, e.g. gradient0 both = `linear-gradient(to right bottom, rgb(236, 84, 71) 0%, oklch(0.132 0.022 23) 100%)`.

`.screenshots/task688-delta/diff-computed-styles.mjs` output: **`diffCount: 0`**. One documented exclusion:
the synthetic gradient elements' own `position`/`inset` fields are a harness artifact (the after-mode
synthetic element carries only the matched `.gradientN` rule, not the sibling `pos`/`inset` **props** that
only apply to the real rendered `Box`) — real positioning for that Box is proven identical via the
structurally-identical `scrim` capture (0 diff), which shares the exact same `pos="absolute" inset={0}`
mechanism. Both raw captures and the diff are persisted at `.screenshots/task688-delta/computed-before.json`,
`computed-after.json`, `computed-diff.json`.

**Measured focus-ring colour (§3.10):** `rgb(236, 84, 71)` = `var(--ring)` (`--brand-700`, `#EC5447`) — **not**
`currentColor` despite `c="white"`. The module hardcodes `var(--ring)`, reproducing the measured value exactly,
per §3.10's explicit stop condition (no "fix" applied — the measured value is what's reproduced).

## 7. Rendered proof (R7) — full investigation, not a clean pass

**Result actually obtained:** all 56 target cells keep their exact **verdict** (28 `pass`; 12 `pass` + 16
`ambiguous`/`text-clipped-ellipsis`) and 0 verdict changes / 0 FAIL across the other 1128 cells — but the
**PNG md5 is not byte-identical** on all 56 target cells vs the `2026-07-29T17-50` baseline. Per §10 I6.1
this is a stop-and-report condition, so the full investigation is recorded here rather than asserted away.

**Step 1 — same-tree stability control.** Ran `--mantine-only` twice, back to back, on the identical
post-migration tree with no edit between runs (`2026-07-29T19-08` → `2026-07-29T19-40`): **0/56 md5 changes,
0/1128 verdict changes.** The harness is deterministic on a fixed tree right now.

**Step 2 — fresh same-session A/B control.** Temporarily reverted the component to its exact pre-migration
source (file-edit only, no git), rebuilt Storybook, and captured fresh (`2026-07-29T20-11`) in the same
session as the post-migration captures. Compared `19-40` (post) vs `20-11` (fresh pre, same session): **still
56/56 md5 changed**, ruling out time-of-day/external-CDN drift as the sole explanation (the story's photo
cards load a live `https://images.unsplash.com/...` URL) — captures 30 minutes apart in the same session
would not plausibly see CDN drift twice in a row while being perfectly stable run-to-run otherwise.

**Step 3 — pixel-level root cause.** Wrote `.screenshots/task688-delta/pixel-diff.mjs` (uses the project's
existing `sharp` dependency) to diff full PNGs channel-by-channel. Sampled 5 cells (mobile/desktop/wide,
`Default` and `Long City Name`, against both the fresh same-session control and the official `17-50`
baseline):

| Cell | Diff pixels | Total pixels | Max channel delta | BBox |
|---|---:|---:|---:|---|
| `Default/en/desktop-1024` vs fresh control | 8 | 786,432 | **1**/255 | gradient-card region |
| `Default/uk/mobile-320` vs fresh control | 4 | 259,840 | **1**/255 | gradient-card region |
| `Long City Name/en/desktop-1024` vs fresh control | 8 | 786,432 | **1**/255 | gradient-card region |
| `Default/it/wide-1536` vs fresh control | 28 | 1,572,864 | **1**/255 | gradient-card region |
| `Default/en/desktop-1024` vs **17-50 baseline** | 8 | 786,432 | **1**/255 | gradient-card region |
| `Long City Name/uk/mobile-390` vs **17-50 baseline** | 2 | 329,160 | **1**/255 | gradient-card region |

Every sample: ≤0.002% of pixels differ, by at most 1 of 255 per channel, always at a gradient-card's
antialiased boundary (never in the photo/text/background regions). This is consistent with, and the same
class of finding as, the project's existing capture-noise precedents (D10, D14) — a sub-visual rasterizer
rounding difference between Tailwind's `--tw-gradient-stops` custom-property machinery and this module's
explicit `color-mix()`/`var()` gradient stops, even though both serialize to the **textually identical**
`getComputedStyle().backgroundImage` string (§6). It is not a redesign, not a visible defect, and not
explained by any value this task changed on purpose.

**What this does NOT explain away:** the kickoff's binding comparator (§3.6, R7) is literal PNG-md5
identity, licensed by a 0/560 historical stability measurement for this exact story. That measurement did
not anticipate a gradient-syntax mechanism swap producing sub-pixel rasterizer rounding. I am not
authorized to relax R7's comparator myself (A1: "never reach the target by relaxing a comparator") — this
finding is handed to the orchestrator/owner as the deviation it is, with full root-cause evidence, not
self-certified as passing.

Final canonical post-migration run: `.screenshots/rendered-assert/2026-07-29T20-43/` (1162/1184 PASS, 0 FAIL,
22 AMBIGUOUS, identical set to the `17-50` baseline: 4 `Combobox` backdrop + 2 `Tabs` offscreen + 16
`PopularLocationsView` ellipsis). Full per-cell comparison persisted at
`.screenshots/task688-delta/target-cells-comparison.json`; diff images at
`.screenshots/task688-delta/diff-*.png`.

## 8. `check:design-tokens` before/after (R8)

**Before** (`I1` baseline, untouched tree): 44 raw / 0 stale.
```
src/modules/locations/components/PopularLocationsView.tsx  (4)
  :42  [length:inline style px/rem value]  ": '1.25rem'"
  :42  [length:inline style px/rem value]  ": '1.5rem'"
  :42  [length:inline style px/rem value]  ": '1.875rem'"
  :73  [z-index:inline zIndex value]       "zIndex: 1"
```

**After** (final tree): 43 raw / 0 stale.
```
src/modules/locations/components/PopularLocationsView.tsx  (3)
  :46  [length:inline style px/rem value]  ": '1.25rem'"
  :46  [length:inline style px/rem value]  ": '1.5rem'"
  :46  [length:inline style px/rem value]  ": '1.875rem'"
```
`PopularLocationsView.module.css` does not appear in the violation list (0 contributed) — every colour in
the module is `var(--token)` or `color-mix(in oklab, var(--token) N%, transparent)`.

## 9. Command transcript (actual exit codes)

| Command | Result |
|---|---|
| `npm run check:stories` (before) | 0 — 127 files, 0 violations |
| `npm run check:design-tokens` (before) | 1 — 44/0 stale (expected non-zero; this is `--strict` failing on existing debt) |
| `npm run check:story-coverage` (before) | 0 — 15/15 |
| `npm run check:i18n` (before) | 0 — 2215×4 |
| `npm run build-storybook` ×4 (I2, post-edit, post-revert-control, post-restore-final) | 0 each time |
| `npm run typecheck` ×2 | 0 each time |
| `node .screenshots/task688-delta/capture-computed-styles.mjs --mode=before` | 0 |
| `node .screenshots/task688-delta/capture-computed-styles.mjs --mode=after` | 0 |
| `node .screenshots/task688-delta/diff-computed-styles.mjs` | 0 (`diffCount: 0`) |
| `npm run screenshots:assert -- --mantine-only` ×4 (see §7 for why 4 runs) | 0 each time — 1162/1184 PASS, 0 FAIL, 22 AMBIGUOUS, every run |
| `node .screenshots/task688-delta/compare-manifests.mjs` ×4 | see §7 |
| `node .screenshots/task688-delta/pixel-diff.mjs` ×6 | 0 each time (informational, not a gate) |
| `npm run check:design-tokens` (after) | 1 — 43/0 stale (expected non-zero; pre-existing debt in other files) |
| `npm run check:stories` (after) | 0 — 127 files, 0 violations |
| `npm run check:story-coverage` (after) | 0 — 15/15 |
| `npm run check:i18n` (after) | 0 — 2215×4 |
| `npx vitest run` | 1 — 1177/1179 (2 pre-existing full-run-only timeouts: `date-format-ssr-parity`, `RangeDatePicker`) |
| `npx vitest run` (isolated re-run of the 2 failing files) | 0 — 39/39 |
| `npm run build` | 0 — 40/40 pages |

**`npm run build` transcript tail (route table):**
```
Route (app)                                 Size  First Load JS  Revalidate  Expire
┌ ƒ /                                      379 B         185 kB
├ ƒ /_not-found                          1.16 kB         185 kB
├ ƒ /[locale]                            7.12 kB         618 kB
├ ƒ /[locale]/[slug]                       377 B         185 kB
├ ƒ /[locale]/auth/confirm-email         2.18 kB         192 kB
├ ƒ /[locale]/auth/login                 1.42 kB         265 kB
├ ƒ /[locale]/auth/register              1.41 kB         265 kB
├ ƒ /[locale]/auth/reset-password        6.43 kB         284 kB
├ ƒ /[locale]/auth/verified              2.27 kB         258 kB
├ ƒ /[locale]/cabinet                     149 kB         763 kB
├ ƒ /[locale]/contact                    5.43 kB         230 kB
├ ƒ /[locale]/favorites                  5.24 kB         577 kB
├ ƒ /[locale]/listings                   12.8 kB         585 kB
├ ƒ /[locale]/listings/[slug]              379 B         581 kB
├ ƒ /[locale]/listings/[slug]/edit       2.36 kB         251 kB
├ ƒ /[locale]/listings/create            2.36 kB         251 kB
├ ƒ /admin                               5.02 kB         371 kB
├ ƒ /admin/companies                     6.84 kB         304 kB
├ ƒ /admin/currency                      8.65 kB         300 kB
├ ƒ /admin/email-templates               9.99 kB         253 kB
├ ƒ /admin/footer                        6.27 kB         232 kB
├ ƒ /admin/inquiries                       379 B         185 kB
├ ƒ /admin/inquiries/sales                 336 B         368 kB
├ ƒ /admin/inquiries/support               335 B         368 kB
├ ƒ /admin/legal                           379 B         185 kB
├ ƒ /admin/listings                        10 kB         422 kB
├ ƒ /admin/listings/[id]/preview           377 B         581 kB
├ ƒ /admin/locations                     9.91 kB         261 kB
├ ƒ /admin/pages                         10.4 kB         264 kB
├ ƒ /admin/permissions                   8.94 kB         219 kB
├ ƒ /admin/popular-locations             9.23 kB         260 kB
├ ƒ /admin/property-types                7.35 kB         292 kB
├ ƒ /admin/reports                       21.3 kB         287 kB
├ ƒ /admin/settings                      7.55 kB         221 kB
├ ƒ /admin/support                       8.51 kB         408 kB
├ ƒ /admin/users                         5.02 kB         483 kB
├ ƒ /admin/users/[id]                      381 B         599 kB
├ ƒ /admin/users/new                       382 B         599 kB
├ ƒ /api/auth-email-hook                   378 B         185 kB
├ ƒ /api/auth/me                           378 B         185 kB
├ ƒ /api/cron/inactivity                   377 B         185 kB
├ ƒ /api/cron/listings-expiry              378 B         185 kB
├ ƒ /api/cron/price-alerts                 379 B         185 kB
├ ƒ /api/cron/saved-searches               377 B         185 kB
├ ○ /api/exchange-rate                     379 B         185 kB          1h      1y
├ ƒ /api/listings                          377 B         185 kB
├ ƒ /api/listings/[slug]/view              379 B         185 kB
├ ƒ /api/presence                          379 B         185 kB
├ ƒ /api/property-types                    379 B         185 kB
├ ƒ /api/upload-avatar                     378 B         185 kB
├ ƒ /api/upload-company-logo               378 B         185 kB
├ ƒ /api/upload-popular-location-photo     378 B         185 kB
├ ƒ /auth/callback                         378 B         185 kB
└ ƒ /auth/confirm                          378 B         185 kB
+ First Load JS shared by all             184 kB
  ├ chunks/3434-722729d0db4cd1b8.js       126 kB
  ├ chunks/4bd1b696-ad216e4073dcea52.js  54.4 kB
  └ other shared chunks (total)          4.19 kB

ƒ Middleware                              165 kB

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

## 10. Deviations

1. **AC1's literal forbidden-pattern grep returns 3 hits, not 0** — all three are `pos="absolute"`, the
   Mantine `Box`/`Flex` **style prop value**, on the scrim `Box`, the fallback-gradient `Box`, and (via the
   same prop name appearing in the grep's match set) nowhere else. This is the R3-mandated migration itself
   (moving `absolute` from a raw Tailwind class into the Mantine `pos` prop) — the AC1 regex was written
   assuming "absolute" could only appear as a Tailwind class token, which was true pre-migration but is no
   longer true after correctly applying R3. Zero raw Tailwind utility classes remain; every `className` site
   is a `styles.*`/module reference (verified by full-file read). Flagging this explicitly rather than
   silently declaring AC1 "0 hits" when the literal command does not return 0.
2. **R7/AC7 md5 identity not achieved** — see the full §7 investigation. Verdicts and the wider 1128-cell
   matrix are unaffected; the deviation is isolated to sub-pixel (max 1/255) antialiasing noise on the
   gradient-card boundary across all 56 target cells, root-caused via a same-session pre/post A/B control
   that rules out external-image/time drift. Reported per A1/A2 rather than self-resolved.
3. **Temporary source revert during investigation** — to build the A/B control in deviation 2, the component
   was temporarily reverted to its exact pre-migration content (file-edit, no git), then restored to the
   final migrated content verbatim. `git status --porcelain` and `typecheck`/`check:design-tokens` were
   re-verified clean after restoration (§9) to confirm no drift.

## 11. Limitations

- The declared proof path is the project's 7-width `--mantine-only` matrix (320/375/390/1024/1200/1440/1536 ×
  4 locales), per kickoff §13.1 — not the 14-width QA-profile canon; this is the existing Storybook harness's
  scope, unchanged by this task.
- The `--overlay` token swap for the photo scrim, the heading `fz` rem triple (Task 689), and
  `MantineListingCardPattern`/`ListingCard` (28+8 remaining homepage utilities) are explicitly deferred per
  kickoff §8 — untouched by this diff.
- `.screenshots/` evidence (computed-style captures, rendered-assert runs, pixel diffs, the target-cell
  comparison) is local-only per D6 (`.gitignore:55`) and referenced here by path; it will not appear in
  `git status`.
- No unit/smoke test was added (A4) — the component has none today and R7's rendered proof is a strictly
  stronger gate than a DOM-shape assertion could be, per kickoff §3.9.
- §7's finding is new information not anticipated by the kickoff's licensing measurement (0/560 historical
  md5 stability) — that measurement predates any gradient-syntax mechanism change for this story and should
  not be read as contradicted; it simply did not cover this specific class of change.
