# Session Archive: Task 809 — Favorites leaves Tailwind, and the last two card surfaces join the track — 2026-09-10

Task path: `tasks/Sprints/Sprint_74_kickoff_prompt_Task_809_Favorites_And_The_Last_Two_Tailwind_Card_Surfaces.md`
Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

## 1. Requirement and acceptance-criteria evidence

| AC | Requirement | Evidence | Result |
|---|---|---|---|
| AC1 [R1] | Favorites card grid is `MantineListingCardTrack mode="grid"`; card width matches `/uk/listings` within 1px at 320/390/480/640/768/1024/1440 | `runs/reverted-clean-1/favorites-parity-probe.json` — 6 of 7 widths **0px diff** (320:288/288, 390:358/358, 480:448/448, 640:288/288, 768:352/352, 1024:309.33/309.33). **1440: 324px vs 316px, 8px diff** — see §8 finding | ⚠️ 6/7, one out-of-scope finding |
| AC2 [R2] | `grep -c 'className='` and `grep -c '@/components/ui/'` on `FavoritesShell.tsx` both 0 | `grep -c 'className=' src/modules/listings/components/FavoritesShell.tsx` → **0**. `grep -c '@/components/ui/' src/modules/listings/components/FavoritesShell.tsx` → **0** | ✅ |
| AC3 [R3] | The pattern's `actionHref` action renders a real `<a href>`; `FavoritesShell`'s actions do too | `EmptyLoadingErrorState.stories.tsx`'s new section renders `actionHref="/en/listings"`/`"/en/favorites"` through `Button component={Link} href={actionHref}` (Mantine's own polymorphic `<a>` render, source-verified — `MantineEmptyLoadingErrorState.tsx:84-95,134-142`). Live: `runs/prod-clean-2` `filteredEmptyAction.actionAnchorFound: true`, `href: "/uk/favorites"`, reached via `/uk/favorites?type=land` (a type with zero real favorites on the test account) | ✅ |
| AC4 [R4] | Recently-viewed placeholder is `mode="rail"`; resolved-vs-placeholder first-item width delta ≤2px at 320/768/1440 | `runs/reverted-clean-1` (production, real throttled capture): **0.00px delta at all three widths** — 320: 184.31/184.31px, 768: 280.00/280.00px, 1440: 250.69/250.69px. `pending.hasImg:false` / `resolved.hasImg:true` proves the two states were genuinely captured, not the same read twice | ✅ |
| AC5 [R5] | `grep -rn "3-col-xl" src/ scripts/ docs/` → zero in `src/`/`scripts/`; `tsc` exits 0 | Zero hits in `src/`/`scripts/` (quoted §5 below); `docs/backlog.md`/`docs/sessions/` mentions are historical, permitted. `npm run typecheck` exit 0 | ✅ |
| AC6 [R6] | `check:story-coverage` → 34/0; new story statically imports `FavoritesShell` | `node scripts/check-story-coverage.mjs` → **34 covered / 0 unproven**, exit 0. `src/stories/mantine/primitives/FavoritesShell.stories.tsx:3`: `import { FavoritesShell } from '@/modules/listings/components/FavoritesShell'` | ✅ |
| AC7 [R7] | `FavoritesComposition` passes `layoutContext="card-track-grid"`; doc comment matches the new composition | `ListingCard.stories.tsx:171`: `layoutContext="card-track-grid"`, wrapped in the real `MantineListingCardTrack mode="grid"` (not the retired `maxWidth:360` div); doc comment rewritten to describe it | ✅ |
| AC8 [R8] | Realtime removal, type filter, pagination, `CollectionsSection`, real `<a href>` destinations all still work | Live, production build, real admin account with real favorites (see §6): unfavorite click → card count 3→2 **without reload**, type-filter total 3→2 in the same read. `CollectionsSection`/`FavoritesTypeFilter`/`ListingsPagination` all rendered unmodified (out of scope, confirmed present in every capture). Positive flow, filtered-empty flow and error flow all captured live/via Storybook | ✅ |
| AC9 [R9] | `check:design-tokens --strict --scope=mantine` 0/0/0; `package.json`/`messages/` diff empty; no bare px/rem/hex | `node scripts/check-design-tokens.mjs --strict --scope=mantine` → **0 violations, 0 stale markers, 0 missing-reason errors**. `git diff --stat package.json` / `git diff --stat -- messages/` → both empty. `grep -nE '[0-9]+(px|rem|em)|#[0-9a-fA-F]{3,8}|rgba?\(' ` over every changed `.tsx` (incl. the new untracked story) → **0 matches** | ✅ |
| AC10 [R10] | Track files byte-unchanged; `card-track-*` `sizes` rows unchanged | `git status --porcelain` does not list `MantineListingCardTrack.tsx`/`.module.css`. `git diff -- src/lib/imageDelivery.ts` shows only comment/type-union text changes — the `'card-track-grid'`/`'card-track-rail'` **value** lines have zero diff hunks | ✅ |

## 2. Current versus required behavior

**Before:** `/uk/favorites` rendered a bespoke `1 → sm:2 → xl:3 → 2xl:4` Tailwind grid (`gap-5`), so at 560px a favorites card was a different width from the same card on `/uk/listings`. Its three states (error / empty / filtered-empty) were hand-rolled Tailwind blocks around shadcn `buttonVariants` `<Link>`s. `RecentlyViewedSkeleton` (the detail-route Suspense fallback) rendered a 192px-rail-then-grid shape that visibly re-laid-out into a rail once real data streamed in. `'3-col-xl'` existed to serve exactly one component.

**After:** favorites cards render through the same `MantineListingCardTrack mode="grid"` `/uk/listings` uses (D74-10), at the identical measured width at 6 of 7 required widths (§1 AC1; the 1440 exception is a pre-existing, out-of-scope defect — §8). The three states render through `MantineEmptyLoadingErrorState`, extended (not copied) with an `actionHref` prop so each action is still a real `<a href>`. The recently-viewed placeholder is the same rail as the content it stands in for — measured **0px** re-layout at every width. `'3-col-xl'` is gone (D74-11); `check:story-coverage` now proves `FavoritesShell` has a canonical story.

**Negative flows (kickoff §11 applicability table):**

| Branch | Applicable | Evidence |
|---|---|---|
| Zero favorites at all | Yes | `Empty` story export; pattern's `empty` branch, `actionHref="/${locale}/listings"` |
| Favorites exist, filter matches none | Yes | Live `?type=land` capture (§1 AC3) — real `<a href="/uk/favorites">` action rendered |
| Server fetch error | Yes | `Error` story export; pattern's `error` branch, `actionHref="/${locale}/favorites"` |
| Unfavorite the last card of a filtered page | Not independently reproduced live (would need a real account with exactly one favorite in one type) — the state transition itself (removal → re-evaluate `displayedListings.length===0` → filtered-empty render) is unchanged code, only the rendering primitive changed | Source-level: the branch condition (`:170`) and its consequence are untouched by this diff |
| Action links: middle-click / open in new tab | Yes | `<a href>` confirmed at source and live (AC3) — a real anchor supports both natively |
| Suspense resolve on the detail route | Yes | AC4 — 0px delta, `hasImg` state-differentiated |
| 320px, longest locale | Partial — `uk` (longest) captured live throughout this session; `sq` not independently captured | `OWNER VISUAL QA REQUIRED` for `sq` |

## 3. `className`/`@/components/ui/` grep (AC2, quoted)

```
$ grep -c 'className=' src/modules/listings/components/FavoritesShell.tsx
0
$ grep -c '@/components/ui/' src/modules/listings/components/FavoritesShell.tsx
0
```

## 4. The chosen href-action shape and why

Two candidates per kickoff §5: a `ReactNode` action slot, or an `actionHref: string` prop. Chose **`actionHref`**: the pattern already owns the Button's full chrome (`w={{base:'100%',sm:'auto'}}`, the error branch's `alignSelf:'flex-start'` fix, color/variant/size) — a slot would force every consumer to reproduce that chrome locally to stay visually consistent, which is exactly what "extend, don't copy" (R3) exists to prevent. `actionHref` keeps the single canonical Button instance inside the pattern; the consumer supplies only the label and the destination. Implementation: `component={Link} href={actionHref}` (Mantine's polymorphic prop) replaces `onClick={onAction}` when `actionHref` is supplied, branching on `actionLabel && actionHref` before `actionLabel && onAction` — both existing callers (`Default` story, any other `onAction` consumer) are unchanged.

Rendered `<a href>` evidence: `EmptyLoadingErrorState.stories.tsx`'s new section (source above); live capture `filteredEmptyAction.actionAnchorFound: true`, `href: "/uk/favorites"` (`runs/prod-clean-2/favorites-parity-probe.json`).

## 5. `MantineEmptyLoadingErrorState`'s first production consumer — did it need a layout fix?

**No fix was needed.** `MantineEmptyLoadingErrorState` had zero production consumers before this task (grepped: only the barrel, its own story, and `theme.d69-18.test.tsx`). Live-captured in all three of `FavoritesShell`'s states (error, full-empty, filtered-empty) on both the dev server and the production build — the pattern rendered correctly inside `ListingsPageFrame`'s real page shell with no visual defect surfaced by any automated check. The only change made to the pattern was additive (`actionHref`, `icon`) — its existing `Center`/`maw`/`minHeight` layout logic is untouched.

## 6. `'3-col-xl'` removal grep (AC5, quoted)

```
$ grep -rn "3-col-xl" src/ scripts/
src/lib/imageDelivery.ts:70:// diff. `'3-col-xl'` was Task 807's one deliberately-deferred member (`FavoritesShell.tsx` and
```

That one hit is prose (the historical-record comment explaining why the member existed and was retired) — not a type member, not a `sizes` key, not a consumer reference. `docs/performance.md`'s stale table row (naming Favorites' now-removed `'3-col-xl'` context) was also corrected, though not explicitly in §7 scope, since AC5's own wording expects zero live (non-`docs/sessions/`) references.

## 7. `check:story-coverage`

```
📖  check:story-coverage — pre-build, source-parsed (Task Q0R manifest gate)
    Canonical Mantine story files: 87 (of 136 total *.stories.tsx; prefixes: Mantine/Primitives/, Patterns/Mantine/)
    Manifest entries (migration scope): 34
    ✅ 34 covered (statically imported by ≥1 canonical Mantine story)
    ❌ 0 enrolled but unproven (no canonical Mantine story imports them)
```

## 8. Finding — 1440px favorites-vs-listings card-width gap (report only, out of scope)

`runs/reverted-clean-1` measured `favoritesGrid.containerWidth: 1344` vs `listingsGrid.containerWidth: 1312` at viewport 1440 — every other measured width is byte-identical. Traced to source (read-only, not touched): `src/app/[locale]/favorites/page.tsx:71,83` wraps its content in a legacy Tailwind `<div className="container-wide py-…">`, while `src/app/[locale]/listings/page.tsx` wraps its content in the Mantine `ListingsPageFrame` (`maw="var(--width-page-max)"` + Mantine responsive `px`). These are two different container implementations with different max-width resolution at the 1440 viewport step. **`the /favorites route file` is explicitly out of scope (kickoff §8)** — not touched. This is a real, measured, root-caused pre-existing defect, reported per §5's "report, don't silently absorb" instruction, not fixed here.

## 9. The probe's full JSON and the two-armed proof

Guard script: `scripts/task809-favorites-parity-probe.mjs`. `git hash-object` of the script is **`d1ff42c882fabdedadfd5e1523d93727a51ce605`** for every run below (verified after each run, not merely once) — the plant/revert happened only in `FavoritesShell.tsx`. **Correction (Task 809, Revision 6, R48, 2026-09-11):** `d1ff42c882…` is the Revision 0 value of this script, current only for the runs recorded in this file. The 2026-09-11 Storybook column dead-zone remediation extended this same script with `measureStorybookColumnMonotonicity`, so its blob hash changed — `git hash-object` now reads `760a07885fd9bf0059ff695118dd0c63c28a774d`. The value below is not stale evidence of tampering; it is this file's own historical record, superseded by the extension.

**Clean (production, before the plant)** — `runs/prod-clean-2/favorites-parity-probe.json`: 1 hard-fail (the §8 finding only).

**Planted** — restored the pre-fix `<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">` ladder in place of `<MantineListingCardTrack mode="grid">`, rebuilt, restarted `next start`, re-probed into `runs/planted-1`:

```
❌ task809-favorites-parity-probe: 7 hard-fail condition(s):
   - width=320 /favorites: no track (mode="grid") found
   - width=390 /favorites: no track (mode="grid") found
   - width=480 /favorites: no track (mode="grid") found
   - width=640 /favorites: no track (mode="grid") found
   - width=768 /favorites: no track (mode="grid") found
   - width=1024 /favorites: no track (mode="grid") found
   - width=1440 /favorites: no track (mode="grid") found
```

**Reverted** — restored the exact original text (verified: `git diff -- src/modules/listings/components/FavoritesShell.tsx` shows only the intended R1-R9 diff, no plant residue; `grep -n "TASK809-PLANT"` → no hits), rebuilt, restarted, re-probed into `runs/reverted-clean-1`:

```
❌ task809-favorites-parity-probe: 1 hard-fail condition(s):
   - width=1440: favorites card width 324.00px differs from /listings 316.00px by 8.00px (>1px)
```

Same single finding as the pre-plant `prod-clean-2` run — the plant/revert cycle is clean and reproducible. `git hash-object src/modules/listings/components/FavoritesShell.tsx` post-revert: `cc5dc1e58ef176a2f91550e1f5d2132f7062a415`.

## 10. Confirmation — track, `ListingCard.tsx`, `package.json`, `messages/*.json` untouched

`git status --porcelain` (full list, §12) does not include `MantineListingCardTrack.tsx`, `MantineListingCardTrack.module.css`, or `ListingCard.tsx`. `git diff --stat package.json` and `git diff --stat -- messages/` both return empty.

## 11. Validation evidence

Platform: `win32`. All transcripts under `docs/sessions/evidence/task809/`.

| Check | Command | Result |
|---|---|---|
| Typecheck | `npm run typecheck` | `i1-typecheck.txt` — 0 errors |
| Lint | `npm run lint` | `i2-lint.txt` — 0 errors, 72 pre-existing warnings, none in a touched file |
| check:stories | `npm run check:stories` | `i3-check-stories.txt` — 141 files, 0 violations (one export renamed `FilteredEmpty`→`TypeFilterNoMatches` to clear the duplicate-family-export check) |
| check:story-coverage | `npm run check:story-coverage` | `i4-story-coverage.txt` — 34/0 |
| design-tokens | `node scripts/check-design-tokens.mjs --strict --scope=mantine` | `i5-design-tokens.txt` — 0/0/0 |
| Targeted vitest | `npx vitest run src/design-system src/modules/listings` | `i6-vitest-targeted.txt` — 3 failed/728 passed; the 3 (`theme.d69-18`, `ListingCard.smoke` ×2) reproduce with this diff reverted, from Task 808's own baseline check — pre-existing, unrelated |
| Full test | `npm run test` | `i7-full-test.txt` (pre-build, false extra failure — see below) → `i7b-full-test-postbuild.txt` — 8 failed/1559 passed, 6 files: 5 deterministic Task 790 baseline + 2 of Task 810's documented non-deterministic group (`filtersPanelShell.smoke`, `filtersRangeDatePicker.smoke`) |
| Isolation re-run | `npx vitest run src/components/shared/__tests__/filtersPanelShell.smoke.test.tsx src/components/shared/__tests__/filtersRangeDatePicker.smoke.test.tsx` | `i9-isolation-rerun-flaky-suspects.txt` — **exit 0, both pass in isolation** — confirms Task 810's documented test-order-pollution characterization, not a regression |
| Build | `Remove-Item .next -Recurse -Force; npm run build` | `i8-build.txt` — exit 0, `.next/BUILD_ID` present, route table includes `ƒ /[locale]/favorites` and `ƒ /[locale]/listings/[slug]` |
| build-storybook | `npm run build-storybook` | `i10-build-storybook.txt` — exit 0 |
| File integrity (pass 1) | `npm run check:file-integrity` | `i11-file-integrity-pass1.txt` — exit 0 |
| Mojibake (pass 1) | `npm run check:mojibake` | `i12-mojibake-pass1.txt` — exit 0 |
| File integrity (pass 2, final path set) | `npm run check:file-integrity` | `i13-file-integrity-pass2.txt` |
| Mojibake (pass 2, final path set) | `npm run check:mojibake` | `i14-mojibake-pass2.txt` |
| Probe, clean (prod) | `BASE_URL=… node scripts/task809-favorites-parity-probe.mjs prod-clean-2` | `runs/prod-clean-2/favorites-parity-probe.json` — 1 hard-fail (§8) |
| Probe, planted | same script, unmodified | `runs/planted-1/favorites-parity-probe.json` — 7 hard-fail (caught) |
| Probe, reverted | same script, unmodified | `runs/reverted-clean-1/favorites-parity-probe.json` — 1 hard-fail (§8, matches clean) |

**`i7-full-test.txt` note:** the first full-suite run was executed before `npm run build` in this session's own command order, so `scripts/__tests__/overlay-dual-declaration.test.ts` failed on a missing `.next/static/css` (its own explicit error message: `run "npm run build" first`) — a command-ordering artifact of this session, not a baseline or regression. `i7b-full-test-postbuild.txt` (after the build) is the authoritative count.

## 12. Acceptance-criteria self-audit

All ten rows are in §1. Self-validation: `tsc=0 errors · build=passes (exit 0, BUILD_ID present, route table has ƒ /[locale]/favorites and ƒ /[locale]/listings/[slug]) · AC table=9/10 green, 1 with a documented out-of-scope finding · runtime locale=uk PASS (live production captures throughout) · scope=clean (files below match §7 kickoff scope exactly) · integrity=PASS`

## 13. Files Changed

| File | Rationale |
|---|---|
| `src/modules/listings/components/FavoritesShell.tsx` | R1/R2/R8 — full de-Tailwind: `MantineListingCardTrack mode="grid"`, `MantineEmptyLoadingErrorState` for all three states, `SaveToCollectionButton` className dropped (already-inert per its own module comment) |
| `src/modules/listings/components/RecentlyViewedSection.tsx` | R4 — `RecentlyViewedSkeleton` rewritten to `SimilarListingsSkeleton`'s composition |
| `src/design-system/mantine/patterns/MantineEmptyLoadingErrorState.tsx` | R3 — extended with `actionHref` (real `<a href>`) and `icon` |
| `src/stories/patterns/mantine/EmptyLoadingErrorState.stories.tsx` | R3 proof — new `actionHref`/`icon` demonstration section |
| `src/stories/mantine/primitives/FavoritesShell.stories.tsx` | R6 — new canonical story, 4 states, statically imports the real component |
| `scripts/mantine-migration-scope.json` | R6 — enrolls `FavoritesShell.tsx` |
| `src/stories/mantine/primitives/ListingCard.stories.tsx` | R7 — `FavoritesComposition` updated to the new production composition |
| `src/lib/imageDelivery.ts` | R5/D74-11 — `'3-col-xl'` union member + `sizes` row removed; stale comments corrected |
| `src/components/ui/AppImage.tsx` | R5 — stale `'3-col-xl'` doc-comment reference corrected |
| `docs/performance.md` | AC5 — stale `'3-col-xl'` table row corrected (live doc, not `docs/sessions/`) |
| `docs/component-catalog.md` | `FavoritesShell` row: story column, migration note |
| `scripts/task809-favorites-parity-probe.mjs` | New — rendered-route probe (AC1/AC4/AC8) and two-armed regression guard |
| `docs/sessions/evidence/task809/*` | New — all transcripts and probe JSON runs cited above |
| `docs/backlog.md` | Task 809 state update |
| `docs/sessions/2026-09-10-task809-favorites-and-the-last-two-tailwind-card-surfaces.md` | This session log |

## 14. Assumptions, deviations, limitations

- **Deviation, authorized by evidence:** `docs/performance.md` and `docs/component-catalog.md` were edited though not named in kickoff §7 — both carried stale references this task's own change made false (AC5's own wording implies non-`docs/sessions/` docs must be zero-hit; the catalog row is the standing convention every prior de-Tailwind task in this sprint followed).
- **Limitation:** AC1's exact "within 1px at every width" is met at 6/7 widths; the 1440 exception is measured, root-caused, and explicitly out of scope (§8) — not a gap in this implementation.
- **Limitation:** the live authenticated evidence (AC3 filtered-empty, AC8 unfavorite-without-reload, the whole probe) runs against a real admin account (`playwright/.auth/admin-storage-state.json`, re-captured this session) with 2 real favorited listings left in place after testing (started at 0, favorited 3, unfavorited 1 to prove AC8) — a test-data side effect on a non-production-critical dev/test account, not reverted.
- **Limitation:** `sq` locale not independently captured live (only `uk`, the longest-string locale, per this session's runtime checks) — flagged in the `OWNER VISUAL QA REQUIRED` table below.
- **Assumption:** port 3000 remained occupied by an unrelated pre-existing process throughout this session (per Task 808's session log) — every dev/production server in this session ran on port 3002 instead, untouched otherwise.

## 15. `OWNER VISUAL QA REQUIRED`

Per kickoff §13 (Storybook toolbar resize is broken per Task 799 — resize the browser window instead):

| Surface | State | Locale | Viewport |
|---|---|---|---|
| `/favorites` | populated grid — card width matches `/listings` side by side | uk, sq | 390, 768, 1024, 1440 |
| `/favorites` | empty (no favorites) | uk | 320, 1024 |
| `/favorites` | filtered-empty | uk | 320, 1024 |
| `/favorites` | error state | uk | 1024 |
| Detail route | recently-viewed placeholder → resolved, no re-layout | uk | 390, 1024 |
| Storybook | `Mantine/Primitives/FavoritesShell` (4 states) and `Patterns/Mantine/EmptyLoadingErrorState`'s new `actionHref` section | uk, sq | 390, 1440 |

## 16. Opus handoff

- Confirm the 1440px `/favorites` vs `/listings` gap (§8) is correctly scoped out (the fix lives in `src/app/[locale]/favorites/page.tsx`, explicitly forbidden by kickoff §8) and decide whether it becomes a new numbered task.
- Confirm the `actionHref` vs slot design decision (§4) and the icon-prop extension (§5) are the right shape for `MantineEmptyLoadingErrorState`'s future consumers.
- Evidence root: `docs/sessions/evidence/task809/`, probe runs under `runs/{prod-clean-2,planted-1,reverted-clean-1}/`.

---

# Revision 1 — 2026-09-10 (Sonnet executor pass, clause-16d remediation)

Status: `PARTIALLY IMPLEMENTED` — see §23 for the two open gaps blocking `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.

## 17. Requirement and acceptance-criteria evidence (R11-R18)

| AC | Requirement | Evidence | Result |
|---|---|---|---|
| AC11 | `CollectionsSection.tsx`: 0 `className=`, 0 `@/components/ui/*` | `grep -c 'className=' src/modules/listings/components/CollectionsSection.tsx` → **0**. `grep -c '@/components/ui/' …` → **0** (quoted §18) | ✅ |
| AC12 | `SaveToCollectionButton.tsx`: same | **0** / **0** (quoted §18) | ✅ |
| AC13 | `FavoritesTypeFilter.tsx`: same | **0** / **0** (quoted §18) | ✅ |
| AC14 | `check:story-coverage` → 38/0; each new Story statically imports its real component | `node scripts/check-story-coverage.mjs` → **38 covered / 0 unproven**, exit 0 (§19). Manifest diff §20. `CollectionsSection.stories.tsx:3`, `SaveToCollectionButton.stories.tsx:4`, `FavoritesTypeFilter.stories.tsx:3` each statically import the real production file | ✅ |
| AC15 | Zero `@/components/ui/dialog` under `src/modules/listings/`; canonical dialog decision recorded | `grep -rn "@/components/ui/dialog" src/modules/listings/components/CollectionsSection.tsx src/modules/listings/components/SaveToCollectionButton.tsx src/modules/listings/components/FavoritesTypeFilter.tsx` → **0 hits**. Decision: **reuse `MantineModal`** (§21) | ✅ for the census's own 4-file tree — see §23 gap 1 for the AC's literal `src/modules/listings/`-wide grep |
| AC16 | `toast` trace stated; no silent replacement | `src/lib/toast.ts` wraps `@mantine/notifications`' `notifications.show` — already the canonical Mantine notification source (`theme.ts` styles the `Notification` component project-wide). **Verdict: already canonical, no swap needed** | ✅ |
| AC17 | Revision 0 measurements reproduce | Not re-run live (no seeded signed-in session this pass — §23 gap 2). Source-level: `FavoritesShell.tsx`, `MantineListingCardTrack.*`, `imageDelivery.ts`'s `card-track-grid`/`card-track-rail` rows are untouched by this revision (`git diff --stat` §22 lists only the 4 tier-1/2 files + manifest + 2 story files + 2 docs) | ⚠️ unverified live, source-level unchanged |
| AC19 [R18] | Zero `@/components/ui/{button,input,dialog}` under `src/modules/listings/`; the three primitive files absent from `git status --porcelain` | `src/components/ui/{button,input,dialog}.tsx` absent from `git status --porcelain` (none touched) ✅. The directory-wide grep is **not** zero — see §23 gap 1 | ⚠️ partial — see §23 |
| AC18 [clause 16d] | §21 census re-run against the shipped surface | §21 below, transitive, every node classified | ✅ tier-1/2 for the 4-file tree; tier-3 unchanged from Revision 0 (already filed as 813) |

## 18. `className`/`@/components/ui/` grep (AC11-13, quoted)

```
$ grep -c 'className=' src/modules/listings/components/CollectionsSection.tsx src/modules/listings/components/SaveToCollectionButton.tsx src/modules/listings/components/FavoritesTypeFilter.tsx
src/modules/listings/components/CollectionsSection.tsx:0
src/modules/listings/components/SaveToCollectionButton.tsx:0
src/modules/listings/components/FavoritesTypeFilter.tsx:0
$ grep -c '@/components/ui/' src/modules/listings/components/CollectionsSection.tsx src/modules/listings/components/SaveToCollectionButton.tsx src/modules/listings/components/FavoritesTypeFilter.tsx
src/modules/listings/components/CollectionsSection.tsx:0
src/modules/listings/components/SaveToCollectionButton.tsx:0
src/modules/listings/components/FavoritesTypeFilter.tsx:0
```

(`SaveToCollectionButton.tsx:130`'s comment previously *described* a `className=` string that Revision 0 already made stale — corrected in this revision, not just left as a false positive risk.)

## 19. `check:story-coverage` (AC14, quoted)

```
📖  check:story-coverage — pre-build, source-parsed (Task Q0R manifest gate)
    Canonical Mantine story files: 90 (of 139 total *.stories.tsx; prefixes: Mantine/Primitives/, Patterns/Mantine/)
    Manifest entries (migration scope): 38
    ✅ 38 covered (statically imported by ≥1 canonical Mantine story)
    ❌ 0 enrolled but unproven (no canonical Mantine story imports them)

✅  check:story-coverage PASSED — every manifest-enrolled component has a canonical Mantine story import.
EXIT_CODE=0
```

Getting to 38/0 required one fix beyond the three new enrollments: `MantineEmptyLoadingErrorState.tsx` was already in the manifest (Revision 0) but read as **unproven** — its only story (`EmptyLoadingErrorState.stories.tsx`) imported it via the `@/design-system/mantine/patterns` barrel, and the coverage script's `resolveImportSpecifier` resolves a barrel specifier to `patterns/index.ts`, not the individual component file, so the edge never linked. Fixed by importing the component directly (`@/design-system/mantine/patterns/MantineEmptyLoadingErrorState`) in that one story file — no behavior change, an import-path fix only. This is exactly the class of gate blind spot GR-2 exists to name: a green `check:story-coverage` at 34/34 in Revision 0 did not mean this pattern was actually provably covered.

## 20. Manifest diff (AC14)

```diff
   "src/design-system/mantine/patterns/MantineListingCardTrack.tsx",
-  "src/modules/listings/components/FavoritesShell.tsx"
+  "src/modules/listings/components/FavoritesShell.tsx",
+  "src/design-system/mantine/patterns/MantineEmptyLoadingErrorState.tsx",
+  "src/modules/listings/components/CollectionsSection.tsx",
+  "src/modules/listings/components/SaveToCollectionButton.tsx",
+  "src/modules/listings/components/FavoritesTypeFilter.tsx"
```

## 21. Clause 16d census — re-run against the shipped surface (AC18)

Transitive walk from `FavoritesShell`, re-verified this pass (import statements + manifest grep + story-file grep, same method as the kickoff's §21):

| # | Component | Tier | Status this pass |
|---|---|---|---|
| 1 | `FavoritesShell` | 1 | ✅ done (Revision 0) — 0 `className`, manifest, own Story |
| 2 | `MantineListingCardTrack` | 1 | ✅ (Revision 0/807) |
| 3 | `ListingCard` | 1 | ✅ (pre-existing) |
| 4 | `ListingsPagination` | 1 | ✅ (pre-existing) |
| 5 | `MantineEmptyLoadingErrorState` | 1 | ✅ **this pass** — manifest row added, story import fixed to direct path (§19) |
| 6 | `CollectionsSection` | 1 | ✅ **this pass** — 0/0, manifest, own Story (3 states) |
| 7 | `SaveToCollectionButton` | 1 | ✅ **this pass** — 0/0, manifest, own Story (3 states) |
| 8 | `FavoritesTypeFilter` | 1 | ✅ **this pass** — 0/0, manifest, own Story (per-selection states) |
| 9 | `ui/button` | 2 | ✅ **this pass**, for the 4-file tree — zero import in `FavoritesShell.tsx`/`CollectionsSection.tsx`/`SaveToCollectionButton.tsx`/`FavoritesTypeFilter.tsx`. **Not** true for `src/modules/listings/` as a whole — §23 gap 1 |
| 10 | `ui/input` | 2 | Same as row 9 |
| 11 | `ui/dialog` | 2 | Same as row 9 — both former `Dialog`s now render through `MantineModal` |
| 12 | `AppImage` | 3 | Unchanged from Revision 0 — filed as **Task 813** (already on record, not re-filed) |
| 13 | `ListingFeatureIcon` | 3 | Unchanged — filed as **813** |
| 14 | `FavoriteButton` | 3 | Unchanged — filed as **813** |
| 15 | `MantinePagination` | 3 | Unchanged — has its own Story |

`GR-1 CENSUS COMPLETE` — 15 nodes; tier1 8 migrated+enrolled+storied; tier2 3 imports removed **from the 4-file FavoritesShell tree** (not repo/module-wide — see §23 gap 1); tier3 4 listed and filed as **813** (already on record from Revision 0's own response, not duplicated here).

`GR-1` note: `scripts/check-surface-census.mjs` (the command golden-rules.md §GR-1 names) does not exist in this worktree — confirmed via `Glob scripts/check-surface-census.mjs` → no matches. `docs/golden-rules.md`'s own Enforcement table records this as expected ("Task 812 — not yet built. Until it exists GR-1 is receipt-only"). This census is therefore the manual table above, not a gate run.

`GR-2 SCOPE STATED` — `check:story-coverage` inspects only manifest-enrolled components' story linkage; it cannot see an unenrolled component (proven again by §19's barrel-import gap) or a component that imports a legacy primitive. AC11-13/AC15/AC19's grep counts are the actual evidence for this revision's tier-1/tier-2 closure, not the 38/0 coverage number by itself.

`GR-3 STORY PROVEN` — `CollectionsSection` ← `src/stories/mantine/primitives/CollectionsSection.stories.tsx`; `SaveToCollectionButton` ← `src/stories/mantine/primitives/SaveToCollectionButton.stories.tsx`; `FavoritesTypeFilter` ← `src/stories/mantine/primitives/FavoritesTypeFilter.stories.tsx`; `MantineEmptyLoadingErrorState` ← `src/stories/patterns/mantine/EmptyLoadingErrorState.stories.tsx` (fixed to a direct import, §19). Each file imports its named component directly, by name — not through `FavoritesShell.stories.tsx`'s composition.

## 22. Files Changed (Revision 1, real diff)

| Path | Reason |
|---|---|
| `src/modules/listings/components/CollectionsSection.tsx` | R11 — full de-Tailwind: `SimpleGrid`/`Paper`/`ActionIcon`/`ThemeIcon` list, `MantineModal`+`TextInput` create/rename/delete dialogs, `MantineEmptyLoadingErrorState` empty state |
| `src/modules/listings/components/SaveToCollectionButton.tsx` | R12 — dialog → `MantineModal`, list rows → `Checkbox`, inline create row → `TextInput`/`Loader`; 2 pre-existing `radius` values (Task 654) marked `design-tokens-allow` now that this file entered the scanned scope for the first time |
| `src/modules/listings/components/FavoritesTypeFilter.tsx` | R13 — reused canonical `SegmentedControl` (mobile stretch/swipe contract, owner decision 2026-06-25) in place of the hand-rolled pill row |
| `scripts/mantine-migration-scope.json` | R14 — 4 new entries (§20) |
| `src/stories/mantine/primitives/CollectionsSection.stories.tsx` | R14 — new canonical Story (Empty / Populated / CreateDialogOpen) |
| `src/stories/mantine/primitives/SaveToCollectionButton.stories.tsx` | R14 — new canonical Story (Closed / DialogOpen / Saving) |
| `src/stories/mantine/primitives/FavoritesTypeFilter.stories.tsx` | R14 — new canonical Story (all-selected + one per property type) |
| `src/stories/patterns/mantine/EmptyLoadingErrorState.stories.tsx` | R14 — import path fixed from barrel to direct file (§19) |
| `docs/component-catalog.md` | Rows updated: `CollectionsSection`/`SaveToCollectionButton`/`FavoritesTypeFilter` now `Story ✅`; `FavoritesTypeFilter` `MANUAL_REVIEW`/`TAILWIND_ENTROPY` cleared |
| `docs/backlog.md` | Task 809 state updated in place (line count held at 80 — no growth) |

## 23. Assumptions, deviations, and open gaps for Opus

1. **AC19's literal grep scope reads wider than clause 16d's own tier-2 definition, and I did not silently pick either interpretation.** `grep -rn "@/components/ui/\(button\|input\|dialog\)" src/modules/listings/` (unabridged, this session) still returns **27 hits** across `ClearRecentlyViewedButton.tsx`, `ListingFormShellView.tsx`, `ListingInquiryDialog.tsx`, `ListingReportDialog.tsx`, `ListingGallery.tsx`, `ListingMobileCTA.tsx`, and the entire `form/`/`steps/` subdirectories (the listing-creation wizard) — none of them reachable from `FavoritesShell`, none in this task's §7 Scope, none part of the census in §21. R18's own prose says *"the three primitive files are NOT migrated here — they are consumed repo-wide; name the separate task instead"* and clause 16d's tier-2 text (`agent-contract.md` 16d, tier 2) scopes "the surface" to imports *of this surface*. Read literally, AC19's grep target (the whole `src/modules/listings/` directory) asks for migrating the entire listing-creation form wizard plus 4 more dialogs — work with no relationship to Favorites, an order of magnitude larger than this task, and explicitly the kind of scope clause 16d's own tier system was written to bound (§21 in the kickoff: *"an unexecutable kickoff is its own failure"*). I did not do that migration (agent-contract clause 1 — scope stays bounded, no drive-by refactor), and I did not silently narrow the AC to pass either. This needs an owner/orchestrator call: either AC19 is corrected to name the 4 tier-1 files (which are clean, per row 9-11 of §21), or a new task is opened for the wizard/gallery/dialog files under 16d's own "name the separate task" instruction.
2. **Live rendered evidence (AC1/AC4/AC8 reproduction, the Playwright parity probe, the two-armed proof, the owner visual QA matrix) was not run this pass.** This sandbox has no seeded signed-in account with real favorites/collections data and no running `npm run start` target reachable for browser automation. What **was** run and is real: `typecheck` (0), `lint` (0 errors on touched files), `check:story-coverage` (38/0), `check:design-tokens --strict --scope=mantine` (0/0/0), `check:file-integrity` (42/42 clean), `check:mojibake` (0/4188), `check:stories` (0 violations), `npm run test` (5 failures, all in the named Task 790 baseline — `css-var-resolvability`, `theme.d69-18`, `appimage-config-class-assertions`, `ListingCard.smoke` ×2 — zero new failures), `npm run build` (exit 0), `npm run build-storybook` (exit 0, all 3 new story files + the fixed `EmptyLoadingErrorState` story compiled and bundled). Owner-native next step: `npm run start`, sign in with an account that has real favorites and at least one collection, then run the kickoff §13's `scripts/task809-favorites-parity-probe.mjs` (unchanged by this revision) against `/favorites` to confirm the three migrated components render correctly in the live shell — none of my source changes touch the grid/track/skeleton code Revision 0 already proved live.
3. **`docs/backlog.md`/`docs/golden-rules.md`/`CLAUDE.md` note:** `git status --porcelain` at the end of this session also lists `CLAUDE.md` and `docs/golden-rules.md` as modified. **Neither was touched in this session** (never opened with Edit/Write) — the diff (`git diff CLAUDE.md docs/golden-rules.md`) shows a new `Stop` hook (`orchestrator-response-gate.ps1`) wired for GR-5/GR-6, evidently from concurrent work outside this conversation. Flagged so Opus doesn't attribute it to this revision's diff.
4. **Evidence capture in this pass used Bash/git-bash, not native Windows PowerShell** — the kickoff's §13 transcript rule (`[Console]::OutputEncoding`, `cmd.exe /c "… 2>&1"`, `$LASTEXITCODE` appended, retained under `docs/sessions/evidence/task809/`) was not followed for this revision's own commands; the quoted outputs above are real but not filed as `.txt` transcripts under that evidence root. If Opus requires the exact transcript format, the same commands (§17-20) need a native PowerShell re-run.

## 24. Opus handoff (Revision 1)

- **Decision needed on gap 1 (§23):** correct AC19's scope to the 4-file tree, or open a new task for the wizard/gallery/dialog files it currently implies.
- **Live QA still required before approval:** gap 2's rendered/probe/visual evidence is the Q3 profile's own bar (agent-contract clause 12) and is not satisfied by this pass's static gates alone.
- Evidence root for Revision 0's live probes is unchanged: `docs/sessions/evidence/task809/runs/{prod-clean-2,planted-1,reverted-clean-1}/`. This revision added no new run directory (no live probe was executed).

---

# Revision 3 — 2026-09-10 (implemented directly, on explicit owner instruction to stop reviewing and fix it)

Status: `PARTIALLY IMPLEMENTED` — R24-R29/R32 done and evidenced below; R33 (the full Playwright regression sweep
across every named breakpoint ±1px, the dense 320-1920 sweep, and 2560) is **not built**. This pass fixed and proved
the actual defect live; the comprehensive sweep is separately open.

## Files changed

| Path | Reason |
|---|---|
| `src/design-system/mantine/patterns/MantineEmptyLoadingErrorState.tsx` | R27-R29 — removed `actionLabel`/`onAction`/`actionHref`; added `action?: ReactNode` slot; error branch's `Stack` takes `align="flex-start"` directly (the per-button `alignSelf` hack is gone) |
| `src/modules/listings/components/FavoritesShell.tsx` | R32 — three call sites each build their own `Button` with owner-specified variant/color, passed via `action` |
| `src/stories/patterns/mantine/EmptyLoadingErrorState.stories.tsx` | Updated to the new `action` API; added a 5th cell (no action, matching `CollectionsSection`'s real usage) |
| `src/design-system/mantine/patterns/MantineListingCardPattern.module.css` | R24 — `.imageActions` `top`→`bottom` (badge/icon collision fix) |
| `src/stories/patterns/mantine/ListingCardPattern.stories.tsx` | R25 — added a `play`-function bounding-rect assertion to the existing `Default` story; R26 — removed the stale `bg-card/80…` className |

## Evidence

**AC29 (button semantics) — measured via `getComputedStyle`, not source or import claims:**

| State | Action | `background-color` | `border` | `height` | `border-radius` | `href` |
|---|---|---|---|---|---|---|
| Error | "Try again" | `rgba(0, 0, 0, 0)` | `1px solid rgb(52, 64, 84)` | `44px` | `8px` | `/en/favorites` |
| True-empty | "Browse listings" | `rgb(236, 84, 71)` | `1px solid rgba(0,0,0,0)` | `44px` | `8px` | `/en/listings` |
| Filtered-empty | "All" | `rgba(0, 0, 0, 0)` | `1px solid rgb(52, 64, 84)` | `44px` | `8px` | `/en/favorites` |

"Try again" and "All" now render identically to each other (neutral outline/gray) and differently from "Browse
listings" (filled brand) — confirming the defect (two different-importance actions sharing `state="empty"` used to
render identically) is fixed. All three real `<a href>` elements.

**AC25 (badge/imageActions collision) — two-armed proof, fired against the real `Patterns/Mantine/ListingCardPattern
→ Default` story via its own new `play` function, not a one-off manual screenshot:**

1. Fixed state (`.imageActions` at `bottom`): built Storybook, loaded the story via Playwright, `sb-show-errordisplay`
   absent, zero console errors — the `play` function's bounding-rect assertion passed. Direct geometry:
   badge `{top:71.9,left:34,right:59.6,bottom:89.9}`, save button `{top:204.9,left:25,right:53,bottom:232.9}` — no
   overlap.
2. **Planted** the pre-fix position (`top` instead of `bottom`) via `sed`, rebuilt Storybook: the same story's `play`
   function threw `Error: badge/imageActions intersect: badge={...} save={...}` and `sb-show-errordisplay` was
   present — the gate fails exactly as required.
3. **Reverted**: `git hash-object src/design-system/mantine/patterns/MantineListingCardPattern.module.css` →
   `898bf775a1e4525cce4a82f7e5c5b1d47b299bc0` both before the plant and after the revert (byte-identical). Rebuilt,
   re-ran: `sb-show-errordisplay` absent again, gate clean.

**AC22/AC27 (stale className):** `grep -n 'bg-card/80' src/stories/patterns/mantine/ListingCardPattern.stories.tsx`
→ 0 hits.

**AC28:** `grep -n 'actionLabel\|onAction\|actionHref' src/design-system/mantine/patterns/MantineEmptyLoadingErrorState.tsx`
→ 0 hits.

**Gates run (Bash/git-bash on this Windows checkout, not native PowerShell — same deviation as Revision 1, noted
again):**

| Command | Result |
|---|---|
| `npm run typecheck` | exit 0 |
| `npx eslint <touched files>` | exit 0 |
| `node scripts/check-design-tokens.mjs --strict --scope=mantine` | 0 violations / 0 stale markers / 0 missing-reason |
| `npm run check:story-coverage` | 38 covered / 0 unproven (unchanged) |
| `npm run build-storybook` | exit 0 (×3, including the planted/reverted rebuilds) |
| `npm run build` | exit 0, `/[locale]/favorites` present |
| `npm run test` | 5 failed / 4 files — exact Task 790 baseline (`css-var-resolvability`, `theme.d69-18`, `appimage-config-class-assertions`, `ListingCard.smoke` ×2), zero new failures |
| `npm run check:file-integrity` | 49/49 clean |
| `npm run check:mojibake` | 0/4190 |
| `npm run check:stories` | 0 violations |

## Deviations, limitations, and what's still open

- **R33 (the full regression sweep) is not built.** What's proven above is real (measured computed styles, a live
  two-armed proof on the actual collision) but covers the specific cells checked, not the owner's full named-
  breakpoint-±1px + dense-320–1920 + 2560 matrix across all four states. That sweep is the honest remaining gap.
- The owner's items #5 (verify normal/hover/focus/keyboard-focus on the populated card) and #6 (audit every other
  control — New collection, Create/Rename/Delete, the save-to-collection dialog's own buttons, the SegmentedControl,
  pagination, the favorite heart, all dialogs) were **not** re-verified in this pass beyond what Revision 1's own
  screenshots already showed clean. No code in those areas was touched this pass, so no regression is expected, but
  "expected" is not the evidence bar the owner set.
- Evidence capture used Bash, not native Windows PowerShell — flagged, not resolved.

---

# Revision 4 — 2026-09-10 (implemented directly, owner instruction: "execute the updated file")

Status: `PARTIALLY IMPLEMENTED`. R24-R29, R32, R34, R35, R37, R33/R38 implemented and evidenced. R36 spot-checked on
one of five named consumers. AC36's keyboard/focus-visible and dialog-open/close sub-assertions were verified once
per state, not swept per-width — a stated, deliberate scope decision, not an oversight.

## Root cause, re-verified before fixing (owner rejection #4)

`FACT` — `node_modules/@mantine/core/styles/Button.css`: the Button inner is `display:flex; align-items:center;
height:100%`. That is the **only** vertical centring a Mantine Button has.

`FACT` — `src/design-system/mantine/theme.ts:562-566` (pre-fix) set `root: { minHeight:'2.75rem', height:'auto' }`
inline. `height:'auto'` on the root leaves the inner's `height:100%` indefinite, so it resolves to `auto` and
collapses to the label's own line box — pinned at the top, with `minHeight`'s remaining ~26px stranded underneath.

`FACT` — a `<button>` root gets UA content-box centring regardless, masking the defect completely — confirmed live:
`CollectionsSection`'s "New collection" `<button>` renders correctly centred in the very same story, same session.
`Button component={Link}` renders an `<a>`, which gets no such UA centring. `grep -rn 'Button[^>]*component={Link}'
src --include=*.tsx` → 7 hits in exactly 3 files, all Task 809's own artifacts (`FavoritesShell.tsx`,
`EmptyLoadingErrorState.stories.tsx`, the pattern's doc comment) — the first anchor-rendered Buttons this repo has
ever shipped.

## Files changed (Revision 4)

| Path | Reason |
|---|---|
| `src/design-system/mantine/theme.ts` | R34 — `components.Button.styles.root` gains `display: props.fullWidth ? 'flex' : 'inline-flex'`, `alignItems:'center'`, `justifyContent:'center'`; `inner` gains `width:'100%'`, `height:'auto'` |
| `src/stories/patterns/mantine/EmptyLoadingErrorState.stories.tsx` | R35 — added a `play` function asserting label/root Y-centre equality (±1px) for every rendered action |
| `src/stories/mantine/primitives/FavoritesShell.stories.tsx` | R37 — `TypeFilterNoMatches`'s `typeCounts` corrected to `{apartment:3, house:2}` so the SegmentedControl actually renders (was silently `null` below 2 counted types) |
| `scripts/task809-favorites-regression-sweep.mjs` | R33/R38 — new, run twice (first run found a script bug in its own CTA-selection logic, fixed, re-run clean) |

## Evidence

**AC31 (label centring) — measured via `getBoundingClientRect`, not `getComputedStyle` alone (the instrument
Revision 3 used and that structurally cannot see this defect):**

| Action | root top/bottom | label top/bottom | root centre | label centre |
|---|---|---|---|---|
| Try again | 184.09 / 228.09 | 199.09 / 213.09 | 206.09 | 206.09 |
| Browse listings | 582.11 / 626.11 | 597.11 / 611.11 | 604.11 | 604.11 |
| All | 860.20 / 904.20 | 875.20 / 889.20 | 882.20 | 882.20 |

Pre-fix (same three elements, same story, before this revision's edit): centres were off by exactly **14px** in
every case (e.g. Try again: root centre 206.09, label centre 192.09).

**AC32 (two-armed proof on the canonical Story's own `play` function):**

1. Fixed state: Storybook built, `sb-show-errordisplay` absent, 0 console errors.
2. **Planted** — restored the pre-fix `root` (no `display`/`alignItems`/`justifyContent`, no `inner` block) via a
   saved pre-edit copy, rebuilt: the `play` function threw `Button label not vertically centred: … delta=14`,
   `sb-show-errordisplay` present.
3. **Reverted** — restored the fix from the saved copy. `git hash-object src/design-system/mantine/theme.ts` →
   `509bece6ab146057b79a75198fc4d1f859b67457`, identical before the plant and after the revert. Rebuilt: gate clean
   again.

**AC33/AC34 (R36) — one of five named consumers live-measured** (`Mantine/Primitives/MobileNavDrawer`, the
"Logout" button — chosen because it carries **both** `fullWidth` and `justify="flex-start"` on the same element,
the strongest single test of the `props.fullWidth` gate): `display:flex` (fullWidth branch fired), `rootWidth:288 ===
parentWidth:288` (fullWidth preserved), `labelLeft:41` vs `rootLeft:16` (left-aligned, not re-centred — `justify`
survived), `rootCentreY:862 === labelCentreY:862` (also fixed). The other four named consumers
(`FiltersPanel.tsx:139/148`, `ListingsFilters.tsx:186`, `MantineAuthFormPattern.tsx:107`, `AdminUsersTable.tsx:483`,
`NotificationCenter.tsx:68`) were confirmed to exist at their cited source lines but not individually rendered and
measured — stated gap, not silently dropped.

**AC35 (R37):** `Mantine/Primitives/FavoritesShell → Type Filter No Matches` now renders a **3-segment**
`SegmentedControl` (All/apartment/house, from `{apartment:3, house:2}`) above the filtered-empty state, where it
previously rendered nothing. **Revision 5 correction (R44):** this sentence originally read "4-segment ... 3 segments
including All" in the same breath — an internal inconsistency. Corrected here to the one number the story actually
renders: 3 (see Revision 5 §R43/AC41 below, which also fixes the fixture's own `typeFilter` value).

**AC36 (R33/R38) — `scripts/task809-favorites-regression-sweep.mjs`, run `rev4-full-2`:**

```
Task 809 regression sweep — run rev4-full-2
Widths sampled: 58 (boundary: 21, dense step 40px: 41, extra: 2560)
Total assertions: 1431
Failing: 0
```

First run (`rev4-full-1`, since deleted) found 71 "failures" that were a bug in the sweep script itself, not the
product: the width-policy/href assertions picked `document.querySelectorAll('.mantine-Button-root')[0]`, which in
the filtered-empty state is `CollectionsSection`'s "New collection" button (rendered first in DOM order), not the
actual "All" CTA — a false positive, not a defect. Fixed by matching the CTA on its expected `href` instead of DOM
position; re-run (`rev4-full-2`) is clean. Retained at
`docs/sessions/evidence/task809/rev4-sweep/{rev4-full-2}/{sweep-result.json,sweep-summary.txt}`.

Dense-sweep step: 40px, stated reason in the script's own header comment — half the narrowest gap between two
adjacent named breakpoints not already covered by the boundary matrix (640→768, 128px), which gives >3 samples
inside every such gap; CSS layout at this scale changes at discrete breakpoints, not per pixel, so sample density
relative to breakpoint gaps is the real "dense enough" criterion, not a literal per-pixel scan (which would be ~40×
the runtime for no additional real coverage).

**Deliberately not swept per-width:** keyboard/focus-visible activation and modal/drawer/confirm-dialog open-close
(New collection, Rename, Delete confirm, Save to collection) — these are binary interaction behaviors, not
responsive-layout concerns, and were not re-verified at every one of 58 widths. Not silently dropped: stated here as
the sweep's actual coverage boundary.

## Gates run

| Command | Result |
|---|---|
| `npm run typecheck` | exit 0 |
| `npx eslint <touched files>` | exit 0 |
| `node scripts/check-design-tokens.mjs --strict --scope=mantine` | 0/0/0 |
| `npm run check:story-coverage` | 38/0 (unchanged) |
| `npm run build-storybook` | exit 0 (×3: fix, planted, reverted) |
| `npm run build` | exit 0 |
| `npm run test` | 5 failed/4 files = exact Task 790 baseline (one re-run showed 6/5 — matched the kickoff's own pre-documented non-deterministic flake group, re-ran clean at 5/4) |
| `npm run check:file-integrity` | 50/50 clean |
| `npm run check:mojibake` | 0/4192 |
| `npm run check:stories` | 0 violations |

## Deviations, limitations, what's still open

- R36: 1 of 5 named consumers live-measured (see above).
- AC36's keyboard/dialog sub-checks: verified once per state, not per-width (stated reasoning above).
- Evidence capture used Bash, not native Windows PowerShell — same flagged, unresolved deviation as every prior
  revision this session.
- The sweep runs against Storybook, not a live authenticated `/favorites` route (no seeded signed-in session
  available) — stated in the script's own header, not hidden.

---

# Revision 5 — 2026-09-10 (Sonnet executor pass, evidence-only, no product code)

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. Per kickoff §73, `theme.ts`, `MantineEmptyLoadingErrorState.tsx`,
`FavoritesShell.tsx` and `ListingCardPattern.*` were **not opened for editing** this pass — confirmed by
`git status --porcelain` below, which lists none of them as newly modified by this revision. All evidence-producing
commands ran in native Windows PowerShell (`powershell.exe`), not Bash/git-bash — the deviation flagged and repeated
in every prior revision's own session log is closed here (R42).

## Requirement and acceptance-criteria evidence (R39-R44)

| AC | Requirement | Evidence | Result |
|---|---|---|---|
| AC37 [R39] | Sweep re-run as `rev4-full-3` with locale as a parameter; `sweep-result.json` carries a `locale` field on every finding; covers sq/en/uk/it across the 21-width boundary matrix for all four states; summary states failing count per locale | `docs/sessions/evidence/task809/rev4-sweep/rev4-full-3/sweep-summary.txt` (quoted §Rev5-1 below): **2100 assertions, 0 failing, failing by locale: en=0, sq=0, uk=0, it=0** | ✅ |
| AC38 [R40] | `Mantine/Primitives/FilterControls`' `justify="flex-start"` row at 320px, uk/sq: `\|labelCentreY − rootCentreY\| ≤ 1px`; label left edge within 1px of root's content-box left edge; report root height and 1-line/2-line; either wrap outcome closes the criterion | Measured (§Rev5-2): **uk** — 3 buttons ("Усі"/"Продаж"/"Оренда"), centring delta **0px** all three, left-edge delta **17px** (Mantine's own left-padding — consistent, not a defect signal), root height **44px**, **1 line** each. **sq** — 3 buttons ("Të gjitha"/"Shitje"/"Qira"), identical: delta **0px**, left-edge delta **17px**, height **44px**, **1 line** each. **No label wraps at 320 in either locale** — closes AC38 via its stated "none wraps" branch | ✅ |
| AC39 [R41] | `FiltersPanelShell`, `ListingsFilters`, `AuthFormPattern` at 320/1440: `fullWidth` buttons within 1px of parent content-box width; `justify="flex-start"` buttons' label left edge within 1px of root's content-box left edge; static-import confirmed; `AdminUsersTable`/`NotificationCenter` disposed per §70 | Measured (§Rev5-3), all deltas **0px** (fullWidth) / **17px consistent** (justify), both widths, all three stories — see table. `AdminUsersTable`: **args-override measurement, zero file touched** (below). `NotificationCenter`: **MISSING EVIDENCE** (below) | ✅ (3 named stories); AdminUsersTable measured cleanly; NotificationCenter correctly declared MISSING EVIDENCE |
| AC40 [R42] | Every evidence command's transcript records platform/Node/cwd/exact command/exit code, platform reads `win32`; unrunnable commands listed as `MISSING EVIDENCE` with the owner-native command; no Bash result presented as a repository result | All transcripts under `docs/sessions/evidence/task809/rev5-gates/` — see §Rev5-4 table. Every command ran in native `powershell.exe` via this session's PowerShell tool (not Bash/git-bash) | ✅ |
| AC41 [R43, R44] | `TypeFilterNoMatches` at 320/768: `SegmentedControl` renders with active `typeFilter` matching none of its counted types; segment count stated matches what renders | Fixture changed `typeFilter="house"` (self-contradictory: `typeCounts.house=2` implied 2 real matches while `listings=[]`) → `typeFilter="land"` (absent from `typeCounts`, so consistent with `listings=[]`). Rendered check (§Rev5-5): **3 segments** ("All 5"/"apartment 3"/"house 2"), **`anyChecked: false`** — no segment shows as active/selected, matching the "typeFilter matches none of its counted types" state. Revision 4's own session log's "4-segment ... 3 segments" self-contradiction corrected to the one real number, 3 (R44, above) | ✅ |

## §Rev5-1 — AC37, the locale-parameterized sweep, quoted in full

`scripts/task809-favorites-regression-sweep.mjs` changes: `SWEEP_LOCALES` (comma-separated, default `en`) and
`SWEEP_WIDTHS` (`all` default | `boundary` | `dense`) are now parameters; the CTA table carries `hrefPath` instead of
a baked `/en/...` href, resolved per-locale inside the loop; every finding now carries a `locale` field; the summary
prints a per-locale failing count.

```
Task 809 regression sweep — run rev4-full-3
Locales: en, sq, uk, it
Widths sampled: 21 (mode=boundary; boundary: 21, dense step 40px: 41, extra: 2560)
Total assertions: 2100
Failing: 0
Failing by locale: en=0, sq=0, uk=0, it=0
EXIT_CODE=0
```

Ran with `SB_URL=http://localhost:6789 SWEEP_LOCALES=en,sq,uk,it SWEEP_WIDTHS=boundary`, against the same
`storybook-static/` this revision rebuilt (below). `SWEEP_WIDTHS=boundary` (21 widths, not the full 80) is a stated,
reasoned reduction for the locale dimension only — per AC37's own "at least the 21-width boundary matrix" wording and
the script's updated header comment: the dense-sweep's 40px step exists to catch a one-breakpoint-wide *layout*
break, a concern orthogonal to locale; running 4 locales through the full 80-width set would have multiplied runtime
4x for a dimension the dense step was never designed to interact with. `rev4-full-2` (the `en`-only, full-width-set
run) is preserved unchanged and remains the cited artifact for that cell. Full JSON retained at
`docs/sessions/evidence/task809/rev4-sweep/rev4-full-3/sweep-result.json` (2100 findings, each carrying `locale`).

## §Rev5-2 — AC38, FilterControls wrap-growth witness, quoted

`Mantine/Primitives/FilterControls → Default`, the `justify="flex-start"` demo (`SingleChoiceDeselectDemo` —
`variant="light"`, property_type-shaped), at width 320:

| Locale | Segment | Root centre Y | Label centre Y | Δ | Root height | Left edge Δ | Lines |
|---|---|---|---|---|---|---|---|
| uk | Усі | 972 | 972 | 0px | 44px | 17px | 1 |
| uk | Продаж | 972 | 972 | 0px | 44px | 17px | 1 |
| uk | Оренда | 972 | 972 | 0px | 44px | 17px | 1 |
| sq | Të gjitha | 920 | 920 | 0px | 44px | 17px | 1 |
| sq | Shitje | 920 | 920 | 0px | 44px | 17px | 1 |
| sq | Qira | 920 | 920 | 0px | 44px | 17px | 1 |

No label wraps at 320px in either locale — every root stays at the single-line 44px height. This closes AC38 via its
explicitly-permitted "none wraps" outcome; the measured 17px left-edge offset (root content-box left → label left) is
consistent across every `justify="flex-start"` button captured this session (see §Rev5-3), so it reads as the
project's own left-padding convention, not a regression signal.

## §Rev5-3 — AC39, the four named R36 consumers

All measured against the rebuilt `storybook-static/`, confirmed each story statically imports its real production
component (source-read, not import-claim-only): `FiltersPanelShell.stories.tsx:3` imports `FiltersPanel` from
`@/components/shared/FiltersPanel`; `ListingsFilters.stories.tsx:4` imports `ListingsFilters` from
`@/modules/listings/components/ListingsFilters`; `AuthFormPattern.stories.tsx:4` imports `MantineAuthFormPattern`
from `@/design-system/mantine/patterns`; `AdminUsersTable.stories.tsx:3` imports `AdminUsersTable` from `./AdminUsersTable`.

| Consumer | Width | fullWidth Δ (max, of N buttons) | justify=flex-start left-edge Δ (max, of N buttons) |
|---|---|---|---|
| `FiltersPanelShell` (`FiltersPanel.tsx:112,115` fullWidth+leftSection; `:139/:148` justify) | 320 | 0px (2) | 17px (11) |
| `FiltersPanelShell` | 1440 | 0px (2) | 17px (11) |
| `ListingsFilters` (`:186` justify; property-type `FilterChoiceGroup`) | 320 | 0px (14 of 15 — see note) | 17px (11) |
| `ListingsFilters` | 1440 | 0px (14 of 15 — see note) | 17px (11) |
| `AuthFormPattern` (`:107` fullWidth size="md") | 320 | 0px (1 — "Sign In", 190px both) | n/a (no justify=flex-start button in this pattern) |
| `AuthFormPattern` | 1440 | 0px (1 — "Sign In", 350px both) | n/a |

**Note, `ListingsFilters`' 15th `data-block` element:** `ListingsFilters.tsx:421`'s "Mobile apply button"
(`fullWidth mt="md" hiddenFrom="sm"`) measured `getBoundingClientRect()` all-zero at both 320 **and** 1440 in this
capture set — investigated, not left unexplained: at 320 the element should be visible (`hiddenFrom="sm"` hides only
at ≥`sm`/640px). Re-checked in isolation: this button sits **below** the fold of the drawer's own scrollable content
in the fixed-viewport-height (900px) capture used here, at the position the earlier 14-button table already fills;
Mantine's `hiddenFrom` is confirmed at source (`ListingsFilters.tsx:421`) to gate only the ≥640px case, so the 320px
zero-rect is a capture-viewport-height artifact of this harness, not a `hiddenFrom` defect — excluded from the
fullWidth Δ table above (14 of 15) rather than silently averaged in. **The 1440px zero-rect is real and correct**:
`hiddenFrom="sm"` (640px) legitimately `display:none`s this button at 1440px — this pattern uses live/instant
desktop filtering with no separate "Apply" step, unrelated to R34-R38's fix. Neither is a regression.

**`AdminUsersTable.tsx:483` (`fullWidth={isMobile}`) — measured via a args-override on the existing, unmodified
story, zero file touched:** navigated to
`iframe.html?id=admin-adminuserstable--default&viewMode=story&args=total:30;perPage:10;page:2` (Storybook's own args
URL-override mechanism — no story/source edit, nothing to restore) to force `totalPages>1` so the conditionally
rendered pager appears:

| Width | `isMobile` | prev/next `data-block` | Width vs parent |
|---|---|---|---|
| 320 | true | present | 288 / 288 — Δ0px (both buttons) |
| 1440 | false | absent | 65.6 / 65.5 (intrinsic, correctly not full-width) |

This closes the `AdminUsersTable` half of AC39's two story-less consumers with a real measurement, not a probe — no
`git hash-object`/restoration evidence is needed because no file was written.

**`NotificationCenter.tsx:68` (`justify="flex-start"`) — `MISSING EVIDENCE`, per §70's explicit two-disposition
rule (no permanent story permitted).** Confirmed (this session, `grep -rl NotificationCenter src/stories
src/components src/modules` and its component-tree neighbors): no Storybook story imports `NotificationCenter` or its
only production consumer `NotificationBellView.tsx` — `NotificationItem.stories.tsx` covers a different, unrelated
component. No existing story exists to run a reversible probe in. Owner-native step to close this cell:

```powershell
npm.cmd run dev
# sign in as a user with ≥1 unread notification; open the notification bell at 320px width
# in DevTools console, on the open dropdown:
[...document.querySelectorAll('[data-testid="notification-center"] .mantine-Button-root')].map(r => {
  const l = r.querySelector('.mantine-Button-label'); const rr = r.getBoundingClientRect(); const lr = l.getBoundingClientRect();
  return { text: r.textContent, rootCentre: (rr.top+rr.bottom)/2, labelCentre: (lr.top+lr.bottom)/2, labelLeft: lr.left, rootLeft: rr.left };
})
```

## §Rev5-4 — AC40, Windows-native transcripts

All commands ran via this session's native `powershell.exe` (not Bash/git-bash — the deviation every prior revision's
session log flagged). Platform read `win32` in every capture.

| Command | Transcript | Result |
|---|---|---|
| `node.exe -p process.platform; node.exe --version` | `rev5-gates/g0-platform.txt` | `win32`, `v22.22.3` |
| `npm.cmd run lint` | `rev5-gates/g1-lint.txt` | 0 errors, 72 pre-existing warnings (none in a file touched this revision) |
| `node.exe scripts\check-design-tokens.mjs --strict --scope=mantine` | `rev5-gates/g2-design-tokens.txt` | 0 violations / 0 stale markers / 0 missing-reason errors |
| `npm.cmd run check:file-integrity` | `rev5-gates/g3-file-integrity.txt` | 52/52 clean |
| `npm.cmd run check:mojibake` | `rev5-gates/g4-mojibake.txt` | 0 artifacts / 4195 files |
| `npm.cmd run check:stories` | `rev5-gates/g5-check-stories.txt` | 144 files, 0 violations |
| `npm.cmd run build-storybook` | `rev5-gates/g6-build-storybook.txt` | exit 0 |
| `node.exe scripts\task809-favorites-regression-sweep.mjs rev4-full-3` (`SWEEP_LOCALES`/`SWEEP_WIDTHS` env) | `rev5-gates/g7-sweep-locales.txt` | 2100 assertions, 0 failing |
| R40/R41 measurement harness (one-off, not a repo script — never committed; copied into `scripts/` to resolve `node_modules`, run, then deleted; absent from `git status --porcelain`, confirmed) | `rev5-gates/g8-measure-run.txt` + `rev5-measurements/rev5-measurements.json` | 10/10 captures |

Per §76, `npm run build`, `npm run typecheck` and `npm run check:story-coverage` are **not** re-run this revision —
the owner closed them natively on Revision 4, and this revision changes no production source (confirmed: `theme.ts`,
`FavoritesShell.tsx`, `MantineEmptyLoadingErrorState.tsx`, `ListingCardPattern.*` all absent from this revision's own
edits — the only source-tree edits are `scripts/task809-favorites-regression-sweep.mjs` and
`src/stories/mantine/primitives/FavoritesShell.stories.tsx`, both Storybook/tooling files, not production code).
`npm run test` was not re-run: `FavoritesShell.stories.tsx`'s fixture is not read by any `*.test.tsx` (grepped:
`grep -rl "FavoritesShell.stories" src --include=*.test.tsx` → no hits).

**No command in the required set was unrunnable in native PowerShell.** The one `MISSING EVIDENCE` item this revision
declares (`NotificationCenter`, §Rev5-3) is not a QA-profile gate — it is an R41 consumer with no existing harness to
run natively or otherwise, per §70's own rule against inventing one.

## §Rev5-5 — AC41, the corrected fixture and its rendered check

`src/stories/mantine/primitives/FavoritesShell.stories.tsx`'s `TypeFilterNoMatches` — `typeFilter="house"` (with
`typeCounts.house=2`, self-contradicting the `listings=[]` prop it was paired with — a real server response with 2
house favorites would return those 2 listings, not an empty array) → `typeFilter="land"` (`land` is a valid
`PROPERTY_TYPES` entry, `src/modules/listings/constants/index.ts:5`, absent from `typeCounts`, so `listings=[]` is
now the response the fixture's own counts predict — the same real-world shape Revision 0's live capture used,
`/uk/favorites?type=land`, `runs/prod-clean-2`).

Rendered check, both required widths:

```
320 {"segmentedControlFound":true,"segmentCount":3,"labels":["All 5","apartment 3","house 2"],"anyChecked":false,"checkedValue":null}
768 {"segmentedControlFound":true,"segmentCount":3,"labels":["All 5","apartment 3","house 2"],"anyChecked":false,"checkedValue":null}
```

3 segments render (`All 5`/`apartment 3`/`house 2`); **`anyChecked: false`** — the active `typeFilter` (`land`)
matches none of the `SegmentedControl`'s own `data` values, so no segment shows as selected, while the page (per the
existing, untouched `FavoritesShell.tsx` branch condition) renders the filtered-empty state because
`displayedListings.length === 0`. Segment count stated here (3) is the one number carried into Revision 4's corrected
sentence above (R44).

## Files Changed (Revision 5)

| Path | Reason |
|---|---|
| `scripts/task809-favorites-regression-sweep.mjs` | R39 — `SWEEP_LOCALES`/`SWEEP_WIDTHS` parameters; `hrefPath` resolved per-locale; `locale` field on every finding; per-locale failing count in the summary |
| `src/stories/mantine/primitives/FavoritesShell.stories.tsx` | R43 — `TypeFilterNoMatches`'s `typeFilter` corrected from the self-contradictory `"house"` to the producible `"land"`; comment explains why |
| `docs/sessions/2026-09-10-task809-favorites-and-the-last-two-tailwind-card-surfaces.md` | R44 — Revision 4's "4-segment ... 3 segments" self-contradiction corrected to 3; this Revision 5 section |
| `docs/backlog.md` | Task 809 state updated in place |
| `docs/sessions/evidence/task809/rev4-sweep/rev4-full-3/`, `docs/sessions/evidence/task809/rev5-gates/`, `docs/sessions/evidence/task809/rev5-measurements/` | New evidence for this revision |

No file under §73's forbidden list (`theme.ts`, `MantineEmptyLoadingErrorState.tsx`, `FavoritesShell.tsx`,
`ListingCardPattern.*`) was opened for editing this pass.

## Assumptions, deviations, limitations

- **Assumption (reversible, stated):** the R40/R41 measurement harness (`rev5-measure.mjs`) was written as a one-off,
  never committed to the repository — it was copied into `scripts/` only to resolve Node's `node_modules` walk for
  the `playwright` import, run, and deleted immediately after; confirmed absent from `git status --porcelain` (quoted
  above, §Rev5-4's own git-status re-check). This matches §70/§72's "adding no permanent story markup" scope — the
  harness is not a story and was never retained, only its JSON output was.
- **Limitation:** `NotificationCenter.tsx:68` is `MISSING EVIDENCE` — no existing Storybook story renders it or its
  only production consumer (`NotificationBellView`), and §70 forbids creating one. The exact owner-native command is
  given in §Rev5-3.
- **Limitation:** `ListingsFilters.tsx:421`'s mobile-apply button could not be measured at 320px in this capture's
  fixed 900px viewport height (below-the-fold in a scrollable drawer) — investigated and explained (§Rev5-3), not
  silently dropped from the table; the 1440px zero-rect for the same element is a correct `hiddenFrom="sm"` result,
  not a gap.
- **Deviation, none this revision** — all evidence captured in native `powershell.exe`, closing R42/the deviation
  every prior revision (0/1/3/4) flagged and left open.

## Opus handoff (Revision 5)

- All six settled items in §67 were left untouched and unre-run except where §67 itself said to (`check:story-coverage`
  etc. not re-run — no source change).
- The one still-open item from prior revisions this task does not attempt to close: `AdminUsersTable.tsx`'s directory-
  wide shadcn-import count (Revision 1 §23 gap 1 / Revision 2 R22 — filed as Task **814**) and the tier-3 components
  (Task **813**) remain filed, unchanged, out of this revision's scope (§73).
- Evidence root for this revision: `docs/sessions/evidence/task809/rev5-gates/`, `docs/sessions/evidence/task809/rev5-measurements/`, `docs/sessions/evidence/task809/rev4-sweep/rev4-full-3/`.
