### Task 392 — Form-agnostic RENDERED detector (DOM-based) for hardcode AND adaptation, across every story × 4 locales

> # 🔴 WHY THE APPROACH CHANGES. The static regex gate (`check:stories`) keeps leaking because it only matches
> specific SYNTACTIC forms (JSX `prop="…"`, same-line text). Real hardcode hides in forms it never checked —
> proven now: `args:{ placeholder:'Enter password' }` (object property), `Section body content` (multi-line text
> child), `{'Content bounded…'}` / `label=".container-wide…"` (expression / leading-dot). A regex scanner will
> always have a form-loophole. The ONLY robust guarantee is to read the **rendered DOM** in each locale and flag
> the actual visible text — independent of how it was authored. This task builds that detector (hardcode +
> adaptation), runs it over EVERY story × sq/en/uk/it, and fixes everything it enumerates.

> ## 🔴 COVERAGE: every `*.stories.tsx` export × sq·en·uk·it × all 14 breakpoints. uk@320/375/390 mandatory.

Type: corrective — rendered DOM detector (form-agnostic) + fix all enumerated hits + specific composition fixes
Priority: CRITICAL (supersedes reliance on the regex gate as the guarantee; static gate stays as fast pre-check)

## Confirmed defects to fix (STARTER list — the detector must enumerate the rest)
HARDCODE/fallback (English on non-en canvas):
- `PasswordInput.stories.tsx:26,30,34` — `args:{ placeholder:'Enter password' }` → renders English all locales.
- `Section.stories.tsx:27` — multi-line text child `Section body content`.
- `Containers.stories.tsx:24,33,74` — `label=".container-wide — max 88rem … public pages"`, `{'Content bounded
  within this container'}` and siblings.
ADAPTATION (<640 full-width / composition):
- `StatusChangeControl` Select not full-width at <640 (all locales).
- `Command` (Inline) not full-width at <640.
- `Skeleton` not full-width / not adapting at <640.
- `AdminLayout/Admin Toolbar` — incorrect at some widths (e.g. 640 tablet: search/filter/add not laid out cleanly).
- `RecentlyViewedSection` — "Очистити історію" must stay on the SAME row as the section title; wrap to its own row
  (left-aligned, not centered) ONLY when the title fills the row. Same flat-flex pattern as the FilterBar fix.
- `ListingCard` — cards in a row have unequal heights; every card in a row must match the tallest (equal-height row).

## Pre-read
`docs/agent-contract.md` (11,12,13) · `docs/storybook-governance.md` §14 · `scripts/check-stories-rendered.mjs`
(existing assert — extend it) · `scripts/check-stories.mjs` · `src/modules/listings/components/RecentlyViewedGrid.tsx`
+ `StoryListingCard.tsx` · `FilterBar.tsx` (reference flat-flex reset pattern) · `design-system.md` (full-width §, grid).

## Required after behavior

### Part A — Rendered HARDCODE detector (form-agnostic)
Extend `check-stories-rendered.mjs` (or a sibling) so that for EVERY story export × sq/en/uk/it it renders the story
and walks the DOM: collect every visible text node + `aria-label`/`placeholder`/`title`/`alt`. Flag any token that
is English/ASCII-Latin and NOT in the proper-noun allowlist (city/person/brand/EUR/URL/DELETE/numbers) **when the
canvas locale is sq/uk/it** (English identical to the `en` render = untranslated). Emit a JSON report:
story · export · locale · viewport · offending text · DOM path. This catches args-object, multi-line text,
expression children, and variable-sourced strings alike — because it reads output, not source.

### Part B — Rendered ADAPTATION detector
In the same pass, per story × <640 widths: assert (a) no horizontal overflow (`scrollWidth<=clientWidth`); (b) each
interactive control (button, select trigger, combobox, tabs, command/search input, the FilterBar/Section/Skeleton
content) is full-width (bounding-box ≈ canvas content width within tolerance); (c) report violations with the
component selector. Cover ALL exports, not just `Default`.

### Part C — Fix everything enumerated + the specific composition items
- De-hardcode all Part-A hits via `storyT`/messages (real translations, 4-locale parity): PasswordInput placeholder,
  Section body text, Containers labels, and any others found.
- Make all Part-B controls full-width at <640 (fix the primitive/story as appropriate; StatusChangeControl select,
  Command input, Skeleton, AdminLayout toolbar at each width).
- **RecentlyViewedSection clear button:** put the section title and "clear history" control in ONE flat flex-wrap
  (title + `[clear]` cluster); cluster sits after the title and only wraps (left-aligned) when the title fills the
  row — NOT centered, NOT always a new row. (Same fix family as FilterBar Task 389.)
- **ListingCard equal heights:** cards in a grid/scroll row stretch to the tallest card in that row (e.g. grid rows
  with `items-stretch` + card `h-full` + internal `flex flex-col` so the body grows). Verify rendered: in a row,
  all cards share the same height across sq/en/uk/it (uk longest titles must not make a taller neighbor stand alone).

### Part D — also patch the static gate (defense-in-depth, not the guarantee)
Add to `check-stories.mjs` Check 10 the missing static forms so the fast pre-check also catches them: object-property
literals (`placeholder:`/`title:`/`label:`/`description:` etc. = 'Englishish'), multi-line JSX text children,
and `{'…'}` expression children. Add a gate test per new form. (The rendered detector remains the real guarantee.)

## Files allowed to edit
`scripts/check-stories-rendered.mjs` (+ maybe new `check-locale-leak.mjs`), `scripts/check-stories.mjs`,
`scripts/__tests__/check-stories.test.ts`, the flagged `*.stories.tsx` + fixtures + `StoryListingCard.tsx`,
`src/modules/listings/components/RecentlyViewedGrid.tsx` and any primitive needed for full-width (STOP&ASK before a
broad component change), `messages/{sq,en,uk,it}.json` (real translations, parity), `package.json`,
`.github/workflows/governance-pr.yml`, `docs/storybook-governance.md` §14, `docs/backlog.md`, session log.

## Acceptance (machine-evidenced, all 4 locales × all breakpoints — NO syntax-form excuses)
- AC1 Rendered hardcode detector exists, runs every story × sq/en/uk/it, emits a JSON leak report. BEFORE: lists the
  starter hits + any others. AFTER: **zero** leaks on sq/uk/it. uk@320/375/390 mandatory.
- AC2 Rendered adaptation detector flags <640 non-full-width / overflow per story; AFTER: zero violations; the
  StatusChangeControl/Command/Skeleton/AdminLayout items each shown full-width at <640 (PNG per locale).
- AC3 RecentlyViewedSection clear button shares the title row (wraps left-aligned only when title fills it) — PNG in
  4 locales at 320/375/desktop. ListingCard rows are equal-height — PNG showing a uk row with a long-title card and
  its neighbors at the SAME height.
- AC4 Static gate Check 10 extended to object-property + multi-line text + expression children, each with a gate
  test (bad fails / good passes); `npm test` green.
- AC5 `node check-stories.mjs`, the rendered detector, `npm test`, `check:i18n`, `screenshots:assert` all green;
  transcripts + the detector reports attached.

## Validation
`node scripts/check-stories.mjs` · the rendered detector (all 4 locales) · `npm test` · `npm run check:i18n` ·
`npm run build-storybook` · `npm run screenshots:assert` · the JSON leak/adaptation reports (before→after).

## Evidence format (Sprint 33 standard)
Machine-produced DOM reports + screenshots + transcripts are the ONLY proof. Report = AC table + the detector's
before(non-empty)/after(empty) reports + per-fix PNGs in 4 locales + the equal-height ListingCard PNG + gate-test
output + Files Changed table. INCOMPLETE if the rendered detector is not run on all 4 locales or any AC is NOT CHECKED.
NO `git add`/`commit` — orchestrator approves only after personally running the rendered detector across all 4 locales.
