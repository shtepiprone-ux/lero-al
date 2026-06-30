# Task 512 — Remove orphaned `sel_sheet_note` i18n key (4 locales)

**Date:** 2026-06-30  
**Executor:** Sonnet 4.6  
**Status:** ✅ DONE — awaiting orchestrator diff review + commit emission

## Summary

Removed the single orphaned key `storybook.mantine.sel_sheet_note` from all four locale files. The key was added in Task 509 for the old "bottom-sheet note" section; Task 510 rewrote the story and Task 511 trimmed it to 3 sections — the key had no remaining referencing code.

Precondition verified: `messages/*.json` were clean (Task 511 already committed) before this edit.

## Self-validation

| Gate | Result |
|------|--------|
| `tsc --noEmit` | ✅ 0 errors |
| `check:stories` | ✅ 0 violations (88 files) |
| `check:i18n` parity | ✅ all 4 locales — 2006 keys (was 2007; −1 = `sel_sheet_note`) |
| `grep sel_sheet_note messages/ src/` | ✅ 0 matches |

## AC checklist

| # | Criterion | Status |
|---|-----------|--------|
| 1 | `grep -r sel_sheet_note messages/ src/` = zero matches | ✅ |
| 2 | All 4 `messages/*.json` parse as valid JSON; identical key sets; `check:i18n` = 2006 ×4 | ✅ |
| 3 | `check:stories` 0 violations; `tsc --noEmit` 0 errors | ✅ |
| 4 | File-integrity: no NUL bytes, JSON parses, no truncation | ✅ |
| 5 | Session log present with Files Changed table | ✅ |
| 6 | `docs/backlog.md` Last Session updated | ✅ |

## Files Changed

| Path | Change |
|------|--------|
| `messages/sq.json` | Removed `storybook.mantine.sel_sheet_note` (orphaned — no story reference post-Task-511) |
| `messages/en.json` | Removed `storybook.mantine.sel_sheet_note` (orphaned — no story reference post-Task-511) |
| `messages/uk.json` | Removed `storybook.mantine.sel_sheet_note` (orphaned — no story reference post-Task-511) |
| `messages/it.json` | Removed `storybook.mantine.sel_sheet_note` (orphaned — no story reference post-Task-511) |
| `docs/backlog.md` | Last Session updated |
| `docs/sessions/2026-06-30-task512-remove-orphaned-sel-sheet-note.md` | This file |
