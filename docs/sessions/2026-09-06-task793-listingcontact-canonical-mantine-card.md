# Session Archive: Task 793 — ListingContact Canonical Mantine Card — 2026-09-06

**Task path:** `tasks/Sprints/Sprint_71_kickoff_prompt_Task_793_ListingContact_Canonical_Mantine_Card.md`
**Status:** `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW` (Revision 1 — resolves kickoff §16.2/§17's F1-F4 and P3)
**QA profile:** Q3 · **Platform:** win32 · **Node:** v22.22.3 · **Node/cwd:** repo root, `node`/`npm.cmd`/`npx.cmd` on PATH (see command transcripts)

No self-approval performed. No mutating git run, emitted, or suggested.

---

## REVISION 1 — 2026-09-06, resolving kickoff §16.2 F1 and §17.5's F2/F3/F4/P3

The original submission above (§1-§9) was returned `NEEDS REVISION`. This section is the additive evidence for the
five findings; §1-§9 above are unchanged and still describe the base implementation.

### R1. Requirement/finding evidence

| Finding | Resolution | Where | Result |
|---|---|---|---|
| **F1** — `contactDisabled`/`closedListing`/archived have no story proof | Added two sections to `Patterns/Mantine/ListingContactPattern` (`contactDisabled`, `closedListing`) and one new export `ArchivedListing` to `Patterns/Mantine/ListingDetailView` | `ListingContactPattern.stories.tsx`, `ListingDetailView.stories.tsx` | ✅ — self-verified rendered (see R3) |
| **F2** — sold/rented must also disable Call/WhatsApp/Send-message | `contactLifecycleDisabled` extended to `listingArchived \|\| listingExpired \|\| listingClosed`; `patternState` now maps `listingClosed → 'closedListing'`; the pattern's Call/WhatsApp and Send-message rows now render for `state === 'normal' \|\| state === 'closedListing'` (composed with the headline block, not replacing it) | `ListingContact.tsx`, `MantineListingContactPattern.tsx` | ✅ — AC13 |
| **F3** — `pending`/`inactive` render a raw i18n key via a 4-member cast | Added `status_banner_pending`/`status_banner_inactive` (all 4 locales) + widened `ListingStatusBanner`'s `Props.status` to `Exclude<ListingStatus,'active'>`; replaced the cast at `ListingDetailView.tsx` with a real type predicate `isListingNonActiveStatus` (new, in `listingSemanticHelpers.ts` — `status is Exclude<ListingStatus,'active'>`) | `ListingDetailView.tsx`, `ListingStatusBanner.tsx`, `listingSemanticHelpers.ts`, `domain/index.ts`, `messages/{sq,en,uk,it}.json` | ✅ — AC14 |
| **F4** — `STYLES` unstyled for `pending`/`inactive` | Branch 2 of F3 was chosen — added both rows to `STYLES`, reusing `--status-warning` per its own doc comment ("amber — inactive, pending") | `ListingStatusBanner.tsx` | ✅ |
| **P3** — Task 612 script's mobile contact-occlusion assertion silently stops asserting once the card is in flow | Added an unconditional `dialogCoversViewport` check (same idiom as `task791-detail-evidence.mjs`'s existing compensation) to the verdict, **in addition to** the existing conditional contact-occlusion check | `scripts/task612-qa-listinggallery-lightbox-portal.mjs` | ✅ |

### R2. F3 design choice — narrowing mechanism

`isListingNonActiveStatus(status): status is Exclude<ListingStatus, 'active'>` returns `!isListingVisible(status)`.
Since `VISIBILITY_DB_STATUSES.VISIBLE = ['active']` (`listingSemanticLayer.ts:96`), this is exactly the render
condition `ListingDetailView.tsx` already used (`!isListingVisible(...)`), now expressed as a real type predicate
instead of a hand-written literal-union cast — `tsc` narrows `listing.status` from all 7 `ListingStatus` members to
the 6 the banner is now typed to accept, with no `as` anywhere in the render call. Added to the domain layer
(`listingSemanticHelpers.ts`) rather than inline, per that file's own "ALLOWED outside this domain directory" API
boundary (literal `status === 'active'` comparisons are forbidden outside `src/modules/listings/domain`).

### R3. Self-verification (implementation evidence, not owner visual QA)

Storybook does not run interactively in this shell — `storybook-static/` was rebuilt fresh (post-dates every edit
below) and served locally for a Playwright screenshot pass, scoped to only the newly-touched sections:

- `Patterns/Mantine/ListingContactPattern` (en, 1280×2400, full page): the "Archived / expired" section shows
  Call/WhatsApp/Send-message disabled with **no** headline block; the "Closed (sold/rented)" section shows the
  "This listing has been sold" headline **plus** Call/WhatsApp/Send-message all disabled — the F2 composition
  (headline + disabled controls together) renders exactly as specified. 0 console/page errors.
- `Patterns/Mantine/ListingDetailView/Archived Listing` (en, 1280×2400): the status banner renders "This listing is
  archived and no longer available." (not a raw key — confirms F3's fix holds end-to-end through the real
  `ListingDetailViewBody`); the contact card shows Call/WhatsApp/Send-message disabled; favorite/share render in the
  badges row. Two console errors observed — `MISSING_MESSAGE: listing.condition (en)` / `listing.heating (en)` —
  reproduced identically on the untouched `Public Listing` and `Staff Preview Unpublished` exports (same
  `detailAttrs` fixture, pre-existing, not introduced by this revision; out of scope, not filed by this task).

This was throwaway tooling (a local static-file server + Playwright launch script), not committed — deleted after
use. It is implementation self-check, not the owner's required visual-matrix review (§13's `OWNER VISUAL QA
REQUIRED` still stands for every listed tuple).

### R4. Validation evidence (exact commands, win32, post-dates every edit above)

```
node.exe -p process.platform                                    → win32
node.exe -v                                                      → v22.22.3
npm.cmd run typecheck                                             → exit 0
npm.cmd run lint                                                  → exit 0 (72 pre-existing warnings, 0 errors; none on any file this revision touched)
npm.cmd run check:stories                                         → PASS, 135 files, 0 violations; storybook.* key parity 671×4 locales
node scripts/check-design-tokens.mjs --strict --scope=mantine     → 0 violations
npm.cmd run check:i18n                                            → PASS, 2254 keys × 4 locales
npm.cmd run check:file-integrity                                  → PASS, 45 files clean
npm.cmd run check:mojibake                                        → PASS, 0 artifacts / 3932 files
npm.cmd run check:story-coverage                                  → PASS, 28/28 manifest components covered
npm.cmd run governance:components                                 → PASS (infra check)
npm.cmd run test:listings                                         → 6 files / 45 tests PASS, exit 0
npx.cmd vitest run src/modules/listings                           → 23 files PASS, 1 file / 2 tests FAIL (ListingCard.smoke.test.tsx archived-badge — Task 790's pre-existing standing gap; ListingCard.tsx untouched by this diff)
npx.cmd vitest run src/design-system/mantine/__tests__            → 54/55 PASS (1 fail = Task 790's standing FooterView contract mismatch, unrelated file, untouched)
npm.cmd run build-storybook                                       → success (rebuilt fresh, post-dates this revision's story edits)
npm.cmd run build                                                 → exit 0, 40/40 static pages, `/[locale]/listings/[slug]` compiles as `ƒ`
npm.cmd run check:locale-leak:mantine-only                        → exit 1, 131 leaks — see R5, none attributable to this revision's own changes
```

**Status-copy census (§17.6)** — `Get-ChildItem messages\*.json | ForEach-Object { ... status_banner_$_ ... }` for
`sold, rented, archived, expired, pending, inactive` × 4 locale files → **24/24 rows `OK`**.

**Contact-lockout census (§17.6)** — `Select-String ... 'contactLifecycleDisabled\s*='` →
`listingArchived || listingExpired || listingClosed` (covers CLOSED); `Select-String ... "as 'sold' \| 'rented'"` on
`ListingDetailView.tsx` → **no match** (the 4-member cast is gone).

### R5. `check:locale-leak:mantine-only` — exit 1, full classification

Not part of the original Q3 command list (§13); added to the Revision 1 plan (§17.6). It found **131 leaks across
11 story exports**, none new to this diff:

| Story | Leak count | Cause | Attributable to this revision? |
|---|---:|---|---|
| `Admin/AdminUsersTable/Default` | 13 | Fixture names/roles not locale-backed | No — untouched file |
| `Mantine/Primitives/CountButton/Default` | 3 | Long English `docs.description` fixture text | No — untouched file |
| `Mantine/Primitives/FilterControls/Default` | 9 | English section-label fixture text | No — untouched file |
| `Patterns/Mantine/AuthSheet/Login` (+ Validation Error) | 6 | "Google" OAuth button label | No — untouched file |
| `Patterns/Mantine/ListingDetailView/Public Listing` | 24 | Leaflet chrome (Marker/Close popup/Zoom in/out/lib attribution/OpenStreetMap) + `Elira Hoxha` fixture name | No — untouched export, Task 798's pre-existing family (`docs/backlog.md` registry row 798) |
| `Patterns/Mantine/ListingDetailView/Staff Preview Unpublished` | 24 | Same | No — untouched export |
| `Patterns/Mantine/ListingDetailView/Staff Preview Published` | 24 | Same | No — untouched export |
| `Patterns/Mantine/ListingDetailView/Archived Listing` | 24 | **Same Leaflet/fixture family** — this is the **new** export F1 requires; it renders the same real `ListingDetailViewBody` → `MapWrapper` → Leaflet child every sibling export already renders | Indirectly — the export is new, but the leak class is Task 798's pre-existing, already-filed gap, reproduced identically, not a new leak category |
| `Patterns/Mantine/ListingsPageFrame/Default` | 1 | "Home" (it locale) | No — untouched file |
| `Patterns/Mantine/SaveSearchButton/Pending` | 3 | "Unauthorized" | No — untouched file |

13+3+9+3+3+24+24+24+24+1+3 = 131, reconciling exactly with the reported total. Zero leak lines trace to F2's
lockout-predicate change, F3's banner-copy/cast fix, F4's `STYLES` rows, or the two new
`ListingContactPattern.stories.tsx` sections (`contactDisabled`/`closedListing` — both use only already-locale-backed
`storyT()` strings, confirmed absent from the report). The only new leak lines come from adding the
`Archived Listing` export F1 requires, and every one of those 24 lines is the identical pre-existing Leaflet-chrome/
`Elira Hoxha`-fixture family already accepted as Task 798's scope (owner backlog row: *"newly visible only because
Task 791 enrolled `Patterns/Mantine/ListingDetailView` into `check:locale-leak --mantine-only`... Do not translate
the `Elira Hoxha` fixture — that one is a `PER_STORY_TOKENS` entry (Task 624)"*). Resolving it would mean either
implementing Task 798 (translating Leaflet's own chrome, explicitly reserved as its own P3 task) or omitting the map
from the new story (which would make it a materially different, less complete composition proof than its three
siblings). Neither is authorized by this task's scope. Reporting the exit-1 result as-is rather than treating it as
passed.

### R6. Files Changed (Revision 1, additive to §3's original table)

| File | Rationale |
|---|---|
| `src/modules/listings/components/ListingContact.tsx` | F2 — `contactLifecycleDisabled` extended to `listingClosed`; merged `closedLabel`/`contactDisabledLabel` into one `contactDisabledLabel`; `patternState` maps `listingClosed → 'closedListing'`; simplified `showInquiryTrigger`/`inquiryNode` accordingly |
| `src/design-system/mantine/patterns/MantineListingContactPattern.tsx` | F2 — Call/WhatsApp Flex and Send-message Flex now render for `state === 'normal' \|\| state === 'closedListing'` (composed with the headline block); doc-comment updates |
| `src/modules/listings/components/ListingStatusBanner.tsx` | F3/F4 — `Props.status` widened to `Exclude<ListingStatus,'active'>`; `STYLES` gained `pending`/`inactive` rows (reusing `--status-warning`) |
| `src/modules/listings/components/ListingDetailView.tsx` | F3 — cast replaced by `isListingNonActiveStatus(listing.status)`; `isListingVisible` import dropped (no longer called directly here) |
| `src/modules/listings/domain/listingSemanticHelpers.ts` | F3 — new `isListingNonActiveStatus` type predicate |
| `src/modules/listings/domain/index.ts` | F3 — export the new predicate |
| `messages/{sq,en,uk,it}.json` | F3 — `status_banner_pending`/`status_banner_inactive` (listing namespace); F1 — `listing_detail_section_contact_disabled`/`listing_detail_section_closed_listing` (storybook namespace) |
| `src/stories/patterns/mantine/ListingContactPattern.stories.tsx` | F1 — two new sections (`contactDisabled`, `closedListing`); updated component doc description |
| `src/stories/patterns/mantine/ListingDetailView.stories.tsx` | F1 — new `ArchivedListing` export |
| `scripts/task612-qa-listinggallery-lightbox-portal.mjs` | P3 — added unconditional `dialogCoversViewport` assertion to the verdict |

### R7. Assumptions, deviations, limitations (Revision 1)

- **`check:locale-leak:mantine-only` exits 1** — see R5. Fully classified; zero new leak categories; the new leak
  lines are the required `ArchivedListing` story reproducing Task 798's already-filed, out-of-scope Leaflet/fixture
  family. Not treated as a blocking defect of this revision; flagged for Opus to accept or return.
- **`listing.condition`/`listing.heating` `MISSING_MESSAGE` console errors** on `ListingDetailView.stories.tsx` —
  confirmed pre-existing (reproduced identically on the untouched `Public Listing`/`Staff Preview Unpublished`
  exports via the shared `detailAttrs` fixture). Not introduced by this revision, not filed by this task.
- Self-verification screenshots (R3) are implementation evidence, not the owner's required visual-matrix review —
  §13's `OWNER VISUAL QA REQUIRED` matrix, including the three new tuples (`contactDisabled`, `closedListing`,
  `Archived Listing`), remains owed.

### R8. Opus handoff — Revision 1

- F1/F2/F3/F4/P3 all implemented and evidenced per R1-R6 above.
- `check:locale-leak:mantine-only`'s exit 1 needs an explicit accept/return decision — see R5's full classification
  before deciding; do not re-run it expecting a clean exit without first reading whether Task 798's scope changed.
- The original submission's R11 archived/expired/sold **live-route** rendered proof (§9's original gap) remains
  unresolved — still no non-active-status listing in this sandbox's seeded DB. The new `ArchivedListing` **Storybook**
  export (F1) is the closest available substitute evidence and is self-verified rendered (R3); it is not a
  replacement for the live-route proof the original kickoff asked for.

## 1. Requirement / acceptance-criteria evidence

| Req | AC | Where verified | Result |
|---|---|---|---|
| R1 | AC1 | `ListingContact.tsx` renders `MantineListingContactPattern` unconditionally (no `hidden lg:block`/fixed-bar wrapper); pattern's own `pos={{base:'static',lg:'sticky'}}`. Live route: `data-testid="listing-contact-card"` present, no `position: fixed` inline style found in served HTML (`grep -o 'position:\s*fixed'` → 0 matches) | ✅ |
| R2 | AC2 | `ListingDetailView.tsx` computes `favoriteSlot`/`shareSlot`, passed to `MantineListingDetailPattern`'s new `favorite`/`share` props, rendered adjacent in one `Group` in the badges row. Live route: `aria-label="Shpërndaj njoftimin"` (share) count = 1 via `grep -o 'aria-label="..."' \| wc -l`; favorite absent for the guest fixture tested (expected — `effectiveListingId` is `undefined` for guests, same gate as pre-migration) | ✅ (share); favorite gate unchanged from pre-migration, not independently exercised against an authenticated fixture in this sandbox (no auth session available) |
| R3 | AC3 | `ListingContact.tsx` has zero `@/components/ui/*` imports (confirmed by inspection — only `@mantine/core`, `lucide-react`, domain/actions imports). `ListingDetailView.tsx` diff: only `favorite`/`share` props added to the `MantineListingDetailPattern` call plus the slot-construction block and `pb` simplification — no unrelated changes | ✅ |
| R4 | AC4 | E-A (`saveTrigger`) and E-B (`loading`) added to `MantineListingContactPattern`; each has a story section in `ListingContactPattern.stories.tsx` ("normal" section now includes `saveTrigger`; new "loading" section). The 4 states untouched by this task's JSX changes (`guestCta`/`ownerDeleted`/`ownerUnavailable`/`closedListing`) — their code blocks were not edited, only the `normal`-state row composition and the share removal changed | ✅ (see §6 for the "byte-identical" scope note — `normal` state necessarily changed per this task's own Scope) |
| R5 | AC5 | `listingContactBarClearance` deleted from `theme.ts` (type + value), `theme.d69-18.test.tsx` (value assertion + `CONTRACT_CONSUMERS` row), `ListingDetailView.tsx` (`pb="2xl"` replaces the object), `task791-detail-evidence.mjs` (AC10→AC5, reads the ordinary `2xl` token). Live route (`test1-mqidv5is`, sq): `padding-bottom` = 32px at 320/390/768/1280 — evidence script `ac5-bottom-padding-*` all PASS | ✅ |
| R6 | AC6 | `trackListingContactEvent` fired only in the WhatsApp branch (unchanged); `getListingOwnerContact` still the click-time RPC — grep of served HTML for `tel:`/`wa.me/` links → 0 matches (no digit leak); `openAuthSheet('login')` wired to `onLogin`; `showInquiryTrigger` guard preserved (+ extended for R11); `listingClosed` still renders a disabled Send-message placeholder with `closedLabel`, Call/WhatsApp remain active (unchanged) | ✅ |
| R7 | AC7 | Evidence script `ac12-stacking-*` — header stacking + full-viewport scrim coverage PASS at 390/1280 × sq/uk (12/12 overall run); `test:listings` 45/45 exit 0 | ✅ |
| R8 | AC8 | `check-design-tokens.mjs --strict --scope=mantine` → 0 violations (not treated as sufficient proof per AC8/Task 797 — see manual grep below) | ✅ |
| R9 | AC9 | Census below — every hit classified; evidence script passes 12/12; `vitest run .../mantine/__tests__` 54/55 (Task 790's pre-existing standing failure only, no new failure, no assertion referencing the deleted token) | ✅ |
| R10 | AC10 | `ListingDetailView.tsx` passes only strings/booleans/nodes to `FavoriteButton`/`ListingShareButton`/`ListingContact` — no function-valued prop (source-read confirmed); `ListingShareButton.tsx` is its own `'use client'` file. Real `next start` request to `/sq/listings/test1-mqidv5is` and `/uk/listings/test1-mqidv5is` → both 200 | ✅ |
| R11 | AC12 | Implemented: `contactDisabled`/`contactDisabledLabel` props added to the pattern; `ListingContact.tsx` sets `contactLifecycleDisabled = listingArchived \|\| listingExpired`, disables Call/WhatsApp (via the pattern) and swaps Send-message for a disabled placeholder; `ListingDetailView.tsx` disables `FavoriteButton` for the same condition (+ `listingClosed`, unchanged); share (`ListingShareButton`) carries no disabled path at all — always live. **Live-route rendered proof NOT obtained** — this sandbox's seeded DB has exactly one listing (`test1-mqidv5is`, status `active`); no archived/expired/sold fixture exists here | ⚠️ **Implementation done, live-render proof BLOCKED by environment** — see §9 |
| — | AC11 | `npm run build` exit 0; `next start` on port 3001 (3000 was occupied by a pre-existing, unrelated process — see §9) → 200 for both `/sq/listings/test1-mqidv5is` and `/uk/listings/test1-mqidv5is` | ✅ |

## 2. Current vs required behavior

**Before:** `ListingContact.tsx` (423 ln, 75 `className`, 2 `@/components/ui/*` imports) hand-rolled both a `hidden lg:block sticky` desktop sidebar and a separate `lg:hidden fixed bottom-0` mobile bar, each duplicating owner/price/CTA markup. Favorite, Save-to-collection and Share lived together in one row inside the card. The page reserved `theme.other.layout.listingContactBarClearance` (`{base:176, md:80}`) as bottom padding for the fixed bar.

**After:** `ListingContact.tsx` computes state/derived booleans and renders `MantineListingContactPattern` once; the pattern's own `pos={{base:'static', lg:'sticky'}}` makes it appear in normal flow below `lg` (bar deleted) and sticky at `lg`+ (unchanged desktop look). Favorite (`FavoriteButton`) and Share (new `ListingShareButton`) render once, in `MantineListingDetailPattern`'s badges row, at every breakpoint, independent of the contact card's owner-account state. The page's bottom padding is the ordinary `2xl` token at every width.

**Negative flows:**

| Branch | Applicable | Result |
|---|---:|---|
| Offline/network (contact RPC failure) | Yes | Unchanged: `toast.error(t('contact_load_failed'))`; `loading` prop now surfaces a spinner on Call/WhatsApp via the pattern instead of a locally-swapped icon — same observable behavior |
| Owner/listing states (ownerDeleted/ownerUnavailable/guestCta/closedListing/archived/self-inquiry) | Yes | ownerDeleted/ownerUnavailable/guestCta map to the pattern's existing states unchanged; closedListing and archived/expired both use `state='normal'` with per-control disabling (see R11) — this preserves the pre-migration closedListing look (Call/WhatsApp stay active) instead of collapsing to the pattern's dormant `closedListing` state, which would have been a regression (see §6) |
| Long-locale overflow (uk/it @320) | Yes | `ac14-overflow-320-uk` PASS — 0 clipped badges, no scroll overflow |
| Stacking (Task 612) | Yes | `ac12-stacking-*` PASS (see §1 R7) |

## 3. Files Changed

| File | Rationale |
|---|---|
| `src/modules/listings/components/ListingContact.tsx` | Full rewrite — renders `MantineListingContactPattern`, computes state/labels/disabled flags, no more hand-rolled markup or shadcn imports |
| `src/modules/listings/components/ListingShareButton.tsx` | New — `'use client'` share affordance (moved out of `ListingContact`, R10) |
| `src/modules/listings/components/ListingDetailView.tsx` | Computes `favoriteSlot`/`shareSlot` and passes them + simplifies `pb` to the ordinary `2xl` token; `contactSlot` prop list trimmed (`listingUrl`/`isFavorited` no longer needed by `ListingContact`) |
| `src/design-system/mantine/patterns/MantineListingContactPattern.tsx` | E-A (`saveTrigger`), E-B (`loading`), new `contactDisabled`/`contactDisabledLabel` (R11); removed `onShare`/`labels.share`; `saveTrigger`/`reportTrigger` now render independent of `state` (matches pre-migration "always shown" behavior); added `data-testid="listing-contact-card"` |
| `src/design-system/mantine/patterns/MantineListingDetailPattern.tsx` | New `share` prop rendered next to `favorite` in the badges-row `Group` |
| `src/design-system/mantine/theme.ts` | Deleted `listingContactBarClearance` (type + value) |
| `src/design-system/mantine/__tests__/theme.d69-18.test.tsx` | Deleted the clearance value assertion and its `CONTRACT_CONSUMERS` row |
| `scripts/task791-detail-evidence.mjs` | AC10→AC5 (ordinary-padding check at 320/390/768/1280); `.listing-contact` selector → `data-testid="listing-contact-card"`; AC12 stacking probe now treats an off-screen (below-the-fold) contact card as N/A instead of a false FAIL, plus a new full-viewport scrim-coverage assertion |
| `scripts/task612-qa-listinggallery-lightbox-portal.mjs` | Same selector fix (ad hoc, non-CI script; found during the reference census) |
| `scripts/mantine-migration-scope.json` | Registered `ListingContact.tsx` |
| `docs/component-catalog.md` | Targeted row edit: `ListingContact` → APPROVED (GOVERNANCE_VIOLATION cleared), new `ListingShareButton` row, summary counters (+1 component); **did not run a full `catalog:components` regeneration** — that would have swept ~30 unrelated components' hand-curated status back to mechanical defaults (see §9) |
| `src/stories/patterns/mantine/ListingContactPattern.stories.tsx` | `saveTrigger` on the normal section, new "loading" section, new "production wiring" section importing the real `ListingContact` (satisfies `check:story-coverage`'s manifest gate), `share` dropped from `makeLabels` |
| `src/stories/patterns/mantine/ListingDetailPattern.stories.tsx` | `share`/`DemoShare` added to every section alongside `favorite`; `saveTrigger`/`DemoSaveTrigger` added to `demoContact` |
| `messages/{sq,en,uk,it}.json` | New keys: `action_disabled_archived`, `action_disabled_expired` (listing namespace); `listing_detail_save_to_collection`, `listing_detail_section_loading`, `listing_detail_section_production` (storybook namespace) |

## 4. Validation evidence (exact commands, win32)

```
node -p process.platform                                          → win32
npx tsc --noEmit                                                  → exit 0
npx eslint <changed .tsx files>                                   → exit 0 (0 errors; 2 pre-existing ignore-warnings on .mjs scripts)
npm run check:i18n                                                → PASS, 2250 keys × 4 locales
npm run check:file-integrity                                      → PASS, 30 files clean (final pass)
npm run check:mojibake                                            → PASS, 0 artifacts / 3931 files (final pass)
node scripts/check-design-tokens.mjs --strict --scope=mantine     → 0 violations (not sufficient proof alone — Task 797; manual grep below)
npm run check:stories                                             → PASS, 135 files / 0 violations
npm run check:story-coverage                                      → PASS, 28/28 manifest components covered
npm run governance:components                                     → PASS (infra check)
npm run test:listings                                             → 6 files / 45 tests PASS
npx vitest run src/modules/listings                                → 23 files PASS, 1 file / 2 tests FAIL (ListingCard.smoke.test.tsx archived-badge — pre-existing, Task 790's documented standing gap; ListingCard.tsx/its test untouched by this diff)
npx vitest run src/design-system/mantine/__tests__                → 54/55 PASS (1 fail = Task 790's standing FooterView contract mismatch, unrelated file)
npm run build-storybook                                            → success
npm run build                                                      → exit 0, `/[locale]/listings/[slug]` compiles as `ƒ`
npm run start (PORT=3001 — 3000 occupied, see §9)                  → Ready
node scripts/task791-detail-evidence.mjs (LIVE_BASE_URL=:3001, LISTING_SLUG=test1-mqidv5is) → 12/12 PASS, exit 0
curl -o /dev/null -w "%{http_code}" http://localhost:3001/sq/listings/test1-mqidv5is → 200
curl -o /dev/null -w "%{http_code}" http://localhost:3001/uk/listings/test1-mqidv5is → 200
```

**AC8 manual grep** (design-tokens gate is not proof per Task 797): `grep -n "px\b" ListingContact.tsx MantineListingContactPattern.tsx MantineListingDetailPattern.tsx ListingShareButton.tsx` in the diff — no raw pixel literal introduced; the one numeric value (`Loader2`/icon `size={theme.other.iconSize.*}`) is always a theme-token read, never a bare number.

**AC9 reference census** (`grep -rn "listing-contact-mobile\|listingContactBarClearance" src/ scripts/ docs/`):
- `src/design-system/mantine/theme.ts`, `theme.d69-18.test.tsx`, `ListingDetailView.tsx` (pre-change), `scripts/task791-detail-evidence.mjs` (pre-change) — all four **removed in this diff** (0 hits after).
- `tasks/Sprints/Sprint_71_*.md` (×2), `docs/backlog.md`, `docs/backlog-archive.md`, `docs/sessions/2026-09-05-task791-*.md` — **historical prose**, describing what Task 791/793 *were going to do* / *did*. Not live code references. Left untouched.
- `.listing-contact`/`.listing-mobile-cta` (not literally "listing-contact-mobile", but the same removed-affordance family): found live in `scripts/task612-qa-listinggallery-lightbox-portal.mjs` — **fixed in this diff** (selector updated to the new `data-testid`). `src/modules/listings/components/ListingMobileCTA.tsx` uses `.listing-mobile-cta` — **out of scope, Sprint 57, zero production consumers** (confirmed by the kickoff itself), left untouched.
- Remaining hits (`docs/sessions/2026-*-task466/460/289/84-*.md`, `docs/reviews/artifacts/**/*.js` build snapshot, `task-289-listing-contact-events-anon-revoke.sql`) — historical session logs, a frozen Storybook build artifact from a past review, and a Task-289 SQL migration filename (unrelated DB table name). All historical/non-live.

**Self-validation:** `tsc=0 errors · build=passes · AC table=mostly green (R11 live-proof blocked, see §9) · runtime locale=uk PASS (200, evidence script covers uk cells) · scope=clean (git diff limited to task-relevant files; component-catalog.md hand-edited to avoid a full-regen sweep) · integrity=PASS`

## 5. Visual source trace

| Visible artifact | Component/markup | Class/selector | Token path | Change/preserve | Evidence |
|---|---|---|---|---|---|
| Contact card (desktop+mobile) | `MantineListingContactPattern` `<Paper>` | `data-testid="listing-contact-card"` (new) | `theme.other.layout.listingContactStickyOffset`, `theme.breakpoints.lg` (unchanged) | changed → reused pattern, now the sole renderer | Live route + story |
| Fixed mobile bar | (deleted) | was `.listing-contact-mobile` | was `listingContactBarClearance` | deleted | grep census, §4 |
| Favorite/Share | `FavoriteButton`/`ListingShareButton` in `MantineListingDetailPattern`'s badges `Group` | n/a (icon buttons) | `theme.other.iconSize.prominent/standard` | moved | Live route aria-label count |
| Page bottom padding | `Box[data-testid="listing-detail-view"]` | — | `theme.spacing['2xl']` | changed (ordinary token replaces the reserved clearance) | `ac5-bottom-padding-*` |

## 6. Canonical UI decision record

| Artifact | Search | Canonical source | Disposition | Shared path |
|---|---|---|---|---|
| Contact card | Inspected `MantineListingContactPattern.tsx`, its story, `MantineListingDetailPattern.tsx` | `Patterns/Mantine/ListingContactPattern` | `reuse` + `extend` (E-A/E-B/`contactDisabled`) | `src/design-system/mantine/patterns/MantineListingContactPattern.tsx` |
| Badges-row favorite+share | Inspected `MantineListingDetailPattern.tsx` (D69-25 comment) | `Patterns/Mantine/ListingDetailPattern` | `extend` (new `share` prop) | same file |
| Share icon control | Searched for an existing icon-button share affordance — none exists; mirrors `FavoriteButton`'s own established `ActionIcon` shape/size-token idiom (not a new design decision, a scoped feature component matching the existing sibling) | n/a (feature component, same class as `FavoriteButton`/`SaveToCollectionButton`) | new scoped component, not a design-system primitive | `src/modules/listings/components/ListingShareButton.tsx` |

**Deviation from a literal reading of AC4/"byte-identical":** the `normal` state's own row composition is exactly what E-A/E-B/share-removal changes (all three are named, in-scope edits to that state). "Byte-identical" is satisfied for the four states this task does not touch (`guestCta`/`ownerDeleted`/`ownerUnavailable`/`closedListing`) — their JSX blocks were not edited. Flagging this explicitly for Opus rather than silently asserting full byte-identity.

**Deviation from AC4/§3.2's `closedListing` state:** `ListingContact.tsx` never sets `state='closedListing'`. That pre-existing pattern state fully replaces Call/WhatsApp/Send-message with one disabled button — but production's actual closedListing behavior (verified in the pre-migration source) keeps Call/WhatsApp **active** and disables only Send-message. Using `state='closedListing'` would have been a real regression (AC12's own "prove the pre-existing closedListing behaviour did not change" requirement). Instead, `listingClosed` is handled inside `state='normal'` via a disabled placeholder Send-message button — same mechanism now used for R11's archived/expired case. `state='closedListing'` is left in the pattern, unused by this consumer, unchanged.

## 7. Implementation validation notes

- Found during implementation: `reportTrigger` and (the new) `saveTrigger` were originally state-gated (`state==='normal'`) in the canonical pattern; pre-migration production showed both regardless of card state (only gated on `listingId`/`canReport`). Fixed by rendering both independent of `state`.
- Found during implementation: the evidence script's `ac12-stacking` check assumed the contact card is always in-viewport (true when it was `fixed`/`sticky`); after R1, it can be scrolled below the fold at mobile widths when the gallery trigger (near the top) is clicked. Fixed the script to treat an off-screen card as N/A (mirroring its existing "not rendered" N/A branch) and added an independent full-viewport scrim-coverage assertion so mobile stacking is still proven without relying on the card's scroll position.
- Found during implementation: `npm run catalog:components` (write mode) performs a full mechanical regeneration that reset ~30 unrelated components' hand-curated catalog status (e.g., `AuthRedirect`, `HeroSearchClient`, `FooterView`) — exactly the "sweeping in unreviewed drift" the catalog's own header warns against. Reverted those three generated files to `HEAD` via the filesystem (not `git checkout`) and hand-edited only `ListingContact`'s row + added `ListingShareButton`, keeping the diff scoped to this task.

## 8. Assumptions, deviations, limitations

- **A4 (task's own reversible assumption):** `expired` is treated like `archived` for R11's contact-disabling rule. Implemented via a direct `listingStatus === 'expired'` comparison in `ListingContact.tsx`/`ListingDetailView.tsx`, matching the existing precedent at `ListingCard.tsx:103` (no `isListingExpired` domain helper exists; adding one was judged out of this task's named Scope).
- **Share ordering in the badges row:** implemented as `favorite` then `share` (share to the right of favorite), per the owner's literal spatial instruction ("share to the right of favorite"); the "Поділитися · В обране" naming order in the same quote reads left-to-right as share-then-favorite, which would be the opposite order. Flagged for the owner/Opus to confirm the intended visual order — a one-line swap in `MantineListingDetailPattern.tsx`'s badges `Group` if wrong.
- **`ListingCard.smoke.test.tsx`'s 2 failures** and **`theme.d69-18.test.tsx`'s 1 failure** are Task 790's pre-existing, already-documented standing gaps (`docs/backlog.md` Task 790 row) — confirmed via `git status` that neither file was touched by this diff.

## 9. Opus handoff — evidence locations and open risks

- **R11 archived/expired/sold live-render proof is NOT obtained.** This sandbox's seeded DB has exactly one listing (`test1-mqidv5is`, `status: active`) — confirmed by crawling `/sq/listings` for real slugs. The implementation (contact-CTA disabling, favorite disabling, share staying live) is verifiable by source read (`ListingContact.tsx`, `ListingDetailView.tsx`, `MantineListingContactPattern.tsx`) but **not by the required rendered proof at 390/1280 for archived, expired, and sold** (AC12). This needs either the owner's seeded DB (with slug `11-mr7ucly4` used throughout the sprint, absent here) or a temporary status update on `test1-mqidv5is` to exercise each branch.
- **Port 3000 was occupied by a pre-existing, unrelated `node.exe` process** (PID 44852, started 11:29 the same day, serving stale/unrelated content — a listing-detail URL on it resolved to the generic homepage title). I did not stop it (uncertain provenance); I ran `next start` on port 3001 instead for all live-route evidence. Owner may want to investigate/reclaim port 3000.
- **Owner-quoted share/favorite order** — see §8, needs confirmation.
- **Evidence directory `docs/sessions/evidence/task791/`** now contains this task's `ac5-bottom-padding-*` (new) alongside pre-existing `ac10-clearance-*.png` (orphaned — the check they proved no longer exists). Left in place as historical Task 791 evidence; not deleted (AC9's census targets code references, not archived screenshots).

**OWNER VISUAL QA REQUIRED** — none of the visual matrix cells in the kickoff §13 table were rendered by Sonnet as an approval (per the retired `screenshots:assert` rule); the exact story×state×locale×viewport tuples in the kickoff remain owner review items. The archived/expired/sold live-route rows additionally cannot be reviewed until seed data exists.

## Files Changed (repeat, per template)

See §3 above — one table, not duplicated here.

Self-validation: tsc=0 errors · build=passes · AC table=all green except R11's live-render sub-proof (blocked by environment, documented) · runtime locale=uk PASS · scope=clean · integrity=PASS
