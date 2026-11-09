### Task 365 — Storybook story batch: RecentlyViewedSection, PasswordInput, PasswordRequirementsHint, AdminLayout, ListingGrid, StatusChangeControl, AdminTable badge

Type:        bug (Storybook hygiene + localization)
Priority:    medium
Area:        Story-only files (+ AdminTable badge-variant logic if the root cause is runtime):
             `src/stories/RecentlyViewedSection.stories.tsx`, `src/components/ui/PasswordInput.stories.tsx`,
             `src/components/ui/PasswordRequirementsHint.stories.tsx`, `src/stories/AdminLayout.stories.tsx`,
             `src/stories/ListingGrid.stories.tsx`, `src/components/admin/StatusChangeControl.stories.tsx`,
             `src/components/admin/AdminTable.stories.tsx` (+ `src/components/admin/AdminTable.tsx` ONLY if badge variant is keyed off a localized string)

Pre-read (mandatory before any code change):
1. docs/agent-contract.md
2. docs/backlog.md
3. docs/rule-index.md → "Storybook / visual snapshot task": docs/storybook-governance.md
   (§8a rendered-QA, §8b canonical taxonomy, §9 forbidden anti-patterns), docs/storybook-visual-snapshots.md,
   docs/component-rules.md, docs/qa-rules.md
4. docs/ui-rules.md §18 (status-label contract) + §19 (mixed-language story contract) — directly relevant to AdminTable badges + locale stories.
5. Reference: `src/modules/listings/components/ListingCard.tsx` (source of truth for ListingGrid parity).
6. Prior art: Task 354-Fix `StoryPurposeNote` pattern + Task 358 canonical taxonomy — read those session logs.
7. Inspect package.json validation scripts.

Localization coverage:
- sq, en, uk, it. Every story listed below must avoid hardcoded single-language text in non-matching
  locale stories (§19). Any string a story renders must come from `messages/*.json` or be supplied per
  locale. `check:i18n` PASS.

Responsive coverage:
- 320, 375, 390, 768, 1280, 1440, 2560. RecentlyViewedSection horizontal scroll is the key 320/375 check.

Current behavior to preserve:
- All listed story files: existing scenario-named exports and the components they document. Do NOT
  delete coverage; fix/extend it. §8b taxonomy (no per-width export names) preserved.
- `AdminTable.tsx`: if touched, preserve the Task 354/357/358 canonical contract (sort + hide-column
  menus + Columns manager + global search, ≤14 stories, no filter chips, no forbidden icons).
- StatusChangeControl is an existing canonical primitive — do NOT change its runtime; only clarify its story.

Bug / Goal (one cohesive low-risk batch — disjoint files):
1. **RecentlyViewedSection** —
   (a) the "Clear" control is a raw `<button>` (storybook-governance §9 violation): replace with the
   canonical `Button` from `@/components/ui/button`, ensure it has the correct **pointer** (`cursor-pointer`)
   and an **action preview** in Storybook (wire an `onClick` via `fn()` from `@storybook/test` /
   args action so the Actions panel logs it);
   (b) **incorrect localizations** — remove hardcoded Albanian text (`'Qira'`/`'Shitje'`/`'Apartament'`
   in `StoryCard`, line ~34) and provide correct text for all four locales (use `useTranslations` keys
   or per-locale fixtures); no mixed-language canvas (§19);
   (c) **horizontal scrolling doesn't work on small screens** — fix so the mobile horizontal scroll
   row actually scrolls at 320/375 (verify the `flex … overflow-x-auto` row + `w-48 shrink-0` cards;
   if the runtime `RecentlyViewedGrid` shares the bug, note it — but scope the FIX to the story unless
   the grid markup itself is broken, in which case STOP & ASK before editing runtime).
2. **PasswordInput** — incorrect localizations → correct texts for all four locales in the story
   (no English-only for a localized component; §19).
3. **PasswordRequirementsHint** — same: full four-locale story coverage with correct texts.
4. **AdminLayout** — buttons have **no action previews** → wire `fn()`/args actions so clicks log in
   the Storybook Actions panel; use canonical `Button` (no raw `<button>`).
5. **ListingGrid** — the Storybook `StoryListingCard` (lines ~26–73) is missing fields the live
   `ListingCard` shows. Bring it to **field-parity** WITHOUT introducing auth/Supabase/live-API deps
   (§9): add the missing presentational fields — listing-type + property-type label line; price block
   with old/reduced price + per-m² price; status badges (new / price_reduced / sold / rented /
   archived overlay); photo-count chip; favorite-button affordance (visual stub, no server action);
   public-id "#id" with copy affordance (visual); relative time; premium top-stripe + premium border.
   Keep it fixture-driven and locale-safe.
6. **StatusChangeControl** — add an in-canvas `StoryPurposeNote` (Task 354-Fix pattern) + clearer docs
   description explaining: it is the canonical tiered status-change primitive — `variant="select"` for
   low-stakes (Inquiries), `variant="workflow"` for moderation (Support tickets, Listings); where it is
   used. (Answers the owner's "what is this / where do we use it?" question.) No runtime change.
7. **AdminTable** — **badge styles differ between locales, and in some locales all badges are gray
   regardless of status.** Root-cause: a badge `variant` selected from a **localized label string**
   instead of the **status code**. Make the badge variant derive strictly from the status **code**, so
   badge colors are **identical across all four locales** and never collapse to gray. If the bug is in
   `AdminTable.stories.tsx` fixtures only → fix there; if `AdminTable.tsx` maps variant off a localized
   string → fix at the code level (Note 14: fix once, all consumers). Follow ui-rules §18 (status-label
   contract: human-readable label + code-driven variant).

Required after behavior: (per component, in Storybook; rendered cells = OWNER QA REQUIRED if no browser)
- RVS: canonical Button clear control with pointer + Actions-panel log; all-locale correct text, no
  mixed language; horizontal scroll works at 320/375; grid at sm+.
- PasswordInput / PasswordRequirementsHint: correct texts in sq/en/uk/it; switching the locale toolbar
  shows fully localized content.
- AdminLayout: clicking buttons logs an action in the Actions panel; canonical Button used.
- ListingGrid: story card visually matches the live ListingCard field set; fixture-driven; no auth/API.
- StatusChangeControl: purpose note + docs visible; reader understands what/where.
- AdminTable: badge colors identical across all four locales and correct per status; no all-gray locale.

Required investigation:
1. Read each listed story file; for AdminTable also read `AdminTable.tsx` badge/variant logic to find
   whether variant keys off code or label.
2. Read `ListingCard.tsx` to enumerate the exact fields to mirror (already provided above).
3. Confirm `fn()`/action wiring approach used elsewhere in the repo's stories (consistency).

Acceptance criteria:
- One AC per numbered Goal item (1a/1b/1c, 2, 3, 4, 5, 6, 7), each verifiable at file:line.
- No raw `<button>` remains in these stories; canonical Button used (grep clean, §9).
- No mixed-language locale stories (§19); `check:i18n` PASS; any new keys in sq/en/uk/it identical set.
- AdminTable badge variant derives from status code; identical across locales (§18).
- §8b taxonomy preserved (scenario-named, no per-width exports); existing coverage not deleted.
- Positive + Negative flow parity in diff.
- 0 new lint/warnings; `tsc` → 0; `build-storybook` passes.
- 7 breakpoints × 4 locales considered; rendered = OWNER QA REQUIRED if no browser (§8a) — do NOT self-mark PASS.
- backlog.md updated; session log with Note 18 block + §17 UI pre-flight + Files Changed table.
- No `git add`/`git commit` from executor.

Positive flow (happy path):
- Actor: developer reviewing each story in Storybook (+ locale/viewport toolbars).
- Steps: open each component story → controls are canonical, text is fully localized per the toolbar
  locale, RVS scrolls at 320, ListingGrid card matches live fields, AdminTable badges are colored and
  identical across locales, AdminLayout/RVS buttons log actions, StatusChangeControl explains itself.
- Success: every reported defect visibly resolved.

Negative flow:
- **Locale switch (uk/it/sq):** trigger = toolbar locale change → no English scaffolding leaks into a
  non-en story (§19); RVS card type label localizes (not hardcoded 'Qira/Shitje/Apartament').
- **Empty state:** RVS empty story still renders the empty message, no clear button when no items
  (preserve existing `EmptyState` export).
- **Long label (uk) at 320:** ListingGrid/RVS card titles clamp; badges/labels don't overflow.
- **RawKeyStress / unknown status:** AdminTable badge for an unknown status code → safe fallback
  variant (documented), NOT silently all-gray for a known status.
- **Action not wired:** if a button has no handler → it must still log via the args action (no dead control).
- **Horizontal scroll at 320:** RVS row must actually overflow-scroll, not clip/stack incorrectly.

Out of scope:
- Do NOT add auth/Supabase/live-API/`fetch` to any story (§9).
- Do NOT change StatusChangeControl / PasswordInput / PasswordRequirementsHint **runtime** components
  (story-only) — except AdminTable.tsx IF and ONLY IF the badge variant bug is in runtime.
- Do NOT touch Tabs/Button/Sheet/Dialog/FilterBar/PhoneField/LocationCombobox/Select — those are Tasks 360–364.
- Do NOT rename/delete existing scenario exports.
