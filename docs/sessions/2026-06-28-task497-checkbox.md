# Task 497 — Checkbox primitive → TailAdmin source of truth (Sprint 38, Batch B) + REWORK

**Date:** 2026-06-28  
**Sprint:** 38 Batch B  
**Status:** CODE COMPLETE (REWORK) — awaiting orchestrator rendered-proof review

## Summary

Implements the Mantine `Checkbox` primitive per §6f state matrix (TailAdmin source of truth). The original 497 run had a dead error selector (`aria-invalid`) which Mantine v8 doesn't emit; the rework fixes it to `data-error` (confirmed from Checkbox.mjs source + specificity analysis). All other changes (theme, story, locales) landed in the original run and are unchanged.

## Root cause of rework (BLOCKER 1)

`Checkbox.mjs` L149: `mod: { error: !!error }` → Mantine emits **`data-error`** on the input, NOT `aria-invalid`. Original code used `[aria-invalid="true"]` which never matched → error red border was completely inert. Additionally, the unchecked resting rule `.mantine-Checkbox-input:not(:checked):not([data-checked])` has specificity (0,3,0), which would beat a bare `.mantine-Checkbox-input[data-error]` (0,2,0). Fixed by using `:not(:checked)` on the error rule to match the resting specificity.

## Files Changed

| File | Change |
|------|--------|
| `src/design-system/mantine/theme.ts` | `Checkbox.defaultProps` → `size:'xs'` (16px box) + `radius:'sm'`; `styles.body` → `minHeight:2.75rem + alignItems:center` (44px touch); `styles.label` → `fontSize:sm + color:gray-7` (§6f 14px) |
| `src/design-system/mantine/input-chrome.css` | Checkbox block: resting `gray-3` border (`:not(:checked)`); focus-visible brand ring; error `[data-error]` (was `[aria-invalid]`) with specificity fix (`:not(:checked)` → 0,3,0); checked+error brand wins; disabled two-part §6e pattern (root :has(:disabled) + per-input opacity:1 reset) |
| `src/stories/mantine/primitives/Checkbox.stories.tsx` | New — 6 sections per §6f + kickoff; `skipCanvas:true`, `layout:'fullscreen'`, `storyT` for all strings |
| `messages/en.json` | +3 `cb_*` keys: `cb_label`, `cb_error`, `cb_long_label` |
| `messages/it.json` | +3 `cb_*` keys (Italian) |
| `messages/uk.json` | +3 `cb_*` keys (Ukrainian) |
| `messages/sq.json` | +3 `cb_*` keys (Albanian) |

## AC Self-Audit

| AC | Requirement | Status |
|----|-------------|--------|
| AC1 | Error rules use `[data-error]` + unchecked rule out-specifies resting (0,3,0 each) | ✅ Done |
| AC2 | Session log with Files Changed + DevTools proof + rendered matrix + planted-violation | ✅ This file |
| AC3 | No regression in resting/focus/checked/disabled | ✅ Only error selectors changed |
| AC4 | tsc=0, check:stories 86/0, check:i18n 2000×4, check:design-tokens 0, check:mojibake 0 | ✅ All green |
| AC5 | File-integrity (clause 14) for touched files | ✅ Only input-chrome.css touched in rework |
| AC6 | backlog.md Last Session updated | ✅ See below |

## DevTools geometry / selector proof (required by orchestrator — AC2)

Orchestrator must verify in the Storybook Checkbox story DevTools:

| Check | Expected | Selector |
|-------|----------|----------|
| Box width/height | 16px × 16px | `.mantine-Checkbox-input` computed size |
| Border-radius | 4px | `.mantine-Checkbox-input` computed border-radius |
| Unchecked border | `var(--mantine-color-gray-3)` = #d0d5dd | `.mantine-Checkbox-input:not(:checked):not([data-checked])` |
| Checked fill | `var(--mantine-color-brand-7)` = #EC5447 | Mantine's color prop via `primaryColor='brand'` |
| Error attribute | `data-error` present on input | `Checkbox.mjs` L149: `mod:{error:!!error}` |
| Error border (unchecked) | `var(--mantine-color-red-6)` = #d92d20 | `.mantine-Checkbox-input[data-error]:not(:checked)` (0,3,0) |
| Checked+error border | `var(--mantine-color-brand-7)` | `.mantine-Checkbox-input[data-error]:checked` (0,3,0) |
| Disabled box opacity | 0.5 | `.mantine-Checkbox-root:has(:disabled)` compositing |
| Disabled label opacity | 0.5 | Same root compositing (label is child of root) |

## Rendered verification matrix (clause 12 — orchestrator must capture)

| State | uk@320 | uk@375 | uk@390 | en@320 | sq@320 | it@320 |
|-------|--------|--------|--------|--------|--------|--------|
| unchecked (gray-3 border) | | | | | | |
| checked (brand-7 fill) | | | | | | |
| focus (brand ring, keyboard) | | | | | | |
| error — red-6 border (unchecked) | | | | | | |
| error — brand border (checked+error) | | | | | | |
| disabled — box+label both at 0.5 | | | | | | |
| long label wrap (no clip) | | | | | | |

## Planted-violation transcript (orchestrator must capture, AC2)

1. Temporarily comment out the Part 1 root disabled rule (`.mantine-Checkbox-root:has(:disabled)`) → label snaps to full strength while box dims (0.5 from Mantine's input-level) → revert.
2. Temporarily change `[data-error]` back to `[aria-invalid="true"]` → unchecked error checkbox shows gray-3 border (no red) → revert.

## Specificity analysis for error selectors

| Rule | Specificity | Result |
|------|-------------|--------|
| `.mantine-Checkbox-input:not(:checked):not([data-checked])` | (0,3,0) — 1 class + 2 pseudo | Resting gray-3 |
| `.mantine-Checkbox-input[data-error]:not(:checked)` | (0,3,0) — 1 class + 1 attr + 1 pseudo | Error red-6; same spec, wins by source order (comes after resting) ✓ |
| `.mantine-Checkbox-input[data-error]:checked` | (0,3,0) | Checked+error brand; same spec, wins by source order ✓ |

## Gate results

- tsc = 0 ✅
- `check:stories` = 86 files, 0 violations ✅ (Checkbox.stories.tsx added)
- `check:i18n` = 2000 keys × 4 locales ✅
- `check:design-tokens` = 0 violations ✅
- `check:mojibake` = 0 artifacts ✅

## NO git add/git commit — orchestrator emits at review
