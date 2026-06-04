### Task 369 — Storybook QA fix batch (FilterBar align · PhoneField placeholder · AdminTable mobile buttons · locale-stress story pin)

> **Status: READY (priority: high — owner rendered-QA defects on Tasks 362/363/365, 2026-06-03).**
> **You are Sonnet 4.6 executor.** Four disjoint-scope fixes in ONE task (owner chose a batch). Do NOT change scope
> beyond the four work items. Do NOT invent architecture — if a fix needs a decision not specified, STOP and ASK.
> **Single-writer git:** no `git add`/`commit`; end with a "Files Changed" table — the ORCHESTRATOR emits commits.

```
Type:     bugfix (UI / responsive / i18n / story-config)
Priority: high
Area:     layout/FilterBar · shared/PhoneField + phone locales · admin/AdminTable card-mode toolbar · *LocaleStress stories
```

## Pre-read (mandatory)
1. `docs/agent-contract.md`
2. `docs/backlog.md`
3. `docs/rule-index.md` → **UI / layout** bundle: `docs/design-system.md`, `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`
4. `docs/ai-behavior.md` → Note 14 (global-change), Note 19 (UX flow), Note 20 (control preservation)
5. Prior art (do NOT undo): Task 359/360 mobile full-width contract (design-system.md §12b, ui-rules.md §15a); Task 360 `LocaleStress` story pattern (`globals: { locale: 'uk' }`); Task 362 FilterBar alignment session log.
6. `docs/storybook-governance.md` §8a (rendered QA / locale-stress) + §8b (scenario names).

---

## W1 — FilterBar: vertically center the lg:+ end cluster (Badge + Reset)
**Defect (owner QA, ≥1024px):** the `activeCount` Badge + global Reset are top-aligned, not centered with the search row.
**Root cause:** Task 362 set the outer flex to `sm:items-start` (correct for chip-wrap), which also top-aligns the
`lg:+` Badge+Reset siblings (`FilterBar.tsx:45-71`).
**Fix:** keep `items-start` ONLY for the wrapping inline chip cluster; the search slot + count Badge + Reset must stay
vertically centered at ≥sm. E.g. `self-center` on the Badge+Reset cluster (and search slot), OR restructure so only the
chip cluster is `items-start`. Do NOT regress Task 362's chip-wrap behavior (many filters wrapping to 2+ rows must still
top-align the chips).
**Files:** `src/components/layout/FilterBar.tsx`, `src/components/layout/FilterBar.stories.tsx` (verify with `ManyFilters`).
**Positive flow:** at 1280/1440/2560 with active filters → Badge "4" + Reset vertically centered with the search input; chips wrapping → chips top-align.
**Negative flow:** no active filters → no Badge/Reset (unchanged); <lg → cluster collapses to Sheet (Task 362 unchanged); <sm → controls full-width (Task 359 `[&>*]:max-sm:w-full` preserved).

## W2 — PhoneField placeholder: national-only (drop country code)
**Defect (owner QA):** placeholder is `+355 XX XXX XXXX` (`messages/*.json` key `phone_placeholder`) but the country dial-code
is entered in a SEPARATE Combobox in `PhoneField` — the national input must NOT repeat `+355`.
**Fix:** change `phone_placeholder` to a **national-only** format in ALL FOUR locales (e.g. `69 XXX XXX` / `XX XXX XXX` —
pick the canonical Albanian national mask, justify in the log). Ensure the **national `<Input>`** in
`src/components/shared/PhoneField.tsx` uses `phone_placeholder` (the dial-code Combobox keeps `search_placeholder`).
Locale parity MUST hold (`npm run check:i18n` → all 4 identical key sets).
**Files:** `messages/en.json`, `messages/sq.json`, `messages/uk.json`, `messages/it.json`, `src/components/shared/PhoneField.tsx` (+ `input.stories.tsx` if the Phone story hardcodes the old placeholder).
**Positive flow:** PhoneField renders dial-code Combobox (`+355`) + national input with placeholder `XX XXX XXX` (no `+355`); typing national number works.
**Negative flow:** empty national → placeholder shown; letters/symbols → stripped (Task 363 `handleNationalChange` unchanged); locale switch → placeholder localized in all 4.

## W3 — AdminTable card-mode toolbar buttons: full-width <640
**Defect (owner QA, 390px card mode):** Search / Columns / **Sort** controls stay narrow; per the mobile contract they
must be full-width at <640 like every other control.
**Fix:** locate the card-mode toolbar in `src/components/admin/AdminTable.tsx` (Search input, Columns button, Sort button)
and apply the canonical mobile fragment (`max-sm:w-full` per design-system.md §12b / Task 359). Do NOT change desktop sizing.
**Files:** `src/components/admin/AdminTable.tsx`, `src/components/admin/AdminTable.stories.tsx` (verify `Card Mode` story at 320/375/390).
**Positive flow:** at <640 (card mode) Search/Columns/Sort are full-width, stacked, ≥44px touch targets; at ≥640 they size to content as today.
**Negative flow:** desktop table mode unchanged; no control removed (Note 20); Sort dropdown menu still opens/sorts (`onSort`).

## W4 — Locale-stress stories: pin `globals.locale='uk'`
**Defect (owner QA):** `PasswordInput` "Ukrainian Locale Stress" renders English when the toolbar = English — the story
relies on the toolbar instead of pinning the locale (i18n itself works via `useTranslations`).
**Fix:** add `parameters`/`globals: { locale: 'uk' }` to every `*LocaleStress` / "Ukrainian Locale Stress" story so it
ALWAYS renders uk regardless of toolbar (match the Task 360 `LocaleStress` pattern, §8a). Audit the changed story files
for the same gap and fix consistently.
**Files:** `src/components/ui/PasswordInput.stories.tsx` (+ any other `*LocaleStress` story missing the pin — list them in the log).
**Positive flow:** opening the locale-stress story renders uk strings without manual toolbar switch.
**Negative flow:** other (non-stress) stories keep following the toolbar locale (unchanged); no production code touched (story-only).

---

## Acceptance criteria
- AC1 (W1) FilterBar Badge+Reset vertically centered at ≥1024 with chips still top-aligning on wrap — verifiable at `FilterBar.tsx`:line + `ManyFilters` story.
- AC2 (W2) `phone_placeholder` national-only in all 4 locales; national input uses it; `check:i18n` PASS — verifiable at `messages/*` + `PhoneField.tsx`:line.
- AC3 (W3) AdminTable card-mode Search/Columns/Sort full-width <640 — verifiable at `AdminTable.tsx`:line + `Card Mode` story.
- AC4 (W4) locale-stress stories pin `globals.locale='uk'` — verifiable in story files.
- Positive + Negative flow parity for each W in the diff.
- 0 new lint/tsc errors; `npm run build-storybook` passes; `npm run check:i18n` PASS; Note 18 self-validation block + Files Changed table.
- Rendered cells = OWNER QA REQUIRED (§8a) — do NOT self-mark rendered PASS.

## Out of scope
- **Select value→label display + Combobox/Select trigger left-align consistency → Task 371** (primitive-level, separate task — do NOT touch `select.tsx` / `Combobox.tsx` here).
- RecentlyViewedSection field-parity (Task 370).
- Any runtime logic beyond the four fixes; no new variants/props.
