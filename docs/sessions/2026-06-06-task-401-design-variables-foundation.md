# Session Log — Task 401: Design Variables Foundation

**Date:** 2026-06-06  
**Task:** 401 — Design Variables foundation (complete `@theme` token layer + registry doc)  
**Epic:** JJ — Design Variables (single-source tokens), Phase 1  
**Executor:** Sonnet 4.6

---

## Required Greps / Audit Outputs

### Hex / rgb / hsl literals in src/
```
src/modules/notifications/lib/sendTemplatedEmail.ts:26:const BRAND_ACCENT = '#EC5447'
src/modules/auth/components/AuthSheet.tsx:167-170: (Google SVG inline path fills #4285F4/#34A853/#FBBC05/#EA4335)
src/modules/notifications/lib/emails/VerifyEmail.tsx: inline email style objects (#18181b, #52525b, etc.)
src/modules/notifications/lib/emails/ReporterNotificationEmail.tsx: inline email styles
src/app/globals.css: brand/neutral color comments (comment annotations, not usage)
```
Summary: hex literals exist in email templates (HTML email layout, exempt) and SVG inline paths (Google icon, exempt). No raw hex in TSX UI components.

### Raw px/rem in className or style (informational — future refactor surface)
```
Notable: min-h-[44px], max-h-[90vh] (both canonical/allowlisted)
h-[340px]/h-[420px]/h-[500px] (gallery heights, allowlisted)
w-[272px] (DatePicker calendar, acceptable fixed-width)
max-w-[120px]/max-w-[220px] (header/footer, MEDIUM governance items)
text-[10px] (canonical micro-label)
```
None of these are blocking for Task 401 (tokens-only task). They form the future refactor surface for Tasks 403–406.

### Z-index usage in src/
Confirmed canonical scale in use:
- `z-10` — within-card abs. positioning (avatar badges, count badges, sticky select arrows)
- `z-30` — site header, bottom nav, admin mobile header, sticky admin header
- `z-40` — sheet/dialog backdrop, ListingContact mobile CTA
- `z-50` — all floating overlays (dropdowns, dialogs, combobox, popovers)
- `z-[100]` — ListingGallery lightbox
- `z-[9999]` — PerfDevOverlay (dev-only), Combobox mobile bottom sheet (both allowlisted)

This reconciles exactly with ui-rules.md §16 (Chrome=z-30 / Scrim=z-40 / Floating=z-50).

---

## Positive Flow (happy path) — Implemented

1. **Grepped src/** to inventory style values (see above). Token scales mirror actual usage.
2. **Added token groups to `src/app/globals.css`** inside `@theme inline`:
   - Group 1: Spacing (--space-0…24 + fractional + --spacing-N wiring)
   - Group 2: Typography (--text-* + --text-*--line-height, --font-weight-*, --tracking-*)
   - Group 3: Shadows (--shadow-xs…xl)
   - Group 4: Z-index (--z-{base,dropdown,sticky,overlay,modal,popover,toast})
   - Group 5: Motion (--duration-{fast,base,slow}, --ease-{standard,in,out})
   - Group 6: Breakpoints reference (--bp-{sm,md,lg,xl,2xl})
   - Group 7: Sizing (--control-h-{sm,md,lg}, --icon-{sm,md,lg}, --container-max)
3. **Read back globals.css** — complete, 716 lines, well-formed.
4. **Added `docs/design-system.md §22`** — Design Variables canonical token registry (note: kickoff referenced §20 but that section is occupied by "Definition of PASS"; §22 is the correct next available number).
5. **`npm run build`** → PASS (no errors, all routes generated).
6. **`npx tsc --noEmit`** → 0 errors.

## Negative Flow — Handled / Proven

- **Missing source value:** No values were invented. All values derived from: Tailwind v4 defaults (spacing, typography, shadows, easing), ui-rules.md §16 (z-index), actual code usage (durations: 100/200/300ms from dialog.tsx/AppImage/ListingCard), design-system.md §4 (container-max), §12a (control heights), ui-rules.md §5 (icon sizes), §3 (breakpoints). No STOP & ASK situations arose.
- **Accidental parallel source:** `--spacing-N: var(--space-N)` wiring ensures spacing utilities resolve through tokens, not the computed Tailwind formula fallback. Values are identical → visually inert.
- **Visual drift guard:** No components consume the new tokens (visually inert by design). The `tsc=0` + `npm run build` PASS confirms the CSS is well-formed and no layout breakage. Before/after renders identical — no new tokens are consumed by any component yet. Mobile gate: N/A (no UI surfaces changed; see note below).
- **Existing token altered:** Diff shows ADDITIONS ONLY to the `@theme inline` block. No existing `--color-*`, `--brand-*`, `--radius-*`, `--font-*` token was touched.
- **File integrity:** Both touched files pass (see integrity transcript below).

---

## Pre-Completion Integrity Transcript

```
globals.css:
  NUL bytes: 0    ✓
  BOM: False      ✓
  Size: 32621 bytes
  Last line: '}'  ✓ (reactEasyCrop_CropAreaGrid::after closing brace)
  tsc: 0 errors   ✓

design-system.md:
  NUL bytes: 0    ✓
  BOM: False      ✓
  Size: 53089 bytes
  Last line: table row (--container-max registry entry)  ✓
  699 lines total  ✓

npm run build: PASS ✓
npx tsc --noEmit: 0 errors ✓
```

---

## Mobile <640px Full-Width Gate

**N/A for this task.** Task 401 adds NO UI surfaces and changes NO component. All new tokens are CSS custom properties / `@theme` variables only. The mobile full-width gate fully re-applies to the refactor tasks 403–406 that consume these tokens.

---

## AC-by-AC Self-Audit Table

| Acceptance Criterion | Status | Evidence |
|---|---|---|
| Spacing group exists in globals.css `@theme inline` | ✅ PASS | Lines 109–148: --space-0…24 + fractional + --spacing-N wiring |
| Typography group exists | ✅ PASS | Lines 154–180: --text-xs…5xl + line-heights, font-weight, tracking |
| Shadow group exists | ✅ PASS | Lines 185–189: --shadow-xs…xl |
| Z-index group exists (reconciles ui-rules §16) | ✅ PASS | Lines 196–202: --z-base/dropdown/sticky/overlay/modal/popover/toast |
| Motion group exists | ✅ PASS | Lines 207–215: --duration-fast/base/slow, --ease-standard/in/out |
| Breakpoints group exists | ✅ PASS | Lines 221–225: --bp-sm/md/lg/xl/2xl |
| Sizing group exists | ✅ PASS | Lines 230–238: --control-h-*, --icon-*, --container-max |
| No existing token value or name changed | ✅ PASS | Diff shows additions only inside `@theme inline` after line 92 |
| design-system.md §22 registry tables present | ✅ PASS | Added as §22 (note: §20 was occupied; §22 is correct placement) |
| Single-source-of-truth note in §22 | ✅ PASS | Top of §22 includes the canonical statement |
| Visually inert (all values mirror Tailwind defaults / current usage) | ✅ PASS | Values derived from Tailwind v4 defaults + actual code audit |
| npm run build passes | ✅ PASS | Build completes without errors |
| tsc = 0 errors | ✅ PASS | npx tsc --noEmit: no output |
| File integrity transcript green | ✅ PASS | 0 NUL, no BOM, not truncated (see above) |
| No git add/commit from executor | ✅ PASS | Orchestrator emits commit commands on review |
| Positive flow implemented | ✅ PASS | All 6 steps completed |
| Negative flow proven | ✅ PASS | No invented values; no parallel definitions; no existing tokens altered |

**Self-validation: COMPLETE. All ACs met. Task 401 ready for orchestrator review.**

---

## Files Changed

| File | Change | Rationale |
|---|---|---|
| `src/app/globals.css` | Added ~145 lines inside `@theme inline` block | Token foundation: 7 groups (spacing/typography/shadow/z-index/motion/breakpoints/sizing) |
| `docs/design-system.md` | Added §22 (155 lines) at end of file | Canonical token registry tables per kickoff requirement |
| `docs/backlog.md` | Updated Last Session + Task numbering | Governance: backlog currency rule |
| `docs/sessions/2026-06-06-task-401-design-variables-foundation.md` | NEW (this file) | Governance: session log rule (clause 10) |
