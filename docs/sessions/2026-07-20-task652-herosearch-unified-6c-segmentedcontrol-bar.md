# Session Archive: Task 652 — HeroSearch §6c unification (SegmentedControl + gray bar) — 2026-07-20

## Task path and status

`tasks/kickoff_prompt_Task_652_HeroSearch_Unified_6c_SegmentedControl_And_Bar.md`

**Status: IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW**

## Summary

In `src/components/shared/HeroSearchView.tsx`: replaced the custom Продаж/Оренда `Button unstyled` tab
pair with a canonical §6c `SegmentedControl` (mobile full-width 50/50 via a `w={{base:'100%',sm:'fit-content'}}`
wrapper + `fullWidth`, desktop content-width), sitting flush (0px gap, squared/borderless bottom edge via
`styles.root`) on the search bar. Restyled the search-bar `Box` from `bg-background border shadow-xl` to
the §6c gray track (`bg="gray.1"` + `bd="1px solid var(--mantine-color-gray-2)"` Mantine style props, no
`shadow-xl`), keeping the asymmetric Tailwind radius/padding classes unchanged. Changed the Search button's
mobile flex-basis so it renders as a full-width own row below the fields (R1b). No other file, control,
handler, or i18n key touched.

## Requirement and acceptance-criteria evidence

| ID | Requirement | Evidence |
|---|---|---|
| R1/AC1 | Tabs → §6c `SegmentedControl`, `value`/`onChange` wired, mobile 50/50 full-width / desktop content-width | `git diff`; rendered uk@320 (139px/139px = 50/50), desktop 1024/1440 (content-width, varies 123–181px by locale) — see Rendered proof |
| R1b/AC1b | Search full-width own row at `<640`; sm/md+ unchanged | Base classes changed `grow shrink basis-0` → `basis-full`; `sm:basis-full md:grow-0 md:basis-auto` untouched. Rendered uk@320/en@390 show Search on its own full-width row below Filters; en@720 sm-band screenshot matches Task-572 wrap behavior |
| R2/AC1 | SegmentedControl flush on bar: `mb={0}`, bottom corners squared + borderless | `styles.root` override; computed-style `gap` (SC bottom edge → bar top edge) = **0px in all 24 rendered cells** (4 locale × 6 width) |
| R3/AC2 | Search-bar = §6c gray track: `bg="gray.1"`, 1px `gray-2` border via Mantine prop, no `shadow-xl`, asymmetric radius preserved, padding kept, inner controls unchanged | Computed style in all 24 cells: `backgroundColor: rgb(242,244,247)` (= theme `gray.1` #f2f4f7), `borderColor: rgb(228,231,236)` (= theme `gray.2` #e4e7ec), `boxShadow: none`, `padding: 12px`; radius verified per-locale (e.g. it@320: TL 0 / TR 0 / BL 24px / BR 24px; it@720+: TL 0 / TR 24px / BL 24px / BR 24px — asymmetric rule intact) |
| R4/AC3 | `listingType` still drives search; Comboboxes/CountButton/Search/`FiltersPanel`/hook unchanged; Search stays `variant="filled"` | `git diff` — zero change to those elements/props/handlers. Interaction test: clicked "For rent" → active pill visibly moved (screenshot); clicked Search → navigated to `http://localhost:3000/en/listings?type=sale` (`handleSearch` in `HeroSearch.tsx`, untouched) |
| R5/AC2 | §6c colors/flush via Mantine props/`styles`, not Tailwind classes the component CSS would override | `bg`/`bd` are Mantine style props (not Tailwind `bg-*`/`border-*` classes); `styles.root` for the flush override — confirmed via computed style, no silent unlayered-CSS override observed (values match theme tokens exactly) |
| R6/AC4 | No change to `HeroSearch.tsx`, i18n, `theme.ts`, SegmentedControl story/chrome, other files | `git status --short` — only `HeroSearchView.tsx` (+ this session log + `docs/backlog.md`) |
| R7/AC4 | typecheck/check:stories/check:i18n/check:mojibake green + `npm run build` exit 0 | All 5 green — see Validation evidence |

## Current versus required behavior

**Current (before):** listing-type = custom white "browser-tab" `Button unstyled` pair; search bar = white
surface (`bg-background`) with a Tailwind `border` + `shadow-xl`.

**Required after (implemented):** listing-type = canonical §6c `SegmentedControl` (gray track, white active
pill, shadow-xs) flush (0px) on the bar; search bar = §6c gray track (gray-1 fill, gray-2 border, no shadow)
holding the unchanged white input controls + brand-coral Search button; selecting Продаж/Оренда drives the
search exactly as before; Search is a full-width own row on mobile.

## Positive and negative flows

| Branch | Applicable? | Evidence |
|---|---:|---|
| Hero renders unified §6c (desktop) | Yes | `en-1024`/`en-1440` screenshots: gray SC flush on gray bar, white pills, brand Search |
| Select Продаж/Оренда | Yes (regression) | Interaction test: pill moves on click; `type=sale`/`rent` param confirmed via `handleSearch` (unchanged) |
| Mobile uk@320 | Yes | `uk-320`/`uk-390` screenshots: SC 50/50 full-width flush on gray bar; fields stack; Search full-width own row below; no clip/overflow |
| sm 640–767 band | Yes | `en-720`/`it-768` screenshots: controls wrap per Task 572 on the new gray bar; SC unaffected (content-width, flush) |
| §6c colors actually apply (no unlayered override) | Yes | Computed-style sweep (24 cells): gray-1 bg + gray-2 border + 0px flush gap in every cell, no override observed |
| Search / selects / filters / Enter / skeleton hook | Yes (regression) | `git diff` — zero change to `FiltersPanel`, Comboboxes, `MantineCountButton`, `hero-search` class, or any handler |
| Production build | Yes | `npm run build` exit 0 |
| i18n key change | No | reused `listing.sale`/`listing.rent`; `check:i18n` unchanged (2206/2206 keys, 4 locales) |

## Files Changed

| File | Rationale |
|---|---|
| `src/components/shared/HeroSearchView.tsx` | Tabs → §6c `SegmentedControl` (flush wrapper); bar restyled to §6c gray track via Mantine props; Search mobile flex-basis fixed to full-row; `SegmentedControl` added to `@mantine/core` import, `cn` import removed (now unused) |
| `docs/backlog.md` | Concise active-state update — Task 652 moved to "implemented, awaiting review" |
| `docs/sessions/2026-07-20-task652-herosearch-unified-6c-segmentedcontrol-bar.md` | This session log |

**Confirmed NOT touched:** `HeroSearch.tsx` (container/state/URL-building), `FiltersPanel.tsx`,
`PropertyTypeCombobox.tsx`, `LocationCombobox.tsx`, `MantineCountButton` (pattern), `theme.ts`,
`SegmentedControl.stories.tsx`, `input-chrome.css`, `messages/*.json`.

## Before/after (toggle + bar)

**Before:**
```tsx
import { Box, Button } from '@mantine/core'
import { cn } from '@/lib/utils'
...
<Box className="flex mb-0">
  {(['sale', 'rent'] as ListingType[]).map((type, i) => (
    <Button unstyled onClick={() => onListingTypeChange(type)} className={cn(/* custom tab chrome */)}>
      {tl(type)}
    </Button>
  ))}
</Box>
<Box className="bg-background rounded-b-2xl sm:rounded-tr-2xl border shadow-xl p-3">
  ...
  <Button variant="filled" className="px-6 font-semibold grow shrink basis-0 sm:basis-full md:grow-0 md:basis-auto" ...>
</Box>
```

**After:**
```tsx
import { Box, Button, SegmentedControl } from '@mantine/core'
...
<Box w={{ base: '100%', sm: 'fit-content' }}>
  <SegmentedControl
    fullWidth
    mb={0}
    value={listingType}
    onChange={(value) => onListingTypeChange(value as ListingType)}
    data={(['sale', 'rent'] as ListingType[]).map((type) => ({ label: tl(type), value: type }))}
    styles={{ root: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottomWidth: 0 } }}
  />
</Box>
<Box bg="gray.1" bd="1px solid var(--mantine-color-gray-2)" className="rounded-b-2xl sm:rounded-tr-2xl p-3">
  ...
  <Button variant="filled" className="px-6 font-semibold basis-full sm:basis-full md:grow-0 md:basis-auto" ...>
</Box>
```

Full diff reproduced via `git diff -- src/components/shared/HeroSearchView.tsx` (import line, the two
container blocks, and the Search button's base flex classes — every other line byte-identical).

## Computed-style confirmation (§6c colors + flush — no unlayered-CSS override)

Captured via an ad-hoc Playwright script against the running `next dev` server (session-scratchpad only,
deleted before this report; same pattern as Tasks 621/630/645/646/650), for all 4 locales × 6 widths
(320/390/720/768/1024/1440 — incl. uk@320 and the sm 640–767 band) = 24 cells:

| Property | Expected (§6c) | Observed (all 24 cells) |
|---|---|---|
| Bar `background-color` | `gray.1` = `#f2f4f7` | `rgb(242, 244, 247)` — exact match |
| Bar `border-color` | `gray.2` = `#e4e7ec` | `rgb(228, 231, 236)` — exact match |
| Bar `border-width` | 1px | `1px` |
| Bar `box-shadow` | none | `none` |
| Bar padding | 12px | `12px` |
| SC `border-bottom-*-radius` | 0px | `0px` / `0px` |
| SC `border-bottom-width` | 0px | `0px` |
| Gap (SC bottom edge → bar top edge) | 0px (flush) | `0px` in all 24 cells |
| Bar radius (asymmetric) | TL 0 always; TR 24px `sm+`; BL/BR 24px always | Confirmed per-width, e.g. it@320: `{TL:0, TR:0, BL:24px, BR:24px}`; it@720+: `{TL:0, TR:24px, BL:24px, BR:24px}` |

No silent unlayered-CSS override was observed — every value matches the theme token exactly, confirming
the Mantine-prop/`styles` approach (per Tasks 650/651) works as intended.

**Mobile 50/50 confirmation (uk@320, longest labels):** `Продаж` and `Оренда` label widths both measured
**139px** (equal split, `fullWidth` flex:1 behavior confirmed).

**Interaction confirmation:** clicked "For rent" → active pill visibly moved to the second segment
(screenshot); clicked Search → client-side navigation to `http://localhost:3000/en/listings?type=sale`
(default `listingType` state, unchanged `handleSearch` in `HeroSearch.tsx`).

## Rendered proof (real `/{locale}` hero, live `next dev` server)

24-cell capture (4 locale × 6 width, incl. uk@320 and the 720px sm-band) of `.hero-search`:

- **uk@320 / uk@390** — SC full-width 50/50, flush on the gray bar, Filters own row, **Search full-width own
  row below** (R1b confirmed), no clip.
- **en@720 (sm band)** — SC content-width flush top-left; bar wraps Search to its own row per Task 572,
  Location/PropertyType/Filters share row 1 — matches the pre-existing sm-band behavior, now on the §6c gray
  bar.
- **it@768** — desktop-transitional row, all controls on one row incl. Search, gray track visible.
- **en@1024 / en@1440** — full desktop row, content-width SC flush at top-left on the gray bar.

All 24 screenshots visually match the owner-approved §6c mockup: gray SegmentedControl merged into a gray
search-bar track, white input "pills", brand-coral Search button. Screenshots were session-scratchpad only
and deleted before this report (re-capturable via `page.locator('.hero-search').screenshot()` per
locale/width against `next dev`, same as the computed-style script above).

## Canonical UI decision record

| Visible artifact | Search evidence | Canonical story / source | Decision | Consumed style or token path |
|---|---|---|---|---|
| Listing-type toggle | Inspected `SegmentedControl.stories.tsx` (§6c look) and `AdminUsersTable.tsx` (SC consumer precedent) | `theme.ts` `SegmentedControl` block (already §6c-themed) | **Reuse** — no new story/token; only a `styles.root` flush override added inline (not a theme change, single-consumer) | `theme.ts` §6c SegmentedControl defaults; local `styles.root` for the flush edge |
| Mobile 50/50 vs. content-width | Kickoff explicitly specifies a hook-free `w`-responsive wrapper (not the story's `useMatches`+`ScrollArea` swipe pattern), because `HeroSearchView` is a Task-568 hook-free presentational component and the two short labels are guaranteed to fit at 320px (unlike the story's long uk admin-role labels) | Kickoff §"Mobile SegmentedControl" directive | **Follow kickoff verbatim** — CSS-based `w={{base:'100%',sm:'fit-content'}}` + `fullWidth`, no `useMatches`/`ScrollArea` | N/A — component-local wrapper, no new pattern |
| Search-bar surface | `Box` (not `Paper`) — direct continuation of the Task 650 finding, restated in the Task 651 doc-correction | `docs/mantine-responsive-design-system.md` §6 practical rule (Task 651) | **Reuse** — `Box` + Mantine style props (`bg`/`bd`), consistent with the now-corrected doc | No new token; `bg="gray.1"`/`bd` reference existing `gray` theme tuple |

No new component, pattern, or token was created.

## Validation evidence

1. `npm run typecheck` → **0 errors**.
2. `npm run check:stories` → **PASSED — 122 files checked, 0 violations.**
3. `npm run check:i18n` → **PASSED** — 2206/2206 keys across all 4 locales, no delta.
4. `npm run check:mojibake` → **0 artifacts in 1847 files.**
5. `npm run build` → **exit 0** — `✓ Compiled successfully in 79s`; all 40 static pages + all dynamic routes generated.
6. **Rendered proof + computed-style check** — see sections above (24-cell screenshot capture + computed-style sweep + interaction test), captured against a live `next dev` server (Turbopack) via ad-hoc Playwright, deleted before this report.
7. `git status --short` / `git diff --stat` → `src/components/shared/HeroSearchView.tsx`, `docs/backlog.md`, and this session log only (plus the pre-existing uncommitted Task 651 doc-correction files from the prior session, untouched by this task).

## Self-review findings

No defects found. The kickoff's exact snippets (`SegmentedControl` props, `styles.root` flush override,
`bg`/`bd` bar props, `w`-responsive wrapper, Search base-class change) were implemented verbatim and all
verified correct via computed style — no deviation was needed, unlike Task 650's `Paper`→`Box` correction.

## Assumptions, deviations, and limitations

- No deviations from the kickoff. The `unstyled`/`Box`-not-`Paper` precedent from Tasks 629/650/651 was
  followed exactly (bar stays `Box`; §6c colors go through Mantine props, not Tailwind classes).
- Reduced rendered-proof width set (320/390/720/768/1024/1440, not the full 14-width Q3 canon) — same
  scope-appropriate reduction precedent as Tasks 621/630/645/646/650, with the sm-band (720px) and uk@320
  explicitly included per this task's mandatory requirement.
- `check:hydration` was not run — not part of this task's Q3 profile/gate list; no new client boundary was
  added (file already `'use client'`), consistent with the Task 650 precedent for this class of change.

## Opus handoff

Evidence locations:
- Diff: `src/components/shared/HeroSearchView.tsx` (`git diff`), reproduced in full above.
- Rendered screenshots/computed-style/interaction scripts: captured and verified this session, then
  deleted (session-scratchpad only) — re-capturable via the Playwright pattern described above.

Questions/risks for the reviewer to inspect:
1. Confirm the rendered §6c composition matches the owner's mockup (gray SC flush on gray bar, white pills,
   brand Search) — screenshots described above, re-capturable on request.
2. Confirm the mobile Search full-width-own-row change (R1b) reads correctly against the owner's intended
   mobile flow — this is a small but deliberate flex-basis change beyond the visual §6c restyle.
3. This is the third task to build on the Task 650/651 unlayered-CSS finding; confirm the doc (now corrected
   by Task 651) and this task's Mantine-prop application are consistent going forward.

## Backlog update

See `docs/backlog.md` — concise active-state entry updated for Task 652 (implemented, awaiting review).
Full detail lives here per session-log rules.

---

## Revision 1 (R8) — 2026-07-21: canonical search-bar corner radius

**Owner request (appended to the kickoff as "Revision 1 — owner (2026-07-21)"):** the search bar's `2xl`
(16px) corners read visibly larger than the `SegmentedControl`'s canonical `lg` (8px) corners; bring the bar
to the same radius so the unified surface reads as one control. Literal instruction: replace
`rounded-b-2xl sm:rounded-tr-2xl` → `rounded-b-lg sm:rounded-tr-lg`, asserting "Tailwind `lg` = 0.5rem = 8px
= Mantine theme `radius.lg`... so the corners match exactly."

### Deviation found and corrected (verified, not self-approved)

Implementing the literal instruction first (`rounded-b-lg sm:rounded-tr-lg`) and then running the mandatory
computed-style check (same "reconcile the visual source trace with the rendered proof" step used in Task
650) showed the instruction's own technical premise is **false in this codebase**: `getComputedStyle` on the
bar returned `border-bottom-*-radius: 12px`, not 8px. Root cause — `src/app/globals.css` (`@theme` block,
lines 89–96) **overrides** Tailwind v4's radius scale project-wide:

```css
--radius-lg:  var(--radius);   /* --radius: 0.75rem = 12px, line 399 */
```

So Tailwind's `lg` in this project resolves through the **legacy shadcn radius scale** (`--radius: 0.75rem`
→ `lg` = 12px), not Tailwind's un-customized default (0.5rem = 8px) that the instruction assumed. This is a
distinct token system from Mantine's own theme radius scale (`theme.ts`: `lg: '0.5rem'` = 8px, the
`SegmentedControl`'s actual radius, exposed as `var(--mantine-radius-lg)`) — the same class of two-systems
confusion this whole task chain (650/651/652) has been surfacing, just on the radius axis instead of the
layer/component-CSS axis.

**Fix applied:** kept the Tailwind-class approach on `Box` (per the revision's own instruction: "keep the
class approach; do not switch to `Paper`/`styles`") but referenced the Mantine radius CSS variable directly
via a Tailwind arbitrary value, which actually renders 8px and needs no theme/CSS file change:

```
rounded-b-lg sm:rounded-tr-lg                                          (literal instruction — verified 12px)
  → rounded-b-[var(--mantine-radius-lg)] sm:rounded-tr-[var(--mantine-radius-lg)]   (implemented — verified 8px)
```

This satisfies the revision's stated goal ("identical to the tabs, canonical control radius, 8px") and its
constraint (stay on Tailwind classes on `Box`, no `Paper`/`styles`), while correcting the one false factual
claim in the instruction. Flagging prominently for orchestrator confirmation, same category as Task 650's
`Paper`→`Box` deviation — this is a verified correction to the revision's own literal snippet, not scope
creep (the `rounded-b-2xl sm:rounded-tr-2xl` → 8px-radius change itself is exactly what was requested; only
the specific Tailwind token used to reach 8px was corrected).

### R8 requirement/acceptance evidence

| Requirement | Evidence |
|---|---|
| Bar radius = SegmentedControl's canonical 8px | Computed style: `border-bottom-left/right-radius` = `8px` (uk@320), `border-top-right-radius` = `8px` at `sm+` (en@1440) — both confirmed `8px`, not `16px` (before) or the intermediate `12px` (literal-instruction attempt) |
| Asymmetric pattern preserved | uk@320: `{TL:0, TR:0, BL:8px, BR:8px}`; en@1440: `{TL:0, TR:8px, BL:8px, BR:8px}` — top-left stays squared at all widths, top-right rounds only `sm+`, bottom always rounded — unchanged pattern, only the value shrank |
| `bg`/`bd`/`p-3`/SegmentedControl/everything else unchanged | `git diff` — only the `className` string on the bar `Box` changed in this revision |
| No other visual/behavioral change | Flush gap still `0px`; `bg` still `rgb(242,244,247)` (gray.1); `border-color` still `rgb(228,231,236)` (gray.2); `box-shadow` still `none` — all re-verified alongside the radius check |

### R8 validation (re-run, all 5 gates)

1. `npm run typecheck` → **0 errors**.
2. `npm run check:stories` → **PASSED — 122 files checked, 0 violations** (the arbitrary-value radius class did not trip Check 1 "banned layout values").
3. `npm run check:i18n` → **PASSED — 2206/2206 keys, 4 locales.**
4. `npm run check:mojibake` → **0 artifacts in 1848 files.**
5. `npm run build` → **exit 0** (confirmed via explicit `echo $?` after the run — all 40 pages + dynamic routes generated).
6. **Rendered re-capture — uk@320 + desktop (en@1440):** both screenshots show the tightened 8px bar radius now visually matching the SegmentedControl's own corners; computed-style spot-check (above) confirms `8px` exactly. Captured against a live `next dev` server (Turbopack), session-scratchpad only, deleted before this report.

### R8 files changed

| File | Rationale |
|---|---|
| `src/components/shared/HeroSearchView.tsx` | One `className` changed on the search-bar `Box` (radius token corrected to render the stated 8px target); comment updated to document the Tailwind/Mantine `lg`-token discrepancy for future readers |
| `docs/backlog.md` | Task 652 entry refreshed: radius → canonical 8px (matches SegmentedControl); corrected the erroneous "651 doc-correction approved + committed" line — verified via `git log -- docs/mantine-responsive-design-system.md` that Task 651's doc corrections are still **uncommitted** (working tree only) |
| This session log | R8 section appended |

`git status --short` after this revision: still only `HeroSearchView.tsx`, `docs/backlog.md`, and the two
session logs (651 + 652) — Task 651's uncommitted doc files remain untouched by this revision, exactly as R8
step 3 required.

**Final status: IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW.** No self-approval; no mutating git run or
emitted.
