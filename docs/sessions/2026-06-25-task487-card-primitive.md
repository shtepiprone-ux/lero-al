# Session: Task 487 — Card / Paper primitive → TailAdmin (Sprint 37, MM Phase 1, P1.09)

**Date:** 2026-06-25  
**Executor:** Sonnet 4.6  
**Epic:** MM (Mantine UI Migration)  
**Sprint:** Sprint 37 — MM Phase 1, Batch A — Primitives  
**Slice:** MM.2b — Card/Paper primitive

---

## Critical-flow registry scan

Task 487 touches NO flow in `docs/critical-flow-registry.md` — primitives-only (theme defaults + proof story). No product surface edits.

---

## Summary

Delivered the Card/Paper primitive proof story for Sprint 37 Task 487.

`theme.ts` Card/Paper defaults already matched §6 exactly (from Task 484). **NO theme.ts change** was made.

4 new i18n keys added across all 4 locales (`card_demo_title`, `card_demo_body`, `card_demo_action`, `card_paper_title`).

Story created at `src/stories/mantine/primitives/Card.stories.tsx` demonstrating: default Card chrome (radius-16, 20px padding, gray-1 border, no shadow), Paper variant (identical chrome), negative flow (withBorder=false + nested Card).

---

## Theme.ts verification (§6 — NO change required)

Card/Paper defaults in `src/design-system/mantine/theme.ts` already match §6 exactly:

```ts
// Card: flat-border, 2xl radius (16px), lg padding (20px). No shadow (shadow only on popovers).
// Border color: gray-1 (#f2f4f7) via scoped CSS variable override.
Card: {
  defaultProps: { radius: '2xl', padding: 'lg' },
  styles: {
    root: { '--mantine-color-default-border': 'var(--mantine-color-gray-1)' },
  },
},
// Paper: matches Card for consistent admin surface chrome.
Paper: {
  defaultProps: { radius: '2xl' },
  styles: {
    root: { '--mantine-color-default-border': 'var(--mantine-color-gray-1)' },
  },
},
```

### §6 vs theme.ts comparison table

| §6 requirement | theme.ts value | Status |
|---|---|---|
| Card `radius="2xl"` (16px) | `defaultProps: { radius: '2xl' }` | ✅ |
| Card `padding="lg"` (20px — owner-decided 2026-06-25) | `defaultProps: { padding: 'lg' }` | ✅ |
| Border color gray-1 (#f2f4f7) | `'--mantine-color-default-border': 'var(--mantine-color-gray-1)'` | ✅ |
| NO shadow (flat content card) | No `shadow` default set | ✅ |
| Paper `radius="2xl"` | `defaultProps: { radius: '2xl' }` | ✅ |
| Paper border gray-1 when `withBorder` | Same CSS var override | ✅ |
| Paper NO shadow | No `shadow` default set | ✅ |
| §5 shadow rule: content Card = flat | No shadow on Card/Paper defaults | ✅ |

---

## New i18n keys

| Key | en | sq | uk | it |
|---|---|---|---|---|
| `storybook.mantine.card_demo_title` | Card title | Titulli i kartës | Заголовок картки | Titolo card |
| `storybook.mantine.card_demo_body` | Flat content card — rounded corners, gray border, no shadow. | Kartë e sheshtë — qoshe të rrumbullakuara, kufi gri, pa hije. | Пласка картка — заокруглені кути, сірий бордюр, без тіні. | Card piatta — angoli arrotondati, bordo grigio, nessuna ombra. |
| `storybook.mantine.card_demo_action` | View details | Shiko detajet | Переглянути деталі | Vedi dettagli |
| `storybook.mantine.card_paper_title` | Paper surface | Sipërfaqja Paper | Поверхня Paper | Superficie Paper |

Added after `badge_brand` in `storybook.mantine` object in all 4 locale files. Key parity verified: 1945 keys × 4 locales.

**uk stress test:** `card_demo_body` uk = "Пласка картка — заокруглені кути, сірий бордюр, без тіні." (~57 chars Cyrillic). At 320px viewport with Box p="xl" (24px sides) + Card padding="lg" (20px sides), content area = 272 − 40 = 232px. String wraps to ~2 lines at sm Text; no clip, no h-scroll. ✅

---

## Story structure

**File:** `src/stories/mantine/primitives/Card.stories.tsx`  
**Title:** `Mantine/Primitives/Card`  
**Canvas:** `Box p="xl"` (24px flat padding — modest padded canvas per Sprint 37 DoD §6)

**Mobile full-width gate:**
- `Card` is a block element — fills available width inside `Box p="xl"` at all viewports ✅
- `Paper` same ✅
- Footer `Button`: `w={{ base: '100%', sm: 'auto' }}` — full-width at `<640px` (project `sm` breakpoint = 640px per `theme.ts` `breakpoints.sm: '40em'`), content-width at `≥640px` ✅
- Button touch target: `size="lg"` (~42px) + `mih="2.75rem"` (44px min) ≥44px ✅
- Labels wrap at 320px (`whitespace-normal` default), no clip ✅

**Sections:**
1. **Default card / flat chrome** — `<Card withBorder>` with title (`fw={600}`), body (`size="sm" c="gray.7"`), footer Button (`size="lg" mih="2.75rem" w={{ base:'100%', sm:'auto' }}`). Proves: radius-16 + 20px padding + gray-1 border + flat (no shadow).
2. **Paper variant** — `<Paper withBorder p="lg">` with title + body. Proves: identical chrome (radius-16, gray-1 border, no shadow). Padding set by consumer (`p="lg"`), not Paper default.
3. **Negative flow:**
   - 3a: `<Card withBorder={false}>` — no border visible, but radius/padding tokens still apply via theme defaults; no shadow.
   - 3b: `<Card withBorder>` containing inner `<Card withBorder>` — no double-border ring, no shadow stacking.

---

## Gate Results

| Gate | Result |
|---|---|
| `tsc --noEmit` | ✅ 0 errors |
| `npm run check:i18n` | ✅ 1945 keys × 4 locales |
| `npm run check:stories` | ✅ 76 files, 0 violations |
| `npm run check:design-tokens` | ✅ 0 violations |
| `npm run build-storybook` | ✅ built in ~17s |
| `npm run screenshots:assert` | ⏳ running (background task b902rf5t1) |

Proof cells will be updated when harness completes. Required: 320/375/480 × en/uk + sq@320 + it@320 (uk@320/375/390 mandatory stress).

---

## Files Changed

| Path | Change | Rationale |
|---|---|---|
| `messages/en.json` | Added 4 keys: `card_demo_title/body/action/card_paper_title` to `storybook.mantine` | New i18n keys for card story labels |
| `messages/sq.json` | Same 4 keys (Albanian) | Locale parity |
| `messages/uk.json` | Same 4 keys (Ukrainian — Cyrillic stress strings) | Locale parity |
| `messages/it.json` | Same 4 keys (Italian) | Locale parity |
| `src/stories/mantine/primitives/Card.stories.tsx` | New file — Card/Paper proof story (3 sections) | Sprint 37 Task 487 DoD |
| `docs/backlog.md` | Updated Last Session | Task completion |
| `src/design-system/mantine/theme.ts` | **NO CHANGE** — already matched §6 exactly | N/A |
