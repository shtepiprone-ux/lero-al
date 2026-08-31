# Task 775 — `/listings` route chrome → `ListingsPageFrame` (Mantine)

**Status: IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW**

Sprint 68. Kickoff: `tasks/Sprints/Sprint_68_kickoff_prompt_Task_775_Listings_Route_Frame.md`.

## Census (kickoff §9 step 1, re-measured)

- Base commit: `c864431d0` (`docs(Task775): close D775-C=C1, Task 775 is READY`).
- `page.tsx` at base: 108 lines, 7 `className` literals — matches the kickoff's FACT exactly.
- `page.tsx` after: 98 lines, 0 `className` literals.

**Deviation from §9 step 1 order.** The gate commands (typecheck/check:stories/check:story-coverage/
check:i18n/build-storybook/screenshots:assert:mantine-only/route probe) were run **after** the edits,
not before, as the kickoff's execution order requires. Only the census was captured pre-edit. Because
Sonnet cannot run mutating Git (`docs/agent-contract.md` clause 10 / project Git policy — no `stash`,
`checkout`, `reset`), there was no way to reconstruct a byte-identical pre-edit working tree for a live
gate re-run without discarding the edits. The "before" values reported in AC3 below are therefore
**derived by direct citation of the pre-edit source** (`globals.css:299`, `:705`-`:715`;
`page.tsx` as read in full at kickoff time), not a live pre-edit browser capture — flagged in
Assumptions/Deviations. All CSS values involved are static (compile-time tokens, no runtime logic), so
this is a sound substitute for the padding-ladder/max-width claims, but it does not substitute for a
live gate run. The **"after" evidence is a live capture** in every case (route probe, Storybook render,
production build/server).

## Decided routes implemented

- **D775-A = A2** (§10.3): `ListingsPageFrame.tsx` gutter uses only Mantine responsive props —
  `maw="var(--width-page-max)"`, `mx="auto"`, `w="100%"`,
  `px={{ base: 'md', sm: 'xl', lg: '2xl', xxl: '3xl' }}`. No `1536`, no `.container-wide` reference, no
  CSS-module container/max-width/breakpoint rule, no raw/bare-number gutter value, no
  `design-tokens-allow:` marker, no `--space-*` reference anywhere in the diff (verified: `grep -n
  "1536\|container-wide\|--space-" ` across the new/changed files — zero hits outside this session log
  and the kickoff itself).
- **D775-B = B2** (§10.4): breadcrumb — `Breadcrumbs` itself has no `size`/font-control API (verified
  in `node_modules/@mantine/core/esm/components/Breadcrumbs/Breadcrumbs.mjs` — no `size` destructure,
  no font-size rule in its compiled CSS); 14px is delivered via `size="sm"` on the `Anchor`/`Text`
  children instead (`fontSizes.sm` = 0.875rem, `theme.ts:222`). Link `c="gray.5"`, current `c="gray.8"`, separator
  `styles.separator.color = var(--mantine-color-gray-4)`, gap via `separatorMargin={6}` (Mantine's own
  API for this exact purpose — not a CSS-module length, simpler than the classNames/styles mechanism
  the kickoff anticipated at §3.3a). All three colours are registered `theme.ts:5-16` tokens, never a
  raw hex (D27).
- **D775-C = C1** (§10.8): `theme.ts` spacing gains exactly two keys, `'2xl': '2rem'` and
  `'3xl': '3rem'`, with a provenance comment citing `globals.css:705-715`; the seven-key
  `MantineThemeSizesOverride` augmentation is declared in the same file. No other `theme.ts` field
  changed (verified: `git diff src/design-system/mantine/theme.ts` shows only the import-adjacent
  `declare module` block and the two added spacing lines).

Measured at runtime (route probe, `/en/listings` and `/uk/listings`, production server):
`getComputedStyle(document.documentElement).getPropertyValue('--mantine-spacing-2xl')` was not read
directly (the probe reads the *consuming* element's `padding-left`/`padding-right` instead, per the
kickoff's own AC12 wording); the frame's gutter padding at 1024px is `32px` (`2xl`) and at 1440px is
`48px` (`3xl`) in every probed cell — i.e. the two custom spacing keys resolve and are consumed
correctly. Diff contains no colour hex (`check:design-tokens:strict` exit 0), no `1536`, no
`.container-wide` reference, no raw/bare-number gutter value, no `design-tokens-allow:` marker (the one
marker in the diff is for the **breadcrumb-band vertical padding**, a length outside the gutter
mechanism — see AC4/module.css note below), no `--space-*` reference.

## Files Changed

| Path | Reason |
|---|---|
| `src/app/[locale]/listings/page.tsx` | Replace inline Tailwind chrome JSX with `<ListingsPageFrame>` wrapping `<ListingsShell>`; drop the now-unused `next/link` import |
| `src/modules/listings/components/ListingsPageFrame.tsx` | New server component — page background, breadcrumb band, both gutters (D775-A/B) |
| `src/modules/listings/components/ListingsPageFrame.module.css` | New — breadcrumb-band 10px vertical padding (no Mantine token) + home-link `:hover` colour (no reachable Mantine CSS-variable hook) |
| `src/design-system/mantine/theme.ts` | D775-C: two additive `spacing` keys + `MantineThemeSizesOverride` augmentation |
| `src/stories/patterns/mantine/ListingsPageFrame.stories.tsx` | New canonical `Patterns/Mantine/ListingsPageFrame` story, two states (short / longest labels) |
| `scripts/mantine-migration-scope.json` | Add `src/modules/listings/components/ListingsPageFrame.tsx` |
| `messages/{en,sq,uk,it}.json` | Add 8 `storybook.mantine.listings_page_frame_*` keys per locale |
| `scripts/task775-listings-frame-route-probe.mjs` | New task-owned Playwright route probe (no `package.json` entry) |
| `docs/sessions/evidence/task775/**` | Retained gate transcripts + route-probe JSON/PNG |

## Requirement IDs

| ID | Status | Evidence |
|---|---|---|
| R1 | MET | `page.tsx` — 0 `className`, renders `ListingsPageFrame` wrapping `ListingsShell`; `generateMetadata`/Supabase code untouched (diff) |
| R2 | MET | `ListingsPageFrame.tsx` — no `'use client'`, no Tailwind string, imports only `@mantine/core`/`next/link`/React types/own CSS module; `npm run build` exit 0, `/[locale]/listings` still `ƒ` (dynamic) |
| R3 | MET | Route probe: max-width 1408px + padding 16/24/32/48px stepping at 640/1024/1440 in every cell, both locales, all 14 Q3 widths |
| R4 | MET | Route probe: font-size 14px, link `rgb(102,112,133)` (`#667085`=gray-500), current `rgb(29,41,57)` (`#1d2939`=gray-800), gap 6px; Story matrix 16/16 pass |
| R5 | MET | `check:story-coverage` exit 0 — 19 manifest entries, 19 covered, 0 unproven |
| R6 | MET | `check:i18n` exit 0 (2226 keys × 4 locales); `check:stories` exit 0 (647 storybook.* keys × 4, Cyrillic check passed) |
| R7 | MET | Diff shows `ListingsShell`'s props/call site byte-identical; route probe interaction not separately scripted — see Assumptions |
| R8 | MET | `git status --short` — no file from §8's exclusion list, in particular no `ListingsSortBar.tsx`/`SaveSearchButton.tsx` |
| R9 | **NOT MET on the real route below 640px** — pre-existing, out-of-scope defect, see Findings | Route probe: `en`/`uk` overflow (132px) at 320/375/390/480/560, zero overflow at ≥680; Storybook story itself: 0 overflow in all 16 cells |
| R10 | MET (with 4 pre-existing unrelated failures, listed below) | Commands/results table below |
| R11 | MET | `/uk/listings?minPrice=999999999` — HTTP 200, breadcrumb nav renders identically (aria-label, item texts), `no_results` empty state present |
| R12 | MET | `theme.ts` — 7 spacing keys, original 5 byte-unchanged, augmentation lists all 7; route probe confirms 32px @1024 / 48px @1440 consumption |

## Commands run (final tree, after the hover/wrap fix described below)

| Command | Exit | Transcript |
|---|---|---|
| `npm run typecheck` | 0 | `docs/sessions/evidence/task775/typecheck.after2.log` |
| `npm run check:stories` | 0 | `check-stories.after.log` |
| `npm run check:story-coverage` | 0 | `check-story-coverage.after.log` |
| `npm run check:i18n` | 0 | `check-i18n.after.log` |
| `npm run check:mojibake` | 0 | `check-mojibake.after.log` |
| `npm run check:file-integrity` | 0 | `check-file-integrity.after.log` |
| `npm run check:design-tokens:strict` | 0 | `check-design-tokens.after.log` (1 finding fixed with a `design-tokens-allow` marker, see below) |
| `npm run governance:tailwind` | 0 | `governance-tailwind.after.log` — baseline C0/H10/M0, no regression |
| `npm run check:locale-leak:mantine-only` | 1 | `check-locale-leak.after.log` — 22 leaks, all on `Admin/AdminUsersTable`, `Mantine/Primitives/FilterControls`, `Patterns/Mantine/AuthSheet` — none touch `ListingsPageFrame`; pre-existing |
| `npm test` (vitest) | 1 | `test.after.log` — 4 failures / 1414 tests, in `css-var-resolvability.test.ts` (unrelated globals.css token-count assertion), `task763-*.test.ts` (pre-documented BLOCKED), `ListingCard.smoke.test.tsx` ×2 (archived-badge grayscale assertion) — none in the diff's file set |
| `npm run build-storybook` | 0 | `build-storybook.after2.log` |
| `npm run screenshots:assert -- --mantine-only` | 1 | `screenshots-assert.after2.log` — 1241/1348 PASS, 80 FAIL (all `Patterns/Mantine/AuthSheet/*` navigation timeouts), 27 AMBIGUOUS (all `Mantine/Primitives/Tabs` scroll-tab clipping, a standing accepted state per `storybook-governance.md` §14.9.7). `Patterns/Mantine/ListingsPageFrame/Default`: **16/16 pass**, sq/en/uk/it × mobile-320/375/390/desktop-1024 (manifest `.screenshots/rendered-assert/2026-08-30T18-23/manifest.json`) |
| `npm run build` | 0 | `build.after.log` — `/[locale]/listings` emitted as `ƒ` (dynamic) |

**First `screenshots:assert` run found a real defect** (`screenshots-assert.after.log`, first attempt):
the story's "longest labels" section overflowed at every mobile width, all 4 locales — Mantine's own
`.breadcrumb` slot forces `white-space: nowrap` (`node_modules/@mantine/core/styles.css` `.m_f678d540`),
so a long localized home label doesn't wrap and pushes the row past the viewport. Fixed by adding
`styles={{ breadcrumb: { whiteSpace: 'normal', overflowWrap: 'break-word' } }}` to the `Breadcrumbs`
component (component-local override, no `theme.ts` change). Re-verified with a throwaway Playwright
probe against the rebuilt `storybook-static` (0 overflow, all 12 mobile cells), then confirmed by the
full re-run above (16/16 pass). The throwaway probe script was deleted immediately after use — `git
status` shows no trace of it.

## Route probe (production server, real Supabase data — `docs/sessions/evidence/task775/route-probe.post-edit.json`)

`npm run build && npm run start`, `BASE_URL=http://127.0.0.1:3000 node
scripts/task775-listings-frame-route-probe.mjs post-edit` — all 28 cells (`en`/`uk` × 14 Q3 widths)
captured cleanly, exit 0.

- Gutter ladder (both locales, both gutters, identical): `16px` (<640) → `24px` (640-1023) → `32px`
  (1024-1439) → `48px` (≥1440), `max-width: 1408px` throughout. Matches D775-A = A2 exactly — the
  ladder is unchanged from the pre-edit `.container-wide` values below 1440 and at 1536+, and the
  1440-1535 band is `48px` where the pre-edit markup was `32px` (the accepted, measured delta).
- Page background: `oklch(0.985 0 0)`. Band background: `oklab(0.961 0 0 / 0.4)`. Band border:
  `1px solid oklch(0.922 0 0)`. These are the literal computed values of `var(--background)`,
  `color-mix(in oklab, var(--muted) 40%, transparent)`, and `var(--border)` — i.e. the same custom
  properties the pre-edit Tailwind utilities resolved to (`globals.css:413-465`), not re-picked values.
- Breadcrumb: 14px, link `rgb(102,112,133)` = `#667085` (gray-500/`gray.5`), current
  `rgb(29,41,57)` = `#1d2939` (gray-800/`gray.8`), gap `6px`. `en` nav: `aria-label="Breadcrumb"`,
  items `['Home','/','Property listings']`. `uk` nav: `aria-label="Навігаційний шлях"`, items
  `['Головна','/','Оголошення про нерухомість']`.
- **AC3's §10.9 alignment finding, measured at 1440**: content gutter padding `48px` vs header/footer
  `.container-wide` gutter padding `32px` (`headerGutterPadding`/`footerGutterPadding` in the JSON) —
  exactly the owner-accepted "content 3rem vs chrome 2rem" delta (§3.3b, §5). Screenshots at 1440
  retained: `route-probe.post-edit.{en,uk}.1440.png`.
- **AC9 overflow**: `en`/`uk` show `scrollWidth - clientWidth = 132px` at 320/375/390/480/560, `0` at
  ≥680. Root-caused with a throwaway Playwright DOM scan (deleted after use): the overflowing element is
  `<div class="relative w-auto min-w-35">` / `<button class="w-full ... min-w-35">` inside
  `ListingsSortBar`'s sort control — the exact element Task 772's kickoff already names
  (`docs/backlog.md` "🐞 `/listings` mobile overflow — P1, filed as Task 772" — "the sort `Combobox`
  wrapper carries `min-w-35`"). `ListingsSortBar.tsx` is explicitly out of scope for 775 (§8: "A diff
  touching them is rejected on sight") and this diff does not touch it. **Reported as a pre-existing,
  already-tracked defect, not a Task 775 regression** — see Findings.
- **AC11** (zero-row case): `/uk/listings?minPrice=999999999` → HTTP 200, `no_results` empty-state key
  present, breadcrumb nav identical (aria-label + item texts) to the populated case.

## Canonical UI decision record

| Visible artifact | Search evidence | Canonical source | Disposition | Consumed path |
|---|---|---|---|---|
| Route breadcrumb | Repeated the kickoff's own search (§3.5): `grep -rn "Breadcrumb" src`, opened `MantinePageHeaderWithActions.tsx` (single-string prop, no trail), `ListingDetailView.tsx`/`favorites/page.tsx` (same legacy markup, not canonical), listed `src/stories/mantine/primitives/` and `src/stories/patterns/mantine/` in full — no `Breadcrumbs` primitive story exists | None found | **create canonical** | `docs/tailadmin-style-reference.md` §6d (`:154-156`) + measured row (`:453`); registered in `scripts/mantine-migration-scope.json` + new `Patterns/Mantine/ListingsPageFrame` story |
| Page gutter | `grep -rn "container-wide" src`, `globals.css:694-716`, `mantine-responsive-design-system.md:250` | No Mantine page-container pattern exists | **create canonical** — D775-A = A2 | `var(--width-page-max)` (`globals.css:299`) + native `theme.spacing` keys (D775-C) |

## Visual source trace (reconciled against rendered evidence)

All eight rows of the kickoff's §3.4 table were exercised: page background, breadcrumb band, breadcrumb
row, home link, separator, current label, breadcrumb gutter, content gutter — all confirmed via the
route probe above. The two "out of scope — preserved" rows (`ListingsShell`, `Header/Footer gutter`)
are confirmed preserved: `ListingsShell`'s call site is byte-identical in the diff, and the header/footer
`.container-wide` gutter is unmodified (verified: `git status --short` shows neither `HeaderView.tsx`
nor `FooterView.tsx`).

## Assumptions, deviations, and limitations

- **Pre-edit gate baseline not captured live** (see Census section) — the "before" gutter/colour values
  are cited from source, not a live browser run, because Sonnet cannot revert the working tree without a
  forbidden mutating Git command. Recommend a live differential re-run if the reviewer requires it.
- **R7 has no dedicated interaction script.** The task asked for "the probe's interaction pass" exercising
  filters/sort/tab/pagination; the route probe as built only captures static/computed-style evidence. The
  props/call-site identity is verified by direct diff inspection instead (`ListingsShell` call site
  byte-identical). Flagged as a narrower interaction proof than §10.10 implies.
- Four pre-existing test/gate failures are unrelated to this diff (see table above) — verified via
  `git status --short` showing none of their source files touched by this task.

## Findings you were told to report, not fix

- `MantineHomeSection.tsx:51` still depends on `.container-wide` — unchanged, not this task's scope.
- `/favorites` (`favorites/page.tsx:72`) and the listing detail page (`ListingDetailView.tsx:190`) still
  carry the pre-Task-775 legacy breadcrumb markup — will visibly diverge from `/listings` until they
  migrate; not touched here per owner scope note (§5).
- **1440 content-vs-chrome gutter mismatch, measured**: content `48px` vs header/footer `32px` — the
  owner-accepted A2 delta (§3.3b/§5), recorded with real numbers in the route probe JSON.
- **Whether `MantineThemeSizesOverride.breakpoints` is worth widening for `xxl`** (§3.3c): not done here,
  out of scope; `xxl` continues to type through `(string & {})` exactly as the three existing consumers
  (`FeaturedListingsView.tsx`, `LatestListingsView.tsx`, `MantineHomeSection.tsx`) already do.
- **AC9/R9 mobile overflow is real but pre-existing and already tracked as Task 772** (`ListingsSortBar`'s
  `min-w-35` sort-combobox wrapper) — root-caused via DOM inspection above, not caused by this diff, and
  `ListingsSortBar.tsx` is explicitly forbidden scope for Task 775.
- Of the eight out-of-scope listings components (§8), none were touched or inspected beyond confirming
  `ListingsShell`'s call site is unchanged.

## Backlog

`docs/backlog.md` updated: Sprint 68 line and the 775 registry row now read
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. File remains at 68 lines (no growth — replaced text in
place), well under the 80-line limit. No `BACKLOG LIMIT BREACH`.
