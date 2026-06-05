### Task 390 — FINAL surgical close: last hardcoded story leak + gate gap + fresh rendered proof (closes the Design System)

> # 🔴 This is the LAST task to close Sprint 33 / the Design System. Task 389 did the heavy lifting well (195 inline
> maps removed, uk.json real Cyrillic, AdminTable runtime localized, 9-check gate). Orchestrator rendered review
> found ONE residual real leak + the gate gap that let it through + stale rendered evidence. Fix these, re-render,
> done. Review notes: `docs/sessions/2026-06-04-orchestrator-sprint32-rendered-rejection-rootcause.md`.

> ## 🔴 COVERAGE: ALL 4 LOCALES (sq·en·uk·it) × ALL 14 breakpoints. uk@320/375/390 mandatory.

Type: corrective — final story leak + gate gap + fresh rendered conformance
Priority: CRITICAL (blocks Design System closure)

## Verified residual (orchestrator-confirmed)
1. **Hardcoded English in a story, rendered on all locales:** `src/components/layout/PageHeader.stories.tsx:56`
   `const SAMPLE_CONTENT = <Section title="Listings" description="Browse available properties">…` — USED by 4
   stories (lines 102, 120, 135, 150) → "Listings"/"Browse available properties" render in English on uk/sq/it.
2. **Gate gap:** `scripts/check-stories.mjs` does NOT flag English literals in JSX string props
   (`title=`/`description=`/`label=`/`placeholder=`/`heading=`/`alt=`/`aria-label=`/`name=`) in `*.stories.tsx` —
   only `{en,sq,uk,it}` maps. This exact gap let #1 through.
3. **Stale rendered evidence:** the last `screenshots:assert` run predates the 389 message fix → the rendered
   matrix does not reflect final state. Needs a fresh run across all 4 locales.
4. **Minor:** FilterBar `[Badge+Reset]` is a bare `<>…</>` (siblings) not a grouped `<span className="inline-flex
   items-center gap-2 shrink-0">` → can split across a wrap boundary.

## Pre-read
`docs/agent-contract.md` (7,11,12,13) · `docs/storybook-governance.md` §14 · `src/stories/_storyI18n.ts` ·
`scripts/check-stories.mjs` · `PageHeader.stories.tsx` · `FilterBar.tsx`.

## Required after behavior
1. **Fix the leak:** replace `title="Listings"`/`description="Browse available properties"` with
   `storyT(locale, 'storybook.…')` keys (reuse existing `storybook.pageheader.listings` / `…browse_short` if they
   fit, else add new keys) — real translations in sq/en/uk/it, parity. No raw literal remains in the story.
2. **Close the gate gap:** add a `check:stories` check that flags English-literal JSX string props
   (`title|description|label|placeholder|heading|subject|cta|alt|aria-label|name = "Englishish"`) in `*.stories.tsx`
   not produced by `storyT()`/`t()`, minus a documented proper-noun allowlist (city/person/brand/EUR/URL/DELETE).
   It MUST flag line 56 before the fix (demonstrate), pass after.
3. **FilterBar:** wrap `[Badge+Reset]` in `<span className="inline-flex items-center gap-2 shrink-0">…</span>` as
   the last child of the flat flex-wrap (Row 2 + legacy row) so they never split.
4. **Fresh rendered proof:** re-run `npm run build-storybook && npm run screenshots:assert`; confirm PageHeader,
   PageShell, Section render real Cyrillic uk + no English leak, and FilterBar reset sits after the last chip — in
   ALL 4 locales. Attach the fresh manifest/PNGs.

## Files allowed to edit
`src/components/layout/PageHeader.stories.tsx`; `scripts/check-stories.mjs`; `src/components/layout/FilterBar.tsx`;
`messages/{sq,en,uk,it}.json` (keys, parity); `docs/storybook-governance.md` §14; `docs/backlog.md`; session log.
STOP&ASK before broader change.

## Positive / Negative flow
Positive: PageHeader stories show localized title/description in every locale; gate green; fresh assert all-pass.
Negative: plant `title="Submit"` in a story → new gate check FAILs (file:line) → revert; FilterBar badge+reset never
split across rows; city "Tirana" on sq → not flagged (allowlist).

## Acceptance (machine-evidenced, all 4 locales)
- AC1 No hardcoded English JSX-prop literal remains in any story (new gate check green; grep 0). 
- AC2 New gate check demonstrated failing on a planted literal, passing after (transcript). 
- AC3 PageHeader/PageShell/Section render real localized text in sq/en/uk/it — FRESH PNGs referenced (not the stale
  13:xx run); uk@320/375/390 + a desktop width. 
- AC4 FilterBar `[Badge+Reset]` grouped span; reset after last chip on `ManyFilters` desktop in all 4 locales — PNGs. 
- AC5 `tsc`/`lint`/`check:stories`/`check:i18n`/`screenshots:assert` all green (transcripts).

## Validation
`npx tsc --noEmit` · `npm run lint` · `npm run check:stories` · `npm run check:i18n` · `npm run build-storybook` ·
`npm run screenshots:assert` · grep gates · negative-flow transcript.

## Evidence format (Sprint 33 standard)
Machine screenshots / transcripts only. AC table (file:line + FRESH PNG ref) + command transcripts + the new-gate
negative-flow proof + the fresh rendered matrix (sq·en·uk·it; uk@320/375/390 + 1 desktop) + Files Changed table.
INCOMPLETE if rendered evidence is stale or any locale is `NOT CHECKED`. NO `git add`/`commit`.
