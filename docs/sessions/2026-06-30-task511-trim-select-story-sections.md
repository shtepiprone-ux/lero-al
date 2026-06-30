# Task 511 — Trim `Select.stories.tsx` to 3 canonical sections

**Date:** 2026-06-30  
**Executor:** Sonnet 4.6  
**Status:** ✅ DONE — awaiting orchestrator diff review + commit emission

## Summary

Trimmed `src/stories/mantine/primitives/Select.stories.tsx` from 6 sections to 3 (resting / error / disabled). Deleted the `optionsWithStress` const and removed the orphaned `storybook.mantine.sel_option_long_stress` key from all four locale files.

## Self-validation

| Gate | Result |
|------|--------|
| `tsc --noEmit` | ✅ 0 errors |
| `check:stories` | ✅ 0 violations (88 files) |
| `check:i18n` parity | ✅ all 4 locales — 2007 keys (was 2008; −1 = `sel_option_long_stress`) |

## AC checklist

| # | Criterion | Status |
|---|-----------|--------|
| 1 | `Select.stories.tsx` renders exactly 3 sections (resting, error, disabled); sections 2, 5, 6 deleted | ✅ |
| 2 | `defaultDropdownOpened` and `comboboxProps` absent from file | ✅ |
| 3 | `optionsWithStress` const deleted; `options` const retained, referenced by all 3 sections | ✅ |
| 4 | `sel_option_long_stress` removed from sq/en/uk/it; no other key changed; parity green | ✅ |
| 5 | No raw literals; `check:stories` 0 violations | ✅ |
| 6 | `parameters` (`skipCanvas: true, layout: 'fullscreen'`) and `withCanvas` decorator unchanged | ✅ |
| 7 | Rendered matrix — see note below | browser not available in executor env |
| 8 | Self-validation block | ✅ all green |
| 9 | File-integrity: JSON parses, no NUL bytes, no truncation | ✅ |
| 10 | `docs/backlog.md` + session log present | ✅ |

> AC7 note: browser rendering not available in Sonnet executor environment. Authoritative rendered-matrix verification must be done by orchestrator / owner with `npm run storybook` at breakpoints 320/375/390/768/1280 × sq/en/uk/it.

## Files Changed

| Path | Change |
|------|--------|
| `src/stories/mantine/primitives/Select.stories.tsx` | Removed sections 2 (open-state), 5 (long-uk stress), 6 (disabled-no-open); deleted `optionsWithStress` const; section comments renumbered 1→2→3 |
| `messages/sq.json` | Removed `storybook.mantine.sel_option_long_stress` (orphaned by story trim) |
| `messages/en.json` | Removed `storybook.mantine.sel_option_long_stress` (orphaned by story trim) |
| `messages/uk.json` | Removed `storybook.mantine.sel_option_long_stress` (orphaned by story trim) |
| `messages/it.json` | Removed `storybook.mantine.sel_option_long_stress` (orphaned by story trim) |
| `docs/backlog.md` | Last Session updated |
| `docs/sessions/2026-06-30-task511-trim-select-story-sections.md` | This file |
