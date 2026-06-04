### Task 381 — CORRECTIVE B: De-hardcode ALL stories/fixtures onto the i18n layer + delete redundant Ukrainian stories

> # 🔴 Depends on Task 380 (canvas + `storyT` + gates) being implemented AND orchestrator rendered-reviewed.
> Owner found hardcoded English (and stray Ukrainian) content in nearly every story, and redundant
> `Ukrainian*`/`MobileFormUkrainian`-named stories that duplicate the locale toolbar. This task removes ALL of it,
> globally, using the Task 380 i18n layer. The Task 380 gates must already FAIL on any reintroduced hardcode.

Type:      corrective i18n sweep — story/fixture content de-hardcode + redundant-story removal
Priority:  CRITICAL
Area:      ALL `*.stories.tsx` + `src/stories/StoryListingCard.tsx` + `src/stories/fixtures/**` + `messages/*` (`storybook.*`)

## Required pre-read
`docs/agent-contract.md` (7, 11, 12, 13) · `docs/backlog.md` · `docs/storybook-governance.md` (fixture i18n rule +
Enforceable gates) · `docs/component-rules.md` · `docs/qa-rules.md` · Task 380's session log + `src/stories/_storyI18n.ts`.

## Current broken behavior (file evidence)
- `listing.fixture.ts` (English titles + 1 hardcoded uk title), `select.stories.tsx`/`Combobox.stories.tsx`
  (hand-maintained option maps; English in "Long Label Locale Stress"), `AdminTable.stories.tsx`
  (`role:'Agent'/'User'/'Moderator'`), `button.stories.tsx` (`AllVariantsDemo` `['Primary',…]`), AdminCardList
  ticket subjects, ListingGrid/RVS titles — raw literals leaking across sq/uk/it.
- Redundant pinned/duplicate stories: `PasswordInput.UkrainianLocaleStress`, `PasswordRequirementsHint.UkrainianLocale`,
  `input.MobileFormUkrainian`, `EmptyState.UkrainianLocale`, `RecentlyViewedSection.UkrainianLocale` (+ any
  per-component hardcoded-uk render fns). Owner: **delete these**; the locale toolbar already covers uk.

## Required after behavior
1. **Every user-facing string** in every story file, in `StoryListingCard.tsx`, and in every fixture comes from
   `storyT`/`t` against `storybook.*` (or an existing app namespace) with full sq/en/uk/it parity. Zero raw
   user-facing literals (the Task 380 lint rule + `check:stories` must pass on the result, and FAIL if any
   literal is reintroduced).
2. **Delete the redundant Ukrainian/locale-pinned stories** named in the owner list. Where a real stress scenario
   is wanted, keep exactly **one** toolbar-reactive `LocaleStress` export per component (longest-string content
   from the uk `storybook.*` values), never named "Ukrainian", never pinned to uk, never a hardcoded uk fixture.
   (Many components already have a correct `LocaleStress` — remove only the duplicate `Ukrainian*` ones.)
3. `AllVariantsDemo` and similar inline label arrays become locale-aware via `storyT`.
4. Select/Combobox option labels come from `storybook.*` (single source, all 4 locales) — no per-file hand maps.

## Exact files allowed to edit
All 26 `*.stories.tsx`, `src/stories/StoryListingCard.tsx`, `src/stories/fixtures/**`, `messages/{sq,en,uk,it}.json`
(`storybook.*` keys only, full parity), `docs/storybook-governance.md`, `docs/backlog.md`, new session log.
**NO runtime product-component edits** — if a story cannot de-hardcode without a component change, STOP&ASK
(route to Task 382). NO `.storybook/*`, `eslint`, or gate-script edits (owned by Task 380).

## Current behavior to preserve
Every PASS story keeps rendering; scenario-named exports (no width suffixes); `StoryListingCard` stays the single
shared helper for ListingGrid + RecentlyViewedSection; the canonical `LocaleStress` export per component remains.

## Positive flow
Open every story in sq/en/uk/it via the toolbar → all visible text is in the toolbar language; no English leak on
sq/uk/it; ListingGrid/RVS/AdminCardList titles localized; Select/Combobox labels localized; no `Ukrainian*` story
remains in the sidebar.

## Negative flow (verify per file)
- Any remaining raw literal → `check:stories`/lint FAILs (must be 0). - Any `Ukrainian*` export → gate FAILs (0).
- Missing uk `storybook.*` key → `check:i18n` FAILs (add it). - A `LocaleStress` story pinned to uk → not allowed
  (toolbar-reactive only). - StoryListingCard duplicated instead of shared → reject.

## Acceptance criteria
- AC1 `check:stories` + `npm run lint` pass; grep for raw user-facing literals across all stories/fixtures → 0
  real hits (raw output + triage in log).
- AC2 The named redundant Ukrainian/MobileFormUkrainian stories are deleted (grep `/Ukrainian/` in stories → 0);
  each component retains its single toolbar-reactive `LocaleStress`.
- AC3 `storybook.*` keys cover all migrated strings with sq/en/uk/it parity (`check:i18n` PASS, key count logged).
- AC4 Rendered matrix (from `responsive-screenshots --assert`): every story shows localized content in all 4
  locales at the required breakpoints; uk@320/375/390 mandatory; PNG/JSON artifacts referenced per cell.
- AC5 No runtime component changed (story/fixture/messages only); any needed component change STOP&ASK'd to 382.

## Out of scope
Canvas/gates (380); Tabs/Select/AdminLayout/RVS/Skeleton layout defects (382); final sweep (383).

## Required validation
`npx tsc --noEmit` · `npm run lint` · `npm run check:i18n` · `npm run check:stories` · `npm run build-storybook` ·
`responsive-screenshots --assert` · grep gates · AC self-audit · rendered matrix.

## Required Sonnet evidence format
Same Sprint 33 standard as Task 380: machine-produced screenshots / command transcripts are the ONLY proof;
"no browser access" is not acceptable (run `responsive-screenshots --assert`). Report = AC table + command
transcript + grep raw outputs/triage + rendered matrix (uk@320/375/390 mandatory) + STOP&ASK log + Files Changed
table. INCOMPLETE if any required rendered cell is NOT CHECKED. NO `git add`/`commit`.
