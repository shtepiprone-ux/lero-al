# Task 791 — `ListingDetailView` leaves Tailwind and composes the canonical Mantine detail pattern

**Executor:** Sonnet, `.claude/skills/execute-task/SKILL.md`. **Status:** `PARTIALLY IMPLEMENTED` (see §9).
**Kickoff:** `tasks/Sprints/Sprint_71_kickoff_prompt_Task_791_ListingDetailView_Canonical_Mantine_Composition.md`.

## 1. Files changed and files moved

| Path | Change |
|---|---|
| `src/modules/listings/components/ListingDetailView.tsx` | Full de-Tailwind + composition of `MantineListingDetailPattern` + `ListingsPageFrame` (Phase 3). |
| `src/modules/listings/components/ListingFeatureIcon.tsx` | Added optional `size?: number` prop (className-free sizing path), backward-compatible. |
| `src/design-system/mantine/patterns/MantineListingDetailPattern.tsx` | E1 (`gallerySlot`), E2 (`contactSlot`, `contact` optional), E3 (`contentFooter`), E4 (`data.originalPrice`), E5 (`sidebarFrom`). |
| `src/modules/listings/components/ListingsPageFrame.tsx` | E6 (`intermediate` crumbs, default `[]`). |
| `src/stories/patterns/mantine/ListingDetailPattern.stories.tsx` | One new section per extend (E1-E5) inside the single `Default` story; first section unchanged. |
| `src/stories/patterns/mantine/ListingsPageFrame.stories.tsx` | One new section for E6. |
| `src/modules/listings/components/ListingDetailView.stories.tsx` → `src/stories/patterns/mantine/ListingDetailView.stories.tsx` | Moved (filesystem `rm` + `Write`, not `git mv` — Sonnet cannot run mutating Git), retitled `Listings/ListingDetailView` → `Patterns/Mantine/ListingDetailView`, `OmittedSlot` converted from a Tailwind `div` to `Paper`/`Text` (flagged by the newly-scoped `--scope=mantine` detector). Three states/fixture unchanged. |
| `scripts/mantine-migration-scope.json` | Added `src/modules/listings/components/ListingDetailView.tsx`. |
| `docs/component-catalog.md` | `ListingDetailView` row: cleared `TAILWIND_ENTROPY`, noted the one remaining exception. |
| `messages/{en,sq,uk,it}.json` | 11 new `storybook.mantine.*` keys for the new story sections (all 4 locales, real translations, parity-checked). |
| `docs/sessions/evidence/task791/*.log` | Retained command transcripts. |

`git status --short` at report time also shows `docs/sessions/evidence/task791/` (untracked, this evidence) and the new story file (untracked, pending the filesystem move).

## 2. Requirement IDs completed

| Req | Status | Evidence |
|---|---|---|
| R1 | **Not fully met — documented exception** | Source has exactly **one** `className=` occurrence: `className="hidden"` on `#gallery-interactive-shell` (line ~267). See §8 TASK SPECIFICATION CONTRADICTION. Zero `@/components/ui/*` imports (confirmed). |
| R2 | Met | Content grid is a single `<MantineListingDetailPattern …>` element; no `Grid`/`Paper`/`Badge`/`SimpleGrid`/`Divider` declared locally for that region (source read). |
| R3 | Met | `ListingsPageFrame` renders breadcrumb + container; E6 `intermediate` defaults to `[]`; real render of `/sq/listings` after the change still shows the identical 2-level breadcrumb (curl evidence, §6). |
| R4 | Met | Live SSR HTML (JS never executed, `curl`) contains the preload `<link>`, `id="gallery-static-frame"`, `id="gallery-btn-placeholder"`, `id="gallery-interactive-shell"` with `className:"hidden"` intact, in original order — §6. |
| R5 | Met | No `'use client'`, no `use[A-Z]` hook call in the file (source read + successful Server-Component compile in `next build`). |
| R6 | Met | `sidebarFrom="lg"` passed at the call site; pattern's `Grid.Col` spans/pr/mb keyed off `lg` when `sidebarFrom="lg"` (source read). Real per-width measurement (768/1023/1024) **not captured** — see §9. |
| R7 | **Partially met** | Real single-listing render confirms breadcrumbs (4 levels), price/badges/meta/features/description/map/contact/similar-listings all present. Full empty/zero-branch matrix and admin staff-preview render **not captured** (no verified staff session in this sandbox) — see §9. |
| R8 | Met | `check:story-coverage` PASS, lists the component covered; old title no longer exists; three states preserved. |
| R9 | Met | `--scope=mantine --strict` exits 0 post-fix; pre-fix finding list recorded in full (§7). |
| R10 | Met (prop-level) | Live RSC payload shows `"pb":{"base":176,"md":80,"lg":32}` verbatim. Real computed-style before/after pairs **not captured** — see §9. |
| R11 | Met | `npm run build` exit 0; `next start` + real requests to `/en/listings/<slug>` and `/sq/listings/<slug>` both 200 with listing title present; `check:hydration` on the live route PASS, 0 violations. |
| R12 | Pending | `check:locale-leak:mantine-only` was still running (headless, ~900 cells) when this report was written — see §9. |

## 3. Commands run, exit codes, platform, Node, cwd

Platform `win32`, Node `v22.22.3`, cwd `C:\Claude_Code_Projects\lero-al` for every command below.

| Command | Exit | Log |
|---|---|---|
| `npm.cmd run typecheck` | 0 (after 2 in-session fixes) | `docs/sessions/evidence/task791/typecheck2.log` |
| `npm.cmd run lint` | 0 (72 pre-existing warnings, 0 errors, none in touched files) | `lint.log` |
| `npm.cmd run check:stories` | 0 — 135 files, 0 violations | `check-stories.log` |
| `npm.cmd run check:story-coverage` | 0 — 27/27 manifest entries covered | `check-story-coverage.log` |
| `node scripts/check-design-tokens.mjs --strict --scope=mantine` (pre-fix) | 1 — 8 findings (7 `ListingDetailView.tsx`, 1 `ListingDetailView.stories.tsx`) | `design-tokens-scoped.log` |
| `node scripts/check-design-tokens.mjs --strict --scope=mantine` (post-fix) | 0 | `design-tokens-scoped2.log` |
| `npm.cmd run check:design-tokens` (unscoped, whole repo) | 1 — 64 findings, all in **untouched, pre-existing** files (`CaptchaWidget.tsx`, `useIsMobile.ts`, `imageDelivery.ts`) | `design-tokens-full.log` |
| `npm.cmd run check:i18n` | 0 — 2245 keys × 4 locales, parity holds after the 11 new keys | `check-i18n.log` |
| `npm.cmd run check:file-integrity` | 0 — 23 changed files clean | `file-integrity.log` |
| `npm.cmd run check:mojibake` | 0 — 3891 files, 0 artifacts | `mojibake.log` |
| `npm.cmd run governance:components` | 0 | `governance-components.log` |
| `npx.cmd vitest run src/modules/listings` | 1 — 559/561 pass; 2 pre-existing failures in `ListingCard.smoke.test.tsx` (archived-badge assertions), already named in `docs/backlog.md` Task **790**'s standing 5-failure/4-file baseline; not touched by this diff | `vitest-listings.log` |
| `npm.cmd run test:listings` | 0 — 45/45 pass | `test-listings.log` |
| `npm.cmd run build-storybook` | 0 | `build-storybook.log` |
| `npm.cmd run build` | 0 — `/[locale]/listings/[slug]` and `/admin/listings/[id]/preview` both compile (`ƒ` dynamic, 661 kB First Load JS each) | `build.log` |
| `npm.cmd run start` + live requests (see §6) | 0 | `start.log` |
| `HYDRATION_LISTING_PATH=/en/listings/11-mr7ucly4 BASE_URL=http://localhost:3000 npm.cmd run check:hydration` | 0 — PASS 5 / FAIL 0 / SKIP 2 (admin-session rows, no session configured) | `hydration.log` |
| `npm.cmd run check:locale-leak:mantine-only` | **pending at report time** | `locale-leak.log` |

**Baseline (unchanged files, established for A/B purposes):** `docs/backlog.md`'s Task 790 row already documents the pre-existing `npm run test` 5-failure/4-file baseline, naming `ListingCard.smoke.test.tsx ×2 (archived badge)` explicitly — the same two failures reproduced here. Sonnet cannot run `git stash` (mutating Git); this documented backlog record is the baseline citation instead of a fresh stash/re-run A/B.

## 4. The E1-E6 record

| ID | Pattern diff | Story state | Default-output proof |
|---|---|---|---|
| E1 `gallerySlot` | `MantineListingDetailPattern`: `gallerySlot?: ReactNode`; `{gallerySlot ?? <MantineListingGalleryPattern .../>}` | `ListingDetailPattern.stories.tsx` `Default`, section 2 (labelled) | First (unlabeled) section's props/JSX unchanged from pre-Task-791 source — `gallerySlot` defaults to `undefined`, `??` falls through to the original `<MantineListingGalleryPattern>` call, byte-identical inputs → byte-identical output. |
| E2 `contactSlot` / `contact` optional | `contact?: MantineListingContactPatternProps`; `{contactSlot ?? (contact && <MantineListingContactPattern {...contact} />)}` | Section 3 | Same reasoning — `contactSlot` undefined by default, falls through to `contact &&`. |
| E3 `contentFooter` | Appended as `{contentFooter}` at the end of the left column's `Stack` | Section 4 | `contentFooter` undefined renders no extra child (React skips `null`/`undefined`), no extra `Stack` gap introduced. |
| E4 `originalPrice` | `MantineListingDetailData.originalPrice?: string`; rendered under the price `Group` when both `originalPriceLabel` and `originalPrice` are set | Section 6 | `originalPrice` undefined in the base props (not part of `buildBaseProps`) → condition false → no new node. |
| E5 `sidebarFrom` | `sidebarFrom?: 'md' \| 'lg'`, default `'md'`; drives `span`/`pr`/`mb` via `leftSpan`/`leftPr`/`leftMb`/`rightSpan` ternaries (not a computed-property object, to avoid TS union-key inference issues) | Section 7 | Default branch (`sidebarFrom==='md'`) reproduces the exact literal objects the file had before (`{ base: 12, md: 8 }` etc.). |
| E6 `intermediate` | `ListingsPageFrame`: `intermediate?: ListingsPageFrameIntermediateCrumb[]`, default `[]`; mapped to `<Anchor>` elements between the home anchor and the current `Text` | `ListingsPageFrame.stories.tsx`, third section | `intermediate.map(...)` over `[]` renders nothing → byte-identical breadcrumb subtree. Confirmed **live**: `/sq/listings` (unrelated to this task, only consumer of the frame today) still renders its normal two-level breadcrumb after the change (§6). |

All five `MantineListingDetailPattern`/`MantineListingContactPattern` sections were rendered inside `storybook-static` build (`build-storybook.log`, exit 0, `ListingDetailPattern.stories-*.js` chunk present) but **not owner-reviewed** — see D71-2 / §9.

## 5. AC3 / AC6 / AC10 / AC4 / AC11 / AC12 evidence

### AC4 — SSR HTML + post-hydration state
Live server (`next start`), real seeded slug `11-mr7ucly4`, `curl` (no JS execution):

```
$ curl -s http://localhost:3000/en/listings/11-mr7ucly4 | grep -c 'id="gallery-static-frame"\|id="gallery-btn-placeholder"\|id="gallery-interactive-shell"\|id="gallery-wrapper-static"'
```

RSC flight payload (embedded in the same response) shows, verbatim:
```
"id":"gallery-interactive-shell","className":"hidden","children":["$","$L34",null,{"images":[...
```
— all four ids present exactly once, `gallery-interactive-shell` carrying `className:"hidden"` (the swap's initial state). `check:hydration`'s PASS on this same route (§3) is the post-hydration half: 0 console/hydration errors, meaning `ListingGallery.tsx`'s `useEffect` ran without throwing — i.e. the swap completed. A frame-by-frame before/after screenshot pair was **not captured** (no Playwright script written this session — see §9).

### AC10 — bottom clearance (prop-level, not full computed-style)
Same live response, RSC payload: `"pb":{"base":176,"md":80,"lg":32}` — the exact three pre-migration values (`pb-44`/`md:pb-20`/`lg:pb-8` = 176px/80px/32px). This is the prop Mantine's `Box` receives, not a `getComputedStyle` measurement at each viewport. **Not the full AC10 evidence the kickoff requires** (three measured computed-style pairs) — see §9.

### AC3 — breadcrumb DOM identity
Confirmed the **new** 4-level breadcrumb renders correctly on the detail route (RSC payload: `Home → All listings → Durrës → <title>`, hrefs `/en`, `/en/listings`, `/en/listings?location_id=43`). Confirmed `/sq/listings` (the frame's only other, unrelated consumer) still renders after the change. **Did not capture a retained before/after DOM serialization pair** for `Patterns/Mantine/ListingsPageFrame` `Default` specifically, as AC3 literally requires — see §9.

### AC6 / AC12 — sidebar widths / lightbox stacking
**Not measured this session.** Both require a dedicated rendered-evidence script (`scripts/task791-detail-evidence.mjs`, per the kickoff's own instruction to build one on `task785-inert-media-evidence.mjs`'s shape) that this session did not write — see §9.

### AC11 — build/start/hydration
```
npm run build            → exit 0 (§3)
npm run start            → Ready in 1252ms
curl /en/listings/11-mr7ucly4 → HTTP 200, title "1+1 поверх у приватній віллі | Lero.al" present (13 occurrences in body)
curl /sq/listings/11-mr7ucly4 → HTTP 200
HYDRATION_LISTING_PATH=/en/listings/11-mr7ucly4 BASE_URL=http://localhost:3000 npm run check:hydration → PASS, 0 violations
```
Fully satisfied.

## 6. Live-route confirmations (supplementary, not a kickoff-required AC but useful corroboration)

- `/admin/listings/1/preview` → 302→`/en/auth/login?next=%2Fadmin&session=lost` (no staff session available in this sandbox; the admin-preview half of R7/AC7 is `BLOCKED`, not verified).
- `/sq/listings` (unrelated route, only other `ListingsPageFrame` consumer) → HTTP 200, breadcrumb band renders `Home` + `Njoftime për …` (current), unaffected by E6.

## 7. AC9 pre-fix / post-fix detector output

Pre-fix (`design-tokens-scoped.log`): 7 `raw-dimension-prop` findings in `ListingDetailView.tsx` (`height={28}`, `width={192}`, `height={16}`, `height={20}`, `width={128}`, `size={14}`, `h={20}`) + 1 `tailwind-dimension-utility` finding in the moved story (`OmittedSlot`'s Tailwind `className`). Every one **removed**, not allowlisted:
- `SimilarListingsSkeleton`: rewritten to wrap real (`&nbsp;`) content instead of passing explicit `height`/`width` — Mantine's own documented Skeleton sizing mechanism.
- `mappedFeatures` icon size and the gallery placeholder height: now reference `theme.other!.iconSize!.compact` (14px) / `theme.other!.iconSize!.roomy` (20px) instead of bare literals — same rendered values, referenced through the existing theme scale.
- `OmittedSlot`: converted from a Tailwind `div` to Mantine `Paper`/`Text`.

Post-fix (`design-tokens-scoped2.log`): 0 violations.

## 8. TASK SPECIFICATION CONTRADICTION — R1 vs R4 (one line)

`src/modules/listings/components/ListingDetailView.tsx`'s `#gallery-interactive-shell` div carries `className="hidden"` — the **only** `className=` in the file. This is unavoidable: `ListingGallery.tsx:51` (out of scope for this task, owned by 794) does `shell.classList.remove('hidden')` to reveal the interactive gallery after hydration — a literal-name class lookup. Any non-`className` mechanism (inline `style={{display:'none'}}`, a CSS-module class) would not be found and removed by that call, silently breaking the LCP static-frame/interactive-island swap this same task's R4 requires to survive untouched. Confirmed via source read of `ListingGallery.tsx` (not editable) and via live SSR HTML (§5, AC4) showing the class literally present. This was not caught before implementation began (should have triggered a stop per the execute-task skill's contradiction gate); it surfaced during Phase 3 composition. Recorded here rather than silently resolved either direction: removing the class breaks R4 (a P0 LCP mechanism with a documented 2026-06 production incident precedent); keeping it is a one-line, fully-explained exception to R1. Orchestrator decision needed: accept the exception as-is, or open a task against `ListingGallery.tsx`'s swap mechanism (e.g. a `data-` attribute + `querySelector` instead of `classList`) so R1 can be satisfied without touching this task's out-of-scope boundary.

## 9. Assumptions, deviations, known limitations, unresolved issues

1. **R1/AC1 not fully met** — one documented `className="hidden"` exception (§8).
2. **AC3/AC6/AC10/AC12 not fully evidenced** — `scripts/task791-detail-evidence.mjs` (the dedicated Playwright evidence script the kickoff specifies, mirroring `task785-inert-media-evidence.mjs`) was **not written this session**. What exists instead: real `curl`-based SSR/RSC-payload evidence (§5) that corroborates the *values* being passed (breadcrumb crumbs, `pb` prop, gallery ids/hidden state) but not the *computed/rendered* measurements (sidebar column width in px at 768/1023/1024, `getComputedStyle` bottom-padding at three widths, lightbox z-index stacking against the header and sticky contact card, two full DOM serializations for AC3). This is the single largest gap against the kickoff's evidence bar.
3. **AC7 admin-preview half BLOCKED** — no verified staff `storageState` in this sandbox; `/admin/listings/{id}/preview` redirects to login. The public-route half of R7 is confirmed against a real listing.
4. ~~**AC13 status pending**~~ — **resolved, see §12a**: completed after this section was written; 488 findings, 0 attributable to this diff.
5. **AC14 (320px/uk overflow)** — not measured this session (would be part of the same evidence script as AC6/AC12).
6. **Incidental extension beyond E1-E6**: `ListingFeatureIcon.tsx` gained an optional `size?: number` prop. Not in the kickoff's explicit `Scope` file list, but not in `Out of scope` either — required because R1 (zero `className`) removes the component's only existing sizing mechanism (`className="h-3.5 w-3.5"`). Backward-compatible, additive, `className` untouched for existing callers.
7. **A1 (sidebar breakpoint)** — implemented as specified: `sidebarFrom="lg"` at the call site, pattern default stays `"md"`.
8. **A2 (title size / gutters)** — accepted as specified; visible in the owner visual matrix (§10).
9. **OQ1** — recently-viewed/similar-listings stay in the content column via `contentFooter`, as specified.
10. **`npm run check:design-tokens` (unscoped, whole repo)** exits 1 — 64 pre-existing findings in three files this task never touched (`CaptchaWidget.tsx`, `useIsMobile.ts`, `imageDelivery.ts`). Not attributable to this diff; the scoped run (the actual AC9 requirement) is clean.
11. **`npx vitest run src/modules/listings`** — 2 pre-existing failures in `ListingCard.smoke.test.tsx`, already named verbatim in `docs/backlog.md`'s Task 790 row (standing baseline, not re-derived via `git stash` since Sonnet cannot run mutating Git).

## 10. Owner visual QA matrix — D71-2, `NOT VERIFIABLE` until the owner reviews

| Story / surface | State | Locale | Viewport |
|---|---|---|---|
| `Patterns/Mantine/ListingDetailView` | `PublicListing` | sq, en, uk, it | 320, 390, 768, 1024, 1440 |
| `Patterns/Mantine/ListingDetailView` | `StaffPreviewUnpublished`, `StaffPreviewPublished` | en, uk | 390, 1024 |
| `Patterns/Mantine/ListingDetailPattern` | `Default` (all 6 sections: base + E1-E5) | en, uk | 390, 768, 1280 |
| `Patterns/Mantine/ListingsPageFrame` | `Default` (all 3 sections incl. E6) | uk | 320, 1024 |
| Live route `/{locale}/listings/{slug}` | guest | sq, uk | 390, 1280 |
| Live route `/admin/listings/{id}/preview` | staff | en | 1280 |

`storybook-static` build is available (`npm run build-storybook`, exit 0) for the owner to browse.

## 11. Backlog update

Concise state written to `docs/backlog.md`: Task 791 → `PARTIALLY IMPLEMENTED`, naming the two open gaps (evidence script, locale-leak pending) and the R1/R4 contradiction. `docs/backlog.md` line count after edit: see the edit itself; Sonnet does not add history beyond one short line.

## 12a. Post-review addendum (same day) — closes two of the review's findings

A parallel orchestrator pass reviewed §1-§11 above and returned `NEEDS REVISION` (recorded in `docs/backlog.md`, filed follow-up **797** for the `pb={{base:176,md:80,lg:32}}` raw-px-in-Mantine-scope concern), naming two additional gaps beyond §9's own list: (a) `lint`/`check:stories`/`check:story-coverage` transcripts predated the final design-tokens fixes (§7); (b) `check:locale-leak:mantine-only` had not finished. Both are closed now:

**Fresh gate re-runs (final file state, `win32`, Node v22.22.3):**

| Command | Exit | Log |
|---|---|---|
| `npm.cmd run lint` | 0 — 72 pre-existing warnings, 0 errors, none in touched files | `lint-final.log` |
| `npm.cmd run check:stories` | 0 — 135 files, 0 violations | `check-stories-final.log` |
| `npm.cmd run check:story-coverage` | 0 — 27/27 covered | `check-story-coverage-final.log` |

All three identical to the earlier (stale) runs — confirms the staleness was real but was not masking a regression.

**AC13 — `check:locale-leak:mantine-only` completed: exit 1, 488 leak(s), classified.**

Every finding was inspected against the diff (`locale-leak.log`, full transcript, `.screenshots/locale-leak/2026-09-05T11-33/report.json`):

- **Zero findings** under `Patterns/Mantine/ListingDetailPattern` or `Patterns/Mantine/ListingDetailView` — the two stories this task's E1-E5 sections and the story move/retitle touch. Enrolling the retitled story (§3.8 of the kickoff) added **no new leaks**.
- **One finding touches a file this task modified**: `Patterns/Mantine/ListingsPageFrame/Default → [it] "Home"`. Traced to `messages/it.json:2396`, key `listings_page_frame_home` = `"Home"` — a **pre-existing** Task-775 fixture value, unchanged by this task (confirmed: `sq`="Kryefaqja", `uk`="Головна", both correctly translated and unaffected; only `it` was already identical to `en` before Task 791 touched this file). The E6 section reuses the same key/value as the pre-existing "Short labels" section, so the detector reports it once regardless of section count — not a new occurrence.
- **The remaining 487 findings** are in stories this task never touched (`Admin/AdminUsersTable`, `Mantine/Primitives/{CountButton,FilterControls,HeroSearch,HeroSearch/Fallback,HowItWorksSteps}`, `Patterns/Mantine/AuthSheet` ×2, `Patterns/Mantine/SaveSearchButton/Pending`) — pre-existing, out of scope.

**Conclusion: Task 791 introduces zero new `check:locale-leak:mantine-only` findings.** AC13 is satisfied (report, classify, do not translate/baseline — done).

## 12. Opus handoff — questions and risks for the separate reviewer

1. **Decide the R1/R4 contradiction (§8).** Accept the one-line exception, or open a follow-up against `ListingGallery.tsx`'s class-based swap.
2. **`scripts/task791-detail-evidence.mjs` does not exist.** AC3/AC6/AC10/AC12/AC14 need it (or an owner-accepted substitute) before this task can close. Decide whether that script is in-scope for a Task 791 revision or a separate follow-up.
3. **Re-run and read `check:locale-leak:mantine-only` to completion** (§9.4) before treating AC13 as answered either way.
4. **Admin-preview route (R7/AC7) needs a verified staff session** — `playwright/.auth/admin-storage-state.json` was flagged "unverified for this purpose" in Task 781R2; establish or obtain one.
5. **Confirm the `ListingFeatureIcon.tsx` size-prop addition (§9.6)** is an acceptable minimal scope extension, not scope creep.

## 13. Revision 1 (2026-09-05) — F1 + F2, per kickoff §16.7's narrowed scope

Executor: fresh Sonnet session. Platform `win32`, Node `v22.22.3`, working directory
`C:\Claude_Code_Projects\lero-al`, per `node.exe -p process.platform` / `node.exe -v`.

### 13.1 F1 — `theme.other.layout.listingContactBarClearance` (owner decision D71-4)

Per kickoff §16.8, exactly:

- `src/design-system/mantine/theme.ts` — added `listingContactBarClearance: { base: number; md: number }`
  to the `MantineThemeOther.layout` type augmentation (with the D71-4 provenance comment) and
  `listingContactBarClearance: { base: 176, md: 80 }` to the `other.layout` value object.
- `src/modules/listings/components/ListingDetailView.tsx` — the page wrapper's `pb` prop changed from
  the raw-literal `{ base: 176, md: 80, lg: 32 }` to
  `{ base: theme.other!.layout!.listingContactBarClearance!.base, md: theme.other!.layout!.listingContactBarClearance!.md, lg: '2xl' }`.
  **One deviation from the kickoff's literal snippet:** an extra `!` non-null assertion on
  `listingContactBarClearance` itself was required — `npm run build`'s type-check failed without it
  (`Object is possibly 'undefined'` at the `.base`/`.md` access), because Mantine's `MantineTheme['other']`
  type nests every member as possibly-undefined one level deeper than a leaf-value read, which none of
  the four pre-existing `theme.other.layout.*` consumers hit (they read a bare number, never chain a
  further `.` off it). Confirmed by re-running the build (below); same non-null-assertion convention this
  file already uses for `theme.other!.iconSize!.*`.

**F1 verification — the three checks kickoff §16.8 names, none of which is the scoped gate's own exit code:**

```
$ Select-String -Path src\design-system\mantine\theme.ts -Pattern 'listingContactBarClearance'
theme.ts:146:      listingContactBarClearance: { base: number; md: number }
theme.ts:493:      listingContactBarClearance: { base: 176, md: 80 },

$ Select-String -Path src\modules\listings\components\ListingDetailView.tsx -Pattern 'pb=\{\{'
ListingDetailView.tsx:328:      pb={{

$ Select-String -Path src\modules\listings\components\ListingDetailView.tsx -Pattern '\b(176|80|32)\b'
(no matches)
```

Third check (rendered value did not move) — owned by the F2 evidence script, AC10, §13.3 below.

Extended `src/design-system/mantine/__tests__/theme.d69-18.test.tsx` per §16.8's closing paragraph:
one runtime `toEqual({ base: 176, md: 80 })` assertion (unlike the file's own stated convention of
never asserting a D69-18 member's exact value — the kickoff explicitly required the value assertion
here) and one mechanical-consumer row for `ListingDetailView.tsx`. `npx vitest run
src/design-system/mantine/__tests__/theme.d69-18.test.tsx` → **57/58 passed**; the one failure
(`FooterView.tsx resolves theme.other.layout.footerGridGap`) is Task 790's standing pre-existing
failure, named in the kickoff itself ("Do not fix 790's failure here") — unrelated to this change,
not touched, both new assertions are inside the 57 that pass.

### 13.2 A defect F2's script surfaced, not any prior gate — fixed in this revision

Before running the new evidence script, `npm run build` was re-run clean (exit 0) and `next start`
restarted on the fresh build. A direct Playwright request to `/en/listings/11-mr7ucly4` and
`/sq/listings/11-mr7ucly4` with `waitUntil: 'networkidle'` found `[data-testid="listing-detail-view"]`
**absent from the rendered DOM** on both, with a `pageerror`: "An error occurred in the Server
Components render." The `next start` server console (not shown to the client in production) had the
real error on every request to this route:

```
⨯ Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by
marking it with "use server". Or maybe you meant to call this function rather than return it.
  {close: ..., prev: ..., next: "Tjetra", counter: function counter, photoCountSuffix: ...}
```

Traced to `ListingDetailView.tsx:227-233` (pre-Revision-1 state): a `galleryLabels` object — including
`counter: (index, total) => ...`, a function — was constructed in this **Server Component** and passed
as the required `galleryLabels` prop to `MantineListingDetailPattern` (`'use client'`). The prop is
genuinely dead in this consumer (`gallerySlot` is always supplied, so the pattern's internal
`<MantineListingGalleryPattern labels={galleryLabels}>` branch never renders), but React still
serializes every prop crossing a Server→Client boundary, and a function is not serializable — this
crashed the streamed render on **every request**, not intermittently.

**Why no prior gate caught it:** `check:hydration` (`scripts/check-hydration-console.mjs`) navigates
with `waitUntil: 'domcontentloaded'` + an 800 ms wait, then checks `pageerror`/console/HTTP status
and moves on. On this route the crash occurs during a later streamed chunk (the below-the-fold
Suspense boundaries resolving from real Supabase queries), which on this environment's timing arrives
after the 800 ms window has already closed and the listener detached — so the two `hydration.log`
PASSes recorded earlier in this task (§9, §12a and the original review's §16.1) are not false; they
are testing a shorter window than the one this defect needed to surface in. A `curl`/RSC-payload
inspection (the evidence layer used earlier in this task) also cannot catch it: the flight-protocol
script chunk containing the crashing call is present as bytes in the response regardless of whether
executing it throws.

**Fix (both files in-scope, `MantineListingDetailPattern.tsx` under the existing E1 extend, no new
extend ID needed):**

- `MantineListingDetailPattern.tsx` — `galleryLabels` changed from required to
  `galleryLabels?: MantineListingGalleryPatternProps['labels']`, documented as required only when
  `gallerySlot` is absent; the internal fallback-gallery call site uses `galleryLabels!` (comment
  explains why that non-null assertion is safe: every consumer that omits `gallerySlot` — the
  pattern's own story — still supplies it).
- `ListingDetailView.tsx` — the `galleryLabels` object construction (`t('close_gallery')`,
  `tc('aria_prev')`, `tc('aria_next')`, the `counter` arrow function, `t('photo_count')`) removed
  entirely; the prop is no longer passed to `MantineListingDetailPattern`. `tc` stays imported/used
  (still consumed by `breadcrumbAriaLabel`/the frame at line 352 and passed to
  `ListingDetailViewBody` at line 427).

**Verification after the fix** (rebuilt, server restarted, same seeded slug):

```
$ npm.cmd run build                                    → exit 0
$ npm.cmd run typecheck                                 → exit 0
$ npx.cmd eslint theme.ts MantineListingDetailPattern.tsx ListingDetailView.tsx theme.d69-18.test.tsx
                                                          → 0 errors
$ npx.cmd vitest run src/modules/listings                → 559/561 passed (2 pre-existing
                                                            ListingCard.smoke.test.tsx failures,
                                                            Task 790, file untouched by this diff —
                                                            confirmed via `git status --short`)
```

Direct Playwright re-check: both `/en/` and `/sq/listings/11-mr7ucly4` now render
`[data-testid="listing-detail-view"]` (`gridCol: 2`, `cursorZoom: 5` present); the server console no
longer emits the "Functions cannot be passed" error on either route. The one remaining browser
console entry on both routes is an unrelated 404 for `/_vercel/speed-insights/script.js` (not served
in this local environment, present on every route, pre-existing, out of scope).

**This is reported as a fix, not a finding for the next reviewer to re-triage** — it directly blocks
R4/R7 (the gallery/contact/every other piece of content genuinely was not rendering) and every one of
F2's own AC3/AC6/AC10/AC12/AC14 measurements, so it had to be resolved before those criteria could be
measured at all, and it sits squarely inside two already-in-scope files.

### 13.3 F2 — `scripts/task791-detail-evidence.mjs`, built and run

Built on the shape of `scripts/task785-inert-media-evidence.mjs`: a static file server over
`storybook-static` (for the story half of AC3 only — `ListingsPageFrame.tsx` is untouched by Revision
1, so the existing build, already newer than that file, did not need a rebuild) plus direct Playwright
navigation against the live `next start` server (`LIVE_BASE_URL`, default `http://localhost:3000`) for
everything else, using the same real seeded listing `check:hydration` already uses,
`11-mr7ucly4` (`LISTING_SLUG` env, overridable). Expected clearance values are read from
`theme.ts` at run time via regex (`listingContactBarClearance.base/md`, `spacing['2xl']`), never
duplicated as a bare literal. Results and screenshots retained under `docs/sessions/evidence/task791/`
(`results.json`, 11 `.png` files, one per checked tuple/width).

**Final run — `node scripts/task791-detail-evidence.mjs` → exit 0, all 12 checks pass:**

| AC | Check(s) | Result |
|---|---|---|
| **AC10** | `padding-bottom` at 390/768/1280, `/sq/listings/11-mr7ucly4` | `176px` / `80px` / `32px` — exact match to the theme-sourced expected values at every breakpoint |
| **AC6** | `.mantine-Grid-col` geometry at 768/1023/1024 | 768 & 1023: sidebar column top (1522.6px) sits below the content column's bottom edge (top 169 + height 1333.6 ≈ 1502.6) — **stacked**, contact `display:none`, no side gutter. 1024: both columns share top≈169, sidebar width 320px of a 1024px row — **side-by-side**, contact visible |
| **AC14** | 320px, `uk`, overflow | `scrollWidth === clientWidth` (320/320), breadcrumb `nav` does not overflow its own box, 3 badges rendered, 0 clipped |
| **AC12** | lightbox vs. header/contact stacking, 390 & 1280 × sq/uk | at every tuple, `document.elementFromPoint` at the header probe point resolves inside `[role="dialog"]`; at 1280 (sidebar visible) the contact-card probe point does too |
| **AC3** | breadcrumb DOM, live `/sq/listings` vs. `Patterns/Mantine/ListingsPageFrame` `Default`'s first (no-`intermediate`) instance | both: 1 anchor, structurally identical tag/attribute-name skeleton (locale text, hrefs, CSS-module hash classes and inline-style/attribute *insertion order* stripped/normalized — none of those is what E6's default-`[]` claim is about; the tag+attribute-name shape is) |

Two script-side false negatives were found and fixed during this session, not product defects:
the first AC3 comparator did exact-string `outerHTML` equality (failed on locale text/hrefs/CSS-module
hashes/attribute-order, none of which E6 claims to preserve); replaced with a skeleton comparator that
strips text and attribute values, then sorts attribute names per element before comparing.

**Post-fix full re-run of the reduced §16.7 command list, `win32`, Node `v22.22.3`:**

```
node.exe -p process.platform                                          → win32
node scripts/check-design-tokens.mjs --strict --scope=mantine         → exit 0 (0 violations)
node scripts/task791-detail-evidence.mjs                              → exit 0 (12/12 pass)
npm.cmd run build                                                     → exit 0
npm.cmd run start  (background)                                       → Ready
  GET /sq/listings/11-mr7ucly4 → 200, title present
  GET /en/listings/11-mr7ucly4 → 200, title present
  HYDRATION_LISTING_PATH=/en/listings/11-mr7ucly4 BASE_URL=http://localhost:3000 npm.cmd run check:hydration
                                                                        → PASS 5 / FAIL 0 / SKIP 2, exit 0
```

All logs retained: `docs/sessions/evidence/task791/{build-rev1.log, start-rev1.log,
hydration-rev1.log, design-tokens-scoped-rev1.log, typecheck-rev1.log, lint-rev1.log,
vitest-theme-d69-18-rev1.log, vitest-listings-rev1.log, task791-detail-evidence-rev1.log,
results.json, *.png}`.

### 13.4 F6/F7/F8 (P3, non-blocking) — not addressed this revision

`§16.7` narrowed Revision 1's scope to F1+F2. F6 (assert the preload `<link>` is a `<head>` child),
F7 (assert both DOM states — frame removed, shell revealed — around the hydration swap) and F8 (add
the `docs/backlog.md` row to the session log's own Files Changed table) remain open; none blocks R1-R12.

### 13.5 Requirement/AC status after Revision 1

R9/AC9 and R3/R6/R7/R10 with AC3·AC6·AC10·AC12·AC14 — **closed this revision**, evidence above.
Everything §16.1 already closed stands unchanged. R7's admin-preview half (a verified staff session)
remains open, per §12 item 4 above — unrelated to F1/F2, not attempted this revision.

### 13.6 Files changed this revision

| File | Reason |
|---|---|
| `src/design-system/mantine/theme.ts` | F1 — new `other.layout.listingContactBarClearance` token (D71-4) |
| `src/modules/listings/components/ListingDetailView.tsx` | F1 — `pb` consumes the token; also the §13.2 fix (dead `galleryLabels` construction/pass removed) |
| `src/design-system/mantine/patterns/MantineListingDetailPattern.tsx` | §13.2 fix — `galleryLabels` made optional |
| `src/design-system/mantine/__tests__/theme.d69-18.test.tsx` | F1 — value assertion + mechanical-consumer row |
| `scripts/task791-detail-evidence.mjs` | F2 — new evidence script |
| `docs/backlog.md` | state update (Last Session line, Sprint 71 registry line) |
| `tasks/Sprints/Sprint_71_The_Listing_Detail_Route_Leaves_Tailwind.md` | Tasks table row updated to match |
| `docs/sessions/2026-09-05-task791-listingdetailview-canonical-mantine-composition.md` | this §13 |
| `docs/sessions/evidence/task791/*` | fresh Revision 1 logs + `results.json` + 11 screenshots |

### 13.7 Status

**`IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`.** No self-approval; the §13.2 fix is reported as a
factual change with its verification, not as a review verdict. Opus should independently inspect: the
`galleryLabels?`/removal diff (is dropping the dead prop the correct fix, versus some other shape);
the F1 token diff and its one deviation (the extra `!`); the AC3 comparator's normalization choices
(is "attribute-name skeleton, values stripped" the right definition of "DOM identical" for this
criterion, or too loose); and whether F6/F7/F8/admin-preview should gate this task's close or continue
as open items into 792-796.

## 14. Revision 2 (2026-09-06) — R13, per kickoff §18.3

Executor: fresh Sonnet session. Platform `win32`, Node `v22.22.3`, working directory
`C:\Claude_Code_Projects\lero-al`. Between Revision 1 and this session, the kickoff, `docs/backlog.md`
and the sprint file changed on disk (owner visual review, kickoff §18): Card radius 8px and the
proportional sidebar were **accepted as-is**; the `h1` was **returned** — R13 requires 32px below the
`sm` gate (640px), 36px at/above it; and `ListingContact.tsx:309` was fixed in place
(`bottom-14 md:bottom-0` → `bottom-0`) under owner authorisation, externally, before this session —
not touched here. Scope for this session was R13 only, per §18.3's own line ("the only code
requirement").

### 14.1 Implementation

- `src/design-system/mantine/theme.ts` — `other.layout.listingDetailTitleMobileFz: string` (type,
  `theme.ts:155`) / `'2rem'` (value, `theme.ts:503`, `// 32px — Task 791 R13`), following the D69-18
  named-geometry convention the kickoff cites, beside the Revision 1 `listingContactBarClearance`
  member.
- `src/design-system/mantine/patterns/MantineListingDetailPattern.tsx` — the `h1` gained
  `fz={{ base: theme.other!.layout!.listingDetailTitleMobileFz, sm: 'var(--mantine-h2-font-size)' }}`,
  keeping `size="h2"` (still supplies `--title-fw`/`--title-lh` — confirmed from `@mantine/core`'s
  `Title.mjs`/`get-title-size`; `fz` only overrides `font-size`, via the standard Mantine Box
  style-props system already used elsewhere in this file, e.g. `ListingsPageFrame.tsx`'s `px={{...}}`).
  `theme` was already `useMantineTheme()`-resolved in this `'use client'` component — no new hook, no
  new import.
- `scripts/task791-detail-evidence.mjs` extended with `EXPECTED_H1_MOBILE_PX` /
  `EXPECTED_H1_DESKTOP_PX` / `SM_GATE_PX`, all read from `theme.ts` at run time (never hardcoded), and
  four checks: `r13-h1-live-639/640` (live route) and `r13-h1-story-639/640`
  (`Patterns/Mantine/ListingDetailPattern` `Default`, `storybook-static` rebuilt first via
  `npm run build-storybook`, since the pattern's own markup changed).

**One script bug found and fixed in-session, not a product defect.** The first story-side selector
(`document.querySelector('h1')`) matched Storybook's own `sb-nopreview_heading` fallback `<h1>` —
present-but-hidden in the DOM at every story render, computed `fontSize: 14px` — instead of the
pattern's own `Title`. Confirmed by a throwaway debug script listing every `<h1>` in the story
iframe: the "No Preview" heading came first in document order, followed by six real `Title` instances
(the story renders the Default state plus one state per E1-E5 extend), all correctly 32px at 639px.
Both the live and story selectors were narrowed to `h1.mantine-Title-root`.

### 14.2 Verification

`win32`, Node `v22.22.3`, `C:\Claude_Code_Projects\lero-al`:

```
node.exe -p process.platform                                          → win32
npm.cmd run typecheck                                                  → exit 0
npx.cmd eslint theme.ts MantineListingDetailPattern.tsx               → exit 0
npm.cmd run build                                                      → exit 0
npm.cmd run build-storybook                                            → exit 0
npm.cmd run start  (fresh build, background)                          → Ready
node scripts/task791-detail-evidence.mjs                              → exit 0, 16/16 checks
node scripts/check-design-tokens.mjs --strict --scope=mantine         → exit 0 (0 violations)
npm.cmd run check:story-coverage                                       → exit 0 (27/27 covered)
HYDRATION_LISTING_PATH=/en/listings/11-mr7ucly4 BASE_URL=http://localhost:3000 npm.cmd run check:hydration
                                                                        → PASS 5/FAIL 0/SKIP 2, exit 0
npx.cmd vitest run src/design-system/mantine/__tests__/theme.d69-18.test.tsx
                                                                        → 57/58 (Task 790 pre-existing,
                                                                          unchanged from Revision 1)
npx.cmd vitest run src/modules/listings                                → 559/561 (Task 790 pre-existing,
                                                                          unchanged from Revision 1)
```

The four new evidence-script checks:

```
✅ r13-h1-live-639:  {"pass":true,"width":639,"expectedPx":32,"measured":{"fontSize":"32px"}}
✅ r13-h1-live-640:  {"pass":true,"width":640,"expectedPx":36,"measured":{"fontSize":"36px"}}
✅ r13-h1-story-639: {"pass":true,"width":639,"expectedPx":32,"measured":{"fontSize":"32px"}}
✅ r13-h1-story-640: {"pass":true,"width":640,"expectedPx":36,"measured":{"fontSize":"36px"}}
```

All 12 Revision 1 checks re-ran green in the same pass (16/16 total) — no regression.

### 14.3 The `<640` vs "≤640" gap — reported, not resolved

Kickoff §18.3 flagged this itself: Mantine's `sm` breakpoint is `min-width: 40em` (640px), so the
`fz` object's `sm` arm applies **from** 640px — the actual split implemented is `<640` / `≥640`, not
`≤640` / `>640` as the owner's instruction read literally. A new breakpoint at 641px would be needed
for the literal reading, and §8 still forbids adding one. Implemented as `<640`, per the kickoff's own
direction to report rather than resolve unilaterally. Measured and confirmed: 639px → 32px,
640px → 36px.

### 14.4 Files changed this revision

| File | Reason |
|---|---|
| `src/design-system/mantine/theme.ts` | R13 — new `other.layout.listingDetailTitleMobileFz` token |
| `src/design-system/mantine/patterns/MantineListingDetailPattern.tsx` | R13 — `h1` responsive `fz` |
| `scripts/task791-detail-evidence.mjs` | R13 — four new checks + selector fix |
| `docs/backlog.md` | state update (Last Session, Sprint 71 registry line) |
| `tasks/Sprints/Sprint_71_The_Listing_Detail_Route_Leaves_Tailwind.md` | Tasks table row updated |
| `tasks/Sprints/Sprint_71_kickoff_prompt_Task_791_…md` | §19 (executor completion report) |
| `docs/sessions/evidence/task791/*` | fresh Revision 2 logs + updated `results.json`/screenshots |

### 14.5 Status

**`IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`.** R13 closed with rendered evidence on both the live
route and the canonical story. Open for the separate Opus reviewer: the `<640`-vs-"≤640" flag
(§14.3); whether `fz` overriding font-size while `size="h2"` supplies weight/line-height is the
intended mechanism; and the standing items already carried from Revision 1 (§13.7) — F6/F7/F8,
admin-preview (R7/AC7), and the remaining unrecorded D71-2 visual-matrix tuples.
