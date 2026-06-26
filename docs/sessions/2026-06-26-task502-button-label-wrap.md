# Session Log — Task 502 — Button long-label wrap (P0 mobile-gate fix)

**Date:** 2026-06-26  
**Executor:** Sonnet 4.6  
**Origin:** Owner QA of Task 493 (`b3d25c0fa`) at uk@320 — long label CLIPS instead of wrapping.  
**Status:** CODE COMPLETE — awaiting orchestrator diff review + OWNER QA (rendered proof required)

---

## Root cause (confirmed by owner DOM inspector)

Mantine renders button text inside `span.mantine-Button-label` which carries `white-space: nowrap`.  
Task 493 set `whiteSpace: 'normal'` on `root` only — never reached `.label`, so the label element  
still clipped. Affects **all locales**, not just uk — global P0 mobile-gate violation.

---

## AC verification table

| AC | Criterion | Status | Evidence |
|---|---|---|---|
| AC1 | `theme.Button.styles` adds `label` wrap + `root.height:'auto'`; density preserved | ✅ | Theme updated; all 4 density values present |
| AC2 | Story long-label section drops local `root` override; uses genuinely-overflowing `button_long_label` key | ✅ | Per-instance `styles` prop removed; `button_long_label` key used |
| AC3 | New `button_long_label` key ×4 locales at parity; uk real Cyrillic | ✅ | `check:i18n` 1970 keys parity ✅ |
| AC4 | Long label wraps, no clip, no h-scroll@320, ≥44px — sq/en/uk/it | OWNER QA REQUIRED | Theme fix applied; no browser in executor session |
| AC5 | Rendered proof: long-label section @ uk@320/375/390 + sq@320 shows ≥2-line wrap | OWNER QA REQUIRED | See QA checklist below |
| AC6 | `tsc=0`, `check:stories`, `check:i18n`, `check:design-tokens` — 0 violations | ✅ | All 4 gates passed |
| AC7 | No density/variant regression; backlog + session log updated; no git emitted | ✅ | Density values unchanged; docs updated |

---

## Theme change — `src/design-system/mantine/theme.ts`

### Before (Task 493):
```ts
Button: {
  defaultProps: { radius: 'lg', size: 'sm' },
  styles: { root: { minHeight: '2.75rem', fontWeight: '500' } },
},
```

### After (Task 502):
```ts
Button: {
  defaultProps: { radius: 'lg', size: 'sm' },
  styles: {
    root: { minHeight: '2.75rem', fontWeight: '500', height: 'auto' },
    label: { whiteSpace: 'normal', overflow: 'visible', wordBreak: 'break-word' },
  },
},
```

**Values preserved (no regression):**
- `radius: 'lg'` → 8px ✅
- `size: 'sm'` → 14px ✅
- `fontWeight: '500'` → TailAdmin font-medium ✅
- `minHeight: '2.75rem'` → 44px touch target ✅

**Values added (Task 502):**
- `root.height: 'auto'` → lets button grow past minHeight when label wraps to 2nd line
- `label.whiteSpace: 'normal'` → overrides Mantine's built-in `white-space: nowrap` on `.mantine-Button-label`
- `label.overflow: 'visible'` → ensures no clip from the label element itself
- `label.wordBreak: 'break-word'` → breaks long unspaced words (e.g. URLs, long Cyrillic compounds)

---

## Story change — `src/stories/mantine/primitives/Button.stories.tsx`

**Before:** long-label section had a per-instance `styles={{ root: { whiteSpace: 'normal', wordBreak: 'break-word' } }}` which masked the theme-level defect and used `button_save_changes` ("Зберегти зміни" in uk — too short to force a 2nd line at 320px).

**After:** per-instance `styles` prop removed entirely; section uses `button_long_label` key which produces genuinely overflowing text at 320px:
- uk: `Зберегти всі зміни оголошення та повідомити агента` (≥2 lines at 320px `fullWidth`)
- en: `Save all listing changes and notify the agent`
- sq: `Ruaj të gjitha ndryshimet e njoftimit dhe njoftoni agentin`
- it: `Salva tutte le modifiche all'annuncio e notifica l'agente`

---

## i18n — new key added ×4 locales

| Key | en | uk | sq | it |
|---|---|---|---|---|
| `button_long_label` | Save all listing changes and notify the agent | Зберегти всі зміни оголошення та повідомити агента | Ruaj të gjitha ndryshimet e njoftimit dhe njoftoni agentin | Salva tutte le modifiche all'annuncio e notifica l'agente |

uk value = real Cyrillic ✅. All 4 locales produce sufficiently long strings to trigger wrap at 320px fullWidth.

---

## Gate results

```
tsc --noEmit          → 0 errors ✅
check:stories         → 80 files checked, 0 violations ✅ (405 storybook.* keys, parity ✅)
check:i18n            → 1970 keys, parity ✅
check:design-tokens   → 0 violations ✅
```

---

## OWNER QA REQUIRED (§MQ — no browser in executor session)

| Check | Story section | Viewports (mandatory) | Locales |
|---|---|---|---|
| Long label wraps to ≥2 lines, no clip | "long label" section | **uk@320, uk@375, uk@390**, sq@320 | uk + sq (longest) |
| Long button stays ≥44px tall when wrapped | "long label" section | 320 | all 4 |
| Short labels (variants/sizes) unchanged — still 44px 1-line | "variants" + "sizes" sections | 320, 375 | all 4 |
| Disabled height unchanged | "disabled" section | 320 | all 4 |
| Loading height unchanged (no Loader + wrap interaction) | "loading" section | 320 | all 4 |
| No horizontal scroll at 320 in any section | all sections | 320 mandatory | uk, sq |

---

## Files Changed

| File | Change | Rationale |
|---|---|---|
| `src/design-system/mantine/theme.ts` | Added `root.height:'auto'` + `label:{whiteSpace,overflow,wordBreak}` to Button styles | Root cause fix: `.mantine-Button-label` ships `white-space:nowrap`; theme-level single-source fix |
| `src/stories/mantine/primitives/Button.stories.tsx` | Removed per-instance `styles` override; used `button_long_label` key in long-label section | AC2: story must prove theme default, not per-instance override |
| `messages/en.json` | Added `button_long_label` key | AC3: i18n parity |
| `messages/uk.json` | Added `button_long_label` key (Cyrillic) | AC3: i18n parity + Cyrillic |
| `messages/sq.json` | Added `button_long_label` key (Albanian with diacritics) | AC3: i18n parity |
| `messages/it.json` | Added `button_long_label` key (Italian) | AC3: i18n parity |
| `docs/backlog.md` | Added Task 502 last session entry | Governance |
| `docs/sessions/2026-06-26-task502-button-label-wrap.md` | NEW — this session log | Governance |
