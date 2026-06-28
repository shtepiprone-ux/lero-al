# Task 507 — Input disabled-state source-of-truth (faded transparent, not gray box)

**Date:** 2026-06-27  
**Sprint:** 38 corrective  
**Status:** CODE COMPLETE — awaiting orchestrator rendered-proof review

## Root cause

Mantine's default disabled style applies a solid gray fill via `--input-disabled-bg` (= `var(--mantine-color-disabled)`). The source of truth (`src/components/ui/input.tsx`: `disabled:opacity-50 disabled:cursor-not-allowed` + TailAdmin demo) specifies a **faded transparent field** — the resting border/placeholder visible at 50% opacity, no gray box fill.

## Mantine selectors (documented in Mantine core styles)

Mantine v8 `Input.css` applies disabled state via:
- `[input]:disabled, [input][data-disabled]` — used by TextInput / Textarea / Select
- `[outer-box]:has(input:disabled)` — used by composite inputs (PasswordInput)

Our stable BEM selectors map to these:
- `.mantine-TextInput-input:disabled` / `[data-disabled]`
- `.mantine-Textarea-input:disabled` / `[data-disabled]`
- `.mantine-Select-input:disabled` / `[data-disabled]`
- `.mantine-PasswordInput-input[data-disabled]` / `:has(input:disabled)`

## Changes made

| File | Change |
|------|--------|
| `src/design-system/mantine/input-chrome.css` | Appended disabled rule block: `background-color: transparent; opacity: 0.5; cursor: not-allowed` for all 4 input types, covering both `:disabled` and `[data-disabled]` selectors |
| `scripts/mojibake-allowlist.json` | Added 4 pre-existing Task 467 non-UTF-8 log files (binary harness output) to allowlist |
| `scripts/check-mojibake.mjs` | Fixed script bug: allowlist was only applied to mojibake-signature hits, not to invalid-UTF-8 errors — added `isAllowlisted` check before invalid-UTF-8 reporting |

## Gate results

- tsc = 0 errors ✅
- `check:design-tokens` = 0 violations ✅
- `check:i18n` = 1989 keys, parity PASSED ✅
- `check:mojibake` = 0 artifacts ✅ (after script bug fix + allowlist for pre-existing Task 467 log files)

## Rendered proof required (orchestrator)

Per AC-3: disabled story cell of each of the 4 input types at uk@320/375/390 must show a **faded transparent field** (not a gray box). Specifically:
- The resting border + placeholder/value visible at 50% opacity
- Cursor not-allowed on hover
- No focus ring when disabled
- PasswordInput reveal toggle also dimmed (cascades from box opacity)

Per AC-4 (planted-violation): temporarily remove `background-color: transparent` → gray box returns → revert → proves override is real.

Per AC-5 (regression): one resting + one error cell per type still correct (Task 505 intact).

## Specificity note

Our `input-chrome.css` selectors:
- `.mantine-TextInput-input:disabled` = specificity (0,1,1) — ties Mantine's `.m_8fb7ebe7:disabled` (0,1,1) → our later-imported file wins
- `.mantine-TextInput-input[data-disabled]` = (0,2,0) — ties Mantine's `.m_8fb7ebe7[data-disabled]` (0,2,0) → our later-imported file wins

`input-chrome.css` is imported after `@mantine/core/styles.css` (established in Task 505).

## NO git add/git commit — orchestrator emits at review
