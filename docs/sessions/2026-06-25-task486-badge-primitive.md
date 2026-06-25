# Session: Task 486 — Badge primitive → TailAdmin (P1.08)

**Date:** 2026-06-25  
**Executor:** Sonnet 4.6  
**Epic:** MM (Mantine UI Migration)  
**Sprint:** Sprint 37 — MM Phase 1, Batch A — Primitives  
**Slice:** MM.2a — Badge primitive

---

## Summary

Delivered the Badge primitive proof story for Sprint 37 Task 486.

`theme.ts` Badge defaults were already correct from Task 483 work — no theme.ts changes needed.

Two new i18n keys added across all 4 locales (`storybook.mantine.badge_blocked`, `storybook.mantine.badge_brand`).

Story created at `src/stories/mantine/primitives/Badge.stories.tsx` demonstrating: all semantic colors (green/yellow/red/gray/brand), size xs vs sm comparison, and long-label negative flow (uk "Заблокований" at 320px).

---

## Theme.ts verification (§6 — no changes required)

Badge defaults in `src/design-system/mantine/theme.ts` already match spec:

```ts
Badge: {
  defaultProps: { radius: 'pill', variant: 'light', size: 'sm' },
  styles: { root: { fontWeight: '500' } },
},
```

| Spec requirement | theme.ts value | Status |
|---|---|---|
| `radius="pill"` | `radius: 'pill'` | ✅ |
| `variant="light"` | `variant: 'light'` | ✅ |
| `size="sm"` (12px text) | `size: 'sm'` | ✅ |
| `fw=500` | `fontWeight: '500'` | ✅ |

Semantic color mapping (already in theme palette):
- success=`green` (#ecfdf3 bg / #039855 text) ✅
- warning=`yellow` (#fffaeb bg / #dc6803 text) ✅
- error=`red` (#fef3f2 bg / #d92d20 text) ✅
- neutral=`gray` ✅
- brand=`brand` ✅

---

## New i18n keys

| Key | en | sq | uk | it |
|---|---|---|---|---|
| `storybook.mantine.badge_blocked` | Blocked | Bllokuar | Заблокований | Bloccato |
| `storybook.mantine.badge_brand` | Brand | Brand | Бренд | Brand |

Added to end of `storybook.mantine` object in all 4 locale files. Key parity verified: 1941 keys × 4 locales.

---

## Story structure

**File:** `src/stories/mantine/primitives/Badge.stories.tsx`  
**Title:** `Mantine/Primitives/Badge`  
**Canvas:** `Box p="xl"` (24px flat padding — modest padded canvas per Sprint 37 DoD §6)

Three sections:
1. **Semantic status** — green/yellow/red/gray/brand with translated labels
2. **Size comparison** — xs vs sm (default theme)  
3. **Long-label negative flow** — red/yellow/gray grouped at 320px to show no clip

All labels via `storyT()`, zero hardcoded user-facing strings.

---

## Gate Results

| Gate | Result |
|---|---|
| `tsc --noEmit` | ✅ 0 errors |
| `npm run check:i18n` | ✅ 1941 keys × 4 locales |
| `npm run check:stories` | ✅ 75 files, 0 violations |
| `npm run check:design-tokens` | ✅ 0 violations |
| Rendered proof | ⚠️ storybook rebuild required — story added after last build |

> Orchestrator: storybook must be rebuilt before harness can capture Badge story cells. Run `npm run build-storybook` then `npm run screenshots:assert --fast`.

---

## Files Changed

| Path | Change | Rationale |
|---|---|---|
| `messages/en.json` | Added `badge_blocked` + `badge_brand` to `storybook.mantine` | New i18n keys for red/brand badge labels |
| `messages/sq.json` | Added `badge_blocked` ("Bllokuar") + `badge_brand` ("Brand") | Locale parity |
| `messages/uk.json` | Added `badge_blocked` ("Заблокований") + `badge_brand` ("Бренд") | Locale parity |
| `messages/it.json` | Added `badge_blocked` ("Bloccato") + `badge_brand` ("Brand") | Locale parity |
| `src/stories/mantine/primitives/Badge.stories.tsx` | New file — Badge proof story | Sprint 37 Task 486 DoD |
