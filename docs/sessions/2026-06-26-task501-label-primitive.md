# Session Log — Task 501 — Label primitive → TailAdmin (MM Phase 1, P1.28)

**Date:** 2026-06-26  
**Executor:** Sonnet 4.6  
**Sprint:** Sprint 38 — MM Phase-1 Batch B (run-order first after Button, so TextInput/Select/Textarea/PasswordInput inherit)  
**Status:** CODE COMPLETE — awaiting orchestrator diff review + OWNER QA (rendered proof required)

---

## AC verification table

| AC | Criterion | Status | Evidence |
|---|---|---|---|
| AC1 | `theme.InputLabel.styles.label` = 14px/fw500/gray-7 (§6) + `required:{display:'none'}` (owner UX decision); `InputDescription.styles.description` = 12px/gray-5 (§6d) | ✅ | Theme updated; all values use CSS vars, no raw hex/px |
| AC2 | `Label.stories.tsx` created: single `Default`; sections: required-default + optional-marked + long-uk + disabled | ✅ | File created with all 4 sections |
| AC3 | New `storybook.mantine.label_*` keys ×4 locales at parity; uk Cyrillic; `check:i18n` passes | ✅ | 1976 keys, parity ✅ |
| AC4 | Required field shows NO asterisk (even with `required` prop); optional field shows localized `(optional)` suffix in gray-5/fw400 + placeholder + description | ✅ (theme); OWNER QA REQUIRED | Theme suppresses asterisk via `display:'none'`; no browser in executor session |
| AC5 | Long label wraps, no clip, no h-scroll@320; disabled label dimmed; no stray asterisk — sq/en/uk/it | OWNER QA REQUIRED | Theme uses normal-flow block text; no clip styling set |
| AC6 | Rendered proof: optional pattern (suffix+placeholder+hint) @ en@320 + uk@320; long-label wrap @ uk@320/375/390 + sq@320; disabled-dim @ any; no-asterisk @ any | OWNER QA REQUIRED | See QA checklist below |
| AC7 | `tsc=0`, `check:stories`, `check:i18n`, `check:design-tokens` — zero hardcode | ✅ | All 4 gates green |
| AC8 | No regression to existing Mantine input labels; `docs/backlog.md` + session log updated; no git emitted | ✅ | No existing InputLabel/InputDescription entries to regress; docs updated |

---

## Theme changes — `src/design-system/mantine/theme.ts`

Both components were absent before Task 501 (grep confirmed: `InputLabel`/`InputDescription` had zero matches in theme.ts). No "already satisfied" entries — both added from scratch.

### Added (after `Switch`, before `SegmentedControl`):

```ts
// InputLabel: §6 label treatment — 14px/fw500/gray-7 (TailAdmin text-theme-sm font-medium text-gray-700).
// required:{display:'none'} — owner decision (2026-06-26): all fields required by default; no asterisk;
// optional fields use a localized "(optional)" suffix inline in the label text instead of a `*`.
InputLabel: {
  styles: {
    label: {
      fontSize: 'var(--mantine-font-size-sm)',
      fontWeight: 500,
      color: 'var(--mantine-color-gray-7)',
    },
    required: { display: 'none' },
  },
},
// InputDescription: §6d secondary-text treatment — 12px/gray-5 (quiet hint below inputs).
InputDescription: {
  styles: {
    description: {
      fontSize: 'var(--mantine-font-size-xs)',
      color: 'var(--mantine-color-gray-5)',
    },
  },
},
```

**Token mapping:**
- `var(--mantine-font-size-sm)` = 14px (theme `fontSizes.sm`) ✅
- `var(--mantine-color-gray-7)` = `#344054` (TailAdmin gray-700 primary text) ✅
- `var(--mantine-font-size-xs)` = 12px (theme `fontSizes.xs`) ✅
- `var(--mantine-color-gray-5)` = `#667085` (TailAdmin gray-500 secondary text) ✅
- `fontWeight: 500` = TailAdmin `font-medium` ✅
- No raw hex/px — `check:design-tokens` 0 violations ✅

---

## Story — `src/stories/mantine/primitives/Label.stories.tsx`

### Sections

| Section | Type | Proves |
|---|---|---|
| Required (default, no asterisk) | Positive | 14px/fw500/gray-7 label; `required` prop does NOT produce a `*` (theme suppression) |
| Optional (marked, full reference) | Positive | `(optional)` suffix in gray-5/fw400; placeholder + 12px description hint; exact owner reference pattern |
| Long label (negative) | Negative | Label wraps to ≥2 lines at 320px; no clip; no h-scroll |
| Disabled control (negative) | Negative | Label dimmed consistently with disabled input |

### Optional pattern implementation (owner reference)

```tsx
<TextInput
  label={<>{t('label_job_title')} <Text span c="gray.5" fz="sm" fw={400}>{t('label_optional')}</Text></>}
  placeholder={t('label_job_placeholder')}
  description={t('label_job_hint')}
/>
```

- `Text span c="gray.5" fz="sm" fw={400}` = Mantine tokens (gray-5 / 14px / regular weight) — quieter than the label itself ✅
- `label` as ReactNode — Mantine `TextInput.label` is typed as `React.ReactNode` ✅
- `placeholder` and `description` via `storyT()` (both are watched props in check:10) ✅

---

## i18n — new keys ×4 locales

| Key (storybook.mantine.*) | en | uk | sq | it |
|---|---|---|---|---|
| `label_email` | Email Address | Адреса електронної пошти | Adresa e emailit | Indirizzo email |
| `label_job_title` | Job Title | Назва посади | Titulli i punës | Titolo professionale |
| `label_job_placeholder` | Add your job title | Введіть вашу посаду | Shtoni titullin tuaj të punës | Inserisci il tuo titolo professionale |
| `label_job_hint` | Designer, Dev, etc. | Дизайнер, розробник тощо | Dizajner, Dev, etj. | Designer, Dev, ecc. |
| `label_long` | Full name and contact information for the property agent | Повне ім'я та контактна інформація агента з нерухомості | Emri i plotë dhe informacioni i kontaktit për agentin e pronës | Nome completo e informazioni di contatto per l'agente immobiliare |
| `label_optional` | (optional) | (опційно) | (opsionale) | (facoltativo) |

uk values = real Cyrillic ✅. Kickoff-specified `label_optional` values used exactly.

---

## Gate results

```
tsc --noEmit          → 0 errors ✅
check:stories         → 81 files checked, 0 violations ✅ (411 storybook.* keys, parity ✅)
check:i18n            → 1976 keys, parity ✅
check:design-tokens   → 0 violations ✅
```

---

## OWNER QA REQUIRED (§MQ — no browser in executor session)

| Check | Story section | Viewports (mandatory) | Locales |
|---|---|---|---|
| No asterisk on required field | "required (default)" | any | all 4 |
| Label: 14px / medium weight / gray-700 color | "required (default)" | any | all 4 |
| Optional suffix "(optional)/(опційно)" is gray-5/lighter than label | "optional" | en@320, uk@320 | en + uk |
| Placeholder shows inside input; description hint below | "optional" | en@320, uk@320 | en + uk |
| Long label wraps to ≥2 lines, no clip | "long label" | **uk@320, uk@375, uk@390**, sq@320 | uk + sq (longest) |
| No horizontal scroll at 320 | all sections | 320 mandatory | uk, sq |
| Disabled label dimmed (not full-contrast gray-7) | "disabled" | any | any |
| Clicking required-section label focuses the input (htmlFor wired) | "required (default)" | any | any |

---

## Files Changed

| File | Change | Rationale |
|---|---|---|
| `src/design-system/mantine/theme.ts` | Added `InputLabel.styles` (14px/fw500/gray-7 + `required:{display:'none'}`) + `InputDescription.styles` (12px/gray-5) | AC1: §6 label + §6d description treatment; owner UX decision: no asterisks |
| `src/stories/mantine/primitives/Label.stories.tsx` | NEW — proof story (4 sections: required + optional + long-label + disabled) | AC2: Mantine proof path, single Default, skipCanvas |
| `messages/en.json` | Added 6 `label_*` keys | AC3: i18n parity |
| `messages/uk.json` | Added 6 `label_*` keys (Cyrillic) | AC3: i18n parity + Cyrillic |
| `messages/sq.json` | Added 6 `label_*` keys (Albanian with diacritics) | AC3: i18n parity |
| `messages/it.json` | Added 6 `label_*` keys (Italian) | AC3: i18n parity |
| `docs/backlog.md` | Added Task 501 last session entry | Governance |
| `docs/sessions/2026-06-26-task501-label-primitive.md` | NEW — this session log | Governance |
