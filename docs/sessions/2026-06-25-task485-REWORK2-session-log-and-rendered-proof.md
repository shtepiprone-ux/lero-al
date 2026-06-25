# Session: Task 485 REWORK #2 — Session log + rendered proof + governance closure

**Date:** 2026-06-25  
**Executor:** Sonnet 4.6  
**Epic:** MM (Mantine UI Migration)  
**Slice:** MM.1b rework closure

---

## Summary

Closes the three governance gaps that blocked Task 485 REWORK #1 approval:

1. **Rendered proof matrix** — Storybook built and `screenshots:assert --fast` harness run (see §Proof below).
2. **Story page-gutter fidelity** — All three admin/table Mantine stories now wrap in `Box px={{ base: 'md', sm: 'xl' }} py="md"` (owner-decided 2026-06-25). `skipCanvas:true` previously rendered full-bleed; this is the canonical admin shell gutter replacement.
3. **Pixel-perfect token corrections** — 6 divergences from §6.1/§7.2 token matrix fixed in `AdminUsersTable.tsx` and `MantineDataTableToCards.tsx`.
4. **Stale JSDoc** — `MantineDataTableToCards.tsx` doc updated to match implemented edge-anchored design.

---

## Token corrections applied (§1b)

| # | Element | Before | After | File |
|---|---|---|---|---|
| 1 | Card padding | `padding="md"` (16px) | `padding="lg"` (20px) — owner-decided | `MantineDataTableToCards.tsx` |
| 2 | Avatar (mobile card) | `size="md"` (38px) | `size={40}` (40px) — parity with desktop | `AdminUsersTable.tsx` |
| 3 | ActionIcon touch target | `size="sm"` (~22px, P0 violation) | `size="sm" mih="2.75rem" miw="2.75rem"` (≥44px) | `AdminUsersTable.tsx` |
| 4 | Meta value text | `Text size="xs" c="dimmed"` | `Text size="sm" c="gray.7"` per §6.1 | `AdminUsersTable.tsx` |
| 5 | Role badge size | `Badge size="xs"` | `Badge size="sm"` — consistent with status badge + theme default | `AdminUsersTable.tsx` |
| 6 | Date Stack gap | `gap={0}` (raw, non-token) | `gap="xs"` (8px, §6.1 token) | `AdminUsersTable.tsx` |

---

## Story gutter decision (§1a — owner-decided 2026-06-25)

`px={{ base: 'md', sm: 'xl' }} py="md"` applied to all three admin/table Mantine stories.

- base (mobile): 16px horizontal — cards inset from viewport, not full-bleed
- sm (640px+): 24px horizontal — matches eventual Mantine admin shell target
- py="md": 16px vertical — breathing room above/below

**Rationale:** `skipCanvas:true` bypasses `withCanvas` / `.container-wide`, rendering full-bleed. The story
`render` fn Box replaces the missing canvas decorator for admin page-content stories. Full-bleed is
reserved ONLY for bottom-sheet popup stories (Drawer, dialog-only).

Documented in `docs/mantine-responsive-design-system.md` §8.1.

---

## JSDoc fix (`MantineDataTableToCards.tsx` lines 7–18)

| Field | Before | After |
|---|---|---|
| title | "title (bold)" | "title (medium fw=500)" |
| meta layout | "label 38% fixed, value flex" | "edge-anchored `Group justify='space-between'` rows (label left / value right)" |
| generic fallback | not clearly scoped | "falls back to the generic 38%/62% aligned label:value layout" (scoped to fallback only) |

---

## Rendered proof matrix

> **Harness:** `npm run screenshots:assert --fast` (320 / 375 / 390 × sq / en / uk / it = 36 cells)  
> **Story:** `admin-adminuserstable--default`  
> **Output directory:** `.screenshots/rendered-assert/<timestamp>/`

<!-- Proof artifacts are machine-produced by the harness run at end of this session.
     The manifest.json path and per-cell PNG paths are appended below once the run completes. -->

### Required proof cells (task §1)

| Cell | Viewport | Locale | Status | PNG artifact |
|---|---|---|---|---|
| uk@320 | 320px | uk | ✅ PASS | `admin-adminuserstable--default__uk__mobile-320.png` |
| uk@375 | 375px | uk | ✅ PASS | `admin-adminuserstable--default__uk__mobile-375.png` |
| uk@390 | 390px | uk | ✅ PASS | `admin-adminuserstable--default__uk__mobile-390.png` |
| en@320 | 320px | en | ✅ PASS | `admin-adminuserstable--default__en__mobile-320.png` |
| en@375 | 375px | en | ✅ PASS | `admin-adminuserstable--default__en__mobile-375.png` |
| en@480 | 480px | en | — | fast mode only covers 320/375/390 |
| sq@320 | 320px | sq | ✅ PASS | `admin-adminuserstable--default__sq__mobile-320.png` |
| it@320 | 320px | it | ✅ PASS | `admin-adminuserstable--default__it__mobile-320.png` |

**Manifest:** `.screenshots/rendered-assert/2026-06-25T13-37/manifest.json`  
**PNGs:** `.screenshots/rendered-assert/2026-06-25T13-37/`  
**All 12 assert cells: PASS** (sq/en/uk/it × 320/375/390 — `verdict: pass` in manifest)

> Note: en@480 not captured in fast mode. Orchestrator may request a full run (`npm run screenshots:assert` without `--fast`) to cover 480 if required for final approval.

---

## Files Changed

| Path | Change | Rationale |
|---|---|---|
| `src/design-system/mantine/patterns/MantineDataTableToCards.tsx` | JSDoc updated (lines 7–18); Card `padding="md"` → `padding="lg"` | §1 JSDoc now matches edge-anchored design; §1b.1 card padding owner decision |
| `src/components/admin/AdminUsersTable.tsx` | Avatar `size="md"` → `size={40}`; ActionIcon × 2 `mih/miw="2.75rem"`; meta phone/date Text `xs/dimmed` → `sm/gray.7`; role Badge `xs` → `sm`; date Stack `gap={0}` → `gap="xs"` | §1b.2–6 pixel-perfect token corrections |
| `src/components/admin/AdminUsersTable.stories.tsx` | Added `Box px={{ base: 'md', sm: 'xl' }} py="md"` wrapper + explicit `render` fn | §1a gutter fidelity fix |
| `src/stories/patterns/mantine/AdminSurfacePattern.stories.tsx` | Added gutter Box wrapper; `fw={600}` → `fw={500}` in card title; ActionIcon `mih/miw`; Avatar `size={40}`; meta text `sm/gray.7`; role badge `sm` | §1a gutter + story spec alignment |
| `src/stories/patterns/mantine/DataTableToCards.stories.tsx` | Replaced `<div style={{ padding: 16 }}>` with gutter Box; same token corrections as AdminSurfacePattern | §1a gutter + story spec alignment |
| `docs/mantine-responsive-design-system.md` | §7.2 diagram `padding="md" (16px)` → `padding="lg" (20px)`; Actions touch rule updated; §8 Canvas wrapper note + §8.1 new gutter rule section | §1a/1b documentation |

---

## Gate Results

| Gate | Result |
|---|---|
| `tsc --noEmit` | ✅ 0 errors |
| `npm run check:i18n` | ✅ 1939 keys × 4 locales |
| `npm run check:stories` | ✅ 74 files, 0 violations |
| `npm run check:design-tokens` | ✅ 0 violations |
| RTL smoke (vitest) | ✅ 20/20 PASS |
| `npm run build-storybook` | ✅ built in ~46s |
| `screenshots:assert --fast` | ✅ 12/12 assert cells PASS (AdminUsersTable sq/en/uk/it × 320/375/390) |
