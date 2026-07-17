# Task 616 (re-scoped) — ALL-Mantine `ListingDetailPattern` production rebuild: new gallery pattern (→ Mantine lightbox), new contact-card pattern, rebuilt detail pattern, zero legacy primitives

Sprint 44 (Epic MM Phase-2). Kickoff: `tasks/Sprints/Sprint_44_kickoff_prompt_Task_616_ListingDetailPatternProductionRebuild.md`.
This is the v2 re-scope after the owner rejected the first 616 attempt for reproducing legacy `@/components/ui/*`
chrome (legacy `Badge`/`Button`/`Avatar`) inside a `Patterns/Mantine/*` story — see `docs/backlog.md` Last Session
history for the full v1 postmortem. v1's off-track WIP was reverted by the owner before this session started.

## Deliverables

- **D1 — `MantineListingGalleryPattern`** (new): the main photo is a Mantine `Image` inside an `UnstyledButton`;
  clicking it (or a thumbnail) opens a Mantine fullScreen-`Modal` lightbox — the pattern owns
  open/active-index/prev/next/select state and renders the Task 612 `LightboxView` primitive as the modal itself
  (single source of the lightbox chrome, per the kickoff's "gallery owns state, LightboxView renders the modal"
  contract). Thumbnail row (up to 4) + "+N" overlay + photo-count pill. No-image skeleton fallback (non-clickable).
- **D2 — `MantineListingContactPattern`** (new): all-Mantine sticky contact card mirroring `ListingContact.tsx`'s
  desktop sidebar content — agent block (`Avatar`+verified `ThemeIcon`+subtitle), price block, Call/WhatsApp
  (Task 615 `Flex direction={{base:'column',sm:'row'}}` + `minWidth:0` + wrapping `<span>` CTA fix, reproduced
  here since this pattern now OWNS that chrome), favorite/inquiry/report as positioned nodes (Task 605 hook-free
  split). Five states: `normal` / `guestCta` / `ownerDeleted` / `ownerUnavailable` / `closedListing`.
- **D3 — `MantineListingDetailPattern`** (rebuilt): composes D1 + D2 + an all-Mantine info block (badges row,
  title, price+per-sqm+struck-original, meta row, key-features card, description card, amenities card). Keeps
  the Task 609 `gutter={0}` + `pr`/`mb` gap mechanism unchanged.

## Demo-content source-of-truth (cited, not invented)

- **Key features** — `presentationEngine.ts:138` `getDetailFeatures()` order (rooms→bathrooms→area→floor);
  icons cited to `propertyTypeSchema.ts` `FIELD_DEFAULTS` (`iconInCard` for rooms/floor = bed-double/building,
  matching `ListingCardPattern.stories.tsx demoFeatures`); short labels (new keys) + distinct values
  (`3 · 2 · 85 m² · 3/5`) — fixes the v1-rejected full-phrase-as-label + duplicate-value defect.
- **Amenities** — `getDetailAttributes()` order (condition→heating→wall_type), mirrors `condition_good`/
  `heating_central`/`wall_brick` content from the app `listing` namespace, ported to new `storybook.mantine.*` keys.
- **Description** — new real multi-sentence `storybook.mantine.listing_detail_description` key, all 4 locales.
  `empty_description` is gone (the v1-rejected defect).
- **Badges/price/meta/contact** — reused existing `storybook.mantine.card_*` keys per the kickoff's explicit list
  (`card_title_1`, `card_location_tirana`, `card_price_1/_old_1/_per_sqm_1`, `card_badge_new/premium/reduced`,
  `card_type_label`, `card_footer_date`, `card_favorite_aria_*`, `listing_contact_call/_wa`).
- **35 new `storybook.mantine.*` keys** added to all 4 `messages/*.json` (short feature labels, amenity
  label/value pairs, description+title, amenities title, agent name/company, verified/share/inquiry/report/
  guest/deleted/unavailable/closed copy, section captions). Each write read back + `JSON.parse`-verified
  (clause 14) — see "Verification" below.

## Two defects found and fixed mid-task (both from live rendered review, not guessed)

1. **Badge cascade-layer + design-language bug.** First pass drove badge color via a Tailwind `className`
   (`bg-badge-new text-primary-foreground`, copied from the legacy `ListingDetailView.tsx`/`ListingCardPattern
   .stories.tsx` precedent) on a **Mantine** `<Badge>`. `node_modules/@mantine/core/styles/Badge.css` sets
   `background: var(--badge-bg)` as an **unlayered** rule (no `@layer` wrapper) — the same cascade-layer trap
   already documented for `ActionIcon`/`Card` (Task 602/606/612) — so a `@layer utilities` Tailwind class can
   never win. Owner review (`AskUserQuestion`) additionally flagged that even a working override would just be
   Mantine's shell wearing legacy visual language, not the codebase's actual Mantine `Badge` idiom (canonical
   `Mantine/Primitives/Badge` story uses `color="green"`/`"yellow"`/`"red"` + the theme's default `variant='light'`
   soft background). **Fix:** dropped the CSS-var-override approach entirely; badges now use native Mantine
   `color` prop (`BADGE_TONE_COLOR: {new:'green', premium:'yellow', reduced:'red'}`) with the theme's default
   `variant='light'`, matching `Badge.stories.tsx` byte-for-byte in idiom (type badge stays `variant="outline"
   color="gray"`, unchanged).
2. **Story-only sticky-offset gap (not a component bug).** Owner screenshot showed the contact card starting
   ~64px below the gallery photo's top edge. Measured via a scoped Playwright probe: gallery `top:16` vs contact
   `top:80` — exactly the pattern's own `position:'sticky', top:80` (Task 615/legacy `top-20` header-clearance
   value). Root cause: `Header.tsx` is a normal in-flow bar (not sticky/fixed; grep-confirmed), so on the real
   page the header + breadcrumb bar already occupy >80px above the fold at scroll=0 and the sticky constraint
   never visibly triggers there. The isolated Storybook story has no such chrome above it, so the sticky `top:80`
   floor holds the card down from the very first paint while the gallery (not sticky) sits at the story's own
   16px padding — a story-only visual artifact. **Fix:** `ListingDetailPattern.stories.tsx`'s wrapper padding
   changed from `padding:'var(--mantine-spacing-md)'` to `{padding:'var(--mantine-spacing-md)', paddingTop:80}`
   (matches the pattern's own already-cited 80px value, story-only — the component itself is untouched and
   remains production-correct).

Both fixes verified via a throwaway scoped Playwright probe (`getBoundingClientRect` on the gallery `<img>` and
the sticky `.mantine-Paper-root`) before committing to a full rebuild+gate cycle — deleted after use, not
committed.

## Verification

**`npx tsc --noEmit`** → 0 errors (re-run after every edit, final state clean).

**`npm run check:i18n`** → ✅ PASSED — all 4 locale files 2199 keys (parity).

**`npm run check:mojibake`** → 0 artifacts in 1768 files.

**`npm run check:file-integrity`** → ✅ PASSED — all 17 changed/untracked files clean (NUL/BOM/JSON-parse/
`node --check`/truncation). Each `messages/*.json` write was read back + `JSON.parse`-verified inline
(`node -e "require('./messages/X.json')"` per locale) immediately after every edit — no unterminated-string
repeat of the v1 defect.

**`npm run check:stories`** → ✅ PASSED — 119 files, 0 violations. One real finding fixed mid-run: Check 8
(`uk.json` Cyrillic-only) flagged `listing_detail_agent_company: "Prime Realty Tirana"` (pure Latin, no
allowlist match) — fixed by transcribing the demo company name into Cyrillic (`"Прайм Реалті Тирана"`) for
`uk.json` only; en/sq/it keep the Latin form (proper noun, not transliterated Ukrainian prose).

**Mantine purity gate (AC1):** `grep -rn "@/components/ui/" <in-scope files>` → 0 real import matches (2 matches
are inside JSDoc prose citing the rule itself, not imports) — verified after every edit, final state clean.

**`npm run build-storybook`** → succeeds cleanly (re-run 4× across the session: initial, badge fix, alignment
fix, planted-violation, revert).

**`npm run screenshots:assert -- --mantine-only`** (952 cells: 59 stories × [320/375/390/1024]×4 locales + 8
per-story extra-viewport cells incl. the new `band-768` for `ListingDetailPattern`):

```
Results: 925/952 PASS, 0 FAIL, 27 AMBIGUOUS (needs-owner-decision)
```

Per-story breakdown (read directly from `manifest.json`, not eyeballed):

| Story | Cells | Verdict |
|---|---|---|
| `Patterns/Mantine/ListingGalleryPattern/Default` | 16/16 | ✅ all PASS |
| `Patterns/Mantine/ListingContactPattern/Default` | 16/16 | ✅ all PASS |
| `Patterns/Mantine/ListingDetailPattern/Default` | 20/20 | ✅ all PASS (incl. the new `band-768` cell) |

All 27 AMBIGUOUS cells are pre-existing, unrelated `Combobox`/`RangeDatePicker`/`NotificationBellView`/`Tabs`
overlap/offscreen-scroll findings — byte-identical set to the pre-task baseline, zero new ambiguity introduced.

**Anti-regression proof (clause 13, AC7):** planted a real overflow violation —
`Grid.Col miw={{ base: 900, sm: 0 }}` on `MantineListingDetailPattern`'s left column (forces a 900px-min-width
column inside a 320–390px mobile viewport) — rebuilt Storybook, re-ran the gate:

```
Results: 912/952 PASS, 13 FAIL, 27 AMBIGUOUS (needs-owner-decision)
```

All 13 FAILs were `Patterns/Mantine/ListingDetailPattern/Default` mobile cells (`horizontal overflow detected`
+ cascading `offscreen-control` findings on the gallery photo/thumbnail buttons); every other story's verdict
was unchanged — proving the gate genuinely detects a real regression in the new pattern and wasn't neutered.
Reverted the `miw` addition (grep-confirmed zero residue), rebuilt Storybook, re-ran the gate a third time:

```
Results: 925/952 PASS, 0 FAIL, 27 AMBIGUOUS (needs-owner-decision)
```

Byte-identical to the clean baseline — confirms the revert restored production-correct state.

## Acceptance-criteria self-audit

| AC | Status | Evidence |
|---|---|---|
| 1. Mantine purity, grep=0, planted-violation reverts | ✅ | See "Mantine purity gate" above |
| 2. Three deliverables present, gallery `play` opens lightbox | ✅ | D1/D2/D3 all implemented + exported; `ListingGalleryPattern.stories.tsx` `play` clicks the main photo |
| 3. Demo values/icons/order/labels cited, real description, no `empty_description`, short labels | ✅ | See "Demo-content source-of-truth" above |
| 4. Rendered proof 320/375/390/768/1024×4 locales, lightbox-open proof, TailAdmin chrome | ✅ | `--mantine-only` gate covers 320/375/390/1024×4 + `band-768`; gallery story's `play` captures the OPEN lightbox state in the gate's screenshot |
| 5. `screenshots:assert --mantine-only` 3 new stories PASS, 0 FAIL overall, AMBIGUOUS unchanged, `band-768` cell | ✅ | 16/16, 16/16, 20/20 all PASS; 925/952 overall 0 FAIL; 27 AMBIGUOUS byte-identical pre-existing set |
| 6. Task 615 CTA + Task 609 gutter preserved | ✅ | CTA fix reproduced verbatim in `MantineListingContactPattern`; `Grid gutter={0}`+`pr`/`mb` unchanged in D3 |
| 7. Anti-regression planted → gate FAILs → revert | ✅ | 13 FAIL on plant, 0 FAIL on revert (see above) |
| 8. `tsc`/`check:file-integrity`/`check:mojibake`/`check:stories`/`check:i18n` clean, `messages/*.json` read-back verified | ✅ | See "Verification" above |

## Files Changed

| File | Rationale |
|---|---|
| `src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx` | New (D1) — Mantine photo + owned lightbox state, reuses `LightboxView` as the rendered modal. |
| `src/design-system/mantine/patterns/MantineListingContactPattern.tsx` | New (D2) — all-Mantine sticky contact card, 5 states, hook-free positioned-node split for favorite/inquiry/report. |
| `src/design-system/mantine/patterns/MantineListingDetailPattern.tsx` | Rebuilt (D3) — composes D1+D2 + Mantine badges/price/meta/features-card/description-card/amenities-card; badge coloring fixed to native Mantine `color`+`variant='light'` (see defect #1 above). |
| `src/design-system/mantine/patterns/index.ts` | Barrel exports for the new/changed pattern types. |
| `src/stories/patterns/mantine/ListingGalleryPattern.stories.tsx` | New — `Default` story, `play` opens the lightbox, no-image fallback section. |
| `src/stories/patterns/mantine/ListingContactPattern.stories.tsx` | New — `Default` story, normal/guest/deleted states as a `Stack`. |
| `src/stories/patterns/mantine/ListingDetailPattern.stories.tsx` | Rebuilt — full production-representative fixture cited to `presentationEngine.ts`; `paddingTop:80` story-only spacer fix (see defect #2 above). |
| `messages/{en,sq,uk,it}.json` | 35 new `storybook.mantine.listing_detail_*` keys each (parity verified, read-back + `JSON.parse` per write). |
| `scripts/check-stories-rendered.mjs` | Added `ListingDetailPattern: [{name:'band-768', width:768, height:1024}]` to `MANTINE_STORY_EXTRA_VIEWPORTS` (Task 573 precedent) — persists the Task 615 `uk@768` CTA-wrap proof as a standing gate cell. |
| `docs/backlog.md` | Mark Task 616 done, tidy Last Session / numbering note. |
| `docs/sessions/2026-07-17-task616-listingdetailpattern-production-rebuild.md` | This session log. |

No git commands run (single-writer rule — executor never runs git).
