### Task 370 — RecentlyViewedSection story: field-parity with live ListingCard

> **Status: READY (priority: medium — owner rendered-QA, 2026-06-03).** Extends Task 365 parity (which covered
> ListingGrid only) to RecentlyViewedSection. **Story-only** — no runtime component change expected.
> **You are Sonnet 4.6 executor.** Do NOT change scope. STOP and ASK if the live card markup must change.
> Single-writer git: no `git add`/`commit`; end with a "Files Changed" table — the orchestrator emits commits.

```
Type:     storybook parity (story-only)
Priority: medium
Area:     src/stories/RecentlyViewedSection.stories.tsx
```

## Pre-read (mandatory)
1. `docs/agent-contract.md`
2. `docs/backlog.md`
3. `docs/rule-index.md` → **Storybook / visual snapshot** bundle: `docs/storybook-governance.md`, `docs/storybook-visual-snapshots.md`, `docs/component-rules.md`, `docs/qa-rules.md`
4. Prior art: Task 365 ListingGrid parity — `StoryListingCard` mirrors the live `ListingCard` field set (`src/stories/ListingGrid.stories.tsx`); reuse it, do NOT clone a second mock card (Note 14).
5. Live reference: `src/modules/listings/components/ListingCard.tsx` (full field set).

## Defect (owner QA)
The RecentlyViewedSection story renders a simplified card (placeholder image, "For sale · Apartment", title, price,
location) that does NOT match the live `ListingCard` the owner sees in the app (map/photo image, price in the user's
currency + `€/m²`, beds · baths · area, premium border, photo count, days-ago, favorite heart, status badge).

## Required after behavior
- RecentlyViewedSection story uses the **same canonical `StoryListingCard`** that ListingGrid uses (Task 365), so the
  card shows the full live field set: image, status/premium treatment, price + `€/m²`, beds/baths/area, location,
  photo count, days-ago, favorite control.
- Keep the RVS-specific layout (mobile horizontal scroll `w-48` cards no-scrollbar → `sm:` 2-col → `md:` 3-col → `lg:` 4-col)
  and the profile-only `clearSlot` "Clear history" control — do NOT regress these.
- If `StoryListingCard` is not exported/reusable, refactor it to a shared story helper and reuse it in BOTH ListingGrid
  and RecentlyViewedSection (single source — Note 14). If that requires touching runtime, STOP and ASK first.

## Positive flow
Open RecentlyViewedSection story → cards match live ListingCard fields; mobile = horizontal scroll, sm/md/lg = 2/3/4-col grid; "Clear history" present in the profile variant.

## Negative flow
Empty history → empty state unchanged; locale switch (uk) → all card labels localized, no clipping at 320; long uk titles wrap; no horizontal overflow at 320.

## Acceptance criteria
- AC1 RVS cards reach field-parity with live `ListingCard` via the shared `StoryListingCard` — verifiable in the story diff.
- AC2 RVS responsive layout (mobile scroll → 2/3/4-col) + `clearSlot` preserved.
- AC3 No duplicate mock-card component (reuse, don't clone).
- AC4 Story-only; no runtime change (or STOP&ASK documented if a shared refactor needs runtime).
- 0 new lint/tsc; `build-storybook` passes; `check:i18n` PASS; Note 18 self-validation + Files Changed table.
- Rendered cells = OWNER QA REQUIRED (§8a).

## Out of scope
Changing the live `ListingCard` runtime · changing RVS data/business logic · the 4 fixes in Task 369 · any other story.
