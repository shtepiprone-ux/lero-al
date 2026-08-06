# Session Archive: Task 630 — Homepage "view all" links → Mantine `Button variant="transparent"` — 2026-07-19

## Task path and status

`tasks/kickoff_prompt_Task_630_HomepageViewAll_Mantine_TransparentButton_Migration.md`

**Status: IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW**

## Summary

Replaced both homepage "view all" links — `src/app/[locale]/page.tsx` (Latest listings) and
`src/modules/listings/components/FeaturedListings.tsx` (Featured) — with a single new shared client island
`src/components/shared/ViewAllLink.tsx` rendering the canonical, already-themed, already-CI-gated Mantine
`Button variant="transparent" component={Link}` (§6a-link tertiary). Both `buttonVariants`/`cn` legacy imports are
now fully removed from both files (grep-confirmed 0 remaining references in either file). No other `buttonVariants`
call site was touched. Destinations, the Featured conditional-render guard, and the localized `listing.view_all`
label (all 4 locales) are unchanged.

**Open questions resolved as recommended in the kickoff:** `size="sm"` (compact, inline next to the `<h2>`);
text-only, no icon.

**Kickoff evidence-path gap found and worked around (not a scope change):** the kickoff's R6/AC5 verification plan
named `System/FeaturedListings` (`src/stories/FeaturedListings.stories.tsx`) as one proof path for the Featured
surface. Inspection showed this story does **not** render the real `FeaturedListings` component — it is a separate
mock using a local `Header()` function and `StoryListingCard`/`makeStoryListings` fixtures that never included a
"view all" control at all (confirmed via source read + grep for `view_all` in the story file — no match). Capturing
that story therefore cannot prove anything about this task's change. Per the executor's authority to substitute
evidence rather than fabricate a false pass: both surfaces were instead proven via an ad-hoc Playwright capture of
the real `/{locale}` app route (Task 621 methodology), which renders **both** the Featured and Latest controls on
one page — a strictly stronger proof than the story would have been, since it exercises the real component tree,
real data-fetch hook, and real conditional guard. The story file itself was not touched (out of scope; no
"add/duplicate a story" action was taken, consistent with `storybook-governance.md` §"Story creation" rules and the
task's explicit "no new story" instruction).

## Requirement and acceptance-criteria evidence

| ID | Requirement | Evidence |
|---|---|---|
| R1/AC1 | Both sites render canonical `Button variant="transparent"` `component={Link}`, no `buttonVariants` remains | `grep buttonVariants` → 0 matches in both files (see Validation evidence #9); rendered DOM confirms `data-variant="transparent"` on both anchors (matrix `matrix-results.json`, all 56 cells) |
| R2/AC2 | One shared island `ViewAllLink.tsx`, both sites consume it | `src/components/shared/ViewAllLink.tsx` created; both `page.tsx` and `FeaturedListings.tsx` import and render `<ViewAllLink href=... label=... />` — no inline duplication |
| R3/AC1 | Unused `buttonVariants`/`cn` imports removed; no other `buttonVariants` site touched | Both files' imports diffed (see Files Changed); repo-wide `grep buttonVariants src/` still lists the same 12 pre-existing other sites, unchanged — `page.tsx`/`FeaturedListings.tsx` no longer in that list |
| R4/AC3 | Themed `transparent` tertiary spec: transparent bg, no hover fill, 14px/500, gray-700/foreground, radius 8, ≥44px touch | Computed-style assertions across the full 56-cell matrix: `backgroundColor` = `rgba(0,0,0,0)` (transparent) at every cell; `minHeight` ≥44px at every cell; hover-proof (`before=rgba(0,0,0,0) after=rgba(0,0,0,0)`, `noFill=true`) — screenshot `latest_en_1024_HOVER.png`; text styling comes from the theme's `transparent` variant (no local override in `ViewAllLink.tsx`) |
| R5/AC4 | Destinations + conditional presence + label preserved, no new string | Matrix asserts `href === /{locale}/listings` (Latest) and `href === /{locale}/listings?premium=true` (Featured) at all 56 cells; `check:i18n` unchanged 2203/2203 keys, no delta; Featured guard (`!loading && listings.length > 0`) byte-preserved in diff |
| R6/AC5 | Rendered proof across Q3 matrix (all locales × widths) for both surfaces, no clip/overflow incl. `uk@320` | Full 14-width × 4-locale (56-cell) programmatic matrix: 56/56 PASS, 0 overflow violations (`document.documentElement.scrollWidth <= clientWidth+1` at every cell); representative screenshots at the mandatory stress set (320/375/390/768/1024/1440 × sq/en/uk/it = 48 images) for both surfaces — see Validation evidence |
| R7/AC3 | All visuals from themed variant, not Tailwind `className`; ≥44px preserved | `ViewAllLink.tsx` passes no `className`/Tailwind utility to `Button` — only `component`, `href`, `variant`, `size`; `minHeight` ≥44px confirmed at every one of the 56 matrix cells (mobile and desktop) |
| R8/AC6 | No new hydration/console error; header untouched | `check:hydration` (against `next dev`) 4/4 PASS (Homepage en/sq/uk + Listings list en), 3 SKIP (auth-gated cells, no session — same pre-existing SKIP shape as Task 621); diff contains no `Header*`/`NotificationBell`/`ListingCard` file |

## Current versus required behavior

**Before:** each "view all" was a `next/link` `<Link>` styled by legacy shadcn `buttonVariants({ variant: 'ghost',
size: 'sm' })` + `max-sm:w-auto` — `text-foreground`, `hover:bg-muted` fill, `text-[0.8rem]` (12.8px), `h-7` (28px
desktop, 44px min-height on mobile), radius `min(--radius-md,12px)`.

**After:** each is the canonical Mantine `Button variant="transparent"` (`component={Link}`) via the shared
`ViewAllLink` island — transparent bg, **no hover fill** (text-darken only, theme default), 14px/500, gray-700 /
`--foreground`, radius 8 (theme `radius: 'lg'`), ≥44px touch unconditionally (theme `minHeight: 2.75rem`). Same
destinations, same conditional presence, same localized `listing.view_all` label. This pixel delta (14px vs
12.8px text; no `hover:bg-muted` fill; ≥44px vs 28px desktop height) is the task's declared **intended** delta
(R4), not a regression.

**Applicable negative flows (per kickoff's applicability table):**
- **Featured empty/loading** — `!loading && listings.length > 0` guard byte-preserved; verified present in diff and
  exercised live (the running dev DB has premium listings, so the guard's "true" branch was directly observed;
  the "false" branch's JSX is unchanged from before this task, out of scope to re-verify a pre-existing conditional).
- **Locale expansion (uk/it long labels)** — matrix confirms no overflow at any of the 56 cells including
  `uk@320`/`it@320`; screenshots `featured_uk_320.png`, `featured_it_320.png`, `latest_uk_320.png`,
  `latest_it_320.png` show full, unclipped labels.
- **Small viewport / touch target** — `minHeight` ≥44px confirmed at all 56 cells (mobile and desktop; theme's
  floor is unconditional, not a mobile-only override); button stays auto-width/inline (no `fullWidth` set),
  matching the current placement beside the heading — confirmed visually in all 320/375/390 screenshots.
- **Cascade-layer override** — `ViewAllLink.tsx` passes zero Tailwind `className` to `Button`; `backgroundColor:
  rgba(0,0,0,0)` measured at every cell confirms the themed variant is not being overridden by unlayered
  `@mantine/core` CSS interacting with any stray utility class (there is none).
- **Hydration/console on `/[locale]`** — `check:hydration` 4/4 PASS, 0 FAIL; diff touches no header file.
- Validation / RLS / network / concurrent-writer — N/A, presentational navigation control (per kickoff's table).

## Files Changed

| File | Rationale |
|---|---|
| `src/components/shared/ViewAllLink.tsx` | New — shared `'use client'` island (props `{ href, label }`) rendering the canonical Mantine `Button variant="transparent" size="sm" component={Link}`, mirroring the `AgentCtaButton` precedent (Task 621) |
| `src/app/[locale]/page.tsx` | Replaced the L52–57 `buttonVariants` `<Link>` (Latest "view all") with `<ViewAllLink>`; removed the now-unused `buttonVariants`, `cn`, and `Link` (next/link, no longer used anywhere in this file) imports; added the `ViewAllLink` import |
| `src/modules/listings/components/FeaturedListings.tsx` | Replaced the L47–53 `buttonVariants` `<Link>` (Featured "view all", inside the existing `!loading && listings.length > 0` guard) with `<ViewAllLink>`; removed the now-unused `buttonVariants`, `cn`, and `Link` imports; added the `ViewAllLink` import |

No other file in the repo was modified. `git status --short` confirms exactly these 3 paths (plus this session log
and the backlog update).

## Validation evidence

1. `npm run typecheck` → **0 errors.**
2. `npm run check:i18n` → **PASSED**, 2203/2203 keys, all 4 locales parity, no delta (label pre-existed).
3. `npm run check:mojibake` → **0 artifacts in 1799 files.**
4. `npx eslint src/app/[locale]/page.tsx src/modules/listings/components/FeaturedListings.tsx src/components/shared/ViewAllLink.tsx` → **clean, no output.**
5. `npm run check:file-integrity` (git-changed scope, 5 files) → **PASSED**, all clean (0 NUL, 0 BOM, valid parse).
6. `grep -rn buttonVariants src/app/[locale]/page.tsx src/modules/listings/components/FeaturedListings.tsx` → **0 matches** in either file. Repo-wide `buttonVariants` grep still lists the same 12 other pre-existing sites (`ListingGallery.tsx`, `ListingContact.tsx`, `VerifiedCard.tsx`, `AdminListingsTable.tsx`, `VerifiedPage.stories.tsx`, `button.tsx`, `ListingMobileCTA.tsx`, `app/admin/users/page.tsx`, `AdminDashboardRecentListings.tsx`, `WhatsAppContactButton.tsx`, `FavoritesShell.tsx`, `confirm-email/page.tsx`) — **none touched.**
7. **Rendered — full Q3 matrix (ad-hoc Playwright against `next dev`, `BASE_URL=http://localhost:3000`):** for each of `sq/en/uk/it` × the full 14-width canonical set (320/375/390/480/560/680/768/810/960/1024/1200/1440/1920/2560) = **56 cells**, asserted: exact `href` for both Latest (`/{locale}/listings`) and Featured (`/{locale}/listings?premium=true`); exact localized `listing.view_all` label; `data-variant="transparent"`; `backgroundColor` resolves to `rgba(0,0,0,0)`; `minHeight` ≥44px; no horizontal document overflow. **Result: 56/56 PASS, 0 FAIL.** Raw results: `matrix-results.json` (scratchpad, see Opus handoff).
8. **Rendered — representative screenshots:** both surfaces (`featured_*`, `latest_*`) captured at the mandatory stress set (320/375/390/768/1024/1440) × all 4 locales = **48 images**, plus a dedicated hover-no-fill capture (`latest_en_1024_HOVER.png`). Visually spot-checked: `latest_uk_320.png`/`featured_uk_320.png` (mandatory `uk@320`), `featured_sq_320.png` (Albanian diacritics render correctly, no mojibake), `featured_it_390.png`, `latest_en_1440.png`, `latest_uk_768.png` — all show the correct transparent tertiary control with the correct localized label, no clipping.
9. **Hover-no-fill proof (TailAdmin §6a-link "no hover fill" requirement):** `backgroundColor` before hover = `rgba(0,0,0,0)`, after hover = `rgba(0,0,0,0)` — identical, confirming no fill appears on hover. Screenshot `latest_en_1024_HOVER.png`.
10. `npm run check:hydration` against a real `next dev` server (`BASE_URL=http://localhost:3000`) → **4/4 PASS** (Homepage en, Listings list en, Homepage sq, Homepage uk), 3 SKIP/NOT-REAL-COVERAGE (listing-detail + 2 authenticated-homepage cells — no session/env var available in this sandbox, same pre-existing shape as Task 621/629), **0 FAIL.**
11. **Self-correction during evidence-gathering (documented for transparency):** the first screenshot pass for the Latest control at 768/1024/1440px accidentally captured the *wrong* DOM element — `a[href="/{locale}/listings"]` is not unique on the page (the header nav "Listings" link and a mobile bottom-nav link share that exact href), and the capture script's `page.$()` returned the first DOM match rather than the intended Mantine button. Caught by visually inspecting the resulting images (showed plain nav text "Listings"/"Njoftime", not the styled "View all" button) before including them as evidence. Re-captured all 24 Latest screenshots (320/375/390/768/1024/1440 × 4 locales) plus the hover proof using a disambiguated selector (`a[href="..."][data-variant="transparent"]`); all 24 re-verified correct. The Featured screenshots were unaffected (their `?premium=true` query string is unique on the page). The programmatic 56-cell matrix (item 7) was never affected by this bug — it always scoped its DOM query to `a[class*="mantine-Button-root"]` first, then matched by `href`, so its PASS/FAIL results stand unchanged.

## Visual source trace

| Visible artifact/state | Component/markup | Class/selector | Utility, cascade, and token path | Change or preserve | Evidence |
|---|---|---|---|---|---|
| "view all" control — resting | `<Link className={cn(buttonVariants({variant:'ghost',size:'sm'}))}>` → `Button variant="transparent" component={Link}` (`ViewAllLink`) | legacy: `text-foreground`, `text-[0.8rem]` (12.8px), `h-7` (28px), radius `min(--radius-md,12px)` | legacy: `--foreground`, off-scale 12.8px; **target:** themed `transparent` variant → gray-700/`--foreground`, 14px/500, radius `lg` (8), transparent bg, `minHeight:2.75rem` (`theme.ts` `components.Button`) | **Changed (intended, R4)** | 56-cell matrix `backgroundColor`/`minHeight`; screenshots |
| "view all" — hover | same | legacy: `hover:bg-muted hover:text-foreground` | legacy: `--muted` fill on hover; **target:** `transparent` variant = text-darken only, **no fill** | **Changed (intended: fill removed)** | Hover proof: `before=rgba(0,0,0,0) after=rgba(0,0,0,0)`; `latest_en_1024_HOVER.png` |
| Mobile touch target | legacy `max-sm:min-h-11` (44px) + `max-sm:w-auto` | legacy: 44px min-height mobile-only | target: theme `minHeight:2.75rem` (44px) **unconditional**, auto width (no `fullWidth`) | **Preserved (≥44px), now unconditional not mobile-only** | `minHeight` ≥44px confirmed at all 56 cells incl. desktop widths |
| Destination + conditional presence | `page.tsx` (Latest), `FeaturedListings.tsx` (Featured) | `href`, `{!loading && listings.length>0}` guard | routing/i18n unchanged | **Preserved** | Diff (guard byte-unchanged); matrix `href` assertions at all 56 cells |
| Button chrome (the `transparent` primitive itself) | `Mantine/Primitives/Button` story §6a-link section | `variant="transparent"` | already themed + CI-gated | **Preserved (reused, not re-proven/re-storied)** | Standing `screenshots:assert --mantine-only` gate — untouched by this task |
| `System/FeaturedListings` Storybook story | `src/stories/FeaturedListings.stories.tsx` | local mock `Header()` | never rendered `view_all` at all (pre-existing story gap, unrelated to this task) | **Out of scope — not modified** | Source read + `grep view_all` → no match in story file; substituted with real app-route capture instead (see Summary) |
| Header, `ListingCard`, `theme.ts`, `globals.css`, `Mantine/Primitives/Button` story | — | — | — | **Preserved, out of scope, byte-unchanged** | `git status --short` confirms none of these paths appear in the diff |

## Self-review findings

- **Kickoff evidence-path gap (not a code defect):** the kickoff's suggested `System/FeaturedListings` story proof
  path does not render the real component or the `view_all` control at all — see Summary and the trace row above.
  Worked around with a strictly-stronger real-app-route capture rather than silently treated as satisfied or
  silently skipped.
- **Own script bug caught and fixed before reporting (not a product defect):** the first screenshot pass for the
  Latest control at desktop/tablet widths captured the wrong DOM element due to an ambiguous CSS selector in my own
  ad-hoc capture script (see Validation evidence #11). Caught via visual inspection before use as evidence;
  re-captured correctly. This affected only the evidence-gathering script, never the product code or the
  programmatic 56-cell PASS/FAIL matrix.
- No product defects found. All 8 requirements are directly evidenced; no gaps remain.

## Assumptions, deviations, and limitations

- **Open questions resolved as the kickoff recommended:** `size="sm"`; text-only (no `leftSection` icon).
- **A1 (island shape):** implemented exactly as the kickoff's recommended, reversible assumption — one shared
  `'use client'` island `ViewAllLink.tsx` (props `{ href: string; label: string }`), consumed by the async Server
  Component `page.tsx` and the client component `FeaturedListings.tsx`, mirroring `AgentCtaButton`.
- **Deviation from the kickoff's named R6 proof path:** substituted the `/{locale}` app-route capture for the
  `System/FeaturedListings` story capture, for the reason documented in Summary/Self-review. No story file was
  created, duplicated, or modified.
- **Limitation:** `check:hydration`'s 2 authenticated-homepage cells and the listing-detail cell remain SKIP
  (no session/env var available in this sandbox) — the same pre-existing, unrelated gap documented in Tasks
  621/629, not introduced or worsened by this task.
- **Limitation:** screenshots and `matrix-results.json` are session-scratchpad artifacts (gitignored area, not
  committed) — re-derivable on demand via the same ad-hoc Playwright pattern documented above if persistent
  evidence is required for release.

## Opus handoff

Evidence locations (session-scratchpad, not committed):
`C:\Users\Nox\AppData\Local\Temp\claude\C--Claude-Code-Projects-lero-al\57c1fe3c-bbec-49bb-87be-cd0a449a8552\scratchpad\task630-screens\`
— 48 stress-set screenshots (`featured_*`/`latest_*` × 320/375/390/768/1024/1440 × sq/en/uk/it), 1 hover-proof
screenshot, and `matrix-results.json` (the full 56-cell raw assertion data).

Diff: `src/components/shared/ViewAllLink.tsx` (new), `src/app/[locale]/page.tsx`,
`src/modules/listings/components/FeaturedListings.tsx`.

Questions/risks for the reviewer to inspect:
1. Confirm the R6/AC5 evidence substitution (real app-route capture instead of the named-but-non-rendering
   `System/FeaturedListings` story) is acceptable, and consider flagging the story's pre-existing gap (it never
   rendered the real `FeaturedListings` component or its `view_all` control) as a separate follow-up so it isn't
   relied on again as a proof path for this surface.
2. Confirm `size="sm"` + text-only are the correct final resolutions of the two open questions (kickoff's own
   recommendation, not separately re-confirmed by the owner in this session).
3. `check:hydration`'s SKIP cells (auth-gated) — confirm acceptable as pre-existing sandbox limitation, not new
   missing coverage from this task.

## Backlog update

See `docs/backlog.md` — concise active-state entry added; full detail lives here per session-log rules.
