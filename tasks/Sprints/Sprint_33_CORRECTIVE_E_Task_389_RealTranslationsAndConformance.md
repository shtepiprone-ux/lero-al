### Task 389 — SINGLE corrective: real translations from `messages/*` (kill ALL inline locale maps, ALL languages) + runtime hardcode + gate + layout + full rendered proof

> # 🔴 ONE task, covers everything. Supersedes/absorbs the deleted 384–388. Owner verdict: the inline per-locale
> maps hand-written in story files contain FAKE translations in every language — transliterated Latin "Ukrainian"
> (`Orenda ta prodazh nerukhomost v Albanii`) and romanized "Albanian" without diacritics (`Kerkoni prona ne
> Shqiperi`). The real `messages/*.json` are correct (uk = Cyrillic, sq = diacritics). FIX = delete every inline
> locale map and source ALL story text from `messages/*.json` via `storyT`; then translations are correct by
> construction in all 4 locales. Root-cause + self-audit: `docs/sessions/2026-06-04-orchestrator-sprint32-rendered-rejection-rootcause.md`.

> ## 🔴 COVERAGE: ALL 4 LOCALES (sq·en·uk·it) × ALL 14 breakpoints (320·375·390·480·560·680·768·810·960·1024·1200·1440·1920·2560). uk@320/375/390 mandatory. One-locale / one-width proof = INCOMPLETE.

Type: corrective — story i18n source-of-truth + runtime hardcode + gate + layout + rendered conformance
Priority: CRITICAL

## Verified scope (from scan — fix ALL, not a sample)
- **21 story files contain inline locale maps (195 total); 81 are transliterated Latin "uk".** Files:
  `admin/AdminCardList, AdminPageShell` · `layout/FilterBar, PageHeader, PageShell, Section` · `shared/Combobox` ·
  `ui/badge, button, checkbox, command, dialog, dropdown-menu, input, popover, select, sheet, tabs` ·
  `stories/AdminLayout, EmptyState, ListingGrid`.
- **Runtime hardcode:** `components/admin/AdminTable.tsx:19-21` (`'Hide column'`, `'Newest first'`, `'Sort A→Z'`, …)
  renders English in the LIVE admin panel on every locale. Triage + fix any other flagged runtime user-facing
  literal (`AdminSupportManager` aria-label, `ui/pagination` Previous/Next, `ui/command` title).
- **Layout:** (a) canvas vertical spacing lost in all stories since `withCanvas`/`fullscreen` (content butts the
  header); (b) FilterBar reset+count cluster orphaned to a new row at ≥1024 (nested chips `<div className="flex
  flex-wrap">` makes badge+reset siblings of the div, not the chips).

## Pre-read
`docs/agent-contract.md` (7, 11, 12, 13) · `docs/backlog.md` · `docs/storybook-governance.md` §14 ·
`docs/design-system.md` (spacing/gutter tokens) · `src/stories/_storyI18n.ts` · `.storybook/preview.tsx` ·
`messages/{sq,en,uk,it}.json` · `src/components/layout/FilterBar.tsx` + `.stories.tsx`.

## Required after behavior
1. **Delete EVERY inline locale map** (the 195) from all 21 story files. All story/fixture text comes from
   `messages/*.json` via `storyT(locale, key)`. No `{ en:…, sq:…, uk:…, it:… }` literal may remain in any
   `*.stories.tsx`.
2. **Add missing keys to `messages/{sq,en,uk,it}.json` with REAL translations** — uk in Cyrillic, sq with proper
   Albanian diacritics (ë/ç…), it real Italian. Full parity (`check:i18n` PASS). NEVER transliterate; if unsure of
   a translation, STOP&ASK — do not invent romanized text.
3. **Runtime hardcode → `t()`:** `AdminTable.tsx` sort/hide labels and any other flagged runtime user-facing string,
   localized in all 4 locales; the live surface verified, not only the story.
4. **Layout (a) — canvas spacing:** add canonical VERTICAL padding (design-system token) to `withCanvas` so every
   story has consistent spacing under the header — vertical only, full-width preserved, no `centered`/`padded`.

5. **Layout (b) — FilterBar reset+count cluster. READ THE VERIFIED ROOT CAUSE; do NOT re-derive a different one.**
   **Root cause (from code, NOT theory):** the `activeFilters` slot is passed as its OWN nested container
   `<div className="flex flex-wrap gap-3">{chips}</div>` (`FilterBar.stories.tsx:111`). In `FilterBar.tsx:138` that
   `<div>` is a SINGLE flex child of the outer `lg:flex lg:flex-wrap` row, and `Badge`+`Button` are the NEXT
   children — i.e. siblings of the nested div, NOT of the chips. The nested div consumes the full row width (chips
   wrap INSIDE it), so the outer flex pushes Badge+Button to a new outer row. The empty space after the last chip
   (e.g. «Tokë») is INSIDE the nested div and is unavailable to the outer siblings. **This is double-nesting — it is
   NOT "the row filled up".** A diagnosis that blames row-fill is wrong and must be rejected.
   **Fix:** chips and the `[Badge+Reset]` cluster must live in ONE flat `flex flex-wrap` container (no nested chip
   div). Concretely: (i) the `activeFilters`/`availableFilters` slot passes chips as a FRAGMENT of chip buttons
   (`<>{chips.map(...)}</>`), NOT a wrapping `<div className="flex flex-wrap">`; (ii) `FilterBar.tsx` Row 2 (and the
   legacy row) IS the single flat `lg:flex lg:flex-wrap lg:items-center lg:gap-2` that directly holds the chip
   children AND, as the LAST child, the cluster `<span className="inline-flex items-center gap-2 shrink-0"><Badge/>
   {Reset}</span>` (drop the `items-start`+`self-center` hacks). Result: reset+count flow immediately after the
   last chip and wrap only together with the chip flow, never orphaned. (iii) Update `FilterBar.stories.tsx` AND
   every real `activeFilters`/`availableFilters` consumer to the fragment contract — grep and LIST them; STOP&ASK if
   a consumer can't adopt it without broader change.
5. **GATE (`scripts/check-stories.mjs`):** FAIL on — (a) any inline locale-map literal (`uk:`/`sq:`/`it:` string)
   in a `*.stories.tsx`; (b) any `messages/uk.json` value that has Latin letters but NO Cyrillic (minus a documented
   allowlist: WhatsApp/Email/Slug/SEO/URL/brand); (c) hardcoded user-facing literal in runtime `src/components/**` +
   `src/modules/**`. Wire into `prebuild-storybook` + CI. Document the rule in `storybook-governance.md` §14.

## Files allowed to edit
The 21 story files + `src/stories/StoryListingCard.tsx` + fixtures; `messages/{sq,en,uk,it}.json`;
`src/stories/_storyI18n.ts`; `src/components/admin/AdminTable.tsx` + any other flagged runtime component;
`.storybook/preview.tsx`; `src/components/layout/FilterBar.tsx` + `.stories.tsx` + slot consumers;
`scripts/check-stories.mjs`; `package.json`; `.github/workflows/governance-pr.yml`;
`docs/storybook-governance.md`, `docs/backlog.md`, new session log. STOP&ASK before any architectural change.

## Preserve
`en` canvas; desktop ≥640 appearance; 379 bottom-sheet popups; 382 Tabs/Select; full-width <640; all controls;
email locale policy (do NOT touch email templates).

## Positive flow
Toolbar → sq/en/uk/it: every story shows REAL text in that language (uk Cyrillic, sq with diacritics), consistent
header spacing, FilterBar reset after last chip. Gates + leak/Cyrillic checks green.

## Negative flow (demonstrate, then revert)
- Plant `uk: 'Orenda ta prodazh'` in a story → `check:stories` FAILs (inline map + non-Cyrillic uk). 
- Plant `placeholder="Submit"` in a runtime component → FAILs. 
- Remove a uk key → `check:i18n` FAILs. 
- City "Tirana" on sq canvas → NOT flagged (allowlist). 
- FilterBar with room after last chip → reset on the SAME row (not new row). 
- <640 controls stay full-width; no h-scroll at 320; no double top spacing.

## Acceptance (all machine-evidenced; ALL 4 locales × ALL 14 breakpoints)
- AC1 Zero inline locale maps remain (grep 0 across all `*.stories.tsx`); all text via `storyT` from `messages/*`.
- AC2 `messages/uk.json` values are Cyrillic (Cyrillic-check green); sq has diacritics; parity PASS (key count logged).
- AC3 `AdminTable.tsx` + flagged runtime render localized in sq/en/uk/it — rendered proof per locale.
- AC4 `withCanvas` vertical spacing consistent (≥3 previously-broken stories proven); FilterBar reset after last
  chip on `ManyFilters` in sq/en/uk/it at 1024/1280/1440 + uk@320/375/390 — file:line + PNGs.
- AC5 Gate fails on each planted violation (transcripts); wired into `prebuild-storybook` + CI.
- AC6 FULL rendered matrix: every touched story × sq·en·uk·it × the 14 breakpoints, PNG-evidenced; uk@320/375/390
  mandatory; no cell `NOT CHECKED`.
- AC7 `tsc`/`lint`/`check:stories`/`check:i18n`/`screenshots:assert` all green (transcripts).

## Validation
`npx tsc --noEmit` · `npm run lint` · `npm run check:i18n` · `npm run check:stories` · `npm run build-storybook` ·
`npm run screenshots:assert` · grep gates · negative-flow transcripts · the all-locale × all-breakpoint matrix.

## Evidence format (Sprint 33 standard)
Machine screenshots / command transcripts are the ONLY proof; "no browser access" is not acceptable. Report = AC
table (file:line + PNG ref) + command transcript (exit codes) + grep raw outputs/triage + the rendered matrix
(sq·en·uk·it × 14 breakpoints; uk@320/375/390 mandatory) + FilterBar consumer list + negative-flow transcripts +
STOP&ASK log + Files Changed table. INCOMPLETE if any locale, any breakpoint cell, or any AC is `NOT CHECKED`.
NO `git add`/`commit` — orchestrator approves only after a FULL rendered review across all 4 locales, then emits commits.
